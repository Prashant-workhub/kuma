/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageId =
  | 'landing'
  | 'dashboard'
  | 'notifications'
  | 'settings'
  | 'help-support'
  | 'pricing'
  | 'profile'
  | 'skill-gap'
  | 'certificates'
  | 'verify-certificate'
  | 'find-trainer'
  | 'auth'
  | 'faculty-login'
  | 'faculty-dashboard'
  | 'faculty-courses'
  | 'faculty-course-progress'
  | 'faculty-doubts'
  | 'faculty-quiz-analytics'
  | 'faculty-insights'
  | 'faculty-settings'
  | 'faculty-learning-analytics'
  | 'faculty-lecture-insights'
  | 'faculty-announcements'
  | 'faculty-activity-center'
  | 'admin-dashboard'
  | 'admin-organization'
  | 'admin-trainees'
  | 'admin-trainers'
  | 'admin-competencies'
  | 'admin-training-programs'
  | 'admin-assessments'
  | 'admin-analytics'
  | 'admin-certificates'
  | 'admin-settings';

export interface Citation {
  text: string;
  sourceId: string;
  page?: number;
  timestamp?: string;
  chapter?: string;
}

export interface ChatHistoryRecord {
  lectureId: string;
  chatHistory: { sender: 'user' | 'ai'; text: string; citations?: Citation[] }[];
}

export interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'recording' | 'video';
  size?: string;
  url?: string;
  addedAt: string;
  wordCount?: number;
  competencyIds?: string[];
  competencyNames?: string[];
}

export type RecordingStatus = 'recording' | 'uploaded' | 'failed';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ResourceGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ResourceGenerationError {
  code?: string;
  message?: string;
  provider?: string;
  timestamp?: any;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt?: any;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  professor?: string;
  teacherCode?: string;
  color?: string;
  createdAt?: any;
  archived?: boolean;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;
  subjectCode?: string;
  lectureNumber?: number;
  mapOrder?: number;
  reviewed?: boolean;
  folderId?: string;
  duration?: string;
  pages?: number;
  addedAt: string;
  status: 'recording' | 'uploading' | 'uploaded' | 'transcribing' | 'generating_notes' | 'generated' | 'failed' | 'extracting' | 'analyzing' | 'completed';
  recordingStatus?: RecordingStatus;
  transcriptionStatus?: TranscriptionStatus;
  resourceGenerationStatus?: ResourceGenerationStatus;
  resourceGenerationError?: ResourceGenerationError | null;
  type: 'recording' | 'pdf' | 'ppt' | 'text';
  audioUrl?: string;
  blobPath?: string;
  storageProvider?: string;
  storageVersion?: number;
  geminiModel?: string;
  transcriptionProvider?: 'gemini' | 'browser';
  transcriptionEngine?: string;
  browserLiveTranscript?: string;
  processingTimeMs?: number;
  createdAt?: any;
  uploadedAt?: any;
  processingStartedAt?: any;
  processingCompletedAt?: any;
  transcript?: string;
  summary?: string;
  summaries?: { [key: string]: string };
  notes?: any;
  flashcards?: { q: string; a: string; category?: 'Basic Recall' | 'Concept Understanding' | 'Application Based' }[];
  quiz?: { question: string; options: string[]; correctAnswer: number; explanation: string; difficulty?: 'easy' | 'medium' | 'hard' | 'scenario' | 'application'; sourceCitation?: string }[];
  quizzes?: any[];
  mindMap?: any;
  storedInBlob?: boolean;
  keyConcepts?: { id: string; label: string; desc: string; parent?: string; x: number; y: number; group: string; examples?: string; formula?: string; applications?: string }[];
  weakTopics?: WeakTopic[];
  cleanTranscript?: string;
  sections?: { id: string; title: string; startTime: string; endTime: string; content: string }[];
  timeline?: { time: string; title: string; description: string }[];
  sourceIntelligence?: { keyPeople: string[]; keyTerms: string[]; formulas: string[]; dates: string[]; statistics: string[]; references: string[] };
  presentationBlueprint?: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: any[];
  };
  lastGenerationProvider?: string;
  lastGenerationModel?: string;
  lastGeneratedAt?: any;
  isShared?: boolean;
  sharedByEmail?: string;
  sharedByName?: string;
  sharedAt?: any;
}

