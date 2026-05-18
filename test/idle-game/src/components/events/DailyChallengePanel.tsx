/**
 * Daily Challenge Panel
 * Shows all daily challenges with progress and streak info
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Flame, Trophy, Timer, Gift, Check, Shield } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import ChallengeCard from './ChallengeCard';
import type { DailyChallengeState } from '../../game/systems/DailyChallengeSystem';
import {
  getTimeUntilRefresh,
  formatTimeUntilRefresh,
  getDailyProgress,
  allChallengesCompleted,
  getUnclaimedChallenges,
  getStreakShieldInfo,
} from '../../game/systems/DailyChallengeSystem';

interface DailyChallengePanelProps {
  state: DailyChallengeState;
  onClaimChallenge: (challengeId: string) => void;
  onClaimAll: () => void;
  className?: string;
}

const DailyChallengePanel: React.FC<DailyChallengePanelProps> = ({
  state,
  onClaimChallenge,
  onClaimAll,
  className,
}) => {
  const progress = getDailyProgress(state);
  const allCompleted = allChallengesCompleted(state);
  const unclaimedChallenges = getUnclaimedChallenges(state);
  const timeUntilRefresh = getTimeUntilRefresh();
  const shieldInfo = getStreakShieldInfo(state);

  // Sort challenges by difficulty order: easy, medium, hard, elite
  const sortedChallenges = useMemo(() => {
    const order = { easy: 0, medium: 1, hard: 2, elite: 3 };
    return [...state.challenges].sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  }, [state.challenges]);

  // Check if all are claimed
  const allClaimed = state.challenges.every(c => c.claimed);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Daily Progress */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-400">Today's Progress</span>
          </div>
          <div className="text-2xl font-bold text-white mb-2">{Math.floor(progress * 100)}%</div>
          <Progress value={progress * 100} className="h-2" />
        </div>

        {/* Streak */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame
                className={cn(
                  'w-5 h-5',
                  state.dailyStreak > 0 ? 'text-orange-400' : 'text-slate-500'
                )}
              />
              <span className="text-sm text-slate-400">Daily Streak</span>
            </div>
            {/* Streak Shields */}
            <div
              className="flex items-center gap-1"
              title={`${shieldInfo.shields}/${shieldInfo.maxShields} streak shields (protects from reset)`}
            >
              {Array.from({ length: shieldInfo.maxShields }).map((_, i) => (
                <Shield
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < shieldInfo.shields ? 'text-cyan-400' : 'text-slate-700'
                  )}
                  fill={i < shieldInfo.shields ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {state.dailyStreak} <span className="text-sm text-slate-400">days</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex justify-between">
            <span>Best: {state.longestStreak} days</span>
            {shieldInfo.nextShieldAt && (
              <span className="text-cyan-400/70">Next shield at {shieldInfo.nextShieldAt}d</span>
            )}
          </div>
        </div>

        {/* Reset Timer */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Resets In</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTimeUntilRefresh(timeUntilRefresh)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Daily refresh</div>
        </div>
      </div>

      {/* Completion Bonus */}
      {state.allClaimedBonus && (
        <div
          className={cn(
            'rounded-lg p-4 border',
            allClaimed
              ? 'bg-slate-800/30 border-slate-700/50'
              : allCompleted
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50'
                : 'bg-slate-800/50 border-slate-700/50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  allClaimed
                    ? 'bg-slate-700/50'
                    : allCompleted
                      ? 'bg-amber-600/30'
                      : 'bg-slate-700/50'
                )}
              >
                {allClaimed ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Gift
                    className={cn('w-5 h-5', allCompleted ? 'text-amber-400' : 'text-slate-400')}
                  />
                )}
              </div>
              <div>
                <div className={cn('font-semibold', allClaimed ? 'text-slate-500' : 'text-white')}>
                  {allClaimed ? 'All Rewards Claimed!' : 'Completion Bonus'}
                </div>
                <div className={cn('text-sm', allClaimed ? 'text-slate-600' : 'text-slate-400')}>
                  {allClaimed
                    ? 'Come back tomorrow for new challenges'
                    : `Complete all challenges for +${state.allClaimedBonus.amount} crystals`}
                </div>
              </div>
            </div>

            {!allClaimed && allCompleted && (
              <div className="text-amber-400 font-bold animate-pulse">Ready!</div>
            )}
          </div>
        </div>
      )}

      {/* Claim All Button */}
      {unclaimedChallenges.length > 1 && (
        <Button
          onClick={onClaimAll}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500"
          size="lg"
        >
          <Gift className="w-5 h-5 mr-2" />
          Claim All Rewards ({unclaimedChallenges.length})
        </Button>
      )}

      {/* Challenge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedChallenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} onClaim={onClaimChallenge} />
        ))}
      </div>

      {/* Empty State */}
      {state.challenges.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No daily challenges available.</p>
          <p className="text-sm mt-1">Check back after the daily reset!</p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex justify-center gap-8 text-sm text-slate-500">
        <div>
          <span className="text-white font-medium">{state.totalChallengesCompleted}</span> total
          challenges completed
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePanel;
