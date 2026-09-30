import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Skeleton } from './Feedback';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'comfortable';
  stickyHeader?: boolean;
}

export const Table: React.FC<TableProps> = ({
  className,
  density = 'comfortable',
  stickyHeader = false,
  children,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-container border border-border bg-surface">
      <table
        className={cn(
          'w-full text-left text-sm text-text-primary border-collapse',
          density === 'compact' ? '[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3' : '[&_td]:py-3.5 [&_td]:px-4 [&_th]:py-3 [&_th]:px-4',
          stickyHeader && '[&_th]:sticky [&_th]:top-0 [&_th]:bg-surface-muted [&_th]:z-10',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <thead className={cn('bg-surface-muted border-b border-border font-medium text-xs text-text-secondary select-none', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-border/60', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={cn('transition-colors hover:bg-surface-muted/50 data-[state=selected]:bg-primary-subtle', className)} {...props}>
    {children}
  </tr>
);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export const TableHead: React.FC<TableHeadProps> = ({
  className,
  sortable,
  sortDirection,
  onSort,
  children,
  ...props
}) => {
  return (
    <th className={cn('font-semibold text-text-secondary', className)} {...props}>
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1.5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm transition-colors"
        >
          <span>{children}</span>
          {sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          ) : sortDirection === 'desc' ? (
            <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-text-tertiary opacity-70" aria-hidden="true" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={cn('align-middle text-sm text-text-primary', className)} {...props}>
    {children}
  </td>
);

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  action?: React.ReactNode;
}

export const TableEmptyRow: React.FC<TableEmptyProps> = ({ colSpan, message = 'No data available', action }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="py-8 text-center text-text-secondary">
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">{message}</p>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </TableCell>
  </TableRow>
);

export const TableLoadingRow: React.FC<{ colSpan: number; rows?: number }> = ({ colSpan, rows = 3 }) => (
  <>
    {Array.from({ length: rows }).map((_, idx) => (
      <TableRow key={idx}>
        <TableCell colSpan={colSpan} className="py-3">
          <Skeleton className="h-5 w-full rounded-sm" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

// Pagination is exported in Navigation.tsx
