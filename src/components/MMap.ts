
export interface MMap<K, V> {
  has: (k: K) => boolean;
  get: (k: K) => V | undefined;
  set: (k: K, v: V) => V;
}

export function MMap<K, KT>(fn: (k: K) => KT) {
  return {
    of: <V>(): MMap<K, V> => {
      const map = (new Map<KT, V>());
      return {
        has: (k: K) => map.has(fn(k)),
        get: (k: K) => map.get(fn(k)),
        set: (k: K, v: V) => {
          map.set(fn(k), v);
          return v;
        },
      };
    },
  };
}
