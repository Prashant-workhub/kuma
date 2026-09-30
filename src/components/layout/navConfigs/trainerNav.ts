import {
  LayoutDashboard,
  BookMarked,
  Users,
  Award,
  HelpCircle,
  User,
  Settings,
} from 'lucide-react';
import type { NavGroupConfig } from '../navConfigs';

export const TRAINER_NAV_CONFIG: NavGroupConfig[] = [
  {
    groupLabel: 'Teaching',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'courses', label: 'My courses', icon: BookMarked },
      { id: 'trainees', label: 'Trainees', icon: Users },
      { id: 'quizzes', label: 'Assessments', icon: Award },
      { id: 'doubts', label: 'Doubts and announcements', icon: HelpCircle },
    ],
  },
  {
    groupLabel: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];
