import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import type { ViewId } from '../../types'
import { Avatar } from '../ui/Avatar'
import { NAV, NAV_GROUPS } from './navConfig'
import AILogo from '../../../components/AILogo'
import { NavItem } from '../../../design-system/primitives'
import { SidebarBrand } from '../../../design-system/PortalShell'

/** Shared sidebar content — reused by the desktop rail and the mobile drawer. */
export function SidebarNav({
  active,
  onNavigate,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
}) {
  const { profile } = useAuth()

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Brand Header */}
      <SidebarBrand mark={<AILogo size={32} showText={false} theme="dark" />} title="Kuma AI" subtitle="trainer portal" />

      {/* Nav groups */}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint font-semibold">{group}</div>
            <ul className="space-y-1">
              {NAV.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    {/*
                     * The shared `NavItem` owns the active rail, indicator bar
                     * and hover treatment. Only the data is role-specific here,
                     * so the Trainer and Trainee rails stay pixel-identical.
                     */}
                    <NavItem
                      icon={<Icon size={17} />}
                      label={item.label}
                      active={item.id === active}
                      accent="emerald"
                      onClick={() => onNavigate(item.id)}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pinned Profile Card at bottom left */}
      {profile && (
        <div className="min-w-0 shrink-0 overflow-hidden border-t border-line bg-panel/40 p-3">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            title="View Profile Settings"
            className="group flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-xl p-2 text-left transition-colors hover:bg-panel"
          >
            <Avatar initials={profile.avatarInitials} src={profile.avatarUrl} size="md" accent="emerald" />
            <span className="min-w-0 flex-1 overflow-hidden">
              <span className="block truncate text-sm font-semibold text-ink transition-colors group-hover:text-brand-emerald">
                {profile.firstName.startsWith(profile.title)
                  ? `${profile.firstName} ${profile.surname}`.trim()
                  : `${profile.title} ${profile.firstName} ${profile.surname}`.trim()}
              </span>
              <span className="block truncate text-xs text-muted">{profile.department}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Desktop sidebar rail. */
export function Sidebar({ active, onNavigate }: { active: ViewId; onNavigate: (id: ViewId) => void }) {
  return (
    <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-line bg-card lg:flex">
      <SidebarNav active={active} onNavigate={onNavigate} />
    </aside>
  )
}
