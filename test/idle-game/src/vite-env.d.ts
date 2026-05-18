/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Master toggle for Convex-based game engine */
  readonly VITE_USE_CONVEX_ENGINE?: string;
  /** Enable Convex for gacha system */
  readonly VITE_CONVEX_GACHA?: string;
  /** Enable Convex for production loop */
  readonly VITE_CONVEX_PRODUCTION?: string;
  /** Enable Convex for progression systems */
  readonly VITE_CONVEX_PROGRESSION?: string;
  /** Enable Convex for multiplayer systems */
  readonly VITE_CONVEX_MULTIPLAYER?: string;
  /** Enable AI Co-op mode */
  readonly VITE_AI_COOP_MODE?: string;
  /** Convex deployment URL */
  readonly VITE_CONVEX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
