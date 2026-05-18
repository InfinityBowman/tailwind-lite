/**
 * Seedex System - "Gotta Catch 'Em All" Collection Tracking
 *
 * Tracks which seeds the player has discovered, their highest tiers,
 * and provides rewards for completing collections.
 */

import { SEED_TYPES, ALL_SEED_IDS, type SeedFamily, SEED_FAMILY_INFO } from '../config/seeds';
import { MAX_SEED_TIER } from '../config/balance';

// ============================================
// TYPES
// ============================================

export interface SeedexTierDiscovery {
  firstDiscovered: number; // timestamp
}

export interface SeedexEntry {
  seedId: string;
  discovered: boolean;
  highestTier: number;
  tiersDiscovered: Record<number, SeedexTierDiscovery>;
}

export interface SeedexFamilyProgress {
  family: SeedFamily;
  discovered: number;
  total: number;
  complete: boolean;
}

export interface SeedexState {
  entries: Record<string, SeedexEntry>;
  familyProgress: Record<SeedFamily, SeedexFamilyProgress>;
  totalDiscovered: number;
  totalPossible: number;
  claimedRewards: string[]; // reward IDs that have been claimed
}

// ============================================
// REWARDS
// ============================================

export interface SeedexReward {
  id: string;
  name: string;
  description: string;
  type: 'seed_discovery' | 'tier_discovery' | 'family_complete' | 'tier_complete' | 'full_complete';
  requirement: {
    seedId?: string;
    tier?: number;
    family?: SeedFamily;
  };
  reward: {
    credits?: number;
    crystals?: number;
    essence?: number;
  };
}

// Rewards for discovering seeds and completing collections
export const SEEDEX_REWARDS: SeedexReward[] = [
  // Per-seed discovery rewards (10 seeds)
  ...ALL_SEED_IDS.map(
    (seedId): SeedexReward => ({
      id: `discover_${seedId}`,
      name: `Discover ${SEED_TYPES[seedId].name.replace(' Seeds', '')}`,
      description: `First time obtaining ${SEED_TYPES[seedId].name}`,
      type: 'seed_discovery',
      requirement: { seedId },
      reward: { credits: 50 },
    })
  ),

  // Per-tier milestone rewards (tiers 3-6 for any seed)
  {
    id: 'first_rare',
    name: 'Rare Find',
    description: 'Obtain your first Rare seed',
    type: 'tier_discovery',
    requirement: { tier: 3 },
    reward: { essence: 25 },
  },
  {
    id: 'first_epic',
    name: 'Epic Discovery',
    description: 'Obtain your first Epic seed',
    type: 'tier_discovery',
    requirement: { tier: 4 },
    reward: { essence: 50, crystals: 5 },
  },
  {
    id: 'first_legendary',
    name: 'Legendary Achievement',
    description: 'Obtain your first Legendary seed',
    type: 'tier_discovery',
    requirement: { tier: 5 },
    reward: { essence: 100, crystals: 10 },
  },
  {
    id: 'first_mythic',
    name: 'Mythic Mastery',
    description: 'Obtain your first Mythic seed',
    type: 'tier_discovery',
    requirement: { tier: 6 },
    reward: { crystals: 25 },
  },

  // Family completion rewards
  ...(['bio', 'solar', 'lunar', 'crystal', 'primal', 'void'] as SeedFamily[]).map(
    (family): SeedexReward => ({
      id: `family_${family}`,
      name: `${SEED_FAMILY_INFO[family].name} Collector`,
      description: `Discover all ${SEED_FAMILY_INFO[family].name} family seeds`,
      type: 'family_complete',
      requirement: { family },
      reward: { crystals: 15 },
    })
  ),

  // Full completion rewards
  {
    id: 'all_seeds_discovered',
    name: 'Seed Curator',
    description: 'Discover all seed types',
    type: 'full_complete',
    requirement: {},
    reward: { crystals: 50 },
  },
  {
    id: 'all_seeds_legendary',
    name: 'Legendary Curator',
    description: 'Obtain Legendary tier for all seed types',
    type: 'tier_complete',
    requirement: { tier: 5 },
    reward: { crystals: 100 },
  },
  {
    id: 'all_seeds_mythic',
    name: 'Mythic Master',
    description: 'Obtain Mythic tier for all seed types',
    type: 'tier_complete',
    requirement: { tier: 6 },
    reward: { crystals: 250 },
  },
];

// ============================================
// FACTORY FUNCTIONS
// ============================================

function createEmptyEntry(seedId: string): SeedexEntry {
  return {
    seedId,
    discovered: false,
    highestTier: 0,
    tiersDiscovered: {},
  };
}

