import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Megaphone,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { ViewId } from '../../types'

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  eyebrow: string
  group: 'Training' | 'Intelligence' | 'Workspace'
}

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, eyebrow: 'Dashboard', group: 'Training' },
  { id: 'courses', label: 'Training Programs', icon: BookOpen, eyebrow: 'Programs', group: 'Training' },
  { id: 'progress', label: 'Program Delivery', icon: BarChart3, eyebrow: 'Delivery', group: 'Training' },
  { id: 'doubts', label: 'Trainee Queries', icon: MessagesSquare, eyebrow: 'Queries manager', group: 'Training' },
  { id: 'quizzes', label: 'Assessment Performance', icon: ClipboardCheck, eyebrow: 'Assessments', group: 'Intelligence' },
  { id: 'analytics', label: 'Learning Analytics', icon: LineChart, eyebrow: 'Cohort', group: 'Intelligence' },
  { id: 'insights', label: 'Session Insights', icon: Lightbulb, eyebrow: 'AI pedagogy', group: 'Intelligence' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, eyebrow: 'Broadcast', group: 'Workspace' },
  { id: 'activity', label: 'Activity Center', icon: Activity, eyebrow: 'Live stream', group: 'Workspace' },
  { id: 'settings', label: 'Profile & Settings', icon: Settings, eyebrow: 'Account', group: 'Workspace' },
]

export const NAV_GROUPS: NavItem['group'][] = ['Training', 'Intelligence', 'Workspace']

export function navItemFor(id: ViewId): NavItem {
  return NAV.find((n) => n.id === id) ?? NAV[0]
}
