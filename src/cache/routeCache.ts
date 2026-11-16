/** Route-specific cache. Files never leave the browser. */
export interface CacheCodec<T> {
  encode: (value: T) => string;
  decode: (text: string) => T | null;
}

export function createRouteCache<T>(path: string, codec?: CacheCodec<T>) {
  const key = `jacques-graphs:dataset:v1:${path}`;
  let memory: T | null | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    read(): T | null {
      if (memory !== undefined) return memory;
      try {
        const stored = codec ? sessionStorage.getItem(key) : null;
        memory = stored !== null && codec ? codec.decode(stored) : null;
      } catch { memory = null; }
      return memory;
    },
    save(value: T): void {
      memory = value;
      if (codec) {
        try { sessionStorage.setItem(key, codec.encode(value)); }
        catch { /* Memory remains available when storage is full or disabled. */
          try { sessionStorage.removeItem(key); } catch { /* Storage disabled. */ }
        }
      }
      notify();
    },
    clear(): void {
      memory = null;
      if (codec) {
        try { sessionStorage.removeItem(key); } catch { /* Storage disabled. */ }
      }
      notify();
    },
  };
}
