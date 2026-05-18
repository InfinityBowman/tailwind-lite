/**
 * Stat Block
 * Displays a stat with label and value in a compact block
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatBlockProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  change?: number; // Positive = green, negative = red
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: {
    wrapper: 'p-2',
    label: 'text-xs',
    value: 'text-sm',
    icon: 'w-3 h-3',
  },
  md: {
    wrapper: 'p-3',
    label: 'text-xs',
    value: 'text-lg',
    icon: 'w-4 h-4',
  },
  lg: {
    wrapper: 'p-4',
    label: 'text-sm',
    value: 'text-2xl',
    icon: 'w-5 h-5',
  },
};

const StatBlock: React.FC<StatBlockProps> = ({
  icon: Icon,
  label,
  value,
  change,
  size = 'md',
  className,
}) => {
  const sizeConfig = sizes[size];

  return (
    <div
      className={cn(
        'rounded-lg bg-slate-800/50 border border-white/5',
        sizeConfig.wrapper,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={cn(sizeConfig.icon, 'text-slate-400')} />}
        <span className={cn(sizeConfig.label, 'text-slate-400 uppercase tracking-wide')}>
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn(sizeConfig.value, 'font-bold text-white')}>{value}</span>

        {change !== undefined && change !== 0 && (
          <span
            className={cn('text-xs font-medium', change > 0 ? 'text-green-400' : 'text-red-400')}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
};

export default StatBlock;
