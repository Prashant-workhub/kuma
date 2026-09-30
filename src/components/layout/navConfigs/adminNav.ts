import {
  LayoutDashboard,
  Users,
  Building,
  Target,
  BookMarked,
  BookOpen,
  Award,
  BarChart3,
  ShieldCheck,
  User,
  Settings,
} from 'lucide-react';
import type { NavGroupConfig } from '../navConfigs';

export const ADMIN_NAV_CONFIG: NavGroupConfig[] = [
  {
    groupLabel: 'Governance',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'users', label: 'Users and approvals', icon: Users },
      { id: 'org', label: 'Organization', icon: Building },
      { id: 'competencies', label: 'Competencies', icon: Target },
      { id: 'courses', label: 'Courses', icon: BookMarked },
      { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
      { id: 'assessments', label: 'Assessments and certificates', icon: Award },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'audit', label: 'Audit log', icon: ShieldCheck },
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
