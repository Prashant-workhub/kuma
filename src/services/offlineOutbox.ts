/**
 * Project Kuma — IndexedDB Offline Outbox (Phase J)
 *
 * Lightweight OUTBOX pattern for offline-safe writes.
 *
 * Storage Responsibility:
 *   IndexedDB → Pending operations / upload state / temporary offline cache.
 *   localStorage → NON-CRITICAL preferences only (handled by safeStorage.ts).
 *
 * The outbox stores structured operations that failed or were created while
 * offline. When network returns, the SyncManager drains pending operations.
 *
 * Browser compatibility: IndexedDB is available in all modern browsers.
 * Feature-detection is used so the app degrades gracefully if unavailable.
 */

// ============================================================================
// Types
// ============================================================================

export type OfflineOperationType =
  | 'profile_update'
  | 'enrollment_update'
  | 'assessment_submit'
  | 'competency_update'
  | 'trainer_select'
  | 'file_upload'
  | 'certificate_create'
  | 'generic';

export type OfflineOperationStatus =
  | 'pending'
  | 'uploading'
  | 'failed'
  | 'retrying'
  | 'completed';

export interface PendingOperation {
  operationId: string;
  userId: string;
  operationType: OfflineOperationType;
  /** Serializable payload to be sent when online. */
  payload: Record<string, any>;
  /** Optional reference to a pending file in the pendingUploads store. */
  fileReference?: string;
  createdAt: number; // Date.now()
  retryCount: number;
  maxRetries: number;
  status: OfflineOperationStatus;
  lastError?: string;
  lastAttemptAt?: number;
}

export interface PendingUpload {
  uploadId: string;
  userId: string;
  /** The file blob stored temporarily in IndexedDB. */
  fileBlob?: Blob;
  fileName: string;
  contentType: string;
  fileSize: number;
  /** Firestore document/collection this upload belongs to. */
  associatedDocId?: string;
  associatedCollection?: string;
  purpose: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  status: OfflineOperationStatus;
  lastError?: string;
}

// ============================================================================
// Database setup
// ============================================================================

const DB_NAME = 'kuma-offline';
const DB_VERSION = 1;
const OPERATIONS_STORE = 'pendingOperations';
const UPLOADS_STORE = 'pendingUploads';

/** Maximum file size to cache in IndexedDB (10 MB). */
export const MAX_OFFLINE_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum retry attempts before marking as permanently failed. */
export const MAX_RETRIES = 5;

/**
 * Returns true if IndexedDB is available in this environment.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens (or creates) the offline database.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const ops = db.createObjectStore(OPERATIONS_STORE, { keyPath: 'operationId' });
        ops.createIndex('status', 'status', { unique: false });
        ops.createIndex('userId', 'userId', { unique: false });
        ops.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(UPLOADS_STORE)) {
        const uploads = db.createObjectStore(UPLOADS_STORE, { keyPath: 'uploadId' });
        uploads.createIndex('status', 'status', { unique: false });
        uploads.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Pending Operations CRUD
// ============================================================================

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Queues a new offline operation. Returns the operation ID.
 */
