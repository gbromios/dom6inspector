import type { DB } from './load';
import { createDB, fetchTables } from './create';
import { loadDB } from './load';
import { FTColumn } from '@/column';

export type StoreTable = {
  db: IDBDatabase;
  name: string;
  columns: FTColumn[];
  defaults: Set<string>;
  readonly rowKey: string;
  rows: any[]; // raw data, honestly could get rid of it
  items: any[]; // processed data (in store etc)
};

export type DB = {
  readonly version: number;
  readonly idb: IDBDatabase;
  readonly tables: Record<string, StoreTable>;
};



let _dbPromise: Promise<DB>|null = null;
window._KILLDB = () => {
  globalThis.indexedDB?.deleteDatabase('d6mi');
  window.location.reload();
};
export const CURRENT_VERSION = 30;
export function useDB (
  version: number = CURRENT_VERSION,
  status: (...args: any[]) => void,
): Promise<any> {
  return _dbPromise ??= new Promise<DB>((resolve, reject) => {
    let noUpgradeNeeded = true;
    if (!globalThis.indexedDB)
      return reject('browser does not supported IndexedDB');
    const openRequest = indexedDB.open('d6mi', version);
    openRequest.addEventListener('error', (e) => {
      console.error('open request failed', e);
      reject(`fatal error while openinng database`)
    });

    openRequest.addEventListener('blocked', (e) => {
      console.error('open request blocked', e);
      reject(`fatal error: database blocked (open in another tab?)`)
    });

    openRequest.addEventListener('upgradeneeded', async (e) => {
      // what does a null newVersion even mean???
      console.log('upgradeneeded', e)
      noUpgradeNeeded = false;
      resolve({
        tables: await createDB(
          e.oldVersion,
          e.newVersion!,
          openRequest.result
        ),
        version: CURRENT_VERSION,
        idb: openRequest.result,
      })

    });

    openRequest.addEventListener('success', () => {
      if (noUpgradeNeeded) {
        console.log('loaded db from indexedDB');
        void fetchTables(CURRENT_VERSION); // for console inspection
        resolve(loadDB(openRequest.result, CURRENT_VERSION));
      }
    });
  });
}
