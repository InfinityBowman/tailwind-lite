/**
 * Contract System
 * Daily and weekly contracts that provide rewards for completing objectives.
 * Addresses the "dopamine drought" in the 5-20 minute range by giving
 * clear, achievable goals with tangible rewards.
 */

import { generateUniqueId } from './GachaSystem';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ContractType =
  | 'harvest' // Harvest X plants total
  | 'export' // Complete X exports
  | 'sellCredits' // Sell X credits worth of plants
  | 'gacha' // Perform X gacha pulls
  | 'fuse' // Perform X fusions
  | 'craft' // Craft X items
  | 'extract' // Extract X plants
  | 'research' // Complete X research
  | 'breed' // Start X breeding operations
  | 'expedition'; // Complete X expeditions

export type ContractTier = 'bronze' | 'silver' | 'gold';
export type ContractDuration = 'daily' | 'weekly';

export interface ContractReward {
  credits?: number;
  crystals?: number;
  essence?: number;
  refinedEssence?: number;
}

export interface Contract {
  id: string;
  type: ContractType;
  tier: ContractTier;
  duration: ContractDuration;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: ContractReward;
  createdAt: number; // Unix timestamp
}

export interface ContractState {
  dailyContracts: Contract[];
  weeklyContracts: Contract[];
  lastDailyRefresh: string; // ISO date string (YYYY-MM-DD)
  lastWeeklyRefresh: string; // ISO date string (YYYY-MM-DD)
  totalContractsCompleted: number;
  totalRewardsEarned: ContractReward;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_CONFIG = {
  dailyContractsCount: 3,
  weeklyContractsCount: 2,
  refreshHourUTC: 5, // 5 AM UTC
} as const;

// Tier multipliers for scaling targets and rewards
const TIER_CONFIG: Record<ContractTier, { targetMultiplier: number; rewardMultiplier: number }> = {
  bronze: { targetMultiplier: 1, rewardMultiplier: 1 },
  silver: { targetMultiplier: 2, rewardMultiplier: 2.5 },
  gold: { targetMultiplier: 4, rewardMultiplier: 5 },
};

// Contract templates define base requirements and rewards
interface ContractTemplate {
  type: ContractType;
  baseTarget: number;
  description: (target: number) => string;
  baseReward: ContractReward;
  weeklyMultiplier: number; // Scale up for weekly
  weeklyOnly?: boolean; // If true, only generate for weekly contracts (late-game systems)
}

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    type: 'harvest',
    baseTarget: 20,
    description: n => `Harvest ${n} plants`,
    baseReward: { credits: 200 },
    weeklyMultiplier: 10,
  },
  {
    type: 'export',
    baseTarget: 3,
    description: n => `Complete ${n} export${n > 1 ? 's' : ''}`,
    baseReward: { credits: 300, crystals: 2 },
    weeklyMultiplier: 7,
  },
  {
    type: 'sellCredits',
    baseTarget: 1000,
    description: n => `Sell ${n.toLocaleString()} credits worth of plants`,
    baseReward: { crystals: 5 },
    weeklyMultiplier: 20,
  },
  {
    type: 'gacha',
    baseTarget: 2,
    description: n => `Perform ${n} gacha pull${n > 1 ? 's' : ''}`,
    // BALANCE: Gacha is free (credits), so reward credits not crystals
    // Rewarding crystals for free gacha would create an exploit loop
    baseReward: { credits: 150 },
    weeklyMultiplier: 5,
  },
  {
    type: 'fuse',
    baseTarget: 1,
    description: n => `Perform ${n} fusion${n > 1 ? 's' : ''}`,
    baseReward: { credits: 500, essence: 50 },
    weeklyMultiplier: 5,
  },
  {
    type: 'craft',
    baseTarget: 1,
    description: n => `Craft ${n} item${n > 1 ? 's' : ''}`,
    baseReward: { credits: 400, crystals: 3 },
    weeklyMultiplier: 5,
  },
  {
    type: 'extract',
    baseTarget: 5,
    description: n => `Extract ${n} plant${n > 1 ? 's' : ''}`,
    baseReward: { credits: 250, essence: 30 },
    weeklyMultiplier: 6,
  },
  {
    type: 'research',
    baseTarget: 1,
    description: n => `Complete ${n} research project${n > 1 ? 's' : ''}`,
    baseReward: { refinedEssence: 25, crystals: 5 },
    weeklyMultiplier: 3,
    weeklyOnly: true, // Research is unlocked mid-game
  },
  {
    type: 'breed',
    baseTarget: 1,
    description: n => `Start ${n} breeding operation${n > 1 ? 's' : ''}`,
    baseReward: { credits: 350, essence: 40 },
    weeklyMultiplier: 4,
    weeklyOnly: true, // Breeding is unlocked via research
  },
  {
    type: 'expedition',
    baseTarget: 1,
    description: n => `Complete ${n} expedition${n > 1 ? 's' : ''}`,
    baseReward: { crystals: 8, refinedEssence: 15 },
    weeklyMultiplier: 3,
    weeklyOnly: true, // Expeditions are unlocked via research
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// State Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createInitialContractState(): ContractState {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return {
    dailyContracts: generateDailyContracts(),
    weeklyContracts: generateWeeklyContracts(),
    lastDailyRefresh: today,
    lastWeeklyRefresh: today,
    totalContractsCompleted: 0,
    totalRewardsEarned: {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract Generation
// ─────────────────────────────────────────────────────────────────────────────

function pickRandomTier(): ContractTier {
  const roll = Math.random();
  if (roll < 0.6) return 'bronze';
  if (roll < 0.9) return 'silver';
  return 'gold';
}

function selectRandomTemplates(
  count: number,
  includeWeeklyOnly: boolean = true
): ContractTemplate[] {
  // Filter templates based on whether we want weekly-only types
  const templates = includeWeeklyOnly
    ? CONTRACT_TEMPLATES
    : CONTRACT_TEMPLATES.filter(t => !t.weeklyOnly);

  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function createContract(
  template: ContractTemplate,
  tier: ContractTier,
  duration: ContractDuration
): Contract {
  const tierConfig = TIER_CONFIG[tier];
  const durationMultiplier = duration === 'weekly' ? template.weeklyMultiplier : 1;

  const target = Math.floor(template.baseTarget * tierConfig.targetMultiplier * durationMultiplier);

  const reward: ContractReward = {};
  if (template.baseReward.credits) {
    reward.credits = Math.floor(
      template.baseReward.credits * tierConfig.rewardMultiplier * durationMultiplier
    );
  }
  if (template.baseReward.crystals) {
    reward.crystals = Math.floor(
      template.baseReward.crystals * tierConfig.rewardMultiplier * durationMultiplier
    );
  }
  if (template.baseReward.essence) {
    reward.essence = Math.floor(
      template.baseReward.essence * tierConfig.rewardMultiplier * durationMultiplier
    );
  }
  if (template.baseReward.refinedEssence) {
    reward.refinedEssence = Math.floor(
      template.baseReward.refinedEssence * tierConfig.rewardMultiplier * durationMultiplier
    );
  }

  return {
    id: generateUniqueId(),
    type: template.type,
    tier,
    duration,
    description: template.description(target),
    target,
    progress: 0,
    completed: false,
    claimed: false,
    reward,
    createdAt: Date.now(),
  };
}

export function generateDailyContracts(): Contract[] {
  // Exclude weeklyOnly templates from daily contracts (late-game systems)
  const templates = selectRandomTemplates(CONTRACT_CONFIG.dailyContractsCount, false);
  return templates.map(template => {
    const tier = pickRandomTier();
    return createContract(template, tier, 'daily');
  });
}

export function generateWeeklyContracts(): Contract[] {
  const templates = selectRandomTemplates(CONTRACT_CONFIG.weeklyContractsCount);
  return templates.map(template => {
    const tier = pickRandomTier();
    return createContract(template, tier, 'weekly');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Logic
// ─────────────────────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartDateString(): string {
  const now = new Date();
  const day = now.getDay();
  // Start of week is Sunday
  const diff = now.getDate() - day;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

export function needsDailyRefresh(state: ContractState): boolean {
  const today = getTodayDateString();
  return state.lastDailyRefresh !== today;
}

export function needsWeeklyRefresh(state: ContractState): boolean {
  const weekStart = getWeekStartDateString();
  // Refresh if the last refresh was in a previous week
  return state.lastWeeklyRefresh < weekStart;
}

export function refreshDailyContracts(state: ContractState): ContractState {
  return {
    ...state,
    dailyContracts: generateDailyContracts(),
    lastDailyRefresh: getTodayDateString(),
  };
}

export function refreshWeeklyContracts(state: ContractState): ContractState {
  return {
    ...state,
    weeklyContracts: generateWeeklyContracts(),
    lastWeeklyRefresh: getWeekStartDateString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Tracking
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressUpdateResult {
  newState: ContractState;
  newlyCompleted: Contract[];
}

export function updateContractProgress(
  state: ContractState,
  type: ContractType,
  amount: number = 1
): ProgressUpdateResult {
  // Clamp to non-negative to prevent progress reduction exploits
  const safeAmount = Math.max(0, amount);

  if (safeAmount === 0) {
    return { newState: state, newlyCompleted: [] };
  }

  const newlyCompleted: Contract[] = [];

  const updateContracts = (contracts: Contract[]): Contract[] => {
    return contracts.map(contract => {
      if (contract.type !== type || contract.completed) {
        return contract;
      }

      const newProgress = contract.progress + safeAmount;
      const nowCompleted = newProgress >= contract.target;

      if (nowCompleted && !contract.completed) {
        newlyCompleted.push({ ...contract, progress: newProgress, completed: true });
      }

      return {
        ...contract,
        progress: newProgress,
        completed: nowCompleted,
      };
    });
  };

  return {
    newState: {
      ...state,
      dailyContracts: updateContracts(state.dailyContracts),
      weeklyContracts: updateContracts(state.weeklyContracts),
    },
    newlyCompleted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Claiming Rewards
// ─────────────────────────────────────────────────────────────────────────────

export interface ClaimContractResult {
  success: boolean;
  reward?: ContractReward;
  newState: ContractState;
  error?: string;
}

export function claimContractReward(state: ContractState, contractId: string): ClaimContractResult {
  // Find contract in daily or weekly
  let foundContract: Contract | undefined;
  let isDailyContract = false;

  foundContract = state.dailyContracts.find(c => c.id === contractId);
  if (foundContract) {
    isDailyContract = true;
  } else {
    foundContract = state.weeklyContracts.find(c => c.id === contractId);
  }

  if (!foundContract) {
    return {
      success: false,
      newState: state,
      error: 'Contract not found',
    };
  }

  if (!foundContract.completed) {
    return {
      success: false,
      newState: state,
      error: 'Contract not completed',
    };
  }

  if (foundContract.claimed) {
    return {
      success: false,
      newState: state,
      error: 'Contract already claimed',
    };
  }

  const claimedContract = { ...foundContract, claimed: true };

  // Update accumulated rewards
  const totalRewards = { ...state.totalRewardsEarned };
  if (foundContract.reward.credits) {
    totalRewards.credits = (totalRewards.credits || 0) + foundContract.reward.credits;
  }
  if (foundContract.reward.crystals) {
    totalRewards.crystals = (totalRewards.crystals || 0) + foundContract.reward.crystals;
  }
  if (foundContract.reward.essence) {
    totalRewards.essence = (totalRewards.essence || 0) + foundContract.reward.essence;
  }
  if (foundContract.reward.refinedEssence) {
    totalRewards.refinedEssence =
      (totalRewards.refinedEssence || 0) + foundContract.reward.refinedEssence;
  }

  const newState: ContractState = {
    ...state,
    dailyContracts: isDailyContract
      ? state.dailyContracts.map(c => (c.id === contractId ? claimedContract : c))
      : state.dailyContracts,
    weeklyContracts: !isDailyContract
      ? state.weeklyContracts.map(c => (c.id === contractId ? claimedContract : c))
      : state.weeklyContracts,
    totalContractsCompleted: state.totalContractsCompleted + 1,
    totalRewardsEarned: totalRewards,
  };

  return {
    success: true,
    reward: foundContract.reward,
    newState,
  };
}

export function claimAllContracts(state: ContractState): {
  claimedCount: number;
  totalRewards: ContractReward;
  newState: ContractState;
} {
  let currentState = state;
  let claimedCount = 0;
  const totalRewards: ContractReward = {};

  const allContracts = [...state.dailyContracts, ...state.weeklyContracts];

  for (const contract of allContracts) {
    if (contract.completed && !contract.claimed) {
      const result = claimContractReward(currentState, contract.id);
      if (result.success && result.reward) {
        currentState = result.newState;
        claimedCount++;
        if (result.reward.credits) {
          totalRewards.credits = (totalRewards.credits || 0) + result.reward.credits;
        }
        if (result.reward.crystals) {
          totalRewards.crystals = (totalRewards.crystals || 0) + result.reward.crystals;
        }
        if (result.reward.essence) {
          totalRewards.essence = (totalRewards.essence || 0) + result.reward.essence;
        }
        if (result.reward.refinedEssence) {
          totalRewards.refinedEssence =
            (totalRewards.refinedEssence || 0) + result.reward.refinedEssence;
        }
      }
    }
  }

  return { claimedCount, totalRewards, newState: currentState };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export function getUnclaimedContracts(state: ContractState): Contract[] {
  const all = [...state.dailyContracts, ...state.weeklyContracts];
  return all.filter(c => c.completed && !c.claimed);
}

export function getActiveContracts(state: ContractState): Contract[] {
  const all = [...state.dailyContracts, ...state.weeklyContracts];
  return all.filter(c => !c.completed);
}

export function getContractProgress(contract: Contract): number {
  return Math.min(1, contract.progress / contract.target);
}
