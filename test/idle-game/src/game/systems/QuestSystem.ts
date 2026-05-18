/**
 * Quest System - Display helpers for quest UI
 *
 * Quest logic lives server-side in convex/rewards.ts.
 */

import {
  QUEST_DEFINITIONS,
  DAILY_QUEST_IDS,
  WEEKLY_QUEST_IDS,
  type QuestDefinition,
} from '../config/quests';

// ============================================
// QUEST STATE TYPES
// ============================================

export interface QuestProgress {
  questId: string;
  progress: number;
  claimed: boolean;
}

export interface QuestState {
  dailyQuests: Record<string, QuestProgress>;
  weeklyQuests: Record<string, QuestProgress>;
  dailyResetTime: number; // Timestamp of next reset
  weeklyResetTime: number; // Timestamp of next reset
}

// ============================================
// QUEST QUERIES
// ============================================

/**
 * Check if a quest is complete (progress >= target)
 */
export function isQuestComplete(questId: string, progress: number): boolean {
  const quest = QUEST_DEFINITIONS[questId];
  if (!quest) return false;
  return progress >= quest.target;
}

/**
 * Get quest progress percentage (0-100)
 */
export function getQuestProgressPercent(questId: string, progress: number): number {
  const quest = QUEST_DEFINITIONS[questId];
  if (!quest) return 0;
  return Math.min(100, Math.round((progress / quest.target) * 100));
}

/**
 * Get time remaining until reset in milliseconds
 */
export function getTimeUntilReset(resetTime: number, now: number = Date.now()): number {
  return Math.max(0, resetTime - now);
}

/**
 * Format time until reset as human readable string
 */
export function formatTimeUntilReset(resetTime: number, now: number = Date.now()): string {
  const ms = getTimeUntilReset(resetTime, now);

  if (ms <= 0) return 'Resetting...';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Check if a quest can be claimed
 */
export function canClaimQuest(state: QuestState, questId: string): boolean {
  const quest = QUEST_DEFINITIONS[questId];
  if (!quest) return false;

  const questMap = quest.type === 'daily' ? state.dailyQuests : state.weeklyQuests;
  const progress = questMap[questId];

  if (!progress) return false;
  if (progress.claimed) return false;

  return isQuestComplete(questId, progress.progress);
}

/**
 * Get all claimable quests
 */
export function getClaimableQuests(state: QuestState): QuestDefinition[] {
  const claimable: QuestDefinition[] = [];

  for (const questId of [...DAILY_QUEST_IDS, ...WEEKLY_QUEST_IDS]) {
    if (canClaimQuest(state, questId)) {
      const quest = QUEST_DEFINITIONS[questId];
      if (quest) claimable.push(quest);
    }
  }

  return claimable;
}

/**
 * Get count of unclaimed completed quests
 */
export function getUnclaimedQuestCount(state: QuestState): number {
  return getClaimableQuests(state).length;
}

// ============================================
// QUEST DISPLAY HELPERS
// ============================================

/**
 * Get all daily quests with their current progress
 */
export function getDailyQuestsWithProgress(state: QuestState): Array<{
  quest: QuestDefinition;
  progress: number;
  claimed: boolean;
  complete: boolean;
  percent: number;
}> {
  return DAILY_QUEST_IDS.map(questId => {
    const quest = QUEST_DEFINITIONS[questId];
    const progress = state.dailyQuests[questId]?.progress || 0;
    const claimed = state.dailyQuests[questId]?.claimed || false;

    return {
      quest,
      progress,
      claimed,
      complete: isQuestComplete(questId, progress),
      percent: getQuestProgressPercent(questId, progress),
    };
  });
}

/**
 * Get all weekly quests with their current progress
 */
export function getWeeklyQuestsWithProgress(state: QuestState): Array<{
  quest: QuestDefinition;
  progress: number;
  claimed: boolean;
  complete: boolean;
  percent: number;
}> {
  return WEEKLY_QUEST_IDS.map(questId => {
    const quest = QUEST_DEFINITIONS[questId];
    const progress = state.weeklyQuests[questId]?.progress || 0;
    const claimed = state.weeklyQuests[questId]?.claimed || false;

    return {
      quest,
      progress,
      claimed,
      complete: isQuestComplete(questId, progress),
      percent: getQuestProgressPercent(questId, progress),
    };
  });
}
