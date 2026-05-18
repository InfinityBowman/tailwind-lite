/**
 * useConvexBreeding - Breeding operations via Convex backend
 *
 * Handles seed breeding operations and breeding state queries.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { BreedingState } from '../game/systems/BreedingSystem';
import {
  canStartBreeding as canStartBreedingCheck,
  isBreedingComplete as isBreedingCompleteCheck,
  getBreedingProgress as getBreedingProgressValue,
  formatBreedingTimeRemaining,
} from '../game';

export function useConvexBreeding(breedingState: BreedingState | null | undefined) {
  // Mutations
  const placeBreedingSeedMutation = useMutation(api.breeding.placeBreedingSeed);
  const removeBreedingSeedMutation = useMutation(api.breeding.removeBreedingSeed);
  const startBreedingMutation = useMutation(api.breeding.startBreeding);
  const completeBreedingMutation = useMutation(api.breeding.completeBreeding);
  const cancelBreedingMutation = useMutation(api.breeding.cancelBreeding);

  // Actions
  const placeSeedInBreedingSlot = useCallback(
    async (slotIndex: 0 | 1, seedInstanceId: string) => {
      return await placeBreedingSeedMutation({ slotIndex, seedInstanceId, isAI: false });
    },
    [placeBreedingSeedMutation]
  );

  const removeSeedFromBreedingSlot = useCallback(
    async (slotIndex: 0 | 1) => {
      return await removeBreedingSeedMutation({ slotIndex, isAI: false });
    },
    [removeBreedingSeedMutation]
  );

  const startBreeding = useCallback(async () => {
    return await startBreedingMutation({ isAI: false });
  }, [startBreedingMutation]);

  const completeBreeding = useCallback(async () => {
    return await completeBreedingMutation({ isAI: false });
  }, [completeBreedingMutation]);

  const cancelBreeding = useCallback(async () => {
    return await cancelBreedingMutation({ isAI: false });
  }, [cancelBreedingMutation]);

  // Helpers (derived from state)
  const canStartBreedingValue = useCallback(() => {
    if (!breedingState) return false;
    return canStartBreedingCheck(breedingState);
  }, [breedingState]);

  const isBreedingCompleteValue = useCallback(() => {
    if (!breedingState) return false;
    return isBreedingCompleteCheck(breedingState);
  }, [breedingState]);

  const getBreedingProgressPercent = useCallback(() => {
    if (!breedingState) return 0;
    return getBreedingProgressValue(breedingState);
  }, [breedingState]);

  const getBreedingTimeRemaining = useCallback(() => {
    if (!breedingState) return '';
    return formatBreedingTimeRemaining(breedingState);
  }, [breedingState]);

  const getBreedingState = useCallback(
    () => breedingState as BreedingState | null,
    [breedingState]
  );

  return {
    placeSeedInBreedingSlot,
    removeSeedFromBreedingSlot,
    startBreeding,
    completeBreeding,
    cancelBreeding,
    getBreedingState,
    canStartBreeding: canStartBreedingValue,
    isBreedingComplete: isBreedingCompleteValue,
    getBreedingProgress: getBreedingProgressPercent,
    getBreedingTimeRemaining,
  };
}

export type UseConvexBreedingReturn = ReturnType<typeof useConvexBreeding>;
