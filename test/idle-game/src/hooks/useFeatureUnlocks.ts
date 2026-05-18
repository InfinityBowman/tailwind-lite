/**
 * Feature Unlocks Hook
 *
 * Provides reactive unlock state for UI features based on game progress.
 * Used by Sidebar and other components to show/hide features progressively.
 */

import { useMemo } from 'react';
import type { GameState } from '@/game/state/GameState';
import type { Section, FarmingSubSection } from '@/router';

// Alias for backwards compatibility
type NavSection = Section;
import {
  getUnlockedNavSections,
  getUnlockedFarmingSubSections,
  getUnlockHint,
} from '@/game/config/unlocks';

export interface FeatureUnlocks {
  /** Check if a nav section is unlocked */
  isNavUnlocked: (section: NavSection) => boolean;
  /** Check if a farming sub-section is unlocked */
  isFarmingUnlocked: (subSection: FarmingSubSection) => boolean;
  /** List of unlocked nav sections */
  unlockedNavSections: NavSection[];
  /** List of unlocked farming sub-sections */
  unlockedFarmingSubSections: FarmingSubSection[];
  /** Get unlock hint for a locked feature */
  getHint: (section: NavSection | FarmingSubSection) => string | null;
}

/**
 * Hook to get feature unlock state based on current game state.
 * Memoizes results to avoid unnecessary recalculations.
 *
 * Note: Dependencies use derived scalar values, not object references,
 * to prevent recalculation on every game tick.
 *
 * When state is null (loading), returns default locked values.
 */
export function useFeatureUnlocks(state: GameState | null): FeatureUnlocks {
  // Derive scalar values for memoization (avoids object reference comparisons)
  // Use defaults when state is null (loading)
  const unlockedPlanetCount = Array.isArray(state?.planets)
    ? state.planets.filter(p => p.unlocked).length
    : 0;
  const hasClaimedQuest = state
    ? Object.values(state.quests.dailyQuests).some(q => q.claimed) ||
      Object.values(state.quests.weeklyQuests).some(q => q.claimed)
    : false;

  const unlockedNavSections = useMemo(
    () => (state ? getUnlockedNavSections(state) : ['farming' as NavSection]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally selective deps for performance
    [
      // Scalar dependencies that affect nav unlocks
      state?.prestige.lifetimeCredits,
      state?.prestige.prestigeLevel,
      unlockedPlanetCount,
      state?.managers.owned.length,
      hasClaimedQuest,
      state?.research.completed.length,
      state?.research.refinedEssence,
    ]
  );

  const unlockedFarmingSubSections = useMemo(
    () => (state ? getUnlockedFarmingSubSections(state) : ['planets' as FarmingSubSection]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally selective deps for performance
    [
      // Scalar dependencies that affect farming sub-section unlocks
      state?.ship.seedInventory.length,
      state?.ship.resources.seedEssence,
      state?.prestige.lifetimeCredits,
      state?.achievements.stats.totalSeedsFused,
    ]
  );

  const isNavUnlocked = useMemo(
    () => (section: NavSection) => unlockedNavSections.includes(section),
    [unlockedNavSections]
  );

  const isFarmingUnlocked = useMemo(
    () => (subSection: FarmingSubSection) => unlockedFarmingSubSections.includes(subSection),
    [unlockedFarmingSubSections]
  );

  return {
    isNavUnlocked,
    isFarmingUnlocked,
    unlockedNavSections,
    unlockedFarmingSubSections,
    getHint: getUnlockHint,
  };
}

export default useFeatureUnlocks;
