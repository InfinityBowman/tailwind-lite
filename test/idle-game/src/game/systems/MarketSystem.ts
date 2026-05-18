/**
 * Market System
 *
 * Manages dynamic price fluctuations for plant selling.
 * Prices vary over time, creating strategic sell timing.
 *
 * Also handles Daily Demands - deterministic family bonuses that rotate daily.
 */

import { SEED_TYPES, type SeedFamily, SEED_FAMILY_INFO } from '../config/seeds';

// ============================================
// TYPES
// ============================================

export interface MarketHistoryEntry {
  timestamp: number;
  multipliers: Record<string, number>;
}

export interface MarketState {
  /** Current price multipliers for each plant type (1.0 = base price) */
  priceMultipliers: Record<string, number>;
  /** Last time market was updated */
  lastUpdateTime: number;
  /** Historical price data for trending */
  priceHistory: MarketHistoryEntry[];
  /** Whether market is enabled */
  enabled: boolean;
}

export type MarketTrend = 'up' | 'down' | 'stable';

// ============================================
// CONFIGURATION
// ============================================

export const MARKET_CONFIG = {
  /** Time between market updates (5 minutes) */
  UPDATE_INTERVAL_MS: 5 * 60 * 1000,

  /** Minimum price multiplier (60% of base = -40%) */
  MIN_MULTIPLIER: 0.6,

  /** Maximum price multiplier (150% of base = +50%) */
  MAX_MULTIPLIER: 1.5,

  /** How much prices can change per update (max +-15%) */
  VOLATILITY: 0.15,

  /** Chance for a price to move toward 1.0 (mean reversion) */
  MEAN_REVERSION_STRENGTH: 0.3,

  /** History entries to keep (24 = 2 hours at 5 min intervals) */
  HISTORY_SIZE: 24,

  /** Threshold for "stable" trend detection */
  STABILITY_THRESHOLD: 0.03,
} as const;

// ============================================
// DAILY DEMANDS CONFIGURATION
// ============================================

export const DAILY_DEMAND_CONFIG = {
  /** Number of families in demand each day */
  FAMILIES_IN_DEMAND: 2,

  /** Bonus multiplier for in-demand families (+50%) */
  DEMAND_MULTIPLIER: 1.5,

  /** All seed families that can be in demand */
  ALL_FAMILIES: ['bio', 'solar', 'lunar', 'crystal', 'primal', 'void'] as SeedFamily[],
} as const;

// ============================================
// STATE CREATION
// ============================================

/**
 * Create initial market state with all prices at 1.0
 */
export function createInitialMarketState(now: number = Date.now()): MarketState {
  const priceMultipliers: Record<string, number> = {};

  // Initialize all plant types to base price (1.0)
  for (const seedId of Object.keys(SEED_TYPES)) {
    priceMultipliers[seedId] = 1.0;
  }

  return {
    priceMultipliers,
    lastUpdateTime: now,
    priceHistory: [],
    enabled: true,
  };
}

// ============================================
// PRICE CALCULATIONS
// ============================================

/**
 * Calculate new price with random walk + mean reversion
 */
function calculateNewPrice(currentPrice: number, rng: () => number = Math.random): number {
  const { MIN_MULTIPLIER, MAX_MULTIPLIER, VOLATILITY, MEAN_REVERSION_STRENGTH } = MARKET_CONFIG;

  // Random change component (-VOLATILITY to +VOLATILITY)
  const randomChange = (rng() * 2 - 1) * VOLATILITY;

  // Mean reversion component (pull toward 1.0)
  const reversion = (1.0 - currentPrice) * MEAN_REVERSION_STRENGTH;

  // Combined change
  const change = randomChange + reversion;
  const newPrice = currentPrice + change;

  // Clamp to valid range
  return Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, newPrice));
}

/**
 * Get current market multiplier for a plant type
 * Returns 1.0 if market is disabled or plant not found
 */
export function getMarketMultiplier(state: MarketState, plantType: string): number {
  if (!state.enabled) return 1.0;
  return state.priceMultipliers[plantType] ?? 1.0;
}

