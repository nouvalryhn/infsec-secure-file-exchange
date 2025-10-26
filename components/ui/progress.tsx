'use client';

import * as React from 'react';
import { CheckCircle, AlertCircle, Upload, Download, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning';
  showLabel?: boolean;
}

export function Progress({ 
  value, 
  className, 
  size = 'md',
  variant = 'default',
  showLabel = false 
}: ProgressProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="text-slate-900 dark:text-white font-medium">{value}%</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            variantClasses[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  variant = 'default',
  showLabel = false
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const variantColors = {
    default: 'stroke-blue-600',
    success: 'stroke-green-600',
    error: 'stroke-red-600',
    warning: 'stroke-yellow-600'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-out', variantColors[variant])}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-medium text-slate-900 dark:text-white">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

interface FileOperationProgressProps {
  operation: 'upload' | 'download' | 'encrypt' | 'decrypt';
  fileName: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
  className?: string;
}

export function FileOperationProgress({
  operation,
  fileName,
  progress,
  status,
  error,
  className
}: FileOperationProgressProps) {
  const getIcon = () => {
    switch (operation) {
      case 'upload':
        return <Upload className="w-5 h-5" />;
      case 'download':
        return <Download className="w-5 h-5" />;
      case 'encrypt':
      case 'decrypt':
        return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return null;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getOperationText = () => {
    switch (operation) {
      case 'upload':
        return 'Uploading';
      case 'download':
        return 'Downloading';
      case 'encrypt':
        return 'Encrypting';
      case 'decrypt':
        return 'Decrypting';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'in-progress':
        return `${getOperationText()}... ${progress}%`;
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg border',
      status === 'error' 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        : status === 'completed'
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
      className
    )}>
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg',
        status === 'error'
          ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
          : status === 'completed'
          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
          : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
      )}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {fileName}
          </p>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getStatusText()}
          </p>
          {status === 'in-progress' && (
            <span className="text-xs font-medium text-slate-900 dark:text-white">
              {progress}%
            </span>
          )}
        </div>
        
        {status === 'in-progress' && (
          <Progress 
            value={progress} 
            size="sm" 
            className="mt-2"
            variant="default"
          />
        )}
        
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface MultiStepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    description?: string;
  }>;
  className?: string;
}

export function MultiStepProgress({ steps, className }: MultiStepProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="relative">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                step.status === 'completed'
                  ? 'bg-green-600 border-green-600 text-white'
                  : step.status === 'in-progress'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : step.status === 'error'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600'
              )}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : step.status === 'in-progress' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' || step.status === 'in-progress'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {!isLast && (
              <div className={cn(
                'absolute left-4 top-8 w-0.5 h-4 -translate-x-0.5',
                step.status === 'completed'
                  ? 'bg-green-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}