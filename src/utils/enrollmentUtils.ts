import { TrainingEnrollment, TeacherAssignment, UserSettings, TrainingCertificate, FirestoreEnrollment } from '../types';
import { issueCertificateForCompletion } from './certificateUtils';
import { readJson, writeJson } from './safeStorage';
import { saveEnrollmentToFirestore } from '../services/learningDataService';
import { calculateCompetencyGains } from './competencyDeltaUtils';
import {
  isModuleComplete,
  summarizeCourseModuleProgress,
  evaluateCourseCompletionStatus,
  ModuleDefinition,
  ModuleActivityState
} from './progressRules';

const ENROLLMENT_STORAGE_KEY = 'kuma_user_enrollments';

let inMemoryEnrollments: TrainingEnrollment[] = [
  {
    id: 'enr-c-da101',
    userId: 'user-demo-1',
    userName: 'Trainee Learner',
    userEmail: 'trainee@organization.gov.in',
    courseId: 'c-da101',
    courseCode: 'DA101',
    courseName: 'Advanced Data Analytics & Insights',
    subject: 'Data Analysis',
    enrolledAt: '2026-09-20',
    status: 'completed',
    completionRate: 100,
    moduleProgress: { s1: true, s2: true, s3: true, s4: true },
    completedAt: '2026-09-25',
    quizPassed: true,
    certificateId: 'KUMA-2026-DA10199X'
  }
];

function syncEnrollmentToFirestore(enrollment: TrainingEnrollment): void {
  const moduleProgressDoc: Record<string, { completed: boolean }> = {};
  Object.entries(enrollment.moduleProgress || {}).forEach(([k, v]) => {
    moduleProgressDoc[k] = { completed: v === true || (typeof v === 'object' && v !== null && (v as any).completed === true) };
  });

  const firestoreRecord: FirestoreEnrollment = {
    id: `${enrollment.userId}_${enrollment.courseId}`,
    uid: enrollment.userId,
    courseId: enrollment.courseId,
    status: enrollment.status === 'completed' ? 'completed' : 'active',
    moduleProgress: moduleProgressDoc,
    percent: enrollment.completionRate,
    createdAt: enrollment.enrolledAt,
    updatedAt: new Date().toISOString()
  };
  saveEnrollmentToFirestore(firestoreRecord).catch((err) =>
    console.warn('[enrollmentUtils] Firestore enrollment sync warning:', err)
  );
}

/**
 * Returns all stored training enrollments.
 */
export function getAllEnrollments(): TrainingEnrollment[] {
  const parsed = readJson<TrainingEnrollment[] | null>(ENROLLMENT_STORAGE_KEY, null);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return inMemoryEnrollments;
}

/**
 * Returns enrollments for a specific user ID.
 */
export function getUserEnrollments(userId: string): TrainingEnrollment[] {
  if (!userId) return [];

  const cleanId = userId.trim().toLowerCase();
  const isDemoAccount =
    cleanId === 'user-demo-1' ||
    cleanId === 'trainee-demo-aarav' ||
    cleanId === 'aarav.sharma@capacityconnect.in' ||
    cleanId === 'guest.student@kuma.ai' ||
    cleanId === 'all';

  const list = getAllEnrollments();

  if (isDemoAccount) {
    return list.filter(
      (e) =>
        e.userId === userId ||
        e.userId === 'user-demo-1' ||
        e.userEmail === 'trainee@organization.gov.in' ||
        e.userEmail === 'aarav.sharma@capacityconnect.in' ||
        userId === 'all'
    );
  }

  return list.filter(
    (e) =>
      (e.userId && e.userId.toLowerCase() === cleanId) ||
      (e.userEmail && e.userEmail.toLowerCase() === cleanId)
  );
}

/**
 * Gets a single enrollment record for a user and course.
 */
export function getEnrollmentByCourse(userId: string, courseId: string): TrainingEnrollment | null {
  if (!userId) return null;
  const list = getUserEnrollments(userId);
  return list.find((e) => e.courseId === courseId) || null;
}

/**
 * Explicitly enrolls a trainee in a training program.
 */
export function enrollInCourse(
  userId: string,
  userProfile: UserSettings['profile'],
  course: TeacherAssignment
): TrainingEnrollment {
  const enrollments = getAllEnrollments();
  const existing = enrollments.find(
    (e) => (e.userId === userId || e.userEmail === userProfile.emailAddress) && e.courseId === course.id
  );

  if (existing) {
    return existing;
  }

  const today = new Date().toISOString().split('T')[0];
  const beforeLevels: Record<string, number> = {};
  (userProfile.competencies || []).forEach((c) => {
    beforeLevels[c.id] = c.latestAssessedNumericLevel || c.numericLevel || 1;
  });

  const newEnrollment: TrainingEnrollment = {
    id: `enr-${course.id}-${Date.now()}`,
    userId: userId,
    userName: userProfile.fullName || 'Trainee Learner',
    userEmail: userProfile.emailAddress || 'trainee@organization.gov.in',
    courseId: course.id,
    courseCode: course.courseCode || 'TRN-2026',
    courseName: course.courseName,
    subject: course.subject || 'General Training',
    enrolledAt: today,
    status: 'enrolled',
    completionRate: 0,
    moduleProgress: {},
    beforeCompetencyLevels: beforeLevels
  };

  const updated = [newEnrollment, ...enrollments];
  inMemoryEnrollments = updated;
  writeJson(ENROLLMENT_STORAGE_KEY, updated);

  syncEnrollmentToFirestore(newEnrollment);

  return newEnrollment;
}

