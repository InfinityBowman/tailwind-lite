/**
 * ExtractSystem Tests
 * Tests for plant extraction and extract inventory management
 */

import { describe, it, expect } from 'vitest';
import {
  canExtract,
  extract,
  extractAll,
  getExtractionPreview,
  getAllExtractionPreviews,
  calculateExtractValue,
  hasExtractsForRecipe,
  deductExtractsForRecipe,
  createInitialExtractState,
} from './ExtractSystem';
import { createInitialExtractInventory } from '../config/extracts';

describe('ExtractSystem', () => {
  describe('canExtract', () => {
    it('should return false for unknown plant type', () => {
      const result = canExtract('unknown_plant', 100);
      expect(result.canExtract).toBe(false);
      expect(result.reason).toContain('No extraction recipe');
      expect(result.maxExtracts).toBe(0);
    });

    it('should return false when not enough plants', () => {
      // Wheat needs 20 plants per extract
      const result = canExtract('wheat', 15);
      expect(result.canExtract).toBe(false);
      expect(result.reason).toContain('Need at least 20');
      expect(result.maxExtracts).toBe(0);
    });

    it('should return true with exact amount', () => {
      const result = canExtract('wheat', 20);
      expect(result.canExtract).toBe(true);
      expect(result.maxExtracts).toBe(1);
    });

    it('should calculate correct max extracts', () => {
      // 100 wheat / 20 per extract = 5 extracts
      const result = canExtract('wheat', 100);
      expect(result.canExtract).toBe(true);
      expect(result.maxExtracts).toBe(5);
    });

    it('should work with different plant types and conversion rates', () => {
      // Starfruit needs only 3 plants per extract
      const result = canExtract('starfruit', 10);
      expect(result.canExtract).toBe(true);
      expect(result.maxExtracts).toBe(3); // 10 / 3 = 3 (floor)
    });

    it('should reject negative plant amounts', () => {
      const result = canExtract('wheat', -100);
      expect(result.canExtract).toBe(false);
      expect(result.reason).toBe('Invalid plant amount');
    });

    it('should reject NaN plant amounts', () => {
      const result = canExtract('wheat', NaN);
      expect(result.canExtract).toBe(false);
      expect(result.reason).toBe('Invalid plant amount');
    });

    it('should reject Infinity plant amounts', () => {
      const result = canExtract('wheat', Infinity);
      expect(result.canExtract).toBe(false);
      expect(result.reason).toBe('Invalid plant amount');
    });
  });

  describe('extract', () => {
    it('should fail for unknown plant type', () => {
      const result = extract('unknown_plant', 100, 1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No extraction recipe');
    });

    it('should fail when not enough plants', () => {
      const result = extract('wheat', 10, 1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Need at least 20');
    });

    it('should successfully extract with exact amount', () => {
      const result = extract('wheat', 20, 1);
      expect(result.success).toBe(true);
      expect(result.extractType).toBe('grain');
      expect(result.extractsGained).toBe(1);
      expect(result.plantsUsed).toBe(20);
      expect(result.newPlantAmount).toBe(0);
    });

    it('should extract multiple batches', () => {
      const result = extract('wheat', 100, 3);
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(3);
      expect(result.plantsUsed).toBe(60); // 3 * 20
      expect(result.newPlantAmount).toBe(40);
    });

    it('should extract max when "max" is specified', () => {
      const result = extract('wheat', 100, 'max');
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(5);
      expect(result.plantsUsed).toBe(100);
      expect(result.newPlantAmount).toBe(0);
    });

    it('should cap at available plants when requesting more than possible', () => {
      const result = extract('wheat', 50, 10);
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(2); // Only 2 possible
      expect(result.plantsUsed).toBe(40);
      expect(result.newPlantAmount).toBe(10);
    });

    it('should apply efficiency bonus', () => {
      const result = extract('wheat', 100, 5, 0.5); // 50% bonus
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(7); // 5 base + 2 bonus (floor of 2.5)
    });

    it('should return correct extract type for each plant', () => {
      expect(extract('wheat', 20, 1).extractType).toBe('grain');
      expect(extract('corn', 15, 1).extractType).toBe('starch');
      expect(extract('potato', 12, 1).extractType).toBe('tuber');
      expect(extract('carrot', 10, 1).extractType).toBe('root');
      expect(extract('tomato', 10, 1).extractType).toBe('vine');
      expect(extract('cucumber', 8, 1).extractType).toBe('hydro');
      expect(extract('rice', 12, 1).extractType).toBe('kernel');
      expect(extract('soybean', 8, 1).extractType).toBe('protein');
      expect(extract('pumpkin', 5, 1).extractType).toBe('harvest');
      expect(extract('starfruit', 3, 1).extractType).toBe('stellar');
    });

    it('should fail with invalid batch count', () => {
      const result = extract('wheat', 100, 0);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid extraction amount');
    });

    // New edge case tests
    it('should handle fractional plant amounts', () => {
      const result = extract('wheat', 20.9, 1);
      expect(result.success).toBe(true);
      expect(result.plantsUsed).toBe(20);
      expect(result.newPlantAmount).toBeCloseTo(0.9);
    });

    it('should reject negative plant amounts', () => {
      const result = extract('wheat', -100, 1);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid plant amount');
    });

    it('should reject NaN amount parameter', () => {
      const result = extract('wheat', 100, NaN);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid extraction amount');
    });

    it('should reject Infinity amount parameter', () => {
      const result = extract('wheat', 100, Infinity);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid extraction amount');
    });

    it('should reject negative amount parameter', () => {
      const result = extract('wheat', 100, -5);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid extraction amount');
    });

    it('should handle large efficiency bonuses', () => {
      const result = extract('wheat', 100, 5, 10.0); // 1000% bonus
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(55); // 5 base + 50 bonus
    });

    it('should floor fractional amount parameters', () => {
      const result = extract('wheat', 100, 2.9);
      expect(result.success).toBe(true);
      expect(result.extractsGained).toBe(2); // Floored to 2
      expect(result.plantsUsed).toBe(40);
    });
  });

  describe('extractAll', () => {
    it('should extract all plants at once', () => {
      const plants = {
        wheat: 100,
        corn: 45,
        starfruit: 9,
      };

      const result = extractAll(plants);

      expect(result.totalExtractsGained.grain).toBe(5); // 100/20 = 5
      expect(result.totalExtractsGained.starch).toBe(3); // 45/15 = 3
      expect(result.totalExtractsGained.stellar).toBe(3); // 9/3 = 3

      expect(result.updatedPlants.wheat).toBe(0);
      expect(result.updatedPlants.corn).toBe(0);
      expect(result.updatedPlants.starfruit).toBe(0);

      expect(result.breakdown.length).toBe(3);
    });

    it('should skip plants with zero or negative amounts', () => {
      const plants = {
        wheat: 100,
        corn: 0,
        potato: -10,
      };

      const result = extractAll(plants);

      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].plantType).toBe('wheat');
    });

    it('should apply efficiency bonus to all extractions', () => {
      const plants = { wheat: 100 };
      const result = extractAll(plants, 0.5); // 50% bonus

      expect(result.totalExtractsGained.grain).toBe(7); // 5 base + 2 bonus
    });

    it('should handle empty plant record', () => {
      const result = extractAll({});

      expect(result.breakdown.length).toBe(0);
      expect(result.totalExtractsGained.grain).toBe(0);
    });

    it('should leave remainders in updatedPlants', () => {
      const plants = { wheat: 55 }; // 55/20 = 2 extracts, 15 remainder

      const result = extractAll(plants);

      expect(result.totalExtractsGained.grain).toBe(2);
      expect(result.updatedPlants.wheat).toBe(15);
    });
  });

  describe('getExtractionPreview', () => {
    it('should return null for unknown plant type', () => {
      const extracts = createInitialExtractInventory();
      const result = getExtractionPreview('unknown', 100, extracts);
      expect(result).toBeNull();
    });

    it('should return correct preview data', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 10;

      const preview = getExtractionPreview('wheat', 100, extracts);
      expect(preview).not.toBeNull();
      expect(preview!.plantType).toBe('wheat');
      expect(preview!.extractType).toBe('grain');
      expect(preview!.availablePlants).toBe(100);
      expect(preview!.plantsPerExtract).toBe(20);
      expect(preview!.maxExtracts).toBe(5);
      expect(preview!.currentExtractAmount).toBe(10);
    });
  });

  describe('getAllExtractionPreviews', () => {
    it('should return empty array when no plants', () => {
      const extracts = createInitialExtractInventory();
      const previews = getAllExtractionPreviews({}, extracts);
      expect(previews).toEqual([]);
    });

    it('should return previews for all available plants', () => {
      const extracts = createInitialExtractInventory();
      const plantAmounts = {
        wheat: 100,
        corn: 50,
        potato: 0, // Should be skipped
        starfruit: 10,
      };

      const previews = getAllExtractionPreviews(plantAmounts, extracts);
      expect(previews.length).toBe(3);
      expect(previews.map(p => p.plantType)).toContain('wheat');
      expect(previews.map(p => p.plantType)).toContain('corn');
      expect(previews.map(p => p.plantType)).toContain('starfruit');
    });
  });

  describe('calculateExtractValue', () => {
    it('should return 0 for empty inventory', () => {
      const extracts = createInitialExtractInventory();
      expect(calculateExtractValue(extracts)).toBe(0);
    });

    it('should calculate value based on rarity', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 10; // common (x1) = 10
      extracts.hydro = 5; // uncommon (x2) = 10
      extracts.stellar = 2; // rare (x3) = 6

      expect(calculateExtractValue(extracts)).toBe(26);
    });

    it('should skip zero and negative amounts', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 0;
      extracts.starch = -5; // Edge case, shouldn't happen but should handle
      extracts.stellar = 2;

      expect(calculateExtractValue(extracts)).toBe(6); // Just stellar (2*3)
    });
  });

  describe('hasExtractsForRecipe', () => {
    it('should return true when all extracts available', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 20;
      extracts.root = 10;

      const recipe = { grain: 10, root: 5 };
      const result = hasExtractsForRecipe(extracts, recipe);

      expect(result.hasEnough).toBe(true);
      expect(result.missing).toEqual({});
    });

    it('should return false with missing extracts', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 5;
      extracts.root = 10;

      const recipe = { grain: 10, root: 5 };
      const result = hasExtractsForRecipe(extracts, recipe);

      expect(result.hasEnough).toBe(false);
      expect(result.missing).toEqual({ grain: 5 });
    });

    it('should return all missing extracts', () => {
      const extracts = createInitialExtractInventory();

      const recipe = { grain: 10, stellar: 5 };
      const result = hasExtractsForRecipe(extracts, recipe);

      expect(result.hasEnough).toBe(false);
      expect(result.missing).toEqual({ grain: 10, stellar: 5 });
    });
  });

  describe('deductExtractsForRecipe', () => {
    it('should deduct correct amounts', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 20;
      extracts.root = 10;

      const recipe = { grain: 10, root: 5 };
      const newExtracts = deductExtractsForRecipe(extracts, recipe);

      expect(newExtracts.grain).toBe(10);
      expect(newExtracts.root).toBe(5);
      // Original should be unchanged
      expect(extracts.grain).toBe(20);
    });

    it('should throw error when insufficient extracts', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 5;

      const recipe = { grain: 10 };

      expect(() => deductExtractsForRecipe(extracts, recipe)).toThrow('Insufficient extracts');
    });

    it('should throw error with details of missing extracts', () => {
      const extracts = createInitialExtractInventory();
      extracts.grain = 5;
      extracts.stellar = 1;

      const recipe = { grain: 10, stellar: 5 };

      expect(() => deductExtractsForRecipe(extracts, recipe)).toThrow('5 grain');
      expect(() => deductExtractsForRecipe(extracts, recipe)).toThrow('4 stellar');
    });
  });

  describe('createInitialExtractState', () => {
    it('should create state with all zero extracts', () => {
      const state = createInitialExtractState();
      expect(state.extracts.grain).toBe(0);
      expect(state.extracts.stellar).toBe(0);
      expect(Object.keys(state.extracts).length).toBe(10);
    });
  });
});
