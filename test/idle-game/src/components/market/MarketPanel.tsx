/**
 * Market Panel
 * Shows current market prices and trends for all plant types
 */

import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Clock, Coins, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SEED_TYPES } from '../../game/config/seeds';
import {
  getMarketMultiplier,
  getMarketTrend,
  formatMarketChange,
  getTimeUntilMarketUpdate,
  isGoodPrice,
  isBadPrice,
  type MarketTrend,
} from '../../game/systems/MarketSystem';

interface PlantPriceRowProps {
  plantType: string;
  multiplier: number;
  trend: MarketTrend;
  amount: number;
  baseValue: number;
}

const TrendIcon: React.FC<{ trend: MarketTrend }> = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
};

const PlantPriceRow: React.FC<PlantPriceRowProps> = ({
  plantType,
  multiplier,
  trend,
  amount,
  baseValue,
}) => {
  const seedType = SEED_TYPES[plantType];
  const isGood = multiplier >= 1.15;
  const isBad = multiplier <= 0.85;
  const changeStr = formatMarketChange(multiplier);
  const currentValue = Math.floor(baseValue * multiplier);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        isGood && 'bg-emerald-500/10 border border-emerald-500/20',
        isBad && 'bg-red-500/10 border border-red-500/20',
        !isGood && !isBad && 'bg-slate-800/50'
      )}
    >
      {/* Plant name */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{seedType?.name || plantType}</div>
        <div className="text-xs text-slate-400">{amount.toLocaleString()} in storage</div>
      </div>

      {/* Price change */}
      <div className="flex items-center gap-1.5">
        <TrendIcon trend={trend} />
        <span
          className={cn(
            'text-sm font-medium min-w-[4rem] text-right',
            isGood && 'text-emerald-400',
            isBad && 'text-red-400',
            !isGood && !isBad && 'text-slate-300'
          )}
        >
          {changeStr}
        </span>
      </div>

      {/* Current value */}
      <div className="text-right min-w-[4rem]">
        <div className="text-sm font-bold text-yellow-400 flex items-center justify-end gap-1">
          <Coins className="w-3 h-3" />
          {currentValue}
        </div>
        <div className="text-[10px] text-slate-500">per plant</div>
      </div>
    </div>
  );
};

const MarketPanel: React.FC = () => {
  const { state } = useGame();
  const plants = state.ship.resources.plants;
  const market = state.market;

  // Get all plants with their market data
  const plantData = useMemo(() => {
    const data: Array<{
      plantType: string;
      multiplier: number;
      trend: MarketTrend;
      amount: number;
      baseValue: number;
    }> = [];

    // Show all seed types, not just ones in storage
    for (const [seedId, seedType] of Object.entries(SEED_TYPES)) {
      const amount = plants[seedId] || 0;
      data.push({
        plantType: seedId,
        multiplier: getMarketMultiplier(market, seedId),
        trend: getMarketTrend(market, seedId),
        amount,
        baseValue: seedType.baseSellValue,
      });
    }

    // Sort by multiplier (best prices first)
    return data.sort((a, b) => b.multiplier - a.multiplier);
  }, [plants, market]);

  // Filter to only show plants player has
  const ownedPlants = useMemo(() => plantData.filter(p => p.amount > 0), [plantData]);

  // Time until next update
  const timeUntilUpdate = getTimeUntilMarketUpdate(market);
  const minutesUntilUpdate = Math.ceil(timeUntilUpdate / 60000);

  // Best opportunity
  const bestOpportunity = plantData.find(p => p.amount > 0 && p.multiplier >= 1.1);

  // Count good/bad prices
  const goodPrices = plantData.filter(p => isGoodPrice(market, p.plantType)).length;
  const badPrices = plantData.filter(p => isBadPrice(market, p.plantType)).length;

  return (
    <div className="space-y-4">
      {/* Market summary */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Galactic Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{goodPrices} high</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{badPrices} low</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Updates in {minutesUntilUpdate}m</span>
            </div>
          </div>

          {bestOpportunity && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs text-emerald-300">Best sell opportunity:</div>
              <div className="font-medium text-emerald-400">
                {SEED_TYPES[bestOpportunity.plantType]?.name} at{' '}
                {formatMarketChange(bestOpportunity.multiplier)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your plants */}
      {ownedPlants.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Your Plants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {ownedPlants.map(plant => (
              <PlantPriceRow key={plant.plantType} {...plant} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* All market prices */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">All Market Prices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {plantData.map(plant => (
            <PlantPriceRow key={plant.plantType} {...plant} />
          ))}
        </CardContent>
      </Card>

      {/* Market info */}
      <div className="text-xs text-slate-500 text-center">
        Prices fluctuate every 5 minutes based on galactic supply and demand.
        <br />
        Sell when prices are high for maximum profit!
      </div>
    </div>
  );
};

export default MarketPanel;
