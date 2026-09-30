/**
 * Project Kuma — Offline Learning Actions Interface (src/offline/actions.ts)
 * 
 * Provides isolated offline learning functions:
 *   - Offline course structure viewing
 *   - Resource download for offline learning with LRU storage management
 *   - Optimistic module progress tracking
 *   - Private module notes autosave
 *   - Offline practice exercise submissions
 *   - Explicit online guards for assessments, enrollment, and certificates
 */

import { openOfflineDb, STORES, CachedCourse, CachedResource, CachedNote, CachedPracticeResult, evictLruResourcesIfNeeded, getOfflineResourceStorageUsage, MAX_RESOURCE_STORAGE_BYTES } from './db';
import { queueOfflineOp } from './outbox';
import { flushOutbox } from './syncEngine';

// ==========================================
// EXPLICIT ONLINE GUARDS
// ==========================================

export type RestlictedAction = 'assessment' | 'enrollment' | 'certificate';

export interface ActionGuardResult {
  allowed: boolean;
  message?: string;
}

/**
 * Validates that actions requiring live server verification are allowed.
 */
export function checkActionOnlineGuard(action: RestlictedAction): ActionGuardResult {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline) {
    return { allowed: true };
  }

  switch (action) {
    case 'assessment':
      return {
        allowed: false,
        message: 'Assessments require an active internet connection to start and submit for security verification.'
      };
    case 'enrollment':
      return {
        allowed: false,
        message: 'Course enrollment requires an active internet connection to register your organizational profile.'
      };
    case 'certificate':
      return {
        allowed: false,
        message: 'Certificate verification and official cryptographic issuance require an active internet connection.'
      };
    default:
      return { allowed: false, message: 'This feature requires an active internet connection.' };
  }
}

// ==========================================
// COURSE STRUCTURE CACHING & OFFLINE VIEWING
// ==========================================

export async function cacheCourseForOffline(courseId: string, course: any, modules: any[]): Promise<void> {
  try {
    const db = await openOfflineDb();
    const cached: CachedCourse = {
      courseId,
      course,
      modules,
      updatedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.COURSE_CACHE, 'readwrite');
      tx.objectStore(STORES.COURSE_CACHE).put(cached);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[OfflineActions] Failed to cache course structure:', err);
  }
}

export async function getOfflineCourse(courseId: string): Promise<CachedCourse | null> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.COURSE_CACHE, 'readonly');
      const req = tx.objectStore(STORES.COURSE_CACHE).get(courseId);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

// ==========================================
// RESOURCE DOWNLOAD & LRU STORAGE MANAGEMENT
// ==========================================

