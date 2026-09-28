/**
 * Project Kuma - Phase 3E Training Recommendation System
 * Deterministic Rule-Based Recommendation Engine
 */

import { TraineeCompetency, CatalogCompetency, TeacherAssignment, Source, OrgDesignation, RoleSkillGapRecord } from '../types';
import { calculateSkillGap, calculateDesignationSkillGaps, SkillGapAnalysisResult } from './competencyUtils';

export interface MatchedGapDetail {
  competencyId: string;
  competencyName: string;
  currentLevel: string;
  targetLevel: string;
  gap: number;
}

export interface TrainingRecommendation {
  id: string;
  course: TeacherAssignment;
  matchedGaps: MatchedGapDetail[];
  maxGap: number;
  totalGapSum: number;
  enrollmentStatus: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  reason: string;
}

export interface ResourceRecommendation {
  id: string;
  resource: Source;
  matchedGaps: MatchedGapDetail[];
  maxGap: number;
  reason: string;
}

/**
 * Deterministic recommendation engine for Phase 5 SIH Capacity Connect.
 * Rules:
 * 1. Find trainee designation skill gaps where Gap > 0.
 * 2. Find active courses (course.isActive !== false) associated with those competencies.
 * 3. Filter out completed training (completionRate >= 100).
 * 4. Support multi-competency courses (aggregates all matched gaps per course).
 * 5. Rank by addressed Gap Priority (Critical > High > Medium > Low) and maxGap.
 * 6. Detect unmatched gaps where no training exists ("Training Coverage Gap").
 */
