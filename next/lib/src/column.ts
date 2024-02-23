import type { SchemaArgs } from '.';
import { bigBoyToBytes, bytesToBigBoy, bytesToString, stringToBytes } from './serialize';

export type ColumnArgs = {
  type: COLUMN;
  index: number;
  name: string;
  readonly override?: (v: any, u: any, a: SchemaArgs) => any;
  width?: number|null;    // for numbers, in bytes
  flag?: number|null;
  bit?: number|null;
}

export enum COLUMN {
  UNUSED       = 0,
  STRING       = 1,
  BOOL         = 2,
  U8           = 3,
  I8           = 4,
  U16          = 5,
  I16          = 6,
  U32          = 7,
  I32          = 8,
  BIG          = 9,
  STRING_ARRAY = 17,
  U8_ARRAY     = 19,
  I8_ARRAY     = 20,
  U16_ARRAY    = 21,
  I16_ARRAY    = 22,
  U32_ARRAY    = 23,
  I32_ARRAY    = 24,
  BIG_ARRAY    = 25,
};

export const COLUMN_LABEL = [
  'UNUSED',
  'STRING',
  'BOOL',
  'U8',
  'I8',
  'U16',
  'I16',
  'U32',
  'I32',
  'BIG',
  'UNUSED',
  'UNUSED',
  'UNUSED',
  'UNUSED',
  'UNUSED',
  'UNUSED',
  'UNUSED',
  'STRING_ARRAY',
  'U8_ARRAY',
  'I8_ARRAY',
  'U16_ARRAY',
  'I16_ARRAY',
  'U32_ARRAY',
  'I32_ARRAY',
  'BIG_ARRAY',
];

export type NUMERIC_COLUMN =
  |COLUMN.U8
  |COLUMN.I8
  |COLUMN.U16
  |COLUMN.I16
  |COLUMN.U32
  |COLUMN.I32
  |COLUMN.U8_ARRAY
  |COLUMN.I8_ARRAY
  |COLUMN.U16_ARRAY
  |COLUMN.I16_ARRAY
  |COLUMN.U32_ARRAY
  |COLUMN.I32_ARRAY
  ;

const COLUMN_WIDTH: Record<NUMERIC_COLUMN, 1|2|4> = {
  [COLUMN.U8]: 1,
  [COLUMN.I8]: 1,
  [COLUMN.U16]: 2,
  [COLUMN.I16]: 2,
  [COLUMN.U32]: 4,
  [COLUMN.I32]: 4,
  [COLUMN.U8_ARRAY]: 1,
  [COLUMN.I8_ARRAY]: 1,
  [COLUMN.U16_ARRAY]: 2,
  [COLUMN.I16_ARRAY]: 2,
  [COLUMN.U32_ARRAY]: 4,
  [COLUMN.I32_ARRAY]: 4,

}

export function rangeToNumericType (
  min: number,
  max: number
): NUMERIC_COLUMN|null {
  if (min < 0) {
    // some kinda negative??
    if (min >= -128 && max <= 127) {
      // signed byte
      return COLUMN.I8;
    } else if (min >= -32768 && max <= 32767) {
      // signed short
      return COLUMN.I16;
    } else if (min >= -2147483648 && max <= 2147483647) {
      // signed long
      return COLUMN.I32;
    }
  } else {
    if (max <= 255) {
      // unsigned byte
      return COLUMN.U8;
    } else if (max <= 65535) {
      // unsigned short
      return COLUMN.U16;
    } else if (max <= 4294967295) {
      // unsigned long
      return COLUMN.U32;
    }
  }
  // GOTO: BIGOOOOOOOOBOOOOOYO
  return null;
}

export function isNumericColumn (type: COLUMN): type is NUMERIC_COLUMN {
  switch (type & 15) {
    case COLUMN.U8:
    case COLUMN.I8:
    case COLUMN.U16:
    case COLUMN.I16:
    case COLUMN.U32:
    case COLUMN.I32:
      return true;
    default:
      return false;
  }
}

