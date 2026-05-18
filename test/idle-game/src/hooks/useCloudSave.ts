/**
 * useCloudSave - Cloud save operations via Convex
 *
 * This is the simpler cloud save hook for basic sync operations.
 * For full game integration, use useGameCloudSave instead.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface CloudSaveState {
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  hasConflict: boolean;
  serverVersion: number | null;
  isOnline: boolean;
  /** Current retry attempt (0 = first try, 1+ = retrying) */
  retryAttempt: number;
  /** Time until next retry (ms), null if not retrying */
  retryInMs: number | null;
  /** Last sync error message, if any */
  lastError: string | null;
}

interface UseCloudSaveOptions {
  /** How often to auto-sync (ms). Default: 30000 (30s) */
  syncInterval?: number;
  /** Called when cloud has newer data */
  onConflict?: (serverSave: unknown, serverVersion: number) => void;
  /** Called after successful sync */
  onSync?: () => void;
}

interface UseCloudSaveReturn {
  state: CloudSaveState;
  sync: (
    saveData: unknown,
    version: number
  ) => Promise<{
    status: 'saved' | 'conflict' | 'error' | 'offline';
    [key: string]: unknown;
  }>;
  forceSync: (
    saveData: unknown,
    version: number
  ) => Promise<{ status: 'saved' | 'error' | 'offline'; [key: string]: unknown }>;
  getCloudSave: () => unknown;
  cloudSave: unknown;
  /** Cancel any pending retry */
  cancelRetry: () => void;
}

/** Retry configuration */
const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

const INITIAL_STATE: CloudSaveState = {
  isLoading: false,
  isSyncing: false,
  lastSyncTime: null,
  hasConflict: false,
  serverVersion: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  retryAttempt: 0,
  retryInMs: null,
  lastError: null,
};

/** Calculate delay for exponential backoff */
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  // Add jitter (10-20% randomness) to prevent thundering herd
  const jitter = delay * (0.1 + Math.random() * 0.1);
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Hook for cloud save functionality.
 *
 * Provides:
 * - Auto-sync on interval
 * - Manual sync trigger
 * - Conflict detection and resolution
 * - Loading cloud save on mount
 * - Online/offline detection
 *
 * Usage:
 * ```tsx
 * const { sync, loadFromCloud, state } = useCloudSave({
 *   onConflict: (serverSave) => {
 *     // Show dialog asking user to choose local or cloud
 *   }
 * });
 *
 * // Check if online
 * if (!state.isOnline) {
 *   // Show offline indicator
 * }
 * ```
 */
