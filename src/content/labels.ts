/**
 * Project Kuma - Centralized Copy & Domain Status Vocabulary
 * Sentence case everywhere, no academic terms (student, semester, faculty, lecture),
 * consistent domain terms: trainee, trainer, course, module, assessment, competency.
 */

export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed';
export type AssessmentStatus = 'locked' | 'available' | 'passed' | 'not_passed';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CertificateStatus = 'valid' | 'revoked';

export interface StatusConfig {
  label: string;
  variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Standardized status mappings across all application roles.
 */
export const STATUS_VOCABULARY = {
  enrollment: {
    not_started: { label: 'Not started', variant: 'neutral' },
    in_progress: { label: 'In progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
  } as Record<EnrollmentStatus, StatusConfig>,

  assessment: {
    locked: { label: 'Locked', variant: 'neutral' },
    available: { label: 'Available', variant: 'info' },
    passed: { label: 'Passed', variant: 'success' },
    not_passed: { label: 'Not passed', variant: 'danger' },
  } as Record<AssessmentStatus, StatusConfig>,

  course: {
    draft: { label: 'Draft', variant: 'neutral' },
    published: { label: 'Published', variant: 'success' },
    archived: { label: 'Archived', variant: 'warning' },
  } as Record<CourseStatus, StatusConfig>,

  user: {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  } as Record<UserApprovalStatus, StatusConfig>,

  certificate: {
    valid: { label: 'Valid', variant: 'success' },
    revoked: { label: 'Revoked', variant: 'danger' },
  } as Record<CertificateStatus, StatusConfig>,
};

/**
 * Shared Button Labels & Standardized Copy
 */
export const LABELS = {
  actions: {
    save: 'Save changes',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    remove: 'Remove',
    edit: 'Edit',
    create: 'Create',
    add: 'Add',
    apply: 'Apply filters',
    reset: 'Reset',
    retry: 'Retry',
    search: 'Search',
    export: 'Export CSV',
    import: 'Import CSV',
    approve: 'Approve',
    reject: 'Reject',
    revoke: 'Revoke certificate',
    resume: 'Resume learning',
    viewCourse: 'View course',
    takeAssessment: 'Take assessment',
    viewDetails: 'View details',
    backToDashboard: 'Back to overview',
  },

  forms: {
    emailPlaceholder: 'name@workplace.gov.in',
    passwordPlaceholder: 'Enter your password',
    emailError: 'Enter a valid work email address.',
    passwordError: 'Password must be at least 8 characters long.',
    requiredError: 'This field is required.',
  },

  emptyStates: {
    noCoursesTitle: 'No courses found',
    noCoursesDesc: 'You are not enrolled in any courses yet. Explore available training programs to begin learning.',
    noAssessmentsTitle: 'No assessments available',
    noAssessmentsDesc: 'There are no active competency evaluations assigned at this time.',
    noCertificatesTitle: 'No certificates issued',
    noCertificatesDesc: 'Complete required course modules and pass the final assessment to earn your digital certificate.',
    noTraineesTitle: 'No trainees found',
    noTraineesDesc: 'No trainee records match your selected filter criteria.',
    noAuditTitle: 'No audit records',
    noAuditDesc: 'No administrative governance events recorded.',
  },

  errors: {
    genericTitle: 'Something went wrong',
    genericDesc: 'An error occurred while loading data. Please check your connection and try again.',
    networkError: 'Unable to connect to capacity server. Retrying offline outbox sync.',
  },
};
