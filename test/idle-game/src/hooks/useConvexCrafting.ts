/**
 * useConvexCrafting - Crafting and extraction via Convex backend
 *
 * Handles item crafting, boosters, mods, and plant extraction.
 */

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { GameState } from '../game/state/GameState';
import type { ItemId } from '../game/config/recipes';
import type { ExtractInventory, ExtractionPreview } from '../game/systems/ExtractSystem';
import { getAllExtractionPreviews as getAllExtractionPreviewsFromGame } from '../game/systems/ExtractSystem';
import { getRecipeInfo as getRecipeInfoFromGame } from '../game/systems/CraftingSystem';

export function useConvexCrafting(state: GameState | null) {
  // Mutations
  const craftItemMutation = useMutation(api.crafting.craftItem);
  const applyBoosterMutation = useMutation(api.crafting.applyBooster);
  const extractPlantsMutation = useMutation(api.crafting.extractPlants);
  const extractAllPlantsMutation = useMutation(api.crafting.extractAllPlants);
  const installModMutation = useMutation(api.mods.installMod);
  const uninstallModMutation = useMutation(api.mods.uninstallMod);

  // Actions
  const craftItem = useCallback(
    async (itemId: string) => {
      return await craftItemMutation({ itemId, isAI: false });
    },
    [craftItemMutation]
  );

  const applyBooster = useCallback(
    async (itemInstanceId: string) => {
      return await applyBoosterMutation({ itemInstanceId, isAI: false });
    },
    [applyBoosterMutation]
  );

  const extractPlants = useCallback(
    async (plantType: string, amount?: number) => {
      return await extractPlantsMutation({ plantType, amount, isAI: false });
    },
    [extractPlantsMutation]
  );

  const extractAllPlants = useCallback(async () => {
    return await extractAllPlantsMutation({ isAI: false });
  }, [extractAllPlantsMutation]);

  const installMod = useCallback(
    async (itemInstanceId: string, planetId: string) => {
      return await installModMutation({ itemInstanceId, planetId, isAI: false });
    },
    [installModMutation]
  );

  const uninstallMod = useCallback(
    async (itemInstanceId: string) => {
      return await uninstallModMutation({ itemInstanceId, isAI: false });
    },
    [uninstallModMutation]
  );

  // State getters
  const getCraftingState = useCallback(() => state?.crafting ?? null, [state]);

  const getExtractInventory = useCallback(
    (): Record<string, number> => state?.extracts?.extracts ?? {},
    [state?.extracts]
  );

  const getInstalledMods = useCallback(
    (planetId: string): { id: string; itemId: string }[] => {
      const craftingState = state?.crafting;
      if (!craftingState?.inventory) return [];
      return craftingState.inventory
        .filter(
          (item: { installedOn?: string; id: string; itemId: string }) =>
            item.installedOn === planetId
        )
        .map((item: { id: string; itemId: string }) => ({ id: item.id, itemId: item.itemId }));
    },
    [state?.crafting]
  );

  // Recipe info helper (derived from state using game logic)
  const getRecipeInfo = useCallback(
    (itemId: string) => {
      const extracts = state?.extracts ?? { extracts: {} };
      return getRecipeInfoFromGame(itemId as ItemId, extracts as ExtractInventory);
    },
    [state?.extracts]
  );

  // Extraction previews (computed from state using game logic)
  const getAllExtractionPreviews = useCallback((): ExtractionPreview[] => {
    const plantAmounts = state?.ship?.resources?.plants ?? {};
    const currentExtracts = (state?.extracts?.extracts ?? {}) as Record<string, number>;
    return getAllExtractionPreviewsFromGame(plantAmounts, currentExtracts);
  }, [state?.ship?.resources?.plants, state?.extracts?.extracts]);

  return {
    craftItem,
    applyBooster,
    extractPlants,
    extractAllPlants,
    installMod,
    uninstallMod,
    getCraftingState,
    getExtractInventory,
    getInstalledMods,
    getRecipeInfo,
    getAllExtractionPreviews,
  };
}

export type UseConvexCraftingReturn = ReturnType<typeof useConvexCrafting>;
