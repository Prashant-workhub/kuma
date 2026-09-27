import React, { useState } from 'react'
import { ClipboardCheck, Percent, Target, Users, Plus, Award, CheckCircle2, XCircle } from 'lucide-react'
import { COURSES, QUIZZES, TOPIC_ACCURACY } from '../lib/mockData'
import { shortDate } from '../lib/format'
import { cn } from '../lib/cn'
import type { Accent } from '../components/ui/accents'
import { accentText } from '../components/ui/accents'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { BarChart, DonutRing, type ChartDatum } from '../components/ui/Charts'
import { KpiCard } from '../components/ui/KpiCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Quiz, QuizAttemptRecord, CatalogCompetency } from '../../types'
import { INITIAL_COMPETENCY_CATALOG, INITIAL_QUIZZES } from '../../data'
import CreateAssessmentModal from '../../components/CreateAssessmentModal'

const accentFor = (courseCode: string): Accent =>
  COURSES.find((c) => c.courseCode === courseCode)?.accent ?? 'cyan'

const scoreAccent = (v: number): Accent => (v < 60 ? 'rose' : v < 75 ? 'gold' : 'emerald')

const INITIAL_TRAINEE_ATTEMPTS: QuizAttemptRecord[] = [
  {
    id: 'att-1',
    userId: 'st-101',
    userName: 'Ananya Rao',
    quizId: 'quiz-comp-1',
    quizTitle: 'Data Analysis Fundamentals',
    subject: 'Data Analytics & Insights Program',
    topic: 'Data Cleaning & Aggregation',
    competencyId: 'cat-comp-2',
    competencyName: 'Data Analysis & Insights',
    score: 4,
    totalQuestions: 5,
    scorePercentage: 80,
    accuracy: 80,
    passed: true,
    assessedLevel: 'Advanced',
    assessedNumericLevel: 3,
    completedAt: '2026-09-27T14:30:00Z'
  },
  {
    id: 'att-2',
    userId: 'st-102',
    userName: 'Rohit Menon',
    quizId: 'quiz-comp-1',
    quizTitle: 'Data Analysis Fundamentals',
    subject: 'Data Analytics & Insights Program',
    topic: 'Data Cleaning & Aggregation',
    competencyId: 'cat-comp-2',
    competencyName: 'Data Analysis & Insights',
    score: 3,
    totalQuestions: 5,
    scorePercentage: 60,
    accuracy: 60,
    passed: true,
    assessedLevel: 'Intermediate',
    assessedNumericLevel: 2,
    completedAt: '2026-09-26T11:15:00Z'
  },
  {
    id: 'att-3',
    userId: 'st-103',
    userName: 'Sneha Kulkarni',
    quizId: 'quiz-comp-2',
    quizTitle: 'Python Scripting & Automation Assessment',
    subject: 'Python Technical Workshop',
    topic: 'Python Control Flow',
    competencyId: 'cat-comp-1',
    competencyName: 'Python Programming',
    score: 4,
    totalQuestions: 4,
    scorePercentage: 100,
    accuracy: 100,
    passed: true,
    assessedLevel: 'Expert',
    assessedNumericLevel: 4,
    completedAt: '2026-09-27T09:45:00Z'
  }
]

interface QuizPerformanceProps {
  customQuizzes?: Quiz[]
  customAttempts?: QuizAttemptRecord[]
  catalog?: CatalogCompetency[]
  onAddQuiz?: (quiz: Quiz) => void
}

