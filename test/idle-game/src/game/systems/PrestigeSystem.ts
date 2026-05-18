/**
 * Prestige System - Display helpers for prestige UI
 *
 * Prestige logic lives server-side in convex/progression.ts.
 */

import {
  PRESTIGE_CONFIG,
  PRESTIGE_BONUSES,
  calculatePrestigePoints,
  getPrestigeBonusCost,
  getPrestigeBonusValue,
  type PrestigeBonus,
} from '../config/prestige';

// ============================================
// TYPES
// ============================================

export interface PrestigeState {
  prestigeLevel: number;
  prestigePoints: number;
  totalPrestigePointsEarned: number;
  bonusLevels: Record<string, number>;
  lifetimeCredits: number;
}

// ============================================
// CHECK FUNCTIONS
// ============================================

/**
 * Check if player can prestige
 */
export function canPrestige(lifetimeCredits: number): {
  canPrestige: boolean;
  reason?: string;
  potentialPoints: number;
} {
  const potentialPoints = calculatePrestigePoints(lifetimeCredits);

  if (lifetimeCredits < PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE) {
    return {
      canPrestige: false,
      reason: `Need at least ${PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE.toLocaleString()} lifetime credits to prestige`,
      potentialPoints: 0,
    };
  }

  if (potentialPoints <= 0) {
    return {
      canPrestige: false,
      reason: 'Not enough credits to earn prestige points',
      potentialPoints: 0,
    };
  }

  return {
    canPrestige: true,
    potentialPoints,
  };
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get all available prestige bonuses with their current state
 */
export function getAllBonusesWithState(bonusLevels: Record<string, number>): Array<{
  bonus: PrestigeBonus;
  currentLevel: number;
  currentValue: number;
  nextCost: number | null;
  isMaxed: boolean;
}> {
  return Object.values(PRESTIGE_BONUSES).map(bonus => {
    const currentLevel = bonusLevels[bonus.id] || 0;
    const isMaxed = currentLevel >= bonus.maxLevel;

    return {
      bonus,
      currentLevel,
      currentValue: getPrestigeBonusValue(bonus.id, currentLevel),
      nextCost: isMaxed ? null : getPrestigeBonusCost(bonus.id, currentLevel),
      isMaxed,
    };
  });
}

/**
 * Get projected prestige points at a given credit amount
 */
export function getProjectedPrestigePoints(credits: number): number {
  return calculatePrestigePoints(credits);
}
