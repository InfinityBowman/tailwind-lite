/**
 * Anomaly System - Random space anomalies that appear on planets
 *
 * Anomalies spawn every 2-5 minutes and must be clicked within 10 seconds.
 * Types:
 * - Credit Burst: Instant credits (10x normal export)
 * - Warp Speed: Instant export on all planets
 * - Lucky Star: Next 30 seconds = 2x production
 * - Cosmic Shard: Rare crystals (1-5)
 * - Seed Rain: Free random seed
 */

import { SEED_TYPES, GACHA_COMMON_SEEDS, GACHA_UNCOMMON_SEEDS } from '../config/seeds';
import { generateUniqueId } from './GachaSystem';
import type { SeedInstance, PlanetState, GameState } from '../state/GameState';

// ============================================
// ANOMALY TYPES
// ============================================

export type AnomalyType =
  | 'CREDIT_BURST' // Instant credits (10x normal export)
  | 'WARP_SPEED' // Instant export on all planets
  | 'LUCKY_STAR' // Next 30 seconds = 2x production
  | 'COSMIC_SHARD' // Rare crystals (1-5)
  | 'SEED_RAIN'; // Free random seed

export interface AnomalyDefinition {
  id: AnomalyType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  rarity: number; // Weight for random selection (higher = more common)
}

export const ANOMALY_DEFINITIONS: Record<AnomalyType, AnomalyDefinition> = {
  CREDIT_BURST: {
    id: 'CREDIT_BURST',
    name: 'Credit Burst',
    description: 'Instant credits worth 10x normal export!',
    icon: 'Coins',
    color: '#F59E0B', // amber
    rarity: 30,
  },
  WARP_SPEED: {
    id: 'WARP_SPEED',
    name: 'Warp Speed',
    description: 'Instant export on all planets!',
    icon: 'Rocket',
    color: '#3B82F6', // blue
    rarity: 20,
  },
  LUCKY_STAR: {
    id: 'LUCKY_STAR',
    name: 'Lucky Star',
    description: '2x production for 30 seconds!',
    icon: 'Star',
    color: '#10B981', // emerald
    rarity: 25,
  },
  COSMIC_SHARD: {
    id: 'COSMIC_SHARD',
    name: 'Cosmic Shard',
    description: 'Rare crystals from the void!',
    icon: 'Gem',
    color: '#8B5CF6', // violet
    rarity: 15,
  },
  SEED_RAIN: {
    id: 'SEED_RAIN',
    name: 'Seed Rain',
    description: 'A free random seed from the cosmos!',
    icon: 'Sprout',
    color: '#22C55E', // green
    rarity: 10,
  },
};

// ============================================
// ANOMALY TIMING CONFIG
// ============================================

export const ANOMALY_CONFIG = {
  MIN_SPAWN_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes
  MAX_SPAWN_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  COLLECT_WINDOW_MS: 10 * 1000, // 10 seconds to click
  LUCKY_STAR_DURATION_MS: 30 * 1000, // 30 seconds of 2x production
  LUCKY_STAR_MULTIPLIER: 2.0,
};

// ============================================
// ANOMALY STATE
// ============================================

export interface ActiveAnomaly {
  id: string; // Unique instance ID
  type: AnomalyType;
  planetId: string; // Which planet it appeared on
  spawnTime: number; // When it spawned
  expiresAt: number; // When it fades away
}

export interface LuckyStarBuff {
  startTime: number;
  endTime: number;
  multiplier: number;
}

export interface AnomalyStateData {
  activeAnomaly: ActiveAnomaly | null;
  nextSpawnTime: number; // When the next anomaly will spawn
  luckyStarBuff: LuckyStarBuff | null; // Active Lucky Star buff
  totalCollected: number; // Stats tracking
  collectedByType: Record<AnomalyType, number>;
}

