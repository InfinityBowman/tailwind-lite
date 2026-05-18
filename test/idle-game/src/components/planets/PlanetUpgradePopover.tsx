import React, { useMemo } from 'react';
import { type PlanetState, type UpgradeType } from '../../game';
import { PLANET_DEFINITIONS } from '../../game/config/planets';
import { calculateUpgradeCost } from '../../game/systems/UpgradeSystem';
import { useGame } from '../../contexts/GameEngineContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, Package, ArrowUp, Warehouse, Loader2 } from 'lucide-react';

interface PlanetUpgradePopoverProps {
  planet: PlanetState;
  planetIndex: number;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

// Upgrade display info — effects are computed per-planet using server-matching formulas
const UPGRADE_KEYS = [
  {
    type: 'PRODUCTION_RATE' as UpgradeType,
    key: 'productionRate' as const,
    icon: TrendingUp,
    name: 'Production',
  },
  {
    type: 'EXPORT_SPEED' as UpgradeType,
    key: 'exportSpeed' as const,
    icon: Package,
    name: 'Export Speed',
  },
  {
    type: 'STORAGE_CAPACITY' as UpgradeType,
    key: 'storageCapacity' as const,
    icon: Warehouse,
    name: 'Storage',
  },
];

const PlanetUpgradePopover: React.FC<PlanetUpgradePopoverProps> = ({
  planet,
  planetIndex: _planetIndex,
  children,
  onOpenChange,
}) => {
  const { state, upgradePlanet, getUpgradeCost: getUpgradeCostFromHook, isUpgrading } = useGame();
  const credits = state.ship.totalCurrency;

  // Calculate max affordable levels for each upgrade
  const getMaxAffordable = (type: UpgradeType, currentLevel: number): number => {
    let level = currentLevel;
    let remaining = credits;

    while (remaining >= 0) {
      const cost = calculateUpgradeCost(type, level);
      if (remaining < cost) break;
      remaining -= cost;
      level++;
      // Safety cap at 100 levels per click
      if (level - currentLevel >= 100) break;
    }

    return level - currentLevel;
  };

  const handleUpgrade = (type: UpgradeType, count: number = 1) => {
    for (let i = 0; i < count; i++) {
      upgradePlanet(planet.id, type);
    }
  };

  // Compute effects using actual planet base values and server-matching formulas
  const def = PLANET_DEFINITIONS[planet.id];
  const getEffect = useMemo(() => {
    const baseProd = def?.productionRate ?? planet.productionRate;
    const baseExportSpeed = def?.exportSpeed ?? planet.exportSpeed;
    const baseStorage = def?.storageCapacity ?? planet.storageCapacity;

    return (key: 'productionRate' | 'exportSpeed' | 'storageCapacity', level: number): string => {
      switch (key) {
        case 'productionRate':
          return `${(baseProd * (1 + 0.1 * level)).toFixed(2)}/s`;
        case 'exportSpeed':
          return `${(baseExportSpeed * (1 + 0.1 * level)).toFixed(2)}/s`;
        case 'storageCapacity':
          return `${(baseStorage * (1 + 0.15 * level)).toFixed(1)}`;
      }
    };
  }, [def, planet.productionRate, planet.exportSpeed, planet.storageCapacity]);

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        side="bottom"
        align="end"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: planet.color }}>
              {planet.name} Upgrades
            </span>
            <Badge variant="secondary" className="tabular-nums text-xs">
              {credits.toLocaleString()} credits
            </Badge>
          </div>

          {UPGRADE_KEYS.map(({ type, key, icon: Icon, name }) => {
            const level = planet.upgrades[key];
            const cost = getUpgradeCostFromHook(type, level);
            const canAfford = credits >= cost;
            const maxAffordable = getMaxAffordable(type, level);

            return (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs tabular-nums">
                      Lv.{level}
                    </Badge>
                    <span className="text-xs text-green-400">{getEffect(key, level)}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => handleUpgrade(type, 1)}
                    disabled={!canAfford || isUpgrading}
                    variant="warning"
                    size="sm"
                    className="flex-1 text-xs h-8 tabular-nums gap-1"
                  >
                    {isUpgrading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowUp className="w-3 h-3" />
                    )}
                    {cost.toLocaleString()}
                  </Button>
                  {maxAffordable > 1 && (
                    <Button
                      onClick={() => handleUpgrade(type, maxAffordable)}
                      disabled={isUpgrading}
                      variant="secondary"
                      size="sm"
                      className="text-xs h-8 tabular-nums px-2"
                    >
                      MAX ({maxAffordable})
                    </Button>
                  )}
                </div>
                {canAfford && (
                  <p className="text-[10px] text-muted-foreground">
                    Next: {getEffect(key, level)} → {getEffect(key, level + 1)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PlanetUpgradePopover;
