/**
 * Skeleton Loader
 * Placeholder for loading content
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, width, height, circle = false }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'bg-slate-700',
        circle ? 'rounded-full' : 'rounded',
        !prefersReducedMotion && 'animate-pulse',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={cn(
            'rounded',
            i === lines - 1 && 'w-2/3' // Last line shorter
          )}
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn('p-4 rounded-lg bg-slate-800/50 border border-white/5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton circle width={40} height={40} />
        <div className="flex-1">
          <Skeleton height={16} className="w-24 mb-2" />
          <Skeleton height={12} className="w-32" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

export { Skeleton, SkeletonText, SkeletonCard };
