import { createAuthClient } from 'better-auth/react';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { anonymousClient } from 'better-auth/client/plugins';

// Get the Convex site URL from environment
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

// Create the auth client - only if we have a Convex URL configured
export const authClient = convexSiteUrl
  ? createAuthClient({
      baseURL: convexSiteUrl,
      plugins: [convexClient(), crossDomainClient(), anonymousClient()],
    })
  : null;

// Re-export hooks from the auth client for convenience
export const useSession = authClient?.useSession ?? (() => ({ data: null, isPending: false }));
export const signIn = authClient?.signIn ?? {};
export const signOut = authClient?.signOut ?? (() => Promise.resolve());
export const signUp = authClient?.signUp ?? {};
