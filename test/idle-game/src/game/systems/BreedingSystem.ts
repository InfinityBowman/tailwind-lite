/**
 * Breeding System
 *
 * Allows players to breed seeds together to create new seeds
 * with inherited and potentially new traits. This is the game's
 * "deep system" - the equivalent of Cookie Clicker's garden.
 */

import { generateUniqueId } from './GachaSystem';
import {
  TraitId,
  TRAIT_DEFINITIONS,
  HIDDEN_RECIPES,
  BreedingRecipe,
  checkRecipeRequirements,
  getMaxTraitsForTier,
} from '../config/traits';

// ============================================
// TYPES
// ============================================

export interface SeedWithTraits {
  instanceId: string;
  type: string; // Seed type (wheat, corn, etc.)
  tier: number; // 0-6
  traits: TraitId[]; // Current traits on the seed
}

export interface BreedingSlot {
  seed: SeedWithTraits | null;
  startTime: number | null; // When breeding started
  endTime: number | null; // When breeding will complete
}

export interface BreedingState {
  slots: [BreedingSlot, BreedingSlot]; // Two parent slots
  isBreeding: boolean;
  discoveredRecipes: string[]; // Recipe IDs that have been discovered
}

export interface BreedingResult {
  child: SeedWithTraits;
  inheritedTraits: TraitId[];
  newTraits: TraitId[];
  discoveredRecipe: BreedingRecipe | null; // If a hidden recipe was triggered
}

// ============================================
// CONSTANTS
// ============================================

// Breeding duration based on average tier of parents
export const BREEDING_DURATION_BASE_MS = 60 * 60 * 1000; // 1 hour base
export const BREEDING_DURATION_PER_TIER_MS = 30 * 60 * 1000; // +30 min per avg tier

// Max trait mutation attempts per breeding
export const MAX_MUTATION_ROLLS = 3;

// ============================================
// STATE CREATION
// ============================================

