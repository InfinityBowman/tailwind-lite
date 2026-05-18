/**
 * Mastery System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialMasteryState,
  getXpForLevel,
  getTotalXpForLevel,
  getSeedMastery,
  addMasteryXp,
  getSeedMasteryBonuses,
  getGlobalMasteryBonuses,
  getMasteryProgress,
  getPoolProgress,
  getNextCheckpoint,
  getSeedsByMastery,
  hasMilestone,
  MASTERY_CONFIG,
  type MasteryState,
} from './MasterySystem';

describe('MasterySystem', () => {
  let state: MasteryState;

  beforeEach(() => {
    state = createInitialMasteryState();
  });

  describe('createInitialMasteryState', () => {
    it('should create empty mastery state', () => {
      expect(state.seedMasteries).toEqual({});
      expect(state.globalPool).toBe(0);
      expect(state.globalPoolMax).toBe(MASTERY_CONFIG.globalPoolBaseSize);
      expect(state.totalMasteryLevel).toBe(0);
    });

    it('should initialize pool checkpoints as unclaimed', () => {
      expect(state.poolCheckpoints.length).toBe(5);
      expect(state.poolCheckpoints.every(cp => !cp.claimed)).toBe(true);
    });
  });

  describe('getXpForLevel', () => {
    it('should return 0 for level 0', () => {
      expect(getXpForLevel(0)).toBe(0);
    });

    it('should return base XP for level 1', () => {
      expect(getXpForLevel(1)).toBe(MASTERY_CONFIG.baseXpPerLevel);
    });

    it('should scale XP for higher levels', () => {
      const level1 = getXpForLevel(1);
      const level2 = getXpForLevel(2);
      expect(level2).toBeGreaterThan(level1);
    });
  });

  describe('getTotalXpForLevel', () => {
    it('should return 0 for level 0', () => {
      expect(getTotalXpForLevel(0)).toBe(0);
    });

    it('should return base XP for level 1', () => {
      expect(getTotalXpForLevel(1)).toBe(MASTERY_CONFIG.baseXpPerLevel);
    });

    it('should accumulate XP for higher levels', () => {
      const total5 = getTotalXpForLevel(5);
      const total4 = getTotalXpForLevel(4);
      expect(total5).toBe(total4 + getXpForLevel(5));
    });
  });

  describe('getSeedMastery', () => {
    it('should create new mastery entry if not exists', () => {
      const mastery = getSeedMastery(state, 'wheat');
      expect(mastery.seedId).toBe('wheat');
      expect(mastery.level).toBe(0);
      expect(mastery.xp).toBe(0);
    });

    it('should return existing mastery', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 5,
        xp: 50,
        totalXp: 500,
      };
      const mastery = getSeedMastery(state, 'wheat');
      expect(mastery.level).toBe(5);
    });
  });

  describe('addMasteryXp', () => {
    it('should add XP to seed mastery', () => {
      const result = addMasteryXp(state, 'wheat', 50);
      expect(result.newState.seedMasteries['wheat'].xp).toBe(50);
      expect(result.newState.seedMasteries['wheat'].totalXp).toBe(50);
    });

    it('should level up when enough XP', () => {
      const xpNeeded = getXpForLevel(1);
      const result = addMasteryXp(state, 'wheat', xpNeeded);
      expect(result.newState.seedMasteries['wheat'].level).toBe(1);
      expect(result.levelUps.length).toBe(1);
      expect(result.levelUps[0].newLevel).toBe(1);
    });

    it('should handle multiple level ups', () => {
      const xpFor3Levels = getTotalXpForLevel(3);
      const result = addMasteryXp(state, 'wheat', xpFor3Levels);
      expect(result.newState.seedMasteries['wheat'].level).toBe(3);
      expect(result.levelUps.length).toBe(3);
    });

    it('should update total mastery level', () => {
      const xpNeeded = getXpForLevel(1);
      let result = addMasteryXp(state, 'wheat', xpNeeded);
      result = addMasteryXp(result.newState, 'corn', xpNeeded);
      expect(result.newState.totalMasteryLevel).toBe(2);
    });

    it('should cap at max level', () => {
      // Set seed to one below max level
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: MASTERY_CONFIG.maxLevel - 1,
        xp: 0,
        totalXp: 0,
      };
      // Use XP far exceeding what's needed for final level (exponential scaling means level 99 needs billions)
      const hugeXp = Number.MAX_SAFE_INTEGER;
      const result = addMasteryXp(state, 'wheat', hugeXp);
      expect(result.newState.seedMasteries['wheat'].level).toBe(MASTERY_CONFIG.maxLevel);
    });

    it('should add excess XP to global pool at max level', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: MASTERY_CONFIG.maxLevel,
        xp: 0,
        totalXp: 0,
      };
      const result = addMasteryXp(state, 'wheat', 100);
      expect(result.poolGain).toBeGreaterThan(0);
      expect(result.newState.globalPool).toBeGreaterThan(0);
    });
  });

  describe('getSeedMasteryBonuses', () => {
    it('should return no bonuses at level 0', () => {
      const bonuses = getSeedMasteryBonuses(state, 'wheat');
      expect(bonuses.productionBonus).toBe(0);
      expect(bonuses.sellValueBonus).toBe(0);
      expect(bonuses.hasGoldenFrame).toBe(false);
    });

    it('should return production bonus at level 25', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 25,
        xp: 0,
        totalXp: 0,
      };
      const bonuses = getSeedMasteryBonuses(state, 'wheat');
      expect(bonuses.productionBonus).toBe(0.1);
    });

    it('should return sell bonus at level 50', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 50,
        xp: 0,
        totalXp: 0,
      };
      const bonuses = getSeedMasteryBonuses(state, 'wheat');
      expect(bonuses.sellValueBonus).toBe(0.05);
    });

    it('should return fusion bonus at level 75', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 75,
        xp: 0,
        totalXp: 0,
      };
      const bonuses = getSeedMasteryBonuses(state, 'wheat');
      expect(bonuses.fusionTierBonus).toBe(1);
    });

    it('should return golden frame at level 99', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 99,
        xp: 0,
        totalXp: 0,
      };
      const bonuses = getSeedMasteryBonuses(state, 'wheat');
      expect(bonuses.hasGoldenFrame).toBe(true);
      expect(bonuses.productionBonus).toBeGreaterThan(0.1); // 10% + 100%
    });
  });

  describe('getGlobalMasteryBonuses', () => {
    it('should return no bonuses with no checkpoints', () => {
      const bonuses = getGlobalMasteryBonuses(state);
      expect(bonuses.productionBonus).toBe(0);
    });

    it('should return bonuses for claimed checkpoints', () => {
      state.poolCheckpoints[0].claimed = true; // 10% - production
      const bonuses = getGlobalMasteryBonuses(state);
      expect(bonuses.productionBonus).toBe(0.02);
    });
  });

  describe('getMasteryProgress', () => {
    it('should return 0 for new seed', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 0,
        xp: 0,
        totalXp: 0,
      };
      const progress = getMasteryProgress(state, 'wheat');
      expect(progress).toBe(0);
    });

    it('should return progress toward next level', () => {
      const xpNeeded = getXpForLevel(1);
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: 0,
        xp: xpNeeded / 2,
        totalXp: xpNeeded / 2,
      };
      const progress = getMasteryProgress(state, 'wheat');
      expect(progress).toBe(0.5);
    });

    it('should return 1 at max level', () => {
      state.seedMasteries['wheat'] = {
        seedId: 'wheat',
        level: MASTERY_CONFIG.maxLevel,
        xp: 0,
        totalXp: 0,
      };
      const progress = getMasteryProgress(state, 'wheat');
      expect(progress).toBe(1);
    });
  });

  describe('getPoolProgress', () => {
    it('should return 0 for empty pool', () => {
      expect(getPoolProgress(state)).toBe(0);
    });

    it('should return correct progress', () => {
      state.globalPool = state.globalPoolMax / 2;
      expect(getPoolProgress(state)).toBe(0.5);
    });
  });

  describe('getNextCheckpoint', () => {
    it('should return first checkpoint when none claimed', () => {
      const next = getNextCheckpoint(state);
      expect(next?.percentage).toBe(10);
    });

    it('should return next unclaimed checkpoint', () => {
      state.poolCheckpoints[0].claimed = true;
      const next = getNextCheckpoint(state);
      expect(next?.percentage).toBe(25);
    });

    it('should return null when all claimed', () => {
      state.poolCheckpoints.forEach(cp => (cp.claimed = true));
      const next = getNextCheckpoint(state);
      expect(next).toBeNull();
    });
  });

  describe('getSeedsByMastery', () => {
    it('should return empty array for no seeds', () => {
      expect(getSeedsByMastery(state)).toEqual([]);
    });

    it('should sort by level descending', () => {
      state.seedMasteries['wheat'] = { seedId: 'wheat', level: 5, xp: 0, totalXp: 0 };
      state.seedMasteries['corn'] = { seedId: 'corn', level: 10, xp: 0, totalXp: 0 };
      state.seedMasteries['rice'] = { seedId: 'rice', level: 3, xp: 0, totalXp: 0 };

      const sorted = getSeedsByMastery(state);
      expect(sorted[0].seedId).toBe('corn');
      expect(sorted[1].seedId).toBe('wheat');
      expect(sorted[2].seedId).toBe('rice');
    });
  });

  describe('hasMilestone', () => {
    it('should return false for seed below milestone', () => {
      state.seedMasteries['wheat'] = { seedId: 'wheat', level: 20, xp: 0, totalXp: 0 };
      expect(hasMilestone(state, 'wheat', 25)).toBe(false);
    });

    it('should return true for seed at or above milestone', () => {
      state.seedMasteries['wheat'] = { seedId: 'wheat', level: 25, xp: 0, totalXp: 0 };
      expect(hasMilestone(state, 'wheat', 25)).toBe(true);
    });

    it('should return false for unknown seed', () => {
      expect(hasMilestone(state, 'unknown', 25)).toBe(false);
    });
  });
});
