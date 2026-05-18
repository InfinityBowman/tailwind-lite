/**
 * Feature flags for gradual Convex migration and AI Co-op mode.
 *
 * These flags allow enabling/disabling specific systems during migration
 * without requiring a full deployment.
 */

export const FEATURE_FLAGS = {
  /**
   * Master toggle for Convex-based game engine.
   * When true, all game state is managed by Convex instead of localStorage.
   */
  USE_CONVEX_ENGINE: import.meta.env.VITE_USE_CONVEX_ENGINE === 'true',

  /**
   * Granular system flags for gradual rollout.
   * Each system can be migrated independently.
   */
  CONVEX_SYSTEMS: {
    /** Gacha pulls use server-side RNG and mutations */
    gacha: import.meta.env.VITE_CONVEX_GACHA === 'true',
    /** Production loop (planting, harvesting, selling) uses Convex */
    production: import.meta.env.VITE_CONVEX_PRODUCTION === 'true',
    /** Progression systems (prestige, research, upgrades) use Convex */
    progression: import.meta.env.VITE_CONVEX_PROGRESSION === 'true',
    /** Multiplayer systems (managers, expeditions, breeding) use Convex */
    multiplayer: import.meta.env.VITE_CONVEX_MULTIPLAYER === 'true',
  },

  /**
   * Enable AI Co-op mode.
   * Allows MCP server (Claude) to play alongside the human player.
   */
  AI_COOP_MODE: import.meta.env.VITE_AI_COOP_MODE === 'true',
} as const;

/**
 * Check if any Convex system is enabled.
 * Useful for conditional rendering of Convex-related UI.
 */
export function isConvexMode(): boolean {
  return (
    FEATURE_FLAGS.USE_CONVEX_ENGINE || Object.values(FEATURE_FLAGS.CONVEX_SYSTEMS).some(v => v)
  );
}

/**
 * Check if a specific Convex system is enabled.
 */
export function isConvexSystemEnabled(system: keyof typeof FEATURE_FLAGS.CONVEX_SYSTEMS): boolean {
  return FEATURE_FLAGS.USE_CONVEX_ENGINE || FEATURE_FLAGS.CONVEX_SYSTEMS[system];
}
