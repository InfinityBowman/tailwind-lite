/**
 * Expeditions Configuration
 *
 * Defines expedition types, rewards, and progression.
 */

// ============================================
// TYPES
// ============================================

export type SeedRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ExpeditionTypeId = 'survey' | 'deep_scan' | 'sector_exploration' | 'frontier_voyage';

export interface ExpeditionRewardConfig {
  type: 'credits' | 'crystals' | 'seeds' | 'fragments';
  min: number;
  max: number;
  chance: number; // 0-1, probability of this reward
  rarity?: SeedRarity; // For seed rewards
}

export interface ExpeditionTypeConfig {
  id: ExpeditionTypeId;
  name: string;
  description: string;
  durationMs: number;
  baseSuccessRate: number; // 0-1
  minManagers: number;
  maxManagers: number;
  rewards: ExpeditionRewardConfig[];
  unlockRequirement?: {
    type: 'research' | 'prestige' | 'expeditions_completed';
    level: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

export const EXPEDITION_CONFIG = {
  /** Starting number of expedition slots */
  INITIAL_SLOTS: 2,

  /** Maximum possible slots */
  MAX_SLOTS: 5,

  /** Power bonus cap (as fraction) */
  MAX_POWER_BONUS: 0.25,

  /** Maximum supplies per expedition (allows meaningful stacking without being OP) */
  MAX_SUPPLIES_PER_EXPEDITION: 4,

  /** Power required for max bonus */
  POWER_FOR_MAX_BONUS: 100,

  /** Team synergy bonus per synergy level */
  SYNERGY_BONUS_PER_LEVEL: 0.05,

  /** Rarity bonus multipliers */
  RARITY_BONUS: {
    common: 0.1,
    uncommon: 0.2,
    rare: 0.3,
    epic: 0.4,
    legendary: 0.5,
  } as const,

  /** Failure reward multiplier */
  FAILURE_REWARD_MULTIPLIER: 0.25,

  /** History entries to keep */
  HISTORY_SIZE: 20,
} as const;

// ============================================
// EXPEDITION TYPES
// ============================================

const HOUR = 60 * 60 * 1000;

export const EXPEDITION_TYPES: Record<ExpeditionTypeId, ExpeditionTypeConfig> = {
  survey: {
    id: 'survey',
    name: 'Survey Mission',
    description: 'A quick scan of nearby space. Low risk, modest rewards.',
    durationMs: 1 * HOUR,
    baseSuccessRate: 0.9,
    minManagers: 1,
    maxManagers: 2,
    rewards: [
      { type: 'credits', min: 500, max: 1500, chance: 1.0 },
      { type: 'seeds', min: 1, max: 2, chance: 0.4, rarity: 'common' },
      { type: 'crystals', min: 5, max: 15, chance: 0.2 },
    ],
  },

  deep_scan: {
    id: 'deep_scan',
    name: 'Deep Scan',
    description: 'Thorough analysis of a sector. Better discoveries await.',
    durationMs: 4 * HOUR,
    baseSuccessRate: 0.8,
    minManagers: 1,
    maxManagers: 3,
    rewards: [
      { type: 'credits', min: 2000, max: 5000, chance: 1.0 },
      { type: 'seeds', min: 1, max: 3, chance: 0.6, rarity: 'uncommon' },
      { type: 'seeds', min: 1, max: 1, chance: 0.2, rarity: 'rare' },
      { type: 'crystals', min: 20, max: 50, chance: 0.4 },
    ],
    unlockRequirement: { type: 'expeditions_completed', level: 3 },
  },

  sector_exploration: {
    id: 'sector_exploration',
    name: 'Sector Exploration',
    description: 'Full exploration of an uncharted sector. High stakes, high rewards.',
    durationMs: 8 * HOUR,
    baseSuccessRate: 0.7,
    minManagers: 2,
    maxManagers: 3,
    rewards: [
      { type: 'credits', min: 8000, max: 15000, chance: 1.0 },
      { type: 'seeds', min: 2, max: 4, chance: 0.8, rarity: 'rare' },
      { type: 'seeds', min: 1, max: 1, chance: 0.15, rarity: 'epic' },
      { type: 'crystals', min: 50, max: 100, chance: 0.6 },
      { type: 'fragments', min: 1, max: 3, chance: 0.3 },
    ],
    unlockRequirement: { type: 'expeditions_completed', level: 10 },
  },

  frontier_voyage: {
    id: 'frontier_voyage',
    name: 'Frontier Voyage',
    description: 'A daring journey to the edge of known space. Legendary rewards possible.',
    durationMs: 24 * HOUR,
    baseSuccessRate: 0.6,
    minManagers: 3,
    maxManagers: 3,
    rewards: [
      { type: 'credits', min: 25000, max: 50000, chance: 1.0 },
      { type: 'seeds', min: 3, max: 5, chance: 1.0, rarity: 'epic' },
      { type: 'seeds', min: 1, max: 1, chance: 0.1, rarity: 'legendary' },
      { type: 'crystals', min: 100, max: 250, chance: 0.8 },
      { type: 'fragments', min: 3, max: 8, chance: 0.5 },
    ],
    unlockRequirement: { type: 'expeditions_completed', level: 25 },
  },
};

// ============================================
// HELPERS
// ============================================

/**
 * Get all expedition types as array (for iteration)
 */
export function getExpeditionTypes(): ExpeditionTypeConfig[] {
  return Object.values(EXPEDITION_TYPES);
}

/**
 * Get expedition type by ID
 */
export function getExpeditionType(id: ExpeditionTypeId): ExpeditionTypeConfig | undefined {
  return EXPEDITION_TYPES[id];
}

/**
 * Check if expedition type is unlocked
 */
export function isExpeditionUnlocked(
  typeId: ExpeditionTypeId,
  expeditionsCompleted: number,
  researchLevel: number = 0,
  prestigeLevel: number = 0
): boolean {
  const type = EXPEDITION_TYPES[typeId];
  if (!type.unlockRequirement) return true;

  const { type: reqType, level } = type.unlockRequirement;

  switch (reqType) {
    case 'expeditions_completed':
      return expeditionsCompleted >= level;
    case 'research':
      return researchLevel >= level;
    case 'prestige':
      return prestigeLevel >= level;
    default:
      return false;
  }
}

/**
 * Format duration for display
 */
export function formatExpeditionDuration(ms: number): string {
  const hours = Math.floor(ms / HOUR);
  if (hours < 1) {
    const minutes = Math.floor(ms / 60000);
    return `${minutes}m`;
  }
  return `${hours}h`;
}
