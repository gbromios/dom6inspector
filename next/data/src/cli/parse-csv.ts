import type { SchemaArgs, Row } from 'dom6inspector-next-lib';

import { readFile } from 'node:fs/promises';
import {
  Schema,
  Table,
  COLUMN,
  cmpFields,
  argsFromText,
  ColumnArgs,
  fromArgs
} from 'dom6inspector-next-lib';

let _nextAnonSchemaId = 1;
export async function readCSV (
  path: string,
  options?: Partial<ParseSchemaOptions>,
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
  ignoreFields: Set<string>;
  overrides: Record<string, (v: any) => any>;
  separator: string;
}

const DEFAULT_OPTIONS: ParseSchemaOptions = {
  ignoreFields: new Set(),
  overrides: {},
  separator: '\t', // surprise!
}

export function csvToTable(
  raw: string,
  options?: Partial<ParseSchemaOptions>
): Table {
  const _opts = { ...DEFAULT_OPTIONS, ...options };
  const schemaArgs: SchemaArgs = {
    name: _opts.name ?? `Schema_${_nextAnonSchemaId++}`,
    flagsUsed: 0,
    columns: [],
    fields: [],
  };

  if (raw.indexOf('\0') !== -1) throw new Error('uh oh')

  const [rawFields, ...rawData] = raw
    .split('\n')
    .filter(line => line !== '')
    .map(line => line.split(_opts.separator));

  const hCount = new Map<string, number>;
  for (const [i, f] of rawFields.entries()) {
    if (!f) throw new Error(`${schemaArgs.name} @ ${i} is an empty field name`);
    if (hCount.has(f)) {
      console.warn(`${schemaArgs.name} @ ${i} "${f}" is a duplicate field name`);
      const n = hCount.get(f)!
      rawFields[i] = `${f}.${n}`;
    } else {
      hCount.set(f, 1);
    }
  }

  let index = 0;
  let rawColumns: [col: ColumnArgs, rawIndex: number][] = [];

  for (const [rawIndex, name] of rawFields.entries()) {
    if (_opts.ignoreFields?.has(name)) continue;
    try {
      const c = argsFromText(
        name,
        rawIndex,
        index,
        schemaArgs.flagsUsed,
        rawData,
        _opts.overrides[name]
      );
      if (c !== null) {
        index++;
        if (c.type === COLUMN.BOOL) schemaArgs.flagsUsed++;
        rawColumns.push([c, rawIndex]);
      }
    } catch (ex) {
      console.error(
        `GOOB INTERCEPTED IN ${schemaArgs.name}: \x1b[31m${index}:${name}\x1b[0m`,
          ex
      );
      throw ex
    }
  }

  rawColumns.sort((a, b) => cmpFields(a[0], b[0]));
  const data: Row[] = new Array(rawData.length)
    .fill(null)
    .map((_, __rowId) => ({ __rowId }))
    ;

  for (const [index, [colArgs, rawIndex]] of rawColumns.entries()) {
    colArgs.index = index;
    const col = fromArgs(colArgs);
    schemaArgs.columns.push(col);
    schemaArgs.fields.push(col.name);
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(rawData[r.__rowId][rawIndex])
  }

  return new Table(data, new Schema(schemaArgs));
}

export async function parseAll(defs: Record<string, Partial<ParseSchemaOptions>>) {
  return Promise.all(
    Object.entries(defs).map(([path, options]) => readCSV(path, options))
  );
}
