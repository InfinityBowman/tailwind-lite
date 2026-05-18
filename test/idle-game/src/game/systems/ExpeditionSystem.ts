/**
 * Expedition System
 *
 * Manages timed manager expeditions for bonus rewards.
 */

import { generateUniqueId } from './GachaSystem';
import {
  ExpeditionTypeId,
  EXPEDITION_CONFIG,
  EXPEDITION_TYPES,
  getExpeditionType,
  isExpeditionUnlocked,
} from '../config/expeditions';
import { ManagerInstance, ManagerState } from './ManagerSystem';
import { MANAGER_TEMPLATES, getActiveTeamBonuses, calculateManagerPower } from '../config/managers';
import { CraftingState, consumeMultipleSupplies, combineSupplyEffects } from './CraftingSystem';

// ============================================
// TYPES
// ============================================

export interface CalculatedReward {
  type: 'credits' | 'crystals' | 'seeds' | 'fragments';
  amount: number;
  rarity?: string; // For seeds
}

export interface ActiveExpedition {
  id: string;
  typeId: ExpeditionTypeId;
  managerIds: string[]; // instanceIds of assigned managers
  startTime: number;
  endTime: number;
  rewards: CalculatedReward[]; // Pre-calculated at launch
  success: boolean; // Pre-calculated at launch
  suppliesUsed?: string[]; // Item IDs of supplies consumed
}

export interface ExpeditionResult {
  expeditionId: string;
  typeId: ExpeditionTypeId;
  success: boolean;
  rewards: CalculatedReward[];
  completedAt: number;
}

export interface ExpeditionState {
  active: ActiveExpedition[];
  maxSlots: number;
  completed: number; // Total lifetime completed
  history: ExpeditionResult[]; // Last N results
}

// ============================================
// STATE INITIALIZATION
// ============================================

export function createInitialExpeditionState(): ExpeditionState {
  return {
    active: [],
    maxSlots: EXPEDITION_CONFIG.INITIAL_SLOTS,
    completed: 0,
    history: [],
  };
}

// ============================================
// CALCULATIONS
// ============================================

/**
 * Calculate success rate for an expedition with given managers
 */
export function calculateSuccessRate(
  typeId: ExpeditionTypeId,
  managers: ManagerInstance[]
): number {
  const type = getExpeditionType(typeId);
  if (!type) return 0;

  const { MAX_POWER_BONUS, POWER_FOR_MAX_BONUS, SYNERGY_BONUS_PER_LEVEL } = EXPEDITION_CONFIG;

  // Calculate total power
  const totalPower = managers.reduce((sum, m) => {
    const template = MANAGER_TEMPLATES[m.templateId];
    if (!template) return sum;
    return sum + calculateManagerPower(template, m.level);
  }, 0);

  // Power bonus (capped at MAX_POWER_BONUS)
  const powerBonus = Math.min(totalPower / POWER_FOR_MAX_BONUS, 1) * MAX_POWER_BONUS;

  // Team synergy bonus
  const teamBonuses = getActiveTeamBonuses(managers.map(m => m.templateId));
  const synergyBonus = teamBonuses.length * SYNERGY_BONUS_PER_LEVEL;

  // Final rate (capped at 99%)
  return Math.min(type.baseSuccessRate + powerBonus + synergyBonus, 0.99);
}

/**
 * Calculate reward multiplier based on manager skills and rarity
 */
export function calculateRewardMultiplier(
  managers: ManagerInstance[],
  rewardType: 'credits' | 'crystals' | 'seeds' | 'fragments'
): number {
  const { RARITY_BONUS } = EXPEDITION_CONFIG;

  let skillBonus = 0;
  let totalRarityBonus = 0;

  managers.forEach(m => {
    const template = MANAGER_TEMPLATES[m.templateId];
    if (!template) return;

    // Skill bonus based on reward type
    const skillType = template.primarySkill.type;
    const skillPower = calculateManagerPower(template, m.level);

    // Map reward types to relevant skills
    if (rewardType === 'credits' && skillType === 'SELL_VALUE_BOOST') {
      skillBonus += skillPower;
    } else if (rewardType === 'crystals' && skillType === 'GACHA_LUCK') {
      skillBonus += skillPower;
    } else if (rewardType === 'seeds' && skillType === 'PRODUCTION_BOOST') {
      skillBonus += skillPower * 0.5; // Production skill helps seed finds
    }

    // Rarity bonus
    totalRarityBonus += RARITY_BONUS[template.rarity];
  });

  const avgRarityBonus = managers.length > 0 ? totalRarityBonus / managers.length : 0;

  return 1 + skillBonus + avgRarityBonus;
}

/**
 * Pre-calculate all rewards for an expedition
 * @param supplyEffects - Combined supply effects from consumed supplies
 */
