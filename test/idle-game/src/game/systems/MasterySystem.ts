/**
 * Mastery System - Per-seed mastery levels with global pool
 *
 * Inspired by Melvor Idle's mastery mechanic:
 * - Each seed type has a mastery level (0-99)
 * - Gain mastery XP every time that seed produces
 * - Mastery milestones unlock permanent bonuses
 * - Global Mastery Pool with checkpoint rewards
 */

// ============================================
// TYPES
// ============================================

export interface SeedMastery {
  seedId: string;
  level: number; // 0-99
  xp: number; // Current XP toward next level
  totalXp: number; // Lifetime XP earned
}

export interface MasteryPoolCheckpoint {
  percentage: number; // 10, 25, 50, 75, 100
  claimed: boolean;
  reward: MasteryPoolReward;
}

export interface MasteryPoolReward {
  type: 'production' | 'sellValue' | 'gachaLuck' | 'crystals';
  value: number;
}

export interface MasteryState {
  seedMasteries: Record<string, SeedMastery>; // seedId -> mastery
  globalPool: number; // Excess XP fills this
  globalPoolMax: number; // Total XP needed to fill pool
  poolCheckpoints: MasteryPoolCheckpoint[];
  totalMasteryLevel: number; // Sum of all seed levels
}

// ============================================
// CONSTANTS
// ============================================

export const MASTERY_CONFIG = {
  maxLevel: 99,
  baseXpPerLevel: 100, // XP needed for level 1
  xpScaling: 1.1, // Each level needs 10% more XP
  xpPerProduction: 1, // Base XP per production tick
  excessXpToPoolRatio: 0.5, // 50% of excess XP goes to global pool
  globalPoolBaseSize: 10000, // Base pool size
};

export const MASTERY_MILESTONES = {
  25: { productionBonus: 0.1 }, // +10% production
  50: { sellValueBonus: 0.05 }, // +5% sell value
  75: { fusionTierBonus: 1 }, // +1 tier in fusion calcs
  99: { productionBonus: 1.0, goldenFrame: true }, // +100% (2x) + cosmetic
};

export const POOL_CHECKPOINTS: Omit<MasteryPoolCheckpoint, 'claimed'>[] = [
  { percentage: 10, reward: { type: 'production', value: 0.02 } }, // +2% global production
  { percentage: 25, reward: { type: 'sellValue', value: 0.05 } }, // +5% global sell value
  { percentage: 50, reward: { type: 'gachaLuck', value: 0.05 } }, // +5% better gacha rates
  { percentage: 75, reward: { type: 'crystals', value: 50 } }, // 50 crystals
  { percentage: 100, reward: { type: 'production', value: 0.1 } }, // +10% global production
];

// ============================================
// INITIALIZATION
// ============================================

export function createInitialMasteryState(): MasteryState {
  return {
    seedMasteries: {},
    globalPool: 0,
    globalPoolMax: MASTERY_CONFIG.globalPoolBaseSize,
    poolCheckpoints: POOL_CHECKPOINTS.map(cp => ({ ...cp, claimed: false })),
    totalMasteryLevel: 0,
  };
}

// ============================================
// XP CALCULATIONS
// ============================================

/**
 * Calculate XP needed for a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(MASTERY_CONFIG.baseXpPerLevel * Math.pow(MASTERY_CONFIG.xpScaling, level - 1));
}

/**
 * Calculate total XP needed to reach a level from 0
 */
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

/**
 * Get mastery for a seed, creating if needed
 */
export function getSeedMastery(state: MasteryState, seedId: string): SeedMastery {
  if (!state.seedMasteries[seedId]) {
    state.seedMasteries[seedId] = {
      seedId,
      level: 0,
      xp: 0,
      totalXp: 0,
    };
  }
  return state.seedMasteries[seedId];
}

// ============================================
// XP GAIN & LEVELING
// ============================================

export interface MasteryGainResult {
  newState: MasteryState;
  levelUps: { seedId: string; newLevel: number }[];
  poolGain: number;
  checkpointsClaimed: MasteryPoolCheckpoint[];
}

/**
 * Add mastery XP for a seed (called when seed produces)
 */
export function addMasteryXp(
  state: MasteryState,
  seedId: string,
  amount: number = MASTERY_CONFIG.xpPerProduction
): MasteryGainResult {
  const newState = { ...state, seedMasteries: { ...state.seedMasteries } };
  const mastery = { ...getSeedMastery(newState, seedId) };
  newState.seedMasteries[seedId] = mastery;

  const levelUps: { seedId: string; newLevel: number }[] = [];
  let poolGain = 0;

  // Add XP
  mastery.xp += amount;
  mastery.totalXp += amount;

  // Check for level ups
  while (mastery.level < MASTERY_CONFIG.maxLevel) {
    const xpNeeded = getXpForLevel(mastery.level + 1);
    if (mastery.xp >= xpNeeded) {
      mastery.xp -= xpNeeded;
      mastery.level++;
      levelUps.push({ seedId, newLevel: mastery.level });
    } else {
      break;
    }
  }

  // If at max level, excess XP goes to global pool
  if (mastery.level >= MASTERY_CONFIG.maxLevel && mastery.xp > 0) {
    poolGain = Math.floor(mastery.xp * MASTERY_CONFIG.excessXpToPoolRatio);
    mastery.xp = 0;
    newState.globalPool = Math.min(newState.globalPool + poolGain, newState.globalPoolMax);
  }

  // Update total mastery level
  newState.totalMasteryLevel = Object.values(newState.seedMasteries).reduce(
    (sum, m) => sum + m.level,
    0
  );

  // Check pool checkpoints
  const checkpointsClaimed = checkPoolCheckpoints(newState);

  return { newState, levelUps, poolGain, checkpointsClaimed };
}

