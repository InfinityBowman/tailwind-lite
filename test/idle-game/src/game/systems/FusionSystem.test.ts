/**
 * FusionSystem Tests
 */

import { describe, it, expect } from 'vitest';
import { getFusionEssenceCost } from './FusionSystem';
import { MAX_SEED_TIER, SEED_TIERS } from '../config/balance';

describe('FusionSystem', () => {
  describe('getFusionEssenceCost', () => {
    it('should return cost based on target tier (current + 1)', () => {
      // Fusing tier 0 seeds gives tier 1 seed - tier 1 has essenceCost 0
      expect(getFusionEssenceCost(0)).toBe(SEED_TIERS[1].essenceCost);
      // Fusing tier 1 seeds gives tier 2 seed - tier 2 has essenceCost 10
      expect(getFusionEssenceCost(1)).toBe(SEED_TIERS[2].essenceCost);
    });

    it('should return the configured cost for higher tiers', () => {
      expect(getFusionEssenceCost(2)).toBe(SEED_TIERS[3].essenceCost);
    });

    it('should return Infinity for max tier', () => {
      expect(getFusionEssenceCost(MAX_SEED_TIER)).toBe(Infinity);
    });
  });
});
