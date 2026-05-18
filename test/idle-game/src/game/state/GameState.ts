/**
 * Game State Types and Factory
 * Central definition of all game state
 */

import { PLANET_DEFINITIONS } from '../config/planets';
import { STARTING_CREDITS, STARTING_CRYSTALS } from '../config/balance';
import { EventStateData, createInitialEventState } from '../systems/EventSystem';
import { ManagerState, createInitialManagerState } from '../systems/ManagerSystem';
import { AnomalyStateData, createInitialAnomalyState } from '../systems/AnomalySystem';
import { ExpeditionState, createInitialExpeditionState } from '../systems/ExpeditionSystem';
import {
  DailyChallengeState,
  createInitialDailyChallengeState,
} from '../systems/DailyChallengeSystem';
import { ContractState, createInitialContractState } from '../systems/ContractSystem';
import { TranscendenceState } from '../systems/TranscendenceSystem';
import { ExtractInventory, createInitialExtractState } from '../systems/ExtractSystem';
import { CraftingState, createInitialCraftingState } from '../systems/CraftingSystem';
import {
  MasteryState,
  createInitialMasteryState as createMasteryStateFromSystem,
} from '../systems/MasterySystem';
import { BreedingState, createInitialBreedingState } from '../systems/BreedingSystem';
import { MarketState, createInitialMarketState } from '../systems/MarketSystem';
import { createInitialMysteriousBonusState } from '../systems/MysteriousBonusSystem';
import { SeedexState, createInitialSeedexState } from '../systems/SeedexSystem';
import { StarSystemsState, createInitialStarSystemsState } from '../systems/StarSystemsSystem';
import type { ExtractId } from '../config/extracts';
export type { ManagerState };
export type { SeedexState };
export type { StarSystemsState };
export type { AnomalyStateData };
export type { ExpeditionState };
export type { DailyChallengeState };
export type { ContractState };
export type { TranscendenceState };
export type { ExtractInventory };
export type { ExtractId };
export type { CraftingState };
export type { MasteryState };
export type { BreedingState };
import type { TraitId } from '../config/traits';

// ============================================
// SEED INSTANCE
// ============================================

export interface SeedInstance {
  instanceId: string;
  id: string; // seed type id (wheat, corn, etc)
  name: string;
  tier: number;
  level: number;
  productionMultiplier: number;
  valueMultiplier: number;
  color: string;
  powerLevel: number;
  traits?: TraitId[];
}

export interface FodderInstance {
  instanceId: string;
  id: 'seedEssence';
  name: string;
  description: string;
  sellValue: number;
  tier: 0;
}

export type InventoryItem = SeedInstance | FodderInstance;

export function isFodder(item: InventoryItem): item is FodderInstance {
  return item.id === 'seedEssence';
}

export function isSeed(item: InventoryItem): item is SeedInstance {
  return item.id !== 'seedEssence';
}

// ============================================
// PLANT (growing on a planet)
// ============================================

export interface PlantData {
  plant: string; // seed type id
  currentAmount: number;
  productionRate: number;
}

// ============================================
// PLANET STATE
// ============================================

export interface PlanetState {
  id: string;
  name: string;
  description: string;
  color: string;

  // Production
  productionRate: number;
  plants: PlantData[];
  seeds: SeedInstance[];

  // Export & Storage
  exportSpeed: number;
  storageCapacity: number;

  // Unlock
  unlocked: boolean;
  unlockCost: number;

  // Upgrades
  upgrades: {
    productionRate: number;
    exportSpeed: number;
    storageCapacity: number;
  };
}

// ============================================
// SHIP STATE
// ============================================

export interface ShipResources {
  materials: number;
  seedEssence: number;
  plants: Record<string, number>;
}

export interface ShipState {
  resources: ShipResources;
  totalCurrency: number;
  crystals: number;
  seedInventory: InventoryItem[];
}

// ============================================
// MODIFIERS
// ============================================

export interface GameModifiers {
  productionRateMultiplier: number;
  exportSpeedMultiplier: number;
  shipCapacityMultiplier: number;
}

// ============================================
// RESEARCH STATE
// ============================================

export interface ResearchStateData {
  completed: string[];
  refinedEssence: number;
}