export function isBigColumn (type: COLUMN): type is COLUMN.BIG | COLUMN.BIG_ARRAY {
  return (type & 15) === COLUMN.BIG;
}

export function isBoolColumn (type: COLUMN): type is COLUMN.BOOL {
  return type === COLUMN.BOOL;
}

export function isStringColumn (type: COLUMN): type is COLUMN.STRING | COLUMN.STRING_ARRAY {
  return (type & 15) === COLUMN.STRING;
}

export interface IColumn<T = any, R extends Uint8Array|number = any> {
  readonly type: COLUMN;
  readonly label: string;
  readonly index: number;
  readonly name: string;
  override?: (v: any, u: any, a: SchemaArgs) => any;
  arrayFromText(v: string, u: any, a: SchemaArgs): T[];
  fromText(v: string, u: any, a: SchemaArgs): T;
  arrayFromBytes(i: number, bytes: Uint8Array, view: DataView): [T[], number];
  fromBytes (i: number, bytes: Uint8Array, view: DataView): [T, number];
  serialize (): number[];
  serializeRow (v: T): R,
  serializeArray (v: T[]): R,
  toString (v: string): any;
  readonly width: number|null;    // for numbers, in bytes
  readonly flag: number|null;
  readonly bit: number|null;
  readonly order: number;
  readonly offset: number|null;
}

export class StringColumn implements IColumn<string, Uint8Array> {
  readonly type: COLUMN.STRING | COLUMN.STRING_ARRAY;
  readonly label: string = COLUMN_LABEL[COLUMN.STRING];
  readonly index: number;
  readonly name: string;
  readonly width: null = null;
  readonly flag: null = null;
  readonly bit: null = null;
  readonly order = 3;
  readonly offset = null;
  readonly isArray: boolean;
  override?: (v: any, u: any, a: SchemaArgs) => any;
  constructor(field: Readonly<ColumnArgs>) {
    const { index, name, type, override } = field;
    if (!isStringColumn(type))
      throw new Error('${name} is not a string column');
    //if (override && typeof override('foo') !== 'string')
        //throw new Error(`seems override for ${name} does not return a string`);
    this.type = type;
    this.isArray = (this.type & 16) === 16;
    this.index = index;
    this.name = name;
    this.override = override;
  }

  arrayFromText(v: string, u: any, a: SchemaArgs): string[] {
    if (!this.isArray) throw new Error('i dont gib array');
    if (this.override) return this.override(v, u, a);
    // TODO - array separator arg!
    return v.split(',').map(i => this.fromText(i.trim(), u, a));
  }

  fromText(v: string, u: any, a: SchemaArgs): string {
    // TODO - need to verify there aren't any single quotes?
    if (this.override) return this.override(v, u, a);
    if (v.startsWith('"')) return v.slice(1, -1);
    return v;
  }

  arrayFromBytes(i: number, bytes: Uint8Array): [string[], number] {
    if (!this.isArray) throw new Error('i dont gib array');
    const length = bytes[i++];
    let read = 1;
    const strings: string[] = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.fromBytes(i, bytes);
      strings.push(s);
      i += r;
      read += r;
    }
    return [strings, read]
  }

  fromBytes(i: number, bytes: Uint8Array): [string, number] {
    return bytesToString(i, bytes);
  }

  serialize (): number[] {
    return [this.type, ...stringToBytes(this.name)];
  }

  serializeRow(v: string): Uint8Array {
    return stringToBytes(v);
  }

  serializeArray(v: string[]): Uint8Array {
    if (v.length > 255) throw new Error('too big!');
    const items = [0];
    for (let i = 0; i < v.length; i++) items.push(...stringToBytes(v[i]));
    // seems like there should be a better way to do this?
    return new Uint8Array(items);
  }
}

