/**
 * Daily Login System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialDailyLoginState,
  checkDailyLogin,
  claimDailyReward,
  getNextReward,
  getWeeklyRewardsPreview,
  getRewardForDay,
  getScaledDay3Reward,
  DAILY_REWARDS,
  DAY3_SCALING,
  getTodayDateString,
} from './DailyLoginSystem';

describe('DailyLoginSystem', () => {
  describe('createInitialDailyLoginState', () => {
    it('should create empty state', () => {
      const state = createInitialDailyLoginState();

      expect(state.lastLoginDate).toBeNull();
      expect(state.currentStreak).toBe(0);
      expect(state.totalLogins).toBe(0);
      expect(state.todayClaimed).toBe(false);
    });
  });

  describe('checkDailyLogin', () => {
    it('should start streak at 1 for first login', () => {
      const state = createInitialDailyLoginState();
      const result = checkDailyLogin(state);

      expect(result.newState.currentStreak).toBe(1);
      expect(result.canClaim).toBe(true);
      expect(result.reward).toEqual(DAILY_REWARDS[0]);
      expect(result.streakBroken).toBe(false);
    });

    it('should allow claim if not claimed today', () => {
      const today = getTodayDateString();
      const state = {
        lastLoginDate: today,
        currentStreak: 3,
        totalLogins: 3,
        todayClaimed: false,
      };

      // With 0 lifetime credits, Day 3 should give minimum (500)
      const result = checkDailyLogin(state, 0);

      expect(result.canClaim).toBe(true);
      expect(result.reward?.day).toBe(3);
      expect(result.reward?.type).toBe('credits');
      expect(result.reward?.amount).toBe(DAY3_SCALING.MIN);
    });

    it('should scale Day 3 reward with lifetime credits', () => {
      const today = getTodayDateString();
      const state = {
        lastLoginDate: today,
        currentStreak: 3,
        totalLogins: 3,
        todayClaimed: false,
      };

      // With 50,000 lifetime credits, Day 3 should give max (2,500)
      const result = checkDailyLogin(state, 50000);

      expect(result.reward?.day).toBe(3);
      expect(result.reward?.amount).toBe(DAY3_SCALING.MAX);
    });

    it('should not allow claim if already claimed today', () => {
      const today = getTodayDateString();
      const state = {
        lastLoginDate: today,
        currentStreak: 2,
        totalLogins: 2,
        todayClaimed: true,
      };

      const result = checkDailyLogin(state);

      expect(result.canClaim).toBe(false);
      expect(result.reward).toBeNull();
    });

    it('should reset streak if missed a day', () => {
      // Two days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      const state = {
        lastLoginDate: twoDaysAgoStr,
        currentStreak: 5,
        totalLogins: 5,
        todayClaimed: true,
      };

      const result = checkDailyLogin(state);

      expect(result.newState.currentStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
      expect(result.reward).toEqual(DAILY_REWARDS[0]); // Back to day 1
    });

    it('should wrap streak after day 7', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const state = {
        lastLoginDate: yesterdayStr,
        currentStreak: 7,
        totalLogins: 7,
        todayClaimed: true,
      };

      const result = checkDailyLogin(state);

      expect(result.newState.currentStreak).toBe(1); // Wraps to 1
      expect(result.reward).toEqual(DAILY_REWARDS[0]);
    });
  });

  describe('claimDailyReward', () => {
    it('should claim reward and update state', () => {
      const state = {
        lastLoginDate: null,
        currentStreak: 1,
        totalLogins: 0,
        todayClaimed: false,
      };

      const result = claimDailyReward(state);

      expect(result.newState.todayClaimed).toBe(true);
      expect(result.newState.totalLogins).toBe(1);
      expect(result.newState.lastLoginDate).toBe(getTodayDateString());
      expect(result.reward).toEqual(DAILY_REWARDS[0]);
    });

    it('should not claim if already claimed', () => {
      const today = getTodayDateString();
      const state = {
        lastLoginDate: today,
        currentStreak: 2,
        totalLogins: 2,
        todayClaimed: true,
      };

      const result = claimDailyReward(state);

      expect(result.reward).toBeNull();
      expect(result.newState.totalLogins).toBe(2); // Unchanged
    });
  });

  describe('getNextReward', () => {
    it('should return next reward in sequence', () => {
      const state = {
        lastLoginDate: null,
        currentStreak: 3,
        totalLogins: 3,
        todayClaimed: true,
      };

      const nextReward = getNextReward(state);

      expect(nextReward).toEqual(DAILY_REWARDS[3]); // Day 4
    });

    it('should wrap after day 7', () => {
      const state = {
        lastLoginDate: null,
        currentStreak: 7,
        totalLogins: 7,
        todayClaimed: true,
      };

      const nextReward = getNextReward(state);

      expect(nextReward).toEqual(DAILY_REWARDS[0]); // Back to day 1
    });
  });

  describe('getWeeklyRewardsPreview', () => {
    it('should mark correct days as claimed/current', () => {
      const preview = getWeeklyRewardsPreview(3);

      expect(preview[0].claimed).toBe(true); // Day 1
      expect(preview[1].claimed).toBe(true); // Day 2
      expect(preview[2].claimed).toBe(false); // Day 3 (current)
      expect(preview[2].current).toBe(true);
      expect(preview[3].claimed).toBe(false); // Day 4
    });

    it('should return 7 rewards', () => {
      const preview = getWeeklyRewardsPreview(1);
      expect(preview.length).toBe(7);
    });
  });

  describe('DAILY_REWARDS', () => {
    it('should have 7 rewards', () => {
      expect(DAILY_REWARDS.length).toBe(7);
    });

    it('should have crystals on day 7', () => {
      const day7 = DAILY_REWARDS[6];
      expect(day7.type).toBe('crystals');
      expect(day7.amount).toBe(100);
    });
  });

  describe('Day 3 Progression Scaling', () => {
    describe('getScaledDay3Reward', () => {
      it('should return minimum for new players (0 credits)', () => {
        expect(getScaledDay3Reward(0)).toBe(DAY3_SCALING.MIN);
      });

      it('should return minimum for low earners (1000 credits)', () => {
        // 1000 * 0.2 = 200, but min is 500
        expect(getScaledDay3Reward(1000)).toBe(DAY3_SCALING.MIN);
      });

      it('should scale proportionally for mid-range players', () => {
        // 5000 * 0.2 = 1000
        expect(getScaledDay3Reward(5000)).toBe(1000);

        // 10000 * 0.2 = 2000
        expect(getScaledDay3Reward(10000)).toBe(2000);
      });

      it('should cap at maximum for veterans (12500+ credits)', () => {
        // 12500 * 0.2 = 2500 (exactly max)
        expect(getScaledDay3Reward(12500)).toBe(DAY3_SCALING.MAX);

        // 100000 * 0.2 = 20000, but max is 2500
        expect(getScaledDay3Reward(100000)).toBe(DAY3_SCALING.MAX);
      });

      it('should floor decimal values', () => {
        // 3333 * 0.2 = 666.6, should floor to 666
        expect(getScaledDay3Reward(3333)).toBe(666);
      });

      it('should handle negative lifetime credits (corrupted save)', () => {
        expect(getScaledDay3Reward(-5000)).toBe(DAY3_SCALING.MIN);
        expect(getScaledDay3Reward(-1)).toBe(DAY3_SCALING.MIN);
      });

      it('should handle NaN (corrupted save)', () => {
        expect(getScaledDay3Reward(NaN)).toBe(DAY3_SCALING.MIN);
      });

      it('should handle exact boundary at 2500 credits', () => {
        // 2500 * 0.2 = 500, exactly equals MIN
        expect(getScaledDay3Reward(2500)).toBe(500);
        // 2499 * 0.2 = 499.8, floor = 499, but MIN clamps to 500
        expect(getScaledDay3Reward(2499)).toBe(DAY3_SCALING.MIN);
      });
    });

    describe('getRewardForDay', () => {
      it('should return scaled Day 3 reward', () => {
        const newPlayerReward = getRewardForDay(3, 0);
        expect(newPlayerReward.amount).toBe(DAY3_SCALING.MIN);
        expect(newPlayerReward.description).toBe('500 Credits');

        const veteranReward = getRewardForDay(3, 50000);
        expect(veteranReward.amount).toBe(DAY3_SCALING.MAX);
        expect(veteranReward.description).toBe('2,500 Credits');
      });

      it('should not scale non-Day-3 rewards', () => {
        // Day 1 should be fixed at 250 regardless of credits
        const day1 = getRewardForDay(1, 100000);
        expect(day1.amount).toBe(250);

        // Day 4 crystals should be fixed at 25
        const day4 = getRewardForDay(4, 100000);
        expect(day4.amount).toBe(25);

        // Day 7 crystals should be fixed at 100
        const day7 = getRewardForDay(7, 100000);
        expect(day7.amount).toBe(100);
      });
    });

    describe('claimDailyReward with scaling', () => {
      it('should return scaled Day 3 reward on claim', () => {
        const state = {
          lastLoginDate: null,
          currentStreak: 3,
          totalLogins: 2,
          todayClaimed: false,
        };

        // New player gets minimum
        const newPlayerResult = claimDailyReward(state, 0);
        expect(newPlayerResult.reward?.amount).toBe(DAY3_SCALING.MIN);

        // Veteran gets maximum (need fresh state since todayClaimed is now true)
        const freshState = { ...state };
        const veteranResult = claimDailyReward(freshState, 50000);
        expect(veteranResult.reward?.amount).toBe(DAY3_SCALING.MAX);
      });
    });

    describe('getWeeklyRewardsPreview with scaling', () => {
      it('should show scaled Day 3 preview for new players', () => {
        const preview = getWeeklyRewardsPreview(1, 0);
        const day3Preview = preview[2];

        expect(day3Preview.day).toBe(3);
        expect(day3Preview.amount).toBe(DAY3_SCALING.MIN);
        expect(day3Preview.description).toBe('500 Credits');
      });

      it('should show full Day 3 preview for veterans', () => {
        const preview = getWeeklyRewardsPreview(1, 50000);
        const day3Preview = preview[2];

        expect(day3Preview.amount).toBe(DAY3_SCALING.MAX);
        expect(day3Preview.description).toBe('2,500 Credits');
      });
    });

    describe('week 2+ behavior', () => {
      it('should scale Day 3 on second week (total login day 10)', () => {
        // Simulate player on day 10 (week 2, day 3)
        // After 7 consecutive logins, streak wraps: 7 -> 1 -> 2 -> 3
        // So by "Day 10", currentStreak is back to 3
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Player has 9 logins, currentStreak=2 (yesterday was week 2, day 2)
        const state = {
          lastLoginDate: yesterdayStr,
          currentStreak: 2,
          totalLogins: 9,
          todayClaimed: true,
        };

        // With 5000 lifetime credits (mid-range player)
        const result = checkDailyLogin(state, 5000);

        // newStreak = (2 % 7) + 1 = 3
        expect(result.newState.currentStreak).toBe(3);
        // Scaling should apply: 5000 * 0.2 = 1000
        expect(result.reward?.amount).toBe(1000);
        expect(result.reward?.day).toBe(3);
      });

      it('should wrap streak correctly after day 7', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Day 7 complete, starting week 2
        const state = {
          lastLoginDate: yesterdayStr,
          currentStreak: 7,
          totalLogins: 7,
          todayClaimed: true,
        };

        const result = checkDailyLogin(state, 0);

        // newStreak = (7 % 7) + 1 = 1 (wraps back to day 1)
        expect(result.newState.currentStreak).toBe(1);
        expect(result.reward?.day).toBe(1);
      });
    });
  });
});