export function QuizPerformance({
  customQuizzes,
  customAttempts,
  catalog = INITIAL_COMPETENCY_CATALOG,
  onAddQuiz
}: QuizPerformanceProps) {
  const [quizzesList, setQuizzesList] = useState<Quiz[]>(
    customQuizzes && customQuizzes.length > 0 ? customQuizzes : INITIAL_QUIZZES
  )
  const [attemptsList] = useState<QuizAttemptRecord[]>(
    customAttempts && customAttempts.length > 0 ? customAttempts : INITIAL_TRAINEE_ATTEMPTS
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCreateQuiz = (newQuiz: Quiz) => {
    setQuizzesList([newQuiz, ...quizzesList])
    if (onAddQuiz) {
      onAddQuiz(newQuiz)
    }
  }

  const totalQuizzesCount = quizzesList.length + QUIZZES.length
  const totalAttemptsCount = attemptsList.length + QUIZZES.reduce((s, q) => s + q.attempts, 0)
  const avgScore = Math.round(
    [...attemptsList.map((a) => a.scorePercentage || a.accuracy), ...QUIZZES.map((q) => q.averageScore)].reduce(
      (s, v) => s + v,
      0
    ) / Math.max(1, attemptsList.length + QUIZZES.length)
  )

  const accuracyData: ChartDatum[] = TOPIC_ACCURACY.map((t) => ({
    label: t.topic,
    value: t.accuracy,
    accent: scoreAccent(t.accuracy),
  }))

  return (
    <div className="space-y-6">
      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        catalog={catalog}
        onCreateQuiz={handleCreateQuiz}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeading
          eyebrow="Competency Assessments"
          title="Assessment performance & Trainee Results"
          subtitle="Cohort averages, target competency mapping, and individual trainee assessment records."
        />
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-[6px] border-2 border-[var(--border-main)] bg-[#FFC400] px-4 py-2.5 font-mono text-xs font-bold text-[#111111] shadow-paper-xs hover:bg-[#FFB300] transition-colors shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Create Competency Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Avg assessment score" value={`${avgScore}%`} icon={<ClipboardCheck size={18} />} accent="cyan" delta="+5 pts" deltaDir="up" />
        <KpiCard label="Competencies mapped" value={catalog.filter(c => c.isActive !== false).length} icon={<Target size={18} />} accent="violet" />
        <KpiCard label="Total attempts" value={totalAttemptsCount} icon={<Users size={18} />} accent="gold" />
        <KpiCard label="Active assessments" value={totalQuizzesCount} icon={<Award size={18} />} accent="emerald" />
      </div>

      {/* Competency Assessments List */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-sm uppercase text-ink tracking-wider flex items-center gap-2">
          <Target size={16} className="text-brand-cyan" />
          ACTIVE COMPETENCY ASSESSMENTS ({quizzesList.length})
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzesList.map((q) => (
            <Card key={q.id} hover className="p-4 space-y-3 border-2 border-line">
              <div className="flex items-center justify-between">
                <CodePill className={cn(accentText['cyan'])}>{q.courseCode || 'TRN-2026'}</CodePill>
                <span className="text-[10px] font-mono text-muted">Pass: {q.passingScore || 60}%</span>
              </div>

              <div>
                <h4 className="font-display font-bold text-sm text-ink">{q.title}</h4>
                <p className="text-xs text-muted font-mono mt-1 line-clamp-2">{q.description || q.topic}</p>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted">Target Competency:</span>
                <span className="font-bold text-brand-purple">{q.competencyName || 'Data Analysis'}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trainee Assessment Results Table */}
      <Card padded className="space-y-4">
        <div className="border-b border-line pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-base uppercase text-ink">TRAINEE ASSESSMENT RESULTS</h3>
            <p className="text-xs font-mono text-muted">Empirical competency assessment scores & assessed proficiency levels.</p>
          </div>
          <span className="text-xs font-mono font-bold text-muted">{attemptsList.length} Attempt Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-line text-muted uppercase text-[10px]">
                <th className="py-2.5 px-3">Trainee Name</th>
                <th className="py-2.5 px-3">Assessment Title</th>
                <th className="py-2.5 px-3">Target Competency</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Assessed Level</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attemptsList.map((att) => (
                <tr key={att.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-3 font-bold text-ink">{att.userName}</td>
                  <td className="py-3 px-3 text-ink">{att.quizTitle}</td>
                  <td className="py-3 px-3 font-bold text-brand-purple">{att.competencyName}</td>
                  <td className="py-3 px-3 text-center font-bold text-ink">
                    {att.scorePercentage}% ({att.score}/{att.totalQuestions})
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/40">
                      {att.assessedLevel || 'Intermediate'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      att.passed !== false ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                    }`}>
                      {att.passed !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {att.passed !== false ? 'PASSED' : 'NOT PASSED'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-muted text-[11px]">
                    {att.completedAt ? shortDate(att.completedAt) : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
