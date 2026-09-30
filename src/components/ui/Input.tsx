import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

// --- FormField Wrapper ---
export interface FormFieldProps {
  label?: string;
  helpText?: string;
  errorText?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helpText,
  errorText,
  required,
  htmlFor,
  children,
  className,
}) => {
  const generatedId = useId();
  const fieldId = htmlFor || generatedId;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = errorText ? `${fieldId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-text-primary flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-danger font-semibold" aria-hidden="true">*</span>}
        </label>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, {
            id: fieldId,
            'aria-describedby': describedBy,
            'aria-invalid': !!errorText || undefined,
          })
        : children}
      {errorText ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {errorText}
        </p>
      ) : helpText ? (
        <p id={helpId} className="text-xs text-text-secondary">
          {helpText}
        </p>
      ) : null}
    </div>
  );
};

// --- Input Component ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sizeVariant?: 'sm' | 'md';
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, sizeVariant = 'md', hasError, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-10 px-3 text-sm',
    };

    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-control border bg-surface text-text-primary placeholder:text-text-tertiary transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-strong',
          sizeStyles[sizeVariant],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// --- Textarea Component ---
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-20 p-3 text-sm rounded-control border bg-surface text-text-primary placeholder:text-text-tertiary transition-colors duration-150 resize-y',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-strong',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// --- Select Component ---
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  sizeVariant?: 'sm' | 'md';
  hasError?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, sizeVariant = 'md', hasError, options, children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-8 px-2.5 text-xs pr-8',
      md: 'h-10 px-3 text-sm pr-9',
    };

    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-control border bg-surface text-text-primary transition-colors duration-150 appearance-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-strong',
          sizeStyles[sizeVariant],
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);
Select.displayName = 'Select';
