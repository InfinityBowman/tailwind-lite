/**
 * Research System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getActiveResearchEffects,
  hasResearchEffect,
  getResearchEffectValue,
  getAvailableResearch,
  getGachaCostMultiplier,
  getFusionCostMultiplier,
  getRefinementEfficiencyBonus,
  isAutoFuseUnlocked,
  isManagersUnlocked,
  ResearchState,
} from './ResearchSystem';

describe('ResearchSystem', () => {
  describe('getActiveResearchEffects', () => {
    it('should return empty map for no research', () => {
      const effects = getActiveResearchEffects([]);
      expect(effects.size).toBe(0);
    });

    it('should aggregate effects from multiple research', () => {
      const completed = ['efficientGrowth', 'improvedSoil']; // Both give PRODUCTION_BOOST
      const effects = getActiveResearchEffects(completed);

      expect(effects.has('PRODUCTION_BOOST')).toBe(true);
      // efficientGrowth: 0.1, improvedSoil: 0.2
      expect(effects.get('PRODUCTION_BOOST')).toBeCloseTo(0.3, 5);
    });
  });

  describe('hasResearchEffect', () => {
    it('should return false for missing effect', () => {
      expect(hasResearchEffect([], 'AUTO_SELL')).toBe(false);
    });

    it('should return true for unlocked effect', () => {
      const completed = ['basicInsight', 'autoSellBasic'];
      expect(hasResearchEffect(completed, 'AUTO_SELL')).toBe(true);
    });
  });

  describe('getResearchEffectValue', () => {
    it('should return 0 for missing effect', () => {
      expect(getResearchEffectValue([], 'PRODUCTION_BOOST')).toBe(0);
    });

    it('should return correct value for effect', () => {
      const completed = ['efficientGrowth'];
      expect(getResearchEffectValue(completed, 'PRODUCTION_BOOST')).toBeCloseTo(0.1, 5);
    });
  });

  describe('getAvailableResearch', () => {
    const state: ResearchState = { completed: [], refinedEssence: 0 };

    it('should return tier 1 research initially', () => {
      const available = getAvailableResearch(state);
      const tier1Ids = available.map(r => r.id);

      expect(tier1Ids).toContain('basicInsight');
      expect(tier1Ids).toContain('efficientGrowth');
      expect(tier1Ids).toContain('quickExports');
      expect(tier1Ids).toContain('bulkPurchasing');
    });

    it('should not return completed research', () => {
      const s = { ...state, completed: ['basicInsight'] };
      const available = getAvailableResearch(s);

      expect(available.find(r => r.id === 'basicInsight')).toBeUndefined();
    });

    it('should unlock tier 2 when prerequisites met', () => {
      const s = { ...state, completed: ['basicInsight'] };
      const available = getAvailableResearch(s);

      expect(available.find(r => r.id === 'autoSellBasic')).toBeDefined();
    });
  });

  describe('getGachaCostMultiplier', () => {
    it('should return 1 with no research', () => {
      expect(getGachaCostMultiplier([])).toBe(1);
    });

    it('should return less than 1 with research', () => {
      const completed = ['bargainHunter']; // -15% cost
      expect(getGachaCostMultiplier(completed)).toBeCloseTo(0.85, 5);
    });
  });

  describe('getFusionCostMultiplier', () => {
    it('should return 1 with no research', () => {
      expect(getFusionCostMultiplier([])).toBe(1);
    });

    it('should return reduced multiplier with fusion discount research', () => {
      const completed = ['fusionMaster'];
      const mult = getFusionCostMultiplier(completed);
      expect(mult).toBe(0.75);
    });

    it('should cap minimum at 0.1', () => {
      const mult = getFusionCostMultiplier([]);
      expect(mult).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('getRefinementEfficiencyBonus', () => {
    it('should return 0 with no research', () => {
      expect(getRefinementEfficiencyBonus([])).toBe(0);
    });

    it('should return bonus with refinement research', () => {
      const completed = ['refineryUpgrade'];
      const bonus = getRefinementEfficiencyBonus(completed);
      expect(bonus).toBe(0.3);
    });
  });

  describe('isAutoFuseUnlocked', () => {
    it('should return false without research', () => {
      expect(isAutoFuseUnlocked([])).toBe(false);
    });

    it('should return true with fusionAutomation research', () => {
      expect(isAutoFuseUnlocked(['fusionAutomation'])).toBe(true);
    });
  });

  describe('isManagersUnlocked', () => {
    it('should return false without research', () => {
      expect(isManagersUnlocked([])).toBe(false);
    });

    it('should return true with managerRecruitment research', () => {
      expect(isManagersUnlocked(['managerRecruitment'])).toBe(true);
    });
  });
});
