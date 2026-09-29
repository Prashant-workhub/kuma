import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeModuleProgress } from '../trainingProgress';

test('module progress is zero until persisted module IDs are complete', () => {
  const syllabus = [{ id: 'm1' }, { id: 'm2' }];
  assert.deepEqual(summarizeModuleProgress(syllabus), {
    completedCount: 0,
    totalCount: 2,
    progressPercentage: 0,
    contentComplete: false
  });
  assert.equal(summarizeModuleProgress(syllabus, { m1: true }).progressPercentage, 50);
});

test('module progress reaches completion only when every syllabus item is complete', () => {
  const result = summarizeModuleProgress([{ id: 'm1' }, { id: 'm2' }], { m1: true, m2: true });
  assert.equal(result.progressPercentage, 100);
  assert.equal(result.contentComplete, true);
});

test('a program without modules cannot satisfy completion requirements', () => {
  const result = summarizeModuleProgress([]);
  assert.equal(result.progressPercentage, 0);
  assert.equal(result.contentComplete, false);
});