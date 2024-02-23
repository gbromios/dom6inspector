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
    n >>= 64n;
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
  columnsByName;
  fixedWidth;
  // total bytes used by numbers + flags
  flagFields;
  stringFields;
  bigFields;
  constructor({ columns, name, flagsUsed }) {
    this.name = name;
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
    const bytes = new Uint8Array(buffer);
    [name, read] = bytesToString(i, bytes);
    i += read;
    const args = {
      name,
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
      row[c.name] = v;
      const w = globalThis._ROWS[this.name][__rowId][c.name];
      if (w !== v) {
        if (!Array.isArray(w) || w.some((n, i2) => n !== v[i2])) {
          console.error(`XXXXX ${this.name}[${__rowId}][${c.name}] ${w} -> ${v}`);
        }
      } else {
      }
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
  }
  get name() {
    return `[TABLE:${this.schema.name}]`;
  }
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
  print(width2 = 80, fields2 = null, n = null, m = null) {
    const [head, tail] = tableDeco(this.name, width2, 18);
    const rows = n === null ? this.rows : m === null ? this.rows.slice(0, n) : this.rows.slice(n, m);
    const [pRows, pFields] = fields2 ? [rows.map((r) => this.schema.printRow(r, fields2)), fields2] : [rows, this.schema.fields];
    console.log(head);
    console.table(pRows, pFields);
    console.log(tail);
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
      "wpn1",
      "wpn2",
      "wpn3",
      "wpn4",
      "wpn5",
      "wpn6",
      "wpn7"
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
      summon: 6 /* I16 */,
      n_summon: 3 /* U8 */,
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
      summon5: 3 /* U8 */,
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
      summon1: 5 /* U16 */,
      randomspell: 3 /* U8 */,
      insanify: 3 /* U8 */,
      "reanimator.1": 3 /* U8 */,
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
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/MagicSites.csv": {
    name: "MagicSite",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/Mercenary.csv": {
    name: "Mercenary",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/afflictions.csv": {
    name: "Affliction",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/anon_province_events.csv": {
    name: "AnonProvinceEvent",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/armors.csv": {
    name: "Armor",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attribute_keys.csv": {
    name: "AttributeKey",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/attributes_by_armor.csv": {
    name: "AttributeByArmor",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_nation.csv": {
    name: "AttributeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_spell.csv": {
    name: "AttributeBySpell",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_weapon.csv": {
    name: "AttributeByWeapon",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/buffs_1_types.csv": {
    // TODO - got some big bois in here.
    name: "BuffBit1",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/buffs_2_types.csv": {
    name: "BuffBit2",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/coast_leader_types_by_nation.csv": {
    name: "CoastLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/coast_troop_types_by_nation.csv": {
    name: "CoastTroopTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/effect_modifier_bits.csv": {
    name: "SpellBit",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/effects_info.csv": {
    name: "SpellEffectInfo",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/effects_spells.csv": {
    name: "EffectSpell",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/effects_weapons.csv": {
    name: "EffectWeapon",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/enchantments.csv": {
    name: "Enchantment",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/events.csv": {
    name: "Event",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/fort_leader_types_by_nation.csv": {
    name: "FortLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/fort_troop_types_by_nation.csv": {
    name: "FortTroopTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/magic_paths.csv": {
    name: "MagicPath",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/map_terrain_types.csv": {
    name: "TerrainTypeBit",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/monster_tags.csv": {
    name: "MonsterTag",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/nametypes.csv": {
    name: "NameType"
  },
  "../../gamedata/nations.csv": {
    name: "Nation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/nonfort_leader_types_by_nation.csv": {
    name: "NonFortLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/nonfort_troop_types_by_nation.csv": {
    name: "NonFortLeaderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/other_planes.csv": {
    name: "OtherPlane",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/pretender_types_by_nation.csv": {
    name: "PretenderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/protections_by_armor.csv": {
    name: "ProtectionByArmor",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/realms.csv": {
    name: "Realm",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/site_terrain_types.csv": {
    name: "SiteTerrainType",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/special_damage_types.csv": {
    name: "SpecialDamageType",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/special_unique_summons.csv": {
    name: "SpecialUniqueSummon",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/spells.csv": {
    name: "Spell",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/terrain_specific_summons.csv": {
    name: "TerrainSpecificSummon",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/unit_effects.csv": {
    name: "UnitEffect",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/unpretender_types_by_nation.csv": {
    name: "UnpretenderTypeByNation",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/weapons.csv": {
    name: "Weapon",
    ignoreFields: /* @__PURE__ */ new Set(["end", "weapon"])
  }
};

// src/cli/parse-csv.ts
import { readFile } from "node:fs/promises";
var _nextAnonSchemaId = 1;
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
    name: _opts.name ?? `Schema_${_nextAnonSchemaId++}`,
    flagsUsed: 0,
    columns: [],
    fields: [],
    rawFields: {},
    overrides: _opts.overrides
  };
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
console.log("ARGS", { file, fields });
if (file) {
  const def = csvDefs[file];
  if (def)
    getDUMPY(await readCSV(file, def));
} else {
  const dest = "./data/db.bin";
  const tables = await parseAll(csvDefs);
  const blob = Table.concatTables(tables);
  await writeFile(dest, blob.stream(), { encoding: null });
  console.log(`wrote ${blob.size} bytes to ${dest}`);
}
async function getDUMPY(t) {
  const n = 700;
  const m = n + 30;
  const f = fields.length ? fields : t.schema.fields.slice(0, 8);
  console.log("\n\n       BEFORE:");
  for (const c of f) {
    console.log(` - ${c} : ${t.schema.columnsByName[c].label}`);
  }
  t.print(width, f, n, m);
  t.schema.print();
  console.log("wait....");
  (globalThis._ROWS ??= {})[t.schema.name] = t.rows;
  await new Promise((r) => setTimeout(r, 1e3));
  const blob = Table.concatTables([t]);
  console.log("\n\n");
  const u = await Table.openBlob(blob);
  console.log("\n\n        AFTER:");
  Object.values(u)[0]?.print(width, f, n, m);
  u.Unit.schema.print(width);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vLi4vbGliL3NyYy9jb2x1bW4udHMiLCAiLi4vLi4vbGliL3NyYy91dGlsLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2NoZW1hLnRzIiwgIi4uLy4uL2xpYi9zcmMvdGFibGUudHMiLCAiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX190ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuY29uc3QgX190ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nKTogVWludDhBcnJheTtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q6IFVpbnQ4QXJyYXksIGk6IG51bWJlcik6IG51bWJlcjtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q/OiBVaW50OEFycmF5LCBpID0gMCkge1xuICBpZiAocy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHtcbiAgICBjb25zdCBpID0gcy5pbmRleE9mKCdcXDAnKTtcbiAgICBjb25zb2xlLmVycm9yKGAke2l9ID0gTlVMTCA/IFwiLi4uJHtzLnNsaWNlKGkgLSAxMCwgaSArIDEwKX0uLi5gKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3dob29wc2llJyk7XG4gIH1cbiAgY29uc3QgYnl0ZXMgPSBfX3RleHRFbmNvZGVyLmVuY29kZShzICsgJ1xcMCcpO1xuICBpZiAoZGVzdCkge1xuICAgIGRlc3Quc2V0KGJ5dGVzLCBpKTtcbiAgICByZXR1cm4gYnl0ZXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBieXRlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb1N0cmluZyhpOiBudW1iZXIsIGE6IFVpbnQ4QXJyYXkpOiBbc3RyaW5nLCBudW1iZXJdIHtcbiAgbGV0IHIgPSAwO1xuICB3aGlsZSAoYVtpICsgcl0gIT09IDApIHsgcisrOyB9XG4gIHJldHVybiBbX190ZXh0RGVjb2Rlci5kZWNvZGUoYS5zbGljZShpLCBpK3IpKSwgciArIDFdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmlnQm95VG9CeXRlcyAobjogYmlnaW50KTogVWludDhBcnJheSB7XG4gIC8vIHRoaXMgaXMgYSBjb29sIGdhbWUgYnV0IGxldHMgaG9wZSBpdCBkb2Vzbid0IHVzZSAxMjcrIGJ5dGUgbnVtYmVyc1xuICBjb25zdCBieXRlcyA9IFswXTtcbiAgaWYgKG4gPCAwbikge1xuICAgIG4gKj0gLTFuO1xuICAgIGJ5dGVzWzBdID0gMTI4O1xuICB9XG5cbiAgd2hpbGUgKG4pIHtcbiAgICBpZiAoYnl0ZXNbMF0gPT09IDI1NSkgdGhyb3cgbmV3IEVycm9yKCdicnVoIHRoYXRzIHRvbyBiaWcnKTtcbiAgICBieXRlc1swXSsrO1xuICAgIGJ5dGVzLnB1c2goTnVtYmVyKG4gJiAyNTVuKSk7XG4gICAgbiA+Pj0gNjRuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCAgICAgICA9IDAsXG4gIFNUUklORyAgICAgICA9IDEsXG4gIEJPT0wgICAgICAgICA9IDIsXG4gIFU4ICAgICAgICAgICA9IDMsXG4gIEk4ICAgICAgICAgICA9IDQsXG4gIFUxNiAgICAgICAgICA9IDUsXG4gIEkxNiAgICAgICAgICA9IDYsXG4gIFUzMiAgICAgICAgICA9IDcsXG4gIEkzMiAgICAgICAgICA9IDgsXG4gIEJJRyAgICAgICAgICA9IDksXG4gIFNUUklOR19BUlJBWSA9IDE3LFxuICBVOF9BUlJBWSAgICAgPSAxOSxcbiAgSThfQVJSQVkgICAgID0gMjAsXG4gIFUxNl9BUlJBWSAgICA9IDIxLFxuICBJMTZfQVJSQVkgICAgPSAyMixcbiAgVTMyX0FSUkFZICAgID0gMjMsXG4gIEkzMl9BUlJBWSAgICA9IDI0LFxuICBCSUdfQVJSQVkgICAgPSAyNSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HX0FSUkFZJyxcbiAgJ1U4X0FSUkFZJyxcbiAgJ0k4X0FSUkFZJyxcbiAgJ1UxNl9BUlJBWScsXG4gICdJMTZfQVJSQVknLFxuICAnVTMyX0FSUkFZJyxcbiAgJ0kzMl9BUlJBWScsXG4gICdCSUdfQVJSQVknLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgfENPTFVNTi5VOF9BUlJBWVxuICB8Q09MVU1OLkk4X0FSUkFZXG4gIHxDT0xVTU4uVTE2X0FSUkFZXG4gIHxDT0xVTU4uSTE2X0FSUkFZXG4gIHxDT0xVTU4uVTMyX0FSUkFZXG4gIHxDT0xVTU4uSTMyX0FSUkFZXG4gIDtcblxuY29uc3QgQ09MVU1OX1dJRFRIOiBSZWNvcmQ8TlVNRVJJQ19DT0xVTU4sIDF8Mnw0PiA9IHtcbiAgW0NPTFVNTi5VOF06IDEsXG4gIFtDT0xVTU4uSThdOiAxLFxuICBbQ09MVU1OLlUxNl06IDIsXG4gIFtDT0xVTU4uSTE2XTogMixcbiAgW0NPTFVNTi5VMzJdOiA0LFxuICBbQ09MVU1OLkkzMl06IDQsXG4gIFtDT0xVTU4uVThfQVJSQVldOiAxLFxuICBbQ09MVU1OLkk4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5VMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLkkxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uVTMyX0FSUkFZXTogNCxcbiAgW0NPTFVNTi5JMzJfQVJSQVldOiA0LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvTnVtZXJpY1R5cGUgKFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXJcbik6IE5VTUVSSUNfQ09MVU1OfG51bGwge1xuICBpZiAobWluIDwgMCkge1xuICAgIC8vIHNvbWUga2luZGEgbmVnYXRpdmU/P1xuICAgIGlmIChtaW4gPj0gLTEyOCAmJiBtYXggPD0gMTI3KSB7XG4gICAgICAvLyBzaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5JODtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMzI3NjggJiYgbWF4IDw9IDMyNzY3KSB7XG4gICAgICAvLyBzaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uSTE2O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0yMTQ3NDgzNjQ4ICYmIG1heCA8PSAyMTQ3NDgzNjQ3KSB7XG4gICAgICAvLyBzaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5JMzI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChtYXggPD0gMjU1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLlU4O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDY1NTM1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5VMTY7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNDI5NDk2NzI5NSkge1xuICAgICAgLy8gdW5zaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5VMzI7XG4gICAgfVxuICB9XG4gIC8vIEdPVE86IEJJR09PT09PT09PQk9PT09PWU9cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bWVyaWNDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgTlVNRVJJQ19DT0xVTU4ge1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5TVFJJTkc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbHVtbjxUID0gYW55LCBSIGV4dGVuZHMgVWludDhBcnJheXxudW1iZXIgPSBhbnk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUW107XG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVDtcbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVFtdLCBudW1iZXJdO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogVCk6IFIsXG4gIHNlcmlhbGl6ZUFycmF5ICh2OiBUW10pOiBSLFxuICB0b1N0cmluZyAodjogc3RyaW5nKTogYW55O1xuICByZWFkb25seSB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICByZWFkb25seSBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgb3JkZXI6IG51bWJlcjtcbiAgcmVhZG9ubHkgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48c3RyaW5nLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihgc2VlbXMgb3ZlcnJpZGUgZm9yICR7bmFtZX0gZG9lcyBub3QgcmV0dXJuIGEgc3RyaW5nYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZyB7XG4gICAgLy8gVE9ETyAtIG5lZWQgdG8gdmVyaWZ5IHRoZXJlIGFyZW4ndCBhbnkgc2luZ2xlIHF1b3Rlcz9cbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmdbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgc3RyaW5ncy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW3N0cmluZ3MsIHJlYWRdXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogc3RyaW5nW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uc3RyaW5nVG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlcltdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/ICggdGhpcy5vdmVycmlkZSh2LCB1LCBhKSApIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXJbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgICAgIG51bWJlcnMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtudW1iZXJzLCByZWFkXTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgICBpZiAodGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2ltIGFycmF5IHRobycpXG4gICAgICByZXR1cm4gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgbnVtYmVyRnJvbVZpZXcgKGk6IG51bWJlciwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSAmIDE1KSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignd2hvbXN0Jyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICB0aGlzLnB1dEJ5dGVzKHYsIDAsIGJ5dGVzKTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBudW1iZXJbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMSArIHRoaXMud2lkdGggKiB2Lmxlbmd0aClcbiAgICBsZXQgaSA9IDE7XG4gICAgZm9yIChjb25zdCBuIG9mIHYpIHtcbiAgICAgIGJ5dGVzWzBdKys7XG4gICAgICB0aGlzLnB1dEJ5dGVzKG4sIGksIGJ5dGVzKTtcbiAgICAgIGkrPXRoaXMud2lkdGg7XG4gICAgfVxuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHByaXZhdGUgcHV0Qnl0ZXModjogbnVtYmVyLCBpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tpICsgb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVlcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzQmlnQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmlzQXJyYXkgPSAodHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuXG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludFtdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnRbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IGJpZ2JvaXM6IGJpZ2ludFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgYmlnYm9pcy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW2JpZ2JvaXMsIHJlYWRdO1xuXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogYmlnaW50W10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uYmlnQm95VG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMgQklHP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuID0gZmFsc2U7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYm9vbGApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbmV2ZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKF9pOiBudW1iZXIsIF9ieXRlczogVWludDhBcnJheSk6IFtuZXZlcltdLCBudW1iZXJdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgLy8gLi4uLml0IGRpZCBub3QuXG4gICAgLy9jb25zb2xlLmxvZyhgUkVBRCBGUk9NICR7aX06IERPRVMgJHtieXRlc1tpXX0gPT09ICR7dGhpcy5mbGFnfWApO1xuICAgIHJldHVybiBbKGJ5dGVzW2ldICYgdGhpcy5mbGFnKSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkoX3Y6IGJvb2xlYW5bXSk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2kgd2lsbCBORVZFUiBiZWNvbWUgQVJSQVknKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIGlmIChhLmlzQXJyYXkgIT09IGIuaXNBcnJheSkgcmV0dXJuIGEuaXNBcnJheSA/IDEgOiAtMVxuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbiAgZGF0YTogc3RyaW5nW11bXSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGU6IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdIGFzIHVuZGVmaW5lZCB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSksXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCAoZmllbGQuYml0ICUgOCk7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIGZpZWxkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UeXBlIChcbiAgbmFtZTogc3RyaW5nLFxuICB0eXBlOiBDT0xVTU4sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4pOiBDb2x1bW5BcmdzIHtcbiAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvdyB5b3UgZ29ubmEgdXNlIGl0IHRoZW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGNvbnN0IGJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgICAgY29uc3QgZmxhZyA9IDEgPDwgKGJpdCAlIDgpO1xuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIGZsYWcsIGJpdCwgb3ZlcnJpZGUgfTtcblxuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAxLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDIsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogNCwgb3ZlcnJpZGV9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGlmIChhcmdzLnR5cGUgJiAxNikgdGhyb3cgbmV3IEVycm9yKCdubyBzdWNoIHRoaW5nIGFzIGEgZmxhZyBhcnJheScpO1xuICAgICAgcmV0dXJuIG5ldyBCb29sQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiBuZXcgTnVtZXJpY0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4gbmV3IEJpZ0NvbHVtbihhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7YXJncy50eXBlfWApO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sdW1uczogQ29sdW1uW10sXG4gIGZpZWxkczogc3RyaW5nW10sXG4gIGZsYWdzVXNlZDogbnVtYmVyO1xuICByYXdGaWVsZHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IFtdKSA9PiBhbnk+XG59XG5cbnR5cGUgQmxvYlBhcnQgPSBhbnk7IC8vID8/Pz8/XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgbmFtZSwgZmxhZ3NVc2VkIH06IFNjaGVtYUFyZ3MpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuY29sdW1ucyA9IFsuLi5jb2x1bW5zXS5zb3J0KGNtcEZpZWxkcyk7XG4gICAgdGhpcy5maWVsZHMgPSB0aGlzLmNvbHVtbnMubWFwKGMgPT4gYy5uYW1lKTtcbiAgICB0aGlzLmNvbHVtbnNCeU5hbWUgPSBPYmplY3QuZnJvbUVudHJpZXModGhpcy5jb2x1bW5zLm1hcChjID0+IFtjLm5hbWUsIGNdKSk7XG4gICAgdGhpcy5mbGFnRmllbGRzID0gZmxhZ3NVc2VkO1xuICAgIHRoaXMuZml4ZWRXaWR0aCA9IGNvbHVtbnMucmVkdWNlKFxuICAgICAgKHcsIGMpID0+IHcgKyAoKCFjLmlzQXJyYXkgJiYgYy53aWR0aCkgfHwgMCksXG4gICAgICBNYXRoLmNlaWwoZmxhZ3NVc2VkIC8gOCksIC8vIDggZmxhZ3MgcGVyIGJ5dGUsIG5hdGNoXG4gICAgKTtcblxuICAgIGxldCBvOiBudW1iZXJ8bnVsbCA9IDA7XG4gICAgbGV0IGYgPSB0cnVlO1xuICAgIGxldCBiID0gZmFsc2U7XG4gICAgbGV0IGZmID0gMDtcbiAgICBmb3IgKGNvbnN0IFtpLCBjXSBvZiB0aGlzLmNvbHVtbnMuZW50cmllcygpKSB7XG4gICAgICBsZXQgT0MgPSAtMTtcbiAgICAgIC8vaWYgKGMudHlwZSAmIDE2KSBicmVhaztcbiAgICAgIHN3aXRjaCAoYy50eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkdfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JOF9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5CSUdfQVJSQVk6XG4gICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgIGlmIChvID4gMCkge1xuICAgICAgICAgICAgICBjb25zdCBkc28gPSBNYXRoLm1heCgwLCBpIC0gMilcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLm5hbWUsIGksIG8sIGBEU086JHtkc299Li4ke2kgKyAyfTpgLCBjb2x1bW5zLnNsaWNlKE1hdGgubWF4KDAsIGkgLSAyKSwgaSArIDIpKTtcbiAgICAgICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2hvdWxkIG5vdCBiZSEnKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnfn5+fn4gQk9PTCBUSU1FUyBET05FIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoZmYgIT09IHRoaXMuZmxhZ0ZpZWxkcykgdGhyb3cgbmV3IEVycm9yKCdib29vT1NBQVNPQU8nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBpZiAoIWYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2hvdWxkIGJlIScpXG4gICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYywgbyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnfn5+fn4gQk9PTCBUSU1FUyB+fn5+ficpO1xuICAgICAgICAgICAgYiA9IHRydWU7XG4gICAgICAgICAgICBpZiAoZmYgIT09IDApIHRocm93IG5ldyBFcnJvcignYm9vbycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBPQyA9IG87XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGMub2Zmc2V0ID0gbzsgYy5iaXQgPSBmZisrOyBjLmZsYWcgPSAyICoqIChjLmJpdCAlIDgpOyAvLyBoZWhlaGVcbiAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjgpIG8rKztcbiAgICAgICAgICBpZiAoYy5iaXQgKyAxID09PSB0aGlzLmZsYWdGaWVsZHMpIHtcbiAgICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCAmJiBvICE9PSB0aGlzLmZpeGVkV2lkdGgpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUnKVxuICAgICAgICAgICAgaWYgKGMuZmxhZyA8IDEyOCAmJiBvICE9PSB0aGlzLmZpeGVkV2lkdGggLSAxKSB0aHJvdyBuZXcgRXJyb3IoJ1dIVVBPU0lFIC0gMScpXG4gICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICBPQyA9IG87XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGMub2Zmc2V0ID0gbztcbiAgICAgICAgICBpZiAoIWMud2lkdGgpIGRlYnVnZ2VyO1xuICAgICAgICAgIG8gKz0gYy53aWR0aCE7XG4gICAgICAgICAgaWYgKG8gPT09IHRoaXMuZml4ZWRXaWR0aCkgZiA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy9jb25zdCBybmcgPSBPQyA8IDAgPyBgYCA6IGAgJHtPQ30uLiR7b30gLyAke3RoaXMuZml4ZWRXaWR0aH1gXG4gICAgICAvL2NvbnNvbGUubG9nKGBbJHtpfV0ke3JuZ31gLCBjLm5hbWUsIGMubGFiZWwpXG4gICAgfVxuICAgIHRoaXMuc3RyaW5nRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc1N0cmluZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG4gICAgdGhpcy5iaWdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzQmlnQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcblxuICB9XG5cbiAgc3RhdGljIGZyb21CdWZmZXIgKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBTY2hlbWEge1xuICAgIGxldCBpID0gMDtcbiAgICBsZXQgcmVhZDogbnVtYmVyO1xuICAgIGxldCBuYW1lOiBzdHJpbmc7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcblxuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAgY29sdW1uczogW10gYXMgQ29sdW1uW10sXG4gICAgICBmaWVsZHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgZmxhZ3NVc2VkOiAwLFxuICAgICAgcmF3RmllbGRzOiB7fSwgLy8gbm9uZSA6PFxuICAgICAgb3ZlcnJpZGVzOiB7fSwgLy8gbm9uZX5cbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyBUT0RPIC0gb25seSB3b3JrcyB3aGVuIDAtZmllbGQgc2NoZW1hcyBhcmVuJ3QgYWxsb3dlZH4hXG4gICAgd2hpbGUgKGluZGV4IDwgbnVtRmllbGRzKSB7XG4gICAgICBjb25zdCB0eXBlID0gYnl0ZXNbaSsrXTtcbiAgICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgY29uc3QgZiA9IHtcbiAgICAgICAgaW5kZXgsIG5hbWUsIHR5cGUsXG4gICAgICAgIHdpZHRoOiBudWxsLCBiaXQ6IG51bGwsIGZsYWc6IG51bGwsXG4gICAgICAgIG9yZGVyOiA5OTlcbiAgICAgIH07XG4gICAgICBpICs9IHJlYWQ7XG4gICAgICBsZXQgYzogQ29sdW1uO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICAgYyA9IG5ldyBTdHJpbmdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgICAgYyA9IG5ldyBCaWdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGNvbnN0IGJpdCA9IGFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgY29uc3QgZmxhZyA9IDIgKiogKGJpdCAlIDgpO1xuICAgICAgICAgIGMgPSBuZXcgQm9vbENvbHVtbih7IC4uLmYsIGJpdCwgZmxhZyB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAxIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDQgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIHR5cGUgJHt0eXBlfWApO1xuICAgICAgfVxuICAgICAgYXJncy5jb2x1bW5zLnB1c2goYyk7XG4gICAgICBhcmdzLmZpZWxkcy5wdXNoKGMubmFtZSk7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNjaGVtYShhcmdzKTtcbiAgfVxuXG4gIHJvd0Zyb21CdWZmZXIoXG4gICAgICBpOiBudW1iZXIsXG4gICAgICBidWZmZXI6IEFycmF5QnVmZmVyLFxuICAgICAgX19yb3dJZDogbnVtYmVyXG4gICk6IFtSb3csIG51bWJlcl0ge1xuICAgIGNvbnN0IGRiciA9IF9fcm93SWQgPCA1IHx8IF9fcm93SWQgPiAzOTc1IHx8IF9fcm93SWQgJSAxMDAwID09PSAwO1xuICAgIC8vaWYgKGRicikgY29uc29sZS5sb2coYCAtIFJPVyAke19fcm93SWR9IEZST00gJHtpfSAoMHgke2kudG9TdHJpbmcoMTYpfSlgKVxuICAgIGxldCB0b3RhbFJlYWQgPSAwO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgY29uc3Qgcm93OiBSb3cgPSB7IF9fcm93SWQgfVxuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIC8vaWYgKGMub2Zmc2V0ICYmIGMub2Zmc2V0ICE9PSB0b3RhbFJlYWQpIHsgZGVidWdnZXI7IGNvbnNvbGUubG9nKCd3b29wc2llJyk7IH1cbiAgICAgIGxldCBbdiwgcmVhZF0gPSBjLmlzQXJyYXkgP1xuICAgICAgICBjLmFycmF5RnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KSA6XG4gICAgICAgIGMuZnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KTtcblxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpXG4gICAgICAgIHJlYWQgPSAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpID8gMSA6IDA7XG5cbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIHRvdGFsUmVhZCArPSByZWFkO1xuICAgICAgcm93W2MubmFtZV0gPSB2O1xuICAgICAgY29uc3QgdyA9IGdsb2JhbFRoaXMuX1JPV1NbdGhpcy5uYW1lXVtfX3Jvd0lkXVtjLm5hbWVdXG4gICAgICBpZiAodyAhPT0gdikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodykgfHwgdy5zb21lKChuLCBpKSA9PiBuICE9PSB2W2ldKSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFhYWFhYICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gLT4gJHt2fWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5lcnJvcihgX19fX18gJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSA9PSAke3Z9YClcbiAgICAgIH1cbiAgICB9XG4gICAgLy9pZiAoZGJyKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgICBSRUFEOiAke3RvdGFsUmVhZH0gVE8gJHtpfSAvICR7YnVmZmVyLmJ5dGVMZW5ndGh9XFxuYCwgcm93LCAnXFxuXFxuJyk7XG4gICAgICAvL2RlYnVnZ2VyO1xuICAgIC8vfVxuICAgIHJldHVybiBbcm93LCB0b3RhbFJlYWRdO1xuICB9XG5cbiAgcHJpbnRSb3cgKHI6IFJvdywgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUhlYWRlciAoKTogQmxvYiB7XG4gICAgLy8gWy4uLm5hbWUsIDAsIG51bUZpZWxkczAsIG51bUZpZWxkczEsIGZpZWxkMFR5cGUsIGZpZWxkMEZsYWc/LCAuLi5maWVsZDBOYW1lLCAwLCBldGNdO1xuICAgIC8vIFRPRE8gLSBCYXNlIHVuaXQgaGFzIDUwMCsgZmllbGRzXG4gICAgaWYgKHRoaXMuY29sdW1ucy5sZW5ndGggPiA2NTUzNSkgdGhyb3cgbmV3IEVycm9yKCdvaCBidWRkeS4uLicpO1xuICAgIGNvbnN0IHBhcnRzID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyAocjogUm93KTogQmxvYiB7XG4gICAgY29uc3QgZml4ZWQgPSBuZXcgVWludDhBcnJheSh0aGlzLmZpeGVkV2lkdGgpO1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcbiAgICBjb25zdCBibG9iUGFydHM6IEJsb2JQYXJ0W10gPSBbZml4ZWRdO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgIGNvbnN0IHYgPSByW2MubmFtZV1cbiAgICAgIGlmIChjLmlzQXJyYXkpIHtcbiAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplQXJyYXkodiBhcyBhbnlbXSlcbiAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBzdHJpbmcpXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgfSBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgLy8gYWZ0ZXIgd2UncmUgZG9uZSB3aXRoIG51bWJlcnMgYW5kIGJvb2xlYW5zXG4gICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpIGkrKztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgIGZpeGVkLnNldChieXRlcywgaSlcbiAgICAgICAgICBpICs9IGMud2lkdGghO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7KGMgYXMgYW55KS50eXBlfWApO1xuICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBDT0xVTU46JywgYyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgUk9XOicsIHIpO1xuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lmIChyLl9fcm93SWQgPCA1IHx8IHIuX19yb3dJZCA+IDM5NzUgfHwgci5fX3Jvd0lkICUgMTAwMCA9PT0gMCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgIC0gUk9XICR7ci5fX3Jvd0lkfWAsIHsgaSwgYmxvYlBhcnRzLCByIH0pO1xuICAgIC8vfVxuICAgIHJldHVybiBuZXcgQmxvYihibG9iUGFydHMpO1xuICB9XG5cbiAgcHJpbnQgKHdpZHRoID0gODApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMzYpO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnN0IHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSA9IHRoaXM7XG4gICAgY29uc29sZS5sb2coeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9KTtcbiAgICBjb25zb2xlLnRhYmxlKHRoaXMuY29sdW1ucywgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ2xhYmVsJyxcbiAgICAgICdvZmZzZXQnLFxuICAgICAgJ29yZGVyJyxcbiAgICAgICdiaXQnLFxuICAgICAgJ3R5cGUnLFxuICAgICAgJ2ZsYWcnLFxuICAgICAgJ3dpZHRoJyxcbiAgICBdKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcblxuICB9XG5cbiAgLy8gcmF3VG9Sb3cgKGQ6IFJhd1Jvdyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHt9XG4gIC8vIHJhd1RvU3RyaW5nIChkOiBSYXdSb3csIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHt9XG59O1xuXG4iLCAiaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmV4cG9ydCB0eXBlIFJvd0RhdGEgPSBzdHJpbmd8bnVtYmVyfGJvb2xlYW58YmlnaW50fChzdHJpbmd8bnVtYmVyfGJpZ2ludClbXTtcbmV4cG9ydCB0eXBlIFJvdyA9IFJlY29yZDxzdHJpbmcsIFJvd0RhdGE+ICYgeyBfX3Jvd0lkOiBudW1iZXIgfTtcblxudHlwZSBUYWJsZUJsb2IgPSB7IG51bVJvd3M6IG51bWJlciwgaGVhZGVyQmxvYjogQmxvYiwgZGF0YUJsb2I6IEJsb2IgfTtcblxuZXhwb3J0IGNsYXNzIFRhYmxlIHtcbiAgZ2V0IG5hbWUgKCk6IHN0cmluZyB7IHJldHVybiBgW1RBQkxFOiR7dGhpcy5zY2hlbWEubmFtZX1dYDsgfVxuICBjb25zdHJ1Y3RvciAoXG4gICAgcmVhZG9ubHkgcm93czogUm93W10sXG4gICAgcmVhZG9ubHkgc2NoZW1hOiBTY2hlbWEsXG4gICkge1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuICAgIC8vY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4ge1xuICAgICAgLy9jb25zdCByb3dCbG9iID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpXG4gICAgICAvL2lmIChyLl9fcm93SWQgPT09IDApXG4gICAgICAgIC8vcm93QmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oYWIgPT4ge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coYEFSUkFZIEJVRkZFUiBGT1IgRklSU1QgUk9XIE9GICR7dGhpcy5uYW1lfWAsIG5ldyBVaW50OEFycmF5KGFiKS5qb2luKCcsICcpKTtcbiAgICAgICAgLy99KTtcbiAgICAgIC8vcmV0dXJuIHJvd0Jsb2I7XG4gICAgLy99KTtcbiAgICBjb25zdCByb3dCbG9iID0gbmV3IEJsb2Iocm93RGF0YSlcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93QmxvYi5zaXplICUgNCkgJSA0O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBVaW50MzJBcnJheShbXG4gICAgICAgIHRoaXMucm93cy5sZW5ndGgsXG4gICAgICAgIHNjaGVtYUhlYWRlci5zaXplICsgc2NoZW1hUGFkZGluZyxcbiAgICAgICAgcm93QmxvYi5zaXplICsgZGF0YVBhZGRpbmdcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICBzY2hlbWFIZWFkZXIsXG4gICAgICAgIG5ldyBBcnJheUJ1ZmZlcihzY2hlbWFQYWRkaW5nKSBhcyBhbnkgLy8gPz8/XG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgcm93QmxvYixcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZGF0YVBhZGRpbmcpXG4gICAgICBdKSxcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGNvbmNhdFRhYmxlcyAodGFibGVzOiBUYWJsZVtdKTogQmxvYiB7XG4gICAgY29uc3QgYWxsU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoMSArIHRhYmxlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCBhbGxIZWFkZXJzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBhbGxEYXRhOiBCbG9iW10gPSBbXTtcblxuICAgIGNvbnN0IGJsb2JzID0gdGFibGVzLm1hcCh0ID0+IHQuc2VyaWFsaXplKCkpO1xuICAgIGFsbFNpemVzWzBdID0gYmxvYnMubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgW2ksIFtzaXplcywgaGVhZGVycywgZGF0YV1dIG9mIGJsb2JzLmVudHJpZXMoKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgT1VUIEJMT0JTIEZPUiBUPSR7aX1gLCBzaXplcywgaGVhZGVycywgZGF0YSlcbiAgICAgIGFsbFNpemVzLnNldChzaXplcywgMSArIGkgKiAzKTtcbiAgICAgIGFsbEhlYWRlcnMucHVzaChoZWFkZXJzKTtcbiAgICAgIGFsbERhdGEucHVzaChkYXRhKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGZyb21CbG9iICh7XG4gICAgaGVhZGVyQmxvYixcbiAgICBkYXRhQmxvYixcbiAgICBudW1Sb3dzLFxuICB9OiBUYWJsZUJsb2IpOiBQcm9taXNlPFRhYmxlPiB7XG4gICAgY29uc3Qgc2NoZW1hID0gU2NoZW1hLmZyb21CdWZmZXIoYXdhaXQgaGVhZGVyQmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICBsZXQgcmJvID0gMDtcbiAgICBsZXQgX19yb3dJZCA9IDA7XG4gICAgY29uc3Qgcm93czogUm93W10gPSBbXTtcbiAgICAvLyBUT0RPIC0gY291bGQgZGVmaW5pdGVseSB1c2UgYSBzdHJlYW0gZm9yIHRoaXNcbiAgICBjb25zdCBkYXRhQnVmZmVyID0gYXdhaXQgZGF0YUJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT0gUkVBRCAke251bVJvd3N9IE9GICR7c2NoZW1hLm5hbWV9ID09PT09YClcbiAgICB3aGlsZSAoX19yb3dJZCA8IG51bVJvd3MpIHtcbiAgICAgIGNvbnN0IFtyb3csIHJlYWRdID0gc2NoZW1hLnJvd0Zyb21CdWZmZXIocmJvLCBkYXRhQnVmZmVyLCBfX3Jvd0lkKyspO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICByYm8gKz0gcmVhZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG4gIH1cblxuXG4gIHByaW50IChcbiAgICB3aWR0aDogbnVtYmVyID0gODAsXG4gICAgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT58bnVsbCA9IG51bGwsXG4gICAgbjogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIG06IG51bWJlcnxudWxsID0gbnVsbFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG4gICAgY29uc3QgW3BSb3dzLCBwRmllbGRzXSA9IGZpZWxkcyA/XG4gICAgICBbcm93cy5tYXAoKHI6IFJvdykgPT4gdGhpcy5zY2hlbWEucHJpbnRSb3cociwgZmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc29sZS50YWJsZShwUm93cywgcEZpZWxkcyk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG4gIH1cblxuICBkdW1wUm93IChpOiBudW1iZXJ8bnVsbCwgc2hvd0VtcHR5ID0gZmFsc2UsIHVzZUNTUz86IGJvb2xlYW4pOiBzdHJpbmdbXSB7XG4gICAgLy8gVE9ETyBcdTIwMTQgaW4gYnJvd3NlciwgdXNlQ1NTID09PSB0cnVlIGJ5IGRlZmF1bHRcbiAgICB1c2VDU1MgPz89IChnbG9iYWxUaGlzWyd3aW5kb3cnXSA9PT0gZ2xvYmFsVGhpcyk7IC8vIGlka1xuICAgIGkgPz89IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMucm93cy5sZW5ndGgpO1xuICAgIGNvbnN0IHJvdyA9IHRoaXMucm93c1tpXTtcbiAgICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgY3NzOiBzdHJpbmdbXXxudWxsID0gdXNlQ1NTID8gW10gOiBudWxsO1xuICAgIGNvbnN0IGZtdCA9IGZtdFN0eWxlZC5iaW5kKG51bGwsIG91dCwgY3NzKTtcbiAgICBjb25zdCBwID0gTWF0aC5tYXgoXG4gICAgICAuLi50aGlzLnNjaGVtYS5jb2x1bW5zXG4gICAgICAuZmlsdGVyKGMgPT4gc2hvd0VtcHR5IHx8IHJvd1tjLm5hbWVdKVxuICAgICAgLm1hcChjID0+IGMubmFtZS5sZW5ndGggKyAyKVxuICAgICk7XG4gICAgaWYgKCFyb3cpXG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XSBkb2VzIG5vdCBleGlzdGAsIENfTk9UX0ZPVU5EKTtcbiAgICBlbHNlIHtcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dYCwgQ19ST1dfSEVBRCk7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5zY2hlbWEuY29sdW1ucykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1tjLm5hbWVdO1xuICAgICAgICBjb25zdCBuID0gYy5uYW1lLnBhZFN0YXJ0KHAsICcgJyk7XG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWNUUlVFYCwgQ19UUlVFKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogJWNGQUxTRWAsIENfTk9UX0ZPVU5ELCBDX0ZBTFNFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWMke3ZhbHVlfWAsIENfTlVNQkVSKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWMke3ZhbHVlfWAsIENfU1RSKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogXHUyMDE0YCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYmlnaW50JzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGB7bn06ICVjMCAlYyR7dmFsdWV9IChCSUcpYCwgQ19CSUcsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDAgKEJJRylgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodXNlQ1NTKSByZXR1cm4gW291dC5qb2luKCdcXG4nKSwgLi4uY3NzIV07XG4gICAgZWxzZSByZXR1cm4gW291dC5qb2luKCdcXG4nKV07XG4gIH1cblxuICBmaW5kUm93IChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbiwgc3RhcnQgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBOID0gdGhpcy5yb3dzLmxlbmd0aFxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gTiAtIHN0YXJ0O1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IE47IGkrKykgaWYgKHByZWRpY2F0ZSh0aGlzLnJvd3NbaV0pKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAqIGZpbHRlclJvd3MgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuKTogR2VuZXJhdG9yPFJvdz4ge1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykgaWYgKHByZWRpY2F0ZShyb3cpKSB5aWVsZCByb3c7XG4gIH1cbiAgLypcbiAgcmF3VG9Sb3cgKGQ6IHN0cmluZ1tdKTogUm93IHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc2NoZW1hLmNvbHVtbnMubWFwKHIgPT4gW1xuICAgICAgci5uYW1lLFxuICAgICAgci50b1ZhbChkW3IuaW5kZXhdKVxuICAgIF0pKTtcbiAgfVxuICByYXdUb1N0cmluZyAoZDogc3RyaW5nW10sIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAvLyBqdXN0IGFzc3VtZSBmaXJzdCB0d28gZmllbGRzIGFyZSBhbHdheXMgaWQsIG5hbWUuIGV2ZW4gaWYgdGhhdCdzIG5vdCB0cnVlXG4gICAgLy8gdGhpcyBpcyBqdXN0IGZvciB2aXN1YWxpemF0aW9uIHB1cnBvcnNlc1xuICAgIGxldCBleHRyYSA9ICcnO1xuICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLnJhd1RvUm93KGQpO1xuICAgICAgZm9yIChjb25zdCBhIG9mIGFyZ3MpIHtcbiAgICAgICAgLy8gZG9uJ3QgcmVwcmludCBuYW1lIG9yIGlkXG4gICAgICAgIGlmIChhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMF0gfHwgYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzFdKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZVthXSAhPSBudWxsKVxuICAgICAgICAgIHMucHVzaChgJHthfTogJHtKU09OLnN0cmluZ2lmeShlW2FdKX1gKVxuICAgICAgfVxuICAgICAgZXh0cmEgPSBzLmxlbmd0aCA+IDAgPyBgIHsgJHtzLmpvaW4oJywgJyl9IH1gIDogJ3t9JztcbiAgICB9XG4gICAgcmV0dXJuIGA8JHt0aGlzLnNjaGVtYS5uYW1lfToke2RbMF0gPz8gJz8nfSBcIiR7ZFsxXX1cIiR7ZXh0cmF9PmA7XG4gIH1cbiAgKi9cbn1cblxuZnVuY3Rpb24gZm10U3R5bGVkIChcbiAgb3V0OiBzdHJpbmdbXSxcbiAgY3NzT3V0OiBzdHJpbmdbXSB8IG51bGwsXG4gIG1zZzogc3RyaW5nLFxuICAuLi5jc3M6IHN0cmluZ1tdXG4pIHtcbiAgaWYgKGNzc091dCkge1xuICAgIG91dC5wdXNoKG1zZyArICclYycpXG4gICAgY3NzT3V0LnB1c2goLi4uY3NzLCBDX1JFU0VUKTtcbiAgfVxuICBlbHNlIG91dC5wdXNoKG1zZy5yZXBsYWNlKC8lYy9nLCAnJykpO1xufVxuXG5jb25zdCBDX05PVF9GT1VORCA9ICdjb2xvcjogIzg4ODsgZm9udC1zdHlsZTogaXRhbGljOyc7XG5jb25zdCBDX1JPV19IRUFEID0gJ2ZvbnQtd2VpZ2h0OiBib2xkZXInO1xuY29uc3QgQ19CT0xEID0gJ2ZvbnQtd2VpZ2h0OiBib2xkJztcbmNvbnN0IENfTlVNQkVSID0gJ2NvbG9yOiAjQTA1NTE4OyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19UUlVFID0gJ2NvbG9yOiAjNEMzOEJFOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19GQUxTRSA9ICdjb2xvcjogIzM4QkUxQzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfU1RSID0gJ2NvbG9yOiAjMzBBQTYyOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19CSUcgPSAnY29sb3I6ICM3ODIxQTM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1JFU0VUID0gJ2NvbG9yOiB1bnNldDsgZm9udC1zdHlsZTogdW5zZXQ7IGZvbnQtd2VpZ2h0OiB1bnNldDsgYmFja2dyb3VuZC11bnNldCdcbiIsICJpbXBvcnQgeyBDT0xVTU4sIFNjaGVtYUFyZ3MgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB0eXBlIHsgUGFyc2VTY2hlbWFPcHRpb25zIH0gZnJvbSAnLi9wYXJzZS1jc3YnXG5leHBvcnQgY29uc3QgY3N2RGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+PiA9IHtcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VVLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFtcbiAgICAgICdhcm1vcjEnLFxuICAgICAgJ2FybW9yMicsXG4gICAgICAnYXJtb3IzJyxcbiAgICAgICdhcm1vcjQnLFxuICAgICAgJ2VuZCcsXG4gICAgICAnbGluazEnLFxuICAgICAgJ2xpbmsyJyxcbiAgICAgICdsaW5rMycsXG4gICAgICAnbGluazQnLFxuICAgICAgJ2xpbms1JyxcbiAgICAgICdsaW5rNicsXG4gICAgICAnbWFzazEnLFxuICAgICAgJ21hc2syJyxcbiAgICAgICdtYXNrMycsXG4gICAgICAnbWFzazQnLFxuICAgICAgJ21hc2s1JyxcbiAgICAgICdtYXNrNicsXG4gICAgICAnbW91bnRlZCcsIC8vIGRlcHJlY2F0ZWRcbiAgICAgICduYnIxJyxcbiAgICAgICduYnIyJyxcbiAgICAgICduYnIzJyxcbiAgICAgICduYnI0JyxcbiAgICAgICduYnI1JyxcbiAgICAgICduYnI2JyxcbiAgICAgICdyYW5kMScsXG4gICAgICAncmFuZDInLFxuICAgICAgJ3JhbmQzJyxcbiAgICAgICdyYW5kNCcsXG4gICAgICAncmFuZDUnLFxuICAgICAgJ3JhbmQ2JyxcbiAgICAgICdyZWFuaW1hdG9yLjEnLFxuICAgICAgJ3dwbjEnLFxuICAgICAgJ3dwbjInLFxuICAgICAgJ3dwbjMnLFxuICAgICAgJ3dwbjQnLFxuICAgICAgJ3dwbjUnLFxuICAgICAgJ3dwbjYnLFxuICAgICAgJ3dwbjcnLFxuICAgIF0pLFxuICAgIGtub3duRmllbGRzOiB7XG4gICAgICBpZDogQ09MVU1OLlUxNixcbiAgICAgIG5hbWU6IENPTFVNTi5TVFJJTkcsXG4gICAgICBydDogQ09MVU1OLlU4LFxuICAgICAgcmVjbGltaXQ6IENPTFVNTi5JOCxcbiAgICAgIGJhc2Vjb3N0OiBDT0xVTU4uVTE2LFxuICAgICAgcmNvc3Q6IENPTFVNTi5JOCxcbiAgICAgIHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHJlc3NpemU6IENPTFVNTi5VOCxcbiAgICAgIGhwOiBDT0xVTU4uVTE2LFxuICAgICAgcHJvdDogQ09MVU1OLlU4LFxuICAgICAgbXI6IENPTFVNTi5VOCxcbiAgICAgIG1vcjogQ09MVU1OLlU4LFxuICAgICAgc3RyOiBDT0xVTU4uVTgsXG4gICAgICBhdHQ6IENPTFVNTi5VOCxcbiAgICAgIGRlZjogQ09MVU1OLlU4LFxuICAgICAgcHJlYzogQ09MVU1OLlU4LFxuICAgICAgZW5jOiBDT0xVTU4uVTgsXG4gICAgICBtYXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBhcDogQ09MVU1OLlU4LFxuICAgICAgYW1iaWRleHRyb3VzOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudG1ucjogQ09MVU1OLlUxNixcbiAgICAgIHNraWxsZWRyaWRlcjogQ09MVU1OLlU4LFxuICAgICAgcmVpbnZpZ29yYXRpb246IENPTFVNTi5VOCxcbiAgICAgIGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgdW5kZWFkbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2xlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBtYXhhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBoYW5kOiBDT0xVTU4uVTgsXG4gICAgICBoZWFkOiBDT0xVTU4uVTgsXG4gICAgICBtaXNjOiBDT0xVTU4uVTgsXG4gICAgICBwYXRoY29zdDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRkb206IENPTFVNTi5VOCxcbiAgICAgIGJvbnVzc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBGOiBDT0xVTU4uVTgsXG4gICAgICBBOiBDT0xVTU4uVTgsXG4gICAgICBXOiBDT0xVTU4uVTgsXG4gICAgICBFOiBDT0xVTU4uVTgsXG4gICAgICBTOiBDT0xVTU4uVTgsXG4gICAgICBEOiBDT0xVTU4uVTgsXG4gICAgICBOOiBDT0xVTU4uVTgsXG4gICAgICBHOiBDT0xVTU4uVTgsXG4gICAgICBCOiBDT0xVTU4uVTgsXG4gICAgICBIOiBDT0xVTU4uVTgsXG4gICAgICBzYWlsaW5nc2hpcHNpemU6IENPTFVNTi5VMTYsXG4gICAgICBzYWlsaW5nbWF4dW5pdHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHN0ZWFsdGh5OiBDT0xVTU4uVTgsXG4gICAgICBwYXRpZW5jZTogQ09MVU1OLlU4LFxuICAgICAgc2VkdWNlOiBDT0xVTU4uVTgsXG4gICAgICBzdWNjdWJ1czogQ09MVU1OLlU4LFxuICAgICAgY29ycnVwdDogQ09MVU1OLlU4LFxuICAgICAgaG9tZXNpY2s6IENPTFVNTi5VOCxcbiAgICAgIGZvcm1hdGlvbmZpZ2h0ZXI6IENPTFVNTi5JOCxcbiAgICAgIHN0YW5kYXJkOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJhdGlvbmFsOiBDT0xVTU4uSTgsXG4gICAgICB0YXNrbWFzdGVyOiBDT0xVTU4uVTgsXG4gICAgICBiZWFzdG1hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYm9keWd1YXJkOiBDT0xVTU4uVTgsXG4gICAgICB3YXRlcmJyZWF0aGluZzogQ09MVU1OLlUxNixcbiAgICAgIGljZXByb3Q6IENPTFVNTi5VOCxcbiAgICAgIGludnVsbmVyYWJsZTogQ09MVU1OLlU4LFxuICAgICAgc2hvY2tyZXM6IENPTFVNTi5JOCxcbiAgICAgIGZpcmVyZXM6IENPTFVNTi5JOCxcbiAgICAgIGNvbGRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHBvaXNvbnJlczogQ09MVU1OLlU4LFxuICAgICAgYWNpZHJlczogQ09MVU1OLkk4LFxuICAgICAgdm9pZHNhbml0eTogQ09MVU1OLlU4LFxuICAgICAgZGFya3Zpc2lvbjogQ09MVU1OLlU4LFxuICAgICAgYW5pbWFsYXdlOiBDT0xVTU4uVTgsXG4gICAgICBhd2U6IENPTFVNTi5VOCxcbiAgICAgIGhhbHRoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyOiBDT0xVTU4uVTgsXG4gICAgICBiZXJzZXJrOiBDT0xVTU4uVTgsXG4gICAgICBjb2xkOiBDT0xVTU4uVTgsXG4gICAgICBoZWF0OiBDT0xVTU4uVTgsXG4gICAgICBmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBiYW5lZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZGFtYWdlcmV2OiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25jbG91ZDogQ09MVU1OLlU4LFxuICAgICAgZGlzZWFzZWNsb3VkOiBDT0xVTU4uVTgsXG4gICAgICBzbGltZXI6IENPTFVNTi5VOCxcbiAgICAgIG1pbmRzbGltZTogQ09MVU1OLlUxNixcbiAgICAgIHJlZ2VuZXJhdGlvbjogQ09MVU1OLlU4LFxuICAgICAgcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uYXJtb3I6IENPTFVNTi5VOCxcbiAgICAgIGV5ZWxvc3M6IENPTFVNTi5VOCxcbiAgICAgIGV0aHRydWU6IENPTFVNTi5VOCxcbiAgICAgIHN0b3JtcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgY29sZHBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBkYXJrcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHdpbnRlcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBzcHJpbmdwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3VtbWVycG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZhbGxwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZm9yZ2Vib251czogQ09MVU1OLlU4LFxuICAgICAgZml4Zm9yZ2Vib251czogQ09MVU1OLkk4LFxuICAgICAgbWFzdGVyc21pdGg6IENPTFVNTi5JOCxcbiAgICAgIHJlc291cmNlczogQ09MVU1OLlU4LFxuICAgICAgYXV0b2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgYXV0b2Rpc2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgbm9iYWRldmVudHM6IENPTFVNTi5VOCxcbiAgICAgIGluc2FuZTogQ09MVU1OLlU4LFxuICAgICAgc2hhdHRlcmVkc291bDogQ09MVU1OLlU4LFxuICAgICAgbGVwZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcmVjOiBDT0xVTU4uVTgsXG4gICAgICBwaWxsYWdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHBhdHJvbGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBjYXN0bGVkZWY6IENPTFVNTi5VOCxcbiAgICAgIHNpZWdlYm9udXM6IENPTFVNTi5JMTYsXG4gICAgICBpbmNwcm92ZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzdXBwbHlib251czogQ09MVU1OLlU4LFxuICAgICAgaW5jdW5yZXN0OiBDT0xVTU4uSTE2LFxuICAgICAgcG9wa2lsbDogQ09MVU1OLlUxNixcbiAgICAgIHJlc2VhcmNoYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIGluc3BpcmluZ3JlczogQ09MVU1OLkk4LFxuICAgICAgZG91c2U6IENPTFVNTi5VOCxcbiAgICAgIGFkZXB0c2FjcjogQ09MVU1OLlU4LFxuICAgICAgY3Jvc3NicmVlZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWtlcGVhcmxzOiBDT0xVTU4uVTgsXG4gICAgICB2b2lkc3VtOiBDT0xVTU4uVTgsXG4gICAgICBoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBlbGVnaXN0OiBDT0xVTU4uVTgsXG4gICAgICBzaGFwZWNoYW5nZTogQ09MVU1OLlUxNixcbiAgICAgIGZpcnN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBzZWNvbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGxhbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHdhdGVyc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBmb3Jlc3RzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHBsYWluc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB4cHNoYXBlOiBDT0xVTU4uVTgsXG4gICAgICBuYW1ldHlwZTogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uOiBDT0xVTU4uSTE2LFxuICAgICAgbl9zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMTogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yMDogQ09MVU1OLkkxNixcbiAgICAgIGJsb29kdmVuZ2VhbmNlOiBDT0xVTU4uVTgsXG4gICAgICBicmluZ2Vyb2Zmb3J0dW5lOiBDT0xVTU4uSTgsXG4gICAgICByZWFsbTE6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMzogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNDogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMWQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0yZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTNkNjogQ09MVU1OLkkxNixcbiAgICAgIGJhdHN0YXJ0c3VtNGQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW01ZDY6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtNmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgdHVybW9pbHN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRoZmlyZTogQ09MVU1OLlU4LFxuICAgICAgdXdyZWdlbjogQ09MVU1OLlU4LFxuICAgICAgc2hyaW5raHA6IENPTFVNTi5VOCxcbiAgICAgIGdyb3docDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpbmdhZmY6IENPTFVNTi5VMzIsXG4gICAgICBmaXhlZHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICBsYW1pYWxvcmQ6IENPTFVNTi5VOCxcbiAgICAgIHByZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBkcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgbXVtbWlmeTogQ09MVU1OLlUxNixcbiAgICAgIG9uZWJhdHRsZXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgYWlyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBlYXJ0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRoYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbmF0dXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEY6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0VzogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdEU6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RTOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0RDogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdE46IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBTEw6IENPTFVNTi5JOCxcbiAgICAgIGV5ZXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWVhdGVyOiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25za2luOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGl0ZW06IENPTFVNTi5VOCxcbiAgICAgIGJhdHRsZXN1bTU6IENPTFVNTi5VMTYsXG4gICAgICBhY2lkc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBwcm9waGV0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBob3Jyb3I6IENPTFVNTi5VOCxcbiAgICAgIGxhdGVoZXJvOiBDT0xVTU4uVTgsXG4gICAgICB1d2RhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgbGFuZGRhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgcnBjb3N0OiBDT0xVTU4uVTMyLFxuICAgICAgcmFuZDU6IENPTFVNTi5VOCxcbiAgICAgIG5icjU6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s1OiBDT0xVTU4uVTE2LFxuICAgICAgcmFuZDY6IENPTFVNTi5VOCxcbiAgICAgIG5icjY6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s2OiBDT0xVTU4uVTE2LFxuICAgICAgbXVtbWlmaWNhdGlvbjogQ09MVU1OLlUxNixcbiAgICAgIGRpc2Vhc2VyZXM6IENPTFVNTi5VOCxcbiAgICAgIHJhaXNlb25raWxsOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZXNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2VuZGxlc3NlcmhvcnJvcm11bHQ6IENPTFVNTi5VOCxcbiAgICAgIGluY29ycG9yYXRlOiBDT0xVTU4uVTgsXG4gICAgICBibGVzc2JlcnM6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlYXR0YWNrZXI6IENPTFVNTi5VOCxcbiAgICAgIHV3aGVhdDogQ09MVU1OLlU4LFxuICAgICAgc2xvdGhyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9yZGVzZXJ0ZXI6IENPTFVNTi5VOCxcbiAgICAgIHNvcmNlcnlyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgb2xkZXI6IENPTFVNTi5JOCxcbiAgICAgIGRpc2JlbGlldmU6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYXN0cmFscmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBiZWFydGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBob3JzZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgcmVpbmNhcm5hdGlvbjogQ09MVU1OLlU4LFxuICAgICAgd29sZnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYm9hcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgc2xlZXBhdXJhOiBDT0xVTU4uVTgsXG4gICAgICBzbmFrZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYXBwZXRpdGU6IENPTFVNTi5JOCxcbiAgICAgIHRlbXBsZXRyYWluZXI6IENPTFVNTi5VOCxcbiAgICAgIGluZmVybm9yZXQ6IENPTFVNTi5VOCxcbiAgICAgIGtva3l0b3NyZXQ6IENPTFVNTi5VOCxcbiAgICAgIGFkZHJhbmRvbWFnZTogQ09MVU1OLlUxNixcbiAgICAgIHVuc3VycjogQ09MVU1OLlU4LFxuICAgICAgc3BlY2lhbGxvb2s6IENPTFVNTi5VOCxcbiAgICAgIGJ1Z3JlZm9ybTogQ09MVU1OLlU4LFxuICAgICAgb25pc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBzdW5hd2U6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWZmOiBDT0xVTU4uVTgsXG4gICAgICBpdnlsb3JkOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2Q6IENPTFVNTi5VOCxcbiAgICAgIHRyaXBsZWdvZG1hZzogQ09MVU1OLlU4LFxuICAgICAgZm9ydGtpbGw6IENPTFVNTi5VOCxcbiAgICAgIHRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBlbnRhbmdsZTogQ09MVU1OLlU4LFxuICAgICAgYWxjaGVteTogQ09MVU1OLlU4LFxuICAgICAgd291bmRmZW5kOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWFybXk6IENPTFVNTi5JOCxcbiAgICAgIHN1bW1vbjU6IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRocGFyYWx5emU6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWNvbnN0cnVjdDogQ09MVU1OLlU4LFxuICAgICAgZ3VhcmRpYW5zcGlyaXRtb2RpZmllcjogQ09MVU1OLkk4LFxuICAgICAgaWNlZm9yZ2luZzogQ09MVU1OLlU4LFxuICAgICAgY2xvY2t3b3JrbG9yZDogQ09MVU1OLlU4LFxuICAgICAgbWluc2l6ZWxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgaXJvbnZ1bDogQ09MVU1OLlU4LFxuICAgICAgaGVhdGhlbnN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgcG93ZXJvZmRlYXRoOiBDT0xVTU4uVTgsXG4gICAgICByZWZvcm10aW1lOiBDT0xVTU4uSTgsXG4gICAgICB0d2ljZWJvcm46IENPTFVNTi5VMTYsXG4gICAgICB0bXBhc3RyYWxnZW1zOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGhlcm9hYjogQ09MVU1OLlU4LFxuICAgICAgdXdmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBzYWx0dnVsOiBDT0xVTU4uVTgsXG4gICAgICBsYW5kZW5jOiBDT0xVTU4uVTgsXG4gICAgICBwbGFndWVkb2N0b3I6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlbHVja3NoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZmFydGhyb25la2lsbDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9ybWFyazogQ09MVU1OLlU4LFxuICAgICAgYWxscmV0OiBDT0xVTU4uVTgsXG4gICAgICBhY2lkZGlnZXN0OiBDT0xVTU4uVTgsXG4gICAgICBiZWNrb246IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcmJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBjYXJjYXNzY29sbGVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kY29sbGFyOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudGFpbnJlYzogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBzcGVsbHM6IENPTFVNTi5VOCxcbiAgICAgIGVuY2hyZWJhdGU1MDogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uMTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmRvbXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmlmeTogQ09MVU1OLlU4LFxuICAgICAgJ3JlYW5pbWF0b3IuMSc6IENPTFVNTi5VOCxcbiAgICAgIGRlZmVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTFkMzogQ09MVU1OLlUxNixcbiAgICAgIGVuY2hyZWJhdGUxMDogQ09MVU1OLlU4LFxuICAgICAgdW5keWluZzogQ09MVU1OLlU4LFxuICAgICAgbW9yYWxlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHVuY3VyYWJsZWFmZmxpY3Rpb246IENPTFVNTi5VMzIsXG4gICAgICB3aW50ZXJzdW1tb24xZDM6IENPTFVNTi5VMTYsXG4gICAgICBzdHlnaWFuZ3VpZGU6IENPTFVNTi5VOCxcbiAgICAgIHNtYXJ0bW91bnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlZm9ybWluZ2ZsZXNoOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyb2Z0aGVmbG9vZDogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlc3RpdGNoZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlY29uc3RydWN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBub2ZyaWRlcnM6IENPTFVNTi5VOCxcbiAgICAgIGNvcmlkZXJtbnI6IENPTFVNTi5VMTYsXG4gICAgICBob2x5Y29zdDogQ09MVU1OLlU4LFxuICAgICAgYW5pbWF0ZW1ucjogQ09MVU1OLlUxNixcbiAgICAgIGxpY2g6IENPTFVNTi5VMTYsXG4gICAgICBlcmFzdGFydGFnZWluY3JlYXNlOiBDT0xVTU4uVTE2LFxuICAgICAgbW9yZW9yZGVyOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlZ3Jvd3RoOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlcHJvZDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWhlYXQ6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVsdWNrOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlbWFnaWM6IENPTFVNTi5JOCxcbiAgICAgIG5vZm1vdW50czogQ09MVU1OLlU4LFxuICAgICAgZmFsc2VkYW1hZ2VyZWNvdmVyeTogQ09MVU1OLlU4LFxuICAgICAgdXdwYXRoYm9vc3Q6IENPTFVNTi5JOCxcbiAgICAgIHJhbmRvbWl0ZW1zOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhzbGltZWV4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRocG9pc29uZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhzaG9ja2V4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRyYXdzaXplOiBDT0xVTU4uSTgsXG4gICAgICBwZXRyaWZpY2F0aW9uaW1tdW5lOiBDT0xVTU4uVTgsXG4gICAgICBzY2Fyc291bHM6IENPTFVNTi5VOCxcbiAgICAgIHNwaWtlYmFyYnM6IENPTFVNTi5VOCxcbiAgICAgIHByZXRlbmRlcnN0YXJ0c2l0ZTogQ09MVU1OLlUxNixcbiAgICAgIG9mZnNjcmlwdHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICB1bm1vdW50ZWRzcHI6IENPTFVNTi5VMzIsXG4gICAgICBleGhhdXN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudGVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJvdzogQ09MVU1OLkJPT0wsXG4gICAgICBib2R5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZvb3Q6IENPTFVNTi5CT09MLFxuICAgICAgY3Jvd25vbmx5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGhvbHk6IENPTFVNTi5CT09MLFxuICAgICAgaW5xdWlzaXRvcjogQ09MVU1OLkJPT0wsXG4gICAgICBpbmFuaW1hdGU6IENPTFVNTi5CT09MLFxuICAgICAgdW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3RvbmViZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBhbmltYWw6IENPTFVNTi5CT09MLFxuICAgICAgY29sZGJsb29kOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZlbWFsZTogQ09MVU1OLkJPT0wsXG4gICAgICBmb3Jlc3RzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGFpbnN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhc3Rlc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgc3dhbXBzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBhcXVhdGljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBwb29yYW1waGliaWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZsb2F0OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZseWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdG9ybWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB0ZWxlcG9ydDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vYmlsZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JpdmVycGFzczogQ09MVU1OLkJPT0wsXG4gICAgICBpbGx1c2lvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHk6IENPTFVNTi5CT09MLFxuICAgICAgYXNzYXNzaW46IENPTFVNTi5CT09MLFxuICAgICAgaGVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkb21pbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBub2hlYWw6IENPTFVNTi5CT09MLFxuICAgICAgbmVlZG5vdGVhdDogQ09MVU1OLkJPT0wsXG4gICAgICB1bmRpc2NpcGxpbmVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXNocmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsdW50cmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBpZXJjZXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibGluZDogQ09MVU1OLkJPT0wsXG4gICAgICBwZXRyaWZ5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGV0aGVyZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlYXRoY3Vyc2U6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmFtcHN3YWxsb3c6IENPTFVNTi5CT09MLFxuICAgICAgdGF4Y29sbGVjdG9yOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWluaW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuaXF1ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzY2FsZXdhbGxzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWluczogQ09MVU1OLkJPT0wsXG4gICAgICBoZWF0cmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRyZWM6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkY2hhb3M6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZGVhdGg6IENPTFVNTi5CT09MLFxuICAgICAgYnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHV3YnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZG9yZGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGdyb3d0aDogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRkb206IENPTFVNTi5CT09MLFxuICAgICAgZHJha2U6IENPTFVNTi5CT09MLFxuICAgICAgdGhlZnRvZnRoZXN1bmF3ZTogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFnb25sb3JkOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbmR2ZXNzZWw6IENPTFVNTi5CT09MLFxuICAgICAgZWxlbWVudHJhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzdHJhbGZldHRlcnM6IENPTFVNTi5CT09MLFxuICAgICAgY29tYmF0Y2FzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpc2luZ2xlcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vd2lzaDogQ09MVU1OLkJPT0wsXG4gICAgICBtYXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcGlyaXRzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBvd25ibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBpbnZpc2libGU6IENPTFVNTi5CT09MLFxuICAgICAgc3BlbGxzaW5nZXI6IENPTFVNTi5CT09MLFxuICAgICAgbWFnaWNzdHVkeTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmlwbGUzbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHllYXJ0dXJuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVudGVsZXBvcnRhYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlYW5pbXByaWVzdDogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVuaW1tdW5pdHk6IENPTFVNTi5CT09MLFxuICAgICAgc2luZ2xlYmF0dGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlc2VhcmNod2l0aG91dG1hZ2ljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9jb21wZXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFkdmVudHVyZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsZWFuc2hhcGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVxbGFiOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcXRlbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICBob3Jyb3JtYXJrZWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhc2hhaDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2F5YXphZDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2FkYWV2YTogQ09MVU1OLkJPT0wsXG4gICAgICBibGVzc2ZseTogQ09MVU1OLkJPT0wsXG4gICAgICBwbGFudDogQ09MVU1OLkJPT0wsXG4gICAgICBjb21zbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbm93bW92ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzd2ltbWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVwaWQ6IENPTFVNTi5CT09MLFxuICAgICAgc2tpcm1pc2hlcjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnNlZW46IENPTFVNTi5CT09MLFxuICAgICAgbm9tb3ZlcGVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdvbGY6IENPTFVNTi5CT09MLFxuICAgICAgZHVuZ2VvbjogQ09MVU1OLkJPT0wsXG4gICAgICBhYm9sZXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGxvY2Fsc3VuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRtcGZpcmVnZW1zOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlZmlsZXI6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRlZGJlc2VyazogQ09MVU1OLkJPT0wsXG4gICAgICBsYW5jZW9rOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbnByaXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBocG92ZXJmbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIGluZGVwc3RheTogQ09MVU1OLkJPT0wsXG4gICAgICBwb2x5aW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vcmFuZ2U6IENPTFVNTi5CT09MLFxuICAgICAgbm9ob2Y6IENPTFVNTi5CT09MLFxuICAgICAgYXV0b2JsZXNzZWQ6IENPTFVNTi5CT09MLFxuICAgICAgYWxtb3N0dW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRydWVzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBtb2JpbGVhcmNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0Zm9ybTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNtYXN0ZXI6IENPTFVNTi5CT09MLFxuICAgICAgdGlnaHRyZWluOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXJtYW46IENPTFVNTi5CT09MLFxuICAgICAgZGl2aW5lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbm9mYWxsZG1nOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZpcmVlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpcmVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgd2F0ZXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVhcnRoZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBwb3BzcHk6IENPTFVNTi5CT09MLFxuICAgICAgY2FwaXRhbGhvbWU6IENPTFVNTi5CT09MLFxuICAgICAgY2x1bXN5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlZ2Fpbm1vdW50OiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vYmFyZGluZzogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGlzY29tOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vdGhyb3dvZmY6IENPTFVNTi5CT09MLFxuICAgICAgYmlyZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWNheXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBjdWJtb3RoZXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2xhbW91cjogQ09MVU1OLkJPT0wsXG4gICAgICBnZW1wcm9kOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgZml4ZWRuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgIH0sXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG5cbiAgJy4uLy4uL2dhbWVkYXRhL01hZ2ljU2l0ZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdNYWdpY1NpdGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL01lcmNlbmFyeS5jc3YnOiB7XG4gICAgbmFtZTogJ01lcmNlbmFyeScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYWZmbGljdGlvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBZmZsaWN0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYW5vbl9wcm92aW5jZV9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdBbm9uUHJvdmluY2VFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVfa2V5cy5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUtleScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgLy8gVE9ETyAtIGdvdCBzb21lIGJpZyBib2lzIGluIGhlcmUuXG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RfbW9kaWZpZXJfYml0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19pbmZvLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxFZmZlY3RJbmZvJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c193ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0V2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lbmNoYW50bWVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFbmNoYW50bWVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2V2ZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0V2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFnaWNfcGF0aHMuY3N2Jzoge1xuICAgIG5hbWU6ICdNYWdpY1BhdGgnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYXBfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5UeXBlQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbW9uc3Rlcl90YWdzLmNzdic6IHtcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hbWV0eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ05hbWVUeXBlJyxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hdGlvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvb3RoZXJfcGxhbmVzLmNzdic6IHtcbiAgICBuYW1lOiAnT3RoZXJQbGFuZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3ByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdQcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3Byb3RlY3Rpb25zX2J5X2FybW9yLmNzdic6IHtcbiAgICBuYW1lOiAnUHJvdGVjdGlvbkJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3JlYWxtcy5jc3YnOiB7XG4gICAgbmFtZTogJ1JlYWxtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc2l0ZV90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnU2l0ZVRlcnJhaW5UeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF9kYW1hZ2VfdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsRGFtYWdlVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfdW5pcXVlX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsVW5pcXVlU3VtbW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VuaXRfZWZmZWN0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXRFZmZlY3QnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bnByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdVbnByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1dlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ3dlYXBvbiddKSxcbiAgfSxcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzLCBSb3cgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7XG4gIFNjaGVtYSxcbiAgVGFibGUsXG4gIENPTFVNTixcbiAgYXJnc0Zyb21UZXh0LFxuICBhcmdzRnJvbVR5cGUsXG4gIENvbHVtbkFyZ3MsXG4gIGZyb21BcmdzXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5sZXQgX25leHRBbm9uU2NoZW1hSWQgPSAxO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRDU1YgKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4sXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxudHlwZSBDcmVhdGVFeHRyYUZpZWxkID0gKFxuICBpbmRleDogbnVtYmVyLFxuICBhOiBTY2hlbWFBcmdzLFxuICBuYW1lOiBzdHJpbmcsXG4gIG92ZXJyaWRlPzogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksXG4pID0+IENvbHVtbkFyZ3M7XG5cbmV4cG9ydCB0eXBlIFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgbmFtZT86IHN0cmluZyxcbiAgaWdub3JlRmllbGRzOiBTZXQ8c3RyaW5nPjtcbiAgc2VwYXJhdG9yOiBzdHJpbmc7XG4gIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+O1xuICBrbm93bkZpZWxkczogUmVjb3JkPHN0cmluZywgQ09MVU1OPixcbiAgZXh0cmFGaWVsZHM6IFJlY29yZDxzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGQ+LFxufVxuXG5jb25zdCBERUZBVUxUX09QVElPTlM6IFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgaWdub3JlRmllbGRzOiBuZXcgU2V0KCksXG4gIG92ZXJyaWRlczoge30sXG4gIGtub3duRmllbGRzOiB7fSxcbiAgZXh0cmFGaWVsZHM6IHt9LFxuICBzZXBhcmF0b3I6ICdcXHQnLCAvLyBzdXJwcmlzZSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUoXG4gIHJhdzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XG4pOiBUYWJsZSB7XG4gIGNvbnN0IF9vcHRzID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiBfb3B0cy5uYW1lID8/IGBTY2hlbWFfJHtfbmV4dEFub25TY2hlbWFJZCsrfWAsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBvdmVycmlkZXM6IF9vcHRzLm92ZXJyaWRlcyxcbiAgfTtcblxuICBpZiAocmF3LmluZGV4T2YoJ1xcMCcpICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCd1aCBvaCcpXG5cbiAgY29uc3QgW3Jhd0ZpZWxkcywgLi4ucmF3RGF0YV0gPSByYXdcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KF9vcHRzLnNlcGFyYXRvcikpO1xuXG4gIGNvbnN0IGhDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKCFmKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gXCIke2Z9XCIgaXMgYSBkdXBsaWNhdGUgZmllbGQgbmFtZWApO1xuICAgICAgY29uc3QgbiA9IGhDb3VudC5nZXQoZikhXG4gICAgICByYXdGaWVsZHNbaV0gPSBgJHtmfS4ke259YDtcbiAgICB9IGVsc2Uge1xuICAgICAgaENvdW50LnNldChmLCAxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByYXdDb2x1bW5zOiBDb2x1bW5BcmdzW10gPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIG5hbWVdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBsZXQgYzogbnVsbCB8IENvbHVtbkFyZ3MgPSBudWxsO1xuICAgIHNjaGVtYUFyZ3MucmF3RmllbGRzW25hbWVdID0gaW5kZXg7XG4gICAgaWYgKF9vcHRzLmlnbm9yZUZpZWxkcz8uaGFzKG5hbWUpKSBjb250aW51ZTtcbiAgICBpZiAoX29wdHMua25vd25GaWVsZHNbbmFtZV0pIHtcbiAgICAgIGMgPSBhcmdzRnJvbVR5cGUoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIF9vcHRzLmtub3duRmllbGRzW25hbWVdLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYyA9IGFyZ3NGcm9tVGV4dChcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICAgICAgcmF3RGF0YSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYEdPT0IgSU5URVJDRVBURUQgSU4gJHtzY2hlbWFBcmdzLm5hbWV9OiBcXHgxYlszMW0ke2luZGV4fToke25hbWV9XFx4MWJbMG1gLFxuICAgICAgICAgICAgZXhcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZXhcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgcmF3Q29sdW1ucy5wdXNoKGMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zPy5leHRyYUZpZWxkcykge1xuICAgIGNvbnN0IGJpID0gT2JqZWN0LnZhbHVlcyhzY2hlbWFBcmdzLnJhd0ZpZWxkcykubGVuZ3RoOyAvLyBobW1tbVxuICAgIHJhd0NvbHVtbnMucHVzaCguLi5PYmplY3QuZW50cmllcyhvcHRpb25zLmV4dHJhRmllbGRzKS5tYXAoXG4gICAgICAoW25hbWUsIGNyZWF0ZUNvbHVtbl06IFtzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGRdLCBlaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV07XG4gICAgICAgIC8vY29uc29sZS5sb2coZWksIHNjaGVtYUFyZ3MucmF3RmllbGRzKVxuICAgICAgICBjb25zdCBpbmRleCA9IGJpICsgZWk7XG4gICAgICAgIGNvbnN0IGNhID0gY3JlYXRlQ29sdW1uKGluZGV4LCBzY2hlbWFBcmdzLCBuYW1lLCBvdmVycmlkZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNhLmluZGV4ICE9PSBpbmRleCkgdGhyb3cgbmV3IEVycm9yKCd3aXNlZ3V5IHBpY2tlZCBoaXMgb3duIGluZGV4Jyk7XG4gICAgICAgICAgaWYgKGNhLm5hbWUgIT09IG5hbWUpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBuYW1lJyk7XG4gICAgICAgICAgaWYgKGNhLnR5cGUgPT09IENPTFVNTi5CT09MKSB7XG4gICAgICAgICAgICBpZiAoY2EuYml0ICE9PSBzY2hlbWFBcmdzLmZsYWdzVXNlZCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIGJhYnkgaWRpb3QnKTtcbiAgICAgICAgICAgIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNhLCB7IGluZGV4LCBvdmVycmlkZSwgbmFtZSwgfSlcbiAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2E7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgY29sQXJncyBvZiByYXdDb2x1bW5zKSB7XG4gICAgY29uc3QgY29sID0gZnJvbUFyZ3MoY29sQXJncyk7XG4gICAgc2NoZW1hQXJncy5jb2x1bW5zLnB1c2goY29sKTtcbiAgICBzY2hlbWFBcmdzLmZpZWxkcy5wdXNoKGNvbC5uYW1lKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgY29sIG9mIHNjaGVtYUFyZ3MuY29sdW1ucykge1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdW2NvbC5pbmRleF0sXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXSxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKGRhdGEsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VBbGwoZGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+Pikge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVmcykubWFwKChbcGF0aCwgb3B0aW9uc10pID0+IHJlYWRDU1YocGF0aCwgb3B0aW9ucykpXG4gICk7XG59XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuY29uc29sZS5sb2coJ0FSR1MnLCB7IGZpbGUsIGZpZWxkcyB9KVxuXG5pZiAoZmlsZSkge1xuICBjb25zdCBkZWYgPSBjc3ZEZWZzW2ZpbGVdO1xuICBpZiAoZGVmKSBnZXREVU1QWShhd2FpdCByZWFkQ1NWKGZpbGUsIGRlZikpO1xufSBlbHNlIHtcbiAgY29uc3QgZGVzdCA9ICcuL2RhdGEvZGIuYmluJ1xuICBjb25zdCB0YWJsZXMgPSBhd2FpdCBwYXJzZUFsbChjc3ZEZWZzKTtcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbi8qXG5pZiAoZmlsZSkge1xuICBjb25zdCBkZWYgPSBjc3ZEZWZzW2ZpbGVdO1xuICBpZiAoZGVmKSBnZXREVU1QWShhd2FpdCByZWFkQ1NWKGZpbGUsIGRlZikpO1xuICBlbHNlIHRocm93IG5ldyBFcnJvcihgbm8gZGVmIGZvciBcIiR7ZmlsZX1cImApO1xufSBlbHNlIHtcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIGF3YWl0IGdldERVTVBZKHQpO1xufVxuKi9cblxuXG5hc3luYyBmdW5jdGlvbiBnZXREVU1QWSh0OiBUYWJsZSkge1xuICAvL2NvbnN0IG4gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAodC5yb3dzLmxlbmd0aCAtIDMwKSk7XG4gIGNvbnN0IG4gPSA3MDA7XG4gIGNvbnN0IG0gPSBuICsgMzA7XG4gIGNvbnN0IGYgPSBmaWVsZHMubGVuZ3RoID8gZmllbGRzIDogdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDgpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuICAgICAgIEJFRk9SRTonKTtcbiAgZm9yIChjb25zdCBjIG9mIGYpIHtcbiAgICBjb25zb2xlLmxvZyhgIC0gJHtjfSA6ICR7dC5zY2hlbWEuY29sdW1uc0J5TmFtZVtjXS5sYWJlbH1gKVxuICB9XG4gIHQucHJpbnQod2lkdGgsIGYsIG4sIG0pO1xuICB0LnNjaGVtYS5wcmludCgpO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgKGdsb2JhbFRoaXMuX1JPV1MgPz89IHt9KVt0LnNjaGVtYS5uYW1lXSA9IHQucm93cztcbiAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyhbdF0pO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuICAgICAgICBBRlRFUjonKTtcbiAgT2JqZWN0LnZhbHVlcyh1KVswXT8ucHJpbnQod2lkdGgsIGYsIG4sIG0pO1xuICB1LlVuaXQuc2NoZW1hLnByaW50KHdpZHRoKTtcbiAgLy9hd2FpdCB3cml0ZUZpbGUoJy4vdG1wLmJpbicsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsSUFBTSxnQkFBZ0IsSUFBSSxZQUFZO0FBQ3RDLElBQU0sZ0JBQWdCLElBQUksWUFBWTtBQUkvQixTQUFTLGNBQWUsR0FBVyxNQUFtQixJQUFJLEdBQUc7QUFDbEUsTUFBSSxFQUFFLFFBQVEsSUFBSSxNQUFNLElBQUk7QUFDMUIsVUFBTUEsS0FBSSxFQUFFLFFBQVEsSUFBSTtBQUN4QixZQUFRLE1BQU0sR0FBR0EsRUFBQyxpQkFBaUIsRUFBRSxNQUFNQSxLQUFJLElBQUlBLEtBQUksRUFBRSxDQUFDLEtBQUs7QUFDL0QsVUFBTSxJQUFJLE1BQU0sVUFBVTtBQUFBLEVBQzVCO0FBQ0EsUUFBTSxRQUFRLGNBQWMsT0FBTyxJQUFJLElBQUk7QUFDM0MsTUFBSSxNQUFNO0FBQ1IsU0FBSyxJQUFJLE9BQU8sQ0FBQztBQUNqQixXQUFPLE1BQU07QUFBQSxFQUNmLE9BQU87QUFDTCxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRU8sU0FBUyxjQUFjLEdBQVcsR0FBaUM7QUFDeEUsTUFBSSxJQUFJO0FBQ1IsU0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUc7QUFBRTtBQUFBLEVBQUs7QUFDOUIsU0FBTyxDQUFDLGNBQWMsT0FBTyxFQUFFLE1BQU0sR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0RDtBQUVPLFNBQVMsY0FBZSxHQUF1QjtBQUVwRCxRQUFNLFFBQVEsQ0FBQyxDQUFDO0FBQ2hCLE1BQUksSUFBSSxJQUFJO0FBQ1YsU0FBSyxDQUFDO0FBQ04sVUFBTSxDQUFDLElB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Q0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxhQUFhO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1B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QUFPLGNBQWMsQ0FBQyxFQUFFLEtBQUssRUFBRTtBQUFBLEVBQzVEO0FBQ0EsSUFBRSxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDdEIsSUFBRSxPQUFPLE1BQU07QUFDZixVQUFRLElBQUksVUFBVTtBQUN0QixHQUFDLFdBQVcsVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLElBQUksSUFBSSxFQUFFO0FBQzdDLFFBQU0sSUFBSSxRQUFRLE9BQUssV0FBVyxHQUFHLEdBQUksQ0FBQztBQUMxQyxRQUFNLE9BQU8sTUFBTSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQ25DLFVBQVEsSUFBSSxNQUFNO0FBQ2xCLFFBQU0sSUFBSSxNQUFNLE1BQU0sU0FBUyxJQUFJO0FBQ25DLFVBQVEsSUFBSSxvQkFBb0I7QUFDaEMsU0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0FBQ3pDLElBQUUsS0FBSyxPQUFPLE1BQU0sS0FBSztBQUUzQjsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJpIiwgImZpZWxkcyIsICJ3aWR0aCIsICJ3aWR0aCIsICJmaWVsZHMiXQp9Cg==
