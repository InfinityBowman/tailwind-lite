/**
 * Toggle Group
 * Group of toggle buttons where one is selected
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-1.5',
  lg: 'text-base px-4 py-2 gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: ToggleGroupProps<T>) {
  return (
    <div className={cn('inline-flex rounded-lg bg-slate-800 p-1', className)} role="group">
      {options.map(option => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center rounded-md font-medium transition-colors',
              sizes[size],
              isSelected
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
            aria-pressed={isSelected}
          >
            {Icon && <Icon className={iconSizes[size]} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ToggleGroup;
export type { ToggleOption };
