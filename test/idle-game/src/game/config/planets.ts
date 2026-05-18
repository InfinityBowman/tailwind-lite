/**
 * Planet Definitions
 * Re-exports canonical definitions from shared config.
 */

import { PLANET_DEFINITIONS as _PLANET_DEFINITIONS } from '@shared/planets';

// Re-export canonical planet definitions
export { PLANET_DEFINITIONS, PLANET_TRAIT_EFFECTS, AFFINITY_BONUSES } from '@shared/planets';
export type { PlanetTrait, PlanetDefinition } from '@shared/planets';

// Client-only: trait descriptions for UI display
export const PLANET_TRAIT_DESCRIPTIONS: Record<import('@shared/planets').PlanetTrait, string> = {
  FERTILE: '+25% production rate',
  EFFICIENT: '+25% export speed',
  SPACIOUS: '+50% storage capacity',
  EXOTIC: '+50% value for rare plants',
  INDUSTRIAL: 'Double refinement output',
  MYSTERIOUS: 'Random daily bonus',
  FROZEN: '+100% storage, -25% production',
  HARDY: 'Immune to negative events',
  VOID: 'Double prestige gains',
};

// Get planet IDs that start unlocked
export const STARTING_PLANET_IDS = Object.values(_PLANET_DEFINITIONS)
  .filter(p => p.startsUnlocked)
  .map(p => p.id);

// Get all planet IDs in order of unlock cost
export const ALL_PLANET_IDS = Object.values(_PLANET_DEFINITIONS)
  .sort((a, b) => a.unlockCost - b.unlockCost)
  .map(p => p.id);
