/**
 * Animated Number
 * Displays a number with count-up animation when it changes
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { formatNumber } from '../../game/utils/numberFormat';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: boolean;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 500,
  format = true,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    const start = prevValue.current;
    const change = value - start;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + change * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={cn('tabular-nums', className)}>
      {format ? formatNumber(displayValue) : displayValue.toLocaleString()}
    </span>
  );
};

export default AnimatedNumber;
