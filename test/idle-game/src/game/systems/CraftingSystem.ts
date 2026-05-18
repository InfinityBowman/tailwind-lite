/**
 * Crafting System - Craft items from extracts
 *
 * Players use extracts (from Workshop) to craft items:
 * - Boosters: Temporary planet buffs
 * - Equipment: Manager enhancements
 * - Supplies: Expedition modifiers
 * - Mods: Permanent planet upgrades
 */

import { RECIPES, type ItemId, type Recipe, type ItemCategory } from '../config/recipes';
import type { ExtractInventory } from './ExtractSystem';

// Crafted item instance
export interface CraftedItem {
  id: string; // Unique instance ID
  itemId: ItemId; // Recipe ID
  craftedAt: number; // Timestamp
  // For boosters: when applied and expires
  appliedAt?: number;
  expiresAt?: number;
  // For equipment: which manager has it equipped
  equippedTo?: string;
  // For mods: which planet has it installed
  installedOn?: string;
}

// Crafting state in game state
export interface CraftingState {
  inventory: CraftedItem[];
  activeBoosts: CraftedItem[]; // Currently active boosters
}

// Create initial crafting state
export function createInitialCraftingState(): CraftingState {
  return {
    inventory: [],
    activeBoosts: [],
  };
}

// Check if player can afford a recipe
export function canAffordRecipe(recipe: Recipe, extracts: ExtractInventory): boolean {
  return recipe.ingredients.every(ing => (extracts.extracts[ing.extractId] || 0) >= ing.amount);
}

// Get missing ingredients for a recipe
export function getMissingIngredients(
  recipe: Recipe,
  extracts: ExtractInventory
): { extractId: string; have: number; need: number }[] {
  return recipe.ingredients
    .filter(ing => (extracts.extracts[ing.extractId] || 0) < ing.amount)
    .map(ing => ({
      extractId: ing.extractId,
      have: extracts.extracts[ing.extractId] || 0,
      need: ing.amount,
    }));
}

