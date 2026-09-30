/**
 * Project Kuma - Sequential Heatmap Matrix Component
 * Matrix chart with sequential color scale, explicit numeric cell text, keyboard tooltips,
 * and empty state handling.
 */

import React, { useState } from 'react';
import { getSequentialHeatmapClass, formatChartValue } from './colors';
import { EmptyState } from '../ui/Feedback';
import { Grid3x3 } from 'lucide-react';

export interface HeatmapMatrixRow {
  label: string;
  values: Record<string, number>;
}

export interface HeatmapProps {
  rows: HeatmapMatrixRow[];
  columns: string[];
  maxPossible?: number;
  unit?: string;
  accessibleName?: string;
  className?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  rows,
  columns,
  maxPossible = 100,
  unit = '%',
  accessibleName = 'Heatmap capacity coverage matrix',
  className,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    return (
      <div className="py-8 text-center">
        <EmptyState
          icon={<Grid3x3 className="h-8 w-8 text-text-tertiary" />}
          title="No Heatmap Data"
          description="Matrix matrix data points are unavailable."
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={`space-y-2 select-none overflow-x-auto ${className || ''}`}
      tabIndex={0}
    >
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border text-[11px] font-semibold text-text-secondary">
            <th className="py-2.5 px-3">Subject / Role</th>
            {columns.map((col) => (
              <th key={col} className="py-2.5 px-3 text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label} className="hover:bg-surface-muted/60">
              <td className="py-3 px-3 font-semibold text-text-primary text-xs">{row.label}</td>
              {columns.map((col) => {
                const val = row.values[col] ?? 0;
                const cellClass = getSequentialHeatmapClass(val, maxPossible);

                return (
                  <td
                    key={col}
                    className="p-1.5 text-center relative"
                    onMouseEnter={() => setHoveredCell({ row: row.label, col, val })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div
                      tabIndex={0}
                      onFocus={() => setHoveredCell({ row: row.label, col, val })}
                      onBlur={() => setHoveredCell(null)}
                      className={`py-2 px-3 rounded-control text-xs font-mono transition-transform hover:scale-105 cursor-pointer ${cellClass}`}
                      aria-label={`${row.label} - ${col}: ${formatChartValue(val, 'percent', unit)}`}
                    >
                      {formatChartValue(val, 'percent', unit)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Keyboard Reachable Cell Tooltip */}
      {hoveredCell && (
        <div className="p-2 rounded-control bg-surface border border-border shadow-overlay text-xs text-text-primary font-mono inline-block">
          <span className="font-bold">{hoveredCell.row}</span> ({hoveredCell.col}): {formatChartValue(hoveredCell.val, 'percent', unit)}
        </div>
      )}
    </div>
  );
};
