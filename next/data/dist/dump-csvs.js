// ../lib/src/serialize.ts
var __textEncoder = new TextEncoder();
var __textDecoder = new TextDecoder();
function stringToBytes(s, dest, i = 0) {
  if (s.indexOf("\0") !== -1) {
    const i2 = s.indexOf("\0");
    console.error(`${i2} = NULL ? "...${s.slice(i2 - 10, i2 + 10)}...`);
    throw new Error("whoopsie");
  }
  const bytes = __textEncoder.encode(s + "\0");
  if (dest) {
    dest.set(bytes, i);
    return bytes.length;
  } else {
    return bytes;
  }
}
function bytesToString(i, a) {
  let r = 0;
  while (a[i + r] !== 0) {
    r++;
  }
  return [__textDecoder.decode(a.slice(i, i + r)), r + 1];
}
function bigBoyToBytes(n) {
  const bytes = [0];
  if (n < 0n) {
    n *= -1n;
    bytes[0] = 128;
  }
  while (n) {
    if (bytes[0] === 255)
      throw new Error("bruh thats too big");
    bytes[0]++;
    bytes.push(Number(n & 255n));
    n >>= 8n;
  }
  return new Uint8Array(bytes);
}
function bytesToBigBoy(i, bytes) {
  const L = Number(bytes[i]);
  const len = L & 127;
  const read = 1 + len;
  const neg = L & 128 ? -1n : 1n;
  const BB = Array.from(bytes.slice(i + 1, i + read), BigInt);
  if (len !== BB.length)
    throw new Error("bigint checksum is FUCK?");
  return [len ? BB.reduce(byteToBigboi) * neg : 0n, read];
}
function byteToBigboi(n, b, i) {
  return n | b << BigInt(i * 8);
}

// ../lib/src/column.ts
var COLUMN_LABEL = [
  "UNUSED",
  "STRING",
  "BOOL",
  "U8",
  "I8",
  "U16",
  "I16",
  "U32",
  "I32",
  "BIG",
  "UNUSED",
  "UNUSED",
  "UNUSED",
  "UNUSED",
  "UNUSED",
  "UNUSED",
  "UNUSED",
  "STRING_ARRAY",
  "U8_ARRAY",
  "I8_ARRAY",
  "U16_ARRAY",
  "I16_ARRAY",
  "U32_ARRAY",
  "I32_ARRAY",
  "BIG_ARRAY"
];
var COLUMN_WIDTH = {
  [3 /* U8 */]: 1,
  [4 /* I8 */]: 1,
  [5 /* U16 */]: 2,
  [6 /* I16 */]: 2,
  [7 /* U32 */]: 4,
  [8 /* I32 */]: 4,
  [19 /* U8_ARRAY */]: 1,
  [20 /* I8_ARRAY */]: 1,
  [21 /* U16_ARRAY */]: 2,
  [22 /* I16_ARRAY */]: 2,
  [23 /* U32_ARRAY */]: 4,
  [24 /* I32_ARRAY */]: 4
};
function rangeToNumericType(min, max) {
  if (min < 0) {
    if (min >= -128 && max <= 127) {
      return 4 /* I8 */;
    } else if (min >= -32768 && max <= 32767) {
      return 6 /* I16 */;
    } else if (min >= -2147483648 && max <= 2147483647) {
      return 8 /* I32 */;
    }
  } else {
    if (max <= 255) {
      return 3 /* U8 */;
    } else if (max <= 65535) {
      return 5 /* U16 */;
    } else if (max <= 4294967295) {
      return 7 /* U32 */;
    }
  }
  return null;
}
function isNumericColumn(type) {
  switch (type & 15) {
    case 3 /* U8 */:
    case 4 /* I8 */:
    case 5 /* U16 */:
    case 6 /* I16 */:
    case 7 /* U32 */:
    case 8 /* I32 */:
      return true;
    default:
      return false;
  }
}
function isBigColumn(type) {
  return (type & 15) === 9 /* BIG */;
}
function isBoolColumn(type) {
  return type === 2 /* BOOL */;
}
function isStringColumn(type) {
  return (type & 15) === 1 /* STRING */;
}
var StringColumn = class {
  type;
  label = COLUMN_LABEL[1 /* STRING */];
  index;
  name;
  width = null;
  flag = null;
  bit = null;
  order = 3;
  offset = null;
  isArray;
  override;
  constructor(field) {
    const { index, name, type, override } = field;
    if (!isStringColumn(type))
      throw new Error("${name} is not a string column");
    this.type = type;
    this.isArray = (this.type & 16) === 16;
    this.index = index;
    this.name = name;
    this.override = override;
  }
  arrayFromText(v, u, a) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    if (this.override)
      return this.override(v, u, a);
    return v.split(",").map((i) => this.fromText(i.trim(), u, a));
  }
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
    if (v.startsWith('"'))
      return v.slice(1, -1);
    return v;
  }
  arrayFromBytes(i, bytes) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    const length = bytes[i++];
    let read = 1;
    const strings = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.fromBytes(i, bytes);
      strings.push(s);
      i += r;
      read += r;
    }
    return [strings, read];
  }
  fromBytes(i, bytes) {
    return bytesToString(i, bytes);
  }
  serialize() {
    return [this.type, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    return stringToBytes(v);
  }
  serializeArray(v) {
    if (v.length > 255)
      throw new Error("too big!");
    const items = [0];
    for (let i = 0; i < v.length; i++)
      items.push(...stringToBytes(v[i]));
    return new Uint8Array(items);
  }
};
var NumericColumn = class {
  type;
  label;
  index;
  name;
  width;
  flag = null;
  bit = null;
  order = 0;
  offset = 0;
  isArray;
  override;
  constructor(field) {
    const { name, index, type, override } = field;
    if (!isNumericColumn(type))
      throw new Error(`${name} is not a numeric column`);
    this.index = index;
    this.name = name;
    this.type = type;
    this.isArray = (this.type & 16) === 16;
    this.label = COLUMN_LABEL[this.type];
    this.width = COLUMN_WIDTH[this.type];
    this.override = override;
  }
  arrayFromText(v, u, a) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    if (this.override)
      return this.override(v, u, a);
    return v.split(",").map((i) => this.fromText(i.trim(), u, a));
  }
  fromText(v, u, a) {
    return this.override ? this.override(v, u, a) : v ? Number(v) || 0 : 0;
  }
  arrayFromBytes(i, bytes, view) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    const length = bytes[i++];
    let read = 1;
    const numbers = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.numberFromView(i, view);
      numbers.push(s);
      i += r;
      read += r;
    }
    return [numbers, read];
  }
  fromBytes(i, _, view) {
    if (this.isArray)
      throw new Error("im array tho");
    return this.numberFromView(i, view);
  }
  numberFromView(i, view) {
    switch (this.type & 15) {
      case 4 /* I8 */:
        return [view.getInt8(i), 1];
      case 3 /* U8 */:
        return [view.getUint8(i), 1];
      case 6 /* I16 */:
        return [view.getInt16(i, true), 2];
      case 5 /* U16 */:
        return [view.getUint16(i, true), 2];
      case 8 /* I32 */:
        return [view.getInt32(i, true), 4];
      case 7 /* U32 */:
        return [view.getUint32(i, true), 4];
      default:
        throw new Error("whomst");
    }
  }
  serialize() {
    return [this.type, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    const bytes = new Uint8Array(this.width);
    this.putBytes(v, 0, bytes);
    return bytes;
  }
  serializeArray(v) {
    if (v.length > 255)
      throw new Error("too big!");
    const bytes = new Uint8Array(1 + this.width * v.length);
    let i = 1;
    for (const n of v) {
      bytes[0]++;
      this.putBytes(n, i, bytes);
      i += this.width;
    }
    return bytes;
  }
  putBytes(v, i, bytes) {
    for (let o = 0; o < this.width; o++)
      bytes[i + o] = v >>> o * 8 & 255;
  }
};
var BigColumn = class {
  type;
  label;
  index;
  name;
  width = null;
  flag = null;
  bit = null;
  order = 2;
  offset = null;
  isArray;
  override;
  constructor(field) {
    const { name, index, type, override } = field;
    if (!isBigColumn(type))
      throw new Error(`${type} is not big`);
    this.type = type;
    this.isArray = (type & 16) === 16;
    this.index = index;
    this.name = name;
    this.override = override;
    this.label = COLUMN_LABEL[this.type];
  }
  arrayFromText(v, u, a) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    if (this.override)
      return this.override(v, u, a);
    return v.split(",").map((i) => this.fromText(i.trim(), u, a));
  }
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
    if (!v)
      return 0n;
    return BigInt(v);
  }
  arrayFromBytes(i, bytes) {
    if (!this.isArray)
      throw new Error("i dont gib array");
    const length = bytes[i++];
    let read = 1;
    const bigbois = [];
    for (let n = 0; n < length; n++) {
      const [s, r] = this.fromBytes(i, bytes);
      bigbois.push(s);
      i += r;
      read += r;
    }
    return [bigbois, read];
  }
  fromBytes(i, bytes) {
    return bytesToBigBoy(i, bytes);
  }
  serialize() {
    return [this.type, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    if (!v)
      return new Uint8Array(1);
    return bigBoyToBytes(v);
  }
  serializeArray(v) {
    if (v.length > 255)
      throw new Error("too big!");
    const items = [0];
    for (let i = 0; i < v.length; i++)
      items.push(...bigBoyToBytes(v[i]));
    return new Uint8Array(items);
  }
};
var BoolColumn = class {
  type = 2 /* BOOL */;
  label = COLUMN_LABEL[2 /* BOOL */];
  index;
  name;
  width = null;
  flag;
  bit;
  order = 1;
  offset = 0;
  isArray = false;
  override;
  constructor(field) {
    const { name, index, type, bit, flag, override } = field;
    if (!isBoolColumn(type))
      throw new Error(`${type} is not bool`);
    if (typeof flag !== "number")
      throw new Error(`flag is not number`);
    if (typeof bit !== "number")
      throw new Error(`bit is not number`);
    this.flag = flag;
    this.bit = bit;
    this.index = index;
    this.name = name;
    this.override = override;
  }
  arrayFromText(v, u, a) {
    throw new Error("I NEVER ARRAY");
  }
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
    if (!v || v === "0")
      return false;
    return true;
  }
  arrayFromBytes(_i, _bytes) {
    throw new Error("I NEVER ARRAY");
  }
  fromBytes(i, bytes) {
    return [(bytes[i] & this.flag) === this.flag, 0];
  }
  serialize() {
    return [2 /* BOOL */, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    return v ? this.flag : 0;
  }
  serializeArray(_v) {
    throw new Error("i will NEVER become ARRAY");
  }
};
function cmpFields(a, b) {
  if (a.isArray !== b.isArray)
    return a.isArray ? 1 : -1;
  return a.order - b.order || (a.bit ?? 0) - (b.bit ?? 0) || a.index - b.index;
}
function argsFromText(name, index, schemaArgs, data) {
  const field = {
    index,
    name,
    override: schemaArgs.overrides[name],
    type: 0 /* UNUSED */,
    // auto-detected fields will never be arrays.
    isArray: false,
    maxValue: 0,
    minValue: 0,
    width: null,
    flag: null,
    bit: null
  };
  let isUsed = false;
  for (const u of data) {
    const v = field.override ? field.override(u[index], u, schemaArgs) : u[index];
    if (!v)
      continue;
    isUsed = true;
    const n = Number(v);
    if (Number.isNaN(n)) {
      field.type = 1 /* STRING */;
      return field;
    } else if (!Number.isInteger(n)) {
      console.warn(`\x1B[31m${index}:${name} has a float? "${v}" (${n})\x1B[0m`);
    } else if (!Number.isSafeInteger(n)) {
      field.minValue = -Infinity;
      field.maxValue = Infinity;
    } else {
      if (n < field.minValue)
        field.minValue = n;
      if (n > field.maxValue)
        field.maxValue = n;
    }
  }
  if (!isUsed) {
    return null;
  }
  if (field.minValue === 0 && field.maxValue === 1) {
    field.type = 2 /* BOOL */;
    field.bit = schemaArgs.flagsUsed;
    field.flag = 1 << field.bit % 8;
    return field;
  }
  if (field.maxValue < Infinity) {
    const type = rangeToNumericType(field.minValue, field.maxValue);
    if (type !== null) {
      field.type = type;
      return field;
    }
  }
  field.type = 9 /* BIG */;
  return field;
}
function argsFromType(name, type, index, schemaArgs) {
  const override = schemaArgs.overrides[name];
  switch (type & 15) {
    case 0 /* UNUSED */:
      throw new Error("how you gonna use it then");
    case 1 /* STRING */:
    case 9 /* BIG */:
      return { type, name, index, override };
    case 2 /* BOOL */:
      const bit = schemaArgs.flagsUsed;
      const flag = 1 << bit % 8;
      return { type, name, index, flag, bit, override };
    case 3 /* U8 */:
    case 4 /* I8 */:
      return { type, name, index, width: 1, override };
    case 5 /* U16 */:
    case 6 /* I16 */:
      return { type, name, index, width: 2, override };
    case 7 /* U32 */:
    case 8 /* I32 */:
      return { type, name, index, width: 4, override };
    default:
      throw new Error(`wat type is this ${type}`);
  }
}
function fromArgs(args) {
  switch (args.type & 15) {
    case 0 /* UNUSED */:
      throw new Error("unused field cant be turned into a Column");
    case 1 /* STRING */:
      return new StringColumn(args);
    case 2 /* BOOL */:
      if (args.type & 16)
        throw new Error("no such thing as a flag array");
      return new BoolColumn(args);
    case 3 /* U8 */:
    case 4 /* I8 */:
    case 5 /* U16 */:
    case 6 /* I16 */:
    case 7 /* U32 */:
    case 8 /* I32 */:
      return new NumericColumn(args);
    case 9 /* BIG */:
      return new BigColumn(args);
    default:
      throw new Error(`wat type is this ${args.type}`);
  }
}

// ../lib/src/util.ts
function tableDeco(name, width2 = 80, style = 9) {
  const { TL, BL, TR, BR, HR } = getBoxChars(style);
  const nameWidth = name.length + 2;
  const hTailWidth = width2 - (nameWidth + 6);
  return [
    `${TL}${HR.repeat(4)} ${name} ${HR.repeat(hTailWidth)}${TR}`,
    `${BL}${HR.repeat(width2 - 2)}${BR}`
  ];
}
function getBoxChars(style) {
  switch (style) {
    case 9:
      return { TL: "\u250C", BL: "\u2514", TR: "\u2510", BR: "\u2518", HR: "\u2500" };
    case 18:
      return { TL: "\u250F", BL: "\u2517", TR: "\u2513", BR: "\u251B", HR: "\u2501" };
    case 36:
      return { TL: "\u2554", BL: "\u255A", TR: "\u2557", BR: "\u255D", HR: "\u2550" };
    default:
      throw new Error("invalid style");
  }
}

// ../lib/src/schema.ts
var Schema = class _Schema {
  name;
  columns;
  fields;
  key;
  columnsByName;
  fixedWidth;
  // total bytes used by numbers + flags
  flagFields;
  stringFields;
  bigFields;
  constructor({ columns, name, flagsUsed, key }) {
    this.name = name;
    this.key = key;
    this.columns = [...columns].sort(cmpFields);
    this.fields = this.columns.map((c) => c.name);
    this.columnsByName = Object.fromEntries(this.columns.map((c) => [c.name, c]));
    this.flagFields = flagsUsed;
    this.fixedWidth = columns.reduce(
      (w, c) => w + (!c.isArray && c.width || 0),
      Math.ceil(flagsUsed / 8)
      // 8 flags per byte, natch
    );
    let o = 0;
    let f = true;
    let b = false;
    let ff = 0;
    for (const [i, c] of this.columns.entries()) {
      let OC = -1;
      switch (c.type) {
        case 9 /* BIG */:
        case 1 /* STRING */:
        case 17 /* STRING_ARRAY */:
        case 19 /* U8_ARRAY */:
        case 20 /* I8_ARRAY */:
        case 21 /* U16_ARRAY */:
        case 22 /* I16_ARRAY */:
        case 23 /* U32_ARRAY */:
        case 24 /* I32_ARRAY */:
        case 25 /* BIG_ARRAY */:
          if (f) {
            if (o > 0) {
              const dso = Math.max(0, i - 2);
              console.error(this.name, i, o, `DSO:${dso}..${i + 2}:`, columns.slice(Math.max(0, i - 2), i + 2));
              debugger;
              throw new Error("should not be!");
            } else {
              f = false;
            }
          }
          if (b) {
            b = false;
            if (ff !== this.flagFields)
              throw new Error("boooOSAASOAO");
          }
          break;
        case 2 /* BOOL */:
          if (!f) {
            throw new Error("should be!");
          }
          if (!b) {
            b = true;
            if (ff !== 0)
              throw new Error("booo");
          }
          OC = o;
          c.offset = o;
          c.bit = ff++;
          c.flag = 2 ** (c.bit % 8);
          if (c.flag === 128)
            o++;
          if (c.bit + 1 === this.flagFields) {
            if (c.flag === 128 && o !== this.fixedWidth)
              throw new Error("WHUPOSIE");
            if (c.flag < 128 && o !== this.fixedWidth - 1)
              throw new Error("WHUPOSIE - 1");
            f = false;
          }
          break;
        case 3 /* U8 */:
        case 4 /* I8 */:
        case 5 /* U16 */:
        case 6 /* I16 */:
        case 7 /* U32 */:
        case 8 /* I32 */:
          OC = o;
          c.offset = o;
          if (!c.width)
            debugger;
          o += c.width;
          if (o === this.fixedWidth)
            f = false;
          break;
      }
    }
    this.stringFields = columns.filter((c) => isStringColumn(c.type)).length;
    this.bigFields = columns.filter((c) => isBigColumn(c.type)).length;
  }
  static fromBuffer(buffer) {
    let i = 0;
    let read;
    let name;
    let key;
    const bytes = new Uint8Array(buffer);
    [name, read] = bytesToString(i, bytes);
    i += read;
    [key, read] = bytesToString(i, bytes);
    i += read;
    const args = {
      name,
      key,
      columns: [],
      fields: [],
      flagsUsed: 0,
      rawFields: {},
      // none :<
      overrides: {}
      // none~
    };
    const numFields = bytes[i++] | bytes[i++] << 8;
    let index = 0;
    while (index < numFields) {
      const type = bytes[i++];
      [name, read] = bytesToString(i, bytes);
      const f = {
        index,
        name,
        type,
        width: null,
        bit: null,
        flag: null,
        order: 999
      };
      i += read;
      let c;
      switch (type & 15) {
        case 1 /* STRING */:
          c = new StringColumn({ ...f });
          break;
        case 9 /* BIG */:
          c = new BigColumn({ ...f });
          break;
        case 2 /* BOOL */:
          const bit = args.flagsUsed++;
          const flag = 2 ** (bit % 8);
          c = new BoolColumn({ ...f, bit, flag });
          break;
        case 4 /* I8 */:
        case 3 /* U8 */:
          c = new NumericColumn({ ...f, width: 1 });
          break;
        case 6 /* I16 */:
        case 5 /* U16 */:
          c = new NumericColumn({ ...f, width: 2 });
          break;
        case 8 /* I32 */:
        case 7 /* U32 */:
          c = new NumericColumn({ ...f, width: 4 });
          break;
        default:
          throw new Error(`unknown type ${type}`);
      }
      args.columns.push(c);
      args.fields.push(c.name);
      index++;
    }
    return new _Schema(args);
  }
  rowFromBuffer(i, buffer, __rowId) {
    const dbr = __rowId < 5 || __rowId > 3975 || __rowId % 1e3 === 0;
    let totalRead = 0;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const row = { __rowId };
    const lastBit = this.flagFields - 1;
    for (const c of this.columns) {
      let [v, read] = c.isArray ? c.arrayFromBytes(i, bytes, view) : c.fromBytes(i, bytes, view);
      if (c.type === 2 /* BOOL */)
        read = c.flag === 128 || c.bit === lastBit ? 1 : 0;
      i += read;
      totalRead += read;
      if (c.isArray || v)
        row[c.name] = v;
    }
    return [row, totalRead];
  }
  printRow(r, fields2) {
    return Object.fromEntries(fields2.map((f) => [f, r[f]]));
  }
  serializeHeader() {
    if (this.columns.length > 65535)
      throw new Error("oh buddy...");
    const parts = new Uint8Array([
      ...stringToBytes(this.name),
      ...stringToBytes(this.key),
      this.columns.length & 255,
      this.columns.length >>> 8,
      ...this.columns.flatMap((c) => c.serialize())
    ]);
    return new Blob([parts]);
  }
  serializeRow(r) {
    const fixed = new Uint8Array(this.fixedWidth);
    let i = 0;
    const lastBit = this.flagFields - 1;
    const blobParts = [fixed];
    for (const c of this.columns) {
      try {
        const v = r[c.name];
        if (c.isArray) {
          const b = c.serializeArray(v);
          i += b.length;
          blobParts.push(b);
          continue;
        }
        switch (c.type) {
          case 1 /* STRING */:
            {
              const b = c.serializeRow(v);
              i += b.length;
              blobParts.push(b);
            }
            break;
          case 9 /* BIG */:
            {
              const b = c.serializeRow(v);
              i += b.length;
              blobParts.push(b);
            }
            break;
          case 2 /* BOOL */:
            fixed[i] |= c.serializeRow(v);
            if (c.flag === 128 || c.bit === lastBit)
              i++;
            break;
          case 3 /* U8 */:
          case 4 /* I8 */:
          case 5 /* U16 */:
          case 6 /* I16 */:
          case 7 /* U32 */:
          case 8 /* I32 */:
            const bytes = c.serializeRow(v);
            fixed.set(bytes, i);
            i += c.width;
            break;
          default:
            throw new Error(`wat type is this ${c.type}`);
        }
      } catch (ex) {
        console.log("GOOBER COLUMN:", c);
        console.log("GOOBER ROW:", r);
        throw ex;
      }
    }
    return new Blob(blobParts);
  }
  print(width2 = 80) {
    const [head, tail] = tableDeco(this.name, width2, 36);
    console.log(head);
    const { fixedWidth, bigFields, stringFields, flagFields } = this;
    console.log({ fixedWidth, bigFields, stringFields, flagFields });
    console.table(this.columns, [
      "name",
      "label",
      "offset",
      "order",
      "bit",
      "type",
      "flag",
      "width"
    ]);
    console.log(tail);
  }
  // rawToRow (d: RawRow): Record<string, unknown> {}
  // rawToString (d: RawRow, ...args: string[]): string {}
};

