/**
 * Events Panel
 * Shows all active and upcoming events with their challenges and rewards
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Zap, Clock, Gift, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { useGame } from '../../contexts/GameEngineContext';
import {
  getEventTimeRemaining,
  getEventProgress,
  getAllActiveModifiers,
  isEventFullyCompleted,
  getUnclaimedRewards,
  getCurrentSeasonalEvent,
} from '../../game/systems/EventSystem';

// Modifier display names - stable reference outside component
const MODIFIER_NAMES: Record<string, string> = {
  production: 'Production',
  sellValue: 'Sell Value',
  crystalDrop: 'Crystal Drop',
  fusionSuccess: 'Fusion Success',
  essenceGain: 'Essence Gain',
  gachaLuck: 'Gacha Luck',
  growSpeed: 'Grow Speed',
  rareRate: 'Rare Rate',
  prestigePoints: 'Prestige Points',
  expeditionSpeed: 'Expedition Speed',
};

const EventsPanel: React.FC = () => {
  const { state } = useGame();

  // Memoize events array to avoid dependency issues
  const events = useMemo(() => state.events?.activeEvents ?? [], [state.events?.activeEvents]);
  const completedEventIds = state.events?.completedEventIds ?? [];

  // Get aggregated modifiers from all active events
  const activeModifiers = useMemo(() => {
    if (!state.events) return null;
    return getAllActiveModifiers(state.events);
  }, [state.events]);

  // Check for upcoming seasonal event
  const upcomingSeasonal = useMemo(() => {
    const current = getCurrentSeasonalEvent();
    if (current && !events.some(e => e.type === current.type)) {
      // Seasonal event is available but not active yet
      return current;
    }
    return null;
  }, [events]);

  // Format time remaining
  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Get active modifier badges
  const activeModifierBadges = useMemo(() => {
    if (!activeModifiers) return [];
    return Object.entries(activeModifiers)
      .filter(([_, value]) => value !== 1)
      .map(([key, value]) => ({
        name: MODIFIER_NAMES[key] || key,
        value: value as number,
        isBoost: (value as number) > 1,
      }));
  }, [activeModifiers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="text-sm text-slate-400">Limited-time challenges and bonuses</p>
          </div>
        </div>
        <Badge variant="outline" className="text-purple-400 border-purple-400/50">
          {events.length} Active
        </Badge>
      </div>

      {/* Active Modifiers Summary */}
      {activeModifierBadges.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Active Event Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeModifierBadges.map(({ name, value, isBoost }) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    isBoost ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                  )}
                >
                  {name}: {isBoost ? '+' : ''}
                  {Math.round((value - 1) * 100)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Events */}
      {events.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Active Events</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Events appear periodically with special challenges, bonuses, and rewards. Check back
              soon!
            </p>
            {upcomingSeasonal && (
              <div className="mt-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300">
                  <span className="font-medium">{upcomingSeasonal.name}</span> is coming soon!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Events */}
      {events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Active Events
          </h2>
          <div className="grid gap-4">
            {events.map(event => {
              const timeRemaining = getEventTimeRemaining(event);
              const progress = getEventProgress(event);
              const isCompleted = isEventFullyCompleted(event);
              const unclaimedCount = getUnclaimedRewards(state.events!, event.id).length;

              return (
                <Card
                  key={event.id}
                  className={cn(
                    'border transition-all',
                    timeRemaining < 3600000
                      ? 'border-red-500/50 bg-red-900/10'
                      : 'border-purple-500/30 bg-slate-800/50'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        {event.name}
                        {isCompleted && (
                          <Badge className="bg-green-600/20 text-green-400">
                            <Trophy className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {unclaimedCount > 0 && (
                          <Badge className="bg-amber-600/20 text-amber-400">
                            <Gift className="w-3 h-3 mr-1" />
                            {unclaimedCount} Unclaimed
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            timeRemaining < 3600000
                              ? 'text-red-400 border-red-400/50'
                              : 'text-slate-400 border-slate-500/50'
                          )}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(timeRemaining)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{event.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Event Modifiers */}
                    {event.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.modifiers.map((mod, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-purple-600/20 text-purple-300"
                          >
                            {MODIFIER_NAMES[mod.type] || mod.type}: +
                            {Math.round((mod.value - 1) * 100)}%
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Overall Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-400">Event Progress</span>
                        <span className="text-white">{Math.floor(progress * 100)}%</span>
                      </div>
                      <Progress value={progress * 100} className="h-2" />
                    </div>

                    <Separator className="bg-slate-700/50" />

                    {/* Challenges */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300">Challenges</h4>
                      {event.challenges.map(challenge => (
                        <div
                          key={challenge.id}
                          className={cn(
                            'p-3 rounded-lg border',
                            challenge.completed
                              ? 'bg-green-900/10 border-green-500/30'
                              : 'bg-slate-800/30 border-slate-700/50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{challenge.description}</span>
                            {challenge.completed && (
                              <Badge className="bg-green-600/20 text-green-400 text-xs">Done</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <Progress
                              value={Math.min(
                                100,
                                (challenge.progress / challenge.requirement.target) * 100
                              )}
                              className="h-1.5 flex-1 mr-3"
                            />
                            <span className="text-xs text-slate-400">
                              {challenge.progress.toLocaleString()} /{' '}
                              {challenge.requirement.target.toLocaleString()}
                            </span>
                          </div>
                          {/* Reward preview */}
                          <div className="mt-2 text-xs text-slate-500">
                            Reward: {challenge.reward.amount?.toLocaleString() || 1}x{' '}
                            {challenge.reward.type}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Completion Bonus */}
                    {event.completionBonus && (
                      <div className="p-3 bg-amber-900/10 rounded-lg border border-amber-500/30">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <Trophy className="w-4 h-4" />
                          <span className="font-medium">Completion Bonus:</span>
                          <span>
                            {event.completionBonus.amount?.toLocaleString() || 1}x{' '}
                            {event.completionBonus.type}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Event History */}
      {completedEventIds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Completed Events
          </h2>
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">
                You have completed {completedEventIds.length} event
                {completedEventIds.length !== 1 ? 's' : ''}.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventsPanel;
