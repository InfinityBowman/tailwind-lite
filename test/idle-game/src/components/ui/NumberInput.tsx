/**
 * Number Input
 * Input for numeric values with increment/decrement buttons
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { input: 'w-12 text-sm', button: 'w-6 h-6', icon: 'w-3 h-3' },
  md: { input: 'w-16 text-base', button: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { input: 'w-20 text-lg', button: 'w-10 h-10', icon: 'w-5 h-5' },
};

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  size = 'md',
  className,
}) => {
  const sizeConfig = sizes[size];

  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  const handleDecrement = () => {
    if (canDecrement && !disabled) {
      const newValue = min !== undefined ? Math.max(min, value - step) : value - step;
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (canIncrement && !disabled) {
      const newValue = max !== undefined ? Math.min(max, value + step) : value + step;
      onChange(newValue);
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || !canDecrement}
        className={cn(sizeConfig.button, 'p-0')}
        aria-label="Decrease"
      >
        <Minus className={sizeConfig.icon} />
      </Button>

      <span className={cn(sizeConfig.input, 'text-center font-medium text-white tabular-nums')}>
        {value}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || !canIncrement}
        className={cn(sizeConfig.button, 'p-0')}
        aria-label="Increase"
      >
        <Plus className={sizeConfig.icon} />
      </Button>
    </div>
  );
};

export default NumberInput;
