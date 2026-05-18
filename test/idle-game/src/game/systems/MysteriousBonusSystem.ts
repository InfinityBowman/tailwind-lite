/**
 * MysteriousBonusSystem
 *
 * Handles the daily rotating bonus from the Gold Planet trait.
 * Each day a random bonus is selected that provides a gameplay modifier.
 */

import { MysteriousBonusState, MysteriousBonusType } from '../state/GameState';

/**
 * All possible mysterious bonuses
 */
export const MYSTERIOUS_BONUSES: MysteriousBonusType[] = [
  'PRODUCTION_BOOST',
  'GACHA_DISCOUNT',
  'ESSENCE_BOOST',
  'STORAGE_BOOST',
  'REFINE_BOOST',
  'FUSION_DISCOUNT',
];

/**
 * Bonus values for each type
 */
const BONUS_VALUES: Record<MysteriousBonusType, number> = {
  PRODUCTION_BOOST: 0.25, // +25%
  GACHA_DISCOUNT: 0.25, // -25%
  ESSENCE_BOOST: 0.5, // +50%
  STORAGE_BOOST: 0.5, // +50%
  REFINE_BOOST: 0.5, // +50%
  FUSION_DISCOUNT: 0.25, // -25%
};

/**
 * Create initial mysterious bonus state
 */
export function createInitialMysteriousBonusState(): MysteriousBonusState {
  return {
    currentBonus: null,
    resetTime: 0,
  };
}

/**
 * Calculate the reset time for mysterious bonus (midnight tomorrow)
 */
export function calculateBonusResetTime(now: Date = new Date()): number {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * Roll a new random mysterious bonus
 * @param randomFn - Random function for testing (default Math.random)
 */
export function rollNewBonus(
  randomFn: () => number = Math.random,
  now: Date = new Date()
): MysteriousBonusState {
  const randomIndex = Math.floor(randomFn() * MYSTERIOUS_BONUSES.length);
  const newBonus = MYSTERIOUS_BONUSES[randomIndex];

  return {
    currentBonus: newBonus,
    resetTime: calculateBonusResetTime(now),
  };
}

/**
 * Check if bonus needs to be rolled/rotated
 * Returns new state if changed, null if no change needed
 */
export function checkMysteriousBonus(
  state: MysteriousBonusState,
  hasGoldPlanet: boolean,
  now: number = Date.now(),
  randomFn: () => number = Math.random
): MysteriousBonusState | null {
  // If Gold Planet not unlocked, clear bonus
  if (!hasGoldPlanet) {
    if (state.currentBonus !== null) {
      return { currentBonus: null, resetTime: 0 };
    }
    return null; // No change needed
  }

  // If no bonus or past reset time, roll a new one
  if (!state.currentBonus || now >= state.resetTime) {
    return rollNewBonus(randomFn, new Date(now));
  }

  return null; // No change needed
}

/**
 * Get the bonus value for a specific type
 * Returns the multiplier/discount amount if active, 0 otherwise
 */
export function getMysteriousBonusValue(
  state: MysteriousBonusState,
  type: MysteriousBonusType
): number {
  if (state.currentBonus !== type) {
    return 0;
  }
  return BONUS_VALUES[type] ?? 0;
}

/**
 * Get the current mysterious bonus info
 */
export function getMysteriousBonusInfo(state: MysteriousBonusState): {
  bonus: MysteriousBonusType | null;
  resetTime: number;
} {
  return {
    bonus: state.currentBonus,
    resetTime: state.resetTime,
  };
}

/**
 * Get human-readable name for a bonus type
 */
export function getBonusDisplayName(type: MysteriousBonusType): string {
  switch (type) {
    case 'PRODUCTION_BOOST':
      return 'Production Boost (+25%)';
    case 'GACHA_DISCOUNT':
      return 'Gacha Discount (-25%)';
    case 'ESSENCE_BOOST':
      return 'Essence Boost (+50%)';
    case 'STORAGE_BOOST':
      return 'Storage Boost (+50%)';
    case 'REFINE_BOOST':
      return 'Refine Boost (+50%)';
    case 'FUSION_DISCOUNT':
      return 'Fusion Discount (-25%)';
    default:
      return 'Unknown Bonus';
  }
}
