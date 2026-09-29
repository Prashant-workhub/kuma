/**
 * Project Kuma - Trainer Discovery & Trainee-Trainer Relationship Service (SIH26075 Capacity Connect)
 * Handles querying trainers, filtering, profile inspection, and trainee-trainer assignment persistence.
 */

import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TrainerProfile, TrainerCompetencyItem, TrainerAssignmentRecord, SkillProficiencyLevel } from '../types';

const TRAINER_ASSIGNMENTS_STORAGE_KEY = 'kuma_trainer_assignments';

/**
 * Seeded Demo Trainers for prototype offline/initial state
 */
export const DEMO_TRAINERS: TrainerProfile[] = [
  {
    uid: 'trainer-demo-alex',
    fullName: 'Dr. Alex Rivera',
    email: 'alex.rivera@capacityconnect.in',
    phone: '+91 98765 11223',
    organization: 'National Institute of Technical Teachers Training',
    department: 'Computer Science & Artificial Intelligence',
    designation: 'Master Trainer & Senior Professor',
    yearsOfExperience: 12,
    qualification: 'Doctorate / Ph.D. in Computer Science',
    bio: 'Dedicated computer science educator specializing in enterprise Java, Python automation, distributed systems, and machine learning pipelines.',
    areaOfExpertise: 'Software Engineering & Artificial Intelligence',
    specialization: 'Distributed Systems & Machine Learning',
    skills: ['Java', 'Python', 'Cloud Computing', 'System Design', 'React'],
    trainerExperience: '12+ Years in Academic & Corporate Technical Training',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    competencies: [
      {
        id: 'comp-java',
        name: 'Java Programming',
        category: 'Technical',
        description: 'Object-oriented programming, JVM architecture, concurrency, and enterprise frameworks.',
        level: 'Expert',
        canTrain: true
      },
      {
        id: 'comp-data-analysis',
        name: 'Data Analysis',
        category: 'Technical',
        description: 'Statistical summary, data hygiene, exploratory visualization, and insight generation.',
        level: 'Advanced',
        canTrain: true
      },
      {
        id: 'comp-cloud',
        name: 'Cloud Computing',
        category: 'Technical',
        description: 'Cloud infrastructure deployment, virtualization, containerization, and serverless scaling.',
        level: 'Advanced',
        canTrain: true
      }
    ],
    trainingPrograms: [
      'Advanced Full-Stack Web Development',
      'Enterprise Cloud & DevOps Architecture'
    ],
    trainingTopics: ['Spring Boot Microservices', 'Docker & Kubernetes', 'System Architecture'],
    preferredTrainingMode: 'Hybrid',
    certifications: ['AWS Certified Solutions Architect', 'Oracle Certified Master Java Developer']
  },
  {
    uid: 'trainer-demo-sunita',
    fullName: 'Prof. Sunita Sharma',
    email: 'sunita.sharma@capacityconnect.in',
    phone: '+91 98765 22334',
    organization: 'National Skill Development Corporation (NSDC)',
    department: 'Data Science & Advanced Analytics',
    designation: 'Domain Subject Matter Expert',
    yearsOfExperience: 9,
    qualification: "Master's Degree (M.Tech)",
    bio: 'Data analytics and statistical modeling expert with 9+ years experience delivering government and corporate capacity building workshops.',
    areaOfExpertise: 'Data Science & Analytics',
    specialization: 'Exploratory Data Analysis & Predictive Analytics',
    skills: ['Data Analysis', 'Python', 'SQL', 'Machine Learning', 'Power BI'],
    trainerExperience: '9 Years Lead Data Science Trainer',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    competencies: [
      {
        id: 'comp-data-analysis',
        name: 'Data Analysis',
        category: 'Technical',
        description: 'Statistical summary, data hygiene, exploratory visualization, and insight generation.',
        level: 'Expert',
        canTrain: true
      },
      {
        id: 'comp-db',
        name: 'Database Management',
        category: 'Technical',
        description: 'Relational data modeling, SQL query formulation, indexing, and transaction ACID properties.',
        level: 'Advanced',
        canTrain: true
      }
    ],
    trainingPrograms: ['Data Science & Applied Machine Learning', 'Big Data Analytics'],
    trainingTopics: ['Pandas & NumPy', 'SQL Aggregations', 'Exploratory Visualization'],
    preferredTrainingMode: 'Online',
    certifications: ['Certified Data Management Professional (CDMP)', 'Microsoft Data Analyst Associate']
  },
  {
    uid: 'trainer-demo-rajesh',
    fullName: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@capacityconnect.in',
    phone: '+91 98765 33445',
    organization: 'Indian Institute of Technology (IIT)',
    department: 'Information Technology & Cyber Infrastructure',
    designation: 'Associate Professor & Lead Consultant',
    yearsOfExperience: 14,
    qualification: 'Doctorate / Ph.D. in Cybersecurity',
    bio: 'Senior cybersecurity research scientist and technical trainer focusing on network defense, cloud governance, and zero-trust security architecture.',
    areaOfExpertise: 'Cybersecurity & Cloud Systems',
    specialization: 'Network Security & Zero Trust Architecture',
    skills: ['Cybersecurity', 'Cloud Computing', 'DevOps', 'System Design', 'Git & Version Control'],
    trainerExperience: '14 Years Academic Professor & Corporate Consultant',
    profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    competencies: [
      {
        id: 'comp-git',
        name: 'Git & Version Control',
        category: 'Technical',
        description: 'Branching strategies, interactive rebase, pull requests, and merge conflict resolution.',
        level: 'Expert',
        canTrain: true
      },
      {
        id: 'comp-cloud',
        name: 'Cloud Computing',
        category: 'Technical',
        description: 'Cloud infrastructure deployment, virtualization, containerization, and serverless scaling.',
        level: 'Expert',
        canTrain: true
      }
    ],
    trainingPrograms: ['Cybersecurity & Network Defense', 'Enterprise Cloud & DevOps Architecture'],
    trainingTopics: ['Zero Trust Security', 'Kubernetes Security', 'CI/CD Pipelines'],
    preferredTrainingMode: 'Offline',
    certifications: ['Certified Information Systems Security Professional (CISSP)', 'AWS Security Specialist']
  }
];

