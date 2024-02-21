import { transforms } from "dom6inspector-next-data/client";

export type DB = {
  readonly version: number;
  readonly idb: IDBDatabase;
  readonly tables: Record<string, any[]>;
}

export async function loadDB (idb: IDBDatabase, version: number): Promise<DB> {
  const stores = Array.from(idb.objectStoreNames);
  const transaction = idb.transaction(stores, 'readonly');
  const versionTransforms = transforms[version];
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
        ).then(([name, rows]) => {
          const tfs = versionTransforms[name];
          if (tfs) for (const r of rows) for (const t of tfs) t(r);
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
