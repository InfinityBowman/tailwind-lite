/**
 * Labeled Value
 * Displays a label: value pair in a consistent format
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LabeledValueProps {
  label: string;
  value: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { label: 'text-xs', value: 'text-sm' },
  md: { label: 'text-sm', value: 'text-base' },
  lg: { label: 'text-sm', value: 'text-lg' },
};

const LabeledValue: React.FC<LabeledValueProps> = ({
  label,
  value,
  layout = 'horizontal',
  size = 'md',
  className,
}) => {
  const sizeConfig = sizes[size];

  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className={cn(sizeConfig.label, 'text-slate-400 mb-0.5')}>{label}</span>
        <span className={cn(sizeConfig.value, 'font-medium text-white')}>{value}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className={cn(sizeConfig.label, 'text-slate-400')}>{label}</span>
      <span className={cn(sizeConfig.value, 'font-medium text-white')}>{value}</span>
    </div>
  );
};

export default LabeledValue;
