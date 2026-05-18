/**
 * Game Systems - Public API
 */

// Core Systems
export * from './GachaSystem';
export * from './FusionSystem';
export * from './UpgradeSystem';
export * from './ProductionSystem';
export * from './ResearchSystem';
export * from './RefinementSystem';
export * from './PrestigeSystem';
export * from './TranscendenceSystem';

// Progression Systems
export * from './QuestSystem';
export * from './AchievementSystem';
export * from './MasterySystem';

// Event Systems
export * from './EventSystem';
// DailyChallengeSystem has some exports that conflict with EventSystem
// Import directly from './DailyChallengeSystem' for full API
export {
  type DailyChallengeState,
  type ChallengeType,
  type ChallengeReward,
  type ClaimResult,
  createInitialDailyChallengeState,
  needsChallengeRefresh,
  refreshDailyChallenges,
  updateChallengeProgress as updateDailyChallengeProgress,
  updateSellProgress,
  claimChallengeReward as claimDailyChallengeReward,
  claimAllRewards,
  getUnclaimedChallenges,
  getStreakShieldInfo,
  DAILY_CHALLENGE_CONFIG,
} from './DailyChallengeSystem';
export * from './DailyLoginSystem';

// Manager & Expedition Systems
export * from './ManagerSystem';
export * from './ExpeditionSystem';

// Utility Systems
export * from './BreedingSystem';
export * from './AnomalySystem';
export * from './MysteriousBonusSystem';
export * from './AffinitySystem';
export * from './MarketSystem';

// Note: FarmingSystem was removed — all logic lives server-side in convex/farming.ts
