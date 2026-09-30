import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

const rules = readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8');
let testEnvironment: Awaited<ReturnType<typeof initializeTestEnvironment>>;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-kuma-rules',
    firestore: { rules }
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

test('trainee data is private except to the selected trainer', async () => {
  const traineeUid = 'trainee-uid-1';
  const trainerUid = 'trainer-uid-1';
  const otherUid = 'trainer-uid-2';
  const traineeDb = testEnvironment.authenticatedContext(traineeUid).firestore();
  const trainerDb = testEnvironment.authenticatedContext(trainerUid).firestore();
  const otherDb = testEnvironment.authenticatedContext(otherUid).firestore();

  await assertSucceeds(setDoc(doc(traineeDb, 'users', traineeUid), {
    uid: traineeUid,
    role: 'trainee',
    fullName: 'Trainee One',
    email: 'trainee@example.org'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'traineeProfiles', traineeUid), {
    uid: traineeUid,
    fullName: 'Trainee One',
    email: 'trainee@example.org',
    phone: '+911234567890',
    organization: 'Demo Organization',
    department: 'Engineering',
    designation: 'Analyst',
    yearsOfExperience: 2,
    qualification: 'Bachelors',
    domain: 'Data',
    bio: '',
    skills: ['Python'],
    competencies: [],
    updatedAt: serverTimestamp()
  }));

  await assertFails(getDoc(doc(trainerDb, 'traineeProfiles', traineeUid)));
  await assertFails(getDoc(doc(trainerDb, 'users', traineeUid)));
  await assertFails(getDoc(doc(otherDb, 'traineeProfiles', traineeUid)));

  const batch = writeBatch(traineeDb);
  batch.set(doc(traineeDb, 'trainer_assignments', `assign_${traineeUid}_${trainerUid}`), {
    id: `assign_${traineeUid}_${trainerUid}`,
    traineeId: traineeUid,
    traineeName: 'Trainee One',
    traineeEmail: 'trainee@example.org',
    trainerId: trainerUid,
    trainerName: 'Trainer One',
    organizationId: 'Demo Organization',
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(traineeDb, 'users', traineeUid), { primaryTrainerId: trainerUid });
  batch.update(doc(traineeDb, 'traineeProfiles', traineeUid), { primaryTrainerId: trainerUid, updatedAt: serverTimestamp() });
  await assertSucceeds(batch.commit());

  await assertSucceeds(getDoc(doc(trainerDb, 'traineeProfiles', traineeUid)));
  await assertFails(getDoc(doc(trainerDb, 'users', traineeUid)));
  await assertFails(getDoc(doc(otherDb, 'traineeProfiles', traineeUid)));

  const trainerAssignments = await assertSucceeds(getDocs(query(
    collection(trainerDb, 'trainer_assignments'),
    where('trainerId', '==', trainerUid)
  ))) as { size: number };
  assert.equal(trainerAssignments.size, 1);
});

test('trainers publish owned programs and trainees persist enrollment progress by UID', async () => {
  const trainerUid = 'program-trainer-uid';
  const traineeUid = 'program-trainee-uid';
  const otherUid = 'unrelated-trainee-uid';
  const programId = 'program-react-101';
  const enrollmentId = `enr_${traineeUid}_${programId}`;
  const trainerDb = testEnvironment.authenticatedContext(trainerUid).firestore();
  const traineeDb = testEnvironment.authenticatedContext(traineeUid).firestore();
  const otherDb = testEnvironment.authenticatedContext(otherUid).firestore();

  await assertSucceeds(setDoc(doc(trainerDb, 'users', trainerUid), {
    uid: trainerUid,
    role: 'trainer',
    fullName: 'Trainer One',
    email: 'trainer@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'users', traineeUid), {
    uid: traineeUid,
    role: 'trainee',
    fullName: 'Trainee One',
    email: 'trainee@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'trainer_assignments', `assign_${traineeUid}_${trainerUid}`), {
    id: `assign_${traineeUid}_${trainerUid}`,
    traineeId: traineeUid,
    traineeName: 'Trainee One',
    trainerId: trainerUid,
    trainerName: 'Trainer One',
    organizationId: 'Demo Organization',
    status: 'Active',
    createdAt: new Date().toISOString()
  }));

  await assertSucceeds(setDoc(doc(trainerDb, 'trainingPrograms', programId), {
    id: programId,
    trainerId: trainerUid,
    organization: 'Demo Organization',
    status: 'published',
    courseCode: 'REACT101',
    courseName: 'React Foundations',
    subject: 'React',
    students: 0,
    completionRate: 0,
    accent: 'cyan',
    syllabus: [{ id: 'module-1', title: 'Components', done: false }],
    competencyIds: ['comp-react'],
    competencyNames: ['React'],
    description: 'A persisted training program.',
    duration: '2 weeks',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  const publishedPrograms = await assertSucceeds(getDocs(query(
    collection(traineeDb, 'trainingPrograms'),
    where('organization', '==', 'Demo Organization'),
    where('status', '==', 'published')
  )));
  assert.equal((publishedPrograms as { size: number }).size, 1);

  await assertSucceeds(setDoc(doc(traineeDb, 'trainingEnrollments', enrollmentId), {
    id: enrollmentId,
    userId: traineeUid,
    trainerId: trainerUid,
    courseId: programId,
    courseCode: 'REACT101',
    courseName: 'React Foundations',
    organizationId: 'Demo Organization',
    enrolledAt: new Date().toISOString(),
    status: 'enrolled',
    completionRate: 0,
    moduleProgress: { 'module-1': false },
    quizPassed: false,
    updatedAt: serverTimestamp()
  }));
  // A trainee may not skip the module and assessment workflow by creating a
  // completed enrollment directly. Completion is only allowed in the validated
  // batch that includes a submitted, passing assessment attempt.
  await assertFails(setDoc(doc(otherDb, 'trainingEnrollments', `enr_${otherUid}_forged`), {
    id: `enr_${otherUid}_forged`,
    userId: otherUid,
    trainerId: trainerUid,
    courseId: programId,
    courseCode: 'REACT101',
    courseName: 'React Foundations',
    organizationId: 'Demo Organization',
    enrolledAt: new Date().toISOString(),
    status: 'completed',
    completionRate: 100,
    moduleProgress: { 'module-1': true },
    quizPassed: true,
    completedAt: new Date().toISOString(),
    assessmentAttemptId: 'forged-attempt',
    updatedAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(otherDb, 'trainingEnrollments', `enr_${otherUid}_${programId}`), {
    id: `enr_${otherUid}_${programId}`,
    userId: traineeUid,
    trainerId: trainerUid,
    courseId: programId,
    courseCode: 'REACT101',
    courseName: 'React Foundations',
    organizationId: 'Demo Organization',
    enrolledAt: new Date().toISOString(),
    status: 'enrolled',
    completionRate: 0,
    moduleProgress: { 'module-1': false },
    quizPassed: false,
    updatedAt: serverTimestamp()
  }));

  await assertSucceeds(updateDoc(doc(traineeDb, 'trainingEnrollments', enrollmentId), {
    moduleProgress: { 'module-1': true },
    completionRate: 100,
    status: 'in_progress',
    updatedAt: serverTimestamp()
  }));
  const trainerEnrollments = await assertSucceeds(getDocs(query(
    collection(trainerDb, 'trainingEnrollments'),
    where('trainerId', '==', trainerUid)
  )));
  assert.equal((trainerEnrollments as { size: number }).size, 1);
});

test('assessment assignments and results remain linked to trainee and trainer UIDs', async () => {
  const trainerUid = 'assessment-trainer-uid';
  const traineeUid = 'assessment-trainee-uid';
  const assessmentId = 'assessment-python-1';
  const assignmentId = `${traineeUid}_${assessmentId}`;
  const trainerDb = testEnvironment.authenticatedContext(trainerUid).firestore();
  const traineeDb = testEnvironment.authenticatedContext(traineeUid).firestore();
  const otherDb = testEnvironment.authenticatedContext('assessment-other-uid').firestore();

  await assertSucceeds(setDoc(doc(trainerDb, 'users', trainerUid), {
    uid: trainerUid,
    role: 'trainer',
    fullName: 'Trainer One',
    email: 'trainer@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'users', traineeUid), {
    uid: traineeUid,
    role: 'trainee',
    fullName: 'Trainee One',
    email: 'trainee@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'trainer_assignments', `assign_${traineeUid}_${trainerUid}`), {
    id: `assign_${traineeUid}_${trainerUid}`,
    traineeId: traineeUid,
    traineeName: 'Trainee One',
    trainerId: trainerUid,
    trainerName: 'Trainer One',
    organizationId: 'Demo Organization',
    status: 'Active',
    createdAt: new Date().toISOString()
  }));

  const publishBatch = writeBatch(trainerDb);
  publishBatch.set(doc(trainerDb, 'assessments', assessmentId), {
    id: assessmentId,
    trainerId: trainerUid,
    organization: 'Demo Organization',
    publicationStatus: 'published',
    title: 'Python Assessment',
    topic: 'Python basics',
    questionsCount: 1,
    estimatedTime: '10 minutes',
    passingScore: 60,
    questions: [{ id: 'q1', question: 'Q?', options: ['A', 'B'], correctAnswerIndex: 0 }],
    status: 'available',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  publishBatch.set(doc(trainerDb, 'assessmentAssignments', assignmentId), {
    id: assignmentId,
    assessmentId,
    traineeId: traineeUid,
    trainerId: trainerUid,
    status: 'assigned',
    attemptStatus: 'pending',
    assignedAt: serverTimestamp()
  });
  await assertSucceeds(publishBatch.commit());
  await assertSucceeds(getDoc(doc(traineeDb, 'assessments', assessmentId)));

  const attemptId = 'attempt-1';
  const submissionBatch = writeBatch(traineeDb);
  submissionBatch.update(doc(traineeDb, 'assessmentAssignments', assignmentId), {
    status: 'submitted',
    attemptStatus: 'submitted',
    attemptId,
    submittedAt: serverTimestamp()
  });
  submissionBatch.set(doc(traineeDb, 'assessmentAttempts', attemptId), {
    id: attemptId,
    userId: traineeUid,
    userName: 'Trainee One',
    trainerId: trainerUid,
    assignmentId,
    quizId: assessmentId,
    quizTitle: 'Python Assessment',
    subject: 'Python',
    topic: 'Python basics',
    competencyId: 'comp-python',
    competencyName: 'Python Programming',
    score: 1,
    totalQuestions: 1,
    scorePercentage: 100,
    accuracy: 100,
    passed: true,
    assessedLevel: 'Expert',
    assessedNumericLevel: 4,
    completedAt: new Date().toISOString(),
    submittedAt: serverTimestamp()
  });
  await assertSucceeds(submissionBatch.commit());
  await assertSucceeds(getDoc(doc(trainerDb, 'assessmentAttempts', attemptId)));
  await assertFails(getDoc(doc(otherDb, 'assessmentAttempts', attemptId)));
});

test('certificate issuance requires completed enrollment and a passing attempt', async () => {
  const trainerUid = 'certificate-trainer-uid';
  const traineeUid = 'certificate-trainee-uid';
  const programId = 'program-certificate-1';
  const assessmentId = 'assessment-certificate-1';
  const enrollmentId = `enr_${traineeUid}_${programId}`;
  const assignmentId = `${traineeUid}_${assessmentId}`;
  const attemptId = 'certificate-attempt-1';
  const certificateId = 'KUMA-2026-AB12CD34';
  const trainerDb = testEnvironment.authenticatedContext(trainerUid).firestore();
  const traineeDb = testEnvironment.authenticatedContext(traineeUid).firestore();
  const publicDb = testEnvironment.unauthenticatedContext().firestore();

  await assertSucceeds(setDoc(doc(trainerDb, 'users', trainerUid), {
    uid: trainerUid,
    role: 'trainer',
    fullName: 'Trainer One',
    email: 'trainer@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'users', traineeUid), {
    uid: traineeUid,
    role: 'trainee',
    fullName: 'Trainee One',
    email: 'trainee@example.org',
    organization: 'Demo Organization'
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'trainer_assignments', `assign_${traineeUid}_${trainerUid}`), {
    id: `assign_${traineeUid}_${trainerUid}`,
    traineeId: traineeUid,
    traineeName: 'Trainee One',
    trainerId: trainerUid,
    trainerName: 'Trainer One',
    organizationId: 'Demo Organization',
    status: 'Active',
    createdAt: new Date().toISOString()
  }));
  await assertSucceeds(setDoc(doc(trainerDb, 'trainingPrograms', programId), {
    id: programId,
    trainerId: trainerUid,
    organization: 'Demo Organization',
    status: 'published',
    courseCode: 'CERT101',
    courseName: 'Certificate Course',
    subject: 'Testing',
    students: 0,
    completionRate: 0,
    accent: 'cyan',
    syllabus: [{ id: 'module-1', title: 'Module', done: false }],
    competencyIds: ['comp-test'],
    competencyNames: ['Testing'],
    description: '',
    duration: '1 week',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(trainerDb, 'assessments', assessmentId), {
    id: assessmentId,
    trainerId: trainerUid,
    organization: 'Demo Organization',
    publicationStatus: 'published',
    title: 'Final Assessment',
    topic: 'Testing',
    questionsCount: 1,
    estimatedTime: '5 minutes',
    passingScore: 60,
    questions: [{ id: 'q1', question: 'Q?', options: ['A', 'B'], correctAnswerIndex: 0 }],
    status: 'available',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(trainerDb, 'assessmentAssignments', assignmentId), {
    id: assignmentId,
    assessmentId,
    traineeId: traineeUid,
    trainerId: trainerUid,
    trainingProgramId: programId,
    status: 'assigned',
    attemptStatus: 'pending',
    assignedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(traineeDb, 'trainingEnrollments', enrollmentId), {
    id: enrollmentId,
    userId: traineeUid,
    trainerId: trainerUid,
    courseId: programId,
    courseCode: 'CERT101',
    courseName: 'Certificate Course',
    organizationId: 'Demo Organization',
    enrolledAt: new Date().toISOString(),
    status: 'enrolled',
    completionRate: 0,
    moduleProgress: { 'module-1': false },
    quizPassed: false,
    updatedAt: serverTimestamp()
  }));

  const attempt = {
    id: attemptId,
    userId: traineeUid,
    userName: 'Trainee One',
    trainerId: trainerUid,
    assignmentId,
    trainingProgramId: programId,
    quizId: assessmentId,
    quizTitle: 'Final Assessment',
    subject: 'Certificate Course',
    topic: 'Testing',
    competencyId: 'comp-test',
    competencyName: 'Testing',
    score: 1,
    totalQuestions: 1,
    scorePercentage: 100,
    accuracy: 100,
    passed: true,
    assessedLevel: 'Expert',
    assessedNumericLevel: 4,
    completedAt: new Date().toISOString(),
    submittedAt: serverTimestamp()
  };
  const completionBatch = writeBatch(traineeDb);
  completionBatch.update(doc(traineeDb, 'assessmentAssignments', assignmentId), {
    status: 'submitted',
    attemptStatus: 'submitted',
    attemptId,
    submittedAt: serverTimestamp()
  });
  completionBatch.set(doc(traineeDb, 'assessmentAttempts', attemptId), attempt);
  completionBatch.update(doc(traineeDb, 'trainingEnrollments', enrollmentId), {
    status: 'completed',
    completionRate: 100,
    moduleProgress: { 'module-1': true },
    quizPassed: true,
    assessmentAttemptId: attemptId,
    completedAt: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(completionBatch.commit());

  const certificate = {
    id: certificateId,
    userId: traineeUid,
    userName: 'Trainee One',
    userEmail: 'trainee@example.org',
    courseId: programId,
    courseCode: 'CERT101',
    courseName: 'Certificate Course',
    organization: 'Demo Organization',
    department: 'Engineering',
    designation: 'Analyst',
    issueDate: new Date().toISOString(),
    completionDate: new Date().toISOString(),
    verified: true,
    verificationUrl: `/verify/certificate/${certificateId}`,
    competenciesAddressed: ['Testing'],
    enrollmentId,
    assessmentAttemptId: attemptId,
    verificationIdentifier: certificateId
  };
  const verification = {
    certificateId,
    traineeName: 'Trainee One',
    trainingProgramName: 'Certificate Course',
    courseCode: 'CERT101',
    organization: 'Demo Organization',
    issueDate: certificate.issueDate,
    completionDate: certificate.completionDate,
    competenciesAddressed: ['Testing'],
    verificationIdentifier: certificateId,
    verificationStatus: 'valid'
  };
  const certificateBatch = writeBatch(traineeDb);
  certificateBatch.set(doc(traineeDb, 'userCertificates', certificateId), certificate);
  certificateBatch.set(doc(traineeDb, 'certificateVerifications', certificateId), verification);
  certificateBatch.update(doc(traineeDb, 'trainingEnrollments', enrollmentId), {
    certificateId,
    updatedAt: serverTimestamp()
  });
  await assertSucceeds(certificateBatch.commit());

  const publicCertificate = await assertSucceeds(getDoc(doc(publicDb, 'certificateVerifications', certificateId))) as {
    data: () => Record<string, unknown> | undefined
  };
  assert.equal(publicCertificate.data()?.traineeName, 'Trainee One');
  assert.equal('userId' in (publicCertificate.data() || {}), false);
  assert.equal('userEmail' in (publicCertificate.data() || {}), false);
  await assertFails(getDoc(doc(publicDb, 'userCertificates', certificateId)));
});

test('Trainer A cannot read or edit Trainer B draft courses or doubts', async () => {
  const trainerA = 'trainer-a-uid';
  const trainerB = 'trainer-b-uid';
  const traineeUid = 'trainee-c-uid';

  const dbA = testEnvironment.authenticatedContext(trainerA).firestore();
  const dbB = testEnvironment.authenticatedContext(trainerB).firestore();

  await assertSucceeds(setDoc(doc(dbA, 'users', trainerA), {
    uid: trainerA,
    role: 'trainer',
    approvalStatus: 'approved',
    fullName: 'Trainer A',
    organization: 'Org A'
  }));

  await assertSucceeds(setDoc(doc(dbB, 'users', trainerB), {
    uid: trainerB,
    role: 'trainer',
    approvalStatus: 'approved',
    fullName: 'Trainer B',
    organization: 'Org B'
  }));

  // Trainer A creates draft course
  const courseIdA = 'course-a-draft';
  await assertSucceeds(setDoc(doc(dbA, 'courses', courseIdA), {
    id: courseIdA,
    ownerTrainerId: trainerA,
    orgId: 'Org A',
    title: 'Trainer A Secret Course',
    description: 'Draft course',
    status: 'draft',
    competencyIds: [],
    level: 'Intermediate'
  }));

  // Trainer B cannot read or write Trainer A's draft course
  await assertFails(getDoc(doc(dbB, 'courses', courseIdA)));
  await assertFails(updateDoc(doc(dbB, 'courses', courseIdA), { title: 'Hacked by B' }));

  // Doubts isolation
  const doubtIdB = 'doubt-belonging-to-b';
  await assertSucceeds(setDoc(doc(dbB, 'doubts', doubtIdB), {
    id: doubtIdB,
    traineeUid,
    trainerId: trainerB,
    courseId: 'course-b',
    question: 'Question for Trainer B',
    status: 'pending'
  }));

  // Trainer A cannot read or update Trainer B's doubts
  await assertFails(getDoc(doc(dbA, 'doubts', doubtIdB)));
  await assertFails(updateDoc(doc(dbA, 'doubts', doubtIdB), { response: 'Answered by A' }));
});