export interface WeakTopic {
  id: string;
  topicName: string;
  subject: string;
  masteryScore: number; // percentage
  lastAttempt: string;
  aiDiagnosis: string;
  actionPlan: string[];
}

export interface QuizQuestion {
  id: string;
  type?: 'mcq' | 'true_false' | 'fill_blank' | 'match_following' | 'assertion_reason' | 'scenario_based';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  reason?: string;
  scenario?: string;
  matchLeft?: string[];
  matchRight?: string[];
  correctMatchPairs?: { [key: string]: string };
  explanation?: string;
  sourceCitation?: string;
}

export interface Quiz {
  id: string;
  assignmentId?: string;
  trainerId?: string;
  trainingProgramId?: string;
  title: string;
  topic: string;
  courseCode?: string;
  courseName?: string;
  description?: string;
  questionsCount: number;
  estimatedTime: string;
  passingScore?: number;
  competencyId?: string;
  competencyName?: string;
  competencyIds?: string[];
  competencyNames?: string[];
  questions: QuizQuestion[];
  easyQuestions?: QuizQuestion[];
  mediumQuestions?: QuizQuestion[];
  hardQuestions?: QuizQuestion[];
  score?: number;
  scores?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  status: 'available' | 'completed';
  contextText?: string;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string; // 'Today' | 'Yesterday' | '2 days ago'
  category: 'ai-insights' | 'system' | 'collaboration';
  read: boolean;
  timestamp: string;
  actionLabel?: string;
  actionPage?: PageId;
}

export type SkillProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type CompetencyCategory = 
  | 'Technical' 
  | 'Professional' 
  | 'Communication' 
  | 'Leadership' 
  | 'Management' 
  | 'Digital' 
  | 'Domain Specific';

export interface CatalogCompetency {
  id: string;
  name: string;
  category: CompetencyCategory;
  description: string;
  isActive: boolean;
}

export interface DesignationCompetencyRequirement {
  competencyId: string;
  competencyName: string;
  requiredLevel: SkillProficiencyLevel;
  requiredNumericLevel: 1 | 2 | 3 | 4;
  priority?: 'high' | 'medium' | 'low';
}

export interface OrgDepartment {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface OrgDesignation {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  description?: string;
  isActive: boolean;
  requiredCompetencies: DesignationCompetencyRequirement[];
  createdAt?: string;
}

export type SkillProficiencyScaleLevel = 'Not Assessed' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface RoleSkillGapRecord {
  competencyId: string;
  competencyName: string;
  category?: CompetencyCategory;
  requiredLevel: SkillProficiencyLevel;
  requiredNumericLevel: 1 | 2 | 3 | 4;
  currentLevel: SkillProficiencyScaleLevel;
  currentNumericLevel: 0 | 1 | 2 | 3 | 4;
  currentSource: 'Assessed' | 'Declared' | 'Not Assessed';
  gap: number;
  status: 'Meets Target' | 'Development Needed' | 'Significant Development Needed' | 'High Development Need';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requirementPriority?: 'high' | 'medium' | 'low';
}



export interface TraineeSkill {
  id: string;
  name: string;
  level: SkillProficiencyLevel;
}

export interface CompetencyAttemptHistoryItem {
  id: string;
  quizId: string;
  quizTitle: string;
  subject?: string;
  scorePercentage: number;
  score: number;
  totalQuestions: number;
  assessedLevel: SkillProficiencyLevel;
  assessedNumericLevel: 1 | 2 | 3 | 4;
  passed: boolean;
  attemptDate: string;
}

export interface TraineeCompetency {
  id: string;
  competencyId?: string;
  name: string;
  category?: CompetencyCategory;
  level: SkillProficiencyLevel; // Declared level
  numericLevel?: 1 | 2 | 3 | 4; // Declared numeric level
  description?: string;
  // Phase 3C: Assessed levels (kept strictly separate from declared level)
  latestAssessedLevel?: SkillProficiencyLevel;
  latestAssessedNumericLevel?: 1 | 2 | 3 | 4;
  latestScorePercentage?: number;
  lastAssessedDate?: string;
  assessmentHistory?: CompetencyAttemptHistoryItem[];

