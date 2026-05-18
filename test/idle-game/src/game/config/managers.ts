/**
 * Managers Configuration
 *
 * Managers are collectible characters that provide bonuses when assigned
 * to planets. They form a second gacha layer with collection mechanics.
 *
 * Design principle: Managers provide SPECIALIZATION, not raw power.
 * Max power difference between optimal and no managers: ~1.5x
 */

// ============================================
// TYPES
// ============================================

export type ManagerId =
  // Common (5)
  | 'wheat_whisperer'
  | 'corn_champion'
  | 'trade_apprentice'
  | 'swift_shipper'
  | 'research_rookie'
  // Uncommon (3)
  | 'potato_prince'
  | 'cargo_captain'
  | 'lucky_lou'
  // Rare (3)
  | 'terra_prime'
  | 'mars_commander'
  | 'scholar_supreme'
  // Epic (2)
  | 'trade_tycoon'
  | 'cosmic_gambler'
  // Legendary (2)
  | 'void_walker'
  | 'merchant_prince';

export type ManagerRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ManagerTeam = 'farmer' | 'trader' | 'scholar' | 'specialist' | 'lucky';

// Team colors for consistent UI
export const TEAM_COLORS: Record<ManagerTeam, string> = {
  farmer: '#4ade80', // green
  trader: '#facc15', // gold
  scholar: '#60a5fa', // blue
  specialist: '#f472b6', // pink
  lucky: '#a78bfa', // purple
};

export interface ManagerSkill {
  type:
    | 'PRODUCTION_BOOST' // +X% production globally
    | 'SEED_TYPE_BOOST' // +X% for specific seed type
    | 'PLANET_BOOST' // +X% on specific planet
    | 'SELL_VALUE_BOOST' // +X% sell value
    | 'EXPORT_SPEED' // +X% export speed
    | 'STORAGE_CAPACITY' // +X% storage capacity
    | 'RESEARCH_DISCOUNT' // -X% research cost
    | 'GACHA_LUCK'; // +X% better gacha rates

  value: number; // Percentage (0.15 = 15%)
  target?: string; // Seed type or planet ID if applicable
}

export interface ManagerTemplate {
  id: ManagerId;
  name: string;
  rarity: ManagerRarity;
  team: ManagerTeam;
  icon: string; // Lucide icon name
  primarySkill: ManagerSkill;
  secondarySkill?: ManagerSkill;
  awakenedBonus?: ManagerSkill;
  /**
   * Global secondary bonus - unlocked at awakening level
   * Unlike awakenedBonus (which applies to assigned planet), this applies GLOBALLY
   * to ALL planets regardless of assignment. Inspired by Idle Planet Miner's
   * manager secondary bonus system.
   */
  globalSecondaryBonus?: ManagerSkill;
  flavorText: string;
  maxLevel: number; // Based on rarity
}

// ============================================
// RARITY CONFIG
// ============================================

export const MANAGER_RARITY_CONFIG: Record<
  ManagerRarity,
  {
    color: string;
    bgColor: string;
    maxLevel: number;
    dupesToMax: number;
  }
> = {
  common: {
    color: '#9CA3AF',
    bgColor: 'bg-gray-500/20',
    maxLevel: 10,
    dupesToMax: 10,
  },
  uncommon: {
    color: '#22C55E',
    bgColor: 'bg-green-500/20',
    maxLevel: 15,
    dupesToMax: 8,
  },
  rare: {
    color: '#3B82F6',
    bgColor: 'bg-blue-500/20',
    maxLevel: 20,
    dupesToMax: 6,
  },
  epic: {
    color: '#A855F7',
    bgColor: 'bg-purple-500/20',
    maxLevel: 25,
    dupesToMax: 4,
  },
  legendary: {
    color: '#FFD700',
    bgColor: 'bg-yellow-500/20',
    maxLevel: 30,
    dupesToMax: 2,
  },
};

// ============================================
// MANAGER DEFINITIONS
// ============================================

