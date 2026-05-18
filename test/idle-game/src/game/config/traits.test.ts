/**
 * Traits Configuration Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TRAIT_DEFINITIONS,
  HIDDEN_RECIPES,
  getTraitsByRarity,
  calculateTraitProductionBonus,
  calculateTraitValueBonus,
  calculateTraitEssenceBonus,
  hasTraitEffect,
  checkRecipeRequirements,
  getTraitRarityColor,
  getMaxTraitsForTier,
} from './traits';

describe('Traits Config', () => {
  describe('TRAIT_DEFINITIONS', () => {
    it('should have all required traits defined', () => {
      expect(TRAIT_DEFINITIONS.FIRE).toBeDefined();
      expect(TRAIT_DEFINITIONS.WATER).toBeDefined();
      expect(TRAIT_DEFINITIONS.EARTH).toBeDefined();
      expect(TRAIT_DEFINITIONS.VOID).toBeDefined();
      expect(TRAIT_DEFINITIONS.GROWTH).toBeDefined();
      expect(TRAIT_DEFINITIONS.VALUE).toBeDefined();
      expect(TRAIT_DEFINITIONS.COSMIC).toBeDefined();
      expect(TRAIT_DEFINITIONS.ORIGIN).toBeDefined();
    });

    it('should have valid inherit chances (0-1)', () => {
      for (const trait of Object.values(TRAIT_DEFINITIONS)) {
        expect(trait.inheritChance).toBeGreaterThanOrEqual(0);
        expect(trait.inheritChance).toBeLessThanOrEqual(1);
      }
    });

    it('should have valid mutation chances (0-1)', () => {
      for (const trait of Object.values(TRAIT_DEFINITIONS)) {
        expect(trait.mutationChance).toBeGreaterThanOrEqual(0);
        expect(trait.mutationChance).toBeLessThanOrEqual(1);
      }
    });

    it('should have at least one effect per trait', () => {
      for (const trait of Object.values(TRAIT_DEFINITIONS)) {
        expect(trait.effects.length).toBeGreaterThan(0);
      }
    });

    it('should correctly identify legendary traits by rarity field', () => {
      // ORIGIN is the only legendary trait
      expect(TRAIT_DEFINITIONS.ORIGIN.rarity).toBe('legendary');

      // COSMIC is epic, NOT legendary (common mistake)
      expect(TRAIT_DEFINITIONS.COSMIC.rarity).toBe('epic');

      // Verify detection pattern: check rarity === 'legendary'
      const isLegendary = (traitId: string) =>
        TRAIT_DEFINITIONS[traitId as keyof typeof TRAIT_DEFINITIONS]?.rarity === 'legendary';

      expect(isLegendary('ORIGIN')).toBe(true);
      expect(isLegendary('COSMIC')).toBe(false);
      expect(isLegendary('FIRE')).toBe(false);
      expect(isLegendary('VOID')).toBe(false);
    });
  });

  describe('HIDDEN_RECIPES', () => {
    it('should have recipes defined', () => {
      expect(HIDDEN_RECIPES.length).toBeGreaterThan(0);
    });

    it('should reference valid traits', () => {
      for (const recipe of HIDDEN_RECIPES) {
        for (const traitId of recipe.requiredTraits) {
          expect(TRAIT_DEFINITIONS[traitId]).toBeDefined();
        }
        expect(TRAIT_DEFINITIONS[recipe.resultTrait]).toBeDefined();
      }
    });

    it('should have valid chances (0-1)', () => {
      for (const recipe of HIDDEN_RECIPES) {
        expect(recipe.chance).toBeGreaterThan(0);
        expect(recipe.chance).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getTraitsByRarity', () => {
    it('should return common traits', () => {
      const common = getTraitsByRarity('common');
      expect(common.length).toBeGreaterThan(0);
      expect(common.every(t => t.rarity === 'common')).toBe(true);
    });

    it('should return uncommon traits', () => {
      const uncommon = getTraitsByRarity('uncommon');
      expect(uncommon.length).toBeGreaterThan(0);
      expect(uncommon.every(t => t.rarity === 'uncommon')).toBe(true);
    });

    it('should return rare traits', () => {
      const rare = getTraitsByRarity('rare');
      expect(rare.length).toBeGreaterThan(0);
      expect(rare.every(t => t.rarity === 'rare')).toBe(true);
    });

    it('should include legendary ORIGIN trait', () => {
      const legendary = getTraitsByRarity('legendary');
      expect(legendary.some(t => t.id === 'ORIGIN')).toBe(true);
    });
  });

  describe('calculateTraitProductionBonus', () => {
    it('should return 0 for empty traits', () => {
      expect(calculateTraitProductionBonus([], 'greenPlanet')).toBe(0);
    });

    it('should calculate global production bonus', () => {
      const bonus = calculateTraitProductionBonus(['GROWTH'], 'greenPlanet');
      expect(bonus).toBe(0.15);
    });

    it('should calculate planet-specific bonus', () => {
      const bonus = calculateTraitProductionBonus(['EARTH'], 'greenPlanet');
      expect(bonus).toBe(0.2);
    });

    it('should not apply planet bonus to wrong planet', () => {
      const bonus = calculateTraitProductionBonus(['EARTH'], 'redPlanet');
      expect(bonus).toBe(0);
    });

    it('should stack multiple bonuses', () => {
      const bonus = calculateTraitProductionBonus(['GROWTH', 'ABUNDANT'], 'greenPlanet');
      expect(bonus).toBe(0.15 + 0.3);
    });

    it('should combine global and planet bonuses', () => {
      const bonus = calculateTraitProductionBonus(['GROWTH', 'FIRE'], 'redPlanet');
      expect(bonus).toBe(0.15 + 0.2);
    });

    it('should handle invalid trait IDs gracefully', () => {
      // Cast to bypass TypeScript, simulating bad data from save
      const invalidTrait = 'NONEXISTENT' as any;
      // Should not throw, should skip invalid trait
      expect(() => calculateTraitProductionBonus([invalidTrait], 'greenPlanet')).not.toThrow();
      expect(calculateTraitProductionBonus([invalidTrait], 'greenPlanet')).toBe(0);
    });

    it('should calculate valid traits even with invalid ones mixed in', () => {
      const invalidTrait = 'NONEXISTENT' as any;
      const bonus = calculateTraitProductionBonus([invalidTrait, 'GROWTH'], 'greenPlanet');
      expect(bonus).toBe(0.15); // Only GROWTH bonus
    });
  });

  describe('calculateTraitValueBonus', () => {
    it('should return 0 for empty traits', () => {
      expect(calculateTraitValueBonus([])).toBe(0);
    });

    it('should calculate value bonus', () => {
      expect(calculateTraitValueBonus(['VALUE'])).toBe(0.15);
    });

    it('should stack value bonuses', () => {
      // COSMIC has 0.25 value bonus
      expect(calculateTraitValueBonus(['VALUE', 'COSMIC'])).toBe(0.15 + 0.25);
    });
  });

  describe('calculateTraitEssenceBonus', () => {
    it('should return 0 for empty traits', () => {
      expect(calculateTraitEssenceBonus([])).toBe(0);
    });

    it('should calculate essence bonus', () => {
      expect(calculateTraitEssenceBonus(['ANCIENT'])).toBe(0.5);
    });

    it('should stack essence bonuses', () => {
      expect(calculateTraitEssenceBonus(['ANCIENT', 'COSMIC'])).toBe(0.5 + 0.25);
    });
  });

  describe('hasTraitEffect', () => {
    it('should return false for empty traits', () => {
      expect(hasTraitEffect([], 'GACHA_LUCK')).toBe(false);
    });

    it('should find existing effect', () => {
      expect(hasTraitEffect(['LUCKY'], 'GACHA_LUCK')).toBe(true);
    });

    it('should not find missing effect', () => {
      expect(hasTraitEffect(['GROWTH'], 'GACHA_LUCK')).toBe(false);
    });

    it('should find prestige persist effect', () => {
      expect(hasTraitEffect(['ORIGIN'], 'PRESTIGE_PERSIST')).toBe(true);
    });
  });

  describe('checkRecipeRequirements', () => {
    it('should return false if missing traits', () => {
      const recipe = HIDDEN_RECIPES.find(r => r.id === 'cosmic_creation')!;
      expect(checkRecipeRequirements(['FIRE', 'WATER'], recipe)).toBe(false);
    });

    it('should return true if all traits present', () => {
      const recipe = HIDDEN_RECIPES.find(r => r.id === 'cosmic_creation')!;
      expect(checkRecipeRequirements(['FIRE', 'WATER', 'EARTH', 'VOID'], recipe)).toBe(true);
    });

    it('should work with extra traits', () => {
      const recipe = HIDDEN_RECIPES.find(r => r.id === 'cosmic_creation')!;
      expect(checkRecipeRequirements(['FIRE', 'WATER', 'EARTH', 'VOID', 'GROWTH'], recipe)).toBe(
        true
      );
    });
  });

  describe('getTraitRarityColor', () => {
    it('should return gray for common', () => {
      expect(getTraitRarityColor('common')).toBe('#9CA3AF');
    });

    it('should return green for uncommon', () => {
      expect(getTraitRarityColor('uncommon')).toBe('#22C55E');
    });

    it('should return blue for rare', () => {
      expect(getTraitRarityColor('rare')).toBe('#3B82F6');
    });

    it('should return purple for epic', () => {
      expect(getTraitRarityColor('epic')).toBe('#A855F7');
    });

    it('should return gold for legendary', () => {
      expect(getTraitRarityColor('legendary')).toBe('#FFD700');
    });
  });

  describe('getMaxTraitsForTier', () => {
    it('should return 1 for tier 0-1', () => {
      expect(getMaxTraitsForTier(0)).toBe(1);
      expect(getMaxTraitsForTier(1)).toBe(1);
    });

    it('should return 2 for tier 2-3', () => {
      expect(getMaxTraitsForTier(2)).toBe(2);
      expect(getMaxTraitsForTier(3)).toBe(2);
    });

    it('should return 3 for tier 4-5', () => {
      expect(getMaxTraitsForTier(4)).toBe(3);
      expect(getMaxTraitsForTier(5)).toBe(3);
    });

    it('should return 4 for tier 6', () => {
      expect(getMaxTraitsForTier(6)).toBe(4);
    });
  });
});
