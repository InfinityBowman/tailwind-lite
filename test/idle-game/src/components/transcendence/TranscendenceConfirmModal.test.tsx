/**
 * TranscendenceConfirmModal Component Tests
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TranscendenceConfirmModal from './TranscendenceConfirmModal';

// ============================================
// TEST UTILITIES
// ============================================

interface RenderOptions {
  potentialPoints?: number;
  newLevel?: number;
  currentPrestigeLevel?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const renderModal = (options: RenderOptions = {}) => {
  const {
    potentialPoints = 5,
    newLevel = 1,
    currentPrestigeLevel = 25,
    onConfirm = vi.fn(),
    onCancel = vi.fn(),
  } = options;

  return {
    ...render(
      <TranscendenceConfirmModal
        potentialPoints={potentialPoints}
        newLevel={newLevel}
        currentPrestigeLevel={currentPrestigeLevel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ),
    onConfirm,
    onCancel,
  };
};

// ============================================
// TESTS
// ============================================

describe('TranscendenceConfirmModal', () => {
  describe('Modal Display', () => {
    it('should render modal with Transcend? title', () => {
      renderModal();

      expect(screen.getByText('Transcend?')).toBeInTheDocument();
    });

    it('should show modal description', () => {
      renderModal();

      expect(
        screen.getByText('Sacrifice prestige progress for powerful meta-bonuses')
      ).toBeInTheDocument();
    });
  });

  describe('What You Will Gain Section', () => {
    it('should display "You will gain:" heading', () => {
      renderModal();

      expect(screen.getByText('You will gain:')).toBeInTheDocument();
    });

    it('should display potential transcendence points', () => {
      renderModal({ potentialPoints: 10 });

      expect(screen.getByText('10')).toBeInTheDocument();
      // Check for full text "Transcendence Points" to avoid multiple matches
      expect(screen.getByText(/Transcendence Points$/)).toBeInTheDocument();
    });

    it('should display new transcendence level', () => {
      renderModal({ newLevel: 3 });

      expect(screen.getByText(/Reach Transcendence Level/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should mention access to powerful meta-bonuses', () => {
      renderModal();

      expect(screen.getByText('Access to powerful meta-bonuses')).toBeInTheDocument();
    });

    it('should mention bonus prestige points on future runs', () => {
      renderModal();

      expect(screen.getByText('Bonus prestige points on future runs')).toBeInTheDocument();
    });
  });

  describe('What Is Always Kept Section', () => {
    it('should display "Always kept:" heading', () => {
      renderModal();

      expect(screen.getByText('Always kept:')).toBeInTheDocument();
    });

    it('should list transcendence points and bonuses', () => {
      renderModal();

      expect(screen.getByText('Transcendence points and bonuses')).toBeInTheDocument();
    });

    it('should list crystals', () => {
      renderModal();

      expect(screen.getByText('Crystals')).toBeInTheDocument();
    });

    it('should list achievements', () => {
      renderModal();

      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('should list managers with note about assignment reset', () => {
      renderModal();

      expect(screen.getByText('Managers (assignments reset)')).toBeInTheDocument();
    });
  });

  describe('What You Will Lose Section', () => {
    it('should display "You will lose:" heading', () => {
      renderModal();

      expect(screen.getByText('You will lose:')).toBeInTheDocument();
    });

    it('should show current prestige level being lost', () => {
      renderModal({ currentPrestigeLevel: 30 });

      expect(screen.getByText('Prestige Level 30')).toBeInTheDocument();
    });

    it('should warn about losing all prestige points and bonuses', () => {
      renderModal();

      expect(screen.getByText('All prestige points and bonuses')).toBeInTheDocument();
    });

    it('should warn about everything reset by prestige', () => {
      renderModal();

      expect(screen.getByText('Everything reset by prestige')).toBeInTheDocument();
    });
  });

  describe('Tip Section', () => {
    it('should display a tip about transcendence bonuses', () => {
      renderModal();

      expect(screen.getByText('Tip:')).toBeInTheDocument();
      expect(
        screen.getByText(/Transcendence bonuses stack with prestige bonuses and persist forever/i)
      ).toBeInTheDocument();
    });

    it('should mention Head Start bonus', () => {
      renderModal();

      expect(
        screen.getByText(/Head Start bonus gives you free prestige levels on future runs/i)
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display Cancel button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should display Transcend! confirm button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /Transcend!/i })).toBeInTheDocument();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = vi.fn();
      renderModal({ onCancel });

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Transcend! button is clicked', () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm });

      fireEvent.click(screen.getByRole('button', { name: /Transcend!/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should have correct dialog role', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render Sparkles icons in confirm button', () => {
      renderModal();

      // The Transcend! button should have Sparkles icons
      const confirmButton = screen.getByRole('button', { name: /Transcend!/i });
      expect(confirmButton).toBeInTheDocument();

      // Check for SVG elements (lucide icons)
      const svgs = confirmButton.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should have purple-themed confirm button', () => {
      renderModal();

      const confirmButton = screen.getByRole('button', { name: /Transcend!/i });
      // Check for purple background class
      expect(confirmButton.className).toContain('bg-purple');
    });
  });

  describe('Different Point Values', () => {
    it('should display single digit points correctly', () => {
      renderModal({ potentialPoints: 5, newLevel: 1 });

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display double digit points correctly', () => {
      renderModal({ potentialPoints: 25, newLevel: 5 });

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display first transcendence correctly (level 1)', () => {
      renderModal({ potentialPoints: 5, newLevel: 1, currentPrestigeLevel: 25 });

      expect(screen.getByText('Prestige Level 25')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display high prestige level correctly', () => {
      renderModal({ potentialPoints: 20, newLevel: 4, currentPrestigeLevel: 100 });

      expect(screen.getByText('Prestige Level 100')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should have green styling for gains section', () => {
      renderModal();

      // Find the "You will gain" section by checking for green text class
      const gainHeading = screen.getByText('You will gain:');
      expect(gainHeading).toHaveClass('text-green-400');
    });

    it('should have blue styling for kept section', () => {
      renderModal();

      // Find the "Always kept" section by checking for blue text class
      const keptHeading = screen.getByText('Always kept:');
      expect(keptHeading).toHaveClass('text-blue-400');
    });

    it('should have red/destructive styling for losses section', () => {
      renderModal();

      // Find the "You will lose" section by checking for destructive text class
      const lossHeading = screen.getByText('You will lose:');
      expect(lossHeading).toHaveClass('text-destructive');
    });
  });
});
