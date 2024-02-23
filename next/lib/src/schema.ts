import type { Column } from './column';
import type { Row } from './table'
import {
  isStringColumn,
  isBigColumn,
  COLUMN,
  BigColumn,
  BoolColumn,
  StringColumn,
  NumericColumn,
  cmpFields,
} from './column';
import { bytesToString, stringToBytes } from './serialize';
import { tableDeco } from './util';

export type SchemaArgs = {
  name: string;
  columns: Column[],
  fields: string[],
  flagsUsed: number;
  rawFields: Record<string, number>;
  overrides: Record<string, (...args: []) => any>
}

type BlobPart = any; // ?????

export class Schema {
  readonly name: string;
  readonly columns: Readonly<Column[]>;
  readonly fields: Readonly<string[]>;
  readonly columnsByName: Record<string, Column>;
  readonly fixedWidth: number; // total bytes used by numbers + flags
  readonly flagFields: number;
  readonly stringFields: number;
  readonly bigFields: number;
  constructor({ columns, name, flagsUsed }: SchemaArgs) {
    this.name = name;
    this.columns = [...columns].sort(cmpFields);
    this.fields = this.columns.map(c => c.name);
    this.columnsByName = Object.fromEntries(this.columns.map(c => [c.name, c]));
    this.flagFields = flagsUsed;
    this.fixedWidth = columns.reduce(
      (w, c) => w + ((!c.isArray && c.width) || 0),
      Math.ceil(flagsUsed / 8), // 8 flags per byte, natch
    );

    let o: number|null = 0;
    let f = true;
    let b = false;
    let ff = 0;
    for (const [i, c] of this.columns.entries()) {
      let OC = -1;
      //if (c.type & 16) break;
      switch (c.type) {
        case COLUMN.BIG:
        case COLUMN.STRING:
        case COLUMN.STRING_ARRAY:
        case COLUMN.U8_ARRAY:
        case COLUMN.I8_ARRAY:
        case COLUMN.U16_ARRAY:
        case COLUMN.I16_ARRAY:
        case COLUMN.U32_ARRAY:
        case COLUMN.I32_ARRAY:
        case COLUMN.BIG_ARRAY:
          if (f) {
            if (o > 0) {
              const dso = Math.max(0, i - 2)
              console.error(this.name, i, o, `DSO:${dso}..${i + 2}:`, columns.slice(Math.max(0, i - 2), i + 2));
              debugger;
              throw new Error('should not be!')
            } else {
              f = false;
            }
          }
          if (b) {
            //console.log('~~~~~ BOOL TIMES DONE ~~~~~');
            b = false;
            if (ff !== this.flagFields) throw new Error('boooOSAASOAO');
          }

          break;
        case COLUMN.BOOL:
          if (!f) {
            throw new Error('should be!')
            //console.error(c, o);
          }
          if (!b) {
            //console.log('~~~~~ BOOL TIMES ~~~~~');
            b = true;
            if (ff !== 0) throw new Error('booo');
          }
          OC = o;
          // @ts-ignore
          c.offset = o; c.bit = ff++; c.flag = 2 ** (c.bit % 8); // hehehe
          if (c.flag === 128) o++;
          if (c.bit + 1 === this.flagFields) {
            if (c.flag === 128 && o !== this.fixedWidth) throw new Error('WHUPOSIE')
            if (c.flag < 128 && o !== this.fixedWidth - 1) throw new Error('WHUPOSIE - 1')
            f = false;
          }
          break;
        case COLUMN.U8:
        case COLUMN.I8:
        case COLUMN.U16:
        case COLUMN.I16:
        case COLUMN.U32:
        case COLUMN.I32:
          OC = o;
          // @ts-ignore
          c.offset = o;
          if (!c.width) debugger;
          o += c.width!;
          if (o === this.fixedWidth) f = false;
          break;
      }
      //const rng = OC < 0 ? `` : ` ${OC}..${o} / ${this.fixedWidth}`
      //console.log(`[${i}]${rng}`, c.name, c.label)
    }
    this.stringFields = columns.filter(c => isStringColumn(c.type)).length;
    this.bigFields = columns.filter(c => isBigColumn(c.type)).length;

  }

  static fromBuffer (buffer: ArrayBuffer): Schema {
    let i = 0;
    let read: number;
    let name: string;
    const bytes = new Uint8Array(buffer);
    [name, read] = bytesToString(i, bytes);
    i += read;

    const args = {
      name,
      columns: [] as Column[],
      fields: [] as string[],
      flagsUsed: 0,
      rawFields: {}, // none :<
      overrides: {}, // none~
    };

    const numFields = bytes[i++] | (bytes[i++] << 8);

    let index = 0;
    // TODO - only works when 0-field schemas aren't allowed~!
    while (index < numFields) {
      const type = bytes[i++];
      [name, read] = bytesToString(i, bytes);
      const f = {
        index, name, type,
        width: null, bit: null, flag: null,
        order: 999
      };
      i += read;
      let c: Column;

      switch (type & 15) {
        case COLUMN.STRING:
          c = new StringColumn({ ...f });
          break;
        case COLUMN.BIG:
          c = new BigColumn({ ...f });
          break;
        case COLUMN.BOOL:
          const bit = args.flagsUsed++;
          const flag = 2 ** (bit % 8);
          c = new BoolColumn({ ...f, bit, flag });
          break;
        case COLUMN.I8:
        case COLUMN.U8:
          c = new NumericColumn({ ...f, width: 1 });
          break;
        case COLUMN.I16:
        case COLUMN.U16:
          c = new NumericColumn({ ...f, width: 2 });
          break;
        case COLUMN.I32:
        case COLUMN.U32:
          c = new NumericColumn({ ...f, width: 4 });
          break;
        default:
          throw new Error(`unknown type ${type}`);
      }
      args.columns.push(c);
      args.fields.push(c.name);
      index++;
    }
    return new Schema(args);
  }

