import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import type { CertificateVerificationRecord, Quiz, QuizAttemptRecord, TrainingAssessmentAssignment, TrainingCertificate, TrainingEnrollment, TraineeCompetency, UserSettings } from '../types';
import type { TeacherAssignment } from '../teacher-portal/types';
import { auth, db } from '../firebaseConfig';
import { INITIAL_QUIZZES } from '../data';
import { generateCertificateId } from '../utils/certificateUtils';
import { summarizeModuleProgress } from '../utils/trainingProgress';
import { capAssessmentHistory } from '../models/firestoreModels';

export type TrainingProgram = TeacherAssignment & {
  trainerId: string;
  organization: string;
  status: 'draft' | 'published' | 'archived';
  createdAt?: any;
  updatedAt?: any;
};

function toIsoString(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  return '';
}

function mapProgram(id: string, data: Record<string, any>): TrainingProgram {
  return { ...data, id } as TrainingProgram;
}

function mapEnrollment(id: string, data: Record<string, any>): TrainingEnrollment {
  return {
    ...data,
    id,
    enrolledAt: toIsoString(data.enrolledAt),
    completedAt: data.completedAt ? toIsoString(data.completedAt) : undefined
  } as TrainingEnrollment;
}

export function subscribeTrainerPrograms(
  trainerId: string,
  onNext: (programs: TrainingProgram[]) => void,
  onError: (error: Error) => void
) {
  const programsQuery = query(collection(db, 'trainingPrograms'), where('trainerId', '==', trainerId));
  return onSnapshot(
    programsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => mapProgram(item.id, item.data()))),
    onError
  );
}

export function subscribePublishedPrograms(
  organization: string,
  onNext: (programs: TrainingProgram[]) => void,
  onError: (error: Error) => void
) {
  if (!organization.trim()) {
    onNext([]);
    return () => {};
  }
  const programsQuery = query(
    collection(db, 'trainingPrograms'),
    where('organization', '==', organization),
    where('status', '==', 'published')
  );
  return onSnapshot(
    programsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => mapProgram(item.id, item.data()))),
    onError
  );
}

export async function createTrainingProgram(
  trainerId: string,
  organization: string,
  program: Omit<TeacherAssignment, 'id' | 'trainerId' | 'organization' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<TrainingProgram> {
  if (!trainerId) throw new Error('A Firebase trainer UID is required.');
  if (!organization.trim()) throw new Error('An organization is required before publishing a program.');

  const programRef = doc(collection(db, 'trainingPrograms'));
  const now = new Date().toISOString();
  const record: TrainingProgram = {
    ...program,
    id: programRef.id,
    trainerId,
    organization: organization.trim(),
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(programRef, record);
  return { ...record, createdAt: now, updatedAt: now };
}

export async function updateTrainingProgram(
  trainerId: string,
  programId: string,
  updates: Partial<Omit<TeacherAssignment, 'id' | 'trainerId' | 'organization' | 'createdAt'>>
): Promise<void> {
  if (!trainerId || !programId) throw new Error('Trainer UID and program ID are required.');
  const programRef = doc(db, 'trainingPrograms', programId);
  await updateDoc(programRef, { ...updates, updatedAt: serverTimestamp() });
}

export function subscribeTraineeEnrollments(
  traineeId: string,
  onNext: (enrollments: TrainingEnrollment[]) => void,
  onError: (error: Error) => void
) {
  const enrollmentsQuery = query(collection(db, 'trainingEnrollments'), where('userId', '==', traineeId));
  return onSnapshot(
    enrollmentsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => mapEnrollment(item.id, item.data()))),
    onError
  );
}

export function subscribeTrainerEnrollments(
  trainerId: string,
  onNext: (enrollments: TrainingEnrollment[]) => void,
  onError: (error: Error) => void
) {
  const enrollmentsQuery = query(collection(db, 'trainingEnrollments'), where('trainerId', '==', trainerId));
  return onSnapshot(
    enrollmentsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => mapEnrollment(item.id, item.data()))),
    onError
  );
}

export async function getPersistentEnrollment(traineeId: string, programId: string): Promise<TrainingEnrollment | null> {
  if (!traineeId || !programId) return null;
  const id = `enr_${traineeId}_${programId}`;
  const snapshot = await getDoc(doc(db, 'trainingEnrollments', id));
  return snapshot.exists() ? mapEnrollment(snapshot.id, snapshot.data()) : null;
}

