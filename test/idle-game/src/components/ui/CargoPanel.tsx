/**
 * CargoPanel - Side drawer for cargo hold
 *
 * A slide-out drawer from the right edge showing harvested plants.
 * Collapsed: Shows a tab with count/value on the right edge
 * Expanded: Full drawer slides out with cargo grid
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Package, ChevronLeft, ChevronRight, Coins, ArrowUpRight, X, Loader2 } from 'lucide-react';
import { SEED_TYPES, SEED_FAMILY_INFO, type SeedFamily } from '../../game/config/seeds';
import { formatNumber } from '../../game/utils/numberFormat';
import { getCropImage } from '../../utils/assets';
import { useAnimatedValues } from '../../hooks/useAnimatedValue';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { ScrollArea } from './scroll-area';

interface CargoItemProps {
  plantType: string;
  animatedAmount: number;
  sellValue: number;
  onSell: (type: string) => void;
  isSelling?: boolean;
}

const CargoItem: React.FC<CargoItemProps> = ({
  plantType,
  animatedAmount,
  sellValue,
  onSell,
  isSelling,
}) => {
  const seedDef = SEED_TYPES[plantType];
  const family = seedDef?.family || 'bio';
  const familyInfo = SEED_FAMILY_INFO[family as SeedFamily];
  const displayAmount = Math.floor(animatedAmount);
  const totalValue = sellValue * displayAmount;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => onSell(plantType)}
            disabled={isSelling}
            className={cn(
              'relative group flex flex-col items-center justify-center',
              'p-2 rounded-lg transition-all duration-200',
              'bg-slate-800/70 hover:bg-slate-700/90',
              'border border-slate-700/50 hover:border-emerald-500/40',
              isSelling && 'opacity-60 cursor-not-allowed'
            )}
            whileHover={isSelling ? undefined : { scale: 1.05 }}
            whileTap={isSelling ? undefined : { scale: 0.95 }}
          >
            {/* Crop image */}
            <div
              className="relative w-12 h-12 rounded overflow-hidden border bg-black/30"
              style={{
                borderColor: `${familyInfo.color}50`,
              }}
            >
              {(() => {
                const imageSrc = getCropImage(plantType);
                return imageSrc ? (
                  <img src={imageSrc} alt={plantType} className="w-full h-full object-contain" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: familyInfo.color }}
                  >
                    {plantType.slice(0, 2).toUpperCase()}
                  </div>
                );
              })()}
            </div>

            {/* Amount badge */}
            <div className="mt-1.5 text-xs font-mono font-medium tabular-nums text-slate-200">
              {formatNumber(displayAmount)}
            </div>

            {/* Value */}
            <div className="text-[10px] font-mono text-emerald-400/70">
              +{formatNumber(totalValue)}
            </div>

            {/* Sell overlay on hover */}
            <div className="absolute inset-0 rounded-lg bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="absolute bottom-0 text-[9px] font-mono font-bold text-emerald-400 bg-slate-900/95 px-2 py-1 rounded-t border-t border-x border-emerald-500/30">
                SELL
              </span>
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-xs">
          <div className="font-medium capitalize text-slate-100">{plantType}</div>
          <div className="text-emerald-400 font-mono">+{totalValue.toLocaleString()} CR</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface CargoPanelProps {
  plants: Record<string, number>;
  plantSellValues: Record<string, number>;
  cargoRates?: Record<string, number>;
  onSellPlant: (type: string) => void;
  onSellAll: () => void;
  isSelling?: boolean;
  className?: string;
}

