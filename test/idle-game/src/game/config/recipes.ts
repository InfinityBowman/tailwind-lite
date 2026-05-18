/**
 * Recipe Configuration for Plant Materials Crafting
 *
 * Items are crafted from extracts. Each recipe defines:
 * - Required extracts and quantities
 * - The resulting item
 * - Category for UI organization
 */

import type { ExtractId } from './extracts';

// Item categories
export type ItemCategory =
  | 'booster' // Temporary planet buffs
  | 'equipment' // Manager equipment
  | 'supply' // Expedition supplies
  | 'mod' // Permanent planet mods
  | 'cosmetic'; // Visual customization

// Item IDs - exhaustive list
export type ItemId =
  // Boosters
  | 'growth_serum'
  | 'rapid_export'
  | 'bumper_boost'
  | 'value_surge'
  | 'fertility_burst'
  | 'cosmic_alignment'
  // Equipment
  | 'farmers_gloves'
  | 'merchants_ledger'
  | 'logistics_module'
  | 'vitality_charm'
  | 'harvest_crown'
  | 'star_compass'
  // Supplies
  | 'trail_rations'
  | 'star_map'
  | 'lucky_charm'
  | 'cosmic_beacon'
  // Mods
  | 'extra_slot_module'
  | 'export_hub'
  | 'fertile_core'
  | 'cosmic_attunement';

export interface RecipeIngredient {
  extractId: ExtractId;
  amount: number;
}

export interface Recipe {
  id: ItemId;
  name: string;
  description: string;
  category: ItemCategory;
  ingredients: RecipeIngredient[];
  // For boosters: duration in ms
  durationMs?: number;
  // For boosters/equipment: effect magnitude
  effectValue?: number;
  // What the effect targets
  effectType?:
    | 'production'
    | 'exportSpeed'
    | 'storageCapacity'
    | 'sellValue'
    | 'bumperChance'
    | 'allBonus'
    | 'globalManagerBonus' // Spreads equipped manager's bonus to ALL planets at effectValue strength
    | 'expeditionTime'
    | 'expeditionRewards'
    | 'seedProtectionChance'
    | 'legendaryChance'
    | 'extraSlot'
    | 'starfruitBonus';
}

