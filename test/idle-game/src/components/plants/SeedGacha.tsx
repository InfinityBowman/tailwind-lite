/**
 * SeedGacha - Compact gacha pull interface
 *
 * Compact layout with pull buttons and drop rates in a modal.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameEngineContext';
import {
  GACHA_CONFIG,
  isSeed,
  getGachaCostMultiplier,
  type InventoryItem,
  type GachaPullResult,
  type GachaMultiPullResult,
} from '../../game';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Coins, AlertCircle, Zap, HelpCircle, Target, Loader2 } from 'lucide-react';
import { getTierStyles } from '@/utils/assets';
import SeedIcon from '@/components/ui/SeedIcon';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import GachaReveal from './GachaReveal';

type PullResultState =
  | (Omit<GachaPullResult, 'consecutiveFodders'> & { item: InventoryItem; isMulti?: false })
  | (Omit<GachaMultiPullResult, 'consecutiveFodders'> & { isMulti: true })
  | { error: string };

interface SeedGachaProps {
  highlightPullButton?: boolean;
}

const SeedGacha: React.FC<SeedGachaProps> = ({ highlightPullButton }) => {
  const { state, gachaPull, gachaMultiPull, isPulling, seedTiers } = useGame();
  const [pullResult, setPullResult] = useState<PullResultState | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDropRates, setShowDropRates] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [revealTier, setRevealTier] = useState(0);
  const [isAnticipating, setIsAnticipating] = useState(false);

  // Apply research discount to gacha costs
  const researchDiscount = getGachaCostMultiplier(state.research.completed);
  const PULL_COST = Math.floor(GACHA_CONFIG.PULL_COST * researchDiscount);

  // Multi-pull costs
  const PULL_10_COST = Math.floor(
    GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT * researchDiscount
  );
  const PULL_100_COST = Math.floor(
    GACHA_CONFIG.PULL_COST * 100 * GACHA_CONFIG.MULTI_PULL_100_DISCOUNT * researchDiscount
  );

  const canAffordSingle = state.ship.totalCurrency >= PULL_COST;
  const canAfford10 = state.ship.totalCurrency >= PULL_10_COST;
  const canAfford100 = state.ship.totalCurrency >= PULL_100_COST;

  const performPull = async () => {
    setIsAnimating(true);
    setShowReveal(false);
    setShowDialog(true);

    // Perform the actual pull
    const result = await gachaPull();

    if (!result.success) {
      // Error toast is handled by useMutationWithOptimistic
      setIsAnimating(false);
      setShowDialog(false);
      return;
    }

    if (result.item) {
      const item = result.item as InventoryItem;
      const tier = isSeed(item) ? item.tier : 0;

      setPullResult({
        ...result,
        item,
        isMulti: false,
      } as PullResultState);

      // Start tier-based anticipation animation
      setRevealTier(tier);
      setIsAnimating(false);
      setIsAnticipating(true);
    }
  };

  const handleRevealReady = () => {
    // GachaReveal anticipation is done, show the result
    setIsAnticipating(false);
    setShowReveal(true);
  };

  const performMultiPull = (count: 10 | 100) => {
    setIsAnimating(true);
    setShowReveal(false);
    setShowDialog(true);

    setTimeout(
      async () => {
        const result = await gachaMultiPull(count);

        if (!result.success) {
          // Error toast is handled by useMutationWithOptimistic
          setIsAnimating(false);
          setShowDialog(false);
          return;
        }

        setPullResult({ ...result, isMulti: true });
        setIsAnimating(false);
        setTimeout(() => setShowReveal(true), 100);
      },
      count === 100 ? 1200 : 800
    );
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setShowReveal(false);
    setIsAnimating(false);
    setIsAnticipating(false);
    setRevealTier(0);
    setPullResult(null);
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
      {/* Compact pull interface */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Credits display */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xl font-bold font-mono tabular-nums text-amber-400">
                {state.ship.totalCurrency.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <div className="text-[10px] text-slate-500 font-mono">
                COST: <span className="text-slate-400">{PULL_COST}</span>
                {researchDiscount < 1 && (
                  <span className="text-emerald-400 ml-1">
                    (-{Math.round((1 - researchDiscount) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pull buttons row */}
          <div className="flex items-center gap-2">
            <PullButton
              onClick={performPull}
              disabled={!canAffordSingle || isPulling || isAnimating}
              isPulling={isPulling || isAnimating}
              cost={PULL_COST}
              multiplier={1}
              highlight={highlightPullButton && canAffordSingle}
            />
            <PullButton
              onClick={() => performMultiPull(10)}
              disabled={!canAfford10 || isPulling || isAnimating}
              isPulling={isPulling || isAnimating}
              cost={PULL_10_COST}
              multiplier={10}
            />
            <PullButton
              onClick={() => performMultiPull(100)}
              disabled={!canAfford100 || isPulling || isAnimating}
              isPulling={isPulling || isAnimating}
              cost={PULL_100_COST}
              multiplier={100}
            />

            {/* Drop rates button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDropRates(true)}
                    className="h-10 w-10 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View drop rates</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Luck bonus indicator */}
        {state.prestige.bonusLevels['luckyPulls'] > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Badge variant="tier2" className="text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" />+{state.prestige.bonusLevels['luckyPulls'] * 2}%
              LUCK
            </Badge>
          </div>
        )}
      </div>

      {/* Drop Rates Modal */}
      <Dialog open={showDropRates} onOpenChange={setShowDropRates}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <Target className="w-5 h-5 text-cyan-400" />
              DROP_RATES
            </DialogTitle>
            <DialogDescription className="font-mono text-slate-500">
              // Gacha pull probabilities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rate percentages */}
            <div className="grid grid-cols-3 gap-3">
              <RateCard
                label="FODDER"
                rate={GACHA_CONFIG.DROP_RATES.FODDER * 100}
                reward="Essence"
                color="rgb(168 85 247)"
              />
              <RateCard
                label="COMMON"
                rate={GACHA_CONFIG.DROP_RATES.COMMON * 100}
                reward="T1 Seed"
                color="rgb(107 114 128)"
              />
              <RateCard
                label="UNCOMMON"
                rate={GACHA_CONFIG.DROP_RATES.UNCOMMON * 100}
                reward="T2 Seed"
                color="rgb(34 197 94)"
              />
            </div>

            {/* Tier legend */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs font-mono text-slate-400 mb-2">SEED_TIERS</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(seedTiers).map(([tier, data]) => (
                  <div
                    key={tier}
                    className="text-center p-2 rounded bg-slate-800/80 border border-slate-700/30"
                  >
                    <Badge
                      variant={getTierBadgeVariant(Number(tier))}
                      className="w-full justify-center mb-1 text-[10px]"
                    >
                      T{tier}
                    </Badge>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{data.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Luck bonus info */}
            {state.prestige.bonusLevels['luckyPulls'] > 0 && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400 font-mono">
                    +{state.prestige.bonusLevels['luckyPulls'] * 2}% Luck Bonus Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Higher chance for rare seeds from prestige upgrade
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pull Result Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent
          className={cn(
            'bg-slate-900 border-slate-700',
            pullResult && 'isMulti' in pullResult && pullResult.isMulti
              ? 'sm:max-w-lg max-h-[85vh]'
              : 'sm:max-w-md'
          )}
        >
          {/* Pulling Animation */}
          {isAnimating && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>Pulling seeds...</DialogTitle>
              </DialogHeader>
              <div className="py-12 text-center">
                <motion.div
                  className="relative mx-auto w-24 h-24 mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-cyan-400" />
                  </div>
                </motion.div>
                <p className="text-lg font-mono text-cyan-400 animate-pulse">// PULLING...</p>
              </div>
            </>
          )}

          {!isAnimating && pullResult && 'error' in pullResult ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-400 font-mono">
                  <AlertCircle className="w-5 h-5" />
                  ERROR
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="font-mono text-sm">{pullResult.error}</p>
              </div>
            </>
          ) : pullResult && 'isMulti' in pullResult && pullResult.isMulti ? (
            // Multi-pull results
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono">
                  <Sparkles className="w-5 h-5 text-cyan-400" />x{pullResult.items.length} PULL
                  COMPLETE
                </DialogTitle>
                <DialogDescription className="font-mono text-slate-500">
                  // {pullResult.items.length} items acquired
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {pullResult.items.map((item, index) =>
                    isSeed(item) ? (
                      <motion.div
                        key={item.instanceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="rounded-lg overflow-hidden border border-slate-700/50"
                        style={getTierStyles(item.tier)}
                      >
                        <div className="p-3 flex items-center gap-3">
                          <SeedIcon seed={item} size={32} />
                          <div className="flex-1">
                            <h3 className="font-semibold capitalize text-sm">{item.name}</h3>
                            <Badge variant={getTierBadgeVariant(item.tier)} className="text-[10px]">
                              {seedTiers[item.tier as keyof typeof seedTiers]?.name || 'Unknown'} (T
                              {item.tier})
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            x{item.productionMultiplier || 1}
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`fodder-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">SEED_ESSENCE</p>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </ScrollArea>

              <Button
                onClick={handleCloseDialog}
                className="w-full mt-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono"
              >
                CONTINUE
              </Button>
            </>
          ) : pullResult && 'item' in pullResult ? (
            // Single pull result with tier-based reveal animation
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  {showReveal ? 'SEED ACQUIRED' : 'REVEALING...'}
                </DialogTitle>
                <DialogDescription className="font-mono text-slate-500">
                  {showReveal ? '// New seed from gacha system' : '// Determining rarity...'}
                </DialogDescription>
              </DialogHeader>

              <GachaReveal
                tier={revealTier}
                onRevealReady={handleRevealReady}
                isActive={isAnticipating || showReveal}
              >
                {isSeed(pullResult.item) ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={showReveal ? { scale: 1, opacity: 1 } : {}}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="rounded-lg overflow-hidden border-2"
                    style={{
                      ...getTierStyles(pullResult.item.tier),
                      boxShadow: `0 0 30px ${getTierStyles(pullResult.item.tier).borderColor}40`,
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg capitalize">{pullResult.item.name}</h3>
                          <Badge
                            variant={getTierBadgeVariant(pullResult.item.tier)}
                            className="mt-1"
                          >
                            {seedTiers[pullResult.item.tier as keyof typeof seedTiers]?.name ||
                              'Unknown'}{' '}
                            (T{pullResult.item.tier})
                          </Badge>
                        </div>
                        <SeedIcon seed={pullResult.item} size={56} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded bg-slate-800/50 border border-slate-700/30">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">
                            Production
                          </span>
                          <p className="font-bold font-mono tabular-nums text-lg">
                            x{pullResult.item.productionMultiplier || 1}
                          </p>
                        </div>
                        <div className="p-3 rounded bg-slate-800/50 border border-slate-700/30">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">
                            Tier
                          </span>
                          <p className="font-bold font-mono tabular-nums text-lg">
                            {pullResult.item.tier}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={showReveal ? { scale: 1, opacity: 1 } : {}}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center"
                  >
                    <p className="text-lg font-medium">{pullResult.item.name}</p>
                    <p className="text-sm text-slate-500 font-mono mt-1">
                      // Added to seed essence
                    </p>
                  </motion.div>
                )}
              </GachaReveal>

              {showReveal && (
                <Button
                  onClick={handleCloseDialog}
                  className="w-full mt-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono"
                >
                  CONTINUE
                </Button>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Pull button component
const PullButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isPulling?: boolean;
  cost: number;
  multiplier: number;
  highlight?: boolean;
}> = ({ onClick, disabled, cost, multiplier, highlight, isPulling }) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'relative gap-1.5 font-mono h-10 px-3',
      'bg-gradient-to-b from-purple-600/80 to-indigo-700/80',
      'hover:from-purple-500/80 hover:to-indigo-600/80',
      'border border-purple-500/30 hover:border-purple-400/50',
      'text-white shadow-lg shadow-purple-500/20',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      highlight && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 animate-pulse'
    )}
  >
    {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
    <span className="font-bold">x{multiplier}</span>
    <span className="text-[10px] opacity-80 tabular-nums">{cost.toLocaleString()}</span>
  </Button>
);

// Rate display card
const RateCard: React.FC<{
  label: string;
  rate: number;
  reward: string;
  color: string;
}> = ({ label, rate, reward, color }) => (
  <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center">
    <p className="text-xl font-bold font-mono tabular-nums" style={{ color }}>
      {rate.toFixed(0)}%
    </p>
    <p className="text-[10px] text-slate-500 font-mono uppercase">{label}</p>
    <p className="text-[10px] font-mono mt-1" style={{ color }}>
      {reward}
    </p>
  </div>
);

export default SeedGacha;
