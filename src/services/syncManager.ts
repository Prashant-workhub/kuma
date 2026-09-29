/**
 * Project Kuma — Offline Sync Manager (Phase K)
 *
 * Drains the IndexedDB outbox when the network returns.
 * Uses exponential backoff with limited retry attempts.
 *
 * Usage:
 *   1. Call `startSyncManager()` once at app boot.
 *   2. The manager automatically listens for online/offline events.
 *   3. When online, it processes all pending operations.
 *   4. Failed operations are retried with exponential backoff.
 *   5. After MAX_RETRIES, operations are marked as permanently 'failed'.
 *   6. Users can manually trigger `retrySyncAll()`.
 */

import {
  getPendingOperations,
  getPendingUploads,
  updateOperationStatus,
  updateUploadStatus,
  completeOperation,
  completeUpload,
  MAX_RETRIES,
  isIndexedDBAvailable,
  type PendingOperation,
  type PendingUpload,
  type OfflineSyncSummary,
  getOfflineSyncSummary,
} from './offlineOutbox';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// Types
// ============================================================================

export type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'operation_complete' | 'operation_failed';

export interface SyncEvent {
  type: SyncEventType;
  operationId?: string;
  error?: string;
  summary?: OfflineSyncSummary;
  timestamp: number;
}

type SyncListener = (event: SyncEvent) => void;

// ============================================================================
// State
// ============================================================================

let isSyncing = false;
let isManagerStarted = false;
const listeners: Set<SyncListener> = new Set();

// ============================================================================
// Event system
// ============================================================================

