/**
 * Lucky Star Indicator
 * Shows when the 2x production buff is active
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { LuckyStarBuff } from '../../game/systems/AnomalySystem';
import { getLuckyStarTimeRemaining } from '../../game/systems/AnomalySystem';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface LuckyStarIndicatorProps {
  buff: LuckyStarBuff;
  className?: string;
}

const LuckyStarIndicator: React.FC<LuckyStarIndicatorProps> = ({ buff, className }) => {
  const [timeRemaining, setTimeRemaining] = useState(getLuckyStarTimeRemaining(buff));
  const prefersReducedMotion = useReducedMotion();

  // Update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getLuckyStarTimeRemaining(buff));
    }, 100);

    return () => clearInterval(interval);
  }, [buff]);

  if (timeRemaining <= 0) return null;

  const timeSeconds = Math.ceil(timeRemaining / 1000);

  return (
    <div
      role="status"
      aria-label={`2x Production buff active. ${timeSeconds} seconds remaining.`}
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-purple-500/20 border border-purple-500/50',
        !prefersReducedMotion && 'animate-pulse',
        className
      )}
    >
      <Star className="w-4 h-4 text-purple-400 fill-purple-400" aria-hidden="true" />
      <span className="text-sm font-medium text-purple-400">2x Production</span>
      <span className="text-sm font-bold text-purple-300 tabular-nums">{timeSeconds}s</span>
    </div>
  );
};

export default LuckyStarIndicator;
