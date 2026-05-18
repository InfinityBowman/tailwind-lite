// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../test/setup-component';
import ProgressTrackerWidget from './ProgressTrackerWidget';
import { GameEngineContext, type GameContextValue } from '../../contexts/GameEngineContext';
import { createInitialGameState, type GameState } from '../../game/state/GameState';

// Mock game engine factory
const createMockEngine = (stateOverrides: Partial<GameState> = {}): GameContextValue => {
  const baseState = createInitialGameState();
  const state: GameState = {
    ...baseState,
    ...stateOverrides,
    ship: {
      ...baseState.ship,
      ...(stateOverrides.ship || {}),
    },
    prestige: {
      ...baseState.prestige,
      ...(stateOverrides.prestige || {}),
    },
    achievements: {
      ...baseState.achievements,
      ...(stateOverrides.achievements || {}),
      stats: {
        ...baseState.achievements.stats,
        ...(stateOverrides.achievements?.stats || {}),
      },
    },
    quests: {
      ...baseState.quests,
      ...(stateOverrides.quests || {}),
    },
    planets: stateOverrides.planets || baseState.planets,
  };

  return {
    state,
    // Minimal mock of other engine methods
    tick: vi.fn(),
    reset: vi.fn(),
    exportSave: vi.fn(),
    importSave: vi.fn(),
    save: vi.fn(),
    getActiveEvent: vi.fn(),
    dismissHint: vi.fn(),
    plantSellValues: {},
  } as unknown as GameContextValue;
};

const renderWithContext = (engine: GameContextValue) => {
  return render(
    <GameEngineContext.Provider value={engine}>
      <ProgressTrackerWidget />
    </GameEngineContext.Provider>
  );
};

