/**
 * Re-export of the shared accent system.
 *
 * Accents now live in `src/design-system/accents.ts` so Trainer, Trainee and
 * Admin all resolve the same theme-aware colours. This alias is kept because
 * ~10 Trainer views import from this path.
 */
export * from '../../../design-system/accents'