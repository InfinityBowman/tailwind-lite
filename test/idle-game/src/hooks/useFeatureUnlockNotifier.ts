/**
 * Feature Unlock Notifier Hook
 *
 * Tracks which features have been unlocked and shows toast notifications
 * when new features become available. Persists "seen" state to localStorage
 * to avoid re-notifying on game reload.
 */

import { useEffect, useRef } from 'react';
import type { GameState } from '@/game/state/GameState';
import type { Section, FarmingSubSection } from '@/router';
import { getUnlockedNavSections, getUnlockedFarmingSubSections } from '@/game/config/unlocks';
import { useToast } from '@/components/ui/ToastProvider';

const STORAGE_KEY = 'spacefarm_notified_unlocks';

// Human-friendly names for features
const FEATURE_NAMES: Partial<Record<Section | FarmingSubSection, string>> = {
  farming: 'Farming',
  managers: 'Managers',
  expeditions: 'Expeditions',
  events: 'Events',
  contracts: 'Contracts',
  quests: 'Quests',
  achievements: 'Achievements',
  research: 'Research',
  mastery: 'Mastery',
  prestige: 'Prestige',
  transcendence: 'Transcendence',
  shop: 'Shop',
  daily: 'Daily Login',
  stats: 'Statistics',
  leaderboard: 'Leaderboard',
  market: 'Market',
  gacha: 'Gacha',
  fusion: 'Fusion',
  seeds: 'Seeds',
  inventory: 'Inventory',
  planets: 'Planets',
};

function getNotifiedUnlocks(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Invalid storage, start fresh
  }
  return new Set();
}

function saveNotifiedUnlocks(unlocks: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocks]));
  } catch {
    // Storage full or unavailable, ignore
  }
}

/**
 * Hook that monitors feature unlocks and shows toast notifications.
 * Should be placed at the app level, inside ToastProvider.
 *
 * When state is null (loading), the hook does nothing.
 */
export function useFeatureUnlockNotifier(state: GameState | null): void {
  const { addToast } = useToast();
  const notifiedRef = useRef<Set<string>>(getNotifiedUnlocks());
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip when loading
    if (!state) return;

    // Get currently unlocked features
    const navUnlocks = getUnlockedNavSections(state);
    const farmingUnlocks = getUnlockedFarmingSubSections(state);
    const allUnlocks = [...navUnlocks, ...farmingUnlocks.map(f => `farming:${f}`)];

    // Find new unlocks (not yet notified)
    const newUnlocks = allUnlocks.filter(u => !notifiedRef.current.has(u));

    // On first run, just record current state without toasting
    // (player has already seen these features)
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (newUnlocks.length > 0) {
        newUnlocks.forEach(u => notifiedRef.current.add(u));
        saveNotifiedUnlocks(notifiedRef.current);
      }
      return;
    }

    // Show toast for each new unlock
    newUnlocks.forEach(unlock => {
      // Parse the unlock key
      const isFarmingSub = unlock.startsWith('farming:');
      const featureKey = isFarmingSub ? unlock.replace('farming:', '') : unlock;
      const featureName = FEATURE_NAMES[featureKey as Section | FarmingSubSection] || featureKey;

      // Don't toast for base features that are always unlocked
      if (
        featureKey === 'farming' ||
        featureKey === 'daily' ||
        featureKey === 'planets' ||
        featureKey === 'changelog'
      ) {
        notifiedRef.current.add(unlock);
        return;
      }

      // Show toast
      addToast(`New Feature Unlocked: ${featureName}!`, 'success', 4000);

      // Mark as notified
      notifiedRef.current.add(unlock);
    });

    // Save updated notified list
    if (newUnlocks.length > 0) {
      saveNotifiedUnlocks(notifiedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally selective deps for performance
  }, [
    state?.prestige.lifetimeCredits,
    state?.prestige.prestigeLevel,
    state?.planets,
    state?.managers.owned.length,
    state?.quests.dailyQuests,
    state?.quests.weeklyQuests,
    state?.research.completed.length,
    state?.research.refinedEssence,
    state?.ship.seedInventory.length,
    state?.ship.resources.seedEssence,
    state?.achievements.stats.totalSeedsFused,
    addToast,
  ]);
}

/**
 * Reset notified unlocks (for testing or fresh start)
 */
export function resetNotifiedUnlocks(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export default useFeatureUnlockNotifier;
