/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { UserSettings, TraineeCompetency, SkillProficiencyLevel, RoleSkillGapRecord, TrainingCertificate, Quiz, TeacherAssignment } from '../types';
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
import { DEMO_ORG_DESIGNATIONS_FULL } from '../utils/demoDataSeeder';
import { getTrainingRecommendations } from '../utils/recommendationUtils';
import { enrollInCourse, updateEnrollmentProgress } from '../utils/enrollmentUtils';
import { COURSES } from '../teacher-portal/lib/mockData';
import { INITIAL_COMPETENCY_CATALOG } from '../data';
import { Card, Button, Badge } from './bauhaus';

import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  ArrowLeft,
  Sliders,
  Award,
  BookOpen,
  GraduationCap,
  ArrowRight,
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

const STATUS_BADGE_STYLE: Record<GapStatus, { bg: string; text: string; border: string }> = {
  'Meets Target': { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'Development Needed': { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Significant Development Needed': { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  'High Development Need': { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' }
};

const PRIORITY_BADGE_STYLE: Record<GapPriority, { bg: string; text: string }> = {
  Low: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', text: 'text-slate-600 dark:text-slate-300' },
  Medium: { bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300', text: 'text-amber-700 dark:text-amber-300' },
  High: { bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300', text: 'text-rose-700 dark:text-rose-300' },
  Critical: { bg: 'bg-purple-100 dark:bg-purple-950/60 text-[#992e9d] dark:text-purple-300', text: 'text-[#992e9d] dark:text-purple-300' }
};

export default function SkillGapView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme,
  onTakeAssessment,
  onViewCertificate
}: SkillGapViewProps) {
  const [competencies, setCompetencies] = useState<TraineeCompetency[]>(
    settings.profile.competencies || []
  );

  const [courseProgressState, setCourseProgressState] = useState<Record<string, number>>({});

  // Training Program Lifecycle & Certificate Modal States
  const [selectedCourseForLifecycle, setSelectedCourseForLifecycle] = useState<TeacherAssignment | null>(null);
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<TrainingCertificate | null>(null);

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

    if (!desigName && !deptName) return null;

    const matched = DEMO_ORG_DESIGNATIONS_FULL.find(
      (d) => (desigName && d.name.toLowerCase() === desigName) ||
             (deptName && d.departmentName.toLowerCase() === deptName)
    );

    if (matched) return matched;

    // Return clean user designation without demo requirements
    return {
      id: `custom-desig-${desigName || 'trainee'}`,
      name: settings.profile.designation || 'Trainee Designation',
      departmentId: 'dept-custom',
      departmentName: settings.profile.department || 'Capacity Building Unit',
      isActive: true,
      requiredCompetencies: []
    };
  }, [settings.profile.designation, settings.profile.department]);

  // Dynamic Designation Skill Gap Calculations
  const designationGaps = useMemo(() => {
    return calculateDesignationSkillGaps(competencies, traineeDesignation, INITIAL_COMPETENCY_CATALOG);
  }, [competencies, traineeDesignation]);

  const totalCompetencies = designationGaps.length;
  const meetingTargetCount = designationGaps.filter((g) => g.gap === 0).length;
  const devNeededCount = designationGaps.filter((g) => g.gap === 1).length;
  const sigDevCount = designationGaps.filter((g) => g.gap === 2).length;
  const highDevCount = designationGaps.filter((g) => g.gap >= 3).length;


  // Recommendation Engine execution against Trainee Designation Skill Gaps
  const { recommendedCourses, unmatchedGaps } = getTrainingRecommendations(
    competencies,
    COURSES,
    [],
    INITIAL_COMPETENCY_CATALOG,
    Object.fromEntries(
      Object.entries(courseProgressState).map(([cid, prog]) => [cid, { completionRate: prog }])
    ),
    traineeDesignation
  );


  const handleStartCourse = (courseId: string) => {
    setCourseProgressState((prev) => ({
      ...prev,
      [courseId]: prev[courseId] ? Math.min(100, prev[courseId] + 25) : 25
    }));
  };

  // Visual Step Progress Bar
  const renderProgressBar = (numLevel: number = 2, activeColor: string = 'bg-[#FFC400]') => {
    const blocks = [1, 2, 3, 4];
    return (
      <div className="flex items-center gap-1 font-mono text-xs">
        <div className="flex items-center gap-1">
          {blocks.map((b) => (
            <div
              key={b}
              className={`h-2.5 w-4 rounded-[2px] border border-[var(--border-main)] transition-all ${
                b <= numLevel ? activeColor : 'bg-gray-200 dark:bg-neutral-800'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-extrabold text-[var(--text-secondary)] ml-1">
          {numLevel}/4
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Header Banner */}
      <div className="rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 shadow-paper-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BACK TO DASHBOARD</span>
          </button>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
            <Target className="h-7 w-7 text-[#FFC400]" />
            TRAINEE SKILL GAP ANALYSIS
          </h1>
          <p className="text-xs md:text-sm font-mono text-[var(--text-secondary)] mt-1">
            Deterministic gap analysis measuring current assessed/declared competency levels against target proficiency levels.
          </p>
        </div>

        <Button
          variant="tertiary"
          size="sm"
          onClick={() => setActivePage('profile')}
          className="shrink-0"
        >
          View Profile Competencies
        </Button>
      </div>

      {/* GAP SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-xs">
          <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)]">Total Competencies</div>
          <div className="font-heading font-black text-2xl text-[var(--text-primary)] mt-1">{totalCompetencies}</div>
          <div className="text-[9px] font-mono text-[var(--text-secondary)]">Tracked</div>
        </div>

        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-xs">
          <div className="text-[10px] font-mono font-bold uppercase text-[#19B56B]">Meets Target</div>
          <div className="font-heading font-black text-2xl text-[#19B56B] mt-1">{meetingTargetCount}</div>
          <div className="text-[9px] font-mono text-[var(--text-secondary)]">Gap = 0</div>
        </div>

        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-xs">
          <div className="text-[10px] font-mono font-bold uppercase text-[#B78103] dark:text-[#FFD54F]">Development Needed</div>
          <div className="font-heading font-black text-2xl text-[#B78103] dark:text-[#FFD54F] mt-1">{devNeededCount}</div>
          <div className="text-[9px] font-mono text-[var(--text-secondary)]">Gap = 1</div>
        </div>

        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-xs">
          <div className="text-[10px] font-mono font-bold uppercase text-orange-600 dark:text-orange-400">Significant Dev Needed</div>
          <div className="font-heading font-black text-2xl text-orange-600 dark:text-orange-400 mt-1">{sigDevCount}</div>
          <div className="text-[9px] font-mono text-[var(--text-secondary)]">Gap = 2</div>
        </div>

        <div className="p-4 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-xs">
          <div className="text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400">High Dev Need</div>
          <div className="font-heading font-black text-2xl text-red-600 dark:text-red-400 mt-1">{highDevCount}</div>
          <div className="text-[9px] font-mono text-[var(--text-secondary)]">Gap = 3</div>
        </div>
      </div>

      {/* DETAILED SKILL GAP ANALYSIS TABLE / CARDS */}
      <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[var(--border-main)] pb-3 gap-2">
          <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#FFC400]" />
            COMPETENCY SKILL GAP MATRIX
          </h3>
          <span className="text-xs font-mono text-[var(--text-secondary)] font-bold">
            Deterministic Rule-Based Evaluation
          </span>
        </div>

        {/* Trainee Designation Badge Header */}
        <div className="p-3 rounded-[6px] bg-[var(--panel-bg)] border border-[var(--border-main)] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase text-[var(--text-secondary)]">TRAINEE DESIGNATION:</span>
            <span className="font-black text-[#FFC400] uppercase">{traineeDesignation.name}</span>
            <span className="text-[var(--text-secondary)]">({traineeDesignation.departmentName})</span>
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            Required Competencies Specified by Organization
          </span>
        </div>

        {designationGaps.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-[var(--text-secondary)] space-y-1">
            <div className="font-bold text-sm text-[var(--text-primary)]">No skill gaps identified yet.</div>
            <div>Add competencies to your profile or select training programs to calculate skill gaps.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {designationGaps.map((rec) => {
              const statusStyle = STATUS_BADGE_STYLE[rec.status];
              const priorityStyle = PRIORITY_BADGE_STYLE[rec.priority];

              return (
                <div
                  key={rec.competencyId}
                  className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] space-y-3 shadow-paper-xs"
                >
                  {/* Top Line: Competency Name & Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-main)]/40 pb-3 font-mono">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-extrabold text-base text-[var(--text-primary)] uppercase">
                          {rec.competencyName}
                        </h4>
                        {rec.category && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-[var(--border-main)] bg-[var(--card-bg)]">
                            {rec.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Priority Badges */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <span className={`px-2.5 py-1 rounded-[4px] border ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text} text-xs font-black uppercase`}>
                        {rec.status}
                      </span>
                      <span className={`px-2 py-1 rounded-[4px] ${priorityStyle.bg} text-xs font-black uppercase shadow-paper-xs`}>
                        Priority: {rec.priority}
                      </span>
                    </div>
                  </div>

                  {/* Matrix Columns: CURRENT LEVEL | REQUIRED LEVEL | CALCULATED GAP */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 font-mono">
                    
                    {/* 1. CURRENT LEVEL (Assessed Preferred, Declared Fallback, 0 Not Assessed) */}
                    <div className="p-3.5 rounded-[6px] border border-[var(--border-main)] bg-[var(--card-bg)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          CURRENT LEVEL
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          rec.currentSource === 'Assessed' 
                            ? 'bg-[#19B56B]/20 text-[#19B56B] border-[#19B56B]/40' 
                            : rec.currentSource === 'Declared'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}>
                          {rec.currentSource === 'Assessed' ? 'Assessed' : rec.currentSource === 'Declared' ? 'Declared' : 'Not Assessed'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {renderProgressBar(rec.currentNumericLevel, rec.currentNumericLevel === 0 ? 'bg-red-500' : 'bg-[#FFC400]')}
                        <span className="font-heading font-extrabold text-xs text-[var(--text-primary)] uppercase">
                          {rec.currentLevel}
                        </span>
                      </div>
                    </div>

                    {/* 2. REQUIRED LEVEL (From Designation Role) */}
                    <div className="p-3.5 rounded-[6px] border border-[var(--border-main)] bg-[var(--card-bg)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          REQUIRED LEVEL (ROLE)
                        </span>
                        <span className="text-[9px] text-[var(--text-secondary)] font-bold">Role Spec</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {renderProgressBar(rec.requiredNumericLevel, 'bg-[#9C27B0]')}
                        <span className="font-heading font-extrabold text-xs text-[#9C27B0] uppercase">
                          {rec.requiredLevel} ({rec.requiredNumericLevel}/4)
                        </span>
                      </div>
                    </div>

                    {/* 3. SKILL GAP */}
                    <div className="p-3.5 rounded-[6px] border border-[var(--border-main)] bg-[var(--card-bg)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          SKILL GAP
                        </span>
                        <span className="text-[9px] text-[var(--text-secondary)]">Required - Current</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`font-heading font-black text-xl uppercase ${
                          rec.gap === 0 ? 'text-[#19B56B]' : rec.gap === 1 ? 'text-[#B78103] dark:text-[#FFD54F]' : 'text-red-500'
                        }`}>
                          {rec.gap} {rec.gap === 1 ? 'LEVEL' : 'LEVELS'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                          {rec.gap === 0 ? 'Meets Target' : `Needs +${rec.gap} Level Step`}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </Card>

      {/* PHASE 3E: RECOMMENDED TRAINING SECTION */}
      <Card shadow="md" className="p-6 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[var(--border-main)] pb-3 gap-2">
          <div>
            <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-[2px] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#9C27B0]" />
              RECOMMENDED TRAINING & LEARNING MATERIAL
            </h3>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              Targeted training programs dynamically mapped to your identified skill gaps.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)] font-bold px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            Phase 3E Recommendation System
          </span>
        </div>

        {recommendedCourses.length === 0 ? (
          <div className="p-8 text-center rounded-[6px] border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-main)] space-y-2">
            <CheckCircle2 className="h-8 w-8 text-[#19B56B] mx-auto" />
            <h4 className="font-heading font-extrabold text-sm text-[var(--text-primary)] uppercase">
              NO ACTIVE SKILL GAPS REQUIRING TRAINING
            </h4>
            <p className="text-xs font-mono text-[var(--text-secondary)] max-w-md mx-auto">
              You currently meet or exceed all target levels for your tracked competencies! Adjust target levels above or take new assessments to discover training recommendations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedCourses.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] flex flex-col justify-between space-y-4 shadow-paper-sm hover:shadow-paper transition-shadow relative overflow-hidden"
              >
                <div className="space-y-3">
                  
                  {/* Top Bar: Course Code, Duration, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black uppercase px-2 py-0.5 rounded bg-[#9C27B0]/20 text-[#9C27B0] border border-[#9C27B0]/40">
                        {rec.course.courseCode}
                      </span>
                      {rec.course.duration && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                          <Clock className="h-3 w-3" />
                          {rec.course.duration}
                        </span>
                      )}
                    </div>

                    {rec.enrollmentStatus === 'in_progress' ? (
                      <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#FFC400]/20 text-[#B78103] dark:text-[#FFD54F] border border-[#FFC400]/40">
                        IN PROGRESS ({rec.progressPercentage}%)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#19B56B]/20 text-[#19B56B] border border-[#19B56B]/40">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  {/* Course Name */}
                  <div>
                    <h4 className="font-heading font-black text-base text-[var(--text-primary)] uppercase leading-snug">
                      {rec.course.courseName}
                    </h4>
                    {rec.course.description && (
                      <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {rec.course.description}
                      </p>
                    )}
                  </div>

                  {/* SKILL GAP TO TRAINING CONNECTION BANNER */}
                  <div className="p-3 rounded-[4px] border border-[var(--border-main)] bg-[var(--card-bg)] space-y-1.5">
                    <div className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Skill Gap ➔ Competency ➔ Recommendation</span>
                    </div>

                    <p className="text-xs font-mono text-[var(--text-primary)] font-bold">
                      {rec.reason}
                    </p>

                    {/* Matched Competencies Breakdown */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.matchedGaps.map((mg) => (
                        <div
                          key={mg.competencyId}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-neutral-800 text-[var(--text-primary)] font-bold flex items-center gap-1 border border-[var(--border-main)]"
                        >
                          <span>{mg.competencyName}:</span>
                          <span className="text-[#FFC400] font-extrabold">{mg.currentLevel}</span>
                          <span>➔</span>
                          <span className="text-purple-400 font-extrabold">{mg.targetLevel}</span>
                          <span className="text-red-500 font-black ml-0.5">(Gap: {mg.gap})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Action Area */}
                <div className="pt-2 border-t border-[var(--border-main)]/40 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                    Max Gap Addressed: <span className="font-bold text-red-500">{rec.maxGap} Level{rec.maxGap > 1 ? 's' : ''}</span>
                  </div>

                  <Button
                    variant={rec.enrollmentStatus === 'in_progress' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => {
                      setSelectedCourseForLifecycle(rec.course);
                      setShowLifecycleModal(true);
                    }}
                    className={`flex items-center gap-1.5 ${rec.enrollmentStatus === 'in_progress' ? '' : 'bg-[#9C27B0] hover:bg-[#8E24AA] text-white'}`}
                  >
                    {rec.enrollmentStatus === 'in_progress' ? (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        <span>Continue Training</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" />
                        <span>Enroll & View Lifecycle</span>
                      </>
                    )}
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* UNMATCHED SKILL GAPS - NO TRAINING AVAILABLE CASE */}
        {unmatchedGaps.length > 0 && (
          <div className="pt-4 border-t-2 border-[var(--border-main)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>TRAINING COVERAGE GAPS ({unmatchedGaps.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unmatchedGaps.map((gap) => (
                <div
                  key={gap.competencyId}
                  className="p-4 rounded-[6px] border-2 border-amber-500/40 bg-amber-500/10 font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold uppercase text-[var(--text-primary)]">
                      {gap.competencyName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-bold text-[10px] uppercase">
                      Training Coverage Gap
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Current: <strong className="text-[var(--text-primary)]">{gap.currentLevel}</strong> ➔ Required: <strong className="text-[#9C27B0]">{gap.requiredLevel}</strong> (Gap: {gap.gap})
                  </div>

                  <div className="p-2.5 rounded bg-[var(--card-bg)] border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>No matching training program is currently available for this competency.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* TRAINING PROGRAM LIFECYCLE MODAL */}
      {showLifecycleModal && selectedCourseForLifecycle && (
        <TrainingLifecycleModal
          isOpen={showLifecycleModal}
          onClose={() => setShowLifecycleModal(false)}
          course={selectedCourseForLifecycle}
          settings={settings}
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

