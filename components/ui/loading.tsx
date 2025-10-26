'use client';

import { Loader2, Shield, FileText, Upload, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )} 
    />
  );
}

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className 
}: LoadingStateProps) {
  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      containerClasses[size],
      className
    )}>
      <LoadingSpinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
      <p className={cn(
        'text-slate-600 dark:text-slate-400 font-medium',
        textClasses[size]
      )}>
        {message}
      </p>
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
  icon?: 'shield' | 'file' | 'upload' | 'chart';
}

export function PageLoading({ 
  title = 'Loading...', 
  description,
  icon = 'shield'
}: PageLoadingProps) {
  const icons = {
    shield: Shield,
    file: FileText,
    upload: Upload,
    chart: BarChart3
  };

  const Icon = icons[icon];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-6">
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <LoadingSpinner size="lg" className="mb-4" />
        
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
        
        {description && (
          <p className="text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ 
  text = 'Loading...', 
  size = 'sm',
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      <span className={cn(
        'text-slate-600 dark:text-slate-400',
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {text}
      </span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
        className
      )} 
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}