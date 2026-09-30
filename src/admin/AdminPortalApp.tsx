/**
 * Project Kuma - Admin Portal & Governance App
 * Standardized on Kuma Design System primitives and page layouts.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Users,
  Award,
  BookOpen,
  Target,
  ShieldCheck,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Trash2,
  X,
  XCircle,
  FileText,
  Download,
  Eye,
  MoreVertical,
  Ban,
  Search,
  Filter,
} from 'lucide-react';
import {
  PageId,
  CatalogCompetency,
  TrainingCertificate,
  TrainingEnrollment,
  OrgDepartment,
  OrgDesignation,
  DesignationCompetencyRequirement,
  SkillProficiencyLevel,
} from '../types';
import {
  DEMO_ORGANIZATION,
  DEMO_DEPARTMENTS,
  DEMO_COMPETENCIES,
  DEMO_TRAINERS,
  DEMO_TRAINEES,
  DEMO_ORG_DEPARTMENTS_FULL,
  DEMO_ORG_DESIGNATIONS_FULL,
  seedDemoEnvironment,
  resetDemoEnvironment,
  isDemoTraineeIdentity,
} from '../utils/demoDataSeeder';
import { getAllCertificates } from '../utils/certificateUtils';
import { LearningAnalytics } from '../teacher-portal/views/LearningAnalytics';
import AdminAnalyticsView from './AdminAnalyticsView';
import UserApprovalsManager from './UserApprovalsManager';
import { COURSES } from '../teacher-portal/lib/mockData';
import { TeacherAssignment } from '../teacher-portal/types';
import {
  subscribeDepartments,
  subscribeDesignations,
  subscribeCompetencies,
  createDepartmentInFirestore,
  deleteDepartmentFromFirestore,
  createDesignationInFirestore,
  saveDesignationRequirementsInFirestore,
  deleteDesignationFromFirestore,
  createCatalogCompetencyInFirestore,
  deleteCatalogCompetencyFromFirestore,
} from '../services/adminDataService';

import { AppShell, PageLayout } from '../components/layout';
import {
  Button,
  Card,
  Stat,
  Badge,
  StatusPill,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Toolbar,
  Drawer,
  ConfirmDialog,
  SegmentedControl,
  InlineAlert,
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

interface AdminPortalAppProps {
  user: {
    uid: string;
    fullName: string;
    emailAddress: string;
    organization?: string;
  };
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
}

export default function AdminPortalApp({
  user,
  activePage,
  setActivePage,
  onSignOut,
  theme,
}: AdminPortalAppProps) {
  // Local admin tab state
  const currentTab = useMemo(() => {
    if (activePage.startsWith('admin-')) {
      return activePage.replace('admin-', '');
    }
    return 'dashboard';
  }, [activePage]);

  const isDemoAdmin = useMemo(() => {
    return (
      isDemoTraineeIdentity(user?.emailAddress || '') ||
      user?.uid === 'user-demo-admin' ||
      user?.emailAddress === 'admin@capacityconnect.in'
    );
  }, [user?.emailAddress, user?.uid]);

  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(true);

  // Organization Hierarchy State
  const [departments, setDepartments] = useState<OrgDepartment[]>(
    isDemoAdmin ? DEMO_ORG_DEPARTMENTS_FULL : []
  );
  const [designations, setDesignations] = useState<OrgDesignation[]>(
    isDemoAdmin ? DEMO_ORG_DESIGNATIONS_FULL : []
  );
  const [competencies, setCompetencies] = useState<CatalogCompetency[]>(
    isDemoAdmin ? DEMO_COMPETENCIES : []
  );
  const [coursesList, setCoursesList] = useState<TeacherAssignment[]>(COURSES);

  // Selection states for master-detail
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departments[0]?.id || 'dept-eng'
  );
  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDeptId) || departments[0],
    [departments, selectedDeptId]
  );

  const deptDesignations = useMemo(
    () =>
      designations.filter(
        (ds) =>
          ds.departmentId === selectedDept?.id ||
          ds.departmentName?.toLowerCase() === selectedDept?.name.toLowerCase()
      ),
    [designations, selectedDept]
  );

  const [selectedDesig, setSelectedDesig] = useState<OrgDesignation | null>(null);

  useEffect(() => {
    if (deptDesignations.length > 0 && (!selectedDesig || !deptDesignations.some((d) => d.id === selectedDesig.id))) {
      setSelectedDesig(deptDesignations[0]);
    }
  }, [deptDesignations, selectedDesig]);

  // Firestore Subscriptions
  useEffect(() => {
    if (isDemoAdmin) {
      setLoadingStructure(false);
      return;
    }

    setLoadingStructure(true);
    const unsubDepts = subscribeDepartments((depts) => {
      setDepartments(depts.length > 0 ? depts : []);
      setLoadingStructure(false);
    });

    const unsubDesigs = subscribeDesignations((desigs) => {
      setDesignations(desigs.length > 0 ? desigs : []);
    });

    const unsubComps = subscribeCompetencies((comps) => {
      setCompetencies(comps.length > 0 ? comps : []);
    });

    return () => {
      unsubDepts();
      unsubDesigs();
      unsubComps();
    };
  }, [isDemoAdmin]);

  // Dialog States
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const [showAddDesigDialog, setShowAddDesigDialog] = useState(false);
  const [newDesigName, setNewDesigName] = useState('');
  const [newDesigDesc, setNewDesigDesc] = useState('');

  const [showAddCompDialog, setShowAddCompDialog] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCategory, setNewCompCategory] = useState<
    'Technical' | 'Professional' | 'Communication' | 'Leadership' | 'Management' | 'Digital'
  >('Technical');
  const [newCompDesc, setNewCompDesc] = useState('');

  // Drawers & Certificate Revocation state
  const [selectedCompetencyDetail, setSelectedCompetencyDetail] = useState<CatalogCompetency | null>(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<TeacherAssignment | null>(null);
  const [selectedCertificateDetail, setSelectedCertificateDetail] = useState<TrainingCertificate | null>(null);

  const [revokingCertificate, setRevokingCertificate] = useState<TrainingCertificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Certificate list
  const [certificates, setCertificates] = useState<TrainingCertificate[]>(() => getAllCertificates());

  // Search & Filters
  const [courseSearch, setCourseSearch] = useState('');
  const [competencySearch, setCompetencySearch] = useState('');
  const [certSearch, setCertSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Handlers
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDeptName.trim();
    if (!cleanName) return;

    try {
      const created = await createDepartmentInFirestore({
        name: cleanName,
        description: newDeptDesc.trim() || 'Capacity building department.',
        isActive: true,
      });
      setDepartments((prev) => [...prev.filter((d) => d.id !== created.id), created]);
      setShowAddDeptDialog(false);
      setNewDeptName('');
      setNewDeptDesc('');
      setStatusNotice(`Department '${created.name}' created successfully.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message}`);
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDesigName.trim();
    if (!cleanName || !selectedDept) return;

    try {
      const created = await createDesignationInFirestore({
        name: cleanName,
        departmentId: selectedDept.id,
        departmentName: selectedDept.name,
        description: newDesigDesc.trim() || 'Role definition.',
        isActive: true,
        requiredCompetencies: [],
      });
      setDesignations((prev) => [...prev.filter((d) => d.id !== created.id), created]);
      setShowAddDesigDialog(false);
      setNewDesigName('');
      setNewDesigDesc('');
      setStatusNotice(`Designation '${created.name}' created.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message}`);
    }
  };

  const handleCreateCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCompName.trim();
    if (!cleanName) return;

    try {
      const created = await createCatalogCompetencyInFirestore({
        name: cleanName,
        category: newCompCategory,
        description: newCompDesc.trim() || 'Competency definition.',
        isActive: true,
      });
      setCompetencies((prev) => [...prev.filter((c) => c.id !== created.id), created]);
      setShowAddCompDialog(false);
      setNewCompName('');
      setNewCompDesc('');
      setStatusNotice(`Competency '${created.name}' created.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message}`);
    }
  };

  const handleUpdateRequirementLevel = async (desig: OrgDesignation, compId: string, levelNum: number) => {
    const levelMap: Record<number, SkillProficiencyLevel> = {
      1: 'Beginner',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert',
      5: 'Expert',
    };
    const reqLevel = levelMap[levelNum] || 'Intermediate';

    const currentReqs = desig.requiredCompetencies || [];
    const updatedReqs: DesignationCompetencyRequirement[] = currentReqs.map((r) =>
      r.competencyId === compId
        ? {
            ...r,
            requiredLevel: reqLevel,
            requiredNumericLevel: (levelNum > 4 ? 4 : levelNum) as 1 | 2 | 3 | 4,
          }
        : r
    );

    try {
      await saveDesignationRequirementsInFirestore(desig.id, updatedReqs);
      const updatedDesig = { ...desig, requiredCompetencies: updatedReqs };
      setDesignations((prev) => prev.map((d) => (d.id === desig.id ? updatedDesig : d)));
      setSelectedDesig(updatedDesig);
    } catch (err: any) {
      setStatusNotice(`Failed to update requirement level: ${err.message}`);
    }
  };

  const handleRemoveRequirement = async (desigId: string, compId: string) => {
    const desig = designations.find((d) => d.id === desigId);
    if (!desig) return;
    const updatedReqs = (desig.requiredCompetencies || []).filter((r) => r.competencyId !== compId);
    try {
      await saveDesignationRequirementsInFirestore(desigId, updatedReqs);
      const updatedDesig = { ...desig, requiredCompetencies: updatedReqs };
      setDesignations((prev) => prev.map((d) => (d.id === desigId ? updatedDesig : d)));
      if (selectedDesig?.id === desigId) setSelectedDesig(updatedDesig);
    } catch (err: any) {
      setStatusNotice(`Failed to remove requirement: ${err.message}`);
    }
  };

  const handleConfirmRevokeCertificate = () => {
    if (!revokingCertificate || !revokeReason.trim()) return;
    setCertificates((prev) =>
      prev.map((c) => (c.id === revokingCertificate.id ? { ...c, isRevoked: true, revokeReason } : c))
    );
    setStatusNotice(`Certificate ${revokingCertificate.id} revoked.`);
    setRevokingCertificate(null);
    setRevokeReason('');
  };

  // KPIs
  const kpis = {
    pendingApprovals: 3,
    totalUsers: DEMO_TRAINEES.length + DEMO_TRAINERS.length + 2,
    activeCourses: coursesList.filter((c) => c.isActive !== false).length,
    enrollmentsThisMonth: 18,
    certificatesIssued: certificates.length,
  };

  return (
    <AppShell
      role="admin"
      user={user}
      activePage={activePage}
      onNavigate={(pageId) => setActivePage(pageId as PageId)}
      onSignOut={onSignOut}
    >
      {statusNotice && (
        <InlineAlert variant="info" className="mb-4">
          <div className="flex items-center justify-between w-full">
            <span>{statusNotice}</span>
            <button onClick={() => setStatusNotice(null)} aria-label="Close notice" className="text-text-secondary hover:text-text-primary ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </InlineAlert>
      )}

      {/* OVERVIEW DASHBOARD */}
      {currentTab === 'dashboard' && (
        <PageLayout
          title="Admin Overview"
          description={`Organizational capacity summary, governance priorities, and activity log for ${DEMO_ORGANIZATION}.`}
        >
          <div className="space-y-6">
            {/* STATS ROW (Stat primitive with no decorative styling) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-4">
                <Stat label="Pending approvals" value={kpis.pendingApprovals} />
              </Card>
              <Card className="p-4">
                <Stat label="Total users" value={kpis.totalUsers} />
              </Card>
              <Card className="p-4">
                <Stat label="Active courses" value={kpis.activeCourses} />
              </Card>
              <Card className="p-4">
                <Stat label="Enrollments (month)" value={kpis.enrollmentsThisMonth} />
              </Card>
              <Card className="p-4">
                <Stat label="Certificates issued" value={kpis.certificatesIssued} />
              </Card>
            </div>

            {/* TWO LISTS: NEEDS YOUR ATTENTION & RECENT ACTIVITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NEEDS YOUR ATTENTION */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-text-primary flex items-center justify-between">
                  <span>Needs Your Attention</span>
                  <Badge variant="warning">3 Items</Badge>
                </h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-text-primary text-xs">Pending User Registrations</div>
                      <div className="text-xs text-text-secondary">3 trainer requests awaiting approval</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setActivePage('admin-trainees')}>
                      Review
                    </Button>
                  </div>

                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-text-primary text-xs">Unassigned Competency Requirements</div>
                      <div className="text-xs text-text-secondary">2 designations missing required levels</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setActivePage('admin-organization')}>
                      Configure
                    </Button>
                  </div>

                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-text-primary text-xs">Low Completion Alert</div>
                      <div className="text-xs text-text-secondary">CS-101 completion threshold under 40%</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setActivePage('admin-training-programs')}>
                      Inspect
                    </Button>
                  </div>
                </div>
              </Card>

              {/* RECENT ACTIVITY */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-text-primary flex items-center justify-between">
                  <span>Recent Activity</span>
                  <span className="text-xs text-text-tertiary">Real-time</span>
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-text-primary">Certificate KUMA-CERT-1002</span>
                      <div className="text-text-secondary">Issued to Vikram Patel for Kubernetes Architect</div>
                    </div>
                    <span className="text-text-tertiary font-mono text-xs">10m ago</span>
                  </div>

                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-text-primary">New Trainee Roster Import</span>
                      <div className="text-text-secondary">Provisioned 5 accounts via CSV wizard</div>
                    </div>
                    <span className="text-text-tertiary font-mono text-xs">1h ago</span>
                  </div>

                  <div className="p-3 rounded-control bg-surface-muted border border-border flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-text-primary">Department Created</span>
                      <div className="text-text-secondary">Added Cyber Defense division</div>
                    </div>
                    <span className="text-text-tertiary font-mono text-xs">1d ago</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </PageLayout>
      )}

      {/* USERS & APPROVALS TAB */}
      {currentTab === 'trainees' && <UserApprovalsManager role="trainee" />}
      {currentTab === 'trainers' && <UserApprovalsManager role="faculty" />}
      {(currentTab === 'users' || currentTab === 'approvals') && <UserApprovalsManager />}

      {/* ORGANIZATION TAB (MASTER-DETAIL LAYOUT) */}
      {(currentTab === 'organization' || currentTab === 'departments') && (
        <PageLayout
          title="Organization Governance"
          description="Manage departments, designations, and designation competency requirements."
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANE: DEPARTMENTS LIST */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary text-sm">Departments</h3>
                  <Button variant="primary" size="sm" onClick={() => setShowAddDeptDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Dept
                  </Button>
                </div>

                <div className="space-y-2">
                  {departments.map((dept) => {
                    const isSelected = dept.id === selectedDept?.id;
                    const desigCount = designations.filter(
                      (ds) => ds.departmentId === dept.id || ds.departmentName?.toLowerCase() === dept.name.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={dept.id}
                        onClick={() => setSelectedDeptId(dept.id)}
                        className={`p-3 rounded-control border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface border-primary font-medium'
                            : 'bg-surface-muted border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary text-sm">{dept.name}</span>
                          <StatusPill status={dept.isActive ? 'in_progress' : 'not_started'}>
                            {dept.isActive ? 'Active' : 'Inactive'}
                          </StatusPill>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-1">{dept.description}</p>
                        <div className="mt-2 text-xs text-text-tertiary font-mono">{desigCount} designations</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* RIGHT PANE: DESIGNATIONS & REQUIRED COMPETENCY TABLE EDITOR */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">{selectedDept?.name} Designations</h3>
                    <p className="text-xs text-text-secondary">{selectedDept?.description}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowAddDesigDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Designation
                  </Button>
                </div>

                {/* Designations Picker / Selector */}
                {deptDesignations.length === 0 ? (
                  <p className="text-xs text-text-secondary py-4">No designations configured for this department.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
                      {deptDesignations.map((desig) => {
                        const isSel = desig.id === selectedDesig?.id;
                        return (
                          <button
                            key={desig.id}
                            onClick={() => setSelectedDesig(desig)}
                            className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap border ${
                              isSel
                                ? 'bg-primary text-primary-contrast border-primary'
                                : 'bg-surface-muted text-text-secondary border-border hover:border-primary/50'
                            }`}
                          >
                            {desig.name}
                          </button>
                        );
                      })}
                    </div>

                    {selectedDesig && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-text-primary text-sm">{selectedDesig.name} Required Competencies</h4>
                            <p className="text-xs text-text-secondary">{selectedDesig.description}</p>
                          </div>
                        </div>

                        {/* REQUIRED COMPETENCIES TABLE EDITOR */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Competency</TableHead>
                              <TableHead>Target Level (1 - 5)</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedDesig.requiredCompetencies || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-xs text-text-secondary py-6">
                                  No required competencies defined for {selectedDesig.name}.
                                </TableCell>
                              </TableRow>
                            ) : (
                              (selectedDesig.requiredCompetencies || []).map((req) => (
                                <TableRow key={req.competencyId}>
                                  <TableCell className="font-medium text-text-primary text-xs">
                                    {req.competencyName}
                                  </TableCell>
                                  <TableCell>
                                    <SegmentedControl
                                      options={[
                                        { label: 'L1', value: '1' },
                                        { label: 'L2', value: '2' },
                                        { label: 'L3', value: '3' },
                                        { label: 'L4', value: '4' },
                                        { label: 'L5', value: '5' },
                                      ]}
                                      value={String(req.requiredNumericLevel || 2)}
                                      onChange={(val) =>
                                        handleUpdateRequirementLevel(selectedDesig, req.competencyId, Number(val))
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={req.priority === 'high' ? 'danger' : 'neutral'}>
                                      {req.priority || 'medium'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleRemoveRequirement(selectedDesig.id, req.competencyId)}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </PageLayout>
      )}

      {/* COMPETENCIES TAB */}
      {currentTab === 'competencies' && (
        <PageLayout
          title="Competencies Catalog"
          description="Organizational competency frameworks, skill proficiency benchmarks, and level descriptions."
          primaryAction={
            <Button variant="primary" size="sm" onClick={() => setShowAddCompDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Competency
            </Button>
          }
        >
          <div className="space-y-6">
            <Toolbar
              searchValue={competencySearch}
              onSearchChange={setCompetencySearch}
              searchPlaceholder="Filter competencies by name or category..."
            />

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competency Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Mapped Designations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies
                    .filter((c) => !competencySearch || c.name.toLowerCase().includes(competencySearch.toLowerCase()))
                    .map((comp) => {
                      const desigCount = designations.filter(
                        (d) => d.requiredCompetencies?.some((r) => r.competencyId === comp.id)
                      ).length;

                      return (
                        <TableRow
                          key={comp.id}
                          className="cursor-pointer hover:bg-surface-muted/60"
                          onClick={() => setSelectedCompetencyDetail(comp)}
                        >
                          <TableCell className="font-semibold text-text-primary text-xs">{comp.name}</TableCell>
                          <TableCell>
                            <Badge variant="info">{comp.category}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-text-secondary line-clamp-1">{comp.description}</TableCell>
                          <TableCell className="font-mono text-xs">{desigCount} roles</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCompetencyDetail(comp)}>
                              View Levels
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </PageLayout>
      )}

      {/* COURSES, ENROLLMENTS, ASSESSMENTS, CERTIFICATES TABS */}
      {currentTab === 'assessments' && (
        <PageLayout title="Competency Assessments" description="Monitor assessment readiness, pass thresholds, and competency coverage.">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5"><Stat label="Active assessments" value="8" /></Card>
            <Card className="p-5"><Stat label="Average pass rate" value="78%" /></Card>
            <Card className="p-5"><Stat label="Awaiting review" value="12" /></Card>
          </div>
          <Card className="mt-6 p-6">
            <h2 className="font-semibold text-text-primary">Assessment coverage</h2>
            <p className="mt-2 text-sm text-text-secondary">Assessment controls are organized by competency and trainee readiness, independently of training-program management.</p>
          </Card>
        </PageLayout>
      )}
      {(currentTab === 'courses' ||
        currentTab === 'training-programs' ||
        currentTab === 'enrollments' ||
        currentTab === 'certificates') && (
        <PageLayout
          title={
            currentTab === 'certificates'
              ? 'Digital Certificates Audit'
              : 'Courses & Training Programs'
          }
          description="Track active curriculums, enrollments, assessment outcomes, and digital certificates."
        >
          <div className="space-y-6">
            {/* CERTIFICATES TAB SPECIFIC */}
            {currentTab === 'certificates' ? (
              <div className="space-y-6">
                <Toolbar
                  searchValue={certSearch}
                  onSearchChange={setCertSearch}
                  searchPlaceholder="Filter certificates by recipient, course name, or certificate ID..."
                />

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates
                        .filter(
                          (c) =>
                            !certSearch ||
                            c.id.toLowerCase().includes(certSearch.toLowerCase()) ||
                            c.userName.toLowerCase().includes(certSearch.toLowerCase())
                        )
                        .map((c) => (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer hover:bg-surface-muted/60"
                            onClick={() => setSelectedCertificateDetail(c)}
                          >
                            <TableCell className="font-mono text-xs font-semibold text-primary">{c.id}</TableCell>
                            <TableCell className="font-medium text-text-primary text-xs">{c.userName}</TableCell>
                            <TableCell className="text-xs text-text-secondary">{c.courseName}</TableCell>
                            <TableCell className="font-mono text-xs text-text-secondary">{c.issueDate}</TableCell>
                            <TableCell>
                              <StatusPill status={(c as any).isRevoked ? 'not_started' : 'completed'}>
                                {(c as any).isRevoked ? 'Revoked' : 'Verified'}
                              </StatusPill>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {!(c as any).isRevoked && (
                                <Button variant="danger" size="sm" onClick={() => setRevokingCertificate(c)}>
                                  Revoke
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            ) : (
              /* COURSES & ENROLLMENTS TABLE */
              <div className="space-y-6">
                <Toolbar
                  searchValue={courseSearch}
                  onSearchChange={setCourseSearch}
                  searchPlaceholder="Filter training programs by name, code, or topic..."
                />

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code & Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled Trainees</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesList
                        .filter(
                          (c) =>
                            !courseSearch ||
                            c.courseName.toLowerCase().includes(courseSearch.toLowerCase()) ||
                            c.courseCode.toLowerCase().includes(courseSearch.toLowerCase())
                        )
                        .map((c) => (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer hover:bg-surface-muted/60"
                            onClick={() => setSelectedCourseDetail(c)}
                          >
                            <TableCell className="font-medium text-text-primary">
                              <div>
                                <div className="font-semibold text-sm">{c.courseName}</div>
                                <div className="text-xs font-mono text-text-tertiary">{c.courseCode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusPill status={c.isActive !== false ? 'in_progress' : 'not_started'}>
                                {c.isActive !== false ? 'Active' : 'Draft'}
                              </StatusPill>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{c.students || 0} enrolled</TableCell>
                            <TableCell className="text-xs text-text-secondary">{c.duration || '4 Weeks'}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button variant="secondary" size="sm" onClick={() => setSelectedCourseDetail(c)}>
                                View Workspace
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}
          </div>
        </PageLayout>
      )}

      {/* ANALYTICS TAB */}
      {currentTab === 'analytics' && (
        <AdminAnalyticsView
          departments={departments}
          designations={designations}
          competencies={competencies}
          trainees={DEMO_TRAINEES}
          courses={coursesList}
        />
      )}

      {currentTab === 'settings' && (
        <PageLayout title="Admin Settings" description="Manage administrator workspace preferences and governance notifications.">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6"><h2 className="font-semibold text-text-primary">Workspace access</h2><p className="mt-2 text-sm text-text-secondary">You are managing {user.organization || DEMO_ORGANIZATION} as an administrator.</p></Card>
            <Card className="p-6"><h2 className="font-semibold text-text-primary">Governance notifications</h2><p className="mt-2 text-sm text-text-secondary">Approval, certificate, and compliance updates are enabled for this workspace.</p></Card>
          </div>
        </PageLayout>
      )}

      {/* AUDIT LOG TAB */}
      {(currentTab === 'audit' || currentTab === 'logs') && (
        <PageLayout title="Administrative Audit Logs" description="Filterable administrative governance event log.">
          <div className="space-y-6">
            <Toolbar
              searchValue={auditSearch}
              onSearchChange={setAuditSearch}
              searchPlaceholder="Filter audit records by actor, target, or action..."
            />

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target UID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'log-1', action: 'ROLE_GRANT', actor: 'admin@capacityconnect.in', target: 'usr-102', time: '2026-09-30T10:30:00Z' },
                    { id: 'log-2', action: 'USER_APPROVE', actor: 'admin@capacityconnect.in', target: 'usr-105', time: '2026-09-29T14:15:00Z' },
                    { id: 'log-3', action: 'CERTIFICATE_REVOKE', actor: 'admin@capacityconnect.in', target: 'KUMA-CERT-1002', time: '2026-09-28T16:00:00Z' },
                  ].map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="neutral">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.actor}</TableCell>
                      <TableCell className="font-mono text-xs text-primary">{log.target}</TableCell>
                      <TableCell className="font-mono text-xs text-text-secondary">
                        {new Date(log.time).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </PageLayout>
      )}

      {/* DIALOGS */}

      {/* ADD DEPARTMENT DIALOG */}
      <Dialog open={showAddDeptDialog} onOpenChange={setShowAddDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>Add a new organizational capacity department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <FormField label="Department Name" required>
              <Input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Cyber Security & Governance"
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={newDeptDesc}
                onChange={(e) => setNewDeptDesc(e.target.value)}
                placeholder="Department responsibilities..."
              />
            </FormField>
            <DialogFooter>
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddDeptDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD DESIGNATION DIALOG */}
      <Dialog open={showAddDesigDialog} onOpenChange={setShowAddDesigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Designation for {selectedDept?.name}</DialogTitle>
            <DialogDescription>Define a workforce role within this department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDesignation} className="space-y-4">
            <FormField label="Designation Title" required>
              <Input
                value={newDesigName}
                onChange={(e) => setNewDesigName(e.target.value)}
                placeholder="e.g. Senior Security Architect"
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={newDesigDesc}
                onChange={(e) => setNewDesigDesc(e.target.value)}
                placeholder="Role requirements..."
              />
            </FormField>
            <DialogFooter>
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddDesigDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Designation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD COMPETENCY DIALOG */}
      <Dialog open={showAddCompDialog} onOpenChange={setShowAddCompDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Competency</DialogTitle>
            <DialogDescription>Add a new competency to the catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompetency} className="space-y-4">
            <FormField label="Competency Title" required>
              <Input
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder="e.g. Microservices Security"
              />
            </FormField>
            <FormField label="Category">
              <Select
                value={newCompCategory}
                onChange={(e) => setNewCompCategory(e.target.value as any)}
              >
                <option value="Technical">Technical</option>
                <option value="Professional">Professional</option>
                <option value="Communication">Communication</option>
                <option value="Leadership">Leadership</option>
                <option value="Management">Management</option>
                <option value="Digital">Digital</option>
              </Select>
            </FormField>
            <FormField label="Description">
              <Input
                value={newCompDesc}
                onChange={(e) => setNewCompDesc(e.target.value)}
                placeholder="Competency definition and criteria..."
              />
            </FormField>
            <DialogFooter>
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddCompDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Create Competency
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CERTIFICATE REVOCATION CONFIRM DIALOG WITH REQUIRED REASON */}
      <ConfirmDialog
        open={!!revokingCertificate}
        onOpenChange={(open) => !open && setRevokingCertificate(null)}
        title="Revoke Digital Certificate"
        description={
          <div className="space-y-3">
            <p>
              Are you sure you want to revoke certificate <strong>{revokingCertificate?.id}</strong> issued to{' '}
              <strong>{revokingCertificate?.userName}</strong>?
            </p>
            <FormField label="Reason for Revocation" required>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter formal justification for revocation..."
              />
            </FormField>
          </div>
        }
        confirmText="Revoke Certificate"
        isDanger
        onConfirm={handleConfirmRevokeCertificate}
      />

      {/* COMPETENCY DETAIL DRAWER */}
      {selectedCompetencyDetail && (
        <Drawer
          isOpen={!!selectedCompetencyDetail}
          onClose={() => setSelectedCompetencyDetail(null)}
          title={selectedCompetencyDetail.name}
        >
          <div className="space-y-6">
            <div>
              <Badge variant="info">{selectedCompetencyDetail.category}</Badge>
              <p className="text-xs text-text-secondary mt-2">{selectedCompetencyDetail.description}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary text-xs uppercase">Proficiency Levels (1 - 5)</h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-control bg-surface-muted border border-border">
                  <div className="font-semibold text-text-primary">Level 1: Beginner</div>
                  <div className="text-text-secondary">Understands basic concepts and terminology. Requires supervision.</div>
                </div>
                <div className="p-3 rounded-control bg-surface-muted border border-border">
                  <div className="font-semibold text-text-primary">Level 2: Intermediate</div>
                  <div className="text-text-secondary">Applies core skills independently in standard operational scenarios.</div>
                </div>
                <div className="p-3 rounded-control bg-surface-muted border border-border">
                  <div className="font-semibold text-text-primary">Level 3: Advanced</div>
                  <div className="text-text-secondary">Solves complex problems and guides team execution.</div>
                </div>
                <div className="p-3 rounded-control bg-surface-muted border border-border">
                  <div className="font-semibold text-text-primary">Level 4: Expert</div>
                  <div className="text-text-secondary">Architects systems and sets organizational standards.</div>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="sm" className="w-full" onClick={() => setSelectedCompetencyDetail(null)}>
              Close
            </Button>
          </div>
        </Drawer>
      )}

      {/* COURSE DETAIL DRAWER */}
      {selectedCourseDetail && (
        <Drawer
          isOpen={!!selectedCourseDetail}
          onClose={() => setSelectedCourseDetail(null)}
          title={selectedCourseDetail.courseName}
        >
          <div className="space-y-6 text-xs">
            <div>
              <Badge variant="neutral">{selectedCourseDetail.courseCode}</Badge>
              <p className="text-text-secondary mt-2">{selectedCourseDetail.description}</p>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Enrolled Trainees:</span>
                <span className="font-mono text-text-primary">{selectedCourseDetail.students || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Duration:</span>
                <span className="text-text-primary">{selectedCourseDetail.duration || '4 Weeks'}</span>
              </div>
            </div>

            <Button variant="secondary" size="sm" className="w-full" onClick={() => setSelectedCourseDetail(null)}>
              Close Workspace
            </Button>
          </div>
        </Drawer>
      )}
    </AppShell>
  );
}
