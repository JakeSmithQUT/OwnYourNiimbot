import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(fn: () => void): () => void;
  use(): T;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const store: Store<T> = {
    get: () => state,
    set(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
      for (const fn of listeners) fn();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    use() {
      return useSyncExternalStore(store.subscribe, store.get);
    },
  };
  return store;
}

/** Re-renders when an external object calls its listeners. Returns a counter. */
export function useVersion(subscribe: (fn: () => void) => () => void, getVersion: () => number): number {
  return useSyncExternalStore(subscribe, getVersion);
}
