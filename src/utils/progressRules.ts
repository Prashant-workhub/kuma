/**
 * Project Kuma - Pure Module Progress & Completion Rules Engine
 * Configurable per module type (video, document, presentation, text).
 */

export type ModuleType = 'video' | 'document' | 'presentation' | 'pdf' | 'ppt' | 'text' | 'quiz' | string;

export interface ModuleActivityState {
  watchPercentage?: number; // e.g. 0-100 for video
  viewTimeSeconds?: number; // e.g. time spent for document/presentation
  minViewTimeSeconds?: number; // threshold in seconds
  scrolledToBottom?: boolean; // for document/presentation
  explicitMarkComplete?: boolean; // for text modules
  completed?: boolean;
}

export interface ModuleDefinition {
  id: string;
  title?: string;
  type?: ModuleType;
  minWatchPercentage?: number; // default 90
  minViewTimeSeconds?: number; // default 30
}

export interface CourseProgressSummary {
  completedCount: number;
  totalCount: number;
  percent: number;
  isContentComplete: boolean;
}

export interface CourseCompletionEvaluation {
  status: 'enrolled' | 'in_progress' | 'completed';
  percent: number;
  isContentComplete: boolean;
  isAssessmentUnlocked: boolean;
  isCourseCompleted: boolean;
}

/**
 * Pure function evaluating whether a module's activity satisfies completion criteria.
 * - Video: watched >= 90% (or minWatchPercentage)
 * - Document/Presentation/PDF/PPT: view time >= 30s (or minViewTimeSeconds) OR scrolledToBottom === true
 * - Text: explicit mark complete (explicitMarkComplete === true)
 */
export function isModuleComplete(
  module: ModuleDefinition,
  activity?: ModuleActivityState | boolean | null
): boolean {
  if (activity === true) return true;
  if (!activity || typeof activity !== 'object') return false;

  const type = (module.type || 'text').toLowerCase();

  if (type === 'video') {
    const threshold = module.minWatchPercentage ?? 90;
    return (activity.watchPercentage ?? 0) >= threshold;
  }

  if (type === 'document' || type === 'presentation' || type === 'pdf' || type === 'ppt') {
    const minTime = module.minViewTimeSeconds ?? activity.minViewTimeSeconds ?? 30;
    const viewTimeSatisfied = (activity.viewTimeSeconds ?? 0) >= minTime;
    return viewTimeSatisfied || activity.scrolledToBottom === true;
  }

  if (type === 'text') {
    return activity.explicitMarkComplete === true;
  }

  // Generic fallback if explicitMarkComplete or completed boolean passed
  return (
    activity.completed === true ||
    activity.explicitMarkComplete === true ||
    (activity.watchPercentage ?? 0) >= (module.minWatchPercentage ?? 90)
  );
}

/**
 * Summarizes course progress across all syllabus modules.
 * Recomputes percent from module progress only.
 */
export function summarizeCourseModuleProgress(
  syllabus: ModuleDefinition[] = [],
  moduleProgress: Record<string, boolean | ModuleActivityState> = {}
): CourseProgressSummary {
  const totalCount = syllabus.length;
  if (totalCount === 0) {
    return { completedCount: 0, totalCount: 0, percent: 0, isContentComplete: false };
  }

  let completedCount = 0;
  for (const item of syllabus) {
    const act = moduleProgress[item.id];
    if (isModuleComplete(item, act)) {
      completedCount++;
    }
  }

  const percent = Math.round((completedCount / totalCount) * 100);
  const isContentComplete = completedCount === totalCount;

  return {
    completedCount,
    totalCount,
    percent,
    isContentComplete
  };
}

/**
 * Evaluates overall course completion status.
 * - Course status becomes 'completed' ONLY when ALL required modules are complete
 *   AND (if course requires an assessment) assessment attempt has passed === true.
 */
export function evaluateCourseCompletionStatus(
  syllabus: ModuleDefinition[] = [],
  moduleProgress: Record<string, boolean | ModuleActivityState> = {},
  hasRequiredAssessment: boolean = false,
  assessmentPassed: boolean = false
): CourseCompletionEvaluation {
  const summary = summarizeCourseModuleProgress(syllabus, moduleProgress);

  const isAssessmentUnlocked = summary.isContentComplete;
  let isCourseCompleted = false;

  if (hasRequiredAssessment) {
    isCourseCompleted = summary.isContentComplete && assessmentPassed === true;
  } else {
    isCourseCompleted = summary.isContentComplete;
  }

  let status: 'enrolled' | 'in_progress' | 'completed' = 'enrolled';
  if (isCourseCompleted) {
    status = 'completed';
  } else if (summary.percent > 0) {
    status = 'in_progress';
  }

  return {
    status,
    percent: summary.percent,
    isContentComplete: summary.isContentComplete,
    isAssessmentUnlocked,
    isCourseCompleted
  };
}
