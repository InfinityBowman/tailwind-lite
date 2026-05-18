/**
 * useIsFirstRender Hook
 * Returns true only on first render
 */

import { useRef } from 'react';

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }

  return false;
}

export default useIsFirstRender;
