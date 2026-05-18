/**
 * Workshop Panel Component
 * Process plants into extracts for crafting
 */

import React from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { EXTRACT_DEFINITIONS, type ExtractId } from '../../game/config/extracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Factory, ArrowRight, Lightbulb, Sparkles, Package } from 'lucide-react';

const WorkshopPanel: React.FC = () => {
  const { extractPlants, extractAllPlants, getAllExtractionPreviews, getExtractInventory } =
    useGameContext();

  const previews = getAllExtractionPreviews();
  const extractInventory = getExtractInventory();

  const totalPossibleExtracts = previews.reduce((sum, p) => sum + p.maxExtracts, 0);
  const totalExtractCount = Object.values(extractInventory).reduce((sum, v) => sum + v, 0);

  const handleExtract = async (plantType: string) => {
    await extractPlants(plantType);
  };

  const handleExtractAll = async () => {
    await extractAllPlants();
  };

  // Get extract color based on rarity
  const getRarityColor = (rarity: 'common' | 'uncommon' | 'rare') => {
    switch (rarity) {
      case 'rare':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'uncommon':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default:
        return 'text-slate-300 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5 text-amber-400" />
              Workshop
            </CardTitle>
            <CardDescription className="mt-1">
              Process plants into extracts for crafting
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="gap-1.5 tabular-nums">
              <Sparkles className="w-3 h-3" />
              {totalExtractCount} Extracts
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick process all button */}
        {totalPossibleExtracts > 0 && (
          <Button onClick={handleExtractAll} variant="default" size="lg" className="w-full gap-2">
            <Factory className="w-5 h-5" />
            Process All Plants
            <ArrowRight className="w-4 h-4" />
            <span className="text-green-300 tabular-nums">+{totalPossibleExtracts} Extracts</span>
          </Button>
        )}

        {/* Extract Inventory */}
        {totalExtractCount > 0 && (
          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Extract Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {(Object.entries(extractInventory) as [ExtractId, number][])
                  .filter(([_, amount]) => amount > 0)
                  .sort((a, b) => {
                    // Sort by rarity (rare > uncommon > common)
                    const rarityOrder = { rare: 3, uncommon: 2, common: 1 };
                    const aRarity = EXTRACT_DEFINITIONS[a[0]]?.rarity || 'common';
                    const bRarity = EXTRACT_DEFINITIONS[b[0]]?.rarity || 'common';
                    return rarityOrder[bRarity] - rarityOrder[aRarity];
                  })
                  .map(([extractId, amount]) => {
                    const def = EXTRACT_DEFINITIONS[extractId];
                    if (!def) return null;
                    return (
                      <Badge
                        key={extractId}
                        variant="outline"
                        className={`gap-1.5 ${getRarityColor(def.rarity)}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: def.color }}
                        />
                        {def.name.replace(' Extract', '')}: {amount}
                      </Badge>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Individual plant processing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {previews.map(preview => {
            const canProcess = preview.maxExtracts > 0;
            const def = preview.extractDefinition;

            return (
              <Card
                key={preview.plantType}
                className={`transition-all border-border/50 ${
                  canProcess ? 'border-primary/50 bg-primary/5' : 'opacity-60 bg-secondary/30'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="capitalize font-medium text-sm">{preview.plantType}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        ({Math.floor(preview.availablePlants)} available)
                      </span>
                    </div>

                    {canProcess && (
                      <Button
                        onClick={() => handleExtract(preview.plantType)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                      >
                        <Factory className="w-3 h-3" />
                        Process
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1 text-xs tabular-nums">
                      {preview.plantsPerExtract} plants
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs ${getRarityColor(def.rarity)}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: def.color }}
                      />
                      1 {def.name.replace(' Extract', '')}
                    </Badge>
                    {canProcess && (
                      <span className="text-green-400 ml-auto text-xs tabular-nums">
                        = +{preview.maxExtracts}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {previews.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No plants available to process</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Grow some crops first!</p>
          </div>
        )}

        <Separator />

        {/* Info box */}
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1.5">How Processing Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Each plant type produces a unique extract
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Rarer plants need fewer to produce extracts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Extracts are used for crafting items (coming soon)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default WorkshopPanel;