export const MANAGER_TEMPLATES: Record<ManagerId, ManagerTemplate> = {
  // ========== COMMON ==========
  wheat_whisperer: {
    id: 'wheat_whisperer',
    name: 'Wheat Whisperer',
    rarity: 'common',
    team: 'farmer',
    icon: 'Wheat',
    primarySkill: { type: 'SEED_TYPE_BOOST', value: 0.15, target: 'wheat' },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.05 },
    awakenedBonus: { type: 'PRODUCTION_BOOST', value: 0.1 },
    globalSecondaryBonus: { type: 'PRODUCTION_BOOST', value: 0.02 },
    flavorText: 'Knows every grain by name.',
    maxLevel: 10,
  },

  corn_champion: {
    id: 'corn_champion',
    name: 'Corn Champion',
    rarity: 'common',
    team: 'farmer',
    icon: 'Salad',
    primarySkill: { type: 'SEED_TYPE_BOOST', value: 0.15, target: 'corn' },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.05 },
    awakenedBonus: { type: 'PRODUCTION_BOOST', value: 0.1 },
    globalSecondaryBonus: { type: 'PRODUCTION_BOOST', value: 0.02 },
    flavorText: 'A-maize-ing at what they do.',
    maxLevel: 10,
  },

  trade_apprentice: {
    id: 'trade_apprentice',
    name: 'Trade Apprentice',
    rarity: 'common',
    team: 'trader',
    icon: 'HandCoins',
    primarySkill: { type: 'SELL_VALUE_BOOST', value: 0.1 },
    awakenedBonus: { type: 'SELL_VALUE_BOOST', value: 0.05 },
    globalSecondaryBonus: { type: 'SELL_VALUE_BOOST', value: 0.02 },
    flavorText: 'Learning the art of the deal.',
    maxLevel: 10,
  },

  swift_shipper: {
    id: 'swift_shipper',
    name: 'Swift Shipper',
    rarity: 'common',
    team: 'trader',
    icon: 'Truck',
    primarySkill: { type: 'EXPORT_SPEED', value: 0.1 },
    secondarySkill: { type: 'STORAGE_CAPACITY', value: 0.05 },
    awakenedBonus: { type: 'EXPORT_SPEED', value: 0.05 },
    globalSecondaryBonus: { type: 'EXPORT_SPEED', value: 0.02 },
    flavorText: 'Neither rain nor void shall stop them.',
    maxLevel: 10,
  },

  research_rookie: {
    id: 'research_rookie',
    name: 'Research Rookie',
    rarity: 'common',
    team: 'scholar',
    icon: 'BookOpen',
    primarySkill: { type: 'RESEARCH_DISCOUNT', value: 0.1 },
    awakenedBonus: { type: 'RESEARCH_DISCOUNT', value: 0.05 },
    globalSecondaryBonus: { type: 'RESEARCH_DISCOUNT', value: 0.02 },
    flavorText: 'Fresh out of Space University.',
    maxLevel: 10,
  },

  // ========== UNCOMMON ==========
  potato_prince: {
    id: 'potato_prince',
    name: 'Potato Prince',
    rarity: 'uncommon',
    team: 'farmer',
    icon: 'Circle',
    primarySkill: { type: 'SEED_TYPE_BOOST', value: 0.2, target: 'potato' },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.08 },
    awakenedBonus: { type: 'PRODUCTION_BOOST', value: 0.12 },
    globalSecondaryBonus: { type: 'PRODUCTION_BOOST', value: 0.03 },
    flavorText: 'Royalty of the root vegetables.',
    maxLevel: 15,
  },

  cargo_captain: {
    id: 'cargo_captain',
    name: 'Cargo Captain',
    rarity: 'uncommon',
    team: 'trader',
    icon: 'Ship',
    primarySkill: { type: 'STORAGE_CAPACITY', value: 0.15 },
    secondarySkill: { type: 'SELL_VALUE_BOOST', value: 0.08 },
    awakenedBonus: { type: 'STORAGE_CAPACITY', value: 0.1 },
    globalSecondaryBonus: { type: 'STORAGE_CAPACITY', value: 0.03 },
    flavorText: 'The cargo holds respect them.',
    maxLevel: 15,
  },

  lucky_lou: {
    id: 'lucky_lou',
    name: 'Lucky Lou',
    rarity: 'uncommon',
    team: 'lucky',
    icon: 'Clover',
    primarySkill: { type: 'GACHA_LUCK', value: 0.05 },
    secondarySkill: { type: 'SELL_VALUE_BOOST', value: 0.05 },
    awakenedBonus: { type: 'GACHA_LUCK', value: 0.05 },
    globalSecondaryBonus: { type: 'GACHA_LUCK', value: 0.02 },
    flavorText: 'Fortune favors the prepared.',
    maxLevel: 15,
  },

  // ========== RARE ==========
  terra_prime: {
    id: 'terra_prime',
    name: 'Terra Prime',
    rarity: 'rare',
    team: 'specialist',
    icon: 'Globe',
    primarySkill: { type: 'PLANET_BOOST', value: 0.25, target: 'greenPlanet' },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.1 },
    awakenedBonus: { type: 'STORAGE_CAPACITY', value: 0.15 },
    globalSecondaryBonus: { type: 'PRODUCTION_BOOST', value: 0.04 },
    flavorText: "Earth's legacy lives on.",
    maxLevel: 20,
  },

  mars_commander: {
    id: 'mars_commander',
    name: 'Mars Commander',
    rarity: 'rare',
    team: 'specialist',
    icon: 'Target',
    primarySkill: { type: 'PLANET_BOOST', value: 0.25, target: 'redPlanet' },
    secondarySkill: { type: 'EXPORT_SPEED', value: 0.1 },
    awakenedBonus: { type: 'RESEARCH_DISCOUNT', value: 0.1 },
    globalSecondaryBonus: { type: 'EXPORT_SPEED', value: 0.04 },
    flavorText: 'The red planet obeys.',
    maxLevel: 20,
  },

  scholar_supreme: {
    id: 'scholar_supreme',
    name: 'Scholar Supreme',
    rarity: 'rare',
    team: 'scholar',
    icon: 'GraduationCap',
    primarySkill: { type: 'RESEARCH_DISCOUNT', value: 0.2 },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.08 },
    awakenedBonus: { type: 'RESEARCH_DISCOUNT', value: 0.1 },
    globalSecondaryBonus: { type: 'RESEARCH_DISCOUNT', value: 0.04 },
    flavorText: 'Knowledge is the ultimate resource.',
    maxLevel: 20,
  },

  // ========== EPIC ==========
  trade_tycoon: {
    id: 'trade_tycoon',
    name: 'Trade Tycoon',
    rarity: 'epic',
    team: 'trader',
    icon: 'TrendingUp',
    primarySkill: { type: 'SELL_VALUE_BOOST', value: 0.25 },
    secondarySkill: { type: 'STORAGE_CAPACITY', value: 0.15 },
    awakenedBonus: { type: 'EXPORT_SPEED', value: 0.15 },
    globalSecondaryBonus: { type: 'SELL_VALUE_BOOST', value: 0.05 },
    flavorText: 'Buy low, sell high, repeat.',
    maxLevel: 25,
  },

  cosmic_gambler: {
    id: 'cosmic_gambler',
    name: 'Cosmic Gambler',
    rarity: 'epic',
    team: 'lucky',
    icon: 'Dices',
    primarySkill: { type: 'GACHA_LUCK', value: 0.15 },
    secondarySkill: { type: 'SELL_VALUE_BOOST', value: 0.1 },
    awakenedBonus: { type: 'GACHA_LUCK', value: 0.1 },
    globalSecondaryBonus: { type: 'GACHA_LUCK', value: 0.05 },
    flavorText: 'The universe bends to their will.',
    maxLevel: 25,
  },

  // ========== LEGENDARY ==========
  void_walker: {
    id: 'void_walker',
    name: 'Void Walker',
    rarity: 'legendary',
    team: 'specialist',
    icon: 'Eclipse',
    primarySkill: { type: 'PLANET_BOOST', value: 0.4, target: 'voidPlanet' },
    secondarySkill: { type: 'PRODUCTION_BOOST', value: 0.15 },
    awakenedBonus: { type: 'PRODUCTION_BOOST', value: 0.2 },
    globalSecondaryBonus: { type: 'PRODUCTION_BOOST', value: 0.08 },
    flavorText: 'Where others see nothing, they see everything.',
    maxLevel: 30,
  },

  merchant_prince: {
    id: 'merchant_prince',
    name: 'Merchant Prince',
    rarity: 'legendary',
    team: 'trader',
    icon: 'Crown',
    primarySkill: { type: 'SELL_VALUE_BOOST', value: 0.35 },
    secondarySkill: { type: 'STORAGE_CAPACITY', value: 0.25 },
    awakenedBonus: { type: 'EXPORT_SPEED', value: 0.2 },
    globalSecondaryBonus: { type: 'SELL_VALUE_BOOST', value: 0.08 },
    flavorText: 'Wealth is just the beginning.',
    maxLevel: 30,
  },
};

