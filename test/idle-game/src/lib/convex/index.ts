/**
 * Convex integration for Space Farming Simulator
 *
 * Features:
 * - Cloud saves with conflict resolution
 * - Live leaderboards
 * - Tournament system
 * - Premium currency (crystals)
 * - Auth via Discord/Google/Email
 *
 * Setup:
 * 1. Run `npx convex dev` to start local development
 * 2. Set VITE_CONVEX_URL in .env.local
 * 3. Wrap your app with <ConvexAppProvider>
 */

export { convex } from './client';
export { ConvexAppProvider } from './ConvexProvider';
export { authClient, useSession, signIn, signOut, signUp } from './auth-client';
