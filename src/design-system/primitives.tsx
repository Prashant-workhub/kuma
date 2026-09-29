/**
 * Kuma shared UI primitives.
 *
 * Login, Admin, Trainer and Trainee all render through these. They existed
 * before as two near-identical copies — `teacher-portal/components/ui/*` and
 * `components/trainee/TraineeUI.tsx` — which had already drifted apart on
 * spacing, radii and accent defaults. Both now build on the definitions here.
 *
 * Presentation only: no data access, no business rules, no effects.
 * Every colour is a token, so both themes are handled by `index.css`.
 */

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { cn } from './cn'
import { accentBar, accentBgSoft, accentText, type Accent } from './accents'

export type { Accent } from './accents'

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

/**
 * Primary content surface. Use a card only when content genuinely needs
 * grouping — otherwise prefer open sections separated by whitespace/dividers.
 */
export function Card({
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

/** Thin hairline divider. */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // `primary` inverts text against the surface, so it stays legible in both
  // themes without needing a second hardcoded colour pair.
  primary: 'bg-ink text-canvas shadow-lift hover:opacity-90',
  // Gold is a light fill in dark mode and a dark fill in light mode, so the
  // label must flip with it. `text-white` pairs with the light-theme gold;
  // the dark-theme gold is bright enough to take near-black instead.
  accent: 'bg-brand-gold text-canvas shadow-glow-gold hover:brightness-105',
  secondary: 'border border-line bg-panel text-ink hover:border-accent/40 hover:bg-panel/70',
  ghost: 'text-muted hover:bg-panel hover:text-ink',
  danger: 'border border-brand-rose/30 bg-brand-rose/15 text-brand-rose hover:bg-brand-rose/25',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
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
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: ReactNode
  iconRight?: ReactNode
  block?: boolean
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Section hierarchy
 * ------------------------------------------------------------------ */

/**
 * Section header. The eyebrow → title → supporting line rhythm is identical
 * across every portal so headings land in the same place regardless of role.
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
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{eyebrow}</div>
        )}
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-muted">{icon}</span>}
          <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
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
 * KPI tile: icon disc, large metric, label, optional supporting line, delta and
 * progress bar. Renders as a button when `onClick` is supplied.
 */
export function Kpi({
  label,
  value,
  icon,
  accent = 'cyan',
  delta,
  deltaDir = 'up',
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
  delta?: string
  deltaDir?: 'up' | 'down' | 'flat'
  hint?: string
  /** 0–100; renders a slim bar beneath the metric. */
  progress?: number
  onClick?: () => void
  className?: string
  style?: CSSProperties
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            accentBgSoft[accent],
            accentText[accent],
          )}
        >
          {icon}
        </span>
        {delta && <DeltaBadge value={delta} dir={deltaDir} />}
      </div>
      <div className="mt-3.5">
        <div className="metric text-2xl font-semibold text-ink">{value}</div>
        <div className="mt-0.5 text-sm font-medium text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
        {progress !== undefined && <ProgressBar value={progress} accent={accent} />}
      </div>
    </>
  )

  if (typeof onClick !== 'function') {
    return (
      <div className={cn('glass-panel glass-panel-hover p-5', className)} style={style}>
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

function DeltaBadge({ value, dir }: { value: string; dir: 'up' | 'down' | 'flat' }) {
  const tone = dir === 'up' ? 'text-brand-emerald' : dir === 'down' ? 'text-brand-rose' : 'text-muted'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', tone)}>
      {/* Direction is carried by the glyph as well as colour. */}
      {dir === 'down' ? '▾' : dir === 'up' ? '▴' : '▬'}
      {value}
    </span>
  )
}

export function ProgressBar({
  value,
  accent = 'cyan',
  className,
}: {
  value: number
  accent?: Accent
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('mt-3 h-1.5 w-full overflow-hidden rounded-full bg-panel', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', accentBar[accent])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

/**
 * Sidebar link styled with the shared `.nav-item` utility so every rail
 * matches. Includes the active indicator bar and an optional notification dot.
 */
export function NavItem({
  icon,
  label,
  active = false,
  showDot = false,
  collapsed = false,
  accent = 'cyan',
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  showDot?: boolean
  collapsed?: boolean
  accent?: Accent
  onClick?: () => void
}) {
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
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-opacity',
          accentBar[accent],
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span
        className={cn(
          'relative flex h-4 w-4 shrink-0 items-center justify-center',
          active ? accentText[accent] : 'text-faint',
        )}
      >
        {icon}
        {showDot && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-brand-rose ring-2 ring-card" />}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
}

/** Named avatar sizes, shared by every portal. */
const AVATAR_SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
}

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Circular avatar. Accepts either a named `size` or an exact pixel `px`, since
 * the Trainer chrome uses named sizes while dense list rows use exact pixels.
 */
export function Avatar({
  initials,
  src,
  size = 'md',
  px,
  accent = 'cyan',
  className,
}: {
  initials: string
  src?: string
  size?: AvatarSize
  /** Exact pixel diameter; takes precedence over `size` when provided. */
  px?: number
  accent?: Accent
  className?: string
}) {
  const diameter = px ?? AVATAR_SIZE_PX[size]
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-panel',
        className,
      )}
      style={{ height: diameter, width: diameter, fontSize: Math.max(11, Math.round(diameter * 0.36)) }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={cn('font-semibold', accentText[accent])}>{initials}</span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

/** Open, dashed empty state — no heavy panel behind it. */
export function EmptyState({
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
