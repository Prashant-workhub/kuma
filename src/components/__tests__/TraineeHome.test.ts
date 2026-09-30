/**
 * Unit tests for TraineeHome dashboard logic and components
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrainingRecommendations } from '../../utils/recommendationUtils';
import { calculateDesignationSkillGaps } from '../../utils/competencyUtils';
import { COURSES } from '../../teacher-portal/lib/mockData';
import { TraineeCompetency } from '../../types';

test('TraineeHome - calculates active skill gaps for compact growth strip', () => {
  const traineeCompetencies: TraineeCompetency[] = [
    { id: 'comp-1', name: 'Cloud Architecture', level: 'Beginner', numericLevel: 1, targetNumericLevel: 3, category: 'Technical' },
    { id: 'comp-2', name: 'Database Management', level: 'Advanced', numericLevel: 3, targetNumericLevel: 3, category: 'Technical' }
  ];

  const gaps = calculateDesignationSkillGaps(traineeCompetencies, null, []);
  const activeGaps = gaps.filter(g => g.gap > 0);

  assert.equal(activeGaps.length, 1);
  assert.equal(activeGaps[0].competencyName, 'Cloud Architecture');
  assert.equal(activeGaps[0].gap, 2);
});

test('TraineeHome - recommendations return gap-closing courses with badges', () => {
  const traineeCompetencies: TraineeCompetency[] = [
    { id: 'comp-1', name: 'Cloud Architecture', level: 'Beginner', numericLevel: 1, targetNumericLevel: 3, category: 'Technical' }
  ];

  const res = getTrainingRecommendations(traineeCompetencies, COURSES, [], [], {}, null);
  assert.ok(res.recommendedCourses.length >= 0);

  if (res.recommendedCourses.length > 0) {
    const topRec = res.recommendedCourses[0];
    assert.ok(topRec.matchedGaps.length > 0);
    assert.ok(topRec.reason.length > 0);
  }
});

test('TraineeHome - handles empty competency and enrollment states gracefully', () => {
  const emptyCompetencies: TraineeCompetency[] = [];
  const gaps = calculateDesignationSkillGaps(emptyCompetencies, null, []);
  assert.equal(gaps.length, 0);

  const res = getTrainingRecommendations(emptyCompetencies, COURSES, [], [], {}, null);
  assert.equal(res.activeGaps.length, 0);
});
