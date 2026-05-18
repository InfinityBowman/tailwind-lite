/**
 * useList Hook
 * Manage an array with common operations
 */

import { useState, useCallback } from 'react';

interface UseListReturn<T> {
  list: T[];
  push: (item: T) => void;
  pop: () => T | undefined;
  insertAt: (index: number, item: T) => void;
  removeAt: (index: number) => void;
  updateAt: (index: number, item: T) => void;
  clear: () => void;
  filter: (predicate: (item: T) => boolean) => void;
  set: (items: T[]) => void;
  isEmpty: boolean;
  length: number;
}

function useList<T>(initialValue: T[] = []): UseListReturn<T> {
  const [list, setList] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => {
    setList(prev => [...prev, item]);
  }, []);

  const pop = useCallback((): T | undefined => {
    let popped: T | undefined;
    setList(prev => {
      if (prev.length === 0) return prev;
      popped = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return popped;
  }, []);

  const insertAt = useCallback((index: number, item: T) => {
    setList(prev => {
      const copy = [...prev];
      copy.splice(index, 0, item);
      return copy;
    });
  }, []);

  const removeAt = useCallback((index: number) => {
    setList(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const updateAt = useCallback((index: number, item: T) => {
    setList(prev => {
      const copy = [...prev];
      copy[index] = item;
      return copy;
    });
  }, []);

  const clear = useCallback(() => {
    setList([]);
  }, []);

  const filter = useCallback((predicate: (item: T) => boolean) => {
    setList(prev => prev.filter(predicate));
  }, []);

  const set = useCallback((items: T[]) => {
    setList(items);
  }, []);

  return {
    list,
    push,
    pop,
    insertAt,
    removeAt,
    updateAt,
    clear,
    filter,
    set,
    isEmpty: list.length === 0,
    length: list.length,
  };
}

export default useList;
