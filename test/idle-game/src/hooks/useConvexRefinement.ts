/**
 * useConvexRefinement - Plant refinement via Convex backend
 *
 * Handles refining plants into essence.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexRefinement() {
  // Mutations
  const refinePlantsMutation = useMutation(api.refinement.refinePlants);
  const refineAllPlantsMutation = useMutation(api.refinement.refineAllPlants);

  // Actions
  const refinePlants = useCallback(
    async (plantType: string, batches?: number | 'max') => {
      // Convert 'max' to undefined (server will use max batches)
      const batchCount = batches === 'max' ? undefined : batches;
      return await refinePlantsMutation({ plantType, batches: batchCount, isAI: false });
    },
    [refinePlantsMutation]
  );

  const refineAllPlants = useCallback(async () => {
    return await refineAllPlantsMutation({ isAI: false });
  }, [refineAllPlantsMutation]);

  return {
    refinePlants,
    refineAllPlants,
  };
}

export type UseConvexRefinementReturn = ReturnType<typeof useConvexRefinement>;
