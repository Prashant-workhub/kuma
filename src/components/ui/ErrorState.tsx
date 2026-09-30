import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../design-system/primitives';
import { cn } from '../../design-system/cn';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
  className?: string;
  icon?: ReactNode;
}

export function ErrorState({
  title = 'An error occurred',
  message,
  onRetry,
  actionLabel = 'Try again',
  className,
  icon
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-brand-rose/30 bg-brand-rose/10 p-6 text-center text-ink font-sans',
        className
      )}
    >
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-rose/40 bg-brand-rose/20 text-brand-rose">
        {icon || <AlertCircle aria-hidden="true" className="h-6 w-6" />}
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={onRetry}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
