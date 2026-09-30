/**
 * Project Kuma Capacity Connect - Trainee Dashboard
 * Professional Enterprise LMS & Workforce Skills Intelligence Hub
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  ArrowRight,
  UserCheck,
  Award,
  ClipboardCheck,
  Users,
  CheckCircle2,
  Sparkles,
  Building,
  TrendingUp,
  BookOpen,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  Zap
} from 'lucide-react';
import {
  SectionHeading,
  TraineeAvatar,
  TraineeBadge,
  TraineeButton,
  TraineeCard,
  TraineeEmptyState,
  TraineeKpi,
  TraineeLinkAction,
  TraineeRow,
  CategoryPill,
  LevelBlocks,
} from './trainee/TraineeUI';
import { PageId, Lecture, Note, Source, Quiz, UserSettings, TrainerProfile, TrainerAssignmentRecord } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { LEVEL_TO_NUMERIC } from '../utils/competencyUtils';
import { getTraineeSelectedTrainer } from '../services/trainerDiscoveryService';

interface DashboardViewProps {
  setActivePage: (page: PageId) => void;
  lectures: Lecture[];
  sources: Source[];
  onNewAnalysis?: () => void;
  onOpenLecture?: (lectureId: string) => void;
  theme: 'light' | 'dark';
  notes?: Note[];
  quizzes?: Quiz[];
  onOpenAssessment?: (quiz: Quiz) => void;
  settings: UserSettings;
}

export default function DashboardView({
  setActivePage,
  notes = [],
  quizzes = [],
  onOpenAssessment,
  settings
}: DashboardViewProps) {
  const userProfile: UserSettings['profile'] = settings?.profile || {
    fullName: '',
    emailAddress: '',
    bio: '',
    avatarUrl: '',
    institution: '',
    role: 'trainee'
  };
  const userId = userProfile.uid || '';
  const demoIdentity = isDemoTraineeIdentity(userId, userProfile.emailAddress);
  const localRecordIdentity = demoIdentity ? userProfile.emailAddress : userId;

  // Real user specific records
  const userCertificates = useMemo(() => getUserCertificates(localRecordIdentity), [localRecordIdentity]);
  const userEnrollments = useMemo(() => getUserEnrollments(localRecordIdentity), [localRecordIdentity]);
  const userCompetencies = useMemo(() => userProfile.competencies || [], [userProfile.competencies]);

  // Selected Trainer State
  const [selectedTrainerData, setSelectedTrainerData] = useState<{
    assignment: TrainerAssignmentRecord;
    trainer: TrainerProfile;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (userId) {
      getTraineeSelectedTrainer(userId).then(res => {
        if (isMounted) setSelectedTrainerData(res);
      }).catch(err => {
        console.warn('[Dashboard] Trainer lookup notice:', err);
      });
    }
    return () => { isMounted = false; };
  }, [userId]);

  // Calculate active skill gaps
  const activeGapsCount = useMemo(() => {
    if (!userCompetencies || userCompetencies.length === 0) return 0;
    return userCompetencies.filter(c => {
      const current = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
      const target = c.targetNumericLevel || 3;
      return target > current;
    }).length;
  }, [userCompetencies]);

  // Calculate target coverage percentage
  const coveragePercentage = useMemo(() => {
    if (!userCompetencies || userCompetencies.length === 0) return 0;
    const metCount = userCompetencies.filter(c => {
      const current = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
      const target = c.targetNumericLevel || 3;
      return current >= target;
    }).length;
    return Math.round((metCount / userCompetencies.length) * 100);
  }, [userCompetencies]);

  const initials = useMemo(() => {
    const parts = (userProfile.fullName || 'Learner Trainee').split(' ');
    return `${parts[0]?.[0] || 'L'}${parts[1]?.[0] || 'T'}`.toUpperCase();
  }, [userProfile.fullName]);

  return (
    <div className="mx-auto max-w-6xl select-none space-y-8 p-4 md:p-8 animate-fade-in">
      
      {/* 1. Executive Workforce Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-cyan/30 bg-gradient-to-r from-card via-panel to-card p-6 md:p-8 shadow-scrim">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-cyan/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-48 w-48 rounded-full bg-brand-violet/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Identity & Role Information */}
          <div className="flex items-start gap-4">
            <TraineeAvatar
              initials={initials}
              src={userProfile.avatarUrl}
              size={56}
              accent="emerald"
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full role-badge-trainee font-mono text-[10px] font-bold tracking-wider uppercase">
                  TRAINEE COHORT
                </span>
                <span className="text-xs font-mono text-faint flex items-center gap-1">
                  <Building size={12} /> {userProfile.institution || userProfile.organization || 'Acme Enterprises'}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
                Welcome back, {userProfile.fullName || 'Learner'}
              </h1>
              
              <p className="max-w-xl text-xs md:text-sm text-muted leading-relaxed">
                Workforce Capacity Building & Role Skill Alignment Portal. Track your progressive competency mastery and close active skill gaps.
              </p>
            </div>
          </div>

          {/* Quick Readiness Dial & Action */}
          <div className="flex shrink-0 flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-panel/70 p-4 rounded-xl border border-line">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-faint">
                Designation Target Match
              </div>
              <div className="flex items-center gap-2">
                <span className="metric text-2xl font-extrabold text-brand-emerald">{coveragePercentage}%</span>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {coveragePercentage >= 80 ? 'Optimal Readiness' : 'Development In Progress'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-line hidden sm:block" />

            <TraineeButton
              size="sm"
              variant="accent"
              iconRight={<ArrowRight size={14} />}
              onClick={() => setActivePage('skill-gap')}
            >
              Bridge Skill Gaps
            </TraineeButton>
          </div>

        </div>
      </div>

      {/* 2. Overview Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TraineeKpi
          label="Identified skill gaps"
          value={activeGapsCount}
          icon={<Target size={18} />}
          accent="gold"
          hint={`${activeGapsCount} competency targets pending`}
          onClick={() => setActivePage('skill-gap')}
        />
        <TraineeKpi
          label="Target role coverage"
          value={`${coveragePercentage}%`}
          icon={<CheckCircle2 size={18} />}
          accent="emerald"
          progress={coveragePercentage}
        />
        <TraineeKpi
          label="Role competencies"
          value={userCompetencies.length}
          icon={<UserCheck size={18} />}
          accent="cyan"
          hint="Tracked designation skills"
          onClick={() => setActivePage('profile')}
        />
        <TraineeKpi
          label="Verified certificates"
          value={userCertificates.length}
          icon={<Award size={18} />}
          accent="violet"
          hint="Authenticated credentials"
          onClick={() => setActivePage('certificates')}
        />
      </div>

      {/* 3. Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Columns: Skill Gap Matrix & Assessments */}
        <div className="lg:col-span-2 space-y-8">

          {/* Skill Gap Analysis Matrix */}
          <section className="space-y-4">
            <SectionHeading
              title="Designation Skill Matrix"
              subtitle="Competencies requiring proficiency development to meet your role requirement"
              action={
                <TraineeLinkAction
                  onClick={() => setActivePage('skill-gap')}
                  iconRight={<ArrowRight size={14} />}
                >
                  View full matrix
                </TraineeLinkAction>
              }
            />

            {userCompetencies.length === 0 ? (
              <TraineeEmptyState
                icon={<Target size={20} />}
                title="No role competencies added yet"
                description="Configure your role competencies to calculate skill gap gaps and receive training recommendations."
                action={
                  <TraineeButton
                    size="sm"
                    iconLeft={<UserCheck size={14} />}
                    onClick={() => setActivePage('profile')}
                  >
                    Configure competencies
                  </TraineeButton>
                }
              />
            ) : (
              <TraineeCard padded={false} className="divide-y divide-line overflow-hidden border-t-2 border-t-brand-cyan">
                {userCompetencies.slice(0, 5).map((c, idx) => {
                  const currentLevelNum = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
                  const targetLevelNum = c.targetNumericLevel || 3;
                  const isMet = currentLevelNum >= targetLevelNum;
                  const gap = Math.max(0, targetLevelNum - currentLevelNum);

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-panel/40">
                      
                      {/* Competency Info & Category */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-ink truncate">
                            {c.name || 'Competency Target'}
                          </span>
                          <CategoryPill category={c.category} />
                          <TraineeBadge accent={isMet ? 'emerald' : gap >= 2 ? 'rose' : 'gold'}>
                            {isMet ? 'Target Met' : `-${gap} Level Gap`}
                          </TraineeBadge>
                        </div>
                        <div className="text-xs text-muted flex items-center gap-3">
                          <span>Required: <strong className="text-ink">{c.targetLevel || 'Advanced'}</strong></span>
                          <span>·</span>
                          <span>Assessed: <strong className="text-ink">{c.level || 'Intermediate'}</strong></span>
                        </div>
                      </div>

                      {/* 4-Segment Proficiency Meter & CTA */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <LevelBlocks level={currentLevelNum} max={4} />
                        
                        <TraineeButton
                          size="sm"
                          variant={isMet ? 'ghost' : 'secondary'}
                          iconRight={<ChevronRight size={14} />}
                          onClick={() => setActivePage('skill-gap')}
                        >
                          {isMet ? 'Details' : 'Bridge Gap'}
                        </TraineeButton>
                      </div>

                    </div>
                  );
                })}
              </TraineeCard>
            )}
          </section>

          {/* Assigned Competency Assessments */}
          <section className="space-y-4">
            <SectionHeading
              title="Assigned Competency Assessments"
              subtitle="Evaluations assigned by your trainer to validate your target skill level"
              icon={<ClipboardCheck size={18} className="text-brand-violet" />}
            />

            {quizzes.length === 0 ? (
              <TraineeEmptyState
                icon={<ClipboardCheck size={20} />}
                title="No active assessments assigned."
                description="Your trainer will assign targeted skill assessments as you complete training modules."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quizzes.map((quiz) => (
                  <TraineeCard key={quiz.id} className="flex flex-col justify-between space-y-4 border-t-2 border-t-brand-violet relative overflow-hidden">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="font-mono text-[11px] font-bold uppercase text-brand-violet bg-brand-violet/10 px-2 py-0.5 rounded border border-brand-violet/30">
                          {quiz.courseCode || 'ASSESSMENT'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-faint">
                          <Clock size={12} /> Pass: {quiz.passingScore || 60}%
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-ink leading-snug">
                        {quiz.title}
                      </h3>
                      
                      <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                        {quiz.description || quiz.topic || 'Assess proficiency across target role competencies.'}
                      </p>
                    </div>

                    <TraineeButton
                      size="sm"
                      variant="accent"
                      block
                      iconRight={<ArrowRight size={14} />}
                      onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                    >
                      Take Assessment
                    </TraineeButton>
                  </TraineeCard>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right 1 Column: Trainer Guidance & Quick Actions */}
        <div className="space-y-6">

          {/* Certified Trainer Mentorship */}
          <section className="space-y-3">
            <SectionHeading title="Assigned Trainer" icon={<Users size={18} className="text-brand-cyan" />} />

            {selectedTrainerData ? (
              <TraineeCard className="space-y-4 border-t-2 border-t-brand-cyan">
                <div className="flex items-center gap-3">
                  <TraineeAvatar
                    initials={(selectedTrainerData.trainer.fullName || 'Trainer')
                      .split(' ')
                      .map((n) => n[0] || '')
                      .join('')
                      .slice(0, 2)}
                    src={selectedTrainerData.trainer.profilePhoto}
                    size={48}
                    accent="cyan"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {selectedTrainerData.trainer.fullName}
                    </h3>
                    <p className="truncate text-xs font-mono font-medium text-brand-cyan">
                      {selectedTrainerData.trainer.designation || 'Senior Faculty'}
                    </p>
                    <p className="truncate text-[11px] text-faint">
                      {selectedTrainerData.trainer.department || 'Capacity Development Unit'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-line pt-3 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span>Expertise:</span>
                    <span className="font-semibold text-ink truncate max-w-[140px]">
                      {selectedTrainerData.trainer.areaOfExpertise || 'Technical Training'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Experience:</span>
                    <span className="font-semibold text-ink">
                      {selectedTrainerData.trainer.yearsOfExperience || 5} Years
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response SLA:</span>
                    <span className="font-semibold text-emerald-400">Within 24 Hours</span>
                  </div>
                </div>

                <TraineeButton variant="secondary" size="sm" block iconRight={<ChevronRight size={14} />} onClick={() => setActivePage('find-trainer')}>
                  View Trainer / Change
                </TraineeButton>
              </TraineeCard>
            ) : (
              <TraineeEmptyState
                icon={<Users size={20} />}
                title="No trainer assigned yet"
                description="Connect with a certified domain trainer for mentorship and query resolution."
                action={
                  <TraineeButton size="sm" onClick={() => setActivePage('find-trainer')}>
                    Find a Trainer
                  </TraineeButton>
                }
              />
            )}
          </section>

          {/* Quick Navigation Rail */}
          <section className="space-y-3">
            <SectionHeading eyebrow="Quick Access" title="Workforce Rail" />
            <TraineeCard padded={false} className="divide-y divide-line px-2">
              <TraineeRow
                icon={<Target size={16} />}
                accent="amber"
                label="Skill Gap Matrix"
                meta="Detailed proficiency comparison"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('skill-gap')}
              />
              <TraineeRow
                icon={<Users size={16} />}
                accent="cyan"
                label="Find a Trainer"
                meta="Browse certified domain experts"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('find-trainer')}
              />
              <TraineeRow
                icon={<Award size={16} />}
                accent="violet"
                label={`My Certificates (${userCertificates.length})`}
                meta="Authenticated skills credentials"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('certificates')}
              />
              <TraineeRow
                icon={<ShieldCheck size={16} />}
                accent="emerald"
                label="Verify Certificate"
                meta="Public verification link lookup"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('verify-certificate')}
              />
            </TraineeCard>
          </section>

        </div>

      </div>

    </div>
  );
}
