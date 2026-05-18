/**
 * Contextual Hint Service
 *
 * Evaluates player state and returns the most relevant hint to show.
 * Hints are prioritized based on player progression.
 */

import type { GameState } from '../state/GameState';

export interface ContextualHint {
  id: string;
  title: string;
  message: string;
  action?: string; // Optional call-to-action button text
  targetTab?: string; // Tab to navigate to when clicked
  priority: number; // Lower = higher priority
}

/**
 * Get the most relevant contextual hint based on current game state
 */
export function getContextualHint(state: GameState): ContextualHint | null {
  // Check if hints are globally disabled
  if (!state.hints) return null;

  const dismissed = new Set(state.hints.dismissed);
  const hints = evaluateHints(state, dismissed);

  // Return highest priority non-dismissed hint
  return hints.length > 0 ? hints[0] : null;
}

/**
 * Get all applicable hints (for debugging or showing multiple)
 */
export function getAllContextualHints(state: GameState): ContextualHint[] {
  if (!state.hints) return [];

  const dismissed = new Set(state.hints.dismissed);
  return evaluateHints(state, dismissed);
}

function evaluateHints(state: GameState, dismissed: Set<string>): ContextualHint[] {
  const hints: ContextualHint[] = [];
  const totalSeeds = state.ship.seedInventory.length;
  const totalPlantedSeeds = state.planets.reduce((acc, p) => acc + p.seeds.length, 0);
  const credits = state.ship.totalCurrency;
  const hasPrestiged = state.prestige.prestigeLevel > 0;

  // ================================================
  // EARLY GAME HINTS (Priority 1-10)
  // ================================================

  // 1. No seeds at all - need to gacha
  if (totalSeeds === 0 && totalPlantedSeeds === 0 && !state.hints.firstGachaPull) {
    if (!dismissed.has('hint_first_pull')) {
      hints.push({
        id: 'hint_first_pull',
        title: 'Welcome to Space Farming!',
        message: 'Pull your first seed from the Gacha to start your interstellar farm.',
        action: 'Go to Seeds',
        targetTab: 'gacha',
        priority: 1,
      });
    }
  }

  // 2. Has seeds but none planted
  if (totalSeeds > 0 && totalPlantedSeeds === 0 && !state.hints.firstSeedPlanted) {
    if (!dismissed.has('hint_first_plant')) {
      hints.push({
        id: 'hint_first_plant',
        title: 'Plant Your Seed',
        message:
          'Click on Terra Prime and tap "Manage" to plant your seed and start earning credits.',
        action: 'Go to Planets',
        targetTab: 'planets',
        priority: 2,
      });
    }
  }

  // 3. Has planted seeds but hasn't exported yet
  if (totalPlantedSeeds > 0 && !state.hints.firstExport && credits === 0) {
    if (!dismissed.has('hint_wait_export')) {
      hints.push({
        id: 'hint_wait_export',
        title: 'Production Started',
        message: 'Your plants are growing! Plants will export to your ship continuously.',
        priority: 3,
      });
    }
  }

  // ================================================
  // UPGRADE HINTS (Priority 20-29)
  // ================================================

  // 4. Has credits but no planet upgrades - suggest production rate
  const terraPrime = state.planets.find(p => p.id === 'terra-prime');
  const productionUpgrades = terraPrime?.upgrades.productionRate ?? 0;

  if (credits >= 10 && productionUpgrades === 0 && !dismissed.has('hint_first_upgrade')) {
    hints.push({
      id: 'hint_first_upgrade',
      title: 'Boost Production',
      message: `You have ${Math.floor(credits)} credits. Try upgrading Production Rate on Terra Prime to grow plants faster!`,
      action: 'Go to Planets',
      targetTab: 'planets',
      priority: 20,
    });
  }

  // 5. Can afford an upgrade - reminder for early game
  const totalUpgrades = state.planets.reduce(
    (sum, p) =>
      sum + p.upgrades.productionRate + p.upgrades.exportSpeed + p.upgrades.storageCapacity,
    0
  );
  if (
    totalUpgrades > 0 &&
    totalUpgrades < 10 &&
    credits >= 50 &&
    !dismissed.has('hint_upgrade_reminder')
  ) {
    hints.push({
      id: 'hint_upgrade_reminder',
      title: 'Upgrade Available',
      message: 'You can afford more upgrades! Upgrades compound to boost your production.',
      action: 'Go to Planets',
      targetTab: 'planets',
      priority: 25,
    });
  }

  // ================================================
  // FUSION HINTS (Priority 30-39)
  // ================================================

  // 6. Has duplicates that can be fused
  const seedCounts = new Map<string, number>();
  for (const item of state.ship.seedInventory) {
    // Only count actual seeds, not fodder
    if ('tier' in item && 'id' in item) {
      const key = `${item.id}-${item.tier}`;
      seedCounts.set(key, (seedCounts.get(key) || 0) + 1);
    }
  }
  const hasFusionPair = Array.from(seedCounts.values()).some(count => count >= 2);

  if (hasFusionPair && !state.hints.firstFusion && !dismissed.has('hint_fusion_available')) {
    hints.push({
      id: 'hint_fusion_available',
      title: 'Fusion Ready',
      message:
        'You have matching seeds! Fuse 2 identical seeds to create a higher tier with better production.',
      action: 'Go to Fusion',
      targetTab: 'fusion',
      priority: 30,
    });
  }

  // ================================================
  // PRESTIGE HINTS (Priority 40-49)
  // ================================================

  // 7. Prestige is available and beneficial
  const prestigeThreshold = 100; // Minimum prestige points to suggest prestige
  const pendingPrestige = state.prestige.prestigePoints;

  if (
    pendingPrestige >= prestigeThreshold &&
    !hasPrestiged &&
    !dismissed.has('hint_first_prestige')
  ) {
    hints.push({
      id: 'hint_first_prestige',
      title: 'Ready to Prestige',
      message: `You have earned ${pendingPrestige} Prestige Points! Prestige to gain permanent bonuses.`,
      action: 'View Prestige',
      targetTab: 'prestige',
      priority: 40,
    });
  }

  // 8. Has prestiged but could prestige again
  if (
    hasPrestiged &&
    pendingPrestige >= prestigeThreshold &&
    state.prestige.prestigeLevel < 5 &&
    !dismissed.has('hint_prestige_again')
  ) {
    hints.push({
      id: 'hint_prestige_again',
      title: 'Prestige Again?',
      message:
        'Each prestige makes you stronger. Consider prestiging again to accelerate your progress!',
      action: 'View Prestige',
      targetTab: 'prestige',
      priority: 45,
    });
  }

  // ================================================
  // PLANET HINTS (Priority 50-59)
  // ================================================

  // 9. Can unlock a new planet
  const lockedPlanets = state.planets.filter(p => !p.unlocked);
  const affordablePlanet = lockedPlanets.find(p => credits >= p.unlockCost);

  if (affordablePlanet && state.planets.filter(p => p.unlocked).length < 3) {
    if (!dismissed.has('hint_unlock_planet')) {
      hints.push({
        id: 'hint_unlock_planet',
        title: 'New Planet Available',
        message: `You can unlock ${affordablePlanet.name}! More planets means more production capacity.`,
        action: 'View Planets',
        targetTab: 'planets',
        priority: 50,
      });
    }
  }

  // ================================================
  // MANAGER HINTS (Priority 60-69)
  // ================================================

  // 10. Has manager crystals but no managers
  const managerCrystals = state.ship.crystals;
  const totalManagers = state.managers?.owned?.length ?? 0;

  if (managerCrystals >= 100 && totalManagers === 0 && !dismissed.has('hint_recruit_manager')) {
    hints.push({
      id: 'hint_recruit_manager',
      title: 'Recruit a Manager',
      message: 'You have Crystals! Recruit managers to boost planets and launch expeditions.',
      action: 'View Managers',
      targetTab: 'managers',
      priority: 60,
    });
  }

  // Sort by priority (lower = higher priority)
  hints.sort((a, b) => a.priority - b.priority);

  return hints;
}

/**
 * Check if a specific hint should show based on conditions
 */
export function shouldShowHint(state: GameState, hintId: string): boolean {
  const hint = getContextualHint(state);
  return hint?.id === hintId;
}
