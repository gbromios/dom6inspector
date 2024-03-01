// ../lib/src/join.ts
var JOIN_PART = /^\s*(\w+)\s*\[\s*(\w+)\s*\]\s*$/;
function stringToJoin(s, table, tableMap) {
  const parts = s.split("+");
  if (parts.length < 2)
    throw new Error(`bad join "${s}": not enough joins`);
  const joins = [];
  for (const p of parts) {
    const [_, tableName, columnName] = p.match(JOIN_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE[COL]"`);
    joins.push([tableName, columnName]);
  }
  if (tableMap)
    for (const j of joins)
      validateJoin(j, table, tableMap);
  return joins;
}
function validateJoin(join, table, tableMap) {
  const [tableName, columnName] = join;
  const s = `${tableName}[${columnName}]`;
  const col = table.schema.columnsByName[columnName];
  if (!col)
    throw new Error(`bad join "${s}": "${table.name}" has no "${columnName}"`);
  const jTable = tableMap[tableName];
  if (!jTable)
    throw new Error(`bad join "${s}": "${tableName}" does not exist`);
  const jCol = jTable.schema.columnsByName[jTable.schema.key];
  if (!jCol)
    throw new Error(`bad join "${s}": "${tableName}" has no key????`);
  if (jCol.type !== col.type)
    console.warn(
      `bad join "${s}": "${columnName}" (${col.label}) is a different type than ${tableName}.${jCol.name} (${jCol.label})`
    );
}
function joinToString(joins) {
  return joins.map(([t, c]) => `${t}[${c}]`).join(" + ");
}
var JOINED_PART = /^(\w+)\.(\w+)$/;
function stringToJoinedBy(s) {
  const parts = s.split(",");
  if (parts.length < 1)
    throw new Error(`bad joinedBy doesnt exist?`);
  const joinedBy = [];
  for (const p of parts) {
    const [_, tableName, columnName] = p.match(JOINED_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE.COL"`);
    joinedBy.push([tableName, columnName]);
  }
  return joinedBy;
}
function joinedByToString(joins) {
  return joins.map(([t, c]) => `${t}.${c}`).join(",");
}

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
  joinedBy = [];
  key;
  columnsByName;
  fixedWidth;
  // total bytes used by numbers + flags
  flagFields;
  stringFields;
  bigFields;
  constructor({ columns, name, flagsUsed, key, joins, joinedBy }) {
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
    if (joins)
      this.joins = stringToJoin(joins);
    if (joinedBy)
      this.joinedBy.push(...stringToJoinedBy(joinedBy));
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
    let joinedBy;
    const bytes = new Uint8Array(buffer);
    [name, read] = bytesToString(i, bytes);
    i += read;
    [key, read] = bytesToString(i, bytes);
    i += read;
    [joins, read] = bytesToString(i, bytes);
    i += read;
    [joinedBy, read] = bytesToString(i, bytes);
    i += read;
    console.log("- BUH", name, key, joins, joinedBy);
    if (!joins)
      joins = void 0;
    if (!joinedBy)
      joinedBy = void 0;
    const args = {
      name,
      key,
      joins,
      joinedBy,
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
    let j = new Uint8Array(1);
    let jb = new Uint8Array(1);
    if (this.joins)
      j = stringToBytes(joinToString(this.joins));
    if (this.joinedBy)
      jb = stringToBytes(joinedByToString(this.joinedBy));
    return [...j, ...jb];
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
  static applyLateJoins(jt, tables, addData) {
    const joins = jt.schema.joins;
    if (!joins)
      throw new Error("shit ass iditot whomst");
    for (const j of joins) {
      validateJoin(j, jt, tables);
      const [tn, cn] = j;
      const t = tables[tn];
      const jb = t.schema.joinedBy;
      if (jb.some(([jbtn]) => jbtn === tn))
        throw new Error(`${tn} already joined ${j}`);
      jb.push([jt.schema.name, cn]);
    }
    if (addData) {
      for (const r of jt.rows) {
        for (const [tn, cn] of jt.schema.joins) {
          const jr = tables[tn].map.get(r[cn]);
          if (!jr) {
            console.warn(`MISSED A JOIN ${tn}[${cn}]: NOTHING THERE`, r);
            continue;
          }
          if (jr[jt.name])
            jr[jt.name].push(r);
          else
            jr[jt.name] = [r];
        }
      }
    }
    return jt;
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
    const tableMap = Object.fromEntries(tables.map((t) => [t.schema.name, t]));
    for (const t of tables) {
      if (!t.schema.joins)
        continue;
      for (const [aT, aF] of t.schema.joins) {
        const tA = tableMap[aT];
        if (!tA)
          throw new Error(`${t.name} joins undefined table ${aT}`);
        if (!t.rows.length)
          continue;
        for (const r of t.rows) {
          const idA = r[aF];
          if (idA === void 0) {
            console.error(`row has a bad id?`, r);
            continue;
          }
          const a = tA.map.get(idA);
          if (a === void 0) {
            console.error(`row has a missing id?`, a, idA, r);
            continue;
          }
          (a[t.name] ??= []).push(r);
        }
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
    joins: "Nation[nationId]+MagicSite[siteId]",
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
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true
  );
}
function makeSpellByNation(tables) {
  const attrs = tables.AttributeBySpell;
  const delRows = [];
  const schema = new Schema({
    name: "SpellByNation",
    key: "__rowId",
    joins: "Spell[spellId]+Nation[nationId]",
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
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}
function makeSpellByUnit(tables) {
  const attrs = tables.AttributeBySpell;
  const delRows = [];
  const schema = new Schema({
    name: "SpellByUnit",
    key: "__rowId",
    joins: "Spell[spellId]+Unit[unitId]",
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
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}
var S_HMONS = Array.from("12345", (n) => `hmon${n}`);
var S_HCOMS = Array.from("1234", (n) => `hcom${n}`);
var S_RMONS = Array.from("12", (n) => `mon${n}`);
var S_RCOMS = Array.from("123", (n) => `com${n}`);
var S_SUMNS = Array.from("1234", (n) => [`sum${n}`, `n_sum${n}`]);
function makeUnitBySite(tables) {
  const { MagicSite, SiteByNation, Unit } = tables;
  if (!SiteByNation)
    throw new Error("do SiteByNation first");
  const schema = new Schema({
    name: "UnitBySite",
    key: "__rowId",
    joins: "MagicSite[siteId]+Unit[unitId]",
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
    ]
  });
  const rows = [];
  for (const site of MagicSite.rows) {
    for (const k of S_HMONS) {
      const mnr = site[k];
      if (!mnr)
        break;
      let recArg = 0;
      const nj = site.SiteByNation?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          "mixed up cap-only mon site",
          k,
          site.id,
          site.name,
          site.SiteByNation
        );
        recArg = 0;
      } else {
        recArg = nj.nationId;
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
      let recArg = 0;
      const nj = site.SiteByNation?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          "mixed up cap-only site",
          k,
          site.id,
          site.name,
          site.SiteByNation
        );
        recArg = 0;
      } else {
        recArg = nj.nationId;
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
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
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
    joins: "Nation[nationId]+Unit[unitId]",
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
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9qb2luLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2VyaWFsaXplLnRzIiwgIi4uLy4uL2xpYi9zcmMvY29sdW1uLnRzIiwgIi4uLy4uL2xpYi9zcmMvdXRpbC50cyIsICIuLi8uLi9saWIvc3JjL3NjaGVtYS50cyIsICIuLi8uLi9saWIvc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9jbGkvY3N2LWRlZnMudHMiLCAiLi4vc3JjL2NsaS9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL2NsaS9kdW1wLWNzdnMudHMiLCAiLi4vc3JjL2NsaS9qb2luLXRhYmxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuXG5jb25zdCBKT0lOX1BBUlQgPSAvXlxccyooXFx3KylcXHMqXFxbXFxzKihcXHcrKVxccypcXF1cXHMqJC9cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbiAoXG4gIHM6IHN0cmluZyxcbiAgdGFibGU/OiBUYWJsZSxcbiAgdGFibGVNYXA/OiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT5cbik6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnKycpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogbm90IGVub3VnaCBqb2luc2ApO1xuICBjb25zdCBqb2luczogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIGZvciAoY29uc3QgcCBvZiBwYXJ0cykge1xuICAgIGNvbnN0IFtfLCB0YWJsZU5hbWUsIGNvbHVtbk5hbWVdID0gcC5tYXRjaChKT0lOX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRVtDT0xdXCJgKTtcblxuICAgIGpvaW5zLnB1c2goW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0pO1xuICB9XG4gIGlmICh0YWJsZU1hcCkgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB2YWxpZGF0ZUpvaW4oaiwgdGFibGUhLCB0YWJsZU1hcCk7XG4gIHJldHVybiBqb2lucztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVKb2luIChcbiAgam9pbjogW3N0cmluZywgc3RyaW5nXSxcbiAgdGFibGU6IFRhYmxlLFxuICB0YWJsZU1hcDogUmVjb3JkPHN0cmluZywgVGFibGU+XG4pIHtcbiAgY29uc3QgW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0gPSBqb2luO1xuICBjb25zdCBzID0gYCR7dGFibGVOYW1lfVske2NvbHVtbk5hbWV9XWBcbiAgY29uc3QgY29sID0gdGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbY29sdW1uTmFtZV07XG4gIGlmICghY29sKVxuICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gXCIke3N9XCI6IFwiJHt0YWJsZS5uYW1lfVwiIGhhcyBubyBcIiR7Y29sdW1uTmFtZX1cImApO1xuICBjb25zdCBqVGFibGUgPSB0YWJsZU1hcFt0YWJsZU5hbWVdO1xuICBpZiAoIWpUYWJsZSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7dGFibGVOYW1lfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gIGNvbnN0IGpDb2wgPSBqVGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbalRhYmxlLnNjaGVtYS5rZXldO1xuICBpZiAoIWpDb2wpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3RhYmxlTmFtZX1cIiBoYXMgbm8ga2V5Pz8/P2ApO1xuICBpZiAoakNvbC50eXBlICE9PSBjb2wudHlwZSlcbiAgICAvL3Rocm93IG5ldyBFcnJvcigpXG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYGJhZCBqb2luIFwiJHtcbiAgICAgICAgc1xuICAgICAgfVwiOiBcIiR7XG4gICAgICAgIGNvbHVtbk5hbWVcbiAgICAgIH1cIiAoJHtcbiAgICAgICAgY29sLmxhYmVsXG4gICAgICB9KSBpcyBhIGRpZmZlcmVudCB0eXBlIHRoYW4gJHtcbiAgICAgICAgdGFibGVOYW1lXG4gICAgICB9LiR7XG4gICAgICAgIGpDb2wubmFtZVxuICAgICAgfSAoJHtcbiAgICAgICAgakNvbC5sYWJlbFxuICAgICAgfSlgXG4gICAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5Ub1N0cmluZyAoam9pbnM6IFtzdHJpbmcsIHN0cmluZ11bXSkge1xuICByZXR1cm4gam9pbnMubWFwKChbdCwgY10pID0+IGAke3R9WyR7Y31dYCkuam9pbignICsgJylcbn1cblxuY29uc3QgSk9JTkVEX1BBUlQgPSAvXihcXHcrKVxcLihcXHcrKSQvO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9Kb2luZWRCeSAoXG4gIHM6IHN0cmluZyxcbik6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnLCcpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMSkgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbmVkQnkgZG9lc250IGV4aXN0P2ApO1xuICBjb25zdCBqb2luZWRCeTogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIGZvciAoY29uc3QgcCBvZiBwYXJ0cykge1xuICAgIGNvbnN0IFtfLCB0YWJsZU5hbWUsIGNvbHVtbk5hbWVdID0gcC5tYXRjaChKT0lORURfUEFSVCkgPz8gW107XG4gICAgaWYgKCF0YWJsZU5hbWUgfHwgIWNvbHVtbk5hbWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7cH1cIiBkb2VzIG5vdCBtYXRjaCBcIlRBQkxFLkNPTFwiYCk7XG5cbiAgICBqb2luZWRCeS5wdXNoKFt0YWJsZU5hbWUsIGNvbHVtbk5hbWVdKTtcbiAgfVxuICByZXR1cm4gam9pbmVkQnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luZWRCeVRvU3RyaW5nIChqb2luczogW3N0cmluZywgc3RyaW5nXVtdKSB7XG4gIHJldHVybiBqb2lucy5tYXAoKFt0LCBjXSkgPT4gYCR7dH0uJHtjfWApLmpvaW4oJywnKVxufVxuIiwgImNvbnN0IF9fdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IF9fdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXk7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0OiBVaW50OEFycmF5LCBpOiBudW1iZXIpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0PzogVWludDhBcnJheSwgaSA9IDApIHtcbiAgaWYgKHMuaW5kZXhPZignXFwwJykgIT09IC0xKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZignXFwwJyk7XG4gICAgY29uc29sZS5lcnJvcihgJHtpfSA9IE5VTEwgPyBcIi4uLiR7cy5zbGljZShpIC0gMTAsIGkgKyAxMCl9Li4uYCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd3aG9vcHNpZScpO1xuICB9XG4gIGNvbnN0IGJ5dGVzID0gX190ZXh0RW5jb2Rlci5lbmNvZGUocyArICdcXDAnKTtcbiAgaWYgKGRlc3QpIHtcbiAgICBkZXN0LnNldChieXRlcywgaSk7XG4gICAgcmV0dXJuIGJ5dGVzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoaTogbnVtYmVyLCBhOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gIGxldCByID0gMDtcbiAgd2hpbGUgKGFbaSArIHJdICE9PSAwKSB7IHIrKzsgfVxuICByZXR1cm4gW19fdGV4dERlY29kZXIuZGVjb2RlKGEuc2xpY2UoaSwgaStyKSksIHIgKyAxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpZ0JveVRvQnl0ZXMgKG46IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAvLyB0aGlzIGlzIGEgY29vbCBnYW1lIGJ1dCBsZXRzIGhvcGUgaXQgZG9lc24ndCB1c2UgMTI3KyBieXRlIG51bWJlcnNcbiAgY29uc3QgYnl0ZXMgPSBbMF07XG4gIGlmIChuIDwgMG4pIHtcbiAgICBuICo9IC0xbjtcbiAgICBieXRlc1swXSA9IDEyODtcbiAgfVxuXG4gIC8vIFdPT1BTSUVcbiAgd2hpbGUgKG4pIHtcbiAgICBpZiAoYnl0ZXNbMF0gPT09IDI1NSkgdGhyb3cgbmV3IEVycm9yKCdicnVoIHRoYXRzIHRvbyBiaWcnKTtcbiAgICBieXRlc1swXSsrO1xuICAgIGJ5dGVzLnB1c2goTnVtYmVyKG4gJiAyNTVuKSk7XG4gICAgbiA+Pj0gOG47XG4gIH1cblxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0JpZ0JveSAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICBjb25zdCBMID0gTnVtYmVyKGJ5dGVzW2ldKTtcbiAgY29uc3QgbGVuID0gTCAmIDEyNztcbiAgY29uc3QgcmVhZCA9IDEgKyBsZW47XG4gIGNvbnN0IG5lZyA9IChMICYgMTI4KSA/IC0xbiA6IDFuO1xuICBjb25zdCBCQjogYmlnaW50W10gPSBBcnJheS5mcm9tKGJ5dGVzLnNsaWNlKGkgKyAxLCBpICsgcmVhZCksIEJpZ0ludCk7XG4gIGlmIChsZW4gIT09IEJCLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdiaWdpbnQgY2hlY2tzdW0gaXMgRlVDSz8nKTtcbiAgcmV0dXJuIFtsZW4gPyBCQi5yZWR1Y2UoYnl0ZVRvQmlnYm9pKSAqIG5lZyA6IDBuLCByZWFkXVxufVxuXG5mdW5jdGlvbiBieXRlVG9CaWdib2kgKG46IGJpZ2ludCwgYjogYmlnaW50LCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIG4gfCAoYiA8PCBCaWdJbnQoaSAqIDgpKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MgfSBmcm9tICcuJztcbmltcG9ydCB7IGJpZ0JveVRvQnl0ZXMsIGJ5dGVzVG9CaWdCb3ksIGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5cbmV4cG9ydCB0eXBlIENvbHVtbkFyZ3MgPSB7XG4gIHR5cGU6IENPTFVNTjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICB3aWR0aD86IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgZmxhZz86IG51bWJlcnxudWxsO1xuICBiaXQ/OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEICAgICAgID0gMCxcbiAgU1RSSU5HICAgICAgID0gMSxcbiAgQk9PTCAgICAgICAgID0gMixcbiAgVTggICAgICAgICAgID0gMyxcbiAgSTggICAgICAgICAgID0gNCxcbiAgVTE2ICAgICAgICAgID0gNSxcbiAgSTE2ICAgICAgICAgID0gNixcbiAgVTMyICAgICAgICAgID0gNyxcbiAgSTMyICAgICAgICAgID0gOCxcbiAgQklHICAgICAgICAgID0gOSxcbiAgU1RSSU5HX0FSUkFZID0gMTcsXG4gIFU4X0FSUkFZICAgICA9IDE5LFxuICBJOF9BUlJBWSAgICAgPSAyMCxcbiAgVTE2X0FSUkFZICAgID0gMjEsXG4gIEkxNl9BUlJBWSAgICA9IDIyLFxuICBVMzJfQVJSQVkgICAgPSAyMyxcbiAgSTMyX0FSUkFZICAgID0gMjQsXG4gIEJJR19BUlJBWSAgICA9IDI1LFxufTtcblxuZXhwb3J0IGNvbnN0IENPTFVNTl9MQUJFTCA9IFtcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkcnLFxuICAnQk9PTCcsXG4gICdVOCcsXG4gICdJOCcsXG4gICdVMTYnLFxuICAnSTE2JyxcbiAgJ1UzMicsXG4gICdJMzInLFxuICAnQklHJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkdfQVJSQVknLFxuICAnVThfQVJSQVknLFxuICAnSThfQVJSQVknLFxuICAnVTE2X0FSUkFZJyxcbiAgJ0kxNl9BUlJBWScsXG4gICdVMzJfQVJSQVknLFxuICAnSTMyX0FSUkFZJyxcbiAgJ0JJR19BUlJBWScsXG5dO1xuXG5leHBvcnQgdHlwZSBOVU1FUklDX0NPTFVNTiA9XG4gIHxDT0xVTU4uVThcbiAgfENPTFVNTi5JOFxuICB8Q09MVU1OLlUxNlxuICB8Q09MVU1OLkkxNlxuICB8Q09MVU1OLlUzMlxuICB8Q09MVU1OLkkzMlxuICB8Q09MVU1OLlU4X0FSUkFZXG4gIHxDT0xVTU4uSThfQVJSQVlcbiAgfENPTFVNTi5VMTZfQVJSQVlcbiAgfENPTFVNTi5JMTZfQVJSQVlcbiAgfENPTFVNTi5VMzJfQVJSQVlcbiAgfENPTFVNTi5JMzJfQVJSQVlcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbiAgW0NPTFVNTi5VOF9BUlJBWV06IDEsXG4gIFtDT0xVTU4uSThfQVJSQVldOiAxLFxuICBbQ09MVU1OLlUxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uSTE2X0FSUkFZXTogMixcbiAgW0NPTFVNTi5VMzJfQVJSQVldOiA0LFxuICBbQ09MVU1OLkkzMl9BUlJBWV06IDQsXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCaWdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5CSUc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jvb2xDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJPT0wge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJPT0w7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZ0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uU1RSSU5HIHwgQ09MVU1OLlNUUklOR19BUlJBWSB7XG4gIHJldHVybiAodHlwZSAmIDE1KSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uPFQgPSBhbnksIFIgZXh0ZW5kcyBVaW50OEFycmF5fG51bWJlciA9IGFueT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IFRbXTtcbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUO1xuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtUW10sIG51bWJlcl07XG4gIGZyb21CeXRlcyAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVCwgbnVtYmVyXTtcbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXTtcbiAgc2VyaWFsaXplUm93ICh2OiBUKTogUixcbiAgc2VyaWFsaXplQXJyYXkgKHY6IFRbXSk6IFIsXG4gIHRvU3RyaW5nICh2OiBzdHJpbmcpOiBhbnk7XG4gIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBiaXQ6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xuICByZWFkb25seSBvZmZzZXQ6IG51bWJlcnxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxzdHJpbmcsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVk7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLlNUUklOR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAzO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IGluZGV4LCBuYW1lLCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc1N0cmluZ0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignJHtuYW1lfSBpcyBub3QgYSBzdHJpbmcgY29sdW1uJyk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCdmb28nKSAhPT0gJ3N0cmluZycpXG4gICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKGBzZWVtcyBvdmVycmlkZSBmb3IgJHtuYW1lfSBkb2VzIG5vdCByZXR1cm4gYSBzdHJpbmdgKTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICAvLyBUT0RPIC0gYXJyYXkgc2VwYXJhdG9yIGFyZyFcbiAgICByZXR1cm4gdi5zcGxpdCgnLCcpLm1hcChpID0+IHRoaXMuZnJvbVRleHQoaS50cmltKCksIHUsIGEpKTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nIHtcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZ1tdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3Qgc3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBzdHJpbmdzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbc3RyaW5ncywgcmVhZF1cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogc3RyaW5nKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHN0cmluZ1RvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBzdHJpbmdbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5zdHJpbmdUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoaXRlbXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxudW1iZXIsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogTlVNRVJJQ19DT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IDF8Mnw0O1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAwO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc051bWVyaWNDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaXMgbm90IGEgbnVtZXJpYyBjb2x1bW5gKTtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ251bWJlcicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcihgJHtuYW1lfSBvdmVycmlkZSBtdXN0IHJldHVybiBhIG51bWJlcmApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5pc0FycmF5ID0gKHRoaXMudHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICAgIHRoaXMud2lkdGggPSBDT0xVTU5fV0lEVEhbdGhpcy50eXBlXTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbnVtYmVyW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlciB7XG4gICAgIHJldHVybiB0aGlzLm92ZXJyaWRlID8gKCB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpICkgOlxuICAgICAgdiA/IE51bWJlcih2KSB8fCAwIDogMDtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlcltdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgbnVtYmVyczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICAgICAgbnVtYmVycy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW251bWJlcnMsIHJlYWRdO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgXzogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICAgIGlmICh0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaW0gYXJyYXkgdGhvJylcbiAgICAgIHJldHVybiB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBudW1iZXJGcm9tVmlldyAoaTogbnVtYmVyLCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHN3aXRjaCAodGhpcy50eXBlICYgMTUpIHtcbiAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3aG9tc3QnKTtcbiAgICB9XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHRoaXMud2lkdGgpO1xuICAgIHRoaXMucHV0Qnl0ZXModiwgMCwgYnl0ZXMpO1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KHY6IG51bWJlcltdKTogVWludDhBcnJheSB7XG4gICAgaWYgKHYubGVuZ3RoID4gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ3RvbyBiaWchJyk7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSgxICsgdGhpcy53aWR0aCAqIHYubGVuZ3RoKVxuICAgIGxldCBpID0gMTtcbiAgICBmb3IgKGNvbnN0IG4gb2Ygdikge1xuICAgICAgYnl0ZXNbMF0rKztcbiAgICAgIHRoaXMucHV0Qnl0ZXMobiwgaSwgYnl0ZXMpO1xuICAgICAgaSs9dGhpcy53aWR0aDtcbiAgICB9XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgcHJpdmF0ZSBwdXRCeXRlcyh2OiBudW1iZXIsIGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBmb3IgKGxldCBvID0gMDsgbyA8IHRoaXMud2lkdGg7IG8rKylcbiAgICAgIGJ5dGVzW2kgKyBvXSA9ICh2ID4+PiAobyAqIDgpKSAmIDI1NTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCaWdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJpZ2ludCwgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQklHIHwgQ09MVU1OLkJJR19BUlJBWVxuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMjtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNCaWdDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZVxuICAgIHRoaXMuaXNBcnJheSA9ICh0eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG5cbiAgICB0aGlzLmxhYmVsID0gQ09MVU1OX0xBQkVMW3RoaXMudHlwZV07XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYmlnaW50W10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdikgcmV0dXJuIDBuO1xuICAgIHJldHVybiBCaWdJbnQodik7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludFtdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgYmlnYm9pczogYmlnaW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBiaWdib2lzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbYmlnYm9pcywgcmVhZF07XG5cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9CaWdCb3koaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYmlnaW50KTogVWludDhBcnJheSB7XG4gICAgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgcmV0dXJuIGJpZ0JveVRvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBiaWdpbnRbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5iaWdCb3lUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcyBCSUc/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCb29sQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxib29sZWFuLCBudW1iZXI+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJPT0wgPSBDT0xVTU4uQk9PTDtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uQk9PTF07XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyO1xuICByZWFkb25seSBvcmRlciA9IDE7XG4gIHJlYWRvbmx5IG9mZnNldCA9IDA7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgYml0LCBmbGFnLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdib29sZWFuJylcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJvb2wnKTtcbiAgICBpZiAoIWlzQm9vbENvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBib29sYCk7XG4gICAgaWYgKHR5cGVvZiBmbGFnICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBmbGFnIGlzIG5vdCBudW1iZXJgKTtcbiAgICBpZiAodHlwZW9mIGJpdCAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgYml0IGlzIG5vdCBudW1iZXJgKTtcbiAgICB0aGlzLmZsYWcgPSBmbGFnO1xuICAgIHRoaXMuYml0ID0gYml0O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBuZXZlcltdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKCF2IHx8IHYgPT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoX2k6IG51bWJlciwgX2J5dGVzOiBVaW50OEFycmF5KTogW25ldmVyW10sIG51bWJlcl0ge1xuICAgIHRocm93IG5ldyBFcnJvcignSSBORVZFUiBBUlJBWScpIC8vIHlldH4/XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtib29sZWFuLCBudW1iZXJdIHtcbiAgICAvLyAuLi4uaXQgZGlkIG5vdC5cbiAgICAvL2NvbnNvbGUubG9nKGBSRUFEIEZST00gJHtpfTogRE9FUyAke2J5dGVzW2ldfSA9PT0gJHt0aGlzLmZsYWd9YCk7XG4gICAgcmV0dXJuIFsoYnl0ZXNbaV0gJiB0aGlzLmZsYWcpID09PSB0aGlzLmZsYWcsIDBdO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFtDT0xVTU4uQk9PTCwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBib29sZWFuKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdiA/IHRoaXMuZmxhZyA6IDA7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheShfdjogYm9vbGVhbltdKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignaSB3aWxsIE5FVkVSIGJlY29tZSBBUlJBWScpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEZDb21wYXJhYmxlID0ge1xuICBvcmRlcjogbnVtYmVyLFxuICBiaXQ6IG51bWJlciB8IG51bGwsXG4gIGluZGV4OiBudW1iZXJcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBGaWVsZHMgKGE6IENvbHVtbiwgYjogQ29sdW1uKTogbnVtYmVyIHtcbiAgaWYgKGEuaXNBcnJheSAhPT0gYi5pc0FycmF5KSByZXR1cm4gYS5pc0FycmF5ID8gMSA6IC0xXG4gIHJldHVybiAoYS5vcmRlciAtIGIub3JkZXIpIHx8XG4gICAgKChhLmJpdCA/PyAwKSAtIChiLmJpdCA/PyAwKSkgfHxcbiAgICAoYS5pbmRleCAtIGIuaW5kZXgpO1xufVxuXG5leHBvcnQgdHlwZSBDb2x1bW4gPVxuICB8U3RyaW5nQ29sdW1uXG4gIHxOdW1lcmljQ29sdW1uXG4gIHxCaWdDb2x1bW5cbiAgfEJvb2xDb2x1bW5cbiAgO1xuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UZXh0IChcbiAgbmFtZTogc3RyaW5nLFxuICBpbmRleDogbnVtYmVyLFxuICBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzLFxuICBkYXRhOiBzdHJpbmdbXVtdLFxuKTogQ29sdW1uQXJnc3xudWxsIHtcbiAgY29uc3QgZmllbGQgPSB7XG4gICAgaW5kZXgsXG4gICAgbmFtZSxcbiAgICBvdmVycmlkZTogc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV0gYXMgdW5kZWZpbmVkIHwgKCguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSxcbiAgICB0eXBlOiBDT0xVTU4uVU5VU0VELFxuICAgIC8vIGF1dG8tZGV0ZWN0ZWQgZmllbGRzIHdpbGwgbmV2ZXIgYmUgYXJyYXlzLlxuICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgIG1heFZhbHVlOiAwLFxuICAgIG1pblZhbHVlOiAwLFxuICAgIHdpZHRoOiBudWxsIGFzIGFueSxcbiAgICBmbGFnOiBudWxsIGFzIGFueSxcbiAgICBiaXQ6IG51bGwgYXMgYW55LFxuICB9O1xuICBsZXQgaXNVc2VkID0gZmFsc2U7XG4gIC8vaWYgKGlzVXNlZCAhPT0gZmFsc2UpIGRlYnVnZ2VyO1xuICBmb3IgKGNvbnN0IHUgb2YgZGF0YSkge1xuICAgIGNvbnN0IHYgPSBmaWVsZC5vdmVycmlkZSA/IGZpZWxkLm92ZXJyaWRlKHVbaW5kZXhdLCB1LCBzY2hlbWFBcmdzKSA6IHVbaW5kZXhdO1xuICAgIGlmICghdikgY29udGludWU7XG4gICAgLy9jb25zb2xlLmVycm9yKGAke2luZGV4fToke25hbWV9IH4gJHt1WzBdfToke3VbMV19OiAke3Z9YClcbiAgICBpc1VzZWQgPSB0cnVlO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIodik7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkge1xuICAgICAgLy8gbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgZmllbGQudHlwZSA9IENPTFVNTi5TVFJJTkc7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSkge1xuICAgICAgY29uc29sZS53YXJuKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGhhcyBhIGZsb2F0PyBcIiR7dn1cIiAoJHtufSlcXHgxYlswbWApO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKG4pKSB7XG4gICAgICAvLyB3ZSB3aWxsIGhhdmUgdG8gcmUtZG8gdGhpcyBwYXJ0OlxuICAgICAgZmllbGQubWluVmFsdWUgPSAtSW5maW5pdHk7XG4gICAgICBmaWVsZC5tYXhWYWx1ZSA9IEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobiA8IGZpZWxkLm1pblZhbHVlKSBmaWVsZC5taW5WYWx1ZSA9IG47XG4gICAgICBpZiAobiA+IGZpZWxkLm1heFZhbHVlKSBmaWVsZC5tYXhWYWx1ZSA9IG47XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpc1VzZWQpIHtcbiAgICAvL2NvbnNvbGUuZXJyb3IoYFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX0gaXMgdW51c2VkP1xceDFiWzBtYClcbiAgICAvL2RlYnVnZ2VyO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1pblZhbHVlID09PSAwICYmIGZpZWxkLm1heFZhbHVlID09PSAxKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszNG0ke2l9OiR7bmFtZX0gYXBwZWFycyB0byBiZSBhIGJvb2xlYW4gZmxhZ1xceDFiWzBtYCk7XG4gICAgZmllbGQudHlwZSA9IENPTFVNTi5CT09MO1xuICAgIGZpZWxkLmJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgIGZpZWxkLmZsYWcgPSAxIDw8IChmaWVsZC5iaXQgJSA4KTtcbiAgICByZXR1cm4gZmllbGQ7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQklHIEJPWSBUSU1FXG4gIGZpZWxkLnR5cGUgPSBDT0xVTU4uQklHO1xuICByZXR1cm4gZmllbGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmdzRnJvbVR5cGUgKFxuICBuYW1lOiBzdHJpbmcsXG4gIHR5cGU6IENPTFVNTixcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbik6IENvbHVtbkFyZ3Mge1xuICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignaG93IHlvdSBnb25uYSB1c2UgaXQgdGhlbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgY29uc3QgYml0ID0gc2NoZW1hQXJncy5mbGFnc1VzZWQ7XG4gICAgICBjb25zdCBmbGFnID0gMSA8PCAoYml0ICUgOCk7XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgZmxhZywgYml0LCBvdmVycmlkZSB9O1xuXG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDEsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogMiwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiA0LCBvdmVycmlkZX07XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgd2F0IHR5cGUgaXMgdGhpcyAke3R5cGV9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21BcmdzIChhcmdzOiBDb2x1bW5BcmdzKTogQ29sdW1uIHtcbiAgc3dpdGNoIChhcmdzLnR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcigndW51c2VkIGZpZWxkIGNhbnQgYmUgdHVybmVkIGludG8gYSBDb2x1bW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICByZXR1cm4gbmV3IFN0cmluZ0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgaWYgKGFyZ3MudHlwZSAmIDE2KSB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1Y2ggdGhpbmcgYXMgYSBmbGFnIGFycmF5Jyk7XG4gICAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiBuZXcgQmlnQ29sdW1uKGFyZ3MpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHthcmdzLnR5cGV9YCk7XG4gIH1cbn1cbiIsICIvLyBqdXN0IGEgYnVuY2ggb2Ygb3V0cHV0IGZvcm1hdHRpbmcgc2hpdFxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlRGVjbyhuYW1lOiBzdHJpbmcsIHdpZHRoID0gODAsIHN0eWxlID0gOSkge1xuICBjb25zdCB7IFRMLCBCTCwgVFIsIEJSLCBIUiB9ID0gZ2V0Qm94Q2hhcnMoc3R5bGUpXG4gIGNvbnN0IG5hbWVXaWR0aCA9IG5hbWUubGVuZ3RoICsgMjsgLy8gd2l0aCBzcGFjZXNcbiAgY29uc3QgaFRhaWxXaWR0aCA9IHdpZHRoIC0gKG5hbWVXaWR0aCArIDYpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbiAgY21wRmllbGRzLFxufSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgeyBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGpvaW5Ub1N0cmluZywgam9pbmVkQnlUb1N0cmluZywgc3RyaW5nVG9Kb2luLCBzdHJpbmdUb0pvaW5lZEJ5IH0gZnJvbSAnLi9qb2luJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hQXJncyA9IHtcbiAgbmFtZTogc3RyaW5nO1xuICBrZXk6IHN0cmluZztcbiAgam9pbnM/OiBzdHJpbmc7XG4gIGpvaW5lZEJ5Pzogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgam9pbnM/OiBbc3RyaW5nLCBzdHJpbmddW107XG4gIHJlYWRvbmx5IGpvaW5lZEJ5OiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgcmVhZG9ubHkga2V5OiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgbmFtZSwgZmxhZ3NVc2VkLCBrZXksIGpvaW5zLCBqb2luZWRCeSB9OiBTY2hlbWFBcmdzKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICB0aGlzLmNvbHVtbnMgPSBbLi4uY29sdW1uc10uc29ydChjbXBGaWVsZHMpO1xuICAgIHRoaXMuZmllbGRzID0gdGhpcy5jb2x1bW5zLm1hcChjID0+IGMubmFtZSk7XG4gICAgdGhpcy5jb2x1bW5zQnlOYW1lID0gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuY29sdW1ucy5tYXAoYyA9PiBbYy5uYW1lLCBjXSkpO1xuICAgIHRoaXMuZmxhZ0ZpZWxkcyA9IGZsYWdzVXNlZDtcbiAgICB0aGlzLmZpeGVkV2lkdGggPSBjb2x1bW5zLnJlZHVjZShcbiAgICAgICh3LCBjKSA9PiB3ICsgKCghYy5pc0FycmF5ICYmIGMud2lkdGgpIHx8IDApLFxuICAgICAgTWF0aC5jZWlsKGZsYWdzVXNlZCAvIDgpLCAvLyA4IGZsYWdzIHBlciBieXRlLCBuYXRjaFxuICAgICk7XG5cbiAgICBpZiAoam9pbnMpIHRoaXMuam9pbnMgPSBzdHJpbmdUb0pvaW4oam9pbnMpO1xuICAgIGlmIChqb2luZWRCeSkgdGhpcy5qb2luZWRCeS5wdXNoKC4uLnN0cmluZ1RvSm9pbmVkQnkoam9pbmVkQnkpKTtcblxuICAgIGxldCBvOiBudW1iZXJ8bnVsbCA9IDA7XG4gICAgbGV0IGYgPSB0cnVlO1xuICAgIGxldCBiID0gZmFsc2U7XG4gICAgbGV0IGZmID0gMDtcbiAgICBmb3IgKGNvbnN0IFtpLCBjXSBvZiB0aGlzLmNvbHVtbnMuZW50cmllcygpKSB7XG4gICAgICBsZXQgT0MgPSAtMTtcbiAgICAgIC8vaWYgKGMudHlwZSAmIDE2KSBicmVhaztcbiAgICAgIHN3aXRjaCAoYy50eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkdfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JOF9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5CSUdfQVJSQVk6XG4gICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgIGlmIChvID4gMCkge1xuICAgICAgICAgICAgICBjb25zdCBkc28gPSBNYXRoLm1heCgwLCBpIC0gMilcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLm5hbWUsIGksIG8sIGBEU086JHtkc299Li4ke2kgKyAyfTpgLCBjb2x1bW5zLnNsaWNlKE1hdGgubWF4KDAsIGkgLSAyKSwgaSArIDIpKTtcbiAgICAgICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2hvdWxkIG5vdCBiZSEnKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnfn5+fn4gQk9PTCBUSU1FUyBET05FIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoZmYgIT09IHRoaXMuZmxhZ0ZpZWxkcykgdGhyb3cgbmV3IEVycm9yKCdib29vT1NBQVNPQU8nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBpZiAoIWYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2hvdWxkIGJlIScpXG4gICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYywgbyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghYikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnfn5+fn4gQk9PTCBUSU1FUyB+fn5+ficpO1xuICAgICAgICAgICAgYiA9IHRydWU7XG4gICAgICAgICAgICBpZiAoZmYgIT09IDApIHRocm93IG5ldyBFcnJvcignYm9vbycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBPQyA9IG87XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGMub2Zmc2V0ID0gbzsgYy5iaXQgPSBmZisrOyBjLmZsYWcgPSAyICoqIChjLmJpdCAlIDgpOyAvLyBoZWhlaGVcbiAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjgpIG8rKztcbiAgICAgICAgICBpZiAoYy5iaXQgKyAxID09PSB0aGlzLmZsYWdGaWVsZHMpIHtcbiAgICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCAmJiBvICE9PSB0aGlzLmZpeGVkV2lkdGgpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUnKVxuICAgICAgICAgICAgaWYgKGMuZmxhZyA8IDEyOCAmJiBvICE9PSB0aGlzLmZpeGVkV2lkdGggLSAxKSB0aHJvdyBuZXcgRXJyb3IoJ1dIVVBPU0lFIC0gMScpXG4gICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICBPQyA9IG87XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGMub2Zmc2V0ID0gbztcbiAgICAgICAgICBpZiAoIWMud2lkdGgpIGRlYnVnZ2VyO1xuICAgICAgICAgIG8gKz0gYy53aWR0aCE7XG4gICAgICAgICAgaWYgKG8gPT09IHRoaXMuZml4ZWRXaWR0aCkgZiA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy9jb25zdCBybmcgPSBPQyA8IDAgPyBgYCA6IGAgJHtPQ30uLiR7b30gLyAke3RoaXMuZml4ZWRXaWR0aH1gXG4gICAgICAvL2NvbnNvbGUubG9nKGBbJHtpfV0ke3JuZ31gLCBjLm5hbWUsIGMubGFiZWwpXG4gICAgfVxuICAgIHRoaXMuc3RyaW5nRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc1N0cmluZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG4gICAgdGhpcy5iaWdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzQmlnQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcblxuICB9XG5cbiAgc3RhdGljIGZyb21CdWZmZXIgKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBTY2hlbWEge1xuICAgIGxldCBpID0gMDtcbiAgICBsZXQgcmVhZDogbnVtYmVyO1xuICAgIGxldCBuYW1lOiBzdHJpbmc7XG4gICAgbGV0IGtleTogc3RyaW5nO1xuICAgIGxldCBqb2luczogc3RyaW5nfHVuZGVmaW5lZDtcbiAgICBsZXQgam9pbmVkQnk6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBba2V5LCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBbam9pbnMsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIFtqb2luZWRCeSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgY29uc29sZS5sb2coJy0gQlVIJywgbmFtZSwga2V5LCBqb2lucywgam9pbmVkQnkpXG4gICAgaWYgKCFqb2lucykgam9pbnMgPSB1bmRlZmluZWQ7XG4gICAgaWYgKCFqb2luZWRCeSkgam9pbmVkQnkgPSB1bmRlZmluZWQ7XG4gICAgY29uc3QgYXJncyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBrZXksXG4gICAgICBqb2lucyxcbiAgICAgIGpvaW5lZEJ5LFxuICAgICAgY29sdW1uczogW10gYXMgQ29sdW1uW10sXG4gICAgICBmaWVsZHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgZmxhZ3NVc2VkOiAwLFxuICAgICAgcmF3RmllbGRzOiB7fSwgLy8gbm9uZSA6PFxuICAgICAgb3ZlcnJpZGVzOiB7fSwgLy8gbm9uZX5cbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyBUT0RPIC0gb25seSB3b3JrcyB3aGVuIDAtZmllbGQgc2NoZW1hcyBhcmVuJ3QgYWxsb3dlZH4hXG4gICAgd2hpbGUgKGluZGV4IDwgbnVtRmllbGRzKSB7XG4gICAgICBjb25zdCB0eXBlID0gYnl0ZXNbaSsrXTtcbiAgICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgY29uc3QgZiA9IHtcbiAgICAgICAgaW5kZXgsIG5hbWUsIHR5cGUsXG4gICAgICAgIHdpZHRoOiBudWxsLCBiaXQ6IG51bGwsIGZsYWc6IG51bGwsXG4gICAgICAgIG9yZGVyOiA5OTlcbiAgICAgIH07XG4gICAgICBpICs9IHJlYWQ7XG4gICAgICBsZXQgYzogQ29sdW1uO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICAgYyA9IG5ldyBTdHJpbmdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgICAgYyA9IG5ldyBCaWdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGNvbnN0IGJpdCA9IGFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgY29uc3QgZmxhZyA9IDIgKiogKGJpdCAlIDgpO1xuICAgICAgICAgIGMgPSBuZXcgQm9vbENvbHVtbih7IC4uLmYsIGJpdCwgZmxhZyB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAxIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDQgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIHR5cGUgJHt0eXBlfWApO1xuICAgICAgfVxuICAgICAgYXJncy5jb2x1bW5zLnB1c2goYyk7XG4gICAgICBhcmdzLmZpZWxkcy5wdXNoKGMubmFtZSk7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNjaGVtYShhcmdzKTtcbiAgfVxuXG4gIHJvd0Zyb21CdWZmZXIoXG4gICAgICBpOiBudW1iZXIsXG4gICAgICBidWZmZXI6IEFycmF5QnVmZmVyLFxuICAgICAgX19yb3dJZDogbnVtYmVyXG4gICk6IFtSb3csIG51bWJlcl0ge1xuICAgIGNvbnN0IGRiciA9IF9fcm93SWQgPCA1IHx8IF9fcm93SWQgPiAzOTc1IHx8IF9fcm93SWQgJSAxMDAwID09PSAwO1xuICAgIC8vaWYgKGRicikgY29uc29sZS5sb2coYCAtIFJPVyAke19fcm93SWR9IEZST00gJHtpfSAoMHgke2kudG9TdHJpbmcoMTYpfSlgKVxuICAgIGxldCB0b3RhbFJlYWQgPSAwO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgY29uc3Qgcm93OiBSb3cgPSB7IF9fcm93SWQgfVxuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuXG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgLy9pZiAoYy5vZmZzZXQgJiYgYy5vZmZzZXQgIT09IHRvdGFsUmVhZCkgeyBkZWJ1Z2dlcjsgY29uc29sZS5sb2coJ3dvb3BzaWUnKTsgfVxuICAgICAgbGV0IFt2LCByZWFkXSA9IGMuaXNBcnJheSA/XG4gICAgICAgIGMuYXJyYXlGcm9tQnl0ZXMoaSwgYnl0ZXMsIHZpZXcpIDpcbiAgICAgICAgYy5mcm9tQnl0ZXMoaSwgYnl0ZXMsIHZpZXcpO1xuXG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTClcbiAgICAgICAgcmVhZCA9IChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgPyAxIDogMDtcblxuICAgICAgaSArPSByZWFkO1xuICAgICAgdG90YWxSZWFkICs9IHJlYWQ7XG4gICAgICAvLyBkb24ndCBwdXQgZmFsc3kgdmFsdWVzIG9uIGZpbmFsIG9iamVjdHMuIG1heSByZXZpc2l0IGhvdyB0aGlzIHdvcmtzIGxhdGVyXG4gICAgICAvL2lmIChjLmlzQXJyYXkgfHwgdikgcm93W2MubmFtZV0gPSB2O1xuICAgICAgcm93W2MubmFtZV0gPSB2O1xuICAgICAgLy9jb25zdCB3ID0gZ2xvYmFsVGhpcy5fUk9XU1t0aGlzLm5hbWVdW19fcm93SWRdW2MubmFtZV0gLy8gc3JzIGJpelxuICAgICAgLypcbiAgICAgIGlmICh3ICE9PSB2KSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh3KSB8fCB3LnNvbWUoKG4sIGkpID0+IG4gIT09IHZbaV0pKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgWFhYWFggJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSAtPiAke3Z9YClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBfX19fXyAke3RoaXMubmFtZX1bJHtfX3Jvd0lkfV1bJHtjLm5hbWV9XSAke3d9ID09ICR7dn1gKVxuICAgICAgfVxuICAgICAgKi9cbiAgICB9XG4gICAgLy9pZiAoZGJyKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgICBSRUFEOiAke3RvdGFsUmVhZH0gVE8gJHtpfSAvICR7YnVmZmVyLmJ5dGVMZW5ndGh9XFxuYCwgcm93LCAnXFxuXFxuJyk7XG4gICAgICAvL2RlYnVnZ2VyO1xuICAgIC8vfVxuICAgIHJldHVybiBbcm93LCB0b3RhbFJlYWRdO1xuICB9XG5cbiAgcHJpbnRSb3cgKHI6IFJvdywgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUhlYWRlciAoKTogQmxvYiB7XG4gICAgLy8gWy4uLm5hbWUsIDAsIG51bUZpZWxkczAsIG51bUZpZWxkczEsIGZpZWxkMFR5cGUsIGZpZWxkMEZsYWc/LCAuLi5maWVsZDBOYW1lLCAwLCBldGNdO1xuICAgIC8vIFRPRE8gLSBCYXNlIHVuaXQgaGFzIDUwMCsgZmllbGRzXG4gICAgaWYgKHRoaXMuY29sdW1ucy5sZW5ndGggPiA2NTUzNSkgdGhyb3cgbmV3IEVycm9yKCdvaCBidWRkeS4uLicpO1xuICAgIGNvbnN0IHBhcnRzID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpLFxuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLmtleSksXG4gICAgICAuLi50aGlzLnNlcmlhbGl6ZUpvaW5zKCksXG4gICAgICB0aGlzLmNvbHVtbnMubGVuZ3RoICYgMjU1LFxuICAgICAgKHRoaXMuY29sdW1ucy5sZW5ndGggPj4+IDgpLFxuICAgICAgLi4udGhpcy5jb2x1bW5zLmZsYXRNYXAoYyA9PiBjLnNlcmlhbGl6ZSgpKVxuICAgIF0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFtwYXJ0c10pO1xuICB9XG5cbiAgc2VyaWFsaXplSm9pbnMgKCkge1xuICAgIGxldCBqID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgbGV0IGpiID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgaWYgKHRoaXMuam9pbnMpIGogPSBzdHJpbmdUb0J5dGVzKGpvaW5Ub1N0cmluZyh0aGlzLmpvaW5zKSk7XG4gICAgaWYgKHRoaXMuam9pbmVkQnkpIGpiID0gc3RyaW5nVG9CeXRlcyhqb2luZWRCeVRvU3RyaW5nKHRoaXMuam9pbmVkQnkpKTtcbiAgICByZXR1cm4gWy4uLmosIC4uLmpiXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyAocjogUm93KTogQmxvYiB7XG4gICAgY29uc3QgZml4ZWQgPSBuZXcgVWludDhBcnJheSh0aGlzLmZpeGVkV2lkdGgpO1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcbiAgICBjb25zdCBibG9iUGFydHM6IEJsb2JQYXJ0W10gPSBbZml4ZWRdO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHYgPSByW2MubmFtZV1cbiAgICAgICAgaWYgKGMuaXNBcnJheSkge1xuICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZUFycmF5KHYgYXMgYW55W10pXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2goYy50eXBlKSB7XG4gICAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOiB7XG4gICAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBzdHJpbmcpXG4gICAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgfSBicmVhaztcbiAgICAgICAgICBjYXNlIENPTFVNTi5CSUc6IHtcbiAgICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJpZ2ludClcbiAgICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgICB9IGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICAgIGZpeGVkW2ldIHw9IGMuc2VyaWFsaXplUm93KHYgYXMgYm9vbGVhbik7XG4gICAgICAgICAgICAvLyBkb250IG5lZWQgdG8gY2hlY2sgZm9yIHRoZSBsYXN0IGZsYWcgc2luY2Ugd2Ugbm8gbG9uZ2VyIG5lZWQgaVxuICAgICAgICAgICAgLy8gYWZ0ZXIgd2UncmUgZG9uZSB3aXRoIG51bWJlcnMgYW5kIGJvb2xlYW5zXG4gICAgICAgICAgICAvL2lmIChjLmZsYWcgPT09IDEyOCkgaSsrO1xuICAgICAgICAgICAgLy8gLi4uYnV0IHdlIHdpbGwgYmVjYXV5c2Ugd2UgYnJva2Ugc29tZXRoaWduXG4gICAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpIGkrKztcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgICAgY29uc3QgYnl0ZXMgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIG51bWJlcilcbiAgICAgICAgICAgIGZpeGVkLnNldChieXRlcywgaSlcbiAgICAgICAgICAgIGkgKz0gYy53aWR0aCE7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgd2F0IHR5cGUgaXMgdGhpcyAkeyhjIGFzIGFueSkudHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBDT0xVTU46JywgYyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgUk9XOicsIHIpO1xuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lmIChyLl9fcm93SWQgPCA1IHx8IHIuX19yb3dJZCA+IDM5NzUgfHwgci5fX3Jvd0lkICUgMTAwMCA9PT0gMCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgIC0gUk9XICR7ci5fX3Jvd0lkfWAsIHsgaSwgYmxvYlBhcnRzLCByIH0pO1xuICAgIC8vfVxuICAgIHJldHVybiBuZXcgQmxvYihibG9iUGFydHMpO1xuICB9XG5cbiAgcHJpbnQgKHdpZHRoID0gODApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMzYpO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnN0IHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSA9IHRoaXM7XG4gICAgY29uc29sZS5sb2coeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9KTtcbiAgICBjb25zb2xlLnRhYmxlKHRoaXMuY29sdW1ucywgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ2xhYmVsJyxcbiAgICAgICdvZmZzZXQnLFxuICAgICAgJ29yZGVyJyxcbiAgICAgICdiaXQnLFxuICAgICAgJ3R5cGUnLFxuICAgICAgJ2ZsYWcnLFxuICAgICAgJ3dpZHRoJyxcbiAgICBdKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcblxuICB9XG5cbiAgLy8gcmF3VG9Sb3cgKGQ6IFJhd1Jvdyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHt9XG4gIC8vIHJhd1RvU3RyaW5nIChkOiBSYXdSb3csIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHt9XG59O1xuXG4iLCAiaW1wb3J0IHsgdmFsaWRhdGVKb2luIH0gZnJvbSAnLi9qb2luJztcbmltcG9ydCB7IFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5leHBvcnQgdHlwZSBSb3dEYXRhID0gYW55OyAvLyBmbWxcbmV4cG9ydCB0eXBlIFJvdyA9IFJlY29yZDxzdHJpbmcsIFJvd0RhdGE+ICYgeyBfX3Jvd0lkOiBudW1iZXIgfTtcblxudHlwZSBUYWJsZUJsb2IgPSB7IG51bVJvd3M6IG51bWJlciwgaGVhZGVyQmxvYjogQmxvYiwgZGF0YUJsb2I6IEJsb2IgfTtcblxuZXhwb3J0IGNsYXNzIFRhYmxlIHtcbiAgZ2V0IG5hbWUgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNjaGVtYS5uYW1lIH1cbiAgZ2V0IGtleSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc2NoZW1hLmtleSB9XG4gIHJlYWRvbmx5IG1hcDogTWFwPGFueSwgYW55PiA9IG5ldyBNYXAoKVxuICBjb25zdHJ1Y3RvciAoXG4gICAgcmVhZG9ubHkgcm93czogUm93W10sXG4gICAgcmVhZG9ubHkgc2NoZW1hOiBTY2hlbWEsXG4gICkge1xuICAgIGNvbnN0IGtleU5hbWUgPSB0aGlzLmtleTtcbiAgICBpZiAoa2V5TmFtZSAhPT0gJ19fcm93SWQnKSBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcbiAgICAgIGNvbnN0IGtleSA9IHJvd1trZXlOYW1lXTtcbiAgICAgIGlmICh0aGlzLm1hcC5oYXMoa2V5KSkgdGhyb3cgbmV3IEVycm9yKCdrZXkgaXMgbm90IHVuaXF1ZScpO1xuICAgICAgdGhpcy5tYXAuc2V0KGtleSwgcm93KTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgYXBwbHlMYXRlSm9pbnMgKFxuICAgIGp0OiBUYWJsZSxcbiAgICB0YWJsZXM6IFJlY29yZDxzdHJpbmcsIFRhYmxlPixcbiAgICBhZGREYXRhOiBib29sZWFuXG4gICk6IFRhYmxlIHtcbiAgICBjb25zdCBqb2lucyA9IGp0LnNjaGVtYS5qb2lucztcblxuICAgIGlmICgham9pbnMpIHRocm93IG5ldyBFcnJvcignc2hpdCBhc3MgaWRpdG90IHdob21zdCcpO1xuICAgIGZvciAoY29uc3QgaiBvZiBqb2lucykge1xuICAgICAgdmFsaWRhdGVKb2luKGosIGp0LCB0YWJsZXMpO1xuICAgICAgY29uc3QgW3RuLCBjbl0gPSBqO1xuICAgICAgY29uc3QgdCA9IHRhYmxlc1t0bl07XG4gICAgICBjb25zdCBqYiA9IHQuc2NoZW1hLmpvaW5lZEJ5O1xuICAgICAgaWYgKGpiLnNvbWUoKFtqYnRuLCBdKSA9PiBqYnRuID09PSB0bikpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0bn0gYWxyZWFkeSBqb2luZWQgJHtqfWApXG4gICAgICBqYi5wdXNoKFtqdC5zY2hlbWEubmFtZSwgY25dKTtcbiAgICB9XG5cbiAgICBpZiAoYWRkRGF0YSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnQVBQTFlJTkcnKVxuICAgICAgZm9yIChjb25zdCByIG9mIGp0LnJvd3MpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnLSBKT0lOJywgcilcbiAgICAgICAgZm9yIChjb25zdCBbdG4sIGNuXSBvZiBqdC5zY2hlbWEuam9pbnMpIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgIC0nLCB0biwgJ09OJywgY24pO1xuICAgICAgICAgIGNvbnN0IGpyID0gdGFibGVzW3RuXS5tYXAuZ2V0KHJbY25dKTtcbiAgICAgICAgICBpZiAoIWpyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYE1JU1NFRCBBIEpPSU4gJHt0bn1bJHtjbn1dOiBOT1RISU5HIFRIRVJFYCwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGpyW2p0Lm5hbWVdKSBqcltqdC5uYW1lXS5wdXNoKHIpO1xuICAgICAgICAgIGVsc2UganJbanQubmFtZV0gPSBbcl07XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnICA+JywganIuaWQsIGpyLm5hbWUsIGpyW3RuXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2coXG4gICAgICAgIC8vanQuc2NoZW1hLm5hbWUsXG4gICAgICAgIC8vdGFibGVzLk1hZ2ljU2l0ZS5yb3dzLmZpbHRlcihyID0+IHJbanQuc2NoZW1hLm5hbWVdKVxuICAgICAgICAvL1suLi50YWJsZXMuTWFnaWNTaXRlLm1hcC52YWx1ZXMoKV0uZmluZChyID0+IHJbJ1NpdGVCeU5hdGlvbiddKVxuICAgICAgLy8pXG4gICAgfVxuXG4gICAgcmV0dXJuIGp0O1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuXG4gICAgLy9jb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB7XG4gICAgICAvL2NvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIC8vaWYgKHIuX19yb3dJZCA9PT0gMClcbiAgICAgICAgLy9yb3dCbG9iLmFycmF5QnVmZmVyKCkudGhlbihhYiA9PiB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgbmV3IFVpbnQ4QXJyYXkoYWIpLmpvaW4oJywgJykpO1xuICAgICAgICAvL30pO1xuICAgICAgLy9yZXR1cm4gcm93QmxvYjtcbiAgICAvL30pO1xuICAgIGNvbnN0IHJvd0Jsb2IgPSBuZXcgQmxvYihyb3dEYXRhKVxuICAgIGNvbnN0IGRhdGFQYWRkaW5nID0gKDQgLSByb3dCbG9iLnNpemUgJSA0KSAlIDQ7XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFVpbnQzMkFycmF5KFtcbiAgICAgICAgdGhpcy5yb3dzLmxlbmd0aCxcbiAgICAgICAgc2NoZW1hSGVhZGVyLnNpemUgKyBzY2hlbWFQYWRkaW5nLFxuICAgICAgICByb3dCbG9iLnNpemUgKyBkYXRhUGFkZGluZ1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHNjaGVtYUhlYWRlcixcbiAgICAgICAgbmV3IEFycmF5QnVmZmVyKHNjaGVtYVBhZGRpbmcpIGFzIGFueSAvLyA/Pz9cbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKHsgdGFibGVzLCBibG9icywgYWxsU2l6ZXMsIGFsbEhlYWRlcnMsIGFsbERhdGEgfSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW2FsbFNpemVzLCAuLi5hbGxIZWFkZXJzLCAuLi5hbGxEYXRhXSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgb3BlbkJsb2IgKGJsb2I6IEJsb2IpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIFRhYmxlPj4ge1xuICAgIGlmIChibG9iLnNpemUgJSA0ICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3dvbmt5IGJsb2Igc2l6ZScpO1xuICAgIGNvbnN0IG51bVRhYmxlcyA9IG5ldyBVaW50MzJBcnJheShhd2FpdCBibG9iLnNsaWNlKDAsIDQpLmFycmF5QnVmZmVyKCkpWzBdO1xuXG4gICAgLy8gb3ZlcmFsbCBieXRlIG9mZnNldFxuICAgIGxldCBibyA9IDQ7XG4gICAgY29uc3Qgc2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICBhd2FpdCBibG9iLnNsaWNlKGJvLCBibyArPSBudW1UYWJsZXMgKiAxMikuYXJyYXlCdWZmZXIoKVxuICAgICk7XG5cbiAgICBjb25zdCB0QmxvYnM6IFRhYmxlQmxvYltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICBjb25zdCBzaSA9IGkgKiAzO1xuICAgICAgY29uc3QgbnVtUm93cyA9IHNpemVzW3NpXTtcbiAgICAgIGNvbnN0IGhTaXplID0gc2l6ZXNbc2kgKyAxXTtcbiAgICAgIHRCbG9ic1tpXSA9IHsgbnVtUm93cywgaGVhZGVyQmxvYjogYmxvYi5zbGljZShibywgYm8gKz0gaFNpemUpIH0gYXMgYW55O1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICB0QmxvYnNbaV0uZGF0YUJsb2IgPSBibG9iLnNsaWNlKGJvLCBibyArPSBzaXplc1tpICogMyArIDJdKTtcbiAgICB9O1xuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAoKHRiLCBpKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBJTiBCTE9CUyBGT1IgVD0ke2l9YCwgdGIpXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQmxvYih0Yik7XG4gICAgfSkpXG4gICAgY29uc3QgdGFibGVNYXAgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuXG4gICAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykge1xuICAgICAgaWYgKCF0LnNjaGVtYS5qb2lucykgY29udGludWU7XG4gICAgICBmb3IgKGNvbnN0IFthVCwgYUZdIG9mIHQuc2NoZW1hLmpvaW5zKSB7XG4gICAgICAgIGNvbnN0IHRBID0gdGFibGVNYXBbYVRdO1xuICAgICAgICBpZiAoIXRBKSB0aHJvdyBuZXcgRXJyb3IoYCR7dC5uYW1lfSBqb2lucyB1bmRlZmluZWQgdGFibGUgJHthVH1gKTtcbiAgICAgICAgaWYgKCF0LnJvd3MubGVuZ3RoKSBjb250aW51ZTsgLy8gZW1wdHkgdGFibGUgaSBndWVzcz9cbiAgICAgICAgZm9yIChjb25zdCByIG9mIHQucm93cykge1xuICAgICAgICAgIGNvbnN0IGlkQSA9IHJbYUZdO1xuICAgICAgICAgIGlmIChpZEEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgcm93IGhhcyBhIGJhZCBpZD9gLCByKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBhID0gdEEubWFwLmdldChpZEEpO1xuICAgICAgICAgIGlmIChhID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBtaXNzaW5nIGlkP2AsIGEsIGlkQSwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgKGFbdC5uYW1lXSA/Pz0gW10pLnB1c2gocik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhYmxlTWFwO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGZyb21CbG9iICh7XG4gICAgaGVhZGVyQmxvYixcbiAgICBkYXRhQmxvYixcbiAgICBudW1Sb3dzLFxuICB9OiBUYWJsZUJsb2IpOiBQcm9taXNlPFRhYmxlPiB7XG4gICAgY29uc3Qgc2NoZW1hID0gU2NoZW1hLmZyb21CdWZmZXIoYXdhaXQgaGVhZGVyQmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICBsZXQgcmJvID0gMDtcbiAgICBsZXQgX19yb3dJZCA9IDA7XG4gICAgY29uc3Qgcm93czogUm93W10gPSBbXTtcbiAgICAvLyBUT0RPIC0gY291bGQgZGVmaW5pdGVseSB1c2UgYSBzdHJlYW0gZm9yIHRoaXNcbiAgICBjb25zdCBkYXRhQnVmZmVyID0gYXdhaXQgZGF0YUJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT0gUkVBRCAke251bVJvd3N9IE9GICR7c2NoZW1hLm5hbWV9ID09PT09YClcbiAgICB3aGlsZSAoX19yb3dJZCA8IG51bVJvd3MpIHtcbiAgICAgIGNvbnN0IFtyb3csIHJlYWRdID0gc2NoZW1hLnJvd0Zyb21CdWZmZXIocmJvLCBkYXRhQnVmZmVyLCBfX3Jvd0lkKyspO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICByYm8gKz0gcmVhZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG4gIH1cblxuXG4gIHByaW50IChcbiAgICB3aWR0aDogbnVtYmVyID0gODAsXG4gICAgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT58bnVsbCA9IG51bGwsXG4gICAgbjogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIG06IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbiAgKTogbnVsbHxhbnlbXSB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDE4KTtcbiAgICBjb25zdCByb3dzID0gcCA/IHRoaXMucm93cy5maWx0ZXIocCkgOlxuICAgICAgbiA9PT0gbnVsbCA/IHRoaXMucm93cyA6XG4gICAgICBtID09PSBudWxsID8gdGhpcy5yb3dzLnNsaWNlKDAsIG4pIDpcbiAgICAgIHRoaXMucm93cy5zbGljZShuLCBtKTtcblxuXG4gICAgbGV0IG1GaWVsZHMgPSBBcnJheS5mcm9tKChmaWVsZHMgPz8gdGhpcy5zY2hlbWEuZmllbGRzKSk7XG4gICAgaWYgKHApIFtuLCBtXSA9IFswLCByb3dzLmxlbmd0aF1cbiAgICBlbHNlIChtRmllbGRzIGFzIGFueSkudW5zaGlmdCgnX19yb3dJZCcpO1xuXG4gICAgY29uc3QgW3BSb3dzLCBwRmllbGRzXSA9IGZpZWxkcyA/XG4gICAgICBbcm93cy5tYXAoKHI6IFJvdykgPT4gdGhpcy5zY2hlbWEucHJpbnRSb3cociwgbUZpZWxkcykpLCBmaWVsZHNdOlxuICAgICAgW3Jvd3MsIHRoaXMuc2NoZW1hLmZpZWxkc11cbiAgICAgIDtcblxuICAgIGNvbnNvbGUubG9nKCdyb3cgZmlsdGVyOicsIHAgPz8gJyhub25lKScpXG4gICAgY29uc29sZS5sb2coYCh2aWV3IHJvd3MgJHtufSAtICR7bX0pYCk7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc29sZS50YWJsZShwUm93cywgcEZpZWxkcyk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG4gICAgcmV0dXJuIChwICYmIGZpZWxkcykgP1xuICAgICAgcm93cy5tYXAociA9PlxuICAgICAgICBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkuZmlsdGVyKGUgPT4gZVsxXSkpXG4gICAgICApIDpcbiAgICAgIG51bGw7XG4gIH1cblxuICBkdW1wUm93IChpOiBudW1iZXJ8bnVsbCwgc2hvd0VtcHR5ID0gZmFsc2UsIHVzZUNTUz86IGJvb2xlYW4pOiBzdHJpbmdbXSB7XG4gICAgLy8gVE9ETyBcdTIwMTQgaW4gYnJvd3NlciwgdXNlQ1NTID09PSB0cnVlIGJ5IGRlZmF1bHRcbiAgICB1c2VDU1MgPz89IChnbG9iYWxUaGlzWyd3aW5kb3cnXSA9PT0gZ2xvYmFsVGhpcyk7IC8vIGlka1xuICAgIGkgPz89IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMucm93cy5sZW5ndGgpO1xuICAgIGNvbnN0IHJvdyA9IHRoaXMucm93c1tpXTtcbiAgICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgY3NzOiBzdHJpbmdbXXxudWxsID0gdXNlQ1NTID8gW10gOiBudWxsO1xuICAgIGNvbnN0IGZtdCA9IGZtdFN0eWxlZC5iaW5kKG51bGwsIG91dCwgY3NzKTtcbiAgICBjb25zdCBwID0gTWF0aC5tYXgoXG4gICAgICAuLi50aGlzLnNjaGVtYS5jb2x1bW5zXG4gICAgICAuZmlsdGVyKGMgPT4gc2hvd0VtcHR5IHx8IHJvd1tjLm5hbWVdKVxuICAgICAgLm1hcChjID0+IGMubmFtZS5sZW5ndGggKyAyKVxuICAgICk7XG4gICAgaWYgKCFyb3cpXG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XSBkb2VzIG5vdCBleGlzdGAsIENfTk9UX0ZPVU5EKTtcbiAgICBlbHNlIHtcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dYCwgQ19ST1dfSEVBRCk7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5zY2hlbWEuY29sdW1ucykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1tjLm5hbWVdO1xuICAgICAgICBjb25zdCBuID0gYy5uYW1lLnBhZFN0YXJ0KHAsICcgJyk7XG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWNUUlVFYCwgQ19UUlVFKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogJWNGQUxTRWAsIENfTk9UX0ZPVU5ELCBDX0ZBTFNFKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWMke3ZhbHVlfWAsIENfTlVNQkVSKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChgJHtufTogJWMke3ZhbHVlfWAsIENfU1RSKVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogXHUyMDE0YCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYmlnaW50JzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGB7bn06ICVjMCAlYyR7dmFsdWV9IChCSUcpYCwgQ19CSUcsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDAgKEJJRylgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodXNlQ1NTKSByZXR1cm4gW291dC5qb2luKCdcXG4nKSwgLi4uY3NzIV07XG4gICAgZWxzZSByZXR1cm4gW291dC5qb2luKCdcXG4nKV07XG4gIH1cblxuICBmaW5kUm93IChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbiwgc3RhcnQgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBOID0gdGhpcy5yb3dzLmxlbmd0aFxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gTiAtIHN0YXJ0O1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IE47IGkrKykgaWYgKHByZWRpY2F0ZSh0aGlzLnJvd3NbaV0pKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAqIGZpbHRlclJvd3MgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuKTogR2VuZXJhdG9yPFJvdz4ge1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykgaWYgKHByZWRpY2F0ZShyb3cpKSB5aWVsZCByb3c7XG4gIH1cbiAgLypcbiAgcmF3VG9Sb3cgKGQ6IHN0cmluZ1tdKTogUm93IHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc2NoZW1hLmNvbHVtbnMubWFwKHIgPT4gW1xuICAgICAgci5uYW1lLFxuICAgICAgci50b1ZhbChkW3IuaW5kZXhdKVxuICAgIF0pKTtcbiAgfVxuICByYXdUb1N0cmluZyAoZDogc3RyaW5nW10sIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAvLyBqdXN0IGFzc3VtZSBmaXJzdCB0d28gZmllbGRzIGFyZSBhbHdheXMgaWQsIG5hbWUuIGV2ZW4gaWYgdGhhdCdzIG5vdCB0cnVlXG4gICAgLy8gdGhpcyBpcyBqdXN0IGZvciB2aXN1YWxpemF0aW9uIHB1cnBvcnNlc1xuICAgIGxldCBleHRyYSA9ICcnO1xuICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLnJhd1RvUm93KGQpO1xuICAgICAgZm9yIChjb25zdCBhIG9mIGFyZ3MpIHtcbiAgICAgICAgLy8gZG9uJ3QgcmVwcmludCBuYW1lIG9yIGlkXG4gICAgICAgIGlmIChhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMF0gfHwgYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzFdKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZVthXSAhPSBudWxsKVxuICAgICAgICAgIHMucHVzaChgJHthfTogJHtKU09OLnN0cmluZ2lmeShlW2FdKX1gKVxuICAgICAgfVxuICAgICAgZXh0cmEgPSBzLmxlbmd0aCA+IDAgPyBgIHsgJHtzLmpvaW4oJywgJyl9IH1gIDogJ3t9JztcbiAgICB9XG4gICAgcmV0dXJuIGA8JHt0aGlzLnNjaGVtYS5uYW1lfToke2RbMF0gPz8gJz8nfSBcIiR7ZFsxXX1cIiR7ZXh0cmF9PmA7XG4gIH1cbiAgKi9cbn1cblxuZnVuY3Rpb24gZm10U3R5bGVkIChcbiAgb3V0OiBzdHJpbmdbXSxcbiAgY3NzT3V0OiBzdHJpbmdbXSB8IG51bGwsXG4gIG1zZzogc3RyaW5nLFxuICAuLi5jc3M6IHN0cmluZ1tdXG4pIHtcbiAgaWYgKGNzc091dCkge1xuICAgIG91dC5wdXNoKG1zZyArICclYycpXG4gICAgY3NzT3V0LnB1c2goLi4uY3NzLCBDX1JFU0VUKTtcbiAgfVxuICBlbHNlIG91dC5wdXNoKG1zZy5yZXBsYWNlKC8lYy9nLCAnJykpO1xufVxuXG5jb25zdCBDX05PVF9GT1VORCA9ICdjb2xvcjogIzg4ODsgZm9udC1zdHlsZTogaXRhbGljOyc7XG5jb25zdCBDX1JPV19IRUFEID0gJ2ZvbnQtd2VpZ2h0OiBib2xkZXInO1xuY29uc3QgQ19CT0xEID0gJ2ZvbnQtd2VpZ2h0OiBib2xkJztcbmNvbnN0IENfTlVNQkVSID0gJ2NvbG9yOiAjQTA1NTE4OyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19UUlVFID0gJ2NvbG9yOiAjNEMzOEJFOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19GQUxTRSA9ICdjb2xvcjogIzM4QkUxQzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfU1RSID0gJ2NvbG9yOiAjMzBBQTYyOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19CSUcgPSAnY29sb3I6ICM3ODIxQTM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1JFU0VUID0gJ2NvbG9yOiB1bnNldDsgZm9udC1zdHlsZTogdW5zZXQ7IGZvbnQtd2VpZ2h0OiB1bnNldDsgYmFja2dyb3VuZC11bnNldCdcbiIsICJpbXBvcnQgeyBDT0xVTU4sIFNjaGVtYUFyZ3MgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB0eXBlIHsgUGFyc2VTY2hlbWFPcHRpb25zIH0gZnJvbSAnLi9wYXJzZS1jc3YnXG5leHBvcnQgY29uc3QgY3N2RGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+PiA9IHtcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VVLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdCcsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbXG4gICAgICAvLyBjb21iaW5lZCBpbnRvIGFuIGFycmF5IGZpZWxkXG4gICAgICAnYXJtb3IxJywgJ2FybW9yMicsICdhcm1vcjMnLCAnYXJtb3I0JywgJ2VuZCcsXG4gICAgICAnd3BuMScsICd3cG4yJywgJ3dwbjMnLCAnd3BuNCcsICd3cG41JywgJ3dwbjYnLCAnd3BuNycsXG5cbiAgICAgIC8vIGFsbCBjb21iaW5lZCBpbnRvIG9uZSBhcnJheSBmaWVsZFxuICAgICAgJ2xpbmsxJywgJ2xpbmsyJywgJ2xpbmszJywgJ2xpbms0JywgJ2xpbms1JywgJ2xpbms2JyxcbiAgICAgICdtYXNrMScsICdtYXNrMicsICdtYXNrMycsICdtYXNrNCcsICdtYXNrNScsICdtYXNrNicsXG4gICAgICAnbmJyMScsICAnbmJyMicsICAnbmJyMycsICAnbmJyNCcsICAnbmJyNScsICAnbmJyNicsXG4gICAgICAncmFuZDEnLCAncmFuZDInLCAncmFuZDMnLCAncmFuZDQnLCAncmFuZDUnLCAncmFuZDYnLFxuXG4gICAgICAvLyBkZXByZWNhdGVkXG4gICAgICAnbW91bnRlZCcsXG4gICAgICAvLyByZWR1bmRhbnRcbiAgICAgICdyZWFuaW1hdG9yfjEnLFxuICAgIF0pLFxuICAgIGtub3duRmllbGRzOiB7XG4gICAgICBpZDogQ09MVU1OLlUxNixcbiAgICAgIG5hbWU6IENPTFVNTi5TVFJJTkcsXG4gICAgICBydDogQ09MVU1OLlU4LFxuICAgICAgcmVjbGltaXQ6IENPTFVNTi5JOCxcbiAgICAgIGJhc2Vjb3N0OiBDT0xVTU4uVTE2LFxuICAgICAgcmNvc3Q6IENPTFVNTi5JOCxcbiAgICAgIHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHJlc3NpemU6IENPTFVNTi5VOCxcbiAgICAgIGhwOiBDT0xVTU4uVTE2LFxuICAgICAgcHJvdDogQ09MVU1OLlU4LFxuICAgICAgbXI6IENPTFVNTi5VOCxcbiAgICAgIG1vcjogQ09MVU1OLlU4LFxuICAgICAgc3RyOiBDT0xVTU4uVTgsXG4gICAgICBhdHQ6IENPTFVNTi5VOCxcbiAgICAgIGRlZjogQ09MVU1OLlU4LFxuICAgICAgcHJlYzogQ09MVU1OLlU4LFxuICAgICAgZW5jOiBDT0xVTU4uVTgsXG4gICAgICBtYXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBhcDogQ09MVU1OLlU4LFxuICAgICAgYW1iaWRleHRyb3VzOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudG1ucjogQ09MVU1OLlUxNixcbiAgICAgIHNraWxsZWRyaWRlcjogQ09MVU1OLlU4LFxuICAgICAgcmVpbnZpZ29yYXRpb246IENPTFVNTi5VOCxcbiAgICAgIGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgdW5kZWFkbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2xlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBtYXhhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBoYW5kOiBDT0xVTU4uVTgsXG4gICAgICBoZWFkOiBDT0xVTU4uVTgsXG4gICAgICBtaXNjOiBDT0xVTU4uVTgsXG4gICAgICBwYXRoY29zdDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRkb206IENPTFVNTi5VOCxcbiAgICAgIGJvbnVzc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBGOiBDT0xVTU4uVTgsXG4gICAgICBBOiBDT0xVTU4uVTgsXG4gICAgICBXOiBDT0xVTU4uVTgsXG4gICAgICBFOiBDT0xVTU4uVTgsXG4gICAgICBTOiBDT0xVTU4uVTgsXG4gICAgICBEOiBDT0xVTU4uVTgsXG4gICAgICBOOiBDT0xVTU4uVTgsXG4gICAgICBHOiBDT0xVTU4uVTgsXG4gICAgICBCOiBDT0xVTU4uVTgsXG4gICAgICBIOiBDT0xVTU4uVTgsXG4gICAgICBzYWlsaW5nc2hpcHNpemU6IENPTFVNTi5VMTYsXG4gICAgICBzYWlsaW5nbWF4dW5pdHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHN0ZWFsdGh5OiBDT0xVTU4uVTgsXG4gICAgICBwYXRpZW5jZTogQ09MVU1OLlU4LFxuICAgICAgc2VkdWNlOiBDT0xVTU4uVTgsXG4gICAgICBzdWNjdWJ1czogQ09MVU1OLlU4LFxuICAgICAgY29ycnVwdDogQ09MVU1OLlU4LFxuICAgICAgaG9tZXNpY2s6IENPTFVNTi5VOCxcbiAgICAgIGZvcm1hdGlvbmZpZ2h0ZXI6IENPTFVNTi5JOCxcbiAgICAgIHN0YW5kYXJkOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJhdGlvbmFsOiBDT0xVTU4uSTgsXG4gICAgICB0YXNrbWFzdGVyOiBDT0xVTU4uVTgsXG4gICAgICBiZWFzdG1hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYm9keWd1YXJkOiBDT0xVTU4uVTgsXG4gICAgICB3YXRlcmJyZWF0aGluZzogQ09MVU1OLlUxNixcbiAgICAgIGljZXByb3Q6IENPTFVNTi5VOCxcbiAgICAgIGludnVsbmVyYWJsZTogQ09MVU1OLlU4LFxuICAgICAgc2hvY2tyZXM6IENPTFVNTi5JOCxcbiAgICAgIGZpcmVyZXM6IENPTFVNTi5JOCxcbiAgICAgIGNvbGRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHBvaXNvbnJlczogQ09MVU1OLlU4LFxuICAgICAgYWNpZHJlczogQ09MVU1OLkk4LFxuICAgICAgdm9pZHNhbml0eTogQ09MVU1OLlU4LFxuICAgICAgZGFya3Zpc2lvbjogQ09MVU1OLlU4LFxuICAgICAgYW5pbWFsYXdlOiBDT0xVTU4uVTgsXG4gICAgICBhd2U6IENPTFVNTi5VOCxcbiAgICAgIGhhbHRoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyOiBDT0xVTU4uVTgsXG4gICAgICBiZXJzZXJrOiBDT0xVTU4uVTgsXG4gICAgICBjb2xkOiBDT0xVTU4uVTgsXG4gICAgICBoZWF0OiBDT0xVTU4uVTgsXG4gICAgICBmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBiYW5lZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZGFtYWdlcmV2OiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25jbG91ZDogQ09MVU1OLlU4LFxuICAgICAgZGlzZWFzZWNsb3VkOiBDT0xVTU4uVTgsXG4gICAgICBzbGltZXI6IENPTFVNTi5VOCxcbiAgICAgIG1pbmRzbGltZTogQ09MVU1OLlUxNixcbiAgICAgIHJlZ2VuZXJhdGlvbjogQ09MVU1OLlU4LFxuICAgICAgcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uYXJtb3I6IENPTFVNTi5VOCxcbiAgICAgIGV5ZWxvc3M6IENPTFVNTi5VOCxcbiAgICAgIGV0aHRydWU6IENPTFVNTi5VOCxcbiAgICAgIHN0b3JtcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgY29sZHBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBkYXJrcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHdpbnRlcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBzcHJpbmdwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3VtbWVycG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZhbGxwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZm9yZ2Vib251czogQ09MVU1OLlU4LFxuICAgICAgZml4Zm9yZ2Vib251czogQ09MVU1OLkk4LFxuICAgICAgbWFzdGVyc21pdGg6IENPTFVNTi5JOCxcbiAgICAgIHJlc291cmNlczogQ09MVU1OLlU4LFxuICAgICAgYXV0b2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgYXV0b2Rpc2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgbm9iYWRldmVudHM6IENPTFVNTi5VOCxcbiAgICAgIGluc2FuZTogQ09MVU1OLlU4LFxuICAgICAgc2hhdHRlcmVkc291bDogQ09MVU1OLlU4LFxuICAgICAgbGVwZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcmVjOiBDT0xVTU4uVTgsXG4gICAgICBwaWxsYWdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHBhdHJvbGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBjYXN0bGVkZWY6IENPTFVNTi5VOCxcbiAgICAgIHNpZWdlYm9udXM6IENPTFVNTi5JMTYsXG4gICAgICBpbmNwcm92ZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzdXBwbHlib251czogQ09MVU1OLlU4LFxuICAgICAgaW5jdW5yZXN0OiBDT0xVTU4uSTE2LFxuICAgICAgcG9wa2lsbDogQ09MVU1OLlUxNixcbiAgICAgIHJlc2VhcmNoYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIGluc3BpcmluZ3JlczogQ09MVU1OLkk4LFxuICAgICAgZG91c2U6IENPTFVNTi5VOCxcbiAgICAgIGFkZXB0c2FjcjogQ09MVU1OLlU4LFxuICAgICAgY3Jvc3NicmVlZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWtlcGVhcmxzOiBDT0xVTU4uVTgsXG4gICAgICB2b2lkc3VtOiBDT0xVTU4uVTgsXG4gICAgICBoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBlbGVnaXN0OiBDT0xVTU4uVTgsXG4gICAgICBzaGFwZWNoYW5nZTogQ09MVU1OLlUxNixcbiAgICAgIGZpcnN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBzZWNvbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGxhbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHdhdGVyc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBmb3Jlc3RzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHBsYWluc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB4cHNoYXBlOiBDT0xVTU4uVTgsXG4gICAgICBuYW1ldHlwZTogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uOiBDT0xVTU4uSTE2LFxuICAgICAgbl9zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMTogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yMDogQ09MVU1OLkkxNixcbiAgICAgIGJsb29kdmVuZ2VhbmNlOiBDT0xVTU4uVTgsXG4gICAgICBicmluZ2Vyb2Zmb3J0dW5lOiBDT0xVTU4uSTgsXG4gICAgICByZWFsbTE6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMzogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNDogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMWQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0yZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTNkNjogQ09MVU1OLkkxNixcbiAgICAgIGJhdHN0YXJ0c3VtNGQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW01ZDY6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtNmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgdHVybW9pbHN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRoZmlyZTogQ09MVU1OLlU4LFxuICAgICAgdXdyZWdlbjogQ09MVU1OLlU4LFxuICAgICAgc2hyaW5raHA6IENPTFVNTi5VOCxcbiAgICAgIGdyb3docDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpbmdhZmY6IENPTFVNTi5VMzIsXG4gICAgICBmaXhlZHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICBsYW1pYWxvcmQ6IENPTFVNTi5VOCxcbiAgICAgIHByZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBkcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgbXVtbWlmeTogQ09MVU1OLlUxNixcbiAgICAgIG9uZWJhdHRsZXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgYWlyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBlYXJ0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRoYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbmF0dXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEY6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0VzogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdEU6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RTOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0RDogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdE46IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBTEw6IENPTFVNTi5JOCxcbiAgICAgIGV5ZXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWVhdGVyOiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25za2luOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGl0ZW06IENPTFVNTi5VOCxcbiAgICAgIGJhdHRsZXN1bTU6IENPTFVNTi5VMTYsXG4gICAgICBhY2lkc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBwcm9waGV0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBob3Jyb3I6IENPTFVNTi5VOCxcbiAgICAgIGxhdGVoZXJvOiBDT0xVTU4uVTgsXG4gICAgICB1d2RhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgbGFuZGRhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgcnBjb3N0OiBDT0xVTU4uVTMyLFxuICAgICAgcmFuZDU6IENPTFVNTi5VOCxcbiAgICAgIG5icjU6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s1OiBDT0xVTU4uVTE2LFxuICAgICAgcmFuZDY6IENPTFVNTi5VOCxcbiAgICAgIG5icjY6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s2OiBDT0xVTU4uVTE2LFxuICAgICAgbXVtbWlmaWNhdGlvbjogQ09MVU1OLlUxNixcbiAgICAgIGRpc2Vhc2VyZXM6IENPTFVNTi5VOCxcbiAgICAgIHJhaXNlb25raWxsOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZXNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2VuZGxlc3NlcmhvcnJvcm11bHQ6IENPTFVNTi5VOCxcbiAgICAgIGluY29ycG9yYXRlOiBDT0xVTU4uVTgsXG4gICAgICBibGVzc2JlcnM6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlYXR0YWNrZXI6IENPTFVNTi5VOCxcbiAgICAgIHV3aGVhdDogQ09MVU1OLlU4LFxuICAgICAgc2xvdGhyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9yZGVzZXJ0ZXI6IENPTFVNTi5VOCxcbiAgICAgIHNvcmNlcnlyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgb2xkZXI6IENPTFVNTi5JOCxcbiAgICAgIGRpc2JlbGlldmU6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYXN0cmFscmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBiZWFydGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBob3JzZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgcmVpbmNhcm5hdGlvbjogQ09MVU1OLlU4LFxuICAgICAgd29sZnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYm9hcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgc2xlZXBhdXJhOiBDT0xVTU4uVTgsXG4gICAgICBzbmFrZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYXBwZXRpdGU6IENPTFVNTi5JOCxcbiAgICAgIHRlbXBsZXRyYWluZXI6IENPTFVNTi5VOCxcbiAgICAgIGluZmVybm9yZXQ6IENPTFVNTi5VOCxcbiAgICAgIGtva3l0b3NyZXQ6IENPTFVNTi5VOCxcbiAgICAgIGFkZHJhbmRvbWFnZTogQ09MVU1OLlUxNixcbiAgICAgIHVuc3VycjogQ09MVU1OLlU4LFxuICAgICAgc3BlY2lhbGxvb2s6IENPTFVNTi5VOCxcbiAgICAgIGJ1Z3JlZm9ybTogQ09MVU1OLlU4LFxuICAgICAgb25pc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBzdW5hd2U6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWZmOiBDT0xVTU4uVTgsXG4gICAgICBpdnlsb3JkOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2Q6IENPTFVNTi5VOCxcbiAgICAgIHRyaXBsZWdvZG1hZzogQ09MVU1OLlU4LFxuICAgICAgZm9ydGtpbGw6IENPTFVNTi5VOCxcbiAgICAgIHRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBlbnRhbmdsZTogQ09MVU1OLlU4LFxuICAgICAgYWxjaGVteTogQ09MVU1OLlU4LFxuICAgICAgd291bmRmZW5kOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWFybXk6IENPTFVNTi5JOCxcbiAgICAgIHN1bW1vbjU6IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRocGFyYWx5emU6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWNvbnN0cnVjdDogQ09MVU1OLlU4LFxuICAgICAgZ3VhcmRpYW5zcGlyaXRtb2RpZmllcjogQ09MVU1OLkk4LFxuICAgICAgaWNlZm9yZ2luZzogQ09MVU1OLlU4LFxuICAgICAgY2xvY2t3b3JrbG9yZDogQ09MVU1OLlU4LFxuICAgICAgbWluc2l6ZWxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgaXJvbnZ1bDogQ09MVU1OLlU4LFxuICAgICAgaGVhdGhlbnN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgcG93ZXJvZmRlYXRoOiBDT0xVTU4uVTgsXG4gICAgICByZWZvcm10aW1lOiBDT0xVTU4uSTgsXG4gICAgICB0d2ljZWJvcm46IENPTFVNTi5VMTYsXG4gICAgICB0bXBhc3RyYWxnZW1zOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGhlcm9hYjogQ09MVU1OLlU4LFxuICAgICAgdXdmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBzYWx0dnVsOiBDT0xVTU4uVTgsXG4gICAgICBsYW5kZW5jOiBDT0xVTU4uVTgsXG4gICAgICBwbGFndWVkb2N0b3I6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlbHVja3NoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZmFydGhyb25la2lsbDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9ybWFyazogQ09MVU1OLlU4LFxuICAgICAgYWxscmV0OiBDT0xVTU4uVTgsXG4gICAgICBhY2lkZGlnZXN0OiBDT0xVTU4uVTgsXG4gICAgICBiZWNrb246IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcmJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBjYXJjYXNzY29sbGVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kY29sbGFyOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudGFpbnJlYzogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBzcGVsbHM6IENPTFVNTi5VOCxcbiAgICAgIGVuY2hyZWJhdGU1MDogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uMTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmRvbXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmlmeTogQ09MVU1OLlU4LFxuICAgICAgLy9qdXN0IGEgY29weSBvZiByZWFuaW1hdG9yLi4uXG4gICAgICAvLydyZWFuaW1hdG9yfjEnOiBDT0xVTU4uVTgsXG4gICAgICBkZWZlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0xZDM6IENPTFVNTi5VMTYsXG4gICAgICBlbmNocmViYXRlMTA6IENPTFVNTi5VOCxcbiAgICAgIHVuZHlpbmc6IENPTFVNTi5VOCxcbiAgICAgIG1vcmFsZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICB1bmN1cmFibGVhZmZsaWN0aW9uOiBDT0xVTU4uVTMyLFxuICAgICAgd2ludGVyc3VtbW9uMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgc3R5Z2lhbmd1aWRlOiBDT0xVTU4uVTgsXG4gICAgICBzbWFydG1vdW50OiBDT0xVTU4uVTgsXG4gICAgICByZWZvcm1pbmdmbGVzaDogQ09MVU1OLlU4LFxuICAgICAgZmVhcm9mdGhlZmxvb2Q6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZXN0aXRjaGVyOiBDT0xVTU4uVTgsXG4gICAgICByZWNvbnN0cnVjdGlvbjogQ09MVU1OLlU4LFxuICAgICAgbm9mcmlkZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjb3JpZGVybW5yOiBDT0xVTU4uVTE2LFxuICAgICAgaG9seWNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hdGVtbnI6IENPTFVNTi5VMTYsXG4gICAgICBsaWNoOiBDT0xVTU4uVTE2LFxuICAgICAgZXJhc3RhcnRhZ2VpbmNyZWFzZTogQ09MVU1OLlUxNixcbiAgICAgIG1vcmVvcmRlcjogQ09MVU1OLkk4LFxuICAgICAgbW9yZWdyb3d0aDogQ09MVU1OLkk4LFxuICAgICAgbW9yZXByb2Q6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVoZWF0OiBDT0xVTU4uSTgsXG4gICAgICBtb3JlbHVjazogQ09MVU1OLkk4LFxuICAgICAgbW9yZW1hZ2ljOiBDT0xVTU4uSTgsXG4gICAgICBub2Ztb3VudHM6IENPTFVNTi5VOCxcbiAgICAgIGZhbHNlZGFtYWdlcmVjb3Zlcnk6IENPTFVNTi5VOCxcbiAgICAgIHV3cGF0aGJvb3N0OiBDT0xVTU4uSTgsXG4gICAgICByYW5kb21pdGVtczogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRoc2xpbWVleHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHBvaXNvbmV4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRoc2hvY2tleHBsOiBDT0xVTU4uVTgsXG4gICAgICBkcmF3c2l6ZTogQ09MVU1OLkk4LFxuICAgICAgcGV0cmlmaWNhdGlvbmltbXVuZTogQ09MVU1OLlU4LFxuICAgICAgc2NhcnNvdWxzOiBDT0xVTU4uVTgsXG4gICAgICBzcGlrZWJhcmJzOiBDT0xVTU4uVTgsXG4gICAgICBwcmV0ZW5kZXJzdGFydHNpdGU6IENPTFVNTi5VMTYsXG4gICAgICBvZmZzY3JpcHRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgdW5tb3VudGVkc3ByOiBDT0xVTU4uVTMyLFxuICAgICAgZXhoYXVzdGlvbjogQ09MVU1OLlU4LFxuICAgICAgLy8gbW91bnRlZDogQ09MVU1OLkJPT0wsIC8vIGRlcHJlY2F0ZWRcbiAgICAgIGJvdzogQ09MVU1OLkJPT0wsXG4gICAgICBib2R5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZvb3Q6IENPTFVNTi5CT09MLFxuICAgICAgY3Jvd25vbmx5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGhvbHk6IENPTFVNTi5CT09MLFxuICAgICAgaW5xdWlzaXRvcjogQ09MVU1OLkJPT0wsXG4gICAgICBpbmFuaW1hdGU6IENPTFVNTi5CT09MLFxuICAgICAgdW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3RvbmViZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBhbmltYWw6IENPTFVNTi5CT09MLFxuICAgICAgY29sZGJsb29kOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZlbWFsZTogQ09MVU1OLkJPT0wsXG4gICAgICBmb3Jlc3RzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGFpbnN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhc3Rlc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgc3dhbXBzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBhcXVhdGljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBwb29yYW1waGliaWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZsb2F0OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZseWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdG9ybWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB0ZWxlcG9ydDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vYmlsZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JpdmVycGFzczogQ09MVU1OLkJPT0wsXG4gICAgICBpbGx1c2lvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHk6IENPTFVNTi5CT09MLFxuICAgICAgYXNzYXNzaW46IENPTFVNTi5CT09MLFxuICAgICAgaGVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkb21pbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBub2hlYWw6IENPTFVNTi5CT09MLFxuICAgICAgbmVlZG5vdGVhdDogQ09MVU1OLkJPT0wsXG4gICAgICB1bmRpc2NpcGxpbmVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXNocmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsdW50cmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBpZXJjZXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibGluZDogQ09MVU1OLkJPT0wsXG4gICAgICBwZXRyaWZ5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGV0aGVyZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlYXRoY3Vyc2U6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmFtcHN3YWxsb3c6IENPTFVNTi5CT09MLFxuICAgICAgdGF4Y29sbGVjdG9yOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWluaW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuaXF1ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzY2FsZXdhbGxzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWluczogQ09MVU1OLkJPT0wsXG4gICAgICBoZWF0cmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRyZWM6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkY2hhb3M6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZGVhdGg6IENPTFVNTi5CT09MLFxuICAgICAgYnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHV3YnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZG9yZGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGdyb3d0aDogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRkb206IENPTFVNTi5CT09MLFxuICAgICAgZHJha2U6IENPTFVNTi5CT09MLFxuICAgICAgdGhlZnRvZnRoZXN1bmF3ZTogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFnb25sb3JkOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbmR2ZXNzZWw6IENPTFVNTi5CT09MLFxuICAgICAgZWxlbWVudHJhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzdHJhbGZldHRlcnM6IENPTFVNTi5CT09MLFxuICAgICAgY29tYmF0Y2FzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpc2luZ2xlcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vd2lzaDogQ09MVU1OLkJPT0wsXG4gICAgICBtYXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcGlyaXRzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBvd25ibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBpbnZpc2libGU6IENPTFVNTi5CT09MLFxuICAgICAgc3BlbGxzaW5nZXI6IENPTFVNTi5CT09MLFxuICAgICAgbWFnaWNzdHVkeTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmlwbGUzbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHllYXJ0dXJuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVudGVsZXBvcnRhYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlYW5pbXByaWVzdDogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVuaW1tdW5pdHk6IENPTFVNTi5CT09MLFxuICAgICAgc2luZ2xlYmF0dGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlc2VhcmNod2l0aG91dG1hZ2ljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9jb21wZXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFkdmVudHVyZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsZWFuc2hhcGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVxbGFiOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcXRlbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICBob3Jyb3JtYXJrZWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhc2hhaDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2F5YXphZDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2FkYWV2YTogQ09MVU1OLkJPT0wsXG4gICAgICBibGVzc2ZseTogQ09MVU1OLkJPT0wsXG4gICAgICBwbGFudDogQ09MVU1OLkJPT0wsXG4gICAgICBjb21zbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbm93bW92ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzd2ltbWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVwaWQ6IENPTFVNTi5CT09MLFxuICAgICAgc2tpcm1pc2hlcjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnNlZW46IENPTFVNTi5CT09MLFxuICAgICAgbm9tb3ZlcGVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdvbGY6IENPTFVNTi5CT09MLFxuICAgICAgZHVuZ2VvbjogQ09MVU1OLkJPT0wsXG4gICAgICBhYm9sZXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGxvY2Fsc3VuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRtcGZpcmVnZW1zOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlZmlsZXI6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRlZGJlc2VyazogQ09MVU1OLkJPT0wsXG4gICAgICBsYW5jZW9rOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbnByaXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBocG92ZXJmbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIGluZGVwc3RheTogQ09MVU1OLkJPT0wsXG4gICAgICBwb2x5aW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vcmFuZ2U6IENPTFVNTi5CT09MLFxuICAgICAgbm9ob2Y6IENPTFVNTi5CT09MLFxuICAgICAgYXV0b2JsZXNzZWQ6IENPTFVNTi5CT09MLFxuICAgICAgYWxtb3N0dW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRydWVzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBtb2JpbGVhcmNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0Zm9ybTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNtYXN0ZXI6IENPTFVNTi5CT09MLFxuICAgICAgdGlnaHRyZWluOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXJtYW46IENPTFVNTi5CT09MLFxuICAgICAgZGl2aW5lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbm9mYWxsZG1nOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZpcmVlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpcmVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgd2F0ZXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVhcnRoZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBwb3BzcHk6IENPTFVNTi5CT09MLFxuICAgICAgY2FwaXRhbGhvbWU6IENPTFVNTi5CT09MLFxuICAgICAgY2x1bXN5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlZ2Fpbm1vdW50OiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vYmFyZGluZzogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGlzY29tOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vdGhyb3dvZmY6IENPTFVNTi5CT09MLFxuICAgICAgYmlyZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWNheXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBjdWJtb3RoZXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2xhbW91cjogQ09MVU1OLkJPT0wsXG4gICAgICBnZW1wcm9kOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgZml4ZWRuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgIH0sXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIHR5cGU6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IHNkSW5kZXggPSBhcmdzLnJhd0ZpZWxkc1snc3RhcnRkb20nXTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAndHlwZScsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7XG4gICAgICAgICAgICAvLyBoYXZlIHRvIGZpbGwgaW4gbW9yZSBzdHVmZiBsYXRlciwgd2hlbiB3ZSBqb2luIHJlYyB0eXBlcywgb2ggd2VsbFxuICAgICAgICAgICAgLy8gb3RoZXIgdHlwZXM6IGNvbW1hbmRlciwgbWVyY2VuYXJ5LCBoZXJvLCBldGNcbiAgICAgICAgICAgIGlmICh1W3NkSW5kZXhdKSByZXR1cm4gMzsgLy8gZ29kICsgY29tbWFuZGVyXG4gICAgICAgICAgICBlbHNlIHJldHVybiAwOyAvLyBqdXN0IGEgdW5pdFxuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBhcm1vcjogKGluZGV4OiBudW1iZXIsIGFyZ3M6IFNjaGVtYUFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IE9iamVjdC5lbnRyaWVzKGFyZ3MucmF3RmllbGRzKVxuICAgICAgICAgIC5maWx0ZXIoZSA9PiBlWzBdLm1hdGNoKC9eYXJtb3JcXGQkLykpXG4gICAgICAgICAgLm1hcCgoZSkgPT4gZVsxXSk7XG5cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICdhcm1vcicsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlUxNl9BUlJBWSxcbiAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7XG4gICAgICAgICAgICBjb25zdCBhcm1vcnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSBhcm1vcnMucHVzaChOdW1iZXIodVtpXSkpO1xuICAgICAgICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFybW9ycztcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICB3ZWFwb25zOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL153cG5cXGQkLykpXG4gICAgICAgICAgLm1hcCgoZSkgPT4gZVsxXSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAnd2VhcG9ucycsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlUxNl9BUlJBWSxcbiAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7XG4gICAgICAgICAgICBjb25zdCB3cG5zOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGluZGljZXMpIHtcblxuICAgICAgICAgICAgICBpZiAodVtpXSkgd3Bucy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3BucztcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAnJmN1c3RvbW1hZ2ljJzogKGluZGV4OiBudW1iZXIsIGFyZ3M6IFNjaGVtYUFyZ3MpID0+IHtcblxuICAgICAgICBjb25zdCBDTV9LRVlTID0gWzEsMiwzLDQsNSw2XS5tYXAobiA9PlxuICAgICAgICAgIGByYW5kIG5iciBtYXNrYC5zcGxpdCgnICcpLm1hcChrID0+IGFyZ3MucmF3RmllbGRzW2Ake2t9JHtufWBdKVxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyh7IENNX0tFWVMgfSlcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAnJmN1c3RvbW1hZ2ljJywgLy8gUEFDS0VEIFVQXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlUzMl9BUlJBWSxcbiAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7XG4gICAgICAgICAgICBjb25zdCBjbTogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgSyBvZiBDTV9LRVlTKSB7XG4gICAgICAgICAgICAgIGNvbnN0IFtyYW5kLCBuYnIsIG1hc2tdID0gSy5tYXAoaSA9PiB1W2ldKTtcbiAgICAgICAgICAgICAgaWYgKCFyYW5kKSBicmVhaztcbiAgICAgICAgICAgICAgaWYgKG5iciA+IDYzKSB0aHJvdyBuZXcgRXJyb3IoJ2Zmcy4uLicpO1xuICAgICAgICAgICAgICBjb25zdCBiID0gbWFzayA+PiA3O1xuICAgICAgICAgICAgICBjb25zdCBuID0gbmJyIDw8IDEwO1xuICAgICAgICAgICAgICBjb25zdCByID0gcmFuZCA8PCAxNjtcbiAgICAgICAgICAgICAgY20ucHVzaChyIHwgbiB8IGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNtO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgICBvdmVycmlkZXM6IHtcbiAgICAgIC8vIGNzdiBoYXMgdW5yZXN0L3R1cm4gd2hpY2ggaXMgaW5jdW5yZXN0IC8gMTA7IGNvbnZlcnQgdG8gaW50IGZvcm1hdFxuICAgICAgaW5jdW5yZXN0OiAodikgPT4ge1xuICAgICAgICByZXR1cm4gKE51bWJlcih2KSAqIDEwKSB8fCAwXG4gICAgICB9XG4gICAgfSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VJLmNzdic6IHtcbiAgICBuYW1lOiAnSXRlbScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCcsICdpdGVtY29zdDF+MScsICd3YXJuaW5nfjEnXSksXG4gIH0sXG5cbiAgJy4uLy4uL2dhbWVkYXRhL01hZ2ljU2l0ZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdNYWdpY1NpdGUnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydkb21jb25mbGljdH4xJywnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvTWVyY2VuYXJ5LmNzdic6IHtcbiAgICBuYW1lOiAnTWVyY2VuYXJ5JyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYWZmbGljdGlvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBZmZsaWN0aW9uJyxcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hbm9uX3Byb3ZpbmNlX2V2ZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0Fub25Qcm92aW5jZUV2ZW50JyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hcm1vcnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBcm1vcicsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZV9rZXlzLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlS2V5JyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X2FybW9yLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlBcm1vcicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9zcGVsbC5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5U3BlbGwnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfd2VhcG9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlXZWFwb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzFfdHlwZXMuY3N2Jzoge1xuICAgIC8vIFRPRE8gLSBnb3Qgc29tZSBiaWcgYm9pcyBpbiBoZXJlLlxuICAgIG5hbWU6ICdCdWZmQml0MScsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzJfdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdCdWZmQml0MicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0X21vZGlmaWVyX2JpdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbEJpdCcsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfaW5mby5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnU3BlbGxFZmZlY3RJbmZvJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2Jzoge1xuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgbmFtZTogJ0VmZmVjdFNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RXZWFwb24nLFxuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZW5jaGFudG1lbnRzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdFbmNoYW50bWVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2V2ZW50cy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYWdpY19wYXRocy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdNYWdpY1BhdGgnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYXBfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdUZXJyYWluVHlwZUJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21vbnN0ZXJfdGFncy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdNb25zdGVyVGFnJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmFtZXR5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hbWVUeXBlJyxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hdGlvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnTmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL290aGVyX3BsYW5lcy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnT3RoZXJQbGFuZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3ByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1ByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJvdGVjdGlvbnNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1Byb3RlY3Rpb25CeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9yZWFsbXMuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1JlYWxtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc2l0ZV90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTaXRlVGVycmFpblR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX2RhbWFnZV90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBuYW1lOiAnU3BlY2lhbERhbWFnZVR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX3VuaXF1ZV9zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbFVuaXF1ZVN1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGwnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS90ZXJyYWluX3NwZWNpZmljX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdUZXJyYWluU3BlY2lmaWNTdW1tb24nLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VuaXRfZWZmZWN0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXRFZmZlY3QnLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VucHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgbmFtZTogJ1VucHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS93ZWFwb25zLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ1dlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ3dlYXBvbiddKSxcbiAgfSxcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzLCBSb3cgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7XG4gIFNjaGVtYSxcbiAgVGFibGUsXG4gIENPTFVNTixcbiAgYXJnc0Zyb21UZXh0LFxuICBhcmdzRnJvbVR5cGUsXG4gIENvbHVtbkFyZ3MsXG4gIGZyb21BcmdzXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5sZXQgX25leHRBbm9uU2NoZW1hSWQgPSAxO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRDU1YgKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4sXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxudHlwZSBDcmVhdGVFeHRyYUZpZWxkID0gKFxuICBpbmRleDogbnVtYmVyLFxuICBhOiBTY2hlbWFBcmdzLFxuICBuYW1lOiBzdHJpbmcsXG4gIG92ZXJyaWRlPzogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksXG4pID0+IENvbHVtbkFyZ3M7XG5cbmV4cG9ydCB0eXBlIFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgbmFtZTogc3RyaW5nLFxuICBrZXk6IHN0cmluZyxcbiAgaWdub3JlRmllbGRzOiBTZXQ8c3RyaW5nPjtcbiAgc2VwYXJhdG9yOiBzdHJpbmc7XG4gIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+O1xuICBrbm93bkZpZWxkczogUmVjb3JkPHN0cmluZywgQ09MVU1OPixcbiAgZXh0cmFGaWVsZHM6IFJlY29yZDxzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGQ+LFxufVxuXG5jb25zdCBERUZBVUxUX09QVElPTlM6IFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgbmFtZTogJycsXG4gIGtleTogJycsXG4gIGlnbm9yZUZpZWxkczogbmV3IFNldCgpLFxuICBvdmVycmlkZXM6IHt9LFxuICBrbm93bkZpZWxkczoge30sXG4gIGV4dHJhRmllbGRzOiB7fSxcbiAgc2VwYXJhdG9yOiAnXFx0JywgLy8gc3VycHJpc2UhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3ZUb1RhYmxlKFxuICByYXc6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPlxuKTogVGFibGUge1xuICBjb25zdCBfb3B0cyA9IHsgLi4uREVGQVVMVF9PUFRJT05TLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MgPSB7XG4gICAgbmFtZTogX29wdHMubmFtZSxcbiAgICBrZXk6IF9vcHRzLmtleSxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgY29sdW1uczogW10sXG4gICAgZmllbGRzOiBbXSxcbiAgICByYXdGaWVsZHM6IHt9LFxuICAgIG92ZXJyaWRlczogX29wdHMub3ZlcnJpZGVzLFxuICB9O1xuICBpZiAoIXNjaGVtYUFyZ3MubmFtZSkgdGhyb3cgbmV3IEVycm9yKCduYW1lIGlzIHJlcXVyaWVkJyk7XG4gIGlmICghc2NoZW1hQXJncy5rZXkpIHRocm93IG5ldyBFcnJvcigna2V5IGlzIHJlcXVyaWVkJyk7XG5cbiAgaWYgKHJhdy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHRocm93IG5ldyBFcnJvcigndWggb2gnKVxuXG4gIGNvbnN0IFtyYXdGaWVsZHMsIC4uLnJhd0RhdGFdID0gcmF3XG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcbiAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdChfb3B0cy5zZXBhcmF0b3IpKTtcblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn1+JHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF3Q29sdW1uczogQ29sdW1uQXJnc1tdID0gW107XG4gIGZvciAoY29uc3QgW2luZGV4LCBuYW1lXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgbGV0IGM6IG51bGwgfCBDb2x1bW5BcmdzID0gbnVsbDtcbiAgICBzY2hlbWFBcmdzLnJhd0ZpZWxkc1tuYW1lXSA9IGluZGV4O1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgaWYgKF9vcHRzLmtub3duRmllbGRzW25hbWVdKSB7XG4gICAgICBjID0gYXJnc0Zyb21UeXBlKFxuICAgICAgICBuYW1lLFxuICAgICAgICBfb3B0cy5rbm93bkZpZWxkc1tuYW1lXSxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGMgPSBhcmdzRnJvbVRleHQoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgICAgIHJhd0RhdGEsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hQXJncy5uYW1lfTogXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfVxceDFiWzBtYCxcbiAgICAgICAgICAgIGV4XG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGV4XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgIHJhd0NvbHVtbnMucHVzaChjKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucz8uZXh0cmFGaWVsZHMpIHtcbiAgICBjb25zdCBiaSA9IE9iamVjdC52YWx1ZXMoc2NoZW1hQXJncy5yYXdGaWVsZHMpLmxlbmd0aDsgLy8gaG1tbW1cbiAgICByYXdDb2x1bW5zLnB1c2goLi4uT2JqZWN0LmVudHJpZXMob3B0aW9ucy5leHRyYUZpZWxkcykubWFwKFxuICAgICAgKFtuYW1lLCBjcmVhdGVDb2x1bW5dOiBbc3RyaW5nLCBDcmVhdGVFeHRyYUZpZWxkXSwgZWk6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGVpLCBzY2hlbWFBcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGVpO1xuICAgICAgICBjb25zdCBjYSA9IGNyZWF0ZUNvbHVtbihpbmRleCwgc2NoZW1hQXJncywgbmFtZSwgb3ZlcnJpZGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChjYS5pbmRleCAhPT0gaW5kZXgpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBpbmRleCcpO1xuICAgICAgICAgIGlmIChjYS5uYW1lICE9PSBuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3dpc2VndXkgcGlja2VkIGhpcyBvd24gbmFtZScpO1xuICAgICAgICAgIGlmIChjYS50eXBlID09PSBDT0xVTU4uQk9PTCkge1xuICAgICAgICAgICAgaWYgKGNhLmJpdCAhPT0gc2NoZW1hQXJncy5mbGFnc1VzZWQpIHRocm93IG5ldyBFcnJvcigncGlzcyBiYWJ5IGlkaW90Jyk7XG4gICAgICAgICAgICBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjYSwgeyBpbmRleCwgb3ZlcnJpZGUsIG5hbWUsIH0pXG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZGF0YTogUm93W10gPSBuZXcgQXJyYXkocmF3RGF0YS5sZW5ndGgpXG4gICAgLmZpbGwobnVsbClcbiAgICAubWFwKChfLCBfX3Jvd0lkKSA9PiAoeyBfX3Jvd0lkIH0pKVxuICAgIDtcblxuICBmb3IgKGNvbnN0IGNvbEFyZ3Mgb2YgcmF3Q29sdW1ucykge1xuICAgIGNvbnN0IGNvbCA9IGZyb21BcmdzKGNvbEFyZ3MpO1xuICAgIHNjaGVtYUFyZ3MuY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgc2NoZW1hQXJncy5maWVsZHMucHVzaChjb2wubmFtZSk7XG4gIH1cblxuICBpZiAoc2NoZW1hQXJncy5rZXkgIT09ICdfX3Jvd0lkJyAmJiAhc2NoZW1hQXJncy5maWVsZHMuaW5jbHVkZXMoc2NoZW1hQXJncy5rZXkpKVxuICAgIHRocm93IG5ldyBFcnJvcihgZmllbGRzIGlzIG1pc3NpbmcgdGhlIHN1cHBsaWVkIGtleSBcIiR7c2NoZW1hQXJncy5rZXl9XCJgKTtcblxuICBmb3IgKGNvbnN0IGNvbCBvZiBzY2hlbWFBcmdzLmNvbHVtbnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgZGF0YSlcbiAgICAgIGRhdGFbci5fX3Jvd0lkXVtjb2wubmFtZV0gPSBjb2wuZnJvbVRleHQoXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXVtjb2wuaW5kZXhdLFxuICAgICAgICByYXdEYXRhW3IuX19yb3dJZF0sXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IFBhcnNlU2NoZW1hT3B0aW9ucywgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbkR1bXBlZCB9IGZyb20gJy4vam9pbi10YWJsZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuZnVuY3Rpb24gZmluZERlZiAobmFtZTogc3RyaW5nKTogW3N0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XSB7XG4gIGlmIChjc3ZEZWZzW25hbWVdKSByZXR1cm4gW25hbWUsIGNzdkRlZnNbbmFtZV1dO1xuICBmb3IgKGNvbnN0IGsgaW4gY3N2RGVmcykge1xuICAgIGNvbnN0IGQgPSBjc3ZEZWZzW2tdO1xuICAgIGlmIChkLm5hbWUgPT09IG5hbWUpIHJldHVybiBbaywgZF07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBjc3YgZGVmaW5lZCBmb3IgXCIke25hbWV9XCJgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcE9uZShrZXk6IHN0cmluZykge1xuICBjb25zdCB0YWJsZSA9IGF3YWl0IHJlYWRDU1YoLi4uZmluZERlZihrZXkpKTtcbiAgY29tcGFyZUR1bXBzKHRhYmxlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcEFsbCAoKSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICAvLyBKT0lOU1xuICBqb2luRHVtcGVkKHRhYmxlcyk7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLjMwLmJpbidcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXBhcmVEdW1wcyh0OiBUYWJsZSkge1xuICBjb25zdCBtYXhOID0gdC5yb3dzLmxlbmd0aCAtIDMwXG4gIGxldCBuOiBudW1iZXI7XG4gIGxldCBwOiBhbnkgPSB1bmRlZmluZWQ7XG4gIGlmIChmaWVsZHNbMF0gPT09ICdGSUxURVInKSB7XG4gICAgbiA9IDA7IC8vIHdpbGwgYmUgaW5nb3JlZFxuICAgIGZpZWxkcy5zcGxpY2UoMCwgMSwgJ2lkJywgJ25hbWUnKTtcbiAgICBwID0gKHI6IGFueSkgPT4gZmllbGRzLnNsaWNlKDIpLnNvbWUoZiA9PiByW2ZdKTtcbiAgfSBlbHNlIGlmIChmaWVsZHNbMV0gPT09ICdST1cnICYmIGZpZWxkc1syXSkge1xuICAgIG4gPSBOdW1iZXIoZmllbGRzWzJdKSAtIDE1O1xuICAgIGZpZWxkcy5zcGxpY2UoMSwgMilcbiAgICBjb25zb2xlLmxvZyhgZW5zdXJlIHJvdyAke2ZpZWxkc1syXX0gaXMgdmlzaWJsZSAoJHtufSlgKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB0aHJvdyBuZXcgRXJyb3IoJ1JPVyBtdXN0IGJlIE5VTUJFUiEhISEnKTtcbiAgfSBlbHNlIHtcbiAgICBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4TilcbiAgfVxuICBuID0gTWF0aC5taW4obWF4TiwgTWF0aC5tYXgoMCwgbikpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gKGZpZWxkcy5sZW5ndGggPyAoZmllbGRzWzBdID09PSAnQUxMJyA/IHQuc2NoZW1hLmZpZWxkcyA6IGZpZWxkcykgOlxuICAgdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDEwKSkgYXMgc3RyaW5nW11cbiAgZHVtcFRvQ29uc29sZSh0LCBuLCBtLCBmLCAnQkVGT1JFJywgcCk7XG4gIC8qXG4gIGlmICgxICsgMSA9PT0gMikgcmV0dXJuOyAvLyBUT0RPIC0gd2Ugbm90IHdvcnJpZWQgYWJvdXQgdGhlIG90aGVyIHNpZGUgeWV0XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXMoW3RdKTtcbiAgY29uc29sZS5sb2coYG1hZGUgJHtibG9iLnNpemV9IGJ5dGUgYmxvYmApO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgLy8oZ2xvYmFsVGhpcy5fUk9XUyA/Pz0ge30pW3Quc2NoZW1hLm5hbWVdID0gdC5yb3dzO1xuICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBkdW1wVG9Db25zb2xlKHVbdC5zY2hlbWEubmFtZV0sIG4sIG0sIGYsICdBRlRFUicsIHApO1xuICAvL2F3YWl0IHdyaXRlRmlsZSgnLi90bXAuYmluJywgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgKi9cbn1cblxuZnVuY3Rpb24gZHVtcFRvQ29uc29sZShcbiAgdDogVGFibGUsXG4gIG46IG51bWJlcixcbiAgbTogbnVtYmVyLFxuICBmOiBzdHJpbmdbXSxcbiAgaDogc3RyaW5nLFxuICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbikge1xuICBjb25zb2xlLmxvZyhgXFxuICAgICAke2h9OmApO1xuICB0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICBjb25zdCByb3dzID0gdC5wcmludCh3aWR0aCwgZiwgbiwgbSwgcCk7XG4gIGlmIChyb3dzKSBmb3IgKGNvbnN0IHIgb2Ygcm93cykgY29uc29sZS50YWJsZShbcl0pO1xuICBjb25zb2xlLmxvZyhgICAgIC8ke2h9XFxuXFxuYClcbn1cblxuXG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIGR1bXBPbmUoZmlsZSk7XG5lbHNlIGR1bXBBbGwoKTtcblxuXG4iLCAiaW1wb3J0IHsgQm9vbENvbHVtbiwgQ09MVU1OLCBOdW1lcmljQ29sdW1uLCBTY2hlbWEsIFNjaGVtYUFyZ3MsIFRhYmxlIH1cbiAgZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmZ1bmN0aW9uIGZpbmRUYWJsZSAobmFtZTogc3RyaW5nLCB0YWJsZXM6IFRhYmxlW10pOiBUYWJsZSB7XG4gIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIGlmICh0LnNjaGVtYS5uYW1lID09PSBuYW1lKSByZXR1cm4gdDtcbiAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmlsZCB0aGUgdGFibGUgY2FsbGVkIFwiJHtuYW1lfVwiYCk7XG59XG5cbnR5cGUgVFIgPSBSZWNvcmQ8c3RyaW5nLCBUYWJsZT47XG5leHBvcnQgZnVuY3Rpb24gam9pbkR1bXBlZCAodGFibGVMaXN0OiBUYWJsZVtdKSB7XG4gIGNvbnN0IHRhYmxlczogVFIgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVMaXN0Lm1hcCh0ID0+IFt0Lm5hbWUsIHRdKSk7XG4gIHRhYmxlTGlzdC5wdXNoKFxuICAgIG1ha2VOYXRpb25TaXRlcyh0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlTaXRlKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlOYXRpb24odGFibGVzKSxcbiAgICBtYWtlU3BlbGxCeVVuaXQodGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5TmF0aW9uKHRhYmxlcyksXG4gICk7XG5cbn1cblxuXG5jb25zdCBBVFRSX0ZBUlNVTUNPTSA9IDc5MDsgLy8gbHVsIHdoeSBpcyB0aGlzIHRoZSBvbmx5IG9uZT8/XG5cbi8vIFRPRE8gLSByZWFuaW1hdGlvbnMgYXN3ZWxsPyB0d2ljZWJvcm4gdG9vPyBsZW11cmlhLWVzcXVlIGZyZWVzcGF3bj8gdm9pZGdhdGU/XG4vLyBtaWdodCBoYXZlIHRvIGFkZCBhbGwgdGhhdCBtYW51YWxseSwgd2hpY2ggc2hvdWxkIGJlIG9rYXkgc2luY2UgaXQncyBub3QgbGlrZVxuLy8gdGhleSdyZSBhY2Nlc3NpYmxlIHRvIG1vZHMgYW55d2F5XG5leHBvcnQgY29uc3QgZW51bSBSRUNfU1JDIHtcbiAgVU5LTk9XTiA9IDAsIC8vIGkuZS4gbm9uZSBmb3VuZCwgcHJvYmFibHkgaW5kaWUgcGQ/XG4gIFNVTU1PTl9BTExJRVMgPSAxLCAvLyB2aWEgI21ha2Vtb25zdGVyTlxuICBTVU1NT05fRE9NID0gMiwgLy8gdmlhICNbcmFyZV1kb21zdW1tb25OXG4gIFNVTU1PTl9BVVRPID0gMywgLy8gdmlhICNzdW1tb25OIC8gXCJ0dXJtb2lsc3VtbW9uXCIgLyB3aW50ZXJzdW1tb24xZDNcbiAgU1VNTU9OX0JBVFRMRSA9IDQsIC8vIHZpYSAjYmF0c3RhcnRzdW1OIG9yICNiYXR0bGVzdW1cbiAgVEVNUExFX1RSQUlORVIgPSA1LCAvLyB2aWEgI3RlbXBsZXRyYWluZXIsIHZhbHVlIGlzIGhhcmQgY29kZWQgdG8gMTg1OS4uLlxuICBSSVRVQUwgPSA2LFxuICBFTlRFUl9TSVRFID0gNyxcbiAgUkVDX1NJVEUgPSA4LFxuICBSRUNfQ0FQID0gOSxcbiAgUkVDX0ZPUkVJR04gPSAxMCxcbiAgUkVDX0ZPUlQgPSAxMSxcbiAgRVZFTlQgPSAxMixcbiAgSEVSTyA9IDEzLFxuICBQUkVURU5ERVIgPSAxNCxcbn1cblxuICAvKlxuY29uc3QgU1VNX0ZJRUxEUyA9IFtcbiAgLy8gdGhlc2UgdHdvIGNvbWJpbmVkIHNlZW0gdG8gYmUgc3VtbW9uICNtYWtlbW9uc3Rlck5cbiAgJ3N1bW1vbicsICduX3N1bW1vbicsXG4gIC8vIHRoaXMgaXMgdXNlZCBieSB0aGUgZ2hvdWwgbG9yZCBvbmx5LCBhbmQgaXQgc2hvdWxkIGFjdHVhbGx5IGJlIGBuX3N1bW1vbiA9IDVgXG4gICdzdW1tb241JyxcbiAgLy8gYXV0byBzdW1tb24gMS9tb250aCwgYXMgcGVyIG1vZCBjb21tYW5kcywgdXNlZCBvbmx5IGJ5IGZhbHNlIHByb3BoZXQgYW5kIHZpbmUgZ3V5P1xuICAnc3VtbW9uMScsXG5cbiAgLy8gZG9tIHN1bW1vbiBjb21tYW5kc1xuICAnZG9tc3VtbW9uJyxcbiAgJ2RvbXN1bW1vbjInLFxuICAnZG9tc3VtbW9uMjAnLFxuICAncmFyZWRvbXN1bW1vbicsXG5cbiAgJ2JhdHN0YXJ0c3VtMScsXG4gICdiYXRzdGFydHN1bTInLFxuICAnYmF0c3RhcnRzdW0zJyxcbiAgJ2JhdHN0YXJ0c3VtNCcsXG4gICdiYXRzdGFydHN1bTUnLFxuICAnYmF0c3RhcnRzdW0xZDMnLFxuICAnYmF0c3RhcnRzdW0xZDYnLFxuICAnYmF0c3RhcnRzdW0yZDYnLFxuICAnYmF0c3RhcnRzdW0zZDYnLFxuICAnYmF0c3RhcnRzdW00ZDYnLFxuICAnYmF0c3RhcnRzdW01ZDYnLFxuICAnYmF0c3RhcnRzdW02ZDYnLFxuICAnYmF0dGxlc3VtNScsIC8vIHBlciByb3VuZFxuXG4gIC8vJ29uaXN1bW1vbicsIHdlIGRvbnQgcmVhbGx5IGNhcmUgYWJvdXQgdGhpcyBvbmUgYmVjYXVzZSBpdCBkb2VzbnQgdGVsbCB1c1xuICAvLyAgYWJvdXQgd2hpY2ggbW9uc3RlcnMgYXJlIHN1bW1vbmVkXG4gIC8vICdoZWF0aGVuc3VtbW9uJywgaWRmaz8/IGh0dHBzOi8vaWxsd2lraS5jb20vZG9tNS91c2VyL2xvZ2d5L3NsYXZlclxuICAvLyAnY29sZHN1bW1vbicsIHVudXNlZFxuICAnd2ludGVyc3VtbW9uMWQzJywgLy8gdmFtcCBxdWVlbiwgbm90IGFjdHVhbGx5IGEgKGRvY3VtZW50ZWQpIGNvbW1hbmQ/XG5cbiAgJ3R1cm1vaWxzdW1tb24nLCAvLyBhbHNvIG5vdCBhIGNvbW1hbmQgfiAhXG5dXG4qL1xuXG5mdW5jdGlvbiBtYWtlTmF0aW9uU2l0ZXModGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBBdHRyaWJ1dGVCeU5hdGlvbiB9ID0gdGFibGVzO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU2l0ZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDEsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHt9LFxuICAgIGpvaW5zOiAnTmF0aW9uW25hdGlvbklkXStNYWdpY1NpdGVbc2l0ZUlkXScsXG4gICAgZmllbGRzOiBbXG4gICAgICAnbmF0aW9uSWQnLFxuICAgICAgJ3NpdGVJZCcsXG4gICAgICAnZnV0dXJlJyxcbiAgICBdLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ25hdGlvbklkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBCb29sQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ2Z1dHVyZScsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgICAgYml0OiAwLFxuICAgICAgICBmbGFnOiAxXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXVxuICBmb3IgKGxldCBbaSwgcm93XSBvZiBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgbmF0aW9uX251bWJlcjogbmF0aW9uSWQsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlOiBzaXRlSWQgfSA9IHJvdztcbiAgICBsZXQgZnV0dXJlOiBib29sZWFuID0gZmFsc2U7XG4gICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgIGNhc2UgNjMxOlxuICAgICAgICBmdXR1cmUgPSB0cnVlO1xuICAgICAgICAvLyB1IGtub3cgdGhpcyBiaXRjaCBmYWxscyBUSFJVXG4gICAgICBjYXNlIDUyOlxuICAgICAgY2FzZSAxMDA6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIHNvbWUgb3RoZXIgZHVtYmFzcyBhdHRyaWJ1dGVcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcm93cy5wdXNoKHtcbiAgICAgIG5hdGlvbklkLFxuICAgICAgc2l0ZUlkLFxuICAgICAgZnV0dXJlLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgfSk7XG4gICAgZGVsUm93cy5wdXNoKGkpO1xuICB9XG5cbiAgLy8gcmVtb3ZlIG5vdy1yZWR1bmRhbnQgYXR0cmlidXRlc1xuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKVxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICB0cnVlXG4gICk7XG59XG5cbi8qXG5mdW5jdGlvbiBtYWtlVW5pdFNvdXJjZVNjaGVtYSAoKTogYW55IHtcbiAgcmV0dXJuIG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0U291cmNlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIG5hdGlvbklkOiAxLFxuICAgICAgc291cmNlSWQ6IDIsXG4gICAgICBzb3VyY2VUeXBlOiAzLFxuICAgICAgc291cmNlQXJnOiA0LFxuICAgIH0sXG4gICAgZmllbGRzOiBbXG4gICAgICAndW5pdElkJyxcbiAgICAgICduYXRpb25JZCcsXG4gICAgICAnc291cmNlSWQnLFxuICAgICAgJ3NvdXJjZVR5cGUnLFxuICAgICAgJ3NvdXJjZUFyZycsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlSWQnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlVHlwZScsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NvdXJjZUFyZycsXG4gICAgICAgIGluZGV4OiA0LFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcbn1cbiovXG5cbmZ1bmN0aW9uIG1ha2VTcGVsbEJ5TmF0aW9uICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbFtzcGVsbElkXStOYXRpb25bbmF0aW9uSWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc3BlbGxJZDogMCwgbmF0aW9uSWQ6IDEgfSxcbiAgICBmaWVsZHM6IFsnc3BlbGxJZCcsICduYXRpb25JZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NwZWxsSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICBsZXQgX19yb3dJZCA9IDA7XG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG4gIGZvciAoY29uc3QgW2ksIHJdIG9mIGF0dHJzLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyBzcGVsbF9udW1iZXI6IHNwZWxsSWQsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlIH0gPSByO1xuICAgIGlmIChhdHRyaWJ1dGUgPT09IDI3OCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgJHtzcGVsbElkfSBJUyBSRVNUUklDVEVEIFRPIE5BVElPTiAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IG5hdGlvbklkID0gTnVtYmVyKHJhd192YWx1ZSk7XG4gICAgICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKG5hdGlvbklkKSB8fCBuYXRpb25JZCA8IDAgfHwgbmF0aW9uSWQgPiAyNTUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgICAgICAhISEhISBUT08gQklHIE5BWVNIICEhISEhICgke25hdGlvbklkfSlgKTtcbiAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgIHJvd3MucHVzaCh7IF9fcm93SWQsIHNwZWxsSWQsIG5hdGlvbklkIH0pO1xuICAgICAgX19yb3dJZCsrO1xuICAgIH1cbiAgfVxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKSBhdHRycy5yb3dzLnNwbGljZShkaSwgMSk7XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2VcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlVbml0ICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeVVuaXQnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnU3BlbGxbc3BlbGxJZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc3BlbGxJZDogMCwgdW5pdElkOiAxIH0sXG4gICAgZmllbGRzOiBbJ3NwZWxsSWQnLCAndW5pdElkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLkkzMixcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgbGV0IF9fcm93SWQgPSAwO1xuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuICAvLyBUT0RPIC0gaG93IHRvIGRpZmZlcmVudGlhdGUgdW5pdCB2cyBjb21tYW5kZXIgc3VtbW9uPyBpIGZvcmdldCBpZiBpIGZpZ3VyZWRcbiAgLy8gdGhpcyBvdXQgYWxyZWFkeVxuICBmb3IgKGNvbnN0IFtpLCByXSBvZiBhdHRycy5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgc3BlbGxfbnVtYmVyOiBzcGVsbElkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZSB9ID0gcjtcbiAgICBpZiAoYXR0cmlidXRlID09PSA3MzEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gVU5JVCAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IHVuaXRJZCA9IE51bWJlcihyYXdfdmFsdWUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcih1bml0SWQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAgICAgISEhISEgVE9PIEJJRyBVTklUICEhISEhICgke3VuaXRJZH0pYCk7XG4gICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICByb3dzLnB1c2goeyBfX3Jvd0lkLCBzcGVsbElkLCB1bml0SWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICB3aGlsZSAoKGRpID0gZGVsUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZCkgYXR0cnMucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlXG4gICk7XG59XG5cbi8vIGZldyB0aGluZ3MgaGVyZTpcbi8vIC0gaG1vbjEtNSAmIGhjb20xLTQgYXJlIGNhcC1vbmx5IHVuaXRzL2NvbW1hbmRlcnNcbi8vIC0gbmF0aW9uYWxyZWNydWl0cyArIG5hdGNvbSAvIG5hdG1vbiBhcmUgbm9uLWNhcCBvbmx5IHNpdGUtZXhjbHVzaXZlcyAoeWF5KVxuLy8gLSBtb24xLTIgJiBjb20xLTMgYXJlIGdlbmVyaWMgcmVjcnVpdGFibGUgdW5pdHMvY29tbWFuZGVyc1xuLy8gLSBzdW0xLTQgJiBuX3N1bTEtNCBhcmUgbWFnZS1zdW1tb25hYmxlIChuIGRldGVybWluZXMgbWFnZSBsdmwgcmVxKVxuLy8gKHZvaWRnYXRlIC0gbm90IHJlYWxseSByZWxldmFudCBoZXJlLCBpdCBkb2Vzbid0IGluZGljYXRlIHdoYXQgbW9uc3RlcnMgYXJlXG4vLyBzdW1tb25lZCwgbWF5IGFkZCB0aG9zZSBtYW51YWxseT8pXG5cbmV4cG9ydCBlbnVtIFNJVEVfUkVDIHtcbiAgSE9NRV9NT04gPSAwLCAvLyBhcmcgaXMgbmF0aW9uLCB3ZSdsbCBoYXZlIHRvIGFkZCBpdCBsYXRlciB0aG91Z2hcbiAgSE9NRV9DT00gPSAxLCAvLyBzYW1lXG4gIFJFQ19NT04gPSAyLFxuICBSRUNfQ09NID0gMyxcbiAgTkFUX01PTiA9IDQsIC8vIGFyZyBpcyBuYXRpb25cbiAgTkFUX0NPTSA9IDUsIC8vIHNhbWVcbiAgU1VNTU9OID0gOCwgLy8gYXJnIGlzIGxldmVsIHJlcXVpcmVtZW50XG59XG5cbmNvbnN0IFNfSE1PTlMgPSBBcnJheS5mcm9tKCcxMjM0NScsIG4gPT4gYGhtb24ke259YCk7XG5jb25zdCBTX0hDT01TID0gQXJyYXkuZnJvbSgnMTIzNCcsIG4gPT4gYGhjb20ke259YCk7XG5jb25zdCBTX1JNT05TID0gQXJyYXkuZnJvbSgnMTInLCBuID0+IGBtb24ke259YCk7XG5jb25zdCBTX1JDT01TID0gQXJyYXkuZnJvbSgnMTIzJywgbiA9PiBgY29tJHtufWApO1xuY29uc3QgU19TVU1OUyA9IEFycmF5LmZyb20oJzEyMzQnLCBuID0+IFtgc3VtJHtufWAsIGBuX3N1bSR7bn1gXSk7XG5cbmZ1bmN0aW9uIG1ha2VVbml0QnlTaXRlICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCB7IE1hZ2ljU2l0ZSwgU2l0ZUJ5TmF0aW9uLCBVbml0IH0gPSB0YWJsZXM7XG4gIGlmICghU2l0ZUJ5TmF0aW9uKSB0aHJvdyBuZXcgRXJyb3IoJ2RvIFNpdGVCeU5hdGlvbiBmaXJzdCcpO1xuXG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0QnlTaXRlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ01hZ2ljU2l0ZVtzaXRlSWRdK1VuaXRbdW5pdElkXScsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNpdGVJZDogMCwgdW5pdElkOiAxLCByZWNUeXBlOiAyLCByZWNBcmc6IDMgfSxcbiAgICBmaWVsZHM6IFsnc2l0ZUlkJywgJ3VuaXRJZCcsICdyZWNUeXBlJywgJ3JlY0FyZyddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NpdGVJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjVHlwZScsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3JlY0FyZycsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG5cbiAgZm9yIChjb25zdCBzaXRlIG9mIE1hZ2ljU2l0ZS5yb3dzKSB7XG4gICAgZm9yIChjb25zdCBrIG9mIFNfSE1PTlMpIHtcbiAgICAgIGNvbnN0IG1uciA9IHNpdGVba107XG4gICAgICAvLyB3ZSBhc3N1bWUgdGhlIGZpZWxkcyBhcmUgYWx3YXlzIHVzZWQgaW4gb3JkZXJcbiAgICAgIGlmICghbW5yKSBicmVhaztcbiAgICAgIGxldCByZWNBcmcgPSAwO1xuICAgICAgY29uc3QgbmogPSBzaXRlLlNpdGVCeU5hdGlvbj8uZmluZCgoeyBzaXRlSWQgfSkgPT4gc2l0ZUlkID09PSBzaXRlLmlkKTtcbiAgICAgIGlmICghbmopIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAnbWl4ZWQgdXAgY2FwLW9ubHkgbW9uIHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuU2l0ZUJ5TmF0aW9uXG4gICAgICAgICk7XG4gICAgICAgIHJlY0FyZyA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduaWlpaWNlJywgbmosIHNpdGUuU2l0ZUJ5TmF0aW9uKVxuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gMDtcbiAgICAgIGNvbnN0IG5qID0gc2l0ZS5TaXRlQnlOYXRpb24/LmZpbmQoKHsgc2l0ZUlkIH0pID0+IHNpdGVJZCA9PT0gc2l0ZS5pZCk7XG4gICAgICBpZiAoIW5qKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgJ21peGVkIHVwIGNhcC1vbmx5IHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuU2l0ZUJ5TmF0aW9uXG4gICAgICAgICk7XG4gICAgICAgIHJlY0FyZyA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQobW5yKTtcbiAgICAgIGlmICh1bml0KSB7XG4gICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY0FyZyxcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuSE9NRV9DT00sXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrIG9mIFNfUk1PTlMpIHtcbiAgICAgIGNvbnN0IG1uciA9IHNpdGVba107XG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KG1ucik7XG4gICAgICBpZiAodW5pdCkge1xuICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgc2l0ZSBjb21tYW5kZXIgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2ssIG5rXSBvZiBTX1NVTU5TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCBhcmcgPSBzaXRlW25rXTtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5TVU1NT04sXG4gICAgICAgIHJlY0FyZzogYXJnLCAvLyBsZXZlbCByZXF1aXVyZW1lbnQgKGNvdWxkIGFsc28gaW5jbHVkZSBwYXRoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNpdGUubmF0aW9uYWxyZWNydWl0cykge1xuICAgICAgaWYgKHNpdGUubmF0bW9uKSByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IHNpdGUubmF0bW9uLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5OQVRfTU9OLFxuICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgIH0pO1xuICAgICAgaWYgKHNpdGUubmF0Y29tKSB7XG4gICAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICAgIHVuaXRJZDogc2l0ZS5uYXRjb20sXG4gICAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX0NPTSxcbiAgICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQoc2l0ZS5uYXRjb20pO1xuICAgICAgICBpZiAodW5pdCkge1xuICAgICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgbmF0Y29tIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHlheSFcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2VcbiAgKTtcblxufVxuXG5mdW5jdGlvbiBtYWtlVW5pdEJ5VW5pdFN1bW1vbiAodGFibGVzOiBUUikge1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHVuaXRJZDogMCwgc3VtbW9uZXJJZDogMSB9LFxuICAgIGZpZWxkczogWyd1bml0SWQnLCAnc3VtbW9uZXJJZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25lcklkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cbi8vIFRPRE8gLSBleHBvcnQgdGhlc2UgZnJvbSBzb21ld2hlcmUgbW9yZSBzZW5zaWJsZVxuZXhwb3J0IGNvbnN0IGVudW0gUkVDX1RZUEUge1xuICBGT1JUID0gMCwgLy8gbm9ybWFsIGkgZ3Vlc3NcbiAgUFJFVEVOREVSID0gMSwgLy8gdSBoZWFyZCBpdCBoZXJlXG4gIEZPUkVJR04gPSAyLFxuICBXQVRFUiA9IDMsXG4gIENPQVNUID0gNCxcbiAgRk9SRVNUID0gNSxcbiAgU1dBTVAgPSA2LFxuICBXQVNURSA9IDcsXG4gIE1PVU5UQUlOID0gOCxcbiAgQ0FWRSA9IDksXG4gIFBMQUlOUyA9IDEwLFxuICBIRVJPID0gMTEsXG4gIE1VTFRJSEVSTyA9IDEyLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBVTklUX1RZUEUge1xuICBOT05FID0gMCwgICAgICAvLyBqdXN0IGEgdW5pdC4uLlxuICBDT01NQU5ERVIgPSAxLFxuICBQUkVURU5ERVIgPSAyLFxuICBDQVBPTkxZID0gNCxcbiAgSEVSTyA9IDgsXG59XG5cbi8vIFRPRE8gLSBub3Qgc3VyZSB5ZXQgaWYgSSB3YW50IHRvIGR1cGxpY2F0ZSBjYXAtb25seSBzaXRlcyBoZXJlP1xuZnVuY3Rpb24gbWFrZVVuaXRCeU5hdGlvbiAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3Qge1xuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLFxuICAgIFVuaXQsXG4gICAgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIEZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBQcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gIH0gPSB0YWJsZXM7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IG5hdGlvbklkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIgfSxcbiAgICBqb2luczogJ05hdGlvbltuYXRpb25JZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmaWVsZHM6IFsnbmF0aW9uSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgLy8gVE9ETyAtIHByZXRlbmRlcnNcbiAgLy8gZm9sbG93aW5nIHRoZSBsb2dpYyBpbiAuLi8uLi8uLi8uLi9zY3JpcHRzL0RNSS9NTmF0aW9uLmpzXG4gIC8vICAgMS4gZGV0ZXJtaW5lIG5hdGlvbiByZWFsbShzKSBhbmQgdXNlIHRoYXQgdG8gYWRkIHByZXRlbmRlcnNcbiAgLy8gICAyLiB1c2UgdGhlIGxpc3Qgb2YgXCJleHRyYVwiIGFkZGVkIHByZXRlbmRlcnMgdG8gYWRkIGFueSBleHRyYVxuICAvLyAgIDMuIHVzZSB0aGUgdW5wcmV0ZW5kZXJzIHRhYmxlIHRvIGRvIG9wcG9zaXRlXG5cbiAgY29uc3QgZGVsQUJOUm93czogbnVtYmVyW10gPSBbXTtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaUFCTiAscl0gIG9mIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyByYXdfdmFsdWUsIGF0dHJpYnV0ZSwgbmF0aW9uX251bWJlciB9ID0gcjtcbiAgICBsZXQgdW5pdDogYW55O1xuICAgIGxldCB1bml0SWQ6IGFueSA9IG51bGwgLy8gc21maFxuICAgIGxldCB1bml0VHlwZSA9IDA7XG4gICAgbGV0IHJlY1R5cGUgPSAwO1xuICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICBjYXNlIDE1ODpcbiAgICAgIGNhc2UgMTU5OlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC5sYW5kc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNPQVNUO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNjA6XG4gICAgICBjYXNlIDE2MTpcbiAgICAgIGNhc2UgMTYyOlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC5sYW5kc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNPQVNUO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTYzOlxuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODY6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LndhdGVyc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBVEVSO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODc6XG4gICAgICBjYXNlIDE4OTpcbiAgICAgIGNhc2UgMTkwOlxuICAgICAgY2FzZSAxOTE6XG4gICAgICBjYXNlIDIxMzpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQud2F0ZXJzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FURVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTQ6XG4gICAgICBjYXNlIDQxMjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuRk9SRVNUO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk1OlxuICAgICAgY2FzZSA0MTM6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkZPUkVTVDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5TV0FNUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuU1dBTVA7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5ODpcbiAgICAgIGNhc2UgNDA4OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NT1VOVEFJTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5OTpcbiAgICAgIGNhc2UgNDA5OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NT1VOVEFJTjtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAwOlxuICAgICAgY2FzZSA0MTY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBU1RFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAxOlxuICAgICAgY2FzZSA0MTc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBU1RFO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDI6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNBVkU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDM6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNBVkU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwNDpcbiAgICAgIGNhc2UgNDA2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5QTEFJTlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDU6XG4gICAgICBjYXNlIDQwNzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuUExBSU5TO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzk6XG4gICAgICBjYXNlIDE0MDpcbiAgICAgIGNhc2UgMTQxOlxuICAgICAgY2FzZSAxNDI6XG4gICAgICBjYXNlIDE0MzpcbiAgICAgIGNhc2UgMTQ0OlxuICAgICAgICAvL2NvbnNvbGUubG9nKCdIRVJPIEZJTkRFUiBGT1VORCcsIHJhd192YWx1ZSlcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVIgfCBVTklUX1RZUEUuSEVSTztcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNDU6XG4gICAgICBjYXNlIDE0NjpcbiAgICAgIGNhc2UgMTQ5OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUiB8IFVOSVRfVFlQRS5IRVJPO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTVVMVElIRVJPO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAodW5pdElkID09IG51bGwpIGNvbnRpbnVlO1xuICAgIGRlbEFCTlJvd3MucHVzaChpQUJOKTtcbiAgICB1bml0ID8/PSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAodW5pdFR5cGUpIHVuaXQudHlwZSB8PSB1bml0VHlwZTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ21vcmUgcGlzcyB1bml0OicsIGlBQk4sIHVuaXRJZCk7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIHVuaXRJZCxcbiAgICAgIHJlY1R5cGUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIG5hdGlvbklkOiBuYXRpb25fbnVtYmVyLFxuICAgIH0pO1xuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbEFCTlJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIC8qXG4gIGZpcnN0IHJlZmVyIHRvIHRoZSB0YWJsZXM6XG4gIC0gZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uXG4gIC0gbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uXG4gIC0gZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb25cbiAgLSBub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvblxuICAtIGNvYXN0X2xlYWRlcl90eXBlc19ieV9uYXRpb24gKGNoZWNrIGxhbmRzaGFwZSlcbiAgLSBjb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24gKGNoZWNrIGxhbmRzaGFwZSlcbiAgKi9cbiAgZm9yIChjb25zdCByIG9mIEZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkNPQVNULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG5cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIE5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG4gIC8vIHRhYmxlcyBoYXZlIGJlZW4gY29tYmluZWR+IVxuICBDb2FzdExlYWRlclR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIENvYXN0VHJvb3BUeXBlQnlOYXRpb24ucm93cy5zcGxpY2UoMCwgSW5maW5pdHkpO1xuICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKDAsIEluZmluaXR5KTtcbiAgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG4gIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzLnNwbGljZSgwLCBJbmZpbml0eSk7XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLElBQU0sWUFBWTtBQUVYLFNBQVMsYUFDZCxHQUNBLE9BQ0EsVUFDb0I7QUFDcEIsUUFBTSxRQUFRLEVBQUUsTUFBTSxHQUFHO0FBQ3pCLE1BQUksTUFBTSxTQUFTO0FBQUcsVUFBTSxJQUFJLE1BQU0sYUFBYSxDQUFDLHFCQUFxQjtBQUN6RSxRQUFNLFFBQTRCLENBQUM7QUFDbkMsYUFBVyxLQUFLLE9BQU87QUFDckIsVUFBTSxDQUFDLEdBQUcsV0FBVyxVQUFVLElBQUksRUFBRSxNQUFNLFNBQVMsS0FBSyxDQUFDO0FBQzFELFFBQUksQ0FBQyxhQUFhLENBQUM7QUFDakIsWUFBTSxJQUFJLE1BQU0sYUFBYSxDQUFDLE9BQU8sQ0FBQywrQkFBK0I7QUFFdkUsVUFBTSxLQUFLLENBQUMsV0FBVyxVQUFVLENBQUM7QUFBQSxFQUNwQztBQUNBLE1BQUk7QUFBVSxlQUFXLEtBQUs7QUFBTyxtQkFBYSxHQUFHLE9BQVEsUUFBUTtBQUNyRSxTQUFPO0FBQ1Q7QUFHTyxTQUFTLGFBQ2QsTUFDQSxPQUNBLFVBQ0E7QUFDQSxRQUFNLENBQUMsV0FBVyxVQUFVLElBQUk7QUFDaEMsUUFBTSxJQUFJLEdBQUcsU0FBUyxJQUFJLFVBQVU7QUFDcEMsUUFBTSxNQUFNLE1BQU0s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QTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsYUFBYTtBQUFBLE1BQ1gsTUFBTSxDQUFDLE9BQWUsU0FBcUI7QUFDekMsY0FBTSxVQUFVLEtBQUssVUFBVSxVQUFVO0FBQ3pDLGVBQU87QUFBQSxVQUNMO0FBQUEs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LElBQUksU0FBUyxLQUFLLElBQUksYUFBYSxJQUFJLEVBQUU7QUFDbkQ7QUFFQSxlQUFlLGFBQWEsR0FBVTtBQUNwQyxRQUFNLE9BQU8sRUFBRSxLQUFLLFNBQVM7QUFDN0IsTUFBSTtBQUNKLE1BQUksSUFBUztBQUNiLE1BQUksT0FBTyxDQUFDLE1BQU0sVUFBVTtBQUMxQixRQUFJO0FBQ0osV0FBTyxPQUFPLEdBQUcsR0FBRyxNQUFNLE1BQU07QUFDaEMsUUFBSSxDQUFDLE1BQVcsT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUFDLE9BQUssRUFBRUEsRUFBQyxDQUFDO0FBQUEsRUFDaEQsV0FBVyxPQUFPLENBQUMsTUFBTSxTQUFTLE9BQU8sQ0FBQyxHQUFHO0FBQzNDLFFBQUksT0FBTyxPQUFPLENBQUMsQ0FBQyxJQUFJO0FBQ3hCLFdBQU8sT0FBTyxHQUFHLENBQUM7QUFDbEIsWUFBUSxJQUFJLGNBQWMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FBRztBQUN2RCxRQUFJLE9BQU8sTUFBTSxDQUFDO0FBQUcsWUFBTSxJQUFJLE1BQU0sd0JBQXdCO0FBQUEsRUFDL0QsT0FBTztBQUNMLFFBQUksS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLElBQUk7QUFBQSxFQUNyQztBQUNBLE1BQUksS0FBSyxJQUFJLE1BQU0sS0FBSyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLFFBQU0sSUFBSSxJQUFJO0FBQ2QsUUFBTSxJQUFLLE9BQU8sU0FBVSxPQUFPLENBQUMsTUFBTSxRQUFRLEVBQUUsT0FBTyxTQUFTLFNBQ25FLEVBQUUsT0FBTyxPQUFPLE1BQU0sR0FBRyxFQUFFO0FBQzVCLGdCQUFjLEdBQUcsR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFDO0FBYXZDO0FBRUEsU0FBUyxjQUNQLEdBQ0EsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBO0FBQ0EsVUFBUSxJQUFJO0FBQUEsT0FBVSxDQUFDLEdBQUc7QUFDMUIsSUFBRSxPQUFPLE1BQU0sS0FBSztBQUNwQixVQUFRLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHO0FBQ3JDLFFBQU0sT0FBTyxFQUFFLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLE1BQUk7QUFBTSxlQUFXLEtBQUs7QUFBTSxjQUFRLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDakQsVUFBUSxJQUFJLFFBQVEsQ0FBQztBQUFBO0FBQUEsQ0FBTTtBQUM3QjtBQUlBLFFBQVEsSUFBSSxRQUFRLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFcEMsSUFBSTtBQUFNLFVBQVEsSUFBSTtBQUFBO0FBQ2pCLFVBQVE7IiwKICAibmFtZXMiOiBbImkiLCAid2lkdGgiLCAiZmllbGRzIiwgIndpZHRoIiwgIndpZHRoIiwgImZpZWxkcyIsICJmIl0KfQo=
