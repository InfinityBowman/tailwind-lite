/**
 * useMounted Hook
 * Returns whether component is mounted (for async safety)
 */

import { useEffect, useRef, useCallback } from 'react';

function useMounted(): () => boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}

export default useMounted;
