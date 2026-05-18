/**
 * Daily Login Bonus System
 *
 * Rewards players for consecutive daily logins with escalating bonuses.
 * 7-day cycle with increasingly valuable rewards.
 */

// ============================================
// TYPES
// ============================================

export interface DailyLoginReward {
  day: number; // 1-7
  type: 'credits' | 'crystals' | 'essence' | 'refinedEssence';
  amount: number;
  description: string;
}

export interface DailyLoginState {
  lastLoginDate: string | null; // ISO date string (YYYY-MM-DD)
  currentStreak: number; // Days in a row (1-7, resets after 7)
  totalLogins: number; // Lifetime login count
  todayClaimed: boolean; // Already claimed today's reward
}

// ============================================
// REWARD CONFIGURATION
// ============================================

/**
 * Day 3 progression scaling config.
 * New players get MIN, veterans get MAX based on lifetime earnings.
 * Formula: max(MIN, min(MAX, lifetimeCredits * SCALE_FACTOR))
 */
export const DAY3_SCALING = {
  MIN: 500, // Minimum reward for new players
  MAX: 2500, // Maximum reward for veterans
  SCALE_FACTOR: 0.2, // 20% of lifetime credits
};

export const DAILY_REWARDS: DailyLoginReward[] = [
  { day: 1, type: 'credits', amount: 250, description: '250 Credits' },
  { day: 2, type: 'essence', amount: 50, description: '50 Seed Essence' },
  { day: 3, type: 'credits', amount: DAY3_SCALING.MAX, description: 'Up to 2,500 Credits' },
  { day: 4, type: 'crystals', amount: 25, description: '25 Crystals' },
  { day: 5, type: 'essence', amount: 100, description: '100 Seed Essence' },
  { day: 6, type: 'refinedEssence', amount: 10, description: '10 Refined Essence' },
  { day: 7, type: 'crystals', amount: 100, description: '100 Crystals!' }, // Big reward day
];

/**
 * Calculate scaled Day 3 credit reward based on player progression.
 * New players get 500, veterans with 12,500+ lifetime credits get 2,500.
 * @param lifetimeCredits - Player's total credits earned (handles NaN/negative gracefully)
 */
export function getScaledDay3Reward(lifetimeCredits: number): number {
  // Guard against NaN, Infinity, or negative values from corrupted saves
  const safeCredits = Math.max(0, lifetimeCredits || 0);
  const scaled = safeCredits * DAY3_SCALING.SCALE_FACTOR;
  return Math.max(DAY3_SCALING.MIN, Math.min(DAY3_SCALING.MAX, Math.floor(scaled)));
}

/**
 * Get the actual reward for a day, with progression scaling applied.
 */
export function getRewardForDay(day: number, lifetimeCredits: number = 0): DailyLoginReward {
  const baseReward = DAILY_REWARDS[(day - 1) % 7];

  // Day 3 credit reward scales with progression
  if (day === 3 && baseReward.type === 'credits') {
    const scaledAmount = getScaledDay3Reward(lifetimeCredits);
    return {
      ...baseReward,
      amount: scaledAmount,
      description: `${scaledAmount.toLocaleString()} Credits`,
    };
  }

  return baseReward;
}

// ============================================
// STATE INITIALIZATION
// ============================================

export function createInitialDailyLoginState(): DailyLoginState {
  return {
    lastLoginDate: null,
    currentStreak: 0,
    totalLogins: 0,
    todayClaimed: false,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date is yesterday
 */
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0] === dateStr;
}

/**
 * Check if a date is today
 */
function isToday(dateStr: string): boolean {
  return getTodayDateString() === dateStr;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check daily login status and update streak
 * Called when game loads or on new day
 * @param state - Current daily login state
 * @param lifetimeCredits - Player's lifetime credits for reward scaling (default 0)
 */
export function checkDailyLogin(
  state: DailyLoginState,
  lifetimeCredits: number = 0
): {
  newState: DailyLoginState;
  canClaim: boolean;
  reward: DailyLoginReward | null;
  streakBroken: boolean;
} {
  // If never logged in, start fresh
  if (!state.lastLoginDate) {
    return {
      newState: {
        ...state,
        currentStreak: 1,
        todayClaimed: false,
      },
      canClaim: true,
      reward: getRewardForDay(1, lifetimeCredits),
      streakBroken: false,
    };
  }

  // If already logged in today
  if (isToday(state.lastLoginDate)) {
    return {
      newState: state,
      canClaim: !state.todayClaimed,
      reward: state.todayClaimed ? null : getRewardForDay(state.currentStreak, lifetimeCredits),
      streakBroken: false,
    };
  }

  // If logged in yesterday, continue streak
  if (isYesterday(state.lastLoginDate)) {
    const newStreak = (state.currentStreak % 7) + 1;
    return {
      newState: {
        ...state,
        currentStreak: newStreak,
        todayClaimed: false,
      },
      canClaim: true,
      reward: getRewardForDay(newStreak, lifetimeCredits),
      streakBroken: false,
    };
  }

  // Missed a day - streak broken, start at day 1
  return {
    newState: {
      ...state,
      currentStreak: 1,
      todayClaimed: false,
    },
    canClaim: true,
    reward: getRewardForDay(1, lifetimeCredits),
    streakBroken: true,
  };
}

/**
 * Claim today's daily login reward
 * @param state - Current daily login state
 * @param lifetimeCredits - Player's lifetime credits for reward scaling (default 0)
 */
export function claimDailyReward(
  state: DailyLoginState,
  lifetimeCredits: number = 0
): {
  newState: DailyLoginState;
  reward: DailyLoginReward | null;
} {
  const today = getTodayDateString();

  // Already claimed
  if (state.todayClaimed && isToday(state.lastLoginDate || '')) {
    return { newState: state, reward: null };
  }

  const reward = getRewardForDay(state.currentStreak, lifetimeCredits);

  return {
    newState: {
      ...state,
      lastLoginDate: today,
      todayClaimed: true,
      totalLogins: state.totalLogins + 1,
    },
    reward,
  };
}

/**
 * Get next reward preview (for UI)
 * @param state - Current daily login state
 * @param lifetimeCredits - Player's lifetime credits for reward scaling (default 0)
 */
export function getNextReward(
  state: DailyLoginState,
  lifetimeCredits: number = 0
): DailyLoginReward {
  const nextDay = (state.currentStreak % 7) + 1;
  return getRewardForDay(nextDay, lifetimeCredits);
}

/**
 * Get all rewards with claimed status
 * @param currentStreak - Current streak day (1-7)
 * @param lifetimeCredits - Player's lifetime credits for reward scaling (default 0)
 */
export function getWeeklyRewardsPreview(
  currentStreak: number,
  lifetimeCredits: number = 0
): Array<DailyLoginReward & { claimed: boolean; current: boolean }> {
  return DAILY_REWARDS.map((reward, index) => {
    const day = index + 1;
    const scaledReward = getRewardForDay(day, lifetimeCredits);
    return {
      ...scaledReward,
      claimed: index < currentStreak - 1,
      current: index === currentStreak - 1,
    };
  });
}
