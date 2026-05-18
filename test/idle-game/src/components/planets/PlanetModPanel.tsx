/**
 * PlanetModPanel - Display and manage mods installed on a planet
 *
 * Shows installed mods and available mods to install.
 * Each planet has limited mod slots (2 base, expandable via prestige).
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wrench, Plus, Minus, Lock } from 'lucide-react';
import { RECIPES, type ItemId } from '../../game/config/recipes';
import {
  getInstalledMods,
  getAvailableMods,
  getModSlots,
  type CraftingState,
} from '../../game/systems/CraftingSystem';

interface PlanetModPanelProps {
  planetId: string;
  planetName: string;
  craftingState: CraftingState;
  prestigeBonusLevel?: number;
  onInstall: (itemId: string, planetId: string) => void;
  onUninstall: (itemId: string) => void;
}

const PlanetModPanel: React.FC<PlanetModPanelProps> = ({
  planetId,
  planetName,
  craftingState,
  prestigeBonusLevel = 0,
  onInstall,
  onUninstall,
}) => {
  const installedMods = getInstalledMods(planetId, craftingState);
  const availableMods = getAvailableMods(craftingState);
  const maxSlots = getModSlots(planetId, prestigeBonusLevel);
  const usedSlots = installedMods.length;
  const hasAvailableSlots = usedSlots < maxSlots;

  // Get effect types that are already installed
  const installedEffectTypes = new Set(
    installedMods.map(mod => RECIPES[mod.itemId]?.effectType).filter(Boolean)
  );

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

  return (
    <Card className="bg-secondary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4 text-purple-400" />
          Planet Mods
          <Badge variant="outline" className="ml-auto text-xs tabular-nums">
            {usedSlots}/{maxSlots} slots
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {installedMods.length === 0 && availableMods.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No mods available. Craft mods in the Workshop!
          </p>
        ) : (
          <>
            {/* Installed mods */}
            {installedMods.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground font-medium">Installed</h4>
                {installedMods.map(mod => {
                  const recipe = RECIPES[mod.itemId];
                  if (!recipe) return null;

                  return (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between p-2 rounded-md bg-purple-500/10 border border-purple-500/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipe.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getEffectDescription(recipe)}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => onUninstall(mod.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Uninstall mod (no refund)</TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available mods */}
            {availableMods.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground font-medium">Available</h4>
                {availableMods.map(mod => {
                  const recipe = RECIPES[mod.itemId];
                  if (!recipe) return null;

                  const alreadyHasType = installedEffectTypes.has(recipe.effectType);
                  const canInstall = hasAvailableSlots && !alreadyHasType;

                  return (
                    <div
                      key={mod.id}
                      className={`flex items-center justify-between p-2 rounded-md border ${
                        canInstall
                          ? 'bg-secondary/50 border-border/50 hover:border-purple-500/50'
                          : 'bg-secondary/20 border-border/30 opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipe.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getEffectDescription(recipe)}
                        </p>
                      </div>
                      {canInstall ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              onClick={() => onInstall(mod.id, planetId)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Install on {planetName}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-7 w-7 flex items-center justify-center">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {!hasAvailableSlots
                              ? 'No available mod slots'
                              : `Already has ${recipe.effectType} mod`}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty slots indicator */}
            {usedSlots < maxSlots && availableMods.length === 0 && (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  {maxSlots - usedSlots} slot{maxSlots - usedSlots > 1 ? 's' : ''} available
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanetModPanel;
