/**
 * useCountUp Hook
 * Animates a number counting up from start to end
 */

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number; // ms
  delay?: number; // ms before starting
  onComplete?: () => void;
}

function useCountUp({
  start = 0,
  end,
  duration = 1000,
  delay = 0,
  onComplete,
}: UseCountUpOptions): number {
  const [value, setValue] = useState(start);
  const prefersReducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Skip animation if reduced motion
    if (prefersReducedMotion) {
      setValue(end);
      onCompleteRef.current?.();
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      setValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current?.();
      }
    };

    const delayTimeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [start, end, duration, delay, prefersReducedMotion]);

  return value;
}

export default useCountUp;
