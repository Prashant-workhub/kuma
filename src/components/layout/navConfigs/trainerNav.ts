import {
  LayoutDashboard,
  BookMarked,
  Users,
  Award,
  Activity,
  BarChart3,
  Lightbulb,
  Megaphone,
  MessagesSquare,
  Settings,
} from 'lucide-react';
import type { NavGroupConfig } from '../navConfigs';

export const TRAINER_NAV_CONFIG: NavGroupConfig[] = [
  {
    groupLabel: 'Teaching',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'courses', label: 'My courses', icon: BookMarked },
      { id: 'my-trainees', label: 'Trainees', icon: Users },
      { id: 'progress', label: 'Course progress', icon: BarChart3 },
      { id: 'quizzes', label: 'Assessments', icon: Award },
      { id: 'doubts', label: 'Trainee queries', icon: MessagesSquare },
      { id: 'analytics', label: 'Learning analytics', icon: BarChart3 },
      { id: 'insights', label: 'Session insights', icon: Lightbulb },
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
      { id: 'activity', label: 'Activity center', icon: Activity },
    ],
  },
  {
    groupLabel: 'Account',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];
