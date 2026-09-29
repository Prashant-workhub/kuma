/**
 * Project Kuma - Phase 3F Certificate & Verification Engine
 * Generates unique platform training certificates and manages verification records.
 */

import { TrainingCertificate, TeacherAssignment, UserSettings } from '../types';
import { saveCertificateToCloudStorage } from '../services/storageService';
import { readJson, writeJson } from './safeStorage';

const CERT_STORAGE_KEY = 'kuma_user_certificates';
const ENROLLMENT_STORAGE_KEY = 'kuma_user_enrollments';

/**
 * Generates a unique, non-sequential Certificate ID.
 * Format: KUMA-2026-XXXXXXXX (e.g. KUMA-2026-A89B2C4E)
 *
 * Uses a cryptographically strong source when available. `crypto.randomUUID`
 * requires a secure context and is missing on older browsers, so we fall back to
 * `crypto.getRandomValues` and finally to a Math.random-based generator. The
 * previous `Math.random().toString(36).substring(2, 10)` could emit fewer than 8
 * characters (e.g. Math.random() === 0.5 yields "I"), producing weak IDs such as
 * "KUMA-2026-I" that are both guessable and far more likely to collide.
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const randomPart = generateRandomPart();
  return `KUMA-${year}-${randomPart}`;
}

/** Returns exactly 8 uppercase hexadecimal characters. */
function generateRandomPart(): string {
  const cryptoObj: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  }

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(4);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  // Last-resort fallback: pad so the segment is never short.
  let out = '';
  while (out.length < 8) out += Math.random().toString(36).substring(2, 10);
  return out.substring(0, 8).toUpperCase();
}

let inMemoryCertificates: TrainingCertificate[] = [
  {
    id: 'KUMA-2026-DA10199X',
    userId: 'user-demo-1',
    userName: 'Trainee Learner',
    userEmail: 'trainee@organization.gov.in',
    courseId: 'c-da101',
    courseCode: 'DA101',
    courseName: 'Advanced Data Analytics & Insights',
    organization: 'Ministry of Skill Development & Entrepreneurship',
    department: 'Capacity Building & Training',
    designation: 'Senior Training Associate',
    issueDate: '2026-09-25',
    completionDate: '2026-09-25',
    verified: true,
    verificationUrl: '/verify/certificate/KUMA-2026-DA10199X',
    competenciesAddressed: ['Data Analysis & Insights'],
    enrollmentId: 'enr-c-da101'
  }
];

/**
 * Returns all stored certificate records.
 */
export function getAllCertificates(): TrainingCertificate[] {
  const parsed = readJson<TrainingCertificate[] | null>(CERT_STORAGE_KEY, null);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  return inMemoryCertificates;
}

/**
 * Retrieves certificates for a specific user ID.
 * REAL AUTHENTICATED USERS: Returns only certificates where c.userId === userId or c.userEmail === userId.
 * DEMO ACCOUNTS: Returns demo certificate records.
 */
export function getUserCertificates(userId: string): TrainingCertificate[] {
  if (!userId) return [];

  const cleanId = userId.trim().toLowerCase();
  const isDemoAccount =
    cleanId === 'user-demo-1' ||
    cleanId === 'trainee-demo-aarav' ||
    cleanId === 'aarav.sharma@capacityconnect.in' ||
    cleanId === 'guest.student@kuma.ai' ||
    cleanId === 'all';

  const certs = getAllCertificates();

  if (isDemoAccount) {
    return certs.filter(
      (c) =>
        c.userId === userId ||
        c.userId === 'user-demo-1' ||
        c.userEmail === 'trainee@organization.gov.in' ||
        c.userEmail === 'aarav.sharma@capacityconnect.in' ||
        userId === 'all'
    );
  }

  // Real authenticated user: filter strictly by their matching userId or userEmail
  return certs.filter(
    (c) =>
      (c.userId && c.userId.toLowerCase() === cleanId) ||
      (c.userEmail && c.userEmail.toLowerCase() === cleanId)
  );
}

