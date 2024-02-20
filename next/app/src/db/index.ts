let _db: IDBDatabase|null = null;
let _dbPromise: Promise<IDBDatabase>|null = null;

export function useDB (): Promise<any> {
  if (_db) return Promise.resolve(_db);
  return _dbPromise ??= new Promise((resolve, reject) => {
    if (!globalThis.indexedDB)
      return reject('browser does not supported IndexedDB');
    const openRequest = indexedDB.open('d6mi', 30);
    openRequest.addEventListener('error', (e) => {
      console.error('open request failed', e);
      reject(`fatal error while openinng database`)
    });

    openRequest.addEventListener('blocked', (e) => {
      console.error('open request blocked', e);
      reject(`fatal error: database blocked (open in another tab?)`)
    });

    openRequest.addEventListener('upgradeneeded', (e) => {
      console.log('upgradeneeded', e)
    });

    openRequest.addEventListener('success', (e) => {
      resolve(_db = (e as any).result); // TODO - set tsconifig lib i guess?
    });
  })
}
