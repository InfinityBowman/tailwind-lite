/**
 * ProductionSystem Tests
 *
 * Tests for UI utility functions. Canonical production logic
 * (growth, exports, ticks) is tested in convex/lazyTick.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { getPlantSellValue, getAllPlantSellValues } from './ProductionSystem';
import { SEED_TYPES } from '../config/seeds';

describe('ProductionSystem', () => {
  describe('getPlantSellValue', () => {
    it('should return correct sell value for each plant type', () => {
      expect(getPlantSellValue('wheat')).toBe(1);
      expect(getPlantSellValue('corn')).toBe(2);
      expect(getPlantSellValue('cucumber')).toBe(6);
    });

    it('should return 0 for unknown plant type', () => {
      expect(getPlantSellValue('invalid')).toBe(0);
    });
  });

  describe('getAllPlantSellValues', () => {
    it('should return all plant sell values', () => {
      const values = getAllPlantSellValues();

      expect(values.wheat).toBe(1);
      expect(values.corn).toBe(2);
      expect(Object.keys(values).length).toBe(Object.keys(SEED_TYPES).length);
    });
  });
});
