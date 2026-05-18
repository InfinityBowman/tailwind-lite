/**
 * Affinity System
 * Handles seed family + planet trait bonuses
 */

import { type SeedFamily, SEED_TYPES } from '../config/seeds';
import { type PlanetTrait } from '../config/planets';

/**
 * Affinity bonus configuration
 * Maps planet traits to seed families with bonus multipliers
 */
export const TRAIT_FAMILY_AFFINITY: Partial<
  Record<PlanetTrait, Partial<Record<SeedFamily, number>>>
> = {
  // FERTILE: Bio seeds thrive (+50% production)
  FERTILE: {
    bio: 0.5,
    primal: 0.25,
  },
  // FROZEN: Crystal seeds love cold (+50%), Lunar tolerates it (+25%)
  FROZEN: {
    crystal: 0.5,
    lunar: 0.25,
  },
  // EXOTIC: Void seeds get bonus (+50%), Solar for rare light (+30%)
  EXOTIC: {
    void: 0.5,
    solar: 0.3,
  },
  // EFFICIENT: Solar seeds work fast (+50%), Bio decent (+20%)
  EFFICIENT: {
    solar: 0.5,
    bio: 0.2,
  },
  // SPACIOUS: Primal seeds spread (+50%), Bio grows well (+25%)
  SPACIOUS: {
    primal: 0.5,
    bio: 0.25,
  },
  // INDUSTRIAL: Crystal refines well (+50%), Primal raw power (+25%)
  INDUSTRIAL: {
    crystal: 0.5,
    primal: 0.25,
  },
  // MYSTERIOUS: Void loves mystery (+50%), Lunar moon magic (+30%)
  MYSTERIOUS: {
    void: 0.5,
    lunar: 0.3,
  },
  // HARDY: Primal survives (+50%), Bio adapts (+25%)
  HARDY: {
    primal: 0.5,
    bio: 0.25,
  },
  // VOID: Void seeds at home (+50%), Lunar drawn to darkness (+30%)
  VOID: {
    void: 0.5,
    lunar: 0.3,
  },
};

/**
 * Get the affinity bonus multiplier for a seed on a planet
 * @returns The bonus multiplier (0 = no bonus, 0.4 = +40%, etc.)
 */
export function getAffinityBonus(seedId: string, planetTrait?: PlanetTrait): number {
  if (!planetTrait) return 0;

  const seedType = SEED_TYPES[seedId];
  if (!seedType) return 0;

  const traitAffinity = TRAIT_FAMILY_AFFINITY[planetTrait];
  if (!traitAffinity) return 0;

  return traitAffinity[seedType.family] || 0;
}

/**
 * Get the total production multiplier including affinity
 * @returns Multiplier to apply (1.0 = no change, 1.4 = +40%, etc.)
 */
export function getAffinityMultiplier(seedId: string, planetTrait?: PlanetTrait): number {
  return 1 + getAffinityBonus(seedId, planetTrait);
}

/**
 * Check if a seed has any affinity with a planet trait
 */
export function hasAffinity(seedId: string, planetTrait?: PlanetTrait): boolean {
  return getAffinityBonus(seedId, planetTrait) > 0;
}

/**
 * Get a description of the affinity bonus
 */
export function getAffinityDescription(seedId: string, planetTrait?: PlanetTrait): string | null {
  const bonus = getAffinityBonus(seedId, planetTrait);
  if (bonus === 0) return null;

  const seedType = SEED_TYPES[seedId];
  if (!seedType) return null;

  return `${seedType.family.charAt(0).toUpperCase() + seedType.family.slice(1)} affinity: +${Math.round(bonus * 100)}%`;
}

/**
 * Get all families that have affinity with a given trait
 */
export function getFamiliesWithAffinity(
  planetTrait?: PlanetTrait
): { family: SeedFamily; bonus: number }[] {
  if (!planetTrait) return [];

  const traitAffinity = TRAIT_FAMILY_AFFINITY[planetTrait];
  if (!traitAffinity) return [];

  return Object.entries(traitAffinity)
    .map(([family, bonus]) => ({ family: family as SeedFamily, bonus: bonus as number }))
    .sort((a, b) => b.bonus - a.bonus);
}
