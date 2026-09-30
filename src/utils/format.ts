/**
 * Project Kuma - Locale-Aware Date, Time, Duration & Number Formatters
 * Ensures no raw ISO strings or unformatted floats in the UI.
 */

const DEFAULT_LOCALE = 'en-US';

/**
 * Formats a date into a localized readable date string (e.g., "Oct 1, 2026").
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'Invalid date';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, options || defaultOptions).format(date);
}

/**
 * Formats a time string or Date into localized time (e.g., "2:30 PM").
 */
export function formatTime(value: string | number | Date | null | undefined): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'Invalid time';

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a date and time combined (e.g., "Oct 1, 2026, 2:30 PM").
 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats duration in minutes into a human readable string (e.g., "45 mins" or "2h 15m").
 */
export function formatDuration(minutes: number): string {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes <= 0) {
    return '0 mins';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (remainingMins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Formats a percentage value rounding clean integer (e.g., "75%").
 */
export function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

/**
 * Formats a numeric value with locale thousands separator (e.g., "1,250").
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(value);
}
