/**
 * useAuth - Authentication hook using Better Auth
 *
 * Provides user state and auth actions:
 * - Login with Discord/Google OAuth
 * - Email/password login
 * - Anonymous login (via Better Auth anonymous plugin)
 * - Logout
 *
 * User sync flow:
 * 1. User authenticates via Better Auth (OAuth, email/password, or anonymous)
 * 2. Hook automatically calls syncUser to create/link game user record
 * 3. Game user data (crystals, display name) is loaded from Convex
 *
 * Account linking flow:
 * 1. Anonymous user plays game, makes progress
 * 2. User signs in with OAuth (Discord/Google)
 * 3. Better Auth links the anonymous account to OAuth account
 * 4. Hook detects betterAuthId change and calls transferLinkedAccountData
 * 5. Game data (session, saves, crystals) is transferred to OAuth account
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { authClient } from '../lib/convex';
import { api } from '../../convex/_generated/api';

export interface AuthUser {
  id: string;
  displayName: string | null;
  email: string | null;
  crystals: number;
  isAnonymous: boolean;
}

export interface AuthState {
  /** Whether auth is still loading */
  isLoading: boolean;
  /** Whether user is authenticated (includes anonymous users) */
  isAuthenticated: boolean;
  /** Current user profile, null if not logged in */
  user: AuthUser | null;
  /** Auth error message, if any */
  error: string | null;
  /** Login with Discord OAuth */
  loginWithDiscord: () => void;
  /** Login with Google OAuth */
  loginWithGoogle: () => void;
  /** Sign in as anonymous user (via Better Auth) */
  loginAnonymously: () => void;
  /** Log out */
  logout: () => void;
  /** Update display name */
  updateDisplayName: (name: string) => Promise<void>;
}

// Disabled state for when auth client is not configured
const DISABLED_STATE: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  loginWithDiscord: () => console.warn('Auth not configured'),
  loginWithGoogle: () => console.warn('Auth not configured'),
  loginAnonymously: () => console.warn('Auth not configured'),
  logout: () => console.warn('Auth not configured'),
  updateDisplayName: async () => console.warn('Auth not configured'),
};

/**
 * Hook for authentication state and actions.
 */
export function useAuth(): AuthState {
  const [error, setError] = useState<string | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);

  // Track previous betterAuthId to detect account linking
  const prevBetterAuthIdRef = useRef<string | null>(null);

  // If auth client is not configured, return disabled state
  // This is a module-level constant check, not a runtime check
  if (!authClient) {
    return DISABLED_STATE;
  }

  // Call useSession - authClient is guaranteed to exist here

  const session = authClient.useSession();
  const { data: sessionData, isPending } = session;

  // Use primitive userId for stable dependency (avoids object identity issues)
  const sessionUserId = sessionData?.user?.id;
  const sessionIsAnonymous = (sessionData?.user as { isAnonymous?: boolean } | undefined)
    ?.isAnonymous;

  // Convex queries and mutations
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const syncUserMutation = useMutation(api.users.syncUser);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const transferLinkedAccountData = useMutation(api.users.transferLinkedAccountData);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gameUser = useQuery(api.users.getMe);

  // Sync user to game database after login (with cleanup and retry)
  // Also handles account linking data transfer
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let cancelled = false;

    // Reset sync state on logout
    if (!sessionUserId && hasSynced) {
      setHasSynced(false);
      setSyncAttempts(0);
      prevBetterAuthIdRef.current = null;
      return;
    }

    // Sync on login with exponential backoff retry
    if (sessionUserId && !hasSynced && syncAttempts < 3) {
      const delay = syncAttempts * 1000; // 0ms, 1s, 2s

      const timer = setTimeout(() => {
        if (cancelled) return;

        syncUserMutation()
          .then(async result => {
            if (cancelled) return;

            // Check for account linking: if we had a previous betterAuthId
            // and it's different from current, transfer data
            const prevId = prevBetterAuthIdRef.current;
            if (prevId && prevId !== sessionUserId && !result.isAnonymous) {
              // Account was linked - transfer game data from old anonymous account
              try {
                await transferLinkedAccountData({ oldBetterAuthId: prevId });
              } catch (err) {
                console.error('Failed to transfer linked account data:', err);
                // Don't fail the sync if transfer fails
              }
            }

            // Update tracking ref
            prevBetterAuthIdRef.current = sessionUserId;

            setHasSynced(true);
            setSyncAttempts(0);
          })
          .catch(err => {
            if (!cancelled) {
              console.error('Failed to sync user:', err);
              setSyncAttempts(n => n + 1);
              if (syncAttempts >= 2) {
                setError('Failed to sync user data');
              }
            }
          });
      }, delay);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [sessionUserId, hasSynced, syncAttempts, syncUserMutation, transferLinkedAccountData]);

  // Transform session data to our user format, enriched with game data
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const user = useMemo<AuthUser | null>(() => {
    if (!sessionUserId) return null;
    return {
      id: gameUser?.id ?? sessionUserId,
      displayName: gameUser?.displayName ?? sessionData?.user?.name ?? null,
      email: sessionData?.user?.email ?? null,
      crystals: gameUser?.crystals ?? 0,
      isAnonymous: sessionIsAnonymous ?? false,
    };
  }, [
    sessionUserId,
    sessionData?.user?.name,
    sessionData?.user?.email,
    gameUser,
    sessionIsAnonymous,
  ]);

  // Auth actions using Better Auth client
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loginWithDiscord = useCallback(async () => {
    try {
      setError(null);
      await authClient!.signIn.social({ provider: 'discord' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Discord login failed';
      setError(message);
      console.error('Discord login failed:', err);
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loginWithGoogle = useCallback(async () => {
    try {
      setError(null);
      await authClient!.signIn.social({ provider: 'google' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      console.error('Google login failed:', err);
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loginAnonymously = useCallback(async () => {
    try {
      setError(null);
      // Use Better Auth anonymous plugin
      await (authClient as any).signIn.anonymous();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anonymous login failed';
      setError(message);
      console.error('Anonymous login failed:', err);
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const logout = useCallback(async () => {
    try {
      setError(null);
      prevBetterAuthIdRef.current = null;
      await authClient!.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      console.error('Logout failed:', err);
    }
  }, []);

  // Convex mutation for display name
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const updateDisplayNameMutation = useMutation(api.users.updateDisplayName);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const updateDisplayName = useCallback(
    async (name: string) => {
      try {
        setError(null);
        await updateDisplayNameMutation({ displayName: name });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update display name';
        setError(message);
        throw err;
      }
    },
    [updateDisplayNameMutation]
  );

  return {
    isLoading: isPending,
    isAuthenticated: !!user,
    user,
    error,
    loginWithDiscord,
    loginWithGoogle,
    loginAnonymously,
    logout,
    updateDisplayName,
  };
}

export default useAuth;
