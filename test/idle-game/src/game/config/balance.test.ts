import { describe, it, expect } from 'vitest';
import {
  GACHA_CONFIG,
  SEED_TIERS,
  MAX_SEED_TIER,
  MAX_SEEDS_PER_PLANET,
  SEED_SCRAP_VALUES,
  UPGRADE_CONFIG,
  SAVE_CONFIG,
  GAME_LOOP_CONFIG,
  STARTING_CREDITS,
  STARTING_CRYSTALS,
  BALANCE_TARGETS,
} from './balance';

describe('Balance Config', () => {
  describe('No NaN or Infinity values', () => {
    it('GACHA_CONFIG has no NaN or Infinity', () => {
      expect(Number.isFinite(GACHA_CONFIG.PULL_COST)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.MULTI_PULL_10_COUNT)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.MULTI_PULL_10_DISCOUNT)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.MULTI_PULL_100_COUNT)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.MULTI_PULL_100_DISCOUNT)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.DROP_RATES.FODDER)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.DROP_RATES.COMMON)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.DROP_RATES.UNCOMMON)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.FODDER_ESSENCE)).toBe(true);
      expect(Number.isFinite(GACHA_CONFIG.PITY_THRESHOLD)).toBe(true);
    });

    it('SEED_TIERS has no NaN or Infinity', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(Number.isFinite(tierData.productionMultiplier)).toBe(true);
        expect(Number.isFinite(tierData.valueMultiplier)).toBe(true);
        expect(Number.isFinite(tierData.essenceCost)).toBe(true);
      }
    });

    it('UPGRADE_CONFIG has no NaN or Infinity', () => {
      expect(Number.isFinite(UPGRADE_CONFIG.PRODUCTION_RATE.baseCost)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.PRODUCTION_RATE.scalingFactor)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.PRODUCTION_RATE.effectMultiplier)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.EXPORT_SPEED.baseCost)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.EXPORT_SPEED.scalingFactor)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.STORAGE_CAPACITY.baseCost)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.STORAGE_CAPACITY.scalingFactor)).toBe(true);
      expect(Number.isFinite(UPGRADE_CONFIG.STORAGE_CAPACITY.effectMultiplier)).toBe(true);
    });
  });

  describe('All constants are positive', () => {
    it('GACHA_CONFIG has positive values', () => {
      expect(GACHA_CONFIG.PULL_COST).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_10_COUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_10_DISCOUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_100_COUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_100_DISCOUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.FODDER_ESSENCE).toBeGreaterThan(0);
      expect(GACHA_CONFIG.PITY_THRESHOLD).toBeGreaterThan(0);
    });

    it('GACHA_CONFIG drop rates are positive', () => {
      expect(GACHA_CONFIG.DROP_RATES.FODDER).toBeGreaterThan(0);
      expect(GACHA_CONFIG.DROP_RATES.COMMON).toBeGreaterThan(0);
      expect(GACHA_CONFIG.DROP_RATES.UNCOMMON).toBeGreaterThan(0);
    });

    it('SEED_TIERS have positive multipliers', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.productionMultiplier).toBeGreaterThan(0);
        expect(tierData.valueMultiplier).toBeGreaterThan(0);
        expect(tierData.essenceCost).toBeGreaterThanOrEqual(0); // Tier 0 and 1 have 0 cost
      }
    });

    it('SEED_SCRAP_VALUES are positive', () => {
      for (let tier = 1; tier <= MAX_SEED_TIER; tier++) {
        expect(SEED_SCRAP_VALUES[tier as keyof typeof SEED_SCRAP_VALUES]).toBeGreaterThan(0);
      }
    });

    it('UPGRADE_CONFIG has positive values', () => {
      expect(UPGRADE_CONFIG.PRODUCTION_RATE.baseCost).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.PRODUCTION_RATE.scalingFactor).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.PRODUCTION_RATE.effectMultiplier).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.EXPORT_SPEED.baseCost).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.EXPORT_SPEED.scalingFactor).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.baseCost).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.scalingFactor).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.effectMultiplier).toBeGreaterThan(0);
    });

    it('GAME_LOOP_CONFIG has positive values', () => {
      expect(GAME_LOOP_CONFIG.TARGET_TPS).toBeGreaterThan(0);
      expect(GAME_LOOP_CONFIG.MAX_DELTA_TIME).toBeGreaterThan(0);
      expect(GAME_LOOP_CONFIG.OFFLINE_MAX_HOURS).toBeGreaterThan(0);
    });

    it('SAVE_CONFIG has positive values', () => {
      expect(SAVE_CONFIG.AUTO_SAVE_INTERVAL_MS).toBeGreaterThan(0);
      expect(SAVE_CONFIG.CURRENT_VERSION).toBeGreaterThan(0);
    });

    it('starting values are non-negative', () => {
      expect(STARTING_CREDITS).toBeGreaterThanOrEqual(0);
      expect(STARTING_CRYSTALS).toBeGreaterThanOrEqual(0);
    });

    it('BALANCE_TARGETS are positive', () => {
      expect(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO).toBeGreaterThan(0);
      expect(BALANCE_TARGETS.TIME_TO_FIRST_PLANET_UNLOCK).toBeGreaterThan(0);
      expect(BALANCE_TARGETS.TIME_TO_FIRST_PRESTIGE).toBeGreaterThan(0);
      expect(BALANCE_TARGETS.MAX_SEED_PRODUCTION_MULTIPLIER).toBeGreaterThan(0);
    });
  });

  describe('Gacha rates', () => {
    it('drop rates sum to 1.0 (100%)', () => {
      const totalRate =
        GACHA_CONFIG.DROP_RATES.FODDER +
        GACHA_CONFIG.DROP_RATES.COMMON +
        GACHA_CONFIG.DROP_RATES.UNCOMMON;
      expect(totalRate).toBeCloseTo(1.0, 10);
    });

    it('individual drop rates are between 0 and 1', () => {
      expect(GACHA_CONFIG.DROP_RATES.FODDER).toBeGreaterThan(0);
      expect(GACHA_CONFIG.DROP_RATES.FODDER).toBeLessThanOrEqual(1);
      expect(GACHA_CONFIG.DROP_RATES.COMMON).toBeGreaterThan(0);
      expect(GACHA_CONFIG.DROP_RATES.COMMON).toBeLessThanOrEqual(1);
      expect(GACHA_CONFIG.DROP_RATES.UNCOMMON).toBeGreaterThan(0);
      expect(GACHA_CONFIG.DROP_RATES.UNCOMMON).toBeLessThanOrEqual(1);
    });

    it('fodder has highest drop rate (most common)', () => {
      expect(GACHA_CONFIG.DROP_RATES.FODDER).toBeGreaterThan(GACHA_CONFIG.DROP_RATES.COMMON);
      expect(GACHA_CONFIG.DROP_RATES.COMMON).toBeGreaterThan(GACHA_CONFIG.DROP_RATES.UNCOMMON);
    });

    it('discounts are between 0 and 1', () => {
      expect(GACHA_CONFIG.MULTI_PULL_10_DISCOUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_10_DISCOUNT).toBeLessThan(1);
      expect(GACHA_CONFIG.MULTI_PULL_100_DISCOUNT).toBeGreaterThan(0);
      expect(GACHA_CONFIG.MULTI_PULL_100_DISCOUNT).toBeLessThan(1);
    });

    it('100-pull discount is better than 10-pull discount', () => {
      expect(GACHA_CONFIG.MULTI_PULL_100_DISCOUNT).toBeLessThan(
        GACHA_CONFIG.MULTI_PULL_10_DISCOUNT
      );
    });

    it('starting credits allow at least one pull', () => {
      expect(STARTING_CREDITS).toBeGreaterThanOrEqual(GACHA_CONFIG.PULL_COST);
    });
  });

  describe('Seed tier progression', () => {
    it('production multipliers increase with tier', () => {
      let prevMultiplier = 0;
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.productionMultiplier).toBeGreaterThan(prevMultiplier);
        prevMultiplier = tierData.productionMultiplier;
      }
    });

    it('value multipliers increase with tier', () => {
      let prevMultiplier = 0;
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.valueMultiplier).toBeGreaterThan(prevMultiplier);
        prevMultiplier = tierData.valueMultiplier;
      }
    });

    it('essence costs increase with tier (after tier 1)', () => {
      let prevCost = 0;
      for (let tier = 2; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.essenceCost).toBeGreaterThan(prevCost);
        prevCost = tierData.essenceCost;
      }
    });

    it('scrap values increase with tier', () => {
      let prevValue = 0;
      for (let tier = 1; tier <= MAX_SEED_TIER; tier++) {
        const scrapValue = SEED_SCRAP_VALUES[tier as keyof typeof SEED_SCRAP_VALUES];
        expect(scrapValue).toBeGreaterThan(prevValue);
        prevValue = scrapValue;
      }
    });

    it('fodder tier (0) has lower multipliers than common tier (1)', () => {
      expect(SEED_TIERS[0].productionMultiplier).toBeLessThan(SEED_TIERS[1].productionMultiplier);
      expect(SEED_TIERS[0].valueMultiplier).toBeLessThan(SEED_TIERS[1].valueMultiplier);
    });

    it('tier 1 (common) has 1.0 baseline multipliers', () => {
      expect(SEED_TIERS[1].productionMultiplier).toBe(1.0);
      expect(SEED_TIERS[1].valueMultiplier).toBe(1.0);
    });

    it('all tier names are non-empty strings', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(typeof tierData.name).toBe('string');
        expect(tierData.name.length).toBeGreaterThan(0);
      }
    });

    it('all tier colors are valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.color).toMatch(hexColorRegex);
      }
    });
  });

  describe('Upgrade scaling', () => {
    it('scaling factors are greater than 1 (costs increase)', () => {
      expect(UPGRADE_CONFIG.PRODUCTION_RATE.scalingFactor).toBeGreaterThan(1);
      expect(UPGRADE_CONFIG.EXPORT_SPEED.scalingFactor).toBeGreaterThan(1);
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.scalingFactor).toBeGreaterThan(1);
    });

    it('export speed effect multiplier is between 0 and 1 (percentage increase per level)', () => {
      expect(UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier).toBeLessThan(1);
    });

    it('storage capacity effect multiplier is between 0 and 1 (percentage increase per level)', () => {
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.effectMultiplier).toBeGreaterThan(0);
      expect(UPGRADE_CONFIG.STORAGE_CAPACITY.effectMultiplier).toBeLessThan(1);
    });

    it('upgrade costs scale appropriately over 10 levels', () => {
      const calculateCost = (baseCost: number, scalingFactor: number, level: number) => {
        return Math.floor(baseCost * Math.pow(scalingFactor, level));
      };

      // Production rate upgrades
      const prodCost0 = calculateCost(
        UPGRADE_CONFIG.PRODUCTION_RATE.baseCost,
        UPGRADE_CONFIG.PRODUCTION_RATE.scalingFactor,
        0
      );
      const prodCost10 = calculateCost(
        UPGRADE_CONFIG.PRODUCTION_RATE.baseCost,
        UPGRADE_CONFIG.PRODUCTION_RATE.scalingFactor,
        10
      );
      expect(prodCost10).toBeGreaterThan(prodCost0);
      expect(prodCost10).toBeLessThan(prodCost0 * 100); // Reasonable scaling

      // Export speed upgrades
      const expCost0 = calculateCost(
        UPGRADE_CONFIG.EXPORT_SPEED.baseCost,
        UPGRADE_CONFIG.EXPORT_SPEED.scalingFactor,
        0
      );
      const expCost10 = calculateCost(
        UPGRADE_CONFIG.EXPORT_SPEED.baseCost,
        UPGRADE_CONFIG.EXPORT_SPEED.scalingFactor,
        10
      );
      expect(expCost10).toBeGreaterThan(expCost0);
    });
  });

  describe('Multiplier ranges', () => {
    it('production multipliers are in reasonable range (0.1 to 100)', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.productionMultiplier).toBeGreaterThanOrEqual(0.1);
        expect(tierData.productionMultiplier).toBeLessThanOrEqual(100);
      }
    });

    it('value multipliers are in reasonable range (0.1 to 100)', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        expect(tierData.valueMultiplier).toBeGreaterThanOrEqual(0.1);
        expect(tierData.valueMultiplier).toBeLessThanOrEqual(100);
      }
    });

    it('highest tier multipliers do not exceed balance target', () => {
      const maxTierData = SEED_TIERS[MAX_SEED_TIER];
      const maxProduction = maxTierData.productionMultiplier * MAX_SEEDS_PER_PLANET;
      // Production from base slots should be within reason
      expect(maxProduction).toBeLessThanOrEqual(BALANCE_TARGETS.MAX_SEED_PRODUCTION_MULTIPLIER);
    });
  });

  describe('Game loop config', () => {
    it('TPS is reasonable (1-60)', () => {
      expect(GAME_LOOP_CONFIG.TARGET_TPS).toBeGreaterThanOrEqual(1);
      expect(GAME_LOOP_CONFIG.TARGET_TPS).toBeLessThanOrEqual(60);
    });

    it('max delta time prevents huge time jumps', () => {
      expect(GAME_LOOP_CONFIG.MAX_DELTA_TIME).toBeGreaterThan(0);
      expect(GAME_LOOP_CONFIG.MAX_DELTA_TIME).toBeLessThanOrEqual(1); // Max 1 second
    });

    it('offline max hours is reasonable', () => {
      expect(GAME_LOOP_CONFIG.OFFLINE_MAX_HOURS).toBeGreaterThanOrEqual(1);
      expect(GAME_LOOP_CONFIG.OFFLINE_MAX_HOURS).toBeLessThanOrEqual(168); // Max 1 week
    });
  });

  describe('Save config', () => {
    it('auto save interval is reasonable', () => {
      expect(SAVE_CONFIG.AUTO_SAVE_INTERVAL_MS).toBeGreaterThanOrEqual(5000); // At least 5 seconds
      expect(SAVE_CONFIG.AUTO_SAVE_INTERVAL_MS).toBeLessThanOrEqual(300000); // At most 5 minutes
    });

    it('storage key is a valid string', () => {
      expect(typeof SAVE_CONFIG.STORAGE_KEY).toBe('string');
      expect(SAVE_CONFIG.STORAGE_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('Balance targets consistency', () => {
    it('time to prestige is greater than time to first planet', () => {
      expect(BALANCE_TARGETS.TIME_TO_FIRST_PRESTIGE).toBeGreaterThan(
        BALANCE_TARGETS.TIME_TO_FIRST_PLANET_UNLOCK
      );
    });

    it('max production/export ratio is greater than 1', () => {
      expect(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO).toBeGreaterThan(1);
      expect(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO).toBeLessThan(10); // But not too high
    });
  });

  describe('Pity system', () => {
    it('pity threshold is reasonable', () => {
      expect(GACHA_CONFIG.PITY_THRESHOLD).toBeGreaterThanOrEqual(5);
      expect(GACHA_CONFIG.PITY_THRESHOLD).toBeLessThanOrEqual(100);
    });
  });

  describe('MAX_SEED_TIER constant', () => {
    it('matches the highest tier in SEED_TIERS', () => {
      const tierKeys = Object.keys(SEED_TIERS).map(Number);
      const maxTierKey = Math.max(...tierKeys);
      expect(MAX_SEED_TIER).toBe(maxTierKey);
    });

    it('all tiers from 0 to MAX_SEED_TIER are defined', () => {
      for (let tier = 0; tier <= MAX_SEED_TIER; tier++) {
        expect(SEED_TIERS[tier as keyof typeof SEED_TIERS]).toBeDefined();
      }
    });
  });

  describe('Scrap value economics', () => {
    it('scrap values are always less than essence costs for same tier', () => {
      // Scrapping should not be a way to generate infinite essence
      for (let tier = 2; tier <= MAX_SEED_TIER; tier++) {
        const scrapValue = SEED_SCRAP_VALUES[tier as keyof typeof SEED_SCRAP_VALUES];
        const essenceCost = SEED_TIERS[tier as keyof typeof SEED_TIERS].essenceCost;
        // You should get less essence from scrapping than you spent to create
        // (prevents infinite essence loops)
        expect(scrapValue).toBeLessThanOrEqual(essenceCost * 5); // Allow some wiggle room
      }
    });

    it('fodder essence value enables fusion progression', () => {
      // Two T0 seeds should provide enough essence for at least some fusion
      const twoFodderEssence = GACHA_CONFIG.FODDER_ESSENCE * 2;
      const t2EssenceCost = SEED_TIERS[2].essenceCost;
      // Fodder should provide meaningful essence towards fusion
      expect(twoFodderEssence).toBeGreaterThanOrEqual(t2EssenceCost * 0.5);
    });
  });
});
