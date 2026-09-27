/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogCompetency, SkillProficiencyLevel, TraineeCompetency } from '../types';

export interface AssessedProficiencyResult {
  level: SkillProficiencyLevel;
  numericLevel: 1 | 2 | 3 | 4;
}

export const LEVEL_TO_NUMERIC: Record<SkillProficiencyLevel, 1 | 2 | 3 | 4> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4
};

export const NUMERIC_TO_LEVEL: Record<1 | 2 | 3 | 4, SkillProficiencyLevel> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert'
};

export type GapStatus =
  | 'Meets Target'
  | 'Development Needed'
  | 'Significant Development Needed'
  | 'High Development Need';

export type GapPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SkillGapAnalysisResult {
  currentLevel: SkillProficiencyLevel;
  currentNumericLevel: 1 | 2 | 3 | 4;
  currentSource: 'Assessed' | 'Declared';
  targetLevel: SkillProficiencyLevel;
  targetNumericLevel: 1 | 2 | 3 | 4;
  gap: number; // 0, 1, 2, or 3
  status: GapStatus;
  priority: GapPriority;
}

/**
 * Deterministic mapping from score percentage to assessed proficiency level.
 * 0–39%   → Beginner (1)
 * 40–69%  → Intermediate (2)
 * 70–89%  → Advanced (3)
 * 90–100% → Expert (4)
 */
export function calculateAssessedProficiency(percentage: number): AssessedProficiencyResult {
  const rounded = Math.min(100, Math.max(0, Math.round(percentage)));
  if (rounded >= 90) {
    return { level: 'Expert', numericLevel: 4 };
  }
  if (rounded >= 70) {
    return { level: 'Advanced', numericLevel: 3 };
  }
  if (rounded >= 40) {
    return { level: 'Intermediate', numericLevel: 2 };
  }
  return { level: 'Beginner', numericLevel: 1 };
}

/**
 * Calculates Skill Gap, Gap Status, and Priority deterministically for a Trainee Competency.
 * Current level priority: Assessed Level first (Phase 3C), declared level fallback (Phase 3A/3B).
 * Skill Gap = Target Level - Current Level (Clamped to >= 0, no negative gaps).
 */
export function calculateSkillGap(competency: TraineeCompetency): SkillGapAnalysisResult {
  let currentNumericLevel: 1 | 2 | 3 | 4 = 2;
  let currentLevel: SkillProficiencyLevel = 'Intermediate';
  let currentSource: 'Assessed' | 'Declared' = 'Declared';

  if (competency.latestAssessedLevel && competency.latestAssessedNumericLevel) {
    currentLevel = competency.latestAssessedLevel;
    currentNumericLevel = competency.latestAssessedNumericLevel;
    currentSource = 'Assessed';
  } else if (competency.level) {
    currentLevel = competency.level;
    currentNumericLevel = competency.numericLevel || LEVEL_TO_NUMERIC[competency.level] || 2;
    currentSource = 'Declared';
  }

  // Target level (default to Advanced / 3 if not explicitly set)
  const targetLevel: SkillProficiencyLevel = competency.targetLevel || 'Advanced';
  const targetNumericLevel: 1 | 2 | 3 | 4 = competency.targetNumericLevel || LEVEL_TO_NUMERIC[targetLevel] || 3;

  // Rule-based gap calculation
  const rawGap = targetNumericLevel - currentNumericLevel;
  const gap = Math.max(0, rawGap);

  // Status & Priority mapping
  let status: GapStatus = 'Meets Target';
  let priority: GapPriority = 'Low';

  if (gap === 1) {
    status = 'Development Needed';
    priority = 'Medium';
  } else if (gap === 2) {
    status = 'Significant Development Needed';
    priority = 'High';
  } else if (gap >= 3) {
    status = 'High Development Need';
    priority = 'Critical';
  }

  return {
    currentLevel,
    currentNumericLevel,
    currentSource,
    targetLevel,
    targetNumericLevel,
    gap,
    status,
    priority
  };
}

/**
 * Validates if a competency ID exists in the centralized competency catalog.
 */
export function isValidCatalogCompetency(
  competencyId: string,
  catalog: CatalogCompetency[]
): boolean {
  if (!competencyId) return false;
  return catalog.some((c) => c.id === competencyId);
}

/**
 * Validates if a competency is active in the catalog.
 */
export function isActiveCatalogCompetency(
  competencyId: string,
  catalog: CatalogCompetency[]
): boolean {
  if (!competencyId) return false;
  const comp = catalog.find((c) => c.id === competencyId);
  return !!comp && comp.isActive !== false;
}
