import {
  Home,
  Compass,
  BookOpen,
  Award,
  TrendingUp,
  FileCheck,
  User,
  Settings,
} from 'lucide-react';
import type { NavGroupConfig } from '../navConfigs';

export const TRAINEE_NAV_CONFIG: NavGroupConfig[] = [
  {
    groupLabel: 'Learning',
    items: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'library', label: 'Discover', icon: Compass },
      { id: 'mylearning', label: 'My learning', icon: BookOpen },
      { id: 'assessments', label: 'Assessments', icon: Award },
      { id: 'growth', label: 'Growth', icon: TrendingUp },
      { id: 'certificates', label: 'Certificates', icon: FileCheck },
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