export async function enrollInTrainingProgram(
  traineeId: string,
  profile: UserSettings['profile'],
  programId: string
): Promise<TrainingEnrollment> {
  if (!traineeId) throw new Error('A Firebase trainee UID is required to enroll.');
  if (!programId) throw new Error('A training program ID is required.');

  const programRef = doc(db, 'trainingPrograms', programId);
  const enrollmentId = `enr_${traineeId}_${programId}`;
  const enrollmentRef = doc(db, 'trainingEnrollments', enrollmentId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { queueOperation } = await import('./offlineOutbox');
    await queueOperation(traineeId, 'training_enrollment', {
      userId: traineeId,
      courseId: programId,
      profile
    });
    const fallbackEnrollment: TrainingEnrollment = {
      id: enrollmentId,
      userId: traineeId,
      trainerId: 'pending_trainer',
      userName: profile.fullName,
      courseId: programId,
      courseCode: programId.toUpperCase(),
      courseName: 'Training Program',
      subject: 'Capacity Building',
      organizationId: profile.organization || '',
      completionRate: 0,
      status: 'enrolled',
      quizPassed: false,
      enrolledAt: new Date().toISOString()
    };
    return fallbackEnrollment;
  }

  return runTransaction(db, async (transaction) => {
    const [programSnapshot, existingSnapshot] = await Promise.all([
      transaction.get(programRef),
      transaction.get(enrollmentRef)
    ]);
    if (existingSnapshot.exists()) return mapEnrollment(existingSnapshot.id, existingSnapshot.data());
    if (!programSnapshot.exists() || programSnapshot.data().status !== 'published') {
      throw new Error('This training program is not available for enrollment.');
    }
    const savedProgram = mapProgram(programSnapshot.id, programSnapshot.data());
    if (!savedProgram.trainerId) throw new Error('This program has no trainer profile.');
    const assignmentRef = doc(db, 'trainer_assignments', `assign_${traineeId}_${savedProgram.trainerId}`);
    const assignmentSnapshot = await transaction.get(assignmentRef);
    if (!assignmentSnapshot.exists() || assignmentSnapshot.data().status !== 'Active') {
      throw new Error('Select this program’s trainer before enrolling.');
    }

    const moduleProgress = Object.fromEntries((savedProgram.syllabus || []).map((item) => [item.id, false]));
    const enrolledAt = new Date().toISOString();
    const enrollment: TrainingEnrollment = {
      id: enrollmentId,
      userId: traineeId,
      trainerId: savedProgram.trainerId,
      userName: profile.fullName,
      courseId: savedProgram.id,
      courseCode: savedProgram.courseCode,
      courseName: savedProgram.courseName,
      subject: savedProgram.subject,
      organizationId: profile.organization || '',
      enrolledAt,
      status: 'enrolled',
      completionRate: 0,
      moduleProgress,
      quizPassed: false
    };
    transaction.set(enrollmentRef, { ...enrollment, updatedAt: serverTimestamp() });
    return enrollment;
  });
}

