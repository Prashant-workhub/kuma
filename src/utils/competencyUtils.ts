/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatalogCompetency, SkillProficiencyLevel } from '../types';

export interface AssessedProficiencyResult {
  level: SkillProficiencyLevel;
  numericLevel: 1 | 2 | 3 | 4;
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
