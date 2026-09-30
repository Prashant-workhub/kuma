/**
 * Unit tests for learningDataService (attempts, competencyRecords, enrollments).
 *
 * Run with:  npx tsx --test src/services/__tests__/learningDataService.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  saveAttempt,
  getUserAttempts,
  getAttemptById,
  getCompetencyRecord,
  getUserCompetencyRecords,
  saveCompetencyRecord,
  recordDeclaredCompetency,
  recordAssessedCompetency,
  getEnrollment,
  getUserEnrollmentsFromFirestore,
  saveEnrollmentToFirestore
} from '../learningDataService';

test('saveAttempt builds and returns a formatted AssessmentAttempt object', async () => {
  const attempt = await saveAttempt({
    uid: 'user-test-101',
    assessmentId: 'quiz-react-101',
    competencyId: 'comp-react',
    courseId: 'course-react-1',
    answers: { q1: 0, q2: 1 },
    score: 85,
    resultingLevel: 3,
    createdAt: '2026-09-30T10:00:00Z'
  });

  assert.ok(attempt.id, 'attempt.id must be auto-generated or present');
  assert.equal(attempt.uid, 'user-test-101');
  assert.equal(attempt.assessmentId, 'quiz-react-101');
  assert.equal(attempt.competencyId, 'comp-react');
  assert.equal(attempt.score, 85);
  assert.equal(attempt.resultingLevel, 3);
});

test('recordDeclaredCompetency creates and updates competency history', async () => {
  const record = await recordDeclaredCompetency('user-test-102', 'comp-java', 2);

  assert.equal(record.uid, 'user-test-102');
  assert.equal(record.competencyId, 'comp-java');
  assert.equal(record.declaredLevel, 2);
  assert.equal(record.currentLevel, 2);
  assert.ok(record.history.length >= 1);
  assert.equal(record.history[0].level, 2);
  assert.equal(record.history[0].source, 'declared');
});

test('recordAssessedCompetency updates assessed level and computes max current level', async () => {
  const record = await recordAssessedCompetency('user-test-103', 'comp-[#992e9d]', 4, 'att-999');

  assert.equal(record.uid, 'user-test-103');
  assert.equal(record.competencyId, 'comp-[#992e9d]');
  assert.equal(record.assessedLevel, 4);
  assert.equal(record.currentLevel, 4);
  assert.equal(record.history[0].attemptId, 'att-999');
  assert.equal(record.history[0].source, 'assessed');
});

test('saveEnrollmentToFirestore builds and returns formatted FirestoreEnrollment', async () => {
  const enrollment = await saveEnrollmentToFirestore({
    uid: 'user-test-104',
    courseId: 'c-da101',
    status: 'active',
    moduleProgress: { m1: { completed: true } },
    percent: 50,
    createdAt: '2026-09-29T12:00:00Z',
    updatedAt: '2026-09-30T12:00:00Z'
  });

  assert.equal(enrollment.id, 'user-test-104_c-da101');
  assert.equal(enrollment.uid, 'user-test-104');
  assert.equal(enrollment.courseId, 'c-da101');
  assert.equal(enrollment.percent, 50);
});

test('queries return empty arrays when db is uninitialized or in test environment without emulator', async () => {
  const attempts = await getUserAttempts('user-test-none');
  assert.ok(Array.isArray(attempts));

  const compRecords = await getUserCompetencyRecords('user-test-none');
  assert.ok(Array.isArray(compRecords));

  const enrollments = await getUserEnrollmentsFromFirestore('user-test-none');
  assert.ok(Array.isArray(enrollments));

  const singleAttempt = await getAttemptById('att-missing');
  assert.equal(singleAttempt, null);

  const singleComp = await getCompetencyRecord('user-test-none', 'comp-missing');
  assert.equal(singleComp, null);

  const singleEnr = await getEnrollment('user-test-none', 'c-missing');
  assert.equal(singleEnr, null);
});
