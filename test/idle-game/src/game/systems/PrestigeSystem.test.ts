/**
 * Prestige System Tests
 */

import { describe, it, expect } from 'vitest';
import { canPrestige, getAllBonusesWithState, getProjectedPrestigePoints } from './PrestigeSystem';
import { PRESTIGE_CONFIG, PRESTIGE_BONUSES } from '../config/prestige';

describe('PrestigeSystem', () => {
  describe('canPrestige', () => {
    it('should not allow prestige below minimum credits', () => {
      const result = canPrestige(1000);
      expect(result.canPrestige).toBe(false);
      expect(result.reason).toContain('50,000');
      expect(result.potentialPoints).toBe(0);
    });

    it('should allow prestige at minimum credits', () => {
      const result = canPrestige(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE);
      expect(result.canPrestige).toBe(true);
      expect(result.potentialPoints).toBeGreaterThan(0);
    });

    it('should give more points for more credits', () => {
      const result1 = canPrestige(50000);
      const result2 = canPrestige(100000);
      expect(result2.potentialPoints).toBeGreaterThan(result1.potentialPoints);
    });

    it('should calculate correct points using sqrt formula with magnitude bonus', () => {
      const result = canPrestige(50000);
      expect(result.potentialPoints).toBe(7);

      const result2 = canPrestige(100000);
      expect(result2.potentialPoints).toBe(11);
    });
  });

  describe('getAllBonusesWithState', () => {
    it('should return all bonuses with their state', () => {
      const bonuses = getAllBonusesWithState({});

      expect(bonuses.length).toBe(Object.keys(PRESTIGE_BONUSES).length);

      const startingWealth = bonuses.find(b => b.bonus.id === 'startingWealth');
      expect(startingWealth).toBeDefined();
      expect(startingWealth!.currentLevel).toBe(0);
      expect(startingWealth!.currentValue).toBe(0);
      expect(startingWealth!.isMaxed).toBe(false);
      expect(startingWealth!.nextCost).toBe(1);
    });

    it('should show current level and value', () => {
      const bonuses = getAllBonusesWithState({ startingWealth: 5 });

      const startingWealth = bonuses.find(b => b.bonus.id === 'startingWealth');
      expect(startingWealth!.currentLevel).toBe(5);
      expect(startingWealth!.currentValue).toBe(2500); // 500 * 5
    });

    it('should mark maxed bonuses', () => {
      const maxLevel = PRESTIGE_BONUSES['startingWealth'].maxLevel;
      const bonuses = getAllBonusesWithState({ startingWealth: maxLevel });

      const startingWealth = bonuses.find(b => b.bonus.id === 'startingWealth');
      expect(startingWealth!.isMaxed).toBe(true);
      expect(startingWealth!.nextCost).toBeNull();
    });
  });

  describe('getProjectedPrestigePoints', () => {
    it('should return 0 below minimum', () => {
      expect(getProjectedPrestigePoints(5000)).toBe(0);
      expect(getProjectedPrestigePoints(49999)).toBe(0);
    });

    it('should calculate points correctly with magnitude bonuses', () => {
      expect(getProjectedPrestigePoints(50000)).toBe(7);
      expect(getProjectedPrestigePoints(100000)).toBe(11);
      expect(getProjectedPrestigePoints(1000000)).toBe(35);
    });
  });
});
