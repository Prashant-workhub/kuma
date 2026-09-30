import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-text-secondary select-none', className)}>
      <ol className="inline-flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />}
              {isLast ? (
                <span className="font-medium text-text-primary" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick || item.href ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// PageHeader and Toolbar are now defined and exported in Navigation.tsx
