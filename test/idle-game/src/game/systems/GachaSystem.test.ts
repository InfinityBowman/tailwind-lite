/**
 * GachaSystem Tests
 */

import { describe, it, expect } from 'vitest';
import { generateUniqueId, getTierName } from './GachaSystem';

describe('GachaSystem', () => {
  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateUniqueId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should return a string', () => {
      expect(typeof generateUniqueId()).toBe('string');
    });
  });

  describe('getTierName', () => {
    it('should return the correct name for each tier', () => {
      expect(getTierName(0)).toBe('Fodder');
      expect(getTierName(1)).toBe('Common');
      expect(getTierName(6)).toBe('Mythic');
    });

    it('should return Unknown for invalid tier', () => {
      expect(getTierName(99)).toBe('Unknown');
    });
  });
});