function sanitizeCompetencies(raw: any[]): TrainerCompetencyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: any, idx: number) => {
      if (!c) return null;
      if (typeof c === 'string') {
        return {
          id: `comp-${idx}`,
          name: c,
          category: 'Technical',
          description: c,
          level: 'Intermediate' as SkillProficiencyLevel,
          canTrain: true
        };
      }
      if (typeof c === 'object') {
        const compName = c.name || c.title || c.competencyName || c.label || '';
        if (!compName) return null;
        return {
          id: c.id || `comp-${idx}`,
          name: String(compName),
          category: c.category || 'Technical',
          description: c.description || '',
          level: (c.level || c.proficiencyLevel || 'Intermediate') as SkillProficiencyLevel,
          canTrain: c.canTrain !== false
        };
      }
      return null;
    })
    .filter(Boolean) as TrainerCompetencyItem[];
}

/**
 * Fetches all available Trainers / Faculty from Firestore and local storage.
 */
export async function getAvailableTrainers(): Promise<TrainerProfile[]> {
  const trainersMap = new Map<string, TrainerProfile>();

  // 1. Load default demo trainers into map
  DEMO_TRAINERS.forEach(t => trainersMap.set(t.uid, {
    ...t,
    competencies: sanitizeCompetencies(t.competencies)
  }));

  // 2. Fetch non-PII trainer directory records. Private users/{uid} profiles
  // are intentionally not readable as a directory.
  try {
    const snap = await getDocs(collection(db, 'trainerProfiles'));

    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const uid = docSnap.id;
      const trainer: TrainerProfile = {
        uid: uid,
        fullName: data.fullName || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Trainer Faculty',
        email: '',
        phone: '',
        organization: data.organization || data.school_or_university || 'Capacity Connect Institute',
        department: data.department || 'Training & Capacity Building',
        designation: data.designation || 'Senior Faculty',
        yearsOfExperience: data.yearsOfExperience || data.experienceYears || 5,
        qualification: data.qualification || "Master's Degree",
        bio: data.bio || '',
        areaOfExpertise: data.areaOfExpertise || 'Technical & Academic Training',
        specialization: data.specialization || 'Capacity Building',
        skills: Array.isArray(data.skills) ? data.skills.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean) : ['Technical Training', 'Instructional Design'],
        trainerExperience: data.trainerExperience || '',
        profilePhoto: data.profilePhoto || data.profile_image_url || '',
        competencies: sanitizeCompetencies(data.competencies),
        trainingPrograms: Array.isArray(data.trainingPrograms) ? data.trainingPrograms.filter(p => typeof p === 'string') : [],
        trainingTopics: Array.isArray(data.trainingTopics) ? data.trainingTopics.filter(t => typeof t === 'string') : [],
        preferredTrainingMode: data.preferredTrainingMode || 'Hybrid',
        certifications: Array.isArray(data.certifications) ? data.certifications.filter(c => typeof c === 'string') : []
      };

      trainersMap.set(uid, trainer);
    });
  } catch (err) {
    console.warn('[TrainerDiscovery] Firestore fetch warning, using available trainers:', err);
  }

  // 3. Load from local storage
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('kuma_registered_trainers');
      if (raw) {
        const localList: TrainerProfile[] = JSON.parse(raw);
        if (Array.isArray(localList)) {
          localList.forEach(t => {
            if (t && t.uid) {
              trainersMap.set(t.uid, {
                ...t,
                fullName: t.fullName || 'Trainer Faculty',
                skills: Array.isArray(t.skills) ? t.skills.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean) : [],
                competencies: sanitizeCompetencies(t.competencies)
              });
            }
          });
        }
      }
    } catch (lsErr) {}
  }

  return Array.from(trainersMap.values());
}