/**
 * Get market trend for a plant type based on recent history
 */
export function getMarketTrend(state: MarketState, plantType: string): MarketTrend {
  if (!state.enabled || state.priceHistory.length < 2) return 'stable';

  const { STABILITY_THRESHOLD } = MARKET_CONFIG;

  // Compare current to average of last 3 entries
  const current = state.priceMultipliers[plantType] ?? 1.0;
  const recentEntries = state.priceHistory.slice(0, 3);

  if (recentEntries.length === 0) return 'stable';

  const avg =
    recentEntries.reduce((sum, entry) => sum + (entry.multipliers[plantType] ?? 1.0), 0) /
    recentEntries.length;

  const diff = current - avg;

  if (diff > STABILITY_THRESHOLD) return 'up';
  if (diff < -STABILITY_THRESHOLD) return 'down';
  return 'stable';
}

/**
 * Get percent change from base price (1.0)
 */
export function getMarketChangePercent(state: MarketState, plantType: string): number {
  const multiplier = getMarketMultiplier(state, plantType);
  return Math.round((multiplier - 1.0) * 100);
}

/**
 * Check if a plant is at a "good" price (above 1.15 = 15%+ above base)
 */
export function isGoodPrice(state: MarketState, plantType: string): boolean {
  return getMarketMultiplier(state, plantType) >= 1.15;
}

/**
 * Check if a plant is at a "bad" price (below 0.85 = 15%+ below base)
 */
export function isBadPrice(state: MarketState, plantType: string): boolean {
  return getMarketMultiplier(state, plantType) <= 0.85;
}

// ============================================
// STATE UPDATES
// ============================================

/**
 * Update market prices based on elapsed time
 * Returns new state if update occurred, original state if not
 */
export function updateMarket(
  state: MarketState,
  now: number = Date.now(),
  rng: () => number = Math.random
): MarketState {
  if (!state.enabled) return state;

  const { UPDATE_INTERVAL_MS, HISTORY_SIZE } = MARKET_CONFIG;
  const elapsed = now - state.lastUpdateTime;

  // Check if it's time to update
  if (elapsed < UPDATE_INTERVAL_MS) return state;

  // Calculate how many updates to apply (catch up if far behind)
  const updates = Math.min(Math.floor(elapsed / UPDATE_INTERVAL_MS), 10);

  const newMultipliers = { ...state.priceMultipliers };
  let newHistory = [...state.priceHistory];

  for (let i = 0; i < updates; i++) {
    // Save current state to history
    newHistory = [
      {
        timestamp: state.lastUpdateTime + (i + 1) * UPDATE_INTERVAL_MS,
        multipliers: { ...newMultipliers },
      },
      ...newHistory,
    ].slice(0, HISTORY_SIZE);

    // Update each plant type
    for (const seedId of Object.keys(newMultipliers)) {
      newMultipliers[seedId] = calculateNewPrice(newMultipliers[seedId], rng);
    }
  }

  return {
    ...state,
    priceMultipliers: newMultipliers,
    lastUpdateTime: state.lastUpdateTime + updates * UPDATE_INTERVAL_MS,
    priceHistory: newHistory,
  };
}

/**
 * Toggle market enabled state
 */
export function setMarketEnabled(state: MarketState, enabled: boolean): MarketState {
  return { ...state, enabled };
}

/**
 * Reset market to initial state
 */
