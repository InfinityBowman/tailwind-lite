/**
 * Leaderboard Panel
 *
 * Displays global leaderboards for various game metrics.
 * Works in both connected (Convex) and offline modes.
 */

import React, { useState, useMemo, memo } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { useLeaderboard, type LeaderboardMetric } from '../../hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Crown, Globe, Star, Rocket, Leaf, Trophy, Wifi, Medal, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '../../game/utils/numberFormat';

// Metric configurations
const METRIC_CONFIG: Record<
  LeaderboardMetric,
  { label: string; icon: React.ReactNode; description: string; format: (v: number) => string }
> = {
  galaxy_value: {
    label: 'Galaxy Value',
    icon: <Globe className="w-4 h-4" />,
    description: 'Total value of all planets',
    format: v => formatNumber(v),
  },
  prestige_level: {
    label: 'Prestige',
    icon: <Star className="w-4 h-4" />,
    description: 'Cumulative prestige level',
    format: v => v.toLocaleString(),
  },
  expedition_count: {
    label: 'Expeditions',
    icon: <Rocket className="w-4 h-4" />,
    description: 'Total expeditions completed',
    format: v => v.toLocaleString(),
  },
  seeds_discovered: {
    label: 'Seeds',
    icon: <Leaf className="w-4 h-4" />,
    description: 'Unique seeds discovered',
    format: v => v.toLocaleString(),
  },
  planets_unlocked: {
    label: 'Planets',
    icon: <Globe className="w-4 h-4" />,
    description: 'Number of planets unlocked',
    format: v => v.toLocaleString(),
  },
};

const ALL_METRICS: LeaderboardMetric[] = [
  'galaxy_value',
  'prestige_level',
  'expedition_count',
  'seeds_discovered',
  'planets_unlocked',
];

// Rank badge colors
const getRankStyle = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 2:
      return 'bg-slate-400/20 text-slate-300 border-slate-400/50';
    case 3:
      return 'bg-amber-600/20 text-amber-500 border-amber-600/50';
    default:
      return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
  }
};

const getRankIcon = (rank: number): React.ReactNode => {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 text-yellow-400" />;
    case 2:
      return <Medal className="w-4 h-4 text-slate-300" />;
    case 3:
      return <Medal className="w-4 h-4 text-amber-500" />;
    default:
      return null;
  }
};

interface LeaderboardEntryRowProps {
  rank: number;
  displayName: string;
  value: number;
  isCurrentUser?: boolean;
  formatValue: (v: number) => string;
}

const LeaderboardEntryRow = memo<LeaderboardEntryRowProps>(function LeaderboardEntryRow({
  rank,
  displayName,
  value,
  isCurrentUser,
  formatValue,
}) {
  return (
    <div
      role="listitem"
      aria-label={`Rank ${rank}: ${displayName} with ${formatValue(value)}${isCurrentUser ? ' (you)' : ''}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        isCurrentUser
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-slate-800/50 hover:bg-slate-800/80'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold',
          getRankStyle(rank)
        )}
        aria-hidden="true"
      >
        {getRankIcon(rank) || rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium truncate', isCurrentUser && 'text-primary')}>
            {displayName}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </div>
      <div className="text-right font-mono text-lg font-bold text-white">{formatValue(value)}</div>
    </div>
  );
});

interface LeaderboardListProps {
  metric: LeaderboardMetric;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ metric }) => {
  const { entries, myRank, isLoading } = useLeaderboard(metric, 50);
  const config = METRIC_CONFIG[metric];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No entries yet</p>
        <p className="text-sm mt-1">Be the first to claim a spot!</p>
      </div>
    );
  }

  return (
    <div role="list" aria-label={`${config.label} leaderboard rankings`} className="space-y-2">
      {/* Current user's rank (if not in top entries) */}
      {myRank && !entries.some(e => e.displayName === myRank.displayName) && (
        <div className="mb-4 pb-4 border-b border-slate-700">
          <p className="text-xs text-muted-foreground mb-2">Your Rank</p>
          <LeaderboardEntryRow
            rank={myRank.rank}
            displayName={myRank.displayName}
            value={myRank.value}
            isCurrentUser
            formatValue={config.format}
          />
        </div>
      )}

      {/* Leaderboard entries */}
      {entries.map((entry, index) => (
        <LeaderboardEntryRow
          key={`${entry.displayName}-${index}`}
          rank={entry.rank}
          displayName={entry.displayName}
          value={entry.value}
          isCurrentUser={myRank?.displayName === entry.displayName}
          formatValue={config.format}
        />
      ))}
    </div>
  );
};

const LeaderboardPanel: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('galaxy_value');
  const { state } = useGame();

  // Calculate current user's stats for display (memoized to prevent recreation)
  const userStats = useMemo<Record<LeaderboardMetric, number>>(
    () => ({
      galaxy_value: state.prestige.lifetimeCredits,
      prestige_level: state.prestige.prestigeLevel,
      expedition_count: state.expeditions?.completed || 0,
      seeds_discovered: state.ship.seedInventory.length,
      planets_unlocked: state.planets.filter(p => p.unlocked).length,
    }),
    [
      state.prestige.lifetimeCredits,
      state.prestige.prestigeLevel,
      state.expeditions?.completed,
      state.ship.seedInventory.length,
      state.planets,
    ]
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Leaderboards</h1>
            <p className="text-sm text-muted-foreground">Compete with farmers across the galaxy</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 text-green-400 border-green-400/50"
        >
          <Wifi className="w-3 h-3" />
          Connected
        </Badge>
      </div>

      {/* User's current stats */}
      <Card className="bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-2 sm:grid-cols-5 gap-4"
            role="group"
            aria-label="Your stats by category"
          >
            {ALL_METRICS.map(metric => {
              const config = METRIC_CONFIG[metric];
              const isActive = activeMetric === metric;
              return (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  aria-label={`${config.label}: ${config.format(userStats[metric])}. Click to view leaderboard.`}
                  aria-pressed={isActive}
                  className={cn(
                    'p-3 rounded-lg text-left transition-all',
                    isActive
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  )}
                >
                  <div
                    className="flex items-center gap-1.5 text-muted-foreground mb-1"
                    aria-hidden="true"
                  >
                    {config.icon}
                    <span className="text-xs">{config.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white" aria-hidden="true">
                    {config.format(userStats[metric])}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard tabs */}
      <Tabs value={activeMetric} onValueChange={v => setActiveMetric(v as LeaderboardMetric)}>
        <TabsList className="w-full grid grid-cols-5 bg-slate-800/50">
          {ALL_METRICS.map(metric => {
            const config = METRIC_CONFIG[metric];
            return (
              <TabsTrigger
                key={metric}
                value={metric}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-primary/20"
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ALL_METRICS.map(metric => (
          <TabsContent key={metric} value={metric} className="mt-4">
            <Card className="bg-slate-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {METRIC_CONFIG[metric].icon}
                  {METRIC_CONFIG[metric].label} Leaderboard
                </CardTitle>
                <p className="text-sm text-muted-foreground">{METRIC_CONFIG[metric].description}</p>
              </CardHeader>
              <CardContent>
                <LeaderboardList metric={metric} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LeaderboardPanel;
