/**
 * Daily Challenge System
 * Rotating daily challenges with escalating rewards
 */

import { generateUniqueId } from './GachaSystem';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ChallengeType =
  | 'harvest' // Harvest X plants
  | 'sell' // Sell X credits worth
  | 'gacha' // Pull X times
  | 'fuse' // Perform X fusions
  | 'export' // Export X shipments
  | 'prestige' // Prestige X times
  | 'research' // Complete X research
  | 'collect' // Collect from managers X times
  | 'expedition'; // Complete X expeditions

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'elite';

export interface DailyChallenge {
  id: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  description: string;
  requirement: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: ChallengeReward;
}

export interface ChallengeReward {
  type: 'credits' | 'crystals' | 'essence' | 'refinedEssence';
  amount: number;
}

export interface DailyChallengeState {
  challenges: DailyChallenge[];
  lastRefreshDate: string; // ISO date string (YYYY-MM-DD)
  dailyStreak: number; // Consecutive days with all challenges complete
  longestStreak: number; // Best streak ever
  totalChallengesCompleted: number;
  allClaimedBonus: ChallengeReward | null; // Bonus for claiming all
  streakShields: number; // Shields that prevent streak reset (max 3)
  lastShieldGrantStreak: number; // Track when last shield was granted
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const DAILY_CHALLENGE_CONFIG = {
  challengesPerDay: 4,
  refreshHourUTC: 5, // 5 AM UTC (roughly midnight US)
  baseAllClaimedBonus: 20, // Base crystal reward for completing all
  maxStreakMultiplier: 2.0, // Max 2x at 10 day streak
  streakShieldGrantInterval: 5, // Grant a shield every 5 days of streak
  maxStreakShields: 3, // Can stockpile up to 3 shields
} as const;

// Reward multipliers now scale better than requirements for elite challenges
// This makes harder challenges feel worth the extra effort
const DIFFICULTY_MULTIPLIERS: Record<ChallengeDifficulty, { requirement: number; reward: number }> =
  {
    easy: { requirement: 1, reward: 1 },
    medium: { requirement: 2, reward: 2.5 }, // 1.25x efficiency (rewarding)
    hard: { requirement: 4, reward: 6 }, // 1.5x efficiency (very rewarding)
    elite: { requirement: 7, reward: 14 }, // 2x efficiency (elite feels elite)
  };

const CHALLENGE_TEMPLATES: Record<
  ChallengeType,
  {
    baseRequirement: number;
    description: (amount: number) => string;
    baseReward: ChallengeReward;
  }
> = {
  harvest: {
    baseRequirement: 50,
    description: n => `Harvest ${n} plants`,
    baseReward: { type: 'credits', amount: 500 },
  },
  sell: {
    baseRequirement: 10000,
    description: n => `Sell crops worth ${n.toLocaleString()} credits`,
    baseReward: { type: 'crystals', amount: 5 },
  },
  gacha: {
    baseRequirement: 3,
    description: n => `Perform ${n} gacha pulls`,
    // Gacha costs 10 credits/pull, so reward is intentionally generous
    // 3 pulls = 30 credits cost, 15 crystals is a good trade
    baseReward: { type: 'crystals', amount: 15 },
  },
  fuse: {
    baseRequirement: 5,
    description: n => `Fuse ${n} seeds`,
    baseReward: { type: 'essence', amount: 25 },
  },
  export: {
    baseRequirement: 10,
    description: n => `Complete ${n} exports`,
    baseReward: { type: 'credits', amount: 1000 },
  },
  prestige: {
    baseRequirement: 1,
    description: n => `Prestige ${n} time${n > 1 ? 's' : ''}`,
    baseReward: { type: 'crystals', amount: 25 },
  },
  research: {
    baseRequirement: 2,
    description: n => `Complete ${n} research projects`,
    baseReward: { type: 'essence', amount: 50 },
  },
  collect: {
    baseRequirement: 20,
    description: n => `Collect from managers ${n} times`,
    baseReward: { type: 'credits', amount: 750 },
  },
  expedition: {
    baseRequirement: 2,
    description: n => `Complete ${n} expeditions`,
    baseReward: { type: 'crystals', amount: 15 },
  },
};

// Guaranteed one of each difficulty per day
const DAILY_DIFFICULTIES: ChallengeDifficulty[] = ['easy', 'medium', 'hard', 'elite'];

// ─────────────────────────────────────────────────────────────────────────────
// State Management
// ─────────────────────────────────────────────────────────────────────────────

export function createInitialDailyChallengeState(): DailyChallengeState {
  return {
    challenges: [],
    lastRefreshDate: '',
    dailyStreak: 0,
    longestStreak: 0,
    totalChallengesCompleted: 0,
    allClaimedBonus: null,
    streakShields: 0,
    lastShieldGrantStreak: 0,
  };
}

/**
 * Get today's date string in YYYY-MM-DD format (based on refresh hour)
 */
export function getDailyChallengeDate(now: Date = new Date()): string {
  // Adjust for refresh hour - if before refresh, use yesterday's date
  const adjustedDate = new Date(now);
  if (adjustedDate.getUTCHours() < DAILY_CHALLENGE_CONFIG.refreshHourUTC) {
    adjustedDate.setUTCDate(adjustedDate.getUTCDate() - 1);
  }
  return adjustedDate.toISOString().split('T')[0];
}

/**
 * Check if daily challenges need refresh
 */
export function needsChallengeRefresh(state: DailyChallengeState, now: Date = new Date()): boolean {
  const today = getDailyChallengeDate(now);
  return state.lastRefreshDate !== today;
}

/**
 * Generate a random challenge of given difficulty
 */
function generateChallenge(
  difficulty: ChallengeDifficulty,
  usedTypes: Set<ChallengeType>
): DailyChallenge {
  // Pick a random type that hasn't been used today
  const availableTypes = Object.keys(CHALLENGE_TEMPLATES).filter(
    t => !usedTypes.has(t as ChallengeType)
  ) as ChallengeType[];

  const type = availableTypes[Math.floor(Math.random() * availableTypes.length)] || 'harvest';
  const template = CHALLENGE_TEMPLATES[type];
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];

