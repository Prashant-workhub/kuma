/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Bell, 
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Target,
  Award,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import AILogo from './AILogo';
import { SidebarItem } from './bauhaus';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  settings: UserSettings;
  onNewAnalysis?: () => void;
  theme: 'light' | 'dark';
  onLogOut: () => void;
}

export default function Sidebar({
  activePage,
  setActivePage,
  isOpenMobile,
  setIsOpenMobile,
  settings,
  onLogOut
}: SidebarProps) {
  
  // Sidebar expand/collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Grouped Menu Navigation
  const workspaceItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skill-gap', label: 'Skill Gap Analysis', icon: Target },
    { id: 'certificates', label: 'My Certificates', icon: Award },
    { id: 'verify-certificate', label: 'Verify Certificate', icon: ShieldCheck }
  ];

  const accountItems = [
    { id: 'notifications', label: 'Activity Center', icon: Bell, indicator: true },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    setIsOpenMobile(false);
  };

  const sidebarContent = (
    <div className={`flex h-full flex-col select-none transition-all duration-300 bg-white dark:bg-[#050814] text-slate-800 dark:text-slate-100 border-r border-slate-200/80 dark:border-slate-800/80 ${
      isCollapsed ? 'w-20' : 'w-[260px] lg:w-[275px]'
    }`}>
      
      {/* Brand area */}
      <div className={`flex h-16 items-center border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#050814] ${
        isCollapsed ? 'justify-center px-1 gap-1' : 'justify-between px-5'
      }`}>
        <div 
          className="flex items-center gap-3 cursor-pointer overflow-hidden truncate group"
          onClick={() => handleNavClick('dashboard')}
        >
          <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-950/50 text-[#992e9d] dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0 group-hover:scale-105 transition-transform">
            <AILogo size={22} theme="light" />
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                KUMA
                <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[9px] font-semibold text-[#992e9d] dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                  SIH26075
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                CAPACITY CONNECT
              </div>
            </div>
          )}
        </div>

        {/* Mobile close trigger */}
        <button 
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Desktop Collapse Trigger */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6">
        {/* Workspace section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3.5 pb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              PORTAL WORKSPACE
            </div>
          )}

          {workspaceItems.map((item) => (
            <div key={item.id}>
              <SidebarItem
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                active={activePage === item.id}
                onClick={() => handleNavClick(item.id as PageId)}
                collapsed={isCollapsed}
              />
            </div>
          ))}
        </div>

        {/* Account section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3.5 pb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ACCOUNT & CONTROLS
            </div>
          )}

          {accountItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={activePage === item.id}
              hasNotificationDot={item.indicator}
              notificationColor="purple"
              onClick={() => handleNavClick(item.id as PageId)}
              collapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      {/* Bottom Profile Identity card (Pinned to bottom) */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 p-3.5 bg-white dark:bg-[#050814] shrink-0 sticky bottom-0 z-20">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer min-w-0 group"
            onClick={() => handleNavClick('profile')}
            title="View Profile"
          >
            {settings.profile.avatarUrl ? (
              <img
                src={settings.profile.avatarUrl}
                alt={settings.profile.fullName}
                className="h-9 w-9 rounded-full border border-purple-200 dark:border-purple-800 object-cover shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[#992e9d] dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                {settings.profile.fullName ? settings.profile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#992e9d] dark:group-hover:text-purple-300 transition-colors">
                  {settings.profile.fullName || 'Trainee Learner'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate" title={settings.profile.emailAddress}>
                  {settings.profile.emailAddress}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogOut}
              title="Secure Logout"
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar Frame */}
      <aside className={`hidden md:block h-screen sticky top-0 shrink-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[260px] lg:w-[275px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
        />
        
        <div 
          className={`absolute inset-y-0 left-0 w-[270px] max-w-xs transition-transform duration-200 ease-out transform ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
