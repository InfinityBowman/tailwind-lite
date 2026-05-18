/**
 * GameView - Main game wrapper with URL-based navigation
 *
 * Routes:
 * /play/farming/:sub - Farming sections (planets, seeds, gacha, fusion, inventory)
 * /play/:section     - Other sections (managers, quests, research, etc.)
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useConvexGame } from '../hooks/useConvexGame';
import { useAuth } from '../hooks/useAuth';
import { useFeatureUnlocks } from '../hooks/useFeatureUnlocks';
import { useFeatureUnlockNotifier } from '../hooks/useFeatureUnlockNotifier';
import { useGameCloudSave } from '../hooks/useGameCloudSave';
import { CloudSaveConflictDialog } from '../components/cloud';
import SeedMenu from '../components/plants/SeedMenu';
import PlanetList from '../components/planets/PlanetList';
import {
  VALID_SECTIONS,
  VALID_FARMING_SUBS,
  type Section,
  type FarmingSubSection,
} from '../router';

// Dev Tools - only loaded in development mode
const DevToolsPanel = lazy(() => import('../components/dev/DevToolsPanel'));

// Lazy load panels for code splitting
const ResearchPanel = lazy(() => import('../components/research/ResearchPanel'));
const RefinementPanel = lazy(() => import('../components/research/RefinementPanel'));
const PrestigeMenu = lazy(() =>
  import('../components/prestige').then(m => ({ default: m.PrestigeMenu }))
);
const TranscendencePanel = lazy(() =>
  import('../components/transcendence').then(m => ({ default: m.TranscendencePanel }))
);
const WorkshopPanel = lazy(() =>
  import('../components/workshop').then(m => ({ default: m.WorkshopPanel }))
);
const CraftingPanel = lazy(() =>
  import('../components/crafting').then(m => ({ default: m.CraftingPanel }))
);
const BreedingPanel = lazy(() => import('../components/breeding/BreedingPanel'));
const QuestsPanel = lazy(() =>
  import('../components/quests').then(m => ({ default: m.QuestsPanel }))
);
const ContractsPanel = lazy(() =>
  import('../components/contracts').then(m => ({ default: m.ContractsPanel }))
);
const AchievementsPanel = lazy(() =>
  import('../components/achievements').then(m => ({ default: m.AchievementsPanel }))
);
const MasteryPanel = lazy(() =>
  import('../components/mastery').then(m => ({ default: m.MasteryPanel }))
);
const ManagersPanel = lazy(() =>
  import('../components/managers').then(m => ({ default: m.ManagersPanel }))
);
const ExpeditionsPanel = lazy(() =>
  import('../components/expeditions').then(m => ({ default: m.ExpeditionsPanel }))
);
const CrystalShop = lazy(() => import('../components/shop/CrystalShop'));
const DailyLoginPanel = lazy(() => import('../components/daily/DailyLoginPanel'));
const StatsPanel = lazy(() => import('../components/stats/StatsPanel'));
const LeaderboardPanel = lazy(() =>
  import('../components/leaderboard').then(m => ({ default: m.LeaderboardPanel }))
);
const MarketPanel = lazy(() => import('../components/market/MarketPanel'));
const EventsPanel = lazy(() =>
  import('../components/events').then(m => ({ default: m.EventsPanel }))
);
const SeedexPanel = lazy(() =>
  import('../components/seedex').then(m => ({ default: m.SeedexPanel }))
);
const GalaxyMapPanel = lazy(() =>
  import('../components/galaxy/GalaxyMapPanel').then(m => ({ default: m.GalaxyMapPanel }))
);
const AICoopPanel = lazy(() =>
  import('../components/aiCoop').then(m => ({ default: m.AICoopPanel }))
);
import { WelcomeModal, GettingStarted, createChecklistItems } from '../components/onboarding';
import { CargoPanel } from '../components/ui';
import { GameEngineContext, useGame } from '../contexts/GameEngineContext';
import { GameTimeProvider } from '../contexts/GameTimeContext';
// TODO: Enable when AI Co-op UI is implemented
// import { AIViewerProvider, useAIViewerContext } from '../contexts/AIViewerContext';
import { Layout } from '../components/layout';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import Changelog from '../components/settings/Changelog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  BarChart3,
  FlaskConical,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Factory,
  Hammer,
  Dna,
  ScrollText,
} from 'lucide-react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { EventBanner } from '../components/events';
import { AnomalyBanner } from '../components/anomaly';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { getAvailableResearch } from '../game/systems/ResearchSystem';

const GameView: React.FC = () => {
  // ============================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  // (React Rules of Hooks)
  // ============================================

  const gameEngine = useConvexGame();
  const { state, reset, isLoading: convexLoading } = gameEngine;
  const auth = useAuth();
  const navigate = useNavigate();

  // Combined loading state: wait for both Better Auth AND Convex to be ready
  const isLoading = convexLoading || auth.isLoading;

  // Get section from route params (must be before early return)
  const params = useParams({ strict: false }) as {
    section?: string;
    subSection?: string;
  };

  // Feature unlocks (handles null state internally)
  const { isNavUnlocked, isFarmingUnlocked } = useFeatureUnlocks(state);

  // Show toast notifications when new features unlock
  useFeatureUnlockNotifier(state);

  // Cloud save integration
  const cloudSave = useGameCloudSave();

  // Settings dialog state (not route-based)
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);

  // Account linking is now handled automatically by Better Auth
  // The useAuth hook handles transferLinkedAccountData when an anonymous user signs in with OAuth

  // Determine current section and sub-section from URL
  const rawSection = params.subSection ? 'farming' : params.section || 'farming';
  const rawSubSection = params.subSection || 'planets';

  // Validate and coerce to proper types
  const activeSection: Section = VALID_SECTIONS.includes(rawSection as Section)
    ? (rawSection as Section)
    : 'farming';
  const farmingSubSection: FarmingSubSection = VALID_FARMING_SUBS.includes(
    rawSubSection as FarmingSubSection
  )
    ? (rawSubSection as FarmingSubSection)
    : 'planets';

  // Redirect to valid section if current section becomes locked
  useEffect(() => {
    if (state && !isNavUnlocked(activeSection)) {
      navigate({ to: '/play/farming/$subSection', params: { subSection: 'planets' } });
    }
  }, [state, activeSection, isNavUnlocked, navigate]);

  // Redirect to valid farming sub-section if current becomes locked
  useEffect(() => {
    if (state && activeSection === 'farming' && !isFarmingUnlocked(farmingSubSection)) {
      navigate({ to: '/play/farming/$subSection', params: { subSection: 'planets' } });
    }
  }, [state, activeSection, farmingSubSection, isFarmingUnlocked, navigate]);

  // Show welcome modal for brand new players (no lifetime credits = never played)
  useEffect(() => {
    if (!state) return;
    const isNewPlayer =
      state.prestige.lifetimeCredits === 0 && state.ship.seedInventory.length === 0;
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    if (isNewPlayer && !hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [state]);

  // Account linking is now handled automatically by Better Auth anonymous plugin
  // When an anonymous user signs in with OAuth, Better Auth links the accounts
  // and useAuth hook calls transferLinkedAccountData to transfer game data

  // Redirect to landing page ONLY if explicitly not authenticated
  // If auth.isAuthenticated is true, wait for session to be created (don't redirect)
  useEffect(() => {
    // Only redirect if:
    // 1. Auth is done loading (we know the auth state)
    // 2. User is NOT authenticated (Better Auth says no user)
    // 3. Convex is done loading (we know the session state)
    if (!auth.isLoading && !auth.isAuthenticated && !convexLoading) {
      navigate({ to: '/' });
    }
  }, [auth.isLoading, auth.isAuthenticated, convexLoading, navigate]);

  // ============================================
  // EARLY RETURNS (after all hooks)
  // ============================================

  // Loading guard - show loading state while Convex data is being fetched
  // Also show loading while waiting for redirect after auth check
  if (isLoading || !state) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER LOGIC (state is guaranteed non-null)
  // ============================================

  // Create a context value with narrowed type for children.
  const contextValue = {
    ...gameEngine,
    state, // Now TypeScript knows this is GameState, not GameState | null
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  // Use server-computed rates for income display
  const { plantSellValues, rates } = gameEngine;
  const incomeRate = rates?.creditRate ?? 0;

  // Check for available research
  const hasAvailableResearch = getAvailableResearch(state.research).some(
    r => r.costs.refinedEssence <= state.research.refinedEssence
  );

  // Check if daily reward can be claimed
  const canClaimDaily = gameEngine.checkDailyLogin().canClaim;

  const handleReset = () => {
    reset();
    setShowResetConfirm(false);
    setShowSettings(false);
  };

  // Loading fallback for lazy panels
  const PanelLoader = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'farming':
        return <FarmingContent subSection={farmingSubSection} />;
      case 'managers':
        return (
          <Suspense fallback={<PanelLoader />}>
            <ManagersPanel />
          </Suspense>
        );
      case 'expeditions':
        return (
          <Suspense fallback={<PanelLoader />}>
            <ExpeditionsPanel />
          </Suspense>
        );
      case 'contracts':
        return (
          <Suspense fallback={<PanelLoader />}>
            <ContractsPanel />
          </Suspense>
        );
      case 'quests':
        return (
          <Suspense fallback={<PanelLoader />}>
            <QuestsPanel />
          </Suspense>
        );
      case 'achievements':
        return (
          <Suspense fallback={<PanelLoader />}>
            <AchievementsPanel />
          </Suspense>
        );
      case 'research':
        return (
          <Suspense fallback={<PanelLoader />}>
            <ResearchContent />
          </Suspense>
        );
      case 'mastery':
        return (
          <Suspense fallback={<PanelLoader />}>
            <MasteryPanel />
          </Suspense>
        );
      case 'seedex':
        return (
          <Suspense fallback={<PanelLoader />}>
            <SeedexPanel />
          </Suspense>
        );
      case 'prestige':
        return (
          <Suspense fallback={<PanelLoader />}>
            <PrestigeMenu />
          </Suspense>
        );
      case 'transcendence':
        return (
          <Suspense fallback={<PanelLoader />}>
            <TranscendencePanel />
          </Suspense>
        );
      case 'shop':
        return (
          <Suspense fallback={<PanelLoader />}>
            <CrystalShop />
          </Suspense>
        );
      case 'daily':
        return (
          <Suspense fallback={<PanelLoader />}>
            <DailyLoginContent />
          </Suspense>
        );
      case 'events':
        return (
          <Suspense fallback={<PanelLoader />}>
            <EventsPanel />
          </Suspense>
        );
      case 'stats':
        return (
          <Suspense fallback={<PanelLoader />}>
            <StatsPanel />
          </Suspense>
        );
      case 'leaderboard':
        return (
          <Suspense fallback={<PanelLoader />}>
            <LeaderboardPanel />
          </Suspense>
        );
      case 'market':
        return (
          <Suspense fallback={<PanelLoader />}>
            <MarketPanel />
          </Suspense>
        );
      case 'galaxy':
        return (
          <Suspense fallback={<PanelLoader />}>
            <GalaxyMapPanel />
          </Suspense>
        );
      case 'changelog':
        return (
          <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-3 shrink-0">
              <ScrollText className="w-7 h-7" />
              Changelog
            </h1>
            <div className="flex-1 min-h-0">
              <Changelog />
            </div>
          </div>
        );
      case 'ai-coop':
        return (
          <Suspense fallback={<PanelLoader />}>
            <div className="max-w-2xl mx-auto">
              <AICoopPanel />
            </div>
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <GameEngineContext.Provider value={contextValue}>
      <GameTimeProvider
        lastActionTime={gameEngine.lastActionTime}
        serverTime={gameEngine.serverTime}
      >
        <EventBanner
          onClick={() => navigate({ to: '/play/$section', params: { section: 'events' } })}
        />
        <AnomalyBanner />
        <Layout
          activeSection={activeSection}
          activeSubSection={farmingSubSection}
          credits={state.ship.totalCurrency}
          crystals={state.ship.crystals}
          seedEssence={state.ship.resources.seedEssence}
          refinedEssence={state.research.refinedEssence}
          incomeRate={incomeRate}
          claimableQuests={gameEngine.getClaimableQuestCount()}
          claimableAchievements={gameEngine.getClaimableAchievementCount()}
          claimableContracts={gameEngine.getClaimableContractCount()}
          availableResearch={hasAvailableResearch}
          canPrestige={gameEngine.canPrestige().canPrestige}
          prestigePoints={state.prestige.prestigePoints}
          seedCount={state.ship.seedInventory.length}
          managerCount={state.managers.owned.length}
          managerCrystals={state.ship.crystals}
          canClaimDaily={canClaimDaily}
          onSettingsClick={() => setShowSettings(true)}
        >
          <ErrorBoundary>{renderContent()}</ErrorBoundary>
        </Layout>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Game options and data management</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                <h3 className="font-medium">Game Info</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Version: 0.3.6</p>
                  <p>Prestige Level: {state.prestige.prestigeLevel}</p>
                  <p>Lifetime Credits: {state.prestige.lifetimeCredits.toLocaleString()}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => {
                    setShowSettings(false);
                    navigate({ to: '/play/$section', params: { section: 'changelog' } });
                  }}
                >
                  <ScrollText className="w-4 h-4" />
                  View Changelog
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Save Data</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = gameEngine.exportSave();
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `space-farming-save-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="gap-2 flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Export Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = e => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = e => {
                            const json = e.target?.result as string;
                            if (gameEngine.importSave(json)) {
                              setShowSettings(false);
                            } else {
                              alert('Failed to import save. The file may be corrupted or invalid.');
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="gap-2 flex-1"
                  >
                    <Upload className="w-4 h-4" />
                    Import Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export your save to back it up. Import to restore or transfer progress.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium text-destructive">Danger Zone</h3>
                <Button
                  variant="destructive"
                  onClick={() => setShowResetConfirm(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset All Progress
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Reset All Progress?
              </DialogTitle>
              <DialogDescription>
                This will permanently delete all your progress including prestige levels,
                achievements, and unlocks. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Yes, Reset Everything
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Welcome Modal for new players */}
        <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />

        {/* Account linking is now handled automatically by Better Auth */}
        {/* When an anonymous user signs in with OAuth, their game data is transferred automatically */}

        {/* Cloud Save Conflict Dialog */}
        <CloudSaveConflictDialog
          open={cloudSave.state.hasConflict}
          localVersion={cloudSave.state.localVersion}
          localTimestamp={cloudSave.state.localTimestamp}
          cloudVersion={cloudSave.state.cloudVersion || 0}
          cloudTimestamp={cloudSave.state.cloudTimestamp || 0}
          cloudSaveData={cloudSave.state.cloudSaveData}
          localSaveData={cloudSave.getLocalSaveData()}
          isSyncing={cloudSave.state.isSyncing}
          onKeepLocal={cloudSave.forceSync}
          onUseCloud={cloudSave.useCloudSave}
          onDismiss={cloudSave.dismissConflict}
        />

        {/* Dev Tools Panel - Development Mode Only */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <DevToolsPanel />
          </Suspense>
        )}
      </GameTimeProvider>
    </GameEngineContext.Provider>
  );
};

