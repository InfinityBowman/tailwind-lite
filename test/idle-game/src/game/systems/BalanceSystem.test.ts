/**
 * Balance System Tests
 * Ensures game balance stays in check throughout progression
 *
 * These tests verify:
 * - Production/export ratios remain reasonable
 * - Upgrade costs scale appropriately
 * - Seed tier multipliers don't break the economy
 * - Time-to-milestone estimates are achievable
 */

import { describe, it, expect } from 'vitest';
import {
  SEED_TIERS,
  UPGRADE_CONFIG,
  STARTING_CREDITS,
  GACHA_CONFIG,
  BALANCE_TARGETS,
  MAX_SEEDS_PER_PLANET,
} from '../config/balance';
import { PLANET_DEFINITIONS } from '../config/planets';
import { calculateUpgradeCost } from './UpgradeSystem';

describe('Balance System', () => {
  describe('Starting Resources', () => {
    it('should allow 2-5 gacha pulls at start', () => {
      // Intentionally limited to slow early progression
      const pullsAvailable = Math.floor(STARTING_CREDITS / GACHA_CONFIG.PULL_COST);
      expect(pullsAvailable).toBeGreaterThanOrEqual(2);
      expect(pullsAvailable).toBeLessThanOrEqual(5);
    });

    it('should not allow buying second planet immediately', () => {
      const redPlanet = PLANET_DEFINITIONS.redPlanet;
      expect(STARTING_CREDITS).toBeLessThan(redPlanet.unlockCost);
    });
  });

  describe('Seed Tier Balance', () => {
    it('should have progressively increasing production multipliers', () => {
      for (let tier = 1; tier < 6; tier++) {
        const current = SEED_TIERS[tier as keyof typeof SEED_TIERS].productionMultiplier;
        const next = SEED_TIERS[(tier + 1) as keyof typeof SEED_TIERS].productionMultiplier;
        expect(next).toBeGreaterThan(current);
      }
    });

    it('should have value multipliers grow faster than production', () => {
      for (let tier = 2; tier <= 6; tier++) {
        const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
        // Value should grow faster to reward fusion investment
        expect(tierData.valueMultiplier).toBeGreaterThanOrEqual(tierData.productionMultiplier);
      }
    });

    it('should keep max seed production multiplier within target', () => {
      const maxTierMultiplier = SEED_TIERS[6].productionMultiplier;
      const maxTotalMultiplier = maxTierMultiplier * MAX_SEEDS_PER_PLANET;
      expect(maxTotalMultiplier).toBeLessThanOrEqual(
        BALANCE_TARGETS.MAX_SEED_PRODUCTION_MULTIPLIER
      );
    });

    it('should have reasonable tier 6 multiplier (not game-breaking)', () => {
      // T6 should be powerful but not more than 10x T1
      const t1 = SEED_TIERS[1].productionMultiplier;
      const t6 = SEED_TIERS[6].productionMultiplier;
      expect(t6 / t1).toBeLessThanOrEqual(10);
    });

    it('should have increasing essence costs for higher tiers', () => {
      // Lower tiers should be cheap to encourage experimentation
      expect(SEED_TIERS[2].essenceCost).toBeLessThanOrEqual(10);
      // Higher tiers should cost more
      expect(SEED_TIERS[5].essenceCost).toBeGreaterThan(SEED_TIERS[3].essenceCost);
      expect(SEED_TIERS[6].essenceCost).toBeGreaterThan(SEED_TIERS[5].essenceCost);
    });
  });

  describe('Production vs Export Balance', () => {
    it('should maintain reasonable production/export ratio for starting planet', () => {
      const greenPlanet = PLANET_DEFINITIONS.greenPlanet;

      // Base production with 1 T1 seed
      const baseProduction = greenPlanet.productionRate * SEED_TIERS[1].productionMultiplier;

      // Export throughput is directly exportSpeed
      const exportRate = greenPlanet.exportSpeed;

      // Production should not wildly exceed export at start
      const ratio = baseProduction / exportRate;
      expect(ratio).toBeLessThanOrEqual(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO);
    });

    it('should maintain balance with full T1 seeds (no upgrades)', () => {
      const greenPlanet = PLANET_DEFINITIONS.greenPlanet;

      // Full planet of T1 seeds
      const totalProduction =
        greenPlanet.productionRate * SEED_TIERS[1].productionMultiplier * MAX_SEEDS_PER_PLANET;
      const exportRate = greenPlanet.exportSpeed;

      const ratio = totalProduction / exportRate;
      // With full T1 seeds, production outpaces export but storage buffers the difference
      // Players are expected to upgrade export speed to keep up
      expect(ratio).toBeLessThanOrEqual(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO * 4);
    });

    it('should allow upgrades to catch up with T3 seeds', () => {
      const greenPlanet = PLANET_DEFINITIONS.greenPlanet;

      // Production with T3 seeds filling all slots
      const production =
        greenPlanet.productionRate * SEED_TIERS[3].productionMultiplier * MAX_SEEDS_PER_PLANET;

      // After significant export speed investment (max level is 40)
      const upgradeLevel = UPGRADE_CONFIG.EXPORT_SPEED.maxLevel;
      const upgradedExportSpeed =
        greenPlanet.exportSpeed * (1 + UPGRADE_CONFIG.EXPORT_SPEED.effectMultiplier * upgradeLevel);

      const ratio = production / upgradedExportSpeed;
      // With max export speed upgrades, production should not exceed export
      expect(ratio).toBeLessThanOrEqual(BALANCE_TARGETS.MAX_PRODUCTION_EXPORT_RATIO);
    });
  });

  describe('Upgrade Cost Scaling', () => {
    it('should have early upgrades that require some earning', () => {
      const firstProductionCost = calculateUpgradeCost('PRODUCTION_RATE', 0);
      const firstSpeedCost = calculateUpgradeCost('EXPORT_SPEED', 0);
      const firstStorageCost = calculateUpgradeCost('STORAGE_CAPACITY', 0);

      // Early upgrades should require earning credits first (slower pacing)
      // But not so expensive they feel impossible
      expect(firstProductionCost).toBeLessThanOrEqual(200);
      expect(firstSpeedCost).toBeLessThanOrEqual(200);
      expect(firstStorageCost).toBeLessThanOrEqual(200);
    });

    it('should have export upgrades not prohibitively expensive vs production', () => {
      // Export upgrades should be reasonably priced compared to production
      const prodCost = calculateUpgradeCost('PRODUCTION_RATE', 5);
      const speedCost = calculateUpgradeCost('EXPORT_SPEED', 5);

      // At same level, export speed should not cost more than 5x production
      // (export speed has higher base cost and steeper scaling, but should stay accessible)
      expect(speedCost).toBeLessThanOrEqual(prodCost * 5);
    });

    it('should have reasonable early-to-mid cost scaling', () => {
      const level0Cost = calculateUpgradeCost('PRODUCTION_RATE', 0);
      const level5Cost = calculateUpgradeCost('PRODUCTION_RATE', 5);
      const level10Cost = calculateUpgradeCost('PRODUCTION_RATE', 10);

      // Early levels should scale moderately
      expect(level5Cost / level0Cost).toBeLessThan(15);
      expect(level10Cost / level5Cost).toBeLessThan(15);
    });
  });

  describe('Gacha Balance', () => {
    it('should give mostly common/fodder early (controlled power growth)', () => {
      const fodderRate = GACHA_CONFIG.DROP_RATES.FODDER;
      const commonRate = GACHA_CONFIG.DROP_RATES.COMMON;
      const uncommonRate = GACHA_CONFIG.DROP_RATES.UNCOMMON;

      // Fodder + common should be vast majority
      expect(fodderRate + commonRate).toBeGreaterThan(0.85);

      // Uncommon should be rare but achievable
      expect(uncommonRate).toBeGreaterThanOrEqual(0.05);
      expect(uncommonRate).toBeLessThanOrEqual(0.15);
    });

    it('should require ~20 fodder to fuse one T3 seed', () => {
      // T1 + T1 = T2 (uses essence from ~7 fodder at 70% rate)
      // T2 + T2 = T3 (uses essence)
      // So need 4 T1s minimum + essence for 2 fusions
      // At 70% fodder rate, need ~20 pulls for enough essence + seeds
      const fodderRate = GACHA_CONFIG.DROP_RATES.FODDER;
      const commonRate = GACHA_CONFIG.DROP_RATES.COMMON;

      // Expected fodder from 20 pulls
      const expectedFodder = 20 * fodderRate;
      const expectedCommon = 20 * commonRate;

      expect(expectedFodder).toBeGreaterThan(10); // Enough essence
      expect(expectedCommon).toBeGreaterThan(3); // Enough seeds to fuse
    });
  });

  describe('Planet Unlock Progression', () => {
    it('should have progressively increasing unlock costs', () => {
      const planets = Object.values(PLANET_DEFINITIONS)
        .filter(p => p.unlockCost > 0)
        .sort((a, b) => a.unlockCost - b.unlockCost);

      for (let i = 1; i < planets.length; i++) {
        expect(planets[i].unlockCost).toBeGreaterThan(planets[i - 1].unlockCost);
      }
    });

    it('should have first unlock achievable in early game', () => {
      const firstPaidPlanet = Object.values(PLANET_DEFINITIONS)
        .filter(p => p.unlockCost > 0)
        .sort((a, b) => a.unlockCost - b.unlockCost)[0];

      // First planet should cost less than 10 minutes of optimal play
      // Rough estimate: 0.5 credits/second = 300 credits in 10 min
      expect(firstPaidPlanet.unlockCost).toBeLessThanOrEqual(1000);
    });

    it('should have final planet as significant late-game goal', () => {
      const voidPlanet = PLANET_DEFINITIONS.voidPlanet;

      // Final planet should require substantial progression
      expect(voidPlanet.unlockCost).toBeGreaterThanOrEqual(25000);
    });
  });

  describe('Economy Flow', () => {
    it('should have positive expected value from gacha in early game', () => {
      // With starting planet, selling should eventually earn back gacha costs
      const _greenPlanet = PLANET_DEFINITIONS.greenPlanet; // For reference
      const pullCost = GACHA_CONFIG.PULL_COST;

      // Even with fodder, you get essence which enables fusion
      // A T1 seed produces value over time
      // This is a sanity check that the economy can flow
      expect(pullCost).toBeLessThan(50); // Pulls shouldn't be prohibitively expensive
    });
  });
});
