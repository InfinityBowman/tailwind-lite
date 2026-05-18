/**
 * Market Indicator
 * Compact indicator for header showing market status
 */

import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  isGoodPrice,
  isBadPrice,
  getBestSellOpportunity,
  formatMarketChange,
} from '../../game/systems/MarketSystem';
import { SEED_TYPES } from '../../game/config/seeds';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarketIndicatorProps {
  onClick?: () => void;
  className?: string;
}

const MarketIndicator: React.FC<MarketIndicatorProps> = ({ onClick, className }) => {
  const { state } = useGame();
  const market = state.market;
  const plants = state.ship.resources.plants;

  // Get best opportunity from owned plants
  const bestOpportunity = useMemo(() => {
    return getBestSellOpportunity(market, plants);
  }, [market, plants]);

  // Count good opportunities
  const goodPriceCount = useMemo(() => {
    let count = 0;
    for (const plantType of Object.keys(plants)) {
      if (plants[plantType] > 0 && isGoodPrice(market, plantType)) {
        count++;
      }
    }
    return count;
  }, [market, plants]);

  // Determine indicator state
  const hasGoodOpportunity = bestOpportunity && bestOpportunity.multiplier >= 1.1;
  const hasBadMarket =
    goodPriceCount === 0 && Object.keys(plants).some(p => plants[p] > 0 && isBadPrice(market, p));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
              hasGoodOpportunity && 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
              hasBadMarket && 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
              !hasGoodOpportunity &&
                !hasBadMarket &&
                'bg-slate-700/50 text-slate-400 hover:bg-slate-700',
              className
            )}
          >
            {hasGoodOpportunity ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : hasBadMarket ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>Market</span>
            {hasGoodOpportunity && goodPriceCount > 0 && (
              <span className="bg-emerald-500 text-white px-1 rounded text-[10px]">
                {goodPriceCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {hasGoodOpportunity && bestOpportunity ? (
            <div>
              <div className="font-medium text-emerald-400">Good time to sell!</div>
              <div className="text-sm text-slate-300">
                {SEED_TYPES[bestOpportunity.plantType]?.name} at{' '}
                {formatMarketChange(bestOpportunity.multiplier)}
              </div>
            </div>
          ) : hasBadMarket ? (
            <div>
              <div className="font-medium text-red-400">Low prices</div>
              <div className="text-sm text-slate-300">
                Consider waiting for better market conditions
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium">Market prices stable</div>
              <div className="text-sm text-slate-300">Click to view all prices</div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MarketIndicator;
