/**
 * useConvexFarming - Farming operations via Convex backend
 *
 * Handles planting, harvesting, and selling plants.
 * All mutations use optimistic updates for instant UI feedback.
 */

import { useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import { useMutationWithOptimistic } from './useMutationWithOptimistic';
import { patchSessionState } from './optimistic/patchSessionState';
import { SEED_TYPES } from '@shared/seeds';
import { ESSENCE_PER_PLANT_SOLD, MAX_SEEDS_PER_PLANET } from '@shared/balance';
import type { OptimisticLocalStore } from 'convex/browser';

// ── Optimistic update functions (module-level for stable references) ──

function sellPlantsOptimistic(
  localStore: OptimisticLocalStore,
  args: { plantType: string; amount?: number; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    const plants = state.ship?.resources?.plants;
    if (!plants) return state;

    const currentAmount = plants[args.plantType] || 0;
    if (currentAmount <= 0) return state;

    const amountToSell =
      args.amount == null || args.amount >= currentAmount
        ? Math.floor(currentAmount)
        : Math.floor(args.amount);

    if (amountToSell <= 0) return state;

    const revenue = Math.floor(amountToSell * (SEED_TYPES[args.plantType]?.baseSellValue || 0));
    const essenceBonus = Math.round(amountToSell * ESSENCE_PER_PLANT_SOLD * 10) / 10;

    return {
      ...state,
      ship: {
        ...state.ship,
        totalCurrency: (state.ship.totalCurrency || 0) + revenue,
        resources: {
          ...state.ship.resources,
          seedEssence: (state.ship.resources.seedEssence || 0) + essenceBonus,
          plants: {
            ...plants,
            [args.plantType]: currentAmount - amountToSell,
          },
        },
      },
      prestige: {
        ...(state.prestige || {}),
        lifetimeCredits: (state.prestige?.lifetimeCredits || 0) + revenue,
      },
    };
  });
}

function sellAllPlantsOptimistic(localStore: OptimisticLocalStore, _args: { isAI?: boolean }) {
  patchSessionState(localStore, state => {
    const plants = state.ship?.resources?.plants;
    if (!plants) return state;

    let totalRevenue = 0;
    let totalPlants = 0;

    for (const [plantType, amount] of Object.entries(plants)) {
      const wholeAmount = Math.floor(amount as number);
      if (wholeAmount > 0) {
        totalRevenue += Math.floor(wholeAmount * (SEED_TYPES[plantType]?.baseSellValue || 0));
        totalPlants += wholeAmount;
      }
    }

    if (totalPlants === 0) return state;

    const essenceBonus = Math.round(totalPlants * ESSENCE_PER_PLANT_SOLD * 10) / 10;
    const emptyPlants: Record<string, number> = {};
    for (const plantType of Object.keys(plants)) {
      emptyPlants[plantType] = 0;
    }

    return {
      ...state,
      ship: {
        ...state.ship,
        totalCurrency: (state.ship.totalCurrency || 0) + totalRevenue,
        resources: {
          ...state.ship.resources,
          seedEssence: (state.ship.resources.seedEssence || 0) + essenceBonus,
          plants: emptyPlants,
        },
      },
      prestige: {
        ...state.prestige,
        lifetimeCredits: (state.prestige?.lifetimeCredits || 0) + totalRevenue,
      },
    };
  });
}

function plantSeedOptimistic(
  localStore: OptimisticLocalStore,
  args: { seedInstanceId: string; planetId: string; slotIndex?: number; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    if (!state.ship?.seedInventory || !state.planets) return state;

    const seedIndex = state.ship.seedInventory.findIndex(
      (s: { instanceId: string }) => s.instanceId === args.seedInstanceId
    );
    if (seedIndex < 0) return state;

    const seed = state.ship.seedInventory[seedIndex];
    const planetIndex = state.planets.findIndex((p: { id: string }) => p.id === args.planetId);
    if (planetIndex < 0) return state;

    const planet = state.planets[planetIndex];
    if (!planet.unlocked) return state;

    // Check slot capacity (including crafting mod extras)
    const mods = state.crafting?.installedMods?.[args.planetId] || [];
    let extraSlots = 0;
    for (const mod of mods) {
      if (mod.effect === 'extraSeedSlot') {
        extraSlots += mod.effectValue || 1;
      }
    }
    const maxSeeds = MAX_SEEDS_PER_PLANET + extraSlots;
    if (planet.seeds.length >= maxSeeds) return state;

    const newInventory = state.ship.seedInventory.filter(
      (s: { instanceId: string }) => s.instanceId !== args.seedInstanceId
    );
    const newPlanets = [...state.planets];
    newPlanets[planetIndex] = {
      ...planet,
      seeds: [...planet.seeds, seed],
    };

    return {
      ...state,
      ship: { ...state.ship, seedInventory: newInventory },
      planets: newPlanets,
    };
  });
}

function removeSeedOptimistic(
  localStore: OptimisticLocalStore,
  args: { seedInstanceId: string; planetId: string; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    if (!state.ship?.seedInventory || !state.planets) return state;

    const planetIndex = state.planets.findIndex((p: { id: string }) => p.id === args.planetId);
    if (planetIndex < 0) return state;

    const planet = state.planets[planetIndex];
    const seedOnPlanet = planet.seeds.find(
      (s: { instanceId: string }) => s.instanceId === args.seedInstanceId
    );
    if (!seedOnPlanet) return state;

    const newPlanets = [...state.planets];
    newPlanets[planetIndex] = {
      ...planet,
      seeds: planet.seeds.filter(
        (s: { instanceId: string }) => s.instanceId !== args.seedInstanceId
      ),
    };

    return {
      ...state,
      ship: {
        ...state.ship,
        seedInventory: [...state.ship.seedInventory, seedOnPlanet],
      },
      planets: newPlanets,
    };
  });
}

