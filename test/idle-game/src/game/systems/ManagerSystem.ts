/**
 * Manager System - Display helpers for manager UI
 *
 * Manager gacha, assignment, and mutation logic lives server-side in convex/managers.ts.
 */

import {
  ManagerId,
  ManagerRarity,
  ManagerTemplate,
  ManagerSkill,
  MANAGER_TEMPLATES,
  MANAGER_GACHA_CONFIG,
  calculateManagerPower,
} from '../config/managers';

// ============================================
// TYPES
// ============================================

export interface ManagerInstance {
  instanceId: string; // Unique ID for this manager instance
  templateId: ManagerId; // Which manager template
  level: number; // Current level (1-max)
  isAwakened: boolean; // Has reached max level
  obtainedAt: number; // Timestamp when first obtained
}

export interface ManagerState {
  owned: ManagerInstance[]; // All owned managers
  assignments: Record<string, string | null>; // planetId -> instanceId
  pullCount: number; // Total pulls for pity
  lastEpicPull: number; // Pull # of last epic
  lastLegendaryPull: number; // Pull # of last legendary
}

export interface ManagerPullResult {
  manager: ManagerInstance;
  template: ManagerTemplate;
  isNew: boolean; // First time getting this manager
  leveledUp: boolean; // Already had, leveled up
  newLevel: number; // Current level after pull
  isAwakened: boolean; // Just became awakened
}

// ============================================
// STATE INITIALIZATION
// ============================================

export function createInitialManagerState(): ManagerState {
  return {
    owned: [],
    assignments: {},
    pullCount: 0,
    lastEpicPull: 0,
    lastLegendaryPull: 0,
  };
}

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Check if player can afford a pull
 * @param crystals - Current crystal balance (from ship.crystals)
 * @param count - Number of pulls (1 for single, 10 for multi)
 */
export function canAffordPull(crystals: number, count: number = 1): boolean {
  const cost =
    count === 10
      ? Math.floor(MANAGER_GACHA_CONFIG.PULL_COST * 10 * MANAGER_GACHA_CONFIG.MULTI_PULL_DISCOUNT)
      : MANAGER_GACHA_CONFIG.PULL_COST * count;

  return crystals >= cost;
}

/**
 * Get manager assigned to a planet
 */
export function getManagerForPlanet(state: ManagerState, planetId: string): ManagerInstance | null {
  const instanceId = state.assignments[planetId];
  if (!instanceId) return null;

  return state.owned.find(m => m.instanceId === instanceId) || null;
}

// ============================================
// BONUS CALCULATIONS
// ============================================

/**
 * Calculate all bonuses from a specific manager (with level scaling)
 */
function calculateManagerBonuses(manager: ManagerInstance): ManagerSkill[] {
  const template = MANAGER_TEMPLATES[manager.templateId];
  if (!template) return [];

  const skills: ManagerSkill[] = [];

  // Primary skill (scaled by level)
  const primaryPower = calculateManagerPower(template, manager.level);
  skills.push({
    ...template.primarySkill,
    value: primaryPower,
  });

  // Secondary skill (if exists, at half level scaling)
  if (template.secondarySkill) {
    const secondaryPower = template.secondarySkill.value * (1 + (manager.level - 1) * 0.05);
    skills.push({
      ...template.secondarySkill,
      value: secondaryPower,
    });
  }

  // Awakened bonus (if awakened)
  if (manager.isAwakened && template.awakenedBonus) {
    skills.push(template.awakenedBonus);
  }

  return skills;
}

/**
 * Calculate production bonus for a specific planet from assigned manager
 */
export function calculateManagerProductionBonus(state: ManagerState, planetId: string): number {
  const manager = getManagerForPlanet(state, planetId);
  if (!manager) return 0;

  const skills = calculateManagerBonuses(manager);
  let bonus = 0;

  for (const skill of skills) {
    if (skill.type === 'PRODUCTION_BOOST') {
      bonus += skill.value;
    } else if (skill.type === 'PLANET_BOOST' && skill.target === planetId) {
      bonus += skill.value;
    }
  }

  return bonus;
}

