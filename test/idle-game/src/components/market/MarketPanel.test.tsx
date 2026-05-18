/**
 * MarketPanel Component Tests
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarketPanel from './MarketPanel';
import { GameEngineContext, useGame } from '../../contexts/GameEngineContext';
import type { MarketState } from '../../game/systems/MarketSystem';

// Type for the game context (inferred from useGame hook)
type GameContextValue = ReturnType<typeof useGame>;

// ============================================
// TEST UTILITIES
// ============================================

const createMockMarketState = (overrides: Partial<MarketState> = {}): MarketState => ({
  priceMultipliers: {
    wheat: 1.0,
    corn: 1.0,
    rice: 1.0,
    soybean: 1.0,
    cotton: 1.0,
    sunflower: 1.0,
    moonflower: 1.0,
    nightshade: 1.0,
    lunar_moss: 1.0,
    starbloom: 1.0,
    nebula_fern: 1.0,
    cosmic_orchid: 1.0,
  },
  lastUpdateTime: Date.now() - 60000, // 1 minute ago
  priceHistory: [],
  enabled: true,
  ...overrides,
});

interface MockGameContextOptions {
  market?: MarketState;
  plants?: Record<string, number>;
}

const createMockGameContext = (options: MockGameContextOptions = {}): GameContextValue => {
  const { market = createMockMarketState(), plants = {} } = options;

  return {
    state: {
      ship: {
        resources: {
          plants,
        },
      },
      market,
    } as GameContextValue['state'],
    dispatch: vi.fn(),
    actions: {
      // Stub all actions used by market panel (none currently, but prevents crashes)
      sellPlant: vi.fn(),
      sellAllPlants: vi.fn(),
    } as unknown as GameContextValue['actions'],
  };
};

const renderWithContext = (options: MockGameContextOptions = {}) => {
  const mockContext = createMockGameContext(options);

  return render(
    <GameEngineContext.Provider value={mockContext}>
      <MarketPanel />
    </GameEngineContext.Provider>
  );
};

// ============================================
// TESTS
// ============================================

describe('MarketPanel', () => {
  describe('Market Summary Card', () => {
    it('should render Galactic Market title', () => {
      renderWithContext();

      expect(screen.getByText('Galactic Market')).toBeInTheDocument();
    });

    it('should display price count indicators', () => {
      // Set up market with some high and low prices
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 1.25, // high (>= 1.15)
          corn: 1.3, // high
          rice: 0.75, // low (<= 0.85)
          soybean: 1.0, // neutral
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({ market });

      // Should show count of high prices (e.g., "2 high")
      expect(screen.getByText(/\d+ high/)).toBeInTheDocument();
      // Should show count of low prices (e.g., "1 low")
      expect(screen.getByText(/\d+ low/)).toBeInTheDocument();
    });

    it('should display time until next update', () => {
      renderWithContext();

      // Should show "Updates in Xm" format
      expect(screen.getByText(/Updates in \d+m/)).toBeInTheDocument();
    });
  });

  describe('Best Sell Opportunity', () => {
    it('should display best opportunity when player has plants at good prices', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 1.2, // 20% above base (good opportunity)
          corn: 0.9,
          rice: 1.0,
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({
        market,
        plants: { wheat: 100 }, // Player owns wheat
      });

      expect(screen.getByText(/Best sell opportunity/i)).toBeInTheDocument();
      // The opportunity box shows "Wheat Seeds at +20%"
      expect(screen.getByText(/Wheat Seeds at/i)).toBeInTheDocument();
    });

    it('should not show best opportunity when no owned plants have good prices', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 0.9, // below threshold
          corn: 0.85,
          rice: 1.0,
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({
        market,
        plants: { wheat: 100 },
      });

      expect(screen.queryByText(/Best sell opportunity/i)).not.toBeInTheDocument();
    });
  });

  describe('Your Plants Section', () => {
    it('should display owned plants section when player has plants', () => {
      renderWithContext({
        plants: { wheat: 50, corn: 30 },
      });

      expect(screen.getByText('Your Plants')).toBeInTheDocument();
    });

    it('should not display owned plants section when player has no plants', () => {
      renderWithContext({
        plants: {},
      });

      expect(screen.queryByText('Your Plants')).not.toBeInTheDocument();
    });

    it('should show storage amount for owned plants', () => {
      renderWithContext({
        plants: { wheat: 150 },
      });

      // Storage appears in both "Your Plants" and "All Market Prices" sections
      const storageTexts = screen.getAllByText(/150.*in storage/i);
      expect(storageTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('All Market Prices Section', () => {
    it('should display all market prices section', () => {
      renderWithContext();

      expect(screen.getByText('All Market Prices')).toBeInTheDocument();
    });

    it('should show all seed types in market list', () => {
      renderWithContext();

      // Check for a few known seed types (names include "Seeds" suffix)
      expect(screen.getAllByText(/Wheat Seeds/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Corn Seeds/i).length).toBeGreaterThan(0);
    });
  });

  describe('Price Row Styling', () => {
    it('should display positive percentage for good prices', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 1.25, // High price (>= 1.15)
          corn: 1.0,
          rice: 1.0,
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({ market });

      // Verify the +25% text appears (semantic: the price change is visible)
      expect(screen.getByText('+25%')).toBeInTheDocument();
      // Verify wheat is listed
      expect(screen.getAllByText(/Wheat Seeds/i).length).toBeGreaterThan(0);
    });

    it('should display negative percentage for bad prices', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 0.75, // Low price (<= 0.85)
          corn: 1.0,
          rice: 1.0,
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({ market });

      // Verify the -25% text appears (semantic: the price change is visible)
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('should show price multiplier as percentage change', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 1.25, // +25%
          corn: 0.8, // -20%
          rice: 1.0, // 0%
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      renderWithContext({ market });

      // Should format as +25% or -20%
      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });
  });

  describe('Trend Icons', () => {
    it('should show trending price information with history', () => {
      // Market with price history showing upward trend
      const market = createMockMarketState({
        priceMultipliers: { wheat: 1.25 },
        priceHistory: [
          { timestamp: Date.now() - 300000, multipliers: { wheat: 1.15 } },
          { timestamp: Date.now() - 600000, multipliers: { wheat: 1.05 } },
        ],
      });

      renderWithContext({ market });

      // Verify the wheat row renders with the +25% price
      expect(screen.getByText('+25%')).toBeInTheDocument();
      // The wheat seeds should be displayed
      expect(screen.getAllByText(/Wheat Seeds/i).length).toBeGreaterThan(0);
    });

    it('should show negative trends with falling prices', () => {
      const market = createMockMarketState({
        priceMultipliers: { wheat: 0.75 },
        priceHistory: [
          { timestamp: Date.now() - 300000, multipliers: { wheat: 0.85 } },
          { timestamp: Date.now() - 600000, multipliers: { wheat: 0.95 } },
        ],
      });

      renderWithContext({ market });

      // Verify the wheat row renders with negative price change
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });
  });

  describe('Price Per Plant Display', () => {
    it('should show current value per plant', () => {
      const market = createMockMarketState({
        priceMultipliers: { wheat: 1.0 },
      });

      renderWithContext({ market });

      // Should show "per plant" label
      const perPlantLabels = screen.getAllByText(/per plant/i);
      expect(perPlantLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Market Info Footer', () => {
    it('should display market information text', () => {
      renderWithContext();

      expect(screen.getByText(/Prices fluctuate every 5 minutes/i)).toBeInTheDocument();
      expect(screen.getByText(/Sell when prices are high/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort plants by multiplier (best prices first)', () => {
      const market = createMockMarketState({
        priceMultipliers: {
          wheat: 0.8, // Low (-20%)
          corn: 1.4, // Highest (+40%)
          rice: 1.2, // Medium high (+20%)
          soybean: 1.0,
          cotton: 1.0,
          sunflower: 1.0,
          moonflower: 1.0,
          nightshade: 1.0,
          lunar_moss: 1.0,
          starbloom: 1.0,
          nebula_fern: 1.0,
          cosmic_orchid: 1.0,
        },
      });

      const { container } = renderWithContext({ market });

      // Get all percentage values in order from the DOM
      // Corn (+40%) should appear before Rice (+20%) which should appear before Wheat (-20%)
      const allText = container.textContent || '';
      const cornPos = allText.indexOf('+40%');
      const ricePos = allText.indexOf('+20%');
      const wheatPos = allText.indexOf('-20%');

      // Higher prices should appear earlier in the list
      expect(cornPos).toBeLessThan(ricePos);
      expect(ricePos).toBeLessThan(wheatPos);
    });
  });

  describe('Edge Cases', () => {
    it('should render gracefully when market is disabled', () => {
      // Market system has an enabled flag - verify component handles it
      const market = createMockMarketState({ enabled: false });
      renderWithContext({ market });

      // Component should still render (currently doesn't check enabled flag)
      // This documents the current behavior: disabled market still shows prices
      expect(screen.getByText('Galactic Market')).toBeInTheDocument();
      expect(screen.getByText('All Market Prices')).toBeInTheDocument();
    });

    it('should handle all neutral prices (multiplier = 1.0)', () => {
      // All prices exactly at base value
      const market = createMockMarketState();
      renderWithContext({ market });

      // Should show 0 high and 0 low
      expect(screen.getByText('0 high')).toBeInTheDocument();
      expect(screen.getByText('0 low')).toBeInTheDocument();
    });

    it('should handle empty price history gracefully', () => {
      const market = createMockMarketState({
        priceHistory: [],
      });
      renderWithContext({ market });

      // Should render without errors
      expect(screen.getByText('Galactic Market')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading for the market panel', () => {
      renderWithContext();

      // Main title should be present
      expect(screen.getByText('Galactic Market')).toBeInTheDocument();
    });

    it('should have descriptive section headers', () => {
      renderWithContext({ plants: { wheat: 10 } });

      expect(screen.getByText('Your Plants')).toBeInTheDocument();
      expect(screen.getByText('All Market Prices')).toBeInTheDocument();
    });
  });
});
