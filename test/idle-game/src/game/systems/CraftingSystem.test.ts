/**
 * CraftingSystem Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialCraftingState,
  canAffordRecipe,
  getMissingIngredients,
  craftItem,
  applyBooster,
  updateActiveBoosts,
  getBoostMultiplier,
  getInventoryByCategory,
  countItem,
  getRecipeInfo,
  equipToManager,
  unequipFromManager,
  getEquipmentBonusForManager,
  getTotalEquipmentBonus,
  getManagerEquipment,
  installMod,
  uninstallMod,
  getModBonusForPlanet,
  getExtraSeedSlots,
  getTotalModBonus,
  getInstalledMods,
  getAvailableMods,
  getAvailableSupplies,
  getModSlots,
  MOD_SLOT_CONFIG,
  consumeSupply,
  consumeMultipleSupplies,
  combineSupplyEffects,
  type CraftingState,
  type CraftedItem,
} from './CraftingSystem';
import { RECIPES } from '../config/recipes';
import { createInitialExtractState, type ExtractInventory } from './ExtractSystem';

describe('CraftingSystem', () => {
  let extracts: ExtractInventory;
  let craftingState: CraftingState;

  beforeEach(() => {
    extracts = createInitialExtractState();
    craftingState = createInitialCraftingState();
  });

  describe('createInitialCraftingState', () => {
    it('should create empty crafting state', () => {
      const state = createInitialCraftingState();
      expect(state.inventory).toEqual([]);
      expect(state.activeBoosts).toEqual([]);
    });
  });

  describe('canAffordRecipe', () => {
    it('should return false with no extracts', () => {
      expect(canAffordRecipe(RECIPES.growth_serum, extracts)).toBe(false);
    });

    it('should return true when player has enough extracts', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 5;
      expect(canAffordRecipe(RECIPES.growth_serum, extracts)).toBe(true);
    });

    it('should return false when missing one ingredient', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 4; // Need 5
      expect(canAffordRecipe(RECIPES.growth_serum, extracts)).toBe(false);
    });
  });

  describe('getMissingIngredients', () => {
    it('should return all ingredients when inventory is empty', () => {
      const missing = getMissingIngredients(RECIPES.growth_serum, extracts);
      expect(missing).toHaveLength(2);
      expect(missing.find(m => m.extractId === 'grain')).toEqual({
        extractId: 'grain',
        have: 0,
        need: 10,
      });
    });

    it('should return empty array when player can afford', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 5;
      expect(getMissingIngredients(RECIPES.growth_serum, extracts)).toEqual([]);
    });

    it('should only return missing ingredients', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 3;
      const missing = getMissingIngredients(RECIPES.growth_serum, extracts);
      expect(missing).toHaveLength(1);
      expect(missing[0].extractId).toBe('root');
    });
  });

  describe('craftItem', () => {
    it('should fail with insufficient extracts', () => {
      const result = craftItem('growth_serum', extracts);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient extracts');
    });

    it('should succeed and deduct extracts', () => {
      extracts.extracts.grain = 15;
      extracts.extracts.root = 10;

      const result = craftItem('growth_serum', extracts);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item!.itemId).toBe('growth_serum');
      expect(result.extracts.extracts.grain).toBe(5);
      expect(result.extracts.extracts.root).toBe(5);
    });

    it('should create unique item IDs', () => {
      extracts.extracts.grain = 30;
      extracts.extracts.root = 15;

      const result1 = craftItem('growth_serum', extracts);
      const result2 = craftItem('growth_serum', result1.extracts);

      expect(result1.item!.id).not.toBe(result2.item!.id);
    });

    it('should fail with unknown recipe', () => {
      const result = craftItem('unknown_item' as any, extracts);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown recipe');
    });
  });

  describe('applyBooster', () => {
    it('should move booster from inventory to active', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 5;
      const { item } = craftItem('growth_serum', extracts);

      craftingState.inventory.push(item!);
      const newState = applyBooster(item!, craftingState);

      expect(newState.inventory).toHaveLength(0);
      expect(newState.activeBoosts).toHaveLength(1);
      expect(newState.activeBoosts[0].appliedAt).toBeDefined();
      expect(newState.activeBoosts[0].expiresAt).toBeDefined();
    });

    it('should set correct expiration time', () => {
      extracts.extracts.grain = 10;
      extracts.extracts.root = 5;
      const { item } = craftItem('growth_serum', extracts);

      craftingState.inventory.push(item!);
      const before = Date.now();
      const newState = applyBooster(item!, craftingState);
      const after = Date.now();

      const boost = newState.activeBoosts[0];
      expect(boost.expiresAt! - boost.appliedAt!).toBe(30 * 60 * 1000); // 30 min
      expect(boost.appliedAt).toBeGreaterThanOrEqual(before);
      expect(boost.appliedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('updateActiveBoosts', () => {
    it('should remove expired boosts', () => {
      const expiredBoost = {
        id: 'test',
        itemId: 'growth_serum' as const,
        craftedAt: Date.now() - 60000,
        appliedAt: Date.now() - 60000,
        expiresAt: Date.now() - 1000, // Already expired
      };

      craftingState.activeBoosts.push(expiredBoost);
      const newState = updateActiveBoosts(craftingState);

      expect(newState.activeBoosts).toHaveLength(0);
    });

    it('should keep active boosts', () => {
      const activeBoost = {
        id: 'test',
        itemId: 'growth_serum' as const,
        craftedAt: Date.now(),
        appliedAt: Date.now(),
        expiresAt: Date.now() + 60000, // Still active
      };

      craftingState.activeBoosts.push(activeBoost);
      const newState = updateActiveBoosts(craftingState);

      expect(newState.activeBoosts).toHaveLength(1);
    });
  });

  describe('getBoostMultiplier', () => {
    it('should return 0 with no boosts', () => {
      expect(getBoostMultiplier(craftingState, 'production')).toBe(0);
    });

    it('should sum multiple boosts of same type', () => {
      craftingState.activeBoosts = [
        {
          id: 'test1',
          itemId: 'growth_serum',
          craftedAt: Date.now(),
          appliedAt: Date.now(),
          expiresAt: Date.now() + 60000,
        },
        {
          id: 'test2',
          itemId: 'fertility_burst',
          craftedAt: Date.now(),
          appliedAt: Date.now(),
          expiresAt: Date.now() + 60000,
        },
      ];

      // growth_serum = 0.5, fertility_burst = 1.0
      expect(getBoostMultiplier(craftingState, 'production')).toBe(1.5);
    });
  });

  describe('getInventoryByCategory', () => {
    it('should filter items by category', () => {
      craftingState.inventory = [
        { id: '1', itemId: 'growth_serum', craftedAt: Date.now() },
        { id: '2', itemId: 'farmers_gloves', craftedAt: Date.now() },
        { id: '3', itemId: 'rapid_export', craftedAt: Date.now() },
      ];

      const boosters = getInventoryByCategory(craftingState, 'booster');
      expect(boosters).toHaveLength(2);

      const equipment = getInventoryByCategory(craftingState, 'equipment');
      expect(equipment).toHaveLength(1);
    });
  });

  describe('countItem', () => {
    it('should count specific items', () => {
      craftingState.inventory = [
        { id: '1', itemId: 'growth_serum', craftedAt: Date.now() },
        { id: '2', itemId: 'growth_serum', craftedAt: Date.now() },
        { id: '3', itemId: 'rapid_export', craftedAt: Date.now() },
      ];

      expect(countItem(craftingState, 'growth_serum')).toBe(2);
      expect(countItem(craftingState, 'rapid_export')).toBe(1);
      expect(countItem(craftingState, 'farmers_gloves')).toBe(0);
    });
  });

  describe('getRecipeInfo', () => {
    it('should return recipe with affordability', () => {
      extracts.extracts.grain = 5;
      extracts.extracts.root = 5;

      const info = getRecipeInfo('growth_serum', extracts);

      expect(info).toBeDefined();
      expect(info!.recipe.id).toBe('growth_serum');
      expect(info!.canAfford).toBe(false);
      expect(info!.missing).toHaveLength(1);
    });

    it('should return null for unknown recipe', () => {
      expect(getRecipeInfo('unknown' as any, extracts)).toBeNull();
    });
  });

  // ============================================
  // EQUIPMENT SYSTEM TESTS
  // ============================================

  describe('equipToManager', () => {
    let equipmentItem: CraftedItem;

    beforeEach(() => {
      // Create an equipment item in inventory
      equipmentItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(equipmentItem);
    });

    it('should equip equipment item to manager', () => {
      const result = equipToManager('gloves_001', 'manager_1', craftingState);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.newState.inventory[0].equippedTo).toBe('manager_1');
    });

    it('should fail when item not found', () => {
      const result = equipToManager('nonexistent', 'manager_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found in inventory');
    });

    it('should fail when item is not equipment', () => {
      const boosterItem: CraftedItem = {
        id: 'booster_001',
        itemId: 'growth_serum',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(boosterItem);

      const result = equipToManager('booster_001', 'manager_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is not equipment');
    });

    it('should fail when item is already equipped', () => {
      equipmentItem.equippedTo = 'manager_2';

      const result = equipToManager('gloves_001', 'manager_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is already equipped to a manager');
    });

    it('should fail when manager already has equipment of same effect type', () => {
      // First equip succeeds
      const result1 = equipToManager('gloves_001', 'manager_1', craftingState);
      expect(result1.success).toBe(true);

      // Add another production equipment
      const anotherGloves: CraftedItem = {
        id: 'gloves_002',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
      };
      result1.newState.inventory.push(anotherGloves);

      // Second equip should fail (same effect type)
      const result2 = equipToManager('gloves_002', 'manager_1', result1.newState);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Manager already has production equipment equipped');
    });

    it('should allow different effect types on same manager', () => {
      // Equip production equipment
      const result1 = equipToManager('gloves_001', 'manager_1', craftingState);
      expect(result1.success).toBe(true);

      // Add sell bonus equipment
      const ledger: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger',
        craftedAt: Date.now(),
      };
      result1.newState.inventory.push(ledger);

      // Equip sell equipment (different effect type)
      const result2 = equipToManager('ledger_001', 'manager_1', result1.newState);
      expect(result2.success).toBe(true);
    });
  });

  describe('unequipFromManager', () => {
    let equippedItem: CraftedItem;

    beforeEach(() => {
      equippedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      craftingState.inventory.push(equippedItem);
    });

    it('should unequip item from manager', () => {
      const result = unequipFromManager('gloves_001', craftingState);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.newState.inventory[0].equippedTo).toBeUndefined();
    });

    it('should fail when item not found', () => {
      const result = unequipFromManager('nonexistent', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found in inventory');
    });

    it('should fail when item is not equipped', () => {
      delete equippedItem.equippedTo;

      const result = unequipFromManager('gloves_001', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is not equipped to any manager');
    });
  });

  describe('getEquipmentBonusForManager', () => {
    it('should return 0 when no equipment', () => {
      const bonus = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should return equipment bonus for correct effect type', () => {
      const equippedItem: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves', // effectType: production, effectValue: 0.15
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      craftingState.inventory.push(equippedItem);

      const productionBonus = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      expect(productionBonus).toBe(0.15);

      const sellBonus = getEquipmentBonusForManager('manager_1', 'sellValue', craftingState);
      expect(sellBonus).toBe(0);
    });

    it('should return 0 for equipment on different manager', () => {
      const equippedItem: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(equippedItem);

      const bonus = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should sum multiple equipment bonuses of same type', () => {
      // Note: current implementation prevents same effect type on one manager
      // But test the summing logic by having equipment on multiple managers
      const item1: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const item2: CraftedItem = {
        id: 'gloves_002',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(item1, item2);

      const bonus1 = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      const bonus2 = getEquipmentBonusForManager('manager_2', 'production', craftingState);

      expect(bonus1).toBe(0.15);
      expect(bonus2).toBe(0.15);
    });

    it('should include allBonus equipment when querying any effect type', () => {
      const charm: CraftedItem = {
        id: 'charm_001',
        itemId: 'vitality_charm', // +10% allBonus
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      craftingState.inventory.push(charm);

      // allBonus should contribute to all effect types for that manager
      const productionBonus = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      const sellBonus = getEquipmentBonusForManager('manager_1', 'sellValue', craftingState);

      expect(productionBonus).toBe(0.1);
      expect(sellBonus).toBe(0.1);
    });

    it('should stack allBonus with specific equipment', () => {
      const charm: CraftedItem = {
        id: 'charm_001',
        itemId: 'vitality_charm', // +10% allBonus
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const gloves: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves', // +15% production
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      craftingState.inventory.push(charm, gloves);

      const productionBonus = getEquipmentBonusForManager('manager_1', 'production', craftingState);
      const sellBonus = getEquipmentBonusForManager('manager_1', 'sellValue', craftingState);

      expect(productionBonus).toBe(0.25); // 0.10 (all) + 0.15 (specific)
      expect(sellBonus).toBe(0.1); // only allBonus
    });
  });

  describe('getTotalEquipmentBonus', () => {
    it('should return 0 when no equipment is equipped', () => {
      const bonus = getTotalEquipmentBonus('sellValue', craftingState);
      expect(bonus).toBe(0);
    });

    it('should return 0 for unequipped equipment', () => {
      const unequippedItem: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger', // sellValue equipment
        craftedAt: Date.now(),
        // Not equipped to anyone
      };
      craftingState.inventory.push(unequippedItem);

      const bonus = getTotalEquipmentBonus('sellValue', craftingState);
      expect(bonus).toBe(0);
    });

    it('should sum bonuses from all equipped items', () => {
      // Equip sell bonus items to different managers
      const ledger1: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger', // +15% sellValue
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const ledger2: CraftedItem = {
        id: 'ledger_002',
        itemId: 'merchants_ledger', // +15% sellValue
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(ledger1, ledger2);

      const bonus = getTotalEquipmentBonus('sellValue', craftingState);
      expect(bonus).toBe(0.3); // 0.15 + 0.15
    });

    it('should only count items with matching effect type', () => {
      const ledger: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger', // sellValue
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const gloves: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves', // production
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(ledger, gloves);

      const sellBonus = getTotalEquipmentBonus('sellValue', craftingState);
      const productionBonus = getTotalEquipmentBonus('production', craftingState);

      expect(sellBonus).toBe(0.15);
      expect(productionBonus).toBe(0.15);
    });

    it('should include allBonus items when querying any effect type', () => {
      const charm: CraftedItem = {
        id: 'charm_001',
        itemId: 'vitality_charm', // +10% allBonus
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      craftingState.inventory.push(charm);

      // allBonus should contribute to all effect types
      const productionBonus = getTotalEquipmentBonus('production', craftingState);
      const sellBonus = getTotalEquipmentBonus('sellValue', craftingState);
      const exportSpeedBonus = getTotalEquipmentBonus('exportSpeed', craftingState);

      expect(productionBonus).toBe(0.1);
      expect(sellBonus).toBe(0.1);
      expect(exportSpeedBonus).toBe(0.1);
    });

    it('should stack allBonus with specific effect type', () => {
      const charm: CraftedItem = {
        id: 'charm_001',
        itemId: 'vitality_charm', // +10% allBonus
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const ledger: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger', // +15% sellValue
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(charm, ledger);

      const sellBonus = getTotalEquipmentBonus('sellValue', craftingState);
      expect(sellBonus).toBe(0.25); // 0.10 (all) + 0.15 (specific)
    });
  });

  describe('getManagerEquipment', () => {
    it('should return empty arrays when no equipment', () => {
      const { equipped, available } = getManagerEquipment('manager_1', craftingState);
      expect(equipped).toHaveLength(0);
      expect(available).toHaveLength(0);
    });

    it('should separate equipped and available equipment', () => {
      const equippedItem: CraftedItem = {
        id: 'gloves_001',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
        equippedTo: 'manager_1',
      };
      const availableItem: CraftedItem = {
        id: 'ledger_001',
        itemId: 'merchants_ledger',
        craftedAt: Date.now(),
      };
      const otherManagerItem: CraftedItem = {
        id: 'module_001',
        itemId: 'logistics_module',
        craftedAt: Date.now(),
        equippedTo: 'manager_2',
      };
      craftingState.inventory.push(equippedItem, availableItem, otherManagerItem);

      const { equipped, available } = getManagerEquipment('manager_1', craftingState);

      expect(equipped).toHaveLength(1);
      expect(equipped[0].id).toBe('gloves_001');
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('ledger_001');
    });

    it('should not include non-equipment items in available', () => {
      const boosterItem: CraftedItem = {
        id: 'booster_001',
        itemId: 'growth_serum',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(boosterItem);

      const { available } = getManagerEquipment('manager_1', craftingState);
      expect(available).toHaveLength(0);
    });
  });

  // ============================================
  // MOD SYSTEM TESTS
  // ============================================

  describe('getModSlots', () => {
    it('should return base slots by default', () => {
      const slots = getModSlots('planet_1');
      expect(slots).toBe(MOD_SLOT_CONFIG.BASE_SLOTS);
    });

    it('should add prestige bonus slots', () => {
      const slots = getModSlots('planet_1', 1);
      expect(slots).toBe(MOD_SLOT_CONFIG.BASE_SLOTS + 1);
    });

    it('should cap at maximum slots', () => {
      const slots = getModSlots('planet_1', 10); // Way more than max
      expect(slots).toBe(MOD_SLOT_CONFIG.MAX_SLOTS);
    });
  });

  describe('installMod', () => {
    let modItem: CraftedItem;

    beforeEach(() => {
      modItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core', // production mod
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(modItem);
    });

    it('should install mod on planet', () => {
      const result = installMod('fertile_core_001', 'planet_1', craftingState);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.newState.inventory[0].installedOn).toBe('planet_1');
    });

    it('should fail when item not found', () => {
      const result = installMod('nonexistent', 'planet_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found in inventory');
    });

    it('should fail when item is not a mod', () => {
      const boosterItem: CraftedItem = {
        id: 'booster_001',
        itemId: 'growth_serum',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(boosterItem);

      const result = installMod('booster_001', 'planet_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is not a mod');
    });

    it('should fail when mod is already installed', () => {
      modItem.installedOn = 'planet_2';

      const result = installMod('fertile_core_001', 'planet_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mod is already installed on a planet');
    });

    it('should fail when planet has no available mod slots', () => {
      // Install mods until slots are full
      const mod1: CraftedItem = {
        id: 'mod_1',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const mod2: CraftedItem = {
        id: 'mod_2',
        itemId: 'export_hub',
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(mod1, mod2);

      // Try to install third mod (default is 2 slots)
      const result = installMod('fertile_core_001', 'planet_1', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no available mod slots/);
    });

    it('should allow installing if prestige grants extra slots', () => {
      // Fill default slots
      const mod1: CraftedItem = {
        id: 'mod_1',
        itemId: 'export_hub', // Different effect type
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const mod2: CraftedItem = {
        id: 'mod_2',
        itemId: 'extra_slot_module', // Different effect type
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(mod1, mod2);

      // Should succeed with prestige bonus giving +1 slot
      const result = installMod('fertile_core_001', 'planet_1', craftingState, 1);

      expect(result.success).toBe(true);
    });

    it('should fail when planet already has mod of same effect type', () => {
      // Install a production mod first
      const result1 = installMod('fertile_core_001', 'planet_1', craftingState);
      expect(result1.success).toBe(true);

      // Add another production mod
      const anotherMod: CraftedItem = {
        id: 'fertile_core_002',
        itemId: 'fertile_core', // Same effect type (production)
        craftedAt: Date.now(),
      };
      result1.newState.inventory.push(anotherMod);

      // Should fail - same effect type
      const result2 = installMod('fertile_core_002', 'planet_1', result1.newState);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Planet already has a production mod installed');
    });

    it('should allow different effect types on same planet', () => {
      // Install production mod
      const result1 = installMod('fertile_core_001', 'planet_1', craftingState);
      expect(result1.success).toBe(true);

      // Add export capacity mod
      const exportMod: CraftedItem = {
        id: 'export_hub_001',
        itemId: 'export_hub', // storageCapacity effect type
        craftedAt: Date.now(),
      };
      result1.newState.inventory.push(exportMod);

      // Should succeed - different effect type
      const result2 = installMod('export_hub_001', 'planet_1', result1.newState);
      expect(result2.success).toBe(true);
    });
  });

  describe('uninstallMod', () => {
    let installedMod: CraftedItem;

    beforeEach(() => {
      installedMod = {
        id: 'fertile_core_001',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(installedMod);
    });

    it('should uninstall mod from planet', () => {
      const result = uninstallMod('fertile_core_001', craftingState);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.newState.inventory[0].installedOn).toBeUndefined();
    });

    it('should fail when item not found', () => {
      const result = uninstallMod('nonexistent', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found in inventory');
    });

    it('should fail when item is not a mod', () => {
      const boosterItem: CraftedItem = {
        id: 'booster_001',
        itemId: 'growth_serum',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(boosterItem);

      const result = uninstallMod('booster_001', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is not a mod');
    });

    it('should fail when mod is not installed', () => {
      delete installedMod.installedOn;

      const result = uninstallMod('fertile_core_001', craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mod is not installed on any planet');
    });
  });

  describe('getModBonusForPlanet', () => {
    it('should return 0 when no mods installed', () => {
      const bonus = getModBonusForPlanet('planet_1', 'production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should return mod bonus for correct effect type', () => {
      const installedMod: CraftedItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core', // effectType: production, effectValue: 0.25
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(installedMod);

      const productionBonus = getModBonusForPlanet('planet_1', 'production', craftingState);
      expect(productionBonus).toBe(0.25);

      const exportBonus = getModBonusForPlanet('planet_1', 'storageCapacity', craftingState);
      expect(exportBonus).toBe(0);
    });

    it('should return 0 for mods on different planet', () => {
      const installedMod: CraftedItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        installedOn: 'planet_2',
      };
      craftingState.inventory.push(installedMod);

      const bonus = getModBonusForPlanet('planet_1', 'production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should sum multiple mods of different types', () => {
      const prodMod: CraftedItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core', // +25% production
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const exportMod: CraftedItem = {
        id: 'export_hub_001',
        itemId: 'export_hub', // +25% storageCapacity
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(prodMod, exportMod);

      expect(getModBonusForPlanet('planet_1', 'production', craftingState)).toBe(0.25);
      expect(getModBonusForPlanet('planet_1', 'storageCapacity', craftingState)).toBe(0.25);
    });
  });

  describe('getExtraSeedSlots', () => {
    it('should return 0 when no slot mods installed', () => {
      const slots = getExtraSeedSlots('planet_1', craftingState);
      expect(slots).toBe(0);
    });

    it('should return extra slots from installed mods', () => {
      const slotMod: CraftedItem = {
        id: 'slot_mod_001',
        itemId: 'extra_slot_module', // effectType: extraSlot, effectValue: 1
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      craftingState.inventory.push(slotMod);

      const slots = getExtraSeedSlots('planet_1', craftingState);
      expect(slots).toBe(1);
    });

    it('should not count slots on other planets', () => {
      const slotMod: CraftedItem = {
        id: 'slot_mod_001',
        itemId: 'extra_slot_module',
        craftedAt: Date.now(),
        installedOn: 'planet_2',
      };
      craftingState.inventory.push(slotMod);

      const slots = getExtraSeedSlots('planet_1', craftingState);
      expect(slots).toBe(0);
    });
  });

  describe('getTotalModBonus', () => {
    it('should return 0 when no mods installed', () => {
      const bonus = getTotalModBonus('production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should return 0 for uninstalled mods', () => {
      const uninstalledMod: CraftedItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        // Not installed
      };
      craftingState.inventory.push(uninstalledMod);

      const bonus = getTotalModBonus('production', craftingState);
      expect(bonus).toBe(0);
    });

    it('should sum bonuses across all planets', () => {
      const mod1: CraftedItem = {
        id: 'fertile_core_001',
        itemId: 'fertile_core', // +25% production
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const mod2: CraftedItem = {
        id: 'fertile_core_002',
        itemId: 'fertile_core', // +25% production
        craftedAt: Date.now(),
        installedOn: 'planet_2',
      };
      craftingState.inventory.push(mod1, mod2);

      const bonus = getTotalModBonus('production', craftingState);
      expect(bonus).toBe(0.5); // 0.25 + 0.25
    });
  });

  describe('getInstalledMods', () => {
    it('should return empty array when no mods installed', () => {
      const mods = getInstalledMods('planet_1', craftingState);
      expect(mods).toHaveLength(0);
    });

    it('should return only mods installed on specified planet', () => {
      const mod1: CraftedItem = {
        id: 'mod_1',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const mod2: CraftedItem = {
        id: 'mod_2',
        itemId: 'export_hub',
        craftedAt: Date.now(),
        installedOn: 'planet_2',
      };
      const mod3: CraftedItem = {
        id: 'mod_3',
        itemId: 'extra_slot_module',
        craftedAt: Date.now(),
        // Not installed
      };
      craftingState.inventory.push(mod1, mod2, mod3);

      const mods = getInstalledMods('planet_1', craftingState);
      expect(mods).toHaveLength(1);
      expect(mods[0].id).toBe('mod_1');
    });
  });

  describe('getAvailableMods', () => {
    it('should return empty array when no mods', () => {
      const mods = getAvailableMods(craftingState);
      expect(mods).toHaveLength(0);
    });

    it('should return only uninstalled mods', () => {
      const installedMod: CraftedItem = {
        id: 'mod_1',
        itemId: 'fertile_core',
        craftedAt: Date.now(),
        installedOn: 'planet_1',
      };
      const availableMod: CraftedItem = {
        id: 'mod_2',
        itemId: 'export_hub',
        craftedAt: Date.now(),
        // Not installed
      };
      const booster: CraftedItem = {
        id: 'booster_1',
        itemId: 'growth_serum', // Not a mod
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(installedMod, availableMod, booster);

      const mods = getAvailableMods(craftingState);
      expect(mods).toHaveLength(1);
      expect(mods[0].id).toBe('mod_2');
    });
  });

  // ============================================
  // SUPPLY SYSTEM TESTS
  // ============================================

  describe('consumeSupply', () => {
    it('should consume a supply item and return its effect', () => {
      // Add a supply to inventory
      const supply: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations', // -20% expedition time
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply);

      const result = consumeSupply('supply_1', craftingState);

      expect(result.success).toBe(true);
      expect(result.effect).toBeDefined();
      expect(result.effect!.effectType).toBe('expeditionTime');
      expect(result.effect!.effectValue).toBe(0.2);
      expect(result.newState.inventory).toHaveLength(0); // Supply removed
    });

    it('should fail when item not found', () => {
      const result = consumeSupply('nonexistent', craftingState);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found in inventory');
    });

    it('should fail when item is not a supply', () => {
      const booster: CraftedItem = {
        id: 'booster_1',
        itemId: 'growth_serum', // This is a booster, not a supply
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(booster);

      const result = consumeSupply('booster_1', craftingState);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Item is not a supply');
    });
  });

  describe('consumeMultipleSupplies', () => {
    it('should consume multiple supplies and return all effects', () => {
      const supply1: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations', // expeditionTime: 0.2
        craftedAt: Date.now(),
      };
      const supply2: CraftedItem = {
        id: 'supply_2',
        itemId: 'star_map', // expeditionRewards: 0.25
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply1, supply2);

      const result = consumeMultipleSupplies(['supply_1', 'supply_2'], craftingState);

      expect(result.success).toBe(true);
      expect(result.effects).toHaveLength(2);
      expect(result.newState.inventory).toHaveLength(0);
    });

    it('should rollback on failure', () => {
      const supply1: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply1);

      // Try to consume one real supply and one nonexistent
      const result = consumeMultipleSupplies(['supply_1', 'nonexistent'], craftingState);

      expect(result.success).toBe(false);
      expect(result.effects).toHaveLength(0);
      // Original state should be unchanged (rollback)
      expect(result.newState.inventory).toHaveLength(1);
    });

    it('should fail when same supply ID is passed twice', () => {
      const supply1: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply1);

      // Try to consume same supply twice - should fail on second attempt
      const result = consumeMultipleSupplies(['supply_1', 'supply_1'], craftingState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('supply_1'); // Error mentions which supply failed
      expect(result.error).toContain('Item not found'); // First consume removes it
      // Should rollback to original state
      expect(result.newState.inventory).toHaveLength(1);
    });

    it('should handle same effect type stacking from multiple supplies', () => {
      // Two trail rations for -40% expedition time
      const supply1: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations', // -20% time
        craftedAt: Date.now(),
      };
      const supply2: CraftedItem = {
        id: 'supply_2',
        itemId: 'trail_rations', // -20% time
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply1, supply2);

      const result = consumeMultipleSupplies(['supply_1', 'supply_2'], craftingState);

      expect(result.success).toBe(true);
      expect(result.effects).toHaveLength(2);
      expect(result.newState.inventory).toHaveLength(0);

      // Both effects should be returned, stacking handled by combineSupplyEffects
      const combined = combineSupplyEffects(result.effects);
      expect(combined.expeditionTime).toBeCloseTo(0.4); // -40% time
    });
  });

  describe('combineSupplyEffects', () => {
    it('should combine effects of the same type additively', () => {
      const effects = [
        { effectType: 'expeditionTime' as const, effectValue: 0.2 },
        { effectType: 'expeditionTime' as const, effectValue: 0.1 },
        { effectType: 'expeditionRewards' as const, effectValue: 0.25 },
      ];

      const combined = combineSupplyEffects(effects);

      expect(combined.expeditionTime).toBeCloseTo(0.3);
      expect(combined.expeditionRewards).toBeCloseTo(0.25);
    });

    it('should return empty object for empty array', () => {
      const combined = combineSupplyEffects([]);
      expect(Object.keys(combined)).toHaveLength(0);
    });
  });

  describe('getAvailableSupplies', () => {
    it('should return only supply items from inventory', () => {
      const supply: CraftedItem = {
        id: 'supply_1',
        itemId: 'trail_rations',
        craftedAt: Date.now(),
      };
      const booster: CraftedItem = {
        id: 'booster_1',
        itemId: 'growth_serum',
        craftedAt: Date.now(),
      };
      const equipment: CraftedItem = {
        id: 'equip_1',
        itemId: 'farmers_gloves',
        craftedAt: Date.now(),
      };
      craftingState.inventory.push(supply, booster, equipment);

      const supplies = getAvailableSupplies(craftingState);
      expect(supplies).toHaveLength(1);
      expect(supplies[0].itemId).toBe('trail_rations');
    });
  });
});
