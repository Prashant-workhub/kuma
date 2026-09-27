/**
 * Project Kuma - Phase 3F Certificate & Verification Engine
 * Generates unique platform training certificates and manages verification records.
 */

import { TrainingCertificate, TeacherAssignment, UserSettings } from '../types';

const CERT_STORAGE_KEY = 'kuma_user_certificates';
const ENROLLMENT_STORAGE_KEY = 'kuma_user_enrollments';

/**
 * Generates a unique, non-sequential Certificate ID.
 * Format: KUMA-2026-XXXXXXXX (e.g. KUMA-2026-A89B2C4E)
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `KUMA-${year}-${randomPart}`;
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
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CERT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to parse stored certificates:', err);
    }
  }
  return inMemoryCertificates;
}

/**
 * Retrieves certificates for a specific user ID.
 */
export function getUserCertificates(userId: string): TrainingCertificate[] {
  const certs = getAllCertificates();
  return certs.filter((c) => c.userId === userId || userId === 'all' || !c.userId);
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

  const certId = generateCertificateId();
  const today = new Date().toISOString().split('T')[0];

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
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(updatedCerts));
    } catch (err) {
      console.warn('Failed to save certificate record:', err);
    }
  }

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