export function getTrainingRecommendations(
  traineeCompetencies: TraineeCompetency[],
  courses: TeacherAssignment[],
  learningResources: Source[] = [],
  catalogCompetencies: CatalogCompetency[] = [],
  userProgressMap: Record<string, { completionRate?: number; status?: 'not_started' | 'in_progress' | 'completed' }> = {},
  designation?: OrgDesignation | null
): {
  recommendedCourses: TrainingRecommendation[];
  recommendedResources: ResourceRecommendation[];
  activeGaps: RoleSkillGapRecord[];
  unmatchedGaps: RoleSkillGapRecord[];
} {
  // 1. Calculate deterministic Designation Skill Gaps
  const designationSkillGaps = calculateDesignationSkillGaps(traineeCompetencies, designation, catalogCompetencies);
  
  // 2. Identify active gaps (where gap > 0)
  const activeGaps = designationSkillGaps.filter(g => g.gap > 0);
  const gapMap = new Map<string, RoleSkillGapRecord>();

  activeGaps.forEach(g => {
    gapMap.set(g.competencyId, g);
    gapMap.set(g.competencyName.toLowerCase(), g);
  });

  // Track matched competency IDs to identify Training Coverage Gaps later
  const matchedCompetencyIds = new Set<string>();

  // 3. Match and rank Courses
  const recommendedCourses: TrainingRecommendation[] = [];

  courses.forEach((course) => {
    if (course.isActive === false) return; // Ignore inactive courses

    const courseCompIds = course.competencyIds || [];
    const courseCompNames = course.competencyNames || [];

    const matchedGaps: MatchedGapDetail[] = [];
    let maxGap = 0;
    let totalGapSum = 0;
    let highestPriorityOrder = 0; // 4=Critical, 3=High, 2=Medium, 1=Low

    const priorityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

    // Check by ID first
    courseCompIds.forEach((cId) => {
      const match = gapMap.get(cId);
      if (match && !matchedGaps.some((mg) => mg.competencyId === match.competencyId)) {
        matchedGaps.push({
          competencyId: match.competencyId,
          competencyName: match.competencyName,
          currentLevel: match.currentLevel,
          targetLevel: match.requiredLevel,
          gap: match.gap,
        });
        matchedCompetencyIds.add(match.competencyId);
        maxGap = Math.max(maxGap, match.gap);
        totalGapSum += match.gap;
        highestPriorityOrder = Math.max(highestPriorityOrder, priorityRank[match.priority] || 1);
      }
    });

    // Fallback check by name if no ID match found
    courseCompNames.forEach((cName) => {
      const match = gapMap.get(cName.toLowerCase());
      if (match && !matchedGaps.some((mg) => mg.competencyName.toLowerCase() === cName.toLowerCase())) {
        matchedGaps.push({
          competencyId: match.competencyId,
          competencyName: match.competencyName,
          currentLevel: match.currentLevel,
          targetLevel: match.requiredLevel,
          gap: match.gap,
        });
        matchedCompetencyIds.add(match.competencyId);
        maxGap = Math.max(maxGap, match.gap);
        totalGapSum += match.gap;
        highestPriorityOrder = Math.max(highestPriorityOrder, priorityRank[match.priority] || 1);
      }
    });

    // Only recommend if course addresses at least ONE active skill gap
    if (matchedGaps.length > 0) {
      const progressInfo = userProgressMap[course.id] || {
        completionRate: course.completionRate || 0,
      };

      const completionRate = progressInfo.completionRate ?? course.completionRate ?? 0;
      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';

      if (progressInfo.status) {
        status = progressInfo.status;
      } else if (completionRate >= 100) {
        status = 'completed';
      } else if (completionRate > 0) {
        status = 'in_progress';
      }

      // Rule: Do not show completed training as active recommendation
      if (status === 'completed') {
        return;
      }

      // Generate deterministic, transparent reason based on actual data
      let reason = '';
      if (matchedGaps.length === 1) {
        const mg = matchedGaps[0];
        reason = `Recommended because it addresses your ${mg.competencyName} competency gap (Current: ${mg.currentLevel} ➔ Required: ${mg.targetLevel}).`;
      } else {
        const gapListStr = matchedGaps.map((mg) => `${mg.competencyName} (Current: ${mg.currentLevel} ➔ Required: ${mg.targetLevel})`).join(', ');
        reason = `Recommended because it addresses ${matchedGaps.length} of your competency gaps: ${gapListStr}.`;
      }

      recommendedCourses.push({
        id: `rec-course-${course.id}`,
        course,
        matchedGaps,
        maxGap,
        totalGapSum,
        enrollmentStatus: status,
        progressPercentage: completionRate,
        reason,
      });
    }
  });

  // Identify active gaps for which NO active matching course exists
  const unmatchedGaps = activeGaps.filter(g => !matchedCompetencyIds.has(g.competencyId));

  // Sort course recommendations:
  // Primary: maxGap descending
  // Secondary: totalGapSum descending
  // Tertiary: courseName ascending
  recommendedCourses.sort((a, b) => {
    if (b.maxGap !== a.maxGap) return b.maxGap - a.maxGap;
    if (b.totalGapSum !== a.totalGapSum) return b.totalGapSum - a.totalGapSum;
    return (a.course.courseName || '').localeCompare(b.course.courseName || '');
  });


  // 4. Match and rank Learning Resources
  const recommendedResources: ResourceRecommendation[] = [];

  learningResources.forEach((res) => {
    const resCompIds = res.competencyIds || [];
    const resCompNames = res.competencyNames || [];

    const matchedGaps: MatchedGapDetail[] = [];
    let maxGap = 0;

    resCompIds.forEach((cId) => {
      const match = gapMap.get(cId);
      if (match) {
        matchedGaps.push({
          competencyId: match.competencyId,
          competencyName: match.competencyName,
          currentLevel: match.currentLevel,
          targetLevel: match.requiredLevel,
          gap: match.gap,
        });
        maxGap = Math.max(maxGap, match.gap);
      }
    });

    if (matchedGaps.length === 0) {
      resCompNames.forEach((cName) => {
        const match = gapMap.get(cName.toLowerCase());
        if (match) {
          matchedGaps.push({
            competencyId: match.competencyId,
            competencyName: match.competencyName,
            currentLevel: match.currentLevel,
            targetLevel: match.requiredLevel,
            gap: match.gap,
          });
          maxGap = Math.max(maxGap, match.gap);
        }
      });
    }

    if (matchedGaps.length > 0) {
      const reason = `Resource recommended for development in ${matchedGaps.map((mg) => mg.competencyName).join(', ')}.`;
      recommendedResources.push({
        id: `rec-res-${res.id}`,
        resource: res,
        matchedGaps,
        maxGap,
        reason,
      });
    }
  });

  recommendedResources.sort((a, b) => b.maxGap - a.maxGap);

  return {
    recommendedCourses,
    recommendedResources,
    activeGaps,
    unmatchedGaps
  };
}

