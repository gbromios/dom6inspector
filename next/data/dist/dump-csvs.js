// ../lib/src/join.ts
var JOIN_PART = /^\s*(\w+)\s*\[\s*(\w+)\s*\]\s*(?:=\s*(\w+)\s*)?$/;
function stringToJoin(s, table, tableMap) {
  const parts = s.split("+");
  if (parts.length < 2)
    throw new Error(`bad join "${s}": not enough joins`);
  const joins = [];
  for (const p of parts) {
    const [_, tableName, columnName, propName] = p.match(JOIN_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE[COL]=PROP"`);
    joins.push([tableName, columnName, propName]);
  }
  if (tableMap)
    for (const j of joins)
      validateJoin(j, table, tableMap);
  return joins;
}
function validateJoin(join, table, tableMap) {
  const [tableName, columnName, propName] = join;
  const s = `${tableName}[${columnName}]${propName ? "=" + propName : ""}`;
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
  if (propName && jTable.schema.columnsByName[propName]) {
    throw new Error(`bad join "${s}": "${propName}" is already used!`);
  }
}
function joinToString(joins) {
  return joins.map(([t, c, p]) => `${t}[${c}]` + (p ? `=${p}` : "")).join(" + ");
}
var JOINED_PART = /^(\w+)\.(\w+)=(\w+)$/;
function stringToJoinedBy(s) {
  const parts = s.split(",");
  if (parts.length < 1)
    throw new Error(`bad joinedBy doesnt exist?`);
  const joinedBy = [];
  for (const p of parts) {
    const [_, tableName, columnName, propName] = p.match(JOINED_PART) ?? [];
    if (!tableName || !columnName || !propName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE.COL=PROP"`);
    joinedBy.push([tableName, columnName, propName]);
  }
  return joinedBy;
}
function joinedByToString(joins) {
  return joins.map(([t, c, p]) => `${t}.${c}=${p}`).join(",");
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
      this.joins = stringToJoin(joins).map(([t, c, p]) => [t, c, p ?? t]);
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
      const [tn, cn, pn] = j;
      const t = tables[tn];
      const jb = t.schema.joinedBy;
      if (jb.some(([jbtn, _, jbpn]) => jbtn === tn && jbpn === pn))
        console.warn(`${tn} already joined ${j}`);
      else
        jb.push([jt.schema.name, cn, pn]);
    }
    if (addData) {
      for (const [tn, cn, pn] of jt.schema.joins) {
        for (const r of jt.rows) {
          const jid = r[cn];
          if (jid === 0)
            continue;
          const jr = tables[tn].map.get(jid);
          if (!jr) {
            console.warn(`${jt.name} MISSED A JOIN ${tn}[${cn}]=${pn}: NOTHING THERE`, r);
            break;
          }
          const prop = pn ?? jt.name;
          if (jr[prop])
            jr[prop].push(r);
          else
            jr[prop] = [r];
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
      for (const [aT, aF, aP] of t.schema.joins) {
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
            console.error(`row has a missing id?`, a, idA, r, `${aT}[${aF}]=${aP}`);
            continue;
          }
          (a[aP ?? t.name] ??= []).push(r);
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
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_nation.csv": {
    name: "AttributeByNation",
    key: "__rowId",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_spell.csv": {
    name: "AttributeBySpell",
    key: "__rowId",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/attributes_by_weapon.csv": {
    name: "AttributeByWeapon",
    key: "__rowId",
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/buffs_1_types.csv": {
    name: "BuffBit1",
    key: "__rowId",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/buffs_2_types.csv": {
    name: "BuffBit2",
    key: "__rowId",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  "../../gamedata/coast_leader_types_by_nation.csv": {
    name: "CoastLeaderTypeByNation",
    key: "__rowId",
    // removed after joinTables
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/coast_troop_types_by_nation.csv": {
    name: "CoastTroopTypeByNation",
    key: "__rowId",
    // removed after joinTables
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/effect_modifier_bits.csv": {
    name: "SpellBit",
    key: "__rowId",
    // TODO - need to join
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
    // removed after joinTables
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  "../../gamedata/fort_troop_types_by_nation.csv": {
    name: "FortTroopTypeByNation",
    key: "__rowId",
    // removed after joinTables
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  },
  /* TODO turn to constants
  '../../gamedata/magic_paths.csv': {
    key: 'number',
    name: 'MagicPath',
    ignoreFields: new Set(['test']),
  },
  */
  "../../gamedata/map_terrain_types.csv": {
    key: "bit_value",
    // removed after joinTables
    name: "TerrainTypeBit",
    ignoreFields: /* @__PURE__ */ new Set(["test"])
  },
  /* TODO - turn to constant
  '../../gamedata/monster_tags.csv': {
    key: 'number',
    name: 'MonsterTag',
    ignoreFields: new Set(['test']),
  },
  */
  /* TODO - turn to constant
   '../../gamedata/nametypes.csv': {
     key: 'id',
     name: 'NameType',
   },
   */
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
  /*
  '../../gamedata/special_unique_summons.csv': {
    name: 'SpecialUniqueSummon',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  */
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
  /*
  '../../gamedata/terrain_specific_summons.csv': {
    name: 'TerrainSpecificSummon',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/unit_effects.csv': {
    name: 'UnitEffect',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  */
  // removed after joinTables
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
    makeUnitByUnitSummon(tables),
    makeUnitBySpell(tables)
  );
  makeMiscUnit(tables);
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
  let us = 0;
  let ut = 0;
  for (const unit of tables.Unit.rows) {
    ut++;
    if (unit.source)
      us++;
  }
  console.log(`${us} / ${ut} units have sources`);
  console.log("Unit joined by?", tables.Unit.schema.joinedBy);
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
    joins: "Nation[nationId]=Sites+MagicSite[siteId]=Nations",
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
    joins: "Spell[spellId]=Nations+Nation[nationId]=Spells",
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
    joins: "Spell[spellId]=OnlyUnits+Unit[unitId]=Spells",
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
    joins: "MagicSite[siteId]=Units+Unit[unitId]=Source",
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
      const nj = site.Nations?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          "mixed up cap-only mon site",
          k,
          site.id,
          site.name,
          site.Nations
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
      const nj = site.Nations?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          "mixed up cap-only cmdr site",
          k,
          site.id,
          site.name,
          site.Nations
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
    true
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
function makeUnitByUnitSummon(tables) {
  const { Unit } = tables;
  const schema = new Schema({
    name: "UnitBySummoner",
    key: "__rowId",
    joins: "Unit[summonerId]=Summons+Unit[unitId]=Source",
    flagsUsed: 1,
    overrides: {},
    fields: ["unitId", "summonerId", "summonType", "summonStrength", "asTag"],
    rawFields: {
      unitId: 0,
      summonerId: 1,
      summonType: 2,
      summonStrength: 3,
      asTag: 4
    },
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
        name: "asTag",
        index: 4,
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
    if (summoner.mountmnr) {
      addRow(8 /* MOUNT */, 1, summoner.id, summoner.mountmnr);
    }
  }
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true
  );
}
function makeUnitByNation(tables) {
  const schema = new Schema({
    name: "UnitByNation",
    key: "__rowId",
    flagsUsed: 0,
    overrides: {},
    rawFields: { nationId: 0, unitId: 1, recType: 2 },
    joins: "Nation[nationId]=Units+Unit[unitId]=Source",
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
    true
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
        nationId,
        recType,
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
function makeMiscUnit(tables) {
  const {
    Unit,
    UnitByNation,
    UnitBySpell,
    UnitBySummoner,
    UnitBySite
  } = tables;
  const sources = new Map(
    Unit.rows.map((unit) => [unit.id, { unit, src: [] }])
  );
  for (const r of UnitByNation.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySpell.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySummoner.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySite.rows)
    sources.get(r.unitId).src.push(r);
  for (const { unit, src } of sources.values()) {
    if (src.length)
      continue;
    console.log(`Unit#${unit.id} : ${unit.name} has no sources`);
  }
}
function makeUnitBySpell(tables) {
  const { Unit, Spell } = tables;
  const schema = new Schema({
    name: "UnitBySpell",
    key: "__rowId",
    joins: "Spell[spellId]=Summons+Unit[unitId]=Source",
    flagsUsed: 0,
    overrides: {},
    fields: [
      "unitId",
      "spellId",
      "summonType",
      "summonStrength"
    ],
    rawFields: {
      unitId: 0,
      spellId: 1,
      summonType: 2,
      summonStrength: 3
    },
    columns: [
      new NumericColumn({
        name: "unitId",
        index: 0,
        type: 8 /* I32 */
      }),
      new NumericColumn({
        name: "spellId",
        index: 1,
        type: 8 /* I32 */
      }),
      new NumericColumn({
        name: "summonType",
        index: 2,
        type: 8 /* I32 */
      }),
      new NumericColumn({
        name: "summonStrength",
        index: 3,
        type: 8 /* I32 */
      })
      /*
      new NumericColumn({
        name: 'specialCondition',
        index: 4,
        type: COLUMN.U8,
      }),
      */
    ]
  });
  const rows = [];
  function addRow(unitId, spellId, summonType, summonStrength) {
    rows.push({
      unitId,
      spellId,
      summonType,
      summonStrength,
      __rowId: rows.length
    });
  }
  for (const spell of Spell.rows) {
    let summons = null;
    let summonType = 0 /* BASIC */;
    let summonStrength = spell.effects_count;
    if (SPECIAL_SUMMON[spell.id]) {
      summons = SPECIAL_SUMMON[spell.id];
      if (!Array.isArray(summons))
        throw new Error("u go to hell now");
      switch (spell.id) {
        case 859:
          addRow(summons[0], 859, 0 /* BASIC */, summonStrength);
          addRow(summons[1], 859, 64 /* SPECIAL_HOG */, summonStrength);
          break;
        case 607:
          for (const uid of summons)
            addRow(
              uid,
              607,
              4 /* COMMANDER */,
              summonStrength
            );
          break;
        case 1080:
          for (const uid of summons)
            addRow(
              uid,
              1080,
              128 /* PICK_ONE */ | 4 /* COMMANDER */,
              summonStrength
            );
          break;
        case 480:
        case 1410:
          addRow(summons[0], spell.id, 16 /* REMOTE */ | 4 /* COMMANDER */, 1);
          addRow(summons[1], spell.id, 16 /* REMOTE */, summonStrength);
          break;
        case 1219:
          for (const uid of summons)
            addRow(
              uid,
              1219,
              0 /* BASIC */,
              1
              // TODO - probably need to look these up?
            );
          break;
        default:
          throw new Error(`unhandled special summon for spell id ${spell.id}?`);
      }
      continue;
    }
    switch (spell.effect_number) {
      case 1:
        summons = spell.raw_value;
        break;
      case 21:
        summonType |= 4 /* COMMANDER */;
        summons = spell.raw_value;
        break;
      case 37:
        summons = spell.raw_value;
        summonType |= 16 /* REMOTE */;
      case 38:
        summonType |= 1 /* TEMPORARY */;
        break;
      case 43:
        summons = spell.raw_value;
        summonType |= 32 /* COMBAT */ | 16 /* EDGE */;
        break;
      case 50:
        summons = spell.raw_value;
        summonType |= 256 /* ASSASSIN */ | 4 /* COMMANDER */;
        break;
      case 68:
        summons = spell.raw_value;
        break;
      case 89:
        let idx = Number(spell.raw_value) || Number(spell.damage);
        if (idx < 0)
          idx *= -1;
        summons = UNIQUE_SUMMON[idx];
        if (!summons) {
          console.error(`still fucked up unique summon shit @ ${idx}`, spell);
          throw new Error("piss city");
        }
        summonType |= 4 /* COMMANDER */ | 2 /* UNIQUE */;
        break;
      case 93:
        summons = spell.raw_value;
        summonType |= 4 /* COMMANDER */ | 2 /* UNIQUE */;
        break;
      case 119:
        summons = spell.raw_value;
        summonType |= 4 /* COMMANDER */ | 512 /* STEALTHY */;
        break;
      case 126:
        summonType |= 32 /* COMBAT */ | 8 /* NEUTRAL */;
        summons = spell.raw_value;
        break;
      case 137:
        summonType |= 2 /* UNIQUE */ | 4 /* COMMANDER */ | 1024 /* ALIVE_ONLY */;
        summons = spell.raw_value;
        break;
      case 141:
        summonStrength = 2;
        summons = spell.raw_value;
        break;
      case 166:
        summons = spell.raw_value;
        break;
      case 130:
      case 54:
      case 127:
      case 35:
        continue;
      default:
        continue;
    }
    if (!summons) {
      summons = spell.damage;
      if (!summons) {
        console.error(
          "???? " + spell.id + ", " + spell.effect_number + "->" + summons
        );
        continue;
      }
    }
    if (!spell.ritual)
      summonType |= 32 /* COMBAT */;
    if (typeof summons === "bigint")
      summons = Number(summons);
    if (typeof summons === "number") {
      if (summons < 0) {
        if (!MONTAGS[summons]) {
          throw new Error(`missed montag ${summons}`);
        }
        summons = MONTAGS[summons];
        summonType |= 128 /* PICK_ONE */;
      } else {
        summons = [summons];
      }
    }
    if (!Array.isArray(summons)) {
      console.log("WTF IS THIS", summons);
      throw new Error("YOU FUCKED UP");
    }
    if (!summons.length) {
      continue;
    }
    for (const uid of summons) {
      const unit = Unit.map.get(uid);
      if (!unit) {
        console.error(`${spell.id}:${spell.name} summons unknown creature ${uid}`);
        continue;
      }
      addRow(uid, spell.id, summonType, summonStrength);
      if (4 /* COMMANDER */ & summonType && !(unit.type & 1 /* COMMANDER */)) {
        unit.type |= 1 /* COMMANDER */;
      }
    }
  }
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true
  );
}
var MONTAGS = {
  // fay folk
  [-26]: [],
  // dwarfs
  [-21]: [3425, 3426, 3427, 3428],
  //Random Bird (Falcon, Black Hawk, Swan or Strange Bird)
  [-20]: [3371, 517, 2929, 3327],
  // Lions
  [-19]: [3363, 3364, 3365, 3366],
  // Soul trap something or other?
  [-18]: [],
  // Yatas and Pairikas
  [-17]: [2632, 2633, 2634, 2636],
  // Celestial Yazad
  [-16]: [2620, 2621, 2622, 2623, 2624, 2625],
  // TODO - need to figure out which monsters these really are (crossbreends)
  [-12]: [530],
  // 3% good?
  [-11]: [530],
  // bad
  [-10]: [530],
  // good
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
var SPECIAL_SUMMON = {
  // these are not montags per se, im sure there are reasons for this.
  // tartarian Gate / effect 76
  [1080]: [771, 772, 773, 774, 775, 776, 777],
  // ea argartha "unleashed imprisoned ones" effect 116
  [607]: [2498, 2499, 2500],
  // angelic host spell 480  weird double summon (eff 37)
  [480]: [465, 3870],
  // hordes from hell weird double summon (eff 37)
  [1410]: [304, 303],
  // iron pig + iron boar for ea marverni...
  [859]: [924, 1808],
  // ghost ship armada global spell 1219 effect 81 (global) and damage === 43
  [1219]: [3348, 3349, 3350, 3351, 3352]
};
var UNIQUE_SUMMON = {
  // Bind Ice Devil
  1: [306, 821, 822, 823, 824, 825],
  // Bind Arch Devil
  2: [305, 826, 827, 828, 829],
  // Bind Heliophagus
  3: [492, 818, 819, 820],
  // King of Elemental Earth
  4: [906, 469],
  // Father Illearth
  5: [470],
  // Queen of Elemental Water
  6: [359, 907, 908],
  // Queen of Elemental Air
  7: [563, 911, 912],
  // King of Elemental Fire
  8: [631, 910],
  // King of Banefires
  9: [909],
  // Bind Demon Lord
  10: [446, 810, 900, 1405, 2277, 2278],
  // Awaken Treelord
  11: [621, 980, 981],
  // Call Amesha Spenta
  12: [1375, 1376, 1377, 1492, 1493, 1494],
  // Summon Tlaloque
  13: [1484, 1485, 1486, 1487],
  // Release Lord of Civilization
  14: [2063, 2065, 2066, 2067, 2064, 2062],
  // ????
  15: [],
  // greater daeva
  16: [2612, 2613, 2614, 2615, 2616, 2617],
  // Balam
  17: [2765, 2768, 2771, 2774],
  // Chaac
  18: [2778, 2779, 2780, 2781],
  //Sanguine Heritage
  19: [1019, 1035, 3244, 3245, 3251, 3252, 3253, 3255],
  // Mandeha
  20: [1748, 3635, 3636],
  // 4d dwarf
  21: [3425, 3426, 3427, 3428]
};

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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9qb2luLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2VyaWFsaXplLnRzIiwgIi4uLy4uL2xpYi9zcmMvY29sdW1uLnRzIiwgIi4uLy4uL2xpYi9zcmMvdXRpbC50cyIsICIuLi8uLi9saWIvc3JjL3NjaGVtYS50cyIsICIuLi8uLi9saWIvc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9jbGkvY3N2LWRlZnMudHMiLCAiLi4vc3JjL2NsaS9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL2NsaS9kdW1wLWNzdnMudHMiLCAiLi4vc3JjL2NsaS9qb2luLXRhYmxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuXG5jb25zdCBKT0lOX1BBUlQgPSAvXlxccyooXFx3KylcXHMqXFxbXFxzKihcXHcrKVxccypcXF1cXHMqKD86PVxccyooXFx3KylcXHMqKT8kL1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9Kb2luIChcbiAgczogc3RyaW5nLFxuICB0YWJsZT86IFRhYmxlLFxuICB0YWJsZU1hcD86IFJlY29yZDxzdHJpbmcsIFRhYmxlPlxuKTogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XVtdIHtcbiAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcrJyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBub3QgZW5vdWdoIGpvaW5zYCk7XG4gIGNvbnN0IGpvaW5zOiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZz9dW10gPSBbXTtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgY29uc3QgW18sIHRhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gcC5tYXRjaChKT0lOX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRVtDT0xdPVBST1BcImApO1xuXG4gICAgam9pbnMucHVzaChbdGFibGVOYW1lLCBjb2x1bW5OYW1lLCBwcm9wTmFtZV0pO1xuICB9XG4gIGlmICh0YWJsZU1hcCkgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB2YWxpZGF0ZUpvaW4oaiwgdGFibGUhLCB0YWJsZU1hcCk7XG4gIHJldHVybiBqb2lucztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVKb2luIChcbiAgam9pbjogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XSxcbiAgdGFibGU6IFRhYmxlLFxuICB0YWJsZU1hcDogUmVjb3JkPHN0cmluZywgVGFibGU+XG4pIHtcbiAgY29uc3QgW3RhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gam9pbjtcbiAgY29uc3QgcyA9IGAke3RhYmxlTmFtZX1bJHtjb2x1bW5OYW1lfV0ke3Byb3BOYW1lID8gJz0nICsgcHJvcE5hbWUgOiAnJ31gXG4gIGNvbnN0IGNvbCA9IHRhYmxlLnNjaGVtYS5jb2x1bW5zQnlOYW1lW2NvbHVtbk5hbWVdO1xuICBpZiAoIWNvbClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7dGFibGUubmFtZX1cIiBoYXMgbm8gXCIke2NvbHVtbk5hbWV9XCJgKTtcbiAgY29uc3QgalRhYmxlID0gdGFibGVNYXBbdGFibGVOYW1lXTtcbiAgaWYgKCFqVGFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3RhYmxlTmFtZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICBjb25zdCBqQ29sID0galRhYmxlLnNjaGVtYS5jb2x1bW5zQnlOYW1lW2pUYWJsZS5zY2hlbWEua2V5XTtcbiAgaWYgKCFqQ29sKVxuICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gXCIke3N9XCI6IFwiJHt0YWJsZU5hbWV9XCIgaGFzIG5vIGtleT8/Pz9gKTtcbiAgaWYgKGpDb2wudHlwZSAhPT0gY29sLnR5cGUpXG4gICAgLy90aHJvdyBuZXcgRXJyb3IoKVxuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBpZmZ5IGpvaW4gXCIke1xuICAgICAgICBzXG4gICAgICB9XCI6IFwiJHtcbiAgICAgICAgY29sdW1uTmFtZVxuICAgICAgfVwiICgke1xuICAgICAgICBjb2wubGFiZWxcbiAgICAgIH0pIGlzIGEgZGlmZmVyZW50IHR5cGUgdGhhbiAke1xuICAgICAgICB0YWJsZU5hbWVcbiAgICAgIH0uJHtcbiAgICAgICAgakNvbC5uYW1lXG4gICAgICB9ICgke1xuICAgICAgICBqQ29sLmxhYmVsXG4gICAgICB9KWBcbiAgICApO1xuXG4gIGlmIChwcm9wTmFtZSAmJiBqVGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbcHJvcE5hbWVdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3Byb3BOYW1lfVwiIGlzIGFscmVhZHkgdXNlZCFgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pblRvU3RyaW5nIChqb2luczogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XVtdKSB7XG4gIHJldHVybiBqb2lucy5tYXAoKFt0LCBjLCBwXSkgPT4gYCR7dH1bJHtjfV1gICsgKHAgPyBgPSR7cH1gIDogJycpKS5qb2luKCcgKyAnKTtcbn1cblxuY29uc3QgSk9JTkVEX1BBUlQgPSAvXihcXHcrKVxcLihcXHcrKT0oXFx3KykkLztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbmVkQnkgKFxuICBzOiBzdHJpbmcsXG4pOiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnLCcpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMSkgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbmVkQnkgZG9lc250IGV4aXN0P2ApO1xuICBjb25zdCBqb2luZWRCeTogW3N0cmluZywgc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgY29uc3QgW18sIHRhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gcC5tYXRjaChKT0lORURfUEFSVCkgPz8gW107XG4gICAgaWYgKCF0YWJsZU5hbWUgfHwgIWNvbHVtbk5hbWUgfHwgIXByb3BOYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRS5DT0w9UFJPUFwiYCk7XG5cbiAgICBqb2luZWRCeS5wdXNoKFt0YWJsZU5hbWUsIGNvbHVtbk5hbWUsIHByb3BOYW1lXSk7XG4gIH1cbiAgcmV0dXJuIGpvaW5lZEJ5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbmVkQnlUb1N0cmluZyAoam9pbnM6IFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXVtdKSB7XG4gIHJldHVybiBqb2lucy5tYXAoKFt0LCBjLCBwXSkgPT4gYCR7dH0uJHtjfT0ke3B9YCkuam9pbignLCcpO1xufVxuIiwgImNvbnN0IF9fdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IF9fdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXk7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0OiBVaW50OEFycmF5LCBpOiBudW1iZXIpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0PzogVWludDhBcnJheSwgaSA9IDApIHtcbiAgaWYgKHMuaW5kZXhPZignXFwwJykgIT09IC0xKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZignXFwwJyk7XG4gICAgY29uc29sZS5lcnJvcihgJHtpfSA9IE5VTEwgPyBcIi4uLiR7cy5zbGljZShpIC0gMTAsIGkgKyAxMCl9Li4uYCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd3aG9vcHNpZScpO1xuICB9XG4gIGNvbnN0IGJ5dGVzID0gX190ZXh0RW5jb2Rlci5lbmNvZGUocyArICdcXDAnKTtcbiAgaWYgKGRlc3QpIHtcbiAgICBkZXN0LnNldChieXRlcywgaSk7XG4gICAgcmV0dXJuIGJ5dGVzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoaTogbnVtYmVyLCBhOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gIGxldCByID0gMDtcbiAgd2hpbGUgKGFbaSArIHJdICE9PSAwKSB7IHIrKzsgfVxuICByZXR1cm4gW19fdGV4dERlY29kZXIuZGVjb2RlKGEuc2xpY2UoaSwgaStyKSksIHIgKyAxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpZ0JveVRvQnl0ZXMgKG46IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAvLyB0aGlzIGlzIGEgY29vbCBnYW1lIGJ1dCBsZXRzIGhvcGUgaXQgZG9lc24ndCB1c2UgMTI3KyBieXRlIG51bWJlcnNcbiAgY29uc3QgYnl0ZXMgPSBbMF07XG4gIGlmIChuIDwgMG4pIHtcbiAgICBuICo9IC0xbjtcbiAgICBieXRlc1swXSA9IDEyODtcbiAgfVxuXG4gIC8vIFdPT1BTSUVcbiAgd2hpbGUgKG4pIHtcbiAgICBpZiAoYnl0ZXNbMF0gPT09IDI1NSkgdGhyb3cgbmV3IEVycm9yKCdicnVoIHRoYXRzIHRvbyBiaWcnKTtcbiAgICBieXRlc1swXSsrO1xuICAgIGJ5dGVzLnB1c2goTnVtYmVyKG4gJiAyNTVuKSk7XG4gICAgbiA+Pj0gOG47XG4gIH1cblxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0JpZ0JveSAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICBjb25zdCBMID0gTnVtYmVyKGJ5dGVzW2ldKTtcbiAgY29uc3QgbGVuID0gTCAmIDEyNztcbiAgY29uc3QgcmVhZCA9IDEgKyBsZW47XG4gIGNvbnN0IG5lZyA9IChMICYgMTI4KSA/IC0xbiA6IDFuO1xuICBjb25zdCBCQjogYmlnaW50W10gPSBBcnJheS5mcm9tKGJ5dGVzLnNsaWNlKGkgKyAxLCBpICsgcmVhZCksIEJpZ0ludCk7XG4gIGlmIChsZW4gIT09IEJCLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdiaWdpbnQgY2hlY2tzdW0gaXMgRlVDSz8nKTtcbiAgcmV0dXJuIFtsZW4gPyBCQi5yZWR1Y2UoYnl0ZVRvQmlnYm9pKSAqIG5lZyA6IDBuLCByZWFkXVxufVxuXG5mdW5jdGlvbiBieXRlVG9CaWdib2kgKG46IGJpZ2ludCwgYjogYmlnaW50LCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIG4gfCAoYiA8PCBCaWdJbnQoaSAqIDgpKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MgfSBmcm9tICcuJztcbmltcG9ydCB7IGJpZ0JveVRvQnl0ZXMsIGJ5dGVzVG9CaWdCb3ksIGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5cbmV4cG9ydCB0eXBlIENvbHVtbkFyZ3MgPSB7XG4gIHR5cGU6IENPTFVNTjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICB3aWR0aD86IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgZmxhZz86IG51bWJlcnxudWxsO1xuICBiaXQ/OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEICAgICAgID0gMCxcbiAgU1RSSU5HICAgICAgID0gMSxcbiAgQk9PTCAgICAgICAgID0gMixcbiAgVTggICAgICAgICAgID0gMyxcbiAgSTggICAgICAgICAgID0gNCxcbiAgVTE2ICAgICAgICAgID0gNSxcbiAgSTE2ICAgICAgICAgID0gNixcbiAgVTMyICAgICAgICAgID0gNyxcbiAgSTMyICAgICAgICAgID0gOCxcbiAgQklHICAgICAgICAgID0gOSxcbiAgU1RSSU5HX0FSUkFZID0gMTcsXG4gIFU4X0FSUkFZICAgICA9IDE5LFxuICBJOF9BUlJBWSAgICAgPSAyMCxcbiAgVTE2X0FSUkFZICAgID0gMjEsXG4gIEkxNl9BUlJBWSAgICA9IDIyLFxuICBVMzJfQVJSQVkgICAgPSAyMyxcbiAgSTMyX0FSUkFZICAgID0gMjQsXG4gIEJJR19BUlJBWSAgICA9IDI1LFxufTtcblxuZXhwb3J0IGNvbnN0IENPTFVNTl9MQUJFTCA9IFtcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkcnLFxuICAnQk9PTCcsXG4gICdVOCcsXG4gICdJOCcsXG4gICdVMTYnLFxuICAnSTE2JyxcbiAgJ1UzMicsXG4gICdJMzInLFxuICAnQklHJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkdfQVJSQVknLFxuICAnVThfQVJSQVknLFxuICAnSThfQVJSQVknLFxuICAnVTE2X0FSUkFZJyxcbiAgJ0kxNl9BUlJBWScsXG4gICdVMzJfQVJSQVknLFxuICAnSTMyX0FSUkFZJyxcbiAgJ0JJR19BUlJBWScsXG5dO1xuXG5leHBvcnQgdHlwZSBOVU1FUklDX0NPTFVNTiA9XG4gIHxDT0xVTU4uVThcbiAgfENPTFVNTi5JOFxuICB8Q09MVU1OLlUxNlxuICB8Q09MVU1OLkkxNlxuICB8Q09MVU1OLlUzMlxuICB8Q09MVU1OLkkzMlxuICB8Q09MVU1OLlU4X0FSUkFZXG4gIHxDT0xVTU4uSThfQVJSQVlcbiAgfENPTFVNTi5VMTZfQVJSQVlcbiAgfENPTFVNTi5JMTZfQVJSQVlcbiAgfENPTFVNTi5VMzJfQVJSQVlcbiAgfENPTFVNTi5JMzJfQVJSQVlcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbiAgW0NPTFVNTi5VOF9BUlJBWV06IDEsXG4gIFtDT0xVTU4uSThfQVJSQVldOiAxLFxuICBbQ09MVU1OLlUxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uSTE2X0FSUkFZXTogMixcbiAgW0NPTFVNTi5VMzJfQVJSQVldOiA0LFxuICBbQ09MVU1OLkkzMl9BUlJBWV06IDQsXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCaWdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5CSUc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jvb2xDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJPT0wge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJPT0w7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZ0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uU1RSSU5HIHwgQ09MVU1OLlNUUklOR19BUlJBWSB7XG4gIHJldHVybiAodHlwZSAmIDE1KSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uPFQgPSBhbnksIFIgZXh0ZW5kcyBVaW50OEFycmF5fG51bWJlciA9IGFueT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IFRbXTtcbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUO1xuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtUW10sIG51bWJlcl07XG4gIGZyb21CeXRlcyAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVCwgbnVtYmVyXTtcbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXTtcbiAgc2VyaWFsaXplUm93ICh2OiBUKTogUixcbiAgc2VyaWFsaXplQXJyYXkgKHY6IFRbXSk6IFIsXG4gIHRvU3RyaW5nICh2OiBzdHJpbmcpOiBhbnk7XG4gIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBiaXQ6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xuICByZWFkb25seSBvZmZzZXQ6IG51bWJlcnxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxzdHJpbmcsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVk7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLlNUUklOR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAzO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IGluZGV4LCBuYW1lLCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc1N0cmluZ0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignJHtuYW1lfSBpcyBub3QgYSBzdHJpbmcgY29sdW1uJyk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCdmb28nKSAhPT0gJ3N0cmluZycpXG4gICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKGBzZWVtcyBvdmVycmlkZSBmb3IgJHtuYW1lfSBkb2VzIG5vdCByZXR1cm4gYSBzdHJpbmdgKTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICAvLyBUT0RPIC0gYXJyYXkgc2VwYXJhdG9yIGFyZyFcbiAgICByZXR1cm4gdi5zcGxpdCgnLCcpLm1hcChpID0+IHRoaXMuZnJvbVRleHQoaS50cmltKCksIHUsIGEpKTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nIHtcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZ1tdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3Qgc3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBzdHJpbmdzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbc3RyaW5ncywgcmVhZF1cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogc3RyaW5nKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHN0cmluZ1RvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBzdHJpbmdbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5zdHJpbmdUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoaXRlbXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxudW1iZXIsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogTlVNRVJJQ19DT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IDF8Mnw0O1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAwO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc051bWVyaWNDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaXMgbm90IGEgbnVtZXJpYyBjb2x1bW5gKTtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ251bWJlcicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcihgJHtuYW1lfSBvdmVycmlkZSBtdXN0IHJldHVybiBhIG51bWJlcmApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5pc0FycmF5ID0gKHRoaXMudHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICAgIHRoaXMud2lkdGggPSBDT0xVTU5fV0lEVEhbdGhpcy50eXBlXTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbnVtYmVyW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlciB7XG4gICAgIHJldHVybiB0aGlzLm92ZXJyaWRlID8gKCB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpICkgOlxuICAgICAgdiA/IE51bWJlcih2KSB8fCAwIDogMDtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlcltdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgbnVtYmVyczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICAgICAgbnVtYmVycy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW251bWJlcnMsIHJlYWRdO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgXzogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICAgIGlmICh0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaW0gYXJyYXkgdGhvJylcbiAgICAgIHJldHVybiB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBudW1iZXJGcm9tVmlldyAoaTogbnVtYmVyLCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHN3aXRjaCAodGhpcy50eXBlICYgMTUpIHtcbiAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3aG9tc3QnKTtcbiAgICB9XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHRoaXMud2lkdGgpO1xuICAgIHRoaXMucHV0Qnl0ZXModiwgMCwgYnl0ZXMpO1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KHY6IG51bWJlcltdKTogVWludDhBcnJheSB7XG4gICAgaWYgKHYubGVuZ3RoID4gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ3RvbyBiaWchJyk7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSgxICsgdGhpcy53aWR0aCAqIHYubGVuZ3RoKVxuICAgIGxldCBpID0gMTtcbiAgICBmb3IgKGNvbnN0IG4gb2Ygdikge1xuICAgICAgYnl0ZXNbMF0rKztcbiAgICAgIHRoaXMucHV0Qnl0ZXMobiwgaSwgYnl0ZXMpO1xuICAgICAgaSs9dGhpcy53aWR0aDtcbiAgICB9XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgcHJpdmF0ZSBwdXRCeXRlcyh2OiBudW1iZXIsIGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBmb3IgKGxldCBvID0gMDsgbyA8IHRoaXMud2lkdGg7IG8rKylcbiAgICAgIGJ5dGVzW2kgKyBvXSA9ICh2ID4+PiAobyAqIDgpKSAmIDI1NTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCaWdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJpZ2ludCwgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQklHIHwgQ09MVU1OLkJJR19BUlJBWVxuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMjtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNCaWdDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZVxuICAgIHRoaXMuaXNBcnJheSA9ICh0eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG5cbiAgICB0aGlzLmxhYmVsID0gQ09MVU1OX0xBQkVMW3RoaXMudHlwZV07XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYmlnaW50W10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdikgcmV0dXJuIDBuO1xuICAgIHJldHVybiBCaWdJbnQodik7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludFtdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgYmlnYm9pczogYmlnaW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBiaWdib2lzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbYmlnYm9pcywgcmVhZF07XG5cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9CaWdCb3koaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYmlnaW50KTogVWludDhBcnJheSB7XG4gICAgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgcmV0dXJuIGJpZ0JveVRvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBiaWdpbnRbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5iaWdCb3lUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcyBCSUc/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCb29sQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxib29sZWFuLCBudW1iZXI+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJPT0wgPSBDT0xVTU4uQk9PTDtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uQk9PTF07XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyO1xuICByZWFkb25seSBvcmRlciA9IDE7XG4gIHJlYWRvbmx5IG9mZnNldCA9IDA7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgYml0LCBmbGFnLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdib29sZWFuJylcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJvb2wnKTtcbiAgICBpZiAoIWlzQm9vbENvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBib29sYCk7XG4gICAgaWYgKHR5cGVvZiBmbGFnICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBmbGFnIGlzIG5vdCBudW1iZXJgKTtcbiAgICBpZiAodHlwZW9mIGJpdCAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgYml0IGlzIG5vdCBudW1iZXJgKTtcbiAgICB0aGlzLmZsYWcgPSBmbGFnO1xuICAgIHRoaXMuYml0ID0gYml0O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBuZXZlcltdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKCF2IHx8IHYgPT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoX2k6IG51bWJlciwgX2J5dGVzOiBVaW50OEFycmF5KTogW25ldmVyW10sIG51bWJlcl0ge1xuICAgIHRocm93IG5ldyBFcnJvcignSSBORVZFUiBBUlJBWScpIC8vIHlldH4/XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtib29sZWFuLCBudW1iZXJdIHtcbiAgICAvLyAuLi4uaXQgZGlkIG5vdC5cbiAgICAvL2NvbnNvbGUubG9nKGBSRUFEIEZST00gJHtpfTogRE9FUyAke2J5dGVzW2ldfSA9PT0gJHt0aGlzLmZsYWd9YCk7XG4gICAgcmV0dXJuIFsoYnl0ZXNbaV0gJiB0aGlzLmZsYWcpID09PSB0aGlzLmZsYWcsIDBdO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFtDT0xVTU4uQk9PTCwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBib29sZWFuKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdiA/IHRoaXMuZmxhZyA6IDA7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheShfdjogYm9vbGVhbltdKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignaSB3aWxsIE5FVkVSIGJlY29tZSBBUlJBWScpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEZDb21wYXJhYmxlID0ge1xuICBvcmRlcjogbnVtYmVyLFxuICBiaXQ6IG51bWJlciB8IG51bGwsXG4gIGluZGV4OiBudW1iZXJcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBGaWVsZHMgKGE6IENvbHVtbiwgYjogQ29sdW1uKTogbnVtYmVyIHtcbiAgaWYgKGEuaXNBcnJheSAhPT0gYi5pc0FycmF5KSByZXR1cm4gYS5pc0FycmF5ID8gMSA6IC0xXG4gIHJldHVybiAoYS5vcmRlciAtIGIub3JkZXIpIHx8XG4gICAgKChhLmJpdCA/PyAwKSAtIChiLmJpdCA/PyAwKSkgfHxcbiAgICAoYS5pbmRleCAtIGIuaW5kZXgpO1xufVxuXG5leHBvcnQgdHlwZSBDb2x1bW4gPVxuICB8U3RyaW5nQ29sdW1uXG4gIHxOdW1lcmljQ29sdW1uXG4gIHxCaWdDb2x1bW5cbiAgfEJvb2xDb2x1bW5cbiAgO1xuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UZXh0IChcbiAgbmFtZTogc3RyaW5nLFxuICBpbmRleDogbnVtYmVyLFxuICBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzLFxuICBkYXRhOiBzdHJpbmdbXVtdLFxuKTogQ29sdW1uQXJnc3xudWxsIHtcbiAgY29uc3QgZmllbGQgPSB7XG4gICAgaW5kZXgsXG4gICAgbmFtZSxcbiAgICBvdmVycmlkZTogc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV0gYXMgdW5kZWZpbmVkIHwgKCguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSxcbiAgICB0eXBlOiBDT0xVTU4uVU5VU0VELFxuICAgIC8vIGF1dG8tZGV0ZWN0ZWQgZmllbGRzIHdpbGwgbmV2ZXIgYmUgYXJyYXlzLlxuICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgIG1heFZhbHVlOiAwLFxuICAgIG1pblZhbHVlOiAwLFxuICAgIHdpZHRoOiBudWxsIGFzIGFueSxcbiAgICBmbGFnOiBudWxsIGFzIGFueSxcbiAgICBiaXQ6IG51bGwgYXMgYW55LFxuICB9O1xuICBsZXQgaXNVc2VkID0gZmFsc2U7XG4gIC8vaWYgKGlzVXNlZCAhPT0gZmFsc2UpIGRlYnVnZ2VyO1xuICBmb3IgKGNvbnN0IHUgb2YgZGF0YSkge1xuICAgIGNvbnN0IHYgPSBmaWVsZC5vdmVycmlkZSA/IGZpZWxkLm92ZXJyaWRlKHVbaW5kZXhdLCB1LCBzY2hlbWFBcmdzKSA6IHVbaW5kZXhdO1xuICAgIGlmICghdikgY29udGludWU7XG4gICAgLy9jb25zb2xlLmVycm9yKGAke2luZGV4fToke25hbWV9IH4gJHt1WzBdfToke3VbMV19OiAke3Z9YClcbiAgICBpc1VzZWQgPSB0cnVlO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIodik7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkge1xuICAgICAgLy8gbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgZmllbGQudHlwZSA9IENPTFVNTi5TVFJJTkc7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSkge1xuICAgICAgY29uc29sZS53YXJuKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGhhcyBhIGZsb2F0PyBcIiR7dn1cIiAoJHtufSlcXHgxYlswbWApO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKG4pKSB7XG4gICAgICAvLyB3ZSB3aWxsIGhhdmUgdG8gcmUtZG8gdGhpcyBwYXJ0OlxuICAgICAgZmllbGQubWluVmFsdWUgPSAtSW5maW5pdHk7XG4gICAgICBmaWVsZC5tYXhWYWx1ZSA9IEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobiA8IGZpZWxkLm1pblZhbHVlKSBmaWVsZC5taW5WYWx1ZSA9IG47XG4gICAgICBpZiAobiA+IGZpZWxkLm1heFZhbHVlKSBmaWVsZC5tYXhWYWx1ZSA9IG47XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpc1VzZWQpIHtcbiAgICAvL2NvbnNvbGUuZXJyb3IoYFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX0gaXMgdW51c2VkP1xceDFiWzBtYClcbiAgICAvL2RlYnVnZ2VyO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1pblZhbHVlID09PSAwICYmIGZpZWxkLm1heFZhbHVlID09PSAxKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszNG0ke2l9OiR7bmFtZX0gYXBwZWFycyB0byBiZSBhIGJvb2xlYW4gZmxhZ1xceDFiWzBtYCk7XG4gICAgZmllbGQudHlwZSA9IENPTFVNTi5CT09MO1xuICAgIGZpZWxkLmJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgIGZpZWxkLmZsYWcgPSAxIDw8IChmaWVsZC5iaXQgJSA4KTtcbiAgICByZXR1cm4gZmllbGQ7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQklHIEJPWSBUSU1FXG4gIGZpZWxkLnR5cGUgPSBDT0xVTU4uQklHO1xuICByZXR1cm4gZmllbGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmdzRnJvbVR5cGUgKFxuICBuYW1lOiBzdHJpbmcsXG4gIHR5cGU6IENPTFVNTixcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbik6IENvbHVtbkFyZ3Mge1xuICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignaG93IHlvdSBnb25uYSB1c2UgaXQgdGhlbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgY29uc3QgYml0ID0gc2NoZW1hQXJncy5mbGFnc1VzZWQ7XG4gICAgICBjb25zdCBmbGFnID0gMSA8PCAoYml0ICUgOCk7XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgZmxhZywgYml0LCBvdmVycmlkZSB9O1xuXG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDEsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogMiwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiA0LCBvdmVycmlkZX07XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgd2F0IHR5cGUgaXMgdGhpcyAke3R5cGV9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21BcmdzIChhcmdzOiBDb2x1bW5BcmdzKTogQ29sdW1uIHtcbiAgc3dpdGNoIChhcmdzLnR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcigndW51c2VkIGZpZWxkIGNhbnQgYmUgdHVybmVkIGludG8gYSBDb2x1bW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICByZXR1cm4gbmV3IFN0cmluZ0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgaWYgKGFyZ3MudHlwZSAmIDE2KSB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1Y2ggdGhpbmcgYXMgYSBmbGFnIGFycmF5Jyk7XG4gICAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiBuZXcgQmlnQ29sdW1uKGFyZ3MpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHthcmdzLnR5cGV9YCk7XG4gIH1cbn1cbiIsICIvLyBqdXN0IGEgYnVuY2ggb2Ygb3V0cHV0IGZvcm1hdHRpbmcgc2hpdFxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlRGVjbyhuYW1lOiBzdHJpbmcsIHdpZHRoID0gODAsIHN0eWxlID0gOSkge1xuICBjb25zdCB7IFRMLCBCTCwgVFIsIEJSLCBIUiB9ID0gZ2V0Qm94Q2hhcnMoc3R5bGUpXG4gIGNvbnN0IG5hbWVXaWR0aCA9IG5hbWUubGVuZ3RoICsgMjsgLy8gd2l0aCBzcGFjZXNcbiAgY29uc3QgaFRhaWxXaWR0aCA9IHdpZHRoIC0gKG5hbWVXaWR0aCArIDYpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbiAgY21wRmllbGRzLFxufSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgeyBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGpvaW5Ub1N0cmluZywgam9pbmVkQnlUb1N0cmluZywgc3RyaW5nVG9Kb2luLCBzdHJpbmdUb0pvaW5lZEJ5IH0gZnJvbSAnLi9qb2luJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hQXJncyA9IHtcbiAgbmFtZTogc3RyaW5nO1xuICBrZXk6IHN0cmluZztcbiAgam9pbnM/OiBzdHJpbmc7XG4gIGpvaW5lZEJ5Pzogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgam9pbnM/OiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXTtcbiAgcmVhZG9ubHkgam9pbmVkQnk6IFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXVtdID0gW107XG4gIHJlYWRvbmx5IGtleTogc3RyaW5nO1xuICByZWFkb25seSBjb2x1bW5zQnlOYW1lOiBSZWNvcmQ8c3RyaW5nLCBDb2x1bW4+O1xuICByZWFkb25seSBmaXhlZFdpZHRoOiBudW1iZXI7IC8vIHRvdGFsIGJ5dGVzIHVzZWQgYnkgbnVtYmVycyArIGZsYWdzXG4gIHJlYWRvbmx5IGZsYWdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RyaW5nRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpZ0ZpZWxkczogbnVtYmVyO1xuICBjb25zdHJ1Y3Rvcih7IGNvbHVtbnMsIG5hbWUsIGZsYWdzVXNlZCwga2V5LCBqb2lucywgam9pbmVkQnkgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArICgoIWMuaXNBcnJheSAmJiBjLndpZHRoKSB8fCAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgaWYgKGpvaW5zKSB0aGlzLmpvaW5zID0gc3RyaW5nVG9Kb2luKGpvaW5zKVxuICAgICAgLm1hcCgoW3QsIGMsIHBdKSA9PiBbdCwgYywgcCA/PyB0XSk7XG4gICAgaWYgKGpvaW5lZEJ5KSB0aGlzLmpvaW5lZEJ5LnB1c2goLi4uc3RyaW5nVG9Kb2luZWRCeShqb2luZWRCeSkpO1xuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBsZXQgZiA9IHRydWU7XG4gICAgbGV0IGIgPSBmYWxzZTtcbiAgICBsZXQgZmYgPSAwO1xuICAgIGZvciAoY29uc3QgW2ksIGNdIG9mIHRoaXMuY29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICAgIGxldCBPQyA9IC0xO1xuICAgICAgLy9pZiAoYy50eXBlICYgMTYpIGJyZWFrO1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklOR19BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJR19BUlJBWTpcbiAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgaWYgKG8gPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRzbyA9IE1hdGgubWF4KDAsIGkgLSAyKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSwgaSwgbywgYERTTzoke2Rzb30uLiR7aSArIDJ9OmAsIGNvbHVtbnMuc2xpY2UoTWF0aC5tYXgoMCwgaSAtIDIpLCBpICsgMikpO1xuICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgbm90IGJlIScpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIERPTkUgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gdGhpcy5mbGFnRmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb29PU0FBU09BTycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgYmUhJylcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjLCBvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdib29vJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvOyBjLmJpdCA9IGZmKys7IGMuZmxhZyA9IDIgKiogKGMuYml0ICUgOCk7IC8vIGhlaGVoZVxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgIGlmIChjLmJpdCArIDEgPT09IHRoaXMuZmxhZ0ZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRScpXG4gICAgICAgICAgICBpZiAoYy5mbGFnIDwgMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCAtIDEpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUgLSAxJylcbiAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgIGlmICghYy53aWR0aCkgZGVidWdnZXI7XG4gICAgICAgICAgbyArPSBjLndpZHRoITtcbiAgICAgICAgICBpZiAobyA9PT0gdGhpcy5maXhlZFdpZHRoKSBmID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL2NvbnN0IHJuZyA9IE9DIDwgMCA/IGBgIDogYCAke09DfS4uJHtvfSAvICR7dGhpcy5maXhlZFdpZHRofWBcbiAgICAgIC8vY29uc29sZS5sb2coYFske2l9XSR7cm5nfWAsIGMubmFtZSwgYy5sYWJlbClcbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgbGV0IGpvaW5zOiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGxldCBqb2luZWRCeTogc3RyaW5nfHVuZGVmaW5lZDtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIFtrZXksIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIFtqb2lucywgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5lZEJ5LCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBjb25zb2xlLmxvZygnLSBCVUgnLCBuYW1lLCBrZXksIGpvaW5zLCBqb2luZWRCeSlcbiAgICBpZiAoIWpvaW5zKSBqb2lucyA9IHVuZGVmaW5lZDtcbiAgICBpZiAoIWpvaW5lZEJ5KSBqb2luZWRCeSA9IHVuZGVmaW5lZDtcbiAgICBjb25zdCBhcmdzID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGtleSxcbiAgICAgIGpvaW5zLFxuICAgICAgam9pbmVkQnksXG4gICAgICBjb2x1bW5zOiBbXSBhcyBDb2x1bW5bXSxcbiAgICAgIGZpZWxkczogW10gYXMgc3RyaW5nW10sXG4gICAgICBmbGFnc1VzZWQ6IDAsXG4gICAgICByYXdGaWVsZHM6IHt9LCAvLyBub25lIDo8XG4gICAgICBvdmVycmlkZXM6IHt9LCAvLyBub25lflxuICAgIH07XG5cbiAgICBjb25zdCBudW1GaWVsZHMgPSBieXRlc1tpKytdIHwgKGJ5dGVzW2krK10gPDwgOCk7XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIC8vIFRPRE8gLSBvbmx5IHdvcmtzIHdoZW4gMC1maWVsZCBzY2hlbWFzIGFyZW4ndCBhbGxvd2VkfiFcbiAgICB3aGlsZSAoaW5kZXggPCBudW1GaWVsZHMpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBieXRlc1tpKytdO1xuICAgICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgICBjb25zdCBmID0ge1xuICAgICAgICBpbmRleCwgbmFtZSwgdHlwZSxcbiAgICAgICAgd2lkdGg6IG51bGwsIGJpdDogbnVsbCwgZmxhZzogbnVsbCxcbiAgICAgICAgb3JkZXI6IDk5OVxuICAgICAgfTtcbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIGxldCBjOiBDb2x1bW47XG5cbiAgICAgIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG5cbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICAvL2lmIChjLm9mZnNldCAmJiBjLm9mZnNldCAhPT0gdG90YWxSZWFkKSB7IGRlYnVnZ2VyOyBjb25zb2xlLmxvZygnd29vcHNpZScpOyB9XG4gICAgICBsZXQgW3YsIHJlYWRdID0gYy5pc0FycmF5ID9cbiAgICAgICAgYy5hcnJheUZyb21CeXRlcyhpLCBieXRlcywgdmlldykgOlxuICAgICAgICBjLmZyb21CeXRlcyhpLCBieXRlcywgdmlldyk7XG5cbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKVxuICAgICAgICByZWFkID0gKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSA/IDEgOiAwO1xuXG4gICAgICBpICs9IHJlYWQ7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVhZDtcbiAgICAgIC8vIGRvbid0IHB1dCBmYWxzeSB2YWx1ZXMgb24gZmluYWwgb2JqZWN0cy4gbWF5IHJldmlzaXQgaG93IHRoaXMgd29ya3MgbGF0ZXJcbiAgICAgIC8vaWYgKGMuaXNBcnJheSB8fCB2KSByb3dbYy5uYW1lXSA9IHY7XG4gICAgICByb3dbYy5uYW1lXSA9IHY7XG4gICAgICAvL2NvbnN0IHcgPSBnbG9iYWxUaGlzLl9ST1dTW3RoaXMubmFtZV1bX19yb3dJZF1bYy5uYW1lXSAvLyBzcnMgYml6XG4gICAgICAvKlxuICAgICAgaWYgKHcgIT09IHYpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHcpIHx8IHcuc29tZSgobiwgaSkgPT4gbiAhPT0gdltpXSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBYWFhYWCAke3RoaXMubmFtZX1bJHtfX3Jvd0lkfV1bJHtjLm5hbWV9XSAke3d9IC0+ICR7dn1gKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYF9fX19fICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gPT0gJHt2fWApXG4gICAgICB9XG4gICAgICAqL1xuICAgIH1cbiAgICAvL2lmIChkYnIpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAgIFJFQUQ6ICR7dG90YWxSZWFkfSBUTyAke2l9IC8gJHtidWZmZXIuYnl0ZUxlbmd0aH1cXG5gLCByb3csICdcXG5cXG4nKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgLy99XG4gICAgcmV0dXJuIFtyb3csIHRvdGFsUmVhZF07XG4gIH1cblxuICBwcmludFJvdyAocjogUm93LCBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPikge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkpO1xuICB9XG5cbiAgc2VyaWFsaXplSGVhZGVyICgpOiBCbG9iIHtcbiAgICAvLyBbLi4ubmFtZSwgMCwgbnVtRmllbGRzMCwgbnVtRmllbGRzMSwgZmllbGQwVHlwZSwgZmllbGQwRmxhZz8sIC4uLmZpZWxkME5hbWUsIDAsIGV0Y107XG4gICAgLy8gVE9ETyAtIEJhc2UgdW5pdCBoYXMgNTAwKyBmaWVsZHNcbiAgICBpZiAodGhpcy5jb2x1bW5zLmxlbmd0aCA+IDY1NTM1KSB0aHJvdyBuZXcgRXJyb3IoJ29oIGJ1ZGR5Li4uJyk7XG4gICAgY29uc3QgcGFydHMgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSksXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMua2V5KSxcbiAgICAgIC4uLnRoaXMuc2VyaWFsaXplSm9pbnMoKSxcbiAgICAgIHRoaXMuY29sdW1ucy5sZW5ndGggJiAyNTUsXG4gICAgICAodGhpcy5jb2x1bW5zLmxlbmd0aCA+Pj4gOCksXG4gICAgICAuLi50aGlzLmNvbHVtbnMuZmxhdE1hcChjID0+IGMuc2VyaWFsaXplKCkpXG4gICAgXSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW3BhcnRzXSk7XG4gIH1cblxuICBzZXJpYWxpemVKb2lucyAoKSB7XG4gICAgbGV0IGogPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICBsZXQgamIgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICBpZiAodGhpcy5qb2lucykgaiA9IHN0cmluZ1RvQnl0ZXMoam9pblRvU3RyaW5nKHRoaXMuam9pbnMpKTtcbiAgICBpZiAodGhpcy5qb2luZWRCeSkgamIgPSBzdHJpbmdUb0J5dGVzKGpvaW5lZEJ5VG9TdHJpbmcodGhpcy5qb2luZWRCeSkpO1xuICAgIHJldHVybiBbLi4uaiwgLi4uamJdO1xuICB9XG5cbiAgc2VyaWFsaXplUm93IChyOiBSb3cpOiBCbG9iIHtcbiAgICBjb25zdCBmaXhlZCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZml4ZWRXaWR0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGNvbnN0IGJsb2JQYXJ0czogQmxvYlBhcnRbXSA9IFtmaXhlZF07XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdiA9IHJbYy5uYW1lXVxuICAgICAgICBpZiAoYy5pc0FycmF5KSB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplQXJyYXkodiBhcyBhbnlbXSlcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChjLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIHN0cmluZylcbiAgICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgICB9IGJyZWFrO1xuICAgICAgICAgIGNhc2UgQ09MVU1OLkJJRzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgICAgZml4ZWRbaV0gfD0gYy5zZXJpYWxpemVSb3codiBhcyBib29sZWFuKTtcbiAgICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgICAvLyBhZnRlciB3ZSdyZSBkb25lIHdpdGggbnVtYmVycyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAgIC8vaWYgKGMuZmxhZyA9PT0gMTI4KSBpKys7XG4gICAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgaSsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgICAgZml4ZWQuc2V0KGJ5dGVzLCBpKVxuICAgICAgICAgICAgaSArPSBjLndpZHRoITtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7KGMgYXMgYW55KS50eXBlfWApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIENPTFVNTjonLCBjKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBST1c6Jywgcik7XG4gICAgICAgIHRocm93IGV4O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgKHIuX19yb3dJZCA8IDUgfHwgci5fX3Jvd0lkID4gMzk3NSB8fCByLl9fcm93SWQgJSAxMDAwID09PSAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgLSBST1cgJHtyLl9fcm93SWR9YCwgeyBpLCBibG9iUGFydHMsIHIgfSk7XG4gICAgLy99XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29mZnNldCcsXG4gICAgICAnb3JkZXInLFxuICAgICAgJ2JpdCcsXG4gICAgICAndHlwZScsXG4gICAgICAnZmxhZycsXG4gICAgICAnd2lkdGgnLFxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuXG4gIH1cblxuICAvLyByYXdUb1JvdyAoZDogUmF3Um93KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge31cbiAgLy8gcmF3VG9TdHJpbmcgKGQ6IFJhd1JvdywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge31cbn07XG5cbiIsICJpbXBvcnQgeyB2YWxpZGF0ZUpvaW4gfSBmcm9tICcuL2pvaW4nO1xuaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmV4cG9ydCB0eXBlIFJvd0RhdGEgPSBhbnk7IC8vIGZtbFxuZXhwb3J0IHR5cGUgUm93ID0gUmVjb3JkPHN0cmluZywgUm93RGF0YT4gJiB7IF9fcm93SWQ6IG51bWJlciB9O1xuXG50eXBlIFRhYmxlQmxvYiA9IHsgbnVtUm93czogbnVtYmVyLCBoZWFkZXJCbG9iOiBCbG9iLCBkYXRhQmxvYjogQmxvYiB9O1xuXG5leHBvcnQgY2xhc3MgVGFibGUge1xuICBnZXQgbmFtZSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc2NoZW1hLm5hbWUgfVxuICBnZXQga2V5ICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEua2V5IH1cbiAgcmVhZG9ubHkgbWFwOiBNYXA8YW55LCBhbnk+ID0gbmV3IE1hcCgpXG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSByb3dzOiBSb3dbXSxcbiAgICByZWFkb25seSBzY2hlbWE6IFNjaGVtYSxcbiAgKSB7XG4gICAgY29uc3Qga2V5TmFtZSA9IHRoaXMua2V5O1xuICAgIGlmIChrZXlOYW1lICE9PSAnX19yb3dJZCcpIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykge1xuICAgICAgY29uc3Qga2V5ID0gcm93W2tleU5hbWVdO1xuICAgICAgaWYgKHRoaXMubWFwLmhhcyhrZXkpKSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyBub3QgdW5pcXVlJyk7XG4gICAgICB0aGlzLm1hcC5zZXQoa2V5LCByb3cpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBhcHBseUxhdGVKb2lucyAoXG4gICAganQ6IFRhYmxlLFxuICAgIHRhYmxlczogUmVjb3JkPHN0cmluZywgVGFibGU+LFxuICAgIGFkZERhdGE6IGJvb2xlYW5cbiAgKTogVGFibGUge1xuICAgIGNvbnN0IGpvaW5zID0ganQuc2NoZW1hLmpvaW5zO1xuXG4gICAgaWYgKCFqb2lucykgdGhyb3cgbmV3IEVycm9yKCdzaGl0IGFzcyBpZGl0b3Qgd2hvbXN0Jyk7XG4gICAgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB7XG4gICAgICB2YWxpZGF0ZUpvaW4oaiwganQsIHRhYmxlcyk7XG4gICAgICBjb25zdCBbdG4sIGNuLCBwbl0gPSBqO1xuICAgICAgY29uc3QgdCA9IHRhYmxlc1t0bl07XG4gICAgICBjb25zdCBqYiA9IHQuc2NoZW1hLmpvaW5lZEJ5O1xuICAgICAgaWYgKGpiLnNvbWUoKFtqYnRuLCBfLCBqYnBuXSkgPT4gKGpidG4gPT09IHRuKSAmJiAoamJwbiA9PT0gcG4pKSlcbiAgICAgICAgY29uc29sZS53YXJuKGAke3RufSBhbHJlYWR5IGpvaW5lZCAke2p9YClcbiAgICAgIGVsc2VcbiAgICAgICAgamIucHVzaChbanQuc2NoZW1hLm5hbWUsIGNuLCBwbl0pO1xuICAgIH1cblxuICAgIGlmIChhZGREYXRhKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdBUFBMWUlORycpXG4gICAgICAgIC8vY29uc29sZS5sb2coJy0gSk9JTicsIHIpXG4gICAgICBmb3IgKGNvbnN0IFt0biwgY24sIHBuXSBvZiBqdC5zY2hlbWEuam9pbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCByIG9mIGp0LnJvd3MpIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgIC0nLCB0biwgJ09OJywgY24pO1xuICAgICAgICAgIGNvbnN0IGppZCA9IHJbY25dO1xuICAgICAgICAgIGlmIChqaWQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IGpyID0gdGFibGVzW3RuXS5tYXAuZ2V0KGppZCk7XG4gICAgICAgICAgaWYgKCFqcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGAke2p0Lm5hbWV9IE1JU1NFRCBBIEpPSU4gJHt0bn1bJHtjbn1dPSR7cG59OiBOT1RISU5HIFRIRVJFYCwgcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcHJvcCA9IHBuID8/IGp0Lm5hbWU7XG4gICAgICAgICAgaWYgKGpyW3Byb3BdKSBqcltwcm9wXS5wdXNoKHIpO1xuICAgICAgICAgIGVsc2UganJbcHJvcF0gPSBbcl07XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnICA+JywganIuaWQsIGpyLm5hbWUsIGpyW3RuXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2coXG4gICAgICAgIC8vanQuc2NoZW1hLm5hbWUsXG4gICAgICAgIC8vdGFibGVzLk1hZ2ljU2l0ZS5yb3dzLmZpbHRlcihyID0+IHJbanQuc2NoZW1hLm5hbWVdKVxuICAgICAgICAvL1suLi50YWJsZXMuTWFnaWNTaXRlLm1hcC52YWx1ZXMoKV0uZmluZChyID0+IHJbJ1NpdGVCeU5hdGlvbiddKVxuICAgICAgLy8pXG4gICAgfVxuXG4gICAgcmV0dXJuIGp0O1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZVRhYmxlICh0YWJsZTogVGFibGUsIGxpc3Q/OiBUYWJsZVtdLCBtYXA/OiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT4pIHtcbiAgICBpZiAobGlzdCkge1xuICAgICAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YodGFibGUpO1xuICAgICAgaWYgKGluZGV4ID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKGB0YWJsZSAke3RhYmxlLm5hbWV9IGlzIG5vdCBpbiB0aGUgbGlzdGApO1xuICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmIChtYXApIHtcbiAgICAgIGlmICh0YWJsZS5uYW1lIGluIG1hcCkgZGVsZXRlIG1hcFt0YWJsZS5uYW1lXTtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGB0YWJsZSAke3RhYmxlLm5hbWV9IGlzIG5vdCBpbiB0aGUgbWFwYCk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuXG4gICAgLy9jb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB7XG4gICAgICAvL2NvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIC8vaWYgKHIuX19yb3dJZCA9PT0gMClcbiAgICAgICAgLy9yb3dCbG9iLmFycmF5QnVmZmVyKCkudGhlbihhYiA9PiB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgbmV3IFVpbnQ4QXJyYXkoYWIpLmpvaW4oJywgJykpO1xuICAgICAgICAvL30pO1xuICAgICAgLy9yZXR1cm4gcm93QmxvYjtcbiAgICAvL30pO1xuICAgIGNvbnN0IHJvd0Jsb2IgPSBuZXcgQmxvYihyb3dEYXRhKVxuICAgIGNvbnN0IGRhdGFQYWRkaW5nID0gKDQgLSByb3dCbG9iLnNpemUgJSA0KSAlIDQ7XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFVpbnQzMkFycmF5KFtcbiAgICAgICAgdGhpcy5yb3dzLmxlbmd0aCxcbiAgICAgICAgc2NoZW1hSGVhZGVyLnNpemUgKyBzY2hlbWFQYWRkaW5nLFxuICAgICAgICByb3dCbG9iLnNpemUgKyBkYXRhUGFkZGluZ1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHNjaGVtYUhlYWRlcixcbiAgICAgICAgbmV3IEFycmF5QnVmZmVyKHNjaGVtYVBhZGRpbmcpIGFzIGFueSAvLyA/Pz9cbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKHsgdGFibGVzLCBibG9icywgYWxsU2l6ZXMsIGFsbEhlYWRlcnMsIGFsbERhdGEgfSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW2FsbFNpemVzLCAuLi5hbGxIZWFkZXJzLCAuLi5hbGxEYXRhXSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgb3BlbkJsb2IgKGJsb2I6IEJsb2IpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIFRhYmxlPj4ge1xuICAgIGlmIChibG9iLnNpemUgJSA0ICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3dvbmt5IGJsb2Igc2l6ZScpO1xuICAgIGNvbnN0IG51bVRhYmxlcyA9IG5ldyBVaW50MzJBcnJheShhd2FpdCBibG9iLnNsaWNlKDAsIDQpLmFycmF5QnVmZmVyKCkpWzBdO1xuXG4gICAgLy8gb3ZlcmFsbCBieXRlIG9mZnNldFxuICAgIGxldCBibyA9IDQ7XG4gICAgY29uc3Qgc2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICBhd2FpdCBibG9iLnNsaWNlKGJvLCBibyArPSBudW1UYWJsZXMgKiAxMikuYXJyYXlCdWZmZXIoKVxuICAgICk7XG5cbiAgICBjb25zdCB0QmxvYnM6IFRhYmxlQmxvYltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICBjb25zdCBzaSA9IGkgKiAzO1xuICAgICAgY29uc3QgbnVtUm93cyA9IHNpemVzW3NpXTtcbiAgICAgIGNvbnN0IGhTaXplID0gc2l6ZXNbc2kgKyAxXTtcbiAgICAgIHRCbG9ic1tpXSA9IHsgbnVtUm93cywgaGVhZGVyQmxvYjogYmxvYi5zbGljZShibywgYm8gKz0gaFNpemUpIH0gYXMgYW55O1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICB0QmxvYnNbaV0uZGF0YUJsb2IgPSBibG9iLnNsaWNlKGJvLCBibyArPSBzaXplc1tpICogMyArIDJdKTtcbiAgICB9O1xuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAoKHRiLCBpKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBJTiBCTE9CUyBGT1IgVD0ke2l9YCwgdGIpXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQmxvYih0Yik7XG4gICAgfSkpXG4gICAgY29uc3QgdGFibGVNYXAgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuXG4gICAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykge1xuICAgICAgaWYgKCF0LnNjaGVtYS5qb2lucykgY29udGludWU7XG4gICAgICBmb3IgKGNvbnN0IFthVCwgYUYsIGFQXSBvZiB0LnNjaGVtYS5qb2lucykge1xuICAgICAgICBjb25zdCB0QSA9IHRhYmxlTWFwW2FUXTtcbiAgICAgICAgaWYgKCF0QSkgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YVR9YCk7XG4gICAgICAgIGlmICghdC5yb3dzLmxlbmd0aCkgY29udGludWU7IC8vIGVtcHR5IHRhYmxlIGkgZ3Vlc3M/XG4gICAgICAgIGZvciAoY29uc3QgciBvZiB0LnJvd3MpIHtcbiAgICAgICAgICBjb25zdCBpZEEgPSByW2FGXTtcbiAgICAgICAgICBpZiAoaWRBID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBiYWQgaWQ/YCwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYSA9IHRBLm1hcC5nZXQoaWRBKTtcbiAgICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByb3cgaGFzIGEgbWlzc2luZyBpZD9gLCBhLCBpZEEsIHIsIGAke2FUfVske2FGfV09JHthUH1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAoYVthUCA/PyB0Lm5hbWVdID8/PSBbXSkucHVzaChyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGVNYXA7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZnJvbUJsb2IgKHtcbiAgICBoZWFkZXJCbG9iLFxuICAgIGRhdGFCbG9iLFxuICAgIG51bVJvd3MsXG4gIH06IFRhYmxlQmxvYik6IFByb21pc2U8VGFibGU+IHtcbiAgICBjb25zdCBzY2hlbWEgPSBTY2hlbWEuZnJvbUJ1ZmZlcihhd2FpdCBoZWFkZXJCbG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIGxldCByYm8gPSAwO1xuICAgIGxldCBfX3Jvd0lkID0gMDtcbiAgICBjb25zdCByb3dzOiBSb3dbXSA9IFtdO1xuICAgIC8vIFRPRE8gLSBjb3VsZCBkZWZpbml0ZWx5IHVzZSBhIHN0cmVhbSBmb3IgdGhpc1xuICAgIGNvbnN0IGRhdGFCdWZmZXIgPSBhd2FpdCBkYXRhQmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUubG9nKGA9PT09PSBSRUFEICR7bnVtUm93c30gT0YgJHtzY2hlbWEubmFtZX0gPT09PT1gKVxuICAgIHdoaWxlIChfX3Jvd0lkIDwgbnVtUm93cykge1xuICAgICAgY29uc3QgW3JvdywgcmVhZF0gPSBzY2hlbWEucm93RnJvbUJ1ZmZlcihyYm8sIGRhdGFCdWZmZXIsIF9fcm93SWQrKyk7XG4gICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgIHJibyArPSByZWFkO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbiAgfVxuXG5cbiAgcHJpbnQgKFxuICAgIHdpZHRoOiBudW1iZXIgPSA4MCxcbiAgICBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPnxudWxsID0gbnVsbCxcbiAgICBuOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgbTogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIHA/OiAocjogYW55KSA9PiBib29sZWFuLFxuICApOiBudWxsfGFueVtdIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBwID8gdGhpcy5yb3dzLmZpbHRlcihwKSA6XG4gICAgICBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG5cbiAgICBsZXQgbUZpZWxkcyA9IEFycmF5LmZyb20oKGZpZWxkcyA/PyB0aGlzLnNjaGVtYS5maWVsZHMpKTtcbiAgICBpZiAocCkgW24sIG1dID0gWzAsIHJvd3MubGVuZ3RoXVxuICAgIGVsc2UgKG1GaWVsZHMgYXMgYW55KS51bnNoaWZ0KCdfX3Jvd0lkJyk7XG5cbiAgICBjb25zdCBbcFJvd3MsIHBGaWVsZHNdID0gZmllbGRzID9cbiAgICAgIFtyb3dzLm1hcCgocjogUm93KSA9PiB0aGlzLnNjaGVtYS5wcmludFJvdyhyLCBtRmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coJ3JvdyBmaWx0ZXI6JywgcCA/PyAnKG5vbmUpJylcbiAgICBjb25zb2xlLmxvZyhgKHZpZXcgcm93cyAke259IC0gJHttfSlgKTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zb2xlLnRhYmxlKHBSb3dzLCBwRmllbGRzKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcbiAgICByZXR1cm4gKHAgJiYgZmllbGRzKSA/XG4gICAgICByb3dzLm1hcChyID0+XG4gICAgICAgIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKS5maWx0ZXIoZSA9PiBlWzFdKSlcbiAgICAgICkgOlxuICAgICAgbnVsbDtcbiAgfVxuXG4gIGR1bXBSb3cgKGk6IG51bWJlcnxudWxsLCBzaG93RW1wdHkgPSBmYWxzZSwgdXNlQ1NTPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAvLyBUT0RPIFx1MjAxNCBpbiBicm93c2VyLCB1c2VDU1MgPT09IHRydWUgYnkgZGVmYXVsdFxuICAgIHVzZUNTUyA/Pz0gKGdsb2JhbFRoaXNbJ3dpbmRvdyddID09PSBnbG9iYWxUaGlzKTsgLy8gaWRrXG4gICAgaSA/Pz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5yb3dzLmxlbmd0aCk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5yb3dzW2ldO1xuICAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjc3M6IHN0cmluZ1tdfG51bGwgPSB1c2VDU1MgPyBbXSA6IG51bGw7XG4gICAgY29uc3QgZm10ID0gZm10U3R5bGVkLmJpbmQobnVsbCwgb3V0LCBjc3MpO1xuICAgIGNvbnN0IHAgPSBNYXRoLm1heChcbiAgICAgIC4uLnRoaXMuc2NoZW1hLmNvbHVtbnNcbiAgICAgIC5maWx0ZXIoYyA9PiBzaG93RW1wdHkgfHwgcm93W2MubmFtZV0pXG4gICAgICAubWFwKGMgPT4gYy5uYW1lLmxlbmd0aCArIDIpXG4gICAgKTtcbiAgICBpZiAoIXJvdylcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dIGRvZXMgbm90IGV4aXN0YCwgQ19OT1RfRk9VTkQpO1xuICAgIGVsc2Uge1xuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV1gLCBDX1JPV19IRUFEKTtcbiAgICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLnNjaGVtYS5jb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2MubmFtZV07XG4gICAgICAgIGNvbnN0IG4gPSBjLm5hbWUucGFkU3RhcnQocCwgJyAnKTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlY1RSVUVgLCBDX1RSVUUpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAlY0ZBTFNFYCwgQ19OT1RfRk9VTkQsIENfRkFMU0UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19OVU1CRVIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19TVFIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiBcdTIwMTRgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdiaWdpbnQnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYHtufTogJWMwICVjJHt2YWx1ZX0gKEJJRylgLCBDX0JJRywgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMCAoQklHKWAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh1c2VDU1MpIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpLCAuLi5jc3MhXTtcbiAgICBlbHNlIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpXTtcbiAgfVxuXG4gIGZpbmRSb3cgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuLCBzdGFydCA9IDApOiBudW1iZXIge1xuICAgIGNvbnN0IE4gPSB0aGlzLnJvd3MubGVuZ3RoXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBOIC0gc3RhcnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgTjsgaSsrKSBpZiAocHJlZGljYXRlKHRoaXMucm93c1tpXSkpIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICogZmlsdGVyUm93cyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4pOiBHZW5lcmF0b3I8Um93PiB7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSBpZiAocHJlZGljYXRlKHJvdykpIHlpZWxkIHJvdztcbiAgfVxuICAvKlxuICByYXdUb1JvdyAoZDogc3RyaW5nW10pOiBSb3cge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zY2hlbWEuY29sdW1ucy5tYXAociA9PiBbXG4gICAgICByLm5hbWUsXG4gICAgICByLnRvVmFsKGRbci5pbmRleF0pXG4gICAgXSkpO1xuICB9XG4gIHJhd1RvU3RyaW5nIChkOiBzdHJpbmdbXSwgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8vIGp1c3QgYXNzdW1lIGZpcnN0IHR3byBmaWVsZHMgYXJlIGFsd2F5cyBpZCwgbmFtZS4gZXZlbiBpZiB0aGF0J3Mgbm90IHRydWVcbiAgICAvLyB0aGlzIGlzIGp1c3QgZm9yIHZpc3VhbGl6YXRpb24gcHVycG9yc2VzXG4gICAgbGV0IGV4dHJhID0gJyc7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZSA9IHRoaXMucmF3VG9Sb3coZCk7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYXJncykge1xuICAgICAgICAvLyBkb24ndCByZXByaW50IG5hbWUgb3IgaWRcbiAgICAgICAgaWYgKGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1swXSB8fCBhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMV0pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChlW2FdICE9IG51bGwpXG4gICAgICAgICAgcy5wdXNoKGAke2F9OiAke0pTT04uc3RyaW5naWZ5KGVbYV0pfWApXG4gICAgICB9XG4gICAgICBleHRyYSA9IHMubGVuZ3RoID4gMCA/IGAgeyAke3Muam9pbignLCAnKX0gfWAgOiAne30nO1xuICAgIH1cbiAgICByZXR1cm4gYDwke3RoaXMuc2NoZW1hLm5hbWV9OiR7ZFswXSA/PyAnPyd9IFwiJHtkWzFdfVwiJHtleHRyYX0+YDtcbiAgfVxuICAqL1xufVxuXG5mdW5jdGlvbiBmbXRTdHlsZWQgKFxuICBvdXQ6IHN0cmluZ1tdLFxuICBjc3NPdXQ6IHN0cmluZ1tdIHwgbnVsbCxcbiAgbXNnOiBzdHJpbmcsXG4gIC4uLmNzczogc3RyaW5nW11cbikge1xuICBpZiAoY3NzT3V0KSB7XG4gICAgb3V0LnB1c2gobXNnICsgJyVjJylcbiAgICBjc3NPdXQucHVzaCguLi5jc3MsIENfUkVTRVQpO1xuICB9XG4gIGVsc2Ugb3V0LnB1c2gobXNnLnJlcGxhY2UoLyVjL2csICcnKSk7XG59XG5cbmNvbnN0IENfTk9UX0ZPVU5EID0gJ2NvbG9yOiAjODg4OyBmb250LXN0eWxlOiBpdGFsaWM7JztcbmNvbnN0IENfUk9XX0hFQUQgPSAnZm9udC13ZWlnaHQ6IGJvbGRlcic7XG5jb25zdCBDX0JPTEQgPSAnZm9udC13ZWlnaHQ6IGJvbGQnO1xuY29uc3QgQ19OVU1CRVIgPSAnY29sb3I6ICNBMDU1MTg7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1RSVUUgPSAnY29sb3I6ICM0QzM4QkU7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0ZBTFNFID0gJ2NvbG9yOiAjMzhCRTFDOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19TVFIgPSAnY29sb3I6ICMzMEFBNjI7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0JJRyA9ICdjb2xvcjogIzc4MjFBMzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfUkVTRVQgPSAnY29sb3I6IHVuc2V0OyBmb250LXN0eWxlOiB1bnNldDsgZm9udC13ZWlnaHQ6IHVuc2V0OyBiYWNrZ3JvdW5kLXVuc2V0J1xuIiwgImltcG9ydCB7IENPTFVNTiwgU2NoZW1hQXJncyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuZXhwb3J0IGNvbnN0IGNzdkRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4gPSB7XG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlVS5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXQnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoW1xuICAgICAgLy8gY29tYmluZWQgaW50byBhbiBhcnJheSBmaWVsZFxuICAgICAgJ2FybW9yMScsICdhcm1vcjInLCAnYXJtb3IzJywgJ2FybW9yNCcsICdlbmQnLFxuICAgICAgJ3dwbjEnLCAnd3BuMicsICd3cG4zJywgJ3dwbjQnLCAnd3BuNScsICd3cG42JywgJ3dwbjcnLFxuXG4gICAgICAvLyBhbGwgY29tYmluZWQgaW50byBvbmUgYXJyYXkgZmllbGRcbiAgICAgICdsaW5rMScsICdsaW5rMicsICdsaW5rMycsICdsaW5rNCcsICdsaW5rNScsICdsaW5rNicsXG4gICAgICAnbWFzazEnLCAnbWFzazInLCAnbWFzazMnLCAnbWFzazQnLCAnbWFzazUnLCAnbWFzazYnLFxuICAgICAgJ25icjEnLCAgJ25icjInLCAgJ25icjMnLCAgJ25icjQnLCAgJ25icjUnLCAgJ25icjYnLFxuICAgICAgJ3JhbmQxJywgJ3JhbmQyJywgJ3JhbmQzJywgJ3JhbmQ0JywgJ3JhbmQ1JywgJ3JhbmQ2JyxcblxuICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICAgJ21vdW50ZWQnLFxuICAgICAgLy8gcmVkdW5kYW50XG4gICAgICAncmVhbmltYXRvcn4xJyxcbiAgICBdKSxcbiAgICBrbm93bkZpZWxkczoge1xuICAgICAgaWQ6IENPTFVNTi5VMTYsXG4gICAgICBuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgcnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlY2xpbWl0OiBDT0xVTU4uSTgsXG4gICAgICBiYXNlY29zdDogQ09MVU1OLlUxNixcbiAgICAgIHJjb3N0OiBDT0xVTU4uSTgsXG4gICAgICBzaXplOiBDT0xVTU4uVTgsXG4gICAgICByZXNzaXplOiBDT0xVTU4uVTgsXG4gICAgICBocDogQ09MVU1OLlUxNixcbiAgICAgIHByb3Q6IENPTFVNTi5VOCxcbiAgICAgIG1yOiBDT0xVTU4uVTgsXG4gICAgICBtb3I6IENPTFVNTi5VOCxcbiAgICAgIHN0cjogQ09MVU1OLlU4LFxuICAgICAgYXR0OiBDT0xVTU4uVTgsXG4gICAgICBkZWY6IENPTFVNTi5VOCxcbiAgICAgIHByZWM6IENPTFVNTi5VOCxcbiAgICAgIGVuYzogQ09MVU1OLlU4LFxuICAgICAgbWFwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgYXA6IENPTFVNTi5VOCxcbiAgICAgIGFtYmlkZXh0cm91czogQ09MVU1OLlU4LFxuICAgICAgbW91bnRtbnI6IENPTFVNTi5VMTYsXG4gICAgICBza2lsbGVkcmlkZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlaW52aWdvcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHVuZGVhZGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgbWF4YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgaGFuZDogQ09MVU1OLlU4LFxuICAgICAgaGVhZDogQ09MVU1OLlU4LFxuICAgICAgbWlzYzogQ09MVU1OLlU4LFxuICAgICAgcGF0aGNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0ZG9tOiBDT0xVTU4uVTgsXG4gICAgICBib251c3NwZWxsczogQ09MVU1OLlU4LFxuICAgICAgRjogQ09MVU1OLlU4LFxuICAgICAgQTogQ09MVU1OLlU4LFxuICAgICAgVzogQ09MVU1OLlU4LFxuICAgICAgRTogQ09MVU1OLlU4LFxuICAgICAgUzogQ09MVU1OLlU4LFxuICAgICAgRDogQ09MVU1OLlU4LFxuICAgICAgTjogQ09MVU1OLlU4LFxuICAgICAgRzogQ09MVU1OLlU4LFxuICAgICAgQjogQ09MVU1OLlU4LFxuICAgICAgSDogQ09MVU1OLlU4LFxuICAgICAgc2FpbGluZ3NoaXBzaXplOiBDT0xVTU4uVTE2LFxuICAgICAgc2FpbGluZ21heHVuaXRzaXplOiBDT0xVTU4uVTgsXG4gICAgICBzdGVhbHRoeTogQ09MVU1OLlU4LFxuICAgICAgcGF0aWVuY2U6IENPTFVNTi5VOCxcbiAgICAgIHNlZHVjZTogQ09MVU1OLlU4LFxuICAgICAgc3VjY3VidXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnJ1cHQ6IENPTFVNTi5VOCxcbiAgICAgIGhvbWVzaWNrOiBDT0xVTU4uVTgsXG4gICAgICBmb3JtYXRpb25maWdodGVyOiBDT0xVTU4uSTgsXG4gICAgICBzdGFuZGFyZDogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyYXRpb25hbDogQ09MVU1OLkk4LFxuICAgICAgdGFza21hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYmVhc3RtYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJvZHlndWFyZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJicmVhdGhpbmc6IENPTFVNTi5VMTYsXG4gICAgICBpY2Vwcm90OiBDT0xVTU4uVTgsXG4gICAgICBpbnZ1bG5lcmFibGU6IENPTFVNTi5VOCxcbiAgICAgIHNob2NrcmVzOiBDT0xVTU4uSTgsXG4gICAgICBmaXJlcmVzOiBDT0xVTU4uSTgsXG4gICAgICBjb2xkcmVzOiBDT0xVTU4uSTgsXG4gICAgICBwb2lzb25yZXM6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHZvaWRzYW5pdHk6IENPTFVNTi5VOCxcbiAgICAgIGRhcmt2aXNpb246IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hbGF3ZTogQ09MVU1OLlU4LFxuICAgICAgYXdlOiBDT0xVTU4uVTgsXG4gICAgICBoYWx0aGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZmVhcjogQ09MVU1OLlU4LFxuICAgICAgYmVyc2VyazogQ09MVU1OLlU4LFxuICAgICAgY29sZDogQ09MVU1OLlU4LFxuICAgICAgaGVhdDogQ09MVU1OLlU4LFxuICAgICAgZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgYmFuZWZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGRhbWFnZXJldjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIGRpc2Vhc2VjbG91ZDogQ09MVU1OLlU4LFxuICAgICAgc2xpbWVyOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kc2xpbWU6IENPTFVNTi5VMTYsXG4gICAgICByZWdlbmVyYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmFybW9yOiBDT0xVTU4uVTgsXG4gICAgICBleWVsb3NzOiBDT0xVTU4uVTgsXG4gICAgICBldGh0cnVlOiBDT0xVTU4uVTgsXG4gICAgICBzdG9ybXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNvbGRwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZGFya3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICB3aW50ZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3ByaW5ncG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1lcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmYWxscG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZvcmdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGZpeGZvcmdlYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIG1hc3RlcnNtaXRoOiBDT0xVTU4uSTgsXG4gICAgICByZXNvdXJjZXM6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9oZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9kaXNoZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIG5vYmFkZXZlbnRzOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmU6IENPTFVNTi5VOCxcbiAgICAgIHNoYXR0ZXJlZHNvdWw6IENPTFVNTi5VOCxcbiAgICAgIGxlcGVyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3JlYzogQ09MVU1OLlU4LFxuICAgICAgcGlsbGFnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBwYXRyb2xib251czogQ09MVU1OLkk4LFxuICAgICAgY2FzdGxlZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzaWVnZWJvbnVzOiBDT0xVTU4uSTE2LFxuICAgICAgaW5jcHJvdmRlZjogQ09MVU1OLlU4LFxuICAgICAgc3VwcGx5Ym9udXM6IENPTFVNTi5VOCxcbiAgICAgIGluY3VucmVzdDogQ09MVU1OLkkxNixcbiAgICAgIHBvcGtpbGw6IENPTFVNTi5VMTYsXG4gICAgICByZXNlYXJjaGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJpbmdyZXM6IENPTFVNTi5JOCxcbiAgICAgIGRvdXNlOiBDT0xVTU4uVTgsXG4gICAgICBhZGVwdHNhY3I6IENPTFVNTi5VOCxcbiAgICAgIGNyb3NzYnJlZWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFrZXBlYXJsczogQ09MVU1OLlU4LFxuICAgICAgdm9pZHN1bTogQ09MVU1OLlU4LFxuICAgICAgaGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZWxlZ2lzdDogQ09MVU1OLlU4LFxuICAgICAgc2hhcGVjaGFuZ2U6IENPTFVNTi5VMTYsXG4gICAgICBmaXJzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2Vjb25kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBsYW5kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB3YXRlcnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgZm9yZXN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBwbGFpbnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgeHBzaGFwZTogQ09MVU1OLlU4LFxuICAgICAgbmFtZXR5cGU6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjogQ09MVU1OLkkxNixcbiAgICAgIG5fc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTE6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjA6IENPTFVNTi5JMTYsXG4gICAgICBibG9vZHZlbmdlYW5jZTogQ09MVU1OLlU4LFxuICAgICAgYnJpbmdlcm9mZm9ydHVuZTogQ09MVU1OLkk4LFxuICAgICAgcmVhbG0xOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTM6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTQ6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTFkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0zZDY6IENPTFVNTi5JMTYsXG4gICAgICBiYXRzdGFydHN1bTRkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNWQ2OiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTZkNjogQ09MVU1OLlUxNixcbiAgICAgIHR1cm1vaWxzdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aGZpcmU6IENPTFVNTi5VOCxcbiAgICAgIHV3cmVnZW46IENPTFVNTi5VOCxcbiAgICAgIHNocmlua2hwOiBDT0xVTU4uVTgsXG4gICAgICBncm93aHA6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aW5nYWZmOiBDT0xVTU4uVTMyLFxuICAgICAgZml4ZWRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgbGFtaWFsb3JkOiBDT0xVTU4uVTgsXG4gICAgICBwcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgZHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIG11bW1pZnk6IENPTFVNTi5VMTYsXG4gICAgICBvbmViYXR0bGVzcGVsbDogQ09MVU1OLlU4LFxuICAgICAgZmlyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFpcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIHdhdGVyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZWFydGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RGOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFc6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RFOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0UzogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEQ6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3ROOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QUxMOiBDT0xVTU4uSTgsXG4gICAgICBleWVzOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VlYXRlcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uc2tpbjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpdGVtOiBDT0xVTU4uVTgsXG4gICAgICBiYXR0bGVzdW01OiBDT0xVTU4uVTE2LFxuICAgICAgYWNpZHNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgcHJvcGhldHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgaG9ycm9yOiBDT0xVTU4uVTgsXG4gICAgICBsYXRlaGVybzogQ09MVU1OLlU4LFxuICAgICAgdXdkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIGxhbmRkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIHJwY29zdDogQ09MVU1OLlUzMixcbiAgICAgIHJhbmQ1OiBDT0xVTU4uVTgsXG4gICAgICBuYnI1OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmQ2OiBDT0xVTU4uVTgsXG4gICAgICBuYnI2OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNjogQ09MVU1OLlUxNixcbiAgICAgIG11bW1pZmljYXRpb246IENPTFVNTi5VMTYsXG4gICAgICBkaXNlYXNlcmVzOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZW9ua2lsbDogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHNlbmRsZXNzZXJob3Jyb3JtdWx0OiBDT0xVTU4uVTgsXG4gICAgICBpbmNvcnBvcmF0ZTogQ09MVU1OLlU4LFxuICAgICAgYmxlc3NiZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWF0dGFja2VyOiBDT0xVTU4uVTgsXG4gICAgICB1d2hlYXQ6IENPTFVNTi5VOCxcbiAgICAgIHNsb3RocmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcmRlc2VydGVyOiBDT0xVTU4uVTgsXG4gICAgICBzb3JjZXJ5cmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG9sZGVyOiBDT0xVTU4uSTgsXG4gICAgICBkaXNiZWxpZXZlOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbHJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYmVhcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgaG9yc2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHJlaW5jYXJuYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHdvbGZ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGJvYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHNsZWVwYXVyYTogQ09MVU1OLlU4LFxuICAgICAgc25ha2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGFwcGV0aXRlOiBDT0xVTU4uSTgsXG4gICAgICB0ZW1wbGV0cmFpbmVyOiBDT0xVTU4uVTgsXG4gICAgICBpbmZlcm5vcmV0OiBDT0xVTU4uVTgsXG4gICAgICBrb2t5dG9zcmV0OiBDT0xVTU4uVTgsXG4gICAgICBhZGRyYW5kb21hZ2U6IENPTFVNTi5VMTYsXG4gICAgICB1bnN1cnI6IENPTFVNTi5VOCxcbiAgICAgIHNwZWNpYWxsb29rOiBDT0xVTU4uVTgsXG4gICAgICBidWdyZWZvcm06IENPTFVNTi5VOCxcbiAgICAgIG9uaXN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgc3VuYXdlOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGFmZjogQ09MVU1OLlU4LFxuICAgICAgaXZ5bG9yZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2RtYWc6IENPTFVNTi5VOCxcbiAgICAgIGZvcnRraWxsOiBDT0xVTU4uVTgsXG4gICAgICB0aHJvbmVraWxsOiBDT0xVTU4uVTgsXG4gICAgICBkaWdlc3Q6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgZW50YW5nbGU6IENPTFVNTi5VOCxcbiAgICAgIGFsY2hlbXk6IENPTFVNTi5VOCxcbiAgICAgIHdvdW5kZmVuZDogQ09MVU1OLlU4LFxuICAgICAgZmFsc2Vhcm15OiBDT0xVTU4uSTgsXG4gICAgICBzdW1tb241OiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXI6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHBhcmFseXplOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2Vjb25zdHJ1Y3Q6IENPTFVNTi5VOCxcbiAgICAgIGd1YXJkaWFuc3Bpcml0bW9kaWZpZXI6IENPTFVNTi5JOCxcbiAgICAgIGljZWZvcmdpbmc6IENPTFVNTi5VOCxcbiAgICAgIGNsb2Nrd29ya2xvcmQ6IENPTFVNTi5VOCxcbiAgICAgIG1pbnNpemVsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIGlyb252dWw6IENPTFVNTi5VOCxcbiAgICAgIGhlYXRoZW5zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHBvd2Vyb2ZkZWF0aDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtdGltZTogQ09MVU1OLkk4LFxuICAgICAgdHdpY2Vib3JuOiBDT0xVTU4uVTE2LFxuICAgICAgdG1wYXN0cmFsZ2VtczogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRoZXJvYWI6IENPTFVNTi5VOCxcbiAgICAgIHV3ZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgc2FsdHZ1bDogQ09MVU1OLlU4LFxuICAgICAgbGFuZGVuYzogQ09MVU1OLlU4LFxuICAgICAgcGxhZ3VlZG9jdG9yOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWx1Y2tzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGZhcnRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcm1hcms6IENPTFVNTi5VOCxcbiAgICAgIGFsbHJldDogQ09MVU1OLlU4LFxuICAgICAgYWNpZGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgYmVja29uOiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXJib251czogQ09MVU1OLlU4LFxuICAgICAgY2FyY2Fzc2NvbGxlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgbWluZGNvbGxhcjogQ09MVU1OLlU4LFxuICAgICAgbW91bnRhaW5yZWM6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBlbmNocmViYXRlNTA6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjE6IENPTFVNTi5VMTYsXG4gICAgICByYW5kb21zcGVsbDogQ09MVU1OLlU4LFxuICAgICAgaW5zYW5pZnk6IENPTFVNTi5VOCxcbiAgICAgIC8vanVzdCBhIGNvcHkgb2YgcmVhbmltYXRvci4uLlxuICAgICAgLy8ncmVhbmltYXRvcn4xJzogQ09MVU1OLlU4LFxuICAgICAgZGVmZWN0b3I6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgZW5jaHJlYmF0ZTEwOiBDT0xVTU4uVTgsXG4gICAgICB1bmR5aW5nOiBDT0xVTU4uVTgsXG4gICAgICBtb3JhbGVib251czogQ09MVU1OLlU4LFxuICAgICAgdW5jdXJhYmxlYWZmbGljdGlvbjogQ09MVU1OLlUzMixcbiAgICAgIHdpbnRlcnN1bW1vbjFkMzogQ09MVU1OLlUxNixcbiAgICAgIHN0eWdpYW5ndWlkZTogQ09MVU1OLlU4LFxuICAgICAgc21hcnRtb3VudDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtaW5nZmxlc2g6IENPTFVNTi5VOCxcbiAgICAgIGZlYXJvZnRoZWZsb29kOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VzdGl0Y2hlcjogQ09MVU1OLlU4LFxuICAgICAgcmVjb25zdHJ1Y3Rpb246IENPTFVNTi5VOCxcbiAgICAgIG5vZnJpZGVyczogQ09MVU1OLlU4LFxuICAgICAgY29yaWRlcm1ucjogQ09MVU1OLlUxNixcbiAgICAgIGhvbHljb3N0OiBDT0xVTU4uVTgsXG4gICAgICBhbmltYXRlbW5yOiBDT0xVTU4uVTE2LFxuICAgICAgbGljaDogQ09MVU1OLlUxNixcbiAgICAgIGVyYXN0YXJ0YWdlaW5jcmVhc2U6IENPTFVNTi5VMTYsXG4gICAgICBtb3Jlb3JkZXI6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVncm93dGg6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVwcm9kOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlaGVhdDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWx1Y2s6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVtYWdpYzogQ09MVU1OLkk4LFxuICAgICAgbm9mbW91bnRzOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWRhbWFnZXJlY292ZXJ5OiBDT0xVTU4uVTgsXG4gICAgICB1d3BhdGhib29zdDogQ09MVU1OLkk4LFxuICAgICAgcmFuZG9taXRlbXM6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHNsaW1lZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhwb2lzb25leHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHNob2NrZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZHJhd3NpemU6IENPTFVNTi5JOCxcbiAgICAgIHBldHJpZmljYXRpb25pbW11bmU6IENPTFVNTi5VOCxcbiAgICAgIHNjYXJzb3VsczogQ09MVU1OLlU4LFxuICAgICAgc3Bpa2ViYXJiczogQ09MVU1OLlU4LFxuICAgICAgcHJldGVuZGVyc3RhcnRzaXRlOiBDT0xVTU4uVTE2LFxuICAgICAgb2Zmc2NyaXB0cmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIHVubW91bnRlZHNwcjogQ09MVU1OLlUzMixcbiAgICAgIGV4aGF1c3Rpb246IENPTFVNTi5VOCxcbiAgICAgIC8vIG1vdW50ZWQ6IENPTFVNTi5CT09MLCAvLyBkZXByZWNhdGVkXG4gICAgICBib3c6IENPTFVNTi5CT09MLFxuICAgICAgYm9keTogQ09MVU1OLkJPT0wsXG4gICAgICBmb290OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNyb3dub25seTogQ09MVU1OLkJPT0wsXG4gICAgICBob2x5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGlucXVpc2l0b3I6IENPTFVNTi5CT09MLFxuICAgICAgaW5hbmltYXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZW1vbjogQ09MVU1OLkJPT0wsXG4gICAgICBtYWdpY2JlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0b25lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgYW5pbWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBmZW1hbGU6IENPTFVNTi5CT09MLFxuICAgICAgZm9yZXN0c3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRhaW5zdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICB3YXN0ZXN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN3YW1wc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgYXF1YXRpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhbXBoaWJpYW46IENPTFVNTi5CT09MLFxuICAgICAgcG9vcmFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBmbG9hdDogQ09MVU1OLkJPT0wsXG4gICAgICBmbHlpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3Rvcm1pbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgdGVsZXBvcnQ6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb2JpbGU6IENPTFVNTi5CT09MLFxuICAgICAgbm9yaXZlcnBhc3M6IENPTFVNTi5CT09MLFxuICAgICAgaWxsdXNpb246IENPTFVNTi5CT09MLFxuICAgICAgc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzc2Fzc2luOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhlYWw6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgZG9taW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgbm9oZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5lZWRub3RlYXQ6IENPTFVNTi5CT09MLFxuICAgICAgdW5kaXNjaXBsaW5lZDogQ09MVU1OLkJPT0wsXG4gICAgICBzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbGFzaHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibHVudHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBwaWVyY2VyZXM6IENPTFVNTi5CT09MLFxuICAgICAgYmxpbmQ6IENPTFVNTi5CT09MLFxuICAgICAgcGV0cmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICBldGhlcmVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWF0aGN1cnNlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyYW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBzd2FsbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIHRheGNvbGxlY3RvcjogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFpbmltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlxdWU6IENPTFVNTi5CT09MLFxuICAgICAgc2NhbGV3YWxsczogQ09MVU1OLkJPT0wsXG4gICAgICBkaXZpbmVpbnM6IENPTFVNTi5CT09MLFxuICAgICAgaGVhdHJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBjb2xkcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGNoYW9zOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGRlYXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJ1ZzogQ09MVU1OLkJPT0wsXG4gICAgICB1d2J1ZzogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRvcmRlcjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRncm93dGg6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZG9tOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWtlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRoZWZ0b2Z0aGVzdW5hd2U6IENPTFVNTi5CT09MLFxuICAgICAgZHJhZ29ubG9yZDogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5kdmVzc2VsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVsZW1lbnRyYW5nZTogQ09MVU1OLkJPT0wsXG4gICAgICBhc3RyYWxmZXR0ZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbWJhdGNhc3RlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXNpbmdsZXJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBub3dpc2g6IENPTFVNTi5CT09MLFxuICAgICAgbWFzb246IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0c2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgb3duYmxvb2Q6IENPTFVNTi5CT09MLFxuICAgICAgaW52aXNpYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwZWxsc2luZ2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljc3R1ZHk6IENPTFVNTi5CT09MLFxuICAgICAgdW5pZnk6IENPTFVNTi5CT09MLFxuICAgICAgdHJpcGxlM21vbjogQ09MVU1OLkJPT0wsXG4gICAgICB5ZWFydHVybjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnRlbGVwb3J0YWJsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZWFuaW1wcmllc3Q6IENPTFVNTi5CT09MLFxuICAgICAgc3R1bmltbXVuaXR5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHNpbmdsZWJhdHRsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZXNlYXJjaHdpdGhvdXRtYWdpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhdXRvY29tcGV0ZTogQ09MVU1OLkJPT0wsXG4gICAgICBhZHZlbnR1cmVyczogQ09MVU1OLkJPT0wsXG4gICAgICBjbGVhbnNoYXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcWxhYjogQ09MVU1OLkJPT0wsXG4gICAgICByZXF0ZW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgaG9ycm9ybWFya2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYXNoYWg6IENPTFVNTi5CT09MLFxuICAgICAgaXNheWF6YWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhZGFldmE6IENPTFVNTi5CT09MLFxuICAgICAgYmxlc3NmbHk6IENPTFVNTi5CT09MLFxuICAgICAgcGxhbnQ6IENPTFVNTi5CT09MLFxuICAgICAgY29tc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgc25vd21vdmU6IENPTFVNTi5CT09MLFxuICAgICAgc3dpbW1pbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3R1cGlkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNraXJtaXNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgdW5zZWVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vbW92ZXBlbjogQ09MVU1OLkJPT0wsXG4gICAgICB3b2xmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGR1bmdlb246IENPTFVNTi5CT09MLFxuICAgICAgYWJvbGV0aDogQ09MVU1OLkJPT0wsXG4gICAgICBsb2NhbHN1bjogQ09MVU1OLkJPT0wsXG4gICAgICB0bXBmaXJlZ2VtczogQ09MVU1OLkJPT0wsXG4gICAgICBkZWZpbGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50ZWRiZXNlcms6IENPTFVNTi5CT09MLFxuICAgICAgbGFuY2VvazogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5wcmlzb246IENPTFVNTi5CT09MLFxuICAgICAgaHBvdmVyZmxvdzogQ09MVU1OLkJPT0wsXG4gICAgICBpbmRlcHN0YXk6IENPTFVNTi5CT09MLFxuICAgICAgcG9seWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vaG9mOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9ibGVzc2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFsbW9zdHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICB0cnVlc2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgbW9iaWxlYXJjaGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwaXJpdGZvcm06IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzbWFzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRpZ2h0cmVpbjogQ09MVU1OLkJPT0wsXG4gICAgICBnbGFtb3VybWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWJlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vZmFsbGRtZzogQ09MVU1OLkJPT0wsXG4gICAgICBmaXJlZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhdGVyZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBlYXJ0aGVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgcG9wc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNhcGl0YWxob21lOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsdW1zeTogQ09MVU1OLkJPT0wsXG4gICAgICByZWdhaW5tb3VudDogQ09MVU1OLkJPT0wsXG4gICAgICBub2JhcmRpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRpc2NvbTogQ09MVU1OLkJPT0wsXG4gICAgICBub3Rocm93b2ZmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJpcmQ6IENPTFVNTi5CT09MLFxuICAgICAgZGVjYXlyZXM6IENPTFVNTi5CT09MLFxuICAgICAgY3VibW90aGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2VtcHJvZDogQ09MVU1OLlNUUklORyxcbiAgICAgIGZpeGVkbmFtZTogQ09MVU1OLlNUUklORyxcbiAgICB9LFxuICAgIGV4dHJhRmllbGRzOiB7XG4gICAgICB0eXBlOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBzZEluZGV4ID0gYXJncy5yYXdGaWVsZHNbJ3N0YXJ0ZG9tJ107XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3R5cGUnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgLy8gaGF2ZSB0byBmaWxsIGluIG1vcmUgc3R1ZmYgbGF0ZXIsIHdoZW4gd2Ugam9pbiByZWMgdHlwZXMsIG9oIHdlbGxcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzOiBjb21tYW5kZXIsIG1lcmNlbmFyeSwgaGVybywgZXRjXG4gICAgICAgICAgICBpZiAodVtzZEluZGV4XSkgcmV0dXJuIDM7IC8vIGdvZCArIGNvbW1hbmRlclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gMDsgLy8ganVzdCBhIHVuaXRcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ2l0ZW1jb3N0MX4xJywgJ3dhcm5pbmd+MSddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2RvbWNvbmZsaWN0fjEnLCdlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gcmVtb3ZlZCBhZnRlciBqb2luVGFibGVzXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCB0byBqb2luXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfaW5mby5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnU3BlbGxFZmZlY3RJbmZvJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAvKlxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2Jzoge1xuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgbmFtZTogJ0VmZmVjdFNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICovXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RXZWFwb24nLFxuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZW5jaGFudG1lbnRzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdFbmNoYW50bWVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2V2ZW50cy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gcmVtb3ZlZCBhZnRlciBqb2luVGFibGVzXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAvKiBUT0RPIHR1cm4gdG8gY29uc3RhbnRzXG4gICcuLi8uLi9nYW1lZGF0YS9tYWdpY19wYXRocy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAqL1xuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIG5hbWU6ICdUZXJyYWluVHlwZUJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgLyogVE9ETyAtIHR1cm4gdG8gY29uc3RhbnRcbiAgJy4uLy4uL2dhbWVkYXRhL21vbnN0ZXJfdGFncy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgKi9cbiAvKiBUT0RPIC0gdHVybiB0byBjb25zdGFudFxuICAnLi4vLi4vZ2FtZWRhdGEvbmFtZXR5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hbWVUeXBlJyxcbiAgfSxcbiAgKi9cbiAgJy4uLy4uL2dhbWVkYXRhL25hdGlvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnTmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIHJlYWxtOiAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICdyZWFsbScsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgICAgIHdpZHRoOiAxLFxuICAgICAgICAgIC8vIHdlIHdpbGwgYXNzaWduIHRoZXNlIGxhdGVyXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkgeyByZXR1cm4gMDsgfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL290aGVyX3BsYW5lcy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnT3RoZXJQbGFuZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3ByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1ByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJvdGVjdGlvbnNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1Byb3RlY3Rpb25CeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9yZWFsbXMuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1JlYWxtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc2l0ZV90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTaXRlVGVycmFpblR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX2RhbWFnZV90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBuYW1lOiAnU3BlY2lhbERhbWFnZVR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gIC8qXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX3VuaXF1ZV9zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbFVuaXF1ZVN1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAqL1xuICAnLi4vLi4vZ2FtZWRhdGEvc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGwnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgcHJlVHJhbnNmb3JtIChyYXdGaWVsZHM6IHN0cmluZ1tdLCByYXdEYXRhOiBzdHJpbmdbXVtdKSB7XG4gICAgICAvLyBjb2x1bW5zIHRvIGNvcHkgb3ZlciBmcm9tIGVmZmVjdHNfc3BlbGxzIHRvIHNwZWxscy4uLlxuICAgICAgY29uc3QgSURYID0gcmF3RmllbGRzLmluZGV4T2YoJ2VmZmVjdF9yZWNvcmRfaWQnKTtcbiAgICAgIGNvbnN0IFRYRiA9IFsxLDIsMyw1LDYsNyw4LDksMTAsMTEsMTJdXG4gICAgICBpZiAoSURYID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdubyBlZmZlY3RfcmVjb3JkX2lkPycpXG5cbiAgICAgIGZ1bmN0aW9uIHJlcGxhY2VSZWYgKGRlc3Q6IHN0cmluZ1tdLCBzcmM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGRlc3Quc3BsaWNlKElEWCwgMSwgLi4uVFhGLm1hcChpID0+IHNyY1tpXSkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBbZWZmZWN0RmllbGRzLCAuLi5lZmZlY3REYXRhXSA9IHJlYWRGaWxlU3luYyhcbiAgICAgICAgICBgLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2YCxcbiAgICAgICAgICB7IGVuY29kaW5nOiAndXRmOCcgfVxuICAgICAgICApLnNwbGl0KCdcXG4nKVxuICAgICAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KCdcXHQnKSk7XG5cbiAgICAgIHJlcGxhY2VSZWYocmF3RmllbGRzLCBlZmZlY3RGaWVsZHMpO1xuXG4gICAgICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSBjb25zb2xlLmxvZyhpLCBmKVxuXG4gICAgICBmb3IgKGNvbnN0IGRlc3Qgb2YgcmF3RGF0YSkge1xuICAgICAgICBjb25zdCBlcmlkID0gTnVtYmVyKGRlc3RbSURYXSk7XG4gICAgICAgIGNvbnN0IHNyYyA9IGVmZmVjdERhdGFbZXJpZF07XG4gICAgICAgIGlmICghc3JjKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignTk9QRScsIGRlc3QsIGVyaWQpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gdGhhbmtzJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVwbGFjZVJlZihkZXN0LCBzcmMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvKlxuICAnLi4vLi4vZ2FtZWRhdGEvdGVycmFpbl9zcGVjaWZpY19zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblNwZWNpZmljU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bml0X2VmZmVjdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0RWZmZWN0JyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICovXG4gIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG4gIHByZVRyYW5zZm9ybT86ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIG5hbWU6ICcnLFxuICBrZXk6ICcnLFxuICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoKSxcbiAgb3ZlcnJpZGVzOiB7fSxcbiAga25vd25GaWVsZHM6IHt9LFxuICBleHRyYUZpZWxkczoge30sXG4gIHNlcGFyYXRvcjogJ1xcdCcsIC8vIHN1cnByaXNlIVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3N2VG9UYWJsZShcbiAgcmF3OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5cbik6IFRhYmxlIHtcbiAgY29uc3QgX29wdHMgPSB7IC4uLkRFRkFVTFRfT1BUSU9OUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6IF9vcHRzLm5hbWUsXG4gICAga2V5OiBfb3B0cy5rZXksXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBvdmVycmlkZXM6IF9vcHRzLm92ZXJyaWRlcyxcbiAgfTtcbiAgaWYgKCFzY2hlbWFBcmdzLm5hbWUpIHRocm93IG5ldyBFcnJvcignbmFtZSBpcyByZXF1cmllZCcpO1xuICBpZiAoIXNjaGVtYUFyZ3Mua2V5KSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyByZXF1cmllZCcpO1xuXG4gIGlmIChyYXcuaW5kZXhPZignXFwwJykgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ3VoIG9oJylcblxuICBjb25zdCBbcmF3RmllbGRzLCAuLi5yYXdEYXRhXSA9IHJhd1xuICAgIC5zcGxpdCgnXFxuJylcbiAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgLm1hcChsaW5lID0+IGxpbmUuc3BsaXQoX29wdHMuc2VwYXJhdG9yKSk7XG5cbiAgaWYgKG9wdGlvbnM/LnByZVRyYW5zZm9ybSkge1xuICAgIG9wdGlvbnMucHJlVHJhbnNmb3JtKHJhd0ZpZWxkcywgcmF3RGF0YSk7XG4gIH1cblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn1+JHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF3Q29sdW1uczogQ29sdW1uQXJnc1tdID0gW107XG4gIGZvciAoY29uc3QgW2luZGV4LCBuYW1lXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgbGV0IGM6IG51bGwgfCBDb2x1bW5BcmdzID0gbnVsbDtcbiAgICBzY2hlbWFBcmdzLnJhd0ZpZWxkc1tuYW1lXSA9IGluZGV4O1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgaWYgKF9vcHRzLmtub3duRmllbGRzW25hbWVdKSB7XG4gICAgICBjID0gYXJnc0Zyb21UeXBlKFxuICAgICAgICBuYW1lLFxuICAgICAgICBfb3B0cy5rbm93bkZpZWxkc1tuYW1lXSxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGMgPSBhcmdzRnJvbVRleHQoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgICAgIHJhd0RhdGEsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hQXJncy5uYW1lfTogXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfVxceDFiWzBtYCxcbiAgICAgICAgICAgIGV4XG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGV4XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgIHJhd0NvbHVtbnMucHVzaChjKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucz8uZXh0cmFGaWVsZHMpIHtcbiAgICBjb25zdCBiaSA9IE9iamVjdC52YWx1ZXMoc2NoZW1hQXJncy5yYXdGaWVsZHMpLmxlbmd0aDsgLy8gaG1tbW1cbiAgICByYXdDb2x1bW5zLnB1c2goLi4uT2JqZWN0LmVudHJpZXMob3B0aW9ucy5leHRyYUZpZWxkcykubWFwKFxuICAgICAgKFtuYW1lLCBjcmVhdGVDb2x1bW5dOiBbc3RyaW5nLCBDcmVhdGVFeHRyYUZpZWxkXSwgZWk6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGVpLCBzY2hlbWFBcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGVpO1xuICAgICAgICBjb25zdCBjYSA9IGNyZWF0ZUNvbHVtbihpbmRleCwgc2NoZW1hQXJncywgbmFtZSwgb3ZlcnJpZGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChjYS5pbmRleCAhPT0gaW5kZXgpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBpbmRleCcpO1xuICAgICAgICAgIGlmIChjYS5uYW1lICE9PSBuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3dpc2VndXkgcGlja2VkIGhpcyBvd24gbmFtZScpO1xuICAgICAgICAgIGlmIChjYS50eXBlID09PSBDT0xVTU4uQk9PTCkge1xuICAgICAgICAgICAgaWYgKGNhLmJpdCAhPT0gc2NoZW1hQXJncy5mbGFnc1VzZWQpIHRocm93IG5ldyBFcnJvcigncGlzcyBiYWJ5IGlkaW90Jyk7XG4gICAgICAgICAgICBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjYSwgeyBpbmRleCwgb3ZlcnJpZGUsIG5hbWUsIH0pXG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZGF0YTogUm93W10gPSBuZXcgQXJyYXkocmF3RGF0YS5sZW5ndGgpXG4gICAgLmZpbGwobnVsbClcbiAgICAubWFwKChfLCBfX3Jvd0lkKSA9PiAoeyBfX3Jvd0lkIH0pKVxuICAgIDtcblxuICBmb3IgKGNvbnN0IGNvbEFyZ3Mgb2YgcmF3Q29sdW1ucykge1xuICAgIGNvbnN0IGNvbCA9IGZyb21BcmdzKGNvbEFyZ3MpO1xuICAgIHNjaGVtYUFyZ3MuY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgc2NoZW1hQXJncy5maWVsZHMucHVzaChjb2wubmFtZSk7XG4gIH1cblxuICBpZiAoc2NoZW1hQXJncy5rZXkgIT09ICdfX3Jvd0lkJyAmJiAhc2NoZW1hQXJncy5maWVsZHMuaW5jbHVkZXMoc2NoZW1hQXJncy5rZXkpKVxuICAgIHRocm93IG5ldyBFcnJvcihgZmllbGRzIGlzIG1pc3NpbmcgdGhlIHN1cHBsaWVkIGtleSBcIiR7c2NoZW1hQXJncy5rZXl9XCJgKTtcblxuICBmb3IgKGNvbnN0IGNvbCBvZiBzY2hlbWFBcmdzLmNvbHVtbnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgZGF0YSlcbiAgICAgIGRhdGFbci5fX3Jvd0lkXVtjb2wubmFtZV0gPSBjb2wuZnJvbVRleHQoXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXVtjb2wuaW5kZXhdLFxuICAgICAgICByYXdEYXRhW3IuX19yb3dJZF0sXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IFBhcnNlU2NoZW1hT3B0aW9ucywgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbkR1bXBlZCB9IGZyb20gJy4vam9pbi10YWJsZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuZnVuY3Rpb24gZmluZERlZiAobmFtZTogc3RyaW5nKTogW3N0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XSB7XG4gIGlmIChjc3ZEZWZzW25hbWVdKSByZXR1cm4gW25hbWUsIGNzdkRlZnNbbmFtZV1dO1xuICBmb3IgKGNvbnN0IGsgaW4gY3N2RGVmcykge1xuICAgIGNvbnN0IGQgPSBjc3ZEZWZzW2tdO1xuICAgIGlmIChkLm5hbWUgPT09IG5hbWUpIHJldHVybiBbaywgZF07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBjc3YgZGVmaW5lZCBmb3IgXCIke25hbWV9XCJgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcE9uZShrZXk6IHN0cmluZykge1xuICBjb25zdCB0YWJsZSA9IGF3YWl0IHJlYWRDU1YoLi4uZmluZERlZihrZXkpKTtcbiAgY29tcGFyZUR1bXBzKHRhYmxlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcEFsbCAoKSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICAvLyBKT0lOU1xuICBqb2luRHVtcGVkKHRhYmxlcyk7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLjMwLmJpbidcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXBhcmVEdW1wcyh0OiBUYWJsZSkge1xuICBjb25zdCBtYXhOID0gdC5yb3dzLmxlbmd0aCAtIDMwXG4gIGxldCBuOiBudW1iZXI7XG4gIGxldCBwOiBhbnkgPSB1bmRlZmluZWQ7XG4gIGlmIChmaWVsZHNbMF0gPT09ICdGSUxURVInKSB7XG4gICAgbiA9IDA7IC8vIHdpbGwgYmUgaW5nb3JlZFxuICAgIGZpZWxkcy5zcGxpY2UoMCwgMSwgJ2lkJywgJ25hbWUnKTtcbiAgICBwID0gKHI6IGFueSkgPT4gZmllbGRzLnNsaWNlKDIpLnNvbWUoZiA9PiByW2ZdKTtcbiAgfSBlbHNlIGlmIChmaWVsZHNbMV0gPT09ICdST1cnICYmIGZpZWxkc1syXSkge1xuICAgIG4gPSBOdW1iZXIoZmllbGRzWzJdKSAtIDE1O1xuICAgIGZpZWxkcy5zcGxpY2UoMSwgMilcbiAgICBjb25zb2xlLmxvZyhgZW5zdXJlIHJvdyAke2ZpZWxkc1syXX0gaXMgdmlzaWJsZSAoJHtufSlgKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB0aHJvdyBuZXcgRXJyb3IoJ1JPVyBtdXN0IGJlIE5VTUJFUiEhISEnKTtcbiAgfSBlbHNlIHtcbiAgICBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4TilcbiAgfVxuICBuID0gTWF0aC5taW4obWF4TiwgTWF0aC5tYXgoMCwgbikpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gKGZpZWxkcy5sZW5ndGggPyAoZmllbGRzWzBdID09PSAnQUxMJyA/IHQuc2NoZW1hLmZpZWxkcyA6IGZpZWxkcykgOlxuICAgdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDEwKSkgYXMgc3RyaW5nW11cbiAgZHVtcFRvQ29uc29sZSh0LCBuLCBtLCBmLCAnQkVGT1JFJywgcCk7XG4gIC8qXG4gIGlmICgxICsgMSA9PT0gMikgcmV0dXJuOyAvLyBUT0RPIC0gd2Ugbm90IHdvcnJpZWQgYWJvdXQgdGhlIG90aGVyIHNpZGUgeWV0XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXMoW3RdKTtcbiAgY29uc29sZS5sb2coYG1hZGUgJHtibG9iLnNpemV9IGJ5dGUgYmxvYmApO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgLy8oZ2xvYmFsVGhpcy5fUk9XUyA/Pz0ge30pW3Quc2NoZW1hLm5hbWVdID0gdC5yb3dzO1xuICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBkdW1wVG9Db25zb2xlKHVbdC5zY2hlbWEubmFtZV0sIG4sIG0sIGYsICdBRlRFUicsIHApO1xuICAvL2F3YWl0IHdyaXRlRmlsZSgnLi90bXAuYmluJywgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgKi9cbn1cblxuZnVuY3Rpb24gZHVtcFRvQ29uc29sZShcbiAgdDogVGFibGUsXG4gIG46IG51bWJlcixcbiAgbTogbnVtYmVyLFxuICBmOiBzdHJpbmdbXSxcbiAgaDogc3RyaW5nLFxuICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbikge1xuICBjb25zb2xlLmxvZyhgXFxuICAgICAke2h9OmApO1xuICB0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICBjb25zdCByb3dzID0gdC5wcmludCh3aWR0aCwgZiwgbiwgbSwgcCk7XG4gIGlmIChyb3dzKSBmb3IgKGNvbnN0IHIgb2Ygcm93cykgY29uc29sZS50YWJsZShbcl0pO1xuICBjb25zb2xlLmxvZyhgICAgIC8ke2h9XFxuXFxuYClcbn1cblxuXG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIGR1bXBPbmUoZmlsZSk7XG5lbHNlIGR1bXBBbGwoKTtcblxuXG4iLCAiaW1wb3J0IHtcbiAgQm9vbENvbHVtbixcbiAgQ09MVU1OLFxuICBOdW1lcmljQ29sdW1uLFxuICBTY2hlbWEsXG4gIFRhYmxlXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG50eXBlIFRSID0gUmVjb3JkPHN0cmluZywgVGFibGU+O1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5EdW1wZWQgKHRhYmxlTGlzdDogVGFibGVbXSkge1xuICBjb25zdCB0YWJsZXM6IFRSID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlTGlzdC5tYXAodCA9PiBbdC5uYW1lLCB0XSkpO1xuICB0YWJsZUxpc3QucHVzaChcbiAgICBtYWtlTmF0aW9uU2l0ZXModGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5U2l0ZSh0YWJsZXMpLFxuICAgIG1ha2VTcGVsbEJ5TmF0aW9uKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlVbml0KHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeU5hdGlvbih0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlVbml0U3VtbW9uKHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeVNwZWxsKHRhYmxlcyksXG4gICk7XG4gIG1ha2VNaXNjVW5pdCh0YWJsZXMpO1xuXG4gIC8vZHVtcFJlYWxtcyh0YWJsZXMpO1xuXG4gIC8vIHRhYmxlcyBoYXZlIGJlZW4gY29tYmluZWR+IVxuICBmb3IgKGNvbnN0IHQgb2YgW1xuICAgIHRhYmxlcy5Db2FzdExlYWRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuRm9ydFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Ob25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Ob25Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLlByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLlJlYWxtLFxuICBdKSB7XG4gICAgVGFibGUucmVtb3ZlVGFibGUodCwgdGFibGVMaXN0KTtcbiAgfVxuXG4gIC8vIGp1c3Qgc2VlaW5nIHdoZXJlIHdlJ3JlIGF0Li4uXG4gIGxldCB1cyA9IDA7XG4gIGxldCB1dCA9IDA7XG4gIGZvciAoY29uc3QgdW5pdCBvZiB0YWJsZXMuVW5pdC5yb3dzKSB7XG4gICAgdXQrKztcbiAgICBpZiAodW5pdC5zb3VyY2UpIHVzKys7XG4gICAgLy9pZiAoIXVuaXQuc291cmNlKSBjb25zb2xlLmxvZyhgJHt1bml0LmlkfToke3VuaXQubmFtZX0gaGFzIG5vIHNvdXJjZXNgKTtcbiAgfVxuICBjb25zb2xlLmxvZyhgJHt1c30gLyAke3V0fSB1bml0cyBoYXZlIHNvdXJjZXNgKVxuICBjb25zb2xlLmxvZygnVW5pdCBqb2luZWQgYnk/JywgdGFibGVzLlVuaXQuc2NoZW1hLmpvaW5lZEJ5KVxufVxuXG5mdW5jdGlvbiBkdW1wUmVhbG1zICh7IFJlYWxtLCBVbml0IH06IFRSKSB7XG4gIC8vIHNlZW1zIGxpa2UgdGhlIHJlYWxtIGNzdiBpcyByZWR1bmRhbnQ/XG4gIGNvbnNvbGUubG9nKCdSRUFMTSBTVEFUUzonKVxuICBjb25zdCBjb21iaW5lZCA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXI+KCk7XG5cbiAgZm9yIChjb25zdCB1IG9mIFVuaXQucm93cykgaWYgKHUucmVhbG0xKSBjb21iaW5lZC5zZXQodS5pZCwgdS5yZWFsbTEpO1xuXG4gIGZvciAoY29uc3QgeyBtb25zdGVyX251bWJlciwgcmVhbG0gfSBvZiBSZWFsbS5yb3dzKSB7XG4gICAgaWYgKCFjb21iaW5lZC5oYXMobW9uc3Rlcl9udW1iZXIpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHttb25zdGVyX251bWJlcn0gUkVBTE0gSVMgREVGSU5FRCBPTkxZIElOIFJFQUxNUyBDU1ZgKTtcbiAgICAgIGNvbWJpbmVkLnNldChtb25zdGVyX251bWJlciwgcmVhbG0pO1xuICAgIH0gZWxzZSBpZiAoY29tYmluZWQuZ2V0KG1vbnN0ZXJfbnVtYmVyKSAhPT0gcmVhbG0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke21vbnN0ZXJfbnVtYmVyfSBSRUFMTSBDT05GTElDVCEgdW5pdC5jc3YgPSAke2NvbWJpbmVkLmdldChtb25zdGVyX251bWJlcil9LCByZWFsbS5jc3Y9JHtyZWFsbX1gKTtcbiAgICB9XG4gIH1cbn1cblxuXG5jb25zdCBBVFRSX0ZBUlNVTUNPTSA9IDc5MDsgLy8gbHVsIHdoeSBpcyB0aGlzIHRoZSBvbmx5IG9uZT8/XG4vLyBUT0RPIC0gcmVhbmltYXRpb25zIGFzd2VsbD8gdHdpY2Vib3JuIHRvbz8gbGVtdXJpYS1lc3F1ZSBmcmVlc3Bhd24/IHZvaWRnYXRlP1xuLy8gbWlnaHQgaGF2ZSB0byBhZGQgYWxsIHRoYXQgbWFudWFsbHksIHdoaWNoIHNob3VsZCBiZSBva2F5IHNpbmNlIGl0J3Mgbm90IGxpa2Vcbi8vIHRoZXkncmUgYWNjZXNzaWJsZSB0byBtb2RzIGFueXdheT9cbi8vIHNvb24gVE9ETyAtIHN1bW1vbnMsIGV2ZW50IG1vbnN0ZXJzL2hlcm9zXG4vKlxubm90IHVzZWQsIGp1c3Qga2VlcGluZyBmb3Igbm90ZXNcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19TUkMge1xuICBVTktOT1dOID0gMCwgLy8gaS5lLiBub25lIGZvdW5kLCBwcm9iYWJseSBpbmRpZSBwZD9cbiAgU1VNTU9OX0FMTElFUyA9IDEsIC8vIHZpYSAjbWFrZW1vbnN0ZXJOXG4gIFNVTU1PTl9ET00gPSAyLCAvLyB2aWEgI1tyYXJlXWRvbXN1bW1vbk5cbiAgU1VNTU9OX0FVVE8gPSAzLCAvLyB2aWEgI3N1bW1vbk4gLyBcInR1cm1vaWxzdW1tb25cIiAvIHdpbnRlcnN1bW1vbjFkM1xuICBTVU1NT05fQkFUVExFID0gNCwgLy8gdmlhICNiYXRzdGFydHN1bU4gb3IgI2JhdHRsZXN1bVxuICBURU1QTEVfVFJBSU5FUiA9IDUsIC8vIHZpYSAjdGVtcGxldHJhaW5lciwgdmFsdWUgaXMgaGFyZCBjb2RlZCB0byAxODU5Li4uXG4gIFJJVFVBTCA9IDYsXG4gIEVOVEVSX1NJVEUgPSA3LFxuICBSRUNfU0lURSA9IDgsXG4gIFJFQ19DQVAgPSA5LFxuICBSRUNfRk9SRUlHTiA9IDEwLFxuICBSRUNfRk9SVCA9IDExLFxuICBFVkVOVCA9IDEyLFxuICBIRVJPID0gMTMsXG4gIFBSRVRFTkRFUiA9IDE0LFxufVxuKi9cblxuLy8gVE9ETyAtIGV4cG9ydCB0aGVzZSBmcm9tIHNvbWV3aGVyZSBtb3JlIHNlbnNpYmxlXG5leHBvcnQgY29uc3QgZW51bSBSRUNfVFlQRSB7XG4gIEZPUlQgPSAwLCAvLyBub3JtYWwgaSBndWVzc1xuICBQUkVURU5ERVIgPSAxLCAvLyB1IGhlYXJkIGl0IGhlcmVcbiAgRk9SRUlHTiA9IDIsXG4gIFdBVEVSID0gMyxcbiAgQ09BU1QgPSA0LFxuICBGT1JFU1QgPSA1LFxuICBTV0FNUCA9IDYsXG4gIFdBU1RFID0gNyxcbiAgTU9VTlRBSU4gPSA4LFxuICBDQVZFID0gOSxcbiAgUExBSU5TID0gMTAsXG4gIEhFUk8gPSAxMSxcbiAgTVVMVElIRVJPID0gMTIsXG4gIFBSRVRFTkRFUl9DSEVBUF8yMCA9IDEzLFxuICBQUkVURU5ERVJfQ0hFQVBfNDAgPSAxNCxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gVU5JVF9UWVBFIHtcbiAgTk9ORSA9IDAsICAgICAgLy8ganVzdCBhIHVuaXQuLi5cbiAgQ09NTUFOREVSID0gMSxcbiAgUFJFVEVOREVSID0gMixcbiAgQ0FQT05MWSA9IDQsXG4gIEhFUk8gPSA4LFxufVxuXG5cbmV4cG9ydCBjb25zdCBSZWFsbU5hbWVzID0gW1xuICAnTm9uZScsXG4gICdOb3J0aCcsXG4gICdDZWx0aWMnLFxuICAnTWVkaXRlcnJhbmVhbicsXG4gICdGYXIgRWFzdCcsXG4gICdNaWRkbGUgRWFzdCcsXG4gICdNaWRkbGUgQW1lcmljYScsXG4gICdBZnJpY2EnLFxuICAnSW5kaWEnLFxuICAnRGVlcHMnLFxuICAnRGVmYXVsdCdcbl07XG5mdW5jdGlvbiBtYWtlTmF0aW9uU2l0ZXModGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBBdHRyaWJ1dGVCeU5hdGlvbiwgTmF0aW9uIH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTaXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMSxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgam9pbnM6ICdOYXRpb25bbmF0aW9uSWRdPVNpdGVzK01hZ2ljU2l0ZVtzaXRlSWRdPU5hdGlvbnMnLFxuICAgIGZpZWxkczogW1xuICAgICAgJ25hdGlvbklkJyxcbiAgICAgICdzaXRlSWQnLFxuICAgICAgJ2Z1dHVyZScsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NpdGVJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgQm9vbENvbHVtbih7XG4gICAgICAgIG5hbWU6ICdmdXR1cmUnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLkJPT0wsXG4gICAgICAgIGJpdDogMCxcbiAgICAgICAgZmxhZzogMVxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW11cbiAgZm9yIChsZXQgW2ksIHJvd10gb2YgQXR0cmlidXRlQnlOYXRpb24ucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IG5hdGlvbl9udW1iZXI6IG5hdGlvbklkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZTogc2l0ZUlkIH0gPSByb3c7XG4gICAgbGV0IGZ1dHVyZTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICAvLyB3aGlsZSB3ZSdyZSBoZXJlLCBsZXRzIHB1dCByZWFsbSBpZCByaWdodCBvbiB0aGUgbmF0aW9uIChleHRyYUZpZWxkIGluIGRlZilcbiAgICAgIGNhc2UgMjg5OlxuICAgICAgICAvL2NvbnNvbGUubG9nKGBuYXRpb25hbCByZWFsbTogJHtuYXRpb25JZH0gLT4gJHtzaXRlSWR9YClcbiAgICAgICAgY29uc3QgbmF0aW9uID0gTmF0aW9uLm1hcC5nZXQobmF0aW9uSWQpO1xuICAgICAgICBpZiAoIW5hdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGludmFsaWQgbmF0aW9uIGlkICR7bmF0aW9uSWR9IChubyByb3cgaW4gTmF0aW9uKWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNvbmZ1c2luZyEgdG9ucyBvZiBuYXRpb25zIGhhdmUgbXVsdGlwbGUgcmVhbG1zPyBqdXN0IHVzZSB0aGUgbW9zdFxuICAgICAgICAgIC8vIHJlY2VudCBvbmUgSSBndWVzcz9cbiAgICAgICAgICAvL2lmIChuYXRpb24ucmVhbG0pIHtcbiAgICAgICAgICAgIC8vY29uc3QgcHJldiA9IFJlYWxtTmFtZXNbbmF0aW9uLnJlYWxtXTtcbiAgICAgICAgICAgIC8vY29uc3QgbmV4dCA9IFJlYWxtTmFtZXNbc2l0ZUlkXTtcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihgJHtuYXRpb24ubmFtZX0gUkVBTE0gJHtwcmV2fSAtPiAke25leHR9YCk7XG4gICAgICAgICAgLy99XG4gICAgICAgICAgbmF0aW9uLnJlYWxtID0gc2l0ZUlkO1xuICAgICAgICB9XG4gICAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICAvLyBmdXR1cmUgc2l0ZVxuICAgICAgY2FzZSA2MzE6XG4gICAgICAgIGZ1dHVyZSA9IHRydWU7XG4gICAgICAgIC8vIHUga25vdyB0aGlzIGJpdGNoIGZhbGxzIFRIUlVcbiAgICAgIC8vIHN0YXJ0IHNpdGVcbiAgICAgIGNhc2UgNTI6XG4gICAgICBjYXNlIDEwMDpcbiAgICAgIGNhc2UgMjU6XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gc29tZSBvdGhlciBkdW1iYXNzIGF0dHJpYnV0ZVxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByb3dzLnB1c2goe1xuICAgICAgbmF0aW9uSWQsXG4gICAgICBzaXRlSWQsXG4gICAgICBmdXR1cmUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICB9KTtcbiAgICBkZWxSb3dzLnB1c2goaSk7XG4gIH1cblxuICAvLyByZW1vdmUgbm93LXJlZHVuZGFudCBhdHRyaWJ1dGVzXG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIHRydWVcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlOYXRpb24gKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1NwZWxsW3NwZWxsSWRdPU5hdGlvbnMrTmF0aW9uW25hdGlvbklkXT1TcGVsbHMnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBzcGVsbElkOiAwLCBuYXRpb25JZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ25hdGlvbklkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gMjc4KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gTkFUSU9OICR7cmF3X3ZhbHVlfWApO1xuICAgICAgY29uc3QgbmF0aW9uSWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobmF0aW9uSWQpIHx8IG5hdGlvbklkIDwgMCB8fCBuYXRpb25JZCA+IDI1NSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgTkFZU0ggISEhISEgKCR7bmF0aW9uSWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgbmF0aW9uSWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICBmYWxzZVxuICApO1xufVxuXG5mdW5jdGlvbiBtYWtlU3BlbGxCeVVuaXQgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5VW5pdCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbFtzcGVsbElkXT1Pbmx5VW5pdHMrVW5pdFt1bml0SWRdPVNwZWxscycsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNwZWxsSWQ6IDAsIHVuaXRJZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ3VuaXRJZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NwZWxsSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gNzMxKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gVU5JVCAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IHVuaXRJZCA9IE51bWJlcihyYXdfdmFsdWUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcih1bml0SWQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAgICAgISEhISEgVE9PIEJJRyBVTklUICEhISEhICgke3VuaXRJZH0pYCk7XG4gICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICByb3dzLnB1c2goeyBfX3Jvd0lkLCBzcGVsbElkLCB1bml0SWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICB3aGlsZSAoKGRpID0gZGVsUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZCkgYXR0cnMucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlXG4gICk7XG59XG5cbi8vIGZldyB0aGluZ3MgaGVyZTpcbi8vIC0gaG1vbjEtNSAmIGhjb20xLTQgYXJlIGNhcC1vbmx5IHVuaXRzL2NvbW1hbmRlcnNcbi8vIC0gbmF0aW9uYWxyZWNydWl0cyArIG5hdGNvbSAvIG5hdG1vbiBhcmUgbm9uLWNhcCBvbmx5IHNpdGUtZXhjbHVzaXZlcyAoeWF5KVxuLy8gLSBtb24xLTIgJiBjb20xLTMgYXJlIGdlbmVyaWMgcmVjcnVpdGFibGUgdW5pdHMvY29tbWFuZGVyc1xuLy8gLSBzdW0xLTQgJiBuX3N1bTEtNCBhcmUgbWFnZS1zdW1tb25hYmxlIChuIGRldGVybWluZXMgbWFnZSBsdmwgcmVxKVxuLy8gKHZvaWRnYXRlIC0gbm90IHJlYWxseSByZWxldmFudCBoZXJlLCBpdCBkb2Vzbid0IGluZGljYXRlIHdoYXQgbW9uc3RlcnMgYXJlXG4vLyBzdW1tb25lZCwgbWF5IGFkZCB0aG9zZSBtYW51YWxseT8pXG5cbmV4cG9ydCBlbnVtIFNJVEVfUkVDIHtcbiAgSE9NRV9NT04gPSAwLCAvLyBhcmcgaXMgbmF0aW9uLCB3ZSdsbCBoYXZlIHRvIGFkZCBpdCBsYXRlciB0aG91Z2hcbiAgSE9NRV9DT00gPSAxLCAvLyBzYW1lXG4gIFJFQ19NT04gPSAyLFxuICBSRUNfQ09NID0gMyxcbiAgTkFUX01PTiA9IDQsIC8vIGFyZyBpcyBuYXRpb25cbiAgTkFUX0NPTSA9IDUsIC8vIHNhbWVcbiAgU1VNTU9OID0gOCwgLy8gYXJnIGlzIGxldmVsIHJlcXVpcmVtZW50IChpbmNsdWRlIHBhdGg/KVxufVxuXG5jb25zdCBTX0hNT05TID0gQXJyYXkuZnJvbSgnMTIzNDUnLCBuID0+IGBobW9uJHtufWApO1xuY29uc3QgU19IQ09NUyA9IEFycmF5LmZyb20oJzEyMzQnLCBuID0+IGBoY29tJHtufWApO1xuY29uc3QgU19STU9OUyA9IEFycmF5LmZyb20oJzEyJywgbiA9PiBgbW9uJHtufWApO1xuY29uc3QgU19SQ09NUyA9IEFycmF5LmZyb20oJzEyMycsIG4gPT4gYGNvbSR7bn1gKTtcbmNvbnN0IFNfU1VNTlMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBbYHN1bSR7bn1gLCBgbl9zdW0ke259YF0pO1xuXG5mdW5jdGlvbiBtYWtlVW5pdEJ5U2l0ZSAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBNYWdpY1NpdGUsIFNpdGVCeU5hdGlvbiwgVW5pdCB9ID0gdGFibGVzO1xuICBpZiAoIVNpdGVCeU5hdGlvbikgdGhyb3cgbmV3IEVycm9yKCdkbyBTaXRlQnlOYXRpb24gZmlyc3QnKTtcblxuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdNYWdpY1NpdGVbc2l0ZUlkXT1Vbml0cytVbml0W3VuaXRJZF09U291cmNlJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc2l0ZUlkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIsIHJlY0FyZzogMyB9LFxuICAgIGZpZWxkczogWydzaXRlSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnLCAncmVjQXJnJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjQXJnJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHNpdGUgb2YgTWFnaWNTaXRlLnJvd3MpIHtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU19ITU9OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IDA7XG4gICAgICBjb25zdCBuaiA9IHNpdGUuTmF0aW9ucz8uZmluZCgoeyBzaXRlSWQgfSkgPT4gc2l0ZUlkID09PSBzaXRlLmlkKTtcbiAgICAgIGlmICghbmopIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAnbWl4ZWQgdXAgY2FwLW9ubHkgbW9uIHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuTmF0aW9uc1xuICAgICAgICApO1xuICAgICAgICByZWNBcmcgPSAwO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25paWlpY2UnLCBuaiwgc2l0ZS5OYXRpb25zKVxuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gMDtcbiAgICAgIGNvbnN0IG5qID0gc2l0ZS5OYXRpb25zPy5maW5kKCh7IHNpdGVJZCB9KSA9PiBzaXRlSWQgPT09IHNpdGUuaWQpO1xuICAgICAgaWYgKCFuaikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICdtaXhlZCB1cCBjYXAtb25seSBjbWRyIHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuTmF0aW9uc1xuICAgICAgICApO1xuICAgICAgICByZWNBcmcgPSAwO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY0FyZyA9IG5qLm5hdGlvbklkO1xuICAgICAgfVxuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldChtbnIpO1xuICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgdW5pdC50eXBlIHw9IDE7IC8vIGZsYWcgYXMgYSBjb21tYW5kZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIGNhcC1vbmx5IHNpdGUgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY0FyZyxcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuSE9NRV9DT00sXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrIG9mIFNfUk1PTlMpIHtcbiAgICAgIGNvbnN0IG1uciA9IHNpdGVba107XG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KG1ucik7XG4gICAgICBpZiAodW5pdCkge1xuICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgc2l0ZSBjb21tYW5kZXIgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2ssIG5rXSBvZiBTX1NVTU5TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCBhcmcgPSBzaXRlW25rXTtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5TVU1NT04sXG4gICAgICAgIHJlY0FyZzogYXJnLCAvLyBsZXZlbCByZXF1aXVyZW1lbnQgKGNvdWxkIGFsc28gaW5jbHVkZSBwYXRoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNpdGUubmF0aW9uYWxyZWNydWl0cykge1xuICAgICAgaWYgKHNpdGUubmF0bW9uKSByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IHNpdGUubmF0bW9uLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5OQVRfTU9OLFxuICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgIH0pO1xuICAgICAgaWYgKHNpdGUubmF0Y29tKSB7XG4gICAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICAgIHVuaXRJZDogc2l0ZS5uYXRjb20sXG4gICAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX0NPTSxcbiAgICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQoc2l0ZS5uYXRjb20pO1xuICAgICAgICBpZiAodW5pdCkge1xuICAgICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgbmF0Y29tIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHlheSFcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZVxuICApO1xuXG59XG5cbiAgLypcbmNvbnN0IFNVTV9GSUVMRFMgPSBbXG4gIC8vIHRoZXNlIHR3byBjb21iaW5lZCBzZWVtIHRvIGJlIHN1bW1vbiAjbWFrZW1vbnN0ZXJOXG4gICdzdW1tb24nLCAnbl9zdW1tb24nLFxuICAvLyB0aGlzIGlzIHVzZWQgYnkgdGhlIGdob3VsIGxvcmQgb25seSwgYW5kIGl0IHNob3VsZCBhY3R1YWxseSBiZSBgbl9zdW1tb24gPSA1YFxuICAnc3VtbW9uNScsXG4gIC8vIGF1dG8gc3VtbW9uIDEvbW9udGgsIGFzIHBlciBtb2QgY29tbWFuZHMsIHVzZWQgb25seSBieSBmYWxzZSBwcm9waGV0IGFuZCB2aW5lIGd1eT9cbiAgJ3N1bW1vbjEnLFxuXG4gIC8vIGRvbSBzdW1tb24gY29tbWFuZHNcbiAgJ2RvbXN1bW1vbicsXG4gICdkb21zdW1tb24yJyxcbiAgJ2RvbXN1bW1vbjIwJyxcbiAgJ3JhcmVkb21zdW1tb24nLFxuXG4gICdiYXRzdGFydHN1bTEnLFxuICAnYmF0c3RhcnRzdW0yJyxcbiAgJ2JhdHN0YXJ0c3VtMycsXG4gICdiYXRzdGFydHN1bTQnLFxuICAnYmF0c3RhcnRzdW01JyxcbiAgJ2JhdHN0YXJ0c3VtMWQzJyxcbiAgJ2JhdHN0YXJ0c3VtMWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtMmQ2JyxcbiAgJ2JhdHN0YXJ0c3VtM2Q2JyxcbiAgJ2JhdHN0YXJ0c3VtNGQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNmQ2JyxcbiAgJ2JhdHRsZXN1bTUnLCAvLyBwZXIgcm91bmRcblxuICAvLydvbmlzdW1tb24nLCB3ZSBkb250IHJlYWxseSBjYXJlIGFib3V0IHRoaXMgb25lIGJlY2F1c2UgaXQgZG9lc250IHRlbGwgdXNcbiAgLy8gIGFib3V0IHdoaWNoIG1vbnN0ZXJzIGFyZSBzdW1tb25lZFxuICAvLyAnaGVhdGhlbnN1bW1vbicsIGlkZms/PyBodHRwczovL2lsbHdpa2kuY29tL2RvbTUvdXNlci9sb2dneS9zbGF2ZXJcbiAgLy8gJ2NvbGRzdW1tb24nLCB1bnVzZWRcbiAgLy8nd2ludGVyc3VtbW9uMWQzJywgLy8gdmFtcCBxdWVlbiwgbm90IGFjdHVhbGx5IGEgKGRvY3VtZW50ZWQpIGNvbW1hbmQ/XG4gIC8vJ3R1cm1vaWxzdW1tb24nLCAvLyBhbHNvIG5vdCBhIGNvbW1hbmQgfiAhXG5dXG4qL1xuXG5cbmV4cG9ydCBjb25zdCBlbnVtIE1PTl9TVU1NT04ge1xuICBVTktOT1dOID0gMCxcbiAgQUxMSUVTID0gMSwgLy8gdmlhICNtYWtlbW9uc3Rlck4gKGFuZCB0aGUgc2luZ2xlIHN1bW1vbjUgaW4gdGhlIGNzdiBkYXRhKVxuICBET00gPSAyLCAvLyB2aWEgI1tyYXJlXWRvbXN1bW1vbk5cbiAgQVVUTyA9IDMsIC8vIHZpYSAjc3VtbW9uMSAoZ29lcyB1cCB0byA1KVxuICBCQVRUTEVfUk9VTkQgPSA0LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIEJBVFRMRV9TVEFSVCA9IDUsIC8vIHZpYSAjYmF0c3RhcnRzdW1OIG9yICNiYXR0bGVzdW1cbiAgVEVNUExFX1RSQUlORVIgPSA2LCAvLyB2aWEgI3RlbXBsZXRyYWluZXIsIHZhbHVlIGlzIGhhcmQgY29kZWQgdG8gMTg1OS4uLlxuICBXSU5URVIgPSA3LCAvLyBub3QgYSBjb21tYW5kLCB1c2VkIG9uY2UgYnkgdmFtcGlyZSBxdWVlblxuICBNT1VOVCA9IDgsIC8vIG5vdCByZWFsbHkgYSBzdW1tb24gYnV0IGVmZmVjdGl2ZWx5IHNpbWlsYXJcbn1cblxuZnVuY3Rpb24gRF9TVU1NT04gKHQ6IE1PTl9TVU1NT04sIHM6IG51bWJlcik6IHN0cmluZyB7XG4gIHN3aXRjaCAodCkge1xuICAgIGNhc2UgTU9OX1NVTU1PTi5BTExJRVM6IHJldHVybiBgI21ha2Vtb25zdGVyJHtzfWA7XG4gICAgY2FzZSBNT05fU1VNTU9OLkRPTToge1xuICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgIGNhc2UgMDogcmV0dXJuIGAjZG9tc3VtbW9uYDtcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gYCNkb21zdW1tb24yYDtcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gYCNkb21zdW1tb24yMGA7XG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGAjcmFyZWRvbXN1bW1vbmA7XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBgRE9NID8/ICR7dH06JHtzfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGNhc2UgTU9OX1NVTU1PTi5BVVRPOiByZXR1cm4gYCNzdW1tb24ke3N9YDtcbiAgICBjYXNlIE1PTl9TVU1NT04uQkFUVExFX1JPVU5EOiByZXR1cm4gYCNiYXR0bGVzdW0ke3N9YDtcbiAgICBjYXNlIE1PTl9TVU1NT04uQkFUVExFX1NUQVJUOiB7XG4gICAgICBjb25zdCBuID0gcyAmIDYzO1xuICAgICAgcmV0dXJuIHMgJiAxMjggPyBgI2JhdHN0YXJ0c3VtJHtufWQ2YCA6XG4gICAgICAgIHMgJiA2NCA/IGAjYmF0c3RhcnRzdW0xZDNgIDpcbiAgICAgICAgYCNiYXRzdGFydHN1bSR7bn1gO1xuICAgIH1cbiAgICBjYXNlIE1PTl9TVU1NT04uVEVNUExFX1RSQUlORVI6IHJldHVybiBgI3RlbXBsZXRyYWluZXJgO1xuICAgIGNhc2UgTU9OX1NVTU1PTi5XSU5URVI6IHJldHVybiBgKDFkMyBhdCB0aGUgc3RhcnQgb2Ygd2ludGVyKWA7XG4gICAgZGVmYXVsdDogcmV0dXJuIGBJREs/Pz8gdD0ke3R9OyBzPSR7c31gXG4gIH1cbn1cblxuXG5mdW5jdGlvbiBtYWtlVW5pdEJ5VW5pdFN1bW1vbiAodGFibGVzOiBUUikge1xuICBjb25zdCB7IFVuaXQgfSA9IHRhYmxlcztcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVN1bW1vbmVyJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1VuaXRbc3VtbW9uZXJJZF09U3VtbW9ucytVbml0W3VuaXRJZF09U291cmNlJyxcbiAgICBmbGFnc1VzZWQ6IDEsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICBmaWVsZHM6IFsndW5pdElkJywgJ3N1bW1vbmVySWQnLCAnc3VtbW9uVHlwZScsICdzdW1tb25TdHJlbmd0aCcsICdhc1RhZyddLFxuICAgIHJhd0ZpZWxkczoge1xuICAgICAgdW5pdElkOiAwLFxuICAgICAgc3VtbW9uZXJJZDogMSxcbiAgICAgIHN1bW1vblR5cGU6IDIsXG4gICAgICBzdW1tb25TdHJlbmd0aDogMyxcbiAgICAgIGFzVGFnOiA0XG4gICAgfSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3VtbW9uZXJJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25UeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3VtbW9uU3RyZW5ndGgnLFxuICAgICAgICBpbmRleDogMyxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgQm9vbENvbHVtbih7XG4gICAgICAgIG5hbWU6ICdhc1RhZycsXG4gICAgICAgIGluZGV4OiA0LFxuICAgICAgICB0eXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgICAgYml0OiAwLFxuICAgICAgICBmbGFnOiAxLFxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHByaW50Um93IChzaWQ6IG51bWJlciwgdWlkOiBudW1iZXIsIHQ6IE1PTl9TVU1NT04sIHM6IG51bWJlciwgcD86IHN0cmluZykge1xuICAgIHAgPz89ICcgIC0nO1xuICAgIGNvbnN0IHNuID0gVW5pdC5tYXAuZ2V0KHNpZCkubmFtZVxuICAgIGNvbnN0IHVuID0gVW5pdC5tYXAuZ2V0KHVpZCkubmFtZVxuICAgIGNvbnN0IGQgPSBEX1NVTU1PTih0LCBzKTtcbiAgICBjb25zb2xlLmxvZyhgJHtwfSAke2R9ICR7c259IC0+ICR7dW59YCk7XG4gIH1cbiAgZnVuY3Rpb24gYWRkUm93IChcbiAgICBzdW1tb25UeXBlOiBNT05fU1VNTU9OLFxuICAgIHN1bW1vblN0cmVuZ3RoOiBudW1iZXIsXG4gICAgc3VtbW9uZXJJZDogbnVtYmVyLFxuICAgIHRhcmdldDogbnVtYmVyLFxuICApIHtcbiAgICBpZiAodGFyZ2V0ID4gMCkge1xuICAgICAgY29uc3QgciA9IHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHN1bW1vbmVySWQsXG4gICAgICAgIHN1bW1vblR5cGUsXG4gICAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgICBhc1RhZzogZmFsc2UsXG4gICAgICAgIHVuaXRJZDogdGFyZ2V0LFxuICAgICAgfTtcbiAgICAgIHByaW50Um93KHIuc3VtbW9uZXJJZCwgci51bml0SWQsIHIuc3VtbW9uVHlwZSwgci5zdW1tb25TdHJlbmd0aClcbiAgICAgIHJvd3MucHVzaChyKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA8IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgIE1PTlRBRyAnICsgdGFyZ2V0ICsgJyBbJyk7XG4gICAgICBpZiAoIU1PTlRBR1NbdGFyZ2V0XT8ubGVuZ3RoKSBjb25zb2xlLmxvZygnICAgIChNSVNTSU5HISknKTtcbiAgICAgIGVsc2UgZm9yIChjb25zdCB1bml0SWQgb2YgTU9OVEFHU1t0YXJnZXRdKSB7XG4gICAgICAgIGNvbnN0IHIgPSB7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc3VtbW9uZXJJZCxcbiAgICAgICAgICBzdW1tb25UeXBlLFxuICAgICAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgICAgIGFzVGFnOiB0cnVlLFxuICAgICAgICAgIHVuaXRJZCxcbiAgICAgICAgfVxuICAgICAgICBwcmludFJvdyhyLnN1bW1vbmVySWQsIHIudW5pdElkLCByLnN1bW1vblR5cGUsIHIuc3VtbW9uU3RyZW5ndGgsICcgICAgID4nKTtcbiAgICAgICAgcm93cy5wdXNoKHIpO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coJyAgXVxcbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKGAgICAgICAhISEhISAke1VuaXQubWFwLmdldChzdW1tb25lcklkKS5uYW1lfSBTVU1NT05TIElEIDAgISFgKVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qgc3VtbW9uZXIgb2YgVW5pdC5yb3dzKSB7XG4gICAgaWYgKHN1bW1vbmVyLnN1bW1vbilcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLkFMTElFUywgc3VtbW9uZXIubl9zdW1tb24sIHN1bW1vbmVyLmlkLCBzdW1tb25lci5zdW1tb24pO1xuXG4gICAgaWYgKHN1bW1vbmVyLnN1bW1vbjUpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5BTExJRVMsIDUsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5zdW1tb241KTtcblxuICAgIGlmIChzdW1tb25lci5zdW1tb24xKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uQVVUTywgMSwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLnN1bW1vbjEpO1xuXG4gICAgLy8gdmFsdWUgaXMgaGFyZCBjb2RlZCB0byAxODU5ICh0aGF0cyB0aGUgb25seSB0aGluZyBzdW1tb25lZCBpbiB2YW5pbGxhKVxuICAgIGlmIChzdW1tb25lci50ZW1wbGV0cmFpbmVyKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uVEVNUExFX1RSQUlORVIsIDAsIHN1bW1vbmVyLmlkLCAxODU5KTtcbiAgICBpZiAoc3VtbW9uZXIud2ludGVyc3VtbW9uMWQzKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uV0lOVEVSLCAwLCBzdW1tb25lci5pZCwgc3VtbW9uZXIud2ludGVyc3VtbW9uMWQzKTtcblxuICAgIGlmIChzdW1tb25lci5kb21zdW1tb24pXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5ET00sIDAsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5kb21zdW1tb24pO1xuICAgIGlmIChzdW1tb25lci5kb21zdW1tb24yKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uRE9NLCAxLCBzdW1tb25lci5pZCwgc3VtbW9uZXIuZG9tc3VtbW9uMik7XG4gICAgaWYgKHN1bW1vbmVyLmRvbXN1bW1vbjIwKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uRE9NLCAyLCBzdW1tb25lci5pZCwgc3VtbW9uZXIuZG9tc3VtbW9uMjApO1xuICAgIGlmIChzdW1tb25lci5yYXJlZG9tc3VtbW9uKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uRE9NLCAzLCBzdW1tb25lci5pZCwgc3VtbW9uZXIucmFyZWRvbXN1bW1vbik7XG5cbiAgICBmb3IgKGNvbnN0IHMgb2YgWy8qMSwyLDMsNCwqLzVdKSB7IC8vIG9ubHkgNSBpbiB0aGUgY3N2XG4gICAgICBjb25zdCBrID0gYGJhdHRsZXN1bSR7c31gO1xuICAgICAgaWYgKHN1bW1vbmVyW2tdKSBhZGRSb3coTU9OX1NVTU1PTi5CQVRUTEVfUk9VTkQsIHMsIHN1bW1vbmVyLmlkLCBzdW1tb25lcltrXSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzIG9mIFsxLDIsMyw0LDVdKSB7XG4gICAgICBjb25zdCBrID0gYGJhdHN0YXJ0c3VtJHtzfWA7XG4gICAgICBpZiAoc3VtbW9uZXJba10pIGFkZFJvdyhNT05fU1VNTU9OLkJBVFRMRV9TVEFSVCwgcywgc3VtbW9uZXIuaWQsIHN1bW1vbmVyW2tdKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBzIG9mIFsxLDIsMyw0LDUsNi8qLDcsOCw5Ki9dKSB7IC8vIHZhbmlsbGEgb25seSB1c2VzIHVwIHRvIDZcbiAgICAgIGNvbnN0IGsgPSBgYmF0c3RhcnRzdW0ke3N9ZDZgO1xuICAgICAgaWYgKHN1bW1vbmVyW2tdKSBhZGRSb3coTU9OX1NVTU1PTi5CQVRUTEVfU1RBUlQsIHN8MTI4LCBzdW1tb25lci5pZCwgc3VtbW9uZXJba10pO1xuICAgIH1cbiAgICBpZiAoc3VtbW9uZXIuYmF0c3RhcnRzdW0xZDMpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5CQVRUTEVfU1RBUlQsIDY0LCBzdW1tb25lci5pZCwgc3VtbW9uZXIuYmF0c3RhcnRzdW0xZDMpXG5cbiAgICBpZiAoc3VtbW9uZXIubW91bnRtbnIpIHtcbiAgICAgIC8vIFRPRE8gLSBzbWFydCBtb3VudHMgbWlnaHQgYmUgY29tbWFuZGVycz8gaWRyXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5NT1VOVCwgMSwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLm1vdW50bW5yKTtcbiAgICB9XG4gIH1cblxuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIHRydWUsXG4gICk7XG59XG5cbi8vIFRPRE8gLSBub3Qgc3VyZSB5ZXQgaWYgSSB3YW50IHRvIGR1cGxpY2F0ZSBjYXAtb25seSBzaXRlcyBoZXJlP1xuZnVuY3Rpb24gbWFrZVVuaXRCeU5hdGlvbiAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IG5hdGlvbklkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIgfSxcbiAgICBqb2luczogJ05hdGlvbltuYXRpb25JZF09VW5pdHMrVW5pdFt1bml0SWRdPVNvdXJjZScsXG4gICAgZmllbGRzOiBbJ25hdGlvbklkJywgJ3VuaXRJZCcsICdyZWNUeXBlJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnbmF0aW9uSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjVHlwZScsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG5cbiAgLy8gVE9ETyAtIHByZXRlbmRlcnNcbiAgLy8gZm9sbG93aW5nIHRoZSBsb2dpYyBpbiAuLi8uLi8uLi8uLi9zY3JpcHRzL0RNSS9NTmF0aW9uLmpzXG4gIC8vICAgMS4gZGV0ZXJtaW5lIG5hdGlvbiByZWFsbShzKSBhbmQgdXNlIHRoYXQgdG8gYWRkIHByZXRlbmRlcnNcbiAgLy8gICAyLiB1c2UgdGhlIGxpc3Qgb2YgXCJleHRyYVwiIGFkZGVkIHByZXRlbmRlcnMgdG8gYWRkIGFueSBleHRyYVxuICAvLyAgIDMuIHVzZSB0aGUgdW5wcmV0ZW5kZXJzIHRhYmxlIHRvIGRvIG9wcG9zaXRlXG5cbiAgLy8gdGhlcmUncyBhIGxvdCBnb2luIG9uIGhlcmVcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBtYWtlUmVjcnVpdG1lbnRGcm9tQXR0cnModGFibGVzLCByb3dzKTtcbiAgY29tYmluZVJlY3J1aXRtZW50VGFibGVzKHRhYmxlcywgcm93cyk7XG4gIG1ha2VQcmV0ZW5kZXJCeU5hdGlvbih0YWJsZXMsIHJvd3MpXG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlY3J1aXRtZW50RnJvbUF0dHJzICh0YWJsZXM6IFRSLCByb3dzOiBhbnlbXSkge1xuICBjb25zdCB7IEF0dHJpYnV0ZUJ5TmF0aW9uLCBVbml0IH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbEFCTlJvd3M6IG51bWJlcltdID0gW107XG4gIGZvciAoY29uc3QgW2lBQk4gLHJdICBvZiBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHsgcmF3X3ZhbHVlLCBhdHRyaWJ1dGUsIG5hdGlvbl9udW1iZXIgfSA9IHI7XG4gICAgbGV0IHVuaXQ6IGFueTtcbiAgICBsZXQgdW5pdElkOiBhbnkgPSBudWxsIC8vIHNtZmhcbiAgICBsZXQgdW5pdFR5cGUgPSAwO1xuICAgIGxldCByZWNUeXBlID0gMDtcbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSAxNTg6XG4gICAgICBjYXNlIDE1OTpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTYwOlxuICAgICAgY2FzZSAxNjE6XG4gICAgICBjYXNlIDE2MjpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQubGFuZHNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DT0FTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE2MzpcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg2OlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC53YXRlcnNoYXBlIHx8IHVuaXQuaWQ7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVRFUjtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTg3OlxuICAgICAgY2FzZSAxODk6XG4gICAgICBjYXNlIDE5MDpcbiAgICAgIGNhc2UgMTkxOlxuICAgICAgY2FzZSAyMTM6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LndhdGVyc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBVEVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk0OlxuICAgICAgY2FzZSA0MTI6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkZPUkVTVDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NTpcbiAgICAgIGNhc2UgNDEzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5GT1JFU1Q7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuU1dBTVA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlNXQU1QO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTg6XG4gICAgICBjYXNlIDQwODpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTk6XG4gICAgICBjYXNlIDQwOTpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuTU9VTlRBSU47XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMDpcbiAgICAgIGNhc2UgNDE2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDMwMTpcbiAgICAgIGNhc2UgNDE3OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5XQVNURTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAyOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAzOlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5DQVZFO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDQ6XG4gICAgICBjYXNlIDQwNjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuUExBSU5TO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDA1OlxuICAgICAgY2FzZSA0MDc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLlBMQUlOUztcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTM5OlxuICAgICAgY2FzZSAxNDA6XG4gICAgICBjYXNlIDE0MTpcbiAgICAgIGNhc2UgMTQyOlxuICAgICAgY2FzZSAxNDM6XG4gICAgICBjYXNlIDE0NDpcbiAgICAgICAgLy9jb25zb2xlLmxvZygnSEVSTyBGSU5ERVIgRk9VTkQnLCByYXdfdmFsdWUpXG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5IRVJPO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTQ1OlxuICAgICAgY2FzZSAxNDY6XG4gICAgICBjYXNlIDE0OTpcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXVsdGkgaGVybyEnLCByYXdfdmFsdWUpXG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSIHwgVU5JVF9UWVBFLkhFUk87XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NVUxUSUhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICh1bml0SWQgPT0gbnVsbCkgY29udGludWU7XG4gICAgZGVsQUJOUm93cy5wdXNoKGlBQk4pO1xuICAgIHVuaXQgPz89IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICh1bml0VHlwZSkgdW5pdC50eXBlIHw9IHVuaXRUeXBlO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignbW9yZSBwaXNzIHVuaXQ6JywgaUFCTiwgdW5pdElkKTtcbiAgICByb3dzLnB1c2goe1xuICAgICAgdW5pdElkLFxuICAgICAgcmVjVHlwZSxcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgbmF0aW9uSWQ6IG5hdGlvbl9udW1iZXIsXG4gICAgfSk7XG4gIH1cblxuICBsZXQgZGk6IG51bWJlcnx1bmRlZmluZWQ7XG4gIHdoaWxlICgoZGkgPSBkZWxBQk5Sb3dzLnBvcCgpKSAhPT0gdW5kZWZpbmVkKVxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVSZWNydWl0bWVudFRhYmxlcyAodGFibGVzOiBUUiwgcm93czogYW55W10pIHtcbiAgY29uc3Qge1xuICAgIFVuaXQsXG4gICAgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIEZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgICBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbixcbiAgfSA9IHRhYmxlcztcbiAgZm9yIChjb25zdCByIG9mIEZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUlQsXG4gICAgfSlcbiAgfVxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkNPQVNULFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cblxuICBmb3IgKGNvbnN0IHIgb2YgTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5GT1JFSUdOLFxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVByZXRlbmRlckJ5TmF0aW9uICh0YWJsZXM6IFRSLCByb3dzOiBhbnlbXSkge1xuICBjb25zdCB7XG4gICAgUHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIFVucHJldGVuZGVyVHlwZUJ5TmF0aW9uLFxuICAgIE5hdGlvbixcbiAgICBVbml0LFxuICAgIFJlYWxtLFxuICAgIEF0dHJpYnV0ZUJ5TmF0aW9uLFxuICB9ID0gdGFibGVzO1xuXG4gIC8vIFRPRE8gLSBkZWxldGUgbWF0Y2hpbmcgcm93cyBmcm9tIHRoZSB0YWJsZVxuICBjb25zdCBjaGVhcEF0dHJzID0gQXR0cmlidXRlQnlOYXRpb24ucm93cy5maWx0ZXIoXG4gICAgKHsgYXR0cmlidXRlOiBhIH0pID0+IGEgPT09IDMxNCB8fCBhID09PSAzMTVcbiAgKTtcbiAgY29uc3QgY2hlYXAgPSBuZXcgTWFwPG51bWJlciwgTWFwPG51bWJlciwgMjB8NDA+PigpO1xuICBmb3IgKGNvbnN0IHsgbmF0aW9uX251bWJlciwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSBvZiBjaGVhcEF0dHJzKSB7XG4gICAgaWYgKCFjaGVhcC5oYXMocmF3X3ZhbHVlKSkgY2hlYXAuc2V0KHJhd192YWx1ZSwgbmV3IE1hcCgpKTtcbiAgICBjb25zdCBjVW5pdCA9IGNoZWFwLmdldChyYXdfdmFsdWUpITtcbiAgICBjVW5pdC5zZXQobmF0aW9uX251bWJlciwgYXR0cmlidXRlID09PSAzMTQgPyAyMCA6IDQwKTtcbiAgfVxuXG4gIC8vIG1ha2UgYSBtYXAgZmlyc3QsIHdlIHdpbGwgY29udmVydCB0byByb3dzIGF0IHRoZSBlbmRcbiAgY29uc3QgcHJldGVuZGVycyA9IG5ldyBNYXAoTmF0aW9uLnJvd3MubWFwKHIgPT4gW3IuaWQsIG5ldyBTZXQ8bnVtYmVyPigpXSkpO1xuICAvLyBtb25zdGVycyBmb3IgZWFjaCByZWFsbVxuICBjb25zdCByMm0gPSBuZXcgTWFwPG51bWJlciwgU2V0PG51bWJlcj4+KCk7XG4gIGZvciAobGV0IGkgPSAxOyBpIDw9IDEwOyBpKyspIHIybS5zZXQoaSwgbmV3IFNldCgpKTtcbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCByZWFsbSB9IG9mIFJlYWxtLnJvd3MpXG4gICAgcjJtLmdldChyZWFsbSkhLmFkZChtb25zdGVyX251bWJlcik7XG5cbiAgLy8gZmlyc3QgZG8gcmVhbG0tYmFzZWQgcHJldGVuZGVyc1xuICBmb3IgKGNvbnN0IHsgcmVhbG0sIGlkIH0gb2YgTmF0aW9uLnJvd3MpIHtcbiAgICBpZiAoIXJlYWxtKSBjb250aW51ZTtcbiAgICBmb3IgKGNvbnN0IG1uciBvZiByMm0uZ2V0KHJlYWxtKSEpIHtcbiAgICAgIHByZXRlbmRlcnMuZ2V0KGlkKSEuYWRkKG1ucik7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhlbiBhZGQgcHJldGVuZGVycyBieSBuYXRpb25cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCBuYXRpb25fbnVtYmVyIH0gb2YgUHJldGVuZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBwcmV0ZW5kZXJzLmdldChuYXRpb25fbnVtYmVyKSEuYWRkKG1vbnN0ZXJfbnVtYmVyKTtcbiAgfVxuICAvLyB0aGVuIHVucHJldGVuZGVycyBieSBuYXRpb25cbiAgZm9yIChjb25zdCB7IG1vbnN0ZXJfbnVtYmVyLCBuYXRpb25fbnVtYmVyIH0gb2YgVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIHByZXRlbmRlcnMuZ2V0KG5hdGlvbl9udW1iZXIpIS5kZWxldGUobW9uc3Rlcl9udW1iZXIpO1xuICB9XG5cbiAgY29uc3QgYWRkZWRVbml0cyA9IG5ldyBNYXA8bnVtYmVyLCBhbnk+KCk7XG5cbiAgZm9yIChjb25zdCBbbmF0aW9uSWQsIHVuaXRJZHNdIG9mIHByZXRlbmRlcnMpIHtcbiAgICBmb3IgKGNvbnN0IHVuaXRJZCBvZiB1bml0SWRzKSB7XG4gICAgICBpZiAoIWFkZGVkVW5pdHMuaGFzKHVuaXRJZCkpIGFkZGVkVW5pdHMuc2V0KHVuaXRJZCwgVW5pdC5tYXAuZ2V0KHVuaXRJZCkpO1xuICAgICAgY29uc3QgZGlzY291bnQgPSBjaGVhcC5nZXQodW5pdElkKT8uZ2V0KG5hdGlvbklkKSA/PyAwO1xuICAgICAgY29uc3QgcmVjVHlwZSA9IGRpc2NvdW50ID09PSA0MCA/IFJFQ19UWVBFLlBSRVRFTkRFUl9DSEVBUF80MCA6XG4gICAgICAgIGRpc2NvdW50ID09PSAyMCA/IFJFQ19UWVBFLlBSRVRFTkRFUl9DSEVBUF8yMCA6XG4gICAgICAgIFJFQ19UWVBFLlBSRVRFTkRFUjtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIHVuaXRJZCxcbiAgICAgICAgbmF0aW9uSWQsXG4gICAgICAgIHJlY1R5cGUsXG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBbaWQsIHVdIG9mIGFkZGVkVW5pdHMpIHtcbiAgICBpZiAoIXUpIHsgY29uc29sZS53YXJuKCdmYWtlIHVuaXQgaWQ/JywgaWQpOyBjb250aW51ZSB9XG4gICAgaWYgKCF1LnN0YXJ0ZG9tIHx8ICEodS50eXBlICYgVU5JVF9UWVBFLlBSRVRFTkRFUikpIHtcbiAgICAgIGNvbnNvbGUud2Fybignbm90IGEgcHJldGVuZGVyPycsIHUubmFtZSwgdS50eXBlLCB1LnN0YXJ0ZG9tKTtcbiAgICB9XG4gICAgdS50eXBlIHw9IFVOSVRfVFlQRS5QUkVURU5ERVI7XG4gIH1cbn1cblxuY29uc3QgZW51bSBNSVNDX1VOSVRfU1JDIHtcbiAgTUlTQ19NSVNDID0gMCwgLy8gVkVSWSBtaXNjLiBsaWtlIHRyZWVzIGFuZCBzaGl0XG4gIFJFQU5JTSA9IDEsXG4gIElORElFID0gMixcbn1cbi8vIFRPRE86XG4vLyBsb25nZGVhZC9zb3VsbGVzcy9yZWFuaW1hdGVkL2V0YyAoaW5jbC4gbW9udGFncz8pXG4vLyBUUkVFUyAodW5hbmltYXRlZC4uLilcbi8vIGxvb2sgZm9yIHdhdGVyL2xhbmQvZm9yZXN0L3BsYWluIHNoYXBlcywgYWRkIHRvIHRoZSByZWxldmFudCBhcmVhXG4vLyBJTkRJRVNcbi8vIGV2ZW50cz9cbmZ1bmN0aW9uIG1ha2VNaXNjVW5pdCh0YWJsZXM6IFRSKSB7XG4gIGNvbnN0IHtcbiAgICBVbml0LFxuICAgIFVuaXRCeU5hdGlvbixcbiAgICBVbml0QnlTcGVsbCxcbiAgICBVbml0QnlTdW1tb25lcixcbiAgICBVbml0QnlTaXRlLFxuICB9ID0gdGFibGVzO1xuICBjb25zdCBzb3VyY2VzID0gbmV3IE1hcDxudW1iZXIsIHsgdW5pdDogYW55LCBzcmM6IGFueVtdIH0+KFxuICAgIFVuaXQucm93cy5tYXAodW5pdCA9PiBbdW5pdC5pZCwgeyB1bml0LCBzcmM6IFtdIH1dKVxuICApO1xuXG4gIGZvciAoY29uc3QgciBvZiBVbml0QnlOYXRpb24ucm93cykgc291cmNlcy5nZXQoci51bml0SWQpIS5zcmMucHVzaChyKTtcbiAgZm9yIChjb25zdCByIG9mIFVuaXRCeVNwZWxsLnJvd3MpIHNvdXJjZXMuZ2V0KHIudW5pdElkKSEuc3JjLnB1c2gocik7XG4gIGZvciAoY29uc3QgciBvZiBVbml0QnlTdW1tb25lci5yb3dzKSBzb3VyY2VzLmdldChyLnVuaXRJZCkhLnNyYy5wdXNoKHIpO1xuICBmb3IgKGNvbnN0IHIgb2YgVW5pdEJ5U2l0ZS5yb3dzKSBzb3VyY2VzLmdldChyLnVuaXRJZCkhLnNyYy5wdXNoKHIpO1xuXG4gIGZvciAoY29uc3QgeyB1bml0LCBzcmMgfSBvZiBzb3VyY2VzLnZhbHVlcygpKSB7XG4gICAgaWYgKHNyYy5sZW5ndGgpIGNvbnRpbnVlO1xuICAgIGNvbnNvbGUubG9nKGBVbml0IyR7dW5pdC5pZH0gOiAke3VuaXQubmFtZX0gaGFzIG5vIHNvdXJjZXNgKTtcbiAgfVxufVxuXG5leHBvcnQgZW51bSBTUEVMTF9TVU1NT04ge1xuICBCQVNJQyA9IDAsIC8vIG5vdCBzZXQsIHBlcmhhcHNcbiAgVEVNUE9SQVJZID0gMSxcbiAgVU5JUVVFID0gMixcbiAgQ09NTUFOREVSID0gNCxcbiAgTkVVVFJBTCA9IDgsIC8vIGkuZS4gbm90IG9uIHlvdXIgc2lkZVxuICBFREdFID0gMTYsXG4gIFJFTU9URSA9IDE2LFxuICBDT01CQVQgPSAzMixcbiAgU1BFQ0lBTF9IT0cgPSA2NCwgLy8gbWFlcnZlcm5pIGlyb24gYm9hcnMgOklcbiAgUElDS19PTkUgPSAxMjgsXG4gIEFTU0FTU0lOID0gMjU2LFxuICBTVEVBTFRIWSA9IDUxMixcbiAgQUxJVkVfT05MWSA9IDEwMjQsXG59XG5cbmZ1bmN0aW9uIG1ha2VVbml0QnlTcGVsbCAodGFibGVzOiBUUikge1xuICBjb25zdCB7IFVuaXQsIFNwZWxsIH0gPSB0YWJsZXM7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVNwZWxsJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1NwZWxsW3NwZWxsSWRdPVN1bW1vbnMrVW5pdFt1bml0SWRdPVNvdXJjZScsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgZmllbGRzOiBbXG4gICAgICAndW5pdElkJywgJ3NwZWxsSWQnLCAnc3VtbW9uVHlwZScsICdzdW1tb25TdHJlbmd0aCcsXG4gICAgXSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIHNwZWxsSWQ6IDEsXG4gICAgICBzdW1tb25UeXBlOiAyLFxuICAgICAgc3VtbW9uU3RyZW5ndGg6IDMsXG4gICAgfSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLkkzMixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uSTMyLFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25UeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vblN0cmVuZ3RoJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICAgIC8qXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzcGVjaWFsQ29uZGl0aW9uJyxcbiAgICAgICAgaW5kZXg6IDQsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgKi9cbiAgICBdXG4gIH0pO1xuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG5cbiAgZnVuY3Rpb24gYWRkUm93IChcbiAgICB1bml0SWQ6IG51bWJlcixcbiAgICBzcGVsbElkOiBudW1iZXIsXG4gICAgc3VtbW9uVHlwZTogbnVtYmVyLFxuICAgIHN1bW1vblN0cmVuZ3RoOiBudW1iZXIsXG4gICkge1xuICAgIHJvd3MucHVzaCh7XG4gICAgICB1bml0SWQsXG4gICAgICBzcGVsbElkLFxuICAgICAgc3VtbW9uVHlwZSxcbiAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHNwZWxsIG9mIFNwZWxsLnJvd3MpIHtcbiAgICBsZXQgc3VtbW9uczogbnVtYmVyIHwgbnVtYmVyW10gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgc3VtbW9uVHlwZSA9IFNQRUxMX1NVTU1PTi5CQVNJQztcbiAgICBsZXQgc3VtbW9uU3RyZW5ndGggPSBzcGVsbC5lZmZlY3RzX2NvdW50O1xuICAgIGlmIChTUEVDSUFMX1NVTU1PTltzcGVsbC5pZF0pIHtcbiAgICAgIHN1bW1vbnMgPSBTUEVDSUFMX1NVTU1PTltzcGVsbC5pZF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VtbW9ucykpIHRocm93IG5ldyBFcnJvcigndSBnbyB0byBoZWxsIG5vdycpO1xuICAgICAgc3dpdGNoIChzcGVsbC5pZCkge1xuICAgICAgICAvLyBpcm9uIGhvZ2dzXG4gICAgICAgIGNhc2UgODU5OlxuICAgICAgICAgIGFkZFJvdyhzdW1tb25zWzBdLCA4NTksIFNQRUxMX1NVTU1PTi5CQVNJQywgc3VtbW9uU3RyZW5ndGgpO1xuICAgICAgICAgIGFkZFJvdyhzdW1tb25zWzFdLCA4NTksIFNQRUxMX1NVTU1PTi5TUEVDSUFMX0hPRywgIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gdW5sZWFzaCBpbXByaXNvbmVkIG9uZXNcbiAgICAgICAgY2FzZSA2MDc6XG4gICAgICAgICAgZm9yIChjb25zdCB1aWQgb2Ygc3VtbW9ucylcbiAgICAgICAgICAgIGFkZFJvdyhcbiAgICAgICAgICAgICAgdWlkLFxuICAgICAgICAgICAgICA2MDcsXG4gICAgICAgICAgICAgIFNQRUxMX1NVTU1PTi5DT01NQU5ERVIsXG4gICAgICAgICAgICAgIHN1bW1vblN0cmVuZ3RoXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyB0YXJ0c1xuICAgICAgICBjYXNlIDEwODA6XG4gICAgICAgICAgZm9yIChjb25zdCB1aWQgb2Ygc3VtbW9ucylcbiAgICAgICAgICAgIGFkZFJvdyhcbiAgICAgICAgICAgICAgdWlkLFxuICAgICAgICAgICAgICAxMDgwLFxuICAgICAgICAgICAgICBTUEVMTF9TVU1NT04uUElDS19PTkV8U1BFTExfU1VNTU9OLkNPTU1BTkRFUixcbiAgICAgICAgICAgICAgc3VtbW9uU3RyZW5ndGhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIGFuZ2VsaWMgaG9zdC9ob3JkZSBmcm9tIGhlbGxcbiAgICAgICAgY2FzZSA0ODA6XG4gICAgICAgIGNhc2UgMTQxMDpcbiAgICAgICAgICBhZGRSb3coc3VtbW9uc1swXSwgc3BlbGwuaWQsIFNQRUxMX1NVTU1PTi5SRU1PVEV8U1BFTExfU1VNTU9OLkNPTU1BTkRFUiwgMSk7XG4gICAgICAgICAgYWRkUm93KHN1bW1vbnNbMV0sIHNwZWxsLmlkLCBTUEVMTF9TVU1NT04uUkVNT1RFLCAgc3VtbW9uU3RyZW5ndGgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBnaG9zdCBhcm1hZGFcbiAgICAgICAgY2FzZSAxMjE5OlxuICAgICAgICAgIGZvciAoY29uc3QgdWlkIG9mIHN1bW1vbnMpXG4gICAgICAgICAgICBhZGRSb3coXG4gICAgICAgICAgICAgIHVpZCxcbiAgICAgICAgICAgICAgMTIxOSxcbiAgICAgICAgICAgICAgU1BFTExfU1VNTU9OLkJBU0lDLFxuICAgICAgICAgICAgICAxLCAvLyBUT0RPIC0gcHJvYmFibHkgbmVlZCB0byBsb29rIHRoZXNlIHVwP1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuaGFuZGxlZCBzcGVjaWFsIHN1bW1vbiBmb3Igc3BlbGwgaWQgJHtzcGVsbC5pZH0/YCk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHNwZWxsLmVmZmVjdF9udW1iZXIpIHtcbiAgICAgIGNhc2UgMTogLy8gYmFzaWMgc3VtbW9uIG1vbnN0ZXJcbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDIxOiAvLyBiYXNpYyBzdW1tb24gY29tbWFuZGVyXG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTU1BTkRFUjtcbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM3OiAvLyByZW1vdGUgc3VtbW9uXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLlJFTU9URVxuICAgICAgY2FzZSAzODogLy8gcmVtb3RlIHN1bW1vbiB0ZW1wb3JhcnlcbiAgICAgICAgc3VtbW9uVHlwZSB8PVNQRUxMX1NVTU1PTi5URU1QT1JBUlk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQzOiAvLyBiYXR0bGUgZWRnZVxuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5DT01CQVR8U1BFTExfU1VNTU9OLkVER0VcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNTA6IC8vIHJlbW90ZSBzdW1tb24gYXNzYXNzaW5cbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uQVNTQVNTSU58U1BFTExfU1VNTU9OLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNjg6IC8vIGFuaW1hbHMgVE9ETyAtIHNob3VsZCBwcm9iYWJseSBiZSB1bmRlciBzcGVjaWFsLCBpZGsgd2hhdCBhbmltYWxzXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyBub3Qgc3VyZSBob3cgdGhlc2UgdHdvIGRpZmZlciFcbiAgICAgIGNhc2UgODk6IC8vIChyZSlzdW1tb24gdW5pcXVlXG4gICAgICAgIGxldCBpZHggPSBOdW1iZXIoc3BlbGwucmF3X3ZhbHVlKSB8fCBOdW1iZXIoc3BlbGwuZGFtYWdlKTtcbiAgICAgICAgaWYgKGlkeCA8IDApIGlkeCAqPSAtMVxuICAgICAgICBzdW1tb25zID0gVU5JUVVFX1NVTU1PTltpZHhdO1xuICAgICAgICBpZiAoIXN1bW1vbnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBzdGlsbCBmdWNrZWQgdXAgdW5pcXVlIHN1bW1vbiBzaGl0IEAgJHtpZHh9YCwgc3BlbGwpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGlzcyBjaXR5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uQ09NTUFOREVSfFNQRUxMX1NVTU1PTi5VTklRVUU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5MzogLy8gKHJlKXN1bW1vbiB1bmlxdWVcbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uQ09NTUFOREVSfFNQRUxMX1NVTU1PTi5VTklRVUU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDExOTogLy8gcmVtb3RlIHN0ZWFsdGh5XG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTU1BTkRFUnxTUEVMTF9TVU1NT04uU1RFQUxUSFk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDEyNjogLy8gbmV0cnVhbCBiYXR0bGVmaWVsZFxuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5DT01CQVR8U1BFTExfU1VNTU9OLk5FVVRSQUw7XG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDEzNzogLy8gc3VtbW9uIChMYWRvbikgaWYgYWxpdmVcbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uVU5JUVVFfFNQRUxMX1NVTU1PTi5DT01NQU5ERVJ8U1BFTExfU1VNTU9OLkFMSVZFX09OTFk7XG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE0MTogLy8gRkFOQ1kgQklSRFxuICAgICAgICBzdW1tb25TdHJlbmd0aCA9IDI7IC8vIG5vdCByZWFsbHkgYnV0Li4uIGl0cyBmb3IgZGlzcGxheVxuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjY6IC8vIFRSRUVTXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyBUT0RPIHJldmlzaXQgdGhlc2VcbiAgICAgIGNhc2UgMTMwOiAvLyAoQSBLSU5EIE9GIFBvbHltb3JwaClcbiAgICAgIGNhc2UgNTQ6ICAvLyAoTk9URTogcG9seW1vcnBoIHRvIGFyZyEpXG4gICAgICBjYXNlIDEyNzogLy8gaW5mZXJuYWwgYnJlZWRpbmcgKENSRUFURVMgREVPTU9OIEdVWVM/Pz8pXG4gICAgICBjYXNlIDM1OiAgLy8gY3Jvc3MtYnJlZWRpbmcgKENSRUFURVMgRk9VTCBHVVlTKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGhpcyBhcHBhcmVudGx5IGFpbnQgYSBzdW1tb25pbmcgc3BlbGw/P1xuICAgIGlmICghc3VtbW9ucykge1xuICAgICAgc3VtbW9ucyA9IHNwZWxsLmRhbWFnZTtcbiAgICAgIGlmICghc3VtbW9ucykge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICc/Pz8/ICcgKyBzcGVsbC5pZCArICcsICcgKyBzcGVsbC5lZmZlY3RfbnVtYmVyICsgJy0+JyArIHN1bW1vbnNcbiAgICAgICAgKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzcGVsbC5yaXR1YWwpIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTUJBVDtcbiAgICAvLyBzbWhcbiAgICBpZiAodHlwZW9mIHN1bW1vbnMgPT09ICdiaWdpbnQnKSBzdW1tb25zID0gTnVtYmVyKHN1bW1vbnMpO1xuICAgIGlmICh0eXBlb2Ygc3VtbW9ucyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChzdW1tb25zIDwgMCkge1xuICAgICAgICBpZiAoIU1PTlRBR1Nbc3VtbW9ucyBhcyBudW1iZXJdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtaXNzZWQgbW9udGFnICR7c3VtbW9uc31gKVxuICAgICAgICB9XG4gICAgICAgIHN1bW1vbnMgPSBNT05UQUdTW3N1bW1vbnMgYXMgbnVtYmVyXVxuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5QSUNLX09ORTsgLy8gbWF5YmUgbm90IHF1aXRlIGFjY3VyYXRlP1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VtbW9ucyA9IFtzdW1tb25zXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VtbW9ucykpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXVEYgSVMgVEhJUycsIHN1bW1vbnMpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lPVSBGVUNLRUQgVVAnKTtcbiAgICB9XG4gICAgaWYgKCFzdW1tb25zLmxlbmd0aCkge1xuICAgICAgLypcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBtaXNzaW5nIHN1bW1vbnMgZm9yICR7c3BlbGwuaWR9OiR7c3BlbGwubmFtZX1gLFxuICAgICAgICB7XG4gICAgICAgICAgZWZmZWN0OiBzcGVsbC5lZmZlY3RfbnVtYmVyLFxuICAgICAgICAgIGRhbWFnZTogc3BlbGwuZGFtYWdlLFxuICAgICAgICAgIHN1bW1vbnMsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICAqL1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB1aWQgb2Ygc3VtbW9ucykge1xuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1aWQpXG4gICAgICBpZiAoIXVuaXQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgJHtzcGVsbC5pZH06JHtzcGVsbC5uYW1lfSBzdW1tb25zIHVua25vd24gY3JlYXR1cmUgJHt1aWR9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYWRkUm93KHVpZCwgc3BlbGwuaWQsIHN1bW1vblR5cGUsIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgIC8vIHdlIG1heSBkaXNjb3ZlciBjb21tYW5kZXIgc3RhdHVzIGhlcmU6XG4gICAgICBpZiAoKFNQRUxMX1NVTU1PTi5DT01NQU5ERVIgJiBzdW1tb25UeXBlKSAmJiAhKHVuaXQudHlwZSAmIFVOSVRfVFlQRS5DT01NQU5ERVIpKSB7XG4gICAgICAgIC8qXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYCAqKioqKiAke1xuICAgICAgICAgIHNwZWxsLmlkfToke3NwZWxsLm5hbWVcbiAgICAgICAgfSBpbmRpY2F0ZXMgdGhhdCAke1xuICAgICAgICAgIHVpZH06JHt1bml0LmlkXG4gICAgICAgIH0gaXMgYSBjb21tYW5kZXIgKHByZXY9JHtcbiAgICAgICAgICB1bml0LnR5cGVcbiAgICAgICAgfSlgKTtcbiAgICAgICAgKi9cbiAgICAgICAgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZSxcbiAgKTtcbn1cblxuXG5cbi8vIEkgZG9uJ3QgdGhpbmsgdGhlc2UgYXJlIGRlZmluZWQgZGlyZWN0bHkgaW4gdGhlIGRhdGEgKGp1c3QgYSBuYW1lKSwgYnV0IHdlXG4vLyBjb3VsZCBtYWludGFpbiBhIHRhYmxlICsgam9pblxuY29uc3QgTU9OVEFHUyA9IHtcbiAgLy8gZmF5IGZvbGtcbiAgWy0yNl06IFtdLFxuICAvLyBkd2FyZnNcbiAgWy0yMV06IFszNDI1LCAzNDI2LCAzNDI3LCAzNDI4XSxcbiAgLy9SYW5kb20gQmlyZCAoRmFsY29uLCBCbGFjayBIYXdrLCBTd2FuIG9yIFN0cmFuZ2UgQmlyZClcbiAgWy0yMF06IFszMzcxLCA1MTcsIDI5MjksIDMzMjddLFxuICAvLyBMaW9uc1xuICBbLTE5XTogWzMzNjMsIDMzNjQsIDMzNjUsIDMzNjZdLFxuICAvLyBTb3VsIHRyYXAgc29tZXRoaW5nIG9yIG90aGVyP1xuICBbLTE4XTogW10sXG4gIC8vIFlhdGFzIGFuZCBQYWlyaWthc1xuICBbLTE3XTogWzI2MzIsIDI2MzMsIDI2MzQsIDI2MzZdLFxuICAvLyBDZWxlc3RpYWwgWWF6YWRcbiAgWy0xNl06IFsyNjIwLCAyNjIxLCAyNjIyLCAyNjIzLCAyNjI0LCAyNjI1XSxcblxuICAvLyBUT0RPIC0gbmVlZCB0byBmaWd1cmUgb3V0IHdoaWNoIG1vbnN0ZXJzIHRoZXNlIHJlYWxseSBhcmUgKGNyb3NzYnJlZW5kcylcbiAgWy0xMl06IFs1MzBdLCAvLyAzJSBnb29kP1xuICBbLTExXTogWzUzMF0sIC8vIGJhZFxuICBbLTEwXTogWzUzMF0sIC8vIGdvb2RcblxuICAvLyBSYW5kb20gQnVnXG4gIFstOV06IFtdLFxuICAvLyBEb29tIEhvcnJvclxuICBbLThdOiBbXSxcbiAgLy8gSG9ycm9yXG4gIFstN106IFtdLFxuICAvLyBMZXNzZXIgSG9ycm9yXG4gIFstNl06IFtdLFxuICAvLyBSYW5kb20gQW5pbWFsXG4gIFstNV06IFtdLFxuICAvLyBHaG91bFxuICBbLTRdOiBbXSxcbiAgLy8gU291bHRyYXAgR2hvc3RcbiAgWy0zXTogW10sXG4gIC8vIExvbmdkZWFkXG4gIFstMl06IFtdLFxuICAvLyBTb3VsbGVzc1xuICBbLTFdOiBbXSxcbn1cbi8vIGlkayB0YmgsIGp1c3Qgc3R1ZmYgd2l0aCB3ZWlyZCBjb25kaXRpb25zIG9yIHdoYXRldmVyXG5jb25zdCBTUEVDSUFMX1NVTU1PTiA9IHtcbiAgLy8gdGhlc2UgYXJlIG5vdCBtb250YWdzIHBlciBzZSwgaW0gc3VyZSB0aGVyZSBhcmUgcmVhc29ucyBmb3IgdGhpcy5cbiAgLy8gdGFydGFyaWFuIEdhdGUgLyBlZmZlY3QgNzZcbiAgWzEwODBdOiBbNzcxLCA3NzIsIDc3MywgNzc0LCA3NzUsIDc3NiwgNzc3XSxcbiAgLy8gZWEgYXJnYXJ0aGEgXCJ1bmxlYXNoZWQgaW1wcmlzb25lZCBvbmVzXCIgZWZmZWN0IDExNlxuICBbNjA3IF06IFsyNDk4LCAyNDk5LCAyNTAwXSxcbiAgLy8gYW5nZWxpYyBob3N0IHNwZWxsIDQ4MCAgd2VpcmQgZG91YmxlIHN1bW1vbiAoZWZmIDM3KVxuICBbNDgwIF06IFs0NjUsIDM4NzBdLFxuICAvLyBob3JkZXMgZnJvbSBoZWxsIHdlaXJkIGRvdWJsZSBzdW1tb24gKGVmZiAzNylcbiAgWzE0MTBdOiBbMzA0LCAzMDNdLFxuICAvLyBpcm9uIHBpZyArIGlyb24gYm9hciBmb3IgZWEgbWFydmVybmkuLi5cbiAgWzg1OSBdOiBbOTI0LCAxODA4XSxcbiAgLy8gZ2hvc3Qgc2hpcCBhcm1hZGEgZ2xvYmFsIHNwZWxsIDEyMTkgZWZmZWN0IDgxIChnbG9iYWwpIGFuZCBkYW1hZ2UgPT09IDQzXG4gIFsxMjE5XTogWzMzNDgsIDMzNDksIDMzNTAsIDMzNTEsIDMzNTJdLFxufTtcblxuLy8gZnJvbSBlZmZlY3QgODksIGtleSBpcyBkYW1hZ2UvcmF3X2FyZ3VtZW50XG5jb25zdCBVTklRVUVfU1VNTU9OID0ge1xuICAvLyBCaW5kIEljZSBEZXZpbFxuICAxOiAgWzMwNiwgODIxLCAgODIyLCA4MjMsIDgyNCwgODI1XSxcbiAgLy8gQmluZCBBcmNoIERldmlsXG4gIDI6ICBbMzA1LCA4MjYsIDgyNywgODI4LCA4MjldLFxuICAvLyBCaW5kIEhlbGlvcGhhZ3VzXG4gIDM6ICBbNDkyLCA4MTgsIDgxOSwgODIwXSxcbiAgLy8gS2luZyBvZiBFbGVtZW50YWwgRWFydGhcbiAgNDogIFs5MDYsIDQ2OV0sXG4gIC8vIEZhdGhlciBJbGxlYXJ0aFxuICA1OiAgWzQ3MF0sXG4gIC8vIFF1ZWVuIG9mIEVsZW1lbnRhbCBXYXRlclxuICA2OiAgWzM1OSwgOTA3LCA5MDhdLFxuICAvLyBRdWVlbiBvZiBFbGVtZW50YWwgQWlyXG4gIDc6ICBbNTYzLCA5MTEsIDkxMl0sXG4gIC8vIEtpbmcgb2YgRWxlbWVudGFsIEZpcmVcbiAgODogIFs2MzEsIDkxMF0sXG4gIC8vIEtpbmcgb2YgQmFuZWZpcmVzXG4gIDk6ICBbOTA5XSxcbiAgLy8gQmluZCBEZW1vbiBMb3JkXG4gIDEwOiBbNDQ2LCA4MTAsIDkwMCwgMTQwNSwgMjI3NywgMjI3OF0sXG4gIC8vIEF3YWtlbiBUcmVlbG9yZFxuICAxMTogWzYyMSwgOTgwLCA5ODFdLFxuICAvLyBDYWxsIEFtZXNoYSBTcGVudGFcbiAgMTI6IFsxMzc1LCAxMzc2LCAxMzc3LCAxNDkyLCAxNDkzLCAxNDk0XSxcbiAgLy8gU3VtbW9uIFRsYWxvcXVlXG4gIDEzOiBbMTQ4NCwgMTQ4NSwgMTQ4NiwgMTQ4N10sXG4gIC8vIFJlbGVhc2UgTG9yZCBvZiBDaXZpbGl6YXRpb25cbiAgMTQ6IFsyMDYzLCAyMDY1LCAyMDY2LCAyMDY3LCAyMDY0LCAyMDYyXSxcbiAgLy8gPz8/P1xuICAxNTogWyBdLFxuICAvLyBncmVhdGVyIGRhZXZhXG4gIDE2OiBbMjYxMiwgMjYxMywgMjYxNCwgMjYxNSwgMjYxNiwgMjYxN10sXG4gIC8vIEJhbGFtXG4gIDE3OiBbMjc2NSwgMjc2OCwgMjc3MSwgMjc3NF0sXG4gIC8vIENoYWFjXG4gIDE4OiBbMjc3OCwgMjc3OSwgMjc4MCwgMjc4MV0sXG4gIC8vU2FuZ3VpbmUgSGVyaXRhZ2VcbiAgMTk6IFsxMDE5LCAxMDM1LCAzMjQ0LCAzMjQ1LCAzMjUxLCAzMjUyLCAzMjUzLCAzMjU1XSxcbiAgLy8gTWFuZGVoYVxuICAyMDogWzE3NDgsIDM2MzUsIDM2MzZdLFxuICAvLyA0ZCBkd2FyZlxuICAyMTogWzM0MjUsIDM0MjYsIDM0MjcsIDM0MjhdLFxufTtcblxuLy8gZWZmZWN0IDEwMFxuY29uc3QgVEVSUkFJTl9TVU1NT04gPSB7XG4gIC8vIEhpZGRlbiBpbiBTbm93XG4gIDE6IFsxMjAxLCAxMjAwLCAxMjAyLCAxMjAzXSxcbiAgLy8gSGlkZGVuIGluIFNhbmRcbiAgMjogWzE5NzksIDE5NzgsIDE5ODAsIDE5ODFdLFxuICAvLyBIaWRkZW4gVW5kZXJuZWF0aFxuICAzOiBbMjUyMiwgMjUyMywgMjUyNCwgMjUyNV1cbn07XG4vKlxuXG5zcGVsbCBmaW5kZXI6XG5jb25zdCBzcCA9IF9fdC5TcGVsbFxuZnVuY3Rpb24gZmluZFNwKGUsIHJpdCwgc2VsID0gLTMpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgQXJyYXkuZnJvbShcbiAgICAgICAgICAgIHNwLmZpbHRlclJvd3MociA9PiByLmVmZmVjdF9udW1iZXIgPT09IGUgJiYgKFxuICAgICAgICAgICAgICAgIHJpdCA9PSBudWxsIHx8IChyaXQgJiYgci5yaXR1YWwpIHx8ICghcml0ICYmICFyLnJpdHVhbCkpXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgciA9PiBgLSAgJHtyLnJpdHVhbCA/ICdSJyA6ICdDJyB9ICR7ci5pZH0gJHtyLm5hbWV9IDogJHtyLnJhd19hcmd1bWVudH1gXG4gICAgICAgICkuc2xpY2Uoc2VsKS5qb2luKCdcXG4nKVxuICAgIClcbn1cblxuLy8vLy8gU1VNTU9OIEVGRkVDVFMgLy8vLy8vXG5ET05FIDE6IChTVU1NT04gTU9OU1RFUilcbi0gIFIgMTQ1MiBJbmZlcm5hbCBUZW1wZXN0IDogNjMyXG4tICBSIDE0NTMgRm9yY2VzIG9mIEljZSA6IDQ0OVxuLSAgUiAxNDU0IEluZmVybmFsIENydXNhZGUgOiA0ODlcbi0gIEMgMTE4NCBIb3JkZSBvZiBTa2VsZXRvbnMgOiAtMlxuLSAgQyAxMzg1IFN1bW1vbiBJbXBzIDogMzAzXG4tICBDIDE0MTcgU3VtbW9uIElsbGVhcnRoIDogMzc1NlxuXG5ET05FIDM4OiAoUkVNT1RFIFNVTU1PTiBVTklUIFRFTVApXG4tICBSIDEwNzggR2hvc3QgUmlkZXJzIDogMTg5XG4tICBSIDE0MTYgU2VuZCBMZXNzZXIgSG9ycm9yIDogLTZcbi0gIFIgMTQ1NSBTZW5kIEhvcnJvciA6IC03XG5cbkRPTkUgMjE6IChTVU1NT04gQ09NTUFOREVSKVxuLSAgUiAxMzg0IEJpbmQgU2hhZG93IEltcCA6IDIyODdcbi0gIFIgMTQxMiBCaW5kIFN1Y2N1YnVzIDogODExXG4tICBSIDE0NDQgQ3Vyc2Ugb2YgQmxvb2QgOiA0MDRcbi0gIEMgNTYgR3JvdyBMaWNoIDogOTYwXG4tICBDIDU4IFN1bW1vbiBRYXJpbiA6IDM0NzFcbi0gIEMgODAgT3BlbiBTb3VsIFRyYXAgOiAtMThcblxuRE9ORSAzNzogKFBFUk1BTkVOVCBSRU1PVEUgU1VNTU9OKVxuLSAgUiAxMjU3IEFybXkgb2YgdGhlIERlYWQgOiAtMlxuLSAgUiAxNDEwIEhvcmRlIGZyb20gSGVsbCA6IDMwM1xuLSAgUiAxNDI4IFBsYWd1ZSBvZiBMb2N1c3RzIDogMjc5NFxuXG5ET05FIDEzNzogKFNVTU1PTiwgQUxJVkUgT05MWSlcbi0gIFIgMjY2IENhbGwgTGFkb24gOiAzMTY3XG5cbkRPTkUgOTM6IChTVU1NT04gVU5JUVVFPylcbi0gIFIgMjcyIERhdWdodGVyIG9mIFR5cGhvbiA6IDE4MjJcbi0gIFIgMTA3MiBDYWxsIHRoZSBFYXRlciBvZiB0aGUgRGVhZCA6IDk5NFxuXG5ET05FIDUwOiAoU1VNTU9OIEFTU0FTU0lOKVxuLSAgUiA0NDkgU2VuZCBBYXR4ZSA6IDM2Mjlcbi0gIFIgMTA2NyBFYXJ0aCBBdHRhY2sgOiAzNzQxXG4tICBSIDE0MjIgSW5mZXJuYWwgRGlzZWFzZSA6IDE2NjJcblxuRE9ORSAxMTk6IChSRU1PVEUgU1VNTU9OIFNURUFMVEhZKVxuLSAgUiAzMjYgU2VuZCBWb2R5YW5veSA6IDE5NTNcblxuXG5ET05FIDg5OiAoVU5JUVVFIFNVTU1PTiEpXG4tICBSIDE0MzAgRmF0aGVyIElsbGVhcnRoIDogNVxuLSAgUiAxNDM4IEJpbmQgSGVsaW9waGFndXMgOiAzXG4tICBSIDE0NTAgQmluZCBEZW1vbiBMb3JkIDogMTBcblxuRE9ORSAxNDE6IFNVTU1PTiBGQU5DWSBCSVJEIE9OTFlcbi0gIFIgNTM3IENhbGwgdGhlIEJpcmRzIG9mIFNwbGVuZG9yIDogMzM4MlxuRE9ORSAxMTY6XG4tICBSIDYwNyBVbmxlYXNoIEltcHJpc29uZWQgT25lcyA6IDFcblxuRUZGRUNUIDE2NjpcblxuLSAgQyA3OTkgQW5pbWF0ZSBUcmVlIDogMzYxXG4tICBDIDkxOCBBd2FrZW4gRm9yZXN0IDogMzYxXG5cbkVGRkVDVCA2ODogKE5PVEU6IGFuaW1hbCBzdW1tb24hKVxuLSAgUiA5MjEgU3VtbW9uIEFuaW1hbHMgOiA0MDNcbi0gIFIgMTA1NSBBbmltYWwgSG9yZGUgOiA0MDNcblxuRUZGRUNUIDQzOiAoTk9URTogZWRnZSBiYXR0bGVmaWVsZCBzdW1tb24pXG5cbi0gIEMgOTcwIFNjaG9vbCBvZiBTaGFya3MgOiA4MTVcbi0gIEMgOTkxIFdpbGwgbycgdGhlIFdpc3AgOiA1Mjdcbi0gIEMgMTAxMCBDb3Jwc2UgQ2FuZGxlIDogNTI4XG5FRkZFQ1QgMTI2OiAoTk9URSBub24tY29udHJvbGxlZCBiYXR0bGVmaWVsZCBzdW1tb24pXG5cbi0gIEMgOTc3IFN1bW1vbiBMYW1tYXNodGFzIDogMzkzXG4tICBDIDE0MDcgQ2FsbCBMZXNzZXIgSG9ycm9yIDogLTZcbi0gIEMgMTQyNiBDYWxsIEhvcnJvciA6IC03XG5cblxuXG4vLyBub3QgcmVhbGx5IGEgc3VtbW9uIGJ1dCB3ZSB3aWxsIHdhbnQgdG8gdHJhY2sgdGhlc2U6XG5FRkZFQ1QgMTMwOiAoQSBLSU5EIE9GIFBvbHltb3JwaClcbi0gIFIgMjkwIEhhbm55YSBQYWN0IDogMzA3MFxuLSAgUiAyOTEgR3JlYXRlciBIYW5ueWEgUGFjdCA6IDE0MzJcblxuRUZGRUNUIDU0OiAoTk9URTogcG9seW1vcnBoIHRvIGFyZyEpXG5cbi0gIEMgODg3IEN1cnNlIG9mIHRoZSBGcm9nIFByaW5jZSA6IDIyMjJcbi0gIEMgOTA2IFBvbHltb3JwaCA6IDU0OVxuXG5FRkZFQ1QgMTI3OiAoQ1JFQVRFUyBERU9NT04gR1VZUz8/Pylcbi0gIFIgMzIwIEluZmVybmFsIEJyZWVkaW5nIDogMVxuRUZGRUNUIDM1OiAoQ1JFQVRFUyBGT1VMIEdVWVMpXG4tICBSIDE0MDAgQ3Jvc3MgQnJlZWRpbmcgOiAxXG4tICBSIDE0NDUgSW1wcm92ZWQgQ3Jvc3MgQnJlZWRpbmcgOiAxXG5cblxuXG5cbi8vLy8vIE9USEVSIEVGRkVDVFNcblxuXG5FRkZFQ1QgMDpcblxuLSAgQyA0ODQgLi4uIDogMFxuLSAgQyA2MzEgLi4uIDogMFxuLSAgQyA2MzIgLi4uIDogMFxuRUZGRUNUIDEwOTpcblxuLSAgQyAxIE1pbm9yIEFyZWEgU2hvY2sgOiAxXG4tICBDIDEyMCBNaW5vciBCbHVudCBEYW1hZ2UgOiA4XG4tICBDIDY2OSBQb2lzb24gRGFydHMgOiA5XG5FRkZFQ1QgMjpcblxuLSAgQyAxNDE5IEhhcm0gOiAxMDAwXG4tICBDIDE0MzcgTGlmZSBmb3IgYSBMaWZlIDogNTAyNVxuLSAgQyAxNDQ3IGZhcmtpbGw6IEluZmVybmFsIEZ1bWVzIDogMTAwNlxuRUZGRUNUIDM6XG5cbi0gIEMgODAwIFRvcnBvciA6IDUwMTBcbi0gIEMgMTAwOSBHaG9zdCBHcmlwIDogMjAyM1xuLSAgQyAxMjc1IFN0ZWFsIEJyZWF0aCA6IDUwMzVcbkVGRkVDVCA2MDA6XG5cbi0gIEMgNCBNYXJrIDogMjYxXG4tICBDIDEyNjUgSG9ycm9yIE1hcmsgOiAyNjFcbkVGRkVDVCA0OlxuXG4tICBDIDI2MCBTY2FyZSBTcGlyaXRzIDogMlxuLSAgQyA0MjQgVHVuZSBvZiBGZWFyIDogM1xuLSAgQyAxMzA1IFRlcnJvciA6IDNcbkVGRkVDVCA3OlxuXG4tICBDIDg0NCBCbG9vZCBQb2lzb25pbmcgOiAyMDExXG4tICBDIDg2OCBWZW5vbW91cyBEZWF0aCA6IDMwMTlcbi0gIEMgOTc4IE1hZ2dvdHMgOiA1MFxuRUZGRUNUIDExOlxuXG4tICBDIDEzNTEgUGxhZ3VlIDogOFxuLSAgQyAxMzU1IE1hc3MgQ29uZnVzaW9uIDogMTcxNzk4NjkxODRcbi0gIEMgMTM1NyBIeWRyb3Bob2JpYSA6IDEyOFxuRUZGRUNUIDE1OlxuXG4tICBDIDE0IFJldHVybmluZyA6IDFcbi0gIEMgMTI3OCBSZXR1cm5pbmcgOiAxXG4tICBDIDEzNTAgVm9ydGV4IG9mIFJldHVybmluZyA6IDFcbkVGRkVDVCA2NjpcblxuLSAgQyAyMzEgUGFyYWx5emF0aW9uIDogMTBcbi0gIEMgNDYxIFBhcnRpbmcgb2YgdGhlIFNvdWwgOiA1MDEwXG4tICBDIDEzMDAgUGFyYWx5emUgOiA5MDQyXG5FRkZFQ1QgMTA6XG4tICBSIDExNjUgU2ltdWxhY3J1bSA6IDkwMDcxOTkyNTQ3NDA5OTJcbi0gIEMgMTQwMyBCbG9vZCBMdXN0IDogMTI4XG4tICBDIDE0MzQgUHVyaWZ5IEJsb29kIDogMjg4MjMwMzc2MTUxNzExNzQ0XG4tICBDIDE0MzYgUnVzaCBvZiBTdHJlbmd0aCA6IDEyOFxuRUZGRUNUIDgxOlxuLSAgUiAxNDQwIEJsb29kIFZvcnRleCA6IDg3XG4tICBSIDE0NDkgVGhlIExvb21pbmcgSGVsbCA6IDQyXG4tICBSIDE0NTYgQXN0cmFsIENvcnJ1cHRpb24gOiA1N1xuLSAgQyAxMzYyIFNvdWwgRHJhaW4gOiA1XG4tICBDIDEzNzcgTGVnaW9uJ3MgRGVtaXNlIDogMTQzXG4tICBDIDE0MjEgQmxvb2QgUmFpbiA6IDExMlxuXG5FRkZFQ1QgMjM6XG4tICBSIDEwNzMgRHJhZ29uIE1hc3RlciA6IDEwNzM3NDE4MjRcbi0gIFIgMTE1OSBUd2ljZWJvcm4gOiA0MTk0MzA0XG4tICBSIDExNzkgUml0dWFsIG9mIFJldHVybmluZyA6IDgzODg2MDhcbi0gIEMgMTM4MSBTYWJiYXRoIE1hc3RlciA6IDU3NjQ2MDc1MjMwMzQyMzQ4OFxuLSAgQyAxMzgyIFNhYmJhdGggU2xhdmUgOiAxMTUyOTIxNTA0NjA2ODQ2OTc2XG4tICBDIDEzOTQgSGVsbCBQb3dlciA6IDEzMTA3MlxuRUZGRUNUIDgyOlxuLSAgUiAxMzk3IEluZmVybmFsIENpcmNsZSA6IDg5XG4tICBSIDE0MDggQmxvb2QgRmVjdW5kaXR5IDogOTRcbi0gIFIgMTQzMiBEb21lIG9mIENvcnJ1cHRpb24gOiA2OFxuXG5FRkZFQ1QgMTA1OlxuXG4tICBDIDcxIERpc2JlbGlldmUgOiA5OTlcbkVGRkVDVCAyODpcblxuLSAgQyAxMzY1IFVuZGVhZCBNYXN0ZXJ5IDogOTk5XG4tICBDIDEzNzIgTWFzdGVyIEVuc2xhdmUgOiA5OTlcbi0gIEMgMTM3NSBCZWFzdCBNYXN0ZXJ5IDogOTk5XG5FRkZFQ1QgMTAxOlxuLSAgUiA4NiBhZ2UgdGhyZWUgeWVhcnMgOiAzXG4tICBSIDI4OCBUaG91c2FuZCBZZWFyIEdpbnNlbmcgOiAtNVxuLSAgUiAxNDIwIFJlanV2ZW5hdGUgOiAtMTBcblxuRUZGRUNUIDExMjpcbi0gIFIgOTEgS2lsbCBDYXN0ZXIgOiA5OTk5XG4tICBSIDEzMTYgUHVyaWZ5aW5nIEZsYW1lcyA6IDIwXG5cbkVGRkVDVCAxMTM6XG4tICBSIDk0IEFzdHJhbCBIYXJwb29uIDogMFxuXG5FRkZFQ1QgMTI4OlxuXG4tICBDIDY0NyBCZXdpdGNoaW5nIExpZ2h0cyA6IDEwMFxuLSAgQyA2NjAgU3Rvcm0gV2luZCA6IDIwMTNcbi0gIEMgMTI3MCBGYXNjaW5hdGlvbiA6IDEwMFxuRUZGRUNUIDQ4OlxuLSAgUiAxMjk3IEF1c3BleCA6IDFcbi0gIFIgMTI5OSBHbm9tZSBMb3JlIDogM1xuLSAgUiAxMzg4IEJvd2wgb2YgQmxvb2QgOiA4XG5cbkVGRkVDVCAxNzpcblxuLSAgQyAyMTYgU2VybW9uIG9mIENvdXJhZ2UgOiAxXG4tICBDIDI0MiBGYW5hdGljaXNtIDogMVxuRUZGRUNUIDk5OlxuXG4tICBDIDIyNyBQZXRyaWZpY2F0aW9uIDogOTk5XG4tICBDIDg1OCBQZXRyaWZ5IDogOTk5XG5FRkZFQ1QgNDI6XG4tICBSIDE0MTMgV3JhdGggb2YgUGF6dXp1IDogMTRcbi0gIFIgMTQxOCBSYWluIG9mIFRvYWRzIDogNlxuLSAgUiAxNDMxIFNlbmQgRHJlYW0gSG9ycm9yIDogMTJcblxuRUZGRUNUIDEzOlxuXG4tICBDIDExNDUgSGVhbCA6IDEwMDIwXG4tICBDIDExNTcgQXN0cmFsIEhlYWxpbmcgOiAyXG4tICBDIDEzODAgQmxvb2QgSGVhbCA6IDUwXG5FRkZFQ1QgODpcblxuLSAgQyAyNTggTWlub3IgUmVpbnZpZ29yYXRpb24gOiAxMFxuLSAgQyAyOTggTWVkaXRhdGlvbiBTaWduIDogMTVcbi0gIEMgMTM4MyBSZWludmlnb3JhdGlvbiA6IDIwMFxuRUZGRUNUIDEzNjpcbi0gIFIgMjYyIEN1cnNlIFRhYmxldCA6IDJcbi0gIFIgNDk0IFNlaXRoIEN1cnNlIDogMlxuXG5FRkZFQ1QgNTExOlxuLSAgUiAyNjMgQmxlc3Npbmcgb2YgdGhlIEdvZC1zbGF5ZXIgOiA2NTRcbi0gIFIgMjc4IFRhdXJvYm9saXVtIDogNjUxXG5FRkZFQ1QgODU6XG4tICBSIDI3NyBFcG9wdGVpYSA6IDk0XG5cbkVGRkVDVCAxMTE6XG4tICBSIDI4OSBJbnRlcm5hbCBBbGNoZW15IDogMTVcblxuRUZGRUNUIDI5OlxuXG4tICBDIDEzMjQgQ2hhcm0gQW5pbWFsIDogOTk5XG4tICBDIDEzNTQgQ2hhcm0gOiA5OTlcbi0gIEMgMTQwOSBIZWxsYmluZCBIZWFydCA6IDk5OVxuRUZGRUNUIDYzOlxuLSAgUiA5MDEgV2l6YXJkJ3MgVG93ZXIgOiAyNFxuLSAgUiAxMDU5IExpdmluZyBDYXN0bGUgOiA5XG4tICBSIDE0MzkgVGhyZWUgUmVkIFNlY29uZHMgOiAyNVxuXG5FRkZFQ1QgMjU6XG5cbi0gIEMgMzQ1IFN0cmFuZ2UgRmlyZSA6IDEwMDZcbi0gIEMgNDQ4IEhvbHkgUHlyZSA6IDEwMDVcbkVGRkVDVCA3MzpcblxuLSAgQyA0NTMgSXJvbiBEYXJ0cyA6IDEzXG4tICBDIDQ1NCBJcm9uIEJsaXp6YXJkIDogMTBcbkVGRkVDVCAxOTpcbi0gIFIgNDkwIE1pcnJvciBXYWxrIDogMVxuLSAgUiAxMzAzIFRlbGVwb3J0IDogMVxuXG5cbkVGRkVDVCA1MDE6XG4tICBSIDEwNjEgTG9yZSBvZiBMZWdlbmRzIDogMTA4NlxuLSAgQyA1NDcgU2NvcmNoaW5nIFdpbmQgOiAyNTBcblxuXG5FRkZFQ1QgMTI1OlxuLSAgUiA2MjggTWluZCBWZXNzZWwgOiAxMDBcblxuRUZGRUNUIDExMDpcbi0gIFIgNjMwIERyZWFtcyBvZiBSJ2x5ZWggOiAyMDUyXG5cbkVGRkVDVCAxNDg6XG5cbi0gIEMgNjUwIFN1bHBodXIgSGF6ZSA6IDQwOTZcbi0gIEMgNjU0IFJ1c3QgTWlzdCA6IDMyNzY4XG5FRkZFQ1QgMTQ3OlxuXG4tICBDIDY3MyBDbG91ZCBvZiBEcmVhbWxlc3MgU2x1bWJlciA6IDIwOTcxNTJcbi0gIEMgNjc0IEZpcmUgQ2xvdWQgOiA4XG4tICBDIDcwMyBQb2lzb24gQ2xvdWQgOiA2NFxuRUZGRUNUIDI3OlxuXG4tICBDIDY2NiBNYWdpYyBEdWVsIDogOTk5XG5FRkZFQ1QgMjI6XG4tICBSIDY3NSBGYXRlIG9mIE9lZGlwdXMgOiAwXG5cbkVGRkVDVCA3NDpcblxuLSAgQyA2ODIgQm9sdCBvZiBVbmxpZmUgOiAxMDEzXG4tICBDIDcxNCBCbGFzdCBvZiBVbmxpZmUgOiAxMDE3XG4tICBDIDc0NiBWb3J0ZXggb2YgVW5saWZlIDogMTAxMVxuRUZGRUNUIDkxOlxuLSAgUiA3NDggRmxhbWVzIGZyb20gdGhlIFNreSA6IDEwMTVcbi0gIFIgNzU3IFN0ZWxsYXIgU3RyaWtlIDogMTUwXG4tICBSIDE0NDYgSW5mZXJuYWwgRnVtZXMgOiAxMDA2XG5cbkVGRkVDVCAxMzQ6XG5cbi0gIEMgNjk1IE9yYiBMaWdodG5pbmcgOiA1XG4tICBDIDc0MyBDaGFpbiBMaWdodG5pbmcgOiAxMDAzXG4tICBDIDc1MiBMaWdodG5pbmcgRmllbGQgOiAxXG5FRkZFQ1QgNjAxOlxuXG4tICBDIDcwMCBBc3RyYWwgR2V5c2VyIDogMjYxXG5FRkZFQ1QgMTY4OlxuLSAgUiA3MDUgUHJvamVjdCBTZWxmIDogMTBcblxuRUZGRUNUIDU3OlxuLSAgUiA3MTEgTWluZCBIdW50IDogOTk5XG5cbkVGRkVDVCA3MjpcblxuLSAgQyA3MTYgU3RyZWFtIG9mIExpZmUgOiA1MDI1XG5FRkZFQ1QgMTUzOlxuLSAgUiA3MjIgRWxlbWVudGFsIE9wcG9zaXRpb24gb2YgRWFydGggOiAxXG4tICBSIDcyNSBFbGVtZW50YWwgT3Bwb3NpdGlvbiBvZiBGaXJlIDogMVxuLSAgUiA3MjcgRWxlbWVudGFsIE9wcG9zaXRpb24gb2YgQWlyIDogMVxuXG5FRkZFQ1QgNDE6XG4tICBSIDcyNCBNdXJkZXJpbmcgV2ludGVyIDogOFxuXG5FRkZFQ1QgMTQ2OlxuXG4tICBDIDczMCBDbG91ZCBvZiBEZWF0aCA6IDI2MjE0NFxuLSAgQyA3MzQgUG9pc29uIE1pc3QgOiA2NFxuLSAgQyAxMzIyIExlZWNoaW5nIERhcmtuZXNzIDogMTM0MjE3NzI4XG5FRkZFQ1QgMTY0OlxuLSAgUiA3NzggQWxjaGVtaWNhbCBUcmFuc211dGF0aW9uIDogMjAwXG4tICBSIDgyNSBUcmFuc211dGUgRmlyZSA6IDM1MFxuLSAgUiA4NTYgRWFydGggR2VtIEFsY2hlbXkgOiAzMDBcblxuRUZGRUNUIDEzODpcblxuLSAgQyA3ODAgQXJtb3Igb2YgQWNoaWxsZXMgOiAxMFxuLSAgQyA4MTQgRGVzdHJ1Y3Rpb24gOiA1XG5FRkZFQ1QgNjc6XG5cbi0gIEMgNzgyIFdlYWtuZXNzIDogM1xuLSAgQyA4NDEgRW5mZWVibGUgOiAyXG5FRkZFQ1QgMTYyOlxuXG4tICBDIDc4NCBNaXJyb3IgSW1hZ2UgOiAyMDAwXG5cbkVGRkVDVCA2MDk6XG5cbi0gIEMgODA5IEVuY2FzZSBpbiBJY2UgOiAyOTlcbi0gIEMgODc2IFByaXNvbiBvZiBTZWRuYSA6IDI5OVxuRUZGRUNUIDk2OlxuXG4tICBDIDgzOSBTaGF0dGVyIDogNTAyMFxuRUZGRUNUIDEwMzpcblxuLSAgQyAxMzk1IExlZWNoaW5nIFRvdWNoIDogMTAxNFxuLSAgQyAxNDExIEJsb29kbGV0dGluZyA6IDFcbi0gIEMgMTQyNyBMZWVjaCA6IDEwMjRcbkVGRkVDVCA0NDpcbi0gIFIgODY2IFRyYW5zZm9ybWF0aW9uIDogMVxuXG5FRkZFQ1QgODQ6XG4tICBSIDEyMjEgTGlvbiBTZW50aW5lbHMgOiAxMDVcbi0gIFIgMTI1NSBEb21lIG9mIFNldmVuIFNlYWxzIDogMTMyXG4tICBSIDEzNDUgRm9yZ290dGVuIFBhbGFjZSA6IDExMVxuXG5FRkZFQ1QgNzA6XG4tICBSIDkwMiBDcnVtYmxlIDogLTI1MTc1XG5cbkVGRkVDVCAzNjpcblxuLSAgQyA5MDUgRGlzaW50ZWdyYXRlIDogOTk5XG5FRkZFQ1QgMTMzOlxuXG4tICBDIDkxNCBUaW1lIFN0b3AgOiAxMDRcbkVGRkVDVCAzNDpcbi0gIFIgOTE1IFdpc2ggOiAwXG5cbkVGRkVDVCA0OTpcbi0gIFIgOTk2IFdpbmQgUmlkZSA6IDEwMFxuXG5FRkZFQ1QgMTM1OlxuLSAgUiA5OTcgUmF2ZW4gRmVhc3QgOiAxMDBcblxuRUZGRUNUIDExNTpcbi0gIFIgMTAxMiBBY2FzaGljIFJlY29yZCA6IDk5OVxuXG5FRkZFQ1QgOTg6XG4tICBSIDEwMTcgV2luZ2VkIE1vbmtleXMgOiAxXG5cbkVGRkVDVCA2Mjpcbi0gIFIgMTA2OSBNYW5pZmVzdGF0aW9uIDogMzkyXG5cbkVGRkVDVCA3Njpcbi0gIFIgMTA4MCBUYXJ0YXJpYW4gR2F0ZSA6IDEwXG5cbkVGRkVDVCA0MDpcbi0gIFIgMTEzNiBTZWVraW5nIEFycm93IDogOFxuXG5FRkZFQ1QgOTU6XG4tICBSIDExNTIgQ2xvdWQgVHJhcGV6ZSA6IDFcbi0gIFIgMTQwNCBIZWxsIFJpZGUgOiAxXG5cbkVGRkVDVCAzMDpcbi0gIFIgMTE4MCBEaXNwZWwgOiAxXG5cbkVGRkVDVCA3OTpcbi0gIFIgMTE4NiBGYWVyeSBUcm9kIDogMVxuXG5FRkZFQ1QgMTAwOiAoVEVSUkFJTiBTVU1NT04hKVxuLSAgUiAxMTk3IEhpZGRlbiBpbiBTbm93IDogMVxuLSAgUiAxMjAxIEhpZGRlbiBpbiBTYW5kIDogMlxuLSAgUiAxMjAyIEhpZGRlbiBVbmRlcm5lYXRoIDogM1xuXG5FRkZFQ1QgMTUyOlxuLSAgUiAxMjI2IERpc2VuY2hhbnRtZW50IDogMVxuXG5FRkZFQ1QgMjY6XG4tICBSIDEyMjkgUml0dWFsIG9mIFJlYmlydGggOiAzOThcblxuRUZGRUNUIDExNDpcbi0gIFIgMTIzMyBBd2FrZW4gVHJlZWxvcmQgOiAxMVxuXG5FRkZFQ1QgMTY3OlxuLSAgUiAxMjQ1IExpY2hjcmFmdCA6IDE3OFxuXG5FRkZFQ1QgNTAwOlxuXG4tICBDIDEyNjAgRGVzaWNjYXRpb24gOiAyNTBcbi0gIEMgMTI5OCBDdXJzZSBvZiB0aGUgRGVzZXJ0IDogMjUwXG4tICBDIDE0MzUgRGFtYWdlIFJldmVyc2FsIDogMTA2NFxuRUZGRUNUIDIwOlxuXG4tICBDIDEyNjIgQmxpbmsgOiAzMFxuRUZGRUNUIDk3OlxuXG4tICBDIDEyNjggRnJpZ2h0ZW4gOiA1XG4tICBDIDEyOTAgUGFuaWMgOiAxXG4tICBDIDEyOTMgRGVzcGFpciA6IDRcbkVGRkVDVCAxNjA6XG4tICBSIDEyODQgQ2FycmllciBCaXJkcyA6IDE1XG4tICBSIDEyODggVGVsZXBvcnQgR2VtcyA6IDEwXG5cbkVGRkVDVCAxNjE6XG4tICBSIDEyODUgQ2FycmllciBFYWdsZSA6IDFcbi0gIFIgMTMyMCBUZWxlcG9ydCBJdGVtIDogMVxuXG5FRkZFQ1QgNTM6XG4tICBSIDEzMDQgVmVuZ2VhbmNlIG9mIHRoZSBEZWFkIDogOTk5XG5cbkVGRkVDVCAxMzE6XG4tICBSIDEzMTAgQ3VyZSBEaXNlYXNlIDogMVxuXG5FRkZFQ1QgMTMyOlxuLSAgUiAxMzE1IFB5cmUgb2YgQ2F0aGFyc2lzIDogMVxuXG5FRkZFQ1QgMzk6XG4tICBSIDEzMjcgR2lmdCBvZiBSZWFzb24gOiAxXG4tICBSIDEzNDkgRGl2aW5lIE5hbWUgOiAxXG5cbkVGRkVDVCA4Mzpcbi0gIFIgMTMzMiBQaGxlZ21hdGlhIDogMTM2XG4tICBSIDEzMzMgTWVsYW5jaG9saWEgOiAxMzdcblxuRUZGRUNUIDkyOlxuLSAgUiAxMzM1IEltcHJpbnQgU291bHMgOiAyMDUyXG5cbkVGRkVDVCA3Nzpcbi0gIFIgMTMzNiBHYXRld2F5IDogMVxuLSAgUiAxMzYxIEFzdHJhbCBUcmF2ZWwgOiAxXG5cbkVGRkVDVCA2NDpcbi0gIFIgMTMzOCBMZXByb3N5IDogMVxuXG5FRkZFQ1QgOTQ6XG4tICBSIDEzNDMgQmVja29uaW5nIDogOTk5XG5cbkVGRkVDVCA5MDpcbi0gIFIgMTM2MyBTdHlnaWFuIFBhdGhzIDogMVxuXG5FRkZFQ1QgMTU2OlxuLSAgUiAxMzcwIEFyY2FuZSBBbmFseXNpcyA6IDFcblxuRUZGRUNUIDE1Nzpcbi0gIFIgMTM3MSBBc3RyYWwgRGlzcnVwdGlvbiA6IDFcblxuRUZGRUNUIDE2Mzpcbi0gIFIgMTM3MyBOZXh1cyBHYXRlIDogMVxuXG5FRkZFQ1QgMTE4OlxuLSAgUiAxNDAxIEJsb29kIEZlYXN0IDogNTBcblxuRUZGRUNUIDEwODpcblxuLSAgQyAxNDQxIEluZmVybmFsIFByaXNvbiA6IC0xMlxuLSAgQyAxNDQyIENsYXdzIG9mIEtva3l0b3MgOiAtMTNcbkVGRkVDVCAxMDI6XG4tICBSIDE0NDMgSG9ycm9yIFNlZWQgOiA5XG5cbi8vLy8vIFNwZWxsIENhc2NhZGVzOlxuXG4xMDMzIFRyb2xsIEtpbmcncyBDb3VydCAtPlxuICAyNSAxMCBUcm9sbHMgLT5cbiAgNjAgNSBXYXIgVHJvbGxzIC0+XG4gIDYxIDIgVHJvbGwgTW9vc2UgS25pZ2h0c1xuXG4zMSBNZXRlb3IgU2hvd2VyIC0+IDEwNyBBcmVhIEZpcmVcbjEwMzAgU2VhIEtpbmcncyBDb3VydCAtPiAzNiAxNSBTZWEgVHJvbGxzIC0+IDcyIDUgVHJvbGwgR3VhcmRzXG4xMDc1IEZhZXJpZSBDb3VydCAtPlxuICAzOCBDb3VydCBvZiBTcHJpdGVzIC0+XG4gIDEyNCBGYXkgRm9sayBDb3VydCAtPlxuICAxMjUgRmF5IEZvbGsgQ291cnQgU29sZGllcnMgLT5cbiAgMTI2IEZheSBGb2xrIENvdXJ0IEtuaWdodHNcblxuODM5IFNoYXR0ZXIgLT4gNDMgZXh0cmEgbGltcCAtPiA0NCBleHRyYSBjcmlwcGxlXG5cbjEwMzUgRXRoZXIgR2F0ZSAtPiA2NCAxIEV0aGVyIExvcmQgLT4gNDUgMTUgRXRoZXIgV2FycmlvcnNcblxuNDgyIEhlYXZlbmx5IENob2lyIC0+IDY4IEFuZ2VscyBvZiB0aGUgQ2hvaXIgLT4gNjkgSGFyYmluZ2VycyBvZiB0aGUgQ2hvaXJcblxuMTQyMyBSaXR1YWwgb2YgRml2ZSBHYXRlcyAtPlxuICA3MyBHYXRlIFN1bW1vbiBGaXJlIC0+XG4gIDc0IEdhdGUgU3VtbW9uIEljZSAtPlxuICA3NSBHYXRlIFN1bW1vbiBTdG9ybSAtPlxuICA3NiBHYXRlIFN1bW1vbiBJcm9uXG5cbjU5NCBDb250YWN0IERhaSBUZW5ndSAtPiA3NyAxMCBUZW5ndSBXYXJyaW9ycyAtPiA3OCAxNSBLYXJhc3UgVGVuZ3VzXG5cbjM0OCBCYW5xdWV0IGZvciB0aGUgRGVhZCAtPiA5MCA0IERpdGFudSAtPiA5MSBLaWxsIENhc3RlclxuXG44ODYgQm9uZSBHcmluZGluZyAtPiAxMDggQmF0dGxlZmllbGQgTGltcCAtPiAxMDkgQmF0dGxlZmllbGQgQ3JpcHBsZVxuXG43MTUgQmFuZSBGaXJlIC0+IDExNyBCYW5lIEZsYW1lIEFyZWEgLT4gMjAgTGFyZ2UgQXJlYSBEZWNheVxuXG4yNzEgT3JneSAtPiA4NyA2IE1hZW5hZHNcbjI3OSB4eHggLT4gODcgNiBNYWVuYWRzXG5cbjI4NiBDZWxlc3RpYWwgQ2hhc3Rpc2VtZW50IC0+IDg0IENoYXN0aXNlbWVudFxuXG4zMTEgU3VtbW9uIEdvenUgTWV6dSAtPiA5MiAxIEhvcnNlLWZhY2VcbjM1NyBSZWxlYXNlIExvcmQgb2YgQ2l2aWxpemF0aW9uIC0+IDg1IGFnZSB0ZW4geWVhcnNcblxuNDYxIFBhcnRpbmcgb2YgdGhlIFNvdWwgLT4gMTExIFN1bW1vbiBQcmVkYXRvcnkgQmlyZHNcblxuNTE1IENvbnRhY3QgT25hcXVpIC0+IDY3IEJlYXN0IEJhdHNcblxuNTE5IEJyZWFrIHRoZSBGaXJzdCBTb3VsIC0+IDEwMSBEaXNlYXNlXG5cbjUzOCBEZWNlaXZlIHRoZSBEZWNyZWUgb2YgdGhlIExvc3QgLT4gMTIxIDE1IEdpYW50cyBvZiB0aGUgTG9zdCBUcmliZVxuXG42MDMgT2xtIENvbmNsYXZlIC0+IDExMCAxNSBHcmVhdCBPbG1zXG5cbjE0NTAgQmluZCBEZW1vbiBMb3JkIC0+IDg1IGFnZSB0ZW4geWVhcnNcbjE0NTEgSW5mZXJuYWwgRm9yY2VzIC0+IDI2IDQwIGltcHNcblxuMTI1NyBBcm15IG9mIHRoZSBEZWFkIC0+IDQ2IEV4dHJhIFNvdWxsZXNzXG5cbi8vIG5vbiBzdW1tb25zIHRob1xuNjM2IFNob2NraW5nIEdyYXNwIC0+IDEgTWlub3IgQXJlYSBTaG9ja1xuNjM3IEd1c3Qgb2YgV2luZHMgLT4gMTIwIE1pbm9yIEJsdW50IERhbWFnZVxuNjQ2IFZpbmUgQXJyb3cgLT4gNDcgRW50YW5nbGVcbjY1MCBTdWxwaHVyIEhhemUgLT4gMzkgSGVhdCBTdHVuXG42NTIgTGlnaHRuaW5nIEJvbHQgLT4gMSBNaW5vciBBcmVhIFNob2NrXG5cbjY1OSBGaXJlYmFsbCAtPiAxMTUgQXJlYSBGbGFtZXNcbjY2MCBTdG9ybSBXaW5kIC0+IDEyMCBNaW5vciBCbHVudCBEYW1hZ2VcbjY2MyBBY2lkIEJvbHQgLT4gMTE2IEFjaWQgU3BsYXNoXG42NjQgTWFnbWEgQm9sdHMgLT4gMTEyIEJ1cm5pbmdcbjY2OCBTaGFkb3cgQm9sdCAtPiA0MiBNaW5vciBQYXJhbHlzaXNcbjY3MCBGYWxzZSBGaXJlIC0+IDEyMiBBcmVhIEZhbHNlIEZsYW1lc1xuNjc3IFRodW5kZXIgU3RyaWtlIC0+IDUgVGh1bmRlciBTaG9ja1xuNjc5IEFjaWQgUmFpbiAtPiAxMyBBcmVhIFJ1c3RcbjY4MSBOZXRoZXIgQm9sdCAtPiAyNCBBcmVhIEZlZWJsZSBNaW5kXG42ODMgQmFuZSBGaXJlIERhcnQgLT4gMTEgQXJlYSBEZWNheVxuNjg5IGZhcmtpbGw6IEZpcmVzIGZyb20gQWZhciAtPiAzIExhcmdlIEFyZWEgSGVhdCBTaG9ja1xuNjk2IEVhcnRocXVha2UgLT4gMTA0IEVhcnRocXVha2UgS25vY2tkb3duIFN0dW5cbjY5OCBHaWZ0cyBmcm9tIEhlYXZlbiAtPiAxMDcgQXJlYSBGaXJlXG43MDAgQXN0cmFsIEdleXNlciAtPiA4MyBBc3RyYWwgR2V5c2VyIEJsYXN0XG43MDEgU2hhZG93IEJsYXN0IC0+IDQyIE1pbm9yIFBhcmFseXNpc1xuNzEyIEFzdHJhbCBGaXJlcyAtPiAxMTggQXN0cmFsIEZpcmVzIEFyZWFcbjcyMSBmYXJraWxsOiBUaHVuZGVyc3Rvcm0gLT4gNSBUaHVuZGVyIFNob2NrXG43MjkgTmV0aGVyIERhcnRzIC0+IDI0IEFyZWEgRmVlYmxlIE1pbmRcbjczMiBTdHlnaWFuIFJhaW5zIC0+IDc5IE5hdHVyYWwgUmFpblxuNzMzIFN0b3JtIG9mIFRob3JucyAtPiA0NyBFbnRhbmdsZVxuNzM3IElsbHVzb3J5IEF0dGFjayAtPiAzMCBBcmNoZXIgSWxsdXNpb25zXG43NDkgZmFya2lsbDogRmxhbWVzIGZyb20gdGhlIFNreSAtPiAxMTMgTGFyZ2UgRmlyZWJhbGxcbjc1OCBmYXJraWxsOiBTdGVsbGFyIFN0cmlrZSAtPiAxMDcgQXJlYSBGaXJlXG44MzcgTWF3cyBvZiB0aGUgRWFydGggLT4gMTAwIGVhcnRoIGdyaXBcbjg2MiBTa2VsZXRhbCBMZWdpb24gLT4gMTAyIERpc2Vhc2UgQWxsIEZyaWVuZGx5XG44NjggVmVub21vdXMgRGVhdGggLT4gMTE0IERlY2F5XG44OTcgTGlxdWlmeSAtPiAxMDMgQ3JpcHBsZVxuOTM4IFBob2VuaXggUG93ZXIgLT4gMTkgRmlyZSBSZXNpc3RhbmNlXG45ODQgU3RyZW5ndGggb2YgR2FpYSAtPiAyNyBTdHJlbmd0aCwgQmFya3NraW4gYW5kIFJlZ2VuZXJhdGlvblxuOTk4IENvbnRhY3QgRHJhY29uaWFucyAtPiAzNyAzMCBEcmFjb25pYW5zXG4xMDM4IEZvcmVzdCBUcm9sbCBUcmliZSAtPiA5OSAxNSBGb3Jlc3QgVHJvbGxzXG4xMjAzIE9wcG9zaXRpb24gLT4gMTIzIFN0dW4gTWFnaWMgQmVpbmdcbjEyNDggVW5yYXZlbGluZyAtPiA0MCBFeHRyYSBmZWVibGUgbWluZCBiYXR0bGUgZmllbGRcbjEzODkgQWdvbnkgLT4gMjEgTWFqb3IgRmVhclxuMTM5NCBIZWxsIFBvd2VyIC0+IDQgTWFya1xuMTQxOSBIYXJtIC0+IDM1IEFyZWEgQ2hlc3QgV291bmRcblxuXG4vLyBzcGVsbHMgdGhhdCBhcmUgXCJuZXh0XCIgbXVsdGlwbGUgdGltZXM6XG4vLyAob25seSAxIGlzIGEgc3VtbW9uLCB0aGF0IG9uZSBpcyBidWdnZWQgb3Igc21vZXRoaW5nPylcblxuTWlub3IgQXJlYSBTaG9jayAxIDJcblRodW5kZXIgU2hvY2sgNSAyXG5BcmVhIEZlZWJsZSBNaW5kIDI0IDJcbk1pbm9yIFBhcmFseXNpcyA0MiAyXG5FbnRhbmdsZSA0NyAyXG5hZ2UgdGVuIHllYXJzIDg1IDJcbjYgTWFlbmFkcyA4NyAyIC8vIHRoaXMgb25lXG5BcmVhIEZpcmUgMTA3IDNcbk1pbm9yIEJsdW50IERhbWFnZSAxMjAgMlxuKi9cblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLElBQU0sWUFBWTtBQUVYLFNBQVMsYUFDZCxHQUNBLE9BQ0EsVUFDNkI7QUFDN0IsUUFBTSxRQUFRLEVBQUUsTUFBTSxHQUFHO0FBQ3pCLE1BQUksTUFBTSxTQUFTO0FBQUcsVUFBTSxJQUFJLE1BQU0sYUFBYSxDQUFDLHFCQUFxQjtBQUN6RSxRQUFNLFFBQXFDLENBQUM7QUFDNUMsYUFBVyxLQUFLLE9BQU87QUFDckIsVUFBTSxDQUFDLEdBQUcsV0FBVyxZQUFZLFFBQVEsSUFBSSxFQUFFLE1BQU0sU0FBUyxLQUFLLENBQUM7QUFDcEUsUUFBSSxDQUFDLGFBQWEsQ0FBQztBQUNqQixZQUFN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QTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUE7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BRUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFB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QUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7QUFhdkM7QUFFQSxTQUFTLGNBQ1AsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBLEdBQ0E7QUFDQSxVQUFRLElBQUk7QUFBQSxPQUFVLENBQUMsR0FBRztBQUMxQixJQUFFLE9BQU8sTUFBTSxLQUFLO0FBQ3BCLFVBQVEsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUc7QUFDckMsUUFBTSxPQUFPLEVBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdEMsTUFBSTtBQUFNLGVBQVcsS0FBSztBQUFNLGNBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNqRCxVQUFRLElBQUksUUFBUSxDQUFDO0FBQUE7QUFBQSxDQUFNO0FBQzdCO0FBSUEsUUFBUSxJQUFJLFFBQVEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVwQyxJQUFJO0FBQU0sVUFBUSxJQUFJO0FBQUE7QUFDakIsVUFBUTsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImYiXQp9Cg==