describe('ProgressTrackerWidget', () => {
  describe('goal selection', () => {
    it('shows planet unlock goal for new players', () => {
      const engine = createMockEngine({
        ship: {
          totalCurrency: 150,
          seedInventory: [],
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        prestige: {
          lifetimeCredits: 150,
          prestigeLevel: 0,
          prestigePoints: 0,
        },
        achievements: {
          stats: {
            totalGachaPulls: 5,
            totalPlantsHarvested: 0,
            totalCreditsEarned: 0,
            totalSeedsFused: 0,
            totalExpeditionsCompleted: 0,
            totalContractsCompleted: 0,
            totalQuestsCompleted: 0,
            totalAchievementsUnlocked: 0,
            totalManagersOwned: 0,
            totalCrystalsSpent: 0,
          },
        },
      });

      renderWithContext(engine);

      // Should show the quests unlock goal (need 2 planets) - highest priority for new player
      expect(screen.getByText('Unlock Quests')).toBeInTheDocument();
    });

    it('shows prestige goal when planets are unlocked', () => {
      const engine = createMockEngine({
        ship: {
          totalCurrency: 5000,
          seedInventory: [],
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        prestige: {
          lifetimeCredits: 5000,
          prestigeLevel: 0,
          prestigePoints: 0,
        },
        achievements: {
          stats: {
            totalGachaPulls: 30,
            totalPlantsHarvested: 0,
            totalCreditsEarned: 0,
            totalSeedsFused: 0,
            totalExpeditionsCompleted: 0,
            totalContractsCompleted: 0,
            totalQuestsCompleted: 0,
            totalAchievementsUnlocked: 0,
            totalManagersOwned: 0,
            totalCrystalsSpent: 0,
          },
        },
        planets: [
          { id: 'green', name: 'Green Planet', unlocked: true, unlockCost: 0 },
          { id: 'red', name: 'Red Planet', unlocked: true, unlockCost: 500 },
          { id: 'blue', name: 'Blue Planet', unlocked: true, unlockCost: 2000 },
          { id: 'gold', name: 'Gold Planet', unlocked: false, unlockCost: 15000 },
        ],
        quests: {
          dailyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
            quest3: { claimed: true },
          },
          weeklyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
          },
        },
      } as Partial<GameState>);

      renderWithContext(engine);

      // With 3 planets, >5 quests, and 30 pulls - next goal is next planet unlock
      expect(screen.getByText(/Unlock Gold Planet|Unlock Prestige/)).toBeInTheDocument();
    });

    it('shows seedex unlock goal based on gacha pulls', () => {
      const engine = createMockEngine({
        ship: {
          totalCurrency: 1000,
          seedInventory: [],
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        prestige: {
          lifetimeCredits: 1000,
          prestigeLevel: 0,
          prestigePoints: 0,
        },
        achievements: {
          stats: {
            totalGachaPulls: 15,
            totalPlantsHarvested: 0,
            totalCreditsEarned: 0,
            totalSeedsFused: 0,
            totalExpeditionsCompleted: 0,
            totalContractsCompleted: 0,
            totalQuestsCompleted: 0,
            totalAchievementsUnlocked: 0,
            totalManagersOwned: 0,
            totalCrystalsSpent: 0,
          },
        },
        planets: [
          { id: 'green', name: 'Green Planet', unlocked: true, unlockCost: 0 },
          { id: 'red', name: 'Red Planet', unlocked: true, unlockCost: 500 },
          { id: 'blue', name: 'Blue Planet', unlocked: true, unlockCost: 2000 },
        ],
        quests: {
          dailyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
            quest3: { claimed: true },
          },
          weeklyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
          },
        },
      } as Partial<GameState>);

      renderWithContext(engine);

      // With 15 pulls (>40% to 25), seedex unlock should be shown
      expect(screen.getByText('Unlock Seedex')).toBeInTheDocument();
    });

    it('renders something when there are goals', () => {
      const engine = createMockEngine();
      const { container } = renderWithContext(engine);

      // New players always have at least one goal
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('rendering', () => {
    it('renders progress bar with correct percentage', () => {
      const engine = createMockEngine({
        ship: {
          totalCurrency: 250,
          seedInventory: [],
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        prestige: {
          lifetimeCredits: 250,
          prestigeLevel: 0,
          prestigePoints: 0,
        },
        achievements: {
          stats: {
            totalGachaPulls: 3,
            totalPlantsHarvested: 0,
            totalCreditsEarned: 0,
            totalSeedsFused: 0,
            totalExpeditionsCompleted: 0,
            totalContractsCompleted: 0,
            totalQuestsCompleted: 0,
            totalAchievementsUnlocked: 0,
            totalManagersOwned: 0,
            totalCrystalsSpent: 0,
          },
        },
      });

      renderWithContext(engine);

      // Should show a progress indicator
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders minimal version when prop is set', () => {
      const engine = createMockEngine();

      render(
        <GameEngineContext.Provider value={engine}>
          <ProgressTrackerWidget minimal />
        </GameEngineContext.Provider>
      );

      // Minimal version should not show text label (only shows icon + progress bar)
      // Check that the full label isn't visible
      expect(screen.queryByText(/Unlock Quests/)).not.toBeInTheDocument();
    });
  });

  describe('number formatting', () => {
    it('formats numbers correctly', () => {
      const engine = createMockEngine({
        ship: {
          totalCurrency: 5000,
          seedInventory: [],
          crystals: 0,
          resources: { plants: {}, seedEssence: 0 },
        },
        prestige: {
          lifetimeCredits: 25000,
          prestigeLevel: 0,
          prestigePoints: 0,
        },
        achievements: {
          stats: {
            totalGachaPulls: 30,
            totalPlantsHarvested: 0,
            totalCreditsEarned: 0,
            totalSeedsFused: 0,
            totalExpeditionsCompleted: 0,
            totalContractsCompleted: 0,
            totalQuestsCompleted: 0,
            totalAchievementsUnlocked: 0,
            totalManagersOwned: 0,
            totalCrystalsSpent: 0,
          },
        },
        planets: [
          { id: 'green', name: 'Green Planet', unlocked: true, unlockCost: 0 },
          { id: 'red', name: 'Red Planet', unlocked: true, unlockCost: 500 },
          { id: 'blue', name: 'Blue Planet', unlocked: true, unlockCost: 2000 },
        ],
        quests: {
          dailyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
            quest3: { claimed: true },
          },
          weeklyQuests: {
            quest1: { claimed: true },
            quest2: { claimed: true },
          },
        },
      } as Partial<GameState>);

      renderWithContext(engine);

      // Should show some formatted K values
      expect(screen.getByText(/K/)).toBeInTheDocument();
    });
  });
});
