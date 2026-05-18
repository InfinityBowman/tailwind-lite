import React, { useState, useCallback, useMemo } from 'react';
import { type PlanetState, getTraitModifiers, SEED_FAMILY_INFO } from '../../game';
import { PLANET_DEFINITIONS, type PlanetTrait } from '../../game/config/planets';
import { MAX_SEEDS_PER_PLANET } from '../../game/config/balance';
import { calculateUpgradeCost } from '../../game/systems/UpgradeSystem';
import {
  getManagerForPlanet,
  calculateManagerProductionBonus,
} from '../../game/systems/ManagerSystem';
import { MANAGER_TEMPLATES, MANAGER_RARITY_CONFIG } from '../../game/config/managers';
import { hasAffinity, getFamiliesWithAffinity } from '../../game/systems/AffinitySystem';
import { SEED_TYPES, type SeedFamily } from '../../game/config/seeds';
import { useGame } from '../../contexts/GameEngineContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronDown,
  Leaf,
  ArrowUp,
  SlidersHorizontal,
  Coins,
  Users,
  Sparkles,
} from 'lucide-react';
import PlanetImage from '@/components/ui/PlanetImage';
import PlanetUpgradePopover from './PlanetUpgradePopover';
import PlanetDetailModal, { type PlanetDetailTab } from './PlanetDetailModal';
import { getManagerIcon } from '../managers/managerIcons';

interface PlanetCollapsedProps {
  planet: PlanetState;
  planetIndex: number;
  onExpand: () => void;
  extraSlots?: number;
}

