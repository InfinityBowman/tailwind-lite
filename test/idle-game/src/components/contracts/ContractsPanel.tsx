/**
 * Contracts Panel Component
 *
 * Displays daily and weekly contracts with progress tracking.
 * Contracts give players achievable goals with rewards to fill the
 * "dopamine drought" in the 5-20 minute range.
 */

import React, { useMemo } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Clock,
  Gift,
  Check,
  Calendar,
  CalendarDays,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { RewardBadge, type RewardType } from '@/components/ui/RewardDisplay';
import type { Contract, ContractTier } from '../../game/systems/ContractSystem';
import { CONTRACT_CONFIG } from '../../game/systems/ContractSystem';

// ─────────────────────────────────────────────────────────────────────────────
// Time Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate time until next daily reset (5 AM UTC)
 */
function getTimeUntilDailyReset(): string {
  const now = new Date();
  const resetHour = CONTRACT_CONFIG.refreshHourUTC; // 5 AM UTC

  // Create next reset time
  const nextReset = new Date(now);
  nextReset.setUTCHours(resetHour, 0, 0, 0);

  // If we're past today's reset, move to tomorrow
  if (now.getUTCHours() >= resetHour) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  }

  const diffMs = nextReset.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate time until next weekly reset (Sunday 5 AM UTC)
 */
function getTimeUntilWeeklyReset(): string {
  const now = new Date();
  const resetHour = CONTRACT_CONFIG.refreshHourUTC;

  // Find next Sunday
  const nextReset = new Date(now);
  const daysUntilSunday = (7 - now.getUTCDay()) % 7;

  // If it's Sunday but past reset time, wait until next Sunday
  if (daysUntilSunday === 0 && now.getUTCHours() >= resetHour) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 7);
  } else {
    nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilSunday);
  }

  nextReset.setUTCHours(resetHour, 0, 0, 0);

  const diffMs = nextReset.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier Badge
// ─────────────────────────────────────────────────────────────────────────────

