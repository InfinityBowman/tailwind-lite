/**
 * Research Tree Configuration
 * Defines all research nodes and their effects
 */

export type ResearchEffectType =
  | 'AUTO_SELL' // Automatically sell plants
  | 'PRODUCTION_BOOST' // Global production multiplier
  | 'STORAGE_BOOST' // Global storage capacity
  | 'GACHA_DISCOUNT' // Reduced gacha cost
  | 'FUSION_DISCOUNT' // Reduced fusion cost
  | 'OFFLINE_BOOST' // Better offline progress
  | 'RESOURCE_INSIGHT' // Show production rates
  | 'EXPORT_SPEED_BOOST' // Faster export speed
  | 'REFINE_EFFICIENCY' // Better refinement rates
  | 'EXTRACT_EFFICIENCY' // Better extraction rates
  | 'MULTI_PULL' // Unlocks 10x gacha pulls
  | 'AUTO_FUSE' // Unlocks auto-fuse feature
  | 'UNLOCK_MANAGERS'; // Unlocks the manager system

export interface ResearchEffect {
  type: ResearchEffectType;
  value: number;
}

import type { IconName } from '../../utils/assets';

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  tier: number; // 1-4, affects positioning and power
  costs: {
    refinedEssence: number;
    crystals?: number;
  };
  effects: ResearchEffect[];
  prerequisites: string[]; // IDs of required research
  icon: IconName; // icon name from assets
}

