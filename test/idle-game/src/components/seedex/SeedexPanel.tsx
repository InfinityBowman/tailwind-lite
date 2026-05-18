/**
 * SeedexPanel - Collection tracking UI ("Gotta Catch 'Em All")
 *
 * Shows discovered seeds, tier progression, and rewards.
 */

import { useState, useMemo, useCallback } from 'react';
import { useGame } from '@/contexts/GameEngineContext';
import { useConvexRewards } from '@/hooks/useConvexRewards';
import { ALL_SEED_IDS, SEED_TYPES, SEED_FAMILY_INFO, type SeedFamily } from '@/game/config/seeds';
import { SEED_TIERS, MAX_SEED_TIER } from '@/game/config/balance';
import {
  SEEDEX_REWARDS,
  getAvailableRewards,
  getCompletionPercentage,
  getTierCompletionStats,
  type SeedexReward,
} from '@/game/systems/SeedexSystem';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Gift, Lock, Sparkles, BookOpen, Sprout } from 'lucide-react';

type TabValue = 'collection' | 'rewards';

export function SeedexPanel() {
  const { state } = useGame();
  const { claimSeedexReward } = useConvexRewards(state);
  const [activeTab, setActiveTab] = useState<TabValue>('collection');

  // Get seedex data from state (with safe defaults for old saves)
  const seedexState = state.seedex || {
    entries: {},
    familyProgress: {},
    totalDiscovered: 0,
    totalPossible: ALL_SEED_IDS.length,
    claimedRewards: [],
  };

  const entries = seedexState.entries;
  const familyProgress = seedexState.familyProgress;
  const completionPercentage = getCompletionPercentage(seedexState);
  const tierStats = getTierCompletionStats(seedexState);
  const availableRewards = getAvailableRewards(seedexState);
  const totalDiscovered = seedexState.totalDiscovered;
  const totalPossible = seedexState.totalPossible;

  // Group seeds by family
  const seedsByFamily = useMemo(() => {
    const groups: Record<SeedFamily, string[]> = {
      bio: [],
      solar: [],
      lunar: [],
      crystal: [],
      primal: [],
      void: [],
    };

    for (const seedId of ALL_SEED_IDS) {
      const family = SEED_TYPES[seedId].family;
      groups[family].push(seedId);
    }

    return groups;
  }, []);

  const handleClaimReward = useCallback(
    (rewardId: string) => {
      claimSeedexReward(rewardId);
    },
    [claimSeedexReward]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
        {/* Header with overall progress */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-2xl">Seedex</CardTitle>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {totalDiscovered} / {totalPossible}
              </Badge>
            </div>
            <CardDescription>Track your seed collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Collection Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {/* Tier completion summary */}
            <div className="mt-4 grid grid-cols-6 gap-2">
              {Array.from({ length: MAX_SEED_TIER }, (_, i) => i + 1).map(tier => {
                const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
                return (
                  <Tooltip key={tier}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex flex-col items-center p-2 rounded-lg bg-black/30"
                        style={{ borderColor: tierData.color, borderWidth: '1px' }}
                      >
                        <span className="text-xs" style={{ color: tierData.color }}>
                          {tierData.name.substring(0, 3)}
                        </span>
                        <span className="font-bold">{tierStats[tier]}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {tierStats[tier]} seeds discovered at {tierData.name} tier
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Rewards
              {availableRewards.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {availableRewards.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-4 space-y-4">
            {/* Family sections */}
            {(Object.entries(seedsByFamily) as [SeedFamily, string[]][]).map(
              ([family, seedIds]) => {
                const familyInfo = SEED_FAMILY_INFO[family];
                const progress = familyProgress[family];

                return (
                  <Card key={family} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: familyInfo.color }}
                          />
                          <CardTitle className="text-lg">{familyInfo.name} Family</CardTitle>
                          {progress.complete && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {progress.discovered} / {progress.total}
                        </span>
                      </div>
                      <CardDescription>{familyInfo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {seedIds.map(seedId => {
                          const entry = entries[seedId];
                          const seedInfo = SEED_TYPES[seedId];

                          return (
                            <SeedCard
                              key={seedId}
                              name={seedInfo.name.replace(' Seeds', '')}
                              discovered={entry?.discovered || false}
                              highestTier={entry?.highestTier || 0}
                              tiersDiscovered={entry?.tiersDiscovered || {}}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <RewardsSection
              availableRewards={availableRewards}
              allRewards={SEEDEX_REWARDS}
              onClaim={handleClaimReward}
              claimedRewardIds={state.seedex?.claimedRewards || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

interface SeedCardProps {
  name: string;
  discovered: boolean;
  highestTier: number;
  tiersDiscovered: Record<number, { firstDiscovered: number }>;
}

function SeedCard({ name, discovered, highestTier, tiersDiscovered }: SeedCardProps) {
  const tierData = highestTier > 0 ? SEED_TIERS[highestTier as keyof typeof SEED_TIERS] : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative p-3 rounded-lg border transition-all',
            discovered
              ? 'bg-card border-primary/30 hover:border-primary/50'
              : 'bg-muted/20 border-muted/30'
          )}
          style={tierData ? { borderColor: tierData.color + '50' } : undefined}
        >
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', discovered ? 'bg-primary/10' : 'bg-muted/30')}>
              {discovered ? (
                <Sprout className="h-6 w-6" style={{ color: tierData?.color || 'currentColor' }} />
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium text-sm truncate',
                  !discovered && 'text-muted-foreground/50'
                )}
              >
                {name}
              </p>
              {discovered && tierData && (
                <p className="text-xs" style={{ color: tierData.color }}>
                  {tierData.name}
                </p>
              )}
            </div>
          </div>

          {/* Tier progress dots */}
          {discovered && (
            <div className="flex gap-1 mt-2 justify-center">
              {Array.from({ length: MAX_SEED_TIER }, (_, i) => i + 1).map(tier => {
                const hasTier = tiersDiscovered[tier] !== undefined;
                const tierColor = SEED_TIERS[tier as keyof typeof SEED_TIERS].color;

                return (
                  <div
                    key={tier}
                    className={cn(
                      'w-2 h-2 rounded-full',
                      hasTier ? 'ring-1 ring-white/20' : 'bg-muted/30'
                    )}
                    style={hasTier ? { backgroundColor: tierColor } : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        {discovered ? (
          <div className="space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">
              Highest tier: {tierData?.name || 'None'}
            </p>
            <div className="text-xs text-muted-foreground">
              Tiers discovered:{' '}
              {Object.keys(tiersDiscovered)
                .map(t => SEED_TIERS[parseInt(t) as keyof typeof SEED_TIERS].name)
                .join(', ') || 'None'}
            </div>
          </div>
        ) : (
          <p>Not yet discovered</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface RewardsSectionProps {
  availableRewards: SeedexReward[];
  allRewards: SeedexReward[];
  onClaim: (rewardId: string) => void;
  claimedRewardIds: string[];
}

function RewardsSection({
  availableRewards,
  allRewards,
  onClaim,
  claimedRewardIds,
}: RewardsSectionProps) {
  // Group rewards by type
  const rewardGroups = useMemo(() => {
    const groups: Record<string, SeedexReward[]> = {
      'Seed Discovery': [],
      'Tier Milestones': [],
      'Family Collection': [],
      Mastery: [],
    };

    for (const reward of allRewards) {
      switch (reward.type) {
        case 'seed_discovery':
          groups['Seed Discovery'].push(reward);
          break;
        case 'tier_discovery':
          groups['Tier Milestones'].push(reward);
          break;
        case 'family_complete':
          groups['Family Collection'].push(reward);
          break;
        case 'tier_complete':
        case 'full_complete':
          groups['Mastery'].push(reward);
          break;
      }
    }

    return groups;
  }, [allRewards]);

  return (
    <div className="space-y-4">
      {availableRewards.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <CardTitle>Available Rewards</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {availableRewards.map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  status="available"
                  onClaim={() => onClaim(reward.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(rewardGroups).map(([groupName, rewards]) => (
        <Card key={groupName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {rewards.map(reward => {
                const isAvailable = availableRewards.some(r => r.id === reward.id);
                const claimed = claimedRewardIds.includes(reward.id);

                return (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    status={claimed ? 'claimed' : isAvailable ? 'available' : 'locked'}
                    onClaim={isAvailable ? () => onClaim(reward.id) : undefined}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface RewardCardProps {
  reward: SeedexReward;
  status: 'locked' | 'available' | 'claimed';
  onClaim?: () => void;
}

function RewardCard({ reward, status, onClaim }: RewardCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        status === 'available' && 'bg-yellow-900/20 border-yellow-500/30',
        status === 'claimed' && 'bg-green-900/10 border-green-500/20',
        status === 'locked' && 'bg-muted/10 border-muted/20'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            status === 'available' && 'bg-yellow-500/20',
            status === 'claimed' && 'bg-green-500/20',
            status === 'locked' && 'bg-muted/20'
          )}
        >
          {status === 'claimed' ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : status === 'available' ? (
            <Gift className="h-4 w-4 text-yellow-400" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
        <div>
          <p
            className={cn('font-medium text-sm', status === 'locked' && 'text-muted-foreground/50')}
          >
            {reward.name}
          </p>
          <p className="text-xs text-muted-foreground">{reward.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reward amounts */}
        <div className="flex gap-2 text-sm">
          {reward.reward.credits && (
            <span className="text-yellow-400">{reward.reward.credits}c</span>
          )}
          {reward.reward.crystals && (
            <span className="text-purple-400">{reward.reward.crystals} crystals</span>
          )}
          {reward.reward.essence && (
            <span className="text-green-400">{reward.reward.essence} essence</span>
          )}
        </div>

        {status === 'available' && onClaim && (
          <Button size="sm" onClick={onClaim}>
            Claim
          </Button>
        )}
      </div>
    </div>
  );
}