export async function setPersistentModuleProgress(
  traineeId: string,
  program: { id: string; syllabus?: Array<{ id: string }> },
  moduleId: string,
  isComplete: boolean,
  profile: UserSettings['profile']
): Promise<{ enrollment: TrainingEnrollment; certificate?: TrainingCertificate }> {
  const enrollmentId = `enr_${traineeId}_${program.id}`;
  const enrollmentRef = doc(db, 'trainingEnrollments', enrollmentId);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { queueOperation } = await import('./offlineOutbox');
    await queueOperation(traineeId, 'module_progress', {
      userId: traineeId,
      course: program,
      topicId: moduleId,
      completed: isComplete,
      profile
    });
    const localSyllabus = program.syllabus || [];
    const moduleProgress: Record<string, boolean> = { [moduleId]: isComplete };
    const completedCount = isComplete ? 1 : 0;
    const progressPercentage = localSyllabus.length > 0 ? Math.round((completedCount / localSyllabus.length) * 100) : 0;
    const fallbackEnrollment: TrainingEnrollment = {
      id: enrollmentId,
      userId: traineeId,
      trainerId: 'pending_trainer',
      userName: profile.fullName,
      courseId: program.id,
      courseCode: (program as any).courseCode || program.id.toUpperCase(),
      courseName: (program as any).courseName || 'Training Program',
      subject: (program as any).subject || 'Capacity Building',
      organizationId: profile.organization || '',
      completionRate: progressPercentage,
      status: 'in_progress',
      moduleProgress,
      quizPassed: false,
      enrolledAt: new Date().toISOString()
    };
    return { enrollment: fallbackEnrollment };
  }

  const enrollment = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(enrollmentRef);
    if (!snapshot.exists()) throw new Error('Enroll in this program before updating progress.');
    const current = snapshot.data();
    if (current.userId !== traineeId) throw new Error('This enrollment belongs to another trainee.');
    if (current.status === 'completed' && !isComplete) {
      throw new Error('Completed program progress cannot be reduced.');
    }
    if (!(program.syllabus || []).some((item) => item.id === moduleId)) {
      throw new Error('The requested module is not part of this program.');
    }

    const moduleProgress = { ...(current.moduleProgress || {}), [moduleId]: isComplete };
    const summary = summarizeModuleProgress(program.syllabus || [], moduleProgress);
    const quizPassed = current.quizPassed === true;
    const isCompleted = summary.contentComplete && quizPassed;
    const update = {
      moduleProgress,
      completionRate: summary.progressPercentage,
      status: isCompleted ? 'completed' : summary.progressPercentage > 0 ? 'in_progress' : 'enrolled',
      ...(isCompleted && !current.completedAt ? { completedAt: new Date().toISOString() } : {}),
      updatedAt: serverTimestamp()
    };
    transaction.update(enrollmentRef, update);
    return mapEnrollment(snapshot.id, { ...current, ...update, updatedAt: new Date().toISOString() });
  });
  if (enrollment.status === 'completed' && enrollment.quizPassed && enrollment.assessmentAttemptId) {
    const certificate = await issuePersistentCertificate(traineeId, profile, program.id, enrollment.assessmentAttemptId);
    return { enrollment: { ...enrollment, certificateId: certificate.id }, certificate };
  }
  return { enrollment };
}

export async function assignProgramAssessment(
  traineeId: string,
  programId: string,
  assessmentId: string
): Promise<TrainingAssessmentAssignment> {
  if (!traineeId || !programId || !assessmentId) throw new Error('Trainee, program, and assessment IDs are required.');
  const enrollmentId = `enr_${traineeId}_${programId}`;
  const enrollmentSnapshot = await getDoc(doc(db, 'trainingEnrollments', enrollmentId));
  if (!enrollmentSnapshot.exists()) throw new Error('Enroll in the program before assigning its assessment.');
  const enrollment = enrollmentSnapshot.data();
  const assignmentId = `${traineeId}_${assessmentId}`;
  const assignmentRef = doc(db, 'assessmentAssignments', assignmentId);
  const existing = await getDoc(assignmentRef);
  if (existing.exists()) return { id: existing.id, ...existing.data() } as TrainingAssessmentAssignment;

  const assignment: TrainingAssessmentAssignment = {
    id: assignmentId,
    assessmentId,
    traineeId,
    trainerId: enrollment.trainerId,
    trainingProgramId: programId,
    status: 'assigned',
    attemptStatus: 'pending',
    assignedAt: new Date().toISOString()
  };
  await setDoc(assignmentRef, { ...assignment, assignedAt: serverTimestamp() });
  return assignment;
}

