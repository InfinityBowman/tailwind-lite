/**
 * Event Bus - Pub/Sub system for game events
 * Allows decoupled communication between systems
 */

export type GameEventType =
  | 'stateChanged'
  | 'resourceCollected'
  | 'gachaPull'
  | 'gachaMultiPull'
  | 'premiumPull'
  | 'premiumMultiPull'
  | 'seedFused'
  | 'seedScrapped'
  | 'seedPlanted'
  | 'seedRemoved'
  | 'planetUpgraded'
  | 'planetUnlocked'
  | 'gameSaved'
  | 'gameLoaded'
  | 'researchUnlocked'
  | 'plantsRefined'
  | 'allPlantsRefined'
  | 'prestiged'
  | 'prestigeBonusPurchased'
  | 'questProgress'
  | 'questCompleted'
  | 'questClaimed'
  | 'questSell'
  | 'questCreditsEarned'
  | 'achievementUnlocked'
  | 'achievementClaimed'
  | 'essencePurchased'
  | 'timeSkip'
  | 'mysteriousBonusChanged'
  | 'eventStarted'
  | 'eventEnded'
  | 'eventChallengeCompleted'
  | 'bumperHarvest'
  | 'anomalySpawned'
  | 'anomalyExpired'
  | 'anomalyCollected'
  | 'luckyStarExpired'
  | 'expeditionLaunched'
  | 'expeditionCompleted'
  | 'expeditionCancelled'
  | 'challengeCompleted'
  | 'dailyChallengesAllComplete'
  | 'challengeRewardClaimed'
  | 'transcended'
  | 'transcendenceBonusPurchased'
  | 'plantsExtracted'
  | 'itemCrafted'
  | 'boosterApplied'
  | 'boosterExpired'
  | 'masteryLevelUp'
  | 'masteryPoolCheckpoint'
  | 'equipmentEquipped'
  | 'equipmentUnequipped'
  | 'modInstalled'
  | 'modUninstalled'
  | 'supplyConsumed'
  | 'breedingStarted'
  | 'breedingCompleted'
  | 'breedingCancelled'
  | 'contractsRefreshed'
  | 'contractCompleted'
  | 'contractRewardClaimed'
  | 'contractsAllClaimed'
  | 'seedexNewSeed'
  | 'seedexNewTier'
  | 'seedexHighestTier'
  | 'seedexRewardClaimed'
  | 'resourcesSold'
  | 'galaxyMapUnlocked'
  | 'starSystemUnlocked'
  | 'shipTravelStarted'
  | 'shipTravelCompleted'
  | 'shipUpgraded'
  | 'tradeRouteCreated'
  | 'tradeRouteDeleted';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
  timestamp: number;
}

export type EventHandler<T = unknown> = (event: GameEvent<T>) => void;

export class EventBus {
  private handlers: Map<GameEventType, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event type
   */
  on<T = unknown>(type: GameEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to an event type, but only for one occurrence
   */
  once<T = unknown>(type: GameEventType, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = event => {
      handler(event);
      this.handlers.get(type)?.delete(wrappedHandler as EventHandler);
    };
    return this.on(type, wrappedHandler);
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = unknown>(type: GameEventType, payload: T): void {
    const event: GameEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Remove all handlers for a specific event type
   */
  off(type: GameEventType): void {
    this.handlers.delete(type);
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();
