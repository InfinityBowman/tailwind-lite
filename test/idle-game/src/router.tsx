/**
 * TanStack Router configuration
 *
 * Route structure:
 * /                       -> Landing page (redirects to /play if authenticated)
 * /play                   -> Redirect to /play/farming/planets
 * /play/farming           -> Redirect to /play/farming/planets
 * /play/farming/:sub      -> Farming with sub-section (planets, seeds, gacha, fusion, inventory)
 * /play/:section          -> Other sections (managers, quests, research, etc.)
 * *                       -> Catch-all, redirect to landing or game
 */

import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
  Navigate,
} from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider, MilestoneCelebration, ExportAnimation } from '@/components/ui';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy load views to keep router config fast
const GameView = lazy(() => import('./views/GameView'));
const LandingView = lazy(() => import('./views/LandingView'));

// Loading fallback - branded loading state
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    <div className="text-muted-foreground text-sm">Loading Space Farming Simulator...</div>
  </div>
);

// Export route types for type-safe navigation
export type Section =
  | 'farming'
  | 'managers'
  | 'expeditions'
  | 'events'
  | 'contracts'
  | 'quests'
  | 'achievements'
  | 'research'
  | 'mastery'
  | 'seedex'
  | 'prestige'
  | 'transcendence'
  | 'shop'
  | 'daily'
  | 'stats'
  | 'leaderboard'
  | 'market'
  | 'galaxy'
  | 'changelog'
  | 'ai-coop';

export type FarmingSubSection = 'planets' | 'seeds' | 'gacha' | 'fusion' | 'inventory';

// Valid sections for validation (defined before routes so they can use them)
export const VALID_SECTIONS: Section[] = [
  'farming',
  'managers',
  'expeditions',
  'events',
  'contracts',
  'quests',
  'achievements',
  'research',
  'mastery',
  'seedex',
  'prestige',
  'transcendence',
  'shop',
  'daily',
  'stats',
  'leaderboard',
  'market',
  'galaxy',
  'changelog',
  'ai-coop',
];

export const VALID_FARMING_SUBS: FarmingSubSection[] = [
  'planets',
  'seeds',
  'gacha',
  'fusion',
  'inventory',
];

// Create root route with global providers
const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <TooltipProvider>
        <ToastProvider>
          <Outlet />
          <ExportAnimation />
          <MilestoneCelebration />
        </ToastProvider>
      </TooltipProvider>
    </ErrorBoundary>
  ),
  // Use Navigate component for client-side navigation instead of window.location
  // Redirect to landing page - it will handle redirecting to game if authenticated
  notFoundComponent: () => <Navigate to="/" />,
});

// Index route - landing page (handles redirect to game if authenticated)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <LandingView />
    </Suspense>
  ),
  pendingComponent: LoadingFallback,
});

// Play base route - redirect to farming/planets
const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play',
  beforeLoad: () => {
    throw redirect({
      to: '/play/farming/$subSection',
      params: { subSection: 'planets' },
    });
  },
});

// Farming route without sub-section - redirect to planets
const farmingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/farming',
  beforeLoad: () => {
    throw redirect({
      to: '/play/farming/$subSection',
      params: { subSection: 'planets' },
    });
  },
});

// Farming with sub-section route - validates subSection param
const farmingSubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/farming/$subSection',
  beforeLoad: ({ params }) => {
    // Validate subSection param - redirect invalid values to planets
    if (!VALID_FARMING_SUBS.includes(params.subSection as FarmingSubSection)) {
      throw redirect({
        to: '/play/farming/$subSection',
        params: { subSection: 'planets' },
      });
    }
  },
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <GameView />
    </Suspense>
  ),
  pendingComponent: LoadingFallback,
});

// Generic section route for non-farming sections - validates section param
const sectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/$section',
  beforeLoad: ({ params }) => {
    // Check if this is actually a farming route (shouldn't match but defensive)
    if (params.section === 'farming') {
      throw redirect({
        to: '/play/farming/$subSection',
        params: { subSection: 'planets' },
      });
    }
    // Validate section param - redirect invalid values to default
    if (!VALID_SECTIONS.includes(params.section as Section)) {
      throw redirect({
        to: '/play/farming/$subSection',
        params: { subSection: 'planets' },
      });
    }
  },
  component: () => (
    <Suspense fallback={<LoadingFallback />}>
      <GameView />
    </Suspense>
  ),
  pendingComponent: LoadingFallback,
});

// Catch-all route for any other paths - redirect to landing (handles auth redirect)
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

// Build route tree
// Note: More specific routes (farmingSubRoute) should come before less specific (sectionRoute)
const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  farmingRoute,
  farmingSubRoute,
  sectionRoute,
  catchAllRoute,
]);

// Create and export router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Type declaration for router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
