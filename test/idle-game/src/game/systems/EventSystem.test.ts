/**
 * Event System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialEventState,
  generateEvent,
  startEvent,
  endEvent,
  checkExpiredEvents,
  updateChallengeProgress,
  updateEventChallengesByType,
  claimChallengeReward,
  getActiveModifier,
  getAllActiveModifiers,
  hasActiveEvents,
  getEventTimeRemaining,
  getEventProgress,
  isEventFullyCompleted,
  getUnclaimedRewards,
  getCurrentSeasonalEvent,
  isSeasonalEvent,
  isInSeasonalWindow,
  hasSeasonalEventActive,
  getSeasonalTimeRemaining,
  generateChallenge,
  generateChallengesForEvent,
  generateRandomEvent,
  generateSeasonalEvent,
  shouldSpawnRandomEvent,
  SEASONAL_EVENTS,
  EVENT_CONFIG,
  EVENT_TEMPLATES,
  EventState,
  GameEvent,
  EventChallenge,
} from './EventSystem';

// Helper to create a test challenge
function createTestChallenge(overrides: Partial<EventChallenge> = {}): EventChallenge {
  return {
    id: 'test-challenge-1',
    description: 'Test challenge',
    requirement: { type: 'harvest', target: 100 },
    progress: 0,
    completed: false,
    reward: { type: 'credits', amount: 1000 },
    ...overrides,
  };
}

// Helper to create a test event
function createTestEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  const now = Date.now();
  return {
    id: 'test-event',
    type: 'harvest_festival',
    name: 'Test Event',
    description: 'Test description',
    icon: 'Wheat',
    startTime: now,
    endTime: now + 24 * 60 * 60 * 1000,
    modifiers: [{ type: 'production', value: 1.5 }],
    challenges: [createTestChallenge()],
    ...overrides,
  };
}

describe('EventSystem', () => {
  let state: EventState;

  beforeEach(() => {
    state = createInitialEventState();
  });

  describe('createInitialEventState', () => {
    it('should create empty event state', () => {
      expect(state.activeEvents).toEqual([]);
      expect(state.completedEventIds).toEqual([]);
      expect(state.claimedRewards).toEqual({});
      expect(state.eventHistory).toEqual([]);
    });
  });

  describe('generateEvent', () => {
    it('should generate event from template', () => {
      const challenges = [createTestChallenge()];
      const event = generateEvent('harvest_festival', 24, challenges);

      expect(event.type).toBe('harvest_festival');
      expect(event.name).toBe('Harvest Festival');
      expect(event.challenges).toEqual(challenges);
      expect(event.endTime - event.startTime).toBe(24 * 60 * 60 * 1000);
    });

    it('should include template modifiers', () => {
      const event = generateEvent('harvest_festival', 24, []);

      expect(event.modifiers.length).toBeGreaterThan(0);
      expect(event.modifiers[0].type).toBe('production');
    });
  });

  describe('startEvent', () => {
    it('should add event to active events', () => {
      const event = createTestEvent();
      const newState = startEvent(state, event);

      expect(newState.activeEvents).toHaveLength(1);
      expect(newState.activeEvents[0].id).toBe(event.id);
    });

    it('should initialize claimed rewards for event', () => {
      const event = createTestEvent();
      const newState = startEvent(state, event);

      expect(newState.claimedRewards[event.id]).toEqual([]);
    });

    it('should not exceed max active events', () => {
      let currentState = state;

      // Fill to max
      for (let i = 0; i < EVENT_CONFIG.maxActiveEvents; i++) {
        const event = createTestEvent({ id: `event-${i}` });
        currentState = startEvent(currentState, event);
      }

      // Try to add one more
      const extraEvent = createTestEvent({ id: 'extra-event' });
      const finalState = startEvent(currentState, extraEvent);

      expect(finalState.activeEvents.length).toBe(EVENT_CONFIG.maxActiveEvents);
      expect(finalState.activeEvents.find(e => e.id === 'extra-event')).toBeUndefined();
    });
  });

  describe('endEvent', () => {
    it('should remove event from active events', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = endEvent(state, event.id);

      expect(newState.activeEvents).toHaveLength(0);
    });

    it('should add to completed events', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = endEvent(state, event.id);

      expect(newState.completedEventIds).toContain(event.id);
    });

    it('should add to event history', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = endEvent(state, event.id);

      expect(newState.eventHistory).toHaveLength(1);
      expect(newState.eventHistory[0].eventId).toBe(event.id);
      expect(newState.eventHistory[0].type).toBe(event.type);
    });

    it('should track completed challenges in history', () => {
      const completedChallenge = createTestChallenge({ completed: true });
      const event = createTestEvent({ challenges: [completedChallenge, createTestChallenge()] });
      state = startEvent(state, event);

      const newState = endEvent(state, event.id);

      expect(newState.eventHistory[0].challengesCompleted).toBe(1);
      expect(newState.eventHistory[0].totalChallenges).toBe(2);
    });

    it('should do nothing for non-existent event', () => {
      const newState = endEvent(state, 'non-existent');
      expect(newState).toBe(state);
    });
  });

  describe('checkExpiredEvents', () => {
    it('should end expired events', () => {
      const pastEvent = createTestEvent({
        id: 'expired',
        endTime: Date.now() - 1000, // Already ended
      });
      state = startEvent(state, pastEvent);

      const newState = checkExpiredEvents(state);

      expect(newState.activeEvents).toHaveLength(0);
      expect(newState.completedEventIds).toContain('expired');
    });

    it('should keep active events', () => {
      const futureEvent = createTestEvent({
        id: 'active',
        endTime: Date.now() + 1000000, // Still active
      });
      state = startEvent(state, futureEvent);

      const newState = checkExpiredEvents(state);

      expect(newState.activeEvents).toHaveLength(1);
    });
  });

  describe('updateChallengeProgress', () => {
    it('should update challenge progress', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = updateChallengeProgress(state, event.id, 'test-challenge-1', 50);

      const challenge = newState.activeEvents[0].challenges[0];
      expect(challenge.progress).toBe(50);
    });

    it('should mark challenge as completed when target reached', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = updateChallengeProgress(state, event.id, 'test-challenge-1', 100);

      const challenge = newState.activeEvents[0].challenges[0];
      expect(challenge.completed).toBe(true);
    });

    it('should not exceed target', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const newState = updateChallengeProgress(state, event.id, 'test-challenge-1', 200);

      const challenge = newState.activeEvents[0].challenges[0];
      expect(challenge.progress).toBe(100);
    });

    it('should not update completed challenge', () => {
      const completedChallenge = createTestChallenge({
        progress: 100,
        completed: true,
      });
      const event = createTestEvent({ challenges: [completedChallenge] });
      state = startEvent(state, event);

      const newState = updateChallengeProgress(state, event.id, 'test-challenge-1', 50);

      expect(newState).toBe(state);
    });
  });

  describe('claimChallengeReward', () => {
    it('should return reward for completed challenge', () => {
      const completedChallenge = createTestChallenge({
        progress: 100,
        completed: true,
        reward: { type: 'credits', amount: 1000 },
      });
      const event = createTestEvent({ challenges: [completedChallenge] });
      state = startEvent(state, event);

      const { newState, reward } = claimChallengeReward(state, event.id, 'test-challenge-1');

      expect(reward).not.toBeNull();
      expect(reward!.type).toBe('credits');
      expect(reward!.amount).toBe(1000);
      expect(newState.claimedRewards[event.id]).toContain('test-challenge-1');
    });

    it('should not allow double claim', () => {
      const completedChallenge = createTestChallenge({
        progress: 100,
        completed: true,
      });
      const event = createTestEvent({ challenges: [completedChallenge] });
      state = startEvent(state, event);

      // First claim
      const { newState: stateAfterFirst } = claimChallengeReward(
        state,
        event.id,
        'test-challenge-1'
      );

      // Second claim attempt
      const { reward } = claimChallengeReward(stateAfterFirst, event.id, 'test-challenge-1');

      expect(reward).toBeNull();
    });

    it('should not claim incomplete challenge', () => {
      const event = createTestEvent();
      state = startEvent(state, event);

      const { reward } = claimChallengeReward(state, event.id, 'test-challenge-1');

      expect(reward).toBeNull();
    });
  });

  describe('getActiveModifier', () => {
    it('should return 1 with no active events', () => {
      const modifier = getActiveModifier(state, 'production');
      expect(modifier).toBe(1.0);
    });

    it('should return modifier value from active event', () => {
      const event = createTestEvent({
        modifiers: [{ type: 'production', value: 1.5 }],
        endTime: Date.now() + 100000,
      });
      state = startEvent(state, event);

      const modifier = getActiveModifier(state, 'production');
      expect(modifier).toBe(1.5);
    });

    it('should multiply modifiers from multiple events', () => {
      const event1 = createTestEvent({
        id: 'event1',
        modifiers: [{ type: 'production', value: 1.5 }],
        endTime: Date.now() + 100000,
      });
      const event2 = createTestEvent({
        id: 'event2',
        modifiers: [{ type: 'production', value: 2.0 }],
        endTime: Date.now() + 100000,
      });
      state = startEvent(state, event1);
      state = startEvent(state, event2);

      const modifier = getActiveModifier(state, 'production');
      expect(modifier).toBe(3.0); // 1.5 * 2.0
    });
  });

  describe('getAllActiveModifiers', () => {
    it('should return all modifier types with default values', () => {
      const modifiers = getAllActiveModifiers(state);

      expect(modifiers.production).toBe(1.0);
      expect(modifiers.sellValue).toBe(1.0);
      expect(modifiers.gachaLuck).toBe(1.0);
      expect(modifiers.expeditionSpeed).toBe(1.0);
    });

    it('should include active event modifiers', () => {
      const event = createTestEvent({
        modifiers: [
          { type: 'production', value: 1.5 },
          { type: 'sellValue', value: 1.25 },
        ],
        endTime: Date.now() + 100000,
      });
      state = startEvent(state, event);

      const modifiers = getAllActiveModifiers(state);

      expect(modifiers.production).toBe(1.5);
      expect(modifiers.sellValue).toBe(1.25);
      expect(modifiers.gachaLuck).toBe(1.0); // Unchanged
    });
  });

  describe('hasActiveEvents', () => {
    it('should return false with no events', () => {
      expect(hasActiveEvents(state)).toBe(false);
    });

    it('should return true with active event', () => {
      state = startEvent(state, createTestEvent());
      expect(hasActiveEvents(state)).toBe(true);
    });
  });

  describe('getEventTimeRemaining', () => {
    it('should return positive time for future end', () => {
      const futureEnd = Date.now() + 5000;
      const event = createTestEvent({ endTime: futureEnd });

      const remaining = getEventTimeRemaining(event);

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(5000);
    });

    it('should return 0 for past end', () => {
      const pastEnd = Date.now() - 1000;
      const event = createTestEvent({ endTime: pastEnd });

      const remaining = getEventTimeRemaining(event);

      expect(remaining).toBe(0);
    });
  });

  describe('getEventProgress', () => {
    it('should return 1 for event with no challenges', () => {
      const event = createTestEvent({ challenges: [] });
      expect(getEventProgress(event)).toBe(1);
    });

    it('should return 0 for event with no completed challenges', () => {
      const event = createTestEvent({
        challenges: [createTestChallenge(), createTestChallenge({ id: 'c2' })],
      });
      expect(getEventProgress(event)).toBe(0);
    });

    it('should return correct progress', () => {
      const event = createTestEvent({
        challenges: [
          createTestChallenge({ id: 'c1', completed: true }),
          createTestChallenge({ id: 'c2', completed: false }),
          createTestChallenge({ id: 'c3', completed: true }),
          createTestChallenge({ id: 'c4', completed: false }),
        ],
      });
      expect(getEventProgress(event)).toBe(0.5);
    });
  });

  describe('isEventFullyCompleted', () => {
    it('should return true when all challenges completed', () => {
      const event = createTestEvent({
        challenges: [
          createTestChallenge({ id: 'c1', completed: true }),
          createTestChallenge({ id: 'c2', completed: true }),
        ],
      });
      expect(isEventFullyCompleted(event)).toBe(true);
    });

    it('should return false when some challenges incomplete', () => {
      const event = createTestEvent({
        challenges: [
          createTestChallenge({ id: 'c1', completed: true }),
          createTestChallenge({ id: 'c2', completed: false }),
        ],
      });
      expect(isEventFullyCompleted(event)).toBe(false);
    });

    it('should return true for event with no challenges', () => {
      const event = createTestEvent({ challenges: [] });
      expect(isEventFullyCompleted(event)).toBe(true);
    });
  });

  describe('getUnclaimedRewards', () => {
    it('should return unclaimed completed challenges', () => {
      const completedChallenge = createTestChallenge({
        id: 'completed',
        completed: true,
      });
      const incompleteChallenge = createTestChallenge({
        id: 'incomplete',
        completed: false,
      });
      const event = createTestEvent({
        challenges: [completedChallenge, incompleteChallenge],
      });
      state = startEvent(state, event);

      const unclaimed = getUnclaimedRewards(state, event.id);

      expect(unclaimed).toHaveLength(1);
      expect(unclaimed[0].id).toBe('completed');
    });

    it('should not include already claimed challenges', () => {
      const completedChallenge = createTestChallenge({
        id: 'completed',
        completed: true,
      });
      const event = createTestEvent({ challenges: [completedChallenge] });
      state = startEvent(state, event);

      // Claim the reward
      const { newState } = claimChallengeReward(state, event.id, 'completed');

      const unclaimed = getUnclaimedRewards(newState, event.id);

      expect(unclaimed).toHaveLength(0);
    });
  });

  describe('EVENT_TEMPLATES', () => {
    it('should have all event templates defined', () => {
      expect(EVENT_TEMPLATES.harvest_festival).toBeDefined();
      expect(EVENT_TEMPLATES.crystal_rain).toBeDefined();
      expect(EVENT_TEMPLATES.fusion_frenzy).toBeDefined();
      expect(EVENT_TEMPLATES.essence_surge).toBeDefined();
      expect(EVENT_TEMPLATES.lucky_stars).toBeDefined();
    });

    it('should have valid modifiers for each template', () => {
      for (const template of Object.values(EVENT_TEMPLATES)) {
        expect(template.modifiers.length).toBeGreaterThan(0);
        for (const mod of template.modifiers) {
          expect(mod.value).toBeGreaterThan(0);
        }
      }
    });

    it('should have name and description for each template', () => {
      for (const template of Object.values(EVENT_TEMPLATES)) {
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.icon).toBeTruthy();
      }
    });

    it('should have seasonal event templates', () => {
      expect(EVENT_TEMPLATES.lunar_new_year).toBeDefined();
      expect(EVENT_TEMPLATES.bloom_festival).toBeDefined();
      expect(EVENT_TEMPLATES.harvest_moon).toBeDefined();
      expect(EVENT_TEMPLATES.crystal_frost).toBeDefined();
    });
  });

  describe('Seasonal Events', () => {
    it('should detect Lunar New Year in February', () => {
      const feb5 = new Date('2025-02-05T12:00:00Z');
      const event = getCurrentSeasonalEvent(feb5);
      expect(event?.type).toBe('lunar_new_year');
    });

    it('should detect Bloom Festival in late March', () => {
      const mar25 = new Date('2025-03-25T12:00:00Z');
      const event = getCurrentSeasonalEvent(mar25);
      expect(event?.type).toBe('bloom_festival');
    });

    it('should detect Harvest Moon in late September', () => {
      const sep25 = new Date('2025-09-25T12:00:00Z');
      const event = getCurrentSeasonalEvent(sep25);
      expect(event?.type).toBe('harvest_moon');
    });

    it('should detect Crystal Frost in December', () => {
      const dec20 = new Date('2025-12-20T12:00:00Z');
      const event = getCurrentSeasonalEvent(dec20);
      expect(event?.type).toBe('crystal_frost');
    });

    it('should detect Crystal Frost in early January', () => {
      const jan1 = new Date('2025-01-01T12:00:00Z');
      const event = getCurrentSeasonalEvent(jan1);
      expect(event?.type).toBe('crystal_frost');
    });

    it('should return null outside seasonal windows', () => {
      const may15 = new Date('2025-05-15T12:00:00Z');
      const event = getCurrentSeasonalEvent(may15);
      expect(event).toBeNull();
    });

    it('should correctly identify seasonal event types', () => {
      expect(isSeasonalEvent('lunar_new_year')).toBe(true);
      expect(isSeasonalEvent('bloom_festival')).toBe(true);
      expect(isSeasonalEvent('harvest_moon')).toBe(true);
      expect(isSeasonalEvent('crystal_frost')).toBe(true);
      expect(isSeasonalEvent('harvest_festival')).toBe(false);
      expect(isSeasonalEvent('crystal_rain')).toBe(false);
    });

    it('should check if seasonal event is in window', () => {
      const lunarWindow = SEASONAL_EVENTS.find(e => e.type === 'lunar_new_year')!;
      expect(isInSeasonalWindow(lunarWindow, new Date('2025-02-05'))).toBe(true);
      expect(isInSeasonalWindow(lunarWindow, new Date('2025-02-20'))).toBe(false);
    });

    it('should handle year-wrapping windows (Crystal Frost)', () => {
      const frostWindow = SEASONAL_EVENTS.find(e => e.type === 'crystal_frost')!;
      expect(isInSeasonalWindow(frostWindow, new Date('2025-12-20'))).toBe(true);
      expect(isInSeasonalWindow(frostWindow, new Date('2026-01-01'))).toBe(true);
      expect(isInSeasonalWindow(frostWindow, new Date('2025-12-10'))).toBe(false);
      expect(isInSeasonalWindow(frostWindow, new Date('2025-01-10'))).toBe(false);
    });

    // Boundary day tests
    it('should detect first day of Lunar New Year', () => {
      const feb1 = new Date('2025-02-01T00:00:00Z');
      const event = getCurrentSeasonalEvent(feb1);
      expect(event?.type).toBe('lunar_new_year');
    });

    it('should detect last day of Lunar New Year', () => {
      const feb14 = new Date('2025-02-14T23:59:59Z');
      const event = getCurrentSeasonalEvent(feb14);
      expect(event?.type).toBe('lunar_new_year');
    });

    it('should not detect Lunar New Year on Feb 15', () => {
      const feb15 = new Date('2025-02-15T00:00:00Z');
      const event = getCurrentSeasonalEvent(feb15);
      expect(event).toBeNull();
    });

    it('should detect last day of Crystal Frost (Jan 2)', () => {
      const jan2 = new Date('2025-01-02T23:59:59Z');
      const event = getCurrentSeasonalEvent(jan2);
      expect(event?.type).toBe('crystal_frost');
    });

    it('should not detect Crystal Frost on Jan 3', () => {
      const jan3 = new Date('2025-01-03T00:00:00Z');
      const event = getCurrentSeasonalEvent(jan3);
      expect(event).toBeNull();
    });

    // hasSeasonalEventActive tests
    it('should return true if seasonal event is active in state', () => {
      const lunarEvent = createTestEvent({
        type: 'lunar_new_year',
        endTime: Date.now() + 100000,
      });
      state = startEvent(state, lunarEvent);

      expect(hasSeasonalEventActive(state, 'lunar_new_year')).toBe(true);
    });

    it('should return false if seasonal event is not active', () => {
      expect(hasSeasonalEventActive(state, 'lunar_new_year')).toBe(false);
    });

    // getSeasonalTimeRemaining tests
    it('should calculate time remaining for same-year event', () => {
      const lunarWindow = SEASONAL_EVENTS.find(e => e.type === 'lunar_new_year')!;
      const feb5 = new Date('2025-02-05T12:00:00Z');
      const remaining = getSeasonalTimeRemaining(lunarWindow, feb5);

      // Should be roughly 9 days (Feb 5 to Feb 14 end of day)
      expect(remaining).toBeGreaterThan(8 * 24 * 60 * 60 * 1000);
      expect(remaining).toBeLessThan(10 * 24 * 60 * 60 * 1000);
    });

    it('should calculate time remaining for year-wrap event in December', () => {
      const frostWindow = SEASONAL_EVENTS.find(e => e.type === 'crystal_frost')!;
      const dec20 = new Date('2025-12-20T12:00:00Z');
      const remaining = getSeasonalTimeRemaining(frostWindow, dec20);

      // Should be roughly 13 days (Dec 20 to Jan 2 next year)
      expect(remaining).toBeGreaterThan(12 * 24 * 60 * 60 * 1000);
      expect(remaining).toBeLessThan(14 * 24 * 60 * 60 * 1000);
    });

    it('should calculate time remaining for year-wrap event in January', () => {
      const frostWindow = SEASONAL_EVENTS.find(e => e.type === 'crystal_frost')!;
      const jan1 = new Date('2025-01-01T12:00:00Z');
      const remaining = getSeasonalTimeRemaining(frostWindow, jan1);

      // Should be roughly 1.5 days (Jan 1 noon to Jan 2 end of day)
      expect(remaining).toBeGreaterThan(1 * 24 * 60 * 60 * 1000);
      expect(remaining).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Challenge Generation', () => {
    describe('generateChallenge', () => {
      it('should create a challenge with correct structure', () => {
        const challenge = generateChallenge('harvest', 'easy', 'test-event');

        expect(challenge).toHaveProperty('id');
        expect(challenge).toHaveProperty('description');
        expect(challenge).toHaveProperty('requirement');
        expect(challenge).toHaveProperty('progress', 0);
        expect(challenge).toHaveProperty('completed', false);
        expect(challenge).toHaveProperty('reward');
        expect(challenge.requirement.type).toBe('harvest');
        expect(challenge.requirement.target).toBeGreaterThan(0);
      });

      it('should scale difficulty appropriately', () => {
        const easy = generateChallenge('harvest', 'easy', 'test');
        const medium = generateChallenge('harvest', 'medium', 'test');
        const hard = generateChallenge('harvest', 'hard', 'test');

        expect(medium.requirement.target).toBeGreaterThan(easy.requirement.target);
        expect(hard.requirement.target).toBeGreaterThan(medium.requirement.target);
      });

      it('should generate valid rewards', () => {
        const challenge = generateChallenge('sell', 'medium', 'test-event');

        expect(['credits', 'crystals', 'essence']).toContain(challenge.reward.type);
        expect(challenge.reward.amount).toBeGreaterThan(0);
      });

      it('should generate unique IDs', () => {
        const challenge1 = generateChallenge('harvest', 'easy', 'test');
        const challenge2 = generateChallenge('harvest', 'easy', 'test');

        expect(challenge1.id).not.toBe(challenge2.id);
      });

      it('should handle all challenge types', () => {
        const types: Array<'harvest' | 'sell' | 'fuse' | 'gacha' | 'prestige' | 'expedition'> = [
          'harvest',
          'sell',
          'fuse',
          'gacha',
          'prestige',
          'expedition',
        ];

        for (const type of types) {
          const challenge = generateChallenge(type, 'medium', 'test');
          expect(challenge.requirement.type).toBe(type);
          expect(challenge.description).toBeTruthy();
        }
      });

      it('should handle prestige hard difficulty falling back to max template', () => {
        // Prestige only has 2 templates (easy=1, medium=2)
        // Hard (index 2) should fall back to medium template (index 1)
        const challenge = generateChallenge('prestige', 'hard', 'test');
        // Template base is 2, multiplied by hard difficulty (4x) = 8
        expect(challenge.requirement.target).toBe(8);
        expect(challenge.description).toContain('8');
      });

      it('should have achievable expedition targets', () => {
        const easy = generateChallenge('expedition', 'easy', 'test');
        const medium = generateChallenge('expedition', 'medium', 'test');
        const hard = generateChallenge('expedition', 'hard', 'test');

        // Expeditions should be achievable in 24-48h
        // Easy: 2*1=2, Medium: 3*2=6, Hard: 5*4=20
        expect(easy.requirement.target).toBe(2);
        expect(medium.requirement.target).toBe(6);
        expect(hard.requirement.target).toBe(20);
      });

      it('should have achievable gacha targets', () => {
        const hard = generateChallenge('gacha', 'hard', 'test');
        // Gacha hard: 25*4=100 pulls (expensive but achievable)
        expect(hard.requirement.target).toBe(100);
      });
    });

    describe('generateChallengesForEvent', () => {
      it('should generate 3 challenges (easy, medium, hard)', () => {
        const challenges = generateChallengesForEvent('harvest_festival', 'test-event');

        expect(challenges).toHaveLength(3);
      });

      it('should generate relevant challenges for event type', () => {
        const harvestChallenges = generateChallengesForEvent('harvest_festival', 'test');
        const gachaChallenges = generateChallengesForEvent('crystal_rain', 'test');

        // Harvest festival should have harvest or sell challenges
        const harvestTypes = harvestChallenges.map(c => c.requirement.type);
        expect(harvestTypes.some(t => t === 'harvest' || t === 'sell')).toBe(true);

        // Crystal rain should have gacha or fuse challenges
        const gachaTypes = gachaChallenges.map(c => c.requirement.type);
        expect(gachaTypes.some(t => t === 'gacha' || t === 'fuse')).toBe(true);
      });

      it('should generate challenges for all event types', () => {
        const eventTypes = [
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
          'lunar_new_year',
          'bloom_festival',
          'harvest_moon',
          'crystal_frost',
        ] as const;

        for (const eventType of eventTypes) {
          const challenges = generateChallengesForEvent(eventType, `${eventType}-test`);
          expect(challenges).toHaveLength(3);
          challenges.forEach(c => {
            expect(c.id).toContain(eventType);
          });
        }
      });
    });
  });

  describe('updateEventChallengesByType', () => {
    it('should update all matching challenges across events', () => {
      let state = createInitialEventState();

      // Create two events with harvest challenges
      const event1 = createTestEvent({
        id: 'event-1',
        challenges: [
          createTestChallenge({ id: 'c1', requirement: { type: 'harvest', target: 100 } }),
          createTestChallenge({ id: 'c2', requirement: { type: 'sell', target: 50 } }),
        ],
      });
      const event2 = createTestEvent({
        id: 'event-2',
        challenges: [
          createTestChallenge({ id: 'c3', requirement: { type: 'harvest', target: 200 } }),
        ],
      });

      state = startEvent(state, event1);
      state = startEvent(state, event2);

      // Update harvest progress
      const result = updateEventChallengesByType(state, 'harvest', 50);

      // Both harvest challenges should be updated
      const e1 = result.newState.activeEvents.find(e => e.id === 'event-1')!;
      const e2 = result.newState.activeEvents.find(e => e.id === 'event-2')!;

      expect(e1.challenges[0].progress).toBe(50);
      expect(e1.challenges[1].progress).toBe(0); // Sell challenge unchanged
      expect(e2.challenges[0].progress).toBe(50);
    });

    it('should track newly completed challenges', () => {
      let state = createInitialEventState();

      const event = createTestEvent({
        id: 'event-1',
        challenges: [
          createTestChallenge({ id: 'c1', requirement: { type: 'harvest', target: 10 } }),
        ],
      });

      state = startEvent(state, event);

      const result = updateEventChallengesByType(state, 'harvest', 15);

      expect(result.newlyCompleted).toHaveLength(1);
      expect(result.newlyCompleted[0].eventId).toBe('event-1');
      expect(result.newlyCompleted[0].challenge.id).toBe('c1');
      expect(result.newlyCompleted[0].challenge.completed).toBe(true);
    });

    it('should not update already completed challenges', () => {
      let state = createInitialEventState();

      const event = createTestEvent({
        id: 'event-1',
        challenges: [
          createTestChallenge({
            id: 'c1',
            requirement: { type: 'harvest', target: 10 },
            progress: 10,
            completed: true,
          }),
        ],
      });

      state = startEvent(state, event);

      const result = updateEventChallengesByType(state, 'harvest', 50);

      expect(result.newlyCompleted).toHaveLength(0);
      const challenge = result.newState.activeEvents[0].challenges[0];
      expect(challenge.progress).toBe(10); // Unchanged
    });

    it('should return empty result for invalid amounts', () => {
      let state = createInitialEventState();

      const event = createTestEvent({
        id: 'event-1',
        challenges: [
          createTestChallenge({ id: 'c1', requirement: { type: 'harvest', target: 100 } }),
        ],
      });

      state = startEvent(state, event);

      const result1 = updateEventChallengesByType(state, 'harvest', 0);
      const result2 = updateEventChallengesByType(state, 'harvest', -5);

      expect(result1.newState).toBe(state);
      expect(result2.newState).toBe(state);
    });

    it('should handle empty state', () => {
      const state = createInitialEventState();
      const result = updateEventChallengesByType(state, 'harvest', 10);

      expect(result.newState).toBe(state);
      expect(result.newlyCompleted).toHaveLength(0);
    });
  });

  describe('Random Event Generation', () => {
    describe('generateRandomEvent', () => {
      it('should create a valid event', () => {
        const event = generateRandomEvent();

        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('icon');
        expect(event).toHaveProperty('startTime');
        expect(event).toHaveProperty('endTime');
        expect(event).toHaveProperty('modifiers');
        expect(event).toHaveProperty('challenges');
      });

      it('should have valid duration (12-48 hours)', () => {
        const event = generateRandomEvent();
        const durationMs = event.endTime - event.startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        expect(durationHours).toBeGreaterThanOrEqual(12);
        expect(durationHours).toBeLessThanOrEqual(48);
      });

      it('should not generate seasonal event types', () => {
        const seasonalTypes = ['lunar_new_year', 'bloom_festival', 'harvest_moon', 'crystal_frost'];

        // Generate many events to check
        for (let i = 0; i < 20; i++) {
          const event = generateRandomEvent();
          expect(seasonalTypes).not.toContain(event.type);
        }
      });

      it('should generate 3 challenges', () => {
        const event = generateRandomEvent();
        expect(event.challenges).toHaveLength(3);
      });
    });

    describe('generateSeasonalEvent', () => {
      it('should create event from seasonal window', () => {
        const lunarNewYear = SEASONAL_EVENTS.find(
          (e: { type: string }) => e.type === 'lunar_new_year'
        );
        const event = generateSeasonalEvent(lunarNewYear);

        expect(event.type).toBe('lunar_new_year');
        expect(event.name).toBeTruthy();
        expect(event.challenges).toHaveLength(3);
      });

      it('should set duration based on seasonal window', () => {
        const lunarNewYear = SEASONAL_EVENTS.find(
          (e: { type: string }) => e.type === 'lunar_new_year'
        );
        const event = generateSeasonalEvent(lunarNewYear);
        const durationMs = event.endTime - event.startTime;
        const durationDays = durationMs / (1000 * 60 * 60 * 24);

        // Lunar New Year is 14 days
        expect(durationDays).toBe(lunarNewYear.durationDays);
      });
    });

    describe('shouldSpawnRandomEvent', () => {
      it('should not spawn if max active events reached', () => {
        const state = createInitialEventState();
        state.activeEvents = [createTestEvent(), createTestEvent(), createTestEvent()];
        const lastEventEnd = Date.now() - 8 * 60 * 60 * 1000; // 8 hours ago

        // Mock Math.random to always return 0 (would normally trigger)
        const originalRandom = Math.random;
        Math.random = () => 0;

        const should = shouldSpawnRandomEvent(state, lastEventEnd);
        expect(should).toBe(false);

        Math.random = originalRandom;
      });

      it('should not spawn if non-seasonal event already active', () => {
        const state = createInitialEventState();
        state.activeEvents = [createTestEvent({ type: 'harvest_festival' })];
        const lastEventEnd = Date.now() - 8 * 60 * 60 * 1000;

        const originalRandom = Math.random;
        Math.random = () => 0;

        const should = shouldSpawnRandomEvent(state, lastEventEnd);
        expect(should).toBe(false);

        Math.random = originalRandom;
      });

      it('should not spawn within minimum gap', () => {
        const state = createInitialEventState();
        const lastEventEnd = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago (less than 4 hour default gap)

        const originalRandom = Math.random;
        Math.random = () => 0;

        const should = shouldSpawnRandomEvent(state, lastEventEnd, 4);
        expect(should).toBe(false);

        Math.random = originalRandom;
      });

      it('should spawn with 100% chance after long gap', () => {
        const state = createInitialEventState();
        const lastEventEnd = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

        const originalRandom = Math.random;
        Math.random = () => 0.3; // Below the max 40% (10% base + 30% time bonus)

        const should = shouldSpawnRandomEvent(state, lastEventEnd, 4);
        expect(should).toBe(true);

        Math.random = originalRandom;
      });

      it('should allow seasonal event to coexist', () => {
        const state = createInitialEventState();
        state.activeEvents = [createTestEvent({ type: 'lunar_new_year' })]; // Seasonal
        const lastEventEnd = Date.now() - 8 * 60 * 60 * 1000;

        const originalRandom = Math.random;
        Math.random = () => 0; // Low roll should trigger

        const should = shouldSpawnRandomEvent(state, lastEventEnd, 4);
        expect(should).toBe(true);

        Math.random = originalRandom;
      });
    });
  });
});
