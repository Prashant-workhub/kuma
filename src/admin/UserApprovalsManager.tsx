/**
 * Project Kuma - Admin User Approvals & Role Management View
 * Features real API fetching, status/role filtering, bulk operations, CSV import wizard,
 * detail Drawer, and ConfirmDialogs for consequential actions.
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
import { parseAndValidateCsv, CsvParseResult, MAX_BULK_IMPORT_ROWS } from '../utils/csvImportUtils';
import { bulkImportUsers, BulkUserImportResponse } from '../services/adminUserService';
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Toolbar,
  StatusPill,
  Badge,
  InlineAlert,
  ConfirmDialog,
  Drawer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FormField,
  Input,
  Select,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  UserCog,
  FileText,
  Upload,
  Download,
  MoreVertical,
  Check,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';

export default function UserApprovalsManager({ role }: { role?: 'trainee' | 'faculty' } = {}) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>(role || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk selection state
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  // User detail drawer state
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserRecord | null>(null);

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState<AdminUserRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Role change confirmation modal state
  const [roleModalUser, setRoleModalUser] = useState<AdminUserRecord | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');

  // Bulk CSV Import Wizard State
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<BulkUserImportResponse | null>(null);
  const pageTitle = role === 'faculty' ? 'Trainer Directory' : role === 'trainee' ? 'Trainee Directory & Approvals' : 'Users & Approvals';

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
      setError(err.message || 'An unexpected error occurred loading user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRoleFilter(role || 'all');
  }, [role]);

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

  // Bulk selection helpers
  const toggleSelectAll = () => {
    if (selectedUids.size === filteredUsers.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(filteredUsers.map((u) => u.uid)));
    }
  };

  const toggleSelectRow = (uid: string) => {
    const next = new Set(selectedUids);
    if (next.has(uid)) {
      next.delete(uid);
    } else {
      next.add(uid);
    }
    setSelectedUids(next);
  };

  const handleBulkApprove = async () => {
    setLoading(true);
    for (const uid of Array.from(selectedUids)) {
      await approveUser(uid);
    }
    setSelectedUids(new Set());
    void loadData();
  };

  // CSV File Upload Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setCsvContent(text);
      const parsed = parseAndValidateCsv(text);
      setParseResult(parsed);
      setWizardStep(2);
    };
    reader.readAsText(file);
  };

  // Confirm CSV Bulk Import
  const handleConfirmBulkImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await bulkImportUsers(parseResult.validRows);
      setImportSummary(res);
      setWizardStep(4);
      void loadData();
    } catch (err: any) {
      setError(`CSV Import Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = `Full Name,Email,Department,Designation,Employee ID
Ananya Sharma,ananya.s@capacity.gov.in,Engineering,Senior Architect,EMP-1001
Vikram Patel,vikram.p@capacity.gov.in,Operations,Project Manager,EMP-1002
Priya Reddy,priya.r@capacity.gov.in,Cybersecurity,Security Specialist,EMP-1003`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kuma_Bulk_User_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadErrorReport = () => {
    if (!importSummary?.results) return;
    const errors = importSummary.results.filter((r) => r.status === 'error');
    if (errors.length === 0) return;
    let csv = 'Email,Reason\n';
    errors.forEach((f) => {
      csv += `"${f.email}","${(f.error || f.message || 'Import failed').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Import_Failures_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            <span>{pageTitle}</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Review user registrations, manage role assignments, and perform bulk roster imports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setWizardStep(1);
              setParseResult(null);
              setImportSummary(null);
              setShowImportWizard(true);
            }}
          >
            <Upload className="h-4 w-4 mr-1.5" /> Bulk CSV Import
          </Button>
          <Button variant="secondary" size="sm" onClick={loadData} isLoading={loading}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Roster
          </Button>
        </div>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}

      {/* TOOLBAR & FILTERS */}
      <Toolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search users by name, email, organization..."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>

            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="all">All Roles</option>
              <option value="trainee">Trainee</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Administrator</option>
            </Select>
          </div>
        }
      />

      {/* BULK ACTION BAR */}
      {selectedUids.size > 0 && (
        <Card className="p-3 bg-surface-muted border-primary/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-text-primary">
            {selectedUids.size} user{selectedUids.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleBulkApprove} isLoading={loading}>
              <UserCheck className="h-4 w-4 mr-1.5" /> Approve Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedUids(new Set())}>
              Deselect All
            </Button>
          </div>
        </Card>
      )}

      {/* USERS TABLE */}
      <Card>
        {loading && users.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">Loading user roster...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">No users found matching filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedUids.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all users"
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead>User Profile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const status = u.approvalStatus || 'approved';
                const isSelected = selectedUids.has(u.uid);
                return (
                  <TableRow
                    key={u.uid}
                    className="cursor-pointer hover:bg-surface-muted/60"
                    onClick={() => setSelectedUserDetail(u)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(u.uid)}
                        aria-label={`Select ${u.fullName}`}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-text-primary">{u.fullName || 'User Profile'}</div>
                        <div className="text-xs text-text-secondary font-mono">{u.email || u.uid}</div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={(u.role || 'trainee').toLowerCase()}
                        onChange={(e) => handleRoleChangeSelect(u, e.target.value)}
                        className="w-32 text-xs py-1"
                      >
                        <option value="trainee">Trainee</option>
                        <option value="trainer">Trainer</option>
                        <option value="admin">Administrator</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        status={
                          status === 'approved'
                            ? 'completed'
                            : status === 'pending'
                            ? 'in_progress'
                            : 'not_started'
                        }
                      >
                        {status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : 'Rejected'}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">{u.organization || 'Kuma Platform'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" isIconOnly aria-label="User actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUserDetail(u)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {status !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleApprove(u.uid)}>
                              <UserCheck className="h-4 w-4 mr-2 text-success" /> Approve Request
                            </DropdownMenuItem>
                          )}
                          {status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => setRejectingUser(u)}>
                              <UserX className="h-4 w-4 mr-2 text-danger" /> Reject Request
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* USER DETAIL DRAWER */}
      {selectedUserDetail && (
        <Drawer
          isOpen={!!selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          title="User Account Details"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-container bg-surface-muted border border-border flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-lg">
                {(selectedUserDetail.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{selectedUserDetail.fullName}</h3>
                <p className="text-xs text-text-secondary font-mono">{selectedUserDetail.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="info">{selectedUserDetail.role || 'trainee'}</Badge>
                  <StatusPill
                    status={
                      selectedUserDetail.approvalStatus === 'approved' ? 'completed' : 'in_progress'
                    }
                  >
                    {selectedUserDetail.approvalStatus || 'Approved'}
                  </StatusPill>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">User UID</span>
                <span className="font-mono text-text-primary">{selectedUserDetail.uid}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Organization</span>
                <span className="text-text-primary">{selectedUserDetail.organization || 'Kuma Platform'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-secondary">Registration Timestamp</span>
                <span className="text-text-primary font-mono">
                  {selectedUserDetail.createdAt
                    ? new Date(selectedUserDetail.createdAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {selectedUserDetail.approvalStatus !== 'approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    handleApprove(selectedUserDetail.uid);
                    setSelectedUserDetail(null);
                  }}
                >
                  Approve User
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedUserDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* REJECTION CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!rejectingUser}
        onOpenChange={(open) => !open && setRejectingUser(null)}
        title="Reject Registration Request"
        description={
          <div className="space-y-3">
            <p>
              Are you sure you want to reject registration for{' '}
              <strong>{rejectingUser?.fullName}</strong> ({rejectingUser?.email})?
            </p>
            <FormField label="Reason for Rejection (Optional)">
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter feedback for user..."
              />
            </FormField>
          </div>
        }
        confirmText="Confirm Rejection"
        isDanger
        onConfirm={handleConfirmReject}
      />

      {/* ADMIN ROLE GRANT CONFIRM DIALOG */}
      <ConfirmDialog
        open={!!roleModalUser}
        onOpenChange={(open) => !open && setRoleModalUser(null)}
        title="Confirm Administrator Elevation"
        description={
          <p>
            Granting <strong>{roleModalUser?.fullName}</strong> ({roleModalUser?.email}) the{' '}
            <strong>Administrator</strong> role will assign full platform access claims. This operation will be recorded in the audit log.
          </p>
        }
        confirmText="Grant Admin Access"
        isDanger
        onConfirm={() => roleModalUser && executeRoleChange(roleModalUser.uid, 'admin', true)}
      />

      {/* BULK CSV IMPORT WIZARD DIALOG */}
      {showImportWizard && (
        <Dialog open={showImportWizard} onOpenChange={setShowImportWizard}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk CSV User Roster Import</DialogTitle>
              <DialogDescription>
                Step {wizardStep} of 4:{' '}
                {wizardStep === 1
                  ? 'Upload CSV File'
                  : wizardStep === 2
                  ? 'Validate Roster Preview'
                  : wizardStep === 3
                  ? 'Confirm Import'
                  : 'Import Complete'}
              </DialogDescription>
            </DialogHeader>

            {/* STEP 1: UPLOAD */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="p-8 border-2 border-dashed border-border rounded-container text-center space-y-3 bg-surface-muted">
                  <FileSpreadsheet className="h-10 w-10 text-primary mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Select a CSV roster file to upload</p>
                    <p className="text-xs text-text-secondary mt-1">
                      File must contain headers: Full Name, Email, Department, Designation, Employee ID
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <Button variant="primary" size="sm" onClick={() => document.getElementById('csv-file-input')?.click()}>
                    Choose CSV File
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button variant="ghost" size="sm" onClick={handleDownloadSampleCsv}>
                    <Download className="h-4 w-4 mr-1.5" /> Download Sample CSV Template
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & VALIDATION */}
            {wizardStep === 2 && parseResult && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Card className="p-2">
                    <div className="text-text-secondary">Total</div>
                    <div className="font-bold text-sm">{parseResult.totalRows}</div>
                  </Card>
                  <Card className="p-2">
                    <div className="text-text-secondary">Valid</div>
                    <div className="font-bold text-sm text-success">{parseResult.validCount}</div>
                  </Card>
                  <Card className="p-2">
                    <div className="text-text-secondary">Warnings</div>
                    <div className="font-bold text-sm text-warning">{parseResult.warningCount}</div>
                  </Card>
                  <Card className="p-2">
                    <div className="text-text-secondary">Errors</div>
                    <div className="font-bold text-sm text-danger">{parseResult.errorCount}</div>
                  </Card>
                </div>

                <div className="max-h-60 overflow-y-auto border border-border rounded-container">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.rows.slice(0, 10).map((r) => (
                        <TableRow key={r.rowNumber}>
                          <TableCell className="font-mono text-xs">{r.rowNumber}</TableCell>
                          <TableCell className="text-xs">{r.name}</TableCell>
                          <TableCell className="text-xs font-mono">{r.email}</TableCell>
                          <TableCell>
                            {r.isValid ? (
                              <Badge variant="success">Valid</Badge>
                            ) : (
                              <Badge variant="danger">{r.errors.join(', ')}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <DialogFooter>
                  <Button variant="secondary" size="sm" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={parseResult.validCount === 0}
                    onClick={() => setWizardStep(3)}
                  >
                    Proceed to Import ({parseResult.validCount} rows)
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* STEP 3: CONFIRM */}
            {wizardStep === 3 && parseResult && (
              <div className="space-y-4 py-4">
                <InlineAlert variant="info">
                  You are about to import <strong>{parseResult.validRows.length}</strong> valid user accounts into Kuma.
                </InlineAlert>
                <DialogFooter>
                  <Button variant="secondary" size="sm" onClick={() => setWizardStep(2)}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" isLoading={isImporting} onClick={handleConfirmBulkImport}>
                    Confirm & Provision Accounts
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* STEP 4: SUMMARY */}
            {wizardStep === 4 && importSummary && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-container bg-surface-muted border border-border text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                  <h4 className="font-semibold text-text-primary">Roster Import Completed</h4>
                  <p className="text-xs text-text-secondary">
                    Provisioned {importSummary.createdCount} accounts successfully.
                  </p>
                </div>

                {importSummary.errorCount > 0 && (
                  <div className="flex items-center justify-between p-3 border border-danger/30 bg-danger/10 rounded-container text-xs">
                    <span className="text-danger font-medium">
                      {importSummary.errorCount} rows failed to import.
                    </span>
                    <Button variant="secondary" size="sm" onClick={handleDownloadErrorReport}>
                      <Download className="h-4 w-4 mr-1.5" /> Download Error Report CSV
                    </Button>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="primary" size="sm" onClick={() => setShowImportWizard(false)}>
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* AUDIT LOG TELEMETRY */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Administrative Audit Trail</span>
        </h2>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-text-secondary">No administrative audit records found.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between gap-2"
              >
                <div>
                  <Badge variant="neutral" className="mr-2">
                    {log.action}
                  </Badge>
                  <span className="font-semibold text-text-primary">{log.actorEmail || log.actorUid}</span>
                  <span className="text-text-secondary mx-1">acted on</span>
                  <span className="font-mono text-primary">{log.targetUid}</span>
                </div>
                <div className="text-xs text-text-tertiary font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
