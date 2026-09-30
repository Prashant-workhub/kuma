import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../theme/theme';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Stat';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/Feedback';
import { Drawer } from '../ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import { NavGroupConfig, TRAINEE_NAV_CONFIG, TRAINER_NAV_CONFIG, ADMIN_NAV_CONFIG } from './navConfigs';

export interface AppShellProps {
  role: 'student' | 'faculty' | 'admin';
  user: {
    uid: string;
    fullName: string;
    emailAddress: string;
  };
  activePage: string;
  onNavigate: (pageId: string) => void;
  onSignOut: () => void;
  notifications?: Array<{ id: string; title: string; message: string; read?: boolean }>;
  onMarkNotificationsRead?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  role,
  user,
  activePage,
  onNavigate,
  onSignOut,
  notifications = [],
  onMarkNotificationsRead,
  searchQuery,
  onSearchChange,
  children,
}) => {
  const { theme, toggle: toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const roleConfigs: Record<'student' | 'faculty' | 'admin', { title: string; config: NavGroupConfig[] }> = {
    student: { title: 'Trainee Portal', config: TRAINEE_NAV_CONFIG },
    faculty: { title: 'Trainer Portal', config: TRAINER_NAV_CONFIG },
    admin: { title: 'Admin Portal', config: ADMIN_NAV_CONFIG },
  };

  const currentRoleInfo = roleConfigs[role] || roleConfigs.student;

  const renderNavItems = (isMobile = false) => (
    <nav aria-label={`${currentRoleInfo.title} navigation`} className="flex flex-col gap-6 py-4">
      {currentRoleInfo.config.map((group) => (
        <div key={group.groupLabel} className="flex flex-col gap-1">
          {(!isCollapsed || isMobile) && (
            <span className="px-3 text-xs font-semibold text-text-tertiary select-none">
              {group.groupLabel}
            </span>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  if (isMobile) setIsMobileOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-control text-xs font-medium transition-colors select-none text-left relative',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'bg-primary-subtle text-text-primary-subtle font-semibold border-l-4 border-primary pl-2'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                )}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {(!isCollapsed || isMobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen w-full bg-page text-text-primary flex flex-col font-sans transition-colors duration-200">
      {/* Skip to main content link for screen reader & keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-surface focus:text-primary focus:font-semibold focus:rounded-control focus:shadow-overlay focus:border focus:border-primary"
      >
        Skip to main content
      </a>

      {/* Main Layout Container */}
      <div className="flex flex-1 w-full min-h-screen">
        {/* Desktop Left Sidebar */}
        <aside
          className={cn(
            'hidden md:flex flex-col justify-between border-r border-border bg-surface transition-all duration-200 shrink-0 sticky top-0 h-screen z-sticky',
            isCollapsed ? 'w-16 px-2' : 'w-64 px-4'
          )}
        >
          <div className="flex flex-col">
            {/* Sidebar Brand Header */}
            <div className="h-16 border-b border-border/60 flex items-center justify-between gap-2 px-1">
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 truncate">
                  <div className="h-7 w-7 rounded-control bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    K
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-sm text-text-primary tracking-tight truncate">Kuma</span>
                    <span className="text-xs text-text-secondary truncate">{currentRoleInfo.title}</span>
                  </div>
                </div>
              )}
              {isCollapsed && (
                <div className="h-8 w-8 rounded-control bg-primary text-white flex items-center justify-center font-bold text-sm mx-auto">
                  K
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="shrink-0"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {/* Navigation List */}
            {renderNavItems(false)}
          </div>

          {/* Sidebar Footer User Info */}
          {!isCollapsed && (
            <div className="p-3 border-t border-border/60 mb-2 flex items-center gap-3">
              <Avatar name={user.fullName} size="sm" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-text-primary truncate">{user.fullName}</span>
                <span className="text-xs text-text-secondary truncate">{user.emailAddress}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 border-b border-border bg-surface px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-sticky shadow-xs">
            {/* Left: Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open mobile menu"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>

              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-text-primary capitalize tracking-tight">
                  {activePage.replace('-', ' ')}
                </h1>
                <Badge variant="neutral" size="sm" className="hidden sm:inline-flex capitalize">
                  {role}
                </Badge>
              </div>
            </div>

            {/* Right: Search, Notifications, Theme Toggle, User Menu */}
            <div className="flex items-center gap-2">
              {onSearchChange !== undefined && (
                <div className="relative hidden lg:block w-64">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-control border border-border bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" isIconOnly aria-label="Notifications">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                      {notifications.some((n) => !n.read) && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0">
                  <div className="flex items-center justify-between p-3 border-b border-border/60">
                    <span className="text-xs font-semibold text-text-primary">Notifications</span>
                    {onMarkNotificationsRead && notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={onMarkNotificationsRead}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-3 border-b border-border/40 text-xs flex flex-col gap-1',
                            !n.read && 'bg-primary-subtle/40'
                          )}
                        >
                          <span className="font-semibold text-text-primary">{n.title}</span>
                          <span className="text-text-secondary leading-snug">{n.message}</span>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No notifications" description="You are up to date with all updates." className="p-6 border-none" />
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" isIconOnly onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-warning" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                )}
              </Button>

              {/* User Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="User account menu" className="p-1">
                    <Avatar name={user.fullName} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-primary text-xs">{user.fullName}</span>
                      <span className="text-text-tertiary font-normal text-xs">{user.emailAddress}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-danger" onClick={onSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Region */}
          <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 pb-12 focus:outline-none">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen} position="left">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <div className="h-7 w-7 rounded-control bg-primary text-white flex items-center justify-center font-bold text-sm">
              K
            </div>
            <span className="font-semibold text-sm text-text-primary">{currentRoleInfo.title}</span>
          </div>
          {renderNavItems(true)}
        </div>
      </Drawer>
    </div>
  );
};
