/**
 * @deprecated Re-export of the application-wide theme.
 *
 * The Trainer portal used to own a second, independent theme state that wrote
 * the same `data-theme` attributes and `localStorage` keys as the root app.
 * That meant the portal could silently reset or fight the user's choice.
 *
 * Theme now lives in `src/theme/theme.tsx` and is mounted once at the app
 * root, so every portal shares one persisted value. This module is kept as a
 * thin alias so the many existing `../../context/ThemeContext` imports
 * (TopBar, and anything else added later) keep resolving.
 */
export { ThemeProvider, useTheme } from '../../theme/theme'
export type { ThemeMode, ThemeContextValue } from '../../theme/theme'

