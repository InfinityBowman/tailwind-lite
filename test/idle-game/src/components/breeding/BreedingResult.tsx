/**
 * BreedingResult Component
 * Celebration modal displayed when breeding completes
 * Shows the offspring with inherited and new traits
 *
 * Accessibility:
 * - Respects prefers-reduced-motion
 * - Keyboard dismissible (ESC)
 * - Focus management
 * - Screen reader announcements
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Sparkles, ArrowRight, Dna, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import SeedIcon from '@/components/ui/SeedIcon';
import TraitChip from './TraitChip';
import { useReducedMotion } from '../../hooks';
import type { BreedingResult as BreedingResultType } from '../../game/systems/BreedingSystem';
import { getTierName, getTierStyles } from '@/utils/assets';

interface BreedingResultProps {
  result: BreedingResultType | null;
  isOpen: boolean;
  onClose: () => void;
  onBreedAgain?: () => void;
  onSendToInventory?: () => void;
}

const CONFETTI_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#A855F7', // purple
  '#EC4899', // pink
  '#FFD700', // gold
];

const BreedingResult: React.FC<BreedingResultProps> = ({
  result,
  isOpen,
  onClose,
  onBreedAgain,
  onSendToInventory,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Restore focus on close
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      previousFocusRef.current?.focus();
    }, 100);
  }, [onClose]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!result) return null;

  const { child, inheritedTraits, newTraits, discoveredRecipe } = result;
  const tierStyles = getTierStyles(child.tier);
  const hasNewTraits = newTraits.length > 0;
  const hasRecipeDiscovery = discoveredRecipe !== null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent
        ref={dialogRef}
        className="max-w-md"
        aria-describedby="breeding-result-description"
      >
        {/* Screen reader announcement */}
        <div id="breeding-result-description" className="sr-only">
          Breeding complete! Created a {getTierName(child.tier)} {child.type} seed
          {child.traits.length > 0 && ` with ${child.traits.length} traits`}.
          {hasNewTraits && ` Including ${newTraits.length} new traits!`}
          {hasRecipeDiscovery && ` Discovered recipe: ${discoveredRecipe.name}!`}
        </div>

        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div
              className={cn(
                'p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500',
                !prefersReducedMotion && 'animate-pulse'
              )}
            >
              <Dna className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">Breeding Complete!</DialogTitle>
          <DialogDescription>Your seeds have produced an offspring</DialogDescription>
        </DialogHeader>

        {/* Confetti animation (reduced motion safe) */}
        {!prefersReducedMotion && (hasNewTraits || hasRecipeDiscovery) && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-yellow-300 animate-ping"
                style={{
                  width: `${Math.random() * 12 + 8}px`,
                  height: `${Math.random() * 12 + 8}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1000}ms`,
                  animationDuration: `${1200 + Math.random() * 800}ms`,
                  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                }}
              />
            ))}
          </div>
        )}

        {/* Offspring Display */}
        <div className="flex flex-col items-center py-4">
          <div
            className={cn(
              'relative p-4 rounded-xl border-2 mb-4 transition-all',
              !prefersReducedMotion && 'animate-in zoom-in-95 duration-300'
            )}
            style={{
              ...tierStyles,
              borderColor: tierStyles.borderColor || 'var(--border)',
            }}
          >
            <SeedIcon
              seed={{ id: child.type, tier: child.tier, name: child.type }}
              size={80}
              showTierBadge
            />
            {hasRecipeDiscovery && (
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold capitalize mb-1">{child.type}</h3>
          <Badge
            variant="secondary"
            className="mb-4"
            style={{
              backgroundColor: `${tierStyles.borderColor}20`,
              color: tierStyles.borderColor,
              borderColor: tierStyles.borderColor,
            }}
          >
            {getTierName(child.tier)}
          </Badge>

          {/* Traits Display */}
          {child.traits.length > 0 && (
            <div className="w-full space-y-3 mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {child.traits.map(traitId => (
                  <TraitChip
                    key={traitId}
                    traitId={traitId}
                    size="md"
                    isNew={newTraits.includes(traitId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inheritance Breakdown */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Dna className="w-4 h-4" />
            Inheritance
          </h4>

          {inheritedTraits.length > 0 ? (
            inheritedTraits.map(traitId => (
              <div key={traitId} className="flex items-center gap-2 text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
                <TraitChip traitId={traitId} size="sm" />
                <span className="text-xs">Inherited from parent</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-xs">No traits inherited</p>
          )}

          {newTraits.length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              {newTraits.map(traitId => (
                <div key={traitId} className="flex items-center gap-2 text-yellow-500">
                  <Sparkles className="w-3 h-3" />
                  <TraitChip traitId={traitId} size="sm" isNew />
                  <span className="text-xs">
                    {hasRecipeDiscovery && discoveredRecipe?.resultTrait === traitId
                      ? 'Recipe discovery!'
                      : 'Random mutation!'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Recipe Discovery Banner */}
        {hasRecipeDiscovery && discoveredRecipe && (
          <div
            className={cn(
              'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-4 mt-4',
              !prefersReducedMotion && 'animate-in slide-in-from-bottom-2 duration-300'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-purple-400">Recipe Discovered!</span>
            </div>
            <p className="text-sm font-semibold">{discoveredRecipe.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This recipe is now permanently unlocked in your recipe book!
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          {onBreedAgain && (
            <Button
              variant="outline"
              onClick={() => {
                onBreedAgain();
                handleClose();
              }}
              className="w-full sm:w-auto"
            >
              <Dna className="w-4 h-4 mr-2" />
              Breed Again
            </Button>
          )}
          {onSendToInventory && (
            <Button
              variant="default"
              onClick={() => {
                onSendToInventory();
                handleClose();
              }}
              className="w-full sm:w-auto"
            >
              <Package className="w-4 h-4 mr-2" />
              Send to Inventory
            </Button>
          )}
          {!onBreedAgain && !onSendToInventory && (
            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BreedingResult;
