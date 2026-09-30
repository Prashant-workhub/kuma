import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarCheck, CalendarClock, GaugeCircle, PlayCircle, Users, Clock, AlertOctagon, CheckCircle, HelpCircle } from 'lucide-react'
import { COURSES, MODULES } from '../lib/mockData'
import { cn } from '../lib/cn'
import type { Accent } from '../components/ui/accents'
import { accentText } from '../components/ui/accents'
import { CodePill } from '../components/ui/Badge'
import { Card, SectionHeading } from '../components/ui/Card'
import { KpiCard } from '../components/ui/KpiCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Segmented, type SegmentOption } from '../components/ui/Segmented'
import { useAuth } from '../context/AuthContext'
import { isDemoTrainerIdentity, DEMO_TRAINEES } from '../../utils/demoDataSeeder'
import { subscribeTrainerEnrollments, subscribeTrainerAssessmentAttempts } from '../../services/capacityConnectService'
import { TrainingEnrollment, QuizAttemptRecord } from '../../types'
import { useData } from '../context/DataContext'

const accentFor = (courseCode: string): Accent =>
  COURSES.find((c) => c.courseCode === courseCode)?.accent ?? 'cyan'

type Filter = string // 'all' | courseCode

interface TraineeRosterItem {
  id: string
  traineeId: string
  traineeName: string
  courseCode: string
  courseName: string
  progress: number
  lastActive: string
  daysInactive: number
  stuckModule: string
  assessmentAttemptsCount: number
  bestScorePercentage: number | null
  passed: boolean | null
  isAtRisk: boolean
}

