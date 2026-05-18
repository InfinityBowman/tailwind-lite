/**
 * useConvexGameState - Real-time subscription to Convex game state
 *
 * This hook provides read-only access to the game state stored on Convex.
 * During Phase 1, the browser still runs the local GameEngine, but this
 * hook allows components to see the Convex state for debugging and
 * preparing for full server-authoritative mode.
 *
 * Key features:
 * - Real-time updates via Convex subscriptions
 * - Connection status tracking
 * - Action log for AI activity feed
 * - Version tracking for conflict detection
 *
 * ARCHITECTURE NOTE:
 * To comply with React's Rules of Hooks while supporting optional Convex,
 * we check FEATURE_FLAGS at module load and conditionally call hooks.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { FEATURE_FLAGS, isConvexMode } from '../config/featureFlags';

// Check flags at module load (constant for hook compliance)
const CONVEX_ENABLED = isConvexMode();
const AI_COOP_ENABLED = FEATURE_FLAGS.AI_COOP_MODE;

/**
 * Connection status for UI indicators.
 */
export type SyncStatus =
  | 'disconnected' // Not authenticated or Convex disabled
  | 'connecting' // Loading initial state
  | 'synced' // Up to date
  | 'stale' // No updates for >1 minute
  | 'error'; // Connection error

/**
 * Action log entry for AI activity feed.
 */
export interface ActionLogEntry {
  id: string;
  action: string;
  payload: unknown;
  result: unknown;
  timeDelta: number;
  timestamp: number;
}

/**
 * State returned by useConvexGameState.
 */
export interface ConvexGameStateResult {
  /** Current game state from Convex (null if not loaded) */
  state: unknown;
  /** State version number */
  version: number;
  /** Connection/sync status */
  syncStatus: SyncStatus;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether there's an active session */
  hasSession: boolean;
  /** Timestamp of last action */
  lastActionTime: number | null;
  /** Timestamp of last update */
  updatedAt: number | null;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Recent actions for AI activity feed */
  actionLog: ActionLogEntry[];
  /** Whether AI co-op mode is enabled */
  isAICoopEnabled: boolean;
  /** Create a new session (or resume existing) */
  createSession: (localState?: unknown, localVersion?: number) => Promise<SessionResult>;
  /** End the current session */
  endSession: () => Promise<{ status: string }>;
  /** Sync local state to Convex (Phase 1 only) */
  syncState: (state: unknown, version: number) => Promise<SyncResult>;
}

interface SessionResult {
  sessionId?: string;
  state: unknown;
  version: number;
  isNew: boolean;
}

interface SyncResult {
  status: 'synced' | 'conflict' | 'created' | 'error' | 'disabled';
  serverVersion?: number;
  serverState?: unknown;
  error?: unknown;
}

/**
 * Stub implementation when Convex/AI-coop is disabled.
 */
function useConvexGameStateDisabled(): ConvexGameStateResult {
  return {
    state: null,
    version: 0,
    syncStatus: 'disconnected',
    isAuthenticated: false,
    hasSession: false,
    lastActionTime: null,
    updatedAt: null,
    isLoading: false,
    actionLog: [],
    isAICoopEnabled: false,
    createSession: async () => ({ state: null, version: 0, isNew: false }),
    endSession: async () => ({ status: 'disabled' }),
    syncState: async () => ({ status: 'disabled' }),
  };
}

/**
 * Real implementation with Convex subscriptions.
 */
