/**
 * Game Module - Public API
 *
 * This module contains all game logic with zero React dependencies.
 * It can be used standalone for testing, in web workers, or anywhere JS runs.
 */

// Core
export {
  EventBus,
  eventBus,
  type GameEvent,
  type GameEventType,
  type EventHandler,
} from './core/EventBus';
export { SaveManager, saveManager, type SaveData } from './core/SaveManager';

// State
export {
  type GameState,
  type PlanetState,
  type ShipState,
  type ShipResources,
  type GameModifiers,
  type SeedInstance,
  type FodderInstance,
  type InventoryItem,
  type PlantData,
  type ResourceAnalytics,
  type PrestigeStateData,
  type QuestStateData,
  type QuestProgressData,
  type MysteriousBonusType,
  type MysteriousBonusState,
  type HintsState,
  type MasteryStateData,
  MYSTERIOUS_BONUS_DESCRIPTIONS,
  isFodder,
  isSeed,
  createInitialGameState,
  createInitialPlanetState,
  createInitialShipState,
  createInitialModifiers,
  createInitialAnalytics,
  createInitialPrestigeState,
  createInitialQuestState,
  createInitialMysteriousBonusState,
  createInitialMasteryState,
  createInitialHintsState,
  createPostPrestigeGameState,
} from './state/GameState';

// Config
export {
  GACHA_CONFIG,
  SEED_TIERS,
  MAX_SEED_TIER,
  UPGRADE_CONFIG,
  SAVE_CONFIG,
  GAME_LOOP_CONFIG,
  STARTING_CREDITS,
  STARTING_CRYSTALS,
  type UpgradeType,
} from './config/balance';

export {
  SEED_TYPES,
  FODDER_MATERIAL,
  ALL_SEED_IDS,
  SEED_FAMILY_INFO,
  type SeedTypeDefinition,
  type SeedFamily,
} from './config/seeds';

export { PLANET_DEFINITIONS, STARTING_PLANET_IDS, type PlanetDefinition } from './config/planets';

export {
  MASTERY_PER_HARVEST,
  MAX_MASTERY,
  MASTERY_BONUS_PER_LEVEL,
  MASTERY_MILESTONES,
  TOTAL_MASTERY_MILESTONES,
  getMasteryProductionBonus,
  getMasterySellBonus,
  getMasteryGain,
  getUnlockedMilestones,
  getNextMilestone,
  getTotalMasteryBonus,
  type MasteryMilestone,
  type TotalMasteryMilestone,
} from './config/mastery';

// Systems
export {
  generateUniqueId,
  getTierName,
  type GachaPullResult,
  type GachaMultiPullResult,
} from './systems/GachaSystem';

export { getFusionEssenceCost, type FusionResult } from './systems/FusionSystem';

export {
  UPGRADE_TYPES,
  UPGRADE_NAMES,
  calculateUpgradeCost,
  getUpgradeEffectDescription,
} from './systems/UpgradeSystem';

export {
  getPlantSellValue,
  getAllPlantSellValues,
  getTraitModifiers,
} from './systems/ProductionSystem';

export {
  getAffinityBonus,
  getAffinityMultiplier,
  hasAffinity,
  getAffinityDescription,
  getFamiliesWithAffinity,
  TRAIT_FAMILY_AFFINITY,
} from './systems/AffinitySystem';

export {
  getAvailableResearch,
  getGachaCostMultiplier,
  getFusionCostMultiplier,
  getRefinementEfficiencyBonus,
  isAutoFuseUnlocked,
  isManagersUnlocked,
  type ResearchState,
} from './systems/ResearchSystem';

export { getRefinementPreviews, type RefinementPreview } from './systems/RefinementSystem';

// Research config
export {
  RESEARCH_NODES,
  ALL_RESEARCH_IDS,
  getResearchByTier,
  MAX_RESEARCH_TIER,
  type ResearchNode,
  type ResearchEffect,
  type ResearchEffectType,
} from './config/research';

// Refinement config
export {
  REFINEMENT_RECIPES,
  getRefinementRecipe,
  calculateRefinementOutput,
  type RefinementRecipe,
} from './config/refinement';

// Prestige system
export {
  canPrestige,
  getAllBonusesWithState,
  getProjectedPrestigePoints,
  type PrestigeState,
} from './systems/PrestigeSystem';

// Prestige config
export {
  PRESTIGE_CONFIG,
  PRESTIGE_BONUSES,
  calculatePrestigePoints,
  getPrestigeBonusCost,
  getPrestigeBonusValue,
  type PrestigeBonus,
  type PrestigeEffectType,
} from './config/prestige';

// Transcendence system (Layer 2 Prestige)
export {
  canTranscend,
  getAllTranscendenceBonusesWithState,
  getProjectedTranscendencePoints,
  type TranscendenceState,
} from './systems/TranscendenceSystem';

// Transcendence config
export {
  TRANSCENDENCE_CONFIG,
  TRANSCENDENCE_BONUSES,
  calculateTranscendencePoints,
  getTranscendenceBonusCost,
  getTranscendenceBonusValue,
  type TranscendenceBonus,
  type TranscendenceEffectType,
} from './config/transcendence';

