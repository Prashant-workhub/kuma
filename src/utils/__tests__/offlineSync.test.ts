import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { queueOfflineOp, getPendingOps, markOpCompleted } from '../../offline/outbox';
import { mergeModuleProgress, mergeNotes } from '../../offline/syncEngine';
import { clearOfflineStores, getOfflineResourceStorageUsage } from '../../offline/db';

test('Outbox queue maintains FIFO ordering by timestamp', async () => {
  await clearOfflineStores();

  const userId = 'user-test-101';
  const op1 = await queueOfflineOp(userId, 'module_progress', { moduleId: 'm1', percent: 50 }, 'op-1');
  const op2 = await queueOfflineOp(userId, 'save_note', { content: 'Note 1' }, 'op-2');
  const op3 = await queueOfflineOp(userId, 'practice_result', { score: 100 }, 'op-3');

  const pending = await getPendingOps(userId);
  assert.equal(pending.length, 3);
  assert.equal(pending[0].clientOpId, 'op-1');
  assert.equal(pending[1].clientOpId, 'op-2');
  assert.equal(pending[2].clientOpId, 'op-3');
});

test('Outbox operation completion removes item idempotently', async () => {
  await clearOfflineStores();

  const userId = 'user-test-102';
  await queueOfflineOp(userId, 'module_progress', { moduleId: 'm1' }, 'op-unique-1');
  
  let pending = await getPendingOps(userId);
  assert.equal(pending.length, 1);

  await markOpCompleted('op-unique-1');
  pending = await getPendingOps(userId);
  assert.equal(pending.length, 0);
});

test('mergeModuleProgress enforces MAX progress and set union of completed modules', () => {
  const serverState = {
    completionRate: 50,
    completedModuleIds: ['mod-1', 'mod-2']
  };

  const clientState = {
    completionRate: 75,
    completedModuleIds: ['mod-2', 'mod-3']
  };

  const merged = mergeModuleProgress(serverState, clientState);
  assert.equal(merged.completionRate, 75);
  assert.deepEqual(merged.completedModuleIds.sort(), ['mod-1', 'mod-2', 'mod-3']);

  // Verify server higher completion rate stays higher (Max rule)
  const lowerClientState = {
    completionRate: 30,
    completedModuleIds: ['mod-4']
  };
  const mergedLower = mergeModuleProgress(serverState, lowerClientState);
  assert.equal(mergedLower.completionRate, 50);
  assert.deepEqual(mergedLower.completedModuleIds.sort(), ['mod-1', 'mod-2', 'mod-4']);
});

test('mergeNotes applies Last-Write-Wins based on timestamp', () => {
  const serverNote = {
    content: 'Initial server note',
    updatedAt: 1000
  };

  const newerClientNote = {
    content: 'Updated client note',
    updatedAt: 2000
  };

  const olderClientNote = {
    content: 'Stale client note',
    updatedAt: 500
  };

  const resultNewer = mergeNotes(serverNote, newerClientNote);
  assert.equal(resultNewer.content, 'Updated client note');

  const resultOlder = mergeNotes(serverNote, olderClientNote);
  assert.equal(resultOlder.content, 'Initial server note');
});

test('clearOfflineStores clears outbox and caches for logout safety', async () => {
  const userId = 'user-test-logout';
  await queueOfflineOp(userId, 'module_progress', { moduleId: 'm1' }, 'logout-op-1');

  let pending = await getPendingOps(userId);
  assert.equal(pending.length, 1);

  await clearOfflineStores();

  pending = await getPendingOps(userId);
  assert.equal(pending.length, 0);

  const usage = await getOfflineResourceStorageUsage();
  assert.equal(usage, 0);
});
