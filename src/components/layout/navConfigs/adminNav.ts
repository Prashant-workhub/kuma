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
  Settings,
} from 'lucide-react';
import type { NavGroupConfig } from '../navConfigs';

export const ADMIN_NAV_CONFIG: NavGroupConfig[] = [
  {
    groupLabel: 'Governance',
    items: [
      { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'admin-trainees', label: 'Users and approvals', icon: Users },
      { id: 'admin-organization', label: 'Organization', icon: Building },
      { id: 'admin-competencies', label: 'Competencies', icon: Target },
      { id: 'admin-training-programs', label: 'Courses', icon: BookMarked },
      { id: 'admin-trainers', label: 'Trainers', icon: BookOpen },
      { id: 'admin-assessments', label: 'Assessments', icon: Award },
      { id: 'admin-certificates', label: 'Certificates', icon: ShieldCheck },
      { id: 'admin-analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    groupLabel: 'Account',
    items: [
      { id: 'admin-settings', label: 'Settings', icon: Settings },
    ],
  },
];
