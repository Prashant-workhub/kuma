/**
 * Re-export of the shared `Button`.
 *
 * The Trainer and Trainee button implementations were duplicates that had
 * drifted on focus-ring colour and variant styling. Both now come from
 * `src/design-system/primitives.tsx`.
 */
export { Button } from '../../../design-system/primitives'
export type { ButtonVariant, ButtonSize } from '../../../design-system/primitives'