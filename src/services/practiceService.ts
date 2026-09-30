/**
 * Project Kuma - Practice Service & Readiness Signal
 * Ungraded, low-stakes practice module manager.
 * NEVER writes to competencyRecords or attempts.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PracticeQuestion, PracticeResult } from '../types';
import { readJson, writeJson } from '../utils/safeStorage';

const PRACTICE_LOCAL_STORAGE_KEY = 'kuma_practice_results';

/**
 * Seed practice questions per module for immediate demo/course availability.
 */
const SEED_PRACTICE_QUESTIONS: Record<string, PracticeQuestion[]> = {
  default: [
    {
      id: 'pq-1',
      questionText: 'What is the primary goal of data normalization in database management?',
      options: [
        { id: 'opt-a', text: 'To encrypt database files on disk' },
        { id: 'opt-b', text: 'To reduce data redundancy and improve data integrity' },
        { id: 'opt-c', text: 'To increase memory usage for faster queries' },
        { id: 'opt-d', text: 'To generate automatic backup snapshots' }
      ],
      correctOptionId: 'opt-b',
      explanation: 'Normalization organizes columns and tables to ensure dependencies are properly enforced and redundancy is minimized.'
    },
    {
      id: 'pq-2',
      questionText: 'In asynchronous programming, what does a Promise represent?',
      options: [
        { id: 'opt-a', text: 'A synchronous block of execution' },
        { id: 'opt-b', text: 'A thread pool allocation request' },
        { id: 'opt-c', text: 'An eventual completion (or failure) of an asynchronous operation' },
        { id: 'opt-d', text: 'A database transaction isolation lock' }
      ],
      correctOptionId: 'opt-c',
      explanation: 'A Promise is a proxy for a value not necessarily known when the promise is created, allowing asynchronous methods to return values.'
    },
    {
      id: 'pq-3',
      questionText: 'Which HTTP method should be used for idempotent update requests?',
      options: [
        { id: 'opt-a', text: 'POST' },
        { id: 'opt-b', text: 'PUT' },
        { id: 'opt-c', text: 'CONNECT' },
        { id: 'opt-d', text: 'PATCH (non-idempotent variants)' }
      ],
      correctOptionId: 'opt-b',
      explanation: 'PUT requests are idempotent: calling the same PUT request multiple times produces the exact same resource state.'
    }
  ]
};

/**
 * Fetch practice questions for a specific module.
 */
export async function getModulePracticeQuestions(
  courseId: string,
  moduleId: string
): Promise<PracticeQuestion[]> {
  try {
    const docRef = doc(db, 'trainingPrograms', courseId, 'modules', moduleId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.practiceQuestions) {
      return snap.data().practiceQuestions as PracticeQuestion[];
    }
  } catch (err) {
    console.warn('[PracticeService] Firestore query notice:', err);
  }

  // Fallback to seed practice questions
  return SEED_PRACTICE_QUESTIONS[moduleId] || SEED_PRACTICE_QUESTIONS.default;
}

/**
 * Saves a practice result for a trainee.
 * GUARANTEE: NEVER touches competencyRecords or graded attempts.
 */
export async function savePracticeResult(
  uid: string,
  courseId: string,
  moduleId: string,
  score: number,
  missedQuestionIds: string[] = []
): Promise<PracticeResult> {
  const resultId = `${uid}_${moduleId}`;

  // Read existing count if present
  let existingAttempts = 0;
  const localMap = readJson<Record<string, PracticeResult>>(PRACTICE_LOCAL_STORAGE_KEY, {}) || {};
  if (localMap[resultId]) {
    existingAttempts = localMap[resultId].attemptsCount || 0;
  }

  const result: PracticeResult = {
    id: resultId,
    uid,
    courseId,
    moduleId,
    attemptsCount: existingAttempts + 1,
    lastScore: Math.max(0, Math.min(100, Math.round(score))),
    missedQuestionIds,
    updatedAt: new Date().toISOString()
  };

  // 1. Save to local storage cache
  localMap[resultId] = result;
  writeJson(PRACTICE_LOCAL_STORAGE_KEY, localMap);

  // 2. Persist to Firestore practiceResults/{uid}_{moduleId}
  if (uid && !uid.startsWith('demo-') && uid !== 'trainee@organization.gov.in') {
    try {
      const docRef = doc(db, 'practiceResults', resultId);
      await setDoc(docRef, {
        ...result,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[PracticeService] Failed to write practice result to Firestore:', err);
    }
  }

  return result;
}

/**
 * Retrieves practice result for a specific module.
 */
export function getPracticeResult(uid: string, moduleId: string): PracticeResult | null {
  const resultId = `${uid}_${moduleId}`;
  const localMap = readJson<Record<string, PracticeResult>>(PRACTICE_LOCAL_STORAGE_KEY, {}) || {};
  return localMap[resultId] || null;
}

/**
 * Calculates advisory practice readiness score for a course.
 */
export function getCoursePracticeReadiness(
  uid: string,
  courseId: string,
  moduleIds: string[] = []
): { readinessPercent: number; practicedCount: number; label: string } {
  const localMap = readJson<Record<string, PracticeResult>>(PRACTICE_LOCAL_STORAGE_KEY, {}) || {};
  const relevantResults = Object.values(localMap).filter(
    (r) => r.uid === uid && (r.courseId === courseId || moduleIds.includes(r.moduleId))
  );

  if (relevantResults.length === 0) {
    return { readinessPercent: 0, practicedCount: 0, label: 'Not Practiced Yet' };
  }

  const totalScore = relevantResults.reduce((acc, r) => acc + (r.lastScore || 0), 0);
  const avg = Math.round(totalScore / relevantResults.length);

  let label = 'Building Skills';
  if (avg >= 80) label = 'High Readiness';
  else if (avg >= 50) label = 'Moderate Readiness';

  return {
    readinessPercent: avg,
    practicedCount: relevantResults.length,
    label
  };
}
