/**
 * Project Kuma Capacity Connect - Learner-First Trainee Dashboard
 * Modern, clean, and friendly learning portal.
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
  Building,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Clock,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
  GraduationCap
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
  CategoryPill,
  LevelBlocks,
} from './trainee/TraineeUI';
import { PageId, Lecture, Note, Source, Quiz, UserSettings, TrainerProfile, TrainerAssignmentRecord, TrainingEnrollment } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { LEVEL_TO_NUMERIC } from '../utils/competencyUtils';
import { getTraineeSelectedTrainer } from '../services/trainerDiscoveryService';
import { COURSES } from '../teacher-portal/lib/mockData';

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
  onOpenLecture,
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

  // Data queries
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

  // Active / Most recent course in progress
  const activeEnrollment: TrainingEnrollment | null = useMemo(() => {
    if (userEnrollments.length === 0) return null;
    return userEnrollments.find(e => e.status === 'in_progress') || userEnrollments[0] || null;
  }, [userEnrollments]);

  // Active course details from mock or published catalog
  const activeCourseDetails = useMemo(() => {
    if (!activeEnrollment) {
      const c = COURSES[0];
      return {
        id: c.id,
        courseCode: c.courseCode || 'COURSE-101',
        title: c.courseName || 'Core Technical Foundations',
        description: c.description || 'Continue building core competencies required for your role.',
        estimatedHours: 12,
        category: c.competencyNames?.[0] || 'Technical'
      };
    }
    const matched = COURSES.find(c => c.id === activeEnrollment.courseId || c.courseCode === activeEnrollment.courseCode);
    return {
      id: activeEnrollment.courseId,
      courseCode: activeEnrollment.courseCode,
      title: activeEnrollment.courseName || matched?.courseName || 'Technical Training Course',
      description: matched?.description || 'Continue building core competencies required for your role.',
      estimatedHours: 12,
      category: matched?.competencyNames?.[0] || 'Technical'
    };
  }, [activeEnrollment]);

  // Recommended Courses (excluding currently enrolled if needed, or top 3)
  const recommendedCourses = useMemo(() => {
    const enrolledIds = new Set(userEnrollments.map(e => e.courseId));
    const available = COURSES.filter(c => !enrolledIds.has(c.id));
    const list = available.length > 0 ? available.slice(0, 3) : COURSES.slice(0, 3);
    return list.map(c => ({
      id: c.id,
      courseCode: c.courseCode || 'PROG-101',
      title: c.courseName || 'Skill Development Module',
      description: c.description || 'Hands-on training module designed to enhance core competencies.',
      category: c.competencyNames?.[0] || 'Technical',
      estimatedHours: 8
    }));
  }, [userEnrollments]);

  return (
    <div className="mx-auto max-w-6xl select-none space-y-9 p-4 md:p-8 animate-fade-in">

      {/* 1. Friendly Learner Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <TraineeAvatar
            initials={initials}
            src={userProfile.avatarUrl}
            size={52}
            accent="teal"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Welcome back, {userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'Learner'} 👋
              </h1>
            </div>
            <p className="text-sm text-muted">
              {userProfile.designation || userProfile.role || 'Software Engineer'} Cohort · {userProfile.institution || userProfile.organization || 'Acme Enterprises'}
            </p>
          </div>
        </div>

        {/* Readiness Pill & Quick Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-2.5">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-faint">
                Role Readiness
              </div>
              <div className="text-lg font-bold text-brand-emerald">{coveragePercentage}%</div>
            </div>
            <div className="h-7 w-px bg-line" />
            <TraineeButton
              size="sm"
              variant="primary"
              iconRight={<ArrowRight size={14} />}
              onClick={() => setActivePage('skill-gap')}
            >
              Bridge Gaps
            </TraineeButton>
          </div>
        </div>
      </div>

      {/* 2. Hero Section: "Continue Learning" Banner */}
      <section className="space-y-3">
        <SectionHeading
          title="Continue Learning"
          eyebrow="Active Module"
          action={
            <TraineeLinkAction onClick={() => setActivePage('skill-gap')} iconRight={<ChevronRight size={14} />}>
              View all programs
            </TraineeLinkAction>
          }
        />

        <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-6 transition-all hover:border-accent/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-teal">
                  {activeCourseDetails.courseCode}
                </span>
                <CategoryPill category={activeCourseDetails.category} />
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock size={13} /> {activeCourseDetails.estimatedHours} hours total
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-ink hover:text-brand-teal transition-colors">
                  {activeCourseDetails.title}
                </h2>
                <p className="mt-1 text-sm text-muted line-clamp-2 leading-relaxed">
                  {activeCourseDetails.description}
                </p>
              </div>

              {/* Progress Bar & Next Step */}
              <div className="space-y-2 max-w-lg pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">
                    Course Progress: <strong className="text-brand-teal">{activeEnrollment?.completionRate || 35}%</strong>
                  </span>
                  <span className="text-muted">Module in progress</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-brand-teal transition-all duration-500"
                    style={{ width: `${activeEnrollment?.completionRate || 35}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Big Friendly CTA */}
            <div className="shrink-0 flex flex-col items-stretch sm:items-end justify-center gap-2 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
              <TraineeButton
                size="lg"
                variant="accent"
                iconLeft={<Play size={16} fill="currentColor" />}
                onClick={() => {
                  if (onOpenLecture && activeCourseDetails.id) {
                    onOpenLecture(activeCourseDetails.id);
                  } else {
                    setActivePage('skill-gap');
                  }
                }}
              >
                Resume Course
              </TraineeButton>
              <span className="text-[11px] text-faint text-center md:text-right">
                Next: Core Hands-on Lab
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metrics Summary Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TraineeKpi
          label="Identified Skill Gaps"
          value={activeGapsCount}
          icon={<Target size={18} />}
          accent="amber"
          hint={`${activeGapsCount} targets pending`}
          onClick={() => setActivePage('skill-gap')}
        />
        <TraineeKpi
          label="Role Readiness"
          value={`${coveragePercentage}%`}
          icon={<CheckCircle2 size={18} />}
          accent="emerald"
          progress={coveragePercentage}
        />
        <TraineeKpi
          label="Tracked Competencies"
          value={userCompetencies.length}
          icon={<UserCheck size={18} />}
          accent="cyan"
          hint="Role requirements"
          onClick={() => setActivePage('profile')}
        />
        <TraineeKpi
          label="Certificates Earned"
          value={userCertificates.length}
          icon={<Award size={18} />}
          accent="violet"
          hint="Authenticated credentials"
          onClick={() => setActivePage('certificates')}
        />
      </div>

      {/* 4. Main Learner Grid (2 Columns Left, 1 Column Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left 2 Columns: Skill Gaps Priorities & Assigned Assessments */}
        <div className="space-y-8 lg:col-span-2">

          {/* What to work on next / Skill Gaps */}
          <section className="space-y-4">
            <SectionHeading
              title="What to Work on Next"
              subtitle="Competencies requiring proficiency growth for your target role"
              eyebrow="Skill Gaps"
              action={
                <TraineeLinkAction onClick={() => setActivePage('skill-gap')} iconRight={<ArrowRight size={14} />}>
                  Full Matrix
                </TraineeLinkAction>
              }
            />

            {userCompetencies.length === 0 ? (
              <TraineeEmptyState
                icon={<Target size={22} />}
                title="No role competencies set"
                description="Set your role competencies to get personalized skill gap analysis and recommendations."
                action={
                  <TraineeButton size="sm" iconLeft={<UserCheck size={14} />} onClick={() => setActivePage('profile')}>
                    Configure Competencies
                  </TraineeButton>
                }
              />
            ) : (
              <div className="divide-y divide-line rounded-2xl border border-line bg-card overflow-hidden">
                {userCompetencies.slice(0, 4).map((c, idx) => {
                  const currentLevelNum = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
                  const targetLevelNum = c.targetNumericLevel || 3;
                  const isMet = currentLevelNum >= targetLevelNum;
                  const gap = Math.max(0, targetLevelNum - currentLevelNum);

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 transition-colors hover:bg-panel/40"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-ink truncate">
                            {c.name || 'Competency Target'}
                          </span>
                          <CategoryPill category={c.category} />
                          {isMet ? (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                              Target Met
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                              -{gap} Level Gap
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted flex items-center gap-3">
                          <span>Required: <strong className="text-ink">{c.targetLevel || 'Advanced'}</strong></span>
                          <span>·</span>
                          <span>Current: <strong className="text-ink">{c.level || 'Beginner'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <LevelBlocks level={currentLevelNum} max={4} />
                        <TraineeButton
                          size="sm"
                          variant={isMet ? 'ghost' : 'secondary'}
                          iconRight={<ChevronRight size={14} />}
                          onClick={() => setActivePage('skill-gap')}
                        >
                          {isMet ? 'View' : 'Bridge Gap'}
                        </TraineeButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recommended Training Programs */}
          <section className="space-y-4">
            <SectionHeading
              title="Recommended Training Programs"
              subtitle="Hand-picked courses to help close your active skill gaps"
              eyebrow="Recommendations"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4 transition-all hover:border-accent/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase text-brand-teal">
                        {course.courseCode}
                      </span>
                      <CategoryPill category={course.category} />
                    </div>

                    <h3 className="font-semibold text-sm text-ink line-clamp-2 leading-snug">
                      {course.title}
                    </h3>

                    <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-line mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-faint flex items-center gap-1">
                      <Clock size={12} /> {course.estimatedHours}h
                    </span>
                    <TraineeButton
                      size="sm"
                      variant="ghost"
                      iconRight={<ChevronRight size={13} />}
                      onClick={() => setActivePage('skill-gap')}
                    >
                      Enroll
                    </TraineeButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending Assessments */}
          {quizzes.length > 0 && (
            <section className="space-y-4">
              <SectionHeading
                title="Assigned Skill Assessments"
                subtitle="Validate your proficiency to mark competencies as completed"
                eyebrow="Assessments"
                icon={<ClipboardCheck size={18} className="text-brand-violet" />}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-col justify-between space-y-4 rounded-2xl border border-line bg-card p-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="font-mono text-[11px] font-bold uppercase text-brand-violet">
                          {quiz.courseCode || 'ASSESSMENT'}
                        </span>
                        <span className="text-[11px] text-faint">
                          Pass: {quiz.passingScore || 60}%
                        </span>
                      </div>

                      <h3 className="font-semibold text-ink leading-snug">
                        {quiz.title}
                      </h3>

                      <p className="line-clamp-2 text-xs text-muted leading-relaxed">
                        {quiz.description || quiz.topic || 'Assess proficiency across target role competencies.'}
                      </p>
                    </div>

                    <TraineeButton
                      size="sm"
                      variant="primary"
                      block
                      iconRight={<ArrowRight size={14} />}
                      onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                    >
                      Take Assessment
                    </TraineeButton>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right 1 Column: Trainer Mentorship & Quick Actions */}
        <div className="space-y-6">

          {/* Assigned Trainer */}
          <section className="space-y-3">
            <SectionHeading title="My Trainer" eyebrow="Mentorship" icon={<Users size={16} className="text-brand-teal" />} />

            {selectedTrainerData ? (
              <div className="rounded-2xl border border-line bg-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <TraineeAvatar
                    initials={(selectedTrainerData.trainer.fullName || 'Trainer')
                      .split(' ')
                      .map((n) => n[0] || '')
                      .join('')
                      .slice(0, 2)}
                    src={selectedTrainerData.trainer.profilePhoto}
                    size={46}
                    accent="teal"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink">
                      {selectedTrainerData.trainer.fullName}
                    </h3>
                    <p className="truncate text-xs font-mono font-medium text-brand-teal">
                      {selectedTrainerData.trainer.designation || 'Senior Instructor'}
                    </p>
                    <p className="truncate text-[11px] text-faint">
                      {selectedTrainerData.trainer.department || 'Training Unit'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-line pt-3 text-xs text-muted">
                  <div className="flex items-center justify-between">
                    <span>Expertise:</span>
                    <span className="font-medium text-ink truncate max-w-[130px]">
                      {selectedTrainerData.trainer.areaOfExpertise || 'Technical Training'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SLA:</span>
                    <span className="font-medium text-emerald-400">Within 24 Hours</span>
                  </div>
                </div>

                <TraineeButton
                  variant="secondary"
                  size="sm"
                  block
                  iconRight={<ChevronRight size={14} />}
                  onClick={() => setActivePage('find-trainer')}
                >
                  Message Trainer
                </TraineeButton>
              </div>
            ) : (
              <TraineeEmptyState
                icon={<Users size={20} />}
                title="No trainer assigned"
                description="Connect with a domain instructor for direct feedback."
                action={
                  <TraineeButton size="sm" onClick={() => setActivePage('find-trainer')}>
                    Find Trainer
                  </TraineeButton>
                }
              />
            )}
          </section>

          {/* Certificate Snapshot */}
          <section className="space-y-3">
            <SectionHeading title="Latest Certificate" eyebrow="Achievements" icon={<Award size={16} className="text-brand-violet" />} />

            {userCertificates.length > 0 ? (
              <div className="rounded-2xl border border-line bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-violet/30 bg-brand-violet/10 text-brand-violet">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-ink">
                      {userCertificates[0].courseName}
                    </h4>
                    <p className="text-[11px] font-mono text-faint">
                      ID: {userCertificates[0].id}
                    </p>
                  </div>
                </div>
                <TraineeButton
                  variant="secondary"
                  size="sm"
                  block
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => setActivePage('certificates')}
                >
                  View All Certificates ({userCertificates.length})
                </TraineeButton>
              </div>
            ) : (
              <div className="rounded-2xl border border-line bg-card p-5 text-center space-y-2">
                <GraduationCap className="mx-auto h-8 w-8 text-faint" />
                <p className="text-xs text-muted">Complete training modules to earn verified certificates.</p>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="space-y-3">
            <SectionHeading eyebrow="Shortcuts" title="Quick Navigation" />
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActivePage('skill-gap')}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left text-xs font-medium text-ink transition-colors hover:bg-panel"
              >
                <span className="flex items-center gap-2">
                  <Target size={15} className="text-amber-400" />
                  Skill Gap Matrix
                </span>
                <ChevronRight size={14} className="text-faint" />
              </button>
              <button
                type="button"
                onClick={() => setActivePage('find-trainer')}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left text-xs font-medium text-ink transition-colors hover:bg-panel"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-teal-400" />
                  Find a Trainer
                </span>
                <ChevronRight size={14} className="text-faint" />
              </button>
              <button
                type="button"
                onClick={() => setActivePage('verify-certificate')}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left text-xs font-medium text-ink transition-colors hover:bg-panel"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  Verify Certificate
                </span>
                <ChevronRight size={14} className="text-faint" />
              </button>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