// ============================================
// TEAM SYNERGIES
// ============================================

export interface TeamBonus {
  team: ManagerTeam;
  name: string;
  required: number; // Managers needed to activate
  skill: ManagerSkill;
}

export const TEAM_BONUSES: TeamBonus[] = [
  {
    team: 'farmer',
    name: "Farmer's Guild",
    required: 3,
    skill: { type: 'PRODUCTION_BOOST', value: 0.2 },
  },
  {
    team: 'trader',
    name: 'Merchant League',
    required: 3,
    skill: { type: 'SELL_VALUE_BOOST', value: 0.2 },
  },
  {
    team: 'scholar',
    name: 'Research Council',
    required: 2,
    skill: { type: 'RESEARCH_DISCOUNT', value: 0.15 },
  },
  {
    team: 'specialist',
    name: 'Planet Masters',
    required: 3,
    skill: { type: 'PRODUCTION_BOOST', value: 0.1 },
  },
  {
    team: 'lucky',
    name: "Fortune's Favor",
    required: 2,
    skill: { type: 'GACHA_LUCK', value: 0.1 },
  },
];

// ============================================
// GACHA CONFIG
// ============================================

export const MANAGER_GACHA_CONFIG = {
  PULL_COST: 50, // Crystals per pull
  MULTI_PULL_COUNT: 10,
  MULTI_PULL_DISCOUNT: 0.9, // 10% discount for 10-pull

  DROP_RATES: {
    common: 0.6,
    uncommon: 0.25,
    rare: 0.1,
    epic: 0.04,
    legendary: 0.01,
  },

  PITY: {
    epic: 50, // Guaranteed Epic at 50 pulls without one
    legendary: 100, // Guaranteed Legendary at 100 pulls without one
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all managers of a specific rarity
 */
export function getManagersByRarity(rarity: ManagerRarity): ManagerTemplate[] {
  return Object.values(MANAGER_TEMPLATES).filter(m => m.rarity === rarity);
}

/**
 * Get all managers of a specific team
 */
export function getManagersByTeam(team: ManagerTeam): ManagerTemplate[] {
  return Object.values(MANAGER_TEMPLATES).filter(m => m.team === team);
}

/**
 * Calculate manager power based on level
 * Each level adds 10% to base power
 */
export function calculateManagerPower(template: ManagerTemplate, level: number): number {
  const basePower = template.primarySkill.value;
  const levelBonus = basePower * (level - 1) * 0.1;
  return basePower + levelBonus;
}

/**
 * Check if a manager is at max level (awakened)
 */
export function isManagerAwakened(template: ManagerTemplate, level: number): boolean {
  return level >= template.maxLevel;
}

/**
 * Get active team bonuses based on owned managers
 */
export function getActiveTeamBonuses(ownedManagerIds: ManagerId[]): TeamBonus[] {
  const teamCounts: Record<ManagerTeam, number> = {
    farmer: 0,
    trader: 0,
    scholar: 0,
    specialist: 0,
    lucky: 0,
  };

  // Count managers per team
  for (const id of ownedManagerIds) {
    const template = MANAGER_TEMPLATES[id];
    if (template) {
      teamCounts[template.team]++;
    }
  }

  // Return bonuses where requirement is met
  return TEAM_BONUSES.filter(bonus => teamCounts[bonus.team] >= bonus.required);
}

/**
 * Get rarity color for UI
 */
export function getManagerRarityColor(rarity: ManagerRarity): string {
  return MANAGER_RARITY_CONFIG[rarity].color;
}

/**
 * Get total number of managers
 */
export function getTotalManagerCount(): number {
  return Object.keys(MANAGER_TEMPLATES).length;
}

/**
 * Get human-readable label for skill type
 */
export function getSkillLabel(type: string): string {
  switch (type) {
    case 'PRODUCTION_BOOST':
      return 'Production';
    case 'SEED_TYPE_BOOST':
      return 'Seed Type';
    case 'PLANET_BOOST':
      return 'Planet';
    case 'SELL_VALUE_BOOST':
      return 'Sell Value';
    case 'EXPORT_SPEED':
      return 'Export Speed';
    case 'STORAGE_CAPACITY':
      return 'Storage Capacity';
    case 'RESEARCH_DISCOUNT':
      return 'Research Cost';
    case 'GACHA_LUCK':
      return 'Gacha Luck';
    default:
      return type;
  }
}
