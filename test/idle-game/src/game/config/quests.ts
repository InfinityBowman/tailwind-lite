/**
 * Quest Configuration
 * Defines all daily and weekly quests
 */

export type QuestType = 'daily' | 'weekly';

export type QuestCategory = 'production' | 'selling' | 'gacha' | 'fusion' | 'research' | 'planets';

export type RewardType = 'credits' | 'essence' | 'crystals' | 'refinedEssence';

export interface QuestReward {
  type: RewardType;
  amount: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  category: QuestCategory;
  target: number;
  reward: QuestReward;
  /** Event type to listen for progress tracking */
  trackingEvent: string;
  /** How to extract progress from event payload */
  trackingKey?: string;
}

// Reset intervals in milliseconds
export const QUEST_RESET_INTERVALS = {
  daily: 24 * 60 * 60 * 1000, // 24 hours
  weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  // ============================================
  // DAILY QUESTS
  // ============================================

  sellPlants500: {
    id: 'sellPlants500',
    name: 'Plant Merchant',
    description: 'Sell 500 plants',
    type: 'daily',
    category: 'selling',
    target: 500,
    reward: { type: 'credits', amount: 100 },
    trackingEvent: 'questSell',
  },

  gachaPull10: {
    id: 'gachaPull10',
    name: 'Lucky Draw',
    description: 'Pull gacha 10 times',
    type: 'daily',
    category: 'gacha',
    target: 10,
    reward: { type: 'credits', amount: 50 },
    trackingEvent: 'gachaPull',
  },

  fuseSeeds3: {
    id: 'fuseSeeds3',
    name: 'Seed Scientist',
    description: 'Fuse 3 seeds',
    type: 'daily',
    category: 'fusion',
    target: 3,
    reward: { type: 'essence', amount: 25 },
    trackingEvent: 'seedFused',
  },

  completeResearch1: {
    id: 'completeResearch1',
    name: 'Knowledge Seeker',
    description: 'Complete 1 research',
    type: 'daily',
    category: 'research',
    target: 1,
    reward: { type: 'refinedEssence', amount: 50 },
    trackingEvent: 'researchUnlocked',
  },

  plantSeeds5: {
    id: 'plantSeeds5',
    name: 'Interstellar Farmer',
    description: 'Plant 5 seeds on planets',
    type: 'daily',
    category: 'planets',
    target: 5,
    reward: { type: 'credits', amount: 75 },
    trackingEvent: 'seedPlanted',
  },

  collectPlants200: {
    id: 'collectPlants200',
    name: 'Harvest Time',
    description: 'Collect 200 plants from exports',
    type: 'daily',
    category: 'production',
    target: 200,
    reward: { type: 'credits', amount: 50 },
    trackingEvent: 'resourceCollected',
    trackingKey: 'amount',
  },

  // ============================================
  // WEEKLY QUESTS
  // ============================================

  earnCredits10000: {
    id: 'earnCredits10000',
    name: 'Space Tycoon',
    description: 'Earn 10,000 credits from selling',
    type: 'weekly',
    category: 'selling',
    target: 10000,
    reward: { type: 'crystals', amount: 10 },
    trackingEvent: 'questCreditsEarned',
  },

  fuseSeeds20: {
    id: 'fuseSeeds20',
    name: 'Master Fusionist',
    description: 'Fuse 20 seeds',
    type: 'weekly',
    category: 'fusion',
    target: 20,
    reward: { type: 'refinedEssence', amount: 100 },
    trackingEvent: 'seedFused',
  },
} as const;

export const ALL_QUEST_IDS = Object.keys(QUEST_DEFINITIONS);
export const DAILY_QUEST_IDS = ALL_QUEST_IDS.filter(id => QUEST_DEFINITIONS[id].type === 'daily');
export const WEEKLY_QUEST_IDS = ALL_QUEST_IDS.filter(id => QUEST_DEFINITIONS[id].type === 'weekly');

/**
 * Get quests by type
 */
export function getQuestsByType(type: QuestType): QuestDefinition[] {
  return ALL_QUEST_IDS.filter(id => QUEST_DEFINITIONS[id].type === type).map(
    id => QUEST_DEFINITIONS[id]
  );
}

/**
 * Get quests by category
 */
export function getQuestsByCategory(category: QuestCategory): QuestDefinition[] {
  return ALL_QUEST_IDS.filter(id => QUEST_DEFINITIONS[id].category === category).map(
    id => QUEST_DEFINITIONS[id]
  );
}
