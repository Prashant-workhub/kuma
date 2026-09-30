/**
 * Project Kuma — Offline Sync Engine (src/offline/syncEngine.ts)
 * 
 * Flushes the outbox idempotently when online with conflict resolution:
 *   - Progress & completion rate: Only moves forward (Math.max, set union of completed modules).
 *   - Notes: Last-write-wins by timestamp.
 *   - Deduplication: Idempotent using clientOpId tracked on Firestore documents.
 */

import { getPendingOps, markOpCompleted, markOpFailed } from './outbox';
import { OutboxOperation } from './db';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as FirebaseFirestore from 'firebase/firestore';

const arrayUnion = (FirebaseFirestore as any).arrayUnion as (...elements: any[]) => any;

export type SyncStatusState = 'online' | 'offline' | 'syncing' | 'failed';

export interface SyncEngineStatus {
  state: SyncStatusState;
  pendingCount: number;
  lastSyncTime: number | null;
  lastError: string | null;
}

type SyncListener = (status: SyncEngineStatus) => void;

let currentSyncState: SyncStatusState = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'online';
let pendingOpsCount = 0;
let lastSyncTime: number | null = null;
let lastSyncError: string | null = null;
let isSyncingActive = false;

const listeners: Set<SyncListener> = new Set();

export function getSyncEngineStatus(): SyncEngineStatus {
  return {
    state: currentSyncState,
    pendingCount: pendingOpsCount,
    lastSyncTime,
    lastError: lastSyncError
  };
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(getSyncEngineStatus());
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  const currentStatus = getSyncEngineStatus();
  listeners.forEach(fn => {
    try {
      fn(currentStatus);
    } catch (e) {
      console.warn('[SyncEngine] Listener error:', e);
    }
  });
}

// ==========================================
// CONFLICT RESOLUTION RULES
// ==========================================

/**
 * Module progress conflict resolution:
 * Progress and completion percentage ONLY move forward (max).
 * Completed module IDs are merged via set union.
 */
export function mergeModuleProgress(
  serverData: { completionRate?: number; completedModuleIds?: string[] } | null,
  clientData: { completionRate: number; completedModuleIds: string[] }
): { completionRate: number; completedModuleIds: string[] } {
  const serverRate = Number(serverData?.completionRate || 0);
  const clientRate = Number(clientData.completionRate || 0);
  const finalRate = Math.max(serverRate, clientRate);

  const serverModules = Array.isArray(serverData?.completedModuleIds) ? serverData!.completedModuleIds! : [];
  const clientModules = Array.isArray(clientData.completedModuleIds) ? clientData.completedModuleIds : [];

  const mergedModules = Array.from(new Set([...serverModules, ...clientModules]));

  return {
    completionRate: finalRate,
    completedModuleIds: mergedModules
  };
}

/**
 * Notes conflict resolution:
 * Last-write-wins by timestamp.
 */
export function mergeNotes(
  serverNote: { content: string; updatedAt: number } | null,
  clientNote: { content: string; updatedAt: number }
): { content: string; updatedAt: number } {
  if (!serverNote) return clientNote;
  if (clientNote.updatedAt >= serverNote.updatedAt) {
    return clientNote;
  }
  return serverNote;
}

// ==========================================
// OPERATION PROCESSOR WITH IDEMPOTENCY
// ==========================================

