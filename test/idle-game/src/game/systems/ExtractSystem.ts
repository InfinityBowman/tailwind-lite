/**
 * Extract System - Process plants into extracts for crafting
 *
 * Plants can be processed into their corresponding extracts.
 * Extracts are used as crafting materials for consumables, equipment, and mods.
 */

import {
  ExtractId,
  ExtractDefinition,
  EXTRACT_DEFINITIONS,
  getExtractForPlant,
  createInitialExtractInventory,
} from '../config/extracts';

// ============================================
// TYPES
// ============================================

export interface ExtractInventory {
  extracts: Record<ExtractId, number>;
}

export interface ExtractResult {
  success: boolean;
  message?: string;
  extractType?: ExtractId;
  extractsGained?: number;
  plantsUsed?: number;
  newPlantAmount?: number;
}

export interface ExtractAllResult {
  totalExtractsGained: Record<ExtractId, number>;
  updatedPlants: Record<string, number>;
  breakdown: { plantType: string; used: number; extractType: ExtractId; gained: number }[];
}

export interface ExtractionPreview {
  plantType: string;
  extractType: ExtractId;
  extractDefinition: ExtractDefinition;
  availablePlants: number;
  plantsPerExtract: number;
  maxExtracts: number;
  currentExtractAmount: number;
}

// ============================================
// EXTRACTION FUNCTIONS
// ============================================

/**
 * Check if extraction can be performed for a plant type
 */
export function canExtract(
  plantType: string,
  availablePlants: number
): { canExtract: boolean; reason?: string; maxExtracts: number } {
  const extractDef = getExtractForPlant(plantType);

  if (!extractDef) {
    return {
      canExtract: false,
      reason: `No extraction recipe for ${plantType}`,
      maxExtracts: 0,
    };
  }

  // Handle negative or invalid plant amounts
  if (!Number.isFinite(availablePlants) || availablePlants < 0) {
    return {
      canExtract: false,
      reason: 'Invalid plant amount',
      maxExtracts: 0,
    };
  }

  const maxExtracts = Math.floor(availablePlants / extractDef.plantsPerExtract);

  if (maxExtracts === 0) {
    return {
      canExtract: false,
      reason: `Need at least ${extractDef.plantsPerExtract} ${plantType} (have ${Math.floor(availablePlants)})`,
      maxExtracts: 0,
    };
  }

  return { canExtract: true, maxExtracts };
}

/**
 * Perform extraction operation
 * @param plantType - The type of plant to process
 * @param availablePlants - Number of plants available
 * @param amount - Number of extracts to produce, or 'max' for maximum possible
 * @param efficiencyBonus - Bonus multiplier from research/upgrades (0 = no bonus)
 */
export function extract(
  plantType: string,
  availablePlants: number,
  amount: number | 'max',
  efficiencyBonus: number = 0
): ExtractResult {
  const extractDef = getExtractForPlant(plantType);

  if (!extractDef) {
    return {
      success: false,
      message: `No extraction recipe exists for ${plantType}`,
    };
  }

  // Validate availablePlants
  if (!Number.isFinite(availablePlants) || availablePlants < 0) {
    return {
      success: false,
      message: 'Invalid plant amount',
    };
  }

  // Validate amount parameter
  if (amount !== 'max') {
    if (!Number.isFinite(amount) || amount < 0) {
      return { success: false, message: 'Invalid extraction amount' };
    }
  }

  const maxExtracts = Math.floor(availablePlants / extractDef.plantsPerExtract);

  if (maxExtracts === 0) {
    return {
      success: false,
      message: `Need at least ${extractDef.plantsPerExtract} ${plantType}`,
    };
  }

  const actualAmount = amount === 'max' ? maxExtracts : Math.min(Math.floor(amount), maxExtracts);

  if (actualAmount <= 0) {
    return { success: false, message: 'Invalid extraction amount' };
  }

  const plantsUsed = actualAmount * extractDef.plantsPerExtract;
  const baseOutput = actualAmount;
  const bonusOutput = Math.floor(baseOutput * efficiencyBonus);
  const totalOutput = baseOutput + bonusOutput;

  return {
    success: true,
    extractType: extractDef.id,
    extractsGained: totalOutput,
    plantsUsed,
    newPlantAmount: availablePlants - plantsUsed,
  };
}

/**
 * Extract all available plants at once
 * @param plants - Record of plant type to amount
 * @param efficiencyBonus - Bonus multiplier from research/upgrades (0 = no bonus)
 */
