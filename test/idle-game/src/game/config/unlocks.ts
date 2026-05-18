/**
 * Feature Unlock Configuration
 *
 * Defines progressive unlock conditions for UI features.
 * Goal: New players see a clean, focused UI that expands as they progress.
 */

import type { GameState } from '../state/GameState';
import type { Section, FarmingSubSection } from '@/router';

// Alias for backwards compatibility
type NavSection = Section;
import { PRESTIGE_CONFIG } from './prestige';

// ============================================
// UNLOCK CONDITION TYPES
// ============================================

export interface UnlockCondition {
  /** Human-readable description of unlock requirement */
  description: string;
  /** Check if the condition is met */
  check: (state: GameState) => boolean;
}

// ============================================
// NAV SECTION UNLOCK CONDITIONS
// ============================================

/**
 * Conditions for unlocking main navigation sections.
 * Sections not listed here are always visible.
 */
// Helper to count completed quests
const getCompletedQuestCount = (state: GameState): number => {
  const dailyClaimed = Object.values(state.quests.dailyQuests).filter(q => q.claimed).length;
  const weeklyClaimed = Object.values(state.quests.weeklyQuests).filter(q => q.claimed).length;
  return dailyClaimed + weeklyClaimed;
};

/**
 * Feature unlock philosophy (Game Design Audit):
 * - PRESTIGE-GATED: Complex features reserved for committed players
 * - ACTION-GATED: Prove engagement before unlocking (not just time/credits)
 * - Early game: Core loop only (plant → grow → harvest → sell)
 *
 * Goal: 1 new system per session, not 8 in 20 minutes
 */
export const NAV_UNLOCK_CONDITIONS: Partial<Record<NavSection, UnlockCondition>> = {
  // Core farming is always visible (no entry = always unlocked)

  // ACTION-GATED: Prove engagement before unlocking
  quests: {
    description: 'Unlock a second planet',
    check: state => state.planets.filter(p => p.unlocked).length >= 2,
  },

  achievements: {
    description: 'Complete 5 quests',
    check: state => getCompletedQuestCount(state) >= 5,
  },

  contracts: {
    description: 'Complete 5 quests',
    check: state => getCompletedQuestCount(state) >= 5,
  },

  managers: {
    description: 'Unlock 3 planets',
    check: state => state.planets.filter(p => p.unlocked).length >= 3,
  },

  expeditions: {
    description: 'Obtain a manager',
    check: state => state.managers.owned.length > 0,
  },

  seedex: {
    description: 'Perform 25 gacha pulls',
    check: state => state.achievements.stats.totalGachaPulls >= 25,
  },

  stats: {
    description: 'Earn 1,000 credits',
    check: state => state.prestige.lifetimeCredits >= 1000,
  },

  leaderboard: {
    description: 'Complete your first prestige',
    check: state => state.prestige.prestigeLevel >= 1,
  },

  // PRESTIGE-GATED: Complex features for committed players
  market: {
    description: 'Complete your first prestige',
    check: state => state.prestige.prestigeLevel >= 1,
  },

  research: {
    description: 'Complete your first prestige',
    check: state => state.prestige.prestigeLevel >= 1,
  },

  shop: {
    description: 'Complete your first prestige',
    check: state => state.prestige.prestigeLevel >= 1,
  },

  events: {
    description: 'Complete your first prestige',
    check: state => state.prestige.prestigeLevel >= 1,
  },

  mastery: {
    description: 'Complete 3 research projects',
    check: state => state.research.completed.length >= 3,
  },

  prestige: {
    description: `Earn ${PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE.toLocaleString()} lifetime credits`,
    check: state => state.prestige.lifetimeCredits >= PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE,
  },

  transcendence: {
    description: 'Reach prestige level 5',
    check: state => state.prestige.prestigeLevel >= 5,
  },

  galaxy: {
    description: 'Complete your first transcendence (Ascension)',
    check: state => (state.transcendence?.transcendenceLevel ?? 0) >= 1,
  },

  // daily: always visible (incentivizes return play)
};

// ============================================
// FARMING SUB-SECTION UNLOCK CONDITIONS
// ============================================

/**
 * Conditions for unlocking farming sub-sections.
 * Sub-sections not listed here are always visible.
 */
export const FARMING_UNLOCK_CONDITIONS: Partial<Record<FarmingSubSection, UnlockCondition>> = {
  // planets: always visible (no entry = always unlocked)

  seeds: {
    description: 'Perform a gacha pull',
    check: state => state.ship.seedInventory.length > 0,
  },

  gacha: {
    description: 'Complete your first export',
    check: state => state.prestige.lifetimeCredits > 0,
  },

  fusion: {
    description: 'Perform 10 gacha pulls',
    check: state => state.achievements.stats.totalGachaPulls >= 10,
  },

  inventory: {
    description: 'Collect seed essence or fuse a seed',
    check: state =>
      state.ship.resources.seedEssence > 0 || state.achievements.stats.totalSeedsFused > 0,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a nav section is unlocked
 */
export function isNavSectionUnlocked(section: NavSection, state: GameState): boolean {
  const condition = NAV_UNLOCK_CONDITIONS[section];
  return condition ? condition.check(state) : true;
}

/**
 * Check if a farming sub-section is unlocked
 */
export function isFarmingSubSectionUnlocked(
  subSection: FarmingSubSection,
  state: GameState
): boolean {
  const condition = FARMING_UNLOCK_CONDITIONS[subSection];
  return condition ? condition.check(state) : true;
}

/**
 * Get all unlocked nav sections
 */
export function getUnlockedNavSections(state: GameState): NavSection[] {
  const allSections: NavSection[] = [
    'farming',
    'managers',
    'expeditions',
    'daily',
    'events',
    'contracts',
    'quests',
    'achievements',
    'stats',
    'leaderboard',
    'market',
    'research',
    'mastery',
    'seedex',
    'prestige',
    'transcendence',
    'galaxy',
    'shop',
    'changelog',
    'ai-coop',
  ];

  return allSections.filter(section => isNavSectionUnlocked(section, state));
}

/**
 * Get all unlocked farming sub-sections
 */
export function getUnlockedFarmingSubSections(state: GameState): FarmingSubSection[] {
  // Only show these in nav - seeds/inventory still work but are redundant
  const allSubSections: FarmingSubSection[] = ['planets', 'gacha', 'fusion'];

  return allSubSections.filter(sub => isFarmingSubSectionUnlocked(sub, state));
}

/**
 * Get unlock hint for a locked section
 */
export function getUnlockHint(section: NavSection | FarmingSubSection): string | null {
  const navCondition = NAV_UNLOCK_CONDITIONS[section as NavSection];
  if (navCondition) return navCondition.description;

  const farmingCondition = FARMING_UNLOCK_CONDITIONS[section as FarmingSubSection];
  if (farmingCondition) return farmingCondition.description;

  return null;
}
