/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Sparkles,
  Mic,
  Award,
  ClipboardCheck,
  Target,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { PageId, Lecture, Note, Source, Quiz } from '../types';
import { Button, Badge, Card } from './bauhaus';

interface DashboardViewProps {
  setActivePage: (page: PageId) => void;
  lectures: Lecture[];
  sources: Source[];
  onNewAnalysis: () => void;
  onOpenLecture: (lectureId: string) => void;
  theme: 'light' | 'dark';
  notes?: Note[];
  quizzes?: Quiz[];
  onOpenAssessment?: (quiz: Quiz) => void;
}

export default function DashboardView({
  setActivePage,
  lectures,
  sources,
  onOpenLecture,
  theme,
  notes = [],
  quizzes = [],
  onOpenAssessment
}: DashboardViewProps) {
  // Quick navigation helpers
  const handleStartRecording = () => {
    setActivePage('lecture-capture');
  };

  const handleOpenStudio = () => {
    setActivePage('knowledge-studio');
  };

  const handleOpenProfile = () => {
    setActivePage('profile');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* 1. HERO CALLOUT BANNER */}
      <div className="relative rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] p-6 md:p-10 shadow-paper-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        
        {/* Yellow Decorative Callout Accent Box */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC400] opacity-15 rotate-12 -translate-y-8 translate-x-8 border-2 border-[var(--border-main)] pointer-events-none" />

        {/* Left Side: Content & Actions */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Badge variant="yellow" size="md" icon={<Sparkles className="h-3.5 w-3.5" />}>
              TRAINEE WORKSPACE • KUMA SUITE
            </Badge>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[var(--text-primary)] leading-none uppercase">
            AI THAT THINKS <br />
            <span className="bg-[#FFC400] text-[#111111] px-2 py-0.5 border-2 border-[var(--border-main)] shadow-paper-sm inline-block mt-1">
              WHILE YOU TRAIN.
            </span>
          </h1>

          <p className="text-sm md:text-base font-medium text-[var(--text-secondary)] leading-relaxed max-w-2xl border-l-4 border-[#FFC400] pl-3 py-1">
            Capture training sessions, generate notes, summaries, assessments, flashcards, and structured learning resources with persistent AI memory.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStartRecording}
              className="w-full sm:w-auto bg-[#2F6BFF] text-white hover:bg-[#255cd9] border-2 border-[var(--border-main)] shadow-paper-md"
              icon={<Mic className="h-4.5 w-4.5 text-white animate-pulse" />}
            >
              Start Recording
            </Button>
            
            <Button
              variant="tertiary"
              size="lg"
              onClick={handleOpenStudio}
              className="w-full sm:w-auto border-2 border-[var(--border-main)] shadow-paper-md"
              icon={<BookOpen className="h-4 w-4 text-[var(--text-primary)]" />}
            >
              Open Knowledge Studio
            </Button>
          </div>
        </div>

        {/* Right Side: AI Mascot */}
        <div className="relative z-10 shrink-0 mt-6 md:mt-0 flex flex-col items-center justify-center">
          <div className="relative group flex flex-col items-center">
            <div className="mb-2 px-3.5 py-1.5 rounded-full bg-[#FFC400] text-[#111111] font-mono text-xs font-extrabold uppercase shadow-paper-xs animate-bounce flex items-center gap-1.5 z-20 border-2 border-[var(--border-main)]">
              <span>Ready to assist! 🎧</span>
            </div>

            <div className="absolute -inset-4 rounded-full bg-[#FFC400]/25 blur-2xl group-hover:bg-[#FFC400]/45 transition-all pointer-events-none" />

            <img
              src="/mascots/mascot-hero-blue.png"
              alt="Kuma AI Mascot"
              className="w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-300 pointer-events-none"
            />
          </div>
        </div>

      </div>

      {/* 2. DASHBOARD QUICK STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat Card 1: Skill Gap Matrix */}
        <div 
          onClick={() => setActivePage('skill-gap')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#FFC400] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              SKILL GAP ANALYSIS
            </div>
            <div className="text-xl font-extrabold font-heading text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <Target className="h-5 w-5 text-[#FFC400]" />
              <span>GAP MATRIX</span>
            </div>
          </div>
          <Badge variant="yellow" size="sm">ANALYSIS</Badge>
        </div>

        {/* Stat Card 2: Sessions Recorded */}
        <div 
          onClick={() => setActivePage('knowledge-studio')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#2F6BFF] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              SAVED SESSIONS
            </div>
            <div className="text-xl font-extrabold font-heading text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <BookOpen className="h-5 w-5 text-[#2F6BFF]" />
              <span>{lectures.length} SAVED</span>
            </div>
          </div>
          <Badge variant="blue" size="sm">STUDIO</Badge>
        </div>

        {/* Stat Card 3: Saved Notes */}
        <div 
          onClick={() => setActivePage('knowledge-studio')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#FFC400] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              SAVED NOTES
            </div>
            <div className="text-xl font-extrabold font-heading text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-[#FFC400]" />
              <span>{notes.length} DRAFTED</span>
            </div>
          </div>
          <Badge variant="yellow" size="sm">NOTES</Badge>
        </div>

        {/* Stat Card 4: Resources Indexed */}
        <div 
          onClick={() => setActivePage('knowledge-studio')}
          className="p-5 rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--card-bg)] shadow-paper-sm hover:border-[#19B56B] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              INDEXED SOURCES
            </div>
            <div className="text-2xl font-extrabold font-heading text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
              <Mic className="h-5 w-5 text-[#19B56B]" />
              <span>{sources.length} INDEXED</span>
            </div>
          </div>
          <Badge variant="green" size="sm">SOURCES</Badge>
        </div>

      </div>

      {/* 3. ASSIGNED COMPETENCY ASSESSMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[var(--border-main)] pb-3">
          <div>
            <h3 className="font-heading font-extrabold text-xl text-[var(--text-primary)] uppercase flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#9C27B0]" />
              ASSIGNED COMPETENCY ASSESSMENTS
            </h3>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              Evaluate your competency proficiency levels through deterministic structured assessments.
            </p>
          </div>

          <Button
            variant="tertiary"
            size="sm"
            onClick={handleOpenProfile}
            icon={<UserCheck className="h-4 w-4" />}
          >
            View Competency Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              shadow="md"
              className="p-5 bg-[var(--card-bg)] border-2 border-[var(--border-main)] space-y-4 hover:border-[#FFC400] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[var(--border-main)] bg-[#FFC400] text-[#111111]">
                    {quiz.courseName || quiz.courseCode || 'TRAINING PROGRAM'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                    Pass: {quiz.passingScore || 60}%
                  </span>
                </div>

                <h4 className="font-heading font-extrabold text-base text-[var(--text-primary)] leading-tight">
                  {quiz.title}
                </h4>

                <p className="text-xs font-mono text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {quiz.description || quiz.topic}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--border-main)]/60">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-secondary)] font-bold">Target Competency:</span>
                  <span className="font-extrabold text-[#9C27B0] dark:text-[#E040FB]">
                    {quiz.competencyName || 'Data Analysis'}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onOpenAssessment && onOpenAssessment(quiz)}
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="bg-[#FFC400] text-[#111111] font-mono font-extrabold shadow-paper-xs"
                >
                  Start Assessment ({quiz.questionsCount || quiz.questions.length} Qs)
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
