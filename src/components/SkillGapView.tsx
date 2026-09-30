/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { UserSettings, TraineeCompetency, SkillProficiencyLevel, RoleSkillGapRecord, TrainingCertificate, TrainingEnrollment, Quiz, TeacherAssignment } from '../types';
import TrainingLifecycleModal from './TrainingLifecycleModal';
import CertificateModal from './CertificateModal';
import {
  calculateSkillGap,
  calculateDesignationSkillGaps,
  LEVEL_TO_NUMERIC,
  NUMERIC_TO_LEVEL,
  GapPriority,
  GapStatus
} from '../utils/competencyUtils';
import { DEMO_ORG_DESIGNATIONS_FULL, isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getTrainingRecommendations } from '../utils/recommendationUtils';
import { enrollInCourse, updateEnrollmentProgress } from '../utils/enrollmentUtils';
import { getAvailableCourses } from '../services/courseProvider';
import { useRequiredCompetencies } from '../hooks/useRequiredCompetencies';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { subscribePublishedPrograms, subscribeTraineeEnrollments } from '../services/capacityConnectService';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { cn } from '../teacher-portal/lib/cn';
import {
  LevelBlocks,
  SectionHeading,
  TraineeButton,
  TraineeCard,
  TraineeChip,
  TraineeKpi,
  TraineeEmptyState,
  CategoryPill,
  type Accent,
} from './trainee/TraineeUI';

import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Clock,
  PlayCircle,
  Layers,
  Info
} from 'lucide-react';

interface SkillGapViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
  onTakeAssessment?: (quiz: Quiz) => void;
  onViewCertificate?: (cert: TrainingCertificate) => void;
}

const PROFICIENCY_LEVELS: SkillProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

/** Status and priority are surfaced with the shared accent system. */
const STATUS_ACCENT: Record<GapStatus, Accent> = {
  'Meets Target': 'emerald',
  'Development Needed': 'gold',
  'Significant Development Needed': 'violet',
  'High Development Need': 'rose',
};

/** `Low` is intentionally neutral, so it has no accent and renders muted. */
const PRIORITY_ACCENT: Partial<Record<GapPriority, Accent>> = {
  Medium: 'gold',
  High: 'violet',
  Critical: 'rose',
};

