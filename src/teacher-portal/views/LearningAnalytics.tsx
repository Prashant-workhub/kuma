import React, { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Grid3x3, Minus, Target, TrendingUp } from 'lucide-react'
import { COHORT } from '../lib/mockData'
import { cn } from '../lib/cn'
import type { CohortStudent } from '../types'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { calculateSkillGap, LEVEL_TO_NUMERIC, NUMERIC_TO_LEVEL } from '../../utils/competencyUtils'
import { SkillProficiencyLevel, TraineeCompetency } from '../../types'

const topics = Object.keys(COHORT[0]?.scores ?? {})

const cellClass = (v: number): string => {
  if (v >= 85) return 'bg-brand-emerald/20 text-brand-emerald'
  if (v >= 70) return 'bg-brand-cyan/15 text-brand-cyan'
  if (v >= 60) return 'bg-brand-gold/15 text-brand-gold'
  return 'bg-brand-rose/20 text-brand-rose'
}

function TrendGlyph({ trend }: { trend: CohortStudent['trend'] }) {
  if (trend === 'up') return <ArrowUpRight size={15} className="text-brand-emerald" />
  if (trend === 'down') return <ArrowDownRight size={15} className="text-brand-rose" />
  return <Minus size={15} className="text-muted" />
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

interface TraineeGapRecord {
  id: string
  traineeName: string
  competency: string
  currentLevel: SkillProficiencyLevel
  currentNumericLevel: 1 | 2 | 3 | 4
  currentSource: 'Assessed' | 'Declared'
  targetLevel: SkillProficiencyLevel
  targetNumericLevel: 1 | 2 | 3 | 4
  gap: number
  status: string
  priority: string
}

const INITIAL_TRAINEE_GAPS: TraineeGapRecord[] = [
  {
    id: 'gap-1',
    traineeName: 'Ananya Rao',
    competency: 'Data Analysis & Insights',
    currentLevel: 'Advanced',
    currentNumericLevel: 3,
    currentSource: 'Assessed',
    targetLevel: 'Expert',
    targetNumericLevel: 4,
    gap: 1,
    status: 'Development Needed',
    priority: 'Medium'
  },
  {
    id: 'gap-2',
    traineeName: 'Rohit Menon',
    competency: 'Python Programming',
    currentLevel: 'Beginner',
    currentNumericLevel: 1,
    currentSource: 'Declared',
    targetLevel: 'Advanced',
    targetNumericLevel: 3,
    gap: 2,
    status: 'Significant Development Needed',
    priority: 'High'
  },
  {
    id: 'gap-3',
    traineeName: 'Sneha Kulkarni',
    competency: 'Digital Literacy & Tech Adoption',
    currentLevel: 'Expert',
    currentNumericLevel: 4,
    currentSource: 'Assessed',
    targetLevel: 'Advanced',
    targetNumericLevel: 3,
    gap: 0,
    status: 'Meets Target',
    priority: 'Low'
  },
  {
    id: 'gap-4',
    traineeName: 'Trainee Learner',
    competency: 'Public Policy Implementation',
    currentLevel: 'Intermediate',
    currentNumericLevel: 2,
    currentSource: 'Declared',
    targetLevel: 'Expert',
    targetNumericLevel: 4,
    gap: 2,
    status: 'Significant Development Needed',
    priority: 'High'
  }
]

export function LearningAnalytics() {
  const [traineeGaps, setTraineeGaps] = useState(INITIAL_TRAINEE_GAPS)

  const handleUpdateTarget = (id: string, newTarget: SkillProficiencyLevel) => {
    setTraineeGaps((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g
        const dummyComp: TraineeCompetency = {
          id: g.id,
          name: g.competency,
          level: g.currentLevel,
          numericLevel: g.currentNumericLevel,
          latestAssessedLevel: g.currentSource === 'Assessed' ? g.currentLevel : undefined,
          latestAssessedNumericLevel: g.currentSource === 'Assessed' ? g.currentNumericLevel : undefined,
          targetLevel: newTarget,
          targetNumericLevel: LEVEL_TO_NUMERIC[newTarget]
        }
        const res = calculateSkillGap(dummyComp)
        return {
          ...g,
          targetLevel: newTarget,
          targetNumericLevel: LEVEL_TO_NUMERIC[newTarget],
          gap: res.gap,
          status: res.status,
          priority: res.priority
        }
      })
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Cohort & Skill Gaps"
        title="Trainee Learning & Skill Gap Analytics"
        subtitle="Rule-based skill gap evaluation comparing current assessed/declared levels against target competency levels."
      />

      {/* Trainee Skill Gap Table */}
      <Card padded={false}>
        <div className="border-b border-line p-5 flex items-center justify-between">
          <SectionHeading
            eyebrow="Phase 3D"
            title="Trainee Skill Gap Analysis Matrix"
            icon={<Target size={18} className="text-brand-purple" />}
            subtitle="Current level (Assessed preferred, Declared fallback) vs Target level."
          />
          <span className="font-mono text-xs font-bold text-muted">{traineeGaps.length} Trainees Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm font-mono">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11px] uppercase">
                <th className="px-5 py-3 font-medium">Trainee</th>
                <th className="px-4 py-3 font-medium">Competency</th>
                <th className="px-4 py-3 text-center font-medium">Current Level</th>
                <th className="px-4 py-3 text-center font-medium">Required Level</th>
                <th className="px-4 py-3 text-center font-medium">Gap</th>
                <th className="px-4 py-3 font-medium">Recommended Training</th>
                <th className="px-5 py-3 text-right font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {traineeGaps.map((item) => {
                // Map competency to active course
                let recommendedTraining = '';
                let isCoverageGap = false;

                if (item.gap === 0) {
                  recommendedTraining = 'Target Level Met';
                } else if (item.competency.includes('Data Analysis')) {
                  recommendedTraining = 'Advanced Data Analytics & Insights (DA101)';
                } else if (item.competency.includes('Python')) {
                  recommendedTraining = 'Python Scripting & Core Algorithms (CS301)';
                } else if (item.competency.includes('Communication')) {
                  recommendedTraining = 'Professional Communication & Reporting (CM103)';
                } else {
                  isCoverageGap = true;
                  recommendedTraining = 'Training coverage gap';
                }

                return (
                  <tr key={item.id} className="border-b border-line last:border-0 hover:bg-panel/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={initials(item.traineeName)} size="sm" accent="cyan" />
                        <span>{item.traineeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-brand-purple">{item.competency}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-ink">{item.currentLevel}</span>
                        <span className="text-[9px] text-muted">{item.currentSource}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select
                        value={item.targetLevel}
                        onChange={(e) => handleUpdateTarget(item.id, e.target.value as SkillProficiencyLevel)}
                        className="rounded border border-line bg-card px-2 py-1 text-xs font-bold text-ink outline-none cursor-pointer"
                      >
                        {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center font-black text-ink">
                      <span className={cn('metric px-2 py-0.5 rounded', item.gap === 0 ? 'text-brand-emerald bg-brand-emerald/15' : 'text-brand-rose bg-brand-rose/15')}>
                        {item.gap} {item.gap === 1 ? 'Level' : 'Levels'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {item.gap === 0 ? (
                        <span className="text-brand-emerald text-xs">Target Level Met</span>
                      ) : isCoverageGap ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brand-rose/15 text-brand-rose border border-brand-rose/30">
                          Training Coverage Gap
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-brand-purple">{recommendedTraining}</div>
                          <div className="text-[10px] text-muted font-normal">Addresses {item.competency} gap ({item.currentLevel} ➔ {item.targetLevel})</div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase',
                        item.priority === 'Low' ? 'bg-panel text-muted' : item.priority === 'Medium' ? 'bg-brand-gold text-[#111]' : 'bg-brand-rose text-white'
                      )}>
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cohort Score Matrix */}
      <Card padded={false}>
        <div className="border-b border-line p-5">
          <SectionHeading
            eyebrow="CS301 · Data Structures"
            title="Cohort score matrix"
            icon={<Grid3x3 size={18} className="text-brand-cyan" />}
            subtitle="Topic mastery per student (0–100)."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-card px-5 py-3 text-left font-medium text-muted">Student</th>
                {topics.map((t) => (
                  <th key={t} className="px-3 py-3 text-center font-mono text-[11px] uppercase tracking-wide text-faint">
                    {t}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-muted">Overall</th>
              </tr>
            </thead>
            <tbody>
              {COHORT.map((student) => (
                <tr key={student.id} className="border-b border-line last:border-0 transition-colors hover:bg-panel/40">
                  <td className="sticky left-0 z-10 bg-card px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={initials(student.name)} size="sm" accent="cyan" />
                      <span className="whitespace-nowrap text-sm font-medium text-ink">{student.name}</span>
                    </div>
                  </td>
                  {topics.map((t) => {
                    const v = student.scores[t] ?? 0
                    return (
                      <td key={t} className="px-3 py-3 text-center">
                        <span className={cn('metric inline-flex h-9 w-11 items-center justify-center rounded-lg text-xs font-semibold', cellClass(v))}>
                          {v}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="metric text-sm font-semibold text-ink">{student.overall}</span>
                      <TrendGlyph trend={student.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PHASE 3F: TRAINEE COMPLETION & CERTIFICATE RECORDS TABLE FOR TRAINERS */}
      <Card padded={false} className="overflow-hidden space-y-3">
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h3 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <Target size={16} className="text-[#9C27B0]" />
              Trainee Training Completion & Certificate Records
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Real-time progress, completion timestamps, and certificate verification records.
            </p>
          </div>
          <CodePill className="text-purple-500 border-purple-500/40">Phase 3F Credentials</CodePill>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel/50">
                <th className="px-5 py-3 font-medium text-muted">Trainee</th>
                <th className="px-4 py-3 font-medium text-muted">Training Program</th>
                <th className="px-4 py-3 font-medium text-muted">Progress</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Completion Date</th>
                <th className="px-4 py-3 font-medium text-muted">Certificate ID</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line last:border-0 hover:bg-panel/40">
                <td className="px-5 py-3 font-medium text-ink">Ananya Rao</td>
                <td className="px-4 py-3 text-muted">Advanced Data Analytics & Insights (DA101)</td>
                <td className="px-4 py-3 metric font-semibold text-emerald-500">100%</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-faint">2026-09-25</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-purple-500">KUMA-2026-DA10199X</td>
              </tr>
              <tr className="border-b border-line last:border-0 hover:bg-panel/40">
                <td className="px-5 py-3 font-medium text-ink">Rohit Menon</td>
                <td className="px-4 py-3 text-muted">Python Scripting & Core Algorithms (CS301)</td>
                <td className="px-4 py-3 metric font-semibold text-amber-500">68%</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    In Progress
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-faint">—</td>
                <td className="px-4 py-3 text-xs text-faint">Pending Completion</td>
              </tr>
              <tr className="border-b border-line last:border-0 hover:bg-panel/40">
                <td className="px-5 py-3 font-medium text-ink">Sneha Kulkarni</td>
                <td className="px-4 py-3 text-muted">Digital Transformation & Cloud Workflows (DT100)</td>
                <td className="px-4 py-3 metric font-semibold text-amber-500">30%</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    In Progress
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-faint">—</td>
                <td className="px-4 py-3 text-xs text-faint">Pending Completion</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