// ============================================
// RESOURCE ANALYTICS
// ============================================

export interface ResourceAnalytics {
  name: string;
  totalCreated: number;
  totalRevenue: number;
}

// ============================================
// PRESTIGE STATE
// ============================================

export interface PrestigeStateData {
  prestigeLevel: number;
  prestigePoints: number;
  totalPrestigePointsEarned: number;
  bonusLevels: Record<string, number>;
  lifetimeCredits: number;
}

// ============================================
// QUEST STATE
// ============================================

export interface QuestProgressData {
  questId: string;
  progress: number;
  claimed: boolean;
}

export interface QuestStateData {
  dailyQuests: Record<string, QuestProgressData>;
  weeklyQuests: Record<string, QuestProgressData>;
  dailyResetTime: number;
  weeklyResetTime: number;
}

// ============================================
// ACHIEVEMENT STATE (Serialized format for storage)
// ============================================

export interface AchievementProgressData {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
  claimed: boolean;
}

export interface AchievementStatsData {
  totalPlantsSold: number;
  totalCreditsEarned: number;
  totalGachaPulls: number;
  totalSeedsFused: number;
  totalPlantsRefined: number;
  totalPlantsExtracted: number;
  maxSeedTierCreated: number;
  uniqueSeedTypesOwned: string[]; // Serialized as array (Set at runtime)
  planetsUnlocked: number;
  researchCompleted: number;
  prestigeCount: number;
  // Breeding stats
  totalSeedsBred?: number;
  totalTraitsDiscovered?: number;
  totalRecipesDiscovered?: number;
  totalLegendaryTraits?: number;
  // Gacha pity tracking
  consecutiveFodders?: number;
}

// This matches SerializedAchievementState from AchievementSystem
export interface AchievementStateData {
  achievements: Record<string, AchievementProgressData>;
  stats: AchievementStatsData;
}

// ============================================
// MYSTERIOUS BONUS STATE
// ============================================

export type MysteriousBonusType =
  | 'PRODUCTION_BOOST' // +25% production
  | 'GACHA_DISCOUNT' // -25% gacha cost
  | 'ESSENCE_BOOST' // +50% essence from fodder
  | 'STORAGE_BOOST' // +50% storage capacity
  | 'REFINE_BOOST' // +50% refinement output
  | 'FUSION_DISCOUNT'; // -25% fusion cost

export interface MysteriousBonusState {
  currentBonus: MysteriousBonusType | null;
  resetTime: number; // Unix timestamp for next reset
}

export const MYSTERIOUS_BONUS_DESCRIPTIONS: Record<MysteriousBonusType, string> = {
  PRODUCTION_BOOST: '+25% Production',
  GACHA_DISCOUNT: '-25% Gacha Cost',
  ESSENCE_BOOST: '+50% Essence from Fodder',
  STORAGE_BOOST: '+50% Storage Capacity',
  REFINE_BOOST: '+50% Refinement Output',
  FUSION_DISCOUNT: '-25% Fusion Cost',
};

// ============================================
// COMPLETE GAME STATE
// ============================================

// Hints/Tutorial tracking
export interface HintsState {
  dismissed: string[];
  firstGachaPull: boolean;
  firstSeedPlanted: boolean;
  firstExport: boolean;
  firstFusion: boolean;
  firstPrestige: boolean;
}

// XP-based mastery state - use MasteryState from MasterySystem
export type MasteryStateData = MasteryState;

// Daily login reward tracking
export interface DailyLoginStateData {
  lastLoginDate: string | null; // ISO date string (YYYY-MM-DD)
  currentStreak: number; // Days in a row (1-7, resets after 7)
  totalLogins: number; // Lifetime login count
  todayClaimed: boolean; // Already claimed today's reward
}