export function useCloudSave(options: UseCloudSaveOptions = {}): UseCloudSaveReturn {
  const { syncInterval = 30000, onConflict, onSync } = options;

  const [state, setState] = useState<CloudSaveState>(INITIAL_STATE);
  const syncTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountdownRef = useRef<number | null>(null);
  const pendingRetryRef = useRef<{ saveData: unknown; version: number } | null>(null);
  // Ref to break circular dependency between scheduleRetry and syncInternal
  const syncInternalRef = useRef<
    | ((
        saveData: unknown,
        version: number,
        attempt: number
      ) => Promise<{ status: string; [key: string]: unknown }>)
    | null
  >(null);

  // Convex hooks
  const cloudSave = useQuery(api.saves.loadSave);
  const syncMutation = useMutation(api.saves.syncSave);
  const forceSyncMutation = useMutation(api.saves.forceSync);

  /** Cancel any pending retry */
  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (retryCountdownRef.current) {
      clearInterval(retryCountdownRef.current);
      retryCountdownRef.current = null;
    }
    pendingRetryRef.current = null;
    setState(s => ({
      ...s,
      retryAttempt: 0,
      retryInMs: null,
      lastError: null,
    }));
  }, []);

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState(s => ({ ...s, isOnline: true }));
    };
    const handleOffline = () => {
      setState(s => ({ ...s, isOnline: false }));
      // Cancel any pending retry when going offline (no point retrying)
      cancelRetry();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setState(s => ({ ...s, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cancelRetry]);

  /**
   * Schedule a retry with exponential backoff.
   */
  const scheduleRetry = useCallback((saveData: unknown, version: number, attempt: number) => {
    if (attempt >= RETRY_CONFIG.maxAttempts) {
      console.error(
        `[CloudSave] Max retry attempts (${RETRY_CONFIG.maxAttempts}) reached, giving up`
      );
      setState(s => ({
        ...s,
        retryAttempt: 0,
        retryInMs: null,
        lastError: `Sync failed after ${RETRY_CONFIG.maxAttempts} attempts`,
      }));
      pendingRetryRef.current = null;
      return;
    }

    const delay = calculateRetryDelay(attempt);
    console.log(
      `[CloudSave] Scheduling retry ${attempt + 1}/${RETRY_CONFIG.maxAttempts} in ${Math.round(delay)}ms`
    );

    // Store pending retry data
    pendingRetryRef.current = { saveData, version };

    // Set initial countdown
    setState(s => ({
      ...s,
      retryAttempt: attempt + 1,
      retryInMs: delay,
    }));

    // Start countdown interval (update every 100ms for smooth UI)
    const startTime = Date.now();
    retryCountdownRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, delay - elapsed);
      setState(s => ({ ...s, retryInMs: remaining }));
    }, 100);

    // Schedule actual retry
    retryTimeoutRef.current = window.setTimeout(async () => {
      if (retryCountdownRef.current) {
        clearInterval(retryCountdownRef.current);
        retryCountdownRef.current = null;
      }

      // Attempt sync again (use ref to avoid stale closure)
      const pending = pendingRetryRef.current;
      if (pending && syncInternalRef.current) {
        pendingRetryRef.current = null;
        // The sync function will handle further retries if this fails
        await syncInternalRef.current(pending.saveData, pending.version, attempt + 1);
      }
    }, delay);
  }, []);

  /**
   * Internal sync implementation with retry support.
   */
  const syncInternal = useCallback(
    async (saveData: unknown, version: number, attempt: number = 0) => {
      if (!state.isOnline) {
        return { status: 'offline' as const };
      }

      setState(s => ({ ...s, isSyncing: true, lastError: null }));

      try {
        const result = await syncMutation({ saveData, version });

        if (result.status === 'conflict') {
          // Conflicts don't retry - they need user intervention
          cancelRetry();
          setState(s => ({
            ...s,
            isSyncing: false,
            hasConflict: true,
            serverVersion: result.serverVersion,
            retryAttempt: 0,
            retryInMs: null,
          }));
          onConflict?.(result.serverSave, result.serverVersion);
          return result;
        }

        // Success - clear any retry state
        cancelRetry();
        setState(s => ({
          ...s,
          isSyncing: false,
          lastSyncTime: Date.now(),
          hasConflict: false,
          retryAttempt: 0,
          retryInMs: null,
          lastError: null,
        }));
        onSync?.();
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[CloudSave] Sync failed (attempt ${attempt + 1}):`, error);

        setState(s => ({
          ...s,
          isSyncing: false,
          lastError: errorMessage,
        }));

        // Schedule retry if not at max attempts
        if (attempt < RETRY_CONFIG.maxAttempts - 1) {
          scheduleRetry(saveData, version, attempt);
        } else {
          setState(s => ({
            ...s,
            lastError: `Sync failed after ${RETRY_CONFIG.maxAttempts} attempts: ${errorMessage}`,
          }));
        }

        return { status: 'error' as const, error };
      }
    },
    [syncMutation, onConflict, onSync, state.isOnline, cancelRetry, scheduleRetry]
  );

  // Keep ref in sync with function (breaks circular dep between scheduleRetry and syncInternal)
  syncInternalRef.current = syncInternal;

  /**
   * Sync local save to cloud with automatic retry on failure.
   */
  const sync = useCallback(
    async (saveData: unknown, version: number) => {
      // Cancel any existing retry before starting new sync
      cancelRetry();
      return syncInternal(saveData, version, 0);
    },
    [syncInternal, cancelRetry]
  );

  /**
   * Force sync local save to cloud, overwriting any server data.
   */
  const forceSync = useCallback(
    async (saveData: unknown, version: number) => {
      if (!state.isOnline) {
        return { status: 'offline' as const };
      }

      setState(s => ({ ...s, isSyncing: true, hasConflict: false }));

      try {
        const result = await forceSyncMutation({ saveData, version });
        setState(s => ({
          ...s,
          isSyncing: false,
          lastSyncTime: Date.now(),
        }));
        onSync?.();
        return result;
      } catch (error) {
        setState(s => ({ ...s, isSyncing: false }));
        console.error('[CloudSave] Force sync failed:', error);
        return { status: 'error' as const, error };
      }
    },
    [forceSyncMutation, onSync, state.isOnline]
  );

  /**
   * Get the current cloud save data.
   */
  const getCloudSave = useCallback(() => {
    return cloudSave;
  }, [cloudSave]);

  // Auto-sync on interval (placeholder for actual implementation)
  useEffect(() => {
    if (syncInterval <= 0) return;

    const timeoutRef = syncTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, [syncInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (retryCountdownRef.current) clearInterval(retryCountdownRef.current);
    };
  }, []);

  return {
    state,
    sync,
    forceSync,
    getCloudSave,
    cloudSave,
    cancelRetry,
  };
}
