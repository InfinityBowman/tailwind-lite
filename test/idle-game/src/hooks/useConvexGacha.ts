/**
 * useConvexGacha - Gacha operations via Convex backend
 *
 * Handles single and multi-pulls from the gacha system.
 * Optimistically deducts credits on pull (result is server RNG).
 */

import { useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import { useMutationWithOptimistic } from './useMutationWithOptimistic';
import { patchSessionState } from './optimistic/patchSessionState';
import { GACHA_CONFIG } from '@shared/gacha';
import type { OptimisticLocalStore } from 'convex/browser';

// ── Optimistic update functions ──

function gachaPullOptimistic(localStore: OptimisticLocalStore, _args: { isAI?: boolean }) {
  patchSessionState(localStore, state => {
    if (!state.ship) return state;

    const credits = state.ship.totalCurrency || 0;
    const cost = GACHA_CONFIG.PULL_COST;
    if (credits < cost) return state;

    return {
      ...state,
      ship: { ...state.ship, totalCurrency: credits - cost },
    };
  });
}

function gachaMultiPullOptimistic(
  localStore: OptimisticLocalStore,
  args: { count?: 10 | 100; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    if (!state.ship) return state;

    const count = args.count ?? 10;
    const discount =
      count === 100 ? GACHA_CONFIG.MULTI_PULL_100_DISCOUNT : GACHA_CONFIG.MULTI_PULL_10_DISCOUNT;
    const cost = Math.floor(GACHA_CONFIG.PULL_COST * count * discount);
    const credits = state.ship.totalCurrency || 0;
    if (credits < cost) return state;

    return {
      ...state,
      ship: { ...state.ship, totalCurrency: credits - cost },
    };
  });
}

// ── Hook ──

export function useConvexGacha() {
  // Mutations with optimistic updates
  const { mutate: gachaPullMutation, isPending: isPullPending } = useMutationWithOptimistic(
    api.gacha.gachaPull,
    gachaPullOptimistic
  );
  const { mutate: gachaMultiPullMutation, isPending: isMultiPullPending } =
    useMutationWithOptimistic(api.gacha.gachaMultiPull, gachaMultiPullOptimistic);

  // Actions
  const gachaPull = useCallback(async () => {
    return await gachaPullMutation({ isAI: false });
  }, [gachaPullMutation]);

  const gachaMultiPull = useCallback(
    async (count: 10 | 100 = 10) => {
      return await gachaMultiPullMutation({ count, isAI: false });
    },
    [gachaMultiPullMutation]
  );

  const isPulling = isPullPending || isMultiPullPending;

  return {
    gachaPull,
    gachaMultiPull,
    isPulling,
  };
}

export type UseConvexGachaReturn = ReturnType<typeof useConvexGacha>;
