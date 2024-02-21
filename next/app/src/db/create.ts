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
  const dbBinRequest = fetch('/db.30.bin').then(r => r.blob());
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

  const blob = await dbBinRequest;
  console.log('heres our blob', blob);
  const tables = await Table.openBlob(blob)
  console.log('heres our tables', tables);

  await bulkInsert({ Unit: tables.Unit }, db);
  return db;
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
