/**
 * Tests for the shared date helpers.
 *
 * Run with:  npm test
 *
 * toEpochMs() guards doubt sorting. The previous implementation used
 * `new Date(value).getTime()`, which returns NaN for Firestore Timestamp objects
 * and malformed strings. A NaN comparator makes Array.prototype.sort leave
 * elements in an arbitrary (implementation-defined) order, so the doubt list
 * would appear unsorted at random.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { getTodayDateString, getYesterdayDateString, getCalendarDaysDiff, toEpochMs } from '../dateUtils.ts';

test('toEpochMs returns 0 for missing or empty values', () => {
  assert.equal(toEpochMs(null), 0);
  assert.equal(toEpochMs(undefined), 0);
  assert.equal(toEpochMs(''), 0);
});

test('toEpochMs returns 0 for unparseable values instead of NaN', () => {
  assert.equal(toEpochMs('not-a-date'), 0);
  assert.equal(toEpochMs({}), 0);
  assert.equal(toEpochMs(Number.NaN), 0);
  assert.equal(toEpochMs(Number.POSITIVE_INFINITY), 0);
  assert.equal(toEpochMs(new Date('nonsense')), 0);
});

test('toEpochMs parses ISO strings and Date instances', () => {
  const iso = '2026-09-25T10:30:00.000Z';
  assert.equal(toEpochMs(iso), new Date(iso).getTime());
  assert.equal(toEpochMs(new Date(iso)), new Date(iso).getTime());
  assert.equal(toEpochMs(1730000000000), 1730000000000);
});

test('toEpochMs handles Firestore Timestamp objects', () => {
  const target = new Date('2026-09-25T10:30:00.000Z');
  const firestoreTimestamp = { toDate: () => target };
  assert.equal(toEpochMs(firestoreTimestamp), target.getTime());
});

test('toEpochMs survives a throwing toDate()', () => {
  const broken = {
    toDate: () => {
      throw new Error('malformed timestamp');
    },
  };
  assert.equal(toEpochMs(broken), 0, 'must not propagate the exception');
});

test('sorting doubt-like records with toEpochMs is deterministic and total', () => {
  const items = [
    { id: 'bad', createdAt: 'garbage' },
    { id: 'newest', createdAt: '2026-09-25T10:00:00.000Z' },
    { id: 'oldest', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'missing', createdAt: null },
  ];

  items.sort((a, b) => toEpochMs(b.createdAt) - toEpochMs(a.createdAt));

  assert.deepEqual(
    items.map((i) => i.id),
    ['newest', 'oldest', 'bad', 'missing'],
    'valid dates sort first, invalid and missing values fall to the end deterministically'
  );

  // Re-sorting an already sorted list must be stable (no shuffling).
  const once = items.map((i) => i.id);
  items.sort((a, b) => toEpochMs(b.createdAt) - toEpochMs(a.createdAt));
  assert.deepEqual(items.map((i) => i.id), once);
});

test('getTodayDateString and getYesterdayDateString use local calendar days', () => {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(yesterday, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(getCalendarDaysDiff(yesterday, today), 1);
});

test('getCalendarDaysDiff is positive when the second date is later', () => {
  assert.equal(getCalendarDaysDiff('2026-09-01', '2026-09-10'), 9);
  assert.equal(getCalendarDaysDiff('2026-09-10', '2026-09-01'), -9);
  assert.equal(getCalendarDaysDiff('2026-09-01', '2026-09-01'), 0);
});
