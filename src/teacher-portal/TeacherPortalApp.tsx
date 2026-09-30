import React, { useState, useEffect } from 'react'
import type { ViewId, FacultyProfile } from './types'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Toaster } from './components/ui/Toaster'
import { LandingHero } from './components/landing/LandingHero'
import { PortalLayout } from './components/layout/PortalLayout'
import { OverviewDashboard } from './views/OverviewDashboard'
import { MyTraineesView } from './views/MyTraineesView'
import { MyCourses } from './views/MyCourses'
import { CourseProgress } from './views/CourseProgress'
import { StudentDoubtsManager } from './views/StudentDoubtsManager'
import { QuizPerformance } from './views/QuizPerformance'
import { LearningAnalytics } from './views/LearningAnalytics'
import { LectureInsights } from './views/LectureInsights'
import { Announcements } from './views/Announcements'
import { ActivityCenter } from './views/ActivityCenter'
import { ProfileSettings } from './views/ProfileSettings'
import { DEMO_PROFILE } from './lib/mockData'
import { Clock, XCircle, LogOut } from 'lucide-react'

function ViewRouter({ active, onNavigate }: { active: ViewId; onNavigate: (id: ViewId) => void }) {
  switch (active) {
    case 'overview':
      return <OverviewDashboard onNavigate={onNavigate} />
    case 'my-trainees':
      return <MyTraineesView />
    case 'courses':
      return <MyCourses onNavigate={onNavigate} />
    case 'progress':
      return <CourseProgress />
    case 'doubts':
      return <StudentDoubtsManager />
    case 'quizzes':
      return <QuizPerformance />
    case 'analytics':
      return <LearningAnalytics />
    case 'insights':
      return <LectureInsights />
    case 'announcements':
      return <Announcements />
    case 'activity':
      return <ActivityCenter />
    case 'settings':
      return <ProfileSettings />
    default:
      return <OverviewDashboard onNavigate={onNavigate} />
  }
}

interface TeacherPortalAppProps {
  user: {
    uid: string
    fullName: string
    emailAddress: string
    teacherCode?: string
    institution?: string
    approvalStatus?: 'pending' | 'approved' | 'rejected'
  }
  onSignOut: () => void
  theme?: 'light' | 'dark'
  setTheme?: (t: 'light' | 'dark') => void
}

function TeacherPortalInner({ user, onSignOut }: TeacherPortalAppProps) {
  const { stage, initProfile } = useAuth()
  const [active, setActive] = useState<ViewId>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (user) {
      const parts = (user.fullName || 'Faculty Scholar').trim().split(' ')
      const firstName = parts[0] || 'Faculty'
      const surname = parts.slice(1).join(' ') || 'Scholar'

      const customProf: FacultyProfile = {
        ...DEMO_PROFILE,
        id: user.uid,
        firstName,
        surname,
        email: user.emailAddress || DEMO_PROFILE.email,
        teacherCode: user.teacherCode || DEMO_PROFILE.teacherCode,
        university: user.institution || DEMO_PROFILE.university,
        avatarInitials: `${firstName[0] || 'F'}${surname[0] || 'S'}`,
      }
      initProfile(customProf)
    }
  }, [user, initProfile])

  const status = user?.approvalStatus

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Awaiting Approval</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your registration as a trainer (<span className="font-semibold text-amber-300">{user.emailAddress}</span>) is currently pending review by an organization administrator.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 text-left font-mono">
            <div className="flex items-center justify-between">
              <span>Directory Discovery:</span>
              <span className="text-amber-400 font-bold">Hidden</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Course Publishing:</span>
              <span className="text-amber-400 font-bold">Locked</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Assessment Authoring:</span>
              <span className="text-amber-400 font-bold">Locked</span>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Status: Pending Verification</span>
            <button
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
            <XCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Registration Rejected</h2>
            <p className="text-xs text-rose-300 leading-relaxed">
              Your request for trainer privileges (<span className="font-semibold">{user.emailAddress}</span>) was rejected by an administrator.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onSignOut}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'hero') {
    return <LandingHero />
  }

  return (
    <PortalLayout active={active} onNavigate={setActive} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <div key={active} className="animate-fade-in">
        <ViewRouter active={active} onNavigate={setActive} />
      </div>
    </PortalLayout>
  )
}

export default function TeacherPortalApp(props: TeacherPortalAppProps) {
  const parts = (props.user?.fullName || 'Faculty Scholar').trim().split(' ')
  const firstName = parts[0] || 'Faculty'
  const surname = parts.slice(1).join(' ') || 'Scholar'

  const initialProfile: FacultyProfile = {
    ...DEMO_PROFILE,
    id: props.user.uid,
    firstName,
    surname,
    email: props.user.emailAddress || DEMO_PROFILE.email,
    teacherCode: props.user.teacherCode || DEMO_PROFILE.teacherCode,
    university: props.user.institution || DEMO_PROFILE.university,
    avatarInitials: `${firstName[0] || 'F'}${surname[0] || 'S'}`,
  }

  return (
    <ToastProvider>
      <AuthProvider initialProfile={initialProfile} onSignOut={props.onSignOut} initialStage="ready">
        <DataProvider>
          <TeacherPortalInner {...props} />
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
