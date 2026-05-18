/**
 * Tests for GettingStarted checklist logic
 */

import { describe, it, expect } from 'vitest';
import { createChecklistItems } from './GettingStarted';

describe('createChecklistItems', () => {
  const createMockState = (
    overrides: Partial<{
      seedInventory: unknown[];
      planets: Array<{ seeds?: unknown[] }>;
      prestige: { lifetimeCredits: number };
      achievements: { stats: { totalGachaPulls: number; totalSeedsFused: number } };
    }> = {}
  ) => ({
    seedInventory: [],
    planets: [{ seeds: [] }],
    ship: { resources: { plants: {} } },
    prestige: { lifetimeCredits: 0 },
    achievements: { stats: { totalGachaPulls: 0, totalSeedsFused: 0 } },
    ...overrides,
  });

  describe('hasSeeds (pull milestone)', () => {
    it('should use lifetime gacha pulls when available', () => {
      // Even with empty inventory, if totalGachaPulls > 0, milestone is complete
      const state = createMockState({
        seedInventory: [],
        achievements: { stats: { totalGachaPulls: 3, totalSeedsFused: 0 } },
      });

      const items = createChecklistItems(state);
      const pullItem = items.find(i => i.id === 'pull');

      expect(pullItem?.completed).toBe(true);
    });

    it('should fallback to inventory when stats not available', () => {
      const state = createMockState({
        seedInventory: [{ id: '1' }],
        achievements: undefined,
      });

      const items = createChecklistItems(state as Parameters<typeof createChecklistItems>[0]);
      const pullItem = items.find(i => i.id === 'pull');

      expect(pullItem?.completed).toBe(true);
    });
  });

  describe('hasPlantedSeeds (plant milestone)', () => {
    it('should detect seeds on planets', () => {
      const state = createMockState({
        planets: [{ seeds: [{ id: '1' }] }],
      });

      const items = createChecklistItems(state);
      const plantItem = items.find(i => i.id === 'plant');

      expect(plantItem?.completed).toBe(true);
    });

    it('should use lifetime stats to detect planting even when planets are empty', () => {
      // Player pulled 3 seeds but only has 2 total (1 in inventory, 1 was scrapped/lost)
      // If totalGachaPulls > totalCurrentSeeds, some must have been planted
      const state = createMockState({
        seedInventory: [{ id: '1' }],
        planets: [{ seeds: [] }],
        achievements: { stats: { totalGachaPulls: 3, totalSeedsFused: 0 } },
      });

      const items = createChecklistItems(state);
      const plantItem = items.find(i => i.id === 'plant');

      expect(plantItem?.completed).toBe(true);
    });
  });

  describe('hasFused (fusion milestone)', () => {
    it('should use lifetime fused count when available', () => {
      // Even if no tier 2+ seeds in inventory, if totalSeedsFused > 0, milestone complete
      const state = createMockState({
        seedInventory: [],
        achievements: { stats: { totalGachaPulls: 0, totalSeedsFused: 1 } },
      });

      const items = createChecklistItems(state);
      const fuseItem = items.find(i => i.id === 'fuse');

      expect(fuseItem?.completed).toBe(true);
    });

    it('should detect tier 2+ seeds in inventory as fallback', () => {
      const state = createMockState({
        seedInventory: [{ id: '1', tier: 2 }],
        achievements: undefined,
      });

      const items = createChecklistItems(state as Parameters<typeof createChecklistItems>[0]);
      const fuseItem = items.find(i => i.id === 'fuse');

      expect(fuseItem?.completed).toBe(true);
    });
  });

  describe('hasCollectedHarvest and hasEarnedCredits', () => {
    it('should use lifetime credits for harvest milestone', () => {
      const state = createMockState({
        prestige: { lifetimeCredits: 1 },
      });

      const items = createChecklistItems(state);
      const harvestItem = items.find(i => i.id === 'harvest');

      expect(harvestItem?.completed).toBe(true);
    });

    it('should require 100+ credits for earn milestone', () => {
      const state = createMockState({
        prestige: { lifetimeCredits: 100 },
      });

      const items = createChecklistItems(state);
      const earnItem = items.find(i => i.id === 'earn');

      expect(earnItem?.completed).toBe(false);

      const state2 = createMockState({
        prestige: { lifetimeCredits: 101 },
      });

      const items2 = createChecklistItems(state2);
      const earnItem2 = items2.find(i => i.id === 'earn');

      expect(earnItem2?.completed).toBe(true);
    });
  });

  describe('regression: progress should not revert on navigation', () => {
    it('should maintain progress even when inventory is empty after planting', () => {
      // Scenario: Player pulled 3 seeds, planted all of them, sold harvest
      // On navigation, inventory is empty but progress should persist
      const state = createMockState({
        seedInventory: [],
        planets: [{ seeds: [{ id: '1' }, { id: '2' }, { id: '3' }] }],
        prestige: { lifetimeCredits: 50 },
        achievements: { stats: { totalGachaPulls: 3, totalSeedsFused: 0 } },
      });

      const items = createChecklistItems(state);

      expect(items.find(i => i.id === 'pull')?.completed).toBe(true);
      expect(items.find(i => i.id === 'plant')?.completed).toBe(true);
      expect(items.find(i => i.id === 'harvest')?.completed).toBe(true);
    });
  });
});