// ============================================
// GLOBAL SECONDARY BONUSES (Awakened Managers)
// ============================================

/**
 * Aggregated global bonuses by skill type
 */
export interface GlobalSecondaryBonuses {
  productionBoost: number; // PRODUCTION_BOOST - applies to all planets
  sellValueBoost: number; // SELL_VALUE_BOOST - applies to all sales
  exportSpeed: number; // EXPORT_SPEED - increases export speed globally
  storageCapacity: number; // STORAGE_CAPACITY - increases storage globally
  researchDiscount: number; // RESEARCH_DISCOUNT - reduces research costs
  gachaLuck: number; // GACHA_LUCK - improves gacha rates
}

/**
 * Calculate global secondary bonuses from all awakened managers.
 * These bonuses apply to ALL planets, not just assigned ones.
 * Unlocked when a manager reaches awakening level (max level).
 */
export function calculateGlobalSecondaryBonuses(state: ManagerState): GlobalSecondaryBonuses {
  const bonuses: GlobalSecondaryBonuses = {
    productionBoost: 0,
    sellValueBoost: 0,
    exportSpeed: 0,
    storageCapacity: 0,
    researchDiscount: 0,
    gachaLuck: 0,
  };

  // Only count awakened managers
  const awakenedManagers = state.owned.filter(m => m.isAwakened);

  for (const manager of awakenedManagers) {
    const template = MANAGER_TEMPLATES[manager.templateId];
    if (!template?.globalSecondaryBonus) continue;

    const bonus = template.globalSecondaryBonus;

    switch (bonus.type) {
      case 'PRODUCTION_BOOST':
        bonuses.productionBoost += bonus.value;
        break;
      case 'SELL_VALUE_BOOST':
        bonuses.sellValueBoost += bonus.value;
        break;
      case 'EXPORT_SPEED':
        bonuses.exportSpeed += bonus.value;
        break;
      case 'STORAGE_CAPACITY':
        bonuses.storageCapacity += bonus.value;
        break;
      case 'RESEARCH_DISCOUNT':
        bonuses.researchDiscount += bonus.value;
        break;
      case 'GACHA_LUCK':
        bonuses.gachaLuck += bonus.value;
        break;
    }
  }

  return bonuses;
}

/**
 * Get list of awakened managers with their global secondary bonuses
 * Useful for UI display
 */
export function getAwakenedManagersWithBonuses(state: ManagerState): Array<{
  manager: ManagerInstance;
  template: ManagerTemplate;
  globalBonus: ManagerSkill | undefined;
}> {
  return state.owned
    .filter(m => m.isAwakened)
    .map(m => ({
      manager: m,
      template: MANAGER_TEMPLATES[m.templateId],
      globalBonus: MANAGER_TEMPLATES[m.templateId]?.globalSecondaryBonus,
    }))
    .filter(item => item.template !== undefined);
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get collection progress stats
 */
export function getCollectionStats(state: ManagerState): {
  owned: number;
  total: number;
  byRarity: Record<ManagerRarity, { owned: number; total: number }>;
  awakened: number;
} {
  const total = Object.keys(MANAGER_TEMPLATES).length;
  const uniqueOwned = new Set(state.owned.map(m => m.templateId));

  const byRarity: Record<ManagerRarity, { owned: number; total: number }> = {
    common: { owned: 0, total: 0 },
    uncommon: { owned: 0, total: 0 },
    rare: { owned: 0, total: 0 },
    epic: { owned: 0, total: 0 },
    legendary: { owned: 0, total: 0 },
  };

  // Count totals per rarity
  for (const template of Object.values(MANAGER_TEMPLATES)) {
    byRarity[template.rarity].total++;
    if (uniqueOwned.has(template.id)) {
      byRarity[template.rarity].owned++;
    }
  }

  const awakened = state.owned.filter(m => m.isAwakened).length;

  return {
    owned: uniqueOwned.size,
    total,
    byRarity,
    awakened,
  };
}
