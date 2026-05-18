import { describe, it, expect } from 'vitest';
import { getContextualHint, getAllContextualHints } from './HintService';
import { createInitialGameState } from '../state/GameState';

function createTestState() {
  return createInitialGameState();
}

describe('HintService', () => {
  describe('getContextualHint', () => {
    it('should return first pull hint for brand new player', () => {
      const state = createTestState();
      // New player: no seeds, no pulls, no credits
      state.ship.seedInventory = [];
      state.ship.totalCurrency = 0;
      state.hints.firstGachaPull = false;
      state.hints.dismissed = [];
      // No seeds planted
      state.planets.forEach(p => {
        p.seeds = [];
      });

      const hint = getContextualHint(state);
      expect(hint).not.toBeNull();
      expect(hint?.id).toBe('hint_first_pull');
      expect(hint?.targetTab).toBe('gacha');
    });

    it('should return plant hint after first pull', () => {
      const state = createTestState();
      // Has seeds, hasn't planted
      state.ship.seedInventory = [
        {
          instanceId: 'test-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = false;
      state.hints.dismissed = [];
      // No seeds planted on any planet
      state.planets.forEach(p => {
        p.seeds = [];
      });

      const hint = getContextualHint(state);
      expect(hint).not.toBeNull();
      expect(hint?.id).toBe('hint_first_plant');
      expect(hint?.targetTab).toBe('planets');
    });

    it('should return null when hint is dismissed', () => {
      const state = createTestState();
      state.ship.seedInventory = [];
      state.hints.firstGachaPull = false;
      state.hints.dismissed = ['hint_first_pull'];

      const hint = getContextualHint(state);
      // Should not return first_pull hint since it's dismissed
      expect(hint?.id).not.toBe('hint_first_pull');
    });

    it('should return upgrade hint when player has credits but no upgrades', () => {
      const state = createTestState();
      // Player has some progress
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = true;
      state.hints.dismissed = [];
      state.ship.totalCurrency = 50;
      // No upgrades on any planet
      state.planets.forEach(p => {
        p.seeds = [
          {
            instanceId: 'test-1',
            id: 'wheat',
            name: 'Wheat',
            tier: 1,
            level: 1,
            productionMultiplier: 1,
            valueMultiplier: 1,
            color: '#ffd700',
            powerLevel: 1,
          },
        ];
        p.upgrades = { productionRate: 0, exportSpeed: 0, storageCapacity: 0 };
      });

      const hint = getContextualHint(state);
      expect(hint).not.toBeNull();
      expect(hint?.id).toBe('hint_first_upgrade');
    });

    it('should return fusion hint when player has duplicate seeds', () => {
      const state = createTestState();
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = true;
      state.hints.firstFusion = false;
      state.hints.dismissed = ['hint_first_upgrade', 'hint_upgrade_reminder'];
      state.ship.totalCurrency = 100;
      // Two identical seeds
      state.ship.seedInventory = [
        {
          instanceId: 'test-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
        {
          instanceId: 'test-2',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];
      // Give the player some upgrades so upgrade hints don't show
      state.planets[0].upgrades = { productionRate: 5, exportSpeed: 0, storageCapacity: 0 };

      const hint = getContextualHint(state);
      expect(hint).not.toBeNull();
      expect(hint?.id).toBe('hint_fusion_available');
      expect(hint?.targetTab).toBe('fusion');
    });

    it('should return null when hints state is missing', () => {
      const state = createTestState();
      // @ts-expect-error - testing null case
      state.hints = null;

      const hint = getContextualHint(state);
      expect(hint).toBeNull();
    });
  });

  describe('getAllContextualHints', () => {
    it('should return multiple applicable hints', () => {
      const state = createTestState();
      // Player in early-mid game
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = true;
      state.hints.firstFusion = false;
      state.hints.dismissed = [];
      state.ship.totalCurrency = 50;
      // Has seeds that can be fused
      state.ship.seedInventory = [
        {
          instanceId: 'test-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
        {
          instanceId: 'test-2',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];
      state.planets.forEach(p => {
        p.seeds = [
          {
            instanceId: 'planted-1',
            id: 'wheat',
            name: 'Wheat',
            tier: 1,
            level: 1,
            productionMultiplier: 1,
            valueMultiplier: 1,
            color: '#ffd700',
            powerLevel: 1,
          },
        ];
        p.upgrades = { productionRate: 0, exportSpeed: 0, storageCapacity: 0 };
      });

      const hints = getAllContextualHints(state);
      // Should have multiple hints: upgrade + fusion
      expect(hints.length).toBeGreaterThan(1);
      // Should be sorted by priority (lower first)
      for (let i = 0; i < hints.length - 1; i++) {
        expect(hints[i].priority).toBeLessThanOrEqual(hints[i + 1].priority);
      }
    });

    it('should return empty array when hints state is missing', () => {
      const state = createTestState();
      // @ts-expect-error - testing null case
      state.hints = null;

      const hints = getAllContextualHints(state);
      expect(hints).toEqual([]);
    });
  });

  describe('hint priority', () => {
    it('should show early game hints before mid game hints', () => {
      const state = createTestState();
      // Brand new player state - no credits, no seeds, no activity
      state.ship.seedInventory = [];
      state.ship.totalCurrency = 0;
      state.hints.firstGachaPull = false;
      state.hints.dismissed = [];
      state.planets.forEach(p => {
        p.seeds = [];
      });

      const hints = getAllContextualHints(state);
      // First pull hint should be highest priority
      expect(hints[0]?.id).toBe('hint_first_pull');
      expect(hints[0]?.priority).toBeLessThan(10);
    });
  });

  describe('firstExport hint', () => {
    it('should show wait for export hint when seeds planted but no credits', () => {
      const state = createTestState();
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = false;
      state.hints.dismissed = [];
      state.ship.totalCurrency = 0;
      state.ship.seedInventory = [];
      // Has planted seeds
      state.planets[0].seeds = [
        {
          instanceId: 'planted-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];

      const hint = getContextualHint(state);
      expect(hint).not.toBeNull();
      expect(hint?.id).toBe('hint_wait_export');
    });

    it('should not show wait for export hint after first export', () => {
      const state = createTestState();
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = true; // Export completed
      state.hints.dismissed = [];
      state.ship.totalCurrency = 0;
      state.ship.seedInventory = [];
      state.planets[0].seeds = [
        {
          instanceId: 'planted-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];

      const hint = getContextualHint(state);
      // Should not be the wait_export hint
      expect(hint?.id).not.toBe('hint_wait_export');
    });

    it('should not show wait for export hint when player has credits', () => {
      const state = createTestState();
      state.hints.firstGachaPull = true;
      state.hints.firstSeedPlanted = true;
      state.hints.firstExport = false;
      state.hints.dismissed = [];
      state.ship.totalCurrency = 50; // Has credits
      state.ship.seedInventory = [];
      state.planets[0].seeds = [
        {
          instanceId: 'planted-1',
          id: 'wheat',
          name: 'Wheat',
          tier: 1,
          level: 1,
          productionMultiplier: 1,
          valueMultiplier: 1,
          color: '#ffd700',
          powerLevel: 1,
        },
      ];

      const hint = getContextualHint(state);
      // Should show upgrade hint instead (has credits)
      expect(hint?.id).not.toBe('hint_wait_export');
    });
  });
});
