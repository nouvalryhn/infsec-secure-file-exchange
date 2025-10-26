'use client';

import * as React from 'react';
import { X, AlertTriangle, Trash2, Share2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        {children}
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-slate-900 dark:text-white', className)}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-slate-600 dark:text-slate-400 mt-1', className)}>
      {children}
    </p>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

interface DialogCloseProps {
  onClose: () => void;
  className?: string;
}

export function DialogClose({ onClose, className }: DialogCloseProps) {
  return (
    <button
      onClick={onClose}
      className={cn(
        'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
        className
      )}
    >
      <X className="w-5 h-5" />
    </button>
  );
}

// Confirmation Dialog Component
interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: 'warning' | 'delete' | 'share' | 'logout';
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'warning',
  onConfirm,
  isLoading = false
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'share':
        return <Share2 className="w-6 h-6 text-blue-600" />;
      case 'logout':
        return <LogOut className="w-6 h-6 text-slate-600" />;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          {getIcon()}
          <DialogTitle>{title}</DialogTitle>
        </div>
        <DialogClose onClose={() => onOpenChange(false)} />
      </DialogHeader>
      
      <DialogContent>
        <DialogDescription className="text-base">
          {description}
        </DialogDescription>
      </DialogContent>
      
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// Quick confirmation hook
export function useConfirmation() {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    icon?: 'warning' | 'delete' | 'share' | 'logout';
    onConfirm: () => void;
  } | null>(null);

  const confirm = React.useCallback((options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    icon?: 'warning' | 'delete' | 'share' | 'logout';
    onConfirm: () => void;
  }) => {
    setDialog({
      open: true,
      ...options
    });
  }, []);

  const ConfirmationComponent = dialog ? (
    <ConfirmationDialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!open) {
          setDialog(null);
        }
      }}
      title={dialog.title}
      description={dialog.description}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      variant={dialog.variant}
      icon={dialog.icon}
      onConfirm={dialog.onConfirm}
    />
  ) : null;

  return { confirm, ConfirmationComponent };
}