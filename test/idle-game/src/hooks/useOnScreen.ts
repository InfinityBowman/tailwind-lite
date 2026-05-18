/**
 * useOnScreen Hook
 * Detects when an element is visible in the viewport
 */

import { useState, useEffect, useRef, type RefObject } from 'react';

interface UseOnScreenOptions {
  threshold?: number; // 0-1, how much of element must be visible
  rootMargin?: string; // Margin around root
  triggerOnce?: boolean; // Only trigger once
}

function useOnScreen<T extends HTMLElement = HTMLElement>(
  options: UseOnScreenOptions = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        // If triggerOnce and now visible, disconnect
        if (triggerOnce && visible) {
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}

export default useOnScreen;
