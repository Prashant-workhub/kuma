/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isModuleComplete,
  summarizeCourseModuleProgress,
  evaluateCourseCompletionStatus,
  ModuleDefinition,
  ModuleActivityState
} from '../progressRules';
import { updateEnrollmentModuleProgress } from '../enrollmentUtils';

test('isModuleComplete - video module rules', () => {
  const videoModule: ModuleDefinition = { id: 'm-vid', type: 'video', minWatchPercentage: 90 };

  assert.equal(isModuleComplete(videoModule, { watchPercentage: 85 }), false, 'Video watched to 85% is not complete');
  assert.equal(isModuleComplete(videoModule, { watchPercentage: 90 }), true, 'Video watched to 90% is complete');
  assert.equal(isModuleComplete(videoModule, { watchPercentage: 99 }), true, 'Video watched to 99% is complete');

  const customVideo: ModuleDefinition = { id: 'm-vid-custom', type: 'video', minWatchPercentage: 80 };
  assert.equal(isModuleComplete(customVideo, { watchPercentage: 80 }), true, 'Custom 80% threshold video is complete');
  assert.equal(isModuleComplete(customVideo, { watchPercentage: 75 }), false, 'Custom 80% threshold video at 75% is not complete');
});

test('isModuleComplete - document/presentation/pdf rules', () => {
  const docModule: ModuleDefinition = { id: 'm-doc', type: 'document', minViewTimeSeconds: 30 };

  assert.equal(isModuleComplete(docModule, { viewTimeSeconds: 15 }), false, 'Doc viewed for 15s is not complete');
  assert.equal(isModuleComplete(docModule, { viewTimeSeconds: 30 }), true, 'Doc viewed for 30s is complete');
  assert.equal(isModuleComplete(docModule, { viewTimeSeconds: 5, scrolledToBottom: true }), true, 'Doc scrolled to bottom is complete regardless of view time');
});

test('isModuleComplete - text module rules', () => {
  const textModule: ModuleDefinition = { id: 'm-text', type: 'text' };

  assert.equal(isModuleComplete(textModule, { explicitMarkComplete: false }), false, 'Text module without explicit mark complete is not complete');
  assert.equal(isModuleComplete(textModule, { explicitMarkComplete: true }), true, 'Text module with explicit mark complete is complete');
});

test('summarizeCourseModuleProgress - recomputes percentage from module progress only', () => {
  const syllabus: ModuleDefinition[] = [
    { id: 'm1', type: 'text' },
    { id: 'm2', type: 'video' },
    { id: 'm3', type: 'document' },
    { id: 'm4', type: 'text' }
  ];

  const progress1: Record<string, ModuleActivityState> = {
    m1: { explicitMarkComplete: true },
    m2: { watchPercentage: 50 } // incomplete
  };
  const summary1 = summarizeCourseModuleProgress(syllabus, progress1);
  assert.equal(summary1.completedCount, 1);
  assert.equal(summary1.totalCount, 4);
  assert.equal(summary1.percent, 25);
  assert.equal(summary1.isContentComplete, false);

  const progressHalf: Record<string, ModuleActivityState> = {
    m1: { explicitMarkComplete: true },
    m2: { watchPercentage: 95 }
  };
  const summaryHalf = summarizeCourseModuleProgress(syllabus, progressHalf);
  assert.equal(summaryHalf.completedCount, 2);
  assert.equal(summaryHalf.percent, 50);

  const progressAll: Record<string, ModuleActivityState> = {
    m1: { explicitMarkComplete: true },
    m2: { watchPercentage: 100 },
    m3: { viewTimeSeconds: 45 },
    m4: { explicitMarkComplete: true }
  };
  const summaryAll = summarizeCourseModuleProgress(syllabus, progressAll);
  assert.equal(summaryAll.completedCount, 4);
  assert.equal(summaryAll.percent, 100);
  assert.equal(summaryAll.isContentComplete, true);
});

test('evaluateCourseCompletionStatus - completion requires BOTH all modules complete AND passing assessment attempt if required', () => {
  const syllabus: ModuleDefinition[] = [
    { id: 'm1', type: 'text' },
    { id: 'm2', type: 'video' }
  ];

  // Case A: Passing assessment alone without finishing modules does NOT complete course
  const incompleteModulesProgress = { m1: { explicitMarkComplete: true } }; // 50%
  const evalA = evaluateCourseCompletionStatus(syllabus, incompleteModulesProgress, true, true);
  assert.equal(evalA.isContentComplete, false);
  assert.equal(evalA.isAssessmentUnlocked, false);
  assert.equal(evalA.isCourseCompleted, false);
  assert.equal(evalA.status, 'in_progress');

  // Case B: Finishing all modules alone without passing required assessment does NOT complete course
  const allModulesProgress = {
    m1: { explicitMarkComplete: true },
    m2: { watchPercentage: 90 }
  };
  const evalB = evaluateCourseCompletionStatus(syllabus, allModulesProgress, true, false);
  assert.equal(evalB.isContentComplete, true);
  assert.equal(evalB.isAssessmentUnlocked, true);
  assert.equal(evalB.isCourseCompleted, false);
  assert.equal(evalB.status, 'in_progress');

  // Case C: BOTH all modules complete AND passing assessment attempt completes course
  const evalC = evaluateCourseCompletionStatus(syllabus, allModulesProgress, true, true);
  assert.equal(evalC.isContentComplete, true);
  assert.equal(evalC.isAssessmentUnlocked, true);
  assert.equal(evalC.isCourseCompleted, true);
  assert.equal(evalC.status, 'completed');
});

test('updateEnrollmentModuleProgress - rejects module update if module does not belong to course', () => {
  const syllabus: ModuleDefinition[] = [
    { id: 'm1', type: 'text' }
  ];

  const profile = {
    fullName: 'Test Learner',
    emailAddress: 'test@kuma.ai',
    bio: 'Test bio',
    avatarUrl: '',
    institution: 'MSDE',
    role: 'trainee'
  };

  assert.throws(() => {
    updateEnrollmentModuleProgress('test-user-1', profile, 'course-101', syllabus, 'unknown-module-xyz', { explicitMarkComplete: true });
  }, /does not belong to course/i);
});
