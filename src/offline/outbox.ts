/**
 * Project Kuma — Outbox Operations Manager (src/offline/outbox.ts)
 * 
 * Manages queued offline write operations with deterministic clientOpId.
 */

import { openOfflineDb, STORES, OutboxOperation } from './db';

function generateClientOpId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Enqueues a new operation in the outbox. Returns the unique clientOpId.
 */
export async function queueOfflineOp(
  userId: string,
  opType: OutboxOperation['opType'],
  payload: Record<string, any>,
  clientOpId?: string
): Promise<string> {
  const finalOpId = clientOpId || generateClientOpId();
  const op: OutboxOperation = {
    clientOpId: finalOpId,
    userId,
    opType,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OUTBOX, 'readwrite');
      tx.objectStore(STORES.OUTBOX).put(op);

      tx.oncomplete = () => {
        db.close();
        resolve(finalOpId);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[Outbox] Failed to queue offline operation:', err);
    return finalOpId;
  }
}

/**
 * Gets all pending/failed outbox operations sorted by timestamp ascending.
 */
export async function getPendingOps(userId?: string): Promise<OutboxOperation[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OUTBOX, 'readonly');
      const store = tx.objectStore(STORES.OUTBOX);
      const req = store.getAll();

      req.onsuccess = () => {
        db.close();
        let ops: OutboxOperation[] = req.result || [];
        if (userId) {
          ops = ops.filter(o => o.userId === userId);
        }
        ops = ops.filter(o => o.status !== 'completed');
        ops.sort((a, b) => a.timestamp - b.timestamp);
        resolve(ops);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Removes or marks an outbox operation as completed once synced.
 */
export async function markOpCompleted(clientOpId: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OUTBOX, 'readwrite');
      tx.objectStore(STORES.OUTBOX).delete(clientOpId);

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
    console.warn('[Outbox] Failed to mark operation completed:', err);
  }
}

/**
 * Updates retry state and error message for a failed outbox operation.
 */
export async function markOpFailed(clientOpId: string, errorMsg: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OUTBOX, 'readwrite');
      const store = tx.objectStore(STORES.OUTBOX);
      const getReq = store.get(clientOpId);

      getReq.onsuccess = () => {
        const existing = getReq.result as OutboxOperation | undefined;
        if (existing) {
          store.put({
            ...existing,
            status: 'failed',
            retryCount: (existing.retryCount || 0) + 1,
            error: errorMsg
          });
        }
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
  } catch (err) {
    console.warn('[Outbox] Failed to mark operation failed:', err);
  }
}
