/**
 * IndexedDB Offline Audio & Metadata Store for CloudBeatz PWA
 */
import { Track } from './types';

const DB_NAME = 'CloudBeatzOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_tracks';

export interface OfflineTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  sizeBytes: number;
  cachedAt: number;
}

export type CacheLimitOption = '30' | '50' | '100' | 'unlimited';

const CACHE_LIMIT_KEY = 'cloudbeatz_cache_limit';

export const getStoredCacheLimit = (): CacheLimitOption => {
  if (typeof window === 'undefined') return '50';
  return (localStorage.getItem(CACHE_LIMIT_KEY) as CacheLimitOption) || '50';
};

export const setStoredCacheLimit = (limit: CacheLimitOption): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_LIMIT_KEY, limit);
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window undefined'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const OfflineStore = {
  getLimit: getStoredCacheLimit,
  setLimit: setStoredCacheLimit,

  async saveTrack(track: Track, audioBlob: Blob): Promise<void> {
    try {
      const db = await openDB();

      // Check cache limit and prune oldest if limit reached
      const limit = getStoredCacheLimit();
      if (limit !== 'unlimited') {
        const maxTracks = parseInt(limit, 10) || 50;
        const all = await this.getAllRecords();
        if (all.length >= maxTracks) {
          // Sort oldest first
          all.sort((a, b) => a.cachedAt - b.cachedAt);
          // Delete oldest to make room
          const toDelete = all.slice(0, all.length - maxTracks + 1);
          for (const item of toDelete) {
            await this.deleteTrack(item.id);
          }
        }
      }

      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: OfflineTrackRecord = {
        id: track.id,
        track,
        audioBlob,
        sizeBytes: audioBlob.size,
        cachedAt: Date.now(),
      };

      store.put(record);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('OfflineStore save error:', e);
    }
  },

  async getAllRecords(): Promise<OfflineTrackRecord[]> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      return new Promise((resolve) => {
        req.onsuccess = () => resolve((req.result || []) as OfflineTrackRecord[]);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async getTrackBlob(id: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      return new Promise((resolve) => {
        req.onsuccess = () => {
          const res = req.result as OfflineTrackRecord | undefined;
          resolve(res ? res.audioBlob : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  async isCached(id: string): Promise<boolean> {
    try {
      const blob = await this.getTrackBlob(id);
      return !!blob && blob.size > 10000;
    } catch {
      return false;
    }
  },

  async getCachedAudioUrl(id: string): Promise<string | null> {
    try {
      const blob = await this.getTrackBlob(id);
      if (blob && blob.size > 10000) {
        return URL.createObjectURL(blob);
      }
      return null;
    } catch {
      return null;
    }
  },

  async cacheTrack(track: Track): Promise<boolean> {
    try {
      if (!track || !track.id) return false;
      const already = await this.isCached(track.id);
      if (already) return true;

      const streamUrl = `/api/stream?id=${track.id}&title=${encodeURIComponent(track.title || '')}&artist=${encodeURIComponent(track.artist || '')}`;
      const res = await fetch(streamUrl);
      if (!res.ok) return false;
      const blob = await res.blob();
      if (blob && blob.size > 10000) {
        await this.saveTrack(track, blob);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Auto-cache track error:', err);
      return false;
    }
  },

  async getAllTracks(): Promise<Track[]> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      return new Promise((resolve) => {
        req.onsuccess = () => {
          const records = (req.result || []) as OfflineTrackRecord[];
          resolve(records.sort((a, b) => b.cachedAt - a.cachedAt).map((r) => r.track));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async deleteTrack(id: string): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  },

  async clearAll(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  },

  async getStorageStats(): Promise<{ count: number; totalMb: number }> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      return new Promise((resolve) => {
        req.onsuccess = () => {
          const records = (req.result || []) as OfflineTrackRecord[];
          const totalBytes = records.reduce((sum, r) => sum + (r.sizeBytes || 0), 0);
          resolve({
            count: records.length,
            totalMb: Math.round((totalBytes / (1024 * 1024)) * 10) / 10,
          });
        };
        req.onerror = () => resolve({ count: 0, totalMb: 0 });
      });
    } catch {
      return { count: 0, totalMb: 0 };
    }
  },
};
