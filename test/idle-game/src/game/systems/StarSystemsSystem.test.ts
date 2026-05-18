/**
 * Star Systems Tests
 * Tests for galaxy map types, state factories, and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type TradeRoute,
  type BinarySystemState,
  type NebulaSystemState,
  type BlackHoleSystemState,
  type DysonSphereState,
  // Constants
  BINARY_PHASE_DURATIONS,
  BINARY_FULL_CYCLE_MS,
  BASE_TRAVEL_TIMES,
  TRADE_ROUTE_EFFICIENCY,
  DYSON_EFFICIENCY_COSTS,
  STAR_SYSTEM_DEFINITIONS,
  SHIP_BASE_CARGO,
  SHIP_MAX_CARGO,
  STABILITY_LOSS_PER_EXPORT,
  STABILITY_GAIN_PER_MINUTE,
  NEBULA_CRYSTAL_SPAWN_CHANCE,
  // Factory functions
  createInitialBinaryState,
  createInitialNebulaState,
  createInitialBlackHoleState,
  createInitialDysonState,
  createInitialStarSystem,
  createInitialTravelShip,
  createInitialStarSystemsState,
  // Utility functions
  getBinaryPhase,
  getTimeUntilNextPhase,
  getBinaryProductionMultiplier,
  getBinaryExportMultiplier,
  calculateTravelTime,
  checkSystemUnlockRequirements,
  calculateTradeRouteIncome,
  getNebulaDensityLevel,
  getNebulaRefinementMultiplier,
  getNebulaProductionModifier,
  checkEventHorizon,
  getStabilityStatus,
  getBlackHoleProductionMultiplier,
} from './StarSystemsSystem';

describe('StarSystemsSystem', () => {
  describe('Constants', () => {
    it('binary cycle phases sum to full cycle', () => {
      const totalDuration = Object.values(BINARY_PHASE_DURATIONS).reduce((sum, d) => sum + d, 0);
      expect(totalDuration).toBe(BINARY_FULL_CYCLE_MS);
    });

    it('binary cycle is 20 minutes total', () => {
      expect(BINARY_FULL_CYCLE_MS).toBe(20 * 60 * 1000);
    });

    it('trade route efficiency increases with level', () => {
      const levels = [1, 2, 3, 4, 5];
      for (let i = 1; i < levels.length; i++) {
        expect(TRADE_ROUTE_EFFICIENCY[levels[i]]).toBeGreaterThan(
          TRADE_ROUTE_EFFICIENCY[levels[i - 1]]
        );
      }
    });

    it('dyson efficiency costs escalate properly', () => {
      for (let i = 1; i < DYSON_EFFICIENCY_COSTS.length; i++) {
        expect(DYSON_EFFICIENCY_COSTS[i].crystals).toBeGreaterThan(
          DYSON_EFFICIENCY_COSTS[i - 1].crystals
        );
      }
    });

    it('all star systems have definitions', () => {
      const systemIds = ['home', 'binary', 'nebula', 'blackhole', 'dyson'];
      for (const id of systemIds) {
        expect(STAR_SYSTEM_DEFINITIONS[id]).toBeDefined();
        expect(STAR_SYSTEM_DEFINITIONS[id].name).toBeTruthy();
        expect(STAR_SYSTEM_DEFINITIONS[id].type).toBeTruthy();
      }
    });

    it('home system is always unlocked', () => {
      expect(STAR_SYSTEM_DEFINITIONS.home.unlocked).toBe(true);
      expect(STAR_SYSTEM_DEFINITIONS.home.unlockRequirements).toHaveLength(0);
    });

    it('non-home systems require ascension', () => {
      const otherSystems = ['binary', 'nebula', 'blackhole', 'dyson'];
      for (const id of otherSystems) {
        const def = STAR_SYSTEM_DEFINITIONS[id];
        expect(def.unlocked).toBe(false);
        expect(def.unlockRequirements.length).toBeGreaterThan(0);
        expect(def.unlockRequirements.some(r => r.type === 'ascensionLevel')).toBe(true);
      }
    });

    it('all systems have non-empty planet IDs', () => {
      for (const [_id, def] of Object.entries(STAR_SYSTEM_DEFINITIONS)) {
        expect(def.planetIds.length).toBeGreaterThan(0);
      }
    });

    it('ship cargo constants are valid', () => {
      expect(SHIP_BASE_CARGO).toBe(10);
      expect(SHIP_MAX_CARGO).toBe(50);
      expect(SHIP_MAX_CARGO).toBeGreaterThan(SHIP_BASE_CARGO);
    });

    it('stability constants are defined', () => {
      expect(STABILITY_LOSS_PER_EXPORT).toBeLessThan(0);
      expect(STABILITY_GAIN_PER_MINUTE).toBeGreaterThan(0);
    });

    it('nebula crystal spawn chance is reasonable', () => {
      expect(NEBULA_CRYSTAL_SPAWN_CHANCE).toBeGreaterThan(0);
      expect(NEBULA_CRYSTAL_SPAWN_CHANCE).toBeLessThanOrEqual(1);
    });
  });

  describe('Factory Functions', () => {
    describe('createInitialBinaryState', () => {
      it('creates valid binary state', () => {
        const state = createInitialBinaryState();
        expect(state.phase).toBe('dawn');
        expect(state.phaseStartTime).toBeLessThanOrEqual(Date.now());
        expect(state.solarFlareActive).toBe(false);
        expect(state.solarFlareStartTime).toBeNull();
        expect(state.solarSiloCargo).toBe(0);
      });
    });

    describe('createInitialNebulaState', () => {
      it('creates valid nebula state', () => {
        const state = createInitialNebulaState();
        expect(state.density).toBe(0);
        expect(state.crystalsAvailable).toBe(0);
        expect(state.lastCrystalSpawn).toBe(0);
      });
    });

    describe('createInitialBlackHoleState', () => {
      it('creates valid black hole state', () => {
        const state = createInitialBlackHoleState();
        expect(state.eventHorizonActive).toBe(false);
        expect(state.collapsedPlanets).toHaveLength(0);
        // All planets start at 100% stability
        expect(Object.values(state.planetStability).every(s => s === 100)).toBe(true);
      });
    });

    describe('createInitialDysonState', () => {
      it('creates valid dyson state', () => {
        const state = createInitialDysonState();
        expect(state.efficiency).toBe(1); // 1%
        expect(state.activeProjects).toHaveLength(0);
        expect(state.completedUpgrades).toHaveLength(0);
      });
    });

    describe('createInitialStarSystem', () => {
      it('creates home system without unique state', () => {
        const system = createInitialStarSystem('home');
        expect(system.id).toBe('home');
        expect(system.type).toBe('home');
        expect(system.unlocked).toBe(true);
        expect(system.uniqueState).toBeNull();
      });

      it('creates binary system with phase state', () => {
        const system = createInitialStarSystem('binary');
        expect(system.type).toBe('binary');
        expect(system.uniqueState).not.toBeNull();
        const state = system.uniqueState as BinarySystemState;
        expect(state.phase).toBe('dawn');
      });

      it('creates nebula system with density state', () => {
        const system = createInitialStarSystem('nebula');
        expect(system.type).toBe('nebula');
        const state = system.uniqueState as NebulaSystemState;
        expect(state.density).toBe(0);
      });

      it('creates black hole system with stability state', () => {
        const system = createInitialStarSystem('blackhole');
        expect(system.type).toBe('blackhole');
        const state = system.uniqueState as BlackHoleSystemState;
        expect(Object.keys(state.planetStability).length).toBeGreaterThan(0);
      });

      it('creates dyson sphere with efficiency state', () => {
        const system = createInitialStarSystem('dyson');
        expect(system.type).toBe('dyson');
        const state = system.uniqueState as DysonSphereState;
        expect(state.efficiency).toBe(1);
      });

      it('throws for unknown system', () => {
        expect(() => createInitialStarSystem('unknown')).toThrow('Unknown star system');
      });
    });

    describe('createInitialTravelShip', () => {
      it('creates ship in home system', () => {
        const ship = createInitialTravelShip();
        expect(ship.currentSystem).toBe('home');
        expect(ship.destinationSystem).toBeNull();
        expect(ship.travelStartTime).toBeNull();
        expect(ship.cargo).toHaveLength(0);
        expect(ship.maxCargo).toBe(10); // SHIP_BASE_CARGO
        expect(ship.upgradeLevel).toBe(0);
      });
    });

    describe('createInitialStarSystemsState', () => {
      it('creates complete state with all systems', () => {
        const state = createInitialStarSystemsState();
        expect(state.galaxyMapUnlocked).toBe(false);
        expect(Object.keys(state.systems)).toHaveLength(5);
        expect(state.ship.currentSystem).toBe('home');
        expect(state.tradeRoutes).toHaveLength(0);
        expect(state.maxTradeRoutes).toBe(2);
        expect(state.activeSynergies).toHaveLength(0);
      });

      it('all systems have correct initial state', () => {
        const state = createInitialStarSystemsState();
        expect(state.systems.home.unlocked).toBe(true);
        expect(state.systems.binary.unlocked).toBe(false);
        expect(state.systems.nebula.unlocked).toBe(false);
        expect(state.systems.blackhole.unlocked).toBe(false);
        expect(state.systems.dyson.unlocked).toBe(false);
      });
    });
  });

  describe('Binary System Utilities', () => {
    describe('getBinaryPhase', () => {
      it('returns dawn at start', () => {
        const state = createInitialBinaryState();
        expect(getBinaryPhase(state)).toBe('dawn');
      });

      it('returns day after dawn', () => {
        const state = createInitialBinaryState();
        state.phaseStartTime = Date.now() - BINARY_PHASE_DURATIONS.dawn - 1000;
        expect(getBinaryPhase(state)).toBe('day');
      });

      it('returns dusk after day', () => {
        const state = createInitialBinaryState();
        state.phaseStartTime =
          Date.now() - BINARY_PHASE_DURATIONS.dawn - BINARY_PHASE_DURATIONS.day - 1000;
        expect(getBinaryPhase(state)).toBe('dusk');
      });

      it('returns night after dusk', () => {
        const state = createInitialBinaryState();
        state.phaseStartTime =
          Date.now() -
          BINARY_PHASE_DURATIONS.dawn -
          BINARY_PHASE_DURATIONS.day -
          BINARY_PHASE_DURATIONS.dusk -
          1000;
        expect(getBinaryPhase(state)).toBe('night');
      });

      it('handles cycle wrap after full 20-minute cycle', () => {
        const state = createInitialBinaryState();
        // 25 minutes = 1 full cycle (20 min) + 5 min into second cycle
        // 5 min = past dawn (2 min) + 3 min into day
        state.phaseStartTime = Date.now() - 25 * 60 * 1000;
        expect(getBinaryPhase(state)).toBe('day');
      });

      it('handles multiple cycle wraps', () => {
        const state = createInitialBinaryState();
        // 100 minutes = 5 full cycles, back to dawn
        state.phaseStartTime = Date.now() - 100 * 60 * 1000;
        expect(getBinaryPhase(state)).toBe('dawn');
      });

      it('handles exact phase boundary', () => {
        const state = createInitialBinaryState();
        // Exactly at dawn/day boundary
        state.phaseStartTime = Date.now() - BINARY_PHASE_DURATIONS.dawn;
        expect(getBinaryPhase(state)).toBe('day');
      });
    });

    describe('getTimeUntilNextPhase', () => {
      it('returns remaining time in current phase', () => {
        const state = createInitialBinaryState();
        const remaining = getTimeUntilNextPhase(state);
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(BINARY_PHASE_DURATIONS.dawn);
      });

      it('handles cycle wrap correctly', () => {
        const state = createInitialBinaryState();
        // 21 minutes = 1 full cycle + 1 minute into second dawn
        state.phaseStartTime = Date.now() - 21 * 60 * 1000;
        const remaining = getTimeUntilNextPhase(state);
        // Should be about 1 minute left in dawn (2 min total - 1 min elapsed)
        expect(remaining).toBeLessThanOrEqual(BINARY_PHASE_DURATIONS.dawn);
        expect(remaining).toBeGreaterThan(0);
      });
    });

    describe('getBinaryProductionMultiplier', () => {
      it('returns correct multipliers for each phase', () => {
        expect(getBinaryProductionMultiplier('dawn')).toBe(1.75);
        expect(getBinaryProductionMultiplier('day')).toBe(2.0);
        expect(getBinaryProductionMultiplier('dusk')).toBe(1.75);
        expect(getBinaryProductionMultiplier('night')).toBe(0.5);
      });
    });

    describe('getBinaryExportMultiplier', () => {
      it('returns 4x during night', () => {
        expect(getBinaryExportMultiplier('night')).toBe(4.0);
      });

      it('returns 2x during other phases', () => {
        expect(getBinaryExportMultiplier('dawn')).toBe(2.0);
        expect(getBinaryExportMultiplier('day')).toBe(2.0);
        expect(getBinaryExportMultiplier('dusk')).toBe(2.0);
      });
    });
  });

  describe('Travel Utilities', () => {
    describe('calculateTravelTime', () => {
      it('returns 0 for same system', () => {
        expect(calculateTravelTime('home', 'home', 0)).toBe(0);
      });

      it('returns base time with no upgrades', () => {
        expect(calculateTravelTime('home', 'binary', 0)).toBe(BASE_TRAVEL_TIMES.home.binary);
      });

      it('reduces time with upgrades', () => {
        const baseTime = calculateTravelTime('home', 'binary', 0);
        const upgradedTime = calculateTravelTime('home', 'binary', 2);
        expect(upgradedTime).toBeLessThan(baseTime);
      });

      it('each upgrade reduces by 20%', () => {
        const base = calculateTravelTime('home', 'binary', 0);
        const oneUpgrade = calculateTravelTime('home', 'binary', 1);
        expect(oneUpgrade).toBe(Math.floor(base * 0.8));
      });
    });
  });

  describe('Unlock Requirements', () => {
    describe('checkSystemUnlockRequirements', () => {
      it('home is always unlocked', () => {
        expect(checkSystemUnlockRequirements('home', 0, 0, 0, {})).toBe(true);
      });

      it('binary requires ascension 1', () => {
        expect(checkSystemUnlockRequirements('binary', 0, 0, 0, {})).toBe(false);
        expect(checkSystemUnlockRequirements('binary', 1, 0, 0, {})).toBe(true);
      });

      it('nebula requires ascension 3 and 500 prestige points', () => {
        expect(checkSystemUnlockRequirements('nebula', 2, 1000, 0, {})).toBe(false);
        expect(checkSystemUnlockRequirements('nebula', 3, 499, 0, {})).toBe(false);
        expect(checkSystemUnlockRequirements('nebula', 3, 500, 0, {})).toBe(true);
      });

      it('blackhole requires ascension 5 and 10 legendary managers', () => {
        expect(checkSystemUnlockRequirements('blackhole', 5, 0, 9, {})).toBe(false);
        expect(checkSystemUnlockRequirements('blackhole', 4, 0, 10, {})).toBe(false);
        expect(checkSystemUnlockRequirements('blackhole', 5, 0, 10, {})).toBe(true);
      });

      it('dyson requires ascension 10 and all system mastery', () => {
        const noMastery = {};
        const partialMastery = { home: true, binary: true };
        const fullMastery = {
          home: true,
          binary: true,
          nebula: true,
          blackhole: true,
        };

        expect(checkSystemUnlockRequirements('dyson', 10, 0, 0, noMastery)).toBe(false);
        expect(checkSystemUnlockRequirements('dyson', 10, 0, 0, partialMastery)).toBe(false);
        expect(checkSystemUnlockRequirements('dyson', 10, 0, 0, fullMastery)).toBe(true);
        expect(checkSystemUnlockRequirements('dyson', 9, 0, 0, fullMastery)).toBe(false);
      });

      it('returns false for unknown system', () => {
        expect(checkSystemUnlockRequirements('unknown', 100, 100, 100, {})).toBe(false);
      });
    });
  });

  describe('Trade Route Utilities', () => {
    describe('calculateTradeRouteIncome', () => {
      it('returns 0 for inactive route', () => {
        const route: TradeRoute = {
          id: 'test',
          sourceSystem: 'home',
          destinationSystem: 'binary',
          resourceType: 'credits',
          level: 3,
          assignedManager: null,
          efficiency: 0.2,
          active: false,
        };
        expect(calculateTradeRouteIncome(route, 10000)).toBe(0);
      });

      it('calculates based on level efficiency', () => {
        const route: TradeRoute = {
          id: 'test',
          sourceSystem: 'home',
          destinationSystem: 'binary',
          resourceType: 'credits',
          level: 1, // 10% efficiency
          assignedManager: null,
          efficiency: 0.1,
          active: true,
        };
        expect(calculateTradeRouteIncome(route, 10000)).toBe(1000);
      });

      it('adds manager bonus', () => {
        const route: TradeRoute = {
          id: 'test',
          sourceSystem: 'home',
          destinationSystem: 'binary',
          resourceType: 'credits',
          level: 1,
          assignedManager: 'manager1',
          efficiency: 0.1,
          active: true,
        };
        expect(calculateTradeRouteIncome(route, 10000, 0.1)).toBe(2000); // 10% + 10%
      });
    });
  });

  describe('Nebula Utilities', () => {
    describe('getNebulaDensityLevel', () => {
      it('returns correct density levels', () => {
        expect(getNebulaDensityLevel(0)).toBe('sparse');
        expect(getNebulaDensityLevel(24)).toBe('sparse');
        expect(getNebulaDensityLevel(25)).toBe('dense');
        expect(getNebulaDensityLevel(49)).toBe('dense');
        expect(getNebulaDensityLevel(50)).toBe('thick');
        expect(getNebulaDensityLevel(74)).toBe('thick');
        expect(getNebulaDensityLevel(75)).toBe('critical');
        expect(getNebulaDensityLevel(100)).toBe('critical');
      });
    });

    describe('getNebulaRefinementMultiplier', () => {
      it('base 3x at sparse', () => {
        expect(getNebulaRefinementMultiplier(0)).toBe(3.0);
      });

      it('increases with density', () => {
        expect(getNebulaRefinementMultiplier(25)).toBeGreaterThan(3.0);
        expect(getNebulaRefinementMultiplier(50)).toBeGreaterThan(
          getNebulaRefinementMultiplier(25)
        );
        expect(getNebulaRefinementMultiplier(75)).toBeGreaterThan(
          getNebulaRefinementMultiplier(50)
        );
      });
    });

    describe('getNebulaProductionModifier', () => {
      it('no penalty at sparse', () => {
        expect(getNebulaProductionModifier(0)).toBe(1.0);
      });

      it('decreases with density', () => {
        expect(getNebulaProductionModifier(25)).toBeLessThan(1.0);
        expect(getNebulaProductionModifier(50)).toBeLessThan(getNebulaProductionModifier(25));
        expect(getNebulaProductionModifier(75)).toBeLessThan(getNebulaProductionModifier(50));
      });
    });
  });

  describe('Black Hole Utilities', () => {
    describe('checkEventHorizon', () => {
      it('returns false when any planet is >= 50%', () => {
        expect(
          checkEventHorizon({
            planet1: 100,
            planet2: 49,
            planet3: 49,
          })
        ).toBe(false);
      });

      it('returns true when all planets are < 50%', () => {
        expect(
          checkEventHorizon({
            planet1: 49,
            planet2: 30,
            planet3: 10,
          })
        ).toBe(true);
      });

      it('returns false for empty stability map', () => {
        expect(checkEventHorizon({})).toBe(false);
      });
    });

    describe('getStabilityStatus', () => {
      it('returns correct status for stability values', () => {
        expect(getStabilityStatus(100)).toBe('stable');
        expect(getStabilityStatus(75)).toBe('stable');
        expect(getStabilityStatus(74)).toBe('unstable');
        expect(getStabilityStatus(50)).toBe('unstable');
        expect(getStabilityStatus(49)).toBe('critical');
        expect(getStabilityStatus(25)).toBe('critical');
        expect(getStabilityStatus(24)).toBe('collapse');
        expect(getStabilityStatus(0)).toBe('collapse');
      });
    });

    describe('getBlackHoleProductionMultiplier', () => {
      it('returns 10x at full stability', () => {
        expect(getBlackHoleProductionMultiplier(100, false)).toBe(10.0);
      });

      it('returns 20x during Event Horizon', () => {
        expect(getBlackHoleProductionMultiplier(49, true)).toBe(20.0 * 0.9); // Event + unstable
      });

      it('reduces by 10% when unstable', () => {
        expect(getBlackHoleProductionMultiplier(74, false)).toBe(9.0);
      });
    });
  });
});
