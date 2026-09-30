/**
 * Project Kuma — Canonical Firestore Data Models (Phase B)
 *
 * This file is the single source of truth for Firestore document shapes.
 * Every collection writes and reads should align with these types.
 *
 * Storage Responsibility:
 *   Firebase Auth  → Identity (UID, email, provider)
 *   Firestore      → Structured application data (these models)
 *   Azure Blob     → Binary files (certificates PDFs, profile images, course materials)
 *   IndexedDB      → Offline queue / pending operations (see offlineOutbox.ts)
 *   localStorage   → Non-critical client preferences only
 */

import type {
  SkillProficiencyLevel,
  CompetencyCategory,
  SkillProficiencyScaleLevel,
  CompetencyAttemptHistoryItem,
} from '../types';

// ============================================================================
// 1. COMMON USER PROFILE  —  users/{uid}
// ============================================================================

/** Role values used across the system. */
export type KumaRole = 'trainee' | 'trainer' | 'admin';

/**
 * Canonical user profile stored in `users/{uid}`.
 *
 * The canonical field name is listed first. Legacy aliases (e.g. `phone_number`,
 * `school_or_university`) are maintained for backward compatibility — write
 * paths must set BOTH the canonical AND legacy field so older clients still
 * work. Read paths should prefer the canonical field.
 */
export interface UserProfileDocument {
  uid: string;
  role: string; // KumaRole or legacy ('student', 'faculty', 'teacher')
  fullName: string;
  email: string;
  phone: string;
  profilePhotoUrl: string;
  organization: string;
  department: string;
  designation: string;
  /** Reference IDs for org structure lookups (may be empty for legacy profiles). */
  organizationId?: string;
  departmentId?: string;
  designationId?: string;
  yearsOfExperience: number;
  qualification: string;
  domain?: string;
  bio: string;
  skills: any[]; // TraineeSkill[] or string[]
  competencies: any[]; // TraineeCompetency[] or TrainerCompetencyItem[]
  certifications?: any[];
  status?: 'active' | 'suspended';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  primaryTrainerId?: string;
  onboarding_completed?: boolean;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  lastLoginAt?: any; // Firestore Timestamp

  // --- Legacy aliases (written for backward compat, prefer canonical above) ---
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  school_or_university?: string;
  experienceYears?: number;
  profile_image_url?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  updated_at?: any;
  created_at?: any;
  student_uid?: string;
  // Trainer-specific fields stored inline in the same document
  trainerRole?: string;
  areaOfExpertise?: string;
  specialization?: string;
  trainerExperience?: string;
  trainingPrograms?: string[];
  trainingTopics?: string[];
  preferredTrainingMode?: string;
  // AI / subscription / theme (non-critical settings stored here for convenience)
  ai_provider?: string;
  selected_model?: string;
  api_key?: string;
  theme?: 'light' | 'dark';
  subscription?: any;
  teacherCode?: string;
  country_code?: string;
}

// ============================================================================
// 2. TRAINEE PROFILE PROJECTION  —  traineeProfiles/{uid}
// ============================================================================

export interface TraineeProfileDocument {
  uid: string;
  primaryTrainerId?: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  department: string;
  designation: string;
  organizationId?: string;
  departmentId?: string;
  designationId?: string;
  yearsOfExperience: number;
  qualification: string;
  domain: string;
  bio: string;
  skills: any[];
  competencies: TraineeCompetencyRecord[];
  updatedAt?: any;
}

/**
 * Canonical trainee competency record.
 *
 * `assessmentHistory` is capped at MAX_COMPETENCY_HISTORY entries to prevent
 * the parent document from exceeding Firestore's 1 MiB limit.
 */
export const MAX_COMPETENCY_HISTORY = 10;

export interface TraineeCompetencyRecord {
  id: string;
  competencyId?: string;
  name: string;
  category?: CompetencyCategory;
  level: SkillProficiencyLevel;
  numericLevel?: 1 | 2 | 3 | 4;
  description?: string;
  latestAssessedLevel?: SkillProficiencyLevel;
  latestAssessedNumericLevel?: 1 | 2 | 3 | 4;
  latestScorePercentage?: number;
  lastAssessedDate?: string;
  /** Capped at MAX_COMPETENCY_HISTORY most recent entries. */
  assessmentHistory?: CompetencyAttemptHistoryItem[];
  targetLevel?: SkillProficiencyLevel;
  targetNumericLevel?: 1 | 2 | 3 | 4;
}

// ============================================================================
// 3. TRAINER PROFILE PROJECTION  —  trainerProfiles/{uid}
// ============================================================================

