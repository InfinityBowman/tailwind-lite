/**
 * Seed Type Definitions
 * Re-exports canonical definitions from shared config.
 */

import { SEED_TYPES as _SEED_TYPES, type SeedFamily } from '@shared/seeds';

// Re-export canonical seed definitions
export { SEED_TYPES, SEED_TYPES_ARRAY, SEED_TIERS, FODDER_MATERIAL } from '@shared/seeds';
export type { SeedFamily, SeedTypeDefinition } from '@shared/seeds';

// Client-only: seed family display info
export const SEED_FAMILY_INFO: Record<
  SeedFamily,
  { name: string; color: string; description: string }
> = {
  bio: {
    name: 'Bio',
    color: '#22c55e',
    description: 'Living, organic seeds that thrive in fertile conditions',
  },
  solar: {
    name: 'Solar',
    color: '#f97316',
    description: 'Sun-powered seeds that flourish in heat and light',
  },
  lunar: {
    name: 'Lunar',
    color: '#a78bfa',
    description: 'Moon-touched seeds that grow best in darkness',
  },
  crystal: {
    name: 'Crystal',
    color: '#06b6d4',
    description: 'Mineral-based seeds that prefer cold environments',
  },
  primal: {
    name: 'Primal',
    color: '#84cc16',
    description: 'Ancient seeds with raw, untamed growth',
  },
  void: {
    name: 'Void',
    color: '#6366f1',
    description: 'Mysterious seeds from beyond known space',
  },
};

// Get array of all seed type IDs
export const ALL_SEED_IDS = Object.keys(_SEED_TYPES);

// Seeds available from basic gacha (common pool)
export const GACHA_COMMON_SEEDS = [
  'wheat',
  'corn',
  'potato',
  'carrot',
  'tomato',
  'cucumber',
  'rice',
];

// Seeds available from uncommon gacha
export const GACHA_UNCOMMON_SEEDS = ['soybean', 'pumpkin'];

// Rare seeds (only from fusion or special events)
export const GACHA_RARE_SEEDS = ['starfruit'];
