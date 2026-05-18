/**
 * useStack Hook
 * LIFO stack management
 */

import { useState, useCallback } from 'react';

interface UseStackReturn<T> {
  stack: T[];
  push: (item: T) => void;
  pop: () => T | undefined;
  peek: () => T | undefined;
  clear: () => void;
  isEmpty: boolean;
  size: number;
}

function useStack<T>(initialValue: T[] = []): UseStackReturn<T> {
  const [stack, setStack] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => {
    setStack(prev => [...prev, item]);
  }, []);

  const pop = useCallback((): T | undefined => {
    let item: T | undefined;
    setStack(prev => {
      if (prev.length === 0) return prev;
      item = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return item;
  }, []);

  const peek = useCallback(() => stack[stack.length - 1], [stack]);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  return {
    stack,
    push,
    pop,
    peek,
    clear,
    isEmpty: stack.length === 0,
    size: stack.length,
  };
}

export default useStack;
