/**
 * Circular Progress Indicator
 * Ring-style progress for timers and loading states
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  className?: string;
  color?: 'default' | 'success' | 'warning' | 'purple';
}

const sizes = {
  sm: 48,
  md: 64,
  lg: 96,
};

const colors = {
  default: 'stroke-purple-500',
  success: 'stroke-green-500',
  warning: 'stroke-yellow-500',
  purple: 'stroke-purple-400',
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 'md',
  strokeWidth = 4,
  showValue = true,
  label,
  className,
  color = 'default',
}) => {
  const sizeValue = sizes[size];
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={sizeValue} height={sizeValue} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700"
        />

        {/* Progress circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-300', colors[color])}
        />
      </svg>

      {/* Center content */}
      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && <span className="text-sm font-bold text-white">{Math.round(value)}%</span>}
          {label && <span className="text-xs text-slate-400">{label}</span>}
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
