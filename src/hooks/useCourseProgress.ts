/**
 * Project Kuma - useCourseProgress Hook
 * Exposes percent, next incomplete module, and whether assessment is unlocked for a course.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ModuleDefinition,
  ModuleActivityState,
  isModuleComplete,
  summarizeCourseModuleProgress,
  evaluateCourseCompletionStatus
} from '../utils/progressRules';
import { getEnrollmentByCourse, updateEnrollmentModuleProgress } from '../utils/enrollmentUtils';
import { getPersistentEnrollment, setPersistentModuleProgress } from '../services/capacityConnectService';
import { TeacherAssignment, TrainingEnrollment } from '../types';

export interface UseCourseProgressResult {
  percent: number;
  completedModulesCount: number;
  totalModulesCount: number;
  nextIncompleteModule: ModuleDefinition | null;
  isAssessmentUnlocked: boolean;
  isCourseCompleted: boolean;
  moduleProgress: Record<string, any>;
  enrollment: TrainingEnrollment | null;
  updateModuleActivity: (moduleId: string, activity: ModuleActivityState | boolean) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useCourseProgress(
  courseId: string,
  user?: { uid?: string; emailAddress?: string; email?: string; profile?: any } | null,
  course?: TeacherAssignment | null
): UseCourseProgressResult {
  const [enrollment, setEnrollment] = useState<TrainingEnrollment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const uid = user?.uid || '';
  const userEmail = user?.emailAddress || user?.email || (user?.profile?.emailAddress) || '';
  const isDemoUser = !uid || uid === 'user-demo-1' || userEmail.includes('demo') || userEmail.includes('aarav');
  const lookupUserId = isDemoUser ? (userEmail || 'user-demo-1') : uid;

  const syllabus: ModuleDefinition[] = (course?.syllabus || [
    { id: 's1', title: 'Fundamentals & Foundational Concepts', type: 'text' },
    { id: 's2', title: 'Core Principles & Practical Application', type: 'video' },
    { id: 's3', title: 'Advanced Implementation & Best Practices', type: 'document' },
    { id: 's4', title: 'Case Study & Operational Exercises', type: 'text' }
  ]) as ModuleDefinition[];

  // Fetch enrollment data
  const loadProgress = useCallback(async () => {
    if (!courseId) {
      setEnrollment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isDemoUser) {
        const local = getEnrollmentByCourse(lookupUserId, courseId);
        setEnrollment(local);
      } else {
        const persistent = await getPersistentEnrollment(uid, courseId);
        setEnrollment(persistent);
      }
    } catch (err: any) {
      console.warn('[useCourseProgress] Failed to load enrollment:', err);
      setError(err);
      // Fallback
      setEnrollment(getEnrollmentByCourse(lookupUserId, courseId));
    } finally {
      setLoading(false);
    }
  }, [courseId, uid, lookupUserId, isDemoUser]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const rawModuleProgress: Record<string, any> = enrollment?.moduleProgress || {};

  const summary = summarizeCourseModuleProgress(syllabus, rawModuleProgress);
  const hasAssessment = !!(course?.competencyIds?.length || course?.courseCode);
  const evaluation = evaluateCourseCompletionStatus(
    syllabus,
    rawModuleProgress,
    hasAssessment,
    enrollment?.quizPassed === true
  );

  const nextIncompleteModule = syllabus.find(m => !isModuleComplete(m, rawModuleProgress[m.id])) || null;

  const updateModuleActivity = useCallback(async (moduleId: string, activity: ModuleActivityState | boolean) => {
    if (!courseId) return;

    // Validate module belongs to course
    const targetModule = syllabus.find(m => m.id === moduleId);
    if (!targetModule) {
      throw new Error(`Module '${moduleId}' does not belong to course '${courseId}'`);
    }

    const isComplete = isModuleComplete(targetModule, activity);

    if (isDemoUser || !uid) {
      const userProfile = user?.profile || { fullName: 'Trainee Learner', emailAddress: lookupUserId };
      const updated = updateEnrollmentModuleProgress(lookupUserId, userProfile, courseId, syllabus, moduleId, activity);
      setEnrollment(updated.enrollment);
    } else {
      const userProfile = user?.profile || { fullName: 'Trainee Learner', emailAddress: userEmail };
      const programArg = course ? course : { id: courseId, syllabus };
      const res = await setPersistentModuleProgress(uid, programArg as any, moduleId, isComplete, userProfile);
      setEnrollment(res.enrollment);
    }
  }, [courseId, syllabus, isDemoUser, uid, lookupUserId, userEmail, user?.profile, course]);

  return {
    percent: summary.percent,
    completedModulesCount: summary.completedCount,
    totalModulesCount: summary.totalCount,
    nextIncompleteModule,
    isAssessmentUnlocked: evaluation.isAssessmentUnlocked,
    isCourseCompleted: evaluation.isCourseCompleted,
    moduleProgress: rawModuleProgress,
    enrollment,
    updateModuleActivity,
    loading,
    error
  };
}
