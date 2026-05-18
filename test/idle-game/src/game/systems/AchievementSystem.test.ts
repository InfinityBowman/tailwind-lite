/**
 * AchievementSystem Tests
 */

import { describe, it, expect } from 'vitest';
import {
  deserializeAchievementState,
  getAchievementProgressPercent,
  getClaimableAchievements,
  getUnclaimedAchievementCount,
  getUnlockedAchievementCount,
  getTotalAchievementCount,
  getAchievementsWithProgress,
  getCategoryStats,
  type AchievementState,
} from './AchievementSystem';
import { ALL_ACHIEVEMENT_IDS } from '../config/achievements';

function createTestAchievementState(): AchievementState {
  const achievements: Record<
    string,
    { achievementId: string; progress: number; unlocked: boolean; claimed: boolean }
  > = {};

  for (const achievementId of ALL_ACHIEVEMENT_IDS) {
    achievements[achievementId] = {
      achievementId,
      progress: 0,
      unlocked: false,
      claimed: false,
    };
  }

  return {
    achievements,
    stats: {
      totalPlantsSold: 0,
      totalCreditsEarned: 0,
      totalGachaPulls: 0,
      totalSeedsFused: 0,
      totalPlantsRefined: 0,
      totalPlantsExtracted: 0,
      maxSeedTierCreated: 1,
      uniqueSeedTypesOwned: new Set<string>(),
      planetsUnlocked: 1,
      researchCompleted: 0,
      prestigeCount: 0,
      totalSeedsBred: 0,
      totalTraitsDiscovered: 0,
      totalRecipesDiscovered: 0,
      totalLegendaryTraits: 0,
      consecutiveFodders: 0,
    },
  };
}

describe('AchievementSystem', () => {
  describe('deserializeAchievementState', () => {
    it('should convert array back to Set for deserialization', () => {
      const state = createTestAchievementState();
      const serialized = {
        ...state,
        stats: {
          ...state.stats,
          uniqueSeedTypesOwned: ['wheat', 'corn', 'potato'],
        },
      };

      const deserialized = deserializeAchievementState(serialized);

      expect(deserialized.stats.uniqueSeedTypesOwned).toBeInstanceOf(Set);
      expect(deserialized.stats.uniqueSeedTypesOwned.size).toBe(3);
    });

    it('should provide defaults for missing backwards-compat fields', () => {
      const serialized = {
        achievements: {},
        stats: {
          totalPlantsSold: 10,
          totalCreditsEarned: 100,
          totalGachaPulls: 5,
          totalSeedsFused: 2,
          totalPlantsRefined: 0,
          maxSeedTierCreated: 1,
          uniqueSeedTypesOwned: [] as string[],
          planetsUnlocked: 1,
          researchCompleted: 0,
          prestigeCount: 0,
        },
      };

      const deserialized = deserializeAchievementState(serialized);

      expect(deserialized.stats.totalPlantsExtracted).toBe(0);
      expect(deserialized.stats.totalSeedsBred).toBe(0);
      expect(deserialized.stats.consecutiveFodders).toBe(0);
    });
  });

  describe('getAchievementProgressPercent', () => {
    it('should calculate correct percentage', () => {
      expect(getAchievementProgressPercent('firstHarvest', 50)).toBe(50);
      expect(getAchievementProgressPercent('firstHarvest', 100)).toBe(100);
      expect(getAchievementProgressPercent('firstHarvest', 0)).toBe(0);
    });

    it('should cap at 100%', () => {
      expect(getAchievementProgressPercent('firstHarvest', 200)).toBe(100);
    });

    it('should return 0 for invalid achievement', () => {
      expect(getAchievementProgressPercent('nonexistent', 100)).toBe(0);
    });
  });

  describe('getClaimableAchievements', () => {
    it('should return empty array when no achievements unlocked', () => {
      const state = createTestAchievementState();
      expect(getClaimableAchievements(state)).toEqual([]);
    });

    it('should return unlocked but unclaimed achievements', () => {
      const state = createTestAchievementState();
      state.achievements['firstHarvest'].unlocked = true;
      state.achievements['firstThousand'].unlocked = true;
      state.achievements['firstThousand'].claimed = true;

      const claimable = getClaimableAchievements(state);

      expect(claimable.length).toBe(1);
      expect(claimable[0].id).toBe('firstHarvest');
    });
  });

  describe('getUnclaimedAchievementCount', () => {
    it('should return count of claimable achievements', () => {
      const state = createTestAchievementState();
      state.achievements['firstHarvest'].unlocked = true;
      state.achievements['firstThousand'].unlocked = true;

      expect(getUnclaimedAchievementCount(state)).toBe(2);
    });
  });

  describe('getUnlockedAchievementCount', () => {
    it('should return count of unlocked achievements', () => {
      const state = createTestAchievementState();
      state.achievements['firstHarvest'].unlocked = true;
      state.achievements['firstThousand'].unlocked = true;
      state.achievements['firstThousand'].claimed = true;

      expect(getUnlockedAchievementCount(state)).toBe(2);
    });
  });

  describe('getTotalAchievementCount', () => {
    it('should return total number of achievements', () => {
      expect(getTotalAchievementCount()).toBe(ALL_ACHIEVEMENT_IDS.length);
    });
  });

  describe('getAchievementsWithProgress', () => {
    it('should return all achievements with progress info', () => {
      const state = createTestAchievementState();
      state.achievements['firstHarvest'].progress = 50;

      const achievements = getAchievementsWithProgress(state);

      expect(achievements.length).toBe(ALL_ACHIEVEMENT_IDS.length);

      const firstHarvest = achievements.find(a => a.achievement.id === 'firstHarvest');
      expect(firstHarvest?.progress).toBe(50);
      expect(firstHarvest?.percent).toBe(50);
      expect(firstHarvest?.unlocked).toBe(false);
    });

    it('should filter by category', () => {
      const state = createTestAchievementState();
      const productionAchievements = getAchievementsWithProgress(state, 'production');

      expect(productionAchievements.every(a => a.achievement.category === 'production')).toBe(true);
    });

    it('should mark hidden achievements as not visible until unlocked', () => {
      const state = createTestAchievementState();
      const achievements = getAchievementsWithProgress(state);

      const billionaire = achievements.find(a => a.achievement.id === 'billionaire');
      expect(billionaire?.visible).toBe(false);

      // Unlock it
      state.achievements['billionaire'].unlocked = true;
      const achievementsAfter = getAchievementsWithProgress(state);
      const billionaireAfter = achievementsAfter.find(a => a.achievement.id === 'billionaire');
      expect(billionaireAfter?.visible).toBe(true);
    });
  });

  describe('getCategoryStats', () => {
    it('should return stats for all categories', () => {
      const state = createTestAchievementState();
      const stats = getCategoryStats(state);

      expect(stats.length).toBe(5); // 5 categories

      const productionStats = stats.find(s => s.category === 'production');
      expect(productionStats).toBeDefined();
      expect(productionStats?.unlocked).toBe(0);
      expect(productionStats?.total).toBeGreaterThan(0);
    });

    it('should update unlocked counts correctly', () => {
      const state = createTestAchievementState();
      state.achievements['firstHarvest'].unlocked = true;

      const stats = getCategoryStats(state);
      const productionStats = stats.find(s => s.category === 'production');

      expect(productionStats?.unlocked).toBe(1);
    });
  });
});
