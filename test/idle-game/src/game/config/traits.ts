/**
 * Seed Traits Configuration
 *
 * Traits are special properties that seeds can have, affecting their
 * production, value, or special abilities. Traits can be inherited
 * through breeding, creating deep customization potential.
 */

export type TraitId =
  // Elemental Traits (Common)
  | 'FIRE'
  | 'WATER'
  | 'EARTH'
  | 'VOID'
  // Growth Traits (Uncommon)
  | 'GROWTH'
  | 'VALUE'
  | 'HARDY'
  | 'LUCKY'
  // Rare Traits
  | 'ANCIENT'
  | 'SWIFT'
  | 'ABUNDANT'
  // Epic/Legendary Traits
  | 'COSMIC'
  | 'ORIGIN';

export type TraitRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface TraitEffect {
  type:
    | 'PLANET_PRODUCTION_BOOST' // +X% on specific planet types
    | 'GLOBAL_PRODUCTION_BOOST' // +X% everywhere
    | 'SELL_VALUE_BOOST' // +X% sell value
    | 'ESSENCE_BOOST' // +X% essence from refinement
    | 'GACHA_LUCK' // +X% better gacha rates
    | 'EXPORT_SPEED' // +X% export speed
    | 'SURVIVE_SWITCH' // Survives planet switching
    | 'PRESTIGE_PERSIST'; // Survives prestige (rare!)

  value: number; // Percentage or boolean (1 for true)
  planetTypes?: string[]; // For planet-specific effects
}

export interface TraitDefinition {
  id: TraitId;
  name: string;
  description: string;
  rarity: TraitRarity;
  icon: string; // Lucide icon name
  color: string; // Hex color for UI
  effects: TraitEffect[];

  // Breeding properties
  inheritChance: number; // 0-1, chance to pass to offspring
  mutationChance: number; // 0-1, chance to randomly appear

  // Requirements for special traits
  discoveryHint?: string; // Hint for hidden combos
  requiredTraits?: TraitId[]; // Breeding recipe (if any)
}

// ============================================
// TRAIT DEFINITIONS
// ============================================

