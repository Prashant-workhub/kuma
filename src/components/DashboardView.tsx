/**
 * Project Kuma Capacity Connect - Learner-First Trainee Dashboard
 * Modern, clean, and friendly learning portal.
 */

import React from 'react';
import { PageId, Lecture, Note, Source, Quiz, UserSettings } from '../types';
import TraineeHome from './TraineeHome';

interface DashboardViewProps {
  setActivePage: (page: PageId) => void;
  lectures?: Lecture[];
  sources?: Source[];
  onNewAnalysis?: () => void;
  onOpenLecture?: (lectureId: string) => void;
  theme?: 'light' | 'dark';
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
  return (
    <TraineeHome
      setActivePage={setActivePage}
      settings={settings}
      onOpenLecture={onOpenLecture}
      quizzes={quizzes}
      onOpenAssessment={onOpenAssessment}
    />
  );
}
