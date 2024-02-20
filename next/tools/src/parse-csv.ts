import { Schema } from './schema';
import type { Field, Column } from './column';
import type { Row } from './table';


import { readFile } from 'node:fs/promises';
import { Table } from './table';
import { COLUMN, rangeToNumericType, cmpFields, isNumericColumn, StringColumn, BoolColumn, NumericColumn, BigColumn, fromData } from './column';



let _nextNameId = 1;
const textDecoder = new TextDecoder();
export async function readCSV (
  path: string,
  options: ParseSchemaOptions
): Promise<Table> {
  let raw: string;
  try {
    raw = await readFile(path, { encoding: 'utf8' });
  } catch (ex) {
    console.error(`failed to read schema from ${path}`, ex);
    throw new Error('could not read schema');
  }
  try {
    return csvToTable(raw, options);
  } catch (ex) {
    console.error(`failed to parse schema from ${path}:`, ex);
    throw new Error('could not parse schema');
  }
}

export type ParseSchemaOptions = {
  name?: string,
  ignoreFields?: Set<string>;
  overrides?: Record<string, (v: any) => any>;
}

export function csvToTable(raw: string, options: ParseSchemaOptions): Table {
  if (raw.indexOf('\0') !== -1) throw new Error('uh oh')

  const [rawFields, ...rawData] = raw
    .split('\n')
    .filter(line => line !== '')
    .map(line => line.split('\t'));
  const schemaName = options.name ?? `Schema_${_nextNameId++}`;

  const hCount = new Map<string, number>;
  for (const [i, f] of rawFields.entries()) {
    if (!f) throw new Error(`${schemaName} @ ${i} is an empty field name`);
    if (hCount.has(f)) {
      console.warn(`${schemaName} @ ${i} "${f} is a duplicate field name`);
      const n = hCount.get(f)!
      rawFields[i] = `${f}.${n}`;
    } else {
      hCount.set(f, 1);
    }
  }


  let index = 0;
  let flagsUsed = 0;
  let rawColumns: [col: Column, rawIndex: number][] = [];

  for (const [rawIndex, name] of rawFields.entries()) {
    if (options?.ignoreFields?.has(name)) continue;
    try {
      const c = fromData(name, rawIndex, index, flagsUsed, rawData, options?.overrides?.[name]);
      if (c !== null) {
        index++;
        if (c.type === COLUMN.BOOL) flagsUsed++;
        rawColumns.push([c, rawIndex]);
      }
    } catch (ex) {
      console.error(
        `GOOB INTERCEPTED IN ${schemaName}: \x1b[31m${index}:${name}\x1b[0m`,
          ex
      );
      throw ex
    }
  }

  const data: Row[] = new Array(rawData.length)
    .fill(null)
    .map((_, __rowId) => ({ __rowId }))
    ;

  //console.log(data);

  const columns: Column[] = [];
  const fields: string[] = [];
  rawColumns.sort((a, b) => cmpFields(a[0], b[0]));
  for (const [index, [col, rawIndex]] of rawColumns.entries()) {
    Object.assign(col, { index });
    columns.push(col);
    fields.push(col.name);
    for (const r of data)
      data[r.__rowId][col.name] = col.parse(rawData[r.__rowId][rawIndex])
  }

  return new Table(
    data,
    new Schema({
      name: schemaName,
      fields,
      columns,
      flagsUsed
    })
  )
}

export async function parseAll(defs: Record<string, ParseSchemaOptions>) {
  return Promise.all(
    Object.entries(defs).map(([path, options]) => readCSV(path, options))
  );
}
