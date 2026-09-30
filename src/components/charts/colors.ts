/**
 * Project Kuma - Chart Color Palettes & Accessible Color-Vision Utilities
 */

import { ChartPaletteColor, NumberFormatType } from './types';

/**
 * 6-Color Categorical Palette designed for high contrast and color-vision deficiency (deuteranopia, protanopia, tritanopia).
 * Each color includes distinct stroke markers and dash patterns so chart elements never rely on color alone.
 */
export const CATEGORICAL_PALETTE: ChartPaletteColor[] = [
  {
    id: 'primary',
    label: 'Primary Blue',
    stroke: '#2563EB',
    fill: 'rgba(37, 99, 235, 0.2)',
    darkStroke: '#60A5FA',
    darkFill: 'rgba(96, 165, 250, 0.25)',
    dashArray: 'none',
    markerShape: 'circle',
  },
  {
    id: 'teal',
    label: 'Teal Success',
    stroke: '#0D9488',
    fill: 'rgba(13, 148, 136, 0.2)',
    darkStroke: '#2DD4BF',
    darkFill: 'rgba(45, 212, 191, 0.25)',
    dashArray: '6 3',
    markerShape: 'square',
  },
  {
    id: 'amber',
    label: 'Amber Warning',
    stroke: '#D97706',
    fill: 'rgba(217, 119, 6, 0.2)',
    darkStroke: '#FBBF24',
    darkFill: 'rgba(251, 191, 36, 0.25)',
    dashArray: '2 2',
    markerShape: 'triangle',
  },
  {
    id: 'rose',
    label: 'Rose Danger',
    stroke: '#E11D48',
    fill: 'rgba(225, 29, 72, 0.2)',
    darkStroke: '#F43F5E',
    darkFill: 'rgba(244, 63, 94, 0.25)',
    dashArray: '8 4 2 4',
    markerShape: 'diamond',
  },
  {
    id: 'purple',
    label: 'Purple Accent',
    stroke: '#7C3AED',
    fill: 'rgba(124, 58, 237, 0.2)',
    darkStroke: '#A78BFA',
    darkFill: 'rgba(167, 139, 250, 0.25)',
    dashArray: '4 4',
    markerShape: 'circle',
  },
  {
    id: 'indigo',
    label: 'Indigo Focus',
    stroke: '#4F46E5',
    fill: 'rgba(79, 70, 229, 0.2)',
    darkStroke: '#818CF8',
    darkFill: 'rgba(129, 140, 248, 0.25)',
    dashArray: '10 2',
    markerShape: 'square',
  },
];

/**
 * Sequential heatmap color scale generator based on percentage (0-100%).
 */
export function getSequentialHeatmapClass(value: number, max: number = 100): string {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  if (pct >= 85) return 'bg-success/25 text-success font-bold border border-success/40';
  if (pct >= 70) return 'bg-primary/20 text-primary font-bold border border-primary/30';
  if (pct >= 50) return 'bg-warning/20 text-warning font-bold border border-warning/30';
  if (pct >= 25) return 'bg-surface-muted text-text-secondary border border-border';
  return 'bg-danger/20 text-danger font-bold border border-danger/30';
}

/**
 * Standardized Number & Unit Formatter for chart tooltips, labels, and axes.
 */
export function formatChartValue(val: number, format?: NumberFormatType, unit?: string): string {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  if (format === 'percent') return `${Math.round(val)}%`;
  if (format === 'integer') return `${Math.round(val)}${unit ? ' ' + unit : ''}`;
  if (format === 'date') return new Date(val).toLocaleDateString();
  const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1);
  return `${formatted}${unit ? ' ' + unit : ''}`;
}
