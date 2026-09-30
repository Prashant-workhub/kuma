import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles = {
    neutral: 'bg-surface-muted text-text-secondary border-border',
    info: 'bg-info-subtle text-text-info-subtle border-info/30',
    success: 'bg-success-subtle text-text-success-subtle border-success/30',
    warning: 'bg-warning-subtle text-text-warning-subtle border-warning/30',
    danger: 'bg-danger-subtle text-text-danger-subtle border-danger/30',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-0.5 text-xs leading-normal',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface StatusPillProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed' | 'pending';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const statusConfig: Record<StatusPillProps['status'], { label: string; variant: BadgeProps['variant'] }> = {
    not_started: { label: 'Not started', variant: 'neutral' },
    in_progress: { label: 'In progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    passed: { label: 'Passed', variant: 'success' },
    failed: { label: 'Failed', variant: 'danger' },
    pending: { label: 'Pending', variant: 'warning' },
  };

  const { label, variant } = statusConfig[status] || { label: status, variant: 'neutral' };

  return <Badge variant={variant} className={className}>{label}</Badge>;
};
