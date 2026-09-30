import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  isIconOnly?: boolean;
  'aria-label'?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isIconOnly = false,
      disabled,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    if (isIconOnly && !ariaLabel && typeof children !== 'string') {
      console.warn('Button with isIconOnly requires an explicit aria-label for accessibility.');
    }

    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none';

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-hover active:opacity-90 shadow-sm',
      secondary: 'bg-surface-muted text-text-primary border border-border hover:bg-surface hover:border-border-strong',
      ghost: 'bg-transparent text-text-primary hover:bg-surface-muted',
      danger: 'bg-danger text-white hover:opacity-90 active:opacity-80 shadow-sm',
    };

    const sizeStyles = {
      sm: isIconOnly ? 'h-8 w-8 p-0' : 'h-8 px-3 text-xs gap-1.5',
      md: isIconOnly ? 'h-10 w-10 p-0' : 'h-10 px-4 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" aria-hidden="true" />
            {!isIconOnly && <span className="opacity-80">{children}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
