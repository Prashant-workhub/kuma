/**
 * Project Kuma - Course Provider Service
 * Single isolated access point for training courses so it can easily swap to Firestore in Prompt 12.
 */

import { TeacherAssignment } from '../teacher-portal/types';
import { COURSES } from '../teacher-portal/lib/mockData';

/**
 * Returns available training courses.
 * Currently reads from mockData, isolated behind this provider function for easy swapping.
 */
export function getAvailableCourses(): TeacherAssignment[] {
  return COURSES;
}
