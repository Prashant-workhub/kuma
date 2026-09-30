/**
 * Project Kuma - Trainee Settings Workspace View
 * Delegates to ProfileView for unified sectioned form pages & settings management.
 */

import React from 'react';
import { UserSettings } from '../types';
import ProfileView from './ProfileView';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => Promise<void>;
  setActivePage: (page: any) => void;
  theme: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  onLogOut?: () => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  setActivePage,
  theme,
}: SettingsViewProps) {
  return (
    <ProfileView
      settings={settings}
      onUpdateSettings={onUpdateSettings}
      setActivePage={setActivePage}
      theme={theme}
    />
  );
}
