/**
 * QuestSystem Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isQuestComplete,
  getQuestProgressPercent,
  getTimeUntilReset,
  formatTimeUntilReset,
  canClaimQuest,
  getClaimableQuests,
  getUnclaimedQuestCount,
  getDailyQuestsWithProgress,
  getWeeklyQuestsWithProgress,
  type QuestState,
} from './QuestSystem';
import { DAILY_QUEST_IDS, WEEKLY_QUEST_IDS } from '../config/quests';

function createTestQuestState(): QuestState {
  const dailyQuests: Record<string, { questId: string; progress: number; claimed: boolean }> = {};
  const weeklyQuests: Record<string, { questId: string; progress: number; claimed: boolean }> = {};

  for (const questId of DAILY_QUEST_IDS) {
    dailyQuests[questId] = { questId, progress: 0, claimed: false };
  }
  for (const questId of WEEKLY_QUEST_IDS) {
    weeklyQuests[questId] = { questId, progress: 0, claimed: false };
  }

  return {
    dailyQuests,
    weeklyQuests,
    dailyResetTime: Date.now() + 24 * 60 * 60 * 1000,
    weeklyResetTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

describe('QuestSystem', () => {
  describe('isQuestComplete', () => {
    it('should return true when progress >= target', () => {
      expect(isQuestComplete('sellPlants500', 500)).toBe(true);
      expect(isQuestComplete('sellPlants500', 600)).toBe(true);
    });

    it('should return false when progress < target', () => {
      expect(isQuestComplete('sellPlants500', 499)).toBe(false);
      expect(isQuestComplete('sellPlants500', 0)).toBe(false);
    });

    it('should return false for invalid quest ID', () => {
      expect(isQuestComplete('nonexistent', 1000)).toBe(false);
    });
  });

  describe('getQuestProgressPercent', () => {
    it('should calculate correct percentage', () => {
      expect(getQuestProgressPercent('sellPlants500', 250)).toBe(50);
      expect(getQuestProgressPercent('sellPlants500', 500)).toBe(100);
      expect(getQuestProgressPercent('sellPlants500', 0)).toBe(0);
    });

    it('should cap at 100%', () => {
      expect(getQuestProgressPercent('sellPlants500', 1000)).toBe(100);
    });

    it('should return 0 for invalid quest', () => {
      expect(getQuestProgressPercent('nonexistent', 100)).toBe(0);
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return positive time when reset is in future', () => {
      const now = Date.now();
      const futureReset = now + 3600000; // 1 hour from now

      expect(getTimeUntilReset(futureReset, now)).toBe(3600000);
    });

    it('should return 0 when reset has passed', () => {
      const now = Date.now();
      const pastReset = now - 3600000;

      expect(getTimeUntilReset(pastReset, now)).toBe(0);
    });
  });

  describe('formatTimeUntilReset', () => {
    it('should format hours and minutes correctly', () => {
      const now = Date.now();
      const resetIn5h30m = now + (5 * 60 + 30) * 60 * 1000;

      expect(formatTimeUntilReset(resetIn5h30m, now)).toBe('5h 30m');
    });

    it('should show days for longer times', () => {
      const now = Date.now();
      const resetIn2days = now + 2 * 24 * 60 * 60 * 1000;

      expect(formatTimeUntilReset(resetIn2days, now)).toBe('2d 0h');
    });

    it('should return "Resetting..." when time has passed', () => {
      const now = Date.now();
      const pastReset = now - 1000;

      expect(formatTimeUntilReset(pastReset, now)).toBe('Resetting...');
    });
  });

  describe('canClaimQuest', () => {
    it('should return true for complete, unclaimed quest', () => {
      const state = createTestQuestState();
      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 500,
        claimed: false,
      };

      expect(canClaimQuest(state, 'sellPlants500')).toBe(true);
    });

    it('should return false for incomplete quest', () => {
      const state = createTestQuestState();
      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 100,
        claimed: false,
      };

      expect(canClaimQuest(state, 'sellPlants500')).toBe(false);
    });

    it('should return false for already claimed quest', () => {
      const state = createTestQuestState();
      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 500,
        claimed: true,
      };

      expect(canClaimQuest(state, 'sellPlants500')).toBe(false);
    });

    it('should return false for invalid quest ID', () => {
      const state = createTestQuestState();
      expect(canClaimQuest(state, 'nonexistent')).toBe(false);
    });
  });

  describe('getClaimableQuests', () => {
    it('should return all claimable quests', () => {
      const state = createTestQuestState();

      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 500,
        claimed: false,
      };
      state.dailyQuests['gachaPull10'] = { questId: 'gachaPull10', progress: 10, claimed: false };
      state.dailyQuests['fuseSeeds3'] = { questId: 'fuseSeeds3', progress: 2, claimed: false }; // Not complete

      const claimable = getClaimableQuests(state);

      expect(claimable.length).toBe(2);
      expect(claimable.map(q => q.id)).toContain('sellPlants500');
      expect(claimable.map(q => q.id)).toContain('gachaPull10');
    });

    it('should return empty array when no quests are claimable', () => {
      const state = createTestQuestState();
      expect(getClaimableQuests(state)).toEqual([]);
    });
  });

  describe('getUnclaimedQuestCount', () => {
    it('should return count of claimable quests', () => {
      const state = createTestQuestState();
      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 500,
        claimed: false,
      };
      state.dailyQuests['gachaPull10'] = { questId: 'gachaPull10', progress: 10, claimed: false };

      expect(getUnclaimedQuestCount(state)).toBe(2);
    });
  });

  describe('getDailyQuestsWithProgress', () => {
    it('should return all daily quests with progress info', () => {
      const state = createTestQuestState();
      state.dailyQuests['sellPlants500'] = {
        questId: 'sellPlants500',
        progress: 250,
        claimed: false,
      };

      const quests = getDailyQuestsWithProgress(state);

      expect(quests.length).toBe(DAILY_QUEST_IDS.length);

      const sellQuest = quests.find(q => q.quest.id === 'sellPlants500');
      expect(sellQuest?.progress).toBe(250);
      expect(sellQuest?.percent).toBe(50);
      expect(sellQuest?.complete).toBe(false);
      expect(sellQuest?.claimed).toBe(false);
    });
  });

  describe('getWeeklyQuestsWithProgress', () => {
    it('should return all weekly quests with progress info', () => {
      const state = createTestQuestState();
      state.weeklyQuests['earnCredits10000'] = {
        questId: 'earnCredits10000',
        progress: 10000,
        claimed: false,
      };

      const quests = getWeeklyQuestsWithProgress(state);

      expect(quests.length).toBe(WEEKLY_QUEST_IDS.length);

      const creditsQuest = quests.find(q => q.quest.id === 'earnCredits10000');
      expect(creditsQuest?.progress).toBe(10000);
      expect(creditsQuest?.percent).toBe(100);
      expect(creditsQuest?.complete).toBe(true);
      expect(creditsQuest?.claimed).toBe(false);
    });
  });
});
