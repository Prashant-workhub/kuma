import React from 'react';
import { BookOpen, CheckCircle2, Clock3, Compass, PlayCircle } from 'lucide-react';
import type { UserSettings } from '../types';
import { Button, Card, PageHeader, ProgressBar, StatusPill } from './ui';

interface MyLearningViewProps { settings: UserSettings; onFindTrainer: () => void; onViewGrowth: () => void; }

/** A dedicated learner workspace, intentionally separate from trainer discovery. */
export default function MyLearningView({ settings, onFindTrainer, onViewGrowth }: MyLearningViewProps) {
  const learnerName = settings.profile.fullName || 'Trainee Learner';
  return <div className="space-y-6"><PageHeader title="My Learning" description={`Your active training plan and progress, ${learnerName}.`} primaryAction={<Button onClick={onFindTrainer}><Compass className="h-4 w-4" /> Explore training</Button>} /><Card className="p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="rounded-xl bg-primary-subtle p-3 text-primary"><BookOpen className="h-6 w-6" /></div><div><div className="flex items-center gap-2"><h2 className="font-semibold text-text-primary">Cloud Native Foundations</h2><StatusPill status="in_progress">In progress</StatusPill></div><p className="mt-1 text-sm text-text-secondary">Next: Kubernetes workloads and deployment strategies.</p></div></div><Button variant="secondary" onClick={onViewGrowth}><PlayCircle className="h-4 w-4" /> Continue</Button></div><div className="mt-6 max-w-2xl"><ProgressBar value={62} label="Program completion" showLabel /></div></Card><div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><div className="flex items-center gap-2 text-text-primary"><Clock3 className="h-4 w-4 text-primary" /><h2 className="font-semibold">Up next</h2></div><p className="mt-3 text-sm text-text-secondary">Complete the container orchestration module to unlock the practical assessment.</p></Card><Card className="p-5"><div className="flex items-center gap-2 text-text-primary"><CheckCircle2 className="h-4 w-4 text-success" /><h2 className="font-semibold">Completed</h2></div><p className="mt-3 text-sm text-text-secondary">Linux essentials and Docker fundamentals are complete.</p></Card></div></div>;
}
