/**
 * Number Counter
 * Animated number that counts up/down when value changes
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useCountUp } from '../../hooks';
import { formatNumber } from '../../game/utils/numberFormat';

interface NumberCounterProps {
  value: number;
  duration?: number;
  format?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  duration = 500,
  format = true,
  prefix = '',
  suffix = '',
  className,
}) => {
  const displayValue = useCountUp({ end: value, duration });

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {format ? formatNumber(displayValue) : displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

export default NumberCounter;
