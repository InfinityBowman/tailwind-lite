/**
 * BreedingSlot Component
 * Individual slot for selecting a parent seed for breeding
 *
 * Accessibility:
 * - Keyboard navigable
 * - Screen reader announcements
 * - Focus management
 */

import React, { useState, useMemo } from 'react';
import { Plus, X, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SeedIcon from '@/components/ui/SeedIcon';
import TraitChip from './TraitChip';
import type { SeedWithTraits } from '../../game/systems/BreedingSystem';
import type { SeedInstance } from '../../game';
import { getTierStyles, getTierName } from '@/utils/assets';
import type { TraitId } from '../../game/config/traits';

interface BreedingSlotProps {
  slotIndex: 0 | 1;
  seed: SeedWithTraits | null;
  isBreeding: boolean;
  availableSeeds: SeedInstance[];
  onSelectSeed: (seed: SeedWithTraits) => void;
  onRemoveSeed: () => void;
  className?: string;
}

const BreedingSlot: React.FC<BreedingSlotProps> = ({
  slotIndex,
  seed,
  isBreeding,
  availableSeeds,
  onSelectSeed,
  onRemoveSeed,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<number | null>(null);

  // Convert SeedInstance to SeedWithTraits format
  const convertToBreedingSeed = (seedInstance: SeedInstance): SeedWithTraits => ({
    instanceId: seedInstance.instanceId,
    type: seedInstance.id,
    tier: seedInstance.tier,
    traits: seedInstance.traits || [],
  });

  // Filter and sort seeds
  const filteredSeeds = useMemo(() => {
    return availableSeeds
      .filter(s => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = s.name.toLowerCase().includes(query);
          const matchesId = s.id.toLowerCase().includes(query);
          if (!matchesName && !matchesId) return false;
        }
        // Tier filter
        if (tierFilter !== null && s.tier !== tierFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by tier (descending), then by name
        if (b.tier !== a.tier) return b.tier - a.tier;
        return a.name.localeCompare(b.name);
      });
  }, [availableSeeds, searchQuery, tierFilter]);

  // Group seeds by tier for display
  const seedsByTier = useMemo(() => {
    const grouped: Record<number, SeedInstance[]> = {};
    filteredSeeds.forEach(s => {
      if (!grouped[s.tier]) grouped[s.tier] = [];
      grouped[s.tier].push(s);
    });
    return grouped;
  }, [filteredSeeds]);

  const handleSelectSeed = (seedInstance: SeedInstance) => {
    onSelectSeed(convertToBreedingSeed(seedInstance));
    setIsModalOpen(false);
    setSearchQuery('');
    setTierFilter(null);
  };

  const slotLabel = slotIndex === 0 ? 'Parent 1' : 'Parent 2';

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col items-center p-4 rounded-xl border-2 border-dashed transition-all min-w-[140px]',
          seed ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/30 bg-secondary/30',
          isBreeding && 'opacity-75 cursor-not-allowed',
          !isBreeding && !seed && 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer',
          className
        )}
        role="button"
        tabIndex={isBreeding ? -1 : 0}
        aria-label={seed ? `${slotLabel}: ${seed.type} Tier ${seed.tier}` : `Select ${slotLabel}`}
        onClick={() => !isBreeding && !seed && setIsModalOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isBreeding && !seed) setIsModalOpen(true);
          }
        }}
      >
        <span className="text-xs text-muted-foreground mb-2 font-medium">{slotLabel}</span>

        {seed ? (
          <>
            <div className="relative mb-2">
              <SeedIcon
                seed={{ id: seed.type, tier: seed.tier, name: seed.type }}
                size={64}
                showTierBadge
              />
            </div>
            <span className="font-semibold capitalize text-sm mb-1">{seed.type}</span>
            <Badge variant="secondary" className="text-xs mb-2">
              {getTierName(seed.tier)}
            </Badge>

            {/* Traits */}
            {seed.traits && seed.traits.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-1 max-w-[120px]">
                {seed.traits.map(traitId => (
                  <TraitChip key={traitId} traitId={traitId} size="sm" showLabel={false} />
                ))}
              </div>
            )}

            {/* Remove button */}
            {!isBreeding && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive"
                onClick={e => {
                  e.stopPropagation();
                  onRemoveSeed();
                }}
                aria-label={`Remove ${slotLabel}`}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Select Seed</span>
          </div>
        )}
      </div>

      {/* Seed Selection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select {slotLabel}</DialogTitle>
            <DialogDescription>
              Choose a seed from your inventory to use for breeding
            </DialogDescription>
          </DialogHeader>

          {/* Search and Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search seeds..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(tier => (
                <Button
                  key={tier}
                  variant={tierFilter === tier ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
                >
                  T{tier}
                </Button>
              ))}
            </div>
          </div>

          {/* Seed List */}
          <ScrollArea className="h-[300px] rounded-lg border border-border">
            {filteredSeeds.length > 0 ? (
              <div className="p-2 space-y-2">
                {Object.entries(seedsByTier)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([tier, seeds]) => (
                    <div key={tier}>
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1 sticky top-0 bg-background/95 backdrop-blur-sm">
                        {getTierName(Number(tier))} Seeds
                      </div>
                      <div className="space-y-1">
                        {seeds.map(seedInstance => {
                          const tierStyles = getTierStyles(seedInstance.tier);
                          return (
                            <Card
                              key={seedInstance.instanceId}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              style={tierStyles}
                              onClick={() => handleSelectSeed(seedInstance)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                <SeedIcon seed={seedInstance} size={40} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium capitalize truncate">
                                    {seedInstance.name}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {seedInstance.traits && seedInstance.traits.length > 0 ? (
                                      seedInstance.traits.map(traitId => (
                                        <TraitChip
                                          key={traitId}
                                          traitId={traitId as TraitId}
                                          size="sm"
                                          showLabel={false}
                                        />
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        No traits
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="secondary" size="sm">
                                  Select
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Filter className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No seeds found</p>
                <p className="text-sm text-muted-foreground/70">
                  {searchQuery || tierFilter
                    ? 'Try adjusting your filters'
                    : 'Pull seeds from the Gacha first!'}
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BreedingSlot;
