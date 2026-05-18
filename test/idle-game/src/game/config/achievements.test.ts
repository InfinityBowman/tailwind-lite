/**
 * Achievement Configuration Tests
 *
 * Validates achievement definitions are well-formed and
 * early-game milestones exist for good pacing.
 */

import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENT_DEFINITIONS,
  ALL_ACHIEVEMENT_IDS,
  getAchievementsByCategory,
  getAchievementsByTier,
  ACHIEVEMENT_CATEGORIES,
} from './achievements';

describe('Achievement Definitions', () => {
  describe('structure validation', () => {
    it('should have all required fields', () => {
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        expect(def.id).toBe(id);
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.target).toBeGreaterThan(0);
        expect(def.reward).toBeDefined();
        expect(def.icon).toBeDefined();
        expect(def.tier).toBeDefined();
        expect(def.trackingEvent).toBeDefined();
      });
    });

    it('should have valid categories', () => {
      const validCategories = Object.keys(ACHIEVEMENT_CATEGORIES);
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        expect(validCategories).toContain(def.category);
      });
    });

    it('should have valid tiers', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'none'];
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        expect(validTiers).toContain(def.tier);
      });
    });

    it('should use Lucide icon names (no emojis)', () => {
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        // Lucide icons are PascalCase, no emoji characters
        expect(def.icon).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('early-game micro-milestones', () => {
    it('should have firstExport achievement at 100 credits', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstExport;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(100);
      expect(achievement.trackingEvent).toBe('creditsEarned');
    });

    it('should have earlyBird achievement at 250 credits', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.earlyBird;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(250);
      expect(achievement.trackingEvent).toBe('creditsEarned');
    });

    it('should have makingProgress achievement at 500 credits', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.makingProgress;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(500);
      expect(achievement.trackingEvent).toBe('creditsEarned');
    });

    it('should have firstThousand achievement at 1000 credits', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstThousand;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(1000);
      expect(achievement.trackingEvent).toBe('creditsEarned');
    });

    it('should have credit milestones in increasing order', () => {
      const creditAchievements = ['firstExport', 'earlyBird', 'makingProgress', 'firstThousand'];
      const targets = creditAchievements.map(id => ACHIEVEMENT_DEFINITIONS[id].target);

      for (let i = 1; i < targets.length; i++) {
        expect(targets[i]).toBeGreaterThan(targets[i - 1]);
      }
    });

    it('should have firstGacha achievement', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstGacha;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(1);
      expect(achievement.trackingEvent).toBe('gachaPulls');
    });

    it('should have firstFusion achievement', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstFusion;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(1);
      expect(achievement.trackingEvent).toBe('seedsFused');
    });

    it('should have firstResearch achievement', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstResearch;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(1);
      expect(achievement.trackingEvent).toBe('researchCompleted');
    });

    it('should have firstPrestige achievement', () => {
      const achievement = ACHIEVEMENT_DEFINITIONS.firstPrestige;
      expect(achievement).toBeDefined();
      expect(achievement.target).toBe(1);
      expect(achievement.trackingEvent).toBe('prestigeCount');
    });
  });

  describe('reward validation', () => {
    it('should have positive reward amounts', () => {
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        expect(def.reward.amount).toBeGreaterThan(0);
      });
    });

    it('should have valid reward types', () => {
      const validTypes = ['credits', 'crystals', 'essence', 'refinedEssence', 'title'];
      ALL_ACHIEVEMENT_IDS.forEach(id => {
        const def = ACHIEVEMENT_DEFINITIONS[id];
        expect(validTypes).toContain(def.reward.type);
      });
    });

    it('should scale rewards appropriately for early achievements', () => {
      // Early achievements should give smaller rewards
      expect(ACHIEVEMENT_DEFINITIONS.firstExport.reward.amount).toBeLessThan(100);
      expect(ACHIEVEMENT_DEFINITIONS.earlyBird.reward.amount).toBeLessThan(100);
      expect(ACHIEVEMENT_DEFINITIONS.makingProgress.reward.amount).toBeLessThan(100);
    });
  });

  describe('helper functions', () => {
    it('getAchievementsByCategory should return achievements in category', () => {
      const wealthAchievements = getAchievementsByCategory('wealth');
      expect(wealthAchievements.length).toBeGreaterThan(0);
      wealthAchievements.forEach(a => {
        expect(a.category).toBe('wealth');
      });
    });

    it('getAchievementsByTier should return achievements of tier', () => {
      const bronzeAchievements = getAchievementsByTier('bronze');
      expect(bronzeAchievements.length).toBeGreaterThan(0);
      bronzeAchievements.forEach(a => {
        expect(a.tier).toBe('bronze');
      });
    });
  });

  describe('early-game pacing', () => {
    it('should have achievements earnable in first 5 minutes', () => {
      // These should be achievable very quickly
      const earlyAchievements = [
        'firstExport',
        'firstGacha',
        'firstHarvest', // 100 plants sold
      ];

      earlyAchievements.forEach(id => {
        expect(ACHIEVEMENT_DEFINITIONS[id]).toBeDefined();
        expect(ACHIEVEMENT_DEFINITIONS[id].target).toBeLessThanOrEqual(100);
      });
    });

    it('should have achievements earnable in first 20 minutes', () => {
      // These should be achievable within 20 minutes
      const midEarlyAchievements = ['earlyBird', 'makingProgress', 'firstFusion', 'firstThousand'];

      midEarlyAchievements.forEach(id => {
        expect(ACHIEVEMENT_DEFINITIONS[id]).toBeDefined();
        expect(ACHIEVEMENT_DEFINITIONS[id].target).toBeLessThanOrEqual(1000);
      });
    });
  });
});
