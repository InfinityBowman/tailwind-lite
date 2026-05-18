/**
 * ProgressTrackerWidget - Persistent "next goal" progress indicator
 *
 * Shows the single most important next milestone with progress.
 * Helps players understand what to aim for without overwhelming them.
 */

import React, { useMemo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { Globe, Sparkles, Trophy, ScrollText, Zap, Users, Crown, Star } from 'lucide-react';
import { PRESTIGE_CONFIG } from '../../game/config/prestige';

// Unlock thresholds - should match unlocks.ts
const UNLOCK_THRESHOLDS = {
  QUESTS_PLANETS: 2,
  MANAGERS_PLANETS: 3,
  ACHIEVEMENTS_QUESTS: 5,
  SEEDEX_PULLS: 25,
  TRANSCENDENCE_PRESTIGE: 5,
} as const;

interface Goal {
  id: string;
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit?: string;
  priority: number; // Lower = more important
}

interface ProgressTrackerWidgetProps {
  className?: string;
  /** If true, show minimal version (just progress bar, no label) */
  minimal?: boolean;
}

interface GoalInputs {
  credits: number;
  lifetimeCredits: number;
  unlockedPlanets: number;
  totalPulls: number;
  prestigeLevel: number;
  questsCompleted: number;
  nextPlanet: { name: string; unlockCost: number } | null;
}

/**
 * Determines the most relevant next goal based on game state.
 * Goals are prioritized by what's most achievable and impactful.
 */
function getNextGoal(inputs: GoalInputs): Goal | null {
  const goals: Goal[] = [];
  const {
    credits,
    lifetimeCredits,
    unlockedPlanets,
    totalPulls,
    prestigeLevel,
    questsCompleted,
    nextPlanet,
  } = inputs;

  // Next planet unlock (high priority if close to affording)
  if (nextPlanet) {
    const progress = credits / nextPlanet.unlockCost;
    // Higher priority if we're > 30% there
    const priority = progress > 0.3 ? 1 : progress > 0.1 ? 3 : 5;
    goals.push({
      id: 'planet',
      icon: <Globe className="w-3.5 h-3.5 text-purple-400" />,
      label: `Unlock ${nextPlanet.name}`,
      current: Math.min(credits, nextPlanet.unlockCost),
      target: nextPlanet.unlockCost,
      unit: 'credits',
      priority,
    });
  }

  // Prestige threshold (if not yet available)
  if (prestigeLevel === 0 && lifetimeCredits < PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE) {
    const progress = lifetimeCredits / PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE;
    // Higher priority once past 50%
    const priority = progress > 0.5 ? 2 : progress > 0.2 ? 4 : 6;
    goals.push({
      id: 'prestige',
      icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
      label: 'Unlock Prestige',
      current: lifetimeCredits,
      target: PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE,
      unit: 'lifetime credits',
      priority,
    });
  }

  // Gacha pulls for Seedex unlock
  if (totalPulls < UNLOCK_THRESHOLDS.SEEDEX_PULLS) {
    const progress = totalPulls / UNLOCK_THRESHOLDS.SEEDEX_PULLS;
    const priority = progress > 0.4 ? 2 : 4;
    goals.push({
      id: 'seedex',
      icon: <ScrollText className="w-3.5 h-3.5 text-green-400" />,
      label: 'Unlock Seedex',
      current: totalPulls,
      target: UNLOCK_THRESHOLDS.SEEDEX_PULLS,
      unit: 'pulls',
      priority,
    });
  }

  // Quests unlock (need 2 planets)
  if (unlockedPlanets < UNLOCK_THRESHOLDS.QUESTS_PLANETS) {
    goals.push({
      id: 'quests',
      icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />,
      label: 'Unlock Quests',
      current: unlockedPlanets,
      target: UNLOCK_THRESHOLDS.QUESTS_PLANETS,
      unit: 'planets',
      priority: 2,
    });
  }

  // Managers unlock (need 3 planets) - show when less than 3, not just 2
  if (unlockedPlanets < UNLOCK_THRESHOLDS.MANAGERS_PLANETS) {
    // Lower priority than quests unlock
    const priority = unlockedPlanets >= UNLOCK_THRESHOLDS.QUESTS_PLANETS ? 3 : 5;
    goals.push({
      id: 'managers',
      icon: <Users className="w-3.5 h-3.5 text-blue-400" />,
      label: 'Unlock Managers',
      current: unlockedPlanets,
      target: UNLOCK_THRESHOLDS.MANAGERS_PLANETS,
      unit: 'planets',
      priority,
    });
  }

  // Achievements unlock (5 quests) - only relevant after quests unlocked
  if (
    questsCompleted < UNLOCK_THRESHOLDS.ACHIEVEMENTS_QUESTS &&
    unlockedPlanets >= UNLOCK_THRESHOLDS.QUESTS_PLANETS
  ) {
    goals.push({
      id: 'achievements',
      icon: <Star className="w-3.5 h-3.5 text-amber-400" />,
      label: 'Unlock Achievements',
      current: questsCompleted,
      target: UNLOCK_THRESHOLDS.ACHIEVEMENTS_QUESTS,
      unit: 'quests',
      priority: 4,
    });
  }

  // First 10-pull milestone (for new players)
  if (totalPulls < 10) {
    const priority = totalPulls >= 5 ? 2.5 : 5; // Use 2.5 to break ties with seedex (2)
    goals.push({
      id: 'first-pulls',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      label: 'Seed Collection',
      current: totalPulls,
      target: 10,
      unit: 'pulls',
      priority,
    });
  }

  // Higher prestige levels (if already prestiged)
  if (prestigeLevel >= 1 && prestigeLevel < UNLOCK_THRESHOLDS.TRANSCENDENCE_PRESTIGE) {
    goals.push({
      id: 'transcendence',
      icon: <Crown className="w-3.5 h-3.5 text-purple-500" />,
      label: 'Unlock Transcendence',
      current: prestigeLevel,
      target: UNLOCK_THRESHOLDS.TRANSCENDENCE_PRESTIGE,
      unit: 'prestige',
      priority: 6,
    });
  }

  if (goals.length === 0) {
    return null;
  }

  // Sort by priority (stable sort to maintain insertion order for ties)
  goals.sort((a, b) => a.priority - b.priority);
  return goals[0];
}

export const ProgressTrackerWidget: React.FC<ProgressTrackerWidgetProps> = ({
  className,
  minimal = false,
}) => {
  const { state } = useGame();

  // Extract specific values for memoization - avoids recomputing on every tick
  const credits = state.ship.totalCurrency;
  const lifetimeCredits = state.prestige.lifetimeCredits;
  const prestigeLevel = state.prestige.prestigeLevel;
  const totalPulls = state.achievements.stats.totalGachaPulls;

  // Derived values that change less frequently
  const unlockedPlanets = useMemo(
    () => state.planets.filter(p => p.unlocked).length,
    [state.planets]
  );

  const questsCompleted = useMemo(() => {
    const dailyClaimed = Object.values(state.quests.dailyQuests).filter(q => q.claimed).length;
    const weeklyClaimed = Object.values(state.quests.weeklyQuests).filter(q => q.claimed).length;
    return dailyClaimed + weeklyClaimed;
  }, [state.quests.dailyQuests, state.quests.weeklyQuests]);

  const nextPlanet = useMemo(() => {
    const planet = state.planets.find(p => !p.unlocked);
    return planet ? { name: planet.name, unlockCost: planet.unlockCost } : null;
  }, [state.planets]);

  // Compute goal with proper dependencies
  const goal = useMemo(
    () =>
      getNextGoal({
        credits,
        lifetimeCredits,
        unlockedPlanets,
        totalPulls,
        prestigeLevel,
        questsCompleted,
        nextPlanet,
      }),
    [
      credits,
      lifetimeCredits,
      unlockedPlanets,
      totalPulls,
      prestigeLevel,
      questsCompleted,
      nextPlanet,
    ]
  );

  if (!goal) {
    return null;
  }

  const percentage = Math.min((goal.current / goal.target) * 100, 100);
  const isAlmostComplete = percentage >= 80;

  // Format numbers nicely
  const formatValue = (val: number): string => {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    return Math.floor(val).toLocaleString();
  };

  if (minimal) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {goal.icon}
        <Progress
          value={percentage}
          className="h-1.5 w-16"
          indicatorClassName={isAlmostComplete ? 'bg-green-500' : undefined}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50',
        isAlmostComplete && 'border-green-500/30 bg-green-500/10',
        className
      )}
    >
      {goal.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-medium truncate">{goal.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {formatValue(goal.current)}/{formatValue(goal.target)}
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-1.5"
          indicatorClassName={isAlmostComplete ? 'bg-green-500' : undefined}
        />
      </div>
    </div>
  );
};

export default ProgressTrackerWidget;
