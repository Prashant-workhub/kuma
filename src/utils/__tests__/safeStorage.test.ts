/**
 * Tests for the resilient localStorage wrapper.
 *
 * Run with:  npm test
 *
 * Previously every call site hand-rolled its own try/catch and silently swallowed
 * failures with `catch (err) {}`. A quota failure therefore left React state
 * updated but storage stale, so the user's change vanished on the next reload
 * with no indication that anything went wrong.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  private store = new Map<string, string>();
  /** When true, every setItem throws a QuotaExceededError. */
  public quotaExceeded = false;
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    if (this.quotaExceeded) {
      const err = new Error('The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  get length() {
    return this.store.size;
  }
}

const storage = new MemoryStorage();
(globalThis as { localStorage?: unknown }).localStorage = storage;

const { readJson, writeJson, readRaw, removeKey } = await import('../safeStorage.ts');

test('writeJson then readJson round-trips values', () => {
  storage.quotaExceeded = false;
  storage.clear();

  const payload = { id: 'a1', tags: ['x', 'y'], nested: { n: 1 } };
  const written = writeJson('kuma_test_roundtrip', payload);

  assert.equal(written.ok, true);
  assert.deepEqual(readJson('kuma_test_roundtrip', null), payload);
});

test('readJson returns the fallback for a missing key', () => {
  storage.clear();
  assert.equal(readJson('kuma_test_missing', 'fallback'), 'fallback');
  assert.deepEqual(readJson('kuma_test_missing_arr', []), []);
  assert.equal(readRaw('kuma_test_missing'), null);
});

test('readJson returns the fallback for corrupt JSON without throwing', () => {
  storage.clear();
  storage.setItem('kuma_test_corrupt', '{ this is not valid json');

  assert.deepEqual(readJson('kuma_test_corrupt', []), [], 'must degrade to the fallback');
});

test('readJson treats a stored null as missing', () => {
  storage.clear();
  storage.setItem('kuma_test_null', 'null');
  assert.equal(readJson('kuma_test_null', 'fallback'), 'fallback');
});

test('writeJson reports failure instead of throwing when quota is exceeded', () => {
  storage.clear();
  storage.quotaExceeded = true;

  const result = writeJson('kuma_test_quota', { big: 'x'.repeat(1000) });

  assert.equal(result.ok, false, 'must report the failure');
  assert.equal((result.error as Error).name, 'QuotaExceededError');

  // The value must still be readable in-session from the memory fallback so the
  // app keeps working, even though it will not survive a reload.
  assert.deepEqual(readJson('kuma_test_quota', null), { big: 'x'.repeat(1000) });

  storage.quotaExceeded = false;
});

test('writeJson recovers gracefully once quota frees up', () => {
  storage.clear();
  storage.quotaExceeded = true;
  writeJson('kuma_test_recover', { stage: 1 });
  assert.equal(writeJson('kuma_test_recover', { stage: 2 }).ok, false);

  storage.quotaExceeded = false;
  assert.equal(writeJson('kuma_test_recover', { stage: 3 }).ok, true);
  assert.deepEqual(readJson('kuma_test_recover', null), { stage: 3 });
});

test('writeJson reports failure for values that cannot be serialized', () => {
  storage.clear();

  const circular: Record<string, unknown> = {};
  circular.self = circular;

  const result = writeJson('kuma_test_circular', circular);
  assert.equal(result.ok, false);
  assert.ok(result.error instanceof Error);
});

test('removeKey clears the value from storage', () => {
  storage.clear();
  writeJson('kuma_test_remove', { a: 1 });
  assert.notEqual(readJson('kuma_test_remove', null), null);

  removeKey('kuma_test_remove');
  assert.equal(readJson('kuma_test_remove', null), null);
});

test('writeJson handles values that serialize to empty output', () => {
  storage.clear();
  // undefined serializes to undefined, which JSON.stringify returns as `undefined`.
  const result = writeJson('kuma_test_undefined', undefined);
  assert.equal(result.ok, true);
  assert.equal(readJson('kuma_test_undefined', 'fallback'), 'fallback');
});
