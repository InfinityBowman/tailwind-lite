/**
 * useConvexGalaxy - Galaxy/Travel operations via Convex backend
 *
 * Handles ship travel, upgrades, cargo, and trade routes.
 */

import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexGalaxy() {
  // Queries
  const shipUpgradeCost = useQuery(api.galaxy.getShipUpgradeCost);

  // Mutations
  const startTravelMutation = useMutation(api.galaxy.startTravel);
  const upgradeShipMutation = useMutation(api.galaxy.upgradeShip);
  const unloadCargoMutation = useMutation(api.galaxy.unloadCargo);
  const createTradeRouteMutation = useMutation(api.galaxy.createTradeRoute);
  const deleteTradeRouteMutation = useMutation(api.galaxy.deleteTradeRoute);

  // Actions
  const startTravel = useCallback(
    async (systemId: string) => {
      const result = await startTravelMutation({ systemId, isAI: false });
      return result;
    },
    [startTravelMutation]
  );

  const getShipUpgradeCost = useCallback(() => {
    return shipUpgradeCost ?? null;
  }, [shipUpgradeCost]);

  const upgradeShip = useCallback(async () => {
    const result = await upgradeShipMutation({ isAI: false });
    return result;
  }, [upgradeShipMutation]);

  const unloadCargo = useCallback(async () => {
    const result = await unloadCargoMutation({ isAI: false });
    return result;
  }, [unloadCargoMutation]);

  const createTradeRoute = useCallback(
    async (source: string, dest: string, resourceType: 'credits' | 'essence') => {
      const result = await createTradeRouteMutation({
        sourceSystem: source,
        destSystem: dest,
        resourceType,
        isAI: false,
      });
      return result;
    },
    [createTradeRouteMutation]
  );

  const deleteTradeRoute = useCallback(
    async (routeId: string) => {
      const result = await deleteTradeRouteMutation({ routeId, isAI: false });
      return result;
    },
    [deleteTradeRouteMutation]
  );

  return {
    startTravel,
    getShipUpgradeCost,
    upgradeShip,
    unloadCargo,
    createTradeRoute,
    deleteTradeRoute,
  };
}

export type UseConvexGalaxyReturn = ReturnType<typeof useConvexGalaxy>;
