import type { DB, StoreTable } from '.';
import { defs } from '../table-defs'
import { markRaw } from 'vue';

export async function loadDB (idb: IDBDatabase, version: number): Promise<DB> {
  const stores = Array.from(idb.objectStoreNames);
  const transaction = idb.transaction(stores, 'readonly');
  // TODO — does any of this need marking raw? i dont think so
  const tables = Object.fromEntries(
    await Promise.all(
      stores.map((name) =>
        new Promise<[string, StoreTable]>((resolve, reject) => {
          const request = transaction.objectStore(name).getAll();
          request.addEventListener( 'success', () => resolve([name, {
            name,
            db: idb,
            ...defs[name],
            items: (request.result as any[]).map(markRaw),
            rows: [],
          }])
          );
          request.addEventListener('error', reject);
        })
      )
    )
  );
  return {
    version,
    idb,
    tables,
  };
}
