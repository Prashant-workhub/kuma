/**
 * Server-side Demo Data Seeder Script for Kuma Platform
 * 
 * Usage:
 *   FIREBASE_PROJECT_ID="your-project-id" \
 *   FIREBASE_CLIENT_EMAIL="your-client-email@project.iam.gserviceaccount.com" \
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..." \
 *   DEMO_ADMIN_PASSWORD="your_admin_password" \
 *   DEMO_TRAINER_PASSWORD="your_trainer_password" \
 *   DEMO_TRAINEE_PASSWORD="your_trainee_password" \
 *   node scripts/seedDemo.js
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyRaw) {
  console.error('\n❌ ERROR: Firebase Admin service credentials not found in environment.');
  console.error('Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.\n');
  process.exit(1);
}

const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey
  })
});

const auth = admin.auth();
const db = admin.firestore();

// Passwords from environment (with fallback for convenience if passed via CLI)
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'Admin#Kuma2026!';
const trainerPassword = process.env.DEMO_TRAINER_PASSWORD || 'Trainer#Kuma2026!';
const traineePassword = process.env.DEMO_TRAINEE_PASSWORD || 'Trainee#Kuma2026!';

const DEMO_EMAILS = {
  admin: process.env.DEMO_ADMIN_EMAIL || 'admin@acme.com',
  trainer: process.env.DEMO_TRAINER_EMAIL || 'trainer@acme.com',
  trainee: process.env.DEMO_TRAINEE_EMAIL || 'trainee@acme.com'
};

async function getOrCreateUser(email, password, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`[Seed] Found existing Auth user: ${email} (UID: ${existing.uid})`);
    await auth.updateUser(existing.uid, { password, displayName });
    return existing;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true
      });
      console.log(`[Seed] Created new Auth user: ${email} (UID: ${created.uid})`);
      return created;
    }
    throw err;
  }
}

async function seed() {
  console.log('🌱 Starting Kuma Demo Environment Seeding...');

  // 1. Organization
  const orgRef = db.collection('organizations').doc('acme-digital');
  await orgRef.set({
    id: 'acme-digital',
    name: 'Acme Digital Services',
    code: 'ACME',
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✅ Seeded Organization: Acme Digital Services');

  // 2. Departments
  const departments = [
    { id: 'dept-eng', name: 'Engineering & AI', orgId: 'acme-digital' },
    { id: 'dept-data', name: 'Data Science & Analytics', orgId: 'acme-digital' }
  ];
  for (const dept of departments) {
    await db.collection('departments').doc(dept.id).set({
      ...dept,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  console.log('✅ Seeded Departments');

  // 3. Competency Catalog
  const competencies = [
    {
      id: 'comp-python',
      name: 'Python Programming',
      category: 'Technical',
      description: 'Core Python syntax, data structures, and standard libraries.',
      numericLevel: 3,
      isActive: true
    },
    {
      id: 'comp-data-analysis',
      name: 'Data Analysis & Insights',
      category: 'Technical',
      description: 'Exploratory data analysis, Pandas, SQL data manipulation.',
      numericLevel: 3,
      isActive: true
    },
    {
      id: 'comp-react',
      name: 'React Development',
      category: 'Technical',
      description: 'Component architecture, state management, custom hooks.',
      numericLevel: 3,
      isActive: true
    },
    {
      id: 'comp-cloud-arch',
      name: 'Cloud Architecture & DevOps',
      category: 'Technical',
      description: 'Containerization, CI/CD pipelines, cloud deployment.',
      numericLevel: 3,
      isActive: true
    }
  ];
  for (const comp of competencies) {
    await db.collection('competencyCatalog').doc(comp.id).set({
      ...comp,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  console.log('✅ Seeded Competency Catalog');

  // 4. Designations with Required Competencies
  const designations = [
    {
      id: 'desig-swe',
      name: 'Senior Software Engineer',
      department: 'Engineering & AI',
      orgId: 'acme-digital',
      requiredCompetencies: [
        { competencyId: 'comp-python', competencyName: 'Python Programming', requiredNumericLevel: 3, targetLevel: 'Advanced' },
        { competencyId: 'comp-react', competencyName: 'React Development', requiredNumericLevel: 3, targetLevel: 'Advanced' }
      ]
    },
    {
      id: 'desig-data-analyst',
      name: 'Data Analyst Specialist',
      department: 'Data Science & Analytics',
      orgId: 'acme-digital',
      requiredCompetencies: [
        { competencyId: 'comp-data-analysis', competencyName: 'Data Analysis & Insights', requiredNumericLevel: 3, targetLevel: 'Advanced' }
      ]
    }
  ];
  for (const desig of designations) {
    await db.collection('designations').doc(desig.id).set({
      ...desig,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  console.log('✅ Seeded Designations');

  // 5. Auth Users & Profiles
  // 5a. Admin
  const adminAuth = await getOrCreateUser(DEMO_EMAILS.admin, adminPassword, 'Acme Platform Admin');
  await auth.setCustomUserClaims(adminAuth.uid, { admin: true });
  await db.collection('users').doc(adminAuth.uid).set({
    uid: adminAuth.uid,
    fullName: 'Acme Platform Admin',
    email: DEMO_EMAILS.admin,
    role: 'admin',
    approvalStatus: 'approved',
    organization: 'Acme Digital Services',
    department: 'Executive Management',
    designation: 'Platform Administrator',
    onboarding_completed: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`✅ Seeded Admin User (${DEMO_EMAILS.admin}) with custom claim { admin: true }`);

  // 5b. Trainer
  const trainerAuth = await getOrCreateUser(DEMO_EMAILS.trainer, trainerPassword, 'Dr. Alex Rivera');
  const trainerDoc = {
    uid: trainerAuth.uid,
    fullName: 'Dr. Alex Rivera',
    email: DEMO_EMAILS.trainer,
    role: 'faculty',
    trainerRole: 'trainer',
    approvalStatus: 'approved',
    organization: 'Acme Digital Services',
    department: 'Engineering & AI',
    designation: 'Lead Technical Instructor',
    yearsOfExperience: 10,
    qualification: 'Ph.D. in Computer Science',
    bio: 'Senior Technical Lead & Cloud Instructor with 10+ years enterprise experience.',
    areaOfExpertise: 'Web Architecture & AI Systems',
    specialization: 'React, Python, Microservices',
    skills: ['Python', 'React', 'Cloud Architecture', 'GraphQL'],
    competencies: [
      { id: 'comp-python', name: 'Python Programming', category: 'Technical', level: 'Advanced', numericLevel: 3, canTrain: true },
      { id: 'comp-react', name: 'React Development', category: 'Technical', level: 'Advanced', numericLevel: 3, canTrain: true }
    ],
    onboarding_completed: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('users').doc(trainerAuth.uid).set(trainerDoc, { merge: true });
  await db.collection('trainerProfiles').doc(trainerAuth.uid).set(trainerDoc, { merge: true });
  console.log(`✅ Seeded Approved Trainer User (${DEMO_EMAILS.trainer})`);

  // 5c. Trainee
  const traineeAuth = await getOrCreateUser(DEMO_EMAILS.trainee, traineePassword, 'Aarav Sharma');
  const traineeDoc = {
    uid: traineeAuth.uid,
    fullName: 'Aarav Sharma',
    email: DEMO_EMAILS.trainee,
    role: 'trainee',
    approvalStatus: 'approved',
    organization: 'Acme Digital Services',
    department: 'Engineering & AI',
    designation: 'Senior Software Engineer',
    yearsOfExperience: 3,
    qualification: "Bachelor's Degree in Computer Science",
    bio: 'Software engineer focusing on frontend architecture and data processing pipelines.',
    skills: ['Python', 'React', 'SQL'],
    competencies: [
      { id: 'comp-python', name: 'Python Programming', category: 'Technical', level: 'Intermediate', numericLevel: 2, targetLevel: 'Advanced', targetNumericLevel: 3 },
      { id: 'comp-react', name: 'React Development', category: 'Technical', level: 'Beginner', numericLevel: 1, targetLevel: 'Advanced', targetNumericLevel: 3 }
    ],
    onboarding_completed: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('users').doc(traineeAuth.uid).set(traineeDoc, { merge: true });
  await db.collection('traineeProfiles').doc(traineeAuth.uid).set(traineeDoc, { merge: true });
  console.log(`✅ Seeded Approved Trainee User (${DEMO_EMAILS.trainee})`);

  // 6. Course & Modules & Assessment
  const courseId = 'course-demo-101';
  const courseRef = db.collection('courses').doc(courseId);
  await courseRef.set({
    id: courseId,
    title: 'Advanced Web Architecture & Data Engineering',
    description: 'Master modular frontend architectures, scalable backend API design, and data processing workflows.',
    status: 'published',
    ownerTrainerId: trainerAuth.uid,
    organization: 'Acme Digital Services',
    department: 'Engineering & AI',
    competencyIds: ['comp-react', 'comp-python'],
    level: 'Intermediate',
    durationHours: 12,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const mod1Ref = courseRef.collection('modules').doc('mod-1');
  await mod1Ref.set({
    id: mod1Ref.id,
    courseId,
    title: '1. Modular React Architecture',
    description: 'Deep dive into modern component patterns and state management.',
    order: 1,
    type: 'video',
    resourceRef: 'demo-res-1',
    required: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const mod2Ref = courseRef.collection('modules').doc('mod-2');
  await mod2Ref.set({
    id: mod2Ref.id,
    courseId,
    title: '2. Enterprise Python APIs',
    description: 'Building asynchronous REST services and data pipelines.',
    order: 2,
    type: 'document',
    resourceRef: 'demo-res-2',
    required: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✅ Seeded Published Course & Modules');

  // Assessment & Assessment Keys
  const assessmentRef = db.collection('assessments').doc(courseId);
  await assessmentRef.set({
    id: courseId,
    courseId,
    title: 'Web Architecture Certification Assessment',
    description: 'Evaluates competency in React architecture and Python backend services.',
    timeLimitMinutes: 30,
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        text: 'What is the primary benefit of custom hooks in React development?',
        options: [
          'Direct manipulation of DOM nodes',
          'Encapsulating and reusing stateful component logic',
          'Replacing server-side database connections',
          'Automating CSS grid layouts'
        ]
      },
      {
        id: 'q2',
        text: 'Which Python async framework construct handles concurrent tasks without thread blocking?',
        options: [
          'asyncio event loop',
          'Synchronous subprocess call',
          'Blocking thread lock',
          'System SIGKILL handler'
        ]
      }
    ],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const assessmentKeysRef = db.collection('assessmentKeys').doc(courseId);
  await assessmentKeysRef.set({
    id: courseId,
    courseId,
    answerKeys: {
      q1: 'B',
      q2: 'A'
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✅ Seeded Course Assessment & Answer Keys');

  // 7. Seed History
  const enrollmentRef = db.collection('trainingEnrollments').doc('enr-demo-trainee-1');
  await enrollmentRef.set({
    id: 'enr-demo-trainee-1',
    userId: traineeAuth.uid,
    courseId,
    courseTitle: 'Advanced Web Architecture & Data Engineering',
    status: 'in_progress',
    completedModuleIds: ['mod-1'],
    completionRate: 50,
    enrolledAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastAccessedAt: new Date().toISOString()
  }, { merge: true });

  const compRecRef = db.collection('competencyRecords').doc('rec-demo-1');
  await compRecRef.set({
    id: 'rec-demo-1',
    uid: traineeAuth.uid,
    competencyId: 'comp-python',
    competencyName: 'Python Programming',
    level: 'Intermediate',
    numericLevel: 2,
    assessedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    source: 'baseline_assessment'
  }, { merge: true });

  const attRef = db.collection('assessmentAttempts').doc('att-demo-1');
  await attRef.set({
    id: 'att-demo-1',
    userId: traineeAuth.uid,
    courseId,
    score: 85,
    passed: true,
    answers: { q1: 'B', q2: 'A' },
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }, { merge: true });

  console.log('✅ Seeded Training History & Records');
  console.log('\n🎉 Kuma Demo Environment Seeding Completed Successfully!\n');
}

seed().catch(err => {
  console.error('\n❌ Seed process failed:', err);
  process.exit(1);
});
