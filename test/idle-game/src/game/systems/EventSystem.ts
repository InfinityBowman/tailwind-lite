/**
 * Event System
 * Limited-time events with special rewards, challenges, and modifiers
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EventType =
  | 'harvest_festival' // Bonus production
  | 'crystal_rain' // Bonus crystal drops
  | 'fusion_frenzy' // Improved fusion rates
  | 'essence_surge' // Bonus essence gain
  | 'lucky_stars' // Boosted gacha rates
  | 'speed_bloom' // Faster grow times
  | 'rare_migration' // Rare seeds more common
  | 'prestige_gala' // Bonus prestige points
  | 'expedition_rush' // Faster expeditions
  | 'cosmic_anomaly' // Special anomaly event
  // Seasonal Events
  | 'lunar_new_year' // Feb - Prosperity theme
  | 'bloom_festival' // Spring - Growth theme
  | 'harvest_moon' // Fall - Harvest theme
  | 'crystal_frost'; // Winter - Crystal theme

export interface EventModifier {
  type:
    | 'production'
    | 'sellValue'
    | 'crystalDrop'
    | 'fusionSuccess'
    | 'essenceGain'
    | 'gachaLuck'
    | 'growSpeed'
    | 'rareRate'
    | 'prestigePoints'
    | 'expeditionSpeed';
  value: number; // Multiplier (1.5 = +50%)
}

export interface EventChallenge {
  id: string;
  description: string;
  requirement: {
    type: 'harvest' | 'sell' | 'fuse' | 'gacha' | 'prestige' | 'expedition';
    target: number;
    seedType?: string; // Optional specific seed requirement
  };
  progress: number;
  completed: boolean;
  reward: EventReward;
}

export interface EventReward {
  type: 'credits' | 'crystals' | 'essence' | 'refinedEssence' | 'seed' | 'cosmetic';
  amount?: number;
  itemId?: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  startTime: number;
  endTime: number;
  modifiers: EventModifier[];
  challenges: EventChallenge[];
  completionBonus?: EventReward; // Bonus for completing all challenges
}

export interface EventState {
  activeEvents: GameEvent[];
  completedEventIds: string[];
  claimedRewards: Record<string, string[]>; // eventId -> challengeId[]
  eventHistory: {
    eventId: string;
    type: EventType;
    startTime: number;
    endTime: number;
    challengesCompleted: number;
    totalChallenges: number;
  }[];
}

// Alias for backwards compatibility with GameState imports
export type EventStateData = EventState;

// Aggregated modifiers from all active events
export interface EventModifiers {
  production: number;
  sellValue: number;
  crystalDrop: number;
  fusionSuccess: number;
  essenceGain: number;
  gachaLuck: number;
  growSpeed: number;
  rareRate: number;
  prestigePoints: number;
  expeditionSpeed: number;
  // Aliases for GameEngine compatibility
  productionMultiplier: number;
  exportSpeedMultiplier: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT_CONFIG = {
  maxActiveEvents: 2,
  minEventDurationHours: 24,
  maxEventDurationHours: 72,
  cooldownBetweenEventsHours: 6,
} as const;

export const EVENT_TEMPLATES: Record<
  EventType,
  Omit<GameEvent, 'id' | 'startTime' | 'endTime' | 'challenges'>
> = {
  harvest_festival: {
    type: 'harvest_festival',
    name: 'Harvest Festival',
    description: 'The cosmos celebrates abundance! All production is boosted.',
    icon: 'Wheat',
    modifiers: [{ type: 'production', value: 1.5 }],
  },
  crystal_rain: {
    type: 'crystal_rain',
    name: 'Crystal Rain',
    description: 'A shower of cosmic crystals! Increased crystal drops.',
    icon: 'Gem',
    modifiers: [{ type: 'crystalDrop', value: 2.0 }],
  },
  fusion_frenzy: {
    type: 'fusion_frenzy',
    name: 'Fusion Frenzy',
    description: 'The fusion reactor is supercharged! Better fusion outcomes.',
    icon: 'Zap',
    modifiers: [{ type: 'fusionSuccess', value: 1.25 }],
  },
  essence_surge: {
    type: 'essence_surge',
    name: 'Essence Surge',
    description: 'Essence flows freely through the cosmos!',
    icon: 'Droplets',
    modifiers: [{ type: 'essenceGain', value: 1.75 }],
  },
  lucky_stars: {
    type: 'lucky_stars',
    name: 'Lucky Stars',
    description: 'The stars align! Improved gacha luck.',
    icon: 'Star',
    modifiers: [{ type: 'gachaLuck', value: 1.5 }],
  },
  speed_bloom: {
    type: 'speed_bloom',
    name: 'Speed Bloom',
    description: 'Cosmic energy accelerates growth!',
    icon: 'Timer',
    modifiers: [{ type: 'growSpeed', value: 1.5 }],
  },
  rare_migration: {
    type: 'rare_migration',
    name: 'Rare Migration',
    description: 'Rare seeds are passing through the system!',
    icon: 'Sparkles',
    modifiers: [{ type: 'rareRate', value: 2.0 }],
  },
  prestige_gala: {
    type: 'prestige_gala',
    name: 'Prestige Gala',
    description: 'The cosmos rewards experience! Bonus prestige points.',
    icon: 'Crown',
    modifiers: [{ type: 'prestigePoints', value: 1.5 }],
  },
  expedition_rush: {
    type: 'expedition_rush',
    name: 'Expedition Rush',
    description: 'Expeditions move at warp speed!',
    icon: 'Rocket',
    modifiers: [{ type: 'expeditionSpeed', value: 2.0 }],
  },
  cosmic_anomaly: {
    type: 'cosmic_anomaly',
    name: 'Cosmic Anomaly',
    description: 'Strange energies affect the entire system!',
    icon: 'AlertTriangle',
    modifiers: [
      { type: 'production', value: 1.25 },
      { type: 'essenceGain', value: 1.25 },
      { type: 'gachaLuck', value: 1.25 },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Seasonal Events - Longer duration, bigger bonuses
  // ─────────────────────────────────────────────────────────────────────────────
  lunar_new_year: {
    type: 'lunar_new_year',
    name: 'Lunar New Year',
    description: 'Prosperity fills the cosmos! Extra credits from all sources.',
    icon: 'Moon',
    modifiers: [
      { type: 'sellValue', value: 2.0 },
      { type: 'production', value: 1.5 },
    ],
  },
  bloom_festival: {
    type: 'bloom_festival',
    name: 'Bloom Festival',
    description: 'Spring awakens across the galaxy! Accelerated growth everywhere.',
    icon: 'Flower2',
    modifiers: [
      { type: 'growSpeed', value: 2.0 },
      { type: 'rareRate', value: 1.5 },
    ],
  },
  harvest_moon: {
    type: 'harvest_moon',
    name: 'Harvest Moon',
    description: 'The golden harvest moon rises! Maximum production bonuses.',
    icon: 'Sun',
    modifiers: [
      { type: 'production', value: 2.0 },
      { type: 'essenceGain', value: 1.5 },
    ],
  },
  crystal_frost: {
    type: 'crystal_frost',
    name: 'Crystal Frost',
    description: 'Winter crystals sparkle across the cosmos! Enhanced crystal gains.',
    icon: 'Snowflake',
    modifiers: [
      { type: 'crystalDrop', value: 2.5 },
      { type: 'gachaLuck', value: 1.75 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Challenge Generation
// ─────────────────────────────────────────────────────────────────────────────

/** Challenge templates by requirement type */
const CHALLENGE_TEMPLATES: Record<
  EventChallenge['requirement']['type'],
  { base: number; description: (target: number) => string }[]
