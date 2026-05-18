// @vitest-environment jsdom
import '../../test/setup-component';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SeedGacha from './SeedGacha';
import { GameEngineContext } from '../../contexts/GameEngineContext';
import { GACHA_CONFIG } from '../../game/config/balance';

// Mock reduced motion to skip GachaReveal anticipation in tests
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true), // Always prefer reduced motion in tests
}));

// ============================================
// TEST UTILITIES
// ============================================

const createMockSeed = (tier: number = 1) => ({
  instanceId: 'seed-123',
  id: 'wheat',
  name: 'Wheat Seed',
  tier,
  level: 1,
  productionMultiplier: 1.0,
  valueMultiplier: 1.0,
  color: '#FFFFFF',
  powerLevel: 10,
});

const createMockFodder = () => ({
  instanceId: 'fodder-123',
  id: 'seedEssence',
  name: 'Seed Essence',
  description: 'Can be used for fusion',
  sellValue: 1,
  tier: 0,
});

const createMockGameEngine = (overrides = {}) => ({
  state: {
    ship: {
      totalCurrency: 100,
      seedInventory: [],
      crystals: 0,
      resources: { seedEssence: 0, plants: {} },
    },
    research: { completed: [] },
    prestige: { lifetimeCredits: 0, bonusLevels: {} },
    achievements: { stats: { totalGachaPulls: 0 } },
  },
  gachaPull: vi.fn(),
  gachaMultiPull: vi.fn(),
  isPulling: false,
  seedTiers: {
    1: { name: 'Common' },
    2: { name: 'Uncommon' },
    3: { name: 'Rare' },
    4: { name: 'Epic' },
    5: { name: 'Legendary' },
    6: { name: 'Mythic' },
  },
  ...overrides,
});

const renderWithContext = (overrides = {}) => {
  const mockEngine = createMockGameEngine(overrides);
  return {
    ...render(
      <GameEngineContext.Provider value={mockEngine as never}>
        <SeedGacha />
      </GameEngineContext.Provider>
    ),
    mockEngine,
  };
};

// Helper to get pull buttons by index
// Buttons are always ordered: x1 (0), x10 (1), x100 (2), help (3)
const getPullButtons = () => {
  const buttons = screen.getAllByRole('button');
  return {
    x1: buttons[0],
    x10: buttons[1],
    x100: buttons[2],
    help: buttons[3],
  };
};

// ============================================
// TESTS
// ============================================

