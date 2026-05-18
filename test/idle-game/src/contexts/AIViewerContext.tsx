/**
 * AIViewerContext - Provides AI watch mode functionality
 *
 * When enabled, overrides the game state with the remote AI's state
 * and disables all game interactions.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAIViewer, type UseAIViewerReturn } from '../hooks/useAIViewer';
import type { GameState } from '../game/state/GameState';

interface AIViewerContextValue {
  /** Whether AI watch mode is enabled */
  isWatching: boolean;
  /** Toggle watch mode on/off */
  setWatching: (watching: boolean) => void;
  /** The AI viewer hook data */
  viewer: UseAIViewerReturn;
  /** Get the state to display (AI state if watching, null otherwise) */
  getOverrideState: () => GameState | null;
}

const AIViewerContext = createContext<AIViewerContextValue | null>(null);

export function AIViewerProvider({ children }: { children: React.ReactNode }) {
  const [isWatching, setIsWatching] = useState(false);
  const viewer = useAIViewer();

  const setWatching = useCallback(
    (watching: boolean) => {
      setIsWatching(watching);
      if (watching && viewer.status === 'disconnected') {
        viewer.reconnect();
      }
    },
    [viewer]
  );

  const getOverrideState = useCallback(() => {
    if (isWatching && viewer.connected && viewer.state) {
      return viewer.state;
    }
    return null;
  }, [isWatching, viewer.connected, viewer.state]);

  const value = useMemo(
    () => ({
      isWatching,
      setWatching,
      viewer,
      getOverrideState,
    }),
    [isWatching, setWatching, viewer, getOverrideState]
  );

  return <AIViewerContext.Provider value={value}>{children}</AIViewerContext.Provider>;
}

export function useAIViewerContext(): AIViewerContextValue {
  const context = useContext(AIViewerContext);
  if (!context) {
    throw new Error('useAIViewerContext must be used within an AIViewerProvider');
  }
  return context;
}

/**
 * Hook to check if we're in AI watch mode
 * Safe to call even without the provider (returns false)
 */
export function useIsWatchingAI(): boolean {
  const context = useContext(AIViewerContext);
  return context?.isWatching ?? false;
}
