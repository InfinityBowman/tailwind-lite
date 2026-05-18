/**
 * useThrottle Hook
 * Returns a throttled value that updates at most once per interval
 */

import { useState, useEffect, useRef } from 'react';

function useThrottle<T>(value: T, intervalMs: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= intervalMs) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, intervalMs - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, intervalMs]);

  return throttledValue;
}

export default useThrottle;
