/**
 * useConvexProgression - Prestige and Transcendence via Convex backend
 *
 * Handles prestige, transcendence, and their bonus purchases.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { GameState } from '../game/state/GameState';
import {
  getAllBonusesWithState,
  getProjectedPrestigePoints,
  getAllTranscendenceBonusesWithState,
  getProjectedTranscendencePoints,
  canPrestige,
  canTranscend,
} from '../game';

export function useConvexProgression(state: GameState | null) {
  // Mutations
  const prestigeMutation = useMutation(api.progression.prestige);
  const purchasePrestigeBonusMutation = useMutation(api.progression.purchasePrestigeBonus);
  const transcendMutation = useMutation(api.progression.transcend);
  const purchaseTranscendenceBonusMutation = useMutation(
    api.progression.purchaseTranscendenceBonus
  );

  // Actions
  const prestige = useCallback(async () => {
    return await prestigeMutation({ isAI: false });
  }, [prestigeMutation]);

  const purchasePrestigeBonus = useCallback(
    async (bonusId: string) => {
      return await purchasePrestigeBonusMutation({ bonusId, isAI: false });
    },
    [purchasePrestigeBonusMutation]
  );

  const transcend = useCallback(async () => {
    return await transcendMutation({ isAI: false });
  }, [transcendMutation]);

  const purchaseTranscendenceBonus = useCallback(
    async (bonusId: string) => {
      return await purchaseTranscendenceBonusMutation({ bonusId, isAI: false });
    },
    [purchaseTranscendenceBonusMutation]
  );

  // Prestige helpers (derived from state)
  const canPrestigeCheck = useCallback(() => {
    if (!state) return { canPrestige: false, reason: 'No state', potentialPoints: 0 };
    return canPrestige(state.prestige.lifetimeCredits);
  }, [state]);

  const getPrestigeBonuses = useCallback(() => {
    if (!state) return [];
    return getAllBonusesWithState(state.prestige.bonusLevels);
  }, [state]);

  const getProjectedPrestigePointsValue = useCallback(
    (credits: number) => getProjectedPrestigePoints(credits),
    []
  );

  // Transcendence helpers (derived from state)
  const canTranscendCheck = useCallback(() => {
    if (!state) return { canTranscend: false, reason: 'No state', potentialPoints: 0 };
    return canTranscend(state.prestige.prestigeLevel);
  }, [state]);

  const getTranscendenceBonuses = useCallback(() => {
    if (!state) return [];
    return getAllTranscendenceBonusesWithState(state.transcendence?.bonusLevels ?? {});
  }, [state]);

  const getProjectedTranscendencePointsValue = useCallback(
    (prestigeLevel: number) => getProjectedTranscendencePoints(prestigeLevel),
    []
  );

  const getTranscendenceState = useCallback(() => state?.transcendence ?? null, [state]);

  return {
    // Actions
    prestige,
    purchasePrestigeBonus,
    transcend,
    purchaseTranscendenceBonus,
    // Prestige helpers
    canPrestige: canPrestigeCheck,
    getPrestigeBonuses,
    getProjectedPrestigePoints: getProjectedPrestigePointsValue,
    // Transcendence helpers
    canTranscend: canTranscendCheck,
    getTranscendenceBonuses,
    getProjectedTranscendencePoints: getProjectedTranscendencePointsValue,
    getTranscendenceState,
  };
}

export type UseConvexProgressionReturn = ReturnType<typeof useConvexProgression>;
