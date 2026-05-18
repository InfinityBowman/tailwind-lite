/**
 * Timer Component
 * Countdown or count-up timer display
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimerProps {
  targetTime?: number; // Unix timestamp for countdown
  startTime?: number; // Unix timestamp for count-up
  format?: 'short' | 'long' | 'full';
  onComplete?: () => void;
  showIcon?: boolean;
  className?: string;
}

function formatTime(ms: number, format: 'short' | 'long' | 'full'): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  switch (format) {
    case 'short':
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    case 'long':
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      return `${minutes}m ${seconds}s`;
    case 'full':
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    default:
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

const Timer: React.FC<TimerProps> = ({
  targetTime,
  startTime,
  format = 'short',
  onComplete,
  showIcon = false,
  className,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time difference
  let timeMs: number;
  let isCountdown: boolean;

  if (targetTime) {
    timeMs = targetTime - now;
    isCountdown = true;
  } else if (startTime) {
    timeMs = now - startTime;
    isCountdown = false;
  } else {
    timeMs = 0;
    isCountdown = false;
  }

  // Trigger onComplete when countdown reaches 0
  useEffect(() => {
    if (isCountdown && timeMs <= 0 && onComplete) {
      onComplete();
    }
  }, [isCountdown, timeMs, onComplete]);

  const display = formatTime(timeMs, format);
  const isUrgent = isCountdown && timeMs < 60000; // Less than 1 minute

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 tabular-nums',
        isUrgent && 'text-red-400',
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4" />}
      {display}
    </span>
  );
};

export default Timer;