function harvestOptimistic(
  localStore: OptimisticLocalStore,
  args: { planetId: string; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    if (!state.ship?.resources?.plants || !state.planets) return state;

    const planetIndex = state.planets.findIndex((p: { id: string }) => p.id === args.planetId);
    if (planetIndex < 0) return state;

    const planet = state.planets[planetIndex];
    const newCargoPlants = { ...state.ship.resources.plants };
    let totalHarvested = 0;

    for (const plantData of planet.plants) {
      const wholeAmount = Math.floor(plantData.currentAmount);
      if (wholeAmount > 0) {
        totalHarvested += wholeAmount;
        newCargoPlants[plantData.plant] = (newCargoPlants[plantData.plant] || 0) + wholeAmount;
      }
    }

    if (totalHarvested === 0) return state;

    const newPlanets = [...state.planets];
    newPlanets[planetIndex] = {
      ...planet,
      plants: planet.plants.map(
        (p: { plant: string; currentAmount: number; productionRate?: number }) => ({
          ...p,
          currentAmount: p.currentAmount - Math.floor(p.currentAmount),
        })
      ),
    };

    return {
      ...state,
      ship: {
        ...state.ship,
        resources: { ...state.ship.resources, plants: newCargoPlants },
      },
      planets: newPlanets,
    };
  });
}

function harvestAllOptimistic(localStore: OptimisticLocalStore, _args: { isAI?: boolean }) {
  patchSessionState(localStore, state => {
    if (!state.ship?.resources?.plants || !state.planets) return state;

    const newCargoPlants = { ...state.ship.resources.plants };
    let totalHarvested = 0;

    const newPlanets = state.planets.map(
      (planet: {
        unlocked: boolean;
        plants: Array<{ plant: string; currentAmount: number; productionRate?: number }>;
      }) => {
        if (!planet.unlocked) return planet;

        let planetHarvested = 0;
        for (const plantData of planet.plants) {
          const wholeAmount = Math.floor(plantData.currentAmount);
          if (wholeAmount > 0) {
            totalHarvested += wholeAmount;
            planetHarvested += wholeAmount;
            newCargoPlants[plantData.plant] = (newCargoPlants[plantData.plant] || 0) + wholeAmount;
          }
        }

        if (planetHarvested === 0) return planet;

        return {
          ...planet,
          plants: planet.plants.map(
            (p: { plant: string; currentAmount: number; productionRate?: number }) => ({
              ...p,
              currentAmount: p.currentAmount - Math.floor(p.currentAmount),
            })
          ),
        };
      }
    );

    if (totalHarvested === 0) return state;

    return {
      ...state,
      ship: {
        ...state.ship,
        resources: { ...state.ship.resources, plants: newCargoPlants },
      },
      planets: newPlanets,
    };
  });
}

// ── Hook ──

export function useConvexFarming() {
  // Mutations with optimistic updates
  const { mutate: plantSeedMutation, isPending: isPlantPending } = useMutationWithOptimistic(
    api.farming.plantSeed,
    plantSeedOptimistic
  );
  const { mutate: removeSeedMutation, isPending: isRemovePending } = useMutationWithOptimistic(
    api.farming.removeSeed,
    removeSeedOptimistic
  );
  const { mutate: harvestMutation, isPending: isHarvestPending } = useMutationWithOptimistic(
    api.farming.harvest,
    harvestOptimistic
  );
  const { mutate: harvestAllMutation, isPending: isHarvestAllPending } = useMutationWithOptimistic(
    api.farming.harvestAll,
    harvestAllOptimistic
  );
  const { mutate: sellPlantsMutation, isPending: isSellPending } = useMutationWithOptimistic(
    api.farming.sellPlants,
    sellPlantsOptimistic
  );
  const { mutate: sellAllPlantsMutation, isPending: isSellAllPending } = useMutationWithOptimistic(
    api.farming.sellAllPlants,
    sellAllPlantsOptimistic
  );

  // Actions
  const plantSeed = useCallback(
    async (seedInstanceId: string, planetId: string, slotIndex?: number) => {
      return await plantSeedMutation({ seedInstanceId, planetId, slotIndex, isAI: false });
    },
    [plantSeedMutation]
  );

  const removeSeed = useCallback(
    async (seedInstanceId: string, planetId: string) => {
      return await removeSeedMutation({ seedInstanceId, planetId, isAI: false });
    },
    [removeSeedMutation]
  );

  const harvest = useCallback(
    async (planetId: string) => {
      return await harvestMutation({ planetId, isAI: false });
    },
    [harvestMutation]
  );

  const harvestAll = useCallback(async () => {
    return await harvestAllMutation({ isAI: false });
  }, [harvestAllMutation]);

  const sellPlants = useCallback(
    async (plantType: string, amount?: number) => {
      return await sellPlantsMutation({ plantType, amount, isAI: false });
    },
    [sellPlantsMutation]
  );

  const sellAllPlants = useCallback(async () => {
    return await sellAllPlantsMutation({ isAI: false });
  }, [sellAllPlantsMutation]);

  // Grouped pending states
  const isPlanting = isPlantPending || isRemovePending;
  const isHarvesting = isHarvestPending || isHarvestAllPending;
  const isSelling = isSellPending || isSellAllPending;

  return {
    plantSeed,
    removeSeed,
    harvest,
    harvestAll,
    sellPlants,
    sellAllPlants,
    isPlanting,
    isHarvesting,
    isSelling,
  };
}

export type UseConvexFarmingReturn = ReturnType<typeof useConvexFarming>;
