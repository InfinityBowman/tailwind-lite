/**
 * Extract Type Definitions
 * Plant extracts used for crafting
 *
 * Each plant type produces a unique extract when processed.
 * Extracts are the crafting currency for items.
 */

// Extract type definitions - each plant produces a unique extract

export type ExtractId =
  | 'grain' // Wheat
  | 'starch' // Corn
  | 'tuber' // Potato
  | 'root' // Carrot
  | 'vine' // Tomato
  | 'hydro' // Cucumber
  | 'kernel' // Rice
  | 'protein' // Soybean
  | 'harvest' // Pumpkin
  | 'stellar'; // Starfruit

export interface ExtractDefinition {
  id: ExtractId;
  name: string;
  description: string;
  color: string;
  plantSource: string; // seed ID that produces this extract
  plantsPerExtract: number; // how many plants needed for 1 extract
  rarity: 'common' | 'uncommon' | 'rare';
}

/**
 * Extract definitions - each plant type produces one unique extract
 */
export const EXTRACT_DEFINITIONS: Record<ExtractId, ExtractDefinition> = {
  grain: {
    id: 'grain',
    name: 'Grain Extract',
    description: 'Basic, abundant extract from wheat',
    color: '#f5d742',
    plantSource: 'wheat',
    plantsPerExtract: 20,
    rarity: 'common',
  },
  starch: {
    id: 'starch',
    name: 'Starch Extract',
    description: 'Energy-dense extract from corn',
    color: '#fbbf24',
    plantSource: 'corn',
    plantsPerExtract: 15,
    rarity: 'common',
  },
  tuber: {
    id: 'tuber',
    name: 'Tuber Extract',
    description: 'Hearty extract from potatoes',
    color: '#a8763e',
    plantSource: 'potato',
    plantsPerExtract: 12,
    rarity: 'common',
  },
  root: {
    id: 'root',
    name: 'Root Extract',
    description: 'Growth-focused extract from carrots',
    color: '#f97316',
    plantSource: 'carrot',
    plantsPerExtract: 10,
    rarity: 'common',
  },
  vine: {
    id: 'vine',
    name: 'Vine Extract',
    description: 'Vitality extract from tomatoes',
    color: '#ef4444',
    plantSource: 'tomato',
    plantsPerExtract: 10,
    rarity: 'common',
  },
  hydro: {
    id: 'hydro',
    name: 'Hydro Extract',
    description: 'Refreshing extract from cucumbers',
    color: '#22c55e',
    plantSource: 'cucumber',
    plantsPerExtract: 8,
    rarity: 'uncommon',
  },
  kernel: {
    id: 'kernel',
    name: 'Kernel Extract',
    description: 'Refined extract from rice',
    color: '#f5f5dc',
    plantSource: 'rice',
    plantsPerExtract: 12,
    rarity: 'common',
  },
  protein: {
    id: 'protein',
    name: 'Protein Extract',
    description: 'Nourishing extract from soybeans',
    color: '#a3e635',
    plantSource: 'soybean',
    plantsPerExtract: 8,
    rarity: 'uncommon',
  },
  harvest: {
    id: 'harvest',
    name: 'Harvest Extract',
    description: 'Seasonal extract from pumpkins',
    color: '#ea580c',
    plantSource: 'pumpkin',
    plantsPerExtract: 5,
    rarity: 'uncommon',
  },
  stellar: {
    id: 'stellar',
    name: 'Stellar Extract',
    description: 'Cosmic energy from starfruit',
    color: '#a855f7',
    plantSource: 'starfruit',
    plantsPerExtract: 3,
    rarity: 'rare',
  },
};

/**
 * Mapping from plant type to extract type (generated from definitions)
 */
export const PLANT_TO_EXTRACT: Record<string, ExtractId> = Object.fromEntries(
  Object.values(EXTRACT_DEFINITIONS).map(def => [def.plantSource, def.id])
) as Record<string, ExtractId>;

/**
 * Get the extract definition for a plant type
 */
export function getExtractForPlant(plantType: string): ExtractDefinition | null {
  const extractId = PLANT_TO_EXTRACT[plantType];
  if (!extractId) return null;
  return EXTRACT_DEFINITIONS[extractId];
}

/**
 * Get all extract IDs
 */
export const ALL_EXTRACT_IDS = Object.keys(EXTRACT_DEFINITIONS) as ExtractId[];

/**
 * Initial extract inventory (all zeros)
 */
export function createInitialExtractInventory(): Record<ExtractId, number> {
  return {
    grain: 0,
    starch: 0,
    tuber: 0,
    root: 0,
    vine: 0,
    hydro: 0,
    kernel: 0,
    protein: 0,
    harvest: 0,
    stellar: 0,
  };
}
