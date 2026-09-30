import React from 'react';
import { Award, ClipboardCheck, Clock3, Target } from 'lucide-react';
import type { Quiz } from '../types';
import { Button, Card, EmptyState, PageHeader, StatusPill } from './ui';

interface AssessmentsViewProps { quizzes: Quiz[]; onStartAssessment: (quiz: Quiz) => void; }

/** A dedicated assessment queue, kept distinct from the growth analytics view. */
export default function AssessmentsView({ quizzes, onStartAssessment }: AssessmentsViewProps) {
  return <div className="space-y-6"><PageHeader title="Assessments" description="Complete assigned assessments and review their requirements." />{quizzes.length === 0 ? <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="No assessments assigned" description="New assessments from your trainer will appear here." /> : <div className="grid gap-4 lg:grid-cols-2">{quizzes.map((quiz) => <Card key={quiz.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-text-primary">{quiz.title}</h2><p className="mt-1 text-sm text-text-secondary">{quiz.description || quiz.topic}</p></div><StatusPill status={quiz.status === 'completed' ? 'completed' : 'not_started'}>{quiz.status === 'completed' ? 'Completed' : 'Available'}</StatusPill></div><div className="mt-5 flex flex-wrap gap-4 text-xs text-text-secondary"><span className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" />{quiz.questionsCount} questions</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{quiz.estimatedTime}</span><span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />{quiz.passingScore ?? 60}% to pass</span></div><div className="mt-5"><Button disabled={quiz.status === 'completed'} onClick={() => onStartAssessment(quiz)}><Award className="h-4 w-4" />{quiz.status === 'completed' ? 'Completed' : 'Start assessment'}</Button></div></Card>)}</div>}</div>;
}
