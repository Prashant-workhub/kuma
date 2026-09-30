/**
 * Project Kuma - Trainee Home Landing View
 * Learner-First Trainee Dashboard: Discover -> Learn -> Practice -> Assess -> Improve.
 */

import React, { useMemo } from 'react';
import { Play, ArrowRight, BookOpen, Clock, Target, ChevronRight, Award, CheckCircle2 } from 'lucide-react';
import { PageId, Quiz, UserSettings, TrainingEnrollment } from '../types';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { isDemoTraineeIdentity } from '../utils/demoDataSeeder';
import { COURSES } from '../teacher-portal/lib/mockData';
import { getTrainingRecommendations } from '../utils/recommendationUtils';
import { calculateDesignationSkillGaps } from '../utils/competencyUtils';
import { PageLayout } from './layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  ProgressBar,
  StatusPill,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from './ui';

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
  onOpenAssessment,
}: TraineeHomeProps) {
  const userProfile = settings?.profile || {
    fullName: '',
    emailAddress: '',
    avatarUrl: '',
    role: 'trainee',
    competencies: [],
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
      completedModules: Math.round(((activeEnrollment.completionRate || 0) / 100) * 5),
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

  // Recommendations
  const recommendations = useMemo(() => {
    const userProgressMap: Record<string, { completionRate?: number; status?: 'not_started' | 'in_progress' | 'completed' }> = {};
    enrollments.forEach((e) => {
      userProgressMap[e.courseId] = {
        completionRate: e.completionRate,
        status: e.status === 'enrolled' ? 'in_progress' : e.status,
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

  return (
    <PageLayout
      title={`Welcome back, ${userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'Learner'}`}
      description="Track your learning progress, build competencies, and complete evaluations."
      primaryAction={
        <Button variant="secondary" size="sm" onClick={() => setActivePage('find-trainer')}>
          Browse courses
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 1. TOP: "Continue learning" Card (Visual emphasis) */}
        <section aria-labelledby="continue-learning-heading">
          {activeCourse ? (
            <Card className="border-primary/30 bg-surface shadow-xs p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{activeCourse.courseCode}</Badge>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      Module {activeCourse.completedModules + 1} of {activeCourse.totalModules}
                    </span>
                  </div>

                  <div>
                    <h2 id="continue-learning-heading" className="text-xl font-semibold text-text-primary tracking-tight">
                      {activeCourse.title}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Current module: <span className="font-medium text-text-primary">{activeCourse.currentModuleTitle}</span>
                    </p>
                  </div>

                  {/* ProgressBar with label */}
                  <div className="max-w-md">
                    <ProgressBar value={activeCourse.progressPercentage} showLabel size="md" />
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onOpenLecture?.(activeCourse.id)}
                  >
                    <Play className="h-4 w-4 mr-1.5" fill="currentColor" aria-hidden="true" />
                    Resume
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setActivePage('my-learning')}
                  >
                    View course
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="You are not enrolled in any course yet"
                description="Explore courses recommended for your role and start building skills."
                action={
                  <Button variant="primary" onClick={() => setActivePage('find-trainer')}>
                    Browse courses
                  </Button>
                }
              />
            </Card>
          )}
        </section>

        {/* 2. QUIET SKILL GAP ROW (Single quiet row, no radar on Home) */}
        <section aria-label="Skill gap summary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-container border border-border bg-surface-muted px-4 py-3 text-xs">
            <div className="flex items-center gap-2 text-text-primary">
              <Target className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />
              <span>
                <strong>Skills:</strong> {activeGaps.length} {activeGaps.length === 1 ? 'gap' : 'gaps'} to close
                {closestGap ? (
                  <span> — <strong>{closestGap.competencyName}</strong> (level {closestGap.currentLevel} → {closestGap.requiredLevel}) is closest</span>
                ) : (
                  <span> — All target competencies met</span>
                )}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePage('skill-gap')}
              className="shrink-0"
            >
              View Growth <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* 3. MY COURSES (Compact list/table) */}
        <section className="space-y-3" aria-labelledby="my-courses-heading">
          <div className="flex items-center justify-between">
            <h3 id="my-courses-heading" className="text-base font-semibold text-text-primary">
              My courses
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setActivePage('my-learning')}>
              View all ({enrollments.length})
            </Button>
          </div>

          {enrollments.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.slice(0, 4).map((enrollment) => {
                    const pct = enrollment.completionRate || 0;
                    const isCompleted = enrollment.status === 'completed' || pct >= 100;
                    const statusLabel = isCompleted ? 'Completed' : pct > 0 ? 'In progress' : 'Not started';

                    return (
                      <TableRow key={enrollment.id || enrollment.courseId}>
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div>{enrollment.courseName}</div>
                            <div className="text-xs text-text-tertiary font-mono">{enrollment.courseCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-48">
                          <ProgressBar value={pct} showLabel size="sm" />
                        </TableCell>
                        <TableCell>
                          <StatusPill status={enrollment.status === 'enrolled' ? 'in_progress' : enrollment.status}>
                            {statusLabel}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenLecture?.(enrollment.courseId)}
                          >
                            {isCompleted ? 'Review' : 'Continue'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-xs text-text-secondary">No enrolled courses. Browse training catalog to enroll.</p>
            </Card>
          )}
        </section>

        {/* 4. RECOMMENDED FOR YOU (Plain text reason + Enroll action) */}
        <section className="space-y-3" aria-labelledby="recommended-heading">
          <h3 id="recommended-heading" className="text-base font-semibold text-text-primary">
            Recommended for you
          </h3>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => {
                const matchedGap = rec.matchedGaps[0];
                const reasonText = matchedGap
                  ? `Builds ${matchedGap.competencyName} from level ${matchedGap.currentLevel} to ${matchedGap.targetLevel}`
                  : rec.reason || 'Aligns with your role requirements';

                return (
                  <Card key={rec.id} className="flex flex-col justify-between p-4 space-y-3">
                    <div className="space-y-2">
                      <Badge variant="info">Recommended</Badge>
                      <h4 className="font-semibold text-text-primary text-sm line-clamp-2">
                        {rec.course.courseName}
                      </h4>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {reasonText}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-text-tertiary flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> 8 hours
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActivePage('find-trainer')}
                      >
                        Enroll
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-4 text-center">
              <p className="text-xs text-text-secondary">No recommendations available right now.</p>
            </Card>
          )}
        </section>

        {/* 5. UPCOMING ASSESSMENTS */}
        <section className="space-y-3" aria-labelledby="upcoming-assessments-heading">
          <h3 id="upcoming-assessments-heading" className="text-base font-semibold text-text-primary">
            Upcoming assessments
          </h3>

          {upcomingAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAssessments.map((quiz) => (
                <Card key={quiz.id} className="flex items-center justify-between p-4">
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{quiz.competencyId || 'Skill Assessment'}</Badge>
                      <span className="text-xs text-text-tertiary">Due in 3 days</span>
                    </div>
                    <h4 className="font-semibold text-text-primary text-sm truncate">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Time limit: {(quiz as any).timeLimitMinutes || 20} mins · Pass score: {(quiz as any).passPercent || 70}%
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenAssessment?.(quiz)}
                  >
                    Start assessment
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 flex items-center justify-between text-xs text-text-secondary">
              <span>No pending assessment deadlines. Completed courses will unlock final evaluation quizzes.</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActivePage('assessments')}
              >
                All assessments
              </Button>
            </Card>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
