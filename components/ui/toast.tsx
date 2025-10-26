'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 200);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-lg transition-all duration-200 transform',
        getStyles(),
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
            {toast.title}
          </h4>
          {toast.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}