export function calculateExpeditionRewards(
  typeId: ExpeditionTypeId,
  managers: ManagerInstance[],
  success: boolean,
  rng: () => number = Math.random,
  supplyEffects: Record<string, number> = {}
): CalculatedReward[] {
  const type = getExpeditionType(typeId);
  if (!type) return [];

  const rewards: CalculatedReward[] = [];

  // Get supply bonuses
  const rewardBonus = supplyEffects.expeditionRewards || 0; // star_map: +25%
  const legendaryBonus = supplyEffects.legendaryChance || 0; // cosmic_beacon: +10%

  type.rewards.forEach(rewardConfig => {
    // Apply legendary chance bonus to legendary seed rewards
    let adjustedChance = rewardConfig.chance;
    if (rewardConfig.type === 'seeds' && rewardConfig.rarity === 'legendary') {
      adjustedChance += legendaryBonus;
    }

    // Check if this reward triggers
    if (rng() > adjustedChance) return;

    // Calculate base amount
    const range = rewardConfig.max - rewardConfig.min;
    let amount = Math.floor(rewardConfig.min + rng() * range);

    // Apply multiplier from manager skills
    const multiplier = calculateRewardMultiplier(managers, rewardConfig.type);
    amount = Math.floor(amount * multiplier);

    // Apply supply reward bonus (star_map)
    amount = Math.floor(amount * (1 + rewardBonus));

    // Apply failure penalty
    if (!success) {
      amount = Math.floor(amount * EXPEDITION_CONFIG.FAILURE_REWARD_MULTIPLIER);
    }

    if (amount > 0) {
      rewards.push({
        type: rewardConfig.type,
        amount,
        rarity: rewardConfig.rarity,
      });
    }
  });

  // On failure, remove rare drops (epic+ seeds)
  // But lucky_charm reduces seed loss chance
  if (!success) {
    const seedProtectionChance = supplyEffects.seedProtectionChance || 0; // lucky_charm: 0.5 = 50% chance to protect

    return rewards.filter(r => {
      if (r.type !== 'seeds') return true;
      if (r.rarity !== 'epic' && r.rarity !== 'legendary') return true;

      // With lucky_charm, there's a chance to keep rare seeds even on failure
      if (seedProtectionChance > 0 && rng() < seedProtectionChance) {
        return true; // Kept the seed despite failure
      }
      return false; // Normal behavior: lose rare seeds on failure
    });
  }

  return rewards;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if an expedition can be launched
 */
export function canLaunchExpedition(
  state: ExpeditionState,
  managerState: ManagerState,
  typeId: ExpeditionTypeId,
  managerIds: string[]
): { valid: boolean; error?: string } {
  // Check slot availability
  if (state.active.length >= state.maxSlots) {
    return { valid: false, error: 'No expedition slots available' };
  }

  // Check expedition type exists and is unlocked
  const type = getExpeditionType(typeId);
  if (!type) {
    return { valid: false, error: 'Invalid expedition type' };
  }

  if (!isExpeditionUnlocked(typeId, state.completed)) {
    return { valid: false, error: 'Expedition type not unlocked' };
  }

  // Check manager count
  if (managerIds.length < type.minManagers) {
    return { valid: false, error: `Requires at least ${type.minManagers} manager(s)` };
  }
  if (managerIds.length > type.maxManagers) {
    return { valid: false, error: `Maximum ${type.maxManagers} manager(s) allowed` };
  }

  // Check all managers exist and are not busy
  const busyManagerIds = new Set(state.active.flatMap(e => e.managerIds));

  for (const id of managerIds) {
    const manager = managerState.owned.find(m => m.instanceId === id);
    if (!manager) {
      return { valid: false, error: `Manager not found: ${id}` };
    }
    if (busyManagerIds.has(id)) {
      return { valid: false, error: 'Manager already on expedition' };
    }
    // Note: We allow assigned managers to go on expeditions (they'll be unavailable for planet bonuses)
  }

  return { valid: true };
}

// ============================================
// ACTIONS
// ============================================

/**
 * Launch a new expedition
 * @param supplyIds - Optional array of supply item IDs to consume
 * @param craftingState - Required if supplies are provided
 */
export function launchExpedition(
  state: ExpeditionState,
  managerState: ManagerState,
  typeId: ExpeditionTypeId,
  managerIds: string[],
  now: number = Date.now(),
  rng: () => number = Math.random,
  supplyIds?: string[],
  craftingState?: CraftingState
): {
  newState: ExpeditionState;
  expedition: ActiveExpedition | null;
  error?: string;
  newCraftingState?: CraftingState;
} {
  // Validate
  const validation = canLaunchExpedition(state, managerState, typeId, managerIds);
  if (!validation.valid) {
    return { newState: state, expedition: null, error: validation.error };
  }

  const type = EXPEDITION_TYPES[typeId];
  const managers = managerIds
    .map(id => managerState.owned.find(m => m.instanceId === id))
    .filter(Boolean) as ManagerInstance[];

  // Process supplies if provided
  let supplyEffects: Record<string, number> = {};
  let updatedCraftingState = craftingState;

  if (supplyIds && supplyIds.length > 0) {
    if (!craftingState) {
      return { newState: state, expedition: null, error: 'Crafting state required for supplies' };
    }

    const supplyResult = consumeMultipleSupplies(supplyIds, craftingState);
    if (!supplyResult.success) {
      return { newState: state, expedition: null, error: supplyResult.error };
    }

    updatedCraftingState = supplyResult.newState;
    supplyEffects = combineSupplyEffects(supplyResult.effects);
  }

  // Pre-calculate success
  const successRate = calculateSuccessRate(typeId, managers);
  const success = rng() < successRate;

  // Pre-calculate rewards (with supply bonuses)
  const rewards = calculateExpeditionRewards(typeId, managers, success, rng, supplyEffects);

  // Calculate duration (with time reduction from trail_rations)
  const timeReduction = supplyEffects.expeditionTime || 0; // trail_rations: 0.2 = 20% reduction
  const durationMs = Math.floor(type.durationMs * (1 - timeReduction));

  // Create expedition
  const expedition: ActiveExpedition = {
    id: generateUniqueId(),
    typeId,
    managerIds: [...managerIds],
    startTime: now,
    endTime: now + durationMs,
    rewards,
    success,
    suppliesUsed: supplyIds && supplyIds.length > 0 ? [...supplyIds] : undefined,
  };

  return {
    newState: {
      ...state,
      active: [...state.active, expedition],
    },
    expedition,
    newCraftingState: updatedCraftingState,
  };
}

/**
 * Check if an expedition is complete
 */
export function isExpeditionComplete(
  expedition: ActiveExpedition,
  now: number = Date.now()
): boolean {
  return now >= expedition.endTime;
}

/**
 * Get time remaining for an expedition in ms
 */
export function getExpeditionTimeRemaining(
  expedition: ActiveExpedition,
  now: number = Date.now()
): number {
  return Math.max(0, expedition.endTime - now);
}

/**
 * Complete an expedition and collect rewards
 */
export function completeExpedition(
  state: ExpeditionState,
  expeditionId: string,
  now: number = Date.now()
): { newState: ExpeditionState; result: ExpeditionResult | null; error?: string } {
  const expedition = state.active.find(e => e.id === expeditionId);
  if (!expedition) {
    return { newState: state, result: null, error: 'Expedition not found' };
  }

  if (!isExpeditionComplete(expedition, now)) {
    return { newState: state, result: null, error: 'Expedition not complete' };
  }

  // Create result
  const result: ExpeditionResult = {
    expeditionId: expedition.id,
    typeId: expedition.typeId,
    success: expedition.success,
    rewards: expedition.rewards,
    completedAt: now,
  };

  // Update state
  const newHistory = [result, ...state.history].slice(0, EXPEDITION_CONFIG.HISTORY_SIZE);

  return {
    newState: {
      ...state,
      active: state.active.filter(e => e.id !== expeditionId),
      completed: state.completed + 1,
      history: newHistory,
    },
    result,
  };
}

/**
 * Cancel an expedition (no rewards, returns managers)
 */
export function cancelExpedition(state: ExpeditionState, expeditionId: string): ExpeditionState {
  return {
    ...state,
    active: state.active.filter(e => e.id !== expeditionId),
  };
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all manager IDs currently on expeditions
 */
export function getBusyManagerIds(state: ExpeditionState): Set<string> {
  return new Set(state.active.flatMap(e => e.managerIds));
}

/**
 * Check if a manager is on expedition
 */
export function isManagerOnExpedition(state: ExpeditionState, managerId: string): boolean {
  return state.active.some(e => e.managerIds.includes(managerId));
}

/**
 * Get expedition a manager is on (if any)
 */
export function getManagerExpedition(
  state: ExpeditionState,
  managerId: string
): ActiveExpedition | undefined {
  return state.active.find(e => e.managerIds.includes(managerId));
}

/**
 * Get all completed expeditions ready for collection
 */
export function getCompletedExpeditions(
  state: ExpeditionState,
  now: number = Date.now()
): ActiveExpedition[] {
  return state.active.filter(e => isExpeditionComplete(e, now));
}

/**
 * Get statistics about expeditions
 */
export function getExpeditionStats(state: ExpeditionState): {
  totalCompleted: number;
  successRate: number;
  slotsUsed: number;
  slotsTotal: number;
} {
  const successCount = state.history.filter(r => r.success).length;
  const successRate = state.history.length > 0 ? successCount / state.history.length : 0;

  return {
    totalCompleted: state.completed,
    successRate,
    slotsUsed: state.active.length,
    slotsTotal: state.maxSlots,
  };
}
