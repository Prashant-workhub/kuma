import type { ReactNode } from 'react'
import type { ViewId } from '../../types'
import { AppShell } from '../../../components/layout'

export function PortalLayout({
  active,
  onNavigate,
  children,
  user,
  onSignOut,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  children: ReactNode
  user?: { uid: string; fullName: string; emailAddress: string }
  onSignOut?: () => void
  drawerOpen?: boolean
  setDrawerOpen?: (open: boolean) => void
}) {
  return (
    <AppShell
      role="faculty"
      user={{
        uid: user?.uid || 'trainer-1',
        fullName: user?.fullName || 'Faculty Scholar',
        emailAddress: user?.emailAddress || 'trainer@acme.com',
      }}
      activePage={active}
      onNavigate={(pageId) => onNavigate(pageId as ViewId)}
      onSignOut={onSignOut || (() => {})}
    >
      {children}
    </AppShell>
  )
}