export interface GameState {
  /** Save version for migration system */
  saveVersion?: number;
  planets: PlanetState[];
  ship: ShipState;
  modifiers: GameModifiers;
  analytics: ResourceAnalytics[];
  research: ResearchStateData;
  prestige: PrestigeStateData;
  transcendence: TranscendenceState;
  quests: QuestStateData;
  achievements: AchievementStateData;
  mysteriousBonus: MysteriousBonusState;
  hints: HintsState;
  mastery: MasteryStateData;
  events: EventStateData;
  managers: ManagerState;
  dailyLogin: DailyLoginStateData;
  anomalies: AnomalyStateData;
  expeditions: ExpeditionState;
  dailyChallenges: DailyChallengeState;
  contracts: ContractState;
  extracts: ExtractInventory;
  crafting: CraftingState;
  breeding: BreedingState;
  market: MarketState;
  seedex: SeedexState;
  starSystems: StarSystemsState;
  lastSaveTime: number;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createInitialPlanetState(planetId: string): PlanetState {
  const def = PLANET_DEFINITIONS[planetId];
  if (!def) {
    throw new Error(`Unknown planet: ${planetId}`);
  }

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    color: def.color,
    productionRate: def.productionRate,
    plants: [],
    seeds: [],
    exportSpeed: def.exportSpeed,
    storageCapacity: def.storageCapacity,
    unlocked: def.startsUnlocked,
    unlockCost: def.unlockCost,
    upgrades: {
      productionRate: 0,
      exportSpeed: 0,
      storageCapacity: 0,
    },
  };
}

export function createInitialShipState(): ShipState {
  return {
    resources: {
      materials: 0,
      seedEssence: 0,
      plants: {},
    },
    totalCurrency: STARTING_CREDITS,
    crystals: STARTING_CRYSTALS,
    seedInventory: [],
  };
}

export function createInitialModifiers(): GameModifiers {
  return {
    productionRateMultiplier: 1.0,
    exportSpeedMultiplier: 1.0,
    shipCapacityMultiplier: 1.0,
  };
}

export function createInitialAnalytics(): ResourceAnalytics[] {
  return [
    { name: 'wheat', totalCreated: 0, totalRevenue: 0 },
    { name: 'corn', totalCreated: 0, totalRevenue: 0 },
    { name: 'potato', totalCreated: 0, totalRevenue: 0 },
    { name: 'carrot', totalCreated: 0, totalRevenue: 0 },
    { name: 'tomato', totalCreated: 0, totalRevenue: 0 },
    { name: 'cucumber', totalCreated: 0, totalRevenue: 0 },
    { name: 'rice', totalCreated: 0, totalRevenue: 0 },
    { name: 'soybean', totalCreated: 0, totalRevenue: 0 },
    { name: 'pumpkin', totalCreated: 0, totalRevenue: 0 },
    { name: 'starfruit', totalCreated: 0, totalRevenue: 0 },
  ];
}

export function createInitialResearchState(): ResearchStateData {
  return {
    completed: [],
    refinedEssence: 0,
  };
}

export function createInitialPrestigeState(): PrestigeStateData {
  return {
    prestigeLevel: 0,
    prestigePoints: 0,
    totalPrestigePointsEarned: 0,
    bonusLevels: {},
    lifetimeCredits: 0,
  };
}

function createInitialTranscendenceState(): TranscendenceState {
  return {
    transcendenceLevel: 0,
    transcendencePoints: 0,
    totalTranscendencePointsEarned: 0,
    bonusLevels: {},
  };
}

