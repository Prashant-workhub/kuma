import { auth } from '../firebaseConfig';

export interface AdminUserRecord {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  organization?: string;
  department?: string;
  createdAt?: string;
}

export interface AuditLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  targetUid: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface UserNotificationRecord {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'role_change' | 'info';
  read: boolean;
  createdAt: string;
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
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
 * Fetches user accounts for admin inspection with optional status and role filters.
 */
export async function getAdminUsers(
  statusFilter?: string,
  roleFilter?: string
): Promise<{ success: boolean; users: AdminUserRecord[]; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const queryParams = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
    if (roleFilter && roleFilter !== 'all') queryParams.append('role', roleFilter);

    const url = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const resp = await fetch(url, { headers });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      return { success: false, users: [], error: data.error || 'Failed to fetch users' };
    }

    return { success: true, users: data.users || [] };
  } catch (err: any) {
    console.error('[adminUserService] getAdminUsers error:', err);
    return { success: false, users: [], error: err.message || 'Network error' };
  }
}

/**
 * Approves a user's registration.
 */
export async function approveUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/approve`, {
      method: 'POST',
      headers
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Approval failed' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[adminUserService] approveUser error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Rejects a user's registration.
 */
export async function rejectUser(uid: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Rejection failed' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[adminUserService] rejectUser error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Updates a user's role. If granting 'admin', confirmAdminGrant: true is required.
 */
export async function changeUserRole(
  uid: string,
  newRole: string,
  confirmAdminGrant?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`/api/admin/users/${encodeURIComponent(uid)}/role`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: newRole, confirmAdminGrant })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Role update failed' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[adminUserService] changeUserRole error:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Fetches audit log records for administrative auditing.
 */
export async function getAdminAuditLogs(): Promise<{ success: boolean; logs: AuditLogRecord[]; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch('/api/admin/audit-logs', { headers });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, logs: [], error: data.error || 'Failed to fetch audit logs' };
    }
    return { success: true, logs: data.logs || [] };
  } catch (err: any) {
    console.error('[adminUserService] getAdminAuditLogs error:', err);
    return { success: false, logs: [], error: err.message || 'Network error' };
  }
}

/**
 * Fetches notifications for the authenticated user.
 */
export async function getUserNotifications(): Promise<{ success: boolean; notifications: UserNotificationRecord[]; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch('/api/notifications', { headers });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      return { success: false, notifications: [], error: data.error || 'Failed to fetch notifications' };
    }
    return { success: true, notifications: data.notifications || [] };
  } catch (err: any) {
    console.error('[adminUserService] getUserNotifications error:', err);
    return { success: false, notifications: [], error: err.message || 'Network error' };
  }
}
