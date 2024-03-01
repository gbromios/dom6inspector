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
  joins;
  key;
  columnsByName;
  fixedWidth;
  // total bytes used by numbers + flags
  flagFields;
  stringFields;
  bigFields;
  constructor({ columns, name, flagsUsed, key, joins }) {
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
    if (joins) {
      const [a, b2, ...r] = joins.split(":");
      const [aT, aF, ...aR] = a?.split(".");
      const [bT, bF, ...bR] = b2?.split(".");
      if (!a || !b2 || r.length)
        throw new Error(`bad join: ${joins}`);
      if (!aT || !aF || aR.length)
        throw new Error(`bad join left side ${a}`);
      if (!bT || !bF || bR.length)
        throw new Error(`bad join right side ${b2}`);
      if (aT === bT && aF === bF)
        throw new Error(`cant join entity to itself (${joins})`);
      if (!this.columnsByName[aF])
        throw new Error(`bad join left side ${a}: unknown key "${aF}"`);
      if (!this.columnsByName[bF])
        throw new Error(`bad join right side ${b2}: unknown key "${bF}"`);
      this.joins = [aT, aF, bT, bF];
    }
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
    let joins;
    const bytes = new Uint8Array(buffer);
    [name, read] = bytesToString(i, bytes);
    i += read;
    [key, read] = bytesToString(i, bytes);
    i += read;
    [joins, read] = bytesToString(i, bytes);
    i += read;
    if (!joins)
      joins = void 0;
    const args = {
      name,
      key,
      joins,
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
      ...this.serializeJoins(),
      this.columns.length & 255,
      this.columns.length >>> 8,
      ...this.columns.flatMap((c) => c.serialize())
    ]);
    return new Blob([parts]);
  }
  serializeJoins() {
    if (!this.joins)
      return new Uint8Array(1);
    const [aT, aF, bT, bF] = this.joins;
    return stringToBytes(`${aT}.${aF}:${bT}.${bF}`);
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
    const tableMap = Object.fromEntries(tables.map((t) => [t.schema.name, t]));
    for (const t of tables) {
      if (!t.schema.joins)
        continue;
      const [aT, aF, bT, bF] = t.schema.joins;
      const tA = tableMap[aT];
      const tB = tableMap[bT];
      if (!tA)
        throw new Error(`${t.name} joins undefined table ${aT}`);
      if (!tB)
        throw new Error(`${t.name} joins undefined table ${bT}`);
      if (!t.rows.length)
        continue;
      for (const r of t.rows) {
        const idA = r[aF];
        const idB = r[bF];
        if (idA === void 0 || idB === void 0) {
          console.error(`row has a bad id?`, r);
          continue;
        }
        const a = tA.map.get(idA);
        const b = tB.map.get(idB);
        if (a === void 0) {
          console.error(`row has a missing id?`, a, idA, r);
          continue;
        }
        if (b === void 0) {
          console.error(`row has a missing id?`, b, idB, r);
          continue;
        }
        (a[t.name] ??= []).push(r);
        (b[t.name] ??= []).push(r);
      }
    }
    return tableMap;
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
      // combined into an array field
      "armor1",
      "armor2",
      "armor3",
      "armor4",
      "end",
      "wpn1",
      "wpn2",
      "wpn3",
      "wpn4",
      "wpn5",
      "wpn6",
      "wpn7",
      // all combined into one array field
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
      // deprecated
      "mounted",
      // redundant
      "reanimator~1"
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
      //just a copy of reanimator...
      //'reanimator~1': COLUMN.U8,
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
      // mounted: COLUMN.BOOL, // deprecated
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
      type: (index, args) => {
        const sdIndex = args.rawFields["startdom"];
        return {
          index,
          name: "type",
          type: 5 /* U16 */,
          width: 2,
          override(v, u, a) {
            if (u[sdIndex])
              return 3;
            else
              return 0;
          }
        };
      },
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
    ignoreFields: /* @__PURE__ */ new Set(["end", "itemcost1~1", "warning~1"])
  },
  "../../gamedata/MagicSites.csv": {
    name: "MagicSite",
    key: "id",
    ignoreFields: /* @__PURE__ */ new Set(["domconflict~1", "end"])
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
    name: "NonFortTroopTypeByNation",
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
      rawFields[i] = `${f}~${n}`;
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

// src/cli/join-tables.ts
function joinDumped(tableList) {
  const tables = Object.fromEntries(tableList.map((t) => [t.name, t]));
  tableList.push(
    makeNationSites(tables),
    makeUnitBySite(tables),
    makeSpellByNation(tables),
    makeSpellByUnit(tables),
    makeUnitByNation(tables)
  );
}
function makeNationSites(tables) {
  const { AttributeByNation } = tables;
  const delRows = [];
  const schema = new Schema({
    name: "SiteByNation",
    key: "__rowId",
    flagsUsed: 1,
    overrides: {},
    rawFields: {},
    joins: "Nation.nationId:MagicSite.siteId",
    fields: [
      "nationId",
      "siteId",
      "future"
    ],
    columns: [
      new NumericColumn({
        name: "nationId",
        index: 0,
        type: 3 /* U8 */
      }),
      new NumericColumn({
        name: "siteId",
        index: 1,
        type: 5 /* U16 */
      }),
      new BoolColumn({
        name: "future",
        index: 2,
        type: 2 /* BOOL */,
        bit: 0,
        flag: 1
      })
    ]
  });
  const rows = [];
  for (let [i, row] of AttributeByNation.rows.entries()) {
    const { nation_number: nationId, attribute, raw_value: siteId } = row;
    let future = false;
    switch (attribute) {
      case 631:
        future = true;
      case 52:
      case 100:
      case 25:
        break;
      default:
        continue;
    }
    rows.push({
      nationId,
      siteId,
      future,
      __rowId: rows.length
    });
    delRows.push(i);
  }
  let di;
  while ((di = delRows.pop()) !== void 0)
    AttributeByNation.rows.splice(di, 1);
  return tables[schema.name] = new Table(rows, schema);
}
function makeSpellByNation(tables) {
  const attrs = tables.AttributeBySpell;
  const delRows = [];
  const schema = new Schema({
    name: "SpellByNation",
    key: "__rowId",
    joins: "Spell.spellId:Nation.nationId",
    flagsUsed: 0,
    overrides: {},
    rawFields: { spellId: 0, nationId: 1 },
    fields: ["spellId", "nationId"],
    columns: [
      new NumericColumn({
        name: "spellId",
        index: 0,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "nationId",
        index: 1,
        type: 3 /* U8 */
      })
    ]
  });
  let __rowId = 0;
  const rows = [];
  for (const [i, r] of attrs.rows.entries()) {
    const { spell_number: spellId, attribute, raw_value } = r;
    if (attribute === 278) {
      const nationId = Number(raw_value);
      if (!Number.isSafeInteger(nationId) || nationId < 0 || nationId > 255)
        throw new Error(`     !!!!! TOO BIG NAYSH !!!!! (${nationId})`);
      delRows.push(i);
      rows.push({ __rowId, spellId, nationId });
      __rowId++;
    }
  }
  let di;
  while ((di = delRows.pop()) !== void 0)
    attrs.rows.splice(di, 1);
  return tables[schema.name] = new Table(rows, schema);
}
function makeSpellByUnit(tables) {
  const attrs = tables.AttributeBySpell;
  const delRows = [];
  const schema = new Schema({
    name: "SpellByUnit",
    key: "__rowId",
    joins: "Spell.spellId:Unit.unitId",
    flagsUsed: 0,
    overrides: {},
    rawFields: { spellId: 0, unitId: 1 },
    fields: ["spellId", "unitId"],
    columns: [
      new NumericColumn({
        name: "spellId",
        index: 0,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "unitId",
        index: 1,
        type: 8 /* I32 */
      })
    ]
  });
  let __rowId = 0;
  const rows = [];
  for (const [i, r] of attrs.rows.entries()) {
    const { spell_number: spellId, attribute, raw_value } = r;
    if (attribute === 731) {
      console.log(`${spellId} IS RESTRICTED TO UNIT ${raw_value}`);
      const unitId = Number(raw_value);
      if (!Number.isSafeInteger(unitId))
        throw new Error(`     !!!!! TOO BIG UNIT !!!!! (${unitId})`);
      delRows.push(i);
      rows.push({ __rowId, spellId, unitId });
      __rowId++;
    }
  }
  let di = void 0;
  while ((di = delRows.pop()) !== void 0)
    attrs.rows.splice(di, 1);
  return tables[schema.name] = new Table(rows, schema);
}
var S_HMONS = Array.from("12345", (n) => `hmon${n}`);
var S_HCOMS = Array.from("1234", (n) => `hcom${n}`);
var S_RMONS = Array.from("12", (n) => `mon${n}`);
var S_RCOMS = Array.from("123", (n) => `com${n}`);
var S_SUMNS = Array.from("1234", (n) => [`sum${n}`, `n_sum${n}`]);
function makeUnitBySite(tables) {
  const { MagicSite, SiteByNation, Unit } = tables;
  if (!SiteByNation)
    throw new Error("do site by nation first");
  const snMap = /* @__PURE__ */ new Map();
  const schema = new Schema({
    name: "UnitBySite",
    key: "__rowId",
    joins: "Unit.unitId:MagicSite.siteId",
    // TODO - tbh... kinda joins nation aswell
    flagsUsed: 0,
    overrides: {},
    rawFields: { siteId: 0, unitId: 1, recType: 2, recArg: 3 },
    fields: ["siteId", "unitId", "recType", "recArg"],
    columns: [
      new NumericColumn({
        name: "siteId",
        index: 0,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "unitId",
        index: 1,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "recType",
        index: 2,
        type: 3 /* U8 */
      }),
      new NumericColumn({
        name: "recArg",
        index: 3,
        type: 3 /* U8 */
      })
      // TODO - MOAR STUFF
    ]
  });
  const rows = [];
  for (const site of MagicSite.rows) {
    for (const k of S_HMONS) {
      const mnr = site[k];
      if (!mnr)
        break;
      let recArg = snMap.get(site.id);
      if (!recArg)
        snMap.set(
          site.id,
          recArg = SiteByNation.rows.find((r) => r.siteId === site.id)?.nationId
        );
      if (!recArg) {
        console.error("mixed up cap-only site", k, site.id, site.name);
        recArg = 0;
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recArg,
        recType: 0 /* HOME_MON */
      });
    }
    for (const k of S_HCOMS) {
      const mnr = site[k];
      if (!mnr)
        break;
      let recArg = snMap.get(site.id);
      if (!recArg)
        snMap.set(
          site.id,
          recArg = SiteByNation.rows.find((r) => r.siteId === site.id)?.nationId
        );
      if (!recArg) {
        console.error("mixed up cap-only site", k, site.id, site.name);
        recArg = 0;
      }
      const unit = Unit.map.get(mnr);
      if (unit) {
        unit.type |= 1;
      } else {
        console.error("mixed up cap-only site (no unit in unit table?)", site);
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recArg,
        recType: 1 /* HOME_COM */
      });
    }
    for (const k of S_RMONS) {
      const mnr = site[k];
      if (!mnr)
        break;
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: 2 /* REC_MON */,
        recArg: 0
      });
    }
    for (const k of S_RCOMS) {
      const mnr = site[k];
      if (!mnr)
        break;
      const unit = Unit.map.get(mnr);
      if (unit) {
        unit.type |= 1;
      } else {
        console.error("mixed up site commander (no unit in unit table?)", site);
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: 2 /* REC_MON */,
        recArg: 0
      });
    }
    for (const [k, nk] of S_SUMNS) {
      const mnr = site[k];
      if (!mnr)
        break;
      const arg = site[nk];
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: 8 /* SUMMON */,
        recArg: arg
        // level requiurement (could also include path)
      });
    }
    if (site.nationalrecruits) {
      if (site.natmon)
        rows.push({
          __rowId: rows.length,
          siteId: site.id,
          unitId: site.natmon,
          recType: 4 /* NAT_MON */,
          recArg: site.nationalrecruits
        });
      if (site.natcom) {
        rows.push({
          __rowId: rows.length,
          siteId: site.id,
          unitId: site.natcom,
          recType: 5 /* NAT_COM */,
          recArg: site.nationalrecruits
        });
        const unit = Unit.map.get(site.natcom);
        if (unit) {
          unit.type |= 1;
        } else {
          console.error("mixed up natcom (no unit in unit table?)", site);
        }
      }
    }
  }
  return tables[schema.name] = new Table(rows, schema);
}
function makeUnitByNation(tables) {
  const {
    AttributeByNation,
    Unit,
    CoastLeaderTypeByNation,
    CoastTroopTypeByNation,
    FortLeaderTypeByNation,
    FortTroopTypeByNation,
    NonFortLeaderTypeByNation,
    NonFortTroopTypeByNation,
    PretenderTypeByNation,
    UnpretenderTypeByNation
  } = tables;
  const schema = new Schema({
    name: "UnitByNation",
    key: "__rowId",
    flagsUsed: 0,
    overrides: {},
    rawFields: { nationId: 0, unitId: 1, recType: 2 },
    joins: "Nation.nationId:Unit.unitId",
    fields: ["nationId", "unitId", "recType"],
    columns: [
      new NumericColumn({
        name: "nationId",
        index: 0,
        type: 3 /* U8 */
      }),
      new NumericColumn({
        name: "unitId",
        index: 1,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "recType",
        index: 1,
        type: 3 /* U8 */
      })
    ]
  });
  const delABNRows = [];
  const rows = [];
  for (const [iABN, r] of AttributeByNation.rows.entries()) {
    const { raw_value, attribute, nation_number } = r;
    let unit;
    let unitId = null;
    let unitType = 0;
    let recType = 0;
    switch (attribute) {
      case 158:
      case 159:
        unit = Unit.map.get(raw_value);
        if (!unit)
          throw new Error("piss unit");
        unitId = unit.landshape || unit.id;
        recType = 4 /* COAST */;
        unitType = 1 /* COMMANDER */;
        break;
      case 160:
      case 161:
      case 162:
        unit = Unit.map.get(raw_value);
        if (!unit)
          throw new Error("piss unit");
        unitId = unit.landshape || unit.id;
        recType = 4 /* COAST */;
        break;
      case 163:
        unitType = 1 /* COMMANDER */;
        break;
      case 186:
        unit = Unit.map.get(raw_value);
        if (!unit)
          throw new Error("piss unit");
        unitId = unit.watershape || unit.id;
        recType = 3 /* WATER */;
        unitType = 1 /* COMMANDER */;
        break;
      case 187:
      case 189:
      case 190:
      case 191:
      case 213:
        unit = Unit.map.get(raw_value);
        if (!unit)
          throw new Error("piss unit");
        unitId = unit.watershape || unit.id;
        recType = 3 /* WATER */;
        break;
      case 294:
      case 412:
        unitId = raw_value;
        recType = 5 /* FOREST */;
        break;
      case 295:
      case 413:
        unitId = raw_value;
        recType = 5 /* FOREST */;
        unitType = 1 /* COMMANDER */;
        break;
      case 296:
        unitId = raw_value;
        recType = 6 /* SWAMP */;
        break;
      case 297:
        unitId = raw_value;
        recType = 6 /* SWAMP */;
        unitType = 1 /* COMMANDER */;
        break;
      case 298:
      case 408:
        unitId = raw_value;
        recType = 8 /* MOUNTAIN */;
        break;
      case 299:
      case 409:
        unitId = raw_value;
        recType = 8 /* MOUNTAIN */;
        unitType = 1 /* COMMANDER */;
        break;
      case 300:
      case 416:
        unitId = raw_value;
        recType = 7 /* WASTE */;
        break;
      case 301:
      case 417:
        unitId = raw_value;
        recType = 7 /* WASTE */;
        unitType = 1 /* COMMANDER */;
        break;
      case 302:
        unitId = raw_value;
        recType = 9 /* CAVE */;
        break;
      case 303:
        unitId = raw_value;
        recType = 9 /* CAVE */;
        unitType = 1 /* COMMANDER */;
        break;
      case 404:
      case 406:
        unitId = raw_value;
        recType = 10 /* PLAINS */;
        break;
      case 405:
      case 407:
        unitId = raw_value;
        recType = 10 /* PLAINS */;
        unitType = 1 /* COMMANDER */;
        break;
      case 139:
      case 140:
      case 141:
      case 142:
      case 143:
      case 144:
        console.log("HERO FINDER FOUND", raw_value);
        unitId = raw_value;
        unitType = 1 /* COMMANDER */ | 8 /* HERO */;
        recType = 11 /* HERO */;
        break;
      case 145:
      case 146:
      case 149:
        unitId = raw_value;
        unitType = 1 /* COMMANDER */ | 8 /* HERO */;
        recType = 12 /* MULTIHERO */;
        break;
    }
    if (unitId == null)
      continue;
    delABNRows.push(iABN);
    unit ??= Unit.map.get(unitId);
    if (unitType)
      unit.type |= unitType;
    if (!unit)
      console.error("more piss unit:", iABN, unitId);
    rows.push({
      unitId,
      recType,
      __rowId: rows.length,
      nationId: nation_number
    });
  }
  let di;
  while ((di = delABNRows.pop()) !== void 0)
    AttributeByNation.rows.splice(di, 1);
  for (const r of FortTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 0 /* FORT */
    });
  }
  for (const r of FortLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit)
      console.error("fort piss commander:", r);
    else
      unit.type |= 1 /* COMMANDER */;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 0 /* FORT */
    });
  }
  for (const r of CoastTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 4 /* COAST */
    });
  }
  for (const r of CoastLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit)
      console.error("fort piss commander:", r);
    else
      unit.type |= 1 /* COMMANDER */;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 4 /* COAST */
    });
  }
  for (const r of NonFortTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 2 /* FOREIGN */
    });
  }
  for (const r of NonFortLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit)
      console.error("fort piss commander:", r);
    else
      unit.type |= 1 /* COMMANDER */;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: 2 /* FOREIGN */
    });
  }
  CoastLeaderTypeByNation.rows.splice(0, Infinity);
  CoastTroopTypeByNation.rows.splice(0, Infinity);
  FortLeaderTypeByNation.rows.splice(0, Infinity);
  FortTroopTypeByNation.rows.splice(0, Infinity);
  NonFortLeaderTypeByNation.rows.splice(0, Infinity);
  NonFortTroopTypeByNation.rows.splice(0, Infinity);
  return new Table(rows, schema);
}

