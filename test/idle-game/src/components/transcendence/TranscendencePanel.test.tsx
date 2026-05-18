/**
 * TranscendencePanel Component Tests
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TranscendencePanel from './TranscendencePanel';
import { GameEngineContext } from '../../contexts/GameEngineContext';
import { TRANSCENDENCE_CONFIG, TRANSCENDENCE_BONUSES } from '../../game/config/transcendence';

// ============================================
// TEST UTILITIES
// ============================================

interface MockTranscendenceState {
  transcendenceLevel: number;
  transcendencePoints: number;
  totalTranscendencePointsEarned: number;
  bonusLevels: Record<string, number>;
}

interface MockPrestigeState {
  prestigeLevel: number;
  prestigePoints: number;
  bonusLevels: Record<string, number>;
  lifetimeCredits: number;
}

interface MockGameContextOptions {
  transcendence?: Partial<MockTranscendenceState>;
  prestige?: Partial<MockPrestigeState>;
  canTranscend?: boolean;
  potentialPoints?: number;
  reason?: string;
}

const createMockTranscendenceState = (
  overrides: Partial<MockTranscendenceState> = {}
): MockTranscendenceState => ({
  transcendenceLevel: 0,
  transcendencePoints: 0,
  totalTranscendencePointsEarned: 0,
  bonusLevels: {},
  ...overrides,
});

const createMockPrestigeState = (
  overrides: Partial<MockPrestigeState> = {}
): MockPrestigeState => ({
  prestigeLevel: 0,
  prestigePoints: 0,
  bonusLevels: {},
  lifetimeCredits: 0,
  ...overrides,
});

const createMockGameContext = (options: MockGameContextOptions = {}) => {
  const {
    transcendence = {},
    prestige = {},
    canTranscend: canTranscendValue = false,
    potentialPoints = 0,
    reason = 'Need higher prestige level',
  } = options;

  const transcendenceState = createMockTranscendenceState(transcendence);
  const prestigeState = createMockPrestigeState(prestige);

  // Create bonuses with state
  const bonusesWithState = Object.values(TRANSCENDENCE_BONUSES).map(bonus => ({
    bonus,
    currentLevel: transcendenceState.bonusLevels[bonus.id] || 0,
    currentValue: bonus.baseValue * (transcendenceState.bonusLevels[bonus.id] || 0),
    nextCost: bonus.costPerLevel,
    isMaxed: (transcendenceState.bonusLevels[bonus.id] || 0) >= bonus.maxLevel,
  }));

  return {
    state: {
      transcendence: transcendenceState,
      prestige: prestigeState,
    },
    canTranscend: vi.fn(() => ({
      canTranscend: canTranscendValue,
      potentialPoints,
      reason: canTranscendValue ? undefined : reason,
    })),
    transcend: vi.fn().mockResolvedValue({ success: true }),
    purchaseTranscendenceBonus: vi.fn().mockResolvedValue({ success: true }),
    getTranscendenceBonuses: vi.fn(() => bonusesWithState),
    getProjectedTranscendencePoints: vi.fn((prestigeLevel: number) =>
      prestigeLevel >= TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL
        ? Math.floor(prestigeLevel / TRANSCENDENCE_CONFIG.PRESTIGE_LEVELS_PER_POINT)
        : 0
    ),
  };
};

const renderWithContext = (options: MockGameContextOptions = {}) => {
  const mockContext = createMockGameContext(options);

  return {
    ...render(
      <GameEngineContext.Provider value={mockContext as never}>
        <TranscendencePanel />
      </GameEngineContext.Provider>
    ),
    mockContext,
  };
};

// ============================================
// TESTS
// ============================================

describe('TranscendencePanel', () => {
  describe('Header Stats Display', () => {
    it('should render Transcendence title', () => {
      renderWithContext();

      expect(screen.getByText('Transcendence')).toBeInTheDocument();
    });

    it('should display transcendence level badge', () => {
      renderWithContext({
        transcendence: { transcendenceLevel: 3 },
      });

      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });

    it('should display transcendence points badge', () => {
      renderWithContext({
        transcendence: { transcendencePoints: 15 },
      });

      expect(screen.getByText('15 Points')).toBeInTheDocument();
    });

    it('should display zero values for new player', () => {
      renderWithContext();

      expect(screen.getByText('Level 0')).toBeInTheDocument();
      expect(screen.getByText('0 Points')).toBeInTheDocument();
    });
  });

  describe('Transcendence Requirements Display', () => {
    it('should display current prestige level', () => {
      renderWithContext({
        prestige: { prestigeLevel: 15 },
      });

      expect(screen.getByText('Current Prestige Level')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display required prestige level threshold', () => {
      renderWithContext();

      expect(screen.getByText('Required Level')).toBeInTheDocument();
      expect(screen.getByText(String(TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL))).toBeInTheDocument();
    });

    it('should show progress bar', () => {
      renderWithContext({
        prestige: { prestigeLevel: 12 },
      });

      // Progress bar should be present
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show info text when cannot transcend', () => {
      renderWithContext({
        canTranscend: false,
        prestige: { prestigeLevel: 10 },
      });

      expect(
        screen.getByText(
          `Reach Prestige Level ${TRANSCENDENCE_CONFIG.MIN_PRESTIGE_LEVEL} to unlock Transcendence`
        )
      ).toBeInTheDocument();
    });
  });

  describe('Transcendence Button States', () => {
    it('should disable transcend button when cannot transcend', () => {
      renderWithContext({
        canTranscend: false,
        reason: 'Need higher prestige level',
      });

      const button = screen.getByRole('button', { name: /Need higher prestige level/i });
      expect(button).toBeDisabled();
    });

    it('should enable transcend button when can transcend', () => {
      renderWithContext({
        canTranscend: true,
        potentialPoints: 5,
        prestige: { prestigeLevel: 25 },
      });

      const button = screen.getByRole('button', { name: /Transcend for 5 Points/i });
      expect(button).not.toBeDisabled();
    });

    it('should display potential points in button text when can transcend', () => {
      renderWithContext({
        canTranscend: true,
        potentialPoints: 10,
        prestige: { prestigeLevel: 50 },
      });

      expect(screen.getByText(/Transcend for 10 Points/i)).toBeInTheDocument();
    });

    it('should display reason when cannot transcend', () => {
      renderWithContext({
        canTranscend: false,
        reason: 'Insufficient prestige level',
      });

      expect(screen.getByText(/Insufficient prestige level/i)).toBeInTheDocument();
    });
  });

  describe('Transcendence Bonuses Display', () => {
    it('should display Meta-Bonuses section title', () => {
      renderWithContext();

      expect(screen.getByText('Meta-Bonuses')).toBeInTheDocument();
    });

    it('should display bonus descriptions', () => {
      renderWithContext();

      expect(
        screen.getByText(
          /Spend transcendence points on upgrades that persist through prestige resets/i
        )
      ).toBeInTheDocument();
    });

    it('should display all transcendence bonuses', () => {
      renderWithContext();

      // Check for each bonus name
      expect(screen.getByText('Prestige Amplifier')).toBeInTheDocument();
      expect(screen.getByText('Head Start')).toBeInTheDocument();
      expect(screen.getByText('Cosmic Growth')).toBeInTheDocument();
      expect(screen.getByText('Swift Automation')).toBeInTheDocument();
      expect(screen.getByText('Crystal Hunter')).toBeInTheDocument();
      expect(screen.getByText('Seed Evolution')).toBeInTheDocument();
    });

    it('should show bonus level progress (e.g., 0/25)', () => {
      renderWithContext({
        transcendence: { bonusLevels: { prestigeAmplifier: 5 } },
      });

      expect(screen.getByText('5/25')).toBeInTheDocument();
    });

    it('should show "Not purchased" for unpurchased bonuses', () => {
      renderWithContext();

      const notPurchasedTexts = screen.getAllByText('Not purchased');
      expect(notPurchasedTexts.length).toBeGreaterThan(0);
    });

    it('should show effect value for purchased bonuses', () => {
      renderWithContext({
        transcendence: { bonusLevels: { prestigeAmplifier: 2 } },
      });

      // Prestige Amplifier gives +20% per level, so level 2 = +40%
      expect(screen.getByText('+40% prestige points')).toBeInTheDocument();
    });

    it('should show MAX badge when bonus is maxed', () => {
      renderWithContext({
        transcendence: { bonusLevels: { headStart: 10 } }, // maxLevel is 10
      });

      expect(screen.getByText('MAX')).toBeInTheDocument();
    });
  });

  describe('Bonus Purchase Buttons', () => {
    it('should disable purchase button when not enough points', () => {
      renderWithContext({
        transcendence: { transcendencePoints: 0 },
      });

      // All purchase buttons should be disabled
      const buttons = screen.getAllByRole('button');
      const purchaseButtons = buttons.filter(btn => btn.textContent?.match(/^\d+$/));
      purchaseButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });

    it('should enable purchase button when enough points', () => {
      renderWithContext({
        transcendence: { transcendencePoints: 10 },
      });

      // Cosmic Growth costs 1 point, should be enabled
      const purchaseButtons = screen.getAllByRole('button');
      const affordableButton = purchaseButtons.find(btn => btn.textContent === '1');
      expect(affordableButton).not.toBeDisabled();
    });

    it('should call purchaseTranscendenceBonus when clicking purchase button', async () => {
      const { mockContext } = renderWithContext({
        transcendence: { transcendencePoints: 10 },
      });

      // Find and click the cheapest bonus button
      const purchaseButtons = screen.getAllByRole('button');
      const affordableButton = purchaseButtons.find(btn => btn.textContent === '1');
      if (affordableButton) {
        fireEvent.click(affordableButton);
      }

      await waitFor(() => {
        expect(mockContext.purchaseTranscendenceBonus).toHaveBeenCalled();
      });
    });
  });

  describe('Stats Summary', () => {
    it('should display total points earned', () => {
      renderWithContext({
        transcendence: {
          totalTranscendencePointsEarned: 47, // Unique value that won't collide
          transcendencePoints: 22,
        },
      });

      expect(screen.getByText('Total Earned')).toBeInTheDocument();
      expect(screen.getByText('47')).toBeInTheDocument();
    });

    it('should display spent points', () => {
      renderWithContext({
        transcendence: {
          totalTranscendencePointsEarned: 30,
          transcendencePoints: 18,
        },
      });

      expect(screen.getByText('Spent')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument(); // 30 - 18 = 12 spent
    });

    it('should display available points', () => {
      renderWithContext({
        transcendence: {
          transcendencePoints: 8,
          totalTranscendencePointsEarned: 15,
        },
      });

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Confirmation Dialog', () => {
    it('should not show confirmation modal initially', () => {
      renderWithContext({
        canTranscend: true,
        potentialPoints: 5,
      });

      expect(screen.queryByText('Transcend?')).not.toBeInTheDocument();
    });

    it('should show confirmation modal when clicking transcend button', () => {
      renderWithContext({
        canTranscend: true,
        potentialPoints: 5,
        prestige: { prestigeLevel: 25 },
      });

      const transcendButton = screen.getByRole('button', { name: /Transcend for 5 Points/i });
      fireEvent.click(transcendButton);

      expect(screen.getByText('Transcend?')).toBeInTheDocument();
    });

    it('should call transcend function when confirming', async () => {
      const { mockContext } = renderWithContext({
        canTranscend: true,
        potentialPoints: 5,
        prestige: { prestigeLevel: 25 },
      });

      // Open modal
      const transcendButton = screen.getByRole('button', { name: /Transcend for 5 Points/i });
      fireEvent.click(transcendButton);

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /Transcend!/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContext.transcend).toHaveBeenCalled();
      });
    });

    it('should close modal when clicking cancel', () => {
      renderWithContext({
        canTranscend: true,
        potentialPoints: 5,
        prestige: { prestigeLevel: 25 },
      });

      // Open modal
      const transcendButton = screen.getByRole('button', { name: /Transcend for 5 Points/i });
      fireEvent.click(transcendButton);

      expect(screen.getByText('Transcend?')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Transcend?')).not.toBeInTheDocument();
    });
  });

  describe('Projected Points Display', () => {
    it('should show projected points on transcend', () => {
      renderWithContext({
        prestige: { prestigeLevel: 50 },
        canTranscend: true,
        potentialPoints: 10,
      });

      expect(screen.getByText('Points on Transcend')).toBeInTheDocument();
      expect(screen.getByText('+10')).toBeInTheDocument();
    });

    it('should show zero projected points when below threshold', () => {
      renderWithContext({
        prestige: { prestigeLevel: 10 },
        canTranscend: false,
      });

      expect(screen.getByText('+0')).toBeInTheDocument();
    });
  });

  describe('Effect Formatting', () => {
    it('should format PRESTIGE_POINT_MULT as "% prestige points"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { prestigeAmplifier: 3 } },
      });

      expect(screen.getByText('+60% prestige points')).toBeInTheDocument();
    });

    it('should format STARTING_PRESTIGE as "+ starting levels"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { headStart: 2 } },
      });

      expect(screen.getByText('+4 starting levels')).toBeInTheDocument();
    });

    it('should format PRODUCTION_MULT as "% production"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { cosmicGrowth: 5 } },
      });

      expect(screen.getByText('+50% production')).toBeInTheDocument();
    });

    it('should format AUTOMATION_SPEED as "% automation"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { swiftAutomation: 2 } },
      });

      expect(screen.getByText('+30% automation')).toBeInTheDocument();
    });

    it('should format CRYSTAL_FIND as "% crystal find"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { crystalHunter: 4 } },
      });

      expect(screen.getByText('+20% crystal find')).toBeInTheDocument();
    });

    it('should format SEED_TIER_BOOST as "% tier boost"', () => {
      renderWithContext({
        transcendence: { bonusLevels: { seedEvolution: 5 } },
      });

      expect(screen.getByText('+15% tier boost')).toBeInTheDocument();
    });
  });
});