export async function createAssessmentAndAssignToTrainees(
  trainerId: string,
  organization: string,
  quiz: Quiz
): Promise<number> {
  if (!trainerId || !organization.trim()) throw new Error('Trainer UID and organization are required.');
  const relationshipQuery = query(
    collection(db, 'trainer_assignments'),
    where('trainerId', '==', trainerId)
  );
  const relationships = await getDocs(relationshipQuery);
  const activeRelationships = relationships.docs.filter((item) => item.data().status === 'Active');
  if (activeRelationships.length > 450) throw new Error('Too many active trainees to assign this assessment in one operation.');

  const assignmentDocs = await Promise.all(activeRelationships.map((relationship) => {
    const traineeId = relationship.data().traineeId as string;
    return getDoc(doc(db, 'assessmentAssignments', `${traineeId}_${quiz.id}`));
  }));
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  batch.set(doc(db, 'assessments', quiz.id), {
    ...quiz,
    trainerId,
    organization: organization.trim(),
    publicationStatus: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  let assignedCount = 0;
  activeRelationships.forEach((relationship, index) => {
    if (assignmentDocs[index].exists()) return;
    const traineeId = relationship.data().traineeId as string;
    const assignmentId = `${traineeId}_${quiz.id}`;
    batch.set(doc(db, 'assessmentAssignments', assignmentId), {
      id: assignmentId,
      assessmentId: quiz.id,
      traineeId,
      trainerId,
      status: 'assigned',
      attemptStatus: 'pending',
      assignedAt: serverTimestamp()
    });
    assignedCount += 1;
  });
  await batch.commit();
  return assignedCount;
}

export function subscribeTrainerAssessments(
  trainerId: string,
  onNext: (quizzes: Quiz[]) => void,
  onError: (error: Error) => void
) {
  const assessmentsQuery = query(collection(db, 'assessments'), where('trainerId', '==', trainerId));
  return onSnapshot(
    assessmentsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Quiz))),
    onError
  );
}

export function subscribeTrainerAssessmentAttempts(
  trainerId: string,
  onNext: (attempts: QuizAttemptRecord[]) => void,
  onError: (error: Error) => void
) {
  const attemptsQuery = query(collection(db, 'assessmentAttempts'), where('trainerId', '==', trainerId));
  return onSnapshot(
    attemptsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as QuizAttemptRecord))),
    onError
  );
}

export function subscribeTraineeAssignedAssessments(
  traineeId: string,
  onNext: (quizzes: Quiz[]) => void,
  onError: (error: Error) => void
) {
  const assignmentsQuery = query(collection(db, 'assessmentAssignments'), where('traineeId', '==', traineeId));
  return onSnapshot(assignmentsQuery, (snapshot) => {
    const loadQuizzes = async () => {
      const quizzes = await Promise.all(snapshot.docs.map(async (assignmentDoc) => {
        const assignment = assignmentDoc.data() as TrainingAssessmentAssignment;
            let quizData: Quiz | Record<string, any> | undefined = INITIAL_QUIZZES.find((item) => item.id === assignment.assessmentId);
            try {
              const assessmentSnapshot = await getDoc(doc(db, 'assessments', assignment.assessmentId));
              if (assessmentSnapshot.exists()) {
                quizData = { ...assessmentSnapshot.data(), id: assignment.assessmentId } as Quiz;
              }
            } catch (error) {
              if (!quizData) throw error;
            }
        if (!quizData) return null;
        return {
          ...quizData,
          id: assignment.assessmentId,
          assignmentId: assignment.id,
          trainerId: assignment.trainerId,
          trainingProgramId: assignment.trainingProgramId,
          status: assignment.status === 'submitted' ? 'completed' : 'available'
        } as Quiz;
      }));
      onNext(quizzes.filter((quiz): quiz is Quiz => quiz !== null));
    };
    void loadQuizzes().catch(onError);
  }, onError);
}