export function createInitialQuestState(): QuestStateData {
  // Import is done dynamically to avoid circular dependency
  // The actual state initialization is done in QuestSystem.ts
  // This is a placeholder that will be overwritten by the game engine
  return {
    dailyQuests: {},
    weeklyQuests: {},
    dailyResetTime: Date.now() + 24 * 60 * 60 * 1000,
    weeklyResetTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

// Re-export from MysteriousBonusSystem
export { createInitialMysteriousBonusState };

export function createInitialAchievementState(): AchievementStateData {
  // Import is done dynamically to avoid circular dependency
  // The actual state initialization is done in AchievementSystem.ts
  // This is a placeholder that will be overwritten by the game engine
  return {
    achievements: {},
    stats: {
      totalPlantsSold: 0,
      totalCreditsEarned: 0,
      totalGachaPulls: 0,
      totalSeedsFused: 0,
      totalPlantsRefined: 0,
      totalPlantsExtracted: 0,
      maxSeedTierCreated: 1,
      uniqueSeedTypesOwned: [],
      planetsUnlocked: 1,
      researchCompleted: 0,
      prestigeCount: 0,
    },
  };
}

export function createInitialGameState(): GameState {
  // Include all planets but only starting ones are unlocked
  const allPlanetIds = Object.keys(PLANET_DEFINITIONS);
  const planets = allPlanetIds.map(id => createInitialPlanetState(id));

  // New players start with an empty planet - they use the gacha to get their first seed
  // (First pull is guaranteed to be a seed, not fodder)

  return {
    planets,
    ship: createInitialShipState(),
    modifiers: createInitialModifiers(),
    analytics: createInitialAnalytics(),
    research: createInitialResearchState(),
    prestige: createInitialPrestigeState(),
    transcendence: createInitialTranscendenceState(),
    quests: createInitialQuestState(),
    achievements: createInitialAchievementState(),
    mysteriousBonus: createInitialMysteriousBonusState(),
    hints: createInitialHintsState(),
    mastery: createInitialMasteryState(),
    events: createInitialEventState(),
    managers: createInitialManagerState(),
    dailyLogin: createInitialDailyLoginState(),
    anomalies: createInitialAnomalyState(),
    expeditions: createInitialExpeditionState(),
    dailyChallenges: createInitialDailyChallengeState(),
    contracts: createInitialContractState(),
    extracts: createInitialExtractState(),
    crafting: createInitialCraftingState(),
    breeding: createInitialBreedingState(),
    market: createInitialMarketState(),
    seedex: createInitialSeedexState(),
    starSystems: createInitialStarSystemsState(),
    lastSaveTime: Date.now(),
  };
}

export function createInitialDailyLoginState(): DailyLoginStateData {
  return {
    lastLoginDate: null,
    currentStreak: 0,
    totalLogins: 0,
    todayClaimed: false,
  };
}

export function createInitialHintsState(): HintsState {
  return {
    dismissed: [],
    firstGachaPull: false,
    firstSeedPlanted: false,
    firstExport: false,
    firstFusion: false,
    firstPrestige: false,
  };
}

export function createInitialMasteryState(): MasteryState {
  return createMasteryStateFromSystem();
}

/**
 * Create game state after prestige, preserving prestige bonuses, quests, achievements, mastery, managers, and transcendence
 */
export function createPostPrestigeGameState(
  prestigeState: PrestigeStateData,
  startingCredits: number,
  questState?: QuestStateData,
  achievementState?: AchievementStateData,
  mysteriousBonusState?: MysteriousBonusState,
  hintsState?: HintsState,
  masteryState?: MasteryStateData,
  eventState?: EventStateData,
  managerState?: ManagerState,
  dailyLoginState?: DailyLoginStateData,
  anomalyState?: AnomalyStateData,
  expeditionState?: ExpeditionState,
  dailyChallengeState?: DailyChallengeState,
  transcendenceState?: TranscendenceState,
  contractState?: ContractState,
  seedexState?: SeedexState,
  starSystemsState?: StarSystemsState
): GameState {
  const allPlanetIds = Object.keys(PLANET_DEFINITIONS);
  const planets = allPlanetIds.map(id => createInitialPlanetState(id));

  // Reset manager assignments on prestige (keep managers and levels)
  const managersAfterPrestige = managerState
    ? { ...managerState, assignments: {} }
    : createInitialManagerState();

  // Reset expeditions on prestige (keep completed count and history)
  const expeditionsAfterPrestige = expeditionState
    ? { ...expeditionState, active: [] }
    : createInitialExpeditionState();

  return {
    planets,
    ship: {
      ...createInitialShipState(),
      totalCurrency: startingCredits,
    },
    modifiers: createInitialModifiers(),
    analytics: createInitialAnalytics(),
    research: createInitialResearchState(),
    prestige: prestigeState,
    transcendence: transcendenceState || createInitialTranscendenceState(),
    quests: questState || createInitialQuestState(),
    achievements: achievementState || createInitialAchievementState(),
    mysteriousBonus: mysteriousBonusState || createInitialMysteriousBonusState(),
    hints: hintsState || createInitialHintsState(),
    mastery: masteryState || createInitialMasteryState(),
    events: eventState || createInitialEventState(),
    managers: managersAfterPrestige,
    dailyLogin: dailyLoginState || createInitialDailyLoginState(),
    anomalies: anomalyState || createInitialAnomalyState(),
    expeditions: expeditionsAfterPrestige,
    dailyChallenges: dailyChallengeState || createInitialDailyChallengeState(),
    contracts: contractState || createInitialContractState(), // Contracts persist on prestige
    extracts: createInitialExtractState(), // Extracts reset on prestige like plants
    crafting: createInitialCraftingState(), // Crafting resets on prestige
    breeding: createInitialBreedingState(), // Breeding resets on prestige
    market: createInitialMarketState(), // Market resets on prestige
    seedex: seedexState || createInitialSeedexState(), // Seedex persists on prestige
    starSystems: starSystemsState || createInitialStarSystemsState(), // Star systems persist on prestige
    lastSaveTime: Date.now(),
  };
}

/**
 * Create game state after transcendence
 * Resets: Everything from Prestige + Prestige level + Prestige bonuses
 * Keeps: Transcendence points, achievements, crystals, managers (but reset assignments)
 */
export function createPostTranscendenceGameState(
  transcendenceState: TranscendenceState,
  startingCredits: number,
  startingPrestigeBonusLevels: Record<string, number>,
  achievementState?: AchievementStateData,
  mysteriousBonusState?: MysteriousBonusState,
  hintsState?: HintsState,
  masteryState?: MasteryStateData,
  eventState?: EventStateData,
  managerState?: ManagerState,
  dailyLoginState?: DailyLoginStateData,
  anomalyState?: AnomalyStateData,
  crystals?: number,
  dailyChallengeState?: DailyChallengeState,
  contractState?: ContractState,
  seedexState?: SeedexState,
  starSystemsState?: StarSystemsState
): GameState {
  const allPlanetIds = Object.keys(PLANET_DEFINITIONS);
  const planets = allPlanetIds.map(id => createInitialPlanetState(id));

  // Reset manager assignments on transcendence (keep managers and levels)
  const managersAfterTranscendence = managerState
    ? { ...managerState, assignments: {} }
    : createInitialManagerState();

  // Create fresh prestige state with head start bonus levels if applicable
  const freshPrestigeState: PrestigeStateData = {
    prestigeLevel: 0,
    prestigePoints: 0,
    totalPrestigePointsEarned: 0,
    bonusLevels: startingPrestigeBonusLevels,
    lifetimeCredits: 0,
  };

  return {
    planets,
    ship: {
      ...createInitialShipState(),
      totalCurrency: startingCredits,
      crystals: crystals ?? STARTING_CRYSTALS,
    },
    modifiers: createInitialModifiers(),
    analytics: createInitialAnalytics(),
    research: createInitialResearchState(),
    prestige: freshPrestigeState,
    transcendence: transcendenceState,
    quests: createInitialQuestState(), // Quests reset on transcendence
    achievements: achievementState || createInitialAchievementState(),
    mysteriousBonus: mysteriousBonusState || createInitialMysteriousBonusState(),
    hints: hintsState || createInitialHintsState(),
    mastery: masteryState || createInitialMasteryState(),
    events: eventState || createInitialEventState(),
    managers: managersAfterTranscendence,
    dailyLogin: dailyLoginState || createInitialDailyLoginState(),
    anomalies: anomalyState || createInitialAnomalyState(),
    expeditions: createInitialExpeditionState(), // Expeditions reset on transcendence
    dailyChallenges: dailyChallengeState || createInitialDailyChallengeState(),
    contracts: contractState || createInitialContractState(), // Contracts persist on transcendence
    extracts: createInitialExtractState(), // Extracts reset on transcendence like plants
    crafting: createInitialCraftingState(), // Crafting resets on transcendence
    breeding: createInitialBreedingState(), // Breeding resets on transcendence
    market: createInitialMarketState(), // Market resets on transcendence
    seedex: seedexState || createInitialSeedexState(), // Seedex persists on transcendence
    starSystems: starSystemsState || createInitialStarSystemsState(), // Star systems persist on transcendence
    lastSaveTime: Date.now(),
  };
}
