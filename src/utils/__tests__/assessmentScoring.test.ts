/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAssessedProficiency } from '../competencyUtils';
import { SkillProficiencyLevel } from '../../types';

// Server-side level calculation function (must maintain 100% parity with calculateAssessedProficiency)
function serverCalculateAssessedProficiency(percentage: number): { level: SkillProficiencyLevel; numericLevel: 1 | 2 | 3 | 4 } {
  const rounded = Math.min(100, Math.max(0, Math.round(percentage)));
  if (rounded >= 90) return { level: 'Expert', numericLevel: 4 };
  if (rounded >= 70) return { level: 'Advanced', numericLevel: 3 };
  if (rounded >= 40) return { level: 'Intermediate', numericLevel: 2 };
  return { level: 'Beginner', numericLevel: 1 };
}

// Server-side scoring logic simulation
function scoreAssessmentAttempt(
  userAnswers: Record<string, any>,
  correctAnswers: Record<string, any>,
  passPercent = 60
) {
  const questionIds = Object.keys(correctAnswers);
  const totalQuestions = questionIds.length || 1;
  let correctCount = 0;

  for (const qId of questionIds) {
    const userChoice = userAnswers[qId];
    const targetChoice = correctAnswers[qId];
    if (userChoice !== undefined && String(userChoice) === String(targetChoice)) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= passPercent;
  const { level, numericLevel } = serverCalculateAssessedProficiency(percentage);

  return {
    correctCount,
    totalQuestions,
    percentage,
    passed,
    level,
    numericLevel
  };
}

// Server-side attempt limit validation helper
function validateAttemptLimit(existingAttempts: Array<{ status: string }>, maxAttempts: number): boolean {
  const completedAttempts = existingAttempts.filter(a => a.status === 'completed');
  return completedAttempts.length < maxAttempts;
}

// Server-side attempt ownership validation helper
function validateAttemptOwnership(attemptUid: string, callerUid: string): boolean {
  return !!attemptUid && !!callerUid && attemptUid === callerUid;
}

// Server-side time limit validation helper
function validateTimeLimit(startedAt: string, timeLimitMinutes: number, graceSeconds = 120, nowMs = Date.now()): boolean {
  const startedMs = new Date(startedAt).getTime();
  const maxAllowedMs = (timeLimitMinutes * 60 + graceSeconds) * 1000;
  return (nowMs - startedMs) <= maxAllowedMs;
}

test('Level threshold parity: client and server produce identical levels for all 0-100 percentages', () => {
  for (let pct = 0; pct <= 100; pct++) {
    const clientResult = calculateAssessedProficiency(pct);
    const serverResult = serverCalculateAssessedProficiency(pct);

    assert.equal(clientResult.level, serverResult.level, `Level mismatch at ${pct}%`);
    assert.equal(clientResult.numericLevel, serverResult.numericLevel, `Numeric level mismatch at ${pct}%`);
  }
});

test('Level threshold boundary assertions', () => {
  // 0 - 39% -> Beginner (Level 1)
  assert.deepEqual(serverCalculateAssessedProficiency(0), { level: 'Beginner', numericLevel: 1 });
  assert.deepEqual(serverCalculateAssessedProficiency(39), { level: 'Beginner', numericLevel: 1 });

  // 40 - 69% -> Intermediate (Level 2)
  assert.deepEqual(serverCalculateAssessedProficiency(40), { level: 'Intermediate', numericLevel: 2 });
  assert.deepEqual(serverCalculateAssessedProficiency(69), { level: 'Intermediate', numericLevel: 2 });

  // 70 - 89% -> Advanced (Level 3)
  assert.deepEqual(serverCalculateAssessedProficiency(70), { level: 'Advanced', numericLevel: 3 });
  assert.deepEqual(serverCalculateAssessedProficiency(89), { level: 'Advanced', numericLevel: 3 });

  // 90 - 100% -> Expert (Level 4)
  assert.deepEqual(serverCalculateAssessedProficiency(90), { level: 'Expert', numericLevel: 4 });
  assert.deepEqual(serverCalculateAssessedProficiency(100), { level: 'Expert', numericLevel: 4 });
});

test('Scoring correctness: correctly computes score, pass status, and assessed level', () => {
  const correctAnswers = { q1: 0, q2: 1, q3: 1, q4: 1, q5: 2 };

  // Perfect score (100% -> Expert L4)
  const resultPerfect = scoreAssessmentAttempt({ q1: 0, q2: 1, q3: 1, q4: 1, q5: 2 }, correctAnswers, 60);
  assert.equal(resultPerfect.correctCount, 5);
  assert.equal(resultPerfect.percentage, 100);
  assert.equal(resultPerfect.passed, true);
  assert.equal(resultPerfect.level, 'Expert');
  assert.equal(resultPerfect.numericLevel, 4);

  // Partial score (60% -> 3/5 -> Intermediate L2, passed)
  const resultPass = scoreAssessmentAttempt({ q1: 0, q2: 1, q3: 1, q4: 0, q5: 0 }, correctAnswers, 60);
  assert.equal(resultPass.correctCount, 3);
  assert.equal(resultPass.percentage, 60);
  assert.equal(resultPass.passed, true);
  assert.equal(resultPass.level, 'Intermediate');
  assert.equal(resultPass.numericLevel, 2);

  // Low score (20% -> 1/5 -> Beginner L1, failed)
  const resultFail = scoreAssessmentAttempt({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }, correctAnswers, 60);
  assert.equal(resultFail.correctCount, 1);
  assert.equal(resultFail.percentage, 20);
  assert.equal(resultFail.passed, false);
  assert.equal(resultFail.level, 'Beginner');
  assert.equal(resultFail.numericLevel, 1);
});

test('Attempt limit enforcement: rejects when completed attempts exceed maxAttempts', () => {
  const attemptsUnder = [{ status: 'completed' }, { status: 'completed' }];
  assert.equal(validateAttemptLimit(attemptsUnder, 3), true, 'Should allow 3rd attempt when 2 completed');

  const attemptsReached = [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }];
  assert.equal(validateAttemptLimit(attemptsReached, 3), false, 'Should reject 4th attempt when maxAttempts is 3');

  const attemptsWithInProgress = [{ status: 'completed' }, { status: 'in-progress' }];
  assert.equal(validateAttemptLimit(attemptsWithInProgress, 2), true, 'Should only count completed attempts against limit');
});

test('Ownership check: enforces attempt belongs to caller UID', () => {
  assert.equal(validateAttemptOwnership('user-123', 'user-123'), true, 'Same UID should be valid');
  assert.equal(validateAttemptOwnership('user-123', 'user-456'), false, 'Different UID must be rejected');
  assert.equal(validateAttemptOwnership('user-123', ''), false, 'Empty caller UID must be rejected');
});

test('Time limit enforcement with grace period', () => {
  const now = Date.now();
  const started10MinAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const started16MinAgo = new Date(now - 16 * 60 * 1000).toISOString();
  const started20MinAgo = new Date(now - 20 * 60 * 1000).toISOString();

  // 15 minute time limit + 2 minute grace = 17 minutes max
  assert.equal(validateTimeLimit(started10MinAgo, 15, 120, now), true, '10 mins elapsed is within 15 min limit');
  assert.equal(validateTimeLimit(started16MinAgo, 15, 120, now), true, '16 mins elapsed is within 15 min limit + 2 min grace');
  assert.equal(validateTimeLimit(started20MinAgo, 15, 120, now), false, '20 mins elapsed exceeds limit + grace');
});