const CargoPanel: React.FC<CargoPanelProps> = ({
  plants,
  plantSellValues,
  cargoRates = {},
  onSellPlant,
  onSellAll,
  isSelling = false,
}) => {
  // Load expanded state from localStorage
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem('cargoPanelOpen');
    return stored === 'true';
  });

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('cargoPanelOpen', String(isOpen));
  }, [isOpen]);

  // Merge plant types from server state AND active cargo rates, memoized to
  // prevent useAnimatedValues from getting a new array ref every render.
  const { plantEntries, animationItems } = useMemo(() => {
    const allTypes = new Set([...Object.keys(plants), ...Object.keys(cargoRates)]);

    const entries = Array.from(allTypes)
      .sort()
      .map(type => ({ type, serverAmount: plants[type] || 0, rate: cargoRates[type] || 0 }))
      .filter(p => p.serverAmount > 0 || p.rate > 0);

    return {
      plantEntries: entries,
      animationItems: entries.map(p => ({ value: p.serverAmount, rate: p.rate, min: 0 })),
    };
  }, [plants, cargoRates]);

  // Single animation source for all plant amounts — totals derived from these
  const animatedAmounts = useAnimatedValues(animationItems);

  // Derive totals from the same animated values so they stay perfectly in sync
  const totalPlants = animatedAmounts.reduce((sum, amt) => sum + Math.floor(amt), 0);
  const totalValue = plantEntries.reduce(
    (sum, p, i) => sum + (plantSellValues[p.type] || 0) * Math.floor(animatedAmounts[i]),
    0
  );
  const isEmpty = plantEntries.length === 0;

  // Sort for display (by animated value, highest first)
  const sortedPlants = plantEntries
    .map((p, i) => ({ type: p.type, animatedAmount: animatedAmounts[i] }))
    .sort((a, b) => {
      const valueA = (plantSellValues[a.type] || 0) * a.animatedAmount;
      const valueB = (plantSellValues[b.type] || 0) * b.animatedAmount;
      return valueB - valueA;
    });

  return (
    <>
      {/* Edge tab trigger - always visible on right edge */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40',
          'flex items-center gap-1.5 py-3 pl-2 pr-1',
          'rounded-l-lg transition-all',
          'bg-slate-900/95 backdrop-blur-sm border border-r-0',
          isEmpty ? 'border-slate-700/50' : 'border-emerald-500/40',
          !isEmpty && 'shadow-lg shadow-emerald-500/10'
        )}
        whileHover={{ x: -4 }}
        data-cargo-panel-trigger
      >
        <div className="flex flex-col items-center gap-1">
          <Package className={cn('w-5 h-5', isEmpty ? 'text-slate-500' : 'text-emerald-400')} />
          {!isEmpty && (
            <>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                {formatNumber(totalPlants)}
              </span>
              <span className="text-[9px] font-mono text-amber-400/80 tabular-nums">
                +{formatNumber(totalValue)}
              </span>
            </>
          )}
        </div>
        {isOpen ? (
          <ChevronRight className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-slate-500" />
        )}
      </motion.button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed right-0 top-0 bottom-0 z-50 w-72',
                'bg-slate-900/98 backdrop-blur-sm',
                'border-l border-emerald-500/30',
                'shadow-2xl shadow-black/50',
                'flex flex-col'
              )}
              data-cargo-panel
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span className="font-mono font-bold text-sm text-emerald-400">CARGO_HOLD</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stats bar */}
              {!isEmpty && (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">ITEMS:</span>
                    <span className="text-sm font-mono font-bold text-slate-200 tabular-nums">
                      {formatNumber(totalPlants)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                      +{formatNumber(totalValue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Cargo grid */}
              <ScrollArea className="flex-1">
                {!isEmpty ? (
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {sortedPlants.map(({ type, animatedAmount }) => (
                      <CargoItem
                        key={type}
                        plantType={type}
                        animatedAmount={animatedAmount}
                        sellValue={plantSellValues[type] || 0}
                        onSell={onSellPlant}
                        isSelling={isSelling}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Package className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="text-sm font-mono text-slate-500">// CARGO_EMPTY</p>
                    <p className="text-[10px] text-slate-600 mt-1">Harvest plants to fill cargo</p>
                  </div>
                )}
              </ScrollArea>

              {/* Footer with sell all button */}
              {!isEmpty && (
                <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
                  <Button
                    onClick={onSellAll}
                    disabled={isSelling}
                    className={cn(
                      'w-full h-9 gap-2 font-mono text-sm',
                      'bg-emerald-500/20 hover:bg-emerald-500/30',
                      'text-emerald-400 hover:text-emerald-300',
                      'border border-emerald-500/40 hover:border-emerald-500/60',
                      isSelling && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {isSelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    {isSelling ? 'SELLING...' : `SELL_ALL // +${formatNumber(totalValue)} CR`}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CargoPanel;
