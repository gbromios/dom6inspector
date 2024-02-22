import { FTColumn } from '@/column';
import { columnDefs } from '../column-defs'

export type DB = {
  readonly version: number;
  readonly idb: IDBDatabase;
  readonly tables: Record<string, any[]>;
}

export async function loadDB (idb: IDBDatabase, version: number): Promise<DB> {
  const stores = Array.from(idb.objectStoreNames);
  const transaction = idb.transaction(stores, 'readonly');
  const tables = Object.fromEntries(
    await Promise.all(
      stores.map((name) =>
        new Promise<[string, any[]]>((resolve, reject) => {
          const request = transaction.objectStore(name).getAll();
          request.addEventListener('success', () =>
            resolve([name, request.result as any[]])
          );
          request.addEventListener('error', reject);
        }
        ).then(([name, rows]: [string, any[]]) => {
          if (name in columnDefs) {
            const cols: FTColumn[] = columnDefs[name].columns;
            rows = rows.map(r => {
              const o = {};
              for (const k in cols) o[k] = cols[k].getItemValue(r, o);
              return o; // why do i want to use reduce... ASSHOLE
            });
          }
          return [name, rows];
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
