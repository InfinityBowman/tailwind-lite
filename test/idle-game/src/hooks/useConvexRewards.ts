/**
 * useConvexRewards - Rewards and achievements via Convex backend
 *
 * Handles daily login, quests, achievements, challenges, and contracts.
 */

import { useCallback, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { GameState } from '../game/state/GameState';
import type { AchievementCategory } from '../game/config/achievements';
import type { DailyChallengeState } from '../game/systems/DailyChallengeSystem';
import {
  getDailyQuestsWithProgress,
  getWeeklyQuestsWithProgress,
  formatTimeUntilReset,
  getUnclaimedQuestCount,
  getAchievementsWithProgress,
  getCategoryStats,
  getUnclaimedAchievementCount,
  getUnlockedAchievementCount,
  getTotalAchievementCount,
  deserializeAchievementState,
} from '../game';

export function useConvexRewards(state: GameState | null) {
  // Mutations
  const claimDailyLoginMutation = useMutation(api.rewards.claimDailyLogin);
  const claimDailyChallengeMutation = useMutation(api.rewards.claimDailyChallenge);
  const claimAllDailyChallengesMutation = useMutation(api.rewards.claimAllDailyChallenges);
  const claimContractMutation = useMutation(api.rewards.claimContract);
  const claimAllContractsMutation = useMutation(api.rewards.claimAllContracts);
  const claimQuestMutation = useMutation(api.rewards.claimQuest);
  const claimAchievementMutation = useMutation(api.rewards.claimAchievement);
  const claimSeedexRewardMutation = useMutation(api.seedex.claimSeedexReward);

  // Memoize deserialized achievement state to avoid repeated conversions
  const deserializedAchievements = useMemo(() => {
    if (!state?.achievements) return null;
    return deserializeAchievementState(state.achievements);
  }, [state?.achievements]);

  // Actions
  const claimDailyReward = useCallback(async () => {
    return await claimDailyLoginMutation({ isAI: false });
  }, [claimDailyLoginMutation]);

  const claimDailyChallenge = useCallback(
    async (challengeId: string) => {
      return await claimDailyChallengeMutation({ challengeId, isAI: false });
    },
    [claimDailyChallengeMutation]
  );

  const claimContract = useCallback(
    async (contractId: string) => {
      return await claimContractMutation({ contractId, isAI: false });
    },
    [claimContractMutation]
  );

  const claimQuest = useCallback(
    async (questId: string) => {
      return await claimQuestMutation({ questId, isAI: false });
    },
    [claimQuestMutation]
  );

  const claimAchievement = useCallback(
    async (achievementId: string) => {
      return await claimAchievementMutation({ achievementId, isAI: false });
    },
    [claimAchievementMutation]
  );

  const claimSeedexReward = useCallback(
    async (rewardId: string) => {
      return await claimSeedexRewardMutation({ rewardId, isAI: false });
    },
    [claimSeedexRewardMutation]
  );

  // Daily login helpers
  const getDailyLoginState = useCallback(() => state?.dailyLogin ?? null, [state]);

  const checkDailyLogin = useCallback(() => {
    if (!state?.dailyLogin) {
      return { canClaim: false, currentStreak: 0, lastLoginDate: null };
    }
    return {
      canClaim: !state.dailyLogin.todayClaimed,
      currentStreak: state.dailyLogin.currentStreak ?? 0,
      lastLoginDate: state.dailyLogin.lastLoginDate ?? null,
    };
  }, [state]);

  // Quest helpers (derived from state)
  const getQuestState = useCallback(() => state?.quests ?? null, [state]);

  const getClaimableQuestCount = useCallback(() => {
    if (!state?.quests) return 0;
    return getUnclaimedQuestCount(state.quests);
  }, [state]);

  const getDailyQuests = useCallback(() => {
    if (!state?.quests) return [];
    return getDailyQuestsWithProgress(state.quests);
  }, [state]);

  const getWeeklyQuests = useCallback(() => {
    if (!state?.quests) return [];
    return getWeeklyQuestsWithProgress(state.quests);
  }, [state]);

  const formatQuestResetTime = useCallback(
    (resetTime: number) => formatTimeUntilReset(resetTime),
    []
  );

  // Achievement helpers (derived from state)
  const getClaimableAchievementCount = useCallback(() => {
    if (!deserializedAchievements) return 0;
    return getUnclaimedAchievementCount(deserializedAchievements);
  }, [deserializedAchievements]);

  const getUnlockedAchievementCountValue = useCallback(() => {
    if (!deserializedAchievements) return 0;
    return getUnlockedAchievementCount(deserializedAchievements);
  }, [deserializedAchievements]);

  const getTotalAchievementCountValue = useCallback(() => getTotalAchievementCount(), []);

  const getAchievementsWithProgressValue = useCallback(
    (category?: AchievementCategory) => {
      if (!deserializedAchievements) return [];
      return getAchievementsWithProgress(deserializedAchievements, category);
    },
    [deserializedAchievements]
  );

  const getAchievementCategoryStats = useCallback(() => {
    if (!deserializedAchievements) return [];
    return getCategoryStats(deserializedAchievements);
  }, [deserializedAchievements]);

  // Contract count (derived from state)
  const getClaimableContractCount = useCallback(() => {
    if (!state?.contracts) return 0;
    return Object.values(state.contracts).filter(
      c => c && typeof c === 'object' && 'completed' in c && c.completed && !c.claimed
    ).length;
  }, [state]);

  // Claim all completed contracts at once
  const claimAllContracts = useCallback(async () => {
    const result = await claimAllContractsMutation({ isAI: false });
    return {
      claimedCount: result.claimedCount,
      totalRewards: result.totalRewards,
    };
  }, [claimAllContractsMutation]);

  // Daily challenges helpers
  const getDailyChallengeState = useCallback((): DailyChallengeState => {
    if (!state?.dailyChallenges) {
      return {
        challenges: [],
        lastRefreshDate: new Date().toISOString().split('T')[0],
        dailyStreak: 0,
        longestStreak: 0,
        totalChallengesCompleted: 0,
        allClaimedBonus: null,
        streakShields: 0,
        lastShieldGrantStreak: 0,
      };
    }
    return state.dailyChallenges;
  }, [state]);

  const claimAllDailyChallenges = useCallback(async () => {
    const result = await claimAllDailyChallengesMutation({ isAI: false });
    return {
      success: result.success,
      claimed: result.claimed,
      totalRewards: result.totalRewards,
      allClaimedBonus: result.allClaimedBonus,
      error: result.error,
    };
  }, [claimAllDailyChallengesMutation]);

  const getUnclaimedChallengeCount = useCallback(() => {
    if (!state?.dailyChallenges?.challenges) return 0;
    return state.dailyChallenges.challenges.filter(c => c.completed && !c.claimed).length;
  }, [state]);

  return {
    // Daily login
    claimDailyReward,
    getDailyLoginState,
    checkDailyLogin,
    // Daily challenges
    claimDailyChallenge,
    getDailyChallengeState,
    claimAllDailyChallenges,
    getUnclaimedChallengeCount,
    // Contracts
    claimContract,
    getClaimableContractCount,
    claimAllContracts,
    // Quests
    claimQuest,
    getQuestState,
    getClaimableQuestCount,
    getDailyQuests,
    getWeeklyQuests,
    formatQuestResetTime,
    // Achievements
    claimAchievement,
    getClaimableAchievementCount,
    getUnlockedAchievementCount: getUnlockedAchievementCountValue,
    getTotalAchievementCount: getTotalAchievementCountValue,
    getAchievementsWithProgress: getAchievementsWithProgressValue,
    getAchievementCategoryStats,
    // Seedex
    claimSeedexReward,
  };
}

export type UseConvexRewardsReturn = ReturnType<typeof useConvexRewards>;
