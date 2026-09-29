export interface ModuleProgressSummary {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  contentComplete: boolean;
}

export function summarizeModuleProgress(
  syllabus: ReadonlyArray<{ id: string }>,
  moduleProgress: Record<string, boolean> = {}
): ModuleProgressSummary {
  const totalCount = syllabus.length;
  const completedCount = syllabus.reduce(
    (count, module) => count + (moduleProgress[module.id] === true ? 1 : 0),
    0
  );
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    progressPercentage,
    contentComplete: totalCount > 0 && completedCount === totalCount
  };
}