const PlanetCollapsed: React.FC<PlanetCollapsedProps> = ({
  planet,
  planetIndex,
  onExpand,
  extraSlots = 0,
}) => {
  const { state } = useGame();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [upgradePopoverOpen, setUpgradePopoverOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<PlanetDetailTab>('upgrades');

  // Open modal with specific tab
  const openModal = useCallback((tab: PlanetDetailTab = 'upgrades') => {
    setInitialTab(tab);
    setShowDetailModal(true);
  }, []);

  const def = PLANET_DEFINITIONS[planet.id];
  const trait = def?.trait as PlanetTrait | undefined;
  const traitMods = getTraitModifiers(planet.id);

  const maxSeeds = MAX_SEEDS_PER_PLANET + extraSlots;
  const seedCount = planet.seeds?.length || 0;
  const credits = state.ship.totalCurrency;

  // Calculate effective export stats
  const effectiveExportSpeed = planet.exportSpeed * traitMods.exportSpeedMult;
  const effectiveStorageCapacity = Math.floor(
    planet.storageCapacity * traitMods.storageCapacityMult
  );

  // Calculate total production per second from active plants
  const totalProduction = planet.plants.reduce((sum, plant) => sum + plant.productionRate, 0);

  // Check if production exceeds export speed (capacity bottleneck)
  const isCapacityBottleneck = totalProduction > effectiveExportSpeed * 1.1; // 10% buffer

  // Check if any upgrade is affordable
  const canAffordAnyUpgrade =
    credits >= calculateUpgradeCost('PRODUCTION_RATE', planet.upgrades.productionRate) ||
    credits >= calculateUpgradeCost('EXPORT_SPEED', planet.upgrades.exportSpeed) ||
    credits >= calculateUpgradeCost('STORAGE_CAPACITY', planet.upgrades.storageCapacity);

  // Determine notification status
  const hasEmptySlots = seedCount < maxSeeds && state.ship.seedInventory.length > 0;
  const needsAttention = seedCount === 0 && state.ship.seedInventory.length > 0;

  // Get assigned manager info
  const assignedManager = getManagerForPlanet(state.managers, planet.id);
  const managerTemplate = assignedManager ? MANAGER_TEMPLATES[assignedManager.templateId] : null;
  const managerRarity = managerTemplate ? MANAGER_RARITY_CONFIG[managerTemplate.rarity] : null;
  const managerProductionBonus = calculateManagerProductionBonus(state.managers, planet.id);

  // Calculate export value (credits earned per export)
  const exportValue = useMemo(() => {
    if (planet.plants.length === 0) return 0;

    // Sum up sell values for plants in capacity
    let totalValue = 0;
    let remainingCapacity = effectiveStorageCapacity;

    for (const plant of planet.plants) {
      const seedType = SEED_TYPES[plant.plant];
      if (!seedType) continue;

      // Find the planted seed to get its tier multiplier
      const plantedSeed = planet.seeds.find(s => s.id === plant.plant);
      const valueMultiplier = plantedSeed?.valueMultiplier || 1;

      const amountToExport = Math.min(plant.currentAmount, remainingCapacity);
      totalValue += amountToExport * seedType.baseSellValue * valueMultiplier;
      remainingCapacity -= amountToExport;

      if (remainingCapacity <= 0) break;
    }

    return Math.floor(totalValue);
  }, [planet.plants, planet.seeds, effectiveStorageCapacity]);

  // Count seeds with affinity bonus on this planet
  const affinityCount = useMemo(() => {
    if (!trait) return 0;
    return planet.seeds.filter(seed => hasAffinity(seed.id, trait)).length;
  }, [planet.seeds, trait]);

  // Get unique families planted (for mini preview)
  const plantedFamilies = useMemo(() => {
    const families = new Map<SeedFamily, number>();
    for (const seed of planet.seeds) {
      const seedType = SEED_TYPES[seed.id];
      if (seedType) {
        families.set(seedType.family, (families.get(seedType.family) || 0) + 1);
      }
    }
    return Array.from(families.entries()).sort((a, b) => b[1] - a[1]); // Sort by count
  }, [planet.seeds]);

  // Get families with affinity for tooltip
  const affinityFamilies = useMemo(() => {
    return getFamiliesWithAffinity(trait);
  }, [trait]);

  // Handle card click - open modal if not clicking buttons
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements
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

  // Get manager icon component
  const ManagerIcon = managerTemplate ? getManagerIcon(managerTemplate.icon) : null;

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-accent/30 transition-all hover:shadow-md group"
        style={{
          borderColor: planet.color + '40',
          borderWidth: '2px',
        }}
        onClick={handleCardClick}
      >
        <CardContent className="p-3 flex items-center gap-3">
          {/* Planet image with notification dot and rich tooltip */}
          <div className="shrink-0 relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <PlanetImage
                    planetId={planet.id}
                    color={planet.color}
                    size={48}
                    glow={false}
                    pulse={false}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px] p-0">
                <div className="p-3 space-y-2">
                  {/* Planet header */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: planet.color }}>
                      {planet.name}
                    </span>
                    {trait && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                        {trait.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>

                  {/* Planted seeds summary */}
                  {planet.seeds.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Planted Seeds:</p>
                      <div className="flex flex-wrap gap-1">
                        {planet.seeds.slice(0, 6).map(seed => (
                          <Badge
                            key={seed.instanceId}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5"
                            style={{
                              borderColor: seed.color + '60',
                              backgroundColor: seed.color + '10',
                            }}
                          >
                            T{seed.tier} {seed.name.replace(' Seeds', '')}
                          </Badge>
                        ))}
                        {planet.seeds.length > 6 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            +{planet.seeds.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No seeds planted</p>
                  )}

                  {/* Affinity info */}
                  {affinityFamilies.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        Affinity Bonuses:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {affinityFamilies.map(({ family, bonus }) => (
                          <Badge
                            key={family}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5"
                            style={{ color: SEED_FAMILY_INFO[family].color }}
                          >
                            {SEED_FAMILY_INFO[family].name} +{Math.round(bonus * 100)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upgrade levels */}
                  <div className="space-y-1 pt-1 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">Upgrades:</p>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="text-center">
                        <div className="text-muted-foreground">Prod</div>
                        <div className="font-medium">Lv.{planet.upgrades.productionRate}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Export</div>
                        <div className="font-medium">Lv.{planet.upgrades.exportSpeed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Storage</div>
                        <div className="font-medium">Lv.{planet.upgrades.storageCapacity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Manager info if assigned */}
                  {managerTemplate && managerProductionBonus > 0 && (
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Manager:
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: managerRarity?.color }}>
                          {managerTemplate.name}
                        </span>
                        <span className="text-xs text-green-400">
                          +{Math.round(managerProductionBonus * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Notification dot */}
            {(canAffordAnyUpgrade || needsAttention) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                      needsAttention ? 'bg-yellow-500' : 'bg-red-500'
                    } animate-pulse`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {needsAttention
                    ? 'No seeds planted!'
                    : canAffordAnyUpgrade
                      ? 'Upgrades available'
                      : ''}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Info cluster */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate" style={{ color: planet.color }}>
                {planet.name}
              </span>
              {trait && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                  {trait.replace(/_/g, ' ')}
                </Badge>
              )}
              {/* Manager badge - compact indicator */}
              {managerTemplate && ManagerIcon && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px]"
                      style={{
                        backgroundColor: managerRarity?.color + '20',
                        color: managerRarity?.color,
                      }}
                    >
                      <ManagerIcon className="w-3 h-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{managerTemplate.name}</p>
                    <p className="text-xs text-green-400">
                      +{Math.round(managerProductionBonus * 100)}% production
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                <span className={hasEmptySlots ? 'text-yellow-500' : ''}>
                  {seedCount}/{maxSeeds}
                </span>
                {/* Family dots preview */}
                {plantedFamilies.length > 0 && (
                  <span className="flex items-center gap-0.5 ml-0.5">
                    {plantedFamilies.slice(0, 3).map(([family]) => (
                      <span
                        key={family}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SEED_FAMILY_INFO[family].color }}
                        title={SEED_FAMILY_INFO[family].name}
                      />
                    ))}
                  </span>
                )}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`tabular-nums ${isCapacityBottleneck ? 'text-yellow-400' : ''}`}>
                    {totalProduction > 0 ? `+${totalProduction.toFixed(1)}/s` : 'idle'}
                    {isCapacityBottleneck && ' ⚠'}
                  </span>
                </TooltipTrigger>
                {isCapacityBottleneck && (
                  <TooltipContent>
                    <p className="font-medium text-yellow-400">Export capacity bottleneck!</p>
                    <p className="text-xs text-muted-foreground">
                      Production exceeds export. Upgrade capacity.
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
              {/* Affinity indicator */}
              {affinityCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                      <Sparkles className="w-3 h-3" />
                      {affinityCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {affinityCount} seed{affinityCount !== 1 ? 's' : ''} with affinity bonus
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matching families get +25-50% production
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Export value - new column */}
          <div className="w-20 shrink-0 hidden md:block text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    Export
                  </span>
                  <span
                    className={`text-sm font-medium tabular-nums ${exportValue > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}
                  >
                    {exportValue > 0 ? `+${exportValue}` : '—'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Estimated export value</p>
                <p className="text-xs text-muted-foreground">Credits earned per export cycle</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Export speed display */}
          <div className="w-16 shrink-0 hidden sm:block">
            <span className="text-[10px] text-muted-foreground block text-center tabular-nums">
              {effectiveExportSpeed.toFixed(1)}/s export
            </span>
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
              >
                <ArrowUp className="w-4 h-4" />
                {canAffordAnyUpgrade && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
                <span className="sr-only">Upgrades</span>
              </Button>
            </PlanetUpgradePopover>

            {/* Seeds/Details button - opens modal on Seeds tab */}
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
                  aria-label={
                    hasEmptySlots ? 'Manage seeds - empty slots available' : 'Manage seeds'
                  }
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

            {/* Expand button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={e => {
                    e.stopPropagation();
                    onExpand();
                  }}
                  aria-label="Expand planet view"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Expand</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Planet Detail Modal */}
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

export default PlanetCollapsed;
