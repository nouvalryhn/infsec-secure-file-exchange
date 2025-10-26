'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

export function FormField({ 
  label, 
  error, 
  required, 
  children, 
  description,
  className 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showStrength?: boolean;
}

export function PasswordInput({ 
  error, 
  showStrength = false, 
  className, 
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [strength, setStrength] = React.useState(0);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    if (showStrength) {
      setStrength(calculateStrength(password));
    }
    props.onChange?.(e);
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          onChange={handlePasswordChange}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {showStrength && props.value && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  level <= strength ? getStrengthColor(strength) : 'bg-slate-200 dark:bg-slate-700'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Password strength: {getStrengthText(strength)}
          </p>
        </div>
      )}
    </div>
  );
}

interface FormErrorProps {
  errors: Record<string, string>;
  className?: string;
}

export function FormError({ errors, className }: FormErrorProps) {
  const errorEntries = Object.entries(errors).filter(([_, value]) => value);
  
  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {errorEntries.length === 1 ? (
          errorEntries[0][1]
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface FormSuccessProps {
  message: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  return (
    <Alert variant="success" className={className}>
      <Check className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({ 
  onFileSelect, 
  accept = '*/*', 
  maxSize = 10 * 1024 * 1024, // 10MB default
  error,
  className,
  children 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      // You might want to handle this error differently
      console.error(validationError);
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : error
            ? 'border-red-300 hover:border-red-400'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        {children}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export function ProgressBar({ 
  value, 
  className, 
  showLabel = true,
  color = 'blue' 
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="text-slate-900 dark:text-white font-medium">{value}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}