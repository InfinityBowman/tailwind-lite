/**
 * Transcendence System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  canTranscend,
  getAllTranscendenceBonusesWithState,
  getProjectedTranscendencePoints,
} from './TranscendenceSystem';
import { TRANSCENDENCE_CONFIG, TRANSCENDENCE_BONUSES } from '../config/transcendence';

describe('TranscendenceSystem', () => {
  describe('canTranscend', () => {
    it('should not allow transcend below minimum prestige level', () => {
      const result = canTranscend(10);
      expect(result.canTranscend).toBe(false);
      expect(result.reason).toContain('25');
      expect(result.potentialPoints).toBe(0);
    });

    it('should allow transcend at minimum prestige level', () => {
      const result = canTranscend(TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL);
      expect(result.canTranscend).toBe(true);
      expect(result.potentialPoints).toBeGreaterThan(0);
    });

    it('should give more points for higher prestige level', () => {
      const result1 = canTranscend(25);
      const result2 = canTranscend(50);
      expect(result2.potentialPoints).toBeGreaterThan(result1.potentialPoints);
    });
  });

  describe('getAllTranscendenceBonusesWithState', () => {
    it('should return all bonuses with their state', () => {
      const bonuses = getAllTranscendenceBonusesWithState({});

      expect(bonuses.length).toBe(Object.keys(TRANSCENDENCE_BONUSES).length);

      const prestigeAmplifier = bonuses.find(b => b.bonus.id === 'prestigeAmplifier');
      expect(prestigeAmplifier).toBeDefined();
      expect(prestigeAmplifier!.currentLevel).toBe(0);
      expect(prestigeAmplifier!.currentValue).toBe(0);
      expect(prestigeAmplifier!.isMaxed).toBe(false);
      expect(prestigeAmplifier!.nextCost).toBeDefined();
    });

    it('should show current level and value', () => {
      const bonuses = getAllTranscendenceBonusesWithState({ prestigeAmplifier: 3 });

      const prestigeAmplifier = bonuses.find(b => b.bonus.id === 'prestigeAmplifier');
      expect(prestigeAmplifier!.currentLevel).toBe(3);
      expect(prestigeAmplifier!.currentValue).toBeGreaterThan(0);
    });

    it('should mark maxed bonuses', () => {
      const maxLevel = TRANSCENDENCE_BONUSES['prestigeAmplifier'].maxLevel;
      const bonuses = getAllTranscendenceBonusesWithState({ prestigeAmplifier: maxLevel });

      const prestigeAmplifier = bonuses.find(b => b.bonus.id === 'prestigeAmplifier');
      expect(prestigeAmplifier!.isMaxed).toBe(true);
      expect(prestigeAmplifier!.nextCost).toBeNull();
    });
  });

  describe('getProjectedTranscendencePoints', () => {
    it('should return 0 below minimum prestige level', () => {
      expect(getProjectedTranscendencePoints(5)).toBe(0);
      expect(getProjectedTranscendencePoints(24)).toBe(0);
    });

    it('should return positive points at minimum level', () => {
      expect(
        getProjectedTranscendencePoints(TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL)
      ).toBeGreaterThan(0);
    });

    it('should increase with prestige level', () => {
      const points1 = getProjectedTranscendencePoints(25);
      const points2 = getProjectedTranscendencePoints(100);
      expect(points2).toBeGreaterThan(points1);
    });
  });
});
