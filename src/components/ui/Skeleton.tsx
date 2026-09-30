import React from 'react';
import { cn } from '../../design-system/cn';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-panel-strong/60 rounded-xl',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-full',
        variant === 'card' && 'h-24 w-full',
        className
      )}
    />
  );
}
