/**
 * useCounter Hook
 * Simple counter state with increment/decrement/set
 */

import { useState, useCallback } from 'react';

interface UseCounterReturn {
  count: number;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  set: (value: number) => void;
  reset: () => void;
}

function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback((amount: number = 1) => {
    setCount(c => c + amount);
  }, []);

  const decrement = useCallback((amount: number = 1) => {
    setCount(c => c - amount);
  }, []);

  const set = useCallback((value: number) => {
    setCount(value);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, set, reset };
}

export default useCounter;
