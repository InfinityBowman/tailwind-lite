/**
 * useGameCloudSave - Cloud save status tracking
 *
 * With Convex-only architecture, Convex IS the authoritative state.
 * This hook now primarily provides:
 * 1. Online/offline status tracking
 * 2. Sync status indication
 * 3. Backward-compatible interface for components that use it
 *
 * There's no longer a "local vs cloud" conflict since Convex is the source of truth.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { GameState } from '../game/state/GameState';

export interface CloudSaveState {
  /** Whether cloud save is enabled and user is authenticated */
  isEnabled: boolean;
  /** Loading cloud save data */
  isLoading: boolean;
  /** Syncing to cloud */
  isSyncing: boolean;
  /** Last successful sync time */
  lastSyncTime: number | null;
  /** Conflict detected - always false in Convex-only mode */
  hasConflict: boolean;
  /** Cloud version number - not used in Convex-only mode */
  cloudVersion: number | null;
  /** Cloud save data - not used in Convex-only mode */
  cloudSaveData: GameState | null;
  /** Cloud save timestamp - not used in Convex-only mode */
  cloudTimestamp: number | null;
  /** Local version - not used in Convex-only mode */
  localVersion: number;
  /** Local timestamp - not used in Convex-only mode */
  localTimestamp: number;
  /** Last error message */
  lastError: string | null;
  /** Whether user is online */
  isOnline: boolean;
  /** Current retry attempt (0 = no retry, 1+ = retrying) */
  retryAttempt: number;
  /** Time until next retry (ms) */
  retryInMs: number | null;
  /** @deprecated Use lastError instead */
  error?: string | null;
}

export interface UseGameCloudSaveOptions {
  /** Called after successful sync */
  onSync?: () => void;
}

export interface UseGameCloudSaveReturn {
  state: CloudSaveState;
  sync: () => Promise<{ success: boolean; conflict?: boolean; error?: string }>;
  forceSync: () => Promise<{ success: boolean; version?: number; error?: string }>;
  useCloudSave: () => Promise<{ success: boolean; error?: string }>;
  dismissConflict: () => void;
  getLocalSaveData: () => GameState | null;
  cancelRetry: () => void;
}

const INITIAL_STATE: CloudSaveState = {
  isEnabled: true, // Always enabled in Convex-only mode
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
  hasConflict: false,
  cloudVersion: null,
  cloudSaveData: null,
  cloudTimestamp: null,
  localVersion: 0,
  localTimestamp: 0,
  lastError: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  retryAttempt: 0,
  retryInMs: null,
};

/**
 * Convex-only implementation.
 * Since Convex is the authoritative state, this hook mainly tracks online status
 * and provides a compatible interface for existing components.
 */
export function useGameCloudSave(_options: UseGameCloudSaveOptions = {}): UseGameCloudSaveReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { isAuthenticated } = useAuth();

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const state: CloudSaveState = {
    ...INITIAL_STATE,
    isEnabled: isAuthenticated,
    isOnline,
  };

  // In Convex-only mode, sync is automatic - these are no-ops that return success
  const sync = useCallback(async () => {
    // Convex handles sync automatically
    return { success: true };
  }, []);

  const forceSync = useCallback(async () => {
    // Convex is authoritative - no force sync needed
    return { success: true };
  }, []);

  const useCloudSave = useCallback(async () => {
    // Convex is authoritative - already using cloud
    return { success: true };
  }, []);

  const dismissConflict = useCallback(() => {
    // No conflicts in Convex-only mode
  }, []);

  const getLocalSaveData = useCallback((): GameState | null => {
    // No local save in Convex-only mode
    return null;
  }, []);

  const cancelRetry = useCallback(() => {
    // No retry logic needed in Convex-only mode
  }, []);

  return {
    state,
    sync,
    forceSync,
    useCloudSave,
    dismissConflict,
    getLocalSaveData,
    cancelRetry,
  };
}

export default useGameCloudSave;
