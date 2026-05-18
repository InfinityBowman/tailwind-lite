/**
 * SeedInventory - Redesigned with retro-terminal aesthetic
 *
 * Displays seed inventory with terminal styling.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameEngineContext';
import { isSeed, type SeedInstance } from '../../game';
import { SEED_SCRAP_VALUES } from '../../game/config/balance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Leaf, Trash2, Database, Layers } from 'lucide-react';
import { getTierStyles } from '@/utils/assets';
import SeedIcon from '@/components/ui/SeedIcon';
import { cn } from '@/lib/utils';

interface GroupedSeed {
  count: number;
  color: string;
  name: string;
  sample: SeedInstance;
  seeds: SeedInstance[];
}

const SeedInventory: React.FC = () => {
  const { state, scrapSeed } = useGame();
  const [showInventory, setShowInventory] = useState(true);
  const [minTierFilter, setMinTierFilter] = useState(1);

  const handleScrapSeed = (instanceId: string) => {
    scrapSeed(instanceId);
  };

  // Group seeds by ID and tier
  const groupedInventory = useMemo(() => {
    const acc: Record<string, Record<number, GroupedSeed>> = {};

    for (const item of state.ship.seedInventory) {
      if (!isSeed(item)) continue;

      const seed = item;
      const id = seed.id;
      const tier = seed.tier;

      if (!acc[id]) acc[id] = {};
      if (!acc[id][tier]) {
        acc[id][tier] = {
          count: 0,
          color: seed.color,
          name: seed.name,
          sample: seed,
          seeds: [],
        };
      }

      acc[id][tier].count++;
      acc[id][tier].seeds.push(seed);
    }

    return acc;
  }, [state.ship.seedInventory]);

  // Counts
  const totalSeeds = useMemo(
    () => state.ship.seedInventory.filter(item => isSeed(item)).length,
    [state.ship.seedInventory]
  );

  const fodderSeeds = useMemo(
    () => state.ship.seedInventory.filter(item => isSeed(item) && item.tier === 1),
    [state.ship.seedInventory]
  );

  const seedsByTier = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    state.ship.seedInventory.forEach(item => {
      if (isSeed(item)) {
        counts[item.tier] = (counts[item.tier] || 0) + 1;
      }
    });
    return counts;
  }, [state.ship.seedInventory]);

  const totalEssenceValue = useMemo(() => {
    return state.ship.seedInventory.reduce((sum, item) => {
      if (isSeed(item)) {
        return sum + (SEED_SCRAP_VALUES[item.tier as keyof typeof SEED_SCRAP_VALUES] || 1);
      }
      return sum;
    }, 0);
  }, [state.ship.seedInventory]);

  const maxTier = useMemo(() => {
    return state.ship.seedInventory.reduce((max, item) => {
      if (isSeed(item) && item.tier > max) return item.tier;
      return max;
    }, 0);
  }, [state.ship.seedInventory]);

  const handleScrapAllFodder = () => {
    fodderSeeds.forEach(seed => {
      scrapSeed(seed.instanceId);
    });
  };

  const getTierBadgeVariant = (tier: number) => {
    const variants: Record<number, 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' | 'tier6'> = {
      1: 'tier1',
      2: 'tier2',
      3: 'tier3',
      4: 'tier4',
      5: 'tier5',
      6: 'tier6',
    };
    return variants[tier] || 'tier1';
  };

  return (
    <div className="p-3">
      {/* Header row - compact */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm font-mono tabular-nums">{totalSeeds}</span>
          <span className="text-slate-500 text-xs">seeds</span>
          {maxTier >= 5 && (
            <Badge variant={getTierBadgeVariant(maxTier)} className="text-[9px] h-4">
              MAX:T{maxTier}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {totalEssenceValue > 0 && (
            <span className="text-[10px] font-mono text-purple-400">={totalEssenceValue} ESS</span>
          )}
          {fodderSeeds.length > 0 && (
            <Button
              onClick={handleScrapAllFodder}
              size="sm"
              className={cn(
                'gap-1 text-[10px] h-6 px-2 font-mono',
                'bg-red-500/10 hover:bg-red-500/20 text-red-400',
                'border border-red-500/30 hover:border-red-500/50'
              )}
            >
              <Trash2 className="w-2.5 h-2.5" />
              SCRAP {fodderSeeds.length} T1
            </Button>
          )}
        </div>
      </div>

      {/* Tier breakdown + filter combined row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex gap-1 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(tier => (
            <div
              key={tier}
              className={cn(
                'px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums',
                'bg-slate-800/50 border border-slate-700/30',
                seedsByTier[tier] > 0 ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              T{tier}:{seedsByTier[tier]}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-500 font-mono">MIN:</span>
          {[1, 2, 3, 4, 5, 6].map(tier => (
            <button
              key={tier}
              onClick={() => setMinTierFilter(minTierFilter === tier ? 1 : tier)}
              className={cn(
                'w-5 h-5 rounded text-[9px] font-mono font-bold transition-all border',
                minTierFilter >= tier
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-800/30 border-slate-700/30 text-slate-500 hover:text-slate-400'
              )}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle button - more compact */}
      <button
        onClick={() => setShowInventory(!showInventory)}
        className={cn(
          'w-full mb-2 px-3 py-1.5 rounded-lg',
          'bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50',
          'flex items-center justify-between',
          'text-xs font-mono text-slate-400 hover:text-slate-300',
          'transition-all'
        )}
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          {showInventory ? 'HIDE' : 'SHOW'}
        </span>
        {showInventory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Inventory grid */}
      <AnimatePresence>
        {showInventory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea className="h-[280px] rounded-lg border border-slate-700/50 bg-slate-800/20">
              {Object.keys(groupedInventory).length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 p-2">
                  {Object.entries(groupedInventory).flatMap(([seedId, tiers]) =>
                    Object.entries(tiers)
                      .filter(([tierLevel]) => Number(tierLevel) >= minTierFilter)
                      .map(([tierLevel, data], index) => {
                        const tier = Number(tierLevel);
                        const tierStyle = getTierStyles(tier);

                        return (
                          <motion.div
                            key={`${seedId}-${tierLevel}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              'rounded-lg overflow-hidden transition-all cursor-pointer group',
                              'hover:scale-[1.02] border',
                              tier >= 5 && 'glow-tier-' + tier
                            )}
                            style={tierStyle}
                          >
                            <div className="p-2 bg-slate-900/50 relative">
                              <div className="flex items-center gap-1.5 mb-1">
                                <SeedIcon seed={data.sample} size={24} className="shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-[10px] capitalize truncate block">
                                    {data.name}
                                  </span>
                                  <Badge
                                    variant={getTierBadgeVariant(tier)}
                                    className="text-[8px] h-3 px-1"
                                  >
                                    T{tier}
                                  </Badge>
                                </div>
                                <span className="text-sm font-bold font-mono tabular-nums">
                                  x{data.count}
                                </span>
                              </div>
                              {/* Scrap overlay on hover */}
                              <button
                                onClick={() => handleScrapSeed(data.seeds[0].instanceId)}
                                className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <span className="text-[8px] font-mono text-red-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-red-500/30">
                                  SCRAP +
                                  {SEED_SCRAP_VALUES[tier as keyof typeof SEED_SCRAP_VALUES] || 1}{' '}
                                  ESS
                                </span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Leaf className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-slate-500 font-mono text-xs">// NO_SEEDS</p>
                  <p className="text-[10px] text-slate-600">Pull from Gacha</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeedInventory;
