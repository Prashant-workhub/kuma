/**
 * Trainee workspace â€” shared presentational primitives.
 *
 * These mirror the structure of the Trainer (teacher-portal) workspace so both
 * roles read as the same product. Every value below is driven by the design
 * tokens already registered in `src/index.css`:
 *   canvas / card / panel / line / ink / muted / faint  + brand-* accents
 *
 * This file is presentation-only: no data access, no business rules, no effects.
 */

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from '../../teacher-portal/lib/cn'
import {
  accentBgSoft,
  accentBar,
  accentBorder,
  accentDot,
  accentText,
  type Accent,
} from '../../teacher-portal/components/ui/accents'

export type { Accent }

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/**
 * Primary content surface. Use a card only when content genuinely needs
 * grouping â€” otherwise prefer open sections separated by whitespace/dividers.
 */
export function TraineeCard({
  children,
  className,
  hover = false,
  padded = true,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  padded?: boolean
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  return (
    <Tag className={cn('glass-panel', hover && 'glass-panel-hover', padded && 'p-5', className)}>
      {children}
    </Tag>
  )
}

/** Thin hairline divider tuned for the dark palette. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

type TraineeButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
type TraineeButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

const BUTTON_VARIANTS: Record<TraineeButtonVariant, string> = {
  primary: 'bg-ink text-canvas shadow-lift hover:opacity-90',
  accent: 'bg-brand-gold text-black shadow-glow-gold hover:brightness-105',
  secondary: 'border border-line bg-panel text-ink hover:border-brand-cyan/40 hover:bg-panel/70',
  ghost: 'text-muted hover:bg-panel hover:text-ink',
  danger: 'border border-brand-rose/30 bg-brand-rose/15 text-brand-rose hover:bg-brand-rose/25',
}

const BUTTON_SIZES: Record<TraineeButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

/** Mirrors the Trainer `Button` so both workspaces share one button language. */
export function TraineeButton({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block,
  className,
  ...rest
}: {
  children: ReactNode
  variant?: TraineeButtonVariant
  size?: TraineeButtonSize
  iconLeft?: ReactNode
  iconRight?: ReactNode
  block?: boolean
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button
      className={cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
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

/**
 * Four-segment proficiency meter used for competency levels. Segments up to
 * `level` are filled with `accent`; the rest stay muted.
 */
export function LevelBlocks({
  level,
  max = 4,
  accent = 'cyan',
  className,
}: {
  level: number
  max?: number
  accent?: Accent
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 w-4 rounded-[3px] border border-line transition-colors',
            i < level ? accentBar[accent] : 'bg-panel',
          )}
        />
      ))}
      <span className="ml-1 font-mono text-[10px] font-semibold text-faint">
        {level}/{max}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Section hierarchy
 * ------------------------------------------------------------------ */

/**
 * Section header. Mirrors the Trainer `SectionHeading` so the heading rhythm
 * (eyebrow â†’ title â†’ supporting line) is identical across both workspaces.
 */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
  className,
}: {
  title: string
  subtitle?: ReactNode
  eyebrow?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-muted">{icon}</span>}
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Metrics
 * ------------------------------------------------------------------ */

/**
 * KPI tile matching the Trainer `KpiCard`: icon disc, large metric, label and a
 * small supporting line. Optional trailing progress bar and click handler.
 */
export function TraineeKpi({
  label,
  value,
  icon,
  accent = 'cyan',
  hint,
  progress,
  onClick,
  className,
  style,
}: {
  label: string
  value: string | number
  icon: ReactNode
  accent?: Accent
  hint?: string
  /** 0â€“100; renders a slim bar beneath the metric. */
  progress?: number
  onClick?: () => void
  className?: string
  style?: CSSProperties
}) {
  const content = (
    <>
      <span
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          accentBgSoft[accent],
          accentText[accent],
        )}
      >
        {icon}
      </span>
      <div className="mt-3.5">
        <div className="metric text-2xl font-semibold text-ink">{value}</div>
        <div className="mt-0.5 text-sm font-medium text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
        {progress !== undefined && (
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-panel"
            role="progressbar"
            aria-valuenow={Math.round(Math.max(0, Math.min(100, progress)))}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('h-full rounded-full transition-[width] duration-700 ease-out', accentBar[accent])}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </div>
    </>
  )

  if (typeof onClick !== 'function') {
    return (
      <div className={cn('glass-panel p-5', className)} style={style}>
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('glass-panel glass-panel-hover p-5 text-left cursor-pointer', className)}
      style={style}
    >
      {content}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Badges & pills
 * ------------------------------------------------------------------ */

/** Status/accent pill. Matches the Trainer `Badge` / `StatusPill` shape. */
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
 * Rows, empty states & avatars
 * ------------------------------------------------------------------ */

/**
 * Lightweight navigation/list row: icon, label, optional meta, trailing content.
 * Used for quick navigation and list content instead of boxed nav cards.
 */
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

/** Open, dashed empty state â€” no heavy panel behind it. */
export function TraineeEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-panel text-faint">
        {icon}
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Sidebar navigation
 * ------------------------------------------------------------------ */

/**
 * Sidebar link styled with the shared `.nav-item` utility so the Trainee rail
 * matches the Trainer rail. Includes the active indicator bar and an
 * optional notification dot. Presentation only â€” `onClick` is passed through.
 */
export function TraineeNavItem({
  icon,
  label,
  active = false,
  showDot = false,
  collapsed = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  showDot?: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  const iconNode = (
    <span
      className={cn(
        'relative flex h-4 w-4 shrink-0 items-center justify-center',
        active ? 'text-brand-cyan' : 'text-faint',
      )}
    >
      {icon}
      {showDot && (
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-rose ring-2 ring-card" />
      )}
    </span>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      data-active={active}
      className="nav-item w-full cursor-pointer"
    >
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-cyan transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      {iconNode}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}

/** Circular avatar with an accent disc, matching the Trainer `Avatar`. */
export function TraineeAvatar({
  initials,
  src,
  size = 40,
  accent = 'cyan',
  className,
}: {
  initials: string
  src?: string
  size?: number
  accent?: Accent
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-panel',
        className,
      )}
      style={{ height: size, width: size, fontSize: Math.max(11, Math.round(size * 0.36)) }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn('font-semibold', accentText[accent])}>{initials}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]" />
    </span>
  )
}
