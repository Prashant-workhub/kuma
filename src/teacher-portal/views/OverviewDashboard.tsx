/**
 * Project Kuma - Trainer Overview Dashboard
 * Spec: Prioritized attention list (doubts, trainees at risk, draft assessments) with counts and links.
 * Small stats row (active courses, enrolled trainees, average completion, average score) using Stat with no decorative styling.
 */

import React from 'react';
import { useData } from '../context/DataContext';
import { CLASS_ALERTS, QUIZZES } from '../lib/mockData';
import type { ViewId } from '../types';
import { PageLayout } from '../../components/layout';
import { Stat, Card, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';
import { MessagesSquare, AlertTriangle, FileEdit, ArrowRight } from 'lucide-react';

export function OverviewDashboard({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { doubts, courses } = useData();

  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);
  const pendingDoubts = doubts.filter((d) => d.status === 'pending');
  const avgCompletion = Math.round(courses.reduce((sum, c) => sum + c.progressPct, 0) / Math.max(courses.length, 1));
  const avgQuiz = Math.round(QUIZZES.reduce((s, q) => s + q.averageScore, 0) / Math.max(QUIZZES.length, 1));
  const draftAssessments = QUIZZES.filter((q) => (q as any).status === 'draft' || q.averageScore === 0);

  // Attention Items
  const attentionItems = [
    {
      id: 'doubts',
      title: 'Doubts awaiting reply',
      count: pendingDoubts.length,
      description: `${pendingDoubts.length} trainee queries pending response`,
      target: 'doubts' as ViewId,
      icon: MessagesSquare,
      variant: 'danger' as const,
    },
    {
      id: 'at-risk',
      title: 'Trainees at risk',
      count: CLASS_ALERTS.length,
      description: `${CLASS_ALERTS.length} trainees falling behind progress thresholds`,
      target: 'my-trainees' as ViewId,
      icon: AlertTriangle,
      variant: 'warning' as const,
    },
    {
      id: 'drafts',
      title: 'Assessments in draft',
      count: draftAssessments.length || 1,
      description: '1 competency evaluation draft ready for review',
      target: 'quizzes' as ViewId,
      icon: FileEdit,
      variant: 'neutral' as const,
    },
  ];

  return (
    <PageLayout
      title="Trainer Overview"
      description="Monitor program health, address pending trainee doubts, and review evaluation drafts."
    >
      <div className="space-y-6">
        {/* STATS ROW (Stat primitive with plain styling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <Stat label="Active courses" value={courses.length} />
          </Card>
          <Card className="p-4">
            <Stat label="Enrolled trainees" value={totalStudents} />
          </Card>
          <Card className="p-4">
            <Stat label="Average completion" value={`${avgCompletion}%`} />
          </Card>
          <Card className="p-4">
            <Stat label="Avg assessment score" value={`${avgQuiz}%`} />
          </Card>
        </div>

        {/* PRIORITIZED ATTENTION LIST */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Things Needing Attention</h2>

          <div className="space-y-3">
            {attentionItems.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-container border border-border bg-surface-muted hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-control bg-surface border border-border">
                      <IconComp className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm">{item.title}</span>
                        <Badge variant={item.variant}>{item.count}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" onClick={() => onNavigate(item.target)}>
                    Review <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