export function createInitialAnomalyState(): AnomalyStateData {
  return {
    activeAnomaly: null,
    nextSpawnTime: Date.now() + getRandomSpawnDelay(),
    luckyStarBuff: null,
    totalCollected: 0,
    collectedByType: {
      CREDIT_BURST: 0,
      WARP_SPEED: 0,
      LUCKY_STAR: 0,
      COSMIC_SHARD: 0,
      SEED_RAIN: 0,
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get random delay until next anomaly spawn
 */
export function getRandomSpawnDelay(): number {
  const { MIN_SPAWN_INTERVAL_MS, MAX_SPAWN_INTERVAL_MS } = ANOMALY_CONFIG;
  return MIN_SPAWN_INTERVAL_MS + Math.random() * (MAX_SPAWN_INTERVAL_MS - MIN_SPAWN_INTERVAL_MS);
}

/**
 * Pick a random anomaly type based on rarity weights
 */
export function pickRandomAnomalyType(): AnomalyType {
  const definitions = Object.values(ANOMALY_DEFINITIONS);
  const totalWeight = definitions.reduce((sum, def) => sum + def.rarity, 0);

  let roll = Math.random() * totalWeight;

  for (const def of definitions) {
    roll -= def.rarity;
    if (roll <= 0) {
      return def.id;
    }
  }

  // Fallback (should never happen)
  return 'CREDIT_BURST';
}

/**
 * Generate a random seed for Seed Rain anomaly
 */
export function generateRandomSeed(): SeedInstance {
  // 80% common, 20% uncommon
  const pool = Math.random() < 0.8 ? GACHA_COMMON_SEEDS : GACHA_UNCOMMON_SEEDS;
  const seedId = pool[Math.floor(Math.random() * pool.length)];
  const seedDef = SEED_TYPES[seedId];

  return {
    instanceId: generateUniqueId(),
    id: seedId,
    name: seedDef.name,
    tier: 1,
    level: 1,
    productionMultiplier: 1,
    valueMultiplier: 1,
    color: '#ffffff',
    powerLevel: 1,
    traits: [],
  };
}

/**
 * Calculate credit burst reward based on planet export values
 */
export function calculateCreditBurstReward(planets: PlanetState[]): number {
  let totalExportValue = 0;

  for (const planet of planets) {
    if (!planet.unlocked) continue;

    for (const plant of planet.plants) {
      const seedDef = SEED_TYPES[plant.plant];
      if (seedDef) {
        // Use production rate as base, multiply by sell value
        totalExportValue += plant.productionRate * seedDef.baseSellValue;
      }
    }
  }

  // 10x normal export equivalent (scale by export time to get per-export value)
  return Math.max(100, Math.floor(totalExportValue * 10));
}

/**
 * Calculate Cosmic Shard reward (1-5 crystals)
 */
export function calculateCosmicShardReward(): number {
  return 1 + Math.floor(Math.random() * 5);
}

// ============================================
// ANOMALY MANAGEMENT
// ============================================

/**
 * Check if a new anomaly should spawn
 */
export function checkAnomalySpawn(
  state: AnomalyStateData,
  planets: PlanetState[],
  timestamp: number = Date.now()
): AnomalyStateData {
  // If there's already an active anomaly, check if it expired
  if (state.activeAnomaly) {
    if (timestamp >= state.activeAnomaly.expiresAt) {
      // Anomaly expired without being collected
      return {
        ...state,
        activeAnomaly: null,
        nextSpawnTime: timestamp + getRandomSpawnDelay(),
      };
    }
    // Active anomaly still valid, no change
    return state;
  }

  // Check if it's time to spawn
  if (timestamp < state.nextSpawnTime) {
    return state;
  }

  // Get unlocked planets with seeds
  const eligiblePlanets = planets.filter(p => p.unlocked && p.seeds.length > 0);

  if (eligiblePlanets.length === 0) {
    // No eligible planets, delay next spawn
    return {
      ...state,
      nextSpawnTime: timestamp + getRandomSpawnDelay(),
    };
  }

  // Pick random planet and anomaly type
  const planet = eligiblePlanets[Math.floor(Math.random() * eligiblePlanets.length)];
  const anomalyType = pickRandomAnomalyType();

  return {
    ...state,
    activeAnomaly: {
      id: generateUniqueId(),
      type: anomalyType,
      planetId: planet.id,
      spawnTime: timestamp,
      expiresAt: timestamp + ANOMALY_CONFIG.COLLECT_WINDOW_MS,
    },
  };
}

/**
 * Check and expire Lucky Star buff
 */
export function checkLuckyStarBuff(
  state: AnomalyStateData,
  timestamp: number = Date.now()
): AnomalyStateData {
  if (!state.luckyStarBuff) {
    return state;
  }

  if (timestamp >= state.luckyStarBuff.endTime) {
    return {
      ...state,
      luckyStarBuff: null,
    };
  }

  return state;
}

/**
 * Get the current production multiplier from Lucky Star buff
 */
export function getLuckyStarMultiplier(
  state: AnomalyStateData,
  timestamp: number = Date.now()
): number {
  if (!state.luckyStarBuff) {
    return 1;
  }

  if (timestamp >= state.luckyStarBuff.endTime) {
    return 1;
  }

  return state.luckyStarBuff.multiplier;
}

// ============================================
// ANOMALY COLLECTION
// ============================================

export interface CollectAnomalyResult {
  success: boolean;
  message?: string;
  type?: AnomalyType;
  reward?: {
    credits?: number;
    crystals?: number;
    seed?: SeedInstance;
    instantExport?: boolean;
    productionBuff?: LuckyStarBuff;
  };
  newState: AnomalyStateData;
}

/**
 * Collect an active anomaly
 */
export function collectAnomaly(
  state: AnomalyStateData,
  planets: PlanetState[],
  timestamp: number = Date.now()
): CollectAnomalyResult {
  if (!state.activeAnomaly) {
    return {
      success: false,
      message: 'No active anomaly',
      newState: state,
    };
  }

  if (timestamp >= state.activeAnomaly.expiresAt) {
    return {
      success: false,
      message: 'Anomaly has expired',
      newState: {
        ...state,
        activeAnomaly: null,
        nextSpawnTime: timestamp + getRandomSpawnDelay(),
      },
    };
  }

  const anomalyType = state.activeAnomaly.type;
  const _definition = ANOMALY_DEFINITIONS[anomalyType]; // kept for future use

  // Calculate reward based on type
  const reward: CollectAnomalyResult['reward'] = {};

  switch (anomalyType) {
    case 'CREDIT_BURST':
      reward.credits = calculateCreditBurstReward(planets);
      break;

    case 'WARP_SPEED':
      reward.instantExport = true;
      break;

    case 'LUCKY_STAR':
      reward.productionBuff = {
        startTime: timestamp,
        endTime: timestamp + ANOMALY_CONFIG.LUCKY_STAR_DURATION_MS,
        multiplier: ANOMALY_CONFIG.LUCKY_STAR_MULTIPLIER,
      };
      break;

    case 'COSMIC_SHARD':
      reward.crystals = calculateCosmicShardReward();
      break;

    case 'SEED_RAIN':
      reward.seed = generateRandomSeed();
      break;
  }

  // Update stats and clear anomaly
  const newState: AnomalyStateData = {
    ...state,
    activeAnomaly: null,
    nextSpawnTime: timestamp + getRandomSpawnDelay(),
    luckyStarBuff: reward.productionBuff || state.luckyStarBuff,
    totalCollected: state.totalCollected + 1,
    collectedByType: {
      ...state.collectedByType,
      [anomalyType]: (state.collectedByType[anomalyType] || 0) + 1,
    },
  };

  return {
    success: true,
    type: anomalyType,
    reward,
    newState,
  };
}

/**
 * Get time remaining on active anomaly (for UI)
 * Accepts full state or just the ActiveAnomaly object
 */
export function getAnomalyTimeRemaining(
  stateOrAnomaly: AnomalyStateData | ActiveAnomaly,
  timestamp: number = Date.now()
): number {
  // Check if it's an ActiveAnomaly (has expiresAt) or AnomalyStateData (has activeAnomaly)
  const anomaly = 'activeAnomaly' in stateOrAnomaly ? stateOrAnomaly.activeAnomaly : stateOrAnomaly;

  if (!anomaly) {
    return 0;
  }

  return Math.max(0, anomaly.expiresAt - timestamp);
}

/**
 * Get Lucky Star buff time remaining (for UI)
 * Accepts full state or just the LuckyStarBuff object
 */
export function getLuckyStarTimeRemaining(
  stateOrBuff: AnomalyStateData | LuckyStarBuff,
  timestamp: number = Date.now()
): number {
  // Check if it's a LuckyStarBuff (has endTime) or AnomalyStateData (has luckyStarBuff)
  const buff = 'luckyStarBuff' in stateOrBuff ? stateOrBuff.luckyStarBuff : stateOrBuff;

  if (!buff) {
    return 0;
  }

  return Math.max(0, buff.endTime - timestamp);
}

/**
 * Format time remaining as seconds with decimal
 */
export function formatAnomalyTime(ms: number): string {
  if (ms <= 0) return '0.0s';
  return `${(ms / 1000).toFixed(1)}s`;
}

// ============================================
// REWARD APPLICATION
// ============================================

/**
 * Apply anomaly reward to game state
 * Returns new GameState with reward applied
 *
 * Handles all anomaly reward types:
 * - credits: Added to ship.totalCurrency
 * - crystals: Added to ship.crystals
 * - seed: Added to ship.seedInventory
 * - instantExport: Drains all planet stockpiles to cargo instantly
 * - productionBuff: Handled by anomaly state (already in collectAnomaly)
 */
export function applyAnomalyRewardToState(
  state: GameState,
  reward: CollectAnomalyResult['reward']
): GameState {
  if (!reward) return state;

  let newState = state;

  // Credit Burst - add credits
  if (typeof reward.credits === 'number' && reward.credits > 0) {
    newState = {
      ...newState,
      ship: {
        ...newState.ship,
        totalCurrency: newState.ship.totalCurrency + reward.credits,
      },
    };
  }

  // Cosmic Shard - add crystals
  if (typeof reward.crystals === 'number' && reward.crystals > 0) {
    newState = {
      ...newState,
      ship: {
        ...newState.ship,
        crystals: newState.ship.crystals + reward.crystals,
      },
    };
  }

  // Seed Rain - add seed to inventory
  if (reward.seed) {
    newState = {
      ...newState,
      ship: {
        ...newState.ship,
        seedInventory: [...newState.ship.seedInventory, reward.seed],
      },
    };
  }

  // Warp Speed - instant drain of all plant stockpiles to cargo
  if (reward.instantExport) {
    const drainedResources: Record<string, number> = {};
    const newPlanets = newState.planets.map(planet => {
      if (!planet.unlocked || planet.plants.length === 0) return planet;

      // Drain all plant stockpiles
      for (const plant of planet.plants) {
        const amount = Math.floor(plant.currentAmount);
        if (amount > 0) {
          drainedResources[plant.plant] = (drainedResources[plant.plant] || 0) + amount;
        }
      }
      return {
        ...planet,
        plants: planet.plants.map(p => ({
          ...p,
          currentAmount: p.currentAmount - Math.floor(p.currentAmount),
        })),
      };
    });

    // Merge drained resources into ship cargo
    const currentCargo = { ...newState.ship.resources.plants };
    for (const [type, amount] of Object.entries(drainedResources)) {
      currentCargo[type] = (currentCargo[type] || 0) + amount;
    }

    newState = {
      ...newState,
      planets: newPlanets,
      ship: {
        ...newState.ship,
        resources: {
          ...newState.ship.resources,
          plants: currentCargo,
        },
      },
    };
  }

  // Note: productionBuff (Lucky Star) is handled in collectAnomaly
  // by setting luckyStarBuff on anomaly state - no additional state change needed here

  return newState;
}
