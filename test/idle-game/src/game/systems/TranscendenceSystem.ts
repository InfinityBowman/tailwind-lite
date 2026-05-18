/**
 * Transcendence System - Display helpers for transcendence UI
 *
 * Transcendence logic lives server-side in convex/progression.ts.
 */

import {
  TRANSCENDENCE_CONFIG,
  TRANSCENDENCE_BONUSES,
  calculateTranscendencePoints,
  getTranscendenceBonusCost,
  getTranscendenceBonusValue,
  type TranscendenceBonus,
} from '../config/transcendence';

// ============================================
// TYPES
// ============================================

export interface TranscendenceState {
  transcendenceLevel: number;
  transcendencePoints: number;
  totalTranscendencePointsEarned: number;
  bonusLevels: Record<string, number>;
}

// ============================================
// CHECK FUNCTIONS
// ============================================

/**
 * Check if player can transcend
 */
export function canTranscend(prestigeLevel: number): {
  canTranscend: boolean;
  reason?: string;
  potentialPoints: number;
} {
  const potentialPoints = calculateTranscendencePoints(prestigeLevel);

  if (prestigeLevel < TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL) {
    return {
      canTranscend: false,
      reason: `Need at least Prestige Level ${TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL} to transcend (current: ${prestigeLevel})`,
      potentialPoints: 0,
    };
  }

  if (potentialPoints <= 0) {
    return {
      canTranscend: false,
      reason: 'Not enough prestige level to earn transcendence points',
      potentialPoints: 0,
    };
  }

  return {
    canTranscend: true,
    potentialPoints,
  };
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get all available transcendence bonuses with their current state
 */
export function getAllTranscendenceBonusesWithState(bonusLevels: Record<string, number>): Array<{
  bonus: TranscendenceBonus;
  currentLevel: number;
  currentValue: number;
  nextCost: number | null;
  isMaxed: boolean;
}> {
  return Object.values(TRANSCENDENCE_BONUSES).map(bonus => {
    const currentLevel = bonusLevels[bonus.id] || 0;
    const isMaxed = currentLevel >= bonus.maxLevel;

    return {
      bonus,
      currentLevel,
      currentValue: getTranscendenceBonusValue(bonus.id, currentLevel),
      nextCost: isMaxed ? null : getTranscendenceBonusCost(bonus.id, currentLevel),
      isMaxed,
    };
  });
}

/**
 * Get projected transcendence points at a given prestige level
 */
export function getProjectedTranscendencePoints(prestigeLevel: number): number {
  return calculateTranscendencePoints(prestigeLevel);
}