export default function SkillGapView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme,
  onTakeAssessment,
  onViewCertificate
}: SkillGapViewProps) {
  const traineeId = settings.profile.uid || '';
  const isDemoTrainee = isDemoTraineeIdentity(traineeId, settings.profile.emailAddress);
  const [competencies, setCompetencies] = useState<TraineeCompetency[]>(
    settings.profile.competencies || []
  );
  const [trainingPrograms, setTrainingPrograms] = useState<TeacherAssignment[]>(() => isDemoTrainee ? getAvailableCourses() : []);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>(() =>
    isDemoTrainee ? getUserEnrollments(settings.profile.emailAddress) : []
  );
  const [trainingLoading, setTrainingLoading] = useState(!isDemoTrainee);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // Training Program Lifecycle & Certificate Modal States
  const [selectedCourseForLifecycle, setSelectedCourseForLifecycle] = useState<TeacherAssignment | null>(null);
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<TrainingCertificate | null>(null);

  useEffect(() => {
    if (isDemoTrainee) {
      setTrainingPrograms(getAvailableCourses());
      setTrainingLoading(false);
      setTrainingError(null);
      return;
    }
    if (!traineeId) {
      setTrainingPrograms([]);
      setEnrollments([]);
      setTrainingLoading(false);
      return;
    }
    const organization = settings.profile.organization || settings.profile.institution || '';
    setTrainingLoading(true);
    setTrainingError(null);
    let unsubProg: (() => void) | undefined;
    let unsubEnr: (() => void) | undefined;
    try {
      unsubProg = subscribePublishedPrograms(
        organization,
        (programs) => {
          setTrainingPrograms(programs);
          setTrainingLoading(false);
        },
        (error) => {
          console.error('[SkillGap] Published programs subscription failed:', error);
          setTrainingError('Unable to load published training programs. Check your connection and try again.');
          setTrainingLoading(false);
        }
      );
      unsubEnr = subscribeTraineeEnrollments(
        traineeId,
        setEnrollments,
        (error) => {
          console.error('[SkillGap] Enrollment subscription failed:', error);
          setTrainingError('Unable to load your enrollments. Check your connection and try again.');
        }
      );
    } catch (err) {
      console.warn('[SkillGap] Subscription setup notice:', err);
      setTrainingLoading(false);
    }
    return () => {
      if (unsubProg) unsubProg();
      if (unsubEnr) unsubEnr();
    };
  }, [traineeId, settings.profile.organization, settings.profile.institution, settings.profile.emailAddress, isDemoTrainee]);

  const handleUpdateTargetLevel = (id: string, newTargetLevel: SkillProficiencyLevel) => {
    const updated = competencies.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        targetLevel: newTargetLevel,
        targetNumericLevel: LEVEL_TO_NUMERIC[newTargetLevel]
      };
    });

    setCompetencies(updated);

    const updatedSettings: UserSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        competencies: updated
      }
    };
    onUpdateSettings(updatedSettings);
  };

  // Find trainee's organizational designation
  const traineeDesignation = useMemo(() => {
    const desigName = (settings.profile.designation || '').toLowerCase().trim();
    const deptName = (settings.profile.department || '').toLowerCase().trim();

    const matched = DEMO_ORG_DESIGNATIONS_FULL.find(
      (d) => (desigName && d.name.toLowerCase() === desigName) ||
        (deptName && d.departmentName.toLowerCase() === deptName)
    );

    if (matched) return matched;

    // Return clean user designation fallback (never return null)
    return {
      id: `custom-desig-${desigName || 'trainee'}`,
      name: settings.profile.designation || 'Trainee Designation',
      departmentId: 'dept-custom',
      departmentName: settings.profile.department || 'Capacity Building Unit',
      isActive: true,
      requiredCompetencies: []
    };
  }, [settings.profile.designation, settings.profile.department]);

  const { designation: firestoreDesignation } = useRequiredCompetencies(settings.profile);

  const activeDesignation = useMemo(() => {
    if (firestoreDesignation && firestoreDesignation.requiredCompetencies && firestoreDesignation.requiredCompetencies.length > 0) {
      return firestoreDesignation;
    }
    return traineeDesignation;
  }, [firestoreDesignation, traineeDesignation]);

  // Dynamic Designation Skill Gap Calculations
  const designationGaps = useMemo(() => {
    return calculateDesignationSkillGaps(competencies, activeDesignation, INITIAL_COMPETENCY_CATALOG);
  }, [competencies, activeDesignation]);

  const totalCompetencies = designationGaps.length;
  const meetingTargetCount = designationGaps.filter((g) => g.gap === 0).length;
  const devNeededCount = designationGaps.filter((g) => g.gap === 1).length;
  const sigDevCount = designationGaps.filter((g) => g.gap === 2).length;
  const highDevCount = designationGaps.filter((g) => g.gap >= 3).length;

  // Domain Category Heatmap Breakdown
  const categoryBreakdown = useMemo(() => {
    const groups: Record<string, { total: number; met: number; currentSum: number; targetSum: number }> = {};
    designationGaps.forEach((g) => {
      const cat = g.category || 'Technical';
      if (!groups[cat]) groups[cat] = { total: 0, met: 0, currentSum: 0, targetSum: 0 };
      groups[cat].total += 1;
      if (g.gap === 0) groups[cat].met += 1;
      groups[cat].currentSum += g.currentNumericLevel;
      groups[cat].targetSum += g.requiredNumericLevel;
    });
    return Object.entries(groups).map(([category, stats]) => ({
      category,
      ...stats,
      pct: stats.targetSum > 0 ? Math.min(100, Math.round((stats.currentSum / stats.targetSum) * 100)) : 0,
    }));
  }, [designationGaps]);


  // Recommendation Engine execution against Trainee Designation Skill Gaps
  const availableCourses = useMemo(() => {
    return trainingPrograms.length > 0 ? trainingPrograms : getAvailableCourses();
  }, [trainingPrograms]);

  const { recommendedCourses, unmatchedGaps, activeGaps } = getTrainingRecommendations(
    competencies,
    availableCourses,
    [],
    INITIAL_COMPETENCY_CATALOG,
    Object.fromEntries(enrollments.map((enrollment) => [enrollment.courseId, {
      completionRate: enrollment.completionRate,
      status: enrollment.status === 'enrolled' ? 'not_started' : enrollment.status
    }])),
    activeDesignation
  );

  const refreshDemoEnrollments = () => {
    if (isDemoTrainee) setEnrollments(getUserEnrollments(settings.profile.emailAddress));
  };

  return (
    <div className="mx-auto max-w-6xl select-none space-y-8 p-4 md:p-8">

      {/* Header Banner */}
      <div className="space-y-1.5">
        <button
          onClick={() => setActivePage('dashboard')}
          className="mb-1 flex cursor-pointer items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-faint transition-colors hover:text-brand-cyan"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to dashboard</span>
        </button>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          <Target className="h-6 w-6 text-brand-gold" />
          Skill gap analysis
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Deterministic gap analysis measuring current assessed/declared competency levels against target proficiency levels.
        </p>
      </div>

      {/* GAP SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <TraineeKpi
          label="Tracked"
          value={totalCompetencies}
          icon={<Layers size={18} />}
          accent="cyan"
          hint="Total competencies"
        />
        <TraineeKpi
          label="Meets target"
          value={meetingTargetCount}
          icon={<CheckCircle2 size={18} />}
          accent="emerald"
          hint="Gap = 0"
        />
        <TraineeKpi
          label="Development needed"
          value={devNeededCount}
          icon={<AlertCircle size={18} />}
          accent="gold"
          hint="Gap = 1"
        />
        <TraineeKpi
          label="Significant dev"
          value={sigDevCount}
          icon={<ShieldAlert size={18} />}
          accent="violet"
          hint="Gap = 2"
        />
        <TraineeKpi
          label="High dev need"
          value={highDevCount}
          icon={<AlertTriangle size={18} />}
          accent="rose"
          hint="Gap = 3"
        />
      </div>

      {/* DETAILED SKILL GAP ANALYSIS TABLE / CARDS */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Competency matrix"
          title="Skill gap matrix"
          icon={<TrendingUp size={18} />}
          subtitle="Deterministic rule-based evaluation of your designation requirements."
          action={
            <TraineeButton
              variant="secondary"
              size="sm"
              onClick={() => setActivePage('profile')}
              className="shrink-0"
            >
              View profile competencies
            </TraineeButton>
          }
        />

        {/* Trainee Designation Badge Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-panel px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              Designation
            </span>
            <span className="font-semibold text-brand-gold">{traineeDesignation?.name || 'Trainee Designation'}</span>
            <span className="text-muted">({traineeDesignation?.departmentName || 'Capacity Building Unit'})</span>
          </div>
          <span className="text-xs text-faint">
            Required competencies specified by organization
          </span>
        </div>

        {/* Category Proficiency Heatmap */}
        {categoryBreakdown.length > 0 && (
          <TraineeCard className="space-y-4 border-t-2 border-t-brand-cyan">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Layers size={16} className="text-brand-cyan" />
                Domain Proficiency Heatmap
              </div>
              <span className="text-xs text-muted font-mono">{categoryBreakdown.length} Skill Domains Tracked</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-line bg-panel/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <CategoryPill category={cat.category} />
                    <span className="font-mono text-xs font-extrabold text-ink">{cat.pct}% Target Match</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.pct >= 100 ? 'bg-emerald-400' : cat.pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(100, cat.pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-faint font-mono">
                    <span>{cat.met} of {cat.total} targets met</span>
                    <span>Score: {cat.currentSum}/{cat.targetSum} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </TraineeCard>
        )}

        {designationGaps.length === 0 ? (
          <TraineeEmptyState
            icon={<CheckCircle2 size={20} />}
            title="No skill gaps identified yet"
            description="Add competencies to your profile or select training programs to calculate skill gaps."
          />
        ) : (
          <div className="space-y-3">
            {designationGaps.map((rec) => {
              const statusAccent = STATUS_ACCENT[rec.status];
              const priorityAccent = PRIORITY_ACCENT[rec.priority];
              const gapAccent: Accent = rec.gap === 0 ? 'emerald' : rec.gap === 1 ? 'gold' : 'rose';

              return (
                <TraineeCard key={rec.competencyId} className="space-y-4">
                  {/* Top Line: Competency Name & Badges */}
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">{rec.competencyName}</h3>
                      {rec.category && (
                        <TraineeChip accent="cyan" className="uppercase tracking-wide">
                          {rec.category}
                        </TraineeChip>
                      )}
                    </div>

                    {/* Status & Priority Badges */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:self-center">
                      <TraineeChip accent={statusAccent}>{rec.status}</TraineeChip>
                      {priorityAccent ? (
                        <TraineeChip accent={priorityAccent}>Priority: {rec.priority}</TraineeChip>
                      ) : (
                        <span className="rounded-lg border border-line bg-panel px-2 py-0.5 text-[11px] font-medium text-muted">
                          Priority: {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matrix Columns: CURRENT LEVEL | REQUIRED LEVEL | CALCULATED GAP */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                    {/* 1. CURRENT LEVEL (Assessed Preferred, Declared Fallback, 0 Not Assessed) */}
                    <div className="space-y-2 rounded-2xl border border-line bg-panel p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                          Current level
                        </span>
                        <TraineeChip
                          accent={
                            rec.currentSource === 'Assessed'
                              ? 'emerald'
                              : rec.currentSource === 'Declared'
                                ? 'cyan'
                                : 'rose'
                          }
                        >
                          {rec.currentSource === 'Assessed' ? 'Assessed' : rec.currentSource === 'Declared' ? 'Declared' : 'Not assessed'}
                        </TraineeChip>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <LevelBlocks
                          level={rec.currentNumericLevel}
                          accent={rec.currentNumericLevel === 0 ? 'rose' : undefined}
                        />
                        <span className="text-sm font-medium text-ink">{rec.currentLevel}</span>
                      </div>
                    </div>

                    {/* 2. REQUIRED LEVEL (From Designation Role) */}
                    <div className="space-y-2 rounded-2xl border border-line bg-panel p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                          Required level (role)
                        </span>
                        <span className="text-[11px] text-faint">Role spec</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <LevelBlocks level={rec.requiredNumericLevel} accent="violet" />
                        <span className="text-sm font-medium text-brand-violet">
                          {rec.requiredLevel}
                        </span>
                      </div>
                    </div>

                    {/* 3. SKILL GAP */}
                    <div className="space-y-2 rounded-2xl border border-line bg-panel p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                          Skill gap
                        </span>
                        <span className="text-[11px] text-faint">Required − current</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-xl font-semibold tabular-nums',
                            gapAccent === 'emerald' && 'text-brand-emerald',
                            gapAccent === 'gold' && 'text-brand-gold',
                            gapAccent === 'rose' && 'text-brand-rose',
                          )}
                        >
                          {rec.gap} {rec.gap === 1 ? 'level' : 'levels'}
                        </span>
                        <span className="text-[11px] text-muted">
                          {rec.gap === 0 ? 'Meets target' : `Needs +${rec.gap} level step`}
                        </span>
                      </div>
                    </div>

                  </div>
                </TraineeCard>
              );
            })}
          </div>
        )}
      </section>

      {/* PHASE 3E: RECOMMENDED TRAINING SECTION */}
      <section className="space-y-4">
        <SectionHeading
          eyebrow="Recommendation system"
          title="Recommended training & learning material"
          icon={<GraduationCap size={18} />}
          subtitle="Targeted training programs dynamically mapped to your identified skill gaps."
        />

        {trainingLoading ? (
          <div className="rounded-xl border border-line bg-panel p-8 text-center text-sm text-muted">Loading published programs and enrollment…</div>
        ) : trainingError ? (
          <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{trainingError}</div>
        ) : recommendedCourses.length === 0 && activeGaps.length > 0 && trainingPrograms.length === 0 ? (
          <TraineeEmptyState
            icon={<BookOpen size={20} />}
            title="No published training programs"
            description="There are no published programs for your organization that address these competency gaps yet."
          />
        ) : recommendedCourses.length === 0 ? (
          <TraineeEmptyState
            icon={<CheckCircle2 size={20} />}
            title="No active skill gaps requiring training"
            description="You currently meet or exceed all target levels for your tracked competencies! Adjust target levels above or take new assessments to discover training recommendations."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recommendedCourses.map((rec) => (
              <TraineeCard key={rec.id} hover className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">

                  {/* Top Bar: Course Code, Duration, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TraineeChip accent="violet" className="font-mono uppercase">
                        {rec.course.courseCode}
                      </TraineeChip>
                      {rec.course.duration && (
                        <span className="flex items-center gap-1 text-[11px] text-faint">
                          <Clock className="h-3 w-3" />
                          {rec.course.duration}
                        </span>
                      )}
                    </div>

                    {rec.enrollmentStatus === 'in_progress' ? (
                      <TraineeChip accent="gold" className="font-mono uppercase">
                        In progress ({rec.progressPercentage}%)
                      </TraineeChip>
                    ) : (
                      <TraineeChip accent="emerald" className="font-mono uppercase">
                        Recommended
                      </TraineeChip>
                    )}
                  </div>

                  {/* Course Name */}
                  <div>
                    <h3 className="text-base font-semibold leading-snug text-ink">
                      {rec.course.courseName}
                    </h3>
                    {rec.course.description && (
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {rec.course.description}
                      </p>
                    )}
                  </div>

                  {/* SKILL GAP TO TRAINING CONNECTION BANNER */}
                  <div className="space-y-1.5 rounded-2xl border border-line bg-panel p-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-brand-violet">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Skill gap → competency → recommendation</span>
                    </div>

                    <p className="text-sm font-medium text-ink">{rec.reason}</p>

                    {/* Matched Competencies Breakdown */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.matchedGaps.map((mg) => (
                        <div
                          key={mg.competencyId}
                          className="flex items-center gap-1 rounded-lg border border-line bg-card px-2 py-0.5 text-[11px] text-ink"
                        >
                          <span>{mg.competencyName}:</span>
                          <span className="font-medium text-brand-gold">{mg.currentLevel}</span>
                          <span className="text-faint">→</span>
                          <span className="font-medium text-brand-violet">{mg.targetLevel}</span>
                          <span className="font-medium text-brand-rose">(Gap: {mg.gap})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Action Area */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <div className="text-[11px] text-faint">
                    Max gap addressed:{' '}
                    <span className="font-medium text-brand-rose">
                      {rec.maxGap} level{rec.maxGap > 1 ? 's' : ''}
                    </span>
                  </div>

                  <TraineeButton
                    variant={rec.enrollmentStatus === 'in_progress' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => {
                      setSelectedCourseForLifecycle(rec.course);
                      setShowLifecycleModal(true);
                    }}
                    iconLeft={
                      rec.enrollmentStatus === 'in_progress' ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )
                    }
                  >
                    {rec.enrollmentStatus === 'in_progress'
                      ? 'Continue training'
                      : 'Enroll & view lifecycle'}
                  </TraineeButton>
                </div>

              </TraineeCard>
            ))}
          </div>
        )}

        {/* UNMATCHED SKILL GAPS - NO TRAINING AVAILABLE CASE */}
        {unmatchedGaps.length > 0 && (
          <div className="space-y-3">
            <SectionHeading
              eyebrow={`${unmatchedGaps.length} uncovered`}
              title="Training coverage gaps"
              icon={<AlertTriangle size={18} />}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {unmatchedGaps.map((gap) => (
                <div
                  key={gap.competencyId}
                  className="space-y-2 rounded-2xl border border-brand-gold/30 bg-brand-gold/10 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {gap.competencyName}
                    </span>
                    <TraineeChip accent="gold" className="uppercase">
                      Training coverage gap
                    </TraineeChip>
                  </div>

                  <div className="text-[11px] text-muted">
                    Current: <span className="text-ink">{gap.currentLevel}</span> → Required:{' '}
                    <span className="text-brand-violet">{gap.requiredLevel}</span> (Gap: {gap.gap})
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-brand-gold/30 bg-card px-3 py-2.5 text-[11px] font-medium text-brand-gold">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>No matching training program is currently available for this competency.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* TRAINING PROGRAM LIFECYCLE MODAL */}
      {showLifecycleModal && selectedCourseForLifecycle && (
        <TrainingLifecycleModal
          isOpen={showLifecycleModal}
          onClose={() => setShowLifecycleModal(false)}
          course={selectedCourseForLifecycle}
          settings={settings}
          onEnrollmentUpdated={refreshDemoEnrollments}
          onUpdateSettings={onUpdateSettings}
          onTakeAssessment={(quiz) => {
            if (onTakeAssessment) {
              onTakeAssessment(quiz);
            }
          }}
          onViewCertificate={(cert) => {
            if (onViewCertificate) {
              onViewCertificate(cert);
            } else {
              setSelectedCertForModal(cert);
            }
          }}
        />
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCertForModal && (
        <CertificateModal
          certificate={selectedCertForModal}
          onClose={() => setSelectedCertForModal(null)}
        />
      )}

    </div>
  );
}

