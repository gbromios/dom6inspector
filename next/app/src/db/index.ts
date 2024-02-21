import type { DB } from './load';
import { createDB } from './create';
import { loadDB } from './load';

let _dbPromise: Promise<DB>|null = null;
//globalThis.indexedDB?.deleteDatabase('d6mi'); // testing db creation
export const CURRENT_VERSION = 30;
export function useDB (
  version: number = CURRENT_VERSION,
  status: (...args: any[]) => void,
): Promise<any> {
  return _dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
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

    let noUpgradeNeeded = true;
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

    openRequest.addEventListener('success', (e) => {
      console.log('success', e, noUpgradeNeeded)
      if (noUpgradeNeeded) resolve(openRequest.result);
    });
  }).then(idb => loadDB(idb, CURRENT_VERSION));
}
