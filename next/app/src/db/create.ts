import { Table, MIGRATION } from 'dom6inspector-next-lib';
import { migrations } from 'dom6inspector-next-data/client'

export function createDB(from: number, to: number, db: IDBDatabase) {
  if (from === 0 && to === 30) {
    return createDB30(db);
  } else {
    throw new Error(`idk how to upgrade database at all D:`);
  }
}

// TODO - need to make this more organized, just create the current one for now
async function createDB30 (db: IDBDatabase) {
  const tableRequest = fetchTables(30);
  for (const m of migrations[30]) {
    switch (m.type) {
      case MIGRATION.CREATE_STORE:
        const os = db.createObjectStore(m.name, {
          keyPath: m.primaryKey,
          autoIncrement: false
        });

        for (const { name, keyPath, options } of m.indices)
          os.createIndex(name, keyPath, options)
        break;

      case MIGRATION.CREATE_INDEX:
        break;
    }
  }

  const tables = await tableRequest;
  await bulkInsert({ Unit: tables.Unit }, db);
  return db;
}

export async function fetchTables (version: number) {
  const url = `/db.${version}.bin`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`fetch "${url}" failed: ${res.status} ${res.statusText}`);
  const blob = await res.blob();

  const tables = await Table.openBlob(blob)
  Object.assign(window, { __t: tables });
  console.log('tables loaded:', tables);
  return tables;
}



function bulkInsert (tables: Record<string, any>, db: IDBDatabase) {
  const stores = new Set(Array.from(db.objectStoreNames));
  return Promise.all(
    Object.entries(tables)
      .filter(([name]) => stores.has(name))
      .map(([name, table]) =>
        populateTable(db.transaction(name, 'readwrite'), table)
    )
  )
}

function populateTable (trans: IDBTransaction, table: Table) {
  console.log(` - POPULATE TABLE ${table.schema.name}`);
  return new Promise((resolve, reject) => {
    trans.addEventListener('complete', resolve);
    trans.addEventListener('abort', reject);
    trans.addEventListener('error', reject);
    const os = trans.objectStore(table.schema.name);
    for (const row of table.rows) os.add(row);
    trans.commit();
  });
}
