/**
 * Re-export of the shared surface + section-heading primitives.
 *
 * Trainer and Trainee each had their own `Card`/`SectionHeading`/`Divider`
 * with drifting radii and padding. They now come from
 * `src/design-system/primitives.tsx`; this alias keeps the existing
 * `../components/ui/Card` imports working.
 */
export { Card, SectionHeading, Divider } from '../../../design-system/primitives'