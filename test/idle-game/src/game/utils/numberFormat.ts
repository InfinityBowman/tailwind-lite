/**
 * Number Formatting Utilities
 *
 * Handles display of large numbers in idle games.
 * Players can choose their preferred notation style.
 */

export type NumberNotation =
  | 'standard' // K, M, B, T, then scientific
  | 'scientific' // Always 1.23e4
  | 'engineering' // 1.23e6, 1.23e9 (powers of 3)
  | 'letters'; // 1.23A, 1.23B... 1.23AA

// ============================================
// STANDARD NOTATION
// ============================================

const STANDARD_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * Format number with standard notation (K, M, B, T...)
 * Falls back to scientific for very large numbers
 */
function formatStandard(n: number, precision: number = 2): string {
  if (n < 1000) {
    return n < 10 ? n.toFixed(precision) : Math.floor(n).toString();
  }

  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);

  if (tier >= STANDARD_SUFFIXES.length) {
    // Fall back to scientific for very large numbers
    return formatScientific(n, precision);
  }

  const suffix = STANDARD_SUFFIXES[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = n / scale;

  return scaled.toFixed(precision) + suffix;
}

// ============================================
// SCIENTIFIC NOTATION
// ============================================

/**
 * Format number in scientific notation (1.23e4)
 */
function formatScientific(n: number, precision: number = 2): string {
  if (n === 0) return '0';
  if (n < 1000) {
    return n < 10 ? n.toFixed(precision) : Math.floor(n).toString();
  }

  const exponent = Math.floor(Math.log10(Math.abs(n)));
  const mantissa = n / Math.pow(10, exponent);

  return `${mantissa.toFixed(precision)}e${exponent}`;
}

// ============================================
// ENGINEERING NOTATION
// ============================================

/**
 * Format number in engineering notation (powers of 3)
 */
function formatEngineering(n: number, precision: number = 2): string {
  if (n === 0) return '0';
  if (n < 1000) {
    return n < 10 ? n.toFixed(precision) : Math.floor(n).toString();
  }

  const exponent = Math.floor(Math.log10(Math.abs(n)));
  const engExponent = Math.floor(exponent / 3) * 3;
  const mantissa = n / Math.pow(10, engExponent);

  return `${mantissa.toFixed(precision)}e${engExponent}`;
}

// ============================================
// LETTER NOTATION
// ============================================

/**
 * Generate letter suffix for position (0=A, 1=B, ... 25=Z, 26=AA, ...)
 */
function getLetterSuffix(tier: number): string {
  if (tier <= 0) return '';

  tier -= 1; // Adjust for 0-indexed

  if (tier < 26) {
    return String.fromCharCode(65 + tier); // A-Z
  }

  // For AA, AB, etc.
  const firstLetter = Math.floor(tier / 26) - 1;
  const secondLetter = tier % 26;

  if (firstLetter < 26) {
    return String.fromCharCode(65 + firstLetter) + String.fromCharCode(65 + secondLetter);
  }

  // Fall back to scientific for extremely large numbers
  return `e${tier * 3}`;
}

/**
 * Format number with letter notation (A, B, C... Z, AA, AB...)
 */
function formatLetters(n: number, precision: number = 2): string {
  if (n < 1000) {
    return n < 10 ? n.toFixed(precision) : Math.floor(n).toString();
  }

  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  const suffix = getLetterSuffix(tier);
  const scale = Math.pow(10, tier * 3);
  const scaled = n / scale;

  return scaled.toFixed(precision) + suffix;
}

// ============================================
// MAIN FORMAT FUNCTION
// ============================================

export interface FormatOptions {
  notation?: NumberNotation;
  precision?: number;
  alwaysShowDecimals?: boolean;
}

/**
 * Format a number for display based on notation preference
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { notation = 'standard', precision = 2, alwaysShowDecimals = false } = options;

  // Handle special cases
  if (!Number.isFinite(value)) {
    return value === Infinity ? '∞' : 'NaN';
  }

  // Handle negative numbers
  if (value < 0) {
    return '-' + formatNumber(Math.abs(value), options);
  }

  // Very small numbers
  if (value > 0 && value < 0.01) {
    return value.toExponential(precision);
  }

  // Small numbers: show as-is
  if (value < 1000) {
    if (alwaysShowDecimals || value < 10) {
      return value.toFixed(precision);
    }
    return Math.floor(value).toString();
  }

  // Apply notation
  switch (notation) {
    case 'scientific':
      return formatScientific(value, precision);
    case 'engineering':
      return formatEngineering(value, precision);
    case 'letters':
      return formatLetters(value, precision);
    case 'standard':
    default:
      return formatStandard(value, precision);
  }
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, precision: number = 1): string {
  return (value * 100).toFixed(precision) + '%';
}

/**
 * Format a number as currency (with credits symbol)
 */
export function formatCredits(value: number, options: FormatOptions = {}): string {
  return formatNumber(value, options) + ' 💰';
}

/**
 * Format a number as essence
 */
export function formatEssence(value: number, options: FormatOptions = {}): string {
  return formatNumber(value, options) + ' ✨';
}

/**
 * Format a number as crystals
 */
export function formatCrystals(value: number, options: FormatOptions = {}): string {
  return formatNumber(value, options) + ' 💎';
}

/**
 * Format a time duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Parse a formatted number back to numeric value
 * Useful for save/load or user input
 */
export function parseFormattedNumber(str: string): number {
  // Remove common suffixes and parse
  const cleaned = str
    .trim()
    .replace(/[\u{1F4B0}\u{2728}\u{1F48E}]/gu, '')
    .trim();

  // Handle scientific notation
  if (cleaned.includes('e')) {
    return parseFloat(cleaned);
  }

  // Handle standard suffixes
  const match = cleaned.match(/^([\d.]+)\s*([A-Za-z]+)?$/);
  if (!match) return parseFloat(cleaned);

  const [, numStr, suffix] = match;
  const num = parseFloat(numStr);

  if (!suffix) return num;

  // Find suffix multiplier
  const upperSuffix = suffix.toUpperCase();
  const tierIndex = STANDARD_SUFFIXES.findIndex(s => s.toUpperCase() === upperSuffix);

  if (tierIndex >= 0) {
    return num * Math.pow(10, tierIndex * 3);
  }

  // Try letter notation
  if (upperSuffix.length === 1) {
    const tier = upperSuffix.charCodeAt(0) - 64; // A=1, B=2, etc.
    return num * Math.pow(10, tier * 3);
  }

  return num;
}
