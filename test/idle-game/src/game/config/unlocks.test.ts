/**
 * Feature Unlock Tests
 *
 * Updated to match new unlock philosophy (Game Design Audit):
 * - ACTION-GATED: Prove engagement before unlocking
 * - PRESTIGE-GATED: Complex features for committed players
 */

import { describe, it, expect } from 'vitest';
import {
  isNavSectionUnlocked,
  isFarmingSubSectionUnlocked,
  getUnlockedNavSections,
  getUnlockedFarmingSubSections,
  getUnlockHint,
  NAV_UNLOCK_CONDITIONS,
  FARMING_UNLOCK_CONDITIONS,
} from './unlocks';
import { createInitialGameState } from '../state/GameState';
import { PRESTIGE_CONFIG } from './prestige';

describe('Feature Unlocks', () => {
  describe('NAV_UNLOCK_CONDITIONS', () => {
    it('should have descriptions for all conditions', () => {
      for (const [_section, condition] of Object.entries(NAV_UNLOCK_CONDITIONS)) {
        expect(condition.description).toBeDefined();
        expect(condition.description.length).toBeGreaterThan(0);
        expect(typeof condition.check).toBe('function');
      }
    });
  });

  describe('FARMING_UNLOCK_CONDITIONS', () => {
    it('should have descriptions for all conditions', () => {
      for (const [_section, condition] of Object.entries(FARMING_UNLOCK_CONDITIONS)) {
        expect(condition.description).toBeDefined();
        expect(condition.description.length).toBeGreaterThan(0);
        expect(typeof condition.check).toBe('function');
      }
    });
  });

  describe('isNavSectionUnlocked', () => {
    it('should always unlock farming section', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('farming', state)).toBe(true);
    });

    it('should always unlock daily section', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('daily', state)).toBe(true);
    });

    // ACTION-GATED: Quests require 2nd planet
    it('should lock quests until 2nd planet unlocked', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('quests', state)).toBe(false);

      // 1 planet should NOT unlock
      const stateWith1Planet = {
        ...state,
        planets: state.planets.map((p, i) => ({ ...p, unlocked: i < 1 })),
      };
      expect(isNavSectionUnlocked('quests', stateWith1Planet)).toBe(false);

      // 2 planets should unlock
      const stateWith2Planets = {
        ...state,
        planets: state.planets.map((p, i) => ({ ...p, unlocked: i < 2 })),
      };
      expect(isNavSectionUnlocked('quests', stateWith2Planets)).toBe(true);
    });

    // ACTION-GATED: Achievements require 5 completed quests
    it('should lock achievements until 5 quests completed', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('achievements', state)).toBe(false);

      // 4 quests should NOT unlock
      const stateWith4Quests = {
        ...state,
        quests: {
          ...state.quests,
          dailyQuests: {
            q1: { questId: 'q1', progress: 1, claimed: true },
            q2: { questId: 'q2', progress: 1, claimed: true },
            q3: { questId: 'q3', progress: 1, claimed: true },
            q4: { questId: 'q4', progress: 1, claimed: true },
          },
        },
      };
      expect(isNavSectionUnlocked('achievements', stateWith4Quests)).toBe(false);

      // 5 quests should unlock
      const stateWith5Quests = {
        ...state,
        quests: {
          ...state.quests,
          dailyQuests: {
            q1: { questId: 'q1', progress: 1, claimed: true },
            q2: { questId: 'q2', progress: 1, claimed: true },
            q3: { questId: 'q3', progress: 1, claimed: true },
            q4: { questId: 'q4', progress: 1, claimed: true },
            q5: { questId: 'q5', progress: 1, claimed: true },
          },
        },
      };
      expect(isNavSectionUnlocked('achievements', stateWith5Quests)).toBe(true);
    });

    // ACTION-GATED: Contracts require 5 completed quests
    it('should lock contracts until 5 quests completed', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('contracts', state)).toBe(false);

      const stateWith5Quests = {
        ...state,
        quests: {
          ...state.quests,
          dailyQuests: {
            q1: { questId: 'q1', progress: 1, claimed: true },
            q2: { questId: 'q2', progress: 1, claimed: true },
            q3: { questId: 'q3', progress: 1, claimed: true },
          },
          weeklyQuests: {
            w1: { questId: 'w1', progress: 1, claimed: true },
            w2: { questId: 'w2', progress: 1, claimed: true },
          },
        },
      };
      expect(isNavSectionUnlocked('contracts', stateWith5Quests)).toBe(true);
    });

    // ACTION-GATED: Managers require 3 planets
    it('should lock managers until 3 planets unlocked', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('managers', state)).toBe(false);

      // 2 planets should NOT unlock
      const stateWith2Planets = {
        ...state,
        planets: state.planets.map((p, i) => ({ ...p, unlocked: i < 2 })),
      };
      expect(isNavSectionUnlocked('managers', stateWith2Planets)).toBe(false);

      // 3 planets should unlock
      const stateWith3Planets = {
        ...state,
        planets: state.planets.map((p, i) => ({ ...p, unlocked: i < 3 })),
      };
      expect(isNavSectionUnlocked('managers', stateWith3Planets)).toBe(true);
    });

    it('should lock expeditions until player has a manager', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('expeditions', state)).toBe(false);

      const stateWithManager = {
        ...state,
        managers: { ...state.managers, owned: [{ id: 'test' } as any] },
      };
      expect(isNavSectionUnlocked('expeditions', stateWithManager)).toBe(true);
    });

    // ACTION-GATED: Seedex requires 25 pulls
    it('should lock seedex until 25 gacha pulls', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('seedex', state)).toBe(false);

      // 24 pulls should NOT unlock
      const stateWith24Pulls = {
        ...state,
        achievements: {
          ...state.achievements,
          stats: { ...state.achievements.stats, totalGachaPulls: 24 },
        },
      };
      expect(isNavSectionUnlocked('seedex', stateWith24Pulls)).toBe(false);

      // 25 pulls should unlock
      const stateWith25Pulls = {
        ...state,
        achievements: {
          ...state.achievements,
          stats: { ...state.achievements.stats, totalGachaPulls: 25 },
        },
      };
      expect(isNavSectionUnlocked('seedex', stateWith25Pulls)).toBe(true);
    });

    it('should lock stats until 1,000 credits earned', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('stats', state)).toBe(false);

      // 999 credits should NOT unlock
      const stateWith999Credits = {
        ...state,
        prestige: { ...state.prestige, lifetimeCredits: 999 },
      };
      expect(isNavSectionUnlocked('stats', stateWith999Credits)).toBe(false);

      // 1,000 credits should unlock
      const stateWith1000Credits = {
        ...state,
        prestige: { ...state.prestige, lifetimeCredits: 1000 },
      };
      expect(isNavSectionUnlocked('stats', stateWith1000Credits)).toBe(true);
    });

    // PRESTIGE-GATED: Market requires prestige
    it('should lock market until first prestige', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('market', state)).toBe(false);

      // Even with lots of credits, no prestige = no market
      const stateNoPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 0, lifetimeCredits: 100000 },
      };
      expect(isNavSectionUnlocked('market', stateNoPrestige)).toBe(false);

      // Prestige 1 should unlock market
      const stateWithPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 1 },
      };
      expect(isNavSectionUnlocked('market', stateWithPrestige)).toBe(true);
    });

    // PRESTIGE-GATED: Research requires prestige (no essence bypass)
    it('should lock research until first prestige', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('research', state)).toBe(false);

      // With refined essence but no prestige should NOT unlock
      const stateWithEssence = {
        ...state,
        research: { ...state.research, refinedEssence: 100 },
        prestige: { ...state.prestige, prestigeLevel: 0 },
      };
      expect(isNavSectionUnlocked('research', stateWithEssence)).toBe(false);

      // With prestige should unlock
      const stateWithPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 1 },
      };
      expect(isNavSectionUnlocked('research', stateWithPrestige)).toBe(true);
    });

    // PRESTIGE-GATED: Shop requires prestige
    it('should lock shop until first prestige', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('shop', state)).toBe(false);

      // Even with lots of credits, no prestige = no shop
      const stateNoPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 0, lifetimeCredits: 100000 },
      };
      expect(isNavSectionUnlocked('shop', stateNoPrestige)).toBe(false);

      // Prestige 1 should unlock
      const stateWithPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 1 },
      };
      expect(isNavSectionUnlocked('shop', stateWithPrestige)).toBe(true);
    });

    // PRESTIGE-GATED: Events require prestige
    it('should lock events until first prestige', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('events', state)).toBe(false);

      // Even with lots of credits, no prestige = no events
      const stateNoPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 0, lifetimeCredits: 100000 },
      };
      expect(isNavSectionUnlocked('events', stateNoPrestige)).toBe(false);

      // Prestige 1 should unlock
      const stateWithPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 1 },
      };
      expect(isNavSectionUnlocked('events', stateWithPrestige)).toBe(true);
    });

    // PRESTIGE-GATED: Leaderboard requires prestige
    it('should lock leaderboard until first prestige', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('leaderboard', state)).toBe(false);

      const stateWithPrestige = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 1 },
      };
      expect(isNavSectionUnlocked('leaderboard', stateWithPrestige)).toBe(true);
    });

    it('should lock mastery until 3 research projects completed', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('mastery', state)).toBe(false);

      // 2 research should NOT unlock
      const stateWith2Research = {
        ...state,
        research: { ...state.research, completed: ['r1', 'r2'] },
      };
      expect(isNavSectionUnlocked('mastery', stateWith2Research)).toBe(false);

      // 3 research should unlock
      const stateWith3Research = {
        ...state,
        research: { ...state.research, completed: ['r1', 'r2', 'r3'] },
      };
      expect(isNavSectionUnlocked('mastery', stateWith3Research)).toBe(true);
    });

    it('should lock prestige until threshold credits', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('prestige', state)).toBe(false);

      // Just below threshold should NOT unlock
      const stateBelowThreshold = {
        ...state,
        prestige: {
          ...state.prestige,
          lifetimeCredits: PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE - 1,
        },
      };
      expect(isNavSectionUnlocked('prestige', stateBelowThreshold)).toBe(false);

      // At threshold should unlock
      const stateAtThreshold = {
        ...state,
        prestige: { ...state.prestige, lifetimeCredits: PRESTIGE_CONFIG.MIN_CREDITS_TO_PRESTIGE },
      };
      expect(isNavSectionUnlocked('prestige', stateAtThreshold)).toBe(true);
    });

    it('should lock transcendence until prestige level 5', () => {
      const state = createInitialGameState();
      expect(isNavSectionUnlocked('transcendence', state)).toBe(false);

      // Prestige 4 should NOT unlock
      const statePrestige4 = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 4 },
      };
      expect(isNavSectionUnlocked('transcendence', statePrestige4)).toBe(false);

      // Prestige 5 should unlock
      const statePrestige5 = {
        ...state,
        prestige: { ...state.prestige, prestigeLevel: 5 },
      };
      expect(isNavSectionUnlocked('transcendence', statePrestige5)).toBe(true);
    });
  });

  describe('isFarmingSubSectionUnlocked', () => {
    it('should always unlock planets', () => {
      const state = createInitialGameState();
      expect(isFarmingSubSectionUnlocked('planets', state)).toBe(true);
    });

    it('should lock seeds until first gacha pull', () => {
      const state = createInitialGameState();
      expect(isFarmingSubSectionUnlocked('seeds', state)).toBe(false);

      const stateWithSeed = {
        ...state,
        ship: {
          ...state.ship,
          seedInventory: [{ instanceId: 'test', id: 'wheat' } as any],
        },
      };
      expect(isFarmingSubSectionUnlocked('seeds', stateWithSeed)).toBe(true);
    });

    it('should lock gacha until first export', () => {
      const state = createInitialGameState();
      expect(isFarmingSubSectionUnlocked('gacha', state)).toBe(false);

      const stateWithCredits = {
        ...state,
        prestige: { ...state.prestige, lifetimeCredits: 1 },
      };
      expect(isFarmingSubSectionUnlocked('gacha', stateWithCredits)).toBe(true);
    });

    it('should lock fusion until 10 gacha pulls', () => {
      const state = createInitialGameState();
      expect(isFarmingSubSectionUnlocked('fusion', state)).toBe(false);

      // 9 pulls should NOT unlock
      const stateWith9Pulls = {
        ...state,
        achievements: {
          ...state.achievements,
          stats: { ...state.achievements.stats, totalGachaPulls: 9 },
        },
      };
      expect(isFarmingSubSectionUnlocked('fusion', stateWith9Pulls)).toBe(false);

      // 10 pulls should unlock
      const stateWith10Pulls = {
        ...state,
        achievements: {
          ...state.achievements,
          stats: { ...state.achievements.stats, totalGachaPulls: 10 },
        },
      };
      expect(isFarmingSubSectionUnlocked('fusion', stateWith10Pulls)).toBe(true);
    });

    it('should lock inventory until essence or fusion', () => {
      const state = createInitialGameState();
      expect(isFarmingSubSectionUnlocked('inventory', state)).toBe(false);

      // With seed essence
      const stateWithEssence = {
        ...state,
        ship: { ...state.ship, resources: { ...state.ship.resources, seedEssence: 1 } },
      };
      expect(isFarmingSubSectionUnlocked('inventory', stateWithEssence)).toBe(true);

      // With fused seeds
      const stateWithFusion = {
        ...state,
        achievements: {
          ...state.achievements,
          stats: { ...state.achievements.stats, totalSeedsFused: 1 },
        },
      };
      expect(isFarmingSubSectionUnlocked('inventory', stateWithFusion)).toBe(true);
    });
  });

  describe('getUnlockedNavSections', () => {
    it('should return only farming, daily, changelog, and ai-coop for fresh state', () => {
      const state = createInitialGameState();
      const unlocked = getUnlockedNavSections(state);

      expect(unlocked).toContain('farming');
      expect(unlocked).toContain('daily');
      expect(unlocked).toContain('changelog');
      expect(unlocked).toContain('ai-coop');
      expect(unlocked.length).toBe(4);
    });

    it('should progressively unlock sections as player advances', () => {
      // With 2 planets: unlocks quests
      const baseState = createInitialGameState();
      const stateWith2Planets = {
        ...baseState,
        planets: baseState.planets.map((p, i) => ({ ...p, unlocked: i < 2 })),
      };
      const unlocked2Planets = getUnlockedNavSections(stateWith2Planets);
      expect(unlocked2Planets).toContain('quests');
      expect(unlocked2Planets).not.toContain('managers'); // Needs 3 planets

      // With 3 planets: unlocks managers
      const stateWith3Planets = {
        ...baseState,
        planets: baseState.planets.map((p, i) => ({ ...p, unlocked: i < 3 })),
      };
      const unlocked3Planets = getUnlockedNavSections(stateWith3Planets);
      expect(unlocked3Planets).toContain('managers');

      // With prestige 1: unlocks prestige-gated features
      const stateWithPrestige = {
        ...baseState,
        prestige: { ...baseState.prestige, prestigeLevel: 1 },
      };
      const unlockedPrestige = getUnlockedNavSections(stateWithPrestige);
      expect(unlockedPrestige).toContain('market');
      expect(unlockedPrestige).toContain('research');
      expect(unlockedPrestige).toContain('shop');
      expect(unlockedPrestige).toContain('events');
      expect(unlockedPrestige).toContain('leaderboard');
    });
  });

  describe('getUnlockedFarmingSubSections', () => {
    it('should return only planets for fresh state', () => {
      const state = createInitialGameState();
      const unlocked = getUnlockedFarmingSubSections(state);

      expect(unlocked).toContain('planets');
      expect(unlocked.length).toBe(1);
    });
  });

  describe('getUnlockHint', () => {
    it('should return hint for locked sections', () => {
      expect(getUnlockHint('managers')).toBe('Unlock 3 planets');
      expect(getUnlockHint('quests')).toBe('Unlock a second planet');
      expect(getUnlockHint('seeds')).toBe('Perform a gacha pull');
    });

    it('should return null for sections without conditions', () => {
      expect(getUnlockHint('farming')).toBe(null);
      expect(getUnlockHint('planets')).toBe(null);
    });
  });
});
