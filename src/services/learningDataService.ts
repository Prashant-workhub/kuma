/**
 * Project Kuma - Durable Learning Data Service (Firestore)
 * Handles attempts/{attemptId}, competencyRecords/{uid}_{competencyId}, and enrollments/{enrollmentId}.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type {
  AssessmentAttempt,
  CompetencyHistoryEntry,
  CompetencyRecord,
  FirestoreEnrollment
} from '../types';

// ==========================================
// ATTEMPTS: attempts/{attemptId}
// ==========================================

/**
 * Saves an immutable assessment attempt record to attempts/{attemptId}.
 */
export async function saveAttempt(
  attemptData: Omit<AssessmentAttempt, 'id'> & { id?: string }
): Promise<AssessmentAttempt> {
  const attemptId = attemptData.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record: AssessmentAttempt = {
    ...attemptData,
    id: attemptId,
    createdAt: attemptData.createdAt || new Date().toISOString()
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    try {
      const attemptRef = doc(db, 'attempts', attemptId);
      await setDoc(attemptRef, record);
    } catch (error) {
      console.warn('[learningDataService] Failed to write attempt to Firestore:', error);
    }
  }

  return record;
}

/**
 * Retrieves all attempts for a given user ID.
 */
export async function getUserAttempts(uid: string): Promise<AssessmentAttempt[]> {
  if (!uid) return [];
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return [];

  try {
    const q = query(collection(db, 'attempts'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id
    } as AssessmentAttempt));
  } catch (error) {
    console.warn('[learningDataService] Failed to query attempts from Firestore:', error);
    return [];
  }
}

/**
 * Retrieves a single attempt by its ID.
 */
export async function getAttemptById(attemptId: string): Promise<AssessmentAttempt | null> {
  if (!attemptId) return null;
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return null;

  try {
    const snap = await getDoc(doc(db, 'attempts', attemptId));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as AssessmentAttempt;
  } catch (error) {
    console.warn('[learningDataService] Failed to fetch attempt by ID:', error);
    return null;
  }
}

// ==========================================
// COMPETENCY RECORDS: competencyRecords/{uid}_{competencyId}
// ==========================================

/**
 * Fetches a single competency record for a user.
 */
export async function getCompetencyRecord(
  uid: string,
  competencyId: string
): Promise<CompetencyRecord | null> {
  if (!uid || !competencyId) return null;
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return null;

  try {
    const docId = `${uid}_${competencyId}`;
    const snap = await getDoc(doc(db, 'competencyRecords', docId));
    if (!snap.exists()) return null;
    return snap.data() as CompetencyRecord;
  } catch (error) {
    console.warn('[learningDataService] Failed to fetch competency record:', error);
    return null;
  }
}

/**
 * Fetches all competency records for a user.
 */
export async function getUserCompetencyRecords(uid: string): Promise<CompetencyRecord[]> {
  if (!uid) return [];
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return [];

  try {
    const q = query(collection(db, 'competencyRecords'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as CompetencyRecord);
  } catch (error) {
    console.warn('[learningDataService] Failed to query competency records:', error);
    return [];
  }
}

/**
 * Directly updates or saves a competency record.
 */
export async function saveCompetencyRecord(record: CompetencyRecord): Promise<CompetencyRecord> {
  const docId = `${record.uid}_${record.competencyId}`;
  const updatedRecord: CompetencyRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    try {
      const ref = doc(db, 'competencyRecords', docId);
      await setDoc(ref, updatedRecord, { merge: true });
    } catch (error) {
      console.warn('[learningDataService] Failed to save competency record to Firestore:', error);
    }
  }

  return updatedRecord;
}

/**
 * Records a declared competency level and appends to history.
 */
export async function recordDeclaredCompetency(
  uid: string,
  competencyId: string,
  declaredLevel: number
): Promise<CompetencyRecord> {
  const existing = await getCompetencyRecord(uid, competencyId);

  const historyEntry: CompetencyHistoryEntry = {
    level: declaredLevel,
    source: 'declared',
    at: new Date().toISOString()
  };

  const existingHistory = existing?.history || [];
  const assessedLevel = existing?.assessedLevel || 0;
  const currentLevel = Math.max(declaredLevel, assessedLevel);

  const record: CompetencyRecord = {
    uid,
    competencyId,
    declaredLevel,
    assessedLevel,
    currentLevel,
    history: [historyEntry, ...existingHistory],
    updatedAt: new Date().toISOString()
  };

  return saveCompetencyRecord(record);
}

/**
 * Records an assessed competency outcome from an assessment attempt.
 */
export async function recordAssessedCompetency(
  uid: string,
  competencyId: string,
  assessedLevel: number,
  attemptId?: string
): Promise<CompetencyRecord> {
  const existing = await getCompetencyRecord(uid, competencyId);

  const historyEntry: CompetencyHistoryEntry = {
    level: assessedLevel,
    source: 'assessed',
    at: new Date().toISOString(),
    ...(attemptId ? { attemptId } : {})
  };

  const existingHistory = existing?.history || [];
  const declaredLevel = existing?.declaredLevel || 0;
  const currentLevel = Math.max(declaredLevel, assessedLevel);

  const record: CompetencyRecord = {
    uid,
    competencyId,
    declaredLevel,
    assessedLevel,
    currentLevel,
    history: [historyEntry, ...existingHistory],
    updatedAt: new Date().toISOString()
  };

  return saveCompetencyRecord(record);
}

// ==========================================
// ENROLLMENTS: enrollments/{enrollmentId}
// ==========================================

/**
 * Fetches an enrollment doc by user ID and course ID.
 */
export async function getEnrollment(
  uid: string,
  courseId: string
): Promise<FirestoreEnrollment | null> {
  if (!uid || !courseId) return null;
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return null;

  try {
    const docId = `${uid}_${courseId}`;
    const snap = await getDoc(doc(db, 'enrollments', docId));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as FirestoreEnrollment;
  } catch (error) {
    console.warn('[learningDataService] Failed to fetch enrollment:', error);
    return null;
  }
}

/**
 * Fetches all enrollments for a user from Firestore.
 */
export async function getUserEnrollmentsFromFirestore(uid: string): Promise<FirestoreEnrollment[]> {
  if (!uid) return [];
  if (!db || typeof db !== 'object' || Object.keys(db).length === 0) return [];

  try {
    const q = query(collection(db, 'enrollments'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      ...docSnap.data(),
      id: docSnap.id
    } as FirestoreEnrollment));
  } catch (error) {
    console.warn('[learningDataService] Failed to query enrollments from Firestore:', error);
    return [];
  }
}

/**
 * Saves or updates an enrollment record in enrollments/{enrollmentId}.
 */
export async function saveEnrollmentToFirestore(
  enrollment: FirestoreEnrollment
): Promise<FirestoreEnrollment> {
  const docId = enrollment.id || `${enrollment.uid}_${enrollment.courseId}`;
  const now = new Date().toISOString();
  const record: FirestoreEnrollment = {
    ...enrollment,
    id: docId,
    updatedAt: now
  };

  if (db && typeof db === 'object' && Object.keys(db).length > 0) {
    try {
      const ref = doc(db, 'enrollments', docId);
      await setDoc(ref, record, { merge: true });
    } catch (error) {
      console.warn('[learningDataService] Failed to save enrollment to Firestore:', error);
    }
  }

  return record;
}
