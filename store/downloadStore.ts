import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
export type ContentType = 'video' | 'audio' | 'image' | 'apk' | 'file';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  contentType: ContentType;
  format?: string;
  quality?: string;
  fileSize?: number;
  downloadedBytes: number;
  progress: number; // 0–1
  speed?: number; // bytes/s
  eta?: number; // seconds
  status: DownloadStatus;
  localPath?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface MediaInfo {
  url: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  contentType: ContentType;
  formats: MediaFormat[];
  sourceDomain?: string;
}

export interface MediaFormat {
  id: string;
  quality: string;
  ext: string;
  filesize?: number;
  label: string;
}

export interface PremiumState {
  isPremium: boolean;
  downloadsToday: number;
  lastResetDate: string; // 'YYYY-MM-DD'
  dailyLimit: number;
}

interface DownloadStore {
  // Queue
  queue: DownloadItem[];
  history: DownloadItem[];

  // Media preview
  mediaPreview: MediaInfo | null;
  isAnalyzing: boolean;
  analyzeError: string | null;

  // Premium
  premium: PremiumState;

  // Actions — queue
  addToQueue: (item: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeFromQueue: (id: string) => void;
  cancelDownload: (id: string) => void;
  clearCompleted: () => void;

  // Actions — preview
  setMediaPreview: (info: MediaInfo | null) => void;
  setAnalyzing: (loading: boolean) => void;
  setAnalyzeError: (err: string | null) => void;

  // Actions — premium
  setPremium: (val: boolean) => void;
  incrementDownloadsToday: () => void;
  resetDailyCountIfNeeded: () => void;
  canDownload: () => boolean;
  remainingDownloads: () => number;
}

const TODAY = () => new Date().toISOString().split('T')[0];

const DEFAULT_PREMIUM: PremiumState = {
  isPremium: false,
  downloadsToday: 0,
  lastResetDate: TODAY(),
  dailyLimit: 10,
};

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  queue: [],
  history: [],
  mediaPreview: null,
  isAnalyzing: false,
  analyzeError: null,
  premium: DEFAULT_PREMIUM,

  addToQueue: (item) =>
    set((s) => ({ queue: [...s.queue, item] })),

  updateDownload: (id, updates) =>
    set((s) => ({
      queue: s.queue.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  removeFromQueue: (id) =>
    set((s) => {
      const item = s.queue.find((d) => d.id === id);
      const newHistory =
        item && (item.status === 'completed' || item.status === 'error' || item.status === 'cancelled')
          ? [...s.history, item]
          : s.history;
      return {
        queue: s.queue.filter((d) => d.id !== id),
        history: newHistory,
      };
    }),

  cancelDownload: (id) =>
    set((s) => ({
      queue: s.queue.map((d) =>
        d.id === id ? { ...d, status: 'cancelled' as DownloadStatus } : d
      ),
    })),

  clearCompleted: () =>
    set((s) => ({
      queue: s.queue.filter(
        (d) => d.status !== 'completed' && d.status !== 'error' && d.status !== 'cancelled'
      ),
    })),

  setMediaPreview: (info) => set({ mediaPreview: info }),
  setAnalyzing: (loading) => set({ isAnalyzing: loading }),
  setAnalyzeError: (err) => set({ analyzeError: err }),

  setPremium: (val) =>
    set((s) => ({ premium: { ...s.premium, isPremium: val } })),

  incrementDownloadsToday: () => {
    const { premium } = get();
    const updated = { ...premium, downloadsToday: premium.downloadsToday + 1 };
    set({ premium: updated });
    AsyncStorage.setItem('premium_state', JSON.stringify(updated));
  },

  resetDailyCountIfNeeded: () => {
    const { premium } = get();
    const today = TODAY();
    if (premium.lastResetDate !== today) {
      const reset = { ...premium, downloadsToday: 0, lastResetDate: today };
      set({ premium: reset });
      AsyncStorage.setItem('premium_state', JSON.stringify(reset));
    }
  },

  canDownload: () => {
    const { premium } = get();
    return premium.isPremium || premium.downloadsToday < premium.dailyLimit;
  },

  remainingDownloads: () => {
    const { premium } = get();
    if (premium.isPremium) return Infinity;
    return Math.max(0, premium.dailyLimit - premium.downloadsToday);
  },
}));
