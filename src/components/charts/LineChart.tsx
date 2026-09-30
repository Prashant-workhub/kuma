/**
 * Project Kuma - Accessible SVG LineChart Component
 * Line trend chart with data point markers, gridlines, standardized 12px axes, keyboard tooltips,
 * and empty state handling.
 */

import React, { useState } from 'react';
import { ChartDataPoint, NumberFormatType } from './types';
import { CATEGORICAL_PALETTE, formatChartValue } from './colors';
import { EmptyState } from '../ui/Feedback';
import { TrendingUp } from 'lucide-react';

export interface LineChartProps {
  data: ChartDataPoint[];
  unit?: string;
  formatType?: NumberFormatType;
  height?: number;
  axisTitle?: string;
  accessibleName?: string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  unit = '',
  formatType = 'integer',
  height = 200,
  axisTitle,
  accessibleName = 'Line trend chart visualization',
  className,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center" style={{ minHeight: height }}>
        <EmptyState
          icon={<TrendingUp className="h-8 w-8 text-text-tertiary" />}
          title="No Data Points"
          description="No historical timeline records exist for this chart."
        />
      </div>
    );
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const minValue = Math.min(0, ...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const svgWidth = 500;
  const svgHeight = height;
  const padding = 35;

  const points = data.map((d, idx) => {
    const x = padding + (idx / Math.max(1, data.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((d.value - minValue) / range) * (svgHeight - padding * 2);
    return { x, y, value: d.value, label: d.label };
  });

  const pathD = points.reduce(
    (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const colorSpec = CATEGORICAL_PALETTE[0];

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={`relative w-full select-none ${className || ''}`}
      tabIndex={0}
    >
      {axisTitle && (
        <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">
          {axisTitle}
        </div>
      )}

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          aria-hidden="true"
        >
          {/* Horizontal Gridlines (Light border token color) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding + pct * (svgHeight - padding * 2);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={svgWidth - padding}
                y2={y}
                stroke="currentColor"
                strokeDasharray="3 3"
                className="text-border/40"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fill */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`}
              fill={colorSpec.stroke}
              fillOpacity="0.1"
            />
          )}

          {/* Trend Line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke={colorSpec.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Markers */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                tabIndex={0}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
              >
                {/* Outer halo on hover */}
                {isHovered && <circle cx={p.x} cy={p.y} r="8" fill={colorSpec.stroke} fillOpacity="0.25" />}
                {/* Circle Marker */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? '5' : '4'}
                  fill="var(--color-surface, #ffffff)"
                  stroke={colorSpec.stroke}
                  strokeWidth="2"
                />
                {/* Label on Axis */}
                <text
                  x={p.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="fill-text-secondary text-[11px] font-mono"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Keyboard Reachable Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-overlay px-3 py-1.5 rounded-control bg-surface border border-border shadow-overlay text-xs text-text-primary font-mono whitespace-nowrap pointer-events-none -translate-x-1/2"
            style={{
              left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIdx].y / svgHeight) * 100 - 15}%`,
            }}
          >
            <span className="font-bold">{points[hoveredIdx].label}</span>: {formatChartValue(points[hoveredIdx].value, formatType, unit)}
          </div>
        )}
      </div>
    </div>
  );
};
