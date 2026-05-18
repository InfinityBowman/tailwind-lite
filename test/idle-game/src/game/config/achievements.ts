/**
 * Achievement Configuration
 * Defines all achievements and their requirements
 *
 * NOTE: Icons use Lucide icon names (PascalCase). NO EMOJIS.
 */

export type AchievementCategory =
  | 'production'
  | 'wealth'
  | 'collection'
  | 'progression'
  | 'mastery';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'none';

export type AchievementRewardType = 'credits' | 'crystals' | 'essence' | 'refinedEssence' | 'title';

export interface AchievementReward {
  type: AchievementRewardType;
  amount: number;
  title?: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  target: number;
  reward: AchievementReward;
  icon: string; // Lucide icon name (PascalCase)
  tier: AchievementTier;
  hidden?: boolean;
  trackingEvent: string;
  checkType?: 'count' | 'unique' | 'max' | 'threshold';
}

// Category metadata - icons are Lucide names
export const ACHIEVEMENT_CATEGORIES: Record<
  AchievementCategory,
  { name: string; icon: string; color: string }
> = {
  production: { name: 'Production', icon: 'Sprout', color: 'text-green-400' },
  wealth: { name: 'Wealth', icon: 'Coins', color: 'text-yellow-400' },
  collection: { name: 'Collection', icon: 'Package', color: 'text-blue-400' },
  progression: { name: 'Progression', icon: 'Rocket', color: 'text-purple-400' },
  mastery: { name: 'Mastery', icon: 'Crown', color: 'text-orange-400' },
};