export class NumericColumn implements IColumn<number, Uint8Array> {
  readonly type: NUMERIC_COLUMN;
  readonly label: string;
  readonly index: number;
  readonly name: string;
  readonly width: 1|2|4;
  readonly flag: null = null;
  readonly bit: null = null;
  readonly order = 0;
  readonly offset = 0;
  readonly isArray: boolean;
  override?: (v: any, u: any, a: SchemaArgs) => any;
  constructor(field: Readonly<ColumnArgs>) {
    const { name, index, type, override } = field;
    if (!isNumericColumn(type))
      throw new Error(`${name} is not a numeric column`);
    //if (override && typeof override('1') !== 'number')
      //throw new Error(`${name} override must return a number`);
    this.index = index;
    this.name = name;
    this.type = type;
    this.isArray = (this.type & 16) === 16;
    this.label = COLUMN_LABEL[this.type];
    this.width = COLUMN_WIDTH[this.type];
    this.override = override;
  }

  arrayFromText(v: string, u: any, a: SchemaArgs): number[] {
    if (!this.isArray) throw new Error('i dont gib array');
    if (this.override) return this.override(v, u, a);
    // TODO - array separator arg!
    return v.split(',').map(i => this.fromText(i.trim(), u, a));
  }

  fromText(v: string, u: any, a: SchemaArgs): number {
     return this.override ? ( this.override(v, u, a) ) :
      v ? Number(v) || 0 : 0;
  }

  arrayFromBytes(i: number, bytes: Uint8Array, view: DataView): [number[], number] {
    if (!this.isArray) throw new Error('i dont gib array');
    const length = bytes[i++];
    let read = 1;
    const numbers: number[] = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.numberFromView(i, view);
      numbers.push(s);
      i += r;
      read += r;
    }
    return [numbers, read];
  }

  fromBytes(i: number, _: Uint8Array, view: DataView): [number, number] {
      if (this.isArray) throw new Error('im array tho')
      return this.numberFromView(i, view);
  }

  private numberFromView (i: number, view: DataView): [number, number] {
    switch (this.type & 15) {
      case COLUMN.I8:
        return [view.getInt8(i), 1];
      case COLUMN.U8:
        return [view.getUint8(i), 1];
      case COLUMN.I16:
        return [view.getInt16(i, true), 2];
      case COLUMN.U16:
        return [view.getUint16(i, true), 2];
      case COLUMN.I32:
        return [view.getInt32(i, true), 4];
      case COLUMN.U32:
        return [view.getUint32(i, true), 4];
      default:
        throw new Error('whomst');
    }
  }

  serialize (): number[] {
    return [this.type, ...stringToBytes(this.name)];
  }

  serializeRow(v: number): Uint8Array {
    const bytes = new Uint8Array(this.width);
    this.putBytes(v, 0, bytes);
    return bytes;
  }

  serializeArray(v: number[]): Uint8Array {
    if (v.length > 255) throw new Error('too big!');
    const bytes = new Uint8Array(1 + this.width * v.length)
    let i = 1;
    for (const n of v) {
      bytes[0]++;
      this.putBytes(n, i, bytes);
      i+=this.width;
    }
    // seems like there should be a better way to do this?
    return bytes;
  }

  private putBytes(v: number, i: number, bytes: Uint8Array) {
    for (let o = 0; o < this.width; o++)
      bytes[i + o] = (v >>> (o * 8)) & 255;
  }

}

export class BigColumn implements IColumn<bigint, Uint8Array> {
  readonly type: COLUMN.BIG | COLUMN.BIG_ARRAY
  readonly label: string;
  readonly index: number;
  readonly name: string;
  readonly width: null = null;
  readonly flag: null = null;
  readonly bit: null = null;
  readonly order = 2;
  readonly offset = null;
  readonly isArray: boolean;
  override?: (v: any, u: any, a: SchemaArgs) => any;
  constructor(field: Readonly<ColumnArgs>) {
    const { name, index, type, override } = field;
    if (!isBigColumn(type)) throw new Error(`${type} is not big`);
    this.type = type
    this.isArray = (type & 16) === 16;
    this.index = index;
    this.name = name;
    this.override = override;

    this.label = COLUMN_LABEL[this.type];
  }

