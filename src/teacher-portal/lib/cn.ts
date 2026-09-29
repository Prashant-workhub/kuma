/**
 * Re-export of the shared className joiner.
 *
 * `cn` now lives in `src/design-system/cn.ts`. This alias keeps the many
 * existing `../lib/cn` imports working while leaving a single implementation.
 */
export { cn } from '../../design-system/cn'