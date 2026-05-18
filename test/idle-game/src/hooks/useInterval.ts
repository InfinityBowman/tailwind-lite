/**
 * useInterval Hook
 * Declarative interval that properly cleans up
 */

import { useEffect, useRef } from 'react';

function useInterval(callback: () => void, delay: number | null, immediate: boolean = false): void {
  const savedCallback = useRef<() => void>(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    // Optionally run immediately
    if (immediate) {
      savedCallback.current();
    }

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay, immediate]);
}

export default useInterval;
