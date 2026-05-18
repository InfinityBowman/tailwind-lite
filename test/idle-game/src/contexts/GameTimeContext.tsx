/**
 * GameTimeContext - Synchronized timing for animations
 *
 * Provides a single source of truth for elapsed time since the last server update.
 * All animated values use this context to stay synchronized across components,
 * even when navigating between pages.
 *
 * The key insight: animation is based on server's lastActionTime, not component
 * mount time. This means unmounting/remounting components doesn't break sync.
 */

import React, { createContext, useContext, useMemo } from 'react';

interface GameTimeContextValue {
  /** Server timestamp of last action (from Convex) */
  lastActionTime: number;

  /** Get seconds elapsed since last server update */
  getElapsedSeconds: () => number;

  /** Get current estimated server time (client time adjusted for offset) */
  getServerTime: () => number;
}

const GameTimeContext = createContext<GameTimeContextValue | null>(null);

interface GameTimeProviderProps {
  children: React.ReactNode;
  /** Last action time from server (Convex lastActionTime) */
  lastActionTime: number;
  /** Server time when the query was made (for offset calculation) */
  serverTime?: number;
}

export function GameTimeProvider({ children, lastActionTime, serverTime }: GameTimeProviderProps) {
  // Calculate offset between client and server time
  // This helps handle clock drift between client and server
  const clientTimeOffset = useMemo(() => {
    if (serverTime) {
      return Date.now() - serverTime;
    }
    return 0;
  }, [serverTime]);

  // These don't need useCallback since they're simple calculations
  // and we want them to always use the latest offset
  const value = useMemo(
    () => ({
      lastActionTime,
      getElapsedSeconds: () => {
        if (!lastActionTime) return 0;
        const estimatedServerTime = Date.now() - clientTimeOffset;
        return Math.max(0, (estimatedServerTime - lastActionTime) / 1000);
      },
      getServerTime: () => {
        return Date.now() - clientTimeOffset;
      },
    }),
    [lastActionTime, clientTimeOffset]
  );

  return <GameTimeContext.Provider value={value}>{children}</GameTimeContext.Provider>;
}

export function useGameTime(): GameTimeContextValue {
  const context = useContext(GameTimeContext);
  if (!context) {
    throw new Error('useGameTime must be used within a GameTimeProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider
 * Useful for components that may render outside the game context
 */
export function useGameTimeOptional(): GameTimeContextValue | null {
  return useContext(GameTimeContext);
}