/**
 * Looks up a certificate by ID (case-insensitive).
 */
export function getCertificateById(certId: string): TrainingCertificate | null {
  if (!certId) return null;
  const cleanId = certId.trim().toUpperCase();
  const certs = getAllCertificates();
  return certs.find((c) => c.id.toUpperCase() === cleanId) || null;
}

/**
 * Issues a digital certificate upon course completion.
 * Rule: Duplicate certificates for the same trainee and course are strictly prevented.
 */
export function issueCertificateForCompletion(
  userProfile: UserSettings['profile'],
  course: TeacherAssignment,
  enrollmentId?: string
): TrainingCertificate {
  const certs = getAllCertificates();
  const userId = userProfile.uid || 'user-demo-1';

  // Rule: Check if certificate already issued for this user & course
  const existingCert = certs.find(
    (c) => (c.userId === userId || c.userEmail === userProfile.emailAddress) && c.courseId === course.id
  );

  if (existingCert) {
    return existingCert;
  }

  const today = new Date().toISOString().split('T')[0];

  // Guarantee a globally unique ID. Random collisions are rare but would make
  // two different trainees share a certificate ID, causing verifyCertificate() to
  // return the wrong record. Retry until the ID is unused.
  const takenIds = new Set(certs.map((c) => c.id.toUpperCase()));
  let certId = generateCertificateId();
  for (let attempt = 0; attempt < 10 && takenIds.has(certId); attempt++) {
    certId = generateCertificateId();
  }
  if (takenIds.has(certId)) {
    // Extremely unlikely; append a monotonic counter to force uniqueness.
    certId = `${certId}-${certs.length + 1}`;
  }

  const newCertificate: TrainingCertificate = {
    id: certId,
    userId: userId,
    userName: userProfile.fullName || 'Trainee Learner',
    userEmail: userProfile.emailAddress || 'trainee@organization.gov.in',
    courseId: course.id,
    courseCode: course.courseCode || 'TRN-2026',
    courseName: course.courseName,
    organization: userProfile.organization || userProfile.institution || 'National Capacity Building Portal',
    department: userProfile.department || 'Training Unit',
    designation: userProfile.designation || 'Trainee Specialist',
    issueDate: today,
    completionDate: today,
    verified: true,
    verificationUrl: `/verify/certificate/${certId}`,
    competenciesAddressed: course.competencyNames || [],
    enrollmentId: enrollmentId
  };

  const updatedCerts = [newCertificate, ...certs];
  inMemoryCertificates = updatedCerts;
  writeJson(CERT_STORAGE_KEY, updatedCerts);

  // Asynchronously backup certificate metadata & verification payload to Azure Cloud Storage
  saveCertificateToCloudStorage(newCertificate).catch((err) => {
    console.warn('[Azure Storage] Background certificate cloud backup notice:', err);
  });

  return newCertificate;
}

/**
 * Public certificate verification result metadata.
 */
export interface VerificationResult {
  isValid: boolean;
  message: string;
  certificate?: {
    id: string;
    userName: string;
    courseName: string;
    courseCode: string;
    organization: string;
    issueDate: string;
    completionDate: string;
    status: 'Valid' | 'Invalid';
    competenciesAddressed?: string[];
  };
}

/**
 * Public Verification lookup (does NOT expose private user details like email/uid).
 */
export function verifyCertificate(certId: string): VerificationResult {
  const cert = getCertificateById(certId);

  if (!cert) {
    return {
      isValid: false,
      message: 'Certificate ID not found in Kuma records.'
    };
  }

  return {
    isValid: true,
    message: 'Official Kuma Training Completion Certificate Verified Successfully.',
    certificate: {
      id: cert.id,
      userName: cert.userName,
      courseName: cert.courseName,
      courseCode: cert.courseCode,
      organization: cert.organization,
      issueDate: cert.issueDate,
      completionDate: cert.completionDate,
      status: 'Valid',
      competenciesAddressed: cert.competenciesAddressed
    }
  };
}
