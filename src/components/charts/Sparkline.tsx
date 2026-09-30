/**
 * Project Kuma - Compact Accessible Sparkline Component
 */

import React from 'react';
import { CATEGORICAL_PALETTE } from './colors';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  accessibleName?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 24,
  color = CATEGORICAL_PALETTE[0].stroke,
  accessibleName = 'Sparkline trend',
  className,
}) => {
  if (!data || data.length === 0) {
    return <span className="text-xs text-text-tertiary font-mono">No data</span>;
  }

  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt}` : `${acc} L ${pt}`), '');
  const lastVal = data[data.length - 1];

  return (
    <div
      role="img"
      aria-label={`${accessibleName}: current value ${lastVal}`}
      className={`inline-flex items-center gap-2 select-none ${className || ''}`}
    >
      <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="2.5"
            fill={color}
          />
        )}
      </svg>
      <span className="font-mono text-xs font-bold text-text-primary">{lastVal}</span>
    </div>
  );
};