/**
 * Check and claim pool checkpoints
 */
function checkPoolCheckpoints(state: MasteryState): MasteryPoolCheckpoint[] {
  const claimed: MasteryPoolCheckpoint[] = [];
  const poolPercentage = (state.globalPool / state.globalPoolMax) * 100;

  state.poolCheckpoints = state.poolCheckpoints.map(cp => {
    if (!cp.claimed && poolPercentage >= cp.percentage) {
      claimed.push(cp);
      return { ...cp, claimed: true };
    }
    return cp;
  });

  return claimed;
}

// ============================================
// BONUS CALCULATIONS
// ============================================

export interface MasteryBonuses {
  productionBonus: number; // Multiplier (0.1 = +10%)
  sellValueBonus: number; // Multiplier
  fusionTierBonus: number; // Added to tier for fusion
  gachaLuckBonus: number; // Better rates
  hasGoldenFrame: boolean; // Cosmetic
}

/**
 * Get bonuses for a specific seed based on its mastery level
 */
export function getSeedMasteryBonuses(state: MasteryState, seedId: string): MasteryBonuses {
  const mastery = state.seedMasteries[seedId];
  const level = mastery?.level || 0;

  const bonuses: MasteryBonuses = {
    productionBonus: 0,
    sellValueBonus: 0,
    fusionTierBonus: 0,
    gachaLuckBonus: 0,
    hasGoldenFrame: false,
  };

  // Check each milestone
  if (level >= 25) bonuses.productionBonus += MASTERY_MILESTONES[25].productionBonus;
  if (level >= 50) bonuses.sellValueBonus += MASTERY_MILESTONES[50].sellValueBonus;
  if (level >= 75) bonuses.fusionTierBonus += MASTERY_MILESTONES[75].fusionTierBonus;
  if (level >= 99) {
    bonuses.productionBonus += MASTERY_MILESTONES[99].productionBonus;
    bonuses.hasGoldenFrame = true;
  }

  return bonuses;
}

/**
 * Get global bonuses from pool checkpoints
 */
export function getGlobalMasteryBonuses(state: MasteryState): MasteryBonuses {
  const bonuses: MasteryBonuses = {
    productionBonus: 0,
    sellValueBonus: 0,
    fusionTierBonus: 0,
    gachaLuckBonus: 0,
    hasGoldenFrame: false,
  };

  for (const checkpoint of state.poolCheckpoints) {
    if (checkpoint.claimed) {
      switch (checkpoint.reward.type) {
        case 'production':
          bonuses.productionBonus += checkpoint.reward.value;
          break;
        case 'sellValue':
          bonuses.sellValueBonus += checkpoint.reward.value;
          break;
        case 'gachaLuck':
          bonuses.gachaLuckBonus += checkpoint.reward.value;
          break;
      }
    }
  }

  return bonuses;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get progress to next level (0-1)
 */
export function getMasteryProgress(state: MasteryState, seedId: string): number {
  const mastery = state.seedMasteries[seedId];
  if (!mastery || mastery.level >= MASTERY_CONFIG.maxLevel) return 1;

  const xpNeeded = getXpForLevel(mastery.level + 1);
  return mastery.xp / xpNeeded;
}

/**
 * Get pool progress (0-1)
 */
export function getPoolProgress(state: MasteryState): number {
  return state.globalPool / state.globalPoolMax;
}

/**
 * Get next unclaimed checkpoint
 */
export function getNextCheckpoint(state: MasteryState): MasteryPoolCheckpoint | null {
  return state.poolCheckpoints.find(cp => !cp.claimed) || null;
}

/**
 * Get all seeds sorted by mastery level (highest first)
 */
export function getSeedsByMastery(state: MasteryState): SeedMastery[] {
  return Object.values(state.seedMasteries).sort(
    (a, b) => b.level - a.level || b.totalXp - a.totalXp
  );
}

/**
 * Check if seed has reached a milestone
 */
export function hasMilestone(
  state: MasteryState,
  seedId: string,
  milestone: 25 | 50 | 75 | 99
): boolean {
  const mastery = state.seedMasteries[seedId];
  return (mastery?.level || 0) >= milestone;
}
