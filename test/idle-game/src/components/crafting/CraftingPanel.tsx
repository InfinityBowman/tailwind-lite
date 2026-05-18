/**
 * Crafting Panel Component
 * Craft items from extracts
 */

import React, { useState } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { RECIPES, type ItemId, type ItemCategory } from '../../game/config/recipes';
import { EXTRACT_DEFINITIONS } from '../../game/config/extracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Hammer,
  Zap,
  Shield,
  Package,
  Wrench,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Play,
} from 'lucide-react';

const CATEGORY_INFO: Record<
  ItemCategory,
  { icon: React.ElementType; label: string; description: string }
> = {
  booster: { icon: Zap, label: 'Boosters', description: 'Temporary production boosts' },
  equipment: { icon: Shield, label: 'Equipment', description: 'Enhance your managers' },
  supply: { icon: Package, label: 'Supplies', description: 'Expedition modifiers' },
  mod: { icon: Wrench, label: 'Mods', description: 'Permanent planet upgrades' },
  cosmetic: { icon: Sparkles, label: 'Cosmetics', description: 'Visual customizations' },
};

const CraftingPanel: React.FC = () => {
  const { craftItem, applyBooster, getRecipeInfo, getCraftingState, getExtractInventory } =
    useGameContext();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('booster');

  const craftingState = getCraftingState();
  const extractInventory = getExtractInventory();

  // Loading guard
  if (!craftingState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading crafting...</div>
      </div>
    );
  }

  const totalInventoryItems = craftingState.inventory.length;
  const activeBoostCount = craftingState.activeBoosts.length;

  const handleCraft = (itemId: ItemId) => {
    craftItem(itemId);
  };

  const handleApplyBooster = (itemInstanceId: string) => {
    applyBooster(itemInstanceId);
  };

  // Get recipes for the selected category
  const categoryRecipes = Object.values(RECIPES).filter(r => r.category === selectedCategory);

  // Get rarity color for extracts
  const getRarityColor = (rarity: 'common' | 'uncommon' | 'rare') => {
    switch (rarity) {
      case 'rare':
        return 'text-purple-400';
      case 'uncommon':
        return 'text-blue-400';
      default:
        return 'text-slate-300';
    }
  };

  // Format duration for display
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hammer className="w-5 h-5 text-orange-400" />
              Crafting
            </CardTitle>
            <CardDescription className="mt-1">Create powerful items from extracts</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1.5 tabular-nums">
              <Package className="w-3 h-3" />
              {totalInventoryItems} Items
            </Badge>
            {activeBoostCount > 0 && (
              <Badge variant="default" className="gap-1.5 tabular-nums bg-green-600">
                <Zap className="w-3 h-3" />
                {activeBoostCount} Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Boosts Display */}
        {craftingState.activeBoosts.length > 0 && (
          <Card className="bg-green-900/20 border-green-500/30">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                <Zap className="w-4 h-4" />
                Active Boosts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {craftingState.activeBoosts.map(boost => {
                  const recipe = RECIPES[boost.itemId];
                  if (!recipe) return null;
                  const remainingMs = (boost.expiresAt || 0) - Date.now();
                  const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000));
                  return (
                    <Badge
                      key={boost.id}
                      variant="outline"
                      className="gap-1.5 bg-green-500/10 border-green-500/30 text-green-300"
                    >
                      <Zap className="w-3 h-3" />
                      {recipe.name}
                      <span className="text-green-400/70">({remainingMin}m)</span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Quick View */}
        {totalInventoryItems > 0 && (
          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory ({totalInventoryItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {craftingState.inventory.map(item => {
                  const recipe = RECIPES[item.itemId];
                  if (!recipe) return null;
                  const isBooster = recipe.category === 'booster';
                  return (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className={`gap-1.5 ${isBooster ? 'cursor-pointer hover:bg-primary/20' : ''}`}
                      onClick={isBooster ? () => handleApplyBooster(item.id) : undefined}
                    >
                      {isBooster ? (
                        <Zap className="w-3 h-3 text-yellow-400" />
                      ) : (
                        <Package className="w-3 h-3" />
                      )}
                      {recipe.name}
                      {isBooster && <Play className="w-3 h-3 text-green-400 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
              {craftingState.inventory.some(i => RECIPES[i.itemId]?.category === 'booster') && (
                <p className="text-xs text-muted-foreground mt-2">Click a booster to activate it</p>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={v => setSelectedCategory(v as ItemCategory)}>
          <TabsList className="grid w-full grid-cols-5">
            {(
              Object.entries(CATEGORY_INFO) as [
                ItemCategory,
                (typeof CATEGORY_INFO)[ItemCategory],
              ][]
            ).map(([cat, info]) => {
              const Icon = info.icon;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{info.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(CATEGORY_INFO) as ItemCategory[]).map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_INFO[category].description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(RECIPES)
                  .filter(r => r.category === category)
                  .map(recipe => {
                    const info = getRecipeInfo(recipe.id);
                    if (!info) return null;

                    const canAfford = info.canAfford;

                    return (
                      <Card
                        key={recipe.id}
                        className={`transition-all border-border/50 ${
                          canAfford
                            ? 'border-primary/50 bg-primary/5'
                            : 'opacity-70 bg-secondary/30'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{recipe.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {recipe.description}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleCraft(recipe.id)}
                              disabled={!canAfford}
                              variant={canAfford ? 'default' : 'outline'}
                              size="sm"
                              className="gap-1.5 h-7 text-xs shrink-0"
                            >
                              <Hammer className="w-3 h-3" />
                              Craft
                            </Button>
                          </div>

                          {/* Effect info */}
                          {recipe.effectType && recipe.effectValue && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Sparkles className="w-3 h-3 text-yellow-400" />+
                                {Math.round(recipe.effectValue * 100)}% {recipe.effectType}
                              </Badge>
                              {recipe.durationMs && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(recipe.durationMs)}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Ingredients */}
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredients.map(ing => {
                              const def = EXTRACT_DEFINITIONS[ing.extractId];
                              if (!def) return null;
                              const have = extractInventory[ing.extractId] || 0;
                              const hasEnough = have >= ing.amount;

                              return (
                                <Badge
                                  key={ing.extractId}
                                  variant="outline"
                                  className={`gap-1 text-xs ${hasEnough ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}
                                >
                                  {hasEnough ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                  )}
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: def.color }}
                                  />
                                  <span className={getRarityColor(def.rarity)}>
                                    {def.name.replace(' Extract', '')}
                                  </span>
                                  <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                    {have}/{ing.amount}
                                  </span>
                                </Badge>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {categoryRecipes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Hammer className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No recipes in this category</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CraftingPanel;