/**
 * Updates progress and evaluates completion requirements.
 * Course status becomes 'completed' ONLY when all required modules are complete
 * AND (if course has a required assessment) the assessment has been passed.
 */
export function updateEnrollmentProgress(
  userId: string,
  userProfile: UserSettings['profile'],
  course: TeacherAssignment,
  moduleProgressPercentage: number,
  quizPassed: boolean = false
): { enrollment: TrainingEnrollment; certificate?: TrainingCertificate } {
  let enrollment = getAllEnrollments().find(
    (e) => (e.userId === userId || e.userEmail === userProfile.emailAddress) && e.courseId === course.id
  );

  if (!enrollment) {
    enrollment = enrollInCourse(userId, userProfile, course);
  }

  const enrollments = getAllEnrollments();

  // Completion rate comes strictly from module progress
  const roundedModuleProgress = Math.min(100, Math.max(0, Math.round(moduleProgressPercentage)));
  const isAllModulesComplete = roundedModuleProgress >= 100;
  const isQuizPassed = quizPassed || enrollment.quizPassed === true;

  let newStatus: 'enrolled' | 'in_progress' | 'completed' = enrollment.status;
  let completedDate = enrollment.completedAt;

  // Completion requires BOTH module completion (100%) and passing assessment attempt if required
  if (isAllModulesComplete && isQuizPassed) {
    newStatus = 'completed';
    if (!completedDate) {
      completedDate = new Date().toISOString().split('T')[0];
    }
  } else if (roundedModuleProgress > 0) {
    newStatus = 'in_progress';
  }

  const afterLevels: Record<string, number> = {};
  (userProfile.competencies || []).forEach((c) => {
    afterLevels[c.id] = c.latestAssessedNumericLevel || c.numericLevel || 1;
  });

  const gains = calculateCompetencyGains(
    enrollment.beforeCompetencyLevels || {},
    afterLevels
  );

  const updatedEnrollment: TrainingEnrollment = {
    ...enrollment,
    completionRate: roundedModuleProgress,
    status: newStatus,
    quizPassed: isQuizPassed,
    completedAt: completedDate,
    beforeCompetencyLevels: enrollment.beforeCompetencyLevels || afterLevels,
    competencyGains: newStatus === 'completed' ? gains : enrollment.competencyGains
  };

  const nextList = enrollments.map((e) => (e.id === updatedEnrollment.id ? updatedEnrollment : e));
  inMemoryEnrollments = nextList;
  writeJson(ENROLLMENT_STORAGE_KEY, nextList);

  syncEnrollmentToFirestore(updatedEnrollment);

  return { enrollment: updatedEnrollment };
}

/**
 * Updates a specific module's progress within an enrollment and recomputes completionRate.
 * Validates that moduleId belongs to the course syllabus.
 */
export function updateEnrollmentModuleProgress(
  userId: string,
  userProfile: UserSettings['profile'],
  courseId: string,
  syllabus: ModuleDefinition[],
  moduleId: string,
  activityState: ModuleActivityState | boolean
): { enrollment: TrainingEnrollment; certificate?: TrainingCertificate } {
  const targetModule = syllabus.find((m) => m.id === moduleId);
  if (!targetModule) {
    throw new Error(`Module '${moduleId}' does not belong to course '${courseId}'`);
  }

  let enrollment = getAllEnrollments().find(
    (e) => (e.userId === userId || e.userEmail === userProfile.emailAddress) && e.courseId === courseId
  );

  if (!enrollment) {
    const fakeCourse: TeacherAssignment = {
      id: courseId,
      courseCode: 'TRN-2026',
      courseName: 'Training Program',
      subject: 'Capacity Building'
    };
    enrollment = enrollInCourse(userId, userProfile, fakeCourse);
  }

  const currentModuleProgress: Record<string, any> = { ...(enrollment.moduleProgress || {}) };
  const isComplete = isModuleComplete(targetModule, activityState);
  currentModuleProgress[moduleId] = isComplete;

  const summary = summarizeCourseModuleProgress(syllabus, currentModuleProgress);
  const evaluation = evaluateCourseCompletionStatus(
    syllabus,
    currentModuleProgress,
    true,
    enrollment.quizPassed === true
  );

  let completedDate = enrollment.completedAt;

  if (evaluation.isCourseCompleted) {
    if (!completedDate) {
      completedDate = new Date().toISOString().split('T')[0];
    }
  }

  const updatedEnrollment: TrainingEnrollment = {
    ...enrollment,
    moduleProgress: currentModuleProgress,
    completionRate: summary.percent,
    status: evaluation.status,
    completedAt: completedDate
  };

  const enrollments = getAllEnrollments();
  const nextList = enrollments.map((e) => (e.id === updatedEnrollment.id ? updatedEnrollment : e));
  inMemoryEnrollments = nextList;
  writeJson(ENROLLMENT_STORAGE_KEY, nextList);

  syncEnrollmentToFirestore(updatedEnrollment);

  return { enrollment: updatedEnrollment };
}