function useConvexGameStateEnabled(): ConvexGameStateResult {
  const [error, setError] = useState<Error | null>(null);

  // Convex queries - these auto-update on changes
  const sessionState = useQuery(api.gameState.getSessionState);
  const actionLogData = useQuery(api.gameState.subscribeToActionLog, { limit: 20 });

  // Convex mutations
  const createSessionMutation = useMutation(api.session.createSession);
  const endSessionMutation = useMutation(api.session.endSession);
  const syncStateMutation = useMutation(api.session.syncState);

  // Determine sync status
  const syncStatus = useMemo((): SyncStatus => {
    if (error) return 'error';
    if (sessionState === undefined) return 'connecting';
    if (!sessionState.isAuthenticated) return 'disconnected';
    if (!sessionState.hasSession) return 'disconnected';
    if (sessionState.syncStatus === 'stale') return 'stale';
    return 'synced';
  }, [sessionState, error]);

  // Transform action log
  const actionLog = useMemo((): ActionLogEntry[] => {
    if (!actionLogData) return [];
    return actionLogData.map((entry: any) => ({
      id: entry.id,
      action: entry.action,
      payload: entry.payload,
      result: entry.result,
      timeDelta: entry.timeDelta,
      timestamp: entry.timestamp,
    }));
  }, [actionLogData]);

  // Create session
  const createSession = useCallback(
    async (localState?: unknown, localVersion?: number): Promise<SessionResult> => {
      try {
        setError(null);
        const result = await createSessionMutation({
          localState,
          localVersion,
        });
        return {
          sessionId: result.sessionId,
          state: result.state,
          version: result.version,
          isNew: result.isNew,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create session'));
        throw err;
      }
    },
    [createSessionMutation]
  );

  // End session
  const endSession = useCallback(async () => {
    try {
      setError(null);
      const result = await endSessionMutation();
      return { status: result.status };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to end session'));
      return { status: 'error' };
    }
  }, [endSessionMutation]);

  // Sync state (Phase 1: browser pushes to Convex)
  const syncState = useCallback(
    async (state: unknown, version: number): Promise<SyncResult> => {
      try {
        setError(null);
        const result = await syncStateMutation({ state, version, isAI: false });
        return {
          status: result.status as SyncResult['status'],
          serverVersion: result.serverVersion,
          serverState: result.serverState,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to sync state'));
        return { status: 'error', error: err };
      }
    },
    [syncStateMutation]
  );

  return {
    state: sessionState?.state ?? null,
    version: sessionState?.version ?? 0,
    syncStatus,
    isAuthenticated: sessionState?.isAuthenticated ?? false,
    hasSession: sessionState?.hasSession ?? false,
    lastActionTime: sessionState?.lastActionTime ?? null,
    updatedAt: sessionState?.updatedAt ?? null,
    isLoading: sessionState === undefined,
    actionLog,
    isAICoopEnabled: AI_COOP_ENABLED,
    createSession,
    endSession,
    syncState,
  };
}

/**
 * Hook for subscribing to Convex game state.
 *
 * Provides real-time state updates, action log for AI activity feed,
 * and session management functions.
 *
 * Usage:
 * ```tsx
 * const {
 *   state,
 *   version,
 *   syncStatus,
 *   actionLog,
 *   createSession,
 *   syncState
 * } = useConvexGameState();
 *
 * // Check connection
 * if (syncStatus === 'disconnected') {
 *   return <LoginPrompt />;
 * }
 *
 * // Show AI activity
 * <AIActivityFeed actions={actionLog} />
 * ```
 */
export function useConvexGameState(): ConvexGameStateResult {
  // Use module-level constant to satisfy Rules of Hooks
  if (CONVEX_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useConvexGameStateEnabled();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvexGameStateDisabled();
}

/**
 * Hook for action log only (lightweight alternative).
 * Use this when you only need the action log without full state.
 */
export function useActionLog(limit: number = 20): ActionLogEntry[] {
  if (!CONVEX_ENABLED) {
    return [];
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const actionLogData = useQuery(api.gameState.subscribeToActionLog, {
    limit: Math.min(Math.max(limit, 1), 100),
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo((): ActionLogEntry[] => {
    if (!actionLogData) return [];
    return actionLogData.map((entry: any) => ({
      id: entry.id,
      action: entry.action,
      payload: entry.payload,
      result: entry.result,
      timeDelta: entry.timeDelta,
      timestamp: entry.timestamp,
    }));
  }, [actionLogData]);
}
