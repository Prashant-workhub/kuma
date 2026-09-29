/**
 * Shared portal shell.
 *
 * Admin, Trainer and Trainee all had their own copy of the rail + header
 * frame: different widths, different brand headers, different mobile drawer
 * behaviour, and Admin had no drawer or toggle at all. This module owns the
 * frame so the three portals differ only in *what* they list, never in how the
 * chrome is built.
 *
 * Role-specific navigation is passed in as children/config — this file makes
 * no assumptions about pages, routes, roles or data.
 */

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn'

/* ------------------------------------------------------------------ *
 * Surface primitives
 * ------------------------------------------------------------------ */

/** The canonical rail width. Responsive so it never crowds a small laptop. */
export const SIDEBAR_WIDTH = 'w-[260px] lg:w-[275px]'
export const SIDEBAR_WIDTH_COLLAPSED = 'w-20'

/** Standard app bar height, shared by every portal header. */
export const HEADER_HEIGHT = 'h-16'

/**
 * Full-bleed application background. The ambient gradient is a token, so the
 * Admin canvas and the Trainer canvas now render identically instead of the
 * Admin using a different hardcoded background.
 */
export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-screen w-screen overflow-hidden bg-canvas font-sans text-ink select-none',
        className,
      )}
    >
      <div className="pointer-events-none fixed inset-0 bg-radial-glow z-0" aria-hidden="true" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sidebar
 * ------------------------------------------------------------------ */

export interface PortalNavItem {
  id: string
  label: string
  icon?: ReactNode
  /** Optional trailing count/indicator rendered by the caller. */
  trailing?: ReactNode
  disabled?: boolean
}

/**
 * Renders a portal's navigation from a flat list, inserting a group heading
 * whenever `group` changes. Keeps Admin's and Trainer's grouping identical
 * without either owning the layout.
 */
export function NavList({
  items,
  activeId,
  onSelect,
}: {
  items: Array<PortalNavItem & { group?: string }>
  activeId: string
  onSelect: (id: string) => void
}) {
  let lastGroup: string | undefined
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const showGroup = item.group !== undefined && item.group !== lastGroup
        lastGroup = item.group
        const active = item.id === activeId
        return (
          <div key={item.id}>
            {showGroup && (
              <div className="px-3 pb-2 pt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint first:pt-0">
                {item.group}
              </div>
            )}
            <button
              type="button"
              onClick={() => !item.disabled && onSelect(item.id)}
              disabled={item.disabled}
              aria-current={active ? 'page' : undefined}
              data-active={active}
              className="nav-item w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              {item.icon && (
                <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center', active ? 'text-accent' : 'text-faint')}>
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
              {item.trailing}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Brand block at the top of a rail. */
export function SidebarBrand({
  mark,
  title = 'Kuma AI',
  subtitle,
  action,
  collapsed = false,
}: {
  mark: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  collapsed?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 shrink-0 items-center border-b border-line/50 bg-panel/30',
        collapsed ? 'justify-center gap-1 px-1' : 'justify-between px-5',
        HEADER_HEIGHT,
      )}
    >
      <div className="group flex min-w-0 cursor-pointer items-center gap-3 overflow-hidden truncate">
        <div className="shrink-0 transition-transform group-hover:scale-105">{mark}</div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden leading-tight">
            <div className="truncate font-display text-[15px] font-bold text-ink">{title}</div>
            {subtitle && (
              <div className="truncate font-mono text-[10px] font-semibold lowercase tracking-[0.15em] text-accent">
                {subtitle}
              </div>
            )}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}
/**
 * Responsive rail + drawer frame.
 *
 * `desktop` renders the persistent sidebar; `drawerOpen` drives the mobile
 * drawer. The two share one `body`, so the two render paths can never drift
 * apart, and Escape closes the drawer for keyboard users.
 */
export function SidebarShell({
  brand,
  children,
  footer,
  drawerOpen,
  onCloseDrawer,
  collapsed = false,
  width = SIDEBAR_WIDTH,
}: {
  brand: ReactNode
  children: ReactNode
  footer?: ReactNode
  drawerOpen: boolean
  onCloseDrawer: () => void
  collapsed?: boolean
  width?: string
}) {
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, onCloseDrawer])

  const body = (
    <div
      className={cn(
        'flex h-full min-w-0 flex-col overflow-hidden border-r border-line bg-card text-ink transition-all duration-300',
        collapsed ? SIDEBAR_WIDTH_COLLAPSED : width,
      )}
    >
      {brand}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Primary">
        {children}
      </nav>
      {footer && <div className="shrink-0 border-t border-line bg-panel/30 p-3.5">{footer}</div>}
    </div>
  )

  return (
    <>
      <aside className={cn('hidden h-screen shrink-0 md:block', collapsed ? SIDEBAR_WIDTH_COLLAPSED : width)}>{body}</aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity duration-200',
          drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="absolute inset-0 bg-canvas/60 backdrop-blur-sm" onClick={onCloseDrawer} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            'animate-drawer absolute inset-y-0 left-0 w-[270px] max-w-[85vw] transition-transform duration-200 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {body}
          <button
            type="button"
            onClick={onCloseDrawer}
            aria-label="Close navigation menu"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-muted transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Header
 * ------------------------------------------------------------------ */

export interface TopBarSection {
  id: string
  label: string
  eyebrow?: string
  icon?: ReactNode
}

/**
 * The application bar. Every portal header reduces to the same structure:
 * mobile drawer trigger, current-section identity, optional centre content,
 * then a slot of trailing actions.
 *
 * The theme toggle is *not* built in — each portal places it in its own
 * trailing group so the ordering stays intentional, but all of them render
 * the identical `ThemeToggle` control.
 */
export function PortalHeader({
  title,
  eyebrow,
  icon,
  onOpenDrawer,
  center,
  children,
  className,
}: {
  title: string
  eyebrow?: string
  icon?: ReactNode
  onOpenDrawer: () => void
  center?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-card/85 px-4 backdrop-blur-md transition-colors sm:px-6',
        HEADER_HEIGHT,
        className,
      )}
    >
      {/* Left: drawer trigger + section identity */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-ink md:hidden"
        >
          <span className="sr-only">Open navigation menu</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-accent sm:inline-flex">
              {icon}
            </span>
          )}
          <div className="min-w-0 leading-tight">
            {eyebrow && <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{eyebrow}</div>}
            <div className="truncate text-sm font-semibold text-ink">{title}</div>
          </div>
        </div>
      </div>

      {/* Centre: portal-specific (search, filters) */}
      {center && <div className="relative mx-6 hidden max-w-sm flex-1 md:flex">{center}</div>}

      {/* Right: caller-supplied actions, toggle included */}
      <div className="relative flex shrink-0 items-center gap-2.5 sm:gap-3">{children}</div>
    </header>
  )
}

/** Scrollable content column with one consistent gutter across portals. */
export function PortalMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('relative z-10 min-w-0 flex-1 overflow-y-auto', className)}>
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 lg:px-8">{children}</div>
    </main>
  )
}
