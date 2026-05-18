/**
 * Upgrade System - Display helpers for planet upgrade UI
 *
 * Upgrade logic lives server-side in convex/farming.ts.
 */

import { UPGRADE_CONFIG, UpgradeType } from '../config/balance';

export const UPGRADE_TYPES = {
  PRODUCTION_RATE: 'PRODUCTION_RATE' as const,
  EXPORT_SPEED: 'EXPORT_SPEED' as const,
  STORAGE_CAPACITY: 'STORAGE_CAPACITY' as const,
};

export const UPGRADE_NAMES: Record<UpgradeType, string> = {
  PRODUCTION_RATE: 'Production Rate',
  EXPORT_SPEED: 'Export Speed',
  STORAGE_CAPACITY: 'Storage Capacity',
};

/**
 * Calculate the cost of an upgrade at a given level
 */
export function calculateUpgradeCost(upgradeType: UpgradeType, currentLevel: number): number {
  const config = UPGRADE_CONFIG[upgradeType];
  return Math.floor(config.baseCost * Math.pow(config.scalingFactor, currentLevel));
}

/**
 * Get a description of what an upgrade does
 */
export function getUpgradeEffectDescription(upgradeType: UpgradeType): string {
  const config = UPGRADE_CONFIG[upgradeType];
  switch (upgradeType) {
    case 'PRODUCTION_RATE':
      return `+${(config.effectMultiplier * 100).toFixed(0)}% production/level`;
    case 'EXPORT_SPEED':
      return `+${(config.effectMultiplier * 100).toFixed(0)}% export speed/level`;
    case 'STORAGE_CAPACITY':
      return `+${(config.effectMultiplier * 100).toFixed(0)}% storage/level`;
    default:
      return '';
  }
}
