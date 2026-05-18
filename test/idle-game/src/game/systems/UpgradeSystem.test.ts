/**
 * UpgradeSystem Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateUpgradeCost,
  getUpgradeEffectDescription,
  UPGRADE_TYPES,
  UPGRADE_NAMES,
} from './UpgradeSystem';
import { UPGRADE_CONFIG } from '../config/balance';

describe('UpgradeSystem', () => {
  describe('calculateUpgradeCost', () => {
    it('should return base cost at level 0', () => {
      const cost = calculateUpgradeCost('PRODUCTION_RATE', 0);
      expect(cost).toBe(UPGRADE_CONFIG.PRODUCTION_RATE.baseCost);
    });

    it('should scale cost with level', () => {
      const level0Cost = calculateUpgradeCost('PRODUCTION_RATE', 0);
      const level1Cost = calculateUpgradeCost('PRODUCTION_RATE', 1);
      const level2Cost = calculateUpgradeCost('PRODUCTION_RATE', 2);

      expect(level1Cost).toBeGreaterThan(level0Cost);
      expect(level2Cost).toBeGreaterThan(level1Cost);
    });

    it('should use correct scaling factor for each upgrade type', () => {
      const prodCost = calculateUpgradeCost('PRODUCTION_RATE', 1);
      const exportCost = calculateUpgradeCost('EXPORT_SPEED', 1);

      // Export speed has higher scaling factor
      expect(exportCost).toBeGreaterThan(prodCost);
    });

    it('should return floor value', () => {
      const cost = calculateUpgradeCost('PRODUCTION_RATE', 3);
      expect(Number.isInteger(cost)).toBe(true);
    });
  });

  describe('getUpgradeEffectDescription', () => {
    it('should return description for production rate', () => {
      const desc = getUpgradeEffectDescription('PRODUCTION_RATE');
      expect(desc).toContain('production');
    });

    it('should return description for export speed', () => {
      const desc = getUpgradeEffectDescription('EXPORT_SPEED');
      expect(desc).toContain('export speed');
    });

    it('should return description for storage capacity', () => {
      const desc = getUpgradeEffectDescription('STORAGE_CAPACITY');
      expect(desc).toContain('storage');
    });
  });

  describe('UPGRADE_TYPES', () => {
    it('should have all upgrade types', () => {
      expect(UPGRADE_TYPES.PRODUCTION_RATE).toBeDefined();
      expect(UPGRADE_TYPES.EXPORT_SPEED).toBeDefined();
      expect(UPGRADE_TYPES.STORAGE_CAPACITY).toBeDefined();
    });
  });

  describe('UPGRADE_NAMES', () => {
    it('should have human readable names', () => {
      expect(UPGRADE_NAMES.PRODUCTION_RATE).toBe('Production Rate');
      expect(UPGRADE_NAMES.EXPORT_SPEED).toBe('Export Speed');
      expect(UPGRADE_NAMES.STORAGE_CAPACITY).toBe('Storage Capacity');
    });
  });
});
