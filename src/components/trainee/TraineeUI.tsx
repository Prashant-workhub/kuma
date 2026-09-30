/**
 * Trainee workspace — shared presentational primitives.
 *
 * These originally duplicated the Trainer (teacher-portal) primitives and had
 * already drifted on radii, spacing and accent defaults, so the Trainee and
 * Trainer workspaces stopped looking like the same product. They are now thin
 * role-named aliases over `src/design-system/primitives.tsx` — the single
 * implementation shared with Admin and Login.
 *
 * The components in the lower half are Trainee-only (chip, proficiency meter,
 * badge, code pill, link action, row) and stay here.
 *
 * Presentation only: no data access, no business rules, no effects. Every
 * value is driven by the design tokens registered in `src/index.css`:
 *   canvas / card / panel / line / ink / muted / faint  +  brand-* accents
 */

import type { ReactNode } from 'react'
import { cn } from '../../design-system/cn'
import { accentBar, accentBorder, accentBgSoft, accentDot, accentText, type Accent } from '../../design-system/accents'
import { Avatar as SharedAvatar, NavItem as SharedNavItem } from '../../design-system/primitives'

export type { Accent } from '../../design-system/accents'

/* ------------------------------------------------------------------ *
 * Surfaces & controls — shared with Trainer, Admin and Login
 * ------------------------------------------------------------------ */

export { Card as TraineeCard, Divider } from '../../design-system/primitives'
export { Button as TraineeButton } from '../../design-system/primitives'
export { SectionHeading } from '../../design-system/primitives'
export { Kpi as TraineeKpi } from '../../design-system/primitives'
export { EmptyState as TraineeEmptyState } from '../../design-system/primitives'

/** Circular avatar — the shared primitive under its Trainee name. */
export function TraineeAvatar({
  size,
  ...rest
}: { size?: number } & Omit<Parameters<typeof SharedAvatar>[0], 'size' | 'px'>) {
  return <SharedAvatar px={size} {...rest} />
}

/** Sidebar link — the shared primitive under its Trainee name. */
export function TraineeNavItem({
  icon,
  ...rest
}: { icon: ReactNode } & Omit<Parameters<typeof SharedNavItem>[0], 'icon'>) {
  return <SharedNavItem icon={icon} {...rest} />
}

/* ------------------------------------------------------------------ *
 * Chips & meters
 * ------------------------------------------------------------------ */