export function resetMarket(now: number = Date.now()): MarketState {
  return createInitialMarketState(now);
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all plants sorted by current price (best deals first)
 */
export function getPlantsByPrice(
  state: MarketState,
  plants: Record<string, number>
): Array<{ plantType: string; multiplier: number; trend: MarketTrend; amount: number }> {
  return Object.entries(plants)
    .filter(([_, amount]) => amount > 0)
    .map(([plantType, amount]) => ({
      plantType,
      multiplier: getMarketMultiplier(state, plantType),
      trend: getMarketTrend(state, plantType),
      amount,
    }))
    .sort((a, b) => b.multiplier - a.multiplier);
}

/**
 * Get time until next market update
 */
export function getTimeUntilMarketUpdate(state: MarketState, now: number = Date.now()): number {
  if (!state.enabled) return Infinity;
  const elapsed = now - state.lastUpdateTime;
  return Math.max(0, MARKET_CONFIG.UPDATE_INTERVAL_MS - elapsed);
}

/**
 * Get best plant to sell right now (highest multiplier with stock)
 */
export function getBestSellOpportunity(
  state: MarketState,
  plants: Record<string, number>
): { plantType: string; multiplier: number } | null {
  const sorted = getPlantsByPrice(state, plants);
  return sorted.length > 0
    ? { plantType: sorted[0].plantType, multiplier: sorted[0].multiplier }
    : null;
}

/**
 * Format multiplier as percentage string (+15%, -10%, etc.)
 */
export function formatMarketChange(multiplier: number): string {
  const percent = Math.round((multiplier - 1.0) * 100);
  if (percent > 0) return `+${percent}%`;
  if (percent < 0) return `${percent}%`;
  return '0%';
}

// ============================================
// DAILY DEMANDS
// ============================================

/**
 * Simple seeded random number generator (mulberry32)
 * Produces deterministic values from a seed
 */
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get date seed for deterministic daily rotation
 * Uses year, month, day to create a unique seed per day
 */
function getDateSeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  // Create a unique seed combining date components
  return year * 10000 + month * 100 + day;
}

/**
 * Get the families in demand for a given date
 * Returns deterministic results - same date always returns same families
 */
export function getDailyDemands(date: Date = new Date()): SeedFamily[] {
  const { ALL_FAMILIES, FAMILIES_IN_DEMAND } = DAILY_DEMAND_CONFIG;

  const seed = getDateSeed(date);
  const rng = seededRandom(seed);

  // Shuffle families using seeded RNG
  const shuffled = [...ALL_FAMILIES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return first N families
  return shuffled.slice(0, FAMILIES_IN_DEMAND);
}

/**
 * Check if a seed family is in demand today
 */
export function isFamilyInDemand(family: SeedFamily, date: Date = new Date()): boolean {
  const demands = getDailyDemands(date);
  return demands.includes(family);
}

/**
 * Get the daily demand multiplier for a seed family
 * Returns DEMAND_MULTIPLIER (1.5) if in demand, 1.0 otherwise
 */
export function getDailyDemandMultiplier(family: SeedFamily, date: Date = new Date()): number {
  if (isFamilyInDemand(family, date)) {
    return DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER;
  }
  return 1.0;
}

/**
 * Get the daily demand multiplier for a specific plant type
 * Looks up the plant's family and checks if it's in demand
 */
export function getPlantDailyDemandMultiplier(plantType: string, date: Date = new Date()): number {
  const seedType = SEED_TYPES[plantType];
  if (!seedType) return 1.0;
  return getDailyDemandMultiplier(seedType.family, date);
}

/**
 * Get the combined market multiplier for a plant
 * Includes both real-time price fluctuations AND daily demand bonus
 */
export function getCombinedMarketMultiplier(
  state: MarketState,
  plantType: string,
  date: Date = new Date()
): number {
  const baseMultiplier = getMarketMultiplier(state, plantType);
  const demandMultiplier = getPlantDailyDemandMultiplier(plantType, date);
  return baseMultiplier * demandMultiplier;
}

/**
 * Get formatted daily demands info for display
 */
export function getDailyDemandsInfo(date: Date = new Date()): Array<{
  family: SeedFamily;
  name: string;
  color: string;
  multiplier: number;
}> {
  const demands = getDailyDemands(date);
  return demands.map(family => ({
    family,
    name: SEED_FAMILY_INFO[family].name,
    color: SEED_FAMILY_INFO[family].color,
    multiplier: DAILY_DEMAND_CONFIG.DEMAND_MULTIPLIER,
  }));
}

/**
 * Get time until daily demands reset (midnight local time)
 */
export function getTimeUntilDemandReset(now: Date = new Date()): number {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}
