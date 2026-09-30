import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface CompetencyGain {
  competencyId: string;
  fromLevel: number;
  toLevel: number;
}

export interface ServerCertificate {
  certId: string;
  uid: string;
  courseId: string;
  courseTitle: string;
  traineeName: string;
  orgId: string;
  issuedAt: string;
  completionEnrollmentId: string;
  attemptId: string;
  competencyGains: CompetencyGain[];
  status: 'valid' | 'revoked';
  revokedAt?: string;
  signature: string;
}

export interface PublicVerificationResponse {
  status: 'valid' | 'revoked' | 'not_found' | 'invalid';
  certId?: string;
  traineeName?: string;
  courseTitle?: string;
  issuedAt?: string;
  orgName?: string;
  competencyGains?: CompetencyGain[];
  revokedAt?: string;
  message?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * Calls backend API POST /api/certificates/issue to issue an HMAC-SHA256 signed certificate.
 * Server verifies completion and passing attempt.
 */
export async function issueServerCertificate(params: {
  enrollmentId: string;
  attemptId?: string;
  courseId?: string;
  courseTitle?: string;
  traineeName?: string;
  orgId?: string;
  competencyGains?: CompetencyGain[];
}): Promise<{ success: boolean; certificate?: ServerCertificate; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/certificates/issue', {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to issue certificate' };
    }

    return { success: true, certificate: data.certificate };
  } catch (err: any) {
    console.error('[certificateService] issueServerCertificate error:', err);
    return { success: false, error: err.message || 'Network or server error' };
  }
}

/**
 * Public verification endpoint GET /api/certificates/verify/:certId (No Auth required).
 * Returns minimal verification metadata without private PII (uid/email).
 */
export async function verifyServerCertificate(certId: string): Promise<PublicVerificationResponse> {
  if (!certId || !certId.trim()) {
    return { status: 'not_found', message: 'Certificate ID is required' };
  }

  try {
    const response = await fetch(`/api/certificates/verify/${encodeURIComponent(certId.trim())}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok && response.status !== 404) {
      return {
        status: 'not_found',
        message: data.error || data.message || 'Verification lookup failed'
      };
    }

    return {
      status: data.status || 'not_found',
      certId: data.certId,
      traineeName: data.traineeName,
      courseTitle: data.courseTitle,
      issuedAt: data.issuedAt,
      orgName: data.orgName,
      competencyGains: data.competencyGains,
      revokedAt: data.revokedAt,
      message: data.message
    };
  } catch (err: any) {
    console.error('[certificateService] verifyServerCertificate error:', err);
    return {
      status: 'not_found',
      message: 'Network error verifying certificate'
    };
  }
}

/**
 * Admin endpoint POST /api/admin/certificates/:certId/revoke to revoke a certificate.
 */
export async function revokeServerCertificate(certId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/admin/certificates/${encodeURIComponent(certId)}/revoke`, {
      method: 'POST',
      headers
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to revoke certificate' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[certificateService] revokeServerCertificate error:', err);
    return { success: false, error: err.message || 'Network or server error' };
  }
}

/**
 * Retrieves a user's server certificates directly from Firestore certificates collection or API.
 */
export async function getUserServerCertificates(uid: string): Promise<ServerCertificate[]> {
  if (!uid) return [];

  try {
    if (db) {
      const q = query(collection(db, 'certificates'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const list: ServerCertificate[] = [];
      snap.forEach((docSnap) => {
        list.push({ certId: docSnap.id, ...docSnap.data() } as ServerCertificate);
      });
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn('[certificateService] Firestore direct read fallback:', err);
  }

  // Demo fallback
  if (uid === 'user-demo-1' || uid === 'aarav.sharma@capacityconnect.in') {
    return [
      {
        certId: 'KUMA-2026-DA10199X',
        uid: 'user-demo-1',
        courseId: 'c-da101',
        courseTitle: 'Advanced Data Analytics & Insights',
        traineeName: 'Trainee Learner',
        orgId: 'Ministry of Skill Development & Entrepreneurship',
        issuedAt: '2026-09-25T00:00:00.000Z',
        completionEnrollmentId: 'enr-c-da101',
        attemptId: 'att-da101',
        competencyGains: [{ competencyId: 'cat-comp-2', fromLevel: 1, toLevel: 3 }],
        status: 'valid',
        signature: 'demo-signature-hash'
      }
    ];
  }

  return [];
}