/** Small status pill. `accent` drives the soft background, border and text. */
export function TraineeChip({
  children,
  accent = 'cyan',
  className,
}: {
  children: ReactNode
  accent?: Accent
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium',
        accentBorder[accent],
        accentBgSoft[accent],
        accentText[accent],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Category Tag Pill mapping for skill domains */
export function CategoryPill({ category }: { category?: string }) {
  const cat = (category || 'Technical').toLowerCase()
  let tagClass = 'cat-tag-technical'
  if (cat.includes('comm')) tagClass = 'cat-tag-communication'
  else if (cat.includes('lead')) tagClass = 'cat-tag-leadership'
  else if (cat.includes('manag')) tagClass = 'cat-tag-management'
  else if (cat.includes('digit')) tagClass = 'cat-tag-digital'
  else if (cat.includes('domain')) tagClass = 'cat-tag-domain'

  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', tagClass)}>
      {category || 'Technical'}
    </span>
  )
}

/** Multi-tier 4-segment proficiency meter for competency levels. */
export function LevelBlocks({
  level,
  max = 4,
  accent,
  className,
}: {
  level: number
  max?: number
  accent?: Accent
  className?: string
}) {
  // Explicit tier colors for progressive proficiency levels: L1=Sky Blue, L2=Amber Gold, L3=Emerald Green, L4=Violet Purple
  const tierColors = [
    'bg-sky-500 border-sky-600 dark:bg-sky-400 dark:border-sky-300',
    'bg-amber-500 border-amber-600 dark:bg-amber-400 dark:border-amber-300',
    'bg-emerald-500 border-emerald-600 dark:bg-emerald-400 dark:border-emerald-300',
    'bg-violet-500 border-violet-600 dark:bg-violet-400 dark:border-violet-300',
  ];

  const accentColorMap: Record<Accent, string> = {
    gold: 'bg-amber-500 border-amber-600 dark:bg-amber-400 dark:border-amber-300',
    amber: 'bg-amber-500 border-amber-600 dark:bg-amber-400 dark:border-amber-300',
    cyan: 'bg-teal-500 border-teal-600 dark:bg-teal-400 dark:border-teal-300',
    teal: 'bg-teal-500 border-teal-600 dark:bg-teal-400 dark:border-teal-300',
    emerald: 'bg-emerald-500 border-emerald-600 dark:bg-emerald-400 dark:border-emerald-300',
    violet: 'bg-violet-500 border-violet-600 dark:bg-violet-400 dark:border-violet-300',
    purple: 'bg-purple-500 border-purple-600 dark:bg-purple-400 dark:border-purple-300',
    rose: 'bg-rose-500 border-rose-600 dark:bg-rose-400 dark:border-rose-300',
    sky: 'bg-sky-500 border-sky-600 dark:bg-sky-400 dark:border-sky-300',
    indigo: 'bg-indigo-500 border-indigo-600 dark:bg-indigo-400 dark:border-indigo-300',
  };

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < level;
        const colorClass = accent
          ? (accentColorMap[accent] || tierColors[i])
          : (tierColors[i] || 'bg-emerald-500 border-emerald-600');

        return (
          <span
            key={i}
            className={cn(
              'h-3 w-4 rounded-[4px] border transition-all duration-200 shadow-xs',
              isFilled
                ? colorClass
                : 'bg-slate-100 border-slate-300 opacity-60 dark:bg-slate-800/80 dark:border-slate-700/80',
            )}
            title={`Level ${i + 1} of ${max}`}
          />
        );
      })}
      <span className="ml-1.5 font-mono text-[11px] font-bold text-ink">
        {level}/{max}
      </span>
    </span>
  );
}
/* ------------------------------------------------------------------ *
 * Badges, pills & actions
 * ------------------------------------------------------------------ */

/** Status/accent pill. */
export function TraineeBadge({
  children,
  accent = 'cyan',
  className,
  dot = false,
  uppercase = true,
}: {
  children: ReactNode
  accent?: Accent
  className?: string
  dot?: boolean
  uppercase?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        uppercase && 'uppercase tracking-wide',
        accentText[accent],
        accentBgSoft[accent],
        accentBorder[accent],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', accentDot[accent])} />}
      {children}
    </span>
  )
}

/** Monospace pill for identifiers such as `DA-101`. */
export function CodePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-xs font-medium text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Low-emphasis text action (e.g. View all). */
export function TraineeLinkAction({
  children,
  onClick,
  iconRight,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  iconRight?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted transition-colors hover:bg-panel hover:text-ink',
        className,
      )}
    >
      {children}
      {iconRight}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Rows
 * ------------------------------------------------------------------ */

/** Lightweight list row: icon, label, optional meta, trailing content. */
export function TraineeRow({
  icon,
  label,
  meta,
  trailing,
  onClick,
  className,
  accent = 'cyan',
}: {
  icon?: ReactNode
  label: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  className?: string
  accent?: Accent
}) {
  const inner = (
    <>
      {icon && (
        <span
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            accentBgSoft[accent],
            accentText[accent],
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium text-ink">{label}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted">{meta}</span>}
      </span>
      {trailing}
    </>
  )

  if (typeof onClick !== 'function') {
    return <div className={cn('flex items-center gap-3 py-3', className)}>{inner}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-panel',
        className,
      )}
    >
      {inner}
    </button>
  )
}
