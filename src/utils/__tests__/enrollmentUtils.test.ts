/**
 * Characterization tests for the enrollment lifecycle.
 *
 * Run with:  npx tsx --test src/utils/__tests__/enrollmentUtils.test.ts
 *
 * These lock in the regression fix in updateEnrollmentProgress(): when the
 * trainee was not yet enrolled, enrollInCourse() persisted a new record but
 * updateEnrollmentProgress() then wrote back a STALE list captured before that
 * call, silently dropping the freshly created enrollment.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const STORAGE_KEY = 'kuma_user_enrollments';

// Minimal localStorage polyfill for the Node test environment.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
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

(globalThis as unknown as { localStorage?: unknown }).localStorage = new MemoryStorage();

/** Direct access to the polyfilled store, bypassing the DOM Storage type. */
function store(): MemoryStorage {
  return (globalThis as unknown as { localStorage: MemoryStorage }).localStorage;
}

const { updateEnrollmentProgress, enrollInCourse, getAllEnrollments, getUserEnrollments, getEnrollmentByCourse } =
  await import('../enrollmentUtils.ts');

const profile = {
  fullName: 'Test Trainee',
  emailAddress: 'test.trainee@example.com',
  bio: '',
  avatarUrl: '',
  institution: 'Test Institute',
  role: 'trainee',
};

const course: Record<string, string> = {
  id: 'c-test-1',
  courseCode: 'TS101',
  courseName: 'Test Course',
  subject: 'Testing',
};

function reset() {
  store().clear();
}

/**
 * Builds a distinct profile + course pair per test.
 *
 * Enrollment de-duplication matches on userId OR emailAddress, so reusing a
 * single email across tests would make later tests resolve to an earlier
 * trainee's enrollment. Each test therefore gets its own identity.
 */
let seq = 0;
function fresh() {
  seq += 1;
  return {
    userId: `user-test-${seq}`,
    profile: { ...profile, emailAddress: `trainee${seq}@example.com` },
    course: { ...course, id: `c-test-${seq}`, courseCode: `TS1${seq}` },
  };
}

test('auto-enrollment is not lost when progress is updated for a new trainee', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  // First ever call: the trainee has no enrollment yet.
  const first = updateEnrollmentProgress(userId, p as never, c as never, 40);

  assert.equal(first.enrollment.status, 'in_progress');
  assert.equal(first.enrollment.completionRate, 40);

  // The enrollment must exist in storage, not just in the returned object.
  const stored = getAllEnrollments().filter((e) => e.userId === userId);
  assert.equal(stored.length, 1, 'newly created enrollment must be persisted');
  assert.equal(stored[0].completionRate, 40);

  // A follow-up call must find the SAME record and update it, not create another.
  const second = updateEnrollmentProgress(userId, p as never, c as never, 75);
  assert.equal(second.enrollment.id, first.enrollment.id, 'must update existing enrollment');
  assert.equal(second.enrollment.completionRate, 75);

  const afterSecond = getAllEnrollments().filter((e) => e.userId === userId);
  assert.equal(afterSecond.length, 1, 'no duplicate enrollment should be created');
});

test('reaching 100% with a passed quiz marks enrollment as completed', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  const result = updateEnrollmentProgress(userId, p as never, c as never, 100, true);

  assert.equal(result.enrollment.status, 'completed');
  assert.equal(result.enrollment.completionRate, 100);
  assert.ok(result.enrollment.completedAt, 'completedAt must be set');

  // Re-running completion remains idempotent
  const again = updateEnrollmentProgress(userId, p as never, c as never, 100, true);
  assert.equal(again.enrollment.status, 'completed');
});

test('progress is clamped to the 0-100 range and rounded', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  const over = updateEnrollmentProgress(userId, p as never, c as never, 250);
  assert.equal(over.enrollment.completionRate, 100);

  const under = updateEnrollmentProgress(userId, p as never, c as never, -20);
  assert.equal(under.enrollment.completionRate, 0);

  const rounded = updateEnrollmentProgress(userId, p as never, c as never, 49.6);
  assert.equal(rounded.enrollment.completionRate, 50);
});

test('100% progress with a failed quiz does not mark course as completed', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  const result = updateEnrollmentProgress(userId, p as never, c as never, 100, false);

  assert.notEqual(result.enrollment.status, 'completed');
});

test('enrollInCourse is idempotent for the same trainee and course', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  const a = enrollInCourse(userId, p as never, c as never);
  const b = enrollInCourse(userId, p as never, c as never);

  assert.equal(a.id, b.id, 'duplicate enrollment must be prevented');
  assert.equal(getUserEnrollments(userId).length, 1);
});

test('getEnrollmentByCourse isolates records per user and course', () => {
  reset();
  const { userId, profile: p, course: c } = fresh();

  enrollInCourse(userId, p as never, c as never);
  const other = { ...c, id: `${c.id}-alt`, courseCode: 'TS999', courseName: 'Other Course' } as never;
  enrollInCourse(userId, p as never, other as never);

  const found = getEnrollmentByCourse(userId, `${c.id}-alt`);
  assert.ok(found);
  assert.equal(found.courseId, `${c.id}-alt`);

  assert.equal(getEnrollmentByCourse(userId, 'c-missing'), null);
  assert.equal(getEnrollmentByCourse('', `${c.id}-alt`), null);
});

test('getAllEnrollments falls back to in-memory data when storage is corrupt', () => {
  reset();
  // Write malformed JSON directly, bypassing the safe-storage parse path.
  store().setItem(STORAGE_KEY, '{not valid json');

  const result = getAllEnrollments();
  assert.ok(Array.isArray(result), 'must return an array even for corrupt storage');
});