  // Phase 3D: Target Competency Levels (kept strictly separate from declared & assessed levels)
  targetLevel?: SkillProficiencyLevel;
  targetNumericLevel?: 1 | 2 | 3 | 4;
}

export interface TraineeCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface UserSettings {
  profile: {
    fullName: string;
    emailAddress: string;
    bio: string;
    avatarUrl: string;
    institution: string;
    role: string;
    organization?: string;
    department?: string;
    designation?: string;
    yearsOfExperience?: number;
    skills?: TraineeSkill[];
    competencies?: TraineeCompetency[];
    certifications?: TraineeCertification[];
    degree?: string;
    qualification?: string;
    domain?: string;
    semester?: string;
    subjects?: string[];
    theme?: 'light' | 'dark';
    firstName?: string;
    lastName?: string;
    countryCode?: string;
    phoneNumber?: string;
    uid?: string;
    onboardingCompleted?: boolean;
    teacherCode?: string;
  };
  subscription: {
    planName: 'BYOK' | 'Premium' | 'Institution';
    price: string;
    billingCycle: 'monthly' | 'yearly';
    nextBillDate: string;
    features: string[];
  };
  integrations: {
    canvasConnected: boolean;
    blackboardConnected: boolean;
    canvasUrl?: string;
    lastSynced?: string;
  };
  aiLevels: {
    proactiveConceptSuggestion: boolean;
    automatedBibliography: boolean;
    highIntensitySynthesis: boolean;
  };
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PricingPlan {
  name: string;
  tierLabel: string;
  price: string;
  period: string;
  tagline: string;
  description: string;
  ctaText: string;
  features: string[];
  isPopular: boolean;
  highlighted: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lectureId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface StudioSlide {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  visualSuggestions: string;
  keyTakeaways: string;
  references: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  type: 'document' | 'media' | 'online' | 'research';
  sourceType: string;
  status: 'processing' | 'indexed' | 'failed' | 'ready';
  content: string;
  url?: string;
  size?: string;
  createdAt: any;
  summary?: string;
  notes?: { title: string; content: string }[];
  flashcards?: { q: string; a: string }[];
  quiz?: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
  keyConcepts?: { id: string; label: string; desc: string; parent?: string; x: number; y: number; group: string }[];
  slides?: StudioSlide[];
  podcastScript?: string;
  cleanTranscript?: string;
  sections?: { id: string; title: string; startTime: string; endTime: string; content: string }[];
  timeline?: { time: string; title: string; description: string }[];
  sourceIntelligence?: { keyPeople: string[]; keyTerms: string[]; formulas: string[]; dates: string[]; statistics: string[]; references: string[] };
  presentationBlueprint?: {
    theme: string;
    purpose: string;
    regenerationLevel: 'quick' | 'balanced' | 'premium';
    qualityScore: number;
    slideCount: number;
    blueprint: any[];
  };
  competencyIds?: string[];
  competencyNames?: string[];
}

export interface SlideBlueprint {
  slideType: 'title' | 'hero' | 'timeline' | 'process' | 'comparison' | 'architecture' | 'hierarchy' | 'metrics' | 'quote' | 'case_study' | 'diagram' | 'mindmap' | 'conclusion';
  title: string;
  objective: string;
  keyPoints: string[];
  imageQuery: string;
  imageUrl?: string;
  layoutPriority: number;
  visualImportance: string;
  wordLimit: number;
  designNotes: string;
}

export type UserRole = 'student' | 'faculty' | 'admin' | 'trainee' | 'trainer';

export interface FacultyProfile {
  uid: string;
  fullName: string;
  emailAddress: string;
  role: 'faculty';
  teacherCode?: string;
  university: string;
  department: string;
  designation: string;
  subjects: string[];
  classes: string[];
  whatsappNumber: string;
  profilePhoto?: string;
  createdAt?: any;
}

export interface TeacherAssignment {
  id: string;
  trainerId?: string;
  organization?: string;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: any;
  updatedAt?: any;
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  teacherPhone?: string;
  subjectId?: string;
  subjectName?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  subject?: string;
  semester?: string;
  students?: number;
  completionRate?: number;
  accent?: 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose';
  syllabus?: { id: string; title: string; done: boolean }[];
  classId?: string;
  university?: string;
  assignedAt?: any;
  // Phase 3E: Competency & Training Mapping
  competencyIds?: string[];
  competencyNames?: string[];
  description?: string;
  duration?: string;
  isActive?: boolean;
}

export interface DoubtItem {
  id: string;
  studentId: string;
  studentName: string;
  studentUniversity?: string;
  studentClass?: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName?: string;
  teacherCode?: string;
  lectureId?: string;
  lectureTitle?: string;
  noteId?: string;
  topic: string;
  question: string;
  selectedText?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: any;
  status: 'NEW' | 'IN REVIEW' | 'ANSWERED' | 'RESOLVED';
  priority?: 'low' | 'medium' | 'high';
  response?: string;
  respondedAt?: any;
}

export interface ClassLearningAlert {
  id: string;
  subject: string;
  topic: string;
  doubtCount: number;
  quizAccuracy: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
  updatedAt: any;
}

export interface QuizAttemptRecord {
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
  passed?: boolean;
  assessedLevel?: SkillProficiencyLevel;
  assessedNumericLevel?: 1 | 2 | 3 | 4;
  completedAt: any;
}

export interface TrainingAssessmentAssignment {
  id: string;
  assessmentId: string;
  traineeId: string;
  trainerId: string;
  trainingProgramId?: string;
  status: 'assigned' | 'submitted';
  attemptStatus: 'pending' | 'submitted';
  assignedAt: any;
  attemptId?: string;
  submittedAt?: any;
  deadline?: string;
}

export interface TrainingEnrollment {
  id: string;
  userId: string;
  trainerId?: string;
  userName?: string;
  userEmail?: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  subject?: string;
  organizationId?: string;
  enrolledAt: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  completionRate: number; // 0 to 100
  moduleProgress?: Record<string, boolean>;
  completedAt?: string;
  quizPassed?: boolean;
  certificateId?: string;
  updatedAt?: any;
}

export interface TrainingCertificate {
  id: string; // e.g. "KUMA-2026-X89F2A1C"
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
  competenciesAddressed?: string[];
  enrollmentId?: string;
  assessmentAttemptId?: string;
  verificationIdentifier?: string;
}

export interface CertificateVerificationRecord {
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

export interface TrainerCompetencyItem {
  id: string;
  name: string;
  category?: CompetencyCategory;
  description?: string;
  level: SkillProficiencyLevel;
  canTrain: boolean;
}

export interface TrainerProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  department?: string;
  designation?: string;
  yearsOfExperience?: number;
  qualification?: string;
  bio?: string;
  areaOfExpertise?: string;
  specialization?: string;
  skills?: string[];
  trainerExperience?: string;
  profilePhoto?: string;
  competencies?: TrainerCompetencyItem[];
  trainingPrograms?: string[];
  trainingTopics?: string[];
  preferredTrainingMode?: 'Online' | 'Offline' | 'Hybrid';
  certifications?: string[];
  createdAt?: any;
}

export interface TrainerAssignmentRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  traineeEmail?: string;
  trainerId: string;
  trainerName: string;
  trainerEmail?: string;
  organizationId?: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Rejected';
  createdAt: string;
}

export interface AssessmentAttempt {
  id?: string;
  uid: string;
  assessmentId: string;
  competencyId: string;
  courseId?: string;
  answers: Record<string, any>;
  score: number; // percent 0-100
  resultingLevel: number; // 1 | 2 | 3 | 4
  createdAt: string | number;
}

export interface CompetencyHistoryEntry {
  level: number;
  source: 'declared' | 'assessed';
  at: string | number;
  attemptId?: string;
}

export interface CompetencyRecord {
  uid: string;
  competencyId: string;
  declaredLevel: number;
  assessedLevel: number;
  currentLevel: number;
  history: CompetencyHistoryEntry[];
  updatedAt?: string | number;
}

export interface FirestoreEnrollment {
  id?: string;
  uid: string;
  courseId: string;
  status: 'active' | 'completed';
  moduleProgress: Record<string, { completed: boolean; completedAt?: string | number }>;
  percent: number; // 0-100
  createdAt: string | number;
  updatedAt: string | number;
}