// Tier colors for UI
export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'text-amber-600 border-amber-600/50 bg-amber-900/20',
  silver: 'text-gray-300 border-gray-300/50 bg-gray-700/20',
  gold: 'text-yellow-400 border-yellow-400/50 bg-yellow-900/20',
  none: 'text-primary border-primary/50 bg-primary/10',
};

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  // ============================================
  // PRODUCTION - Growing and selling plants
  // ============================================

  firstHarvest: {
    id: 'firstHarvest',
    name: 'First Harvest',
    description: 'Sell 100 plants',
    category: 'production',
    target: 100,
    reward: { type: 'credits', amount: 100 },
    icon: 'Wheat',
    tier: 'none',
    trackingEvent: 'plantsSold',
    checkType: 'count',
  },

  plantSellerBronze: {
    id: 'plantSellerBronze',
    name: 'Plant Seller',
    description: 'Sell 1,000 plants',
    category: 'production',
    target: 1000,
    reward: { type: 'credits', amount: 500 },
    icon: 'Leaf',
    tier: 'bronze',
    trackingEvent: 'plantsSold',
    checkType: 'count',
  },

  plantSellerSilver: {
    id: 'plantSellerSilver',
    name: 'Plant Seller',
    description: 'Sell 10,000 plants',
    category: 'production',
    target: 10000,
    reward: { type: 'credits', amount: 2500 },
    icon: 'Leaf',
    tier: 'silver',
    trackingEvent: 'plantsSold',
    checkType: 'count',
  },

  plantSellerGold: {
    id: 'plantSellerGold',
    name: 'Plant Seller',
    description: 'Sell 100,000 plants',
    category: 'production',
    target: 100000,
    reward: { type: 'crystals', amount: 25 },
    icon: 'Leaf',
    tier: 'gold',
    trackingEvent: 'plantsSold',
    checkType: 'count',
  },

  // ============================================
  // WEALTH - Earning credits
  // ============================================

  firstExport: {
    id: 'firstExport',
    name: 'First Export',
    description: 'Earn your first 100 credits',
    category: 'wealth',
    target: 100,
    reward: { type: 'credits', amount: 25 },
    icon: 'PackageCheck',
    tier: 'none',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
  },

  earlyBird: {
    id: 'earlyBird',
    name: 'Early Bird',
    description: 'Earn 250 lifetime credits',
    category: 'wealth',
    target: 250,
    reward: { type: 'credits', amount: 50 },
    icon: 'TrendingUp',
    tier: 'none',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
  },

  makingProgress: {
    id: 'makingProgress',
    name: 'Making Progress',
    description: 'Earn 500 lifetime credits',
    category: 'wealth',
    target: 500,
    reward: { type: 'credits', amount: 75 },
    icon: 'ArrowUpCircle',
    tier: 'none',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
  },

  firstThousand: {
    id: 'firstThousand',
    name: 'Getting Started',
    description: 'Earn 1,000 lifetime credits',
    category: 'wealth',
    target: 1000,
    reward: { type: 'credits', amount: 100 },
    icon: 'Banknote',
    tier: 'none',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
  },

  firstMillion: {
    id: 'firstMillion',
    name: 'First Million',
    description: 'Earn 1,000,000 lifetime credits',
    category: 'wealth',
    target: 1000000,
    reward: { type: 'crystals', amount: 50 },
    icon: 'Gem',
    tier: 'none',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
  },

  billionaire: {
    id: 'billionaire',
    name: 'Space Billionaire',
    description: 'Earn 1,000,000,000 lifetime credits',
    category: 'wealth',
    target: 1000000000,
    reward: { type: 'crystals', amount: 500 },
    icon: 'Trophy',
    tier: 'gold',
    trackingEvent: 'creditsEarned',
    checkType: 'count',
    hidden: true,
  },

  // ============================================
  // COLLECTION - Seeds and gacha
  // ============================================

  greenThumb: {
    id: 'greenThumb',
    name: 'Green Thumb',
    description: 'Own 10 different seed types',
    category: 'collection',
    target: 10,
    reward: { type: 'essence', amount: 50 },
    icon: 'Sprout',
    tier: 'none',
    trackingEvent: 'uniqueSeedTypesOwned',
    checkType: 'unique',
  },

  seedCollector: {
    id: 'seedCollector',
    name: 'Seed Collector',
    description: 'Own one of each seed type (10 types)',
    category: 'collection',
    target: 10,
    reward: { type: 'crystals', amount: 25 },
    icon: 'Archive',
    tier: 'gold',
    trackingEvent: 'uniqueSeedTypesOwned',
    checkType: 'unique',
  },

  firstGacha: {
    id: 'firstGacha',
    name: 'Lucky Draw',
    description: 'Pull the gacha for the first time',
    category: 'collection',
    target: 1,
    reward: { type: 'credits', amount: 50 },
    icon: 'Sparkles',
    tier: 'none',
    trackingEvent: 'gachaPulls',
    checkType: 'count',
  },

  gachaAddict: {
    id: 'gachaAddict',
    name: 'Gacha Enthusiast',
    description: 'Pull gacha 500 times',
    category: 'collection',
    target: 500,
    reward: { type: 'crystals', amount: 20 },
    icon: 'Dices',
    tier: 'gold',
    trackingEvent: 'gachaPulls',
    checkType: 'count',
  },

  luckyPullBronze: {
    id: 'luckyPullBronze',
    name: 'Lucky Pull',
    description: 'Pull gacha 50 times',
    category: 'collection',
    target: 50,
    reward: { type: 'credits', amount: 250 },
    icon: 'Dice6',
    tier: 'bronze',
    trackingEvent: 'gachaPulls',
    checkType: 'count',
  },

  luckyPullSilver: {
    id: 'luckyPullSilver',
    name: 'Lucky Pull',
    description: 'Pull gacha 200 times',
    category: 'collection',
    target: 200,
    reward: { type: 'credits', amount: 1000 },
    icon: 'Dice6',
    tier: 'silver',
    trackingEvent: 'gachaPulls',
    checkType: 'count',
  },

  // ============================================
  // PROGRESSION - Game milestones
  // ============================================

  planetExplorer: {
    id: 'planetExplorer',
    name: 'Planet Explorer',
    description: 'Unlock all 9 planets',
    category: 'progression',
    target: 9,
    reward: { type: 'crystals', amount: 100 },
    icon: 'Globe',
    tier: 'gold',
    trackingEvent: 'planetsUnlocked',
    checkType: 'count',
  },

  firstPlanet: {
    id: 'firstPlanet',
    name: 'New Horizons',
    description: 'Unlock your first new planet',
    category: 'progression',
    target: 2,
    reward: { type: 'credits', amount: 200 },
    icon: 'Rocket',
    tier: 'none',
    trackingEvent: 'planetsUnlocked',
    checkType: 'count',
  },

  researchComplete: {
    id: 'researchComplete',
    name: 'Research Complete',
    description: 'Complete all research nodes',
    category: 'progression',
    target: 14,
    reward: { type: 'crystals', amount: 100 },
    icon: 'FlaskConical',
    tier: 'gold',
    trackingEvent: 'researchCompleted',
    checkType: 'count',
  },

  firstResearch: {
    id: 'firstResearch',
    name: 'Knowledge Seeker',
    description: 'Complete your first research',
    category: 'progression',
    target: 1,
    reward: { type: 'refinedEssence', amount: 25 },
    icon: 'BookOpen',
    tier: 'none',
    trackingEvent: 'researchCompleted',
    checkType: 'count',
  },

  prestigeMaster: {
    id: 'prestigeMaster',
    name: 'Prestige Master',
    description: 'Prestige 10 times',
    category: 'progression',
    target: 10,
    reward: { type: 'crystals', amount: 200 },
    icon: 'Star',
    tier: 'gold',
    trackingEvent: 'prestigeCount',
    checkType: 'count',
  },

  firstPrestige: {
    id: 'firstPrestige',
    name: 'A New Beginning',
    description: 'Prestige for the first time',
    category: 'progression',
    target: 1,
    reward: { type: 'crystals', amount: 10 },
    icon: 'Sparkles',
    tier: 'none',
    trackingEvent: 'prestigeCount',
    checkType: 'count',
  },

  prestigeVeteran: {
    id: 'prestigeVeteran',
    name: 'Prestige Veteran',
    description: 'Prestige 5 times',
    category: 'progression',
    target: 5,
    reward: { type: 'crystals', amount: 50 },
    icon: 'Sparkles',
    tier: 'silver',
    trackingEvent: 'prestigeCount',
    checkType: 'count',
  },

  // ============================================
  // MASTERY - Advanced achievements
  // ============================================

  mythicFarmer: {
    id: 'mythicFarmer',
    name: 'Mythic Farmer',
    description: 'Create a Tier 6 seed',
    category: 'mastery',
    target: 6,
    reward: { type: 'crystals', amount: 100 },
    icon: 'Crown',
    tier: 'gold',
    trackingEvent: 'maxSeedTier',
    checkType: 'max',
  },

  firstFusion: {
    id: 'firstFusion',
    name: 'First Fusion',
    description: 'Fuse your first seed',
    category: 'mastery',
    target: 1,
    reward: { type: 'credits', amount: 100 },
    icon: 'Sparkle',
    tier: 'none',
    trackingEvent: 'seedsFused',
    checkType: 'count',
  },

  fusionExpert: {
    id: 'fusionExpert',
    name: 'Fusion Expert',
    description: 'Fuse 100 seeds total',
    category: 'mastery',
    target: 100,
    reward: { type: 'crystals', amount: 30 },
    icon: 'Wand2',
    tier: 'gold',
    trackingEvent: 'seedsFused',
    checkType: 'count',
  },

  fusionApprenticeBronze: {
    id: 'fusionApprenticeBronze',
    name: 'Fusion Apprentice',
    description: 'Fuse 10 seeds',
    category: 'mastery',
    target: 10,
    reward: { type: 'essence', amount: 25 },
    icon: 'Beaker',
    tier: 'bronze',
    trackingEvent: 'seedsFused',
    checkType: 'count',
  },

  fusionApprenticeSilver: {
    id: 'fusionApprenticeSilver',
    name: 'Fusion Apprentice',
    description: 'Fuse 50 seeds',
    category: 'mastery',
    target: 50,
    reward: { type: 'essence', amount: 100 },
    icon: 'Beaker',
    tier: 'silver',
    trackingEvent: 'seedsFused',
    checkType: 'count',
  },

  tierHunter: {
    id: 'tierHunter',
    name: 'Tier Hunter',
    description: 'Create a Tier 4 seed',
    category: 'mastery',
    target: 4,
    reward: { type: 'credits', amount: 1000 },
    icon: 'Target',
    tier: 'silver',
    trackingEvent: 'maxSeedTier',
    checkType: 'max',
  },

  refineryMaster: {
    id: 'refineryMaster',
    name: 'Refinery Master',
    description: 'Refine 10,000 plants total',
    category: 'mastery',
    target: 10000,
    reward: { type: 'refinedEssence', amount: 500 },
    icon: 'Factory',
    tier: 'gold',
    trackingEvent: 'plantsRefined',
    checkType: 'count',
  },

  // ============================================
  // COLLECTION - Managers
  // ============================================

  firstRecruit: {
    id: 'firstRecruit',
    name: 'First Recruit',
    description: 'Recruit your first manager',
    category: 'collection',
    target: 1,
    reward: { type: 'crystals', amount: 50 },
    icon: 'UserPlus',
    tier: 'none',
    trackingEvent: 'managersRecruited',
    checkType: 'count',
  },

  recruitingOffice: {
    id: 'recruitingOffice',
    name: 'Recruiting Office',
    description: 'Own 5 different managers',
    category: 'collection',
    target: 5,
    reward: { type: 'crystals', amount: 100 },
    icon: 'Users',
    tier: 'bronze',
    trackingEvent: 'uniqueManagersOwned',
    checkType: 'count',
  },

  managerCollector: {
    id: 'managerCollector',
    name: 'Manager Collector',
    description: 'Own 10 different managers',
    category: 'collection',
    target: 10,
    reward: { type: 'crystals', amount: 200 },
    icon: 'Users',
    tier: 'silver',
    trackingEvent: 'uniqueManagersOwned',
    checkType: 'count',
  },

  luckyFind: {
    id: 'luckyFind',
    name: 'Lucky Find',
    description: 'Recruit an Epic or Legendary manager',
    category: 'collection',
    target: 1,
    reward: { type: 'crystals', amount: 150 },
    icon: 'Star',
    tier: 'silver',
    trackingEvent: 'epicManagersRecruited',
    checkType: 'count',
  },

  teamBuilder: {
    id: 'teamBuilder',
    name: 'Team Builder',
    description: 'Unlock a team synergy bonus',
    category: 'collection',
    target: 1,
    reward: { type: 'crystals', amount: 100 },
    icon: 'Crown',
    tier: 'bronze',
    trackingEvent: 'teamBonusesUnlocked',
    checkType: 'count',
  },

  awakening: {
    id: 'awakening',
    name: 'Awakening',
    description: 'Fully awaken a manager',
    category: 'collection',
    target: 1,
    reward: { type: 'crystals', amount: 250 },
    icon: 'Sparkles',
    tier: 'gold',
    trackingEvent: 'managersAwakened',
    checkType: 'count',
  },

  // ============================================
  // BREEDING - Breeding seeds and discovering traits
  // ============================================

  firstBreeding: {
    id: 'firstBreeding',
    name: 'First Crossing',
    description: 'Complete your first breeding',
    category: 'mastery',
    target: 1,
    reward: { type: 'credits', amount: 500 },
    icon: 'GitMerge',
    tier: 'none',
    trackingEvent: 'seedsBred',
    checkType: 'count',
  },

  breederBronze: {
    id: 'breederBronze',
    name: 'Plant Breeder',
    description: 'Breed 10 seeds',
    category: 'mastery',
    target: 10,
    reward: { type: 'credits', amount: 1000 },
    icon: 'GitMerge',
    tier: 'bronze',
    trackingEvent: 'seedsBred',
    checkType: 'count',
  },

  breederSilver: {
    id: 'breederSilver',
    name: 'Plant Breeder',
    description: 'Breed 50 seeds',
    category: 'mastery',
    target: 50,
    reward: { type: 'crystals', amount: 50 },
    icon: 'GitMerge',
    tier: 'silver',
    trackingEvent: 'seedsBred',
    checkType: 'count',
  },

  breederGold: {
    id: 'breederGold',
    name: 'Master Breeder',
    description: 'Breed 250 seeds',
    category: 'mastery',
    target: 250,
    reward: { type: 'crystals', amount: 200 },
    icon: 'GitMerge',
    tier: 'gold',
    trackingEvent: 'seedsBred',
    checkType: 'count',
  },

  traitDiscoverer: {
    id: 'traitDiscoverer',
    name: 'Trait Discovery',
    description: 'Discover 5 new traits through breeding',
    category: 'mastery',
    target: 5,
    reward: { type: 'crystals', amount: 25 },
    icon: 'Dna',
    tier: 'bronze',
    trackingEvent: 'traitsDiscovered',
    checkType: 'count',
  },

  traitExpert: {
    id: 'traitExpert',
    name: 'Trait Expert',
    description: 'Discover 25 new traits through breeding',
    category: 'mastery',
    target: 25,
    reward: { type: 'crystals', amount: 100 },
    icon: 'Dna',
    tier: 'silver',
    trackingEvent: 'traitsDiscovered',
    checkType: 'count',
  },

  geneticist: {
    id: 'geneticist',
    name: 'Master Geneticist',
    description: 'Discover 100 new traits through breeding',
    category: 'mastery',
    target: 100,
    reward: { type: 'crystals', amount: 500 },
    icon: 'Dna',
    tier: 'gold',
    trackingEvent: 'traitsDiscovered',
    checkType: 'count',
  },

  recipeDiscoverer: {
    id: 'recipeDiscoverer',
    name: 'Recipe Hunter',
    description: 'Discover a hidden breeding recipe',
    category: 'mastery',
    target: 1,
    reward: { type: 'crystals', amount: 100 },
    icon: 'FlaskConical',
    tier: 'bronze',
    trackingEvent: 'recipesDiscovered',
    checkType: 'count',
  },

  recipeCollector: {
    id: 'recipeCollector',
    name: 'Recipe Collector',
    description: 'Discover all hidden breeding recipes',
    category: 'mastery',
    target: 2, // All 2 hidden recipes: cosmic_creation, origin_discovery
    reward: { type: 'crystals', amount: 250 },
    icon: 'FlaskConical',
    tier: 'silver',
    trackingEvent: 'recipesDiscovered',
    checkType: 'count',
  },

  legendaryBreeder: {
    id: 'legendaryBreeder',
    name: 'Legendary Breeder',
    description: 'Breed a seed with a legendary trait',
    category: 'mastery',
    target: 1,
    reward: { type: 'crystals', amount: 200 },
    icon: 'Star',
    tier: 'gold',
    trackingEvent: 'legendaryTraits',
    checkType: 'count',
  },
};

export const ALL_ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENT_DEFINITIONS);

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ALL_ACHIEVEMENT_IDS.filter(id => ACHIEVEMENT_DEFINITIONS[id].category === category).map(
    id => ACHIEVEMENT_DEFINITIONS[id]
  );
}

export function getAchievementsByTier(tier: AchievementTier): AchievementDefinition[] {
  return ALL_ACHIEVEMENT_IDS.filter(id => ACHIEVEMENT_DEFINITIONS[id].tier === tier).map(
    id => ACHIEVEMENT_DEFINITIONS[id]
  );
}

export function getVisibleAchievements(unlockedIds: string[]): AchievementDefinition[] {
  return ALL_ACHIEVEMENT_IDS.filter(
    id => !ACHIEVEMENT_DEFINITIONS[id].hidden || unlockedIds.includes(id)
  ).map(id => ACHIEVEMENT_DEFINITIONS[id]);
}
