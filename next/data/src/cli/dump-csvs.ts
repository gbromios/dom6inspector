import { csvDefs } from './csv-defs';
import { parseAll, readCSV } from './parse-csv';
import process from 'node:process';
import { Table } from 'dom6inspector-next-lib';
import { writeFile } from 'node:fs/promises';

const width = process.stdout.columns;
const [file, ...fields] = process.argv.slice(2);

console.log('ARGS', { file, fields })

if (file) {
  const def = csvDefs[file];
  if (def) getDUMPY(await readCSV(file, def));
} else {
  const dest = './data/db.bin'
  const tables = await parseAll(csvDefs);
  const blob = Table.concatTables(tables);
  await writeFile(dest, blob.stream(), { encoding: null });
  console.log(`wrote ${blob.size} bytes to ${dest}`);
}

/*
if (file) {
  const def = csvDefs[file];
  if (def) getDUMPY(await readCSV(file, def));
  else throw new Error(`no def for "${file}"`);
} else {
  const tables = await parseAll(csvDefs);
  for (const t of tables) await getDUMPY(t);
}
*/


async function getDUMPY(t: Table) {
  const n = Math.floor(Math.random() * (t.rows.length - 30));
  const m = n + 30;
  const f = t.schema.fields.slice(0, 8);
  const blob = Table.concatTables([t]);
  console.log('\n\n       BEFORE:');
  t.print(width, f, n, m);
  //t.print(width, null, 10);
  //t.schema.print();
  console.log('\n\n')
  const u = await Table.openBlob(blob);
  console.log('\n\n        AFTER:');
  //u.Unit.print(width, null, 10);
  Object.values(u)[0]?.print(width, f, n, m);
  //u.Unit.schema.print(width);
  //await writeFile('./tmp.bin', blob.stream(), { encoding: null });
}