export interface TrainerProfileDocument {
  uid: string;
  fullName: string;
  // email and phone are OMITTED from this public projection
  organization: string;
  department: string;
  designation: string;
  organizationId?: string;
  departmentId?: string;
  designationId?: string;
  yearsOfExperience: number;
  qualification: string;
  bio: string;
  areaOfExpertise: string;
  specialization: string;
  skills: string[];
  trainerExperience: string;
  profilePhoto: string;
  competencies: TrainerCompetencyRecord[];
  trainingPrograms: string[];
  trainingTopics: string[];
  preferredTrainingMode: 'Online' | 'Offline' | 'Hybrid';
  certifications: string[];
  status?: 'pending' | 'active' | 'suspended' | 'rejected';
  updatedAt?: any;
}

export interface TrainerCompetencyRecord {
  id: string;
  name: string;
  category?: CompetencyCategory;
  description?: string;
  level: SkillProficiencyLevel;
  canTrain: boolean;
  verified?: boolean;
}

// ============================================================================
// 4. ORGANIZATION STRUCTURE
// ============================================================================

/** competencyCatalog/{competencyId} */
export interface CompetencyCatalogDocument {
  id: string;
  name: string;
  description: string;
  category: CompetencyCategory;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/** departments/{departmentId} */
export interface DepartmentDocument {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  isActive: boolean;
  createdAt?: string;
}

/** designations/{designationId} */
export interface DesignationDocument {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  description?: string;
  organizationId?: string;
  isActive: boolean;
  requiredCompetencies: DesignationRequirement[];
  createdAt?: string;
}

export interface DesignationRequirement {
  competencyId: string;
  competencyName: string;
  requiredLevel: SkillProficiencyLevel;
  requiredNumericLevel: 1 | 2 | 3 | 4;
  priority?: 'high' | 'medium' | 'low';
}

// ============================================================================
// 5. TRAINER-TRAINEE RELATIONSHIP  —  trainer_assignments/{id}
// ============================================================================

export interface TrainerAssignmentDocument {
  id: string;
  traineeId: string;
  traineeName: string;
  traineeEmail?: string;
  trainerId: string;
  trainerName: string;
  trainerEmail?: string;
  organizationId?: string;
  status: 'Active' | 'Completed' | 'Rejected';
  createdAt: string;
  updatedAt?: any;
}

// ============================================================================
// 6. TRAINING PROGRAMS  —  trainingPrograms/{id}
// ============================================================================

export interface TrainingProgramDocument {
  id: string;
  trainerId: string;
  organization: string;
  organizationId?: string;
  status: 'draft' | 'published' | 'archived';
  courseCode: string;
  courseName: string;
  subject: string;
  semester?: string;
  students: number;
  completionRate: number;
  accent: 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose';
  syllabus: { id: string; title: string; done: boolean }[];
  competencyIds: string[];
  competencyNames: string[];
  description: string;
  duration: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// ============================================================================
// 7. ENROLLMENTS  —  trainingEnrollments/{enr_{traineeUid}_{programId}}
// ============================================================================

export interface EnrollmentDocument {
  id: string;
  userId: string; // traineeId
  trainerId?: string;
  userName?: string;
  userEmail?: string;
  courseId: string; // trainingProgramId
  courseCode: string;
  courseName: string;
  subject?: string;
  organizationId?: string;
  enrolledAt: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
  completionRate: number;
  moduleProgress?: Record<string, boolean>;
  completedAt?: string;
  quizPassed?: boolean;
  certificateId?: string;
  assessmentAttemptId?: string;
  updatedAt?: any;
}

// ============================================================================
// 8. ASSESSMENTS
// ============================================================================

/** assessments/{assessmentId} */
export interface AssessmentDocument {
  id: string;
  title: string;
  topic: string;
  trainerId: string;
  organization?: string;
  competencyId?: string;
  competencyName?: string;
  competencyIds?: string[];
  competencyNames?: string[];
  questionsCount: number;
  estimatedTime: string;
  passingScore?: number;
  questions: any[];
  publicationStatus?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** assessmentAssignments/{traineeUid}_{assessmentId} */
export interface AssessmentAssignmentDocument {
  id: string;
  assessmentId: string;
  traineeId: string;
  trainerId: string;
  trainingProgramId?: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'evaluated';
  attemptStatus: 'pending' | 'submitted';
  assignedAt: any;
  attemptId?: string;
  submittedAt?: any;
  deadline?: string;
}

/** assessmentAttempts/{attemptId} */
export interface AssessmentAttemptDocument {
  id: string;
  userId: string;
  trainerId?: string;
  assignmentId?: string;
  trainingProgramId?: string;
  userName: string;
  quizId: string;
  quizTitle?: string;
  subject: string;
  topic: string;
  competencyId?: string;
  competencyName?: string;
  competencyIds?: string[];
  competencyNames?: string[];
  score: number;
  totalQuestions: number;
  scorePercentage?: number;
  accuracy: number;
  passed: boolean;
  assessedLevel?: SkillProficiencyLevel;
  assessedNumericLevel?: 1 | 2 | 3 | 4;
  competencyResults?: any[];
  completedAt: string;
  submittedAt?: any;
}

// ============================================================================
// 9. CERTIFICATES
// ============================================================================

/** userCertificates/{certificateId} */
export interface CertificateDocument {
  id: string; // KUMA-YYYY-XXXXXXXX
  userId: string;
  userName: string;
  userEmail?: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  organization: string;
  department?: string;
  designation?: string;
  issueDate: string;
  completionDate: string;
  verified: boolean;
  verificationUrl: string;
  competenciesAddressed: string[];
  enrollmentId?: string;
  assessmentAttemptId?: string;
  verificationIdentifier: string;
  blobPath?: string; // Path to PDF in Azure Blob
  status?: 'active' | 'revoked';
}

/** certificateVerifications/{certificateId} — Public, no PII */
export interface CertificateVerificationDocument {
  certificateId: string;
  traineeName: string;
  trainingProgramName: string;
  courseCode: string;
  organization: string;
  issueDate: string;
  completionDate: string;
  competenciesAddressed: string[];
  verificationIdentifier: string;
  verificationStatus: 'valid' | 'revoked';
}

// ============================================================================
// 10. FILE METADATA  —  files/{fileId}  (Phase I)
// ============================================================================

export type FilePurpose =
  | 'profile_photo'
  | 'certificate'
  | 'learning_resource'
  | 'course_material'
  | 'assessment_asset'
  | 'organization_document'
  | 'transcript'
  | 'other';

export interface FileMetadataDocument {
  fileId: string;
  ownerId: string;
  organizationId?: string;
  container: string;
  blobPath: string;
  fileName: string;
  contentType: string;
  size: number;
  purpose: FilePurpose;
  associatedDocId?: string; // e.g. lectureId, certificateId
  associatedCollection?: string; // e.g. 'userCertificates', 'trainingPrograms'
  createdAt: any;
  updatedAt?: any;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
}

// ============================================================================
// 11. SKILL GAP SNAPSHOT (calculated, optionally persisted)
// ============================================================================

export interface SkillGapSnapshotDocument {
  traineeId: string;
  designationId?: string;
  records: SkillGapRecordEntry[];
  calculatedAt: string;
  source: 'designation' | 'self_declared';
}

export interface SkillGapRecordEntry {
  competencyId: string;
  competencyName: string;
  category?: CompetencyCategory;
  requiredLevel: SkillProficiencyLevel;
  requiredNumericLevel: 1 | 2 | 3 | 4;
  currentLevel: SkillProficiencyScaleLevel;
  currentNumericLevel: 0 | 1 | 2 | 3 | 4;
  currentSource: 'Assessed' | 'Declared' | 'Not Assessed';
  gap: number;
  status: string;
  priority: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Caps an assessmentHistory array at MAX_COMPETENCY_HISTORY, keeping the
 * most recent entries. Returns a NEW array (never mutates the input).
 */
export function capAssessmentHistory(
  history: CompetencyAttemptHistoryItem[] | undefined
): CompetencyAttemptHistoryItem[] {
  if (!history || history.length === 0) return [];
  if (history.length <= MAX_COMPETENCY_HISTORY) return [...history];

  // Sort by date descending, keep most recent N
  const sorted = [...history].sort((a, b) => {
    const dateA = new Date(a.attemptDate || 0).getTime();
    const dateB = new Date(b.attemptDate || 0).getTime();
    return dateB - dateA;
  });
  return sorted.slice(0, MAX_COMPETENCY_HISTORY);
}

/**
 * Builds the canonical + legacy field set for a profile save, ensuring
 * backward compatibility while normalizing to canonical field names.
 */
export function normalizeProfileFields(profile: Partial<UserProfileDocument>): Record<string, any> {
  const out: Record<string, any> = { ...profile };

  // Canonical → Legacy aliases (write both directions)
  if (profile.phone !== undefined) {
    out.phone_number = profile.phone;
  }
  if (profile.organization !== undefined) {
    out.school_or_university = profile.organization;
  }
  if (profile.yearsOfExperience !== undefined) {
    out.experienceYears = profile.yearsOfExperience;
  }
  if (profile.profilePhotoUrl !== undefined) {
    out.profile_image_url = profile.profilePhotoUrl;
    out.avatarUrl = profile.profilePhotoUrl;
    out.profilePhoto = profile.profilePhotoUrl;
  }

  return out;
}
