/**
 * BreedingPanel Component
 * Main container for the breeding system UI
 *
 * Features:
 * - Two parent slots for seed selection
 * - Preview of possible traits on offspring
 * - Timer and progress bar for breeding
 * - Recipe discovery display
 * - Celebration when breeding completes
 *
 * Accessibility:
 * - Respects prefers-reduced-motion
 * - Keyboard navigable
 * - Screen reader announcements for progress
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dna,
  Heart,
  Timer,
  BookOpen,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import BreedingSlot from './BreedingSlot';
import BreedingResult from './BreedingResult';
import TraitChip from './TraitChip';
import { useReducedMotion } from '../../hooks';
import { useGame } from '../../contexts/GameEngineContext';
import {
  type BreedingResult as BreedingResultType,
  type SeedWithTraits,
  calculateBreedingDuration,
  collectParentTraits,
  canStartBreeding as canStartBreedingCheck,
} from '../../game/systems/BreedingSystem';
import { TRAIT_DEFINITIONS, HIDDEN_RECIPES, getMaxTraitsForTier } from '../../game/config/traits';
import { isSeed, type SeedInstance } from '../../game';
import { getTierName } from '@/utils/assets';

interface BreedingPanelProps {
  className?: string;
}

const BreedingPanel: React.FC<BreedingPanelProps> = ({ className }) => {
  const prefersReducedMotion = useReducedMotion();
  const {
    state,
    placeSeedInBreedingSlot,
    removeSeedFromBreedingSlot,
    canStartBreeding,
    startBreeding,
    isBreedingComplete,
    getBreedingProgress,
    getBreedingTimeRemaining,
    completeBreeding,
    cancelBreeding,
  } = useGame();

  // Use breeding state from game engine
  const breedingState = state.breeding;

  // Local UI state for result modal
  const [showResult, setShowResult] = useState(false);
  const [breedingResult, setBreedingResult] = useState<BreedingResultType | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  // Force re-render for timer updates
  const [, setTick] = useState(0);

  // Update timer display when breeding
  useEffect(() => {
    if (!breedingState.isBreeding) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [breedingState.isBreeding]);

  // Get available seeds from inventory (excluding ones already in slots)
  const availableSeeds = useMemo(() => {
    const usedIds = new Set<string>();
    breedingState.slots.forEach(slot => {
      if (slot.seed) usedIds.add(slot.seed.instanceId);
    });

    return state.ship.seedInventory.filter(
      item => isSeed(item) && !usedIds.has(item.instanceId)
    ) as SeedInstance[];
  }, [state.ship.seedInventory, breedingState.slots]);

  // Calculate preview data when both parents are selected
  const breedingPreview = useMemo(() => {
    const [slot1, slot2] = breedingState.slots;
    if (!slot1.seed || !slot2.seed) return null;

    const parent1 = slot1.seed;
    const parent2 = slot2.seed;

    const duration = calculateBreedingDuration(parent1, parent2);
    const childTier = Math.min(parent1.tier, parent2.tier);
    const maxTraits = getMaxTraitsForTier(childTier);
    const parentTraits = collectParentTraits(parent1, parent2);

    // Calculate possible recipes
    const possibleRecipes = HIDDEN_RECIPES.filter(recipe => {
      if (breedingState.discoveredRecipes.includes(recipe.id)) return false;
      return recipe.requiredTraits.every(t => parentTraits.includes(t));
    });

    return {
      duration,
      durationFormatted: formatDuration(duration),
      childTier,
      maxTraits,
      parentTraits,
      possibleRecipes,
    };
  }, [breedingState.slots, breedingState.discoveredRecipes]);

  // Format duration in human readable form
  function formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Handlers using game engine methods
  const handleSelectSeed = useCallback(
    (slotIndex: 0 | 1, seed: SeedWithTraits) => {
      placeSeedInBreedingSlot(slotIndex, seed.instanceId);
    },
    [placeSeedInBreedingSlot]
  );

  const handleRemoveSeed = useCallback(
    (slotIndex: 0 | 1) => {
      removeSeedFromBreedingSlot(slotIndex);
    },
    [removeSeedFromBreedingSlot]
  );

  const handleStartBreeding = useCallback(() => {
    if (!canStartBreeding()) return;
    startBreeding();
  }, [canStartBreeding, startBreeding]);

  const handleCancelBreeding = useCallback(() => {
    cancelBreeding();
  }, [cancelBreeding]);

  const handleCollect = useCallback(async () => {
    const result = await completeBreeding();
    if (result.success && result.child) {
      // Convert the Convex response to BreedingResult format
      setBreedingResult({
        child: result.child as unknown as SeedWithTraits,
        inheritedTraits: [],
        newTraits: [],
        discoveredRecipe: null,
      });
      setShowResult(true);
    }
  }, [completeBreeding]);

  // Check for breeding completion - auto-collect when done
  const breedingIsDone = breedingState.isBreeding && isBreedingComplete();
  useEffect(() => {
    if (breedingIsDone && !showResult && !isCollecting) {
      setIsCollecting(true);
      handleCollect().finally(() => setIsCollecting(false));
    }
  }, [breedingIsDone, showResult, isCollecting, handleCollect]);

  const handleBreedAgain = useCallback(() => {
    setShowResult(false);
    setBreedingResult(null);
  }, []);

  const handleSendToInventory = useCallback(() => {
    // Child is already added to inventory by completeBreeding
    setShowResult(false);
    setBreedingResult(null);
  }, []);

  const progress = breedingState.isBreeding ? getBreedingProgress() * 100 : 0;
  const timeRemaining = breedingState.isBreeding ? getBreedingTimeRemaining() : '';
  const breedingReady = canStartBreedingCheck(breedingState);

  return (
    <TooltipProvider>
      <div className={cn('p-4 sm:p-6 space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Seed Breeding</h2>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p>
                Combine two seeds to create offspring with inherited traits. Some trait combinations
                unlock hidden recipes!
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Parent Selection */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Parent 1 */}
              <BreedingSlot
                slotIndex={0}
                seed={breedingState.slots[0].seed}
                isBreeding={breedingState.isBreeding}
                availableSeeds={availableSeeds}
                onSelectSeed={seed => handleSelectSeed(0, seed)}
                onRemoveSeed={() => handleRemoveSeed(0)}
              />

              {/* Heart/Plus indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                    breedingState.slots[0].seed && breedingState.slots[1].seed
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'bg-muted/50 text-muted-foreground',
                    breedingState.isBreeding && !prefersReducedMotion && 'animate-pulse'
                  )}
                >
                  {breedingState.slots[0].seed && breedingState.slots[1].seed ? (
                    <Heart className="w-6 h-6" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium">=</span>
              </div>

              {/* Parent 2 */}
              <BreedingSlot
                slotIndex={1}
                seed={breedingState.slots[1].seed}
                isBreeding={breedingState.isBreeding}
                availableSeeds={availableSeeds}
                onSelectSeed={seed => handleSelectSeed(1, seed)}
                onRemoveSeed={() => handleRemoveSeed(1)}
              />
            </div>

            {/* Preview Info */}
            {breedingPreview && !breedingState.isBreeding && (
              <div
                className={cn(
                  'mt-6 p-4 bg-secondary/50 rounded-lg space-y-3',
                  !prefersReducedMotion &&
                    'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
                )}
              >
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{breedingPreview.durationFormatted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dna className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Child Tier:</span>
                    <Badge variant="secondary" className="text-xs">
                      {getTierName(breedingPreview.childTier)}
                    </Badge>
                  </div>
                </div>

                {/* Possible Traits */}
                <div>
                  <span className="text-xs text-muted-foreground block mb-2">
                    Possible Traits (up to {breedingPreview.maxTraits}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {breedingPreview.parentTraits.length > 0 ? (
                      breedingPreview.parentTraits.map(traitId => (
                        <TraitChip key={traitId} traitId={traitId} size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No traits to inherit</span>
                    )}
                  </div>
                </div>

                {/* Possible Recipe Discovery */}
                {breedingPreview.possibleRecipes.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400 font-medium">
                      Recipe discovery possible!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 mt-6">
              {!breedingState.isBreeding ? (
                <Button
                  variant="gacha"
                  size="lg"
                  disabled={!breedingReady}
                  onClick={handleStartBreeding}
                  className="min-w-[160px]"
                >
                  <Dna className="w-4 h-4 mr-2" />
                  Start Breeding
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleCancelBreeding}
                  className="min-w-[160px]"
                >
                  Cancel Breeding
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        {breedingState.isBreeding && (
          <Card
            className={cn(
              !prefersReducedMotion && 'animate-in fade-in-0 slide-in-from-top-2 duration-200'
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Breeding in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress
                value={progress}
                className="h-3"
                indicatorClassName={cn(
                  'bg-gradient-to-r from-purple-500 to-pink-500',
                  !prefersReducedMotion && progress < 100 && 'animate-pulse'
                )}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
                <span className="font-medium flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {timeRemaining || 'Complete!'}
                </span>
              </div>

              {/* Collect button when complete */}
              {progress >= 100 && (
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleCollect}
                  className={cn('w-full', !prefersReducedMotion && 'animate-bounce')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Collect Offspring!
                </Button>
              )}

              {/* Screen reader announcement for progress */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                Breeding {Math.round(progress)}% complete.
                {timeRemaining && `${timeRemaining} remaining.`}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discovered Recipes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Discovered Recipes
              <Badge variant="secondary" className="ml-auto text-xs">
                {breedingState.discoveredRecipes.length} / {HIDDEN_RECIPES.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {HIDDEN_RECIPES.map(recipe => {
                  const isDiscovered = breedingState.discoveredRecipes.includes(recipe.id);
                  const resultTrait = TRAIT_DEFINITIONS[recipe.resultTrait];

                  return (
                    <div
                      key={recipe.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-colors',
                        isDiscovered ? 'bg-secondary/50' : 'bg-muted/30 opacity-60'
                      )}
                    >
                      {isDiscovered ? (
                        <Unlock className="w-4 h-4 text-green-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {isDiscovered ? recipe.name : '???'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {isDiscovered ? (
                            <>
                              {recipe.requiredTraits.map(traitId => (
                                <TraitChip
                                  key={traitId}
                                  traitId={traitId}
                                  size="sm"
                                  showLabel={false}
                                />
                              ))}
                              <span className="text-xs text-muted-foreground self-center mx-1">
                                =
                              </span>
                              <TraitChip traitId={recipe.resultTrait} size="sm" />
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {resultTrait?.discoveryHint ||
                                'Discover this recipe through breeding...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Breeding Result Modal */}
        <BreedingResult
          result={breedingResult}
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          onBreedAgain={handleBreedAgain}
          onSendToInventory={handleSendToInventory}
        />
      </div>
    </TooltipProvider>
  );
};

export default BreedingPanel;
