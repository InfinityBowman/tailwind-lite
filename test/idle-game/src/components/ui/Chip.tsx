/**
 * Chip Component
 * Compact element for tags/labels with optional delete
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ChipProps {
  children: React.ReactNode;
  onDelete?: () => void;
  variant?: 'default' | 'outline' | 'filled';
  color?: 'default' | 'success' | 'warning' | 'error' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

const colors = {
  default: {
    filled: 'bg-slate-700 text-white',
    outline: 'border-slate-600 text-slate-300',
    default: 'bg-slate-700/50 text-slate-300',
  },
  success: {
    filled: 'bg-green-600 text-white',
    outline: 'border-green-500 text-green-400',
    default: 'bg-green-600/20 text-green-400',
  },
  warning: {
    filled: 'bg-yellow-600 text-white',
    outline: 'border-yellow-500 text-yellow-400',
    default: 'bg-yellow-600/20 text-yellow-400',
  },
  error: {
    filled: 'bg-red-600 text-white',
    outline: 'border-red-500 text-red-400',
    default: 'bg-red-600/20 text-red-400',
  },
  purple: {
    filled: 'bg-purple-600 text-white',
    outline: 'border-purple-500 text-purple-400',
    default: 'bg-purple-600/20 text-purple-400',
  },
};

const sizes = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
};

const Chip: React.FC<ChipProps> = ({
  children,
  onDelete,
  variant = 'default',
  color = 'default',
  size = 'md',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variant === 'outline' && 'border',
        colors[color][variant],
        sizes[size],
        className
      )}
    >
      {children}
      {onDelete && (
        <button
          onClick={onDelete}
          className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <X className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      )}
    </span>
  );
};

export default Chip;
