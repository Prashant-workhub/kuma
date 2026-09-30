/**
 * Project Kuma - Accessible SVG RadarChart Component
 * Multi-axis radar polygon comparing current vs target skill levels with vertex markers, numeric callouts,
 * keyboard-reachable tooltips, and empty state handling.
 */

import React, { useState } from 'react';
import { RadarDataPoint } from './types';
import { CATEGORICAL_PALETTE } from './colors';
import { EmptyState } from '../ui/Feedback';
import { Target } from 'lucide-react';

export interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  accessibleName?: string;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 280,
  accessibleName = 'Role Skill Gap Radar Chart',
  className,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center" style={{ minHeight: size }}>
        <EmptyState
          icon={<Target className="h-8 w-8 text-text-tertiary" />}
          title="No Competencies"
          description="No competency data points available for radar evaluation."
        />
      </div>
    );
  }

  const center = size / 2;
  const radius = size * 0.36;
  const count = data.length;
  const fullMark = data[0]?.fullMark || 5;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (value / fullMark) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Concentric Radar Web Rings
  const webRings = [0.25, 0.5, 0.75, 1.0];

  const currentPolygonPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.current);
      return `${x},${y}`;
    })
    .join(' ');

  const targetPolygonPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.target);
      return `${x},${y}`;
    })
    .join(' ');

  const primaryColor = CATEGORICAL_PALETTE[0].stroke;
  const targetColor = CATEGORICAL_PALETTE[2].stroke;

  return (
    <div
      role="img"
      aria-label={accessibleName}
      className={`relative inline-block select-none ${className || ''}`}
      style={{ width: size, height: size }}
      tabIndex={0}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Concentric Web Rings */}
        {webRings.map((ring, idx) => {
          const points = data
            .map((_, i) => {
              const { x, y } = getCoordinates(i, fullMark * ring);
              return `${x},${y}`;
            })
            .join(' ');
          return (
            <polygon
              key={idx}
              points={points}
              fill="none"
              stroke="currentColor"
              strokeDasharray={idx === webRings.length - 1 ? 'none' : '3 3'}
              className="text-border/40"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis Lines */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(i, fullMark);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth="1"
            />
          );
        })}

        {/* Target Level Polygon */}
        <polygon
          points={targetPolygonPoints}
          fill={targetColor}
          fillOpacity="0.1"
          stroke={targetColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Current Assessed Level Polygon */}
        <polygon
          points={currentPolygonPoints}
          fill={primaryColor}
          fillOpacity="0.2"
          stroke={primaryColor}
          strokeWidth="2.5"
        />

        {/* Vertex Markers & Labels */}
        {data.map((d, i) => {
          const currPt = getCoordinates(i, d.current);
          const axisPt = getCoordinates(i, fullMark * 1.18);
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(i)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
            >
              {/* Vertex Circle */}
              <circle
                cx={currPt.x}
                cy={currPt.y}
                r={isHovered ? '6' : '4'}
                fill="var(--color-surface, #ffffff)"
                stroke={primaryColor}
                strokeWidth="2"
              />

              {/* Competency Axis Text Label */}
              <text
                x={axisPt.x}
                y={axisPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text-primary text-[11px] font-semibold"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Keyboard Reachable Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          className="absolute z-overlay px-3 py-1.5 rounded-control bg-surface border border-border shadow-overlay text-xs text-text-primary font-mono whitespace-nowrap -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${getCoordinates(hoveredIdx, data[hoveredIdx].current).x}px`,
            top: `${getCoordinates(hoveredIdx, data[hoveredIdx].current).y - 20}px`,
          }}
        >
          <span className="font-bold">{data[hoveredIdx].label}</span>: Level {data[hoveredIdx].current} / Target Level {data[hoveredIdx].target}
        </div>
      )}
    </div>
  );
};
