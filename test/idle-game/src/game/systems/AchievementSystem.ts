/**
 * Achievement System - Display helpers for achievement UI
 *
 * Achievement logic lives server-side in convex/rewards.ts.
 */

import {
  ACHIEVEMENT_DEFINITIONS,
  ALL_ACHIEVEMENT_IDS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementsByCategory,
  type AchievementDefinition,
  type AchievementCategory,
} from '../config/achievements';

// ============================================
// ACHIEVEMENT STATE TYPES
// ============================================

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: number; // Timestamp when unlocked
  claimed: boolean;
}

export interface AchievementStats {
  totalPlantsSold: number;
  totalCreditsEarned: number;
  totalGachaPulls: number;
  totalSeedsFused: number;
  totalPlantsRefined: number;
  totalPlantsExtracted: number;
  maxSeedTierCreated: number;
  uniqueSeedTypesOwned: Set<string>; // Set in memory (runtime)
  planetsUnlocked: number;
  researchCompleted: number;
  prestigeCount: number;
  // Breeding stats
  totalSeedsBred: number;
  totalTraitsDiscovered: number;
  totalRecipesDiscovered: number;
  totalLegendaryTraits: number;
  // Gacha pity tracking
  consecutiveFodders: number; // Reset to 0 on seed pull
}

export interface AchievementState {
  achievements: Record<string, AchievementProgress>;
  // Lifetime statistics for tracking (persists through prestige)
  stats: AchievementStats;
}

// Serialized version for storage (Set becomes string[])
export interface SerializedAchievementState {
  achievements: Record<string, AchievementProgress>;
  stats: Omit<AchievementStats, 'uniqueSeedTypesOwned'> & {
    uniqueSeedTypesOwned: string[];
  };
}

// ============================================
// DESERIALIZATION
// ============================================

/**
 * Deserialize achievement state from save (convert array to Set)
 * Accepts SerializedAchievementState or compatible types from GameState
 */
export function deserializeAchievementState(
  state:
    | SerializedAchievementState
    | {
        achievements: Record<string, AchievementProgress>;
        stats: {
          totalPlantsSold: number;
          totalCreditsEarned: number;
          totalGachaPulls: number;
          totalSeedsFused: number;
          totalPlantsRefined: number;
          totalPlantsExtracted?: number;
          maxSeedTierCreated: number;
          uniqueSeedTypesOwned: string[];
          planetsUnlocked: number;
          researchCompleted: number;
          prestigeCount: number;
          // Optional breeding stats (backwards compatibility)
          totalSeedsBred?: number;
          totalTraitsDiscovered?: number;
          totalRecipesDiscovered?: number;
          totalLegendaryTraits?: number;
          // Gacha pity tracking (optional for backwards compat)
          consecutiveFodders?: number;
        };
      }
): AchievementState {
  return {
    ...state,
    stats: {
      ...state.stats,
      // Provide default for new stat fields (backwards compatibility)
      totalPlantsExtracted: state.stats.totalPlantsExtracted ?? 0,
      uniqueSeedTypesOwned: new Set(state.stats.uniqueSeedTypesOwned),
      // Breeding stats with defaults
      totalSeedsBred: state.stats.totalSeedsBred ?? 0,
      totalTraitsDiscovered: state.stats.totalTraitsDiscovered ?? 0,
      totalRecipesDiscovered: state.stats.totalRecipesDiscovered ?? 0,
      totalLegendaryTraits: state.stats.totalLegendaryTraits ?? 0,
      // Gacha pity tracking with default
      consecutiveFodders: state.stats.consecutiveFodders ?? 0,
    },
  };
}

// ============================================
// ACHIEVEMENT QUERIES
// ============================================

/**
 * Get achievement progress percentage (0-100)
 */
export function getAchievementProgressPercent(achievementId: string, progress: number): number {
  const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
  if (!achievement) return 0;
  return Math.min(100, Math.round((progress / achievement.target) * 100));
}

/**
 * Get all unlocked but unclaimed achievements
 */
export function getClaimableAchievements(state: AchievementState): AchievementDefinition[] {
  const claimable: AchievementDefinition[] = [];

  for (const achievementId of ALL_ACHIEVEMENT_IDS) {
    const progress = state.achievements[achievementId];
    if (progress?.unlocked && !progress.claimed) {
      const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
      if (achievement) claimable.push(achievement);
    }
  }

  return claimable;
}

/**
 * Get count of unclaimed achievements
 */
export function getUnclaimedAchievementCount(state: AchievementState): number {
  return getClaimableAchievements(state).length;
}

/**
 * Get total unlocked achievement count
 */
export function getUnlockedAchievementCount(state: AchievementState): number {
  return Object.values(state.achievements).filter(a => a.unlocked).length;
}

/**
 * Get total achievement count
 */
export function getTotalAchievementCount(): number {
  return ALL_ACHIEVEMENT_IDS.length;
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get all achievements with their current progress for a category
 */
export function getAchievementsWithProgress(
  state: AchievementState,
  category?: AchievementCategory
): Array<{
  achievement: AchievementDefinition;
  progress: number;
  unlocked: boolean;
  claimed: boolean;
  percent: number;
  visible: boolean;
}> {
  const achievementIds = category
    ? getAchievementsByCategory(category).map(a => a.id)
    : ALL_ACHIEVEMENT_IDS;

  return achievementIds.map(achievementId => {
    const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
    const progressData = state.achievements[achievementId];
    const progress = progressData?.progress || 0;
    const unlocked = progressData?.unlocked || false;
    const claimed = progressData?.claimed || false;

    // Hidden achievements are not visible until unlocked
    const visible = !achievement.hidden || unlocked;

    return {
      achievement,
      progress,
      unlocked,
      claimed,
      percent: getAchievementProgressPercent(achievementId, progress),
      visible,
    };
  });
}

/**
 * Get achievement categories with completion counts
 */
export function getCategoryStats(state: AchievementState): Array<{
  category: AchievementCategory;
  name: string;
  icon: string;
  color: string;
  unlocked: number;
  total: number;
}> {
  const categories = Object.keys(ACHIEVEMENT_CATEGORIES) as AchievementCategory[];

  return categories.map(category => {
    const categoryAchievements = getAchievementsByCategory(category);
    const unlockedCount = categoryAchievements.filter(
      a => state.achievements[a.id]?.unlocked
    ).length;

    return {
      category,
      ...ACHIEVEMENT_CATEGORIES[category],
      unlocked: unlockedCount,
      total: categoryAchievements.length,
    };
  });
}
