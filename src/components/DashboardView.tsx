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
  BookOpen
} from 'lucide-react';
import { PageId, Lecture, Note, Source, Quiz, UserSettings, TrainerProfile, TrainerAssignmentRecord } from '../types';
import { getUserCertificates } from '../utils/certificateUtils';
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

  // Real user specific records
  const userCertificates = useMemo(() => getUserCertificates(userId), [userId]);
  const userEnrollments = useMemo(() => getUserEnrollments(userId), [userId]);
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
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 font-sans select-none">
      
      {/* 1. Page Header */}
      <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome back, {userProfile.fullName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Track your learning progress, manage skill gaps, and develop the competencies required for your role.
        </p>
      </div>

      {/* 2. Overview Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setActivePage('skill-gap')}
          className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-colors cursor-pointer space-y-1"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Skill gaps</span>
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{activeGapsCount}</span>
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Identified development needs</span>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target coverage</span>
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{coveragePercentage}%</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${coveragePercentage}%` }}
            />
          </div>
        </div>

        <div 
          onClick={() => setActivePage('profile')}
          className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-colors cursor-pointer space-y-1"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Competencies</span>
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{userCompetencies.length}</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Tracked role skills</span>
        </div>

        <div 
          onClick={() => setActivePage('certificates')}
          className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-colors cursor-pointer space-y-1"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certificates</span>
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{userCertificates.length}</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Verified credentials</span>
        </div>

      </div>

      {/* 3. Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Skill Gap & Actionable Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Skill Gap Analysis Summary */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Skill gap analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Competencies requiring proficiency development for your role
                </p>
              </div>
              <button
                onClick={() => setActivePage('skill-gap')}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View full analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {userCompetencies.length === 0 ? (
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Target className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No role competencies added yet.
                </p>
                <button
                  onClick={() => setActivePage('profile')}
                  className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  Configure competencies
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {userCompetencies.slice(0, 4).map((c, idx) => {
                  const currentLevelNum = c.latestAssessedNumericLevel || c.numericLevel || LEVEL_TO_NUMERIC[c.level] || 1;
                  const targetLevelNum = c.targetNumericLevel || 3;
                  const isMet = currentLevelNum >= targetLevelNum;

                  return (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {c.name || 'Competency'}
                          </span>
                          {isMet ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                              Met
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                              Development needed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Category: {c.category || 'Technical'} • Target level: {c.targetLevel || 'Advanced'}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {c.level || 'Intermediate'}
                        </div>
                        <div className="text-[11px] text-slate-400">Current level</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Assigned Competency Assessments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Upcoming assessments
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assessments assigned to evaluate your target competency levels
                </p>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming assessments requiring attention.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{quiz.courseCode || 'Assessment'}</span>
                        <span>Pass mark: {quiz.passingScore || 60}%</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {quiz.description || quiz.topic}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                      className="w-full py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Take assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right 1 Column: My Trainer & Quick Controls */}
        <div className="space-y-6">
          
          {/* My Trainer Card */}
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Your trainer
            </h2>

            {selectedTrainerData ? (
              <div className="p-5 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  {selectedTrainerData.trainer.profilePhoto ? (
                    <img
                      src={selectedTrainerData.trainer.profilePhoto}
                      alt={selectedTrainerData.trainer.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-purple-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-semibold text-sm flex items-center justify-center border border-purple-200 dark:border-purple-800">
                      {(selectedTrainerData.trainer.fullName || 'Trainer').split(' ').map(n => n[0] || '').join('').slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {selectedTrainerData.trainer.fullName}
                    </h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                      {selectedTrainerData.trainer.designation || 'Senior Faculty'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedTrainerData.trainer.department || 'Training Unit'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
                  <div>Area: <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedTrainerData.trainer.areaOfExpertise || 'Technical Training'}</span></div>
                  <div>Experience: <span className="text-slate-900 dark:text-slate-200 font-medium">{selectedTrainerData.trainer.yearsOfExperience || 5} Years</span></div>
                </div>

                <button
                  onClick={() => setActivePage('find-trainer')}
                  className="w-full py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  View profile / Change trainer
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-lg bg-slate-50 dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h3 className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    No trainer selected yet
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Connect with a certified trainer to guide your capacity building journey.
                  </p>
                </div>
                <button
                  onClick={() => setActivePage('find-trainer')}
                  className="w-full py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Find a trainer
                </button>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="p-5 rounded-lg bg-white dark:bg-[#0C1220] border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick navigation
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setActivePage('skill-gap')}
                className="w-full p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Skill gap matrix
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActivePage('find-trainer')}
                className="w-full p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Find a trainer
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActivePage('certificates')}
                className="w-full p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  My certificates ({userCertificates.length})
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
