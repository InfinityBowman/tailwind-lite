/**
 * useQueue Hook
 * FIFO queue management
 */

import { useState, useCallback } from 'react';

interface UseQueueReturn<T> {
  queue: T[];
  enqueue: (item: T) => void;
  dequeue: () => T | undefined;
  peek: () => T | undefined;
  clear: () => void;
  isEmpty: boolean;
  size: number;
}

function useQueue<T>(initialValue: T[] = []): UseQueueReturn<T> {
  const [queue, setQueue] = useState<T[]>(initialValue);

  const enqueue = useCallback((item: T) => {
    setQueue(prev => [...prev, item]);
  }, []);

  const dequeue = useCallback((): T | undefined => {
    let item: T | undefined;
    setQueue(prev => {
      if (prev.length === 0) return prev;
      [item] = prev;
      return prev.slice(1);
    });
    return item;
  }, []);

  const peek = useCallback(() => queue[0], [queue]);

  const clear = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    enqueue,
    dequeue,
    peek,
    clear,
    isEmpty: queue.length === 0,
    size: queue.length,
  };
}

export default useQueue;
