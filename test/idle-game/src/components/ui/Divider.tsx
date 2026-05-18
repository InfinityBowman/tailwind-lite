/**
 * Divider Component
 * Horizontal or vertical dividing line
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', label, className }) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('w-px bg-slate-700 self-stretch', className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} role="separator">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>
    );
  }

  return (
    <div
      className={cn('h-px bg-slate-700 w-full', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
};

export default Divider;