export const TRAIT_DEFINITIONS: Record<TraitId, TraitDefinition> = {
  // ELEMENTAL TRAITS (Common)
  FIRE: {
    id: 'FIRE',
    name: 'Fire Affinity',
    description: '+20% production on Red and Desert planets',
    rarity: 'common',
    icon: 'Flame',
    color: '#EF4444',
    effects: [
      { type: 'PLANET_PRODUCTION_BOOST', value: 0.2, planetTypes: ['redPlanet', 'desertPlanet'] },
    ],
    inheritChance: 0.75,
    mutationChance: 0.05,
  },

  WATER: {
    id: 'WATER',
    name: 'Water Affinity',
    description: '+20% production on Blue and Ice planets',
    rarity: 'common',
    icon: 'Droplet',
    color: '#3B82F6',
    effects: [
      { type: 'PLANET_PRODUCTION_BOOST', value: 0.2, planetTypes: ['bluePlanet', 'icePlanet'] },
    ],
    inheritChance: 0.75,
    mutationChance: 0.05,
  },

  EARTH: {
    id: 'EARTH',
    name: 'Earth Affinity',
    description: '+20% production on Green planet',
    rarity: 'common',
    icon: 'Sprout',
    color: '#22C55E',
    effects: [{ type: 'PLANET_PRODUCTION_BOOST', value: 0.2, planetTypes: ['greenPlanet'] }],
    inheritChance: 0.75,
    mutationChance: 0.05,
  },

  VOID: {
    id: 'VOID',
    name: 'Void Affinity',
    description: '+30% production on Void planet',
    rarity: 'common',
    icon: 'Eclipse',
    color: '#6B21A8',
    effects: [{ type: 'PLANET_PRODUCTION_BOOST', value: 0.3, planetTypes: ['voidPlanet'] }],
    inheritChance: 0.6, // Slightly harder to pass
    mutationChance: 0.02,
  },

  // GROWTH TRAITS (Uncommon)
  GROWTH: {
    id: 'GROWTH',
    name: 'Enhanced Growth',
    description: '+15% global production',
    rarity: 'uncommon',
    icon: 'TrendingUp',
    color: '#10B981',
    effects: [{ type: 'GLOBAL_PRODUCTION_BOOST', value: 0.15 }],
    inheritChance: 0.5,
    mutationChance: 0.02,
  },

  VALUE: {
    id: 'VALUE',
    name: 'High Value',
    description: '+15% sell value',
    rarity: 'uncommon',
    icon: 'Gem',
    color: '#F59E0B',
    effects: [{ type: 'SELL_VALUE_BOOST', value: 0.15 }],
    inheritChance: 0.5,
    mutationChance: 0.02,
  },

  HARDY: {
    id: 'HARDY',
    name: 'Hardy',
    description: 'Survives planet switching without losing progress',
    rarity: 'uncommon',
    icon: 'Shield',
    color: '#64748B',
    effects: [{ type: 'SURVIVE_SWITCH', value: 1 }],
    inheritChance: 0.4,
    mutationChance: 0.01,
  },

  LUCKY: {
    id: 'LUCKY',
    name: 'Lucky',
    description: '+5% better gacha rates when equipped',
    rarity: 'uncommon',
    icon: 'Clover',
    color: '#84CC16',
    effects: [{ type: 'GACHA_LUCK', value: 0.05 }],
    inheritChance: 0.35,
    mutationChance: 0.01,
  },

  // RARE TRAITS
  ANCIENT: {
    id: 'ANCIENT',
    name: 'Ancient',
    description: '+50% essence from refinement',
    rarity: 'rare',
    icon: 'Scroll',
    color: '#A855F7',
    effects: [{ type: 'ESSENCE_BOOST', value: 0.5 }],
    inheritChance: 0.25,
    mutationChance: 0.005,
  },

  SWIFT: {
    id: 'SWIFT',
    name: 'Swift',
    description: '+15% export speed on assigned planet',
    rarity: 'rare',
    icon: 'Zap',
    color: '#FBBF24',
    effects: [{ type: 'EXPORT_SPEED', value: 0.15 }],
    inheritChance: 0.3,
    mutationChance: 0.01,
  },

  ABUNDANT: {
    id: 'ABUNDANT',
    name: 'Abundant',
    description: '+30% global production',
    rarity: 'rare',
    icon: 'Wheat',
    color: '#D97706',
    effects: [{ type: 'GLOBAL_PRODUCTION_BOOST', value: 0.3 }],
    inheritChance: 0.2,
    mutationChance: 0.003,
  },

  // EPIC/LEGENDARY TRAITS
  COSMIC: {
    id: 'COSMIC',
    name: 'Cosmic',
    description: '+25% to all stats',
    rarity: 'epic',
    icon: 'Star',
    color: '#EC4899',
    effects: [
      { type: 'GLOBAL_PRODUCTION_BOOST', value: 0.25 },
      { type: 'SELL_VALUE_BOOST', value: 0.25 },
      { type: 'ESSENCE_BOOST', value: 0.25 },
    ],
    inheritChance: 0.1,
    mutationChance: 0.001,
    discoveryHint: 'Perhaps combining the elements could create something greater...',
  },

  ORIGIN: {
    id: 'ORIGIN',
    name: 'Origin',
    description: 'The seed of all creation. Survives prestige.',
    rarity: 'legendary',
    icon: 'Sparkles',
    color: '#FFD700',
    effects: [
      { type: 'GLOBAL_PRODUCTION_BOOST', value: 0.5 },
      { type: 'PRESTIGE_PERSIST', value: 1 },
    ],
    inheritChance: 0.05,
    mutationChance: 0, // Cannot randomly mutate - must be bred
    discoveryHint: 'The void holds ancient secrets. Combine it with cosmic power...',
    requiredTraits: ['VOID', 'ANCIENT', 'COSMIC'], // Discovery recipe!
  },
};

// ============================================
// HIDDEN BREEDING RECIPES
// ============================================

