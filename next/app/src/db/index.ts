import type { DB } from './load';
import { createDB, fetchTables } from './create';
import { loadDB } from './load';

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
  return _dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
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
      const db = await createDB(
        e.oldVersion,
        e.newVersion!,
        openRequest.result
      )
      resolve(db)

    });

    openRequest.addEventListener('success', () => {
      if (noUpgradeNeeded) {
        console.log('loaded db from indexedDB');
        void fetchTables(CURRENT_VERSION); // for console inspection
        resolve(openRequest.result);
      }
    });
  }).then(idb => loadDB(idb, CURRENT_VERSION));
}
