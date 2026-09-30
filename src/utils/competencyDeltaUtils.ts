/**
 * Project Kuma - Competency Delta & Baseline Calculation Utilities
 * Handles baseline snapshots, delta computation, and level advancement requirements.
 */

import { CompetencyHistoryEntry } from '../types';

export interface CompetencyDeltaResult {
  oldLevel: number;
  newLevel: number;
  delta: number;
  direction: 'up' | 'unchanged' | 'down';
  oldLevelLabel: string;
  newLevelLabel: string;
  requirementsForNextLevel: string;
  suggestedAction: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 (Novice)',
  2: 'Level 2 (Advanced Beginner)',
  3: 'Level 3 (Competent)',
  4: 'Level 4 (Proficient/Expert)'
};

/**
 * Computes level change delta from a competency history timeline.
 */
export function computeCompetencyDelta(history: CompetencyHistoryEntry[] = []): CompetencyDeltaResult {
  if (history.length === 0) {
    return {
      oldLevel: 1,
      newLevel: 1,
      delta: 0,
      direction: 'unchanged',
      oldLevelLabel: LEVEL_LABELS[1],
      newLevelLabel: LEVEL_LABELS[1],
      requirementsForNextLevel: getCompetencyLevelRequirements(1),
      suggestedAction: 'Take the introductory course modules to establish your baseline competency.'
    };
  }

  const sorted = [...history].sort((a, b) => {
    const tA = typeof a.at === 'number' ? a.at : new Date(a.at || 0).getTime();
    const tB = typeof b.at === 'number' ? b.at : new Date(b.at || 0).getTime();
    return tA - tB;
  });

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : sorted[0];

  const oldLevel = previous.level || 1;
  const newLevel = latest.level || 1;
  const delta = newLevel - oldLevel;

  let direction: 'up' | 'unchanged' | 'down' = 'unchanged';
  if (delta > 0) direction = 'up';
  else if (delta < 0) direction = 'down';

  return {
    oldLevel,
    newLevel,
    delta,
    direction,
    oldLevelLabel: LEVEL_LABELS[oldLevel] || `Level ${oldLevel}`,
    newLevelLabel: LEVEL_LABELS[newLevel] || `Level ${newLevel}`,
    requirementsForNextLevel: getCompetencyLevelRequirements(newLevel),
    suggestedAction: getSuggestedActionForDelta(direction, newLevel)
  };
}

/**
 * Explains what is required to reach the next proficiency tier.
 */
export function getCompetencyLevelRequirements(currentLevel: number): string {
  switch (currentLevel) {
    case 1:
      return 'To reach Level 2 (Advanced Beginner), complete core training modules and achieve at least 75% accuracy on foundational assessments.';
    case 2:
      return 'To reach Level 3 (Competent), demonstrate independent problem solving in scenario-based assessments with at least 80% accuracy.';
    case 3:
      return 'To reach Level 4 (Proficient/Expert), achieve >90% accuracy on advanced multi-topic evaluations and complete all program modules.';
    case 4:
      return 'You have reached the highest competency level (Expert)! Maintain your status through periodic evaluations and peer reviews.';
    default:
      return 'Complete additional learning modules and pass evaluation quizzes to advance your competency level.';
  }
}

function getSuggestedActionForDelta(direction: 'up' | 'unchanged' | 'down', newLevel: number): string {
  if (direction === 'up') {
    return 'Congratulations on your level advancement! Continue with the next recommended course in your path.';
  }
  if (direction === 'down') {
    return 'Review the practice modules and flashcards to refresh your foundational knowledge before retrying.';
  }
  return `To advance from Level ${newLevel}, complete the recommended practice modules and retry the assessment when ready.`;
}

/**
 * Calculates competency gains between enrollment baseline and post-assessment completion.
 */
export function calculateCompetencyGains(
  beforeLevels: Record<string, number>,
  afterLevels: Record<string, number>
): Array<{ competencyId: string; fromLevel: number; toLevel: number; gain: number }> {
  const gains: Array<{ competencyId: string; fromLevel: number; toLevel: number; gain: number }> = [];

  Object.entries(afterLevels).forEach(([compId, toLvl]) => {
    const fromLvl = beforeLevels[compId] ?? 1;
    const gain = Math.max(0, toLvl - fromLvl);
    gains.push({
      competencyId: compId,
      fromLevel: fromLvl,
      toLevel: toLvl,
      gain
    });
  });

  return gains;
}
