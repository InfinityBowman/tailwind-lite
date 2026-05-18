import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { isSeed, SEED_TYPES, type PlanetState, type SeedInstance } from '../../game';
import { MAX_SEEDS_PER_PLANET } from '../../game/config/balance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Leaf, Loader2, Minus, Sparkles } from 'lucide-react';
import { getTierStyles } from '@/utils/assets';
import SeedIcon from '@/components/ui/SeedIcon';

interface SeedManagerProps {
  planet: PlanetState;
  planetIndex: number;
  onClose: () => void;
}

const SeedManager: React.FC<SeedManagerProps> = ({
  planet,
  planetIndex: _planetIndex,
  onClose,
}) => {
  const { state, plantSeed, removeSeed, isPlanting } = useGame();

  // Get seeds from player's inventory (only actual seeds, not fodder)
  const inventorySeeds = useMemo(
    () => state.ship.seedInventory.filter(isSeed) as SeedInstance[],
    [state.ship.seedInventory]
  );

  // Seeds currently on this planet
  const planetSeeds = planet.seeds || [];

  const handleAddSeed = (seedInstanceId: string) => {
    plantSeed(planet.id, seedInstanceId);
  };

  const handleRemoveSeed = (seedInstanceId: string) => {
    removeSeed(planet.id, seedInstanceId);
  };

  // Group inventory seeds by type and tier for better display
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
        acc[id][tier] = {
          seeds: [],
          color: seed.color,
          name: seed.name,
        };
      }

      acc[id][tier].seeds.push(seed);
    }

    return acc;
  }, [inventorySeeds]);

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
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: planet.color }} />
            Seed Manager - {planet.name}
          </DialogTitle>
          <DialogDescription>Manage which seeds are planted on this planet</DialogDescription>
        </DialogHeader>

        {/* Current Seeds Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-sm">
              Seeds on Planet ({planetSeeds.length}/{MAX_SEEDS_PER_PLANET})
            </h3>
          </div>

          {planetSeeds.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {planetSeeds.map(seed => (
                <Card
                  key={seed.instanceId}
                  className="bg-secondary/50 border-border/50"
                  style={getTierStyles(seed.tier)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <SeedIcon seed={seed} size={32} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="capitalize font-medium text-sm truncate">{seed.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={getTierBadgeVariant(seed.tier)} className="text-xs">
                          T{seed.tier}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ×{seed.productionMultiplier}
                        </span>
                      </div>
                      <p className="text-xs text-blue-400 mt-0.5 capitalize">
                        {SEED_TYPES[seed.id]?.resourceProduced || 'unknown'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRemoveSeed(seed.instanceId)}
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={isPlanting}
                    >
                      {isPlanting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-secondary/30 border-dashed border-border/50">
              <CardContent className="py-6 text-center">
                <Leaf className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No seeds on this planet</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Available Seeds from Inventory */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm">Inventory ({inventorySeeds.length} seeds)</h3>
          </div>

          <ScrollArea className="h-[220px] border border-border rounded-lg">
            {Object.keys(groupedInventory).length > 0 ? (
              <div className="p-3 grid grid-cols-2 gap-2">
                {Object.entries(groupedInventory).flatMap(([seedId, tiers]) =>
                  Object.entries(tiers).map(([tier, { seeds }]) => (
                    <Card key={`${seedId}-${tier}`} className="bg-secondary/50 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium capitalize truncate">
                            {seeds[0]?.name}
                          </span>
                          <Badge
                            variant={getTierBadgeVariant(Number(tier))}
                            className="text-xs shrink-0 ml-1"
                          >
                            T{tier}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {seeds.map(seed => (
                            <button
                              key={seed.instanceId}
                              onClick={() => handleAddSeed(seed.instanceId)}
                              disabled={planetSeeds.length >= MAX_SEEDS_PER_PLANET || isPlanting}
                              className="transition-all hover:scale-110 hover:ring-2 hover:ring-primary rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:ring-0"
                              title={
                                isPlanting
                                  ? 'Planting...'
                                  : planetSeeds.length >= MAX_SEEDS_PER_PLANET
                                    ? 'Planet is full'
                                    : `Add ${seed.name} to planet`
                              }
                            >
                              <SeedIcon seed={seed} size={32} />
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Leaf className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No seeds in inventory</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Pull some seeds from the Gacha!
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeedManager;
