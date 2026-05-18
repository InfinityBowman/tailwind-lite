import { describe, it, expect } from 'vitest';
import {
  MYSTERIOUS_BONUSES,
  createInitialMysteriousBonusState,
  calculateBonusResetTime,
  rollNewBonus,
  checkMysteriousBonus,
  getMysteriousBonusValue,
  getMysteriousBonusInfo,
  getBonusDisplayName,
} from './MysteriousBonusSystem';
import { MysteriousBonusState } from '../state/GameState';

describe('MysteriousBonusSystem', () => {
  describe('createInitialMysteriousBonusState', () => {
    it('should create state with no active bonus', () => {
      const state = createInitialMysteriousBonusState();
      expect(state.currentBonus).toBeNull();
      expect(state.resetTime).toBe(0);
    });
  });

  describe('calculateBonusResetTime', () => {
    it('should return midnight tomorrow', () => {
      const now = new Date('2026-02-01T15:30:00');
      const resetTime = calculateBonusResetTime(now);
      const resetDate = new Date(resetTime);

      expect(resetDate.getFullYear()).toBe(2026);
      expect(resetDate.getMonth()).toBe(1); // February (0-indexed)
      expect(resetDate.getDate()).toBe(2);
      expect(resetDate.getHours()).toBe(0);
      expect(resetDate.getMinutes()).toBe(0);
      expect(resetDate.getSeconds()).toBe(0);
    });

    it('should handle end of month', () => {
      const now = new Date('2026-01-31T23:59:59');
      const resetTime = calculateBonusResetTime(now);
      const resetDate = new Date(resetTime);

      expect(resetDate.getMonth()).toBe(1); // February
      expect(resetDate.getDate()).toBe(1);
    });

    it('should handle year boundary (Dec 31 -> Jan 1)', () => {
      const now = new Date('2026-12-31T23:59:59');
      const resetTime = calculateBonusResetTime(now);
      const resetDate = new Date(resetTime);

      expect(resetDate.getFullYear()).toBe(2027);
      expect(resetDate.getMonth()).toBe(0); // January
      expect(resetDate.getDate()).toBe(1);
    });

    it('should handle leap year (Feb 28 -> Feb 29 in leap year)', () => {
      const now = new Date('2028-02-28T12:00:00'); // 2028 is a leap year
      const resetTime = calculateBonusResetTime(now);
      const resetDate = new Date(resetTime);

      expect(resetDate.getMonth()).toBe(1); // Still February
      expect(resetDate.getDate()).toBe(29);
    });
  });

  describe('rollNewBonus', () => {
    it('should roll a bonus from the available list', () => {
      const state = rollNewBonus(() => 0.5);
      expect(state.currentBonus).not.toBeNull();
      expect(MYSTERIOUS_BONUSES).toContain(state.currentBonus);
    });

    it('should set reset time to midnight tomorrow', () => {
      const now = new Date('2026-02-01T12:00:00');
      const state = rollNewBonus(() => 0, now);

      const resetDate = new Date(state.resetTime);
      expect(resetDate.getDate()).toBe(2);
      expect(resetDate.getHours()).toBe(0);
    });

    it('should select correct bonus based on random value', () => {
      // First bonus (index 0)
      expect(rollNewBonus(() => 0).currentBonus).toBe('PRODUCTION_BOOST');
      // Last bonus (index 5)
      expect(rollNewBonus(() => 0.99).currentBonus).toBe('FUSION_DISCOUNT');
    });
  });

  describe('checkMysteriousBonus', () => {
    it('should clear bonus if Gold Planet not unlocked', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() + 100000,
      };

      const result = checkMysteriousBonus(state, false);
      expect(result).not.toBeNull();
      expect(result?.currentBonus).toBeNull();
      expect(result?.resetTime).toBe(0);
    });

    it('should return null if Gold Planet not unlocked and bonus already cleared', () => {
      const state = createInitialMysteriousBonusState();
      const result = checkMysteriousBonus(state, false);
      expect(result).toBeNull();
    });

    it('should roll new bonus if none active and Gold Planet unlocked', () => {
      const state = createInitialMysteriousBonusState();
      const result = checkMysteriousBonus(state, true, Date.now(), () => 0.5);

      expect(result).not.toBeNull();
      expect(result?.currentBonus).not.toBeNull();
    });

    it('should roll new bonus if reset time passed', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() - 1000, // Past
      };

      const result = checkMysteriousBonus(state, true, Date.now(), () => 0.99);
      expect(result).not.toBeNull();
      // Should be a different bonus (FUSION_DISCOUNT at index 5)
      expect(result?.currentBonus).toBe('FUSION_DISCOUNT');
    });

    it('should return null if bonus active and not expired', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() + 100000, // Future
      };

      const result = checkMysteriousBonus(state, true);
      expect(result).toBeNull();
    });

    it('should re-roll at exact reset time (now === resetTime)', () => {
      const now = Date.now();
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: now, // Exact boundary
      };

      const result = checkMysteriousBonus(state, true, now, () => 0.5);
      expect(result).not.toBeNull();
      // Should have new bonus (re-rolled because now >= resetTime)
      expect(result?.currentBonus).not.toBeNull();
      expect(result?.resetTime).toBeGreaterThan(now);
    });

    it('can roll the same bonus twice in a row (intentional behavior)', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() - 1000, // Past
      };

      // Random returns 0, which maps to PRODUCTION_BOOST again
      const result = checkMysteriousBonus(state, true, Date.now(), () => 0);
      expect(result).not.toBeNull();
      expect(result?.currentBonus).toBe('PRODUCTION_BOOST'); // Same bonus is allowed
    });
  });

  describe('getMysteriousBonusValue', () => {
    it('should return 0 if bonus type not active', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() + 100000,
      };

      expect(getMysteriousBonusValue(state, 'GACHA_DISCOUNT')).toBe(0);
      expect(getMysteriousBonusValue(state, 'ESSENCE_BOOST')).toBe(0);
    });

    it('should return 0 if no bonus active', () => {
      const state = createInitialMysteriousBonusState();
      expect(getMysteriousBonusValue(state, 'PRODUCTION_BOOST')).toBe(0);
    });

    it('should return correct value for PRODUCTION_BOOST', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'PRODUCTION_BOOST',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'PRODUCTION_BOOST')).toBe(0.25);
    });

    it('should return correct value for GACHA_DISCOUNT', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'GACHA_DISCOUNT',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'GACHA_DISCOUNT')).toBe(0.25);
    });

    it('should return correct value for ESSENCE_BOOST', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'ESSENCE_BOOST',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'ESSENCE_BOOST')).toBe(0.5);
    });

    it('should return correct value for STORAGE_BOOST', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'STORAGE_BOOST',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'STORAGE_BOOST')).toBe(0.5);
    });

    it('should return correct value for REFINE_BOOST', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'REFINE_BOOST',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'REFINE_BOOST')).toBe(0.5);
    });

    it('should return correct value for FUSION_DISCOUNT', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'FUSION_DISCOUNT',
        resetTime: Date.now() + 100000,
      };
      expect(getMysteriousBonusValue(state, 'FUSION_DISCOUNT')).toBe(0.25);
    });
  });

  describe('getMysteriousBonusInfo', () => {
    it('should return current bonus and reset time', () => {
      const state: MysteriousBonusState = {
        currentBonus: 'STORAGE_BOOST',
        resetTime: 12345,
      };

      const info = getMysteriousBonusInfo(state);
      expect(info.bonus).toBe('STORAGE_BOOST');
      expect(info.resetTime).toBe(12345);
    });

    it('should return null bonus when none active', () => {
      const state = createInitialMysteriousBonusState();
      const info = getMysteriousBonusInfo(state);
      expect(info.bonus).toBeNull();
      expect(info.resetTime).toBe(0);
    });
  });

  describe('getBonusDisplayName', () => {
    it('should return correct display names', () => {
      expect(getBonusDisplayName('PRODUCTION_BOOST')).toBe('Production Boost (+25%)');
      expect(getBonusDisplayName('GACHA_DISCOUNT')).toBe('Gacha Discount (-25%)');
      expect(getBonusDisplayName('ESSENCE_BOOST')).toBe('Essence Boost (+50%)');
      expect(getBonusDisplayName('STORAGE_BOOST')).toBe('Storage Boost (+50%)');
      expect(getBonusDisplayName('REFINE_BOOST')).toBe('Refine Boost (+50%)');
      expect(getBonusDisplayName('FUSION_DISCOUNT')).toBe('Fusion Discount (-25%)');
    });
  });
});
