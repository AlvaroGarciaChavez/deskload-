import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useDownloadStore, DownloadItem, ContentType } from '../store/downloadStore';

// Backend URL — replace with your deployed Railway/Render URL
const BACKEND_URL = 'https://deskload-test.loca.lt';

// Directory inside app's document directory
const DOWNLOADS_DIR = FileSystem.documentDirectory + 'DeskLoad/';

// Active download tasks (for cancellation)
const activeTasks = new Map<string, FileSystem.DownloadResumable>();

export async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }
  } catch (e) {
    // Ignite existing directory error
  }
}

/** Detect content type from URL or extension */
export function detectContentType(url: string, ext?: string): ContentType {
  const lower = (ext || url).toLowerCase();
  if (/\.(mp4|mkv|mov|avi|webm|m4v|flv|3gp)/.test(lower)) return 'video';
  if (/\.(mp3|m4a|aac|ogg|wav|flac|opus)/.test(lower)) return 'audio';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic)/.test(lower)) return 'image';
  if (/\.apk/.test(lower)) return 'apk';
  return 'file';
}

/** Format bytes to human readable */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Format seconds to MM:SS */
export function formatEta(seconds: number): string {
  if (!seconds || seconds === Infinity) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Check if URL is a direct file (not a social media page) */
export function isDirectUrl(url: string): boolean {
  return /\.(mp4|mkv|mov|avi|webm|m4v|mp3|m4a|aac|ogg|wav|jpg|jpeg|png|gif|webp|apk|zip|pdf|dmg|exe)(\?.*)?$/i.test(url);
}

/** Analyze URL — calls backend for social media, or parses direct URLs */
export async function analyzeUrl(url: string) {
  const { setAnalyzing, setMediaPreview, setAnalyzeError } = useDownloadStore.getState();

  setAnalyzing(true);
  setAnalyzeError(null);
  setMediaPreview(null);

  try {
    if (isDirectUrl(url)) {
      // Direct file URL
      const ext = url.match(/\.([a-z0-9]+)(\?|$)/i)?.[1] || 'file';
      const contentType = detectContentType(url, ext);
      const filename = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'archivo') ;
      setMediaPreview({
        url,
        title: filename,
        contentType,
        formats: [
          {
            id: 'direct',
            quality: 'Original',
            ext,
            label: `${ext.toUpperCase()} · Enlace directo`,
          },
        ],
        sourceDomain: new URL(url).hostname,
      });
    } else {
      // Social media — call backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${BACKEND_URL}/extract`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      setMediaPreview(data);
    }
  } catch (err: any) {
    const msg =
      err.name === 'TimeoutError'
        ? 'El servidor tardó demasiado. Intenta de nuevo.'
        : err.message || 'No se pudo analizar el enlace';
    setAnalyzeError(msg);
  } finally {
    setAnalyzing(false);
  }
}

/** Start a download */
export async function startDownload(item: DownloadItem) {
  const store = useDownloadStore.getState();

  if (!store.canDownload()) {
    throw new Error('LIMIT_REACHED');
  }

  await ensureDir();

  const ext = item.format || 'mp4';
  const safeName = item.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]/g, '').trim().substring(0, 60);
  const filename = `${safeName}_${Date.now()}.${ext}`;
  const localPath = DOWNLOADS_DIR + filename;

  // Mark as downloading
  store.updateDownload(item.id, { status: 'downloading', localPath });
  store.incrementDownloadsToday();

  let lastBytes = 0;
  let lastTime = Date.now();

  try {
    const task = FileSystem.createDownloadResumable(
      item.url,
      localPath,
      {},
      (progress) => {
        const { totalBytesWritten, totalBytesExpectedToWrite } = progress;
        const pct = totalBytesExpectedToWrite > 0
          ? totalBytesWritten / totalBytesExpectedToWrite
          : 0;

        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        const speed = elapsed > 0 ? (totalBytesWritten - lastBytes) / elapsed : 0;
        lastBytes = totalBytesWritten;
        lastTime = now;
        const remaining = speed > 0 ? (totalBytesExpectedToWrite - totalBytesWritten) / speed : undefined;

        store.updateDownload(item.id, {
          progress: pct,
          downloadedBytes: totalBytesWritten,
          fileSize: totalBytesExpectedToWrite,
          speed,
          eta: remaining,
          status: 'downloading',
        });
      }
    );

    activeTasks.set(item.id, task);
    const result = await task.downloadAsync();

    if (!result?.uri) throw new Error('Descarga fallida');

    // Save to media library if video/audio/image
    if (['video', 'audio', 'image'].includes(item.contentType)) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        await MediaLibrary.createAlbumAsync('DeskLoad', asset, false);
      }
    }

    store.updateDownload(item.id, {
      status: 'completed',
      progress: 1,
      localPath: result.uri,
      completedAt: Date.now(),
    });

    // Show notification (disabled for Expo Go)
    /* await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Descarga completada',
        body: item.title,
        data: { id: item.id },
      },
      trigger: null,
    }); */

    activeTasks.delete(item.id);
  } catch (err: any) {
    if (err.message !== 'cancelled') {
      store.updateDownload(item.id, {
        status: 'error',
        error: err.message || 'Error desconocido',
      });
      /* await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Error en descarga',
          body: item.title,
        },
        trigger: null,
      }); */
    }
    activeTasks.delete(item.id);
  }
}

/** Cancel a download */
export async function cancelDownload(id: string) {
  const task = activeTasks.get(id);
  if (task) {
    await task.cancelAsync();
    activeTasks.delete(id);
  }
  useDownloadStore.getState().cancelDownload(id);
}

/** Get all downloaded files */
export async function getDownloadedFiles() {
  await ensureDir();
  const files = await FileSystem.readDirectoryAsync(DOWNLOADS_DIR);
  const details = await Promise.all(
    files.map(async (f) => {
      const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR + f, { size: true });
      return { name: f, path: DOWNLOADS_DIR + f, size: (info as any).size || 0 };
    })
  );
  return details;
}

/** Delete a downloaded file */
export async function deleteFile(path: string) {
  await FileSystem.deleteAsync(path, { idempotent: true });
}

/** Setup notification permissions */
export async function setupNotifications() {
  try {
    // await Notifications.requestPermissionsAsync();
    /* Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    }); */
  } catch (e) {}
}
