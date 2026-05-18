/**
 * PlanetDetailModal - Terminal-styled planet management dialog
 *
 * Features:
 * - 5 tabs: Upgrades, Seeds, Manager, Mods, Stats
 * - Retro-terminal aesthetic
 * - Compact, game-like design
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import {
  type PlanetState,
  type UpgradeType,
  type SeedInstance,
  getTraitModifiers,
  getFamiliesWithAffinity,
  isSeed,
  SEED_FAMILY_INFO,
  SEED_TYPES,
} from '../../game';
import {
  PLANET_DEFINITIONS,
  PLANET_TRAIT_DESCRIPTIONS,
  type PlanetTrait,
} from '../../game/config/planets';
import {
  MAX_SEEDS_PER_PLANET,
  UPGRADE_CONFIG,
  type UpgradeType as UpgradeTypeFromBalance,
} from '../../game/config/balance';
import { calculateUpgradeCost } from '../../game/systems/UpgradeSystem';
import {
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
  calculateManagerPower,
} from '../../game/config/managers';
import { isManagersUnlocked } from '../../game/systems/ResearchSystem';
import type { ManagerInstance } from '../../game/systems/ManagerSystem';
import { getManagerForPlanet } from '../../game/systems/ManagerSystem';
import { RECIPES, type ItemId } from '../../game/config/recipes';
import { getInstalledMods, getAvailableMods, getModSlots } from '../../game/systems/CraftingSystem';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowUp,
  Leaf,
  TrendingUp,
  Package,
  Sparkles,
  Zap,
  Users,
  Minus,
  ChevronRight,
  Wrench,
  Plus,
  Lock,
  UserPlus,
  BarChart3,
  Loader2,
} from 'lucide-react';
import PlanetImage from '@/components/ui/PlanetImage';
import SeedIcon from '@/components/ui/SeedIcon';
import { getManagerIcon } from '../managers/managerIcons';
import { getTierStyles } from '@/utils/assets';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/game/utils/numberFormat';
import { useAnimatedValues } from '../../hooks/useAnimatedValue';

export type PlanetDetailTab = 'upgrades' | 'seeds' | 'manager' | 'mods' | 'stats';

const EMPTY_NET_RATES: Record<string, number> = {};

interface PlanetDetailModalProps {
  planet: PlanetState;
  planetIndex: number;
  open: boolean;
  onClose: () => void;
  initialTab?: PlanetDetailTab;
}

const PlanetDetailModal: React.FC<PlanetDetailModalProps> = ({
  planet,
  planetIndex: _planetIndex,
  open,
  onClose,
  initialTab = 'upgrades',
}) => {
  const {
    state,
    rates,
    upgradePlanet,
    getUpgradeCost,
    upgradeTypes,
    plantSeed,
    removeSeed,
    getCraftingState,
    installMod,
    uninstallMod,
    getInstalledMods: getInstalledModsFromGame,
    assignManager,
    unassignManager,
    isUpgrading,
    isPlanting,
  } = useGame();

  const [activeTab, setActiveTab] = useState<PlanetDetailTab>(initialTab);
  const craftingState = getCraftingState();

  // Sync tab when modal opens with a different initialTab
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Calculate max seeds including mod bonus
  const installedModsFromGame = getInstalledModsFromGame(planet.id);
  const extraSlots = installedModsFromGame.reduce((sum, mod) => {
    if (mod.itemId === 'extra_slot_module') {
      return sum + 1;
    }
    return sum;
  }, 0);
  const maxSeeds = MAX_SEEDS_PER_PLANET + extraSlots;

  const def = PLANET_DEFINITIONS[planet.id];
  const trait = def?.trait as PlanetTrait | undefined;
  const traitMods = getTraitModifiers(planet.id);

  // Calculate effective stats with traits
  const effectiveExportSpeed = planet.exportSpeed * traitMods.exportSpeedMult;
  const effectiveStorageCapacity = Math.floor(
    planet.storageCapacity * traitMods.storageCapacityMult
  );

  // Total production rate
  const totalProduction = planet.plants.reduce((sum, plant) => sum + plant.productionRate, 0);

  // Get seeds from player's inventory
  const inventorySeeds = useMemo(
    () => state.ship.seedInventory.filter(isSeed) as SeedInstance[],
    [state.ship.seedInventory]
  );

  const planetSeeds = useMemo(() => planet.seeds || [], [planet.seeds]);

  // Manager data
  const managersUnlocked = isManagersUnlocked(state.research.completed);
  const assignedManager = getManagerForPlanet(state.managers, planet.id);
  const managerTemplate = assignedManager ? MANAGER_TEMPLATES[assignedManager.templateId] : null;
  const managerRarity = managerTemplate ? MANAGER_RARITY_CONFIG[managerTemplate.rarity] : null;
  const managerBonus =
    managerTemplate && assignedManager
      ? calculateManagerPower(managerTemplate, assignedManager.level)
      : 0;
  const availableManagers = state.managers.owned.filter(m => {
    const assignedPlanet = Object.entries(state.managers.assignments).find(
      ([_, instanceId]) => instanceId === m.instanceId
    );
    return !assignedPlanet || assignedPlanet[0] === planet.id;
  });

  // Mods data
  const installedMods = craftingState ? getInstalledMods(planet.id, craftingState) : [];
  const availableMods = craftingState ? getAvailableMods(craftingState) : [];
  const maxModSlots = getModSlots(planet.id, 0);
  const installedEffectTypes = new Set(
    installedMods.map(mod => RECIPES[mod.itemId]?.effectType).filter(Boolean)
  );

  // Handle upgrades
  const handleUpgrade = useCallback(
    (type: UpgradeType, count: number = 1) => {
      for (let i = 0; i < count; i++) {
        upgradePlanet(planet.id, type);
      }
    },
    [planet.id, upgradePlanet]
  );

  // Calculate max affordable levels for an upgrade
  const getMaxAffordable = useCallback(
    (type: UpgradeType, currentLevel: number): number => {
      let level = currentLevel;
      let remaining = state.ship.totalCurrency;

      while (remaining >= 0) {
        const cost = calculateUpgradeCost(type as UpgradeTypeFromBalance, level);
        if (remaining < cost) break;
        remaining -= cost;
        level++;
        if (level - currentLevel >= 100) break;
      }

      return level - currentLevel;
    },
    [state.ship.totalCurrency]
  );

  // Calculate total cost for max upgrade
  const getTotalCostForLevels = useCallback(
    (type: UpgradeType, currentLevel: number, levels: number): number => {
      let total = 0;
      for (let i = 0; i < levels; i++) {
        total += calculateUpgradeCost(type as UpgradeTypeFromBalance, currentLevel + i);
      }
      return total;
    },
    []
  );

  // Memoize total seed power calculation
  const totalSeedPower = useMemo(
    () => planetSeeds.reduce((sum, s) => sum + (s.productionMultiplier || 1), 0),
    [planetSeeds]
  );

  // Handle seeds
  const handleAddSeed = (seedInstanceId: string) => {
    plantSeed(seedInstanceId, planet.id);
  };

  const handleRemoveSeed = (seedInstanceId: string) => {
    removeSeed(seedInstanceId, planet.id);
  };

  // Handle managers
  const handleAssignManager = (manager: ManagerInstance) => {
    assignManager(manager.instanceId, planet.id);
  };

  const handleUnassignManager = () => {
    unassignManager(planet.id);
  };

  // Group inventory seeds by type and tier
  const groupedInventory = useMemo(() => {
    const acc: Record<
      string,
      Record<number, { seeds: SeedInstance[]; color: string; name: string }>
    > = {};

    for (const seed of inventorySeeds) {
      const id = seed.id;
      const tier = seed.tier;

      if (!acc[id]) acc[id] = {};
      if (!acc[id][tier]) {
        acc[id][tier] = { seeds: [], color: seed.color, name: seed.name };
      }

      acc[id][tier].seeds.push(seed);
    }

    return acc;
  }, [inventorySeeds]);

  // Animated planet buffer amounts for the stats tab
  const planetNetRates = rates?.planets?.[planet.id]?.netRates ?? EMPTY_NET_RATES;
  const plantAnimationItems = useMemo(
    () =>
      planet.plants.map(p => ({
        value: p.currentAmount,
        rate: planetNetRates[p.plant] ?? 0,
        min: 0,
      })),
    [planet.plants, planetNetRates]
  );
  const animatedPlantAmounts = useAnimatedValues(plantAnimationItems);

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

  // Upgrade config using the planet's actual base values and server-matching formulas.
  // All upgrades use multiplicative formula: base * (1 + effectMultiplier * level)
  const upgradeConfig = useMemo(() => {
    const baseProd = def?.productionRate ?? planet.productionRate;
    const baseExportSpeed = def?.exportSpeed ?? planet.exportSpeed;
    const baseStorage = def?.storageCapacity ?? planet.storageCapacity;

    return [
      {
        type: upgradeTypes.PRODUCTION_RATE,
        key: 'productionRate' as const,
        icon: TrendingUp,
        label: 'PRODUCTION',
        description: 'Base production rate',
        color: 'emerald',
        getEffect: (level: number) => {
          const current = baseProd * (1 + 0.1 * level);
          const next = baseProd * (1 + 0.1 * (level + 1));
          return {
            current: `${current.toFixed(2)}/s`,
            next: `${next.toFixed(2)}/s`,
          };
        },
      },
      {
        type: upgradeTypes.EXPORT_SPEED,
        key: 'exportSpeed' as const,
        icon: Package,
        label: 'EXPORT SPEED',
        description: 'Export throughput rate',
        color: 'blue',
        getEffect: (level: number) => {
          const current = baseExportSpeed * (1 + 0.1 * level);
          const next = baseExportSpeed * (1 + 0.1 * (level + 1));
          return { current: `${current.toFixed(2)}/s`, next: `${next.toFixed(2)}/s` };
        },
      },
      {
        type: upgradeTypes.STORAGE_CAPACITY,
        key: 'storageCapacity' as const,
        icon: Package,
        label: 'STORAGE',
        description: 'Planet storage capacity',
        color: 'cyan',
        getEffect: (level: number) => {
          const current = baseStorage * (1 + 0.15 * level);
          const next = baseStorage * (1 + 0.15 * (level + 1));
          return { current: `${current.toFixed(1)}`, next: `${next.toFixed(1)}` };
        },
      },
    ];
  }, [upgradeTypes, def, planet.productionRate, planet.exportSpeed, planet.storageCapacity]);

  const getEffectDescription = (recipe: (typeof RECIPES)[ItemId]) => {
    if (!recipe.effectValue) return recipe.description;
    const percent = Math.round(recipe.effectValue * 100);
    switch (recipe.effectType) {
      case 'production':
        return `+${percent}% production`;
      case 'storageCapacity':
        return `+${percent}% storage capacity`;
      case 'extraSlot':
        return `+${recipe.effectValue} seed slot`;
      case 'starfruitBonus':
        return `+${percent}% Starfruit production`;
      default:
        return recipe.description;
    }
  };

  const tabs: { id: PlanetDetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'upgrades', label: 'UPG', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'seeds', label: 'SEED', icon: <Leaf className="w-3.5 h-3.5" /> },
    { id: 'manager', label: 'MGR', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'mods', label: 'MOD', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'stats', label: 'STAT', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl p-0 gap-0 bg-slate-900 border-slate-700 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-3">
          <div className="flex items-center gap-3">
            <PlanetImage
              planetId={planet.id}
              color={planet.color}
              size={40}
              glow={true}
              pulse={false}
            />
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 font-mono">
                <span style={{ color: planet.color }}>{planet.name.toUpperCase()}</span>
                {trait && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] h-4 px-1.5 font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  >
                    {trait.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-xs font-mono mt-1 text-slate-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {totalProduction > 0 ? `+${totalProduction.toFixed(1)}/s` : 'IDLE'}
                </span>
                <span className="flex items-center gap-1">
                  <Leaf className="w-3 h-3" />
                  {planetSeeds.length}/{maxSeeds}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {effectiveStorageCapacity}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs - using box-shadow instead of border to avoid layout shift */}
        <div className="flex bg-slate-800/50" role="tablist" aria-label="Planet management tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono transition-colors',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:ring-inset',
                activeTab === tab.id
                  ? 'bg-slate-900 text-cyan-400 shadow-[inset_0_-2px_0_0_theme(colors.cyan.500)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - Fixed height to prevent jumping */}
        <ScrollArea className="h-115">
          <div
            className="p-4"
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {/* Upgrades Tab */}
            {activeTab === 'upgrades' && (
              <div className="space-y-3">
                {upgradeConfig.map(
                  ({ type, key, icon: Icon, label, description, color, getEffect }) => {
                    const level = planet.upgrades[key];
                    const cost = getUpgradeCost(type, level);
                    const canAfford = state.ship.totalCurrency >= cost;
                    const maxAffordable = getMaxAffordable(type, level);
                    const effect = getEffect(level);
                    const maxCost =
                      maxAffordable > 0 ? getTotalCostForLevels(type, level, maxAffordable) : 0;

                    return (
                      <div
                        key={type}
                        className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/50"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                              `bg-${color}-500/20`
                            )}
                          >
                            <Icon className={cn('w-5 h-5', `text-${color}-400`)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-medium text-sm text-slate-200">
                                {label}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-mono tabular-nums bg-slate-700 text-slate-300 border-slate-600"
                              >
                                LV.{level}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono">
                              <span className="text-slate-400 tabular-nums">{effect.current}</span>
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                              <span className="text-emerald-400 font-medium tabular-nums">
                                {effect.next}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleUpgrade(type, 1)}
                            disabled={!canAfford || isUpgrading}
                            size="sm"
                            className={cn(
                              'flex-1 h-8 font-mono text-xs tabular-nums gap-1.5',
                              canAfford && !isUpgrading
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            )}
                          >
                            {isUpgrading && <Loader2 className="w-3 h-3 animate-spin" />}
                            BUY ({formatNumber(cost)})
                          </Button>
                          {maxAffordable > 1 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleUpgrade(type, maxAffordable)}
                                  disabled={isUpgrading}
                                  size="sm"
                                  className="h-8 px-3 font-mono text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                >
                                  MAX x{maxAffordable}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 border-slate-700 font-mono text-xs">
                                {formatNumber(maxCost)} CR
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* Seeds Tab */}
            {activeTab === 'seeds' && (
              <div className="space-y-4">
                {/* Planted Seeds */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      PLANTED ({planetSeeds.length}/{maxSeeds})
                    </h4>
                    {planetSeeds.length > 0 && (
                      <span className="text-xs font-mono text-cyan-400 tabular-nums">
                        x{totalSeedPower.toFixed(1)} PWR
                      </span>
                    )}
                  </div>

                  {planetSeeds.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {planetSeeds.map(seed => (
                        <div
                          key={seed.instanceId}
                          className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-2"
                          style={getTierStyles(seed.tier)}
                        >
                          <SeedIcon seed={seed} size={32} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="capitalize text-sm font-medium text-slate-200 truncate">
                              {seed.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant={getTierBadgeVariant(seed.tier)}
                                className="text-[10px] h-4"
                              >
                                T{seed.tier}
                              </Badge>
                              <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                                x{seed.productionMultiplier}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRemoveSeed(seed.instanceId)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                            aria-label={`Remove ${seed.name}`}
                            disabled={isPlanting}
                          >
                            {isPlanting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 text-center">
                      <Leaf className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm font-mono text-slate-500">// NO_SEEDS</p>
                      <p className="text-xs text-slate-600 mt-1">Select from inventory below</p>
                    </div>
                  )}
                </div>

                {/* Inventory */}
                <div>
                  <h4 className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                    <Leaf className="w-3.5 h-3.5 text-blue-400" />
                    INVENTORY ({inventorySeeds.length})
                  </h4>

                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 max-h-[160px] overflow-y-auto">
                    {Object.keys(groupedInventory).length > 0 ? (
                      <div className="p-2 grid grid-cols-2 gap-2">
                        {Object.entries(groupedInventory).flatMap(([seedId, tiers]) =>
                          Object.entries(tiers).map(([tier, { seeds }]) => (
                            <div
                              key={`${seedId}-${tier}`}
                              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-slate-300 capitalize truncate">
                                  {seeds[0]?.name}
                                </span>
                                <Badge
                                  variant={getTierBadgeVariant(Number(tier))}
                                  className="text-[10px] h-4"
                                >
                                  T{tier}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {seeds.map(seed => (
                                  <button
                                    key={seed.instanceId}
                                    onClick={() => handleAddSeed(seed.instanceId)}
                                    disabled={planetSeeds.length >= maxSeeds || isPlanting}
                                    className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:scale-110 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent"
                                    title={
                                      isPlanting
                                        ? 'Planting...'
                                        : planetSeeds.length >= maxSeeds
                                          ? 'Planet is full'
                                          : `Plant ${seed.name}`
                                    }
                                    aria-label={`Plant ${seed.name} tier ${seed.tier}`}
                                  >
                                    <SeedIcon seed={seed} size={24} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Leaf className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        <p className="text-sm font-mono text-slate-500">// EMPTY</p>
                        <p className="text-xs text-slate-600 mt-1">Pull from Gacha</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manager Tab */}
            {activeTab === 'manager' && (
              <div className="space-y-4">
                {!managersUnlocked ? (
                  <div className="p-8 rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 text-center">
                    <Lock className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                    <p className="text-sm font-mono text-slate-500">// LOCKED</p>
                    <p className="text-xs text-slate-600 mt-1">Unlock via Research</p>
                  </div>
                ) : (
                  <>
                    {/* Current Manager */}
                    <div>
                      <h4 className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        ASSIGNED
                      </h4>

                      {assignedManager && managerTemplate ? (
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/30">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-lg flex items-center justify-center',
                                managerRarity?.bgColor
                              )}
                              style={{ color: managerRarity?.color }}
                            >
                              {React.createElement(getManagerIcon(managerTemplate.icon), {
                                className: 'w-6 h-6',
                              })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200">
                                {managerTemplate.name}
                              </p>
                              <p className="text-xs font-mono text-emerald-400">
                                +{Math.round(managerBonus * 100)}% BONUS
                              </p>
                            </div>
                            <Button
                              onClick={handleUnassignManager}
                              size="sm"
                              className="h-8 font-mono text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                            >
                              REMOVE
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 text-center">
                          <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                          <p className="text-sm font-mono text-slate-500">// NONE</p>
                          <p className="text-xs text-slate-600 mt-1">Select below</p>
                        </div>
                      )}
                    </div>

                    {/* Available Managers */}
                    <div>
                      <h4 className="text-xs font-mono text-slate-400 uppercase mb-2">
                        AVAILABLE ({availableManagers.length})
                      </h4>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {availableManagers.length === 0 ? (
                          <p className="text-sm font-mono text-slate-600 text-center py-6">
                            // No managers. Pull from Gacha!
                          </p>
                        ) : (
                          availableManagers.map(manager => {
                            const mTemplate = MANAGER_TEMPLATES[manager.templateId];
                            const mRarity = MANAGER_RARITY_CONFIG[mTemplate.rarity];
                            const mBonus = calculateManagerPower(mTemplate, manager.level);
                            const isAssignedHere =
                              state.managers.assignments[planet.id] === manager.instanceId;

                            return (
                              <button
                                key={manager.instanceId}
                                onClick={() => handleAssignManager(manager)}
                                disabled={isAssignedHere}
                                className={cn(
                                  'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left',
                                  isAssignedHere
                                    ? 'border-cyan-500/50 bg-cyan-500/10'
                                    : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600'
                                )}
                                aria-label={`Assign ${mTemplate.name} to this planet`}
                              >
                                <div
                                  className={cn(
                                    'w-9 h-9 rounded-lg flex items-center justify-center',
                                    mRarity.bgColor
                                  )}
                                  style={{ color: mRarity.color }}
                                >
                                  {React.createElement(getManagerIcon(mTemplate.icon), {
                                    className: 'w-5 h-5',
                                  })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">
                                    {mTemplate.name}
                                  </p>
                                  <p className="text-xs font-mono text-slate-500">
                                    LV.{manager.level} | +{Math.round(mBonus * 100)}%
                                  </p>
                                </div>
                                {isAssignedHere && (
                                  <Badge className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                    ACTIVE
                                  </Badge>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mods Tab */}
            {activeTab === 'mods' && (
              <div className="space-y-4">
                {/* Slots indicator */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-purple-400" />
                    MOD_SLOTS
                  </span>
                  <span className="text-sm font-mono font-bold text-purple-400 tabular-nums">
                    {installedMods.length}/{maxModSlots}
                  </span>
                </div>

                {/* Installed Mods */}
                <div>
                  <h4 className="text-xs font-mono text-slate-400 uppercase mb-2">INSTALLED</h4>

                  {installedMods.length > 0 ? (
                    <div className="space-y-2">
                      {installedMods.map(mod => {
                        const recipe = RECIPES[mod.itemId];
                        if (!recipe) return null;

                        return (
                          <div
                            key={mod.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-purple-300">{recipe.name}</p>
                              <p className="text-xs text-slate-500">
                                {getEffectDescription(recipe)}
                              </p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => uninstallMod(mod.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/20"
                                  aria-label={`Uninstall ${recipe.name}`}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 border-slate-700 font-mono text-xs">
                                UNINSTALL (no refund)
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 text-center">
                      <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm font-mono text-slate-500">// NONE</p>
                    </div>
                  )}
                </div>

                {/* Available Mods */}
                <div>
                  <h4 className="text-xs font-mono text-slate-400 uppercase mb-2">
                    AVAILABLE ({availableMods.length})
                  </h4>

                  {availableMods.length > 0 ? (
                    <div className="space-y-2">
                      {availableMods.map(mod => {
                        const recipe = RECIPES[mod.itemId];
                        if (!recipe) return null;

                        const alreadyHasType = installedEffectTypes.has(recipe.effectType);
                        const hasAvailableSlots = installedMods.length < maxModSlots;
                        const canInstall = hasAvailableSlots && !alreadyHasType;

                        return (
                          <div
                            key={mod.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg border',
                              canInstall
                                ? 'border-slate-700/50 bg-slate-800/30 hover:border-purple-500/50'
                                : 'border-slate-700/30 bg-slate-800/20 opacity-50'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300">{recipe.name}</p>
                              <p className="text-xs text-slate-500">
                                {getEffectDescription(recipe)}
                              </p>
                            </div>
                            {canInstall ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => installMod(mod.id, planet.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/20"
                                    aria-label={`Install ${recipe.name}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700 font-mono text-xs">
                                  INSTALL
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-8 w-8 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-slate-600" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-800 border-slate-700 font-mono text-xs">
                                  {!hasAvailableSlots ? 'NO_SLOTS' : 'TYPE_CONFLICT'}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-slate-600 text-center py-6">
                      // Craft mods in Workshop
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                {/* Export Speed */}
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400 uppercase">EXPORT_SPEED</span>
                    <span className="text-xs font-mono text-cyan-400 tabular-nums">
                      {effectiveExportSpeed.toFixed(1)}/s
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">PRODUCTION</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                      +{totalProduction.toFixed(1)}/s
                    </p>
                    {traitMods.productionMult !== 1 && (
                      <p className="text-[10px] font-mono text-emerald-400/70">
                        +{Math.round((traitMods.productionMult - 1) * 100)}% trait
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">EXPORT_SPEED</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-blue-400 tabular-nums">
                      {effectiveExportSpeed.toFixed(2)}
                      <span className="text-xs text-slate-500 ml-1">/s</span>
                    </p>
                    {traitMods.exportSpeedMult !== 1 && (
                      <p className="text-[10px] font-mono text-blue-400/70">
                        +{Math.round((traitMods.exportSpeedMult - 1) * 100)}% trait
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">STORAGE</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                      {effectiveStorageCapacity}
                      <span className="text-xs text-slate-500 ml-1">plants</span>
                    </p>
                    {traitMods.storageCapacityMult !== 1 && (
                      <p className="text-[10px] font-mono text-cyan-400/70">
                        +{Math.round((traitMods.storageCapacityMult - 1) * 100)}% trait
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Leaf className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase">SEEDS</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                      {planetSeeds.length}/{maxSeeds}
                    </p>
                    {planetSeeds.length > 0 && (
                      <p className="text-[10px] font-mono text-amber-400/70">
                        x{totalSeedPower.toFixed(1)} power
                      </p>
                    )}
                  </div>
                </div>

                {/* Trait Info */}
                {trait && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-purple-400 font-mono text-sm font-medium uppercase">
                          {trait.replace(/_/g, ' ')} TRAIT
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {PLANET_TRAIT_DESCRIPTIONS[trait]}
                        </p>
                        {getFamiliesWithAffinity(trait).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-purple-500/20">
                            <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mb-2">
                              <Zap className="w-3 h-3 text-yellow-400" />
                              FAMILY_AFFINITIES
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {getFamiliesWithAffinity(trait).map(({ family, bonus }) => (
                                <Badge
                                  key={family}
                                  className="text-[10px] font-mono gap-1.5 bg-slate-800 border-slate-700"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: SEED_FAMILY_INFO[family].color }}
                                  />
                                  {SEED_FAMILY_INFO[family].name}
                                  <span className="text-emerald-400">
                                    +{Math.round(bonus * 100)}%
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Production Breakdown */}
                {planet.plants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      PRODUCTION_LOG ({planet.plants.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {planet.plants.map((plantData, plantIndex) => {
                        const animatedAmount =
                          animatedPlantAmounts[plantIndex] ?? plantData.currentAmount;
                        return (
                          <div
                            key={plantIndex}
                            className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30"
                          >
                            <p className="capitalize text-sm font-medium text-slate-300">
                              {plantData.plant}
                            </p>
                            <div className="flex justify-between text-xs font-mono mt-1">
                              <span className="text-blue-400 tabular-nums">
                                {animatedAmount.toFixed(1)} stored
                              </span>
                              <span className="text-emerald-400 tabular-nums">
                                +{plantData.productionRate.toFixed(2)}/s
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PlanetDetailModal;