export function createInitialBreedingState(): BreedingState {
  return {
    slots: [
      { seed: null, startTime: null, endTime: null },
      { seed: null, startTime: null, endTime: null },
    ],
    isBreeding: false,
    discoveredRecipes: [],
  };
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check if breeding can start with current slots
 */
export function canStartBreeding(state: BreedingState): boolean {
  const [slot1, slot2] = state.slots;
  return slot1.seed !== null && slot2.seed !== null && !state.isBreeding;
}

/**
 * Calculate breeding duration based on parent tiers
 */
export function calculateBreedingDuration(
  parent1: SeedWithTraits,
  parent2: SeedWithTraits
): number {
  const avgTier = (parent1.tier + parent2.tier) / 2;
  return BREEDING_DURATION_BASE_MS + avgTier * BREEDING_DURATION_PER_TIER_MS;
}

/**
 * Start the breeding process
 */
export function startBreeding(
  state: BreedingState,
  currentTime: number = Date.now()
): BreedingState {
  if (!canStartBreeding(state)) {
    return state;
  }

  const [slot1, slot2] = state.slots;
  const duration = calculateBreedingDuration(slot1.seed!, slot2.seed!);

  return {
    ...state,
    slots: [
      { ...slot1, startTime: currentTime, endTime: currentTime + duration },
      { ...slot2, startTime: currentTime, endTime: currentTime + duration },
    ],
    isBreeding: true,
  };
}

/**
 * Check if breeding is complete
 */
export function isBreedingComplete(
  state: BreedingState,
  currentTime: number = Date.now()
): boolean {
  if (!state.isBreeding) return false;
  const endTime = state.slots[0].endTime;
  return endTime !== null && currentTime >= endTime;
}

/**
 * Get breeding progress (0-1)
 */
export function getBreedingProgress(
  state: BreedingState,
  currentTime: number = Date.now()
): number {
  if (!state.isBreeding) return 0;

  const { startTime, endTime } = state.slots[0];
  if (startTime === null || endTime === null) return 0;

  const elapsed = currentTime - startTime;
  const total = endTime - startTime;

  return Math.min(1, Math.max(0, elapsed / total));
}

/**
 * Collect all traits from both parents
 */
export function collectParentTraits(parent1: SeedWithTraits, parent2: SeedWithTraits): TraitId[] {
  const allTraits = new Set<TraitId>([...parent1.traits, ...parent2.traits]);
  return Array.from(allTraits);
}

/**
 * Determine which traits are inherited by offspring
 */
export function rollTraitInheritance(
  parentTraits: TraitId[],
  maxTraits: number,
  rng: () => number = Math.random
): TraitId[] {
  const inherited: TraitId[] = [];

  // Roll for each parent trait
  for (const traitId of parentTraits) {
    if (inherited.length >= maxTraits) break;

    const trait = TRAIT_DEFINITIONS[traitId];
    if (rng() < trait.inheritChance) {
      inherited.push(traitId);
    }
  }

  return inherited;
}

/**
 * Roll for trait mutations (new traits appearing)
 */
export function rollTraitMutations(
  currentTraits: TraitId[],
  maxTraits: number,
  rng: () => number = Math.random
): TraitId[] {
  const newTraits: TraitId[] = [];
  const available = maxTraits - currentTraits.length;

  if (available <= 0) return newTraits;

  // Try mutation rolls
  for (let i = 0; i < MAX_MUTATION_ROLLS && newTraits.length < available; i++) {
    for (const trait of Object.values(TRAIT_DEFINITIONS)) {
      // Skip if already has trait or in new traits
      if (currentTraits.includes(trait.id) || newTraits.includes(trait.id)) {
        continue;
      }

      // Skip Origin - it can only come from recipe
      if (trait.id === 'ORIGIN') continue;

      if (rng() < trait.mutationChance) {
        newTraits.push(trait.id);
        if (newTraits.length >= available) break;
      }
    }
  }

  return newTraits;
}

/**
 * Check for hidden recipe discoveries
 */
export function checkForRecipeDiscovery(
  parentTraits: TraitId[],
  discoveredRecipes: string[],
  rng: () => number = Math.random
): BreedingRecipe | null {
  for (const recipe of HIDDEN_RECIPES) {
    // Skip already discovered
    if (discoveredRecipes.includes(recipe.id)) continue;

    // Check if requirements are met
    if (!checkRecipeRequirements(parentTraits, recipe)) continue;

    // Roll for discovery
    if (rng() < recipe.chance) {
      return recipe;
    }
  }

  return null;
}

/**
 * Complete breeding and generate offspring
 */
export function completeBreeding(
  state: BreedingState,
  rng: () => number = Math.random
): { newState: BreedingState; result: BreedingResult } | null {
  if (!state.isBreeding) return null;

  const [slot1, slot2] = state.slots;
  const parent1 = slot1.seed;
  const parent2 = slot2.seed;

  // Validate both parents exist (shouldn't happen in normal flow, but be safe)
  if (!parent1 || !parent2) {
    console.error('BreedingSystem: Attempted to complete breeding with null seeds');
    return null;
  }

  // Determine child properties
  const childTier = Math.min(parent1.tier, parent2.tier); // Lower tier of parents
  const childType = rng() < 0.5 ? parent1.type : parent2.type; // Random parent type
  const maxTraits = getMaxTraitsForTier(childTier);

  // Collect and inherit traits
  const parentTraits = collectParentTraits(parent1, parent2);
  const inheritedTraits = rollTraitInheritance(parentTraits, maxTraits, rng);

  // Check for recipe discovery BEFORE adding mutations
  let discoveredRecipe: BreedingRecipe | null = null;

  // If recipe discovered, add its trait
  discoveredRecipe = checkForRecipeDiscovery(parentTraits, state.discoveredRecipes, rng);

  let finalTraits = [...inheritedTraits];
  let newTraits: TraitId[] = [];

  if (discoveredRecipe) {
    // Recipe discovered! Add the result trait
    if (!finalTraits.includes(discoveredRecipe.resultTrait) && finalTraits.length < maxTraits) {
      newTraits.push(discoveredRecipe.resultTrait);
      finalTraits.push(discoveredRecipe.resultTrait);
    }
  } else {
    // Normal mutations
    newTraits = rollTraitMutations(finalTraits, maxTraits, rng);
    finalTraits = [...finalTraits, ...newTraits];
  }

  // Create child seed
  const child: SeedWithTraits = {
    instanceId: generateUniqueId(),
    type: childType,
    tier: childTier,
    traits: finalTraits,
  };

  // Update state
  const newState: BreedingState = {
    slots: [
      { seed: null, startTime: null, endTime: null },
      { seed: null, startTime: null, endTime: null },
    ],
    isBreeding: false,
    discoveredRecipes: discoveredRecipe
      ? [...state.discoveredRecipes, discoveredRecipe.id]
      : state.discoveredRecipes,
  };

  return {
    newState,
    result: {
      child,
      inheritedTraits,
      newTraits,
      discoveredRecipe,
    },
  };
}

/**
 * Place a seed in a breeding slot
 */
export function placeSeedInSlot(
  state: BreedingState,
  slotIndex: 0 | 1,
  seed: SeedWithTraits
): BreedingState {
  if (state.isBreeding) return state; // Can't change while breeding

  const newSlots = [...state.slots] as [BreedingSlot, BreedingSlot];
  newSlots[slotIndex] = { seed, startTime: null, endTime: null };

  return {
    ...state,
    slots: newSlots,
  };
}

/**
 * Remove a seed from a breeding slot
 */
export function removeSeedFromSlot(state: BreedingState, slotIndex: 0 | 1): BreedingState {
  if (state.isBreeding) return state; // Can't change while breeding

  const newSlots = [...state.slots] as [BreedingSlot, BreedingSlot];
  newSlots[slotIndex] = { seed: null, startTime: null, endTime: null };

  return {
    ...state,
    slots: newSlots,
  };
}

/**
 * Cancel breeding in progress (returns parents)
 */
export function cancelBreeding(state: BreedingState): BreedingState {
  if (!state.isBreeding) return state;

  // Keep the seeds but stop breeding
  return {
    ...state,
    slots: [
      { ...state.slots[0], startTime: null, endTime: null },
      { ...state.slots[1], startTime: null, endTime: null },
    ],
    isBreeding: false,
  };
}

/**
 * Format breeding time remaining as string
 */
export function formatBreedingTimeRemaining(
  state: BreedingState,
  currentTime: number = Date.now()
): string {
  if (!state.isBreeding) return '';

  const endTime = state.slots[0].endTime;
  if (endTime === null) return '';

  const remaining = Math.max(0, endTime - currentTime);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
