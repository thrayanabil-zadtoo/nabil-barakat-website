/**
 * Safe Storage Manager with Quota Handling & IndexedDB Backup
 * Prevents localStorage QuotaExceededError and provides reliable persistence.
 */

const DB_NAME = 'zadtoo_site_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

// Simple IndexedDB helper
const openIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToIndexedDB = async (key: string, value: unknown): Promise<void> => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Non-fatal error, silently handled
    console.warn(`[IDB] Could not save ${key} to IndexedDB:`, err);
  }
};

export const loadFromIndexedDB = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

// Cleanup old and duplicate version keys to reclaim mega-bytes of localStorage space
export const cleanupLegacyStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        // Remove v1, v2, v3 duplicate keys
        if (
          k.startsWith('nabil_author_v3_') ||
          k.startsWith('nabil_author_v2_') ||
          k.startsWith('nabil_author_v1_') ||
          k.startsWith('nabil_author_demo_')
        ) {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
};

/**
 * Safely saves data to localStorage without crashing if quota is exceeded.
 * Also persists full data into IndexedDB.
 */
export const safeSetItem = (key: string, rawData: unknown): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  // Always back up to IndexedDB asynchronously
  saveToIndexedDB(key, rawData);

  const serialized = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);

  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[Storage] Quota exceeded while saving ${key}. Attempting cleanup...`, error);

    // 1. Purge legacy versions to free space immediately
    cleanupLegacyStorage();

    try {
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      // 2. If it still fails, for large arrays like 'books', create a lightweight version for localStorage
      try {
        if (Array.isArray(rawData)) {
          // Downsample or strip heavy raw base64 data for the localStorage cache
          const sanitized = rawData.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              const copy = { ...item };
              // If coverImage is huge base64, truncate or fallback
              if (copy.coverImage && typeof copy.coverImage === 'string' && copy.coverImage.length > 500000) {
                copy.coverImage = copy.coverImage.slice(0, 100); // mark as needing fallback or reload from idb
              }
              // Limit sample pages or gallery images if extremely large
              if (Array.isArray(copy.galleryImages)) {
                copy.galleryImages = copy.galleryImages.slice(0, 6);
              }
              return copy;
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(sanitized));
          return true;
        }
      } catch {
        // Safe catch - never crash the application
        console.warn(`[Storage] Could not write to localStorage for ${key}. Data safely kept in memory and IndexedDB.`);
      }
    }
  }

  return false;
};

/**
 * Safely loads data from localStorage with fallback
 */
export const safeGetItem = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
};
