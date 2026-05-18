/**
 * Quests Panel Component
 * Displays daily and weekly quests with progress tracking
 */

import React from 'react';
import { useGameContext } from '../../contexts/GameEngineContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Target,
  Clock,
  Gift,
  Check,
  Sparkles,
  Coins,
  FlaskConical,
  Gem,
  Flame,
} from 'lucide-react';
import type { QuestDefinition, RewardType } from '../../game/config/quests';
import { DailyChallengePanel } from '../events';
import { OnboardingHint, GAME_HINTS } from '../ui';

const RewardIcon: React.FC<{ type: RewardType; className?: string }> = ({
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
    default:
      return <Gift className={className} />;
  }
};

const RewardBadge: React.FC<{ type: RewardType; amount: number }> = ({ type, amount }) => {
  const colorClasses = {
    credits: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    essence: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    crystals: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    refinedEssence: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  const labels = {
    credits: 'Credits',
    essence: 'Seed Essence',
    crystals: 'Crystals',
    refinedEssence: 'Refined Essence',
  };

  return (
    <Badge variant="outline" className={`gap-1.5 ${colorClasses[type]} border`}>
      <RewardIcon type={type} className="w-3 h-3" />
      {amount} {labels[type]}
    </Badge>
  );
};

interface QuestCardProps {
  quest: QuestDefinition;
  progress: number;
  claimed: boolean;
  complete: boolean;
  percent: number;
  onClaim: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  progress,
  claimed,
  complete,
  percent,
  onClaim,
}) => {
  let borderColor = 'border-border/50';
  let bgColor = 'bg-secondary/30';

  if (claimed) {
    borderColor = 'border-muted/50';
    bgColor = 'bg-muted/20';
  } else if (complete) {
    borderColor = 'border-green-500/70';
    bgColor = 'bg-green-500/10';
  }

  return (
    <Card className={`${bgColor} ${borderColor} border transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              {quest.name}
              {claimed && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Check className="w-3 h-3" />
                  Claimed
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
          </div>
          <RewardBadge type={quest.reward.type} amount={quest.reward.amount} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="tabular-nums font-medium">
              {Math.min(progress, quest.target)} / {quest.target}
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        {complete && !claimed && (
          <Button onClick={onClaim} variant="success" size="sm" className="w-full mt-3 gap-2">
            <Gift className="w-4 h-4" />
            Claim Reward
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const QuestsPanel: React.FC = () => {
  const {
    state,
    claimQuest,
    getDailyQuests,
    getWeeklyQuests,
    formatQuestResetTime,
    getDailyChallengeState,
    claimDailyChallenge,
    claimAllDailyChallenges,
    getUnclaimedChallengeCount,
    dismissHint,
    isHintDismissed,
  } = useGameContext();

  const dailyQuests = getDailyQuests();
  const weeklyQuests = getWeeklyQuests();
  const challengeState = getDailyChallengeState();

  const dailyClaimable = dailyQuests.filter(q => q.complete && !q.claimed).length;
  const weeklyClaimable = weeklyQuests.filter(q => q.complete && !q.claimed).length;
  const challengeClaimable = getUnclaimedChallengeCount();
  const totalClaimable = dailyClaimable + weeklyClaimable + challengeClaimable;

  const handleClaim = async (questId: string) => {
    const result = await claimQuest(questId);
    if (!result.success) {
      console.warn('Failed to claim quest:', result.error);
    }
  };

  const handleClaimAll = async () => {
    // Claim all claimable quests
    const questsToClaim = [...dailyQuests, ...weeklyQuests].filter(q => q.complete && !q.claimed);
    for (const q of questsToClaim) {
      await claimQuest(q.quest.id);
    }
    // Also claim all challenges
    if (challengeClaimable > 0) {
      await claimAllDailyChallenges();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-emerald-400" />
              Quests
              {totalClaimable > 0 && (
                <Badge variant="tier2" className="gap-1">
                  <Gift className="w-3 h-3" />
                  {totalClaimable}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">Complete quests to earn rewards</CardDescription>
          </div>
          {totalClaimable > 0 && (
            <Button onClick={handleClaimAll} variant="success" size="sm" className="gap-2">
              <Gift className="w-4 h-4" />
              Claim All ({totalClaimable})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="mb-4 h-10">
            <TabsTrigger value="challenges" className="gap-2">
              <Flame className="w-4 h-4" />
              Challenges
              {challengeClaimable > 0 && (
                <Badge variant="tier2" className="ml-1 text-xs tabular-nums">
                  {challengeClaimable}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              Daily
              {dailyClaimable > 0 && (
                <Badge variant="tier2" className="ml-1 text-xs tabular-nums">
                  {dailyClaimable}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              Weekly
              {weeklyClaimable > 0 && (
                <Badge variant="tier2" className="ml-1 text-xs tabular-nums">
                  {weeklyClaimable}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            {/* Onboarding hint for daily challenges - only show if player has never completed any
                (totalChallengesCompleted tracks lifetime completions, so this won't re-trigger on streak reset) */}
            {challengeState.totalChallengesCompleted === 0 &&
              !isHintDismissed(GAME_HINTS.dailyChallenges.id) && (
                <OnboardingHint
                  {...GAME_HINTS.dailyChallenges}
                  onDismiss={dismissHint}
                  dismissed={isHintDismissed(GAME_HINTS.dailyChallenges.id)}
                />
              )}
            <DailyChallengePanel
              state={challengeState}
              onClaimChallenge={claimDailyChallenge}
              onClaimAll={claimAllDailyChallenges}
            />
          </TabsContent>

          <TabsContent value="daily">
            {/* Reset timer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-secondary/30 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Resets in: </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatQuestResetTime(state.quests.dailyResetTime)}
              </span>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-3">
                {dailyQuests.map(({ quest, progress, claimed, complete, percent }) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    progress={progress}
                    claimed={claimed}
                    complete={complete}
                    percent={percent}
                    onClaim={() => handleClaim(quest.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Progress summary */}
            <Separator className="my-4" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Daily Progress</span>
              <span className="tabular-nums">
                <span className="text-foreground font-medium">
                  {dailyQuests.filter(q => q.complete).length}
                </span>
                <span className="text-muted-foreground"> / {dailyQuests.length}</span>
              </span>
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            {/* Reset timer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-secondary/30 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Resets in: </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatQuestResetTime(state.quests.weeklyResetTime)}
              </span>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-3">
                {weeklyQuests.map(({ quest, progress, claimed, complete, percent }) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    progress={progress}
                    claimed={claimed}
                    complete={complete}
                    percent={percent}
                    onClaim={() => handleClaim(quest.id)}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Progress summary */}
            <Separator className="my-4" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Weekly Progress</span>
              <span className="tabular-nums">
                <span className="text-foreground font-medium">
                  {weeklyQuests.filter(q => q.complete).length}
                </span>
                <span className="text-muted-foreground"> / {weeklyQuests.length}</span>
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QuestsPanel;
