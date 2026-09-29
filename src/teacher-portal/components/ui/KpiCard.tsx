/**
 * Re-export of the shared `Kpi` tile as `KpiCard`.
 *
 * The Trainer KPI applied `animate-fade-up`, a class that was never defined
 * anywhere in the build, so the entrance animation silently did nothing. The
 * shared tile is a superset: it adds the delta indicator and optional
 * progress bar that only the Trainee version had.
 */
export { Kpi as KpiCard } from '../../../design-system/primitives'