export async function persistAssessmentOutcome(
  attempt: QuizAttemptRecord,
  competencies: TraineeCompetency[]
): Promise<{ trainingCompleted: boolean }> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== attempt.userId) throw new Error('Assessment user does not match the authenticated Firebase UID.');

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { queueOperation } = await import('./offlineOutbox');
    await queueOperation(currentUser.uid, 'assessment_submit', {
      attempt,
      programId: attempt.trainingProgramId || 'program_1',
      trainerId: attempt.trainerId || 'trainer_1',
      competencies,
      assignmentId: attempt.assignmentId
    });
    return { trainingCompleted: attempt.passed === true };
  }

  const assignmentRef = doc(db, 'assessmentAssignments', attempt.assignmentId);
  const assignmentSnapshot = await getDoc(assignmentRef);
  if (!assignmentSnapshot.exists()) throw new Error('The assessment assignment is no longer available.');
  const assignment = assignmentSnapshot.data() as TrainingAssessmentAssignment;
  if (assignment.traineeId !== currentUser.uid || assignment.assessmentId !== attempt.quizId) {
    throw new Error('This assessment assignment is not active for the authenticated trainee.');
  }

  const userRef = doc(db, 'users', currentUser.uid);
  const userSnapshot = await getDoc(userRef);
  if (!userSnapshot.exists()) throw new Error('The trainee profile is not available.');
  const userData = userSnapshot.data();
  const traineeProfileRef = doc(db, 'traineeProfiles', currentUser.uid);
  const traineeProfileSnapshot = await getDoc(traineeProfileRef);
  const trainerId = assignment.trainerId;
  const programId = assignment.trainingProgramId || attempt.trainingProgramId;
  const enrollmentRef = programId
    ? doc(db, 'trainingEnrollments', `enr_${currentUser.uid}_${programId}`)
    : null;
  const enrollmentSnapshot = enrollmentRef ? await getDoc(enrollmentRef) : null;
  const existingEnrollment = enrollmentSnapshot?.exists() ? enrollmentSnapshot.data() : null;
  if (assignment.status === 'submitted') {
    if (assignment.attemptId !== attempt.id) throw new Error('This assessment assignment already has a submitted result.');
    const existingAttempt = await getDoc(doc(db, 'assessmentAttempts', attempt.id));
    if (!existingAttempt.exists()) throw new Error('The previously submitted assessment result is missing.');
    return {
      trainingCompleted: !!attempt.passed && existingEnrollment?.status === 'completed' && existingEnrollment?.completionRate === 100
    };
  }
  if (assignment.status !== 'assigned') throw new Error('This assessment assignment is not active for the authenticated trainee.');
  const trainingCompleted = !!attempt.passed && existingEnrollment?.completionRate === 100;
  const batch = writeBatch(db);
  const attemptId = attempt.id;
  const persistedAttempt = {
    ...attempt,
    trainerId,
    trainingProgramId: programId,
    completedAt: typeof attempt.completedAt === 'string' ? attempt.completedAt : new Date().toISOString(),
    submittedAt: serverTimestamp()
  };
  batch.set(doc(db, 'assessmentAttempts', attemptId), persistedAttempt);
  batch.update(assignmentRef, {
    status: 'submitted',
    attemptStatus: 'submitted',
    attemptId,
    submittedAt: serverTimestamp()
  });

  // Cap assessment history array for each competency to prevent unbounded document size growth
  const cappedCompetencies = (competencies || []).map((comp) => ({
    ...comp,
    assessmentHistory: capAssessmentHistory(comp.assessmentHistory)
  }));

  batch.set(userRef, { competencies: cappedCompetencies, updated_at: serverTimestamp() }, { merge: true });

  const profileProjection = traineeProfileSnapshot.exists()
    ? { competencies: cappedCompetencies, updatedAt: serverTimestamp() }
    : {
        uid: currentUser.uid,
        primaryTrainerId: userData.primaryTrainerId || trainerId,
        fullName: userData.fullName || attempt.userName,
        email: userData.email || currentUser.email || '',
        phone: userData.phone || userData.phone_number || '',
        organization: userData.organization || '',
        department: userData.department || '',
        designation: userData.designation || '',
        yearsOfExperience: Number(userData.experienceYears || userData.yearsOfExperience || 0),
        qualification: userData.qualification || '',
        domain: userData.domain || '',
        bio: userData.bio || '',
        skills: Array.isArray(userData.skills) ? userData.skills : [],
        competencies: cappedCompetencies,
        updatedAt: serverTimestamp()
      };
  batch.set(traineeProfileRef, profileProjection, { merge: true });

  if (enrollmentRef && existingEnrollment) {
    batch.update(enrollmentRef, {
      quizPassed: attempt.passed === true,
      assessmentAttemptId: attempt.id,
      ...(trainingCompleted ? { status: 'completed', completedAt: new Date().toISOString() } : {}),
      updatedAt: serverTimestamp()
    });
  }

  await batch.commit();
  return { trainingCompleted };
}