// Farming content component with sub-sections
const FarmingContent: React.FC<{
  subSection: FarmingSubSection;
}> = ({ subSection }) => {
  const { state, sellPlants, sellAllPlants, plantSellValues, rates, isSelling } = useGame();
  const { unlockedFarmingSubSections } = useFeatureUnlocks(state);
  const navigate = useNavigate();
  const [dismissedChecklist, setDismissedChecklist] = useState(
    () => localStorage.getItem('dismissedChecklist') === 'true'
  );

  // Auto-open gacha for brand new players who haven't pulled yet
  const isNewPlayer = state.prestige.lifetimeCredits === 0 && state.ship.seedInventory.length === 0;
  const shouldDefaultToGacha = isNewPlayer && state.achievements.stats.totalGachaPulls === 0;

  // Getting started checklist
  const checklistItems = createChecklistItems({
    seedInventory: state.ship.seedInventory,
    planets: state.planets,
    ship: state.ship,
    prestige: state.prestige,
    achievements: state.achievements,
  });
  const checklistComplete = checklistItems.every(item => item.completed);
  const showChecklist =
    !dismissedChecklist && !checklistComplete && state.prestige.prestigeLevel === 0;

  const handleDismissChecklist = () => {
    setDismissedChecklist(true);
    localStorage.setItem('dismissedChecklist', 'true');
  };

  // Tab labels for mobile nav
  const tabLabels: Record<FarmingSubSection, string> = {
    planets: 'Planets',
    seeds: 'Seeds',
    gacha: 'Gacha',
    fusion: 'Fusion',
    inventory: 'Inventory',
  };

  const handleSubSectionChange = (sub: string) => {
    navigate({ to: '/play/farming/$subSection', params: { subSection: sub } });
  };

  return (
    <div className="space-y-4">
      {/* Getting Started Checklist for new players */}
      {showChecklist && (
        <GettingStarted items={checklistItems} onDismiss={handleDismissChecklist} />
      )}

      {/* Mobile sub-nav (hidden on desktop where sidebar shows it) */}
      <div className="lg:hidden">
        <Tabs value={subSection} onValueChange={handleSubSectionChange}>
          <TabsList className="w-full">
            {unlockedFarmingSubSections.map(sub => (
              <TabsTrigger key={sub} value={sub}>
                {tabLabels[sub]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on sub-section - stacked layout */}
      {(subSection === 'planets' || subSection === 'seeds') && (
        <>
          <SeedMenu
            defaultTab={subSection === 'seeds' || shouldDefaultToGacha ? 'gacha' : undefined}
            highlightPullButton={shouldDefaultToGacha}
          />

          {/* Planet grid */}
          <PlanetList />

          {/* Floating Cargo Panel - shows harvested plants */}
          <CargoPanel
            plants={state.ship.resources.plants}
            plantSellValues={plantSellValues}
            cargoRates={rates?.cargoRates}
            onSellPlant={type => sellPlants(type)}
            onSellAll={sellAllPlants}
            isSelling={isSelling}
          />
        </>
      )}

      {subSection === 'gacha' && <SeedMenu defaultTab="gacha" />}
      {subSection === 'fusion' && <SeedMenu defaultTab="fusion" />}
      {subSection === 'inventory' && <SeedMenu defaultTab="inventory" />}
    </div>
  );
};

// Daily login content wrapper
const DailyLoginContent: React.FC = () => {
  const { state, checkDailyLogin, claimDailyReward } = useGame();
  const dailyState = checkDailyLogin();

  return (
    <div className="max-w-md mx-auto">
      <DailyLoginPanel
        state={state.dailyLogin}
        canClaim={dailyState.canClaim}
        onClaim={claimDailyReward}
      />
    </div>
  );
};

// Research content with tabs for research tree and refinement
const ResearchContent: React.FC = () => {
  const [researchTab, setResearchTab] = useState('tree');

  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={researchTab} onValueChange={setResearchTab}>
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <FlaskConical className="w-4 h-4" />
            Research Tree
          </TabsTrigger>
          <TabsTrigger value="refinement" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Refinement
          </TabsTrigger>
          <TabsTrigger value="workshop" className="gap-2">
            <Factory className="w-4 h-4" />
            Workshop
          </TabsTrigger>
          <TabsTrigger value="crafting" className="gap-2">
            <Hammer className="w-4 h-4" />
            Crafting
          </TabsTrigger>
          <TabsTrigger value="breeding" className="gap-2">
            <Dna className="w-4 h-4" />
            Breeding
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tree" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <ResearchPanel />
          </Suspense>
        </TabsContent>
        <TabsContent value="refinement" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <RefinementPanel />
          </Suspense>
        </TabsContent>
        <TabsContent value="workshop" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <WorkshopPanel />
          </Suspense>
        </TabsContent>
        <TabsContent value="crafting" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <CraftingPanel />
          </Suspense>
        </TabsContent>
        <TabsContent value="breeding" className="mt-6">
          <Suspense fallback={<LoadingState />}>
            <BreedingPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameView;
