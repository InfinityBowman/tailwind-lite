/**
 * useConvexGame - Convex-only game engine hook
 *
 * Provides game state and actions via Convex backend.
 * This is the server-authoritative implementation - no local GameEngine fallback.
 *
 * Authentication is handled by Better Auth (including anonymous users via the
 * anonymous plugin). All users (OAuth and anonymous) have proper session tokens,
 * so ctx.auth.getUserIdentity() works for everyone.
 *
 * Usage:
 * ```tsx
 * const { state, gachaPull, plantSeed, harvest } = useConvexGame();
 * ```
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { GameState, createInitialGameState } from '../game/state/GameState';
import {
  SEED_TIERS,
  UPGRADE_TYPES,
  UPGRADE_NAMES,
  PRESTIGE_BONUSES,
  TRANSCENDENCE_BONUSES,
  ACHIEVEMENT_CATEGORIES,
  getAllPlantSellValues,
} from '../game';

// Domain-specific hooks
import { useConvexFarming } from './useConvexFarming';
import { useConvexGacha } from './useConvexGacha';
import { useConvexSeeds } from './useConvexSeeds';
import { useConvexProgression } from './useConvexProgression';
import { useConvexResearch } from './useConvexResearch';
import { useConvexBreeding } from './useConvexBreeding';
import { useConvexManagers } from './useConvexManagers';
import { useConvexExpeditions } from './useConvexExpeditions';
import { useConvexCrafting } from './useConvexCrafting';
import { useConvexRewards } from './useConvexRewards';
import { useConvexRefinement } from './useConvexRefinement';
import { useConvexGalaxy } from './useConvexGalaxy';

// ============================================
// HOOK
// ============================================

export function useConvexGame() {
  // ============================================
  // QUERIES (State subscriptions)
  // ============================================
  // Better Auth handles authentication for both OAuth and anonymous users
  // No need to pass anonymousId - ctx.auth.getUserIdentity() works for all users
  // Note: The separate domain queries (getPlanets, getManagers, etc.) are for AI/MCP tools
  // and have different shapes than what the UI expects. UI uses sessionState directly.
  const sessionState = useQuery(api.gameState.getSessionState);

  // ============================================
  // COMPOSED STATE
  // ============================================

  const state = useMemo((): GameState | null => {
    if (!sessionState?.state) return null;

    // Helper to ensure array type
    const ensureArray = <T>(val: T[] | undefined | null): T[] => (Array.isArray(val) ? val : []);

    // Use session state directly - the separate queries are for AI/MCP tools
    // and may have different shapes than what the UI expects
    return {
      ...sessionState.state,
      planets: ensureArray(sessionState.state.planets),
      ship: {
        ...sessionState.state.ship,
        seedInventory: ensureArray(sessionState.state.ship?.seedInventory),
      },
    } as GameState;
  }, [sessionState]);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const isLoading = sessionState === undefined;
  const isAuthenticated = sessionState?.isAuthenticated ?? false;
  const isAnonymous = sessionState?.isAnonymous ?? false;
  const hasSession = sessionState?.hasSession ?? false;

  // Animation timing data
  const lastActionTime = sessionState?.lastActionTime ?? 0;
  const serverTime = sessionState?.updatedAt ?? Date.now();

  // Continuous rates from server (for smooth animation)
  const rates = useMemo(() => sessionState?.rates ?? null, [sessionState?.rates]);
  const computedAt = sessionState?.computedAt ?? 0;

  // Session creation mutation
  const createSessionMutation = useMutation(api.session.createSession);

  // Track if we're creating a session to prevent double-calls
  const isCreatingSession = useRef(false);

  // Auto-create session when authenticated but no session exists
  // Wait for user to be synced (syncStatus !== 'no_user')
  const syncStatus = sessionState?.syncStatus;
  useEffect(() => {
    if (
      sessionState !== undefined && // Data loaded
      isAuthenticated && // User is logged in
      !hasSession && // But no game session
      syncStatus !== 'no_user' && // User record exists (wait for syncUser)
      !isCreatingSession.current // Not already creating
    ) {
      isCreatingSession.current = true;

      // Create initial state for new players (no cloud save)
      const initialState = createInitialGameState();

      createSessionMutation({ localState: initialState, localVersion: 1 })
        .then(() => {
          // Session created successfully
        })
        .catch(err => {
          console.error('[useConvexGame] Failed to create session:', err);
        })
        .finally(() => {
          isCreatingSession.current = false;
        });
    }
  }, [sessionState, isAuthenticated, hasSession, syncStatus, createSessionMutation]);

  const seedEssenceCount = useMemo(
    () => state?.ship?.resources?.seedEssence ?? 0,
    [state?.ship?.resources?.seedEssence]
  );

  // Plant sell values (static)
  const plantSellValues = useMemo(() => getAllPlantSellValues(), []);

  // ============================================
  // DOMAIN HOOKS
  // ============================================

  const farming = useConvexFarming();
  const gacha = useConvexGacha();
  const seeds = useConvexSeeds();
  const progression = useConvexProgression(state);
  const research = useConvexResearch();
  const breeding = useConvexBreeding(state?.breeding);
  const managersHook = useConvexManagers();
  const expeditionsHook = useConvexExpeditions();
  const crafting = useConvexCrafting(state);
  const rewards = useConvexRewards(state);
  const refinement = useConvexRefinement();
  const galaxy = useConvexGalaxy();

  // ============================================
  // STATE GETTERS (remaining functionality)
  // ============================================

  // Star systems state getter
  const getStarSystemsState = useCallback(() => state?.starSystems ?? null, [state]);

  // Galaxy map unlock check
  const isGalaxyMapUnlocked = useCallback(() => {
    // Galaxy map unlocks after first transcendence
    return (state?.transcendence?.transcendenceLevel ?? 0) > 0;
  }, [state]);

  // Anomaly state getter
  const getAnomalyState = useCallback(() => state?.anomalies ?? null, [state]);

  // Hint state helpers
  const dismissHint = useCallback((hintId: string) => {
    // For now, hints are local-only; Convex implementation can be added later
    const hints = JSON.parse(localStorage.getItem('dismissedHints') ?? '[]') as string[];
    if (!hints.includes(hintId)) {
      hints.push(hintId);
      localStorage.setItem('dismissedHints', JSON.stringify(hints));
    }
  }, []);

  const isHintDismissed = useCallback((hintId: string) => {
    const hints = JSON.parse(localStorage.getItem('dismissedHints') ?? '[]') as string[];
    return hints.includes(hintId);
  }, []);

  // Active event (derived from state - returns first active event or null)
  const getActiveEvent = useCallback(() => {
    const events = state?.events?.activeEvents;
    return events && events.length > 0 ? events[0] : null;
  }, [state]);

  // Anomaly collection mutation
  const collectAnomalyMutation = useMutation(api.anomaly.collectAnomaly);

  const collectAnomaly = useCallback(
    async (anomalyId?: string) => {
      // If no anomalyId provided, try to get it from current state
      const activeAnomaly = state?.anomalies?.activeAnomaly;
      const id = anomalyId || activeAnomaly?.id;
      if (!id) {
        return { success: false, message: 'No active anomaly' };
      }
      const result = await collectAnomalyMutation({ anomalyId: id, isAI: false });
      return {
        success: result.success,
        message: result.error,
        rewards: result.rewards,
      };
    },
    [collectAnomalyMutation, state?.anomalies?.activeAnomaly]
  );

  // ============================================
  // SAVE/RESET (Convex auto-saves, so these are stubs or simplified)
  // ============================================

  // Save is automatic with Convex, this is a no-op
  const save = useCallback(() => true, []);

  // Export save as JSON (simplified for Convex - exports current state)
  const exportSave = useCallback(() => {
    if (!state) return '';
    return JSON.stringify(state, null, 2);
  }, [state]);

  // Import save is not supported in Convex mode (server-authoritative)
  const importSave = useCallback((_json: string) => {
    console.warn('Import save is not supported in Convex mode');
    return false;
  }, []);

  // Reset game via Convex dev mutation
  const devResetMutation = useMutation(api.dev.devReset);
  const reset = useCallback(async () => {
    await devResetMutation({});
  }, [devResetMutation]);

  // ============================================
  // GALAXY/TRAVEL (from domain hook)
  // ============================================

  const {
    startTravel,
    getShipUpgradeCost,
    upgradeShip,
    unloadCargo,
    createTradeRoute,
    deleteTradeRoute,
  } = galaxy;

  // Crystal shop mutation
  const purchaseCrystalShopItemMutation = useMutation(api.shop.purchaseCrystalShopItem);

  const purchaseCrystalShopItem = useCallback(
    async (itemId: string) => {
      return await purchaseCrystalShopItemMutation({ itemId, isAI: false });
    },
    [purchaseCrystalShopItemMutation]
  );

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    state,
    isLoading,
    isAuthenticated,
    isAnonymous,
    hasSession,

    // Animation timing (for GameTimeProvider)
    lastActionTime,
    serverTime,

    // Continuous rates (for smooth animation)
    rates,
    computedAt,

    // Derived values
    seedEssenceCount,
    plantSellValues,

    // Gacha (spread from domain hook)
    ...gacha,

    // Farming (spread from domain hook)
    ...farming,

    // Seeds (spread from domain hook)
    ...seeds,

    // Rewards (spread from domain hook)
    ...rewards,

    // Crafting (spread from domain hook)
    ...crafting,

    // Progression (spread from domain hook)
    ...progression,

    // Research (spread from domain hook)
    ...research,

    // Breeding (spread from domain hook)
    ...breeding,

    // Managers (spread from domain hook)
    ...managersHook,

    // Expeditions (spread from domain hook)
    ...expeditionsHook,

    // Refinement (spread from domain hook)
    ...refinement,

    // Star systems
    getStarSystemsState,
    isGalaxyMapUnlocked,

    // Anomaly
    getAnomalyState,
    collectAnomaly,

    // Hints
    dismissHint,
    isHintDismissed,

    // Events
    getActiveEvent,

    // Save/Reset
    save,
    reset,
    exportSave,
    importSave,

    // Galaxy/Travel (from domain hook)
    startTravel,
    getShipUpgradeCost,
    upgradeShip,
    unloadCargo,
    createTradeRoute,
    deleteTradeRoute,

    // Crystal shop
    purchaseCrystalShopItem,

    // Constants (for compatibility)
    upgradeTypes: UPGRADE_TYPES,
    upgradeNames: UPGRADE_NAMES,
    seedTiers: SEED_TIERS,
    prestigeBonuses: PRESTIGE_BONUSES,
    transcendenceBonuses: TRANSCENDENCE_BONUSES,
    achievementCategories: ACHIEVEMENT_CATEGORIES,
  };
}

export type UseConvexGameReturn = ReturnType<typeof useConvexGame>;
