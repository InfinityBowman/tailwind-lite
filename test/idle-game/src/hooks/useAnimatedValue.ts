/**
 * useAnimatedValue / useAnimatedValues — Animation hooks for idle game values
 *
 * Smoothly interpolates between server-authoritative values using a known
 * rate-per-second.  All animation logic lives in `useAnimatedValues`; the
 * single-value variant is a thin wrapper for convenience.
 *
 * The core idea: we store a *baseline* (value + timestamp) and each animation
 * frame computes `baseline.value + rate * elapsed`.  When the server sends a
 * new value we compare it against the current *prediction* — if it drifts by
 * more than 1 unit we snap the baseline so the display stays accurate.
 *
 * Usage:
 * ```tsx
 * // Single value
 * const displayAmount = useAnimatedValue(plant.amount, plant.productionRate, { max: 1000 });
 *
 * // Multiple values (one animation loop, more efficient)
 * const values = useAnimatedValues([
 *   { value: wheat.amount, rate: wheat.rate, max: capacity },
 *   { value: corn.amount, rate: corn.rate, max: capacity },
 * ]);
 * ```
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameTimeOptional } from '../contexts/GameTimeContext';
import { useReducedMotion } from './useReducedMotion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// useAnimatedValue  (single-value convenience wrapper)
// ---------------------------------------------------------------------------

interface AnimatedValueOptions {
  /** Maximum value (animation stops here) */
  max?: number;
  /** Minimum value (animation stops here) */
  min?: number;
  /** Decimal places for display (default: 2) */
  precision?: number;
}

/**
 * Animate a single server value at a constant rate per second.
 *
 * This is a thin wrapper around `useAnimatedValues` — all resync / drift
 * logic is shared so the two hooks can never diverge.
 */
export function useAnimatedValue(
  serverValue: number,
  ratePerSecond: number,
  options: AnimatedValueOptions = {}
): number {
  const { max, min, precision } = options;

  const items = useMemo(
    () => [{ value: serverValue, rate: ratePerSecond, max, min, precision }],
    [serverValue, ratePerSecond, max, min, precision]
  );

  const results = useAnimatedValues(items);
  return results[0] ?? serverValue;
}

// ---------------------------------------------------------------------------
// useAnimatedValues  (multi-value core implementation)
// ---------------------------------------------------------------------------

export function useAnimatedValues(
  items: Array<{
    value: number;
    rate: number;
    max?: number;
    min?: number;
    precision?: number;
  }>
): number[] {
  const gameTime = useGameTimeOptional();
  const prefersReducedMotion = useReducedMotion();

  // Track if component is mounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track previous items for comparison
  const prevItemsRef = useRef(items);

  const basesRef = useRef<Array<{ value: number; time: number }>>(
    items.map(item => ({ value: item.value, time: performance.now() }))
  );

  const [displayValues, setDisplayValues] = useState<number[]>(() =>
    items.map(item => {
      if (gameTime && item.rate !== 0) {
        const elapsed = gameTime.getElapsedSeconds();
        const predicted = item.value + item.rate * elapsed;
        return clamp(predicted, item.min ?? -Infinity, item.max ?? Infinity);
      }
      return item.value;
    })
  );

  // ---- Resync baselines when server values / rates change ----
  useEffect(() => {
    const now = performance.now();
    const prevItems = prevItemsRef.current;

    const valuesChanged =
      items.length !== prevItems.length ||
      items.some(
        (item, i) =>
          item.value !== prevItems[i]?.value ||
          item.rate !== prevItems[i]?.rate ||
          item.max !== prevItems[i]?.max ||
          item.min !== prevItems[i]?.min
      );

    if (valuesChanged) {
      basesRef.current = items.map((item, i) => {
        const prev = prevItems[i];
        const current = basesRef.current[i];
        if (!current || !prev) {
          return { value: item.value, time: now };
        }
        // Always reset baseline if rate changed
        if (item.rate !== prev.rate) {
          return { value: item.value, time: now };
        }
        // Compare server value against what the animation currently *predicts*,
        // not the raw base value.  This catches the "sell cargo" case: the base
        // might be 0 (from when production started) and the server value is
        // also 0 (after selling), but the animation has been running for
        // seconds and shows, say, 100.  Without this check the base wouldn't
        // reset and the display would stay at 100.
        const elapsed = (now - current.time) / 1000;
        const predicted = current.value + item.rate * elapsed;
        if (Math.abs(item.value - predicted) > 1) {
          return { value: item.value, time: now };
        }
        return current;
      });
      prevItemsRef.current = items;
    }
  }, [items]);

  // ---- Single rAF loop for all values ----
  useEffect(() => {
    if (prefersReducedMotion || !gameTime) {
      setDisplayValues(items.map(i => i.value));
      return;
    }

    const hasAnimating = items.some(i => i.rate !== 0);
    if (!hasAnimating) {
      setDisplayValues(items.map(i => i.value));
      return;
    }

    let frameId: number;

    const animate = (currentTime: number) => {
      if (!mountedRef.current) return;

      const newValues = items.map((item, i) => {
        if (item.rate === 0) return item.value;

        const base = basesRef.current[i];
        if (!base) return item.value;

        const elapsed = (currentTime - base.time) / 1000;
        const predicted = base.value + item.rate * elapsed;
        const clamped = clamp(predicted, item.min ?? -Infinity, item.max ?? Infinity);
        return roundToPrecision(clamped, item.precision ?? 2);
      });

      setDisplayValues(newValues);

      const canContinue = items.some((item, i) => {
        const val = newValues[i];
        const max = item.max ?? Infinity;
        const min = item.min ?? -Infinity;
        return (item.rate > 0 && val < max) || (item.rate < 0 && val > min);
      });

      if (canContinue) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [items, prefersReducedMotion, gameTime]);

  return displayValues;
}
