/**
 * Research System - Display helpers and feature flag checks for research UI
 *
 * Research unlock logic lives server-side in convex/research.ts.
 */

import { RESEARCH_NODES, ResearchNode, ResearchEffectType } from '../config/research';

export interface ResearchState {
  completed: string[]; // IDs of completed research
  refinedEssence: number; // Currency for research
}

/**
 * Get all active effects from completed research
 */
export function getActiveResearchEffects(completed: string[]): Map<ResearchEffectType, number> {
  const effects = new Map<ResearchEffectType, number>();

  for (const researchId of completed) {
    const node = RESEARCH_NODES[researchId];
    if (!node) continue;

    for (const effect of node.effects) {
      const currentValue = effects.get(effect.type) || 0;
      effects.set(effect.type, currentValue + effect.value);
    }
  }

  return effects;
}

/**
 * Check if a specific effect is unlocked
 */
export function hasResearchEffect(completed: string[], effectType: ResearchEffectType): boolean {
  const effects = getActiveResearchEffects(completed);
  return effects.has(effectType);
}

/**
 * Get the total bonus for a specific effect type
 */
export function getResearchEffectValue(
  completed: string[],
  effectType: ResearchEffectType
): number {
  const effects = getActiveResearchEffects(completed);
  return effects.get(effectType) || 0;
}

/**
 * Get available research nodes (prerequisites met, not completed)
 */
export function getAvailableResearch(state: ResearchState): ResearchNode[] {
  return Object.values(RESEARCH_NODES).filter(node => {
    // Not already completed
    if (state.completed.includes(node.id)) return false;

    // All prerequisites met
    for (const prereqId of node.prerequisites) {
      if (!state.completed.includes(prereqId)) return false;
    }

    return true;
  });
}

/**
 * Calculate gacha cost after research discounts
 */
export function getGachaCostMultiplier(completed: string[]): number {
  const discount = getResearchEffectValue(completed, 'GACHA_DISCOUNT');
  return Math.max(0.1, 1 - discount); // Minimum 10% of original cost
}

/**
 * Calculate fusion cost after research discounts
 */
export function getFusionCostMultiplier(completed: string[]): number {
  const discount = getResearchEffectValue(completed, 'FUSION_DISCOUNT');
  return Math.max(0.1, 1 - discount); // Minimum 10% of original cost
}

/**
 * Calculate refinement efficiency bonus
 */
export function getRefinementEfficiencyBonus(completed: string[]): number {
  return getResearchEffectValue(completed, 'REFINE_EFFICIENCY');
}

/**
 * Check if auto-fuse is unlocked
 */
export function isAutoFuseUnlocked(completed: string[]): boolean {
  return hasResearchEffect(completed, 'AUTO_FUSE');
}

/**
 * Check if manager system is unlocked
 */
export function isManagersUnlocked(completed: string[]): boolean {
  return hasResearchEffect(completed, 'UNLOCK_MANAGERS');
}
