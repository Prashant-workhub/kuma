/**
 * Unit tests for competency delta computation, next-level requirement explanations, and baseline gains calculation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCompetencyDelta,
  getCompetencyLevelRequirements,
  calculateCompetencyGains
} from '../competencyDeltaUtils';
import { CompetencyHistoryEntry } from '../../types';

test('computeCompetencyDelta - calculates Level Up direction (+1)', () => {
  const history: CompetencyHistoryEntry[] = [
    { level: 1, source: 'declared', at: '2026-09-01' },
    { level: 2, source: 'assessed', at: '2026-09-15' }
  ];

  const delta = computeCompetencyDelta(history);
  assert.equal(delta.oldLevel, 1);
  assert.equal(delta.newLevel, 2);
  assert.equal(delta.delta, 1);
  assert.equal(delta.direction, 'up');
});

test('computeCompetencyDelta - calculates Level Unchanged direction (0) with requirement text', () => {
  const history: CompetencyHistoryEntry[] = [
    { level: 2, source: 'declared', at: '2026-09-01' },
    { level: 2, source: 'assessed', at: '2026-09-15' }
  ];

  const delta = computeCompetencyDelta(history);
  assert.equal(delta.delta, 0);
  assert.equal(delta.direction, 'unchanged');
  assert.ok(delta.requirementsForNextLevel.includes('Level 3 (Competent)'));
});

test('computeCompetencyDelta - handles empty history gracefully with default baseline', () => {
  const delta = computeCompetencyDelta([]);
  assert.equal(delta.oldLevel, 1);
  assert.equal(delta.newLevel, 1);
  assert.equal(delta.direction, 'unchanged');
  assert.ok(delta.suggestedAction.length > 0);
});

test('calculateCompetencyGains - measures before and after enrollment baseline gains', () => {
  const beforeLevels = { 'comp-1': 1, 'comp-2': 2 };
  const afterLevels = { 'comp-1': 3, 'comp-2': 2 };

  const gains = calculateCompetencyGains(beforeLevels, afterLevels);
  assert.equal(gains.length, 2);

  const comp1Gain = gains.find((g) => g.competencyId === 'comp-1');
  assert.ok(comp1Gain);
  assert.equal(comp1Gain.fromLevel, 1);
  assert.equal(comp1Gain.toLevel, 3);
  assert.equal(comp1Gain.gain, 2);

  const comp2Gain = gains.find((g) => g.competencyId === 'comp-2');
  assert.ok(comp2Gain);
  assert.equal(comp2Gain.gain, 0);
});

test('getCompetencyLevelRequirements - provides specific requirements per level tier', () => {
  assert.ok(getCompetencyLevelRequirements(1).includes('Level 2'));
  assert.ok(getCompetencyLevelRequirements(2).includes('Level 3'));
  assert.ok(getCompetencyLevelRequirements(3).includes('Level 4'));
  assert.ok(getCompetencyLevelRequirements(4).includes('Expert'));
});
