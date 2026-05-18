/**
 * useConvexExpeditions - Expedition operations via Convex backend
 *
 * Handles launching, collecting, and canceling expeditions.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexExpeditions() {
  // Mutations
  const launchExpeditionMutation = useMutation(api.expeditions.launchExpedition);
  const collectExpeditionMutation = useMutation(api.expeditions.collectExpedition);
  const cancelExpeditionMutation = useMutation(api.expeditions.cancelExpedition);

  // Actions
  const launchExpedition = useCallback(
    async (expeditionType: string, managerIds: string[], _supplyIds?: string[]) => {
      // Note: supplyIds not currently supported by Convex mutation
      return await launchExpeditionMutation({ expeditionType, managerIds, isAI: false });
    },
    [launchExpeditionMutation]
  );

  const collectExpedition = useCallback(
    async (expeditionId: string) => {
      return await collectExpeditionMutation({ expeditionId, isAI: false });
    },
    [collectExpeditionMutation]
  );

  const cancelExpedition = useCallback(
    async (expeditionId: string) => {
      return await cancelExpeditionMutation({ expeditionId, isAI: false });
    },
    [cancelExpeditionMutation]
  );

  return {
    launchExpedition,
    collectExpedition,
    cancelExpedition,
  };
}

export type UseConvexExpeditionsReturn = ReturnType<typeof useConvexExpeditions>;