  arrayFromText(v: string, u: any, a: SchemaArgs): bigint[] {
    if (!this.isArray) throw new Error('i dont gib array');
    if (this.override) return this.override(v, u, a);
    // TODO - array separator arg!
    return v.split(',').map(i => this.fromText(i.trim(), u, a));
  }

  fromText(v: string, u: any, a: SchemaArgs): bigint {
    if (this.override) return this.override(v, u, a);
    if (!v) return 0n;
    return BigInt(v);
  }

  arrayFromBytes(i: number, bytes: Uint8Array): [bigint[], number] {
    if (!this.isArray) throw new Error('i dont gib array');
    const length = bytes[i++];
    let read = 1;
    const bigbois: bigint[] = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.fromBytes(i, bytes);
      bigbois.push(s);
      i += r;
      read += r;
    }
    return [bigbois, read];

  }

  fromBytes(i: number, bytes: Uint8Array): [bigint, number] {
    return bytesToBigBoy(i, bytes);
  }

  serialize (): number[] {
    return [this.type, ...stringToBytes(this.name)];
  }

  serializeRow(v: bigint): Uint8Array {
    if (!v) return new Uint8Array(1);
    return bigBoyToBytes(v);
  }

  serializeArray(v: bigint[]): Uint8Array {
    if (v.length > 255) throw new Error('too big!');
    const items = [0];
    for (let i = 0; i < v.length; i++) items.push(...bigBoyToBytes(v[i]));
    // seems like there should be a better way to do this BIG?
    return new Uint8Array(items);
  }
}


export class BoolColumn implements IColumn<boolean, number> {
  readonly type: COLUMN.BOOL = COLUMN.BOOL;
  readonly label: string = COLUMN_LABEL[COLUMN.BOOL];
  readonly index: number;
  readonly name: string;
  readonly width: null = null;
  readonly flag: number;
  readonly bit: number;
  readonly order = 1;
  readonly offset = 0;
  readonly isArray: boolean = false;
  override?: (v: any, u: any, a: SchemaArgs) => any;
  constructor(field: Readonly<ColumnArgs>) {
    const { name, index, type, bit, flag, override } = field;
    //if (override && typeof override('1') !== 'boolean')
      //throw new Error('seems that override does not return a bool');
    if (!isBoolColumn(type)) throw new Error(`${type} is not bool`);
    if (typeof flag !== 'number') throw new Error(`flag is not number`);
    if (typeof bit !== 'number') throw new Error(`bit is not number`);
    this.flag = flag;
    this.bit = bit;
    this.index = index;
    this.name = name;
    this.override = override;
  }

  arrayFromText(v: string, u: any, a: SchemaArgs): never[] {
    throw new Error('I NEVER ARRAY') // yet~?
  }

  fromText(v: string, u: any, a: SchemaArgs): boolean {
    if (this.override) return this.override(v, u, a);
    if (!v || v === '0') return false;
    return true;
  }

  arrayFromBytes(_i: number, _bytes: Uint8Array): [never[], number] {
    throw new Error('I NEVER ARRAY') // yet~?
  }

  fromBytes(i: number, bytes: Uint8Array): [boolean, number] {
    // ....it did not.
    //console.log(`READ FROM ${i}: DOES ${bytes[i]} === ${this.flag}`);
    return [(bytes[i] & this.flag) === this.flag, 0];
  }

  serialize (): number[] {
    return [COLUMN.BOOL, ...stringToBytes(this.name)];
  }

  serializeRow(v: boolean): number {
    return v ? this.flag : 0;
  }

  serializeArray(_v: boolean[]): never {
    throw new Error('i will NEVER become ARRAY');
  }
}

export type FComparable = {
  order: number,
  bit: number | null,
  index: number
};

export function cmpFields (a: Column, b: Column): number {
  if (a.isArray !== b.isArray) return a.isArray ? 1 : -1
  return (a.order - b.order) ||
    ((a.bit ?? 0) - (b.bit ?? 0)) ||
    (a.index - b.index);
}

