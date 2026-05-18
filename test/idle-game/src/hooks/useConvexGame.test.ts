/**
 * useConvexGame Hook Tests
 *
 * Tests the session creation guard logic. For full auth/session flow,
 * see architecture docs at docs/67_CONVEX_ARCHITECTURE_DESIGN.md
 */

import { describe, it, expect } from 'vitest';

/**
 * Pure function that determines if auto-session creation should be triggered.
 * Extracted here for testability - actual implementation is inline in useConvexGame.
 */
function shouldCreateSession(state: {
  sessionState: unknown;
  isAuthenticated: boolean;
  hasSession: boolean;
  syncStatus: string;
  isCreatingSession: boolean;
}): boolean {
  return (
    state.sessionState !== undefined &&
    state.isAuthenticated &&
    !state.hasSession &&
    state.syncStatus !== 'no_user' &&
    !state.isCreatingSession
  );
}

describe('shouldCreateSession', () => {
  it('returns false when data not yet loaded', () => {
    expect(
      shouldCreateSession({
        sessionState: undefined,
        isAuthenticated: true,
        hasSession: false,
        syncStatus: 'no_session',
        isCreatingSession: false,
      })
    ).toBe(false);
  });

  it('returns false when not authenticated', () => {
    expect(
      shouldCreateSession({
        sessionState: {},
        isAuthenticated: false,
        hasSession: false,
        syncStatus: 'disconnected',
        isCreatingSession: false,
      })
    ).toBe(false);
  });

  it('returns false when session already exists', () => {
    expect(
      shouldCreateSession({
        sessionState: {},
        isAuthenticated: true,
        hasSession: true,
        syncStatus: 'synced',
        isCreatingSession: false,
      })
    ).toBe(false);
  });

  it('returns false when user not yet synced', () => {
    expect(
      shouldCreateSession({
        sessionState: {},
        isAuthenticated: true,
        hasSession: false,
        syncStatus: 'no_user',
        isCreatingSession: false,
      })
    ).toBe(false);
  });

  it('returns false when already creating session', () => {
    expect(
      shouldCreateSession({
        sessionState: {},
        isAuthenticated: true,
        hasSession: false,
        syncStatus: 'no_session',
        isCreatingSession: true,
      })
    ).toBe(false);
  });

  it('returns true when all conditions are met', () => {
    expect(
      shouldCreateSession({
        sessionState: {},
        isAuthenticated: true,
        hasSession: false,
        syncStatus: 'no_session',
        isCreatingSession: false,
      })
    ).toBe(true);
  });

  it('returns true for anonymous users ready for session', () => {
    expect(
      shouldCreateSession({
        sessionState: { isAnonymous: true },
        isAuthenticated: true,
        hasSession: false,
        syncStatus: 'no_session',
        isCreatingSession: false,
      })
    ).toBe(true);
  });
});
