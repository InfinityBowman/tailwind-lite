/**
 * useConvexManagers - Manager operations via Convex backend
 *
 * Handles manager gacha pulls, planet assignments, and equipment.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexManagers() {
  // Manager mutations
  const pullManagerMutation = useMutation(api.managers.pullManager);
  const pullManagerMultiMutation = useMutation(api.managers.pullManagerMulti);
  const assignManagerMutation = useMutation(api.managers.assignManager);
  const unassignManagerMutation = useMutation(api.managers.unassignManager);

  // Equipment mutations
  const equipToManagerMutation = useMutation(api.equipment.equipToManager);
  const unequipFromManagerMutation = useMutation(api.equipment.unequipFromManager);

  // Manager actions
  const pullManager = useCallback(async () => {
    return await pullManagerMutation({ isAI: false });
  }, [pullManagerMutation]);

  const multiPullManager = useCallback(async () => {
    return await pullManagerMultiMutation({ isAI: false });
  }, [pullManagerMultiMutation]);

  const assignManager = useCallback(
    async (managerInstanceId: string, planetId: string) => {
      return await assignManagerMutation({ managerInstanceId, planetId, isAI: false });
    },
    [assignManagerMutation]
  );

  const unassignManager = useCallback(
    async (planetId: string) => {
      return await unassignManagerMutation({ planetId, isAI: false });
    },
    [unassignManagerMutation]
  );

  // Equipment actions
  const equipToManager = useCallback(
    async (equipmentId: string, managerInstanceId: string) => {
      return await equipToManagerMutation({ equipmentId, managerInstanceId, isAI: false });
    },
    [equipToManagerMutation]
  );

  const unequipFromManager = useCallback(
    async (managerInstanceId: string) => {
      return await unequipFromManagerMutation({ managerInstanceId, isAI: false });
    },
    [unequipFromManagerMutation]
  );

  return {
    pullManager,
    multiPullManager,
    assignManager,
    unassignManager,
    equipToManager,
    unequipFromManager,
  };
}

export type UseConvexManagersReturn = ReturnType<typeof useConvexManagers>;