export function CourseProgress() {
  const { profile } = useAuth()
  const { courses } = useData()
  const isDemoTrainer = isDemoTrainerIdentity(profile?.id, profile?.email)
  const [filter, setFilter] = useState<Filter>('all')
  const [atRiskDays, setAtRiskDays] = useState<number>(7)
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([])
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([])
  const [loading, setLoading] = useState(!isDemoTrainer)

  useEffect(() => {
    if (isDemoTrainer || !profile?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    let enrLoaded = false
    let attLoaded = false
    const finish = () => { if (enrLoaded && attLoaded) setLoading(false) }

    const unsubEnr = subscribeTrainerEnrollments(
      profile.id,
      (recs) => {
        setEnrollments(recs)
        enrLoaded = true
        finish()
      },
      (err) => {
        console.warn('Enrollment subscription failed in CourseProgress:', err)
        setEnrollments([])
        enrLoaded = true
        finish()
      }
    )

    const unsubAtt = subscribeTrainerAssessmentAttempts(
      profile.id,
      (recs) => {
        setAttempts(recs)
        attLoaded = true
        finish()
      },
      (err) => {
        console.warn('Attempts subscription failed in CourseProgress:', err)
        setAttempts([])
        attLoaded = true
        finish()
      }
    )

    return () => {
      unsubEnr()
      unsubAtt()
    }
  }, [profile?.id, isDemoTrainer])

  const courseCodes = useMemo(() => Array.from(new Set(MODULES.map((m) => m.courseCode))), [])
  const filtered = filter === 'all' ? MODULES : MODULES.filter((m) => m.courseCode === filter)

  const conducted = filtered.reduce((s, m) => s + m.lecturesConducted, 0)
  const totalLectures = filtered.reduce((s, m) => s + m.lecturesTotal, 0)
  const remaining = totalLectures - conducted
  const avgCompletion = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.completion, 0) / filtered.length)
    : 0

  const options: SegmentOption<Filter>[] = [
    { value: 'all', label: 'All courses' },
    ...courseCodes.map((c) => ({ value: c, label: c })),
  ]

  // Construct Trainee Participation Roster
  const rosterItems = useMemo<TraineeRosterItem[]>(() => {
    const nowMs = Date.now()

    if (isDemoTrainer) {
      // Build demo roster items
      return DEMO_TRAINEES.map((t, idx) => {
        const enr = t.enrollments[0]
        const courseCode = enr?.courseCode || 'REACT101'
        const courseName = enr?.courseName || 'Advanced React Development'
        const progress = enr?.completionRate ?? (idx % 2 === 0 ? 45 : 80)
        const lastActiveIso = enr?.enrolledAt || new Date(nowMs - (idx * 3 + 1) * 86400000).toISOString()
        const daysInactive = Math.floor((nowMs - new Date(lastActiveIso).getTime()) / (1000 * 60 * 60 * 24))
        const stuckModule = progress < 100 ? (progress < 50 ? 'Module 1: Fundamentals' : 'Module 3: Optimization') : 'Completed'
        const isAtRisk = daysInactive >= atRiskDays && progress < 100

        return {
          id: `demo-roster-${idx}`,
          traineeId: t.uid,
          traineeName: t.fullName,
          courseCode,
          courseName,
          progress,
          lastActive: lastActiveIso,
          daysInactive,
          stuckModule,
          assessmentAttemptsCount: idx % 2 === 0 ? 1 : 2,
          bestScorePercentage: idx % 2 === 0 ? 80 : 92,
          passed: true,
          isAtRisk
        }
      })
    }

    return enrollments.map((enr) => {
      const traineeAttempts = attempts.filter(a => a.userId === enr.userId && (a.trainingProgramId === enr.courseId || a.quizId === enr.courseId))
      const attemptsCount = traineeAttempts.length
      const bestAttempt = traineeAttempts.length > 0
        ? traineeAttempts.reduce((max, current) => (current.scorePercentage || current.accuracy) > (max.scorePercentage || max.accuracy) ? current : max)
        : null

      const lastActiveIso = enr.updatedAt || enr.enrolledAt || enr.completedAt || new Date().toISOString()
      const daysInactive = Math.floor((nowMs - new Date(lastActiveIso).getTime()) / (1000 * 60 * 60 * 24))
      const isAtRisk = daysInactive >= atRiskDays && enr.status !== 'completed'

      // Find stuck module from moduleProgress map
      let stuckModule = 'Completed'
      if (enr.status !== 'completed' && enr.moduleProgress) {
        const incompleteKeys = Object.keys(enr.moduleProgress).filter(k => !enr.moduleProgress[k])
        if (incompleteKeys.length > 0) {
          const matchedCourse = courses.find(c => c.id === enr.courseId || c.courseCode === enr.courseCode)
          const matchedSyllabus = matchedCourse?.syllabus?.find(s => s.id === incompleteKeys[0])
          stuckModule = matchedSyllabus?.title || `Module ${incompleteKeys[0]}`
        } else {
          stuckModule = 'Assessment Pending'
        }
      }

      return {
        id: enr.id,
        traineeId: enr.userId,
        traineeName: enr.userName || 'Trainee Learner',
        courseCode: enr.courseCode,
        courseName: enr.courseName,
        progress: enr.completionRate,
        lastActive: lastActiveIso,
        daysInactive,
        stuckModule,
        assessmentAttemptsCount: attemptsCount,
        bestScorePercentage: bestAttempt ? (bestAttempt.scorePercentage || bestAttempt.accuracy) : null,
        passed: bestAttempt ? bestAttempt.passed : null,
        isAtRisk
      }
    })
  }, [isDemoTrainer, enrollments, attempts, courses, atRiskDays])

  const filteredRoster = filter === 'all' ? rosterItems : rosterItems.filter(r => r.courseCode === filter)
  const atRiskCount = filteredRoster.filter(r => r.isAtRisk).length

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery"
        title="Program Delivery Progress"
        subtitle="Module completion, sessions delivered, and where trainees need assistance."
        action={<Segmented options={options} value={filter} onChange={setFilter} ariaLabel="Filter by program" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Lectures conducted" value={conducted} icon={<CalendarCheck size={18} />} accent="emerald" hint={`of ${totalLectures} planned`} delta={`${remaining} remaining`} deltaDir="flat" />
        <KpiCard label="Lectures remaining" value={remaining} icon={<CalendarClock size={18} />} accent="gold" hint="Across active units" />
        <KpiCard label="Avg module completion" value={`${avgCompletion}%`} icon={<GaugeCircle size={18} />} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filtered.map((m, i) => {
          const accent = accentFor(m.courseCode)
          const remainingLectures = m.lecturesTotal - m.lecturesConducted
          return (
            <Card key={m.id} hover className="animate-fade-up" padded>
              <div style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CodePill className={cn(accentText[accent])}>{m.courseCode}</CodePill>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{m.unit}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-semibold text-ink">{m.title}</h3>
                  </div>
                  <span className={cn('metric text-2xl font-semibold', accentText[accent])}>{m.completion}%</span>
                </div>

                <div className="mt-3">
                  <ProgressBar value={m.completion} accent={accent} />
                </div>

                {/* Lecture pips */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: m.lecturesTotal }).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          idx < m.lecturesConducted ? accentText[accent] : 'text-line',
                        )}
                        style={{ backgroundColor: 'currentColor' }}
                      />
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <PlayCircle size={14} className={accentText[accent]} />
                    <span className="metric text-ink">{m.lecturesConducted}</span> of {m.lecturesTotal} · {remainingLectures} left
                  </span>
                </div>

                {/* Weak topics */}
                {m.weakTopics.length > 0 && (
                  <div className="mt-4 rounded-xl border border-brand-rose/20 bg-brand-rose/[0.06] p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-rose">
                      <AlertTriangle size={13} />
                      Weak topics flagged
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.weakTopics.map((t) => (
                        <span key={t} className="rounded-md border border-brand-rose/20 bg-canvas/40 px-2 py-0.5 text-[11px] text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Trainee Course Participation & Performance Monitoring Dashboard */}
      <Card padded className="space-y-4">
        <div className="border-b border-line pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-brand-cyan" />
              <h3 className="font-heading font-extrabold text-base uppercase text-ink">Trainee Participation & Performance Monitoring</h3>
            </div>
            <p className="text-xs font-mono text-muted mt-0.5">
              Live per-trainee progress, stuck module detection, assessment scores, and inactivity flags.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted bg-panel px-3 py-1.5 rounded-lg border border-line">
              <Clock size={14} className="text-brand-gold" />
              <span>At-risk if inactive &gt;</span>
              <input
                type="number"
                min={1}
                max={30}
                value={atRiskDays}
                onChange={(e) => setAtRiskDays(Math.max(1, Number(e.target.value) || 7))}
                className="w-12 px-1 py-0.5 text-center font-bold bg-card border border-line rounded text-ink outline-none"
              />
              <span>days</span>
            </div>
            {atRiskCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/20 text-rose-500 border border-rose-500/40">
                <AlertOctagon size={13} />
                {atRiskCount} At Risk
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm font-mono text-muted">Loading live participation roster…</div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-8 text-center text-sm font-mono text-muted">No trainees enrolled in this program yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-line text-muted uppercase text-[10px]">
                  <th className="py-3 px-3">Trainee</th>
                  <th className="py-3 px-3">Program</th>
                  <th className="py-3 px-3 text-center">Progress %</th>
                  <th className="py-3 px-3">Module Stuck On</th>
                  <th className="py-3 px-3 text-center">Quiz Attempts & Score</th>
                  <th className="py-3 px-3 text-center">Last Active</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRoster.map((item) => (
                  <tr key={item.id} className={cn('transition-colors hover:bg-panel/40', item.isAtRisk && 'bg-rose-500/[0.04]')}>
                    <td className="py-3.5 px-3 font-bold text-ink">
                      <div>{item.traineeName}</div>
                      <div className="text-[10px] font-normal text-muted">UID: {item.traineeId.substring(0, 10)}…</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-brand-cyan">
                      {item.courseCode}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1 w-20">
                        <span className="font-bold text-ink">{item.progress}%</span>
                        <ProgressBar value={item.progress} accent={item.progress === 100 ? 'emerald' : 'cyan'} />
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={cn('text-xs font-semibold', item.stuckModule === 'Completed' ? 'text-brand-emerald' : 'text-brand-gold')}>
                        {item.stuckModule}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      {item.bestScorePercentage !== null ? (
                        <div className="flex flex-col items-center">
                          <span className={cn('metric font-bold', item.passed ? 'text-emerald-500' : 'text-rose-500')}>
                            {item.bestScorePercentage}%
                          </span>
                          <span className="text-[10px] text-muted font-normal">
                            {item.assessmentAttemptsCount} attempt{item.assessmentAttemptsCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted font-normal text-[11px]">No attempts</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center text-muted text-[11px]">
                      <div>{new Date(item.lastActive).toLocaleDateString()}</div>
                      <div className="text-[9px] text-faint">{item.daysInactive} days ago</div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {item.isAtRisk ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-500 border border-rose-500/40">
                          <AlertOctagon size={11} />
                          At Risk
                        </span>
                      ) : item.progress === 100 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                          <CheckCircle size={11} />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-500 border border-cyan-500/40">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
