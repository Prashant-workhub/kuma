import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

// --- Spinner ---
export interface SpinnerProps {
  size?: 16 | 20 | 24;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 20, className }) => {
  const sizeMap = {
    16: 'h-4 w-4',
    20: 'h-5 w-5',
    24: 'h-6 w-6',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary shrink-0', sizeMap[size], className)}
      aria-label="Loading..."
    />
  );
};

// --- Skeleton ---
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-control bg-surface-muted/80', className)}
      {...props}
    />
  );
};

// --- ProgressBar ---
export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  className,
  size = 'md',
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={cn('w-full flex items-center gap-3 select-none', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full bg-surface-muted border border-border/40', heightMap[size])}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-text-secondary w-9 text-right shrink-0">
          {percentage}%
        </span>
      )}
    </div>
  );
};

// --- EmptyState ---
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-container bg-surface/50', className)}>
      {icon && <div className="mb-3 text-text-tertiary">{icon}</div>}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};

// --- ErrorState ---
export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
  retryText = 'Try again',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-6 rounded-container border border-danger/30 bg-danger-subtle/50 text-text-primary', className)}>
      <AlertCircle className="h-6 w-6 text-danger mb-2" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryText}
        </Button>
      )}
    </div>
  );
};

// --- InlineAlert ---
export interface InlineAlertProps {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const variantStyles = {
    info: 'border-info/30 bg-info-subtle text-text-primary',
    warning: 'border-warning/30 bg-warning-subtle text-text-primary',
    danger: 'border-danger/30 bg-danger-subtle text-text-primary',
    success: 'border-success/30 bg-success-subtle text-text-primary',
  };

  const iconMap = {
    info: <Info className="h-4 w-4 text-info shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />,
    danger: <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" aria-hidden="true" />,
  };

  return (
    <div className={cn('flex items-start justify-between gap-3 p-3.5 rounded-container border text-xs', variantStyles[variant], className)}>
      <div className="flex items-start gap-2.5">
        {iconMap[variant]}
        <div className="flex flex-col gap-0.5">
          {title && <h4 className="font-semibold text-text-primary">{title}</h4>}
          <div className="text-text-secondary leading-relaxed">{children}</div>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="rounded-control p-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
