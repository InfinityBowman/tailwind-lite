/**
 * SeedexSystem Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialSeedexState,
  recordSeedDiscovery,
  getAvailableRewards,
  claimReward,
  getCompletionPercentage,
  getTierCompletionStats,
  SEEDEX_REWARDS,
  type SeedexState,
} from './SeedexSystem';
import { ALL_SEED_IDS, SEED_TYPES } from '../config/seeds';

describe('SeedexSystem', () => {
  let state: SeedexState;

  beforeEach(() => {
    state = createInitialSeedexState();
  });

  describe('createInitialSeedexState', () => {
    it('should create initial state with all seeds undiscovered', () => {
      expect(state.totalDiscovered).toBe(0);
      expect(state.totalPossible).toBe(ALL_SEED_IDS.length);
      expect(state.claimedRewards).toEqual([]);

      // All entries should exist and be undiscovered
      for (const seedId of ALL_SEED_IDS) {
        expect(state.entries[seedId]).toBeDefined();
        expect(state.entries[seedId].discovered).toBe(false);
        expect(state.entries[seedId].highestTier).toBe(0);
      }
    });

    it('should initialize family progress correctly', () => {
      const families = ['bio', 'solar', 'lunar', 'crystal', 'primal', 'void'] as const;

      for (const family of families) {
        expect(state.familyProgress[family]).toBeDefined();
        expect(state.familyProgress[family].discovered).toBe(0);
        expect(state.familyProgress[family].complete).toBe(false);
      }
    });
  });

  describe('recordSeedDiscovery', () => {
    it('should mark seed as discovered on first acquisition', () => {
      const result = recordSeedDiscovery(state, 'wheat', 1);

      expect(result.isNewSeed).toBe(true);
      expect(result.isNewTier).toBe(true);
      expect(result.newHighestTier).toBe(true);
      expect(state.entries['wheat'].discovered).toBe(true);
      expect(state.entries['wheat'].highestTier).toBe(1);
      expect(state.totalDiscovered).toBe(1);
    });

    it('should not count as new seed on subsequent discovery', () => {
      recordSeedDiscovery(state, 'wheat', 1);
      const result = recordSeedDiscovery(state, 'wheat', 1);

      expect(result.isNewSeed).toBe(false);
      expect(result.isNewTier).toBe(false);
      expect(state.totalDiscovered).toBe(1);
    });

    it('should track new tier discoveries', () => {
      recordSeedDiscovery(state, 'wheat', 1);
      const result = recordSeedDiscovery(state, 'wheat', 2);

      expect(result.isNewSeed).toBe(false);
      expect(result.isNewTier).toBe(true);
      expect(result.newHighestTier).toBe(true);
      expect(state.entries['wheat'].highestTier).toBe(2);
    });

    it('should not update highest tier for lower tier discoveries', () => {
      recordSeedDiscovery(state, 'wheat', 3);
      const result = recordSeedDiscovery(state, 'wheat', 1);

      expect(result.newHighestTier).toBe(false);
      expect(state.entries['wheat'].highestTier).toBe(3);
      expect(result.isNewTier).toBe(true); // Still a new tier discovery
    });

    it('should update family progress', () => {
      // Wheat is bio family
      recordSeedDiscovery(state, 'wheat', 1);
      expect(state.familyProgress['bio'].discovered).toBe(1);
      expect(state.familyProgress['bio'].complete).toBe(false);
    });

    it('should mark family as complete when all seeds discovered', () => {
      // Discover all bio family seeds
      const bioSeeds = ALL_SEED_IDS.filter(id => SEED_TYPES[id].family === 'bio');
      for (const seedId of bioSeeds) {
        recordSeedDiscovery(state, seedId, 1);
      }

      expect(state.familyProgress['bio'].complete).toBe(true);
    });

    it('should record tier discovery timestamps', () => {
      const before = Date.now();
      recordSeedDiscovery(state, 'wheat', 1);
      const after = Date.now();

      const discovery = state.entries['wheat'].tiersDiscovered[1];
      expect(discovery).toBeDefined();
      expect(discovery.firstDiscovered).toBeGreaterThanOrEqual(before);
      expect(discovery.firstDiscovered).toBeLessThanOrEqual(after);
    });
  });

  describe('getAvailableRewards', () => {
    it('should return seed discovery rewards when seeds are discovered', () => {
      recordSeedDiscovery(state, 'wheat', 1);

      const rewards = getAvailableRewards(state);
      const wheatReward = rewards.find(r => r.id === 'discover_wheat');

      expect(wheatReward).toBeDefined();
      expect(wheatReward?.type).toBe('seed_discovery');
    });

    it('should return tier discovery rewards when tier is first obtained', () => {
      // Discover a rare seed (tier 3)
      recordSeedDiscovery(state, 'wheat', 3);

      const rewards = getAvailableRewards(state);
      const rareReward = rewards.find(r => r.id === 'first_rare');

      expect(rareReward).toBeDefined();
    });

    it('should not return already claimed rewards', () => {
      recordSeedDiscovery(state, 'wheat', 1);
      claimReward(state, 'discover_wheat');

      const rewards = getAvailableRewards(state);
      const wheatReward = rewards.find(r => r.id === 'discover_wheat');

      expect(wheatReward).toBeUndefined();
    });

    it('should return family complete rewards', () => {
      // Complete bio family
      const bioSeeds = ALL_SEED_IDS.filter(id => SEED_TYPES[id].family === 'bio');
      for (const seedId of bioSeeds) {
        recordSeedDiscovery(state, seedId, 1);
      }

      const rewards = getAvailableRewards(state);
      const familyReward = rewards.find(r => r.id === 'family_bio');

      expect(familyReward).toBeDefined();
    });

    it('should return full complete reward when all seeds discovered', () => {
      // Discover all seeds
      for (const seedId of ALL_SEED_IDS) {
        recordSeedDiscovery(state, seedId, 1);
      }

      const rewards = getAvailableRewards(state);
      const fullReward = rewards.find(r => r.id === 'all_seeds_discovered');

      expect(fullReward).toBeDefined();
    });
  });

  describe('claimReward', () => {
    it('should return reward when claiming available reward', () => {
      recordSeedDiscovery(state, 'wheat', 1);

      const reward = claimReward(state, 'discover_wheat');

      expect(reward).not.toBeNull();
      expect(reward?.id).toBe('discover_wheat');
      expect(state.claimedRewards).toContain('discover_wheat');
    });

    it('should return null when claiming unavailable reward', () => {
      const reward = claimReward(state, 'discover_wheat');

      expect(reward).toBeNull();
    });

    it('should return null when claiming already claimed reward', () => {
      recordSeedDiscovery(state, 'wheat', 1);
      claimReward(state, 'discover_wheat');

      const reward = claimReward(state, 'discover_wheat');

      expect(reward).toBeNull();
    });
  });

  describe('getCompletionPercentage', () => {
    it('should return 0 when no seeds discovered', () => {
      expect(getCompletionPercentage(state)).toBe(0);
    });

    it('should return correct percentage', () => {
      const totalSeeds = ALL_SEED_IDS.length;
      recordSeedDiscovery(state, 'wheat', 1);

      const expected = Math.round((1 / totalSeeds) * 100);
      expect(getCompletionPercentage(state)).toBe(expected);
    });

    it('should return 100 when all seeds discovered', () => {
      for (const seedId of ALL_SEED_IDS) {
        recordSeedDiscovery(state, seedId, 1);
      }

      expect(getCompletionPercentage(state)).toBe(100);
    });
  });

  describe('getTierCompletionStats', () => {
    it('should return 0 for all tiers initially', () => {
      const stats = getTierCompletionStats(state);

      for (let tier = 1; tier <= 6; tier++) {
        expect(stats[tier]).toBe(0);
      }
    });

    it('should count seeds at each tier correctly', () => {
      recordSeedDiscovery(state, 'wheat', 1);
      recordSeedDiscovery(state, 'wheat', 3);
      recordSeedDiscovery(state, 'corn', 1);
      recordSeedDiscovery(state, 'corn', 2);
      recordSeedDiscovery(state, 'potato', 5);

      const stats = getTierCompletionStats(state);

      expect(stats[1]).toBe(2); // wheat and corn at tier 1
      expect(stats[2]).toBe(1); // corn at tier 2
      expect(stats[3]).toBe(1); // wheat at tier 3
      expect(stats[5]).toBe(1); // potato at tier 5
    });
  });

  describe('reward definitions', () => {
    it('should have discovery rewards for all seed types', () => {
      for (const seedId of ALL_SEED_IDS) {
        const reward = SEEDEX_REWARDS.find(r => r.id === `discover_${seedId}`);
        expect(reward).toBeDefined();
        expect(reward?.type).toBe('seed_discovery');
      }
    });

    it('should have tier discovery rewards for rare+ tiers', () => {
      expect(SEEDEX_REWARDS.find(r => r.id === 'first_rare')).toBeDefined();
      expect(SEEDEX_REWARDS.find(r => r.id === 'first_epic')).toBeDefined();
      expect(SEEDEX_REWARDS.find(r => r.id === 'first_legendary')).toBeDefined();
      expect(SEEDEX_REWARDS.find(r => r.id === 'first_mythic')).toBeDefined();
    });

    it('should have family completion rewards', () => {
      const families = ['bio', 'solar', 'lunar', 'crystal', 'primal', 'void'];
      for (const family of families) {
        const reward = SEEDEX_REWARDS.find(r => r.id === `family_${family}`);
        expect(reward).toBeDefined();
        expect(reward?.type).toBe('family_complete');
      }
    });
  });
});
