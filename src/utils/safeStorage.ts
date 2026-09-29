/**
 * Project Kuma - Resilient localStorage access layer
 *
 * Wraps every localStorage interaction so the app degrades gracefully instead of
 * throwing. Handles the three failure modes that were previously scattered and
 * inconsistent across the codebase:
 *
 * 1. `localStorage` being unavailable (SSR, disabled cookies, private mode).
 * 2. `QuotaExceededError` when the origin's ~5MB budget is full. Without this,
 *    a failed write left React state updated but storage stale, so the change was
 *    silently lost on the next read/reload.
 * 3. Corrupt JSON payloads written by older builds.
 */

export type StorageResult<T> = { ok: true; value: T } | { ok: false; value: T; error: unknown };

/** Returns the in-memory fallback used when localStorage is unusable. */
const memoryFallback = new Map<string, string>();

function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; code?: number; message?: string };
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    /quota/i.test(err.message || '')
  );
}

/**
 * Returns the Storage instance, or null when localStorage is unavailable
 * (SSR, disabled cookies, or a blocked/security error on property access).
 *
 * Deliberately does NOT probe with a write: a `setItem` probe throws when the
 * origin is out of quota, which would be swallowed here and misreport quota
 * exhaustion as "storage unavailable".
 */
function getStore(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/**
 * Resolves the raw string for a key, preferring the in-memory fallback.
 *
 * A key present in `memoryFallback` means the last write could not be persisted
 * (unavailable storage or quota exhaustion). Returning that value keeps the
 * session self-consistent: the caller sees what it just wrote, and the data is
 * simply lost on reload rather than silently reverting to a stale value.
 */
function getRaw(key: string): string | null {
  const inMemory = memoryFallback.get(key);
  if (inMemory !== undefined) return inMemory;
  const store = getStore();
  return store ? store.getItem(key) : null;
}

/**
 * Reads and parses a JSON value. Returns `fallback` when the key is missing,
 * unparseable, or storage is unavailable.
 */
export function readJson<T>(key: string, fallback: T): T {
  const raw = getRaw(key);
  if (raw === null || raw === undefined) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch (error) {
    console.warn(`[safeStorage] Corrupt JSON for "${key}", using fallback:`, error);
    return fallback;
  }
}

/** Reads a raw string value. */
export function readRaw(key: string): string | null {
  return getRaw(key);
}

/** Builds an error whose `name` matches the DOMException browsers throw. */
function quotaError(): Error {
  const err = new Error('The quota has been exceeded.');
  // `Error.prototype.name` is inherited, so a plain assignment is shadowed in
  // some engines. defineProperty guarantees an own, enumerable-free override.
  Object.defineProperty(err, 'name', {
    value: 'QuotaExceededError',
    configurable: true,
    writable: true,
  });
  return err;
}

/**
 * Serializes and writes a JSON value.
 *
 * On quota exhaustion the write is reported as failed rather than throwing, and
 * the value is mirrored into the in-memory fallback so the current session keeps
 * working even though it will not survive a reload.
 */
export function writeJson(key: string, value: unknown): StorageResult<string> {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch (error) {
    // Circular structures or BigInt values.
    console.warn(`[safeStorage] Unable to serialize "${key}":`, error);
    return { ok: false, value: '', error };
  }

  // JSON.stringify(undefined) returns undefined, which localStorage would coerce
  // to the string "undefined" and then fail to parse on read. Store "null"
  // instead so reads fall back cleanly.
  if (serialized === undefined) serialized = 'null';

  const store = getStore();
  if (!store) {
    memoryFallback.set(key, serialized);
    return { ok: false, value: serialized, error: new Error('localStorage unavailable') };
  }

  try {
    store.setItem(key, serialized);
    memoryFallback.delete(key);
    return { ok: true, value: serialized };
  } catch (error) {
    console.warn(`[safeStorage] Quota exceeded writing "${key}"; keeping value in memory only:`, error);
    memoryFallback.set(key, serialized);
    return {
      ok: false,
      value: serialized,
      error: isQuotaError(error) ? quotaError() : error,
    };
  }
}

/** Removes a key from both localStorage and the in-memory fallback. */
export function removeKey(key: string): void {
  const store = getStore();
  if (store) {
    try {
      store.removeItem(key);
    } catch (error) {
      console.warn(`[safeStorage] Failed to remove "${key}":`, error);
    }
  }
  memoryFallback.delete(key);
}
