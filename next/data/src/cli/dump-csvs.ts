import { csvDefs } from './csv-defs';
import { ParseSchemaOptions, parseAll, readCSV } from './parse-csv';
import process from 'node:process';
import { Table } from 'dom6inspector-next-lib';
import { writeFile } from 'node:fs/promises';
import { joinDumped } from './join-tables';

const width = process.stdout.columns;
const [file, ...fields] = process.argv.slice(2);

function findDef (name: string): [string, Partial<ParseSchemaOptions>] {
  if (csvDefs[name]) return [name, csvDefs[name]];
  for (const k in csvDefs) {
    const d = csvDefs[k];
    if (d.name === name) return [k, d];
  }
  throw new Error(`no csv defined for "${name}"`);
}

async function dumpOne(key: string) {
  const table = await readCSV(...findDef(key));
  compareDumps(table);
}

async function dumpAll () {
  const tables = await parseAll(csvDefs);
  // JOINS
  //joinDumped(tables);
  const dest = './data/db.30.bin'
  const blob = Table.concatTables(tables);
  await writeFile(dest, blob.stream(), { encoding: null });
  console.log(`wrote ${blob.size} bytes to ${dest}`);
}

async function compareDumps(t: Table) {
  const maxN = t.rows.length - 30
  let n: number;
  let p: any = undefined;
  if (fields[0] === 'FILTER') {
    n = 0; // will be ingored
    fields.splice(0, 1, 'id', 'name');
    p = (r: any) => fields.slice(2).some(f => r[f]);
  } else if (fields[1] === 'ROW' && fields[2]) {
    n = Number(fields[2]) - 15;
    console.log(`ensure row ${fields[2]} is visible (${n})`);
    if (Number.isNaN(n)) throw new Error('ROW must be NUMBER!!!!');
  } else {
    n = Math.floor(Math.random() * maxN)
  }
  n = Math.min(maxN, Math.max(0, n));
  const m = n + 30;
  const f = (fields.length ? (fields[0] === 'ALL' ? t.schema.fields : fields) :
   t.schema.fields.slice(0, 10)) as string[]
  dumpToConsole(t, n, m, f, 'BEFORE', p);
  /*
  if (1 + 1 === 2) return; // TODO - we not worried about the other side yet
  const blob = Table.concatTables([t]);
  console.log(`made ${blob.size} byte blob`);
  console.log('wait....');
  //(globalThis._ROWS ??= {})[t.schema.name] = t.rows;
  await new Promise(r => setTimeout(r, 1000));
  console.log('\n\n')
  const u = await Table.openBlob(blob);
  dumpToConsole(u[t.schema.name], n, m, f, 'AFTER', p);
  //await writeFile('./tmp.bin', blob.stream(), { encoding: null });
  */
}

function dumpToConsole(
  t: Table,
  n: number,
  m: number,
  f: string[],
  h: string,
  p?: (r: any) => boolean,
) {
  console.log(`\n     ${h}:`);
  t.schema.print(width);
  console.log(`(view rows ${n} - ${m})`);
  const rows = t.print(width, f, n, m, p);
  if (rows) for (const r of rows) console.table([r]);
  console.log(`    /${h}\n\n`)
}



console.log('ARGS', { file, fields })

if (file) dumpOne(file);
else dumpAll();