export async function queueOperation(
  userId: string,
  operationType: OfflineOperationType,
  payload: Record<string, any>,
  fileReference?: string
): Promise<string> {
  const db = await openDatabase();
  const operationId = generateId();
  const operation: PendingOperation = {
    operationId,
    userId,
    operationType,
    payload,
    fileReference,
    createdAt: Date.now(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, 'readwrite');
    tx.objectStore(OPERATIONS_STORE).put(operation);
    tx.oncomplete = () => {
      db.close();
      resolve(operationId);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Returns all pending/failed/retrying operations for a user.
 */
export async function getPendingOperations(userId?: string): Promise<PendingOperation[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, 'readonly');
    const store = tx.objectStore(OPERATIONS_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const all: PendingOperation[] = request.result || [];
      const filtered = userId ? all.filter(op => op.userId === userId) : all;
      // Return non-completed operations
      resolve(filtered.filter(op => op.status !== 'completed'));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Updates an operation's status and optionally its error/retry count.
 */
export async function updateOperationStatus(
  operationId: string,
  update: Partial<Pick<PendingOperation, 'status' | 'retryCount' | 'lastError' | 'lastAttemptAt'>>
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, 'readwrite');
    const store = tx.objectStore(OPERATIONS_STORE);
    const getReq = store.get(operationId);
    getReq.onsuccess = () => {
      const existing = getReq.result as PendingOperation | undefined;
      if (!existing) {
        db.close();
        resolve();
        return;
      }
      store.put({ ...existing, ...update });
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Marks an operation as completed and removes it from the outbox.
 */
export async function completeOperation(operationId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, 'readwrite');
    tx.objectStore(OPERATIONS_STORE).delete(operationId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Removes all completed operations (cleanup).
 */
export async function purgeCompletedOperations(): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, 'readwrite');
    const store = tx.objectStore(OPERATIONS_STORE);
    const request = store.getAll();
    let purgedCount = 0;
    request.onsuccess = () => {
      const all: PendingOperation[] = request.result || [];
      all.forEach(op => {
        if (op.status === 'completed') {
          store.delete(op.operationId);
          purgedCount++;
        }
      });
    };
    tx.oncomplete = () => {
      db.close();
      resolve(purgedCount);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ============================================================================
// Pending Uploads CRUD
// ============================================================================

/**
 * Queues a file upload for later retry.
 * If the file exceeds MAX_OFFLINE_FILE_SIZE, the blob is NOT stored.
 */
export async function queueUpload(
  userId: string,
  file: File | Blob,
  fileName: string,
  purpose: string,
  associatedDocId?: string,
  associatedCollection?: string
): Promise<{ uploadId: string; blobStored: boolean }> {
  const db = await openDatabase();
  const uploadId = generateId();
  const blobStored = file.size <= MAX_OFFLINE_FILE_SIZE;

  const upload: PendingUpload = {
    uploadId,
    userId,
    fileBlob: blobStored ? file : undefined,
    fileName,
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
    associatedDocId,
    associatedCollection,
    purpose,
    createdAt: Date.now(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readwrite');
    tx.objectStore(UPLOADS_STORE).put(upload);
    tx.oncomplete = () => {
      db.close();
      resolve({ uploadId, blobStored });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Returns all pending uploads for a user.
 */
export async function getPendingUploads(userId?: string): Promise<PendingUpload[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readonly');
    const request = tx.objectStore(UPLOADS_STORE).getAll();
    request.onsuccess = () => {
      db.close();
      const all: PendingUpload[] = request.result || [];
      const filtered = userId ? all.filter(u => u.userId === userId) : all;
      resolve(filtered.filter(u => u.status !== 'completed'));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Removes a completed upload from the store.
 */
export async function completeUpload(uploadId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readwrite');
    tx.objectStore(UPLOADS_STORE).delete(uploadId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Updates upload status after a retry attempt.
 */
export async function updateUploadStatus(
  uploadId: string,
  update: Partial<Pick<PendingUpload, 'status' | 'retryCount' | 'lastError'>>
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPLOADS_STORE, 'readwrite');
    const store = tx.objectStore(UPLOADS_STORE);
    const getReq = store.get(uploadId);
    getReq.onsuccess = () => {
      const existing = getReq.result as PendingUpload | undefined;
      if (!existing) {
        db.close();
        resolve();
        return;
      }
      store.put({ ...existing, ...update });
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ============================================================================
// Summary / Counts (for UI indicators)
// ============================================================================

export interface OfflineSyncSummary {
  pendingCount: number;
  failedCount: number;
  uploadsPendingCount: number;
  uploadsFailedCount: number;
  totalPending: number;
  totalFailed: number;
}

/**
 * Returns a quick summary of pending offline operations for the UI indicator.
 */
export async function getOfflineSyncSummary(userId?: string): Promise<OfflineSyncSummary> {
  try {
    const [ops, uploads] = await Promise.all([
      getPendingOperations(userId),
      getPendingUploads(userId),
    ]);

    const pendingOps = ops.filter(o => o.status === 'pending' || o.status === 'retrying');
    const failedOps = ops.filter(o => o.status === 'failed');
    const pendingUploads = uploads.filter(u => u.status === 'pending' || u.status === 'retrying');
    const failedUploads = uploads.filter(u => u.status === 'failed');

    return {
      pendingCount: pendingOps.length,
      failedCount: failedOps.length,
      uploadsPendingCount: pendingUploads.length,
      uploadsFailedCount: failedUploads.length,
      totalPending: pendingOps.length + pendingUploads.length,
      totalFailed: failedOps.length + failedUploads.length,
    };
  } catch {
    // IndexedDB unavailable — return empty summary
    return {
      pendingCount: 0,
      failedCount: 0,
      uploadsPendingCount: 0,
      uploadsFailedCount: 0,
      totalPending: 0,
      totalFailed: 0,
    };
  }
}