const TierBadge: React.FC<{ tier: ContractTier }> = ({ tier }) => {
  const tierStyles: Record<ContractTier, string> = {
    bronze: 'bg-amber-700/30 text-amber-400 border-amber-600/50',
    silver: 'bg-slate-400/20 text-slate-300 border-slate-400/50',
    gold: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
  };

  return (
    <Badge variant="outline" className={`${tierStyles[tier]} border capitalize text-xs`}>
      {tier}
    </Badge>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Contract Card
// ─────────────────────────────────────────────────────────────────────────────

interface ContractCardProps {
  contract: Contract;
  onClaim: () => void;
}

const ContractCard: React.FC<ContractCardProps> = ({ contract, onClaim }) => {
  const percent = Math.min(100, (contract.progress / contract.target) * 100);

  // Card styling based on state
  let borderColor = 'border-border/50';
  let bgColor = 'bg-secondary/30';

  if (contract.claimed) {
    borderColor = 'border-muted/50';
    bgColor = 'bg-muted/20';
  } else if (contract.completed) {
    borderColor = 'border-green-500/70';
    bgColor = 'bg-green-500/10';
  }

  // Collect reward types for display
  const rewards: { type: RewardType; amount: number }[] = [];
  if (contract.reward.credits) rewards.push({ type: 'credits', amount: contract.reward.credits });
  if (contract.reward.crystals)
    rewards.push({ type: 'crystals', amount: contract.reward.crystals });
  if (contract.reward.essence) rewards.push({ type: 'essence', amount: contract.reward.essence });
  if (contract.reward.refinedEssence)
    rewards.push({ type: 'refinedEssence', amount: contract.reward.refinedEssence });

  return (
    <Card className={`${bgColor} ${borderColor} border transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Description + Progress */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <TierBadge tier={contract.tier} />
              {contract.claimed && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Check className="w-3 h-3" />
                  Claimed
                </Badge>
              )}
            </div>
            <p
              className={`text-sm ${contract.claimed ? 'text-muted-foreground' : 'text-foreground'}`}
            >
              {contract.description}
            </p>

            {/* Progress bar */}
            <div className="space-y-1">
              <Progress value={percent} className={`h-2 ${contract.claimed ? 'opacity-50' : ''}`} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {contract.progress.toLocaleString()} / {contract.target.toLocaleString()}
                </span>
                <span>{Math.floor(percent)}%</span>
              </div>
            </div>

            {/* Rewards */}
            <div className="flex flex-wrap gap-1.5">
              {rewards.map(r => (
                <RewardBadge key={r.type} type={r.type} amount={r.amount} />
              ))}
            </div>
          </div>

          {/* Right: Claim button */}
          <div className="shrink-0">
            {contract.completed && !contract.claimed ? (
              <Button
                size="sm"
                onClick={onClaim}
                className="gap-1.5 bg-green-600 hover:bg-green-700"
              >
                <Gift className="w-4 h-4" />
                Claim
              </Button>
            ) : contract.claimed ? (
              <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Clock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────

export const ContractsPanel: React.FC = () => {
  const { state, claimContract, claimAllContracts } = useGameContext();
  const contractState = state.contracts;

  // Counts
  const dailyCompleted = contractState.dailyContracts.filter(c => c.completed).length;
  const dailyTotal = contractState.dailyContracts.length;
  const dailyClaimable = contractState.dailyContracts.filter(c => c.completed && !c.claimed).length;

  const weeklyCompleted = contractState.weeklyContracts.filter(c => c.completed).length;
  const weeklyTotal = contractState.weeklyContracts.length;
  const weeklyClaimable = contractState.weeklyContracts.filter(
    c => c.completed && !c.claimed
  ).length;

  const totalClaimable = dailyClaimable + weeklyClaimable;

  // Memoize reset times (recalculate every render since time passes)
  const dailyResetTime = useMemo(() => getTimeUntilDailyReset(), []);
  const weeklyResetTime = useMemo(() => getTimeUntilWeeklyReset(), []);

  const handleClaimAll = () => {
    claimAllContracts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-7 h-7" />
            Contracts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Complete objectives to earn rewards</p>
        </div>

        {/* Stats + Claim All */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Completed</div>
            <div className="text-lg font-bold">
              {contractState.totalContractsCompleted.toLocaleString()}
            </div>
          </div>
          {totalClaimable > 0 && (
            <Button onClick={handleClaimAll} className="gap-2">
              <Gift className="w-4 h-4" />
              Claim All ({totalClaimable})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Daily / Weekly */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="w-4 h-4" />
            Daily
            {dailyClaimable > 0 && (
              <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-300">
                {dailyClaimable}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Weekly
            {weeklyClaimable > 0 && (
              <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-300">
                {weeklyClaimable}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Daily Tab */}
        <TabsContent value="daily" className="mt-4">
          {/* Reset timer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-secondary/30 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Resets in: </span>
            <span className="font-medium text-foreground tabular-nums">{dailyResetTime}</span>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daily Contracts</CardTitle>
                <Badge variant="outline">
                  {dailyCompleted} / {dailyTotal} Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {contractState.dailyContracts.map(contract => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onClaim={() => claimContract(contract.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="mt-4">
          {/* Reset timer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-secondary/30 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Resets in: </span>
            <span className="font-medium text-foreground tabular-nums">{weeklyResetTime}</span>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Weekly Contracts</CardTitle>
                <Badge variant="outline">
                  {weeklyCompleted} / {weeklyTotal} Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {contractState.weeklyContracts.map(contract => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      onClaim={() => claimContract(contract.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lifetime Stats */}
      <Card className="bg-secondary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Lifetime Contract Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {contractState.totalRewardsEarned.credits && (
              <RewardBadge type="credits" amount={contractState.totalRewardsEarned.credits} />
            )}
            {contractState.totalRewardsEarned.crystals && (
              <RewardBadge type="crystals" amount={contractState.totalRewardsEarned.crystals} />
            )}
            {contractState.totalRewardsEarned.essence && (
              <RewardBadge type="essence" amount={contractState.totalRewardsEarned.essence} />
            )}
            {contractState.totalRewardsEarned.refinedEssence && (
              <RewardBadge
                type="refinedEssence"
                amount={contractState.totalRewardsEarned.refinedEssence}
              />
            )}
            {!contractState.totalRewardsEarned.credits &&
              !contractState.totalRewardsEarned.crystals &&
              !contractState.totalRewardsEarned.essence &&
              !contractState.totalRewardsEarned.refinedEssence && (
                <span className="text-muted-foreground text-sm">
                  No rewards claimed yet. Complete contracts to start earning!
                </span>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractsPanel;
