/**
 * Smart Client-Side & In-Memory Cache with TTL
 */

const memoryCache = new Map<string, { data: any; expiry: number }>();

export const CacheService = {
  get<T = any>(key: string): T | null {
    const now = Date.now();

    // 1. Check memory cache
    const memItem = memoryCache.get(key);
    if (memItem) {
      if (memItem.expiry > now) {
        return memItem.data as T;
      }
      memoryCache.delete(key);
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const itemStr = localStorage.getItem(`cb_cache_${key}`);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        if (item.expiry > now) {
          // Re-populate memory cache
          memoryCache.set(key, item);
          return item.data as T;
        }
        localStorage.removeItem(`cb_cache_${key}`);
      } catch {
        return null;
      }
    }

    return null;
  },

  set(key: string, data: any, ttlMinutes: number = 60): void {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    const cacheObject = { data, expiry };

    // In-memory
    memoryCache.set(key, cacheObject);

    // LocalStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cb_cache_${key}`, JSON.stringify(cacheObject));
      } catch (e) {
        // LocalStorage quota might be full, clear older items
        this.prune();
      }
    }
  },

  clearAll(): void {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('cb_cache_') || k.startsWith('cb_boli_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  },

  getCacheSize(): { count: number; estimatedSizeKb: number } {
    let count = 0;
    let totalChars = 0;

    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('cb_cache_') || k.startsWith('cb_boli_'))) {
          count++;
          const val = localStorage.getItem(k) || '';
          totalChars += k.length + val.length;
        }
      }
    }

    return {
      count,
      estimatedSizeKb: Math.round((totalChars * 2) / 1024),
    };
  },

  prune(): void {
    if (typeof window !== 'undefined') {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cb_cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(k) || '{}');
            if (!item.expiry || item.expiry < now) {
              localStorage.removeItem(k);
            }
          } catch {
            localStorage.removeItem(k);
          }
        }
      }
    }
  },
};
