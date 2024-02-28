import type { Column } from '../column';
import { browser } from '$app/environment';
import { createDB, fetchTables } from './create';
import { loadDB } from './load';

type IDBDatabase = any; // tf!!!

export type StoreTable = {
  db: IDBDatabase;
  name: string;
  columns: Column[];
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

export function useDB(
  version: number = CURRENT_VERSION,
  status?: (...args: any[]) => void,
) {
  console.log('use dbuse db??')
  if (_dbPromise) return _dbPromise;
  if (browser) {
    window._KILLDB = () => {
      globalThis.indexedDB?.deleteDatabase('d6mi');
      window.location.reload();
    };
    return _dbPromise = new Promise(r => setTimeout(r, 10))
      .then(() => initDB(version, status));
  } else {
    throw new Error('THIS IS THE SERVER YOU FUCKING DUMBSHIT FUCKBOY')
  }
}

let initCalled = 0;
export const CURRENT_VERSION = 30;
function initDB (
  version: number = CURRENT_VERSION,
  status?: (...args: any[]) => void,
): Promise<any> {
  if (initCalled++) throw new Error(`you called init ${initCalled} times`);
  console.log('init db?', version)
  return new Promise<DB>((resolve, reject) => {
    let noUpgradeNeeded = true;
    if (!window.indexedDB)
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
        // for console inspection
        window._GIVEDB = () => void fetchTables(CURRENT_VERSION);
        resolve(loadDB(openRequest.result, CURRENT_VERSION));
      }
    });
  });
}
