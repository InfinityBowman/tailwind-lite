/**
 * Event Card
 * Shows an active event with progress and rewards
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getIcon } from '../ui/DynamicIcon';
import { Calendar, Check } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Timer } from '../ui';
import type { GameEvent } from '../../game/systems/EventSystem';
import { getEventProgress, getEventTimeRemaining } from '../../game/systems/EventSystem';

interface EventCardProps {
  event: GameEvent;
  claimedChallenges: string[];
  onClaimReward: (eventId: string, challengeId: string) => void;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  claimedChallenges,
  onClaimReward,
  className,
}) => {
  const Icon = getIcon(event.icon, Calendar);
  const progress = getEventProgress(event) * 100;
  const timeRemaining = getEventTimeRemaining(event);
  const isEnding = timeRemaining < 3600000; // Less than 1 hour

  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        isEnding ? 'border-red-500/50 bg-red-500/10' : 'border-purple-500/30 bg-purple-500/10',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              isEnding ? 'bg-red-600/20' : 'bg-purple-600/20'
            )}
          >
            <Icon className={cn('w-6 h-6', isEnding ? 'text-red-400' : 'text-purple-400')} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{event.name}</h3>
            <p className="text-sm text-slate-400">{event.description}</p>
          </div>
        </div>
        <div className={cn('text-sm font-medium', isEnding ? 'text-red-400' : 'text-slate-400')}>
          <Timer targetTime={event.endTime} format="short" showIcon />
        </div>
      </div>

      {/* Modifiers */}
      <div className="flex flex-wrap gap-2 mb-4">
        {event.modifiers.map((mod, i) => (
          <div
            key={i}
            className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-md text-xs text-green-400"
          >
            +{Math.round((mod.value - 1) * 100)}% {mod.type.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Event Progress</span>
          <span className="text-purple-400">
            {event.challenges.filter(c => c.completed).length}/{event.challenges.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        {event.challenges.map(challenge => {
          const isClaimed = claimedChallenges.includes(challenge.id);
          const canClaim = challenge.completed && !isClaimed;

          return (
            <div
              key={challenge.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                challenge.completed
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-slate-800/50 border border-slate-700/50'
              )}
            >
              <div className="flex-1">
                <p
                  className={cn(
                    'text-sm',
                    challenge.completed ? 'text-green-400' : 'text-slate-300'
                  )}
                >
                  {challenge.description}
                </p>
                {!challenge.completed && (
                  <div className="mt-1">
                    <Progress
                      value={(challenge.progress / challenge.requirement.target) * 100}
                      className="h-1.5"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">
                      {challenge.progress} / {challenge.requirement.target}
                    </p>
                  </div>
                )}
              </div>

              {canClaim && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onClaimReward(event.id, challenge.id)}
                  className="ml-3"
                >
                  Claim
                </Button>
              )}

              {isClaimed && <Check className="w-5 h-5 text-green-400 ml-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventCard;