export interface BreedingRecipe {
  id: string;
  name: string;
  requiredTraits: TraitId[];
  resultTrait: TraitId;
  chance: number; // Chance when requirements are met
  discovered: boolean; // Becomes true when player finds it
}

export const HIDDEN_RECIPES: BreedingRecipe[] = [
  {
    id: 'cosmic_creation',
    name: 'Cosmic Creation',
    requiredTraits: ['FIRE', 'WATER', 'EARTH', 'VOID'],
    resultTrait: 'COSMIC',
    chance: 0.25,
    discovered: false,
  },
  {
    id: 'origin_discovery',
    name: 'The Origin',
    requiredTraits: ['VOID', 'ANCIENT', 'COSMIC'],
    resultTrait: 'ORIGIN',
    chance: 0.1,
    discovered: false,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all traits of a specific rarity
 */
export function getTraitsByRarity(rarity: TraitRarity): TraitDefinition[] {
  return Object.values(TRAIT_DEFINITIONS).filter(t => t.rarity === rarity);
}

/**
 * Calculate total production bonus from traits for a specific planet
 */
export function calculateTraitProductionBonus(traits: TraitId[], planetId: string): number {
  let bonus = 0;

  for (const traitId of traits) {
    const trait = TRAIT_DEFINITIONS[traitId];
    if (!trait) {
      console.warn(`Unknown trait ID: ${traitId}`);
      continue;
    }
    for (const effect of trait.effects) {
      if (effect.type === 'GLOBAL_PRODUCTION_BOOST') {
        bonus += effect.value;
      } else if (effect.type === 'PLANET_PRODUCTION_BOOST') {
        if (effect.planetTypes?.includes(planetId)) {
          bonus += effect.value;
        }
      }
    }
  }

  return bonus;
}

/**
 * Calculate total sell value bonus from traits
 */
export function calculateTraitValueBonus(traits: TraitId[]): number {
  let bonus = 0;

  for (const traitId of traits) {
    const trait = TRAIT_DEFINITIONS[traitId];
    if (!trait) continue;
    for (const effect of trait.effects) {
      if (effect.type === 'SELL_VALUE_BOOST') {
        bonus += effect.value;
      }
    }
  }

  return bonus;
}

/**
 * Calculate essence bonus from traits
 */
export function calculateTraitEssenceBonus(traits: TraitId[]): number {
  let bonus = 0;

  for (const traitId of traits) {
    const trait = TRAIT_DEFINITIONS[traitId];
    if (!trait) continue;
    for (const effect of trait.effects) {
      if (effect.type === 'ESSENCE_BOOST') {
        bonus += effect.value;
      }
    }
  }

  return bonus;
}

/**
 * Check if traits include a specific effect type
 */
export function hasTraitEffect(traits: TraitId[], effectType: TraitEffect['type']): boolean {
  for (const traitId of traits) {
    const trait = TRAIT_DEFINITIONS[traitId];
    if (!trait) continue;
    if (trait.effects.some(e => e.type === effectType)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a breeding recipe's requirements are met
 */
export function checkRecipeRequirements(parentTraits: TraitId[], recipe: BreedingRecipe): boolean {
  return recipe.requiredTraits.every(required => parentTraits.includes(required));
}

/**
 * Get display color for trait rarity
 */
export function getTraitRarityColor(rarity: TraitRarity): string {
  switch (rarity) {
    case 'common':
      return '#9CA3AF'; // Gray
    case 'uncommon':
      return '#22C55E'; // Green
    case 'rare':
      return '#3B82F6'; // Blue
    case 'epic':
      return '#A855F7'; // Purple
    case 'legendary':
      return '#FFD700'; // Gold
    default:
      return '#9CA3AF';
  }
}

/**
 * Get max traits a seed can have based on tier
 */
export function getMaxTraitsForTier(tier: number): number {
  // Tier 0-1: 1 trait, Tier 2-3: 2 traits, Tier 4-5: 3 traits, Tier 6: 4 traits
  if (tier <= 1) return 1;
  if (tier <= 3) return 2;
  if (tier <= 5) return 3;
  return 4;
}
