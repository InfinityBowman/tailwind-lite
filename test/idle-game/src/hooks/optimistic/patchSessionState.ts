/**
 * patchSessionState - Shared helper for optimistic updates
 *
 * Safely patches the getSessionState query cache. All optimistic updates
 * use this to predict state changes before the server responds.
 *
 * Important: Query results must be treated as immutable (Convex requirement).
 * Always create new copies of nested structures.
 */

import { api } from '../../../convex/_generated/api';
import type { OptimisticLocalStore } from 'convex/browser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GameState = any;

/**
 * Read the current getSessionState query result, apply an updater to the
 * nested `state` field, and write it back. No-ops if there is no cached
 * query result or if the updater returns the same reference (no change).
 */
export function patchSessionState(
  localStore: OptimisticLocalStore,
  updater: (state: GameState) => GameState
): void {
  const current = localStore.getQuery(api.gameState.getSessionState, {});
  if (!current || !current.state) return;

  const newState = updater(current.state);
  if (newState === current.state) return;

  localStore.setQuery(
    api.gameState.getSessionState,
    {},
    {
      ...current,
      state: newState,
    }
  );
}
