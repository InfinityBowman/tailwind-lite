/**
 * Shimmer Component
 * Loading shimmer effect
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  rounded = 'md',
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn('relative overflow-hidden bg-slate-700', roundedClasses[rounded], className)}
      style={{ width: widthStyle, height: heightStyle }}
    >
      {!prefersReducedMotion && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-600 to-transparent animate-[shimmer_2s_infinite]" />
      )}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Shimmer;
