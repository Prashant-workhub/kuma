/**
 * Project Kuma - Secure Assessment API Service
 * Handles server-side start, submit, and persistence for assessments.
 */

import { auth } from '../firebaseConfig';
import { SkillProficiencyLevel } from '../types';

export interface StartAssessmentResponse {
  attemptId: string;
  startedAt: string;
  assessment: {
    id: string;
    title: string;
    competencyId: string;
    competencyName?: string;
    courseName?: string;
    timeLimitMinutes: number;
    maxAttempts: number;
    passPercent: number;
    questions: Array<{
      id: string;
      type: string;
      question: string;
      options: string[];
    }>;
  };
}

export interface QuestionResult {
  isCorrect: boolean;
  correctAnswer: number | string;
  explanation: string;
}

export interface SubmitAssessmentResponse {
  attemptId: string;
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  passed: boolean;
  level: SkillProficiencyLevel;
  numericLevel: 1 | 2 | 3 | 4;
  perQuestion: Record<string, QuestionResult>;
  completedAt: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.warn('[assessmentService] Failed to retrieve Auth ID token:', err);
    }
  }
  return {};
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // In local development with Vite dev server on port 5173
      return 'http://localhost:10000/api';
    }
  }
  return '/api';
}

/**
 * Initiates an assessment session on the server.
 * Returns sanitized questions without answer keys.
 */
export async function startAssessment(assessmentId: string): Promise<StartAssessmentResponse> {
  const headers = await getAuthHeader();
  const url = `${getApiBaseUrl()}/assessments/${encodeURIComponent(assessmentId)}/start`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to start assessment');
  }

  return data;
}

/**
 * Submits user answers to the server for validation and scoring.
 * Scores against assessmentKeys and updates Firestore server-side.
 */
export async function submitAssessment(
  assessmentId: string,
  attemptId: string,
  answers: Record<string, number | string>
): Promise<SubmitAssessmentResponse> {
  const headers = await getAuthHeader();
  const url = `${getApiBaseUrl()}/assessments/${encodeURIComponent(assessmentId)}/submit`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ attemptId, answers })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit assessment');
  }

  return data;
}

/**
 * Creates or updates an assessment and its private answer keys (Trainer/Admin).
 */
export async function createOrUpdateAssessment(assessmentData: any): Promise<any> {
  const headers = await getAuthHeader();
  const url = `${getApiBaseUrl()}/assessments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(assessmentData)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to save assessment');
  }

  return data;
}