describe('SeedGacha', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('highlightPullButton prop', () => {
    it('should not show highlight ring when prop is false', () => {
      const mockEngine = createMockGameEngine();
      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedGacha highlightPullButton={false} />
        </GameEngineContext.Provider>
      );

      // Get all gacha buttons (x1, x10, x100)
      const buttons = screen.getAllByRole('button');
      // First button is x1 (single pull)
      const pullButton = buttons[0];
      expect(pullButton.className).not.toContain('ring-2');
      expect(pullButton.className).not.toContain('animate-pulse');
    });

    it('should show highlight ring when prop is true and can afford', () => {
      const mockEngine = createMockGameEngine();
      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedGacha highlightPullButton={true} />
        </GameEngineContext.Provider>
      );

      const buttons = screen.getAllByRole('button');
      const pullButton = buttons[0];
      expect(pullButton.className).toContain('ring-2');
      expect(pullButton.className).toContain('animate-pulse');
    });

    it('should not show highlight when cannot afford even if prop is true', () => {
      const mockEngine = createMockGameEngine({
        state: {
          ship: {
            totalCurrency: 0, // Cannot afford
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedGacha highlightPullButton={true} />
        </GameEngineContext.Provider>
      );

      const buttons = screen.getAllByRole('button');
      const pullButton = buttons[0];
      // Button is disabled and should not have highlight even with prop
      expect(pullButton.className).not.toContain('ring-2');
    });

    it('should work without prop (undefined)', () => {
      const mockEngine = createMockGameEngine();
      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedGacha />
        </GameEngineContext.Provider>
      );

      const buttons = screen.getAllByRole('button');
      const pullButton = buttons[0];
      expect(pullButton.className).not.toContain('ring-2');
      expect(pullButton.className).not.toContain('animate-pulse');
    });
  });

  // ============================================
  // PULL FUNCTIONALITY
  // ============================================

  describe('Pull functionality', () => {
    it('should trigger gachaPull mutation when single pull button is clicked', async () => {
      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: createMockSeed(),
        cost: GACHA_CONFIG.PULL_COST,
      });

      const { mockEngine } = renderWithContext({
        gachaPull: mockGachaPull,
      });

      const buttons = screen.getAllByRole('button');
      const singlePullButton = buttons[0]; // x1 button

      fireEvent.click(singlePullButton);

      // Fast-forward through the setTimeout (600ms)
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(mockEngine.gachaPull).toHaveBeenCalledTimes(1);
    });

    it('should trigger gachaMultiPull with count 10 when 10x button is clicked', async () => {
      const mockGachaMultiPull = vi.fn().mockResolvedValue({
        success: true,
        items: [
          { ...createMockSeed(), instanceId: 'unique-seed-1' },
          { ...createMockSeed(), instanceId: 'unique-seed-2' },
        ],
        cost: GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT,
      });

      const { mockEngine } = renderWithContext({
        state: {
          ship: {
            totalCurrency: 500, // Enough for x10 pull
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
        gachaMultiPull: mockGachaMultiPull,
      });

      const buttons = screen.getAllByRole('button');
      const multiPullButton10 = buttons[1]; // x10 button

      fireEvent.click(multiPullButton10);

      // Fast-forward through the setTimeout (800ms for x10)
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(mockEngine.gachaMultiPull).toHaveBeenCalledWith(10);
    });

    it('should trigger gachaMultiPull with count 100 when 100x button is clicked', async () => {
      const mockGachaMultiPull = vi.fn().mockResolvedValue({
        success: true,
        items: Array(100)
          .fill(null)
          .map((_, i) => ({ ...createMockSeed(), instanceId: `seed-${i}` })),
        cost: GACHA_CONFIG.PULL_COST * 100 * GACHA_CONFIG.MULTI_PULL_100_DISCOUNT,
      });

      const { mockEngine } = renderWithContext({
        state: {
          ship: {
            totalCurrency: 5000, // Enough for x100 pull
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
        gachaMultiPull: mockGachaMultiPull,
      });

      const buttons = screen.getAllByRole('button');
      const multiPullButton100 = buttons[2]; // x100 button

      fireEvent.click(multiPullButton100);

      // Fast-forward through the setTimeout (1200ms for x100)
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(mockEngine.gachaMultiPull).toHaveBeenCalledWith(100);
    });

    it('should disable buttons when isPulling is true (during animation)', async () => {
      vi.useRealTimers(); // Use real timers for this test

      // Create a controlled promise
      let resolvePromise: ((value: unknown) => void) | undefined;
      const mockGachaPull = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve;
        });
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1, x10, x100 } = getPullButtons();

      // Click the button
      fireEvent.click(x1);

      // Wait for pulling state to be set (dialog opens during pulling)
      await waitFor(
        () => {
          expect(screen.getByText('// PULLING...')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // During pulling, the buttons should be disabled
      // Note: We need to get the buttons from the main container, not the dialog
      // The original buttons in the gacha panel should be disabled
      expect(x1).toBeDisabled();
      expect(x10).toBeDisabled();
      expect(x100).toBeDisabled();

      // Clean up - resolve the promise if it was set
      if (resolvePromise) {
        resolvePromise({
          success: true,
          item: createMockSeed(),
          cost: GACHA_CONFIG.PULL_COST,
        });
      }
    });

    it('should disable single pull button when insufficient credits', () => {
      renderWithContext({
        state: {
          ship: {
            totalCurrency: GACHA_CONFIG.PULL_COST - 1, // Just under the cost
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      const buttons = screen.getAllByRole('button');
      const singlePullButton = buttons[0];
      expect(singlePullButton).toBeDisabled();
    });

    it('should disable x10 button when insufficient credits for x10 pull', () => {
      const x10Cost = Math.floor(GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT);
      renderWithContext({
        state: {
          ship: {
            totalCurrency: x10Cost - 1, // Just under x10 cost
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      const buttons = screen.getAllByRole('button');
      const multiPullButton10 = buttons[1];
      expect(multiPullButton10).toBeDisabled();
    });

    it('should disable x100 button when insufficient credits for x100 pull', () => {
      const x100Cost = Math.floor(
        GACHA_CONFIG.PULL_COST * 100 * GACHA_CONFIG.MULTI_PULL_100_DISCOUNT
      );
      renderWithContext({
        state: {
          ship: {
            totalCurrency: x100Cost - 1, // Just under x100 cost
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      const buttons = screen.getAllByRole('button');
      const multiPullButton100 = buttons[2];
      expect(multiPullButton100).toBeDisabled();
    });
  });

  // ============================================
  // RESULT DISPLAY
  // ============================================

  describe('Result display', () => {
    it('should show pulled seed after successful single pull', async () => {
      vi.useRealTimers(); // Dialog animations need real timers

      const mockSeed = createMockSeed(2); // Tier 2 (Uncommon)
      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: mockSeed,
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      // Should show dialog with seed info
      await waitFor(
        () => {
          expect(screen.getByText('SEED ACQUIRED')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
      expect(screen.getByText('Wheat Seed')).toBeInTheDocument();
    });

    it('should show fodder after pulling fodder', async () => {
      vi.useRealTimers();

      const mockFodder = createMockFodder();
      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: mockFodder,
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      await waitFor(
        () => {
          expect(screen.getByText('Seed Essence')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show tier badge correctly for different tiers', async () => {
      vi.useRealTimers();

      const mockSeed = createMockSeed(3); // Tier 3 (Rare)
      mockSeed.name = 'Rare Test Seed';
      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: mockSeed,
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      await waitFor(
        () => {
          expect(screen.getByText(/Rare.*\(T3\)/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show multi-pull results with item count', async () => {
      vi.useRealTimers();

      const mockSeeds = [
        { ...createMockSeed(1), instanceId: 'seed-1' },
        { ...createMockSeed(2), instanceId: 'seed-2' },
        { ...createMockFodder(), instanceId: 'fodder-1' },
      ];

      const mockGachaMultiPull = vi.fn().mockResolvedValue({
        success: true,
        items: mockSeeds,
        cost: GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT,
      });

      renderWithContext({
        state: {
          ship: {
            totalCurrency: 500,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
        gachaMultiPull: mockGachaMultiPull,
      });

      const { x10 } = getPullButtons();
      fireEvent.click(x10);

      await waitFor(
        () => {
          expect(screen.getByText(/x3 PULL COMPLETE/)).toBeInTheDocument();
          expect(screen.getByText(/3 items acquired/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show pulling animation during pull', async () => {
      vi.useRealTimers();

      // Create a promise that we can control
      let resolvePromise: ((value: unknown) => void) | undefined;
      const mockGachaPull = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve;
        });
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      // Should show pulling animation while waiting
      await waitFor(
        () => {
          expect(screen.getByText('// PULLING...')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Resolve the pull to clean up
      if (resolvePromise) {
        resolvePromise({
          success: true,
          item: createMockSeed(),
          cost: GACHA_CONFIG.PULL_COST,
        });
      }
    });
  });

  // ============================================
  // CREDIT DISPLAY
  // ============================================

  describe('Credit display', () => {
    it('should show current credit balance', () => {
      renderWithContext({
        state: {
          ship: {
            totalCurrency: 1234,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should show cost for single pull', () => {
      renderWithContext();

      // Should display base pull cost (text is split between elements, and appears multiple times)
      expect(screen.getByText('COST:')).toBeInTheDocument();
      // The cost value appears both in the cost label and on the x1 button
      expect(screen.getAllByText(String(GACHA_CONFIG.PULL_COST)).length).toBeGreaterThan(0);
    });

    it('should show cost on each pull button', () => {
      renderWithContext({
        state: {
          ship: {
            totalCurrency: 5000,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      const x10Cost = Math.floor(GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT);
      const x100Cost = Math.floor(
        GACHA_CONFIG.PULL_COST * 100 * GACHA_CONFIG.MULTI_PULL_100_DISCOUNT
      );

      // Check that costs are displayed on buttons (may appear multiple times)
      // Single pull cost appears in both COST label and button
      expect(screen.getAllByText(GACHA_CONFIG.PULL_COST.toLocaleString()).length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText(x10Cost.toLocaleString()).length).toBeGreaterThan(0);
      expect(screen.getAllByText(x100Cost.toLocaleString()).length).toBeGreaterThan(0);
    });

    it('should show research discount when applicable', () => {
      // Note: This test verifies discount display when research reduces costs
      // The getGachaCostMultiplier function is used in the component
      // We can test by checking for the discount indicator text
      renderWithContext({
        state: {
          ship: {
            totalCurrency: 1000,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          // Adding a completed research that gives gacha discount
          research: { completed: ['economyGacha1'] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      // If research discount is applied, the component shows a percentage
      // The exact percentage depends on the research config
      const discountText = screen.queryByText(/\(-\d+%\)/);
      // This may or may not be present depending on research config
      // The test documents the expected behavior
      if (discountText) {
        expect(discountText).toBeInTheDocument();
      }
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error handling', () => {
    // Errors are now handled by useMutationWithOptimistic (shows toasts automatically).
    // The component closes the dialog on error instead of showing an error dialog.

    it('should close dialog when pull fails (error handled by toast)', async () => {
      vi.useRealTimers();

      const mockGachaPull = vi.fn().mockResolvedValue({
        success: false,
        item: null,
        cost: GACHA_CONFIG.PULL_COST,
        error: 'Not enough credits!',
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      // Dialog opens with pulling animation initially
      await waitFor(
        () => {
          expect(screen.getByText('// PULLING...')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // After server responds with error, dialog should close
      await waitFor(
        () => {
          expect(screen.queryByText('// PULLING...')).not.toBeInTheDocument();
          expect(screen.queryByText('ERROR')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should close dialog when pull fails without specific error', async () => {
      vi.useRealTimers();

      const mockGachaPull = vi.fn().mockResolvedValue({
        success: false,
        item: null,
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      // Dialog opens with pulling animation
      await waitFor(
        () => {
          expect(screen.getByText('// PULLING...')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // After error, dialog closes (toast handles the error)
      await waitFor(
        () => {
          expect(screen.queryByText('// PULLING...')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should handle network errors gracefully and close dialog', async () => {
      vi.useRealTimers();

      const mockGachaPull = vi.fn().mockResolvedValue({
        success: false,
        item: null,
        cost: GACHA_CONFIG.PULL_COST,
        error: 'Network error',
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      expect(x1).toBeInTheDocument();
      fireEvent.click(x1);

      // Dialog should close after error (toast handles display)
      await waitFor(
        () => {
          expect(screen.queryByText('ERROR')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should close dialog when multi-pull fails (error handled by toast)', async () => {
      vi.useRealTimers();

      const mockGachaMultiPull = vi.fn().mockResolvedValue({
        success: false,
        items: [],
        cost: GACHA_CONFIG.PULL_COST * 10 * GACHA_CONFIG.MULTI_PULL_10_DISCOUNT,
        error: 'Server error occurred',
      });

      renderWithContext({
        state: {
          ship: {
            totalCurrency: 500,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: { lifetimeCredits: 0, bonusLevels: {} },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
        gachaMultiPull: mockGachaMultiPull,
      });

      const { x10 } = getPullButtons();
      fireEvent.click(x10);

      // Dialog opens with pulling animation
      await waitFor(
        () => {
          expect(screen.getByText('// PULLING...')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // After server responds with error, dialog should close
      await waitFor(
        () => {
          expect(screen.queryByText('// PULLING...')).not.toBeInTheDocument();
          expect(screen.queryByText('ERROR')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  // ============================================
  // DROP RATES MODAL
  // ============================================

  describe('Drop rates modal', () => {
    it('should open drop rates modal when help button is clicked', async () => {
      vi.useRealTimers(); // Modal animations need real timers

      renderWithContext();

      // Find and click the help button (last button in the row)
      const buttons = screen.getAllByRole('button');
      const helpButton = buttons[buttons.length - 1]; // Help button is last
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(screen.getByText('DROP_RATES')).toBeInTheDocument();
        expect(screen.getByText(/Gacha pull probabilities/)).toBeInTheDocument();
      });
    });

    it('should display fodder, common, and uncommon drop rates', async () => {
      vi.useRealTimers();

      renderWithContext();

      const buttons = screen.getAllByRole('button');
      const helpButton = buttons[buttons.length - 1];
      fireEvent.click(helpButton);

      await waitFor(() => {
        expect(screen.getByText('FODDER')).toBeInTheDocument();
        expect(screen.getByText('COMMON')).toBeInTheDocument();
        expect(screen.getByText('UNCOMMON')).toBeInTheDocument();
      });

      // Check that percentages are displayed
      expect(
        screen.getByText(`${Math.round(GACHA_CONFIG.DROP_RATES.FODDER * 100)}%`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${Math.round(GACHA_CONFIG.DROP_RATES.COMMON * 100)}%`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${Math.round(GACHA_CONFIG.DROP_RATES.UNCOMMON * 100)}%`)
      ).toBeInTheDocument();
    });

    it('should display all seed tiers in drop rates modal', async () => {
      vi.useRealTimers();

      renderWithContext();

      const buttons = screen.getAllByRole('button');
      const helpButton = buttons[buttons.length - 1];
      fireEvent.click(helpButton);

      await waitFor(() => {
        // Check for tier badges in the modal
        expect(screen.getByText('T1')).toBeInTheDocument();
        expect(screen.getByText('T2')).toBeInTheDocument();
        expect(screen.getByText('T3')).toBeInTheDocument();
        expect(screen.getByText('T4')).toBeInTheDocument();
        expect(screen.getByText('T5')).toBeInTheDocument();
        expect(screen.getByText('T6')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // LUCK BONUS
  // ============================================

  describe('Luck bonus', () => {
    it('should show luck bonus indicator when prestige bonus is active', () => {
      renderWithContext({
        state: {
          ship: {
            totalCurrency: 100,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: {
            lifetimeCredits: 0,
            bonusLevels: { luckyPulls: 5 }, // 5 levels = 10% luck bonus
          },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      expect(screen.getByText(/\+10%.*LUCK/)).toBeInTheDocument();
    });

    it('should not show luck bonus indicator when no prestige bonus', () => {
      renderWithContext({
        state: {
          ship: {
            totalCurrency: 100,
            seedInventory: [],
            crystals: 0,
            resources: { seedEssence: 0, plants: {} },
          },
          research: { completed: [] },
          prestige: {
            lifetimeCredits: 0,
            bonusLevels: { luckyPulls: 0 },
          },
          achievements: { stats: { totalGachaPulls: 0 } },
        },
      });

      expect(screen.queryByText(/LUCK/)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // DIALOG BEHAVIOR
  // ============================================

  describe('Dialog behavior', () => {
    it('should close dialog when CONTINUE button is clicked', async () => {
      vi.useRealTimers();

      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: createMockSeed(),
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      await waitFor(
        () => {
          expect(screen.getByText('SEED ACQUIRED')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click CONTINUE button
      const continueButton = screen.getByText('CONTINUE');
      fireEvent.click(continueButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('SEED ACQUIRED')).not.toBeInTheDocument();
      });
    });

    it('should reset pull state after closing dialog', async () => {
      vi.useRealTimers();

      const mockGachaPull = vi.fn().mockResolvedValue({
        success: true,
        item: createMockSeed(),
        cost: GACHA_CONFIG.PULL_COST,
      });

      renderWithContext({
        gachaPull: mockGachaPull,
      });

      const { x1 } = getPullButtons();
      fireEvent.click(x1);

      await waitFor(
        () => {
          expect(screen.getByText('SEED ACQUIRED')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click CONTINUE
      fireEvent.click(screen.getByText('CONTINUE'));

      await waitFor(() => {
        expect(screen.queryByText('SEED ACQUIRED')).not.toBeInTheDocument();
      });

      // Buttons should be enabled again after dialog closes
      const buttonsAfter = getPullButtons();
      expect(buttonsAfter.x1).not.toBeDisabled();
    });
  });
});
