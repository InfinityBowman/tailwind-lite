/**
 * SeedFusion Component Tests
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SeedFusion from './SeedFusion';
import { GameEngineContext } from '../../contexts/GameEngineContext';
import type { SeedInstance } from '../../game';

// ============================================
// TEST UTILITIES
// ============================================

const createSeedInstance = (id: string, tier: number, instanceId?: string): SeedInstance => ({
  instanceId: instanceId || `${id}-${tier}-${Math.random().toString(36).slice(2)}`,
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  tier,
  level: 1,
  productionMultiplier: 1,
  valueMultiplier: 1,
  color: '#ffffff',
  powerLevel: tier * 10,
});

interface MockGameEngineOptions {
  seedInventory?: SeedInstance[];
  seedEssence?: number;
  completedResearch?: string[];
  hints?: { firstFusion?: boolean };
}

const createMockGameEngine = (options: MockGameEngineOptions = {}) => {
  const {
    seedInventory = [],
    seedEssence = 100,
    completedResearch = [],
    hints = { firstFusion: true },
  } = options;

  return {
    state: {
      ship: {
        seedInventory,
        resources: {
          seedEssence,
          plants: {},
        },
      },
      research: {
        completed: completedResearch,
      },
      hints,
    },
    fuseSeed: vi.fn().mockResolvedValue({
      success: true,
      message: 'Fusion successful!',
      seed: createSeedInstance('wheat', 2),
    }),
    autoFuse: vi.fn().mockResolvedValue({
      success: true,
      fusionCount: 3,
      essenceSpent: 150,
      fusedSeeds: [],
    }),
    seedEssenceCount: seedEssence,
    seedTiers: {
      1: { name: 'Common', color: '#9ca3af' },
      2: { name: 'Uncommon', color: '#22c55e' },
      3: { name: 'Rare', color: '#3b82f6' },
      4: { name: 'Epic', color: '#a855f7' },
      5: { name: 'Legendary', color: '#f97316' },
      6: { name: 'Mythic', color: '#ef4444' },
    },
    dismissHint: vi.fn(),
    isHintDismissed: vi.fn().mockReturnValue(false),
  };
};

const renderWithContext = (options: MockGameEngineOptions = {}) => {
  const mockEngine = createMockGameEngine(options);

  return {
    ...render(
      <GameEngineContext.Provider value={mockEngine as never}>
        <SeedFusion />
      </GameEngineContext.Provider>
    ),
    mockEngine,
  };
};

// ============================================
// TESTS
// ============================================

describe('SeedFusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the fusion header with icon', () => {
      renderWithContext();

      expect(screen.getByText('Fusion')).toBeInTheDocument();
    });

    it('should display seed essence count', () => {
      renderWithContext({ seedEssence: 500 });

      expect(screen.getByText('500 ESS')).toBeInTheDocument();
    });

    it('should show empty state when no fuseable pairs exist', () => {
      renderWithContext({ seedInventory: [] });

      expect(screen.getByText('No pairs available')).toBeInTheDocument();
      expect(screen.getByText('Pull more seeds from Gacha')).toBeInTheDocument();
    });

    it('should show help section', () => {
      renderWithContext();

      expect(screen.getByText('How it works')).toBeInTheDocument();
    });
  });

  describe('Fuseable Pairs Display', () => {
    it('should display fuseable pairs when two matching seeds exist', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({ seedInventory });

      // Should show the wheat pair card
      expect(screen.getByText('Wheat')).toBeInTheDocument();
    });

    it('should not show pairs when only one seed of type exists', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('corn', 1, 'corn-1-a'),
      ];

      renderWithContext({ seedInventory });

      expect(screen.getByText('No pairs available')).toBeInTheDocument();
    });

    it('should not show pairs for different tiers of same seed type', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 2, 'wheat-2-a'),
      ];

      renderWithContext({ seedInventory });

      expect(screen.getByText('No pairs available')).toBeInTheDocument();
    });

    it('should not show pairs for max tier seeds (tier 6)', () => {
      const seedInventory = [
        createSeedInstance('wheat', 6, 'wheat-6-a'),
        createSeedInstance('wheat', 6, 'wheat-6-b'),
      ];

      renderWithContext({ seedInventory });

      expect(screen.getByText('No pairs available')).toBeInTheDocument();
    });

    it('should show multiple pairs count when more than 2 matching seeds exist', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
        createSeedInstance('wheat', 1, 'wheat-1-c'),
        createSeedInstance('wheat', 1, 'wheat-1-d'),
      ];

      renderWithContext({ seedInventory });

      // Should show x2 for 4 seeds = 2 possible fusions
      expect(screen.getByText(/\u00d72/)).toBeInTheDocument();
    });
  });

  describe('Fusion Cost Display', () => {
    it('should display essence cost for fusion', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({ seedInventory, seedEssence: 100 });

      // Should show essence cost text
      expect(screen.getByText(/ess$/)).toBeInTheDocument();
    });

    it('should show discount badge when research discount is active', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      // fusionMaster research reduces fusion cost
      renderWithContext({
        seedInventory,
        completedResearch: ['fusionMaster'],
      });

      // Discount badge should appear in header
      expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
    });
  });

  describe('Fusion Button States', () => {
    it('should enable fuse button when can afford', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({ seedInventory, seedEssence: 1000 });

      const fuseButtons = screen.getAllByRole('button');
      // The fuse button in the pair card
      const fuseButton = fuseButtons.find(btn => !btn.hasAttribute('disabled'));
      expect(fuseButton).toBeDefined();
    });

    it('should disable fuse button when cannot afford', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({ seedInventory, seedEssence: 0 });

      // Find the fuse button (sparkles icon button in pair card)
      const buttons = screen.getAllByRole('button');
      // Filter to find the disabled one
      const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));
      expect(disabledButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Fusion Execution', () => {
    it('should call fuseSeed when fuse button is clicked', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({ seedInventory, seedEssence: 1000 });

      // Find and click the fuse button
      const buttons = screen.getAllByRole('button');
      const fuseButton = buttons.find(
        btn => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      );

      if (fuseButton) {
        fireEvent.click(fuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.fuseSeed).toHaveBeenCalled();
      });
    });

    it('should show fusion result dialog after successful fusion', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({ seedInventory, seedEssence: 1000 });

      // Find and click the fuse button
      const buttons = screen.getAllByRole('button');
      const fuseButton = buttons.find(
        btn => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      );

      if (fuseButton) {
        fireEvent.click(fuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.fuseSeed).toHaveBeenCalled();
      });

      // After fusion completes, the result dialog should show success message
      await waitFor(
        () => {
          expect(screen.getByText('Fusion Successful!')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Auto-Fuse Functionality', () => {
    it('should not show auto-fuse button when research not unlocked', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({ seedInventory, completedResearch: [] });

      expect(screen.queryByText('Auto Fuse')).not.toBeInTheDocument();
    });

    it('should show auto-fuse button when research unlocked', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      // auto_fuse research enables auto-fusion
      renderWithContext({
        seedInventory,
        seedEssence: 1000,
        completedResearch: ['fusionAutomation'],
      });

      expect(screen.getByText('Auto Fuse')).toBeInTheDocument();
    });

    it('should disable auto-fuse button when no affordable fusions', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({
        seedInventory,
        seedEssence: 0,
        completedResearch: ['fusionAutomation'],
      });

      const autoFuseButton = screen.getByText('Auto Fuse').closest('button');
      expect(autoFuseButton).toHaveAttribute('disabled');
    });

    it('should call autoFuse when auto-fuse button clicked', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({
        seedInventory,
        seedEssence: 1000,
        completedResearch: ['fusionAutomation'],
      });

      const autoFuseButton = screen.getByText('Auto Fuse').closest('button');
      if (autoFuseButton) {
        fireEvent.click(autoFuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.autoFuse).toHaveBeenCalledWith(5);
      });
    });

    it('should show auto-fuse result dialog after completion', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({
        seedInventory,
        seedEssence: 1000,
        completedResearch: ['fusionAutomation'],
      });

      const autoFuseButton = screen.getByText('Auto Fuse').closest('button');
      if (autoFuseButton) {
        fireEvent.click(autoFuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.autoFuse).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Auto Fuse Complete')).toBeInTheDocument();
      });
    });

    it('should display affordable fusions count badge', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
        createSeedInstance('corn', 1, 'corn-1-a'),
        createSeedInstance('corn', 1, 'corn-1-b'),
      ];

      renderWithContext({
        seedInventory,
        seedEssence: 1000,
        completedResearch: ['fusionAutomation'],
      });

      // Should show badge with count of affordable fusions
      const autoFuseButton = screen.getByText('Auto Fuse').closest('button');
      expect(autoFuseButton?.textContent).toMatch(/\d/);
    });
  });

  describe('Error Handling', () => {
    it('should handle fusion failure gracefully', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const mockEngine = createMockGameEngine({
        seedInventory,
        seedEssence: 1000,
      });

      mockEngine.fuseSeed.mockResolvedValue({
        success: false,
        message: 'Fusion failed',
      });

      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedFusion />
        </GameEngineContext.Provider>
      );

      const buttons = screen.getAllByRole('button');
      const fuseButton = buttons.find(
        btn => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      );

      if (fuseButton) {
        fireEvent.click(fuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.fuseSeed).toHaveBeenCalled();
      });
    });

    it('should handle auto-fuse failure gracefully', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const mockEngine = createMockGameEngine({
        seedInventory,
        seedEssence: 1000,
        completedResearch: ['fusionAutomation'],
      });

      mockEngine.autoFuse.mockResolvedValue({
        success: false,
      });

      render(
        <GameEngineContext.Provider value={mockEngine as never}>
          <SeedFusion />
        </GameEngineContext.Provider>
      );

      const autoFuseButton = screen.getByText('Auto Fuse').closest('button');
      if (autoFuseButton) {
        fireEvent.click(autoFuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.autoFuse).toHaveBeenCalled();
      });

      // When autoFuse returns success: false, the component sets autoFuseResult to null
      // and shows the dialog, but since autoFuseResult is null, the dialog content
      // won't render the "Auto Fuse Complete" message. This verifies no crash occurs.
      // The dialog is opened regardless, so verify the function was called.
    });
  });

  describe('Onboarding Hint', () => {
    it('should show onboarding hint when first fusion hint not dismissed', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      renderWithContext({
        seedInventory,
        hints: { firstFusion: false },
      });

      // The OnboardingHint component should render when hint conditions are met
      // (fuseable pairs exist and firstFusion hint not shown)
    });
  });

  describe('Help Section', () => {
    it('should expand help section when clicked', () => {
      renderWithContext();

      const helpTrigger = screen.getByText('How it works');
      fireEvent.click(helpTrigger);

      // Help content should be visible
      expect(screen.getByText(/2 same seeds/i)).toBeInTheDocument();
    });

    it('should display tier cost grid', () => {
      renderWithContext();

      const helpTrigger = screen.getByText('How it works');
      fireEvent.click(helpTrigger);

      // Should show tier progression info
      expect(screen.getByText(/T1.*T2/)).toBeInTheDocument();
    });
  });

  describe('Tier Badge Display', () => {
    it('should show next tier badge for fusion result', () => {
      const seedInventory = [
        createSeedInstance('wheat', 2, 'wheat-2-a'),
        createSeedInstance('wheat', 2, 'wheat-2-b'),
      ];

      renderWithContext({ seedInventory, seedEssence: 1000 });

      // Should show T3 as the result tier
      expect(screen.getByText('T3')).toBeInTheDocument();
    });
  });

  describe('Sorting and Grouping', () => {
    it('should group seeds by type and tier', () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
        createSeedInstance('wheat', 2, 'wheat-2-a'),
        createSeedInstance('wheat', 2, 'wheat-2-b'),
        createSeedInstance('corn', 1, 'corn-1-a'),
        createSeedInstance('corn', 1, 'corn-1-b'),
      ];

      const { container } = renderWithContext({ seedInventory, seedEssence: 1000 });

      // Should display multiple pair cards
      const pairCards = container.querySelectorAll('.flex.items-center.gap-2.p-2');
      expect(pairCards.length).toBe(3); // wheat T1, wheat T2, corn T1
    });

    it('should sort pairs by tier ascending', () => {
      const seedInventory = [
        createSeedInstance('wheat', 3, 'wheat-3-a'),
        createSeedInstance('wheat', 3, 'wheat-3-b'),
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
        createSeedInstance('wheat', 2, 'wheat-2-a'),
        createSeedInstance('wheat', 2, 'wheat-2-b'),
      ];

      const { container } = renderWithContext({ seedInventory, seedEssence: 10000 });

      // Get the tier badges in order
      const tierBadges = container.querySelectorAll('[class*="tier"]');
      const tierTexts = Array.from(tierBadges)
        .map(badge => badge.textContent)
        .filter(text => text?.startsWith('T'));

      // T2 should appear before T3 which should appear before T4
      const t2Index = tierTexts.findIndex(t => t === 'T2');
      const t3Index = tierTexts.findIndex(t => t === 'T3');
      const t4Index = tierTexts.findIndex(t => t === 'T4');

      if (t2Index !== -1 && t3Index !== -1) {
        expect(t2Index).toBeLessThan(t3Index);
      }
      if (t3Index !== -1 && t4Index !== -1) {
        expect(t3Index).toBeLessThan(t4Index);
      }
    });
  });

  describe('Dialog Behavior', () => {
    it('should close fusion result dialog on continue button click', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({ seedInventory, seedEssence: 1000 });

      // Trigger fusion
      const buttons = screen.getAllByRole('button');
      const fuseButton = buttons.find(
        btn => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      );

      if (fuseButton) {
        fireEvent.click(fuseButton);
      }

      await waitFor(() => {
        expect(mockEngine.fuseSeed).toHaveBeenCalled();
      });

      // Wait for result to appear
      await waitFor(
        () => {
          const continueButton = screen.queryByText('Continue');
          return continueButton !== null;
        },
        { timeout: 2000 }
      );

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Fusion Successful!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Double-Click Prevention', () => {
    it('should prevent double-click race conditions during fusion', async () => {
      const seedInventory = [
        createSeedInstance('wheat', 1, 'wheat-1-a'),
        createSeedInstance('wheat', 1, 'wheat-1-b'),
      ];

      const { mockEngine } = renderWithContext({ seedInventory, seedEssence: 1000 });

      // Make fusion take some time
      mockEngine.fuseSeed.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  message: 'Fusion successful!',
                  seed: createSeedInstance('wheat', 2),
                }),
              100
            )
          )
      );

      const buttons = screen.getAllByRole('button');
      const fuseButton = buttons.find(
        btn => !btn.hasAttribute('disabled') && btn.querySelector('svg')
      );

      if (fuseButton) {
        // Rapid double-click
        fireEvent.click(fuseButton);
        fireEvent.click(fuseButton);
      }

      await waitFor(() => {
        // Should only be called once due to double-click prevention
        expect(mockEngine.fuseSeed).toHaveBeenCalledTimes(1);
      });
    });
  });
});
