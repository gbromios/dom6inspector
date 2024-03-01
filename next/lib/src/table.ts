import { Schema } from './schema';
import { tableDeco } from './util';
export type RowData = string|number|boolean|bigint|(string|number|bigint)[];
export type Row = Record<string, RowData> & { __rowId: number };

type TableBlob = { numRows: number, headerBlob: Blob, dataBlob: Blob };

export class Table {
  get name (): string { return this.schema.name }
  get key (): string { return this.schema.key }
  readonly map: Map<any, any> = new Map()
  constructor (
    readonly rows: Row[],
    readonly schema: Schema,
  ) {
    const keyName = this.key;
    if (keyName !== '__rowId') for (const row of this.rows) {
      const key = row[keyName];
      if (this.map.has(key)) throw new Error('key is not unique');
      this.map.set(key, row);
    }
  }

  serialize (): [Uint32Array, Blob, Blob] {
    // [numRows, headerSize, dataSize], schemaHeader, [row0, row1, ... rowN];
    const schemaHeader = this.schema.serializeHeader();
    // cant figure out how to do this with bits :'<
    const schemaPadding = (4 - schemaHeader.size % 4) % 4;
    const rowData = this.rows.flatMap(r => this.schema.serializeRow(r));

    //const rowData = this.rows.flatMap(r => {
      //const rowBlob = this.schema.serializeRow(r)
      //if (r.__rowId === 0)
        //rowBlob.arrayBuffer().then(ab => {
          //console.log(`ARRAY BUFFER FOR FIRST ROW OF ${this.name}`, new Uint8Array(ab).join(', '));
        //});
      //return rowBlob;
    //});
    const rowBlob = new Blob(rowData)
    const dataPadding = (4 - rowBlob.size % 4) % 4;

    return [
      new Uint32Array([
        this.rows.length,
        schemaHeader.size + schemaPadding,
        rowBlob.size + dataPadding
      ]),
      new Blob([
        schemaHeader,
        new ArrayBuffer(schemaPadding) as any // ???
      ]),
      new Blob([
        rowBlob,
        new Uint8Array(dataPadding)
      ]),
    ];
  }

  static concatTables (tables: Table[]): Blob {
    const allSizes = new Uint32Array(1 + tables.length * 3);
    const allHeaders: Blob[] = [];
    const allData: Blob[] = [];

    const blobs = tables.map(t => t.serialize());
    allSizes[0] = blobs.length;
    for (const [i, [sizes, headers, data]] of blobs.entries()) {
      //console.log(`OUT BLOBS FOR T=${i}`, sizes, headers, data)
      allSizes.set(sizes, 1 + i * 3);
      allHeaders.push(headers);
      allData.push(data);
    }
    //console.log({ tables, blobs, allSizes, allHeaders, allData })
    return new Blob([allSizes, ...allHeaders, ...allData]);
  }

  static async openBlob (blob: Blob): Promise<Record<string, Table>> {
    if (blob.size % 4 !== 0) throw new Error('wonky blob size');
    const numTables = new Uint32Array(await blob.slice(0, 4).arrayBuffer())[0];

    // overall byte offset
    let bo = 4;
    const sizes = new Uint32Array(
      await blob.slice(bo, bo += numTables * 12).arrayBuffer()
    );

    const tBlobs: TableBlob[] = [];

    for (let i = 0; i < numTables; i++) {
      const si = i * 3;
      const numRows = sizes[si];
      const hSize = sizes[si + 1];
      tBlobs[i] = { numRows, headerBlob: blob.slice(bo, bo += hSize) } as any;
    };

    for (let i = 0; i < numTables; i++) {
      tBlobs[i].dataBlob = blob.slice(bo, bo += sizes[i * 3 + 2]);
    };
    const tables = await Promise.all(tBlobs.map((tb, i) => {
      //console.log(`IN BLOBS FOR T=${i}`, tb)
      return this.fromBlob(tb);
    }))
    const tableMap = Object.fromEntries(tables.map(t => [t.schema.name, t]));

    for (const t of tables) {
      if (!t.schema.joins) continue;
      const [aT, aF, bT, bF] = t.schema.joins;
      const tA = tableMap[aT];
      const tB = tableMap[bT];
      if (!tA) throw new Error(`${t.name} joins undefined table ${aT}`);
      if (!tB) throw new Error(`${t.name} joins undefined table ${bT}`);
      if (!t.rows.length) continue; // empty table i guess?
      for (const r of t.rows) {
        const idA = r[aF];
        const idB = r[bF];
        if (idA === undefined || idB === undefined) {
          console.error(`row has a bad id?`, r);
          continue;
        }
        const a = tA.map.get(idA);
        const b = tB.map.get(idB);
        if (a === undefined) {
          console.error(`row has a missing id?`, a, idA, r);
          continue;
        }
        if (b === undefined) {
          console.error(`row has a missing id?`, b, idB, r);
          continue;
        }
        (a[t.name] ??= []).push(r);
        (b[t.name] ??= []).push(r);
      }
    }
    return tableMap;
  }

  static async fromBlob ({
    headerBlob,
    dataBlob,
    numRows,
  }: TableBlob): Promise<Table> {
    const schema = Schema.fromBuffer(await headerBlob.arrayBuffer());
    let rbo = 0;
    let __rowId = 0;
    const rows: Row[] = [];
    // TODO - could definitely use a stream for this
    const dataBuffer = await dataBlob.arrayBuffer();
    console.log(`===== READ ${numRows} OF ${schema.name} =====`)
    while (__rowId < numRows) {
      const [row, read] = schema.rowFromBuffer(rbo, dataBuffer, __rowId++);
      rows.push(row);
      rbo += read;
    }

    return new Table(rows, schema);
  }


