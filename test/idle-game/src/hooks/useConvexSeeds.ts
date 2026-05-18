/**
 * useConvexSeeds - Seed management via Convex backend
 *
 * Handles seed fusion, scrapping, and auto-fusion.
 */

import { useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import { useMutationWithOptimistic } from './useMutationWithOptimistic';

export function useConvexSeeds() {
  // Mutations with feedback
  const { mutate: fuseSeedMutation, isPending: isFusePending } = useMutationWithOptimistic(
    api.seeds.fuseSeed
  );
  const { mutate: scrapSeedsMutation, isPending: isScrapPending } = useMutationWithOptimistic(
    api.seeds.scrapSeeds
  );
  const { mutate: autoFuseMutation, isPending: isAutoFusePending } = useMutationWithOptimistic(
    api.seeds.autoFuse
  );

  // Actions
  const fuseSeed = useCallback(
    async (seed1Id: string, seed2Id: string) => {
      return await fuseSeedMutation({
        seedInstanceId1: seed1Id,
        seedInstanceId2: seed2Id,
        isAI: false,
      });
    },
    [fuseSeedMutation]
  );

  const scrapSeeds = useCallback(
    async (seedIds: string[]) => {
      return await scrapSeedsMutation({ seedInstanceIds: seedIds, isAI: false });
    },
    [scrapSeedsMutation]
  );

  // Single seed scrap (convenience wrapper)
  const scrapSeed = useCallback(
    async (seedId: string) => {
      const result = await scrapSeedsMutation({ seedInstanceIds: [seedId], isAI: false });
      return {
        success: result.success,
        essenceGained: result.essenceGained ?? 0,
      };
    },
    [scrapSeedsMutation]
  );

  const autoFuse = useCallback(
    async (maxTier?: number) => {
      return await autoFuseMutation({ maxTier, isAI: false });
    },
    [autoFuseMutation]
  );

  // Pending states
  const isFusing = isFusePending || isAutoFusePending;
  const isScrapping = isScrapPending;

  return {
    fuseSeed,
    scrapSeed,
    scrapSeeds,
    autoFuse,
    isFusing,
    isScrapping,
  };
}

export type UseConvexSeedsReturn = ReturnType<typeof useConvexSeeds>;
