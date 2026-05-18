import { ConvexReactClient } from 'convex/react';

/**
 * Convex client instance.
 *
 * The VITE_CONVEX_URL environment variable must be set to your Convex deployment URL.
 * Get this from the Convex dashboard after running `npx convex dev`.
 *
 * For local development: npx convex dev
 * For production: Set VITE_CONVEX_URL in your deployment environment
 */
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    'VITE_CONVEX_URL environment variable is required. ' +
      'Run `npx convex dev` and add the URL to your .env.local file.'
  );
}

export const convex = new ConvexReactClient(convexUrl);
