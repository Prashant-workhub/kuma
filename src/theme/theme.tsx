/**
 * Kuma — single source of truth for the application theme.
 *
 * Historically the theme lived in two places at once: a `useState` in `App.tsx`
 * and a `ThemeContext` inside the Trainer portal. Both wrote the same DOM
 * attributes and the same `localStorage` keys, so they could disagree and
 * overwrite each other. This module owns the state, the persistence and the
 * DOM application so there is exactly one implementation.
 *
 * The actual colours live in `src/index.css`; nothing here decides a hex.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

/**
 * `kuma.theme` is canonical. `kuma_theme` is still read so preferences saved
 * by earlier builds carry over instead of silently resetting the user.
 */
const STORAGE_KEY = 'kuma.theme'
const LEGACY_STORAGE_KEY = 'kuma_theme'

const DEFAULT_THEME: ThemeMode = 'dark'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (isThemeMode(stored)) return stored
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The in-memory
    // theme still works; only persistence is lost.
  }
  return DEFAULT_THEME
}

function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
    window.localStorage.setItem(LEGACY_STORAGE_KEY, theme)
  } catch {
    // Non-fatal: see readStoredTheme.
  }
}

/**
 * Applies the theme to the document. The `dark` class and the `data-theme`
 * attribute are both written because the token layer in `index.css` and the
 * `@custom-variant dark` declaration each key off a different one.
 *
 * Safe to call before React mounts (see the inline script in `index.html`),
 * which avoids a flash of the wrong theme on first paint.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
  document.body.setAttribute('data-theme', theme)
}

export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    persistTheme(theme)
  }, [theme])

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), [])
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
