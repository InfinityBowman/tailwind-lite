/**
 * ContractSystem Tests
 * Tests for contract generation, progress tracking, claiming, and refresh logic.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createInitialContractState,
  generateDailyContracts,
  generateWeeklyContracts,
  needsDailyRefresh,
  needsWeeklyRefresh,
  refreshDailyContracts,
  refreshWeeklyContracts,
  updateContractProgress,
  claimContractReward,
  claimAllContracts,
  getUnclaimedContracts,
  getActiveContracts,
  getContractProgress,
  CONTRACT_CONFIG,
  type ContractState,
  type Contract,
} from './ContractSystem';

describe('ContractSystem', () => {
  let initialState: ContractState;

  beforeEach(() => {
    initialState = createInitialContractState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createInitialContractState', () => {
    it('should create state with correct number of daily contracts', () => {
      expect(initialState.dailyContracts).toHaveLength(CONTRACT_CONFIG.dailyContractsCount);
    });

    it('should create state with correct number of weekly contracts', () => {
      expect(initialState.weeklyContracts).toHaveLength(CONTRACT_CONFIG.weeklyContractsCount);
    });

    it('should initialize all contracts as uncompleted and unclaimed', () => {
      const allContracts = [...initialState.dailyContracts, ...initialState.weeklyContracts];
      for (const contract of allContracts) {
        expect(contract.completed).toBe(false);
        expect(contract.claimed).toBe(false);
        expect(contract.progress).toBe(0);
      }
    });

    it('should set refresh dates to today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(initialState.lastDailyRefresh).toBe(today);
    });

    it('should initialize totals to zero', () => {
      expect(initialState.totalContractsCompleted).toBe(0);
      expect(initialState.totalRewardsEarned).toEqual({});
    });
  });

  describe('generateDailyContracts', () => {
    it('should generate the configured number of contracts', () => {
      const contracts = generateDailyContracts();
      expect(contracts).toHaveLength(CONTRACT_CONFIG.dailyContractsCount);
    });

    it('should not include late-game contract types', () => {
      // Generate multiple times to check consistency
      const lateGameTypes = ['research', 'breed', 'expedition'];
      for (let i = 0; i < 20; i++) {
        const contracts = generateDailyContracts();
        for (const contract of contracts) {
          expect(lateGameTypes).not.toContain(contract.type);
        }
      }
    });

    it('should generate contracts with unique IDs', () => {
      const contracts = generateDailyContracts();
      const ids = contracts.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate contracts with valid structure', () => {
      const contracts = generateDailyContracts();
      for (const contract of contracts) {
        expect(contract).toHaveProperty('id');
        expect(contract).toHaveProperty('type');
        expect(contract).toHaveProperty('tier');
        expect(contract).toHaveProperty('duration', 'daily');
        expect(contract).toHaveProperty('description');
        expect(contract).toHaveProperty('target');
        expect(contract).toHaveProperty('progress', 0);
        expect(contract).toHaveProperty('completed', false);
        expect(contract).toHaveProperty('claimed', false);
        expect(contract).toHaveProperty('reward');
        expect(contract.target).toBeGreaterThan(0);
      }
    });

    it('should assign valid tiers', () => {
      const contracts = generateDailyContracts();
      const validTiers = ['bronze', 'silver', 'gold'];
      for (const contract of contracts) {
        expect(validTiers).toContain(contract.tier);
      }
    });
  });

  describe('generateWeeklyContracts', () => {
    it('should generate the configured number of contracts', () => {
      const contracts = generateWeeklyContracts();
      expect(contracts).toHaveLength(CONTRACT_CONFIG.weeklyContractsCount);
    });

    it('should generate weekly contracts with weekly duration', () => {
      const contracts = generateWeeklyContracts();
      for (const contract of contracts) {
        expect(contract.duration).toBe('weekly');
      }
    });

    it('should be able to include late-game contract types', () => {
      // Weekly contracts can include research/breed/expedition
      const lateGameTypes = ['research', 'breed', 'expedition'];
      let foundLateGame = false;

      // Generate multiple times to check that late-game types CAN appear
      for (let i = 0; i < 50 && !foundLateGame; i++) {
        const contracts = generateWeeklyContracts();
        for (const contract of contracts) {
          if (lateGameTypes.includes(contract.type)) {
            foundLateGame = true;
            break;
          }
        }
      }

      // With 50 iterations of 2 contracts each, should see a late-game type
      // (3 late-game types out of 10 total = 30% chance per slot)
      expect(foundLateGame).toBe(true);
    });
  });

  describe('needsDailyRefresh', () => {
    it('should return false when last refresh is today', () => {
      expect(needsDailyRefresh(initialState)).toBe(false);
    });

    it('should return true when last refresh is yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const state: ContractState = {
        ...initialState,
        lastDailyRefresh: yesterday.toISOString().split('T')[0],
      };
      expect(needsDailyRefresh(state)).toBe(true);
    });
  });

  describe('needsWeeklyRefresh', () => {
    it('should return false when last refresh is this week', () => {
      expect(needsWeeklyRefresh(initialState)).toBe(false);
    });

    it('should return true when last refresh was last week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const state: ContractState = {
        ...initialState,
        lastWeeklyRefresh: lastWeek.toISOString().split('T')[0],
      };
      expect(needsWeeklyRefresh(state)).toBe(true);
    });
  });

  describe('refreshDailyContracts', () => {
    it('should generate new contracts', () => {
      const oldIds = initialState.dailyContracts.map(c => c.id);
      const refreshed = refreshDailyContracts(initialState);
      const newIds = refreshed.dailyContracts.map(c => c.id);

      // New contracts should have different IDs
      expect(newIds.some(id => oldIds.includes(id))).toBe(false);
    });

    it('should update lastDailyRefresh to today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const staleState: ContractState = {
        ...initialState,
        lastDailyRefresh: yesterday.toISOString().split('T')[0],
      };

      const refreshed = refreshDailyContracts(staleState);
      const today = new Date().toISOString().split('T')[0];
      expect(refreshed.lastDailyRefresh).toBe(today);
    });

    it('should preserve weekly contracts', () => {
      const refreshed = refreshDailyContracts(initialState);
      expect(refreshed.weeklyContracts).toEqual(initialState.weeklyContracts);
    });
  });

  describe('refreshWeeklyContracts', () => {
    it('should generate new weekly contracts', () => {
      const oldIds = initialState.weeklyContracts.map(c => c.id);
      const refreshed = refreshWeeklyContracts(initialState);
      const newIds = refreshed.weeklyContracts.map(c => c.id);

      expect(newIds.some(id => oldIds.includes(id))).toBe(false);
    });

    it('should preserve daily contracts', () => {
      const refreshed = refreshWeeklyContracts(initialState);
      expect(refreshed.dailyContracts).toEqual(initialState.dailyContracts);
    });
  });

  describe('updateContractProgress', () => {
    it('should update progress for matching contract type', () => {
      const contractType = initialState.dailyContracts[0].type;
      const result = updateContractProgress(initialState, contractType, 5);

      const updated = result.newState.dailyContracts.find(c => c.type === contractType);
      expect(updated?.progress).toBe(5);
    });

    it('should not update progress for non-matching types', () => {
      // Get a type that's NOT in contracts
      const existingTypes = new Set([
        ...initialState.dailyContracts.map(c => c.type),
        ...initialState.weeklyContracts.map(c => c.type),
      ]);

      // Find a type not in use
      const allTypes = [
        'harvest',
        'export',
        'sellCredits',
        'gacha',
        'fuse',
        'craft',
        'extract',
        'research',
        'breed',
        'expedition',
      ] as const;
      const unusedType = allTypes.find(t => !existingTypes.has(t));

      if (unusedType) {
        const result = updateContractProgress(initialState, unusedType, 10);
        // All contracts should still have 0 progress
        const allContracts = [
          ...result.newState.dailyContracts,
          ...result.newState.weeklyContracts,
        ];
        expect(allContracts.every(c => c.progress === 0)).toBe(true);
      }
    });

    it('should mark contract as completed when target is reached', () => {
      const contract = initialState.dailyContracts[0];
      const result = updateContractProgress(initialState, contract.type, contract.target);

      const updated = result.newState.dailyContracts.find(c => c.id === contract.id);
      expect(updated?.completed).toBe(true);
    });

    it('should return newly completed contracts', () => {
      const contract = initialState.dailyContracts[0];
      const result = updateContractProgress(initialState, contract.type, contract.target);

      expect(result.newlyCompleted).toHaveLength(1);
      expect(result.newlyCompleted[0].id).toBe(contract.id);
    });

    it('should not mark already completed contracts again', () => {
      // Create deterministic state to avoid flaky tests from random generation
      // The issue: if a weekly contract has the same type as daily[0] with a low enough
      // target, the second update could complete it
      const deterministicState: ContractState = {
        ...initialState,
        dailyContracts: [
          {
            id: 'test-daily-1',
            type: 'harvest',
            target: 10,
            progress: 0,
            completed: false,
            claimed: false,
            tier: 'bronze',
            duration: 'daily',
            description: 'Harvest 10 plants',
            reward: { credits: 200 },
          },
        ],
        weeklyContracts: [
          {
            id: 'test-weekly-1',
            type: 'export', // Different type to avoid cross-completion
            target: 50,
            progress: 0,
            completed: false,
            claimed: false,
            tier: 'silver',
            duration: 'weekly',
            description: 'Complete 50 exports',
            reward: { credits: 500, crystals: 5 },
          },
        ],
      };

      const contract = deterministicState.dailyContracts[0];
      const firstUpdate = updateContractProgress(
        deterministicState,
        contract.type,
        contract.target
      );
      const secondUpdate = updateContractProgress(
        firstUpdate.newState,
        contract.type,
        contract.target
      );

      expect(secondUpdate.newlyCompleted).toHaveLength(0);
    });

    it('should accumulate progress across multiple updates', () => {
      const contract = initialState.dailyContracts[0];
      let state = initialState;

      // Use small increments that won't complete the contract
      // (contract targets are at minimum 1, typically much higher)
      state = updateContractProgress(state, contract.type, 1).newState;
      state = updateContractProgress(state, contract.type, 1).newState;

      const updated = state.dailyContracts.find(c => c.id === contract.id);
      // Should have accumulated if not completed, or be at target if completed
      if (contract.target <= 1) {
        // If target is 1, first update completes it
        expect(updated?.progress).toBeGreaterThanOrEqual(1);
        expect(updated?.completed).toBe(true);
      } else {
        expect(updated?.progress).toBe(2);
      }
    });

    it('should clamp negative progress to zero', () => {
      const contract = initialState.dailyContracts[0];
      const result = updateContractProgress(initialState, contract.type, -10);

      // Should return unchanged state (no progress added)
      expect(result.newState).toBe(initialState);
      expect(result.newlyCompleted).toHaveLength(0);
    });

    it('should handle zero progress amount', () => {
      const contract = initialState.dailyContracts[0];
      const result = updateContractProgress(initialState, contract.type, 0);

      // Should return unchanged state
      expect(result.newState).toBe(initialState);
      expect(result.newlyCompleted).toHaveLength(0);
    });
  });

  describe('claimContractReward', () => {
    let completedState: ContractState;
    let completedContractId: string;

    beforeEach(() => {
      const contract = initialState.dailyContracts[0];
      completedState = updateContractProgress(
        initialState,
        contract.type,
        contract.target
      ).newState;
      completedContractId = contract.id;
    });

    it('should successfully claim a completed contract', () => {
      const result = claimContractReward(completedState, completedContractId);

      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('should mark contract as claimed', () => {
      const result = claimContractReward(completedState, completedContractId);
      const claimed = result.newState.dailyContracts.find(c => c.id === completedContractId);

      expect(claimed?.claimed).toBe(true);
    });

    it('should increment totalContractsCompleted', () => {
      const result = claimContractReward(completedState, completedContractId);
      expect(result.newState.totalContractsCompleted).toBe(1);
    });

    it('should accumulate totalRewardsEarned', () => {
      const result = claimContractReward(completedState, completedContractId);
      const _contract = initialState.dailyContracts[0]; // For reference

      // At least one reward type should be accumulated
      const hasReward =
        (result.newState.totalRewardsEarned.credits || 0) > 0 ||
        (result.newState.totalRewardsEarned.crystals || 0) > 0 ||
        (result.newState.totalRewardsEarned.essence || 0) > 0 ||
        (result.newState.totalRewardsEarned.refinedEssence || 0) > 0;
      expect(hasReward).toBe(true);
    });

    it('should fail to claim non-existent contract', () => {
      const result = claimContractReward(completedState, 'non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contract not found');
    });

    it('should fail to claim incomplete contract', () => {
      const incompleteId = initialState.dailyContracts[1].id;
      const result = claimContractReward(initialState, incompleteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contract not completed');
    });

    it('should fail to claim already claimed contract', () => {
      const firstClaim = claimContractReward(completedState, completedContractId);
      const secondClaim = claimContractReward(firstClaim.newState, completedContractId);

      expect(secondClaim.success).toBe(false);
      expect(secondClaim.error).toBe('Contract already claimed');
    });
  });

  describe('claimAllContracts', () => {
    it('should claim all completed contracts', () => {
      // Complete all daily contracts
      let state = initialState;
      for (const contract of initialState.dailyContracts) {
        state = updateContractProgress(state, contract.type, contract.target).newState;
      }

      const result = claimAllContracts(state);

      expect(result.claimedCount).toBe(CONTRACT_CONFIG.dailyContractsCount);
    });

    it('should return combined rewards', () => {
      let state = initialState;
      for (const contract of initialState.dailyContracts) {
        state = updateContractProgress(state, contract.type, contract.target).newState;
      }

      const result = claimAllContracts(state);

      // Should have some rewards
      const hasRewards =
        (result.totalRewards.credits || 0) > 0 ||
        (result.totalRewards.crystals || 0) > 0 ||
        (result.totalRewards.essence || 0) > 0 ||
        (result.totalRewards.refinedEssence || 0) > 0;
      expect(hasRewards).toBe(true);
    });

    it('should return 0 when no contracts are claimable', () => {
      const result = claimAllContracts(initialState);
      expect(result.claimedCount).toBe(0);
    });
  });

  describe('getUnclaimedContracts', () => {
    it('should return empty array when no contracts completed', () => {
      const unclaimed = getUnclaimedContracts(initialState);
      expect(unclaimed).toHaveLength(0);
    });

    it('should return completed but unclaimed contracts', () => {
      const contract = initialState.dailyContracts[0];
      const state = updateContractProgress(initialState, contract.type, contract.target).newState;

      const unclaimed = getUnclaimedContracts(state);
      expect(unclaimed).toHaveLength(1);
      expect(unclaimed[0].id).toBe(contract.id);
    });

    it('should not return already claimed contracts', () => {
      const contract = initialState.dailyContracts[0];
      let state = updateContractProgress(initialState, contract.type, contract.target).newState;
      state = claimContractReward(state, contract.id).newState;

      const unclaimed = getUnclaimedContracts(state);
      expect(unclaimed).toHaveLength(0);
    });
  });

  describe('getActiveContracts', () => {
    it('should return all contracts when none completed', () => {
      const active = getActiveContracts(initialState);
      expect(active).toHaveLength(
        CONTRACT_CONFIG.dailyContractsCount + CONTRACT_CONFIG.weeklyContractsCount
      );
    });

    it('should not include completed contracts', () => {
      const contract = initialState.dailyContracts[0];
      const state = updateContractProgress(initialState, contract.type, contract.target).newState;

      const active = getActiveContracts(state);
      expect(active.find(c => c.id === contract.id)).toBeUndefined();
    });
  });

  describe('getContractProgress', () => {
    it('should return 0 for no progress', () => {
      const contract = initialState.dailyContracts[0];
      expect(getContractProgress(contract)).toBe(0);
    });

    it('should return percentage progress', () => {
      const contract: Contract = {
        ...initialState.dailyContracts[0],
        progress: 50,
        target: 100,
      };
      expect(getContractProgress(contract)).toBe(0.5);
    });

    it('should cap at 1 when over target', () => {
      const contract: Contract = {
        ...initialState.dailyContracts[0],
        progress: 150,
        target: 100,
      };
      expect(getContractProgress(contract)).toBe(1);
    });
  });
});
