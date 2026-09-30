/**
 * Project Kuma - Accessible SVG / HTML BarChart Component
 * Supports horizontal or vertical orientation, direct text value labels, light gridlines,
 * keyboard-reachable tooltips, and empty state handling.
 */

import React, { useState } from 'react';
import { ChartDataPoint, NumberFormatType } from './types';
import { CATEGORICAL_PALETTE, formatChartValue } from './colors';
import { EmptyState } from '../ui/Feedback';
import { BarChart3 } from 'lucide-react';

export interface BarChartProps {
  data: ChartDataPoint[];
  orientation?: 'horizontal' | 'vertical';
  unit?: string;
  formatType?: NumberFormatType;
  height?: number;
  axisTitle?: string;
  accessibleName?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  orientation = 'horizontal',
  unit = '%',
  formatType = 'percent',
  height = 240,
  axisTitle,
  accessibleName = 'Bar chart visualization',
  className,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center" style={{ minHeight: height }}>
        <EmptyState
          icon={<BarChart3 className="h-8 w-8 text-text-tertiary" />}
          title="No Data Available"
          description="There are no data points to display in this chart view."
        />
      </div>
    );
  }

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.value, d.targetValue || 0)));

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={`relative w-full space-y-2 select-none ${className || ''}`}
      tabIndex={0}
    >
      {axisTitle && (
        <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">
          {axisTitle}
        </div>
      )}

      {orientation === 'horizontal' ? (
        /* HORIZONTAL BAR LAYOUT */
        <div className="space-y-3">
          {data.map((item, idx) => {
            const colorSpec = CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length];
            const pct = (item.value / maxValue) * 100;
            const targetPct = item.targetValue ? (item.targetValue / maxValue) * 100 : null;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                tabIndex={0}
                aria-label={`${item.label}: ${formatChartValue(item.value, formatType, unit)}`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary truncate">{item.label}</span>
                  <span className="font-mono font-bold text-text-primary ml-2 shrink-0">
                    {formatChartValue(item.value, formatType, unit)}
                  </span>
                </div>

                <div className="relative h-3.5 w-full bg-surface-muted rounded-control overflow-hidden border border-border">
                  {/* Gridline markers */}
                  <div className="absolute inset-0 grid grid-cols-4 pointer-events-none divide-x divide-border/40" />

                  {/* Target benchmark marker */}
                  {targetPct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-text-primary z-10"
                      style={{ left: `${targetPct}%` }}
                      title={`Target: ${formatChartValue(item.targetValue!, formatType, unit)}`}
                    />
                  )}

                  {/* Main Value Bar */}
                  <div
                    className="h-full rounded-control transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colorSpec.stroke,
                    }}
                  />
                </div>

                {/* Keyboard Reachable Tooltip Overlay */}
                {isHovered && (
                  <div className="absolute left-1/2 -top-10 -translate-x-1/2 z-overlay px-3 py-1.5 rounded-control bg-surface border border-border shadow-overlay text-xs text-text-primary font-mono pointer-events-none whitespace-nowrap">
                    <span className="font-bold">{item.label}</span>: {formatChartValue(item.value, formatType, unit)}
                    {item.targetValue !== undefined && (
                      <span className="text-text-secondary ml-1">
                        (Target: {formatChartValue(item.targetValue, formatType, unit)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VERTICAL COLUMN LAYOUT */
        <div className="flex items-end gap-3 pt-6 border-b border-border" style={{ height }}>
          {data.map((item, idx) => {
            const colorSpec = CATEGORICAL_PALETTE[idx % CATEGORICAL_PALETTE.length];
            const heightPct = (item.value / maxValue) * 100;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                tabIndex={0}
                aria-label={`${item.label}: ${formatChartValue(item.value, formatType, unit)}`}
              >
                {/* Text Value Callout */}
                <span className="font-mono text-xs font-bold text-text-primary mb-1">
                  {formatChartValue(item.value, formatType, unit)}
                </span>

                {/* Bar Container */}
                <div className="w-full bg-surface-muted rounded-t-control overflow-hidden border border-border flex items-end justify-center h-full">
                  <div
                    className="w-full rounded-t-control transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: colorSpec.stroke,
                    }}
                  />
                </div>

                {/* Label */}
                <span className="mt-2 text-xs text-text-secondary font-mono truncate w-full text-center">
                  {item.label}
                </span>

                {/* Keyboard Reachable Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-overlay px-3 py-1.5 rounded-control bg-surface border border-border shadow-overlay text-xs text-text-primary font-mono whitespace-nowrap">
                    <span className="font-bold">{item.label}</span>: {formatChartValue(item.value, formatType, unit)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
