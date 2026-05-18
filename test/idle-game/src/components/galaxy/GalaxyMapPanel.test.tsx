/**
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { GalaxyMapPanel } from './GalaxyMapPanel';
import { GameEngineContext, useGame } from '../../contexts/GameEngineContext';
import type { StarSystem, TravelShip } from '../../game/systems/StarSystemsSystem';

// Type for the game context (inferred from useGame hook)
type GameContextValue = ReturnType<typeof useGame>;

// ============================================
// TEST UTILITIES
// ============================================

const createMockSystem = (overrides: Partial<StarSystem> = {}): StarSystem => ({
  id: 'test-system',
  name: 'Test System',
  type: 'home',
  unlocked: true,
  masteryProgress: 50,
  masteryComplete: false,
  unlockRequirements: [],
  bonuses: { production: 1, refinement: 1, experience: 1, special: null },
  discoveredAt: null,
  uniqueState: null,
  ...overrides,
});

const createMockShip = (overrides: Partial<TravelShip> = {}): TravelShip => ({
  currentSystem: 'home',
  destinationSystem: null,
  travelStartTime: null,
  travelDuration: 0,
  cargo: [],
  maxCargo: 10,
  upgradeLevel: 1,
  ...overrides,
});

interface MockGameContextOptions {
  isUnlocked?: boolean;
  systems?: Record<string, StarSystem>;
  ship?: TravelShip;
  tradeRoutes?: unknown[];
  maxTradeRoutes?: number;
  startTravelResult?: { success: boolean; error?: string };
  upgradeShipResult?: { success: boolean; error?: string };
  upgradeCost?: number | null;
  totalCurrency?: number;
  createTradeRouteResult?: { success: boolean; error?: string };
}

const createMockGameContext = (options: MockGameContextOptions = {}): Partial<GameContextValue> => {
  const {
    isUnlocked = true,
    systems = {
      home: createMockSystem({ id: 'home', name: 'Home System', type: 'home' }),
      binary: createMockSystem({
        id: 'binary',
        name: 'Binary Alpha',
        type: 'binary',
        unlocked: false,
        unlockRequirements: [{ type: 'ascensionLevel', value: 2 }],
      }),
    },
    ship = createMockShip(),
    tradeRoutes = [],
    maxTradeRoutes = 3,
    startTravelResult = { success: true },
    upgradeShipResult = { success: true },
    upgradeCost = 10000,
    totalCurrency = 100000,
    createTradeRouteResult = { success: true },
  } = options;

  return {
    getStarSystemsState: vi.fn(() => ({
      systems,
      ship,
      tradeRoutes,
      maxTradeRoutes,
      galacticMarket: {
        priceMultipliers: {},
        lastUpdate: null,
        trendDuration: 0,
      },
    })),
    isGalaxyMapUnlocked: vi.fn(() => isUnlocked),
    startTravel: vi.fn(() => startTravelResult),
    getShipUpgradeCost: vi.fn(() => upgradeCost),
    upgradeShip: vi.fn(() => upgradeShipResult),
    unloadCargo: vi.fn(() => ship.cargo),
    createTradeRoute: vi.fn(() => createTradeRouteResult),
    deleteTradeRoute: vi.fn(() => true),
    loadCargo: vi.fn(() => ({ loaded: [], rejected: [] })),
    // Add other required properties with empty implementations
    state: { ship: { totalCurrency } } as GameContextValue['state'],
    plantSellValues: {},
    seedEssenceCount: 0,
    gachaPull: vi.fn(),
    gachaMultiPull: vi.fn(),
    fuseSeed: vi.fn(),
    autoFuse: vi.fn(),
    scrapSeed: vi.fn(),
    scrapSeeds: vi.fn(),
    plantSeed: vi.fn(),
    removeSeed: vi.fn(),
    upgradePlanet: vi.fn(),
    sellPlants: vi.fn(),
    sellAllPlants: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
    unlockResearch: vi.fn(),
    refinePlants: vi.fn(),
    refineAllPlants: vi.fn(),
    unlockPlanet: vi.fn(),
    canPrestige: vi.fn(),
    prestige: vi.fn(),
    purchasePrestigeBonus: vi.fn(),
    getPrestigeBonuses: vi.fn(),
    getProjectedPrestigePoints: vi.fn(),
    canTranscend: vi.fn(),
    transcend: vi.fn(),
    purchaseTranscendenceBonus: vi.fn(),
    getTranscendenceBonuses: vi.fn(),
    getProjectedTranscendencePoints: vi.fn(),
  };
};

// Mock ToastProvider
const mockAddToast = vi.fn();
vi.mock('@/components/ui/ToastProvider', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: vi.fn(),
    toasts: [],
  }),
}));

const renderWithContext = (contextOptions: MockGameContextOptions = {}) => {
  const mockContext = createMockGameContext(contextOptions);
  return render(
    <GameEngineContext.Provider value={mockContext as GameContextValue}>
      <GalaxyMapPanel />
    </GameEngineContext.Provider>
  );
};

// ============================================
// TESTS
// ============================================

describe('GalaxyMapPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Locked State', () => {
    it('shows locked message when galaxy map is not unlocked', () => {
      renderWithContext({ isUnlocked: false });

      expect(screen.getByText('Galaxy Map Locked')).toBeInTheDocument();
      expect(screen.getByText(/Complete your first Transcendence/)).toBeInTheDocument();
    });

    it('does not show systems when locked', () => {
      renderWithContext({ isUnlocked: false });

      expect(screen.queryByText('Star Systems')).not.toBeInTheDocument();
      expect(screen.queryByText('Home System')).not.toBeInTheDocument();
    });
  });

  describe('Unlocked State', () => {
    it('shows galaxy map header when unlocked', () => {
      renderWithContext();

      expect(screen.getByText('Galaxy Map')).toBeInTheDocument();
      expect(screen.getByText('Star Systems')).toBeInTheDocument();
    });

    it('displays all star systems', () => {
      renderWithContext();

      // Use aria-labels for unique identification (avoids duplicates from Ship Status)
      expect(screen.getByRole('button', { name: /Home System star system/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Binary Alpha star system/i })).toBeInTheDocument();
    });

    it('shows current location badge on current system', () => {
      renderWithContext();

      // Find the home system card by its aria-label
      const homeCard = screen.getByRole('button', {
        name: /Home System star system - current location/i,
      });
      expect(homeCard).toBeInTheDocument();
      expect(within(homeCard).getByText('Current')).toBeInTheDocument();
    });

    it('shows locked indicator on locked systems', () => {
      renderWithContext();

      // Binary Alpha is locked - should show unlock requirements
      expect(screen.getByText(/Ascension 2/)).toBeInTheDocument();
    });

    it('shows mastery progress for unlocked systems', () => {
      renderWithContext();

      // Home system has 50% mastery
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByLabelText('Home System mastery progress')).toBeInTheDocument();
    });
  });

  describe('Ship Status', () => {
    it('shows ship status panel', () => {
      renderWithContext();

      expect(screen.getByText('Ship Status')).toBeInTheDocument();
    });

    it('displays current location when not traveling', () => {
      renderWithContext({
        ship: createMockShip({ currentSystem: 'home' }),
      });

      // Should show location
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('shows cargo capacity', () => {
      renderWithContext({
        ship: createMockShip({ cargo: [], maxCargo: 10 }),
      });

      expect(screen.getByText('0 / 10')).toBeInTheDocument();
    });

    it('shows upgrade level', () => {
      renderWithContext({
        ship: createMockShip({ upgradeLevel: 3 }),
      });

      expect(screen.getByText('Lv. 3')).toBeInTheDocument();
    });

    it('shows travel progress when in transit', () => {
      const now = Date.now();
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula Prime', type: 'nebula' }),
        },
        ship: createMockShip({
          currentSystem: 'home',
          destinationSystem: 'nebula',
          travelStartTime: now - 5000, // 5 seconds ago
          travelDuration: 10000, // 10 seconds total
        }),
      });

      // Should show destination in status (may appear multiple times: card + status)
      const nebulaPrimeElements = screen.getAllByText('Nebula Prime');
      expect(nebulaPrimeElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText('Travel progress')).toBeInTheDocument();
    });
  });

  describe('Trade Routes', () => {
    it('shows trade routes panel', () => {
      renderWithContext();

      expect(screen.getByText('Trade Routes')).toBeInTheDocument();
    });

    it('shows empty state when no active routes', () => {
      renderWithContext({ tradeRoutes: [] });

      expect(screen.getByText('No active trade routes')).toBeInTheDocument();
    });

    it('displays active trade routes', () => {
      renderWithContext({
        tradeRoutes: [
          {
            id: 'route-1',
            sourceSystem: 'home',
            destinationSystem: 'binary',
            resourceType: 'credits',
            level: 2,
            active: true,
          },
        ],
      });

      expect(screen.getByText('Lv.2')).toBeInTheDocument();
    });
  });

  describe('Travel Interaction', () => {
    it('shows travel button on unlocked non-current systems', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula Prime', type: 'nebula' }),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      // Nebula should have a travel button
      const travelButtons = screen.getAllByRole('button', { name: /Travel/i });
      expect(travelButtons.length).toBeGreaterThan(0);
    });

    it('does not show travel button on current location', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      // Home card should not have travel button - use aria-label to find card
      const homeCard = screen.getByRole('button', {
        name: /Home System star system - current location/i,
      });
      expect(within(homeCard).queryByRole('button', { name: /Travel/i })).not.toBeInTheDocument();
    });

    it('calls startTravel when clicking travel button', () => {
      const mockContext = createMockGameContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula Prime', type: 'nebula' }),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      render(
        <GameEngineContext.Provider value={mockContext as GameContextValue}>
          <GalaxyMapPanel />
        </GameEngineContext.Provider>
      );

      const travelButton = screen.getByRole('button', { name: /Travel/i });
      fireEvent.click(travelButton);

      expect(mockContext.startTravel).toHaveBeenCalledWith('nebula');
    });

    it('shows success toast on successful travel', async () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula Prime', type: 'nebula' }),
        },
        startTravelResult: { success: true },
      });

      const travelButton = screen.getByRole('button', { name: /Travel/i });
      fireEvent.click(travelButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('Traveling to Nebula Prime...', 'info');
      });
    });

    it('shows error toast on failed travel', async () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System' }),
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula Prime', type: 'nebula' }),
        },
        startTravelResult: { success: false, error: 'Insufficient fuel' },
      });

      const travelButton = screen.getByRole('button', { name: /Travel/i });
      fireEvent.click(travelButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('Insufficient fuel', 'error');
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('system cards are keyboard focusable', () => {
      renderWithContext();

      const systemCard = screen.getByRole('button', {
        name: /Home System star system/i,
      });
      expect(systemCard).toHaveAttribute('tabindex', '0');
    });

    it('system cards have proper aria labels', () => {
      renderWithContext();

      expect(
        screen.getByRole('button', { name: /Home System star system - current location/i })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /Binary Alpha star system \(locked\)/i })
      ).toBeInTheDocument();
    });

    it('activates on Enter key press', () => {
      const mockContext = createMockGameContext();
      render(
        <GameEngineContext.Provider value={mockContext as GameContextValue}>
          <GalaxyMapPanel />
        </GameEngineContext.Provider>
      );

      const systemCard = screen.getByRole('button', {
        name: /Home System star system/i,
      });

      fireEvent.keyDown(systemCard, { key: 'Enter' });

      // System should be selected (no crash)
      expect(systemCard).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows message when no systems available', () => {
      renderWithContext({
        systems: {},
      });

      expect(screen.getByText(/No star systems available/)).toBeInTheDocument();
    });
  });

  describe('System Types', () => {
    it('displays correct description for home system', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', type: 'home' }),
        },
      });

      expect(screen.getByText('Your home system. Familiar territory.')).toBeInTheDocument();
    });

    it('displays correct description for nebula system', () => {
      renderWithContext({
        systems: {
          nebula: createMockSystem({ id: 'nebula', name: 'Nebula X', type: 'nebula' }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('Dense cosmic clouds enhance refinement.')).toBeInTheDocument();
    });

    it('displays correct description for blackhole system', () => {
      renderWithContext({
        systems: {
          blackhole: createMockSystem({
            id: 'blackhole',
            name: 'Event Horizon',
            type: 'blackhole',
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('Extreme gravity boosts production.')).toBeInTheDocument();
    });
  });

  describe('Ship Upgrade', () => {
    it('shows upgrade button with cost when upgrade available', () => {
      renderWithContext({
        ship: createMockShip({ maxCargo: 10 }),
        upgradeCost: 10000,
        totalCurrency: 100000,
      });

      const upgradeButton = screen.getByRole('button', { name: /upgrade.*10k/i });
      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).not.toBeDisabled();
    });

    it('disables upgrade button when cannot afford', () => {
      renderWithContext({
        ship: createMockShip({ maxCargo: 10 }),
        upgradeCost: 10000,
        totalCurrency: 100, // Not enough
      });

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
      expect(upgradeButton).toBeDisabled();
    });

    it('hides upgrade button when ship is at max', () => {
      renderWithContext({
        ship: createMockShip({ maxCargo: 50 }),
        upgradeCost: null, // No upgrade available
      });

      expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('calls upgradeShip when upgrade button clicked', async () => {
      const mockContext = createMockGameContext({
        ship: createMockShip({ maxCargo: 10 }),
        upgradeCost: 10000,
        totalCurrency: 100000,
      });

      render(
        <GameEngineContext.Provider value={mockContext as GameContextValue}>
          <GalaxyMapPanel />
        </GameEngineContext.Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /upgrade/i }));

      expect(mockContext.upgradeShip).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          'Ship upgraded! Faster travel and more cargo space.',
          'success'
        );
      });
    });

    it('shows error toast when upgrade fails', async () => {
      const mockContext = createMockGameContext({
        ship: createMockShip({ maxCargo: 10 }),
        upgradeCost: 10000,
        totalCurrency: 100000,
        upgradeShipResult: { success: false, error: 'Need 10,000 credits' },
      });

      render(
        <GameEngineContext.Provider value={mockContext as GameContextValue}>
          <GalaxyMapPanel />
        </GameEngineContext.Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /upgrade/i }));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('Need 10,000 credits', 'error');
      });
    });
  });

  describe('Cargo Management', () => {
    it('shows cargo count', () => {
      renderWithContext({
        ship: createMockShip({ cargo: ['seed1', 'seed2'], maxCargo: 10 }),
      });

      expect(screen.getByText('2 / 10')).toBeInTheDocument();
    });

    it('shows unload button when cargo is present and ship is docked', () => {
      renderWithContext({
        ship: createMockShip({
          cargo: ['seed1'],
          currentSystem: 'home',
          destinationSystem: null,
        }),
      });

      expect(screen.getByRole('button', { name: /unload/i })).toBeInTheDocument();
    });

    it('hides unload button when cargo is empty', () => {
      renderWithContext({
        ship: createMockShip({ cargo: [] }),
      });

      expect(screen.queryByRole('button', { name: /unload/i })).not.toBeInTheDocument();
    });

    it('hides unload button when ship is traveling', () => {
      renderWithContext({
        ship: createMockShip({
          cargo: ['seed1'],
          destinationSystem: 'binary',
          travelStartTime: Date.now(),
        }),
      });

      expect(screen.queryByRole('button', { name: /unload/i })).not.toBeInTheDocument();
    });

    it('calls unloadCargo when unload button clicked', () => {
      const mockContext = createMockGameContext({
        ship: createMockShip({
          cargo: ['seed1', 'seed2'],
          currentSystem: 'home',
        }),
      });

      render(
        <GameEngineContext.Provider value={mockContext as GameContextValue}>
          <GalaxyMapPanel />
        </GameEngineContext.Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /unload/i }));

      expect(mockContext.unloadCargo).toHaveBeenCalled();
    });
  });

  describe('Trade Routes', () => {
    it('shows trade routes count', () => {
      renderWithContext({
        tradeRoutes: [
          {
            id: 'route1',
            sourceSystem: 'home',
            destinationSystem: 'binary',
            resourceType: 'credits',
            level: 1,
            active: true,
          },
        ],
        maxTradeRoutes: 3,
      });

      expect(screen.getByText('(1/3)')).toBeInTheDocument();
    });

    it('shows new route button when under max routes', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          binary: createMockSystem({ id: 'binary', name: 'Binary', unlocked: true }),
        },
        tradeRoutes: [],
        maxTradeRoutes: 3,
      });

      expect(screen.getByRole('button', { name: /\+ new/i })).toBeInTheDocument();
    });

    it('hides new route button when at max routes', () => {
      renderWithContext({
        tradeRoutes: [
          {
            id: 'route1',
            sourceSystem: 'home',
            destinationSystem: 'binary',
            resourceType: 'credits',
            level: 1,
            active: true,
          },
          {
            id: 'route2',
            sourceSystem: 'binary',
            destinationSystem: 'home',
            resourceType: 'essence',
            level: 1,
            active: true,
          },
          {
            id: 'route3',
            sourceSystem: 'home',
            destinationSystem: 'nebula',
            resourceType: 'credits',
            level: 1,
            active: true,
          },
        ],
        maxTradeRoutes: 3,
      });

      expect(screen.queryByRole('button', { name: /\+ new/i })).not.toBeInTheDocument();
    });

    it('shows create route form when new button clicked', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          binary: createMockSystem({ id: 'binary', name: 'Binary', unlocked: true }),
        },
        tradeRoutes: [],
        maxTradeRoutes: 3,
      });

      fireEvent.click(screen.getByRole('button', { name: /\+ new/i }));

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('displays existing trade routes', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home System', unlocked: true }),
          binary: createMockSystem({ id: 'binary', name: 'Binary Alpha', unlocked: true }),
        },
        tradeRoutes: [
          {
            id: 'route1',
            sourceSystem: 'home',
            destinationSystem: 'binary',
            resourceType: 'credits',
            level: 2,
            active: true,
          },
        ],
      });

      // Should show source and destination
      const routesSection = screen.getByText('Trade Routes').closest('div')?.parentElement;
      expect(routesSection).toBeInTheDocument();
      expect(screen.getByText('Lv.2')).toBeInTheDocument();
      expect(screen.getByText('(credits)')).toBeInTheDocument();
    });
  });

  // ============================================
  // BINARY SYSTEM STATUS
  // ============================================

  describe('Binary System Status', () => {
    const createBinarySystem = (phaseOverrides = {}): StarSystem =>
      createMockSystem({
        id: 'binary',
        name: 'Binary Alpha',
        type: 'binary',
        unlocked: true,
        uniqueState: {
          phase: 'day',
          phaseStartTime: Date.now(),
          solarFlareActive: false,
          solarFlareStartTime: null,
          solarSiloCargo: 0,
          ...phaseOverrides,
        },
      });

    it('renders binary cycle panel when at binary system', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          binary: createBinarySystem(),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      expect(screen.getByText('Binary Cycle')).toBeInTheDocument();
    });

    it('does not render binary cycle when at home system', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          binary: createBinarySystem(),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      expect(screen.queryByText('Binary Cycle')).not.toBeInTheDocument();
    });

    it('displays current phase with correct label', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({ phase: 'dawn' }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // "Dawn" appears multiple times (current phase + schedule), so use getAllByText
      const dawnElements = screen.getAllByText('Dawn');
      expect(dawnElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows production multiplier display', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({ phase: 'day' }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Check that production section exists
      expect(screen.getByText('Production')).toBeInTheDocument();
    });

    it('shows export multiplier display', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({ phase: 'day' }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Check that exports section exists
      expect(screen.getByText('Exports')).toBeInTheDocument();
    });

    it('renders multiplier values based on phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({ phase: 'night' }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Night phase specific check - should have "Night" label
      const nightElements = screen.getAllByText('Night');
      expect(nightElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays solar flare warning when active', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            solarFlareActive: true,
            solarFlareStartTime: Date.now(),
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      expect(screen.getByText('Solar Flare Active!')).toBeInTheDocument();
    });

    it('does not show solar flare warning when inactive', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({ solarFlareActive: false }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      expect(screen.queryByText('Solar Flare Active!')).not.toBeInTheDocument();
    });

    it('displays phase schedule footer', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem(),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Should show all phase names
      // Note: "Dawn" appears twice - once as current phase, once in schedule
      const dawnElements = screen.getAllByText('Dawn');
      expect(dawnElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('Dusk')).toBeInTheDocument();
      expect(screen.getByText('Night')).toBeInTheDocument();
    });

    it('shows time until next phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            phase: 'day',
            phaseStartTime: Date.now() - 60000, // Started 1 minute ago
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Should show countdown text with "until" keyword
      expect(screen.getByText(/until/i)).toBeInTheDocument();
    });

    // MULTIPLIER VALUE ACCURACY TESTS (from review feedback)
    // Note: phase is calculated from phaseStartTime, not the phase property
    // Phase offsets from cycle start (total 20min cycle):
    // Dawn: 0-2min, Day: 2-8min, Dusk: 8-10min, Night: 10-20min
    const DAWN_OFFSET = 0;
    const DAY_OFFSET = 2 * 60 * 1000; // 2 min
    const NIGHT_OFFSET = 10 * 60 * 1000; // 10 min

    it('shows +100% production multiplier during day phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            // Set phaseStartTime so elapsed time puts us in 'day' phase (2-8min mark)
            phaseStartTime: Date.now() - DAY_OFFSET - 60000, // 3 min into cycle = day
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Day phase: 2.0 multiplier = +100%
      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('shows +75% production multiplier during dawn phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            // phaseStartTime = now means elapsed = 0, which is dawn phase
            phaseStartTime: Date.now() - DAWN_OFFSET - 30000, // 30 sec into cycle = dawn
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Dawn phase: 1.75 multiplier = +75%
      expect(screen.getByText('+75%')).toBeInTheDocument();
    });

    it('shows -50% production multiplier during night phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            // Set phaseStartTime so elapsed time puts us in 'night' phase (10-20min mark)
            phaseStartTime: Date.now() - NIGHT_OFFSET - 60000, // 11 min into cycle = night
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Night phase: 0.5 multiplier = -50%
      expect(screen.getByText('-50%')).toBeInTheDocument();
    });

    it('shows 2x export multiplier during day phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            phaseStartTime: Date.now() - DAY_OFFSET - 60000, // 3 min into cycle = day
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Day phase: 2x export multiplier
      expect(screen.getByText('2x')).toBeInTheDocument();
    });

    it('shows 4x export multiplier during night phase', () => {
      renderWithContext({
        systems: {
          binary: createBinarySystem({
            phaseStartTime: Date.now() - NIGHT_OFFSET - 60000, // 11 min into cycle = night
          }),
        },
        ship: createMockShip({ currentSystem: 'binary' }),
      });

      // Night phase: 4x export multiplier (prime time for exports)
      expect(screen.getByText('4x')).toBeInTheDocument();
    });
  });

  // ============================================
  // NEBULA SYSTEM STATUS
  // ============================================

  describe('Nebula System Status', () => {
    const createNebulaSystem = (stateOverrides = {}): StarSystem =>
      createMockSystem({
        id: 'nebula',
        name: 'Nebula Cluster',
        type: 'nebula',
        unlocked: true,
        uniqueState: {
          density: 50,
          crystalsAvailable: 0,
          lastCrystalSpawn: Date.now(),
          ...stateOverrides,
        },
      });

    it('renders nebula density panel when at nebula system', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          nebula: createNebulaSystem(),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('Nebula Density')).toBeInTheDocument();
    });

    it('does not render nebula density when at home system', () => {
      renderWithContext({
        systems: {
          home: createMockSystem({ id: 'home', name: 'Home', unlocked: true }),
          nebula: createNebulaSystem(),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      expect(screen.queryByText('Nebula Density')).not.toBeInTheDocument();
    });

    it('displays sparse density level (0-25%)', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 15 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Sparse is shown in the display + in the reference bar
      const sparseElements = screen.getAllByText('Sparse');
      expect(sparseElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays dense density level (25-50%)', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 35 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      const denseElements = screen.getAllByText('Dense');
      expect(denseElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays thick density level (50-75%)', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 60 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      const thickElements = screen.getAllByText('Thick');
      expect(thickElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays critical density level (75-100%)', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      const criticalElements = screen.getAllByText('Critical');
      expect(criticalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows refinement multiplier', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 50 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Refinement section exists
      expect(screen.getByText('Refinement')).toBeInTheDocument();
    });

    it('shows production modifier', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 50 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Production section exists
      expect(screen.getByText('Production')).toBeInTheDocument();
    });

    it('shows base 3x refinement at sparse density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 10 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Sparse: 3.0x refinement
      expect(screen.getByText('3.0x')).toBeInTheDocument();
    });

    it('shows 3.8x refinement at thick density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 60 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Thick: 3.0 * 1.25 = 3.75, rounds to 3.8x
      expect(screen.getByText('3.8x')).toBeInTheDocument();
    });

    it('shows 4.5x refinement at critical density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Critical: 3.0 * 1.5 = 4.5x
      expect(screen.getByText('4.5x')).toBeInTheDocument();
    });

    it('shows crystals available notification when crystals > 0', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85, crystalsAvailable: 3 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText(/3 Essence Crystals available!/)).toBeInTheDocument();
    });

    it('does not show crystals notification when crystals = 0', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85, crystalsAvailable: 0 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.queryByText(/Essence Crystal/)).not.toBeInTheDocument();
    });

    it('shows critical warning at critical density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText(/Critical density! Auto-dispersion/)).toBeInTheDocument();
    });

    it('does not show critical warning below critical density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 60 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.queryByText(/Critical density!/)).not.toBeInTheDocument();
    });

    it('shows density level reference footer', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem(),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Reference footer shows all ranges
      expect(screen.getByText('0-25%')).toBeInTheDocument();
      expect(screen.getByText('25-50%')).toBeInTheDocument();
      expect(screen.getByText('50-75%')).toBeInTheDocument();
      expect(screen.getByText('75-100%')).toBeInTheDocument();
    });

    // Production modifier value tests (from review feedback)
    it('shows "No penalty" production at sparse density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 15 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('No penalty')).toBeInTheDocument();
    });

    it('shows -10% production at dense density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 35 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('shows -25% production at thick density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 60 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('shows -50% production at critical density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('-50%')).toBeInTheDocument();
    });

    // Boundary condition tests (from review feedback)
    // These test exact boundary values - the density level card shows percentage
    it('shows sparse at exactly 0% density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 0 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Verify density percentage display shows 0%
      expect(screen.getByText('0% density')).toBeInTheDocument();
      // Verify "No penalty" production (sparse behavior)
      expect(screen.getByText('No penalty')).toBeInTheDocument();
    });

    it('shows dense at exactly 25% density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 25 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Verify density percentage display shows 25%
      expect(screen.getByText('25% density')).toBeInTheDocument();
      // At 25%, production modifier is -10% (dense behavior)
      expect(screen.getByText('-10%')).toBeInTheDocument();
    });

    it('shows thick at exactly 50% density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 50 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Verify density percentage display shows 50%
      expect(screen.getByText('50% density')).toBeInTheDocument();
      // At 50%, production modifier is -25% (thick behavior)
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('shows critical at exactly 75% density', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 75 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      // Verify density percentage display shows 75%
      expect(screen.getByText('75% density')).toBeInTheDocument();
      // At 75%, production modifier is -50% (critical behavior)
      expect(screen.getByText('-50%')).toBeInTheDocument();
    });

    // Singular crystal grammar test (from review feedback)
    it('shows singular "Essence Crystal" for 1 crystal', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85, crystalsAvailable: 1 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText('1 Essence Crystal available!')).toBeInTheDocument();
    });

    // Warning message clarity test (updated from review feedback)
    it('shows specific warning about auto-dispersion at critical', () => {
      renderWithContext({
        systems: {
          nebula: createNebulaSystem({ density: 85 }),
        },
        ship: createMockShip({ currentSystem: 'nebula' }),
      });

      expect(screen.getByText(/Auto-dispersion at 100% will force harvest/)).toBeInTheDocument();
    });
  });

  // ============================================
  // BLACK HOLE SYSTEM STATUS
  // ============================================

  describe('Black Hole System Status', () => {
    const createBlackHoleSystem = (stateOverrides = {}): StarSystem =>
      createMockSystem({
        id: 'blackhole',
        name: 'Sagittarius A*',
        type: 'blackhole',
        unlocked: true,
        uniqueState: {
          planetStability: { terra: 80, mars: 60 },
          eventHorizonActive: false,
          collapsedPlanets: [],
          ...stateOverrides,
        },
      });

    it('renders black hole stability panel when at black hole system', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem(),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('Black Hole Stability')).toBeInTheDocument();
    });

    it('does not render black hole stability when at home system', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem(),
        },
        ship: createMockShip({ currentSystem: 'home' }),
      });

      expect(screen.queryByText('Black Hole Stability')).not.toBeInTheDocument();
    });

    it('displays stable status (75-100%)', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 90, mars: 85 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // Verify the percentage shows stable behavior (88% rounded from 87.5)
      expect(screen.getByText('88% average stability')).toBeInTheDocument();
      // The footer reference also shows "Stable" so we check the card shows stability > 75%
      expect(screen.getByRole('progressbar', { name: 'Average stability' })).toHaveAttribute(
        'aria-valuenow',
        '88'
      );
    });

    it('displays unstable status (50-75%)', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 60, mars: 65 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // 62.5 rounds to 63%
      expect(screen.getByText('63% average stability')).toBeInTheDocument();
    });

    it('displays critical status (25-50%)', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 35, mars: 40 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // 37.5 rounds to 38%
      expect(screen.getByText('38% average stability')).toBeInTheDocument();
    });

    it('displays collapsing status (<25%)', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 15, mars: 20 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // 17.5 rounds to 18%
      expect(screen.getByText('18% average stability')).toBeInTheDocument();
      // Only "Collapsing" should highlight in the footer reference
    });

    it('shows 10x production multiplier at stable', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 90 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('10x')).toBeInTheDocument();
    });

    it('shows 20x production during Event Horizon', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 40 },
            eventHorizonActive: true,
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // 10x base * 2 (event horizon) * 0.9 (unstable penalty) = 18, rounds to 18x
      // Actually with avgStability 40, status is "critical" (25-50), so 10 * 2 * 0.9 = 18
      expect(screen.getByText('18x')).toBeInTheDocument();
    });

    it('shows Event Horizon active status', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 40 },
            eventHorizonActive: true,
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('shows Event Horizon inactive status', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 80 },
            eventHorizonActive: false,
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('shows collapsed planets warning', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 80 },
            collapsedPlanets: ['mars', 'venus'],
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText(/2 planets collapsed!/)).toBeInTheDocument();
    });

    it('shows singular collapsed planet warning', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 80 },
            collapsedPlanets: ['mars'],
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText(/1 planet collapsed!/)).toBeInTheDocument();
    });

    it('shows Event Horizon imminent warning when all below 50%', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 45, mars: 40 },
            eventHorizonActive: false,
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText(/Event Horizon imminent!/)).toBeInTheDocument();
    });

    it('shows Event Horizon active alert', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 45 },
            eventHorizonActive: true,
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText(/Event Horizon active! 2x production/)).toBeInTheDocument();
    });

    it('shows stability level reference footer', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem(),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // Reference footer shows all ranges
      expect(screen.getByText('75-100%')).toBeInTheDocument();
      expect(screen.getByText('50-75%')).toBeInTheDocument();
      expect(screen.getByText('25-50%')).toBeInTheDocument();
      expect(screen.getByText('0-25%')).toBeInTheDocument();
    });

    // Boundary condition tests - verify exact boundaries work correctly
    it('shows stable at exactly 75% stability', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 75 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('75% average stability')).toBeInTheDocument();
      // At 75%, should show 10x production (full bonus)
      expect(screen.getByText('10x')).toBeInTheDocument();
    });

    it('shows unstable at exactly 50% stability', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 50 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('50% average stability')).toBeInTheDocument();
      // At 50%, production is 10 * 0.9 = 9x (unstable penalty)
      expect(screen.getByText('9x')).toBeInTheDocument();
    });

    it('shows critical at exactly 25% stability', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: { terra: 25 } }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      expect(screen.getByText('25% average stability')).toBeInTheDocument();
      // At 25%, production is 10 * 0.9 = 9x (penalty still applies)
      expect(screen.getByText('9x')).toBeInTheDocument();
    });

    // Edge case: empty planet stability (no planets yet)
    it('handles empty planetStability gracefully (defaults to 100%)', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({ planetStability: {} }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // Should show 100% average (default when no planets)
      expect(screen.getByText('100% average stability')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: 'Average stability' })).toHaveAttribute(
        'aria-valuenow',
        '100'
      );
      // With 100% stability, production should be 10x (full bonus)
      expect(screen.getByText('10x')).toBeInTheDocument();
      // Planet status summary should not show (no planets)
      expect(screen.queryByText('planets')).not.toBeInTheDocument();
    });

    // Mixed status counts display
    it('shows correct status counts with mixed stability', () => {
      renderWithContext({
        systems: {
          blackhole: createBlackHoleSystem({
            planetStability: { terra: 90, mars: 60, venus: 35, jupiter: 15 },
          }),
        },
        ship: createMockShip({ currentSystem: 'blackhole' }),
      });

      // Average: (90+60+35+15)/4 = 50% → unstable status
      expect(screen.getByText('50% average stability')).toBeInTheDocument();
      // Should show planet counts: 1 stable, 1 unstable, 1 critical, 1 collapsing
      expect(screen.getByText('planets')).toBeInTheDocument();
    });
  });
});
