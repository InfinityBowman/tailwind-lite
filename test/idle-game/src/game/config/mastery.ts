/**
 * Mastery System Configuration
 * Each seed type has mastery that increases from harvesting
 */

// Mastery per harvest based on seed tier
export const MASTERY_PER_HARVEST: Record<number, number> = {
  1: 1, // T1: 1 mastery per harvest
  2: 2, // T2: 2 mastery
  3: 3, // T3: 3 mastery
  4: 5, // T4: 5 mastery
  5: 8, // T5: 8 mastery
  6: 12, // T6: 12 mastery
};

export const MAX_MASTERY = 100;

// Bonuses per mastery level (applied linearly)
export const MASTERY_BONUS_PER_LEVEL = {
  production: 0.005, // +0.5% production per mastery level (max +50%)
  sellValue: 0.003, // +0.3% sell value per mastery level (max +30%)
};

// Milestones for reaching certain mastery levels
export interface MasteryMilestone {
  level: number;
  reward: {
    type: 'credits' | 'crystals' | 'essence' | 'refinedEssence';
    amount: number;
  };
  description: string;
}

export const MASTERY_MILESTONES: MasteryMilestone[] = [
  { level: 10, reward: { type: 'credits', amount: 1000 }, description: 'Novice Farmer' },
  { level: 25, reward: { type: 'essence', amount: 10 }, description: 'Apprentice Farmer' },
  { level: 50, reward: { type: 'crystals', amount: 5 }, description: 'Skilled Farmer' },
  { level: 75, reward: { type: 'refinedEssence', amount: 25 }, description: 'Expert Farmer' },
  { level: 100, reward: { type: 'crystals', amount: 20 }, description: 'Master Farmer' },
];

// Total mastery milestones (across all seeds)
export interface TotalMasteryMilestone {
  total: number;
  bonus: {
    type: 'productionMultiplier' | 'sellMultiplier' | 'essenceMultiplier';
    value: number;
  };
  description: string;
}

export const TOTAL_MASTERY_MILESTONES: TotalMasteryMilestone[] = [
  {
    total: 100,
    bonus: { type: 'productionMultiplier', value: 0.05 },
    description: '+5% all production',
  },
  { total: 250, bonus: { type: 'sellMultiplier', value: 0.1 }, description: '+10% sell value' },
  {
    total: 500,
    bonus: { type: 'productionMultiplier', value: 0.1 },
    description: '+10% all production',
  },
  {
    total: 750,
    bonus: { type: 'essenceMultiplier', value: 0.15 },
    description: '+15% essence gain',
  },
  {
    total: 1000,
    bonus: { type: 'productionMultiplier', value: 0.15 },
    description: '+15% all production',
  },
];

/**
 * Calculate mastery production bonus for a seed
 */
export function getMasteryProductionBonus(mastery: number): number {
  return mastery * MASTERY_BONUS_PER_LEVEL.production;
}

/**
 * Calculate mastery sell value bonus for a seed
 */
export function getMasterySellBonus(mastery: number): number {
  return mastery * MASTERY_BONUS_PER_LEVEL.sellValue;
}

/**
 * Get mastery gained from a harvest
 */
export function getMasteryGain(tier: number, currentMastery: number): number {
  if (currentMastery >= MAX_MASTERY) return 0;
  const gain = MASTERY_PER_HARVEST[tier] || 1;
  return Math.min(gain, MAX_MASTERY - currentMastery);
}

/**
 * Get unlocked milestones for a mastery level
 */
export function getUnlockedMilestones(mastery: number): MasteryMilestone[] {
  return MASTERY_MILESTONES.filter(m => mastery >= m.level);
}

/**
 * Get next milestone for a mastery level
 */
export function getNextMilestone(mastery: number): MasteryMilestone | null {
  return MASTERY_MILESTONES.find(m => mastery < m.level) || null;
}

/**
 * Get total mastery bonus multiplier
 */
export function getTotalMasteryBonus(
  totalMastery: number,
  bonusType: 'productionMultiplier' | 'sellMultiplier' | 'essenceMultiplier'
): number {
  return TOTAL_MASTERY_MILESTONES.filter(
    m => totalMastery >= m.total && m.bonus.type === bonusType
  ).reduce((sum, m) => sum + m.bonus.value, 0);
}
