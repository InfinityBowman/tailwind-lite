/**
 * PlanetCard - Compact planet card for grid layout
 *
 * A compact card showing key planet info with quick action buttons.
 * Clicking the card opens PlanetDetailModal, but quick actions are accessible directly.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { type PlanetState, getTraitModifiers, SEED_FAMILY_INFO } from '../../game';
import { PLANET_DEFINITIONS, type PlanetTrait } from '../../game/config/planets';
import { MAX_SEEDS_PER_PLANET } from '../../game/config/balance';
import { calculateUpgradeCost } from '../../game/systems/UpgradeSystem';
import {
  getManagerForPlanet,
  calculateManagerProductionBonus,
} from '../../game/systems/ManagerSystem';
import { MANAGER_TEMPLATES, MANAGER_RARITY_CONFIG } from '../../game/config/managers';
import { SEED_TYPES, type SeedFamily } from '../../game/config/seeds';
import { useGame } from '../../contexts/GameEngineContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Leaf, TrendingUp, ArrowUp, SlidersHorizontal, Loader2 } from 'lucide-react';
import PlanetImage from '@/components/ui/PlanetImage';
import PlanetDetailModal, { type PlanetDetailTab } from './PlanetDetailModal';
import PlanetUpgradePopover from './PlanetUpgradePopover';
import { getManagerIcon } from '../managers/managerIcons';
import { cn } from '@/lib/utils';

interface PlanetCardProps {
  planet: PlanetState;
  planetIndex: number;
  extraSlots?: number;
}

const PlanetCard: React.FC<PlanetCardProps> = ({ planet, planetIndex, extraSlots = 0 }) => {
  const { state, isUpgrading } = useGame();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [initialTab, setInitialTab] = useState<PlanetDetailTab>('upgrades');
  const [upgradePopoverOpen, setUpgradePopoverOpen] = useState(false);

  const def = PLANET_DEFINITIONS[planet.id];
  const trait = def?.trait as PlanetTrait | undefined;
  const traitMods = getTraitModifiers(planet.id);

  const maxSeeds = MAX_SEEDS_PER_PLANET + extraSlots;
  const seedCount = planet.seeds?.length || 0;
  const credits = state.ship.totalCurrency;

  // Calculate total production
  const totalProduction = planet.plants.reduce((sum, plant) => sum + plant.productionRate, 0);

  // Export stats
  const effectiveExportSpeed = planet.exportSpeed * traitMods.exportSpeedMult;
  const effectiveStorageCapacity = Math.floor(
    planet.storageCapacity * traitMods.storageCapacityMult
  );

  // Check if production exceeds export throughput
  const isCapacityBottleneck = totalProduction > effectiveExportSpeed * 1.1;

  // Check if any upgrade is affordable
  const canAffordAnyUpgrade =
    credits >= calculateUpgradeCost('PRODUCTION_RATE', planet.upgrades.productionRate) ||
    credits >= calculateUpgradeCost('EXPORT_SPEED', planet.upgrades.exportSpeed) ||
    credits >= calculateUpgradeCost('STORAGE_CAPACITY', planet.upgrades.storageCapacity);

  // Notification status
  const hasEmptySlots = seedCount < maxSeeds && state.ship.seedInventory.length > 0;
  const needsAttention = seedCount === 0 && state.ship.seedInventory.length > 0;

  // Manager info
  const assignedManager = getManagerForPlanet(state.managers, planet.id);
  const managerTemplate = assignedManager ? MANAGER_TEMPLATES[assignedManager.templateId] : null;
  const managerRarity = managerTemplate ? MANAGER_RARITY_CONFIG[managerTemplate.rarity] : null;
  const managerProductionBonus = calculateManagerProductionBonus(state.managers, planet.id);
  const ManagerIcon = managerTemplate ? getManagerIcon(managerTemplate.icon) : null;

  // Planted families for preview
  const plantedFamilies = useMemo(() => {
    const families = new Map<SeedFamily, number>();
    for (const seed of planet.seeds) {
      const seedType = SEED_TYPES[seed.id];
      if (seedType) {
        families.set(seedType.family, (families.get(seedType.family) || 0) + 1);
      }
    }
    return Array.from(families.entries()).sort((a, b) => b[1] - a[1]);
  }, [planet.seeds]);

  // Storage fill percentage
  const storageFill = useMemo(() => {
    if (effectiveStorageCapacity <= 0) return 0;
    const totalStored = planet.plants.reduce((sum, p) => sum + p.currentAmount, 0);
    return Math.min(1, totalStored / effectiveStorageCapacity);
  }, [planet.plants, effectiveStorageCapacity]);
  const isStorageFull = storageFill > 0.95;

  const openModal = useCallback((tab: PlanetDetailTab = 'upgrades') => {
    setInitialTab(tab);
    setShowDetailModal(true);
  }, []);

  // Handle card click - open modal if not clicking buttons
  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')
    ) {
      return;
    }
    if (!upgradePopoverOpen && !showDetailModal) {
      openModal('upgrades');
    }
  };

  return (
    <>
      <motion.div
        onClick={handleCardClick}
        className={cn(
          'relative cursor-pointer rounded-xl p-3 transition-all duration-200',
          'bg-slate-800/40 hover:bg-slate-800/70',
          'border-2 hover:shadow-lg',
          canAffordAnyUpgrade || needsAttention
            ? 'border-cyan-500/40 hover:border-cyan-500/60'
            : 'border-slate-700/40 hover:border-slate-600/60'
        )}
        style={{
          borderColor: planet.color + '30',
          boxShadow:
            canAffordAnyUpgrade || needsAttention ? `0 0 20px ${planet.color}15` : undefined,
        }}
      >
        {/* Notification dot */}
        {(canAffordAnyUpgrade || needsAttention) && (
          <span
            className={cn(
              'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900',
              needsAttention ? 'bg-yellow-500' : 'bg-red-500',
              'animate-pulse'
            )}
          />
        )}

        <div className="flex items-center gap-3">
          {/* Planet image */}
          <div className="shrink-0">
            <PlanetImage
              planetId={planet.id}
              color={planet.color}
              size={48}
              glow={totalProduction > 0}
              pulse={false}
            />
          </div>

          {/* Info cluster */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-base" style={{ color: planet.color }}>
                {planet.name}
              </span>
              {trait && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 capitalize shrink-0">
                  {trait.replace(/_/g, ' ')}
                </Badge>
              )}
              {managerTemplate && ManagerIcon && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: managerRarity?.color + '20',
                          color: managerRarity?.color,
                        }}
                      >
                        <ManagerIcon className="w-2.5 h-2.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{managerTemplate.name}</p>
                      <p className="text-green-400">+{Math.round(managerProductionBonus * 100)}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Key stats row */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {/* Seeds */}
              <span className="flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                <span className={hasEmptySlots ? 'text-yellow-400' : ''}>
                  {seedCount}/{maxSeeds}
                </span>
                {plantedFamilies.length > 0 && (
                  <span className="flex items-center gap-0.5 ml-0.5">
                    {plantedFamilies.slice(0, 2).map(([family]) => (
                      <span
                        key={family}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: SEED_FAMILY_INFO[family].color }}
                      />
                    ))}
                  </span>
                )}
              </span>

              {/* Production */}
              <span
                className={cn(
                  'flex items-center gap-1 tabular-nums',
                  isCapacityBottleneck
                    ? 'text-yellow-400'
                    : totalProduction > 0
                      ? 'text-emerald-400'
                      : ''
                )}
              >
                <TrendingUp className="w-3 h-3" />
                {totalProduction > 0 ? `+${totalProduction.toFixed(1)}/s` : 'idle'}
                {isCapacityBottleneck && ' !'}
              </span>
            </div>

            {/* Storage fill bar */}
            <div className="mt-1.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isStorageFull
                              ? 'bg-red-500'
                              : storageFill > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-cyan-500/70'
                          )}
                          style={{
                            width: `${Math.max(storageFill * 100, storageFill > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-mono tabular-nums shrink-0',
                          isStorageFull ? 'text-red-400' : 'text-slate-500'
                        )}
                      >
                        {Math.round(storageFill * 100)}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-mono">
                    <p>
                      Storage: {Math.round(planet.plants.reduce((s, p) => s + p.currentAmount, 0))}/
                      {effectiveStorageCapacity}
                    </p>
                    <p className="text-slate-400">Export: {effectiveExportSpeed.toFixed(1)}/s</p>
                    {isStorageFull && (
                      <p className="text-red-400">Full! Production is being wasted</p>
                    )}
                    {isCapacityBottleneck && !isStorageFull && (
                      <p className="text-yellow-400">Export slower than production</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Upgrade popover button */}
            <PlanetUpgradePopover
              planet={planet}
              planetIndex={planetIndex}
              onOpenChange={setUpgradePopoverOpen}
            >
              <Button
                variant={canAffordAnyUpgrade ? 'warning' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 relative"
                disabled={isUpgrading}
              >
                {isUpgrading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
                {canAffordAnyUpgrade && !isUpgrading && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
                <span className="sr-only">Upgrades</span>
              </Button>
            </PlanetUpgradePopover>

            {/* Seeds/Details button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasEmptySlots ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0 relative"
                    onClick={e => {
                      e.stopPropagation();
                      openModal('seeds');
                    }}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {hasEmptySlots && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                    <span className="sr-only">Manage Seeds</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Manage Seeds</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>

      {/* Detail modal */}
      <PlanetDetailModal
        planet={planet}
        planetIndex={planetIndex}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        initialTab={initialTab}
      />
    </>
  );
};

export default PlanetCard;
