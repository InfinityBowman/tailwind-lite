/**
 * Fusion System - Display helpers for seed fusion UI
 *
 * Fusion logic lives server-side in convex/gacha.ts.
 */

import { SeedInstance } from '../state/GameState';
import { SEED_TIERS, MAX_SEED_TIER } from '../config/balance';

export interface FusionResult {
  success: boolean;
  message: string;
  seed?: SeedInstance;
}

/**
 * Get the essence cost for fusing seeds at a given tier
 */
export function getFusionEssenceCost(tier: number): number {
  const nextTier = tier + 1;
  if (nextTier > MAX_SEED_TIER) return Infinity;

  const tierData = SEED_TIERS[nextTier as keyof typeof SEED_TIERS];
  return tierData?.essenceCost || 0;
}
