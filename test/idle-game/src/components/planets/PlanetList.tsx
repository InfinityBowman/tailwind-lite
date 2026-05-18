/**
 * PlanetList - Compact grid layout with retro-terminal aesthetic
 *
 * Displays unlocked planets in a responsive grid.
 * All interactions happen via PlanetDetailModal.
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../contexts/GameEngineContext';
import PlanetCard from './PlanetCard';
import { PLANET_DEFINITIONS, type PlanetTrait } from '../../game/config/planets';
import { Button } from '@/components/ui/button';
import { GamePanel, PanelHeader, GlowProgress, StatusBadge } from '@/components/ui/GamePanel';
import { Lock, TrendingUp, Package, Sparkles, Coins, Satellite } from 'lucide-react';
import { OnboardingHint, GAME_HINTS } from '@/components/ui';
import PlanetImage from '@/components/ui/PlanetImage';
import { cn } from '@/lib/utils';

const PlanetList: React.FC = () => {
  const { state, unlockPlanet, dismissHint, isHintDismissed, getInstalledMods } = useGame();

  const unlockedPlanets = state.planets.filter(p => p.unlocked);
  const lockedPlanets = state.planets.filter(p => !p.unlocked);

  const handleUnlock = async (planetId: string) => {
    const result = await unlockPlanet(planetId);
    if (!result.success) {
      console.warn('Failed to unlock:', result.error);
    }
  };

  // Calculate extra slots per planet from mods
  const getExtraSlots = useCallback(
    (planetId: string) => {
      const mods = getInstalledMods(planetId);
      return mods.reduce((sum, mod) => {
        if (mod.itemId === 'extra_slot_module') {
          return sum + 1;
        }
        return sum;
      }, 0);
    },
    [getInstalledMods]
  );

  // Show hint for players who have seeds but haven't planted any
  const hasSeeds = state.ship.seedInventory.length > 0;
  const hasNoPlantedSeeds = state.planets.every(p => !p.seeds || p.seeds.length === 0);
  const showPlantHint =
    hasSeeds && hasNoPlantedSeeds && state.hints && !state.hints.firstSeedPlanted;

  return (
    <div className="space-y-4">
      {/* Main planet grid panel */}
      <GamePanel
        withGrid
        header={
          <PanelHeader
            icon={<Satellite className="w-4 h-4" />}
            title="PLANETARY NETWORK"
            subtitle={`${unlockedPlanets.length} ONLINE // ${lockedPlanets.length} LOCKED`}
            status={<StatusBadge status="online" />}
          />
        }
      >
        {/* Onboarding hint */}
        {showPlantHint && (
          <div className="px-4 pt-3">
            <OnboardingHint
              {...GAME_HINTS.firstSeed}
              onDismiss={dismissHint}
              dismissed={isHintDismissed(GAME_HINTS.firstSeed.id)}
            />
          </div>
        )}

        {/* Unlocked Planets Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {unlockedPlanets.map((planet, index) => {
                const planetIndex = state.planets.findIndex(p => p.id === planet.id);
                const extraSlots = getExtraSlots(planet.id);

                return (
                  <motion.div
                    key={planet.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    layout
                  >
                    <PlanetCard planet={planet} planetIndex={planetIndex} extraSlots={extraSlots} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </GamePanel>

      {/* Next Planet to Unlock - compact single card */}
      {lockedPlanets.length > 0 &&
        (() => {
          const nextPlanet = lockedPlanets.reduce(
            (cheapest, planet) => (planet.unlockCost < cheapest.unlockCost ? planet : cheapest),
            lockedPlanets[0]
          );
          const def = PLANET_DEFINITIONS[nextPlanet.id];
          const trait = def?.trait as PlanetTrait | undefined;
          const canAfford = state.ship.totalCurrency >= nextPlanet.unlockCost;
          const creditsNeeded = nextPlanet.unlockCost - state.ship.totalCurrency;
          const remainingCount = lockedPlanets.length - 1;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative overflow-hidden rounded-xl p-4',
                'bg-slate-900/80 backdrop-blur-sm',
                'border',
                canAfford ? 'border-cyan-500/40' : 'border-slate-700/50'
              )}
            >
              {canAfford && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />}

              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-mono text-slate-500 uppercase">Next Target</span>
                  {remainingCount > 0 && (
                    <span className="text-[10px] font-mono text-slate-600 ml-auto">
                      +{remainingCount} more hidden
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Planet image */}
                  <div className="shrink-0 relative">
                    <PlanetImage
                      planetId={nextPlanet.id}
                      color={nextPlanet.color}
                      size={56}
                      glow={canAfford}
                      grayscale={!canAfford}
                    />
                    {!canAfford && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-700">
                          <Lock className="w-3 h-3 text-slate-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Planet info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold text-lg mb-1"
                      style={{ color: canAfford ? nextPlanet.color : 'rgb(148 163 184)' }}
                    >
                      {nextPlanet.name}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {nextPlanet.productionRate}/s
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {nextPlanet.storageCapacity}
                      </span>
                      {trait && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <Sparkles className="w-3 h-3" />
                          {trait.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unlock button */}
                  <Button
                    onClick={() => handleUnlock(nextPlanet.id)}
                    disabled={!canAfford}
                    size="sm"
                    className={cn(
                      'shrink-0 gap-1.5 font-mono text-xs h-9 px-4',
                      canAfford
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 hover:border-cyan-500/60'
                        : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                    )}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span className="tabular-nums">
                      {canAfford
                        ? nextPlanet.unlockCost.toLocaleString()
                        : `-${creditsNeeded.toLocaleString()}`}
                    </span>
                  </Button>
                </div>

                {/* Progress bar */}
                {!canAfford && (
                  <div className="mt-3">
                    <GlowProgress
                      value={state.ship.totalCurrency}
                      max={nextPlanet.unlockCost}
                      color={nextPlanet.color}
                    />
                  </div>
                )}

                {canAfford && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-cyan-400 mt-3 text-center font-mono"
                  >
                    // READY_TO_UNLOCK
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })()}
    </div>
  );
};

export default PlanetList;
