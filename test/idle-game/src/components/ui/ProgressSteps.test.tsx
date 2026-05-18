// @vitest-environment jsdom
/**
 * ProgressSteps Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../test/setup-component';
import ProgressSteps from './ProgressSteps';

describe('ProgressSteps', () => {
  // Helper to get step markers (w-3 h-3 elements, not the progress bar)
  const getStepMarkers = (container: HTMLElement) => {
    return container.querySelectorAll('.w-3.h-3');
  };

  describe('rendering', () => {
    it('renders the correct number of step markers', () => {
      const { container } = render(<ProgressSteps total={5} current={2} />);
      const markers = getStepMarkers(container);
      expect(markers.length).toBe(5);
    });

    it('renders progress bar', () => {
      const { container } = render(<ProgressSteps total={4} current={1} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
    });

    it('renders without labels by default', () => {
      render(<ProgressSteps total={3} current={0} />);
      // No text content besides markers
      expect(screen.queryByText('Step')).not.toBeInTheDocument();
    });

    it('renders labels when provided', () => {
      render(<ProgressSteps total={3} current={1} labels={['Start', 'Middle', 'End']} />);
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });
  });

  describe('progress calculation', () => {
    it('calculates 25% progress for step 0 of 4', () => {
      const { container } = render(<ProgressSteps total={4} current={0} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // current=0 means first step complete, so (0+1)/4 = 25%
      expect(progressBar.style.width).toBe('25%');
    });

    it('calculates 50% progress for step 1 of 4', () => {
      const { container } = render(<ProgressSteps total={4} current={1} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // (1+1)/4 = 50%
      expect(progressBar.style.width).toBe('50%');
    });

    it('calculates 75% progress for step 2 of 4', () => {
      const { container } = render(<ProgressSteps total={4} current={2} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // (2+1)/4 = 75%
      expect(progressBar.style.width).toBe('75%');
    });

    it('calculates 100% progress for last step', () => {
      const { container } = render(<ProgressSteps total={4} current={3} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // (3+1)/4 = 100%
      expect(progressBar.style.width).toBe('100%');
    });

    it('clamps progress to 100% for overflow', () => {
      const { container } = render(<ProgressSteps total={3} current={10} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      expect(progressBar.style.width).toBe('100%');
    });

    it('clamps progress to 0% for negative current', () => {
      const { container } = render(<ProgressSteps total={3} current={-5} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // (-5+1)/3 = -1.33, clamped to 0
      expect(progressBar.style.width).toBe('0%');
    });
  });

  describe('step marker states', () => {
    it('marks completed steps with purple background', () => {
      const { container } = render(<ProgressSteps total={4} current={2} />);
      const markers = getStepMarkers(container);

      // Steps 0, 1, 2 should be complete (current=2 means steps 0,1,2 are complete)
      expect(markers[0].className).toContain('bg-purple-500');
      expect(markers[1].className).toContain('bg-purple-500');
      expect(markers[2].className).toContain('bg-purple-500');
      // Step 3 should be incomplete
      expect(markers[3].className).toContain('bg-slate-800');
    });

    it('marks incomplete steps with slate background', () => {
      const { container } = render(<ProgressSteps total={4} current={1} />);
      const markers = getStepMarkers(container);

      // Steps 2, 3 should be incomplete
      expect(markers[2].className).toContain('bg-slate-800');
      expect(markers[3].className).toContain('bg-slate-800');
    });

    it('adds ring highlight to current step', () => {
      const { container } = render(<ProgressSteps total={4} current={2} />);
      const markers = getStepMarkers(container);

      // Only step 2 should have ring
      expect(markers[0].className).not.toContain('ring-2');
      expect(markers[1].className).not.toContain('ring-2');
      expect(markers[2].className).toContain('ring-2');
      expect(markers[3].className).not.toContain('ring-2');
    });
  });

  describe('label styling', () => {
    it('applies white text to completed step labels', () => {
      render(<ProgressSteps total={3} current={1} labels={['Done', 'Current', 'Next']} />);

      const doneLabel = screen.getByText('Done');
      const currentLabel = screen.getByText('Current');

      expect(doneLabel.className).toContain('text-white');
      expect(currentLabel.className).toContain('text-white');
    });

    it('applies slate text to incomplete step labels', () => {
      render(<ProgressSteps total={3} current={0} labels={['First', 'Second', 'Third']} />);

      const secondLabel = screen.getByText('Second');
      const thirdLabel = screen.getByText('Third');

      expect(secondLabel.className).toContain('text-slate-500');
      expect(thirdLabel.className).toContain('text-slate-500');
    });
  });

  describe('styling', () => {
    it('applies full width', () => {
      const { container } = render(<ProgressSteps total={3} current={0} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('w-full');
    });

    it('applies custom className', () => {
      const { container } = render(
        <ProgressSteps total={3} current={0} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('applies transition animation to progress bar', () => {
      const { container } = render(<ProgressSteps total={3} current={1} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      expect(progressBar.className).toContain('transition-all');
      expect(progressBar.className).toContain('duration-300');
    });
  });

  describe('edge cases', () => {
    it('handles single step', () => {
      const { container } = render(<ProgressSteps total={1} current={0} />);
      const markers = getStepMarkers(container);
      expect(markers.length).toBe(1);

      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      expect(progressBar.style.width).toBe('100%');
    });

    it('handles partial labels array (fewer labels than steps)', () => {
      render(<ProgressSteps total={4} current={0} labels={['One', 'Two']} />);

      expect(screen.getByText('One')).toBeInTheDocument();
      expect(screen.getByText('Two')).toBeInTheDocument();
      // Steps 3 and 4 have no labels - should not throw
      expect(screen.queryByText('Three')).not.toBeInTheDocument();
    });

    it('handles empty labels array', () => {
      const { container } = render(<ProgressSteps total={3} current={1} labels={[]} />);
      // Should render without errors, just no label text
      const markers = getStepMarkers(container);
      expect(markers.length).toBe(3);
    });

    it('handles two steps', () => {
      const { container } = render(<ProgressSteps total={2} current={0} />);
      const markers = getStepMarkers(container);
      expect(markers.length).toBe(2);

      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      // (0+1)/2 = 50%
      expect(progressBar.style.width).toBe('50%');
    });

    it('handles zero total gracefully (no division by zero)', () => {
      const { container } = render(<ProgressSteps total={0} current={0} />);
      // Should not crash, progress should be 0%
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
      // No markers should be rendered
      const markers = getStepMarkers(container);
      expect(markers.length).toBe(0);
    });

    it('handles zero total with positive current', () => {
      const { container } = render(<ProgressSteps total={0} current={5} />);
      const progressBar = container.querySelector('.bg-gradient-to-r') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
    });
  });
});
