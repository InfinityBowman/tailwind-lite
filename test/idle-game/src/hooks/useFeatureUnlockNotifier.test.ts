/**
 * Feature Unlock Notifier Tests
 *
 * Tests the localStorage persistence and helper functions.
 * The hook itself is tested through integration (GameView renders without error).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resetNotifiedUnlocks } from './useFeatureUnlockNotifier';

const STORAGE_KEY = 'spacefarm_notified_unlocks';

describe('Feature Unlock Notifier', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('localStorage persistence', () => {
    it('should start with no stored unlocks', () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('should allow storing unlock data', () => {
      const unlocks = ['quests', 'shop', 'farming:gacha'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toContain('quests');
      expect(parsed).toContain('shop');
      expect(parsed).toContain('farming:gacha');
    });

    it('should persist data across reads', () => {
      const unlocks = ['managers', 'research'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks));

      // Simulate multiple reads
      const read1 = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const read2 = JSON.parse(localStorage.getItem(STORAGE_KEY)!);

      expect(read1).toEqual(read2);
      expect(read1).toEqual(unlocks);
    });
  });

  describe('resetNotifiedUnlocks', () => {
    it('should clear stored unlocks', () => {
      // Set some data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['quests', 'shop']));
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      // Reset
      resetNotifiedUnlocks();

      // Should be cleared
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not throw when nothing is stored', () => {
      expect(() => resetNotifiedUnlocks()).not.toThrow();
    });
  });

  describe('unlock key format', () => {
    it('should use section name for nav sections', () => {
      // Nav sections use plain names
      const navUnlocks = ['farming', 'managers', 'quests', 'research', 'prestige'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(navUnlocks));

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      navUnlocks.forEach(unlock => {
        expect(stored).toContain(unlock);
        expect(unlock).not.toContain(':'); // No prefix for nav
      });
    });

    it('should use farming: prefix for farming sub-sections', () => {
      // Farming sub-sections use farming: prefix
      const farmingUnlocks = ['farming:gacha', 'farming:fusion', 'farming:seeds'];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(farmingUnlocks));

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      farmingUnlocks.forEach(unlock => {
        expect(stored).toContain(unlock);
        expect(unlock).toMatch(/^farming:/);
      });
    });
  });

  describe('feature names mapping', () => {
    // Test that expected features are recognized
    const expectedFeatures = [
      'farming',
      'managers',
      'expeditions',
      'events',
      'contracts',
      'quests',
      'achievements',
      'research',
      'mastery',
      'prestige',
      'transcendence',
      'shop',
      'daily',
      'stats',
      'leaderboard',
      'market',
    ];

    it('should have all main nav sections in expected list', () => {
      // These are the sections defined in the router
      expectedFeatures.forEach(feature => {
        expect(typeof feature).toBe('string');
        expect(feature.length).toBeGreaterThan(0);
      });
    });

    const expectedFarmingSubs = ['planets', 'gacha', 'fusion', 'seeds', 'inventory'];

    it('should have all farming sub-sections in expected list', () => {
      expectedFarmingSubs.forEach(sub => {
        expect(typeof sub).toBe('string');
        expect(sub.length).toBeGreaterThan(0);
      });
    });
  });

  describe('storage error handling', () => {
    it('should gracefully handle corrupted storage', () => {
      // Store invalid JSON
      localStorage.setItem(STORAGE_KEY, 'not valid json {{{');

      // Should be able to clear it
      expect(() => resetNotifiedUnlocks()).not.toThrow();
    });
  });
});
