/**
 * Challenge Card
 * Shows a single daily challenge with progress
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  CircleDot,
  Circle,
  Hexagon,
  Star,
  Check,
  Gift,
  Coins,
  Gem,
  Droplets,
  FlaskConical,
} from 'lucide-react';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import type {
  DailyChallenge,
  ChallengeDifficulty,
  ChallengeReward,
} from '../../game/systems/DailyChallengeSystem';

interface ChallengeCardProps {
  challenge: DailyChallenge;
  onClaim: (challengeId: string) => void;
  className?: string;
}

const DIFFICULTY_ICONS: Record<ChallengeDifficulty, React.FC<{ className?: string }>> = {
  easy: CircleDot,
  medium: Circle,
  hard: Hexagon,
  elite: Star,
};

const DIFFICULTY_COLORS: Record<
  ChallengeDifficulty,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
  }
> = {
  easy: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    accent: 'bg-green-600/20',
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    accent: 'bg-yellow-600/20',
  },
  hard: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    accent: 'bg-orange-600/20',
  },
  elite: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    accent: 'bg-purple-600/20',
  },
};

const REWARD_ICONS: Record<ChallengeReward['type'], React.FC<{ className?: string }>> = {
  credits: Coins,
  crystals: Gem,
  essence: Droplets,
  refinedEssence: FlaskConical,
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onClaim, className }) => {
  const colors = DIFFICULTY_COLORS[challenge.difficulty];
  const DifficultyIcon = DIFFICULTY_ICONS[challenge.difficulty];
  const RewardIcon = REWARD_ICONS[challenge.reward.type];

  const progress = Math.min((challenge.progress / challenge.requirement) * 100, 100);
  const canClaim = challenge.completed && !challenge.claimed;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        challenge.claimed ? 'bg-slate-800/30 border-slate-700/50 opacity-60' : colors.bg,
        !challenge.claimed && colors.border,
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded flex items-center justify-center',
              challenge.claimed ? 'bg-slate-700/50' : colors.accent
            )}
          >
            <DifficultyIcon
              className={cn('w-4 h-4', challenge.claimed ? 'text-slate-500' : colors.text)}
            />
          </div>
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-wide',
              challenge.claimed ? 'text-slate-500' : colors.text
            )}
          >
            {challenge.difficulty}
          </span>
        </div>

        {/* Reward Preview */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded',
            challenge.claimed ? 'bg-slate-700/50' : colors.accent
          )}
        >
          <RewardIcon
            className={cn(
              'w-4 h-4',
              challenge.claimed ? 'text-slate-500' : getRewardColor(challenge.reward.type)
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              challenge.claimed ? 'text-slate-500' : 'text-white'
            )}
          >
            {challenge.reward.amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className={cn('text-sm mb-3', challenge.claimed ? 'text-slate-500' : 'text-slate-300')}>
        {challenge.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={challenge.claimed ? 'text-slate-500' : 'text-slate-400'}>Progress</span>
          <span
            className={cn(
              'font-medium',
              challenge.completed
                ? challenge.claimed
                  ? 'text-slate-500'
                  : 'text-green-400'
                : 'text-white'
            )}
          >
            {challenge.progress.toLocaleString()} / {challenge.requirement.toLocaleString()}
          </span>
        </div>
        <Progress
          value={progress}
          className={cn('h-2', challenge.claimed && '[&>div]:bg-slate-600')}
        />
      </div>

      {/* Action Button */}
      {challenge.claimed ? (
        <div className="flex items-center justify-center gap-2 py-2 text-slate-500">
          <Check className="w-4 h-4" />
          <span className="text-sm">Claimed</span>
        </div>
      ) : canClaim ? (
        <Button
          onClick={() => onClaim(challenge.id)}
          className={cn(
            'w-full',
            'bg-gradient-to-r from-amber-600 to-yellow-600',
            'hover:from-amber-500 hover:to-yellow-500'
          )}
          size="sm"
        >
          <Gift className="w-4 h-4 mr-2" />
          Claim Reward
        </Button>
      ) : (
        <div className={cn('text-center py-2 text-sm', colors.text)}>
          {Math.floor(progress)}% Complete
        </div>
      )}
    </div>
  );
};

function getRewardColor(type: ChallengeReward['type']): string {
  switch (type) {
    case 'credits':
      return 'text-yellow-400';
    case 'crystals':
      return 'text-cyan-400';
    case 'essence':
      return 'text-purple-400';
    case 'refinedEssence':
      return 'text-fuchsia-400';
    default:
      return 'text-white';
  }
}

export default ChallengeCard;
