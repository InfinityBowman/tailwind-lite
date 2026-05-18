/**
 * Loading Spinner
 * Animated spinner for loading states
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label = 'Loading...',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div role="status" aria-label={label} className={cn('text-slate-400 text-sm', className)}>
        Loading...
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'rounded-full border-slate-600 border-t-purple-500 animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

export default LoadingSpinner;
