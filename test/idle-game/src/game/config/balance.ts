/**
 * Game Balance Configuration
 * All tunable game values in one place for easy adjustment
 *
 * BALANCE PHILOSOPHY:
 * - Early game (0-10 min): Slow discovery, 1 planet, learning mechanics
 * - Mid game (10-60 min): Multiple planets, fusion, research
 * - Late game (1hr+): High tier seeds, prestige consideration
 *
 * KEY CONSTRAINT: Production rate exceeds export speed by default (~2x),
 * creating meaningful storage management. Players must balance all 3 upgrade
 * knobs (production, export speed, storage) to avoid waste.
 */

import { UPGRADE_CONFIGS } from '@shared/upgrades';

// ============================================
// GACHA SYSTEM (re-exported from shared)
// ============================================

export { GACHA_CONFIG } from '@shared/gacha';

// ============================================
// SEED TIERS (re-exported from shared)
// ============================================

export { SEED_TIERS } from '@shared/seeds';
export { MAX_SEEDS_PER_PLANET, MAX_SEED_TIER, SEED_SCRAP_VALUES } from '@shared/balance';

// ============================================
// UPGRADE SYSTEM (server-authoritative values)
// ============================================

/**
 * Client-facing upgrade config using SCREAMING_CASE keys.
 * Values come from the server-authoritative shared config.
 *
 * All upgrades use multiplicative formula: base * (1 + effectMultiplier * level)
 */
export const UPGRADE_CONFIG = {
  PRODUCTION_RATE: {
    baseCost: UPGRADE_CONFIGS.productionRate.baseCost,
    scalingFactor: UPGRADE_CONFIGS.productionRate.costMultiplier,
    effectMultiplier: UPGRADE_CONFIGS.productionRate.effectMultiplier,
    maxLevel: UPGRADE_CONFIGS.productionRate.maxLevel,
  },
  EXPORT_SPEED: {
    baseCost: UPGRADE_CONFIGS.exportSpeed.baseCost,
    scalingFactor: UPGRADE_CONFIGS.exportSpeed.costMultiplier,
    effectMultiplier: UPGRADE_CONFIGS.exportSpeed.effectMultiplier,
    maxLevel: UPGRADE_CONFIGS.exportSpeed.maxLevel,
  },
  STORAGE_CAPACITY: {
    baseCost: UPGRADE_CONFIGS.storageCapacity.baseCost,
    scalingFactor: UPGRADE_CONFIGS.storageCapacity.costMultiplier,
    effectMultiplier: UPGRADE_CONFIGS.storageCapacity.effectMultiplier,
    maxLevel: UPGRADE_CONFIGS.storageCapacity.maxLevel,
  },
} as const;

export type UpgradeType = keyof typeof UPGRADE_CONFIG;

// ============================================
// SAVE SYSTEM
// ============================================

export const SAVE_CONFIG = {
  AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds
  STORAGE_KEY: 'idle-game-save',
  CURRENT_VERSION: 1,
} as const;

// ============================================
// GAME LOOP
// ============================================

export const GAME_LOOP_CONFIG = {
  TARGET_TPS: 10, // Ticks per second
  MAX_DELTA_TIME: 0.1, // Max seconds per tick (prevents huge jumps)
  OFFLINE_MAX_HOURS: 24, // Max offline progress hours
} as const;

// ============================================
// STARTING VALUES
// ============================================

export const STARTING_CREDITS = 45; // Was 100 - clean 3 pulls (45/15=3), must earn more
export const STARTING_CRYSTALS = 0;

// ============================================
// BALANCE TARGETS (for testing)
// ============================================

export const BALANCE_TARGETS = {
  // Max production/export ratio before upgrades (per planet)
  MAX_PRODUCTION_EXPORT_RATIO: 2.5,

  // Time targets (in seconds of active play)
  TIME_TO_FIRST_PLANET_UNLOCK: 1800, // ~30 minutes to unlock Red Planet (realistic with early game pacing)
  TIME_TO_FIRST_PRESTIGE: 3600, // ~1 hour to first prestige

  // With 4 base + 2 Extra Slot Modules = 6 max-tier seeds
  // Production should not exceed this multiple of base
  MAX_SEED_PRODUCTION_MULTIPLIER: 30, // 6 seeds x 5.0 (T6) = 30x max (requires crafting)
} as const;
