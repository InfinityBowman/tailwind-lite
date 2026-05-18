/**
 * useUpdateEffect Hook
 * Like useEffect but skips first render
 */

import { useEffect, useRef } from 'react';

function useUpdateEffect(effect: () => void | (() => void), deps: React.DependencyList): void {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useUpdateEffect;