export async function issuePersistentCertificate(
  traineeId: string,
  profile: UserSettings['profile'],
  programId: string,
  assessmentAttemptId: string
): Promise<TrainingCertificate> {
  if (!auth.currentUser || auth.currentUser.uid !== traineeId) throw new Error('Certificate trainee does not match the authenticated Firebase UID.');
  const enrollmentRef = doc(db, 'trainingEnrollments', `enr_${traineeId}_${programId}`);
  const attemptRef = doc(db, 'assessmentAttempts', assessmentAttemptId);

  return runTransaction(db, async (transaction) => {
    const enrollmentSnapshot = await transaction.get(enrollmentRef);
    const attemptSnapshot = await transaction.get(attemptRef);
    if (!enrollmentSnapshot.exists() || !attemptSnapshot.exists()) throw new Error('Training completion records are incomplete.');
    const enrollment = enrollmentSnapshot.data();
    const attempt = attemptSnapshot.data();
    if (enrollment.userId !== traineeId || enrollment.courseId !== programId || enrollment.status !== 'completed' || enrollment.completionRate !== 100 || enrollment.quizPassed !== true) {
      throw new Error('Complete every module and pass the assigned assessment before requesting a certificate.');
    }
    if (attempt.userId !== traineeId || attempt.trainingProgramId !== programId || attempt.passed !== true) {
      throw new Error('A passing assessment for this training program is required.');
    }

    if (typeof enrollment.certificateId === 'string') {
      const existingRef = doc(db, 'userCertificates', enrollment.certificateId);
      const existingSnapshot = await transaction.get(existingRef);
      if (existingSnapshot.exists()) return existingSnapshot.data() as TrainingCertificate;
    }

    const certificateId = generateCertificateId();
    const completionDate = enrollment.completedAt || new Date().toISOString();
    const certificate: TrainingCertificate = {
      id: certificateId,
      userId: traineeId,
      userName: profile.fullName || enrollment.userName || 'Trainee Learner',
      userEmail: profile.emailAddress,
      courseId: programId,
      courseCode: enrollment.courseCode,
      courseName: enrollment.courseName,
      organization: profile.organization || profile.institution || enrollment.organizationId || '',
      department: profile.department || '',
      designation: profile.designation || '',
      issueDate: new Date().toISOString(),
      completionDate,
      verified: true,
      verificationUrl: `/verify/certificate/${certificateId}`,
      competenciesAddressed: attempt.competencyName ? [attempt.competencyName] : [],
      enrollmentId: enrollment.id,
      assessmentAttemptId,
      verificationIdentifier: certificateId
    };
    const publicRecord: CertificateVerificationRecord = {
      certificateId,
      traineeName: certificate.userName,
      trainingProgramName: certificate.courseName,
      courseCode: certificate.courseCode,
      organization: certificate.organization,
      issueDate: certificate.issueDate,
      completionDate: certificate.completionDate,
      competenciesAddressed: certificate.competenciesAddressed || [],
      verificationIdentifier: certificateId,
      verificationStatus: 'valid'
    };
    transaction.set(doc(db, 'userCertificates', certificateId), certificate);
    transaction.set(doc(db, 'certificateVerifications', certificateId), publicRecord);
    transaction.update(enrollmentRef, { certificateId, updatedAt: serverTimestamp() });
    return certificate;
  });
}

export function subscribeUserCertificates(
  traineeId: string,
  onNext: (certificates: TrainingCertificate[]) => void,
  onError: (error: Error) => void
) {
  const certificatesQuery = query(collection(db, 'userCertificates'), where('userId', '==', traineeId));
  return onSnapshot(
    certificatesQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as TrainingCertificate))),
    onError
  );
}

export async function getPersistentUserCertificate(certificateId: string): Promise<TrainingCertificate | null> {
  if (!certificateId) return null;
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in to view your certificate.');
  const snapshot = await getDoc(doc(db, 'userCertificates', certificateId));
  if (!snapshot.exists()) return null;
  const certificate = snapshot.data() as TrainingCertificate;
  if (certificate.userId !== currentUser.uid) throw new Error('This certificate belongs to another trainee.');
  return certificate;
}

export async function verifyPersistentCertificate(certificateId: string): Promise<CertificateVerificationRecord | null> {
  if (!certificateId.trim()) return null;
  const snapshot = await getDoc(doc(db, 'certificateVerifications', certificateId.trim()));
  return snapshot.exists() ? snapshot.data() as CertificateVerificationRecord : null;
}