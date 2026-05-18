/**
 * Number Formatting Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatCredits,
  formatEssence,
  formatCrystals,
  formatDuration,
  parseFormattedNumber,
} from './numberFormat';

describe('Number Formatting', () => {
  describe('formatNumber - standard notation', () => {
    it('should format small numbers without suffix', () => {
      expect(formatNumber(0)).toBe('0.00');
      expect(formatNumber(5)).toBe('5.00');
      expect(formatNumber(99)).toBe('99');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K', () => {
      expect(formatNumber(1000)).toBe('1.00K');
      expect(formatNumber(1500)).toBe('1.50K');
      expect(formatNumber(999999)).toBe('1000.00K');
    });

    it('should format millions with M', () => {
      expect(formatNumber(1000000)).toBe('1.00M');
      expect(formatNumber(2500000)).toBe('2.50M');
    });

    it('should format billions with B', () => {
      expect(formatNumber(1000000000)).toBe('1.00B');
    });

    it('should format trillions with T', () => {
      expect(formatNumber(1e12)).toBe('1.00T');
    });

    it('should fall back to scientific for very large numbers', () => {
      expect(formatNumber(1e50)).toContain('e');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1.00K');
      expect(formatNumber(-1e6)).toBe('-1.00M');
    });

    it('should handle infinity', () => {
      expect(formatNumber(Infinity)).toBe('∞');
    });
  });

  describe('formatNumber - scientific notation', () => {
    it('should format in scientific notation', () => {
      expect(formatNumber(1000, { notation: 'scientific' })).toBe('1.00e3');
      expect(formatNumber(1500, { notation: 'scientific' })).toBe('1.50e3');
      expect(formatNumber(1e10, { notation: 'scientific' })).toBe('1.00e10');
    });

    it('should not use scientific for small numbers', () => {
      expect(formatNumber(99, { notation: 'scientific' })).toBe('99');
    });
  });

  describe('formatNumber - engineering notation', () => {
    it('should use powers of 3', () => {
      expect(formatNumber(1000, { notation: 'engineering' })).toBe('1.00e3');
      expect(formatNumber(10000, { notation: 'engineering' })).toBe('10.00e3');
      expect(formatNumber(100000, { notation: 'engineering' })).toBe('100.00e3');
      expect(formatNumber(1000000, { notation: 'engineering' })).toBe('1.00e6');
    });
  });

  describe('formatNumber - letter notation', () => {
    it('should use letter suffixes', () => {
      expect(formatNumber(1000, { notation: 'letters' })).toBe('1.00A');
      expect(formatNumber(1e6, { notation: 'letters' })).toBe('1.00B');
      expect(formatNumber(1e9, { notation: 'letters' })).toBe('1.00C');
    });

    it('should handle Z and beyond', () => {
      // tier = floor(log10(n) / 3)
      // 1e78 = tier 26 = Z
      expect(formatNumber(1e78, { notation: 'letters' })).toBe('1.00Z');
      // 1e81 = tier 27 = AA
      expect(formatNumber(1e81, { notation: 'letters' })).toBe('1.00AA');
    });
  });

  describe('formatNumber - precision', () => {
    it('should respect precision setting', () => {
      expect(formatNumber(1500, { precision: 0 })).toBe('2K');
      expect(formatNumber(1500, { precision: 1 })).toBe('1.5K');
      expect(formatNumber(1500, { precision: 3 })).toBe('1.500K');
    });
  });

  describe('formatPercent', () => {
    it('should format as percentage', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.123)).toBe('12.3%');
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('should respect precision', () => {
      expect(formatPercent(0.123, 0)).toBe('12%');
      expect(formatPercent(0.123, 2)).toBe('12.30%');
    });
  });

  describe('formatCredits', () => {
    it('should add credit emoji', () => {
      expect(formatCredits(1000)).toBe('1.00K 💰');
    });
  });

  describe('formatEssence', () => {
    it('should add essence emoji', () => {
      expect(formatEssence(500)).toBe('500 ✨');
    });
  });

  describe('formatCrystals', () => {
    it('should add crystal emoji', () => {
      expect(formatCrystals(10)).toBe('10 💎');
      expect(formatCrystals(5)).toBe('5.00 💎');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3599)).toBe('59m 59s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h 0m');
    });
  });

  describe('parseFormattedNumber', () => {
    it('should parse plain numbers', () => {
      expect(parseFormattedNumber('123')).toBe(123);
      expect(parseFormattedNumber('123.45')).toBe(123.45);
    });

    it('should parse standard suffixes', () => {
      expect(parseFormattedNumber('1.5K')).toBe(1500);
      expect(parseFormattedNumber('2.5M')).toBe(2500000);
      expect(parseFormattedNumber('1B')).toBe(1000000000);
    });

    it('should parse scientific notation', () => {
      expect(parseFormattedNumber('1e6')).toBe(1000000);
      expect(parseFormattedNumber('2.5e3')).toBe(2500);
    });

    it('should handle emojis', () => {
      expect(parseFormattedNumber('1.5K 💰')).toBe(1500);
      expect(parseFormattedNumber('500 ✨')).toBe(500);
    });

    it('should parse letter notation', () => {
      // Note: B conflicts with standard notation (Billion)
      // Parser matches standard first, so B = 1e9
      // For unambiguous letters, use beyond standard suffixes
      expect(parseFormattedNumber('1A')).toBe(1000);
      expect(parseFormattedNumber('2.5B')).toBe(2500000000); // B = Billion in standard
    });
  });
});
