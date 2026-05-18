/**
 * Production System - Plant value and trait utilities
 *
 * Canonical production logic (growth, exports, ticks) lives server-side in
 * convex/lazyTick.ts.  This file provides read-only helpers used by UI
 * components for display purposes.
 */

import { SEED_TYPES } from '../config/seeds';
import { PLANET_DEFINITIONS, type PlanetTrait } from '../config/planets';

/**
 * Get trait modifiers for a planet (used by planet UI components)
 */
export function getTraitModifiers(planetId: string): {
  productionMult: number;
  exportSpeedMult: number;
  storageCapacityMult: number;
  valueMult: number;
} {
  const def = PLANET_DEFINITIONS[planetId];
  const trait = def?.trait as PlanetTrait | undefined;

  const mods = {
    productionMult: 1,
    exportSpeedMult: 1,
    storageCapacityMult: 1,
    valueMult: 1,
  };

  if (!trait) return mods;

  switch (trait) {
    case 'FERTILE':
      mods.productionMult = 1.25;
      break;
    case 'EFFICIENT':
      mods.exportSpeedMult = 1.25;
      break;
    case 'SPACIOUS':
      mods.storageCapacityMult = 1.5;
      break;
    case 'EXOTIC':
      mods.valueMult = 1.5;
      break;
    case 'FROZEN':
      mods.productionMult = 0.75;
      mods.storageCapacityMult = 2.0;
      break;
  }

  return mods;
}

/**
 * Get the sell value for a plant type
 */
export function getPlantSellValue(plantType: string): number {
  const seedType = SEED_TYPES[plantType];
  return seedType?.baseSellValue || 0;
}

/**
 * Get all plant sell values as a map (used by CargoPanel for display)
 */
export function getAllPlantSellValues(): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [id, seed] of Object.entries(SEED_TYPES)) {
    values[id] = seed.baseSellValue;
  }
  return values;
}
