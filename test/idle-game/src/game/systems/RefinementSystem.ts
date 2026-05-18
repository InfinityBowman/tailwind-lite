/**
 * Refinement System - Display helpers for refinement UI
 *
 * Refinement logic lives server-side in convex/refinement.ts.
 */

import { getRefinementRecipe, RefinementRecipe } from '../config/refinement';

/**
 * Get refinement preview for UI
 */
export interface RefinementPreview {
  plantType: string;
  recipe: RefinementRecipe;
  availableAmount: number;
  maxBatches: number;
  maxOutput: number;
  costPerBatch: number;
  outputPerBatch: number;
}

export function getRefinementPreviews(
  plants: Record<string, number>,
  efficiencyBonus: number = 0
): RefinementPreview[] {
  const previews: RefinementPreview[] = [];

  for (const [plantType, amount] of Object.entries(plants)) {
    const recipe = getRefinementRecipe(plantType);
    if (!recipe) continue;

    const floorAmount = Math.floor(amount);
    const maxBatches = Math.floor(floorAmount / recipe.inputAmount);

    if (maxBatches > 0 || floorAmount > 0) {
      const baseOutput = maxBatches * recipe.outputAmount;
      const bonusOutput = Math.floor(baseOutput * efficiencyBonus);

      previews.push({
        plantType,
        recipe,
        availableAmount: floorAmount,
        maxBatches,
        maxOutput: baseOutput + bonusOutput,
        costPerBatch: recipe.inputAmount,
        outputPerBatch: recipe.outputAmount,
      });
    }
  }

  // Sort by max output descending
  return previews.sort((a, b) => b.maxOutput - a.maxOutput);
}
