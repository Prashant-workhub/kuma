import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);
  const info = useCallback((message: string) => toast(message, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, removeToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastBanner key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

const ToastBanner: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const variantStyles = {
    success: 'border-success/30 bg-surface text-text-primary',
    error: 'border-danger/30 bg-surface text-text-primary',
    info: 'border-info/30 bg-surface text-text-primary',
  };

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />,
    error: <AlertTriangle className="h-4 w-4 text-danger shrink-0" aria-hidden="true" />,
    info: <Info className="h-4 w-4 text-info shrink-0" aria-hidden="true" />,
  };

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-container border shadow-overlay text-xs font-medium animate-in fade-in-50 slide-in-from-bottom-2 duration-200',
        variantStyles[toast.variant || 'info']
      )}
    >
      <div className="flex items-center gap-2.5">
        {iconMap[toast.variant || 'info']}
        <span>{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss toast"
        className="rounded-control p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};
