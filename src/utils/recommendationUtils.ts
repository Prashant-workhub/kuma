/**
 * Project Kuma - Phase 3E Training Recommendation System
 * Deterministic Rule-Based Recommendation Engine
 */

import { TraineeCompetency, CatalogCompetency, TeacherAssignment, Source } from '../types';
import { calculateSkillGap, SkillGapAnalysisResult } from './competencyUtils';

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
 * Deterministic recommendation engine for Phase 3E.
 * Rules:
 * 1. Find trainee competencies with Skill Gap > 0. (Zero gap competencies are excluded)
 * 2. Find active courses (course.isActive !== false) associated with those competencies.
 * 3. Validate that course competencyIds match active catalog competencies if catalog provided.
 * 4. Rank recommendations:
 *    - Highest priority: Courses matching the largest skill gap (maxGap descending).
 *    - Secondary priority: Total gap sum (totalGapSum descending).
 *    - Tertiary priority: Alphabetical order.
 * 5. Prevent duplicate recommendations: Each course appears ONCE with all its matched competencies listed.
 * 6. Handle completion status:
 *    - If completed (progress === 100 or completed flag), exclude from recommendations.
 *    - If started (progress > 0 and < 100), flag as 'in_progress'.
 */
export function getTrainingRecommendations(
  traineeCompetencies: TraineeCompetency[],
  courses: TeacherAssignment[],
  learningResources: Source[] = [],
  catalogCompetencies: CatalogCompetency[] = [],
  userProgressMap: Record<string, { completionRate?: number; status?: 'not_started' | 'in_progress' | 'completed' }> = {}
): {
  recommendedCourses: TrainingRecommendation[];
  recommendedResources: ResourceRecommendation[];
  activeGaps: { comp: TraineeCompetency; analysis: SkillGapAnalysisResult }[];
} {
  // 1. Identify active catalog IDs that are currently active (isActive !== false)
  const activeCatalogIds = new Set(
    catalogCompetencies.length > 0
      ? catalogCompetencies.filter((c) => c.isActive !== false).map((c) => c.id)
      : []
  );

  // 2. Calculate skill gaps for all trainee competencies
  const gapMap = new Map<string, { comp: TraineeCompetency; analysis: SkillGapAnalysisResult }>();
  const activeGapsList: { comp: TraineeCompetency; analysis: SkillGapAnalysisResult }[] = [];

  traineeCompetencies.forEach((comp) => {
    const analysis = calculateSkillGap(comp);
    const compId = comp.competencyId || comp.id;

    // Check if competency is active in catalog (if catalog exists)
    if (activeCatalogIds.size > 0 && !activeCatalogIds.has(compId)) {
      return; // Skip inactive or uncatalogued competencies
    }

    // Rule: ONLY competencies with Skill Gap > 0 qualify for recommendations!
    if (analysis.gap > 0) {
      gapMap.set(compId, { comp, analysis });
      gapMap.set(comp.name.toLowerCase(), { comp, analysis });
      activeGapsList.push({ comp, analysis });
    }
  });

  // 3. Match and rank Courses
  const recommendedCourses: TrainingRecommendation[] = [];

  courses.forEach((course) => {
    if (course.isActive === false) return; // Ignore inactive courses

    const courseCompIds = course.competencyIds || [];
    const courseCompNames = course.competencyNames || [];

    const matchedGaps: MatchedGapDetail[] = [];
    let maxGap = 0;
    let totalGapSum = 0;

    // Check by ID first
    courseCompIds.forEach((cId) => {
      const match = gapMap.get(cId);
      if (match && !matchedGaps.some((mg) => mg.competencyId === match.comp.competencyId || mg.competencyId === match.comp.id)) {
        matchedGaps.push({
          competencyId: match.comp.competencyId || match.comp.id,
          competencyName: match.comp.name,
          currentLevel: match.analysis.currentLevel,
          targetLevel: match.analysis.targetLevel,
          gap: match.analysis.gap,
        });
        maxGap = Math.max(maxGap, match.analysis.gap);
        totalGapSum += match.analysis.gap;
      }
    });

    // Fallback check by name if no ID match found
    if (matchedGaps.length === 0) {
      courseCompNames.forEach((cName) => {
        const match = gapMap.get(cName.toLowerCase());
        if (match && !matchedGaps.some((mg) => mg.competencyName.toLowerCase() === cName.toLowerCase())) {
          matchedGaps.push({
            competencyId: match.comp.competencyId || match.comp.id,
            competencyName: match.comp.name,
            currentLevel: match.analysis.currentLevel,
            targetLevel: match.analysis.targetLevel,
            gap: match.analysis.gap,
          });
          maxGap = Math.max(maxGap, match.analysis.gap);
          totalGapSum += match.analysis.gap;
        }
      });
    }

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

      // Generate deterministic, transparent reason
      let reason = '';
      if (matchedGaps.length === 1) {
        const mg = matchedGaps[0];
        reason = `Recommended because you have a development gap of ${mg.gap} ${mg.gap === 1 ? 'level' : 'levels'} in ${mg.competencyName}.`;
      } else {
        const gapListStr = matchedGaps.map((mg) => `${mg.competencyName} (${mg.gap} ${mg.gap === 1 ? 'level' : 'levels'})`).join(' and ');
        reason = `Recommended because it addresses your development gaps in ${gapListStr}.`;
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
          competencyId: match.comp.competencyId || match.comp.id,
          competencyName: match.comp.name,
          currentLevel: match.analysis.currentLevel,
          targetLevel: match.analysis.targetLevel,
          gap: match.analysis.gap,
        });
        maxGap = Math.max(maxGap, match.analysis.gap);
      }
    });

    if (matchedGaps.length === 0) {
      resCompNames.forEach((cName) => {
        const match = gapMap.get(cName.toLowerCase());
        if (match) {
          matchedGaps.push({
            competencyId: match.comp.competencyId || match.comp.id,
            competencyName: match.comp.name,
            currentLevel: match.analysis.currentLevel,
            targetLevel: match.analysis.targetLevel,
            gap: match.analysis.gap,
          });
          maxGap = Math.max(maxGap, match.analysis.gap);
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
    activeGaps: activeGapsList,
  };
}
