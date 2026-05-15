const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*', // In production, restrict to your app's domain
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// ── yt-dlp binary setup ────────────────────────────────────────────────────
const YT_DLP_PATH = path.join(__dirname, 'bin', 'yt-dlp');

async function ensureYtDlp() {
  const binDir = path.join(__dirname, 'bin');
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

  if (!fs.existsSync(YT_DLP_PATH) && !fs.existsSync(YT_DLP_PATH + '.exe')) {
    console.log('📥 Downloading yt-dlp binary...');
    await YTDlpWrap.downloadFromGithub(YT_DLP_PATH);
    console.log('✅ yt-dlp downloaded');
  }
}

const ytDlp = new YTDlpWrap(
  process.platform === 'win32' ? YT_DLP_PATH + '.exe' : YT_DLP_PATH
);

// ── Helper: Detect content type ────────────────────────────────────────────
function detectContentType(info) {
  const ext = (info.ext || '').toLowerCase();
  const vcodec = info.vcodec || '';
  const acodec = info.acodec || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (ext === 'apk') return 'apk';
  if (vcodec && vcodec !== 'none') return 'video';
  if (acodec && acodec !== 'none') return 'audio';
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'aac', 'ogg', 'wav'].includes(ext)) return 'audio';
  return 'file';
}

// ── Helper: Build formats list ─────────────────────────────────────────────
function buildFormats(info) {
  if (!info.formats || info.formats.length === 0) {
    // Single format
    return [{
      id: 'best',
      quality: info.height ? `${info.height}p` : 'Original',
      ext: info.ext || 'mp4',
      filesize: info.filesize || info.filesize_approx,
      label: `${(info.ext || 'mp4').toUpperCase()} · ${info.height ? info.height + 'p' : 'Mejor calidad'}`,
    }];
  }

  // Filter meaningful formats
  const seen = new Set();
  const formats = info.formats
    .filter(f => {
      if (!f.url) return false;
      if (f.protocol === 'mhtml') return false;
      const key = `${f.height || 0}_${f.ext}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(f => ({
      id: f.format_id,
      quality: f.height ? `${f.height}p` : (f.abr ? `${Math.round(f.abr)}kbps` : 'Auto'),
      ext: f.ext || 'mp4',
      filesize: f.filesize || f.filesize_approx,
      url: f.url,
      label: f.height
        ? `${f.ext.toUpperCase()} · ${f.height}p${f.fps ? ` ${f.fps}fps` : ''}`
        : f.abr
          ? `${f.ext.toUpperCase()} · ${Math.round(f.abr)}kbps`
          : `${f.ext.toUpperCase()}`,
    }))
    .sort((a, b) => {
      // Sort by quality descending
      const qA = parseInt(a.quality) || 0;
      const qB = parseInt(b.quality) || 0;
      return qB - qA;
    })
    .slice(0, 8); // Max 8 formats

  // Prepend "Best" option
  return [
    {
      id: 'bestvideo+bestaudio/best',
      quality: 'Mejor',
      ext: 'mp4',
      label: '⭐ Mejor calidad (auto)',
    },
    ...formats,
  ];
}

// ── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Extract media info from URL
app.post('/extract', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: true, message: 'URL requerida' });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: true, message: 'URL inválida' });
  }

  console.log(`[extract] URL: ${url}`);

  try {
    // Get media info from yt-dlp
    const info = await ytDlp.getVideoInfo(url);

    if (!info) {
      return res.status(422).json({ error: true, message: 'No se encontró contenido descargable en ese enlace' });
    }

    const contentType = detectContentType(info);
    const formats = buildFormats(info);

    const response = {
      url: info.url || info.webpage_url || url, // Direct URL for "best" format
      title: info.title || info.webpage_url_basename || 'Descarga',
      thumbnail: info.thumbnail,
      duration: info.duration,
      contentType,
      formats,
      sourceDomain: new URL(url).hostname.replace('www.', ''),
      extractor: info.extractor_key,
      uploader: info.uploader || info.channel,
    };

    res.json(response);
  } catch (err) {
    console.error('[extract] Error:', err.message);

    let message = 'No se pudo obtener información del enlace';

    if (err.message?.includes('Unsupported URL')) {
      message = 'Este sitio web no está soportado. Solo puedes pegar URLs directas de archivos.';
    } else if (err.message?.includes('Private video') || err.message?.includes('private')) {
      message = 'El contenido es privado o requiere inicio de sesión';
    } else if (err.message?.includes('copyright') || err.message?.includes('removed')) {
      message = 'El contenido fue eliminado o no está disponible';
    } else if (err.message?.includes('age')) {
      message = 'El contenido tiene restricción de edad';
    }

    res.status(422).json({ error: true, message });
  }
});

// ── Start server ───────────────────────────────────────────────────────────
async function main() {
  try {
    await ensureYtDlp();
    app.listen(PORT, () => {
      console.log(`🚀 DeskLoad Backend running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

main();
