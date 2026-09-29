import { useState, useRef, useEffect } from 'react'
import { Bell, BookOpen, Check, Copy, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { cn } from '../../lib/cn'
import type { ViewId } from '../../types'
import { Avatar } from '../ui/Avatar'
import { navItemFor } from './navConfig'
import { ThemeToggle } from '../../../design-system/ThemeToggle'
import { PortalHeader } from '../../../design-system/PortalShell'

export function TopBar({
  active,
  onOpenMenu,
  onNavigate,
}: {
  active: ViewId
  onOpenMenu: () => void
  onNavigate: (id: ViewId) => void
}) {
  const { profile, logout } = useAuth()
  const { push } = useToast()
  const { doubts } = useData()
  const { copied, copy } = useCopyToClipboard()

  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const item = navItemFor(active)
  const Icon = item.icon
  const pendingCount = doubts.filter((d) => d.status === 'pending').length

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const copyCode = async () => {
    if (!profile) return
    const ok = await copy(profile.teacherCode)
    push(
      ok
        ? { variant: 'success', title: 'Teacher Code copied', description: profile.teacherCode }
        : { variant: 'error', title: 'Copy failed', description: 'Select and copy the code manually.' },
    )
  }

  // Prevent duplicate title formatting (e.g. "Prof. Prof. Alex Morgan")
  const formattedName = profile
    ? profile.firstName.startsWith(profile.title)
      ? `${profile.firstName} ${profile.surname}`.trim()
      : `${profile.title} ${profile.firstName} ${profile.surname}`.trim()
    : ''

  /*
   * The frame and the theme control come from the shared shell, so this bar has
   * the same structure as the Trainee and Admin bars and only supplies
   * Trainer-specific actions.
   */
  return (
    <PortalHeader title={item.label} eyebrow={item.eyebrow} icon={<Icon size={16} />} onOpenDrawer={onOpenMenu}>
      {/* Trainer UID code badge + copy */}
      {profile && (
        <div className="flex items-center gap-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/10 py-1 pl-3 pr-1">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-brand-emerald/70 sm:inline">
            Code
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide text-brand-emerald">
            {profile.teacherCode}
          </span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Copy Trainer Code"
            className="ml-0.5 cursor-pointer rounded-full p-1.5 text-brand-emerald/80 transition-colors hover:bg-brand-emerald/20 hover:text-brand-emerald"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      <ThemeToggle />

      <button
        type="button"
        onClick={() => onNavigate('activity')}
        aria-label={`Activity center${pendingCount ? `, ${pendingCount} pending doubts` : ''}`}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-ink"
      >
        <Bell size={16} />
        {pendingCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-emerald ring-2 ring-card" />
        )}
      </button>
      {/* Profile Avatar Dropdown Button & Menu */}
      {profile && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Profile menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(
              'cursor-pointer rounded-full transition-all ring-2',
              menuOpen ? 'scale-105 ring-accent' : 'ring-transparent hover:scale-105',
            )}
          >
            <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="sm" accent="emerald" />
          </button>

          {menuOpen && (
            /*
             * Opaque dropdown. `bg-card` is a theme token, so the panel matches
             * the active surface in both modes — this previously pinned
             * `dark:bg-[#101712]`, which is what made the Trainer menu render as
             * a dark slab floating over the light workspace.
             */
            <div className="animate-scale-in absolute right-0 top-full z-[9999] mt-2 w-72 rounded-2xl border border-line bg-card p-3.5 shadow-lift-hover">
              <div className="flex items-center gap-3 border-b border-line p-2 pb-3">
                <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="md" accent="emerald" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="truncate text-sm font-bold text-ink">{formattedName}</div>
                  <div className="truncate text-xs text-muted">{profile.department}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-brand-emerald/30 bg-brand-emerald/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-emerald">
                    Code: {profile.teacherCode}
                  </div>
                </div>
              </div>

              <div className="space-y-1 py-2">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('settings'); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-panel"
                >
                  <User size={15} className="text-muted" />
                  <span>Profile & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('courses'); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-panel"
                >
                  <BookOpen size={15} className="text-muted" />
                  <span>My Courses</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('activity'); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-panel"
                >
                  <Bell size={15} className="text-muted" />
                  <span>Activity Center</span>
                </button>
              </div>

              <div className="border-t border-line pt-2">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-rose transition-colors hover:bg-brand-rose/25"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PortalHeader>
  )
}