export async function processOutboxOp(op: OutboxOperation): Promise<void> {
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) {
    // If Firestore database instance is not connected, simulate/local complete
    return;
  }

  const { clientOpId, opType, payload, userId } = op;

  switch (opType) {
    case 'module_progress': {
      const { courseId, moduleId, completed, completionRate, completedModuleIds } = payload;
      const enrollmentDocId = `${userId}_${courseId}`;
      const enrollRef = doc(db, 'enrollments', enrollmentDocId);
      const snap = await getDoc(enrollRef);

      if (snap.exists()) {
        const data = snap.data();
        const processedOps: string[] = data.processedClientOps || [];

        // Idempotency check: if clientOpId was already processed by Firestore, complete op cleanly
        if (processedOps.includes(clientOpId)) {
          return;
        }

        const merged = mergeModuleProgress(data, {
          completionRate: completionRate || 0,
          completedModuleIds: completedModuleIds || (completed && moduleId ? [moduleId] : [])
        });

        await updateDoc(enrollRef, {
          completionRate: merged.completionRate,
          completedModuleIds: merged.completedModuleIds,
          processedClientOps: arrayUnion(clientOpId),
          updatedAt: new Date().toISOString()
        });
      } else {
        await setDoc(enrollRef, {
          uid: userId,
          courseId,
          completionRate: completionRate || (completed ? 100 : 0),
          completedModuleIds: completedModuleIds || (completed && moduleId ? [moduleId] : []),
          processedClientOps: [clientOpId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      break;
    }

    case 'save_note': {
      const { courseId, moduleId, content, updatedAt } = payload;
      const noteDocId = `${userId}_${courseId}_${moduleId}`;
      const noteRef = doc(db, 'notes', noteDocId);
      const snap = await getDoc(noteRef);

      const clientNote = { content, updatedAt: updatedAt || op.timestamp };

      if (snap.exists()) {
        const data = snap.data();
        const serverNote = { content: data.content || '', updatedAt: new Date(data.updatedAt || 0).getTime() };
        const winner = mergeNotes(serverNote, clientNote);

        await setDoc(noteRef, {
          id: noteDocId,
          userId,
          courseId,
          moduleId,
          content: winner.content,
          processedClientOps: arrayUnion(clientOpId),
          updatedAt: new Date(winner.updatedAt).toISOString()
        }, { merge: true });
      } else {
        await setDoc(noteRef, {
          id: noteDocId,
          userId,
          courseId,
          moduleId,
          content: clientNote.content,
          processedClientOps: [clientOpId],
          updatedAt: new Date(clientNote.updatedAt).toISOString()
        }, { merge: true });
      }
      break;
    }

    case 'practice_result': {
      const { courseId, moduleId, score, total } = payload;
      const resId = `pr_${userId}_${courseId}_${moduleId}_${op.timestamp}`;
      const resRef = doc(db, 'practiceResults', resId);
      const snap = await getDoc(resRef);

      if (!snap.exists()) {
        await setDoc(resRef, {
          id: resId,
          userId,
          courseId,
          moduleId,
          score,
          total,
          clientOpId,
          createdAt: new Date(op.timestamp).toISOString()
        });
      }
      break;
    }

    case 'trainer_select':
    case 'profile_update': {
      const { targetCollection, docId, updates } = payload;
      if (targetCollection && docId && updates) {
        const ref = doc(db, targetCollection, docId);
        await setDoc(ref, {
          ...updates,
          processedClientOps: arrayUnion(clientOpId),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      break;
    }

    default:
      break;
  }
}

// ==========================================
// FLUSH OUTBOX SYNC LOOP
// ==========================================

export async function flushOutbox(userId?: string): Promise<void> {
  if (isSyncingActive) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentSyncState = 'offline';
    notifyListeners();
    return;
  }

  isSyncingActive = true;
  currentSyncState = 'syncing';
  notifyListeners();

  try {
    const ops = await getPendingOps(userId);
    pendingOpsCount = ops.length;
    notifyListeners();

    if (ops.length === 0) {
      currentSyncState = 'online';
      lastSyncTime = Date.now();
      lastSyncError = null;
      notifyListeners();
      return;
    }

    for (const op of ops) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        currentSyncState = 'offline';
        break;
      }

      try {
        await processOutboxOp(op);
        await markOpCompleted(op.clientOpId);
      } catch (err: any) {
        console.warn(`[SyncEngine] Operation ${op.clientOpId} sync failed:`, err);
        await markOpFailed(op.clientOpId, err.message || 'Sync failed');
        lastSyncError = err.message || 'Operation sync failed';
      }
    }

    const remainingOps = await getPendingOps(userId);
    pendingOpsCount = remainingOps.length;

    if (remainingOps.length > 0) {
      currentSyncState = 'failed';
    } else {
      currentSyncState = 'online';
      lastSyncTime = Date.now();
      lastSyncError = null;
    }
  } catch (err: any) {
    currentSyncState = 'failed';
    lastSyncError = err.message || 'Sync engine failure';
  } finally {
    isSyncingActive = false;
    notifyListeners();
  }
}

let autoSyncStarted = false;

export function startOfflineSyncEngine(userId?: string): () => void {
  if (typeof window === 'undefined') return () => {};

  const updateNetworkState = () => {
    if (!navigator.onLine) {
      currentSyncState = 'offline';
      notifyListeners();
    } else {
      flushOutbox(userId).catch(console.warn);
    }
  };

  if (!autoSyncStarted) {
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);
    autoSyncStarted = true;
  }

  if (navigator.onLine) {
    flushOutbox(userId).catch(console.warn);
  } else {
    currentSyncState = 'offline';
    notifyListeners();
  }

  return () => {
    window.removeEventListener('online', updateNetworkState);
    window.removeEventListener('offline', updateNetworkState);
    autoSyncStarted = false;
  };
}
