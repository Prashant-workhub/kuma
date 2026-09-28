/**
 * Project Kuma Capacity Connect - Trainee Dashboard
 * Clean, Flat, Pill-based LMS Interface inspired by Tutedude Dashboard design architecture.
 * Fully dynamic user-driven state initialization with 0 fake/hardcoded numbers.
 */

import React, { useMemo } from 'react';
import {
  Sparkles,
  Award,
  ClipboardCheck,
  Target,
  ArrowRight,
  UserCheck,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { PageId, Lecture, Note, Source, Quiz, UserSettings } from '../types';
import { Button, Badge, Card } from './bauhaus';
import { getUserCertificates } from '../utils/certificateUtils';
import { getUserEnrollments } from '../utils/enrollmentUtils';
import { LEVEL_TO_NUMERIC } from '../utils/competencyUtils';

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
  lectures,
  sources,
  theme,
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

  // Real user specific records (0 for new user, no fallback leak)
  const userCertificates = useMemo(() => getUserCertificates(userId), [userId]);
  const userEnrollments = useMemo(() => getUserEnrollments(userId), [userId]);
  const userCompetencies = useMemo(() => userProfile.competencies || [], [userProfile.competencies]);

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

  const handleOpenProfile = () => {
    setActivePage('profile');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 p-4 md:p-8 select-none font-sans">
      
      {/* 1. HERO CALLOUT BANNER - TUTEDUDE FLAT CLEAN ARCHITECTURE */}
      <div className="relative rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] p-6 md:p-8 shadow-sm flex flex-col lg:flex-row items-stretch justify-between gap-6 overflow-hidden">
        
        {/* Left Side: Content & Actions */}
        <div className="relative z-10 max-w-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#992E9D]/10 text-[#992E9D] text-xs font-semibold tracking-wide font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>CAPACITY CONNECT • SIH26075 DIGITAL PORTAL</span>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome, {userProfile.fullName || 'Learner'} <br />
              <span className="text-[#992E9D] dark:text-[#E040FB]">Precision Capacity Building Workspace</span>
            </h1>

            <p className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {userProfile.organization ? (
                <>Organization: <strong className="text-slate-900 dark:text-white">{userProfile.organization}</strong> • {userProfile.designation || 'Trainee'}</>
              ) : (
                'Track required vs current competency levels, enroll in recommended training programs, pass structured assessments, and earn verified digital credentials.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActivePage('skill-gap')}
              className="rounded-full px-6 py-2.5 bg-[#992E9D] hover:bg-[#832687] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Target className="h-4 w-4" />
              <span>Analyze Skill Gap</span>
            </button>
            
            <button
              onClick={() => setActivePage('certificates')}
              className="rounded-full px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="h-4 w-4 text-[#992E9D]" />
              <span>My Digital Certificates ({userCertificates.length})</span>
            </button>
          </div>
        </div>

        {/* Right Side: Clean Metric Overview Widget */}
        <div className="relative z-10 shrink-0 lg:w-72 bg-slate-50 dark:bg-slate-900/60 rounded-[10px] p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
              Capacity Growth
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {coveragePercentage > 0 ? `${coveragePercentage}% Target` : 'Active Baseline'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                <span>Target Coverage</span>
                <span className="font-bold text-slate-900 dark:text-white">{coveragePercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#992E9D] to-[#b73bbe] h-full rounded-full transition-all duration-500"
                  style={{ width: `${coveragePercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Active Gaps</div>
                <div className="text-base font-bold text-[#992E9D] dark:text-[#E040FB] mt-0.5">
                  {activeGapsCount} {activeGapsCount === 1 ? 'Gap' : 'Gaps'}
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Certificates</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {userCertificates.length} Verified
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{userProfile.organization || 'Trainee Profile Authenticated'}</span>
          </div>
        </div>

      </div>

      {/* 2. DASHBOARD QUICK STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1: Skill Gap Matrix */}
        <div 
          onClick={() => setActivePage('skill-gap')}
          className="p-5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] shadow-sm hover:border-[#992E9D] cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Skill Gap Matrix
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#992E9D] group-hover:scale-110 transition-transform" />
              <span>{activeGapsCount > 0 ? `${activeGapsCount} Tracked` : 'No Gaps'}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-[#992E9D] border border-purple-500/20">
            ANALYSIS
          </span>
        </div>

        {/* Stat Card 2: Certificates */}
        <div 
          onClick={() => setActivePage('certificates')}
          className="p-5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] shadow-sm hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              My Certificates
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span>{userCertificates.length > 0 ? `${userCertificates.length} Earned` : '0 Earned'}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            CREDENTIALS
          </span>
        </div>

        {/* Stat Card 3: Competency Profile */}
        <div 
          onClick={() => setActivePage('profile')}
          className="p-5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] shadow-sm hover:border-amber-500 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Competency Profile
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>{userCompetencies.length} Competencies</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            PROFILE
          </span>
        </div>

        {/* Stat Card 4: Skill Gaps */}
        <div 
          onClick={() => setActivePage('skill-gap')}
          className="p-5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] shadow-sm hover:border-emerald-500 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Training Enrolled
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>{userEnrollments.length} Programs</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            TRAINING
          </span>
        </div>

      </div>

      {/* 3. ASSIGNED COMPETENCY ASSESSMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#992E9D]" />
              Assigned Competency Assessments
            </h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluate your competency proficiency levels through structured assessments.
            </p>
          </div>

          <button
            onClick={handleOpenProfile}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>View Competency Profile</span>
          </button>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-8 text-center rounded-[11px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
            <GraduationCap className="h-8 w-8 text-slate-400 mx-auto opacity-50" />
            <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
              No Assessments Assigned Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              When your organization or trainer assigns competency evaluations, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 rounded-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] space-y-4 shadow-sm hover:border-[#992E9D] transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-[#992E9D] dark:text-[#E040FB] border border-purple-500/20">
                      {quiz.courseName || quiz.courseCode || 'TRAINING PROGRAM'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      Pass: {quiz.passingScore || 60}%
                    </span>
                  </div>

                  <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                    {quiz.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {quiz.description || quiz.topic}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Target Competency:</span>
                    <span className="font-bold text-[#992E9D] dark:text-[#E040FB]">
                      {quiz.competencyName || 'Data Analysis'}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                    className="w-full rounded-full py-2.5 bg-[#992E9D] hover:bg-[#832687] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Start Assessment ({quiz.questionsCount || quiz.questions.length} Qs)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
