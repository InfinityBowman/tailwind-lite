import { describe, it, expect } from 'vitest';
import {
  PRESTIGE_CONFIG,
  PRESTIGE_BONUSES,
  MAGNITUDE_BONUSES,
  getMagnitudeBonus,
  getNextMagnitudeBonus,
  calculateBasePrestigePoints,
  calculatePrestigePoints,
  getPrestigePointBreakdown,
  getPrestigeBonusCost,
  getPrestigeBonusValue,
} from './prestige';

describe('Prestige Config', () => {
  describe('No NaN or Infinity values', () => {
    it('PRESTIGE_CONFIG has no NaN or Infinity', () => {
      expect(Number.isFinite(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE)).toBe(true);
      expect(Number.isFinite(PRESTIGE_CONFIG.CREDITS_PER_POINT_BASE)).toBe(true);
      expect(Number.isFinite(PRESTIGE_CONFIG.MAX_PRESTIGE_LEVEL)).toBe(true);
    });

    it('PRESTIGE_BONUSES has no NaN or Infinity', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(Number.isFinite(bonus.baseValue), `${key}.baseValue`).toBe(true);
        expect(Number.isFinite(bonus.maxLevel), `${key}.maxLevel`).toBe(true);
        expect(Number.isFinite(bonus.costPerLevel), `${key}.costPerLevel`).toBe(true);
      }
    });

    it('MAGNITUDE_BONUSES has no NaN or Infinity', () => {
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(Number.isFinite(bonus.threshold), `${bonus.label}.threshold`).toBe(true);
        expect(Number.isFinite(bonus.bonusPercent), `${bonus.label}.bonusPercent`).toBe(true);
      }
    });
  });

  describe('All costs are positive', () => {
    it('PRESTIGE_CONFIG has positive values', () => {
      expect(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE).toBeGreaterThan(0);
      expect(PRESTIGE_CONFIG.CREDITS_PER_POINT_BASE).toBeGreaterThan(0);
      expect(PRESTIGE_CONFIG.MAX_PRESTIGE_LEVEL).toBeGreaterThan(0);
    });

    it('PRESTIGE_BONUSES have positive costs and values', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(bonus.costPerLevel, `${key}.costPerLevel`).toBeGreaterThan(0);
        expect(bonus.maxLevel, `${key}.maxLevel`).toBeGreaterThan(0);
        expect(bonus.baseValue, `${key}.baseValue`).toBeGreaterThan(0);
      }
    });

    it('MAGNITUDE_BONUSES have positive thresholds and percentages', () => {
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(bonus.threshold, `${bonus.label}.threshold`).toBeGreaterThan(0);
        expect(bonus.bonusPercent, `${bonus.label}.bonusPercent`).toBeGreaterThan(0);
      }
    });
  });

  describe('Prestige thresholds increase monotonically', () => {
    it('MAGNITUDE_BONUSES thresholds increase with each entry', () => {
      let prevThreshold = 0;
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(bonus.threshold).toBeGreaterThan(prevThreshold);
        prevThreshold = bonus.threshold;
      }
    });

    it('MAGNITUDE_BONUSES bonus percentages increase with each entry', () => {
      let prevBonusPercent = 0;
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(bonus.bonusPercent).toBeGreaterThan(prevBonusPercent);
        prevBonusPercent = bonus.bonusPercent;
      }
    });
  });

  describe('Bonus multipliers are in reasonable ranges', () => {
    it('MAGNITUDE_BONUSES percentages are between 0 and 1', () => {
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(bonus.bonusPercent).toBeGreaterThan(0);
        expect(bonus.bonusPercent).toBeLessThanOrEqual(1);
      }
    });

    it('PRESTIGE_BONUSES base values are reasonable', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        // All bonus base values should be positive and not excessively large
        expect(bonus.baseValue, `${key}.baseValue`).toBeGreaterThan(0);
        expect(bonus.baseValue, `${key}.baseValue`).toBeLessThanOrEqual(1000);
      }
    });

    it('percentage-based bonuses have values less than or equal to 1', () => {
      const percentageBonuses = [
        'PRODUCTION_MULT',
        'GACHA_LUCK',
        'EXPORT_SPEED',
        'RESEARCH_DISCOUNT',
        'SEED_POWER',
      ];
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        if (percentageBonuses.includes(bonus.effect)) {
          expect(bonus.baseValue, `${key}.baseValue (${bonus.effect})`).toBeLessThanOrEqual(1);
        }
      }
    });

    it('max level multiplied by base value produces reasonable totals', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        const maxEffect = bonus.baseValue * bonus.maxLevel;
        // Even at max level, effects should not exceed 1000x
        expect(maxEffect, `${key} max effect`).toBeLessThanOrEqual(10000);
      }
    });
  });

  describe('Prestige bonus structure validation', () => {
    it('all bonuses have matching id and key', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(bonus.id).toBe(key);
      }
    });

    it('all bonuses have non-empty names', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(typeof bonus.name).toBe('string');
        expect(bonus.name.length, `${key}.name`).toBeGreaterThan(0);
      }
    });

    it('all bonuses have non-empty descriptions', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(typeof bonus.description).toBe('string');
        expect(bonus.description.length, `${key}.description`).toBeGreaterThan(0);
      }
    });

    it('all bonuses have valid effect types', () => {
      const validEffects = [
        'STARTING_CREDITS',
        'PRODUCTION_MULT',
        'GACHA_LUCK',
        'EXPORT_SPEED',
        'RESEARCH_DISCOUNT',
        'SEED_POWER',
      ];
      for (const [_key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(validEffects).toContain(bonus.effect);
      }
    });

    it('all MAGNITUDE_BONUSES have non-empty labels', () => {
      for (const bonus of MAGNITUDE_BONUSES) {
        expect(typeof bonus.label).toBe('string');
        expect(bonus.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Prestige calculation functions', () => {
    it('calculateBasePrestigePoints returns 0 below minimum threshold', () => {
      expect(calculateBasePrestigePoints(0)).toBe(0);
      expect(calculateBasePrestigePoints(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE - 1)).toBe(0);
    });

    it('calculateBasePrestigePoints returns positive value at minimum threshold', () => {
      const pointsAtMin = calculateBasePrestigePoints(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE);
      expect(pointsAtMin).toBeGreaterThan(0);
    });

    it('calculateBasePrestigePoints increases with credits', () => {
      const points1 = calculateBasePrestigePoints(100000);
      const points2 = calculateBasePrestigePoints(1000000);
      expect(points2).toBeGreaterThan(points1);
    });

    it('calculatePrestigePoints returns 0 below minimum threshold', () => {
      expect(calculatePrestigePoints(0)).toBe(0);
      expect(calculatePrestigePoints(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE - 1)).toBe(0);
    });

    it('calculatePrestigePoints is greater than or equal to base points', () => {
      const credits = 10_000_000;
      const basePoints = calculateBasePrestigePoints(credits);
      const totalPoints = calculatePrestigePoints(credits);
      expect(totalPoints).toBeGreaterThanOrEqual(basePoints);
    });

    it('getMagnitudeBonus returns null below first threshold', () => {
      expect(getMagnitudeBonus(0)).toBeNull();
      expect(getMagnitudeBonus(MAGNITUDE_BONUSES[0].threshold - 1)).toBeNull();
    });

    it('getMagnitudeBonus returns correct bonus at threshold', () => {
      const firstBonus = MAGNITUDE_BONUSES[0];
      expect(getMagnitudeBonus(firstBonus.threshold)).toBe(firstBonus);
    });

    it('getNextMagnitudeBonus returns first threshold when below all', () => {
      const nextBonus = getNextMagnitudeBonus(0);
      expect(nextBonus).toBe(MAGNITUDE_BONUSES[0]);
    });

    it('getNextMagnitudeBonus returns null when at max', () => {
      const maxThreshold = MAGNITUDE_BONUSES[MAGNITUDE_BONUSES.length - 1].threshold;
      expect(getNextMagnitudeBonus(maxThreshold)).toBeNull();
    });

    it('getPrestigePointBreakdown returns consistent values', () => {
      const credits = 10_000_000;
      const breakdown = getPrestigePointBreakdown(credits);

      expect(breakdown.totalPoints).toBe(breakdown.basePoints + breakdown.bonusPoints);
      expect(breakdown.totalPoints).toBe(calculatePrestigePoints(credits));
      expect(breakdown.basePoints).toBe(calculateBasePrestigePoints(credits));
    });
  });

  describe('Prestige bonus cost functions', () => {
    it('getPrestigeBonusCost returns Infinity for invalid bonus', () => {
      expect(getPrestigeBonusCost('nonexistent', 0)).toBe(Infinity);
    });

    it('getPrestigeBonusCost returns Infinity at max level', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        expect(getPrestigeBonusCost(key, bonus.maxLevel)).toBe(Infinity);
      }
    });

    it('getPrestigeBonusCost returns positive value below max level', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        const cost = getPrestigeBonusCost(key, bonus.maxLevel - 1);
        expect(cost).toBeGreaterThan(0);
        expect(Number.isFinite(cost)).toBe(true);
      }
    });

    it('getPrestigeBonusValue returns 0 for invalid bonus', () => {
      expect(getPrestigeBonusValue('nonexistent', 1)).toBe(0);
    });

    it('getPrestigeBonusValue returns 0 at level 0', () => {
      for (const key of Object.keys(PRESTIGE_BONUSES)) {
        expect(getPrestigeBonusValue(key, 0)).toBe(0);
      }
    });

    it('getPrestigeBonusValue scales linearly with level', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        const level1Value = getPrestigeBonusValue(key, 1);
        const level2Value = getPrestigeBonusValue(key, 2);
        expect(level2Value).toBe(level1Value * 2);
        expect(level1Value).toBe(bonus.baseValue);
      }
    });
  });

  describe('Costs scale appropriately', () => {
    it('total cost to max a bonus is reasonable', () => {
      for (const [key, bonus] of Object.entries(PRESTIGE_BONUSES)) {
        const totalCost = bonus.costPerLevel * bonus.maxLevel;
        // Total cost should be achievable but not trivial
        expect(totalCost, `${key} total cost`).toBeGreaterThan(0);
        expect(totalCost, `${key} total cost`).toBeLessThan(1000);
      }
    });

    it('more powerful bonuses cost more', () => {
      // Production multiplier should cost more than starting wealth
      expect(PRESTIGE_BONUSES.enhancedGrowth.costPerLevel).toBeGreaterThan(
        PRESTIGE_BONUSES.startingWealth.costPerLevel
      );
    });

    it('magnitude thresholds are reasonable', () => {
      const firstThreshold = MAGNITUDE_BONUSES[0].threshold;
      const lastThreshold = MAGNITUDE_BONUSES[MAGNITUDE_BONUSES.length - 1].threshold;
      // First magnitude should be achievable relatively early
      expect(firstThreshold).toBeGreaterThanOrEqual(1000);
      expect(firstThreshold).toBeLessThanOrEqual(1_000_000);
      // Last magnitude should be a significant achievement
      expect(lastThreshold).toBeGreaterThanOrEqual(1_000_000_000);
    });
  });

  describe('Game balance sanity checks', () => {
    it('minimum credits to prestige matches documented formula', () => {
      // At minimum credits, player should get at least 1 point
      const pointsAtMin = calculateBasePrestigePoints(PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE);
      expect(pointsAtMin).toBeGreaterThanOrEqual(1);
    });

    it('max prestige level is reasonable', () => {
      expect(PRESTIGE_CONFIG.MAX_PRESTIGE_LEVEL).toBeGreaterThanOrEqual(10);
      expect(PRESTIGE_CONFIG.MAX_PRESTIGE_LEVEL).toBeLessThanOrEqual(1000);
    });

    it('combined max bonuses do not break the game', () => {
      // Calculate the maximum possible effect of all percentage bonuses combined
      const productionBonus =
        PRESTIGE_BONUSES.enhancedGrowth.baseValue * PRESTIGE_BONUSES.enhancedGrowth.maxLevel;
      const seedPowerBonus =
        PRESTIGE_BONUSES.seedMastery.baseValue * PRESTIGE_BONUSES.seedMastery.maxLevel;

      // Max production bonus should be meaningful but not game-breaking
      expect(productionBonus).toBeLessThanOrEqual(10); // Max 1000% bonus
      expect(seedPowerBonus).toBeLessThanOrEqual(10); // Max 1000% bonus
    });

    it('research discount cannot make research free', () => {
      const maxDiscount =
        PRESTIGE_BONUSES.efficientResearch.baseValue * PRESTIGE_BONUSES.efficientResearch.maxLevel;
      expect(maxDiscount).toBeLessThan(1); // Cannot be 100% discount
    });
  });
});