> = {
  harvest: [
    { base: 50, description: t => `Harvest ${t} plants` },
    { base: 100, description: t => `Harvest ${t} plants` },
    { base: 200, description: t => `Harvest ${t} plants` },
  ],
  sell: [
    { base: 25, description: t => `Sell ${t} plants` },
    { base: 50, description: t => `Sell ${t} plants` },
    { base: 100, description: t => `Sell ${t} plants` },
  ],
  fuse: [
    { base: 5, description: t => `Fuse ${t} seeds` },
    { base: 10, description: t => `Fuse ${t} seeds` },
    { base: 20, description: t => `Fuse ${t} seeds` },
  ],
  gacha: [
    { base: 10, description: t => `Perform ${t} gacha pulls` },
    { base: 20, description: t => `Perform ${t} gacha pulls` },
    { base: 25, description: t => `Perform ${t} gacha pulls` }, // Hard: 100 max (expensive but achievable)
  ],
  prestige: [
    { base: 1, description: t => `Complete ${t} prestige${t > 1 ? 's' : ''}` },
    { base: 2, description: t => `Complete ${t} prestiges` },
  ],
  expedition: [
    { base: 2, description: t => `Complete ${t} expeditions` },
    { base: 3, description: t => `Complete ${t} expeditions` },
    { base: 5, description: t => `Complete ${t} expeditions` }, // Hard: 20 max (achievable in 24-48h)
  ],
};

