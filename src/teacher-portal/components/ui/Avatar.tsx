/**
 * Re-export of the shared `Avatar`.
 *
 * The Trainer had its own avatar with an inset highlight ring baked in as a
 * hardcoded `rgba()` white shadow — invisible in light mode. The shared
 * primitive sizes itself and lets `index.css` own the treatment.
 */
export { Avatar } from '../../../design-system/primitives'
export type { AvatarSize } from '../../../design-system/primitives'