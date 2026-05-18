/**
 * Refinement Panel Component
 * Allows players to refine plants into refined essence
 */

import React from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { getRefinementPreviews } from '../../game/systems/RefinementSystem';
import { getRefinementEfficiencyBonus } from '../../game/systems/ResearchSystem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, Beaker, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';

const RefinementPanel: React.FC = () => {
  const { state, refinePlants, refineAllPlants } = useGameContext();

  const efficiencyBonus = getRefinementEfficiencyBonus(state.research.completed);
  const previews = getRefinementPreviews(state.ship.resources.plants, efficiencyBonus);

  const totalPossibleOutput = previews.reduce((sum, p) => sum + p.maxOutput, 0);

  const handleRefine = (plantType: string) => {
    refinePlants(plantType, 'max');
  };

  const handleRefineAll = () => {
    refineAllPlants();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Beaker className="w-5 h-5 text-purple-400" />
              Refinery
            </CardTitle>
            <CardDescription className="mt-1">
              Convert plants into Refined Essence for research
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="refined" className="gap-1.5 tabular-nums">
              <FlaskConical className="w-3 h-3" />
              {state.research.refinedEssence} Essence
            </Badge>
            {efficiencyBonus > 0 && (
              <div className="flex items-center gap-1.5 justify-end mt-1.5 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">
                  +{(efficiencyBonus * 100).toFixed(0)}% efficiency
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick refine all button */}
        {totalPossibleOutput > 0 && (
          <Button onClick={handleRefineAll} variant="default" size="lg" className="w-full gap-2">
            <FlaskConical className="w-5 h-5" />
            Refine All
            <ArrowRight className="w-4 h-4" />
            <span className="text-green-300 tabular-nums">+{totalPossibleOutput} Essence</span>
          </Button>
        )}

        {/* Individual plant refinement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {previews.map(preview => {
            const canRefine = preview.maxBatches > 0;

            return (
              <Card
                key={preview.plantType}
                className={`transition-all border-border/50 ${
                  canRefine ? 'border-primary/50 bg-primary/5' : 'opacity-60 bg-secondary/30'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="capitalize font-medium text-sm">{preview.plantType}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        ({preview.availableAmount} available)
                      </span>
                    </div>

                    {canRefine && (
                      <Button
                        onClick={() => handleRefine(preview.plantType)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                      >
                        <FlaskConical className="w-3 h-3" />
                        Refine
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1 text-xs tabular-nums">
                      {preview.costPerBatch} plants
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="refined" className="gap-1 text-xs tabular-nums">
                      {preview.outputPerBatch} essence
                    </Badge>
                    {canRefine && (
                      <span className="text-green-400 ml-auto text-xs tabular-nums">
                        ×{preview.maxBatches} = +{preview.maxOutput}
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
            <Beaker className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No plants available to refine</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Grow some crops first!</p>
          </div>
        )}

        <Separator />

        {/* Info box */}
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1.5">How Refinement Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Higher value plants produce more essence per batch
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Research "Refinery Upgrade" for +30% efficiency
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  Refined essence is used to unlock research
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default RefinementPanel;
