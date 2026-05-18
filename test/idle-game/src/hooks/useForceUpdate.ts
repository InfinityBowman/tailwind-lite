/**
 * useForceUpdate Hook
 * Force a component re-render
 */

import { useState, useCallback } from 'react';

function useForceUpdate(): () => void {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);

  return forceUpdate;
}

export default useForceUpdate;
