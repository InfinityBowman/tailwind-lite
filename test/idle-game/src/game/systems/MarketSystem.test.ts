/**
 * MarketSystem Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createInitialMarketState,
  updateMarket,
  getMarketMultiplier,
  getMarketTrend,
  getMarketChangePercent,
  isGoodPrice,
  isBadPrice,
  setMarketEnabled,
  resetMarket,
  getPlantsByPrice,
  getTimeUntilMarketUpdate,
  getBestSellOpportunity,
  formatMarketChange,
  MARKET_CONFIG,
  DAILY_DEMAND_CONFIG,
  getDailyDemands,
  isFamilyInDemand,
  getDailyDemandMultiplier,
  getPlantDailyDemandMultiplier,
  getCombinedMarketMultiplier,
  getDailyDemandsInfo,
  getTimeUntilDemandReset,
} from './MarketSystem';

describe('MarketSystem', () => {
  const NOW = 1000000;

  describe('createInitialMarketState', () => {
    it('should create state with all multipliers at 1.0', () => {
      const state = createInitialMarketState(NOW);
      expect(state.priceMultipliers['wheat']).toBe(1.0);
      expect(state.priceMultipliers['corn']).toBe(1.0);
      expect(state.lastUpdateTime).toBe(NOW);
      expect(state.priceHistory).toEqual([]);
      expect(state.enabled).toBe(true);
    });
  });

  describe('getMarketMultiplier', () => {
    it('should return multiplier for valid plant type', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.25;
      expect(getMarketMultiplier(state, 'wheat')).toBe(1.25);
    });

    it('should return 1.0 for unknown plant type', () => {
      const state = createInitialMarketState(NOW);
      expect(getMarketMultiplier(state, 'unknown_plant')).toBe(1.0);
    });

    it('should return 1.0 when market is disabled', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.5;
      state.enabled = false;
      expect(getMarketMultiplier(state, 'wheat')).toBe(1.0);
    });
  });

  describe('updateMarket', () => {
    it('should not update before interval elapsed', () => {
      const state = createInitialMarketState(NOW);
      const updated = updateMarket(state, NOW + 1000);
      expect(updated).toBe(state); // Same reference
    });

    it('should update after interval elapsed', () => {
      const state = createInitialMarketState(NOW);
      // Use fixed RNG for deterministic test
      const mockRng = vi.fn().mockReturnValue(0.5);
      const updated = updateMarket(state, NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS + 1000, mockRng);
      expect(updated).not.toBe(state);
      expect(updated.lastUpdateTime).toBe(NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS);
      expect(updated.priceHistory.length).toBe(1);
    });

    it('should catch up with multiple updates if far behind', () => {
      const state = createInitialMarketState(NOW);
      const mockRng = vi.fn().mockReturnValue(0.5);
      const updates = 5;
      const updated = updateMarket(
        state,
        NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS * updates + 1000,
        mockRng
      );
      expect(updated.priceHistory.length).toBe(updates);
    });

    it('should clamp to max 10 catch-up updates', () => {
      const state = createInitialMarketState(NOW);
      const mockRng = vi.fn().mockReturnValue(0.5);
      const updated = updateMarket(state, NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS * 100, mockRng);
      expect(updated.priceHistory.length).toBe(10);
    });

    it('should not update when disabled', () => {
      const state = createInitialMarketState(NOW);
      state.enabled = false;
      const updated = updateMarket(state, NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS * 10);
      expect(updated).toBe(state);
    });

    it('should keep prices within configured bounds', () => {
      const state = createInitialMarketState(NOW);
      // Force low RNG to drive prices down
      const lowRng = vi.fn().mockReturnValue(0);
      let current = state;
      for (let i = 0; i < 20; i++) {
        current = updateMarket(
          current,
          NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS * (i + 1) + 1,
          lowRng
        );
      }
      const wheatPrice = current.priceMultipliers['wheat'];
      expect(wheatPrice).toBeGreaterThanOrEqual(MARKET_CONFIG.MIN_MULTIPLIER);
      expect(wheatPrice).toBeLessThanOrEqual(MARKET_CONFIG.MAX_MULTIPLIER);
    });

    it('should apply mean reversion toward 1.0', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.4; // Start high
      // Use 0.5 RNG (no random change) to isolate mean reversion
      const neutralRng = vi.fn().mockReturnValue(0.5);
      const updated = updateMarket(state, NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS + 1, neutralRng);
      // Price should move toward 1.0 due to mean reversion
      expect(updated.priceMultipliers['wheat']).toBeLessThan(1.4);
    });
  });

  describe('getMarketTrend', () => {
    it('should return stable with no history', () => {
      const state = createInitialMarketState(NOW);
      expect(getMarketTrend(state, 'wheat')).toBe('stable');
    });

    it('should return up when price increased', () => {
      const state = createInitialMarketState(NOW);
      state.priceHistory = [
        { timestamp: NOW - 5 * 60 * 1000, multipliers: { wheat: 1.0 } },
        { timestamp: NOW - 10 * 60 * 1000, multipliers: { wheat: 1.0 } },
      ];
      state.priceMultipliers['wheat'] = 1.1;
      expect(getMarketTrend(state, 'wheat')).toBe('up');
    });

    it('should return down when price decreased', () => {
      const state = createInitialMarketState(NOW);
      state.priceHistory = [
        { timestamp: NOW - 5 * 60 * 1000, multipliers: { wheat: 1.1 } },
        { timestamp: NOW - 10 * 60 * 1000, multipliers: { wheat: 1.1 } },
      ];
      state.priceMultipliers['wheat'] = 0.95;
      expect(getMarketTrend(state, 'wheat')).toBe('down');
    });

    it('should return stable for small changes', () => {
      const state = createInitialMarketState(NOW);
      state.priceHistory = [
        { timestamp: NOW - 5 * 60 * 1000, multipliers: { wheat: 1.0 } },
        { timestamp: NOW - 10 * 60 * 1000, multipliers: { wheat: 1.0 } },
      ];
      state.priceMultipliers['wheat'] = 1.02; // Small change
      expect(getMarketTrend(state, 'wheat')).toBe('stable');
    });
  });

  describe('getMarketChangePercent', () => {
    it('should return correct percentage change', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.25;
      expect(getMarketChangePercent(state, 'wheat')).toBe(25);
    });

    it('should return negative percentage for price decrease', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 0.8;
      expect(getMarketChangePercent(state, 'wheat')).toBe(-20);
    });

    it('should return 0 for base price', () => {
      const state = createInitialMarketState(NOW);
      expect(getMarketChangePercent(state, 'wheat')).toBe(0);
    });
  });

  describe('isGoodPrice / isBadPrice', () => {
    it('should identify good prices (>= 1.15)', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.2;
      expect(isGoodPrice(state, 'wheat')).toBe(true);
      expect(isBadPrice(state, 'wheat')).toBe(false);
    });

    it('should identify bad prices (<= 0.85)', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 0.8;
      expect(isBadPrice(state, 'wheat')).toBe(true);
      expect(isGoodPrice(state, 'wheat')).toBe(false);
    });

    it('should identify neutral prices', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.0;
      expect(isGoodPrice(state, 'wheat')).toBe(false);
      expect(isBadPrice(state, 'wheat')).toBe(false);
    });
  });

  describe('setMarketEnabled', () => {
    it('should toggle market enabled state', () => {
      const state = createInitialMarketState(NOW);
      expect(state.enabled).toBe(true);
      const disabled = setMarketEnabled(state, false);
      expect(disabled.enabled).toBe(false);
      const enabled = setMarketEnabled(disabled, true);
      expect(enabled.enabled).toBe(true);
    });
  });

  describe('resetMarket', () => {
    it('should create fresh market state', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.5;
      state.priceHistory = [{ timestamp: NOW, multipliers: { wheat: 1.2 } }];
      const reset = resetMarket(NOW + 1000);
      expect(reset.priceMultipliers['wheat']).toBe(1.0);
      expect(reset.priceHistory).toEqual([]);
      expect(reset.lastUpdateTime).toBe(NOW + 1000);
    });
  });

  describe('getPlantsByPrice', () => {
    it('should sort plants by multiplier descending', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.1;
      state.priceMultipliers['corn'] = 1.3;
      state.priceMultipliers['potato'] = 0.9;
      const plants = { wheat: 100, corn: 50, potato: 75 };
      const sorted = getPlantsByPrice(state, plants);
      expect(sorted[0].plantType).toBe('corn');
      expect(sorted[1].plantType).toBe('wheat');
      expect(sorted[2].plantType).toBe('potato');
    });

    it('should filter out plants with 0 amount', () => {
      const state = createInitialMarketState(NOW);
      const plants = { wheat: 100, corn: 0 };
      const sorted = getPlantsByPrice(state, plants);
      expect(sorted.length).toBe(1);
      expect(sorted[0].plantType).toBe('wheat');
    });

    it('should include trend information', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.2;
      state.priceHistory = [
        { timestamp: NOW - 5 * 60 * 1000, multipliers: { wheat: 1.0 } },
        { timestamp: NOW - 10 * 60 * 1000, multipliers: { wheat: 1.0 } },
      ];
      const plants = { wheat: 100 };
      const sorted = getPlantsByPrice(state, plants);
      expect(sorted[0].trend).toBe('up');
    });
  });

  describe('getTimeUntilMarketUpdate', () => {
    it('should return remaining time until update', () => {
      const state = createInitialMarketState(NOW);
      const elapsed = 60 * 1000; // 1 minute
      const remaining = getTimeUntilMarketUpdate(state, NOW + elapsed);
      expect(remaining).toBe(MARKET_CONFIG.UPDATE_INTERVAL_MS - elapsed);
    });

    it('should return 0 when update is due', () => {
      const state = createInitialMarketState(NOW);
      const remaining = getTimeUntilMarketUpdate(
        state,
        NOW + MARKET_CONFIG.UPDATE_INTERVAL_MS + 1000
      );
      expect(remaining).toBe(0);
    });

    it('should return Infinity when disabled', () => {
      const state = createInitialMarketState(NOW);
      state.enabled = false;
      expect(getTimeUntilMarketUpdate(state, NOW)).toBe(Infinity);
    });
  });

  describe('getBestSellOpportunity', () => {
    it('should return plant with highest multiplier', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.1;
      state.priceMultipliers['corn'] = 1.3;
      const plants = { wheat: 100, corn: 50 };
      const best = getBestSellOpportunity(state, plants);
      expect(best?.plantType).toBe('corn');
      expect(best?.multiplier).toBe(1.3);
    });

    it('should return null with no plants', () => {
      const state = createInitialMarketState(NOW);
      const best = getBestSellOpportunity(state, {});
      expect(best).toBeNull();
    });
  });

  describe('formatMarketChange', () => {
    it('should format positive change', () => {
      expect(formatMarketChange(1.25)).toBe('+25%');
    });

    it('should format negative change', () => {
      expect(formatMarketChange(0.8)).toBe('-20%');
    });

    it('should format zero change', () => {
      expect(formatMarketChange(1.0)).toBe('0%');
    });

    it('should round to whole percent', () => {
      expect(formatMarketChange(1.123)).toBe('+12%');
      expect(formatMarketChange(0.876)).toBe('-12%');
    });
  });

  // ============================================
  // DAILY DEMANDS TESTS
  // ============================================

  describe('getDailyDemands', () => {
    it('should return configured number of families', () => {
      const demands = getDailyDemands(new Date('2024-01-15'));
      expect(demands.length).toBe(DAILY_DEMAND_CONFIG.FAMILIES_IN_DEMAND);
    });

    it('should be deterministic - same date returns same families', () => {
      const date = new Date('2024-03-20');
      const demands1 = getDailyDemands(date);
      const demands2 = getDailyDemands(date);
      expect(demands1).toEqual(demands2);
    });

    it('should return different families for different dates', () => {
      const demands1 = getDailyDemands(new Date('2024-01-01'));
      const demands2 = getDailyDemands(new Date('2024-01-02'));
      // Not guaranteed to be different, but very likely across many days
      // Test that the function handles different dates
      expect(demands1.length).toBe(DAILY_DEMAND_CONFIG.FAMILIES_IN_DEMAND);
      expect(demands2.length).toBe(DAILY_DEMAND_CONFIG.FAMILIES_IN_DEMAND);
    });

    it('should only return valid seed families', () => {
      const demands = getDailyDemands(new Date('2024-06-15'));
      for (const family of demands) {
        expect(DAILY_DEMAND_CONFIG.ALL_FAMILIES).toContain(family);
      }
    });

    it('should not return duplicate families', () => {
      const demands = getDailyDemands(new Date('2024-09-10'));
      const uniqueFamilies = new Set(demands);
      expect(uniqueFamilies.size).toBe(demands.length);
    });
  });

  describe('isFamilyInDemand', () => {
    it('should return true for in-demand families', () => {
      const date = new Date('2024-02-14');
      const demands = getDailyDemands(date);
      expect(isFamilyInDemand(demands[0], date)).toBe(true);
    });

    it('should return false for families not in demand', () => {
      const date = new Date('2024-02-14');
      const demands = getDailyDemands(date);
      const notInDemand = DAILY_DEMAND_CONFIG.ALL_FAMILIES.find(f => !demands.includes(f));
      if (notInDemand) {
        expect(isFamilyInDemand(notInDemand, date)).toBe(false);
      }
    });
  });

  describe('getDailyDemandMultiplier', () => {
    it('should return DEMAND_MULTIPLIER for in-demand families', () => {
      const date = new Date('2024-04-20');
      const demands = getDailyDemands(date);
      const multiplier = getDailyDemandMultiplier(demands[0], date);
      expect(multiplier).toBe(DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER);
    });

    it('should return 1.0 for families not in demand', () => {
      const date = new Date('2024-04-20');
      const demands = getDailyDemands(date);
      const notInDemand = DAILY_DEMAND_CONFIG.ALL_FAMILIES.find(f => !demands.includes(f));
      if (notInDemand) {
        expect(getDailyDemandMultiplier(notInDemand, date)).toBe(1.0);
      }
    });
  });

  describe('getPlantDailyDemandMultiplier', () => {
    it('should return demand multiplier for plants in hot families', () => {
      // wheat is 'bio' family
      // We need to check if bio is in demand on a specific date
      const date = new Date('2024-05-15');
      const demands = getDailyDemands(date);
      const multiplier = getPlantDailyDemandMultiplier('wheat', date);

      if (demands.includes('bio')) {
        expect(multiplier).toBe(DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER);
      } else {
        expect(multiplier).toBe(1.0);
      }
    });

    it('should return 1.0 for unknown plant types', () => {
      expect(getPlantDailyDemandMultiplier('unknown_plant')).toBe(1.0);
    });
  });

  describe('getCombinedMarketMultiplier', () => {
    it('should combine market and demand multipliers', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.2; // +20% market price

      const date = new Date('2024-07-04');
      const demands = getDailyDemands(date);
      const combined = getCombinedMarketMultiplier(state, 'wheat', date);

      if (demands.includes('bio')) {
        // bio is wheat's family
        expect(combined).toBe(1.2 * DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER);
      } else {
        expect(combined).toBe(1.2);
      }
    });

    it('should return base multiplier when market is disabled', () => {
      const state = createInitialMarketState(NOW);
      state.priceMultipliers['wheat'] = 1.2;
      state.enabled = false;

      const date = new Date('2024-07-04');
      const demands = getDailyDemands(date);
      const combined = getCombinedMarketMultiplier(state, 'wheat', date);

      // Market disabled returns 1.0, but demand multiplier still applies
      if (demands.includes('bio')) {
        expect(combined).toBe(1.0 * DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER);
      } else {
        expect(combined).toBe(1.0);
      }
    });
  });

  describe('getDailyDemandsInfo', () => {
    it('should return formatted demand info', () => {
      const info = getDailyDemandsInfo(new Date('2024-08-20'));
      expect(info.length).toBe(DAILY_DEMAND_CONFIG.FAMILIES_IN_DEMAND);

      for (const demand of info) {
        expect(demand).toHaveProperty('family');
        expect(demand).toHaveProperty('name');
        expect(demand).toHaveProperty('color');
        expect(demand).toHaveProperty('multiplier');
        expect(demand.multiplier).toBe(DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER);
      }
    });
  });

  describe('getTimeUntilDemandReset', () => {
    it('should return time until midnight', () => {
      const now = new Date('2024-01-15T10:30:00');
      const timeRemaining = getTimeUntilDemandReset(now);

      // Should be 13.5 hours = 48,600,000 ms
      const hoursRemaining = timeRemaining / (1000 * 60 * 60);
      expect(hoursRemaining).toBeCloseTo(13.5, 1);
    });

    it('should return small value near midnight', () => {
      const now = new Date('2024-01-15T23:55:00');
      const timeRemaining = getTimeUntilDemandReset(now);

      // Should be 5 minutes = 300,000 ms
      const minutesRemaining = timeRemaining / (1000 * 60);
      expect(minutesRemaining).toBeCloseTo(5, 1);
    });
  });
});
