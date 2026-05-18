import { ReactNode } from 'react';
import { ConvexProvider as ConvexReactProvider } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { convex } from './client';
import { authClient } from './auth-client';

interface ConvexProviderProps {
  children: ReactNode;
}

/**
 * Convex provider wrapper with Better Auth integration.
 *
 * Provides:
 * - Cloud saves sync automatically
 * - Leaderboards are live
 * - Tournaments available
 * - Premium purchases work
 * - Auth via Discord/Google/Email works
 */
export function ConvexAppProvider({ children }: ConvexProviderProps) {
  // If auth client is available, use the Better Auth provider
  if (authClient) {
    return (
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        {children}
      </ConvexBetterAuthProvider>
    );
  }

  // Fallback to basic Convex provider (no auth configured)
  return <ConvexReactProvider client={convex}>{children}</ConvexReactProvider>;
}
