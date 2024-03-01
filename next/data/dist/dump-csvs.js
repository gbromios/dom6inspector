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
        unitId = raw_value;
        unitType = 1 /* COMMANDER */ | 8 /* HERO */;
        break;
      case 145:
      case 146:
      case 149:
        unitId = raw_value;
        unitType = 1 /* COMMANDER */ | 8 /* HERO */;
        break;
    }
    if (unitId == null)
      continue;
    delABNRows.push(iABN);
    unit ??= Unit.map.get(unitId);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vLi4vbGliL3NyYy9jb2x1bW4udHMiLCAiLi4vLi4vbGliL3NyYy91dGlsLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2NoZW1hLnRzIiwgIi4uLy4uL2xpYi9zcmMvdGFibGUudHMiLCAiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyIsICIuLi9zcmMvY2xpL2pvaW4tdGFibGVzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICAvLyBXT09QU0lFXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDhuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCAgICAgICA9IDAsXG4gIFNUUklORyAgICAgICA9IDEsXG4gIEJPT0wgICAgICAgICA9IDIsXG4gIFU4ICAgICAgICAgICA9IDMsXG4gIEk4ICAgICAgICAgICA9IDQsXG4gIFUxNiAgICAgICAgICA9IDUsXG4gIEkxNiAgICAgICAgICA9IDYsXG4gIFUzMiAgICAgICAgICA9IDcsXG4gIEkzMiAgICAgICAgICA9IDgsXG4gIEJJRyAgICAgICAgICA9IDksXG4gIFNUUklOR19BUlJBWSA9IDE3LFxuICBVOF9BUlJBWSAgICAgPSAxOSxcbiAgSThfQVJSQVkgICAgID0gMjAsXG4gIFUxNl9BUlJBWSAgICA9IDIxLFxuICBJMTZfQVJSQVkgICAgPSAyMixcbiAgVTMyX0FSUkFZICAgID0gMjMsXG4gIEkzMl9BUlJBWSAgICA9IDI0LFxuICBCSUdfQVJSQVkgICAgPSAyNSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HX0FSUkFZJyxcbiAgJ1U4X0FSUkFZJyxcbiAgJ0k4X0FSUkFZJyxcbiAgJ1UxNl9BUlJBWScsXG4gICdJMTZfQVJSQVknLFxuICAnVTMyX0FSUkFZJyxcbiAgJ0kzMl9BUlJBWScsXG4gICdCSUdfQVJSQVknLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgfENPTFVNTi5VOF9BUlJBWVxuICB8Q09MVU1OLkk4X0FSUkFZXG4gIHxDT0xVTU4uVTE2X0FSUkFZXG4gIHxDT0xVTU4uSTE2X0FSUkFZXG4gIHxDT0xVTU4uVTMyX0FSUkFZXG4gIHxDT0xVTU4uSTMyX0FSUkFZXG4gIDtcblxuY29uc3QgQ09MVU1OX1dJRFRIOiBSZWNvcmQ8TlVNRVJJQ19DT0xVTU4sIDF8Mnw0PiA9IHtcbiAgW0NPTFVNTi5VOF06IDEsXG4gIFtDT0xVTU4uSThdOiAxLFxuICBbQ09MVU1OLlUxNl06IDIsXG4gIFtDT0xVTU4uSTE2XTogMixcbiAgW0NPTFVNTi5VMzJdOiA0LFxuICBbQ09MVU1OLkkzMl06IDQsXG4gIFtDT0xVTU4uVThfQVJSQVldOiAxLFxuICBbQ09MVU1OLkk4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5VMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLkkxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uVTMyX0FSUkFZXTogNCxcbiAgW0NPTFVNTi5JMzJfQVJSQVldOiA0LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvTnVtZXJpY1R5cGUgKFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXJcbik6IE5VTUVSSUNfQ09MVU1OfG51bGwge1xuICBpZiAobWluIDwgMCkge1xuICAgIC8vIHNvbWUga2luZGEgbmVnYXRpdmU/P1xuICAgIGlmIChtaW4gPj0gLTEyOCAmJiBtYXggPD0gMTI3KSB7XG4gICAgICAvLyBzaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5JODtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMzI3NjggJiYgbWF4IDw9IDMyNzY3KSB7XG4gICAgICAvLyBzaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uSTE2O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0yMTQ3NDgzNjQ4ICYmIG1heCA8PSAyMTQ3NDgzNjQ3KSB7XG4gICAgICAvLyBzaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5JMzI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChtYXggPD0gMjU1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLlU4O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDY1NTM1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5VMTY7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNDI5NDk2NzI5NSkge1xuICAgICAgLy8gdW5zaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5VMzI7XG4gICAgfVxuICB9XG4gIC8vIEdPVE86IEJJR09PT09PT09PQk9PT09PWU9cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bWVyaWNDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgTlVNRVJJQ19DT0xVTU4ge1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5TVFJJTkc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbHVtbjxUID0gYW55LCBSIGV4dGVuZHMgVWludDhBcnJheXxudW1iZXIgPSBhbnk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUW107XG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVDtcbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVFtdLCBudW1iZXJdO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogVCk6IFIsXG4gIHNlcmlhbGl6ZUFycmF5ICh2OiBUW10pOiBSLFxuICB0b1N0cmluZyAodjogc3RyaW5nKTogYW55O1xuICByZWFkb25seSB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICByZWFkb25seSBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgb3JkZXI6IG51bWJlcjtcbiAgcmVhZG9ubHkgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48c3RyaW5nLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihgc2VlbXMgb3ZlcnJpZGUgZm9yICR7bmFtZX0gZG9lcyBub3QgcmV0dXJuIGEgc3RyaW5nYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZyB7XG4gICAgLy8gVE9ETyAtIG5lZWQgdG8gdmVyaWZ5IHRoZXJlIGFyZW4ndCBhbnkgc2luZ2xlIHF1b3Rlcz9cbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmdbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgc3RyaW5ncy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW3N0cmluZ3MsIHJlYWRdXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogc3RyaW5nW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uc3RyaW5nVG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlcltdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/ICggdGhpcy5vdmVycmlkZSh2LCB1LCBhKSApIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXJbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgICAgIG51bWJlcnMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtudW1iZXJzLCByZWFkXTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgICBpZiAodGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2ltIGFycmF5IHRobycpXG4gICAgICByZXR1cm4gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgbnVtYmVyRnJvbVZpZXcgKGk6IG51bWJlciwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSAmIDE1KSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignd2hvbXN0Jyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICB0aGlzLnB1dEJ5dGVzKHYsIDAsIGJ5dGVzKTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBudW1iZXJbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMSArIHRoaXMud2lkdGggKiB2Lmxlbmd0aClcbiAgICBsZXQgaSA9IDE7XG4gICAgZm9yIChjb25zdCBuIG9mIHYpIHtcbiAgICAgIGJ5dGVzWzBdKys7XG4gICAgICB0aGlzLnB1dEJ5dGVzKG4sIGksIGJ5dGVzKTtcbiAgICAgIGkrPXRoaXMud2lkdGg7XG4gICAgfVxuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHByaXZhdGUgcHV0Qnl0ZXModjogbnVtYmVyLCBpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tpICsgb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVlcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzQmlnQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmlzQXJyYXkgPSAodHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuXG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludFtdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnRbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IGJpZ2JvaXM6IGJpZ2ludFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgYmlnYm9pcy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW2JpZ2JvaXMsIHJlYWRdO1xuXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogYmlnaW50W10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uYmlnQm95VG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMgQklHP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuID0gZmFsc2U7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYm9vbGApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbmV2ZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKF9pOiBudW1iZXIsIF9ieXRlczogVWludDhBcnJheSk6IFtuZXZlcltdLCBudW1iZXJdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgLy8gLi4uLml0IGRpZCBub3QuXG4gICAgLy9jb25zb2xlLmxvZyhgUkVBRCBGUk9NICR7aX06IERPRVMgJHtieXRlc1tpXX0gPT09ICR7dGhpcy5mbGFnfWApO1xuICAgIHJldHVybiBbKGJ5dGVzW2ldICYgdGhpcy5mbGFnKSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkoX3Y6IGJvb2xlYW5bXSk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2kgd2lsbCBORVZFUiBiZWNvbWUgQVJSQVknKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIGlmIChhLmlzQXJyYXkgIT09IGIuaXNBcnJheSkgcmV0dXJuIGEuaXNBcnJheSA/IDEgOiAtMVxuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbiAgZGF0YTogc3RyaW5nW11bXSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGU6IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdIGFzIHVuZGVmaW5lZCB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSksXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCAoZmllbGQuYml0ICUgOCk7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIGZpZWxkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UeXBlIChcbiAgbmFtZTogc3RyaW5nLFxuICB0eXBlOiBDT0xVTU4sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4pOiBDb2x1bW5BcmdzIHtcbiAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvdyB5b3UgZ29ubmEgdXNlIGl0IHRoZW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGNvbnN0IGJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgICAgY29uc3QgZmxhZyA9IDEgPDwgKGJpdCAlIDgpO1xuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIGZsYWcsIGJpdCwgb3ZlcnJpZGUgfTtcblxuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAxLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDIsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogNCwgb3ZlcnJpZGV9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGlmIChhcmdzLnR5cGUgJiAxNikgdGhyb3cgbmV3IEVycm9yKCdubyBzdWNoIHRoaW5nIGFzIGEgZmxhZyBhcnJheScpO1xuICAgICAgcmV0dXJuIG5ldyBCb29sQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiBuZXcgTnVtZXJpY0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4gbmV3IEJpZ0NvbHVtbihhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7YXJncy50eXBlfWApO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAga2V5OiBzdHJpbmc7XG4gIGpvaW5zPzogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgam9pbnM/OiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZywgc3RyaW5nXTtcbiAgcmVhZG9ubHkga2V5OiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgbmFtZSwgZmxhZ3NVc2VkLCBrZXksIGpvaW5zIH06IFNjaGVtYUFyZ3MpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMua2V5ID0ga2V5O1xuICAgIHRoaXMuY29sdW1ucyA9IFsuLi5jb2x1bW5zXS5zb3J0KGNtcEZpZWxkcyk7XG4gICAgdGhpcy5maWVsZHMgPSB0aGlzLmNvbHVtbnMubWFwKGMgPT4gYy5uYW1lKTtcbiAgICB0aGlzLmNvbHVtbnNCeU5hbWUgPSBPYmplY3QuZnJvbUVudHJpZXModGhpcy5jb2x1bW5zLm1hcChjID0+IFtjLm5hbWUsIGNdKSk7XG4gICAgdGhpcy5mbGFnRmllbGRzID0gZmxhZ3NVc2VkO1xuICAgIHRoaXMuZml4ZWRXaWR0aCA9IGNvbHVtbnMucmVkdWNlKFxuICAgICAgKHcsIGMpID0+IHcgKyAoKCFjLmlzQXJyYXkgJiYgYy53aWR0aCkgfHwgMCksXG4gICAgICBNYXRoLmNlaWwoZmxhZ3NVc2VkIC8gOCksIC8vIDggZmxhZ3MgcGVyIGJ5dGUsIG5hdGNoXG4gICAgKTtcblxuICAgIGlmIChqb2lucykge1xuICAgICAgY29uc3QgW2EsIGIsIC4uLnJdID0gam9pbnMuc3BsaXQoJzonKTtcbiAgICAgIGNvbnN0IFthVCwgYUYsIC4uLmFSXSA9IGE/LnNwbGl0KCcuJyk7XG4gICAgICBjb25zdCBbYlQsIGJGLCAuLi5iUl0gPSBiPy5zcGxpdCgnLicpO1xuXG4gICAgICBpZiAoIWEgfHwgIWIgfHwgci5sZW5ndGgpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW46ICR7am9pbnN9YCk7XG4gICAgICBpZiAoIWFUIHx8ICFhRiB8fCBhUi5sZW5ndGgpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gbGVmdCBzaWRlICR7YX1gKTtcbiAgICAgIGlmICghYlQgfHwgIWJGIHx8IGJSLmxlbmd0aClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiByaWdodCBzaWRlICR7Yn1gKTtcbiAgICAgIGlmIChhVCA9PT0gYlQgJiYgYUYgPT09IGJGKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNhbnQgam9pbiBlbnRpdHkgdG8gaXRzZWxmICgke2pvaW5zfSlgKVxuICAgICAgaWYgKCF0aGlzLmNvbHVtbnNCeU5hbWVbYUZdKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIGxlZnQgc2lkZSAke2F9OiB1bmtub3duIGtleSBcIiR7YUZ9XCJgKTtcbiAgICAgIGlmICghdGhpcy5jb2x1bW5zQnlOYW1lW2JGXSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiByaWdodCBzaWRlICR7Yn06IHVua25vd24ga2V5IFwiJHtiRn1cImApO1xuICAgICAgdGhpcy5qb2lucyA9IFthVCwgYUYsIGJULCBiRl07XG4gICAgfVxuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBsZXQgZiA9IHRydWU7XG4gICAgbGV0IGIgPSBmYWxzZTtcbiAgICBsZXQgZmYgPSAwO1xuICAgIGZvciAoY29uc3QgW2ksIGNdIG9mIHRoaXMuY29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICAgIGxldCBPQyA9IC0xO1xuICAgICAgLy9pZiAoYy50eXBlICYgMTYpIGJyZWFrO1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklOR19BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJR19BUlJBWTpcbiAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgaWYgKG8gPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRzbyA9IE1hdGgubWF4KDAsIGkgLSAyKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSwgaSwgbywgYERTTzoke2Rzb30uLiR7aSArIDJ9OmAsIGNvbHVtbnMuc2xpY2UoTWF0aC5tYXgoMCwgaSAtIDIpLCBpICsgMikpO1xuICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgbm90IGJlIScpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIERPTkUgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gdGhpcy5mbGFnRmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb29PU0FBU09BTycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgYmUhJylcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjLCBvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdib29vJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvOyBjLmJpdCA9IGZmKys7IGMuZmxhZyA9IDIgKiogKGMuYml0ICUgOCk7IC8vIGhlaGVoZVxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgIGlmIChjLmJpdCArIDEgPT09IHRoaXMuZmxhZ0ZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRScpXG4gICAgICAgICAgICBpZiAoYy5mbGFnIDwgMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCAtIDEpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUgLSAxJylcbiAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgIGlmICghYy53aWR0aCkgZGVidWdnZXI7XG4gICAgICAgICAgbyArPSBjLndpZHRoITtcbiAgICAgICAgICBpZiAobyA9PT0gdGhpcy5maXhlZFdpZHRoKSBmID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL2NvbnN0IHJuZyA9IE9DIDwgMCA/IGBgIDogYCAke09DfS4uJHtvfSAvICR7dGhpcy5maXhlZFdpZHRofWBcbiAgICAgIC8vY29uc29sZS5sb2coYFske2l9XSR7cm5nfWAsIGMubmFtZSwgYy5sYWJlbClcbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgbGV0IGpvaW5zOiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2tleSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5zLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcblxuICAgIGlmICgham9pbnMpIGpvaW5zID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAga2V5LFxuICAgICAgam9pbnMsXG4gICAgICBjb2x1bW5zOiBbXSBhcyBDb2x1bW5bXSxcbiAgICAgIGZpZWxkczogW10gYXMgc3RyaW5nW10sXG4gICAgICBmbGFnc1VzZWQ6IDAsXG4gICAgICByYXdGaWVsZHM6IHt9LCAvLyBub25lIDo8XG4gICAgICBvdmVycmlkZXM6IHt9LCAvLyBub25lflxuICAgIH07XG5cbiAgICBjb25zdCBudW1GaWVsZHMgPSBieXRlc1tpKytdIHwgKGJ5dGVzW2krK10gPDwgOCk7XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIC8vIFRPRE8gLSBvbmx5IHdvcmtzIHdoZW4gMC1maWVsZCBzY2hlbWFzIGFyZW4ndCBhbGxvd2VkfiFcbiAgICB3aGlsZSAoaW5kZXggPCBudW1GaWVsZHMpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBieXRlc1tpKytdO1xuICAgICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgICBjb25zdCBmID0ge1xuICAgICAgICBpbmRleCwgbmFtZSwgdHlwZSxcbiAgICAgICAgd2lkdGg6IG51bGwsIGJpdDogbnVsbCwgZmxhZzogbnVsbCxcbiAgICAgICAgb3JkZXI6IDk5OVxuICAgICAgfTtcbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIGxldCBjOiBDb2x1bW47XG5cbiAgICAgIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG5cbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICAvL2lmIChjLm9mZnNldCAmJiBjLm9mZnNldCAhPT0gdG90YWxSZWFkKSB7IGRlYnVnZ2VyOyBjb25zb2xlLmxvZygnd29vcHNpZScpOyB9XG4gICAgICBsZXQgW3YsIHJlYWRdID0gYy5pc0FycmF5ID9cbiAgICAgICAgYy5hcnJheUZyb21CeXRlcyhpLCBieXRlcywgdmlldykgOlxuICAgICAgICBjLmZyb21CeXRlcyhpLCBieXRlcywgdmlldyk7XG5cbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKVxuICAgICAgICByZWFkID0gKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSA/IDEgOiAwO1xuXG4gICAgICBpICs9IHJlYWQ7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVhZDtcbiAgICAgIC8vIGRvbid0IHB1dCBmYWxzeSB2YWx1ZXMgb24gZmluYWwgb2JqZWN0cy4gbWF5IHJldmlzaXQgaG93IHRoaXMgd29ya3MgbGF0ZXJcbiAgICAgIGlmIChjLmlzQXJyYXkgfHwgdikgcm93W2MubmFtZV0gPSB2O1xuICAgICAgLy9jb25zdCB3ID0gZ2xvYmFsVGhpcy5fUk9XU1t0aGlzLm5hbWVdW19fcm93SWRdW2MubmFtZV0gLy8gc3JzIGJpelxuICAgICAgLypcbiAgICAgIGlmICh3ICE9PSB2KSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh3KSB8fCB3LnNvbWUoKG4sIGkpID0+IG4gIT09IHZbaV0pKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgWFhYWFggJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSAtPiAke3Z9YClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBfX19fXyAke3RoaXMubmFtZX1bJHtfX3Jvd0lkfV1bJHtjLm5hbWV9XSAke3d9ID09ICR7dn1gKVxuICAgICAgfVxuICAgICAgKi9cbiAgICB9XG4gICAgLy9pZiAoZGJyKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgICBSRUFEOiAke3RvdGFsUmVhZH0gVE8gJHtpfSAvICR7YnVmZmVyLmJ5dGVMZW5ndGh9XFxuYCwgcm93LCAnXFxuXFxuJyk7XG4gICAgICAvL2RlYnVnZ2VyO1xuICAgIC8vfVxuICAgIHJldHVybiBbcm93LCB0b3RhbFJlYWRdO1xuICB9XG5cbiAgcHJpbnRSb3cgKHI6IFJvdywgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUhlYWRlciAoKTogQmxvYiB7XG4gICAgLy8gWy4uLm5hbWUsIDAsIG51bUZpZWxkczAsIG51bUZpZWxkczEsIGZpZWxkMFR5cGUsIGZpZWxkMEZsYWc/LCAuLi5maWVsZDBOYW1lLCAwLCBldGNdO1xuICAgIC8vIFRPRE8gLSBCYXNlIHVuaXQgaGFzIDUwMCsgZmllbGRzXG4gICAgaWYgKHRoaXMuY29sdW1ucy5sZW5ndGggPiA2NTUzNSkgdGhyb3cgbmV3IEVycm9yKCdvaCBidWRkeS4uLicpO1xuICAgIGNvbnN0IHBhcnRzID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpLFxuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLmtleSksXG4gICAgICAuLi50aGlzLnNlcmlhbGl6ZUpvaW5zKCksXG4gICAgICB0aGlzLmNvbHVtbnMubGVuZ3RoICYgMjU1LFxuICAgICAgKHRoaXMuY29sdW1ucy5sZW5ndGggPj4+IDgpLFxuICAgICAgLi4udGhpcy5jb2x1bW5zLmZsYXRNYXAoYyA9PiBjLnNlcmlhbGl6ZSgpKVxuICAgIF0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFtwYXJ0c10pO1xuICB9XG5cbiAgc2VyaWFsaXplSm9pbnMgKCkge1xuICAgIGlmICghdGhpcy5qb2lucykgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGNvbnN0IFthVCwgYUYsIGJULCBiRl0gPSB0aGlzLmpvaW5zO1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKGAke2FUfS4ke2FGfToke2JUfS4ke2JGfWApO1xuICB9XG5cbiAgc2VyaWFsaXplUm93IChyOiBSb3cpOiBCbG9iIHtcbiAgICBjb25zdCBmaXhlZCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZml4ZWRXaWR0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGNvbnN0IGJsb2JQYXJ0czogQmxvYlBhcnRbXSA9IFtmaXhlZF07XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdiA9IHJbYy5uYW1lXVxuICAgICAgICBpZiAoYy5pc0FycmF5KSB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplQXJyYXkodiBhcyBhbnlbXSlcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChjLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIHN0cmluZylcbiAgICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgICB9IGJyZWFrO1xuICAgICAgICAgIGNhc2UgQ09MVU1OLkJJRzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgICAgZml4ZWRbaV0gfD0gYy5zZXJpYWxpemVSb3codiBhcyBib29sZWFuKTtcbiAgICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgICAvLyBhZnRlciB3ZSdyZSBkb25lIHdpdGggbnVtYmVycyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAgIC8vaWYgKGMuZmxhZyA9PT0gMTI4KSBpKys7XG4gICAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgaSsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgICAgZml4ZWQuc2V0KGJ5dGVzLCBpKVxuICAgICAgICAgICAgaSArPSBjLndpZHRoITtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7KGMgYXMgYW55KS50eXBlfWApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIENPTFVNTjonLCBjKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBST1c6Jywgcik7XG4gICAgICAgIHRocm93IGV4O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgKHIuX19yb3dJZCA8IDUgfHwgci5fX3Jvd0lkID4gMzk3NSB8fCByLl9fcm93SWQgJSAxMDAwID09PSAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgLSBST1cgJHtyLl9fcm93SWR9YCwgeyBpLCBibG9iUGFydHMsIHIgfSk7XG4gICAgLy99XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29mZnNldCcsXG4gICAgICAnb3JkZXInLFxuICAgICAgJ2JpdCcsXG4gICAgICAndHlwZScsXG4gICAgICAnZmxhZycsXG4gICAgICAnd2lkdGgnLFxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuXG4gIH1cblxuICAvLyByYXdUb1JvdyAoZDogUmF3Um93KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge31cbiAgLy8gcmF3VG9TdHJpbmcgKGQ6IFJhd1JvdywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge31cbn07XG5cbiIsICJpbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuZXhwb3J0IHR5cGUgUm93RGF0YSA9IHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxiaWdpbnR8KHN0cmluZ3xudW1iZXJ8YmlnaW50KVtdO1xuZXhwb3J0IHR5cGUgUm93ID0gUmVjb3JkPHN0cmluZywgUm93RGF0YT4gJiB7IF9fcm93SWQ6IG51bWJlciB9O1xuXG50eXBlIFRhYmxlQmxvYiA9IHsgbnVtUm93czogbnVtYmVyLCBoZWFkZXJCbG9iOiBCbG9iLCBkYXRhQmxvYjogQmxvYiB9O1xuXG5leHBvcnQgY2xhc3MgVGFibGUge1xuICBnZXQgbmFtZSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc2NoZW1hLm5hbWUgfVxuICBnZXQga2V5ICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEua2V5IH1cbiAgcmVhZG9ubHkgbWFwOiBNYXA8YW55LCBhbnk+ID0gbmV3IE1hcCgpXG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSByb3dzOiBSb3dbXSxcbiAgICByZWFkb25seSBzY2hlbWE6IFNjaGVtYSxcbiAgKSB7XG4gICAgY29uc3Qga2V5TmFtZSA9IHRoaXMua2V5O1xuICAgIGlmIChrZXlOYW1lICE9PSAnX19yb3dJZCcpIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykge1xuICAgICAgY29uc3Qga2V5ID0gcm93W2tleU5hbWVdO1xuICAgICAgaWYgKHRoaXMubWFwLmhhcyhrZXkpKSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyBub3QgdW5pcXVlJyk7XG4gICAgICB0aGlzLm1hcC5zZXQoa2V5LCByb3cpO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogW1VpbnQzMkFycmF5LCBCbG9iLCBCbG9iXSB7XG4gICAgLy8gW251bVJvd3MsIGhlYWRlclNpemUsIGRhdGFTaXplXSwgc2NoZW1hSGVhZGVyLCBbcm93MCwgcm93MSwgLi4uIHJvd05dO1xuICAgIGNvbnN0IHNjaGVtYUhlYWRlciA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZUhlYWRlcigpO1xuICAgIC8vIGNhbnQgZmlndXJlIG91dCBob3cgdG8gZG8gdGhpcyB3aXRoIGJpdHMgOic8XG4gICAgY29uc3Qgc2NoZW1hUGFkZGluZyA9ICg0IC0gc2NoZW1hSGVhZGVyLnNpemUgJSA0KSAlIDQ7XG4gICAgY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpKTtcblxuICAgIC8vY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4ge1xuICAgICAgLy9jb25zdCByb3dCbG9iID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpXG4gICAgICAvL2lmIChyLl9fcm93SWQgPT09IDApXG4gICAgICAgIC8vcm93QmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oYWIgPT4ge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coYEFSUkFZIEJVRkZFUiBGT1IgRklSU1QgUk9XIE9GICR7dGhpcy5uYW1lfWAsIG5ldyBVaW50OEFycmF5KGFiKS5qb2luKCcsICcpKTtcbiAgICAgICAgLy99KTtcbiAgICAgIC8vcmV0dXJuIHJvd0Jsb2I7XG4gICAgLy99KTtcbiAgICBjb25zdCByb3dCbG9iID0gbmV3IEJsb2Iocm93RGF0YSlcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93QmxvYi5zaXplICUgNCkgJSA0O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBVaW50MzJBcnJheShbXG4gICAgICAgIHRoaXMucm93cy5sZW5ndGgsXG4gICAgICAgIHNjaGVtYUhlYWRlci5zaXplICsgc2NoZW1hUGFkZGluZyxcbiAgICAgICAgcm93QmxvYi5zaXplICsgZGF0YVBhZGRpbmdcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICBzY2hlbWFIZWFkZXIsXG4gICAgICAgIG5ldyBBcnJheUJ1ZmZlcihzY2hlbWFQYWRkaW5nKSBhcyBhbnkgLy8gPz8/XG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgcm93QmxvYixcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZGF0YVBhZGRpbmcpXG4gICAgICBdKSxcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGNvbmNhdFRhYmxlcyAodGFibGVzOiBUYWJsZVtdKTogQmxvYiB7XG4gICAgY29uc3QgYWxsU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoMSArIHRhYmxlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCBhbGxIZWFkZXJzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBhbGxEYXRhOiBCbG9iW10gPSBbXTtcblxuICAgIGNvbnN0IGJsb2JzID0gdGFibGVzLm1hcCh0ID0+IHQuc2VyaWFsaXplKCkpO1xuICAgIGFsbFNpemVzWzBdID0gYmxvYnMubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgW2ksIFtzaXplcywgaGVhZGVycywgZGF0YV1dIG9mIGJsb2JzLmVudHJpZXMoKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgT1VUIEJMT0JTIEZPUiBUPSR7aX1gLCBzaXplcywgaGVhZGVycywgZGF0YSlcbiAgICAgIGFsbFNpemVzLnNldChzaXplcywgMSArIGkgKiAzKTtcbiAgICAgIGFsbEhlYWRlcnMucHVzaChoZWFkZXJzKTtcbiAgICAgIGFsbERhdGEucHVzaChkYXRhKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIGNvbnN0IHRhYmxlTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlcy5tYXAodCA9PiBbdC5zY2hlbWEubmFtZSwgdF0pKTtcblxuICAgIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIHtcbiAgICAgIGlmICghdC5zY2hlbWEuam9pbnMpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgW2FULCBhRiwgYlQsIGJGXSA9IHQuc2NoZW1hLmpvaW5zO1xuICAgICAgY29uc3QgdEEgPSB0YWJsZU1hcFthVF07XG4gICAgICBjb25zdCB0QiA9IHRhYmxlTWFwW2JUXTtcbiAgICAgIGlmICghdEEpIHRocm93IG5ldyBFcnJvcihgJHt0Lm5hbWV9IGpvaW5zIHVuZGVmaW5lZCB0YWJsZSAke2FUfWApO1xuICAgICAgaWYgKCF0QikgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YlR9YCk7XG4gICAgICBpZiAoIXQucm93cy5sZW5ndGgpIGNvbnRpbnVlOyAvLyBlbXB0eSB0YWJsZSBpIGd1ZXNzP1xuICAgICAgZm9yIChjb25zdCByIG9mIHQucm93cykge1xuICAgICAgICBjb25zdCBpZEEgPSByW2FGXTtcbiAgICAgICAgY29uc3QgaWRCID0gcltiRl07XG4gICAgICAgIGlmIChpZEEgPT09IHVuZGVmaW5lZCB8fCBpZEIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBiYWQgaWQ/YCwgcik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYSA9IHRBLm1hcC5nZXQoaWRBKTtcbiAgICAgICAgY29uc3QgYiA9IHRCLm1hcC5nZXQoaWRCKTtcbiAgICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBtaXNzaW5nIGlkP2AsIGEsIGlkQSwgcik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBtaXNzaW5nIGlkP2AsIGIsIGlkQiwgcik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgKGFbdC5uYW1lXSA/Pz0gW10pLnB1c2gocik7XG4gICAgICAgIChiW3QubmFtZV0gPz89IFtdKS5wdXNoKHIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGVNYXA7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZnJvbUJsb2IgKHtcbiAgICBoZWFkZXJCbG9iLFxuICAgIGRhdGFCbG9iLFxuICAgIG51bVJvd3MsXG4gIH06IFRhYmxlQmxvYik6IFByb21pc2U8VGFibGU+IHtcbiAgICBjb25zdCBzY2hlbWEgPSBTY2hlbWEuZnJvbUJ1ZmZlcihhd2FpdCBoZWFkZXJCbG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIGxldCByYm8gPSAwO1xuICAgIGxldCBfX3Jvd0lkID0gMDtcbiAgICBjb25zdCByb3dzOiBSb3dbXSA9IFtdO1xuICAgIC8vIFRPRE8gLSBjb3VsZCBkZWZpbml0ZWx5IHVzZSBhIHN0cmVhbSBmb3IgdGhpc1xuICAgIGNvbnN0IGRhdGFCdWZmZXIgPSBhd2FpdCBkYXRhQmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUubG9nKGA9PT09PSBSRUFEICR7bnVtUm93c30gT0YgJHtzY2hlbWEubmFtZX0gPT09PT1gKVxuICAgIHdoaWxlIChfX3Jvd0lkIDwgbnVtUm93cykge1xuICAgICAgY29uc3QgW3JvdywgcmVhZF0gPSBzY2hlbWEucm93RnJvbUJ1ZmZlcihyYm8sIGRhdGFCdWZmZXIsIF9fcm93SWQrKyk7XG4gICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgIHJibyArPSByZWFkO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbiAgfVxuXG5cbiAgcHJpbnQgKFxuICAgIHdpZHRoOiBudW1iZXIgPSA4MCxcbiAgICBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPnxudWxsID0gbnVsbCxcbiAgICBuOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgbTogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIHA/OiAocjogYW55KSA9PiBib29sZWFuLFxuICApOiBudWxsfGFueVtdIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBwID8gdGhpcy5yb3dzLmZpbHRlcihwKSA6XG4gICAgICBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG5cbiAgICBsZXQgbUZpZWxkcyA9IEFycmF5LmZyb20oKGZpZWxkcyA/PyB0aGlzLnNjaGVtYS5maWVsZHMpKTtcbiAgICBpZiAocCkgW24sIG1dID0gWzAsIHJvd3MubGVuZ3RoXVxuICAgIGVsc2UgKG1GaWVsZHMgYXMgYW55KS51bnNoaWZ0KCdfX3Jvd0lkJyk7XG5cbiAgICBjb25zdCBbcFJvd3MsIHBGaWVsZHNdID0gZmllbGRzID9cbiAgICAgIFtyb3dzLm1hcCgocjogUm93KSA9PiB0aGlzLnNjaGVtYS5wcmludFJvdyhyLCBtRmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coJ3JvdyBmaWx0ZXI6JywgcCA/PyAnKG5vbmUpJylcbiAgICBjb25zb2xlLmxvZyhgKHZpZXcgcm93cyAke259IC0gJHttfSlgKTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zb2xlLnRhYmxlKHBSb3dzLCBwRmllbGRzKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcbiAgICByZXR1cm4gKHAgJiYgZmllbGRzKSA/XG4gICAgICByb3dzLm1hcChyID0+XG4gICAgICAgIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKS5maWx0ZXIoZSA9PiBlWzFdKSlcbiAgICAgICkgOlxuICAgICAgbnVsbDtcbiAgfVxuXG4gIGR1bXBSb3cgKGk6IG51bWJlcnxudWxsLCBzaG93RW1wdHkgPSBmYWxzZSwgdXNlQ1NTPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAvLyBUT0RPIFx1MjAxNCBpbiBicm93c2VyLCB1c2VDU1MgPT09IHRydWUgYnkgZGVmYXVsdFxuICAgIHVzZUNTUyA/Pz0gKGdsb2JhbFRoaXNbJ3dpbmRvdyddID09PSBnbG9iYWxUaGlzKTsgLy8gaWRrXG4gICAgaSA/Pz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5yb3dzLmxlbmd0aCk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5yb3dzW2ldO1xuICAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjc3M6IHN0cmluZ1tdfG51bGwgPSB1c2VDU1MgPyBbXSA6IG51bGw7XG4gICAgY29uc3QgZm10ID0gZm10U3R5bGVkLmJpbmQobnVsbCwgb3V0LCBjc3MpO1xuICAgIGNvbnN0IHAgPSBNYXRoLm1heChcbiAgICAgIC4uLnRoaXMuc2NoZW1hLmNvbHVtbnNcbiAgICAgIC5maWx0ZXIoYyA9PiBzaG93RW1wdHkgfHwgcm93W2MubmFtZV0pXG4gICAgICAubWFwKGMgPT4gYy5uYW1lLmxlbmd0aCArIDIpXG4gICAgKTtcbiAgICBpZiAoIXJvdylcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dIGRvZXMgbm90IGV4aXN0YCwgQ19OT1RfRk9VTkQpO1xuICAgIGVsc2Uge1xuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV1gLCBDX1JPV19IRUFEKTtcbiAgICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLnNjaGVtYS5jb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2MubmFtZV07XG4gICAgICAgIGNvbnN0IG4gPSBjLm5hbWUucGFkU3RhcnQocCwgJyAnKTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlY1RSVUVgLCBDX1RSVUUpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAlY0ZBTFNFYCwgQ19OT1RfRk9VTkQsIENfRkFMU0UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19OVU1CRVIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19TVFIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiBcdTIwMTRgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdiaWdpbnQnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYHtufTogJWMwICVjJHt2YWx1ZX0gKEJJRylgLCBDX0JJRywgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMCAoQklHKWAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh1c2VDU1MpIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpLCAuLi5jc3MhXTtcbiAgICBlbHNlIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpXTtcbiAgfVxuXG4gIGZpbmRSb3cgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuLCBzdGFydCA9IDApOiBudW1iZXIge1xuICAgIGNvbnN0IE4gPSB0aGlzLnJvd3MubGVuZ3RoXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBOIC0gc3RhcnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgTjsgaSsrKSBpZiAocHJlZGljYXRlKHRoaXMucm93c1tpXSkpIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICogZmlsdGVyUm93cyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4pOiBHZW5lcmF0b3I8Um93PiB7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSBpZiAocHJlZGljYXRlKHJvdykpIHlpZWxkIHJvdztcbiAgfVxuICAvKlxuICByYXdUb1JvdyAoZDogc3RyaW5nW10pOiBSb3cge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zY2hlbWEuY29sdW1ucy5tYXAociA9PiBbXG4gICAgICByLm5hbWUsXG4gICAgICByLnRvVmFsKGRbci5pbmRleF0pXG4gICAgXSkpO1xuICB9XG4gIHJhd1RvU3RyaW5nIChkOiBzdHJpbmdbXSwgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8vIGp1c3QgYXNzdW1lIGZpcnN0IHR3byBmaWVsZHMgYXJlIGFsd2F5cyBpZCwgbmFtZS4gZXZlbiBpZiB0aGF0J3Mgbm90IHRydWVcbiAgICAvLyB0aGlzIGlzIGp1c3QgZm9yIHZpc3VhbGl6YXRpb24gcHVycG9yc2VzXG4gICAgbGV0IGV4dHJhID0gJyc7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZSA9IHRoaXMucmF3VG9Sb3coZCk7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYXJncykge1xuICAgICAgICAvLyBkb24ndCByZXByaW50IG5hbWUgb3IgaWRcbiAgICAgICAgaWYgKGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1swXSB8fCBhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMV0pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChlW2FdICE9IG51bGwpXG4gICAgICAgICAgcy5wdXNoKGAke2F9OiAke0pTT04uc3RyaW5naWZ5KGVbYV0pfWApXG4gICAgICB9XG4gICAgICBleHRyYSA9IHMubGVuZ3RoID4gMCA/IGAgeyAke3Muam9pbignLCAnKX0gfWAgOiAne30nO1xuICAgIH1cbiAgICByZXR1cm4gYDwke3RoaXMuc2NoZW1hLm5hbWV9OiR7ZFswXSA/PyAnPyd9IFwiJHtkWzFdfVwiJHtleHRyYX0+YDtcbiAgfVxuICAqL1xufVxuXG5mdW5jdGlvbiBmbXRTdHlsZWQgKFxuICBvdXQ6IHN0cmluZ1tdLFxuICBjc3NPdXQ6IHN0cmluZ1tdIHwgbnVsbCxcbiAgbXNnOiBzdHJpbmcsXG4gIC4uLmNzczogc3RyaW5nW11cbikge1xuICBpZiAoY3NzT3V0KSB7XG4gICAgb3V0LnB1c2gobXNnICsgJyVjJylcbiAgICBjc3NPdXQucHVzaCguLi5jc3MsIENfUkVTRVQpO1xuICB9XG4gIGVsc2Ugb3V0LnB1c2gobXNnLnJlcGxhY2UoLyVjL2csICcnKSk7XG59XG5cbmNvbnN0IENfTk9UX0ZPVU5EID0gJ2NvbG9yOiAjODg4OyBmb250LXN0eWxlOiBpdGFsaWM7JztcbmNvbnN0IENfUk9XX0hFQUQgPSAnZm9udC13ZWlnaHQ6IGJvbGRlcic7XG5jb25zdCBDX0JPTEQgPSAnZm9udC13ZWlnaHQ6IGJvbGQnO1xuY29uc3QgQ19OVU1CRVIgPSAnY29sb3I6ICNBMDU1MTg7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1RSVUUgPSAnY29sb3I6ICM0QzM4QkU7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0ZBTFNFID0gJ2NvbG9yOiAjMzhCRTFDOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19TVFIgPSAnY29sb3I6ICMzMEFBNjI7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0JJRyA9ICdjb2xvcjogIzc4MjFBMzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfUkVTRVQgPSAnY29sb3I6IHVuc2V0OyBmb250LXN0eWxlOiB1bnNldDsgZm9udC13ZWlnaHQ6IHVuc2V0OyBiYWNrZ3JvdW5kLXVuc2V0J1xuIiwgImltcG9ydCB7IENPTFVNTiwgU2NoZW1hQXJncyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmV4cG9ydCBjb25zdCBjc3ZEZWZzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4+ID0ge1xuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZVUuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0JyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFtcbiAgICAgIC8vIGNvbWJpbmVkIGludG8gYW4gYXJyYXkgZmllbGRcbiAgICAgICdhcm1vcjEnLCAnYXJtb3IyJywgJ2FybW9yMycsICdhcm1vcjQnLCAnZW5kJyxcbiAgICAgICd3cG4xJywgJ3dwbjInLCAnd3BuMycsICd3cG40JywgJ3dwbjUnLCAnd3BuNicsICd3cG43JyxcblxuICAgICAgLy8gYWxsIGNvbWJpbmVkIGludG8gb25lIGFycmF5IGZpZWxkXG4gICAgICAnbGluazEnLCAnbGluazInLCAnbGluazMnLCAnbGluazQnLCAnbGluazUnLCAnbGluazYnLFxuICAgICAgJ21hc2sxJywgJ21hc2syJywgJ21hc2szJywgJ21hc2s0JywgJ21hc2s1JywgJ21hc2s2JyxcbiAgICAgICduYnIxJywgICduYnIyJywgICduYnIzJywgICduYnI0JywgICduYnI1JywgICduYnI2JyxcbiAgICAgICdyYW5kMScsICdyYW5kMicsICdyYW5kMycsICdyYW5kNCcsICdyYW5kNScsICdyYW5kNicsXG5cbiAgICAgIC8vIGRlcHJlY2F0ZWRcbiAgICAgICdtb3VudGVkJyxcbiAgICAgIC8vIHJlZHVuZGFudFxuICAgICAgJ3JlYW5pbWF0b3J+MScsXG4gICAgXSksXG4gICAga25vd25GaWVsZHM6IHtcbiAgICAgIGlkOiBDT0xVTU4uVTE2LFxuICAgICAgbmFtZTogQ09MVU1OLlNUUklORyxcbiAgICAgIHJ0OiBDT0xVTU4uVTgsXG4gICAgICByZWNsaW1pdDogQ09MVU1OLkk4LFxuICAgICAgYmFzZWNvc3Q6IENPTFVNTi5VMTYsXG4gICAgICByY29zdDogQ09MVU1OLkk4LFxuICAgICAgc2l6ZTogQ09MVU1OLlU4LFxuICAgICAgcmVzc2l6ZTogQ09MVU1OLlU4LFxuICAgICAgaHA6IENPTFVNTi5VMTYsXG4gICAgICBwcm90OiBDT0xVTU4uVTgsXG4gICAgICBtcjogQ09MVU1OLlU4LFxuICAgICAgbW9yOiBDT0xVTU4uVTgsXG4gICAgICBzdHI6IENPTFVNTi5VOCxcbiAgICAgIGF0dDogQ09MVU1OLlU4LFxuICAgICAgZGVmOiBDT0xVTU4uVTgsXG4gICAgICBwcmVjOiBDT0xVTU4uVTgsXG4gICAgICBlbmM6IENPTFVNTi5VOCxcbiAgICAgIG1hcG1vdmU6IENPTFVNTi5VOCxcbiAgICAgIGFwOiBDT0xVTU4uVTgsXG4gICAgICBhbWJpZGV4dHJvdXM6IENPTFVNTi5VOCxcbiAgICAgIG1vdW50bW5yOiBDT0xVTU4uVTE2LFxuICAgICAgc2tpbGxlZHJpZGVyOiBDT0xVTU4uVTgsXG4gICAgICByZWludmlnb3JhdGlvbjogQ09MVU1OLlU4LFxuICAgICAgbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICB1bmRlYWRsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGFnZTogQ09MVU1OLlUxNixcbiAgICAgIG1heGFnZTogQ09MVU1OLlUxNixcbiAgICAgIGhhbmQ6IENPTFVNTi5VOCxcbiAgICAgIGhlYWQ6IENPTFVNTi5VOCxcbiAgICAgIG1pc2M6IENPTFVNTi5VOCxcbiAgICAgIHBhdGhjb3N0OiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGRvbTogQ09MVU1OLlU4LFxuICAgICAgYm9udXNzcGVsbHM6IENPTFVNTi5VOCxcbiAgICAgIEY6IENPTFVNTi5VOCxcbiAgICAgIEE6IENPTFVNTi5VOCxcbiAgICAgIFc6IENPTFVNTi5VOCxcbiAgICAgIEU6IENPTFVNTi5VOCxcbiAgICAgIFM6IENPTFVNTi5VOCxcbiAgICAgIEQ6IENPTFVNTi5VOCxcbiAgICAgIE46IENPTFVNTi5VOCxcbiAgICAgIEc6IENPTFVNTi5VOCxcbiAgICAgIEI6IENPTFVNTi5VOCxcbiAgICAgIEg6IENPTFVNTi5VOCxcbiAgICAgIHNhaWxpbmdzaGlwc2l6ZTogQ09MVU1OLlUxNixcbiAgICAgIHNhaWxpbmdtYXh1bml0c2l6ZTogQ09MVU1OLlU4LFxuICAgICAgc3RlYWx0aHk6IENPTFVNTi5VOCxcbiAgICAgIHBhdGllbmNlOiBDT0xVTU4uVTgsXG4gICAgICBzZWR1Y2U6IENPTFVNTi5VOCxcbiAgICAgIHN1Y2N1YnVzOiBDT0xVTU4uVTgsXG4gICAgICBjb3JydXB0OiBDT0xVTU4uVTgsXG4gICAgICBob21lc2ljazogQ09MVU1OLlU4LFxuICAgICAgZm9ybWF0aW9uZmlnaHRlcjogQ09MVU1OLkk4LFxuICAgICAgc3RhbmRhcmQ6IENPTFVNTi5JOCxcbiAgICAgIGluc3BpcmF0aW9uYWw6IENPTFVNTi5JOCxcbiAgICAgIHRhc2ttYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJlYXN0bWFzdGVyOiBDT0xVTU4uVTgsXG4gICAgICBib2R5Z3VhcmQ6IENPTFVNTi5VOCxcbiAgICAgIHdhdGVyYnJlYXRoaW5nOiBDT0xVTU4uVTE2LFxuICAgICAgaWNlcHJvdDogQ09MVU1OLlU4LFxuICAgICAgaW52dWxuZXJhYmxlOiBDT0xVTU4uVTgsXG4gICAgICBzaG9ja3JlczogQ09MVU1OLkk4LFxuICAgICAgZmlyZXJlczogQ09MVU1OLkk4LFxuICAgICAgY29sZHJlczogQ09MVU1OLkk4LFxuICAgICAgcG9pc29ucmVzOiBDT0xVTU4uVTgsXG4gICAgICBhY2lkcmVzOiBDT0xVTU4uSTgsXG4gICAgICB2b2lkc2FuaXR5OiBDT0xVTU4uVTgsXG4gICAgICBkYXJrdmlzaW9uOiBDT0xVTU4uVTgsXG4gICAgICBhbmltYWxhd2U6IENPTFVNTi5VOCxcbiAgICAgIGF3ZTogQ09MVU1OLlU4LFxuICAgICAgaGFsdGhlcmV0aWM6IENPTFVNTi5VOCxcbiAgICAgIGZlYXI6IENPTFVNTi5VOCxcbiAgICAgIGJlcnNlcms6IENPTFVNTi5VOCxcbiAgICAgIGNvbGQ6IENPTFVNTi5VOCxcbiAgICAgIGhlYXQ6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGJhbmVmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBkYW1hZ2VyZXY6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmNsb3VkOiBDT0xVTU4uVTgsXG4gICAgICBkaXNlYXNlY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIHNsaW1lcjogQ09MVU1OLlU4LFxuICAgICAgbWluZHNsaW1lOiBDT0xVTU4uVTE2LFxuICAgICAgcmVnZW5lcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICByZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25hcm1vcjogQ09MVU1OLlU4LFxuICAgICAgZXllbG9zczogQ09MVU1OLlU4LFxuICAgICAgZXRodHJ1ZTogQ09MVU1OLlU4LFxuICAgICAgc3Rvcm1wb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZmlyZXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjb2xkcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGRhcmtwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgY2hhb3Nwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgd2ludGVycG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHNwcmluZ3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBzdW1tZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZmFsbHBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmb3JnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBmaXhmb3JnZWJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBtYXN0ZXJzbWl0aDogQ09MVU1OLkk4LFxuICAgICAgcmVzb3VyY2VzOiBDT0xVTU4uVTgsXG4gICAgICBhdXRvaGVhbGVyOiBDT0xVTU4uVTgsXG4gICAgICBhdXRvZGlzaGVhbGVyOiBDT0xVTU4uVTgsXG4gICAgICBub2JhZGV2ZW50czogQ09MVU1OLlU4LFxuICAgICAgaW5zYW5lOiBDT0xVTU4uVTgsXG4gICAgICBzaGF0dGVyZWRzb3VsOiBDT0xVTU4uVTgsXG4gICAgICBsZXBlcjogQ09MVU1OLlU4LFxuICAgICAgY2hhb3NyZWM6IENPTFVNTi5VOCxcbiAgICAgIHBpbGxhZ2Vib251czogQ09MVU1OLlU4LFxuICAgICAgcGF0cm9sYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIGNhc3RsZWRlZjogQ09MVU1OLlU4LFxuICAgICAgc2llZ2Vib251czogQ09MVU1OLkkxNixcbiAgICAgIGluY3Byb3ZkZWY6IENPTFVNTi5VOCxcbiAgICAgIHN1cHBseWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBpbmN1bnJlc3Q6IENPTFVNTi5JMTYsXG4gICAgICBwb3BraWxsOiBDT0xVTU4uVTE2LFxuICAgICAgcmVzZWFyY2hib251czogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyaW5ncmVzOiBDT0xVTU4uSTgsXG4gICAgICBkb3VzZTogQ09MVU1OLlU4LFxuICAgICAgYWRlcHRzYWNyOiBDT0xVTU4uVTgsXG4gICAgICBjcm9zc2JyZWVkZXI6IENPTFVNTi5VOCxcbiAgICAgIG1ha2VwZWFybHM6IENPTFVNTi5VOCxcbiAgICAgIHZvaWRzdW06IENPTFVNTi5VOCxcbiAgICAgIGhlcmV0aWM6IENPTFVNTi5VOCxcbiAgICAgIGVsZWdpc3Q6IENPTFVNTi5VOCxcbiAgICAgIHNoYXBlY2hhbmdlOiBDT0xVTU4uVTE2LFxuICAgICAgZmlyc3RzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHNlY29uZHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgbGFuZHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgd2F0ZXJzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGZvcmVzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgcGxhaW5zaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHhwc2hhcGU6IENPTFVNTi5VOCxcbiAgICAgIG5hbWV0eXBlOiBDT0xVTU4uVTgsXG4gICAgICBzdW1tb246IENPTFVNTi5JMTYsXG4gICAgICBuX3N1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0xOiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjIwOiBDT0xVTU4uSTE2LFxuICAgICAgYmxvb2R2ZW5nZWFuY2U6IENPTFVNTi5VOCxcbiAgICAgIGJyaW5nZXJvZmZvcnR1bmU6IENPTFVNTi5JOCxcbiAgICAgIHJlYWxtMTogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0zOiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW00OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0xZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTJkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtM2Q2OiBDT0xVTU4uSTE2LFxuICAgICAgYmF0c3RhcnRzdW00ZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTVkNjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW02ZDY6IENPTFVNTi5VMTYsXG4gICAgICB0dXJtb2lsc3VtbW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhmaXJlOiBDT0xVTU4uVTgsXG4gICAgICB1d3JlZ2VuOiBDT0xVTU4uVTgsXG4gICAgICBzaHJpbmtocDogQ09MVU1OLlU4LFxuICAgICAgZ3Jvd2hwOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGluZ2FmZjogQ09MVU1OLlUzMixcbiAgICAgIGZpeGVkcmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGxhbWlhbG9yZDogQ09MVU1OLlU4LFxuICAgICAgcHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIGRyZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBtdW1taWZ5OiBDT0xVTU4uVTE2LFxuICAgICAgb25lYmF0dGxlc3BlbGw6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhaXJhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICB3YXRlcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGVhcnRoYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgYXN0cmFsYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0RjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEE6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RXOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0RTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFM6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3REOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0TjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEFMTDogQ09MVU1OLkk4LFxuICAgICAgZXllczogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlZWF0ZXI6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbnNraW46IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aXRlbTogQ09MVU1OLlU4LFxuICAgICAgYmF0dGxlc3VtNTogQ09MVU1OLlUxNixcbiAgICAgIGFjaWRzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIHByb3BoZXRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGhvcnJvcjogQ09MVU1OLlU4LFxuICAgICAgbGF0ZWhlcm86IENPTFVNTi5VOCxcbiAgICAgIHV3ZGFtYWdlOiBDT0xVTU4uVTgsXG4gICAgICBsYW5kZGFtYWdlOiBDT0xVTU4uVTgsXG4gICAgICBycGNvc3Q6IENPTFVNTi5VMzIsXG4gICAgICByYW5kNTogQ09MVU1OLlU4LFxuICAgICAgbmJyNTogQ09MVU1OLlU4LFxuICAgICAgbWFzazU6IENPTFVNTi5VMTYsXG4gICAgICByYW5kNjogQ09MVU1OLlU4LFxuICAgICAgbmJyNjogQ09MVU1OLlU4LFxuICAgICAgbWFzazY6IENPTFVNTi5VMTYsXG4gICAgICBtdW1taWZpY2F0aW9uOiBDT0xVTU4uVTE2LFxuICAgICAgZGlzZWFzZXJlczogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VvbmtpbGw6IENPTFVNTi5VOCxcbiAgICAgIHJhaXNlc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBzZW5kbGVzc2VyaG9ycm9ybXVsdDogQ09MVU1OLlU4LFxuICAgICAgaW5jb3Jwb3JhdGU6IENPTFVNTi5VOCxcbiAgICAgIGJsZXNzYmVyczogQ09MVU1OLlU4LFxuICAgICAgY3Vyc2VhdHRhY2tlcjogQ09MVU1OLlU4LFxuICAgICAgdXdoZWF0OiBDT0xVTU4uVTgsXG4gICAgICBzbG90aHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICBob3Jyb3JkZXNlcnRlcjogQ09MVU1OLlU4LFxuICAgICAgc29yY2VyeXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBvbGRlcjogQ09MVU1OLkk4LFxuICAgICAgZGlzYmVsaWV2ZTogQ09MVU1OLlU4LFxuICAgICAgZmlyZXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgbmF0dXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGJlYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGhvcnNldGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICByZWluY2FybmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICB3b2xmdGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBib2FydGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBzbGVlcGF1cmE6IENPTFVNTi5VOCxcbiAgICAgIHNuYWtldGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBhcHBldGl0ZTogQ09MVU1OLkk4LFxuICAgICAgdGVtcGxldHJhaW5lcjogQ09MVU1OLlU4LFxuICAgICAgaW5mZXJub3JldDogQ09MVU1OLlU4LFxuICAgICAga29reXRvc3JldDogQ09MVU1OLlU4LFxuICAgICAgYWRkcmFuZG9tYWdlOiBDT0xVTU4uVTE2LFxuICAgICAgdW5zdXJyOiBDT0xVTU4uVTgsXG4gICAgICBzcGVjaWFsbG9vazogQ09MVU1OLlU4LFxuICAgICAgYnVncmVmb3JtOiBDT0xVTU4uVTgsXG4gICAgICBvbmlzdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHN1bmF3ZTogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRhZmY6IENPTFVNTi5VOCxcbiAgICAgIGl2eWxvcmQ6IENPTFVNTi5VOCxcbiAgICAgIHRyaXBsZWdvZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kbWFnOiBDT0xVTU4uVTgsXG4gICAgICBmb3J0a2lsbDogQ09MVU1OLlU4LFxuICAgICAgdGhyb25la2lsbDogQ09MVU1OLlU4LFxuICAgICAgZGlnZXN0OiBDT0xVTU4uVTgsXG4gICAgICBpbmRlcG1vdmU6IENPTFVNTi5VOCxcbiAgICAgIGVudGFuZ2xlOiBDT0xVTU4uVTgsXG4gICAgICBhbGNoZW15OiBDT0xVTU4uVTgsXG4gICAgICB3b3VuZGZlbmQ6IENPTFVNTi5VOCxcbiAgICAgIGZhbHNlYXJteTogQ09MVU1OLkk4LFxuICAgICAgc3VtbW9uNTogQ09MVU1OLlU4LFxuICAgICAgc2xhdmVyOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhwYXJhbHl6ZTogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlY29uc3RydWN0OiBDT0xVTU4uVTgsXG4gICAgICBndWFyZGlhbnNwaXJpdG1vZGlmaWVyOiBDT0xVTU4uSTgsXG4gICAgICBpY2Vmb3JnaW5nOiBDT0xVTU4uVTgsXG4gICAgICBjbG9ja3dvcmtsb3JkOiBDT0xVTU4uVTgsXG4gICAgICBtaW5zaXplbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICBpcm9udnVsOiBDT0xVTU4uVTgsXG4gICAgICBoZWF0aGVuc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBwb3dlcm9mZGVhdGg6IENPTFVNTi5VOCxcbiAgICAgIHJlZm9ybXRpbWU6IENPTFVNTi5JOCxcbiAgICAgIHR3aWNlYm9ybjogQ09MVU1OLlUxNixcbiAgICAgIHRtcGFzdHJhbGdlbXM6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aGVyb2FiOiBDT0xVTU4uVTgsXG4gICAgICB1d2ZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIHNhbHR2dWw6IENPTFVNTi5VOCxcbiAgICAgIGxhbmRlbmM6IENPTFVNTi5VOCxcbiAgICAgIHBsYWd1ZWRvY3RvcjogQ09MVU1OLlU4LFxuICAgICAgY3Vyc2VsdWNrc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBmYXJ0aHJvbmVraWxsOiBDT0xVTU4uVTgsXG4gICAgICBob3Jyb3JtYXJrOiBDT0xVTU4uVTgsXG4gICAgICBhbGxyZXQ6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRkaWdlc3Q6IENPTFVNTi5VOCxcbiAgICAgIGJlY2tvbjogQ09MVU1OLlU4LFxuICAgICAgc2xhdmVyYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGNhcmNhc3Njb2xsZWN0b3I6IENPTFVNTi5VOCxcbiAgICAgIG1pbmRjb2xsYXI6IENPTFVNTi5VOCxcbiAgICAgIG1vdW50YWlucmVjOiBDT0xVTU4uVTgsXG4gICAgICBpbmRlcHNwZWxsczogQ09MVU1OLlU4LFxuICAgICAgZW5jaHJlYmF0ZTUwOiBDT0xVTU4uVTgsXG4gICAgICBzdW1tb24xOiBDT0xVTU4uVTE2LFxuICAgICAgcmFuZG9tc3BlbGw6IENPTFVNTi5VOCxcbiAgICAgIGluc2FuaWZ5OiBDT0xVTU4uVTgsXG4gICAgICAvL2p1c3QgYSBjb3B5IG9mIHJlYW5pbWF0b3IuLi5cbiAgICAgIC8vJ3JlYW5pbWF0b3J+MSc6IENPTFVNTi5VOCxcbiAgICAgIGRlZmVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTFkMzogQ09MVU1OLlUxNixcbiAgICAgIGVuY2hyZWJhdGUxMDogQ09MVU1OLlU4LFxuICAgICAgdW5keWluZzogQ09MVU1OLlU4LFxuICAgICAgbW9yYWxlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHVuY3VyYWJsZWFmZmxpY3Rpb246IENPTFVNTi5VMzIsXG4gICAgICB3aW50ZXJzdW1tb24xZDM6IENPTFVNTi5VMTYsXG4gICAgICBzdHlnaWFuZ3VpZGU6IENPTFVNTi5VOCxcbiAgICAgIHNtYXJ0bW91bnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlZm9ybWluZ2ZsZXNoOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyb2Z0aGVmbG9vZDogQ09MVU1OLlU4LFxuICAgICAgY29ycHNlc3RpdGNoZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlY29uc3RydWN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBub2ZyaWRlcnM6IENPTFVNTi5VOCxcbiAgICAgIGNvcmlkZXJtbnI6IENPTFVNTi5VMTYsXG4gICAgICBob2x5Y29zdDogQ09MVU1OLlU4LFxuICAgICAgYW5pbWF0ZW1ucjogQ09MVU1OLlUxNixcbiAgICAgIGxpY2g6IENPTFVNTi5VMTYsXG4gICAgICBlcmFzdGFydGFnZWluY3JlYXNlOiBDT0xVTU4uVTE2LFxuICAgICAgbW9yZW9yZGVyOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlZ3Jvd3RoOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlcHJvZDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWhlYXQ6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVsdWNrOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlbWFnaWM6IENPTFVNTi5JOCxcbiAgICAgIG5vZm1vdW50czogQ09MVU1OLlU4LFxuICAgICAgZmFsc2VkYW1hZ2VyZWNvdmVyeTogQ09MVU1OLlU4LFxuICAgICAgdXdwYXRoYm9vc3Q6IENPTFVNTi5JOCxcbiAgICAgIHJhbmRvbWl0ZW1zOiBDT0xVTU4uVTE2LFxuICAgICAgZGVhdGhzbGltZWV4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRocG9pc29uZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhzaG9ja2V4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRyYXdzaXplOiBDT0xVTU4uSTgsXG4gICAgICBwZXRyaWZpY2F0aW9uaW1tdW5lOiBDT0xVTU4uVTgsXG4gICAgICBzY2Fyc291bHM6IENPTFVNTi5VOCxcbiAgICAgIHNwaWtlYmFyYnM6IENPTFVNTi5VOCxcbiAgICAgIHByZXRlbmRlcnN0YXJ0c2l0ZTogQ09MVU1OLlUxNixcbiAgICAgIG9mZnNjcmlwdHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICB1bm1vdW50ZWRzcHI6IENPTFVNTi5VMzIsXG4gICAgICBleGhhdXN0aW9uOiBDT0xVTU4uVTgsXG4gICAgICAvLyBtb3VudGVkOiBDT0xVTU4uQk9PTCwgLy8gZGVwcmVjYXRlZFxuICAgICAgYm93OiBDT0xVTU4uQk9PTCxcbiAgICAgIGJvZHk6IENPTFVNTi5CT09MLFxuICAgICAgZm9vdDogQ09MVU1OLkJPT0wsXG4gICAgICBjcm93bm9ubHk6IENPTFVNTi5CT09MLFxuICAgICAgaG9seTogQ09MVU1OLkJPT0wsXG4gICAgICBpbnF1aXNpdG9yOiBDT0xVTU4uQk9PTCxcbiAgICAgIGluYW5pbWF0ZTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmRlYWQ6IENPTFVNTi5CT09MLFxuICAgICAgZGVtb246IENPTFVNTi5CT09MLFxuICAgICAgbWFnaWNiZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdG9uZWJlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFuaW1hbDogQ09MVU1OLkJPT0wsXG4gICAgICBjb2xkYmxvb2Q6IENPTFVNTi5CT09MLFxuICAgICAgZmVtYWxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZvcmVzdHN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50YWluc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgd2FzdGVzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBzd2FtcHN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFxdWF0aWM6IENPTFVNTi5CT09MLFxuICAgICAgYW1waGliaWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBvb3JhbXBoaWJpYW46IENPTFVNTi5CT09MLFxuICAgICAgZmxvYXQ6IENPTFVNTi5CT09MLFxuICAgICAgZmx5aW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0b3JtaW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRlbGVwb3J0OiBDT0xVTU4uQk9PTCxcbiAgICAgIGltbW9iaWxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vcml2ZXJwYXNzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlsbHVzaW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNweTogQ09MVU1OLkJPT0wsXG4gICAgICBhc3Nhc3NpbjogQ09MVU1OLkJPT0wsXG4gICAgICBoZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGltbW9ydGFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRvbWltbW9ydGFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vaGVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBuZWVkbm90ZWF0OiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuZGlzY2lwbGluZWQ6IENPTFVNTi5CT09MLFxuICAgICAgc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgc2xhc2hyZXM6IENPTFVNTi5CT09MLFxuICAgICAgYmx1bnRyZXM6IENPTFVNTi5CT09MLFxuICAgICAgcGllcmNlcmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsaW5kOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBldHJpZnk6IENPTFVNTi5CT09MLFxuICAgICAgZXRoZXJlYWw6IENPTFVNTi5CT09MLFxuICAgICAgZGVhdGhjdXJzZTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmFtcGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyYW1wc3dhbGxvdzogQ09MVU1OLkJPT0wsXG4gICAgICB0YXhjb2xsZWN0b3I6IENPTFVNTi5CT09MLFxuICAgICAgZHJhaW5pbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgdW5pcXVlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNjYWxld2FsbHM6IENPTFVNTi5CT09MLFxuICAgICAgZGl2aW5laW5zOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhlYXRyZWM6IENPTFVNTi5CT09MLFxuICAgICAgY29sZHJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRjaGFvczogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRkZWF0aDogQ09MVU1OLkJPT0wsXG4gICAgICBidWc6IENPTFVNTi5CT09MLFxuICAgICAgdXdidWc6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkb3JkZXI6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZ3Jvd3RoOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGRvbTogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFrZTogQ09MVU1OLkJPT0wsXG4gICAgICB0aGVmdG9mdGhlc3VuYXdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWdvbmxvcmQ6IENPTFVNTi5CT09MLFxuICAgICAgbWluZHZlc3NlbDogQ09MVU1OLkJPT0wsXG4gICAgICBlbGVtZW50cmFuZ2U6IENPTFVNTi5CT09MLFxuICAgICAgYXN0cmFsZmV0dGVyczogQ09MVU1OLkJPT0wsXG4gICAgICBjb21iYXRjYXN0ZXI6IENPTFVNTi5CT09MLFxuICAgICAgYWlzaW5nbGVyZWM6IENPTFVNTi5CT09MLFxuICAgICAgbm93aXNoOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hc29uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwaXJpdHNpZ2h0OiBDT0xVTU4uQk9PTCxcbiAgICAgIG93bmJsb29kOiBDT0xVTU4uQk9PTCxcbiAgICAgIGludmlzaWJsZTogQ09MVU1OLkJPT0wsXG4gICAgICBzcGVsbHNpbmdlcjogQ09MVU1OLkJPT0wsXG4gICAgICBtYWdpY3N0dWR5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuaWZ5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyaXBsZTNtb246IENPTFVNTi5CT09MLFxuICAgICAgeWVhcnR1cm46IENPTFVNTi5CT09MLFxuICAgICAgdW50ZWxlcG9ydGFibGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVhbmltcHJpZXN0OiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0dW5pbW11bml0eTogQ09MVU1OLkJPT0wsXG4gICAgICBzaW5nbGViYXR0bGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVzZWFyY2h3aXRob3V0bWFnaWM6IENPTFVNTi5CT09MLFxuICAgICAgYXV0b2NvbXBldGU6IENPTFVNTi5CT09MLFxuICAgICAgYWR2ZW50dXJlcnM6IENPTFVNTi5CT09MLFxuICAgICAgY2xlYW5zaGFwZTogQ09MVU1OLkJPT0wsXG4gICAgICByZXFsYWI6IENPTFVNTi5CT09MLFxuICAgICAgcmVxdGVtcGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhvcnJvcm1hcmtlZDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2FzaGFoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYXlhemFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYWRhZXZhOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsZXNzZmx5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHBsYW50OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbXNsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNub3dtb3ZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN3aW1taW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0dXBpZDogQ09MVU1OLkJPT0wsXG4gICAgICBza2lybWlzaGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuc2VlbjogQ09MVU1OLkJPT0wsXG4gICAgICBub21vdmVwZW46IENPTFVNTi5CT09MLFxuICAgICAgd29sZjogQ09MVU1OLkJPT0wsXG4gICAgICBkdW5nZW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFib2xldGg6IENPTFVNTi5CT09MLFxuICAgICAgbG9jYWxzdW46IENPTFVNTi5CT09MLFxuICAgICAgdG1wZmlyZWdlbXM6IENPTFVNTi5CT09MLFxuICAgICAgZGVmaWxlcjogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGVkYmVzZXJrOiBDT0xVTU4uQk9PTCxcbiAgICAgIGxhbmNlb2s6IENPTFVNTi5CT09MLFxuICAgICAgbWlucHJpc29uOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhwb3ZlcmZsb3c6IENPTFVNTi5CT09MLFxuICAgICAgaW5kZXBzdGF5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHBvbHlpbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgbm9yYW5nZTogQ09MVU1OLkJPT0wsXG4gICAgICBub2hvZjogQ09MVU1OLkJPT0wsXG4gICAgICBhdXRvYmxlc3NlZDogQ09MVU1OLkJPT0wsXG4gICAgICBhbG1vc3R1bmRlYWQ6IENPTFVNTi5CT09MLFxuICAgICAgdHJ1ZXNpZ2h0OiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vYmlsZWFyY2hlcjogQ09MVU1OLkJPT0wsXG4gICAgICBzcGlyaXRmb3JtOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNob3J1c3NsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNob3J1c21hc3RlcjogQ09MVU1OLkJPT0wsXG4gICAgICB0aWdodHJlaW46IENPTFVNTi5CT09MLFxuICAgICAgZ2xhbW91cm1hbjogQ09MVU1OLkJPT0wsXG4gICAgICBkaXZpbmViZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBub2ZhbGxkbWc6IENPTFVNTi5CT09MLFxuICAgICAgZmlyZWVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgYWlyZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICB3YXRlcmVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgZWFydGhlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBvcHNweTogQ09MVU1OLkJPT0wsXG4gICAgICBjYXBpdGFsaG9tZTogQ09MVU1OLkJPT0wsXG4gICAgICBjbHVtc3k6IENPTFVNTi5CT09MLFxuICAgICAgcmVnYWlubW91bnQ6IENPTFVNTi5CT09MLFxuICAgICAgbm9iYXJkaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50aXNjb206IENPTFVNTi5CT09MLFxuICAgICAgbm90aHJvd29mZjogQ09MVU1OLkJPT0wsXG4gICAgICBiaXJkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlY2F5cmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGN1Ym1vdGhlcjogQ09MVU1OLkJPT0wsXG4gICAgICBnbGFtb3VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdlbXByb2Q6IENPTFVNTi5TVFJJTkcsXG4gICAgICBmaXhlZG5hbWU6IENPTFVNTi5TVFJJTkcsXG4gICAgfSxcbiAgICBleHRyYUZpZWxkczoge1xuICAgICAgdHlwZTogKGluZGV4OiBudW1iZXIsIGFyZ3M6IFNjaGVtYUFyZ3MpID0+IHtcbiAgICAgICAgY29uc3Qgc2RJbmRleCA9IGFyZ3MucmF3RmllbGRzWydzdGFydGRvbSddO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd0eXBlJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIC8vIGhhdmUgdG8gZmlsbCBpbiBtb3JlIHN0dWZmIGxhdGVyLCB3aGVuIHdlIGpvaW4gcmVjIHR5cGVzLCBvaCB3ZWxsXG4gICAgICAgICAgICAvLyBvdGhlciB0eXBlczogY29tbWFuZGVyLCBtZXJjZW5hcnksIGhlcm8sIGV0Y1xuICAgICAgICAgICAgaWYgKHVbc2RJbmRleF0pIHJldHVybiAzOyAvLyBnb2QgKyBjb21tYW5kZXJcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7IC8vIGp1c3QgYSB1bml0XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ2l0ZW1jb3N0MX4xJywgJ3dhcm5pbmd+MSddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2RvbWNvbmZsaWN0fjEnLCdlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgLy8gVE9ETyAtIGdvdCBzb21lIGJpZyBib2lzIGluIGhlcmUuXG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RfbW9kaWZpZXJfYml0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsQml0JyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19pbmZvLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdTcGVsbEVmZmVjdEluZm8nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3NwZWxscy5jc3YnOiB7XG4gICAga2V5OiAncmVjb3JkX2lkJyxcbiAgICBuYW1lOiAnRWZmZWN0U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFdlYXBvbicsXG4gICAga2V5OiAncmVjb3JkX2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lbmNoYW50bWVudHMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ0VuY2hhbnRtZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZXZlbnRzLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ0V2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hZ2ljX3BhdGhzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ01hZ2ljUGF0aCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hcF90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1RlcnJhaW5UeXBlQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbW9uc3Rlcl90YWdzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ01vbnN0ZXJUYWcnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYW1ldHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnTmFtZVR5cGUnLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmF0aW9ucy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ05vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvb3RoZXJfcGxhbmVzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdPdGhlclBsYW5lJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcm90ZWN0aW9uc19ieV9hcm1vci5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJvdGVjdGlvbkJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3JlYWxtcy5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUmVhbG0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zaXRlX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgbmFtZTogJ1NpdGVUZXJyYWluVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfZGFtYWdlX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTcGVjaWFsRGFtYWdlVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfdW5pcXVlX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsVW5pcXVlU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbCcsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG59XG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUzogUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiAnJyxcbiAga2V5OiAnJyxcbiAgaWdub3JlRmllbGRzOiBuZXcgU2V0KCksXG4gIG92ZXJyaWRlczoge30sXG4gIGtub3duRmllbGRzOiB7fSxcbiAgZXh0cmFGaWVsZHM6IHt9LFxuICBzZXBhcmF0b3I6ICdcXHQnLCAvLyBzdXJwcmlzZSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUoXG4gIHJhdzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XG4pOiBUYWJsZSB7XG4gIGNvbnN0IF9vcHRzID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiBfb3B0cy5uYW1lLFxuICAgIGtleTogX29wdHMua2V5LFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBjb2x1bW5zOiBbXSxcbiAgICBmaWVsZHM6IFtdLFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgb3ZlcnJpZGVzOiBfb3B0cy5vdmVycmlkZXMsXG4gIH07XG4gIGlmICghc2NoZW1hQXJncy5uYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ25hbWUgaXMgcmVxdXJpZWQnKTtcbiAgaWYgKCFzY2hlbWFBcmdzLmtleSkgdGhyb3cgbmV3IEVycm9yKCdrZXkgaXMgcmVxdXJpZWQnKTtcblxuICBpZiAocmF3LmluZGV4T2YoJ1xcMCcpICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCd1aCBvaCcpXG5cbiAgY29uc3QgW3Jhd0ZpZWxkcywgLi4ucmF3RGF0YV0gPSByYXdcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KF9vcHRzLnNlcGFyYXRvcikpO1xuXG4gIGNvbnN0IGhDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKCFmKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gXCIke2Z9XCIgaXMgYSBkdXBsaWNhdGUgZmllbGQgbmFtZWApO1xuICAgICAgY29uc3QgbiA9IGhDb3VudC5nZXQoZikhXG4gICAgICByYXdGaWVsZHNbaV0gPSBgJHtmfX4ke259YDtcbiAgICB9IGVsc2Uge1xuICAgICAgaENvdW50LnNldChmLCAxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByYXdDb2x1bW5zOiBDb2x1bW5BcmdzW10gPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIG5hbWVdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBsZXQgYzogbnVsbCB8IENvbHVtbkFyZ3MgPSBudWxsO1xuICAgIHNjaGVtYUFyZ3MucmF3RmllbGRzW25hbWVdID0gaW5kZXg7XG4gICAgaWYgKF9vcHRzLmlnbm9yZUZpZWxkcz8uaGFzKG5hbWUpKSBjb250aW51ZTtcbiAgICBpZiAoX29wdHMua25vd25GaWVsZHNbbmFtZV0pIHtcbiAgICAgIGMgPSBhcmdzRnJvbVR5cGUoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIF9vcHRzLmtub3duRmllbGRzW25hbWVdLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYyA9IGFyZ3NGcm9tVGV4dChcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICAgICAgcmF3RGF0YSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYEdPT0IgSU5URVJDRVBURUQgSU4gJHtzY2hlbWFBcmdzLm5hbWV9OiBcXHgxYlszMW0ke2luZGV4fToke25hbWV9XFx4MWJbMG1gLFxuICAgICAgICAgICAgZXhcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZXhcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgcmF3Q29sdW1ucy5wdXNoKGMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zPy5leHRyYUZpZWxkcykge1xuICAgIGNvbnN0IGJpID0gT2JqZWN0LnZhbHVlcyhzY2hlbWFBcmdzLnJhd0ZpZWxkcykubGVuZ3RoOyAvLyBobW1tbVxuICAgIHJhd0NvbHVtbnMucHVzaCguLi5PYmplY3QuZW50cmllcyhvcHRpb25zLmV4dHJhRmllbGRzKS5tYXAoXG4gICAgICAoW25hbWUsIGNyZWF0ZUNvbHVtbl06IFtzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGRdLCBlaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV07XG4gICAgICAgIC8vY29uc29sZS5sb2coZWksIHNjaGVtYUFyZ3MucmF3RmllbGRzKVxuICAgICAgICBjb25zdCBpbmRleCA9IGJpICsgZWk7XG4gICAgICAgIGNvbnN0IGNhID0gY3JlYXRlQ29sdW1uKGluZGV4LCBzY2hlbWFBcmdzLCBuYW1lLCBvdmVycmlkZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNhLmluZGV4ICE9PSBpbmRleCkgdGhyb3cgbmV3IEVycm9yKCd3aXNlZ3V5IHBpY2tlZCBoaXMgb3duIGluZGV4Jyk7XG4gICAgICAgICAgaWYgKGNhLm5hbWUgIT09IG5hbWUpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBuYW1lJyk7XG4gICAgICAgICAgaWYgKGNhLnR5cGUgPT09IENPTFVNTi5CT09MKSB7XG4gICAgICAgICAgICBpZiAoY2EuYml0ICE9PSBzY2hlbWFBcmdzLmZsYWdzVXNlZCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIGJhYnkgaWRpb3QnKTtcbiAgICAgICAgICAgIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNhLCB7IGluZGV4LCBvdmVycmlkZSwgbmFtZSwgfSlcbiAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2E7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgY29sQXJncyBvZiByYXdDb2x1bW5zKSB7XG4gICAgY29uc3QgY29sID0gZnJvbUFyZ3MoY29sQXJncyk7XG4gICAgc2NoZW1hQXJncy5jb2x1bW5zLnB1c2goY29sKTtcbiAgICBzY2hlbWFBcmdzLmZpZWxkcy5wdXNoKGNvbC5uYW1lKTtcbiAgfVxuXG4gIGlmIChzY2hlbWFBcmdzLmtleSAhPT0gJ19fcm93SWQnICYmICFzY2hlbWFBcmdzLmZpZWxkcy5pbmNsdWRlcyhzY2hlbWFBcmdzLmtleSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBmaWVsZHMgaXMgbWlzc2luZyB0aGUgc3VwcGxpZWQga2V5IFwiJHtzY2hlbWFBcmdzLmtleX1cImApO1xuXG4gIGZvciAoY29uc3QgY29sIG9mIHNjaGVtYUFyZ3MuY29sdW1ucykge1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdW2NvbC5pbmRleF0sXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXSxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKGRhdGEsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VBbGwoZGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+Pikge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVmcykubWFwKChbcGF0aCwgb3B0aW9uc10pID0+IHJlYWRDU1YocGF0aCwgb3B0aW9ucykpXG4gICk7XG59XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgUGFyc2VTY2hlbWFPcHRpb25zLCBwYXJzZUFsbCwgcmVhZENTViB9IGZyb20gJy4vcGFyc2UtY3N2JztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBqb2luRHVtcGVkIH0gZnJvbSAnLi9qb2luLXRhYmxlcyc7XG5cbmNvbnN0IHdpZHRoID0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucztcbmNvbnN0IFtmaWxlLCAuLi5maWVsZHNdID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuXG5mdW5jdGlvbiBmaW5kRGVmIChuYW1lOiBzdHJpbmcpOiBbc3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5dIHtcbiAgaWYgKGNzdkRlZnNbbmFtZV0pIHJldHVybiBbbmFtZSwgY3N2RGVmc1tuYW1lXV07XG4gIGZvciAoY29uc3QgayBpbiBjc3ZEZWZzKSB7XG4gICAgY29uc3QgZCA9IGNzdkRlZnNba107XG4gICAgaWYgKGQubmFtZSA9PT0gbmFtZSkgcmV0dXJuIFtrLCBkXTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYG5vIGNzdiBkZWZpbmVkIGZvciBcIiR7bmFtZX1cImApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wT25lKGtleTogc3RyaW5nKSB7XG4gIGNvbnN0IHRhYmxlID0gYXdhaXQgcmVhZENTViguLi5maW5kRGVmKGtleSkpO1xuICBjb21wYXJlRHVtcHModGFibGUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wQWxsICgpIHtcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIC8vIEpPSU5TXG4gIGpvaW5EdW1wZWQodGFibGVzKTtcbiAgY29uc3QgZGVzdCA9ICcuL2RhdGEvZGIuMzAuYmluJ1xuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKHRhYmxlcyk7XG4gIGF3YWl0IHdyaXRlRmlsZShkZXN0LCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xuICBjb25zb2xlLmxvZyhgd3JvdGUgJHtibG9iLnNpemV9IGJ5dGVzIHRvICR7ZGVzdH1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29tcGFyZUR1bXBzKHQ6IFRhYmxlKSB7XG4gIGNvbnN0IG1heE4gPSB0LnJvd3MubGVuZ3RoIC0gMzBcbiAgbGV0IG46IG51bWJlcjtcbiAgbGV0IHA6IGFueSA9IHVuZGVmaW5lZDtcbiAgaWYgKGZpZWxkc1swXSA9PT0gJ0ZJTFRFUicpIHtcbiAgICBuID0gMDsgLy8gd2lsbCBiZSBpbmdvcmVkXG4gICAgZmllbGRzLnNwbGljZSgwLCAxLCAnaWQnLCAnbmFtZScpO1xuICAgIHAgPSAocjogYW55KSA9PiBmaWVsZHMuc2xpY2UoMikuc29tZShmID0+IHJbZl0pO1xuICB9IGVsc2UgaWYgKGZpZWxkc1sxXSA9PT0gJ1JPVycgJiYgZmllbGRzWzJdKSB7XG4gICAgbiA9IE51bWJlcihmaWVsZHNbMl0pIC0gMTU7XG4gICAgZmllbGRzLnNwbGljZSgxLCAyKVxuICAgIGNvbnNvbGUubG9nKGBlbnN1cmUgcm93ICR7ZmllbGRzWzJdfSBpcyB2aXNpYmxlICgke259KWApO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHRocm93IG5ldyBFcnJvcignUk9XIG11c3QgYmUgTlVNQkVSISEhIScpO1xuICB9IGVsc2Uge1xuICAgIG4gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXhOKVxuICB9XG4gIG4gPSBNYXRoLm1pbihtYXhOLCBNYXRoLm1heCgwLCBuKSk7XG4gIGNvbnN0IG0gPSBuICsgMzA7XG4gIGNvbnN0IGYgPSAoZmllbGRzLmxlbmd0aCA/IChmaWVsZHNbMF0gPT09ICdBTEwnID8gdC5zY2hlbWEuZmllbGRzIDogZmllbGRzKSA6XG4gICB0LnNjaGVtYS5maWVsZHMuc2xpY2UoMCwgMTApKSBhcyBzdHJpbmdbXVxuICBkdW1wVG9Db25zb2xlKHQsIG4sIG0sIGYsICdCRUZPUkUnLCBwKTtcbiAgLypcbiAgaWYgKDEgKyAxID09PSAyKSByZXR1cm47IC8vIFRPRE8gLSB3ZSBub3Qgd29ycmllZCBhYm91dCB0aGUgb3RoZXIgc2lkZSB5ZXRcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyhbdF0pO1xuICBjb25zb2xlLmxvZyhgbWFkZSAke2Jsb2Iuc2l6ZX0gYnl0ZSBibG9iYCk7XG4gIGNvbnNvbGUubG9nKCd3YWl0Li4uLicpO1xuICAvLyhnbG9iYWxUaGlzLl9ST1dTID8/PSB7fSlbdC5zY2hlbWEubmFtZV0gPSB0LnJvd3M7XG4gIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4nKVxuICBjb25zdCB1ID0gYXdhaXQgVGFibGUub3BlbkJsb2IoYmxvYik7XG4gIGR1bXBUb0NvbnNvbGUodVt0LnNjaGVtYS5uYW1lXSwgbiwgbSwgZiwgJ0FGVEVSJywgcCk7XG4gIC8vYXdhaXQgd3JpdGVGaWxlKCcuL3RtcC5iaW4nLCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xuICAqL1xufVxuXG5mdW5jdGlvbiBkdW1wVG9Db25zb2xlKFxuICB0OiBUYWJsZSxcbiAgbjogbnVtYmVyLFxuICBtOiBudW1iZXIsXG4gIGY6IHN0cmluZ1tdLFxuICBoOiBzdHJpbmcsXG4gIHA/OiAocjogYW55KSA9PiBib29sZWFuLFxuKSB7XG4gIGNvbnNvbGUubG9nKGBcXG4gICAgICR7aH06YCk7XG4gIHQuc2NoZW1hLnByaW50KHdpZHRoKTtcbiAgY29uc29sZS5sb2coYCh2aWV3IHJvd3MgJHtufSAtICR7bX0pYCk7XG4gIGNvbnN0IHJvd3MgPSB0LnByaW50KHdpZHRoLCBmLCBuLCBtLCBwKTtcbiAgaWYgKHJvd3MpIGZvciAoY29uc3QgciBvZiByb3dzKSBjb25zb2xlLnRhYmxlKFtyXSk7XG4gIGNvbnNvbGUubG9nKGAgICAgLyR7aH1cXG5cXG5gKVxufVxuXG5cblxuY29uc29sZS5sb2coJ0FSR1MnLCB7IGZpbGUsIGZpZWxkcyB9KVxuXG5pZiAoZmlsZSkgZHVtcE9uZShmaWxlKTtcbmVsc2UgZHVtcEFsbCgpO1xuXG5cbiIsICJpbXBvcnQgeyBCb29sQ29sdW1uLCBDT0xVTU4sIE51bWVyaWNDb2x1bW4sIFNjaGVtYSwgU2NoZW1hQXJncywgVGFibGUgfVxuICBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxuZnVuY3Rpb24gZmluZFRhYmxlIChuYW1lOiBzdHJpbmcsIHRhYmxlczogVGFibGVbXSk6IFRhYmxlIHtcbiAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykgaWYgKHQuc2NoZW1hLm5hbWUgPT09IG5hbWUpIHJldHVybiB0O1xuICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBmaWxkIHRoZSB0YWJsZSBjYWxsZWQgXCIke25hbWV9XCJgKTtcbn1cblxudHlwZSBUUiA9IFJlY29yZDxzdHJpbmcsIFRhYmxlPjtcbmV4cG9ydCBmdW5jdGlvbiBqb2luRHVtcGVkICh0YWJsZUxpc3Q6IFRhYmxlW10pIHtcbiAgY29uc3QgdGFibGVzOiBUUiA9IE9iamVjdC5mcm9tRW50cmllcyh0YWJsZUxpc3QubWFwKHQgPT4gW3QubmFtZSwgdF0pKTtcbiAgdGFibGVMaXN0LnB1c2goXG4gICAgbWFrZU5hdGlvblNpdGVzKHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeVNpdGUodGFibGVzKSxcbiAgICBtYWtlU3BlbGxCeU5hdGlvbih0YWJsZXMpLFxuICAgIG1ha2VTcGVsbEJ5VW5pdCh0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlOYXRpb24odGFibGVzKSxcbiAgKTtcblxufVxuXG5cbmNvbnN0IEFUVFJfRkFSU1VNQ09NID0gNzkwOyAvLyBsdWwgd2h5IGlzIHRoaXMgdGhlIG9ubHkgb25lPz9cblxuLy8gVE9ETyAtIHJlYW5pbWF0aW9ucyBhc3dlbGw/IHR3aWNlYm9ybiB0b28/IGxlbXVyaWEtZXNxdWUgZnJlZXNwYXduPyB2b2lkZ2F0ZT9cbi8vIG1pZ2h0IGhhdmUgdG8gYWRkIGFsbCB0aGF0IG1hbnVhbGx5LCB3aGljaCBzaG91bGQgYmUgb2theSBzaW5jZSBpdCdzIG5vdCBsaWtlXG4vLyB0aGV5J3JlIGFjY2Vzc2libGUgdG8gbW9kcyBhbnl3YXlcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19TUkMge1xuICBVTktOT1dOID0gMCwgLy8gaS5lLiBub25lIGZvdW5kLCBwcm9iYWJseSBpbmRpZSBwZD9cbiAgU1VNTU9OX0FMTElFUyA9IDEsIC8vIHZpYSAjbWFrZW1vbnN0ZXJOXG4gIFNVTU1PTl9ET00gPSAyLCAvLyB2aWEgI1tyYXJlXWRvbXN1bW1vbk5cbiAgU1VNTU9OX0FVVE8gPSAzLCAvLyB2aWEgI3N1bW1vbk4gLyBcInR1cm1vaWxzdW1tb25cIiAvIHdpbnRlcnN1bW1vbjFkM1xuICBTVU1NT05fQkFUVExFID0gNCwgLy8gdmlhICNiYXRzdGFydHN1bU4gb3IgI2JhdHRsZXN1bVxuICBURU1QTEVfVFJBSU5FUiA9IDUsIC8vIHZpYSAjdGVtcGxldHJhaW5lciwgdmFsdWUgaXMgaGFyZCBjb2RlZCB0byAxODU5Li4uXG4gIFJJVFVBTCA9IDYsXG4gIEVOVEVSX1NJVEUgPSA3LFxuICBSRUNfU0lURSA9IDgsXG4gIFJFQ19DQVAgPSA5LFxuICBSRUNfRk9SRUlHTiA9IDEwLFxuICBSRUNfRk9SVCA9IDExLFxuICBFVkVOVCA9IDEyLFxuICBIRVJPID0gMTMsXG4gIFBSRVRFTkRFUiA9IDE0LFxufVxuXG4gIC8qXG5jb25zdCBTVU1fRklFTERTID0gW1xuICAvLyB0aGVzZSB0d28gY29tYmluZWQgc2VlbSB0byBiZSBzdW1tb24gI21ha2Vtb25zdGVyTlxuICAnc3VtbW9uJywgJ25fc3VtbW9uJyxcbiAgLy8gdGhpcyBpcyB1c2VkIGJ5IHRoZSBnaG91bCBsb3JkIG9ubHksIGFuZCBpdCBzaG91bGQgYWN0dWFsbHkgYmUgYG5fc3VtbW9uID0gNWBcbiAgJ3N1bW1vbjUnLFxuICAvLyBhdXRvIHN1bW1vbiAxL21vbnRoLCBhcyBwZXIgbW9kIGNvbW1hbmRzLCB1c2VkIG9ubHkgYnkgZmFsc2UgcHJvcGhldCBhbmQgdmluZSBndXk/XG4gICdzdW1tb24xJyxcblxuICAvLyBkb20gc3VtbW9uIGNvbW1hbmRzXG4gICdkb21zdW1tb24nLFxuICAnZG9tc3VtbW9uMicsXG4gICdkb21zdW1tb24yMCcsXG4gICdyYXJlZG9tc3VtbW9uJyxcblxuICAnYmF0c3RhcnRzdW0xJyxcbiAgJ2JhdHN0YXJ0c3VtMicsXG4gICdiYXRzdGFydHN1bTMnLFxuICAnYmF0c3RhcnRzdW00JyxcbiAgJ2JhdHN0YXJ0c3VtNScsXG4gICdiYXRzdGFydHN1bTFkMycsXG4gICdiYXRzdGFydHN1bTFkNicsXG4gICdiYXRzdGFydHN1bTJkNicsXG4gICdiYXRzdGFydHN1bTNkNicsXG4gICdiYXRzdGFydHN1bTRkNicsXG4gICdiYXRzdGFydHN1bTVkNicsXG4gICdiYXRzdGFydHN1bTZkNicsXG4gICdiYXR0bGVzdW01JywgLy8gcGVyIHJvdW5kXG5cbiAgLy8nb25pc3VtbW9uJywgd2UgZG9udCByZWFsbHkgY2FyZSBhYm91dCB0aGlzIG9uZSBiZWNhdXNlIGl0IGRvZXNudCB0ZWxsIHVzXG4gIC8vICBhYm91dCB3aGljaCBtb25zdGVycyBhcmUgc3VtbW9uZWRcbiAgLy8gJ2hlYXRoZW5zdW1tb24nLCBpZGZrPz8gaHR0cHM6Ly9pbGx3aWtpLmNvbS9kb201L3VzZXIvbG9nZ3kvc2xhdmVyXG4gIC8vICdjb2xkc3VtbW9uJywgdW51c2VkXG4gICd3aW50ZXJzdW1tb24xZDMnLCAvLyB2YW1wIHF1ZWVuLCBub3QgYWN0dWFsbHkgYSAoZG9jdW1lbnRlZCkgY29tbWFuZD9cblxuICAndHVybW9pbHN1bW1vbicsIC8vIGFsc28gbm90IGEgY29tbWFuZCB+ICFcbl1cbiovXG5cbmZ1bmN0aW9uIG1ha2VOYXRpb25TaXRlcyh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCB7IEF0dHJpYnV0ZUJ5TmF0aW9uIH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTaXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMSxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgam9pbnM6ICdOYXRpb24ubmF0aW9uSWQ6TWFnaWNTaXRlLnNpdGVJZCcsXG4gICAgZmllbGRzOiBbXG4gICAgICAnbmF0aW9uSWQnLFxuICAgICAgJ3NpdGVJZCcsXG4gICAgICAnZnV0dXJlJyxcbiAgICBdLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ25hdGlvbklkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBCb29sQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ2Z1dHVyZScsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgICAgYml0OiAwLFxuICAgICAgICBmbGFnOiAxXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXVxuICBmb3IgKGxldCBbaSwgcm93XSBvZiBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgbmF0aW9uX251bWJlcjogbmF0aW9uSWQsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlOiBzaXRlSWQgfSA9IHJvdztcbiAgICBsZXQgZnV0dXJlOiBib29sZWFuID0gZmFsc2U7XG4gICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgIGNhc2UgNjMxOlxuICAgICAgICBmdXR1cmUgPSB0cnVlO1xuICAgICAgICAvLyB1IGtub3cgdGhpcyBiaXRjaCBmYWxscyBUSFJVXG4gICAgICBjYXNlIDUyOlxuICAgICAgY2FzZSAxMDA6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIHNvbWUgb3RoZXIgZHVtYmFzcyBhdHRyaWJ1dGVcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcm93cy5wdXNoKHtcbiAgICAgIG5hdGlvbklkLFxuICAgICAgc2l0ZUlkLFxuICAgICAgZnV0dXJlLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgfSk7XG4gICAgZGVsUm93cy5wdXNoKGkpO1xuICB9XG5cbiAgLy8gcmVtb3ZlIG5vdy1yZWR1bmRhbnQgYXR0cmlidXRlc1xuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKVxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xufVxuXG4vKlxuZnVuY3Rpb24gbWFrZVVuaXRTb3VyY2VTY2hlbWEgKCk6IGFueSB7XG4gIHJldHVybiBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdFNvdXJjZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7XG4gICAgICB1bml0SWQ6IDAsXG4gICAgICBuYXRpb25JZDogMSxcbiAgICAgIHNvdXJjZUlkOiAyLFxuICAgICAgc291cmNlVHlwZTogMyxcbiAgICAgIHNvdXJjZUFyZzogNCxcbiAgICB9LFxuICAgIGZpZWxkczogW1xuICAgICAgJ3VuaXRJZCcsXG4gICAgICAnbmF0aW9uSWQnLFxuICAgICAgJ3NvdXJjZUlkJyxcbiAgICAgICdzb3VyY2VUeXBlJyxcbiAgICAgICdzb3VyY2VBcmcnLFxuICAgIF0sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ25hdGlvbklkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NvdXJjZUlkJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NvdXJjZVR5cGUnLFxuICAgICAgICBpbmRleDogMyxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzb3VyY2VBcmcnLFxuICAgICAgICBpbmRleDogNCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG59XG4qL1xuXG5mdW5jdGlvbiBtYWtlU3BlbGxCeU5hdGlvbiAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgYXR0cnMgPSB0YWJsZXMuQXR0cmlidXRlQnlTcGVsbDtcbiAgY29uc3QgZGVsUm93czogbnVtYmVyW10gPSBbXTtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1NwZWxsQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnU3BlbGwuc3BlbGxJZDpOYXRpb24ubmF0aW9uSWQnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBzcGVsbElkOiAwLCBuYXRpb25JZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ25hdGlvbklkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gMjc4KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gTkFUSU9OICR7cmF3X3ZhbHVlfWApO1xuICAgICAgY29uc3QgbmF0aW9uSWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobmF0aW9uSWQpIHx8IG5hdGlvbklkIDwgMCB8fCBuYXRpb25JZCA+IDI1NSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgTkFZU0ggISEhISEgKCR7bmF0aW9uSWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgbmF0aW9uSWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlVbml0ICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeVVuaXQnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnU3BlbGwuc3BlbGxJZDpVbml0LnVuaXRJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNwZWxsSWQ6IDAsIHVuaXRJZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ3VuaXRJZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NwZWxsSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgLy8gVE9ETyAtIGhvdyB0byBkaWZmZXJlbnRpYXRlIHVuaXQgdnMgY29tbWFuZGVyIHN1bW1vbj8gaSBmb3JnZXQgaWYgaSBmaWd1cmVkXG4gIC8vIHRoaXMgb3V0IGFscmVhZHlcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gNzMxKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtzcGVsbElkfSBJUyBSRVNUUklDVEVEIFRPIFVOSVQgJHtyYXdfdmFsdWV9YCk7XG4gICAgICBjb25zdCB1bml0SWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIodW5pdElkKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgVU5JVCAhISEhISAoJHt1bml0SWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgdW5pdElkIH0pO1xuICAgICAgX19yb3dJZCsrO1xuICAgIH1cbiAgfVxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQgPSB1bmRlZmluZWRcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbn1cblxuLy8gZmV3IHRoaW5ncyBoZXJlOlxuLy8gLSBobW9uMS01ICYgaGNvbTEtNCBhcmUgY2FwLW9ubHkgdW5pdHMvY29tbWFuZGVyc1xuLy8gLSBuYXRpb25hbHJlY3J1aXRzICsgbmF0Y29tIC8gbmF0bW9uIGFyZSBub24tY2FwIG9ubHkgc2l0ZS1leGNsdXNpdmVzICh5YXkpXG4vLyAtIG1vbjEtMiAmIGNvbTEtMyBhcmUgZ2VuZXJpYyByZWNydWl0YWJsZSB1bml0cy9jb21tYW5kZXJzXG4vLyAtIHN1bTEtNCAmIG5fc3VtMS00IGFyZSBtYWdlLXN1bW1vbmFibGUgKG4gZGV0ZXJtaW5lcyBtYWdlIGx2bCByZXEpXG4vLyAodm9pZGdhdGUgLSBub3QgcmVhbGx5IHJlbGV2YW50IGhlcmUsIGl0IGRvZXNuJ3QgaW5kaWNhdGUgd2hhdCBtb25zdGVycyBhcmVcbi8vIHN1bW1vbmVkLCBtYXkgYWRkIHRob3NlIG1hbnVhbGx5PylcblxuZXhwb3J0IGVudW0gU0lURV9SRUMge1xuICBIT01FX01PTiA9IDAsIC8vIGFyZyBpcyBuYXRpb24sIHdlJ2xsIGhhdmUgdG8gYWRkIGl0IGxhdGVyIHRob3VnaFxuICBIT01FX0NPTSA9IDEsIC8vIHNhbWVcbiAgUkVDX01PTiA9IDIsXG4gIFJFQ19DT00gPSAzLFxuICBOQVRfTU9OID0gNCwgLy8gYXJnIGlzIG5hdGlvblxuICBOQVRfQ09NID0gNSwgLy8gc2FtZVxuICBTVU1NT04gPSA4LCAvLyBhcmcgaXMgbGV2ZWwgcmVxdWlyZW1lbnRcbn1cblxuY29uc3QgU19ITU9OUyA9IEFycmF5LmZyb20oJzEyMzQ1JywgbiA9PiBgaG1vbiR7bn1gKTtcbmNvbnN0IFNfSENPTVMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBgaGNvbSR7bn1gKTtcbmNvbnN0IFNfUk1PTlMgPSBBcnJheS5mcm9tKCcxMicsIG4gPT4gYG1vbiR7bn1gKTtcbmNvbnN0IFNfUkNPTVMgPSBBcnJheS5mcm9tKCcxMjMnLCBuID0+IGBjb20ke259YCk7XG5jb25zdCBTX1NVTU5TID0gQXJyYXkuZnJvbSgnMTIzNCcsIG4gPT4gW2BzdW0ke259YCwgYG5fc3VtJHtufWBdKTtcblxuZnVuY3Rpb24gbWFrZVVuaXRCeVNpdGUgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHsgTWFnaWNTaXRlLCBTaXRlQnlOYXRpb24sIFVuaXQgfSA9IHRhYmxlcztcbiAgaWYgKCFTaXRlQnlOYXRpb24pIHRocm93IG5ldyBFcnJvcignZG8gc2l0ZSBieSBuYXRpb24gZmlyc3QnKTtcblxuICAvLyBiZWNhdXNlIHdlIHdvbnQgaGF2ZSB0aGUgcmVhbCBvbmUsIHVzZSBhIHRlbXAuIHN0YXJ0U2l0ZSAtPiBuYXRpb24gbWFwXG4gIC8vIHRoaXMgd29udCByZWFsbHkgd29yayBpZiBtb3JlIHRoYW4gb25lIG5hdGlvbiBzdGFydHMgd2l0aCB0aGUgc2FtZSBzaXRlXG4gIGNvbnN0IHNuTWFwID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcblxuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdVbml0LnVuaXRJZDpNYWdpY1NpdGUuc2l0ZUlkJywgLy8gVE9ETyAtIHRiaC4uLiBraW5kYSBqb2lucyBuYXRpb24gYXN3ZWxsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNpdGVJZDogMCwgdW5pdElkOiAxLCByZWNUeXBlOiAyLCByZWNBcmc6IDMgfSxcbiAgICBmaWVsZHM6IFsnc2l0ZUlkJywgJ3VuaXRJZCcsICdyZWNUeXBlJywgJ3JlY0FyZyddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NpdGVJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjVHlwZScsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3JlY0FyZycsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcblxuXG4gICAgICAvLyBUT0RPIC0gTU9BUiBTVFVGRlxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHNpdGUgb2YgTWFnaWNTaXRlLnJvd3MpIHtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU19ITU9OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IHNuTWFwLmdldChzaXRlLmlkIGFzIG51bWJlcik7XG4gICAgICBpZiAoIXJlY0FyZykgc25NYXAuc2V0KFxuICAgICAgICBzaXRlLmlkIGFzIG51bWJlcixcbiAgICAgICAgcmVjQXJnID0gU2l0ZUJ5TmF0aW9uLnJvd3MuZmluZChyID0+IHIuc2l0ZUlkID09PSBzaXRlLmlkKT8ubmF0aW9uSWQgYXMgbnVtYmVyXG4gICAgICApO1xuICAgICAgaWYgKCFyZWNBcmcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgY2FwLW9ubHkgc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSk7XG4gICAgICAgIHJlY0FyZyA9IDA7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjQXJnLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5IT01FX01PTixcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGsgb2YgU19IQ09NUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IHNuTWFwLmdldChzaXRlLmlkIGFzIG51bWJlcik7XG4gICAgICBpZiAoIXJlY0FyZykgc25NYXAuc2V0KFxuICAgICAgICBzaXRlLmlkIGFzIG51bWJlcixcbiAgICAgICAgcmVjQXJnID0gU2l0ZUJ5TmF0aW9uLnJvd3MuZmluZChyID0+IHIuc2l0ZUlkID09PSBzaXRlLmlkKT8ubmF0aW9uSWQgYXMgbnVtYmVyXG4gICAgICApO1xuICAgICAgaWYgKCFyZWNBcmcpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgY2FwLW9ubHkgc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSk7XG4gICAgICAgIHJlY0FyZyA9IDA7XG4gICAgICB9XG4gICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KG1ucik7XG4gICAgICBpZiAodW5pdCkge1xuICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgY2FwLW9ubHkgc2l0ZSAobm8gdW5pdCBpbiB1bml0IHRhYmxlPyknLCBzaXRlKTtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfQ09NLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JNT05TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGsgb2YgU19SQ09NUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldChtbnIpO1xuICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgdW5pdC50eXBlIHw9IDE7IC8vIGZsYWcgYXMgYSBjb21tYW5kZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIHNpdGUgY29tbWFuZGVyIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrLCBua10gb2YgU19TVU1OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgYXJnID0gc2l0ZVtua107XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuU1VNTU9OLFxuICAgICAgICByZWNBcmc6IGFyZywgLy8gbGV2ZWwgcmVxdWl1cmVtZW50IChjb3VsZCBhbHNvIGluY2x1ZGUgcGF0aClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChzaXRlLm5hdGlvbmFscmVjcnVpdHMpIHtcbiAgICAgIGlmIChzaXRlLm5hdG1vbikgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBzaXRlLm5hdG1vbixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX01PTixcbiAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICB9KTtcbiAgICAgIGlmIChzaXRlLm5hdGNvbSkge1xuICAgICAgICByb3dzLnB1c2goe1xuICAgICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgICB1bml0SWQ6IHNpdGUubmF0Y29tLFxuICAgICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLk5BVF9DT00sXG4gICAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHNpdGUubmF0Y29tKTtcbiAgICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIG5hdGNvbSAobm8gdW5pdCBpbiB1bml0IHRhYmxlPyknLCBzaXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyB5YXkhXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VVbml0QnlVbml0U3VtbW9uICgpIHtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHVuaXRJZDogMCwgc3VtbW9uZXJJZDogMSB9LFxuICAgIGZpZWxkczogWyd1bml0SWQnLCAnc3VtbW9uZXJJZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25lcklkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICBdXG4gIH07XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG4vLyBUT0RPIC0gZXhwb3J0IHRoZXNlIGZyb20gc29tZXdoZXJlIG1vcmUgc2Vuc2libGVcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19UWVBFIHtcbiAgRk9SVCA9IDAsIC8vIG5vcm1hbCBpIGd1ZXNzXG4gIFBSRVRFTkRFUiA9IDEsIC8vIHUgaGVhcmQgaXQgaGVyZVxuICBGT1JFSUdOID0gMixcbiAgV0FURVIgPSAzLFxuICBDT0FTVCA9IDQsXG4gIEZPUkVTVCA9IDUsXG4gIFNXQU1QID0gNixcbiAgV0FTVEUgPSA3LFxuICBNT1VOVEFJTiA9IDgsXG4gIENBVkUgPSA5LFxuICBQTEFJTlMgPSAxMCxcbiAgSEVSTyA9IDExLFxuICBNVUxUSUhFUk8gPSAxMixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gVU5JVF9UWVBFIHtcbiAgTk9ORSA9IDAsICAgICAgLy8ganVzdCBhIHVuaXQuLi5cbiAgQ09NTUFOREVSID0gMSxcbiAgUFJFVEVOREVSID0gMixcbiAgQ0FQT05MWSA9IDQsXG4gIEhFUk8gPSA4LFxufVxuXG4vLyBUT0RPIC0gbm90IHN1cmUgeWV0IGlmIEkgd2FudCB0byBkdXBsaWNhdGUgY2FwLW9ubHkgc2l0ZXMgaGVyZT9cbmZ1bmN0aW9uIG1ha2VVbml0QnlOYXRpb24gKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHtcbiAgICBBdHRyaWJ1dGVCeU5hdGlvbixcbiAgICBVbml0LFxuICAgIENvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIENvYXN0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICBGb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgUHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIFVucHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICB9ID0gdGFibGVzO1xuXG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0QnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBuYXRpb25JZDogMCwgdW5pdElkOiAxLCByZWNUeXBlOiAyIH0sXG4gICAgam9pbnM6ICdOYXRpb24ubmF0aW9uSWQ6VW5pdC51bml0SWQnLFxuICAgIGZpZWxkczogWyduYXRpb25JZCcsICd1bml0SWQnLCAncmVjVHlwZSddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ25hdGlvbklkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3JlY1R5cGUnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICAvLyBUT0RPIC0gcHJldGVuZGVyc1xuICAvLyBmb2xsb3dpbmcgdGhlIGxvZ2ljIGluIC4uLy4uLy4uLy4uL3NjcmlwdHMvRE1JL01OYXRpb24uanNcbiAgLy8gICAxLiBkZXRlcm1pbmUgbmF0aW9uIHJlYWxtKHMpIGFuZCB1c2UgdGhhdCB0byBhZGQgcHJldGVuZGVyc1xuICAvLyAgIDIuIHVzZSB0aGUgbGlzdCBvZiBcImV4dHJhXCIgYWRkZWQgcHJldGVuZGVycyB0byBhZGQgYW55IGV4dHJhXG4gIC8vICAgMy4gdXNlIHRoZSB1bnByZXRlbmRlcnMgdGFibGUgdG8gZG8gb3Bwb3NpdGVcblxuICBjb25zdCBkZWxBQk5Sb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtpQUJOICxyXSAgb2YgQXR0cmlidXRlQnlOYXRpb24ucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHJhd192YWx1ZSwgYXR0cmlidXRlLCBuYXRpb25fbnVtYmVyIH0gPSByO1xuICAgIGxldCB1bml0OiBhbnk7XG4gICAgbGV0IHVuaXRJZDogYW55ID0gbnVsbCAvLyBzbWZoXG4gICAgbGV0IHVuaXRUeXBlID0gMDtcbiAgICBsZXQgcmVjVHlwZSA9IDA7XG4gICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgIGNhc2UgMTU4OlxuICAgICAgY2FzZSAxNTk6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LmxhbmRzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ09BU1Q7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE2MDpcbiAgICAgIGNhc2UgMTYxOlxuICAgICAgY2FzZSAxNjI6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LmxhbmRzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ09BU1Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNjM6XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE4NjpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQud2F0ZXJzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FURVI7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE4NzpcbiAgICAgIGNhc2UgMTg5OlxuICAgICAgY2FzZSAxOTA6XG4gICAgICBjYXNlIDE5MTpcbiAgICAgIGNhc2UgMjEzOlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC53YXRlcnNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NDpcbiAgICAgIGNhc2UgNDEyOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5GT1JFU1Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTU6XG4gICAgICBjYXNlIDQxMzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuRk9SRVNUO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlNXQU1QO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5TV0FNUDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk4OlxuICAgICAgY2FzZSA0MDg6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLk1PVU5UQUlOO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk5OlxuICAgICAgY2FzZSA0MDk6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLk1PVU5UQUlOO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDA6XG4gICAgICBjYXNlIDQxNjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FTVEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDE6XG4gICAgICBjYXNlIDQxNzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FTVEU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ0FWRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ0FWRTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA0OlxuICAgICAgY2FzZSA0MDY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlBMQUlOUztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwNTpcbiAgICAgIGNhc2UgNDA3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5QTEFJTlM7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEzOTpcbiAgICAgIGNhc2UgMTQwOlxuICAgICAgY2FzZSAxNDE6XG4gICAgICBjYXNlIDE0MjpcbiAgICAgIGNhc2UgMTQzOlxuICAgICAgY2FzZSAxNDQ6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNDU6XG4gICAgICBjYXNlIDE0NjpcbiAgICAgIGNhc2UgMTQ5OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUiB8IFVOSVRfVFlQRS5IRVJPO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAodW5pdElkID09IG51bGwpIGNvbnRpbnVlO1xuICAgIGRlbEFCTlJvd3MucHVzaChpQUJOKTtcbiAgICB1bml0ID8/PSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ21vcmUgcGlzcyB1bml0OicsIGlBQk4sIHVuaXRJZCk7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIHVuaXRJZCxcbiAgICAgIHJlY1R5cGUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIG5hdGlvbklkOiBuYXRpb25fbnVtYmVyLFxuICAgIH0pO1xuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbEFCTlJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIC8qXG4gIGZpcnN0IHJlZmVyIHRvIHRoZSB0YWJsZXM6XG4gIC0gZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uXG4gIC0gbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uXG4gIC0gZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb25cbiAgLSBub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvblxuICAtIGNvYXN0X2xlYWRlcl90eXBlc19ieV9uYXRpb24gKGNoZWNrIGxhbmRzaGFwZSlcbiAgLSBjb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24gKGNoZWNrIGxhbmRzaGFwZSlcbiAgKi9cbiAgZm9yIChjb25zdCByIG9mIEZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkNPQVNULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG5cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIE5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG4gIC8vIHRhYmxlcyBoYXZlIGJlZW4gY29tYmluZWR+IVxuICBDb2FzdExlYWRlclR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIENvYXN0VHJvb3BUeXBlQnlOYXRpb24ucm93cy5zcGxpY2UoMCwgSW5maW5pdHkpO1xuICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIHJldHVybiBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbn1cblxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsSUFBTSxnQkFBZ0IsSUFBSSxZQUFZO0FBQ3RDLElBQU0sZ0JBQWdCLElBQUksWUFBWTtBQUkvQixTQUFTLGNBQWUsR0FBVyxNQUFtQixJQUFJLEdBQUc7QUFDbEUsTUFBSSxFQUFFLFFBQVEsSUFBSSxNQUFNLElBQUk7QUFDMUIsVUFBTUEsS0FBSSxFQUFFLFFBQVEsSUFBSTtBQUN4QixZQUFRLE1BQU0sR0FBR0EsRUFBQyxpQkFBaUIsRUFBRSxNQUFNQSxLQUFJLElBQUlBLEtBQUksRUFBRSxDQUFDLEtBQUs7QUFDL0QsVUFBTSxJQUFJLE1BQU0sVUFBVTtBQUFBLEVBQzVCO0FBQ0EsUUFBTSxRQUFRLGNBQWMsT0FBTyxJQUFJLElBQUk7QUFDM0MsTUFBSSxNQUFNO0FBQ1IsU0FBSyxJQUFJLE9BQU8sQ0FBQztBQUNqQixXQUFPLE1BQU07QUFBQSxFQUNmLE9BQU87QUFDTCxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRU8sU0FBUyxjQUFjLEdBQVcsR0FBaUM7QUFDeEUsTUFBSSxJQUFJO0FBQ1IsU0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUc7QUFBRTtBQUFBLEVBQUs7QUFDOUIsU0FBTyxDQUFDLGNBQWMsT0FBTyxFQUFFLE1BQU0sR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0RDtBQUVPLFNBQVMsY0FBZSxHQUF1QjtBQUVwRCxRQUFNLFFB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QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUE7QUFBQSxNQUdBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQSxNQUVBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxNQUNYLE1BQU0sQ0FBQyxPQUFlLFNBQXFCO0FBQ3pDLGNBQU0sVUFBVSxLQUFLLFVBQVUsVUFBVTtBQUN6QyxlQUFPO0FBQUEsVUFDTDtBQUFBLFVBQ0EsTUFBTTtBQUFBLFVBQ047QUFBQSxVQUNBLE9BQU87QUFBQSxVQUNQLFNBQVMsR0FBRyxHQUFHLEdBQUc7QUFHaEIsZ0JBQUksRUFBRSxPQUFPO0FBQUcscUJBQU87QUFBQTtBQUNsQixxQkFBTztBQUFBLFVBQ2Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsT0FBTyxDQUFDLE9BQWUsU0FBcUI7QUFDMUMsY0FBTSxVQUFVLE9BQU8sUUFBUSxLQUFLLFNBQVMsRUFDMUMsT0FBTyxPQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sV0FBVyxDQUFDLEVBQ25DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBR2xCLGVBQU87QUFBQSxVQUNMO0FBQUEsVUFDQSxNQUFNO0FBQUEsVUFDTjtBQUFBLFVBQ0EsT0FBTztBQUFBLFVBQ1AsU0FBUyxHQUFHLEdBQUcsR0FBRztBQUNoQixrQkFBTSxTQUFtQixDQUFDO0FBQzFCLHVCQUFXLEtBQUssU0FBUztBQUV2QixrQkFBSSxFQUFFLENBQUM7QUFBRyx1QkFBTyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUFBO0FBQzdCO0FBQUEsWUFDUDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFFQSxTQUFTLENBQUMsT0FBZSxTQUFxQjtBQUM1QyxjQUFNLFVBQVUsT0FBTyxRQUFRLEtBQUssU0FBUyxFQUMxQyxPQUFPLE9BQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxTQUFTLENBQUMsRUFDakMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFFbEIsZUFBTztBQUFBLFVBQ0w7QUFBQSxVQUNBLE1BQU07QUFBQSxVQUNOO0FBQUEsVUFDQSxPQUFPO0FBQUEsVUFDUCxTQUFTLEdBQUcsR0FBRyxHQUFHO0FBQ2hCLGtCQUFNLE9BQWlCLENBQUM7QUFDeEIsdUJBQVcsS0FBSyxTQUFTO0FBRXZCLGtCQUFJLEVBQUUsQ0FBQztBQUFHLHFCQUFLLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQUE7QUFDM0I7QUFBQSxZQUNQO0FBQ0EsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUVBLGdCQUFnQixDQUFDLE9BQWUsU0FBcUI7QUFFbkQsY0FBTSxVQUFVLENBQUMsR0FBRSxHQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsRUFBRTtBQUFBLFVBQUksT0FDaEMsZ0JBQWdCLE1BQU0sR0FBRyxFQUFFLElBQUksT0FBSyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFBQSxRQUNoRTtBQUNBLGdCQUFRLElBQUksRUFBRSxRQUFRLENBQUM7QUFDdkIsZUFBTztBQUFBLFVBQ0w7QUFBQSxVQUNBLE1BQU07QUFBQTtBQUFBLFVBQ047QUFBQSxVQUNBLE9BQU87QUFBQSxVQUNQLFNBQVMsR0FBRyxHQUFHLEdBQUc7QUFDaEIsa0JBQU0sS0FBZSxDQUFDO0FBQ3RCLHVCQUFXLEtBQUssU0FBUztBQUN2QixvQkFBTSxDQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksRUFBRSxJQUFJLE9BQUssRUFBRSxDQUFDLENBQUM7QUFDekMsa0JBQUksQ0FBQztBQUFNO0FBQ1gsa0JBQUksTUFBTTtBQUFJLHNCQUFNLElBQUksTUFBTSxRQUFRO0FBQ3RDLG9CQUFNLElBQUksUUFBUTtBQUNsQixvQkFBTSxJQUFJLE9BQU87QUFDakIsb0JBQU0sSUFBSSxRQUFRO0FBQ2xCLGlCQUFHLEtBQUssSUFBSSxJQUFJLENBQUM7QUFBQSxZQUNuQjtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUFBO0FBQUEsTUFFVCxXQUFXLENBQUMsTUFBTTtBQUNoQixlQUFRLE9BQU8sQ0FBQyxJQUFJLE1BQU87QUFBQSxNQUM3QjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSw0QkFBNEI7QUFBQSxJQUMxQixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxPQUFPLGVBQWUsV0FBVyxDQUFDO0FBQUEsRUFDM0Q7QUFBQSxFQUVBLGlDQUFpQztBQUFBLElBQy9CLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLGlCQUFnQixLQUFLLENBQUM7QUFBQSxFQUMvQztBQUFBLEVBQ0EsZ0NBQWdDO0FBQUEsSUFDOUIsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGtDQUFrQztBQUFBLElBQ2hDLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsNkJBQTZCO0FBQUEsSUFDM0IsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLHFDQUFxQztBQUFBLElBQ25DLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSwwQ0FBMEM7QUFBQSxJQUN4QyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSwwQ0FBMEM7QUFBQSxJQUN4QyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUE7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxvQ0FBb0M7QUFBQTtBQUFBLElBRWxDLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLG9DQUFvQztBQUFBLElBQ2xDLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLG1EQUFtRDtBQUFBLElBQ2pELE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGtEQUFrRDtBQUFBLElBQ2hELE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLG1DQUFtQztBQUFBLElBQ2pDLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSxxQ0FBcUM7QUFBQSxJQUNuQyxLQUFLO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0Esc0NBQXNDO0FBQUEsSUFDcEMsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLG1DQUFtQztBQUFBLElBQ2pDLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSw2QkFBNkI7QUFBQSxJQUMzQixLQUFLO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0Esa0RBQWtEO0FBQUEsSUFDaEQsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsaURBQWlEO0FBQUEsSUFDL0MsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0Esa0NBQWtDO0FBQUEsSUFDaEMsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0Esd0NBQXdDO0FBQUEsSUFDdEMsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsbUNBQW1DO0FBQUEsSUFDakMsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsZ0NBQWdDO0FBQUEsSUFDOUIsS0FBSztBQUFBLElBQ0wsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLDhCQUE4QjtBQUFBLElBQzVCLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxxREFBcUQ7QUFBQSxJQUNuRCxLQUFLO0FBQUE7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxvREFBb0Q7QUFBQSxJQUNsRCxLQUFLO0FBQUE7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxtQ0FBbUM7QUFBQSxJQUNqQyxLQUFLO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsZ0RBQWdEO0FBQUEsSUFDOUMsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsMkNBQTJDO0FBQUEsSUFDekMsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsNkJBQTZCO0FBQUEsSUFDM0IsS0FBSztBQUFBO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EseUNBQXlDO0FBQUEsSUFDdkMsS0FBSztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSw2Q0FBNkM7QUFBQSxJQUMzQyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsNkJBQTZCO0FBQUEsSUFDM0IsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLElBQ0wsY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLCtDQUErQztBQUFBLElBQzdDLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSxtQ0FBbUM7QUFBQSxJQUNqQyxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0Esa0RBQWtEO0FBQUEsSUFDaEQsS0FBSztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLDhCQUE4QjtBQUFBLElBQzVCLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE9BQU8sUUFBUSxDQUFDO0FBQUEsRUFDekM7QUFDRjs7O0FDdnhCQSxTQUFTLGdCQUFnQjtBQVl6QixlQUFzQixRQUNwQixNQUNBLFNBQ2dCO0FBQ2hCLE1BQUk7QUFDSixNQUFJO0FBQ0YsVUFBTSxNQUFNLFNBQVMsTUFBTSxFQUFFLFVBQVUsT0FBTyxDQUFDO0FBQUEsRUFDakQsU0FBUyxJQUFJO0FBQ1gsWUFBUSxNQUFNLDhCQUE4QixJQUFJLElBQUksRUFBRTtBQUN0RCxVQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxFQUN6QztBQUNBLE1BQUk7QUFDRixXQUFPLFdBQVcsS0FBSyxPQUFPO0FBQUEsRUFDaEMsU0FBUyxJQUFJO0FBQ1gsWUFBUSxNQUFNLCtCQUErQixJQUFJLEtBQUssRUFBRTtBQUN4RCxVQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxFQUMxQztBQUNGO0FBbUJBLElBQU0sa0JBQXNDO0FBQUEsRUFDMUMsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLEVBQ0wsY0FBYyxvQkFBSSxJQUFJO0FBQUEsRUFDdEIsV0FBVyxDQUFDO0FBQUEsRUFDWixhQUFhLENBQUM7QUFBQSxFQUNkLGFBQWEsQ0FBQztBQUFBLEVBQ2QsV0FBVztBQUFBO0FBQ2I7QUFFTyxTQUFTLFdBQ2QsS0FDQSxTQUNPO0FBQ1AsUUFBTSxRQUFRLEVBQUUsR0FBRyxpQkFBaUIsR0FBRyxRQUFRO0FBQy9DLFFBQU0sYUFBeUI7QUFBQSxJQUM3QixNQUFNLE1BQU07QUFBQSxJQUNaLEtBQUssTUFBTTtBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsU0FBUyxDQUFDO0FBQUEsSUFDVixRQUFRLENBQUM7QUFBQSxJQUNULFdBQVcsQ0FBQztBQUFBLElBQ1osV0FBVyxNQUFNO0FBQUEsRUFDbkI7QUFDQSxNQUFJLENBQUMsV0FBVztBQUFNLFVBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUN4RCxNQUFJLENBQUMsV0FBVztBQUFLLFVBQU0sSUFBSSxNQUFNLGlCQUFpQjtBQUV0RCxNQUFJLElBQUksUUFBUSxJQUFJLE1BQU07QUFBSSxVQUFNLElBQUksTUFBTSxPQUFPO0FBRXJELFFBQU0sQ0FBQyxXQUFXLEdBQUcsT0FBTyxJQUFJLElBQzdCLE1BQU0sSUFBSSxFQUNWLE9BQU8sVUFBUSxTQUFTLEVBQUUsRUFDMUIsSUFBSSxVQUFRLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUUxQyxRQUFNLFNBQVMsb0JBQUk7QUFDbkIsYUFBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFVBQVUsUUFBUSxHQUFHO0FBQ3hDLFFBQUksQ0FBQztBQUFHLFlBQU0sSUFBSSxNQUFNLEdBQUcsV0FBVyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUI7QUFDMUUsUUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHO0FBQ2pCLGNBQVEsS0FBSyxHQUFHLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QjtBQUN6RSxZQUFNLElBQUksT0FBTyxJQUFJLENBQUM7QUFDdEIsZ0JBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUMxQixPQUFPO0FBQ0wsYUFBTyxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUVBLFFBQU0sYUFBMkIsQ0FBQztBQUNsQyxhQUFXLENBQUMsT0FBTyxJQUFJLEtBQUssVUFBVSxRQUFRLEdBQUc7QUFDL0MsUUFBSSxJQUF1QjtBQUMzQixlQUFXLFVBQVUsSUFBSSxJQUFJO0FBQzdCLFFBQUksTUFBTSxjQUFjLElBQUksSUFBSTtBQUFHO0FBQ25DLFFBQUksTUFBTSxZQUFZLElBQUksR0FBRztBQUMzQixVQUFJO0FBQUEsUUFDRjtBQUFBLFFBQ0EsTUFBTSxZQUFZLElBQUk7QUFBQSxRQUN0QjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRixPQUFPO0FBQ0wsVUFBSTtBQUNGLFlBQUk7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0YsU0FBUyxJQUFJO0FBQ1gsZ0JBQVE7QUFBQSxVQUNOLHVCQUF1QixXQUFXLElBQUksYUFBYSxLQUFLLElBQUksSUFBSTtBQUFBLFVBQzlEO0FBQUEsUUFDSjtBQUNBLGNBQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUNBLFFBQUksTUFBTSxNQUFNO0FBQ2QsVUFBSSxFQUFFO0FBQXNCLG1CQUFXO0FBQ3ZDLGlCQUFXLEtBQUssQ0FBQztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUVBLE1BQUksU0FBUyxhQUFhO0FBQ3hCLFVBQU0sS0FBSyxPQUFPLE9BQU8sV0FBVyxTQUFTLEVBQUU7QUFDL0MsZUFBVztBQUFBLE1BQUssR0FBRyxPQUFPLFFBQVEsUUFBUSxXQUFXLEVBQUU7QUFBQSxRQUNyRCxDQUFDLENBQUMsTUFBTSxZQUFZLEdBQStCLE9BQWU7QUFDaEUsZ0JBQU0sV0FBVyxXQUFXLFVBQVUsSUFBSTtBQUUxQyxnQkFBTSxRQUFRLEtBQUs7QUFDbkIsZ0JBQU0sS0FBSyxhQUFhLE9BQU8sWUFBWSxNQUFNLFFBQVE7QUFDekQsY0FBSTtBQUNGLGdCQUFJLEdBQUcsVUFBVTtBQUFPLG9CQUFNLElBQUksTUFBTSw4QkFBOEI7QUFDdEUsZ0JBQUksR0FBRyxTQUFTO0FBQU0sb0JBQU0sSUFBSSxNQUFNLDZCQUE2QjtBQUNuRSxnQkFBSSxHQUFHLHVCQUFzQjtBQUMzQixrQkFBSSxHQUFHLFFBQVEsV0FBVztBQUFXLHNCQUFNLElBQUksTUFBTSxpQkFBaUI7QUFDdEUseUJBQVc7QUFBQSxZQUNiO0FBQUEsVUFDRixTQUFTLElBQUk7QUFDWCxvQkFBUSxJQUFJLElBQUksRUFBRSxPQUFPLFVBQVUsS0FBTSxDQUFDO0FBQzFDLGtCQUFNO0FBQUEsVUFDUjtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUVBLFFBQU0sT0FBYyxJQUFJLE1BQU0sUUFBUSxNQUFNLEVBQ3pDLEtBQUssSUFBSSxFQUNULElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxRQUFRLEVBQUU7QUFHcEMsYUFBVyxXQUFXLFlBQVk7QUFDaEMsVUFBTSxNQUFNLFNBQVMsT0FBTztBQUM1QixlQUFXLFFBQVEsS0FBSyxHQUFHO0FBQzNCLGVBQVcsT0FBTyxLQUFLLElBQUksSUFBSTtBQUFBLEVBQ2pDO0FBRUEsTUFBSSxXQUFXLFFBQVEsYUFBYSxDQUFDLFdBQVcsT0FBTyxTQUFTLFdBQVcsR0FBRztBQUM1RSxVQUFNLElBQUksTUFBTSx1Q0FBdUMsV0FBVyxHQUFHLEdBQUc7QUFFMUUsYUFBVyxPQUFPLFdBQVcsU0FBUztBQUNwQyxlQUFXLEtBQUs7QUFDZCxXQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLElBQUk7QUFBQSxRQUM5QixRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksS0FBSztBQUFBLFFBQzVCLFFBQVEsRUFBRSxPQUFPO0FBQUEsUUFDakI7QUFBQSxNQUNGO0FBQUEsRUFDSjtBQUVBLFNBQU8sSUFBSSxNQUFNLE1BQU0sSUFBSSxPQUFPLFVBQVUsQ0FBQztBQUMvQztBQUVBLGVBQXNCLFNBQVMsTUFBbUQ7QUFDaEYsU0FBTyxRQUFRO0FBQUEsSUFDYixPQUFPLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTSxPQUFPLENBQUM7QUFBQSxFQUN0RTtBQUNGOzs7QUN0TEEsT0FBTyxhQUFhO0FBRXBCLFNBQVMsaUJBQWlCOzs7QUNLbkIsU0FBUyxXQUFZLFdBQW9CO0FBQzlDLFFBQU0sU0FBYSxPQUFPLFlBQVksVUFBVSxJQUFJLE9BQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDckUsWUFBVTtBQUFBLElBQ1IsZ0JBQWdCLE1BQU07QUFBQSxJQUN0QixlQUFlLE1BQU07QUFBQSxJQUNyQixrQkFBa0IsTUFBTTtBQUFBLElBQ3hCLGdCQUFnQixNQUFNO0FBQUEsSUFDdEIsaUJBQWlCLE1BQU07QUFBQSxFQUN6QjtBQUVGO0FBaUVBLFNBQVMsZ0JBQWdCLFFBQW1CO0FBQzFDLFFBQU0sRUFBRSxrQkFBa0IsSUFBSTtBQUM5QixRQUFNLFVBQW9CLENBQUM7QUFDM0IsUUFBTSxTQUFTLElBQUksT0FBTztBQUFBLElBQ3hCLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFdBQVcsQ0FBQztBQUFBLElBQ1osV0FBVyxDQUFDO0FBQUEsSUFDWixPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsTUFDTjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsSUFBSSxjQUFjO0FBQUEsUUFDaEIsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELElBQUksY0FBYztBQUFBLFFBQ2hCLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxJQUFJLFdBQVc7QUFBQSxRQUNiLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsUUFDQSxLQUFLO0FBQUEsUUFDTCxNQUFNO0FBQUEsTUFDUixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0YsQ0FBQztBQUdELFFBQU0sT0FBYyxDQUFDO0FBQ3JCLFdBQVMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxrQkFBa0IsS0FBSyxRQUFRLEdBQUc7QUFDckQsVUFBTSxFQUFFLGVBQWUsVUFBVSxXQUFXLFdBQVcsT0FBTyxJQUFJO0FBQ2xFLFFBQUksU0FBa0I7QUFDdEIsWUFBUSxXQUFXO0FBQUEsTUFDakIsS0FBSztBQUNILGlCQUFTO0FBQUEsTUFFWCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQ0g7QUFBQSxNQUNGO0FBRUU7QUFBQSxJQUNKO0FBRUEsU0FBSyxLQUFLO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxTQUFTLEtBQUs7QUFBQSxJQUNoQixDQUFDO0FBQ0QsWUFBUSxLQUFLLENBQUM7QUFBQSxFQUNoQjtBQUdBLE1BQUk7QUFDSixVQUFRLEtBQUssUUFBUSxJQUFJLE9BQU87QUFDOUIsc0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUM7QUFFckMsU0FBTyxPQUFPLE9BQU8sSUFBSSxJQUFJLElBQUksTUFBTSxNQUFNLE1BQU07QUFDckQ7QUFzREEsU0FBUyxrQkFBbUIsUUFBbUI7QUFDN0MsUUFBTSxRQUFRLE9BQU87QUFDckIsUUFBTSxVQUFvQixDQUFDO0FBQzNCLFFBQU0sU0FBUyxJQUFJLE9BQU87QUFBQSxJQUN4QixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxPQUFPO0FBQUEsSUFDUCxXQUFXO0FBQUEsSUFDWCxXQUFXLENBQUM7QUFBQSxJQUNaLFdBQVcsRUFBRSxTQUFTLEdBQUcsVUFBVSxFQUFFO0FBQUEsSUFDckMsUUFBUSxDQUFDLFdBQVcsVUFBVTtBQUFBLElBQzlCLFNBQVM7QUFBQSxNQUNQLElBQUksY0FBYztBQUFBLFFBQ2hCLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxJQUFJLGNBQWM7QUFBQSxRQUNoQixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsUUFDUDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGLENBQUM7QUFFRCxNQUFJLFVBQVU7QUFDZCxRQUFNLE9BQWMsQ0FBQztBQUNyQixhQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssTUFBTSxLQUFLLFFBQVEsR0FBRztBQUN6QyxVQUFNLEVBQUUsY0FBYyxTQUFTLFdBQVcsVUFBVSxJQUFJO0FBQ3hELFFBQUksY0FBYyxLQUFLO0FBRXJCLFlBQU0sV0FBVyxPQUFPLFNBQVM7QUFDakMsVUFBSSxDQUFDLE9BQU8sY0FBYyxRQUFRLEtBQUssV0FBVyxLQUFLLFdBQVc7QUFDaEUsY0FBTSxJQUFJLE1BQU0sbUNBQW1DLFFBQVEsR0FBRztBQUNoRSxjQUFRLEtBQUssQ0FBQztBQUNkLFdBQUssS0FBSyxFQUFFLFNBQVMsU0FBUyxTQUFTLENBQUM7QUFDeEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLE1BQUk7QUFDSixVQUFRLEtBQUssUUFBUSxJQUFJLE9BQU87QUFBVyxVQUFNLEtBQUssT0FBTyxJQUFJLENBQUM7QUFDbEUsU0FBTyxPQUFPLE9BQU8sSUFBSSxJQUFJLElBQUksTUFBTSxNQUFNLE1BQU07QUFDckQ7QUFFQSxTQUFTLGdCQUFpQixRQUFtQjtBQUMzQyxRQUFNLFFBQVEsT0FBTztBQUNyQixRQUFNLFVBQW9CLENBQUM7QUFDM0IsUUFBTSxTQUFTLElBQUksT0FBTztBQUFBLElBQ3hCLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxJQUNMLE9BQU87QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLFdBQVcsQ0FBQztBQUFBLElBQ1osV0FBVyxFQUFFLFNBQVMsR0FBRyxRQUFRLEVBQUU7QUFBQSxJQUNuQyxRQUFRLENBQUMsV0FBVyxRQUFRO0FBQUEsSUFDNUIsU0FBUztBQUFBLE1BQ1AsSUFBSSxjQUFjO0FBQUEsUUFDaEIsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELElBQUksY0FBYztBQUFBLFFBQ2hCLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0YsQ0FBQztBQUVELE1BQUksVUFBVTtBQUNkLFFBQU0sT0FBYyxDQUFDO0FBR3JCLGFBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxNQUFNLEtBQUssUUFBUSxHQUFHO0FBQ3pDLFVBQU0sRUFBRSxjQUFjLFNBQVMsV0FBVyxVQUFVLElBQUk7QUFDeEQsUUFBSSxjQUFjLEtBQUs7QUFDckIsY0FBUSxJQUFJLEdBQUcsT0FBTywwQkFBMEIsU0FBUyxFQUFFO0FBQzNELFlBQU0sU0FBUyxPQUFPLFNBQVM7QUFDL0IsVUFBSSxDQUFDLE9BQU8sY0FBYyxNQUFNO0FBQzlCLGNBQU0sSUFBSSxNQUFNLGtDQUFrQyxNQUFNLEdBQUc7QUFDN0QsY0FBUSxLQUFLLENBQUM7QUFDZCxXQUFLLEtBQUssRUFBRSxTQUFTLFNBQVMsT0FBTyxDQUFDO0FBQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxNQUFJLEtBQXVCO0FBQzNCLFVBQVEsS0FBSyxRQUFRLElBQUksT0FBTztBQUFXLFVBQU0sS0FBSyxPQUFPLElBQUksQ0FBQztBQUNsRSxTQUFPLE9BQU8sT0FBTyxJQUFJLElBQUksSUFBSSxNQUFNLE1BQU0sTUFBTTtBQUNyRDtBQW9CQSxJQUFNLFVBQVUsTUFBTSxLQUFLLFNBQVMsT0FBSyxPQUFPLENBQUMsRUFBRTtBQUNuRCxJQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsT0FBSyxPQUFPLENBQUMsRUFBRTtBQUNsRCxJQUFNLFVBQVUsTUFBTSxLQUFLLE1BQU0sT0FBSyxNQUFNLENBQUMsRUFBRTtBQUMvQyxJQUFNLFVBQVUsTUFBTSxLQUFLLE9BQU8sT0FBSyxNQUFNLENBQUMsRUFBRTtBQUNoRCxJQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsT0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFFaEUsU0FBUyxlQUFnQixRQUFtQjtBQUMxQyxRQUFNLEVBQUUsV0FBVyxjQUFjLEtBQUssSUFBSTtBQUMxQyxNQUFJLENBQUM7QUFBYyxVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFJNUQsUUFBTSxRQUFRLG9CQUFJLElBQW9CO0FBRXRDLFFBQU0sU0FBUyxJQUFJLE9BQU87QUFBQSxJQUN4QixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxPQUFPO0FBQUE7QUFBQSxJQUNQLFdBQVc7QUFBQSxJQUNYLFdBQVcsQ0FBQztBQUFBLElBQ1osV0FBVyxFQUFFLFFBQVEsR0FBRyxRQUFRLEdBQUcsU0FBUyxHQUFHLFFBQVEsRUFBRTtBQUFBLElBQ3pELFFBQVEsQ0FBQyxVQUFVLFVBQVUsV0FBVyxRQUFRO0FBQUEsSUFDaEQsU0FBUztBQUFBLE1BQ1AsSUFBSSxjQUFjO0FBQUEsUUFDaEIsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELElBQUksY0FBYztBQUFBLFFBQ2hCLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxJQUFJLGNBQWM7QUFBQSxRQUNoQixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsUUFDUDtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsSUFBSSxjQUFjO0FBQUEsUUFDaEIsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQTtBQUFBLElBSUg7QUFBQSxFQUNGLENBQUM7QUFFRCxRQUFNLE9BQWMsQ0FBQztBQUVyQixhQUFXLFFBQVEsVUFBVSxNQUFNO0FBQ2pDLGVBQVcsS0FBSyxTQUFTO0FBQ3ZCLFlBQU0sTUFBTSxLQUFLLENBQUM7QUFFbEIsVUFBSSxDQUFDO0FBQUs7QUFDVixVQUFJLFNBQVMsTUFBTSxJQUFJLEtBQUssRUFBWTtBQUN4QyxVQUFJLENBQUM7QUFBUSxjQUFNO0FBQUEsVUFDakIsS0FBSztBQUFBLFVBQ0wsU0FBUyxhQUFhLEtBQUssS0FBSyxPQUFLLEVBQUUsV0FBVyxLQUFLLEVBQUUsR0FBRztBQUFBLFFBQzlEO0FBQ0EsVUFBSSxDQUFDLFFBQVE7QUFDWCxnQkFBUSxNQUFNLDBCQUEwQixHQUFHLEtBQUssSUFBSSxLQUFLLElBQUk7QUFDN0QsaUJBQVM7QUFBQSxNQUNYO0FBQ0EsV0FBSyxLQUFLO0FBQUEsUUFDUixTQUFTLEtBQUs7QUFBQSxRQUNkLFFBQVEsS0FBSztBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1I7QUFBQSxRQUNBLFNBQVM7QUFBQSxNQUNYLENBQUM7QUFBQSxJQUNIO0FBQ0EsZUFBVyxLQUFLLFNBQVM7QUFDdkIsWUFBTSxNQUFNLEtBQUssQ0FBQztBQUVsQixVQUFJLENBQUM7QUFBSztBQUNWLFVBQUksU0FBUyxNQUFNLElBQUksS0FBSyxFQUFZO0FBQ3hDLFVBQUksQ0FBQztBQUFRLGNBQU07QUFBQSxVQUNqQixLQUFLO0FBQUEsVUFDTCxTQUFTLGFBQWEsS0FBSyxLQUFLLE9BQUssRUFBRSxXQUFXLEtBQUssRUFBRSxHQUFHO0FBQUEsUUFDOUQ7QUFDQSxVQUFJLENBQUMsUUFBUTtBQUNYLGdCQUFRLE1BQU0sMEJBQTBCLEdBQUcsS0FBSyxJQUFJLEtBQUssSUFBSTtBQUM3RCxpQkFBUztBQUFBLE1BQ1g7QUFDQSxZQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksR0FBRztBQUM3QixVQUFJLE1BQU07QUFDUixhQUFLLFFBQVE7QUFBQSxNQUNmLE9BQU87QUFDTCxnQkFBUSxNQUFNLG1EQUFtRCxJQUFJO0FBQUEsTUFDdkU7QUFDQSxXQUFLLEtBQUs7QUFBQSxRQUNSLFNBQVMsS0FBSztBQUFBLFFBQ2QsUUFBUSxLQUFLO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUjtBQUFBLFFBQ0EsU0FBUztBQUFBLE1BQ1gsQ0FBQztBQUFBLElBQ0g7QUFDQSxlQUFXLEtBQUssU0FBUztBQUN2QixZQUFNLE1BQU0sS0FBSyxDQUFDO0FBQ2xCLFVBQUksQ0FBQztBQUFLO0FBQ1YsV0FBSyxLQUFLO0FBQUEsUUFDUixTQUFTLEtBQUs7QUFBQSxRQUNkLFFBQVEsS0FBSztBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsUUFBUTtBQUFBLE1BQ1YsQ0FBQztBQUFBLElBQ0g7QUFDQSxlQUFXLEtBQUssU0FBUztBQUN2QixZQUFNLE1BQU0sS0FBSyxDQUFDO0FBRWxCLFVBQUksQ0FBQztBQUFLO0FBQ1YsWUFBTSxPQUFPLEtBQUssSUFBSSxJQUFJLEdBQUc7QUFDN0IsVUFBSSxNQUFNO0FBQ1IsYUFBSyxRQUFRO0FBQUEsTUFDZixPQUFPO0FBQ0wsZ0JBQVEsTUFBTSxvREFBb0QsSUFBSTtBQUFBLE1BQ3hFO0FBQ0EsV0FBSyxLQUFLO0FBQUEsUUFDUixTQUFTLEtBQUs7QUFBQSxRQUNkLFFBQVEsS0FBSztBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsUUFBUTtBQUFBLE1BQ1YsQ0FBQztBQUFBLElBQ0g7QUFDQSxlQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssU0FBUztBQUM3QixZQUFNLE1BQU0sS0FBSyxDQUFDO0FBRWxCLFVBQUksQ0FBQztBQUFLO0FBQ1YsWUFBTSxNQUFNLEtBQUssRUFBRTtBQUNuQixXQUFLLEtBQUs7QUFBQSxRQUNSLFNBQVMsS0FBSztBQUFBLFFBQ2QsUUFBUSxLQUFLO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxRQUFRO0FBQUE7QUFBQSxNQUNWLENBQUM7QUFBQSxJQUNIO0FBRUEsUUFBSSxLQUFLLGtCQUFrQjtBQUN6QixVQUFJLEtBQUs7QUFBUSxhQUFLLEtBQUs7QUFBQSxVQUN6QixTQUFTLEtBQUs7QUFBQSxVQUNkLFFBQVEsS0FBSztBQUFBLFVBQ2IsUUFBUSxLQUFLO0FBQUEsVUFDYixTQUFTO0FBQUEsVUFDVCxRQUFRLEtBQUs7QUFBQSxRQUNmLENBQUM7QUFDRCxVQUFJLEtBQUssUUFBUTtBQUNmLGFBQUssS0FBSztBQUFBLFVBQ1IsU0FBUyxLQUFLO0FBQUEsVUFDZCxRQUFRLEtBQUs7QUFBQSxVQUNiLFFBQVEsS0FBSztBQUFBLFVBQ2IsU0FBUztBQUFBLFVBQ1QsUUFBUSxLQUFLO0FBQUEsUUFDZixDQUFDO0FBQ0QsY0FBTSxPQUFPLEtBQUssSUFBSSxJQUFJLEtBQUssTUFBTTtBQUNyQyxZQUFJLE1BQU07QUFDUixlQUFLLFFBQVE7QUFBQSxRQUNmLE9BQU87QUFDTCxrQkFBUSxNQUFNLDRDQUE0QyxJQUFJO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPLE9BQU8sT0FBTyxJQUFJLElBQUksSUFBSSxNQUFNLE1BQU0sTUFBTTtBQUNyRDtBQXVEQSxTQUFTLGlCQUFrQixRQUFtQjtBQUM1QyxRQUFNO0FBQUEsSUFDSjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsSUFBSTtBQUVKLFFBQU0sU0FBUyxJQUFJLE9BQU87QUFBQSxJQUN4QixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxXQUFXLENBQUM7QUFBQSxJQUNaLFdBQVcsRUFBRSxVQUFVLEdBQUcsUUFBUSxHQUFHLFNBQVMsRUFBRTtBQUFBLElBQ2hELE9BQU87QUFBQSxJQUNQLFFBQVEsQ0FBQyxZQUFZLFVBQVUsU0FBUztBQUFBLElBQ3hDLFNBQVM7QUFBQSxNQUNQLElBQUksY0FBYztBQUFBLFFBQ2hCLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxJQUFJLGNBQWM7QUFBQSxRQUNoQixNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsUUFDUDtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsSUFBSSxjQUFjO0FBQUEsUUFDaEIsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1A7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRixDQUFDO0FBUUQsUUFBTSxhQUF1QixDQUFDO0FBQzlCLFFBQU0sT0FBYyxDQUFDO0FBQ3JCLGFBQVcsQ0FBQyxNQUFNLENBQUMsS0FBTSxrQkFBa0IsS0FBSyxRQUFRLEdBQUc7QUFDekQsVUFBTSxFQUFFLFdBQVcsV0FBVyxjQUFjLElBQUk7QUFDaEQsUUFBSTtBQUNKLFFBQUksU0FBYztBQUNsQixRQUFJLFdBQVc7QUFDZixRQUFJLFVBQVU7QUFDZCxZQUFRLFdBQVc7QUFBQSxNQUNqQixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQ0gsZUFBTyxLQUFLLElBQUksSUFBSSxTQUFTO0FBQzdCLFlBQUksQ0FBQztBQUFNLGdCQUFNLElBQUksTUFBTSxXQUFXO0FBQ3RDLGlCQUFTLEtBQUssYUFBYSxLQUFLO0FBQ2hDLGtCQUFVO0FBQ1YsbUJBQVc7QUFDWDtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGVBQU8sS0FBSyxJQUFJLElBQUksU0FBUztBQUM3QixZQUFJLENBQUM7QUFBTSxnQkFBTSxJQUFJLE1BQU0sV0FBVztBQUN0QyxpQkFBUyxLQUFLLGFBQWEsS0FBSztBQUNoQyxrQkFBVTtBQUNWO0FBQUEsTUFDRixLQUFLO0FBQ0gsbUJBQVc7QUFDWDtBQUFBLE1BQ0YsS0FBSztBQUNILGVBQU8sS0FBSyxJQUFJLElBQUksU0FBUztBQUM3QixZQUFJLENBQUM7QUFBTSxnQkFBTSxJQUFJLE1BQU0sV0FBVztBQUN0QyxpQkFBUyxLQUFLLGNBQWMsS0FBSztBQUNqQyxrQkFBVTtBQUNWLG1CQUFXO0FBQ1g7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFDSCxlQUFPLEtBQUssSUFBSSxJQUFJLFNBQVM7QUFDN0IsWUFBSSxDQUFDO0FBQU0sZ0JBQU0sSUFBSSxNQUFNLFdBQVc7QUFDdEMsaUJBQVMsS0FBSyxjQUFjLEtBQUs7QUFDakMsa0JBQVU7QUFDVjtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGlCQUFTO0FBQ1Qsa0JBQVU7QUFDVjtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGlCQUFTO0FBQ1Qsa0JBQVU7QUFDVixtQkFBVztBQUNYO0FBQUEsTUFDRixLQUFLO0FBQ0gsaUJBQVM7QUFDVCxrQkFBVTtBQUNWO0FBQUEsTUFDRixLQUFLO0FBQ0gsaUJBQVM7QUFDVCxrQkFBVTtBQUNWLG1CQUFXO0FBQ1g7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFDSCxpQkFBUztBQUNULGtCQUFVO0FBQ1Y7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFDSCxpQkFBUztBQUNULGtCQUFVO0FBQ1YsbUJBQVc7QUFDWDtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGlCQUFTO0FBQ1Qsa0JBQVU7QUFDVjtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGlCQUFTO0FBQ1Qsa0JBQVU7QUFDVixtQkFBVztBQUNYO0FBQUEsTUFDRixLQUFLO0FBQ0gsaUJBQVM7QUFDVCxrQkFBVTtBQUNWO0FBQUEsTUFDRixLQUFLO0FBQ0gsaUJBQVM7QUFDVCxrQkFBVTtBQUNWLG1CQUFXO0FBQ1g7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFDSCxpQkFBUztBQUNULGtCQUFVO0FBQ1Y7QUFBQSxNQUNGLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFDSCxpQkFBUztBQUNULGtCQUFVO0FBQ1YsbUJBQVc7QUFDWDtBQUFBLE1BQ0YsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUNILGlCQUFTO0FBQ1QsbUJBQVcsb0JBQXNCO0FBQ2pDO0FBQUEsTUFDRixLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQ0gsaUJBQVM7QUFDVCxtQkFBVyxvQkFBc0I7QUFDakM7QUFBQSxJQUNKO0FBRUEsUUFBSSxVQUFVO0FBQU07QUFDcEIsZUFBVyxLQUFLLElBQUk7QUFDcEIsYUFBUyxLQUFLLElBQUksSUFBSSxNQUFNO0FBQzVCLFFBQUksQ0FBQztBQUFNLGNBQVEsTUFBTSxtQkFBbUIsTUFBTSxNQUFNO0FBQ3hELFNBQUssS0FBSztBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsTUFDQSxTQUFTLEtBQUs7QUFBQSxNQUNkLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQ0EsTUFBSTtBQUNKLFVBQVEsS0FBSyxXQUFXLElBQUksT0FBTztBQUNqQyxzQkFBa0IsS0FBSyxPQUFPLElBQUksQ0FBQztBQVdyQyxhQUFXLEtBQUssc0JBQXNCLE1BQU07QUFDMUMsVUFBTSxFQUFFLGdCQUFnQixRQUFRLGVBQWUsU0FBUyxJQUFJO0FBQzVELFNBQUssS0FBSztBQUFBLE1BQ1IsU0FBUyxLQUFLO0FBQUEsTUFDZDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBRUEsYUFBVyxLQUFLLHVCQUF1QixNQUFNO0FBQzNDLFVBQU0sRUFBRSxnQkFBZ0IsUUFBUSxlQUFlLFNBQVMsSUFBSTtBQUM1RCxVQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksTUFBTTtBQUNoQyxRQUFJLENBQUM7QUFBTSxjQUFRLE1BQU0sd0JBQXdCLENBQUM7QUFBQTtBQUM3QyxXQUFLLFFBQVE7QUFDbEIsU0FBSyxLQUFLO0FBQUEsTUFDUixTQUFTLEtBQUs7QUFBQSxNQUNkO0FBQUEsTUFDQTtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFDQSxhQUFXLEtBQUssdUJBQXVCLE1BQU07QUFDM0MsVUFBTSxFQUFFLGdCQUFnQixRQUFRLGVBQWUsU0FBUyxJQUFJO0FBQzVELFNBQUssS0FBSztBQUFBLE1BQ1IsU0FBUyxLQUFLO0FBQUEsTUFDZDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBRUEsYUFBVyxLQUFLLHdCQUF3QixNQUFNO0FBQzVDLFVBQU0sRUFBRSxnQkFBZ0IsUUFBUSxlQUFlLFNBQVMsSUFBSTtBQUM1RCxVQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksTUFBTTtBQUNoQyxRQUFJLENBQUM7QUFBTSxjQUFRLE1BQU0sd0JBQXdCLENBQUM7QUFBQTtBQUM3QyxXQUFLLFFBQVE7QUFDbEIsU0FBSyxLQUFLO0FBQUEsTUFDUixTQUFTLEtBQUs7QUFBQSxNQUNkO0FBQUEsTUFDQTtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFJQSxhQUFXLEtBQUsseUJBQXlCLE1BQU07QUFDN0MsVUFBTSxFQUFFLGdCQUFnQixRQUFRLGVBQWUsU0FBUyxJQUFJO0FBQzVELFNBQUssS0FBSztBQUFBLE1BQ1IsU0FBUyxLQUFLO0FBQUEsTUFDZDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNIO0FBRUEsYUFBVyxLQUFLLDBCQUEwQixNQUFNO0FBQzlDLFVBQU0sRUFBRSxnQkFBZ0IsUUFBUSxlQUFlLFNBQVMsSUFBSTtBQUM1RCxVQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksTUFBTTtBQUNoQyxRQUFJLENBQUM7QUFBTSxjQUFRLE1BQU0sd0JBQXdCLENBQUM7QUFBQTtBQUM3QyxXQUFLLFFBQVE7QUFDbEIsU0FBSyxLQUFLO0FBQUEsTUFDUixTQUFTLEtBQUs7QUFBQSxNQUNkO0FBQUEsTUFDQTtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLEVBQ0g7QUFFQSwwQkFBd0IsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUMvQyx5QkFBdUIsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUM5Qyx5QkFBdUIsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUM5Qyx3QkFBc0IsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUM3Qyw0QkFBMEIsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUNqRCwyQkFBeUIsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUNoRCxTQUFPLElBQUksTUFBTSxNQUFNLE1BQU07QUFDL0I7OztBRHJ5QkEsSUFBTSxRQUFRLFFBQVEsT0FBTztBQUM3QixJQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxRQUFRLEtBQUssTUFBTSxDQUFDO0FBRTlDLFNBQVMsUUFBUyxNQUFxRDtBQUNyRSxNQUFJLFFBQVEsSUFBSTtBQUFHLFdBQU8sQ0FBQyxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBQzlDLGFBQVcsS0FBSyxTQUFTO0FBQ3ZCLFVBQU0sSUFBSSxRQUFRLENBQUM7QUFDbkIsUUFBSSxFQUFFLFNBQVM7QUFBTSxhQUFPLENBQUMsR0FBRyxDQUFDO0FBQUEsRUFDbkM7QUFDQSxRQUFNLElBQUksTUFBTSx1QkFBdUIsSUFBSSxHQUFHO0FBQ2hEO0FBRUEsZUFBZSxRQUFRLEtBQWE7QUFDbEMsUUFBTSxRQUFRLE1BQU0sUUFBUSxHQUFHLFFBQVEsR0FBRyxDQUFDO0FBQzNDLGVBQWEsS0FBSztBQUNwQjtBQUVBLGVBQWUsVUFBVztBQUN4QixRQUFNLFNBQVMsTUFBTSxTQUFTLE9BQU87QUFFckMsYUFBVyxNQUFNO0FBQ2pCLFFBQU0sT0FBTztBQUNiLFFBQU0sT0FBTyxNQUFNLGFBQWEsTUFBTTtBQUN0QyxRQUFNLFVBQVUsTUFBTSxLQUFLLE9BQU8sR0FBRyxFQUFFLFVBQVUsS0FBSyxDQUFDO0FBQ3ZELFVBQVEsSUFBSSxTQUFTLEtBQUssSUFBSSxhQUFhLElBQUksRUFBRTtBQUNuRDtBQUVBLGVBQWUsYUFBYSxHQUFVO0FBQ3BDLFFBQU0sT0FBTyxFQUFFLEtBQUssU0FBUztBQUM3QixNQUFJO0FBQ0osTUFBSSxJQUFTO0FBQ2IsTUFBSSxPQUFPLENBQUMsTUFBTSxVQUFVO0FBQzFCLFFBQUk7QUFDSixXQUFPLE9BQU8sR0FBRyxHQUFHLE1BQU0sTUFBTTtBQUNoQyxRQUFJLENBQUMsTUFBVyxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQUMsT0FBSyxFQUFFQSxFQUFDLENBQUM7QUFBQSxFQUNoRCxXQUFXLE9BQU8sQ0FBQyxNQUFNLFNBQVMsT0FBTyxDQUFDLEdBQUc7QUFDM0MsUUFBSSxPQUFPLE9BQU8sQ0FBQyxDQUFDLElBQUk7QUFDeEIsV0FBTyxPQUFPLEdBQUcsQ0FBQztBQUNsQixZQUFRLElBQUksY0FBYyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHO0FBQ3ZELFFBQUksT0FBTyxNQUFNLENBQUM7QUFBRyxZQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxFQUMvRCxPQUFPO0FBQ0wsUUFBSSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ3JDO0FBQ0EsTUFBSSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7QUFDakMsUUFBTSxJQUFJLElBQUk7QUFDZCxRQUFNLElBQUssT0FBTyxTQUFVLE9BQU8sQ0FBQyxNQUFNLFFBQVEsRUFBRSxPQUFPLFNBQVMsU0FDbkUsRUFBRSxPQUFPLE9BQU8sTUFBTSxHQUFHLEVBQUU7QUFDNUIsZ0JBQWMsR0FBRyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7QUFhdkM7QUFFQSxTQUFTLGNBQ1AsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0E7QUFDQSxVQUFRLElBQUk7QUFBQSxPQUFVLENBQUMsR0FBRztBQUMxQixJQUFFLE9BQU8sTUFBTSxLQUFLO0FBQ3BCLFVBQVEsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDckMsUUFBTSxPQUFPLEVBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdEMsTUFBSTtBQUFNLGVBQVcsS0FBSztBQUFNLGNBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNqRCxVQUFRLElBQUksUUFBUSxDQUFDO0FBQUE7QUFBQSxDQUFNO0FBQzdCO0FBSUEsUUFBUSxJQUFJLFFBQVEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVwQyxJQUFJO0FBQU0sVUFBUSxJQUFJO0FBQUE7QUFDakIsVUFBUTsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJiIiwgImZpZWxkcyIsICJ3aWR0aCIsICJ3aWR0aCIsICJmaWVsZHMiLCAiZiJdCn0K
