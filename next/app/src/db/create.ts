import type { StoreTable } from '.';
import { Table, MIGRATION } from 'dom6inspector-next-lib';
import { migrations } from 'dom6inspector-next-data/client'
import { defs } from '../table-defs'

export async function createDB(from: number, to: number, db: IDBDatabase) {
  const tableRequest = fetchTables(to);
  if (from === 0 && to === 30) {
    // TODO - figure out how to migrate?
    createDB30(db);
    return createTables(db, await tableRequest)
  } else {
    throw new Error(`idk how to upgrade database at all D:`);
  }
}

async function createDB30 (db: IDBDatabase) {
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
        break; // etc
    }
  }
}

async function createTables(
  db: IDBDatabase,
  tables: Record<string, Table>
) {
  const stores = new Set(Array.from(db.objectStoreNames));
  return Object.fromEntries(
    await Promise.all(
      Object.entries(defs)
        .filter(([name]: [string, any]) => stores.has(name) && tables[name])
        .map(([name, columns]) => bulkInsert({
          db,
          name,
          ...columns,
          rows: tables[name].rows,
          items: [],
        }))
    )
  );
}

export async function fetchTables (
  version: number
): Promise<Record<string, Table>> {
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

function bulkInsert (table: StoreTable): Promise<[string, StoreTable]> {
  const { db, name, rows, columns, items } = table;
  console.log(` - INSERT TABLE INTO STORE ${name}`, rows, columns);
  const transaction = db.transaction(name, 'readwrite')
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve([name, table]));
    transaction.addEventListener('abort', reject);
    transaction.addEventListener('error', reject);
    const os = transaction.objectStore(name);
    for (const row of rows) {
      const item = {};
      for (const column of columns)
        item[column.key] = column.getItemValue(row, item);
      os.add(item);
      items.push(item);
    }
    table.rows = []; // go to the debugger if u want them raw rows
    transaction.commit();
  });
}
