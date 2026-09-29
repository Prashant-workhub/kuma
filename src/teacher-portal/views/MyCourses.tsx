import { useState, type ReactNode } from 'react'
import { BookOpen, Check, ChevronDown, ClipboardList, GraduationCap, Users, Layers, X, Edit3, Plus } from 'lucide-react'
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
  const { courses, coursesLoading, coursesError, createCourse } = useData()
  const { push } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [syllabusText, setSyllabusText] = useState('')
  const [competencyIds, setCompetencyIds] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)
    const modules = syllabusText.split('\n').map((line) => line.trim()).filter(Boolean)
    if (modules.length === 0) {
      setSaveError('Add at least one module before publishing this program.')
      return
    }
    const selectedCompetencies = INITIAL_COMPETENCY_CATALOG.filter((item) => competencyIds.includes(item.id) && item.isActive !== false)
    setSaving(true)
    try {
      await createCourse({
        courseCode: courseCode.trim().toUpperCase(),
        courseName: courseName.trim(),
        subject: subject.trim(),
        semester: 'On demand',
        students: 0,
        completionRate: 0,
        accent: 'cyan',
        description: description.trim(),
        duration: duration.trim(),
        isActive: true,
        competencyIds: selectedCompetencies.map((item) => item.id),
        competencyNames: selectedCompetencies.map((item) => item.name),
        syllabus: modules.map((title, index) => ({ id: `module-${index + 1}`, title, done: false }))
      })
      push({ variant: 'success', title: 'Program published', description: `${courseCode.trim().toUpperCase()} is available to your organization.` })
      setCourseCode('')
      setCourseName('')
      setSubject('')
      setDescription('')
      setDuration('')
      setSyllabusText('')
      setCompetencyIds([])
      setShowCreateForm(false)
    } catch (error) {
      console.error('[TrainerPrograms] Program save failed:', error)
      setSaveError('Unable to publish this program. Check the required fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Programs"
        title="Training Programs"
        subtitle={`${courses.length} training programs · ${courses.reduce((sum, course) => sum + (course.students || 0), 0)} trainees enrolled`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" iconLeft={<Plus size={15} />} onClick={() => { setSaveError(null); setShowCreateForm(true) }}>
              Create program
            </Button>
            <Button variant="secondary" size="sm" iconLeft={<ClipboardList size={15} />} onClick={() => onNavigate('progress')}>
              Progress board
            </Button>
          </div>
        }
      />

      {coursesLoading ? (
        <div className="rounded-xl border border-line bg-panel p-10 text-center text-sm text-muted">Loading training programs…</div>
      ) : coursesError ? (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-300">{coursesError}</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-panel p-10 text-center">
          <h3 className="font-display text-base font-semibold text-ink">No training programs yet</h3>
          <p className="mt-1 text-sm text-muted">Create and publish a program to make it available to trainees in your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="create-program-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-panel p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="create-program-title" className="font-display text-lg font-bold text-ink">Create training program</h2>
                <p className="text-sm text-muted">Programs publish to trainees in your organization.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setShowCreateForm(false)} className="rounded-md p-1 text-faint hover:bg-panel-strong hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-muted">Program code
                  <input required maxLength={32} value={courseCode} onChange={(event) => setCourseCode(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted">Program title
                  <input required maxLength={160} value={courseName} onChange={(event) => setCourseName(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted">Subject
                  <input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
                </label>
                <label className="space-y-1 text-xs font-medium text-muted">Duration
                  <input maxLength={80} value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
                </label>
              </div>
              <label className="block space-y-1 text-xs font-medium text-muted">Description
                <textarea rows={3} maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <label className="block space-y-1 text-xs font-medium text-muted">Modules, one per line
                <textarea required rows={4} value={syllabusText} onChange={(event) => setSyllabusText(event.target.value)} className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink" />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-xs font-medium text-muted">Competencies</legend>
                <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-line p-3 sm:grid-cols-2">
                  {INITIAL_COMPETENCY_CATALOG.filter((item) => item.isActive !== false).map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={competencyIds.includes(item.id)} onChange={(event) => setCompetencyIds((ids) => event.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id))} />
                      {item.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              {saveError && <div role="alert" className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">{saveError}</div>}
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Publishing…' : 'Publish program'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
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

  const toggle = async (itemId: string, title: string, wasDone: boolean) => {
    try {
      await toggleSyllabusItem(course.id, itemId)
      if (!wasDone) {
        push({ variant: 'success', title: 'Topic marked complete', description: `${title} · ${course.courseCode}` })
      }
    } catch {
      push({ variant: 'error', title: 'Unable to update program', description: 'The syllabus change was not saved. Please try again.' })
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
          onSave={async (selectedIds, selectedNames) => {
            await updateCourseCompetencies(course.id, selectedIds, selectedNames)
            push({
              variant: 'success',
              title: 'Competency Mapping Saved',
              description: `Associated ${selectedIds.length} competencies with ${course.courseCode}`,
            })
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
  onSave: (selectedIds: string[], selectedNames: string[]) => Promise<void>
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(course.competencyIds || [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggleCompetency = (id: string, isActive: boolean) => {
    if (!isActive) return // Rule: Inactive competencies cannot be assigned
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    // Only accept active competencies
    const activeCatalogMap = new Map(INITIAL_COMPETENCY_CATALOG.filter((c) => c.isActive).map((c) => [c.id, c.name]))
    const validIds = selectedIds.filter((id) => activeCatalogMap.has(id))
    const validNames = validIds.map((id) => activeCatalogMap.get(id) as string)

    setSaveError(null)
    setSaving(true)
    try {
      await onSave(validIds, validNames)
      onClose()
    } catch {
      setSaveError('Unable to save competency mapping. Please try again.')
    } finally {
      setSaving(false)
    }
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

        {saveError && <div role="alert" className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">{saveError}</div>}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-muted font-mono">
            Selected: <span className="font-bold text-purple-500">{selectedIds.length}</span> Competencies
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Mapping'}
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

