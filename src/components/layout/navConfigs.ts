import type { LucideIcon } from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroupConfig {
  groupLabel: string;
  items: NavItemConfig[];
}

// Per-role nav configs — each defined in their own file for clarity
export { TRAINEE_NAV_CONFIG } from './navConfigs/traineeNav';
export { TRAINER_NAV_CONFIG } from './navConfigs/trainerNav';
export { ADMIN_NAV_CONFIG } from './navConfigs/adminNav';
