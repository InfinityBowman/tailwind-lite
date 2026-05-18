/**
 * Transcendence System Configuration
 * Layer 2 Prestige - Reset prestige progress for meta-bonuses
 */

export interface TranscendenceBonus {
  id: string;
  name: string;
  description: string;
  effect: TranscendenceEffectType;
  baseValue: number;
  maxLevel: number;
  costPerLevel: number; // Transcendence points per level
}

export type TranscendenceEffectType =
  | 'PRESTIGE_POINT_MULT' // Bonus prestige points earned
  | 'STARTING_PRESTIGE' // Start with prestige bonus levels
  | 'PRODUCTION_MULT' // Permanent production multiplier (stacks with prestige)
  | 'AUTOMATION_SPEED' // Faster automation actions
  | 'CRYSTAL_FIND' // Chance to find bonus crystals
  | 'SEED_TIER_BOOST'; // Seeds drop at higher tiers

/**
 * Configuration for transcendence requirements and calculations
 */
export const TRANSCENDENCE_CONFIG = {
  // Minimum prestige level to transcend
  MIN_PRESTIGE_LEVEL: 25,

  // Points formula: floor(prestigeLevel / 5)
  // So at level 25, you get 5 points. At level 50, you get 10.
  PRESTIGE_LEVELS_PER_POINT: 5,

  // Maximum transcendence level
  MAX_TRANSCENDENCE_LEVEL: 50,
} as const;

export const TRANSCENDENCE_BONUSES: Record<string, TranscendenceBonus> = {
  prestigeAmplifier: {
    id: 'prestigeAmplifier',
    name: 'Prestige Amplifier',
    description: '+20% prestige points earned per level',
    effect: 'PRESTIGE_POINT_MULT',
    baseValue: 0.2,
    maxLevel: 25,
    costPerLevel: 2,
  },

  headStart: {
    id: 'headStart',
    name: 'Head Start',
    description: 'Start with +2 levels in each prestige bonus per level',
    effect: 'STARTING_PRESTIGE',
    baseValue: 2,
    maxLevel: 10,
    costPerLevel: 3,
  },

  cosmicGrowth: {
    id: 'cosmicGrowth',
    name: 'Cosmic Growth',
    description: '+10% production per level (stacks with prestige)',
    effect: 'PRODUCTION_MULT',
    baseValue: 0.1,
    maxLevel: 50,
    costPerLevel: 1,
  },

  swiftAutomation: {
    id: 'swiftAutomation',
    name: 'Swift Automation',
    description: '+15% automation speed per level',
    effect: 'AUTOMATION_SPEED',
    baseValue: 0.15,
    maxLevel: 20,
    costPerLevel: 2,
  },

  crystalHunter: {
    id: 'crystalHunter',
    name: 'Crystal Hunter',
    description: '+5% chance to find bonus crystals per level',
    effect: 'CRYSTAL_FIND',
    baseValue: 0.05,
    maxLevel: 20,
    costPerLevel: 3,
  },

  seedEvolution: {
    id: 'seedEvolution',
    name: 'Seed Evolution',
    description: '+3% chance for seeds to drop at +1 tier per level',
    effect: 'SEED_TIER_BOOST',
    baseValue: 0.03,
    maxLevel: 30,
    costPerLevel: 2,
  },
} as const;

/**
 * Calculate transcendence points from prestige level
 */
export function calculateTranscendencePoints(prestigeLevel: number): number {
  if (prestigeLevel < TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL) {
    return 0;
  }
  return Math.floor(prestigeLevel / TRANSCENDENCE_CONFIG.PRESTIGE_LEVELS_PER_POINT);
}

/**
 * Get the cost to upgrade a transcendence bonus to the next level
 */
export function getTranscendenceBonusCost(bonusId: string, currentLevel: number): number {
  const bonus = TRANSCENDENCE_BONUSES[bonusId];
  if (!bonus || currentLevel >= bonus.maxLevel) {
    return Infinity;
  }
  return bonus.costPerLevel;
}

/**
 * Get the total effect value for a transcendence bonus at a given level
 */
export function getTranscendenceBonusValue(bonusId: string, level: number): number {
  const bonus = TRANSCENDENCE_BONUSES[bonusId];
  if (!bonus) return 0;
  return bonus.baseValue * level;
}