/** Reward scaling by difficulty */
const REWARD_MULTIPLIERS = {
  easy: 1,
  medium: 2,
  hard: 4,
};

/** Generate a random challenge */
export function generateChallenge(
  type: EventChallenge['requirement']['type'],
  difficulty: 'easy' | 'medium' | 'hard',
  eventId: string
): EventChallenge {
  const templates = CHALLENGE_TEMPLATES[type];
  const difficultyIndex = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2;
  const template = templates[Math.min(difficultyIndex, templates.length - 1)];
  const target = template.base * REWARD_MULTIPLIERS[difficulty];

  const rewardTypes: EventReward['type'][] = ['credits', 'crystals', 'essence'];
  const rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
  const rewardAmount = Math.floor(
    100 * REWARD_MULTIPLIERS[difficulty] * (rewardType === 'crystals' ? 0.25 : 1)
  );

  return {
    id: `${eventId}_challenge_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    description: template.description(target),
    requirement: { type, target },
    progress: 0,
    completed: false,
    reward: { type: rewardType, amount: rewardAmount },
  };
}

/** Generate challenges for an event type */
export function generateChallengesForEvent(
  eventType: EventType,
  eventId: string
): EventChallenge[] {
  // Map event types to relevant challenge types
  const challengeTypesForEvent: Record<EventType, EventChallenge['requirement']['type'][]> = {
    harvest_festival: ['harvest', 'sell'],
    crystal_rain: ['gacha', 'fuse'],
    fusion_frenzy: ['fuse', 'gacha'],
    essence_surge: ['harvest', 'sell'],
    lucky_stars: ['gacha', 'fuse'],
    speed_bloom: ['harvest', 'sell'],
    rare_migration: ['gacha', 'harvest'],
    prestige_gala: ['prestige', 'sell'],
    expedition_rush: ['expedition', 'harvest'],
    cosmic_anomaly: ['gacha', 'harvest', 'expedition'],
    lunar_new_year: ['sell', 'harvest', 'gacha'],
    bloom_festival: ['harvest', 'fuse'],
    harvest_moon: ['harvest', 'sell'],
    crystal_frost: ['gacha', 'fuse'],
  };

  const relevantTypes = challengeTypesForEvent[eventType] || ['harvest', 'sell'];
  const challenges: EventChallenge[] = [];

  // Generate 3 challenges: easy, medium, hard
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

  for (const difficulty of difficulties) {
    const type = relevantTypes[Math.floor(Math.random() * relevantTypes.length)];
    challenges.push(generateChallenge(type, difficulty, eventId));
  }

  return challenges;
}

/** Non-seasonal event types for random selection */
const RANDOM_EVENT_TYPES: EventType[] = [
  'harvest_festival',
  'crystal_rain',
  'fusion_frenzy',
  'essence_surge',
  'lucky_stars',
  'speed_bloom',
  'rare_migration',
  'prestige_gala',
  'expedition_rush',
  'cosmic_anomaly',
];

/** Generate a random event (non-seasonal) */
export function generateRandomEvent(): GameEvent {
  const type = RANDOM_EVENT_TYPES[Math.floor(Math.random() * RANDOM_EVENT_TYPES.length)];
  const durationHours = 12 + Math.floor(Math.random() * 36); // 12-48 hours
  const eventId = `event_${type}_${Date.now()}`;
  const challenges = generateChallengesForEvent(type, eventId);

  return generateEvent(type, durationHours, challenges);
}

/** Generate a seasonal event */
export function generateSeasonalEvent(seasonalWindow: SeasonalEventWindow): GameEvent {
  const eventId = `event_${seasonalWindow.type}_${Date.now()}`;
  const challenges = generateChallengesForEvent(seasonalWindow.type, eventId);

  return generateEvent(
    seasonalWindow.type,
    seasonalWindow.durationDays * 24, // Full seasonal duration
    challenges
  );
}

/**
 * Check if it's time to spawn a new random event
 * @param state Current event state
 * @param lastEventEndTime Timestamp of when the last event ended (or game start)
 * @param minGapHours Minimum hours between events
 */
export function shouldSpawnRandomEvent(
  state: EventState,
  lastEventEndTime: number,
  minGapHours: number = 4
): boolean {
  // Don't spawn if at max active events
  if (state.activeEvents.length >= EVENT_CONFIG.maxActiveEvents) {
    return false;
  }

  // Don't spawn if a non-seasonal event is active
  const hasActiveNonSeasonal = state.activeEvents.some(e => !isSeasonalEvent(e.type));
  if (hasActiveNonSeasonal) {
    return false;
  }

  // Check minimum gap since last event
  const now = Date.now();
  const hoursSinceLastEvent = (now - lastEventEndTime) / (1000 * 60 * 60);

  // Random chance that increases with time since last event
  // After minGapHours, starts at 10% chance per check, increasing over time
  if (hoursSinceLastEvent < minGapHours) {
    return false;
  }

  const baseChance = 0.1; // 10%
  const timeBonus = Math.min(0.3, (hoursSinceLastEvent - minGapHours) * 0.02);
  const chance = baseChance + timeBonus;

  return Math.random() < chance;
}

// ─────────────────────────────────────────────────────────────────────────────
// State Management
// ─────────────────────────────────────────────────────────────────────────────

export function createInitialEventState(): EventState {
  return {
    activeEvents: [],
    completedEventIds: [],
    claimedRewards: {},
    eventHistory: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new event
 */
export function generateEvent(
  type: EventType,
  durationHours: number,
  challenges: EventChallenge[]
): GameEvent {
  const template = EVENT_TEMPLATES[type];
  const now = Date.now();

  return {
    id: `event_${type}_${now}`,
    ...template,
    startTime: now,
    endTime: now + durationHours * 60 * 60 * 1000,
    challenges,
  };
}

/**
 * Start an event
 */
export function startEvent(state: EventState, event: GameEvent): EventState {
  if (state.activeEvents.length >= EVENT_CONFIG.maxActiveEvents) {
    return state;
  }

  return {
    ...state,
    activeEvents: [...state.activeEvents, event],
    claimedRewards: {
      ...state.claimedRewards,
      [event.id]: [],
    },
  };
}

/**
 * End an event
 */
export function endEvent(state: EventState, eventId: string): EventState {
  const event = state.activeEvents.find(e => e.id === eventId);
  if (!event) return state;

  const completedChallenges = event.challenges.filter(c => c.completed).length;

  return {
    ...state,
    activeEvents: state.activeEvents.filter(e => e.id !== eventId),
    completedEventIds: [...state.completedEventIds, eventId],
    eventHistory: [
      ...state.eventHistory,
      {
        eventId: event.id,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        challengesCompleted: completedChallenges,
        totalChallenges: event.challenges.length,
      },
    ],
  };
}

/**
 * Check and end expired events
 */
export function checkExpiredEvents(state: EventState): EventState {
  const now = Date.now();
  let newState = state;

  for (const event of state.activeEvents) {
    if (now >= event.endTime) {
      newState = endEvent(newState, event.id);
    }
  }

  return newState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Challenge Progress
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update challenge progress
 */
export function updateChallengeProgress(
  state: EventState,
  eventId: string,
  challengeId: string,
  progressDelta: number
): EventState {
  const eventIndex = state.activeEvents.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return state;

  const event = state.activeEvents[eventIndex];
  const challengeIndex = event.challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1) return state;

  const challenge = event.challenges[challengeIndex];
  if (challenge.completed) return state;

  const newProgress = Math.min(challenge.progress + progressDelta, challenge.requirement.target);

  const updatedChallenge: EventChallenge = {
    ...challenge,
    progress: newProgress,
    completed: newProgress >= challenge.requirement.target,
  };

  const updatedChallenges = [...event.challenges];
  updatedChallenges[challengeIndex] = updatedChallenge;

  const updatedEvent: GameEvent = {
    ...event,
    challenges: updatedChallenges,
  };

  const updatedEvents = [...state.activeEvents];
  updatedEvents[eventIndex] = updatedEvent;

  return {
    ...state,
    activeEvents: updatedEvents,
  };
}

/**
 * Update all event challenges of a given type across all active events
 * @param state Current event state
 * @param type Challenge requirement type to update
 * @param amount Progress increment
 * @returns Updated state and list of newly completed challenges
 */
export function updateEventChallengesByType(
  state: EventState,
  type: EventChallenge['requirement']['type'],
  amount: number = 1
): { newState: EventState; newlyCompleted: Array<{ eventId: string; challenge: EventChallenge }> } {
  if (amount <= 0 || !Number.isFinite(amount)) {
    return { newState: state, newlyCompleted: [] };
  }

  const newlyCompleted: Array<{ eventId: string; challenge: EventChallenge }> = [];
  let updatedState = state;

  for (const event of state.activeEvents) {
    for (const challenge of event.challenges) {
      if (challenge.requirement.type === type && !challenge.completed) {
        const newProgress = Math.min(challenge.progress + amount, challenge.requirement.target);
        const wasCompleted = challenge.completed;
        const isNowCompleted = newProgress >= challenge.requirement.target;

        if (isNowCompleted && !wasCompleted) {
          newlyCompleted.push({
            eventId: event.id,
            challenge: { ...challenge, progress: newProgress, completed: true },
          });
        }

        // Update the challenge progress
        updatedState = updateChallengeProgress(updatedState, event.id, challenge.id, amount);
      }
    }
  }

  return { newState: updatedState, newlyCompleted };
}

/**
 * Claim a challenge reward
 */
export function claimChallengeReward(
  state: EventState,
  eventId: string,
  challengeId: string
): { newState: EventState; reward: EventReward | null } {
  const event = state.activeEvents.find(e => e.id === eventId);
  if (!event) return { newState: state, reward: null };

  const challenge = event.challenges.find(c => c.id === challengeId);
  if (!challenge || !challenge.completed) return { newState: state, reward: null };

  // Check if already claimed
  const claimed = state.claimedRewards[eventId] || [];
  if (claimed.includes(challengeId)) return { newState: state, reward: null };

  return {
    newState: {
      ...state,
      claimedRewards: {
        ...state.claimedRewards,
        [eventId]: [...claimed, challengeId],
      },
    },
    reward: challenge.reward,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get active event modifiers for a specific type
 */
export function getActiveModifier(state: EventState, modifierType: EventModifier['type']): number {
  let totalModifier = 1.0;

  for (const event of state.activeEvents) {
    for (const mod of event.modifiers) {
      if (mod.type === modifierType) {
        totalModifier *= mod.value;
      }
    }
  }

  return totalModifier;
}

/**
 * Get all active modifiers
 */
export function getAllActiveModifiers(state: EventState): Record<EventModifier['type'], number> {
  const modifiers: Record<EventModifier['type'], number> = {
    production: 1.0,
    sellValue: 1.0,
    crystalDrop: 1.0,
    fusionSuccess: 1.0,
    essenceGain: 1.0,
    gachaLuck: 1.0,
    growSpeed: 1.0,
    rareRate: 1.0,
    prestigePoints: 1.0,
    expeditionSpeed: 1.0,
  };

  for (const event of state.activeEvents) {
    for (const mod of event.modifiers) {
      modifiers[mod.type] *= mod.value;
    }
  }

  return modifiers;
}

/**
 * Check if any event is active
 */
export function hasActiveEvents(state: EventState): boolean {
  return state.activeEvents.length > 0;
}

/**
 * Get time remaining for an event
 */
export function getEventTimeRemaining(event: GameEvent): number {
  return Math.max(0, event.endTime - Date.now());
}

/**
 * Get event progress (challenges completed / total)
 */
export function getEventProgress(event: GameEvent): number {
  if (event.challenges.length === 0) return 1;
  return event.challenges.filter(c => c.completed).length / event.challenges.length;
}

/**
 * Check if event is fully completed
 */
export function isEventFullyCompleted(event: GameEvent): boolean {
  return event.challenges.every(c => c.completed);
}

/**
 * Get unclaimed rewards for an event
 */
export function getUnclaimedRewards(state: EventState, eventId: string): EventChallenge[] {
  const event = state.activeEvents.find(e => e.id === eventId);
  if (!event) return [];

  const claimed = state.claimedRewards[eventId] || [];
  return event.challenges.filter(c => c.completed && !claimed.includes(c.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// GameEngine Compatibility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check for active events and clean up expired ones
 * Called by GameEngine on tick
 */
export function checkForActiveEvent(state: EventState): EventState {
  return checkExpiredEvents(state);
}

/**
 * Get event modifiers as an EventModifiers object
 * Used by GameEngine for production calculations
 */
export function getEventModifiers(state: EventState): EventModifiers {
  const base = getAllActiveModifiers(state);
  return {
    ...base,
    // Aliases for GameEngine compatibility
    productionMultiplier: base.production,
    exportSpeedMultiplier: base.growSpeed, // Use growSpeed as proxy for export speed
  };
}

/**
 * Get info about the first active event (for UI display)
 */
export function getActiveEventInfo(state: EventState): GameEvent | null {
  return state.activeEvents.length > 0 ? state.activeEvents[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seasonal Event Detection
// ─────────────────────────────────────────────────────────────────────────────

export interface SeasonalEventWindow {
  type: EventType;
  name: string;
  startMonth: number; // 0-11
  startDay: number;
  endMonth: number;
  endDay: number;
  durationDays: number; // Default duration if not using fixed window
}

export const SEASONAL_EVENTS: SeasonalEventWindow[] = [
  {
    type: 'lunar_new_year',
    name: 'Lunar New Year',
    startMonth: 1, // February
    startDay: 1,
    endMonth: 1,
    endDay: 14,
    durationDays: 14,
  },
  {
    type: 'bloom_festival',
    name: 'Bloom Festival',
    startMonth: 2, // March
    startDay: 20,
    endMonth: 3, // April
    endDay: 3,
    durationDays: 14,
  },
  {
    type: 'harvest_moon',
    name: 'Harvest Moon',
    startMonth: 8, // September
    startDay: 20,
    endMonth: 9, // October
    endDay: 3,
    durationDays: 14,
  },
  {
    type: 'crystal_frost',
    name: 'Crystal Frost',
    startMonth: 11, // December
    startDay: 15,
    endMonth: 0, // January (next year)
    endDay: 2,
    durationDays: 18,
  },
];

/**
 * Check if a date falls within a seasonal event window
 * Uses UTC to ensure consistent behavior across timezones
 */
export function isInSeasonalWindow(
  eventWindow: SeasonalEventWindow,
  date: Date = new Date()
): boolean {
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Handle year wrap (e.g., Dec 15 - Jan 2)
  if (eventWindow.startMonth > eventWindow.endMonth) {
    return (
      (month === eventWindow.startMonth && day >= eventWindow.startDay) ||
      month > eventWindow.startMonth ||
      month < eventWindow.endMonth ||
      (month === eventWindow.endMonth && day <= eventWindow.endDay)
    );
  }

  // Same year window
  if (month === eventWindow.startMonth && month === eventWindow.endMonth) {
    return day >= eventWindow.startDay && day <= eventWindow.endDay;
  }

  return (
    (month === eventWindow.startMonth && day >= eventWindow.startDay) ||
    (month > eventWindow.startMonth && month < eventWindow.endMonth) ||
    (month === eventWindow.endMonth && day <= eventWindow.endDay)
  );
}

/**
 * Get the currently active seasonal event (if any)
 */
export function getCurrentSeasonalEvent(date: Date = new Date()): SeasonalEventWindow | null {
  return SEASONAL_EVENTS.find(event => isInSeasonalWindow(event, date)) || null;
}

/**
 * Check if a seasonal event is already active in state
 */
export function hasSeasonalEventActive(state: EventState, seasonalType: EventType): boolean {
  return state.activeEvents.some(e => e.type === seasonalType);
}

/**
 * Get time remaining in seasonal window (for display)
 * Uses UTC for consistent behavior across timezones
 */
export function getSeasonalTimeRemaining(
  eventWindow: SeasonalEventWindow,
  date: Date = new Date()
): number {
  const endDate = new Date(
    Date.UTC(date.getUTCFullYear(), eventWindow.endMonth, eventWindow.endDay, 23, 59, 59)
  );

  // Handle year wrap
  if (
    eventWindow.startMonth > eventWindow.endMonth &&
    date.getUTCMonth() >= eventWindow.startMonth
  ) {
    endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);
  }

  return Math.max(0, endDate.getTime() - date.getTime());
}

/**
 * Check if an event type is a seasonal event
 */
export function isSeasonalEvent(type: EventType): boolean {
  return ['lunar_new_year', 'bloom_festival', 'harvest_moon', 'crystal_frost'].includes(type);
}
