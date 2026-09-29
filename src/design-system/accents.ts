/**
 * Accent colour system shared across UI primitives.
 *
 * These are Tailwind class *names*, not values — the actual colours resolve
 * through the `brand-*` tokens declared per theme in `src/index.css`, so the
 * same accent class reads correctly in both light and dark mode.
 */

export type Accent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose'

export const accentText: Record<Accent, string> = {
  gold: 'text-brand-gold',
  cyan: 'text-brand-cyan',
  emerald: 'text-brand-emerald',
  violet: 'text-brand-violet',
  rose: 'text-brand-rose',
}

export const accentBgSoft: Record<Accent, string> = {
  gold: 'bg-brand-gold/10',
  cyan: 'bg-brand-cyan/10',
  emerald: 'bg-brand-emerald/10',
  violet: 'bg-brand-violet/10',
  rose: 'bg-brand-rose/10',
}

export const accentBorder: Record<Accent, string> = {
  gold: 'border-brand-gold/30',
  cyan: 'border-brand-cyan/30',
  emerald: 'border-brand-emerald/30',
  violet: 'border-brand-violet/30',
  rose: 'border-brand-rose/30',
}

export const accentDot: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
}

export const accentBar: Record<Accent, string> = {
  gold: 'bg-brand-gold',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
  violet: 'bg-brand-violet',
  rose: 'bg-brand-rose',
}

/**
 * Glow shadows are now real utilities in `index.css`. The violet and rose
 * entries used to be inline `rgba()` values hardcoded for the dark canvas,
 * which is why they were invisible in light mode.
 */
export const accentGlow: Record<Accent, string> = {
  gold: 'shadow-glow-gold',
  cyan: 'shadow-glow-cyan',
  emerald: 'shadow-glow-emerald',
  violet: 'shadow-glow-violet',
  rose: 'shadow-glow-rose',
}
