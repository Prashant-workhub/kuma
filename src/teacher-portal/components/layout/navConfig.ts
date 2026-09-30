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
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Accent } from '../../../design-system/accents'
import type { ViewId } from '../../types'

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  eyebrow: string
  group: 'Training' | 'Intelligence' | 'Workspace'
  accent: Accent
}

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, eyebrow: 'Dashboard', group: 'Training', accent: 'violet' },
  { id: 'my-trainees', label: 'My Trainees', icon: Users, eyebrow: 'Assigned Trainees', group: 'Training', accent: 'emerald' },
  { id: 'courses', label: 'Training Programs', icon: BookOpen, eyebrow: 'Programs', group: 'Training', accent: 'sky' },
  { id: 'progress', label: 'Program Delivery', icon: BarChart3, eyebrow: 'Delivery', group: 'Training', accent: 'indigo' },
  { id: 'doubts', label: 'Trainee Queries', icon: MessagesSquare, eyebrow: 'Queries manager', group: 'Training', accent: 'rose' },
  { id: 'quizzes', label: 'Assessment Performance', icon: ClipboardCheck, eyebrow: 'Assessments', group: 'Intelligence', accent: 'amber' },
  { id: 'analytics', label: 'Learning Analytics', icon: LineChart, eyebrow: 'Cohort', group: 'Intelligence', accent: 'cyan' },
  { id: 'insights', label: 'Session Insights', icon: Lightbulb, eyebrow: 'AI pedagogy', group: 'Intelligence', accent: 'purple' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, eyebrow: 'Broadcast', group: 'Workspace', accent: 'gold' },
  { id: 'activity', label: 'Activity Center', icon: Activity, eyebrow: 'Live stream', group: 'Workspace', accent: 'teal' },
  { id: 'settings', label: 'Profile & Settings', icon: Settings, eyebrow: 'Account', group: 'Workspace', accent: 'violet' },
]

export const NAV_GROUPS: NavItem['group'][] = ['Training', 'Intelligence', 'Workspace']

export function navItemFor(id: ViewId): NavItem {
  return NAV.find((n) => n.id === id) ?? NAV[0]
}
