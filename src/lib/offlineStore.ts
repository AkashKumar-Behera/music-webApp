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
  async saveTrack(track: Track, audioBlob: Blob): Promise<void> {
    try {
      const db = await openDB();
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
