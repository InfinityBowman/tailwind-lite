import { useState, useEffect, useRef } from 'react';

/**
 * Returns a 0–100 value that cycles smoothly at the given period.
 * Used for export progress bars in the continuous export model.
 */
export function useCyclingProgress(cycleDurationSeconds: number): number {
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (cycleDurationSeconds <= 0) {
      setProgress(0);
      return;
    }

    const cycleMs = cycleDurationSeconds * 1000;
    let frameId: number;

    const animate = () => {
      if (!mountedRef.current) return;
      setProgress(((Date.now() % cycleMs) / cycleMs) * 100);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [cycleDurationSeconds]);

  return progress;
}
