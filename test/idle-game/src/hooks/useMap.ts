/**
 * useMap Hook
 * Manage a Map with common operations
 */

import { useState, useCallback, useMemo } from 'react';

interface UseMapReturn<K, V> {
  map: Map<K, V>;
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  setAll: (entries: Iterable<[K, V]>) => void;
  remove: (key: K) => void;
  has: (key: K) => boolean;
  clear: () => void;
  entries: [K, V][];
  keys: K[];
  values: V[];
  size: number;
}

function useMap<K, V>(initialValue?: Iterable<[K, V]>): UseMapReturn<K, V> {
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialValue));

  const get = useCallback((key: K) => map.get(key), [map]);

  const set = useCallback((key: K, value: V) => {
    setMap(prev => {
      const copy = new Map(prev);
      copy.set(key, value);
      return copy;
    });
  }, []);

  const setAll = useCallback((entries: Iterable<[K, V]>) => {
    setMap(prev => {
      const copy = new Map(prev);
      for (const [k, v] of entries) {
        copy.set(k, v);
      }
      return copy;
    });
  }, []);

  const remove = useCallback((key: K) => {
    setMap(prev => {
      const copy = new Map(prev);
      copy.delete(key);
      return copy;
    });
  }, []);

  const has = useCallback((key: K) => map.has(key), [map]);

  const clear = useCallback(() => {
    setMap(new Map());
  }, []);

  const entries = useMemo(() => Array.from(map.entries()), [map]);
  const keys = useMemo(() => Array.from(map.keys()), [map]);
  const values = useMemo(() => Array.from(map.values()), [map]);

  return {
    map,
    get,
    set,
    setAll,
    remove,
    has,
    clear,
    entries,
    keys,
    values,
    size: map.size,
  };
}

export default useMap;
