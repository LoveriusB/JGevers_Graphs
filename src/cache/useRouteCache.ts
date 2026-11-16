import { useSyncExternalStore } from 'react';

interface RouteCache<T> {
  subscribe: (listener: () => void) => () => void;
  read: () => T | null;
  save: (value: T) => void;
  clear: () => void;
}

/** Pass a stable, module-level cache belonging to the current route. */
export function useRouteCache<T>(cache: RouteCache<T>) {
  const value = useSyncExternalStore(cache.subscribe, cache.read);
  return { value, save: cache.save, clear: cache.clear };
}