  rowFromBuffer(
      i: number,
      buffer: ArrayBuffer,
      __rowId: number
  ): [Row, number] {
    const dbr = __rowId < 5 || __rowId > 3975 || __rowId % 1000 === 0;
    //if (dbr) console.log(` - ROW ${__rowId} FROM ${i} (0x${i.toString(16)})`)
    let totalRead = 0;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const row: Row = { __rowId }
    const lastBit = this.flagFields - 1;
    for (const c of this.columns) {
      //if (c.offset && c.offset !== totalRead) { debugger; console.log('woopsie'); }
      let [v, read] = c.isArray ?
        c.arrayFromBytes(i, bytes, view) :
        c.fromBytes(i, bytes, view);

      if (c.type === COLUMN.BOOL)
        read = (c.flag === 128 || c.bit === lastBit) ? 1 : 0;

      i += read;
      totalRead += read;
      row[c.name] = v;
      //const w = globalThis._ROWS[this.name][__rowId][c.name] // srs biz
      /*
      if (w !== v) {
        if (!Array.isArray(w) || w.some((n, i) => n !== v[i])) {
          console.error(`XXXXX ${this.name}[${__rowId}][${c.name}] ${w} -> ${v}`)
        }
      } else {
        //console.error(`_____ ${this.name}[${__rowId}][${c.name}] ${w} == ${v}`)
      }
      */
    }
    //if (dbr) {
      //console.log(`   READ: ${totalRead} TO ${i} / ${buffer.byteLength}\n`, row, '\n\n');
      //debugger;
    //}
    return [row, totalRead];
  }

  printRow (r: Row, fields: Readonly<string[]>) {
    return Object.fromEntries(fields.map(f => [f, r[f]]));
  }

  serializeHeader (): Blob {
    // [...name, 0, numFields0, numFields1, field0Type, field0Flag?, ...field0Name, 0, etc];
    // TODO - Base unit has 500+ fields
    if (this.columns.length > 65535) throw new Error('oh buddy...');
    const parts = new Uint8Array([
      ...stringToBytes(this.name),
      this.columns.length & 255,
      (this.columns.length >>> 8),
      ...this.columns.flatMap(c => c.serialize())
    ])
    return new Blob([parts]);
  }

  serializeRow (r: Row): Blob {
    const fixed = new Uint8Array(this.fixedWidth);
    let i = 0;
    const lastBit = this.flagFields - 1;
    const blobParts: BlobPart[] = [fixed];
    for (const c of this.columns) {
      
      try {
      const v = r[c.name]
      if (c.isArray) {
        const b: Uint8Array = c.serializeArray(v as any[])
        i += b.length; // debuggin
        blobParts.push(b);
        continue;
      }
      switch(c.type) {
        case COLUMN.STRING: {
          const b: Uint8Array = c.serializeRow(v as string)
          i += b.length; // debuggin
          blobParts.push(b);
        } break;
        case COLUMN.BIG: {
          const b: Uint8Array = c.serializeRow(v as bigint)
          i += b.length; // debuggin
          blobParts.push(b);
        } break;

        case COLUMN.BOOL:
          fixed[i] |= c.serializeRow(v as boolean);
          // dont need to check for the last flag since we no longer need i
          // after we're done with numbers and booleans
          //if (c.flag === 128) i++;
          // ...but we will becauyse we broke somethign
          if (c.flag === 128 || c.bit === lastBit) i++;
          break;

        case COLUMN.U8:
        case COLUMN.I8:
        case COLUMN.U16:
        case COLUMN.I16:
        case COLUMN.U32:
        case COLUMN.I32:
          const bytes = c.serializeRow(v as number)
          fixed.set(bytes, i)
          i += c.width!;
          break;

        default:
          //console.error(c)
          throw new Error(`wat type is this ${(c as any).type}`);
      }
      } catch (ex) {
        console.log('GOOBER COLUMN:', c);
        console.log('GOOBER ROW:', r);
        throw ex;
      }
    }

    //if (r.__rowId < 5 || r.__rowId > 3975 || r.__rowId % 1000 === 0) {
      //console.log(` - ROW ${r.__rowId}`, { i, blobParts, r });
    //}
    return new Blob(blobParts);
  }

  print (width = 80): void {
    const [head, tail] = tableDeco(this.name, width, 36);
    console.log(head);
    const { fixedWidth, bigFields, stringFields, flagFields } = this;
    console.log({ fixedWidth, bigFields, stringFields, flagFields });
    console.table(this.columns, [
      'name',
      'label',
      'offset',
      'order',
      'bit',
      'type',
      'flag',
      'width',
    ]);
    console.log(tail);

  }

  // rawToRow (d: RawRow): Record<string, unknown> {}
  // rawToString (d: RawRow, ...args: string[]): string {}
};

