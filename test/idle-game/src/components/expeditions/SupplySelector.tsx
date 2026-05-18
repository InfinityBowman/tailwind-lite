/**
 * Supply Selector Component
 * Allows selecting supplies to use on an expedition
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Package, Clock, Gift, Shield, Star, Check } from 'lucide-react';
import {
  type CraftedItem,
  type CraftingState,
  getAvailableSupplies,
} from '../../game/systems/CraftingSystem';
import { RECIPES, type ItemId } from '../../game/config/recipes';
import { EXPEDITION_CONFIG } from '../../game/config/expeditions';

interface SupplySelectorProps {
  craftingState: CraftingState;
  selectedSupplyIds: string[];
  onToggleSupply: (supplyId: string) => void;
  maxSupplies?: number;
}

// Get appropriate icon for supply effect type
function getSupplyIcon(effectType?: string) {
  switch (effectType) {
    case 'expeditionTime':
      return Clock;
    case 'expeditionRewards':
      return Gift;
    case 'seedProtectionChance':
      return Shield;
    case 'legendaryChance':
      return Star;
    default:
      return Package;
  }
}

// Format supply effect for display
function formatSupplyEffect(recipe: (typeof RECIPES)[ItemId]): string {
  if (!recipe.effectType || !recipe.effectValue) return '';

  switch (recipe.effectType) {
    case 'expeditionTime':
      return `-${Math.round(recipe.effectValue * 100)}% duration`;
    case 'expeditionRewards':
      return `+${Math.round(recipe.effectValue * 100)}% rewards`;
    case 'seedProtectionChance':
      return `${Math.round(recipe.effectValue * 100)}% seed protection`;
    case 'legendaryChance':
      return `+${Math.round(recipe.effectValue * 100)}% legendary`;
    default:
      return '';
  }
}

const SupplySelector: React.FC<SupplySelectorProps> = ({
  craftingState,
  selectedSupplyIds,
  onToggleSupply,
  maxSupplies = EXPEDITION_CONFIG.MAX_SUPPLIES_PER_EXPEDITION,
}) => {
  const availableSupplies = getAvailableSupplies(craftingState);

  // Group supplies by type
  const supplyGroups = availableSupplies.reduce(
    (acc, supply) => {
      const itemId = supply.itemId;
      if (!acc[itemId]) {
        acc[itemId] = [];
      }
      acc[itemId].push(supply);
      return acc;
    },
    {} as Record<string, CraftedItem[]>
  );

  if (Object.keys(supplyGroups).length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 border border-white/10 rounded-lg bg-slate-800/30">
        <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No supplies available</p>
        <p className="text-xs text-slate-600 mt-1">Craft supplies in the Workshop</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Supplies ({selectedSupplyIds.length}/{maxSupplies})
        </span>
        <span className="text-slate-500 text-xs">Optional</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(supplyGroups).map(([itemId, supplies]) => {
          const recipe = RECIPES[itemId as ItemId];
          if (!recipe) return null;

          const IconComponent = getSupplyIcon(recipe.effectType);
          const effectText = formatSupplyEffect(recipe);
          const count = supplies.length;

          // Find first available supply of this type that isn't selected
          const availableSupply = supplies.find(s => !selectedSupplyIds.includes(s.id));
          const selectedOfType = supplies.filter(s => selectedSupplyIds.includes(s.id));
          const isSelected = selectedOfType.length > 0;
          const canSelect = selectedSupplyIds.length < maxSupplies && availableSupply;

          return (
            <button
              key={itemId}
              onClick={() => {
                if (isSelected) {
                  // Deselect the first selected one of this type
                  onToggleSupply(selectedOfType[0].id);
                } else if (canSelect) {
                  onToggleSupply(availableSupply.id);
                }
              }}
              disabled={!isSelected && !canSelect}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-all text-left',
                isSelected
                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                  : canSelect
                    ? 'hover:bg-white/5 border border-white/10'
                    : 'opacity-50 border border-white/5'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700/50 text-slate-400'
                )}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{recipe.name}</div>
                <div className="text-xs text-emerald-400">{effectText}</div>
              </div>
              <div className="flex items-center gap-1">
                {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                <span className="text-xs text-slate-500">x{count - selectedOfType.length}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary of selected supply effects */}
      {selectedSupplyIds.length > 0 && (
        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 font-medium mb-1">Supply Bonuses:</div>
          <div className="flex flex-wrap gap-1">
            {selectedSupplyIds.map(id => {
              const supply = availableSupplies.find(s => s.id === id);
              if (!supply) return null;
              const recipe = RECIPES[supply.itemId];
              if (!recipe) return null;

              const IconComponent = getSupplyIcon(recipe.effectType);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-xs text-emerald-300"
                >
                  <IconComponent className="w-3 h-3" />
                  {formatSupplyEffect(recipe)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplySelector;