// Quest system
export {
  formatTimeUntilReset,
  getUnclaimedQuestCount,
  getDailyQuestsWithProgress,
  getWeeklyQuestsWithProgress,
  type QuestState,
  type QuestProgress,
} from './systems/QuestSystem';

// Quest config
export {
  QUEST_DEFINITIONS,
  QUEST_RESET_INTERVALS,
  ALL_QUEST_IDS,
  DAILY_QUEST_IDS,
  WEEKLY_QUEST_IDS,
  getQuestsByType,
  getQuestsByCategory,
  type QuestDefinition,
  type QuestType,
  type QuestCategory,
  type QuestReward,
  type RewardType,
} from './config/quests';

// Achievement system
export {
  deserializeAchievementState,
  getUnclaimedAchievementCount,
  getUnlockedAchievementCount,
  getTotalAchievementCount,
  getAchievementsWithProgress,
  getCategoryStats,
  type AchievementState,
  type AchievementProgress,
} from './systems/AchievementSystem';

// Achievement config
export {
  ACHIEVEMENT_DEFINITIONS,
  ALL_ACHIEVEMENT_IDS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIER_COLORS,
  getAchievementsByCategory,
  getAchievementsByTier,
  getVisibleAchievements,
  type AchievementDefinition,
  type AchievementCategory,
  type AchievementTier,
  type AchievementReward,
  type AchievementRewardType,
} from './config/achievements';

// Crystal shop config
export { CRYSTAL_SHOP_ITEMS, type CrystalShopItem } from './config/crystalShop';

// Manager system
export {
  createInitialManagerState,
  canAffordPull as canAffordManagerPull,
  getManagerForPlanet,
  calculateManagerProductionBonus,
  calculateGlobalSecondaryBonuses,
  getAwakenedManagersWithBonuses,
  getCollectionStats,
  type ManagerState,
  type ManagerInstance,
  type ManagerPullResult,
  type GlobalSecondaryBonuses,
} from './systems/ManagerSystem';

// Manager config
export {
  MANAGER_TEMPLATES,
  MANAGER_RARITY_CONFIG,
  MANAGER_GACHA_CONFIG,
  TEAM_BONUSES,
  getManagersByRarity,
  getManagersByTeam,
  calculateManagerPower,
  isManagerAwakened,
  getActiveTeamBonuses,
  getManagerRarityColor,
  getTotalManagerCount,
  type ManagerId,
  type ManagerRarity,
  type ManagerTeam,
  type ManagerSkill,
  type ManagerTemplate,
  type TeamBonus,
} from './config/managers';

// Breeding system
export {
  createInitialBreedingState,
  placeSeedInSlot,
  removeSeedFromSlot,
  startBreeding,
  completeBreeding,
  cancelBreeding,
  getBreedingProgress,
  canStartBreeding,
  isBreedingComplete,
  calculateBreedingDuration,
  formatBreedingTimeRemaining,
  type BreedingState,
  type BreedingSlot,
  type BreedingResult,
  type SeedWithTraits,
} from './systems/BreedingSystem';

// Market system
export {
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
  type MarketState,
  type MarketTrend,
  type MarketHistoryEntry,
} from './systems/MarketSystem';

// Daily login system
export {
  createInitialDailyLoginState,
  checkDailyLogin,
  claimDailyReward,
  getNextReward,
  getWeeklyRewardsPreview,
  DAILY_REWARDS,
  getTodayDateString,
  type DailyLoginState,
  type DailyLoginReward,
} from './systems/DailyLoginSystem';

// Anomaly system
export {
  createInitialAnomalyState,
  checkAnomalySpawn,
  checkLuckyStarBuff,
  collectAnomaly,
  getLuckyStarMultiplier,
  getAnomalyTimeRemaining,
  getLuckyStarTimeRemaining,
  formatAnomalyTime,
  ANOMALY_CONFIG,
  ANOMALY_DEFINITIONS,
  type AnomalyStateData,
  type AnomalyType,
  type AnomalyDefinition,
  type ActiveAnomaly,
  type LuckyStarBuff,
  type CollectAnomalyResult,
} from './systems/AnomalySystem';

// Expedition system
export {
  createInitialExpeditionState,
  calculateSuccessRate,
  calculateRewardMultiplier,
  calculateExpeditionRewards,
  canLaunchExpedition,
  launchExpedition,
  isExpeditionComplete,
  getExpeditionTimeRemaining,
  completeExpedition,
  cancelExpedition,
  getBusyManagerIds,
  isManagerOnExpedition,
  getManagerExpedition,
  getCompletedExpeditions,
  getExpeditionStats,
  type ExpeditionState,
  type ActiveExpedition,
  type ExpeditionResult,
  type CalculatedReward,
} from './systems/ExpeditionSystem';

// Expedition config
export {
  EXPEDITION_CONFIG,
  EXPEDITION_TYPES,
  getExpeditionTypes,
  getExpeditionType,
  isExpeditionUnlocked,
  formatExpeditionDuration,
  type ExpeditionTypeId,
  type ExpeditionTypeConfig,
  type ExpeditionRewardConfig,
} from './config/expeditions';
