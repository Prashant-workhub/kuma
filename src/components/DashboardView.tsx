/**
 * Project Kuma Capacity Connect - Trainee Dashboard
 * Clean, modern SaaS / LMS Interface. Restrained purple accent, sentence-case typography, and clear visual hierarchy.
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

  return (
    <div className="mx-auto max-w-6xl select-none space-y-8 p-4 md:p-8">
      {/* 1. Page Header */}
      <div className="space-y-1.5">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          Trainee dashboard
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Welcome back, {userProfile.fullName || 'Learner'}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Track your learning progress, manage skill gaps, and develop the competencies required for your role.
        </p>
      </div>

      {/* 2. Overview Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TraineeKpi
          label="Skill gaps"
          value={activeGapsCount}
          icon={<Target size={18} />}
          accent="gold"
          hint="Identified development needs"
          onClick={() => setActivePage('skill-gap')}
        />
        <TraineeKpi
          label="Target coverage"
          value={`${coveragePercentage}%`}
          icon={<CheckCircle2 size={18} />}
          accent="emerald"
          progress={coveragePercentage}
        />
        <TraineeKpi
          label="Competencies"
          value={userCompetencies.length}
          icon={<UserCheck size={18} />}
          accent="cyan"
          hint="Tracked role skills"
          onClick={() => setActivePage('profile')}
        />
        <TraineeKpi
          label="Certificates"
          value={userCertificates.length}
          icon={<Award size={18} />}
          accent="violet"
          hint="Verified credentials"
          onClick={() => setActivePage('certificates')}
        />
      </div>

      {/* 3. Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Columns: Skill Gap & Actionable Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Skill Gap Analysis Summary */}
          <section className="space-y-4">
            <SectionHeading
              title="Skill gap analysis"
              subtitle="Competencies requiring proficiency development for your role"
              action={
                <TraineeLinkAction
                  onClick={() => setActivePage('skill-gap')}
                  iconRight={<ArrowRight size={14} />}
                >
                  View full analysis
                </TraineeLinkAction>
              }
            />

            {userCompetencies.length === 0 ? (
              <TraineeEmptyState
                icon={<Target size={20} />}
                title="No role competencies added yet"
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
              <TraineeCard padded={false} className="divide-y divide-line overflow-hidden">
                {userCompetencies.slice(0, 4).map((c, idx) => {
                  const currentLevelNum = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
                  const targetLevelNum = c.targetNumericLevel || 3;
                  const isMet = currentLevelNum >= targetLevelNum;

                  return (
                    <div key={idx} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">
                            {c.name || 'Competency'}
                          </span>
                          <TraineeBadge accent={isMet ? 'emerald' : 'gold'}>
                            {isMet ? 'Met' : 'Development needed'}
                          </TraineeBadge>
                        </div>
                        <div className="text-xs text-muted">
                          Category: {c.category || 'Technical'} • Target level: {c.targetLevel || 'Advanced'}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-xs font-medium text-ink">
                          {c.level || 'Intermediate'}
                        </div>
                        <div className="text-[11px] text-faint">Current level</div>
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
              title="Upcoming assessments"
              subtitle="Assessments assigned to evaluate your target competency levels"
            />

            {quizzes.length === 0 ? (
              <TraineeEmptyState
                icon={<ClipboardCheck size={20} />}
                title="No assessments assigned yet."
                description="Your trainer will publish new assessments here as they become available."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quizzes.map((quiz) => (
                  <TraineeCard key={quiz.id} className="flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted">
                        <span className="truncate">{quiz.courseCode || 'Assessment'}</span>
                        <span className="shrink-0">Pass mark: {quiz.passingScore || 60}%</span>
                      </div>
                      <h3 className="text-sm font-semibold text-ink">
                        {quiz.title}
                      </h3>
                      <p className="line-clamp-2 text-xs text-muted">
                        {quiz.description || quiz.topic}
                      </p>
                    </div>

                    <TraineeButton
                      size="sm"
                      variant="accent"
                      block
                      iconRight={<ArrowRight size={14} />}
                      onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                    >
                      Take assessment
                    </TraineeButton>
                  </TraineeCard>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right 1 Column: My Trainer & Quick Controls */}
        <div className="space-y-6">

          {/* My Trainer Card */}
          <section className="space-y-3">
            <SectionHeading title="Your trainer" />

            {selectedTrainerData ? (
              <TraineeCard className="space-y-4">
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
                    <p className="truncate text-xs text-brand-cyan">
                      {selectedTrainerData.trainer.designation || 'Senior Faculty'}
                    </p>
                    <p className="truncate text-[11px] text-faint">
                      {selectedTrainerData.trainer.department || 'Training Unit'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 border-t border-line pt-3 text-xs text-muted">
                  <div>
                    Area:{' '}
                    <span className="font-medium text-ink">
                      {selectedTrainerData.trainer.areaOfExpertise || 'Technical Training'}
                    </span>
                  </div>
                  <div>
                    Experience:{' '}
                    <span className="font-medium text-ink">
                      {selectedTrainerData.trainer.yearsOfExperience || 5} Years
                    </span>
                  </div>
                </div>

                <TraineeButton variant="secondary" size="sm" block onClick={() => setActivePage('find-trainer')}>
                  View profile / Change trainer
                </TraineeButton>
              </TraineeCard>
            ) : (
              <TraineeEmptyState
                icon={<Users size={20} />}
                title="No trainer selected yet"
                description="Connect with a certified trainer to guide your capacity building journey."
                action={
                  <TraineeButton size="sm" onClick={() => setActivePage('find-trainer')}>
                    Find a trainer
                  </TraineeButton>
                }
              />
            )}
          </section>

          {/* Quick Actions */}
          <section className="space-y-2">
            <SectionHeading eyebrow="Navigate" title="Quick navigation" />
            <TraineeCard padded={false} className="divide-y divide-line px-2">
              <TraineeRow
                icon={<Target size={16} />}
                accent="gold"
                label="Skill gap matrix"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('skill-gap')}
              />
              <TraineeRow
                icon={<Users size={16} />}
                accent="cyan"
                label="Find a trainer"
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('find-trainer')}
              />
              <TraineeRow
                icon={<Award size={16} />}
                accent="violet"
                label={`My certificates (${userCertificates.length})`}
                trailing={<ArrowRight size={15} className="text-faint" />}
                onClick={() => setActivePage('certificates')}
              />
            </TraineeCard>
          </section>

        </div>

      </div>

    </div>
  );
}
