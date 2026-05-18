import React, { useState } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import SeedManager from './SeedManager';
import ManagerSlot from './ManagerSlot';
import PlanetModPanel from './PlanetModPanel';
import {
  type PlanetState,
  type UpgradeType,
  getTraitModifiers,
  getFamiliesWithAffinity,
  SEED_FAMILY_INFO,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Settings,
  Leaf,
  TrendingUp,
  Package,
  Sparkles,
  Zap,
  Users,
  ChevronUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import PlanetImage from '@/components/ui/PlanetImage';
import SeedIcon from '@/components/ui/SeedIcon';

interface PlanetProps {
  planet: PlanetState;
  planetIndex: number;
  onCollapse?: () => void;
}

// Animated plant card - uses useAnimatedValue for smooth production display
interface PlantCardProps {
  plant: string;
  currentAmount: number;
  productionRate: number;
  capacity: number;
}

const AnimatedPlantCard: React.FC<PlantCardProps> = ({
  plant,
  currentAmount,
  productionRate,
  capacity,
}) => {
  const animatedAmount = useAnimatedValue(currentAmount, productionRate, {
    max: capacity,
    min: 0,
  });

  return (
    <Card className="bg-secondary/50 border-border/50">
      <CardContent className="p-3">
        <p className="capitalize font-medium text-sm">{plant}</p>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground tabular-nums">{animatedAmount.toFixed(1)}</span>
          <span className="text-green-400 tabular-nums">+{productionRate.toFixed(2)}/s</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Planet: React.FC<PlanetProps> = ({ planet, planetIndex, onCollapse }) => {
  const {
    state,
    upgradePlanet,
    getUpgradeCost,
    upgradeTypes,
    upgradeNames,
    getCraftingState,
    installMod,
    uninstallMod,
    getInstalledMods,
    isUpgrading,
  } = useGame();
  const [showSeedManager, setShowSeedManager] = useState(false);

  const craftingState = getCraftingState();

  // Calculate max seeds including mod bonus
  const installedMods = getInstalledMods(planet.id);
  const extraSlots = installedMods.reduce((sum, mod) => {
    if (mod.itemId === 'extra_slot_module') {
      return sum + 1;
    }
    return sum;
  }, 0);
  const maxSeeds = MAX_SEEDS_PER_PLANET + extraSlots;

  const handleUpgrade = (type: UpgradeType, count: number = 1) => {
    for (let i = 0; i < count; i++) {
      upgradePlanet(planet.id, type);
    }
  };

  // Calculate max affordable levels for an upgrade
  const getMaxAffordable = (type: UpgradeType, currentLevel: number): number => {
    let level = currentLevel;
    let remaining = state.ship.totalCurrency;

    while (remaining >= 0) {
      const cost = calculateUpgradeCost(type as UpgradeTypeFromBalance, level);
      if (remaining < cost) break;
      remaining -= cost;
      level++;
      // Safety cap at 100 levels per click
      if (level - currentLevel >= 100) break;
    }

    return level - currentLevel;
  };

  const def = PLANET_DEFINITIONS[planet.id];
  const trait = def?.trait as PlanetTrait | undefined;
  const traitMods = getTraitModifiers(planet.id);

  // Calculate effective stats with traits
  const effectiveExportSpeed = planet.exportSpeed * traitMods.exportSpeedMult;
  const effectiveStorageCapacity = Math.floor(
    planet.storageCapacity * traitMods.storageCapacityMult
  );

  // Calculate production vs export speed to detect bottleneck
  const totalProductionRate = planet.plants.reduce((sum, p) => sum + p.productionRate, 0);
  const isCapacityBottleneck = totalProductionRate > effectiveExportSpeed * 1.1; // 10% buffer

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg"
      style={{
        borderColor: planet.color + '40',
        borderWidth: '2px',
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Planet Image - Prominent and Large */}
          <div className="shrink-0">
            <PlanetImage
              planetId={planet.id}
              color={planet.color}
              size={80}
              glow={true}
              pulse={true}
            />
          </div>

          {/* Planet Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg" style={{ color: planet.color }}>
                    {planet.name}
                  </CardTitle>
                  {onCollapse && (
                    <Button variant="ghost" size="sm" onClick={onCollapse} className="h-6 w-6 p-0">
                      <ChevronUp className="w-4 h-4" />
                      <span className="sr-only">Collapse</span>
                    </Button>
                  )}
                </div>
                {trait && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 mt-1 cursor-help">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400 capitalize">
                          {trait.replace(/_/g, ' ')}: {PLANET_TRAIT_DESCRIPTIONS[trait]}
                        </span>
                        {/* Show affinity family dots */}
                        {getFamiliesWithAffinity(trait).length > 0 && (
                          <div className="flex gap-0.5 ml-1">
                            {getFamiliesWithAffinity(trait).map(({ family, bonus }) => (
                              <span
                                key={family}
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: SEED_FAMILY_INFO[family].color }}
                                title={`${SEED_FAMILY_INFO[family].name}: +${Math.round(bonus * 100)}%`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-semibold">{trait.replace(/_/g, ' ')} Planet</p>
                      <p className="text-muted-foreground text-xs">
                        {PLANET_TRAIT_DESCRIPTIONS[trait]}
                      </p>
                      {getFamiliesWithAffinity(trait).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            Family Affinities:
                          </p>
                          <div className="mt-1 space-y-0.5">
                            {getFamiliesWithAffinity(trait).map(({ family, bonus }) => (
                              <div key={family} className="flex items-center gap-2 text-xs">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: SEED_FAMILY_INFO[family].color }}
                                />
                                <span>{SEED_FAMILY_INFO[family].name}</span>
                                <span className="text-green-400">+{Math.round(bonus * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Export Speed & Storage */}
            <div className="mt-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-1.5 cursor-help ${isCapacityBottleneck ? 'text-yellow-400' : ''}`}
                    >
                      {isCapacityBottleneck ? (
                        <AlertTriangle className="w-3 h-3 text-yellow-400 animate-pulse" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                      <span className="tabular-nums">
                        {effectiveExportSpeed.toFixed(1)}/s export
                        {traitMods.exportSpeedMult !== 1 && (
                          <span className="text-green-400 ml-1">
                            (+{Math.round((traitMods.exportSpeedMult - 1) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export speed: {effectiveExportSpeed.toFixed(2)} plants/sec</p>
                    {isCapacityBottleneck && (
                      <p className="text-yellow-400 font-medium">
                        Production exceeds export speed! Upgrade to avoid waste.
                      </p>
                    )}
                    {traitMods.exportSpeedMult !== 1 && (
                      <p className="text-green-400">Trait bonus applied</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <Package className="w-3 h-3" />
                      <span className="tabular-nums">
                        {effectiveStorageCapacity} storage
                        {traitMods.storageCapacityMult !== 1 && (
                          <span className="text-green-400 ml-1">
                            (+{Math.round((traitMods.storageCapacityMult - 1) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Planet storage capacity</p>
                    {traitMods.storageCapacityMult !== 1 && (
                      <p className="text-green-400">Trait bonus applied</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Manager Slot */}
        <div>
          <h4 className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-muted-foreground">
            <Users className="w-3 h-3" />
            Manager
          </h4>
          <ManagerSlot planetId={planet.id} planetName={planet.name} />
        </div>

        {/* Planet Mods */}
        {craftingState && (
          <PlanetModPanel
            planetId={planet.id}
            planetName={planet.name}
            craftingState={craftingState}
            onInstall={(itemId, planetId) => installMod(itemId, planetId)}
            onUninstall={itemId => uninstallMod(itemId)}
          />
        )}

        {/* Upgrades Section */}
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  type: upgradeTypes.PRODUCTION_RATE,
                  key: 'productionRate' as const,
                  icon: TrendingUp,
                  effect: `+${(UPGRADE_CONFIG.PRODUCTION_RATE.effectMultiplier * 100).toFixed(0)}%`,
                },
                {
                  type: upgradeTypes.EXPORT_SPEED,
                  key: 'exportSpeed' as const,
                  icon: Package,
                  effect: `+${(UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier * 100).toFixed(0)}%`,
                },
                {
                  type: upgradeTypes.STORAGE_CAPACITY,
                  key: 'storageCapacity' as const,
                  icon: Package,
                  effect: `+${(UPGRADE_CONFIG.STORAGE_CAPACITY.effectMultiplier * 100).toFixed(0)}%`,
                },
              ].map(({ type, key, icon: Icon, effect }) => {
                const level = planet.upgrades[key];
                const cost = getUpgradeCost(type, level);
                const canAfford = state.ship.totalCurrency >= cost;
                const maxAffordable = getMaxAffordable(type, level);

                return (
                  <div key={type} className="text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      <span>{upgradeNames[type]}</span>
                    </div>
                    <div className="text-xs text-green-400">{effect}</div>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      Lv.{level}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleUpgrade(type, 1)}
                        disabled={!canAfford || isUpgrading}
                        variant="warning"
                        size="sm"
                        className="flex-1 text-xs h-7 tabular-nums gap-1"
                      >
                        {isUpgrading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {cost.toLocaleString()}
                      </Button>
                      {maxAffordable > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleUpgrade(type, maxAffordable)}
                              disabled={isUpgrading}
                              variant="secondary"
                              size="sm"
                              className="text-xs h-7 px-1.5"
                            >
                              MAX
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Buy {maxAffordable} levels</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Seeds Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-400" />
              Seeds ({planet.seeds?.length || 0}/{maxSeeds})
              {planet.seeds && planet.seeds.length > 0 && (
                <Badge variant="secondary" className="text-xs tabular-nums">
                  ×
                  {planet.seeds
                    .reduce((sum, s) => sum + (s.productionMultiplier || 1), 0)
                    .toFixed(1)}{' '}
                  power
                </Badge>
              )}
            </h4>
            <Button
              onClick={() => setShowSeedManager(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
            >
              <Settings className="w-3 h-3" />
              Manage
            </Button>
          </div>

          {planet.seeds && planet.seeds.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {planet.seeds.map((seed, seedIndex) => (
                <Card
                  key={seed.instanceId || seedIndex}
                  className="bg-secondary/50"
                  style={{ borderColor: seed.color || '#666', borderWidth: '1px' }}
                >
                  <CardContent className="p-2 flex items-center gap-2">
                    <SeedIcon seed={seed} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="capitalize font-medium text-xs truncate">{seed.name}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                        <span>T{seed.tier}</span>
                        <span className="tabular-nums">×{seed.productionMultiplier || 1}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-secondary/30 border-dashed border-border/50">
              <CardContent className="py-6 text-center">
                <Leaf className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No seeds planted</p>
                <p className="text-xs text-muted-foreground/70">Click Manage to add seeds</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Plants Production */}
        {planet.plants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Production ({planet.plants.length})
              {traitMods.productionMult !== 1 && (
                <Badge variant="secondary" className="text-xs gap-1 ml-auto">
                  <Sparkles className="w-3 h-3" />
                  {traitMods.productionMult > 1 ? '+' : ''}
                  {Math.round((traitMods.productionMult - 1) * 100)}%
                </Badge>
              )}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {planet.plants.map((plantData, plantIndex) => (
                <AnimatedPlantCard
                  key={plantIndex}
                  plant={plantData.plant}
                  currentAmount={plantData.currentAmount}
                  productionRate={plantData.productionRate}
                  capacity={effectiveStorageCapacity}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Seed Manager Modal */}
      {showSeedManager && (
        <SeedManager
          planet={planet}
          planetIndex={planetIndex}
          onClose={() => setShowSeedManager(false)}
        />
      )}
    </Card>
  );
};

export default Planet;
