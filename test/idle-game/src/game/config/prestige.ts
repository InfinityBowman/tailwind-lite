/**
 * Prestige System Configuration
 * Reset progress for permanent bonuses
 */

export interface PrestigeBonus {
  id: string;
  name: string;
  description: string;
  effect: PrestigeEffectType;
  baseValue: number;
  maxLevel: number;
  costPerLevel: number; // Prestige points per level
}

export type PrestigeEffectType =
  | 'STARTING_CREDITS' // Bonus starting credits
  | 'PRODUCTION_MULT' // Permanent production multiplier
  | 'GACHA_LUCK' // Better gacha rates
  | 'EXPORT_SPEED' // Faster exports
  | 'RESEARCH_DISCOUNT' // Cheaper research
  | 'SEED_POWER'; // Seeds start with higher power

/**
 * Magnitude Bonus Thresholds
 * Bonus prestige points when prestiging at clean credit thresholds
 * Inspired by Idle Planet Miner's galaxy value magnitude bonuses
 */
export interface MagnitudeBonus {
  threshold: number;
  bonusPercent: number; // Percentage bonus to prestige points
  label: string;
}

export const MAGNITUDE_BONUSES: MagnitudeBonus[] = [
  { threshold: 10_000, bonusPercent: 0.05, label: '10K' },
  { threshold: 100_000, bonusPercent: 0.1, label: '100K' },
  { threshold: 1_000_000, bonusPercent: 0.15, label: '1M' },
  { threshold: 10_000_000, bonusPercent: 0.2, label: '10M' },
  { threshold: 100_000_000, bonusPercent: 0.25, label: '100M' },
  { threshold: 1_000_000_000, bonusPercent: 0.3, label: '1B' },
  { threshold: 10_000_000_000, bonusPercent: 0.35, label: '10B' },
  { threshold: 100_000_000_000, bonusPercent: 0.4, label: '100B' },
];

/**
 * Formula for calculating prestige points earned
 * Based on total lifetime credits earned
 */
export const PRESTIGE_CONFIG = {
  // Minimum credits to prestige (raised to slow early game)
  MIN_CREDITS_TO_PRESTIGE: 50000,

  // Credits needed per prestige point (scaling formula)
  // Points = floor(sqrt(totalCredits / 1000))
  CREDITS_PER_POINT_BASE: 1000,

  // Maximum prestige level
  MAX_PRESTIGE_LEVEL: 100,
} as const;

export const PRESTIGE_BONUSES: Record<string, PrestigeBonus> = {
  startingWealth: {
    id: 'startingWealth',
    name: 'Starting Wealth',
    description: '+500 starting credits per level',
    effect: 'STARTING_CREDITS',
    baseValue: 500,
    maxLevel: 20,
    costPerLevel: 1,
  },

  enhancedGrowth: {
    id: 'enhancedGrowth',
    name: 'Enhanced Growth',
    description: '+5% production per level',
    effect: 'PRODUCTION_MULT',
    baseValue: 0.05,
    maxLevel: 50,
    costPerLevel: 2,
  },

  luckyPulls: {
    id: 'luckyPulls',
    name: 'Lucky Pulls',
    description: '+2% chance for better seeds per level',
    effect: 'GACHA_LUCK',
    baseValue: 0.02,
    maxLevel: 25,
    costPerLevel: 3,
  },

  swiftExports: {
    id: 'swiftExports',
    name: 'Swift Exports',
    description: '+3% export speed per level',
    effect: 'EXPORT_SPEED',
    baseValue: 0.03,
    maxLevel: 20,
    costPerLevel: 2,
  },

  efficientResearch: {
    id: 'efficientResearch',
    name: 'Efficient Research',
    description: '-5% research cost per level',
    effect: 'RESEARCH_DISCOUNT',
    baseValue: 0.05,
    maxLevel: 15,
    costPerLevel: 4,
  },

  seedMastery: {
    id: 'seedMastery',
    name: 'Seed Mastery',
    description: '+10% seed power level per level',
    effect: 'SEED_POWER',
    baseValue: 0.1,
    maxLevel: 30,
    costPerLevel: 3,
  },
} as const;

/**
 * Get the magnitude bonus for a given credit amount
 * Returns the highest matching magnitude bonus
 */
export function getMagnitudeBonus(totalCredits: number): MagnitudeBonus | null {
  // Find the highest threshold we've reached
  let bestBonus: MagnitudeBonus | null = null;

  for (const bonus of MAGNITUDE_BONUSES) {
    if (totalCredits >= bonus.threshold) {
      bestBonus = bonus;
    }
  }

  return bestBonus;
}

/**
 * Get the next magnitude threshold and bonus
 */
export function getNextMagnitudeBonus(totalCredits: number): MagnitudeBonus | null {
  for (const bonus of MAGNITUDE_BONUSES) {
    if (totalCredits < bonus.threshold) {
      return bonus;
    }
  }
  return null; // Already at max
}

/**
 * Calculate base prestige points (without magnitude bonus)
 */
export function calculateBasePrestigePoints(totalCredits: number): number {
  if (totalCredits < PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE) {
    return 0;
  }
  return Math.floor(Math.sqrt(totalCredits / PRESTIGE_CONFIG.CREDITS_PER_POINT_BASE));
}

/**
 * Calculate prestige points from total credits (with magnitude bonus)
 */
export function calculatePrestigePoints(totalCredits: number): number {
  const basePoints = calculateBasePrestigePoints(totalCredits);
  if (basePoints === 0) return 0;

  const magnitudeBonus = getMagnitudeBonus(totalCredits);
  if (!magnitudeBonus) return basePoints;

  const bonusPoints = Math.floor(basePoints * magnitudeBonus.bonusPercent);
  return basePoints + bonusPoints;
}

/**
 * Get detailed prestige point breakdown
 */
export function getPrestigePointBreakdown(totalCredits: number): {
  basePoints: number;
  magnitudeBonus: MagnitudeBonus | null;
  bonusPoints: number;
  totalPoints: number;
  nextMagnitude: MagnitudeBonus | null;
} {
  const basePoints = calculateBasePrestigePoints(totalCredits);
  const magnitudeBonus = getMagnitudeBonus(totalCredits);
  const bonusPoints = magnitudeBonus ? Math.floor(basePoints * magnitudeBonus.bonusPercent) : 0;
  const nextMagnitude = getNextMagnitudeBonus(totalCredits);

  return {
    basePoints,
    magnitudeBonus,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    nextMagnitude,
  };
}

/**
 * Get the cost to upgrade a prestige bonus to the next level
 */
export function getPrestigeBonusCost(bonusId: string, currentLevel: number): number {
  const bonus = PRESTIGE_BONUSES[bonusId];
  if (!bonus || currentLevel >= bonus.maxLevel) {
    return Infinity;
  }
  return bonus.costPerLevel;
}

/**
 * Get the total effect value for a prestige bonus at a given level
 */
export function getPrestigeBonusValue(bonusId: string, level: number): number {
  const bonus = PRESTIGE_BONUSES[bonusId];
  if (!bonus) return 0;
  return bonus.baseValue * level;
}