/**
 * Gets all stored trainer assignment records.
 */
export function getAllTrainerAssignments(): TrainerAssignmentRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRAINER_ASSIGNMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {}
  return [];
}

/**
 * Gets the active selected trainer assignment for a specific Trainee UID.
 */
export async function getTraineeSelectedTrainer(traineeId: string): Promise<{
  assignment: TrainerAssignmentRecord;
  trainer: TrainerProfile;
} | null> {
  if (!traineeId) return null;

  let assignment: TrainerAssignmentRecord | null = null;

  // 1. Try local storage first for fast response
  const allAssignments = getAllTrainerAssignments();
  assignment = allAssignments.find(a => a.traineeId === traineeId && a.status === 'Active') || null;

  // 2. Try Firestore if not in local storage
  if (!assignment) {
    try {
      const q = query(
        collection(db, 'trainer_assignments'),
        where('traineeId', '==', traineeId),
        where('status', '==', 'Active')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firstDoc = snap.docs[0];
        assignment = { id: firstDoc.id, ...firstDoc.data() } as TrainerAssignmentRecord;
      }
    } catch (err) {
      console.warn('[TrainerDiscovery] Firestore assignment fetch warning:', err);
    }
  }

  if (!assignment) return null;

  // Fetch full trainer profile for this assignment
  const trainers = await getAvailableTrainers();
  let trainer = trainers.find(t => t.uid === assignment!.trainerId || t.email === assignment!.trainerEmail);

  if (!trainer) {
    trainer = {
      uid: assignment.trainerId,
      fullName: assignment.trainerName || 'Assigned Trainer',
      email: assignment.trainerEmail || '',
      organization: 'Capacity Connect',
      department: 'Training Unit',
      designation: 'Senior Faculty',
      areaOfExpertise: 'Domain Expert'
    };
  }

  return { assignment, trainer };
}

/**
 * Selects/assigns a trainer for a trainee and persists the relationship.
 */