// Craft an item (deducts extracts, returns new item)
export function craftItem(
  itemId: ItemId,
  extracts: ExtractInventory
): { success: boolean; item?: CraftedItem; extracts: ExtractInventory; error?: string } {
  const recipe = RECIPES[itemId];
  if (!recipe) {
    return { success: false, extracts, error: 'Unknown recipe' };
  }

  if (!canAffordRecipe(recipe, extracts)) {
    return { success: false, extracts, error: 'Insufficient extracts' };
  }

  // Deduct extracts
  const newExtracts: ExtractInventory = {
    extracts: { ...extracts.extracts },
  };
  for (const ing of recipe.ingredients) {
    newExtracts.extracts[ing.extractId] = (newExtracts.extracts[ing.extractId] || 0) - ing.amount;
  }

  // Create item
  const item: CraftedItem = {
    id: `${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    craftedAt: Date.now(),
  };

  return { success: true, item, extracts: newExtracts };
}

// Apply a booster to activate it
export function applyBooster(item: CraftedItem, state: CraftingState): CraftingState {
  const recipe = RECIPES[item.itemId];
  if (!recipe || recipe.category !== 'booster' || !recipe.durationMs) {
    return state;
  }

  const now = Date.now();
  const activatedItem: CraftedItem = {
    ...item,
    appliedAt: now,
    expiresAt: now + recipe.durationMs,
  };

  // Remove from inventory, add to active boosts
  return {
    inventory: state.inventory.filter(i => i.id !== item.id),
    activeBoosts: [...state.activeBoosts, activatedItem],
  };
}

// Update active boosts (remove expired)
export function updateActiveBoosts(state: CraftingState): CraftingState {
  const now = Date.now();
  const activeBoosts = state.activeBoosts.filter(boost => boost.expiresAt && boost.expiresAt > now);

  if (activeBoosts.length === state.activeBoosts.length) {
    return state;
  }

  return { ...state, activeBoosts };
}

// Get total boost multiplier for a specific effect type
export function getBoostMultiplier(state: CraftingState, effectType: string): number {
  let multiplier = 0;

  for (const boost of state.activeBoosts) {
    const recipe = RECIPES[boost.itemId];
    if (recipe?.effectType === effectType && recipe.effectValue) {
      multiplier += recipe.effectValue;
    }
  }

  return multiplier;
}

// Get items by category from inventory
export function getInventoryByCategory(
  state: CraftingState,
  category: ItemCategory
): CraftedItem[] {
  return state.inventory.filter(item => {
    const recipe = RECIPES[item.itemId];
    return recipe?.category === category;
  });
}

// Count items in inventory
export function countItem(state: CraftingState, itemId: ItemId): number {
  return state.inventory.filter(item => item.itemId === itemId).length;
}

// Get recipe info with current affordability
export function getRecipeInfo(
  itemId: ItemId,
  extracts: ExtractInventory
): {
  recipe: Recipe;
  canAfford: boolean;
  missing: { extractId: string; have: number; need: number }[];
} | null {
  const recipe = RECIPES[itemId];
  if (!recipe) return null;

  return {
    recipe,
    canAfford: canAffordRecipe(recipe, extracts),
    missing: getMissingIngredients(recipe, extracts),
  };
}

// ============================================
// EQUIPMENT SYSTEM (Manager Enhancements)
// ============================================

/**
 * Equip an equipment item to a manager.
 * Each manager can have one equipment item of each effectType.
 */
export function equipToManager(
  itemId: string,
  managerId: string,
  state: CraftingState
): { success: boolean; error?: string; newState: CraftingState } {
  // Find the item in inventory
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Item not found in inventory', newState: state };
  }

  // Verify it's equipment
  const recipe = RECIPES[item.itemId];
  if (!recipe || recipe.category !== 'equipment') {
    return { success: false, error: 'Item is not equipment', newState: state };
  }

  // Check if already equipped
  if (item.equippedTo) {
    return { success: false, error: 'Item is already equipped to a manager', newState: state };
  }

  // Check if manager already has equipment of this effect type
  const managerEquipment = state.inventory.filter(i => i.equippedTo === managerId);
  const existingSameType = managerEquipment.find(i => {
    const r = RECIPES[i.itemId];
    return r?.effectType === recipe.effectType;
  });
  if (existingSameType) {
    return {
      success: false,
      error: `Manager already has ${recipe.effectType} equipment equipped`,
      newState: state,
    };
  }

  // Equip the item
  const newInventory = state.inventory.map(i =>
    i.id === itemId ? { ...i, equippedTo: managerId } : i
  );

  return {
    success: true,
    newState: { ...state, inventory: newInventory },
  };
}

/**
 * Unequip an equipment item from its manager.
 */
export function unequipFromManager(
  itemId: string,
  state: CraftingState
): { success: boolean; error?: string; newState: CraftingState } {
  // Find the item
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Item not found in inventory', newState: state };
  }

  // Verify it's equipped
  if (!item.equippedTo) {
    return { success: false, error: 'Item is not equipped to any manager', newState: state };
  }

  // Unequip the item
  const newInventory = state.inventory.map(i =>
    i.id === itemId ? { ...i, equippedTo: undefined } : i
  );

  return {
    success: true,
    newState: { ...state, inventory: newInventory },
  };
}

// ============================================
// MOD SYSTEM (Permanent Planet Upgrades)
// ============================================

// Mod slot configuration
export const MOD_SLOT_CONFIG = {
  BASE_SLOTS: 2, // All planets start with 2 slots
  MAX_SLOTS: 4, // Maximum slots per planet
  PRESTIGE_BONUS_KEY: 'mod_slots', // Key for prestige bonus (future)
};

/**
 * Get the number of mod slots available for a planet.
 * Currently returns base slots; can be expanded with prestige bonuses.
 */
export function getModSlots(_planetId: string, prestigeBonusLevel: number = 0): number {
  // Base slots + prestige bonus (1 extra slot per level, capped at max)
  const slots = MOD_SLOT_CONFIG.BASE_SLOTS + prestigeBonusLevel;
  return Math.min(slots, MOD_SLOT_CONFIG.MAX_SLOTS);
}

/**
 * Install a mod on a planet.
 * Mods are permanent upgrades that persist through prestige.
 */
export function installMod(
  itemId: string,
  planetId: string,
  state: CraftingState,
  prestigeBonusLevel: number = 0
): { success: boolean; error?: string; newState: CraftingState } {
  // Find the item in inventory
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Item not found in inventory', newState: state };
  }

  // Verify it's a mod
  const recipe = RECIPES[item.itemId];
  if (!recipe || recipe.category !== 'mod') {
    return { success: false, error: 'Item is not a mod', newState: state };
  }

  // Check if already installed
  if (item.installedOn) {
    return { success: false, error: 'Mod is already installed on a planet', newState: state };
  }

  // Check available slots
  const installedMods = getInstalledMods(planetId, state);
  const maxSlots = getModSlots(planetId, prestigeBonusLevel);
  if (installedMods.length >= maxSlots) {
    return {
      success: false,
      error: `Planet has no available mod slots (${installedMods.length}/${maxSlots})`,
      newState: state,
    };
  }

  // Check if planet already has a mod of this type (same effectType)
  const existingSameType = installedMods.find(mod => {
    const r = RECIPES[mod.itemId];
    return r?.effectType === recipe.effectType;
  });
  if (existingSameType) {
    return {
      success: false,
      error: `Planet already has a ${recipe.effectType} mod installed`,
      newState: state,
    };
  }

  // Install the mod
  const newInventory = state.inventory.map(i =>
    i.id === itemId ? { ...i, installedOn: planetId } : i
  );

  return {
    success: true,
    newState: { ...state, inventory: newInventory },
  };
}

/**
 * Uninstall a mod from a planet.
 * Note: Mods are NOT refunded when uninstalled.
 */
export function uninstallMod(
  itemId: string,
  state: CraftingState
): { success: boolean; error?: string; newState: CraftingState } {
  // Find the item
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Item not found in inventory', newState: state };
  }

  // Verify it's a mod
  const recipe = RECIPES[item.itemId];
  if (!recipe || recipe.category !== 'mod') {
    return { success: false, error: 'Item is not a mod', newState: state };
  }

  // Verify it's installed
  if (!item.installedOn) {
    return { success: false, error: 'Mod is not installed on any planet', newState: state };
  }

  // Uninstall the mod
  const newInventory = state.inventory.map(i =>
    i.id === itemId ? { ...i, installedOn: undefined } : i
  );

  return {
    success: true,
    newState: { ...state, inventory: newInventory },
  };
}

// ============================================
// SUPPLY SYSTEM (Consumables for Expeditions)
// ============================================

export interface SupplyEffect {
  effectType: 'expeditionTime' | 'expeditionRewards' | 'seedProtectionChance' | 'legendaryChance';
  effectValue: number;
}

export interface ConsumedSupplyResult {
  success: boolean;
  error?: string;
  newState: CraftingState;
  effect?: SupplyEffect;
}

/**
 * Consume a supply item from inventory.
 * Returns the effect to apply to the expedition.
 */
export function consumeSupply(itemId: string, state: CraftingState): ConsumedSupplyResult {
  // Find the item in inventory
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Item not found in inventory', newState: state };
  }

  // Verify it's a supply
  const recipe = RECIPES[item.itemId];
  if (!recipe || recipe.category !== 'supply') {
    return { success: false, error: 'Item is not a supply', newState: state };
  }

  // Get effect details
  const effectType = recipe.effectType as SupplyEffect['effectType'];
  const effectValue = recipe.effectValue ?? 0;

  // Remove from inventory (consumed)
  const newInventory = state.inventory.filter(i => i.id !== itemId);

  return {
    success: true,
    newState: { ...state, inventory: newInventory },
    effect: { effectType, effectValue },
  };
}

/**
 * Get all supply effects from a list of supply item IDs.
 * This consumes all supplies and returns combined effects.
 */
export function consumeMultipleSupplies(
  itemIds: string[],
  state: CraftingState
): {
  success: boolean;
  error?: string;
  newState: CraftingState;
  effects: SupplyEffect[];
} {
  let currentState = state;
  const effects: SupplyEffect[] = [];

  for (const itemId of itemIds) {
    const result = consumeSupply(itemId, currentState);
    if (!result.success) {
      // Rollback: return original state on any failure
      return {
        success: false,
        error: `Failed to consume supply ${itemId}: ${result.error}`,
        newState: state,
        effects: [],
      };
    }
    currentState = result.newState;
    if (result.effect) {
      effects.push(result.effect);
    }
  }

  return { success: true, newState: currentState, effects };
}

/**
 * Get combined supply effects by type.
 * Effects of the same type are additive.
 */
export function combineSupplyEffects(effects: SupplyEffect[]): Record<string, number> {
  const combined: Record<string, number> = {};

  for (const effect of effects) {
    combined[effect.effectType] = (combined[effect.effectType] || 0) + effect.effectValue;
  }

  return combined;
}

// ============================================
// BONUS CALCULATIONS
// ============================================

/**
 * Get total equipment bonus for a manager by effect type.
 * Returns the sum of effectValue for all equipped items matching the effect type.
 * Also includes 'allBonus' items which apply to ALL effect types.
 */
export function getEquipmentBonusForManager(
  managerId: string,
  effectType: string,
  state: CraftingState
): number {
  let bonus = 0;

  for (const item of state.inventory) {
    if (item.equippedTo !== managerId) continue;

    const recipe = RECIPES[item.itemId];
    if (!recipe?.effectValue) continue;

    // Match specific effect type OR allBonus (which applies to everything)
    if (recipe.effectType === effectType || recipe.effectType === 'allBonus') {
      bonus += recipe.effectValue;
    }
  }

  return bonus;
}

/**
 * Get total equipment bonus across ALL equipped items by effect type.
 * Used for global bonuses like sell value that apply to all operations.
 * Also includes 'allBonus' items which apply to ALL effect types.
 */
export function getTotalEquipmentBonus(effectType: string, state: CraftingState): number {
  let bonus = 0;

  for (const item of state.inventory) {
    // Only count equipped items
    if (!item.equippedTo) continue;

    const recipe = RECIPES[item.itemId];
    if (!recipe?.effectValue) continue;

    // Match specific effect type OR allBonus (which applies to everything)
    if (recipe.effectType === effectType || recipe.effectType === 'allBonus') {
      bonus += recipe.effectValue;
    }
  }

  return bonus;
}

/**
 * Get mod bonus for a planet by effect type.
 * Returns the sum of effectValue for all installed mods matching the effect type.
 */
export function getModBonusForPlanet(
  planetId: string,
  effectType: string,
  state: CraftingState
): number {
  let bonus = 0;

  for (const item of state.inventory) {
    if (item.installedOn !== planetId) continue;

    const recipe = RECIPES[item.itemId];
    if (recipe?.effectType === effectType && recipe.effectValue) {
      bonus += recipe.effectValue;
    }
  }

  return bonus;
}

/**
 * Get extra seed slots from mods installed on a planet.
 * Counts mods with effectType 'extraSlot'.
 */
export function getExtraSeedSlots(planetId: string, state: CraftingState): number {
  let extraSlots = 0;

  for (const item of state.inventory) {
    if (item.installedOn !== planetId) continue;

    const recipe = RECIPES[item.itemId];
    if (recipe?.effectType === 'extraSlot' && recipe.effectValue) {
      extraSlots += recipe.effectValue;
    }
  }

  return extraSlots;
}

/**
 * Get managers with globalManagerBonus equipment (like Star Compass).
 * Returns list of {managerId, effectValue} for each manager with this equipment.
 * The effectValue is the strength at which their bonuses spread to other planets.
 */
export function getManagersWithGlobalBonus(
  state: CraftingState
): Array<{ managerId: string; effectValue: number }> {
  const result: Array<{ managerId: string; effectValue: number }> = [];

  for (const item of state.inventory) {
    if (!item.equippedTo) continue;

    const recipe = RECIPES[item.itemId];
    if (recipe?.effectType === 'globalManagerBonus' && recipe.effectValue) {
      // Check if manager already in result (could have multiple globalManagerBonus items)
      const existing = result.find(r => r.managerId === item.equippedTo);
      if (existing) {
        // Take the best (highest) effect value, not additive
        existing.effectValue = Math.max(existing.effectValue, recipe.effectValue);
      } else {
        result.push({
          managerId: item.equippedTo,
          effectValue: recipe.effectValue,
        });
      }
    }
  }

  return result;
}

/**
 * Get total mod bonus across ALL planets for a specific effect type.
 * Used for global bonuses that stack across all planets.
 */
export function getTotalModBonus(effectType: string, state: CraftingState): number {
  let bonus = 0;

  for (const item of state.inventory) {
    // Only count installed mods
    if (!item.installedOn) continue;

    const recipe = RECIPES[item.itemId];
    if (recipe?.effectType === effectType && recipe.effectValue) {
      bonus += recipe.effectValue;
    }
  }

  return bonus;
}

// Get equipment attached to a manager (equipped and available)
export function getManagerEquipment(
  managerId: string,
  state: CraftingState
): { equipped: CraftedItem[]; available: CraftedItem[] } {
  const equipped = state.inventory.filter(item => item.equippedTo === managerId);
  const available = state.inventory.filter(item => {
    const recipe = RECIPES[item.itemId];
    return recipe?.category === 'equipment' && !item.equippedTo;
  });
  return { equipped, available };
}

// Get mods installed on a planet
export function getInstalledMods(planetId: string, state: CraftingState): CraftedItem[] {
  return state.inventory.filter(item => item.installedOn === planetId);
}

// Get available (uninstalled) mods
export function getAvailableMods(state: CraftingState): CraftedItem[] {
  return state.inventory.filter(item => {
    const recipe = RECIPES[item.itemId];
    return recipe?.category === 'mod' && !item.installedOn;
  });
}

// Get available supplies
export function getAvailableSupplies(state: CraftingState): CraftedItem[] {
  return state.inventory.filter(item => {
    const recipe = RECIPES[item.itemId];
    return recipe?.category === 'supply';
  });
}

// ============================================
// EQUIPMENT SYSTEM (for managers)
// ============================================