// src/cli/dump-csvs.ts
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
  joinDumped(tables);
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
    fields.splice(1, 2);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vLi4vbGliL3NyYy9jb2x1bW4udHMiLCAiLi4vLi4vbGliL3NyYy91dGlsLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2NoZW1hLnRzIiwgIi4uLy4uL2xpYi9zcmMvdGFibGUudHMiLCAiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyIsICIuLi9zcmMvY2xpL2pvaW4tdGFibGVzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICAvLyBXT09QU0lFXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDhuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCAgICAgICA9IDAsXG4gIFNUUklORyAgICAgICA9IDEsXG4gIEJPT0wgICAgICAgICA9IDIsXG4gIFU4ICAgICAgICAgICA9IDMsXG4gIEk4ICAgICAgICAgICA9IDQsXG4gIFUxNiAgICAgICAgICA9IDUsXG4gIEkxNiAgICAgICAgICA9IDYsXG4gIFUzMiAgICAgICAgICA9IDcsXG4gIEkzMiAgICAgICAgICA9IDgsXG4gIEJJRyAgICAgICAgICA9IDksXG4gIFNUUklOR19BUlJBWSA9IDE3LFxuICBVOF9BUlJBWSAgICAgPSAxOSxcbiAgSThfQVJSQVkgICAgID0gMjAsXG4gIFUxNl9BUlJBWSAgICA9IDIxLFxuICBJMTZfQVJSQVkgICAgPSAyMixcbiAgVTMyX0FSUkFZICAgID0gMjMsXG4gIEkzMl9BUlJBWSAgICA9IDI0LFxuICBCSUdfQVJSQVkgICAgPSAyNSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HX0FSUkFZJyxcbiAgJ1U4X0FSUkFZJyxcbiAgJ0k4X0FSUkFZJyxcbiAgJ1UxNl9BUlJBWScsXG4gICdJMTZfQVJSQVknLFxuICAnVTMyX0FSUkFZJyxcbiAgJ0kzMl9BUlJBWScsXG4gICdCSUdfQVJSQVknLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgfENPTFVNTi5VOF9BUlJBWVxuICB8Q09MVU1OLkk4X0FSUkFZXG4gIHxDT0xVTU4uVTE2X0FSUkFZXG4gIHxDT0xVTU4uSTE2X0FSUkFZXG4gIHxDT0xVTU4uVTMyX0FSUkFZXG4gIHxDT0xVTU4uSTMyX0FSUkFZXG4gIDtcblxuY29uc3QgQ09MVU1OX1dJRFRIOiBSZWNvcmQ8TlVNRVJJQ19DT0xVTU4sIDF8Mnw0PiA9IHtcbiAgW0NPTFVNTi5VOF06IDEsXG4gIFtDT0xVTU4uSThdOiAxLFxuICBbQ09MVU1OLlUxNl06IDIsXG4gIFtDT0xVTU4uSTE2XTogMixcbiAgW0NPTFVNTi5VMzJdOiA0LFxuICBbQ09MVU1OLkkzMl06IDQsXG4gIFtDT0xVTU4uVThfQVJSQVldOiAxLFxuICBbQ09MVU1OLkk4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5VMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLkkxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uVTMyX0FSUkFZXTogNCxcbiAgW0NPTFVNTi5JMzJfQVJSQVldOiA0LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvTnVtZXJpY1R5cGUgKFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXJcbik6IE5VTUVSSUNfQ09MVU1OfG51bGwge1xuICBpZiAobWluIDwgMCkge1xuICAgIC8vIHNvbWUga2luZGEgbmVnYXRpdmU/P1xuICAgIGlmIChtaW4gPj0gLTEyOCAmJiBtYXggPD0gMTI3KSB7XG4gICAgICAvLyBzaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5JODtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMzI3NjggJiYgbWF4IDw9IDMyNzY3KSB7XG4gICAgICAvLyBzaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uSTE2O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0yMTQ3NDgzNjQ4ICYmIG1heCA8PSAyMTQ3NDgzNjQ3KSB7XG4gICAgICAvLyBzaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5JMzI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChtYXggPD0gMjU1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLlU4O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDY1NTM1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5VMTY7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNDI5NDk2NzI5NSkge1xuICAgICAgLy8gdW5zaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5VMzI7XG4gICAgfVxuICB9XG4gIC8vIEdPVE86IEJJR09PT09PT09PQk9PT09PWU9cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bWVyaWNDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgTlVNRVJJQ19DT0xVTU4ge1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5TVFJJTkc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbHVtbjxUID0gYW55LCBSIGV4dGVuZHMgVWludDhBcnJheXxudW1iZXIgPSBhbnk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUW107XG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVDtcbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVFtdLCBudW1iZXJdO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogVCk6IFIsXG4gIHNlcmlhbGl6ZUFycmF5ICh2OiBUW10pOiBSLFxuICB0b1N0cmluZyAodjogc3RyaW5nKTogYW55O1xuICByZWFkb25seSB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICByZWFkb25seSBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgb3JkZXI6IG51bWJlcjtcbiAgcmVhZG9ubHkgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48c3RyaW5nLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihgc2VlbXMgb3ZlcnJpZGUgZm9yICR7bmFtZX0gZG9lcyBub3QgcmV0dXJuIGEgc3RyaW5nYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZyB7XG4gICAgLy8gVE9ETyAtIG5lZWQgdG8gdmVyaWZ5IHRoZXJlIGFyZW4ndCBhbnkgc2luZ2xlIHF1b3Rlcz9cbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmdbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgc3RyaW5ncy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW3N0cmluZ3MsIHJlYWRdXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogc3RyaW5nW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uc3RyaW5nVG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlcltdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/ICggdGhpcy5vdmVycmlkZSh2LCB1LCBhKSApIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXJbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgICAgIG51bWJlcnMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtudW1iZXJzLCByZWFkXTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgICBpZiAodGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2ltIGFycmF5IHRobycpXG4gICAgICByZXR1cm4gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgbnVtYmVyRnJvbVZpZXcgKGk6IG51bWJlciwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSAmIDE1KSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignd2hvbXN0Jyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICB0aGlzLnB1dEJ5dGVzKHYsIDAsIGJ5dGVzKTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBudW1iZXJbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMSArIHRoaXMud2lkdGggKiB2Lmxlbmd0aClcbiAgICBsZXQgaSA9IDE7XG4gICAgZm9yIChjb25zdCBuIG9mIHYpIHtcbiAgICAgIGJ5dGVzWzBdKys7XG4gICAgICB0aGlzLnB1dEJ5dGVzKG4sIGksIGJ5dGVzKTtcbiAgICAgIGkrPXRoaXMud2lkdGg7XG4gICAgfVxuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHByaXZhdGUgcHV0Qnl0ZXModjogbnVtYmVyLCBpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tpICsgb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVlcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzQmlnQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmlzQXJyYXkgPSAodHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuXG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludFtdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnRbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IGJpZ2JvaXM6IGJpZ2ludFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgYmlnYm9pcy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW2JpZ2JvaXMsIHJlYWRdO1xuXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogYmlnaW50W10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uYmlnQm95VG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMgQklHP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuID0gZmFsc2U7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYm9vbGApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbmV2ZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKF9pOiBudW1iZXIsIF9ieXRlczogVWludDhBcnJheSk6IFtuZXZlcltdLCBudW1iZXJdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgLy8gLi4uLml0IGRpZCBub3QuXG4gICAgLy9jb25zb2xlLmxvZyhgUkVBRCBGUk9NICR7aX06IERPRVMgJHtieXRlc1tpXX0gPT09ICR7dGhpcy5mbGFnfWApO1xuICAgIHJldHVybiBbKGJ5dGVzW2ldICYgdGhpcy5mbGFnKSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkoX3Y6IGJvb2xlYW5bXSk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2kgd2lsbCBORVZFUiBiZWNvbWUgQVJSQVknKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIGlmIChhLmlzQXJyYXkgIT09IGIuaXNBcnJheSkgcmV0dXJuIGEuaXNBcnJheSA/IDEgOiAtMVxuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbiAgZGF0YTogc3RyaW5nW11bXSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGU6IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdIGFzIHVuZGVmaW5lZCB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSksXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCAoZmllbGQuYml0ICUgOCk7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIGZpZWxkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UeXBlIChcbiAgbmFtZTogc3RyaW5nLFxuICB0eXBlOiBDT0xVTU4sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4pOiBDb2x1bW5BcmdzIHtcbiAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvdyB5b3UgZ29ubmEgdXNlIGl0IHRoZW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGNvbnN0IGJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgICAgY29uc3QgZmxhZyA9IDEgPDwgKGJpdCAlIDgpO1xuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIGZsYWcsIGJpdCwgb3ZlcnJpZGUgfTtcblxuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAxLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDIsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogNCwgb3ZlcnJpZGV9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGlmIChhcmdzLnR5cGUgJiAxNikgdGhyb3cgbmV3IEVycm9yKCdubyBzdWNoIHRoaW5nIGFzIGEgZmxhZyBhcnJheScpO1xuICAgICAgcmV0dXJuIG5ldyBCb29sQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiBuZXcgTnVtZXJpY0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4gbmV3IEJpZ0NvbHVtbihhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7YXJncy50eXBlfWApO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAga2V5OiBzdHJpbmc7XG4gIGpvaW5zPzogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgam9pbnM/OiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXTtcbiAgcmVhZG9ubHkga2V5OiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgbmFtZSwgZmxhZ3NVc2VkLCBrZXksIGpvaW5zIH06IFNjaGVtYUFyZ3MpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMua2V5ID0ga2V5O1xuICAgIHRoaXMuY29sdW1ucyA9IFsuLi5jb2x1bW5zXS5zb3J0KGNtcEZpZWxkcyk7XG4gICAgdGhpcy5maWVsZHMgPSB0aGlzLmNvbHVtbnMubWFwKGMgPT4gYy5uYW1lKTtcbiAgICB0aGlzLmNvbHVtbnNCeU5hbWUgPSBPYmplY3QuZnJvbUVudHJpZXModGhpcy5jb2x1bW5zLm1hcChjID0+IFtjLm5hbWUsIGNdKSk7XG4gICAgdGhpcy5mbGFnRmllbGRzID0gZmxhZ3NVc2VkO1xuICAgIHRoaXMuZml4ZWRXaWR0aCA9IGNvbHVtbnMucmVkdWNlKFxuICAgICAgKHcsIGMpID0+IHcgKyAoKCFjLmlzQXJyYXkgJiYgYy53aWR0aCkgfHwgMCksXG4gICAgICBNYXRoLmNlaWwoZmxhZ3NVc2VkIC8gOCksIC8vIDggZmxhZ3MgcGVyIGJ5dGUsIG5hdGNoXG4gICAgKTtcblxuICAgIGlmIChqb2lucykge1xuICAgICAgY29uc3QgW2EsIGIsIC4uLnJdID0gam9pbnMuc3BsaXQoJzonKTtcbiAgICAgIGNvbnN0IFthVCwgYUYsIC4uLmFSXSA9IGE/LnNwbGl0KCcuJyk7XG4gICAgICBjb25zdCBbYlQsIGJGLCAuLi5iUl0gPSBiPy5zcGxpdCgnLicpO1xuXG4gICAgICBpZiAoIWEgfHwgIWIgfHwgci5sZW5ndGgpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW46ICR7am9pbnN9YCk7XG4gICAgICBpZiAoIWFUIHx8ICFhRiB8fCBhUi5sZW5ndGgpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gbGVmdCBzaWRlICR7YX1gKTtcbiAgICAgIGlmICghYlQgfHwgIWJGIHx8IGJSLmxlbmd0aClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiByaWdodCBzaWRlICR7Yn1gKTtcbiAgICAgIGlmIChhVCA9PT0gYlQgJiYgYUYgPT09IGJGKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNhbnQgam9pbiBlbnRpdHkgdG8gaXRzZWxmICgke2pvaW5zfSlgKVxuICAgICAgaWYgKCF0aGlzLmNvbHVtbnNCeU5hbWVbYUZdKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIGxlZnQgc2lkZSAke2F9OiB1bmtub3duIGtleSBcIiR7YUZ9XCJgKTtcbiAgICAgIGlmICghdGhpcy5jb2x1bW5zQnlOYW1lW2JGXSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiByaWdodCBzaWRlICR7Yn06IHVua25vd24ga2V5IFwiJHtiRn1cImApO1xuICAgICAgdGhpcy5qb2lucyA9IFthVCwgYUYsIGJULCBiRl07XG4gICAgfVxuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBsZXQgZiA9IHRydWU7XG4gICAgbGV0IGIgPSBmYWxzZTtcbiAgICBsZXQgZmYgPSAwO1xuICAgIGZvciAoY29uc3QgW2ksIGNdIG9mIHRoaXMuY29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICAgIGxldCBPQyA9IC0xO1xuICAgICAgLy9pZiAoYy50eXBlICYgMTYpIGJyZWFrO1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklOR19BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJR19BUlJBWTpcbiAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgaWYgKG8gPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRzbyA9IE1hdGgubWF4KDAsIGkgLSAyKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSwgaSwgbywgYERTTzoke2Rzb30uLiR7aSArIDJ9OmAsIGNvbHVtbnMuc2xpY2UoTWF0aC5tYXgoMCwgaSAtIDIpLCBpICsgMikpO1xuICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgbm90IGJlIScpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIERPTkUgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gdGhpcy5mbGFnRmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb29PU0FBU09BTycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgYmUhJylcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjLCBvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdib29vJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvOyBjLmJpdCA9IGZmKys7IGMuZmxhZyA9IDIgKiogKGMuYml0ICUgOCk7IC8vIGhlaGVoZVxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgIGlmIChjLmJpdCArIDEgPT09IHRoaXMuZmxhZ0ZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRScpXG4gICAgICAgICAgICBpZiAoYy5mbGFnIDwgMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCAtIDEpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUgLSAxJylcbiAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgIGlmICghYy53aWR0aCkgZGVidWdnZXI7XG4gICAgICAgICAgbyArPSBjLndpZHRoITtcbiAgICAgICAgICBpZiAobyA9PT0gdGhpcy5maXhlZFdpZHRoKSBmID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL2NvbnN0IHJuZyA9IE9DIDwgMCA/IGBgIDogYCAke09DfS4uJHtvfSAvICR7dGhpcy5maXhlZFdpZHRofWBcbiAgICAgIC8vY29uc29sZS5sb2coYFske2l9XSR7cm5nfWAsIGMubmFtZSwgYy5sYWJlbClcbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgbGV0IGpvaW5zOiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2tleSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5zLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcblxuICAgIGlmICgham9pbnMpIGpvaW5zID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAga2V5LFxuICAgICAgam9pbnMsXG4gICAgICBjb2x1bW5zOiBbXSBhcyBDb2x1bW5bXSxcbiAgICAgIGZpZWxkczogW10gYXMgc3RyaW5nW10sXG4gICAgICBmbGFnc1VzZWQ6IDAsXG4gICAgICByYXdGaWVsZHM6IHt9LCAvLyBub25lIDo8XG4gICAgICBvdmVycmlkZXM6IHt9LCAvLyBub25lflxuICAgIH07XG5cbiAgICBjb25zdCBudW1GaWVsZHMgPSBieXRlc1tpKytdIHwgKGJ5dGVzW2krK10gPDwgOCk7XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIC8vIFRPRE8gLSBvbmx5IHdvcmtzIHdoZW4gMC1maWVsZCBzY2hlbWFzIGFyZW4ndCBhbGxvd2VkfiFcbiAgICB3aGlsZSAoaW5kZXggPCBudW1GaWVsZHMpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBieXRlc1tpKytdO1xuICAgICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgICBjb25zdCBmID0ge1xuICAgICAgICBpbmRleCwgbmFtZSwgdHlwZSxcbiAgICAgICAgd2lkdGg6IG51bGwsIGJpdDogbnVsbCwgZmxhZzogbnVsbCxcbiAgICAgICAgb3JkZXI6IDk5OVxuICAgICAgfTtcbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIGxldCBjOiBDb2x1bW47XG5cbiAgICAgIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG5cbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICAvL2lmIChjLm9mZnNldCAmJiBjLm9mZnNldCAhPT0gdG90YWxSZWFkKSB7IGRlYnVnZ2VyOyBjb25zb2xlLmxvZygnd29vcHNpZScpOyB9XG4gICAgICBsZXQgW3YsIHJlYWRdID0gYy5pc0FycmF5ID9cbiAgICAgICAgYy5hcnJheUZyb21CeXRlcyhpLCBieXRlcywgdmlldykgOlxuICAgICAgICBjLmZyb21CeXRlcyhpLCBieXRlcywgdmlldyk7XG5cbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKVxuICAgICAgICByZWFkID0gKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSA/IDEgOiAwO1xuXG4gICAgICBpICs9IHJlYWQ7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVhZDtcbiAgICAgIC8vIGRvbid0IHB1dCBmYWxzeSB2YWx1ZXMgb24gZmluYWwgb2JqZWN0cy4gbWF5IHJldmlzaXQgaG93IHRoaXMgd29ya3MgbGF0ZXJcbiAgICAgIC8vaWYgKGMuaXNBcnJheSB8fCB2KSByb3dbYy5uYW1lXSA9IHY7XG4gICAgICByb3dbYy5uYW1lXSA9IHY7XG4gICAgICAvL2NvbnN0IHcgPSBnbG9iYWxUaGlzLl9ST1dTW3RoaXMubmFtZV1bX19yb3dJZF1bYy5uYW1lXSAvLyBzcnMgYml6XG4gICAgICAvKlxuICAgICAgaWYgKHcgIT09IHYpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHcpIHx8IHcuc29tZSgobiwgaSkgPT4gbiAhPT0gdltpXSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBYWFhYWCAke3RoaXMubmFtZX1bJHtfX3Jvd0lkfV1bJHtjLm5hbWV9XSAke3d9IC0+ICR7dn1gKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYF9fX19fICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gPT0gJHt2fWApXG4gICAgICB9XG4gICAgICAqL1xuICAgIH1cbiAgICAvL2lmIChkYnIpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAgIFJFQUQ6ICR7dG90YWxSZWFkfSBUTyAke2l9IC8gJHtidWZmZXIuYnl0ZUxlbmd0aH1cXG5gLCByb3csICdcXG5cXG4nKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgLy99XG4gICAgcmV0dXJuIFtyb3csIHRvdGFsUmVhZF07XG4gIH1cblxuICBwcmludFJvdyAocjogUm93LCBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPikge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkpO1xuICB9XG5cbiAgc2VyaWFsaXplSGVhZGVyICgpOiBCbG9iIHtcbiAgICAvLyBbLi4ubmFtZSwgMCwgbnVtRmllbGRzMCwgbnVtRmllbGRzMSwgZmllbGQwVHlwZSwgZmllbGQwRmxhZz8sIC4uLmZpZWxkME5hbWUsIDAsIGV0Y107XG4gICAgLy8gVE9ETyAtIEJhc2UgdW5pdCBoYXMgNTAwKyBmaWVsZHNcbiAgICBpZiAodGhpcy5jb2x1bW5zLmxlbmd0aCA+IDY1NTM1KSB0aHJvdyBuZXcgRXJyb3IoJ29oIGJ1ZGR5Li4uJyk7XG4gICAgY29uc3QgcGFydHMgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSksXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMua2V5KSxcbiAgICAgIC4uLnRoaXMuc2VyaWFsaXplSm9pbnMoKSxcbiAgICAgIHRoaXMuY29sdW1ucy5sZW5ndGggJiAyNTUsXG4gICAgICAodGhpcy5jb2x1bW5zLmxlbmd0aCA+Pj4gOCksXG4gICAgICAuLi50aGlzLmNvbHVtbnMuZmxhdE1hcChjID0+IGMuc2VyaWFsaXplKCkpXG4gICAgXSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW3BhcnRzXSk7XG4gIH1cblxuICBzZXJpYWxpemVKb2lucyAoKSB7XG4gICAgaWYgKCF0aGlzLmpvaW5zKSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgY29uc3QgW2FULCBhRiwgYlQsIGJGXSA9IHRoaXMuam9pbnM7XG4gICAgcmV0dXJuIHN0cmluZ1RvQnl0ZXMoYCR7YVR9LiR7YUZ9OiR7YlR9LiR7YkZ9YCk7XG4gIH1cblxuICBzZXJpYWxpemVSb3cgKHI6IFJvdyk6IEJsb2Ige1xuICAgIGNvbnN0IGZpeGVkID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5maXhlZFdpZHRoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgY29uc3QgYmxvYlBhcnRzOiBCbG9iUGFydFtdID0gW2ZpeGVkXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2ID0gcltjLm5hbWVdXG4gICAgICAgIGlmIChjLmlzQXJyYXkpIHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVBcnJheSh2IGFzIGFueVtdKVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgc3RyaW5nKVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBiaWdpbnQpXG4gICAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgfSBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgICAgLy8gZG9udCBuZWVkIHRvIGNoZWNrIGZvciB0aGUgbGFzdCBmbGFnIHNpbmNlIHdlIG5vIGxvbmdlciBuZWVkIGlcbiAgICAgICAgICAgIC8vIGFmdGVyIHdlJ3JlIGRvbmUgd2l0aCBudW1iZXJzIGFuZCBib29sZWFuc1xuICAgICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAgIC8vIC4uLmJ1dCB3ZSB3aWxsIGJlY2F1eXNlIHdlIGJyb2tlIHNvbWV0aGlnblxuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSBpKys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICAgIGNvbnN0IGJ5dGVzID0gYy5zZXJpYWxpemVSb3codiBhcyBudW1iZXIpXG4gICAgICAgICAgICBmaXhlZC5zZXQoYnl0ZXMsIGkpXG4gICAgICAgICAgICBpICs9IGMud2lkdGghO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHsoYyBhcyBhbnkpLnR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgQ09MVU1OOicsIGMpO1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIFJPVzonLCByKTtcbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9pZiAoci5fX3Jvd0lkIDwgNSB8fCByLl9fcm93SWQgPiAzOTc1IHx8IHIuX19yb3dJZCAlIDEwMDAgPT09IDApIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAtIFJPVyAke3IuX19yb3dJZH1gLCB7IGksIGJsb2JQYXJ0cywgciB9KTtcbiAgICAvL31cbiAgICByZXR1cm4gbmV3IEJsb2IoYmxvYlBhcnRzKTtcbiAgfVxuXG4gIHByaW50ICh3aWR0aCA9IDgwKTogdm9pZCB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDM2KTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zdCB7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0gPSB0aGlzO1xuICAgIGNvbnNvbGUubG9nKHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSk7XG4gICAgY29uc29sZS50YWJsZSh0aGlzLmNvbHVtbnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdsYWJlbCcsXG4gICAgICAnb2Zmc2V0JyxcbiAgICAgICdvcmRlcicsXG4gICAgICAnYml0JyxcbiAgICAgICd0eXBlJyxcbiAgICAgICdmbGFnJyxcbiAgICAgICd3aWR0aCcsXG4gICAgXSk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG5cbiAgfVxuXG4gIC8vIHJhd1RvUm93IChkOiBSYXdSb3cpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7fVxuICAvLyByYXdUb1N0cmluZyAoZDogUmF3Um93LCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7fVxufTtcblxuIiwgImltcG9ydCB7IFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5leHBvcnQgdHlwZSBSb3dEYXRhID0gc3RyaW5nfG51bWJlcnxib29sZWFufGJpZ2ludHwoc3RyaW5nfG51bWJlcnxiaWdpbnQpW107XG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBSb3dEYXRhPiAmIHsgX19yb3dJZDogbnVtYmVyIH07XG5cbnR5cGUgVGFibGVCbG9iID0geyBudW1Sb3dzOiBudW1iZXIsIGhlYWRlckJsb2I6IEJsb2IsIGRhdGFCbG9iOiBCbG9iIH07XG5cbmV4cG9ydCBjbGFzcyBUYWJsZSB7XG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEubmFtZSB9XG4gIGdldCBrZXkgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNjaGVtYS5rZXkgfVxuICByZWFkb25seSBtYXA6IE1hcDxhbnksIGFueT4gPSBuZXcgTWFwKClcbiAgY29uc3RydWN0b3IgKFxuICAgIHJlYWRvbmx5IHJvd3M6IFJvd1tdLFxuICAgIHJlYWRvbmx5IHNjaGVtYTogU2NoZW1hLFxuICApIHtcbiAgICBjb25zdCBrZXlOYW1lID0gdGhpcy5rZXk7XG4gICAgaWYgKGtleU5hbWUgIT09ICdfX3Jvd0lkJykgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSB7XG4gICAgICBjb25zdCBrZXkgPSByb3dba2V5TmFtZV07XG4gICAgICBpZiAodGhpcy5tYXAuaGFzKGtleSkpIHRocm93IG5ldyBFcnJvcigna2V5IGlzIG5vdCB1bmlxdWUnKTtcbiAgICAgIHRoaXMubWFwLnNldChrZXksIHJvdyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuXG4gICAgLy9jb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB7XG4gICAgICAvL2NvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIC8vaWYgKHIuX19yb3dJZCA9PT0gMClcbiAgICAgICAgLy9yb3dCbG9iLmFycmF5QnVmZmVyKCkudGhlbihhYiA9PiB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgbmV3IFVpbnQ4QXJyYXkoYWIpLmpvaW4oJywgJykpO1xuICAgICAgICAvL30pO1xuICAgICAgLy9yZXR1cm4gcm93QmxvYjtcbiAgICAvL30pO1xuICAgIGNvbnN0IHJvd0Jsb2IgPSBuZXcgQmxvYihyb3dEYXRhKVxuICAgIGNvbnN0IGRhdGFQYWRkaW5nID0gKDQgLSByb3dCbG9iLnNpemUgJSA0KSAlIDQ7XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFVpbnQzMkFycmF5KFtcbiAgICAgICAgdGhpcy5yb3dzLmxlbmd0aCxcbiAgICAgICAgc2NoZW1hSGVhZGVyLnNpemUgKyBzY2hlbWFQYWRkaW5nLFxuICAgICAgICByb3dCbG9iLnNpemUgKyBkYXRhUGFkZGluZ1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHNjaGVtYUhlYWRlcixcbiAgICAgICAgbmV3IEFycmF5QnVmZmVyKHNjaGVtYVBhZGRpbmcpIGFzIGFueSAvLyA/Pz9cbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKHsgdGFibGVzLCBibG9icywgYWxsU2l6ZXMsIGFsbEhlYWRlcnMsIGFsbERhdGEgfSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW2FsbFNpemVzLCAuLi5hbGxIZWFkZXJzLCAuLi5hbGxEYXRhXSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgb3BlbkJsb2IgKGJsb2I6IEJsb2IpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIFRhYmxlPj4ge1xuICAgIGlmIChibG9iLnNpemUgJSA0ICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3dvbmt5IGJsb2Igc2l6ZScpO1xuICAgIGNvbnN0IG51bVRhYmxlcyA9IG5ldyBVaW50MzJBcnJheShhd2FpdCBibG9iLnNsaWNlKDAsIDQpLmFycmF5QnVmZmVyKCkpWzBdO1xuXG4gICAgLy8gb3ZlcmFsbCBieXRlIG9mZnNldFxuICAgIGxldCBibyA9IDQ7XG4gICAgY29uc3Qgc2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICBhd2FpdCBibG9iLnNsaWNlKGJvLCBibyArPSBudW1UYWJsZXMgKiAxMikuYXJyYXlCdWZmZXIoKVxuICAgICk7XG5cbiAgICBjb25zdCB0QmxvYnM6IFRhYmxlQmxvYltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICBjb25zdCBzaSA9IGkgKiAzO1xuICAgICAgY29uc3QgbnVtUm93cyA9IHNpemVzW3NpXTtcbiAgICAgIGNvbnN0IGhTaXplID0gc2l6ZXNbc2kgKyAxXTtcbiAgICAgIHRCbG9ic1tpXSA9IHsgbnVtUm93cywgaGVhZGVyQmxvYjogYmxvYi5zbGljZShibywgYm8gKz0gaFNpemUpIH0gYXMgYW55O1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICB0QmxvYnNbaV0uZGF0YUJsb2IgPSBibG9iLnNsaWNlKGJvLCBibyArPSBzaXplc1tpICogMyArIDJdKTtcbiAgICB9O1xuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAoKHRiLCBpKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBJTiBCTE9CUyBGT1IgVD0ke2l9YCwgdGIpXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQmxvYih0Yik7XG4gICAgfSkpXG4gICAgY29uc3QgdGFibGVNYXAgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuXG4gICAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykge1xuICAgICAgaWYgKCF0LnNjaGVtYS5qb2lucykgY29udGludWU7XG4gICAgICBjb25zdCBbYVQsIGFGLCBiVCwgYkZdID0gdC5zY2hlbWEuam9pbnM7XG4gICAgICBjb25zdCB0QSA9IHRhYmxlTWFwW2FUXTtcbiAgICAgIGNvbnN0IHRCID0gdGFibGVNYXBbYlRdO1xuICAgICAgaWYgKCF0QSkgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YVR9YCk7XG4gICAgICBpZiAoIXRCKSB0aHJvdyBuZXcgRXJyb3IoYCR7dC5uYW1lfSBqb2lucyB1bmRlZmluZWQgdGFibGUgJHtiVH1gKTtcbiAgICAgIGlmICghdC5yb3dzLmxlbmd0aCkgY29udGludWU7IC8vIGVtcHR5IHRhYmxlIGkgZ3Vlc3M/XG4gICAgICBmb3IgKGNvbnN0IHIgb2YgdC5yb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkQSA9IHJbYUZdO1xuICAgICAgICBjb25zdCBpZEIgPSByW2JGXTtcbiAgICAgICAgaWYgKGlkQSA9PT0gdW5kZWZpbmVkIHx8IGlkQiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgcm93IGhhcyBhIGJhZCBpZD9gLCByKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhID0gdEEubWFwLmdldChpZEEpO1xuICAgICAgICBjb25zdCBiID0gdEIubWFwLmdldChpZEIpO1xuICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgcm93IGhhcyBhIG1pc3NpbmcgaWQ/YCwgYSwgaWRBLCByKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgcm93IGhhcyBhIG1pc3NpbmcgaWQ/YCwgYiwgaWRCLCByKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAoYVt0Lm5hbWVdID8/PSBbXSkucHVzaChyKTtcbiAgICAgICAgKGJbdC5uYW1lXSA/Pz0gW10pLnB1c2gocik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZU1hcDtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmcm9tQmxvYiAoe1xuICAgIGhlYWRlckJsb2IsXG4gICAgZGF0YUJsb2IsXG4gICAgbnVtUm93cyxcbiAgfTogVGFibGVCbG9iKTogUHJvbWlzZTxUYWJsZT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IFNjaGVtYS5mcm9tQnVmZmVyKGF3YWl0IGhlYWRlckJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgbGV0IHJibyA9IDA7XG4gICAgbGV0IF9fcm93SWQgPSAwO1xuICAgIGNvbnN0IHJvd3M6IFJvd1tdID0gW107XG4gICAgLy8gVE9ETyAtIGNvdWxkIGRlZmluaXRlbHkgdXNlIGEgc3RyZWFtIGZvciB0aGlzXG4gICAgY29uc3QgZGF0YUJ1ZmZlciA9IGF3YWl0IGRhdGFCbG9iLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc29sZS5sb2coYD09PT09IFJFQUQgJHtudW1Sb3dzfSBPRiAke3NjaGVtYS5uYW1lfSA9PT09PWApXG4gICAgd2hpbGUgKF9fcm93SWQgPCBudW1Sb3dzKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgcmJvICs9IHJlYWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xuICB9XG5cblxuICBwcmludCAoXG4gICAgd2lkdGg6IG51bWJlciA9IDgwLFxuICAgIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+fG51bGwgPSBudWxsLFxuICAgIG46IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBtOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgcD86IChyOiBhbnkpID0+IGJvb2xlYW4sXG4gICk6IG51bGx8YW55W10ge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAxOCk7XG4gICAgY29uc3Qgcm93cyA9IHAgPyB0aGlzLnJvd3MuZmlsdGVyKHApIDpcbiAgICAgIG4gPT09IG51bGwgPyB0aGlzLnJvd3MgOlxuICAgICAgbSA9PT0gbnVsbCA/IHRoaXMucm93cy5zbGljZSgwLCBuKSA6XG4gICAgICB0aGlzLnJvd3Muc2xpY2UobiwgbSk7XG5cblxuICAgIGxldCBtRmllbGRzID0gQXJyYXkuZnJvbSgoZmllbGRzID8/IHRoaXMuc2NoZW1hLmZpZWxkcykpO1xuICAgIGlmIChwKSBbbiwgbV0gPSBbMCwgcm93cy5sZW5ndGhdXG4gICAgZWxzZSAobUZpZWxkcyBhcyBhbnkpLnVuc2hpZnQoJ19fcm93SWQnKTtcblxuICAgIGNvbnN0IFtwUm93cywgcEZpZWxkc10gPSBmaWVsZHMgP1xuICAgICAgW3Jvd3MubWFwKChyOiBSb3cpID0+IHRoaXMuc2NoZW1hLnByaW50Um93KHIsIG1GaWVsZHMpKSwgZmllbGRzXTpcbiAgICAgIFtyb3dzLCB0aGlzLnNjaGVtYS5maWVsZHNdXG4gICAgICA7XG5cbiAgICBjb25zb2xlLmxvZygncm93IGZpbHRlcjonLCBwID8/ICcobm9uZSknKVxuICAgIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnNvbGUudGFibGUocFJvd3MsIHBGaWVsZHMpO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuICAgIHJldHVybiAocCAmJiBmaWVsZHMpID9cbiAgICAgIHJvd3MubWFwKHIgPT5cbiAgICAgICAgT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pLmZpbHRlcihlID0+IGVbMV0pKVxuICAgICAgKSA6XG4gICAgICBudWxsO1xuICB9XG5cbiAgZHVtcFJvdyAoaTogbnVtYmVyfG51bGwsIHNob3dFbXB0eSA9IGZhbHNlLCB1c2VDU1M/OiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgIC8vIFRPRE8gXHUyMDE0IGluIGJyb3dzZXIsIHVzZUNTUyA9PT0gdHJ1ZSBieSBkZWZhdWx0XG4gICAgdXNlQ1NTID8/PSAoZ2xvYmFsVGhpc1snd2luZG93J10gPT09IGdsb2JhbFRoaXMpOyAvLyBpZGtcbiAgICBpID8/PSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLnJvd3MubGVuZ3RoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLnJvd3NbaV07XG4gICAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGNzczogc3RyaW5nW118bnVsbCA9IHVzZUNTUyA/IFtdIDogbnVsbDtcbiAgICBjb25zdCBmbXQgPSBmbXRTdHlsZWQuYmluZChudWxsLCBvdXQsIGNzcyk7XG4gICAgY29uc3QgcCA9IE1hdGgubWF4KFxuICAgICAgLi4udGhpcy5zY2hlbWEuY29sdW1uc1xuICAgICAgLmZpbHRlcihjID0+IHNob3dFbXB0eSB8fCByb3dbYy5uYW1lXSlcbiAgICAgIC5tYXAoYyA9PiBjLm5hbWUubGVuZ3RoICsgMilcbiAgICApO1xuICAgIGlmICghcm93KVxuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV0gZG9lcyBub3QgZXhpc3RgLCBDX05PVF9GT1VORCk7XG4gICAgZWxzZSB7XG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XWAsIENfUk9XX0hFQUQpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIHRoaXMuc2NoZW1hLmNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbYy5uYW1lXTtcbiAgICAgICAgY29uc3QgbiA9IGMubmFtZS5wYWRTdGFydChwLCAnICcpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjVFJVRWAsIENfVFJVRSlcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06ICVjRkFMU0VgLCBDX05PVF9GT1VORCwgQ19GQUxTRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX05VTUJFUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDBgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX1NUUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IFx1MjAxNGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChge259OiAlYzAgJWMke3ZhbHVlfSAoQklHKWAsIENfQklHLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwIChCSUcpYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHVzZUNTUykgcmV0dXJuIFtvdXQuam9pbignXFxuJyksIC4uLmNzcyFdO1xuICAgIGVsc2UgcmV0dXJuIFtvdXQuam9pbignXFxuJyldO1xuICB9XG5cbiAgZmluZFJvdyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4sIHN0YXJ0ID0gMCk6IG51bWJlciB7XG4gICAgY29uc3QgTiA9IHRoaXMucm93cy5sZW5ndGhcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IE4gLSBzdGFydDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBOOyBpKyspIGlmIChwcmVkaWNhdGUodGhpcy5yb3dzW2ldKSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgKiBmaWx0ZXJSb3dzIChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbik6IEdlbmVyYXRvcjxSb3c+IHtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIGlmIChwcmVkaWNhdGUocm93KSkgeWllbGQgcm93O1xuICB9XG4gIC8qXG4gIHJhd1RvUm93IChkOiBzdHJpbmdbXSk6IFJvdyB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNjaGVtYS5jb2x1bW5zLm1hcChyID0+IFtcbiAgICAgIHIubmFtZSxcbiAgICAgIHIudG9WYWwoZFtyLmluZGV4XSlcbiAgICBdKSk7XG4gIH1cbiAgcmF3VG9TdHJpbmcgKGQ6IHN0cmluZ1tdLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgLy8ganVzdCBhc3N1bWUgZmlyc3QgdHdvIGZpZWxkcyBhcmUgYWx3YXlzIGlkLCBuYW1lLiBldmVuIGlmIHRoYXQncyBub3QgdHJ1ZVxuICAgIC8vIHRoaXMgaXMganVzdCBmb3IgdmlzdWFsaXphdGlvbiBwdXJwb3JzZXNcbiAgICBsZXQgZXh0cmEgPSAnJztcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHM6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBlID0gdGhpcy5yYXdUb1JvdyhkKTtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBhcmdzKSB7XG4gICAgICAgIC8vIGRvbid0IHJlcHJpbnQgbmFtZSBvciBpZFxuICAgICAgICBpZiAoYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzBdIHx8IGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1sxXSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKGVbYV0gIT0gbnVsbClcbiAgICAgICAgICBzLnB1c2goYCR7YX06ICR7SlNPTi5zdHJpbmdpZnkoZVthXSl9YClcbiAgICAgIH1cbiAgICAgIGV4dHJhID0gcy5sZW5ndGggPiAwID8gYCB7ICR7cy5qb2luKCcsICcpfSB9YCA6ICd7fSc7XG4gICAgfVxuICAgIHJldHVybiBgPCR7dGhpcy5zY2hlbWEubmFtZX06JHtkWzBdID8/ICc/J30gXCIke2RbMV19XCIke2V4dHJhfT5gO1xuICB9XG4gICovXG59XG5cbmZ1bmN0aW9uIGZtdFN0eWxlZCAoXG4gIG91dDogc3RyaW5nW10sXG4gIGNzc091dDogc3RyaW5nW10gfCBudWxsLFxuICBtc2c6IHN0cmluZyxcbiAgLi4uY3NzOiBzdHJpbmdbXVxuKSB7XG4gIGlmIChjc3NPdXQpIHtcbiAgICBvdXQucHVzaChtc2cgKyAnJWMnKVxuICAgIGNzc091dC5wdXNoKC4uLmNzcywgQ19SRVNFVCk7XG4gIH1cbiAgZWxzZSBvdXQucHVzaChtc2cucmVwbGFjZSgvJWMvZywgJycpKTtcbn1cblxuY29uc3QgQ19OT1RfRk9VTkQgPSAnY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYzsnO1xuY29uc3QgQ19ST1dfSEVBRCA9ICdmb250LXdlaWdodDogYm9sZGVyJztcbmNvbnN0IENfQk9MRCA9ICdmb250LXdlaWdodDogYm9sZCc7XG5jb25zdCBDX05VTUJFUiA9ICdjb2xvcjogI0EwNTUxODsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfVFJVRSA9ICdjb2xvcjogIzRDMzhCRTsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfRkFMU0UgPSAnY29sb3I6ICMzOEJFMUM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1NUUiA9ICdjb2xvcjogIzMwQUE2MjsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfQklHID0gJ2NvbG9yOiAjNzgyMUEzOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19SRVNFVCA9ICdjb2xvcjogdW5zZXQ7IGZvbnQtc3R5bGU6IHVuc2V0OyBmb250LXdlaWdodDogdW5zZXQ7IGJhY2tncm91bmQtdW5zZXQnXG4iLCAiaW1wb3J0IHsgQ09MVU1OLCBTY2hlbWFBcmdzIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgdHlwZSB7IFBhcnNlU2NoZW1hT3B0aW9ucyB9IGZyb20gJy4vcGFyc2UtY3N2J1xuZXhwb3J0IGNvbnN0IGNzdkRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4gPSB7XG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlVS5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXQnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoW1xuICAgICAgLy8gY29tYmluZWQgaW50byBhbiBhcnJheSBmaWVsZFxuICAgICAgJ2FybW9yMScsICdhcm1vcjInLCAnYXJtb3IzJywgJ2FybW9yNCcsICdlbmQnLFxuICAgICAgJ3dwbjEnLCAnd3BuMicsICd3cG4zJywgJ3dwbjQnLCAnd3BuNScsICd3cG42JywgJ3dwbjcnLFxuXG4gICAgICAvLyBhbGwgY29tYmluZWQgaW50byBvbmUgYXJyYXkgZmllbGRcbiAgICAgICdsaW5rMScsICdsaW5rMicsICdsaW5rMycsICdsaW5rNCcsICdsaW5rNScsICdsaW5rNicsXG4gICAgICAnbWFzazEnLCAnbWFzazInLCAnbWFzazMnLCAnbWFzazQnLCAnbWFzazUnLCAnbWFzazYnLFxuICAgICAgJ25icjEnLCAgJ25icjInLCAgJ25icjMnLCAgJ25icjQnLCAgJ25icjUnLCAgJ25icjYnLFxuICAgICAgJ3JhbmQxJywgJ3JhbmQyJywgJ3JhbmQzJywgJ3JhbmQ0JywgJ3JhbmQ1JywgJ3JhbmQ2JyxcblxuICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICAgJ21vdW50ZWQnLFxuICAgICAgLy8gcmVkdW5kYW50XG4gICAgICAncmVhbmltYXRvcn4xJyxcbiAgICBdKSxcbiAgICBrbm93bkZpZWxkczoge1xuICAgICAgaWQ6IENPTFVNTi5VMTYsXG4gICAgICBuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgcnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlY2xpbWl0OiBDT0xVTU4uSTgsXG4gICAgICBiYXNlY29zdDogQ09MVU1OLlUxNixcbiAgICAgIHJjb3N0OiBDT0xVTU4uSTgsXG4gICAgICBzaXplOiBDT0xVTU4uVTgsXG4gICAgICByZXNzaXplOiBDT0xVTU4uVTgsXG4gICAgICBocDogQ09MVU1OLlUxNixcbiAgICAgIHByb3Q6IENPTFVNTi5VOCxcbiAgICAgIG1yOiBDT0xVTU4uVTgsXG4gICAgICBtb3I6IENPTFVNTi5VOCxcbiAgICAgIHN0cjogQ09MVU1OLlU4LFxuICAgICAgYXR0OiBDT0xVTU4uVTgsXG4gICAgICBkZWY6IENPTFVNTi5VOCxcbiAgICAgIHByZWM6IENPTFVNTi5VOCxcbiAgICAgIGVuYzogQ09MVU1OLlU4LFxuICAgICAgbWFwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgYXA6IENPTFVNTi5VOCxcbiAgICAgIGFtYmlkZXh0cm91czogQ09MVU1OLlU4LFxuICAgICAgbW91bnRtbnI6IENPTFVNTi5VMTYsXG4gICAgICBza2lsbGVkcmlkZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlaW52aWdvcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHVuZGVhZGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgbWF4YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgaGFuZDogQ09MVU1OLlU4LFxuICAgICAgaGVhZDogQ09MVU1OLlU4LFxuICAgICAgbWlzYzogQ09MVU1OLlU4LFxuICAgICAgcGF0aGNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0ZG9tOiBDT0xVTU4uVTgsXG4gICAgICBib251c3NwZWxsczogQ09MVU1OLlU4LFxuICAgICAgRjogQ09MVU1OLlU4LFxuICAgICAgQTogQ09MVU1OLlU4LFxuICAgICAgVzogQ09MVU1OLlU4LFxuICAgICAgRTogQ09MVU1OLlU4LFxuICAgICAgUzogQ09MVU1OLlU4LFxuICAgICAgRDogQ09MVU1OLlU4LFxuICAgICAgTjogQ09MVU1OLlU4LFxuICAgICAgRzogQ09MVU1OLlU4LFxuICAgICAgQjogQ09MVU1OLlU4LFxuICAgICAgSDogQ09MVU1OLlU4LFxuICAgICAgc2FpbGluZ3NoaXBzaXplOiBDT0xVTU4uVTE2LFxuICAgICAgc2FpbGluZ21heHVuaXRzaXplOiBDT0xVTU4uVTgsXG4gICAgICBzdGVhbHRoeTogQ09MVU1OLlU4LFxuICAgICAgcGF0aWVuY2U6IENPTFVNTi5VOCxcbiAgICAgIHNlZHVjZTogQ09MVU1OLlU4LFxuICAgICAgc3VjY3VidXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnJ1cHQ6IENPTFVNTi5VOCxcbiAgICAgIGhvbWVzaWNrOiBDT0xVTU4uVTgsXG4gICAgICBmb3JtYXRpb25maWdodGVyOiBDT0xVTU4uSTgsXG4gICAgICBzdGFuZGFyZDogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyYXRpb25hbDogQ09MVU1OLkk4LFxuICAgICAgdGFza21hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYmVhc3RtYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJvZHlndWFyZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJicmVhdGhpbmc6IENPTFVNTi5VMTYsXG4gICAgICBpY2Vwcm90OiBDT0xVTU4uVTgsXG4gICAgICBpbnZ1bG5lcmFibGU6IENPTFVNTi5VOCxcbiAgICAgIHNob2NrcmVzOiBDT0xVTU4uSTgsXG4gICAgICBmaXJlcmVzOiBDT0xVTU4uSTgsXG4gICAgICBjb2xkcmVzOiBDT0xVTU4uSTgsXG4gICAgICBwb2lzb25yZXM6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHZvaWRzYW5pdHk6IENPTFVNTi5VOCxcbiAgICAgIGRhcmt2aXNpb246IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hbGF3ZTogQ09MVU1OLlU4LFxuICAgICAgYXdlOiBDT0xVTU4uVTgsXG4gICAgICBoYWx0aGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZmVhcjogQ09MVU1OLlU4LFxuICAgICAgYmVyc2VyazogQ09MVU1OLlU4LFxuICAgICAgY29sZDogQ09MVU1OLlU4LFxuICAgICAgaGVhdDogQ09MVU1OLlU4LFxuICAgICAgZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgYmFuZWZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGRhbWFnZXJldjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIGRpc2Vhc2VjbG91ZDogQ09MVU1OLlU4LFxuICAgICAgc2xpbWVyOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kc2xpbWU6IENPTFVNTi5VMTYsXG4gICAgICByZWdlbmVyYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmFybW9yOiBDT0xVTU4uVTgsXG4gICAgICBleWVsb3NzOiBDT0xVTU4uVTgsXG4gICAgICBldGh0cnVlOiBDT0xVTU4uVTgsXG4gICAgICBzdG9ybXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNvbGRwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZGFya3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICB3aW50ZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3ByaW5ncG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1lcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmYWxscG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZvcmdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGZpeGZvcmdlYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIG1hc3RlcnNtaXRoOiBDT0xVTU4uSTgsXG4gICAgICByZXNvdXJjZXM6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9oZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9kaXNoZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIG5vYmFkZXZlbnRzOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmU6IENPTFVNTi5VOCxcbiAgICAgIHNoYXR0ZXJlZHNvdWw6IENPTFVNTi5VOCxcbiAgICAgIGxlcGVyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3JlYzogQ09MVU1OLlU4LFxuICAgICAgcGlsbGFnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBwYXRyb2xib251czogQ09MVU1OLkk4LFxuICAgICAgY2FzdGxlZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzaWVnZWJvbnVzOiBDT0xVTU4uSTE2LFxuICAgICAgaW5jcHJvdmRlZjogQ09MVU1OLlU4LFxuICAgICAgc3VwcGx5Ym9udXM6IENPTFVNTi5VOCxcbiAgICAgIGluY3VucmVzdDogQ09MVU1OLkkxNixcbiAgICAgIHBvcGtpbGw6IENPTFVNTi5VMTYsXG4gICAgICByZXNlYXJjaGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJpbmdyZXM6IENPTFVNTi5JOCxcbiAgICAgIGRvdXNlOiBDT0xVTU4uVTgsXG4gICAgICBhZGVwdHNhY3I6IENPTFVNTi5VOCxcbiAgICAgIGNyb3NzYnJlZWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFrZXBlYXJsczogQ09MVU1OLlU4LFxuICAgICAgdm9pZHN1bTogQ09MVU1OLlU4LFxuICAgICAgaGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZWxlZ2lzdDogQ09MVU1OLlU4LFxuICAgICAgc2hhcGVjaGFuZ2U6IENPTFVNTi5VMTYsXG4gICAgICBmaXJzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2Vjb25kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBsYW5kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB3YXRlcnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgZm9yZXN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBwbGFpbnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgeHBzaGFwZTogQ09MVU1OLlU4LFxuICAgICAgbmFtZXR5cGU6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjogQ09MVU1OLkkxNixcbiAgICAgIG5fc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTE6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjA6IENPTFVNTi5JMTYsXG4gICAgICBibG9vZHZlbmdlYW5jZTogQ09MVU1OLlU4LFxuICAgICAgYnJpbmdlcm9mZm9ydHVuZTogQ09MVU1OLkk4LFxuICAgICAgcmVhbG0xOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTM6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTQ6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTFkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0zZDY6IENPTFVNTi5JMTYsXG4gICAgICBiYXRzdGFydHN1bTRkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNWQ2OiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTZkNjogQ09MVU1OLlUxNixcbiAgICAgIHR1cm1vaWxzdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aGZpcmU6IENPTFVNTi5VOCxcbiAgICAgIHV3cmVnZW46IENPTFVNTi5VOCxcbiAgICAgIHNocmlua2hwOiBDT0xVTU4uVTgsXG4gICAgICBncm93aHA6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aW5nYWZmOiBDT0xVTU4uVTMyLFxuICAgICAgZml4ZWRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgbGFtaWFsb3JkOiBDT0xVTU4uVTgsXG4gICAgICBwcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgZHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIG11bW1pZnk6IENPTFVNTi5VMTYsXG4gICAgICBvbmViYXR0bGVzcGVsbDogQ09MVU1OLlU4LFxuICAgICAgZmlyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFpcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIHdhdGVyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZWFydGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RGOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFc6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RFOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0UzogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEQ6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3ROOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QUxMOiBDT0xVTU4uSTgsXG4gICAgICBleWVzOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VlYXRlcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uc2tpbjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpdGVtOiBDT0xVTU4uVTgsXG4gICAgICBiYXR0bGVzdW01OiBDT0xVTU4uVTE2LFxuICAgICAgYWNpZHNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgcHJvcGhldHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgaG9ycm9yOiBDT0xVTU4uVTgsXG4gICAgICBsYXRlaGVybzogQ09MVU1OLlU4LFxuICAgICAgdXdkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIGxhbmRkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIHJwY29zdDogQ09MVU1OLlUzMixcbiAgICAgIHJhbmQ1OiBDT0xVTU4uVTgsXG4gICAgICBuYnI1OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmQ2OiBDT0xVTU4uVTgsXG4gICAgICBuYnI2OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNjogQ09MVU1OLlUxNixcbiAgICAgIG11bW1pZmljYXRpb246IENPTFVNTi5VMTYsXG4gICAgICBkaXNlYXNlcmVzOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZW9ua2lsbDogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHNlbmRsZXNzZXJob3Jyb3JtdWx0OiBDT0xVTU4uVTgsXG4gICAgICBpbmNvcnBvcmF0ZTogQ09MVU1OLlU4LFxuICAgICAgYmxlc3NiZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWF0dGFja2VyOiBDT0xVTU4uVTgsXG4gICAgICB1d2hlYXQ6IENPTFVNTi5VOCxcbiAgICAgIHNsb3RocmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcmRlc2VydGVyOiBDT0xVTU4uVTgsXG4gICAgICBzb3JjZXJ5cmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG9sZGVyOiBDT0xVTU4uSTgsXG4gICAgICBkaXNiZWxpZXZlOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbHJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYmVhcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgaG9yc2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHJlaW5jYXJuYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHdvbGZ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGJvYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHNsZWVwYXVyYTogQ09MVU1OLlU4LFxuICAgICAgc25ha2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGFwcGV0aXRlOiBDT0xVTU4uSTgsXG4gICAgICB0ZW1wbGV0cmFpbmVyOiBDT0xVTU4uVTgsXG4gICAgICBpbmZlcm5vcmV0OiBDT0xVTU4uVTgsXG4gICAgICBrb2t5dG9zcmV0OiBDT0xVTU4uVTgsXG4gICAgICBhZGRyYW5kb21hZ2U6IENPTFVNTi5VMTYsXG4gICAgICB1bnN1cnI6IENPTFVNTi5VOCxcbiAgICAgIHNwZWNpYWxsb29rOiBDT0xVTU4uVTgsXG4gICAgICBidWdyZWZvcm06IENPTFVNTi5VOCxcbiAgICAgIG9uaXN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgc3VuYXdlOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGFmZjogQ09MVU1OLlU4LFxuICAgICAgaXZ5bG9yZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2RtYWc6IENPTFVNTi5VOCxcbiAgICAgIGZvcnRraWxsOiBDT0xVTU4uVTgsXG4gICAgICB0aHJvbmVraWxsOiBDT0xVTU4uVTgsXG4gICAgICBkaWdlc3Q6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgZW50YW5nbGU6IENPTFVNTi5VOCxcbiAgICAgIGFsY2hlbXk6IENPTFVNTi5VOCxcbiAgICAgIHdvdW5kZmVuZDogQ09MVU1OLlU4LFxuICAgICAgZmFsc2Vhcm15OiBDT0xVTU4uSTgsXG4gICAgICBzdW1tb241OiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXI6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHBhcmFseXplOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2Vjb25zdHJ1Y3Q6IENPTFVNTi5VOCxcbiAgICAgIGd1YXJkaWFuc3Bpcml0bW9kaWZpZXI6IENPTFVNTi5JOCxcbiAgICAgIGljZWZvcmdpbmc6IENPTFVNTi5VOCxcbiAgICAgIGNsb2Nrd29ya2xvcmQ6IENPTFVNTi5VOCxcbiAgICAgIG1pbnNpemVsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIGlyb252dWw6IENPTFVNTi5VOCxcbiAgICAgIGhlYXRoZW5zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHBvd2Vyb2ZkZWF0aDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtdGltZTogQ09MVU1OLkk4LFxuICAgICAgdHdpY2Vib3JuOiBDT0xVTU4uVTE2LFxuICAgICAgdG1wYXN0cmFsZ2VtczogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRoZXJvYWI6IENPTFVNTi5VOCxcbiAgICAgIHV3ZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgc2FsdHZ1bDogQ09MVU1OLlU4LFxuICAgICAgbGFuZGVuYzogQ09MVU1OLlU4LFxuICAgICAgcGxhZ3VlZG9jdG9yOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWx1Y2tzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGZhcnRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcm1hcms6IENPTFVNTi5VOCxcbiAgICAgIGFsbHJldDogQ09MVU1OLlU4LFxuICAgICAgYWNpZGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgYmVja29uOiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXJib251czogQ09MVU1OLlU4LFxuICAgICAgY2FyY2Fzc2NvbGxlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgbWluZGNvbGxhcjogQ09MVU1OLlU4LFxuICAgICAgbW91bnRhaW5yZWM6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBlbmNocmViYXRlNTA6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjE6IENPTFVNTi5VMTYsXG4gICAgICByYW5kb21zcGVsbDogQ09MVU1OLlU4LFxuICAgICAgaW5zYW5pZnk6IENPTFVNTi5VOCxcbiAgICAgIC8vanVzdCBhIGNvcHkgb2YgcmVhbmltYXRvci4uLlxuICAgICAgLy8ncmVhbmltYXRvcn4xJzogQ09MVU1OLlU4LFxuICAgICAgZGVmZWN0b3I6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgZW5jaHJlYmF0ZTEwOiBDT0xVTU4uVTgsXG4gICAgICB1bmR5aW5nOiBDT0xVTU4uVTgsXG4gICAgICBtb3JhbGVib251czogQ09MVU1OLlU4LFxuICAgICAgdW5jdXJhYmxlYWZmbGljdGlvbjogQ09MVU1OLlUzMixcbiAgICAgIHdpbnRlcnN1bW1vbjFkMzogQ09MVU1OLlUxNixcbiAgICAgIHN0eWdpYW5ndWlkZTogQ09MVU1OLlU4LFxuICAgICAgc21hcnRtb3VudDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtaW5nZmxlc2g6IENPTFVNTi5VOCxcbiAgICAgIGZlYXJvZnRoZWZsb29kOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VzdGl0Y2hlcjogQ09MVU1OLlU4LFxuICAgICAgcmVjb25zdHJ1Y3Rpb246IENPTFVNTi5VOCxcbiAgICAgIG5vZnJpZGVyczogQ09MVU1OLlU4LFxuICAgICAgY29yaWRlcm1ucjogQ09MVU1OLlUxNixcbiAgICAgIGhvbHljb3N0OiBDT0xVTU4uVTgsXG4gICAgICBhbmltYXRlbW5yOiBDT0xVTU4uVTE2LFxuICAgICAgbGljaDogQ09MVU1OLlUxNixcbiAgICAgIGVyYXN0YXJ0YWdlaW5jcmVhc2U6IENPTFVNTi5VMTYsXG4gICAgICBtb3Jlb3JkZXI6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVncm93dGg6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVwcm9kOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlaGVhdDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWx1Y2s6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVtYWdpYzogQ09MVU1OLkk4LFxuICAgICAgbm9mbW91bnRzOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWRhbWFnZXJlY292ZXJ5OiBDT0xVTU4uVTgsXG4gICAgICB1d3BhdGhib29zdDogQ09MVU1OLkk4LFxuICAgICAgcmFuZG9taXRlbXM6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHNsaW1lZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhwb2lzb25leHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHNob2NrZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZHJhd3NpemU6IENPTFVNTi5JOCxcbiAgICAgIHBldHJpZmljYXRpb25pbW11bmU6IENPTFVNTi5VOCxcbiAgICAgIHNjYXJzb3VsczogQ09MVU1OLlU4LFxuICAgICAgc3Bpa2ViYXJiczogQ09MVU1OLlU4LFxuICAgICAgcHJldGVuZGVyc3RhcnRzaXRlOiBDT0xVTU4uVTE2LFxuICAgICAgb2Zmc2NyaXB0cmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIHVubW91bnRlZHNwcjogQ09MVU1OLlUzMixcbiAgICAgIGV4aGF1c3Rpb246IENPTFVNTi5VOCxcbiAgICAgIC8vIG1vdW50ZWQ6IENPTFVNTi5CT09MLCAvLyBkZXByZWNhdGVkXG4gICAgICBib3c6IENPTFVNTi5CT09MLFxuICAgICAgYm9keTogQ09MVU1OLkJPT0wsXG4gICAgICBmb290OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNyb3dub25seTogQ09MVU1OLkJPT0wsXG4gICAgICBob2x5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGlucXVpc2l0b3I6IENPTFVNTi5CT09MLFxuICAgICAgaW5hbmltYXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZW1vbjogQ09MVU1OLkJPT0wsXG4gICAgICBtYWdpY2JlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0b25lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgYW5pbWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBmZW1hbGU6IENPTFVNTi5CT09MLFxuICAgICAgZm9yZXN0c3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRhaW5zdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICB3YXN0ZXN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN3YW1wc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgYXF1YXRpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhbXBoaWJpYW46IENPTFVNTi5CT09MLFxuICAgICAgcG9vcmFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBmbG9hdDogQ09MVU1OLkJPT0wsXG4gICAgICBmbHlpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3Rvcm1pbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgdGVsZXBvcnQ6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb2JpbGU6IENPTFVNTi5CT09MLFxuICAgICAgbm9yaXZlcnBhc3M6IENPTFVNTi5CT09MLFxuICAgICAgaWxsdXNpb246IENPTFVNTi5CT09MLFxuICAgICAgc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzc2Fzc2luOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhlYWw6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgZG9taW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgbm9oZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5lZWRub3RlYXQ6IENPTFVNTi5CT09MLFxuICAgICAgdW5kaXNjaXBsaW5lZDogQ09MVU1OLkJPT0wsXG4gICAgICBzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbGFzaHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibHVudHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBwaWVyY2VyZXM6IENPTFVNTi5CT09MLFxuICAgICAgYmxpbmQ6IENPTFVNTi5CT09MLFxuICAgICAgcGV0cmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICBldGhlcmVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWF0aGN1cnNlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyYW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBzd2FsbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIHRheGNvbGxlY3RvcjogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFpbmltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlxdWU6IENPTFVNTi5CT09MLFxuICAgICAgc2NhbGV3YWxsczogQ09MVU1OLkJPT0wsXG4gICAgICBkaXZpbmVpbnM6IENPTFVNTi5CT09MLFxuICAgICAgaGVhdHJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBjb2xkcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGNoYW9zOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGRlYXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJ1ZzogQ09MVU1OLkJPT0wsXG4gICAgICB1d2J1ZzogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRvcmRlcjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRncm93dGg6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZG9tOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWtlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRoZWZ0b2Z0aGVzdW5hd2U6IENPTFVNTi5CT09MLFxuICAgICAgZHJhZ29ubG9yZDogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5kdmVzc2VsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVsZW1lbnRyYW5nZTogQ09MVU1OLkJPT0wsXG4gICAgICBhc3RyYWxmZXR0ZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbWJhdGNhc3RlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXNpbmdsZXJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBub3dpc2g6IENPTFVNTi5CT09MLFxuICAgICAgbWFzb246IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0c2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgb3duYmxvb2Q6IENPTFVNTi5CT09MLFxuICAgICAgaW52aXNpYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwZWxsc2luZ2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljc3R1ZHk6IENPTFVNTi5CT09MLFxuICAgICAgdW5pZnk6IENPTFVNTi5CT09MLFxuICAgICAgdHJpcGxlM21vbjogQ09MVU1OLkJPT0wsXG4gICAgICB5ZWFydHVybjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnRlbGVwb3J0YWJsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZWFuaW1wcmllc3Q6IENPTFVNTi5CT09MLFxuICAgICAgc3R1bmltbXVuaXR5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHNpbmdsZWJhdHRsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZXNlYXJjaHdpdGhvdXRtYWdpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhdXRvY29tcGV0ZTogQ09MVU1OLkJPT0wsXG4gICAgICBhZHZlbnR1cmVyczogQ09MVU1OLkJPT0wsXG4gICAgICBjbGVhbnNoYXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcWxhYjogQ09MVU1OLkJPT0wsXG4gICAgICByZXF0ZW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgaG9ycm9ybWFya2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYXNoYWg6IENPTFVNTi5CT09MLFxuICAgICAgaXNheWF6YWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhZGFldmE6IENPTFVNTi5CT09MLFxuICAgICAgYmxlc3NmbHk6IENPTFVNTi5CT09MLFxuICAgICAgcGxhbnQ6IENPTFVNTi5CT09MLFxuICAgICAgY29tc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgc25vd21vdmU6IENPTFVNTi5CT09MLFxuICAgICAgc3dpbW1pbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3R1cGlkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNraXJtaXNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgdW5zZWVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vbW92ZXBlbjogQ09MVU1OLkJPT0wsXG4gICAgICB3b2xmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGR1bmdlb246IENPTFVNTi5CT09MLFxuICAgICAgYWJvbGV0aDogQ09MVU1OLkJPT0wsXG4gICAgICBsb2NhbHN1bjogQ09MVU1OLkJPT0wsXG4gICAgICB0bXBmaXJlZ2VtczogQ09MVU1OLkJPT0wsXG4gICAgICBkZWZpbGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50ZWRiZXNlcms6IENPTFVNTi5CT09MLFxuICAgICAgbGFuY2VvazogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5wcmlzb246IENPTFVNTi5CT09MLFxuICAgICAgaHBvdmVyZmxvdzogQ09MVU1OLkJPT0wsXG4gICAgICBpbmRlcHN0YXk6IENPTFVNTi5CT09MLFxuICAgICAgcG9seWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vaG9mOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9ibGVzc2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFsbW9zdHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICB0cnVlc2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgbW9iaWxlYXJjaGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwaXJpdGZvcm06IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzbWFzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRpZ2h0cmVpbjogQ09MVU1OLkJPT0wsXG4gICAgICBnbGFtb3VybWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWJlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vZmFsbGRtZzogQ09MVU1OLkJPT0wsXG4gICAgICBmaXJlZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhdGVyZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBlYXJ0aGVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgcG9wc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNhcGl0YWxob21lOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsdW1zeTogQ09MVU1OLkJPT0wsXG4gICAgICByZWdhaW5tb3VudDogQ09MVU1OLkJPT0wsXG4gICAgICBub2JhcmRpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRpc2NvbTogQ09MVU1OLkJPT0wsXG4gICAgICBub3Rocm93b2ZmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJpcmQ6IENPTFVNTi5CT09MLFxuICAgICAgZGVjYXlyZXM6IENPTFVNTi5CT09MLFxuICAgICAgY3VibW90aGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2VtcHJvZDogQ09MVU1OLlNUUklORyxcbiAgICAgIGZpeGVkbmFtZTogQ09MVU1OLlNUUklORyxcbiAgICB9LFxuICAgIGV4dHJhRmllbGRzOiB7XG4gICAgICB0eXBlOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBzZEluZGV4ID0gYXJncy5yYXdGaWVsZHNbJ3N0YXJ0ZG9tJ107XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3R5cGUnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgLy8gaGF2ZSB0byBmaWxsIGluIG1vcmUgc3R1ZmYgbGF0ZXIsIHdoZW4gd2Ugam9pbiByZWMgdHlwZXMsIG9oIHdlbGxcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzOiBjb21tYW5kZXIsIG1lcmNlbmFyeSwgaGVybywgZXRjXG4gICAgICAgICAgICBpZiAodVtzZEluZGV4XSkgcmV0dXJuIDM7IC8vIGdvZCArIGNvbW1hbmRlclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gMDsgLy8ganVzdCBhIHVuaXRcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgYXJtb3I6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXmFybW9yXFxkJC8pKVxuICAgICAgICAgIC5tYXAoKGUpID0+IGVbMV0pO1xuXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAnYXJtb3InLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTZfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3QgYXJtb3JzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGluZGljZXMpIHtcblxuICAgICAgICAgICAgICBpZiAodVtpXSkgYXJtb3JzLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcm1vcnM7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgd2VhcG9uczogKGluZGV4OiBudW1iZXIsIGFyZ3M6IFNjaGVtYUFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IE9iamVjdC5lbnRyaWVzKGFyZ3MucmF3RmllbGRzKVxuICAgICAgICAgIC5maWx0ZXIoZSA9PiBlWzBdLm1hdGNoKC9ed3BuXFxkJC8pKVxuICAgICAgICAgIC5tYXAoKGUpID0+IGVbMV0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3dlYXBvbnMnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTZfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3Qgd3BuczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIHdwbnMucHVzaChOdW1iZXIodVtpXSkpO1xuICAgICAgICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdwbnM7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJyZjdXN0b21tYWdpYyc6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG5cbiAgICAgICAgY29uc3QgQ01fS0VZUyA9IFsxLDIsMyw0LDUsNl0ubWFwKG4gPT5cbiAgICAgICAgICBgcmFuZCBuYnIgbWFza2Auc3BsaXQoJyAnKS5tYXAoayA9PiBhcmdzLnJhd0ZpZWxkc1tgJHtrfSR7bn1gXSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coeyBDTV9LRVlTIH0pXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJyZjdXN0b21tYWdpYycsIC8vIFBBQ0tFRCBVUFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMzJfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3QgY206IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IEsgb2YgQ01fS0VZUykge1xuICAgICAgICAgICAgICBjb25zdCBbcmFuZCwgbmJyLCBtYXNrXSA9IEsubWFwKGkgPT4gdVtpXSk7XG4gICAgICAgICAgICAgIGlmICghcmFuZCkgYnJlYWs7XG4gICAgICAgICAgICAgIGlmIChuYnIgPiA2MykgdGhyb3cgbmV3IEVycm9yKCdmZnMuLi4nKTtcbiAgICAgICAgICAgICAgY29uc3QgYiA9IG1hc2sgPj4gNztcbiAgICAgICAgICAgICAgY29uc3QgbiA9IG5iciA8PCAxMDtcbiAgICAgICAgICAgICAgY29uc3QgciA9IHJhbmQgPDwgMTY7XG4gICAgICAgICAgICAgIGNtLnB1c2gociB8IG4gfCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbTtcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gICAgb3ZlcnJpZGVzOiB7XG4gICAgICAvLyBjc3YgaGFzIHVucmVzdC90dXJuIHdoaWNoIGlzIGluY3VucmVzdCAvIDEwOyBjb252ZXJ0IHRvIGludCBmb3JtYXRcbiAgICAgIGluY3VucmVzdDogKHYpID0+IHtcbiAgICAgICAgcmV0dXJuIChOdW1iZXIodikgKiAxMCkgfHwgMFxuICAgICAgfVxuICAgIH0sXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlSS5jc3YnOiB7XG4gICAgbmFtZTogJ0l0ZW0nLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnaXRlbWNvc3QxfjEnLCAnd2FybmluZ34xJ10pLFxuICB9LFxuXG4gICcuLi8uLi9nYW1lZGF0YS9NYWdpY1NpdGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNTaXRlJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZG9tY29uZmxpY3R+MScsJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL01lcmNlbmFyeS5jc3YnOiB7XG4gICAgbmFtZTogJ01lcmNlbmFyeScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FmZmxpY3Rpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnQWZmbGljdGlvbicsXG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYW5vbl9wcm92aW5jZV9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdBbm9uUHJvdmluY2VFdmVudCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXJtb3JzLmNzdic6IHtcbiAgICBuYW1lOiAnQXJtb3InLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVfa2V5cy5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUtleScsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5QXJtb3InLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfc3BlbGwuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVNwZWxsJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3dlYXBvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5V2VhcG9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18xX3R5cGVzLmNzdic6IHtcbiAgICAvLyBUT0RPIC0gZ290IHNvbWUgYmlnIGJvaXMgaW4gaGVyZS5cbiAgICBuYW1lOiAnQnVmZkJpdDEnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18yX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnQnVmZkJpdDInLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX2luZm8uY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ1NwZWxsRWZmZWN0SW5mbycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdic6IHtcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIG5hbWU6ICdFZmZlY3RTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c193ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0V2VhcG9uJyxcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VuY2hhbnRtZW50cy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnRW5jaGFudG1lbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ldmVudHMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFnaWNfcGF0aHMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnVGVycmFpblR5cGVCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tb25zdGVyX3RhZ3MuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hbWV0eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdOYW1lVHlwZScsXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYXRpb25zLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9vdGhlcl9wbGFuZXMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ090aGVyUGxhbmUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdQcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3Byb3RlY3Rpb25zX2J5X2FybW9yLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdQcm90ZWN0aW9uQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcmVhbG1zLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdSZWFsbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NpdGVfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBuYW1lOiAnU2l0ZVRlcnJhaW5UeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF9kYW1hZ2VfdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgbmFtZTogJ1NwZWNpYWxEYW1hZ2VUeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF91bmlxdWVfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxVbmlxdWVTdW1tb24nLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdGVycmFpbl9zcGVjaWZpY19zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblNwZWNpZmljU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bml0X2VmZmVjdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0RWZmZWN0JyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bnByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLFxuICAgIG5hbWU6ICdVbnByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvd2VhcG9ucy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCcsICd3ZWFwb24nXSksXG4gIH0sXG59O1xuIiwgImltcG9ydCB0eXBlIHsgU2NoZW1hQXJncywgUm93IH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQge1xuICBTY2hlbWEsXG4gIFRhYmxlLFxuICBDT0xVTU4sXG4gIGFyZ3NGcm9tVGV4dCxcbiAgYXJnc0Zyb21UeXBlLFxuICBDb2x1bW5BcmdzLFxuICBmcm9tQXJnc1xufSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxubGV0IF9uZXh0QW5vblNjaGVtYUlkID0gMTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQ1NWIChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+LFxuKTogUHJvbWlzZTxUYWJsZT4ge1xuICBsZXQgcmF3OiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgcmF3ID0gYXdhaXQgcmVhZEZpbGUocGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byByZWFkIHNjaGVtYSBmcm9tICR7cGF0aH1gLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBzY2hlbWEnKTtcbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBjc3ZUb1RhYmxlKHJhdywgb3B0aW9ucyk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHBhcnNlIHNjaGVtYSBmcm9tICR7cGF0aH06YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHBhcnNlIHNjaGVtYScpO1xuICB9XG59XG5cbnR5cGUgQ3JlYXRlRXh0cmFGaWVsZCA9IChcbiAgaW5kZXg6IG51bWJlcixcbiAgYTogU2NoZW1hQXJncyxcbiAgbmFtZTogc3RyaW5nLFxuICBvdmVycmlkZT86ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55LFxuKSA9PiBDb2x1bW5BcmdzO1xuXG5leHBvcnQgdHlwZSBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIG5hbWU6IHN0cmluZyxcbiAga2V5OiBzdHJpbmcsXG4gIGlnbm9yZUZpZWxkczogU2V0PHN0cmluZz47XG4gIHNlcGFyYXRvcjogc3RyaW5nO1xuICBvdmVycmlkZXM6IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBhbnlbXSkgPT4gYW55PjtcbiAga25vd25GaWVsZHM6IFJlY29yZDxzdHJpbmcsIENPTFVNTj4sXG4gIGV4dHJhRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDcmVhdGVFeHRyYUZpZWxkPixcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIG5hbWU6ICcnLFxuICBrZXk6ICcnLFxuICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoKSxcbiAgb3ZlcnJpZGVzOiB7fSxcbiAga25vd25GaWVsZHM6IHt9LFxuICBleHRyYUZpZWxkczoge30sXG4gIHNlcGFyYXRvcjogJ1xcdCcsIC8vIHN1cnByaXNlIVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3N2VG9UYWJsZShcbiAgcmF3OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5cbik6IFRhYmxlIHtcbiAgY29uc3QgX29wdHMgPSB7IC4uLkRFRkFVTFRfT1BUSU9OUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6IF9vcHRzLm5hbWUsXG4gICAga2V5OiBfb3B0cy5rZXksXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBvdmVycmlkZXM6IF9vcHRzLm92ZXJyaWRlcyxcbiAgfTtcbiAgaWYgKCFzY2hlbWFBcmdzLm5hbWUpIHRocm93IG5ldyBFcnJvcignbmFtZSBpcyByZXF1cmllZCcpO1xuICBpZiAoIXNjaGVtYUFyZ3Mua2V5KSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyByZXF1cmllZCcpO1xuXG4gIGlmIChyYXcuaW5kZXhPZignXFwwJykgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ3VoIG9oJylcblxuICBjb25zdCBbcmF3RmllbGRzLCAuLi5yYXdEYXRhXSA9IHJhd1xuICAgIC5zcGxpdCgnXFxuJylcbiAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgLm1hcChsaW5lID0+IGxpbmUuc3BsaXQoX29wdHMuc2VwYXJhdG9yKSk7XG5cbiAgY29uc3QgaENvdW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gIGZvciAoY29uc3QgW2ksIGZdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBpZiAoIWYpIHRocm93IG5ldyBFcnJvcihgJHtzY2hlbWFBcmdzLm5hbWV9IEAgJHtpfSBpcyBhbiBlbXB0eSBmaWVsZCBuYW1lYCk7XG4gICAgaWYgKGhDb3VudC5oYXMoZikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgJHtzY2hlbWFBcmdzLm5hbWV9IEAgJHtpfSBcIiR7Zn1cIiBpcyBhIGR1cGxpY2F0ZSBmaWVsZCBuYW1lYCk7XG4gICAgICBjb25zdCBuID0gaENvdW50LmdldChmKSFcbiAgICAgIHJhd0ZpZWxkc1tpXSA9IGAke2Z9fiR7bn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBoQ291bnQuc2V0KGYsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJhd0NvbHVtbnM6IENvbHVtbkFyZ3NbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtpbmRleCwgbmFtZV0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGxldCBjOiBudWxsIHwgQ29sdW1uQXJncyA9IG51bGw7XG4gICAgc2NoZW1hQXJncy5yYXdGaWVsZHNbbmFtZV0gPSBpbmRleDtcbiAgICBpZiAoX29wdHMuaWdub3JlRmllbGRzPy5oYXMobmFtZSkpIGNvbnRpbnVlO1xuICAgIGlmIChfb3B0cy5rbm93bkZpZWxkc1tuYW1lXSkge1xuICAgICAgYyA9IGFyZ3NGcm9tVHlwZShcbiAgICAgICAgbmFtZSxcbiAgICAgICAgX29wdHMua25vd25GaWVsZHNbbmFtZV0sXG4gICAgICAgIGluZGV4LFxuICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBjID0gYXJnc0Zyb21UZXh0KFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICAgICByYXdEYXRhLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgR09PQiBJTlRFUkNFUFRFRCBJTiAke3NjaGVtYUFyZ3MubmFtZX06IFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX1cXHgxYlswbWAsXG4gICAgICAgICAgICBleFxuICAgICAgICApO1xuICAgICAgICB0aHJvdyBleFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYyAhPT0gbnVsbCkge1xuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICByYXdDb2x1bW5zLnB1c2goYyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdGlvbnM/LmV4dHJhRmllbGRzKSB7XG4gICAgY29uc3QgYmkgPSBPYmplY3QudmFsdWVzKHNjaGVtYUFyZ3MucmF3RmllbGRzKS5sZW5ndGg7IC8vIGhtbW1tXG4gICAgcmF3Q29sdW1ucy5wdXNoKC4uLk9iamVjdC5lbnRyaWVzKG9wdGlvbnMuZXh0cmFGaWVsZHMpLm1hcChcbiAgICAgIChbbmFtZSwgY3JlYXRlQ29sdW1uXTogW3N0cmluZywgQ3JlYXRlRXh0cmFGaWVsZF0sIGVpOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhlaSwgc2NoZW1hQXJncy5yYXdGaWVsZHMpXG4gICAgICAgIGNvbnN0IGluZGV4ID0gYmkgKyBlaTtcbiAgICAgICAgY29uc3QgY2EgPSBjcmVhdGVDb2x1bW4oaW5kZXgsIHNjaGVtYUFyZ3MsIG5hbWUsIG92ZXJyaWRlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoY2EuaW5kZXggIT09IGluZGV4KSB0aHJvdyBuZXcgRXJyb3IoJ3dpc2VndXkgcGlja2VkIGhpcyBvd24gaW5kZXgnKTtcbiAgICAgICAgICBpZiAoY2EubmFtZSAhPT0gbmFtZSkgdGhyb3cgbmV3IEVycm9yKCd3aXNlZ3V5IHBpY2tlZCBoaXMgb3duIG5hbWUnKTtcbiAgICAgICAgICBpZiAoY2EudHlwZSA9PT0gQ09MVU1OLkJPT0wpIHtcbiAgICAgICAgICAgIGlmIChjYS5iaXQgIT09IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgYmFieSBpZGlvdCcpO1xuICAgICAgICAgICAgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgY29uc29sZS5sb2coY2EsIHsgaW5kZXgsIG92ZXJyaWRlLCBuYW1lLCB9KVxuICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGRhdGE6IFJvd1tdID0gbmV3IEFycmF5KHJhd0RhdGEubGVuZ3RoKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoXywgX19yb3dJZCkgPT4gKHsgX19yb3dJZCB9KSlcbiAgICA7XG5cbiAgZm9yIChjb25zdCBjb2xBcmdzIG9mIHJhd0NvbHVtbnMpIHtcbiAgICBjb25zdCBjb2wgPSBmcm9tQXJncyhjb2xBcmdzKTtcbiAgICBzY2hlbWFBcmdzLmNvbHVtbnMucHVzaChjb2wpO1xuICAgIHNjaGVtYUFyZ3MuZmllbGRzLnB1c2goY29sLm5hbWUpO1xuICB9XG5cbiAgaWYgKHNjaGVtYUFyZ3Mua2V5ICE9PSAnX19yb3dJZCcgJiYgIXNjaGVtYUFyZ3MuZmllbGRzLmluY2x1ZGVzKHNjaGVtYUFyZ3Mua2V5KSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGZpZWxkcyBpcyBtaXNzaW5nIHRoZSBzdXBwbGllZCBrZXkgXCIke3NjaGVtYUFyZ3Mua2V5fVwiYCk7XG5cbiAgZm9yIChjb25zdCBjb2wgb2Ygc2NoZW1hQXJncy5jb2x1bW5zKSB7XG4gICAgZm9yIChjb25zdCByIG9mIGRhdGEpXG4gICAgICBkYXRhW3IuX19yb3dJZF1bY29sLm5hbWVdID0gY29sLmZyb21UZXh0KFxuICAgICAgICByYXdEYXRhW3IuX19yb3dJZF1bY29sLmluZGV4XSxcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdLFxuICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgVGFibGUoZGF0YSwgbmV3IFNjaGVtYShzY2hlbWFBcmdzKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUFsbChkZWZzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4+KSB7XG4gIHJldHVybiBQcm9taXNlLmFsbChcbiAgICBPYmplY3QuZW50cmllcyhkZWZzKS5tYXAoKFtwYXRoLCBvcHRpb25zXSkgPT4gcmVhZENTVihwYXRoLCBvcHRpb25zKSlcbiAgKTtcbn1cbiIsICJpbXBvcnQgeyBjc3ZEZWZzIH0gZnJvbSAnLi9jc3YtZGVmcyc7XG5pbXBvcnQgeyBQYXJzZVNjaGVtYU9wdGlvbnMsIHBhcnNlQWxsLCByZWFkQ1NWIH0gZnJvbSAnLi9wYXJzZS1jc3YnO1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgeyB3cml0ZUZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGpvaW5EdW1wZWQgfSBmcm9tICcuL2pvaW4tdGFibGVzJztcblxuY29uc3Qgd2lkdGggPSBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zO1xuY29uc3QgW2ZpbGUsIC4uLmZpZWxkc10gPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG5cbmZ1bmN0aW9uIGZpbmREZWYgKG5hbWU6IHN0cmluZyk6IFtzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPl0ge1xuICBpZiAoY3N2RGVmc1tuYW1lXSkgcmV0dXJuIFtuYW1lLCBjc3ZEZWZzW25hbWVdXTtcbiAgZm9yIChjb25zdCBrIGluIGNzdkRlZnMpIHtcbiAgICBjb25zdCBkID0gY3N2RGVmc1trXTtcbiAgICBpZiAoZC5uYW1lID09PSBuYW1lKSByZXR1cm4gW2ssIGRdO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgbm8gY3N2IGRlZmluZWQgZm9yIFwiJHtuYW1lfVwiYCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGR1bXBPbmUoa2V5OiBzdHJpbmcpIHtcbiAgY29uc3QgdGFibGUgPSBhd2FpdCByZWFkQ1NWKC4uLmZpbmREZWYoa2V5KSk7XG4gIGNvbXBhcmVEdW1wcyh0YWJsZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGR1bXBBbGwgKCkge1xuICBjb25zdCB0YWJsZXMgPSBhd2FpdCBwYXJzZUFsbChjc3ZEZWZzKTtcbiAgLy8gSk9JTlNcbiAgam9pbkR1bXBlZCh0YWJsZXMpO1xuICBjb25zdCBkZXN0ID0gJy4vZGF0YS9kYi4zMC5iaW4nXG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXModGFibGVzKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGRlc3QsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gIGNvbnNvbGUubG9nKGB3cm90ZSAke2Jsb2Iuc2l6ZX0gYnl0ZXMgdG8gJHtkZXN0fWApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb21wYXJlRHVtcHModDogVGFibGUpIHtcbiAgY29uc3QgbWF4TiA9IHQucm93cy5sZW5ndGggLSAzMFxuICBsZXQgbjogbnVtYmVyO1xuICBsZXQgcDogYW55ID0gdW5kZWZpbmVkO1xuICBpZiAoZmllbGRzWzBdID09PSAnRklMVEVSJykge1xuICAgIG4gPSAwOyAvLyB3aWxsIGJlIGluZ29yZWRcbiAgICBmaWVsZHMuc3BsaWNlKDAsIDEsICdpZCcsICduYW1lJyk7XG4gICAgcCA9IChyOiBhbnkpID0+IGZpZWxkcy5zbGljZSgyKS5zb21lKGYgPT4gcltmXSk7XG4gIH0gZWxzZSBpZiAoZmllbGRzWzFdID09PSAnUk9XJyAmJiBmaWVsZHNbMl0pIHtcbiAgICBuID0gTnVtYmVyKGZpZWxkc1syXSkgLSAxNTtcbiAgICBmaWVsZHMuc3BsaWNlKDEsIDIpXG4gICAgY29uc29sZS5sb2coYGVuc3VyZSByb3cgJHtmaWVsZHNbMl19IGlzIHZpc2libGUgKCR7bn0pYCk7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkgdGhyb3cgbmV3IEVycm9yKCdST1cgbXVzdCBiZSBOVU1CRVIhISEhJyk7XG4gIH0gZWxzZSB7XG4gICAgbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heE4pXG4gIH1cbiAgbiA9IE1hdGgubWluKG1heE4sIE1hdGgubWF4KDAsIG4pKTtcbiAgY29uc3QgbSA9IG4gKyAzMDtcbiAgY29uc3QgZiA9IChmaWVsZHMubGVuZ3RoID8gKGZpZWxkc1swXSA9PT0gJ0FMTCcgPyB0LnNjaGVtYS5maWVsZHMgOiBmaWVsZHMpIDpcbiAgIHQuc2NoZW1hLmZpZWxkcy5zbGljZSgwLCAxMCkpIGFzIHN0cmluZ1tdXG4gIGR1bXBUb0NvbnNvbGUodCwgbiwgbSwgZiwgJ0JFRk9SRScsIHApO1xuICAvKlxuICBpZiAoMSArIDEgPT09IDIpIHJldHVybjsgLy8gVE9ETyAtIHdlIG5vdCB3b3JyaWVkIGFib3V0IHRoZSBvdGhlciBzaWRlIHlldFxuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKFt0XSk7XG4gIGNvbnNvbGUubG9nKGBtYWRlICR7YmxvYi5zaXplfSBieXRlIGJsb2JgKTtcbiAgY29uc29sZS5sb2coJ3dhaXQuLi4uJyk7XG4gIC8vKGdsb2JhbFRoaXMuX1JPV1MgPz89IHt9KVt0LnNjaGVtYS5uYW1lXSA9IHQucm93cztcbiAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKTtcbiAgY29uc29sZS5sb2coJ1xcblxcbicpXG4gIGNvbnN0IHUgPSBhd2FpdCBUYWJsZS5vcGVuQmxvYihibG9iKTtcbiAgZHVtcFRvQ29uc29sZSh1W3Quc2NoZW1hLm5hbWVdLCBuLCBtLCBmLCAnQUZURVInLCBwKTtcbiAgLy9hd2FpdCB3cml0ZUZpbGUoJy4vdG1wLmJpbicsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gICovXG59XG5cbmZ1bmN0aW9uIGR1bXBUb0NvbnNvbGUoXG4gIHQ6IFRhYmxlLFxuICBuOiBudW1iZXIsXG4gIG06IG51bWJlcixcbiAgZjogc3RyaW5nW10sXG4gIGg6IHN0cmluZyxcbiAgcD86IChyOiBhbnkpID0+IGJvb2xlYW4sXG4pIHtcbiAgY29uc29sZS5sb2coYFxcbiAgICAgJHtofTpgKTtcbiAgdC5zY2hlbWEucHJpbnQod2lkdGgpO1xuICBjb25zb2xlLmxvZyhgKHZpZXcgcm93cyAke259IC0gJHttfSlgKTtcbiAgY29uc3Qgcm93cyA9IHQucHJpbnQod2lkdGgsIGYsIG4sIG0sIHApO1xuICBpZiAocm93cykgZm9yIChjb25zdCByIG9mIHJvd3MpIGNvbnNvbGUudGFibGUoW3JdKTtcbiAgY29uc29sZS5sb2coYCAgICAvJHtofVxcblxcbmApXG59XG5cblxuXG5jb25zb2xlLmxvZygnQVJHUycsIHsgZmlsZSwgZmllbGRzIH0pXG5cbmlmIChmaWxlKSBkdW1wT25lKGZpbGUpO1xuZWxzZSBkdW1wQWxsKCk7XG5cblxuIiwgImltcG9ydCB7IEJvb2xDb2x1bW4sIENPTFVNTiwgTnVtZXJpY0NvbHVtbiwgU2NoZW1hLCBTY2hlbWFBcmdzLCBUYWJsZSB9XG4gIGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5mdW5jdGlvbiBmaW5kVGFibGUgKG5hbWU6IHN0cmluZywgdGFibGVzOiBUYWJsZVtdKTogVGFibGUge1xuICBmb3IgKGNvbnN0IHQgb2YgdGFibGVzKSBpZiAodC5zY2hlbWEubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHQ7XG4gIHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IGZpbGQgdGhlIHRhYmxlIGNhbGxlZCBcIiR7bmFtZX1cImApO1xufVxuXG50eXBlIFRSID0gUmVjb3JkPHN0cmluZywgVGFibGU+O1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5EdW1wZWQgKHRhYmxlTGlzdDogVGFibGVbXSkge1xuICBjb25zdCB0YWJsZXM6IFRSID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlTGlzdC5tYXAodCA9PiBbdC5uYW1lLCB0XSkpO1xuICB0YWJsZUxpc3QucHVzaChcbiAgICBtYWtlTmF0aW9uU2l0ZXModGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5U2l0ZSh0YWJsZXMpLFxuICAgIG1ha2VTcGVsbEJ5TmF0aW9uKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlVbml0KHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeU5hdGlvbih0YWJsZXMpLFxuICApO1xuXG59XG5cblxuY29uc3QgQVRUUl9GQVJTVU1DT00gPSA3OTA7IC8vIGx1bCB3aHkgaXMgdGhpcyB0aGUgb25seSBvbmU/P1xuXG4vLyBUT0RPIC0gcmVhbmltYXRpb25zIGFzd2VsbD8gdHdpY2Vib3JuIHRvbz8gbGVtdXJpYS1lc3F1ZSBmcmVlc3Bhd24/IHZvaWRnYXRlP1xuLy8gbWlnaHQgaGF2ZSB0byBhZGQgYWxsIHRoYXQgbWFudWFsbHksIHdoaWNoIHNob3VsZCBiZSBva2F5IHNpbmNlIGl0J3Mgbm90IGxpa2Vcbi8vIHRoZXkncmUgYWNjZXNzaWJsZSB0byBtb2RzIGFueXdheVxuZXhwb3J0IGNvbnN0IGVudW0gUkVDX1NSQyB7XG4gIFVOS05PV04gPSAwLCAvLyBpLmUuIG5vbmUgZm91bmQsIHByb2JhYmx5IGluZGllIHBkP1xuICBTVU1NT05fQUxMSUVTID0gMSwgLy8gdmlhICNtYWtlbW9uc3Rlck5cbiAgU1VNTU9OX0RPTSA9IDIsIC8vIHZpYSAjW3JhcmVdZG9tc3VtbW9uTlxuICBTVU1NT05fQVVUTyA9IDMsIC8vIHZpYSAjc3VtbW9uTiAvIFwidHVybW9pbHN1bW1vblwiIC8gd2ludGVyc3VtbW9uMWQzXG4gIFNVTU1PTl9CQVRUTEUgPSA0LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIFRFTVBMRV9UUkFJTkVSID0gNSwgLy8gdmlhICN0ZW1wbGV0cmFpbmVyLCB2YWx1ZSBpcyBoYXJkIGNvZGVkIHRvIDE4NTkuLi5cbiAgUklUVUFMID0gNixcbiAgRU5URVJfU0lURSA9IDcsXG4gIFJFQ19TSVRFID0gOCxcbiAgUkVDX0NBUCA9IDksXG4gIFJFQ19GT1JFSUdOID0gMTAsXG4gIFJFQ19GT1JUID0gMTEsXG4gIEVWRU5UID0gMTIsXG4gIEhFUk8gPSAxMyxcbiAgUFJFVEVOREVSID0gMTQsXG59XG5cbiAgLypcbmNvbnN0IFNVTV9GSUVMRFMgPSBbXG4gIC8vIHRoZXNlIHR3byBjb21iaW5lZCBzZWVtIHRvIGJlIHN1bW1vbiAjbWFrZW1vbnN0ZXJOXG4gICdzdW1tb24nLCAnbl9zdW1tb24nLFxuICAvLyB0aGlzIGlzIHVzZWQgYnkgdGhlIGdob3VsIGxvcmQgb25seSwgYW5kIGl0IHNob3VsZCBhY3R1YWxseSBiZSBgbl9zdW1tb24gPSA1YFxuICAnc3VtbW9uNScsXG4gIC8vIGF1dG8gc3VtbW9uIDEvbW9udGgsIGFzIHBlciBtb2QgY29tbWFuZHMsIHVzZWQgb25seSBieSBmYWxzZSBwcm9waGV0IGFuZCB2aW5lIGd1eT9cbiAgJ3N1bW1vbjEnLFxuXG4gIC8vIGRvbSBzdW1tb24gY29tbWFuZHNcbiAgJ2RvbXN1bW1vbicsXG4gICdkb21zdW1tb24yJyxcbiAgJ2RvbXN1bW1vbjIwJyxcbiAgJ3JhcmVkb21zdW1tb24nLFxuXG4gICdiYXRzdGFydHN1bTEnLFxuICAnYmF0c3RhcnRzdW0yJyxcbiAgJ2JhdHN0YXJ0c3VtMycsXG4gICdiYXRzdGFydHN1bTQnLFxuICAnYmF0c3RhcnRzdW01JyxcbiAgJ2JhdHN0YXJ0c3VtMWQzJyxcbiAgJ2JhdHN0YXJ0c3VtMWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtMmQ2JyxcbiAgJ2JhdHN0YXJ0c3VtM2Q2JyxcbiAgJ2JhdHN0YXJ0c3VtNGQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNmQ2JyxcbiAgJ2JhdHRsZXN1bTUnLCAvLyBwZXIgcm91bmRcblxuICAvLydvbmlzdW1tb24nLCB3ZSBkb250IHJlYWxseSBjYXJlIGFib3V0IHRoaXMgb25lIGJlY2F1c2UgaXQgZG9lc250IHRlbGwgdXNcbiAgLy8gIGFib3V0IHdoaWNoIG1vbnN0ZXJzIGFyZSBzdW1tb25lZFxuICAvLyAnaGVhdGhlbnN1bW1vbicsIGlkZms/PyBodHRwczovL2lsbHdpa2kuY29tL2RvbTUvdXNlci9sb2dneS9zbGF2ZXJcbiAgLy8gJ2NvbGRzdW1tb24nLCB1bnVzZWRcbiAgJ3dpbnRlcnN1bW1vbjFkMycsIC8vIHZhbXAgcXVlZW4sIG5vdCBhY3R1YWxseSBhIChkb2N1bWVudGVkKSBjb21tYW5kP1xuXG4gICd0dXJtb2lsc3VtbW9uJywgLy8gYWxzbyBub3QgYSBjb21tYW5kIH4gIVxuXVxuKi9cblxuZnVuY3Rpb24gbWFrZU5hdGlvblNpdGVzKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHsgQXR0cmlidXRlQnlOYXRpb24gfSA9IHRhYmxlcztcbiAgY29uc3QgZGVsUm93czogbnVtYmVyW10gPSBbXTtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1NpdGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAxLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBqb2luczogJ05hdGlvbi5uYXRpb25JZDpNYWdpY1NpdGUuc2l0ZUlkJyxcbiAgICBmaWVsZHM6IFtcbiAgICAgICduYXRpb25JZCcsXG4gICAgICAnc2l0ZUlkJyxcbiAgICAgICdmdXR1cmUnLFxuICAgIF0sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzaXRlSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IEJvb2xDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnZnV0dXJlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5CT09MLFxuICAgICAgICBiaXQ6IDAsXG4gICAgICAgIGZsYWc6IDFcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdXG4gIGZvciAobGV0IFtpLCByb3ddIG9mIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCwgYXR0cmlidXRlLCByYXdfdmFsdWU6IHNpdGVJZCB9ID0gcm93O1xuICAgIGxldCBmdXR1cmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSA2MzE6XG4gICAgICAgIGZ1dHVyZSA9IHRydWU7XG4gICAgICAgIC8vIHUga25vdyB0aGlzIGJpdGNoIGZhbGxzIFRIUlVcbiAgICAgIGNhc2UgNTI6XG4gICAgICBjYXNlIDEwMDpcbiAgICAgIGNhc2UgMjU6XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gc29tZSBvdGhlciBkdW1iYXNzIGF0dHJpYnV0ZVxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByb3dzLnB1c2goe1xuICAgICAgbmF0aW9uSWQsXG4gICAgICBzaXRlSWQsXG4gICAgICBmdXR1cmUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICB9KTtcbiAgICBkZWxSb3dzLnB1c2goaSk7XG4gIH1cblxuICAvLyByZW1vdmUgbm93LXJlZHVuZGFudCBhdHRyaWJ1dGVzXG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG59XG5cbi8qXG5mdW5jdGlvbiBtYWtlVW5pdFNvdXJjZVNjaGVtYSAoKTogYW55IHtcbiAgcmV0dXJuIG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0U291cmNlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIG5hdGlvbklkOiAxLFxuICAgICAgc291cmNlSWQ6IDIsXG4gICAgICBzb3VyY2VUeXBlOiAzLFxuICAgICAgc291cmNlQXJnOiA0LFxuICAgIH0sXG4gICAgZmllbGRzOiBbXG4gICAgICAndW5pdElkJyxcbiAgICAgICduYXRpb25JZCcsXG4gICAgICAnc291cmNlSWQnLFxuICAgICAgJ3NvdXJjZVR5cGUnLFxuICAgICAgJ3NvdXJjZUFyZycsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlSWQnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlVHlwZScsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NvdXJjZUFyZycsXG4gICAgICAgIGluZGV4OiA0LFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcbn1cbiovXG5cbmZ1bmN0aW9uIG1ha2VTcGVsbEJ5TmF0aW9uICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbC5zcGVsbElkOk5hdGlvbi5uYXRpb25JZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNwZWxsSWQ6IDAsIG5hdGlvbklkOiAxIH0sXG4gICAgZmllbGRzOiBbJ3NwZWxsSWQnLCAnbmF0aW9uSWQnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzcGVsbElkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ25hdGlvbklkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgbGV0IF9fcm93SWQgPSAwO1xuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtpLCByXSBvZiBhdHRycy5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgc3BlbGxfbnVtYmVyOiBzcGVsbElkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZSB9ID0gcjtcbiAgICBpZiAoYXR0cmlidXRlID09PSAyNzgpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCR7c3BlbGxJZH0gSVMgUkVTVFJJQ1RFRCBUTyBOQVRJT04gJHtyYXdfdmFsdWV9YCk7XG4gICAgICBjb25zdCBuYXRpb25JZCA9IE51bWJlcihyYXdfdmFsdWUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuYXRpb25JZCkgfHwgbmF0aW9uSWQgPCAwIHx8IG5hdGlvbklkID4gMjU1KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAgICAgISEhISEgVE9PIEJJRyBOQVlTSCAhISEhISAoJHtuYXRpb25JZH0pYCk7XG4gICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICByb3dzLnB1c2goeyBfX3Jvd0lkLCBzcGVsbElkLCBuYXRpb25JZCB9KTtcbiAgICAgIF9fcm93SWQrKztcbiAgICB9XG4gIH1cbiAgbGV0IGRpOiBudW1iZXJ8dW5kZWZpbmVkO1xuICB3aGlsZSAoKGRpID0gZGVsUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZCkgYXR0cnMucm93cy5zcGxpY2UoZGksIDEpO1xuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xufVxuXG5mdW5jdGlvbiBtYWtlU3BlbGxCeVVuaXQgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5VW5pdCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbC5zcGVsbElkOlVuaXQudW5pdElkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc3BlbGxJZDogMCwgdW5pdElkOiAxIH0sXG4gICAgZmllbGRzOiBbJ3NwZWxsSWQnLCAndW5pdElkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLkkzMixcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgbGV0IF9fcm93SWQgPSAwO1xuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuICAvLyBUT0RPIC0gaG93IHRvIGRpZmZlcmVudGlhdGUgdW5pdCB2cyBjb21tYW5kZXIgc3VtbW9uPyBpIGZvcmdldCBpZiBpIGZpZ3VyZWRcbiAgLy8gdGhpcyBvdXQgYWxyZWFkeVxuICBmb3IgKGNvbnN0IFtpLCByXSBvZiBhdHRycy5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgc3BlbGxfbnVtYmVyOiBzcGVsbElkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZSB9ID0gcjtcbiAgICBpZiAoYXR0cmlidXRlID09PSA3MzEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gVU5JVCAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IHVuaXRJZCA9IE51bWJlcihyYXdfdmFsdWUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcih1bml0SWQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAgICAgISEhISEgVE9PIEJJRyBVTklUICEhISEhICgke3VuaXRJZH0pYCk7XG4gICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICByb3dzLnB1c2goeyBfX3Jvd0lkLCBzcGVsbElkLCB1bml0SWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICB3aGlsZSAoKGRpID0gZGVsUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZCkgYXR0cnMucm93cy5zcGxpY2UoZGksIDEpO1xuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xufVxuXG4vLyBmZXcgdGhpbmdzIGhlcmU6XG4vLyAtIGhtb24xLTUgJiBoY29tMS00IGFyZSBjYXAtb25seSB1bml0cy9jb21tYW5kZXJzXG4vLyAtIG5hdGlvbmFscmVjcnVpdHMgKyBuYXRjb20gLyBuYXRtb24gYXJlIG5vbi1jYXAgb25seSBzaXRlLWV4Y2x1c2l2ZXMgKHlheSlcbi8vIC0gbW9uMS0yICYgY29tMS0zIGFyZSBnZW5lcmljIHJlY3J1aXRhYmxlIHVuaXRzL2NvbW1hbmRlcnNcbi8vIC0gc3VtMS00ICYgbl9zdW0xLTQgYXJlIG1hZ2Utc3VtbW9uYWJsZSAobiBkZXRlcm1pbmVzIG1hZ2UgbHZsIHJlcSlcbi8vICh2b2lkZ2F0ZSAtIG5vdCByZWFsbHkgcmVsZXZhbnQgaGVyZSwgaXQgZG9lc24ndCBpbmRpY2F0ZSB3aGF0IG1vbnN0ZXJzIGFyZVxuLy8gc3VtbW9uZWQsIG1heSBhZGQgdGhvc2UgbWFudWFsbHk/KVxuXG5leHBvcnQgZW51bSBTSVRFX1JFQyB7XG4gIEhPTUVfTU9OID0gMCwgLy8gYXJnIGlzIG5hdGlvbiwgd2UnbGwgaGF2ZSB0byBhZGQgaXQgbGF0ZXIgdGhvdWdoXG4gIEhPTUVfQ09NID0gMSwgLy8gc2FtZVxuICBSRUNfTU9OID0gMixcbiAgUkVDX0NPTSA9IDMsXG4gIE5BVF9NT04gPSA0LCAvLyBhcmcgaXMgbmF0aW9uXG4gIE5BVF9DT00gPSA1LCAvLyBzYW1lXG4gIFNVTU1PTiA9IDgsIC8vIGFyZyBpcyBsZXZlbCByZXF1aXJlbWVudFxufVxuXG5jb25zdCBTX0hNT05TID0gQXJyYXkuZnJvbSgnMTIzNDUnLCBuID0+IGBobW9uJHtufWApO1xuY29uc3QgU19IQ09NUyA9IEFycmF5LmZyb20oJzEyMzQnLCBuID0+IGBoY29tJHtufWApO1xuY29uc3QgU19STU9OUyA9IEFycmF5LmZyb20oJzEyJywgbiA9PiBgbW9uJHtufWApO1xuY29uc3QgU19SQ09NUyA9IEFycmF5LmZyb20oJzEyMycsIG4gPT4gYGNvbSR7bn1gKTtcbmNvbnN0IFNfU1VNTlMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBbYHN1bSR7bn1gLCBgbl9zdW0ke259YF0pO1xuXG5mdW5jdGlvbiBtYWtlVW5pdEJ5U2l0ZSAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBNYWdpY1NpdGUsIFNpdGVCeU5hdGlvbiwgVW5pdCB9ID0gdGFibGVzO1xuICBpZiAoIVNpdGVCeU5hdGlvbikgdGhyb3cgbmV3IEVycm9yKCdkbyBzaXRlIGJ5IG5hdGlvbiBmaXJzdCcpO1xuXG4gIC8vIGJlY2F1c2Ugd2Ugd29udCBoYXZlIHRoZSByZWFsIG9uZSwgdXNlIGEgdGVtcC4gc3RhcnRTaXRlIC0+IG5hdGlvbiBtYXBcbiAgLy8gdGhpcyB3b250IHJlYWxseSB3b3JrIGlmIG1vcmUgdGhhbiBvbmUgbmF0aW9uIHN0YXJ0cyB3aXRoIHRoZSBzYW1lIHNpdGVcbiAgY29uc3Qgc25NYXAgPSBuZXcgTWFwPG51bWJlciwgbnVtYmVyPigpO1xuXG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0QnlTaXRlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1VuaXQudW5pdElkOk1hZ2ljU2l0ZS5zaXRlSWQnLCAvLyBUT0RPIC0gdGJoLi4uIGtpbmRhIGpvaW5zIG5hdGlvbiBhc3dlbGxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc2l0ZUlkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIsIHJlY0FyZzogMyB9LFxuICAgIGZpZWxkczogWydzaXRlSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnLCAncmVjQXJnJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjQXJnJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuXG5cbiAgICAgIC8vIFRPRE8gLSBNT0FSIFNUVUZGXG4gICAgXVxuICB9KTtcblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIGZvciAoY29uc3Qgc2l0ZSBvZiBNYWdpY1NpdGUucm93cykge1xuICAgIGZvciAoY29uc3QgayBvZiBTX0hNT05TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gc25NYXAuZ2V0KHNpdGUuaWQgYXMgbnVtYmVyKTtcbiAgICAgIGlmICghcmVjQXJnKSBzbk1hcC5zZXQoXG4gICAgICAgIHNpdGUuaWQgYXMgbnVtYmVyLFxuICAgICAgICByZWNBcmcgPSBTaXRlQnlOYXRpb24ucm93cy5maW5kKHIgPT4gci5zaXRlSWQgPT09IHNpdGUuaWQpPy5uYXRpb25JZCBhcyBudW1iZXJcbiAgICAgICk7XG4gICAgICBpZiAoIXJlY0FyZykge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlJywgaywgc2l0ZS5pZCwgc2l0ZS5uYW1lKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gc25NYXAuZ2V0KHNpdGUuaWQgYXMgbnVtYmVyKTtcbiAgICAgIGlmICghcmVjQXJnKSBzbk1hcC5zZXQoXG4gICAgICAgIHNpdGUuaWQgYXMgbnVtYmVyLFxuICAgICAgICByZWNBcmcgPSBTaXRlQnlOYXRpb24ucm93cy5maW5kKHIgPT4gci5zaXRlSWQgPT09IHNpdGUuaWQpPy5uYXRpb25JZCBhcyBudW1iZXJcbiAgICAgICk7XG4gICAgICBpZiAoIXJlY0FyZykge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlJywgaywgc2l0ZS5pZCwgc2l0ZS5uYW1lKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQobW5yKTtcbiAgICAgIGlmICh1bml0KSB7XG4gICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY0FyZyxcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuSE9NRV9DT00sXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrIG9mIFNfUk1PTlMpIHtcbiAgICAgIGNvbnN0IG1uciA9IHNpdGVba107XG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KG1ucik7XG4gICAgICBpZiAodW5pdCkge1xuICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgc2l0ZSBjb21tYW5kZXIgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2ssIG5rXSBvZiBTX1NVTU5TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCBhcmcgPSBzaXRlW25rXTtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5TVU1NT04sXG4gICAgICAgIHJlY0FyZzogYXJnLCAvLyBsZXZlbCByZXF1aXVyZW1lbnQgKGNvdWxkIGFsc28gaW5jbHVkZSBwYXRoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNpdGUubmF0aW9uYWxyZWNydWl0cykge1xuICAgICAgaWYgKHNpdGUubmF0bW9uKSByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IHNpdGUubmF0bW9uLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5OQVRfTU9OLFxuICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgIH0pO1xuICAgICAgaWYgKHNpdGUubmF0Y29tKSB7XG4gICAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICAgIHVuaXRJZDogc2l0ZS5uYXRjb20sXG4gICAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX0NPTSxcbiAgICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQoc2l0ZS5uYXRjb20pO1xuICAgICAgICBpZiAodW5pdCkge1xuICAgICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgbmF0Y29tIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHlheSFcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbn1cblxuZnVuY3Rpb24gbWFrZVVuaXRCeVVuaXRTdW1tb24gKCkge1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6ICdVbml0QnlTaXRlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgdW5pdElkOiAwLCBzdW1tb25lcklkOiAxIH0sXG4gICAgZmllbGRzOiBbJ3VuaXRJZCcsICdzdW1tb25lcklkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vbmVySWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgIF1cbiAgfTtcblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIHJldHVybiBuZXcgVGFibGUocm93cywgbmV3IFNjaGVtYShzY2hlbWFBcmdzKSk7XG59XG5cbi8vIFRPRE8gLSBleHBvcnQgdGhlc2UgZnJvbSBzb21ld2hlcmUgbW9yZSBzZW5zaWJsZVxuZXhwb3J0IGNvbnN0IGVudW0gUkVDX1RZUEUge1xuICBGT1JUID0gMCwgLy8gbm9ybWFsIGkgZ3Vlc3NcbiAgUFJFVEVOREVSID0gMSwgLy8gdSBoZWFyZCBpdCBoZXJlXG4gIEZPUkVJR04gPSAyLFxuICBXQVRFUiA9IDMsXG4gIENPQVNUID0gNCxcbiAgRk9SRVNUID0gNSxcbiAgU1dBTVAgPSA2LFxuICBXQVNURSA9IDcsXG4gIE1PVU5UQUlOID0gOCxcbiAgQ0FWRSA9IDksXG4gIFBMQUlOUyA9IDEwLFxuICBIRVJPID0gMTEsXG4gIE1VTFRJSEVSTyA9IDEyLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBVTklUX1RZUEUge1xuICBOT05FID0gMCwgICAgICAvLyBqdXN0IGEgdW5pdC4uLlxuICBDT01NQU5ERVIgPSAxLFxuICBQUkVURU5ERVIgPSAyLFxuICBDQVBPTkxZID0gNCxcbiAgSEVSTyA9IDgsXG59XG5cbi8vIFRPRE8gLSBub3Qgc3VyZSB5ZXQgaWYgSSB3YW50IHRvIGR1cGxpY2F0ZSBjYXAtb25seSBzaXRlcyBoZXJlP1xuZnVuY3Rpb24gbWFrZVVuaXRCeU5hdGlvbiAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3Qge1xuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLFxuICAgIFVuaXQsXG4gICAgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIEZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBQcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gIH0gPSB0YWJsZXM7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IG5hdGlvbklkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIgfSxcbiAgICBqb2luczogJ05hdGlvbi5uYXRpb25JZDpVbml0LnVuaXRJZCcsXG4gICAgZmllbGRzOiBbJ25hdGlvbklkJywgJ3VuaXRJZCcsICdyZWNUeXBlJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjVHlwZScsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIC8vIFRPRE8gLSBwcmV0ZW5kZXJzXG4gIC8vIGZvbGxvd2luZyB0aGUgbG9naWMgaW4gLi4vLi4vLi4vLi4vc2NyaXB0cy9ETUkvTU5hdGlvbi5qc1xuICAvLyAgIDEuIGRldGVybWluZSBuYXRpb24gcmVhbG0ocykgYW5kIHVzZSB0aGF0IHRvIGFkZCBwcmV0ZW5kZXJzXG4gIC8vICAgMi4gdXNlIHRoZSBsaXN0IG9mIFwiZXh0cmFcIiBhZGRlZCBwcmV0ZW5kZXJzIHRvIGFkZCBhbnkgZXh0cmFcbiAgLy8gICAzLiB1c2UgdGhlIHVucHJldGVuZGVycyB0YWJsZSB0byBkbyBvcHBvc2l0ZVxuXG4gIGNvbnN0IGRlbEFCTlJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG4gIGZvciAoY29uc3QgW2lBQk4gLHJdICBvZiBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgcmF3X3ZhbHVlLCBhdHRyaWJ1dGUsIG5hdGlvbl9udW1iZXIgfSA9IHI7XG4gICAgbGV0IHVuaXQ6IGFueTtcbiAgICBsZXQgdW5pdElkOiBhbnkgPSBudWxsIC8vIHNtZmhcbiAgICBsZXQgdW5pdFR5cGUgPSAwO1xuICAgIGxldCByZWNUeXBlID0gMDtcbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSAxNTg6XG4gICAgICBjYXNlIDE1OTpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTYwOlxuICAgICAgY2FzZSAxNjE6XG4gICAgICBjYXNlIDE2MjpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE2MzpcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg2OlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC53YXRlcnNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVRFUjtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg3OlxuICAgICAgY2FzZSAxODk6XG4gICAgICBjYXNlIDE5MDpcbiAgICAgIGNhc2UgMTkxOlxuICAgICAgY2FzZSAyMTM6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LndhdGVyc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBVEVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk0OlxuICAgICAgY2FzZSA0MTI6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkZPUkVTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NTpcbiAgICAgIGNhc2UgNDEzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5GT1JFU1Q7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuU1dBTVA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlNXQU1QO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTg6XG4gICAgICBjYXNlIDQwODpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTk6XG4gICAgICBjYXNlIDQwOTpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMDpcbiAgICAgIGNhc2UgNDE2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMTpcbiAgICAgIGNhc2UgNDE3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAyOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDQ6XG4gICAgICBjYXNlIDQwNjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuUExBSU5TO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA1OlxuICAgICAgY2FzZSA0MDc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlBMQUlOUztcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTM5OlxuICAgICAgY2FzZSAxNDA6XG4gICAgICBjYXNlIDE0MTpcbiAgICAgIGNhc2UgMTQyOlxuICAgICAgY2FzZSAxNDM6XG4gICAgICBjYXNlIDE0NDpcbiAgICAgICAgY29uc29sZS5sb2coJ0hFUk8gRklOREVSIEZPVU5EJywgcmF3X3ZhbHVlKVxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUiB8IFVOSVRfVFlQRS5IRVJPO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuSEVSTztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE0NTpcbiAgICAgIGNhc2UgMTQ2OlxuICAgICAgY2FzZSAxNDk6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NVUxUSUhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICh1bml0SWQgPT0gbnVsbCkgY29udGludWU7XG4gICAgZGVsQUJOUm93cy5wdXNoKGlBQk4pO1xuICAgIHVuaXQgPz89IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICh1bml0VHlwZSkgdW5pdC50eXBlIHw9IHVuaXRUeXBlO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignbW9yZSBwaXNzIHVuaXQ6JywgaUFCTiwgdW5pdElkKTtcbiAgICByb3dzLnB1c2goe1xuICAgICAgdW5pdElkLFxuICAgICAgcmVjVHlwZSxcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgbmF0aW9uSWQ6IG5hdGlvbl9udW1iZXIsXG4gICAgfSk7XG4gIH1cbiAgbGV0IGRpOiBudW1iZXJ8dW5kZWZpbmVkO1xuICB3aGlsZSAoKGRpID0gZGVsQUJOUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZClcbiAgICBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLnNwbGljZShkaSwgMSk7XG5cbiAgLypcbiAgZmlyc3QgcmVmZXIgdG8gdGhlIHRhYmxlczpcbiAgLSBmb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb25cbiAgLSBub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb25cbiAgLSBmb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvblxuICAtIG5vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uXG4gIC0gY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbiAoY2hlY2sgbGFuZHNoYXBlKVxuICAtIGNvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbiAoY2hlY2sgbGFuZHNoYXBlKVxuICAqL1xuICBmb3IgKGNvbnN0IHIgb2YgRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SVCxcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIEZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SVCxcbiAgICB9KVxuICB9XG4gIGZvciAoY29uc3QgciBvZiBDb2FzdFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBDb2FzdExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5DT0FTVCxcbiAgICB9KVxuICB9XG5cblxuXG4gIGZvciAoY29uc3QgciBvZiBOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cbiAgLy8gdGFibGVzIGhhdmUgYmVlbiBjb21iaW5lZH4hXG4gIENvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIEZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cy5zcGxpY2UoMCwgSW5maW5pdHkpO1xuICBGb3J0VHJvb3BUeXBlQnlOYXRpb24ucm93cy5zcGxpY2UoMCwgSW5maW5pdHkpO1xuICBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xufVxuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFNLGdCQUFnQixJQUFJLFlBQVk7QUFDdEMsSUFBTSxnQkFBZ0IsSUFBSSxZQUFZO0FBSS9CLFNBQVMsY0FBZSxHQUFXLE1BQW1CLElBQUksR0FBRztBQUNsRSxNQUFJLEVBQUUsUUFBUSxJQUFJLE1BQU0sSUFBSTtBQUMxQixVQUFNQSxLQUFJLEVBQUUsUUFBUSxJQUFJO0FBQ3hCLFlBQVEsTUFBTSxHQUFHQSxFQUFDLGlCQUFpQixFQUFFLE1BQU1BLEtBQUksSUFBSUEsS0FBSSxFQUFFLENBQUMsS0FBSztBQUMvRCxVQUFNLElBQUksTUFBTSxVQUFVO0FBQUEsRUFDNUI7QUFDQSxRQUFNLFFBQVEsY0FBYyxPQUFPLElBQUksSUFBSTtBQUMzQyxNQUFJLE1BQU07QUFDUixTQUFLLElBQUksT0FBTyxDQUFDO0FBQ2pCLFdBQU8sTUFBTTtBQUFBLEVBQ2YsT0FBTztBQUNMLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFTyxTQUFT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QUVBO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxhQUFhO0FBQUEsTUFDWDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxNQUdBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUVBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtB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YSxNQUFNO0FBQ3RDLFFBQU0sVUFBVSxNQUFNLEtBQUssT0FBTyxHQUFHLEVBQUUsVUFBVSxLQUFLLENBQUM7QUFDdkQsVUFBUSxJQUFJLFNBQVMsS0FBSyxJQUFJLGFBQWEsSUFBSSxFQUFFO0FBQ25EO0FBRUEsZUFBZSxhQUFhLEdBQVU7QUFDcEMsUUFBTSxPQUFPLEVBQUUsS0FBSyxTQUFTO0FBQzdCLE1BQUk7QUFDSixNQUFJLElBQVM7QUFDYixNQUFJLE9BQU8sQ0FBQyxNQUFNLFVBQVU7QUFDMUIsUUFBSTtBQUNKLFdBQU8sT0FBTyxHQUFHLEdBQUcsTUFBTSxNQUFNO0FBQ2hDLFFBQUksQ0FBQyxNQUFXLE9BQU8sTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFBQyxPQUFLLEVBQUVBLEVBQUMsQ0FBQztBQUFBLEVBQ2hELFdBQVcsT0FBTyxDQUFDLE1BQU0sU0FBUyxPQUFPLENBQUMsR0FBRztBQUMzQyxRQUFJLE9BQU8sT0FBTyxDQUFDLENBQUMsSUFBSTtBQUN4QixXQUFPLE9BQU8sR0FBRyxDQUFDO0FBQ2xCLFlBQVEsSUFBSSxjQUFjLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQUc7QUFDdkQsUUFBSSxPQUFPLE1BQU0sQ0FBQztBQUFHLFlBQU0sSUFBSSxNQUFNLHdCQUF3QjtBQUFBLEVBQy9ELE9BQU87QUFDTCxRQUFJLEtBQUssTUFBTSxLQUFLLE9BQU8sSUFBSSxJQUFJO0FBQUEsRUFDckM7QUFDQSxNQUFJLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNqQyxRQUFNLElBQUksSUFBSTtBQUNkLFFBQU0sSUFBSyxPQUFPLFNBQVUsT0FBTyxDQUFDLE1BQU0sUUFBUSxFQUFFLE9BQU8sU0FBUyxTQUNuRSxFQUFFLE9BQU8sT0FBTyxNQUFNLEdBQUcsRUFBRTtBQUM1QixnQkFBYyxHQUFHLEdBQUcsR0FBRyxHQUFHLFVBQVUsQ0FBQztBQWF2QztBQUVBLFNBQVMsY0FDUCxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0EsR0FDQTtBQUNBLFVBQVEsSUFBSTtBQUFBLE9BQVUsQ0FBQyxHQUFHO0FBQzFCLElBQUUsT0FBTyxNQUFNLEtBQUs7QUFDcEIsVUFBUSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRztBQUNyQyxRQUFNLE9BQU8sRUFBRSxNQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUN0QyxNQUFJO0FBQU0sZUFBVyxLQUFLO0FBQU0sY0FBUSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2pELFVBQVEsSUFBSSxRQUFRLENBQUM7QUFBQTtBQUFBLENBQU07QUFDN0I7QUFJQSxRQUFRLElBQUksUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRXBDLElBQUk7QUFBTSxVQUFRLElBQUk7QUFBQTtBQUNqQixVQUFROyIsCiAgIm5hbWVzIjogWyJpIiwgIndpZHRoIiwgImIiLCAiZmllbGRzIiwgIndpZHRoIiwgIndpZHRoIiwgImZpZWxkcyIsICJmIl0KfQo=