  const requirement = Math.floor(template.baseRequirement * multiplier.requirement);
  const rewardAmount = Math.floor(template.baseReward.amount * multiplier.reward);

  return {
    id: generateUniqueId(),
    type,
    difficulty,
    description: template.description(requirement),
    requirement,
    progress: 0,
    completed: false,
    claimed: false,
    reward: {
      type: template.baseReward.type,
      amount: rewardAmount,
    },
  };
}

/**
 * Refresh daily challenges (new set for today)
 */
export function refreshDailyChallenges(
  state: DailyChallengeState,
  now: Date = new Date()
): DailyChallengeState {
  const today = getDailyChallengeDate(now);

  // Check if all previous challenges were claimed (streak tracking)
  const allPreviousClaimed = state.challenges.length > 0 && state.challenges.every(c => c.claimed);

  // Generate new challenges - one of each difficulty
  const usedTypes = new Set<ChallengeType>();
  const challenges = DAILY_DIFFICULTIES.map(difficulty => {
    const challenge = generateChallenge(difficulty, usedTypes);
    usedTypes.add(challenge.type);
    return challenge;
  });

  // Streak logic with shield protection
  let newStreak = state.dailyStreak;
  let newShields = state.streakShields ?? 0;
  let newLastShieldGrantStreak = state.lastShieldGrantStreak ?? 0;

  if (allPreviousClaimed) {
    // Completed all challenges - streak continues
    newStreak = state.dailyStreak + 1;

    // Grant a shield every N days of streak (up to max)
    const { streakShieldGrantInterval, maxStreakShields } = DAILY_CHALLENGE_CONFIG;
    if (
      newStreak > 0 &&
      newStreak % streakShieldGrantInterval === 0 &&
      newStreak !== newLastShieldGrantStreak
    ) {
      newShields = Math.min(newShields + 1, maxStreakShields);
      newLastShieldGrantStreak = newStreak;
    }
  } else if (state.challenges.length > 0) {
    // Missed completing all challenges
    if (newShields > 0) {
      // Use a shield to protect the streak
      newShields--;
    } else {
      // No shields - streak resets
      newStreak = 0;
      newLastShieldGrantStreak = 0; // Reset so they can earn shields again after rebuilding
    }
  }

  // Calculate bonus for completing all (scales with streak)
  const safeStreak = Math.max(0, newStreak);
  const streakMultiplier =
    1 + Math.min(safeStreak * 0.1, DAILY_CHALLENGE_CONFIG.maxStreakMultiplier - 1);
  const allClaimedBonus: ChallengeReward = {
    type: 'crystals',
    amount: Math.floor(DAILY_CHALLENGE_CONFIG.baseAllClaimedBonus * streakMultiplier),
  };

  return {
    ...state,
    challenges,
    lastRefreshDate: today,
    dailyStreak: newStreak,
    longestStreak: Math.max(state.longestStreak, newStreak),
    allClaimedBonus,
    streakShields: newShields,
    lastShieldGrantStreak: newLastShieldGrantStreak,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Updates
// ─────────────────────────────────────────────────────────────────────────────

export interface ChallengeUpdateResult {
  newState: DailyChallengeState;
  newlyCompleted: DailyChallenge[];
}

/**
 * Update progress for challenges of a specific type
 */
export function updateChallengeProgress(
  state: DailyChallengeState,
  type: ChallengeType,
  amount: number = 1
): ChallengeUpdateResult {
  // Validate amount - ignore invalid values
  if (amount <= 0 || !Number.isFinite(amount)) {
    return { newState: state, newlyCompleted: [] };
  }

  const newlyCompleted: DailyChallenge[] = [];

  const challenges = state.challenges.map(challenge => {
    if (challenge.type !== type || challenge.completed) {
      return challenge;
    }

    const newProgress = Math.min(challenge.progress + amount, challenge.requirement);
    const completed = newProgress >= challenge.requirement;

    if (completed && !challenge.completed) {
      newlyCompleted.push({ ...challenge, progress: newProgress, completed: true });
    }

    return {
      ...challenge,
      progress: newProgress,
      completed,
    };
  });

  return {
    newState: { ...state, challenges },
    newlyCompleted,
  };
}

/**
 * Update progress for sell-type challenges (using credit value)
 */
export function updateSellProgress(
  state: DailyChallengeState,
  creditsEarned: number
): ChallengeUpdateResult {
  return updateChallengeProgress(state, 'sell', creditsEarned);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reward Claiming
// ─────────────────────────────────────────────────────────────────────────────

export interface ClaimResult {
  newState: DailyChallengeState;
  reward: ChallengeReward | null;
  allCompleteBonus: ChallengeReward | null;
}

/**
 * Claim reward for a completed challenge
 */
export function claimChallengeReward(state: DailyChallengeState, challengeId: string): ClaimResult {
  const challenge = state.challenges.find(c => c.id === challengeId);

  if (!challenge || !challenge.completed || challenge.claimed) {
    return { newState: state, reward: null, allCompleteBonus: null };
  }

  const challenges = state.challenges.map(c =>
    c.id === challengeId ? { ...c, claimed: true } : c
  );

  // Check if this claim completes all challenges
  const allClaimed = challenges.every(c => c.claimed);
  const allCompleteBonus = allClaimed ? state.allClaimedBonus : null;

  return {
    newState: {
      ...state,
      challenges,
      totalChallengesCompleted: state.totalChallengesCompleted + 1,
    },
    reward: challenge.reward,
    allCompleteBonus,
  };
}

/**
 * Claim all available rewards
 */
export function claimAllRewards(state: DailyChallengeState): {
  newState: DailyChallengeState;
  rewards: ChallengeReward[];
  allCompleteBonus: ChallengeReward | null;
} {
  const rewards: ChallengeReward[] = [];
  let currentState = state;

  for (const challenge of state.challenges) {
    if (challenge.completed && !challenge.claimed) {
      const result = claimChallengeReward(currentState, challenge.id);
      currentState = result.newState;
      if (result.reward) {
        rewards.push(result.reward);
      }
    }
  }

  const allClaimed = currentState.challenges.every(c => c.claimed);
  const allCompleteBonus = allClaimed ? currentState.allClaimedBonus : null;

  return { newState: currentState, rewards, allCompleteBonus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get time until next refresh
 */
export function getTimeUntilRefresh(now: Date = new Date()): number {
  const refreshHour = DAILY_CHALLENGE_CONFIG.refreshHourUTC;
  const nextRefresh = new Date(now);
  nextRefresh.setUTCHours(refreshHour, 0, 0, 0);

  if (nextRefresh <= now) {
    nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 1);
  }

  return nextRefresh.getTime() - now.getTime();
}

/**
 * Format time until refresh as human-readable
 */
export function formatTimeUntilRefresh(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get unclaimed completed challenges
 */
export function getUnclaimedChallenges(state: DailyChallengeState): DailyChallenge[] {
  return state.challenges.filter(c => c.completed && !c.claimed);
}

/**
 * Get overall daily progress (0-1)
 */
export function getDailyProgress(state: DailyChallengeState): number {
  if (state.challenges.length === 0) return 0;
  const completed = state.challenges.filter(c => c.completed).length;
  return completed / state.challenges.length;
}

/**
 * Check if all daily challenges are completed (not necessarily claimed)
 */
export function allChallengesCompleted(state: DailyChallengeState): boolean {
  return state.challenges.length > 0 && state.challenges.every(c => c.completed);
}

/**
 * Get difficulty color for UI
 */
export function getDifficultyColor(difficulty: ChallengeDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-400';
    case 'medium':
      return 'text-yellow-400';
    case 'hard':
      return 'text-orange-400';
    case 'elite':
      return 'text-purple-400';
  }
}

/**
 * Get difficulty icon name for UI
 */
export function getDifficultyIcon(difficulty: ChallengeDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'CircleDot';
    case 'medium':
      return 'Circle';
    case 'hard':
      return 'Hexagon';
    case 'elite':
      return 'Star';
  }
}

/**
 * Get streak shield info for UI
 */
export function getStreakShieldInfo(state: DailyChallengeState): {
  shields: number;
  maxShields: number;
  nextShieldAt: number | null; // Streak level when next shield is granted
} {
  const shields = state.streakShields ?? 0;
  const { streakShieldGrantInterval, maxStreakShields } = DAILY_CHALLENGE_CONFIG;

  let nextShieldAt: number | null = null;
  if (shields < maxStreakShields) {
    // Calculate next shield milestone
    const currentStreak = state.dailyStreak;
    const nextMilestone =
      Math.ceil((currentStreak + 1) / streakShieldGrantInterval) * streakShieldGrantInterval;
    nextShieldAt = nextMilestone;
  }

  return { shields, maxShields: maxStreakShields, nextShieldAt };
}
