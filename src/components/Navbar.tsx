/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, User, LogOut } from 'lucide-react';
import { PageId, UserSettings } from '../types';
import { TraineeAvatar } from './trainee/TraineeUI';
import { ThemeToggle } from '../design-system/ThemeToggle';
import { PortalHeader } from '../design-system/PortalShell';

import NetworkStatusIndicator from './NetworkStatusIndicator';

interface NavbarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  setIsOpenMobile: (open: boolean) => void;
  settings: UserSettings;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewAnalysis?: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogOut: () => void;
  isOnline?: boolean;
}

export default function Navbar({
  activePage,
  setActivePage,
  setIsOpenMobile,
  settings,
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onLogOut,
  isOnline
}: NavbarProps) {
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Overview';
      case 'skill-gap':
        return 'Skill Gap Analysis';
      case 'certificates':
        return 'My Certificates';
      case 'verify-certificate':
        return 'Verify Certificate';
      case 'notifications':
        return 'Activity Center';
      case 'settings':
        return 'Settings';
      case 'profile':
        return 'My Profile';
      default:
        return 'Workspace';
    }
  };

  const handleDropdownOption = (page: PageId) => {
    setActivePage(page);
    setDropdownOpen(false);
  };

  return (
    <PortalHeader
      title={getPageTitle()}
      eyebrow="Trainee workspace"
      onOpenDrawer={() => setIsOpenMobile(true)}
      center={
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search competencies, courses, certificates..."
            className="w-full rounded-xl border border-line bg-panel py-2 pl-10 pr-12 text-xs font-medium text-ink placeholder:text-faint transition-colors focus:border-accent/50 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-card px-2 py-0.5 font-mono text-[10px] text-faint ring-1 ring-line">
            <span>⌘K</span>
          </div>
        </div>
      }
    >

        {/* Network status indicator */}
        <NetworkStatusIndicator compact={true} userId={settings.profile.uid} />

        <ThemeToggle />

        {/* Activity Center indicator */}
        <button
          onClick={() => handleDropdownOption('notifications')}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-ink"
          title="Activity Center"
        >
          <Bell className="h-4 w-4 text-muted" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-cyan ring-2 ring-card" />
        </button>

        {/* User avatar - Dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="group flex cursor-pointer items-center gap-2 focus:outline-none"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="Account menu"
          >
            <TraineeAvatar
              src={settings.profile.avatarUrl}
              initials={(settings.profile.fullName || 'U').charAt(0).toUpperCase()}
              size={36}
            />
          </button>

          {/* Avatar dropdown panel */}
          {dropdownOpen && (
            <div className="glass-panel absolute right-0 z-50 mt-3 w-64 space-y-3 p-4 text-ink">
              {/* Dropdown Header Info */}
              <div className="flex items-center gap-3 border-b border-line pb-3">
                <TraineeAvatar
                  src={settings.profile.avatarUrl}
                  initials={(settings.profile.fullName || 'U').charAt(0).toUpperCase()}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold text-ink">{settings.profile.fullName}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                    {settings.profile.role === 'admin' ? 'Organization Admin' : settings.profile.role === 'faculty' ? 'Trainer / Instructor' : 'Trainee Learner'}
                  </div>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="space-y-1">
                <button
                  onClick={() => handleDropdownOption('profile')}
                  className="nav-item w-full cursor-pointer text-sm"
                >
                  <User className="h-4 w-4 shrink-0 text-faint" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => handleDropdownOption('settings')}
                  className="nav-item w-full cursor-pointer text-sm"
                >
                  <Settings className="h-4 w-4 shrink-0 text-faint" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-line pt-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogOut();
                  }}
                  className="nav-item w-full cursor-pointer text-sm hover:text-brand-rose"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-brand-rose" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
    </PortalHeader>
  );
}
