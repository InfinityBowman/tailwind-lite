/**
 * Anomaly System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialAnomalyState,
  checkAnomalySpawn,
  checkLuckyStarBuff,
  collectAnomaly,
  getLuckyStarMultiplier,
  getAnomalyTimeRemaining,
  getLuckyStarTimeRemaining,
  formatAnomalyTime,
  getRandomSpawnDelay,
  pickRandomAnomalyType,
  calculateCreditBurstReward,
  calculateCosmicShardReward,
  generateRandomSeed,
  applyAnomalyRewardToState,
  ANOMALY_CONFIG,
  ANOMALY_DEFINITIONS,
  type AnomalyStateData,
  type AnomalyType,
  type CollectAnomalyResult,
} from './AnomalySystem';
import { createInitialPlanetState, type PlanetState } from '../state/GameState';

// Helper to create test planets
function createTestPlanets(): PlanetState[] {
  const planet1 = createInitialPlanetState('greenPlanet');
  planet1.unlocked = true;
  planet1.seeds = [
    {
      instanceId: 'seed-1',
      id: 'wheat',
      name: 'Wheat Seeds',
      tier: 1,
      level: 1,
      productionMultiplier: 1,
      valueMultiplier: 1,
      color: '#fff',
      powerLevel: 1,
      traits: [],
    },
  ];
  planet1.plants = [
    {
      plant: 'wheat',
      currentAmount: 100,
      productionRate: 1,
    },
  ];

  const planet2 = createInitialPlanetState('bluePlanet');
  planet2.unlocked = true;
  planet2.seeds = [
    {
      instanceId: 'seed-2',
      id: 'corn',
      name: 'Corn Seeds',
      tier: 1,
      level: 1,
      productionMultiplier: 1,
      valueMultiplier: 1,
      color: '#fff',
      powerLevel: 1,
      traits: [],
    },
  ];
  planet2.plants = [
    {
      plant: 'corn',
      currentAmount: 50,
      productionRate: 2,
    },
  ];

  const planet3 = createInitialPlanetState('redPlanet');
  planet3.unlocked = false; // Locked planet

  return [planet1, planet2, planet3];
}

describe('AnomalySystem', () => {
  describe('createInitialAnomalyState', () => {
    it('should create valid initial state', () => {
      const state = createInitialAnomalyState();

      expect(state.activeAnomaly).toBeNull();
      expect(state.luckyStarBuff).toBeNull();
      expect(state.totalCollected).toBe(0);
      expect(state.nextSpawnTime).toBeGreaterThan(Date.now());
    });

    it('should have all anomaly types in collectedByType', () => {
      const state = createInitialAnomalyState();

      expect(state.collectedByType.CREDIT_BURST).toBe(0);
      expect(state.collectedByType.WARP_SPEED).toBe(0);
      expect(state.collectedByType.LUCKY_STAR).toBe(0);
      expect(state.collectedByType.COSMIC_SHARD).toBe(0);
      expect(state.collectedByType.SEED_RAIN).toBe(0);
    });
  });

  describe('getRandomSpawnDelay', () => {
    it('should return delay within configured range', () => {
      for (let i = 0; i < 100; i++) {
        const delay = getRandomSpawnDelay();
        expect(delay).toBeGreaterThanOrEqual(ANOMALY_CONFIG.MIN_SPAWN_INTERVAL_MS);
        expect(delay).toBeLessThanOrEqual(ANOMALY_CONFIG.MAX_SPAWN_INTERVAL_MS);
      }
    });
  });

  describe('pickRandomAnomalyType', () => {
    it('should return valid anomaly types', () => {
      const validTypes: AnomalyType[] = [
        'CREDIT_BURST',
        'WARP_SPEED',
        'LUCKY_STAR',
        'COSMIC_SHARD',
        'SEED_RAIN',
      ];

      for (let i = 0; i < 50; i++) {
        const type = pickRandomAnomalyType();
        expect(validTypes).toContain(type);
      }
    });
  });

  describe('checkAnomalySpawn', () => {
    let initialState: AnomalyStateData;
    let planets: PlanetState[];

    beforeEach(() => {
      initialState = createInitialAnomalyState();
      planets = createTestPlanets();
    });

    it('should not spawn if not time yet', () => {
      const state = {
        ...initialState,
        nextSpawnTime: Date.now() + 60000,
      };

      const result = checkAnomalySpawn(state, planets);
      expect(result.activeAnomaly).toBeNull();
    });

    it('should spawn anomaly when time is reached', () => {
      const state = {
        ...initialState,
        nextSpawnTime: Date.now() - 1000,
      };

      const result = checkAnomalySpawn(state, planets);
      expect(result.activeAnomaly).not.toBeNull();
      expect(result.activeAnomaly?.planetId).toBeDefined();
    });

    it('should only spawn on unlocked planets with seeds', () => {
      const state = {
        ...initialState,
        nextSpawnTime: Date.now() - 1000,
      };

      // Run multiple times to check planet selection
      for (let i = 0; i < 20; i++) {
        const result = checkAnomalySpawn(state, planets);
        if (result.activeAnomaly) {
          expect(['greenPlanet', 'bluePlanet']).toContain(result.activeAnomaly.planetId);
          expect(result.activeAnomaly.planetId).not.toBe('redPlanet');
        }
      }
    });

    it('should not spawn if no eligible planets', () => {
      const emptyPlanets: PlanetState[] = [
        { ...planets[2] }, // locked planet only
      ];

      const state = {
        ...initialState,
        nextSpawnTime: Date.now() - 1000,
      };

      const result = checkAnomalySpawn(state, emptyPlanets);
      expect(result.activeAnomaly).toBeNull();
    });

    it('should expire active anomaly after collect window', () => {
      const expiredAnomaly = {
        id: 'test-1',
        type: 'CREDIT_BURST' as AnomalyType,
        planetId: 'greenPlanet',
        spawnTime: Date.now() - 20000,
        expiresAt: Date.now() - 10000,
      };

      const state = {
        ...initialState,
        activeAnomaly: expiredAnomaly,
      };

      const result = checkAnomalySpawn(state, planets);
      expect(result.activeAnomaly).toBeNull();
    });

    it('should not modify state if anomaly still active', () => {
      const activeAnomaly = {
        id: 'test-1',
        type: 'CREDIT_BURST' as AnomalyType,
        planetId: 'greenPlanet',
        spawnTime: Date.now() - 1000,
        expiresAt: Date.now() + 9000,
      };

      const state = {
        ...initialState,
        activeAnomaly,
      };

      const result = checkAnomalySpawn(state, planets);
      expect(result).toBe(state);
    });
  });

  describe('collectAnomaly', () => {
    let planets: PlanetState[];

    beforeEach(() => {
      planets = createTestPlanets();
    });

    it('should fail if no active anomaly', () => {
      const state = createInitialAnomalyState();
      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No active anomaly');
    });

    it('should fail if anomaly expired', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'CREDIT_BURST',
          planetId: 'greenPlanet',
          spawnTime: Date.now() - 20000,
          expiresAt: Date.now() - 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Anomaly has expired');
    });

    it('should collect Credit Burst and give credits', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'CREDIT_BURST',
          planetId: 'greenPlanet',
          spawnTime: Date.now(),
          expiresAt: Date.now() + 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(true);
      expect(result.type).toBe('CREDIT_BURST');
      expect(result.reward?.credits).toBeGreaterThan(0);
      expect(result.newState.activeAnomaly).toBeNull();
      expect(result.newState.totalCollected).toBe(1);
      expect(result.newState.collectedByType.CREDIT_BURST).toBe(1);
    });

    it('should collect Warp Speed and set instant export', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'WARP_SPEED',
          planetId: 'greenPlanet',
          spawnTime: Date.now(),
          expiresAt: Date.now() + 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(true);
      expect(result.type).toBe('WARP_SPEED');
      expect(result.reward?.instantExport).toBe(true);
    });

    it('should collect Lucky Star and set production buff', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'LUCKY_STAR',
          planetId: 'greenPlanet',
          spawnTime: Date.now(),
          expiresAt: Date.now() + 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(true);
      expect(result.type).toBe('LUCKY_STAR');
      expect(result.reward?.productionBuff).toBeDefined();
      expect(result.reward?.productionBuff?.multiplier).toBe(ANOMALY_CONFIG.LUCKY_STAR_MULTIPLIER);
      expect(result.newState.luckyStarBuff).not.toBeNull();
    });

    it('should collect Cosmic Shard and give crystals', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'COSMIC_SHARD',
          planetId: 'greenPlanet',
          spawnTime: Date.now(),
          expiresAt: Date.now() + 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(true);
      expect(result.type).toBe('COSMIC_SHARD');
      expect(result.reward?.crystals).toBeGreaterThanOrEqual(1);
      expect(result.reward?.crystals).toBeLessThanOrEqual(5);
    });

    it('should collect Seed Rain and give seed', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'SEED_RAIN',
          planetId: 'greenPlanet',
          spawnTime: Date.now(),
          expiresAt: Date.now() + 10000,
        },
      };

      const result = collectAnomaly(state, planets);

      expect(result.success).toBe(true);
      expect(result.type).toBe('SEED_RAIN');
      expect(result.reward?.seed).toBeDefined();
      expect(result.reward?.seed?.instanceId).toBeDefined();
      expect(result.reward?.seed?.tier).toBe(1);
    });
  });

  describe('checkLuckyStarBuff', () => {
    it('should not modify state if no buff', () => {
      const state = createInitialAnomalyState();
      const result = checkLuckyStarBuff(state);
      expect(result).toBe(state);
    });

    it('should expire buff when time is reached', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        luckyStarBuff: {
          startTime: Date.now() - 40000,
          endTime: Date.now() - 10000,
          multiplier: 2,
        },
      };

      const result = checkLuckyStarBuff(state);
      expect(result.luckyStarBuff).toBeNull();
    });

    it('should keep active buff', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        luckyStarBuff: {
          startTime: Date.now(),
          endTime: Date.now() + 20000,
          multiplier: 2,
        },
      };

      const result = checkLuckyStarBuff(state);
      expect(result.luckyStarBuff).not.toBeNull();
    });
  });

  describe('getLuckyStarMultiplier', () => {
    it('should return 1 if no buff', () => {
      const state = createInitialAnomalyState();
      expect(getLuckyStarMultiplier(state)).toBe(1);
    });

    it('should return multiplier if buff active', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        luckyStarBuff: {
          startTime: Date.now(),
          endTime: Date.now() + 20000,
          multiplier: 2,
        },
      };

      expect(getLuckyStarMultiplier(state)).toBe(2);
    });

    it('should return 1 if buff expired', () => {
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        luckyStarBuff: {
          startTime: Date.now() - 40000,
          endTime: Date.now() - 10000,
          multiplier: 2,
        },
      };

      expect(getLuckyStarMultiplier(state)).toBe(1);
    });
  });

  describe('getAnomalyTimeRemaining', () => {
    it('should return 0 if no anomaly', () => {
      const state = createInitialAnomalyState();
      expect(getAnomalyTimeRemaining(state)).toBe(0);
    });

    it('should return remaining time', () => {
      const now = Date.now();
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'CREDIT_BURST',
          planetId: 'greenPlanet',
          spawnTime: now,
          expiresAt: now + 5000,
        },
      };

      const remaining = getAnomalyTimeRemaining(state, now);
      expect(remaining).toBe(5000);
    });

    it('should return 0 if expired', () => {
      const now = Date.now();
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        activeAnomaly: {
          id: 'test-1',
          type: 'CREDIT_BURST',
          planetId: 'greenPlanet',
          spawnTime: now - 20000,
          expiresAt: now - 10000,
        },
      };

      const remaining = getAnomalyTimeRemaining(state, now);
      expect(remaining).toBe(0);
    });
  });

  describe('getLuckyStarTimeRemaining', () => {
    it('should return 0 if no buff', () => {
      const state = createInitialAnomalyState();
      expect(getLuckyStarTimeRemaining(state)).toBe(0);
    });

    it('should return remaining time', () => {
      const now = Date.now();
      const state: AnomalyStateData = {
        ...createInitialAnomalyState(),
        luckyStarBuff: {
          startTime: now,
          endTime: now + 15000,
          multiplier: 2,
        },
      };

      const remaining = getLuckyStarTimeRemaining(state, now);
      expect(remaining).toBe(15000);
    });
  });

  describe('formatAnomalyTime', () => {
    it('should format milliseconds to seconds', () => {
      expect(formatAnomalyTime(5000)).toBe('5.0s');
      expect(formatAnomalyTime(2500)).toBe('2.5s');
      expect(formatAnomalyTime(10000)).toBe('10.0s');
    });

    it('should return 0.0s for zero or negative', () => {
      expect(formatAnomalyTime(0)).toBe('0.0s');
      expect(formatAnomalyTime(-1000)).toBe('0.0s');
    });
  });

  describe('calculateCreditBurstReward', () => {
    it('should return minimum 100 credits', () => {
      const emptyPlanets: PlanetState[] = [];
      const reward = calculateCreditBurstReward(emptyPlanets);
      expect(reward).toBe(100);
    });

    it('should scale with plant production', () => {
      // Create planets with higher production
      const planets = createTestPlanets();
      planets[0].plants[0].productionRate = 50;
      planets[1].plants[0].productionRate = 50;

      const reward = calculateCreditBurstReward(planets);
      // wheat (50 rate * 1 value) + corn (50 rate * 2 value) = 150, * 10 = 1500
      expect(reward).toBeGreaterThan(100);
    });
  });

  describe('calculateCosmicShardReward', () => {
    it('should return 1-5 crystals', () => {
      for (let i = 0; i < 100; i++) {
        const reward = calculateCosmicShardReward();
        expect(reward).toBeGreaterThanOrEqual(1);
        expect(reward).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('generateRandomSeed', () => {
    it('should generate valid seed instance', () => {
      const seed = generateRandomSeed();

      expect(seed.instanceId).toBeDefined();
      expect(seed.id).toBeDefined();
      expect(seed.name).toBeDefined();
      expect(seed.tier).toBe(1);
      expect(seed.level).toBe(1);
    });
  });

  describe('ANOMALY_DEFINITIONS', () => {
    it('should have all required definitions', () => {
      expect(ANOMALY_DEFINITIONS.CREDIT_BURST).toBeDefined();
      expect(ANOMALY_DEFINITIONS.WARP_SPEED).toBeDefined();
      expect(ANOMALY_DEFINITIONS.LUCKY_STAR).toBeDefined();
      expect(ANOMALY_DEFINITIONS.COSMIC_SHARD).toBeDefined();
      expect(ANOMALY_DEFINITIONS.SEED_RAIN).toBeDefined();
    });

    it('should have valid icon and color for each definition', () => {
      for (const [_key, def] of Object.entries(ANOMALY_DEFINITIONS)) {
        expect(def.icon).toBeDefined();
        expect(def.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(def.rarity).toBeGreaterThan(0);
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
      }
    });
  });

  describe('ANOMALY_CONFIG', () => {
    it('should have valid timing values', () => {
      expect(ANOMALY_CONFIG.MIN_SPAWN_INTERVAL_MS).toBeGreaterThan(0);
      expect(ANOMALY_CONFIG.MAX_SPAWN_INTERVAL_MS).toBeGreaterThan(
        ANOMALY_CONFIG.MIN_SPAWN_INTERVAL_MS
      );
      expect(ANOMALY_CONFIG.COLLECT_WINDOW_MS).toBeGreaterThan(0);
      expect(ANOMALY_CONFIG.LUCKY_STAR_DURATION_MS).toBeGreaterThan(0);
      expect(ANOMALY_CONFIG.LUCKY_STAR_MULTIPLIER).toBeGreaterThan(1);
    });
  });

  describe('applyAnomalyRewardToState', () => {
    // Create a minimal GameState for testing
    const createMinimalState = () =>
      ({
        ship: {
          totalCurrency: 1000,
          crystals: 10,
          seedInventory: [],
          resources: { plants: {}, seedEssence: 0 },
          seed: null,
          currentPlanetIndex: 0,
        },
        planets: [
          {
            id: 'greenPlanet',
            name: 'Green Planet',
            unlocked: true,
            plants: [{ plant: 'wheat', currentAmount: 100, productionRate: 1 }],
            seeds: [],
            exportSpeed: 10,
            storageCapacity: 100,
            upgradeLevels: {},
          },
          {
            id: 'bluePlanet',
            name: 'Blue Planet',
            unlocked: true,
            plants: [{ plant: 'corn', currentAmount: 50, productionRate: 1 }],
            seeds: [],
            exportSpeed: 10,
            storageCapacity: 100,
            upgradeLevels: {},
          },
          {
            id: 'redPlanet',
            name: 'Red Planet',
            unlocked: false,
            plants: [],
            seeds: [],
            exportSpeed: 10,
            storageCapacity: 100,
            upgradeLevels: {},
          },
        ],
        research: { completed: [], refinedEssence: 0 },
        prestige: { lifetimeCredits: 0 },
        anomalies: createInitialAnomalyState(),
      }) as any;

    it('should return unchanged state when reward is undefined', () => {
      const state = createMinimalState();
      const result = applyAnomalyRewardToState(state, undefined);
      expect(result).toBe(state);
    });

    it('should apply credit reward', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = { credits: 500 };

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.totalCurrency).toBe(1500);
      // Original state unchanged
      expect(state.ship.totalCurrency).toBe(1000);
    });

    it('should apply crystal reward', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = { crystals: 5 };

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.crystals).toBe(15);
    });

    it('should apply seed reward', () => {
      const state = createMinimalState();
      const testSeed = {
        instanceId: 'test-seed-123',
        id: 'wheat',
        name: 'Wheat Seeds',
        tier: 2,
        level: 1,
        productionMultiplier: 1,
        valueMultiplier: 1,
        color: '#fff',
        powerLevel: 10,
        traits: [],
      };
      const reward: CollectAnomalyResult['reward'] = { seed: testSeed };

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.seedInventory).toHaveLength(1);
      expect(result.ship.seedInventory[0]).toBe(testSeed);
    });

    it('should apply instant export (Warp Speed) - drains plants to cargo', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = { instantExport: true };

      const result = applyAnomalyRewardToState(state, reward);

      // Green planet: unlocked with 100 wheat, should be drained (fractional remainder only)
      expect(result.planets[0].plants[0].currentAmount).toBeLessThan(1);
      // Blue planet: unlocked with 50 corn, should be drained
      expect(result.planets[1].plants[0].currentAmount).toBeLessThan(1);
      // Red planet: not unlocked, should be unchanged (no plants anyway)
      expect(result.planets[2].plants).toHaveLength(0);
      // Cargo should have the drained amounts
      expect(result.ship.resources.plants['wheat']).toBe(100);
      expect(result.ship.resources.plants['corn']).toBe(50);
    });

    it('should not modify planets without plants for instant export', () => {
      const state = createMinimalState();
      // Remove plants from green planet
      state.planets[0].plants = [];
      const reward: CollectAnomalyResult['reward'] = { instantExport: true };

      const result = applyAnomalyRewardToState(state, reward);

      // Green planet: no plants, cargo should not have wheat
      expect(result.ship.resources.plants['wheat']).toBeUndefined();
      // Blue planet: has plants, should be drained to cargo
      expect(result.ship.resources.plants['corn']).toBe(50);
    });

    it('should apply multiple rewards at once', () => {
      const state = createMinimalState();
      const testSeed = {
        instanceId: 'multi-seed',
        id: 'corn',
        name: 'Corn Seeds',
        tier: 1,
        level: 1,
        productionMultiplier: 1,
        valueMultiplier: 1,
        color: '#ff0',
        powerLevel: 5,
        traits: [],
      };
      const reward: CollectAnomalyResult['reward'] = {
        credits: 200,
        crystals: 3,
        seed: testSeed,
      };

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.totalCurrency).toBe(1200);
      expect(result.ship.crystals).toBe(13);
      expect(result.ship.seedInventory).toHaveLength(1);
      expect(result.ship.seedInventory[0].id).toBe('corn');
    });

    it('should handle empty reward object', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = {};

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.totalCurrency).toBe(1000);
      expect(result.ship.crystals).toBe(10);
      expect(result.ship.seedInventory).toHaveLength(0);
    });

    it('should not modify productionBuff (handled elsewhere)', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = {
        productionBuff: {
          startTime: Date.now(),
          endTime: Date.now() + 30000,
          multiplier: 2,
        },
      };

      const result = applyAnomalyRewardToState(state, reward);

      // State should be unchanged since productionBuff is handled in anomaly state
      expect(result.ship.totalCurrency).toBe(1000);
      expect(result.anomalies).toBe(state.anomalies);
    });

    it('should handle zero credits gracefully', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = { credits: 0 };

      const result = applyAnomalyRewardToState(state, reward);

      // Zero credits should not modify state
      expect(result.ship.totalCurrency).toBe(1000);
    });

    it('should handle zero crystals gracefully', () => {
      const state = createMinimalState();
      const reward: CollectAnomalyResult['reward'] = { crystals: 0 };

      const result = applyAnomalyRewardToState(state, reward);

      // Zero crystals should not modify state
      expect(result.ship.crystals).toBe(10);
    });

    it('should handle large credit rewards', () => {
      const state = createMinimalState();
      const largeAmount = 1_000_000_000;
      const reward: CollectAnomalyResult['reward'] = { credits: largeAmount };

      const result = applyAnomalyRewardToState(state, reward);

      expect(result.ship.totalCurrency).toBe(1000 + largeAmount);
    });
  });
});
