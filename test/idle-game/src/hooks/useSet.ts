/**
 * useSet Hook
 * Manage a Set with add/remove/toggle/clear
 */

import { useState, useCallback } from 'react';

interface UseSetReturn<T> {
  values: Set<T>;
  add: (value: T) => void;
  remove: (value: T) => void;
  toggle: (value: T) => void;
  has: (value: T) => boolean;
  clear: () => void;
  size: number;
}

function useSet<T>(initialValues?: Iterable<T>): UseSetReturn<T> {
  const [set, setSet] = useState<Set<T>>(() => new Set(initialValues));

  const add = useCallback((value: T) => {
    setSet(prev => new Set([...prev, value]));
  }, []);

  const remove = useCallback((value: T) => {
    setSet(prev => {
      const next = new Set(prev);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  return {
    values: set,
    add,
    remove,
    toggle,
    has,
    clear,
    size: set.size,
  };
}

export default useSet;
