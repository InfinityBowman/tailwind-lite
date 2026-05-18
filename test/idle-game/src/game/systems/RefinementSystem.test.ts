/**
 * Refinement System Tests
 */

import { describe, it, expect } from 'vitest';
import { getRefinementPreviews } from './RefinementSystem';

describe('RefinementSystem', () => {
  describe('getRefinementPreviews', () => {
    it('should return previews for available plants', () => {
      const plants = {
        wheat: 25,
        corn: 16,
        potato: 5, // Not enough for potato (needs 6)
      };

      const previews = getRefinementPreviews(plants);

      expect(previews.length).toBe(3); // All 3 appear in preview

      const wheatPreview = previews.find(p => p.plantType === 'wheat');
      expect(wheatPreview).toBeDefined();
      expect(wheatPreview!.maxBatches).toBe(2);
      expect(wheatPreview!.maxOutput).toBe(2);

      const cornPreview = previews.find(p => p.plantType === 'corn');
      expect(cornPreview).toBeDefined();
      expect(cornPreview!.maxBatches).toBe(2);
    });

    it('should apply efficiency bonus to preview', () => {
      const plants = { wheat: 100 };
      const previews = getRefinementPreviews(plants, 0.5); // 50% bonus

      const wheatPreview = previews.find(p => p.plantType === 'wheat');
      // 10 batches * 1 output * 1.5 = 15
      expect(wheatPreview!.maxOutput).toBe(15);
    });

    it('should sort by max output descending', () => {
      const plants = {
        wheat: 10, // 1 batch = 1 output
        cucumber: 6, // 2 batches = 2 output
      };

      const previews = getRefinementPreviews(plants);
      expect(previews[0].plantType).toBe('cucumber');
    });
  });
});
