// https://github.com/sveltetools/svelte-asyncable
import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';
import { writable, derived, get } from 'svelte/store';

type Awaitable<T> = T|Promise<T>;
type AsyncGetter<T, V extends []> = (...stores: V) => Awaitable<T>;
type AsyncSetter<T> = (newValue: T, oldValue: T) => Awaitable<void>

type AsyncStore<T, V extends []> = {
  get (): Promise<T>;
  set (newValue: T): Promise<void>;
  subscribe (run: Subscriber<T>): Unsubscriber;
  update: any;
}

export function asyncable<T, V extends [] = any>(
  getter: AsyncGetter<T, V>,
  setter: AsyncSetter<T> = () => {},
  stores: Readable<V[number]>[] = [] // idk>>>????
): AsyncStore<T, V> {
  let resolve: (result: T) => void;
  const initial = new Promise((res) => (resolve = res));

  const derived$ = derived(stores, (values) => values);

  const store$ = writable(initial, (set) => {
    return derived$.subscribe(async (values = []) => {
      let value = getter(...values as V);
      if (value === undefined) return;
      value = Promise.resolve(value);
      set(value);
      resolve(value as T);
    });
  });

  async function set(newValue: T, oldValue: T) {
    if (newValue === oldValue) return;
    store$.set(Promise.resolve(newValue));
    try {
      await setter(newValue, oldValue);
    } catch (err) {
      store$.set(Promise.resolve(oldValue));
      throw err;
    }
  }

  return {
    subscribe: store$.subscribe as any, // asajkfajksd
    async update(reducer: any /* idc about this tbh */) {
      if (!setter) return;
      let oldValue;
      let newValue;
      try {
        oldValue = await get(store$);
        newValue = await reducer(shallowCopy(oldValue));
      } finally {
        await set(newValue, oldValue as T);
      }
    },

    async set(newValue: T) {
      if (!setter) return;
      let oldValue;
      try {
        oldValue = await get(store$);
        newValue = await newValue;
      } finally {
        await set(newValue, oldValue as T);
      }
    },

    get(): Promise<T> {
      return get(store$) as Promise<T>;
    },
  };
}

/*
export function syncable(stores, initialValue) {
  return derived(
    stores,
    ($values, set) =>
      (Array.isArray(stores) ? Promise.allSettled : Promise.resolve)
        .call(Promise, $values)
        .then(set),
    initialValue
  );
}
*/

function shallowCopy<T> (value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  return (Array.isArray(value) ? [...value] : { ...value }) as T;
}
