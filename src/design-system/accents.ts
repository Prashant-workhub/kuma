/**
 * Accent colour system shared across UI primitives.
 *
 * These are Tailwind class *names*, not values — the actual colours resolve
 * through the `brand-*` tokens declared per theme in `src/index.css`, so the
 * same accent class reads correctly in both light and dark mode.
 */

export type Accent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'indigo' | 'amber' | 'purple' | 'sky' | 'teal'

export const accentText: Record<Accent, string> = {
  gold: 'text-brand-gold',
  cyan: 'text-brand-cyan',
  emerald: 'text-brand-emerald',
  violet: 'text-brand-violet',
  rose: 'text-brand-rose',
  indigo: 'text-brand-indigo',
  amber: 'text-brand-amber',
  purple: 'text-brand-purple',
  sky: 'text-brand-sky',
  teal: 'text-brand-teal',
}

export const accentBgSoft: Record<Accent, string> = {
  gold: 'bg-brand-gold/10',
  cyan: 'bg-brand-cyan/10',
  emerald: 'bg-brand-emerald/10',
  violet: 'bg-brand-violet/10',
  rose: 'bg-brand-rose/10',
  indigo: 'bg-brand-indigo/10',
  amber: 'bg-brand-amber/10',
  purple: 'bg-brand-purple/10',
  sky: 'bg-brand-sky/10',
  teal: 'bg-brand-teal/10',
}

export const accentBorder: Record<Accent, string> = {
  gold: 'border-brand-gold/30',
  cyan: 'border-brand-cyan/30',
  emerald: 'border-brand-emerald/30',
  violet: 'border-brand-violet/30',
  rose: 'border-brand-rose/30',
  indigo: 'border-brand-indigo/30',
  amber: 'border-brand-amber/30',
  purple: 'border-brand-purple/30',
  sky: 'border-brand-sky/30',
  teal: 'border-brand-teal/30',
}

export const accentDot: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
  indigo: 'bg-brand-indigo',
  amber: 'bg-brand-amber',
  purple: 'bg-brand-purple',
  sky: 'bg-brand-sky',
  teal: 'bg-brand-teal',
}

export const accentBar: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
  indigo: 'bg-brand-indigo',
  amber: 'bg-brand-amber',
  purple: 'bg-brand-purple',
  sky: 'bg-brand-sky',
  teal: 'bg-brand-teal',
}

/**
 * Glow shadows mapped to per-theme accent utilities in index.css.
 */
export const accentGlow: Record<Accent, string> = {
  gold: 'shadow-glow-gold',
  cyan: 'shadow-glow-cyan',
  emerald: 'shadow-glow-emerald',
  violet: 'shadow-glow-violet',
  rose: 'shadow-glow-rose',
  indigo: 'shadow-glow-indigo',
  amber: 'shadow-glow-amber',
  purple: 'shadow-glow-purple',
  sky: 'shadow-glow-sky',
  teal: 'shadow-glow-teal',
}
