import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageHeader, PageHeaderProps } from '../ui/Navigation';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/Feedback';

export interface PageLayoutProps extends PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-6 w-full', className)}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />
      <div className="w-full">{children}</div>
    </div>
  );
};

export interface TwoColumnLayoutProps {
  main: React.ReactNode;
  aside: React.ReactNode;
  reverse?: boolean;
  className?: string;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  main,
  aside,
  reverse = false,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 w-full', className)}>
      <div className={cn('lg:col-span-8 flex flex-col gap-6', reverse && 'lg:order-2')}>{main}</div>
      <aside className={cn('lg:col-span-4 flex flex-col gap-6', reverse && 'lg:order-1')}>{aside}</aside>
    </div>
  );
};

export interface FocusLayoutProps {
  title: string;
  subtitle?: string;
  progress?: number; // 0 to 100
  onBack?: () => void;
  onExit?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const FocusLayout: React.FC<FocusLayoutProps> = ({
  title,
  subtitle,
  progress,
  onBack,
  onExit,
  children,
  className,
}) => {
  return (
    <div className="min-h-screen w-full bg-page text-text-primary flex flex-col font-sans select-none">
      {/* Reduced Chrome Top Bar */}
      <header className="h-14 border-b border-border bg-surface px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-sticky shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button variant="ghost" size="sm" isIconOnly onClick={onBack} aria-label="Back">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
            {subtitle && <p className="text-xs text-text-secondary truncate">{subtitle}</p>}
          </div>
        </div>

        {progress !== undefined && (
          <div className="hidden sm:flex items-center gap-3 w-48 max-w-xs">
            <ProgressBar value={progress} showLabel size="sm" />
          </div>
        )}

        {onExit && (
          <Button variant="secondary" size="sm" onClick={onExit} aria-label="Exit distraction-free view">
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        )}
      </header>

      {/* Main Distraction-free Content Area */}
      <main id="main-content" className={cn('flex-1 w-full max-w-5xl mx-auto p-4 md:p-8', className)}>
        {children}
      </main>
    </div>
  );
};
