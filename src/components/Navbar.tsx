/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  ChevronRight,
  User,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { PageId, UserSettings } from '../types';

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#050814]/90 backdrop-blur-md px-4 md:px-6 select-none transition-colors">
      
      {/* Left items: Mobile trigger & Branded Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span 
            className="hidden sm:inline-block bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 px-3 py-1 rounded-full cursor-pointer hover:bg-purple-100 border border-purple-200/50 dark:border-purple-800/50 transition-colors"
            onClick={() => setActivePage('dashboard')}
          >
            KUMA
          </span>
          <ChevronRight className="hidden sm:inline-block h-3.5 w-3.5 text-slate-400" />
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1 rounded-full font-semibold border border-slate-200 dark:border-slate-700 text-xs">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search competencies, courses, certificates..."
            className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0C1220] pl-10 pr-12 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#992e9d] dark:focus:border-purple-500 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Right widgets: Quick triggers, actions, theme toggle, profiles */}
      <div className="flex items-center gap-2.5 relative">

        {/* Network status indicator */}
        {isOnline !== undefined && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            }`}
            title={isOnline ? 'Network Connected' : 'No Connection'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        )}

        {/* Theme Toggle Quick Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0C1220] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Activity Center indicator */}
        <button
          onClick={() => handleDropdownOption('notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0C1220] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Activity Center"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#992e9d] ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User avatar - Dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 focus:outline-none cursor-pointer group"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-9 w-9 rounded-full border border-purple-200 dark:border-purple-800 object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 flex items-center justify-center font-bold text-xs uppercase group-hover:scale-105 transition-transform">
                {settings.profile.fullName ? settings.profile.fullName.charAt(0) : 'U'}
              </div>
            )}
          </button>

          {/* Avatar dropdown panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 rounded-[11px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0C1220] p-4 shadow-xl space-y-3 z-50 text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                {settings.profile.avatarUrl ? (
                  <img
                    src={settings.profile.avatarUrl}
                    alt={settings.profile.fullName}
                    className="h-10 w-10 rounded-full border border-purple-200 dark:border-purple-800 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 flex items-center justify-center font-bold text-sm uppercase">
                    {settings.profile.fullName ? settings.profile.fullName.charAt(0) : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{settings.profile.fullName}</div>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase truncate mt-0.5">
                    {settings.profile.role === 'admin' ? 'ORGANIZATION ADMIN' : settings.profile.role === 'faculty' ? 'TRAINER / INSTRUCTOR' : 'TRAINEE LEARNER'}
                  </div>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="space-y-1">
                <button
                  onClick={() => handleDropdownOption('profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-[#992e9d] dark:hover:text-purple-300 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => handleDropdownOption('settings')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-[#992e9d] dark:hover:text-purple-300 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