// ../lib/src/table.ts
var Table = class _Table {
  constructor(rows, schema) {
    this.rows = rows;
    this.schema = schema;
    const keyName = this.key;
    if (keyName !== "__rowId")
      for (const row of this.rows) {
        const key = row[keyName];
        if (this.map.has(key))
          throw new Error("key is not unique");
        this.map.set(key, row);
      }
  }
  get name() {
    return this.schema.name;
  }
  get key() {
    return this.schema.key;
  }
  map = /* @__PURE__ */ new Map();
  serialize() {
    const schemaHeader = this.schema.serializeHeader();
    const schemaPadding = (4 - schemaHeader.size % 4) % 4;
    const rowData = this.rows.flatMap((r) => this.schema.serializeRow(r));
    const rowBlob = new Blob(rowData);
    const dataPadding = (4 - rowBlob.size % 4) % 4;
    return [
      new Uint32Array([
        this.rows.length,
        schemaHeader.size + schemaPadding,
        rowBlob.size + dataPadding
      ]),
      new Blob([
        schemaHeader,
        new ArrayBuffer(schemaPadding)
        // ???
      ]),
      new Blob([
        rowBlob,
        new Uint8Array(dataPadding)
      ])
    ];
  }
  static concatTables(tables) {
    const allSizes = new Uint32Array(1 + tables.length * 3);
    const allHeaders = [];
    const allData = [];
    const blobs = tables.map((t) => t.serialize());
    allSizes[0] = blobs.length;
    for (const [i, [sizes, headers, data]] of blobs.entries()) {
      allSizes.set(sizes, 1 + i * 3);
      allHeaders.push(headers);
      allData.push(data);
    }
    return new Blob([allSizes, ...allHeaders, ...allData]);
  }
  static async openBlob(blob) {
    if (blob.size % 4 !== 0)
      throw new Error("wonky blob size");
    const numTables = new Uint32Array(await blob.slice(0, 4).arrayBuffer())[0];
    let bo = 4;
    const sizes = new Uint32Array(
      await blob.slice(bo, bo += numTables * 12).arrayBuffer()
    );
    const tBlobs = [];
    for (let i = 0; i < numTables; i++) {
      const si = i * 3;
      const numRows = sizes[si];
      const hSize = sizes[si + 1];
      tBlobs[i] = { numRows, headerBlob: blob.slice(bo, bo += hSize) };
    }
    ;
    for (let i = 0; i < numTables; i++) {
      tBlobs[i].dataBlob = blob.slice(bo, bo += sizes[i * 3 + 2]);
    }
    ;
    const tables = await Promise.all(tBlobs.map((tb, i) => {
      return this.fromBlob(tb);
    }));
    return Object.fromEntries(tables.map((t) => [t.schema.name, t]));
  }
  static async fromBlob({
    headerBlob,
    dataBlob,
    numRows
  }) {
    const schema = Schema.fromBuffer(await headerBlob.arrayBuffer());
    let rbo = 0;
    let __rowId = 0;
    const rows = [];
    const dataBuffer = await dataBlob.arrayBuffer();
    console.log(`===== READ ${numRows} OF ${schema.name} =====`);
    while (__rowId < numRows) {
      const [row, read] = schema.rowFromBuffer(rbo, dataBuffer, __rowId++);
      rows.push(row);
      rbo += read;
    }
    return new _Table(rows, schema);
  }
  print(width2 = 80, fields2 = null, n = null, m = null, p) {
    const [head, tail] = tableDeco(this.name, width2, 18);
    const rows = p ? this.rows.filter(p) : n === null ? this.rows : m === null ? this.rows.slice(0, n) : this.rows.slice(n, m);
    let mFields = Array.from(fields2 ?? this.schema.fields);
    if (p)
      [n, m] = [0, rows.length];
    else
      mFields.unshift("__rowId");
    const [pRows, pFields] = fields2 ? [rows.map((r) => this.schema.printRow(r, mFields)), fields2] : [rows, this.schema.fields];
    console.log("row filter:", p ?? "(none)");
    console.log(`(view rows ${n} - ${m})`);
    console.log(head);
    console.table(pRows, pFields);
    console.log(tail);
    return p && fields2 ? rows.map(
      (r) => Object.fromEntries(fields2.map((f) => [f, r[f]]).filter((e) => e[1]))
    ) : null;
  }
  dumpRow(i, showEmpty = false, useCSS) {
    useCSS ??= globalThis["window"] === globalThis;
    i ??= Math.floor(Math.random() * this.rows.length);
    const row = this.rows[i];
    const out = [];
    const css = useCSS ? [] : null;
    const fmt = fmtStyled.bind(null, out, css);
    const p = Math.max(
      ...this.schema.columns.filter((c) => showEmpty || row[c.name]).map((c) => c.name.length + 2)
    );
    if (!row)
      fmt(`%c${this.schema.name}[${i}] does not exist`, C_NOT_FOUND);
    else {
      fmt(`%c${this.schema.name}[${i}]`, C_ROW_HEAD);
      for (const c of this.schema.columns) {
        const value = row[c.name];
        const n = c.name.padStart(p, " ");
        switch (typeof value) {
          case "boolean":
            if (value)
              fmt(`${n}: %cTRUE`, C_TRUE);
            else if (showEmpty)
              fmt(`%c${n}: %cFALSE`, C_NOT_FOUND, C_FALSE);
            break;
          case "number":
            if (value)
              fmt(`${n}: %c${value}`, C_NUMBER);
            else if (showEmpty)
              fmt(`%c${n}: 0`, C_NOT_FOUND);
            break;
          case "string":
            if (value)
              fmt(`${n}: %c${value}`, C_STR);
            else if (showEmpty)
              fmt(`%c${n}: \u2014`, C_NOT_FOUND);
            break;
          case "bigint":
            if (value)
              fmt(`{n}: %c0 %c${value} (BIG)`, C_BIG, C_NOT_FOUND);
            else if (showEmpty)
              fmt(`%c${n}: 0 (BIG)`, C_NOT_FOUND);
            break;
        }
      }
    }
    if (useCSS)
      return [out.join("\n"), ...css];
    else
      return [out.join("\n")];
  }
  findRow(predicate, start = 0) {
    const N = this.rows.length;
    if (start < 0)
      start = N - start;
    for (let i = start; i < N; i++)
      if (predicate(this.rows[i]))
        return i;
    return -1;
  }
  *filterRows(predicate) {
    for (const row of this.rows)
      if (predicate(row))
        yield row;
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
};
function fmtStyled(out, cssOut, msg, ...css) {
  if (cssOut) {
    out.push(msg + "%c");
    cssOut.push(...css, C_RESET);
  } else
    out.push(msg.replace(/%c/g, ""));
}
var C_NOT_FOUND = "color: #888; font-style: italic;";
var C_ROW_HEAD = "font-weight: bolder";
var C_NUMBER = "color: #A05518; font-weight: bold;";
var C_TRUE = "color: #4C38BE; font-weight: bold;";
var C_FALSE = "color: #38BE1C; font-weight: bold;";
var C_STR = "color: #30AA62; font-weight: bold;";
var C_BIG = "color: #7821A3; font-weight: bold;";
var C_RESET = "color: unset; font-style: unset; font-weight: unset; background-unset";

// src/cli/csv-defs.ts
var csvDefs = {
  "../../gamedata/BaseU.csv": {
    name: "Unit",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set([
      "armor1",
      "armor2",
      "armor3",
      "armor4",
      "end",
      "link1",
      "link2",
      "link3",
      "link4",
      "link5",
      "link6",
      "mask1",
      "mask2",
      "mask3",
      "mask4",
      "mask5",
      "mask6",
      "mounted",
      // deprecated
      "nbr1",
      "nbr2",
      "nbr3",
      "nbr4",
      "nbr5",
      "nbr6",
      "rand1",
      "rand2",
      "rand3",
      "rand4",
      "rand5",
      "rand6",
      "reanimator.1",
      // turns out nothing actually references this field anyway?
      "wpn1",
      "wpn2",
      "wpn3",
      "wpn4",
      "wpn5",
      "wpn6",
      "wpn7",
      "summon",
      "n_summon"
    ]),
    knownFields: {
      id: 5 /* U16 */,
      name: 1 /* STRING */,
      rt: 3 /* U8 */,
      reclimit: 4 /* I8 */,
      basecost: 5 /* U16 */,
      rcost: 4 /* I8 */,
      size: 3 /* U8 */,
      ressize: 3 /* U8 */,
      hp: 5 /* U16 */,
      prot: 3 /* U8 */,
      mr: 3 /* U8 */,
      mor: 3 /* U8 */,
      str: 3 /* U8 */,
      att: 3 /* U8 */,
      def: 3 /* U8 */,
      prec: 3 /* U8 */,
      enc: 3 /* U8 */,
      mapmove: 3 /* U8 */,
      ap: 3 /* U8 */,
      ambidextrous: 3 /* U8 */,
      mountmnr: 5 /* U16 */,
      skilledrider: 3 /* U8 */,
      reinvigoration: 3 /* U8 */,
      leader: 3 /* U8 */,
      undeadleader: 3 /* U8 */,
      magicleader: 3 /* U8 */,
      startage: 5 /* U16 */,
      maxage: 5 /* U16 */,
      hand: 3 /* U8 */,
      head: 3 /* U8 */,
      misc: 3 /* U8 */,
      pathcost: 3 /* U8 */,
      startdom: 3 /* U8 */,
      bonusspells: 3 /* U8 */,
      F: 3 /* U8 */,
      A: 3 /* U8 */,
      W: 3 /* U8 */,
      E: 3 /* U8 */,
      S: 3 /* U8 */,
      D: 3 /* U8 */,
      N: 3 /* U8 */,
      G: 3 /* U8 */,
      B: 3 /* U8 */,
      H: 3 /* U8 */,
      sailingshipsize: 5 /* U16 */,
      sailingmaxunitsize: 3 /* U8 */,
      stealthy: 3 /* U8 */,
      patience: 3 /* U8 */,
      seduce: 3 /* U8 */,
      succubus: 3 /* U8 */,
      corrupt: 3 /* U8 */,
      homesick: 3 /* U8 */,
      formationfighter: 4 /* I8 */,
      standard: 4 /* I8 */,
      inspirational: 4 /* I8 */,
      taskmaster: 3 /* U8 */,
      beastmaster: 3 /* U8 */,
      bodyguard: 3 /* U8 */,
      waterbreathing: 5 /* U16 */,
      iceprot: 3 /* U8 */,
      invulnerable: 3 /* U8 */,
      shockres: 4 /* I8 */,
      fireres: 4 /* I8 */,
      coldres: 4 /* I8 */,
      poisonres: 3 /* U8 */,
      acidres: 4 /* I8 */,
      voidsanity: 3 /* U8 */,
      darkvision: 3 /* U8 */,
      animalawe: 3 /* U8 */,
      awe: 3 /* U8 */,
      haltheretic: 3 /* U8 */,
      fear: 3 /* U8 */,
      berserk: 3 /* U8 */,
      cold: 3 /* U8 */,
      heat: 3 /* U8 */,
      fireshield: 3 /* U8 */,
      banefireshield: 3 /* U8 */,
      damagerev: 3 /* U8 */,
      poisoncloud: 3 /* U8 */,
      diseasecloud: 3 /* U8 */,
      slimer: 3 /* U8 */,
      mindslime: 5 /* U16 */,
      regeneration: 3 /* U8 */,
      reanimator: 3 /* U8 */,
      poisonarmor: 3 /* U8 */,
      eyeloss: 3 /* U8 */,
      ethtrue: 3 /* U8 */,
      stormpower: 3 /* U8 */,
      firepower: 3 /* U8 */,
      coldpower: 3 /* U8 */,
      darkpower: 3 /* U8 */,
      chaospower: 3 /* U8 */,
      magicpower: 3 /* U8 */,
      winterpower: 3 /* U8 */,
      springpower: 3 /* U8 */,
      summerpower: 3 /* U8 */,
      fallpower: 3 /* U8 */,
      forgebonus: 3 /* U8 */,
      fixforgebonus: 4 /* I8 */,
      mastersmith: 4 /* I8 */,
      resources: 3 /* U8 */,
      autohealer: 3 /* U8 */,
      autodishealer: 3 /* U8 */,
      nobadevents: 3 /* U8 */,
      insane: 3 /* U8 */,
      shatteredsoul: 3 /* U8 */,
      leper: 3 /* U8 */,
      chaosrec: 3 /* U8 */,
      pillagebonus: 3 /* U8 */,
      patrolbonus: 4 /* I8 */,
      castledef: 3 /* U8 */,
      siegebonus: 6 /* I16 */,
      incprovdef: 3 /* U8 */,
      supplybonus: 3 /* U8 */,
      incunrest: 6 /* I16 */,
      popkill: 5 /* U16 */,
      researchbonus: 4 /* I8 */,
      inspiringres: 4 /* I8 */,
      douse: 3 /* U8 */,
      adeptsacr: 3 /* U8 */,
      crossbreeder: 3 /* U8 */,
      makepearls: 3 /* U8 */,
      voidsum: 3 /* U8 */,
      heretic: 3 /* U8 */,
      elegist: 3 /* U8 */,
      shapechange: 5 /* U16 */,
      firstshape: 5 /* U16 */,
      secondshape: 5 /* U16 */,
      landshape: 5 /* U16 */,
      watershape: 5 /* U16 */,
      forestshape: 5 /* U16 */,
      plainshape: 5 /* U16 */,
      xpshape: 3 /* U8 */,
      nametype: 3 /* U8 */,
      //summon: COLUMN.I16,
      //n_summon: COLUMN.U8,
      batstartsum1: 5 /* U16 */,
      batstartsum2: 5 /* U16 */,
      domsummon: 5 /* U16 */,
      domsummon2: 5 /* U16 */,
      domsummon20: 6 /* I16 */,
      bloodvengeance: 3 /* U8 */,
      bringeroffortune: 4 /* I8 */,
      realm1: 3 /* U8 */,
      batstartsum3: 5 /* U16 */,
      batstartsum4: 5 /* U16 */,
      batstartsum1d6: 5 /* U16 */,
      batstartsum2d6: 5 /* U16 */,
      batstartsum3d6: 6 /* I16 */,
      batstartsum4d6: 5 /* U16 */,
      batstartsum5d6: 3 /* U8 */,
      batstartsum6d6: 5 /* U16 */,
      turmoilsummon: 5 /* U16 */,
      deathfire: 3 /* U8 */,
      uwregen: 3 /* U8 */,
      shrinkhp: 3 /* U8 */,
      growhp: 3 /* U8 */,
      startingaff: 7 /* U32 */,
      fixedresearch: 3 /* U8 */,
      lamialord: 3 /* U8 */,
      preanimator: 3 /* U8 */,
      dreanimator: 3 /* U8 */,
      mummify: 5 /* U16 */,
      onebattlespell: 3 /* U8 */,
      fireattuned: 3 /* U8 */,
      airattuned: 3 /* U8 */,
      waterattuned: 3 /* U8 */,
      earthattuned: 3 /* U8 */,
      astralattuned: 3 /* U8 */,
      deathattuned: 3 /* U8 */,
      natureattuned: 3 /* U8 */,
      magicboostF: 3 /* U8 */,
      magicboostA: 4 /* I8 */,
      magicboostW: 4 /* I8 */,
      magicboostE: 4 /* I8 */,
      magicboostS: 3 /* U8 */,
      magicboostD: 4 /* I8 */,
      magicboostN: 3 /* U8 */,
      magicboostALL: 4 /* I8 */,
      eyes: 3 /* U8 */,
      corpseeater: 3 /* U8 */,
      poisonskin: 3 /* U8 */,
      startitem: 3 /* U8 */,
      battlesum5: 5 /* U16 */,
      acidshield: 3 /* U8 */,
      prophetshape: 5 /* U16 */,
      horror: 3 /* U8 */,
      latehero: 3 /* U8 */,
      uwdamage: 3 /* U8 */,
      landdamage: 3 /* U8 */,
      rpcost: 7 /* U32 */,
      rand5: 3 /* U8 */,
      nbr5: 3 /* U8 */,
      mask5: 5 /* U16 */,
      rand6: 3 /* U8 */,
      nbr6: 3 /* U8 */,
      mask6: 5 /* U16 */,
      mummification: 5 /* U16 */,
      diseaseres: 3 /* U8 */,
      raiseonkill: 3 /* U8 */,
      raiseshape: 5 /* U16 */,
      sendlesserhorrormult: 3 /* U8 */,
      incorporate: 3 /* U8 */,
      blessbers: 3 /* U8 */,
      curseattacker: 3 /* U8 */,
      uwheat: 3 /* U8 */,
      slothresearch: 3 /* U8 */,
      horrordeserter: 3 /* U8 */,
      sorceryrange: 3 /* U8 */,
      older: 4 /* I8 */,
      disbelieve: 3 /* U8 */,
      firerange: 3 /* U8 */,
      astralrange: 3 /* U8 */,
      naturerange: 3 /* U8 */,
      beartattoo: 3 /* U8 */,
      horsetattoo: 3 /* U8 */,
      reincarnation: 3 /* U8 */,
      wolftattoo: 3 /* U8 */,
      boartattoo: 3 /* U8 */,
      sleepaura: 3 /* U8 */,
      snaketattoo: 3 /* U8 */,
      appetite: 4 /* I8 */,
      templetrainer: 3 /* U8 */,
      infernoret: 3 /* U8 */,
      kokytosret: 3 /* U8 */,
      addrandomage: 5 /* U16 */,
      unsurr: 3 /* U8 */,
      speciallook: 3 /* U8 */,
      bugreform: 3 /* U8 */,
      onisummon: 3 /* U8 */,
      sunawe: 3 /* U8 */,
      startaff: 3 /* U8 */,
      ivylord: 3 /* U8 */,
      triplegod: 3 /* U8 */,
      triplegodmag: 3 /* U8 */,
      fortkill: 3 /* U8 */,
      thronekill: 3 /* U8 */,
      digest: 3 /* U8 */,
      indepmove: 3 /* U8 */,
      entangle: 3 /* U8 */,
      alchemy: 3 /* U8 */,
      woundfend: 3 /* U8 */,
      falsearmy: 4 /* I8 */,
      //summon5: COLUMN.U8,
      slaver: 5 /* U16 */,
      deathparalyze: 3 /* U8 */,
      corpseconstruct: 3 /* U8 */,
      guardianspiritmodifier: 4 /* I8 */,
      iceforging: 3 /* U8 */,
      clockworklord: 3 /* U8 */,
      minsizeleader: 3 /* U8 */,
      ironvul: 3 /* U8 */,
      heathensummon: 3 /* U8 */,
      powerofdeath: 3 /* U8 */,
      reformtime: 4 /* I8 */,
      twiceborn: 5 /* U16 */,
      tmpastralgems: 3 /* U8 */,
      startheroab: 3 /* U8 */,
      uwfireshield: 3 /* U8 */,
      saltvul: 3 /* U8 */,
      landenc: 3 /* U8 */,
      plaguedoctor: 3 /* U8 */,
      curseluckshield: 3 /* U8 */,
      farthronekill: 3 /* U8 */,
      horrormark: 3 /* U8 */,
      allret: 3 /* U8 */,
      aciddigest: 3 /* U8 */,
      beckon: 3 /* U8 */,
      slaverbonus: 3 /* U8 */,
      carcasscollector: 3 /* U8 */,
      mindcollar: 3 /* U8 */,
      mountainrec: 3 /* U8 */,
      indepspells: 3 /* U8 */,
      enchrebate50: 3 /* U8 */,
      //summon1: COLUMN.U16,
      randomspell: 3 /* U8 */,
      insanify: 3 /* U8 */,
      //just a copy of reanimator 2
      //'reanimator.1': COLUMN.U8,
      defector: 3 /* U8 */,
      batstartsum1d3: 5 /* U16 */,
      enchrebate10: 3 /* U8 */,
      undying: 3 /* U8 */,
      moralebonus: 3 /* U8 */,
      uncurableaffliction: 7 /* U32 */,
      wintersummon1d3: 5 /* U16 */,
      stygianguide: 3 /* U8 */,
      smartmount: 3 /* U8 */,
      reformingflesh: 3 /* U8 */,
      fearoftheflood: 3 /* U8 */,
      corpsestitcher: 3 /* U8 */,
      reconstruction: 3 /* U8 */,
      nofriders: 3 /* U8 */,
      coridermnr: 5 /* U16 */,
      holycost: 3 /* U8 */,
      animatemnr: 5 /* U16 */,
      lich: 5 /* U16 */,
      erastartageincrease: 5 /* U16 */,
      moreorder: 4 /* I8 */,
      moregrowth: 4 /* I8 */,
      moreprod: 4 /* I8 */,
      moreheat: 4 /* I8 */,
      moreluck: 4 /* I8 */,
      moremagic: 4 /* I8 */,
      nofmounts: 3 /* U8 */,
      falsedamagerecovery: 3 /* U8 */,
      uwpathboost: 4 /* I8 */,
      randomitems: 5 /* U16 */,
      deathslimeexpl: 3 /* U8 */,
      deathpoisonexpl: 3 /* U8 */,
      deathshockexpl: 3 /* U8 */,
      drawsize: 4 /* I8 */,
      petrificationimmune: 3 /* U8 */,
      scarsouls: 3 /* U8 */,
      spikebarbs: 3 /* U8 */,
      pretenderstartsite: 5 /* U16 */,
      offscriptresearch: 3 /* U8 */,
      unmountedspr: 7 /* U32 */,
      exhaustion: 3 /* U8 */,
      mounted: 2 /* BOOL */,
      bow: 2 /* BOOL */,
      body: 2 /* BOOL */,
      foot: 2 /* BOOL */,
      crownonly: 2 /* BOOL */,
      holy: 2 /* BOOL */,
      inquisitor: 2 /* BOOL */,
      inanimate: 2 /* BOOL */,
      undead: 2 /* BOOL */,
      demon: 2 /* BOOL */,
      magicbeing: 2 /* BOOL */,
      stonebeing: 2 /* BOOL */,
      animal: 2 /* BOOL */,
      coldblood: 2 /* BOOL */,
      female: 2 /* BOOL */,
      forestsurvival: 2 /* BOOL */,
      mountainsurvival: 2 /* BOOL */,
      wastesurvival: 2 /* BOOL */,
      swampsurvival: 2 /* BOOL */,
      aquatic: 2 /* BOOL */,
      amphibian: 2 /* BOOL */,
      pooramphibian: 2 /* BOOL */,
      float: 2 /* BOOL */,
      flying: 2 /* BOOL */,
      stormimmune: 2 /* BOOL */,
      teleport: 2 /* BOOL */,
      immobile: 2 /* BOOL */,
      noriverpass: 2 /* BOOL */,
      illusion: 2 /* BOOL */,
      spy: 2 /* BOOL */,
      assassin: 2 /* BOOL */,
      heal: 2 /* BOOL */,
      immortal: 2 /* BOOL */,
      domimmortal: 2 /* BOOL */,
      noheal: 2 /* BOOL */,
      neednoteat: 2 /* BOOL */,
      undisciplined: 2 /* BOOL */,
      slave: 2 /* BOOL */,
      slashres: 2 /* BOOL */,
      bluntres: 2 /* BOOL */,
      pierceres: 2 /* BOOL */,
      blind: 2 /* BOOL */,
      petrify: 2 /* BOOL */,
      ethereal: 2 /* BOOL */,
      deathcurse: 2 /* BOOL */,
      trample: 2 /* BOOL */,
      trampswallow: 2 /* BOOL */,
      taxcollector: 2 /* BOOL */,
      drainimmune: 2 /* BOOL */,
      unique: 2 /* BOOL */,
      scalewalls: 2 /* BOOL */,
      divineins: 2 /* BOOL */,
      heatrec: 2 /* BOOL */,
      coldrec: 2 /* BOOL */,
      spreadchaos: 2 /* BOOL */,
      spreaddeath: 2 /* BOOL */,
      bug: 2 /* BOOL */,
      uwbug: 2 /* BOOL */,
      spreadorder: 2 /* BOOL */,
      spreadgrowth: 2 /* BOOL */,
      spreaddom: 2 /* BOOL */,
      drake: 2 /* BOOL */,
      theftofthesunawe: 2 /* BOOL */,
      dragonlord: 2 /* BOOL */,
      mindvessel: 2 /* BOOL */,
      elementrange: 2 /* BOOL */,
      astralfetters: 2 /* BOOL */,
      combatcaster: 2 /* BOOL */,
      aisinglerec: 2 /* BOOL */,
      nowish: 2 /* BOOL */,
      mason: 2 /* BOOL */,
      spiritsight: 2 /* BOOL */,
      ownblood: 2 /* BOOL */,
      invisible: 2 /* BOOL */,
      spellsinger: 2 /* BOOL */,
      magicstudy: 2 /* BOOL */,
      unify: 2 /* BOOL */,
      triple3mon: 2 /* BOOL */,
      yearturn: 2 /* BOOL */,
      unteleportable: 2 /* BOOL */,
      reanimpriest: 2 /* BOOL */,
      stunimmunity: 2 /* BOOL */,
      singlebattle: 2 /* BOOL */,
      researchwithoutmagic: 2 /* BOOL */,
      autocompete: 2 /* BOOL */,
      adventurers: 2 /* BOOL */,
      cleanshape: 2 /* BOOL */,
      reqlab: 2 /* BOOL */,
      reqtemple: 2 /* BOOL */,
      horrormarked: 2 /* BOOL */,
      isashah: 2 /* BOOL */,
      isayazad: 2 /* BOOL */,
      isadaeva: 2 /* BOOL */,
      blessfly: 2 /* BOOL */,
      plant: 2 /* BOOL */,
      comslave: 2 /* BOOL */,
      snowmove: 2 /* BOOL */,
      swimming: 2 /* BOOL */,
      stupid: 2 /* BOOL */,
      skirmisher: 2 /* BOOL */,
      unseen: 2 /* BOOL */,
      nomovepen: 2 /* BOOL */,
      wolf: 2 /* BOOL */,
      dungeon: 2 /* BOOL */,
      aboleth: 2 /* BOOL */,
      localsun: 2 /* BOOL */,
      tmpfiregems: 2 /* BOOL */,
      defiler: 2 /* BOOL */,
      mountedbeserk: 2 /* BOOL */,
      lanceok: 2 /* BOOL */,
      minprison: 2 /* BOOL */,
      hpoverflow: 2 /* BOOL */,
      indepstay: 2 /* BOOL */,
      polyimmune: 2 /* BOOL */,
      norange: 2 /* BOOL */,
      nohof: 2 /* BOOL */,
      autoblessed: 2 /* BOOL */,
      almostundead: 2 /* BOOL */,
      truesight: 2 /* BOOL */,
      mobilearcher: 2 /* BOOL */,
      spiritform: 2 /* BOOL */,
      chorusslave: 2 /* BOOL */,
      chorusmaster: 2 /* BOOL */,
      tightrein: 2 /* BOOL */,
      glamourman: 2 /* BOOL */,
      divinebeing: 2 /* BOOL */,
      nofalldmg: 2 /* BOOL */,
      fireempower: 2 /* BOOL */,
      airempower: 2 /* BOOL */,
      waterempower: 2 /* BOOL */,
      earthempower: 2 /* BOOL */,
      popspy: 2 /* BOOL */,
      capitalhome: 2 /* BOOL */,
      clumsy: 2 /* BOOL */,
      regainmount: 2 /* BOOL */,
      nobarding: 2 /* BOOL */,
      mountiscom: 2 /* BOOL */,
      nothrowoff: 2 /* BOOL */,
      bird: 2 /* BOOL */,
      decayres: 2 /* BOOL */,
      cubmother: 2 /* BOOL */,
      glamour: 2 /* BOOL */,
      gemprod: 1 /* STRING */,
      fixedname: 1 /* STRING */
    },
    extraFields: {
      armor: (index, args) => {
        const indices = Object.entries(args.rawFields).filter((e) => e[0].match(/^armor\d$/)).map((e) => e[1]);
        return {
          index,
          name: "armor",
          type: 21 /* U16_ARRAY */,
          width: 2,
          override(v, u, a) {
            const armors = [];
            for (const i of indices) {
              if (u[i])
                armors.push(Number(u[i]));
              else
                break;
            }
            return armors;
          }
        };
      },
      weapons: (index, args) => {
        const indices = Object.entries(args.rawFields).filter((e) => e[0].match(/^wpn\d$/)).map((e) => e[1]);
        return {
          index,
          name: "weapons",
          type: 21 /* U16_ARRAY */,
          width: 2,
          override(v, u, a) {
            const wpns = [];
            for (const i of indices) {
              if (u[i])
                wpns.push(Number(u[i]));
              else
                break;
            }
            return wpns;
          }
        };
      },
      "&custommagic": (index, args) => {
        const CM_KEYS = [1, 2, 3, 4, 5, 6].map(
          (n) => `rand nbr mask`.split(" ").map((k) => args.rawFields[`${k}${n}`])
        );
        console.log({ CM_KEYS });
        return {
          index,
          name: "&custommagic",
          // PACKED UP
          type: 23 /* U32_ARRAY */,
          width: 2,
          override(v, u, a) {
            const cm = [];
            for (const K of CM_KEYS) {
              const [rand, nbr, mask] = K.map((i) => u[i]);
              if (!rand)
                break;
              if (nbr > 63)
                throw new Error("ffs...");
              const b = mask >> 7;
              const n = nbr << 10;
              const r = rand << 16;
              cm.push(r | n | b);
            }
            return cm;
          }
        };
      }
    },
    overrides: {
      // csv has unrest/turn which is incunrest / 10; convert to int format
      incunrest: (v) => {
        return Number(v) * 10 || 0;
      }
    }
  },
  "../../gamedata/BaseI.csv": {
    name: "Item",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/MagicSites.csv": {
    name: "MagicSite",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["domconflict.1", "end"])
  },
  "../../gamedata/Mercenary.csv": {
    name: "Mercenary",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/afflictions.csv": {
    name: "Affliction",
    key: "bit_value",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/anon_province_events.csv": {
    name: "AnonProvinceEvent",
    key: "number",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/armors.csv": {
    name: "Armor",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attribute_keys.csv": {
    name: "AttributeKey",
    key: "number",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/attributes_by_armor.csv": {
    name: "AttributeByArmor",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_nation.csv": {
    name: "AttributeByNation",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_spell.csv": {
    name: "AttributeBySpell",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_weapon.csv": {
    name: "AttributeByWeapon",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/buffs_1_types.csv": {
    // TODO - got some big bois in here.
    name: "BuffBit1",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/buffs_2_types.csv": {
    name: "BuffBit2",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/coast_leader_types_by_nation.csv": {
    name: "CoastLeaderTypeByNation",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/coast_troop_types_by_nation.csv": {
    name: "CoastTroopTypeByNation",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/effect_modifier_bits.csv": {
    name: "SpellBit",
    key: "__rowId",
    // TODO - need multi-index
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/effects_info.csv": {
    key: "number",
    name: "SpellEffectInfo",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/effects_spells.csv": {
    key: "record_id",
    name: "EffectSpell",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/effects_weapons.csv": {
    name: "EffectWeapon",
    key: "record_id",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/enchantments.csv": {
    key: "number",
    name: "Enchantment",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/events.csv": {
    key: "id",
    name: "Event",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/fort_leader_types_by_nation.csv": {
    name: "FortLeaderTypeByNation",
    key: "__rowId",
    // TODO - buh
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/fort_troop_types_by_nation.csv": {
    name: "FortTroopTypeByNation",
    key: "__rowId",
    // TODO - buh
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/magic_paths.csv": {
    key: "number",
    // TODO - buh
    name: "MagicPath",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/map_terrain_types.csv": {
    key: "bit_value",
    // TODO - buh
    name: "TerrainTypeBit",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/monster_tags.csv": {
    key: "number",
    // TODO - buh
    name: "MonsterTag",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/nametypes.csv": {
    key: "id",
    name: "NameType"
  },
  "../../gamedata/nations.csv": {
    key: "id",
    name: "Nation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/nonfort_leader_types_by_nation.csv": {
    key: "__rowId",
    // TODO - buh
    name: "NonFortLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/nonfort_troop_types_by_nation.csv": {
    key: "__rowId",
    // TODO - buh
    name: "NonFortLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/other_planes.csv": {
    key: "number",
    name: "OtherPlane",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/pretender_types_by_nation.csv": {
    key: "__rowId",
    // TODO - buh
    name: "PretenderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/protections_by_armor.csv": {
    key: "__rowId",
    // TODO - buh
    name: "ProtectionByArmor",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/realms.csv": {
    key: "__rowId",
    // TODO - buh
    name: "Realm",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/site_terrain_types.csv": {
    key: "bit_value",
    name: "SiteTerrainType",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/special_damage_types.csv": {
    key: "bit_value",
    name: "SpecialDamageType",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/special_unique_summons.csv": {
    name: "SpecialUniqueSummon",
    key: "number",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/spells.csv": {
    name: "Spell",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/terrain_specific_summons.csv": {
    name: "TerrainSpecificSummon",
    key: "number",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/unit_effects.csv": {
    name: "UnitEffect",
    key: "number",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/unpretender_types_by_nation.csv": {
    key: "__rowId",
    name: "UnpretenderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/weapons.csv": {
    key: "id",
    name: "Weapon",
    ignoreFields: /* @__PURE__ */ new Set(["end", "weapon"])
  }
};

// src/cli/parse-csv.ts
import { readFile } from "node:fs/promises";
async function readCSV(path, options) {
  let raw;
  try {
    raw = await readFile(path, { encoding: "utf8" });
  } catch (ex) {
    console.error(`failed to read schema from ${path}`, ex);
    throw new Error("could not read schema");
  }
  try {
    return csvToTable(raw, options);
  } catch (ex) {
    console.error(`failed to parse schema from ${path}:`, ex);
    throw new Error("could not parse schema");
  }
}
var DEFAULT_OPTIONS = {
  name: "",
  key: "",
  ignoreFields: /* @__PURE__ */ new Set(),
  overrides: {},
  knownFields: {},
  extraFields: {},
  separator: "	"
  // surprise!
};
function csvToTable(raw, options) {
  const _opts = { ...DEFAULT_OPTIONS, ...options };
  const schemaArgs = {
    name: _opts.name,
    key: _opts.key,
    flagsUsed: 0,
    columns: [],
    fields: [],
    rawFields: {},
    overrides: _opts.overrides
  };
  if (!schemaArgs.name)
    throw new Error("name is requried");
  if (!schemaArgs.key)
    throw new Error("key is requried");
  if (raw.indexOf("\0") !== -1)
    throw new Error("uh oh");
  const [rawFields, ...rawData] = raw.split("\n").filter((line) => line !== "").map((line) => line.split(_opts.separator));
  const hCount = /* @__PURE__ */ new Map();
  for (const [i, f] of rawFields.entries()) {
    if (!f)
      throw new Error(`${schemaArgs.name} @ ${i} is an empty field name`);
    if (hCount.has(f)) {
      console.warn(`${schemaArgs.name} @ ${i} "${f}" is a duplicate field name`);
      const n = hCount.get(f);
      rawFields[i] = `${f}.${n}`;
    } else {
      hCount.set(f, 1);
    }
  }
  const rawColumns = [];
  for (const [index, name] of rawFields.entries()) {
    let c = null;
    schemaArgs.rawFields[name] = index;
    if (_opts.ignoreFields?.has(name))
      continue;
    if (_opts.knownFields[name]) {
      c = argsFromType(
        name,
        _opts.knownFields[name],
        index,
        schemaArgs
      );
    } else {
      try {
        c = argsFromText(
          name,
          index,
          schemaArgs,
          rawData
        );
      } catch (ex) {
        console.error(
          `GOOB INTERCEPTED IN ${schemaArgs.name}: \x1B[31m${index}:${name}\x1B[0m`,
          ex
        );
        throw ex;
      }
    }
    if (c !== null) {
      if (c.type === 2 /* BOOL */)
        schemaArgs.flagsUsed++;
      rawColumns.push(c);
    }
  }
  if (options?.extraFields) {
    const bi = Object.values(schemaArgs.rawFields).length;
    rawColumns.push(
      ...Object.entries(options.extraFields).map(
        ([name, createColumn], ei) => {
          const override = schemaArgs.overrides[name];
          const index = bi + ei;
          const ca = createColumn(index, schemaArgs, name, override);
          try {
            if (ca.index !== index)
              throw new Error("wiseguy picked his own index");
            if (ca.name !== name)
              throw new Error("wiseguy picked his own name");
            if (ca.type === 2 /* BOOL */) {
              if (ca.bit !== schemaArgs.flagsUsed)
                throw new Error("piss baby idiot");
              schemaArgs.flagsUsed++;
            }
          } catch (ex) {
            console.log(ca, { index, override, name });
            throw ex;
          }
          return ca;
        }
      )
    );
  }
  const data = new Array(rawData.length).fill(null).map((_, __rowId) => ({ __rowId }));
  for (const colArgs of rawColumns) {
    const col = fromArgs(colArgs);
    schemaArgs.columns.push(col);
    schemaArgs.fields.push(col.name);
  }
  if (schemaArgs.key !== "__rowId" && !schemaArgs.fields.includes(schemaArgs.key))
    throw new Error(`fields is missing the supplied key "${schemaArgs.key}"`);
  for (const col of schemaArgs.columns) {
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(
        rawData[r.__rowId][col.index],
        rawData[r.__rowId],
        schemaArgs
      );
  }
  return new Table(data, new Schema(schemaArgs));
}
async function parseAll(defs) {
  return Promise.all(
    Object.entries(defs).map(([path, options]) => readCSV(path, options))
  );
}

// src/cli/dump-csvs.ts
import process from "node:process";
import { writeFile } from "node:fs/promises";
var width = process.stdout.columns;
var [file, ...fields] = process.argv.slice(2);
function findDef(name) {
  if (csvDefs[name])
    return [name, csvDefs[name]];
  for (const k in csvDefs) {
    const d = csvDefs[k];
    if (d.name === name)
      return [k, d];
  }
  throw new Error(`no csv defined for "${name}"`);
}
async function dumpOne(key) {
  const table = await readCSV(...findDef(key));
  compareDumps(table);
}
async function dumpAll() {
  const tables = await parseAll(csvDefs);
  const dest = "./data/db.30.bin";
  const blob = Table.concatTables(tables);
  await writeFile(dest, blob.stream(), { encoding: null });
  console.log(`wrote ${blob.size} bytes to ${dest}`);
}
async function compareDumps(t) {
  const maxN = t.rows.length - 30;
  let n;
  let p = void 0;
  if (fields[0] === "FILTER") {
    n = 0;
    fields.splice(0, 1, "id", "name");
    p = (r) => fields.slice(2).some((f2) => r[f2]);
  } else if (fields[1] === "ROW" && fields[2]) {
    n = Number(fields[2]) - 15;
    console.log(`ensure row ${fields[2]} is visible (${n})`);
    if (Number.isNaN(n))
      throw new Error("ROW must be NUMBER!!!!");
  } else {
    n = Math.floor(Math.random() * maxN);
  }
  n = Math.min(maxN, Math.max(0, n));
  const m = n + 30;
  const f = fields.length ? fields[0] === "ALL" ? t.schema.fields : fields : t.schema.fields.slice(0, 10);
  dumpToConsole(t, n, m, f, "BEFORE", p);
}
function dumpToConsole(t, n, m, f, h, p) {
  console.log(`
     ${h}:`);
  t.schema.print(width);
  console.log(`(view rows ${n} - ${m})`);
  const rows = t.print(width, f, n, m, p);
  if (rows)
    for (const r of rows)
      console.table([r]);
  console.log(`    /${h}

`);
}
console.log("ARGS", { file, fields });
if (file)
  dumpOne(file);
else
  dumpAll();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vLi4vbGliL3NyYy9jb2x1bW4udHMiLCAiLi4vLi4vbGliL3NyYy91dGlsLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2NoZW1hLnRzIiwgIi4uLy4uL2xpYi9zcmMvdGFibGUudHMiLCAiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX190ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuY29uc3QgX190ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nKTogVWludDhBcnJheTtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q6IFVpbnQ4QXJyYXksIGk6IG51bWJlcik6IG51bWJlcjtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q/OiBVaW50OEFycmF5LCBpID0gMCkge1xuICBpZiAocy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHtcbiAgICBjb25zdCBpID0gcy5pbmRleE9mKCdcXDAnKTtcbiAgICBjb25zb2xlLmVycm9yKGAke2l9ID0gTlVMTCA/IFwiLi4uJHtzLnNsaWNlKGkgLSAxMCwgaSArIDEwKX0uLi5gKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3dob29wc2llJyk7XG4gIH1cbiAgY29uc3QgYnl0ZXMgPSBfX3RleHRFbmNvZGVyLmVuY29kZShzICsgJ1xcMCcpO1xuICBpZiAoZGVzdCkge1xuICAgIGRlc3Quc2V0KGJ5dGVzLCBpKTtcbiAgICByZXR1cm4gYnl0ZXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBieXRlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb1N0cmluZyhpOiBudW1iZXIsIGE6IFVpbnQ4QXJyYXkpOiBbc3RyaW5nLCBudW1iZXJdIHtcbiAgbGV0IHIgPSAwO1xuICB3aGlsZSAoYVtpICsgcl0gIT09IDApIHsgcisrOyB9XG4gIHJldHVybiBbX190ZXh0RGVjb2Rlci5kZWNvZGUoYS5zbGljZShpLCBpK3IpKSwgciArIDFdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmlnQm95VG9CeXRlcyAobjogYmlnaW50KTogVWludDhBcnJheSB7XG4gIC8vIHRoaXMgaXMgYSBjb29sIGdhbWUgYnV0IGxldHMgaG9wZSBpdCBkb2Vzbid0IHVzZSAxMjcrIGJ5dGUgbnVtYmVyc1xuICBjb25zdCBieXRlcyA9IFswXTtcbiAgaWYgKG4gPCAwbikge1xuICAgIG4gKj0gLTFuO1xuICAgIGJ5dGVzWzBdID0gMTI4O1xuICB9XG5cbiAgLy8gV09PUFNJRVxuICB3aGlsZSAobikge1xuICAgIGlmIChieXRlc1swXSA9PT0gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ2JydWggdGhhdHMgdG9vIGJpZycpO1xuICAgIGJ5dGVzWzBdKys7XG4gICAgYnl0ZXMucHVzaChOdW1iZXIobiAmIDI1NW4pKTtcbiAgICBuID4+PSA4bjtcbiAgfVxuXG4gIHJldHVybiBuZXcgVWludDhBcnJheShieXRlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvQmlnQm95IChpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gIGNvbnN0IEwgPSBOdW1iZXIoYnl0ZXNbaV0pO1xuICBjb25zdCBsZW4gPSBMICYgMTI3O1xuICBjb25zdCByZWFkID0gMSArIGxlbjtcbiAgY29uc3QgbmVnID0gKEwgJiAxMjgpID8gLTFuIDogMW47XG4gIGNvbnN0IEJCOiBiaWdpbnRbXSA9IEFycmF5LmZyb20oYnl0ZXMuc2xpY2UoaSArIDEsIGkgKyByZWFkKSwgQmlnSW50KTtcbiAgaWYgKGxlbiAhPT0gQkIubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ2JpZ2ludCBjaGVja3N1bSBpcyBGVUNLPycpO1xuICByZXR1cm4gW2xlbiA/IEJCLnJlZHVjZShieXRlVG9CaWdib2kpICogbmVnIDogMG4sIHJlYWRdXG59XG5cbmZ1bmN0aW9uIGJ5dGVUb0JpZ2JvaSAobjogYmlnaW50LCBiOiBiaWdpbnQsIGk6IG51bWJlcikge1xuICByZXR1cm4gbiB8IChiIDw8IEJpZ0ludChpICogOCkpO1xufVxuIiwgImltcG9ydCB0eXBlIHsgU2NoZW1hQXJncyB9IGZyb20gJy4nO1xuaW1wb3J0IHsgYmlnQm95VG9CeXRlcywgYnl0ZXNUb0JpZ0JveSwgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcblxuZXhwb3J0IHR5cGUgQ29sdW1uQXJncyA9IHtcbiAgdHlwZTogQ09MVU1OO1xuICBpbmRleDogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIHdpZHRoPzogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICBmbGFnPzogbnVtYmVyfG51bGw7XG4gIGJpdD86IG51bWJlcnxudWxsO1xufVxuXG5leHBvcnQgZW51bSBDT0xVTU4ge1xuICBVTlVTRUQgICAgICAgPSAwLFxuICBTVFJJTkcgICAgICAgPSAxLFxuICBCT09MICAgICAgICAgPSAyLFxuICBVOCAgICAgICAgICAgPSAzLFxuICBJOCAgICAgICAgICAgPSA0LFxuICBVMTYgICAgICAgICAgPSA1LFxuICBJMTYgICAgICAgICAgPSA2LFxuICBVMzIgICAgICAgICAgPSA3LFxuICBJMzIgICAgICAgICAgPSA4LFxuICBCSUcgICAgICAgICAgPSA5LFxuICBTVFJJTkdfQVJSQVkgPSAxNyxcbiAgVThfQVJSQVkgICAgID0gMTksXG4gIEk4X0FSUkFZICAgICA9IDIwLFxuICBVMTZfQVJSQVkgICAgPSAyMSxcbiAgSTE2X0FSUkFZICAgID0gMjIsXG4gIFUzMl9BUlJBWSAgICA9IDIzLFxuICBJMzJfQVJSQVkgICAgPSAyNCxcbiAgQklHX0FSUkFZICAgID0gMjUsXG59O1xuXG5leHBvcnQgY29uc3QgQ09MVU1OX0xBQkVMID0gW1xuICAnVU5VU0VEJyxcbiAgJ1NUUklORycsXG4gICdCT09MJyxcbiAgJ1U4JyxcbiAgJ0k4JyxcbiAgJ1UxNicsXG4gICdJMTYnLFxuICAnVTMyJyxcbiAgJ0kzMicsXG4gICdCSUcnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1NUUklOR19BUlJBWScsXG4gICdVOF9BUlJBWScsXG4gICdJOF9BUlJBWScsXG4gICdVMTZfQVJSQVknLFxuICAnSTE2X0FSUkFZJyxcbiAgJ1UzMl9BUlJBWScsXG4gICdJMzJfQVJSQVknLFxuICAnQklHX0FSUkFZJyxcbl07XG5cbmV4cG9ydCB0eXBlIE5VTUVSSUNfQ09MVU1OID1cbiAgfENPTFVNTi5VOFxuICB8Q09MVU1OLkk4XG4gIHxDT0xVTU4uVTE2XG4gIHxDT0xVTU4uSTE2XG4gIHxDT0xVTU4uVTMyXG4gIHxDT0xVTU4uSTMyXG4gIHxDT0xVTU4uVThfQVJSQVlcbiAgfENPTFVNTi5JOF9BUlJBWVxuICB8Q09MVU1OLlUxNl9BUlJBWVxuICB8Q09MVU1OLkkxNl9BUlJBWVxuICB8Q09MVU1OLlUzMl9BUlJBWVxuICB8Q09MVU1OLkkzMl9BUlJBWVxuICA7XG5cbmNvbnN0IENPTFVNTl9XSURUSDogUmVjb3JkPE5VTUVSSUNfQ09MVU1OLCAxfDJ8ND4gPSB7XG4gIFtDT0xVTU4uVThdOiAxLFxuICBbQ09MVU1OLkk4XTogMSxcbiAgW0NPTFVNTi5VMTZdOiAyLFxuICBbQ09MVU1OLkkxNl06IDIsXG4gIFtDT0xVTU4uVTMyXTogNCxcbiAgW0NPTFVNTi5JMzJdOiA0LFxuICBbQ09MVU1OLlU4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5JOF9BUlJBWV06IDEsXG4gIFtDT0xVTU4uVTE2X0FSUkFZXTogMixcbiAgW0NPTFVNTi5JMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLlUzMl9BUlJBWV06IDQsXG4gIFtDT0xVTU4uSTMyX0FSUkFZXTogNCxcblxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VUb051bWVyaWNUeXBlIChcbiAgbWluOiBudW1iZXIsXG4gIG1heDogbnVtYmVyXG4pOiBOVU1FUklDX0NPTFVNTnxudWxsIHtcbiAgaWYgKG1pbiA8IDApIHtcbiAgICAvLyBzb21lIGtpbmRhIG5lZ2F0aXZlPz9cbiAgICBpZiAobWluID49IC0xMjggJiYgbWF4IDw9IDEyNykge1xuICAgICAgLy8gc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uSTg7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTMyNzY4ICYmIG1heCA8PSAzMjc2Nykge1xuICAgICAgLy8gc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLkkxNjtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMjE0NzQ4MzY0OCAmJiBtYXggPD0gMjE0NzQ4MzY0Nykge1xuICAgICAgLy8gc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uSTMyO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAobWF4IDw9IDI1NSkge1xuICAgICAgLy8gdW5zaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5VODtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA2NTUzNSkge1xuICAgICAgLy8gdW5zaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uVTE2O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDQyOTQ5NjcyOTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uVTMyO1xuICAgIH1cbiAgfVxuICAvLyBHT1RPOiBCSUdPT09PT09PT0JPT09PT1lPXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIE5VTUVSSUNfQ09MVU1OIHtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VODpcbiAgICBjYXNlIENPTFVNTi5JODpcbiAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JpZ0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uQklHIHwgQ09MVU1OLkJJR19BUlJBWSB7XG4gIHJldHVybiAodHlwZSAmIDE1KSA9PT0gQ09MVU1OLkJJRztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9vbENvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uQk9PTCB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQk9PTDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uU1RSSU5HO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDb2x1bW48VCA9IGFueSwgUiBleHRlbmRzIFVpbnQ4QXJyYXl8bnVtYmVyID0gYW55PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTjtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVFtdO1xuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IFQ7XG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1RbXSwgbnVtYmVyXTtcbiAgZnJvbUJ5dGVzIChpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtULCBudW1iZXJdO1xuICBzZXJpYWxpemUgKCk6IG51bWJlcltdO1xuICBzZXJpYWxpemVSb3cgKHY6IFQpOiBSLFxuICBzZXJpYWxpemVBcnJheSAodjogVFtdKTogUixcbiAgdG9TdHJpbmcgKHY6IHN0cmluZyk6IGFueTtcbiAgcmVhZG9ubHkgd2lkdGg6IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyOiBudW1iZXI7XG4gIHJlYWRvbmx5IG9mZnNldDogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPHN0cmluZywgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uU1RSSU5HIHwgQ09MVU1OLlNUUklOR19BUlJBWTtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uU1RSSU5HXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDM7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgaW5kZXgsIG5hbWUsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzU3RyaW5nQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCcke25hbWV9IGlzIG5vdCBhIHN0cmluZyBjb2x1bW4nKTtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJ2ZvbycpICE9PSAnc3RyaW5nJylcbiAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYHNlZW1zIG92ZXJyaWRlIGZvciAke25hbWV9IGRvZXMgbm90IHJldHVybiBhIHN0cmluZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5pc0FycmF5ID0gKHRoaXMudHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBzdHJpbmcge1xuICAgIC8vIFRPRE8gLSBuZWVkIHRvIHZlcmlmeSB0aGVyZSBhcmVuJ3QgYW55IHNpbmdsZSBxdW90ZXM/XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICh2LnN0YXJ0c1dpdGgoJ1wiJykpIHJldHVybiB2LnNsaWNlKDEsIC0xKTtcbiAgICByZXR1cm4gdjtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbc3RyaW5nW10sIG51bWJlcl0ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBjb25zdCBsZW5ndGggPSBieXRlc1tpKytdO1xuICAgIGxldCByZWFkID0gMTtcbiAgICBjb25zdCBzdHJpbmdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAobGV0IG4gPSAwOyBuIDwgbGVuZ3RoOyBuKyspIHtcbiAgICAgIGNvbnN0IFtzLCByXSA9IHRoaXMuZnJvbUJ5dGVzKGksIGJ5dGVzKTtcbiAgICAgIHN0cmluZ3MucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtzdHJpbmdzLCByZWFkXVxuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbc3RyaW5nLCBudW1iZXJdIHtcbiAgICByZXR1cm4gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gc3RyaW5nVG9CeXRlcyh2KTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KHY6IHN0cmluZ1tdKTogVWludDhBcnJheSB7XG4gICAgaWYgKHYubGVuZ3RoID4gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ3RvbyBiaWchJyk7XG4gICAgY29uc3QgaXRlbXMgPSBbMF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSBpdGVtcy5wdXNoKC4uLnN0cmluZ1RvQnl0ZXModltpXSkpO1xuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bWVyaWNDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPG51bWJlciwgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBOVU1FUklDX0NPTFVNTjtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogMXwyfDQ7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDA7XG4gIHJlYWRvbmx5IG9mZnNldCA9IDA7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzTnVtZXJpY0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBpcyBub3QgYSBudW1lcmljIGNvbHVtbmApO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnbnVtYmVyJylcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IG92ZXJyaWRlIG11c3QgcmV0dXJuIGEgbnVtYmVyYCk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmxhYmVsID0gQ09MVU1OX0xBQkVMW3RoaXMudHlwZV07XG4gICAgdGhpcy53aWR0aCA9IENPTFVNTl9XSURUSFt0aGlzLnR5cGVdO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXJbXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICAvLyBUT0RPIC0gYXJyYXkgc2VwYXJhdG9yIGFyZyFcbiAgICByZXR1cm4gdi5zcGxpdCgnLCcpLm1hcChpID0+IHRoaXMuZnJvbVRleHQoaS50cmltKCksIHUsIGEpKTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbnVtYmVyIHtcbiAgICAgcmV0dXJuIHRoaXMub3ZlcnJpZGUgPyAoIHRoaXMub3ZlcnJpZGUodiwgdSwgYSkgKSA6XG4gICAgICB2ID8gTnVtYmVyKHYpIHx8IDAgOiAwO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyW10sIG51bWJlcl0ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBjb25zdCBsZW5ndGggPSBieXRlc1tpKytdO1xuICAgIGxldCByZWFkID0gMTtcbiAgICBjb25zdCBudW1iZXJzOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IG4gPSAwOyBuIDwgbGVuZ3RoOyBuKyspIHtcbiAgICAgIGNvbnN0IFtzLCByXSA9IHRoaXMubnVtYmVyRnJvbVZpZXcoaSwgdmlldyk7XG4gICAgICBudW1iZXJzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbbnVtYmVycywgcmVhZF07XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBfOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgICAgaWYgKHRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpbSBhcnJheSB0aG8nKVxuICAgICAgcmV0dXJuIHRoaXMubnVtYmVyRnJvbVZpZXcoaSwgdmlldyk7XG4gIH1cblxuICBwcml2YXRlIG51bWJlckZyb21WaWV3IChpOiBudW1iZXIsIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUgJiAxNSkge1xuICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3dob21zdCcpO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkodGhpcy53aWR0aCk7XG4gICAgdGhpcy5wdXRCeXRlcyh2LCAwLCBieXRlcyk7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogbnVtYmVyW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KDEgKyB0aGlzLndpZHRoICogdi5sZW5ndGgpXG4gICAgbGV0IGkgPSAxO1xuICAgIGZvciAoY29uc3QgbiBvZiB2KSB7XG4gICAgICBieXRlc1swXSsrO1xuICAgICAgdGhpcy5wdXRCeXRlcyhuLCBpLCBieXRlcyk7XG4gICAgICBpKz10aGlzLndpZHRoO1xuICAgIH1cbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBwcml2YXRlIHB1dEJ5dGVzKHY6IG51bWJlciwgaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSkge1xuICAgIGZvciAobGV0IG8gPSAwOyBvIDwgdGhpcy53aWR0aDsgbysrKVxuICAgICAgYnl0ZXNbaSArIG9dID0gKHYgPj4+IChvICogOCkpICYgMjU1O1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEJpZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48YmlnaW50LCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZXG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAyO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc0JpZ0NvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBiaWdgKTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlXG4gICAgdGhpcy5pc0FycmF5ID0gKHR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcblxuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnRbXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICAvLyBUT0RPIC0gYXJyYXkgc2VwYXJhdG9yIGFyZyFcbiAgICByZXR1cm4gdi5zcGxpdCgnLCcpLm1hcChpID0+IHRoaXMuZnJvbVRleHQoaS50cmltKCksIHUsIGEpKTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYmlnaW50IHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKCF2KSByZXR1cm4gMG47XG4gICAgcmV0dXJuIEJpZ0ludCh2KTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50W10sIG51bWJlcl0ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBjb25zdCBsZW5ndGggPSBieXRlc1tpKytdO1xuICAgIGxldCByZWFkID0gMTtcbiAgICBjb25zdCBiaWdib2lzOiBiaWdpbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IG4gPSAwOyBuIDwgbGVuZ3RoOyBuKyspIHtcbiAgICAgIGNvbnN0IFtzLCByXSA9IHRoaXMuZnJvbUJ5dGVzKGksIGJ5dGVzKTtcbiAgICAgIGJpZ2JvaXMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtiaWdib2lzLCByZWFkXTtcblxuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgICByZXR1cm4gYnl0ZXNUb0JpZ0JveShpLCBieXRlcyk7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgICBpZiAoIXYpIHJldHVybiBuZXcgVWludDhBcnJheSgxKTtcbiAgICByZXR1cm4gYmlnQm95VG9CeXRlcyh2KTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KHY6IGJpZ2ludFtdKTogVWludDhBcnJheSB7XG4gICAgaWYgKHYubGVuZ3RoID4gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ3RvbyBiaWchJyk7XG4gICAgY29uc3QgaXRlbXMgPSBbMF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2Lmxlbmd0aDsgaSsrKSBpdGVtcy5wdXNoKC4uLmJpZ0JveVRvQnl0ZXModltpXSkpO1xuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzIEJJRz9cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoaXRlbXMpO1xuICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIEJvb2xDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJvb2xlYW4sIG51bWJlcj4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQk9PTCA9IENPTFVNTi5CT09MO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5CT09MXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcjtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXI7XG4gIHJlYWRvbmx5IG9yZGVyID0gMTtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbiA9IGZhbHNlO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBiaXQsIGZsYWcsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2Jvb2xlYW4nKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ3NlZW1zIHRoYXQgb3ZlcnJpZGUgZG9lcyBub3QgcmV0dXJuIGEgYm9vbCcpO1xuICAgIGlmICghaXNCb29sQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJvb2xgKTtcbiAgICBpZiAodHlwZW9mIGZsYWcgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGZsYWcgaXMgbm90IG51bWJlcmApO1xuICAgIGlmICh0eXBlb2YgYml0ICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBiaXQgaXMgbm90IG51bWJlcmApO1xuICAgIHRoaXMuZmxhZyA9IGZsYWc7XG4gICAgdGhpcy5iaXQgPSBiaXQ7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG5ldmVyW10ge1xuICAgIHRocm93IG5ldyBFcnJvcignSSBORVZFUiBBUlJBWScpIC8vIHlldH4/XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYgfHwgdiA9PT0gJzAnKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhfaTogbnVtYmVyLCBfYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbbmV2ZXJbXSwgbnVtYmVyXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2Jvb2xlYW4sIG51bWJlcl0ge1xuICAgIC8vIC4uLi5pdCBkaWQgbm90LlxuICAgIC8vY29uc29sZS5sb2coYFJFQUQgRlJPTSAke2l9OiBET0VTICR7Ynl0ZXNbaV19ID09PSAke3RoaXMuZmxhZ31gKTtcbiAgICByZXR1cm4gWyhieXRlc1tpXSAmIHRoaXMuZmxhZykgPT09IHRoaXMuZmxhZywgMF07XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CT09MLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIHJldHVybiB2ID8gdGhpcy5mbGFnIDogMDtcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KF92OiBib29sZWFuW10pOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpIHdpbGwgTkVWRVIgYmVjb21lIEFSUkFZJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRkNvbXBhcmFibGUgPSB7XG4gIG9yZGVyOiBudW1iZXIsXG4gIGJpdDogbnVtYmVyIHwgbnVsbCxcbiAgaW5kZXg6IG51bWJlclxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNtcEZpZWxkcyAoYTogQ29sdW1uLCBiOiBDb2x1bW4pOiBudW1iZXIge1xuICBpZiAoYS5pc0FycmF5ICE9PSBiLmlzQXJyYXkpIHJldHVybiBhLmlzQXJyYXkgPyAxIDogLTFcbiAgcmV0dXJuIChhLm9yZGVyIC0gYi5vcmRlcikgfHxcbiAgICAoKGEuYml0ID8/IDApIC0gKGIuYml0ID8/IDApKSB8fFxuICAgIChhLmluZGV4IC0gYi5pbmRleCk7XG59XG5cbmV4cG9ydCB0eXBlIENvbHVtbiA9XG4gIHxTdHJpbmdDb2x1bW5cbiAgfE51bWVyaWNDb2x1bW5cbiAgfEJpZ0NvbHVtblxuICB8Qm9vbENvbHVtblxuICA7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmdzRnJvbVRleHQgKFxuICBuYW1lOiBzdHJpbmcsXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4gIGRhdGE6IHN0cmluZ1tdW10sXG4pOiBDb2x1bW5BcmdzfG51bGwge1xuICBjb25zdCBmaWVsZCA9IHtcbiAgICBpbmRleCxcbiAgICBuYW1lLFxuICAgIG92ZXJyaWRlOiBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXSBhcyB1bmRlZmluZWQgfCAoKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkpLFxuICAgIHR5cGU6IENPTFVNTi5VTlVTRUQsXG4gICAgLy8gYXV0by1kZXRlY3RlZCBmaWVsZHMgd2lsbCBuZXZlciBiZSBhcnJheXMuXG4gICAgaXNBcnJheTogZmFsc2UsXG4gICAgbWF4VmFsdWU6IDAsXG4gICAgbWluVmFsdWU6IDAsXG4gICAgd2lkdGg6IG51bGwgYXMgYW55LFxuICAgIGZsYWc6IG51bGwgYXMgYW55LFxuICAgIGJpdDogbnVsbCBhcyBhbnksXG4gIH07XG4gIGxldCBpc1VzZWQgPSBmYWxzZTtcbiAgLy9pZiAoaXNVc2VkICE9PSBmYWxzZSkgZGVidWdnZXI7XG4gIGZvciAoY29uc3QgdSBvZiBkYXRhKSB7XG4gICAgY29uc3QgdiA9IGZpZWxkLm92ZXJyaWRlID8gZmllbGQub3ZlcnJpZGUodVtpbmRleF0sIHUsIHNjaGVtYUFyZ3MpIDogdVtpbmRleF07XG4gICAgaWYgKCF2KSBjb250aW51ZTtcbiAgICAvL2NvbnNvbGUuZXJyb3IoYCR7aW5kZXh9OiR7bmFtZX0gfiAke3VbMF19OiR7dVsxXX06ICR7dn1gKVxuICAgIGlzVXNlZCA9IHRydWU7XG4gICAgY29uc3QgbiA9IE51bWJlcih2KTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB7XG4gICAgICAvLyBtdXN0IGJlIGEgc3RyaW5nXG4gICAgICBmaWVsZC50eXBlID0gQ09MVU1OLlNUUklORztcbiAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX0gaGFzIGEgZmxvYXQ/IFwiJHt2fVwiICgke259KVxceDFiWzBtYCk7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobikpIHtcbiAgICAgIC8vIHdlIHdpbGwgaGF2ZSB0byByZS1kbyB0aGlzIHBhcnQ6XG4gICAgICBmaWVsZC5taW5WYWx1ZSA9IC1JbmZpbml0eTtcbiAgICAgIGZpZWxkLm1heFZhbHVlID0gSW5maW5pdHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuIDwgZmllbGQubWluVmFsdWUpIGZpZWxkLm1pblZhbHVlID0gbjtcbiAgICAgIGlmIChuID4gZmllbGQubWF4VmFsdWUpIGZpZWxkLm1heFZhbHVlID0gbjtcbiAgICB9XG4gIH1cblxuICBpZiAoIWlzVXNlZCkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBpcyB1bnVzZWQ/XFx4MWJbMG1gKVxuICAgIC8vZGVidWdnZXI7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZiAoZmllbGQubWluVmFsdWUgPT09IDAgJiYgZmllbGQubWF4VmFsdWUgPT09IDEpIHtcbiAgICAvL2NvbnNvbGUuZXJyb3IoYFxceDFiWzM0bSR7aX06JHtuYW1lfSBhcHBlYXJzIHRvIGJlIGEgYm9vbGVhbiBmbGFnXFx4MWJbMG1gKTtcbiAgICBmaWVsZC50eXBlID0gQ09MVU1OLkJPT0w7XG4gICAgZmllbGQuYml0ID0gc2NoZW1hQXJncy5mbGFnc1VzZWQ7XG4gICAgZmllbGQuZmxhZyA9IDEgPDwgKGZpZWxkLmJpdCAlIDgpO1xuICAgIHJldHVybiBmaWVsZDtcbiAgfVxuXG4gIGlmIChmaWVsZC5tYXhWYWx1ZSEgPCBJbmZpbml0eSkge1xuICAgIC8vIEB0cy1pZ25vcmUgLSB3ZSB1c2UgaW5maW5pdHkgdG8gbWVhbiBcIm5vdCBhIGJpZ2ludFwiXG4gICAgY29uc3QgdHlwZSA9IHJhbmdlVG9OdW1lcmljVHlwZShmaWVsZC5taW5WYWx1ZSwgZmllbGQubWF4VmFsdWUpO1xuICAgIGlmICh0eXBlICE9PSBudWxsKSB7XG4gICAgICBmaWVsZC50eXBlID0gdHlwZTtcbiAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9XG4gIH1cblxuICAvLyBCSUcgQk9ZIFRJTUVcbiAgZmllbGQudHlwZSA9IENPTFVNTi5CSUc7XG4gIHJldHVybiBmaWVsZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVHlwZSAoXG4gIG5hbWU6IHN0cmluZyxcbiAgdHlwZTogQ09MVU1OLFxuICBpbmRleDogbnVtYmVyLFxuICBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzLFxuKTogQ29sdW1uQXJncyB7XG4gIGNvbnN0IG92ZXJyaWRlID0gc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV07XG4gIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgY2FzZSBDT0xVTU4uVU5VU0VEOlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdob3cgeW91IGdvbm5hIHVzZSBpdCB0aGVuJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICBjb25zdCBiaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICAgIGNvbnN0IGZsYWcgPSAxIDw8IChiaXQgJSA4KTtcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCBmbGFnLCBiaXQsIG92ZXJyaWRlIH07XG5cbiAgICBjYXNlIENPTFVNTi5VODpcbiAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogMSwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAyLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDQsIG92ZXJyaWRlfTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7dHlwZX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUFyZ3MgKGFyZ3M6IENvbHVtbkFyZ3MpOiBDb2x1bW4ge1xuICBzd2l0Y2ggKGFyZ3MudHlwZSAmIDE1KSB7XG4gICAgY2FzZSBDT0xVTU4uVU5VU0VEOlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnVzZWQgZmllbGQgY2FudCBiZSB0dXJuZWQgaW50byBhIENvbHVtbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgIHJldHVybiBuZXcgU3RyaW5nQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICBpZiAoYXJncy50eXBlICYgMTYpIHRocm93IG5ldyBFcnJvcignbm8gc3VjaCB0aGluZyBhcyBhIGZsYWcgYXJyYXknKTtcbiAgICAgIHJldHVybiBuZXcgQm9vbENvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5VODpcbiAgICBjYXNlIENPTFVNTi5JODpcbiAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICByZXR1cm4gbmV3IE51bWVyaWNDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIG5ldyBCaWdDb2x1bW4oYXJncyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgd2F0IHR5cGUgaXMgdGhpcyAke2FyZ3MudHlwZX1gKTtcbiAgfVxufVxuIiwgIi8vIGp1c3QgYSBidW5jaCBvZiBvdXRwdXQgZm9ybWF0dGluZyBzaGl0XG5leHBvcnQgZnVuY3Rpb24gdGFibGVEZWNvKG5hbWU6IHN0cmluZywgd2lkdGggPSA4MCwgc3R5bGUgPSA5KSB7XG4gIGNvbnN0IHsgVEwsIEJMLCBUUiwgQlIsIEhSIH0gPSBnZXRCb3hDaGFycyhzdHlsZSlcbiAgY29uc3QgbmFtZVdpZHRoID0gbmFtZS5sZW5ndGggKyAyOyAvLyB3aXRoIHNwYWNlc1xuICBjb25zdCBoVGFpbFdpZHRoID0gd2lkdGggLSAobmFtZVdpZHRoICsgNilcbiAgcmV0dXJuIFtcbiAgICBgJHtUTH0ke0hSLnJlcGVhdCg0KX0gJHtuYW1lfSAke0hSLnJlcGVhdChoVGFpbFdpZHRoKX0ke1RSfWAsXG4gICAgYCR7Qkx9JHtIUi5yZXBlYXQod2lkdGggLSAyKX0ke0JSfWBcbiAgXTtcbn1cblxuXG5mdW5jdGlvbiBnZXRCb3hDaGFycyAoc3R5bGU6IG51bWJlcikge1xuICBzd2l0Y2ggKHN0eWxlKSB7XG4gICAgY2FzZSA5OiByZXR1cm4geyBUTDogJ1x1MjUwQycsIEJMOiAnXHUyNTE0JywgVFI6ICdcdTI1MTAnLCBCUjogJ1x1MjUxOCcsIEhSOiAnXHUyNTAwJyB9O1xuICAgIGNhc2UgMTg6IHJldHVybiB7IFRMOiAnXHUyNTBGJywgQkw6ICdcdTI1MTcnLCBUUjogJ1x1MjUxMycsIEJSOiAnXHUyNTFCJywgSFI6ICdcdTI1MDEnIH07XG4gICAgY2FzZSAzNjogcmV0dXJuIHsgVEw6ICdcdTI1NTQnLCBCTDogJ1x1MjU1QScsIFRSOiAnXHUyNTU3JywgQlI6ICdcdTI1NUQnLCBIUjogJ1x1MjU1MCcgfTtcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgc3R5bGUnKTtcbiAgICAvL2Nhc2UgPzogcmV0dXJuIHsgVEw6ICdNJywgQkw6ICdOJywgVFI6ICdPJywgQlI6ICdQJywgSFI6ICdRJyB9O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib3hDaGFyIChpOiBudW1iZXIsIGRvdCA9IDApIHtcbiAgc3dpdGNoIChpKSB7XG4gICAgY2FzZSAwOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyAnO1xuICAgIGNhc2UgKEJPWC5VX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc1JztcbiAgICBjYXNlIChCT1guVV9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OSc7XG4gICAgY2FzZSAoQk9YLkRfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzcnO1xuICAgIGNhc2UgKEJPWC5EX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdCJztcbiAgICBjYXNlIChCT1guTF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NCc7XG4gICAgY2FzZSAoQk9YLkxfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzgnO1xuICAgIGNhc2UgKEJPWC5SX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc2JztcbiAgICBjYXNlIChCT1guUl9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3QSc7XG5cbiAgICAvLyB0d28td2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEEnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA2JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RSc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDInO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdEJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Ric7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEInO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA3JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Ric7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDMnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNUZGJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTgnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE5JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Qyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE2JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTknO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU1JztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU2JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBEJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Mic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBGJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Myc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTQnO1xuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA4JztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNCc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEMnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAwJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qyc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0UnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA5JztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNSc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEQnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAxJztcbiAgICAgIH1cbiAgICAvLyB0aHJlZS13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI2JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2Mic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFDJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUxRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NUUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFGJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUUnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIxJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyMCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVGJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM2JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY3JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0EnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjgnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY5JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkUnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJEJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRic7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjUnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY0JztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMxJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjUnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY2JztcbiAgICAvLyBmb3VyLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNDJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0QnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNGJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2QSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ2JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0NSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0NCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDMnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ3JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Mic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZDJztcbiAgICBkZWZhdWx0OiByZXR1cm4gJ1x1MjYxMic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQk9YIHtcbiAgVV9UID0gMSxcbiAgVV9CID0gMixcbiAgVV9EID0gNCxcbiAgRF9UID0gOCxcbiAgRF9CID0gMTYsXG4gIERfRCA9IDMyLFxuICBMX1QgPSA2NCxcbiAgTF9CID0gMTI4LFxuICBMX0QgPSAyNTYsXG4gIFJfVCA9IDUxMixcbiAgUl9CID0gMTAyNCxcbiAgUl9EID0gMjA0OCxcbn1cblxuIiwgImltcG9ydCB0eXBlIHsgQ29sdW1uIH0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHR5cGUgeyBSb3cgfSBmcm9tICcuL3RhYmxlJ1xuaW1wb3J0IHtcbiAgaXNTdHJpbmdDb2x1bW4sXG4gIGlzQmlnQ29sdW1uLFxuICBDT0xVTU4sXG4gIEJpZ0NvbHVtbixcbiAgQm9vbENvbHVtbixcbiAgU3RyaW5nQ29sdW1uLFxuICBOdW1lcmljQ29sdW1uLFxuICBjbXBGaWVsZHMsXG59IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB7IGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgdHlwZSBTY2hlbWFBcmdzID0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkga2V5OiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgbmFtZSwgZmxhZ3NVc2VkLCBrZXkgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArICgoIWMuaXNBcnJheSAmJiBjLndpZHRoKSB8fCAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBsZXQgZiA9IHRydWU7XG4gICAgbGV0IGIgPSBmYWxzZTtcbiAgICBsZXQgZmYgPSAwO1xuICAgIGZvciAoY29uc3QgW2ksIGNdIG9mIHRoaXMuY29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICAgIGxldCBPQyA9IC0xO1xuICAgICAgLy9pZiAoYy50eXBlICYgMTYpIGJyZWFrO1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklOR19BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJR19BUlJBWTpcbiAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgaWYgKG8gPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRzbyA9IE1hdGgubWF4KDAsIGkgLSAyKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSwgaSwgbywgYERTTzoke2Rzb30uLiR7aSArIDJ9OmAsIGNvbHVtbnMuc2xpY2UoTWF0aC5tYXgoMCwgaSAtIDIpLCBpICsgMikpO1xuICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgbm90IGJlIScpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIERPTkUgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gdGhpcy5mbGFnRmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb29PU0FBU09BTycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgYmUhJylcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjLCBvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdib29vJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvOyBjLmJpdCA9IGZmKys7IGMuZmxhZyA9IDIgKiogKGMuYml0ICUgOCk7IC8vIGhlaGVoZVxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgIGlmIChjLmJpdCArIDEgPT09IHRoaXMuZmxhZ0ZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRScpXG4gICAgICAgICAgICBpZiAoYy5mbGFnIDwgMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCAtIDEpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUgLSAxJylcbiAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgIGlmICghYy53aWR0aCkgZGVidWdnZXI7XG4gICAgICAgICAgbyArPSBjLndpZHRoITtcbiAgICAgICAgICBpZiAobyA9PT0gdGhpcy5maXhlZFdpZHRoKSBmID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL2NvbnN0IHJuZyA9IE9DIDwgMCA/IGBgIDogYCAke09DfS4uJHtvfSAvICR7dGhpcy5maXhlZFdpZHRofWBcbiAgICAgIC8vY29uc29sZS5sb2coYFske2l9XSR7cm5nfWAsIGMubmFtZSwgYy5sYWJlbClcbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBba2V5LCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcblxuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAga2V5LFxuICAgICAgY29sdW1uczogW10gYXMgQ29sdW1uW10sXG4gICAgICBmaWVsZHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgZmxhZ3NVc2VkOiAwLFxuICAgICAgcmF3RmllbGRzOiB7fSwgLy8gbm9uZSA6PFxuICAgICAgb3ZlcnJpZGVzOiB7fSwgLy8gbm9uZX5cbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyBUT0RPIC0gb25seSB3b3JrcyB3aGVuIDAtZmllbGQgc2NoZW1hcyBhcmVuJ3QgYWxsb3dlZH4hXG4gICAgd2hpbGUgKGluZGV4IDwgbnVtRmllbGRzKSB7XG4gICAgICBjb25zdCB0eXBlID0gYnl0ZXNbaSsrXTtcbiAgICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgY29uc3QgZiA9IHtcbiAgICAgICAgaW5kZXgsIG5hbWUsIHR5cGUsXG4gICAgICAgIHdpZHRoOiBudWxsLCBiaXQ6IG51bGwsIGZsYWc6IG51bGwsXG4gICAgICAgIG9yZGVyOiA5OTlcbiAgICAgIH07XG4gICAgICBpICs9IHJlYWQ7XG4gICAgICBsZXQgYzogQ29sdW1uO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICAgYyA9IG5ldyBTdHJpbmdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgICAgYyA9IG5ldyBCaWdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGNvbnN0IGJpdCA9IGFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgY29uc3QgZmxhZyA9IDIgKiogKGJpdCAlIDgpO1xuICAgICAgICAgIGMgPSBuZXcgQm9vbENvbHVtbih7IC4uLmYsIGJpdCwgZmxhZyB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAxIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDQgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIHR5cGUgJHt0eXBlfWApO1xuICAgICAgfVxuICAgICAgYXJncy5jb2x1bW5zLnB1c2goYyk7XG4gICAgICBhcmdzLmZpZWxkcy5wdXNoKGMubmFtZSk7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNjaGVtYShhcmdzKTtcbiAgfVxuXG4gIHJvd0Zyb21CdWZmZXIoXG4gICAgICBpOiBudW1iZXIsXG4gICAgICBidWZmZXI6IEFycmF5QnVmZmVyLFxuICAgICAgX19yb3dJZDogbnVtYmVyXG4gICk6IFtSb3csIG51bWJlcl0ge1xuICAgIGNvbnN0IGRiciA9IF9fcm93SWQgPCA1IHx8IF9fcm93SWQgPiAzOTc1IHx8IF9fcm93SWQgJSAxMDAwID09PSAwO1xuICAgIC8vaWYgKGRicikgY29uc29sZS5sb2coYCAtIFJPVyAke19fcm93SWR9IEZST00gJHtpfSAoMHgke2kudG9TdHJpbmcoMTYpfSlgKVxuICAgIGxldCB0b3RhbFJlYWQgPSAwO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgY29uc3Qgcm93OiBSb3cgPSB7IF9fcm93SWQgfVxuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuXG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgLy9pZiAoYy5vZmZzZXQgJiYgYy5vZmZzZXQgIT09IHRvdGFsUmVhZCkgeyBkZWJ1Z2dlcjsgY29uc29sZS5sb2coJ3dvb3BzaWUnKTsgfVxuICAgICAgbGV0IFt2LCByZWFkXSA9IGMuaXNBcnJheSA/XG4gICAgICAgIGMuYXJyYXlGcm9tQnl0ZXMoaSwgYnl0ZXMsIHZpZXcpIDpcbiAgICAgICAgYy5mcm9tQnl0ZXMoaSwgYnl0ZXMsIHZpZXcpO1xuXG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTClcbiAgICAgICAgcmVhZCA9IChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgPyAxIDogMDtcblxuICAgICAgaSArPSByZWFkO1xuICAgICAgdG90YWxSZWFkICs9IHJlYWQ7XG4gICAgICAvLyBkb24ndCBwdXQgZmFsc3kgdmFsdWVzIG9uIGZpbmFsIG9iamVjdHMuIG1heSByZXZpc2l0IGhvdyB0aGlzIHdvcmtzIGxhdGVyXG4gICAgICBpZiAoYy5pc0FycmF5IHx8IHYpIHJvd1tjLm5hbWVdID0gdjtcbiAgICAgIC8vY29uc3QgdyA9IGdsb2JhbFRoaXMuX1JPV1NbdGhpcy5uYW1lXVtfX3Jvd0lkXVtjLm5hbWVdIC8vIHNycyBiaXpcbiAgICAgIC8qXG4gICAgICBpZiAodyAhPT0gdikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodykgfHwgdy5zb21lKChuLCBpKSA9PiBuICE9PSB2W2ldKSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFhYWFhYICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gLT4gJHt2fWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5lcnJvcihgX19fX18gJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSA9PSAke3Z9YClcbiAgICAgIH1cbiAgICAgICovXG4gICAgfVxuICAgIC8vaWYgKGRicikge1xuICAgICAgLy9jb25zb2xlLmxvZyhgICAgUkVBRDogJHt0b3RhbFJlYWR9IFRPICR7aX0gLyAke2J1ZmZlci5ieXRlTGVuZ3RofVxcbmAsIHJvdywgJ1xcblxcbicpO1xuICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAvL31cbiAgICByZXR1cm4gW3JvdywgdG90YWxSZWFkXTtcbiAgfVxuXG4gIHByaW50Um93IChyOiBSb3csIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+KSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKSk7XG4gIH1cblxuICBzZXJpYWxpemVIZWFkZXIgKCk6IEJsb2Ige1xuICAgIC8vIFsuLi5uYW1lLCAwLCBudW1GaWVsZHMwLCBudW1GaWVsZHMxLCBmaWVsZDBUeXBlLCBmaWVsZDBGbGFnPywgLi4uZmllbGQwTmFtZSwgMCwgZXRjXTtcbiAgICAvLyBUT0RPIC0gQmFzZSB1bml0IGhhcyA1MDArIGZpZWxkc1xuICAgIGlmICh0aGlzLmNvbHVtbnMubGVuZ3RoID4gNjU1MzUpIHRocm93IG5ldyBFcnJvcignb2ggYnVkZHkuLi4nKTtcbiAgICBjb25zdCBwYXJ0cyA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKSxcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5rZXkpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyAocjogUm93KTogQmxvYiB7XG4gICAgY29uc3QgZml4ZWQgPSBuZXcgVWludDhBcnJheSh0aGlzLmZpeGVkV2lkdGgpO1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcbiAgICBjb25zdCBibG9iUGFydHM6IEJsb2JQYXJ0W10gPSBbZml4ZWRdO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgIGNvbnN0IHYgPSByW2MubmFtZV1cbiAgICAgIGlmIChjLmlzQXJyYXkpIHtcbiAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplQXJyYXkodiBhcyBhbnlbXSlcbiAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBzdHJpbmcpXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgfSBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgLy8gYWZ0ZXIgd2UncmUgZG9uZSB3aXRoIG51bWJlcnMgYW5kIGJvb2xlYW5zXG4gICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpIGkrKztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgIGZpeGVkLnNldChieXRlcywgaSlcbiAgICAgICAgICBpICs9IGMud2lkdGghO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7KGMgYXMgYW55KS50eXBlfWApO1xuICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBDT0xVTU46JywgYyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgUk9XOicsIHIpO1xuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lmIChyLl9fcm93SWQgPCA1IHx8IHIuX19yb3dJZCA+IDM5NzUgfHwgci5fX3Jvd0lkICUgMTAwMCA9PT0gMCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgIC0gUk9XICR7ci5fX3Jvd0lkfWAsIHsgaSwgYmxvYlBhcnRzLCByIH0pO1xuICAgIC8vfVxuICAgIHJldHVybiBuZXcgQmxvYihibG9iUGFydHMpO1xuICB9XG5cbiAgcHJpbnQgKHdpZHRoID0gODApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMzYpO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnN0IHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSA9IHRoaXM7XG4gICAgY29uc29sZS5sb2coeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9KTtcbiAgICBjb25zb2xlLnRhYmxlKHRoaXMuY29sdW1ucywgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ2xhYmVsJyxcbiAgICAgICdvZmZzZXQnLFxuICAgICAgJ29yZGVyJyxcbiAgICAgICdiaXQnLFxuICAgICAgJ3R5cGUnLFxuICAgICAgJ2ZsYWcnLFxuICAgICAgJ3dpZHRoJyxcbiAgICBdKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcblxuICB9XG5cbiAgLy8gcmF3VG9Sb3cgKGQ6IFJhd1Jvdyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHt9XG4gIC8vIHJhd1RvU3RyaW5nIChkOiBSYXdSb3csIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHt9XG59O1xuXG4iLCAiaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmV4cG9ydCB0eXBlIFJvd0RhdGEgPSBzdHJpbmd8bnVtYmVyfGJvb2xlYW58YmlnaW50fChzdHJpbmd8bnVtYmVyfGJpZ2ludClbXTtcbmV4cG9ydCB0eXBlIFJvdyA9IFJlY29yZDxzdHJpbmcsIFJvd0RhdGE+ICYgeyBfX3Jvd0lkOiBudW1iZXIgfTtcblxudHlwZSBUYWJsZUJsb2IgPSB7IG51bVJvd3M6IG51bWJlciwgaGVhZGVyQmxvYjogQmxvYiwgZGF0YUJsb2I6IEJsb2IgfTtcblxuZXhwb3J0IGNsYXNzIFRhYmxlIHtcbiAgZ2V0IG5hbWUgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNjaGVtYS5uYW1lIH1cbiAgZ2V0IGtleSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc2NoZW1hLmtleSB9XG4gIHJlYWRvbmx5IG1hcDogTWFwPGFueSwgYW55PiA9IG5ldyBNYXAoKVxuICBjb25zdHJ1Y3RvciAoXG4gICAgcmVhZG9ubHkgcm93czogUm93W10sXG4gICAgcmVhZG9ubHkgc2NoZW1hOiBTY2hlbWEsXG4gICkge1xuICAgIGNvbnN0IGtleU5hbWUgPSB0aGlzLmtleTtcbiAgICBpZiAoa2V5TmFtZSAhPT0gJ19fcm93SWQnKSBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IGtleSA9IHJvd1trZXlOYW1lXTtcbiAgICAgIGlmICh0aGlzLm1hcC5oYXMoa2V5KSkgdGhyb3cgbmV3IEVycm9yKCdrZXkgaXMgbm90IHVuaXF1ZScpO1xuICAgICAgdGhpcy5tYXAuc2V0KGtleSwgcm93KTtcbiAgICB9XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IFtVaW50MzJBcnJheSwgQmxvYiwgQmxvYl0ge1xuICAgIC8vIFtudW1Sb3dzLCBoZWFkZXJTaXplLCBkYXRhU2l6ZV0sIHNjaGVtYUhlYWRlciwgW3JvdzAsIHJvdzEsIC4uLiByb3dOXTtcbiAgICBjb25zdCBzY2hlbWFIZWFkZXIgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVIZWFkZXIoKTtcbiAgICAvLyBjYW50IGZpZ3VyZSBvdXQgaG93IHRvIGRvIHRoaXMgd2l0aCBiaXRzIDonPFxuICAgIGNvbnN0IHNjaGVtYVBhZGRpbmcgPSAoNCAtIHNjaGVtYUhlYWRlci5zaXplICUgNCkgJSA0O1xuICAgIGNvbnN0IHJvd0RhdGEgPSB0aGlzLnJvd3MuZmxhdE1hcChyID0+IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZVJvdyhyKSk7XG5cbiAgICAvL2NvbnN0IHJvd0RhdGEgPSB0aGlzLnJvd3MuZmxhdE1hcChyID0+IHtcbiAgICAgIC8vY29uc3Qgcm93QmxvYiA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZVJvdyhyKVxuICAgICAgLy9pZiAoci5fX3Jvd0lkID09PSAwKVxuICAgICAgICAvL3Jvd0Jsb2IuYXJyYXlCdWZmZXIoKS50aGVuKGFiID0+IHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKGBBUlJBWSBCVUZGRVIgRk9SIEZJUlNUIFJPVyBPRiAke3RoaXMubmFtZX1gLCBuZXcgVWludDhBcnJheShhYikuam9pbignLCAnKSk7XG4gICAgICAgIC8vfSk7XG4gICAgICAvL3JldHVybiByb3dCbG9iO1xuICAgIC8vfSk7XG4gICAgY29uc3Qgcm93QmxvYiA9IG5ldyBCbG9iKHJvd0RhdGEpXG4gICAgY29uc3QgZGF0YVBhZGRpbmcgPSAoNCAtIHJvd0Jsb2Iuc2l6ZSAlIDQpICUgNDtcblxuICAgIHJldHVybiBbXG4gICAgICBuZXcgVWludDMyQXJyYXkoW1xuICAgICAgICB0aGlzLnJvd3MubGVuZ3RoLFxuICAgICAgICBzY2hlbWFIZWFkZXIuc2l6ZSArIHNjaGVtYVBhZGRpbmcsXG4gICAgICAgIHJvd0Jsb2Iuc2l6ZSArIGRhdGFQYWRkaW5nXG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgc2NoZW1hSGVhZGVyLFxuICAgICAgICBuZXcgQXJyYXlCdWZmZXIoc2NoZW1hUGFkZGluZykgYXMgYW55IC8vID8/P1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHJvd0Jsb2IsXG4gICAgICAgIG5ldyBVaW50OEFycmF5KGRhdGFQYWRkaW5nKVxuICAgICAgXSksXG4gICAgXTtcbiAgfVxuXG4gIHN0YXRpYyBjb25jYXRUYWJsZXMgKHRhYmxlczogVGFibGVbXSk6IEJsb2Ige1xuICAgIGNvbnN0IGFsbFNpemVzID0gbmV3IFVpbnQzMkFycmF5KDEgKyB0YWJsZXMubGVuZ3RoICogMyk7XG4gICAgY29uc3QgYWxsSGVhZGVyczogQmxvYltdID0gW107XG4gICAgY29uc3QgYWxsRGF0YTogQmxvYltdID0gW107XG5cbiAgICBjb25zdCBibG9icyA9IHRhYmxlcy5tYXAodCA9PiB0LnNlcmlhbGl6ZSgpKTtcbiAgICBhbGxTaXplc1swXSA9IGJsb2JzLmxlbmd0aDtcbiAgICBmb3IgKGNvbnN0IFtpLCBbc2l6ZXMsIGhlYWRlcnMsIGRhdGFdXSBvZiBibG9icy5lbnRyaWVzKCkpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYE9VVCBCTE9CUyBGT1IgVD0ke2l9YCwgc2l6ZXMsIGhlYWRlcnMsIGRhdGEpXG4gICAgICBhbGxTaXplcy5zZXQoc2l6ZXMsIDEgKyBpICogMyk7XG4gICAgICBhbGxIZWFkZXJzLnB1c2goaGVhZGVycyk7XG4gICAgICBhbGxEYXRhLnB1c2goZGF0YSk7XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coeyB0YWJsZXMsIGJsb2JzLCBhbGxTaXplcywgYWxsSGVhZGVycywgYWxsRGF0YSB9KVxuICAgIHJldHVybiBuZXcgQmxvYihbYWxsU2l6ZXMsIC4uLmFsbEhlYWRlcnMsIC4uLmFsbERhdGFdKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBvcGVuQmxvYiAoYmxvYjogQmxvYik6IFByb21pc2U8UmVjb3JkPHN0cmluZywgVGFibGU+PiB7XG4gICAgaWYgKGJsb2Iuc2l6ZSAlIDQgIT09IDApIHRocm93IG5ldyBFcnJvcignd29ua3kgYmxvYiBzaXplJyk7XG4gICAgY29uc3QgbnVtVGFibGVzID0gbmV3IFVpbnQzMkFycmF5KGF3YWl0IGJsb2Iuc2xpY2UoMCwgNCkuYXJyYXlCdWZmZXIoKSlbMF07XG5cbiAgICAvLyBvdmVyYWxsIGJ5dGUgb2Zmc2V0XG4gICAgbGV0IGJvID0gNDtcbiAgICBjb25zdCBzaXplcyA9IG5ldyBVaW50MzJBcnJheShcbiAgICAgIGF3YWl0IGJsb2Iuc2xpY2UoYm8sIGJvICs9IG51bVRhYmxlcyAqIDEyKS5hcnJheUJ1ZmZlcigpXG4gICAgKTtcblxuICAgIGNvbnN0IHRCbG9iczogVGFibGVCbG9iW10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpID0gaSAqIDM7XG4gICAgICBjb25zdCBudW1Sb3dzID0gc2l6ZXNbc2ldO1xuICAgICAgY29uc3QgaFNpemUgPSBzaXplc1tzaSArIDFdO1xuICAgICAgdEJsb2JzW2ldID0geyBudW1Sb3dzLCBoZWFkZXJCbG9iOiBibG9iLnNsaWNlKGJvLCBibyArPSBoU2l6ZSkgfSBhcyBhbnk7XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpKyspIHtcbiAgICAgIHRCbG9ic1tpXS5kYXRhQmxvYiA9IGJsb2Iuc2xpY2UoYm8sIGJvICs9IHNpemVzW2kgKiAzICsgMl0pO1xuICAgIH07XG4gICAgY29uc3QgdGFibGVzID0gYXdhaXQgUHJvbWlzZS5hbGwodEJsb2JzLm1hcCgodGIsIGkpID0+IHtcbiAgICAgIC8vY29uc29sZS5sb2coYElOIEJMT0JTIEZPUiBUPSR7aX1gLCB0YilcbiAgICAgIHJldHVybiB0aGlzLmZyb21CbG9iKHRiKTtcbiAgICB9KSlcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlcy5tYXAodCA9PiBbdC5zY2hlbWEubmFtZSwgdF0pKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmcm9tQmxvYiAoe1xuICAgIGhlYWRlckJsb2IsXG4gICAgZGF0YUJsb2IsXG4gICAgbnVtUm93cyxcbiAgfTogVGFibGVCbG9iKTogUHJvbWlzZTxUYWJsZT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IFNjaGVtYS5mcm9tQnVmZmVyKGF3YWl0IGhlYWRlckJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgbGV0IHJibyA9IDA7XG4gICAgbGV0IF9fcm93SWQgPSAwO1xuICAgIGNvbnN0IHJvd3M6IFJvd1tdID0gW107XG4gICAgLy8gVE9ETyAtIGNvdWxkIGRlZmluaXRlbHkgdXNlIGEgc3RyZWFtIGZvciB0aGlzXG4gICAgY29uc3QgZGF0YUJ1ZmZlciA9IGF3YWl0IGRhdGFCbG9iLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc29sZS5sb2coYD09PT09IFJFQUQgJHtudW1Sb3dzfSBPRiAke3NjaGVtYS5uYW1lfSA9PT09PWApXG4gICAgd2hpbGUgKF9fcm93SWQgPCBudW1Sb3dzKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgcmJvICs9IHJlYWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xuICB9XG5cblxuICBwcmludCAoXG4gICAgd2lkdGg6IG51bWJlciA9IDgwLFxuICAgIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+fG51bGwgPSBudWxsLFxuICAgIG46IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBtOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgcD86IChyOiBhbnkpID0+IGJvb2xlYW4sXG4gICk6IG51bGx8YW55W10ge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAxOCk7XG4gICAgY29uc3Qgcm93cyA9IHAgPyB0aGlzLnJvd3MuZmlsdGVyKHApIDpcbiAgICAgIG4gPT09IG51bGwgPyB0aGlzLnJvd3MgOlxuICAgICAgbSA9PT0gbnVsbCA/IHRoaXMucm93cy5zbGljZSgwLCBuKSA6XG4gICAgICB0aGlzLnJvd3Muc2xpY2UobiwgbSk7XG5cblxuICAgIGxldCBtRmllbGRzID0gQXJyYXkuZnJvbSgoZmllbGRzID8/IHRoaXMuc2NoZW1hLmZpZWxkcykpO1xuICAgIGlmIChwKSBbbiwgbV0gPSBbMCwgcm93cy5sZW5ndGhdXG4gICAgZWxzZSAobUZpZWxkcyBhcyBhbnkpLnVuc2hpZnQoJ19fcm93SWQnKTtcblxuICAgIGNvbnN0IFtwUm93cywgcEZpZWxkc10gPSBmaWVsZHMgP1xuICAgICAgW3Jvd3MubWFwKChyOiBSb3cpID0+IHRoaXMuc2NoZW1hLnByaW50Um93KHIsIG1GaWVsZHMpKSwgZmllbGRzXTpcbiAgICAgIFtyb3dzLCB0aGlzLnNjaGVtYS5maWVsZHNdXG4gICAgICA7XG5cbiAgICBjb25zb2xlLmxvZygncm93IGZpbHRlcjonLCBwID8/ICcobm9uZSknKVxuICAgIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnNvbGUudGFibGUocFJvd3MsIHBGaWVsZHMpO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuICAgIHJldHVybiAocCAmJiBmaWVsZHMpID9cbiAgICAgIHJvd3MubWFwKHIgPT5cbiAgICAgICAgT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pLmZpbHRlcihlID0+IGVbMV0pKVxuICAgICAgKSA6XG4gICAgICBudWxsO1xuICB9XG5cbiAgZHVtcFJvdyAoaTogbnVtYmVyfG51bGwsIHNob3dFbXB0eSA9IGZhbHNlLCB1c2VDU1M/OiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgIC8vIFRPRE8gXHUyMDE0IGluIGJyb3dzZXIsIHVzZUNTUyA9PT0gdHJ1ZSBieSBkZWZhdWx0XG4gICAgdXNlQ1NTID8/PSAoZ2xvYmFsVGhpc1snd2luZG93J10gPT09IGdsb2JhbFRoaXMpOyAvLyBpZGtcbiAgICBpID8/PSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLnJvd3MubGVuZ3RoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLnJvd3NbaV07XG4gICAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGNzczogc3RyaW5nW118bnVsbCA9IHVzZUNTUyA/IFtdIDogbnVsbDtcbiAgICBjb25zdCBmbXQgPSBmbXRTdHlsZWQuYmluZChudWxsLCBvdXQsIGNzcyk7XG4gICAgY29uc3QgcCA9IE1hdGgubWF4KFxuICAgICAgLi4udGhpcy5zY2hlbWEuY29sdW1uc1xuICAgICAgLmZpbHRlcihjID0+IHNob3dFbXB0eSB8fCByb3dbYy5uYW1lXSlcbiAgICAgIC5tYXAoYyA9PiBjLm5hbWUubGVuZ3RoICsgMilcbiAgICApO1xuICAgIGlmICghcm93KVxuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV0gZG9lcyBub3QgZXhpc3RgLCBDX05PVF9GT1VORCk7XG4gICAgZWxzZSB7XG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XWAsIENfUk9XX0hFQUQpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIHRoaXMuc2NoZW1hLmNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbYy5uYW1lXTtcbiAgICAgICAgY29uc3QgbiA9IGMubmFtZS5wYWRTdGFydChwLCAnICcpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjVFJVRWAsIENfVFJVRSlcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06ICVjRkFMU0VgLCBDX05PVF9GT1VORCwgQ19GQUxTRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX05VTUJFUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDBgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX1NUUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IFx1MjAxNGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChge259OiAlYzAgJWMke3ZhbHVlfSAoQklHKWAsIENfQklHLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwIChCSUcpYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHVzZUNTUykgcmV0dXJuIFtvdXQuam9pbignXFxuJyksIC4uLmNzcyFdO1xuICAgIGVsc2UgcmV0dXJuIFtvdXQuam9pbignXFxuJyldO1xuICB9XG5cbiAgZmluZFJvdyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4sIHN0YXJ0ID0gMCk6IG51bWJlciB7XG4gICAgY29uc3QgTiA9IHRoaXMucm93cy5sZW5ndGhcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IE4gLSBzdGFydDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBOOyBpKyspIGlmIChwcmVkaWNhdGUodGhpcy5yb3dzW2ldKSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgKiBmaWx0ZXJSb3dzIChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbik6IEdlbmVyYXRvcjxSb3c+IHtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIGlmIChwcmVkaWNhdGUocm93KSkgeWllbGQgcm93O1xuICB9XG4gIC8qXG4gIHJhd1RvUm93IChkOiBzdHJpbmdbXSk6IFJvdyB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNjaGVtYS5jb2x1bW5zLm1hcChyID0+IFtcbiAgICAgIHIubmFtZSxcbiAgICAgIHIudG9WYWwoZFtyLmluZGV4XSlcbiAgICBdKSk7XG4gIH1cbiAgcmF3VG9TdHJpbmcgKGQ6IHN0cmluZ1tdLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgLy8ganVzdCBhc3N1bWUgZmlyc3QgdHdvIGZpZWxkcyBhcmUgYWx3YXlzIGlkLCBuYW1lLiBldmVuIGlmIHRoYXQncyBub3QgdHJ1ZVxuICAgIC8vIHRoaXMgaXMganVzdCBmb3IgdmlzdWFsaXphdGlvbiBwdXJwb3JzZXNcbiAgICBsZXQgZXh0cmEgPSAnJztcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHM6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBlID0gdGhpcy5yYXdUb1JvdyhkKTtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBhcmdzKSB7XG4gICAgICAgIC8vIGRvbid0IHJlcHJpbnQgbmFtZSBvciBpZFxuICAgICAgICBpZiAoYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzBdIHx8IGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1sxXSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKGVbYV0gIT0gbnVsbClcbiAgICAgICAgICBzLnB1c2goYCR7YX06ICR7SlNPTi5zdHJpbmdpZnkoZVthXSl9YClcbiAgICAgIH1cbiAgICAgIGV4dHJhID0gcy5sZW5ndGggPiAwID8gYCB7ICR7cy5qb2luKCcsICcpfSB9YCA6ICd7fSc7XG4gICAgfVxuICAgIHJldHVybiBgPCR7dGhpcy5zY2hlbWEubmFtZX06JHtkWzBdID8/ICc/J30gXCIke2RbMV19XCIke2V4dHJhfT5gO1xuICB9XG4gICovXG59XG5cbmZ1bmN0aW9uIGZtdFN0eWxlZCAoXG4gIG91dDogc3RyaW5nW10sXG4gIGNzc091dDogc3RyaW5nW10gfCBudWxsLFxuICBtc2c6IHN0cmluZyxcbiAgLi4uY3NzOiBzdHJpbmdbXVxuKSB7XG4gIGlmIChjc3NPdXQpIHtcbiAgICBvdXQucHVzaChtc2cgKyAnJWMnKVxuICAgIGNzc091dC5wdXNoKC4uLmNzcywgQ19SRVNFVCk7XG4gIH1cbiAgZWxzZSBvdXQucHVzaChtc2cucmVwbGFjZSgvJWMvZywgJycpKTtcbn1cblxuY29uc3QgQ19OT1RfRk9VTkQgPSAnY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYzsnO1xuY29uc3QgQ19ST1dfSEVBRCA9ICdmb250LXdlaWdodDogYm9sZGVyJztcbmNvbnN0IENfQk9MRCA9ICdmb250LXdlaWdodDogYm9sZCc7XG5jb25zdCBDX05VTUJFUiA9ICdjb2xvcjogI0EwNTUxODsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfVFJVRSA9ICdjb2xvcjogIzRDMzhCRTsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfRkFMU0UgPSAnY29sb3I6ICMzOEJFMUM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1NUUiA9ICdjb2xvcjogIzMwQUE2MjsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfQklHID0gJ2NvbG9yOiAjNzgyMUEzOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19SRVNFVCA9ICdjb2xvcjogdW5zZXQ7IGZvbnQtc3R5bGU6IHVuc2V0OyBmb250LXdlaWdodDogdW5zZXQ7IGJhY2tncm91bmQtdW5zZXQnXG4iLCAiaW1wb3J0IHsgQ09MVU1OLCBTY2hlbWFBcmdzIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgdHlwZSB7IFBhcnNlU2NoZW1hT3B0aW9ucyB9IGZyb20gJy4vcGFyc2UtY3N2J1xuZXhwb3J0IGNvbnN0IGNzdkRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4gPSB7XG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlVS5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXQnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoW1xuICAgICAgJ2FybW9yMScsXG4gICAgICAnYXJtb3IyJyxcbiAgICAgICdhcm1vcjMnLFxuICAgICAgJ2FybW9yNCcsXG4gICAgICAnZW5kJyxcbiAgICAgICdsaW5rMScsXG4gICAgICAnbGluazInLFxuICAgICAgJ2xpbmszJyxcbiAgICAgICdsaW5rNCcsXG4gICAgICAnbGluazUnLFxuICAgICAgJ2xpbms2JyxcbiAgICAgICdtYXNrMScsXG4gICAgICAnbWFzazInLFxuICAgICAgJ21hc2szJyxcbiAgICAgICdtYXNrNCcsXG4gICAgICAnbWFzazUnLFxuICAgICAgJ21hc2s2JyxcbiAgICAgICdtb3VudGVkJywgLy8gZGVwcmVjYXRlZFxuICAgICAgJ25icjEnLFxuICAgICAgJ25icjInLFxuICAgICAgJ25icjMnLFxuICAgICAgJ25icjQnLFxuICAgICAgJ25icjUnLFxuICAgICAgJ25icjYnLFxuICAgICAgJ3JhbmQxJyxcbiAgICAgICdyYW5kMicsXG4gICAgICAncmFuZDMnLFxuICAgICAgJ3JhbmQ0JyxcbiAgICAgICdyYW5kNScsXG4gICAgICAncmFuZDYnLFxuICAgICAgJ3JlYW5pbWF0b3IuMScsIC8vIHR1cm5zIG91dCBub3RoaW5nIGFjdHVhbGx5IHJlZmVyZW5jZXMgdGhpcyBmaWVsZCBhbnl3YXk/XG4gICAgICAnd3BuMScsXG4gICAgICAnd3BuMicsXG4gICAgICAnd3BuMycsXG4gICAgICAnd3BuNCcsXG4gICAgICAnd3BuNScsXG4gICAgICAnd3BuNicsXG4gICAgICAnd3BuNycsXG4gICAgICAnc3VtbW9uJyxcbiAgICAgICduX3N1bW1vbidcbiAgICBdKSxcbiAgICBrbm93bkZpZWxkczoge1xuICAgICAgaWQ6IENPTFVNTi5VMTYsXG4gICAgICBuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgcnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlY2xpbWl0OiBDT0xVTU4uSTgsXG4gICAgICBiYXNlY29zdDogQ09MVU1OLlUxNixcbiAgICAgIHJjb3N0OiBDT0xVTU4uSTgsXG4gICAgICBzaXplOiBDT0xVTU4uVTgsXG4gICAgICByZXNzaXplOiBDT0xVTU4uVTgsXG4gICAgICBocDogQ09MVU1OLlUxNixcbiAgICAgIHByb3Q6IENPTFVNTi5VOCxcbiAgICAgIG1yOiBDT0xVTU4uVTgsXG4gICAgICBtb3I6IENPTFVNTi5VOCxcbiAgICAgIHN0cjogQ09MVU1OLlU4LFxuICAgICAgYXR0OiBDT0xVTU4uVTgsXG4gICAgICBkZWY6IENPTFVNTi5VOCxcbiAgICAgIHByZWM6IENPTFVNTi5VOCxcbiAgICAgIGVuYzogQ09MVU1OLlU4LFxuICAgICAgbWFwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgYXA6IENPTFVNTi5VOCxcbiAgICAgIGFtYmlkZXh0cm91czogQ09MVU1OLlU4LFxuICAgICAgbW91bnRtbnI6IENPTFVNTi5VMTYsXG4gICAgICBza2lsbGVkcmlkZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlaW52aWdvcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHVuZGVhZGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgbWF4YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgaGFuZDogQ09MVU1OLlU4LFxuICAgICAgaGVhZDogQ09MVU1OLlU4LFxuICAgICAgbWlzYzogQ09MVU1OLlU4LFxuICAgICAgcGF0aGNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0ZG9tOiBDT0xVTU4uVTgsXG4gICAgICBib251c3NwZWxsczogQ09MVU1OLlU4LFxuICAgICAgRjogQ09MVU1OLlU4LFxuICAgICAgQTogQ09MVU1OLlU4LFxuICAgICAgVzogQ09MVU1OLlU4LFxuICAgICAgRTogQ09MVU1OLlU4LFxuICAgICAgUzogQ09MVU1OLlU4LFxuICAgICAgRDogQ09MVU1OLlU4LFxuICAgICAgTjogQ09MVU1OLlU4LFxuICAgICAgRzogQ09MVU1OLlU4LFxuICAgICAgQjogQ09MVU1OLlU4LFxuICAgICAgSDogQ09MVU1OLlU4LFxuICAgICAgc2FpbGluZ3NoaXBzaXplOiBDT0xVTU4uVTE2LFxuICAgICAgc2FpbGluZ21heHVuaXRzaXplOiBDT0xVTU4uVTgsXG4gICAgICBzdGVhbHRoeTogQ09MVU1OLlU4LFxuICAgICAgcGF0aWVuY2U6IENPTFVNTi5VOCxcbiAgICAgIHNlZHVjZTogQ09MVU1OLlU4LFxuICAgICAgc3VjY3VidXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnJ1cHQ6IENPTFVNTi5VOCxcbiAgICAgIGhvbWVzaWNrOiBDT0xVTU4uVTgsXG4gICAgICBmb3JtYXRpb25maWdodGVyOiBDT0xVTU4uSTgsXG4gICAgICBzdGFuZGFyZDogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyYXRpb25hbDogQ09MVU1OLkk4LFxuICAgICAgdGFza21hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYmVhc3RtYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJvZHlndWFyZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJicmVhdGhpbmc6IENPTFVNTi5VMTYsXG4gICAgICBpY2Vwcm90OiBDT0xVTU4uVTgsXG4gICAgICBpbnZ1bG5lcmFibGU6IENPTFVNTi5VOCxcbiAgICAgIHNob2NrcmVzOiBDT0xVTU4uSTgsXG4gICAgICBmaXJlcmVzOiBDT0xVTU4uSTgsXG4gICAgICBjb2xkcmVzOiBDT0xVTU4uSTgsXG4gICAgICBwb2lzb25yZXM6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHZvaWRzYW5pdHk6IENPTFVNTi5VOCxcbiAgICAgIGRhcmt2aXNpb246IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hbGF3ZTogQ09MVU1OLlU4LFxuICAgICAgYXdlOiBDT0xVTU4uVTgsXG4gICAgICBoYWx0aGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZmVhcjogQ09MVU1OLlU4LFxuICAgICAgYmVyc2VyazogQ09MVU1OLlU4LFxuICAgICAgY29sZDogQ09MVU1OLlU4LFxuICAgICAgaGVhdDogQ09MVU1OLlU4LFxuICAgICAgZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgYmFuZWZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGRhbWFnZXJldjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIGRpc2Vhc2VjbG91ZDogQ09MVU1OLlU4LFxuICAgICAgc2xpbWVyOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kc2xpbWU6IENPTFVNTi5VMTYsXG4gICAgICByZWdlbmVyYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmFybW9yOiBDT0xVTU4uVTgsXG4gICAgICBleWVsb3NzOiBDT0xVTU4uVTgsXG4gICAgICBldGh0cnVlOiBDT0xVTU4uVTgsXG4gICAgICBzdG9ybXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNvbGRwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZGFya3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICB3aW50ZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3ByaW5ncG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1lcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmYWxscG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZvcmdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGZpeGZvcmdlYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIG1hc3RlcnNtaXRoOiBDT0xVTU4uSTgsXG4gICAgICByZXNvdXJjZXM6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9oZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9kaXNoZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIG5vYmFkZXZlbnRzOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmU6IENPTFVNTi5VOCxcbiAgICAgIHNoYXR0ZXJlZHNvdWw6IENPTFVNTi5VOCxcbiAgICAgIGxlcGVyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3JlYzogQ09MVU1OLlU4LFxuICAgICAgcGlsbGFnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBwYXRyb2xib251czogQ09MVU1OLkk4LFxuICAgICAgY2FzdGxlZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzaWVnZWJvbnVzOiBDT0xVTU4uSTE2LFxuICAgICAgaW5jcHJvdmRlZjogQ09MVU1OLlU4LFxuICAgICAgc3VwcGx5Ym9udXM6IENPTFVNTi5VOCxcbiAgICAgIGluY3VucmVzdDogQ09MVU1OLkkxNixcbiAgICAgIHBvcGtpbGw6IENPTFVNTi5VMTYsXG4gICAgICByZXNlYXJjaGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJpbmdyZXM6IENPTFVNTi5JOCxcbiAgICAgIGRvdXNlOiBDT0xVTU4uVTgsXG4gICAgICBhZGVwdHNhY3I6IENPTFVNTi5VOCxcbiAgICAgIGNyb3NzYnJlZWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFrZXBlYXJsczogQ09MVU1OLlU4LFxuICAgICAgdm9pZHN1bTogQ09MVU1OLlU4LFxuICAgICAgaGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZWxlZ2lzdDogQ09MVU1OLlU4LFxuICAgICAgc2hhcGVjaGFuZ2U6IENPTFVNTi5VMTYsXG4gICAgICBmaXJzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2Vjb25kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBsYW5kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB3YXRlcnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgZm9yZXN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBwbGFpbnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgeHBzaGFwZTogQ09MVU1OLlU4LFxuICAgICAgbmFtZXR5cGU6IENPTFVNTi5VOCxcbiAgICAgIC8vc3VtbW9uOiBDT0xVTU4uSTE2LFxuICAgICAgLy9uX3N1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0xOiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjIwOiBDT0xVTU4uSTE2LFxuICAgICAgYmxvb2R2ZW5nZWFuY2U6IENPTFVNTi5VOCxcbiAgICAgIGJyaW5nZXJvZmZvcnR1bmU6IENPTFVNTi5JOCxcbiAgICAgIHJlYWxtMTogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0zOiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW00OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0xZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTJkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtM2Q2OiBDT0xVTU4uSTE2LFxuICAgICAgYmF0c3RhcnRzdW00ZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTVkNjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW02ZDY6IENPTFVNTi5VMTYsXG4gICAgICB0dXJtb2lsc3VtbW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhmaXJlOiBDT0xVTU4uVTgsXG4gICAgICB1d3JlZ2VuOiBDT0xVTU4uVTgsXG4gICAgICBzaHJpbmtocDogQ09MVU1OLlU4LFxuICAgICAgZ3Jvd2hwOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGluZ2FmZjogQ09MVU1OLlUzMixcbiAgICAgIGZpeGVkcmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGxhbWlhbG9yZDogQ09MVU1OLlU4LFxuICAgICAgcHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIGRyZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBtdW1taWZ5OiBDT0xVTU4uVTE2LFxuICAgICAgb25lYmF0dGxlc3BlbGw6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhaXJhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICB3YXRlcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGVhcnRoYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgYXN0cmFsYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0RjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEE6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RXOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0RTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFM6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3REOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0TjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEFMTDogQ09MVU1OLkk4LFxuICAgICAgZXllczogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlZWF0ZXI6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbnNraW46IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aXRlbTogQ09MVU1OLlU4LFxuICAgICAgYmF0dGxlc3VtNTogQ09MVU1OLlUxNixcbiAgICAgIGFjaWRzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIHByb3BoZXRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGhvcnJvcjogQ09MVU1OLlU4LFxuICAgICAgbGF0ZWhlcm86IENPTFVNTi5VOCxcbiAgICAgIHV3ZGFtYWdlOiBDT0xVTU4uVTgsXG4gICAgICBsYW5kZGFtYWdlOiBDT0xVTU4uVTgsXG4gICAgICBycGNvc3Q6IENPTFVNTi5VMzIsXG4gICAgICByYW5kNTogQ09MVU1OLlU4LFxuICAgICAgbmJyNTogQ09MVU1OLlU4LFxuICAgICAgbWFzazU6IENPTFVNTi5VMTYsXG4gICAgICByYW5kNjogQ09MVU1OLlU4LFxuICAgICAgbmJyNjogQ09MVU1OLlU4LFxuICAgICAgbWFzazY6IENPTFVNTi5VMTYsXG4gICAgICBtdW1taWZpY2F0aW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZGlzZWFzZXJlczogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VvbmtpbGw6IENPTFVNTi5VOCxcbiAgICAgIHJhaXNlc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBzZW5kbGVzc2VyaG9ycm9ybXVsdDogQ09MVU1OLlU4LFxuICAgICAgaW5jb3Jwb3JhdGU6IENPTFVNTi5VOCxcbiAgICAgIGJsZXNzYmVyczogQ09MVU1OLlU4LFxuICAgICAgY3Vyc2VhdHRhY2tlcjogQ09MVU1OLlU4LFxuICAgICAgdXdoZWF0OiBDT0xVTU4uVTgsXG4gICAgICBzbG90aHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICBob3Jyb3JkZXNlcnRlcjogQ09MVU1OLlU4LFxuICAgICAgc29yY2VyeXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBvbGRlcjogQ09MVU1OLkk4LFxuICAgICAgZGlzYmVsaWV2ZTogQ09MVU1OLlU4LFxuICAgICAgZmlyZXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgbmF0dXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGJlYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGhvcnNldGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICByZWluY2FybmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICB3b2xmdGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBib2FydGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBzbGVlcGF1cmE6IENPTFVNTi5VOCxcbiAgICAgIHNuYWtldGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBhcHBldGl0ZTogQ09MVU1OLkk4LFxuICAgICAgdGVtcGxldHJhaW5lcjogQ09MVU1OLlU4LFxuICAgICAgaW5mZXJub3JldDogQ09MVU1OLlU4LFxuICAgICAga29reXRvc3JldDogQ09MVU1OLlU4LFxuICAgICAgYWRkcmFuZG9tYWdlOiBDT0xVTU4uVTE2LFxuICAgICAgdW5zdXJyOiBDT0xVTU4uVTgsXG4gICAgICBzcGVjaWFsbG9vazogQ09MVU1OLlU4LFxuICAgICAgYnVncmVmb3JtOiBDT0xVTU4uVTgsXG4gICAgICBvbmlzdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHN1bmF3ZTogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRhZmY6IENPTFVNTi5VOCxcbiAgICAgIGl2eWxvcmQ6IENPTFVNTi5VOCxcbiAgICAgIHRyaXBsZWdvZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kbWFnOiBDT0xVTU4uVTgsXG4gICAgICBmb3J0a2lsbDogQ09MVU1OLlU4LFxuICAgICAgdGhyb25la2lsbDogQ09MVU1OLlU4LFxuICAgICAgZGlnZXN0OiBDT0xVTU4uVTgsXG4gICAgICBpbmRlcG1vdmU6IENPTFVNTi5VOCxcbiAgICAgIGVudGFuZ2xlOiBDT0xVTU4uVTgsXG4gICAgICBhbGNoZW15OiBDT0xVTU4uVTgsXG4gICAgICB3b3VuZGZlbmQ6IENPTFVNTi5VOCxcbiAgICAgIGZhbHNlYXJteTogQ09MVU1OLkk4LFxuICAgICAgLy9zdW1tb241OiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXI6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHBhcmFseXplOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2Vjb25zdHJ1Y3Q6IENPTFVNTi5VOCxcbiAgICAgIGd1YXJkaWFuc3Bpcml0bW9kaWZpZXI6IENPTFVNTi5JOCxcbiAgICAgIGljZWZvcmdpbmc6IENPTFVNTi5VOCxcbiAgICAgIGNsb2Nrd29ya2xvcmQ6IENPTFVNTi5VOCxcbiAgICAgIG1pbnNpemVsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIGlyb252dWw6IENPTFVNTi5VOCxcbiAgICAgIGhlYXRoZW5zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHBvd2Vyb2ZkZWF0aDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtdGltZTogQ09MVU1OLkk4LFxuICAgICAgdHdpY2Vib3JuOiBDT0xVTU4uVTE2LFxuICAgICAgdG1wYXN0cmFsZ2VtczogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRoZXJvYWI6IENPTFVNTi5VOCxcbiAgICAgIHV3ZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgc2FsdHZ1bDogQ09MVU1OLlU4LFxuICAgICAgbGFuZGVuYzogQ09MVU1OLlU4LFxuICAgICAgcGxhZ3VlZG9jdG9yOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWx1Y2tzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGZhcnRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcm1hcms6IENPTFVNTi5VOCxcbiAgICAgIGFsbHJldDogQ09MVU1OLlU4LFxuICAgICAgYWNpZGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgYmVja29uOiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXJib251czogQ09MVU1OLlU4LFxuICAgICAgY2FyY2Fzc2NvbGxlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgbWluZGNvbGxhcjogQ09MVU1OLlU4LFxuICAgICAgbW91bnRhaW5yZWM6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBlbmNocmViYXRlNTA6IENPTFVNTi5VOCxcbiAgICAgIC8vc3VtbW9uMTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmRvbXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmlmeTogQ09MVU1OLlU4LFxuICAgICAgLy9qdXN0IGEgY29weSBvZiByZWFuaW1hdG9yIDJcbiAgICAgIC8vJ3JlYW5pbWF0b3IuMSc6IENPTFVNTi5VOCxcbiAgICAgIGRlZmVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTFkMzogQ09MVU1OLlUxNixcbiAgICAgIGVuY2hyZWJhdGUxMDogQ09MVU1OLlU4LFxuICAgICAgdW5keWluZzogQ09MVU1OLlU4LFxuICAgICAgbW9yYWxlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHVuY3VyYWJsZWFmZmxpY3Rpb246IENPTFVNTi5VMzIsXG4gICAgICB3aW50ZXJzdW1tb24xZDM6IENPTFVNTi5VMTYsXG4gICAgICBzdHlnaWFuZ3VpZGU6IENPTFVNTi5VOCxcbiAgICAgIHNtYXJ0bW91bnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlZm9ybWluZ2ZsZXNoOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyb2Z0aGVmbG9vZDogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlc3RpdGNoZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlY29uc3RydWN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBub2ZyaWRlcnM6IENPTFVNTi5VOCxcbiAgICAgIGNvcmlkZXJtbnI6IENPTFVNTi5VMTYsXG4gICAgICBob2x5Y29zdDogQ09MVU1OLlU4LFxuICAgICAgYW5pbWF0ZW1ucjogQ09MVU1OLlUxNixcbiAgICAgIGxpY2g6IENPTFVNTi5VMTYsXG4gICAgICBlcmFzdGFydGFnZWluY3JlYXNlOiBDT0xVTU4uVTE2LFxuICAgICAgbW9yZW9yZGVyOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlZ3Jvd3RoOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlcHJvZDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWhlYXQ6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVsdWNrOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlbWFnaWM6IENPTFVNTi5JOCxcbiAgICAgIG5vZm1vdW50czogQ09MVU1OLlU4LFxuICAgICAgZmFsc2VkYW1hZ2VyZWNvdmVyeTogQ09MVU1OLlU4LFxuICAgICAgdXdwYXRoYm9vc3Q6IENPTFVNTi5JOCxcbiAgICAgIHJhbmRvbWl0ZW1zOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhzbGltZWV4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRocG9pc29uZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhzaG9ja2V4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRyYXdzaXplOiBDT0xVTU4uSTgsXG4gICAgICBwZXRyaWZpY2F0aW9uaW1tdW5lOiBDT0xVTU4uVTgsXG4gICAgICBzY2Fyc291bHM6IENPTFVNTi5VOCxcbiAgICAgIHNwaWtlYmFyYnM6IENPTFVNTi5VOCxcbiAgICAgIHByZXRlbmRlcnN0YXJ0c2l0ZTogQ09MVU1OLlUxNixcbiAgICAgIG9mZnNjcmlwdHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICB1bm1vdW50ZWRzcHI6IENPTFVNTi5VMzIsXG4gICAgICBleGhhdXN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudGVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJvdzogQ09MVU1OLkJPT0wsXG4gICAgICBib2R5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZvb3Q6IENPTFVNTi5CT09MLFxuICAgICAgY3Jvd25vbmx5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGhvbHk6IENPTFVNTi5CT09MLFxuICAgICAgaW5xdWlzaXRvcjogQ09MVU1OLkJPT0wsXG4gICAgICBpbmFuaW1hdGU6IENPTFVNTi5CT09MLFxuICAgICAgdW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3RvbmViZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBhbmltYWw6IENPTFVNTi5CT09MLFxuICAgICAgY29sZGJsb29kOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZlbWFsZTogQ09MVU1OLkJPT0wsXG4gICAgICBmb3Jlc3RzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGFpbnN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhc3Rlc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgc3dhbXBzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBhcXVhdGljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBwb29yYW1waGliaWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZsb2F0OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZseWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdG9ybWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB0ZWxlcG9ydDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vYmlsZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JpdmVycGFzczogQ09MVU1OLkJPT0wsXG4gICAgICBpbGx1c2lvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHk6IENPTFVNTi5CT09MLFxuICAgICAgYXNzYXNzaW46IENPTFVNTi5CT09MLFxuICAgICAgaGVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkb21pbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBub2hlYWw6IENPTFVNTi5CT09MLFxuICAgICAgbmVlZG5vdGVhdDogQ09MVU1OLkJPT0wsXG4gICAgICB1bmRpc2NpcGxpbmVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXNocmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsdW50cmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBpZXJjZXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibGluZDogQ09MVU1OLkJPT0wsXG4gICAgICBwZXRyaWZ5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGV0aGVyZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlYXRoY3Vyc2U6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmFtcHN3YWxsb3c6IENPTFVNTi5CT09MLFxuICAgICAgdGF4Y29sbGVjdG9yOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWluaW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuaXF1ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzY2FsZXdhbGxzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWluczogQ09MVU1OLkJPT0wsXG4gICAgICBoZWF0cmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRyZWM6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkY2hhb3M6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZGVhdGg6IENPTFVNTi5CT09MLFxuICAgICAgYnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHV3YnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZG9yZGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGdyb3d0aDogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRkb206IENPTFVNTi5CT09MLFxuICAgICAgZHJha2U6IENPTFVNTi5CT09MLFxuICAgICAgdGhlZnRvZnRoZXN1bmF3ZTogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFnb25sb3JkOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbmR2ZXNzZWw6IENPTFVNTi5CT09MLFxuICAgICAgZWxlbWVudHJhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzdHJhbGZldHRlcnM6IENPTFVNTi5CT09MLFxuICAgICAgY29tYmF0Y2FzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpc2luZ2xlcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vd2lzaDogQ09MVU1OLkJPT0wsXG4gICAgICBtYXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcGlyaXRzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBvd25ibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBpbnZpc2libGU6IENPTFVNTi5CT09MLFxuICAgICAgc3BlbGxzaW5nZXI6IENPTFVNTi5CT09MLFxuICAgICAgbWFnaWNzdHVkeTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmlwbGUzbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHllYXJ0dXJuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVudGVsZXBvcnRhYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlYW5pbXByaWVzdDogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVuaW1tdW5pdHk6IENPTFVNTi5CT09MLFxuICAgICAgc2luZ2xlYmF0dGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlc2VhcmNod2l0aG91dG1hZ2ljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9jb21wZXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFkdmVudHVyZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsZWFuc2hhcGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVxbGFiOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcXRlbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICBob3Jyb3JtYXJrZWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhc2hhaDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2F5YXphZDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2FkYWV2YTogQ09MVU1OLkJPT0wsXG4gICAgICBibGVzc2ZseTogQ09MVU1OLkJPT0wsXG4gICAgICBwbGFudDogQ09MVU1OLkJPT0wsXG4gICAgICBjb21zbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbm93bW92ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzd2ltbWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVwaWQ6IENPTFVNTi5CT09MLFxuICAgICAgc2tpcm1pc2hlcjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnNlZW46IENPTFVNTi5CT09MLFxuICAgICAgbm9tb3ZlcGVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdvbGY6IENPTFVNTi5CT09MLFxuICAgICAgZHVuZ2VvbjogQ09MVU1OLkJPT0wsXG4gICAgICBhYm9sZXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGxvY2Fsc3VuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRtcGZpcmVnZW1zOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlZmlsZXI6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRlZGJlc2VyazogQ09MVU1OLkJPT0wsXG4gICAgICBsYW5jZW9rOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbnByaXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBocG92ZXJmbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIGluZGVwc3RheTogQ09MVU1OLkJPT0wsXG4gICAgICBwb2x5aW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vcmFuZ2U6IENPTFVNTi5CT09MLFxuICAgICAgbm9ob2Y6IENPTFVNTi5CT09MLFxuICAgICAgYXV0b2JsZXNzZWQ6IENPTFVNTi5CT09MLFxuICAgICAgYWxtb3N0dW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRydWVzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBtb2JpbGVhcmNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0Zm9ybTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNtYXN0ZXI6IENPTFVNTi5CT09MLFxuICAgICAgdGlnaHRyZWluOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXJtYW46IENPTFVNTi5CT09MLFxuICAgICAgZGl2aW5lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbm9mYWxsZG1nOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZpcmVlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpcmVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgd2F0ZXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVhcnRoZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBwb3BzcHk6IENPTFVNTi5CT09MLFxuICAgICAgY2FwaXRhbGhvbWU6IENPTFVNTi5CT09MLFxuICAgICAgY2x1bXN5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlZ2Fpbm1vdW50OiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vYmFyZGluZzogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGlzY29tOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vdGhyb3dvZmY6IENPTFVNTi5CT09MLFxuICAgICAgYmlyZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWNheXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBjdWJtb3RoZXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2xhbW91cjogQ09MVU1OLkJPT0wsXG4gICAgICBnZW1wcm9kOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgZml4ZWRuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgIH0sXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuXG4gICcuLi8uLi9nYW1lZGF0YS9NYWdpY1NpdGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNTaXRlJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZG9tY29uZmxpY3QuMScsJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL01lcmNlbmFyeS5jc3YnOiB7XG4gICAgbmFtZTogJ01lcmNlbmFyeScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FmZmxpY3Rpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnQWZmbGljdGlvbicsXG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYW5vbl9wcm92aW5jZV9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdBbm9uUHJvdmluY2VFdmVudCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXJtb3JzLmNzdic6IHtcbiAgICBuYW1lOiAnQXJtb3InLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVfa2V5cy5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUtleScsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5QXJtb3InLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfc3BlbGwuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVNwZWxsJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3dlYXBvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5V2VhcG9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18xX3R5cGVzLmNzdic6IHtcbiAgICAvLyBUT0RPIC0gZ290IHNvbWUgYmlnIGJvaXMgaW4gaGVyZS5cbiAgICBuYW1lOiAnQnVmZkJpdDEnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18yX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnQnVmZkJpdDInLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX2luZm8uY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ1NwZWxsRWZmZWN0SW5mbycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdic6IHtcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIG5hbWU6ICdFZmZlY3RTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c193ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0V2VhcG9uJyxcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VuY2hhbnRtZW50cy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnRW5jaGFudG1lbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ldmVudHMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFnaWNfcGF0aHMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnVGVycmFpblR5cGVCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tb25zdGVyX3RhZ3MuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hbWV0eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdOYW1lVHlwZScsXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYXRpb25zLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvb3RoZXJfcGxhbmVzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdPdGhlclBsYW5lJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcm90ZWN0aW9uc19ieV9hcm1vci5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJvdGVjdGlvbkJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3JlYWxtcy5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUmVhbG0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zaXRlX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgbmFtZTogJ1NpdGVUZXJyYWluVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfZGFtYWdlX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTcGVjaWFsRGFtYWdlVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfdW5pcXVlX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsVW5pcXVlU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbCcsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG59XG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUzogUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiAnJyxcbiAga2V5OiAnJyxcbiAgaWdub3JlRmllbGRzOiBuZXcgU2V0KCksXG4gIG92ZXJyaWRlczoge30sXG4gIGtub3duRmllbGRzOiB7fSxcbiAgZXh0cmFGaWVsZHM6IHt9LFxuICBzZXBhcmF0b3I6ICdcXHQnLCAvLyBzdXJwcmlzZSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUoXG4gIHJhdzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XG4pOiBUYWJsZSB7XG4gIGNvbnN0IF9vcHRzID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiBfb3B0cy5uYW1lLFxuICAgIGtleTogX29wdHMua2V5LFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBjb2x1bW5zOiBbXSxcbiAgICBmaWVsZHM6IFtdLFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgb3ZlcnJpZGVzOiBfb3B0cy5vdmVycmlkZXMsXG4gIH07XG4gIGlmICghc2NoZW1hQXJncy5uYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ25hbWUgaXMgcmVxdXJpZWQnKTtcbiAgaWYgKCFzY2hlbWFBcmdzLmtleSkgdGhyb3cgbmV3IEVycm9yKCdrZXkgaXMgcmVxdXJpZWQnKTtcblxuICBpZiAocmF3LmluZGV4T2YoJ1xcMCcpICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCd1aCBvaCcpXG5cbiAgY29uc3QgW3Jhd0ZpZWxkcywgLi4ucmF3RGF0YV0gPSByYXdcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KF9vcHRzLnNlcGFyYXRvcikpO1xuXG4gIGNvbnN0IGhDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKCFmKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gXCIke2Z9XCIgaXMgYSBkdXBsaWNhdGUgZmllbGQgbmFtZWApO1xuICAgICAgY29uc3QgbiA9IGhDb3VudC5nZXQoZikhXG4gICAgICByYXdGaWVsZHNbaV0gPSBgJHtmfS4ke259YDtcbiAgICB9IGVsc2Uge1xuICAgICAgaENvdW50LnNldChmLCAxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByYXdDb2x1bW5zOiBDb2x1bW5BcmdzW10gPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIG5hbWVdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBsZXQgYzogbnVsbCB8IENvbHVtbkFyZ3MgPSBudWxsO1xuICAgIHNjaGVtYUFyZ3MucmF3RmllbGRzW25hbWVdID0gaW5kZXg7XG4gICAgaWYgKF9vcHRzLmlnbm9yZUZpZWxkcz8uaGFzKG5hbWUpKSBjb250aW51ZTtcbiAgICBpZiAoX29wdHMua25vd25GaWVsZHNbbmFtZV0pIHtcbiAgICAgIGMgPSBhcmdzRnJvbVR5cGUoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIF9vcHRzLmtub3duRmllbGRzW25hbWVdLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYyA9IGFyZ3NGcm9tVGV4dChcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICAgICAgcmF3RGF0YSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYEdPT0IgSU5URVJDRVBURUQgSU4gJHtzY2hlbWFBcmdzLm5hbWV9OiBcXHgxYlszMW0ke2luZGV4fToke25hbWV9XFx4MWJbMG1gLFxuICAgICAgICAgICAgZXhcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZXhcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgcmF3Q29sdW1ucy5wdXNoKGMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zPy5leHRyYUZpZWxkcykge1xuICAgIGNvbnN0IGJpID0gT2JqZWN0LnZhbHVlcyhzY2hlbWFBcmdzLnJhd0ZpZWxkcykubGVuZ3RoOyAvLyBobW1tbVxuICAgIHJhd0NvbHVtbnMucHVzaCguLi5PYmplY3QuZW50cmllcyhvcHRpb25zLmV4dHJhRmllbGRzKS5tYXAoXG4gICAgICAoW25hbWUsIGNyZWF0ZUNvbHVtbl06IFtzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGRdLCBlaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV07XG4gICAgICAgIC8vY29uc29sZS5sb2coZWksIHNjaGVtYUFyZ3MucmF3RmllbGRzKVxuICAgICAgICBjb25zdCBpbmRleCA9IGJpICsgZWk7XG4gICAgICAgIGNvbnN0IGNhID0gY3JlYXRlQ29sdW1uKGluZGV4LCBzY2hlbWFBcmdzLCBuYW1lLCBvdmVycmlkZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNhLmluZGV4ICE9PSBpbmRleCkgdGhyb3cgbmV3IEVycm9yKCd3aXNlZ3V5IHBpY2tlZCBoaXMgb3duIGluZGV4Jyk7XG4gICAgICAgICAgaWYgKGNhLm5hbWUgIT09IG5hbWUpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBuYW1lJyk7XG4gICAgICAgICAgaWYgKGNhLnR5cGUgPT09IENPTFVNTi5CT09MKSB7XG4gICAgICAgICAgICBpZiAoY2EuYml0ICE9PSBzY2hlbWFBcmdzLmZsYWdzVXNlZCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIGJhYnkgaWRpb3QnKTtcbiAgICAgICAgICAgIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNhLCB7IGluZGV4LCBvdmVycmlkZSwgbmFtZSwgfSlcbiAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2E7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgY29sQXJncyBvZiByYXdDb2x1bW5zKSB7XG4gICAgY29uc3QgY29sID0gZnJvbUFyZ3MoY29sQXJncyk7XG4gICAgc2NoZW1hQXJncy5jb2x1bW5zLnB1c2goY29sKTtcbiAgICBzY2hlbWFBcmdzLmZpZWxkcy5wdXNoKGNvbC5uYW1lKTtcbiAgfVxuXG4gIGlmIChzY2hlbWFBcmdzLmtleSAhPT0gJ19fcm93SWQnICYmICFzY2hlbWFBcmdzLmZpZWxkcy5pbmNsdWRlcyhzY2hlbWFBcmdzLmtleSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBmaWVsZHMgaXMgbWlzc2luZyB0aGUgc3VwcGxpZWQga2V5IFwiJHtzY2hlbWFBcmdzLmtleX1cImApO1xuXG4gIGZvciAoY29uc3QgY29sIG9mIHNjaGVtYUFyZ3MuY29sdW1ucykge1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdW2NvbC5pbmRleF0sXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXSxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKGRhdGEsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VBbGwoZGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+Pikge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVmcykubWFwKChbcGF0aCwgb3B0aW9uc10pID0+IHJlYWRDU1YocGF0aCwgb3B0aW9ucykpXG4gICk7XG59XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgUGFyc2VTY2hlbWFPcHRpb25zLCBwYXJzZUFsbCwgcmVhZENTViB9IGZyb20gJy4vcGFyc2UtY3N2JztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBqb2luRHVtcGVkIH0gZnJvbSAnLi9qb2luLXRhYmxlcyc7XG5cbmNvbnN0IHdpZHRoID0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucztcbmNvbnN0IFtmaWxlLCAuLi5maWVsZHNdID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuXG5mdW5jdGlvbiBmaW5kRGVmIChuYW1lOiBzdHJpbmcpOiBbc3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5dIHtcbiAgaWYgKGNzdkRlZnNbbmFtZV0pIHJldHVybiBbbmFtZSwgY3N2RGVmc1tuYW1lXV07XG4gIGZvciAoY29uc3QgayBpbiBjc3ZEZWZzKSB7XG4gICAgY29uc3QgZCA9IGNzdkRlZnNba107XG4gICAgaWYgKGQubmFtZSA9PT0gbmFtZSkgcmV0dXJuIFtrLCBkXTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYG5vIGNzdiBkZWZpbmVkIGZvciBcIiR7bmFtZX1cImApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wT25lKGtleTogc3RyaW5nKSB7XG4gIGNvbnN0IHRhYmxlID0gYXdhaXQgcmVhZENTViguLi5maW5kRGVmKGtleSkpO1xuICBjb21wYXJlRHVtcHModGFibGUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wQWxsICgpIHtcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIC8vIEpPSU5TXG4gIC8vam9pbkR1bXBlZCh0YWJsZXMpO1xuICBjb25zdCBkZXN0ID0gJy4vZGF0YS9kYi4zMC5iaW4nXG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXModGFibGVzKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGRlc3QsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gIGNvbnNvbGUubG9nKGB3cm90ZSAke2Jsb2Iuc2l6ZX0gYnl0ZXMgdG8gJHtkZXN0fWApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb21wYXJlRHVtcHModDogVGFibGUpIHtcbiAgY29uc3QgbWF4TiA9IHQucm93cy5sZW5ndGggLSAzMFxuICBsZXQgbjogbnVtYmVyO1xuICBsZXQgcDogYW55ID0gdW5kZWZpbmVkO1xuICBpZiAoZmllbGRzWzBdID09PSAnRklMVEVSJykge1xuICAgIG4gPSAwOyAvLyB3aWxsIGJlIGluZ29yZWRcbiAgICBmaWVsZHMuc3BsaWNlKDAsIDEsICdpZCcsICduYW1lJyk7XG4gICAgcCA9IChyOiBhbnkpID0+IGZpZWxkcy5zbGljZSgyKS5zb21lKGYgPT4gcltmXSk7XG4gIH0gZWxzZSBpZiAoZmllbGRzWzFdID09PSAnUk9XJyAmJiBmaWVsZHNbMl0pIHtcbiAgICBuID0gTnVtYmVyKGZpZWxkc1syXSkgLSAxNTtcbiAgICBjb25zb2xlLmxvZyhgZW5zdXJlIHJvdyAke2ZpZWxkc1syXX0gaXMgdmlzaWJsZSAoJHtufSlgKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB0aHJvdyBuZXcgRXJyb3IoJ1JPVyBtdXN0IGJlIE5VTUJFUiEhISEnKTtcbiAgfSBlbHNlIHtcbiAgICBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4TilcbiAgfVxuICBuID0gTWF0aC5taW4obWF4TiwgTWF0aC5tYXgoMCwgbikpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gKGZpZWxkcy5sZW5ndGggPyAoZmllbGRzWzBdID09PSAnQUxMJyA/IHQuc2NoZW1hLmZpZWxkcyA6IGZpZWxkcykgOlxuICAgdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDEwKSkgYXMgc3RyaW5nW11cbiAgZHVtcFRvQ29uc29sZSh0LCBuLCBtLCBmLCAnQkVGT1JFJywgcCk7XG4gIC8qXG4gIGlmICgxICsgMSA9PT0gMikgcmV0dXJuOyAvLyBUT0RPIC0gd2Ugbm90IHdvcnJpZWQgYWJvdXQgdGhlIG90aGVyIHNpZGUgeWV0XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXMoW3RdKTtcbiAgY29uc29sZS5sb2coYG1hZGUgJHtibG9iLnNpemV9IGJ5dGUgYmxvYmApO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgLy8oZ2xvYmFsVGhpcy5fUk9XUyA/Pz0ge30pW3Quc2NoZW1hLm5hbWVdID0gdC5yb3dzO1xuICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBkdW1wVG9Db25zb2xlKHVbdC5zY2hlbWEubmFtZV0sIG4sIG0sIGYsICdBRlRFUicsIHApO1xuICAvL2F3YWl0IHdyaXRlRmlsZSgnLi90bXAuYmluJywgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgKi9cbn1cblxuZnVuY3Rpb24gZHVtcFRvQ29uc29sZShcbiAgdDogVGFibGUsXG4gIG46IG51bWJlcixcbiAgbTogbnVtYmVyLFxuICBmOiBzdHJpbmdbXSxcbiAgaDogc3RyaW5nLFxuICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbikge1xuICBjb25zb2xlLmxvZyhgXFxuICAgICAke2h9OmApO1xuICB0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICBjb25zdCByb3dzID0gdC5wcmludCh3aWR0aCwgZiwgbiwgbSwgcCk7XG4gIGlmIChyb3dzKSBmb3IgKGNvbnN0IHIgb2Ygcm93cykgY29uc29sZS50YWJsZShbcl0pO1xuICBjb25zb2xlLmxvZyhgICAgIC8ke2h9XFxuXFxuYClcbn1cblxuXG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIGR1bXBPbmUoZmlsZSk7XG5lbHNlIGR1bXBBbGwoKTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsSUFBTSxnQkFBZ0IsSUFBSSxZQUFZO0FBQ3RDLElBQU0sZ0JBQWdCLElBQUksWUFBWTtBQUkvQixTQUFTLGNBQWUsR0FBVyxNQUFtQixJQUFJLEdBQUc7QUFDbEUsTUFBSSxFQUFFLFFBQVEsSUFBSSxNQUFNLElBQUk7QUFDMUIsVUFBTUEsS0FBSSxFQUFFLFFBQVEsSUFBSTtBQUN4QixZQUFRLE1BQU0sR0FBR0EsRUFBQyxpQkFBaUIsRUFBRSxNQUFNQSxLQUFJLElBQUlBLEtBQUksRUFBRSxDQUFDLEtBQUs7QUFDL0QsVUFBTSxJQUFJLE1BQU0sVUFBVTtBQUFBLEVBQzVCO0FBQ0EsUUFBTSxRQUFRLGNBQWMsT0FBTyxJQUFJLElBQUk7QUFDM0MsTUFBSSxNQUFNO0FBQ1IsU0FBSyxJQUFJLE9BQU8sQ0FBQztBQUNqQixXQUFPLE1BQU07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QUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsYUFBYTtBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUVBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FB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QUNwQyxRQUFNLE9BQU8sRUFBRSxLQUFLLFNBQVM7QUFDN0IsTUFBSTtBQUNKLE1BQUksSUFBUztBQUNiLE1BQUksT0FBTyxDQUFDLE1BQU0sVUFBVTtBQUMxQixRQUFJO0FBQ0osV0FBTyxPQUFPLEdBQUcsR0FBRyxNQUFNLE1BQU07QUFDaEMsUUFBSSxDQUFDLE1BQVcsT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUFDLE9BQUssRUFBRUEsRUFBQyxDQUFDO0FBQUEsRUFDaEQsV0FBVyxPQUFPLENBQUMsTUFBTSxTQUFTLE9BQU8sQ0FBQyxHQUFHO0FBQzNDLFFBQUksT0FBTyxPQUFPLENBQUMsQ0FBQyxJQUFJO0FBQ3hCLFlBQVEsSUFBSSxjQUFjLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQUc7QUFDdkQsUUFBSSxPQUFPLE1BQU0sQ0FBQztBQUFHLFlBQU0sSUFBSSxNQUFNLHdCQUF3QjtBQUFBLEVBQy9ELE9BQU87QUFDTCxRQUFJLEtBQUssTUFBTSxLQUFLLE9BQU8sSUFBSSxJQUFJO0FBQUEsRUFDckM7QUFDQSxNQUFJLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNqQyxRQUFNLElBQUksSUFBSTtBQUNkLFFBQU0sSUFBSyxPQUFPLFNBQVUsT0FBTyxDQUFDLE1BQU0sUUFBUSxFQUFFLE9BQU8sU0FBUyxTQUNuRSxFQUFFLE9BQU8sT0FBTyxNQUFNLEdBQUcsRUFBRTtBQUM1QixnQkFBYyxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsQ0FBQztBQWF2QztBQUVBLFNBQVMsY0FDUCxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0EsR0FDQTtBQUNBLFVBQVEsSUFBSTtBQUFBLE9BQVUsQ0FBQyxHQUFHO0FBQzFCLElBQUUsT0FBTyxNQUFNLEtBQUs7QUFDcEIsVUFBUSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRztBQUNyQyxRQUFNLE9BQU8sRUFBRSxNQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUN0QyxNQUFJO0FBQU0sZUFBVyxLQUFLO0FBQU0sY0FBUSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2pELFVBQVEsSUFBSSxRQUFRLENBQUM7QUFBQTtBQUFBLENBQU07QUFDN0I7QUFJQSxRQUFRLElBQUksUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRXBDLElBQUk7QUFBTSxVQUFRLElBQUk7QUFBQTtBQUNqQixVQUFROyIsCiAgIm5hbWVzIjogWyJpIiwgIndpZHRoIiwgImZpZWxkcyIsICJ3aWR0aCIsICJ3aWR0aCIsICJmaWVsZHMiLCAiZiJdCn0K