/** Subscribe to sync events (for UI indicators). Returns an unsubscribe function. */
export function onSyncEvent(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitEvent(event: SyncEvent): void {
  listeners.forEach(fn => {
    try { fn(event); } catch (e) { console.warn('[SyncManager] Listener error:', e); }
  });
}

// ============================================================================
// Exponential backoff
// ============================================================================

/**
 * Returns delay in ms for the given retry count.
 * Pattern: 1s, 2s, 4s, 8s, 16s (capped at 30s).
 */
function getBackoffDelay(retryCount: number): number {
  const baseDelay = 1000;
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, 30_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Operation processors
// ============================================================================

/**
 * Processes a single pending operation by type.
 * Throws on failure so the caller can update retry state.
 */
async function processOperation(op: PendingOperation): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated. Cannot sync offline operations.');
  }

  switch (op.operationType) {
    case 'profile_update': {
      const { collection: colName, docId, data } = op.payload;
      const targetCollection = colName || 'users';
      const targetDocId = docId || currentUser.uid;
      await setDoc(doc(db, targetCollection, targetDocId), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      break;
    }

    case 'competency_update': {
      const { competencies } = op.payload;
      if (competencies) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          competencies,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await setDoc(doc(db, 'traineeProfiles', currentUser.uid), {
          competencies,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      break;
    }

    case 'enrollment_update': {
      const { enrollmentId, updates } = op.payload;
      if (enrollmentId && updates) {
        await updateDoc(doc(db, 'trainingEnrollments', enrollmentId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }
      break;
    }

    case 'trainer_select': {
      // Trainer selection is already transactional in trainerDiscoveryService.
      // If it was queued offline, replay the full payload.
      const { assignmentId, data } = op.payload;
      if (assignmentId && data) {
        await setDoc(doc(db, 'trainer_assignments', assignmentId), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      break;
    }

    case 'generic':
    default: {
      // Generic payload: { collection, docId, data, merge }
      const { collection: col, docId: did, data: d, merge: m } = op.payload;
      if (col && did && d) {
        await setDoc(doc(db, col, did), {
          ...d,
          updatedAt: serverTimestamp(),
        }, { merge: m !== false });
      }
      break;
    }
  }
}

// ============================================================================
// Sync loop
// ============================================================================

/**
 * Drains all pending operations from the IndexedDB outbox.
 * Processes them sequentially to avoid overwhelming the network.
 */
async function drainOutbox(userId?: string): Promise<void> {
  if (isSyncing) return;
  if (!isIndexedDBAvailable()) return;
  if (!navigator.onLine) return;

  isSyncing = true;
  emitEvent({ type: 'sync_start', timestamp: Date.now() });

  try {
    // 1. Process pending operations
    const operations = await getPendingOperations(userId);
    const retryable = operations.filter(
      op => op.status === 'pending' || op.status === 'retrying' || op.status === 'failed'
    ).filter(op => op.retryCount < (op.maxRetries || MAX_RETRIES));

    for (const op of retryable) {
      if (!navigator.onLine) break; // Stop if we go offline mid-sync

      try {
        await updateOperationStatus(op.operationId, {
          status: 'uploading',
          lastAttemptAt: Date.now(),
        });

        await processOperation(op);

        await completeOperation(op.operationId);
        emitEvent({
          type: 'operation_complete',
          operationId: op.operationId,
          timestamp: Date.now(),
        });
      } catch (err: any) {
        const newRetryCount = op.retryCount + 1;
        const isFinalFailure = newRetryCount >= (op.maxRetries || MAX_RETRIES);

        await updateOperationStatus(op.operationId, {
          status: isFinalFailure ? 'failed' : 'retrying',
          retryCount: newRetryCount,
          lastError: err?.message || 'Unknown sync error',
          lastAttemptAt: Date.now(),
        });

        emitEvent({
          type: 'operation_failed',
          operationId: op.operationId,
          error: err?.message,
          timestamp: Date.now(),
        });

        if (!isFinalFailure) {
          await sleep(getBackoffDelay(newRetryCount));
        }
      }
    }

    // 2. Process pending uploads (file uploads without blobs are skipped — user must re-select)
    const uploads = await getPendingUploads(userId);
    const retryableUploads = uploads.filter(
      u => (u.status === 'pending' || u.status === 'retrying' || u.status === 'failed') &&
           u.retryCount < (u.maxRetries || MAX_RETRIES)
    );

    for (const upload of retryableUploads) {
      if (!navigator.onLine) break;

      if (!upload.fileBlob) {
        // File blob not stored (too large). Mark as failed with user-actionable message.
        await updateUploadStatus(upload.uploadId, {
          status: 'failed',
          lastError: 'File not available offline. Please reconnect and re-select the file to upload.',
        });
        continue;
      }

      try {
        await updateUploadStatus(upload.uploadId, { status: 'uploading' });

        // Use the storage service to upload the blob
        const { getUploadSasUrl, uploadBlobStorage } = await import('./storageService');
        const sasResponse = await getUploadSasUrl(upload.fileName);
        await uploadBlobStorage(sasResponse.uploadUrl, upload.fileBlob, () => {}, {
          fileName: upload.fileName,
        });

        await completeUpload(upload.uploadId);
        emitEvent({
          type: 'operation_complete',
          operationId: upload.uploadId,
          timestamp: Date.now(),
        });
      } catch (err: any) {
        const newRetryCount = upload.retryCount + 1;
        const isFinalFailure = newRetryCount >= (upload.maxRetries || MAX_RETRIES);

        await updateUploadStatus(upload.uploadId, {
          status: isFinalFailure ? 'failed' : 'retrying',
          retryCount: newRetryCount,
          lastError: err?.message || 'Upload sync error',
        });

        if (!isFinalFailure) {
          await sleep(getBackoffDelay(newRetryCount));
        }
      }
    }
  } catch (err) {
    console.warn('[SyncManager] Outbox drain error:', err);
  } finally {
    isSyncing = false;
    try {
      const summary = await getOfflineSyncSummary(userId);
      emitEvent({ type: 'sync_complete', summary, timestamp: Date.now() });
    } catch {
      emitEvent({ type: 'sync_complete', timestamp: Date.now() });
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initializes the sync manager. Call once at app boot.
 * Listens for online/offline events and drains the outbox automatically.
 */
export function startSyncManager(userId?: string): () => void {
  if (isManagerStarted) {
    // Already started — just trigger a sync
    drainOutbox(userId).catch(console.warn);
    return () => {};
  }

  isManagerStarted = true;

  const handleOnline = () => {
    console.log('[SyncManager] Network restored. Draining offline outbox...');
    drainOutbox(userId).catch(console.warn);
  };

  const handleOffline = () => {
    console.log('[SyncManager] Network lost. Operations will be queued.');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial drain if we're already online
  if (navigator.onLine) {
    // Slight delay to let auth state settle
    setTimeout(() => drainOutbox(userId).catch(console.warn), 2000);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    isManagerStarted = false;
  };
}

/**
 * Manually trigger a full sync retry (e.g. from a "Retry" button in the UI).
 */
export async function retrySyncAll(userId?: string): Promise<void> {
  if (!navigator.onLine) {
    console.warn('[SyncManager] Cannot retry while offline.');
    return;
  }
  await drainOutbox(userId);
}

/**
 * Returns whether a sync is currently in progress.
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}
