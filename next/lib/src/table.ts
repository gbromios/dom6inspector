import { Schema } from './schema';
import { tableDeco } from './util';
export type RowData = string[];
export type Row = Record<string, boolean|number|string|bigint> & { __rowId: number };

export class Table {
  get name (): string { return `[TABLE:${this.schema.name}]`; }
  constructor (
    readonly rows: Row[],
    readonly schema: Schema,
  ) {
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
    return Object.fromEntries(tables.map(t => [t.schema.name, t]));
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
    m: number|null = null
  ): void {
    const [head, tail] = tableDeco(this.name, width, 18);
    const rows = n === null ? this.rows :
      m === null ? this.rows.slice(0, n) :
      this.rows.slice(n, m);

    const [pRows, pFields] = fields ?
      [rows.map((r: Row) => this.schema.printRow(r, fields)), fields]:
      [rows, this.schema.fields]
      ;

    console.log(head);
    console.table(pRows, pFields);
    console.log(tail);
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
type TableBlob = { numRows: number, headerBlob: Blob, dataBlob: Blob };
