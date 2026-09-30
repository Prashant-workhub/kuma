import { CatalogCompetency, SkillProficiencyLevel, TraineeCompetency, OrgDesignation, RoleSkillGapRecord, SkillProficiencyScaleLevel } from '../types';

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

export const SCALE_NUMERIC_TO_LEVEL: Record<0 | 1 | 2 | 3 | 4, SkillProficiencyScaleLevel> = {
  0: 'Not Assessed',
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
 * Calculates deterministic Skill Gap analysis for a Trainee against an Organizational Designation.
 *
 * Trainee → Department → Designation → Required Competencies
 *
 * Current Level priority:
 * 1. Latest valid assessed level (from assessmentAttempts / latestAssessedNumericLevel)
 * 2. Declared level (from numericLevel / level)
 * 3. 0 / 'Not Assessed' if trainee has neither declared nor been assessed on that competency.
 *
 * Gap = max(requiredNumericLevel - currentNumericLevel, 0)
 */
export function calculateDesignationSkillGaps(
  traineeCompetencies: TraineeCompetency[],
  designation?: OrgDesignation | null,
  catalog: CatalogCompetency[] = []
): RoleSkillGapRecord[] {
  if (!designation || !designation.requiredCompetencies || designation.requiredCompetencies.length === 0) {
    // Fallback if trainee has no designation assigned: evaluate declared competencies against target levels
    return (traineeCompetencies || []).map((comp) => {
      let currentNumericLevel: 0 | 1 | 2 | 3 | 4 = 0;
      let currentLevel: SkillProficiencyScaleLevel = 'Not Assessed';
      let currentSource: 'Assessed' | 'Declared' | 'Not Assessed' = 'Not Assessed';

      if (comp.latestAssessedLevel && comp.latestAssessedNumericLevel) {
        currentLevel = comp.latestAssessedLevel;
        currentNumericLevel = comp.latestAssessedNumericLevel;
        currentSource = 'Assessed';
      } else if (comp.level) {
        currentLevel = comp.level;
        currentNumericLevel = comp.numericLevel || LEVEL_TO_NUMERIC[comp.level] || 1;
        currentSource = 'Declared';
      }

      const reqLevel: SkillProficiencyLevel = comp.targetLevel || 'Advanced';
      const reqNumeric: 1 | 2 | 3 | 4 = comp.targetNumericLevel || LEVEL_TO_NUMERIC[reqLevel] || 3;
      const gap = Math.max(0, reqNumeric - currentNumericLevel);

      let status: RoleSkillGapRecord['status'] = 'Meets Target';
      if (gap === 1) status = 'Development Needed';
      else if (gap === 2) status = 'Significant Development Needed';
      else if (gap >= 3) status = 'High Development Need';

      let priority: RoleSkillGapRecord['priority'] = 'Low';
      if (gap === 1) priority = 'Medium';
      else if (gap === 2) priority = 'High';
      else if (gap >= 3) priority = 'Critical';

      const catalogComp = catalog.find(c => c && (c.id === comp.competencyId || (c.name && comp.name && c.name.toLowerCase() === comp.name.toLowerCase())));

      return {
        competencyId: comp.competencyId || comp.id,
        competencyName: comp.name || 'General Competency',
        category: comp.category || catalogComp?.category || 'Technical',
        requiredLevel: reqLevel,
        requiredNumericLevel: reqNumeric,
        currentLevel,
        currentNumericLevel,
        currentSource,
        gap,
        status,
        priority
      };
    });
  }

  // Primary path: Calculate against Designation Required Competencies
  return designation.requiredCompetencies.map((req) => {
    // Search trainee records for matching competency (by ID or exact name)
    const match = (traineeCompetencies || []).find(
      (c) => c && ((c.competencyId && c.competencyId === req.competencyId) ||
             (c.id && c.id === req.competencyId) ||
             (c.name && req.competencyName && c.name.toLowerCase() === req.competencyName.toLowerCase()))
    );

    let currentNumericLevel: 0 | 1 | 2 | 3 | 4 = 0;
    let currentLevel: SkillProficiencyScaleLevel = 'Not Assessed';
    let currentSource: 'Assessed' | 'Declared' | 'Not Assessed' = 'Not Assessed';

    if (match) {
      if (match.latestAssessedLevel && match.latestAssessedNumericLevel) {
        currentLevel = match.latestAssessedLevel;
        currentNumericLevel = match.latestAssessedNumericLevel;
        currentSource = 'Assessed';
      } else if (match.level) {
        currentLevel = match.level;
        currentNumericLevel = match.numericLevel || LEVEL_TO_NUMERIC[match.level] || 1;
        currentSource = 'Declared';
      }
    }

    const gap = Math.max(0, req.requiredNumericLevel - currentNumericLevel);

    // Deterministic Gap Status
    let status: RoleSkillGapRecord['status'] = 'Meets Target';
    if (gap === 1) status = 'Development Needed';
    else if (gap === 2) status = 'Significant Development Needed';
    else if (gap >= 3) status = 'High Development Need';

    // Priority derivation using organizational requirement signal + gap
    let priority: RoleSkillGapRecord['priority'] = 'Low';
    const rawPriority = (req.priority || '').toLowerCase();

    if (rawPriority === 'critical' || (rawPriority === 'high' && gap >= 2)) {
      priority = 'Critical';
    } else if (rawPriority === 'high' || (rawPriority === 'medium' && gap >= 2)) {
      priority = 'High';
    } else if (rawPriority === 'medium' || (rawPriority === 'low' && gap >= 1)) {
      priority = 'Medium';
    } else if (gap === 0) {
      priority = 'Low';
    } else {
      priority = gap >= 3 ? 'Critical' : gap === 2 ? 'High' : gap === 1 ? 'Medium' : 'Low';
    }

    const catalogComp = catalog.find(c => c.id === req.competencyId);

    return {
      competencyId: req.competencyId,
      competencyName: req.competencyName,
      category: catalogComp?.category || 'Technical',
      requiredLevel: req.requiredLevel,
      requiredNumericLevel: req.requiredNumericLevel,
      currentLevel,
      currentNumericLevel,
      currentSource,
      gap,
      status,
      priority,
      requirementPriority: req.priority
    };
  });
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

