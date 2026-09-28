/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PageId } from './types';

export const PAGE_TO_PATH_MAP: Record<PageId, string> = {
  landing: '/',
  dashboard: '/dashboard',
  notifications: '/notifications',
  settings: '/settings',
  'help-support': '/help-support',
  pricing: '/pricing',
  profile: '/profile',
  'skill-gap': '/skill-gap',
  certificates: '/certificates',
  'verify-certificate': '/verify/certificate',
  'knowledge-studio': '/knowledge-studio',
  auth: '/auth',
  'faculty-login': '/faculty/login',
  'faculty-dashboard': '/faculty/dashboard',
  'faculty-courses': '/faculty/courses',
  'faculty-course-progress': '/faculty/course-progress',
  'faculty-doubts': '/faculty/doubts',
  'faculty-quiz-analytics': '/faculty/quiz-analytics',
  'faculty-insights': '/faculty/insights',
  'faculty-settings': '/faculty/settings',
  'faculty-learning-analytics': '/faculty/learning-analytics',
  'faculty-lecture-insights': '/faculty/lecture-insights',
  'faculty-announcements': '/faculty/announcements',
  'faculty-activity-center': '/faculty/activity-center',
  'admin-dashboard': '/admin/dashboard',
  'admin-organization': '/admin/organization',
  'admin-trainees': '/admin/trainees',
  'admin-trainers': '/admin/trainers',
  'admin-competencies': '/admin/competencies',
  'admin-training-programs': '/admin/training-programs',
  'admin-assessments': '/admin/assessments',
  'admin-analytics': '/admin/analytics',
  'admin-certificates': '/admin/certificates',
  'admin-settings': '/admin/settings'
};

const PATH_TO_PAGE_MAP: Record<string, PageId> = Object.entries(PAGE_TO_PATH_MAP).reduce(
  (acc, [pageId, path]) => {
    acc[path] = pageId as PageId;
    return acc;
  },
  {} as Record<string, PageId>
);

export function pageIdToPath(pageId: PageId): string {
  return PAGE_TO_PATH_MAP[pageId] || '/dashboard';
}

export function pathToPageId(pathname: string): PageId {
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (PATH_TO_PAGE_MAP[cleanPath]) {
    return PATH_TO_PAGE_MAP[cleanPath];
  }
  // Alias checks
  if (cleanPath === '/landing' || cleanPath === '') {
    return 'landing';
  }
  if (cleanPath.startsWith('/verify/certificate')) {
    return 'verify-certificate';
  }
  if (cleanPath.startsWith('/admin')) {
    const adminSubPath = cleanPath.replace('/admin/', '').replace('/admin', '');
    const candidate = `admin-${adminSubPath || 'dashboard'}` as PageId;
    if (PAGE_TO_PATH_MAP[candidate]) {
      return candidate;
    }
    return 'admin-dashboard';
  }
  if (cleanPath.startsWith('/faculty')) {
    const facultySubPath = cleanPath.replace('/faculty/', '');
    const candidate = `faculty-${facultySubPath}` as PageId;
    if (PAGE_TO_PATH_MAP[candidate]) {
      return candidate;
    }
    return 'faculty-dashboard';
  }
  return 'dashboard';
}
