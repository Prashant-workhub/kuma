import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface PaginationProps {
  /** Current active page (1-based). Also accepts page as alias. */
  currentPage?: number;
  page?: number;
  totalPages: number;
  /** Optional: total record count for display purposes. */
  totalItems?: number;
  /** Optional: page size for display purposes. */
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}) => {
  const activePage = currentPage ?? page ?? 1;

  if (totalPages <= 1) return null;

  const getPages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (activePage > 3) pages.push('ellipsis');
    const start = Math.max(2, activePage - 1);
    const end = Math.min(totalPages - 1, activePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (activePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 px-4 py-3 select-none', className)}
    >
      {totalItems != null && pageSize != null && (
        <span className="text-xs text-text-secondary">
          Showing{' '}
          <span className="font-medium text-text-primary">
            {Math.min((activePage - 1) * pageSize + 1, totalItems)}–
            {Math.min(activePage * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-medium text-text-primary">{totalItems}</span>
        </span>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {getPages().map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 w-8 flex items-center justify-center text-text-tertiary text-sm"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === activePage ? 'page' : undefined}
              className={cn(
                'h-8 w-8 rounded-control text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                p === activePage
                  ? 'bg-primary text-white'
                  : 'text-text-primary hover:bg-surface-muted border border-transparent hover:border-border'
              )}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------
export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}) => {
  const sizeStyles: Record<string, string> = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-9 px-3 text-sm gap-1.5',
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-control border border-border bg-surface-muted p-0.5',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={opt.disabled}
          onClick={() => !opt.disabled && onChange(opt.value)}
          className={cn(
            'inline-flex items-center justify-center rounded-[calc(var(--radius-control,6px)-2px)] font-medium transition-colors select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            sizeStyles[size],
            value === opt.value
              ? 'bg-surface text-text-primary shadow-sm border border-border/60'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------
export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  className,
}) => {
  return (
    <header className={cn('flex flex-col gap-2 pb-4 border-b border-border', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-text-tertiary flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden="true" className="text-text-tertiary">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? 'text-text-primary font-medium'
                        : undefined
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
          )}
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </header>
  );
};

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
export interface ToolbarProps {
  /** A pre-built search input node OR pass searchValue + onSearchChange for the built-in search. */
  search?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  search,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Table toolbar"
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3',
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        {/* Accepts either a pre-built node or controlled value */}
        {search ??
          (onSearchChange !== undefined && (
            <div className="relative max-w-xs w-full">
              <input
                type="search"
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={cn(
                  'w-full h-9 pl-3 pr-3 text-sm rounded-control border border-border bg-surface',
                  'text-text-primary placeholder:text-text-tertiary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  'transition-colors'
                )}
              />
            </div>
          ))}
        {filters && (
          <div className="flex items-center gap-2 flex-wrap">{filters}</div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
};
