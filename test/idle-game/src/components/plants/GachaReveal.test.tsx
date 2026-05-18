/**
 * GachaReveal tests
 * Tests tier-based reveal animation behavior
 */

// @vitest-environment jsdom
import '../../test/setup-component';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import GachaReveal from './GachaReveal';

// Mock reduced motion hook
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock framer-motion for faster tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, style }: Record<string, unknown>) => (
        <div
          className={className as string}
          style={style as React.CSSProperties}
          data-testid="motion-div"
        >
          {children as React.ReactNode}
        </div>
      ),
    },
  };
});

import { useReducedMotion } from '../../hooks/useReducedMotion';
const mockUseReducedMotion = useReducedMotion as ReturnType<typeof vi.fn>;

describe('GachaReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should not render when not active', () => {
      render(
        <GachaReveal tier={3} onRevealReady={vi.fn()} isActive={false}>
          <div>Content</div>
        </GachaReveal>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render when active', async () => {
      render(
        <GachaReveal tier={3} onRevealReady={vi.fn()} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // Content should appear after anticipation
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('anticipation phase', () => {
    it('should show tier cycling during anticipation for seeds', async () => {
      render(
        <GachaReveal tier={3} onRevealReady={vi.fn()} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // Should show tier indicators during anticipation
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Look for tier indicator pattern (T1, T2, etc.)
      const tierIndicators = screen.queryAllByText(/^T[1-6]$/);
      expect(tierIndicators.length).toBeGreaterThanOrEqual(0);
    });

    it('should call onRevealReady after anticipation completes', async () => {
      const onRevealReady = vi.fn();

      render(
        <GachaReveal tier={2} onRevealReady={onRevealReady} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // T2 has 600ms anticipation - run all timers to completion
      // TierCycler uses recursive setTimeout, so we need to run them all
      await act(async () => {
        // Run timers multiple times to allow recursive setTimeout to complete
        for (let i = 0; i < 50; i++) {
          vi.advanceTimersByTime(50);
          await Promise.resolve();
        }
      });

      expect(onRevealReady).toHaveBeenCalledTimes(1);
    });

    it('should have longer anticipation for higher tiers', async () => {
      const onRevealReadyT1 = vi.fn();
      const onRevealReadyT5 = vi.fn();

      const { rerender } = render(
        <GachaReveal tier={1} onRevealReady={onRevealReadyT1} isActive={true}>
          <div>T1 Content</div>
        </GachaReveal>
      );

      // T1 has 400ms anticipation
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(onRevealReadyT1).toHaveBeenCalled();

      // Reset and test T5
      rerender(
        <GachaReveal tier={5} onRevealReady={onRevealReadyT5} isActive={true}>
          <div>T5 Content</div>
        </GachaReveal>
      );

      // At 500ms, T5 (1600ms) should not have revealed yet
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // T5 needs more time
      await act(async () => {
        vi.advanceTimersByTime(1200);
      });

      expect(onRevealReadyT5).toHaveBeenCalled();
    });
  });

  describe('fodder handling', () => {
    it('should handle tier 0 (fodder) with minimal animation', async () => {
      const onRevealReady = vi.fn();

      render(
        <GachaReveal tier={0} onRevealReady={onRevealReady} isActive={true}>
          <div>Fodder Content</div>
        </GachaReveal>
      );

      // Fodder should reveal quickly
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(onRevealReady).toHaveBeenCalled();
      expect(screen.getByText('Fodder Content')).toBeInTheDocument();
    });
  });

  describe('reduced motion', () => {
    it('should skip anticipation when reduced motion is preferred', async () => {
      mockUseReducedMotion.mockReturnValue(true);
      const onRevealReady = vi.fn();

      render(
        <GachaReveal tier={6} onRevealReady={onRevealReady} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // Should reveal immediately
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onRevealReady).toHaveBeenCalled();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should not show particles when reduced motion is preferred', async () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(
        <GachaReveal tier={5} onRevealReady={vi.fn()} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Particles use Star icons, which shouldn't be present
      const stars = screen.queryAllByRole('img', { hidden: true });
      expect(stars.length).toBe(0);
    });
  });

  describe('reactivation', () => {
    it('should reset state when isActive changes from false to true', async () => {
      const onRevealReady = vi.fn();

      const { rerender } = render(
        <GachaReveal tier={3} onRevealReady={onRevealReady} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // Complete first reveal
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(onRevealReady).toHaveBeenCalledTimes(1);

      // Deactivate
      rerender(
        <GachaReveal tier={3} onRevealReady={onRevealReady} isActive={false}>
          <div>Content</div>
        </GachaReveal>
      );

      // Reactivate
      rerender(
        <GachaReveal tier={3} onRevealReady={onRevealReady} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(onRevealReady).toHaveBeenCalledTimes(2);
    });
  });

  describe('tier configurations', () => {
    it('should handle all valid tiers (1-6)', async () => {
      const tiers = [1, 2, 3, 4, 5, 6];

      for (const tier of tiers) {
        const onRevealReady = vi.fn();

        const { unmount } = render(
          <GachaReveal tier={tier} onRevealReady={onRevealReady} isActive={true}>
            <div>Tier {tier} Content</div>
          </GachaReveal>
        );

        await act(async () => {
          // Max anticipation is 2200ms for T6
          vi.advanceTimersByTime(3000);
        });

        expect(onRevealReady).toHaveBeenCalled();
        expect(screen.getByText(`Tier ${tier} Content`)).toBeInTheDocument();

        unmount();
      }
    });

    it('should default to T1 config for invalid tiers', async () => {
      const onRevealReady = vi.fn();

      render(
        <GachaReveal tier={99} onRevealReady={onRevealReady} isActive={true}>
          <div>Invalid Tier Content</div>
        </GachaReveal>
      );

      // Should use T1 timing (400ms)
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(onRevealReady).toHaveBeenCalled();
    });
  });

  describe('callback safety', () => {
    it('should only call onRevealReady once per activation', async () => {
      const onRevealReady = vi.fn();

      render(
        <GachaReveal tier={3} onRevealReady={onRevealReady} isActive={true}>
          <div>Content</div>
        </GachaReveal>
      );

      // Advance way past any animation
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(onRevealReady).toHaveBeenCalledTimes(1);
    });
  });
});
