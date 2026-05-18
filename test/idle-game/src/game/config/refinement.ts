/**
 * Refinement Configuration
 * Defines how plants convert into refined materials
 */

export interface RefinementRecipe {
  id: string;
  name: string;
  description: string;
  inputPlant: string; // Plant type required
  inputAmount: number; // How many plants needed
  outputAmount: number; // How much refined essence produced
  timeSeconds: number; // Time to refine (for future queue system)
}

/**
 * Base refinement values per plant type
 * Higher value plants produce more refined essence
 */
export const REFINEMENT_RECIPES: Record<string, RefinementRecipe> = {
  wheat: {
    id: 'refine_wheat',
    name: 'Refine Wheat',
    description: 'Convert wheat into refined essence',
    inputPlant: 'wheat',
    inputAmount: 10,
    outputAmount: 1,
    timeSeconds: 0, // Instant for now
  },
  corn: {
    id: 'refine_corn',
    name: 'Refine Corn',
    description: 'Convert corn into refined essence',
    inputPlant: 'corn',
    inputAmount: 8,
    outputAmount: 1,
    timeSeconds: 0,
  },
  potato: {
    id: 'refine_potato',
    name: 'Refine Potato',
    description: 'Convert potatoes into refined essence',
    inputPlant: 'potato',
    inputAmount: 6,
    outputAmount: 1,
    timeSeconds: 0,
  },
  carrot: {
    id: 'refine_carrot',
    name: 'Refine Carrot',
    description: 'Convert carrots into refined essence',
    inputPlant: 'carrot',
    inputAmount: 5,
    outputAmount: 1,
    timeSeconds: 0,
  },
  tomato: {
    id: 'refine_tomato',
    name: 'Refine Tomato',
    description: 'Convert tomatoes into refined essence',
    inputPlant: 'tomato',
    inputAmount: 4,
    outputAmount: 1,
    timeSeconds: 0,
  },
  cucumber: {
    id: 'refine_cucumber',
    name: 'Refine Cucumber',
    description: 'Convert cucumbers into refined essence',
    inputPlant: 'cucumber',
    inputAmount: 3,
    outputAmount: 1,
    timeSeconds: 0,
  },
  // New seeds will be added here
  rice: {
    id: 'refine_rice',
    name: 'Refine Rice',
    description: 'Convert rice into refined essence',
    inputPlant: 'rice',
    inputAmount: 7,
    outputAmount: 1,
    timeSeconds: 0,
  },
  soybean: {
    id: 'refine_soybean',
    name: 'Refine Soybean',
    description: 'Convert soybeans into refined essence',
    inputPlant: 'soybean',
    inputAmount: 5,
    outputAmount: 1,
    timeSeconds: 0,
  },
  pumpkin: {
    id: 'refine_pumpkin',
    name: 'Refine Pumpkin',
    description: 'Convert pumpkins into refined essence',
    inputPlant: 'pumpkin',
    inputAmount: 2,
    outputAmount: 1,
    timeSeconds: 0,
  },
  starfruit: {
    id: 'refine_starfruit',
    name: 'Refine Starfruit',
    description: 'Convert starfruit into refined essence',
    inputPlant: 'starfruit',
    inputAmount: 4,
    outputAmount: 2,
    timeSeconds: 0,
  },
} as const;

/**
 * Get refinement recipe for a plant type
 */
export function getRefinementRecipe(plantType: string): RefinementRecipe | null {
  return REFINEMENT_RECIPES[plantType] || null;
}

/**
 * Calculate how much refined essence you get from a certain amount of plants
 */
export function calculateRefinementOutput(
  plantType: string,
  plantAmount: number,
  efficiencyBonus: number = 0
): { batches: number; output: number; remainder: number } {
  const recipe = getRefinementRecipe(plantType);
  if (!recipe) {
    return { batches: 0, output: 0, remainder: plantAmount };
  }

  const batches = Math.floor(plantAmount / recipe.inputAmount);
  const baseOutput = batches * recipe.outputAmount;
  const bonusOutput = Math.floor(baseOutput * efficiencyBonus);
  const output = baseOutput + bonusOutput;
  const remainder = plantAmount - batches * recipe.inputAmount;

  return { batches, output, remainder };
}
