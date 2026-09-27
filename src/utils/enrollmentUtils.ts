/**
 * Project Kuma - Phase 3F Training Enrollment & Completion Lifecycle Engine
 */

import { TrainingEnrollment, TeacherAssignment, UserSettings, TrainingCertificate } from '../types';
import { issueCertificateForCompletion } from './certificateUtils';

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
    completedAt: '2026-09-25',
    quizPassed: true,
    certificateId: 'KUMA-2026-DA10199X'
  }
];

/**
 * Returns all stored training enrollments.
 */
export function getAllEnrollments(): TrainingEnrollment[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(ENROLLMENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to parse stored enrollments:', err);
    }
  }

  return inMemoryEnrollments;
}

/**
 * Returns enrollments for a specific user ID.
 */
export function getUserEnrollments(userId: string): TrainingEnrollment[] {
  const list = getAllEnrollments();
  return list.filter((e) => e.userId === userId || userId === 'all' || !e.userId);
}

/**
 * Gets a single enrollment record for a user and course.
 */
export function getEnrollmentByCourse(userId: string, courseId: string): TrainingEnrollment | null {
  const list = getAllEnrollments();
  return list.find((e) => (e.userId === userId || !e.userId) && e.courseId === courseId) || null;
}

/**
 * Explicitly enrolls a trainee in a training program.
 * Rule: Duplicate enrollment for the same trainee and course is strictly prevented.
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

  // Prevent duplicate enrollment
  if (existing) {
    return existing;
  }

  const today = new Date().toISOString().split('T')[0];
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
    completionRate: 0
  };

  const updated = [newEnrollment, ...enrollments];
  inMemoryEnrollments = updated;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save enrollment:', err);
    }
  }

  return newEnrollment;
}

/**
 * Updates progress and evaluates completion requirements.
 * When completionRate reaches 100% (and assessment passed if required),
 * status becomes 'completed' and a certificate is automatically issued!
 */
export function updateEnrollmentProgress(
  userId: string,
  userProfile: UserSettings['profile'],
  course: TeacherAssignment,
  progressPercentage: number,
  quizPassed: boolean = true
): { enrollment: TrainingEnrollment; certificate?: TrainingCertificate } {
  const enrollments = getAllEnrollments();
  let enrollment = enrollments.find(
    (e) => (e.userId === userId || e.userEmail === userProfile.emailAddress) && e.courseId === course.id
  );

  // If not enrolled yet, create enrollment first
  if (!enrollment) {
    enrollment = enrollInCourse(userId, userProfile, course);
  }

  const roundedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
  let newStatus: 'enrolled' | 'in_progress' | 'completed' = enrollment.status;
  let cert: TrainingCertificate | undefined = undefined;
  let completedDate = enrollment.completedAt;

  if (roundedProgress >= 100 && quizPassed) {
    newStatus = 'completed';
    if (!completedDate) {
      completedDate = new Date().toISOString().split('T')[0];
    }
    // Issue Certificate automatically
    cert = issueCertificateForCompletion(userProfile, course, enrollment.id);
    enrollment.certificateId = cert.id;
  } else if (roundedProgress > 0) {
    newStatus = 'in_progress';
  }

  const updatedEnrollment: TrainingEnrollment = {
    ...enrollment,
    completionRate: roundedProgress,
    status: newStatus,
    quizPassed: quizPassed,
    completedAt: completedDate,
    certificateId: cert ? cert.id : enrollment.certificateId
  };

  const nextList = enrollments.map((e) => (e.id === updatedEnrollment.id ? updatedEnrollment : e));
  inMemoryEnrollments = nextList;

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(nextList));
    } catch (err) {
      console.warn('Failed to update enrollment progress:', err);
    }
  }

  return { enrollment: updatedEnrollment, certificate: cert };
}
