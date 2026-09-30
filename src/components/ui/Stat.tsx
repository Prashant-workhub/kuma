import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    direction: 'up' | 'down' | 'unchanged';
  };
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, delta, className }) => {
  return (
    <div className={cn('flex flex-col p-4 rounded-container border border-border bg-surface text-text-primary select-none', className)}>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <div className="flex items-baseline justify-between gap-2 mt-1.5">
        <span className="text-xl font-semibold text-text-primary tabular-nums tracking-tight">{value}</span>
        {delta && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
              delta.direction === 'up' && 'text-success',
              delta.direction === 'down' && 'text-danger',
              delta.direction === 'unchanged' && 'text-text-tertiary'
            )}
          >
            {delta.direction === 'up' && <ArrowUp className="h-3 w-3" aria-hidden="true" />}
            {delta.direction === 'down' && <ArrowDown className="h-3 w-3" aria-hidden="true" />}
            {delta.direction === 'unchanged' && <Minus className="h-3 w-3" aria-hidden="true" />}
            <span>{delta.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className,
  ...props
}) => {
  const getInitials = (n?: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeStyles = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full border border-border bg-surface-muted font-medium text-text-secondary overflow-hidden select-none',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
