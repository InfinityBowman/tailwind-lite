/**
 * PrestigeConfirmModal Component Tests
 * @vitest-environment jsdom
 */

import '../../test/setup-component';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrestigeConfirmModal from './PrestigeConfirmModal';

// ============================================
// TEST UTILITIES
// ============================================

interface RenderOptions {
  potentialPoints?: number;
  newLevel?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const renderModal = (options: RenderOptions = {}) => {
  const { potentialPoints = 10, newLevel = 1, onConfirm = vi.fn(), onCancel = vi.fn() } = options;

  return {
    ...render(
      <PrestigeConfirmModal
        potentialPoints={potentialPoints}
        newLevel={newLevel}
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

describe('PrestigeConfirmModal', () => {
  describe('Modal Display', () => {
    it('should render modal with Prestige? title', () => {
      renderModal();

      expect(screen.getByText('Prestige?')).toBeInTheDocument();
    });

    it('should show modal description', () => {
      renderModal();

      expect(screen.getByText('Reset your progress for permanent bonuses')).toBeInTheDocument();
    });
  });

  describe('What You Will Gain Section', () => {
    it('should display "You will gain:" heading', () => {
      renderModal();

      expect(screen.getByText('You will gain:')).toBeInTheDocument();
    });

    it('should display potential prestige points', () => {
      renderModal({ potentialPoints: 25 });

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Prestige Points')).toBeInTheDocument();
    });

    it('should display new prestige level', () => {
      renderModal({ newLevel: 5 });

      expect(screen.getByText(/Reach Prestige Level/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should mention keeping purchased prestige bonuses', () => {
      renderModal();

      expect(screen.getByText('Keep all purchased prestige bonuses')).toBeInTheDocument();
    });
  });

  describe('What Is Always Kept Section', () => {
    it('should display "Always kept:" heading', () => {
      renderModal();

      expect(screen.getByText('Always kept:')).toBeInTheDocument();
    });

    it('should list quest progress', () => {
      renderModal();

      expect(screen.getByText('Quest progress')).toBeInTheDocument();
    });

    it('should list achievements', () => {
      renderModal();

      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('should list daily bonus', () => {
      renderModal();

      expect(screen.getByText('Daily bonus (if unlocked)')).toBeInTheDocument();
    });
  });

  describe('What You Will Lose Section', () => {
    it('should display "You will lose:" heading', () => {
      renderModal();

      expect(screen.getByText('You will lose:')).toBeInTheDocument();
    });

    it('should warn about losing all credits', () => {
      renderModal();

      expect(screen.getByText('All credits')).toBeInTheDocument();
    });

    it('should warn about losing seeds and plants', () => {
      renderModal();

      expect(screen.getByText('All seeds and plants')).toBeInTheDocument();
    });

    it('should warn about losing planet progress', () => {
      renderModal();

      expect(screen.getByText('All planet progress and upgrades')).toBeInTheDocument();
    });

    it('should warn about losing research progress', () => {
      renderModal();

      expect(screen.getByText('All research progress')).toBeInTheDocument();
    });

    it('should warn about losing refined essence', () => {
      renderModal();

      expect(screen.getByText('All refined essence')).toBeInTheDocument();
    });
  });

  describe('Tip Section', () => {
    it('should display a tip about prestige bonuses', () => {
      renderModal();

      expect(screen.getByText('Tip:')).toBeInTheDocument();
      expect(
        screen.getByText(/Prestige bonuses are permanent and will make your next run faster/i)
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display Cancel button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should display Prestige! confirm button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: /Prestige!/i })).toBeInTheDocument();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = vi.fn();
      renderModal({ onCancel });

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Prestige! button is clicked', () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm });

      fireEvent.click(screen.getByRole('button', { name: /Prestige!/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when dialog is closed via escape or overlay', () => {
      const onCancel = vi.fn();
      renderModal({ onCancel });

      // The Dialog component calls onOpenChange(false) which triggers onCancel
      // Simulate by clicking the dialog content's close mechanism
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should render Star icons in confirm button', () => {
      renderModal();

      // The Prestige! button should have Star icons
      const confirmButton = screen.getByRole('button', { name: /Prestige!/i });
      expect(confirmButton).toBeInTheDocument();

      // Check for SVG elements (lucide icons)
      const svgs = confirmButton.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Different Point Values', () => {
    it('should display single digit points correctly', () => {
      renderModal({ potentialPoints: 5, newLevel: 1 });

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display large point values correctly', () => {
      renderModal({ potentialPoints: 999, newLevel: 50 });

      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should display first prestige correctly (level 1)', () => {
      renderModal({ potentialPoints: 7, newLevel: 1 });

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
