/**
 * useScrollLock Hook
 * Lock body scroll (useful for modals)
 */

import { useEffect } from 'react';

function useScrollLock(lock: boolean = true): void {
  useEffect(() => {
    if (!lock) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}

export default useScrollLock;
