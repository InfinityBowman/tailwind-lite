// @vitest-environment jsdom
/**
 * GradientText Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../test/setup-component';
import GradientText from './GradientText';

describe('GradientText', () => {
  describe('rendering', () => {
    it('renders children text', () => {
      render(<GradientText>Hello World</GradientText>);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders as span by default', () => {
      render(<GradientText>Test</GradientText>);
      const element = screen.getByText('Test');
      expect(element.tagName).toBe('SPAN');
    });

    it('renders as specified element type', () => {
      const { rerender } = render(<GradientText as="h1">Heading</GradientText>);
      expect(screen.getByText('Heading').tagName).toBe('H1');

      rerender(<GradientText as="p">Paragraph</GradientText>);
      expect(screen.getByText('Paragraph').tagName).toBe('P');

      rerender(<GradientText as="h2">H2</GradientText>);
      expect(screen.getByText('H2').tagName).toBe('H2');

      rerender(<GradientText as="h3">H3</GradientText>);
      expect(screen.getByText('H3').tagName).toBe('H3');

      rerender(<GradientText as="h4">H4</GradientText>);
      expect(screen.getByText('H4').tagName).toBe('H4');
    });

    it('renders complex children', () => {
      render(
        <GradientText>
          <strong>Bold</strong> and <em>italic</em>
        </GradientText>
      );
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });
  });

  describe('gradient presets', () => {
    it('applies purple gradient by default', () => {
      render(<GradientText>Purple</GradientText>);
      const element = screen.getByText('Purple');
      expect(element.className).toContain('from-purple-400');
      expect(element.className).toContain('via-pink-500');
    });

    it('applies gold gradient preset', () => {
      render(<GradientText gradient="gold">Gold</GradientText>);
      const element = screen.getByText('Gold');
      expect(element.className).toContain('from-yellow-400');
      expect(element.className).toContain('via-amber-500');
    });

    it('applies success gradient preset', () => {
      render(<GradientText gradient="success">Success</GradientText>);
      const element = screen.getByText('Success');
      expect(element.className).toContain('from-green-400');
      expect(element.className).toContain('via-emerald-500');
    });

    it('applies fire gradient preset', () => {
      render(<GradientText gradient="fire">Fire</GradientText>);
      const element = screen.getByText('Fire');
      expect(element.className).toContain('from-red-500');
      expect(element.className).toContain('via-orange-500');
    });

    it('applies ice gradient preset', () => {
      render(<GradientText gradient="ice">Ice</GradientText>);
      const element = screen.getByText('Ice');
      expect(element.className).toContain('from-blue-400');
      expect(element.className).toContain('via-cyan-500');
    });

    it('applies rainbow gradient preset', () => {
      render(<GradientText gradient="rainbow">Rainbow</GradientText>);
      const element = screen.getByText('Rainbow');
      expect(element.className).toContain('from-red-500');
      expect(element.className).toContain('to-purple-500');
    });
  });

  describe('custom gradients', () => {
    it('applies custom gradient class', () => {
      render(<GradientText gradient="from-pink-500 to-blue-500">Custom</GradientText>);
      const element = screen.getByText('Custom');
      expect(element.className).toContain('from-pink-500');
      expect(element.className).toContain('to-blue-500');
    });
  });

  describe('styling', () => {
    it('applies base gradient classes', () => {
      render(<GradientText>Styled</GradientText>);
      const element = screen.getByText('Styled');
      expect(element.className).toContain('bg-gradient-to-r');
      expect(element.className).toContain('bg-clip-text');
      expect(element.className).toContain('text-transparent');
    });

    it('applies custom className', () => {
      render(<GradientText className="custom-class text-2xl">Styled</GradientText>);
      const element = screen.getByText('Styled');
      expect(element.className).toContain('custom-class');
      expect(element.className).toContain('text-2xl');
    });
  });
});
