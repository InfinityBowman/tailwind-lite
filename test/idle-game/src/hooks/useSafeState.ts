/**
 * useSafeState Hook
 * useState that only updates if component is still mounted
 * Prevents "Can't perform a React state update on an unmounted component"
 */

import { useState, useCallback, useRef, useEffect } from 'react';

function useSafeState<T>(
  initialState: T | (() => T)
): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prevState: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

export default useSafeState;
