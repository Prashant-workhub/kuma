/**
 * Project Kuma - Trainee Home Landing View
 * Learner-First Trainee Dashboard: Journey = Discover -> Learn -> Practice -> Assess -> Improve.
 */

import React, { useState, useMemo } from 'react';
import {
  Play,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Target,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { PageId, Quiz, UserSettings, TrainingEnrollment } from '../types';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { COURSES } from '../teacher-portal/lib/mockData';
import { getTrainingRecommendations } from '../utils/recommendationUtils';
import { calculateDesignationSkillGaps } from '../utils/competencyUtils';
import { getCoursePracticeReadiness } from '../services/practiceService';
import { SectionHeading, TraineeAvatar, TraineeButton, TraineeCard, TraineeEmptyState } from './trainee/TraineeUI';

interface TraineeHomeProps {
  setActivePage: (page: PageId) => void;
  settings: UserSettings;
  onOpenLecture?: (lectureId: string) => void;
  quizzes?: Quiz[];
  onOpenAssessment?: (quiz: Quiz) => void;
}

export default function TraineeHome({
  setActivePage,
  settings,
  onOpenLecture,
  quizzes = [],
  onOpenAssessment
}: TraineeHomeProps) {
  const [activeTooltipCourseId, setActiveTooltipCourseId] = useState<string | null>(null);

  const userProfile = settings?.profile || {
    fullName: '',
    emailAddress: '',
    avatarUrl: '',
    role: 'trainee',
    competencies: []
  };

  const userId = (userProfile as any).uid || '';
  const demoIdentity = isDemoTraineeIdentity(userId, userProfile.emailAddress);
  const localRecordIdentity = demoIdentity ? userProfile.emailAddress : userId;

  // Real enrollment data
  const enrollments: TrainingEnrollment[] = useMemo(() => {
    return getUserEnrollments(localRecordIdentity);
  }, [localRecordIdentity]);

  // User competencies
  const userCompetencies = useMemo(() => {
    return userProfile.competencies || [];
  }, [userProfile.competencies]);

  // Active / Most recently active enrollment
  const activeEnrollment: TrainingEnrollment | null = useMemo(() => {
    if (enrollments.length === 0) return null;
    const inProgress = enrollments.find((e) => e.status === 'in_progress');
    return inProgress || enrollments[0] || null;
  }, [enrollments]);

  // Active course details lookup
  const activeCourse = useMemo(() => {
    if (!activeEnrollment) return null;
    const found = COURSES.find(
      (c) => c.id === activeEnrollment.courseId || c.courseCode === activeEnrollment.courseCode
    );
    return {
      id: activeEnrollment.courseId,
      courseCode: activeEnrollment.courseCode,
      title: activeEnrollment.courseName || found?.courseName || 'Technical Training Course',
      description: found?.description || 'Build core competencies required for your role requirements.',
      progressPercentage: activeEnrollment.completionRate || 0,
      currentModuleTitle: 'Module 2: Core Concepts & Practice',
      totalModules: 5,
      completedModules: Math.round(((activeEnrollment.completionRate || 0) / 100) * 5)
    };
  }, [activeEnrollment]);

  // Skill gap calculation for Growth Strip & Recommendations
  const designationGaps = useMemo(() => {
    return calculateDesignationSkillGaps(userCompetencies, null, []);
  }, [userCompetencies]);

  const activeGaps = useMemo(() => {
    return designationGaps.filter((g) => g.gap > 0);
  }, [designationGaps]);

  // Closest gap to closing
  const closestGap = useMemo(() => {
    if (activeGaps.length === 0) return null;
    return [...activeGaps].sort((a, b) => a.gap - b.gap)[0];
  }, [activeGaps]);

  // Recommendations from recommendationUtils
  const recommendations = useMemo(() => {
    const userProgressMap: Record<string, { completionRate?: number; status?: 'not_started' | 'in_progress' | 'completed' }> = {};
    enrollments.forEach((e) => {
      userProgressMap[e.courseId] = {
        completionRate: e.completionRate,
        status: e.status === 'enrolled' ? 'in_progress' : e.status
      };
    });

    const res = getTrainingRecommendations(
      userCompetencies,
      COURSES,
      [],
      [],
      userProgressMap,
      null
    );

    return res.recommendedCourses.slice(0, 3);
  }, [userCompetencies, enrollments]);

  // Upcoming assessments
  const upcomingAssessments = useMemo(() => {
    return quizzes.slice(0, 2);
  }, [quizzes]);

  const initials = useMemo(() => {
    const parts = (userProfile.fullName || 'Learner Trainee').split(' ');
    return `${parts[0]?.[0] || 'L'}${parts[1]?.[0] || 'T'}`.toUpperCase();
  }, [userProfile.fullName]);

  return (
    <div className="mx-auto max-w-6xl select-none space-y-8 p-4 md:p-8 animate-fade-in">
      {/* Learner Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <TraineeAvatar
            initials={initials}
            src={userProfile.avatarUrl}
            size={52}
            accent="teal"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Welcome back, {userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'Learner'} 👋
            </h1>
            <p className="text-sm text-muted">
              {(userProfile as any).designation || 'Software Engineer'} Cohort · What would you like to learn today?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TraineeButton
            size="sm"
            variant="secondary"
            onClick={() => setActivePage('find-trainer')}
            iconLeft={<Sparkles size={14} className="text-brand-violet" />}
          >
            Discover Courses
          </TraineeButton>
        </div>
      </div>

      {/* BLOCK A: "Continue learning" Hero Card */}
      <section className="space-y-3" aria-labelledby="continue-learning-heading">
        <SectionHeading
          title="Continue Learning"
          eyebrow="Active Course"
        />

        {activeCourse ? (
          <div className="relative overflow-hidden rounded-2xl border border-brand-teal/30 bg-card p-6 shadow-sm transition-all hover:border-brand-teal/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-teal">
                    {activeCourse.courseCode}
                  </span>
                  <span className="text-xs font-medium text-muted flex items-center gap-1">
                    <BookOpen size={13} /> Module {activeCourse.completedModules + 1} of {activeCourse.totalModules}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-ink">
                    {activeCourse.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted line-clamp-1">
                    Current: <span className="font-semibold text-ink">{activeCourse.currentModuleTitle}</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted">Progress</span>
                    <span className="font-mono font-bold text-brand-teal">
                      {activeCourse.progressPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-emerald transition-all duration-500"
                      style={{ width: `${Math.max(activeCourse.progressPercentage, 5)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <TraineeButton
                  size="lg"
                  variant="primary"
                  iconLeft={<Play size={16} fill="currentColor" />}
                  onClick={() => onOpenLecture?.(activeCourse.id)}
                >
                  Resume
                </TraineeButton>
              </div>
            </div>
          </div>
        ) : (
          <TraineeCard className="p-6 text-center">
            <TraineeEmptyState
              icon={<BookOpen className="h-6 w-6 text-brand-teal" />}
              title="Start your first course"
              description="You have no active course in progress. Browse our catalog to find training tailored to your role."
              action={
                <TraineeButton
                  variant="primary"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => setActivePage('find-trainer')}
                >
                  Browse Catalog
                </TraineeButton>
              }
            />
          </TraineeCard>
        )}
      </section>

      {/* BLOCK D: Compact Growth Strip (Secondary, Single Row) */}
      <section aria-label="Growth Summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-amber/10 text-brand-amber">
              <Target size={15} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-ink">
              <span className="font-semibold font-mono text-brand-amber">
                {activeGaps.length} {activeGaps.length === 1 ? 'gap' : 'gaps'}
              </span>
              <span className="text-faint">•</span>
              {closestGap ? (
                <span className="text-muted">
                  <strong className="text-ink">{closestGap.competencyName}</strong> ({closestGap.currentLevel} → {closestGap.requiredLevel}) is closest to closing
                </span>
              ) : (
                <span className="text-muted">All target role competencies are met!</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setActivePage('skill-gap')}
            className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-brand-amber hover:text-brand-amber/80 transition-colors cursor-pointer"
          >
            View skill gap <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* BLOCK B: "Your courses" Row */}
      <section className="space-y-3" aria-labelledby="your-courses-heading">
        <SectionHeading
          title="Your Courses"
          eyebrow="Enrolled"
          action={
            <button
              onClick={() => setActivePage('my-learning')}
              className="text-xs font-semibold text-brand-teal hover:underline cursor-pointer"
            >
              View all ({enrollments.length})
            </button>
          }
        />

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 3).map((enrollment) => {
              const pct = enrollment.completionRate || 0;
              const isCompleted = enrollment.status === 'completed' || pct >= 100;
              const isAssessmentUnlocked = pct >= 100 && !isCompleted;

              return (
                <TraineeCard key={enrollment.id || enrollment.courseId} className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-panel px-2 py-0.5 font-mono text-[10px] font-bold text-muted border border-line">
                        {enrollment.courseCode}
                      </span>

                      {/* Status Chip */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-brand-emerald">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      ) : isAssessmentUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber/10 px-2 py-0.5 text-[10px] font-semibold text-brand-amber">
                          <Award size={11} /> Assessment Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
                          In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-ink text-sm line-clamp-1">
                      {enrollment.courseName}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Mini Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted">
                        <span>Progress</span>
                        <span className="font-mono font-semibold text-ink">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel">
                        <div
                          className="h-full rounded-full bg-brand-teal"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Subtle Practice Readiness Signal */}
                    {(() => {
                      const readiness = getCoursePracticeReadiness(localRecordIdentity, enrollment.courseId);
                      return (
                        <div className="flex items-center justify-between text-[10px] text-muted border-t border-line/60 pt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Sparkles size={11} className="text-brand-violet" /> Practice Readiness:
                          </span>
                          <span className="font-semibold text-ink">
                            {readiness.readinessPercent > 0 ? `${readiness.readinessPercent}% (${readiness.label})` : 'Not practiced'}
                          </span>
                        </div>
                      );
                    })()}

                    <TraineeButton
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      className="w-full justify-center"
                      onClick={() => onOpenLecture?.(enrollment.courseId)}
                    >
                      {isCompleted ? 'Review Course' : 'Continue'}
                    </TraineeButton>
                  </div>
                </TraineeCard>
              );
            })}
          </div>
        ) : (
          <TraineeCard className="p-6 text-center">
            <TraineeEmptyState
              icon={<BookOpen className="h-6 w-6 text-muted" />}
              title="No courses enrolled yet"
              description="Explore courses recommended for your target role and competencies."
              action={
                <TraineeButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setActivePage('find-trainer')}
                >
                  Discover Training
                </TraineeButton>
              }
            />
          </TraineeCard>
        )}
      </section>

      {/* BLOCK C: "Recommended for you" */}
      <section className="space-y-3" aria-labelledby="recommended-heading">
        <SectionHeading
          title="Recommended for You"
          eyebrow="Gap-Closing Training"
        />

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const matchedGap = rec.matchedGaps[0];
              const showTooltip = activeTooltipCourseId === rec.id;

              return (
                <TraineeCard key={rec.id} className="flex flex-col justify-between p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      {matchedGap ? (
                        <span className="rounded-md border border-brand-violet/30 bg-brand-violet/10 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-violet">
                          Closes: {matchedGap.competencyName} {matchedGap.currentLevel}➔{matchedGap.targetLevel}
                        </span>
                      ) : (
                        <span className="rounded bg-panel px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Recommended
                        </span>
                      )}

                      {/* Tooltip trigger for "Why this?" */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveTooltipCourseId(showTooltip ? null : rec.id)}
                          className="p-1 text-faint hover:text-ink transition-colors cursor-pointer"
                          aria-label="Why this recommendation?"
                          title="Why this recommendation?"
                        >
                          <HelpCircle size={14} />
                        </button>

                        {showTooltip && (
                          <div className="absolute right-0 top-6 z-20 w-56 rounded-lg border border-line bg-card p-2.5 text-xs shadow-lg text-ink space-y-1">
                            <div className="font-semibold text-brand-violet">Why this course?</div>
                            <p className="text-[11px] text-muted leading-tight">{rec.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-ink text-sm line-clamp-2">
                        {rec.course.courseName}
                      </h3>
                      <p className="mt-1 text-xs text-muted line-clamp-2">
                        {rec.course.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Clock size={12} /> 8 hours
                    </span>

                    <TraineeButton
                      size="sm"
                      variant="secondary"
                      onClick={() => setActivePage('find-trainer')}
                    >
                      View Details
                    </TraineeButton>
                  </div>
                </TraineeCard>
              );
            })}
          </div>
        ) : (
          <TraineeCard className="p-6 text-center">
            <p className="text-xs text-muted">No specific recommendations found. Keep your profile updated!</p>
          </TraineeCard>
        )}
      </section>

      {/* BLOCK E: Upcoming Assessments */}
      <section className="space-y-3" aria-labelledby="upcoming-assessments-heading">
        <SectionHeading
          title="Upcoming Assessments"
          eyebrow="Evaluation"
        />

        {upcomingAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAssessments.map((quiz) => (
              <TraineeCard key={quiz.id} className="flex items-center justify-between p-5">
                <div className="space-y-1 min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-brand-amber/10 text-brand-amber px-2 py-0.5 text-[10px] font-bold">
                      {quiz.competencyId || 'Skill Assessment'}
                    </span>
                    <span className="text-xs text-faint font-mono">
                      {(quiz as any).timeLimitMinutes || 20} mins
                    </span>
                  </div>
                  <h3 className="font-bold text-ink text-sm truncate">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-muted">
                    Pass score: {(quiz as any).passPercent || 70}%
                  </p>
                </div>

                <TraineeButton
                  size="sm"
                  variant="primary"
                  onClick={() => onOpenAssessment?.(quiz)}
                >
                  Start
                </TraineeButton>
              </TraineeCard>
            ))}
          </div>
        ) : (
          <TraineeCard className="p-5 flex items-center justify-between text-xs text-muted">
            <span>No pending assessment deadlines. Completed courses will unlock final evaluation quizzes.</span>
            <TraineeButton
              size="sm"
              variant="secondary"
              onClick={() => setActivePage('assessments')}
            >
              All Assessments
            </TraineeButton>
          </TraineeCard>
        )}
      </section>
    </div>
  );
}
