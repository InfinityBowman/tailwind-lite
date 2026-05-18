/**
 * Market Ticker
 * Horizontal bar showing today's in-demand crop families
 */

import React, { useMemo } from 'react';
import { Flame, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getDailyDemandsInfo,
  getTimeUntilDemandReset,
  formatMarketChange,
} from '../../game/systems/MarketSystem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarketTickerProps {
  className?: string;
  compact?: boolean;
}

/**
 * Format milliseconds to human-readable time (e.g., "5h 23m")
 */
function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

const MarketTicker: React.FC<MarketTickerProps> = ({ className, compact = false }) => {
  const demands = useMemo(() => getDailyDemandsInfo(), []);
  const timeRemaining = useMemo(() => getTimeUntilDemandReset(), []);

  if (demands.length === 0) return null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                'bg-amber-500/20 text-amber-400',
                className
              )}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hot</span>
              <div className="flex gap-1">
                {demands.map(d => (
                  <span
                    key={d.family}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                ))}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="font-medium text-amber-400 mb-1">Today's Hot Crops</div>
            <div className="space-y-1">
              {demands.map(d => (
                <div key={d.family} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300">{d.name}</span>
                  <span className="text-emerald-400">{formatMarketChange(d.multiplier)}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Resets in {formatTimeRemaining(timeRemaining)}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10',
        'border border-amber-500/20',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-amber-400">
        <Flame className="w-4 h-4" />
        <span className="text-sm font-medium">Hot Today:</span>
      </div>

      <div className="flex items-center gap-3 flex-1">
        {demands.map(d => (
          <div key={d.family} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-slate-300">{d.name}</span>
            <span className="text-xs font-medium text-emerald-400">
              ({formatMarketChange(d.multiplier)})
            </span>
          </div>
        ))}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining(timeRemaining)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="text-sm">Time until daily reset</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default MarketTicker;
