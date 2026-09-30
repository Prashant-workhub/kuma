/**
 * Project Kuma - Charting System Types
 */

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  targetValue?: number;
  category?: string;
  color?: string;
}

export interface RadarDataPoint {
  label: string;
  current: number;
  target: number;
  fullMark?: number;
}

export interface HeatmapCell {
  rowLabel: string;
  colLabel: string;
  value: number;
  maxPossible?: number;
}

export type NumberFormatType = 'number' | 'percent' | 'integer' | 'currency' | 'date';

export interface ChartPaletteColor {
  id: string;
  label: string;
  stroke: string;
  fill: string;
  darkStroke: string;
  darkFill: string;
  dashArray?: string;
  markerShape: 'circle' | 'square' | 'triangle' | 'diamond';
}