export async function selectTrainerForTrainee(
  traineeId: string,
  traineeProfile: { fullName: string; emailAddress?: string; organization?: string },
  trainer: TrainerProfile
): Promise<TrainerAssignmentRecord> {
  const assignmentId = `assign_${traineeId}_${trainer.uid}`;
  const now = new Date().toISOString();

  const record: TrainerAssignmentRecord = {
    id: assignmentId,
    traineeId: traineeId,
    traineeName: traineeProfile.fullName || 'Trainee Learner',
    traineeEmail: traineeProfile.emailAddress || '',
    trainerId: trainer.uid,
    trainerName: trainer.fullName,
    trainerEmail: trainer.email,
    organizationId: traineeProfile.organization || '',
    status: 'Active',
    createdAt: now
  };

  // 1. Save to local storage
  const existingAssignments = getAllTrainerAssignments();
  // Deactivate any previous active assignment for this trainee
  const updatedAssignments = existingAssignments.map(a => 
    a.traineeId === traineeId ? { ...a, status: 'Completed' as const } : a
  );
  updatedAssignments.unshift(record);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TRAINER_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updatedAssignments));
    } catch (err) {}
  }

  // 2. Save to Firestore doc
  try {
    const docRef = doc(db, 'trainer_assignments', assignmentId);
    await setDoc(docRef, { ...record, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[TrainerDiscovery] Firestore setDoc assignment notice:', err);
  }

  return record;
}

/**
 * Retrieves all trainees assigned to a specific Trainer UID.
 */
export async function getTrainerAssignedTrainees(trainerId: string, trainerEmail?: string): Promise<Array<{
  assignment: TrainerAssignmentRecord;
  traineeProfile: {
    uid: string;
    fullName: string;
    email: string;
    organization?: string;
    department?: string;
    designation?: string;
    skills?: string[];
    competencies?: any[];
    skillGapsCount?: number;
    trainingProgress?: number;
  };
}>> {
  if (!trainerId) return [];

  const localAssignments = getAllTrainerAssignments().filter(a => 
    a.trainerId === trainerId || 
    a.trainerEmail === trainerId ||
    (trainerEmail && a.trainerEmail === trainerEmail)
  );

  // Firestore query
  const firestoreAssignments: TrainerAssignmentRecord[] = [];
  try {
    const q = query(
      collection(db, 'trainer_assignments'),
      where('trainerId', '==', trainerId)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => firestoreAssignments.push({ id: d.id, ...d.data() } as TrainerAssignmentRecord));

    if (trainerEmail) {
      const qEmail = query(
        collection(db, 'trainer_assignments'),
        where('trainerEmail', '==', trainerEmail)
      );
      const snapEmail = await getDocs(qEmail);
      snapEmail.docs.forEach(d => firestoreAssignments.push({ id: d.id, ...d.data() } as TrainerAssignmentRecord));
    }
  } catch (err) {}

  const mergedMap = new Map<string, TrainerAssignmentRecord>();
  localAssignments.forEach(a => mergedMap.set(a.id, a));
  firestoreAssignments.forEach(a => mergedMap.set(a.id, a));

  const records = Array.from(mergedMap.values()).filter(a => a.status === 'Active');

  const results = [];
  for (const assignment of records) {
    // Attempt to fetch full trainee profile from Firestore or localStorage
    let traineeData: any = null;
    try {
      const uSnap = await getDoc(doc(db, 'users', assignment.traineeId));
      if (uSnap.exists()) {
        traineeData = uSnap.data();
      }
    } catch (e) {}

    const profile = {
      uid: assignment.traineeId,
      fullName: traineeData?.fullName || assignment.traineeName || 'Trainee Learner',
      email: traineeData?.email || assignment.traineeEmail || '',
      organization: traineeData?.organization || 'Capacity Building Unit',
      department: traineeData?.department || 'Operations',
      designation: traineeData?.designation || 'Trainee Associate',
      skills: Array.isArray(traineeData?.skills) ? traineeData.skills.map((s: any) => typeof s === 'string' ? s : s.name) : ['Data Analysis', 'React'],
      competencies: Array.isArray(traineeData?.competencies) ? traineeData.competencies : [],
      skillGapsCount: Array.isArray(traineeData?.competencies) ? traineeData.competencies.filter((c: any) => (c.targetNumericLevel || 3) > (c.numericLevel || 1)).length : 1,
      trainingProgress: 75
    };

    results.push({
      assignment,
      traineeProfile: profile
    });
  }

  return results;
}