  print (
    width: number = 80,
    fields: Readonly<string[]>|null = null,
    n: number|null = null,
    m: number|null = null,
    p?: (r: any) => boolean,
  ): null|any[] {
    const [head, tail] = tableDeco(this.name, width, 18);
    const rows = p ? this.rows.filter(p) :
      n === null ? this.rows :
      m === null ? this.rows.slice(0, n) :
      this.rows.slice(n, m);


    let mFields = Array.from((fields ?? this.schema.fields));
    if (p) [n, m] = [0, rows.length]
    else (mFields as any).unshift('__rowId');

    const [pRows, pFields] = fields ?
      [rows.map((r: Row) => this.schema.printRow(r, mFields)), fields]:
      [rows, this.schema.fields]
      ;

    console.log('row filter:', p ?? '(none)')
    console.log(`(view rows ${n} - ${m})`);
    console.log(head);
    console.table(pRows, pFields);
    console.log(tail);
    return (p && fields) ?
      rows.map(r =>
        Object.fromEntries(fields.map(f => [f, r[f]]).filter(e => e[1]))
      ) :
      null;
  }

  dumpRow (i: number|null, showEmpty = false, useCSS?: boolean): string[] {
    // TODO — in browser, useCSS === true by default
    useCSS ??= (globalThis['window'] === globalThis); // idk
    i ??= Math.floor(Math.random() * this.rows.length);
    const row = this.rows[i];
    const out: string[] = [];
    const css: string[]|null = useCSS ? [] : null;
    const fmt = fmtStyled.bind(null, out, css);
    const p = Math.max(
      ...this.schema.columns
      .filter(c => showEmpty || row[c.name])
      .map(c => c.name.length + 2)
    );
    if (!row)
      fmt(`%c${this.schema.name}[${i}] does not exist`, C_NOT_FOUND);
    else {
      fmt(`%c${this.schema.name}[${i}]`, C_ROW_HEAD);
      for (const c of this.schema.columns) {
        const value = row[c.name];
        const n = c.name.padStart(p, ' ');
        switch (typeof value) {
          case 'boolean':
            if (value) fmt(`${n}: %cTRUE`, C_TRUE)
            else if (showEmpty) fmt(`%c${n}: %cFALSE`, C_NOT_FOUND, C_FALSE);
            break;
          case 'number':
            if (value) fmt(`${n}: %c${value}`, C_NUMBER)
            else if (showEmpty) fmt(`%c${n}: 0`, C_NOT_FOUND);
            break;
          case 'string':
            if (value) fmt(`${n}: %c${value}`, C_STR)
            else if (showEmpty) fmt(`%c${n}: —`, C_NOT_FOUND);
            break;
          case 'bigint':
            if (value) fmt(`{n}: %c0 %c${value} (BIG)`, C_BIG, C_NOT_FOUND);
            else if (showEmpty) fmt(`%c${n}: 0 (BIG)`, C_NOT_FOUND);
            break;
        }
      }
    }
    if (useCSS) return [out.join('\n'), ...css!];
    else return [out.join('\n')];
  }

  findRow (predicate: (row: Row) => boolean, start = 0): number {
    const N = this.rows.length
    if (start < 0) start = N - start;
    for (let i = start; i < N; i++) if (predicate(this.rows[i])) return i;
    return -1;
  }

  * filterRows (predicate: (row: Row) => boolean): Generator<Row> {
    for (const row of this.rows) if (predicate(row)) yield row;
  }
  /*
  rawToRow (d: string[]): Row {
    return Object.fromEntries(this.schema.columns.map(r => [
      r.name,
      r.toVal(d[r.index])
    ]));
  }
  rawToString (d: string[], ...args: string[]): string {
    // just assume first two fields are always id, name. even if that's not true
    // this is just for visualization purporses
    let extra = '';
    if (args.length) {
      const s: string[] = [];
      const e = this.rawToRow(d);
      for (const a of args) {
        // don't reprint name or id
        if (a === this.schema.fields[0] || a === this.schema.fields[1])
          continue;
        if (e[a] != null)
          s.push(`${a}: ${JSON.stringify(e[a])}`)
      }
      extra = s.length > 0 ? ` { ${s.join(', ')} }` : '{}';
    }
    return `<${this.schema.name}:${d[0] ?? '?'} "${d[1]}"${extra}>`;
  }
  */
}

function fmtStyled (
  out: string[],
  cssOut: string[] | null,
  msg: string,
  ...css: string[]
) {
  if (cssOut) {
    out.push(msg + '%c')
    cssOut.push(...css, C_RESET);
  }
  else out.push(msg.replace(/%c/g, ''));
}

const C_NOT_FOUND = 'color: #888; font-style: italic;';
const C_ROW_HEAD = 'font-weight: bolder';
const C_BOLD = 'font-weight: bold';
const C_NUMBER = 'color: #A05518; font-weight: bold;';
const C_TRUE = 'color: #4C38BE; font-weight: bold;';
const C_FALSE = 'color: #38BE1C; font-weight: bold;';
const C_STR = 'color: #30AA62; font-weight: bold;';
const C_BIG = 'color: #7821A3; font-weight: bold;';
const C_RESET = 'color: unset; font-style: unset; font-weight: unset; background-unset'
