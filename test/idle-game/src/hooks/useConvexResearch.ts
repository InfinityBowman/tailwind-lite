/**
 * useConvexResearch - Research and planet upgrades via Convex backend
 *
 * Handles research unlocks and planet upgrades.
 * Planet upgrades use optimistic updates for instant UI feedback.
 */

import { useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import type { UpgradeType } from '../game/config/balance';
import { calculateUpgradeCost, getUpgradeEffectDescription } from '../game';
import { useMutationWithOptimistic } from './useMutationWithOptimistic';
import { patchSessionState } from './optimistic/patchSessionState';
import { UPGRADE_CONFIGS } from '@shared/upgrades';
import { PLANET_DEFINITIONS } from '@shared/planets';
import type { OptimisticLocalStore } from 'convex/browser';

// ── Optimistic update functions (module-level for stable references) ──

function upgradePlanetOptimistic(
  localStore: OptimisticLocalStore,
  args: {
    planetId: string;
    upgradeType: 'productionRate' | 'exportSpeed' | 'storageCapacity';
    isAI?: boolean;
  }
) {
  patchSessionState(localStore, state => {
    if (!state.planets || !state.ship) return state;

    const planetIndex = state.planets.findIndex((p: { id: string }) => p.id === args.planetId);
    if (planetIndex < 0) return state;

    const planet = state.planets[planetIndex];
    if (!planet.unlocked) return state;

    const upgrades = planet.upgrades || {
      productionRate: 0,
      exportSpeed: 0,
      storageCapacity: 0,
    };
    const currentLevel = upgrades[args.upgradeType] || 0;

    const config = UPGRADE_CONFIGS[args.upgradeType];
    if (currentLevel >= config.maxLevel) return state;

    const cost = Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
    const credits = state.ship.totalCurrency || 0;
    if (credits < cost) return state;

    const newLevel = currentLevel + 1;
    const baseValue = PLANET_DEFINITIONS[args.planetId]?.[args.upgradeType] || 1;
    const newValue = baseValue * (1 + config.effectMultiplier * newLevel);

    const newPlanets = [...state.planets];
    newPlanets[planetIndex] = {
      ...planet,
      [args.upgradeType]: newValue,
      upgrades: { ...upgrades, [args.upgradeType]: newLevel },
    };

    return {
      ...state,
      ship: { ...state.ship, totalCurrency: credits - cost },
      planets: newPlanets,
    };
  });
}

function unlockPlanetOptimistic(
  localStore: OptimisticLocalStore,
  args: { planetId: string; isAI?: boolean }
) {
  patchSessionState(localStore, state => {
    if (!state.planets || !state.ship) return state;

    const planetDef = PLANET_DEFINITIONS[args.planetId];
    if (!planetDef) return state;

    const planetIndex = state.planets.findIndex((p: { id: string }) => p.id === args.planetId);
    if (planetIndex < 0) return state;

    const planet = state.planets[planetIndex];
    if (planet.unlocked) return state;

    const credits = state.ship.totalCurrency || 0;
    if (credits < planetDef.unlockCost) return state;

    const newPlanets = [...state.planets];
    newPlanets[planetIndex] = { ...planet, unlocked: true };

    return {
      ...state,
      ship: { ...state.ship, totalCurrency: credits - planetDef.unlockCost },
      planets: newPlanets,
    };
  });
}

// ── Hook ──

export function useConvexResearch() {
  // Mutations with optimistic updates
  const { mutate: unlockResearchMutation, isPending: isUnlockResearchPending } =
    useMutationWithOptimistic(api.research.unlockResearch);
  const { mutate: unlockPlanetMutation, isPending: isUnlockPlanetPending } =
    useMutationWithOptimistic(api.upgrades.unlockPlanet, unlockPlanetOptimistic);
  const { mutate: upgradePlanetMutation, isPending: isUpgradePending } = useMutationWithOptimistic(
    api.upgrades.upgradePlanet,
    upgradePlanetOptimistic
  );

  // Actions
  const unlockResearch = useCallback(
    async (researchId: string) => {
      return await unlockResearchMutation({ researchId, isAI: false });
    },
    [unlockResearchMutation]
  );

  const unlockPlanet = useCallback(
    async (planetId: string) => {
      return await unlockPlanetMutation({ planetId, isAI: false });
    },
    [unlockPlanetMutation]
  );

  const upgradePlanet = useCallback(
    async (
      planetId: string,
      upgradeType: UpgradeType | 'productionRate' | 'exportSpeed' | 'storageCapacity'
    ) => {
      // Convert uppercase constant to lowercase for Convex
      const typeMap: Record<string, 'productionRate' | 'exportSpeed' | 'storageCapacity'> = {
        PRODUCTION_RATE: 'productionRate',
        EXPORT_SPEED: 'exportSpeed',
        STORAGE_CAPACITY: 'storageCapacity',
        productionRate: 'productionRate',
        exportSpeed: 'exportSpeed',
        storageCapacity: 'storageCapacity',
      };
      const normalizedType =
        typeMap[upgradeType] ||
        (upgradeType as 'productionRate' | 'exportSpeed' | 'storageCapacity');
      return await upgradePlanetMutation({ planetId, upgradeType: normalizedType, isAI: false });
    },
    [upgradePlanetMutation]
  );

  // Helpers (pure functions)
  const getUpgradeCost = useCallback(
    (upgradeType: UpgradeType, level: number) => calculateUpgradeCost(upgradeType, level),
    []
  );

  const getUpgradeDescription = useCallback(
    (upgradeType: UpgradeType) => getUpgradeEffectDescription(upgradeType),
    []
  );

  // Pending states
  const isUnlocking = isUnlockResearchPending || isUnlockPlanetPending;
  const isUpgrading = isUpgradePending;

  return {
    unlockResearch,
    unlockPlanet,
    upgradePlanet,
    getUpgradeCost,
    getUpgradeDescription,
    isUnlocking,
    isUpgrading,
  };
}

export type UseConvexResearchReturn = ReturnType<typeof useConvexResearch>;
