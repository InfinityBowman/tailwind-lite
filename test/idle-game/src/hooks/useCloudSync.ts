/**
 * useCloudSync - Cloud save synchronization status hook
 *
 * Provides:
 * - Sync status (synced, syncing, error, offline)
 * - Last sync timestamp
 * - Manual sync action
 *
 * This hook wraps useGameCloudSave to provide a simpler UI-focused interface.
 * The underlying implementation handles all Convex operations and conflict resolution.
 *
 * When Convex is not configured, returns disabled state.
 */

import { useCallback, useMemo } from 'react';
import { useGameCloudSave } from './useGameCloudSave';

export type SyncStatus = 'idle' | 'synced' | 'syncing' | 'error' | 'offline' | 'retrying';

export interface CloudSyncState {
  /** Current sync status */
  status: SyncStatus;
  /** Timestamp of last successful sync */
  lastSyncedAt: Date | null;
  /** Error message if status is 'error' */
  error: string | null;
  /** Whether cloud sync is enabled (Convex configured + user authenticated) */
  isEnabled: boolean;
  /** Trigger a manual sync */
  syncNow: () => Promise<void>;
  /** Number of pending changes waiting to sync */
  pendingChanges: number;
  /** Current retry attempt (0 = no retry in progress) */
  retryAttempt: number;
  /** Time until next retry (ms), null if not retrying */
  retryInMs: number | null;
  /** Cancel any pending retry */
  cancelRetry: () => void;
}

/**
 * Hook for cloud save synchronization status.
 *
 * Wraps useGameCloudSave to provide a simpler interface for UI components.
 * The status reflects the actual cloud save state including offline detection.
 *
 * Usage:
 * ```tsx
 * const { status, lastSyncedAt, syncNow } = useCloudSync();
 *
 * if (status === 'offline') {
 *   // Show offline indicator
 * }
 * ```
 */
export function useCloudSync(): CloudSyncState {
  // Get actual cloud save state
  const cloudSave = useGameCloudSave();
  const { state, sync, cancelRetry } = cloudSave;

  // Derive sync status from cloud save state
  const status: SyncStatus = useMemo(() => {
    if (!state.isEnabled) return 'idle';
    if (!state.isOnline) return 'offline';
    // Retrying takes precedence over error (we're actively trying to recover)
    if (state.retryAttempt > 0 && state.retryInMs !== null) return 'retrying';
    if (state.lastError) return 'error';
    if (state.isSyncing) return 'syncing';
    if (state.lastSyncTime) return 'synced';
    return 'idle';
  }, [
    state.isEnabled,
    state.isOnline,
    state.lastError,
    state.isSyncing,
    state.lastSyncTime,
    state.retryAttempt,
    state.retryInMs,
  ]);

  // Convert timestamp to Date
  const lastSyncedAt = useMemo(() => {
    return state.lastSyncTime ? new Date(state.lastSyncTime) : null;
  }, [state.lastSyncTime]);

  // Manual sync action
  const syncNow = useCallback(async () => {
    if (!state.isEnabled || !state.isOnline || state.isSyncing) {
      return;
    }
    await sync();
  }, [state.isEnabled, state.isOnline, state.isSyncing, sync]);

  return {
    status,
    lastSyncedAt,
    error: state.lastError,
    isEnabled: state.isEnabled,
    syncNow,
    pendingChanges: 0, // TODO: Track pending changes if needed
    retryAttempt: state.retryAttempt,
    retryInMs: state.retryInMs,
    cancelRetry,
  };
}

export default useCloudSync;