function getSeedsInFamily(family: SeedFamily): string[] {
  return ALL_SEED_IDS.filter(id => SEED_TYPES[id].family === family);
}

export function createInitialSeedexState(): SeedexState {
  // Initialize entries for all seeds
  const entries: Record<string, SeedexEntry> = {};
  for (const seedId of ALL_SEED_IDS) {
    entries[seedId] = createEmptyEntry(seedId);
  }

  // Initialize family progress
  const families: SeedFamily[] = ['bio', 'solar', 'lunar', 'crystal', 'primal', 'void'];
  const familyProgress: Record<SeedFamily, SeedexFamilyProgress> = {} as Record<
    SeedFamily,
    SeedexFamilyProgress
  >;

  for (const family of families) {
    const seedsInFamily = getSeedsInFamily(family);
    familyProgress[family] = {
      family,
      discovered: 0,
      total: seedsInFamily.length,
      complete: false,
    };
  }

  return {
    entries,
    familyProgress,
    totalDiscovered: 0,
    totalPossible: ALL_SEED_IDS.length,
    claimedRewards: [],
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Record a seed discovery/acquisition
 * Returns the new discovery info if this was a new discovery
 */
export interface DiscoveryResult {
  isNewSeed: boolean;
  isNewTier: boolean;
  seedId: string;
  tier: number;
  newHighestTier: boolean;
}

export function recordSeedDiscovery(
  state: SeedexState,
  seedId: string,
  tier: number
): DiscoveryResult {
  const entry = state.entries[seedId];
  if (!entry) {
    // Unknown seed, shouldn't happen
    return {
      isNewSeed: false,
      isNewTier: false,
      seedId,
      tier,
      newHighestTier: false,
    };
  }

  const wasDiscovered = entry.discovered;
  const hadTier = entry.tiersDiscovered[tier] !== undefined;
  const wasHighest = entry.highestTier;

  // Update entry
  if (!entry.discovered) {
    entry.discovered = true;
    state.totalDiscovered++;

    // Update family progress
    const family = SEED_TYPES[seedId].family;
    state.familyProgress[family].discovered++;
    if (state.familyProgress[family].discovered >= state.familyProgress[family].total) {
      state.familyProgress[family].complete = true;
    }
  }

  if (!hadTier) {
    entry.tiersDiscovered[tier] = { firstDiscovered: Date.now() };
  }

  if (tier > entry.highestTier) {
    entry.highestTier = tier;
  }

  return {
    isNewSeed: !wasDiscovered,
    isNewTier: !hadTier,
    seedId,
    tier,
    newHighestTier: tier > wasHighest,
  };
}

/**
 * Get available (unclaimed) rewards based on current state
 */
export function getAvailableRewards(state: SeedexState): SeedexReward[] {
  return SEEDEX_REWARDS.filter(reward => {
    // Already claimed?
    if (state.claimedRewards.includes(reward.id)) {
      return false;
    }

    // Check requirement
    switch (reward.type) {
      case 'seed_discovery':
        return reward.requirement.seedId && state.entries[reward.requirement.seedId]?.discovered;

      case 'tier_discovery': {
        // Any seed at this tier?
        const targetTier = reward.requirement.tier!;
        return ALL_SEED_IDS.some(id => state.entries[id]?.tiersDiscovered[targetTier]);
      }

      case 'family_complete':
        return (
          reward.requirement.family && state.familyProgress[reward.requirement.family]?.complete
        );

      case 'tier_complete': {
        // All seeds at this tier?
        const targetTier = reward.requirement.tier!;
        return ALL_SEED_IDS.every(id => state.entries[id]?.tiersDiscovered[targetTier]);
      }

      case 'full_complete':
        return state.totalDiscovered >= state.totalPossible;

      default:
        return false;
    }
  });
}

/**
 * Claim a reward
 */
export function claimReward(state: SeedexState, rewardId: string): SeedexReward | null {
  const available = getAvailableRewards(state);
  const reward = available.find(r => r.id === rewardId);

  if (!reward) {
    return null;
  }

  state.claimedRewards.push(rewardId);
  return reward;
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(state: SeedexState): number {
  if (state.totalPossible === 0) return 0;
  return Math.round((state.totalDiscovered / state.totalPossible) * 100);
}

/**
 * Get tier completion stats (how many seeds have reached each tier)
 */
export function getTierCompletionStats(state: SeedexState): Record<number, number> {
  const stats: Record<number, number> = {};

  for (let tier = 1; tier <= MAX_SEED_TIER; tier++) {
    stats[tier] = ALL_SEED_IDS.filter(id => state.entries[id]?.tiersDiscovered[tier]).length;
  }

  return stats;
}
