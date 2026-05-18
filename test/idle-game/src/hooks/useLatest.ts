/**
 * useLatest Hook
 * Returns a ref that always contains the latest value
 * Useful for callbacks that need current value without triggering re-renders
 */

import { useRef, useLayoutEffect } from 'react';

function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

export default useLatest;
