/**
 * GameEngineContext - Provides game engine access to components
 *
 * Uses Convex-only implementation (UseConvexGameReturn).
 *
 * Note: The context guarantees that state is non-null because GameView
 * shows a loading screen when state is null. Components can safely
 * access state without null checks.
 */

import { createContext, useContext } from 'react';
import { UseConvexGameReturn } from '../hooks/useConvexGame';
import type { GameState } from '../game/state/GameState';

// The hook return type (state can be null during loading)
export type UseConvexGameReturnRaw = UseConvexGameReturn;

// The context value type (state is guaranteed non-null after loading guard)
export type GameContextValue = Omit<UseConvexGameReturn, 'state'> & {
  state: GameState;
};

export const GameEngineContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGame must be used within a GameEngineContext.Provider');
  }
  return context;
}

// Alias for consistency
export const useGameContext = useGame;
