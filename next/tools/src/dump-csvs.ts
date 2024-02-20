import { csvDefs } from './csv-defs';
import { parseAll, readCSV } from './parse-csv';
import process from 'node:process';
import { Table } from './table';
import { writeFile } from 'node:fs/promises';

const width = process.stdout.columns;
const [file, ...fields] = process.argv.slice(2);

console.log('ARGS', { file, fields })

if (file) {
  const def = csvDefs[file];
  //if (def) (await readCSV(file, def)).print(width, fields)
  if (def) getDUMPY(await readCSV(file, def));
  else throw new Error(`no def for "${file}"`);
} else {
  const tables = await parseAll(csvDefs);
  for (const t of tables) await getDUMPY(t);
}


async function getDUMPY(t: Table) {
  const blob = Table.concatTables([t]);
  const u = await Table.openBlob(blob);
  //t.schema.print();
  debugger;
  u.Unit.print(width);
  //await writeFile('./tmp.bin', blob.stream(), { encoding: null });
  //console.log('writed')

}
