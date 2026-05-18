/**
 * Resources Grid - Redesigned with retro-terminal aesthetic
 *
 * Visual inventory grid for harvested plants.
 * Matches the AILandingPage design language with cyan accents,
 * grid patterns, and glow effects.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Coins, Package, ArrowUpRight } from 'lucide-react';
import { SEED_TYPES, SEED_FAMILY_INFO, type SeedFamily } from '../../game/config/seeds';
import { formatNumber } from '../../game/utils/numberFormat';
import { getCropImage } from '../../utils/assets';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { GamePanel, PanelHeader, DataValue } from './GamePanel';

interface ResourceItemProps {
  plantType: string;
  amount: number;
  sellValue: number;
  onSell: (type: string) => void;
  index: number;
}

const ResourceItem: React.FC<ResourceItemProps> = ({
  plantType,
  amount,
  sellValue,
  onSell,
  index,
}) => {
  const seedDef = SEED_TYPES[plantType];
  const family = seedDef?.family || 'bio';
  const familyInfo = SEED_FAMILY_INFO[family as SeedFamily];
  const displayAmount = Math.floor(amount);
  const totalValue = sellValue * displayAmount;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            onClick={() => onSell(plantType)}
            className={cn(
              'relative group flex flex-col items-center justify-center',
              'p-3 rounded-lg transition-all duration-200',
              'bg-slate-800/50 hover:bg-slate-800',
              'border border-slate-700/50 hover:border-cyan-500/30',
              'hover:shadow-lg hover:shadow-cyan-500/10'
            )}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow ring on hover */}
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                boxShadow: `inset 0 0 20px ${familyInfo.color}15`,
              }}
            />

            {/* Crop image */}
            <div
              className="relative w-12 h-12 rounded-lg overflow-hidden border-2 bg-black/30"
              style={{
                borderColor: `${familyInfo.color}60`,
                boxShadow: `0 0 15px ${familyInfo.color}20`,
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

              {/* Scan line effect */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                }}
              />
            </div>

            {/* Amount */}
            <div className="mt-2 text-sm font-mono font-medium tabular-nums text-slate-200">
              {formatNumber(displayAmount)}
            </div>

            {/* Value */}
            <div className="flex items-center gap-1 text-[10px] font-mono tabular-nums text-emerald-400/80">
              <Coins className="w-2.5 h-2.5" />
              {formatNumber(totalValue)}
            </div>

            {/* Sell overlay */}
            <div className="absolute inset-0 rounded-lg bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="absolute bottom-1 text-[9px] font-mono font-medium text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-500/30">
                SELL
              </span>
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-xs">
          <div className="font-medium capitalize text-slate-100">{plantType}</div>
          <div className="text-slate-400 font-mono">
            {familyInfo.name} // ${sellValue}/unit
          </div>
          <div className="text-cyan-400 mt-1 font-mono">
            Click to sell for ${totalValue.toLocaleString()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ResourcesGridProps {
  plants: Record<string, number>;
  plantSellValues: Record<string, number>;
  onSellPlant: (type: string) => void;
  onSellAll: () => void;
}

const ResourcesGrid: React.FC<ResourcesGridProps> = ({
  plants,
  plantSellValues,
  onSellPlant,
  onSellAll,
}) => {
  // Filter and sort plants by value (highest first)
  const sortedPlants = Object.entries(plants)
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => {
      const valueA = (plantSellValues[a[0]] || 0) * a[1];
      const valueB = (plantSellValues[b[0]] || 0) * b[1];
      return valueB - valueA;
    });

  const totalValue = sortedPlants.reduce(
    (sum, [type, amt]) => sum + (plantSellValues[type] || 0) * Math.floor(amt),
    0
  );

  const isEmpty = sortedPlants.length === 0;

  return (
    <GamePanel
      withGrid
      withScanlines
      className="overflow-visible"
      header={
        <div className="flex items-center justify-between">
          <PanelHeader
            icon={<Package className="w-4 h-4" />}
            title="CARGO HOLD"
            subtitle={!isEmpty ? `${sortedPlants.length} ITEMS` : 'EMPTY'}
          />
          {!isEmpty && (
            <div className="flex items-center gap-4">
              <DataValue
                label="Total Value"
                value={`$${totalValue.toLocaleString()}`}
                color="rgb(52 211 153)"
              />
              <Button
                onClick={onSellAll}
                size="sm"
                className={cn(
                  'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400',
                  'border border-cyan-500/30 hover:border-cyan-500/50',
                  'font-mono text-xs gap-1.5'
                )}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                SELL ALL
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="p-4" data-resources-panel>
        {/* Grid of resources */}
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 font-mono">// NO CARGO</p>
            <p className="text-xs text-slate-600 mt-1">Plant seeds and export harvests</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              <AnimatePresence mode="popLayout">
                {sortedPlants.map(([type, amount], index) => (
                  <ResourceItem
                    key={type}
                    plantType={type}
                    amount={amount}
                    sellValue={plantSellValues[type] || 0}
                    onSell={onSellPlant}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Family legend */}
            {sortedPlants.length > 3 && (
              <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-slate-700/50">
                {Object.entries(SEED_FAMILY_INFO)
                  .filter(([family]) =>
                    sortedPlants.some(([type]) => SEED_TYPES[type]?.family === family)
                  )
                  .map(([family, info]) => (
                    <div
                      key={family}
                      className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono"
                    >
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{
                          backgroundColor: info.color,
                          boxShadow: `0 0 6px ${info.color}50`,
                        }}
                      />
                      {info.name.toUpperCase()}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </GamePanel>
  );
};

export default ResourcesGrid;
