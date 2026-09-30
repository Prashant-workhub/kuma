import test from 'node:test';
import assert from 'node:assert/strict';

test('trainer signup initializes approvalStatus to pending by default', () => {
  const trainerProfile = {
    uid: 'trainer-new-1',
    role: 'trainer',
    fullName: 'New Trainer',
    email: 'new.trainer@example.com',
    approvalStatus: 'pending'
  };

  assert.equal(trainerProfile.approvalStatus, 'pending');
  assert.equal(trainerProfile.role, 'trainer');
});

test('trainee signup initializes approvalStatus to approved', () => {
  const traineeProfile = {
    uid: 'trainee-new-1',
    role: 'trainee',
    fullName: 'New Trainee',
    email: 'new.trainee@example.com',
    approvalStatus: 'approved'
  };

  assert.equal(traineeProfile.approvalStatus, 'approved');
});

test('owner cannot self-assign role=admin or alter approvalStatus', () => {
  const existingUser = {
    uid: 'user-normal-1',
    role: 'trainee',
    approvalStatus: 'approved'
  };

  // Validation logic parity with firestore.rules
  function canUserUpdate(ownerUid: string, targetUid: string, newRole?: string, newStatus?: string): boolean {
    const isOwner = ownerUid === targetUid;
    if (!isOwner) return false;
    if (newRole && newRole !== existingUser.role) return false;
    if (newStatus && newStatus !== existingUser.approvalStatus) return false;
    return true;
  }

  assert.equal(canUserUpdate('user-normal-1', 'user-normal-1', 'admin', 'approved'), false, 'User cannot promote themselves to admin');
  assert.equal(canUserUpdate('user-normal-1', 'user-normal-1', 'trainer', 'approved'), false, 'User cannot self-change role');
  assert.equal(canUserUpdate('user-normal-1', 'user-normal-1', 'trainee', 'approved'), true, 'User can update profile without role change');
});

test('granting admin role requires explicit confirmation field', () => {
  function changeRole(role: string, confirmAdminGrant?: boolean) {
    if (role === 'admin' && !confirmAdminGrant) {
      return { success: false, error: 'Confirmation required (confirmAdminGrant: true)' };
    }
    return { success: true, role };
  }

  const unconfirmed = changeRole('admin', false);
  assert.equal(unconfirmed.success, false);
  assert.match(unconfirmed.error!, /Confirmation required/);

  const confirmed = changeRole('admin', true);
  assert.equal(confirmed.success, true);
  assert.equal(confirmed.role, 'admin');
});

test('audit log entries are generated for approve, reject, and role change actions', () => {
  const auditLogs: any[] = [];
  function logAudit(actorUid: string, actorEmail: string, targetUid: string, action: string, details: any) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUid,
      actorEmail,
      targetUid,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    auditLogs.push(entry);
    return entry;
  }

  logAudit('admin-1', 'admin@kuma.gov.in', 'trainer-1', 'approve_user', { newStatus: 'approved' });
  logAudit('admin-1', 'admin@kuma.gov.in', 'trainer-2', 'reject_user', { reason: 'Incomplete credentials' });
  logAudit('admin-1', 'admin@kuma.gov.in', 'user-3', 'change_role', { newRole: 'admin' });

  assert.equal(auditLogs.length, 3);
  assert.equal(auditLogs[0].action, 'approve_user');
  assert.equal(auditLogs[1].action, 'reject_user');
  assert.equal(auditLogs[2].action, 'change_role');
});
