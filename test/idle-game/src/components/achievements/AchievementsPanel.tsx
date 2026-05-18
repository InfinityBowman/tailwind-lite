/**
 * Achievements Panel Component
 * Displays achievements with progress tracking and category filters
 */

import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { useToast } from '@/components/ui/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Trophy, Gift, Check, Lock, Sparkles, Coins, FlaskConical, Gem, Medal } from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIER_COLORS,
  type AchievementDefinition,
  type AchievementCategory,
  type AchievementRewardType,
  type AchievementTier,
} from '../../game/config/achievements';
import { cn } from '@/lib/utils';

const RewardIcon: React.FC<{ type: AchievementRewardType; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'credits':
      return <Coins className={`${className} text-yellow-400`} />;
    case 'essence':
      return <Sparkles className={`${className} text-blue-400`} />;
    case 'crystals':
      return <Gem className={`${className} text-purple-400`} />;
    case 'refinedEssence':
      return <FlaskConical className={`${className} text-purple-400`} />;
    case 'title':
      return <Trophy className={`${className} text-amber-400`} />;
    default:
      return <Gift className={className} />;
  }
};

const RewardBadge: React.FC<{ type: AchievementRewardType; amount: number }> = ({
  type,
  amount,
}) => {
  const colorClasses = {
    credits: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    essence: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    crystals: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    refinedEssence: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    title: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const labels = {
    credits: 'Credits',
    essence: 'Seed Essence',
    crystals: 'Crystals',
    refinedEssence: 'Refined Essence',
    title: 'Title',
  };

  return (
    <Badge variant="outline" className={`gap-1.5 ${colorClasses[type]} border`}>
      <RewardIcon type={type} className="w-3 h-3" />
      {amount} {labels[type]}
    </Badge>
  );
};

const TierBadge: React.FC<{ tier: AchievementTier }> = ({ tier }) => {
  if (tier === 'none') return null;

  const tierConfig: Record<
    Exclude<AchievementTier, 'none'>,
    { label: string; iconColor: string }
  > = {
    bronze: { label: 'Bronze', iconColor: 'text-amber-600' },
    silver: { label: 'Silver', iconColor: 'text-gray-300' },
    gold: { label: 'Gold', iconColor: 'text-yellow-400' },
  };

  const config = tierConfig[tier];

  return (
    <Badge variant="outline" className={cn('text-xs gap-1', ACHIEVEMENT_TIER_COLORS[tier])}>
      <Medal className={cn('w-3 h-3', config.iconColor)} />
      {config.label}
    </Badge>
  );
};

interface AchievementCardProps {
  achievement: AchievementDefinition;
  progress: number;
  unlocked: boolean;
  claimed: boolean;
  percent: number;
  visible: boolean;
  onClaim: () => void;
  justUnlocked?: boolean;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  unlocked,
  claimed,
  percent,
  visible,
  onClaim,
  justUnlocked = false,
}) => {
  let borderColor = 'border-border/50';
  let bgColor = 'bg-secondary/30';

  if (claimed) {
    borderColor = 'border-muted/50';
    bgColor = 'bg-muted/20';
  } else if (unlocked) {
    borderColor = 'border-green-500/70';
    bgColor = 'bg-green-500/10';
  } else if (!visible) {
    borderColor = 'border-muted/30';
    bgColor = 'bg-muted/10';
  }

  // Hidden achievement that isn't unlocked
  if (!visible) {
    return (
      <Card className={`${bgColor} ${borderColor} border opacity-60`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-muted-foreground">Hidden Achievement</h4>
              <p className="text-xs text-muted-foreground/70">
                Keep playing to discover this achievement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        `${bgColor} ${borderColor} border transition-all duration-300`,
        justUnlocked && 'animate-pulse ring-2 ring-green-500/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              unlocked ? 'bg-primary/20' : 'bg-muted/50 grayscale'
            )}
          >
            <DynamicIcon name={achievement.icon} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{achievement.name}</h4>
              <TierBadge tier={achievement.tier} />
              {claimed && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Check className="w-3 h-3" />
                  Claimed
                </Badge>
              )}
              {unlocked && !claimed && (
                <Badge variant="tier2" className="gap-1 text-xs animate-pulse">
                  <Gift className="w-3 h-3" />
                  Claimable
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="tabular-nums font-medium">
                {Math.min(progress, achievement.target).toLocaleString()} /{' '}
                {achievement.target.toLocaleString()}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
          <RewardBadge type={achievement.reward.type} amount={achievement.reward.amount} />
        </div>

        {unlocked && !claimed && (
          <Button onClick={onClaim} variant="success" size="sm" className="w-full gap-2">
            <Gift className="w-4 h-4" />
            Claim Reward
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const CategoryTab: React.FC<{
  category: AchievementCategory;
  achievements: ReturnType<typeof useGameContext>['getAchievementsWithProgress'];
  onClaim: (id: string) => void;
  recentUnlocks: Set<string>;
}> = ({ category, achievements, onClaim, recentUnlocks }) => {
  const categoryAchievements = achievements(category);
  const unlocked = categoryAchievements.filter(a => a.unlocked).length;
  const total = categoryAchievements.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DynamicIcon
            name={ACHIEVEMENT_CATEGORIES[category].icon}
            className={cn('w-5 h-5', ACHIEVEMENT_CATEGORIES[category].color)}
          />
          <span className={`font-medium ${ACHIEVEMENT_CATEGORIES[category].color}`}>
            {ACHIEVEMENT_CATEGORIES[category].name}
          </span>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {unlocked} / {total}
        </span>
      </div>

      <Progress value={(unlocked / total) * 100} className="h-2" />

      <ScrollArea className="h-[450px] pr-4">
        <div className="grid grid-cols-1 gap-3">
          {categoryAchievements
            .sort((a, b) => {
              // Sort: claimable first, then in-progress, then locked, then claimed
              if (a.unlocked && !a.claimed && !(b.unlocked && !b.claimed)) return -1;
              if (b.unlocked && !b.claimed && !(a.unlocked && !a.claimed)) return 1;
              if (a.unlocked && !b.unlocked) return -1;
              if (b.unlocked && !a.unlocked) return 1;
              if (!a.claimed && b.claimed) return -1;
              if (!b.claimed && a.claimed) return 1;
              return 0;
            })
            .map(({ achievement, progress, unlocked, claimed, percent, visible }) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={progress}
                unlocked={unlocked}
                claimed={claimed}
                percent={percent}
                visible={visible}
                onClaim={() => onClaim(achievement.id)}
                justUnlocked={recentUnlocks.has(achievement.id)}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const AchievementsPanel: React.FC = () => {
  const {
    claimAchievement,
    getClaimableAchievementCount,
    getUnlockedAchievementCount,
    getTotalAchievementCount,
    getAchievementsWithProgress,
    getAchievementCategoryStats,
  } = useGameContext();
  const { addToast } = useToast();

  const [recentUnlocks, setRecentUnlocks] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('production');

  const claimableCount = getClaimableAchievementCount();
  const unlockedCount = getUnlockedAchievementCount();
  const totalCount = getTotalAchievementCount();
  const categoryStats = getAchievementCategoryStats();

  const handleClaim = async (achievementId: string) => {
    // Find the achievement first for the toast message
    const achievementData = getAchievementsWithProgress().find(
      a => a.achievement.id === achievementId
    );
    const result = await claimAchievement(achievementId);

    if (result.success && result.reward && achievementData) {
      const reward = result.reward;
      const rewardText =
        reward.type === 'title' ? `Title: "${reward.amount}"` : `+${reward.amount} ${reward.type}`;
      addToast(`🏆 ${achievementData.achievement.name} — ${rewardText}`, 'success', 4000);
    } else if (!result.success) {
      console.warn('Failed to claim achievement:', result.error);
    }
  };

  const handleClaimAll = async () => {
    const allAchievements = getAchievementsWithProgress();
    const claimable = allAchievements.filter(a => a.unlocked && !a.claimed);
    let totalClaimed = 0;

    for (const a of claimable) {
      const result = await claimAchievement(a.achievement.id);
      if (result.success) totalClaimed++;
    }

    if (totalClaimed > 0) {
      addToast(
        `🎉 Claimed ${totalClaimed} achievement${totalClaimed > 1 ? 's' : ''}!`,
        'success',
        4000
      );
    }
  };

  // Track recent unlocks for animation
  useEffect(() => {
    const allAchievements = getAchievementsWithProgress();
    const newUnlocks = allAchievements
      .filter(a => a.unlocked && !a.claimed)
      .map(a => a.achievement.id);

    if (newUnlocks.length > 0) {
      setRecentUnlocks(new Set(newUnlocks));
      // Clear animation after 3 seconds
      const timer = setTimeout(() => setRecentUnlocks(new Set()), 3000);
      return () => clearTimeout(timer);
    }
  }, [getAchievementsWithProgress]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-amber-400" />
              Achievements
              {claimableCount > 0 && (
                <Badge variant="tier2" className="gap-1 animate-pulse">
                  <Gift className="w-3 h-3" />
                  {claimableCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Permanent accomplishments that persist through prestige
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {claimableCount > 0 && (
              <Button onClick={handleClaimAll} variant="success" size="sm" className="gap-2">
                <Gift className="w-4 h-4" />
                Claim All ({claimableCount})
              </Button>
            )}
            <Badge variant="secondary" className="tabular-nums text-sm">
              {unlockedCount} / {totalCount}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overall progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="tabular-nums font-medium">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </span>
          </div>
          <Progress value={(unlockedCount / totalCount) * 100} className="h-3" />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categoryStats.map(stat => (
            <Button
              key={stat.category}
              variant={activeCategory === stat.category ? 'default' : 'outline'}
              size="sm"
              className={cn('gap-1.5', activeCategory !== stat.category && 'opacity-70')}
              onClick={() => setActiveCategory(stat.category)}
            >
              <DynamicIcon name={stat.icon} className="w-4 h-4" />
              <span>{stat.name}</span>
              <Badge
                variant={stat.unlocked === stat.total ? 'tier2' : 'secondary'}
                className="ml-1 tabular-nums"
              >
                {stat.unlocked}/{stat.total}
              </Badge>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Category content */}
        <CategoryTab
          category={activeCategory}
          achievements={getAchievementsWithProgress}
          onClaim={handleClaim}
          recentUnlocks={recentUnlocks}
        />
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;
