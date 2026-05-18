// @vitest-environment jsdom
/**
 * ResourceDisplay Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../test/setup-component';
import ResourceDisplay from './ResourceDisplay';

describe('ResourceDisplay', () => {
  describe('rendering', () => {
    it('renders credits resource', () => {
      render(<ResourceDisplay resource="credits" value={1000} />);
      expect(screen.getByText('1.00K')).toBeInTheDocument();
      expect(screen.getByTitle(/Credits: 1,000/)).toBeInTheDocument();
    });

    it('renders crystals resource', () => {
      render(<ResourceDisplay resource="crystals" value={500} />);
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByTitle(/Crystals: 500/)).toBeInTheDocument();
    });

    it('renders essence resource', () => {
      render(<ResourceDisplay resource="essence" value={250} />);
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByTitle(/Essence: 250/)).toBeInTheDocument();
    });

    it('renders seeds resource', () => {
      render(<ResourceDisplay resource="seeds" value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByTitle(/Seeds: 42/)).toBeInTheDocument();
    });
  });

  describe('number formatting', () => {
    it('formats small numbers without abbreviation', () => {
      render(<ResourceDisplay resource="credits" value={999} />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('formats thousands with K suffix', () => {
      render(<ResourceDisplay resource="credits" value={1500} />);
      // formatNumber returns 2 decimal precision: 1.50K
      expect(screen.getByText('1.50K')).toBeInTheDocument();
    });

    it('formats millions with M suffix', () => {
      render(<ResourceDisplay resource="credits" value={2500000} />);
      expect(screen.getByText('2.50M')).toBeInTheDocument();
    });

    it('formats billions with B suffix', () => {
      render(<ResourceDisplay resource="credits" value={3500000000} />);
      expect(screen.getByText('3.50B')).toBeInTheDocument();
    });

    it('displays zero correctly', () => {
      render(<ResourceDisplay resource="credits" value={0} />);
      // formatNumber returns 0.00 for values < 10
      expect(screen.getByText('0.00')).toBeInTheDocument();
    });

    it('formats values under 10 with decimals', () => {
      render(<ResourceDisplay resource="credits" value={5.5} />);
      expect(screen.getByText('5.50')).toBeInTheDocument();
    });

    it('handles NaN gracefully', () => {
      render(<ResourceDisplay resource="credits" value={NaN} />);
      // formatNumber returns 'NaN' for NaN values
      expect(screen.getByText('NaN')).toBeInTheDocument();
    });

    it('handles Infinity gracefully', () => {
      render(<ResourceDisplay resource="credits" value={Infinity} />);
      // formatNumber returns infinity symbol, title uses toLocaleString which shows infinity symbol
      expect(screen.getByText('∞')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(<ResourceDisplay resource="credits" value={-500} />);
      expect(screen.getByText('-500')).toBeInTheDocument();
    });

    it('formats trillion values', () => {
      render(<ResourceDisplay resource="credits" value={5_000_000_000_000} />);
      expect(screen.getByText('5.00T')).toBeInTheDocument();
    });
  });

  describe('change indicator', () => {
    it('shows positive change with plus sign', () => {
      render(<ResourceDisplay resource="credits" value={1000} showChange={100} />);
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('shows negative change without explicit minus', () => {
      render(<ResourceDisplay resource="credits" value={1000} showChange={-50} />);
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('applies green color to positive change', () => {
      render(<ResourceDisplay resource="credits" value={1000} showChange={100} />);
      const changeElement = screen.getByText('+100');
      expect(changeElement.className).toContain('text-green-400');
    });

    it('applies red color to negative change', () => {
      render(<ResourceDisplay resource="credits" value={1000} showChange={-50} />);
      const changeElement = screen.getByText('-50');
      expect(changeElement.className).toContain('text-red-400');
    });

    it('hides change indicator when showChange is undefined', () => {
      render(<ResourceDisplay resource="credits" value={1000} />);
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^-\d/)).not.toBeInTheDocument();
    });

    it('hides change indicator when showChange is zero', () => {
      const { container } = render(
        <ResourceDisplay resource="credits" value={1000} showChange={0} />
      );
      // Zero change should not render the change span
      // The container should only have 2 children (icon + value), not 3
      const wrapper = container.querySelector('.inline-flex');
      // SVG + span (value) = 2 children when no change shown
      expect(wrapper?.children.length).toBe(2);
    });

    it('formats large change values', () => {
      const { container } = render(
        <ResourceDisplay resource="credits" value={1000000} showChange={50000} />
      );
      // The change span has green color for positive values
      const changeSpan = container.querySelector('.text-green-400');
      expect(changeSpan).toBeInTheDocument();
      // Should contain the formatted number (50.00K)
      expect(changeSpan?.textContent).toContain('50.00K');
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = render(<ResourceDisplay resource="credits" value={100} size="sm" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-1');
    });

    it('renders medium size by default', () => {
      const { container } = render(<ResourceDisplay resource="credits" value={100} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-1.5');
    });

    it('renders large size', () => {
      const { container } = render(<ResourceDisplay resource="credits" value={100} size="lg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-2');
    });
  });

  describe('styling', () => {
    it('applies inline-flex layout', () => {
      const { container } = render(<ResourceDisplay resource="credits" value={100} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('inline-flex');
    });

    it('applies custom className', () => {
      const { container } = render(
        <ResourceDisplay resource="credits" value={100} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('applies tabular-nums for consistent number width', () => {
      render(<ResourceDisplay resource="credits" value={100} />);
      const valueElement = screen.getByText('100');
      expect(valueElement.className).toContain('tabular-nums');
    });
  });

  describe('icons', () => {
    it('renders an icon for each resource type', () => {
      const { container: c1 } = render(<ResourceDisplay resource="credits" value={0} />);
      const { container: c2 } = render(<ResourceDisplay resource="crystals" value={0} />);
      const { container: c3 } = render(<ResourceDisplay resource="essence" value={0} />);
      const { container: c4 } = render(<ResourceDisplay resource="seeds" value={0} />);

      // Each should have an SVG icon
      expect(c1.querySelector('svg')).toBeInTheDocument();
      expect(c2.querySelector('svg')).toBeInTheDocument();
      expect(c3.querySelector('svg')).toBeInTheDocument();
      expect(c4.querySelector('svg')).toBeInTheDocument();
    });
  });
});
