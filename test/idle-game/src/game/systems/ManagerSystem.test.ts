/**
 * Manager System Tests
 *
 * Tests display helpers and query functions.
 * Manager gacha, assignment, and mutation logic is tested server-side.
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialManagerState,
  canAffordPull,
  getManagerForPlanet,
  calculateManagerProductionBonus,
  getCollectionStats,
  calculateGlobalSecondaryBonuses,
  getAwakenedManagersWithBonuses,
  ManagerState,
} from './ManagerSystem';
import { MANAGER_GACHA_CONFIG, MANAGER_TEMPLATES } from '../config/managers';

function createTestManagerState(overrides: Partial<ManagerState> = {}): ManagerState {
  return {
    owned: [],
    assignments: {},
    pullCount: 0,
    lastEpicPull: 0,
    lastLegendaryPull: 0,
    ...overrides,
  };
}

describe('ManagerSystem', () => {
  describe('createInitialManagerState', () => {
    it('should create empty state', () => {
      const state = createInitialManagerState();

      expect(state.owned).toEqual([]);
      expect(state.assignments).toEqual({});
      expect(state.pullCount).toBe(0);
    });
  });

  describe('canAffordPull', () => {
    it('should return false with 0 crystals', () => {
      expect(canAffordPull(0, 1)).toBe(false);
    });

    it('should return true with enough crystals for single pull', () => {
      expect(canAffordPull(MANAGER_GACHA_CONFIG.PULL_COST, 1)).toBe(true);
    });

    it('should calculate multi-pull discount correctly', () => {
      const cost10 = Math.floor(
        MANAGER_GACHA_CONFIG.PULL_COST * 10 * MANAGER_GACHA_CONFIG.MULTI_PULL_DISCOUNT
      );
      expect(canAffordPull(cost10, 10)).toBe(true);
      expect(canAffordPull(cost10 - 1, 10)).toBe(false);
    });
  });

  describe('getManagerForPlanet', () => {
    it('should return null when no manager assigned', () => {
      const state = createTestManagerState();
      const manager = getManagerForPlanet(state, 'greenPlanet');
      expect(manager).toBeNull();
    });

    it('should return assigned manager', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 1,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
        assignments: { greenPlanet: 'mgr-1' },
      });

      const retrieved = getManagerForPlanet(state, 'greenPlanet');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.instanceId).toBe('mgr-1');
    });

    it('should return null for unassigned planet', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 1,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
        assignments: { greenPlanet: 'mgr-1' },
      });

      expect(getManagerForPlanet(state, 'redPlanet')).toBeNull();
    });
  });

  describe('calculateManagerProductionBonus', () => {
    it('should return 0 without assigned manager', () => {
      const state = createTestManagerState();
      const bonus = calculateManagerProductionBonus(state, 'greenPlanet');
      expect(bonus).toBe(0);
    });

    it('should return bonus when manager with production skill is assigned', () => {
      // wheat_whisperer has PRODUCTION_BOOST primary skill
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 1,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
        assignments: { greenPlanet: 'mgr-1' },
      });

      const bonus = calculateManagerProductionBonus(state, 'greenPlanet');
      expect(bonus).toBeGreaterThan(0);
    });

    it('should scale with manager level', () => {
      const state1 = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 1,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
        assignments: { greenPlanet: 'mgr-1' },
      });

      const state5 = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 5,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
        assignments: { greenPlanet: 'mgr-1' },
      });

      const bonus1 = calculateManagerProductionBonus(state1, 'greenPlanet');
      const bonus5 = calculateManagerProductionBonus(state5, 'greenPlanet');
      expect(bonus5).toBeGreaterThan(bonus1);
    });
  });

  describe('getCollectionStats', () => {
    it('should return correct totals for empty state', () => {
      const state = createTestManagerState();
      const stats = getCollectionStats(state);

      expect(stats.owned).toBe(0);
      expect(stats.total).toBe(Object.keys(MANAGER_TEMPLATES).length);
      expect(stats.awakened).toBe(0);
    });

    it('should count owned managers correctly', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 3,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'corn_champion',
            level: 1,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const stats = getCollectionStats(state);
      expect(stats.owned).toBe(2);
    });

    it('should count awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'corn_champion',
            level: 3,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const stats = getCollectionStats(state);
      expect(stats.awakened).toBe(1);
    });
  });

  describe('calculateGlobalSecondaryBonuses', () => {
    it('should return all zeros with no managers', () => {
      const state = createTestManagerState();
      const bonuses = calculateGlobalSecondaryBonuses(state);

      expect(bonuses.productionBoost).toBe(0);
      expect(bonuses.sellValueBoost).toBe(0);
      expect(bonuses.exportSpeed).toBe(0);
      expect(bonuses.storageCapacity).toBe(0);
      expect(bonuses.researchDiscount).toBe(0);
      expect(bonuses.gachaLuck).toBe(0);
    });

    it('should return all zeros with non-awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 5,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const bonuses = calculateGlobalSecondaryBonuses(state);
      expect(bonuses.productionBoost).toBe(0);
    });

    it('should calculate bonuses from awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
        ],
      });

      const bonuses = calculateGlobalSecondaryBonuses(state);
      // wheat_whisperer has 2% global production bonus
      expect(bonuses.productionBoost).toBe(0.02);
    });

    it('should aggregate bonuses from multiple awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'corn_champion',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
        ],
        pullCount: 20,
      });

      const bonuses = calculateGlobalSecondaryBonuses(state);
      // Both have 2% production boost = 4%
      expect(bonuses.productionBoost).toBe(0.04);
    });

    it('should not count non-awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'corn_champion',
            level: 5,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const bonuses = calculateGlobalSecondaryBonuses(state);
      // Only wheat_whisperer counts (2%)
      expect(bonuses.productionBoost).toBe(0.02);
    });

    it('should calculate different bonus types correctly', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'trade_apprentice',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'swift_shipper',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-3',
            templateId: 'research_rookie',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
        ],
      });

      const bonuses = calculateGlobalSecondaryBonuses(state);
      expect(bonuses.sellValueBoost).toBe(0.02); // trade_apprentice
      expect(bonuses.exportSpeed).toBe(0.02); // swift_shipper
      expect(bonuses.researchDiscount).toBe(0.02); // research_rookie
      expect(bonuses.productionBoost).toBe(0); // No production managers
    });
  });

  describe('getAwakenedManagersWithBonuses', () => {
    it('should return empty array with no managers', () => {
      const state = createTestManagerState();
      const result = getAwakenedManagersWithBonuses(state);
      expect(result).toEqual([]);
    });

    it('should return empty array with non-awakened managers', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 5,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const result = getAwakenedManagersWithBonuses(state);
      expect(result).toEqual([]);
    });

    it('should return awakened managers with their bonuses', () => {
      const state = createTestManagerState({
        owned: [
          {
            instanceId: 'mgr-1',
            templateId: 'wheat_whisperer',
            level: 10,
            isAwakened: true,
            obtainedAt: Date.now(),
          },
          {
            instanceId: 'mgr-2',
            templateId: 'corn_champion',
            level: 5,
            isAwakened: false,
            obtainedAt: Date.now(),
          },
        ],
      });

      const result = getAwakenedManagersWithBonuses(state);
      expect(result.length).toBe(1);
      expect(result[0].manager.templateId).toBe('wheat_whisperer');
      expect(result[0].template.name).toBe('Wheat Whisperer');
      expect(result[0].globalBonus).toBeDefined();
      expect(result[0].globalBonus?.type).toBe('PRODUCTION_BOOST');
      expect(result[0].globalBonus?.value).toBe(0.02);
    });
  });
});
