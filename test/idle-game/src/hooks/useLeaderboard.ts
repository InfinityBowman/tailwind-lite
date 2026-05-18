import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export type LeaderboardMetric =
  | 'galaxy_value'
  | 'prestige_level'
  | 'expedition_count'
  | 'seeds_discovered'
  | 'planets_unlocked';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  value: number;
  updatedAt: number;
}

export interface MyRank {
  rank: number;
  value: number;
  displayName: string;
}

/**
 * Hook for leaderboard functionality.
 *
 * Returns live-updating leaderboard data via Convex subscriptions.
 *
 * Usage:
 * ```tsx
 * const { entries, myRank, updateScore } = useLeaderboard('galaxy_value');
 * ```
 */
export function useLeaderboard(metric: LeaderboardMetric, limit = 100) {
  const entries = useQuery(api.leaderboard.getTop, { metric, limit });
  const myRank = useQuery(api.leaderboard.getMyRank, { metric });

  const updateMutation = useMutation(api.leaderboard.updateScore);
  const batchUpdateMutation = useMutation(api.leaderboard.batchUpdateScores);

  /**
   * Update the current user's score for this metric.
   */
  const updateScore = useCallback(
    async (value: number, displayName?: string) => {
      try {
        return await updateMutation({ metric, value, displayName });
      } catch (error) {
        console.error('[Leaderboard] Update failed:', error);
        return null;
      }
    },
    [updateMutation, metric]
  );

  /**
   * Batch update multiple metrics at once.
   */
  const batchUpdate = useCallback(
    async (scores: Array<{ metric: LeaderboardMetric; value: number }>, displayName?: string) => {
      try {
        return await batchUpdateMutation({ scores, displayName });
      } catch (error) {
        console.error('[Leaderboard] Batch update failed:', error);
        return null;
      }
    },
    [batchUpdateMutation]
  );

  return {
    /** Top entries for this metric (live-updating) */
    entries: (entries as LeaderboardEntry[] | null) ?? [],
    /** Current user's rank (live-updating) */
    myRank: myRank as MyRank | null,
    /** Whether data is loading */
    isLoading: entries === undefined,
    /** Update score for single metric */
    updateScore,
    /** Update scores for multiple metrics */
    batchUpdate,
  };
}

/**
 * Hook to get all leaderboards at once.
 */
export function useAllLeaderboards() {
  const galaxyValue = useLeaderboard('galaxy_value', 10);
  const prestigeLevel = useLeaderboard('prestige_level', 10);
  const expeditionCount = useLeaderboard('expedition_count', 10);
  const seedsDiscovered = useLeaderboard('seeds_discovered', 10);
  const planetsUnlocked = useLeaderboard('planets_unlocked', 10);

  return {
    galaxyValue,
    prestigeLevel,
    expeditionCount,
    seedsDiscovered,
    planetsUnlocked,
  };
}
