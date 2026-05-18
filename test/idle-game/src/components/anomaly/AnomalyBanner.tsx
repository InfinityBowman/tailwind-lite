/**
 * Anomaly Banner
 * Displays active anomaly with countdown and click-to-collect
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Coins, Zap, Star, Gem, Leaf, Sparkles, X } from 'lucide-react';
import type { ActiveAnomaly, AnomalyType } from '../../game/systems/AnomalySystem';
import { ANOMALY_DEFINITIONS, getAnomalyTimeRemaining } from '../../game/systems/AnomalySystem';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnomalyBannerProps {
  anomaly: ActiveAnomaly;
  onCollect: () => void;
  onDismiss?: () => void;
  /** Whether EventBanner is showing (affects positioning) */
  hasActiveEvent?: boolean;
}

const ANOMALY_ICONS: Record<AnomalyType, React.ComponentType<{ className?: string }>> = {
  CREDIT_BURST: Coins,
  WARP_SPEED: Zap,
  LUCKY_STAR: Star,
  COSMIC_SHARD: Gem,
  SEED_RAIN: Leaf,
};

const ANOMALY_COLORS: Record<AnomalyType, { bg: string; border: string; text: string }> = {
  CREDIT_BURST: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
  },
  WARP_SPEED: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
  },
  LUCKY_STAR: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
  },
  COSMIC_SHARD: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
  },
  SEED_RAIN: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
  },
};

const AnomalyBanner: React.FC<AnomalyBannerProps> = ({
  anomaly,
  onCollect,
  onDismiss,
  hasActiveEvent = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(getAnomalyTimeRemaining(anomaly));
  const prefersReducedMotion = useReducedMotion();

  const definition = ANOMALY_DEFINITIONS[anomaly.type];
  const Icon = ANOMALY_ICONS[anomaly.type];
  const colors = ANOMALY_COLORS[anomaly.type];

  // Update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getAnomalyTimeRemaining(anomaly);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        onDismiss?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [anomaly, onDismiss]);

  const timeSeconds = Math.ceil(timeRemaining / 1000);

  return (
    <div
      role="alertdialog"
      aria-label={`${definition.name} anomaly detected. ${timeSeconds} seconds remaining. Click Collect to claim reward.`}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-50',
        // Position below EventBanner (h-10) + Header (h-14) when event active
        // Otherwise just below Header (top-16 = 64px, header ends at 56px)
        hasActiveEvent ? 'top-28' : 'top-16',
        'rounded-xl border-2 p-4 shadow-2xl backdrop-blur-sm',
        // Responsive width for mobile
        'w-[calc(100%-2rem)] sm:w-auto max-w-md',
        colors.bg,
        colors.border,
        !prefersReducedMotion && 'animate-bounce-gentle'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.text)} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('w-4 h-4', colors.text)} />
            <span className={cn('font-bold', colors.text)}>{definition.name}</span>
          </div>
          <p className="text-sm text-slate-300">{definition.description}</p>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              timeSeconds <= 3 ? 'text-red-400' : colors.text
            )}
          >
            {timeSeconds}s
          </div>
        </div>

        {/* Collect Button */}
        <Button
          onClick={onCollect}
          className={cn('font-bold', !prefersReducedMotion && 'animate-pulse')}
        >
          Collect!
        </Button>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-100', colors.text.replace('text-', 'bg-'))}
          style={{ width: `${(timeRemaining / 10000) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default AnomalyBanner;
