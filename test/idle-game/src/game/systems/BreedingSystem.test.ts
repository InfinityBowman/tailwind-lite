/**
 * Breeding System Tests
 */

import { describe, it, expect } from 'vitest';
import { type TraitId } from '../config/traits';
import {
  createInitialBreedingState,
  canStartBreeding,
  calculateBreedingDuration,
  startBreeding,
  isBreedingComplete,
  getBreedingProgress,
  collectParentTraits,
  rollTraitInheritance,
  rollTraitMutations,
  checkForRecipeDiscovery,
  completeBreeding,
  placeSeedInSlot,
  removeSeedFromSlot,
  cancelBreeding,
  formatBreedingTimeRemaining,
  SeedWithTraits,
  BREEDING_DURATION_BASE_MS,
  BREEDING_DURATION_PER_TIER_MS,
} from './BreedingSystem';

// Helper to create test seeds
function createTestSeed(overrides: Partial<SeedWithTraits> = {}): SeedWithTraits {
  return {
    instanceId: 'test-seed-' + Math.random(),
    type: 'wheat',
    tier: 3,
    traits: [],
    ...overrides,
  };
}

describe('BreedingSystem', () => {
  describe('createInitialBreedingState', () => {
    it('should create empty breeding state', () => {
      const state = createInitialBreedingState();

      expect(state.slots[0].seed).toBeNull();
      expect(state.slots[1].seed).toBeNull();
      expect(state.isBreeding).toBe(false);
      expect(state.discoveredRecipes).toEqual([]);
    });
  });

  describe('canStartBreeding', () => {
    it('should return false with empty slots', () => {
      const state = createInitialBreedingState();
      expect(canStartBreeding(state)).toBe(false);
    });

    it('should return false with only one seed', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      expect(canStartBreeding(state)).toBe(false);
    });

    it('should return true with both seeds', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      state = placeSeedInSlot(state, 1, createTestSeed());
      expect(canStartBreeding(state)).toBe(true);
    });

    it('should return false while breeding', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      state = placeSeedInSlot(state, 1, createTestSeed());
      state = startBreeding(state);
      expect(canStartBreeding(state)).toBe(false);
    });
  });

  describe('calculateBreedingDuration', () => {
    it('should calculate base duration for tier 0', () => {
      const parent1 = createTestSeed({ tier: 0 });
      const parent2 = createTestSeed({ tier: 0 });

      const duration = calculateBreedingDuration(parent1, parent2);
      expect(duration).toBe(BREEDING_DURATION_BASE_MS);
    });

    it('should increase duration with tier', () => {
      const parent1 = createTestSeed({ tier: 4 });
      const parent2 = createTestSeed({ tier: 4 });

      const duration = calculateBreedingDuration(parent1, parent2);
      const expected = BREEDING_DURATION_BASE_MS + 4 * BREEDING_DURATION_PER_TIER_MS;
      expect(duration).toBe(expected);
    });

    it('should average parent tiers', () => {
      const parent1 = createTestSeed({ tier: 2 });
      const parent2 = createTestSeed({ tier: 6 });

      const duration = calculateBreedingDuration(parent1, parent2);
      const avgTier = (2 + 6) / 2;
      const expected = BREEDING_DURATION_BASE_MS + avgTier * BREEDING_DURATION_PER_TIER_MS;
      expect(duration).toBe(expected);
    });
  });

  describe('startBreeding', () => {
    it('should start breeding with both seeds', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      state = placeSeedInSlot(state, 1, createTestSeed());

      const now = Date.now();
      state = startBreeding(state, now);

      expect(state.isBreeding).toBe(true);
      expect(state.slots[0].startTime).toBe(now);
      expect(state.slots[0].endTime).toBeGreaterThan(now);
    });

    it('should not start without seeds', () => {
      const state = createInitialBreedingState();
      const newState = startBreeding(state);

      expect(newState.isBreeding).toBe(false);
    });
  });

  describe('isBreedingComplete', () => {
    it('should return false when not breeding', () => {
      const state = createInitialBreedingState();
      expect(isBreedingComplete(state)).toBe(false);
    });

    it('should return false during breeding', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      expect(isBreedingComplete(state, now)).toBe(false);
    });

    it('should return true after breeding time', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      const afterComplete = now + BREEDING_DURATION_BASE_MS + 1000;
      expect(isBreedingComplete(state, afterComplete)).toBe(true);
    });
  });

  describe('getBreedingProgress', () => {
    it('should return 0 when not breeding', () => {
      const state = createInitialBreedingState();
      expect(getBreedingProgress(state)).toBe(0);
    });

    it('should return 0 at start', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      expect(getBreedingProgress(state, now)).toBe(0);
    });

    it('should return 0.5 at midpoint', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      const midpoint = now + BREEDING_DURATION_BASE_MS / 2;
      expect(getBreedingProgress(state, midpoint)).toBeCloseTo(0.5, 1);
    });

    it('should return 1 at completion', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      const end = now + BREEDING_DURATION_BASE_MS;
      expect(getBreedingProgress(state, end)).toBe(1);
    });
  });

  describe('collectParentTraits', () => {
    it('should combine traits from both parents', () => {
      const parent1 = createTestSeed({ traits: ['FIRE', 'GROWTH'] });
      const parent2 = createTestSeed({ traits: ['WATER', 'VALUE'] });

      const traits = collectParentTraits(parent1, parent2);

      expect(traits).toContain('FIRE');
      expect(traits).toContain('GROWTH');
      expect(traits).toContain('WATER');
      expect(traits).toContain('VALUE');
      expect(traits.length).toBe(4);
    });

    it('should deduplicate shared traits', () => {
      const parent1 = createTestSeed({ traits: ['FIRE', 'GROWTH'] });
      const parent2 = createTestSeed({ traits: ['FIRE', 'VALUE'] });

      const traits = collectParentTraits(parent1, parent2);

      expect(traits.filter(t => t === 'FIRE').length).toBe(1);
      expect(traits.length).toBe(3);
    });

    it('should return empty for parents without traits', () => {
      const parent1 = createTestSeed({ traits: [] });
      const parent2 = createTestSeed({ traits: [] });

      const traits = collectParentTraits(parent1, parent2);
      expect(traits.length).toBe(0);
    });
  });

  describe('rollTraitInheritance', () => {
    it('should inherit traits based on inherit chance', () => {
      // Always inherit (rng returns 0, less than any inherit chance)
      const inherited = rollTraitInheritance(['FIRE'], 4, () => 0);
      expect(inherited).toContain('FIRE');
    });

    it('should not inherit when rng exceeds inherit chance', () => {
      // Never inherit (rng returns 1, greater than any inherit chance)
      const inherited = rollTraitInheritance(['FIRE'], 4, () => 1);
      expect(inherited).not.toContain('FIRE');
    });

    it('should respect max traits limit', () => {
      const manyTraits: TraitId[] = ['FIRE', 'WATER', 'EARTH', 'VOID', 'GROWTH'];
      const inherited = rollTraitInheritance(manyTraits, 2, () => 0);
      expect(inherited.length).toBeLessThanOrEqual(2);
    });
  });

  describe('rollTraitMutations', () => {
    it('should not add mutations with low rng', () => {
      // rng above mutation chances
      const mutations = rollTraitMutations([], 4, () => 1);
      expect(mutations.length).toBe(0);
    });

    it('should respect available trait slots', () => {
      const currentTraits: TraitId[] = ['FIRE', 'WATER', 'EARTH', 'VOID'];
      const mutations = rollTraitMutations(currentTraits, 4, () => 0);
      expect(mutations.length).toBe(0);
    });

    it('should not duplicate existing traits', () => {
      const mutations = rollTraitMutations(['FIRE'], 4, () => 0);
      expect(mutations).not.toContain('FIRE');
    });

    it('should never mutate ORIGIN trait', () => {
      // Even with rng=0, ORIGIN should not appear
      const mutations = rollTraitMutations([], 4, () => 0);
      expect(mutations).not.toContain('ORIGIN');
    });
  });

  describe('checkForRecipeDiscovery', () => {
    it('should not discover without required traits', () => {
      const recipe = checkForRecipeDiscovery(['FIRE'], [], () => 0);
      expect(recipe).toBeNull();
    });

    it('should discover cosmic recipe with all elements', () => {
      const parentTraits: TraitId[] = ['FIRE', 'WATER', 'EARTH', 'VOID'];
      const recipe = checkForRecipeDiscovery(parentTraits, [], () => 0);
      expect(recipe).not.toBeNull();
      expect(recipe!.id).toBe('cosmic_creation');
    });

    it('should not re-discover already found recipes', () => {
      const parentTraits: TraitId[] = ['FIRE', 'WATER', 'EARTH', 'VOID'];
      const recipe = checkForRecipeDiscovery(parentTraits, ['cosmic_creation'], () => 0);
      expect(recipe).toBeNull();
    });

    it('should respect recipe chance', () => {
      const parentTraits: TraitId[] = ['FIRE', 'WATER', 'EARTH', 'VOID'];
      // rng returns 0.99, higher than recipe chance (0.25)
      const recipe = checkForRecipeDiscovery(parentTraits, [], () => 0.99);
      expect(recipe).toBeNull();
    });
  });

  describe('completeBreeding', () => {
    it('should return null when not breeding', () => {
      const state = createInitialBreedingState();
      expect(completeBreeding(state)).toBeNull();
    });

    it('should handle corrupted state with null seeds gracefully', () => {
      // Force an invalid state where isBreeding is true but seeds are null
      const state = createInitialBreedingState();
      state.isBreeding = true; // Force invalid state
      // slots are still null

      // Should not crash, should return null
      const result = completeBreeding(state);
      expect(result).toBeNull();
    });

    it('should create child with correct tier', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 4 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 2 }));
      state = startBreeding(state);

      const result = completeBreeding(state, () => 0.5)!;
      // Child gets lower tier of parents
      expect(result.result.child.tier).toBe(2);
    });

    it('should reset breeding state after completion', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      state = placeSeedInSlot(state, 1, createTestSeed());
      state = startBreeding(state);

      const result = completeBreeding(state, () => 0.5)!;

      expect(result.newState.isBreeding).toBe(false);
      expect(result.newState.slots[0].seed).toBeNull();
      expect(result.newState.slots[1].seed).toBeNull();
    });

    it('should track discovered recipes', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ traits: ['FIRE', 'WATER'] }));
      state = placeSeedInSlot(state, 1, createTestSeed({ traits: ['EARTH', 'VOID'] }));
      state = startBreeding(state);

      // Force discovery (rng = 0)
      const result = completeBreeding(state, () => 0)!;

      if (result.result.discoveredRecipe) {
        expect(result.newState.discoveredRecipes).toContain(result.result.discoveredRecipe.id);
      }
    });
  });

  describe('placeSeedInSlot', () => {
    it('should place seed in slot 0', () => {
      const state = createInitialBreedingState();
      const seed = createTestSeed();
      const newState = placeSeedInSlot(state, 0, seed);

      expect(newState.slots[0].seed).toBe(seed);
      expect(newState.slots[1].seed).toBeNull();
    });

    it('should place seed in slot 1', () => {
      const state = createInitialBreedingState();
      const seed = createTestSeed();
      const newState = placeSeedInSlot(state, 1, seed);

      expect(newState.slots[0].seed).toBeNull();
      expect(newState.slots[1].seed).toBe(seed);
    });

    it('should not allow placement while breeding', () => {
      let state = createInitialBreedingState();
      const seed1 = createTestSeed();
      const seed2 = createTestSeed();
      state = placeSeedInSlot(state, 0, seed1);
      state = placeSeedInSlot(state, 1, seed2);
      state = startBreeding(state);

      const newSeed = createTestSeed();
      const newState = placeSeedInSlot(state, 0, newSeed);

      expect(newState.slots[0].seed).toBe(seed1); // Unchanged
    });
  });

  describe('removeSeedFromSlot', () => {
    it('should remove seed from slot', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed());
      state = removeSeedFromSlot(state, 0);

      expect(state.slots[0].seed).toBeNull();
    });

    it('should not allow removal while breeding', () => {
      let state = createInitialBreedingState();
      const seed = createTestSeed();
      state = placeSeedInSlot(state, 0, seed);
      state = placeSeedInSlot(state, 1, createTestSeed());
      state = startBreeding(state);

      const newState = removeSeedFromSlot(state, 0);

      expect(newState.slots[0].seed).toBe(seed); // Unchanged
    });
  });

  describe('cancelBreeding', () => {
    it('should stop breeding but keep seeds', () => {
      let state = createInitialBreedingState();
      const seed1 = createTestSeed();
      const seed2 = createTestSeed();
      state = placeSeedInSlot(state, 0, seed1);
      state = placeSeedInSlot(state, 1, seed2);
      state = startBreeding(state);

      const cancelled = cancelBreeding(state);

      expect(cancelled.isBreeding).toBe(false);
      expect(cancelled.slots[0].seed).toBe(seed1);
      expect(cancelled.slots[1].seed).toBe(seed2);
      expect(cancelled.slots[0].startTime).toBeNull();
      expect(cancelled.slots[0].endTime).toBeNull();
    });

    it('should do nothing if not breeding', () => {
      const state = createInitialBreedingState();
      const cancelled = cancelBreeding(state);

      expect(cancelled).toEqual(state);
    });
  });

  describe('formatBreedingTimeRemaining', () => {
    it('should return empty string when not breeding', () => {
      const state = createInitialBreedingState();
      expect(formatBreedingTimeRemaining(state)).toBe('');
    });

    it('should format hours and minutes', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      const formatted = formatBreedingTimeRemaining(state, now);
      expect(formatted).toMatch(/\d+h \d+m/);
    });

    it('should format minutes and seconds for short times', () => {
      let state = createInitialBreedingState();
      state = placeSeedInSlot(state, 0, createTestSeed({ tier: 0 }));
      state = placeSeedInSlot(state, 1, createTestSeed({ tier: 0 }));

      const now = Date.now();
      state = startBreeding(state, now);

      // Check near the end
      const nearEnd = state.slots[0].endTime! - 5 * 60 * 1000; // 5 minutes before end
      const formatted = formatBreedingTimeRemaining(state, nearEnd);
      expect(formatted).toMatch(/\d+m \d+s/);
    });
  });
});
