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
      `iffy join "${s}": "${columnName}" (${col.label}) is a different type than ${tableName}.${jCol.name} (${jCol.label})`
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
  static removeTable(table, list, map) {
    if (list) {
      const index = list.indexOf(table);
      if (index === -1)
        throw new Error(`table ${table.name} is not in the list`);
      list.splice(index, 1);
    }
    if (map) {
      if (table.name in map)
        delete map[table.name];
      else
        throw new Error(`table ${table.name} is not in the map`);
    }
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
import { readFileSync } from "node:fs";
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
  /*
  '../../gamedata/effects_spells.csv': {
    key: 'record_id',
    name: 'EffectSpell',
    ignoreFields: new Set(['end']),
  },
  */
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
    ignoreFields: /* @__PURE__ */ new Set(["end"]),
    extraFields: {
      realm: (index) => {
        return {
          index,
          name: "realm",
          type: 3 /* U8 */,
          width: 1,
          // we will assign these later
          override(v, u, a) {
            return 0;
          }
        };
      }
    }
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
    ignoreFields: /* @__PURE__ */ new Set(["end"]),
    preTransform(rawFields, rawData) {
      const IDX = rawFields.indexOf("effect_record_id");
      const TXF = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];
      if (IDX === -1)
        throw new Error("no effect_record_id?");
      function replaceRef(dest, src) {
        dest.splice(IDX, 1, ...TXF.map((i) => src[i]));
      }
      const [effectFields, ...effectData] = readFileSync(
        `../../gamedata/effects_spells.csv`,
        { encoding: "utf8" }
      ).split("\n").filter((line) => line !== "").map((line) => line.split("	"));
      replaceRef(rawFields, effectFields);
      for (const [i, f] of rawFields.entries())
        console.log(i, f);
      for (const dest of rawData) {
        const erid = Number(dest[IDX]);
        const src = effectData[erid];
        if (!src) {
          console.error("NOPE", dest, erid);
          throw new Error("no thanks");
        } else {
          replaceRef(dest, src);
        }
      }
    }
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
  if (options?.preTransform) {
    options.preTransform(rawFields, rawData);
  }
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
    makeUnitByNation(tables),
    makeUnitByUnitSummon(tables)
  );
  for (const t of [
    tables.CoastLeaderTypeByNation,
    tables.CoastTroopTypeByNation,
    tables.FortLeaderTypeByNation,
    tables.FortTroopTypeByNation,
    tables.NonFortLeaderTypeByNation,
    tables.NonFortTroopTypeByNation,
    tables.PretenderTypeByNation,
    tables.UnpretenderTypeByNation,
    tables.Realm
  ]) {
    Table.removeTable(t, tableList);
  }
}
function makeNationSites(tables) {
  const { AttributeByNation, Nation } = tables;
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
      case 289:
        const nation = Nation.map.get(nationId);
        if (!nation) {
          console.error(`invalid nation id ${nationId} (no row in Nation)`);
        } else {
          nation.realm = siteId;
        }
        delRows.push(i);
        continue;
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
        continue;
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
          "mixed up cap-only cmdr site",
          k,
          site.id,
          site.name,
          site.SiteByNation
        );
        recArg = 0;
        continue;
      } else {
        recArg = nj.nationId;
      }
      const unit = Unit.map.get(mnr);
      if (unit) {
        unit.type |= 1;
      } else {
        console.error("mixed up cap-only site (no unit in unit table?)", site);
        continue;
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
function D_SUMMON(t, s) {
  switch (t) {
    case 1 /* ALLIES */:
      return `#makemonster${s}`;
    case 2 /* DOM */: {
      switch (s) {
        case 0:
          return `#domsummon`;
        case 1:
          return `#domsummon2`;
        case 2:
          return `#domsummon20`;
        case 3:
          return `#raredomsummon`;
        default:
          return `DOM ?? ${t}:${s}`;
      }
    }
    case 3 /* AUTO */:
      return `#summon${s}`;
    case 4 /* BATTLE_ROUND */:
      return `#battlesum${s}`;
    case 5 /* BATTLE_START */: {
      const n = s & 63;
      return s & 128 ? `#batstartsum${n}d6` : s & 64 ? `#batstartsum1d3` : `#batstartsum${n}`;
    }
    case 6 /* TEMPLE_TRAINER */:
      return `#templetrainer`;
    case 7 /* WINTER */:
      return `(1d3 at the start of winter)`;
    default:
      return `IDK??? t=${t}; s=${s}`;
  }
}
var MONTAGS = {
  //Random Bird (Falcon, Black Hawk, Swan or Strange Bird)
  [-20]: [3371, 517, 2929, 3327],
  // Lions
  [-19]: [3363, 3364, 3365, 3366],
  // TODO - need to figure out which monsters these really are (crossbreends)
  [-12]: [530],
  // 3% good?
  [-11]: [530],
  // bad
  [-10]: [530],
  // good
  // Yatas and Pairikas
  [-17]: [],
  // Celestial Yazad
  [-16]: [],
  // Random Bug
  [-9]: [],
  // Doom Horror
  [-8]: [],
  // Horror
  [-7]: [],
  // Lesser Horror
  [-6]: [],
  // Random Animal
  [-5]: [],
  // Ghoul
  [-4]: [],
  // Soultrap Ghost
  [-3]: [],
  // Longdead
  [-2]: [],
  // Soulless
  [-1]: []
};
function makeUnitByUnitSummon(tables) {
  const { Unit } = tables;
  const schema = new Schema({
    name: "UnitBySite",
    key: "__rowId",
    joins: "Unit[unitId]+Unit[summonerId]",
    flagsUsed: 1,
    overrides: {},
    fields: ["unitId", "summonerId", "summonType", "summonStrength", "asTag"],
    rawFields: { unitId: 0, summonerId: 1, summonType: 2, summonStrength: 3, asTag: 4 },
    columns: [
      new NumericColumn({
        name: "unitId",
        index: 0,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "summonerId",
        index: 1,
        type: 5 /* U16 */
      }),
      new NumericColumn({
        name: "summonType",
        index: 2,
        type: 3 /* U8 */
      }),
      new NumericColumn({
        name: "summonStrength",
        index: 3,
        type: 3 /* U8 */
      }),
      new BoolColumn({
        name: "summonStrength",
        index: 3,
        type: 2 /* BOOL */,
        bit: 0,
        flag: 1
      })
    ]
  });
  const rows = [];
  function printRow(sid, uid, t, s, p) {
    p ??= "  -";
    const sn = Unit.map.get(sid).name;
    const un = Unit.map.get(uid).name;
    const d = D_SUMMON(t, s);
    console.log(`${p} ${d} ${sn} -> ${un}`);
  }
  function addRow(summonType, summonStrength, summonerId, target) {
    if (target > 0) {
      const r = {
        __rowId: rows.length,
        summonerId,
        summonType,
        summonStrength,
        asTag: false,
        unitId: target
      };
      printRow(r.summonerId, r.unitId, r.summonType, r.summonStrength);
      rows.push(r);
    } else if (target < 0) {
      console.log("  MONTAG " + target + " [");
      if (!MONTAGS[target]?.length)
        console.log("    (MISSING!)");
      else
        for (const unitId of MONTAGS[target]) {
          const r = {
            __rowId: rows.length,
            summonerId,
            summonType,
            summonStrength,
            asTag: true,
            unitId
          };
          printRow(r.summonerId, r.unitId, r.summonType, r.summonStrength, "     >");
          rows.push(r);
        }
      console.log("  ]\n");
    } else {
      console.error(`      !!!!! ${Unit.map.get(summonerId).name} SUMMONS ID 0 !!`);
      return;
    }
  }
  for (const summoner of Unit.rows) {
    if (summoner.summon)
      addRow(1 /* ALLIES */, summoner.n_summon, summoner.id, summoner.summon);
    if (summoner.summon5)
      addRow(1 /* ALLIES */, 5, summoner.id, summoner.summon5);
    if (summoner.summon1)
      addRow(3 /* AUTO */, 1, summoner.id, summoner.summon1);
    if (summoner.templetrainer)
      addRow(6 /* TEMPLE_TRAINER */, 0, summoner.id, 1859);
    if (summoner.wintersummon1d3)
      addRow(7 /* WINTER */, 0, summoner.id, summoner.wintersummon1d3);
    if (summoner.domsummon)
      addRow(2 /* DOM */, 0, summoner.id, summoner.domsummon);
    if (summoner.domsummon2)
      addRow(2 /* DOM */, 1, summoner.id, summoner.domsummon2);
    if (summoner.domsummon20)
      addRow(2 /* DOM */, 2, summoner.id, summoner.domsummon20);
    if (summoner.raredomsummon)
      addRow(2 /* DOM */, 3, summoner.id, summoner.raredomsummon);
    for (const s of [
      /*1,2,3,4,*/
      5
    ]) {
      const k = `battlesum${s}`;
      if (summoner[k])
        addRow(4 /* BATTLE_ROUND */, s, summoner.id, summoner[k]);
    }
    for (const s of [1, 2, 3, 4, 5]) {
      const k = `batstartsum${s}`;
      if (summoner[k])
        addRow(5 /* BATTLE_START */, s, summoner.id, summoner[k]);
    }
    for (const s of [
      1,
      2,
      3,
      4,
      5,
      6
      /*,7,8,9*/
    ]) {
      const k = `batstartsum${s}d6`;
      if (summoner[k])
        addRow(5 /* BATTLE_START */, s | 128, summoner.id, summoner[k]);
    }
    if (summoner.batstartsum1d3)
      addRow(5 /* BATTLE_START */, 64, summoner.id, summoner.batstartsum1d3);
  }
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}
function makeUnitByNation(tables) {
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
  const rows = [];
  makeRecruitmentFromAttrs(tables, rows);
  combineRecruitmentTables(tables, rows);
  makePretenderByNation(tables, rows);
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}
function makeRecruitmentFromAttrs(tables, rows) {
  const { AttributeByNation, Unit } = tables;
  const delABNRows = [];
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
}
function combineRecruitmentTables(tables, rows) {
  const {
    Unit,
    CoastLeaderTypeByNation,
    CoastTroopTypeByNation,
    FortLeaderTypeByNation,
    FortTroopTypeByNation,
    NonFortLeaderTypeByNation,
    NonFortTroopTypeByNation
  } = tables;
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
}
function makePretenderByNation(tables, rows) {
  const {
    PretenderTypeByNation,
    UnpretenderTypeByNation,
    Nation,
    Unit,
    Realm,
    AttributeByNation
  } = tables;
  const cheapAttrs = AttributeByNation.rows.filter(
    ({ attribute: a }) => a === 314 || a === 315
  );
  const cheap = /* @__PURE__ */ new Map();
  for (const { nation_number, attribute, raw_value } of cheapAttrs) {
    if (!cheap.has(raw_value))
      cheap.set(raw_value, /* @__PURE__ */ new Map());
    const cUnit = cheap.get(raw_value);
    cUnit.set(nation_number, attribute === 314 ? 20 : 40);
  }
  const pretenders = new Map(Nation.rows.map((r) => [r.id, /* @__PURE__ */ new Set()]));
  const r2m = /* @__PURE__ */ new Map();
  for (let i = 1; i <= 10; i++)
    r2m.set(i, /* @__PURE__ */ new Set());
  for (const { monster_number, realm } of Realm.rows)
    r2m.get(realm).add(monster_number);
  for (const { realm, id } of Nation.rows) {
    if (!realm)
      continue;
    for (const mnr of r2m.get(realm)) {
      pretenders.get(id).add(mnr);
    }
  }
  for (const { monster_number, nation_number } of PretenderTypeByNation.rows) {
    pretenders.get(nation_number).add(monster_number);
  }
  for (const { monster_number, nation_number } of UnpretenderTypeByNation.rows) {
    pretenders.get(nation_number).delete(monster_number);
  }
  const addedUnits = /* @__PURE__ */ new Map();
  for (const [nationId, unitIds] of pretenders) {
    for (const unitId of unitIds) {
      if (!addedUnits.has(unitId))
        addedUnits.set(unitId, Unit.map.get(unitId));
      const discount = cheap.get(unitId)?.get(nationId) ?? 0;
      const recType = discount === 40 ? 14 /* PRETENDER_CHEAP_40 */ : discount === 20 ? 13 /* PRETENDER_CHEAP_20 */ : 1 /* PRETENDER */;
      rows.push({
        unitId,
        recType,
        recArg: nationId,
        __rowId: rows.length
      });
    }
  }
  for (const [id, u] of addedUnits) {
    if (!u) {
      console.warn("fake unit id?", id);
      continue;
    }
    if (!u.startdom || !(u.type & 2 /* PRETENDER */)) {
      console.warn("not a pretender?", u.name, u.type, u.startdom);
    }
    u.type |= 2 /* PRETENDER */;
  }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9qb2luLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2VyaWFsaXplLnRzIiwgIi4uLy4uL2xpYi9zcmMvY29sdW1uLnRzIiwgIi4uLy4uL2xpYi9zcmMvdXRpbC50cyIsICIuLi8uLi9saWIvc3JjL3NjaGVtYS50cyIsICIuLi8uLi9saWIvc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9jbGkvY3N2LWRlZnMudHMiLCAiLi4vc3JjL2NsaS9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL2NsaS9kdW1wLWNzdnMudHMiLCAiLi4vc3JjL2NsaS9qb2luLXRhYmxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuXG5jb25zdCBKT0lOX1BBUlQgPSAvXlxccyooXFx3KylcXHMqXFxbXFxzKihcXHcrKVxccypcXF1cXHMqJC9cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbiAoXG4gIHM6IHN0cmluZyxcbiAgdGFibGU/OiBUYWJsZSxcbiAgdGFibGVNYXA/OiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT5cbik6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnKycpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogbm90IGVub3VnaCBqb2luc2ApO1xuICBjb25zdCBqb2luczogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIGZvciAoY29uc3QgcCBvZiBwYXJ0cykge1xuICAgIGNvbnN0IFtfLCB0YWJsZU5hbWUsIGNvbHVtbk5hbWVdID0gcC5tYXRjaChKT0lOX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRVtDT0xdXCJgKTtcblxuICAgIGpvaW5zLnB1c2goW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0pO1xuICB9XG4gIGlmICh0YWJsZU1hcCkgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB2YWxpZGF0ZUpvaW4oaiwgdGFibGUhLCB0YWJsZU1hcCk7XG4gIHJldHVybiBqb2lucztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVKb2luIChcbiAgam9pbjogW3N0cmluZywgc3RyaW5nXSxcbiAgdGFibGU6IFRhYmxlLFxuICB0YWJsZU1hcDogUmVjb3JkPHN0cmluZywgVGFibGU+XG4pIHtcbiAgY29uc3QgW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0gPSBqb2luO1xuICBjb25zdCBzID0gYCR7dGFibGVOYW1lfVske2NvbHVtbk5hbWV9XWBcbiAgY29uc3QgY29sID0gdGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbY29sdW1uTmFtZV07XG4gIGlmICghY29sKVxuICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gXCIke3N9XCI6IFwiJHt0YWJsZS5uYW1lfVwiIGhhcyBubyBcIiR7Y29sdW1uTmFtZX1cImApO1xuICBjb25zdCBqVGFibGUgPSB0YWJsZU1hcFt0YWJsZU5hbWVdO1xuICBpZiAoIWpUYWJsZSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7dGFibGVOYW1lfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gIGNvbnN0IGpDb2wgPSBqVGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbalRhYmxlLnNjaGVtYS5rZXldO1xuICBpZiAoIWpDb2wpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3RhYmxlTmFtZX1cIiBoYXMgbm8ga2V5Pz8/P2ApO1xuICBpZiAoakNvbC50eXBlICE9PSBjb2wudHlwZSlcbiAgICAvL3Rocm93IG5ldyBFcnJvcigpXG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYGlmZnkgam9pbiBcIiR7XG4gICAgICAgIHNcbiAgICAgIH1cIjogXCIke1xuICAgICAgICBjb2x1bW5OYW1lXG4gICAgICB9XCIgKCR7XG4gICAgICAgIGNvbC5sYWJlbFxuICAgICAgfSkgaXMgYSBkaWZmZXJlbnQgdHlwZSB0aGFuICR7XG4gICAgICAgIHRhYmxlTmFtZVxuICAgICAgfS4ke1xuICAgICAgICBqQ29sLm5hbWVcbiAgICAgIH0gKCR7XG4gICAgICAgIGpDb2wubGFiZWxcbiAgICAgIH0pYFxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luVG9TdHJpbmcgKGpvaW5zOiBbc3RyaW5nLCBzdHJpbmddW10pIHtcbiAgcmV0dXJuIGpvaW5zLm1hcCgoW3QsIGNdKSA9PiBgJHt0fVske2N9XWApLmpvaW4oJyArICcpXG59XG5cbmNvbnN0IEpPSU5FRF9QQVJUID0gL14oXFx3KylcXC4oXFx3KykkLztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbmVkQnkgKFxuICBzOiBzdHJpbmcsXG4pOiBbc3RyaW5nLCBzdHJpbmddW10ge1xuICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJywnKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA8IDEpIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW5lZEJ5IGRvZXNudCBleGlzdD9gKTtcbiAgY29uc3Qgam9pbmVkQnk6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICBmb3IgKGNvbnN0IHAgb2YgcGFydHMpIHtcbiAgICBjb25zdCBbXywgdGFibGVOYW1lLCBjb2x1bW5OYW1lXSA9IHAubWF0Y2goSk9JTkVEX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRS5DT0xcImApO1xuXG4gICAgam9pbmVkQnkucHVzaChbdGFibGVOYW1lLCBjb2x1bW5OYW1lXSk7XG4gIH1cbiAgcmV0dXJuIGpvaW5lZEJ5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbmVkQnlUb1N0cmluZyAoam9pbnM6IFtzdHJpbmcsIHN0cmluZ11bXSkge1xuICByZXR1cm4gam9pbnMubWFwKChbdCwgY10pID0+IGAke3R9LiR7Y31gKS5qb2luKCcsJylcbn1cbiIsICJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICAvLyBXT09QU0lFXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDhuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCAgICAgICA9IDAsXG4gIFNUUklORyAgICAgICA9IDEsXG4gIEJPT0wgICAgICAgICA9IDIsXG4gIFU4ICAgICAgICAgICA9IDMsXG4gIEk4ICAgICAgICAgICA9IDQsXG4gIFUxNiAgICAgICAgICA9IDUsXG4gIEkxNiAgICAgICAgICA9IDYsXG4gIFUzMiAgICAgICAgICA9IDcsXG4gIEkzMiAgICAgICAgICA9IDgsXG4gIEJJRyAgICAgICAgICA9IDksXG4gIFNUUklOR19BUlJBWSA9IDE3LFxuICBVOF9BUlJBWSAgICAgPSAxOSxcbiAgSThfQVJSQVkgICAgID0gMjAsXG4gIFUxNl9BUlJBWSAgICA9IDIxLFxuICBJMTZfQVJSQVkgICAgPSAyMixcbiAgVTMyX0FSUkFZICAgID0gMjMsXG4gIEkzMl9BUlJBWSAgICA9IDI0LFxuICBCSUdfQVJSQVkgICAgPSAyNSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HX0FSUkFZJyxcbiAgJ1U4X0FSUkFZJyxcbiAgJ0k4X0FSUkFZJyxcbiAgJ1UxNl9BUlJBWScsXG4gICdJMTZfQVJSQVknLFxuICAnVTMyX0FSUkFZJyxcbiAgJ0kzMl9BUlJBWScsXG4gICdCSUdfQVJSQVknLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgfENPTFVNTi5VOF9BUlJBWVxuICB8Q09MVU1OLkk4X0FSUkFZXG4gIHxDT0xVTU4uVTE2X0FSUkFZXG4gIHxDT0xVTU4uSTE2X0FSUkFZXG4gIHxDT0xVTU4uVTMyX0FSUkFZXG4gIHxDT0xVTU4uSTMyX0FSUkFZXG4gIDtcblxuY29uc3QgQ09MVU1OX1dJRFRIOiBSZWNvcmQ8TlVNRVJJQ19DT0xVTU4sIDF8Mnw0PiA9IHtcbiAgW0NPTFVNTi5VOF06IDEsXG4gIFtDT0xVTU4uSThdOiAxLFxuICBbQ09MVU1OLlUxNl06IDIsXG4gIFtDT0xVTU4uSTE2XTogMixcbiAgW0NPTFVNTi5VMzJdOiA0LFxuICBbQ09MVU1OLkkzMl06IDQsXG4gIFtDT0xVTU4uVThfQVJSQVldOiAxLFxuICBbQ09MVU1OLkk4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5VMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLkkxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uVTMyX0FSUkFZXTogNCxcbiAgW0NPTFVNTi5JMzJfQVJSQVldOiA0LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvTnVtZXJpY1R5cGUgKFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXJcbik6IE5VTUVSSUNfQ09MVU1OfG51bGwge1xuICBpZiAobWluIDwgMCkge1xuICAgIC8vIHNvbWUga2luZGEgbmVnYXRpdmU/P1xuICAgIGlmIChtaW4gPj0gLTEyOCAmJiBtYXggPD0gMTI3KSB7XG4gICAgICAvLyBzaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5JODtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMzI3NjggJiYgbWF4IDw9IDMyNzY3KSB7XG4gICAgICAvLyBzaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uSTE2O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0yMTQ3NDgzNjQ4ICYmIG1heCA8PSAyMTQ3NDgzNjQ3KSB7XG4gICAgICAvLyBzaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5JMzI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChtYXggPD0gMjU1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLlU4O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDY1NTM1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5VMTY7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNDI5NDk2NzI5NSkge1xuICAgICAgLy8gdW5zaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5VMzI7XG4gICAgfVxuICB9XG4gIC8vIEdPVE86IEJJR09PT09PT09PQk9PT09PWU9cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bWVyaWNDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgTlVNRVJJQ19DT0xVTU4ge1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5TVFJJTkc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbHVtbjxUID0gYW55LCBSIGV4dGVuZHMgVWludDhBcnJheXxudW1iZXIgPSBhbnk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUW107XG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVDtcbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVFtdLCBudW1iZXJdO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogVCk6IFIsXG4gIHNlcmlhbGl6ZUFycmF5ICh2OiBUW10pOiBSLFxuICB0b1N0cmluZyAodjogc3RyaW5nKTogYW55O1xuICByZWFkb25seSB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICByZWFkb25seSBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgb3JkZXI6IG51bWJlcjtcbiAgcmVhZG9ubHkgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48c3RyaW5nLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihgc2VlbXMgb3ZlcnJpZGUgZm9yICR7bmFtZX0gZG9lcyBub3QgcmV0dXJuIGEgc3RyaW5nYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZyB7XG4gICAgLy8gVE9ETyAtIG5lZWQgdG8gdmVyaWZ5IHRoZXJlIGFyZW4ndCBhbnkgc2luZ2xlIHF1b3Rlcz9cbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmdbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgc3RyaW5ncy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW3N0cmluZ3MsIHJlYWRdXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogc3RyaW5nW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uc3RyaW5nVG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlcltdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/ICggdGhpcy5vdmVycmlkZSh2LCB1LCBhKSApIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXJbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgICAgIG51bWJlcnMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtudW1iZXJzLCByZWFkXTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgICBpZiAodGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2ltIGFycmF5IHRobycpXG4gICAgICByZXR1cm4gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgbnVtYmVyRnJvbVZpZXcgKGk6IG51bWJlciwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSAmIDE1KSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignd2hvbXN0Jyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICB0aGlzLnB1dEJ5dGVzKHYsIDAsIGJ5dGVzKTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBudW1iZXJbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMSArIHRoaXMud2lkdGggKiB2Lmxlbmd0aClcbiAgICBsZXQgaSA9IDE7XG4gICAgZm9yIChjb25zdCBuIG9mIHYpIHtcbiAgICAgIGJ5dGVzWzBdKys7XG4gICAgICB0aGlzLnB1dEJ5dGVzKG4sIGksIGJ5dGVzKTtcbiAgICAgIGkrPXRoaXMud2lkdGg7XG4gICAgfVxuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHByaXZhdGUgcHV0Qnl0ZXModjogbnVtYmVyLCBpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tpICsgb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVlcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzQmlnQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmlzQXJyYXkgPSAodHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuXG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludFtdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnRbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IGJpZ2JvaXM6IGJpZ2ludFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgYmlnYm9pcy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW2JpZ2JvaXMsIHJlYWRdO1xuXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogYmlnaW50W10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uYmlnQm95VG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMgQklHP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuID0gZmFsc2U7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYm9vbGApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbmV2ZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKF9pOiBudW1iZXIsIF9ieXRlczogVWludDhBcnJheSk6IFtuZXZlcltdLCBudW1iZXJdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgLy8gLi4uLml0IGRpZCBub3QuXG4gICAgLy9jb25zb2xlLmxvZyhgUkVBRCBGUk9NICR7aX06IERPRVMgJHtieXRlc1tpXX0gPT09ICR7dGhpcy5mbGFnfWApO1xuICAgIHJldHVybiBbKGJ5dGVzW2ldICYgdGhpcy5mbGFnKSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkoX3Y6IGJvb2xlYW5bXSk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2kgd2lsbCBORVZFUiBiZWNvbWUgQVJSQVknKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIGlmIChhLmlzQXJyYXkgIT09IGIuaXNBcnJheSkgcmV0dXJuIGEuaXNBcnJheSA/IDEgOiAtMVxuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbiAgZGF0YTogc3RyaW5nW11bXSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGU6IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdIGFzIHVuZGVmaW5lZCB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSksXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCAoZmllbGQuYml0ICUgOCk7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIGZpZWxkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UeXBlIChcbiAgbmFtZTogc3RyaW5nLFxuICB0eXBlOiBDT0xVTU4sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4pOiBDb2x1bW5BcmdzIHtcbiAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvdyB5b3UgZ29ubmEgdXNlIGl0IHRoZW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGNvbnN0IGJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgICAgY29uc3QgZmxhZyA9IDEgPDwgKGJpdCAlIDgpO1xuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIGZsYWcsIGJpdCwgb3ZlcnJpZGUgfTtcblxuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAxLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDIsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogNCwgb3ZlcnJpZGV9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGlmIChhcmdzLnR5cGUgJiAxNikgdGhyb3cgbmV3IEVycm9yKCdubyBzdWNoIHRoaW5nIGFzIGEgZmxhZyBhcnJheScpO1xuICAgICAgcmV0dXJuIG5ldyBCb29sQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiBuZXcgTnVtZXJpY0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4gbmV3IEJpZ0NvbHVtbihhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7YXJncy50eXBlfWApO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBqb2luVG9TdHJpbmcsIGpvaW5lZEJ5VG9TdHJpbmcsIHN0cmluZ1RvSm9pbiwgc3RyaW5nVG9Kb2luZWRCeSB9IGZyb20gJy4vam9pbic7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAga2V5OiBzdHJpbmc7XG4gIGpvaW5zPzogc3RyaW5nO1xuICBqb2luZWRCeT86IHN0cmluZztcbiAgY29sdW1uczogQ29sdW1uW10sXG4gIGZpZWxkczogc3RyaW5nW10sXG4gIGZsYWdzVXNlZDogbnVtYmVyO1xuICByYXdGaWVsZHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IFtdKSA9PiBhbnk+XG59XG5cbnR5cGUgQmxvYlBhcnQgPSBhbnk7IC8vID8/Pz8/XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGpvaW5zPzogW3N0cmluZywgc3RyaW5nXVtdO1xuICByZWFkb25seSBqb2luZWRCeTogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIHJlYWRvbmx5IGtleTogc3RyaW5nO1xuICByZWFkb25seSBjb2x1bW5zQnlOYW1lOiBSZWNvcmQ8c3RyaW5nLCBDb2x1bW4+O1xuICByZWFkb25seSBmaXhlZFdpZHRoOiBudW1iZXI7IC8vIHRvdGFsIGJ5dGVzIHVzZWQgYnkgbnVtYmVycyArIGZsYWdzXG4gIHJlYWRvbmx5IGZsYWdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RyaW5nRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpZ0ZpZWxkczogbnVtYmVyO1xuICBjb25zdHJ1Y3Rvcih7IGNvbHVtbnMsIG5hbWUsIGZsYWdzVXNlZCwga2V5LCBqb2lucywgam9pbmVkQnkgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArICgoIWMuaXNBcnJheSAmJiBjLndpZHRoKSB8fCAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgaWYgKGpvaW5zKSB0aGlzLmpvaW5zID0gc3RyaW5nVG9Kb2luKGpvaW5zKTtcbiAgICBpZiAoam9pbmVkQnkpIHRoaXMuam9pbmVkQnkucHVzaCguLi5zdHJpbmdUb0pvaW5lZEJ5KGpvaW5lZEJ5KSk7XG5cbiAgICBsZXQgbzogbnVtYmVyfG51bGwgPSAwO1xuICAgIGxldCBmID0gdHJ1ZTtcbiAgICBsZXQgYiA9IGZhbHNlO1xuICAgIGxldCBmZiA9IDA7XG4gICAgZm9yIChjb25zdCBbaSwgY10gb2YgdGhpcy5jb2x1bW5zLmVudHJpZXMoKSkge1xuICAgICAgbGV0IE9DID0gLTE7XG4gICAgICAvL2lmIChjLnR5cGUgJiAxNikgYnJlYWs7XG4gICAgICBzd2l0Y2ggKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VOF9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHX0FSUkFZOlxuICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICBpZiAobyA+IDApIHtcbiAgICAgICAgICAgICAgY29uc3QgZHNvID0gTWF0aC5tYXgoMCwgaSAtIDIpXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5uYW1lLCBpLCBvLCBgRFNPOiR7ZHNvfS4uJHtpICsgMn06YCwgY29sdW1ucy5zbGljZShNYXRoLm1heCgwLCBpIC0gMiksIGkgKyAyKSk7XG4gICAgICAgICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Nob3VsZCBub3QgYmUhJylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGIpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ35+fn5+IEJPT0wgVElNRVMgRE9ORSB+fn5+ficpO1xuICAgICAgICAgICAgYiA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGZmICE9PSB0aGlzLmZsYWdGaWVsZHMpIHRocm93IG5ldyBFcnJvcignYm9vb09TQUFTT0FPJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgaWYgKCFmKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Nob3VsZCBiZSEnKVxuICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMsIG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ35+fn5+IEJPT0wgVElNRVMgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZmICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb28nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgT0MgPSBvO1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjLm9mZnNldCA9IG87IGMuYml0ID0gZmYrKzsgYy5mbGFnID0gMiAqKiAoYy5iaXQgJSA4KTsgLy8gaGVoZWhlXG4gICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4KSBvKys7XG4gICAgICAgICAgaWYgKGMuYml0ICsgMSA9PT0gdGhpcy5mbGFnRmllbGRzKSB7XG4gICAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggJiYgbyAhPT0gdGhpcy5maXhlZFdpZHRoKSB0aHJvdyBuZXcgRXJyb3IoJ1dIVVBPU0lFJylcbiAgICAgICAgICAgIGlmIChjLmZsYWcgPCAxMjggJiYgbyAhPT0gdGhpcy5maXhlZFdpZHRoIC0gMSkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRSAtIDEnKVxuICAgICAgICAgICAgZiA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgT0MgPSBvO1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjLm9mZnNldCA9IG87XG4gICAgICAgICAgaWYgKCFjLndpZHRoKSBkZWJ1Z2dlcjtcbiAgICAgICAgICBvICs9IGMud2lkdGghO1xuICAgICAgICAgIGlmIChvID09PSB0aGlzLmZpeGVkV2lkdGgpIGYgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vY29uc3Qgcm5nID0gT0MgPCAwID8gYGAgOiBgICR7T0N9Li4ke299IC8gJHt0aGlzLmZpeGVkV2lkdGh9YFxuICAgICAgLy9jb25zb2xlLmxvZyhgWyR7aX1dJHtybmd9YCwgYy5uYW1lLCBjLmxhYmVsKVxuICAgIH1cbiAgICB0aGlzLnN0cmluZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNTdHJpbmdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuICAgIHRoaXMuYmlnRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc0JpZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG5cbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogU2NoZW1hIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlYWQ6IG51bWJlcjtcbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGxldCBrZXk6IHN0cmluZztcbiAgICBsZXQgam9pbnM6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgbGV0IGpvaW5lZEJ5OiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2tleSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5zLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBbam9pbmVkQnksIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIGNvbnNvbGUubG9nKCctIEJVSCcsIG5hbWUsIGtleSwgam9pbnMsIGpvaW5lZEJ5KVxuICAgIGlmICgham9pbnMpIGpvaW5zID0gdW5kZWZpbmVkO1xuICAgIGlmICgham9pbmVkQnkpIGpvaW5lZEJ5ID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAga2V5LFxuICAgICAgam9pbnMsXG4gICAgICBqb2luZWRCeSxcbiAgICAgIGNvbHVtbnM6IFtdIGFzIENvbHVtbltdLFxuICAgICAgZmllbGRzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIGZsYWdzVXNlZDogMCxcbiAgICAgIHJhd0ZpZWxkczoge30sIC8vIG5vbmUgOjxcbiAgICAgIG92ZXJyaWRlczoge30sIC8vIG5vbmV+XG4gICAgfTtcblxuICAgIGNvbnN0IG51bUZpZWxkcyA9IGJ5dGVzW2krK10gfCAoYnl0ZXNbaSsrXSA8PCA4KTtcblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgLy8gVE9ETyAtIG9ubHkgd29ya3Mgd2hlbiAwLWZpZWxkIHNjaGVtYXMgYXJlbid0IGFsbG93ZWR+IVxuICAgIHdoaWxlIChpbmRleCA8IG51bUZpZWxkcykge1xuICAgICAgY29uc3QgdHlwZSA9IGJ5dGVzW2krK107XG4gICAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICAgIGNvbnN0IGYgPSB7XG4gICAgICAgIGluZGV4LCBuYW1lLCB0eXBlLFxuICAgICAgICB3aWR0aDogbnVsbCwgYml0OiBudWxsLCBmbGFnOiBudWxsLFxuICAgICAgICBvcmRlcjogOTk5XG4gICAgICB9O1xuICAgICAgaSArPSByZWFkO1xuICAgICAgbGV0IGM6IENvbHVtbjtcblxuICAgICAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICAgIGMgPSBuZXcgU3RyaW5nQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICAgIGMgPSBuZXcgQmlnQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBjb25zdCBiaXQgPSBhcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSAyICoqIChiaXQgJSA4KTtcbiAgICAgICAgICBjID0gbmV3IEJvb2xDb2x1bW4oeyAuLi5mLCBiaXQsIGZsYWcgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDIgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiA0IH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0eXBlICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICAgIGFyZ3MuY29sdW1ucy5wdXNoKGMpO1xuICAgICAgYXJncy5maWVsZHMucHVzaChjLm5hbWUpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTY2hlbWEoYXJncyk7XG4gIH1cblxuICByb3dGcm9tQnVmZmVyKFxuICAgICAgaTogbnVtYmVyLFxuICAgICAgYnVmZmVyOiBBcnJheUJ1ZmZlcixcbiAgICAgIF9fcm93SWQ6IG51bWJlclxuICApOiBbUm93LCBudW1iZXJdIHtcbiAgICBjb25zdCBkYnIgPSBfX3Jvd0lkIDwgNSB8fCBfX3Jvd0lkID4gMzk3NSB8fCBfX3Jvd0lkICUgMTAwMCA9PT0gMDtcbiAgICAvL2lmIChkYnIpIGNvbnNvbGUubG9nKGAgLSBST1cgJHtfX3Jvd0lkfSBGUk9NICR7aX0gKDB4JHtpLnRvU3RyaW5nKDE2KX0pYClcbiAgICBsZXQgdG90YWxSZWFkID0gMDtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICAgIGNvbnN0IHJvdzogUm93ID0geyBfX3Jvd0lkIH1cbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcblxuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIC8vaWYgKGMub2Zmc2V0ICYmIGMub2Zmc2V0ICE9PSB0b3RhbFJlYWQpIHsgZGVidWdnZXI7IGNvbnNvbGUubG9nKCd3b29wc2llJyk7IH1cbiAgICAgIGxldCBbdiwgcmVhZF0gPSBjLmlzQXJyYXkgP1xuICAgICAgICBjLmFycmF5RnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KSA6XG4gICAgICAgIGMuZnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KTtcblxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpXG4gICAgICAgIHJlYWQgPSAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpID8gMSA6IDA7XG5cbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIHRvdGFsUmVhZCArPSByZWFkO1xuICAgICAgLy8gZG9uJ3QgcHV0IGZhbHN5IHZhbHVlcyBvbiBmaW5hbCBvYmplY3RzLiBtYXkgcmV2aXNpdCBob3cgdGhpcyB3b3JrcyBsYXRlclxuICAgICAgLy9pZiAoYy5pc0FycmF5IHx8IHYpIHJvd1tjLm5hbWVdID0gdjtcbiAgICAgIHJvd1tjLm5hbWVdID0gdjtcbiAgICAgIC8vY29uc3QgdyA9IGdsb2JhbFRoaXMuX1JPV1NbdGhpcy5uYW1lXVtfX3Jvd0lkXVtjLm5hbWVdIC8vIHNycyBiaXpcbiAgICAgIC8qXG4gICAgICBpZiAodyAhPT0gdikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodykgfHwgdy5zb21lKChuLCBpKSA9PiBuICE9PSB2W2ldKSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFhYWFhYICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gLT4gJHt2fWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5lcnJvcihgX19fX18gJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSA9PSAke3Z9YClcbiAgICAgIH1cbiAgICAgICovXG4gICAgfVxuICAgIC8vaWYgKGRicikge1xuICAgICAgLy9jb25zb2xlLmxvZyhgICAgUkVBRDogJHt0b3RhbFJlYWR9IFRPICR7aX0gLyAke2J1ZmZlci5ieXRlTGVuZ3RofVxcbmAsIHJvdywgJ1xcblxcbicpO1xuICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAvL31cbiAgICByZXR1cm4gW3JvdywgdG90YWxSZWFkXTtcbiAgfVxuXG4gIHByaW50Um93IChyOiBSb3csIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+KSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKSk7XG4gIH1cblxuICBzZXJpYWxpemVIZWFkZXIgKCk6IEJsb2Ige1xuICAgIC8vIFsuLi5uYW1lLCAwLCBudW1GaWVsZHMwLCBudW1GaWVsZHMxLCBmaWVsZDBUeXBlLCBmaWVsZDBGbGFnPywgLi4uZmllbGQwTmFtZSwgMCwgZXRjXTtcbiAgICAvLyBUT0RPIC0gQmFzZSB1bml0IGhhcyA1MDArIGZpZWxkc1xuICAgIGlmICh0aGlzLmNvbHVtbnMubGVuZ3RoID4gNjU1MzUpIHRocm93IG5ldyBFcnJvcignb2ggYnVkZHkuLi4nKTtcbiAgICBjb25zdCBwYXJ0cyA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKSxcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5rZXkpLFxuICAgICAgLi4udGhpcy5zZXJpYWxpemVKb2lucygpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUpvaW5zICgpIHtcbiAgICBsZXQgaiA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGxldCBqYiA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGlmICh0aGlzLmpvaW5zKSBqID0gc3RyaW5nVG9CeXRlcyhqb2luVG9TdHJpbmcodGhpcy5qb2lucykpO1xuICAgIGlmICh0aGlzLmpvaW5lZEJ5KSBqYiA9IHN0cmluZ1RvQnl0ZXMoam9pbmVkQnlUb1N0cmluZyh0aGlzLmpvaW5lZEJ5KSk7XG4gICAgcmV0dXJuIFsuLi5qLCAuLi5qYl07XG4gIH1cblxuICBzZXJpYWxpemVSb3cgKHI6IFJvdyk6IEJsb2Ige1xuICAgIGNvbnN0IGZpeGVkID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5maXhlZFdpZHRoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgY29uc3QgYmxvYlBhcnRzOiBCbG9iUGFydFtdID0gW2ZpeGVkXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2ID0gcltjLm5hbWVdXG4gICAgICAgIGlmIChjLmlzQXJyYXkpIHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVBcnJheSh2IGFzIGFueVtdKVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgc3RyaW5nKVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBiaWdpbnQpXG4gICAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgfSBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgICAgLy8gZG9udCBuZWVkIHRvIGNoZWNrIGZvciB0aGUgbGFzdCBmbGFnIHNpbmNlIHdlIG5vIGxvbmdlciBuZWVkIGlcbiAgICAgICAgICAgIC8vIGFmdGVyIHdlJ3JlIGRvbmUgd2l0aCBudW1iZXJzIGFuZCBib29sZWFuc1xuICAgICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAgIC8vIC4uLmJ1dCB3ZSB3aWxsIGJlY2F1eXNlIHdlIGJyb2tlIHNvbWV0aGlnblxuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSBpKys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICAgIGNvbnN0IGJ5dGVzID0gYy5zZXJpYWxpemVSb3codiBhcyBudW1iZXIpXG4gICAgICAgICAgICBmaXhlZC5zZXQoYnl0ZXMsIGkpXG4gICAgICAgICAgICBpICs9IGMud2lkdGghO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHsoYyBhcyBhbnkpLnR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgQ09MVU1OOicsIGMpO1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIFJPVzonLCByKTtcbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9pZiAoci5fX3Jvd0lkIDwgNSB8fCByLl9fcm93SWQgPiAzOTc1IHx8IHIuX19yb3dJZCAlIDEwMDAgPT09IDApIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAtIFJPVyAke3IuX19yb3dJZH1gLCB7IGksIGJsb2JQYXJ0cywgciB9KTtcbiAgICAvL31cbiAgICByZXR1cm4gbmV3IEJsb2IoYmxvYlBhcnRzKTtcbiAgfVxuXG4gIHByaW50ICh3aWR0aCA9IDgwKTogdm9pZCB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDM2KTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zdCB7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0gPSB0aGlzO1xuICAgIGNvbnNvbGUubG9nKHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSk7XG4gICAgY29uc29sZS50YWJsZSh0aGlzLmNvbHVtbnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdsYWJlbCcsXG4gICAgICAnb2Zmc2V0JyxcbiAgICAgICdvcmRlcicsXG4gICAgICAnYml0JyxcbiAgICAgICd0eXBlJyxcbiAgICAgICdmbGFnJyxcbiAgICAgICd3aWR0aCcsXG4gICAgXSk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG5cbiAgfVxuXG4gIC8vIHJhd1RvUm93IChkOiBSYXdSb3cpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7fVxuICAvLyByYXdUb1N0cmluZyAoZDogUmF3Um93LCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7fVxufTtcblxuIiwgImltcG9ydCB7IHZhbGlkYXRlSm9pbiB9IGZyb20gJy4vam9pbic7XG5pbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuZXhwb3J0IHR5cGUgUm93RGF0YSA9IGFueTsgLy8gZm1sXG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBSb3dEYXRhPiAmIHsgX19yb3dJZDogbnVtYmVyIH07XG5cbnR5cGUgVGFibGVCbG9iID0geyBudW1Sb3dzOiBudW1iZXIsIGhlYWRlckJsb2I6IEJsb2IsIGRhdGFCbG9iOiBCbG9iIH07XG5cbmV4cG9ydCBjbGFzcyBUYWJsZSB7XG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEubmFtZSB9XG4gIGdldCBrZXkgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNjaGVtYS5rZXkgfVxuICByZWFkb25seSBtYXA6IE1hcDxhbnksIGFueT4gPSBuZXcgTWFwKClcbiAgY29uc3RydWN0b3IgKFxuICAgIHJlYWRvbmx5IHJvd3M6IFJvd1tdLFxuICAgIHJlYWRvbmx5IHNjaGVtYTogU2NoZW1hLFxuICApIHtcbiAgICBjb25zdCBrZXlOYW1lID0gdGhpcy5rZXk7XG4gICAgaWYgKGtleU5hbWUgIT09ICdfX3Jvd0lkJykgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSB7XG4gICAgICBjb25zdCBrZXkgPSByb3dba2V5TmFtZV07XG4gICAgICBpZiAodGhpcy5tYXAuaGFzKGtleSkpIHRocm93IG5ldyBFcnJvcigna2V5IGlzIG5vdCB1bmlxdWUnKTtcbiAgICAgIHRoaXMubWFwLnNldChrZXksIHJvdyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFwcGx5TGF0ZUpvaW5zIChcbiAgICBqdDogVGFibGUsXG4gICAgdGFibGVzOiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT4sXG4gICAgYWRkRGF0YTogYm9vbGVhblxuICApOiBUYWJsZSB7XG4gICAgY29uc3Qgam9pbnMgPSBqdC5zY2hlbWEuam9pbnM7XG5cbiAgICBpZiAoIWpvaW5zKSB0aHJvdyBuZXcgRXJyb3IoJ3NoaXQgYXNzIGlkaXRvdCB3aG9tc3QnKTtcbiAgICBmb3IgKGNvbnN0IGogb2Ygam9pbnMpIHtcbiAgICAgIHZhbGlkYXRlSm9pbihqLCBqdCwgdGFibGVzKTtcbiAgICAgIGNvbnN0IFt0biwgY25dID0gajtcbiAgICAgIGNvbnN0IHQgPSB0YWJsZXNbdG5dO1xuICAgICAgY29uc3QgamIgPSB0LnNjaGVtYS5qb2luZWRCeTtcbiAgICAgIGlmIChqYi5zb21lKChbamJ0biwgXSkgPT4gamJ0biA9PT0gdG4pKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dG59IGFscmVhZHkgam9pbmVkICR7an1gKVxuICAgICAgamIucHVzaChbanQuc2NoZW1hLm5hbWUsIGNuXSk7XG4gICAgfVxuXG4gICAgaWYgKGFkZERhdGEpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ0FQUExZSU5HJylcbiAgICAgIGZvciAoY29uc3QgciBvZiBqdC5yb3dzKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJy0gSk9JTicsIHIpXG4gICAgICAgIGZvciAoY29uc3QgW3RuLCBjbl0gb2YganQuc2NoZW1hLmpvaW5zKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnICAtJywgdG4sICdPTicsIGNuKTtcbiAgICAgICAgICBjb25zdCBqciA9IHRhYmxlc1t0bl0ubWFwLmdldChyW2NuXSk7XG4gICAgICAgICAgaWYgKCFqcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBNSVNTRUQgQSBKT0lOICR7dG59WyR7Y259XTogTk9USElORyBUSEVSRWAsIHIpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChqcltqdC5uYW1lXSkganJbanQubmFtZV0ucHVzaChyKTtcbiAgICAgICAgICBlbHNlIGpyW2p0Lm5hbWVdID0gW3JdO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJyAgPicsIGpyLmlkLCBqci5uYW1lLCBqclt0bl0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKFxuICAgICAgICAvL2p0LnNjaGVtYS5uYW1lLFxuICAgICAgICAvL3RhYmxlcy5NYWdpY1NpdGUucm93cy5maWx0ZXIociA9PiByW2p0LnNjaGVtYS5uYW1lXSlcbiAgICAgICAgLy9bLi4udGFibGVzLk1hZ2ljU2l0ZS5tYXAudmFsdWVzKCldLmZpbmQociA9PiByWydTaXRlQnlOYXRpb24nXSlcbiAgICAgIC8vKVxuICAgIH1cblxuICAgIHJldHVybiBqdDtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmVUYWJsZSAodGFibGU6IFRhYmxlLCBsaXN0PzogVGFibGVbXSwgbWFwPzogUmVjb3JkPHN0cmluZywgVGFibGU+KSB7XG4gICAgaWYgKGxpc3QpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhYmxlKTtcbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihgdGFibGUgJHt0YWJsZS5uYW1lfSBpcyBub3QgaW4gdGhlIGxpc3RgKTtcbiAgICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAobWFwKSB7XG4gICAgICBpZiAodGFibGUubmFtZSBpbiBtYXApIGRlbGV0ZSBtYXBbdGFibGUubmFtZV07XG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihgdGFibGUgJHt0YWJsZS5uYW1lfSBpcyBub3QgaW4gdGhlIG1hcGApO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogW1VpbnQzMkFycmF5LCBCbG9iLCBCbG9iXSB7XG4gICAgLy8gW251bVJvd3MsIGhlYWRlclNpemUsIGRhdGFTaXplXSwgc2NoZW1hSGVhZGVyLCBbcm93MCwgcm93MSwgLi4uIHJvd05dO1xuICAgIGNvbnN0IHNjaGVtYUhlYWRlciA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZUhlYWRlcigpO1xuICAgIC8vIGNhbnQgZmlndXJlIG91dCBob3cgdG8gZG8gdGhpcyB3aXRoIGJpdHMgOic8XG4gICAgY29uc3Qgc2NoZW1hUGFkZGluZyA9ICg0IC0gc2NoZW1hSGVhZGVyLnNpemUgJSA0KSAlIDQ7XG4gICAgY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpKTtcblxuICAgIC8vY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4ge1xuICAgICAgLy9jb25zdCByb3dCbG9iID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpXG4gICAgICAvL2lmIChyLl9fcm93SWQgPT09IDApXG4gICAgICAgIC8vcm93QmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oYWIgPT4ge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coYEFSUkFZIEJVRkZFUiBGT1IgRklSU1QgUk9XIE9GICR7dGhpcy5uYW1lfWAsIG5ldyBVaW50OEFycmF5KGFiKS5qb2luKCcsICcpKTtcbiAgICAgICAgLy99KTtcbiAgICAgIC8vcmV0dXJuIHJvd0Jsb2I7XG4gICAgLy99KTtcbiAgICBjb25zdCByb3dCbG9iID0gbmV3IEJsb2Iocm93RGF0YSlcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93QmxvYi5zaXplICUgNCkgJSA0O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBVaW50MzJBcnJheShbXG4gICAgICAgIHRoaXMucm93cy5sZW5ndGgsXG4gICAgICAgIHNjaGVtYUhlYWRlci5zaXplICsgc2NoZW1hUGFkZGluZyxcbiAgICAgICAgcm93QmxvYi5zaXplICsgZGF0YVBhZGRpbmdcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICBzY2hlbWFIZWFkZXIsXG4gICAgICAgIG5ldyBBcnJheUJ1ZmZlcihzY2hlbWFQYWRkaW5nKSBhcyBhbnkgLy8gPz8/XG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgcm93QmxvYixcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZGF0YVBhZGRpbmcpXG4gICAgICBdKSxcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGNvbmNhdFRhYmxlcyAodGFibGVzOiBUYWJsZVtdKTogQmxvYiB7XG4gICAgY29uc3QgYWxsU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoMSArIHRhYmxlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCBhbGxIZWFkZXJzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBhbGxEYXRhOiBCbG9iW10gPSBbXTtcblxuICAgIGNvbnN0IGJsb2JzID0gdGFibGVzLm1hcCh0ID0+IHQuc2VyaWFsaXplKCkpO1xuICAgIGFsbFNpemVzWzBdID0gYmxvYnMubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgW2ksIFtzaXplcywgaGVhZGVycywgZGF0YV1dIG9mIGJsb2JzLmVudHJpZXMoKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgT1VUIEJMT0JTIEZPUiBUPSR7aX1gLCBzaXplcywgaGVhZGVycywgZGF0YSlcbiAgICAgIGFsbFNpemVzLnNldChzaXplcywgMSArIGkgKiAzKTtcbiAgICAgIGFsbEhlYWRlcnMucHVzaChoZWFkZXJzKTtcbiAgICAgIGFsbERhdGEucHVzaChkYXRhKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIGNvbnN0IHRhYmxlTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlcy5tYXAodCA9PiBbdC5zY2hlbWEubmFtZSwgdF0pKTtcblxuICAgIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIHtcbiAgICAgIGlmICghdC5zY2hlbWEuam9pbnMpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBbYVQsIGFGXSBvZiB0LnNjaGVtYS5qb2lucykge1xuICAgICAgICBjb25zdCB0QSA9IHRhYmxlTWFwW2FUXTtcbiAgICAgICAgaWYgKCF0QSkgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YVR9YCk7XG4gICAgICAgIGlmICghdC5yb3dzLmxlbmd0aCkgY29udGludWU7IC8vIGVtcHR5IHRhYmxlIGkgZ3Vlc3M/XG4gICAgICAgIGZvciAoY29uc3QgciBvZiB0LnJvd3MpIHtcbiAgICAgICAgICBjb25zdCBpZEEgPSByW2FGXTtcbiAgICAgICAgICBpZiAoaWRBID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBiYWQgaWQ/YCwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYSA9IHRBLm1hcC5nZXQoaWRBKTtcbiAgICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByb3cgaGFzIGEgbWlzc2luZyBpZD9gLCBhLCBpZEEsIHIpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIChhW3QubmFtZV0gPz89IFtdKS5wdXNoKHIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZU1hcDtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmcm9tQmxvYiAoe1xuICAgIGhlYWRlckJsb2IsXG4gICAgZGF0YUJsb2IsXG4gICAgbnVtUm93cyxcbiAgfTogVGFibGVCbG9iKTogUHJvbWlzZTxUYWJsZT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IFNjaGVtYS5mcm9tQnVmZmVyKGF3YWl0IGhlYWRlckJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgbGV0IHJibyA9IDA7XG4gICAgbGV0IF9fcm93SWQgPSAwO1xuICAgIGNvbnN0IHJvd3M6IFJvd1tdID0gW107XG4gICAgLy8gVE9ETyAtIGNvdWxkIGRlZmluaXRlbHkgdXNlIGEgc3RyZWFtIGZvciB0aGlzXG4gICAgY29uc3QgZGF0YUJ1ZmZlciA9IGF3YWl0IGRhdGFCbG9iLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc29sZS5sb2coYD09PT09IFJFQUQgJHtudW1Sb3dzfSBPRiAke3NjaGVtYS5uYW1lfSA9PT09PWApXG4gICAgd2hpbGUgKF9fcm93SWQgPCBudW1Sb3dzKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgcmJvICs9IHJlYWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xuICB9XG5cblxuICBwcmludCAoXG4gICAgd2lkdGg6IG51bWJlciA9IDgwLFxuICAgIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+fG51bGwgPSBudWxsLFxuICAgIG46IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBtOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgcD86IChyOiBhbnkpID0+IGJvb2xlYW4sXG4gICk6IG51bGx8YW55W10ge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAxOCk7XG4gICAgY29uc3Qgcm93cyA9IHAgPyB0aGlzLnJvd3MuZmlsdGVyKHApIDpcbiAgICAgIG4gPT09IG51bGwgPyB0aGlzLnJvd3MgOlxuICAgICAgbSA9PT0gbnVsbCA/IHRoaXMucm93cy5zbGljZSgwLCBuKSA6XG4gICAgICB0aGlzLnJvd3Muc2xpY2UobiwgbSk7XG5cblxuICAgIGxldCBtRmllbGRzID0gQXJyYXkuZnJvbSgoZmllbGRzID8/IHRoaXMuc2NoZW1hLmZpZWxkcykpO1xuICAgIGlmIChwKSBbbiwgbV0gPSBbMCwgcm93cy5sZW5ndGhdXG4gICAgZWxzZSAobUZpZWxkcyBhcyBhbnkpLnVuc2hpZnQoJ19fcm93SWQnKTtcblxuICAgIGNvbnN0IFtwUm93cywgcEZpZWxkc10gPSBmaWVsZHMgP1xuICAgICAgW3Jvd3MubWFwKChyOiBSb3cpID0+IHRoaXMuc2NoZW1hLnByaW50Um93KHIsIG1GaWVsZHMpKSwgZmllbGRzXTpcbiAgICAgIFtyb3dzLCB0aGlzLnNjaGVtYS5maWVsZHNdXG4gICAgICA7XG5cbiAgICBjb25zb2xlLmxvZygncm93IGZpbHRlcjonLCBwID8/ICcobm9uZSknKVxuICAgIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnNvbGUudGFibGUocFJvd3MsIHBGaWVsZHMpO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuICAgIHJldHVybiAocCAmJiBmaWVsZHMpID9cbiAgICAgIHJvd3MubWFwKHIgPT5cbiAgICAgICAgT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pLmZpbHRlcihlID0+IGVbMV0pKVxuICAgICAgKSA6XG4gICAgICBudWxsO1xuICB9XG5cbiAgZHVtcFJvdyAoaTogbnVtYmVyfG51bGwsIHNob3dFbXB0eSA9IGZhbHNlLCB1c2VDU1M/OiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgIC8vIFRPRE8gXHUyMDE0IGluIGJyb3dzZXIsIHVzZUNTUyA9PT0gdHJ1ZSBieSBkZWZhdWx0XG4gICAgdXNlQ1NTID8/PSAoZ2xvYmFsVGhpc1snd2luZG93J10gPT09IGdsb2JhbFRoaXMpOyAvLyBpZGtcbiAgICBpID8/PSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLnJvd3MubGVuZ3RoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLnJvd3NbaV07XG4gICAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGNzczogc3RyaW5nW118bnVsbCA9IHVzZUNTUyA/IFtdIDogbnVsbDtcbiAgICBjb25zdCBmbXQgPSBmbXRTdHlsZWQuYmluZChudWxsLCBvdXQsIGNzcyk7XG4gICAgY29uc3QgcCA9IE1hdGgubWF4KFxuICAgICAgLi4udGhpcy5zY2hlbWEuY29sdW1uc1xuICAgICAgLmZpbHRlcihjID0+IHNob3dFbXB0eSB8fCByb3dbYy5uYW1lXSlcbiAgICAgIC5tYXAoYyA9PiBjLm5hbWUubGVuZ3RoICsgMilcbiAgICApO1xuICAgIGlmICghcm93KVxuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV0gZG9lcyBub3QgZXhpc3RgLCBDX05PVF9GT1VORCk7XG4gICAgZWxzZSB7XG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XWAsIENfUk9XX0hFQUQpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIHRoaXMuc2NoZW1hLmNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbYy5uYW1lXTtcbiAgICAgICAgY29uc3QgbiA9IGMubmFtZS5wYWRTdGFydChwLCAnICcpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjVFJVRWAsIENfVFJVRSlcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06ICVjRkFMU0VgLCBDX05PVF9GT1VORCwgQ19GQUxTRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX05VTUJFUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDBgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX1NUUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IFx1MjAxNGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChge259OiAlYzAgJWMke3ZhbHVlfSAoQklHKWAsIENfQklHLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwIChCSUcpYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHVzZUNTUykgcmV0dXJuIFtvdXQuam9pbignXFxuJyksIC4uLmNzcyFdO1xuICAgIGVsc2UgcmV0dXJuIFtvdXQuam9pbignXFxuJyldO1xuICB9XG5cbiAgZmluZFJvdyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4sIHN0YXJ0ID0gMCk6IG51bWJlciB7XG4gICAgY29uc3QgTiA9IHRoaXMucm93cy5sZW5ndGhcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IE4gLSBzdGFydDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBOOyBpKyspIGlmIChwcmVkaWNhdGUodGhpcy5yb3dzW2ldKSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgKiBmaWx0ZXJSb3dzIChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbik6IEdlbmVyYXRvcjxSb3c+IHtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIGlmIChwcmVkaWNhdGUocm93KSkgeWllbGQgcm93O1xuICB9XG4gIC8qXG4gIHJhd1RvUm93IChkOiBzdHJpbmdbXSk6IFJvdyB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNjaGVtYS5jb2x1bW5zLm1hcChyID0+IFtcbiAgICAgIHIubmFtZSxcbiAgICAgIHIudG9WYWwoZFtyLmluZGV4XSlcbiAgICBdKSk7XG4gIH1cbiAgcmF3VG9TdHJpbmcgKGQ6IHN0cmluZ1tdLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgLy8ganVzdCBhc3N1bWUgZmlyc3QgdHdvIGZpZWxkcyBhcmUgYWx3YXlzIGlkLCBuYW1lLiBldmVuIGlmIHRoYXQncyBub3QgdHJ1ZVxuICAgIC8vIHRoaXMgaXMganVzdCBmb3IgdmlzdWFsaXphdGlvbiBwdXJwb3JzZXNcbiAgICBsZXQgZXh0cmEgPSAnJztcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHM6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBlID0gdGhpcy5yYXdUb1JvdyhkKTtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBhcmdzKSB7XG4gICAgICAgIC8vIGRvbid0IHJlcHJpbnQgbmFtZSBvciBpZFxuICAgICAgICBpZiAoYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzBdIHx8IGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1sxXSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKGVbYV0gIT0gbnVsbClcbiAgICAgICAgICBzLnB1c2goYCR7YX06ICR7SlNPTi5zdHJpbmdpZnkoZVthXSl9YClcbiAgICAgIH1cbiAgICAgIGV4dHJhID0gcy5sZW5ndGggPiAwID8gYCB7ICR7cy5qb2luKCcsICcpfSB9YCA6ICd7fSc7XG4gICAgfVxuICAgIHJldHVybiBgPCR7dGhpcy5zY2hlbWEubmFtZX06JHtkWzBdID8/ICc/J30gXCIke2RbMV19XCIke2V4dHJhfT5gO1xuICB9XG4gICovXG59XG5cbmZ1bmN0aW9uIGZtdFN0eWxlZCAoXG4gIG91dDogc3RyaW5nW10sXG4gIGNzc091dDogc3RyaW5nW10gfCBudWxsLFxuICBtc2c6IHN0cmluZyxcbiAgLi4uY3NzOiBzdHJpbmdbXVxuKSB7XG4gIGlmIChjc3NPdXQpIHtcbiAgICBvdXQucHVzaChtc2cgKyAnJWMnKVxuICAgIGNzc091dC5wdXNoKC4uLmNzcywgQ19SRVNFVCk7XG4gIH1cbiAgZWxzZSBvdXQucHVzaChtc2cucmVwbGFjZSgvJWMvZywgJycpKTtcbn1cblxuY29uc3QgQ19OT1RfRk9VTkQgPSAnY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYzsnO1xuY29uc3QgQ19ST1dfSEVBRCA9ICdmb250LXdlaWdodDogYm9sZGVyJztcbmNvbnN0IENfQk9MRCA9ICdmb250LXdlaWdodDogYm9sZCc7XG5jb25zdCBDX05VTUJFUiA9ICdjb2xvcjogI0EwNTUxODsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfVFJVRSA9ICdjb2xvcjogIzRDMzhCRTsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfRkFMU0UgPSAnY29sb3I6ICMzOEJFMUM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1NUUiA9ICdjb2xvcjogIzMwQUE2MjsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfQklHID0gJ2NvbG9yOiAjNzgyMUEzOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19SRVNFVCA9ICdjb2xvcjogdW5zZXQ7IGZvbnQtc3R5bGU6IHVuc2V0OyBmb250LXdlaWdodDogdW5zZXQ7IGJhY2tncm91bmQtdW5zZXQnXG4iLCAiaW1wb3J0IHsgQ09MVU1OLCBTY2hlbWFBcmdzIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgdHlwZSB7IFBhcnNlU2NoZW1hT3B0aW9ucyB9IGZyb20gJy4vcGFyc2UtY3N2J1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XG5leHBvcnQgY29uc3QgY3N2RGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+PiA9IHtcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VVLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdCcsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbXG4gICAgICAvLyBjb21iaW5lZCBpbnRvIGFuIGFycmF5IGZpZWxkXG4gICAgICAnYXJtb3IxJywgJ2FybW9yMicsICdhcm1vcjMnLCAnYXJtb3I0JywgJ2VuZCcsXG4gICAgICAnd3BuMScsICd3cG4yJywgJ3dwbjMnLCAnd3BuNCcsICd3cG41JywgJ3dwbjYnLCAnd3BuNycsXG5cbiAgICAgIC8vIGFsbCBjb21iaW5lZCBpbnRvIG9uZSBhcnJheSBmaWVsZFxuICAgICAgJ2xpbmsxJywgJ2xpbmsyJywgJ2xpbmszJywgJ2xpbms0JywgJ2xpbms1JywgJ2xpbms2JyxcbiAgICAgICdtYXNrMScsICdtYXNrMicsICdtYXNrMycsICdtYXNrNCcsICdtYXNrNScsICdtYXNrNicsXG4gICAgICAnbmJyMScsICAnbmJyMicsICAnbmJyMycsICAnbmJyNCcsICAnbmJyNScsICAnbmJyNicsXG4gICAgICAncmFuZDEnLCAncmFuZDInLCAncmFuZDMnLCAncmFuZDQnLCAncmFuZDUnLCAncmFuZDYnLFxuXG4gICAgICAvLyBkZXByZWNhdGVkXG4gICAgICAnbW91bnRlZCcsXG4gICAgICAvLyByZWR1bmRhbnRcbiAgICAgICdyZWFuaW1hdG9yfjEnLFxuICAgIF0pLFxuICAgIGtub3duRmllbGRzOiB7XG4gICAgICBpZDogQ09MVU1OLlUxNixcbiAgICAgIG5hbWU6IENPTFVNTi5TVFJJTkcsXG4gICAgICBydDogQ09MVU1OLlU4LFxuICAgICAgcmVjbGltaXQ6IENPTFVNTi5JOCxcbiAgICAgIGJhc2Vjb3N0OiBDT0xVTU4uVTE2LFxuICAgICAgcmNvc3Q6IENPTFVNTi5JOCxcbiAgICAgIHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHJlc3NpemU6IENPTFVNTi5VOCxcbiAgICAgIGhwOiBDT0xVTU4uVTE2LFxuICAgICAgcHJvdDogQ09MVU1OLlU4LFxuICAgICAgbXI6IENPTFVNTi5VOCxcbiAgICAgIG1vcjogQ09MVU1OLlU4LFxuICAgICAgc3RyOiBDT0xVTU4uVTgsXG4gICAgICBhdHQ6IENPTFVNTi5VOCxcbiAgICAgIGRlZjogQ09MVU1OLlU4LFxuICAgICAgcHJlYzogQ09MVU1OLlU4LFxuICAgICAgZW5jOiBDT0xVTU4uVTgsXG4gICAgICBtYXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBhcDogQ09MVU1OLlU4LFxuICAgICAgYW1iaWRleHRyb3VzOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudG1ucjogQ09MVU1OLlUxNixcbiAgICAgIHNraWxsZWRyaWRlcjogQ09MVU1OLlU4LFxuICAgICAgcmVpbnZpZ29yYXRpb246IENPTFVNTi5VOCxcbiAgICAgIGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgdW5kZWFkbGVhZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2xlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBtYXhhZ2U6IENPTFVNTi5VMTYsXG4gICAgICBoYW5kOiBDT0xVTU4uVTgsXG4gICAgICBoZWFkOiBDT0xVTU4uVTgsXG4gICAgICBtaXNjOiBDT0xVTU4uVTgsXG4gICAgICBwYXRoY29zdDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRkb206IENPTFVNTi5VOCxcbiAgICAgIGJvbnVzc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBGOiBDT0xVTU4uVTgsXG4gICAgICBBOiBDT0xVTU4uVTgsXG4gICAgICBXOiBDT0xVTU4uVTgsXG4gICAgICBFOiBDT0xVTU4uVTgsXG4gICAgICBTOiBDT0xVTU4uVTgsXG4gICAgICBEOiBDT0xVTU4uVTgsXG4gICAgICBOOiBDT0xVTU4uVTgsXG4gICAgICBHOiBDT0xVTU4uVTgsXG4gICAgICBCOiBDT0xVTU4uVTgsXG4gICAgICBIOiBDT0xVTU4uVTgsXG4gICAgICBzYWlsaW5nc2hpcHNpemU6IENPTFVNTi5VMTYsXG4gICAgICBzYWlsaW5nbWF4dW5pdHNpemU6IENPTFVNTi5VOCxcbiAgICAgIHN0ZWFsdGh5OiBDT0xVTU4uVTgsXG4gICAgICBwYXRpZW5jZTogQ09MVU1OLlU4LFxuICAgICAgc2VkdWNlOiBDT0xVTU4uVTgsXG4gICAgICBzdWNjdWJ1czogQ09MVU1OLlU4LFxuICAgICAgY29ycnVwdDogQ09MVU1OLlU4LFxuICAgICAgaG9tZXNpY2s6IENPTFVNTi5VOCxcbiAgICAgIGZvcm1hdGlvbmZpZ2h0ZXI6IENPTFVNTi5JOCxcbiAgICAgIHN0YW5kYXJkOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJhdGlvbmFsOiBDT0xVTU4uSTgsXG4gICAgICB0YXNrbWFzdGVyOiBDT0xVTU4uVTgsXG4gICAgICBiZWFzdG1hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYm9keWd1YXJkOiBDT0xVTU4uVTgsXG4gICAgICB3YXRlcmJyZWF0aGluZzogQ09MVU1OLlUxNixcbiAgICAgIGljZXByb3Q6IENPTFVNTi5VOCxcbiAgICAgIGludnVsbmVyYWJsZTogQ09MVU1OLlU4LFxuICAgICAgc2hvY2tyZXM6IENPTFVNTi5JOCxcbiAgICAgIGZpcmVyZXM6IENPTFVNTi5JOCxcbiAgICAgIGNvbGRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHBvaXNvbnJlczogQ09MVU1OLlU4LFxuICAgICAgYWNpZHJlczogQ09MVU1OLkk4LFxuICAgICAgdm9pZHNhbml0eTogQ09MVU1OLlU4LFxuICAgICAgZGFya3Zpc2lvbjogQ09MVU1OLlU4LFxuICAgICAgYW5pbWFsYXdlOiBDT0xVTU4uVTgsXG4gICAgICBhd2U6IENPTFVNTi5VOCxcbiAgICAgIGhhbHRoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBmZWFyOiBDT0xVTU4uVTgsXG4gICAgICBiZXJzZXJrOiBDT0xVTU4uVTgsXG4gICAgICBjb2xkOiBDT0xVTU4uVTgsXG4gICAgICBoZWF0OiBDT0xVTU4uVTgsXG4gICAgICBmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBiYW5lZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZGFtYWdlcmV2OiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25jbG91ZDogQ09MVU1OLlU4LFxuICAgICAgZGlzZWFzZWNsb3VkOiBDT0xVTU4uVTgsXG4gICAgICBzbGltZXI6IENPTFVNTi5VOCxcbiAgICAgIG1pbmRzbGltZTogQ09MVU1OLlUxNixcbiAgICAgIHJlZ2VuZXJhdGlvbjogQ09MVU1OLlU4LFxuICAgICAgcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uYXJtb3I6IENPTFVNTi5VOCxcbiAgICAgIGV5ZWxvc3M6IENPTFVNTi5VOCxcbiAgICAgIGV0aHRydWU6IENPTFVNTi5VOCxcbiAgICAgIHN0b3JtcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgY29sZHBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBkYXJrcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHdpbnRlcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBzcHJpbmdwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3VtbWVycG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZhbGxwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZm9yZ2Vib251czogQ09MVU1OLlU4LFxuICAgICAgZml4Zm9yZ2Vib251czogQ09MVU1OLkk4LFxuICAgICAgbWFzdGVyc21pdGg6IENPTFVNTi5JOCxcbiAgICAgIHJlc291cmNlczogQ09MVU1OLlU4LFxuICAgICAgYXV0b2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgYXV0b2Rpc2hlYWxlcjogQ09MVU1OLlU4LFxuICAgICAgbm9iYWRldmVudHM6IENPTFVNTi5VOCxcbiAgICAgIGluc2FuZTogQ09MVU1OLlU4LFxuICAgICAgc2hhdHRlcmVkc291bDogQ09MVU1OLlU4LFxuICAgICAgbGVwZXI6IENPTFVNTi5VOCxcbiAgICAgIGNoYW9zcmVjOiBDT0xVTU4uVTgsXG4gICAgICBwaWxsYWdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIHBhdHJvbGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBjYXN0bGVkZWY6IENPTFVNTi5VOCxcbiAgICAgIHNpZWdlYm9udXM6IENPTFVNTi5JMTYsXG4gICAgICBpbmNwcm92ZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzdXBwbHlib251czogQ09MVU1OLlU4LFxuICAgICAgaW5jdW5yZXN0OiBDT0xVTU4uSTE2LFxuICAgICAgcG9wa2lsbDogQ09MVU1OLlUxNixcbiAgICAgIHJlc2VhcmNoYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIGluc3BpcmluZ3JlczogQ09MVU1OLkk4LFxuICAgICAgZG91c2U6IENPTFVNTi5VOCxcbiAgICAgIGFkZXB0c2FjcjogQ09MVU1OLlU4LFxuICAgICAgY3Jvc3NicmVlZGVyOiBDT0xVTU4uVTgsXG4gICAgICBtYWtlcGVhcmxzOiBDT0xVTU4uVTgsXG4gICAgICB2b2lkc3VtOiBDT0xVTU4uVTgsXG4gICAgICBoZXJldGljOiBDT0xVTU4uVTgsXG4gICAgICBlbGVnaXN0OiBDT0xVTU4uVTgsXG4gICAgICBzaGFwZWNoYW5nZTogQ09MVU1OLlUxNixcbiAgICAgIGZpcnN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBzZWNvbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIGxhbmRzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHdhdGVyc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBmb3Jlc3RzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHBsYWluc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB4cHNoYXBlOiBDT0xVTU4uVTgsXG4gICAgICBuYW1ldHlwZTogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uOiBDT0xVTU4uSTE2LFxuICAgICAgbl9zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMTogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRvbXN1bW1vbjI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yMDogQ09MVU1OLkkxNixcbiAgICAgIGJsb29kdmVuZ2VhbmNlOiBDT0xVTU4uVTgsXG4gICAgICBicmluZ2Vyb2Zmb3J0dW5lOiBDT0xVTU4uSTgsXG4gICAgICByZWFsbTE6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMzogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNDogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMWQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0yZDY6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTNkNjogQ09MVU1OLkkxNixcbiAgICAgIGJhdHN0YXJ0c3VtNGQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW01ZDY6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtNmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgdHVybW9pbHN1bW1vbjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRoZmlyZTogQ09MVU1OLlU4LFxuICAgICAgdXdyZWdlbjogQ09MVU1OLlU4LFxuICAgICAgc2hyaW5raHA6IENPTFVNTi5VOCxcbiAgICAgIGdyb3docDogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpbmdhZmY6IENPTFVNTi5VMzIsXG4gICAgICBmaXhlZHJlc2VhcmNoOiBDT0xVTU4uVTgsXG4gICAgICBsYW1pYWxvcmQ6IENPTFVNTi5VOCxcbiAgICAgIHByZWFuaW1hdG9yOiBDT0xVTU4uVTgsXG4gICAgICBkcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgbXVtbWlmeTogQ09MVU1OLlUxNixcbiAgICAgIG9uZWJhdHRsZXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgYWlyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBlYXJ0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRoYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbmF0dXJlYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEY6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0VzogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdEU6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RTOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0RDogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdE46IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RBTEw6IENPTFVNTi5JOCxcbiAgICAgIGV5ZXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWVhdGVyOiBDT0xVTU4uVTgsXG4gICAgICBwb2lzb25za2luOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGl0ZW06IENPTFVNTi5VOCxcbiAgICAgIGJhdHRsZXN1bTU6IENPTFVNTi5VMTYsXG4gICAgICBhY2lkc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBwcm9waGV0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBob3Jyb3I6IENPTFVNTi5VOCxcbiAgICAgIGxhdGVoZXJvOiBDT0xVTU4uVTgsXG4gICAgICB1d2RhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgbGFuZGRhbWFnZTogQ09MVU1OLlU4LFxuICAgICAgcnBjb3N0OiBDT0xVTU4uVTMyLFxuICAgICAgcmFuZDU6IENPTFVNTi5VOCxcbiAgICAgIG5icjU6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s1OiBDT0xVTU4uVTE2LFxuICAgICAgcmFuZDY6IENPTFVNTi5VOCxcbiAgICAgIG5icjY6IENPTFVNTi5VOCxcbiAgICAgIG1hc2s2OiBDT0xVTU4uVTE2LFxuICAgICAgbXVtbWlmaWNhdGlvbjogQ09MVU1OLlUxNixcbiAgICAgIGRpc2Vhc2VyZXM6IENPTFVNTi5VOCxcbiAgICAgIHJhaXNlb25raWxsOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZXNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2VuZGxlc3NlcmhvcnJvcm11bHQ6IENPTFVNTi5VOCxcbiAgICAgIGluY29ycG9yYXRlOiBDT0xVTU4uVTgsXG4gICAgICBibGVzc2JlcnM6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlYXR0YWNrZXI6IENPTFVNTi5VOCxcbiAgICAgIHV3aGVhdDogQ09MVU1OLlU4LFxuICAgICAgc2xvdGhyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9yZGVzZXJ0ZXI6IENPTFVNTi5VOCxcbiAgICAgIHNvcmNlcnlyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgb2xkZXI6IENPTFVNTi5JOCxcbiAgICAgIGRpc2JlbGlldmU6IENPTFVNTi5VOCxcbiAgICAgIGZpcmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYXN0cmFscmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZXJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBiZWFydGF0dG9vOiBDT0xVTU4uVTgsXG4gICAgICBob3JzZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgcmVpbmNhcm5hdGlvbjogQ09MVU1OLlU4LFxuICAgICAgd29sZnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYm9hcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgc2xlZXBhdXJhOiBDT0xVTU4uVTgsXG4gICAgICBzbmFrZXRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgYXBwZXRpdGU6IENPTFVNTi5JOCxcbiAgICAgIHRlbXBsZXRyYWluZXI6IENPTFVNTi5VOCxcbiAgICAgIGluZmVybm9yZXQ6IENPTFVNTi5VOCxcbiAgICAgIGtva3l0b3NyZXQ6IENPTFVNTi5VOCxcbiAgICAgIGFkZHJhbmRvbWFnZTogQ09MVU1OLlUxNixcbiAgICAgIHVuc3VycjogQ09MVU1OLlU4LFxuICAgICAgc3BlY2lhbGxvb2s6IENPTFVNTi5VOCxcbiAgICAgIGJ1Z3JlZm9ybTogQ09MVU1OLlU4LFxuICAgICAgb25pc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBzdW5hd2U6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWZmOiBDT0xVTU4uVTgsXG4gICAgICBpdnlsb3JkOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2Q6IENPTFVNTi5VOCxcbiAgICAgIHRyaXBsZWdvZG1hZzogQ09MVU1OLlU4LFxuICAgICAgZm9ydGtpbGw6IENPTFVNTi5VOCxcbiAgICAgIHRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBtb3ZlOiBDT0xVTU4uVTgsXG4gICAgICBlbnRhbmdsZTogQ09MVU1OLlU4LFxuICAgICAgYWxjaGVteTogQ09MVU1OLlU4LFxuICAgICAgd291bmRmZW5kOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWFybXk6IENPTFVNTi5JOCxcbiAgICAgIHN1bW1vbjU6IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcjogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRocGFyYWx5emU6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZWNvbnN0cnVjdDogQ09MVU1OLlU4LFxuICAgICAgZ3VhcmRpYW5zcGlyaXRtb2RpZmllcjogQ09MVU1OLkk4LFxuICAgICAgaWNlZm9yZ2luZzogQ09MVU1OLlU4LFxuICAgICAgY2xvY2t3b3JrbG9yZDogQ09MVU1OLlU4LFxuICAgICAgbWluc2l6ZWxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgaXJvbnZ1bDogQ09MVU1OLlU4LFxuICAgICAgaGVhdGhlbnN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgcG93ZXJvZmRlYXRoOiBDT0xVTU4uVTgsXG4gICAgICByZWZvcm10aW1lOiBDT0xVTU4uSTgsXG4gICAgICB0d2ljZWJvcm46IENPTFVNTi5VMTYsXG4gICAgICB0bXBhc3RyYWxnZW1zOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGhlcm9hYjogQ09MVU1OLlU4LFxuICAgICAgdXdmaXJlc2hpZWxkOiBDT0xVTU4uVTgsXG4gICAgICBzYWx0dnVsOiBDT0xVTU4uVTgsXG4gICAgICBsYW5kZW5jOiBDT0xVTU4uVTgsXG4gICAgICBwbGFndWVkb2N0b3I6IENPTFVNTi5VOCxcbiAgICAgIGN1cnNlbHVja3NoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgZmFydGhyb25la2lsbDogQ09MVU1OLlU4LFxuICAgICAgaG9ycm9ybWFyazogQ09MVU1OLlU4LFxuICAgICAgYWxscmV0OiBDT0xVTU4uVTgsXG4gICAgICBhY2lkZGlnZXN0OiBDT0xVTU4uVTgsXG4gICAgICBiZWNrb246IENPTFVNTi5VOCxcbiAgICAgIHNsYXZlcmJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBjYXJjYXNzY29sbGVjdG9yOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kY29sbGFyOiBDT0xVTU4uVTgsXG4gICAgICBtb3VudGFpbnJlYzogQ09MVU1OLlU4LFxuICAgICAgaW5kZXBzcGVsbHM6IENPTFVNTi5VOCxcbiAgICAgIGVuY2hyZWJhdGU1MDogQ09MVU1OLlU4LFxuICAgICAgc3VtbW9uMTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmRvbXNwZWxsOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmlmeTogQ09MVU1OLlU4LFxuICAgICAgLy9qdXN0IGEgY29weSBvZiByZWFuaW1hdG9yLi4uXG4gICAgICAvLydyZWFuaW1hdG9yfjEnOiBDT0xVTU4uVTgsXG4gICAgICBkZWZlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgYmF0c3RhcnRzdW0xZDM6IENPTFVNTi5VMTYsXG4gICAgICBlbmNocmViYXRlMTA6IENPTFVNTi5VOCxcbiAgICAgIHVuZHlpbmc6IENPTFVNTi5VOCxcbiAgICAgIG1vcmFsZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICB1bmN1cmFibGVhZmZsaWN0aW9uOiBDT0xVTU4uVTMyLFxuICAgICAgd2ludGVyc3VtbW9uMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgc3R5Z2lhbmd1aWRlOiBDT0xVTU4uVTgsXG4gICAgICBzbWFydG1vdW50OiBDT0xVTU4uVTgsXG4gICAgICByZWZvcm1pbmdmbGVzaDogQ09MVU1OLlU4LFxuICAgICAgZmVhcm9mdGhlZmxvb2Q6IENPTFVNTi5VOCxcbiAgICAgIGNvcnBzZXN0aXRjaGVyOiBDT0xVTU4uVTgsXG4gICAgICByZWNvbnN0cnVjdGlvbjogQ09MVU1OLlU4LFxuICAgICAgbm9mcmlkZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjb3JpZGVybW5yOiBDT0xVTU4uVTE2LFxuICAgICAgaG9seWNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hdGVtbnI6IENPTFVNTi5VMTYsXG4gICAgICBsaWNoOiBDT0xVTU4uVTE2LFxuICAgICAgZXJhc3RhcnRhZ2VpbmNyZWFzZTogQ09MVU1OLlUxNixcbiAgICAgIG1vcmVvcmRlcjogQ09MVU1OLkk4LFxuICAgICAgbW9yZWdyb3d0aDogQ09MVU1OLkk4LFxuICAgICAgbW9yZXByb2Q6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVoZWF0OiBDT0xVTU4uSTgsXG4gICAgICBtb3JlbHVjazogQ09MVU1OLkk4LFxuICAgICAgbW9yZW1hZ2ljOiBDT0xVTU4uSTgsXG4gICAgICBub2Ztb3VudHM6IENPTFVNTi5VOCxcbiAgICAgIGZhbHNlZGFtYWdlcmVjb3Zlcnk6IENPTFVNTi5VOCxcbiAgICAgIHV3cGF0aGJvb3N0OiBDT0xVTU4uSTgsXG4gICAgICByYW5kb21pdGVtczogQ09MVU1OLlUxNixcbiAgICAgIGRlYXRoc2xpbWVleHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHBvaXNvbmV4cGw6IENPTFVNTi5VOCxcbiAgICAgIGRlYXRoc2hvY2tleHBsOiBDT0xVTU4uVTgsXG4gICAgICBkcmF3c2l6ZTogQ09MVU1OLkk4LFxuICAgICAgcGV0cmlmaWNhdGlvbmltbXVuZTogQ09MVU1OLlU4LFxuICAgICAgc2NhcnNvdWxzOiBDT0xVTU4uVTgsXG4gICAgICBzcGlrZWJhcmJzOiBDT0xVTU4uVTgsXG4gICAgICBwcmV0ZW5kZXJzdGFydHNpdGU6IENPTFVNTi5VMTYsXG4gICAgICBvZmZzY3JpcHRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgdW5tb3VudGVkc3ByOiBDT0xVTU4uVTMyLFxuICAgICAgZXhoYXVzdGlvbjogQ09MVU1OLlU4LFxuICAgICAgLy8gbW91bnRlZDogQ09MVU1OLkJPT0wsIC8vIGRlcHJlY2F0ZWRcbiAgICAgIGJvdzogQ09MVU1OLkJPT0wsXG4gICAgICBib2R5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZvb3Q6IENPTFVNTi5CT09MLFxuICAgICAgY3Jvd25vbmx5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGhvbHk6IENPTFVNTi5CT09MLFxuICAgICAgaW5xdWlzaXRvcjogQ09MVU1OLkJPT0wsXG4gICAgICBpbmFuaW1hdGU6IENPTFVNTi5CT09MLFxuICAgICAgdW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3RvbmViZWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBhbmltYWw6IENPTFVNTi5CT09MLFxuICAgICAgY29sZGJsb29kOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZlbWFsZTogQ09MVU1OLkJPT0wsXG4gICAgICBmb3Jlc3RzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGFpbnN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhc3Rlc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgc3dhbXBzdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICBhcXVhdGljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBwb29yYW1waGliaWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZsb2F0OiBDT0xVTU4uQk9PTCxcbiAgICAgIGZseWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdG9ybWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB0ZWxlcG9ydDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vYmlsZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JpdmVycGFzczogQ09MVU1OLkJPT0wsXG4gICAgICBpbGx1c2lvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHk6IENPTFVNTi5CT09MLFxuICAgICAgYXNzYXNzaW46IENPTFVNTi5CT09MLFxuICAgICAgaGVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBpbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkb21pbW1vcnRhbDogQ09MVU1OLkJPT0wsXG4gICAgICBub2hlYWw6IENPTFVNTi5CT09MLFxuICAgICAgbmVlZG5vdGVhdDogQ09MVU1OLkJPT0wsXG4gICAgICB1bmRpc2NpcGxpbmVkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXZlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNsYXNocmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJsdW50cmVzOiBDT0xVTU4uQk9PTCxcbiAgICAgIHBpZXJjZXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibGluZDogQ09MVU1OLkJPT0wsXG4gICAgICBwZXRyaWZ5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGV0aGVyZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlYXRoY3Vyc2U6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmFtcHN3YWxsb3c6IENPTFVNTi5CT09MLFxuICAgICAgdGF4Y29sbGVjdG9yOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWluaW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuaXF1ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzY2FsZXdhbGxzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWluczogQ09MVU1OLkJPT0wsXG4gICAgICBoZWF0cmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRyZWM6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkY2hhb3M6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZGVhdGg6IENPTFVNTi5CT09MLFxuICAgICAgYnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHV3YnVnOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZG9yZGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGdyb3d0aDogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRkb206IENPTFVNTi5CT09MLFxuICAgICAgZHJha2U6IENPTFVNTi5CT09MLFxuICAgICAgdGhlZnRvZnRoZXN1bmF3ZTogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFnb25sb3JkOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbmR2ZXNzZWw6IENPTFVNTi5CT09MLFxuICAgICAgZWxlbWVudHJhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzdHJhbGZldHRlcnM6IENPTFVNTi5CT09MLFxuICAgICAgY29tYmF0Y2FzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpc2luZ2xlcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vd2lzaDogQ09MVU1OLkJPT0wsXG4gICAgICBtYXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBzcGlyaXRzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBvd25ibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBpbnZpc2libGU6IENPTFVNTi5CT09MLFxuICAgICAgc3BlbGxzaW5nZXI6IENPTFVNTi5CT09MLFxuICAgICAgbWFnaWNzdHVkeTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICB0cmlwbGUzbW9uOiBDT0xVTU4uQk9PTCxcbiAgICAgIHllYXJ0dXJuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVudGVsZXBvcnRhYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlYW5pbXByaWVzdDogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVuaW1tdW5pdHk6IENPTFVNTi5CT09MLFxuICAgICAgc2luZ2xlYmF0dGxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlc2VhcmNod2l0aG91dG1hZ2ljOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9jb21wZXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFkdmVudHVyZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsZWFuc2hhcGU6IENPTFVNTi5CT09MLFxuICAgICAgcmVxbGFiOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcXRlbXBsZTogQ09MVU1OLkJPT0wsXG4gICAgICBob3Jyb3JtYXJrZWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhc2hhaDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2F5YXphZDogQ09MVU1OLkJPT0wsXG4gICAgICBpc2FkYWV2YTogQ09MVU1OLkJPT0wsXG4gICAgICBibGVzc2ZseTogQ09MVU1OLkJPT0wsXG4gICAgICBwbGFudDogQ09MVU1OLkJPT0wsXG4gICAgICBjb21zbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbm93bW92ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzd2ltbWluZzogQ09MVU1OLkJPT0wsXG4gICAgICBzdHVwaWQ6IENPTFVNTi5CT09MLFxuICAgICAgc2tpcm1pc2hlcjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnNlZW46IENPTFVNTi5CT09MLFxuICAgICAgbm9tb3ZlcGVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdvbGY6IENPTFVNTi5CT09MLFxuICAgICAgZHVuZ2VvbjogQ09MVU1OLkJPT0wsXG4gICAgICBhYm9sZXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGxvY2Fsc3VuOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRtcGZpcmVnZW1zOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRlZmlsZXI6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRlZGJlc2VyazogQ09MVU1OLkJPT0wsXG4gICAgICBsYW5jZW9rOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1pbnByaXNvbjogQ09MVU1OLkJPT0wsXG4gICAgICBocG92ZXJmbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIGluZGVwc3RheTogQ09MVU1OLkJPT0wsXG4gICAgICBwb2x5aW1tdW5lOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vcmFuZ2U6IENPTFVNTi5CT09MLFxuICAgICAgbm9ob2Y6IENPTFVNTi5CT09MLFxuICAgICAgYXV0b2JsZXNzZWQ6IENPTFVNTi5CT09MLFxuICAgICAgYWxtb3N0dW5kZWFkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRydWVzaWdodDogQ09MVU1OLkJPT0wsXG4gICAgICBtb2JpbGVhcmNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0Zm9ybTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBjaG9ydXNtYXN0ZXI6IENPTFVNTi5CT09MLFxuICAgICAgdGlnaHRyZWluOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXJtYW46IENPTFVNTi5CT09MLFxuICAgICAgZGl2aW5lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbm9mYWxsZG1nOiBDT0xVTU4uQk9PTCxcbiAgICAgIGZpcmVlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFpcmVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgd2F0ZXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVhcnRoZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBwb3BzcHk6IENPTFVNTi5CT09MLFxuICAgICAgY2FwaXRhbGhvbWU6IENPTFVNTi5CT09MLFxuICAgICAgY2x1bXN5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlZ2Fpbm1vdW50OiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vYmFyZGluZzogQ09MVU1OLkJPT0wsXG4gICAgICBtb3VudGlzY29tOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vdGhyb3dvZmY6IENPTFVNTi5CT09MLFxuICAgICAgYmlyZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWNheXJlczogQ09MVU1OLkJPT0wsXG4gICAgICBjdWJtb3RoZXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2xhbW91cjogQ09MVU1OLkJPT0wsXG4gICAgICBnZW1wcm9kOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgZml4ZWRuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgIH0sXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIHR5cGU6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IHNkSW5kZXggPSBhcmdzLnJhd0ZpZWxkc1snc3RhcnRkb20nXTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAndHlwZScsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgICAgICB3aWR0aDogMixcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7XG4gICAgICAgICAgICAvLyBoYXZlIHRvIGZpbGwgaW4gbW9yZSBzdHVmZiBsYXRlciwgd2hlbiB3ZSBqb2luIHJlYyB0eXBlcywgb2ggd2VsbFxuICAgICAgICAgICAgLy8gb3RoZXIgdHlwZXM6IGNvbW1hbmRlciwgbWVyY2VuYXJ5LCBoZXJvLCBldGNcbiAgICAgICAgICAgIGlmICh1W3NkSW5kZXhdKSByZXR1cm4gMzsgLy8gZ29kICsgY29tbWFuZGVyXG4gICAgICAgICAgICBlbHNlIHJldHVybiAwOyAvLyBqdXN0IGEgdW5pdFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgYXJtb3I6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXmFybW9yXFxkJC8pKVxuICAgICAgICAgIC5tYXAoKGUpID0+IGVbMV0pO1xuXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAnYXJtb3InLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTZfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3QgYXJtb3JzOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGluZGljZXMpIHtcblxuICAgICAgICAgICAgICBpZiAodVtpXSkgYXJtb3JzLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcm1vcnM7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgd2VhcG9uczogKGluZGV4OiBudW1iZXIsIGFyZ3M6IFNjaGVtYUFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgaW5kaWNlcyA9IE9iamVjdC5lbnRyaWVzKGFyZ3MucmF3RmllbGRzKVxuICAgICAgICAgIC5maWx0ZXIoZSA9PiBlWzBdLm1hdGNoKC9ed3BuXFxkJC8pKVxuICAgICAgICAgIC5tYXAoKGUpID0+IGVbMV0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3dlYXBvbnMnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTZfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3Qgd3BuczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIHdwbnMucHVzaChOdW1iZXIodVtpXSkpO1xuICAgICAgICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdwbnM7XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJyZjdXN0b21tYWdpYyc6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG5cbiAgICAgICAgY29uc3QgQ01fS0VZUyA9IFsxLDIsMyw0LDUsNl0ubWFwKG4gPT5cbiAgICAgICAgICBgcmFuZCBuYnIgbWFza2Auc3BsaXQoJyAnKS5tYXAoayA9PiBhcmdzLnJhd0ZpZWxkc1tgJHtrfSR7bn1gXSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coeyBDTV9LRVlTIH0pXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJyZjdXN0b21tYWdpYycsIC8vIFBBQ0tFRCBVUFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMzJfQVJSQVksXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgY29uc3QgY206IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IEsgb2YgQ01fS0VZUykge1xuICAgICAgICAgICAgICBjb25zdCBbcmFuZCwgbmJyLCBtYXNrXSA9IEsubWFwKGkgPT4gdVtpXSk7XG4gICAgICAgICAgICAgIGlmICghcmFuZCkgYnJlYWs7XG4gICAgICAgICAgICAgIGlmIChuYnIgPiA2MykgdGhyb3cgbmV3IEVycm9yKCdmZnMuLi4nKTtcbiAgICAgICAgICAgICAgY29uc3QgYiA9IG1hc2sgPj4gNztcbiAgICAgICAgICAgICAgY29uc3QgbiA9IG5iciA8PCAxMDtcbiAgICAgICAgICAgICAgY29uc3QgciA9IHJhbmQgPDwgMTY7XG4gICAgICAgICAgICAgIGNtLnB1c2gociB8IG4gfCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbTtcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gICAgb3ZlcnJpZGVzOiB7XG4gICAgICAvLyBjc3YgaGFzIHVucmVzdC90dXJuIHdoaWNoIGlzIGluY3VucmVzdCAvIDEwOyBjb252ZXJ0IHRvIGludCBmb3JtYXRcbiAgICAgIGluY3VucmVzdDogKHYpID0+IHtcbiAgICAgICAgcmV0dXJuIChOdW1iZXIodikgKiAxMCkgfHwgMFxuICAgICAgfVxuICAgIH0sXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlSS5jc3YnOiB7XG4gICAgbmFtZTogJ0l0ZW0nLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnaXRlbWNvc3QxfjEnLCAnd2FybmluZ34xJ10pLFxuICB9LFxuXG4gICcuLi8uLi9nYW1lZGF0YS9NYWdpY1NpdGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNTaXRlJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZG9tY29uZmxpY3R+MScsJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL01lcmNlbmFyeS5jc3YnOiB7XG4gICAgbmFtZTogJ01lcmNlbmFyeScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FmZmxpY3Rpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnQWZmbGljdGlvbicsXG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYW5vbl9wcm92aW5jZV9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdBbm9uUHJvdmluY2VFdmVudCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXJtb3JzLmNzdic6IHtcbiAgICBuYW1lOiAnQXJtb3InLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVfa2V5cy5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUtleScsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5QXJtb3InLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfc3BlbGwuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVNwZWxsJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3dlYXBvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5V2VhcG9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18xX3R5cGVzLmNzdic6IHtcbiAgICAvLyBUT0RPIC0gZ290IHNvbWUgYmlnIGJvaXMgaW4gaGVyZS5cbiAgICBuYW1lOiAnQnVmZkJpdDEnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18yX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnQnVmZkJpdDInLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCBtdWx0aS1pbmRleFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX2luZm8uY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ1NwZWxsRWZmZWN0SW5mbycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgLypcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdic6IHtcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIG5hbWU6ICdFZmZlY3RTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAqL1xuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c193ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0V2VhcG9uJyxcbiAgICBrZXk6ICdyZWNvcmRfaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VuY2hhbnRtZW50cy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnRW5jaGFudG1lbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ldmVudHMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFnaWNfcGF0aHMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnVGVycmFpblR5cGVCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tb25zdGVyX3RhZ3MuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hbWV0eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdOYW1lVHlwZScsXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYXRpb25zLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICAgIGV4dHJhRmllbGRzOiB7XG4gICAgICByZWFsbTogKGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBuYW1lOiAncmVhbG0nLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgICAvLyB3ZSB3aWxsIGFzc2lnbiB0aGVzZSBsYXRlclxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHsgcmV0dXJuIDA7IH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9vdGhlcl9wbGFuZXMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ090aGVyUGxhbmUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdQcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3Byb3RlY3Rpb25zX2J5X2FybW9yLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdQcm90ZWN0aW9uQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcmVhbG1zLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdSZWFsbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NpdGVfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBuYW1lOiAnU2l0ZVRlcnJhaW5UeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF9kYW1hZ2VfdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgbmFtZTogJ1NwZWNpYWxEYW1hZ2VUeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF91bmlxdWVfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxVbmlxdWVTdW1tb24nLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICAgIHByZVRyYW5zZm9ybSAocmF3RmllbGRzOiBzdHJpbmdbXSwgcmF3RGF0YTogc3RyaW5nW11bXSkge1xuICAgICAgLy8gY29sdW1ucyB0byBjb3B5IG92ZXIgZnJvbSBlZmZlY3RzX3NwZWxscyB0byBzcGVsbHMuLi5cbiAgICAgIGNvbnN0IElEWCA9IHJhd0ZpZWxkcy5pbmRleE9mKCdlZmZlY3RfcmVjb3JkX2lkJyk7XG4gICAgICBjb25zdCBUWEYgPSBbMSwyLDMsNSw2LDcsOCw5LDEwLDExLDEyXVxuICAgICAgaWYgKElEWCA9PT0gLTEpIHRocm93IG5ldyBFcnJvcignbm8gZWZmZWN0X3JlY29yZF9pZD8nKVxuXG4gICAgICBmdW5jdGlvbiByZXBsYWNlUmVmIChkZXN0OiBzdHJpbmdbXSwgc3JjOiBzdHJpbmdbXSkge1xuICAgICAgICBkZXN0LnNwbGljZShJRFgsIDEsIC4uLlRYRi5tYXAoaSA9PiBzcmNbaV0pKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgW2VmZmVjdEZpZWxkcywgLi4uZWZmZWN0RGF0YV0gPSByZWFkRmlsZVN5bmMoXG4gICAgICAgICAgYC4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdmAsXG4gICAgICAgICAgeyBlbmNvZGluZzogJ3V0ZjgnIH1cbiAgICAgICAgKS5zcGxpdCgnXFxuJylcbiAgICAgICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgICAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdCgnXFx0JykpO1xuXG4gICAgICByZXBsYWNlUmVmKHJhd0ZpZWxkcywgZWZmZWN0RmllbGRzKTtcblxuICAgICAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkgY29uc29sZS5sb2coaSwgZilcblxuICAgICAgZm9yIChjb25zdCBkZXN0IG9mIHJhd0RhdGEpIHtcbiAgICAgICAgY29uc3QgZXJpZCA9IE51bWJlcihkZXN0W0lEWF0pO1xuICAgICAgICBjb25zdCBzcmMgPSBlZmZlY3REYXRhW2VyaWRdO1xuICAgICAgICBpZiAoIXNyYykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05PUEUnLCBkZXN0LCBlcmlkKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHRoYW5rcycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcGxhY2VSZWYoZGVzdCwgc3JjKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG4gIHByZVRyYW5zZm9ybT86ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIG5hbWU6ICcnLFxuICBrZXk6ICcnLFxuICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoKSxcbiAgb3ZlcnJpZGVzOiB7fSxcbiAga25vd25GaWVsZHM6IHt9LFxuICBleHRyYUZpZWxkczoge30sXG4gIHNlcGFyYXRvcjogJ1xcdCcsIC8vIHN1cnByaXNlIVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3N2VG9UYWJsZShcbiAgcmF3OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5cbik6IFRhYmxlIHtcbiAgY29uc3QgX29wdHMgPSB7IC4uLkRFRkFVTFRfT1BUSU9OUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6IF9vcHRzLm5hbWUsXG4gICAga2V5OiBfb3B0cy5rZXksXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBvdmVycmlkZXM6IF9vcHRzLm92ZXJyaWRlcyxcbiAgfTtcbiAgaWYgKCFzY2hlbWFBcmdzLm5hbWUpIHRocm93IG5ldyBFcnJvcignbmFtZSBpcyByZXF1cmllZCcpO1xuICBpZiAoIXNjaGVtYUFyZ3Mua2V5KSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyByZXF1cmllZCcpO1xuXG4gIGlmIChyYXcuaW5kZXhPZignXFwwJykgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ3VoIG9oJylcblxuICBjb25zdCBbcmF3RmllbGRzLCAuLi5yYXdEYXRhXSA9IHJhd1xuICAgIC5zcGxpdCgnXFxuJylcbiAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgLm1hcChsaW5lID0+IGxpbmUuc3BsaXQoX29wdHMuc2VwYXJhdG9yKSk7XG5cbiAgaWYgKG9wdGlvbnM/LnByZVRyYW5zZm9ybSkge1xuICAgIG9wdGlvbnMucHJlVHJhbnNmb3JtKHJhd0ZpZWxkcywgcmF3RGF0YSk7XG4gIH1cblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn1+JHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF3Q29sdW1uczogQ29sdW1uQXJnc1tdID0gW107XG4gIGZvciAoY29uc3QgW2luZGV4LCBuYW1lXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgbGV0IGM6IG51bGwgfCBDb2x1bW5BcmdzID0gbnVsbDtcbiAgICBzY2hlbWFBcmdzLnJhd0ZpZWxkc1tuYW1lXSA9IGluZGV4O1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgaWYgKF9vcHRzLmtub3duRmllbGRzW25hbWVdKSB7XG4gICAgICBjID0gYXJnc0Zyb21UeXBlKFxuICAgICAgICBuYW1lLFxuICAgICAgICBfb3B0cy5rbm93bkZpZWxkc1tuYW1lXSxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGMgPSBhcmdzRnJvbVRleHQoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgICAgIHJhd0RhdGEsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hQXJncy5uYW1lfTogXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfVxceDFiWzBtYCxcbiAgICAgICAgICAgIGV4XG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGV4XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgIHJhd0NvbHVtbnMucHVzaChjKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucz8uZXh0cmFGaWVsZHMpIHtcbiAgICBjb25zdCBiaSA9IE9iamVjdC52YWx1ZXMoc2NoZW1hQXJncy5yYXdGaWVsZHMpLmxlbmd0aDsgLy8gaG1tbW1cbiAgICByYXdDb2x1bW5zLnB1c2goLi4uT2JqZWN0LmVudHJpZXMob3B0aW9ucy5leHRyYUZpZWxkcykubWFwKFxuICAgICAgKFtuYW1lLCBjcmVhdGVDb2x1bW5dOiBbc3RyaW5nLCBDcmVhdGVFeHRyYUZpZWxkXSwgZWk6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGVpLCBzY2hlbWFBcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGVpO1xuICAgICAgICBjb25zdCBjYSA9IGNyZWF0ZUNvbHVtbihpbmRleCwgc2NoZW1hQXJncywgbmFtZSwgb3ZlcnJpZGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChjYS5pbmRleCAhPT0gaW5kZXgpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBpbmRleCcpO1xuICAgICAgICAgIGlmIChjYS5uYW1lICE9PSBuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3dpc2VndXkgcGlja2VkIGhpcyBvd24gbmFtZScpO1xuICAgICAgICAgIGlmIChjYS50eXBlID09PSBDT0xVTU4uQk9PTCkge1xuICAgICAgICAgICAgaWYgKGNhLmJpdCAhPT0gc2NoZW1hQXJncy5mbGFnc1VzZWQpIHRocm93IG5ldyBFcnJvcigncGlzcyBiYWJ5IGlkaW90Jyk7XG4gICAgICAgICAgICBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjYSwgeyBpbmRleCwgb3ZlcnJpZGUsIG5hbWUsIH0pXG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZGF0YTogUm93W10gPSBuZXcgQXJyYXkocmF3RGF0YS5sZW5ndGgpXG4gICAgLmZpbGwobnVsbClcbiAgICAubWFwKChfLCBfX3Jvd0lkKSA9PiAoeyBfX3Jvd0lkIH0pKVxuICAgIDtcblxuICBmb3IgKGNvbnN0IGNvbEFyZ3Mgb2YgcmF3Q29sdW1ucykge1xuICAgIGNvbnN0IGNvbCA9IGZyb21BcmdzKGNvbEFyZ3MpO1xuICAgIHNjaGVtYUFyZ3MuY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgc2NoZW1hQXJncy5maWVsZHMucHVzaChjb2wubmFtZSk7XG4gIH1cblxuICBpZiAoc2NoZW1hQXJncy5rZXkgIT09ICdfX3Jvd0lkJyAmJiAhc2NoZW1hQXJncy5maWVsZHMuaW5jbHVkZXMoc2NoZW1hQXJncy5rZXkpKVxuICAgIHRocm93IG5ldyBFcnJvcihgZmllbGRzIGlzIG1pc3NpbmcgdGhlIHN1cHBsaWVkIGtleSBcIiR7c2NoZW1hQXJncy5rZXl9XCJgKTtcblxuICBmb3IgKGNvbnN0IGNvbCBvZiBzY2hlbWFBcmdzLmNvbHVtbnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgZGF0YSlcbiAgICAgIGRhdGFbci5fX3Jvd0lkXVtjb2wubmFtZV0gPSBjb2wuZnJvbVRleHQoXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXVtjb2wuaW5kZXhdLFxuICAgICAgICByYXdEYXRhW3IuX19yb3dJZF0sXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IFBhcnNlU2NoZW1hT3B0aW9ucywgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbkR1bXBlZCB9IGZyb20gJy4vam9pbi10YWJsZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuZnVuY3Rpb24gZmluZERlZiAobmFtZTogc3RyaW5nKTogW3N0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XSB7XG4gIGlmIChjc3ZEZWZzW25hbWVdKSByZXR1cm4gW25hbWUsIGNzdkRlZnNbbmFtZV1dO1xuICBmb3IgKGNvbnN0IGsgaW4gY3N2RGVmcykge1xuICAgIGNvbnN0IGQgPSBjc3ZEZWZzW2tdO1xuICAgIGlmIChkLm5hbWUgPT09IG5hbWUpIHJldHVybiBbaywgZF07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBjc3YgZGVmaW5lZCBmb3IgXCIke25hbWV9XCJgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcE9uZShrZXk6IHN0cmluZykge1xuICBjb25zdCB0YWJsZSA9IGF3YWl0IHJlYWRDU1YoLi4uZmluZERlZihrZXkpKTtcbiAgY29tcGFyZUR1bXBzKHRhYmxlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcEFsbCAoKSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICAvLyBKT0lOU1xuICBqb2luRHVtcGVkKHRhYmxlcyk7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLjMwLmJpbidcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXBhcmVEdW1wcyh0OiBUYWJsZSkge1xuICBjb25zdCBtYXhOID0gdC5yb3dzLmxlbmd0aCAtIDMwXG4gIGxldCBuOiBudW1iZXI7XG4gIGxldCBwOiBhbnkgPSB1bmRlZmluZWQ7XG4gIGlmIChmaWVsZHNbMF0gPT09ICdGSUxURVInKSB7XG4gICAgbiA9IDA7IC8vIHdpbGwgYmUgaW5nb3JlZFxuICAgIGZpZWxkcy5zcGxpY2UoMCwgMSwgJ2lkJywgJ25hbWUnKTtcbiAgICBwID0gKHI6IGFueSkgPT4gZmllbGRzLnNsaWNlKDIpLnNvbWUoZiA9PiByW2ZdKTtcbiAgfSBlbHNlIGlmIChmaWVsZHNbMV0gPT09ICdST1cnICYmIGZpZWxkc1syXSkge1xuICAgIG4gPSBOdW1iZXIoZmllbGRzWzJdKSAtIDE1O1xuICAgIGZpZWxkcy5zcGxpY2UoMSwgMilcbiAgICBjb25zb2xlLmxvZyhgZW5zdXJlIHJvdyAke2ZpZWxkc1syXX0gaXMgdmlzaWJsZSAoJHtufSlgKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB0aHJvdyBuZXcgRXJyb3IoJ1JPVyBtdXN0IGJlIE5VTUJFUiEhISEnKTtcbiAgfSBlbHNlIHtcbiAgICBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4TilcbiAgfVxuICBuID0gTWF0aC5taW4obWF4TiwgTWF0aC5tYXgoMCwgbikpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gKGZpZWxkcy5sZW5ndGggPyAoZmllbGRzWzBdID09PSAnQUxMJyA/IHQuc2NoZW1hLmZpZWxkcyA6IGZpZWxkcykgOlxuICAgdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDEwKSkgYXMgc3RyaW5nW11cbiAgZHVtcFRvQ29uc29sZSh0LCBuLCBtLCBmLCAnQkVGT1JFJywgcCk7XG4gIC8qXG4gIGlmICgxICsgMSA9PT0gMikgcmV0dXJuOyAvLyBUT0RPIC0gd2Ugbm90IHdvcnJpZWQgYWJvdXQgdGhlIG90aGVyIHNpZGUgeWV0XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXMoW3RdKTtcbiAgY29uc29sZS5sb2coYG1hZGUgJHtibG9iLnNpemV9IGJ5dGUgYmxvYmApO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgLy8oZ2xvYmFsVGhpcy5fUk9XUyA/Pz0ge30pW3Quc2NoZW1hLm5hbWVdID0gdC5yb3dzO1xuICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBkdW1wVG9Db25zb2xlKHVbdC5zY2hlbWEubmFtZV0sIG4sIG0sIGYsICdBRlRFUicsIHApO1xuICAvL2F3YWl0IHdyaXRlRmlsZSgnLi90bXAuYmluJywgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgKi9cbn1cblxuZnVuY3Rpb24gZHVtcFRvQ29uc29sZShcbiAgdDogVGFibGUsXG4gIG46IG51bWJlcixcbiAgbTogbnVtYmVyLFxuICBmOiBzdHJpbmdbXSxcbiAgaDogc3RyaW5nLFxuICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbikge1xuICBjb25zb2xlLmxvZyhgXFxuICAgICAke2h9OmApO1xuICB0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICBjb25zdCByb3dzID0gdC5wcmludCh3aWR0aCwgZiwgbiwgbSwgcCk7XG4gIGlmIChyb3dzKSBmb3IgKGNvbnN0IHIgb2Ygcm93cykgY29uc29sZS50YWJsZShbcl0pO1xuICBjb25zb2xlLmxvZyhgICAgIC8ke2h9XFxuXFxuYClcbn1cblxuXG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIGR1bXBPbmUoZmlsZSk7XG5lbHNlIGR1bXBBbGwoKTtcblxuXG4iLCAiaW1wb3J0IHtcbiAgQm9vbENvbHVtbixcbiAgQ09MVU1OLFxuICBOdW1lcmljQ29sdW1uLFxuICBTY2hlbWEsXG4gIFRhYmxlXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG50eXBlIFRSID0gUmVjb3JkPHN0cmluZywgVGFibGU+O1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5EdW1wZWQgKHRhYmxlTGlzdDogVGFibGVbXSkge1xuICBjb25zdCB0YWJsZXM6IFRSID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlTGlzdC5tYXAodCA9PiBbdC5uYW1lLCB0XSkpO1xuICB0YWJsZUxpc3QucHVzaChcbiAgICBtYWtlTmF0aW9uU2l0ZXModGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5U2l0ZSh0YWJsZXMpLFxuICAgIG1ha2VTcGVsbEJ5TmF0aW9uKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlVbml0KHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeU5hdGlvbih0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlVbml0U3VtbW9uKHRhYmxlcyksXG4gICk7XG5cbiAgLy9kdW1wUmVhbG1zKHRhYmxlcyk7XG5cbiAgLy8gdGFibGVzIGhhdmUgYmVlbiBjb21iaW5lZH4hXG4gIGZvciAoY29uc3QgdCBvZiBbXG4gICAgdGFibGVzLkNvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Db2FzdFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLk5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLk5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuUHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5VbnByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuUmVhbG0sXG4gIF0pIHtcbiAgICBUYWJsZS5yZW1vdmVUYWJsZSh0LCB0YWJsZUxpc3QpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGR1bXBSZWFsbXMgKHsgUmVhbG0sIFVuaXQgfTogVFIpIHtcbiAgLy8gc2VlbXMgbGlrZSB0aGUgcmVhbG0gY3N2IGlzIHJlZHVuZGFudD9cbiAgY29uc29sZS5sb2coJ1JFQUxNIFNUQVRTOicpXG4gIGNvbnN0IGNvbWJpbmVkID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcblxuICBmb3IgKGNvbnN0IHUgb2YgVW5pdC5yb3dzKSBpZiAodS5yZWFsbTEpIGNvbWJpbmVkLnNldCh1LmlkLCB1LnJlYWxtMSk7XG5cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCByZWFsbSB9IG9mIFJlYWxtLnJvd3MpIHtcbiAgICBpZiAoIWNvbWJpbmVkLmhhcyhtb25zdGVyX251bWJlcikpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke21vbnN0ZXJfbnVtYmVyfSBSRUFMTSBJUyBERUZJTkVEIE9OTFkgSU4gUkVBTE1TIENTVmApO1xuICAgICAgY29tYmluZWQuc2V0KG1vbnN0ZXJfbnVtYmVyLCByZWFsbSk7XG4gICAgfSBlbHNlIGlmIChjb21iaW5lZC5nZXQobW9uc3Rlcl9udW1iZXIpICE9PSByZWFsbSkge1xuICAgICAgY29uc29sZS5sb2coYCR7bW9uc3Rlcl9udW1iZXJ9IFJFQUxNIENPTkZMSUNUISB1bml0LmNzdiA9ICR7Y29tYmluZWQuZ2V0KG1vbnN0ZXJfbnVtYmVyKX0sIHJlYWxtLmNzdj0ke3JlYWxtfWApO1xuICAgIH1cbiAgfVxufVxuXG5cbmNvbnN0IEFUVFJfRkFSU1VNQ09NID0gNzkwOyAvLyBsdWwgd2h5IGlzIHRoaXMgdGhlIG9ubHkgb25lPz9cbi8vIFRPRE8gLSByZWFuaW1hdGlvbnMgYXN3ZWxsPyB0d2ljZWJvcm4gdG9vPyBsZW11cmlhLWVzcXVlIGZyZWVzcGF3bj8gdm9pZGdhdGU/XG4vLyBtaWdodCBoYXZlIHRvIGFkZCBhbGwgdGhhdCBtYW51YWxseSwgd2hpY2ggc2hvdWxkIGJlIG9rYXkgc2luY2UgaXQncyBub3QgbGlrZVxuLy8gdGhleSdyZSBhY2Nlc3NpYmxlIHRvIG1vZHMgYW55d2F5P1xuLy8gc29vbiBUT0RPIC0gc3VtbW9ucywgZXZlbnQgbW9uc3RlcnMvaGVyb3Ncbi8qXG5ub3QgdXNlZCwganVzdCBrZWVwaW5nIGZvciBub3Rlc1xuZXhwb3J0IGNvbnN0IGVudW0gUkVDX1NSQyB7XG4gIFVOS05PV04gPSAwLCAvLyBpLmUuIG5vbmUgZm91bmQsIHByb2JhYmx5IGluZGllIHBkP1xuICBTVU1NT05fQUxMSUVTID0gMSwgLy8gdmlhICNtYWtlbW9uc3Rlck5cbiAgU1VNTU9OX0RPTSA9IDIsIC8vIHZpYSAjW3JhcmVdZG9tc3VtbW9uTlxuICBTVU1NT05fQVVUTyA9IDMsIC8vIHZpYSAjc3VtbW9uTiAvIFwidHVybW9pbHN1bW1vblwiIC8gd2ludGVyc3VtbW9uMWQzXG4gIFNVTU1PTl9CQVRUTEUgPSA0LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIFRFTVBMRV9UUkFJTkVSID0gNSwgLy8gdmlhICN0ZW1wbGV0cmFpbmVyLCB2YWx1ZSBpcyBoYXJkIGNvZGVkIHRvIDE4NTkuLi5cbiAgUklUVUFMID0gNixcbiAgRU5URVJfU0lURSA9IDcsXG4gIFJFQ19TSVRFID0gOCxcbiAgUkVDX0NBUCA9IDksXG4gIFJFQ19GT1JFSUdOID0gMTAsXG4gIFJFQ19GT1JUID0gMTEsXG4gIEVWRU5UID0gMTIsXG4gIEhFUk8gPSAxMyxcbiAgUFJFVEVOREVSID0gMTQsXG59XG4qL1xuXG4vLyBUT0RPIC0gZXhwb3J0IHRoZXNlIGZyb20gc29tZXdoZXJlIG1vcmUgc2Vuc2libGVcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19UWVBFIHtcbiAgRk9SVCA9IDAsIC8vIG5vcm1hbCBpIGd1ZXNzXG4gIFBSRVRFTkRFUiA9IDEsIC8vIHUgaGVhcmQgaXQgaGVyZVxuICBGT1JFSUdOID0gMixcbiAgV0FURVIgPSAzLFxuICBDT0FTVCA9IDQsXG4gIEZPUkVTVCA9IDUsXG4gIFNXQU1QID0gNixcbiAgV0FTVEUgPSA3LFxuICBNT1VOVEFJTiA9IDgsXG4gIENBVkUgPSA5LFxuICBQTEFJTlMgPSAxMCxcbiAgSEVSTyA9IDExLFxuICBNVUxUSUhFUk8gPSAxMixcbiAgUFJFVEVOREVSX0NIRUFQXzIwID0gMTMsXG4gIFBSRVRFTkRFUl9DSEVBUF80MCA9IDE0LFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBVTklUX1RZUEUge1xuICBOT05FID0gMCwgICAgICAvLyBqdXN0IGEgdW5pdC4uLlxuICBDT01NQU5ERVIgPSAxLFxuICBQUkVURU5ERVIgPSAyLFxuICBDQVBPTkxZID0gNCxcbiAgSEVSTyA9IDgsXG59XG5cblxuZXhwb3J0IGNvbnN0IFJlYWxtTmFtZXMgPSBbXG4gICdOb25lJyxcbiAgJ05vcnRoJyxcbiAgJ0NlbHRpYycsXG4gICdNZWRpdGVycmFuZWFuJyxcbiAgJ0ZhciBFYXN0JyxcbiAgJ01pZGRsZSBFYXN0JyxcbiAgJ01pZGRsZSBBbWVyaWNhJyxcbiAgJ0FmcmljYScsXG4gICdJbmRpYScsXG4gICdEZWVwcycsXG4gICdEZWZhdWx0J1xuXTtcbmZ1bmN0aW9uIG1ha2VOYXRpb25TaXRlcyh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCB7IEF0dHJpYnV0ZUJ5TmF0aW9uLCBOYXRpb24gfSA9IHRhYmxlcztcbiAgY29uc3QgZGVsUm93czogbnVtYmVyW10gPSBbXTtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1NpdGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAxLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBqb2luczogJ05hdGlvbltuYXRpb25JZF0rTWFnaWNTaXRlW3NpdGVJZF0nLFxuICAgIGZpZWxkczogW1xuICAgICAgJ25hdGlvbklkJyxcbiAgICAgICdzaXRlSWQnLFxuICAgICAgJ2Z1dHVyZScsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NpdGVJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgQm9vbENvbHVtbih7XG4gICAgICAgIG5hbWU6ICdmdXR1cmUnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLkJPT0wsXG4gICAgICAgIGJpdDogMCxcbiAgICAgICAgZmxhZzogMVxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW11cbiAgZm9yIChsZXQgW2ksIHJvd10gb2YgQXR0cmlidXRlQnlOYXRpb24ucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IG5hdGlvbl9udW1iZXI6IG5hdGlvbklkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZTogc2l0ZUlkIH0gPSByb3c7XG4gICAgbGV0IGZ1dHVyZTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICAvLyB3aGlsZSB3ZSdyZSBoZXJlLCBsZXRzIHB1dCByZWFsbSBpZCByaWdodCBvbiB0aGUgbmF0aW9uIChleHRyYUZpZWxkIGluIGRlZilcbiAgICAgIGNhc2UgMjg5OlxuICAgICAgICAvL2NvbnNvbGUubG9nKGBuYXRpb25hbCByZWFsbTogJHtuYXRpb25JZH0gLT4gJHtzaXRlSWR9YClcbiAgICAgICAgY29uc3QgbmF0aW9uID0gTmF0aW9uLm1hcC5nZXQobmF0aW9uSWQpO1xuICAgICAgICBpZiAoIW5hdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGludmFsaWQgbmF0aW9uIGlkICR7bmF0aW9uSWR9IChubyByb3cgaW4gTmF0aW9uKWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNvbmZ1c2luZyEgdG9ucyBvZiBuYXRpb25zIGhhdmUgbXVsdGlwbGUgcmVhbG1zPyBqdXN0IHVzZSB0aGUgbW9zdFxuICAgICAgICAgIC8vIHJlY2VudCBvbmUgSSBndWVzcz9cbiAgICAgICAgICAvL2lmIChuYXRpb24ucmVhbG0pIHtcbiAgICAgICAgICAgIC8vY29uc3QgcHJldiA9IFJlYWxtTmFtZXNbbmF0aW9uLnJlYWxtXTtcbiAgICAgICAgICAgIC8vY29uc3QgbmV4dCA9IFJlYWxtTmFtZXNbc2l0ZUlkXTtcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihgJHtuYXRpb24ubmFtZX0gUkVBTE0gJHtwcmV2fSAtPiAke25leHR9YCk7XG4gICAgICAgICAgLy99XG4gICAgICAgICAgbmF0aW9uLnJlYWxtID0gc2l0ZUlkO1xuICAgICAgICB9XG4gICAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICAvLyBmdXR1cmUgc2l0ZVxuICAgICAgY2FzZSA2MzE6XG4gICAgICAgIGZ1dHVyZSA9IHRydWU7XG4gICAgICAgIC8vIHUga25vdyB0aGlzIGJpdGNoIGZhbGxzIFRIUlVcbiAgICAgIC8vIHN0YXJ0IHNpdGVcbiAgICAgIGNhc2UgNTI6XG4gICAgICBjYXNlIDEwMDpcbiAgICAgIGNhc2UgMjU6XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gc29tZSBvdGhlciBkdW1iYXNzIGF0dHJpYnV0ZVxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByb3dzLnB1c2goe1xuICAgICAgbmF0aW9uSWQsXG4gICAgICBzaXRlSWQsXG4gICAgICBmdXR1cmUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICB9KTtcbiAgICBkZWxSb3dzLnB1c2goaSk7XG4gIH1cblxuICAvLyByZW1vdmUgbm93LXJlZHVuZGFudCBhdHRyaWJ1dGVzXG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIHRydWVcbiAgKTtcbn1cblxuLypcbmZ1bmN0aW9uIG1ha2VVbml0U291cmNlU2NoZW1hICgpOiBhbnkge1xuICByZXR1cm4gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRTb3VyY2UnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczoge1xuICAgICAgdW5pdElkOiAwLFxuICAgICAgbmF0aW9uSWQ6IDEsXG4gICAgICBzb3VyY2VJZDogMixcbiAgICAgIHNvdXJjZVR5cGU6IDMsXG4gICAgICBzb3VyY2VBcmc6IDQsXG4gICAgfSxcbiAgICBmaWVsZHM6IFtcbiAgICAgICd1bml0SWQnLFxuICAgICAgJ25hdGlvbklkJyxcbiAgICAgICdzb3VyY2VJZCcsXG4gICAgICAnc291cmNlVHlwZScsXG4gICAgICAnc291cmNlQXJnJyxcbiAgICBdLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzb3VyY2VJZCcsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzb3VyY2VUeXBlJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlQXJnJyxcbiAgICAgICAgaW5kZXg6IDQsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xufVxuKi9cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlOYXRpb24gKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1NwZWxsW3NwZWxsSWRdK05hdGlvbltuYXRpb25JZF0nLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBzcGVsbElkOiAwLCBuYXRpb25JZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ25hdGlvbklkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gMjc4KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gTkFUSU9OICR7cmF3X3ZhbHVlfWApO1xuICAgICAgY29uc3QgbmF0aW9uSWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobmF0aW9uSWQpIHx8IG5hdGlvbklkIDwgMCB8fCBuYXRpb25JZCA+IDI1NSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgTkFZU0ggISEhISEgKCR7bmF0aW9uSWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgbmF0aW9uSWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICBmYWxzZVxuICApO1xufVxuXG5mdW5jdGlvbiBtYWtlU3BlbGxCeVVuaXQgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5VW5pdCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbFtzcGVsbElkXStVbml0W3VuaXRJZF0nLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBzcGVsbElkOiAwLCB1bml0SWQ6IDEgfSxcbiAgICBmaWVsZHM6IFsnc3BlbGxJZCcsICd1bml0SWQnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzcGVsbElkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uSTMyLFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICBsZXQgX19yb3dJZCA9IDA7XG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG4gIGZvciAoY29uc3QgW2ksIHJdIG9mIGF0dHJzLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyBzcGVsbF9udW1iZXI6IHNwZWxsSWQsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlIH0gPSByO1xuICAgIGlmIChhdHRyaWJ1dGUgPT09IDczMSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgJHtzcGVsbElkfSBJUyBSRVNUUklDVEVEIFRPIFVOSVQgJHtyYXdfdmFsdWV9YCk7XG4gICAgICBjb25zdCB1bml0SWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIodW5pdElkKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgVU5JVCAhISEhISAoJHt1bml0SWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgdW5pdElkIH0pO1xuICAgICAgX19yb3dJZCsrO1xuICAgIH1cbiAgfVxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQgPSB1bmRlZmluZWRcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICBmYWxzZVxuICApO1xufVxuXG4vLyBmZXcgdGhpbmdzIGhlcmU6XG4vLyAtIGhtb24xLTUgJiBoY29tMS00IGFyZSBjYXAtb25seSB1bml0cy9jb21tYW5kZXJzXG4vLyAtIG5hdGlvbmFscmVjcnVpdHMgKyBuYXRjb20gLyBuYXRtb24gYXJlIG5vbi1jYXAgb25seSBzaXRlLWV4Y2x1c2l2ZXMgKHlheSlcbi8vIC0gbW9uMS0yICYgY29tMS0zIGFyZSBnZW5lcmljIHJlY3J1aXRhYmxlIHVuaXRzL2NvbW1hbmRlcnNcbi8vIC0gc3VtMS00ICYgbl9zdW0xLTQgYXJlIG1hZ2Utc3VtbW9uYWJsZSAobiBkZXRlcm1pbmVzIG1hZ2UgbHZsIHJlcSlcbi8vICh2b2lkZ2F0ZSAtIG5vdCByZWFsbHkgcmVsZXZhbnQgaGVyZSwgaXQgZG9lc24ndCBpbmRpY2F0ZSB3aGF0IG1vbnN0ZXJzIGFyZVxuLy8gc3VtbW9uZWQsIG1heSBhZGQgdGhvc2UgbWFudWFsbHk/KVxuXG5leHBvcnQgZW51bSBTSVRFX1JFQyB7XG4gIEhPTUVfTU9OID0gMCwgLy8gYXJnIGlzIG5hdGlvbiwgd2UnbGwgaGF2ZSB0byBhZGQgaXQgbGF0ZXIgdGhvdWdoXG4gIEhPTUVfQ09NID0gMSwgLy8gc2FtZVxuICBSRUNfTU9OID0gMixcbiAgUkVDX0NPTSA9IDMsXG4gIE5BVF9NT04gPSA0LCAvLyBhcmcgaXMgbmF0aW9uXG4gIE5BVF9DT00gPSA1LCAvLyBzYW1lXG4gIFNVTU1PTiA9IDgsIC8vIGFyZyBpcyBsZXZlbCByZXF1aXJlbWVudCAoaW5jbHVkZSBwYXRoPylcbn1cblxuY29uc3QgU19ITU9OUyA9IEFycmF5LmZyb20oJzEyMzQ1JywgbiA9PiBgaG1vbiR7bn1gKTtcbmNvbnN0IFNfSENPTVMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBgaGNvbSR7bn1gKTtcbmNvbnN0IFNfUk1PTlMgPSBBcnJheS5mcm9tKCcxMicsIG4gPT4gYG1vbiR7bn1gKTtcbmNvbnN0IFNfUkNPTVMgPSBBcnJheS5mcm9tKCcxMjMnLCBuID0+IGBjb20ke259YCk7XG5jb25zdCBTX1NVTU5TID0gQXJyYXkuZnJvbSgnMTIzNCcsIG4gPT4gW2BzdW0ke259YCwgYG5fc3VtJHtufWBdKTtcblxuZnVuY3Rpb24gbWFrZVVuaXRCeVNpdGUgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHsgTWFnaWNTaXRlLCBTaXRlQnlOYXRpb24sIFVuaXQgfSA9IHRhYmxlcztcbiAgaWYgKCFTaXRlQnlOYXRpb24pIHRocm93IG5ldyBFcnJvcignZG8gU2l0ZUJ5TmF0aW9uIGZpcnN0Jyk7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVNpdGUnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnTWFnaWNTaXRlW3NpdGVJZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc2l0ZUlkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIsIHJlY0FyZzogMyB9LFxuICAgIGZpZWxkczogWydzaXRlSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnLCAncmVjQXJnJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjQXJnJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHNpdGUgb2YgTWFnaWNTaXRlLnJvd3MpIHtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU19ITU9OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IDA7XG4gICAgICBjb25zdCBuaiA9IHNpdGUuU2l0ZUJ5TmF0aW9uPy5maW5kKCh7IHNpdGVJZCB9KSA9PiBzaXRlSWQgPT09IHNpdGUuaWQpO1xuICAgICAgaWYgKCFuaikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICdtaXhlZCB1cCBjYXAtb25seSBtb24gc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSwgc2l0ZS5TaXRlQnlOYXRpb25cbiAgICAgICAgKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduaWlpaWNlJywgbmosIHNpdGUuU2l0ZUJ5TmF0aW9uKVxuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gMDtcbiAgICAgIGNvbnN0IG5qID0gc2l0ZS5TaXRlQnlOYXRpb24/LmZpbmQoKHsgc2l0ZUlkIH0pID0+IHNpdGVJZCA9PT0gc2l0ZS5pZCk7XG4gICAgICBpZiAoIW5qKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgJ21peGVkIHVwIGNhcC1vbmx5IGNtZHIgc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSwgc2l0ZS5TaXRlQnlOYXRpb25cbiAgICAgICAgKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQobW5yKTtcbiAgICAgIGlmICh1bml0KSB7XG4gICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfQ09NLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JNT05TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGsgb2YgU19SQ09NUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldChtbnIpO1xuICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgdW5pdC50eXBlIHw9IDE7IC8vIGZsYWcgYXMgYSBjb21tYW5kZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIHNpdGUgY29tbWFuZGVyIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrLCBua10gb2YgU19TVU1OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgYXJnID0gc2l0ZVtua107XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuU1VNTU9OLFxuICAgICAgICByZWNBcmc6IGFyZywgLy8gbGV2ZWwgcmVxdWl1cmVtZW50IChjb3VsZCBhbHNvIGluY2x1ZGUgcGF0aClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChzaXRlLm5hdGlvbmFscmVjcnVpdHMpIHtcbiAgICAgIGlmIChzaXRlLm5hdG1vbikgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBzaXRlLm5hdG1vbixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX01PTixcbiAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICB9KTtcbiAgICAgIGlmIChzaXRlLm5hdGNvbSkge1xuICAgICAgICByb3dzLnB1c2goe1xuICAgICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgICB1bml0SWQ6IHNpdGUubmF0Y29tLFxuICAgICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLk5BVF9DT00sXG4gICAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHNpdGUubmF0Y29tKTtcbiAgICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIG5hdGNvbSAobm8gdW5pdCBpbiB1bml0IHRhYmxlPyknLCBzaXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyB5YXkhXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlXG4gICk7XG5cbn1cblxuICAvKlxuY29uc3QgU1VNX0ZJRUxEUyA9IFtcbiAgLy8gdGhlc2UgdHdvIGNvbWJpbmVkIHNlZW0gdG8gYmUgc3VtbW9uICNtYWtlbW9uc3Rlck5cbiAgJ3N1bW1vbicsICduX3N1bW1vbicsXG4gIC8vIHRoaXMgaXMgdXNlZCBieSB0aGUgZ2hvdWwgbG9yZCBvbmx5LCBhbmQgaXQgc2hvdWxkIGFjdHVhbGx5IGJlIGBuX3N1bW1vbiA9IDVgXG4gICdzdW1tb241JyxcbiAgLy8gYXV0byBzdW1tb24gMS9tb250aCwgYXMgcGVyIG1vZCBjb21tYW5kcywgdXNlZCBvbmx5IGJ5IGZhbHNlIHByb3BoZXQgYW5kIHZpbmUgZ3V5P1xuICAnc3VtbW9uMScsXG5cbiAgLy8gZG9tIHN1bW1vbiBjb21tYW5kc1xuICAnZG9tc3VtbW9uJyxcbiAgJ2RvbXN1bW1vbjInLFxuICAnZG9tc3VtbW9uMjAnLFxuICAncmFyZWRvbXN1bW1vbicsXG5cbiAgJ2JhdHN0YXJ0c3VtMScsXG4gICdiYXRzdGFydHN1bTInLFxuICAnYmF0c3RhcnRzdW0zJyxcbiAgJ2JhdHN0YXJ0c3VtNCcsXG4gICdiYXRzdGFydHN1bTUnLFxuICAnYmF0c3RhcnRzdW0xZDMnLFxuICAnYmF0c3RhcnRzdW0xZDYnLFxuICAnYmF0c3RhcnRzdW0yZDYnLFxuICAnYmF0c3RhcnRzdW0zZDYnLFxuICAnYmF0c3RhcnRzdW00ZDYnLFxuICAnYmF0c3RhcnRzdW01ZDYnLFxuICAnYmF0c3RhcnRzdW02ZDYnLFxuICAnYmF0dGxlc3VtNScsIC8vIHBlciByb3VuZFxuXG4gIC8vJ29uaXN1bW1vbicsIHdlIGRvbnQgcmVhbGx5IGNhcmUgYWJvdXQgdGhpcyBvbmUgYmVjYXVzZSBpdCBkb2VzbnQgdGVsbCB1c1xuICAvLyAgYWJvdXQgd2hpY2ggbW9uc3RlcnMgYXJlIHN1bW1vbmVkXG4gIC8vICdoZWF0aGVuc3VtbW9uJywgaWRmaz8/IGh0dHBzOi8vaWxsd2lraS5jb20vZG9tNS91c2VyL2xvZ2d5L3NsYXZlclxuICAvLyAnY29sZHN1bW1vbicsIHVudXNlZFxuICAvLyd3aW50ZXJzdW1tb24xZDMnLCAvLyB2YW1wIHF1ZWVuLCBub3QgYWN0dWFsbHkgYSAoZG9jdW1lbnRlZCkgY29tbWFuZD9cbiAgLy8ndHVybW9pbHN1bW1vbicsIC8vIGFsc28gbm90IGEgY29tbWFuZCB+ICFcbl1cbiovXG5cblxuZXhwb3J0IGNvbnN0IGVudW0gU1VNTU9OIHtcbiAgVU5LTk9XTiA9IDAsXG4gIEFMTElFUyA9IDEsIC8vIHZpYSAjbWFrZW1vbnN0ZXJOIChhbmQgdGhlIHNpbmdsZSBzdW1tb241IGluIHRoZSBjc3YgZGF0YSlcbiAgRE9NID0gMiwgLy8gdmlhICNbcmFyZV1kb21zdW1tb25OXG4gIEFVVE8gPSAzLCAvLyB2aWEgI3N1bW1vbjEgKGdvZXMgdXAgdG8gNSlcbiAgQkFUVExFX1JPVU5EID0gNCwgLy8gdmlhICNiYXRzdGFydHN1bU4gb3IgI2JhdHRsZXN1bVxuICBCQVRUTEVfU1RBUlQgPSA1LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIFRFTVBMRV9UUkFJTkVSID0gNiwgLy8gdmlhICN0ZW1wbGV0cmFpbmVyLCB2YWx1ZSBpcyBoYXJkIGNvZGVkIHRvIDE4NTkuLi5cbiAgV0lOVEVSID0gNywgLy8gbm90IGEgY29tbWFuZCwgdXNlZCBvbmNlIGJ5IHZhbXBpcmUgcXVlZW5cbn1cblxuZnVuY3Rpb24gRF9TVU1NT04gKHQ6IFNVTU1PTiwgczogbnVtYmVyKTogc3RyaW5nIHtcbiAgc3dpdGNoICh0KSB7XG4gICAgY2FzZSBTVU1NT04uQUxMSUVTOiByZXR1cm4gYCNtYWtlbW9uc3RlciR7c31gO1xuICAgIGNhc2UgU1VNTU9OLkRPTToge1xuICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgIGNhc2UgMDogcmV0dXJuIGAjZG9tc3VtbW9uYDtcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gYCNkb21zdW1tb24yYDtcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gYCNkb21zdW1tb24yMGA7XG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGAjcmFyZWRvbXN1bW1vbmA7XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBgRE9NID8/ICR7dH06JHtzfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGNhc2UgU1VNTU9OLkFVVE86IHJldHVybiBgI3N1bW1vbiR7c31gO1xuICAgIGNhc2UgU1VNTU9OLkJBVFRMRV9ST1VORDogcmV0dXJuIGAjYmF0dGxlc3VtJHtzfWA7XG4gICAgY2FzZSBTVU1NT04uQkFUVExFX1NUQVJUOiB7XG4gICAgICBjb25zdCBuID0gcyAmIDYzO1xuICAgICAgcmV0dXJuIHMgJiAxMjggPyBgI2JhdHN0YXJ0c3VtJHtufWQ2YCA6XG4gICAgICAgIHMgJiA2NCA/IGAjYmF0c3RhcnRzdW0xZDNgIDpcbiAgICAgICAgYCNiYXRzdGFydHN1bSR7bn1gO1xuICAgIH1cbiAgICBjYXNlIFNVTU1PTi5URU1QTEVfVFJBSU5FUjogcmV0dXJuIGAjdGVtcGxldHJhaW5lcmA7XG4gICAgY2FzZSBTVU1NT04uV0lOVEVSOiByZXR1cm4gYCgxZDMgYXQgdGhlIHN0YXJ0IG9mIHdpbnRlcilgO1xuICAgIGRlZmF1bHQ6IHJldHVybiBgSURLPz8/IHQ9JHt0fTsgcz0ke3N9YFxuICB9XG59XG5cbi8vIEkgZG9uJ3QgdGhpbmsgdGhlc2UgYXJlIGRlZmluZWQgZGlyZWN0bHkgaW4gdGhlIGRhdGEgKGp1c3QgYSBuYW1lKSwgYnV0IHdlXG4vLyBjb3VsZCBtYWludGFpbiBhIHRhYmxlICsgam9pblxuY29uc3QgTU9OVEFHUyA9IHtcbiAgLy9SYW5kb20gQmlyZCAoRmFsY29uLCBCbGFjayBIYXdrLCBTd2FuIG9yIFN0cmFuZ2UgQmlyZClcbiAgWy0yMF06IFszMzcxLCA1MTcsIDI5MjksIDMzMjddLFxuICAvLyBMaW9uc1xuICBbLTE5XTogWzMzNjMsIDMzNjQsIDMzNjUsIDMzNjZdLFxuICAvLyBUT0RPIC0gbmVlZCB0byBmaWd1cmUgb3V0IHdoaWNoIG1vbnN0ZXJzIHRoZXNlIHJlYWxseSBhcmUgKGNyb3NzYnJlZW5kcylcbiAgWy0xMl06IFs1MzBdLCAvLyAzJSBnb29kP1xuICBbLTExXTogWzUzMF0sIC8vIGJhZFxuICBbLTEwXTogWzUzMF0sIC8vIGdvb2RcbiAgLy8gWWF0YXMgYW5kIFBhaXJpa2FzXG4gIFstMTddOiBbXSxcbiAgLy8gQ2VsZXN0aWFsIFlhemFkXG4gIFstMTZdOiBbXSxcbiAgLy8gUmFuZG9tIEJ1Z1xuICBbLTldOiBbXSxcbiAgLy8gRG9vbSBIb3Jyb3JcbiAgWy04XTogW10sXG4gIC8vIEhvcnJvclxuICBbLTddOiBbXSxcbiAgLy8gTGVzc2VyIEhvcnJvclxuICBbLTZdOiBbXSxcbiAgLy8gUmFuZG9tIEFuaW1hbFxuICBbLTVdOiBbXSxcbiAgLy8gR2hvdWxcbiAgWy00XTogW10sXG4gIC8vIFNvdWx0cmFwIEdob3N0XG4gIFstM106IFtdLFxuICAvLyBMb25nZGVhZFxuICBbLTJdOiBbXSxcbiAgLy8gU291bGxlc3NcbiAgWy0xXTogW10sXG59XG5cbmZ1bmN0aW9uIG1ha2VVbml0QnlVbml0U3VtbW9uICh0YWJsZXM6IFRSKSB7XG4gIGNvbnN0IHsgVW5pdCB9ID0gdGFibGVzO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdVbml0W3VuaXRJZF0rVW5pdFtzdW1tb25lcklkXScsXG4gICAgZmxhZ3NVc2VkOiAxLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgZmllbGRzOiBbJ3VuaXRJZCcsICdzdW1tb25lcklkJywgJ3N1bW1vblR5cGUnLCAnc3VtbW9uU3RyZW5ndGgnLCAnYXNUYWcnXSxcbiAgICByYXdGaWVsZHM6IHsgdW5pdElkOiAwLCBzdW1tb25lcklkOiAxLCBzdW1tb25UeXBlOiAyLCBzdW1tb25TdHJlbmd0aDogMywgYXNUYWc6IDR9LFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25lcklkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vblR5cGUnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25TdHJlbmd0aCcsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBCb29sQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vblN0cmVuZ3RoJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5CT09MLFxuICAgICAgICBiaXQ6IDAsXG4gICAgICAgIGZsYWc6IDEsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG5cbiAgZnVuY3Rpb24gcHJpbnRSb3cgKHNpZDogbnVtYmVyLCB1aWQ6IG51bWJlciwgdDogU1VNTU9OLCBzOiBudW1iZXIsIHA/OiBzdHJpbmcpIHtcbiAgICBwID8/PSAnICAtJztcbiAgICBjb25zdCBzbiA9IFVuaXQubWFwLmdldChzaWQpLm5hbWVcbiAgICBjb25zdCB1biA9IFVuaXQubWFwLmdldCh1aWQpLm5hbWVcbiAgICBjb25zdCBkID0gRF9TVU1NT04odCwgcyk7XG4gICAgY29uc29sZS5sb2coYCR7cH0gJHtkfSAke3NufSAtPiAke3VufWApO1xuICB9XG4gIGZ1bmN0aW9uIGFkZFJvdyAoXG4gICAgc3VtbW9uVHlwZTogU1VNTU9OLFxuICAgIHN1bW1vblN0cmVuZ3RoOiBudW1iZXIsXG4gICAgc3VtbW9uZXJJZDogbnVtYmVyLFxuICAgIHRhcmdldDogbnVtYmVyLFxuICApIHtcbiAgICBpZiAodGFyZ2V0ID4gMCkge1xuICAgICAgY29uc3QgciA9IHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHN1bW1vbmVySWQsXG4gICAgICAgIHN1bW1vblR5cGUsXG4gICAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgICBhc1RhZzogZmFsc2UsXG4gICAgICAgIHVuaXRJZDogdGFyZ2V0LFxuICAgICAgfTtcbiAgICAgIHByaW50Um93KHIuc3VtbW9uZXJJZCwgci51bml0SWQsIHIuc3VtbW9uVHlwZSwgci5zdW1tb25TdHJlbmd0aClcbiAgICAgIHJvd3MucHVzaChyKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA8IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgIE1PTlRBRyAnICsgdGFyZ2V0ICsgJyBbJyk7XG4gICAgICBpZiAoIU1PTlRBR1NbdGFyZ2V0XT8ubGVuZ3RoKSBjb25zb2xlLmxvZygnICAgIChNSVNTSU5HISknKTtcbiAgICAgIGVsc2UgZm9yIChjb25zdCB1bml0SWQgb2YgTU9OVEFHU1t0YXJnZXRdKSB7XG4gICAgICAgIGNvbnN0IHIgPSB7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc3VtbW9uZXJJZCxcbiAgICAgICAgICBzdW1tb25UeXBlLFxuICAgICAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgICAgIGFzVGFnOiB0cnVlLFxuICAgICAgICAgIHVuaXRJZCxcbiAgICAgICAgfVxuICAgICAgICBwcmludFJvdyhyLnN1bW1vbmVySWQsIHIudW5pdElkLCByLnN1bW1vblR5cGUsIHIuc3VtbW9uU3RyZW5ndGgsICcgICAgID4nKTtcbiAgICAgICAgcm93cy5wdXNoKHIpO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJyAgXVxcbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKGAgICAgICAhISEhISAke1VuaXQubWFwLmdldChzdW1tb25lcklkKS5uYW1lfSBTVU1NT05TIElEIDAgISFgKVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qgc3VtbW9uZXIgb2YgVW5pdC5yb3dzKSB7XG4gICAgaWYgKHN1bW1vbmVyLnN1bW1vbilcbiAgICAgIGFkZFJvdyhTVU1NT04uQUxMSUVTLCBzdW1tb25lci5uX3N1bW1vbiwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLnN1bW1vbik7XG5cbiAgICBpZiAoc3VtbW9uZXIuc3VtbW9uNSlcbiAgICAgIGFkZFJvdyhTVU1NT04uQUxMSUVTLCA1LCBzdW1tb25lci5pZCwgc3VtbW9uZXIuc3VtbW9uNSk7XG5cbiAgICBpZiAoc3VtbW9uZXIuc3VtbW9uMSlcbiAgICAgIGFkZFJvdyhTVU1NT04uQVVUTywgMSwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLnN1bW1vbjEpO1xuXG4gICAgLy8gdmFsdWUgaXMgaGFyZCBjb2RlZCB0byAxODU5ICh0aGF0cyB0aGUgb25seSB0aGluZyBzdW1tb25lZCBpbiB2YW5pbGxhKVxuICAgIGlmIChzdW1tb25lci50ZW1wbGV0cmFpbmVyKVxuICAgICAgYWRkUm93KFNVTU1PTi5URU1QTEVfVFJBSU5FUiwgMCwgc3VtbW9uZXIuaWQsIDE4NTkpO1xuICAgIGlmIChzdW1tb25lci53aW50ZXJzdW1tb24xZDMpXG4gICAgICBhZGRSb3coU1VNTU9OLldJTlRFUiwgMCwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLndpbnRlcnN1bW1vbjFkMyk7XG5cbiAgICBpZiAoc3VtbW9uZXIuZG9tc3VtbW9uKVxuICAgICAgYWRkUm93KFNVTU1PTi5ET00sIDAsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5kb21zdW1tb24pO1xuICAgIGlmIChzdW1tb25lci5kb21zdW1tb24yKVxuICAgICAgYWRkUm93KFNVTU1PTi5ET00sIDEsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5kb21zdW1tb24yKTtcbiAgICBpZiAoc3VtbW9uZXIuZG9tc3VtbW9uMjApXG4gICAgICBhZGRSb3coU1VNTU9OLkRPTSwgMiwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLmRvbXN1bW1vbjIwKTtcbiAgICBpZiAoc3VtbW9uZXIucmFyZWRvbXN1bW1vbilcbiAgICAgIGFkZFJvdyhTVU1NT04uRE9NLCAzLCBzdW1tb25lci5pZCwgc3VtbW9uZXIucmFyZWRvbXN1bW1vbik7XG5cbiAgICBmb3IgKGNvbnN0IHMgb2YgWy8qMSwyLDMsNCwqLzVdKSB7IC8vIG9ubHkgNSBpbiB0aGUgY3N2XG4gICAgICBjb25zdCBrID0gYGJhdHRsZXN1bSR7c31gO1xuICAgICAgaWYgKHN1bW1vbmVyW2tdKSBhZGRSb3coU1VNTU9OLkJBVFRMRV9ST1VORCwgcywgc3VtbW9uZXIuaWQsIHN1bW1vbmVyW2tdKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHMgb2YgWzEsMiwzLDQsNV0pIHtcbiAgICAgIGNvbnN0IGsgPSBgYmF0c3RhcnRzdW0ke3N9YDtcbiAgICAgIGlmIChzdW1tb25lcltrXSkgYWRkUm93KFNVTU1PTi5CQVRUTEVfU1RBUlQsIHMsIHN1bW1vbmVyLmlkLCBzdW1tb25lcltrXSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcyBvZiBbMSwyLDMsNCw1LDYvKiw3LDgsOSovXSkgeyAvLyB2YW5pbGxhIG9ubHkgdXNlcyB1cCB0byA2XG4gICAgICBjb25zdCBrID0gYGJhdHN0YXJ0c3VtJHtzfWQ2YDtcbiAgICAgIGlmIChzdW1tb25lcltrXSkgYWRkUm93KFNVTU1PTi5CQVRUTEVfU1RBUlQsIHN8MTI4LCBzdW1tb25lci5pZCwgc3VtbW9uZXJba10pO1xuICAgIH1cbiAgICBpZiAoc3VtbW9uZXIuYmF0c3RhcnRzdW0xZDMpXG4gICAgICBhZGRSb3coU1VNTU9OLkJBVFRMRV9TVEFSVCwgNjQsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5iYXRzdGFydHN1bTFkMylcbiAgfVxuXG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cbi8vIFRPRE8gLSBub3Qgc3VyZSB5ZXQgaWYgSSB3YW50IHRvIGR1cGxpY2F0ZSBjYXAtb25seSBzaXRlcyBoZXJlP1xuZnVuY3Rpb24gbWFrZVVuaXRCeU5hdGlvbiAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IG5hdGlvbklkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIgfSxcbiAgICBqb2luczogJ05hdGlvbltuYXRpb25JZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmaWVsZHM6IFsnbmF0aW9uSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cblxuICAvLyBUT0RPIC0gcHJldGVuZGVyc1xuICAvLyBmb2xsb3dpbmcgdGhlIGxvZ2ljIGluIC4uLy4uLy4uLy4uL3NjcmlwdHMvRE1JL01OYXRpb24uanNcbiAgLy8gICAxLiBkZXRlcm1pbmUgbmF0aW9uIHJlYWxtKHMpIGFuZCB1c2UgdGhhdCB0byBhZGQgcHJldGVuZGVyc1xuICAvLyAgIDIuIHVzZSB0aGUgbGlzdCBvZiBcImV4dHJhXCIgYWRkZWQgcHJldGVuZGVycyB0byBhZGQgYW55IGV4dHJhXG4gIC8vICAgMy4gdXNlIHRoZSB1bnByZXRlbmRlcnMgdGFibGUgdG8gZG8gb3Bwb3NpdGVcblxuICAvLyB0aGVyZSdzIGEgbG90IGdvaW4gb24gaGVyZVxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIG1ha2VSZWNydWl0bWVudEZyb21BdHRycyh0YWJsZXMsIHJvd3MpO1xuICBjb21iaW5lUmVjcnVpdG1lbnRUYWJsZXModGFibGVzLCByb3dzKTtcbiAgbWFrZVByZXRlbmRlckJ5TmF0aW9uKHRhYmxlcywgcm93cylcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICBmYWxzZSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlY3J1aXRtZW50RnJvbUF0dHJzICh0YWJsZXM6IFRSLCByb3dzOiBhbnlbXSkge1xuICBjb25zdCB7IEF0dHJpYnV0ZUJ5TmF0aW9uLCBVbml0IH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbEFCTlJvd3M6IG51bWJlcltdID0gW107XG4gIGZvciAoY29uc3QgW2lBQk4gLHJdICBvZiBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgcmF3X3ZhbHVlLCBhdHRyaWJ1dGUsIG5hdGlvbl9udW1iZXIgfSA9IHI7XG4gICAgbGV0IHVuaXQ6IGFueTtcbiAgICBsZXQgdW5pdElkOiBhbnkgPSBudWxsIC8vIHNtZmhcbiAgICBsZXQgdW5pdFR5cGUgPSAwO1xuICAgIGxldCByZWNUeXBlID0gMDtcbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSAxNTg6XG4gICAgICBjYXNlIDE1OTpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTYwOlxuICAgICAgY2FzZSAxNjE6XG4gICAgICBjYXNlIDE2MjpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE2MzpcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg2OlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC53YXRlcnNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVRFUjtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg3OlxuICAgICAgY2FzZSAxODk6XG4gICAgICBjYXNlIDE5MDpcbiAgICAgIGNhc2UgMTkxOlxuICAgICAgY2FzZSAyMTM6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LndhdGVyc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBVEVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk0OlxuICAgICAgY2FzZSA0MTI6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkZPUkVTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NTpcbiAgICAgIGNhc2UgNDEzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5GT1JFU1Q7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuU1dBTVA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlNXQU1QO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTg6XG4gICAgICBjYXNlIDQwODpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTk6XG4gICAgICBjYXNlIDQwOTpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMDpcbiAgICAgIGNhc2UgNDE2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMTpcbiAgICAgIGNhc2UgNDE3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAyOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDQ6XG4gICAgICBjYXNlIDQwNjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuUExBSU5TO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA1OlxuICAgICAgY2FzZSA0MDc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlBMQUlOUztcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTM5OlxuICAgICAgY2FzZSAxNDA6XG4gICAgICBjYXNlIDE0MTpcbiAgICAgIGNhc2UgMTQyOlxuICAgICAgY2FzZSAxNDM6XG4gICAgICBjYXNlIDE0NDpcbiAgICAgICAgLy9jb25zb2xlLmxvZygnSEVSTyBGSU5ERVIgRk9VTkQnLCByYXdfdmFsdWUpXG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5IRVJPO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTQ1OlxuICAgICAgY2FzZSAxNDY6XG4gICAgICBjYXNlIDE0OTpcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXVsdGkgaGVybyEnLCByYXdfdmFsdWUpXG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NVUxUSUhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICh1bml0SWQgPT0gbnVsbCkgY29udGludWU7XG4gICAgZGVsQUJOUm93cy5wdXNoKGlBQk4pO1xuICAgIHVuaXQgPz89IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICh1bml0VHlwZSkgdW5pdC50eXBlIHw9IHVuaXRUeXBlO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignbW9yZSBwaXNzIHVuaXQ6JywgaUFCTiwgdW5pdElkKTtcbiAgICByb3dzLnB1c2goe1xuICAgICAgdW5pdElkLFxuICAgICAgcmVjVHlwZSxcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgbmF0aW9uSWQ6IG5hdGlvbl9udW1iZXIsXG4gICAgfSk7XG4gIH1cblxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxBQk5Sb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKVxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVSZWNydWl0bWVudFRhYmxlcyAodGFibGVzOiBUUiwgcm93czogYW55W10pIHtcbiAgY29uc3Qge1xuICAgIFVuaXQsXG4gICAgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIEZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgfSA9IHRhYmxlcztcbiAgZm9yIChjb25zdCByIG9mIEZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkNPQVNULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVByZXRlbmRlckJ5TmF0aW9uICh0YWJsZXM6IFRSLCByb3dzOiBhbnlbXSkge1xuICBjb25zdCB7XG4gICAgUHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIFVucHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5hdGlvbixcbiAgICBVbml0LFxuICAgIFJlYWxtLFxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLFxuICB9ID0gdGFibGVzO1xuXG4gIC8vIFRPRE8gLSBkZWxldGUgbWF0Y2hpbmcgcm93cyBmcm9tIHRoZSB0YWJsZVxuICBjb25zdCBjaGVhcEF0dHJzID0gQXR0cmlidXRlQnlOYXRpb24ucm93cy5maWx0ZXIoXG4gICAgKHsgYXR0cmlidXRlOiBhIH0pID0+IGEgPT09IDMxNCB8fCBhID09PSAzMTVcbiAgKTtcbiAgY29uc3QgY2hlYXAgPSBuZXcgTWFwPG51bWJlciwgTWFwPG51bWJlciwgMjB8NDA+PigpO1xuICBmb3IgKGNvbnN0IHsgbmF0aW9uX251bWJlciwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSBvZiBjaGVhcEF0dHJzKSB7XG4gICAgaWYgKCFjaGVhcC5oYXMocmF3X3ZhbHVlKSkgY2hlYXAuc2V0KHJhd192YWx1ZSwgbmV3IE1hcCgpKTtcbiAgICBjb25zdCBjVW5pdCA9IGNoZWFwLmdldChyYXdfdmFsdWUpITtcbiAgICBjVW5pdC5zZXQobmF0aW9uX251bWJlciwgYXR0cmlidXRlID09PSAzMTQgPyAyMCA6IDQwKTtcbiAgfVxuXG4gIC8vIG1ha2UgYSBtYXAgZmlyc3QsIHdlIHdpbGwgY29udmVydCB0byByb3dzIGF0IHRoZSBlbmRcbiAgY29uc3QgcHJldGVuZGVycyA9IG5ldyBNYXAoTmF0aW9uLnJvd3MubWFwKHIgPT4gW3IuaWQsIG5ldyBTZXQ8bnVtYmVyPigpXSkpO1xuICAvLyBtb25zdGVycyBmb3IgZWFjaCByZWFsbVxuICBjb25zdCByMm0gPSBuZXcgTWFwPG51bWJlciwgU2V0PG51bWJlcj4+KCk7XG4gIGZvciAobGV0IGkgPSAxOyBpIDw9IDEwOyBpKyspIHIybS5zZXQoaSwgbmV3IFNldCgpKTtcbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCByZWFsbSB9IG9mIFJlYWxtLnJvd3MpXG4gICAgcjJtLmdldChyZWFsbSkhLmFkZChtb25zdGVyX251bWJlcik7XG5cbiAgLy8gZmlyc3QgZG8gcmVhbG0tYmFzZWQgcHJldGVuZGVyc1xuICBmb3IgKGNvbnN0IHsgcmVhbG0sIGlkIH0gb2YgTmF0aW9uLnJvd3MpIHtcbiAgICBpZiAoIXJlYWxtKSBjb250aW51ZTtcbiAgICBmb3IgKGNvbnN0IG1uciBvZiByMm0uZ2V0KHJlYWxtKSEpIHtcbiAgICAgIHByZXRlbmRlcnMuZ2V0KGlkKSEuYWRkKG1ucik7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhlbiBhZGQgcHJldGVuZGVycyBieSBuYXRpb25cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCBuYXRpb25fbnVtYmVyIH0gb2YgUHJldGVuZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBwcmV0ZW5kZXJzLmdldChuYXRpb25fbnVtYmVyKSEuYWRkKG1vbnN0ZXJfbnVtYmVyKTtcbiAgfVxuICAvLyB0aGVuIHVucHJldGVuZGVycyBieSBuYXRpb25cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCBuYXRpb25fbnVtYmVyIH0gb2YgVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIHByZXRlbmRlcnMuZ2V0KG5hdGlvbl9udW1iZXIpIS5kZWxldGUobW9uc3Rlcl9udW1iZXIpO1xuICB9XG5cbiAgY29uc3QgYWRkZWRVbml0cyA9IG5ldyBNYXA8bnVtYmVyLCBhbnk+KCk7XG5cbiAgZm9yIChjb25zdCBbbmF0aW9uSWQsIHVuaXRJZHNdIG9mIHByZXRlbmRlcnMpIHtcbiAgICBmb3IgKGNvbnN0IHVuaXRJZCBvZiB1bml0SWRzKSB7XG4gICAgICBpZiAoIWFkZGVkVW5pdHMuaGFzKHVuaXRJZCkpIGFkZGVkVW5pdHMuc2V0KHVuaXRJZCwgVW5pdC5tYXAuZ2V0KHVuaXRJZCkpO1xuICAgICAgY29uc3QgZGlzY291bnQgPSBjaGVhcC5nZXQodW5pdElkKT8uZ2V0KG5hdGlvbklkKSA/PyAwO1xuICAgICAgY29uc3QgcmVjVHlwZSA9IGRpc2NvdW50ID09PSA0MCA/IFJFQ19UWVBFLlBSRVRFTkRFUl9DSEVBUF80MCA6XG4gICAgICAgIGRpc2NvdW50ID09PSAyMCA/IFJFQ19UWVBFLlBSRVRFTkRFUl9DSEVBUF8yMCA6XG4gICAgICAgIFJFQ19UWVBFLlBSRVRFTkRFUjtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIHVuaXRJZCxcbiAgICAgICAgcmVjVHlwZSxcbiAgICAgICAgcmVjQXJnOiBuYXRpb25JZCxcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtpZCwgdV0gb2YgYWRkZWRVbml0cykge1xuICAgIGlmICghdSkgeyBjb25zb2xlLndhcm4oJ2Zha2UgdW5pdCBpZD8nLCBpZCk7IGNvbnRpbnVlIH1cbiAgICBpZiAoIXUuc3RhcnRkb20gfHwgISh1LnR5cGUgJiBVTklUX1RZUEUuUFJFVEVOREVSKSkge1xuICAgICAgY29uc29sZS53YXJuKCdub3QgYSBwcmV0ZW5kZXI/JywgdS5uYW1lLCB1LnR5cGUsIHUuc3RhcnRkb20pO1xuICAgIH1cbiAgICB1LnR5cGUgfD0gVU5JVF9UWVBFLlBSRVRFTkRFUjtcbiAgfVxufVxuXG4vLyB1c2VmdWwgZGF0YSBmcm9tIHRoZSBvcmlnaW5hbCBmb3JtYXR0ZXI6XG4vL2Z1bmN0aW9uIHNob3dfc3VtbW9uKHVuaXQsIGNvdW50LCBwYXRobGV2ZWwxLCBzcGVsbGlkKSB7XG4vLyAgdmFyIHJlZjtcbi8vICBpZiAocGFyc2VJbnQodW5pdCkgPCAwIHx8IChwYXJzZUludChzcGVsbGlkKSA9PSAzODApIHx8IChwYXJzZUludChzcGVsbGlkKSA9PSAxMDgxKSkge1xuLy8gICAgdmFyIGFycjtcbi8vICAgIGlmICh1bml0ID09IFwiLTE2XCIpIHtcbi8vICAgICAgYXJyID0gTVNwZWxsLnlhemFkcztcbi8vICAgIH0gZWxzZSBpZiAodW5pdCA9PSBcIi0xN1wiKSB7XG4vLyAgICAgIGFyciA9IE1TcGVsbC55YXRhcztcbi8vICAgIH0gZWxzZSBpZiAodW5pdCA9PSBcIi0yMVwiKSB7XG4vLyAgICAgIGFyciA9IE1TcGVsbC5kd2FyZnM7XG4vLyAgICB9IGVsc2UgaWYgKHVuaXQgPT0gXCI1NDNcIikge1xuLy8gICAgICBhcnIgPSBNU3BlbGwuYW5nZWxpY2hvc3Q7XG4vLyAgICB9IGVsc2UgaWYgKHVuaXQgPT0gXCIzMDNcIikge1xuLy8gICAgICBhcnIgPSBNU3BlbGwuaG9yZGVmcm9taGVsbDtcbi8vICAgIH1cbi8vICAgIGlmIChhcnIpIHtcbi8vICAgICAgLy9jcmVhdGUgYXJyYXkgb2YgcmVmc1xuLy8gICAgICB2YXIgdG9rZW5zID0gW107XG4vLyAgICAgIGZvciAodmFyIGk9MCwgdWlkOyB1aWQ9IGFycltpXTsgIGkrKylcbi8vICAgICAgICB0b2tlbnMucHVzaCggc2hvd19zdW1tb24odWlkLCBpPT0wID8gMSA6IGNvdW50KSApO1xuLy9cbi8vICAgICAgLy9jb21tYSBzZXBhcmF0ZWQgJiBvbmUgcGVyIGxpbmVcbi8vICAgICAgcmV0dXJuIHRva2Vucy5qb2luKCcsIDxiciAvPicpO1xuLy8gICAgfVxuLy9cbi8vICAgIHJlZiA9IG1vZGN0eC5tb25zdGVyX3RhZ3NfbG9va3VwW3BhcnNlSW50KHVuaXQpXTtcbi8vICAgIGlmIChyZWYpIHtcbi8vICAgICAgcmVmID0gcmVmLm5hbWU7XG4vLyAgICB9IGVsc2Uge1xuLy8gICAgICByZWYgPSAnJztcbi8vICAgICAgZm9yICh2YXIgb2k9MCwgbzsgIG89IG1vZGN0eC51bml0ZGF0YVtvaV07ICBvaSsrKSB7XG4vLyAgICAgICAgaWYgKG8ubW9udGFnKSB7XG4vLyAgICAgICAgICBpZiAoLXBhcnNlSW50KHVuaXQpID09IHBhcnNlSW50KG8ubW9udGFnKSkge1xuLy8gICAgICAgICAgICByZWYgPSByZWYgKyBVdGlscy51bml0UmVmKG8uaWQpICsgJywgPGJyIC8+Jztcbi8vICAgICAgICAgIH1cbi8vICAgICAgICB9XG4vLyAgICAgIH1cbi8vICAgIH1cbi8vICB9IGVsc2Uge1xuLy8gICAgcmVmID0gVXRpbHMudW5pdFJlZih1bml0KTtcbi8vICB9XG4vLyAgaWYgKGNvdW50ICYmIGNvdW50ICE9IFwiMFwiICYmIGNvdW50ICE9IFwiMVwiKSB7XG4vLyAgICByZWYgPSByZWYgKyBcIiB4IFwiICsgU3RyaW5nKHNwZWxsQm9udXMoY291bnQsIHBhdGhsZXZlbDEpKTtcbi8vICB9XG4vLyAgLy8gTWFydmVybmkgZ2V0cyBJcm9uIEJvYXJzXG4vLyAgaWYgKHBhcnNlSW50KHVuaXQpID09IDkyNCkge1xuLy8gICAgcmVmID0gcmVmICsgJzxici8+KCcgKyBVdGlscy51bml0UmVmKDE4MDgpICsgJyB4ICcgKyBTdHJpbmcoc3BlbGxCb251cyhjb3VudCwgcGF0aGxldmVsMSkpICsgJyBmb3IgJyArIFV0aWxzLm5hdGlvblJlZigxMikgKyAnKSc7XG4vLyAgfVxuLy8gIHJldHVybiByZWY7XG4vL31cbi8vXG4vL2Z1bmN0aW9uIGxpc3Rfc3VtbW9ucyhzcGVsbCwgZWZmZWN0KSB7XG4vLyAgdmFyIGFycjtcbi8vICBpZiAoZWZmZWN0LmVmZmVjdF9udW1iZXIgPT0gXCI3NlwiKSB7XG4vLyAgICBhcnIgPSBNU3BlbGwudGFydGFyaWFuR2F0ZTtcbi8vICB9IGVsc2UgaWYgKGVmZmVjdC5lZmZlY3RfbnVtYmVyID09IFwiODFcIiAmJiBzcGVsbC5kYW1hZ2UgPT0gXCI0M1wiKSB7XG4vLyAgICBhcnIgPSBhcnIgPSBNU3BlbGwuZ2hvc3RTaGlwQXJtYWRhO1xuLy8gIH0gZWxzZSBpZiAoZWZmZWN0LmVmZmVjdF9udW1iZXIgPT0gXCI4OVwiKSB7XG4vLyAgICBhcnIgPSBNU3BlbGwudW5pcXVlU3VtbW9uW2VmZmVjdC5yYXdfYXJndW1lbnRdO1xuLy8gIH0gZWxzZSBpZiAoZWZmZWN0LmVmZmVjdF9udW1iZXIgPT0gXCIxMDBcIikge1xuLy8gICAgYXJyID0gTVNwZWxsLnRlcnJhaW5TdW1tb25bZWZmZWN0LnJhd19hcmd1bWVudF07XG4vLyAgfSBlbHNlIGlmIChlZmZlY3QuZWZmZWN0X251bWJlciA9PSBcIjExNFwiKSB7XG4vLyAgICBhcnIgPSBNU3BlbGwudW5pcXVlU3VtbW9uW2VmZmVjdC5yYXdfYXJndW1lbnRdO1xuLy8gIH0gZWxzZSBpZiAoZWZmZWN0LmVmZmVjdF9udW1iZXIgPT0gXCIxMjBcIikge1xuLy8gICAgYXJyID0gTVNwZWxsLnVubGVhc2hJbXByaXNvbmVkT25lcztcbi8vICB9XG4vL1xuLy8gIGlmICghYXJyKSB7XG4vLyAgICBhcnIgPSBbc3BlbGwuZGFtYWdlXTtcbi8vICB9XG4vLyAgLy9jcmVhdGUgYXJyYXkgb2YgcmVmc1xuLy8gIHZhciB0b2tlbnMgPSBbXTtcbi8vICBmb3IgKHZhciBpPTAsIHVpZDsgdWlkPSBhcnJbaV07ICBpKyspXG4vLyAgICB0b2tlbnMucHVzaCggc2hvd19zdW1tb24odWlkLCAxKSApO1xuLy9cbi8vICAvL2NvbW1hIHNlcGFyYXRlZCAmIG9uZSBwZXIgbGluZVxuLy8gIHJldHVybiB0b2tlbnMuam9pbignLCA8YnIgLz4nKTtcbi8vfVxuLy9cbi8vTVNwZWxsLnRhcnRhcmlhbkdhdGUgPSBbNzcxLCA3NzIsIDc3MywgNzc0LCA3NzUsIDc3NiwgNzc3XTtcbi8vTVNwZWxsLnlhemFkcyA9IFsyNjIwLCAyNjIxLCAyNjIyLCAyNjIzLCAyNjI0LCAyNjI1XTtcbi8vTVNwZWxsLnlhdGFzID0gWzI2MzIsIDI2MzMsIDI2MzQsIDI2MzZdO1xuLy9NU3BlbGwuZHdhcmZzID0gWzM0MjUsIDM0MjYsIDM0MjcsIDM0MjhdO1xuLy9NU3BlbGwudW5sZWFzaEltcHJpc29uZWRPbmVzID0gWzI0OTgsIDI0OTksIDI1MDBdO1xuLy9NU3BlbGwuYW5nZWxpY2hvc3QgPSBbNDY1LCA1NDNdO1xuLy9NU3BlbGwuaG9yZGVmcm9taGVsbCA9IFszMDQsIDMwM107XG4vL01TcGVsbC5naG9zdFNoaXBBcm1hZGEgPSBbMzM0OCwgMzM0OSwgMzM1MCwgMzM1MSwgMzM1Ml07XG4vL1xuLy9NU3BlbGwudW5pcXVlU3VtbW9uID0ge1xuLy8gICAgMTogIC8qIEJpbmQgSWNlIERldmlsICovIFtcbi8vICAgICAgICAzMDYsIDgyMSwgIDgyMiwgODIzLCA4MjQsIDgyNV0sXG4vLyAgICAyOiAgLyogQmluZCBBcmNoIERldmlsICovIFtcbi8vICAgICAgMzA1LCA4MjYsIDgyNywgODI4LCA4MjldLFxuLy8gICAgMzogIC8qIEJpbmQgSGVsaW9waGFndXMgKi8gW1xuLy8gICAgICAgIDQ5MiwgODE4LCA4MTksIDgyMF0sXG4vLyAgICA0OiAgLyogS2luZyBvZiBFbGVtZW50YWwgRWFydGggKi8gW1xuLy8gICAgICAgIDkwNiwgNDY5XSxcbi8vICAgIDU6ICAvKiBGYXRoZXIgSWxsZWFydGggKi8gW1xuLy8gICAgICAgIDQ3MF0sXG4vLyAgICA2OiAgLyogUXVlZW4gb2YgRWxlbWVudGFsIFdhdGVyICovIFtcbi8vICAgICAgICAzNTksIDkwNywgOTA4XSxcbi8vICAgIDc6ICAvKiBRdWVlbiBvZiBFbGVtZW50YWwgQWlyICovIFtcbi8vICAgICAgICA1NjMsIDkxMSwgOTEyXSxcbi8vICAgIDg6ICAvKiBLaW5nIG9mIEVsZW1lbnRhbCBGaXJlICovIFtcbi8vICAgICAgICA2MzEsIDkxMF0sXG4vLyAgICA5OiAgLyogS2luZyBvZiBCYW5lZmlyZXMgKi8gW1xuLy8gICAgICAgIDkwOV0sXG4vLyAgICAxMDogIC8qIEJpbmQgRGVtb24gTG9yZCAqLyBbXG4vLyAgICAgICAgNDQ2LCA4MTAsIDkwMCwgMTQwNSwgMjI3NywgMjI3OF0sXG4vLyAgICAxMTogIC8qIEF3YWtlbiBUcmVlbG9yZCAqLyBbXG4vLyAgICAgICAgNjIxLCA5ODAsIDk4MV0sXG4vLyAgICAxMjogIC8qIENhbGwgQW1lc2hhIFNwZW50YSAqLyBbXG4vLyAgICAgICAgMTM3NSwgMTM3NiwgMTM3NywgMTQ5MiwgMTQ5MywgMTQ5NF0sXG4vLyAgICAxMzogIC8qIFN1bW1vbiBUbGFsb3F1ZSAqLyBbXG4vLyAgICAgICAgMTQ4NCwgMTQ4NSwgMTQ4NiwgMTQ4N10sXG4vLyAgICAxNDogIC8qIFJlbGVhc2UgTG9yZCBvZiBDaXZpbGl6YXRpb24gKi8gW1xuLy8gICAgICAgIDIwNjMsIDIwNjUsIDIwNjYsIDIwNjcsIDIwNjQsIDIwNjJdLFxuLy8gICAgMTU6ICAvKiBVbmtub3duICovIFtcbi8vICAgICAgICBdLFxuLy8gICAgICAgICAxNjogIC8qIEdyZWF0ZXIgRGFldmEgKi8gW1xuLy8gICAgICAgICAgICAgMjYxMiwgMjYxMywgMjYxNCwgMjYxNSwgMjYxNiwgMjYxN10sXG4vLyAgICAgICAgIDE3OiAgLyogQmFsYW0gKi8gW1xuLy8gICAgICAgICAgICAgMjc2NSwgMjc2OCwgMjc3MSwgMjc3NF0sXG4vLyAgICAgICAgICAxODogIC8qIENoYWFjICovIFtcbi8vICAgICAgICAgICAgICAyNzc4LCAyNzc5LCAyNzgwLCAyNzgxXSxcbi8vICAgICAgICAgIDE5OiAgLyogU2FuZ3VpbmUgSGVyaXRhZ2UgKi8gW1xuLy8gICAgICAgICAgIDEwMTksIDEwMzUsIDMyNDQsIDMyNDUsIDMyNTEsIDMyNTIsIDMyNTMsIDMyNTVdLFxuLy8gICAgICAgICAgMjA6ICAvKiBNYW5kZWhhICovIFtcbi8vICAgICAgICAgICAxNzQ4LCAzNjM1LCAzNjM2XVxuLy99XG4vL1xuLy9NU3BlbGwudGVycmFpblN1bW1vbiA9IHtcbi8vICAgIDE6IC8qIEhpZGRlbiBpbiBTbm93ICovIFtcbi8vICAgICAgMTIwMSwgMTIwMCwgMTIwMiwgMTIwM10sXG4vLyAgICAyOiAvKiBIaWRkZW4gaW4gU2FuZCAqLyBbXG4vLyAgICAgIDE5NzksIDE5NzgsIDE5ODAsIDE5ODFdLFxuLy8gICAgMzogLyogSGlkZGVuIFVuZGVybmVhdGggKi9cbi8vICAgICAgWzI1MjIsIDI1MjMsIDI1MjQsIDI1MjVdXG4vL31cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxJQUFNLFlBQVk7QUFFWCxTQUFTLGFBQ2QsR0FDQSxPQUNBLFVBQ29CO0FBQ3BCLFFBQU0sUUFBUSxFQUFFLE1BQU0sR0FBRztBQUN6QixNQUFJLE1BQU0sU0FBUztBQUFHLFVBQU0sSUFBSSxNQUFNLGFBQWEsQ0FBQyxxQkFBcUI7QUFDekUsUUFBTSxRQUE0QixDQUFDO0FBQ25DLGFBQVcsS0FBSyxPQUFPO0FBQ3JCLFVBQU0sQ0FBQyxHQUFHLFdBQVcs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O0FBQUE7QUFBQSxNQUVwQjtBQUFBLE1BQVU7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUN4QztBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUTtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUTtBQUFBO0FBQUEsTUFHaEQ7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQzdDO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUM3QztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFDN0M7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBO0FBQUEsTUFHN0M7QUFBQTtBQUFBLE1BRUE7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELGFBQWE7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1B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QUFNLENBQUM7QUFBRyxZQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxFQUMvRCxPQUFPO0FBQ0wsUUFBSSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ3JDO0FBQ0EsTUFBSSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7QUFDakMsUUFBTSxJQUFJLElBQUk7QUFDZCxRQUFNLElBQUssT0FBTyxTQUFVLE9BQU8sQ0FBQyxNQUFNLFFBQVEsRUFBRSxPQUFPLFNBQVMsU0FDbkUsRUFBRSxPQUFPLE9BQU8sTUFBTSxHQUFHLEVBQUU7QUFDNUIsZ0JBQWMsR0FBRyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7QUFhdkM7QUFFQSxTQUFTLGNBQ1AsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0E7QUFDQSxVQUFRLElBQUk7QUFBQSxPQUFVLENBQUMsR0FBRztBQUMxQixJQUFFLE9BQU8sTUFBTSxLQUFLO0FBQ3BCLFVBQVEsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDckMsUUFBTSxPQUFPLEVBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdEMsTUFBSTtBQUFNLGVBQVcsS0FBSztBQUFNLGNBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNqRCxVQUFRLElBQUksUUFBUSxDQUFDO0FBQUE7QUFBQSxDQUFNO0FBQzdCO0FBSUEsUUFBUSxJQUFJLFFBQVEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVwQyxJQUFJO0FBQU0sVUFBUSxJQUFJO0FBQUE7QUFDakIsVUFBUTsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImYiXQp9Cg==
