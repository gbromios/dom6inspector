import type { SchemaArgs, Row } from 'dom6inspector-next-lib';

import { readFile } from 'node:fs/promises';
import {
  Schema,
  Table,
  COLUMN,
  argsFromText,
  argsFromType,
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

type CreateExtraField = (
  index: number,
  a: SchemaArgs,
  name: string,
  override?: (...args: any[]) => any,
) => ColumnArgs;

export type ParseSchemaOptions = {
  name?: string,
  ignoreFields: Set<string>;
  separator: string;
  overrides: Record<string, (...args: any[]) => any>;
  knownFields: Record<string, COLUMN>,
  extraFields: Record<string, CreateExtraField>,
}

const DEFAULT_OPTIONS: ParseSchemaOptions = {
  ignoreFields: new Set(),
  overrides: {},
  knownFields: {},
  extraFields: {},
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
    rawFields: {},
    overrides: _opts.overrides,
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

  const rawColumns: ColumnArgs[] = [];
  for (const [index, name] of rawFields.entries()) {
    let c: null | ColumnArgs = null;
    schemaArgs.rawFields[name] = index;
    if (_opts.ignoreFields?.has(name)) continue;
    if (_opts.knownFields[name]) {
      c = argsFromType(
        name,
        _opts.knownFields[name],
        index,
        schemaArgs,
      )
    } else {
      try {
        c = argsFromText(
          name,
          index,
          schemaArgs,
          rawData,
        );
      } catch (ex) {
        console.error(
          `GOOB INTERCEPTED IN ${schemaArgs.name}: \x1b[31m${index}:${name}\x1b[0m`,
            ex
        );
        throw ex
      }
    }
    if (c !== null) {
      if (c.type === COLUMN.BOOL) schemaArgs.flagsUsed++;
      rawColumns.push(c);
    }
  }

  if (options?.extraFields) {
    const bi = Object.values(schemaArgs.rawFields).length; // hmmmm
    rawColumns.push(...Object.entries(options.extraFields).map(
      ([name, createColumn]: [string, CreateExtraField], ei: number) => {
        const override = schemaArgs.overrides[name];
        //console.log(ei, schemaArgs.rawFields)
        const index = bi + ei;
        const ca = createColumn(index, schemaArgs, name, override);
        try {
          if (ca.index !== index) throw new Error('wiseguy picked his own index');
          if (ca.name !== name) throw new Error('wiseguy picked his own name');
          if (ca.type === COLUMN.BOOL) {
            if (ca.bit !== schemaArgs.flagsUsed) throw new Error('piss baby idiot');
            schemaArgs.flagsUsed++;
          }
        } catch (ex) {
          console.log(ca, { index, override, name, })
          throw ex;
        }
        return ca;
      })
    );
  }

  const data: Row[] = new Array(rawData.length)
    .fill(null)
    .map((_, __rowId) => ({ __rowId }))
    ;

  for (const colArgs of rawColumns) {
    const col = fromArgs(colArgs);
    schemaArgs.columns.push(col);
    schemaArgs.fields.push(col.name);
  }

  for (const col of schemaArgs.columns) {
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(
        rawData[r.__rowId][col.index],
        rawData[r.__rowId],
        schemaArgs,
      );
  }

  return new Table(data, new Schema(schemaArgs));
}

export async function parseAll(defs: Record<string, Partial<ParseSchemaOptions>>) {
  return Promise.all(
    Object.entries(defs).map(([path, options]) => readCSV(path, options))
  );
}