export const RECIPES: Record<ItemId, Recipe> = {
  // === BOOSTERS (Temporary planet buffs) ===
  growth_serum: {
    id: 'growth_serum',
    name: 'Growth Serum',
    description: '+50% production for 30 minutes',
    category: 'booster',
    ingredients: [
      { extractId: 'grain', amount: 10 },
      { extractId: 'root', amount: 5 },
    ],
    durationMs: 30 * 60 * 1000,
    effectValue: 0.5,
    effectType: 'production',
  },
  rapid_export: {
    id: 'rapid_export',
    name: 'Rapid Export',
    description: '+100% export speed for 30 minutes',
    category: 'booster',
    ingredients: [
      { extractId: 'starch', amount: 8 },
      { extractId: 'hydro', amount: 4 },
    ],
    durationMs: 30 * 60 * 1000,
    effectValue: 0.5,
    effectType: 'exportSpeed',
  },
  bumper_boost: {
    id: 'bumper_boost',
    name: 'Bumper Boost',
    description: '+10% bumper harvest chance for 1 hour',
    category: 'booster',
    ingredients: [
      { extractId: 'vine', amount: 6 },
      { extractId: 'tuber', amount: 6 },
    ],
    durationMs: 60 * 60 * 1000,
    effectValue: 0.1,
    effectType: 'bumperChance',
  },
  value_surge: {
    id: 'value_surge',
    name: 'Value Surge',
    description: '+25% sell value for 30 minutes',
    category: 'booster',
    ingredients: [
      { extractId: 'kernel', amount: 10 },
      { extractId: 'protein', amount: 5 },
    ],
    durationMs: 30 * 60 * 1000,
    effectValue: 0.25,
    effectType: 'sellValue',
  },
  fertility_burst: {
    id: 'fertility_burst',
    name: 'Fertility Burst',
    description: '+100% production for 10 minutes',
    category: 'booster',
    ingredients: [
      { extractId: 'harvest', amount: 5 },
      { extractId: 'stellar', amount: 3 },
    ],
    durationMs: 10 * 60 * 1000,
    effectValue: 1.0,
    effectType: 'production',
  },
  cosmic_alignment: {
    id: 'cosmic_alignment',
    name: 'Cosmic Alignment',
    description: '+200% production on ALL planets for 5 minutes',
    category: 'booster',
    ingredients: [
      { extractId: 'stellar', amount: 10 },
      { extractId: 'harvest', amount: 5 },
    ],
    durationMs: 5 * 60 * 1000,
    effectValue: 2.0,
    effectType: 'production',
  },

  // === EQUIPMENT (Manager enhancements) ===
  farmers_gloves: {
    id: 'farmers_gloves',
    name: "Farmer's Gloves",
    description: '+15% manager production bonus',
    category: 'equipment',
    ingredients: [
      { extractId: 'grain', amount: 20 },
      { extractId: 'tuber', amount: 10 },
    ],
    effectValue: 0.15,
    effectType: 'production',
  },
  merchants_ledger: {
    id: 'merchants_ledger',
    name: "Merchant's Ledger",
    description: '+15% manager sell bonus',
    category: 'equipment',
    ingredients: [
      { extractId: 'kernel', amount: 15 },
      { extractId: 'protein', amount: 10 },
    ],
    effectValue: 0.15,
    effectType: 'sellValue',
  },
  logistics_module: {
    id: 'logistics_module',
    name: 'Logistics Module',
    description: '+15% manager export bonus',
    category: 'equipment',
    ingredients: [
      { extractId: 'starch', amount: 12 },
      { extractId: 'hydro', amount: 8 },
    ],
    effectValue: 0.15,
    effectType: 'exportSpeed',
  },
  vitality_charm: {
    id: 'vitality_charm',
    name: 'Vitality Charm',
    description: '+10% all manager bonuses',
    category: 'equipment',
    ingredients: [
      { extractId: 'vine', amount: 15 },
      { extractId: 'root', amount: 10 },
    ],
    effectValue: 0.1,
    effectType: 'allBonus',
  },
  harvest_crown: {
    id: 'harvest_crown',
    name: 'Harvest Crown',
    description: '+25% all manager bonuses',
    category: 'equipment',
    ingredients: [
      { extractId: 'harvest', amount: 20 },
      { extractId: 'stellar', amount: 10 },
    ],
    effectValue: 0.25,
    effectType: 'allBonus',
  },
  star_compass: {
    id: 'star_compass',
    name: 'Star Compass',
    description: 'Manager production bonus affects ALL planets at 50% strength',
    category: 'equipment',
    ingredients: [
      { extractId: 'stellar', amount: 30 },
      { extractId: 'harvest', amount: 15 },
    ],
    effectValue: 0.5,
    effectType: 'globalManagerBonus',
  },

  // === SUPPLIES (Expedition enhancements) ===
  trail_rations: {
    id: 'trail_rations',
    name: 'Trail Rations',
    description: '-20% expedition time',
    category: 'supply',
    ingredients: [
      { extractId: 'grain', amount: 15 },
      { extractId: 'tuber', amount: 10 },
      { extractId: 'protein', amount: 5 },
    ],
    effectValue: 0.2,
    effectType: 'expeditionTime',
  },
  star_map: {
    id: 'star_map',
    name: 'Star Map',
    description: '+25% expedition rewards',
    category: 'supply',
    ingredients: [
      { extractId: 'stellar', amount: 10 },
      { extractId: 'vine', amount: 8 },
    ],
    effectValue: 0.25,
    effectType: 'expeditionRewards',
  },
  lucky_charm: {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: '50% chance to protect rare seeds on failed expeditions',
    category: 'supply',
    ingredients: [
      { extractId: 'harvest', amount: 12 },
      { extractId: 'root', amount: 8 },
    ],
    effectValue: 0.5,
    effectType: 'seedProtectionChance',
  },
  cosmic_beacon: {
    id: 'cosmic_beacon',
    name: 'Cosmic Beacon',
    description: '+10% legendary reward chance',
    category: 'supply',
    ingredients: [
      { extractId: 'stellar', amount: 20 },
      { extractId: 'harvest', amount: 10 },
    ],
    effectValue: 0.1,
    effectType: 'legendaryChance',
  },

  // === MODS (Permanent planet upgrades) ===
  extra_slot_module: {
    id: 'extra_slot_module',
    name: 'Extra Slot Module',
    description: '+1 seed slot on planet (permanent)',
    category: 'mod',
    ingredients: [
      { extractId: 'grain', amount: 100 },
      { extractId: 'starch', amount: 50 },
      { extractId: 'tuber', amount: 50 },
      { extractId: 'stellar', amount: 25 },
    ],
    effectValue: 1,
    effectType: 'extraSlot',
  },
  export_hub: {
    id: 'export_hub',
    name: 'Export Hub',
    description: '+25% permanent storage capacity',
    category: 'mod',
    ingredients: [
      { extractId: 'starch', amount: 80 },
      { extractId: 'hydro', amount: 40 },
      { extractId: 'kernel', amount: 20 },
    ],
    effectValue: 0.25,
    effectType: 'storageCapacity',
  },
  fertile_core: {
    id: 'fertile_core',
    name: 'Fertile Core',
    description: '+25% permanent production',
    category: 'mod',
    ingredients: [
      { extractId: 'root', amount: 60 },
      { extractId: 'vine', amount: 40 },
      { extractId: 'harvest', amount: 30 },
    ],
    effectValue: 0.25,
    effectType: 'production',
  },
  cosmic_attunement: {
    id: 'cosmic_attunement',
    name: 'Cosmic Attunement',
    description: '+50% Starfruit production on planet',
    category: 'mod',
    ingredients: [
      { extractId: 'stellar', amount: 50 },
      { extractId: 'harvest', amount: 30 },
    ],
    effectValue: 0.5,
    effectType: 'starfruitBonus',
  },
};

// Helper to get recipes by category
export function getRecipesByCategory(category: ItemCategory): Recipe[] {
  return Object.values(RECIPES).filter(r => r.category === category);
}

// All recipe IDs
export const ALL_ITEM_IDS = Object.keys(RECIPES) as ItemId[];
