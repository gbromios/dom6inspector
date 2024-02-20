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
} from './column';
import { bytesToBigBoy, bytesToString, stringToBytes } from './serialize';
import { tableDeco } from './util';

type SchemaArgs = {
  name: string;
  columns: Column[],
  fields: string[],
  flagsUsed: number;
}

export class Schema {
  readonly name: string;
  readonly columns: Readonly<Column[]>;
  readonly fields: Readonly<string[]>;
  readonly columnsByName: Record<string, Column>;
  readonly fixedWidth: number; // total bytes used by numbers + flags
  readonly flagFields: number;
  readonly stringFields: number;
  readonly bigFields: number;
  constructor({ columns, fields, name, flagsUsed }: SchemaArgs) {
    this.name = name;
    this.columns = [...columns];
    this.fields = [...fields];
    this.columnsByName = Object.fromEntries(this.columns.map(c => [c.name, c]));
    this.flagFields = flagsUsed;
    this.fixedWidth = columns.reduce(
      (w, c) => w + (c.width ?? 0),
      Math.ceil(flagsUsed / 8), // 8 flags per byte, natch
    );
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
    };

    const numFields = bytes[i++] | (bytes[i++] << 8);



    let index = 0;
    // TODO - only works when 0-field schemas aren't allowed~!
    while (index < numFields) {
      const type = bytes[i++];
      [name, read] = bytesToString(i, bytes);
      const f = { index, name, type, width: null, bit: null, flag: null };
      i += read;
      let c: Column;

      switch (type) {
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
    let read: number;
    let totalRead = 0;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const row: Row = { __rowId }
    let v: any;
    for (const c of this.columns) {
      switch(c.type) {
        case COLUMN.STRING:
          // @ts-ignore wrong
          [v, read] = bytesToString(i, bytes);
          break;
        case COLUMN.BIG:
          // @ts-ignore wrong
          [v, read] = bytesToBigBoy(i, bytes);
          break;

        case COLUMN.BOOL:
          v = (bytes[i] & c.flag);
          read = (c.flag === 128 || c.bit === this.flagFields - 1) ? 1 : 0;
          break;

        case COLUMN.I8:
          v = view.getInt8(i)
          read = 1;
          break;
        case COLUMN.U8:
          v = view.getUint8(i)
          read = 1;
          break;
        case COLUMN.I16:
          v = view.getInt16(i, true);
          read = 2;
          break;
        case COLUMN.U16:
          v = view.getUint16(i, true);
          read = 2;
          break;
        case COLUMN.I32:
          v = view.getInt32(i, true);
          read = 4;
          break;
        case COLUMN.U32:
          v = view.getUint32(i, true);
          read = 4;
          break;

        default:
          throw new Error(
            `cant parse column ${(c as any).name} of type ${(c as any).type}`
          );
      }
      i += read;
      totalRead += read;
      row[c.name] = v;
    }
    return [row, totalRead];
  }

  printRow (r: Row, fields: Readonly<string[]>) {
    return Object.fromEntries(fields.map(f => [
      f,
      //this.columnsByName[f].print(r[f] as any)
      r[f],
    ]));
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
    const fixed = new ArrayBuffer(this.fixedWidth);
    let view = new DataView(fixed)
    let i = 0;
    const blobParts: BlobPart[] = [fixed];
    for (const c of this.columns) {
      const v = r[c.name];
      switch(c.type) {
        case COLUMN.STRING:
        case COLUMN.BIG:
          blobParts.push(v as Uint8Array);
          break;

        case COLUMN.BOOL:
          const f = view.getUint8(i);
          view.setUint8(i, f | v as number)
          if (c.flag === 128 || c.bit === this.flagFields - 1) i++;
          break;

        case COLUMN.I8:
          view.setInt8(i, v as number)
          i += 1;
          break;
        case COLUMN.U8:
          view.setUint8(i, v as number)
          i += 1;
          break;
        case COLUMN.I16:
          view.setInt16(i, v as number, true);
          i += 2;
          break;
        case COLUMN.U16:
          view.setUint16(i, v as number, true);
          i += 2;
          break;
        case COLUMN.I32:
          view.setInt32(i, v as number, true);
          i += 4;
          break;
        case COLUMN.U32:
          view.setUint32(i, v as number, true);
          i += 4;
          break;
      }
    }
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

