/**
 * Project Kuma — IndexedDB Core Database Layer (src/offline/db.ts)
 * 
 * Provides isolated IndexedDB stores for:
 *   - courseCache: Course structure & module metadata
 *   - resourceCache: Blobs for offline learning resources with LRU eviction
 *   - outbox: Idempotent queued write operations
 *   - notesCache: Module notes with timestamp for last-write-wins
 *   - practiceResults: Module practice exercise records
 */

export const DB_NAME = 'kuma_offline_learning_v1';
export const DB_VERSION = 1;

export const STORES = {
  COURSE_CACHE: 'courseCache',
  RESOURCE_CACHE: 'resourceCache',
  OUTBOX: 'outbox',
  NOTES_CACHE: 'notesCache',
  PRACTICE_RESULTS: 'practiceResults'
} as const;

/** 100 MB max offline resource storage limit */
export const MAX_RESOURCE_STORAGE_BYTES = 100 * 1024 * 1024;

export interface CachedCourse {
  courseId: string;
  course: any;
  modules: any[];
  updatedAt: number;
}

export interface CachedResource {
  resourceId: string;
  courseId: string;
  moduleId: string;
  name: string;
  blob: Blob;
  contentType: string;
  size: number;
  lastAccessedAt: number;
}

export interface OutboxOperation {
  clientOpId: string;
  userId: string;
  opType: 'module_progress' | 'save_note' | 'practice_result' | 'trainer_select' | 'profile_update';
  payload: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  error?: string;
}

export interface CachedNote {
  id: string; // ${courseId}_${moduleId}
  courseId: string;
  moduleId: string;
  userId: string;
  content: string;
  updatedAt: number;
}

export interface CachedPracticeResult {
  id: string; // ${userId}_${courseId}_${moduleId}_${timestamp}
  userId: string;
  courseId: string;
  moduleId: string;
  score: number;
  total: number;
  timestamp: number;
}

function getIndexedDB(): IDBFactory | null {
  if (typeof indexedDB !== 'undefined' && indexedDB) {
    return indexedDB;
  }
  return null;
}

/**
 * Opens or upgrades the IndexedDB database.
 */
export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.COURSE_CACHE)) {
        db.createObjectStore(STORES.COURSE_CACHE, { keyPath: 'courseId' });
      }

      if (!db.objectStoreNames.contains(STORES.RESOURCE_CACHE)) {
        const store = db.createObjectStore(STORES.RESOURCE_CACHE, { keyPath: 'resourceId' });
        store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
        store.createIndex('courseId', 'courseId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
        const store = db.createObjectStore(STORES.OUTBOX, { keyPath: 'clientOpId' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.NOTES_CACHE)) {
        const store = db.createObjectStore(STORES.NOTES_CACHE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PRACTICE_RESULTS)) {
        const store = db.createObjectStore(STORES.PRACTICE_RESULTS, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Calculates current total size (in bytes) of cached offline resources.
 */
export async function getOfflineResourceStorageUsage(): Promise<number> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.RESOURCE_CACHE, 'readonly');
      const store = tx.objectStore(STORES.RESOURCE_CACHE);
      const req = store.getAll();

      req.onsuccess = () => {
        db.close();
        const items: CachedResource[] = req.result || [];
        const totalBytes = items.reduce((acc, item) => acc + (item.size || item.blob?.size || 0), 0);
        resolve(totalBytes);
      };
      req.onerror = () => {
        db.close();
        resolve(0);
      };
    });
  } catch {
    return 0;
  }
}

/**
 * Evicts oldest cached resources using LRU strategy until enough room is created.
 */
export async function evictLruResourcesIfNeeded(bytesToStore: number): Promise<void> {
  try {
    const db = await openOfflineDb();
    const currentUsage = await getOfflineResourceStorageUsage();

    if (currentUsage + bytesToStore <= MAX_RESOURCE_STORAGE_BYTES) {
      return;
    }

    const tx = db.transaction(STORES.RESOURCE_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.RESOURCE_CACHE);
    const index = store.index('lastAccessedAt');
    const req = index.getAll();

    req.onsuccess = () => {
      const items: CachedResource[] = req.result || [];
      // Sort ascending by lastAccessedAt (oldest first)
      items.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

      let freedBytes = 0;
      const targetToFree = (currentUsage + bytesToStore) - MAX_RESOURCE_STORAGE_BYTES;

      for (const item of items) {
        if (freedBytes >= targetToFree) break;
        store.delete(item.resourceId);
        freedBytes += (item.size || item.blob?.size || 0);
      }
    };

    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  } catch (err) {
    console.warn('[OfflineDB] LRU eviction warning:', err);
  }
}

/**
 * Clears all IndexedDB stores on logout to prevent cross-account residue.
 */
export async function clearOfflineStores(): Promise<void> {
  try {
    const db = await openOfflineDb();
    const storeNames = [
      STORES.COURSE_CACHE,
      STORES.RESOURCE_CACHE,
      STORES.OUTBOX,
      STORES.NOTES_CACHE,
      STORES.PRACTICE_RESULTS
    ];

    const tx = db.transaction(storeNames, 'readwrite');
    storeNames.forEach(name => {
      tx.objectStore(name).clear();
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        console.log('[OfflineDB] Successfully cleared all offline stores for logout.');
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to clear offline stores on logout:', err);
  }
}
