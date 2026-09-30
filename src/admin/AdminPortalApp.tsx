/**
 * Project Kuma - Admin Portal & Governance App
 * Executive Organization Management, Competency Administration & Governance Dashboard
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Users,
  Award,
  BookOpen,
  Target,
  BarChart3,
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Briefcase,
  Trash2,
  Edit3,
  Check,
  XCircle,
  MessageSquare,
  Bug,
  Download
} from 'lucide-react';
import { PageId, CatalogCompetency, TrainingCertificate, TrainingEnrollment, OrgDepartment, OrgDesignation, DesignationCompetencyRequirement, SkillProficiencyLevel } from '../types';
import { DEMO_ORGANIZATION, DEMO_DEPARTMENTS, DEMO_COMPETENCIES, DEMO_TRAINERS, DEMO_TRAINEES, DEMO_ORG_DEPARTMENTS_FULL, DEMO_ORG_DESIGNATIONS_FULL, seedDemoEnvironment, resetDemoEnvironment, isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getAllCertificates } from '../utils/certificateUtils';
import { calculateDesignationSkillGaps } from '../utils/competencyUtils';
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
  deleteCatalogCompetencyFromFirestore
} from '../services/adminDataService';
import { parseAndValidateCsv, MAX_BULK_IMPORT_ROWS, CsvUserRow, CsvParseResult } from '../utils/csvImportUtils';
import { bulkImportUsers, BulkUserImportResponse } from '../services/adminUserService';
import { AppShell } from '../components/layout';




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
  theme
}: AdminPortalAppProps) {
  // Local admin sub-tab state
  const currentTab = useMemo(() => {
    if (activePage.startsWith('admin-')) {
      return activePage.replace('admin-', '');
    }
    return 'dashboard';
  }, [activePage]);

  // Check if current user is an explicit demo admin
  const isDemoAdmin = useMemo(() => {
    return isDemoTraineeIdentity(user?.emailAddress || '') || user?.uid === 'user-demo-admin' || user?.emailAddress === 'admin@capacityconnect.in';
  }, [user?.emailAddress, user?.uid]);

  // Seeder & local records state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [loadingStructure, setLoadingStructure] = useState(true);

  // Organization Hierarchy State (initialize with demo fixtures ONLY for demo admin)
  const [departments, setDepartments] = useState<OrgDepartment[]>(isDemoAdmin ? DEMO_ORG_DEPARTMENTS_FULL : []);
  const [designations, setDesignations] = useState<OrgDesignation[]>(isDemoAdmin ? DEMO_ORG_DESIGNATIONS_FULL : []);
  const [competencies, setCompetencies] = useState<CatalogCompetency[]>(isDemoAdmin ? DEMO_COMPETENCIES : []);
  const [coursesList, setCoursesList] = useState<TeacherAssignment[]>(COURSES);

  // Firestore Subscriptions for Real Admin Users
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

  // Department Modal States
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Designation Modal States
  const [showAddDesigModal, setShowAddDesigModal] = useState(false);
  const [newDesigName, setNewDesigName] = useState('');
  const [newDesigDeptId, setNewDesigDeptId] = useState('');
  const [newDesigDesc, setNewDesigDesc] = useState('');

  // Required Competency Modal States for a Designation
  const [selectedDesigForComp, setSelectedDesigForComp] = useState<OrgDesignation | null>(null);
  const [showAddReqCompModal, setShowAddReqCompModal] = useState(false);
  const [reqCompId, setReqCompId] = useState('');
  const [reqProfLevel, setReqProfLevel] = useState<SkillProficiencyLevel>('Intermediate');
  const [reqPriority, setReqPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Catalog Competency Modal States
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCategory, setNewCompCategory] = useState<'Technical' | 'Professional' | 'Communication' | 'Leadership' | 'Management' | 'Digital' | 'Domain Specific'>('Technical');
  const [newCompDesc, setNewCompDesc] = useState('');

  // Course Competency Mapping Modal State
  const [selectedCourseForComp, setSelectedCourseForComp] = useState<TeacherAssignment | null>(null);
  const [showCourseCompModal, setShowCourseCompModal] = useState(false);
  const [courseCompToAdd, setCourseCompToAdd] = useState('');

  const [traineeList, setTraineeList] = useState<typeof DEMO_TRAINEES>(DEMO_TRAINEES);
  const [selectedTrainee, setSelectedTrainee] = useState<typeof DEMO_TRAINEES[0] | null>(null);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDeptName.trim();
    if (!cleanName) return;
    if (departments.some(d => d.name.toLowerCase() === cleanName.toLowerCase())) {
      setStatusNotice(`Department '${cleanName}' already exists.`);
      return;
    }

    try {
      const created = await createDepartmentInFirestore({
        name: cleanName,
        description: newDeptDesc.trim() || 'Organizational capacity building department.',
        isActive: true
      });
      setDepartments(prev => [...prev.filter(d => d.id !== created.id), created]);
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptDesc('');
      setStatusNotice(`Department '${created.name}' created successfully.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message || 'Failed to create department'}`);
    }
  };

  const handleToggleDeptStatus = (id: string) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDesigName.trim();
    if (!cleanName || !newDesigDeptId) {
      setStatusNotice('Error: Designation title and department selection are required.');
      return;
    }
    const targetDept = departments.find(d => d.id === newDesigDeptId);
    if (!targetDept) {
      setStatusNotice('Error: Selected department not found.');
      return;
    }

    if (designations.some(d => d.name.toLowerCase() === cleanName.toLowerCase() && d.departmentId === newDesigDeptId)) {
      setStatusNotice(`Designation '${cleanName}' already exists in ${targetDept.name}.`);
      return;
    }

    try {
      const created = await createDesignationInFirestore({
        name: cleanName,
        departmentId: targetDept.id,
        departmentName: targetDept.name,
        description: newDesigDesc.trim() || 'Organizational role definition.',
        isActive: true,
        requiredCompetencies: []
      });
      setDesignations(prev => [...prev.filter(d => d.id !== created.id), created]);
      setShowAddDesigModal(false);
      setNewDesigName('');
      setNewDesigDesc('');
      setStatusNotice(`Designation '${created.name}' added under ${targetDept.name}.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message || 'Failed to create designation'}`);
    }
  };

  const handleToggleDesigStatus = (id: string) => {
    setDesignations(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const handleAddRequiredCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesigForComp || !reqCompId) return;
    const catalogComp = competencies.find(c => c.id === reqCompId);
    if (!catalogComp) {
      setStatusNotice('Error: Referenced competency ID does not exist in catalog.');
      return;
    }

    // Check duplicate competency requirement on same designation
    const existingReqs = selectedDesigForComp.requiredCompetencies || [];
    if (existingReqs.some(r => r.competencyId === reqCompId)) {
      setStatusNotice(`Error: Duplicate competency '${catalogComp.name}' is already assigned to ${selectedDesigForComp.name}.`);
      return;
    }

    const numericMap: Record<SkillProficiencyLevel, 1 | 2 | 3 | 4> = {
      'Beginner': 1,
      'Intermediate': 2,
      'Advanced': 3,
      'Expert': 4
    };

    const targetLevelNumeric = numericMap[reqProfLevel] || 2;
    if (targetLevelNumeric < 1 || targetLevelNumeric > 5) {
      setStatusNotice('Error: Target level must be between 1 and 5.');
      return;
    }

    const newReq: DesignationCompetencyRequirement = {
      competencyId: catalogComp.id,
      competencyName: catalogComp.name,
      requiredLevel: reqProfLevel,
      requiredNumericLevel: targetLevelNumeric,
      priority: reqPriority
    };

    const updatedReqs = [...existingReqs, newReq];

    try {
      await saveDesignationRequirementsInFirestore(selectedDesigForComp.id, updatedReqs);
      const updatedDesig = {
        ...selectedDesigForComp,
        requiredCompetencies: updatedReqs
      };

      setDesignations(prev => prev.map(d => d.id === updatedDesig.id ? updatedDesig : d));
      setSelectedDesigForComp(updatedDesig);
      setShowAddReqCompModal(false);
      setReqCompId('');
      setStatusNotice(`Required competency '${catalogComp.name} (${reqProfLevel})' assigned to ${selectedDesigForComp.name}.`);
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message || 'Failed to save competency requirement'}`);
    }
  };

  const handleRemoveRequiredCompetency = async (desigId: string, compId: string) => {
    const targetDesig = designations.find(d => d.id === desigId);
    if (!targetDesig) return;

    const filteredReqs = (targetDesig.requiredCompetencies || []).filter(r => r.competencyId !== compId);

    try {
      await saveDesignationRequirementsInFirestore(desigId, filteredReqs);
      setDesignations(prev => prev.map(d => {
        if (d.id !== desigId) return d;
        const updated = { ...d, requiredCompetencies: filteredReqs };
        if (selectedDesigForComp?.id === desigId) {
          setSelectedDesigForComp(updated);
        }
        return updated;
      }));
    } catch (err: any) {
      setStatusNotice(`Error: ${err.message || 'Failed to remove competency requirement'}`);
    }
  };

  const handleAddCompetencyToCourse = (courseId: string, compId: string) => {
    const targetComp = competencies.find(c => c.id === compId);
    if (!targetComp) return;

    setCoursesList(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const existingIds = course.competencyIds || [];
      const existingNames = course.competencyNames || [];

      if (existingIds.includes(targetComp.id)) return course;

      const updated = {
        ...course,
        competencyIds: [...existingIds, targetComp.id],
        competencyNames: [...existingNames, targetComp.name]
      };

      if (selectedCourseForComp?.id === courseId) {
        setSelectedCourseForComp(updated);
      }
      return updated;
    }));

    setStatusNotice(`Mapped competency '${targetComp.name}' to course.`);
  };

  const handleRemoveCompetencyFromCourse = (courseId: string, compId: string) => {
    setCoursesList(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const idx = (course.competencyIds || []).indexOf(compId);
      if (idx === -1) return course;

      const newIds = [...(course.competencyIds || [])];
      const newNames = [...(course.competencyNames || [])];
      newIds.splice(idx, 1);
      newNames.splice(idx, 1);

      const updated = {
        ...course,
        competencyIds: newIds,
        competencyNames: newNames
      };

      if (selectedCourseForComp?.id === courseId) {
        setSelectedCourseForComp(updated);
      }
      return updated;
    }));

    setStatusNotice('Removed competency mapping from course.');
  };


  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState(
`fullName,emailAddress,department,designation,employeeId
Ananya Rao,ananya.rao@acme.com,Data & Analytics,Data Analyst,EMP-101
Vikram Patel,vikram.patel@acme.com,Technology,Senior Software Engineer,EMP-102
Meera Joshi,meera.j@acme.com,Human Resources,HR Lead,EMP-103`
  );
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<BulkUserImportResponse | null>(null);

  const csvParseResult: CsvParseResult = useMemo(() => {
    const deptNames = departments.map(d => d.name);
    const desigNames = designations.map(d => d.name);
    return parseAndValidateCsv(csvContent, deptNames, desigNames);
  }, [csvContent, departments, designations]);

  const handleBulkImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (csvParseResult.validRows.length === 0) return;
    setIsImportingCsv(true);
    setBulkImportResult(null);

    try {
      const res = await bulkImportUsers(csvParseResult.validRows);
      setBulkImportResult(res);
      if (res.success) {
        const createdItems = res.results.filter(r => r.status === 'created');
        if (createdItems.length > 0) {
          const newTrainees = [...traineeList];
          csvParseResult.validRows.forEach((row, i) => {
            const matchRes = res.results.find(r => r.email.toLowerCase() === row.email.toLowerCase());
            if (matchRes && matchRes.status === 'created') {
              newTrainees.push({
                uid: matchRes.uid || `user-csv-${Date.now()}-${i}`,
                fullName: row.name,
                emailAddress: row.email,
                department: row.department || 'General',
                designation: row.designation || 'Trainee',
                competencies: [],
                enrollments: [],
                certificates: []
              });
            }
          });
          setTraineeList(newTrainees);
        }
        setStatusNotice(`Bulk import complete: ${res.createdCount} created, ${res.skippedCount} skipped, ${res.errorCount} failed.`);
      } else {
        setStatusNotice(`Bulk import error: ${res.error || 'Failed to import users'}`);
      }
    } catch (err: any) {
      setStatusNotice(`Bulk import error: ${err.message || 'Network error'}`);
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Certificates real lookup
  const certificates = useMemo(() => getAllCertificates(), []);

  // Compute live admin KPIs from real records
  const kpis = useMemo(() => {
    const totalTrainees = traineeList.length;
    const totalTrainers = DEMO_TRAINERS.length;
    const activeCourses = 5;
    const totalCompetencies = competencies.length;
    
    // Enrollments
    const enrollmentsRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('kuma_user_enrollments') : null;
    const enrollments: TrainingEnrollment[] = enrollmentsRaw ? JSON.parse(enrollmentsRaw) : [];
    
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const totalEnrollments = enrollments.length || 1;
    const completionRate = Math.round((completedEnrollments / totalEnrollments) * 100);

    // Total Skill Gaps
    let totalSkillGaps = 0;
    traineeList.forEach(t => {
      t.competencies.forEach(c => {
        const declared = c.numericLevel || 1;
        const assessed = c.latestAssessedNumericLevel || declared;
        const currentMax = Math.max(declared, assessed);
        const target = c.targetNumericLevel || currentMax;
        if (target > currentMax) {
          totalSkillGaps += (target - currentMax);
        }
      });
    });

    return {
      totalTrainees,
      totalTrainers,
      activeCourses,
      totalCompetencies,
      completedEnrollments,
      completionRate,
      totalSkillGaps,
      certificatesIssued: certificates.length
    };
  }, [competencies, certificates, traineeList]);

  const handleCreateCompetency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const newComp: CatalogCompetency = {
      id: `comp-${Date.now()}`,
      name: newCompName.trim(),
      category: newCompCategory,
      description: newCompDesc.trim() || 'Organizational capacity building competency.',
      isActive: true
    };

    setCompetencies(prev => [newComp, ...prev]);
    setShowAddCompModal(false);
    setNewCompName('');
    setNewCompDesc('');
    setStatusNotice(`Competency '${newComp.name}' created successfully.`);
  };

  const handleExportGovernanceReport = () => {
    const headers = ['Department', 'Trainee Name', 'Designation', 'Competencies Tracked', 'Status'];
    const rows = traineeList.map(t => [
      `"${t.department}"`,
      `"${t.fullName}"`,
      `"${t.designation}"`,
      t.competencies.length,
      `"Active Cohort"`
    ]);

    const csvText = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Kuma_Workforce_Governance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusNotice('Workforce Capacity & Governance Report (.CSV) generated and downloaded.');
  };

  const handleSeedData = () => {
    const res = seedDemoEnvironment();
    setStatusNotice(res.message);
  };

  const handleResetData = () => {
    const res = resetDemoEnvironment();
    setStatusNotice(res.message);
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
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-container text-xs font-medium text-text-primary flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span>{statusNotice}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-text-secondary hover:text-text-primary">✕</button>
        </div>
      )}

        {/* Dynamic View Switcher */}
          
          {/* USER APPROVALS & ROLES TAB */}
          {currentTab === 'users' && <UserApprovalsManager />}

          {/* DASHBOARD TAB */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  <span>ORGANIZATIONAL CAPACITY DASHBOARD</span>
                  <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full role-badge-admin">LIVE INSIGHTS</span>
                </h1>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">Real-time capacity building insights, workforce competencies, and training progress for {DEMO_ORGANIZATION}.</p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                {[
                  { label: 'TOTAL TRAINEES', val: kpis.totalTrainees, icon: Users, color: '#F59E0B', bgTint: 'bg-amber-500/10', border: 'border-amber-500/40' },
                  { label: 'ACTIVE TRAINERS', val: kpis.totalTrainers, icon: Briefcase, color: '#38BDF8', bgTint: 'bg-sky-500/10', border: 'border-sky-500/40' },
                  { label: 'TRAINING PROGRAMS', val: kpis.activeCourses, icon: BookOpen, color: '#A855F7', bgTint: 'bg-purple-500/10', border: 'border-purple-500/40' },
                  { label: 'COMPETENCIES', val: kpis.totalCompetencies, icon: Target, color: '#22C55E', bgTint: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
                  { label: 'COMPLETION RATE', val: `${kpis.completionRate}%`, icon: TrendingUp, color: '#06B6D4', bgTint: 'bg-cyan-500/10', border: 'border-cyan-500/40' },
                  { label: 'SKILL GAPS IDENTIFIED', val: kpis.totalSkillGaps, icon: AlertCircle, color: '#F43F5E', bgTint: 'bg-rose-500/10', border: 'border-rose-500/40' },
                  { label: 'CERTIFICATES ISSUED', val: kpis.certificatesIssued, icon: ShieldCheck, color: '#10B981', bgTint: 'bg-teal-500/10', border: 'border-teal-500/40' },
                  { label: 'ORGANIZATION DEPTS', val: DEMO_DEPARTMENTS.length, icon: Building, color: '#6366F1', bgTint: 'bg-indigo-500/10', border: 'border-indigo-500/40' }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className={`p-4 rounded-xl bg-[var(--card-bg)] border-2 ${kpi.border} shadow-paper-sm space-y-3 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
                      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-xl ${kpi.bgTint}`} />
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                        <span>{kpi.label}</span>
                        <div className={`p-2 rounded-lg ${kpi.bgTint} border ${kpi.border}`}>
                          <Icon size={18} style={{ color: kpi.color }} />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{kpi.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Trainee Directory Quick Overview */}
              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="flex items-center justify-between font-mono">
                  <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)]">TRAINEE CAPACITY DIRECTORY</h3>
                  <button onClick={() => setActivePage('admin-trainees')} className="text-xs font-bold text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View All Trainees</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Trainee Name</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Competencies</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[var(--border-main)]">
                      {DEMO_TRAINEES.map((t) => (
                        <tr key={t.uid} className="hover:bg-[var(--panel-bg)]">
                          <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{t.fullName}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{t.department}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{t.designation}</td>
                          <td className="py-3 px-3">
                            <span className="bg-[#FFC400]/15 text-[#FFC400] px-2 py-0.5 rounded border border-[#FFC400] font-bold">
                              {t.competencies.length} Active
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setSelectedTrainee(t)}
                              className="px-2.5 py-1 rounded bg-[#38BDF8] text-[#111111] font-bold border border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                            >
                              Inspect Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ORGANIZATION TAB */}
          {currentTab === 'organization' && (
            <div className="space-y-8 font-mono">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">ORGANIZATION GOVERNANCE</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Manage departments, organizational designations, and competency requirements for workforce capacity building.</p>
              </div>

              {/* Organization Profile Banner */}
              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-[#FFC400] border-2 border-[var(--border-main)] text-[#111111]">
                      <Building size={26} />
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-[var(--text-primary)]">{DEMO_ORGANIZATION}</div>
                      <div className="text-xs text-[var(--text-secondary)]">National Digital Capacity Building & Skill Transformation Framework</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-[#19B56B]/15 text-[#19B56B] text-xs font-bold border border-[#19B56B]">
                      ACTIVE ENTERPRISE
                    </span>
                  </div>
                </div>
              </div>

              {/* DEPARTMENTS SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold uppercase text-[var(--text-primary)]">DEPARTMENTS ({departments.length})</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Organizational divisions holding designations and workforce cohorts.</p>
                  </div>
                  <button
                    onClick={() => setShowAddDeptModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#FFC400] text-[#111111] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>CREATE DEPARTMENT</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {departments.map((dept) => {
                    const traineeCount = traineeList.filter(t => t.department.toLowerCase() === dept.name.toLowerCase()).length;
                    const trainerCount = DEMO_TRAINEES.filter(() => false).length + (DEMO_TRAINERS.filter(tr => tr.department.toLowerCase() === dept.name.toLowerCase()).length);
                    const desigCount = designations.filter(ds => ds.departmentId === dept.id || ds.departmentName.toLowerCase() === dept.name.toLowerCase()).length;

                    return (
                      <div key={dept.id} className="p-5 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-[var(--text-primary)]">{dept.name}</span>
                            <button
                              onClick={() => handleToggleDeptStatus(dept.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                                dept.isActive
                                  ? 'bg-[#19B56B]/15 text-[#19B56B] border-[#19B56B]'
                                  : 'bg-[var(--panel-bg)] text-[var(--text-secondary)] border-[var(--border-main)]'
                              }`}
                            >
                              {dept.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{dept.description}</p>
                        </div>

                        <div className="border-t border-[var(--border-main)] pt-3 space-y-1 text-xs">
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Trainees Enrolled:</span>
                            <strong className="text-[var(--text-primary)]">{traineeCount}</strong>
                          </div>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Assigned Trainers:</span>
                            <strong className="text-[var(--text-primary)]">{trainerCount}</strong>
                          </div>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Designations:</span>
                            <strong className="text-[#38BDF8]">{desigCount}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DESIGNATIONS / ROLES SECTION */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold uppercase text-[var(--text-primary)]">ORGANIZATIONAL DESIGNATIONS ({designations.length})</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Specific workforce roles and their required competency levels.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (departments.length > 0 && !newDesigDeptId) {
                        setNewDesigDeptId(departments[0].id);
                      }
                      setShowAddDesigModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#38BDF8] text-[#111111] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>CREATE DESIGNATION</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {designations.map((desig) => (
                    <div key={desig.id} className="p-5 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[var(--text-primary)]">{desig.name}</span>
                          <span className="text-[10px] font-bold uppercase bg-[#FFC400]/15 text-[#FFC400] px-2 py-0.5 rounded border border-[#FFC400]">
                            {desig.departmentName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleDesigStatus(desig.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                            desig.isActive
                              ? 'bg-[#19B56B]/15 text-[#19B56B] border-[#19B56B]'
                              : 'bg-[var(--panel-bg)] text-[var(--text-secondary)] border-[var(--border-main)]'
                          }`}
                        >
                          {desig.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)]">{desig.description}</p>

                      {/* Required Competencies Summary */}
                      <div className="border-t border-[var(--border-main)] pt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[var(--text-secondary)] uppercase">REQUIRED COMPETENCIES ({desig.requiredCompetencies?.length || 0})</span>
                          <button
                            onClick={() => setSelectedDesigForComp(desig)}
                            className="text-[#38BDF8] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 size={13} />
                            <span>Manage Requirements</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(desig.requiredCompetencies || []).length === 0 ? (
                            <span className="text-[11px] text-[var(--text-secondary)] italic">No required competencies defined yet.</span>
                          ) : (
                            desig.requiredCompetencies.map((req) => (
                              <span key={req.competencyId} className="px-2 py-0.5 rounded bg-[var(--panel-bg)] border border-[var(--border-main)] text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1">
                                <span>{req.competencyName}</span>
                                <span className="text-[#FFC400] font-mono text-[10px]">({req.requiredLevel})</span>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* COMPETENCIES TAB */}
          {currentTab === 'competencies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between font-mono">
                <div>
                  <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">COMPETENCY CATALOG</h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Manage organizational competency frameworks and proficiency benchmarks.</p>
                </div>

                <button
                  onClick={() => setShowAddCompModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#FFC400] text-[#111111] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
                >
                  <Plus size={16} />
                  <span>CREATE COMPETENCY</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
                {competencies.map((comp) => (
                  <div key={comp.id} className="p-5 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase bg-[#38BDF8]/15 text-[#38BDF8] px-2 py-0.5 rounded border border-[#38BDF8]">
                        {comp.category}
                      </span>
                      <span className="text-[10px] font-bold text-[#19B56B]">Active</span>
                    </div>

                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">{comp.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{comp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRAINEES TAB */}
          {currentTab === 'trainees' && (
            <div className="space-y-6 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">TRAINEE DIRECTORY</h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">View trainee profiles, competencies, skill gaps, and certificates.</p>
                </div>

                <button
                  onClick={() => setShowCsvModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#38BDF8] text-[#111111] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                >
                  <Plus size={16} />
                  <span>IMPORT TRAINEES (CSV)</span>
                </button>
              </div>

              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Competencies</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[var(--border-main)]">
                      {traineeList.map((t) => (
                        <tr key={t.uid} className="hover:bg-[var(--panel-bg)]">
                          <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{t.fullName}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{t.emailAddress}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{t.department}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{t.designation}</td>
                          <td className="py-3 px-3">
                            <span className="bg-[#FFC400]/15 text-[#FFC400] px-2 py-0.5 rounded border border-[#FFC400] font-bold">
                              {t.competencies.length} Competencies
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setSelectedTrainee(t)}
                              className="px-2.5 py-1 rounded bg-[#38BDF8] text-[#111111] font-bold border border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TRAINERS TAB */}
          {currentTab === 'trainers' && (
            <div className="space-y-6 font-mono">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">TRAINER DIRECTORY</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Manage assigned instructors, training specializations, and departmental trainers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_TRAINERS.map((tr) => (
                  <div key={tr.uid} className="p-5 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#38BDF8] text-[#111111] font-extrabold border-2 border-[var(--border-main)] flex items-center justify-center text-sm">
                        {tr.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">{tr.fullName}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{tr.designation}</div>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] border-t border-[var(--border-main)] pt-2 space-y-1">
                      <div>Department: <strong className="text-[var(--text-primary)]">{tr.department}</strong></div>
                      <div>Specialization: <strong className="text-[#FFC400]">{tr.specialization}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRAINING PROGRAMS TAB */}
          {currentTab === 'training-programs' && (
            <div className="space-y-6 font-mono">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">TRAINING PROGRAMS & COMPETENCY MAPPING</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Manage organizational training programs, mapped competencies, and audit training coverage gaps.</p>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesList.map((course) => (
                  <div key={course.id} className="p-5 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="bg-[#9C27B0]/20 text-[#9C27B0] px-2 py-0.5 rounded border border-[#9C27B0]/40 font-extrabold">{course.courseCode}</span>
                        <span className="text-[#19B56B] bg-[#19B56B]/15 px-2 py-0.5 rounded border border-[#19B56B]/40 font-bold">{course.isActive ? 'Active' : 'Inactive'}</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight">{course.courseName}</h3>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{course.description}</p>

                      <div className="text-xs text-[var(--text-secondary)] space-y-1.5 border-t border-[var(--border-main)]/50 pt-2">
                        <div className="flex items-center justify-between">
                          <span>Duration:</span>
                          <strong className="text-[var(--text-primary)]">{course.duration || '4 Weeks'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Enrolled Trainees:</span>
                          <strong className="text-[#FFC400]">{course.students || 0} Trainees</strong>
                        </div>

                        {/* Mapped Competencies */}
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Mapped Competencies:</span>
                          <div className="flex flex-wrap gap-1">
                            {(course.competencyNames && course.competencyNames.length > 0) ? (
                              course.competencyNames.map((cName, idx) => (
                                <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                  {cName}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-red-500 italic">No competencies mapped</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCourseForComp(course);
                        setShowCourseCompModal(true);
                      }}
                      className="w-full mt-2 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-primary)] hover:bg-[#38BDF8] hover:text-[#111111] font-bold text-xs border border-[var(--border-main)] transition-colors cursor-pointer"
                    >
                      Manage Competency Mapping
                    </button>
                  </div>
                ))}
              </div>

              {/* TRAINING COVERAGE AUDIT TABLE (Requirement 12) */}
              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                  <div>
                    <h2 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#FFC400]" />
                      ORGANIZATIONAL TRAINING COVERAGE AUDIT
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Evaluates whether active training programs exist for each catalog competency required across designations.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-500 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30">
                    Coverage Gap Audit
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Competency</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Role Requirements</th>
                        <th className="py-2.5 px-3">Available Training Programs</th>
                        <th className="py-2.5 px-3 text-right">Coverage Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[var(--border-main)]">
                      {competencies.map((comp) => {
                        // Find active training programs matching this competency
                        const matchingCourses = coursesList.filter(
                          c => (c.competencyIds && c.competencyIds.includes(comp.id)) ||
                               (c.competencyNames && c.competencyNames.some(cn => cn.toLowerCase() === comp.name.toLowerCase()))
                        );
                        const hasTraining = matchingCourses.length > 0;

                        // Count designations requiring this competency
                        const reqDesignations = designations.filter(
                          d => d.requiredCompetencies && d.requiredCompetencies.some(rc => rc.competencyId === comp.id)
                        );

                        return (
                          <tr key={comp.id} className="hover:bg-[var(--panel-bg)]">
                            <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{comp.name}</td>
                            <td className="py-3 px-3 text-[var(--text-secondary)]">{comp.category}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#FFC400]">
                                Required by {reqDesignations.length} Role{reqDesignations.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {hasTraining ? (
                                <div className="space-y-0.5">
                                  {matchingCourses.map(mc => (
                                    <div key={mc.id} className="font-bold text-purple-600 dark:text-purple-400">
                                      {mc.courseName} ({mc.courseCode})
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-red-500 font-bold italic">No matching training program</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {hasTraining ? (
                                <span className="bg-[#19B56B]/15 text-[#19B56B] px-2.5 py-1 rounded border border-[#19B56B]/40 font-extrabold uppercase">
                                  Training Available
                                </span>
                              ) : (
                                <span className="bg-red-500/15 text-red-600 dark:text-red-400 px-2.5 py-1 rounded border border-red-500/40 font-extrabold uppercase">
                                  Training Coverage Gap
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ASSESSMENTS TAB */}
          {currentTab === 'assessments' && (
            <div className="space-y-6 font-mono">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">COMPETENCY ASSESSMENTS</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Interactive competency evaluations and participant score records.</p>
              </div>

              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="text-xs font-bold text-[var(--text-primary)]">Active Assessment Modules</div>
                <div className="space-y-3">
                  {[
                    { name: 'Data Analysis Proficiency Evaluation', comp: 'Data Analysis', passScore: '70%', questions: 10 },
                    { name: 'Python Programming Diagnostic', comp: 'Python', passScore: '75%', questions: 12 },
                    { name: 'Executive Communication Assessment', comp: 'Communication', passScore: '65%', questions: 8 }
                  ].map((a, i) => (
                    <div key={i} className="p-4 rounded-[6px] bg-[var(--panel-bg)] border-2 border-[var(--border-main)] flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">{a.name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">Mapped Competency: <span className="text-[#38BDF8]">{a.comp}</span></div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-extrabold text-[#FFC400]">Pass Threshold: {a.passScore}</div>
                        <div className="text-[var(--text-secondary)]">{a.questions} Questions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {currentTab === 'analytics' && (
            <AdminAnalyticsView
              departments={departments}
              designations={designations}
              competencies={competencies}
              trainees={traineeList}
              courses={coursesList}
            />
          )}

          {/* CERTIFICATES TAB */}
          {currentTab === 'certificates' && (
            <div className="space-y-6 font-mono">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">DIGITAL CERTIFICATE AUDIT</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Issued organizational capacity certificates and cryptographic verification records.</p>
              </div>

              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Certificate ID</th>
                        <th className="py-2.5 px-3">Trainee Name</th>
                        <th className="py-2.5 px-3">Training Program</th>
                        <th className="py-2.5 px-3">Issue Date</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[var(--border-main)]">
                      {certificates.map((c) => (
                        <tr key={c.id} className="hover:bg-[var(--panel-bg)]">
                          <td className="py-3 px-3 font-bold text-[#FFC400]">{c.id}</td>
                          <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{c.userName}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{c.courseName}</td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{c.issueDate}</td>
                          <td className="py-3 px-3">
                            <span className="bg-[#19B56B]/15 text-[#19B56B] px-2 py-0.5 rounded border border-[#19B56B] font-bold">
                              VERIFIED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {currentTab === 'settings' && (
            <div className="space-y-6 font-mono max-w-3xl">
              <div>
                <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">ADMIN SYSTEM SETTINGS</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Manage system configurations and demonstration utilities.</p>
              </div>

              <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
                <div className="text-sm font-extrabold text-[var(--text-primary)] uppercase">Demonstration Seeder & Utility Controls</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Initialize or reset sample capacity building records for demonstration purposes. This operates exclusively within the 'Acme Digital Services' scope without affecting production data.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleSeedData}
                    className="px-4 py-2 rounded-[6px] bg-[#FFC400] text-[#111111] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
                  >
                    SEED DEMO DATA
                  </button>
                  <button
                    onClick={handleResetData}
                    className="px-4 py-2 rounded-[6px] bg-[#FF4D4D] text-[#ffffff] font-bold text-xs border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-red-600 cursor-pointer"
                  >
                    RESET DEMO DATA
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* BULK CSV TRAINEE IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] uppercase flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#38BDF8]" />
                  Bulk Provision Trainee Accounts (CSV)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Creates Firebase Auth accounts, sets role <code className="text-[#FFC400]">trainee</code>, sets status <code className="text-[#19B56B]">approved</code>, and generates invite links. Max {MAX_BULK_IMPORT_ROWS} rows per request.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCsvModal(false);
                  setBulkImportResult(null);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {bulkImportResult ? (
              /* PROVISIONING EXECUTION RESULT VIEW */
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded bg-[#19B56B]/15 border border-[#19B56B]/40 space-y-1">
                  <h4 className="font-extrabold uppercase text-[#19B56B] flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Provisioning Complete
                  </h4>
                  <p className="text-[var(--text-primary)] font-bold">
                    Total: {bulkImportResult.total} | Created: {bulkImportResult.createdCount} | Skipped (Existing): {bulkImportResult.skippedCount} | Failed: {bulkImportResult.errorCount}
                  </p>
                </div>

                {bulkImportResult.results.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-extrabold uppercase text-[var(--text-secondary)] text-[10px]">User Account Status & Password Reset Invite Links:</h5>
                    <div className="max-h-60 overflow-y-auto border border-[var(--border-main)] rounded bg-[var(--input-bg)] p-2 divide-y divide-[var(--border-main)]">
                      {bulkImportResult.results.map((res, idx) => (
                        <div key={idx} className="py-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-[var(--text-primary)]">{res.email}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                              res.status === 'created' ? 'bg-[#19B56B]/20 text-[#19B56B]' :
                              res.status === 'skipped' ? 'bg-amber-500/20 text-amber-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {res.status}
                            </span>
                          </div>
                          {res.status === 'created' && res.inviteLink && (
                            <div className="flex items-center gap-2 bg-[var(--panel-bg)] p-1.5 rounded border border-[var(--border-main)] text-[10px] font-mono">
                              <span className="text-[var(--text-secondary)] shrink-0">Invite Link:</span>
                              <input
                                type="text"
                                readOnly
                                value={res.inviteLink}
                                className="w-full bg-transparent text-[#38BDF8] select-all outline-none truncate"
                              />
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(res.inviteLink || '')}
                                className="px-2 py-0.5 bg-[#38BDF8] text-[#111111] font-black rounded hover:bg-[#7dd3fc] cursor-pointer shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                          {res.error && (
                            <p className="text-red-400 text-[10px] font-bold">{res.error}</p>
                          )}
                          {res.message && (
                            <p className="text-amber-400 text-[10px]">{res.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCsvModal(false);
                      setBulkImportResult(null);
                    }}
                    className="px-4 py-2 rounded bg-[#38BDF8] text-[#111111] font-black border-2 border-[var(--border-main)] cursor-pointer"
                  >
                    Done & Return to User List
                  </button>
                </div>
              </div>
            ) : (
              /* INPUT & PREVIEW FORM */
              <form onSubmit={handleBulkImportCsv} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-[var(--text-secondary)] mb-1">
                    Paste CSV Content (Headers auto-detected: fullName, emailAddress, department, designation, employeeId):
                  </label>
                  <textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={6}
                    placeholder="fullName,emailAddress,department,designation,employeeId"
                    className="w-full p-3 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-mono font-bold text-xs outline-none"
                  />
                </div>

                {/* Validation Preview Header */}
                <div className="p-3 rounded bg-[var(--panel-bg)] border border-[var(--border-main)] flex items-center justify-between font-bold text-xs">
                  <div className="flex items-center gap-3">
                    <span>Validation Summary:</span>
                    <span className="text-[var(--text-primary)]">{csvParseResult.totalRows} Rows</span>
                    <span className="text-[#19B56B]">{csvParseResult.validCount} Valid</span>
                    <span className="text-amber-500">{csvParseResult.warningCount} Warnings</span>
                    <span className="text-red-500">{csvParseResult.errorCount} Errors</span>
                  </div>
                  {csvParseResult.totalRows > MAX_BULK_IMPORT_ROWS && (
                    <span className="text-red-400 font-extrabold text-[10px] uppercase">
                      ⚠️ Exceeds limit ({MAX_BULK_IMPORT_ROWS} max)
                    </span>
                  )}
                </div>

                {/* Validation Preview Table */}
                {csvParseResult.rows.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="font-extrabold uppercase text-[var(--text-secondary)] text-[10px]">Row-Level Validation Preview:</h5>
                    <div className="max-h-48 overflow-y-auto border border-[var(--border-main)] rounded bg-[var(--input-bg)]">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[var(--panel-bg)] text-[var(--text-secondary)] uppercase text-[9px] sticky top-0">
                          <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Name / Email</th>
                            <th className="p-2">Dept / Designation</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Validation Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-main)] font-mono">
                          {csvParseResult.rows.map((r) => (
                            <tr key={r.rowNumber} className="hover:bg-[var(--panel-bg)]">
                              <td className="p-2 font-bold text-[var(--text-secondary)]">{r.rowNumber}</td>
                              <td className="p-2 font-bold text-[var(--text-primary)]">
                                {r.name || '<empty>'} <br />
                                <span className="text-[10px] text-[#38BDF8]">{r.email || '<empty>'}</span>
                              </td>
                              <td className="p-2 text-[var(--text-secondary)]">
                                {r.department} / {r.designation}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                                  !r.isValid ? 'bg-red-500/20 text-red-500' :
                                  r.warnings.length > 0 ? 'bg-amber-500/20 text-amber-500' :
                                  'bg-[#19B56B]/20 text-[#19B56B]'
                                }`}>
                                  {!r.isValid ? 'Error' : r.warnings.length > 0 ? 'Warning' : 'Valid'}
                                </span>
                              </td>
                              <td className="p-2 text-[10px]">
                                {r.errors.map((e, i) => (
                                  <div key={i} className="text-red-400 font-bold">{e}</div>
                                ))}
                                {r.warnings.map((w, i) => (
                                  <div key={i} className="text-amber-400">{w}</div>
                                ))}
                                {r.isValid && r.warnings.length === 0 && (
                                  <span className="text-[#19B56B]">Ready to import</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-3 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-secondary)] font-bold border border-[var(--border-main)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isImportingCsv || csvParseResult.validRows.length === 0 || csvParseResult.totalRows > MAX_BULK_IMPORT_ROWS}
                    className="px-4 py-2 rounded bg-[#38BDF8] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImportingCsv ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Provisioning Accounts...</span>
                      </>
                    ) : (
                      <span>Provision {csvParseResult.validRows.length} User Accounts</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE COMPETENCY MODAL */}
      {showAddCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] uppercase">Create New Competency</h3>

            <form onSubmit={handleCreateCompetency} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Competency Name</label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure Architecture"
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Category</label>
                <select
                  value={newCompCategory}
                  onChange={(e) => setNewCompCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  <option value="Technical">Technical</option>
                  <option value="Professional">Professional</option>
                  <option value="Communication">Communication</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Management">Management</option>
                  <option value="Digital">Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={newCompDesc}
                  onChange={(e) => setNewCompDesc(e.target.value)}
                  placeholder="Detailed description of competency expectations and skills."
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompModal(false)}
                  className="px-3 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-secondary)] font-bold border border-[var(--border-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#38BDF8] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                >
                  Create Competency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT TRAINEE PROFILE MODAL */}
      {selectedTrainee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-xl p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)]">{selectedTrainee.fullName}</h3>
                <div className="text-xs text-[var(--text-secondary)]">{selectedTrainee.designation} • {selectedTrainee.department}</div>
              </div>
              <button onClick={() => setSelectedTrainee(null)} className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕ Close</button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="text-xs font-extrabold uppercase text-[var(--text-secondary)]">Designation Skill Gap Matrix</div>
              <div className="space-y-2">
                {(() => {
                  const traineeDesig = designations.find(
                    d => d.name.toLowerCase() === selectedTrainee.designation.toLowerCase() ||
                         d.departmentName.toLowerCase() === selectedTrainee.department.toLowerCase()
                  ) || designations[0];

                  const traineeGaps = calculateDesignationSkillGaps(selectedTrainee.competencies, traineeDesig, competencies);

                  return traineeGaps.map((g) => (
                    <div key={g.competencyId} className="p-3 rounded-[6px] bg-[var(--panel-bg)] border border-[var(--border-main)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{g.competencyName}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          Current: <strong className={g.currentSource === 'Not Assessed' ? 'text-red-400' : 'text-[#38BDF8]'}>{g.currentLevel} ({g.currentNumericLevel}/4)</strong> [{g.currentSource}]
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#FFC400]">Required: {g.requiredLevel} ({g.requiredNumericLevel}/4)</div>
                        <div className="text-[10px] font-extrabold">
                          Gap: <span className={g.gap === 0 ? 'text-[#19B56B]' : 'text-red-500'}>{g.gap} {g.gap === 1 ? 'Level' : 'Levels'}</span> ({g.status})
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>


              {selectedTrainee.certificates.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-extrabold uppercase text-[var(--text-secondary)]">Issued Certificates</div>
                  {selectedTrainee.certificates.map(cert => (
                    <div key={cert.id} className="p-3 rounded-[6px] bg-[#19B56B]/10 border border-[#19B56B] text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{cert.courseName}</div>
                        <div className="text-[10px] text-[#19B56B]">ID: {cert.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#19B56B] text-[#ffffff] font-extrabold text-[10px]">VERIFIED</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] uppercase">Create Department</h3>

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Cybersecurity & Infrastructure"
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Brief description of department scope and operations."
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-3 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-secondary)] font-bold border border-[var(--border-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#FFC400] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DESIGNATION MODAL */}
      {showAddDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] uppercase">Create Designation / Role</h3>

            <form onSubmit={handleCreateDesignation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Designation Name *</label>
                <input
                  type="text"
                  required
                  value={newDesigName}
                  onChange={(e) => setNewDesigName(e.target.value)}
                  placeholder="e.g. Senior Security Analyst"
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Department *</label>
                <select
                  value={newDesigDeptId}
                  onChange={(e) => setNewDesigDeptId(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Role Description</label>
                <textarea
                  value={newDesigDesc}
                  onChange={(e) => setNewDesigDesc(e.target.value)}
                  placeholder="Responsibilities and skill expectations for this designation."
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDesigModal(false)}
                  className="px-3 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-secondary)] font-bold border border-[var(--border-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#38BDF8] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#7dd3fc] cursor-pointer"
                >
                  Create Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESIGNATION REQUIRED COMPETENCIES INSPECTOR & ADD MODAL */}
      {selectedDesigForComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-2xl p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] uppercase">REQUIRED COMPETENCIES: {selectedDesigForComp.name}</h3>
                <div className="text-xs text-[var(--text-secondary)]">Department: <strong className="text-[#FFC400]">{selectedDesigForComp.departmentName}</strong></div>
              </div>
              <button onClick={() => setSelectedDesigForComp(null)} className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕ Close</button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Assigned Requirements ({(selectedDesigForComp.requiredCompetencies || []).length})</span>
              <button
                onClick={() => {
                  if (competencies.length > 0 && !reqCompId) {
                    setReqCompId(competencies[0].id);
                  }
                  setShowAddReqCompModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#FFC400] text-[#111111] text-xs font-extrabold border border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Competency Requirement</span>
              </button>
            </div>

            {/* Required Competencies Table */}
            <div className="overflow-x-auto border-2 border-[var(--border-main)] rounded-[6px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)] bg-[var(--panel-bg)]">
                    <th className="py-2.5 px-3">Competency</th>
                    <th className="py-2.5 px-3">Required Level</th>
                    <th className="py-2.5 px-3">Numeric Scale</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-[var(--border-main)]">
                  {(selectedDesigForComp.requiredCompetencies || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-xs text-[var(--text-secondary)] italic">
                        No competency requirements assigned to this designation yet.
                      </td>
                    </tr>
                  ) : (
                    selectedDesigForComp.requiredCompetencies.map((req) => (
                      <tr key={req.competencyId} className="hover:bg-[var(--panel-bg)]">
                        <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{req.competencyName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-bold border border-[#38BDF8]">
                            {req.requiredLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)]">
                          Level {req.requiredNumericLevel} / 4
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold">
                          <span className={`px-2 py-0.5 rounded border ${
                            req.priority === 'high' ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]' :
                            req.priority === 'medium' ? 'bg-[#FFC400]/15 text-[#FFC400] border-[#FFC400]' :
                            'bg-[var(--panel-bg)] text-[var(--text-secondary)] border-[var(--border-main)]'
                          }`}>
                            {req.priority || 'medium'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleRemoveRequiredCompetency(selectedDesigForComp.id, req.competencyId)}
                            className="p-1.5 rounded bg-[#FF4D4D]/10 text-[#FF4D4D] hover:bg-[#FF4D4D] hover:text-white border border-[#FF4D4D] cursor-pointer transition-colors"
                            title="Remove Requirement"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TELEMETRY & BUG REPORTS TAB */}
      {currentTab === 'feedback' && (
        <div className="space-y-6 font-mono">
          <div>
            <h1 className="text-2xl font-heading font-extrabold uppercase text-[var(--text-primary)] tracking-tight">TELEMETRY & BUG REPORTS</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Review feedback, bug reports, and feature suggestions submitted by trainees, trainers, and users.</p>
          </div>

          <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)]">SUBMITTED FEEDBACK & BUG REPORTS</h3>
              <span className="text-xs text-[var(--text-secondary)]">Live Records</span>
            </div>

            {(() => {
              const rawLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('kuma_feedback_telemetry') : null;
              const localFeedback: Array<{
                id: string;
                type: 'bug' | 'feature';
                subject: string;
                description: string;
                email: string;
                userId: string;
                submittedAt?: string;
                deviceInfo?: { userAgent?: string; screenResolution?: string; viewportSize?: string };
              }> = rawLocal ? JSON.parse(rawLocal) : [];

              if (localFeedback.length === 0) {
                return (
                  <div className="p-8 text-center rounded-[6px] bg-[var(--panel-bg)] border-2 border-dashed border-[var(--border-main)] space-y-2">
                    <MessageSquare size={32} className="mx-auto text-[var(--text-secondary)] opacity-50" />
                    <div className="text-xs font-bold text-[var(--text-primary)] uppercase">No Telemetry Reports Submitted Yet</div>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto">
                      Submissions from the floating Telemetry Widget in the bottom-right corner will appear here automatically.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {localFeedback.map((item) => (
                    <div key={item.id} className="p-4 rounded-[6px] bg-[var(--panel-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            item.type === 'bug' ? 'bg-red-500/15 text-red-500 border-red-500' : 'bg-purple-500/15 text-purple-400 border-purple-500'
                          }`}>
                            {item.type === 'bug' ? 'Bug Report' : 'Feature Request'}
                          </span>
                          <span className="font-extrabold text-[var(--text-primary)]">{item.subject}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)]">{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--card-bg)] p-3 rounded border border-[var(--border-main)]">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-main)]/50">
                        <div>Submitted by: <strong className="text-[var(--text-primary)]">{item.email}</strong> (User ID: {item.userId})</div>
                        {item.deviceInfo?.screenResolution && (
                          <div>Device: {item.deviceInfo.screenResolution} • {item.deviceInfo.viewportSize}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD REQUIRED COMPETENCY TO DESIGNATION FORM MODAL */}
      {showAddReqCompModal && selectedDesigForComp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-md p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] uppercase">Add Competency Requirement</h3>
            <p className="text-xs text-[var(--text-secondary)]">Assign a required competency to <strong>{selectedDesigForComp.name}</strong>.</p>

            <form onSubmit={handleAddRequiredCompetency} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Select Competency *</label>
                <select
                  value={reqCompId}
                  onChange={(e) => setReqCompId(e.target.value)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  {competencies.map((c) => {
                    const alreadyAssigned = (selectedDesigForComp.requiredCompetencies || []).some(r => r.competencyId === c.id);
                    return (
                      <option key={c.id} value={c.id} disabled={alreadyAssigned}>
                        {c.name} ({c.category}){alreadyAssigned ? ' - Already Assigned' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Required Proficiency Level *</label>
                <select
                  value={reqProfLevel}
                  onChange={(e) => setReqProfLevel(e.target.value as SkillProficiencyLevel)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  <option value="Beginner">1 — Beginner</option>
                  <option value="Intermediate">2 — Intermediate</option>
                  <option value="Advanced">3 — Advanced</option>
                  <option value="Expert">4 — Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">Priority Level</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReqCompModal(false)}
                  className="px-3 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-secondary)] font-bold border border-[var(--border-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#FFC400] text-[#111111] font-extrabold border-2 border-[var(--border-main)] shadow-paper-sm hover:bg-[#ffe066] cursor-pointer"
                >
                  Assign Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE COMPETENCY MAPPINGS FOR COURSE MODAL */}
      {showCourseCompModal && selectedCourseForComp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono">
          <div className="w-full max-w-lg p-6 rounded-[12px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-md space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] uppercase">Manage Course Competencies</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Map catalog competencies to <strong>{selectedCourseForComp.courseName}</strong> ({selectedCourseForComp.courseCode}).
                </p>
              </div>
              <button
                onClick={() => setShowCourseCompModal(false)}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Current Mapped Competencies */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)]">Currently Mapped Competencies</label>
              {(selectedCourseForComp.competencyIds && selectedCourseForComp.competencyIds.length > 0) ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedCourseForComp.competencyIds.map((cId, idx) => {
                    const cName = (selectedCourseForComp.competencyNames || [])[idx] || cId;
                    return (
                      <div key={cId} className="flex items-center justify-between p-2.5 rounded bg-[var(--panel-bg)] border border-[var(--border-main)] text-xs font-bold">
                        <span className="text-purple-600 dark:text-purple-400">{cName}</span>
                        <button
                          onClick={() => handleRemoveCompetencyFromCourse(selectedCourseForComp.id, cId)}
                          className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/40 text-[10px] uppercase hover:bg-red-500 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-500 italic font-bold">
                  No competencies currently mapped to this course.
                </div>
              )}
            </div>

            {/* Add New Competency Mapping Form */}
            <div className="border-t border-[var(--border-main)] pt-3 space-y-2 text-xs">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)]">Add Mapped Competency</label>
              <div className="flex gap-2">
                <select
                  value={courseCompToAdd}
                  onChange={(e) => setCourseCompToAdd(e.target.value)}
                  className="flex-1 p-2 rounded border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none"
                >
                  <option value="">-- Select Competency --</option>
                  {competencies.map((c) => {
                    const isMapped = (selectedCourseForComp.competencyIds || []).includes(c.id);
                    return (
                      <option key={c.id} value={c.id} disabled={isMapped}>
                        {c.name} ({c.category}){isMapped ? ' — Mapped' : ''}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  disabled={!courseCompToAdd}
                  onClick={() => {
                    if (courseCompToAdd) {
                      handleAddCompetencyToCourse(selectedCourseForComp.id, courseCompToAdd);
                      setCourseCompToAdd('');
                    }
                  }}
                  className="px-4 py-2 rounded bg-purple-600 text-white font-extrabold text-xs border border-[var(--border-main)] disabled:opacity-50 cursor-pointer"
                >
                  Add Mapping
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCourseCompModal(false)}
                className="px-4 py-2 rounded bg-[var(--panel-bg)] text-[var(--text-primary)] font-bold text-xs border border-[var(--border-main)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