export function extractAll(
  plants: Record<string, number>,
  efficiencyBonus: number = 0
): ExtractAllResult {
  const totalExtractsGained: Record<ExtractId, number> = createInitialExtractInventory();
  const updatedPlants: Record<string, number> = { ...plants };
  const breakdown: { plantType: string; used: number; extractType: ExtractId; gained: number }[] =
    [];

  for (const [plantType, amount] of Object.entries(plants)) {
    if (amount <= 0) continue;

    const result = extract(plantType, amount, 'max', efficiencyBonus);

    if (result.success && result.extractType && result.extractsGained && result.plantsUsed) {
      totalExtractsGained[result.extractType] += result.extractsGained;
      updatedPlants[plantType] = result.newPlantAmount || 0;
      breakdown.push({
        plantType,
        used: result.plantsUsed,
        extractType: result.extractType,
        gained: result.extractsGained,
      });
    }
  }

  return { totalExtractsGained, updatedPlants, breakdown };
}

/**
 * Get extraction preview for UI
 */
export function getExtractionPreview(
  plantType: string,
  availablePlants: number,
  currentExtracts: Record<ExtractId, number>
): ExtractionPreview | null {
  const extractDef = getExtractForPlant(plantType);

  if (!extractDef) return null;

  const maxExtracts = Math.floor(availablePlants / extractDef.plantsPerExtract);

  return {
    plantType,
    extractType: extractDef.id,
    extractDefinition: extractDef,
    availablePlants,
    plantsPerExtract: extractDef.plantsPerExtract,
    maxExtracts,
    currentExtractAmount: currentExtracts[extractDef.id] || 0,
  };
}

/**
 * Get all extraction previews for available plants
 */
export function getAllExtractionPreviews(
  plantAmounts: Record<string, number>,
  currentExtracts: Record<ExtractId, number>
): ExtractionPreview[] {
  const previews: ExtractionPreview[] = [];

  for (const [plantType, amount] of Object.entries(plantAmounts)) {
    if (amount > 0) {
      const preview = getExtractionPreview(plantType, amount, currentExtracts);
      if (preview) {
        previews.push(preview);
      }
    }
  }

  return previews;
}

/**
 * Calculate total extract value (for display purposes)
 */
export function calculateExtractValue(extracts: Record<ExtractId, number>): number {
  let totalValue = 0;

  for (const [extractId, amount] of Object.entries(extracts)) {
    if (amount <= 0) continue;
    const def = EXTRACT_DEFINITIONS[extractId as ExtractId];
    if (!def) continue;
    // Value based on rarity: common=1, uncommon=2, rare=3
    const rarityMultiplier = def.rarity === 'rare' ? 3 : def.rarity === 'uncommon' ? 2 : 1;
    totalValue += amount * rarityMultiplier;
  }

  return totalValue;
}

/**
 * Check if player has enough extracts for a recipe
 */
export function hasExtractsForRecipe(
  currentExtracts: Record<ExtractId, number>,
  recipe: Partial<Record<ExtractId, number>>
): { hasEnough: boolean; missing: Partial<Record<ExtractId, number>> } {
  const missing: Partial<Record<ExtractId, number>> = {};
  let hasEnough = true;

  for (const [extractId, required] of Object.entries(recipe) as [ExtractId, number][]) {
    const current = currentExtracts[extractId] || 0;
    if (current < required) {
      hasEnough = false;
      missing[extractId] = required - current;
    }
  }

  return { hasEnough, missing };
}

/**
 * Deduct extracts for a recipe
 * IMPORTANT: Caller MUST check hasExtractsForRecipe first!
 * @throws Error if deduction would result in negative values
 */
export function deductExtractsForRecipe(
  currentExtracts: Record<ExtractId, number>,
  recipe: Partial<Record<ExtractId, number>>
): Record<ExtractId, number> {
  // First verify we have enough
  const { hasEnough, missing } = hasExtractsForRecipe(currentExtracts, recipe);
  if (!hasEnough) {
    const missingStr = Object.entries(missing)
      .map(([id, amt]) => `${amt} ${id}`)
      .join(', ');
    throw new Error(`Insufficient extracts for recipe. Missing: ${missingStr}`);
  }

  const newExtracts = { ...currentExtracts };

  for (const [extractId, required] of Object.entries(recipe) as [ExtractId, number][]) {
    newExtracts[extractId as ExtractId] = (newExtracts[extractId as ExtractId] || 0) - required;
  }

  return newExtracts;
}

// ============================================
// INITIAL STATE
// ============================================

export function createInitialExtractState(): ExtractInventory {
  return {
    extracts: createInitialExtractInventory(),
  };
}
