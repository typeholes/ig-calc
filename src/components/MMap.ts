import { defined, mapIter } from 'src/js/util';
import { reactive } from 'vue';

export interface MMap<K, V> {
  has: (k: K) => boolean;
  get: (k: K) => V | undefined;
  set: (k: K, v: V) => V;
  mappedKeys: () => Generator<K, void, unknown>;
  values: () => IterableIterator<V>;
}

export function MMap<K, KT>(fn: (k: K) => KT, un: (kt: KT) => K) {
  return {
    of: <V>(kv?: [K, V] | undefined): MMap<K, V> => {
      const map = reactive(new Map<KT, V>());
      const mmap = {
        has: (k: K) => map.has(fn(k)),
        get: (k: K) => map.get(fn(k)),
        set: (k: K, v: V) => {
          map.set(fn(k), v);
          return v;
        },
        mappedKeys: () => mapIter(map.keys(), un),
        values: () => map.values(),
      };

      if (defined(kv)) {
        mmap.set(kv[0], kv[1]);
      }

      return mmap;
    },
  };
}
