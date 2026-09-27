import { useState, type ReactNode } from 'react'
import { BookOpen, Check, ChevronDown, ClipboardList, GraduationCap, Users, Layers, X, Edit3 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { INITIAL_COMPETENCY_CATALOG } from '../../data'
import { cn } from '../lib/cn'
import type { TeacherAssignment, ViewId } from '../types'
import { CodePill } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionHeading } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { accentBgSoft, accentBorder, accentText } from '../components/ui/accents'

export function MyCourses({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { courses } = useData()

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Programs"
        title="Training Programs"
        subtitle={`${courses.length} active training programs · ${courses.reduce((s, c) => s + c.students, 0)} trainees enrolled`}
        action={
          <Button variant="secondary" size="sm" iconLeft={<ClipboardList size={15} />} onClick={() => onNavigate('progress')}>
            Progress board
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} index={i} />
        ))}
      </div>
    </div>
  )
}

function CourseCard({ course, index }: { course: TeacherAssignment; index: number }) {
  const { toggleSyllabusItem, updateCourseCompetencies } = useData()
  const { push } = useToast()
  const [open, setOpen] = useState(true)
  const [showCompetencyModal, setShowCompetencyModal] = useState(false)

  const done = course.syllabus.filter((s) => s.done).length
  const total = course.syllabus.length

  const mappedCompNames = course.competencyNames || []

  const toggle = (itemId: string, title: string, wasDone: boolean) => {
    toggleSyllabusItem(course.id, itemId)
    if (!wasDone) {
      push({ variant: 'success', title: 'Topic marked complete', description: `${title} · ${course.courseCode}` })
    }
  }

  return (
    <>
      <Card
        hover
        padded={false}
        className="animate-fade-up overflow-hidden"
      >
        <div style={{ animationDelay: `${index * 70}ms` }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl', accentBgSoft[course.accent], accentText[course.accent])}>
                <BookOpen size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CodePill className={cn(accentText[course.accent], accentBorder[course.accent])}>{course.courseCode}</CodePill>
                  <span className="text-xs text-faint">{course.semester}</span>
                </div>
                <h3 className="mt-1 font-display text-base font-semibold text-ink">{course.courseName}</h3>
                <p className="text-sm text-muted">{course.subject}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Layers size={14} />}
              onClick={() => setShowCompetencyModal(true)}
              className="shrink-0 text-xs"
            >
              Competencies
            </Button>
          </div>

          {/* Associated Competencies Badges */}
          <div className="px-5 pb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted mb-1 font-mono">
              <Layers size={12} className="text-purple-500" />
              <span>Mapped Competencies:</span>
            </div>
            {mappedCompNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {mappedCompNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-purple-500/10 text-purple-600 border border-purple-500/30"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-faint italic font-mono">No competencies associated yet.</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 px-5 pt-3">
            <Stat icon={<Users size={15} />} label="Students" value={String(course.students)} />
            <Stat icon={<GraduationCap size={15} />} label="Syllabus" value={`${done}/${total}`} />
          </div>

          {/* Completion */}
          <div className="px-5 pt-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">Course completion</span>
              <span className="metric text-ink">{course.completionRate}%</span>
            </div>
            <ProgressBar value={course.completionRate} accent={course.accent} />
          </div>

          {/* Syllabus checklist */}
          <div className="mt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="flex w-full items-center justify-between px-5 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <ClipboardList size={16} className="text-faint" />
                Syllabus checklist
              </span>
              <ChevronDown size={16} className={cn('text-faint transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
              <ul className="space-y-1 px-3 pb-4">
                {course.syllabus.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggle(s.id, s.title, s.done)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-panel"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          s.done ? cn(accentText[course.accent], accentBgSoft[course.accent], 'border-current') : 'border-line text-transparent',
                        )}
                      >
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span className={cn('text-sm transition-colors', s.done ? 'text-muted line-through' : 'text-ink')}>
                        {s.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* MANAGE COMPETENCIES MODAL */}
      {showCompetencyModal && (
        <ManageCompetenciesModal
          course={course}
          onClose={() => setShowCompetencyModal(false)}
          onSave={(selectedIds, selectedNames) => {
            updateCourseCompetencies(course.id, selectedIds, selectedNames)
            push({
              variant: 'success',
              title: 'Competency Mapping Saved',
              description: `Associated ${selectedIds.length} competencies with ${course.courseCode}`,
            })
            setShowCompetencyModal(false)
          }}
        />
      )}
    </>
  )
}

function ManageCompetenciesModal({
  course,
  onClose,
  onSave,
}: {
  course: TeacherAssignment
  onClose: () => void
  onSave: (selectedIds: string[], selectedNames: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(course.competencyIds || [])

  const toggleCompetency = (id: string, isActive: boolean) => {
    if (!isActive) return // Rule: Inactive competencies cannot be assigned
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    // Only accept active competencies
    const activeCatalogMap = new Map(INITIAL_COMPETENCY_CATALOG.filter((c) => c.isActive).map((c) => [c.id, c.name]))
    const validIds = selectedIds.filter((id) => activeCatalogMap.has(id))
    const validNames = validIds.map((id) => activeCatalogMap.get(id) as string)

    onSave(validIds, validNames)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Manage Competencies: {course.courseCode}
            </h3>
            <p className="text-xs text-muted">
              Associate active catalog competencies with this training program.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* Competency Selection List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {INITIAL_COMPETENCY_CATALOG.map((catComp) => {
            const isChecked = selectedIds.includes(catComp.id)
            const isActive = catComp.isActive !== false

            return (
              <label
                key={catComp.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer',
                  !isActive
                    ? 'opacity-50 bg-panel/30 border-line cursor-not-allowed'
                    : isChecked
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-line hover:bg-panel/70'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!isActive}
                    onChange={() => toggleCompetency(catComp.id, isActive)}
                    className="h-4 w-4 rounded border-line text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-semibold text-ink flex items-center gap-2">
                      <span>{catComp.name}</span>
                      {!isActive && (
                        <span className="text-[10px] font-mono text-amber-500 border border-amber-500/40 px-1.5 py-0.2 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-faint">{catComp.category} • {catComp.description}</div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-muted font-mono">
            Selected: <span className="font-bold text-purple-500">{selectedIds.length}</span> Competencies
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Mapping
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-faint">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="metric mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  )
}