export const RESEARCH_NODES: Record<string, ResearchNode> = {
  // ========== TIER 1 ==========
  basicInsight: {
    id: 'basicInsight',
    name: 'Basic Insight',
    description: 'View detailed production rates for each planet',
    tier: 1,
    costs: { refinedEssence: 10 },
    effects: [{ type: 'RESOURCE_INSIGHT', value: 1 }],
    prerequisites: [],
    icon: 'chart',
  },

  efficientGrowth: {
    id: 'efficientGrowth',
    name: 'Efficient Growth',
    description: '+10% global production rate',
    tier: 1,
    costs: { refinedEssence: 15 },
    effects: [{ type: 'PRODUCTION_BOOST', value: 0.1 }],
    prerequisites: [],
    icon: 'growth',
  },

  quickExports: {
    id: 'quickExports',
    name: 'Quick Exports',
    description: '+10% export speed',
    tier: 1,
    costs: { refinedEssence: 15 },
    effects: [{ type: 'EXPORT_SPEED_BOOST', value: 0.1 }],
    prerequisites: [],
    icon: 'lightning',
  },

  // ========== TIER 2 ==========
  autoSellBasic: {
    id: 'autoSellBasic',
    name: 'Auto-Sell Protocol',
    description: 'Automatically sell plants when ship is full',
    tier: 2,
    costs: { refinedEssence: 50 },
    effects: [{ type: 'AUTO_SELL', value: 1 }],
    prerequisites: ['basicInsight'],
    icon: 'robot',
  },

  expandedCargo: {
    id: 'expandedCargo',
    name: 'Expanded Cargo',
    description: '+25% storage capacity on all planets',
    tier: 2,
    costs: { refinedEssence: 40 },
    effects: [{ type: 'STORAGE_BOOST', value: 0.25 }],
    prerequisites: ['quickExports'],
    icon: 'cargo',
  },

  improvedSoil: {
    id: 'improvedSoil',
    name: 'Improved Soil',
    description: '+20% global production rate',
    tier: 2,
    costs: { refinedEssence: 45 },
    effects: [{ type: 'PRODUCTION_BOOST', value: 0.2 }],
    prerequisites: ['efficientGrowth'],
    icon: 'leaf',
  },

  bargainHunter: {
    id: 'bargainHunter',
    name: 'Bargain Hunter',
    description: '15% discount on gacha pulls',
    tier: 2,
    costs: { refinedEssence: 35 },
    effects: [{ type: 'GACHA_DISCOUNT', value: 0.15 }],
    prerequisites: ['bulkPurchasing'],
    icon: 'credits',
  },

  bulkPurchasing: {
    id: 'bulkPurchasing',
    name: 'Bulk Purchasing',
    description: 'Unlock 10x gacha pulls at a discount',
    tier: 1,
    costs: { refinedEssence: 20 },
    effects: [{ type: 'MULTI_PULL', value: 1 }],
    prerequisites: [],
    icon: 'sparkle',
  },

  fusionAutomation: {
    id: 'fusionAutomation',
    name: 'Fusion Automation',
    description: 'Unlock auto-fuse to combine all matching seeds at once',
    tier: 2,
    costs: { refinedEssence: 40 },
    effects: [{ type: 'AUTO_FUSE', value: 1 }],
    prerequisites: ['efficientGrowth'],
    icon: 'robot',
  },

  // ========== TIER 3 ==========
  offlineWorkers: {
    id: 'offlineWorkers',
    name: 'Offline Workers',
    description: '50% more offline progress',
    tier: 3,
    costs: { refinedEssence: 100 },
    effects: [{ type: 'OFFLINE_BOOST', value: 0.5 }],
    prerequisites: ['autoSellBasic'],
    icon: 'sleep',
  },

  fusionMaster: {
    id: 'fusionMaster',
    name: 'Fusion Master',
    description: '25% less essence needed for fusion',
    tier: 3,
    costs: { refinedEssence: 80 },
    effects: [{ type: 'FUSION_DISCOUNT', value: 0.25 }],
    prerequisites: ['improvedSoil'],
    icon: 'sparkle',
  },

  advancedLogistics: {
    id: 'advancedLogistics',
    name: 'Advanced Logistics',
    description: '+25% export speed',
    tier: 3,
    costs: { refinedEssence: 85 },
    effects: [{ type: 'EXPORT_SPEED_BOOST', value: 0.25 }],
    prerequisites: ['expandedCargo'],
    icon: 'rocket',
  },

  refineryUpgrade: {
    id: 'refineryUpgrade',
    name: 'Refinery Upgrade',
    description: '30% more refined essence from plants',
    tier: 3,
    costs: { refinedEssence: 75 },
    effects: [{ type: 'REFINE_EFFICIENCY', value: 0.3 }],
    prerequisites: ['bargainHunter'],
    icon: 'flask',
  },

  workshopMastery: {
    id: 'workshopMastery',
    name: 'Workshop Mastery',
    description: '25% more extracts when processing plants',
    tier: 3,
    costs: { refinedEssence: 80 },
    effects: [{ type: 'EXTRACT_EFFICIENCY', value: 0.25 }],
    prerequisites: ['refineryUpgrade'],
    icon: 'sparkle',
  },

  managerRecruitment: {
    id: 'managerRecruitment',
    name: 'Manager Recruitment',
    description: 'Unlock the Manager system - recruit specialists to boost your planets',
    tier: 3,
    costs: { refinedEssence: 120, crystals: 100 },
    effects: [{ type: 'UNLOCK_MANAGERS', value: 1 }],
    prerequisites: ['improvedSoil'],
    icon: 'crown',
  },

  // ========== TIER 4 ==========
  masterProducer: {
    id: 'masterProducer',
    name: 'Master Producer',
    description: '+50% global production rate',
    tier: 4,
    costs: { refinedEssence: 200 },
    effects: [{ type: 'PRODUCTION_BOOST', value: 0.5 }],
    prerequisites: ['fusionMaster', 'offlineWorkers'],
    icon: 'crown',
  },

  galacticTrader: {
    id: 'galacticTrader',
    name: 'Galactic Trader',
    description: '30% gacha discount and +50% storage capacity',
    tier: 4,
    costs: { refinedEssence: 250 },
    effects: [
      { type: 'GACHA_DISCOUNT', value: 0.3 },
      { type: 'STORAGE_BOOST', value: 0.5 },
    ],
    prerequisites: ['advancedLogistics', 'refineryUpgrade'],
    icon: 'star',
  },
} as const;

// Get all research node IDs
export const ALL_RESEARCH_IDS = Object.keys(RESEARCH_NODES);

// Get research nodes by tier
export function getResearchByTier(tier: number): ResearchNode[] {
  return Object.values(RESEARCH_NODES).filter(r => r.tier === tier);
}

// Maximum tier
export const MAX_RESEARCH_TIER = 4;
