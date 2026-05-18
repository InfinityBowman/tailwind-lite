/**
 * Tests for SuggestedActionButton logic
 *
 * Note: We test the underlying hint service logic rather than rendering
 * the React component directly, following the project's test patterns.
 */

import { describe, it, expect } from 'vitest';
import { getContextualHint, type ContextualHint } from '../../game/services/HintService';

/**
 * SuggestedActionButton displays hints that have both `action` and `targetTab`.
 * This helper checks if a hint is actionable (valid for the button).
 */
function isActionableHint(hint: ContextualHint | null): boolean {
  return hint !== null && hint.action !== undefined && hint.targetTab !== undefined;
}

describe('SuggestedActionButton hint filtering', () => {
  const createMockState = (overrides: Record<string, unknown> = {}) => ({
    ship: {
      seedInventory: [],
      totalCurrency: 0,
      crystals: 0,
      resources: { plants: {}, seedEssence: 0 },
    },
    planets: [
      {
        id: 'terra-prime',
        name: 'Terra Prime',
        seeds: [],
        plants: [],
        unlocked: true,
        unlockCost: 0,
        upgrades: { productionRate: 0, exportSpeed: 0, storageCapacity: 0 },
      },
    ],
    prestige: { prestigeLevel: 0, prestigePoints: 0, lifetimeCredits: 0 },
    hints: {
      dismissed: [],
      firstGachaPull: false,
      firstSeedPlanted: false,
      firstExport: false,
      firstFusion: false,
    },
    managers: { owned: [] },
    achievements: { stats: {} },
    research: { refinedEssence: 0 },
    ...overrides,
  });

  describe('actionable hints for new players', () => {
    it('should show first pull hint with action for brand new player', () => {
      const state = createMockState();
      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).not.toBeNull();
      expect(isActionableHint(hint)).toBe(true);
      expect(hint?.id).toBe('hint_first_pull');
      expect(hint?.action).toBe('Go to Seeds');
      expect(hint?.targetTab).toBe('gacha');
    });

    it('should show plant hint after getting seeds', () => {
      const state = createMockState({
        hints: {
          dismissed: [],
          firstGachaPull: true,
          firstSeedPlanted: false,
          firstExport: false,
          firstFusion: false,
        },
        ship: {
          seedInventory: [{ id: '1', tier: 1, type: 'wheat' }],
          totalCurrency: 0,
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).not.toBeNull();
      expect(isActionableHint(hint)).toBe(true);
      expect(hint?.id).toBe('hint_first_plant');
      expect(hint?.action).toBe('Go to Planets');
      expect(hint?.targetTab).toBe('planets');
    });
  });

  describe('upgrade hints', () => {
    it('should show upgrade hint when player has credits but no upgrades', () => {
      const state = createMockState({
        hints: {
          dismissed: [],
          firstGachaPull: true,
          firstSeedPlanted: true,
          firstExport: true,
          firstFusion: false,
        },
        ship: {
          seedInventory: [],
          totalCurrency: 50,
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        planets: [
          {
            id: 'terra-prime',
            name: 'Terra Prime',
            seeds: [{ id: '1' }],
            plants: [],
            unlocked: true,
            unlockCost: 0,
            upgrades: { productionRate: 0, exportSpeed: 0, storageCapacity: 0 },
          },
        ],
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).not.toBeNull();
      expect(isActionableHint(hint)).toBe(true);
      expect(hint?.id).toBe('hint_first_upgrade');
      expect(hint?.action).toBe('Go to Planets');
    });
  });

  describe('fusion hints', () => {
    it('should show fusion hint when player has duplicate seeds', () => {
      // Fusion check uses `${item.id}-${item.tier}` as key
      // So two seeds with same id and tier should trigger fusion hint
      const state = createMockState({
        hints: {
          dismissed: [],
          firstGachaPull: true,
          firstSeedPlanted: true,
          firstExport: true,
          firstFusion: false,
        },
        ship: {
          seedInventory: [
            { id: 'wheat', tier: 1, instanceId: 'inst-1' },
            { id: 'wheat', tier: 1, instanceId: 'inst-2' },
          ],
          totalCurrency: 0,
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).not.toBeNull();
      expect(isActionableHint(hint)).toBe(true);
      expect(hint?.id).toBe('hint_fusion_available');
      expect(hint?.action).toBe('Go to Fusion');
      expect(hint?.targetTab).toBe('fusion');
    });
  });

  describe('prestige hints', () => {
    it('should show prestige hint when player has enough prestige points', () => {
      const state = createMockState({
        hints: {
          dismissed: [],
          firstGachaPull: true,
          firstSeedPlanted: true,
          firstExport: true,
          firstFusion: true,
        },
        prestige: {
          prestigeLevel: 0,
          prestigePoints: 150,
          lifetimeCredits: 10000,
        },
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).not.toBeNull();
      expect(isActionableHint(hint)).toBe(true);
      expect(hint?.id).toBe('hint_first_prestige');
      expect(hint?.action).toBe('View Prestige');
      expect(hint?.targetTab).toBe('prestige');
    });
  });

  describe('hint dismissal', () => {
    it('should not show dismissed hints', () => {
      const state = createMockState({
        hints: {
          dismissed: ['hint_first_pull'],
          firstGachaPull: false,
          firstSeedPlanted: false,
          firstExport: false,
          firstFusion: false,
        },
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      // First pull is dismissed, so should show nothing or next available
      expect(hint?.id).not.toBe('hint_first_pull');
    });

    it('should return null when hints are disabled', () => {
      const state = createMockState({
        hints: null,
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      expect(hint).toBeNull();
    });
  });

  describe('hint priority ordering', () => {
    it('should prioritize early game hints over later ones', () => {
      // Player somehow has prestige points but hasn't done first pull
      // (unrealistic but tests priority)
      const state = createMockState({
        hints: {
          dismissed: [],
          firstGachaPull: false,
          firstSeedPlanted: false,
          firstExport: false,
          firstFusion: false,
        },
        prestige: {
          prestigeLevel: 0,
          prestigePoints: 150,
          lifetimeCredits: 0,
        },
      });

      const hint = getContextualHint(state as Parameters<typeof getContextualHint>[0]);

      // Should still show first pull (priority 1) over prestige (priority 40)
      expect(hint?.id).toBe('hint_first_pull');
    });
  });
});