export async function downloadResourceForOffline(
  courseId: string,
  moduleId: string,
  resourceId: string,
  name: string,
  resourceBlobOrUrl: Blob | string
): Promise<{ success: boolean; resourceId: string; size: number; message?: string }> {
  try {
    let blob: Blob;
    let contentType = 'application/octet-stream';

    if (typeof resourceBlobOrUrl === 'string') {
      const res = await fetch(resourceBlobOrUrl);
      if (!res.ok) throw new Error(`HTTP fetch failed with status ${res.status}`);
      blob = await res.blob();
      contentType = res.headers.get('content-type') || contentType;
    } else {
      blob = resourceBlobOrUrl;
      contentType = blob.type || contentType;
    }

    const size = blob.size;

    // Check LRU cap and evict if necessary
    await evictLruResourcesIfNeeded(size);

    const db = await openOfflineDb();
    const cachedRes: CachedResource = {
      resourceId,
      courseId,
      moduleId,
      name,
      blob,
      contentType,
      size,
      lastAccessedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RESOURCE_CACHE, 'readwrite');
      tx.objectStore(STORES.RESOURCE_CACHE).put(cachedRes);
      tx.oncomplete = () => {
        db.close();
        resolve({ success: true, resourceId, size });
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err: any) {
    console.warn('[OfflineActions] Failed to download resource for offline:', err);
    return { success: false, resourceId, size: 0, message: err.message || 'Download failed' };
  }
}

export async function getOfflineResourceBlob(resourceId: string): Promise<Blob | null> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RESOURCE_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.RESOURCE_CACHE);
      const req = store.get(resourceId);

      req.onsuccess = () => {
        const res = req.result as CachedResource | undefined;
        if (res) {
          // Touch lastAccessedAt for LRU
          store.put({ ...res, lastAccessedAt: Date.now() });
          db.close();
          resolve(res.blob);
        } else {
          db.close();
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function removeOfflineResource(resourceId: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.RESOURCE_CACHE, 'readwrite');
      tx.objectStore(STORES.RESOURCE_CACHE).delete(resourceId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[OfflineActions] Delete resource error:', err);
  }
}

// ==========================================
// OPTIMISTIC MODULE PROGRESS & OUTBOX QUEUEING
// ==========================================

export async function saveModuleProgressAction(
  userId: string,
  courseId: string,
  moduleId: string,
  completed: boolean,
  completionRate: number,
  completedModuleIds: string[]
): Promise<{ clientOpId: string; synced: boolean }> {
  const clientOpId = await queueOfflineOp(userId, 'module_progress', {
    courseId,
    moduleId,
    completed,
    completionRate,
    completedModuleIds
  });

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline) {
    flushOutbox(userId).catch(console.warn);
  }

  return { clientOpId, synced: isOnline };
}

// ==========================================
// OPTIMISTIC MODULE NOTES & LAST-WRITE-WINS
// ==========================================

export async function saveModuleNoteAction(
  userId: string,
  courseId: string,
  moduleId: string,
  content: string
): Promise<{ note: CachedNote; clientOpId: string }> {
  const id = `${courseId}_${moduleId}`;
  const now = Date.now();
  const note: CachedNote = {
    id,
    courseId,
    moduleId,
    userId,
    content,
    updatedAt: now
  };

  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.NOTES_CACHE, 'readwrite');
    tx.objectStore(STORES.NOTES_CACHE).put(note);
  } catch (err) {
    console.warn('[OfflineActions] Failed to write note to IndexedDB cache:', err);
  }

  const clientOpId = await queueOfflineOp(userId, 'save_note', {
    courseId,
    moduleId,
    content,
    updatedAt: now
  });

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline) {
    flushOutbox(userId).catch(console.warn);
  }

  return { note, clientOpId };
}

export async function getOfflineModuleNote(courseId: string, moduleId: string): Promise<CachedNote | null> {
  try {
    const id = `${courseId}_${moduleId}`;
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.NOTES_CACHE, 'readonly');
      const req = tx.objectStore(STORES.NOTES_CACHE).get(id);
      req.onsuccess = () => {
        db.close();
        resolve(req.result || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

// ==========================================
// PRACTICE RESULTS SUBMISSION
// ==========================================

export async function savePracticeResultAction(
  userId: string,
  courseId: string,
  moduleId: string,
  score: number,
  total: number
): Promise<{ result: CachedPracticeResult; clientOpId: string }> {
  const now = Date.now();
  const id = `pr_${userId}_${courseId}_${moduleId}_${now}`;
  const resultRecord: CachedPracticeResult = {
    id,
    userId,
    courseId,
    moduleId,
    score,
    total,
    timestamp: now
  };

  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.PRACTICE_RESULTS, 'readwrite');
    tx.objectStore(STORES.PRACTICE_RESULTS).put(resultRecord);
  } catch (err) {
    console.warn('[OfflineActions] Failed to write practice result cache:', err);
  }

  const clientOpId = await queueOfflineOp(userId, 'practice_result', {
    courseId,
    moduleId,
    score,
    total
  });

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline) {
    flushOutbox(userId).catch(console.warn);
  }

  return { result: resultRecord, clientOpId };
}
