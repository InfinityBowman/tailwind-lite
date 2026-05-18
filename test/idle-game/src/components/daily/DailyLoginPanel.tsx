/**
 * Daily Login Panel
 * Shows the 7-day reward calendar and claim button
 */

import React, { useMemo } from 'react';
import { Gift, Check, Star, Calendar, Coins, Gem, Sprout, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getWeeklyRewardsPreview,
  type DailyLoginState,
  type DailyLoginReward,
} from '../../game/systems/DailyLoginSystem';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { formatNumber } from '../../game/utils/numberFormat';

// Resource icons - using Lucide components instead of emojis
const REWARD_ICONS: Record<DailyLoginReward['type'], React.ReactNode> = {
  credits: <Coins className="w-6 h-6 text-yellow-400" />,
  crystals: <Gem className="w-6 h-6 text-purple-400" />,
  essence: <Sprout className="w-6 h-6 text-green-400" />,
  refinedEssence: <Sparkles className="w-6 h-6 text-cyan-400" />,
};

interface DailyLoginPanelProps {
  state: DailyLoginState;
  canClaim: boolean;
  onClaim: () => void;
  className?: string;
}

const DailyLoginPanel: React.FC<DailyLoginPanelProps> = ({
  state,
  canClaim,
  onClaim,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const rewardsPreview = useMemo(
    () => getWeeklyRewardsPreview(state.currentStreak),
    [state.currentStreak]
  );

  return (
    <Card className={cn('bg-slate-900/80 border-white/10', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <CardTitle className="text-lg">Daily Login</CardTitle>
          </div>
          <Badge variant="outline" className="gap-1">
            <Star className="w-3 h-3" />
            {state.currentStreak} day streak
          </Badge>
        </div>
        <CardDescription>Log in daily for escalating rewards!</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 7-day reward grid */}
        <div className="grid grid-cols-7 gap-2">
          {rewardsPreview.map(reward => (
            <div
              key={reward.day}
              className={cn(
                'relative flex flex-col items-center p-2 rounded-lg border transition-all',
                reward.claimed && 'bg-green-900/20 border-green-500/30',
                reward.current &&
                  !state.todayClaimed &&
                  'bg-amber-900/30 border-amber-500/50 ring-2 ring-amber-500/30',
                reward.current && state.todayClaimed && 'bg-green-900/20 border-green-500/30',
                !reward.claimed && !reward.current && 'bg-slate-800/50 border-white/5'
              )}
            >
              {/* Day number */}
              <span className="text-xs text-slate-400 mb-1">Day {reward.day}</span>

              {/* Reward icon */}
              <div className="mb-1">{REWARD_ICONS[reward.type]}</div>

              {/* Amount */}
              <span className="text-xs text-white font-medium">{formatNumber(reward.amount)}</span>

              {/* Claimed check */}
              {(reward.claimed || (reward.current && state.todayClaimed)) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Current indicator */}
              {reward.current && !state.todayClaimed && (
                <div
                  className={cn(
                    'absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center',
                    !prefersReducedMotion && 'animate-pulse'
                  )}
                >
                  <Gift className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Claim button */}
        <Button
          onClick={onClaim}
          disabled={!canClaim}
          className={cn(
            'w-full gap-2',
            canClaim &&
              'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
          )}
        >
          {canClaim ? (
            <>
              <Gift className="w-4 h-4" />
              Claim Day {state.currentStreak} Reward
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Claimed! See you tomorrow
            </>
          )}
        </Button>

        {/* Stats */}
        <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <span>Total logins: {state.totalLogins}</span>
          <span>Day 7 = 100 Crystals!</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyLoginPanel;
