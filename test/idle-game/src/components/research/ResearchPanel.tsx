/**
 * Research Panel Component
 * Displays research tree and allows unlocking research
 */

import React, { useState } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { RESEARCH_NODES, MAX_RESEARCH_TIER, getResearchByTier } from '../../game/config/research';
import { getAvailableResearch } from '../../game/systems/ResearchSystem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FlaskConical, Lock, Check, AlertCircle } from 'lucide-react';
import ResearchIcon from '../ui/ResearchIcon';

const ResearchPanel: React.FC = () => {
  const { state, unlockResearch } = useGameContext();
  const [selectedTier, setSelectedTier] = useState('1');

  const researchState = state.research;
  const availableResearch = getAvailableResearch(researchState);
  const availableIds = new Set(availableResearch.map(r => r.id));

  const handleUnlock = async (researchId: string) => {
    const result = await unlockResearch(researchId);
    if (!result.success) {
      console.warn('Failed to unlock:', result.error);
    }
  };

  const renderResearchNode = (node: (typeof RESEARCH_NODES)[string]) => {
    const isCompleted = researchState.completed.includes(node.id);
    const isAvailable = availableIds.has(node.id);
    const canAfford = researchState.refinedEssence >= node.costs.refinedEssence;
    const canUnlock = isAvailable && canAfford;

    let borderColor = 'border-border/50';
    let bgColor = 'bg-secondary/30';

    if (isCompleted) {
      borderColor = 'border-green-500/70';
      bgColor = 'bg-green-500/10';
    } else if (isAvailable && canAfford) {
      borderColor = 'border-primary/70';
      bgColor = 'bg-primary/10';
    } else if (isAvailable) {
      borderColor = 'border-yellow-500/70';
      bgColor = 'bg-yellow-500/10';
    }

    return (
      <Card
        key={node.id}
        className={`${bgColor} ${borderColor} border transition-all duration-200 ${
          canUnlock ? 'hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:border-primary' : ''
        } ${!isAvailable && !isCompleted ? 'opacity-50' : ''}`}
        onClick={() => canUnlock && handleUnlock(node.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0">
              <ResearchIcon icon={node.icon} size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{node.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {node.description}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            {isCompleted ? (
              <Badge variant="tier2" className="gap-1.5">
                <Check className="w-3 h-3" />
                Completed
              </Badge>
            ) : (
              <Badge variant={canAfford ? 'refined' : 'secondary'} className="gap-1.5 tabular-nums">
                <FlaskConical className="w-3 h-3" />
                {node.costs.refinedEssence} essence
              </Badge>
            )}

            {node.prerequisites.length > 0 && !isCompleted && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                {node.prerequisites.map(p => {
                  const prereqNode = RESEARCH_NODES[p];
                  const prereqCompleted = researchState.completed.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={e => {
                        e.stopPropagation();
                        if (prereqNode) {
                          setSelectedTier(String(prereqNode.tier));
                        }
                      }}
                      className={`rounded p-0.5 transition-all hover:ring-2 hover:ring-primary hover:scale-110 ${
                        prereqCompleted ? 'opacity-50' : ''
                      }`}
                      title={`Requires: ${prereqNode?.name || p}${prereqCompleted ? ' (completed)' : ''}`}
                    >
                      <ResearchIcon icon={prereqNode?.icon || 'chart'} size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isAvailable && !canAfford && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              <span className="tabular-nums">
                Need {node.costs.refinedEssence - researchState.refinedEssence} more essence
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="w-5 h-5 text-purple-400" />
              Research Lab
            </CardTitle>
            <CardDescription className="mt-1">
              Unlock permanent upgrades with refined essence
            </CardDescription>
          </div>
          <Badge variant="refined" className="gap-1.5 tabular-nums">
            <FlaskConical className="w-3 h-3" />
            {researchState.refinedEssence} Essence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Next Research Progress */}
        {availableResearch.length > 0 &&
          (() => {
            // Find cheapest available research
            const nextResearch = availableResearch.reduce(
              (cheapest, r) =>
                r.costs.refinedEssence < cheapest.costs.refinedEssence ? r : cheapest,
              availableResearch[0]
            );

            const progress = Math.min(
              100,
              (researchState.refinedEssence / nextResearch.costs.refinedEssence) * 100
            );
            const canAfford = researchState.refinedEssence >= nextResearch.costs.refinedEssence;

            return (
              <Card className="mb-4 bg-gradient-to-r from-purple-500/10 to-primary/10 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ResearchIcon icon={nextResearch.icon} size={16} />
                      <span className="text-sm font-medium">
                        Next: <span className="text-purple-400">{nextResearch.name}</span>
                      </span>
                    </div>
                    <span className="text-sm tabular-nums">
                      {researchState.refinedEssence} / {nextResearch.costs.refinedEssence}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {canAfford && (
                    <p className="text-xs text-green-400 mt-2 text-center">
                      Ready to research! Click the card above to unlock.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

        {/* Tier tabs */}
        <Tabs value={selectedTier} onValueChange={setSelectedTier} className="w-full">
          <TabsList className="mb-4 h-10">
            {Array.from({ length: MAX_RESEARCH_TIER }, (_, i) => i + 1).map(tier => {
              const tierNodes = getResearchByTier(tier);
              const completedInTier = tierNodes.filter(n =>
                researchState.completed.includes(n.id)
              ).length;

              return (
                <TabsTrigger key={tier} value={String(tier)} className="gap-1.5">
                  <span className="hidden sm:inline">Tier</span> {tier}
                  <Badge variant="secondary" className="ml-1 text-xs tabular-nums">
                    {completedInTier}/{tierNodes.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Array.from({ length: MAX_RESEARCH_TIER }, (_, i) => i + 1).map(tier => {
            const tierResearch = getResearchByTier(tier);
            return (
              <TabsContent key={tier} value={String(tier)}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierResearch.map(renderResearchNode)}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Research Progress</span>
            <span className="tabular-nums">
              <span className="text-foreground font-medium">{researchState.completed.length}</span>
              <span className="text-muted-foreground"> / {Object.keys(RESEARCH_NODES).length}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResearchPanel;
