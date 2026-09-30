/**
 * Project Kuma - Admin User Approvals & Role Management View
 * Features real API fetching, status/role filtering, approval/rejection actions, role modification with confirmation, and audit log telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  approveUser,
  rejectUser,
  changeUserRole,
  getAdminAuditLogs,
  AdminUserRecord,
  AuditLogRecord
} from '../services/adminUserService';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  UserCog,
  FileText,
  Search
} from 'lucide-react';

export default function UserApprovalsManager() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState<AdminUserRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Role change confirmation modal state
  const [roleModalUser, setRoleModalUser] = useState<AdminUserRecord | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, logRes] = await Promise.all([
        getAdminUsers(statusFilter, roleFilter),
        getAdminAuditLogs()
      ]);

      if (userRes.success) {
        setUsers(userRes.users);
      } else {
        setError(userRes.error || 'Failed to load user accounts.');
      }

      if (logRes.success) {
        setAuditLogs(logRes.logs);
      }
    } catch (err: any) {
      console.error('[UserApprovalsManager] loadData error:', err);
      setError(err.message || 'An unexpected error occurred loading administrative user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter, roleFilter]);

  const handleApprove = async (uid: string) => {
    setLoading(true);
    const res = await approveUser(uid);
    if (res.success) {
      void loadData();
    } else {
      setError(res.error || 'Approval action failed');
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setLoading(true);
    const res = await rejectUser(rejectingUser.uid, rejectionReason);
    setRejectingUser(null);
    setRejectionReason('');
    if (res.success) {
      void loadData();
    } else {
      setError(res.error || 'Rejection action failed');
      setLoading(false);
    }
  };

  const handleRoleChangeSelect = (userRecord: AdminUserRecord, newRole: string) => {
    if (newRole === 'admin') {
      setRoleModalUser(userRecord);
      setTargetRole('admin');
    } else {
      void executeRoleChange(userRecord.uid, newRole, false);
    }
  };

  const executeRoleChange = async (uid: string, newRole: string, confirmAdminGrant: boolean) => {
    setLoading(true);
    const res = await changeUserRole(uid, newRole, confirmAdminGrant);
    setRoleModalUser(null);
    setTargetRole('');
    if (res.success) {
      void loadData();
    } else {
      setError(res.error || 'Role change failed');
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q) ||
      (u.organization || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm">
        <div>
          <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <UserCog className="h-7 w-7 text-amber-500" />
            <span>USER APPROVALS & ROLE MANAGEMENT</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Review registration requests, approve/reject trainers, grant custom claim administrative roles, and inspect governance audit trails.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-amber-400 text-slate-950 font-bold text-xs border border-amber-300 shadow-paper-yellow hover:brightness-110 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing…' : 'REFRESH LIST'}</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-lg bg-rose-500/15 border border-rose-500 text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-paper)] p-1 rounded-lg border border-[var(--border-main)]">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-bold uppercase text-[11px] transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Role Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, email, UID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-paper)] text-xs font-medium text-[var(--text-primary)] outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-paper)] text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="trainee">Trainees</option>
            <option value="trainer">Trainers / Faculty</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

      </div>

      {/* USERS TABLE */}
      <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
        
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Loading user accounts and approval records…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No user accounts found matching the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                  <th className="py-2.5 px-3">User Profile</th>
                  <th className="py-2.5 px-3">Role & Permissions</th>
                  <th className="py-2.5 px-3">Approval Status</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-[var(--border-main)]">
                {filteredUsers.map((u) => {
                  const status = u.approvalStatus || 'approved';
                  return (
                    <tr key={u.uid} className="hover:bg-[var(--panel-bg)]">
                      
                      {/* Profile Name & Email */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-[var(--text-primary)]">{u.fullName || 'User Profile'}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">{u.email || u.uid}</div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={(u.role || 'trainee').toLowerCase()}
                          onChange={(e) => handleRoleChangeSelect(u, e.target.value)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-paper)] border border-[var(--border-main)] font-bold text-[11px] text-[var(--text-primary)] cursor-pointer"
                        >
                          <option value="trainee">Trainee</option>
                          <option value="trainer">Trainer</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3 px-3">
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 size={12} />
                            <span>Approved</span>
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            <Clock size={12} />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            <XCircle size={12} />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {u.organization || 'Kuma Platform'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(u.uid)}
                              disabled={loading}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] border border-emerald-400 cursor-pointer flex items-center gap-1"
                            >
                              <UserCheck size={12} />
                              <span>Approve</span>
                            </button>
                          )}

                          {status !== 'rejected' && (
                            <button
                              onClick={() => setRejectingUser(u)}
                              disabled={loading}
                              className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] border border-rose-500/40 cursor-pointer flex items-center gap-1"
                            >
                              <UserX size={12} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* AUDIT LOG TELEMETRY */}
      <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
          <h2 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>ADMINISTRATIVE GOVERNANCE AUDIT TRAIL</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Immutable Log</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-4 text-center text-slate-500">No administrative audit log records found yet.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 font-mono text-[11px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-[var(--bg-paper)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-400 uppercase mr-2">[{log.action}]</span>
                  <span className="text-[var(--text-primary)] font-bold">{log.actorEmail || log.actorUid}</span>
                  <span className="text-slate-400 mx-1">acted on target</span>
                  <span className="text-cyan-400 font-bold">{log.targetUid}</span>
                </div>
                <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md font-mono select-none">
          <div className="w-full max-w-md rounded-xl border-2 border-rose-500 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserX className="text-rose-500" />
              <span>Reject Registration Request</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are rejecting the trainer/user registration for <strong className="text-white">{rejectingUser.fullName}</strong> ({rejectingUser.email}).
            </p>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Reason for Rejection (Optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason or guidance for the user..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 h-24"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ROLE CONFIRMATION MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md font-mono select-none">
          <div className="w-full max-w-md rounded-xl border-2 border-amber-500 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <ShieldCheck className="text-amber-400" />
              <span>Confirm Admin Role Grant</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Granting <strong className="text-white">{roleModalUser.fullName}</strong> ({roleModalUser.email}) the <span className="text-amber-400 font-bold">Administrator</span> role will assign them Firebase Auth Custom Claims (<span className="font-mono text-cyan-300">admin: true</span>), granting full administrative governance authority across the platform.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
              ⚠️ This operation will be logged to the immutable audit trail.
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRoleChange(roleModalUser.uid, 'admin', true)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer"
              >
                Confirm & Grant Admin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
