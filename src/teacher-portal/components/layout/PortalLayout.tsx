import type { ReactNode } from 'react'
import type { ViewId } from '../../types'
import { Sidebar, SidebarNav } from './Sidebar'
import { TopBar } from './TopBar'
import { GreenParticlesBg } from '../ui/GreenParticlesBg'
import { AppFrame, PortalMain } from '../../../design-system/PortalShell'

export function PortalLayout({
  active,
  onNavigate,
  drawerOpen,
  setDrawerOpen,
  children,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  children: ReactNode
}) {
  const navigate = (id: ViewId) => {
    onNavigate(id)
    setDrawerOpen(false)
  }

  /*
   * The frame, the rail/drawer and the content gutter all come from the
   * shared shell. This component is now only responsible for the Trainer's
   * navigation data and the ambient particle effect.
   */
  return (
    <AppFrame>
      <GreenParticlesBg />

      {/* Desktop rail */}
      <Sidebar active={active} onNavigate={navigate} />

      {/* Mobile drawer — shares the rail body with the desktop sidebar */}
      {drawerOpen && <MobileDrawer active={active} onNavigate={navigate} onClose={() => setDrawerOpen(false)} />}

      {/* Main column */}
      <div className="relative z-10 flex min-h-screen min-w-0 w-full max-w-full flex-1 flex-col">
        <TopBar active={active} onOpenMenu={() => setDrawerOpen(true)} onNavigate={navigate} />
        <PortalMain>{children}</PortalMain>
      </div>
    </AppFrame>
  )
}

/** Mobile navigation drawer, reusing the exact rail body as the desktop rail. */
function MobileDrawer({
  active,
  onNavigate,
  onClose,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-canvas/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="animate-drawer absolute left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-card shadow-scrim"
      >
        <div className="min-h-0 flex-1">
          <SidebarNav active={active} onNavigate={onNavigate} />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-muted transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
