/**
 * Countdown Timer
 * Displays time remaining with auto-update
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { formatDuration } from '../../game/utils/numberFormat';

interface CountdownTimerProps {
  targetTime: number; // Unix timestamp when timer ends
  onComplete?: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime,
  onComplete,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000));
      setRemaining(timeLeft);

      if (timeLeft === 0) {
        onComplete?.();
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const isComplete = remaining === 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 font-mono',
        textSizes[size],
        isComplete ? 'text-green-400' : 'text-slate-300',
        className
      )}
    >
      {showIcon && <Clock className={cn(iconSizes[size], isComplete && 'animate-pulse')} />}
      <span>{isComplete ? 'Complete!' : formatDuration(remaining)}</span>
    </div>
  );
};

export default CountdownTimer;
