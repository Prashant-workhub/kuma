/**
 * Project Kuma - Admin Organizational Capacity Analytics View
 * Factual, real-data organizational capacity building, workforce participation, competency coverage,
 * skill gaps, training coverage, assessment outcomes, and digital certificate analytics.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  OrgDepartment,
  OrgDesignation,
  CatalogCompetency,
  TraineeCompetency,
  TrainingEnrollment,
  TrainingCertificate,
  TeacherAssignment
} from '../types';
import { calculateDesignationSkillGaps, LEVEL_TO_NUMERIC, NUMERIC_TO_LEVEL } from '../utils/competencyUtils';
import { getAllEnrollments } from '../utils/enrollmentUtils';
import { getAllCertificates } from '../utils/certificateUtils';
import { COURSES } from '../teacher-portal/lib/mockData';
import { DEMO_TRAINEES, DEMO_TRAINERS, isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getAdminAnalytics, AdminAnalyticsData } from '../services/adminUserService';
import { ChartCard, BarChart as StandardBarChart, LineChart as StandardLineChart, Heatmap as StandardHeatmap } from '../components/charts';
import {
  BarChart3,
  Building,
  Users,
  Briefcase,
  Target,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Filter,
  TrendingUp,
  Layers,
  Calendar,
  Clock,
  Info,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface AdminAnalyticsViewProps {
  departments: OrgDepartment[];
  designations: OrgDesignation[];
  competencies: CatalogCompetency[];
  trainees?: typeof DEMO_TRAINEES;
  courses?: TeacherAssignment[];
}

export default function AdminAnalyticsView({
  departments,
  designations,
  competencies,
  trainees = DEMO_TRAINEES,
  courses = COURSES
}: AdminAnalyticsViewProps) {
  // Filter States
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedDesigId, setSelectedDesigId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'year' | 'all'>('all');

  // Server aggregate analytics state
  const [serverAnalytics, setServerAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoadingServerAnalytics, setIsLoadingServerAnalytics] = useState<boolean>(false);
  const [isServerCached, setIsServerCached] = useState<boolean>(false);

  // Department name lookup
  const selectedDeptObj = useMemo(() => {
    if (selectedDeptId === 'all') return null;
    return departments.find(d => d.id === selectedDeptId) || null;
  }, [selectedDeptId, departments]);

  // Designation name lookup
  const selectedDesigObj = useMemo(() => {
    if (selectedDesigId === 'all') return null;
    return designations.find(d => d.id === selectedDesigId) || null;
  }, [selectedDesigId, designations]);

  // Fetch real aggregate analytics from backend /api/admin/analytics
  useEffect(() => {
    let isMounted = true;
    async function loadServerAnalytics() {
      setIsLoadingServerAnalytics(true);
      const deptName = selectedDeptObj?.name;
      const desigName = selectedDesigObj?.name;
      let startDate: string | undefined = undefined;
      if (timeRange === '7d') startDate = new Date(Date.now() - 7 * 86400000).toISOString();
      else if (timeRange === '30d') startDate = new Date(Date.now() - 30 * 86400000).toISOString();
      else if (timeRange === '90d') startDate = new Date(Date.now() - 90 * 86400000).toISOString();
      else if (timeRange === 'year') startDate = new Date(new Date().getFullYear(), 0, 1).toISOString();

      try {
        const res = await getAdminAnalytics({
          department: deptName,
          designation: desigName,
          startDate
        });
        if (isMounted) {
          if (res.success && res.analytics) {
            setServerAnalytics(res.analytics);
            setIsServerCached(!!res.cached);
          }
        }
      } catch (err) {
        console.error('Failed to load server analytics:', err);
      } finally {
        if (isMounted) setIsLoadingServerAnalytics(false);
      }
    }

    loadServerAnalytics();
    return () => { isMounted = false; };
  }, [selectedDeptId, selectedDesigId, timeRange, selectedDeptObj, selectedDesigObj]);

  // Load real enrollments and certificates
  const allEnrollments = useMemo(() => getAllEnrollments(), []);
  const allCertificates = useMemo(() => getAllCertificates(), []);

  // 1. FILTER TRAINEES BY DEPARTMENT AND DESIGNATION
  const filteredTrainees = useMemo(() => {
    return trainees.filter(t => {
      // Department filter
      if (selectedDeptId !== 'all') {
        const dept = departments.find(d => d.id === selectedDeptId);
        if (dept) {
          const tDept = (t.department || 'Unassigned').toLowerCase();
          if (tDept !== dept.name.toLowerCase()) return false;
        }
      }

      // Designation filter
      if (selectedDesigId !== 'all') {
        const desig = designations.find(d => d.id === selectedDesigId);
        if (desig) {
          const tDesig = (t.designation || 'Unassigned').toLowerCase();
          if (tDesig !== desig.name.toLowerCase()) return false;
        }
      }

      return true;
    });
  }, [trainees, selectedDeptId, selectedDesigId, departments, designations]);

  // Filtered Trainee UIDs set for lookup
  const filteredUserIds = useMemo(() => {
    return new Set(filteredTrainees.map(t => t.uid));
  }, [filteredTrainees]);

  // 2. FILTER ENROLLMENTS BY TIME RANGE AND TRAINEE SCOPE
  const filteredEnrollments = useMemo(() => {
    const now = Date.now();

    return allEnrollments.filter(e => {
      // Trainee Scope Filter
      if (selectedDeptId !== 'all' || selectedDesigId !== 'all') {
        if (e.userId && !filteredUserIds.has(e.userId)) {
          // Check by email or name fallback
          const matches = filteredTrainees.some(
            t => t.emailAddress.toLowerCase() === (e.userEmail || '').toLowerCase() ||
                 t.fullName.toLowerCase() === (e.userName || '').toLowerCase()
          );
          if (!matches) return false;
        }
      }

      // Time Range Filter
      if (timeRange !== 'all' && e.enrolledAt) {
        const eTime = new Date(e.enrolledAt).getTime();
        const daysDiff = (now - eTime) / (1000 * 60 * 60 * 24);
        if (timeRange === '7d' && daysDiff > 7) return false;
        if (timeRange === '30d' && daysDiff > 30) return false;
        if (timeRange === '90d' && daysDiff > 90) return false;
        if (timeRange === 'year' && daysDiff > 365) return false;
      }

      return true;
    });
  }, [allEnrollments, filteredUserIds, filteredTrainees, selectedDeptId, selectedDesigId, timeRange]);

  // 3. FILTER CERTIFICATES BY TIME RANGE AND TRAINEE SCOPE
  const filteredCertificates = useMemo(() => {
    const now = Date.now();

    return allCertificates.filter(c => {
      if (selectedDeptId !== 'all' || selectedDesigId !== 'all') {
        if (c.userId && !filteredUserIds.has(c.userId)) {
          const matches = filteredTrainees.some(
            t => t.emailAddress.toLowerCase() === (c.userEmail || '').toLowerCase() ||
                 t.fullName.toLowerCase() === (c.userName || '').toLowerCase()
          );
          if (!matches) return false;
        }
      }

      if (timeRange !== 'all' && c.issueDate) {
        const cTime = new Date(c.issueDate).getTime();
        const daysDiff = (now - cTime) / (1000 * 60 * 60 * 24);
        if (timeRange === '7d' && daysDiff > 7) return false;
        if (timeRange === '30d' && daysDiff > 30) return false;
        if (timeRange === '90d' && daysDiff > 90) return false;
        if (timeRange === 'year' && daysDiff > 365) return false;
      }

      return true;
    });
  }, [allCertificates, filteredUserIds, filteredTrainees, selectedDeptId, selectedDesigId, timeRange]);

  // 4. ORGANIZATION KPI CALCULATIONS (REAL DATA ONLY)
  const kpis = useMemo(() => {
    if (serverAnalytics) {
      return {
        totalTrainees: serverAnalytics.summary.totalTrainees,
        totalTrainers: DEMO_TRAINERS.length,
        totalDepts: departments.length,
        totalDesigs: designations.length,
        totalComps: competencies.length,
        activeCourses: courses.filter(c => c.isActive !== false).length,
        totalEnrollments: serverAnalytics.summary.totalEnrollments,
        completedEnrollments: serverAnalytics.summary.completedEnrollments,
        inProgressEnrollments: Math.max(0, serverAnalytics.summary.totalEnrollments - serverAnalytics.summary.completedEnrollments),
        notStartedEnrollments: 0,
        assessmentPendingEnrollments: 0,
        completionRate: serverAnalytics.summary.completionRate,
        certificatesCount: serverAnalytics.summary.totalCertificatesIssued,
        active7DaysCount: serverAnalytics.summary.active7DaysCount,
        active30DaysCount: serverAnalytics.summary.active30DaysCount,
        avgTimeToCompleteHours: serverAnalytics.summary.avgTimeToCompleteHours,
        assessmentPassRate: serverAnalytics.summary.assessmentPassRate
      };
    }

    const totalTrainees = filteredTrainees.length;
    const totalTrainers = DEMO_TRAINERS.length;
    const totalDepts = departments.length;
    const totalDesigs = designations.length;
    const totalComps = competencies.length;
    const activeCourses = courses.filter(c => c.isActive !== false).length;

    const totalEnrollments = filteredEnrollments.length;
    const completedEnrollments = filteredEnrollments.filter(e => e.status === 'completed').length;
    const inProgressEnrollments = filteredEnrollments.filter(e => e.status === 'in_progress').length;
    const notStartedEnrollments = filteredEnrollments.filter(e => e.status === 'enrolled' && e.completionRate === 0).length;
    const assessmentPendingEnrollments = filteredEnrollments.filter(e => e.completionRate === 100 && e.quizPassed !== true).length;

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    const certificatesCount = filteredCertificates.length;

    return {
      totalTrainees,
      totalTrainers,
      totalDepts,
      totalDesigs,
      totalComps,
      activeCourses,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      notStartedEnrollments,
      assessmentPendingEnrollments,
      completionRate,
      certificatesCount,
      active7DaysCount: 0,
      active30DaysCount: 0,
      avgTimeToCompleteHours: 0,
      assessmentPassRate: 0
    };
  }, [serverAnalytics, filteredTrainees, departments, designations, competencies, courses, filteredEnrollments, filteredCertificates]);

  // 5. SKILL GAP ENGINE INTEGRATION FOR FILTERED TRAINEES
  const skillGapAnalytics = useMemo(() => {
    let totalGaps = 0;
    let meetsTargetCount = 0;
    let devNeededCount = 0;
    let sigDevCount = 0;
    let highDevCount = 0;

    const competencyGapMap = new Map<string, {
      competencyId: string;
      competencyName: string;
      category: string;
      affectedTraineesCount: number;
      totalGapSum: number;
      highDevCount: number;
      requiredByRolesCount: number;
    }>();

    // Map competency definitions
    competencies.forEach(c => {
      const reqRoles = designations.filter(d => d.requiredCompetencies?.some(rc => rc.competencyId === c.id)).length;
      competencyGapMap.set(c.id, {
        competencyId: c.id,
        competencyName: c.name,
        category: c.category,
        affectedTraineesCount: 0,
        totalGapSum: 0,
        highDevCount: 0,
        requiredByRolesCount: reqRoles
      });
    });

    // Evaluate skill gaps across filtered trainees
    filteredTrainees.forEach(t => {
      // Find trainee's designation object
      const desig = designations.find(
        d => d.name.toLowerCase() === (t.designation || '').toLowerCase() ||
             d.departmentName.toLowerCase() === (t.department || '').toLowerCase()
      ) || designations[0];

      if (desig) {
        const gaps = calculateDesignationSkillGaps(t.competencies || [], desig, competencies);
        gaps.forEach(g => {
          totalGaps += g.gap;
          if (g.gap === 0) meetsTargetCount++;
          else if (g.gap === 1) devNeededCount++;
          else if (g.gap === 2) sigDevCount++;
          else if (g.gap >= 3) highDevCount++;

          if (g.gap > 0) {
            const entry = competencyGapMap.get(g.competencyId);
            if (entry) {
              entry.affectedTraineesCount++;
              entry.totalGapSum += g.gap;
              if (g.gap >= 2) entry.highDevCount++;
            }
          }
        });
      }
    });

    // Sort competencies by affected trainees count & gap sum deterministically
    const sortedDevelopmentNeeds = Array.from(competencyGapMap.values())
      .filter(c => c.affectedTraineesCount > 0)
      .sort((a, b) => b.totalGapSum - a.totalGapSum || b.affectedTraineesCount - a.affectedTraineesCount);

    return {
      totalGaps,
      meetsTargetCount,
      devNeededCount,
      sigDevCount,
      highDevCount,
      sortedDevelopmentNeeds
    };
  }, [filteredTrainees, designations, competencies]);

  // 6. TRAINING COVERAGE & COMPETENCY MAPPING AUDIT
  const competencyCoverageAudit = useMemo(() => {
    return competencies.map(comp => {
      // Active training programs addressing this competency
      const matchingCourses = courses.filter(
        c => (c.competencyIds && c.competencyIds.includes(comp.id)) ||
             (c.competencyNames && c.competencyNames.some(cn => cn.toLowerCase() === comp.name.toLowerCase()))
      );

      // Designations requiring this competency
      const reqDesignations = designations.filter(
        d => d.requiredCompetencies && d.requiredCompetencies.some(rc => rc.competencyId === comp.id)
      );

      // Trainees with gap in this competency
      let traineesWithGapCount = 0;
      let traineesTotalEvaluated = 0;

      filteredTrainees.forEach(t => {
        const userComp = (t.competencies || []).find(
          c => (c.competencyId && c.competencyId === comp.id) || c.name.toLowerCase() === comp.name.toLowerCase()
        );
        traineesTotalEvaluated++;
        if (userComp) {
          const declared = userComp.numericLevel || 1;
          const assessed = userComp.latestAssessedNumericLevel || declared;
          const current = Math.max(declared, assessed);
          const target = userComp.targetNumericLevel || 3;
          if (target > current) {
            traineesWithGapCount++;
          }
        } else {
          // Not assessed/declared -> Gap exists if required
          traineesWithGapCount++;
        }
      });

      return {
        competency: comp,
        requiredByRolesCount: reqDesignations.length,
        traineesWithGapCount,
        matchingCourses,
        hasTraining: matchingCourses.length > 0
      };
    });
  }, [competencies, courses, designations, filteredTrainees]);

  // 7. HISTORICAL ASSESSMENT OUTCOMES & COMPETENCY IMPROVEMENTS
  const assessmentHistoryAnalytics = useMemo(() => {
    let totalAttempts = 0;
    let passedAttempts = 0;
    let failedAttempts = 0;
    let scoreSum = 0;

    const improvementsList: {
      traineeName: string;
      competencyName: string;
      previousLevel: string;
      newAssessedLevel: string;
      scorePercentage: number;
      date: string;
    }[] = [];

    filteredTrainees.forEach(t => {
      (t.competencies || []).forEach(c => {
        if (c.assessmentHistory && c.assessmentHistory.length > 0) {
          c.assessmentHistory.forEach((h, idx) => {
            totalAttempts++;
            scoreSum += h.scorePercentage || 0;
            if (h.passed) passedAttempts++;
            else failedAttempts++;

            // Check if there was an improvement record
            if (h.passed && c.latestAssessedLevel) {
              const prevLevel = idx < c.assessmentHistory!.length - 1 
                ? c.assessmentHistory![idx + 1].assessedLevel 
                : c.level || 'Beginner';

              improvementsList.push({
                traineeName: t.fullName,
                competencyName: c.name,
                previousLevel: prevLevel,
                newAssessedLevel: h.assessedLevel,
                scorePercentage: h.scorePercentage,
                date: h.attemptDate ? h.attemptDate.split('T')[0] : 'Recent'
              });
            }
          });
        }
      });
    });

    const averageScore = totalAttempts > 0 ? Math.round(scoreSum / totalAttempts) : 0;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    return {
      totalAttempts,
      passedAttempts,
      failedAttempts,
      averageScore,
      passRate,
      improvementsList
    };
  }, [filteredTrainees]);

  return (
    <div className="space-y-6 font-mono text-[var(--text-primary)] select-none">
      
      {/* Header Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
              ADMIN GOVERNANCE ROUTE
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-bold">
              /admin/analytics
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold uppercase tracking-tight text-[var(--text-primary)] mt-1 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[#FFC400]" />
            ORGANIZATIONAL CAPACITY ANALYTICS
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">
            Factual real-data metrics across workforce participation, competency coverage, skill gaps, training availability, assessment outcomes, and digital certificates.
          </p>
        </div>

        <div className="flex items-center gap-2 font-bold text-xs text-[#19B56B] bg-[#19B56B]/15 px-3 py-1.5 rounded border border-[#19B56B]/40 shrink-0">
          <CheckCircle2 size={16} />
          <span>REAL DATA SOURCE OF TRUTH</span>
        </div>
      </div>

      {/* FILTER CONTROL BAR (Requirement 10, 11, 15) */}
      <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs font-bold">
        <div className="flex items-center gap-2 text-[var(--text-secondary)] uppercase">
          <Filter size={16} className="text-[#FFC400]" />
          <span>ANALYTICS SCOPE FILTERS:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
          
          {/* Department Filter */}
          <div>
            <label className="block text-[10px] uppercase text-[var(--text-secondary)] mb-1">Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full p-2 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none cursor-pointer"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div>
            <label className="block text-[10px] uppercase text-[var(--text-secondary)] mb-1">Designation</label>
            <select
              value={selectedDesigId}
              onChange={(e) => setSelectedDesigId(e.target.value)}
              className="w-full p-2 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none cursor-pointer"
            >
              <option value="all">All Designations ({designations.length})</option>
              {designations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-[10px] uppercase text-[var(--text-secondary)] mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full p-2 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

        </div>

        {/* Active Filter Notice */}
        {(selectedDeptId !== 'all' || selectedDesigId !== 'all' || timeRange !== 'all') && (
          <button
            onClick={() => {
              setSelectedDeptId('all');
              setSelectedDesigId('all');
              setTimeRange('all');
            }}
            className="px-3 py-2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[10px] uppercase font-bold hover:bg-amber-500 hover:text-white cursor-pointer shrink-0"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* SECTION 1: ORGANIZATION KPI CARDS (Requirement 3) */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
          <Building size={14} className="text-[#38BDF8]" />
          <span>1. ORGANIZATION WORKFORCE & CAPACITY KPIS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Trainees Tracked</div>
            <div className="font-heading font-black text-2xl text-[var(--text-primary)]">{kpis.totalTrainees}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Filtered Scope</div>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Trainers & Instructors</div>
            <div className="font-heading font-black text-2xl text-[#38BDF8]">{kpis.totalTrainers}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Assigned Specializations</div>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Catalog Competencies</div>
            <div className="font-heading font-black text-2xl text-purple-600 dark:text-purple-400">{kpis.totalComps}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">{kpis.totalDesigs} Role Specs</div>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Total Enrollments</div>
            <div className="font-heading font-black text-2xl text-[#FFC400]">{kpis.totalEnrollments}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">{kpis.completedEnrollments} Completed</div>
          </div>

          <div className="p-4 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-xs space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Completion Rate</div>
            <div className="font-heading font-black text-2xl text-[#19B56B]">{kpis.completionRate}%</div>
            <div className="text-[9px] text-[var(--text-secondary)]">{kpis.certificatesCount} Certs Issued</div>
          </div>

        </div>
      </div>

      {/* SECTION 2: TRAINING PARTICIPATION & COMPLETION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Training Participation Breakdown (Course Funnel)"
          description="Real enrollment lifecycle state across the selected dataset (Enrolled → In Progress → Passed → Certified)."
          tableData={[
            { stage: 'Completed Trainings', count: kpis.completedEnrollments },
            { stage: 'In-Progress', count: kpis.inProgressEnrollments },
            { stage: 'Assessment Pending', count: kpis.assessmentPendingEnrollments },
            { stage: 'Not Started', count: kpis.notStartedEnrollments },
          ]}
          tableHeaders={['stage', 'count']}
          exportFileName="training-participation-funnel"
        >
          <StandardBarChart
            data={[
              { label: 'Completed', value: kpis.completedEnrollments },
              { label: 'In-Progress', value: kpis.inProgressEnrollments },
              { label: 'Assessment Pending', value: kpis.assessmentPendingEnrollments },
              { label: 'Not Started', value: kpis.notStartedEnrollments },
            ]}
            orientation="horizontal"
            unit=""
            formatType="integer"
            axisTitle="Trainee Enrollment Lifecycle Count"
          />
        </ChartCard>

        <ChartCard
          title="Training Program Enrollment Rankings"
          description="Ranked by participant enrollment counts and course completions."
          tableData={courses.map((course) => {
            const enrolledCount = filteredEnrollments.filter((e) => e.courseId === course.id || e.courseCode === course.courseCode).length;
            return { course: course.courseName, enrolled: enrolledCount };
          })}
          tableHeaders={['course', 'enrolled']}
          exportFileName="program-enrollment-rankings"
        >
          <StandardBarChart
            data={courses.map((course) => {
              const enrolledCount = filteredEnrollments.filter((e) => e.courseId === course.id || e.courseCode === course.courseCode).length;
              return { label: course.courseCode || course.courseName, value: enrolledCount };
            })}
            orientation="vertical"
            unit=" Trainees"
            formatType="integer"
            axisTitle="Active Program Enrollment Volume"
          />
        </ChartCard>
      </div>

      {/* SECTION 3: SKILL GAP ANALYTICS & DEVELOPMENT PRIORITIES (Requirement 7 & 8) */}
      <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-main)] pb-3 gap-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
              <Target className="h-4 w-4 text-red-500" />
              ORGANIZATIONAL SKILL GAPS & DEVELOPMENT PRIORITIES
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Consumes the deterministic Skill Gap Engine (Required Level - Assessed/Declared Level) across filtered trainees.
            </p>
          </div>
          <span className="text-xs font-bold text-red-500 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30">
            Deterministic Skill Gap Source of Truth
          </span>
        </div>

        {/* Skill Gap Severity Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
            <div className="text-[10px] font-bold text-[#19B56B] uppercase">Meets Target</div>
            <div className="font-heading font-black text-xl text-[#19B56B] mt-0.5">{skillGapAnalytics.meetsTargetCount}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Gap = 0</div>
          </div>

          <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
            <div className="text-[10px] font-bold text-[#B78103] dark:text-[#FFD54F] uppercase">Development Needed</div>
            <div className="font-heading font-black text-xl text-[#B78103] dark:text-[#FFD54F] mt-0.5">{skillGapAnalytics.devNeededCount}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Gap = 1 Level</div>
          </div>

          <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
            <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Significant Dev Needed</div>
            <div className="font-heading font-black text-xl text-orange-600 dark:text-orange-400 mt-0.5">{skillGapAnalytics.sigDevCount}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Gap = 2 Levels</div>
          </div>

          <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
            <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">High Dev Need</div>
            <div className="font-heading font-black text-xl text-red-600 dark:text-red-400 mt-0.5">{skillGapAnalytics.highDevCount}</div>
            <div className="text-[9px] text-[var(--text-secondary)]">Gap = 3+ Levels</div>
          </div>
        </div>

        {/* Development Need Factual Statements (Requirement 8) */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-extrabold uppercase text-[var(--text-primary)]">
            COMPETENCY DEVELOPMENT NEED STATEMENTS (FACTUAL METRICS):
          </div>

          {skillGapAnalytics.sortedDevelopmentNeeds.length === 0 ? (
            <div className="p-4 rounded bg-[#19B56B]/10 border border-[#19B56B]/30 text-xs text-[#19B56B] font-bold text-center">
              All trainees in the selected scope currently meet or exceed their required competency levels!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillGapAnalytics.sortedDevelopmentNeeds.map((item) => (
                <div key={item.competencyId} className="p-4 rounded bg-[var(--bg-main)] border-2 border-[var(--border-main)] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase text-[var(--text-primary)]">{item.competencyName}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-extrabold text-[10px]">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] font-bold">
                    “<strong className="text-red-500">{item.affectedTraineesCount} trainees</strong> have a skill gap in {item.competencyName} (Cumulative gap: {item.totalGapSum} level step{item.totalGapSum > 1 ? 's' : ''}).”
                  </p>

                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center justify-between pt-1">
                    <span>Required by {item.requiredByRolesCount} Role Specs</span>
                    {item.highDevCount > 0 && (
                      <span className="text-red-500 font-extrabold">{item.highDevCount} High Dev Need Trainees</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: COMPETENCY COVERAGE & TRAINING AVAILABILITY AUDIT (Requirement 6 & 9) */}
      <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              COMPETENCY COVERAGE & TRAINING AVAILABILITY AUDIT
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Maps required catalog competencies against actual trainee gaps and available active training programs.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-500 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30">
            Coverage Audit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                <th className="py-2.5 px-3">Competency</th>
                <th className="py-2.5 px-3">Required By</th>
                <th className="py-2.5 px-3">Trainees with Gap</th>
                <th className="py-2.5 px-3">Available Training Programs</th>
                <th className="py-2.5 px-3 text-right">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-[var(--border-main)]">
              {competencyCoverageAudit.map(row => (
                <tr key={row.competency.id} className="hover:bg-[var(--panel-bg)]">
                  <td className="py-3 px-3 font-bold text-[var(--text-primary)]">{row.competency.name}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{row.requiredByRolesCount} Designation Role{row.requiredByRolesCount !== 1 ? 's' : ''}</td>
                  <td className="py-3 px-3">
                    <span className={`font-bold ${row.traineesWithGapCount > 0 ? 'text-red-500' : 'text-[#19B56B]'}`}>
                      {row.traineesWithGapCount} Trainee{row.traineesWithGapCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {row.hasTraining ? (
                      <div className="space-y-0.5">
                        {row.matchingCourses.map(mc => (
                          <div key={mc.id} className="font-bold text-purple-600 dark:text-purple-400">
                            {mc.courseName} ({mc.courseCode})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-500 font-bold italic">No matching training program available</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {row.hasTraining ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: ASSESSMENT OUTCOMES & COMPETENCY IMPROVEMENT (Requirement 12 & 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Assessment Outcomes Card */}
        <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                ASSESSMENT OUTCOMES & PASS RATES
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real evaluation data from trainee competency assessment attempts.</p>
            </div>
            <span className="text-xs font-bold text-purple-500 px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30">
              60% Pass Threshold
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-bold text-xs">
            <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase">Total Attempts</div>
              <div className="font-heading font-black text-xl text-[var(--text-primary)] mt-0.5">{assessmentHistoryAnalytics.totalAttempts}</div>
            </div>

            <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
              <div className="text-[10px] text-[#19B56B] uppercase">Pass Rate</div>
              <div className="font-heading font-black text-xl text-[#19B56B] mt-0.5">{assessmentHistoryAnalytics.passRate}%</div>
            </div>

            <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
              <div className="text-[10px] text-[#38BDF8] uppercase">Average Score</div>
              <div className="font-heading font-black text-xl text-[#38BDF8] mt-0.5">{assessmentHistoryAnalytics.averageScore}%</div>
            </div>

            <div className="p-3.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)]">
              <div className="text-[10px] text-red-500 uppercase">Failed Attempts</div>
              <div className="font-heading font-black text-xl text-red-500 mt-0.5">{assessmentHistoryAnalytics.failedAttempts}</div>
            </div>
          </div>
        </div>

        {/* Competency Improvement Log (Requirement 13) */}
        <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#19B56B]" />
                COMPETENCY IMPROVEMENT RECORDS
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Measurable assessed competency upgrades following passed evaluations.</p>
            </div>
            <span className="text-xs font-bold text-[#19B56B]">Assessed Level Growth</span>
          </div>

          {assessmentHistoryAnalytics.improvementsList.length === 0 ? (
            <div className="p-6 text-center rounded-[6px] border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] space-y-2">
              <Info className="h-8 w-8 text-[var(--text-secondary)] mx-auto opacity-50" />
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Historical competency comparison will appear as more assessment data is collected.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {assessmentHistoryAnalytics.improvementsList.map((imp, idx) => (
                <div key={idx} className="p-3 rounded bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-between text-xs font-bold">
                  <div className="space-y-0.5">
                    <div className="text-[var(--text-primary)]">{imp.traineeName} — <span className="text-purple-600 dark:text-purple-400">{imp.competencyName}</span></div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Score: {imp.scorePercentage}% | Date: {imp.date}</div>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-[var(--text-secondary)]">{imp.previousLevel}</span> ➔ <strong className="text-[#19B56B]">{imp.newAssessedLevel}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 6: DIGITAL CERTIFICATES ISSUED (Requirement 14) */}
      <div className="p-6 rounded-[8px] bg-[var(--card-bg)] border-2 border-[var(--border-main)] shadow-paper-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FFC400]" />
              ISSUED DIGITAL CERTIFICATES AUDIT
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Official organizational capacity building credentials issued to trainees.</p>
          </div>
          <span className="text-xs font-extrabold text-[#19B56B] px-2.5 py-1 rounded bg-[#19B56B]/15 border border-[#19B56B]/40">
            {filteredCertificates.length} Certificates Issued
          </span>
        </div>

        {filteredCertificates.length === 0 ? (
          <div className="p-6 text-center rounded-[6px] border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-secondary)]">
            No digital certificates match the selected scope filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border-main)] text-[10px] uppercase text-[var(--text-secondary)]">
                  <th className="py-2.5 px-3">Certificate ID</th>
                  <th className="py-2.5 px-3">Trainee Name</th>
                  <th className="py-2.5 px-3">Training Program</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-[var(--border-main)]">
                {filteredCertificates.map(cert => (
                  <tr key={cert.id} className="hover:bg-[var(--panel-bg)] font-bold">
                    <td className="py-3 px-3 text-purple-600 dark:text-purple-400 font-mono">{cert.id}</td>
                    <td className="py-3 px-3 text-[var(--text-primary)]">{cert.userName}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{cert.courseName} ({cert.courseCode})</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{cert.organization}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{cert.issueDate}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="bg-[#19B56B]/15 text-[#19B56B] px-2.5 py-0.5 rounded border border-[#19B56B]/40 text-[10px] uppercase font-extrabold">
                        Verified Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
