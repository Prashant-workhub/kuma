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
  UserCheck,
  Users,
  Compass,
  BookMarked,
  ClipboardCheck
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import AILogo from './AILogo';
import { TraineeAvatar, TraineeNavItem } from './trainee/TraineeUI';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED, SidebarBrand } from '../design-system/PortalShell';

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

  // Learner Journey Grouped Menu Navigation
  const workspaceItems: { id: PageId; label: string; icon: React.ElementType; accent: 'teal' | 'violet' | 'amber' | 'gold' | 'emerald' }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, accent: 'teal' },
    { id: 'find-trainer', label: 'Discover', icon: Compass, accent: 'violet' },
    { id: 'my-learning', label: 'My Learning', icon: BookMarked, accent: 'amber' },
    { id: 'assessments', label: 'Assessments', icon: ClipboardCheck, accent: 'emerald' },
    { id: 'skill-gap', label: 'Growth', icon: Target, accent: 'gold' },
    { id: 'certificates', label: 'Certificates', icon: Award, accent: 'gold' },
    { id: 'verify-certificate', label: 'Verify Certificate', icon: ShieldCheck, accent: 'emerald' }
  ];

  const accountItems: { id: PageId; label: string; icon: React.ElementType; indicator?: boolean; accent: 'rose' | 'cyan' | 'sky' }[] = [
    { id: 'notifications', label: 'Activity Center', icon: Bell, indicator: true, accent: 'rose' },
    { id: 'profile', label: 'Profile', icon: UserCheck, accent: 'cyan' },
    { id: 'settings', label: 'Settings', icon: Settings, accent: 'sky' }
  ];

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    setIsOpenMobile(false);
  };

  // The rail width comes from the shared shell so the Trainee, Trainer and
  // Admin rails collapse and resize identically.
  const railWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  const sidebarContent = (
    <div className={`flex h-full flex-col select-none overflow-hidden border-r border-line bg-card text-ink transition-all duration-300 ${railWidth}`}>

      {/* Brand area */}
      <SidebarBrand
        mark={<AILogo size={28} showText={false} theme="dark" />}
        title="Kuma AI"
        subtitle="trainee portal"
        collapsed={isCollapsed}
        action={
          <>
            {/* Mobile close trigger */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-panel text-muted hover:text-ink md:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Desktop Collapse Trigger */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-panel text-faint hover:text-ink focus:outline-none md:flex"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </>
        }
      />

      {/* Navigation Groups */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {/* Workspace section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              Workspace
            </div>
          )}

          {workspaceItems.map((item) => (
            <TraineeNavItem
              key={item.id}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={activePage === item.id}
              accent={item.accent}
              onClick={() => handleNavClick(item.id as PageId)}
              collapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Account section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              Account
            </div>
          )}

          {accountItems.map((item) => (
            <TraineeNavItem
              key={item.id}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={activePage === item.id}
              accent={item.accent}
              showDot={item.indicator}
              onClick={() => handleNavClick(item.id as PageId)}
              collapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      {/* Bottom Profile Identity card (Pinned to bottom) */}
      <div className="shrink-0 border-t border-line bg-panel/30 p-3.5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div
            className="group flex min-w-0 cursor-pointer items-center gap-3"
            onClick={() => handleNavClick('profile')}
            title="View Profile"
          >
            <TraineeAvatar
              src={settings.profile.avatarUrl}
              initials={(settings.profile.fullName || 'Trainee Learner').charAt(0).toUpperCase()}
              size={36}
              className="shrink-0"
            />

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink transition-colors group-hover:text-brand-cyan">
                  {settings.profile.fullName || 'Trainee Learner'}
                </div>
                <div className="truncate text-[11px] text-muted" title={settings.profile.emailAddress}>
                  {settings.profile.emailAddress}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogOut}
              title="Secure Logout"
              aria-label="Log out"
              className="shrink-0 cursor-pointer rounded-full p-2 text-faint transition-colors hover:bg-brand-rose/10 hover:text-brand-rose"
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
      <aside className={`sticky top-0 z-30 hidden h-screen shrink-0 transition-all duration-300 md:block ${railWidth}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 md:hidden ${
          isOpenMobile ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpenMobile}
      >
        <div
          onClick={() => setIsOpenMobile(false)}
          className="absolute inset-0 bg-canvas/60 backdrop-blur-sm"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-[270px] max-w-xs transition-transform duration-200 ease-out ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