export type Column =
  |StringColumn
  |NumericColumn
  |BigColumn
  |BoolColumn
  ;

export function argsFromText (
  name: string,
  index: number,
  schemaArgs: SchemaArgs,
  data: string[][],
): ColumnArgs|null {
  const field = {
    index,
    name,
    override: schemaArgs.overrides[name] as undefined | ((...args: any[]) => any),
    type: COLUMN.UNUSED,
    // auto-detected fields will never be arrays.
    isArray: false,
    maxValue: 0,
    minValue: 0,
    width: null as any,
    flag: null as any,
    bit: null as any,
  };
  let isUsed = false;
  //if (isUsed !== false) debugger;
  for (const u of data) {
    const v = field.override ? field.override(u[index], u, schemaArgs) : u[index];
    if (!v) continue;
    //console.error(`${index}:${name} ~ ${u[0]}:${u[1]}: ${v}`)
    isUsed = true;
    const n = Number(v);
    if (Number.isNaN(n)) {
      // must be a string
      field.type = COLUMN.STRING;
      return field;
    } else if (!Number.isInteger(n)) {
      console.warn(`\x1b[31m${index}:${name} has a float? "${v}" (${n})\x1b[0m`);
    } else if (!Number.isSafeInteger(n)) {
      // we will have to re-do this part:
      field.minValue = -Infinity;
      field.maxValue = Infinity;
    } else {
      if (n < field.minValue) field.minValue = n;
      if (n > field.maxValue) field.maxValue = n;
    }
  }

  if (!isUsed) {
    //console.error(`\x1b[31m${index}:${name} is unused?\x1b[0m`)
    //debugger;
    return null;
  }

  if (field.minValue === 0 && field.maxValue === 1) {
    //console.error(`\x1b[34m${i}:${name} appears to be a boolean flag\x1b[0m`);
    field.type = COLUMN.BOOL;
    field.bit = schemaArgs.flagsUsed;
    field.flag = 1 << (field.bit % 8);
    return field;
  }

  if (field.maxValue! < Infinity) {
    // @ts-ignore - we use infinity to mean "not a bigint"
    const type = rangeToNumericType(field.minValue, field.maxValue);
    if (type !== null) {
      field.type = type;
      return field;
    }
  }

  // BIG BOY TIME
  field.type = COLUMN.BIG;
  return field;
}

export function argsFromType (
  name: string,
  type: COLUMN,
  index: number,
  schemaArgs: SchemaArgs,
): ColumnArgs {
  const override = schemaArgs.overrides[name];
  switch (type & 15) {
    case COLUMN.UNUSED:
      throw new Error('how you gonna use it then');
    case COLUMN.STRING:
    case COLUMN.BIG:
      return { type, name, index, override };
    case COLUMN.BOOL:
      const bit = schemaArgs.flagsUsed;
      const flag = 1 << (bit % 8);
      return { type, name, index, flag, bit, override };

    case COLUMN.U8:
    case COLUMN.I8:
      return { type, name, index, width: 1, override };
    case COLUMN.U16:
    case COLUMN.I16:
      return { type, name, index, width: 2, override };
    case COLUMN.U32:
    case COLUMN.I32:
      return { type, name, index, width: 4, override};
    default:
      throw new Error(`wat type is this ${type}`);
  }
}

export function fromArgs (args: ColumnArgs): Column {
  switch (args.type & 15) {
    case COLUMN.UNUSED:
      throw new Error('unused field cant be turned into a Column');
    case COLUMN.STRING:
      return new StringColumn(args);
    case COLUMN.BOOL:
      if (args.type & 16) throw new Error('no such thing as a flag array');
      return new BoolColumn(args);
    case COLUMN.U8:
    case COLUMN.I8:
    case COLUMN.U16:
    case COLUMN.I16:
    case COLUMN.U32:
    case COLUMN.I32:
      return new NumericColumn(args);
    case COLUMN.BIG:
      return new BigColumn(args);
    default:
      throw new Error(`wat type is this ${args.type}`);
  }
}
