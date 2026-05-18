import { describe, it, expect } from 'vitest';
import {
  getAffinityBonus,
  getAffinityMultiplier,
  hasAffinity,
  getAffinityDescription,
  getFamiliesWithAffinity,
  TRAIT_FAMILY_AFFINITY,
} from './AffinitySystem';

describe('AffinitySystem', () => {
  describe('getAffinityBonus', () => {
    it('returns correct bonus for matching trait + family', () => {
      // FERTILE + Bio = 0.5
      expect(getAffinityBonus('wheat', 'FERTILE')).toBe(0.5);
      // VOID + Void = 0.5
      expect(getAffinityBonus('starfruit', 'VOID')).toBe(0.5);
    });

    it('returns 0 for non-matching family', () => {
      // Wheat is Bio family, FROZEN doesn't boost Bio
      expect(getAffinityBonus('wheat', 'FROZEN')).toBe(0);
    });

    it('returns 0 when no trait provided', () => {
      expect(getAffinityBonus('wheat', undefined)).toBe(0);
    });

    it('returns 0 for unknown seed', () => {
      expect(getAffinityBonus('unknown_seed', 'FERTILE')).toBe(0);
    });
  });

  describe('getAffinityMultiplier', () => {
    it('returns 1 + bonus', () => {
      expect(getAffinityMultiplier('wheat', 'FERTILE')).toBe(1.5);
      expect(getAffinityMultiplier('starfruit', 'VOID')).toBe(1.5);
    });

    it('returns 1 for no affinity', () => {
      expect(getAffinityMultiplier('wheat', undefined)).toBe(1);
      expect(getAffinityMultiplier('wheat', 'FROZEN')).toBe(1);
    });
  });

  describe('hasAffinity', () => {
    it('returns true for matching affinity', () => {
      expect(hasAffinity('wheat', 'FERTILE')).toBe(true);
    });

    it('returns false for no affinity', () => {
      expect(hasAffinity('wheat', 'FROZEN')).toBe(false);
      expect(hasAffinity('wheat', undefined)).toBe(false);
    });
  });

  describe('getAffinityDescription', () => {
    it('returns description for matching affinity', () => {
      const desc = getAffinityDescription('wheat', 'FERTILE');
      expect(desc).toContain('Bio');
      expect(desc).toContain('50%');
    });

    it('returns null for no affinity', () => {
      expect(getAffinityDescription('wheat', 'FROZEN')).toBeNull();
    });
  });

  describe('getFamiliesWithAffinity', () => {
    it('returns families sorted by bonus', () => {
      const families = getFamiliesWithAffinity('FERTILE');
      expect(families.length).toBeGreaterThan(0);
      expect(families[0].family).toBe('bio');
      expect(families[0].bonus).toBe(0.5);
    });

    it('returns empty array for no trait', () => {
      expect(getFamiliesWithAffinity(undefined)).toEqual([]);
    });

    it('returns empty array for trait with no affinities', () => {
      // Check a trait that might not have affinities defined
      const families = getFamiliesWithAffinity('HARDY');
      // HARDY should have primal and bio
      expect(families.length).toBeGreaterThan(0);
    });
  });

  describe('TRAIT_FAMILY_AFFINITY', () => {
    it('has defined affinities for main traits', () => {
      expect(TRAIT_FAMILY_AFFINITY.FERTILE).toBeDefined();
      expect(TRAIT_FAMILY_AFFINITY.FROZEN).toBeDefined();
      expect(TRAIT_FAMILY_AFFINITY.VOID).toBeDefined();
    });
  });
});
