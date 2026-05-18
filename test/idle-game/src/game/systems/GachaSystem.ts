/**
 * Gacha System - Display helpers and types for gacha UI
 *
 * Gacha logic lives server-side in convex/gacha.ts.
 */

import { InventoryItem } from '../state/GameState';
import { SEED_TIERS } from '../config/balance';

export interface GachaPullResult {
  success: boolean;
  item: InventoryItem | null;
  cost: number;
  consecutiveFodders: number;
  error?: string;
}

export interface GachaMultiPullResult {
  success: boolean;
  items: InventoryItem[];
  cost: number;
  consecutiveFodders: number;
  error?: string;
}

/**
 * Generate a unique ID for instances
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Get the display name for a tier
 */
export function getTierName(tier: number): string {
  const tierData = SEED_TIERS[tier as keyof typeof SEED_TIERS];
  return tierData?.name || 'Unknown';
}
