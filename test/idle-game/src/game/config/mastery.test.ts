import { describe, it, expect } from 'vitest';
import {
  MASTERY_PER_HARVEST,
  MAX_MASTERY,
  MASTERY_BONUS_PER_LEVEL,
  MASTERY_MILESTONES,
  TOTAL_MASTERY_MILESTONES,
  getMasteryProductionBonus,
  getMasterySellBonus,
  getMasteryGain,
  getUnlockedMilestones,
  getNextMilestone,
  getTotalMasteryBonus,
} from './mastery';

describe('Mastery Config', () => {
  describe('getMasteryProductionBonus', () => {
    it('returns 0 for 0 mastery', () => {
      expect(getMasteryProductionBonus(0)).toBe(0);
    });

    it('returns correct bonus per level', () => {
      expect(getMasteryProductionBonus(10)).toBe(10 * MASTERY_BONUS_PER_LEVEL.production);
      expect(getMasteryProductionBonus(50)).toBe(50 * MASTERY_BONUS_PER_LEVEL.production);
    });

    it('returns max bonus at max mastery', () => {
      const maxBonus = MAX_MASTERY * MASTERY_BONUS_PER_LEVEL.production;
      expect(getMasteryProductionBonus(MAX_MASTERY)).toBe(maxBonus);
      expect(maxBonus).toBe(0.5); // 50% max bonus
    });
  });

  describe('getMasterySellBonus', () => {
    it('returns correct sell bonus', () => {
      expect(getMasterySellBonus(0)).toBe(0);
      expect(getMasterySellBonus(100)).toBe(100 * MASTERY_BONUS_PER_LEVEL.sellValue);
    });
  });

  describe('getMasteryGain', () => {
    it('returns tier-based gain', () => {
      expect(getMasteryGain(1, 0)).toBe(MASTERY_PER_HARVEST[1]);
      expect(getMasteryGain(6, 0)).toBe(MASTERY_PER_HARVEST[6]);
    });

    it('caps at max mastery', () => {
      expect(getMasteryGain(6, 95)).toBe(5); // Only 5 to reach 100
      expect(getMasteryGain(1, 100)).toBe(0); // Already at max
    });
  });

  describe('getUnlockedMilestones', () => {
    it('returns empty array at 0', () => {
      expect(getUnlockedMilestones(0)).toEqual([]);
    });

    it('returns milestones up to current level', () => {
      const at10 = getUnlockedMilestones(10);
      expect(at10.length).toBe(1);
      expect(at10[0].level).toBe(10);

      const at50 = getUnlockedMilestones(50);
      expect(at50.length).toBe(3); // 10, 25, 50
    });

    it('returns all milestones at max', () => {
      expect(getUnlockedMilestones(100).length).toBe(MASTERY_MILESTONES.length);
    });
  });

  describe('getNextMilestone', () => {
    it('returns first milestone at 0', () => {
      const next = getNextMilestone(0);
      expect(next?.level).toBe(10);
    });

    it('returns next unclaimed milestone', () => {
      expect(getNextMilestone(10)?.level).toBe(25);
      expect(getNextMilestone(25)?.level).toBe(50);
    });

    it('returns null at max', () => {
      expect(getNextMilestone(100)).toBeNull();
    });
  });

  describe('getTotalMasteryBonus', () => {
    it('returns 0 below first milestone', () => {
      expect(getTotalMasteryBonus(50, 'productionMultiplier')).toBe(0);
    });

    it('returns cumulative bonus', () => {
      // At 500: should have 100 and 500 production bonuses
      const bonus = getTotalMasteryBonus(500, 'productionMultiplier');
      expect(bonus).toBe(0.05 + 0.1); // 5% + 10%
    });

    it('returns correct bonus type', () => {
      expect(getTotalMasteryBonus(250, 'sellMultiplier')).toBe(0.1);
      expect(getTotalMasteryBonus(750, 'essenceMultiplier')).toBe(0.15);
    });
  });

  describe('Config values', () => {
    it('has increasing mastery per harvest by tier', () => {
      let prev = 0;
      for (let tier = 1; tier <= 6; tier++) {
        expect(MASTERY_PER_HARVEST[tier]).toBeGreaterThan(prev);
        prev = MASTERY_PER_HARVEST[tier];
      }
    });

    it('has ascending milestones', () => {
      let prev = 0;
      for (const milestone of MASTERY_MILESTONES) {
        expect(milestone.level).toBeGreaterThan(prev);
        prev = milestone.level;
      }
    });

    it('has ascending total mastery milestones', () => {
      let prev = 0;
      for (const milestone of TOTAL_MASTERY_MILESTONES) {
        expect(milestone.total).toBeGreaterThan(prev);
        prev = milestone.total;
      }
    });
  });
});
