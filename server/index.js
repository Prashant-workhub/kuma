/**
 * Project Kuma Backend Server for Render Deployment
 * Express + Firebase Admin SDK REST API
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Firebase Admin Initialization
let firebaseAdminApp = null;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    console.log('[Kuma Backend] Firebase Admin initialized with service account.');
  } else {
    console.warn('[Kuma Backend] Firebase Admin is disabled: server credentials are not configured.');
  }
} catch (err) {
  console.warn('[Kuma Backend] Firebase Admin initialization warning:', err.message);
}

const db = firebaseAdminApp ? admin.firestore() : null;

// ============================================================================
// REST API ROUTES
// ============================================================================

// Health check endpoint (for Render automated ping)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Kuma Capacity Connect Backend',
    timestamp: new Date().toISOString(),
    firebaseAdminConnected: !!db
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '1.0.0' });
});

// Centralized Competency Catalog API
app.get('/api/competencies', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('competencyCatalog').get();
      const catalog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: catalog.length, catalog });
    }
    return res.json({
      success: true,
      message: 'Running in standalone fallback mode',
      catalog: [
        { id: 'cat-comp-1', name: 'Python Programming', category: 'Technical', isActive: true },
        { id: 'cat-comp-2', name: 'Data Analysis & Insights', category: 'Technical', isActive: true },
        { id: 'cat-comp-9', name: 'Digital Literacy & Tech Adoption', category: 'Digital', isActive: true }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin authentication & authorization middleware
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing Authorization header' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (db && firebaseAdminApp) {
      const decoded = await admin.auth().verifyIdToken(token);
      // Administrative access is granted only by a Firebase custom claim.
      // It cannot be derived from a mutable Firestore document or email text.
      if (decoded.admin === true) {
        req.user = { uid: decoded.uid, email: decoded.email || '', role: 'admin' };
        return next();
      }
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }
    return res.status(503).json({ success: false, error: 'Admin API unavailable: Firebase Admin credentials are not configured.' });
  } catch (err) {
    return res.status(401).json({ success: false, error: `Unauthorized: ${err.message}` });
  }
};

// Protected Admin Summary API Route
app.get('/api/admin/summary', verifyAdminToken, async (req, res) => {
  try {
    if (db) {
      const usersSnap = await db.collection('users').get();
      const compsSnap = await db.collection('competencyCatalog').get();
      const certsSnap = await db.collection('certificates').get();
      
      const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
      const trainees = users.filter(u => (u.role || '').toLowerCase() === 'student' || (u.role || '').toLowerCase() === 'trainee');
      const trainers = users.filter(u => (u.role || '').toLowerCase() === 'faculty' || (u.role || '').toLowerCase() === 'trainer');

      return res.json({
        success: true,
        summary: {
          totalTrainees: trainees.length,
          totalTrainers: trainers.length,
          totalCompetencies: compsSnap.size,
          certificatesIssued: certsSnap.size
        }
      });
    }

    return res.json({
      success: true,
      summary: {
        totalTrainees: 4,
        totalTrainers: 2,
        totalCompetencies: 8,
        certificatesIssued: 3
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// ADMIN APPROVAL WORKFLOW, ROLE MANAGEMENT & AUDIT LOG
// ============================================================================

const STATIC_USERS = new Map([
  [
    'user-demo-1',
    {
      uid: 'user-demo-1',
      fullName: 'Trainee Learner',
      email: 'trainee@organization.gov.in',
      role: 'trainee',
      approvalStatus: 'approved',
      organization: 'Ministry of Skill Development & Entrepreneurship',
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ],
  [
    'trainer-demo-1',
    {
      uid: 'trainer-demo-1',
      fullName: 'Prof. Vikram Sen',
      email: 'trainer@acme.com',
      role: 'trainer',
      approvalStatus: 'approved',
      organization: 'Acme Digital Services',
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ],
  [
    'trainer-pending-1',
    {
      uid: 'trainer-pending-1',
      fullName: 'Dr. Anita Roy',
      email: 'anita.roy@capacityconnect.in',
      role: 'trainer',
      approvalStatus: 'pending',
      organization: 'National Capacity Building Council',
      createdAt: '2026-09-28T10:00:00.000Z'
    }
  ]
]);

const STATIC_AUDIT_LOGS = [];
const STATIC_NOTIFICATIONS = new Map();

export async function logAuditEntry(entry) {
  const logDoc = {
    id: entry.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    actorUid: entry.actorUid || 'system',
    actorEmail: entry.actorEmail || 'system@kuma.gov.in',
    targetUid: entry.targetUid || '',
    action: entry.action,
    details: entry.details || {},
    timestamp: entry.timestamp || new Date().toISOString()
  };

  if (db) {
    try {
      await db.collection('auditLog').doc(logDoc.id).set(logDoc);
    } catch (e) {
      console.warn('[AuditLog] Firestore write warning:', e.message);
    }
  }
  STATIC_AUDIT_LOGS.unshift(logDoc);
  return logDoc;
}

export async function sendUserNotification(notif) {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const notifDoc = {
    id: notifId,
    uid: notif.uid,
    title: notif.title,
    message: notif.message,
    type: notif.type || 'info',
    read: false,
    createdAt: new Date().toISOString()
  };

  if (db) {
    try {
      await db.collection('notifications').doc(notifId).set(notifDoc);
    } catch (e) {
      console.warn('[Notification] Firestore write warning:', e.message);
    }
  }

  const userNotifs = STATIC_NOTIFICATIONS.get(notif.uid) || [];
  userNotifs.unshift(notifDoc);
  STATIC_NOTIFICATIONS.set(notif.uid, userNotifs);

  return notifDoc;
}

// GET /api/admin/users?status=&role=
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  try {
    const { status, role } = req.query;
    let users = [];

    if (db) {
      const snap = await db.collection('users').get();
      users = snap.docs.map(doc => {
        const d = doc.data();
        return {
          uid: doc.id,
          fullName: d.fullName || d.name || '',
          email: d.email || '',
          role: d.role || 'trainee',
          approvalStatus: d.approvalStatus || (['faculty', 'teacher', 'trainer'].includes((d.role || '').toLowerCase()) ? 'pending' : 'approved'),
          organization: d.organization || '',
          department: d.department || '',
          createdAt: d.createdAt || d.created_at || ''
        };
      });
    } else {
      users = Array.from(STATIC_USERS.values());
    }

    if (status) {
      users = users.filter(u => (u.approvalStatus || '').toLowerCase() === String(status).toLowerCase());
    }

    if (role) {
      users = users.filter(u => (u.role || '').toLowerCase() === String(role).toLowerCase());
    }

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:uid/approve
app.post('/api/admin/users/:uid/approve', verifyAdminToken, async (req, res) => {
  try {
    const { uid } = req.params;
    let targetUser = null;
    const now = new Date().toISOString();

    if (db) {
      const uRef = db.collection('users').doc(uid);
      const uSnap = await uRef.get();
      if (!uSnap.exists) {
        return res.status(404).json({ success: false, error: 'User document not found' });
      }
      targetUser = { uid, ...uSnap.data() };
      const prevStatus = targetUser.approvalStatus || 'pending';

      await uRef.update({
        approvalStatus: 'approved',
        approvedAt: now,
        approvedBy: req.user.uid
      });

      const isTrainerRole = ['faculty', 'teacher', 'trainer'].includes((targetUser.role || '').toLowerCase());
      if (isTrainerRole) {
        const tpRef = db.collection('trainerProfiles').doc(uid);
        await tpRef.set({
          uid,
          fullName: targetUser.fullName || targetUser.name || 'Trainer',
          organization: targetUser.organization || '',
          department: targetUser.department || '',
          designation: targetUser.designation || 'Instructor',
          competencies: Array.isArray(targetUser.competencies) ? targetUser.competencies : [],
          approvalStatus: 'approved',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } else {
      targetUser = STATIC_USERS.get(uid);
      if (!targetUser) {
        targetUser = { uid, fullName: 'User', role: 'trainer', approvalStatus: 'pending' };
      }
      targetUser.approvalStatus = 'approved';
      STATIC_USERS.set(uid, targetUser);
    }

    await sendUserNotification({
      uid,
      title: 'Account Registration Approved',
      message: 'Your account registration has been approved by a platform administrator. You can now access all portal features.',
      type: 'approval'
    });

    await logAuditEntry({
      actorUid: req.user.uid,
      actorEmail: req.user.email,
      targetUid: uid,
      action: 'approve_user',
      details: { role: targetUser.role, previousStatus: targetUser.approvalStatus || 'pending', newStatus: 'approved' },
      timestamp: now
    });

    return res.json({ success: true, uid, status: 'approved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:uid/reject
app.post('/api/admin/users/:uid/reject', verifyAdminToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body || {};
    const now = new Date().toISOString();
    let targetUser = null;

    if (db) {
      const uRef = db.collection('users').doc(uid);
      const uSnap = await uRef.get();
      if (!uSnap.exists) {
        return res.status(404).json({ success: false, error: 'User document not found' });
      }
      targetUser = { uid, ...uSnap.data() };
      await uRef.update({
        approvalStatus: 'rejected',
        rejectedAt: now,
        rejectedBy: req.user.uid,
        rejectionReason: reason || 'Registration rejected by administrator'
      });

      const isTrainerRole = ['faculty', 'teacher', 'trainer'].includes((targetUser.role || '').toLowerCase());
      if (isTrainerRole) {
        await db.collection('trainerProfiles').doc(uid).delete().catch(() => {});
      }
    } else {
      targetUser = STATIC_USERS.get(uid);
      if (!targetUser) {
        targetUser = { uid, fullName: 'User', role: 'trainer', approvalStatus: 'pending' };
      }
      targetUser.approvalStatus = 'rejected';
      STATIC_USERS.set(uid, targetUser);
    }

    await sendUserNotification({
      uid,
      title: 'Account Registration Status',
      message: reason ? `Your account registration was rejected: ${reason}` : 'Your account registration was rejected by a platform administrator.',
      type: 'rejection'
    });

    await logAuditEntry({
      actorUid: req.user.uid,
      actorEmail: req.user.email,
      targetUid: uid,
      action: 'reject_user',
      details: { role: targetUser.role, reason: reason || 'No reason provided' },
      timestamp: now
    });

    return res.json({ success: true, uid, status: 'rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:uid/role
app.post('/api/admin/users/:uid/role', verifyAdminToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role: newRole, confirmAdminGrant } = req.body;

    if (!newRole || typeof newRole !== 'string') {
      return res.status(400).json({ success: false, error: 'Target role is required' });
    }

    const normalizedRole = newRole.toLowerCase().trim();

    if (normalizedRole === 'admin' && confirmAdminGrant !== true) {
      return res.status(400).json({
        success: false,
        error: 'Explicit confirmation (confirmAdminGrant: true) is required to grant administrative access privileges.'
      });
    }

    let targetUser = null;
    const now = new Date().toISOString();

    if (db && firebaseAdminApp) {
      const uRef = db.collection('users').doc(uid);
      const uSnap = await uRef.get();
      if (!uSnap.exists) {
        return res.status(404).json({ success: false, error: 'User document not found' });
      }
      targetUser = { uid, ...uSnap.data() };
      const oldRole = targetUser.role;

      await uRef.update({
        role: normalizedRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      if (normalizedRole === 'admin') {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
      } else if (oldRole === 'admin') {
        await admin.auth().setCustomUserClaims(uid, { admin: false });
      }
    } else {
      targetUser = STATIC_USERS.get(uid);
      if (!targetUser) {
        targetUser = { uid, fullName: 'User', role: 'trainee', approvalStatus: 'approved' };
      }
      targetUser.role = normalizedRole;
      STATIC_USERS.set(uid, targetUser);
    }

    await sendUserNotification({
      uid,
      title: 'Account Role Updated',
      message: `Your account role has been updated to ${normalizedRole}.`,
      type: 'role_change'
    });

    await logAuditEntry({
      actorUid: req.user.uid,
      actorEmail: req.user.email,
      targetUid: uid,
      action: 'change_role',
      details: { previousRole: targetUser?.role || 'unknown', newRole: normalizedRole, grantedAdmin: normalizedRole === 'admin' },
      timestamp: now
    });

    return res.json({ success: true, uid, role: normalizedRole });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', verifyAdminToken, async (req, res) => {
  try {
    let logs = [];
    if (db) {
      const snap = await db.collection('auditLog').orderBy('timestamp', 'desc').limit(100).get();
      logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      logs = STATIC_AUDIT_LOGS;
    }
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/notifications
app.get('/api/notifications', verifyUserToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    let list = [];
    if (db) {
      const snap = await db.collection('notifications')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      list = STATIC_NOTIFICATIONS.get(uid) || [];
    }
    return res.json({ success: true, notifications: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Validation helper for designation requirements
function validateDesignationRequirements(requiredCompetencies) {
  if (!Array.isArray(requiredCompetencies)) return null;
  const seenIds = new Set();
  for (const reqItem of requiredCompetencies) {
    const cId = reqItem.competencyId;
    if (!cId || typeof cId !== 'string') {
      return 'Competency ID is required';
    }
    if (seenIds.has(cId)) {
      return `Duplicate competency in designation requirements: ${cId}`;
    }
    seenIds.add(cId);

    const level = Number(reqItem.targetLevel || reqItem.requiredNumericLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return `Target level must be between 1 and 5 (got ${reqItem.targetLevel || reqItem.requiredNumericLevel})`;
    }
  }
  return null;
}

// Admin Organizations API Routes
app.get('/api/admin/organizations', verifyAdminToken, async (req, res) => {
  try {
    if (db) {
      const snap = await db.collection('organizations').get();
      const organizations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: organizations.length, organizations });
    }
    return res.json({ success: true, organizations: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/organizations', verifyAdminToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Organization name is required' });
    }
    const orgDoc = { name: name.trim(), createdAt: new Date().toISOString() };
    if (db) {
      const ref = await db.collection('organizations').add(orgDoc);
      return res.json({ success: true, organization: { id: ref.id, ...orgDoc } });
    }
    return res.json({ success: true, organization: { id: `org-${Date.now()}`, ...orgDoc } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Department API Routes
app.get('/api/admin/departments', verifyAdminToken, async (req, res) => {
  try {
    if (db) {
      const snap = await db.collection('departments').get();
      const departments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: departments.length, departments });
    }
    return res.json({ success: true, departments: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/departments', verifyAdminToken, async (req, res) => {
  try {
    const { name, orgId, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Department name is required' });
    }
    const deptDoc = {
      name: name.trim(),
      orgId: orgId || 'org-default',
      description: (description || '').trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    if (db) {
      const ref = await db.collection('departments').add(deptDoc);
      return res.json({ success: true, department: { id: ref.id, ...deptDoc } });
    }
    return res.json({ success: true, department: { id: `dept-${Date.now()}`, ...deptDoc } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/departments/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('departments').doc(id).delete();
    }
    return res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Designation & Competency Requirements API Routes
app.get('/api/admin/designations', verifyAdminToken, async (req, res) => {
  try {
    if (db) {
      const snap = await db.collection('designations').get();
      const designations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: designations.length, designations });
    }
    return res.json({ success: true, designations: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/designations', verifyAdminToken, async (req, res) => {
  try {
    const { name, departmentId, departmentName, description, requiredCompetencies } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Designation name is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'Department ID is required' });
    }

    const validationErr = validateDesignationRequirements(requiredCompetencies || []);
    if (validationErr) {
      return res.status(400).json({ success: false, error: validationErr });
    }

    const desigDoc = {
      name: name.trim(),
      departmentId,
      departmentName: departmentName || 'General',
      description: (description || '').trim(),
      isActive: true,
      requiredCompetencies: requiredCompetencies || [],
      createdAt: new Date().toISOString()
    };
    if (db) {
      const ref = await db.collection('designations').add(desigDoc);
      return res.json({ success: true, designation: { id: ref.id, ...desigDoc } });
    }
    return res.json({ success: true, designation: { id: `desig-${Date.now()}`, ...desigDoc } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/designations/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { requiredCompetencies, ...rest } = req.body;

    if (requiredCompetencies) {
      const validationErr = validateDesignationRequirements(requiredCompetencies);
      if (validationErr) {
        return res.status(400).json({ success: false, error: validationErr });
      }
    }

    const updateDoc = { ...rest, ...(requiredCompetencies ? { requiredCompetencies } : {}), updatedAt: new Date().toISOString() };
    if (db) {
      await db.collection('designations').doc(id).set(updateDoc, { merge: true });
    }
    return res.json({ success: true, id, designation: updateDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/designations/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('designations').doc(id).delete();
    }
    return res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Competencies Catalog API Routes
app.post('/api/admin/competencies', verifyAdminToken, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Competency name is required' });
    }
    const compDoc = {
      name: name.trim(),
      category: category || 'Technical',
      description: (description || '').trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    if (db) {
      const ref = await db.collection('competencyCatalog').add(compDoc);
      return res.json({ success: true, competency: { id: ref.id, ...compDoc } });
    }
    return res.json({ success: true, competency: { id: `comp-${Date.now()}`, ...compDoc } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/competencies/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('competencyCatalog').doc(id).delete();
    }
    return res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// ASSESSMENT SECURE SCORING & SERVER-SIDE KEYS
// ============================================================================

// User authentication middleware
const verifyUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing Authorization header' });
    }
    const token = authHeader.split('Bearer ')[1];
    if (db && firebaseAdminApp) {
      const decoded = await admin.auth().verifyIdToken(token);
      let role = decoded.admin === true ? 'admin' : (decoded.role || 'trainee');
      if (decoded.admin !== true && db) {
        const uDoc = await db.collection('users').doc(decoded.uid).get();
        if (uDoc.exists) {
          role = uDoc.data().role || role;
        }
      }
      req.user = { uid: decoded.uid, email: decoded.email || '', role };
      return next();
    }
    // Fallback mode if Firebase Admin is not configured
    req.user = { uid: 'demo-user', email: 'demo@kuma.gov.in', role: 'trainee' };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: `Unauthorized: ${err.message}` });
  }
};

// Deterministic proficiency level mapping (exact parity with competencyUtils)
function calculateAssessedProficiency(percentage) {
  const rounded = Math.min(100, Math.max(0, Math.round(percentage)));
  if (rounded >= 90) return { level: 'Expert', numericLevel: 4 };
  if (rounded >= 70) return { level: 'Advanced', numericLevel: 3 };
  if (rounded >= 40) return { level: 'Intermediate', numericLevel: 2 };
  return { level: 'Beginner', numericLevel: 1 };
}

// In-memory fallback server keys for static quizzes
const STATIC_ASSESSMENT_KEYS = {
  'quiz-comp-1': {
    correctAnswers: { 'q1-1': 0, 'q1-2': 1, 'q1-3': 1, 'q1-4': 1, 'q1-5': 2 },
    explanations: {
      'q1-1': 'dropna() removes missing values along a specified axis in pandas.',
      'q1-2': 'Histograms represent frequency distributions of continuous quantitative data.',
      'q1-3': 'The median divides an ordered dataset into two equal halves.',
      'q1-4': 'Pearson correlation coefficients range from -1 (perfect negative) to +1 (perfect positive).',
      'q1-5': 'HAVING filters aggregate function results, whereas WHERE filters row-level data.'
    }
  },
  'quiz-comp-2': {
    correctAnswers: { 'q2-1': 1, 'q2-2': 1, 'q2-3': 1, 'q2-4': 1 },
    explanations: {
      'q2-1': 'Lists are mutable ordered sequences of elements.',
      'q2-2': 'try...except blocks capture runtime exceptions in Python.',
      'q2-3': 'Sets enforce uniqueness, so duplicate 2 is removed, resulting in 3 elements.',
      'q2-4': '// performs floor division in Python.'
    }
  },
  'quiz-comp-3': {
    correctAnswers: { 'q3-1': 1, 'q3-2': 2, 'q3-3': 1, 'q3-4': 0 },
    explanations: {
      'q3-1': 'MFA requires two or more verification factors to gain access to resources.',
      'q3-2': 'IaaS (Infrastructure as a Service) delivers fundamental compute, network, and storage resources.',
      'q3-3': 'Digital transformation leverages modern technologies to optimize workflows and public service delivery.',
      'q3-4': 'SaaS stands for Software as a Service.'
    }
  }
};

// POST /api/assessments/:id/start
app.post('/api/assessments/:id/start', verifyUserToken, async (req, res) => {
  try {
    const { id } = req.params;
    let assessment = null;

    if (db) {
      const docSnap = await db.collection('assessments').doc(id).get();
      if (docSnap.exists) {
        assessment = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!assessment) {
      const fallbackQuizzes = [
        {
          id: 'quiz-comp-1',
          title: 'Data Analysis Fundamentals',
          competencyId: 'cat-comp-2',
          competencyName: 'Data Analysis & Insights',
          courseName: 'Data Analytics & Insights Program',
          status: 'published',
          timeLimitMinutes: 15,
          maxAttempts: 3,
          passPercent: 60,
          questions: [
            { id: 'q1-1', type: 'mcq', question: 'Which method is used to remove missing values from a pandas DataFrame?', options: ['df.dropna()', 'df.remove_nulls()', 'df.clean()', 'df.delete_empty()'] },
            { id: 'q1-2', type: 'mcq', question: 'What type of plot is best suited to display the distribution of a single numerical variable?', options: ['Pie chart', 'Histogram', 'Line chart', 'Scatter plot'] },
            { id: 'q1-3', type: 'mcq', question: 'In statistics, what does the median represent?', options: ['The arithmetic average', 'The middle value in an ordered dataset', 'The most frequent value', 'The standard deviation'] },
            { id: 'q1-4', type: 'mcq', question: 'What is the correlation coefficient range for linear relationships?', options: ['0 to 1', '-1 to +1', '-10 to +10', '0 to 100'] },
            { id: 'q1-5', type: 'mcq', question: 'Which SQL clause is used to filter records after aggregation?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'] }
          ]
        },
        {
          id: 'quiz-comp-2',
          title: 'Python Scripting & Automation Assessment',
          competencyId: 'cat-comp-1',
          competencyName: 'Python Programming',
          courseName: 'Python Technical Workshop',
          status: 'published',
          timeLimitMinutes: 12,
          maxAttempts: 3,
          passPercent: 70,
          questions: [
            { id: 'q2-1', type: 'mcq', question: 'Which built-in Python data structure is mutable and ordered?', options: ['Tuple', 'List', 'Set', 'Frozenset'] },
            { id: 'q2-2', type: 'mcq', question: 'What keyword is used to handle runtime exceptions in Python?', options: ['catch', 'except', 'error', 'handle'] },
            { id: 'q2-3', type: 'mcq', question: 'What is the output of len({1, 2, 2, 3}) in Python?', options: ['4', '3', '2', 'Error'] },
            { id: 'q2-4', type: 'mcq', question: 'Which operator is used for integer division in Python 3?', options: ['/', '//', '%', '^'] }
          ]
        },
        {
          id: 'quiz-comp-3',
          title: 'Digital Tools & Cloud Workflow Literacy',
          competencyId: 'cat-comp-9',
          competencyName: 'Digital Literacy & Tech Adoption',
          courseName: 'Digital Transformation Program',
          status: 'published',
          timeLimitMinutes: 10,
          maxAttempts: 3,
          passPercent: 60,
          questions: [
            { id: 'q3-1', type: 'mcq', question: 'What is the primary benefit of Multi-Factor Authentication (MFA)?', options: ['Faster login speeds', 'Adds an additional layer of security beyond passwords', 'Replaces passwords entirely', 'Encrypts local hard drives'] },
            { id: 'q3-2', type: 'mcq', question: 'Which cloud service model provides virtualized computing infrastructure over the internet?', options: ['SaaS', 'PaaS', 'IaaS', 'FaaS'] },
            { id: 'q3-3', type: 'mcq', question: 'What is the main goal of digital transformation in public organizations?', options: ['Increasing paper usage', 'Modernizing service delivery and improving operational efficiency', 'Replacing human personnel with static spreadsheets', 'Decreasing accessibility'] },
            { id: 'q3-4', type: 'mcq', question: 'What does SaaS stand for?', options: ['Software as a Service', 'Storage as a System', 'Security as a Service', 'Server as an Architecture'] }
          ]
        }
      ];
      assessment = fallbackQuizzes.find(q => q.id === id);
    }

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    if (assessment.status && assessment.status !== 'published' && assessment.status !== 'available') {
      return res.status(400).json({ success: false, error: 'Assessment is not published' });
    }

    if (assessment.deadline && new Date(assessment.deadline).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'Assessment deadline has passed' });
    }

    const maxAttempts = Number(assessment.maxAttempts || assessment.max_attempts) || 3;
    if (db) {
      const attemptsSnap = await db.collection('attempts')
        .where('uid', '==', req.user.uid)
        .where('assessmentId', '==', id)
        .get();

      const completedAttempts = attemptsSnap.docs.filter(d => d.data().status === 'completed');
      if (completedAttempts.length >= maxAttempts) {
        return res.status(400).json({
          success: false,
          error: `Maximum attempts limit (${maxAttempts}) reached for this assessment.`,
          attemptsCount: completedAttempts.length,
          maxAttempts
        });
      }
    }

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startedAt = new Date().toISOString();
    const attemptDoc = {
      id: attemptId,
      uid: req.user.uid,
      assessmentId: id,
      competencyId: assessment.competencyId || '',
      courseId: assessment.courseId || '',
      status: 'in-progress',
      startedAt,
      createdAt: startedAt
    };

    if (db) {
      await db.collection('attempts').doc(attemptId).set(attemptDoc);
    }

    const sanitizedQuestions = (assessment.questions || []).map(q => ({
      id: q.id,
      type: q.type || 'mcq',
      question: q.question || q.text || '',
      options: q.options || []
    }));

    return res.json({
      success: true,
      attemptId,
      startedAt,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        competencyId: assessment.competencyId,
        competencyName: assessment.competencyName,
        courseName: assessment.courseName,
        timeLimitMinutes: Number(assessment.timeLimitMinutes || (assessment.estimatedTime ? assessment.estimatedTime.replace(/\D/g, '') : 15)) || 15,
        maxAttempts,
        passPercent: Number(assessment.passPercent || assessment.passingScore) || 60,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/submit
app.post('/api/assessments/:id/submit', verifyUserToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attemptId, answers } = req.body;

    if (!attemptId) {
      return res.status(400).json({ success: false, error: 'Missing attemptId' });
    }
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Missing user answers' });
    }

    let attemptData = null;
    if (db) {
      const attemptSnap = await db.collection('attempts').doc(attemptId).get();
      if (attemptSnap.exists) {
        attemptData = attemptSnap.data();
      }
    }

    if (!attemptData) {
      attemptData = {
        id: attemptId,
        uid: req.user.uid,
        assessmentId: id,
        status: 'in-progress',
        startedAt: new Date(Date.now() - 60000).toISOString()
      };
    }

    if (attemptData.uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden: Attempt belongs to another user' });
    }

    if (attemptData.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Attempt has already been submitted' });
    }

    let assessment = null;
    let keyData = null;

    if (db) {
      const aSnap = await db.collection('assessments').doc(id).get();
      if (aSnap.exists) assessment = { id: aSnap.id, ...aSnap.data() };

      const kSnap = await db.collection('assessmentKeys').doc(id).get();
      if (kSnap.exists) keyData = kSnap.data();
    }

    if (!keyData && STATIC_ASSESSMENT_KEYS[id]) {
      keyData = STATIC_ASSESSMENT_KEYS[id];
    }

    if (!assessment) {
      if (id === 'quiz-comp-1') {
        assessment = { id: 'quiz-comp-1', competencyId: 'cat-comp-2', passingScore: 60, timeLimitMinutes: 15 };
      } else if (id === 'quiz-comp-2') {
        assessment = { id: 'quiz-comp-2', competencyId: 'cat-comp-1', passingScore: 70, timeLimitMinutes: 12 };
      } else if (id === 'quiz-comp-3') {
        assessment = { id: 'quiz-comp-3', competencyId: 'cat-comp-9', passingScore: 60, timeLimitMinutes: 10 };
      }
    }

    if (!keyData) {
      return res.status(500).json({ success: false, error: 'Answer key for assessment is not available on server' });
    }

    const startedTime = new Date(attemptData.startedAt).getTime();
    const timeLimitMin = Number(assessment?.timeLimitMinutes || (assessment?.estimatedTime ? assessment.estimatedTime.replace(/\D/g, '') : 15)) || 15;
    const maxAllowedMs = (timeLimitMin * 60 + 120) * 1000;
    const elapsedMs = Date.now() - startedTime;

    if (elapsedMs > maxAllowedMs) {
      return res.status(400).json({ success: false, error: 'Time limit exceeded for this attempt' });
    }

    const correctAnswers = keyData.correctAnswers || {};
    const explanations = keyData.explanations || {};

    const questionIds = Object.keys(correctAnswers);
    const totalQuestions = questionIds.length || 1;
    let correctCount = 0;
    const perQuestion = {};

    for (const qId of questionIds) {
      const userChoice = answers[qId];
      const targetChoice = correctAnswers[qId];
      const isCorrect = userChoice !== undefined && String(userChoice) === String(targetChoice);
      if (isCorrect) correctCount++;

      perQuestion[qId] = {
        isCorrect,
        correctAnswer: targetChoice,
        explanation: explanations[qId] || ''
      };
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passPercent = Number(assessment?.passPercent || assessment?.passingScore) || 60;
    const passed = percentage >= passPercent;
    const { level, numericLevel } = calculateAssessedProficiency(percentage);

    const completedAt = new Date().toISOString();

    const updatedAttemptDoc = {
      ...attemptData,
      score: correctCount,
      totalQuestions,
      scorePercentage: percentage,
      passed,
      assessedLevel: level,
      assessedNumericLevel: numericLevel,
      status: 'completed',
      completedAt,
      answers
    };

    if (db) {
      await db.collection('attempts').doc(attemptId).set(updatedAttemptDoc, { merge: true });

      const competencyId = assessment?.competencyId || attemptData.competencyId;
      if (competencyId) {
        const compRecordId = `${req.user.uid}_${competencyId}`;
        const compRef = db.collection('competencyRecords').doc(compRecordId);
        const existingCompSnap = await compRef.get();
        const existingData = existingCompSnap.exists ? existingCompSnap.data() : {};

        const existingHistory = existingData.history || [];
        const declaredLevel = existingData.declaredLevel || 0;
        const currentLevel = Math.max(declaredLevel, numericLevel);

        const newHistoryItem = {
          level: numericLevel,
          source: 'assessed',
          at: completedAt,
          attemptId
        };

        await compRef.set({
          uid: req.user.uid,
          competencyId,
          declaredLevel,
          assessedLevel: numericLevel,
          currentLevel,
          history: [newHistoryItem, ...existingHistory],
          updatedAt: completedAt
        }, { merge: true });
      }
    }

    return res.json({
      success: true,
      attemptId,
      score: correctCount,
      totalQuestions,
      scorePercentage: percentage,
      passed,
      level,
      numericLevel,
      perQuestion,
      completedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments (Trainer / Admin Create/Update/Publish)
app.post('/api/assessments', verifyUserToken, async (req, res) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();
    const isTrainerOrAdmin = req.user.role === 'admin' || ['trainer', 'faculty', 'teacher'].includes(userRole);
    if (!isTrainerOrAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Only approved trainers or admins can create/update assessments' });
    }

    const {
      id: inputId,
      title,
      competencyId,
      competencyName,
      courseId,
      courseName,
      description,
      questions,
      timeLimitMinutes,
      maxAttempts,
      passPercent,
      status,
      deadline
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Assessment title is required' });
    }
    if (!competencyId) {
      return res.status(400).json({ success: false, error: 'Target competencyId is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one question is required' });
    }

    const assessmentId = inputId || `assessment-${Date.now()}`;

    if (inputId && db && req.user.role !== 'admin') {
      const existingSnap = await db.collection('assessments').doc(inputId).get();
      if (existingSnap.exists) {
        const existingData = existingSnap.data();
        if (existingData.createdBy && existingData.createdBy !== req.user.uid && existingData.trainerId !== req.user.uid) {
          return res.status(403).json({ success: false, error: 'Forbidden: Trainers may only edit their own assessments' });
        }
      }
    }

    const publicQuestions = [];
    const correctAnswers = {};
    const explanations = {};

    questions.forEach((q, idx) => {
      const qId = q.id || `q-${assessmentId}-${idx + 1}`;
      publicQuestions.push({
        id: qId,
        type: q.type || 'mcq',
        question: q.question || q.text || '',
        options: q.options || []
      });

      const ansKey = q.correctAnswer !== undefined ? q.correctAnswer : q.correctAnswerIndex;
      correctAnswers[qId] = ansKey !== undefined ? ansKey : 0;
      explanations[qId] = q.explanation || '';
    });

    const now = new Date().toISOString();

    const publicAssessmentDoc = {
      id: assessmentId,
      title: title.trim(),
      competencyId,
      competencyName: competencyName || '',
      courseId: courseId || '',
      courseName: courseName || '',
      description: (description || '').trim(),
      questionsCount: publicQuestions.length,
      questions: publicQuestions,
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      maxAttempts: Number(maxAttempts) || 3,
      passPercent: Number(passPercent) || 60,
      status: status || 'published',
      createdBy: req.user.uid,
      trainerId: req.user.uid,
      deadline: deadline || null,
      updatedAt: now,
      createdAt: now
    };

    const keyDoc = {
      id: assessmentId,
      assessmentId,
      correctAnswers,
      explanations,
      updatedAt: now
    };

    if (db) {
      await db.collection('assessments').doc(assessmentId).set(publicAssessmentDoc, { merge: true });
      await db.collection('assessmentKeys').doc(assessmentId).set(keyDoc, { merge: true });
    }

    STATIC_ASSESSMENT_KEYS[assessmentId] = { correctAnswers, explanations };

    return res.json({
      success: true,
      assessmentId,
      assessment: publicAssessmentDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// SERVER-ISSUED VERIFIABLE CERTIFICATE ENDPOINTS (HMAC-SHA256)
// ============================================================================

const CERT_SIGNING_SECRET = process.env.CERT_SIGNING_SECRET || 'kuma-secret-signing-key-dev-mode';
const STATIC_CERTIFICATES = new Map();

export function computeCertificateSignature(certData) {
  const canonicalString = [
    certData.certId || certData.id || '',
    certData.uid || '',
    certData.courseId || '',
    certData.traineeName || '',
    certData.orgId || certData.organization || '',
    certData.issuedAt || certData.issueDate || ''
  ].join('|');
  return crypto.createHmac('sha256', CERT_SIGNING_SECRET).update(canonicalString).digest('hex');
}

// Seed default demo certificate in standalone mode
(() => {
  const demoCert = {
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
    status: 'valid'
  };
  demoCert.signature = computeCertificateSignature(demoCert);
  STATIC_CERTIFICATES.set(demoCert.certId, demoCert);
})();

// POST /api/certificates/issue (Auth required)
app.post('/api/certificates/issue', verifyUserToken, async (req, res) => {
  try {
    const { enrollmentId, attemptId, courseId, courseTitle, traineeName, orgId, competencyGains } = req.body;
    const uid = req.user.uid;

    if (!enrollmentId && !courseId) {
      return res.status(400).json({ success: false, error: 'Missing enrollmentId or courseId' });
    }

    const actualEnrollmentId = enrollmentId || `enr_${uid}_${courseId}`;

    let enrollmentData = null;
    let attemptData = null;

    if (db) {
      // (a) Verify enrollment
      const enrDoc = await db.collection('enrollments').doc(actualEnrollmentId).get();
      if (!enrDoc.exists) {
        const altEnr = await db.collection('trainingEnrollments').doc(actualEnrollmentId).get();
        if (altEnr.exists) enrollmentData = altEnr.data();
      } else {
        enrollmentData = enrDoc.data();
      }

      if (!enrollmentData && courseId) {
        const snap = await db.collection('enrollments')
          .where('uid', '==', uid)
          .where('courseId', '==', courseId)
          .get();
        if (!snap.empty) enrollmentData = snap.docs[0].data();
      }

      const isCompleted = enrollmentData && (
        enrollmentData.status === 'completed' ||
        enrollmentData.percent === 100 ||
        enrollmentData.completionRate === 100
      );

      if (!isCompleted) {
        return res.status(403).json({
          success: false,
          error: 'Enrollment completion requirements not met. All required modules must be completed.'
        });
      }

      // (b) Verify passing attempt exists
      if (attemptId) {
        const attDoc = await db.collection('attempts').doc(attemptId).get();
        if (attDoc.exists) {
          attemptData = attDoc.data();
        } else {
          const altAtt = await db.collection('assessmentAttempts').doc(attemptId).get();
          if (altAtt.exists) attemptData = altAtt.data();
        }
      }

      if (!attemptData && (enrollmentData?.assessmentAttemptId || courseId)) {
        const targetAttId = enrollmentData?.assessmentAttemptId;
        if (targetAttId) {
          const attDoc = await db.collection('attempts').doc(targetAttId).get();
          if (attDoc.exists) attemptData = attDoc.data();
        }
      }

      const isAttemptPassed = attemptData && (
        attemptData.passed === true ||
        (attemptData.scorePercentage !== undefined && attemptData.scorePercentage >= 60) ||
        (attemptData.score !== undefined && attemptData.score >= 60)
      );

      if (!isAttemptPassed && !enrollmentData?.quizPassed) {
        return res.status(403).json({
          success: false,
          error: 'Passing assessment attempt required before certificate issuance.'
        });
      }

      // (c) Check existing certificate (idempotency)
      const existingCertSnap = await db.collection('certificates')
        .where('completionEnrollmentId', '==', actualEnrollmentId)
        .get();

      if (!existingCertSnap.empty) {
        const existingCert = existingCertSnap.docs[0].data();
        return res.json({ success: true, certificate: existingCert, message: 'Existing certificate retrieved' });
      }
    } else {
      // Standalone mode fallback check
      for (const [id, cert] of STATIC_CERTIFICATES.entries()) {
        if (cert.uid === uid && (cert.completionEnrollmentId === actualEnrollmentId || cert.courseId === courseId)) {
          return res.json({ success: true, certificate: cert, message: 'Existing certificate retrieved' });
        }
      }
    }

    const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
    const certId = `KUMA-CERT-${Date.now()}-${randomHex}`;
    const issuedAt = new Date().toISOString();

    const finalTraineeName = traineeName || (req.user.email ? req.user.email.split('@')[0] : 'Trainee Learner');
    const finalCourseTitle = courseTitle || enrollmentData?.courseName || enrollmentData?.courseTitle || 'Capacity Building Program';
    const finalOrgId = orgId || enrollmentData?.organizationId || 'Kuma Portal';
    const finalCourseId = courseId || enrollmentData?.courseId || 'c-gen';
    const finalAttemptId = attemptId || attemptData?.id || enrollmentData?.assessmentAttemptId || `att-${Date.now()}`;
    const finalGains = competencyGains || (attemptData?.competencyId ? [{ competencyId: attemptData.competencyId, fromLevel: 1, toLevel: 2 }] : []);

    const certPayload = {
      certId,
      uid,
      courseId: finalCourseId,
      courseTitle: finalCourseTitle,
      traineeName: finalTraineeName,
      orgId: finalOrgId,
      issuedAt,
      completionEnrollmentId: actualEnrollmentId,
      attemptId: finalAttemptId,
      competencyGains: finalGains,
      status: 'valid'
    };

    certPayload.signature = computeCertificateSignature(certPayload);

    if (db) {
      await db.collection('certificates').doc(certId).set(certPayload);
    }
    STATIC_CERTIFICATES.set(certId, certPayload);

    return res.json({ success: true, certificate: certPayload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simple rate-limiting for public verify endpoint
const verifyRateLimitMap = new Map();
function rateLimitVerifyRequest(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  let record = verifyRateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
  } else {
    record.count++;
  }
  verifyRateLimitMap.set(ip, record);
  if (record.count > 50) {
    return res.status(429).json({ status: 'error', error: 'Too many verification requests' });
  }
  next();
}

// GET /api/certificates/verify/:certId (Public, rate limited, no PII returned)
app.get('/api/certificates/verify/:certId', rateLimitVerifyRequest, async (req, res) => {
  try {
    const { certId } = req.params;
    if (!certId || !certId.trim()) {
      return res.status(400).json({ status: 'not_found', message: 'Invalid certificate ID' });
    }

    let certDoc = null;
    if (db) {
      const snap = await db.collection('certificates').doc(certId.trim()).get();
      if (snap.exists) {
        certDoc = snap.data();
      }
    }

    if (!certDoc) {
      certDoc = STATIC_CERTIFICATES.get(certId.trim()) || null;
    }

    if (!certDoc) {
      return res.json({ status: 'not_found', message: 'Certificate not found' });
    }

    const expectedSig = computeCertificateSignature(certDoc);
    const isSignatureValid = certDoc.signature === expectedSig;

    if (!isSignatureValid) {
      return res.json({
        status: 'invalid',
        message: 'Digital signature verification failed. Certificate content may have been modified or tampered with.'
      });
    }

    if (certDoc.status === 'revoked') {
      return res.json({
        status: 'revoked',
        certId: certDoc.certId || certDoc.id,
        traineeName: certDoc.traineeName,
        courseTitle: certDoc.courseTitle,
        issuedAt: certDoc.issuedAt,
        orgName: certDoc.orgId || certDoc.orgName || 'Kuma Platform',
        revokedAt: certDoc.revokedAt,
        competencyGains: certDoc.competencyGains || []
      });
    }

    return res.json({
      status: 'valid',
      certId: certDoc.certId || certDoc.id,
      traineeName: certDoc.traineeName,
      courseTitle: certDoc.courseTitle,
      issuedAt: certDoc.issuedAt,
      orgName: certDoc.orgId || certDoc.orgName || 'Kuma Platform',
      competencyGains: certDoc.competencyGains || []
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// POST /api/admin/certificates/:certId/revoke (Admin auth required)
app.post('/api/admin/certificates/:certId/revoke', verifyAdminToken, async (req, res) => {
  try {
    const { certId } = req.params;
    const revokedAt = new Date().toISOString();

    let found = false;
    if (db) {
      const snap = await db.collection('certificates').doc(certId).get();
      if (snap.exists) {
        await db.collection('certificates').doc(certId).update({
          status: 'revoked',
          revokedAt
        });
        found = true;
      }
    }

    if (STATIC_CERTIFICATES.has(certId)) {
      const existing = STATIC_CERTIFICATES.get(certId);
      existing.status = 'revoked';
      existing.revokedAt = revokedAt;
      STATIC_CERTIFICATES.set(certId, existing);
      found = true;
    }

    if (!found) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    return res.json({
      success: true,
      certId,
      status: 'revoked',
      revokedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Serve frontend static build if dist directory exists
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ message: 'Kuma Backend API Service is Running. Frontend dist bundle not served.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Kuma Capacity Connect Server listening on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
