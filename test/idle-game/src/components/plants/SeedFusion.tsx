import React, { useState, useMemo, useRef } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { useReducedMotion } from '../../hooks';
import {
  isSeed,
  getFusionEssenceCost,
  getFusionCostMultiplier,
  isAutoFuseUnlocked,
  type SeedInstance,
  type FusionResult,
} from '../../game';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FlaskRound,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Check,
  Zap,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getTierStyles } from '@/utils/assets';
import { OnboardingHint, GAME_HINTS } from '@/components/ui';
import SeedIcon from '@/components/ui/SeedIcon';
import { cn } from '@/lib/utils';

// Animation timing constants
const FUSION_ANIMATION_DELAY_MS = 600;
const FUSION_REVEAL_DELAY_MS = 100;

type AutoFuseResult = {
  totalFusions: number;
  results: { tier: number; count: number }[];
  essenceUsed: number;
};

// Grouped fuseable pair type
type FuseablePair = {
  seedId: string;
  seedName: string;
  tier: number;
  seeds: SeedInstance[];
  essenceCost: number;
  canAfford: boolean;
};

const SeedFusion: React.FC = () => {
  const { state, fuseSeed, autoFuse, seedEssenceCount, seedTiers, dismissHint, isHintDismissed } =
    useGame();
  const prefersReducedMotion = useReducedMotion();

  // Check research unlocks
  const autoFuseUnlocked = isAutoFuseUnlocked(state.research.completed);

  const fusionDiscount = getFusionCostMultiplier(state.research.completed);
  const getDiscountedFusionCost = (tier: number) =>
    Math.floor(getFusionEssenceCost(tier) * fusionDiscount);

  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [autoFuseResult, setAutoFuseResult] = useState<AutoFuseResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showAutoFuseDialog, setShowAutoFuseDialog] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const fusionInProgressRef = useRef(false);

  // Group seeds into fuseable pairs
  const fuseablePairs = useMemo(() => {
    const pairs: FuseablePair[] = [];
    const grouped: Record<string, Record<number, SeedInstance[]>> = {};

    for (const item of state.ship.seedInventory) {
      if (!isSeed(item) || item.tier === 0 || item.tier >= 6) continue;
      const key = item.id;
      if (!grouped[key]) grouped[key] = {};
      if (!grouped[key][item.tier]) grouped[key][item.tier] = [];
      grouped[key][item.tier].push(item);
    }

    for (const [seedId, tiers] of Object.entries(grouped)) {
      for (const [tierStr, seeds] of Object.entries(tiers)) {
        if (seeds.length >= 2) {
          const tier = Number(tierStr);
          const essenceCost = Math.floor(getFusionEssenceCost(tier) * fusionDiscount);
          pairs.push({
            seedId,
            seedName: seeds[0].name,
            tier,
            seeds,
            essenceCost,
            canAfford: seedEssenceCount >= essenceCost,
          });
        }
      }
    }

    // Sort by tier (ascending), then by name
    return pairs.sort((a, b) => a.tier - b.tier || a.seedName.localeCompare(b.seedName));
  }, [state.ship.seedInventory, seedEssenceCount, fusionDiscount]);

  const totalFuseableCount = fuseablePairs.reduce(
    (sum, p) => sum + Math.floor(p.seeds.length / 2),
    0
  );
  const affordableFusions = fuseablePairs
    .filter(p => p.canAfford)
    .reduce((sum, p) => sum + Math.floor(p.seeds.length / 2), 0);

  const handleFusePair = (pair: FuseablePair) => {
    if (pair.seeds.length < 2 || !pair.canAfford) return;

    // Prevent double-click race conditions
    if (fusionInProgressRef.current) return;
    fusionInProgressRef.current = true;

    // Start fusion animation
    setIsFusing(true);
    setShowReveal(false);
    setShowResultDialog(true);

    // Skip animation for reduced motion users
    const animationDelay = prefersReducedMotion ? 0 : FUSION_ANIMATION_DELAY_MS;
    const revealDelay = prefersReducedMotion ? 0 : FUSION_REVEAL_DELAY_MS;

    // Perform actual fusion after brief animation
    setTimeout(async () => {
      const result = await fuseSeed(pair.seeds[0].instanceId, pair.seeds[1].instanceId);
      if (result.success && result.seed) {
        // FusionResult type has: success, message, seed (optional)
        setFusionResult({
          success: true,
          message: result.message || 'Fusion successful!',
          seed: result.seed as SeedInstance,
        });
      } else {
        setFusionResult(null);
      }
      setIsFusing(false);
      fusionInProgressRef.current = false;
      // Reveal result after a tiny delay for dramatic effect
      setTimeout(() => setShowReveal(true), revealDelay);
    }, animationDelay);
  };

  const handleAutoFuse = async () => {
    const result = await autoFuse(5);
    if (result.success) {
      // Convert Convex result to local AutoFuseResult format
      setAutoFuseResult({
        totalFusions: result.fusionCount || 0,
        results: [], // Simplified - could be derived from fusedSeeds if needed
        essenceUsed: result.essenceSpent || 0,
      });
    } else {
      setAutoFuseResult(null);
    }
    setShowAutoFuseDialog(true);
  };

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
    <>
      <div className="p-3 space-y-2">
        {/* Header - compact */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <FlaskRound className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold">Fusion</span>
            {fusionDiscount < 1 && (
              <Badge variant="tier2" className="text-[9px] h-4">
                -{Math.round((1 - fusionDiscount) * 100)}%
              </Badge>
            )}
          </div>
          <Badge variant="essence" className="tabular-nums text-xs h-5">
            {seedEssenceCount} ESS
          </Badge>
        </div>

        {/* Onboarding hint */}
        {totalFuseableCount > 0 && state.hints && !state.hints.firstFusion && (
          <OnboardingHint
            {...GAME_HINTS.fusion}
            onDismiss={dismissHint}
            dismissed={isHintDismissed(GAME_HINTS.fusion.id)}
          />
        )}

        {/* Auto Fuse Button - requires research */}
        {autoFuseUnlocked && (
          <Button
            onClick={handleAutoFuse}
            disabled={affordableFusions === 0}
            variant="success"
            size="sm"
            className="w-full gap-1.5 h-8"
          >
            <Zap className="w-4 h-4" />
            Auto Fuse
            {affordableFusions > 0 && (
              <Badge variant="secondary" className="ml-1 tabular-nums text-[10px] h-4">
                {affordableFusions}
              </Badge>
            )}
          </Button>
        )}

        {/* Fuseable Pairs Grid */}
        {fuseablePairs.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-1.5 pr-2">
              {fuseablePairs.map(pair => (
                <FusionPairCard
                  key={`${pair.seedId}-${pair.tier}`}
                  pair={pair}
                  seedTiers={seedTiers}
                  getTierBadgeVariant={getTierBadgeVariant}
                  onFuse={() => handleFusePair(pair)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-6 text-center">
            <FlaskRound className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-muted-foreground text-xs">No pairs available</p>
            <p className="text-[10px] text-muted-foreground/70">Pull more seeds from Gacha</p>
          </div>
        )}

        {/* Help Section (Collapsible) - more compact */}
        <Collapsible className="border-t border-border pt-2">
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group">
            <HelpCircle className="w-3 h-3" />
            <span>How it works</span>
            <ChevronDown className="w-3 h-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2 space-y-2">
            <div className="text-[10px] text-muted-foreground bg-secondary/50 rounded p-2 space-y-1">
              <p>
                <strong className="text-foreground">2 same seeds</strong> = 1 higher tier
              </p>
              <p>T1+T1→T2 • T2+T2→T3 • etc.</p>
            </div>

            <div className="grid grid-cols-5 gap-1 text-[9px]">
              {[1, 2, 3, 4, 5].map(tier => {
                const cost = getDiscountedFusionCost(tier);
                const canAfford = seedEssenceCount >= cost;
                const tierData = seedTiers[tier as keyof typeof seedTiers];
                return (
                  <div
                    key={tier}
                    className={cn(
                      'text-center p-1 rounded bg-secondary/30',
                      !canAfford && 'opacity-50'
                    )}
                  >
                    <div className="font-bold" style={{ color: tierData?.color }}>
                      T{tier}→{tier + 1}
                    </div>
                    <div className={canAfford ? 'text-blue-400' : 'text-muted-foreground'}>
                      {cost}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Fusion Result Dialog */}
      <Dialog
        open={showResultDialog}
        onOpenChange={open => {
          if (!open) {
            setShowResultDialog(false);
            setShowReveal(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {/* Fusion Animation */}
          {isFusing && (
            <div className="py-12 text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                {/* Outer spinning ring - skip animations for reduced motion */}
                {!prefersReducedMotion && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-400 animate-spin" />
                  </>
                )}
                {/* Inner glow */}
                <div
                  className={cn(
                    'absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20',
                    !prefersReducedMotion && 'animate-pulse'
                  )}
                />
                {/* Center icon */}
                <FlaskRound
                  className={cn(
                    'absolute inset-0 m-auto w-10 h-10 text-purple-400',
                    !prefersReducedMotion && 'animate-pulse'
                  )}
                />
              </div>
              <p
                className={cn(
                  'text-lg font-medium text-purple-400',
                  !prefersReducedMotion && 'animate-pulse'
                )}
              >
                Fusing...
              </p>
            </div>
          )}

          {!isFusing && fusionResult && (
            <>
              <DialogHeader>
                <DialogTitle
                  className={cn(
                    'flex items-center gap-2',
                    fusionResult.success ? 'text-green-400' : 'text-destructive'
                  )}
                >
                  {fusionResult.success ? (
                    <>
                      <Check className="w-5 h-5" /> Fusion Successful!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" /> Fusion Failed
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>{fusionResult.message}</DialogDescription>
              </DialogHeader>

              {fusionResult.success && fusionResult.seed && (
                <Card
                  className={cn(
                    'overflow-hidden transition-all duration-500',
                    showReveal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                  )}
                  style={getTierStyles(fusionResult.seed.tier)}
                >
                  <CardContent className="p-4 relative overflow-hidden">
                    {/* Celebration sparkles - skip for reduced motion */}
                    {showReveal && !prefersReducedMotion && (
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                          <Sparkles
                            key={i}
                            className="absolute w-4 h-4 text-yellow-300 animate-ping"
                            style={{
                              left: `${12 + i * 12}%`,
                              top: `${10 + (i % 3) * 30}%`,
                              animationDelay: `${i * 150}ms`,
                              animationDuration: '1s',
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className={cn(
                          'transition-transform duration-300',
                          showReveal ? 'scale-100' : 'scale-0'
                        )}
                      >
                        <SeedIcon seed={fusionResult.seed} size={48} />
                      </div>
                      <div>
                        <h3 className="font-bold capitalize">{fusionResult.seed.name}</h3>
                        <Badge variant={getTierBadgeVariant(fusionResult.seed.tier)}>
                          {seedTiers[fusionResult.seed.tier as keyof typeof seedTiers]?.name} (T
                          {fusionResult.seed.tier})
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => {
                  setShowResultDialog(false);
                  setShowReveal(false);
                }}
                className="w-full"
              >
                Continue
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Auto Fuse Result Dialog */}
      <Dialog open={showAutoFuseDialog} onOpenChange={setShowAutoFuseDialog}>
        <DialogContent className="sm:max-w-md">
          {autoFuseResult && (
            <>
              <DialogHeader>
                <DialogTitle
                  className={cn(
                    'flex items-center gap-2',
                    autoFuseResult.totalFusions > 0 ? 'text-green-400' : 'text-muted-foreground'
                  )}
                >
                  <Zap className="w-5 h-5" />
                  Auto Fuse Complete
                </DialogTitle>
                <DialogDescription>
                  {autoFuseResult.totalFusions > 0
                    ? `Fused ${autoFuseResult.totalFusions} pair${autoFuseResult.totalFusions > 1 ? 's' : ''}`
                    : 'No seeds were fused'}
                </DialogDescription>
              </DialogHeader>

              {autoFuseResult.totalFusions > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm p-3 bg-secondary/50 rounded-lg">
                    <span className="text-muted-foreground">Essence used</span>
                    <span className="font-bold text-blue-400 tabular-nums">
                      {autoFuseResult.essenceUsed}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Seeds created:</p>
                    <div className="flex flex-wrap gap-2">
                      {autoFuseResult.results.map(({ tier, count }) => (
                        <Badge
                          key={tier}
                          variant={getTierBadgeVariant(tier)}
                          className="gap-1.5 tabular-nums"
                        >
                          T{tier} × {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {autoFuseResult.totalFusions === 0 && (
                <p className="text-center text-muted-foreground p-4">
                  No matching pairs or not enough essence.
                </p>
              )}

              <Button onClick={() => setShowAutoFuseDialog(false)} className="w-full">
                Continue
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Individual fuseable pair card - compact
const FusionPairCard: React.FC<{
  pair: FuseablePair;
  seedTiers: Record<number, { name: string; color: string }>;
  getTierBadgeVariant: (tier: number) => 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' | 'tier6';
  onFuse: () => void;
}> = ({ pair, getTierBadgeVariant, onFuse }) => {
  const pairsAvailable = Math.floor(pair.seeds.length / 2);
  const nextTier = pair.tier + 1;

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-all border',
        'bg-slate-800/30 border-slate-700/30',
        pair.canAfford ? 'hover:border-primary/50 hover:bg-slate-800/50' : 'opacity-50'
      )}
    >
      {/* Seed Icons */}
      <div className="flex items-center gap-0.5">
        <SeedIcon seed={pair.seeds[0]} size={24} />
        <span className="text-muted-foreground text-[10px]">+</span>
        <SeedIcon seed={pair.seeds[1] || pair.seeds[0]} size={24} />
      </div>

      {/* Arrow */}
      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />

      {/* Result Preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-xs capitalize truncate">{pair.seedName}</span>
          <Badge variant={getTierBadgeVariant(nextTier)} className="text-[8px] h-3.5 px-1 shrink-0">
            T{nextTier}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="tabular-nums">×{pairsAvailable}</span>
          <span className={pair.canAfford ? 'text-blue-400' : ''}>{pair.essenceCost} ess</span>
        </div>
      </div>

      {/* Fuse Button */}
      <Button
        onClick={onFuse}
        disabled={!pair.canAfford}
        variant={pair.canAfford ? 'success' : 'secondary'}
        size="sm"
        className="shrink-0 h-7 w-7 p-0"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default SeedFusion;
