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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9qb2luLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2VyaWFsaXplLnRzIiwgIi4uLy4uL2xpYi9zcmMvY29sdW1uLnRzIiwgIi4uLy4uL2xpYi9zcmMvdXRpbC50cyIsICIuLi8uLi9saWIvc3JjL3NjaGVtYS50cyIsICIuLi8uLi9saWIvc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9jbGkvY3N2LWRlZnMudHMiLCAiLi4vc3JjL2NsaS9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL2NsaS9kdW1wLWNzdnMudHMiLCAiLi4vc3JjL2NsaS9qb2luLXRhYmxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuXG5jb25zdCBKT0lOX1BBUlQgPSAvXlxccyooXFx3KylcXHMqXFxbXFxzKihcXHcrKVxccypcXF1cXHMqJC9cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbiAoXG4gIHM6IHN0cmluZyxcbiAgdGFibGU/OiBUYWJsZSxcbiAgdGFibGVNYXA/OiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT5cbik6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnKycpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogbm90IGVub3VnaCBqb2luc2ApO1xuICBjb25zdCBqb2luczogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIGZvciAoY29uc3QgcCBvZiBwYXJ0cykge1xuICAgIGNvbnN0IFtfLCB0YWJsZU5hbWUsIGNvbHVtbk5hbWVdID0gcC5tYXRjaChKT0lOX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRVtDT0xdXCJgKTtcblxuICAgIGpvaW5zLnB1c2goW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0pO1xuICB9XG4gIGlmICh0YWJsZU1hcCkgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB2YWxpZGF0ZUpvaW4oaiwgdGFibGUhLCB0YWJsZU1hcCk7XG4gIHJldHVybiBqb2lucztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVKb2luIChcbiAgam9pbjogW3N0cmluZywgc3RyaW5nXSxcbiAgdGFibGU6IFRhYmxlLFxuICB0YWJsZU1hcDogUmVjb3JkPHN0cmluZywgVGFibGU+XG4pIHtcbiAgY29uc3QgW3RhYmxlTmFtZSwgY29sdW1uTmFtZV0gPSBqb2luO1xuICBjb25zdCBzID0gYCR7dGFibGVOYW1lfVske2NvbHVtbk5hbWV9XWBcbiAgY29uc3QgY29sID0gdGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbY29sdW1uTmFtZV07XG4gIGlmICghY29sKVxuICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gXCIke3N9XCI6IFwiJHt0YWJsZS5uYW1lfVwiIGhhcyBubyBcIiR7Y29sdW1uTmFtZX1cImApO1xuICBjb25zdCBqVGFibGUgPSB0YWJsZU1hcFt0YWJsZU5hbWVdO1xuICBpZiAoIWpUYWJsZSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7dGFibGVOYW1lfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gIGNvbnN0IGpDb2wgPSBqVGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbalRhYmxlLnNjaGVtYS5rZXldO1xuICBpZiAoIWpDb2wpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3RhYmxlTmFtZX1cIiBoYXMgbm8ga2V5Pz8/P2ApO1xuICBpZiAoakNvbC50eXBlICE9PSBjb2wudHlwZSlcbiAgICAvL3Rocm93IG5ldyBFcnJvcigpXG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYGlmZnkgam9pbiBcIiR7XG4gICAgICAgIHNcbiAgICAgIH1cIjogXCIke1xuICAgICAgICBjb2x1bW5OYW1lXG4gICAgICB9XCIgKCR7XG4gICAgICAgIGNvbC5sYWJlbFxuICAgICAgfSkgaXMgYSBkaWZmZXJlbnQgdHlwZSB0aGFuICR7XG4gICAgICAgIHRhYmxlTmFtZVxuICAgICAgfS4ke1xuICAgICAgICBqQ29sLm5hbWVcbiAgICAgIH0gKCR7XG4gICAgICAgIGpDb2wubGFiZWxcbiAgICAgIH0pYFxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luVG9TdHJpbmcgKGpvaW5zOiBbc3RyaW5nLCBzdHJpbmddW10pIHtcbiAgcmV0dXJuIGpvaW5zLm1hcCgoW3QsIGNdKSA9PiBgJHt0fVske2N9XWApLmpvaW4oJyArICcpXG59XG5cbmNvbnN0IEpPSU5FRF9QQVJUID0gL14oXFx3KylcXC4oXFx3KykkLztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbmVkQnkgKFxuICBzOiBzdHJpbmcsXG4pOiBbc3RyaW5nLCBzdHJpbmddW10ge1xuICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJywnKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA8IDEpIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW5lZEJ5IGRvZXNudCBleGlzdD9gKTtcbiAgY29uc3Qgam9pbmVkQnk6IFtzdHJpbmcsIHN0cmluZ11bXSA9IFtdO1xuICBmb3IgKGNvbnN0IHAgb2YgcGFydHMpIHtcbiAgICBjb25zdCBbXywgdGFibGVOYW1lLCBjb2x1bW5OYW1lXSA9IHAubWF0Y2goSk9JTkVEX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRS5DT0xcImApO1xuXG4gICAgam9pbmVkQnkucHVzaChbdGFibGVOYW1lLCBjb2x1bW5OYW1lXSk7XG4gIH1cbiAgcmV0dXJuIGpvaW5lZEJ5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbmVkQnlUb1N0cmluZyAoam9pbnM6IFtzdHJpbmcsIHN0cmluZ11bXSkge1xuICByZXR1cm4gam9pbnMubWFwKChbdCwgY10pID0+IGAke3R9LiR7Y31gKS5qb2luKCcsJylcbn1cbiIsICJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICAvLyBXT09QU0lFXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDhuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCAgICAgICA9IDAsXG4gIFNUUklORyAgICAgICA9IDEsXG4gIEJPT0wgICAgICAgICA9IDIsXG4gIFU4ICAgICAgICAgICA9IDMsXG4gIEk4ICAgICAgICAgICA9IDQsXG4gIFUxNiAgICAgICAgICA9IDUsXG4gIEkxNiAgICAgICAgICA9IDYsXG4gIFUzMiAgICAgICAgICA9IDcsXG4gIEkzMiAgICAgICAgICA9IDgsXG4gIEJJRyAgICAgICAgICA9IDksXG4gIFNUUklOR19BUlJBWSA9IDE3LFxuICBVOF9BUlJBWSAgICAgPSAxOSxcbiAgSThfQVJSQVkgICAgID0gMjAsXG4gIFUxNl9BUlJBWSAgICA9IDIxLFxuICBJMTZfQVJSQVkgICAgPSAyMixcbiAgVTMyX0FSUkFZICAgID0gMjMsXG4gIEkzMl9BUlJBWSAgICA9IDI0LFxuICBCSUdfQVJSQVkgICAgPSAyNSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HX0FSUkFZJyxcbiAgJ1U4X0FSUkFZJyxcbiAgJ0k4X0FSUkFZJyxcbiAgJ1UxNl9BUlJBWScsXG4gICdJMTZfQVJSQVknLFxuICAnVTMyX0FSUkFZJyxcbiAgJ0kzMl9BUlJBWScsXG4gICdCSUdfQVJSQVknLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgfENPTFVNTi5VOF9BUlJBWVxuICB8Q09MVU1OLkk4X0FSUkFZXG4gIHxDT0xVTU4uVTE2X0FSUkFZXG4gIHxDT0xVTU4uSTE2X0FSUkFZXG4gIHxDT0xVTU4uVTMyX0FSUkFZXG4gIHxDT0xVTU4uSTMyX0FSUkFZXG4gIDtcblxuY29uc3QgQ09MVU1OX1dJRFRIOiBSZWNvcmQ8TlVNRVJJQ19DT0xVTU4sIDF8Mnw0PiA9IHtcbiAgW0NPTFVNTi5VOF06IDEsXG4gIFtDT0xVTU4uSThdOiAxLFxuICBbQ09MVU1OLlUxNl06IDIsXG4gIFtDT0xVTU4uSTE2XTogMixcbiAgW0NPTFVNTi5VMzJdOiA0LFxuICBbQ09MVU1OLkkzMl06IDQsXG4gIFtDT0xVTU4uVThfQVJSQVldOiAxLFxuICBbQ09MVU1OLkk4X0FSUkFZXTogMSxcbiAgW0NPTFVNTi5VMTZfQVJSQVldOiAyLFxuICBbQ09MVU1OLkkxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uVTMyX0FSUkFZXTogNCxcbiAgW0NPTFVNTi5JMzJfQVJSQVldOiA0LFxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvTnVtZXJpY1R5cGUgKFxuICBtaW46IG51bWJlcixcbiAgbWF4OiBudW1iZXJcbik6IE5VTUVSSUNfQ09MVU1OfG51bGwge1xuICBpZiAobWluIDwgMCkge1xuICAgIC8vIHNvbWUga2luZGEgbmVnYXRpdmU/P1xuICAgIGlmIChtaW4gPj0gLTEyOCAmJiBtYXggPD0gMTI3KSB7XG4gICAgICAvLyBzaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5JODtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMzI3NjggJiYgbWF4IDw9IDMyNzY3KSB7XG4gICAgICAvLyBzaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uSTE2O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0yMTQ3NDgzNjQ4ICYmIG1heCA8PSAyMTQ3NDgzNjQ3KSB7XG4gICAgICAvLyBzaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5JMzI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChtYXggPD0gMjU1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLlU4O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDY1NTM1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5VMTY7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNDI5NDk2NzI5NSkge1xuICAgICAgLy8gdW5zaWduZWQgbG9uZ1xuICAgICAgcmV0dXJuIENPTFVNTi5VMzI7XG4gICAgfVxuICB9XG4gIC8vIEdPVE86IEJJR09PT09PT09PQk9PT09PWU9cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc051bWVyaWNDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgTlVNRVJJQ19DT0xVTU4ge1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcgfCBDT0xVTU4uQklHX0FSUkFZIHtcbiAgcmV0dXJuICh0eXBlICYgMTUpID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5TVFJJTkc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvbHVtbjxUID0gYW55LCBSIGV4dGVuZHMgVWludDhBcnJheXxudW1iZXIgPSBhbnk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUW107XG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogVDtcbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVFtdLCBudW1iZXJdO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogVCk6IFIsXG4gIHNlcmlhbGl6ZUFycmF5ICh2OiBUW10pOiBSLFxuICB0b1N0cmluZyAodjogc3RyaW5nKTogYW55O1xuICByZWFkb25seSB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICByZWFkb25seSBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXJ8bnVsbDtcbiAgcmVhZG9ubHkgb3JkZXI6IG51bWJlcjtcbiAgcmVhZG9ubHkgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48c3RyaW5nLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgfCBDT0xVTU4uU1RSSU5HX0FSUkFZO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihgc2VlbXMgb3ZlcnJpZGUgZm9yICR7bmFtZX0gZG9lcyBub3QgcmV0dXJuIGEgc3RyaW5nYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmlzQXJyYXkgPSAodGhpcy50eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IHN0cmluZyB7XG4gICAgLy8gVE9ETyAtIG5lZWQgdG8gdmVyaWZ5IHRoZXJlIGFyZW4ndCBhbnkgc2luZ2xlIHF1b3Rlcz9cbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIHJldHVybiB2O1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmdbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IHN0cmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgc3RyaW5ncy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW3N0cmluZ3MsIHJlYWRdXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogc3RyaW5nW10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uc3RyaW5nVG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlcltdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/ICggdGhpcy5vdmVycmlkZSh2LCB1LCBhKSApIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXJbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IG51bWJlcnM6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgICAgIG51bWJlcnMucHVzaChzKTtcbiAgICAgIGkgKz0gcjtcbiAgICAgIHJlYWQgKz0gcjtcbiAgICB9XG4gICAgcmV0dXJuIFtudW1iZXJzLCByZWFkXTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgICBpZiAodGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2ltIGFycmF5IHRobycpXG4gICAgICByZXR1cm4gdGhpcy5udW1iZXJGcm9tVmlldyhpLCB2aWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgbnVtYmVyRnJvbVZpZXcgKGk6IG51bWJlciwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSAmIDE1KSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignd2hvbXN0Jyk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICB0aGlzLnB1dEJ5dGVzKHYsIDAsIGJ5dGVzKTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBudW1iZXJbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMSArIHRoaXMud2lkdGggKiB2Lmxlbmd0aClcbiAgICBsZXQgaSA9IDE7XG4gICAgZm9yIChjb25zdCBuIG9mIHYpIHtcbiAgICAgIGJ5dGVzWzBdKys7XG4gICAgICB0aGlzLnB1dEJ5dGVzKG4sIGksIGJ5dGVzKTtcbiAgICAgIGkrPXRoaXMud2lkdGg7XG4gICAgfVxuICAgIC8vIHNlZW1zIGxpa2UgdGhlcmUgc2hvdWxkIGJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzP1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHByaXZhdGUgcHV0Qnl0ZXModjogbnVtYmVyLCBpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tpICsgb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVlcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW47XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzQmlnQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIHRoaXMudHlwZSA9IHR5cGVcbiAgICB0aGlzLmlzQXJyYXkgPSAodHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuXG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICB9XG5cbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludFtdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIC8vIFRPRE8gLSBhcnJheSBzZXBhcmF0b3IgYXJnIVxuICAgIHJldHVybiB2LnNwbGl0KCcsJykubWFwKGkgPT4gdGhpcy5mcm9tVGV4dChpLnRyaW0oKSwgdSwgYSkpO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnRbXSwgbnVtYmVyXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGJ5dGVzW2krK107XG4gICAgbGV0IHJlYWQgPSAxO1xuICAgIGNvbnN0IGJpZ2JvaXM6IGJpZ2ludFtdID0gW107XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsZW5ndGg7IG4rKykge1xuICAgICAgY29uc3QgW3MsIHJdID0gdGhpcy5mcm9tQnl0ZXMoaSwgYnl0ZXMpO1xuICAgICAgYmlnYm9pcy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW2JpZ2JvaXMsIHJlYWRdO1xuXG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkodjogYmlnaW50W10pOiBVaW50OEFycmF5IHtcbiAgICBpZiAodi5sZW5ndGggPiAyNTUpIHRocm93IG5ldyBFcnJvcigndG9vIGJpZyEnKTtcbiAgICBjb25zdCBpdGVtcyA9IFswXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHYubGVuZ3RoOyBpKyspIGl0ZW1zLnB1c2goLi4uYmlnQm95VG9CeXRlcyh2W2ldKSk7XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMgQklHP1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpdGVtcyk7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuID0gZmFsc2U7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYm9vbGApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbmV2ZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJIE5FVkVSIEFSUkFZJykgLy8geWV0fj9cbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKF9pOiBudW1iZXIsIF9ieXRlczogVWludDhBcnJheSk6IFtuZXZlcltdLCBudW1iZXJdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgLy8gLi4uLml0IGRpZCBub3QuXG4gICAgLy9jb25zb2xlLmxvZyhgUkVBRCBGUk9NICR7aX06IERPRVMgJHtieXRlc1tpXX0gPT09ICR7dGhpcy5mbGFnfWApO1xuICAgIHJldHVybiBbKGJ5dGVzW2ldICYgdGhpcy5mbGFnKSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG5cbiAgc2VyaWFsaXplQXJyYXkoX3Y6IGJvb2xlYW5bXSk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2kgd2lsbCBORVZFUiBiZWNvbWUgQVJSQVknKTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIGlmIChhLmlzQXJyYXkgIT09IGIuaXNBcnJheSkgcmV0dXJuIGEuaXNBcnJheSA/IDEgOiAtMVxuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbiAgZGF0YTogc3RyaW5nW11bXSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGU6IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdIGFzIHVuZGVmaW5lZCB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSksXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBzY2hlbWFBcmdzLmZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCAoZmllbGQuYml0ICUgOCk7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIGZpZWxkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UeXBlIChcbiAgbmFtZTogc3RyaW5nLFxuICB0eXBlOiBDT0xVTU4sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MsXG4pOiBDb2x1bW5BcmdzIHtcbiAgY29uc3Qgb3ZlcnJpZGUgPSBzY2hlbWFBcmdzLm92ZXJyaWRlc1tuYW1lXTtcbiAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvdyB5b3UgZ29ubmEgdXNlIGl0IHRoZW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGNvbnN0IGJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgICAgY29uc3QgZmxhZyA9IDEgPDwgKGJpdCAlIDgpO1xuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIGZsYWcsIGJpdCwgb3ZlcnJpZGUgfTtcblxuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiAxLCBvdmVycmlkZSB9O1xuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDIsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogNCwgb3ZlcnJpZGV9O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHt0eXBlfWApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlICYgMTUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIGlmIChhcmdzLnR5cGUgJiAxNikgdGhyb3cgbmV3IEVycm9yKCdubyBzdWNoIHRoaW5nIGFzIGEgZmxhZyBhcnJheScpO1xuICAgICAgcmV0dXJuIG5ldyBCb29sQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiBuZXcgTnVtZXJpY0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4gbmV3IEJpZ0NvbHVtbihhcmdzKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7YXJncy50eXBlfWApO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBqb2luVG9TdHJpbmcsIGpvaW5lZEJ5VG9TdHJpbmcsIHN0cmluZ1RvSm9pbiwgc3RyaW5nVG9Kb2luZWRCeSB9IGZyb20gJy4vam9pbic7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAga2V5OiBzdHJpbmc7XG4gIGpvaW5zPzogc3RyaW5nO1xuICBqb2luZWRCeT86IHN0cmluZztcbiAgY29sdW1uczogQ29sdW1uW10sXG4gIGZpZWxkczogc3RyaW5nW10sXG4gIGZsYWdzVXNlZDogbnVtYmVyO1xuICByYXdGaWVsZHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIG92ZXJyaWRlczogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IFtdKSA9PiBhbnk+XG59XG5cbnR5cGUgQmxvYlBhcnQgPSBhbnk7IC8vID8/Pz8/XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGpvaW5zPzogW3N0cmluZywgc3RyaW5nXVtdO1xuICByZWFkb25seSBqb2luZWRCeTogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG4gIHJlYWRvbmx5IGtleTogc3RyaW5nO1xuICByZWFkb25seSBjb2x1bW5zQnlOYW1lOiBSZWNvcmQ8c3RyaW5nLCBDb2x1bW4+O1xuICByZWFkb25seSBmaXhlZFdpZHRoOiBudW1iZXI7IC8vIHRvdGFsIGJ5dGVzIHVzZWQgYnkgbnVtYmVycyArIGZsYWdzXG4gIHJlYWRvbmx5IGZsYWdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RyaW5nRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpZ0ZpZWxkczogbnVtYmVyO1xuICBjb25zdHJ1Y3Rvcih7IGNvbHVtbnMsIG5hbWUsIGZsYWdzVXNlZCwga2V5LCBqb2lucywgam9pbmVkQnkgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArICgoIWMuaXNBcnJheSAmJiBjLndpZHRoKSB8fCAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgaWYgKGpvaW5zKSB0aGlzLmpvaW5zID0gc3RyaW5nVG9Kb2luKGpvaW5zKTtcbiAgICBpZiAoam9pbmVkQnkpIHRoaXMuam9pbmVkQnkucHVzaCguLi5zdHJpbmdUb0pvaW5lZEJ5KGpvaW5lZEJ5KSk7XG5cbiAgICBsZXQgbzogbnVtYmVyfG51bGwgPSAwO1xuICAgIGxldCBmID0gdHJ1ZTtcbiAgICBsZXQgYiA9IGZhbHNlO1xuICAgIGxldCBmZiA9IDA7XG4gICAgZm9yIChjb25zdCBbaSwgY10gb2YgdGhpcy5jb2x1bW5zLmVudHJpZXMoKSkge1xuICAgICAgbGV0IE9DID0gLTE7XG4gICAgICAvL2lmIChjLnR5cGUgJiAxNikgYnJlYWs7XG4gICAgICBzd2l0Y2ggKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VOF9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHX0FSUkFZOlxuICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICBpZiAobyA+IDApIHtcbiAgICAgICAgICAgICAgY29uc3QgZHNvID0gTWF0aC5tYXgoMCwgaSAtIDIpXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5uYW1lLCBpLCBvLCBgRFNPOiR7ZHNvfS4uJHtpICsgMn06YCwgY29sdW1ucy5zbGljZShNYXRoLm1heCgwLCBpIC0gMiksIGkgKyAyKSk7XG4gICAgICAgICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Nob3VsZCBub3QgYmUhJylcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGIpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ35+fn5+IEJPT0wgVElNRVMgRE9ORSB+fn5+ficpO1xuICAgICAgICAgICAgYiA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGZmICE9PSB0aGlzLmZsYWdGaWVsZHMpIHRocm93IG5ldyBFcnJvcignYm9vb09TQUFTT0FPJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgaWYgKCFmKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Nob3VsZCBiZSEnKVxuICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMsIG8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWIpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ35+fn5+IEJPT0wgVElNRVMgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZmICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb28nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgT0MgPSBvO1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjLm9mZnNldCA9IG87IGMuYml0ID0gZmYrKzsgYy5mbGFnID0gMiAqKiAoYy5iaXQgJSA4KTsgLy8gaGVoZWhlXG4gICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4KSBvKys7XG4gICAgICAgICAgaWYgKGMuYml0ICsgMSA9PT0gdGhpcy5mbGFnRmllbGRzKSB7XG4gICAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggJiYgbyAhPT0gdGhpcy5maXhlZFdpZHRoKSB0aHJvdyBuZXcgRXJyb3IoJ1dIVVBPU0lFJylcbiAgICAgICAgICAgIGlmIChjLmZsYWcgPCAxMjggJiYgbyAhPT0gdGhpcy5maXhlZFdpZHRoIC0gMSkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRSAtIDEnKVxuICAgICAgICAgICAgZiA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgT0MgPSBvO1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjLm9mZnNldCA9IG87XG4gICAgICAgICAgaWYgKCFjLndpZHRoKSBkZWJ1Z2dlcjtcbiAgICAgICAgICBvICs9IGMud2lkdGghO1xuICAgICAgICAgIGlmIChvID09PSB0aGlzLmZpeGVkV2lkdGgpIGYgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIC8vY29uc3Qgcm5nID0gT0MgPCAwID8gYGAgOiBgICR7T0N9Li4ke299IC8gJHt0aGlzLmZpeGVkV2lkdGh9YFxuICAgICAgLy9jb25zb2xlLmxvZyhgWyR7aX1dJHtybmd9YCwgYy5uYW1lLCBjLmxhYmVsKVxuICAgIH1cbiAgICB0aGlzLnN0cmluZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNTdHJpbmdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuICAgIHRoaXMuYmlnRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc0JpZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG5cbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogU2NoZW1hIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlYWQ6IG51bWJlcjtcbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGxldCBrZXk6IHN0cmluZztcbiAgICBsZXQgam9pbnM6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgbGV0IGpvaW5lZEJ5OiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2tleSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5zLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBbam9pbmVkQnksIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIGNvbnNvbGUubG9nKCctIEJVSCcsIG5hbWUsIGtleSwgam9pbnMsIGpvaW5lZEJ5KVxuICAgIGlmICgham9pbnMpIGpvaW5zID0gdW5kZWZpbmVkO1xuICAgIGlmICgham9pbmVkQnkpIGpvaW5lZEJ5ID0gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAga2V5LFxuICAgICAgam9pbnMsXG4gICAgICBqb2luZWRCeSxcbiAgICAgIGNvbHVtbnM6IFtdIGFzIENvbHVtbltdLFxuICAgICAgZmllbGRzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIGZsYWdzVXNlZDogMCxcbiAgICAgIHJhd0ZpZWxkczoge30sIC8vIG5vbmUgOjxcbiAgICAgIG92ZXJyaWRlczoge30sIC8vIG5vbmV+XG4gICAgfTtcblxuICAgIGNvbnN0IG51bUZpZWxkcyA9IGJ5dGVzW2krK10gfCAoYnl0ZXNbaSsrXSA8PCA4KTtcblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgLy8gVE9ETyAtIG9ubHkgd29ya3Mgd2hlbiAwLWZpZWxkIHNjaGVtYXMgYXJlbid0IGFsbG93ZWR+IVxuICAgIHdoaWxlIChpbmRleCA8IG51bUZpZWxkcykge1xuICAgICAgY29uc3QgdHlwZSA9IGJ5dGVzW2krK107XG4gICAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICAgIGNvbnN0IGYgPSB7XG4gICAgICAgIGluZGV4LCBuYW1lLCB0eXBlLFxuICAgICAgICB3aWR0aDogbnVsbCwgYml0OiBudWxsLCBmbGFnOiBudWxsLFxuICAgICAgICBvcmRlcjogOTk5XG4gICAgICB9O1xuICAgICAgaSArPSByZWFkO1xuICAgICAgbGV0IGM6IENvbHVtbjtcblxuICAgICAgc3dpdGNoICh0eXBlICYgMTUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICAgIGMgPSBuZXcgU3RyaW5nQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICAgIGMgPSBuZXcgQmlnQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBjb25zdCBiaXQgPSBhcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSAyICoqIChiaXQgJSA4KTtcbiAgICAgICAgICBjID0gbmV3IEJvb2xDb2x1bW4oeyAuLi5mLCBiaXQsIGZsYWcgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDIgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiA0IH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0eXBlICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICAgIGFyZ3MuY29sdW1ucy5wdXNoKGMpO1xuICAgICAgYXJncy5maWVsZHMucHVzaChjLm5hbWUpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTY2hlbWEoYXJncyk7XG4gIH1cblxuICByb3dGcm9tQnVmZmVyKFxuICAgICAgaTogbnVtYmVyLFxuICAgICAgYnVmZmVyOiBBcnJheUJ1ZmZlcixcbiAgICAgIF9fcm93SWQ6IG51bWJlclxuICApOiBbUm93LCBudW1iZXJdIHtcbiAgICBjb25zdCBkYnIgPSBfX3Jvd0lkIDwgNSB8fCBfX3Jvd0lkID4gMzk3NSB8fCBfX3Jvd0lkICUgMTAwMCA9PT0gMDtcbiAgICAvL2lmIChkYnIpIGNvbnNvbGUubG9nKGAgLSBST1cgJHtfX3Jvd0lkfSBGUk9NICR7aX0gKDB4JHtpLnRvU3RyaW5nKDE2KX0pYClcbiAgICBsZXQgdG90YWxSZWFkID0gMDtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICAgIGNvbnN0IHJvdzogUm93ID0geyBfX3Jvd0lkIH1cbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcblxuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIC8vaWYgKGMub2Zmc2V0ICYmIGMub2Zmc2V0ICE9PSB0b3RhbFJlYWQpIHsgZGVidWdnZXI7IGNvbnNvbGUubG9nKCd3b29wc2llJyk7IH1cbiAgICAgIGxldCBbdiwgcmVhZF0gPSBjLmlzQXJyYXkgP1xuICAgICAgICBjLmFycmF5RnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KSA6XG4gICAgICAgIGMuZnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KTtcblxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpXG4gICAgICAgIHJlYWQgPSAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpID8gMSA6IDA7XG5cbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIHRvdGFsUmVhZCArPSByZWFkO1xuICAgICAgLy8gZG9uJ3QgcHV0IGZhbHN5IHZhbHVlcyBvbiBmaW5hbCBvYmplY3RzLiBtYXkgcmV2aXNpdCBob3cgdGhpcyB3b3JrcyBsYXRlclxuICAgICAgLy9pZiAoYy5pc0FycmF5IHx8IHYpIHJvd1tjLm5hbWVdID0gdjtcbiAgICAgIHJvd1tjLm5hbWVdID0gdjtcbiAgICAgIC8vY29uc3QgdyA9IGdsb2JhbFRoaXMuX1JPV1NbdGhpcy5uYW1lXVtfX3Jvd0lkXVtjLm5hbWVdIC8vIHNycyBiaXpcbiAgICAgIC8qXG4gICAgICBpZiAodyAhPT0gdikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodykgfHwgdy5zb21lKChuLCBpKSA9PiBuICE9PSB2W2ldKSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFhYWFhYICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gLT4gJHt2fWApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5lcnJvcihgX19fX18gJHt0aGlzLm5hbWV9WyR7X19yb3dJZH1dWyR7Yy5uYW1lfV0gJHt3fSA9PSAke3Z9YClcbiAgICAgIH1cbiAgICAgICovXG4gICAgfVxuICAgIC8vaWYgKGRicikge1xuICAgICAgLy9jb25zb2xlLmxvZyhgICAgUkVBRDogJHt0b3RhbFJlYWR9IFRPICR7aX0gLyAke2J1ZmZlci5ieXRlTGVuZ3RofVxcbmAsIHJvdywgJ1xcblxcbicpO1xuICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAvL31cbiAgICByZXR1cm4gW3JvdywgdG90YWxSZWFkXTtcbiAgfVxuXG4gIHByaW50Um93IChyOiBSb3csIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+KSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKSk7XG4gIH1cblxuICBzZXJpYWxpemVIZWFkZXIgKCk6IEJsb2Ige1xuICAgIC8vIFsuLi5uYW1lLCAwLCBudW1GaWVsZHMwLCBudW1GaWVsZHMxLCBmaWVsZDBUeXBlLCBmaWVsZDBGbGFnPywgLi4uZmllbGQwTmFtZSwgMCwgZXRjXTtcbiAgICAvLyBUT0RPIC0gQmFzZSB1bml0IGhhcyA1MDArIGZpZWxkc1xuICAgIGlmICh0aGlzLmNvbHVtbnMubGVuZ3RoID4gNjU1MzUpIHRocm93IG5ldyBFcnJvcignb2ggYnVkZHkuLi4nKTtcbiAgICBjb25zdCBwYXJ0cyA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKSxcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5rZXkpLFxuICAgICAgLi4udGhpcy5zZXJpYWxpemVKb2lucygpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUpvaW5zICgpIHtcbiAgICBsZXQgaiA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGxldCBqYiA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIGlmICh0aGlzLmpvaW5zKSBqID0gc3RyaW5nVG9CeXRlcyhqb2luVG9TdHJpbmcodGhpcy5qb2lucykpO1xuICAgIGlmICh0aGlzLmpvaW5lZEJ5KSBqYiA9IHN0cmluZ1RvQnl0ZXMoam9pbmVkQnlUb1N0cmluZyh0aGlzLmpvaW5lZEJ5KSk7XG4gICAgcmV0dXJuIFsuLi5qLCAuLi5qYl07XG4gIH1cblxuICBzZXJpYWxpemVSb3cgKHI6IFJvdyk6IEJsb2Ige1xuICAgIGNvbnN0IGZpeGVkID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5maXhlZFdpZHRoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgY29uc3QgYmxvYlBhcnRzOiBCbG9iUGFydFtdID0gW2ZpeGVkXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB2ID0gcltjLm5hbWVdXG4gICAgICAgIGlmIChjLmlzQXJyYXkpIHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVBcnJheSh2IGFzIGFueVtdKVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgc3RyaW5nKVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG4gICAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBiaWdpbnQpXG4gICAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgICAgfSBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgICAgLy8gZG9udCBuZWVkIHRvIGNoZWNrIGZvciB0aGUgbGFzdCBmbGFnIHNpbmNlIHdlIG5vIGxvbmdlciBuZWVkIGlcbiAgICAgICAgICAgIC8vIGFmdGVyIHdlJ3JlIGRvbmUgd2l0aCBudW1iZXJzIGFuZCBib29sZWFuc1xuICAgICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAgIC8vIC4uLmJ1dCB3ZSB3aWxsIGJlY2F1eXNlIHdlIGJyb2tlIHNvbWV0aGlnblxuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSBpKys7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICAgIGNvbnN0IGJ5dGVzID0gYy5zZXJpYWxpemVSb3codiBhcyBudW1iZXIpXG4gICAgICAgICAgICBmaXhlZC5zZXQoYnl0ZXMsIGkpXG4gICAgICAgICAgICBpICs9IGMud2lkdGghO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKGMpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHsoYyBhcyBhbnkpLnR5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdHT09CRVIgQ09MVU1OOicsIGMpO1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIFJPVzonLCByKTtcbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9pZiAoci5fX3Jvd0lkIDwgNSB8fCByLl9fcm93SWQgPiAzOTc1IHx8IHIuX19yb3dJZCAlIDEwMDAgPT09IDApIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAtIFJPVyAke3IuX19yb3dJZH1gLCB7IGksIGJsb2JQYXJ0cywgciB9KTtcbiAgICAvL31cbiAgICByZXR1cm4gbmV3IEJsb2IoYmxvYlBhcnRzKTtcbiAgfVxuXG4gIHByaW50ICh3aWR0aCA9IDgwKTogdm9pZCB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDM2KTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zdCB7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0gPSB0aGlzO1xuICAgIGNvbnNvbGUubG9nKHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSk7XG4gICAgY29uc29sZS50YWJsZSh0aGlzLmNvbHVtbnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdsYWJlbCcsXG4gICAgICAnb2Zmc2V0JyxcbiAgICAgICdvcmRlcicsXG4gICAgICAnYml0JyxcbiAgICAgICd0eXBlJyxcbiAgICAgICdmbGFnJyxcbiAgICAgICd3aWR0aCcsXG4gICAgXSk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG5cbiAgfVxuXG4gIC8vIHJhd1RvUm93IChkOiBSYXdSb3cpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7fVxuICAvLyByYXdUb1N0cmluZyAoZDogUmF3Um93LCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7fVxufTtcblxuIiwgImltcG9ydCB7IHZhbGlkYXRlSm9pbiB9IGZyb20gJy4vam9pbic7XG5pbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuZXhwb3J0IHR5cGUgUm93RGF0YSA9IGFueTsgLy8gZm1sXG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBSb3dEYXRhPiAmIHsgX19yb3dJZDogbnVtYmVyIH07XG5cbnR5cGUgVGFibGVCbG9iID0geyBudW1Sb3dzOiBudW1iZXIsIGhlYWRlckJsb2I6IEJsb2IsIGRhdGFCbG9iOiBCbG9iIH07XG5cbmV4cG9ydCBjbGFzcyBUYWJsZSB7XG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEubmFtZSB9XG4gIGdldCBrZXkgKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNjaGVtYS5rZXkgfVxuICByZWFkb25seSBtYXA6IE1hcDxhbnksIGFueT4gPSBuZXcgTWFwKClcbiAgY29uc3RydWN0b3IgKFxuICAgIHJlYWRvbmx5IHJvd3M6IFJvd1tdLFxuICAgIHJlYWRvbmx5IHNjaGVtYTogU2NoZW1hLFxuICApIHtcbiAgICBjb25zdCBrZXlOYW1lID0gdGhpcy5rZXk7XG4gICAgaWYgKGtleU5hbWUgIT09ICdfX3Jvd0lkJykgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSB7XG4gICAgICBjb25zdCBrZXkgPSByb3dba2V5TmFtZV07XG4gICAgICBpZiAodGhpcy5tYXAuaGFzKGtleSkpIHRocm93IG5ldyBFcnJvcigna2V5IGlzIG5vdCB1bmlxdWUnKTtcbiAgICAgIHRoaXMubWFwLnNldChrZXksIHJvdyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFwcGx5TGF0ZUpvaW5zIChcbiAgICBqdDogVGFibGUsXG4gICAgdGFibGVzOiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT4sXG4gICAgYWRkRGF0YTogYm9vbGVhblxuICApOiBUYWJsZSB7XG4gICAgY29uc3Qgam9pbnMgPSBqdC5zY2hlbWEuam9pbnM7XG5cbiAgICBpZiAoIWpvaW5zKSB0aHJvdyBuZXcgRXJyb3IoJ3NoaXQgYXNzIGlkaXRvdCB3aG9tc3QnKTtcbiAgICBmb3IgKGNvbnN0IGogb2Ygam9pbnMpIHtcbiAgICAgIHZhbGlkYXRlSm9pbihqLCBqdCwgdGFibGVzKTtcbiAgICAgIGNvbnN0IFt0biwgY25dID0gajtcbiAgICAgIGNvbnN0IHQgPSB0YWJsZXNbdG5dO1xuICAgICAgY29uc3QgamIgPSB0LnNjaGVtYS5qb2luZWRCeTtcbiAgICAgIGlmIChqYi5zb21lKChbamJ0biwgXSkgPT4gamJ0biA9PT0gdG4pKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dG59IGFscmVhZHkgam9pbmVkICR7an1gKVxuICAgICAgamIucHVzaChbanQuc2NoZW1hLm5hbWUsIGNuXSk7XG4gICAgfVxuXG4gICAgaWYgKGFkZERhdGEpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ0FQUExZSU5HJylcbiAgICAgIGZvciAoY29uc3QgciBvZiBqdC5yb3dzKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJy0gSk9JTicsIHIpXG4gICAgICAgIGZvciAoY29uc3QgW3RuLCBjbl0gb2YganQuc2NoZW1hLmpvaW5zKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnICAtJywgdG4sICdPTicsIGNuKTtcbiAgICAgICAgICBjb25zdCBqciA9IHRhYmxlc1t0bl0ubWFwLmdldChyW2NuXSk7XG4gICAgICAgICAgaWYgKCFqcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBNSVNTRUQgQSBKT0lOICR7dG59WyR7Y259XTogTk9USElORyBUSEVSRWAsIHIpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChqcltqdC5uYW1lXSkganJbanQubmFtZV0ucHVzaChyKTtcbiAgICAgICAgICBlbHNlIGpyW2p0Lm5hbWVdID0gW3JdO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJyAgPicsIGpyLmlkLCBqci5uYW1lLCBqclt0bl0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKFxuICAgICAgICAvL2p0LnNjaGVtYS5uYW1lLFxuICAgICAgICAvL3RhYmxlcy5NYWdpY1NpdGUucm93cy5maWx0ZXIociA9PiByW2p0LnNjaGVtYS5uYW1lXSlcbiAgICAgICAgLy9bLi4udGFibGVzLk1hZ2ljU2l0ZS5tYXAudmFsdWVzKCldLmZpbmQociA9PiByWydTaXRlQnlOYXRpb24nXSlcbiAgICAgIC8vKVxuICAgIH1cblxuICAgIHJldHVybiBqdDtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmVUYWJsZSAodGFibGU6IFRhYmxlLCBsaXN0PzogVGFibGVbXSwgbWFwPzogUmVjb3JkPHN0cmluZywgVGFibGU+KSB7XG4gICAgaWYgKGxpc3QpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKHRhYmxlKTtcbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihgdGFibGUgJHt0YWJsZS5uYW1lfSBpcyBub3QgaW4gdGhlIGxpc3RgKTtcbiAgICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICBpZiAobWFwKSB7XG4gICAgICBpZiAodGFibGUubmFtZSBpbiBtYXApIGRlbGV0ZSBtYXBbdGFibGUubmFtZV07XG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihgdGFibGUgJHt0YWJsZS5uYW1lfSBpcyBub3QgaW4gdGhlIG1hcGApO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogW1VpbnQzMkFycmF5LCBCbG9iLCBCbG9iXSB7XG4gICAgLy8gW251bVJvd3MsIGhlYWRlclNpemUsIGRhdGFTaXplXSwgc2NoZW1hSGVhZGVyLCBbcm93MCwgcm93MSwgLi4uIHJvd05dO1xuICAgIGNvbnN0IHNjaGVtYUhlYWRlciA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZUhlYWRlcigpO1xuICAgIC8vIGNhbnQgZmlndXJlIG91dCBob3cgdG8gZG8gdGhpcyB3aXRoIGJpdHMgOic8XG4gICAgY29uc3Qgc2NoZW1hUGFkZGluZyA9ICg0IC0gc2NoZW1hSGVhZGVyLnNpemUgJSA0KSAlIDQ7XG4gICAgY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpKTtcblxuICAgIC8vY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4ge1xuICAgICAgLy9jb25zdCByb3dCbG9iID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpXG4gICAgICAvL2lmIChyLl9fcm93SWQgPT09IDApXG4gICAgICAgIC8vcm93QmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oYWIgPT4ge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coYEFSUkFZIEJVRkZFUiBGT1IgRklSU1QgUk9XIE9GICR7dGhpcy5uYW1lfWAsIG5ldyBVaW50OEFycmF5KGFiKS5qb2luKCcsICcpKTtcbiAgICAgICAgLy99KTtcbiAgICAgIC8vcmV0dXJuIHJvd0Jsb2I7XG4gICAgLy99KTtcbiAgICBjb25zdCByb3dCbG9iID0gbmV3IEJsb2Iocm93RGF0YSlcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93QmxvYi5zaXplICUgNCkgJSA0O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBVaW50MzJBcnJheShbXG4gICAgICAgIHRoaXMucm93cy5sZW5ndGgsXG4gICAgICAgIHNjaGVtYUhlYWRlci5zaXplICsgc2NoZW1hUGFkZGluZyxcbiAgICAgICAgcm93QmxvYi5zaXplICsgZGF0YVBhZGRpbmdcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICBzY2hlbWFIZWFkZXIsXG4gICAgICAgIG5ldyBBcnJheUJ1ZmZlcihzY2hlbWFQYWRkaW5nKSBhcyBhbnkgLy8gPz8/XG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgcm93QmxvYixcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZGF0YVBhZGRpbmcpXG4gICAgICBdKSxcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGNvbmNhdFRhYmxlcyAodGFibGVzOiBUYWJsZVtdKTogQmxvYiB7XG4gICAgY29uc3QgYWxsU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoMSArIHRhYmxlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCBhbGxIZWFkZXJzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBhbGxEYXRhOiBCbG9iW10gPSBbXTtcblxuICAgIGNvbnN0IGJsb2JzID0gdGFibGVzLm1hcCh0ID0+IHQuc2VyaWFsaXplKCkpO1xuICAgIGFsbFNpemVzWzBdID0gYmxvYnMubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgW2ksIFtzaXplcywgaGVhZGVycywgZGF0YV1dIG9mIGJsb2JzLmVudHJpZXMoKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgT1VUIEJMT0JTIEZPUiBUPSR7aX1gLCBzaXplcywgaGVhZGVycywgZGF0YSlcbiAgICAgIGFsbFNpemVzLnNldChzaXplcywgMSArIGkgKiAzKTtcbiAgICAgIGFsbEhlYWRlcnMucHVzaChoZWFkZXJzKTtcbiAgICAgIGFsbERhdGEucHVzaChkYXRhKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIGNvbnN0IHRhYmxlTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlcy5tYXAodCA9PiBbdC5zY2hlbWEubmFtZSwgdF0pKTtcblxuICAgIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIHtcbiAgICAgIGlmICghdC5zY2hlbWEuam9pbnMpIGNvbnRpbnVlO1xuICAgICAgZm9yIChjb25zdCBbYVQsIGFGXSBvZiB0LnNjaGVtYS5qb2lucykge1xuICAgICAgICBjb25zdCB0QSA9IHRhYmxlTWFwW2FUXTtcbiAgICAgICAgaWYgKCF0QSkgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YVR9YCk7XG4gICAgICAgIGlmICghdC5yb3dzLmxlbmd0aCkgY29udGludWU7IC8vIGVtcHR5IHRhYmxlIGkgZ3Vlc3M/XG4gICAgICAgIGZvciAoY29uc3QgciBvZiB0LnJvd3MpIHtcbiAgICAgICAgICBjb25zdCBpZEEgPSByW2FGXTtcbiAgICAgICAgICBpZiAoaWRBID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBiYWQgaWQ/YCwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYSA9IHRBLm1hcC5nZXQoaWRBKTtcbiAgICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByb3cgaGFzIGEgbWlzc2luZyBpZD9gLCBhLCBpZEEsIHIpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIChhW3QubmFtZV0gPz89IFtdKS5wdXNoKHIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZU1hcDtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmcm9tQmxvYiAoe1xuICAgIGhlYWRlckJsb2IsXG4gICAgZGF0YUJsb2IsXG4gICAgbnVtUm93cyxcbiAgfTogVGFibGVCbG9iKTogUHJvbWlzZTxUYWJsZT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IFNjaGVtYS5mcm9tQnVmZmVyKGF3YWl0IGhlYWRlckJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgbGV0IHJibyA9IDA7XG4gICAgbGV0IF9fcm93SWQgPSAwO1xuICAgIGNvbnN0IHJvd3M6IFJvd1tdID0gW107XG4gICAgLy8gVE9ETyAtIGNvdWxkIGRlZmluaXRlbHkgdXNlIGEgc3RyZWFtIGZvciB0aGlzXG4gICAgY29uc3QgZGF0YUJ1ZmZlciA9IGF3YWl0IGRhdGFCbG9iLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc29sZS5sb2coYD09PT09IFJFQUQgJHtudW1Sb3dzfSBPRiAke3NjaGVtYS5uYW1lfSA9PT09PWApXG4gICAgd2hpbGUgKF9fcm93SWQgPCBudW1Sb3dzKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgcmJvICs9IHJlYWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xuICB9XG5cblxuICBwcmludCAoXG4gICAgd2lkdGg6IG51bWJlciA9IDgwLFxuICAgIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+fG51bGwgPSBudWxsLFxuICAgIG46IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBtOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgcD86IChyOiBhbnkpID0+IGJvb2xlYW4sXG4gICk6IG51bGx8YW55W10ge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAxOCk7XG4gICAgY29uc3Qgcm93cyA9IHAgPyB0aGlzLnJvd3MuZmlsdGVyKHApIDpcbiAgICAgIG4gPT09IG51bGwgPyB0aGlzLnJvd3MgOlxuICAgICAgbSA9PT0gbnVsbCA/IHRoaXMucm93cy5zbGljZSgwLCBuKSA6XG4gICAgICB0aGlzLnJvd3Muc2xpY2UobiwgbSk7XG5cblxuICAgIGxldCBtRmllbGRzID0gQXJyYXkuZnJvbSgoZmllbGRzID8/IHRoaXMuc2NoZW1hLmZpZWxkcykpO1xuICAgIGlmIChwKSBbbiwgbV0gPSBbMCwgcm93cy5sZW5ndGhdXG4gICAgZWxzZSAobUZpZWxkcyBhcyBhbnkpLnVuc2hpZnQoJ19fcm93SWQnKTtcblxuICAgIGNvbnN0IFtwUm93cywgcEZpZWxkc10gPSBmaWVsZHMgP1xuICAgICAgW3Jvd3MubWFwKChyOiBSb3cpID0+IHRoaXMuc2NoZW1hLnByaW50Um93KHIsIG1GaWVsZHMpKSwgZmllbGRzXTpcbiAgICAgIFtyb3dzLCB0aGlzLnNjaGVtYS5maWVsZHNdXG4gICAgICA7XG5cbiAgICBjb25zb2xlLmxvZygncm93IGZpbHRlcjonLCBwID8/ICcobm9uZSknKVxuICAgIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnNvbGUudGFibGUocFJvd3MsIHBGaWVsZHMpO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuICAgIHJldHVybiAocCAmJiBmaWVsZHMpID9cbiAgICAgIHJvd3MubWFwKHIgPT5cbiAgICAgICAgT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pLmZpbHRlcihlID0+IGVbMV0pKVxuICAgICAgKSA6XG4gICAgICBudWxsO1xuICB9XG5cbiAgZHVtcFJvdyAoaTogbnVtYmVyfG51bGwsIHNob3dFbXB0eSA9IGZhbHNlLCB1c2VDU1M/OiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgIC8vIFRPRE8gXHUyMDE0IGluIGJyb3dzZXIsIHVzZUNTUyA9PT0gdHJ1ZSBieSBkZWZhdWx0XG4gICAgdXNlQ1NTID8/PSAoZ2xvYmFsVGhpc1snd2luZG93J10gPT09IGdsb2JhbFRoaXMpOyAvLyBpZGtcbiAgICBpID8/PSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0aGlzLnJvd3MubGVuZ3RoKTtcbiAgICBjb25zdCByb3cgPSB0aGlzLnJvd3NbaV07XG4gICAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGNzczogc3RyaW5nW118bnVsbCA9IHVzZUNTUyA/IFtdIDogbnVsbDtcbiAgICBjb25zdCBmbXQgPSBmbXRTdHlsZWQuYmluZChudWxsLCBvdXQsIGNzcyk7XG4gICAgY29uc3QgcCA9IE1hdGgubWF4KFxuICAgICAgLi4udGhpcy5zY2hlbWEuY29sdW1uc1xuICAgICAgLmZpbHRlcihjID0+IHNob3dFbXB0eSB8fCByb3dbYy5uYW1lXSlcbiAgICAgIC5tYXAoYyA9PiBjLm5hbWUubGVuZ3RoICsgMilcbiAgICApO1xuICAgIGlmICghcm93KVxuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV0gZG9lcyBub3QgZXhpc3RgLCBDX05PVF9GT1VORCk7XG4gICAgZWxzZSB7XG4gICAgICBmbXQoYCVjJHt0aGlzLnNjaGVtYS5uYW1lfVske2l9XWAsIENfUk9XX0hFQUQpO1xuICAgICAgZm9yIChjb25zdCBjIG9mIHRoaXMuc2NoZW1hLmNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbYy5uYW1lXTtcbiAgICAgICAgY29uc3QgbiA9IGMubmFtZS5wYWRTdGFydChwLCAnICcpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjVFJVRWAsIENfVFJVRSlcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06ICVjRkFMU0VgLCBDX05PVF9GT1VORCwgQ19GQUxTRSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX05VTUJFUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IDBgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYCR7bn06ICVjJHt2YWx1ZX1gLCBDX1NUUilcbiAgICAgICAgICAgIGVsc2UgaWYgKHNob3dFbXB0eSkgZm10KGAlYyR7bn06IFx1MjAxNGAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2JpZ2ludCc6XG4gICAgICAgICAgICBpZiAodmFsdWUpIGZtdChge259OiAlYzAgJWMke3ZhbHVlfSAoQklHKWAsIENfQklHLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwIChCSUcpYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHVzZUNTUykgcmV0dXJuIFtvdXQuam9pbignXFxuJyksIC4uLmNzcyFdO1xuICAgIGVsc2UgcmV0dXJuIFtvdXQuam9pbignXFxuJyldO1xuICB9XG5cbiAgZmluZFJvdyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4sIHN0YXJ0ID0gMCk6IG51bWJlciB7XG4gICAgY29uc3QgTiA9IHRoaXMucm93cy5sZW5ndGhcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IE4gLSBzdGFydDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBOOyBpKyspIGlmIChwcmVkaWNhdGUodGhpcy5yb3dzW2ldKSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgKiBmaWx0ZXJSb3dzIChwcmVkaWNhdGU6IChyb3c6IFJvdykgPT4gYm9vbGVhbik6IEdlbmVyYXRvcjxSb3c+IHtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIGlmIChwcmVkaWNhdGUocm93KSkgeWllbGQgcm93O1xuICB9XG4gIC8qXG4gIHJhd1RvUm93IChkOiBzdHJpbmdbXSk6IFJvdyB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNjaGVtYS5jb2x1bW5zLm1hcChyID0+IFtcbiAgICAgIHIubmFtZSxcbiAgICAgIHIudG9WYWwoZFtyLmluZGV4XSlcbiAgICBdKSk7XG4gIH1cbiAgcmF3VG9TdHJpbmcgKGQ6IHN0cmluZ1tdLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgLy8ganVzdCBhc3N1bWUgZmlyc3QgdHdvIGZpZWxkcyBhcmUgYWx3YXlzIGlkLCBuYW1lLiBldmVuIGlmIHRoYXQncyBub3QgdHJ1ZVxuICAgIC8vIHRoaXMgaXMganVzdCBmb3IgdmlzdWFsaXphdGlvbiBwdXJwb3JzZXNcbiAgICBsZXQgZXh0cmEgPSAnJztcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHM6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBlID0gdGhpcy5yYXdUb1JvdyhkKTtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBhcmdzKSB7XG4gICAgICAgIC8vIGRvbid0IHJlcHJpbnQgbmFtZSBvciBpZFxuICAgICAgICBpZiAoYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzBdIHx8IGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1sxXSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKGVbYV0gIT0gbnVsbClcbiAgICAgICAgICBzLnB1c2goYCR7YX06ICR7SlNPTi5zdHJpbmdpZnkoZVthXSl9YClcbiAgICAgIH1cbiAgICAgIGV4dHJhID0gcy5sZW5ndGggPiAwID8gYCB7ICR7cy5qb2luKCcsICcpfSB9YCA6ICd7fSc7XG4gICAgfVxuICAgIHJldHVybiBgPCR7dGhpcy5zY2hlbWEubmFtZX06JHtkWzBdID8/ICc/J30gXCIke2RbMV19XCIke2V4dHJhfT5gO1xuICB9XG4gICovXG59XG5cbmZ1bmN0aW9uIGZtdFN0eWxlZCAoXG4gIG91dDogc3RyaW5nW10sXG4gIGNzc091dDogc3RyaW5nW10gfCBudWxsLFxuICBtc2c6IHN0cmluZyxcbiAgLi4uY3NzOiBzdHJpbmdbXVxuKSB7XG4gIGlmIChjc3NPdXQpIHtcbiAgICBvdXQucHVzaChtc2cgKyAnJWMnKVxuICAgIGNzc091dC5wdXNoKC4uLmNzcywgQ19SRVNFVCk7XG4gIH1cbiAgZWxzZSBvdXQucHVzaChtc2cucmVwbGFjZSgvJWMvZywgJycpKTtcbn1cblxuY29uc3QgQ19OT1RfRk9VTkQgPSAnY29sb3I6ICM4ODg7IGZvbnQtc3R5bGU6IGl0YWxpYzsnO1xuY29uc3QgQ19ST1dfSEVBRCA9ICdmb250LXdlaWdodDogYm9sZGVyJztcbmNvbnN0IENfQk9MRCA9ICdmb250LXdlaWdodDogYm9sZCc7XG5jb25zdCBDX05VTUJFUiA9ICdjb2xvcjogI0EwNTUxODsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfVFJVRSA9ICdjb2xvcjogIzRDMzhCRTsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfRkFMU0UgPSAnY29sb3I6ICMzOEJFMUM7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1NUUiA9ICdjb2xvcjogIzMwQUE2MjsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfQklHID0gJ2NvbG9yOiAjNzgyMUEzOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19SRVNFVCA9ICdjb2xvcjogdW5zZXQ7IGZvbnQtc3R5bGU6IHVuc2V0OyBmb250LXdlaWdodDogdW5zZXQ7IGJhY2tncm91bmQtdW5zZXQnXG4iLCAiaW1wb3J0IHsgQ09MVU1OLCBTY2hlbWFBcmdzIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgdHlwZSB7IFBhcnNlU2NoZW1hT3B0aW9ucyB9IGZyb20gJy4vcGFyc2UtY3N2J1xuZXhwb3J0IGNvbnN0IGNzdkRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4gPSB7XG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlVS5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXQnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoW1xuICAgICAgLy8gY29tYmluZWQgaW50byBhbiBhcnJheSBmaWVsZFxuICAgICAgJ2FybW9yMScsICdhcm1vcjInLCAnYXJtb3IzJywgJ2FybW9yNCcsICdlbmQnLFxuICAgICAgJ3dwbjEnLCAnd3BuMicsICd3cG4zJywgJ3dwbjQnLCAnd3BuNScsICd3cG42JywgJ3dwbjcnLFxuXG4gICAgICAvLyBhbGwgY29tYmluZWQgaW50byBvbmUgYXJyYXkgZmllbGRcbiAgICAgICdsaW5rMScsICdsaW5rMicsICdsaW5rMycsICdsaW5rNCcsICdsaW5rNScsICdsaW5rNicsXG4gICAgICAnbWFzazEnLCAnbWFzazInLCAnbWFzazMnLCAnbWFzazQnLCAnbWFzazUnLCAnbWFzazYnLFxuICAgICAgJ25icjEnLCAgJ25icjInLCAgJ25icjMnLCAgJ25icjQnLCAgJ25icjUnLCAgJ25icjYnLFxuICAgICAgJ3JhbmQxJywgJ3JhbmQyJywgJ3JhbmQzJywgJ3JhbmQ0JywgJ3JhbmQ1JywgJ3JhbmQ2JyxcblxuICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICAgJ21vdW50ZWQnLFxuICAgICAgLy8gcmVkdW5kYW50XG4gICAgICAncmVhbmltYXRvcn4xJyxcbiAgICBdKSxcbiAgICBrbm93bkZpZWxkczoge1xuICAgICAgaWQ6IENPTFVNTi5VMTYsXG4gICAgICBuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgcnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlY2xpbWl0OiBDT0xVTU4uSTgsXG4gICAgICBiYXNlY29zdDogQ09MVU1OLlUxNixcbiAgICAgIHJjb3N0OiBDT0xVTU4uSTgsXG4gICAgICBzaXplOiBDT0xVTU4uVTgsXG4gICAgICByZXNzaXplOiBDT0xVTU4uVTgsXG4gICAgICBocDogQ09MVU1OLlUxNixcbiAgICAgIHByb3Q6IENPTFVNTi5VOCxcbiAgICAgIG1yOiBDT0xVTU4uVTgsXG4gICAgICBtb3I6IENPTFVNTi5VOCxcbiAgICAgIHN0cjogQ09MVU1OLlU4LFxuICAgICAgYXR0OiBDT0xVTU4uVTgsXG4gICAgICBkZWY6IENPTFVNTi5VOCxcbiAgICAgIHByZWM6IENPTFVNTi5VOCxcbiAgICAgIGVuYzogQ09MVU1OLlU4LFxuICAgICAgbWFwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgYXA6IENPTFVNTi5VOCxcbiAgICAgIGFtYmlkZXh0cm91czogQ09MVU1OLlU4LFxuICAgICAgbW91bnRtbnI6IENPTFVNTi5VMTYsXG4gICAgICBza2lsbGVkcmlkZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlaW52aWdvcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHVuZGVhZGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgbWF4YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgaGFuZDogQ09MVU1OLlU4LFxuICAgICAgaGVhZDogQ09MVU1OLlU4LFxuICAgICAgbWlzYzogQ09MVU1OLlU4LFxuICAgICAgcGF0aGNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0ZG9tOiBDT0xVTU4uVTgsXG4gICAgICBib251c3NwZWxsczogQ09MVU1OLlU4LFxuICAgICAgRjogQ09MVU1OLlU4LFxuICAgICAgQTogQ09MVU1OLlU4LFxuICAgICAgVzogQ09MVU1OLlU4LFxuICAgICAgRTogQ09MVU1OLlU4LFxuICAgICAgUzogQ09MVU1OLlU4LFxuICAgICAgRDogQ09MVU1OLlU4LFxuICAgICAgTjogQ09MVU1OLlU4LFxuICAgICAgRzogQ09MVU1OLlU4LFxuICAgICAgQjogQ09MVU1OLlU4LFxuICAgICAgSDogQ09MVU1OLlU4LFxuICAgICAgc2FpbGluZ3NoaXBzaXplOiBDT0xVTU4uVTE2LFxuICAgICAgc2FpbGluZ21heHVuaXRzaXplOiBDT0xVTU4uVTgsXG4gICAgICBzdGVhbHRoeTogQ09MVU1OLlU4LFxuICAgICAgcGF0aWVuY2U6IENPTFVNTi5VOCxcbiAgICAgIHNlZHVjZTogQ09MVU1OLlU4LFxuICAgICAgc3VjY3VidXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnJ1cHQ6IENPTFVNTi5VOCxcbiAgICAgIGhvbWVzaWNrOiBDT0xVTU4uVTgsXG4gICAgICBmb3JtYXRpb25maWdodGVyOiBDT0xVTU4uSTgsXG4gICAgICBzdGFuZGFyZDogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyYXRpb25hbDogQ09MVU1OLkk4LFxuICAgICAgdGFza21hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYmVhc3RtYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJvZHlndWFyZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJicmVhdGhpbmc6IENPTFVNTi5VMTYsXG4gICAgICBpY2Vwcm90OiBDT0xVTU4uVTgsXG4gICAgICBpbnZ1bG5lcmFibGU6IENPTFVNTi5VOCxcbiAgICAgIHNob2NrcmVzOiBDT0xVTU4uSTgsXG4gICAgICBmaXJlcmVzOiBDT0xVTU4uSTgsXG4gICAgICBjb2xkcmVzOiBDT0xVTU4uSTgsXG4gICAgICBwb2lzb25yZXM6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHZvaWRzYW5pdHk6IENPTFVNTi5VOCxcbiAgICAgIGRhcmt2aXNpb246IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hbGF3ZTogQ09MVU1OLlU4LFxuICAgICAgYXdlOiBDT0xVTU4uVTgsXG4gICAgICBoYWx0aGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZmVhcjogQ09MVU1OLlU4LFxuICAgICAgYmVyc2VyazogQ09MVU1OLlU4LFxuICAgICAgY29sZDogQ09MVU1OLlU4LFxuICAgICAgaGVhdDogQ09MVU1OLlU4LFxuICAgICAgZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgYmFuZWZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGRhbWFnZXJldjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIGRpc2Vhc2VjbG91ZDogQ09MVU1OLlU4LFxuICAgICAgc2xpbWVyOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kc2xpbWU6IENPTFVNTi5VMTYsXG4gICAgICByZWdlbmVyYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmFybW9yOiBDT0xVTU4uVTgsXG4gICAgICBleWVsb3NzOiBDT0xVTU4uVTgsXG4gICAgICBldGh0cnVlOiBDT0xVTU4uVTgsXG4gICAgICBzdG9ybXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNvbGRwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZGFya3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICB3aW50ZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3ByaW5ncG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1lcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmYWxscG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZvcmdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGZpeGZvcmdlYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIG1hc3RlcnNtaXRoOiBDT0xVTU4uSTgsXG4gICAgICByZXNvdXJjZXM6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9oZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9kaXNoZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIG5vYmFkZXZlbnRzOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmU6IENPTFVNTi5VOCxcbiAgICAgIHNoYXR0ZXJlZHNvdWw6IENPTFVNTi5VOCxcbiAgICAgIGxlcGVyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3JlYzogQ09MVU1OLlU4LFxuICAgICAgcGlsbGFnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBwYXRyb2xib251czogQ09MVU1OLkk4LFxuICAgICAgY2FzdGxlZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzaWVnZWJvbnVzOiBDT0xVTU4uSTE2LFxuICAgICAgaW5jcHJvdmRlZjogQ09MVU1OLlU4LFxuICAgICAgc3VwcGx5Ym9udXM6IENPTFVNTi5VOCxcbiAgICAgIGluY3VucmVzdDogQ09MVU1OLkkxNixcbiAgICAgIHBvcGtpbGw6IENPTFVNTi5VMTYsXG4gICAgICByZXNlYXJjaGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJpbmdyZXM6IENPTFVNTi5JOCxcbiAgICAgIGRvdXNlOiBDT0xVTU4uVTgsXG4gICAgICBhZGVwdHNhY3I6IENPTFVNTi5VOCxcbiAgICAgIGNyb3NzYnJlZWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFrZXBlYXJsczogQ09MVU1OLlU4LFxuICAgICAgdm9pZHN1bTogQ09MVU1OLlU4LFxuICAgICAgaGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZWxlZ2lzdDogQ09MVU1OLlU4LFxuICAgICAgc2hhcGVjaGFuZ2U6IENPTFVNTi5VMTYsXG4gICAgICBmaXJzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2Vjb25kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBsYW5kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB3YXRlcnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgZm9yZXN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBwbGFpbnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgeHBzaGFwZTogQ09MVU1OLlU4LFxuICAgICAgbmFtZXR5cGU6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjogQ09MVU1OLkkxNixcbiAgICAgIG5fc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTE6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjA6IENPTFVNTi5JMTYsXG4gICAgICBibG9vZHZlbmdlYW5jZTogQ09MVU1OLlU4LFxuICAgICAgYnJpbmdlcm9mZm9ydHVuZTogQ09MVU1OLkk4LFxuICAgICAgcmVhbG0xOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTM6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTQ6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTFkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0zZDY6IENPTFVNTi5JMTYsXG4gICAgICBiYXRzdGFydHN1bTRkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNWQ2OiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTZkNjogQ09MVU1OLlUxNixcbiAgICAgIHR1cm1vaWxzdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aGZpcmU6IENPTFVNTi5VOCxcbiAgICAgIHV3cmVnZW46IENPTFVNTi5VOCxcbiAgICAgIHNocmlua2hwOiBDT0xVTU4uVTgsXG4gICAgICBncm93aHA6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aW5nYWZmOiBDT0xVTU4uVTMyLFxuICAgICAgZml4ZWRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgbGFtaWFsb3JkOiBDT0xVTU4uVTgsXG4gICAgICBwcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgZHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIG11bW1pZnk6IENPTFVNTi5VMTYsXG4gICAgICBvbmViYXR0bGVzcGVsbDogQ09MVU1OLlU4LFxuICAgICAgZmlyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFpcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIHdhdGVyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZWFydGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RGOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFc6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RFOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0UzogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEQ6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3ROOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QUxMOiBDT0xVTU4uSTgsXG4gICAgICBleWVzOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VlYXRlcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uc2tpbjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpdGVtOiBDT0xVTU4uVTgsXG4gICAgICBiYXR0bGVzdW01OiBDT0xVTU4uVTE2LFxuICAgICAgYWNpZHNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgcHJvcGhldHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgaG9ycm9yOiBDT0xVTU4uVTgsXG4gICAgICBsYXRlaGVybzogQ09MVU1OLlU4LFxuICAgICAgdXdkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIGxhbmRkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIHJwY29zdDogQ09MVU1OLlUzMixcbiAgICAgIHJhbmQ1OiBDT0xVTU4uVTgsXG4gICAgICBuYnI1OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmQ2OiBDT0xVTU4uVTgsXG4gICAgICBuYnI2OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNjogQ09MVU1OLlUxNixcbiAgICAgIG11bW1pZmljYXRpb246IENPTFVNTi5VMTYsXG4gICAgICBkaXNlYXNlcmVzOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZW9ua2lsbDogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHNlbmRsZXNzZXJob3Jyb3JtdWx0OiBDT0xVTU4uVTgsXG4gICAgICBpbmNvcnBvcmF0ZTogQ09MVU1OLlU4LFxuICAgICAgYmxlc3NiZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWF0dGFja2VyOiBDT0xVTU4uVTgsXG4gICAgICB1d2hlYXQ6IENPTFVNTi5VOCxcbiAgICAgIHNsb3RocmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcmRlc2VydGVyOiBDT0xVTU4uVTgsXG4gICAgICBzb3JjZXJ5cmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG9sZGVyOiBDT0xVTU4uSTgsXG4gICAgICBkaXNiZWxpZXZlOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbHJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYmVhcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgaG9yc2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHJlaW5jYXJuYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHdvbGZ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGJvYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHNsZWVwYXVyYTogQ09MVU1OLlU4LFxuICAgICAgc25ha2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGFwcGV0aXRlOiBDT0xVTU4uSTgsXG4gICAgICB0ZW1wbGV0cmFpbmVyOiBDT0xVTU4uVTgsXG4gICAgICBpbmZlcm5vcmV0OiBDT0xVTU4uVTgsXG4gICAgICBrb2t5dG9zcmV0OiBDT0xVTU4uVTgsXG4gICAgICBhZGRyYW5kb21hZ2U6IENPTFVNTi5VMTYsXG4gICAgICB1bnN1cnI6IENPTFVNTi5VOCxcbiAgICAgIHNwZWNpYWxsb29rOiBDT0xVTU4uVTgsXG4gICAgICBidWdyZWZvcm06IENPTFVNTi5VOCxcbiAgICAgIG9uaXN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgc3VuYXdlOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGFmZjogQ09MVU1OLlU4LFxuICAgICAgaXZ5bG9yZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2RtYWc6IENPTFVNTi5VOCxcbiAgICAgIGZvcnRraWxsOiBDT0xVTU4uVTgsXG4gICAgICB0aHJvbmVraWxsOiBDT0xVTU4uVTgsXG4gICAgICBkaWdlc3Q6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgZW50YW5nbGU6IENPTFVNTi5VOCxcbiAgICAgIGFsY2hlbXk6IENPTFVNTi5VOCxcbiAgICAgIHdvdW5kZmVuZDogQ09MVU1OLlU4LFxuICAgICAgZmFsc2Vhcm15OiBDT0xVTU4uSTgsXG4gICAgICBzdW1tb241OiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXI6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHBhcmFseXplOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2Vjb25zdHJ1Y3Q6IENPTFVNTi5VOCxcbiAgICAgIGd1YXJkaWFuc3Bpcml0bW9kaWZpZXI6IENPTFVNTi5JOCxcbiAgICAgIGljZWZvcmdpbmc6IENPTFVNTi5VOCxcbiAgICAgIGNsb2Nrd29ya2xvcmQ6IENPTFVNTi5VOCxcbiAgICAgIG1pbnNpemVsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIGlyb252dWw6IENPTFVNTi5VOCxcbiAgICAgIGhlYXRoZW5zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHBvd2Vyb2ZkZWF0aDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtdGltZTogQ09MVU1OLkk4LFxuICAgICAgdHdpY2Vib3JuOiBDT0xVTU4uVTE2LFxuICAgICAgdG1wYXN0cmFsZ2VtczogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRoZXJvYWI6IENPTFVNTi5VOCxcbiAgICAgIHV3ZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgc2FsdHZ1bDogQ09MVU1OLlU4LFxuICAgICAgbGFuZGVuYzogQ09MVU1OLlU4LFxuICAgICAgcGxhZ3VlZG9jdG9yOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWx1Y2tzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGZhcnRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcm1hcms6IENPTFVNTi5VOCxcbiAgICAgIGFsbHJldDogQ09MVU1OLlU4LFxuICAgICAgYWNpZGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgYmVja29uOiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXJib251czogQ09MVU1OLlU4LFxuICAgICAgY2FyY2Fzc2NvbGxlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgbWluZGNvbGxhcjogQ09MVU1OLlU4LFxuICAgICAgbW91bnRhaW5yZWM6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBlbmNocmViYXRlNTA6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjE6IENPTFVNTi5VMTYsXG4gICAgICByYW5kb21zcGVsbDogQ09MVU1OLlU4LFxuICAgICAgaW5zYW5pZnk6IENPTFVNTi5VOCxcbiAgICAgIC8vanVzdCBhIGNvcHkgb2YgcmVhbmltYXRvci4uLlxuICAgICAgLy8ncmVhbmltYXRvcn4xJzogQ09MVU1OLlU4LFxuICAgICAgZGVmZWN0b3I6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgZW5jaHJlYmF0ZTEwOiBDT0xVTU4uVTgsXG4gICAgICB1bmR5aW5nOiBDT0xVTU4uVTgsXG4gICAgICBtb3JhbGVib251czogQ09MVU1OLlU4LFxuICAgICAgdW5jdXJhYmxlYWZmbGljdGlvbjogQ09MVU1OLlUzMixcbiAgICAgIHdpbnRlcnN1bW1vbjFkMzogQ09MVU1OLlUxNixcbiAgICAgIHN0eWdpYW5ndWlkZTogQ09MVU1OLlU4LFxuICAgICAgc21hcnRtb3VudDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtaW5nZmxlc2g6IENPTFVNTi5VOCxcbiAgICAgIGZlYXJvZnRoZWZsb29kOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VzdGl0Y2hlcjogQ09MVU1OLlU4LFxuICAgICAgcmVjb25zdHJ1Y3Rpb246IENPTFVNTi5VOCxcbiAgICAgIG5vZnJpZGVyczogQ09MVU1OLlU4LFxuICAgICAgY29yaWRlcm1ucjogQ09MVU1OLlUxNixcbiAgICAgIGhvbHljb3N0OiBDT0xVTU4uVTgsXG4gICAgICBhbmltYXRlbW5yOiBDT0xVTU4uVTE2LFxuICAgICAgbGljaDogQ09MVU1OLlUxNixcbiAgICAgIGVyYXN0YXJ0YWdlaW5jcmVhc2U6IENPTFVNTi5VMTYsXG4gICAgICBtb3Jlb3JkZXI6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVncm93dGg6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVwcm9kOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlaGVhdDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWx1Y2s6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVtYWdpYzogQ09MVU1OLkk4LFxuICAgICAgbm9mbW91bnRzOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWRhbWFnZXJlY292ZXJ5OiBDT0xVTU4uVTgsXG4gICAgICB1d3BhdGhib29zdDogQ09MVU1OLkk4LFxuICAgICAgcmFuZG9taXRlbXM6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHNsaW1lZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhwb2lzb25leHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHNob2NrZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZHJhd3NpemU6IENPTFVNTi5JOCxcbiAgICAgIHBldHJpZmljYXRpb25pbW11bmU6IENPTFVNTi5VOCxcbiAgICAgIHNjYXJzb3VsczogQ09MVU1OLlU4LFxuICAgICAgc3Bpa2ViYXJiczogQ09MVU1OLlU4LFxuICAgICAgcHJldGVuZGVyc3RhcnRzaXRlOiBDT0xVTU4uVTE2LFxuICAgICAgb2Zmc2NyaXB0cmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIHVubW91bnRlZHNwcjogQ09MVU1OLlUzMixcbiAgICAgIGV4aGF1c3Rpb246IENPTFVNTi5VOCxcbiAgICAgIC8vIG1vdW50ZWQ6IENPTFVNTi5CT09MLCAvLyBkZXByZWNhdGVkXG4gICAgICBib3c6IENPTFVNTi5CT09MLFxuICAgICAgYm9keTogQ09MVU1OLkJPT0wsXG4gICAgICBmb290OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNyb3dub25seTogQ09MVU1OLkJPT0wsXG4gICAgICBob2x5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGlucXVpc2l0b3I6IENPTFVNTi5CT09MLFxuICAgICAgaW5hbmltYXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZW1vbjogQ09MVU1OLkJPT0wsXG4gICAgICBtYWdpY2JlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0b25lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgYW5pbWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBmZW1hbGU6IENPTFVNTi5CT09MLFxuICAgICAgZm9yZXN0c3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRhaW5zdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICB3YXN0ZXN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN3YW1wc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgYXF1YXRpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhbXBoaWJpYW46IENPTFVNTi5CT09MLFxuICAgICAgcG9vcmFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBmbG9hdDogQ09MVU1OLkJPT0wsXG4gICAgICBmbHlpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3Rvcm1pbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgdGVsZXBvcnQ6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb2JpbGU6IENPTFVNTi5CT09MLFxuICAgICAgbm9yaXZlcnBhc3M6IENPTFVNTi5CT09MLFxuICAgICAgaWxsdXNpb246IENPTFVNTi5CT09MLFxuICAgICAgc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzc2Fzc2luOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhlYWw6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgZG9taW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgbm9oZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5lZWRub3RlYXQ6IENPTFVNTi5CT09MLFxuICAgICAgdW5kaXNjaXBsaW5lZDogQ09MVU1OLkJPT0wsXG4gICAgICBzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbGFzaHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibHVudHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBwaWVyY2VyZXM6IENPTFVNTi5CT09MLFxuICAgICAgYmxpbmQ6IENPTFVNTi5CT09MLFxuICAgICAgcGV0cmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICBldGhlcmVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWF0aGN1cnNlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyYW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBzd2FsbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIHRheGNvbGxlY3RvcjogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFpbmltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlxdWU6IENPTFVNTi5CT09MLFxuICAgICAgc2NhbGV3YWxsczogQ09MVU1OLkJPT0wsXG4gICAgICBkaXZpbmVpbnM6IENPTFVNTi5CT09MLFxuICAgICAgaGVhdHJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBjb2xkcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGNoYW9zOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGRlYXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJ1ZzogQ09MVU1OLkJPT0wsXG4gICAgICB1d2J1ZzogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRvcmRlcjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRncm93dGg6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZG9tOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWtlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRoZWZ0b2Z0aGVzdW5hd2U6IENPTFVNTi5CT09MLFxuICAgICAgZHJhZ29ubG9yZDogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5kdmVzc2VsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVsZW1lbnRyYW5nZTogQ09MVU1OLkJPT0wsXG4gICAgICBhc3RyYWxmZXR0ZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbWJhdGNhc3RlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXNpbmdsZXJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBub3dpc2g6IENPTFVNTi5CT09MLFxuICAgICAgbWFzb246IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0c2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgb3duYmxvb2Q6IENPTFVNTi5CT09MLFxuICAgICAgaW52aXNpYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwZWxsc2luZ2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljc3R1ZHk6IENPTFVNTi5CT09MLFxuICAgICAgdW5pZnk6IENPTFVNTi5CT09MLFxuICAgICAgdHJpcGxlM21vbjogQ09MVU1OLkJPT0wsXG4gICAgICB5ZWFydHVybjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnRlbGVwb3J0YWJsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZWFuaW1wcmllc3Q6IENPTFVNTi5CT09MLFxuICAgICAgc3R1bmltbXVuaXR5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHNpbmdsZWJhdHRsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZXNlYXJjaHdpdGhvdXRtYWdpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhdXRvY29tcGV0ZTogQ09MVU1OLkJPT0wsXG4gICAgICBhZHZlbnR1cmVyczogQ09MVU1OLkJPT0wsXG4gICAgICBjbGVhbnNoYXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcWxhYjogQ09MVU1OLkJPT0wsXG4gICAgICByZXF0ZW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgaG9ycm9ybWFya2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYXNoYWg6IENPTFVNTi5CT09MLFxuICAgICAgaXNheWF6YWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhZGFldmE6IENPTFVNTi5CT09MLFxuICAgICAgYmxlc3NmbHk6IENPTFVNTi5CT09MLFxuICAgICAgcGxhbnQ6IENPTFVNTi5CT09MLFxuICAgICAgY29tc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgc25vd21vdmU6IENPTFVNTi5CT09MLFxuICAgICAgc3dpbW1pbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3R1cGlkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNraXJtaXNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgdW5zZWVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vbW92ZXBlbjogQ09MVU1OLkJPT0wsXG4gICAgICB3b2xmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGR1bmdlb246IENPTFVNTi5CT09MLFxuICAgICAgYWJvbGV0aDogQ09MVU1OLkJPT0wsXG4gICAgICBsb2NhbHN1bjogQ09MVU1OLkJPT0wsXG4gICAgICB0bXBmaXJlZ2VtczogQ09MVU1OLkJPT0wsXG4gICAgICBkZWZpbGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50ZWRiZXNlcms6IENPTFVNTi5CT09MLFxuICAgICAgbGFuY2VvazogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5wcmlzb246IENPTFVNTi5CT09MLFxuICAgICAgaHBvdmVyZmxvdzogQ09MVU1OLkJPT0wsXG4gICAgICBpbmRlcHN0YXk6IENPTFVNTi5CT09MLFxuICAgICAgcG9seWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vaG9mOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9ibGVzc2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFsbW9zdHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICB0cnVlc2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgbW9iaWxlYXJjaGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwaXJpdGZvcm06IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzbWFzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRpZ2h0cmVpbjogQ09MVU1OLkJPT0wsXG4gICAgICBnbGFtb3VybWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWJlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vZmFsbGRtZzogQ09MVU1OLkJPT0wsXG4gICAgICBmaXJlZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhdGVyZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBlYXJ0aGVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgcG9wc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNhcGl0YWxob21lOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsdW1zeTogQ09MVU1OLkJPT0wsXG4gICAgICByZWdhaW5tb3VudDogQ09MVU1OLkJPT0wsXG4gICAgICBub2JhcmRpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRpc2NvbTogQ09MVU1OLkJPT0wsXG4gICAgICBub3Rocm93b2ZmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJpcmQ6IENPTFVNTi5CT09MLFxuICAgICAgZGVjYXlyZXM6IENPTFVNTi5CT09MLFxuICAgICAgY3VibW90aGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2VtcHJvZDogQ09MVU1OLlNUUklORyxcbiAgICAgIGZpeGVkbmFtZTogQ09MVU1OLlNUUklORyxcbiAgICB9LFxuICAgIGV4dHJhRmllbGRzOiB7XG4gICAgICB0eXBlOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBzZEluZGV4ID0gYXJncy5yYXdGaWVsZHNbJ3N0YXJ0ZG9tJ107XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3R5cGUnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgLy8gaGF2ZSB0byBmaWxsIGluIG1vcmUgc3R1ZmYgbGF0ZXIsIHdoZW4gd2Ugam9pbiByZWMgdHlwZXMsIG9oIHdlbGxcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzOiBjb21tYW5kZXIsIG1lcmNlbmFyeSwgaGVybywgZXRjXG4gICAgICAgICAgICBpZiAodVtzZEluZGV4XSkgcmV0dXJuIDM7IC8vIGdvZCArIGNvbW1hbmRlclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gMDsgLy8ganVzdCBhIHVuaXRcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ2l0ZW1jb3N0MX4xJywgJ3dhcm5pbmd+MSddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2RvbWNvbmZsaWN0fjEnLCdlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBuZWVkIG11bHRpLWluZGV4XG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgLy8gVE9ETyAtIGdvdCBzb21lIGJpZyBib2lzIGluIGhlcmUuXG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RfbW9kaWZpZXJfYml0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsQml0JyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIG5lZWQgbXVsdGktaW5kZXhcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19pbmZvLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdTcGVsbEVmZmVjdEluZm8nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3NwZWxscy5jc3YnOiB7XG4gICAga2V5OiAncmVjb3JkX2lkJyxcbiAgICBuYW1lOiAnRWZmZWN0U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFdlYXBvbicsXG4gICAga2V5OiAncmVjb3JkX2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lbmNoYW50bWVudHMuY3N2Jzoge1xuICAgIGtleTogJ251bWJlcicsXG4gICAgbmFtZTogJ0VuY2hhbnRtZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZXZlbnRzLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ0V2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hZ2ljX3BhdGhzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ01hZ2ljUGF0aCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hcF90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1RlcnJhaW5UeXBlQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbW9uc3Rlcl90YWdzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ01vbnN0ZXJUYWcnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYW1ldHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnTmFtZVR5cGUnLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmF0aW9ucy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgICBleHRyYUZpZWxkczoge1xuICAgICAgcmVhbG06IChpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3JlYWxtJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICAgICAgd2lkdGg6IDEsXG4gICAgICAgICAgLy8gd2Ugd2lsbCBhc3NpZ24gdGhlc2UgbGF0ZXJcbiAgICAgICAgICBvdmVycmlkZSh2LCB1LCBhKSB7IHJldHVybiAwOyB9LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ05vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvb3RoZXJfcGxhbmVzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdPdGhlclBsYW5lJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcm90ZWN0aW9uc19ieV9hcm1vci5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUHJvdGVjdGlvbkJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3JlYWxtcy5jc3YnOiB7XG4gICAga2V5OiAnX19yb3dJZCcsIC8vIFRPRE8gLSBidWhcbiAgICBuYW1lOiAnUmVhbG0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zaXRlX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgbmFtZTogJ1NpdGVUZXJyYWluVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfZGFtYWdlX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTcGVjaWFsRGFtYWdlVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfdW5pcXVlX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsVW5pcXVlU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbCcsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG59XG5cbmNvbnN0IERFRkFVTFRfT1BUSU9OUzogUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiAnJyxcbiAga2V5OiAnJyxcbiAgaWdub3JlRmllbGRzOiBuZXcgU2V0KCksXG4gIG92ZXJyaWRlczoge30sXG4gIGtub3duRmllbGRzOiB7fSxcbiAgZXh0cmFGaWVsZHM6IHt9LFxuICBzZXBhcmF0b3I6ICdcXHQnLCAvLyBzdXJwcmlzZSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUoXG4gIHJhdzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XG4pOiBUYWJsZSB7XG4gIGNvbnN0IF9vcHRzID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiBfb3B0cy5uYW1lLFxuICAgIGtleTogX29wdHMua2V5LFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBjb2x1bW5zOiBbXSxcbiAgICBmaWVsZHM6IFtdLFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgb3ZlcnJpZGVzOiBfb3B0cy5vdmVycmlkZXMsXG4gIH07XG4gIGlmICghc2NoZW1hQXJncy5uYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ25hbWUgaXMgcmVxdXJpZWQnKTtcbiAgaWYgKCFzY2hlbWFBcmdzLmtleSkgdGhyb3cgbmV3IEVycm9yKCdrZXkgaXMgcmVxdXJpZWQnKTtcblxuICBpZiAocmF3LmluZGV4T2YoJ1xcMCcpICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCd1aCBvaCcpXG5cbiAgY29uc3QgW3Jhd0ZpZWxkcywgLi4ucmF3RGF0YV0gPSByYXdcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KF9vcHRzLnNlcGFyYXRvcikpO1xuXG4gIGNvbnN0IGhDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKCFmKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gXCIke2Z9XCIgaXMgYSBkdXBsaWNhdGUgZmllbGQgbmFtZWApO1xuICAgICAgY29uc3QgbiA9IGhDb3VudC5nZXQoZikhXG4gICAgICByYXdGaWVsZHNbaV0gPSBgJHtmfX4ke259YDtcbiAgICB9IGVsc2Uge1xuICAgICAgaENvdW50LnNldChmLCAxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCByYXdDb2x1bW5zOiBDb2x1bW5BcmdzW10gPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIG5hbWVdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBsZXQgYzogbnVsbCB8IENvbHVtbkFyZ3MgPSBudWxsO1xuICAgIHNjaGVtYUFyZ3MucmF3RmllbGRzW25hbWVdID0gaW5kZXg7XG4gICAgaWYgKF9vcHRzLmlnbm9yZUZpZWxkcz8uaGFzKG5hbWUpKSBjb250aW51ZTtcbiAgICBpZiAoX29wdHMua25vd25GaWVsZHNbbmFtZV0pIHtcbiAgICAgIGMgPSBhcmdzRnJvbVR5cGUoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIF9vcHRzLmtub3duRmllbGRzW25hbWVdLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYyA9IGFyZ3NGcm9tVGV4dChcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICAgICAgcmF3RGF0YSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYEdPT0IgSU5URVJDRVBURUQgSU4gJHtzY2hlbWFBcmdzLm5hbWV9OiBcXHgxYlszMW0ke2luZGV4fToke25hbWV9XFx4MWJbMG1gLFxuICAgICAgICAgICAgZXhcbiAgICAgICAgKTtcbiAgICAgICAgdGhyb3cgZXhcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgcmF3Q29sdW1ucy5wdXNoKGMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zPy5leHRyYUZpZWxkcykge1xuICAgIGNvbnN0IGJpID0gT2JqZWN0LnZhbHVlcyhzY2hlbWFBcmdzLnJhd0ZpZWxkcykubGVuZ3RoOyAvLyBobW1tbVxuICAgIHJhd0NvbHVtbnMucHVzaCguLi5PYmplY3QuZW50cmllcyhvcHRpb25zLmV4dHJhRmllbGRzKS5tYXAoXG4gICAgICAoW25hbWUsIGNyZWF0ZUNvbHVtbl06IFtzdHJpbmcsIENyZWF0ZUV4dHJhRmllbGRdLCBlaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlID0gc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV07XG4gICAgICAgIC8vY29uc29sZS5sb2coZWksIHNjaGVtYUFyZ3MucmF3RmllbGRzKVxuICAgICAgICBjb25zdCBpbmRleCA9IGJpICsgZWk7XG4gICAgICAgIGNvbnN0IGNhID0gY3JlYXRlQ29sdW1uKGluZGV4LCBzY2hlbWFBcmdzLCBuYW1lLCBvdmVycmlkZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGNhLmluZGV4ICE9PSBpbmRleCkgdGhyb3cgbmV3IEVycm9yKCd3aXNlZ3V5IHBpY2tlZCBoaXMgb3duIGluZGV4Jyk7XG4gICAgICAgICAgaWYgKGNhLm5hbWUgIT09IG5hbWUpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBuYW1lJyk7XG4gICAgICAgICAgaWYgKGNhLnR5cGUgPT09IENPTFVNTi5CT09MKSB7XG4gICAgICAgICAgICBpZiAoY2EuYml0ICE9PSBzY2hlbWFBcmdzLmZsYWdzVXNlZCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIGJhYnkgaWRpb3QnKTtcbiAgICAgICAgICAgIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNhLCB7IGluZGV4LCBvdmVycmlkZSwgbmFtZSwgfSlcbiAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2E7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgY29sQXJncyBvZiByYXdDb2x1bW5zKSB7XG4gICAgY29uc3QgY29sID0gZnJvbUFyZ3MoY29sQXJncyk7XG4gICAgc2NoZW1hQXJncy5jb2x1bW5zLnB1c2goY29sKTtcbiAgICBzY2hlbWFBcmdzLmZpZWxkcy5wdXNoKGNvbC5uYW1lKTtcbiAgfVxuXG4gIGlmIChzY2hlbWFBcmdzLmtleSAhPT0gJ19fcm93SWQnICYmICFzY2hlbWFBcmdzLmZpZWxkcy5pbmNsdWRlcyhzY2hlbWFBcmdzLmtleSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBmaWVsZHMgaXMgbWlzc2luZyB0aGUgc3VwcGxpZWQga2V5IFwiJHtzY2hlbWFBcmdzLmtleX1cImApO1xuXG4gIGZvciAoY29uc3QgY29sIG9mIHNjaGVtYUFyZ3MuY29sdW1ucykge1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdW2NvbC5pbmRleF0sXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXSxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKGRhdGEsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VBbGwoZGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+Pikge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVmcykubWFwKChbcGF0aCwgb3B0aW9uc10pID0+IHJlYWRDU1YocGF0aCwgb3B0aW9ucykpXG4gICk7XG59XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgUGFyc2VTY2hlbWFPcHRpb25zLCBwYXJzZUFsbCwgcmVhZENTViB9IGZyb20gJy4vcGFyc2UtY3N2JztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBqb2luRHVtcGVkIH0gZnJvbSAnLi9qb2luLXRhYmxlcyc7XG5cbmNvbnN0IHdpZHRoID0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucztcbmNvbnN0IFtmaWxlLCAuLi5maWVsZHNdID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuXG5mdW5jdGlvbiBmaW5kRGVmIChuYW1lOiBzdHJpbmcpOiBbc3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5dIHtcbiAgaWYgKGNzdkRlZnNbbmFtZV0pIHJldHVybiBbbmFtZSwgY3N2RGVmc1tuYW1lXV07XG4gIGZvciAoY29uc3QgayBpbiBjc3ZEZWZzKSB7XG4gICAgY29uc3QgZCA9IGNzdkRlZnNba107XG4gICAgaWYgKGQubmFtZSA9PT0gbmFtZSkgcmV0dXJuIFtrLCBkXTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYG5vIGNzdiBkZWZpbmVkIGZvciBcIiR7bmFtZX1cImApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wT25lKGtleTogc3RyaW5nKSB7XG4gIGNvbnN0IHRhYmxlID0gYXdhaXQgcmVhZENTViguLi5maW5kRGVmKGtleSkpO1xuICBjb21wYXJlRHVtcHModGFibGUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkdW1wQWxsICgpIHtcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIC8vIEpPSU5TXG4gIGpvaW5EdW1wZWQodGFibGVzKTtcbiAgY29uc3QgZGVzdCA9ICcuL2RhdGEvZGIuMzAuYmluJ1xuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKHRhYmxlcyk7XG4gIGF3YWl0IHdyaXRlRmlsZShkZXN0LCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xuICBjb25zb2xlLmxvZyhgd3JvdGUgJHtibG9iLnNpemV9IGJ5dGVzIHRvICR7ZGVzdH1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29tcGFyZUR1bXBzKHQ6IFRhYmxlKSB7XG4gIGNvbnN0IG1heE4gPSB0LnJvd3MubGVuZ3RoIC0gMzBcbiAgbGV0IG46IG51bWJlcjtcbiAgbGV0IHA6IGFueSA9IHVuZGVmaW5lZDtcbiAgaWYgKGZpZWxkc1swXSA9PT0gJ0ZJTFRFUicpIHtcbiAgICBuID0gMDsgLy8gd2lsbCBiZSBpbmdvcmVkXG4gICAgZmllbGRzLnNwbGljZSgwLCAxLCAnaWQnLCAnbmFtZScpO1xuICAgIHAgPSAocjogYW55KSA9PiBmaWVsZHMuc2xpY2UoMikuc29tZShmID0+IHJbZl0pO1xuICB9IGVsc2UgaWYgKGZpZWxkc1sxXSA9PT0gJ1JPVycgJiYgZmllbGRzWzJdKSB7XG4gICAgbiA9IE51bWJlcihmaWVsZHNbMl0pIC0gMTU7XG4gICAgZmllbGRzLnNwbGljZSgxLCAyKVxuICAgIGNvbnNvbGUubG9nKGBlbnN1cmUgcm93ICR7ZmllbGRzWzJdfSBpcyB2aXNpYmxlICgke259KWApO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHRocm93IG5ldyBFcnJvcignUk9XIG11c3QgYmUgTlVNQkVSISEhIScpO1xuICB9IGVsc2Uge1xuICAgIG4gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXhOKVxuICB9XG4gIG4gPSBNYXRoLm1pbihtYXhOLCBNYXRoLm1heCgwLCBuKSk7XG4gIGNvbnN0IG0gPSBuICsgMzA7XG4gIGNvbnN0IGYgPSAoZmllbGRzLmxlbmd0aCA/IChmaWVsZHNbMF0gPT09ICdBTEwnID8gdC5zY2hlbWEuZmllbGRzIDogZmllbGRzKSA6XG4gICB0LnNjaGVtYS5maWVsZHMuc2xpY2UoMCwgMTApKSBhcyBzdHJpbmdbXVxuICBkdW1wVG9Db25zb2xlKHQsIG4sIG0sIGYsICdCRUZPUkUnLCBwKTtcbiAgLypcbiAgaWYgKDEgKyAxID09PSAyKSByZXR1cm47IC8vIFRPRE8gLSB3ZSBub3Qgd29ycmllZCBhYm91dCB0aGUgb3RoZXIgc2lkZSB5ZXRcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyhbdF0pO1xuICBjb25zb2xlLmxvZyhgbWFkZSAke2Jsb2Iuc2l6ZX0gYnl0ZSBibG9iYCk7XG4gIGNvbnNvbGUubG9nKCd3YWl0Li4uLicpO1xuICAvLyhnbG9iYWxUaGlzLl9ST1dTID8/PSB7fSlbdC5zY2hlbWEubmFtZV0gPSB0LnJvd3M7XG4gIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwKSk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4nKVxuICBjb25zdCB1ID0gYXdhaXQgVGFibGUub3BlbkJsb2IoYmxvYik7XG4gIGR1bXBUb0NvbnNvbGUodVt0LnNjaGVtYS5uYW1lXSwgbiwgbSwgZiwgJ0FGVEVSJywgcCk7XG4gIC8vYXdhaXQgd3JpdGVGaWxlKCcuL3RtcC5iaW4nLCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xuICAqL1xufVxuXG5mdW5jdGlvbiBkdW1wVG9Db25zb2xlKFxuICB0OiBUYWJsZSxcbiAgbjogbnVtYmVyLFxuICBtOiBudW1iZXIsXG4gIGY6IHN0cmluZ1tdLFxuICBoOiBzdHJpbmcsXG4gIHA/OiAocjogYW55KSA9PiBib29sZWFuLFxuKSB7XG4gIGNvbnNvbGUubG9nKGBcXG4gICAgICR7aH06YCk7XG4gIHQuc2NoZW1hLnByaW50KHdpZHRoKTtcbiAgY29uc29sZS5sb2coYCh2aWV3IHJvd3MgJHtufSAtICR7bX0pYCk7XG4gIGNvbnN0IHJvd3MgPSB0LnByaW50KHdpZHRoLCBmLCBuLCBtLCBwKTtcbiAgaWYgKHJvd3MpIGZvciAoY29uc3QgciBvZiByb3dzKSBjb25zb2xlLnRhYmxlKFtyXSk7XG4gIGNvbnNvbGUubG9nKGAgICAgLyR7aH1cXG5cXG5gKVxufVxuXG5cblxuY29uc29sZS5sb2coJ0FSR1MnLCB7IGZpbGUsIGZpZWxkcyB9KVxuXG5pZiAoZmlsZSkgZHVtcE9uZShmaWxlKTtcbmVsc2UgZHVtcEFsbCgpO1xuXG5cbiIsICJpbXBvcnQge1xuICBCb29sQ29sdW1uLFxuICBDT0xVTU4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIFNjaGVtYSxcbiAgVGFibGVcbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbnR5cGUgVFIgPSBSZWNvcmQ8c3RyaW5nLCBUYWJsZT47XG5leHBvcnQgZnVuY3Rpb24gam9pbkR1bXBlZCAodGFibGVMaXN0OiBUYWJsZVtdKSB7XG4gIGNvbnN0IHRhYmxlczogVFIgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVMaXN0Lm1hcCh0ID0+IFt0Lm5hbWUsIHRdKSk7XG4gIHRhYmxlTGlzdC5wdXNoKFxuICAgIG1ha2VOYXRpb25TaXRlcyh0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlTaXRlKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlOYXRpb24odGFibGVzKSxcbiAgICBtYWtlU3BlbGxCeVVuaXQodGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5TmF0aW9uKHRhYmxlcyksXG4gICk7XG5cbiAgLy9kdW1wUmVhbG1zKHRhYmxlcyk7XG5cbiAgLy8gdGFibGVzIGhhdmUgYmVlbiBjb21iaW5lZH4hXG4gIGZvciAoY29uc3QgdCBvZiBbXG4gICAgdGFibGVzLkNvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Db2FzdFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLk5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLk5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuUHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5VbnByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuUmVhbG0sXG4gIF0pIHtcbiAgICBUYWJsZS5yZW1vdmVUYWJsZSh0LCB0YWJsZUxpc3QpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGR1bXBSZWFsbXMgKHsgUmVhbG0sIFVuaXQgfTogVFIpIHtcbiAgLy8gc2VlbXMgbGlrZSB0aGUgcmVhbG0gY3N2IGlzIHJlZHVuZGFudD9cbiAgY29uc29sZS5sb2coJ1JFQUxNIFNUQVRTOicpXG4gIGNvbnN0IGNvbWJpbmVkID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcblxuICBmb3IgKGNvbnN0IHUgb2YgVW5pdC5yb3dzKSBpZiAodS5yZWFsbTEpIGNvbWJpbmVkLnNldCh1LmlkLCB1LnJlYWxtMSk7XG5cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCByZWFsbSB9IG9mIFJlYWxtLnJvd3MpIHtcbiAgICBpZiAoIWNvbWJpbmVkLmhhcyhtb25zdGVyX251bWJlcikpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke21vbnN0ZXJfbnVtYmVyfSBSRUFMTSBJUyBERUZJTkVEIE9OTFkgSU4gUkVBTE1TIENTVmApO1xuICAgICAgY29tYmluZWQuc2V0KG1vbnN0ZXJfbnVtYmVyLCByZWFsbSk7XG4gICAgfSBlbHNlIGlmIChjb21iaW5lZC5nZXQobW9uc3Rlcl9udW1iZXIpICE9PSByZWFsbSkge1xuICAgICAgY29uc29sZS5sb2coYCR7bW9uc3Rlcl9udW1iZXJ9IFJFQUxNIENPTkZMSUNUISB1bml0LmNzdiA9ICR7Y29tYmluZWQuZ2V0KG1vbnN0ZXJfbnVtYmVyKX0sIHJlYWxtLmNzdj0ke3JlYWxtfWApO1xuICAgIH1cbiAgfVxufVxuXG5cbmNvbnN0IEFUVFJfRkFSU1VNQ09NID0gNzkwOyAvLyBsdWwgd2h5IGlzIHRoaXMgdGhlIG9ubHkgb25lPz9cbi8vIFRPRE8gLSByZWFuaW1hdGlvbnMgYXN3ZWxsPyB0d2ljZWJvcm4gdG9vPyBsZW11cmlhLWVzcXVlIGZyZWVzcGF3bj8gdm9pZGdhdGU/XG4vLyBtaWdodCBoYXZlIHRvIGFkZCBhbGwgdGhhdCBtYW51YWxseSwgd2hpY2ggc2hvdWxkIGJlIG9rYXkgc2luY2UgaXQncyBub3QgbGlrZVxuLy8gdGhleSdyZSBhY2Nlc3NpYmxlIHRvIG1vZHMgYW55d2F5P1xuLy8gc29vbiBUT0RPIC0gc3VtbW9ucywgZXZlbnQgbW9uc3RlcnMvaGVyb3Ncbi8qXG5ub3QgdXNlZCwganVzdCBrZWVwaW5nIGZvciBub3Rlc1xuZXhwb3J0IGNvbnN0IGVudW0gUkVDX1NSQyB7XG4gIFVOS05PV04gPSAwLCAvLyBpLmUuIG5vbmUgZm91bmQsIHByb2JhYmx5IGluZGllIHBkP1xuICBTVU1NT05fQUxMSUVTID0gMSwgLy8gdmlhICNtYWtlbW9uc3Rlck5cbiAgU1VNTU9OX0RPTSA9IDIsIC8vIHZpYSAjW3JhcmVdZG9tc3VtbW9uTlxuICBTVU1NT05fQVVUTyA9IDMsIC8vIHZpYSAjc3VtbW9uTiAvIFwidHVybW9pbHN1bW1vblwiIC8gd2ludGVyc3VtbW9uMWQzXG4gIFNVTU1PTl9CQVRUTEUgPSA0LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIFRFTVBMRV9UUkFJTkVSID0gNSwgLy8gdmlhICN0ZW1wbGV0cmFpbmVyLCB2YWx1ZSBpcyBoYXJkIGNvZGVkIHRvIDE4NTkuLi5cbiAgUklUVUFMID0gNixcbiAgRU5URVJfU0lURSA9IDcsXG4gIFJFQ19TSVRFID0gOCxcbiAgUkVDX0NBUCA9IDksXG4gIFJFQ19GT1JFSUdOID0gMTAsXG4gIFJFQ19GT1JUID0gMTEsXG4gIEVWRU5UID0gMTIsXG4gIEhFUk8gPSAxMyxcbiAgUFJFVEVOREVSID0gMTQsXG59XG4qL1xuXG4vLyBUT0RPIC0gZXhwb3J0IHRoZXNlIGZyb20gc29tZXdoZXJlIG1vcmUgc2Vuc2libGVcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19UWVBFIHtcbiAgRk9SVCA9IDAsIC8vIG5vcm1hbCBpIGd1ZXNzXG4gIFBSRVRFTkRFUiA9IDEsIC8vIHUgaGVhcmQgaXQgaGVyZVxuICBGT1JFSUdOID0gMixcbiAgV0FURVIgPSAzLFxuICBDT0FTVCA9IDQsXG4gIEZPUkVTVCA9IDUsXG4gIFNXQU1QID0gNixcbiAgV0FTVEUgPSA3LFxuICBNT1VOVEFJTiA9IDgsXG4gIENBVkUgPSA5LFxuICBQTEFJTlMgPSAxMCxcbiAgSEVSTyA9IDExLFxuICBNVUxUSUhFUk8gPSAxMixcbiAgUFJFVEVOREVSX0NIRUFQXzIwID0gMTMsXG4gIFBSRVRFTkRFUl9DSEVBUF80MCA9IDE0LFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBVTklUX1RZUEUge1xuICBOT05FID0gMCwgICAgICAvLyBqdXN0IGEgdW5pdC4uLlxuICBDT01NQU5ERVIgPSAxLFxuICBQUkVURU5ERVIgPSAyLFxuICBDQVBPTkxZID0gNCxcbiAgSEVSTyA9IDgsXG59XG5cblxuZXhwb3J0IGNvbnN0IFJlYWxtTmFtZXMgPSBbXG4gICdOb25lJyxcbiAgJ05vcnRoJyxcbiAgJ0NlbHRpYycsXG4gICdNZWRpdGVycmFuZWFuJyxcbiAgJ0ZhciBFYXN0JyxcbiAgJ01pZGRsZSBFYXN0JyxcbiAgJ01pZGRsZSBBbWVyaWNhJyxcbiAgJ0FmcmljYScsXG4gICdJbmRpYScsXG4gICdEZWVwcycsXG4gICdEZWZhdWx0J1xuXTtcblxuICAvKlxuY29uc3QgU1VNX0ZJRUxEUyA9IFtcbiAgLy8gdGhlc2UgdHdvIGNvbWJpbmVkIHNlZW0gdG8gYmUgc3VtbW9uICNtYWtlbW9uc3Rlck5cbiAgJ3N1bW1vbicsICduX3N1bW1vbicsXG4gIC8vIHRoaXMgaXMgdXNlZCBieSB0aGUgZ2hvdWwgbG9yZCBvbmx5LCBhbmQgaXQgc2hvdWxkIGFjdHVhbGx5IGJlIGBuX3N1bW1vbiA9IDVgXG4gICdzdW1tb241JyxcbiAgLy8gYXV0byBzdW1tb24gMS9tb250aCwgYXMgcGVyIG1vZCBjb21tYW5kcywgdXNlZCBvbmx5IGJ5IGZhbHNlIHByb3BoZXQgYW5kIHZpbmUgZ3V5P1xuICAnc3VtbW9uMScsXG5cbiAgLy8gZG9tIHN1bW1vbiBjb21tYW5kc1xuICAnZG9tc3VtbW9uJyxcbiAgJ2RvbXN1bW1vbjInLFxuICAnZG9tc3VtbW9uMjAnLFxuICAncmFyZWRvbXN1bW1vbicsXG5cbiAgJ2JhdHN0YXJ0c3VtMScsXG4gICdiYXRzdGFydHN1bTInLFxuICAnYmF0c3RhcnRzdW0zJyxcbiAgJ2JhdHN0YXJ0c3VtNCcsXG4gICdiYXRzdGFydHN1bTUnLFxuICAnYmF0c3RhcnRzdW0xZDMnLFxuICAnYmF0c3RhcnRzdW0xZDYnLFxuICAnYmF0c3RhcnRzdW0yZDYnLFxuICAnYmF0c3RhcnRzdW0zZDYnLFxuICAnYmF0c3RhcnRzdW00ZDYnLFxuICAnYmF0c3RhcnRzdW01ZDYnLFxuICAnYmF0c3RhcnRzdW02ZDYnLFxuICAnYmF0dGxlc3VtNScsIC8vIHBlciByb3VuZFxuXG4gIC8vJ29uaXN1bW1vbicsIHdlIGRvbnQgcmVhbGx5IGNhcmUgYWJvdXQgdGhpcyBvbmUgYmVjYXVzZSBpdCBkb2VzbnQgdGVsbCB1c1xuICAvLyAgYWJvdXQgd2hpY2ggbW9uc3RlcnMgYXJlIHN1bW1vbmVkXG4gIC8vICdoZWF0aGVuc3VtbW9uJywgaWRmaz8/IGh0dHBzOi8vaWxsd2lraS5jb20vZG9tNS91c2VyL2xvZ2d5L3NsYXZlclxuICAvLyAnY29sZHN1bW1vbicsIHVudXNlZFxuICAnd2ludGVyc3VtbW9uMWQzJywgLy8gdmFtcCBxdWVlbiwgbm90IGFjdHVhbGx5IGEgKGRvY3VtZW50ZWQpIGNvbW1hbmQ/XG5cbiAgJ3R1cm1vaWxzdW1tb24nLCAvLyBhbHNvIG5vdCBhIGNvbW1hbmQgfiAhXG5dXG4qL1xuXG5mdW5jdGlvbiBtYWtlTmF0aW9uU2l0ZXModGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBBdHRyaWJ1dGVCeU5hdGlvbiwgTmF0aW9uIH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTaXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMSxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgam9pbnM6ICdOYXRpb25bbmF0aW9uSWRdK01hZ2ljU2l0ZVtzaXRlSWRdJyxcbiAgICBmaWVsZHM6IFtcbiAgICAgICduYXRpb25JZCcsXG4gICAgICAnc2l0ZUlkJyxcbiAgICAgICdmdXR1cmUnLFxuICAgIF0sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzaXRlSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IEJvb2xDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnZnV0dXJlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5CT09MLFxuICAgICAgICBiaXQ6IDAsXG4gICAgICAgIGZsYWc6IDFcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdXG4gIGZvciAobGV0IFtpLCByb3ddIG9mIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCwgYXR0cmlidXRlLCByYXdfdmFsdWU6IHNpdGVJZCB9ID0gcm93O1xuICAgIGxldCBmdXR1cmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgLy8gd2hpbGUgd2UncmUgaGVyZSwgbGV0cyBwdXQgcmVhbG0gaWQgcmlnaHQgb24gdGhlIG5hdGlvbiAoZXh0cmFGaWVsZCBpbiBkZWYpXG4gICAgICBjYXNlIDI4OTpcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgbmF0aW9uYWwgcmVhbG06ICR7bmF0aW9uSWR9IC0+ICR7c2l0ZUlkfWApXG4gICAgICAgIGNvbnN0IG5hdGlvbiA9IE5hdGlvbi5tYXAuZ2V0KG5hdGlvbklkKTtcbiAgICAgICAgaWYgKCFuYXRpb24pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBpbnZhbGlkIG5hdGlvbiBpZCAke25hdGlvbklkfSAobm8gcm93IGluIE5hdGlvbilgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjb25mdXNpbmchIHRvbnMgb2YgbmF0aW9ucyBoYXZlIG11bHRpcGxlIHJlYWxtcz8ganVzdCB1c2UgdGhlIG1vc3RcbiAgICAgICAgICAvLyByZWNlbnQgb25lIEkgZ3Vlc3M/XG4gICAgICAgICAgLy9pZiAobmF0aW9uLnJlYWxtKSB7XG4gICAgICAgICAgICAvL2NvbnN0IHByZXYgPSBSZWFsbU5hbWVzW25hdGlvbi5yZWFsbV07XG4gICAgICAgICAgICAvL2NvbnN0IG5leHQgPSBSZWFsbU5hbWVzW3NpdGVJZF07XG4gICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYCR7bmF0aW9uLm5hbWV9IFJFQUxNICR7cHJldn0gLT4gJHtuZXh0fWApO1xuICAgICAgICAgIC8vfVxuICAgICAgICAgIG5hdGlvbi5yZWFsbSA9IHNpdGVJZDtcbiAgICAgICAgfVxuICAgICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgLy8gZnV0dXJlIHNpdGVcbiAgICAgIGNhc2UgNjMxOlxuICAgICAgICBmdXR1cmUgPSB0cnVlO1xuICAgICAgICAvLyB1IGtub3cgdGhpcyBiaXRjaCBmYWxscyBUSFJVXG4gICAgICAvLyBzdGFydCBzaXRlXG4gICAgICBjYXNlIDUyOlxuICAgICAgY2FzZSAxMDA6XG4gICAgICBjYXNlIDI1OlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIHNvbWUgb3RoZXIgZHVtYmFzcyBhdHRyaWJ1dGVcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcm93cy5wdXNoKHtcbiAgICAgIG5hdGlvbklkLFxuICAgICAgc2l0ZUlkLFxuICAgICAgZnV0dXJlLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgfSk7XG4gICAgZGVsUm93cy5wdXNoKGkpO1xuICB9XG5cbiAgLy8gcmVtb3ZlIG5vdy1yZWR1bmRhbnQgYXR0cmlidXRlc1xuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKVxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICB0cnVlXG4gICk7XG59XG5cbi8qXG5mdW5jdGlvbiBtYWtlVW5pdFNvdXJjZVNjaGVtYSAoKTogYW55IHtcbiAgcmV0dXJuIG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0U291cmNlJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIG5hdGlvbklkOiAxLFxuICAgICAgc291cmNlSWQ6IDIsXG4gICAgICBzb3VyY2VUeXBlOiAzLFxuICAgICAgc291cmNlQXJnOiA0LFxuICAgIH0sXG4gICAgZmllbGRzOiBbXG4gICAgICAndW5pdElkJyxcbiAgICAgICduYXRpb25JZCcsXG4gICAgICAnc291cmNlSWQnLFxuICAgICAgJ3NvdXJjZVR5cGUnLFxuICAgICAgJ3NvdXJjZUFyZycsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlSWQnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc291cmNlVHlwZScsXG4gICAgICAgIGluZGV4OiAzLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NvdXJjZUFyZycsXG4gICAgICAgIGluZGV4OiA0LFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcbn1cbiovXG5cbmZ1bmN0aW9uIG1ha2VTcGVsbEJ5TmF0aW9uICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbFtzcGVsbElkXStOYXRpb25bbmF0aW9uSWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc3BlbGxJZDogMCwgbmF0aW9uSWQ6IDEgfSxcbiAgICBmaWVsZHM6IFsnc3BlbGxJZCcsICduYXRpb25JZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NwZWxsSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICBsZXQgX19yb3dJZCA9IDA7XG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG4gIGZvciAoY29uc3QgW2ksIHJdIG9mIGF0dHJzLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyBzcGVsbF9udW1iZXI6IHNwZWxsSWQsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlIH0gPSByO1xuICAgIGlmIChhdHRyaWJ1dGUgPT09IDI3OCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgJHtzcGVsbElkfSBJUyBSRVNUUklDVEVEIFRPIE5BVElPTiAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IG5hdGlvbklkID0gTnVtYmVyKHJhd192YWx1ZSk7XG4gICAgICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKG5hdGlvbklkKSB8fCBuYXRpb25JZCA8IDAgfHwgbmF0aW9uSWQgPiAyNTUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgICAgICAhISEhISBUT08gQklHIE5BWVNIICEhISEhICgke25hdGlvbklkfSlgKTtcbiAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgIHJvd3MucHVzaCh7IF9fcm93SWQsIHNwZWxsSWQsIG5hdGlvbklkIH0pO1xuICAgICAgX19yb3dJZCsrO1xuICAgIH1cbiAgfVxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKSBhdHRycy5yb3dzLnNwbGljZShkaSwgMSk7XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2VcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlVbml0ICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBhdHRycyA9IHRhYmxlcy5BdHRyaWJ1dGVCeVNwZWxsO1xuICBjb25zdCBkZWxSb3dzOiBudW1iZXJbXSA9IFtdO1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnU3BlbGxCeVVuaXQnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnU3BlbGxbc3BlbGxJZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc3BlbGxJZDogMCwgdW5pdElkOiAxIH0sXG4gICAgZmllbGRzOiBbJ3NwZWxsSWQnLCAndW5pdElkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLkkzMixcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgbGV0IF9fcm93SWQgPSAwO1xuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtpLCByXSBvZiBhdHRycy5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgc3BlbGxfbnVtYmVyOiBzcGVsbElkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZSB9ID0gcjtcbiAgICBpZiAoYXR0cmlidXRlID09PSA3MzEpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCR7c3BlbGxJZH0gSVMgUkVTVFJJQ1RFRCBUTyBVTklUICR7cmF3X3ZhbHVlfWApO1xuICAgICAgY29uc3QgdW5pdElkID0gTnVtYmVyKHJhd192YWx1ZSk7XG4gICAgICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKHVuaXRJZCkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgICAgICAhISEhISBUT08gQklHIFVOSVQgISEhISEgKCR7dW5pdElkfSlgKTtcbiAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgIHJvd3MucHVzaCh7IF9fcm93SWQsIHNwZWxsSWQsIHVuaXRJZCB9KTtcbiAgICAgIF9fcm93SWQrKztcbiAgICB9XG4gIH1cbiAgbGV0IGRpOiBudW1iZXJ8dW5kZWZpbmVkID0gdW5kZWZpbmVkXG4gIHdoaWxlICgoZGkgPSBkZWxSb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKSBhdHRycy5yb3dzLnNwbGljZShkaSwgMSk7XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2VcbiAgKTtcbn1cblxuLy8gZmV3IHRoaW5ncyBoZXJlOlxuLy8gLSBobW9uMS01ICYgaGNvbTEtNCBhcmUgY2FwLW9ubHkgdW5pdHMvY29tbWFuZGVyc1xuLy8gLSBuYXRpb25hbHJlY3J1aXRzICsgbmF0Y29tIC8gbmF0bW9uIGFyZSBub24tY2FwIG9ubHkgc2l0ZS1leGNsdXNpdmVzICh5YXkpXG4vLyAtIG1vbjEtMiAmIGNvbTEtMyBhcmUgZ2VuZXJpYyByZWNydWl0YWJsZSB1bml0cy9jb21tYW5kZXJzXG4vLyAtIHN1bTEtNCAmIG5fc3VtMS00IGFyZSBtYWdlLXN1bW1vbmFibGUgKG4gZGV0ZXJtaW5lcyBtYWdlIGx2bCByZXEpXG4vLyAodm9pZGdhdGUgLSBub3QgcmVhbGx5IHJlbGV2YW50IGhlcmUsIGl0IGRvZXNuJ3QgaW5kaWNhdGUgd2hhdCBtb25zdGVycyBhcmVcbi8vIHN1bW1vbmVkLCBtYXkgYWRkIHRob3NlIG1hbnVhbGx5PylcblxuZXhwb3J0IGVudW0gU0lURV9SRUMge1xuICBIT01FX01PTiA9IDAsIC8vIGFyZyBpcyBuYXRpb24sIHdlJ2xsIGhhdmUgdG8gYWRkIGl0IGxhdGVyIHRob3VnaFxuICBIT01FX0NPTSA9IDEsIC8vIHNhbWVcbiAgUkVDX01PTiA9IDIsXG4gIFJFQ19DT00gPSAzLFxuICBOQVRfTU9OID0gNCwgLy8gYXJnIGlzIG5hdGlvblxuICBOQVRfQ09NID0gNSwgLy8gc2FtZVxuICBTVU1NT04gPSA4LCAvLyBhcmcgaXMgbGV2ZWwgcmVxdWlyZW1lbnRcbn1cblxuY29uc3QgU19ITU9OUyA9IEFycmF5LmZyb20oJzEyMzQ1JywgbiA9PiBgaG1vbiR7bn1gKTtcbmNvbnN0IFNfSENPTVMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBgaGNvbSR7bn1gKTtcbmNvbnN0IFNfUk1PTlMgPSBBcnJheS5mcm9tKCcxMicsIG4gPT4gYG1vbiR7bn1gKTtcbmNvbnN0IFNfUkNPTVMgPSBBcnJheS5mcm9tKCcxMjMnLCBuID0+IGBjb20ke259YCk7XG5jb25zdCBTX1NVTU5TID0gQXJyYXkuZnJvbSgnMTIzNCcsIG4gPT4gW2BzdW0ke259YCwgYG5fc3VtJHtufWBdKTtcblxuZnVuY3Rpb24gbWFrZVVuaXRCeVNpdGUgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHsgTWFnaWNTaXRlLCBTaXRlQnlOYXRpb24sIFVuaXQgfSA9IHRhYmxlcztcbiAgaWYgKCFTaXRlQnlOYXRpb24pIHRocm93IG5ldyBFcnJvcignZG8gU2l0ZUJ5TmF0aW9uIGZpcnN0Jyk7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVNpdGUnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGpvaW5zOiAnTWFnaWNTaXRlW3NpdGVJZF0rVW5pdFt1bml0SWRdJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc2l0ZUlkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIsIHJlY0FyZzogMyB9LFxuICAgIGZpZWxkczogWydzaXRlSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnLCAncmVjQXJnJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjQXJnJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHNpdGUgb2YgTWFnaWNTaXRlLnJvd3MpIHtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU19ITU9OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IDA7XG4gICAgICBjb25zdCBuaiA9IHNpdGUuU2l0ZUJ5TmF0aW9uPy5maW5kKCh7IHNpdGVJZCB9KSA9PiBzaXRlSWQgPT09IHNpdGUuaWQpO1xuICAgICAgaWYgKCFuaikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICdtaXhlZCB1cCBjYXAtb25seSBtb24gc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSwgc2l0ZS5TaXRlQnlOYXRpb25cbiAgICAgICAgKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduaWlpaWNlJywgbmosIHNpdGUuU2l0ZUJ5TmF0aW9uKVxuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gMDtcbiAgICAgIGNvbnN0IG5qID0gc2l0ZS5TaXRlQnlOYXRpb24/LmZpbmQoKHsgc2l0ZUlkIH0pID0+IHNpdGVJZCA9PT0gc2l0ZS5pZCk7XG4gICAgICBpZiAoIW5qKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgJ21peGVkIHVwIGNhcC1vbmx5IGNtZHIgc2l0ZScsIGssIHNpdGUuaWQsIHNpdGUubmFtZSwgc2l0ZS5TaXRlQnlOYXRpb25cbiAgICAgICAgKTtcbiAgICAgICAgcmVjQXJnID0gMDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQobW5yKTtcbiAgICAgIGlmICh1bml0KSB7XG4gICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdtaXhlZCB1cCBjYXAtb25seSBzaXRlIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfQ09NLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JNT05TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGsgb2YgU19SQ09NUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldChtbnIpO1xuICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgdW5pdC50eXBlIHw9IDE7IC8vIGZsYWcgYXMgYSBjb21tYW5kZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIHNpdGUgY29tbWFuZGVyIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLlJFQ19NT04sXG4gICAgICAgIHJlY0FyZzogMCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrLCBua10gb2YgU19TVU1OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgY29uc3QgYXJnID0gc2l0ZVtua107XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuU1VNTU9OLFxuICAgICAgICByZWNBcmc6IGFyZywgLy8gbGV2ZWwgcmVxdWl1cmVtZW50IChjb3VsZCBhbHNvIGluY2x1ZGUgcGF0aClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChzaXRlLm5hdGlvbmFscmVjcnVpdHMpIHtcbiAgICAgIGlmIChzaXRlLm5hdG1vbikgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBzaXRlLm5hdG1vbixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX01PTixcbiAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICB9KTtcbiAgICAgIGlmIChzaXRlLm5hdGNvbSkge1xuICAgICAgICByb3dzLnB1c2goe1xuICAgICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgICB1bml0SWQ6IHNpdGUubmF0Y29tLFxuICAgICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLk5BVF9DT00sXG4gICAgICAgICAgcmVjQXJnOiBzaXRlLm5hdGlvbmFscmVjcnVpdHMsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHNpdGUubmF0Y29tKTtcbiAgICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIG5hdGNvbSAobm8gdW5pdCBpbiB1bml0IHRhYmxlPyknLCBzaXRlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyB5YXkhXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlXG4gICk7XG5cbn1cblxuZnVuY3Rpb24gbWFrZVVuaXRCeVVuaXRTdW1tb24gKHRhYmxlczogVFIpIHtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVNpdGUnLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyB1bml0SWQ6IDAsIHN1bW1vbmVySWQ6IDEgfSxcbiAgICBmaWVsZHM6IFsndW5pdElkJywgJ3N1bW1vbmVySWQnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3VtbW9uZXJJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlLFxuICApO1xufVxuXG4vLyBUT0RPIC0gbm90IHN1cmUgeWV0IGlmIEkgd2FudCB0byBkdXBsaWNhdGUgY2FwLW9ubHkgc2l0ZXMgaGVyZT9cbmZ1bmN0aW9uIG1ha2VVbml0QnlOYXRpb24gKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0QnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBuYXRpb25JZDogMCwgdW5pdElkOiAxLCByZWNUeXBlOiAyIH0sXG4gICAgam9pbnM6ICdOYXRpb25bbmF0aW9uSWRdK1VuaXRbdW5pdElkXScsXG4gICAgZmllbGRzOiBbJ25hdGlvbklkJywgJ3VuaXRJZCcsICdyZWNUeXBlJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjVHlwZScsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG5cbiAgLy8gVE9ETyAtIHByZXRlbmRlcnNcbiAgLy8gZm9sbG93aW5nIHRoZSBsb2dpYyBpbiAuLi8uLi8uLi8uLi9zY3JpcHRzL0RNSS9NTmF0aW9uLmpzXG4gIC8vICAgMS4gZGV0ZXJtaW5lIG5hdGlvbiByZWFsbShzKSBhbmQgdXNlIHRoYXQgdG8gYWRkIHByZXRlbmRlcnNcbiAgLy8gICAyLiB1c2UgdGhlIGxpc3Qgb2YgXCJleHRyYVwiIGFkZGVkIHByZXRlbmRlcnMgdG8gYWRkIGFueSBleHRyYVxuICAvLyAgIDMuIHVzZSB0aGUgdW5wcmV0ZW5kZXJzIHRhYmxlIHRvIGRvIG9wcG9zaXRlXG5cbiAgLy8gdGhlcmUncyBhIGxvdCBnb2luIG9uIGhlcmVcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBtYWtlUmVjcnVpdG1lbnRGcm9tQXR0cnModGFibGVzLCByb3dzKTtcbiAgY29tYmluZVJlY3J1aXRtZW50VGFibGVzKHRhYmxlcywgcm93cyk7XG4gIG1ha2VQcmV0ZW5kZXJCeU5hdGlvbih0YWJsZXMsIHJvd3MpXG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNydWl0bWVudEZyb21BdHRycyAodGFibGVzOiBUUiwgcm93czogYW55W10pIHtcbiAgY29uc3QgeyBBdHRyaWJ1dGVCeU5hdGlvbiwgVW5pdCB9ID0gdGFibGVzO1xuICBjb25zdCBkZWxBQk5Sb3dzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtpQUJOICxyXSAgb2YgQXR0cmlidXRlQnlOYXRpb24ucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHJhd192YWx1ZSwgYXR0cmlidXRlLCBuYXRpb25fbnVtYmVyIH0gPSByO1xuICAgIGxldCB1bml0OiBhbnk7XG4gICAgbGV0IHVuaXRJZDogYW55ID0gbnVsbCAvLyBzbWZoXG4gICAgbGV0IHVuaXRUeXBlID0gMDtcbiAgICBsZXQgcmVjVHlwZSA9IDA7XG4gICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgIGNhc2UgMTU4OlxuICAgICAgY2FzZSAxNTk6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LmxhbmRzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ09BU1Q7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE2MDpcbiAgICAgIGNhc2UgMTYxOlxuICAgICAgY2FzZSAxNjI6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LmxhbmRzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ09BU1Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNjM6XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE4NjpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQud2F0ZXJzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FURVI7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE4NzpcbiAgICAgIGNhc2UgMTg5OlxuICAgICAgY2FzZSAxOTA6XG4gICAgICBjYXNlIDE5MTpcbiAgICAgIGNhc2UgMjEzOlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC53YXRlcnNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NDpcbiAgICAgIGNhc2UgNDEyOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5GT1JFU1Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTU6XG4gICAgICBjYXNlIDQxMzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuRk9SRVNUO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlNXQU1QO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5TV0FNUDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk4OlxuICAgICAgY2FzZSA0MDg6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLk1PVU5UQUlOO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk5OlxuICAgICAgY2FzZSA0MDk6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLk1PVU5UQUlOO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDA6XG4gICAgICBjYXNlIDQxNjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FTVEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDE6XG4gICAgICBjYXNlIDQxNzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FTVEU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ0FWRTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuQ0FWRTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA0OlxuICAgICAgY2FzZSA0MDY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlBMQUlOUztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwNTpcbiAgICAgIGNhc2UgNDA3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5QTEFJTlM7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEzOTpcbiAgICAgIGNhc2UgMTQwOlxuICAgICAgY2FzZSAxNDE6XG4gICAgICBjYXNlIDE0MjpcbiAgICAgIGNhc2UgMTQzOlxuICAgICAgY2FzZSAxNDQ6XG4gICAgICAgIC8vY29uc29sZS5sb2coJ0hFUk8gRklOREVSIEZPVU5EJywgcmF3X3ZhbHVlKVxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUiB8IFVOSVRfVFlQRS5IRVJPO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuSEVSTztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE0NTpcbiAgICAgIGNhc2UgMTQ2OlxuICAgICAgY2FzZSAxNDk6XG4gICAgICAgIC8vY29uc29sZS5sb2coJ211bHRpIGhlcm8hJywgcmF3X3ZhbHVlKVxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUiB8IFVOSVRfVFlQRS5IRVJPO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTVVMVElIRVJPO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAodW5pdElkID09IG51bGwpIGNvbnRpbnVlO1xuICAgIGRlbEFCTlJvd3MucHVzaChpQUJOKTtcbiAgICB1bml0ID8/PSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAodW5pdFR5cGUpIHVuaXQudHlwZSB8PSB1bml0VHlwZTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ21vcmUgcGlzcyB1bml0OicsIGlBQk4sIHVuaXRJZCk7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIHVuaXRJZCxcbiAgICAgIHJlY1R5cGUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIG5hdGlvbklkOiBuYXRpb25fbnVtYmVyLFxuICAgIH0pO1xuICB9XG5cbiAgbGV0IGRpOiBudW1iZXJ8dW5kZWZpbmVkO1xuICB3aGlsZSAoKGRpID0gZGVsQUJOUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZClcbiAgICBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLnNwbGljZShkaSwgMSk7XG5cblxufVxuXG5mdW5jdGlvbiBjb21iaW5lUmVjcnVpdG1lbnRUYWJsZXMgKHRhYmxlczogVFIsIHJvd3M6IGFueVtdKSB7XG4gIGNvbnN0IHtcbiAgICBVbml0LFxuICAgIENvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIENvYXN0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICBGb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gIH0gPSB0YWJsZXM7XG4gIGZvciAoY29uc3QgciBvZiBGb3J0VHJvb3BUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JULFxuICAgIH0pXG4gIH1cbiAgZm9yIChjb25zdCByIG9mIENvYXN0VHJvb3BUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5DT0FTVCxcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIENvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkNPQVNULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIE5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SRUlHTixcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VQcmV0ZW5kZXJCeU5hdGlvbiAodGFibGVzOiBUUiwgcm93czogYW55W10pIHtcbiAgY29uc3Qge1xuICAgIFByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICBVbnByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICBOYXRpb24sXG4gICAgVW5pdCxcbiAgICBSZWFsbSxcbiAgICBBdHRyaWJ1dGVCeU5hdGlvbixcbiAgfSA9IHRhYmxlcztcblxuICAvLyBUT0RPIC0gZGVsZXRlIG1hdGNoaW5nIHJvd3MgZnJvbSB0aGUgdGFibGVcbiAgY29uc3QgY2hlYXBBdHRycyA9IEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3MuZmlsdGVyKFxuICAgICh7IGF0dHJpYnV0ZTogYSB9KSA9PiBhID09PSAzMTQgfHwgYSA9PT0gMzE1XG4gICk7XG4gIGNvbnN0IGNoZWFwID0gbmV3IE1hcDxudW1iZXIsIE1hcDxudW1iZXIsIDIwfDQwPj4oKTtcbiAgZm9yIChjb25zdCB7IG5hdGlvbl9udW1iZXIsIGF0dHJpYnV0ZSwgcmF3X3ZhbHVlIH0gb2YgY2hlYXBBdHRycykge1xuICAgIGlmICghY2hlYXAuaGFzKHJhd192YWx1ZSkpIGNoZWFwLnNldChyYXdfdmFsdWUsIG5ldyBNYXAoKSk7XG4gICAgY29uc3QgY1VuaXQgPSBjaGVhcC5nZXQocmF3X3ZhbHVlKSE7XG4gICAgY1VuaXQuc2V0KG5hdGlvbl9udW1iZXIsIGF0dHJpYnV0ZSA9PT0gMzE0ID8gMjAgOiA0MCk7XG4gIH1cblxuICAvLyBtYWtlIGEgbWFwIGZpcnN0LCB3ZSB3aWxsIGNvbnZlcnQgdG8gcm93cyBhdCB0aGUgZW5kXG4gIGNvbnN0IHByZXRlbmRlcnMgPSBuZXcgTWFwKE5hdGlvbi5yb3dzLm1hcChyID0+IFtyLmlkLCBuZXcgU2V0PG51bWJlcj4oKV0pKTtcbiAgLy8gbW9uc3RlcnMgZm9yIGVhY2ggcmVhbG1cbiAgY29uc3QgcjJtID0gbmV3IE1hcDxudW1iZXIsIFNldDxudW1iZXI+PigpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSAxMDsgaSsrKSByMm0uc2V0KGksIG5ldyBTZXQoKSk7XG4gIGZvciAoY29uc3QgeyBtb25zdGVyX251bWJlciwgcmVhbG0gfSBvZiBSZWFsbS5yb3dzKVxuICAgIHIybS5nZXQocmVhbG0pIS5hZGQobW9uc3Rlcl9udW1iZXIpO1xuXG4gIC8vIGZpcnN0IGRvIHJlYWxtLWJhc2VkIHByZXRlbmRlcnNcbiAgZm9yIChjb25zdCB7IHJlYWxtLCBpZCB9IG9mIE5hdGlvbi5yb3dzKSB7XG4gICAgaWYgKCFyZWFsbSkgY29udGludWU7XG4gICAgZm9yIChjb25zdCBtbnIgb2YgcjJtLmdldChyZWFsbSkhKSB7XG4gICAgICBwcmV0ZW5kZXJzLmdldChpZCkhLmFkZChtbnIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoZW4gYWRkIHByZXRlbmRlcnMgYnkgbmF0aW9uXG4gIGZvciAoY29uc3QgeyBtb25zdGVyX251bWJlciwgbmF0aW9uX251bWJlciB9IG9mIFByZXRlbmRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgcHJldGVuZGVycy5nZXQobmF0aW9uX251bWJlcikhLmFkZChtb25zdGVyX251bWJlcik7XG4gIH1cbiAgLy8gdGhlbiB1bnByZXRlbmRlcnMgYnkgbmF0aW9uXG4gIGZvciAoY29uc3QgeyBtb25zdGVyX251bWJlciwgbmF0aW9uX251bWJlciB9IG9mIFVucHJldGVuZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBwcmV0ZW5kZXJzLmdldChuYXRpb25fbnVtYmVyKSEuZGVsZXRlKG1vbnN0ZXJfbnVtYmVyKTtcbiAgfVxuXG4gIGNvbnN0IGFkZGVkVW5pdHMgPSBuZXcgTWFwPG51bWJlciwgYW55PigpO1xuXG4gIGZvciAoY29uc3QgW25hdGlvbklkLCB1bml0SWRzXSBvZiBwcmV0ZW5kZXJzKSB7XG4gICAgZm9yIChjb25zdCB1bml0SWQgb2YgdW5pdElkcykge1xuICAgICAgaWYgKCFhZGRlZFVuaXRzLmhhcyh1bml0SWQpKSBhZGRlZFVuaXRzLnNldCh1bml0SWQsIFVuaXQubWFwLmdldCh1bml0SWQpKTtcbiAgICAgIGNvbnN0IGRpc2NvdW50ID0gY2hlYXAuZ2V0KHVuaXRJZCk/LmdldChuYXRpb25JZCkgPz8gMDtcbiAgICAgIGNvbnN0IHJlY1R5cGUgPSBkaXNjb3VudCA9PT0gNDAgPyBSRUNfVFlQRS5QUkVURU5ERVJfQ0hFQVBfNDAgOlxuICAgICAgICBkaXNjb3VudCA9PT0gMjAgPyBSRUNfVFlQRS5QUkVURU5ERVJfQ0hFQVBfMjAgOlxuICAgICAgICBSRUNfVFlQRS5QUkVURU5ERVI7XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICB1bml0SWQsXG4gICAgICAgIHJlY1R5cGUsXG4gICAgICAgIHJlY0FyZzogbmF0aW9uSWQsXG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBbaWQsIHVdIG9mIGFkZGVkVW5pdHMpIHtcbiAgICBpZiAoIXUpIHsgY29uc29sZS53YXJuKCdmYWtlIHVuaXQgaWQ/JywgaWQpOyBjb250aW51ZSB9XG4gICAgaWYgKCF1LnN0YXJ0ZG9tIHx8ICEodS50eXBlICYgVU5JVF9UWVBFLlBSRVRFTkRFUikpIHtcbiAgICAgIGNvbnNvbGUud2Fybignbm90IGEgcHJldGVuZGVyPycsIHUubmFtZSwgdS50eXBlLCB1LnN0YXJ0ZG9tKTtcbiAgICB9XG4gICAgdS50eXBlIHw9IFVOSVRfVFlQRS5QUkVURU5ERVI7XG4gIH1cbn1cblxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsSUFBTSxZQUFZO0FBRVgsU0FBUyxhQUNkLEdBQ0EsT0FDQSxVQUNvQjtBQUNwQixRQUFNLFFBQVEsRUFBRSxNQUFNLEdBQUc7QUFDekIsTUFBSSxNQUFNLFNBQVM7QUFBRyxVQUFNLElBQUksTUFBTSxhQUFhLENBQUMscUJBQXFCO0FBQ3pFLFFBQU0sUUFBNEIsQ0FBQztBQUNuQyxhQUFXLEtBQUssT0FBTztB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SSxJQUFJO0FBQUE7QUFBQSxNQUVwQjtBQUFBLE1BQVU7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUN4QztBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUTtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUTtBQUFBO0FBQUEsTUFHaEQ7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQzdDO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUM3QztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFDN0M7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBO0FBQUEsTUFHN0M7QUFBQTtBQUFBLE1BRUE7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELGFBQWE7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtB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QWEsTUFBTTtBQUN0QyxRQUFNLFVBQVUsTUFBTSxLQUFLLE9BQU8sR0FBRyxFQUFFLFVBQVUsS0FBSyxDQUFDO0FBQ3ZELFVBQVEsSUFBSSxTQUFTLEtBQUssSUFBSSxhQUFhLElBQUksRUFBRTtBQUNuRDtBQUVBLGVBQWUsYUFBYSxHQUFVO0FBQ3BDLFFBQU0sT0FBTyxFQUFFLEtBQUssU0FBUztBQUM3QixNQUFJO0FBQ0osTUFBSSxJQUFTO0FBQ2IsTUFBSSxPQUFPLENBQUMsTUFBTSxVQUFVO0FBQzFCLFFBQUk7QUFDSixXQUFPLE9BQU8sR0FBRyxHQUFHLE1BQU0sTUFBTTtBQUNoQyxRQUFJLENBQUMsTUFBVyxPQUFPLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQUMsT0FBSyxFQUFFQSxFQUFDLENBQUM7QUFBQSxFQUNoRCxXQUFXLE9BQU8sQ0FBQyxNQUFNLFNBQVMsT0FBTyxDQUFDLEdBQUc7QUFDM0MsUUFBSSxPQUFPLE9BQU8sQ0FBQyxDQUFDLElBQUk7QUFDeEIsV0FBTyxPQUFPLEdBQUcsQ0FBQztBQUNsQixZQUFRLElBQUksY0FBYyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHO0FBQ3ZELFFBQUksT0FBTyxNQUFNLENBQUM7QUFBRyxZQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxFQUMvRCxPQUFPO0FBQ0wsUUFBSSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ3JDO0FBQ0EsTUFBSSxLQUFLLElBQUksTUFBTSxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7QUFDakMsUUFBTSxJQUFJLElBQUk7QUFDZCxRQUFNLElBQUssT0FBTyxTQUFVLE9BQU8sQ0FBQyxNQUFNLFFBQVEsRUFBRSxPQUFPLFNBQVMsU0FDbkUsRUFBRSxPQUFPLE9BQU8sTUFBTSxHQUFHLEVBQUU7QUFDNUIsZ0JBQWMsR0FBRyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7QUFhdkM7QUFFQSxTQUFTLGNBQ1AsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0E7QUFDQSxVQUFRLElBQUk7QUFBQSxPQUFVLENBQUMsR0FBRztBQUMxQixJQUFFLE9BQU8sTUFBTSxLQUFLO0FBQ3BCLFVBQVEsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDckMsUUFBTSxPQUFPLEVBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdEMsTUFBSTtBQUFNLGVBQVcsS0FBSztBQUFNLGNBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNqRCxVQUFRLElBQUksUUFBUSxDQUFDO0FBQUE7QUFBQSxDQUFNO0FBQzdCO0FBSUEsUUFBUSxJQUFJLFFBQVEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVwQyxJQUFJO0FBQU0sVUFBUSxJQUFJO0FBQUE7QUFDakIsVUFBUTsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImYiXQp9Cg==
