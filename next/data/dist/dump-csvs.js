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

// src/cli/misc-defs.ts
var INDIES = /* @__PURE__ */ new Set([
  8,
  // Elephant Spearman
  10,
  // Projection
  17,
  // Archer
  18,
  // Militia
  19,
  // Heavy Cavalry
  20,
  // Heavy Cavalry
  21,
  // Heavy Cavalry
  24,
  // Light Cavalry
  25,
  // Light Cavalry
  26,
  // Light Cavalry
  28,
  // Light Infantry
  29,
  // Light Infantry
  30,
  // Militia
  31,
  // Militia
  32,
  // Archer
  33,
  // Archer
  34,
  // Commander
  35,
  // Commander
  36,
  // Commander
  38,
  // Heavy Infantry
  39,
  // Heavy Infantry
  40,
  // Heavy Infantry
  44,
  // Mounted Commander
  45,
  // Mounted Commander
  47,
  // Crossbowman
  48,
  // Crossbowman
  49,
  // Crossbowman
  55,
  // Longbowman
  91,
  // Heavy Cavalry
  118,
  // War Master
  121,
  // Demonbred
  123,
  // Wolf Tribe Archer
  124,
  // Wolf Tribe Warrior
  125,
  // Woodsman Blowpipe
  126,
  // Woodsman
  136,
  // Horse Tribe Chief
  137,
  // Horse Tribe Cavalry
  155,
  // Velite
  174,
  // Triton
  175,
  // Triton Guard
  176,
  // Triton
  182,
  // Wraith Lord
  205,
  // Raptor
  252,
  // Harab Seraph
  285,
  // Spearman
  286,
  // Maceman
  287,
  // Swordsman
  288,
  // Heavy Crossbowman
  289,
  // Pikeneer
  290,
  // Crossbowman
  291,
  // Captain
  292,
  // Heavy Cavalry
  293,
  // Captain
  295,
  // Sacred Serpent
  302,
  // Wizard of High Magics
  321,
  // Lizard Shaman
  324,
  // Dwarf Elder
  327,
  // Anathemant
  328,
  // Lizard King
  334,
  // Golden Naga
  346,
  // Crystal Sorceress
  347,
  // Crystal Priestess
  348,
  // Amazon
  349,
  // Garnet Sorceress
  350,
  // Garnet Priestess
  351,
  // Amazon
  352,
  // Jade Sorceress
  353,
  // Jade Priestess
  354,
  // Amazon
  355,
  // Onyx Sorceress
  356,
  // Onyx Priestess
  357,
  // Amazon
  367,
  // Pegasus Rider
  369,
  // Nightmare Rider
  370,
  // Jade Maiden
  374,
  // Queen Mother
  415,
  // High Seraph
  416,
  // Seraphine
  423,
  // Lizard Warrior
  427,
  // Spy
  542,
  // Stone Monstra
  548,
  // Hoburg Hero
  4012,
  // Vaetti Archer
  4013,
  // Elephant Archer
  4014,
  // Chariot Archer
  4015,
  // Mammoth Archer
  4016,
  // Chariot Archer
  4017,
  // Elephant Archer
  4018,
  // Elephant Archer
  4019
  // Elephant Archer
]);
var UNDEAD = /* @__PURE__ */ new Set([
  536,
  // Longdead Buccaneer
  547,
  // Dead One
  184,
  // Knight of the Unholy Sepulchre
  186,
  // Longdead Velite
  190,
  // Mound King
  191,
  // Longdead
  192,
  // Longdead
  193,
  // Longdead
  194,
  // Longdead
  195,
  // Longdead
  315,
  // Soulless Giant
  316,
  // Longdead Giant
  317,
  // Soulless
  319,
  // Soulless of C'tis
  398,
  // Mummy
  408,
  // Deer Carcass
  392,
  // Ashen Angel // event guy?
  613,
  // Longdead Admiral
  615,
  // Longdead of C'tis
  616,
  // Longdead of C'tis
  617,
  // Longdead of C'tis
  624
  // Old King
]);
var DEBUGGERS = /* @__PURE__ */ new Set([
  4024,
  // Debug Senpai
  4025
  // Debug Kohai
]);
var NO_IDEA = /* @__PURE__ */ new Set([
  623,
  // King of the World (horror???)
  368,
  // Gryphon - XXX
  554,
  // Ermorian Cultist // event?
  382,
  // Mystic
  295,
  // Sacred Serpent (ctis?)
  542,
  // Stone Monstra
  543,
  // Angel XXX old angelic host summon?
  368,
  // Gryphon - XXX
  // pretty sure these are just summons from `nextspell`s
  182,
  // Wraith Lord (isnt there a spell?)
  3906,
  // Unseelie Soldier
  3907,
  // Unseelie Knight
  3909,
  // Unseelie Prince
  3912,
  // Fay Folk
  3913,
  // Fay Folk
  3914,
  // Fay Folk
  3915,
  // Fay Folk
  3916,
  // Fay Folk
  3917,
  // Fay Folk
  3997
  // Queen of Winter (PRETENDER???)
]);
var ANIMALS = /* @__PURE__ */ new Set([
  4,
  // Serpent
  591,
  // Dragonfly
  410,
  // Giant Rat
  4e3
  // Horse (like a generic mount?)
]);
var HORRORS = /* @__PURE__ */ new Set([
  307,
  // Lesser Horror
  308,
  // Horror
  2209,
  // Horror Mantis
  2210,
  // Float Cat Horror
  2211,
  // Mind Slime Horror
  2212,
  // Soultorn
  2213,
  // Gore Tide Horror
  2214,
  // Spine Membrane Horror
  2215,
  // Belly Maw Horror
  2216
  // Brass Claw Horror
]);

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
    case 8 /* MOUNT */:
      return `(rides)`;
    case 10 /* GROWS_TO */:
      return `(grows to)`;
    case 9 /* SHRINKS_TO */:
      return `(shrinks to)`;
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
    if (summoner.growhp) {
      addRow(10 /* GROWS_TO */, 1, summoner.id, summoner.id - 1);
    }
    if (summoner.shrinkhp) {
      addRow(9 /* SHRINKS_TO */, 1, summoner.id, summoner.id + 1);
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
  const pretenders = new Map(
    Nation.rows.map((r) => [r.id, /* @__PURE__ */ new Set()])
  );
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
var SHAPE_KEYS = [
  "shapechange",
  "prophetshape",
  "firstshape",
  "secondshape",
  "secondtmpshape",
  "forestshape",
  "plainshape",
  "foreignshape",
  "homeshape",
  "domshape",
  "notdomshape",
  "springshape",
  "summershape",
  "autumnshape",
  "wintershape",
  "xpshapemon",
  "transformation",
  "landshape",
  "watershape",
  "batlleshape",
  "worldshape"
];
var NATURE_NAMED = /Tree|Fungus|Boulder|Flower|Shroom|Bush|Shrub/;
var TRUE_MISC = /* @__PURE__ */ new Set([
  "Seaweed",
  "Crystal",
  "Stalagmite",
  "Bookshelf",
  "Counter",
  "Table",
  "Barrel",
  "Crate",
  "Cactus",
  "Large Stone",
  "Peasant",
  "Commoner",
  "Blood Slave"
]);
function makeMiscUnit(tables) {
  const {
    Unit,
    UnitByNation,
    UnitBySpell,
    UnitBySummoner,
    UnitBySite
  } = tables;
  const miscRows = [];
  const wightShapes = /* @__PURE__ */ new Map();
  const lichShapes = /* @__PURE__ */ new Map();
  const sources = new Map(
    Unit.rows.map((unit) => {
      if (unit.lich) {
        if (lichShapes.has(unit.lich))
          lichShapes.get(unit.lich).push(unit.id);
        else
          lichShapes.set(unit.lich, [unit.id]);
      }
      if (unit.twiceborn) {
        if (wightShapes.has(unit.twiceborn))
          wightShapes.get(unit.twiceborn).push(unit.id);
        else
          wightShapes.set(unit.twiceborn, [unit.id]);
      }
      return [unit.id, { unit, src: [] }];
    })
  );
  for (const r of UnitByNation.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySpell.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySummoner.rows)
    sources.get(r.unitId).src.push(r);
  for (const r of UnitBySite.rows)
    sources.get(r.unitId).src.push(r);
  let res = 0;
  let change = 0;
  do {
    res = change;
    console.log("const UNITS = new Set([");
    change = findMiscUnit(tables, miscRows, sources);
    console.log("]);");
  } while (0);
}
function findMiscUnit(tables, miscRows, sources) {
  const { Unit } = tables;
  let us = 0;
  let ut = 0;
  for (const { unit, src } of sources.values()) {
    ut++;
    if (src.length) {
      us++;
      continue;
    }
    if (unit.startdom) {
      miscRows.push({
        unitId: unit.id,
        reason: 10 /* MYSTERY_PRETENDER */
      });
      us++;
      continue;
    }
    if (DEBUGGERS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 3 /* DEBUG */
      });
      us++;
      continue;
    }
    if (UNDEAD.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 9 /* UNDEAD */
      });
      us++;
      continue;
    }
    if (UNDEAD.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 9 /* UNDEAD */
      });
      us++;
      continue;
    }
    if (NO_IDEA.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 11 /* NO_IDEA */
      });
      us++;
      continue;
    }
    if (INDIES.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 2 /* INDIE */
      });
      us++;
      continue;
    }
    if (HORRORS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 13 /* HORRORS */
      });
      us++;
      continue;
    }
    if (ANIMALS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: 12 /* PROBABLY_ANIMALS */
      });
      us++;
      continue;
    }
    if (unit.name.startsWith("Jotun") || unit.name === "Gygja" || unit.name === "Godihuskarl") {
      miscRows.push({
        unitId: unit.id,
        reason: 4 /* TODO_MYPALHEIM */
      });
      us++;
      continue;
    }
    if (unit.name === "Adventurer") {
      miscRows.push({
        unitId: unit.id,
        reason: 6 /* ADVENTURER */
      });
      us++;
      continue;
    }
    if (NATURE_NAMED.test(unit.name) || TRUE_MISC.has(unit.name)) {
      miscRows.push({
        unitId: unit.id,
        reason: 0 /* MISC_MISC */
      });
      us++;
      continue;
    }
    if (unit.name.toUpperCase().includes("WIGHT")) {
      miscRows.push({
        unitId: unit.id,
        reason: 7 /* WIGHT */
      });
      us++;
      continue;
    }
    if (unit.name.toUpperCase().includes("LICH")) {
      miscRows.push({
        unitId: unit.id,
        reason: 8 /* LICH */
      });
      us++;
      continue;
    }
    let shaped = false;
    for (const k of SHAPE_KEYS) {
      if (unit[k]) {
        const v = unit[k];
        const prev = sources.get(v);
        if (!prev) {
          continue;
        }
        if (prev.src.length === 0) {
          continue;
        }
        shaped = true;
      }
    }
    if (shaped) {
      us++;
      continue;
    }
    console.log(`  ${unit.id}, // ${unit.name}`);
  }
  console.log(`${us} / ${ut} units have sources; ${ut - us} to go`);
  return us;
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
        case 320:
          for (const uid of summons)
            addRow(uid, 320, 128 /* PICK_ONE */, summonStrength);
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
      case 35:
        summons = [
          453,
          // Foul Spawn
          454,
          // Foul Spawn
          457,
          // Foul Spawn
          458,
          // Foul Spawn
          461,
          // Foul Spawn
          466,
          // Cockatrice
          467,
          // Foul Beast
          487,
          // Chimera
          488
          // Ettin
        ];
        break;
      case 130:
      case 54:
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
  [1219]: [3348, 3349, 3350, 3351, 3352],
  // infernal breedin
  [320]: [2967, 2968, 2969, 2970, 2971, 2972, 2973, 2974, 3061]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbGliL3NyYy9qb2luLnRzIiwgIi4uLy4uL2xpYi9zcmMvc2VyaWFsaXplLnRzIiwgIi4uLy4uL2xpYi9zcmMvY29sdW1uLnRzIiwgIi4uLy4uL2xpYi9zcmMvdXRpbC50cyIsICIuLi8uLi9saWIvc3JjL3NjaGVtYS50cyIsICIuLi8uLi9saWIvc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9jbGkvY3N2LWRlZnMudHMiLCAiLi4vc3JjL2NsaS9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL2NsaS9kdW1wLWNzdnMudHMiLCAiLi4vc3JjL2NsaS9taXNjLWRlZnMudHMiLCAiLi4vc3JjL2NsaS9qb2luLXRhYmxlcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuXG5jb25zdCBKT0lOX1BBUlQgPSAvXlxccyooXFx3KylcXHMqXFxbXFxzKihcXHcrKVxccypcXF1cXHMqKD86PVxccyooXFx3KylcXHMqKT8kL1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9Kb2luIChcbiAgczogc3RyaW5nLFxuICB0YWJsZT86IFRhYmxlLFxuICB0YWJsZU1hcD86IFJlY29yZDxzdHJpbmcsIFRhYmxlPlxuKTogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XVtdIHtcbiAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcrJyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBub3QgZW5vdWdoIGpvaW5zYCk7XG4gIGNvbnN0IGpvaW5zOiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZz9dW10gPSBbXTtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgY29uc3QgW18sIHRhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gcC5tYXRjaChKT0lOX1BBUlQpID8/IFtdO1xuICAgIGlmICghdGFibGVOYW1lIHx8ICFjb2x1bW5OYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRVtDT0xdPVBST1BcImApO1xuXG4gICAgam9pbnMucHVzaChbdGFibGVOYW1lLCBjb2x1bW5OYW1lLCBwcm9wTmFtZV0pO1xuICB9XG4gIGlmICh0YWJsZU1hcCkgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB2YWxpZGF0ZUpvaW4oaiwgdGFibGUhLCB0YWJsZU1hcCk7XG4gIHJldHVybiBqb2lucztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVKb2luIChcbiAgam9pbjogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XSxcbiAgdGFibGU6IFRhYmxlLFxuICB0YWJsZU1hcDogUmVjb3JkPHN0cmluZywgVGFibGU+XG4pIHtcbiAgY29uc3QgW3RhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gam9pbjtcbiAgY29uc3QgcyA9IGAke3RhYmxlTmFtZX1bJHtjb2x1bW5OYW1lfV0ke3Byb3BOYW1lID8gJz0nICsgcHJvcE5hbWUgOiAnJ31gXG4gIGNvbnN0IGNvbCA9IHRhYmxlLnNjaGVtYS5jb2x1bW5zQnlOYW1lW2NvbHVtbk5hbWVdO1xuICBpZiAoIWNvbClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGJhZCBqb2luIFwiJHtzfVwiOiBcIiR7dGFibGUubmFtZX1cIiBoYXMgbm8gXCIke2NvbHVtbk5hbWV9XCJgKTtcbiAgY29uc3QgalRhYmxlID0gdGFibGVNYXBbdGFibGVOYW1lXTtcbiAgaWYgKCFqVGFibGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3RhYmxlTmFtZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICBjb25zdCBqQ29sID0galRhYmxlLnNjaGVtYS5jb2x1bW5zQnlOYW1lW2pUYWJsZS5zY2hlbWEua2V5XTtcbiAgaWYgKCFqQ29sKVxuICAgIHRocm93IG5ldyBFcnJvcihgYmFkIGpvaW4gXCIke3N9XCI6IFwiJHt0YWJsZU5hbWV9XCIgaGFzIG5vIGtleT8/Pz9gKTtcbiAgaWYgKGpDb2wudHlwZSAhPT0gY29sLnR5cGUpXG4gICAgLy90aHJvdyBuZXcgRXJyb3IoKVxuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBpZmZ5IGpvaW4gXCIke1xuICAgICAgICBzXG4gICAgICB9XCI6IFwiJHtcbiAgICAgICAgY29sdW1uTmFtZVxuICAgICAgfVwiICgke1xuICAgICAgICBjb2wubGFiZWxcbiAgICAgIH0pIGlzIGEgZGlmZmVyZW50IHR5cGUgdGhhbiAke1xuICAgICAgICB0YWJsZU5hbWVcbiAgICAgIH0uJHtcbiAgICAgICAgakNvbC5uYW1lXG4gICAgICB9ICgke1xuICAgICAgICBqQ29sLmxhYmVsXG4gICAgICB9KWBcbiAgICApO1xuXG4gIGlmIChwcm9wTmFtZSAmJiBqVGFibGUuc2NoZW1hLmNvbHVtbnNCeU5hbWVbcHJvcE5hbWVdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3Byb3BOYW1lfVwiIGlzIGFscmVhZHkgdXNlZCFgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pblRvU3RyaW5nIChqb2luczogW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XVtdKSB7XG4gIHJldHVybiBqb2lucy5tYXAoKFt0LCBjLCBwXSkgPT4gYCR7dH1bJHtjfV1gICsgKHAgPyBgPSR7cH1gIDogJycpKS5qb2luKCcgKyAnKTtcbn1cblxuY29uc3QgSk9JTkVEX1BBUlQgPSAvXihcXHcrKVxcLihcXHcrKT0oXFx3KykkLztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvSm9pbmVkQnkgKFxuICBzOiBzdHJpbmcsXG4pOiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXSB7XG4gIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnLCcpO1xuICBpZiAocGFydHMubGVuZ3RoIDwgMSkgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbmVkQnkgZG9lc250IGV4aXN0P2ApO1xuICBjb25zdCBqb2luZWRCeTogW3N0cmluZywgc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgY29uc3QgW18sIHRhYmxlTmFtZSwgY29sdW1uTmFtZSwgcHJvcE5hbWVdID0gcC5tYXRjaChKT0lORURfUEFSVCkgPz8gW107XG4gICAgaWYgKCF0YWJsZU5hbWUgfHwgIWNvbHVtbk5hbWUgfHwgIXByb3BOYW1lKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBiYWQgam9pbiBcIiR7c31cIjogXCIke3B9XCIgZG9lcyBub3QgbWF0Y2ggXCJUQUJMRS5DT0w9UFJPUFwiYCk7XG5cbiAgICBqb2luZWRCeS5wdXNoKFt0YWJsZU5hbWUsIGNvbHVtbk5hbWUsIHByb3BOYW1lXSk7XG4gIH1cbiAgcmV0dXJuIGpvaW5lZEJ5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbmVkQnlUb1N0cmluZyAoam9pbnM6IFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXVtdKSB7XG4gIHJldHVybiBqb2lucy5tYXAoKFt0LCBjLCBwXSkgPT4gYCR7dH0uJHtjfT0ke3B9YCkuam9pbignLCcpO1xufVxuIiwgImNvbnN0IF9fdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IF9fdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXk7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0OiBVaW50OEFycmF5LCBpOiBudW1iZXIpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0PzogVWludDhBcnJheSwgaSA9IDApIHtcbiAgaWYgKHMuaW5kZXhPZignXFwwJykgIT09IC0xKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZignXFwwJyk7XG4gICAgY29uc29sZS5lcnJvcihgJHtpfSA9IE5VTEwgPyBcIi4uLiR7cy5zbGljZShpIC0gMTAsIGkgKyAxMCl9Li4uYCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd3aG9vcHNpZScpO1xuICB9XG4gIGNvbnN0IGJ5dGVzID0gX190ZXh0RW5jb2Rlci5lbmNvZGUocyArICdcXDAnKTtcbiAgaWYgKGRlc3QpIHtcbiAgICBkZXN0LnNldChieXRlcywgaSk7XG4gICAgcmV0dXJuIGJ5dGVzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoaTogbnVtYmVyLCBhOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gIGxldCByID0gMDtcbiAgd2hpbGUgKGFbaSArIHJdICE9PSAwKSB7IHIrKzsgfVxuICByZXR1cm4gW19fdGV4dERlY29kZXIuZGVjb2RlKGEuc2xpY2UoaSwgaStyKSksIHIgKyAxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpZ0JveVRvQnl0ZXMgKG46IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAvLyB0aGlzIGlzIGEgY29vbCBnYW1lIGJ1dCBsZXRzIGhvcGUgaXQgZG9lc24ndCB1c2UgMTI3KyBieXRlIG51bWJlcnNcbiAgY29uc3QgYnl0ZXMgPSBbMF07XG4gIGlmIChuIDwgMG4pIHtcbiAgICBuICo9IC0xbjtcbiAgICBieXRlc1swXSA9IDEyODtcbiAgfVxuXG4gIC8vIFdPT1BTSUVcbiAgd2hpbGUgKG4pIHtcbiAgICBpZiAoYnl0ZXNbMF0gPT09IDI1NSkgdGhyb3cgbmV3IEVycm9yKCdicnVoIHRoYXRzIHRvbyBiaWcnKTtcbiAgICBieXRlc1swXSsrO1xuICAgIGJ5dGVzLnB1c2goTnVtYmVyKG4gJiAyNTVuKSk7XG4gICAgbiA+Pj0gOG47XG4gIH1cblxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0JpZ0JveSAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICBjb25zdCBMID0gTnVtYmVyKGJ5dGVzW2ldKTtcbiAgY29uc3QgbGVuID0gTCAmIDEyNztcbiAgY29uc3QgcmVhZCA9IDEgKyBsZW47XG4gIGNvbnN0IG5lZyA9IChMICYgMTI4KSA/IC0xbiA6IDFuO1xuICBjb25zdCBCQjogYmlnaW50W10gPSBBcnJheS5mcm9tKGJ5dGVzLnNsaWNlKGkgKyAxLCBpICsgcmVhZCksIEJpZ0ludCk7XG4gIGlmIChsZW4gIT09IEJCLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdiaWdpbnQgY2hlY2tzdW0gaXMgRlVDSz8nKTtcbiAgcmV0dXJuIFtsZW4gPyBCQi5yZWR1Y2UoYnl0ZVRvQmlnYm9pKSAqIG5lZyA6IDBuLCByZWFkXVxufVxuXG5mdW5jdGlvbiBieXRlVG9CaWdib2kgKG46IGJpZ2ludCwgYjogYmlnaW50LCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIG4gfCAoYiA8PCBCaWdJbnQoaSAqIDgpKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MgfSBmcm9tICcuJztcbmltcG9ydCB7IGJpZ0JveVRvQnl0ZXMsIGJ5dGVzVG9CaWdCb3ksIGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5cbmV4cG9ydCB0eXBlIENvbHVtbkFyZ3MgPSB7XG4gIHR5cGU6IENPTFVNTjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICB3aWR0aD86IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgZmxhZz86IG51bWJlcnxudWxsO1xuICBiaXQ/OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEICAgICAgID0gMCxcbiAgU1RSSU5HICAgICAgID0gMSxcbiAgQk9PTCAgICAgICAgID0gMixcbiAgVTggICAgICAgICAgID0gMyxcbiAgSTggICAgICAgICAgID0gNCxcbiAgVTE2ICAgICAgICAgID0gNSxcbiAgSTE2ICAgICAgICAgID0gNixcbiAgVTMyICAgICAgICAgID0gNyxcbiAgSTMyICAgICAgICAgID0gOCxcbiAgQklHICAgICAgICAgID0gOSxcbiAgU1RSSU5HX0FSUkFZID0gMTcsXG4gIFU4X0FSUkFZICAgICA9IDE5LFxuICBJOF9BUlJBWSAgICAgPSAyMCxcbiAgVTE2X0FSUkFZICAgID0gMjEsXG4gIEkxNl9BUlJBWSAgICA9IDIyLFxuICBVMzJfQVJSQVkgICAgPSAyMyxcbiAgSTMyX0FSUkFZICAgID0gMjQsXG4gIEJJR19BUlJBWSAgICA9IDI1LFxufTtcblxuZXhwb3J0IGNvbnN0IENPTFVNTl9MQUJFTCA9IFtcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkcnLFxuICAnQk9PTCcsXG4gICdVOCcsXG4gICdJOCcsXG4gICdVMTYnLFxuICAnSTE2JyxcbiAgJ1UzMicsXG4gICdJMzInLFxuICAnQklHJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdVTlVTRUQnLFxuICAnVU5VU0VEJyxcbiAgJ1VOVVNFRCcsXG4gICdTVFJJTkdfQVJSQVknLFxuICAnVThfQVJSQVknLFxuICAnSThfQVJSQVknLFxuICAnVTE2X0FSUkFZJyxcbiAgJ0kxNl9BUlJBWScsXG4gICdVMzJfQVJSQVknLFxuICAnSTMyX0FSUkFZJyxcbiAgJ0JJR19BUlJBWScsXG5dO1xuXG5leHBvcnQgdHlwZSBOVU1FUklDX0NPTFVNTiA9XG4gIHxDT0xVTU4uVThcbiAgfENPTFVNTi5JOFxuICB8Q09MVU1OLlUxNlxuICB8Q09MVU1OLkkxNlxuICB8Q09MVU1OLlUzMlxuICB8Q09MVU1OLkkzMlxuICB8Q09MVU1OLlU4X0FSUkFZXG4gIHxDT0xVTU4uSThfQVJSQVlcbiAgfENPTFVNTi5VMTZfQVJSQVlcbiAgfENPTFVNTi5JMTZfQVJSQVlcbiAgfENPTFVNTi5VMzJfQVJSQVlcbiAgfENPTFVNTi5JMzJfQVJSQVlcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbiAgW0NPTFVNTi5VOF9BUlJBWV06IDEsXG4gIFtDT0xVTU4uSThfQVJSQVldOiAxLFxuICBbQ09MVU1OLlUxNl9BUlJBWV06IDIsXG4gIFtDT0xVTU4uSTE2X0FSUkFZXTogMixcbiAgW0NPTFVNTi5VMzJfQVJSQVldOiA0LFxuICBbQ09MVU1OLkkzMl9BUlJBWV06IDQsXG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCaWdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJJRyB8IENPTFVNTi5CSUdfQVJSQVkge1xuICByZXR1cm4gKHR5cGUgJiAxNSkgPT09IENPTFVNTi5CSUc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jvb2xDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJPT0wge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJPT0w7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0cmluZ0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uU1RSSU5HIHwgQ09MVU1OLlNUUklOR19BUlJBWSB7XG4gIHJldHVybiAodHlwZSAmIDE1KSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uPFQgPSBhbnksIFIgZXh0ZW5kcyBVaW50OEFycmF5fG51bWJlciA9IGFueT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgYXJyYXlGcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IFRbXTtcbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUO1xuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtUW10sIG51bWJlcl07XG4gIGZyb21CeXRlcyAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbVCwgbnVtYmVyXTtcbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXTtcbiAgc2VyaWFsaXplUm93ICh2OiBUKTogUixcbiAgc2VyaWFsaXplQXJyYXkgKHY6IFRbXSk6IFIsXG4gIHRvU3RyaW5nICh2OiBzdHJpbmcpOiBhbnk7XG4gIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBiaXQ6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xuICByZWFkb25seSBvZmZzZXQ6IG51bWJlcnxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxzdHJpbmcsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLlNUUklORyB8IENPTFVNTi5TVFJJTkdfQVJSQVk7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLlNUUklOR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAzO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IGluZGV4LCBuYW1lLCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc1N0cmluZ0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignJHtuYW1lfSBpcyBub3QgYSBzdHJpbmcgY29sdW1uJyk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCdmb28nKSAhPT0gJ3N0cmluZycpXG4gICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKGBzZWVtcyBvdmVycmlkZSBmb3IgJHtuYW1lfSBkb2VzIG5vdCByZXR1cm4gYSBzdHJpbmdgKTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuaXNBcnJheSA9ICh0aGlzLnR5cGUgJiAxNikgPT09IDE2O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCF0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaSBkb250IGdpYiBhcnJheScpO1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICAvLyBUT0RPIC0gYXJyYXkgc2VwYXJhdG9yIGFyZyFcbiAgICByZXR1cm4gdi5zcGxpdCgnLCcpLm1hcChpID0+IHRoaXMuZnJvbVRleHQoaS50cmltKCksIHUsIGEpKTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nIHtcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZ1tdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3Qgc3RyaW5nczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBzdHJpbmdzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbc3RyaW5ncywgcmVhZF1cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogc3RyaW5nKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIHN0cmluZ1RvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBzdHJpbmdbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5zdHJpbmdUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz9cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoaXRlbXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxudW1iZXIsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogTlVNRVJJQ19DT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IDF8Mnw0O1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAwO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICByZWFkb25seSBpc0FycmF5OiBib29sZWFuO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc051bWVyaWNDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaXMgbm90IGEgbnVtZXJpYyBjb2x1bW5gKTtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ251bWJlcicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcihgJHtuYW1lfSBvdmVycmlkZSBtdXN0IHJldHVybiBhIG51bWJlcmApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5pc0FycmF5ID0gKHRoaXMudHlwZSAmIDE2KSA9PT0gMTY7XG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICAgIHRoaXMud2lkdGggPSBDT0xVTU5fV0lEVEhbdGhpcy50eXBlXTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogbnVtYmVyW10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IG51bWJlciB7XG4gICAgIHJldHVybiB0aGlzLm92ZXJyaWRlID8gKCB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpICkgOlxuICAgICAgdiA/IE51bWJlcih2KSB8fCAwIDogMDtcbiAgfVxuXG4gIGFycmF5RnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlcltdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgbnVtYmVyczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICAgICAgbnVtYmVycy5wdXNoKHMpO1xuICAgICAgaSArPSByO1xuICAgICAgcmVhZCArPSByO1xuICAgIH1cbiAgICByZXR1cm4gW251bWJlcnMsIHJlYWRdO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgXzogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICAgIGlmICh0aGlzLmlzQXJyYXkpIHRocm93IG5ldyBFcnJvcignaW0gYXJyYXkgdGhvJylcbiAgICAgIHJldHVybiB0aGlzLm51bWJlckZyb21WaWV3KGksIHZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBudW1iZXJGcm9tVmlldyAoaTogbnVtYmVyLCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHN3aXRjaCAodGhpcy50eXBlICYgMTUpIHtcbiAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3aG9tc3QnKTtcbiAgICB9XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHRoaXMud2lkdGgpO1xuICAgIHRoaXMucHV0Qnl0ZXModiwgMCwgYnl0ZXMpO1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG4gIHNlcmlhbGl6ZUFycmF5KHY6IG51bWJlcltdKTogVWludDhBcnJheSB7XG4gICAgaWYgKHYubGVuZ3RoID4gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ3RvbyBiaWchJyk7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSgxICsgdGhpcy53aWR0aCAqIHYubGVuZ3RoKVxuICAgIGxldCBpID0gMTtcbiAgICBmb3IgKGNvbnN0IG4gb2Ygdikge1xuICAgICAgYnl0ZXNbMF0rKztcbiAgICAgIHRoaXMucHV0Qnl0ZXMobiwgaSwgYnl0ZXMpO1xuICAgICAgaSs9dGhpcy53aWR0aDtcbiAgICB9XG4gICAgLy8gc2VlbXMgbGlrZSB0aGVyZSBzaG91bGQgYmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbiAgcHJpdmF0ZSBwdXRCeXRlcyh2OiBudW1iZXIsIGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICBmb3IgKGxldCBvID0gMDsgbyA8IHRoaXMud2lkdGg7IG8rKylcbiAgICAgIGJ5dGVzW2kgKyBvXSA9ICh2ID4+PiAobyAqIDgpKSAmIDI1NTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCaWdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJpZ2ludCwgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQklHIHwgQ09MVU1OLkJJR19BUlJBWVxuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMjtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgcmVhZG9ubHkgaXNBcnJheTogYm9vbGVhbjtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNCaWdDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgdGhpcy50eXBlID0gdHlwZVxuICAgIHRoaXMuaXNBcnJheSA9ICh0eXBlICYgMTYpID09PSAxNjtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG5cbiAgICB0aGlzLmxhYmVsID0gQ09MVU1OX0xBQkVMW3RoaXMudHlwZV07XG4gIH1cblxuICBhcnJheUZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYmlnaW50W10ge1xuICAgIGlmICghdGhpcy5pc0FycmF5KSB0aHJvdyBuZXcgRXJyb3IoJ2kgZG9udCBnaWIgYXJyYXknKTtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgLy8gVE9ETyAtIGFycmF5IHNlcGFyYXRvciBhcmchXG4gICAgcmV0dXJuIHYuc3BsaXQoJywnKS5tYXAoaSA9PiB0aGlzLmZyb21UZXh0KGkudHJpbSgpLCB1LCBhKSk7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdikgcmV0dXJuIDBuO1xuICAgIHJldHVybiBCaWdJbnQodik7XG4gIH1cblxuICBhcnJheUZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludFtdLCBudW1iZXJdIHtcbiAgICBpZiAoIXRoaXMuaXNBcnJheSkgdGhyb3cgbmV3IEVycm9yKCdpIGRvbnQgZ2liIGFycmF5Jyk7XG4gICAgY29uc3QgbGVuZ3RoID0gYnl0ZXNbaSsrXTtcbiAgICBsZXQgcmVhZCA9IDE7XG4gICAgY29uc3QgYmlnYm9pczogYmlnaW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxlbmd0aDsgbisrKSB7XG4gICAgICBjb25zdCBbcywgcl0gPSB0aGlzLmZyb21CeXRlcyhpLCBieXRlcyk7XG4gICAgICBiaWdib2lzLnB1c2gocyk7XG4gICAgICBpICs9IHI7XG4gICAgICByZWFkICs9IHI7XG4gICAgfVxuICAgIHJldHVybiBbYmlnYm9pcywgcmVhZF07XG5cbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9CaWdCb3koaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYmlnaW50KTogVWludDhBcnJheSB7XG4gICAgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgcmV0dXJuIGJpZ0JveVRvQnl0ZXModik7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheSh2OiBiaWdpbnRbXSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICh2Lmxlbmd0aCA+IDI1NSkgdGhyb3cgbmV3IEVycm9yKCd0b28gYmlnIScpO1xuICAgIGNvbnN0IGl0ZW1zID0gWzBdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGg7IGkrKykgaXRlbXMucHVzaCguLi5iaWdCb3lUb0J5dGVzKHZbaV0pKTtcbiAgICAvLyBzZWVtcyBsaWtlIHRoZXJlIHNob3VsZCBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcyBCSUc/XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGl0ZW1zKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCb29sQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxib29sZWFuLCBudW1iZXI+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJPT0wgPSBDT0xVTU4uQk9PTDtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uQk9PTF07XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyO1xuICByZWFkb25seSBvcmRlciA9IDE7XG4gIHJlYWRvbmx5IG9mZnNldCA9IDA7XG4gIHJlYWRvbmx5IGlzQXJyYXk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgYml0LCBmbGFnLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdib29sZWFuJylcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJvb2wnKTtcbiAgICBpZiAoIWlzQm9vbENvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBib29sYCk7XG4gICAgaWYgKHR5cGVvZiBmbGFnICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBmbGFnIGlzIG5vdCBudW1iZXJgKTtcbiAgICBpZiAodHlwZW9mIGJpdCAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgYml0IGlzIG5vdCBudW1iZXJgKTtcbiAgICB0aGlzLmZsYWcgPSBmbGFnO1xuICAgIHRoaXMuYml0ID0gYml0O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGFycmF5RnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBuZXZlcltdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgTkVWRVIgQVJSQVknKSAvLyB5ZXR+P1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodiwgdSwgYSk7XG4gICAgaWYgKCF2IHx8IHYgPT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXJyYXlGcm9tQnl0ZXMoX2k6IG51bWJlciwgX2J5dGVzOiBVaW50OEFycmF5KTogW25ldmVyW10sIG51bWJlcl0ge1xuICAgIHRocm93IG5ldyBFcnJvcignSSBORVZFUiBBUlJBWScpIC8vIHlldH4/XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtib29sZWFuLCBudW1iZXJdIHtcbiAgICAvLyAuLi4uaXQgZGlkIG5vdC5cbiAgICAvL2NvbnNvbGUubG9nKGBSRUFEIEZST00gJHtpfTogRE9FUyAke2J5dGVzW2ldfSA9PT0gJHt0aGlzLmZsYWd9YCk7XG4gICAgcmV0dXJuIFsoYnl0ZXNbaV0gJiB0aGlzLmZsYWcpID09PSB0aGlzLmZsYWcsIDBdO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFtDT0xVTU4uQk9PTCwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBib29sZWFuKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdiA/IHRoaXMuZmxhZyA6IDA7XG4gIH1cblxuICBzZXJpYWxpemVBcnJheShfdjogYm9vbGVhbltdKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignaSB3aWxsIE5FVkVSIGJlY29tZSBBUlJBWScpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEZDb21wYXJhYmxlID0ge1xuICBvcmRlcjogbnVtYmVyLFxuICBiaXQ6IG51bWJlciB8IG51bGwsXG4gIGluZGV4OiBudW1iZXJcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBGaWVsZHMgKGE6IENvbHVtbiwgYjogQ29sdW1uKTogbnVtYmVyIHtcbiAgaWYgKGEuaXNBcnJheSAhPT0gYi5pc0FycmF5KSByZXR1cm4gYS5pc0FycmF5ID8gMSA6IC0xXG4gIHJldHVybiAoYS5vcmRlciAtIGIub3JkZXIpIHx8XG4gICAgKChhLmJpdCA/PyAwKSAtIChiLmJpdCA/PyAwKSkgfHxcbiAgICAoYS5pbmRleCAtIGIuaW5kZXgpO1xufVxuXG5leHBvcnQgdHlwZSBDb2x1bW4gPVxuICB8U3RyaW5nQ29sdW1uXG4gIHxOdW1lcmljQ29sdW1uXG4gIHxCaWdDb2x1bW5cbiAgfEJvb2xDb2x1bW5cbiAgO1xuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UZXh0IChcbiAgbmFtZTogc3RyaW5nLFxuICBpbmRleDogbnVtYmVyLFxuICBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzLFxuICBkYXRhOiBzdHJpbmdbXVtdLFxuKTogQ29sdW1uQXJnc3xudWxsIHtcbiAgY29uc3QgZmllbGQgPSB7XG4gICAgaW5kZXgsXG4gICAgbmFtZSxcbiAgICBvdmVycmlkZTogc2NoZW1hQXJncy5vdmVycmlkZXNbbmFtZV0gYXMgdW5kZWZpbmVkIHwgKCguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSxcbiAgICB0eXBlOiBDT0xVTU4uVU5VU0VELFxuICAgIC8vIGF1dG8tZGV0ZWN0ZWQgZmllbGRzIHdpbGwgbmV2ZXIgYmUgYXJyYXlzLlxuICAgIGlzQXJyYXk6IGZhbHNlLFxuICAgIG1heFZhbHVlOiAwLFxuICAgIG1pblZhbHVlOiAwLFxuICAgIHdpZHRoOiBudWxsIGFzIGFueSxcbiAgICBmbGFnOiBudWxsIGFzIGFueSxcbiAgICBiaXQ6IG51bGwgYXMgYW55LFxuICB9O1xuICBsZXQgaXNVc2VkID0gZmFsc2U7XG4gIC8vaWYgKGlzVXNlZCAhPT0gZmFsc2UpIGRlYnVnZ2VyO1xuICBmb3IgKGNvbnN0IHUgb2YgZGF0YSkge1xuICAgIGNvbnN0IHYgPSBmaWVsZC5vdmVycmlkZSA/IGZpZWxkLm92ZXJyaWRlKHVbaW5kZXhdLCB1LCBzY2hlbWFBcmdzKSA6IHVbaW5kZXhdO1xuICAgIGlmICghdikgY29udGludWU7XG4gICAgLy9jb25zb2xlLmVycm9yKGAke2luZGV4fToke25hbWV9IH4gJHt1WzBdfToke3VbMV19OiAke3Z9YClcbiAgICBpc1VzZWQgPSB0cnVlO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIodik7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkge1xuICAgICAgLy8gbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgZmllbGQudHlwZSA9IENPTFVNTi5TVFJJTkc7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSkge1xuICAgICAgY29uc29sZS53YXJuKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGhhcyBhIGZsb2F0PyBcIiR7dn1cIiAoJHtufSlcXHgxYlswbWApO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKG4pKSB7XG4gICAgICAvLyB3ZSB3aWxsIGhhdmUgdG8gcmUtZG8gdGhpcyBwYXJ0OlxuICAgICAgZmllbGQubWluVmFsdWUgPSAtSW5maW5pdHk7XG4gICAgICBmaWVsZC5tYXhWYWx1ZSA9IEluZmluaXR5O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobiA8IGZpZWxkLm1pblZhbHVlKSBmaWVsZC5taW5WYWx1ZSA9IG47XG4gICAgICBpZiAobiA+IGZpZWxkLm1heFZhbHVlKSBmaWVsZC5tYXhWYWx1ZSA9IG47XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpc1VzZWQpIHtcbiAgICAvL2NvbnNvbGUuZXJyb3IoYFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX0gaXMgdW51c2VkP1xceDFiWzBtYClcbiAgICAvL2RlYnVnZ2VyO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1pblZhbHVlID09PSAwICYmIGZpZWxkLm1heFZhbHVlID09PSAxKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszNG0ke2l9OiR7bmFtZX0gYXBwZWFycyB0byBiZSBhIGJvb2xlYW4gZmxhZ1xceDFiWzBtYCk7XG4gICAgZmllbGQudHlwZSA9IENPTFVNTi5CT09MO1xuICAgIGZpZWxkLmJpdCA9IHNjaGVtYUFyZ3MuZmxhZ3NVc2VkO1xuICAgIGZpZWxkLmZsYWcgPSAxIDw8IChmaWVsZC5iaXQgJSA4KTtcbiAgICByZXR1cm4gZmllbGQ7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQklHIEJPWSBUSU1FXG4gIGZpZWxkLnR5cGUgPSBDT0xVTU4uQklHO1xuICByZXR1cm4gZmllbGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmdzRnJvbVR5cGUgKFxuICBuYW1lOiBzdHJpbmcsXG4gIHR5cGU6IENPTFVNTixcbiAgaW5kZXg6IG51bWJlcixcbiAgc2NoZW1hQXJnczogU2NoZW1hQXJncyxcbik6IENvbHVtbkFyZ3Mge1xuICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICBzd2l0Y2ggKHR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignaG93IHlvdSBnb25uYSB1c2UgaXQgdGhlbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgY29uc3QgYml0ID0gc2NoZW1hQXJncy5mbGFnc1VzZWQ7XG4gICAgICBjb25zdCBmbGFnID0gMSA8PCAoYml0ICUgOCk7XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgZmxhZywgYml0LCBvdmVycmlkZSB9O1xuXG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICByZXR1cm4geyB0eXBlLCBuYW1lLCBpbmRleCwgd2lkdGg6IDEsIG92ZXJyaWRlIH07XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgIHJldHVybiB7IHR5cGUsIG5hbWUsIGluZGV4LCB3aWR0aDogMiwgb3ZlcnJpZGUgfTtcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHsgdHlwZSwgbmFtZSwgaW5kZXgsIHdpZHRoOiA0LCBvdmVycmlkZX07XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgd2F0IHR5cGUgaXMgdGhpcyAke3R5cGV9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21BcmdzIChhcmdzOiBDb2x1bW5BcmdzKTogQ29sdW1uIHtcbiAgc3dpdGNoIChhcmdzLnR5cGUgJiAxNSkge1xuICAgIGNhc2UgQ09MVU1OLlVOVVNFRDpcbiAgICAgIHRocm93IG5ldyBFcnJvcigndW51c2VkIGZpZWxkIGNhbnQgYmUgdHVybmVkIGludG8gYSBDb2x1bW4nKTtcbiAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICByZXR1cm4gbmV3IFN0cmluZ0NvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgaWYgKGFyZ3MudHlwZSAmIDE2KSB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1Y2ggdGhpbmcgYXMgYSBmbGFnIGFycmF5Jyk7XG4gICAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiBuZXcgQmlnQ29sdW1uKGFyZ3MpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHdhdCB0eXBlIGlzIHRoaXMgJHthcmdzLnR5cGV9YCk7XG4gIH1cbn1cbiIsICIvLyBqdXN0IGEgYnVuY2ggb2Ygb3V0cHV0IGZvcm1hdHRpbmcgc2hpdFxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlRGVjbyhuYW1lOiBzdHJpbmcsIHdpZHRoID0gODAsIHN0eWxlID0gOSkge1xuICBjb25zdCB7IFRMLCBCTCwgVFIsIEJSLCBIUiB9ID0gZ2V0Qm94Q2hhcnMoc3R5bGUpXG4gIGNvbnN0IG5hbWVXaWR0aCA9IG5hbWUubGVuZ3RoICsgMjsgLy8gd2l0aCBzcGFjZXNcbiAgY29uc3QgaFRhaWxXaWR0aCA9IHdpZHRoIC0gKG5hbWVXaWR0aCArIDYpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbiAgY21wRmllbGRzLFxufSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgeyBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGpvaW5Ub1N0cmluZywgam9pbmVkQnlUb1N0cmluZywgc3RyaW5nVG9Kb2luLCBzdHJpbmdUb0pvaW5lZEJ5IH0gZnJvbSAnLi9qb2luJztcblxuZXhwb3J0IHR5cGUgU2NoZW1hQXJncyA9IHtcbiAgbmFtZTogc3RyaW5nO1xuICBrZXk6IHN0cmluZztcbiAgam9pbnM/OiBzdHJpbmc7XG4gIGpvaW5lZEJ5Pzogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG4gIHJhd0ZpZWxkczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogW10pID0+IGFueT5cbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgam9pbnM/OiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXTtcbiAgcmVhZG9ubHkgam9pbmVkQnk6IFtzdHJpbmcsIHN0cmluZywgc3RyaW5nXVtdID0gW107XG4gIHJlYWRvbmx5IGtleTogc3RyaW5nO1xuICByZWFkb25seSBjb2x1bW5zQnlOYW1lOiBSZWNvcmQ8c3RyaW5nLCBDb2x1bW4+O1xuICByZWFkb25seSBmaXhlZFdpZHRoOiBudW1iZXI7IC8vIHRvdGFsIGJ5dGVzIHVzZWQgYnkgbnVtYmVycyArIGZsYWdzXG4gIHJlYWRvbmx5IGZsYWdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RyaW5nRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpZ0ZpZWxkczogbnVtYmVyO1xuICBjb25zdHJ1Y3Rvcih7IGNvbHVtbnMsIG5hbWUsIGZsYWdzVXNlZCwga2V5LCBqb2lucywgam9pbmVkQnkgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArICgoIWMuaXNBcnJheSAmJiBjLndpZHRoKSB8fCAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgaWYgKGpvaW5zKSB0aGlzLmpvaW5zID0gc3RyaW5nVG9Kb2luKGpvaW5zKVxuICAgICAgLm1hcCgoW3QsIGMsIHBdKSA9PiBbdCwgYywgcCA/PyB0XSk7XG4gICAgaWYgKGpvaW5lZEJ5KSB0aGlzLmpvaW5lZEJ5LnB1c2goLi4uc3RyaW5nVG9Kb2luZWRCeShqb2luZWRCeSkpO1xuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBsZXQgZiA9IHRydWU7XG4gICAgbGV0IGIgPSBmYWxzZTtcbiAgICBsZXQgZmYgPSAwO1xuICAgIGZvciAoY29uc3QgW2ksIGNdIG9mIHRoaXMuY29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICAgIGxldCBPQyA9IC0xO1xuICAgICAgLy9pZiAoYy50eXBlICYgMTYpIGJyZWFrO1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklOR19BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVThfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4X0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5VMTZfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNl9BUlJBWTpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyX0FSUkFZOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzJfQVJSQVk6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJR19BUlJBWTpcbiAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgaWYgKG8gPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRzbyA9IE1hdGgubWF4KDAsIGkgLSAyKVxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMubmFtZSwgaSwgbywgYERTTzoke2Rzb30uLiR7aSArIDJ9OmAsIGNvbHVtbnMuc2xpY2UoTWF0aC5tYXgoMCwgaSAtIDIpLCBpICsgMikpO1xuICAgICAgICAgICAgICBkZWJ1Z2dlcjtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgbm90IGJlIScpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIERPTkUgfn5+fn4nKTtcbiAgICAgICAgICAgIGIgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gdGhpcy5mbGFnRmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoJ2Jvb29PU0FBU09BTycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzaG91bGQgYmUhJylcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjLCBvKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCd+fn5+fiBCT09MIFRJTUVTIH5+fn5+Jyk7XG4gICAgICAgICAgICBiID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmZiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdib29vJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvOyBjLmJpdCA9IGZmKys7IGMuZmxhZyA9IDIgKiogKGMuYml0ICUgOCk7IC8vIGhlaGVoZVxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgIGlmIChjLmJpdCArIDEgPT09IHRoaXMuZmxhZ0ZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCkgdGhyb3cgbmV3IEVycm9yKCdXSFVQT1NJRScpXG4gICAgICAgICAgICBpZiAoYy5mbGFnIDwgMTI4ICYmIG8gIT09IHRoaXMuZml4ZWRXaWR0aCAtIDEpIHRocm93IG5ldyBFcnJvcignV0hVUE9TSUUgLSAxJylcbiAgICAgICAgICAgIGYgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIE9DID0gbztcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgIGlmICghYy53aWR0aCkgZGVidWdnZXI7XG4gICAgICAgICAgbyArPSBjLndpZHRoITtcbiAgICAgICAgICBpZiAobyA9PT0gdGhpcy5maXhlZFdpZHRoKSBmID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvL2NvbnN0IHJuZyA9IE9DIDwgMCA/IGBgIDogYCAke09DfS4uJHtvfSAvICR7dGhpcy5maXhlZFdpZHRofWBcbiAgICAgIC8vY29uc29sZS5sb2coYFske2l9XSR7cm5nfWAsIGMubmFtZSwgYy5sYWJlbClcbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBsZXQga2V5OiBzdHJpbmc7XG4gICAgbGV0IGpvaW5zOiBzdHJpbmd8dW5kZWZpbmVkO1xuICAgIGxldCBqb2luZWRCeTogc3RyaW5nfHVuZGVmaW5lZDtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIFtrZXksIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuICAgIFtqb2lucywgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG4gICAgW2pvaW5lZEJ5LCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcbiAgICBjb25zb2xlLmxvZygnLSBCVUgnLCBuYW1lLCBrZXksIGpvaW5zLCBqb2luZWRCeSlcbiAgICBpZiAoIWpvaW5zKSBqb2lucyA9IHVuZGVmaW5lZDtcbiAgICBpZiAoIWpvaW5lZEJ5KSBqb2luZWRCeSA9IHVuZGVmaW5lZDtcbiAgICBjb25zdCBhcmdzID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGtleSxcbiAgICAgIGpvaW5zLFxuICAgICAgam9pbmVkQnksXG4gICAgICBjb2x1bW5zOiBbXSBhcyBDb2x1bW5bXSxcbiAgICAgIGZpZWxkczogW10gYXMgc3RyaW5nW10sXG4gICAgICBmbGFnc1VzZWQ6IDAsXG4gICAgICByYXdGaWVsZHM6IHt9LCAvLyBub25lIDo8XG4gICAgICBvdmVycmlkZXM6IHt9LCAvLyBub25lflxuICAgIH07XG5cbiAgICBjb25zdCBudW1GaWVsZHMgPSBieXRlc1tpKytdIHwgKGJ5dGVzW2krK10gPDwgOCk7XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIC8vIFRPRE8gLSBvbmx5IHdvcmtzIHdoZW4gMC1maWVsZCBzY2hlbWFzIGFyZW4ndCBhbGxvd2VkfiFcbiAgICB3aGlsZSAoaW5kZXggPCBudW1GaWVsZHMpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBieXRlc1tpKytdO1xuICAgICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgICBjb25zdCBmID0ge1xuICAgICAgICBpbmRleCwgbmFtZSwgdHlwZSxcbiAgICAgICAgd2lkdGg6IG51bGwsIGJpdDogbnVsbCwgZmxhZzogbnVsbCxcbiAgICAgICAgb3JkZXI6IDk5OVxuICAgICAgfTtcbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIGxldCBjOiBDb2x1bW47XG5cbiAgICAgIHN3aXRjaCAodHlwZSAmIDE1KSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG5cbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICAvL2lmIChjLm9mZnNldCAmJiBjLm9mZnNldCAhPT0gdG90YWxSZWFkKSB7IGRlYnVnZ2VyOyBjb25zb2xlLmxvZygnd29vcHNpZScpOyB9XG4gICAgICBsZXQgW3YsIHJlYWRdID0gYy5pc0FycmF5ID9cbiAgICAgICAgYy5hcnJheUZyb21CeXRlcyhpLCBieXRlcywgdmlldykgOlxuICAgICAgICBjLmZyb21CeXRlcyhpLCBieXRlcywgdmlldyk7XG5cbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKVxuICAgICAgICByZWFkID0gKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSA/IDEgOiAwO1xuXG4gICAgICBpICs9IHJlYWQ7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVhZDtcbiAgICAgIC8vIGRvbid0IHB1dCBmYWxzeSB2YWx1ZXMgb24gZmluYWwgb2JqZWN0cy4gbWF5IHJldmlzaXQgaG93IHRoaXMgd29ya3MgbGF0ZXJcbiAgICAgIC8vaWYgKGMuaXNBcnJheSB8fCB2KSByb3dbYy5uYW1lXSA9IHY7XG4gICAgICByb3dbYy5uYW1lXSA9IHY7XG4gICAgICAvL2NvbnN0IHcgPSBnbG9iYWxUaGlzLl9ST1dTW3RoaXMubmFtZV1bX19yb3dJZF1bYy5uYW1lXSAvLyBzcnMgYml6XG4gICAgICAvKlxuICAgICAgaWYgKHcgIT09IHYpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHcpIHx8IHcuc29tZSgobiwgaSkgPT4gbiAhPT0gdltpXSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBYWFhYWCAke3RoaXMubmFtZX1bJHtfX3Jvd0lkfV1bJHtjLm5hbWV9XSAke3d9IC0+ICR7dn1gKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYF9fX19fICR7dGhpcy5uYW1lfVske19fcm93SWR9XVske2MubmFtZX1dICR7d30gPT0gJHt2fWApXG4gICAgICB9XG4gICAgICAqL1xuICAgIH1cbiAgICAvL2lmIChkYnIpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAgIFJFQUQ6ICR7dG90YWxSZWFkfSBUTyAke2l9IC8gJHtidWZmZXIuYnl0ZUxlbmd0aH1cXG5gLCByb3csICdcXG5cXG4nKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgLy99XG4gICAgcmV0dXJuIFtyb3csIHRvdGFsUmVhZF07XG4gIH1cblxuICBwcmludFJvdyAocjogUm93LCBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPikge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkpO1xuICB9XG5cbiAgc2VyaWFsaXplSGVhZGVyICgpOiBCbG9iIHtcbiAgICAvLyBbLi4ubmFtZSwgMCwgbnVtRmllbGRzMCwgbnVtRmllbGRzMSwgZmllbGQwVHlwZSwgZmllbGQwRmxhZz8sIC4uLmZpZWxkME5hbWUsIDAsIGV0Y107XG4gICAgLy8gVE9ETyAtIEJhc2UgdW5pdCBoYXMgNTAwKyBmaWVsZHNcbiAgICBpZiAodGhpcy5jb2x1bW5zLmxlbmd0aCA+IDY1NTM1KSB0aHJvdyBuZXcgRXJyb3IoJ29oIGJ1ZGR5Li4uJyk7XG4gICAgY29uc3QgcGFydHMgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSksXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMua2V5KSxcbiAgICAgIC4uLnRoaXMuc2VyaWFsaXplSm9pbnMoKSxcbiAgICAgIHRoaXMuY29sdW1ucy5sZW5ndGggJiAyNTUsXG4gICAgICAodGhpcy5jb2x1bW5zLmxlbmd0aCA+Pj4gOCksXG4gICAgICAuLi50aGlzLmNvbHVtbnMuZmxhdE1hcChjID0+IGMuc2VyaWFsaXplKCkpXG4gICAgXSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW3BhcnRzXSk7XG4gIH1cblxuICBzZXJpYWxpemVKb2lucyAoKSB7XG4gICAgbGV0IGogPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICBsZXQgamIgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICBpZiAodGhpcy5qb2lucykgaiA9IHN0cmluZ1RvQnl0ZXMoam9pblRvU3RyaW5nKHRoaXMuam9pbnMpKTtcbiAgICBpZiAodGhpcy5qb2luZWRCeSkgamIgPSBzdHJpbmdUb0J5dGVzKGpvaW5lZEJ5VG9TdHJpbmcodGhpcy5qb2luZWRCeSkpO1xuICAgIHJldHVybiBbLi4uaiwgLi4uamJdO1xuICB9XG5cbiAgc2VyaWFsaXplUm93IChyOiBSb3cpOiBCbG9iIHtcbiAgICBjb25zdCBmaXhlZCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZml4ZWRXaWR0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGNvbnN0IGJsb2JQYXJ0czogQmxvYlBhcnRbXSA9IFtmaXhlZF07XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdiA9IHJbYy5uYW1lXVxuICAgICAgICBpZiAoYy5pc0FycmF5KSB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplQXJyYXkodiBhcyBhbnlbXSlcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChjLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIHN0cmluZylcbiAgICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgICB9IGJyZWFrO1xuICAgICAgICAgIGNhc2UgQ09MVU1OLkJJRzoge1xuICAgICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgICAgZml4ZWRbaV0gfD0gYy5zZXJpYWxpemVSb3codiBhcyBib29sZWFuKTtcbiAgICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgICAvLyBhZnRlciB3ZSdyZSBkb25lIHdpdGggbnVtYmVycyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAgIC8vaWYgKGMuZmxhZyA9PT0gMTI4KSBpKys7XG4gICAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgaSsrO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgICAgZml4ZWQuc2V0KGJ5dGVzLCBpKVxuICAgICAgICAgICAgaSArPSBjLndpZHRoITtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihjKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB3YXQgdHlwZSBpcyB0aGlzICR7KGMgYXMgYW55KS50eXBlfWApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmxvZygnR09PQkVSIENPTFVNTjonLCBjKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0dPT0JFUiBST1c6Jywgcik7XG4gICAgICAgIHRocm93IGV4O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgKHIuX19yb3dJZCA8IDUgfHwgci5fX3Jvd0lkID4gMzk3NSB8fCByLl9fcm93SWQgJSAxMDAwID09PSAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgLSBST1cgJHtyLl9fcm93SWR9YCwgeyBpLCBibG9iUGFydHMsIHIgfSk7XG4gICAgLy99XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29mZnNldCcsXG4gICAgICAnb3JkZXInLFxuICAgICAgJ2JpdCcsXG4gICAgICAndHlwZScsXG4gICAgICAnZmxhZycsXG4gICAgICAnd2lkdGgnLFxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuXG4gIH1cblxuICAvLyByYXdUb1JvdyAoZDogUmF3Um93KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge31cbiAgLy8gcmF3VG9TdHJpbmcgKGQ6IFJhd1JvdywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge31cbn07XG5cbiIsICJpbXBvcnQgeyB2YWxpZGF0ZUpvaW4gfSBmcm9tICcuL2pvaW4nO1xuaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmV4cG9ydCB0eXBlIFJvd0RhdGEgPSBhbnk7IC8vIGZtbFxuZXhwb3J0IHR5cGUgUm93ID0gUmVjb3JkPHN0cmluZywgUm93RGF0YT4gJiB7IF9fcm93SWQ6IG51bWJlciB9O1xuXG50eXBlIFRhYmxlQmxvYiA9IHsgbnVtUm93czogbnVtYmVyLCBoZWFkZXJCbG9iOiBCbG9iLCBkYXRhQmxvYjogQmxvYiB9O1xuXG5leHBvcnQgY2xhc3MgVGFibGUge1xuICBnZXQgbmFtZSAoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuc2NoZW1hLm5hbWUgfVxuICBnZXQga2V5ICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5zY2hlbWEua2V5IH1cbiAgcmVhZG9ubHkgbWFwOiBNYXA8YW55LCBhbnk+ID0gbmV3IE1hcCgpXG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSByb3dzOiBSb3dbXSxcbiAgICByZWFkb25seSBzY2hlbWE6IFNjaGVtYSxcbiAgKSB7XG4gICAgY29uc3Qga2V5TmFtZSA9IHRoaXMua2V5O1xuICAgIGlmIChrZXlOYW1lICE9PSAnX19yb3dJZCcpIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93cykge1xuICAgICAgY29uc3Qga2V5ID0gcm93W2tleU5hbWVdO1xuICAgICAgaWYgKHRoaXMubWFwLmhhcyhrZXkpKSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyBub3QgdW5pcXVlJyk7XG4gICAgICB0aGlzLm1hcC5zZXQoa2V5LCByb3cpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBhcHBseUxhdGVKb2lucyAoXG4gICAganQ6IFRhYmxlLFxuICAgIHRhYmxlczogUmVjb3JkPHN0cmluZywgVGFibGU+LFxuICAgIGFkZERhdGE6IGJvb2xlYW5cbiAgKTogVGFibGUge1xuICAgIGNvbnN0IGpvaW5zID0ganQuc2NoZW1hLmpvaW5zO1xuXG4gICAgaWYgKCFqb2lucykgdGhyb3cgbmV3IEVycm9yKCdzaGl0IGFzcyBpZGl0b3Qgd2hvbXN0Jyk7XG4gICAgZm9yIChjb25zdCBqIG9mIGpvaW5zKSB7XG4gICAgICB2YWxpZGF0ZUpvaW4oaiwganQsIHRhYmxlcyk7XG4gICAgICBjb25zdCBbdG4sIGNuLCBwbl0gPSBqO1xuICAgICAgY29uc3QgdCA9IHRhYmxlc1t0bl07XG4gICAgICBjb25zdCBqYiA9IHQuc2NoZW1hLmpvaW5lZEJ5O1xuICAgICAgaWYgKGpiLnNvbWUoKFtqYnRuLCBfLCBqYnBuXSkgPT4gKGpidG4gPT09IHRuKSAmJiAoamJwbiA9PT0gcG4pKSlcbiAgICAgICAgY29uc29sZS53YXJuKGAke3RufSBhbHJlYWR5IGpvaW5lZCAke2p9YClcbiAgICAgIGVsc2VcbiAgICAgICAgamIucHVzaChbanQuc2NoZW1hLm5hbWUsIGNuLCBwbl0pO1xuICAgIH1cblxuICAgIGlmIChhZGREYXRhKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdBUFBMWUlORycpXG4gICAgICAgIC8vY29uc29sZS5sb2coJy0gSk9JTicsIHIpXG4gICAgICBmb3IgKGNvbnN0IFt0biwgY24sIHBuXSBvZiBqdC5zY2hlbWEuam9pbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCByIG9mIGp0LnJvd3MpIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCcgIC0nLCB0biwgJ09OJywgY24pO1xuICAgICAgICAgIGNvbnN0IGppZCA9IHJbY25dO1xuICAgICAgICAgIGlmIChqaWQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IGpyID0gdGFibGVzW3RuXS5tYXAuZ2V0KGppZCk7XG4gICAgICAgICAgaWYgKCFqcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGAke2p0Lm5hbWV9IE1JU1NFRCBBIEpPSU4gJHt0bn1bJHtjbn1dPSR7cG59OiBOT1RISU5HIFRIRVJFYCwgcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcHJvcCA9IHBuID8/IGp0Lm5hbWU7XG4gICAgICAgICAgaWYgKGpyW3Byb3BdKSBqcltwcm9wXS5wdXNoKHIpO1xuICAgICAgICAgIGVsc2UganJbcHJvcF0gPSBbcl07XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnICA+JywganIuaWQsIGpyLm5hbWUsIGpyW3RuXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2coXG4gICAgICAgIC8vanQuc2NoZW1hLm5hbWUsXG4gICAgICAgIC8vdGFibGVzLk1hZ2ljU2l0ZS5yb3dzLmZpbHRlcihyID0+IHJbanQuc2NoZW1hLm5hbWVdKVxuICAgICAgICAvL1suLi50YWJsZXMuTWFnaWNTaXRlLm1hcC52YWx1ZXMoKV0uZmluZChyID0+IHJbJ1NpdGVCeU5hdGlvbiddKVxuICAgICAgLy8pXG4gICAgfVxuXG4gICAgcmV0dXJuIGp0O1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZVRhYmxlICh0YWJsZTogVGFibGUsIGxpc3Q/OiBUYWJsZVtdLCBtYXA/OiBSZWNvcmQ8c3RyaW5nLCBUYWJsZT4pIHtcbiAgICBpZiAobGlzdCkge1xuICAgICAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YodGFibGUpO1xuICAgICAgaWYgKGluZGV4ID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKGB0YWJsZSAke3RhYmxlLm5hbWV9IGlzIG5vdCBpbiB0aGUgbGlzdGApO1xuICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIGlmIChtYXApIHtcbiAgICAgIGlmICh0YWJsZS5uYW1lIGluIG1hcCkgZGVsZXRlIG1hcFt0YWJsZS5uYW1lXTtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKGB0YWJsZSAke3RhYmxlLm5hbWV9IGlzIG5vdCBpbiB0aGUgbWFwYCk7XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuXG4gICAgLy9jb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB7XG4gICAgICAvL2NvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIC8vaWYgKHIuX19yb3dJZCA9PT0gMClcbiAgICAgICAgLy9yb3dCbG9iLmFycmF5QnVmZmVyKCkudGhlbihhYiA9PiB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgbmV3IFVpbnQ4QXJyYXkoYWIpLmpvaW4oJywgJykpO1xuICAgICAgICAvL30pO1xuICAgICAgLy9yZXR1cm4gcm93QmxvYjtcbiAgICAvL30pO1xuICAgIGNvbnN0IHJvd0Jsb2IgPSBuZXcgQmxvYihyb3dEYXRhKVxuICAgIGNvbnN0IGRhdGFQYWRkaW5nID0gKDQgLSByb3dCbG9iLnNpemUgJSA0KSAlIDQ7XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFVpbnQzMkFycmF5KFtcbiAgICAgICAgdGhpcy5yb3dzLmxlbmd0aCxcbiAgICAgICAgc2NoZW1hSGVhZGVyLnNpemUgKyBzY2hlbWFQYWRkaW5nLFxuICAgICAgICByb3dCbG9iLnNpemUgKyBkYXRhUGFkZGluZ1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHNjaGVtYUhlYWRlcixcbiAgICAgICAgbmV3IEFycmF5QnVmZmVyKHNjaGVtYVBhZGRpbmcpIGFzIGFueSAvLyA/Pz9cbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKHsgdGFibGVzLCBibG9icywgYWxsU2l6ZXMsIGFsbEhlYWRlcnMsIGFsbERhdGEgfSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW2FsbFNpemVzLCAuLi5hbGxIZWFkZXJzLCAuLi5hbGxEYXRhXSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgb3BlbkJsb2IgKGJsb2I6IEJsb2IpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIFRhYmxlPj4ge1xuICAgIGlmIChibG9iLnNpemUgJSA0ICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3dvbmt5IGJsb2Igc2l6ZScpO1xuICAgIGNvbnN0IG51bVRhYmxlcyA9IG5ldyBVaW50MzJBcnJheShhd2FpdCBibG9iLnNsaWNlKDAsIDQpLmFycmF5QnVmZmVyKCkpWzBdO1xuXG4gICAgLy8gb3ZlcmFsbCBieXRlIG9mZnNldFxuICAgIGxldCBibyA9IDQ7XG4gICAgY29uc3Qgc2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICBhd2FpdCBibG9iLnNsaWNlKGJvLCBibyArPSBudW1UYWJsZXMgKiAxMikuYXJyYXlCdWZmZXIoKVxuICAgICk7XG5cbiAgICBjb25zdCB0QmxvYnM6IFRhYmxlQmxvYltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICBjb25zdCBzaSA9IGkgKiAzO1xuICAgICAgY29uc3QgbnVtUm93cyA9IHNpemVzW3NpXTtcbiAgICAgIGNvbnN0IGhTaXplID0gc2l6ZXNbc2kgKyAxXTtcbiAgICAgIHRCbG9ic1tpXSA9IHsgbnVtUm93cywgaGVhZGVyQmxvYjogYmxvYi5zbGljZShibywgYm8gKz0gaFNpemUpIH0gYXMgYW55O1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICB0QmxvYnNbaV0uZGF0YUJsb2IgPSBibG9iLnNsaWNlKGJvLCBibyArPSBzaXplc1tpICogMyArIDJdKTtcbiAgICB9O1xuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAoKHRiLCBpKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBJTiBCTE9CUyBGT1IgVD0ke2l9YCwgdGIpXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQmxvYih0Yik7XG4gICAgfSkpXG4gICAgY29uc3QgdGFibGVNYXAgPSBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuXG4gICAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykge1xuICAgICAgaWYgKCF0LnNjaGVtYS5qb2lucykgY29udGludWU7XG4gICAgICBmb3IgKGNvbnN0IFthVCwgYUYsIGFQXSBvZiB0LnNjaGVtYS5qb2lucykge1xuICAgICAgICBjb25zdCB0QSA9IHRhYmxlTWFwW2FUXTtcbiAgICAgICAgaWYgKCF0QSkgdGhyb3cgbmV3IEVycm9yKGAke3QubmFtZX0gam9pbnMgdW5kZWZpbmVkIHRhYmxlICR7YVR9YCk7XG4gICAgICAgIGlmICghdC5yb3dzLmxlbmd0aCkgY29udGludWU7IC8vIGVtcHR5IHRhYmxlIGkgZ3Vlc3M/XG4gICAgICAgIGZvciAoY29uc3QgciBvZiB0LnJvd3MpIHtcbiAgICAgICAgICBjb25zdCBpZEEgPSByW2FGXTtcbiAgICAgICAgICBpZiAoaWRBID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHJvdyBoYXMgYSBiYWQgaWQ/YCwgcik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgYSA9IHRBLm1hcC5nZXQoaWRBKTtcbiAgICAgICAgICBpZiAoYSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGByb3cgaGFzIGEgbWlzc2luZyBpZD9gLCBhLCBpZEEsIHIsIGAke2FUfVske2FGfV09JHthUH1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAoYVthUCA/PyB0Lm5hbWVdID8/PSBbXSkucHVzaChyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGVNYXA7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZnJvbUJsb2IgKHtcbiAgICBoZWFkZXJCbG9iLFxuICAgIGRhdGFCbG9iLFxuICAgIG51bVJvd3MsXG4gIH06IFRhYmxlQmxvYik6IFByb21pc2U8VGFibGU+IHtcbiAgICBjb25zdCBzY2hlbWEgPSBTY2hlbWEuZnJvbUJ1ZmZlcihhd2FpdCBoZWFkZXJCbG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIGxldCByYm8gPSAwO1xuICAgIGxldCBfX3Jvd0lkID0gMDtcbiAgICBjb25zdCByb3dzOiBSb3dbXSA9IFtdO1xuICAgIC8vIFRPRE8gLSBjb3VsZCBkZWZpbml0ZWx5IHVzZSBhIHN0cmVhbSBmb3IgdGhpc1xuICAgIGNvbnN0IGRhdGFCdWZmZXIgPSBhd2FpdCBkYXRhQmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUubG9nKGA9PT09PSBSRUFEICR7bnVtUm93c30gT0YgJHtzY2hlbWEubmFtZX0gPT09PT1gKVxuICAgIHdoaWxlIChfX3Jvd0lkIDwgbnVtUm93cykge1xuICAgICAgY29uc3QgW3JvdywgcmVhZF0gPSBzY2hlbWEucm93RnJvbUJ1ZmZlcihyYm8sIGRhdGFCdWZmZXIsIF9fcm93SWQrKyk7XG4gICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgIHJibyArPSByZWFkO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbiAgfVxuXG5cbiAgcHJpbnQgKFxuICAgIHdpZHRoOiBudW1iZXIgPSA4MCxcbiAgICBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPnxudWxsID0gbnVsbCxcbiAgICBuOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgbTogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIHA/OiAocjogYW55KSA9PiBib29sZWFuLFxuICApOiBudWxsfGFueVtdIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBwID8gdGhpcy5yb3dzLmZpbHRlcihwKSA6XG4gICAgICBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG5cbiAgICBsZXQgbUZpZWxkcyA9IEFycmF5LmZyb20oKGZpZWxkcyA/PyB0aGlzLnNjaGVtYS5maWVsZHMpKTtcbiAgICBpZiAocCkgW24sIG1dID0gWzAsIHJvd3MubGVuZ3RoXVxuICAgIGVsc2UgKG1GaWVsZHMgYXMgYW55KS51bnNoaWZ0KCdfX3Jvd0lkJyk7XG5cbiAgICBjb25zdCBbcFJvd3MsIHBGaWVsZHNdID0gZmllbGRzID9cbiAgICAgIFtyb3dzLm1hcCgocjogUm93KSA9PiB0aGlzLnNjaGVtYS5wcmludFJvdyhyLCBtRmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coJ3JvdyBmaWx0ZXI6JywgcCA/PyAnKG5vbmUpJylcbiAgICBjb25zb2xlLmxvZyhgKHZpZXcgcm93cyAke259IC0gJHttfSlgKTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zb2xlLnRhYmxlKHBSb3dzLCBwRmllbGRzKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcbiAgICByZXR1cm4gKHAgJiYgZmllbGRzKSA/XG4gICAgICByb3dzLm1hcChyID0+XG4gICAgICAgIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKS5maWx0ZXIoZSA9PiBlWzFdKSlcbiAgICAgICkgOlxuICAgICAgbnVsbDtcbiAgfVxuXG4gIGR1bXBSb3cgKGk6IG51bWJlcnxudWxsLCBzaG93RW1wdHkgPSBmYWxzZSwgdXNlQ1NTPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAvLyBUT0RPIFx1MjAxNCBpbiBicm93c2VyLCB1c2VDU1MgPT09IHRydWUgYnkgZGVmYXVsdFxuICAgIHVzZUNTUyA/Pz0gKGdsb2JhbFRoaXNbJ3dpbmRvdyddID09PSBnbG9iYWxUaGlzKTsgLy8gaWRrXG4gICAgaSA/Pz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5yb3dzLmxlbmd0aCk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5yb3dzW2ldO1xuICAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjc3M6IHN0cmluZ1tdfG51bGwgPSB1c2VDU1MgPyBbXSA6IG51bGw7XG4gICAgY29uc3QgZm10ID0gZm10U3R5bGVkLmJpbmQobnVsbCwgb3V0LCBjc3MpO1xuICAgIGNvbnN0IHAgPSBNYXRoLm1heChcbiAgICAgIC4uLnRoaXMuc2NoZW1hLmNvbHVtbnNcbiAgICAgIC5maWx0ZXIoYyA9PiBzaG93RW1wdHkgfHwgcm93W2MubmFtZV0pXG4gICAgICAubWFwKGMgPT4gYy5uYW1lLmxlbmd0aCArIDIpXG4gICAgKTtcbiAgICBpZiAoIXJvdylcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dIGRvZXMgbm90IGV4aXN0YCwgQ19OT1RfRk9VTkQpO1xuICAgIGVsc2Uge1xuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV1gLCBDX1JPV19IRUFEKTtcbiAgICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLnNjaGVtYS5jb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2MubmFtZV07XG4gICAgICAgIGNvbnN0IG4gPSBjLm5hbWUucGFkU3RhcnQocCwgJyAnKTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlY1RSVUVgLCBDX1RSVUUpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAlY0ZBTFNFYCwgQ19OT1RfRk9VTkQsIENfRkFMU0UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19OVU1CRVIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19TVFIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiBcdTIwMTRgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdiaWdpbnQnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYHtufTogJWMwICVjJHt2YWx1ZX0gKEJJRylgLCBDX0JJRywgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMCAoQklHKWAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh1c2VDU1MpIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpLCAuLi5jc3MhXTtcbiAgICBlbHNlIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpXTtcbiAgfVxuXG4gIGZpbmRSb3cgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuLCBzdGFydCA9IDApOiBudW1iZXIge1xuICAgIGNvbnN0IE4gPSB0aGlzLnJvd3MubGVuZ3RoXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBOIC0gc3RhcnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgTjsgaSsrKSBpZiAocHJlZGljYXRlKHRoaXMucm93c1tpXSkpIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICogZmlsdGVyUm93cyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4pOiBHZW5lcmF0b3I8Um93PiB7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSBpZiAocHJlZGljYXRlKHJvdykpIHlpZWxkIHJvdztcbiAgfVxuICAvKlxuICByYXdUb1JvdyAoZDogc3RyaW5nW10pOiBSb3cge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zY2hlbWEuY29sdW1ucy5tYXAociA9PiBbXG4gICAgICByLm5hbWUsXG4gICAgICByLnRvVmFsKGRbci5pbmRleF0pXG4gICAgXSkpO1xuICB9XG4gIHJhd1RvU3RyaW5nIChkOiBzdHJpbmdbXSwgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8vIGp1c3QgYXNzdW1lIGZpcnN0IHR3byBmaWVsZHMgYXJlIGFsd2F5cyBpZCwgbmFtZS4gZXZlbiBpZiB0aGF0J3Mgbm90IHRydWVcbiAgICAvLyB0aGlzIGlzIGp1c3QgZm9yIHZpc3VhbGl6YXRpb24gcHVycG9yc2VzXG4gICAgbGV0IGV4dHJhID0gJyc7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZSA9IHRoaXMucmF3VG9Sb3coZCk7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYXJncykge1xuICAgICAgICAvLyBkb24ndCByZXByaW50IG5hbWUgb3IgaWRcbiAgICAgICAgaWYgKGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1swXSB8fCBhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMV0pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChlW2FdICE9IG51bGwpXG4gICAgICAgICAgcy5wdXNoKGAke2F9OiAke0pTT04uc3RyaW5naWZ5KGVbYV0pfWApXG4gICAgICB9XG4gICAgICBleHRyYSA9IHMubGVuZ3RoID4gMCA/IGAgeyAke3Muam9pbignLCAnKX0gfWAgOiAne30nO1xuICAgIH1cbiAgICByZXR1cm4gYDwke3RoaXMuc2NoZW1hLm5hbWV9OiR7ZFswXSA/PyAnPyd9IFwiJHtkWzFdfVwiJHtleHRyYX0+YDtcbiAgfVxuICAqL1xufVxuXG5mdW5jdGlvbiBmbXRTdHlsZWQgKFxuICBvdXQ6IHN0cmluZ1tdLFxuICBjc3NPdXQ6IHN0cmluZ1tdIHwgbnVsbCxcbiAgbXNnOiBzdHJpbmcsXG4gIC4uLmNzczogc3RyaW5nW11cbikge1xuICBpZiAoY3NzT3V0KSB7XG4gICAgb3V0LnB1c2gobXNnICsgJyVjJylcbiAgICBjc3NPdXQucHVzaCguLi5jc3MsIENfUkVTRVQpO1xuICB9XG4gIGVsc2Ugb3V0LnB1c2gobXNnLnJlcGxhY2UoLyVjL2csICcnKSk7XG59XG5cbmNvbnN0IENfTk9UX0ZPVU5EID0gJ2NvbG9yOiAjODg4OyBmb250LXN0eWxlOiBpdGFsaWM7JztcbmNvbnN0IENfUk9XX0hFQUQgPSAnZm9udC13ZWlnaHQ6IGJvbGRlcic7XG5jb25zdCBDX0JPTEQgPSAnZm9udC13ZWlnaHQ6IGJvbGQnO1xuY29uc3QgQ19OVU1CRVIgPSAnY29sb3I6ICNBMDU1MTg7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1RSVUUgPSAnY29sb3I6ICM0QzM4QkU7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0ZBTFNFID0gJ2NvbG9yOiAjMzhCRTFDOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19TVFIgPSAnY29sb3I6ICMzMEFBNjI7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0JJRyA9ICdjb2xvcjogIzc4MjFBMzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfUkVTRVQgPSAnY29sb3I6IHVuc2V0OyBmb250LXN0eWxlOiB1bnNldDsgZm9udC13ZWlnaHQ6IHVuc2V0OyBiYWNrZ3JvdW5kLXVuc2V0J1xuIiwgImltcG9ydCB7IENPTFVNTiwgU2NoZW1hQXJncyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuZXhwb3J0IGNvbnN0IGNzdkRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4gPSB7XG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlVS5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXQnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoW1xuICAgICAgLy8gY29tYmluZWQgaW50byBhbiBhcnJheSBmaWVsZFxuICAgICAgJ2FybW9yMScsICdhcm1vcjInLCAnYXJtb3IzJywgJ2FybW9yNCcsICdlbmQnLFxuICAgICAgJ3dwbjEnLCAnd3BuMicsICd3cG4zJywgJ3dwbjQnLCAnd3BuNScsICd3cG42JywgJ3dwbjcnLFxuXG4gICAgICAvLyBhbGwgY29tYmluZWQgaW50byBvbmUgYXJyYXkgZmllbGRcbiAgICAgICdsaW5rMScsICdsaW5rMicsICdsaW5rMycsICdsaW5rNCcsICdsaW5rNScsICdsaW5rNicsXG4gICAgICAnbWFzazEnLCAnbWFzazInLCAnbWFzazMnLCAnbWFzazQnLCAnbWFzazUnLCAnbWFzazYnLFxuICAgICAgJ25icjEnLCAgJ25icjInLCAgJ25icjMnLCAgJ25icjQnLCAgJ25icjUnLCAgJ25icjYnLFxuICAgICAgJ3JhbmQxJywgJ3JhbmQyJywgJ3JhbmQzJywgJ3JhbmQ0JywgJ3JhbmQ1JywgJ3JhbmQ2JyxcblxuICAgICAgLy8gZGVwcmVjYXRlZFxuICAgICAgJ21vdW50ZWQnLFxuICAgICAgLy8gcmVkdW5kYW50XG4gICAgICAncmVhbmltYXRvcn4xJyxcbiAgICBdKSxcbiAgICBrbm93bkZpZWxkczoge1xuICAgICAgaWQ6IENPTFVNTi5VMTYsXG4gICAgICBuYW1lOiBDT0xVTU4uU1RSSU5HLFxuICAgICAgcnQ6IENPTFVNTi5VOCxcbiAgICAgIHJlY2xpbWl0OiBDT0xVTU4uSTgsXG4gICAgICBiYXNlY29zdDogQ09MVU1OLlUxNixcbiAgICAgIHJjb3N0OiBDT0xVTU4uSTgsXG4gICAgICBzaXplOiBDT0xVTU4uVTgsXG4gICAgICByZXNzaXplOiBDT0xVTU4uVTgsXG4gICAgICBocDogQ09MVU1OLlUxNixcbiAgICAgIHByb3Q6IENPTFVNTi5VOCxcbiAgICAgIG1yOiBDT0xVTU4uVTgsXG4gICAgICBtb3I6IENPTFVNTi5VOCxcbiAgICAgIHN0cjogQ09MVU1OLlU4LFxuICAgICAgYXR0OiBDT0xVTU4uVTgsXG4gICAgICBkZWY6IENPTFVNTi5VOCxcbiAgICAgIHByZWM6IENPTFVNTi5VOCxcbiAgICAgIGVuYzogQ09MVU1OLlU4LFxuICAgICAgbWFwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgYXA6IENPTFVNTi5VOCxcbiAgICAgIGFtYmlkZXh0cm91czogQ09MVU1OLlU4LFxuICAgICAgbW91bnRtbnI6IENPTFVNTi5VMTYsXG4gICAgICBza2lsbGVkcmlkZXI6IENPTFVNTi5VOCxcbiAgICAgIHJlaW52aWdvcmF0aW9uOiBDT0xVTU4uVTgsXG4gICAgICBsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHVuZGVhZGxlYWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgbWF4YWdlOiBDT0xVTU4uVTE2LFxuICAgICAgaGFuZDogQ09MVU1OLlU4LFxuICAgICAgaGVhZDogQ09MVU1OLlU4LFxuICAgICAgbWlzYzogQ09MVU1OLlU4LFxuICAgICAgcGF0aGNvc3Q6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0ZG9tOiBDT0xVTU4uVTgsXG4gICAgICBib251c3NwZWxsczogQ09MVU1OLlU4LFxuICAgICAgRjogQ09MVU1OLlU4LFxuICAgICAgQTogQ09MVU1OLlU4LFxuICAgICAgVzogQ09MVU1OLlU4LFxuICAgICAgRTogQ09MVU1OLlU4LFxuICAgICAgUzogQ09MVU1OLlU4LFxuICAgICAgRDogQ09MVU1OLlU4LFxuICAgICAgTjogQ09MVU1OLlU4LFxuICAgICAgRzogQ09MVU1OLlU4LFxuICAgICAgQjogQ09MVU1OLlU4LFxuICAgICAgSDogQ09MVU1OLlU4LFxuICAgICAgc2FpbGluZ3NoaXBzaXplOiBDT0xVTU4uVTE2LFxuICAgICAgc2FpbGluZ21heHVuaXRzaXplOiBDT0xVTU4uVTgsXG4gICAgICBzdGVhbHRoeTogQ09MVU1OLlU4LFxuICAgICAgcGF0aWVuY2U6IENPTFVNTi5VOCxcbiAgICAgIHNlZHVjZTogQ09MVU1OLlU4LFxuICAgICAgc3VjY3VidXM6IENPTFVNTi5VOCxcbiAgICAgIGNvcnJ1cHQ6IENPTFVNTi5VOCxcbiAgICAgIGhvbWVzaWNrOiBDT0xVTU4uVTgsXG4gICAgICBmb3JtYXRpb25maWdodGVyOiBDT0xVTU4uSTgsXG4gICAgICBzdGFuZGFyZDogQ09MVU1OLkk4LFxuICAgICAgaW5zcGlyYXRpb25hbDogQ09MVU1OLkk4LFxuICAgICAgdGFza21hc3RlcjogQ09MVU1OLlU4LFxuICAgICAgYmVhc3RtYXN0ZXI6IENPTFVNTi5VOCxcbiAgICAgIGJvZHlndWFyZDogQ09MVU1OLlU4LFxuICAgICAgd2F0ZXJicmVhdGhpbmc6IENPTFVNTi5VMTYsXG4gICAgICBpY2Vwcm90OiBDT0xVTU4uVTgsXG4gICAgICBpbnZ1bG5lcmFibGU6IENPTFVNTi5VOCxcbiAgICAgIHNob2NrcmVzOiBDT0xVTU4uSTgsXG4gICAgICBmaXJlcmVzOiBDT0xVTU4uSTgsXG4gICAgICBjb2xkcmVzOiBDT0xVTU4uSTgsXG4gICAgICBwb2lzb25yZXM6IENPTFVNTi5VOCxcbiAgICAgIGFjaWRyZXM6IENPTFVNTi5JOCxcbiAgICAgIHZvaWRzYW5pdHk6IENPTFVNTi5VOCxcbiAgICAgIGRhcmt2aXNpb246IENPTFVNTi5VOCxcbiAgICAgIGFuaW1hbGF3ZTogQ09MVU1OLlU4LFxuICAgICAgYXdlOiBDT0xVTU4uVTgsXG4gICAgICBoYWx0aGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZmVhcjogQ09MVU1OLlU4LFxuICAgICAgYmVyc2VyazogQ09MVU1OLlU4LFxuICAgICAgY29sZDogQ09MVU1OLlU4LFxuICAgICAgaGVhdDogQ09MVU1OLlU4LFxuICAgICAgZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgYmFuZWZpcmVzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGRhbWFnZXJldjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uY2xvdWQ6IENPTFVNTi5VOCxcbiAgICAgIGRpc2Vhc2VjbG91ZDogQ09MVU1OLlU4LFxuICAgICAgc2xpbWVyOiBDT0xVTU4uVTgsXG4gICAgICBtaW5kc2xpbWU6IENPTFVNTi5VMTYsXG4gICAgICByZWdlbmVyYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIHBvaXNvbmFybW9yOiBDT0xVTU4uVTgsXG4gICAgICBleWVsb3NzOiBDT0xVTU4uVTgsXG4gICAgICBldGh0cnVlOiBDT0xVTU4uVTgsXG4gICAgICBzdG9ybXBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGNvbGRwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgZGFya3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY3Bvd2VyOiBDT0xVTU4uVTgsXG4gICAgICB3aW50ZXJwb3dlcjogQ09MVU1OLlU4LFxuICAgICAgc3ByaW5ncG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1lcnBvd2VyOiBDT0xVTU4uVTgsXG4gICAgICBmYWxscG93ZXI6IENPTFVNTi5VOCxcbiAgICAgIGZvcmdlYm9udXM6IENPTFVNTi5VOCxcbiAgICAgIGZpeGZvcmdlYm9udXM6IENPTFVNTi5JOCxcbiAgICAgIG1hc3RlcnNtaXRoOiBDT0xVTU4uSTgsXG4gICAgICByZXNvdXJjZXM6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9oZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIGF1dG9kaXNoZWFsZXI6IENPTFVNTi5VOCxcbiAgICAgIG5vYmFkZXZlbnRzOiBDT0xVTU4uVTgsXG4gICAgICBpbnNhbmU6IENPTFVNTi5VOCxcbiAgICAgIHNoYXR0ZXJlZHNvdWw6IENPTFVNTi5VOCxcbiAgICAgIGxlcGVyOiBDT0xVTU4uVTgsXG4gICAgICBjaGFvc3JlYzogQ09MVU1OLlU4LFxuICAgICAgcGlsbGFnZWJvbnVzOiBDT0xVTU4uVTgsXG4gICAgICBwYXRyb2xib251czogQ09MVU1OLkk4LFxuICAgICAgY2FzdGxlZGVmOiBDT0xVTU4uVTgsXG4gICAgICBzaWVnZWJvbnVzOiBDT0xVTU4uSTE2LFxuICAgICAgaW5jcHJvdmRlZjogQ09MVU1OLlU4LFxuICAgICAgc3VwcGx5Ym9udXM6IENPTFVNTi5VOCxcbiAgICAgIGluY3VucmVzdDogQ09MVU1OLkkxNixcbiAgICAgIHBvcGtpbGw6IENPTFVNTi5VMTYsXG4gICAgICByZXNlYXJjaGJvbnVzOiBDT0xVTU4uSTgsXG4gICAgICBpbnNwaXJpbmdyZXM6IENPTFVNTi5JOCxcbiAgICAgIGRvdXNlOiBDT0xVTU4uVTgsXG4gICAgICBhZGVwdHNhY3I6IENPTFVNTi5VOCxcbiAgICAgIGNyb3NzYnJlZWRlcjogQ09MVU1OLlU4LFxuICAgICAgbWFrZXBlYXJsczogQ09MVU1OLlU4LFxuICAgICAgdm9pZHN1bTogQ09MVU1OLlU4LFxuICAgICAgaGVyZXRpYzogQ09MVU1OLlU4LFxuICAgICAgZWxlZ2lzdDogQ09MVU1OLlU4LFxuICAgICAgc2hhcGVjaGFuZ2U6IENPTFVNTi5VMTYsXG4gICAgICBmaXJzdHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgc2Vjb25kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBsYW5kc2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICB3YXRlcnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgZm9yZXN0c2hhcGU6IENPTFVNTi5VMTYsXG4gICAgICBwbGFpbnNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgeHBzaGFwZTogQ09MVU1OLlU4LFxuICAgICAgbmFtZXR5cGU6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjogQ09MVU1OLkkxNixcbiAgICAgIG5fc3VtbW9uOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTE6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTI6IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkb21zdW1tb24yOiBDT0xVTU4uVTE2LFxuICAgICAgZG9tc3VtbW9uMjA6IENPTFVNTi5JMTYsXG4gICAgICBibG9vZHZlbmdlYW5jZTogQ09MVU1OLlU4LFxuICAgICAgYnJpbmdlcm9mZm9ydHVuZTogQ09MVU1OLkk4LFxuICAgICAgcmVhbG0xOiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTM6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTQ6IENPTFVNTi5VMTYsXG4gICAgICBiYXRzdGFydHN1bTFkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtMmQ2OiBDT0xVTU4uVTE2LFxuICAgICAgYmF0c3RhcnRzdW0zZDY6IENPTFVNTi5JMTYsXG4gICAgICBiYXRzdGFydHN1bTRkNjogQ09MVU1OLlUxNixcbiAgICAgIGJhdHN0YXJ0c3VtNWQ2OiBDT0xVTU4uVTgsXG4gICAgICBiYXRzdGFydHN1bTZkNjogQ09MVU1OLlUxNixcbiAgICAgIHR1cm1vaWxzdW1tb246IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aGZpcmU6IENPTFVNTi5VOCxcbiAgICAgIHV3cmVnZW46IENPTFVNTi5VOCxcbiAgICAgIHNocmlua2hwOiBDT0xVTU4uVTgsXG4gICAgICBncm93aHA6IENPTFVNTi5VOCxcbiAgICAgIHN0YXJ0aW5nYWZmOiBDT0xVTU4uVTMyLFxuICAgICAgZml4ZWRyZXNlYXJjaDogQ09MVU1OLlU4LFxuICAgICAgbGFtaWFsb3JkOiBDT0xVTU4uVTgsXG4gICAgICBwcmVhbmltYXRvcjogQ09MVU1OLlU4LFxuICAgICAgZHJlYW5pbWF0b3I6IENPTFVNTi5VOCxcbiAgICAgIG11bW1pZnk6IENPTFVNTi5VMTYsXG4gICAgICBvbmViYXR0bGVzcGVsbDogQ09MVU1OLlU4LFxuICAgICAgZmlyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIGFpcmF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIHdhdGVyYXR0dW5lZDogQ09MVU1OLlU4LFxuICAgICAgZWFydGhhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBhc3RyYWxhdHR1bmVkOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aGF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG5hdHVyZWF0dHVuZWQ6IENPTFVNTi5VOCxcbiAgICAgIG1hZ2ljYm9vc3RGOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QTogQ09MVU1OLkk4LFxuICAgICAgbWFnaWNib29zdFc6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3RFOiBDT0xVTU4uSTgsXG4gICAgICBtYWdpY2Jvb3N0UzogQ09MVU1OLlU4LFxuICAgICAgbWFnaWNib29zdEQ6IENPTFVNTi5JOCxcbiAgICAgIG1hZ2ljYm9vc3ROOiBDT0xVTU4uVTgsXG4gICAgICBtYWdpY2Jvb3N0QUxMOiBDT0xVTU4uSTgsXG4gICAgICBleWVzOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VlYXRlcjogQ09MVU1OLlU4LFxuICAgICAgcG9pc29uc2tpbjogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRpdGVtOiBDT0xVTU4uVTgsXG4gICAgICBiYXR0bGVzdW01OiBDT0xVTU4uVTE2LFxuICAgICAgYWNpZHNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgcHJvcGhldHNoYXBlOiBDT0xVTU4uVTE2LFxuICAgICAgaG9ycm9yOiBDT0xVTU4uVTgsXG4gICAgICBsYXRlaGVybzogQ09MVU1OLlU4LFxuICAgICAgdXdkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIGxhbmRkYW1hZ2U6IENPTFVNTi5VOCxcbiAgICAgIHJwY29zdDogQ09MVU1OLlUzMixcbiAgICAgIHJhbmQ1OiBDT0xVTU4uVTgsXG4gICAgICBuYnI1OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNTogQ09MVU1OLlUxNixcbiAgICAgIHJhbmQ2OiBDT0xVTU4uVTgsXG4gICAgICBuYnI2OiBDT0xVTU4uVTgsXG4gICAgICBtYXNrNjogQ09MVU1OLlUxNixcbiAgICAgIG11bW1pZmljYXRpb246IENPTFVNTi5VMTYsXG4gICAgICBkaXNlYXNlcmVzOiBDT0xVTU4uVTgsXG4gICAgICByYWlzZW9ua2lsbDogQ09MVU1OLlU4LFxuICAgICAgcmFpc2VzaGFwZTogQ09MVU1OLlUxNixcbiAgICAgIHNlbmRsZXNzZXJob3Jyb3JtdWx0OiBDT0xVTU4uVTgsXG4gICAgICBpbmNvcnBvcmF0ZTogQ09MVU1OLlU4LFxuICAgICAgYmxlc3NiZXJzOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWF0dGFja2VyOiBDT0xVTU4uVTgsXG4gICAgICB1d2hlYXQ6IENPTFVNTi5VOCxcbiAgICAgIHNsb3RocmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcmRlc2VydGVyOiBDT0xVTU4uVTgsXG4gICAgICBzb3JjZXJ5cmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIG9sZGVyOiBDT0xVTU4uSTgsXG4gICAgICBkaXNiZWxpZXZlOiBDT0xVTU4uVTgsXG4gICAgICBmaXJlcmFuZ2U6IENPTFVNTi5VOCxcbiAgICAgIGFzdHJhbHJhbmdlOiBDT0xVTU4uVTgsXG4gICAgICBuYXR1cmVyYW5nZTogQ09MVU1OLlU4LFxuICAgICAgYmVhcnRhdHRvbzogQ09MVU1OLlU4LFxuICAgICAgaG9yc2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHJlaW5jYXJuYXRpb246IENPTFVNTi5VOCxcbiAgICAgIHdvbGZ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGJvYXJ0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIHNsZWVwYXVyYTogQ09MVU1OLlU4LFxuICAgICAgc25ha2V0YXR0b286IENPTFVNTi5VOCxcbiAgICAgIGFwcGV0aXRlOiBDT0xVTU4uSTgsXG4gICAgICB0ZW1wbGV0cmFpbmVyOiBDT0xVTU4uVTgsXG4gICAgICBpbmZlcm5vcmV0OiBDT0xVTU4uVTgsXG4gICAgICBrb2t5dG9zcmV0OiBDT0xVTU4uVTgsXG4gICAgICBhZGRyYW5kb21hZ2U6IENPTFVNTi5VMTYsXG4gICAgICB1bnN1cnI6IENPTFVNTi5VOCxcbiAgICAgIHNwZWNpYWxsb29rOiBDT0xVTU4uVTgsXG4gICAgICBidWdyZWZvcm06IENPTFVNTi5VOCxcbiAgICAgIG9uaXN1bW1vbjogQ09MVU1OLlU4LFxuICAgICAgc3VuYXdlOiBDT0xVTU4uVTgsXG4gICAgICBzdGFydGFmZjogQ09MVU1OLlU4LFxuICAgICAgaXZ5bG9yZDogQ09MVU1OLlU4LFxuICAgICAgdHJpcGxlZ29kOiBDT0xVTU4uVTgsXG4gICAgICB0cmlwbGVnb2RtYWc6IENPTFVNTi5VOCxcbiAgICAgIGZvcnRraWxsOiBDT0xVTU4uVTgsXG4gICAgICB0aHJvbmVraWxsOiBDT0xVTU4uVTgsXG4gICAgICBkaWdlc3Q6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwbW92ZTogQ09MVU1OLlU4LFxuICAgICAgZW50YW5nbGU6IENPTFVNTi5VOCxcbiAgICAgIGFsY2hlbXk6IENPTFVNTi5VOCxcbiAgICAgIHdvdW5kZmVuZDogQ09MVU1OLlU4LFxuICAgICAgZmFsc2Vhcm15OiBDT0xVTU4uSTgsXG4gICAgICBzdW1tb241OiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXI6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHBhcmFseXplOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2Vjb25zdHJ1Y3Q6IENPTFVNTi5VOCxcbiAgICAgIGd1YXJkaWFuc3Bpcml0bW9kaWZpZXI6IENPTFVNTi5JOCxcbiAgICAgIGljZWZvcmdpbmc6IENPTFVNTi5VOCxcbiAgICAgIGNsb2Nrd29ya2xvcmQ6IENPTFVNTi5VOCxcbiAgICAgIG1pbnNpemVsZWFkZXI6IENPTFVNTi5VOCxcbiAgICAgIGlyb252dWw6IENPTFVNTi5VOCxcbiAgICAgIGhlYXRoZW5zdW1tb246IENPTFVNTi5VOCxcbiAgICAgIHBvd2Vyb2ZkZWF0aDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtdGltZTogQ09MVU1OLkk4LFxuICAgICAgdHdpY2Vib3JuOiBDT0xVTU4uVTE2LFxuICAgICAgdG1wYXN0cmFsZ2VtczogQ09MVU1OLlU4LFxuICAgICAgc3RhcnRoZXJvYWI6IENPTFVNTi5VOCxcbiAgICAgIHV3ZmlyZXNoaWVsZDogQ09MVU1OLlU4LFxuICAgICAgc2FsdHZ1bDogQ09MVU1OLlU4LFxuICAgICAgbGFuZGVuYzogQ09MVU1OLlU4LFxuICAgICAgcGxhZ3VlZG9jdG9yOiBDT0xVTU4uVTgsXG4gICAgICBjdXJzZWx1Y2tzaGllbGQ6IENPTFVNTi5VOCxcbiAgICAgIGZhcnRocm9uZWtpbGw6IENPTFVNTi5VOCxcbiAgICAgIGhvcnJvcm1hcms6IENPTFVNTi5VOCxcbiAgICAgIGFsbHJldDogQ09MVU1OLlU4LFxuICAgICAgYWNpZGRpZ2VzdDogQ09MVU1OLlU4LFxuICAgICAgYmVja29uOiBDT0xVTU4uVTgsXG4gICAgICBzbGF2ZXJib251czogQ09MVU1OLlU4LFxuICAgICAgY2FyY2Fzc2NvbGxlY3RvcjogQ09MVU1OLlU4LFxuICAgICAgbWluZGNvbGxhcjogQ09MVU1OLlU4LFxuICAgICAgbW91bnRhaW5yZWM6IENPTFVNTi5VOCxcbiAgICAgIGluZGVwc3BlbGxzOiBDT0xVTU4uVTgsXG4gICAgICBlbmNocmViYXRlNTA6IENPTFVNTi5VOCxcbiAgICAgIHN1bW1vbjE6IENPTFVNTi5VMTYsXG4gICAgICByYW5kb21zcGVsbDogQ09MVU1OLlU4LFxuICAgICAgaW5zYW5pZnk6IENPTFVNTi5VOCxcbiAgICAgIC8vanVzdCBhIGNvcHkgb2YgcmVhbmltYXRvci4uLlxuICAgICAgLy8ncmVhbmltYXRvcn4xJzogQ09MVU1OLlU4LFxuICAgICAgZGVmZWN0b3I6IENPTFVNTi5VOCxcbiAgICAgIGJhdHN0YXJ0c3VtMWQzOiBDT0xVTU4uVTE2LFxuICAgICAgZW5jaHJlYmF0ZTEwOiBDT0xVTU4uVTgsXG4gICAgICB1bmR5aW5nOiBDT0xVTU4uVTgsXG4gICAgICBtb3JhbGVib251czogQ09MVU1OLlU4LFxuICAgICAgdW5jdXJhYmxlYWZmbGljdGlvbjogQ09MVU1OLlUzMixcbiAgICAgIHdpbnRlcnN1bW1vbjFkMzogQ09MVU1OLlUxNixcbiAgICAgIHN0eWdpYW5ndWlkZTogQ09MVU1OLlU4LFxuICAgICAgc21hcnRtb3VudDogQ09MVU1OLlU4LFxuICAgICAgcmVmb3JtaW5nZmxlc2g6IENPTFVNTi5VOCxcbiAgICAgIGZlYXJvZnRoZWZsb29kOiBDT0xVTU4uVTgsXG4gICAgICBjb3Jwc2VzdGl0Y2hlcjogQ09MVU1OLlU4LFxuICAgICAgcmVjb25zdHJ1Y3Rpb246IENPTFVNTi5VOCxcbiAgICAgIG5vZnJpZGVyczogQ09MVU1OLlU4LFxuICAgICAgY29yaWRlcm1ucjogQ09MVU1OLlUxNixcbiAgICAgIGhvbHljb3N0OiBDT0xVTU4uVTgsXG4gICAgICBhbmltYXRlbW5yOiBDT0xVTU4uVTE2LFxuICAgICAgbGljaDogQ09MVU1OLlUxNixcbiAgICAgIGVyYXN0YXJ0YWdlaW5jcmVhc2U6IENPTFVNTi5VMTYsXG4gICAgICBtb3Jlb3JkZXI6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVncm93dGg6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVwcm9kOiBDT0xVTU4uSTgsXG4gICAgICBtb3JlaGVhdDogQ09MVU1OLkk4LFxuICAgICAgbW9yZWx1Y2s6IENPTFVNTi5JOCxcbiAgICAgIG1vcmVtYWdpYzogQ09MVU1OLkk4LFxuICAgICAgbm9mbW91bnRzOiBDT0xVTU4uVTgsXG4gICAgICBmYWxzZWRhbWFnZXJlY292ZXJ5OiBDT0xVTU4uVTgsXG4gICAgICB1d3BhdGhib29zdDogQ09MVU1OLkk4LFxuICAgICAgcmFuZG9taXRlbXM6IENPTFVNTi5VMTYsXG4gICAgICBkZWF0aHNsaW1lZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZGVhdGhwb2lzb25leHBsOiBDT0xVTU4uVTgsXG4gICAgICBkZWF0aHNob2NrZXhwbDogQ09MVU1OLlU4LFxuICAgICAgZHJhd3NpemU6IENPTFVNTi5JOCxcbiAgICAgIHBldHJpZmljYXRpb25pbW11bmU6IENPTFVNTi5VOCxcbiAgICAgIHNjYXJzb3VsczogQ09MVU1OLlU4LFxuICAgICAgc3Bpa2ViYXJiczogQ09MVU1OLlU4LFxuICAgICAgcHJldGVuZGVyc3RhcnRzaXRlOiBDT0xVTU4uVTE2LFxuICAgICAgb2Zmc2NyaXB0cmVzZWFyY2g6IENPTFVNTi5VOCxcbiAgICAgIHVubW91bnRlZHNwcjogQ09MVU1OLlUzMixcbiAgICAgIGV4aGF1c3Rpb246IENPTFVNTi5VOCxcbiAgICAgIC8vIG1vdW50ZWQ6IENPTFVNTi5CT09MLCAvLyBkZXByZWNhdGVkXG4gICAgICBib3c6IENPTFVNTi5CT09MLFxuICAgICAgYm9keTogQ09MVU1OLkJPT0wsXG4gICAgICBmb290OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNyb3dub25seTogQ09MVU1OLkJPT0wsXG4gICAgICBob2x5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGlucXVpc2l0b3I6IENPTFVNTi5CT09MLFxuICAgICAgaW5hbmltYXRlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICBkZW1vbjogQ09MVU1OLkJPT0wsXG4gICAgICBtYWdpY2JlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN0b25lYmVpbmc6IENPTFVNTi5CT09MLFxuICAgICAgYW5pbWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbGRibG9vZDogQ09MVU1OLkJPT0wsXG4gICAgICBmZW1hbGU6IENPTFVNTi5CT09MLFxuICAgICAgZm9yZXN0c3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRhaW5zdXJ2aXZhbDogQ09MVU1OLkJPT0wsXG4gICAgICB3YXN0ZXN1cnZpdmFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIHN3YW1wc3Vydml2YWw6IENPTFVNTi5CT09MLFxuICAgICAgYXF1YXRpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhbXBoaWJpYW46IENPTFVNTi5CT09MLFxuICAgICAgcG9vcmFtcGhpYmlhbjogQ09MVU1OLkJPT0wsXG4gICAgICBmbG9hdDogQ09MVU1OLkJPT0wsXG4gICAgICBmbHlpbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3Rvcm1pbW11bmU6IENPTFVNTi5CT09MLFxuICAgICAgdGVsZXBvcnQ6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb2JpbGU6IENPTFVNTi5CT09MLFxuICAgICAgbm9yaXZlcnBhc3M6IENPTFVNTi5CT09MLFxuICAgICAgaWxsdXNpb246IENPTFVNTi5CT09MLFxuICAgICAgc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGFzc2Fzc2luOiBDT0xVTU4uQk9PTCxcbiAgICAgIGhlYWw6IENPTFVNTi5CT09MLFxuICAgICAgaW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgZG9taW1tb3J0YWw6IENPTFVNTi5CT09MLFxuICAgICAgbm9oZWFsOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5lZWRub3RlYXQ6IENPTFVNTi5CT09MLFxuICAgICAgdW5kaXNjaXBsaW5lZDogQ09MVU1OLkJPT0wsXG4gICAgICBzbGF2ZTogQ09MVU1OLkJPT0wsXG4gICAgICBzbGFzaHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBibHVudHJlczogQ09MVU1OLkJPT0wsXG4gICAgICBwaWVyY2VyZXM6IENPTFVNTi5CT09MLFxuICAgICAgYmxpbmQ6IENPTFVNTi5CT09MLFxuICAgICAgcGV0cmlmeTogQ09MVU1OLkJPT0wsXG4gICAgICBldGhlcmVhbDogQ09MVU1OLkJPT0wsXG4gICAgICBkZWF0aGN1cnNlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRyYW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgdHJhbXBzd2FsbG93OiBDT0xVTU4uQk9PTCxcbiAgICAgIHRheGNvbGxlY3RvcjogQ09MVU1OLkJPT0wsXG4gICAgICBkcmFpbmltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICB1bmlxdWU6IENPTFVNTi5CT09MLFxuICAgICAgc2NhbGV3YWxsczogQ09MVU1OLkJPT0wsXG4gICAgICBkaXZpbmVpbnM6IENPTFVNTi5CT09MLFxuICAgICAgaGVhdHJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBjb2xkcmVjOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGNoYW9zOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwcmVhZGRlYXRoOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJ1ZzogQ09MVU1OLkJPT0wsXG4gICAgICB1d2J1ZzogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRvcmRlcjogQ09MVU1OLkJPT0wsXG4gICAgICBzcHJlYWRncm93dGg6IENPTFVNTi5CT09MLFxuICAgICAgc3ByZWFkZG9tOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRyYWtlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRoZWZ0b2Z0aGVzdW5hd2U6IENPTFVNTi5CT09MLFxuICAgICAgZHJhZ29ubG9yZDogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5kdmVzc2VsOiBDT0xVTU4uQk9PTCxcbiAgICAgIGVsZW1lbnRyYW5nZTogQ09MVU1OLkJPT0wsXG4gICAgICBhc3RyYWxmZXR0ZXJzOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNvbWJhdGNhc3RlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXNpbmdsZXJlYzogQ09MVU1OLkJPT0wsXG4gICAgICBub3dpc2g6IENPTFVNTi5CT09MLFxuICAgICAgbWFzb246IENPTFVNTi5CT09MLFxuICAgICAgc3Bpcml0c2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgb3duYmxvb2Q6IENPTFVNTi5CT09MLFxuICAgICAgaW52aXNpYmxlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwZWxsc2luZ2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1hZ2ljc3R1ZHk6IENPTFVNTi5CT09MLFxuICAgICAgdW5pZnk6IENPTFVNTi5CT09MLFxuICAgICAgdHJpcGxlM21vbjogQ09MVU1OLkJPT0wsXG4gICAgICB5ZWFydHVybjogQ09MVU1OLkJPT0wsXG4gICAgICB1bnRlbGVwb3J0YWJsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZWFuaW1wcmllc3Q6IENPTFVNTi5CT09MLFxuICAgICAgc3R1bmltbXVuaXR5OiBDT0xVTU4uQk9PTCxcbiAgICAgIHNpbmdsZWJhdHRsZTogQ09MVU1OLkJPT0wsXG4gICAgICByZXNlYXJjaHdpdGhvdXRtYWdpYzogQ09MVU1OLkJPT0wsXG4gICAgICBhdXRvY29tcGV0ZTogQ09MVU1OLkJPT0wsXG4gICAgICBhZHZlbnR1cmVyczogQ09MVU1OLkJPT0wsXG4gICAgICBjbGVhbnNoYXBlOiBDT0xVTU4uQk9PTCxcbiAgICAgIHJlcWxhYjogQ09MVU1OLkJPT0wsXG4gICAgICByZXF0ZW1wbGU6IENPTFVNTi5CT09MLFxuICAgICAgaG9ycm9ybWFya2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGlzYXNoYWg6IENPTFVNTi5CT09MLFxuICAgICAgaXNheWF6YWQ6IENPTFVNTi5CT09MLFxuICAgICAgaXNhZGFldmE6IENPTFVNTi5CT09MLFxuICAgICAgYmxlc3NmbHk6IENPTFVNTi5CT09MLFxuICAgICAgcGxhbnQ6IENPTFVNTi5CT09MLFxuICAgICAgY29tc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgc25vd21vdmU6IENPTFVNTi5CT09MLFxuICAgICAgc3dpbW1pbmc6IENPTFVNTi5CT09MLFxuICAgICAgc3R1cGlkOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNraXJtaXNoZXI6IENPTFVNTi5CT09MLFxuICAgICAgdW5zZWVuOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vbW92ZXBlbjogQ09MVU1OLkJPT0wsXG4gICAgICB3b2xmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGR1bmdlb246IENPTFVNTi5CT09MLFxuICAgICAgYWJvbGV0aDogQ09MVU1OLkJPT0wsXG4gICAgICBsb2NhbHN1bjogQ09MVU1OLkJPT0wsXG4gICAgICB0bXBmaXJlZ2VtczogQ09MVU1OLkJPT0wsXG4gICAgICBkZWZpbGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIG1vdW50ZWRiZXNlcms6IENPTFVNTi5CT09MLFxuICAgICAgbGFuY2VvazogQ09MVU1OLkJPT0wsXG4gICAgICBtaW5wcmlzb246IENPTFVNTi5CT09MLFxuICAgICAgaHBvdmVyZmxvdzogQ09MVU1OLkJPT0wsXG4gICAgICBpbmRlcHN0YXk6IENPTFVNTi5CT09MLFxuICAgICAgcG9seWltbXVuZTogQ09MVU1OLkJPT0wsXG4gICAgICBub3JhbmdlOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vaG9mOiBDT0xVTU4uQk9PTCxcbiAgICAgIGF1dG9ibGVzc2VkOiBDT0xVTU4uQk9PTCxcbiAgICAgIGFsbW9zdHVuZGVhZDogQ09MVU1OLkJPT0wsXG4gICAgICB0cnVlc2lnaHQ6IENPTFVNTi5CT09MLFxuICAgICAgbW9iaWxlYXJjaGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHNwaXJpdGZvcm06IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzc2xhdmU6IENPTFVNTi5CT09MLFxuICAgICAgY2hvcnVzbWFzdGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHRpZ2h0cmVpbjogQ09MVU1OLkJPT0wsXG4gICAgICBnbGFtb3VybWFuOiBDT0xVTU4uQk9PTCxcbiAgICAgIGRpdmluZWJlaW5nOiBDT0xVTU4uQk9PTCxcbiAgICAgIG5vZmFsbGRtZzogQ09MVU1OLkJPT0wsXG4gICAgICBmaXJlZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBhaXJlbXBvd2VyOiBDT0xVTU4uQk9PTCxcbiAgICAgIHdhdGVyZW1wb3dlcjogQ09MVU1OLkJPT0wsXG4gICAgICBlYXJ0aGVtcG93ZXI6IENPTFVNTi5CT09MLFxuICAgICAgcG9wc3B5OiBDT0xVTU4uQk9PTCxcbiAgICAgIGNhcGl0YWxob21lOiBDT0xVTU4uQk9PTCxcbiAgICAgIGNsdW1zeTogQ09MVU1OLkJPT0wsXG4gICAgICByZWdhaW5tb3VudDogQ09MVU1OLkJPT0wsXG4gICAgICBub2JhcmRpbmc6IENPTFVNTi5CT09MLFxuICAgICAgbW91bnRpc2NvbTogQ09MVU1OLkJPT0wsXG4gICAgICBub3Rocm93b2ZmOiBDT0xVTU4uQk9PTCxcbiAgICAgIGJpcmQ6IENPTFVNTi5CT09MLFxuICAgICAgZGVjYXlyZXM6IENPTFVNTi5CT09MLFxuICAgICAgY3VibW90aGVyOiBDT0xVTU4uQk9PTCxcbiAgICAgIGdsYW1vdXI6IENPTFVNTi5CT09MLFxuICAgICAgZ2VtcHJvZDogQ09MVU1OLlNUUklORyxcbiAgICAgIGZpeGVkbmFtZTogQ09MVU1OLlNUUklORyxcbiAgICB9LFxuICAgIGV4dHJhRmllbGRzOiB7XG4gICAgICB0eXBlOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBzZEluZGV4ID0gYXJncy5yYXdGaWVsZHNbJ3N0YXJ0ZG9tJ107XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ3R5cGUnLFxuICAgICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICAgICAgd2lkdGg6IDIsXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkge1xuICAgICAgICAgICAgLy8gaGF2ZSB0byBmaWxsIGluIG1vcmUgc3R1ZmYgbGF0ZXIsIHdoZW4gd2Ugam9pbiByZWMgdHlwZXMsIG9oIHdlbGxcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzOiBjb21tYW5kZXIsIG1lcmNlbmFyeSwgaGVybywgZXRjXG4gICAgICAgICAgICBpZiAodVtzZEluZGV4XSkgcmV0dXJuIDM7IC8vIGdvZCArIGNvbW1hbmRlclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gMDsgLy8ganVzdCBhIHVuaXRcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIGFybW9yOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuICAgICAgICBjb25zdCBpbmRpY2VzID0gT2JqZWN0LmVudHJpZXMoYXJncy5yYXdGaWVsZHMpXG4gICAgICAgICAgLmZpbHRlcihlID0+IGVbMF0ubWF0Y2goL15hcm1vclxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgbmFtZTogJ2FybW9yJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGFybW9yczogbnVtYmVyW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaSBvZiBpbmRpY2VzKSB7XG5cbiAgICAgICAgICAgICAgaWYgKHVbaV0pIGFybW9ycy5wdXNoKE51bWJlcih1W2ldKSk7XG4gICAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJtb3JzO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHdlYXBvbnM6IChpbmRleDogbnVtYmVyLCBhcmdzOiBTY2hlbWFBcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZGljZXMgPSBPYmplY3QuZW50cmllcyhhcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgICAuZmlsdGVyKGUgPT4gZVswXS5tYXRjaCgvXndwblxcZCQvKSlcbiAgICAgICAgICAubWFwKChlKSA9PiBlWzFdKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICd3ZWFwb25zJyxcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTE2X0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHdwbnM6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXG4gICAgICAgICAgICAgIGlmICh1W2ldKSB3cG5zLnB1c2goTnVtYmVyKHVbaV0pKTtcbiAgICAgICAgICAgICAgZWxzZSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cG5zO1xuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgICcmY3VzdG9tbWFnaWMnOiAoaW5kZXg6IG51bWJlciwgYXJnczogU2NoZW1hQXJncykgPT4ge1xuXG4gICAgICAgIGNvbnN0IENNX0tFWVMgPSBbMSwyLDMsNCw1LDZdLm1hcChuID0+XG4gICAgICAgICAgYHJhbmQgbmJyIG1hc2tgLnNwbGl0KCcgJykubWFwKGsgPT4gYXJncy5yYXdGaWVsZHNbYCR7a30ke259YF0pXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKHsgQ01fS0VZUyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICcmY3VzdG9tbWFnaWMnLCAvLyBQQUNLRUQgVVBcbiAgICAgICAgICB0eXBlOiBDT0xVTU4uVTMyX0FSUkFZLFxuICAgICAgICAgIHdpZHRoOiAyLFxuICAgICAgICAgIG92ZXJyaWRlKHYsIHUsIGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtOiBudW1iZXJbXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBLIG9mIENNX0tFWVMpIHtcbiAgICAgICAgICAgICAgY29uc3QgW3JhbmQsIG5iciwgbWFza10gPSBLLm1hcChpID0+IHVbaV0pO1xuICAgICAgICAgICAgICBpZiAoIXJhbmQpIGJyZWFrO1xuICAgICAgICAgICAgICBpZiAobmJyID4gNjMpIHRocm93IG5ldyBFcnJvcignZmZzLi4uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGIgPSBtYXNrID4+IDc7XG4gICAgICAgICAgICAgIGNvbnN0IG4gPSBuYnIgPDwgMTA7XG4gICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5kIDw8IDE2O1xuICAgICAgICAgICAgICBjbS5wdXNoKHIgfCBuIHwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY207XG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiB7XG4gICAgICAgIHJldHVybiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ2l0ZW1jb3N0MX4xJywgJ3dhcm5pbmd+MSddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAga2V5OiAnaWQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2RvbWNvbmZsaWN0fjEnLCdlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGtleTogJ2JpdF92YWx1ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBrZXk6ICdpZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGtleTogJ251bWJlcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gcmVtb3ZlZCBhZnRlciBqb2luVGFibGVzXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gbmVlZCB0byBqb2luXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfaW5mby5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnU3BlbGxFZmZlY3RJbmZvJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAvKlxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2Jzoge1xuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgbmFtZTogJ0VmZmVjdFNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICovXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RXZWFwb24nLFxuICAgIGtleTogJ3JlY29yZF9pZCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZW5jaGFudG1lbnRzLmNzdic6IHtcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIG5hbWU6ICdFbmNoYW50bWVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2V2ZW50cy5jc3YnOiB7XG4gICAga2V5OiAnaWQnLFxuICAgIG5hbWU6ICdFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAga2V5OiAnX19yb3dJZCcsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gcmVtb3ZlZCBhZnRlciBqb2luVGFibGVzXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAvKiBUT0RPIHR1cm4gdG8gY29uc3RhbnRzXG4gICcuLi8uLi9nYW1lZGF0YS9tYWdpY19wYXRocy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAqL1xuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIGtleTogJ2JpdF92YWx1ZScsIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAgIG5hbWU6ICdUZXJyYWluVHlwZUJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgLyogVE9ETyAtIHR1cm4gdG8gY29uc3RhbnRcbiAgJy4uLy4uL2dhbWVkYXRhL21vbnN0ZXJfdGFncy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgKi9cbiAvKiBUT0RPIC0gdHVybiB0byBjb25zdGFudFxuICAnLi4vLi4vZ2FtZWRhdGEvbmFtZXR5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdpZCcsXG4gICAgbmFtZTogJ05hbWVUeXBlJyxcbiAgfSxcbiAgKi9cbiAgJy4uLy4uL2dhbWVkYXRhL25hdGlvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnTmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgZXh0cmFGaWVsZHM6IHtcbiAgICAgIHJlYWxtOiAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIG5hbWU6ICdyZWFsbScsXG4gICAgICAgICAgdHlwZTogQ09MVU1OLlU4LFxuICAgICAgICAgIHdpZHRoOiAxLFxuICAgICAgICAgIC8vIHdlIHdpbGwgYXNzaWduIHRoZXNlIGxhdGVyXG4gICAgICAgICAgb3ZlcnJpZGUodiwgdSwgYSkgeyByZXR1cm4gMDsgfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJywgLy8gVE9ETyAtIGJ1aFxuICAgIG5hbWU6ICdOb25Gb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL290aGVyX3BsYW5lcy5jc3YnOiB7XG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBuYW1lOiAnT3RoZXJQbGFuZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3ByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1ByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJvdGVjdGlvbnNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1Byb3RlY3Rpb25CeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9yZWFsbXMuY3N2Jzoge1xuICAgIGtleTogJ19fcm93SWQnLCAvLyBUT0RPIC0gYnVoXG4gICAgbmFtZTogJ1JlYWxtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc2l0ZV90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBrZXk6ICdiaXRfdmFsdWUnLFxuICAgIG5hbWU6ICdTaXRlVGVycmFpblR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX2RhbWFnZV90eXBlcy5jc3YnOiB7XG4gICAga2V5OiAnYml0X3ZhbHVlJyxcbiAgICBuYW1lOiAnU3BlY2lhbERhbWFnZVR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gIC8qXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX3VuaXF1ZV9zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbFVuaXF1ZVN1bW1vbicsXG4gICAga2V5OiAnbnVtYmVyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAqL1xuICAnLi4vLi4vZ2FtZWRhdGEvc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGwnLFxuICAgIGtleTogJ2lkJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgcHJlVHJhbnNmb3JtIChyYXdGaWVsZHM6IHN0cmluZ1tdLCByYXdEYXRhOiBzdHJpbmdbXVtdKSB7XG4gICAgICAvLyBjb2x1bW5zIHRvIGNvcHkgb3ZlciBmcm9tIGVmZmVjdHNfc3BlbGxzIHRvIHNwZWxscy4uLlxuICAgICAgY29uc3QgSURYID0gcmF3RmllbGRzLmluZGV4T2YoJ2VmZmVjdF9yZWNvcmRfaWQnKTtcbiAgICAgIGNvbnN0IFRYRiA9IFsxLDIsMyw1LDYsNyw4LDksMTAsMTEsMTJdXG4gICAgICBpZiAoSURYID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdubyBlZmZlY3RfcmVjb3JkX2lkPycpXG5cbiAgICAgIGZ1bmN0aW9uIHJlcGxhY2VSZWYgKGRlc3Q6IHN0cmluZ1tdLCBzcmM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGRlc3Quc3BsaWNlKElEWCwgMSwgLi4uVFhGLm1hcChpID0+IHNyY1tpXSkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBbZWZmZWN0RmllbGRzLCAuLi5lZmZlY3REYXRhXSA9IHJlYWRGaWxlU3luYyhcbiAgICAgICAgICBgLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2YCxcbiAgICAgICAgICB7IGVuY29kaW5nOiAndXRmOCcgfVxuICAgICAgICApLnNwbGl0KCdcXG4nKVxuICAgICAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KCdcXHQnKSk7XG5cbiAgICAgIHJlcGxhY2VSZWYocmF3RmllbGRzLCBlZmZlY3RGaWVsZHMpO1xuXG4gICAgICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSBjb25zb2xlLmxvZyhpLCBmKVxuXG4gICAgICBmb3IgKGNvbnN0IGRlc3Qgb2YgcmF3RGF0YSkge1xuICAgICAgICBjb25zdCBlcmlkID0gTnVtYmVyKGRlc3RbSURYXSk7XG4gICAgICAgIGNvbnN0IHNyYyA9IGVmZmVjdERhdGFbZXJpZF07XG4gICAgICAgIGlmICghc3JjKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignTk9QRScsIGRlc3QsIGVyaWQpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gdGhhbmtzJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVwbGFjZVJlZihkZXN0LCBzcmMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvKlxuICAnLi4vLi4vZ2FtZWRhdGEvdGVycmFpbl9zcGVjaWZpY19zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblNwZWNpZmljU3VtbW9uJyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bml0X2VmZmVjdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0RWZmZWN0JyxcbiAgICBrZXk6ICdudW1iZXInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICovXG4gIC8vIHJlbW92ZWQgYWZ0ZXIgam9pblRhYmxlc1xuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIGtleTogJ2lkJyxcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnLCAnd2VhcG9uJ10pLFxuICB9LFxufTtcbiIsICJpbXBvcnQgdHlwZSB7IFNjaGVtYUFyZ3MsIFJvdyB9IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHtcbiAgU2NoZW1hLFxuICBUYWJsZSxcbiAgQ09MVU1OLFxuICBhcmdzRnJvbVRleHQsXG4gIGFyZ3NGcm9tVHlwZSxcbiAgQ29sdW1uQXJncyxcbiAgZnJvbUFyZ3Ncbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmxldCBfbmV4dEFub25TY2hlbWFJZCA9IDE7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPixcbik6IFByb21pc2U8VGFibGU+IHtcbiAgbGV0IHJhdzogc3RyaW5nO1xuICB0cnkge1xuICAgIHJhdyA9IGF3YWl0IHJlYWRGaWxlKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcmVhZCBzY2hlbWEgZnJvbSAke3BhdGh9YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgc2NoZW1hJyk7XG4gIH1cbiAgdHJ5IHtcbiAgICByZXR1cm4gY3N2VG9UYWJsZShyYXcsIG9wdGlvbnMpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byBwYXJzZSBzY2hlbWEgZnJvbSAke3BhdGh9OmAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBwYXJzZSBzY2hlbWEnKTtcbiAgfVxufVxuXG50eXBlIENyZWF0ZUV4dHJhRmllbGQgPSAoXG4gIGluZGV4OiBudW1iZXIsXG4gIGE6IFNjaGVtYUFyZ3MsXG4gIG5hbWU6IHN0cmluZyxcbiAgb3ZlcnJpZGU/OiAoLi4uYXJnczogYW55W10pID0+IGFueSxcbikgPT4gQ29sdW1uQXJncztcblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGtleTogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pID0+IGFueT47XG4gIGtub3duRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCBDT0xVTU4+LFxuICBleHRyYUZpZWxkczogUmVjb3JkPHN0cmluZywgQ3JlYXRlRXh0cmFGaWVsZD4sXG4gIHByZVRyYW5zZm9ybT86ICguLi5hcmdzOiBhbnkpID0+IGFueSxcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIG5hbWU6ICcnLFxuICBrZXk6ICcnLFxuICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoKSxcbiAgb3ZlcnJpZGVzOiB7fSxcbiAga25vd25GaWVsZHM6IHt9LFxuICBleHRyYUZpZWxkczoge30sXG4gIHNlcGFyYXRvcjogJ1xcdCcsIC8vIHN1cnByaXNlIVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3N2VG9UYWJsZShcbiAgcmF3OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5cbik6IFRhYmxlIHtcbiAgY29uc3QgX29wdHMgPSB7IC4uLkRFRkFVTFRfT1BUSU9OUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6IF9vcHRzLm5hbWUsXG4gICAga2V5OiBfb3B0cy5rZXksXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gICAgcmF3RmllbGRzOiB7fSxcbiAgICBvdmVycmlkZXM6IF9vcHRzLm92ZXJyaWRlcyxcbiAgfTtcbiAgaWYgKCFzY2hlbWFBcmdzLm5hbWUpIHRocm93IG5ldyBFcnJvcignbmFtZSBpcyByZXF1cmllZCcpO1xuICBpZiAoIXNjaGVtYUFyZ3Mua2V5KSB0aHJvdyBuZXcgRXJyb3IoJ2tleSBpcyByZXF1cmllZCcpO1xuXG4gIGlmIChyYXcuaW5kZXhPZignXFwwJykgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ3VoIG9oJylcblxuICBjb25zdCBbcmF3RmllbGRzLCAuLi5yYXdEYXRhXSA9IHJhd1xuICAgIC5zcGxpdCgnXFxuJylcbiAgICAuZmlsdGVyKGxpbmUgPT4gbGluZSAhPT0gJycpXG4gICAgLm1hcChsaW5lID0+IGxpbmUuc3BsaXQoX29wdHMuc2VwYXJhdG9yKSk7XG5cbiAgaWYgKG9wdGlvbnM/LnByZVRyYW5zZm9ybSkge1xuICAgIG9wdGlvbnMucHJlVHJhbnNmb3JtKHJhd0ZpZWxkcywgcmF3RGF0YSk7XG4gIH1cblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn1+JHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF3Q29sdW1uczogQ29sdW1uQXJnc1tdID0gW107XG4gIGZvciAoY29uc3QgW2luZGV4LCBuYW1lXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgbGV0IGM6IG51bGwgfCBDb2x1bW5BcmdzID0gbnVsbDtcbiAgICBzY2hlbWFBcmdzLnJhd0ZpZWxkc1tuYW1lXSA9IGluZGV4O1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgaWYgKF9vcHRzLmtub3duRmllbGRzW25hbWVdKSB7XG4gICAgICBjID0gYXJnc0Zyb21UeXBlKFxuICAgICAgICBuYW1lLFxuICAgICAgICBfb3B0cy5rbm93bkZpZWxkc1tuYW1lXSxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGMgPSBhcmdzRnJvbVRleHQoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBzY2hlbWFBcmdzLFxuICAgICAgICAgIHJhd0RhdGEsXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hQXJncy5uYW1lfTogXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfVxceDFiWzBtYCxcbiAgICAgICAgICAgIGV4XG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGV4XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgIHJhd0NvbHVtbnMucHVzaChjKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0aW9ucz8uZXh0cmFGaWVsZHMpIHtcbiAgICBjb25zdCBiaSA9IE9iamVjdC52YWx1ZXMoc2NoZW1hQXJncy5yYXdGaWVsZHMpLmxlbmd0aDsgLy8gaG1tbW1cbiAgICByYXdDb2x1bW5zLnB1c2goLi4uT2JqZWN0LmVudHJpZXMob3B0aW9ucy5leHRyYUZpZWxkcykubWFwKFxuICAgICAgKFtuYW1lLCBjcmVhdGVDb2x1bW5dOiBbc3RyaW5nLCBDcmVhdGVFeHRyYUZpZWxkXSwgZWk6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBvdmVycmlkZSA9IHNjaGVtYUFyZ3Mub3ZlcnJpZGVzW25hbWVdO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGVpLCBzY2hlbWFBcmdzLnJhd0ZpZWxkcylcbiAgICAgICAgY29uc3QgaW5kZXggPSBiaSArIGVpO1xuICAgICAgICBjb25zdCBjYSA9IGNyZWF0ZUNvbHVtbihpbmRleCwgc2NoZW1hQXJncywgbmFtZSwgb3ZlcnJpZGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChjYS5pbmRleCAhPT0gaW5kZXgpIHRocm93IG5ldyBFcnJvcignd2lzZWd1eSBwaWNrZWQgaGlzIG93biBpbmRleCcpO1xuICAgICAgICAgIGlmIChjYS5uYW1lICE9PSBuYW1lKSB0aHJvdyBuZXcgRXJyb3IoJ3dpc2VndXkgcGlja2VkIGhpcyBvd24gbmFtZScpO1xuICAgICAgICAgIGlmIChjYS50eXBlID09PSBDT0xVTU4uQk9PTCkge1xuICAgICAgICAgICAgaWYgKGNhLmJpdCAhPT0gc2NoZW1hQXJncy5mbGFnc1VzZWQpIHRocm93IG5ldyBFcnJvcigncGlzcyBiYWJ5IGlkaW90Jyk7XG4gICAgICAgICAgICBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjYSwgeyBpbmRleCwgb3ZlcnJpZGUsIG5hbWUsIH0pXG4gICAgICAgICAgdGhyb3cgZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZGF0YTogUm93W10gPSBuZXcgQXJyYXkocmF3RGF0YS5sZW5ndGgpXG4gICAgLmZpbGwobnVsbClcbiAgICAubWFwKChfLCBfX3Jvd0lkKSA9PiAoeyBfX3Jvd0lkIH0pKVxuICAgIDtcblxuICBmb3IgKGNvbnN0IGNvbEFyZ3Mgb2YgcmF3Q29sdW1ucykge1xuICAgIGNvbnN0IGNvbCA9IGZyb21BcmdzKGNvbEFyZ3MpO1xuICAgIHNjaGVtYUFyZ3MuY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgc2NoZW1hQXJncy5maWVsZHMucHVzaChjb2wubmFtZSk7XG4gIH1cblxuICBpZiAoc2NoZW1hQXJncy5rZXkgIT09ICdfX3Jvd0lkJyAmJiAhc2NoZW1hQXJncy5maWVsZHMuaW5jbHVkZXMoc2NoZW1hQXJncy5rZXkpKVxuICAgIHRocm93IG5ldyBFcnJvcihgZmllbGRzIGlzIG1pc3NpbmcgdGhlIHN1cHBsaWVkIGtleSBcIiR7c2NoZW1hQXJncy5rZXl9XCJgKTtcblxuICBmb3IgKGNvbnN0IGNvbCBvZiBzY2hlbWFBcmdzLmNvbHVtbnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgZGF0YSlcbiAgICAgIGRhdGFbci5fX3Jvd0lkXVtjb2wubmFtZV0gPSBjb2wuZnJvbVRleHQoXG4gICAgICAgIHJhd0RhdGFbci5fX3Jvd0lkXVtjb2wuaW5kZXhdLFxuICAgICAgICByYXdEYXRhW3IuX19yb3dJZF0sXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IFBhcnNlU2NoZW1hT3B0aW9ucywgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbkR1bXBlZCB9IGZyb20gJy4vam9pbi10YWJsZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuZnVuY3Rpb24gZmluZERlZiAobmFtZTogc3RyaW5nKTogW3N0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XSB7XG4gIGlmIChjc3ZEZWZzW25hbWVdKSByZXR1cm4gW25hbWUsIGNzdkRlZnNbbmFtZV1dO1xuICBmb3IgKGNvbnN0IGsgaW4gY3N2RGVmcykge1xuICAgIGNvbnN0IGQgPSBjc3ZEZWZzW2tdO1xuICAgIGlmIChkLm5hbWUgPT09IG5hbWUpIHJldHVybiBbaywgZF07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBubyBjc3YgZGVmaW5lZCBmb3IgXCIke25hbWV9XCJgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcE9uZShrZXk6IHN0cmluZykge1xuICBjb25zdCB0YWJsZSA9IGF3YWl0IHJlYWRDU1YoLi4uZmluZERlZihrZXkpKTtcbiAgY29tcGFyZUR1bXBzKHRhYmxlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZHVtcEFsbCAoKSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICAvLyBKT0lOU1xuICBqb2luRHVtcGVkKHRhYmxlcyk7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLjMwLmJpbidcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXBhcmVEdW1wcyh0OiBUYWJsZSkge1xuICBjb25zdCBtYXhOID0gdC5yb3dzLmxlbmd0aCAtIDMwXG4gIGxldCBuOiBudW1iZXI7XG4gIGxldCBwOiBhbnkgPSB1bmRlZmluZWQ7XG4gIGlmIChmaWVsZHNbMF0gPT09ICdGSUxURVInKSB7XG4gICAgbiA9IDA7IC8vIHdpbGwgYmUgaW5nb3JlZFxuICAgIGZpZWxkcy5zcGxpY2UoMCwgMSwgJ2lkJywgJ25hbWUnKTtcbiAgICBwID0gKHI6IGFueSkgPT4gZmllbGRzLnNsaWNlKDIpLnNvbWUoZiA9PiByW2ZdKTtcbiAgfSBlbHNlIGlmIChmaWVsZHNbMV0gPT09ICdST1cnICYmIGZpZWxkc1syXSkge1xuICAgIG4gPSBOdW1iZXIoZmllbGRzWzJdKSAtIDE1O1xuICAgIGZpZWxkcy5zcGxpY2UoMSwgMilcbiAgICBjb25zb2xlLmxvZyhgZW5zdXJlIHJvdyAke2ZpZWxkc1syXX0gaXMgdmlzaWJsZSAoJHtufSlgKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB0aHJvdyBuZXcgRXJyb3IoJ1JPVyBtdXN0IGJlIE5VTUJFUiEhISEnKTtcbiAgfSBlbHNlIHtcbiAgICBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4TilcbiAgfVxuICBuID0gTWF0aC5taW4obWF4TiwgTWF0aC5tYXgoMCwgbikpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gKGZpZWxkcy5sZW5ndGggPyAoZmllbGRzWzBdID09PSAnQUxMJyA/IHQuc2NoZW1hLmZpZWxkcyA6IGZpZWxkcykgOlxuICAgdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDEwKSkgYXMgc3RyaW5nW11cbiAgZHVtcFRvQ29uc29sZSh0LCBuLCBtLCBmLCAnQkVGT1JFJywgcCk7XG4gIC8qXG4gIGlmICgxICsgMSA9PT0gMikgcmV0dXJuOyAvLyBUT0RPIC0gd2Ugbm90IHdvcnJpZWQgYWJvdXQgdGhlIG90aGVyIHNpZGUgeWV0XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXMoW3RdKTtcbiAgY29uc29sZS5sb2coYG1hZGUgJHtibG9iLnNpemV9IGJ5dGUgYmxvYmApO1xuICBjb25zb2xlLmxvZygnd2FpdC4uLi4nKTtcbiAgLy8oZ2xvYmFsVGhpcy5fUk9XUyA/Pz0ge30pW3Quc2NoZW1hLm5hbWVdID0gdC5yb3dzO1xuICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICBjb25zb2xlLmxvZygnXFxuXFxuJylcbiAgY29uc3QgdSA9IGF3YWl0IFRhYmxlLm9wZW5CbG9iKGJsb2IpO1xuICBkdW1wVG9Db25zb2xlKHVbdC5zY2hlbWEubmFtZV0sIG4sIG0sIGYsICdBRlRFUicsIHApO1xuICAvL2F3YWl0IHdyaXRlRmlsZSgnLi90bXAuYmluJywgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgKi9cbn1cblxuZnVuY3Rpb24gZHVtcFRvQ29uc29sZShcbiAgdDogVGFibGUsXG4gIG46IG51bWJlcixcbiAgbTogbnVtYmVyLFxuICBmOiBzdHJpbmdbXSxcbiAgaDogc3RyaW5nLFxuICBwPzogKHI6IGFueSkgPT4gYm9vbGVhbixcbikge1xuICBjb25zb2xlLmxvZyhgXFxuICAgICAke2h9OmApO1xuICB0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIGNvbnNvbGUubG9nKGAodmlldyByb3dzICR7bn0gLSAke219KWApO1xuICBjb25zdCByb3dzID0gdC5wcmludCh3aWR0aCwgZiwgbiwgbSwgcCk7XG4gIGlmIChyb3dzKSBmb3IgKGNvbnN0IHIgb2Ygcm93cykgY29uc29sZS50YWJsZShbcl0pO1xuICBjb25zb2xlLmxvZyhgICAgIC8ke2h9XFxuXFxuYClcbn1cblxuXG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIGR1bXBPbmUoZmlsZSk7XG5lbHNlIGR1bXBBbGwoKTtcblxuXG4iLCAiY29uc3QgVU5JVFMgPSBuZXcgU2V0KFtcbiAgNTc0LCAvLyBBbWJlciBDbGFuIFRyaXRvblxuICA2MTIsIC8vIEdyeXBob24gUmlkZXJcbiAgNjMzLCAvLyBXZXJld29sZlxuICA2MzQsIC8vIEhhbmRtYWlkZW4gb2YgRGVhdGhcbiAgNjM2LCAvLyBCYXNpbGlza1xuICA2MzcsIC8vIERyYWNvIExpb25cbiAgNjM5LCAvLyBLcmFrZW4gS2luZ1xuICA2NDEsIC8vIEFuY2llbnQgTWFuZHJhZ29yYVxuICA2NDIsIC8vIEdpYW50IExvYnN0ZXJcbiAgNjQ2LCAvLyBUcm9sbCBSYWlkZXJcbiAgNjQ3LCAvLyBEYXJrIEtuaWdodFxuICA2NDgsIC8vIFRyb2xsIEFyY2hlclxuICA2NDksIC8vIFRyb2xsIE1hZ2VcbiAgNjUwLCAvLyBXYXJyaW9yIE1hZ2VcbiAgNjUxLCAvLyBFYXRlciBvZiBEcmVhbXNcbiAgNjU5LCAvLyBHcm90ZXNxdWVcbiAgNjcyLCAvLyBTcGVjdHJhbCBWZWxpdGVcbiAgNjczLCAvLyBTcGVjdHJhbCBIYXN0YXR1c1xuICA2NzcsIC8vIEFwcGFyaXRpb25cbiAgNjgyLCAvLyBTcGVjdHJhbCBTdGFuZGFyZFxuICA2OTMsIC8vIFRvbWIgV3lybVxuICA2OTUsIC8vIEJlYXN0IElsbHVzaW9uXG4gIDY5NiwgLy8gS25pZ2h0IElsbHVzaW9uXG4gIDcxMiwgLy8gU2F0eXIgTWFuaWtpblxuICA3MTMsIC8vIEhhcnB5IE1hbmlraW5cbiAgNzE3LCAvLyBDYXJyaW9uIEhvcnNlXG4gIDcxOCwgLy8gQ2FycmlvbiBCZWFyXG4gIDcxOSwgLy8gQ2FycmlvbiBCZWFzdFxuICA3MjAsIC8vIFNsYXZlXG4gIDc0MSwgLy8gR2lhbnQgTXVtbXlcbiAgNzQyLCAvLyBHaWFudCBNdW1teVxuICA3NDMsIC8vIE11bW15XG4gIDc1MCwgLy8gVGhpbmcgRnJvbSBCZXlvbmRcbiAgNzUxLCAvLyBUaGluZyBUaGF0IFNob3VsZCBOb3QgQmVcbiAgNzUyLCAvLyBFbGRlciBUaGluZ1xuICA3NTMsIC8vIFRoaW5nIEZyb20gVGhlIFZvaWRcbiAgNzU0LCAvLyBHcmVhdGVyIE90aGVybmVzc1xuICA3NTUsIC8vIE90aGVybmVzc1xuICA3NTYsIC8vIExlc3NlciBPdGhlcm5lc3NcbiAgNzU3LCAvLyBWaWxlIFRoaW5nXG4gIDc1OCwgLy8gVGhpbmcgT2YgTWFueSBFeWVzXG4gIDc1OSwgLy8gRHdlbGxlci1Jbi1UaGUtRGVlcFxuICA3NjIsIC8vIFZhc3RuZXNzXG4gIDc2NCwgLy8gU2VycGVudCBYWFhcbiAgNzc4LCAvLyBEaXZpbmUgTXVtbXlcbiAgNzgwLCAvLyBMb3JkIG9mIHRoZSBIdW50XG4gIDc5OSwgLy8gSW1wZXJpYWwgRm9vdG1hblxuICA4MTYsIC8vIFNoYXJrXG4gIDg0MywgLy8gU2hhZGUgTG9yZFxuICA4NTEsIC8vIEN1IFNpZGhlXG4gIDg3MCwgLy8gQ2FwdGFpblxuICA4NzEsIC8vIFBpcmF0ZVxuICA5MTQsIC8vIFNvdWxsZXNzIFdhcnJpb3JcbiAgOTE1LCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDkxNiwgLy8gU291bGxlc3MgV2FycmlvclxuICA5MTcsIC8vIFNvdWxsZXNzIFdhcnJpb3JcbiAgOTE4LCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDkxOSwgLy8gU291bGxlc3MgV2FycmlvclxuICA5MjAsIC8vIFNvdWxsZXNzIFdhcnJpb3JcbiAgOTIxLCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDkyMiwgLy8gU291bGxlc3MgV2FycmlvclxuICA5NTUsIC8vIEFzeW5qYVxuICA5NjIsIC8vIE1hZG1hblxuICA5NjMsIC8vIE1hZCBQcmllc3RcbiAgOTY1LCAvLyBMb3JkIG9mIEZlcnRpbGl0eVxuICA5NjYsIC8vIEZvcm1sZXNzIFNwYXduXG4gIDk2NywgLy8gSHlicmlkXG4gIDk3MiwgLy8gSHlicmlkIFNvbGRpZXJcbiAgOTc1LCAvLyBJY2h0eWlkIFdhcnJpb3JcbiAgOTc2LCAvLyBJY2h0eWlkIExvcmRcbiAgOTkzLCAvLyBTbGF2ZSBvZiBCZWxwaGVnb3JcbiAgOTk1LCAvLyBFYXRlciBvZiB0aGUgRGVhZFxuICA5OTYsIC8vIEVhdGVyIG9mIHRoZSBEZWFkXG4gIDk5NywgLy8gVW5mZXR0ZXJlZFxuICAxMDAxLCAvLyBBc21lZ1xuICAxMDAyLCAvLyBBc21lZyBKYXJsXG4gIDEwMDUsIC8vIE1pbm90YXVyIE1hbmlraW5cbiAgMTAwNiwgLy8gQ2FycmlvbiBCZWhlbW90aFxuICAxMDA3LCAvLyBNYWQgRGVlcCBPbmVcbiAgMTAwOCwgLy8gRmFuYXRpYyBEZWVwIE9uZVxuICAxMDA5LCAvLyBIb2x5IERlZXAgT25lXG4gIDEwMzIsIC8vIFJveWFsIE5hdmlnYXRvclxuICAxMDgwLCAvLyBYWFggLSBBcmNoZXJsZXNzIENoYXJpb3RcbiAgMTA4NCwgLy8gTW9vc2VcbiAgMTA4NywgLy8gTGFyZ2UgQW50XG4gIDEwOTMsIC8vIFNhZ2l0dGFyaWFuIENhcmNhc3NcbiAgMTExNywgLy8gVmFuYXJhXG4gIDExMjksIC8vIEJhbmRhclxuICAxMTQ4LCAvLyBFYXRlciBvZiBHb2RzXG4gIDExNDksIC8vIEVhdGVyIG9mIEdvZHNcbiAgMTE1MCwgLy8gRWF0ZXIgb2YgR29kc1xuICAxMTUxLCAvLyBTbGF2ZSB0byBVbnJlYXNvblxuICAxMTc5LCAvLyBTZXJwZW50XG4gIDExODcsIC8vIENhdGFwaHJhY3RcbiAgMTE5NSwgLy8gSG9idXJnIFByaWVzdFxuICAxMTk2LCAvLyBIb2cgS25pZ2h0XG4gIDExOTcsIC8vIEJ1cmdtZWlzdGVyXG4gIDEyMDAsIC8vIFVuZnJvemVuIE1hZ2VcbiAgMTIwMSwgLy8gVW5mcm96ZW4gTG9yZFxuICAxMjAyLCAvLyBVbmZyb3plbiBXYXJyaW9yXG4gIDEyMDMsIC8vIFVuZnJvemVuXG4gIDEyNDIsIC8vIFNhbXVyYWlcbiAgMTI1MiwgLy8gRGFpbXlvXG4gIDEyNjIsIC8vIE9uaVxuICAxMjYzLCAvLyBPbmkgU3Bpcml0XG4gIDEyNjgsIC8vIEt1cm8tT25pXG4gIDEyNjksIC8vIE9uaSBTcGlyaXRcbiAgMTI3MCwgLy8gUm9uaW5cbiAgMTI3MSwgLy8gTWFrZXIgb2YgUnVpbnNcbiAgMTI5NiwgLy8gRXJpbnlhXG4gIDEyOTcsIC8vIEVyaW55YVxuICAxMjk4LCAvLyBFcmlueWFcbiAgMTM0NywgLy8gU2lycnVzaFxuICAxMzY0LCAvLyBKYWRlIExpemFyZFxuICAxMzgwLCAvLyBHcmVhdCBIYXdrXG4gIDE0MDYsIC8vIFZpc2l0b3JcbiAgMTQwNywgLy8gSHVudGVyIG9mIEhlcm9lc1xuICAxNDEzLCAvLyBUcmlkZW50IExvcmRcbiAgMTQxNCwgLy8gVHJpZGVudCBMb3JkXG4gIDE0MzIsIC8vIEhhbm55YVxuICAxNDU0LCAvLyBVbnVzZWQgQW5jaWVudCBPbmVcbiAgMTQ1NSwgLy8gQW5jaWVudCBXZXQgT25lXG4gIDE1MTQsIC8vIExpemFyZCBTaGFtYW5cbiAgMTUzMCwgLy8gS2FwcGEgTWFnZVxuICAxNTM5LCAvLyBHaG9zdCBNYWdlXG4gIDE1NDAsIC8vIEdob3N0IE1hZ2VcbiAgMTU0MSwgLy8gR2hvc3QgQ2hhbXBpb25cbiAgMTU2MCwgLy8gRG9nXG4gIDE1NjMsIC8vIFZvaWQgQ3VsdGlzdFxuICAxNTY0LCAvLyBNYWQgQ3VsdGlzdFxuICAxNTY2LCAvLyBNYWQgT25lXG4gIDE1NjcsIC8vIE1hZCBNZXJtYW5cbiAgMTU2OCwgLy8gTWFkIE1lcm1hblxuICAxNTY5LCAvLyBNYWQgVHJpdG9uXG4gIDE1NzAsIC8vIEh1bWFuIERyZWFtZXJcbiAgMTU3MSwgLy8gRGVlcCBPbmUgRHJlYW1lclxuICAxNTcyLCAvLyBNZXJtYW4gRHJlYW1lclxuICAxNTczLCAvLyBNZXJtYW4gRHJlYW1lclxuICAxNTc0LCAvLyBUcml0b24gRHJlYW1lclxuICAxNTc1LCAvLyBIeWJyaWQgQ3VsdGlzdFxuICAxNTc2LCAvLyBNYWQgSHlicmlkXG4gIDE1OTIsIC8vIEJlYXIgVHJpYmUgV2FycmlvclxuICAxNTkzLCAvLyBCZWFyIFRyaWJlIFdhcnJpb3JcbiAgMTU5NCwgLy8gRGVlciBUcmliZSBXYXJyaW9yXG4gIDE1OTUsIC8vIERlZXIgVHJpYmUgQXJjaGVyXG4gIDE1OTYsIC8vIFdvbGYgVHJpYmUgU2hhbWFuXG4gIDE1OTcsIC8vIEJlYXIgVHJpYmUgU2hhbWFuXG4gIDE1OTgsIC8vIERlZXIgVHJpYmUgU2hhbWFuXG4gIDE2MDAsIC8vIExpb24gVHJpYmUgV2FycmlvclxuICAxNjAxLCAvLyBMaW9uIFRyaWJlIEFyY2hlclxuICAxNjAyLCAvLyBMaW9uIFRyaWJlIFdpdGNoIERvY3RvclxuICAxNjAzLCAvLyBIdW1hbiBIdXNrYXJsXG4gIDE2MDQsIC8vIEh1bWFuIEh1c2thcmxcbiAgMTYwNSwgLy8gSGVyc2VcbiAgMTYxMCwgLy8gSmFndWFyIFRyaWJlIFNsaW5nZXJcbiAgMTYxMSwgLy8gSmFndWFyIFRyaWJlIFdhcnJpb3JcbiAgMTYxMiwgLy8gSmFndWFyIFRyaWJlIFByaWVzdFxuICAxNjE2LCAvLyBDYXZlbWFuIENoYW1waW9uXG4gIDE2MzksIC8vIEN1bHRpc3RcbiAgMTY0MCwgLy8gQ3VsdGlzdFxuICAxNjU3LCAvLyBMb25nZGVhZCBUcmlhcml1c1xuICAxNjU4LCAvLyBMb25nZGVhZCBQcmluY2lwZVxuICAxNjU5LCAvLyBUb21iIENoYXJpb3RlZXJcbiAgMTcxNSwgLy8gUGlzYWNoYVxuICAxNzE2LCAvLyBTb3VsbGVzcyBCYW5kYXJcbiAgMTcxNywgLy8gU291bGxlc3MgQmFuZGFyIFdhcnJpb3JcbiAgMTcxOCwgLy8gU291bGxlc3MgQmFuZGFyIFdhcnJpb3JcbiAgMTcxOSwgLy8gTG9uZ2RlYWQgQmFuZGFyXG4gIDE3MjAsIC8vIExvbmdkZWFkIEJhbmRhclxuICAxNzIxLCAvLyBMb25nZGVhZCBCYW5kYXIgV2FycmlvclxuICAxNzIyLCAvLyBMb25nZGVhZCBCYW5kYXIgV2FycmlvclxuICAxNzIzLCAvLyBMb25nZGVhZCBSYWphXG4gIDE3MjQsIC8vIFNvdWxsZXNzIFZhbmFyYVxuICAxNzI1LCAvLyBTb3VsbGVzcyBWYW5hcmEgV2FycmlvclxuICAxNzI2LCAvLyBTb3VsbGVzcyBWYW5hcmEgV2FycmlvclxuICAxNzI3LCAvLyBMb25nZGVhZCBWYW5hcmFcbiAgMTcyOCwgLy8gTG9uZ2RlYWQgVmFuYXJhIFdhcnJpb3JcbiAgMTcyOSwgLy8gTG9uZ2RlYWQgVmFuYXJhIFdhcnJpb3JcbiAgMTczMCwgLy8gTG9uZ2RlYWQgVmFuYXJhIENvbW1hbmRlclxuICAxNzMxLCAvLyBTb3VsbGVzcyBNYXJrYXRhXG4gIDE3MzIsIC8vIExvbmdkZWFkIE1hcmthdGFcbiAgMTgzNiwgLy8gS28tT25pXG4gIDE4MzcsIC8vIE9uaSBzcGlyaXRcbiAgMTg0NSwgLy8gQmFrZW1vbm8gQ2hpZWZcbiAgMTkxMCwgLy8gTW9uc3RlciBCb2FyXG4gIDE5MTEsIC8vIERlZmlsZXIgb2YgRHJlYW1zXG4gIDE5MTIsIC8vIEJyaWdhbmQgTGVhZGVyXG4gIDE5MTMsIC8vIEFib21pbmF0aW9uIG9mIERlc29sYXRpb25cbiAgMTk3NiwgLy8gTG9uZ2RlYWQgR2lhbnRcbiAgMTk3OCwgLy8gRHVzdCBQcmllc3RcbiAgMTk3OSwgLy8gRHVzdCBLaW5nXG4gIDIwNDAsIC8vIExvbmdkZWFkIFJlcGhhaXRlXG4gIDIwNDEsIC8vIExvbmdkZWFkIFJlcGhhaXRlXG4gIDIwNDIsIC8vIExvbmdkZWFkIFJlcGhhaXRlXG4gIDIwNDMsIC8vIExvbmdkZWFkIFJlcGhhaXRlXG4gIDIwNDQsIC8vIExvbmdkZWFkIFJlcGhhaXRlXG4gIDIwNDYsIC8vIE1hbGlrXG4gIDIwNTMsIC8vIENoYXlvdFxuICAyMDU0LCAvLyBDaGF5b3RcbiAgMjA3NSwgLy8gTmVwaGlsXG4gIDIwODYsIC8vIFNsZWVwaW5nIFBpbGxhclxuICAyMTE3LCAvLyBJbXBlcmlhbCBDb21tYW5kZXJcbiAgMjExOSwgLy8gU291bGxlc3MgV2FycmlvclxuICAyMTIwLCAvLyBMb25nZGVhZFxuICAyMTIxLCAvLyBMb25nZGVhZFxuICAyMTIyLCAvLyBMb25nZGVhZCBIb3BsaXRlXG4gIDIxMjMsIC8vIExvbmdkZWFkXG4gIDIxMjQsIC8vIExvbmdkZWFkXG4gIDIxNDEsIC8vIEVyZ2lcbiAgMjE0MiwgLy8gTml0aGluZ1xuICAyMTQzLCAvLyBXZXJld29sZlxuICAyMTQ0LCAvLyBHYWxkcmFtYXRoclxuICAyMTQ1LCAvLyBXZXJld29sZlxuICAyMTQ2LCAvLyBTZWl0aGJlcmVuZGVyXG4gIDIxNDcsIC8vIFNlaXRobWF0aHJcbiAgMjE2MCwgLy8gRW5raWR1XG4gIDIxOTQsIC8vIERyYXVnYWRyb3R0XG4gIDIxOTUsIC8vIEZsYXllZCBCdWxsXG4gIDIyMDEsIC8vIE5pZWZlbCBTaGFtYW5cbiAgMjIyMSwgLy8gVHJvbGwgU2VpdGhiZXJlbmRlclxuICAyMjI0LCAvLyBSZWQgQW50XG4gIDIyMzIsIC8vIExhcmdlIFNjb3JwaW9uXG4gIDIyNDAsIC8vIExvbmdkZWFkIENhcHRhaW5cbiAgMjI0MiwgLy8gU291bGxlc3MgV2FycmlvclxuICAyMjQzLCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDIyNDcsIC8vIEdyaWV2aW5nIERyeWFkXG4gIDIyNjMsIC8vIE1hZ2UgUGlsb3RcbiAgMjI2NCwgLy8gU3Rvcm0gQ2FsbGVyXG4gIDIyNzMsIC8vIExhcmdlIExvYnN0ZXJcbiAgMjI3NCwgLy8gU291bGxlc3MgQmFuZGFyIFdhcnJpb3JcbiAgMjI3NSwgLy8gRmFsc2UgUHJvcGhldFxuICAyMzIwLCAvLyBDaGllZnRhaW4gSWxsdXNpb25cbiAgMjMyMiwgLy8gWFhYIC0gU2hhcmtcbiAgMjMzMSwgLy8gUGlsZ3JpbVxuICAyMzM2LCAvLyBTcGVjdHJhbCBQcmluY2lwZVxuICAyMzM3LCAvLyBTcGVjdHJhbCBUcmlhcml1c1xuICAyMzM4LCAvLyBQcmFldG9yaWFuIFNwZWN0cmVcbiAgMjMzOSwgLy8gU2hhZG93IFRyaXRvblxuICAyMzQwLCAvLyBTaGFkb3cgU29sZGllclxuICAyMzU5LCAvLyBIb2x5IEtuaWdodFxuICAyMzYwLCAvLyBTb2xkaWVyIG9mIHRoZSBGYWl0aFxuICAyMzY0LCAvLyBTb3VsbGVzcyBTaGFtYmxlclxuICAyMzY1LCAvLyBTb3VsbGVzcyBXYXIgU2hhbWJsZXJcbiAgMjM2NiwgLy8gU291bGxlc3MgV2FyIFNoYW1ibGVyXG4gIDIzNjcsIC8vIFNvdWxsZXNzIFdhciBTaGFtYmxlclxuICAyNDE3LCAvLyBNZXJtYW4gUHJpZXN0XG4gIDI0MTksIC8vIE1lcm1hZ2VcbiAgMjQ1MSwgLy8gTG9uZ2RlYWRcbiAgMjQ1OCwgLy8gRHJhZ29uIEdpcmxcbiAgMjQ1OSwgLy8gRHJhZ29uIEdpcmxcbiAgMjQ3MCwgLy8gSHlicmlkIENvbW1hbmRlclxuICAyNDcxLCAvLyBTZWxmIFByb2NsYWltZWQgUHJpbmNlXG4gIDI0NzIsIC8vIFNoYXJrIFRyaWJlIEJyaWdhbmRcbiAgMjQ4NCwgLy8gTG9uZ2RlYWQgR2lhbnRcbiAgMjQ4OCwgLy8gWFhYXG4gIDI1MDEsIC8vIExlZ2lvbiBvZiBHb2RzXG4gIDI1MDQsIC8vIFpvdHpcbiAgMjUwNSwgLy8gQ2FtYXpvdHpcbiAgMjUxMCwgLy8gTGF2YS1ib3JuXG4gIDI1MTEsIC8vIExhdmEtYm9ybiBDb21tYW5kZXJcbiAgMjUxMywgLy8gQ2F2ZSBTcGlkZXJcbiAgMjUyMiwgLy8gUmVsZWFzZWQgU2FnZVxuICAyNTIzLCAvLyBSZWxlYXNlZCBLaW5nXG4gIDI1MjQsIC8vIFJlbGVhc2VkIFdhcnJpb3JcbiAgMjUyNSwgLy8gUmVsZWFzZWQgT25lXG4gIDI1MjksIC8vIENhdmUgRHJha2VcbiAgMjUzMSwgLy8gSHVza2FybFxuICAyNTMyLCAvLyBIZXJzZVxuICAyNTMzLCAvLyBIaXJkbWFuXG4gIDI1MzQsIC8vIERyYWdvblxuICAyNTM1LCAvLyBQbGFndWUgQ3VsdCBMZWFkZXJcbiAgMjUzNiwgLy8gRmVsbG93XG4gIDI1MzcsIC8vIE1vbmtcbiAgMjUzOCwgLy8gTm9ibGVcbiAgMjUzOSwgLy8gTm9ibGVcbiAgMjU0MCwgLy8gQmxvb2QgTWFnZVxuICAyNTQxLCAvLyBNb3VudGFpbiBLaW5nXG4gIDI1NjEsIC8vIFJhcHRvcmlhbiBXYXJyaW9yXG4gIDI1NjIsIC8vIEZyYXZhc2hpXG4gIDI1NjcsIC8vIEFpcnlhIExpZ2h0IEluZmFudHJ5XG4gIDI1NjgsIC8vIEFpcnlhIEluZmFudHJ5XG4gIDI1NjksIC8vIFNwaXJlIEhvcm4gU2VyYXBoXG4gIDI1OTgsIC8vIFR1cmFuIFVzaWpcbiAgMjYwNywgLy8gVHVyYW4gQXRocmF2YW5cbiAgMjYxOCwgLy8gUmVuZWdhZGUgSGFyYWIgU2VyYXBoXG4gIDI2MTksIC8vIEhhcmFiIFNlcmFwaFxuICAyNjM1LCAvLyBBaHVcbiAgMjYzOCwgLy8gWFhYIC0gVHVyYW4gR3J5cGhvblxuICAyNjQwLCAvLyBHaWFudCBTaGFtYW5cbiAgMjY0MSwgLy8gR2lhbnQgU29yY2VyZXJcbiAgMjY0MiwgLy8gWWV0aSBTaGFtYW5cbiAgMjY3MywgLy8gWGliYWxiYW4gU2NvdXRcbiAgMjcwMSwgLy8gTmF6Y2FuIExvbmdkZWFkXG4gIDI3MDIsIC8vIE5hemNhbiBMb25nZGVhZFxuICAyNzAzLCAvLyBDYWVsaWFuIExvbmdkZWFkXG4gIDI3MDQsIC8vIENhZWxpYW4gTG9uZ2RlYWRcbiAgMjcwNSwgLy8gQ2FlbGlhbiBMb25nZGVhZFxuICAyNzA2LCAvLyBDYWVsaWFuIExvbmdkZWFkXG4gIDI3MDcsIC8vIFNvdWxsZXNzIE5hemNhblxuICAyNzA4LCAvLyBTb3VsbGVzcyBOYXpjYW4gV2FycmlvclxuICAyNzA5LCAvLyBTb3VsbGVzcyBOYXpjYW4gV2FycmlvclxuICAyNzEwLCAvLyBTb3VsbGVzcyBOYXpjYW4gV2FycmlvclxuICAyNzExLCAvLyBTb3VsbGVzcyBOYXpjYW4gV2FycmlvclxuICAyNzY2LCAvLyBCYWxhbSBvZiB0aGUgTm9ydGhcbiAgMjc2OSwgLy8gQmFsYW0gb2YgdGhlIEVhc3RcbiAgMjc3MiwgLy8gQmFsYW0gb2YgdGhlIFNvdXRoXG4gIDI3NzUsIC8vIEJhbGFtIG9mIHRoZSBXZXN0XG4gIDI4MDQsIC8vIEljaHR5aWQgU2hhbWFuXG4gIDI4MTcsIC8vIEJvbmUgVHJpYmUgSHVudGVyXG4gIDI4MTgsIC8vIEJvbmUgVHJpYmUgQmVhc3QgSHVudGVyXG4gIDI4MTksIC8vIEJvbmUgVHJpYmUgSGVhZCBIdW50ZXJcbiAgMjgyMCwgLy8gQm9uZSBSZWFkZXJcbiAgMjg0MCwgLy8gU3BlY3RyYWwgQXJjaGVyXG4gIDI4NDEsIC8vIFNwZWN0cmFsIFBlbHRhc3RcbiAgMjg0MiwgLy8gU3BlY3RyYWwgSG9wbGl0ZVxuICAyODQzLCAvLyBTcGVjdHJhbCBLb3VyZXRlXG4gIDI4NDQsIC8vIFNwZWN0cmFsIENvbW1hbmRlclxuICAyODU3LCAvLyBGaXNoXG4gIDI5MDIsIC8vIE1lcnJvdyBNaWxpdGlhXG4gIDI5MDMsIC8vIE1lcnJvd1xuICAyOTA0LCAvLyBNZXJyb3dcbiAgMjkwNSwgLy8gTWVycm93IENoaWVmdGFpblxuICAyOTA2LCAvLyBNZXJyb3cgRHJ1aWRcbiAgMjkzMywgLy8gRW5raWR1XG4gIDI5ODEsIC8vIFNvdWxsZXNzIEVua2lkdVxuICAyOTgyLCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDI5ODMsIC8vIFNvdWxsZXNzIFdhcnJpb3JcbiAgMzAwNCwgLy8gU2VyZiBEZWZlbmRlclxuICAzMDA1LCAvLyBMb25nZGVhZCBBcmNoZXJcbiAgMzAwNiwgLy8gSHVtYW5icmVkXG4gIDMwMDcsIC8vIEJ1ZyBTb3VsIFZlc3NlbFxuICAzMDEyLCAvLyBTaHJpbXAgU291bCBWZXNzZWxcbiAgMzAzNiwgLy8gRXJ5dGhlaWFuIFByaWVzdFxuICAzMDM3LCAvLyBFcnl0aGVpYW4gUHJpZXN0XG4gIDMwNDYsIC8vIEtpbmcgb2YgQm90aCBXb3JsZHNcbiAgMzA0NywgLy8gS2luZyBvZiBCb3RoIFdvcmxkc1xuICAzMDQ4LCAvLyBRdWVlbiBvZiBMYW5kIGFuZCBXYXRlclxuICAzMDQ5LCAvLyBRdWVlbiBvZiBMYW5kIGFuZCBXYXRlclxuICAzMDYyLCAvLyBIZWxsYnJlZCBHaWFudFxuICAzMDYzLCAvLyBIZWxsYnJlZCBIb3JpdGVcbiAgMzA2NSwgLy8gTWFyYmxlIExpb25cbiAgMzA2NywgLy8gU3BlY3RyYWwgTGljdG9yXG4gIDMwNzAsIC8vIENodW5hcmlcbiAgMzA3NSwgLy8gTGl0dGxlIFNvdWxsZXNzXG4gIDMwNzcsIC8vIE1vcnJpZ25hXG4gIDMwNzgsIC8vIE1vcnJpZ25hXG4gIDMwODQsIC8vIEFtYW5vamFrdVxuICAzMDg1LCAvLyBPbmkgU3Bpcml0XG4gIDMxMDIsIC8vIE5lb2RhbW9kZSBQZWx0YXN0XG4gIDMxMDQsIC8vIE5lb2RhbW9kZSBFa2Ryb21vc1xuICAzMTA2LCAvLyBOZW9kYW1vZGUgSG9wbGl0ZVxuICAzMTEzLCAvLyBLcnlwdGVzXG4gIDMxNDksIC8vIExvY2hvc1xuICAzMTUwLCAvLyBHaWdhbnRlXG4gIDMxNTIsIC8vIFdpbmQgQ2FsbGVyXG4gIDMxODIsIC8vIENvbW1hbmRlclxuICAzMTgzLCAvLyBFa2Ryb21vc1xuICAzMTg0LCAvLyBIb3BsaXRlXG4gIDMxODUsIC8vIEhlYXZ5IEluZmFudHJ5XG4gIDMxODYsIC8vIENvbW1hbmRlclxuICAzMTg3LCAvLyBIZWF2eSBDYXZhbHJ5XG4gIDMxODgsIC8vIEhlYXZ5IEluZmFudHJ5XG4gIDMyMDEsIC8vIEh5ZHJvcGhvcm9zIG9mIHRoZSBFYXN0XG4gIDMyMDIsIC8vIEh5ZHJvcGhvcm9zIG9mIHRoZSBXZXN0XG4gIDMyMDYsIC8vIFRpdGFuIG9mIENyb3Nzcm9hZHNcbiAgMzIwNywgLy8gVGl0YW4gb2YgQ3Jvc3Nyb2Fkc1xuICAzMjE0LCAvLyBJcm9uIEJvdW5kXG4gIDMyMjksIC8vIEZpcnN0IG9mIHRoZSBHaWdhbnRlc1xuICAzMjMwLCAvLyBLaW5nIG9mIHRoZSBHaWdhbnRlc1xuICAzMjMyLCAvLyBJcm9uIEZseVxuICAzMjM3LCAvLyBTaW5pc3RlciBIYXdrXG4gIDMyNDMsIC8vIERpc2NpcGxlIG9mIE15cmRkaW5cbiAgMzI3NCwgLy8gVmFtcGlyZSBDb3VudFxuICAzMjc2LCAvLyBDeW5vY2VwaGFsaWFuIEh1bnRlclxuICAzMjc3LCAvLyBDeW5vY2VwaGFsaWFuIFdhcnJpb3JcbiAgMzI3OCwgLy8gQ3lub2NlcGhhbGlhbiBDaGllZnRhaW5cbiAgMzI3OSwgLy8gQ3lub2NlcGhhbGlhbiBTaGFtYW5cbiAgMzI5MiwgLy8gQXplbmFjaCBBcmNoZXJcbiAgMzI5MywgLy8gQ2FubmliYWwgV2FycmlvclxuICAzMjk0LCAvLyBBZ3JpbWFuZHJpIFdhcnJpb3JcbiAgMzI5NSwgLy8gRm9tbWVwb3JpIFdhcnJpb3JcbiAgMzI5NiwgLy8gVmludGVmb2xlaSBIb3JzZW1hblxuICAzMzA5LCAvLyBYWFhcbiAgMzM2MCwgLy8gTG9uZ2RlYWRcbiAgMzM2MSwgLy8gTG9uZ2RlYWRcbiAgMzM2MiwgLy8gUGljb255ZSBDYXN0ZWxsYW5cbiAgMzM3NywgLy8gUHJlc3RlciBLaW5nXG4gIDMzODMsIC8vIFlsbGVyaW9uXG4gIDMzOTAsIC8vIEhvYnVyZyBTbGluZ2VyXG4gIDMzOTEsIC8vIEhvYnVyZyBTcGVhcm1hblxuICAzMzkyLCAvLyBIb2J1cmcgUGlrZW1hblxuICAzMzkzLCAvLyBIb2J1cmcgRGVmZW5kZXJcbiAgMzQ1MSwgLy8gTmVjcm9kYWlcbiAgMzQ1MiwgLy8gTmVjcm9kYWlcbiAgMzUwMCwgLy8gVGVzdCBHeWdqYVxuICAzNTAxLCAvLyBUZXN0IFNvbGRpZXJcbiAgMzUxMCwgLy8gT3JjaGFyZCBvZiBTb3Vsc1xuICAzNTI0LCAvLyBVbmljb3JuXG4gIDM1MjUsIC8vIEFybW9yZWQgVW5pY29yblxuICAzNTMwLCAvLyBHcmVhdCBNb3VmbG9uXG4gIDM1MzgsIC8vIENhbWVsXG4gIDM1NDMsIC8vICogQmVoZW1vdGhcbiAgMzU0NCwgLy8gR3J5cGhvblxuICAzNTQ3LCAvLyBUaWdlclxuICAzNTQ4LCAvLyBBcm1vcmVkIFRpZ2VyXG4gIDM1NDksIC8vIFNhY3JlZCBUaWdlclxuICAzNTUyLCAvLyAqIEFybW9yZWQgTW9vc2VcbiAgMzU2MiwgLy8gU2tlbGV0YWwgQmVhc3RcbiAgMzU2NCwgLy8gQ2hhcmlvdFxuICAzNTc3LCAvLyBTdGVwcGUgSG9yc2VcbiAgMzU3OCwgLy8gQXJtb3JlZCBTdGVwcGUgSG9yc2VcbiAgMzU3OSwgLy8gQXJtb3JlZCBTdGVwcGUgSG9yc2VcbiAgMzYzNywgLy8gQ2FwdGFpbiBJbGx1c2lvblxuICAzNjQzLCAvLyBFbGVwaGFudCBTcGVhcm1hblxuICAzNjU5LCAvLyBIb211bmN1bHVzXG4gIDM2NjksIC8vIE5pZGFkcm90dFxuICAzNzIyLCAvLyBBaXIgRWxlbWVudGFsXG4gIDM3MzAsIC8vIFdhdGVyIEVsZW1lbnRhbFxuICAzNzM4LCAvLyBFYXJ0aCBFbGVtZW50YWxcbiAgMzc0NiwgLy8gSWNlIEVsZW1lbnRhbFxuICAzNzU0LCAvLyBJbGxlYXJ0aFxuICAzNzY4LCAvLyBTZWF3ZWVkXG4gIDM3NjksIC8vIFNlYXdlZWRcbiAgMzc3MCwgLy8gU2Vhd2VlZFxuICAzNzcxLCAvLyBTZWF3ZWVkXG4gIDM3NzIsIC8vIFNlYXdlZWRcbiAgMzc3MywgLy8gU2Vhd2VlZFxuICAzODMyLCAvLyBEaXZpbmUgSGVyb1xuICAzODMzLCAvLyBEaXZpbmUgU2lieWxcbiAgMzgzNCwgLy8gRGl2aW5lIERhdWdodGVyXG4gIDM4MzUsIC8vIERpdmluZSBTb25cbiAgMzgzNiwgLy8gQmVrcnlkZVxuICAzODM3LCAvLyBCZWtyeWRlXG4gIDM4MzgsIC8vIEJla3J5ZGUgV2FycmlvclxuICAzODM5LCAvLyBCZWtyeWRlIENoYW1waW9uXG4gIDM4NTEsIC8vIENhcnJpb24gQ29tbWFuZGVyXG4gIDM4NTIsIC8vIFZvaWQgRHJlYW1lclxuICAzODUzLCAvLyBWb2lkIEhlcmFsZFxuICAzODcxLCAvLyBMb25nZGVhZCBab3R6XG4gIDM4NzIsIC8vIExvbmdkZWFkIFpvdHpcbiAgMzg3MywgLy8gU291bGxlc3MgWm90elxuICAzODk2LCAvLyBTb3VsbGVzcyBXYXJyaW9yXG4gIDM5ODMsIC8vIFBoYW50YXNtYWwgU2VhIERvZ1xuICAzOTg0LCAvLyBQaGFudGFzbWFsIFRyaXRvblxuICAzOTg1LCAvLyBQaGFudGFzbWFsIEtuaWdodFxuICAzOTkwLCAvLyBWb2lkIEZsYW1lXG4gIDM5OTQsIC8vIEFybW9yZWQgS2VscGllXG4gIDM5OTUsIC8vIEFybW9yZWQgS2VscGllXG5dKTtcblxuXG5cbmV4cG9ydCBjb25zdCBJTkRJRVMgPSBuZXcgU2V0KFtcbiAgOCwgLy8gRWxlcGhhbnQgU3BlYXJtYW5cbiAgMTAsIC8vIFByb2plY3Rpb25cbiAgMTcsIC8vIEFyY2hlclxuICAxOCwgLy8gTWlsaXRpYVxuICAxOSwgLy8gSGVhdnkgQ2F2YWxyeVxuICAyMCwgLy8gSGVhdnkgQ2F2YWxyeVxuICAyMSwgLy8gSGVhdnkgQ2F2YWxyeVxuICAyNCwgLy8gTGlnaHQgQ2F2YWxyeVxuICAyNSwgLy8gTGlnaHQgQ2F2YWxyeVxuICAyNiwgLy8gTGlnaHQgQ2F2YWxyeVxuICAyOCwgLy8gTGlnaHQgSW5mYW50cnlcbiAgMjksIC8vIExpZ2h0IEluZmFudHJ5XG4gIDMwLCAvLyBNaWxpdGlhXG4gIDMxLCAvLyBNaWxpdGlhXG4gIDMyLCAvLyBBcmNoZXJcbiAgMzMsIC8vIEFyY2hlclxuICAzNCwgLy8gQ29tbWFuZGVyXG4gIDM1LCAvLyBDb21tYW5kZXJcbiAgMzYsIC8vIENvbW1hbmRlclxuICAzOCwgLy8gSGVhdnkgSW5mYW50cnlcbiAgMzksIC8vIEhlYXZ5IEluZmFudHJ5XG4gIDQwLCAvLyBIZWF2eSBJbmZhbnRyeVxuICA0NCwgLy8gTW91bnRlZCBDb21tYW5kZXJcbiAgNDUsIC8vIE1vdW50ZWQgQ29tbWFuZGVyXG4gIDQ3LCAvLyBDcm9zc2Jvd21hblxuICA0OCwgLy8gQ3Jvc3Nib3dtYW5cbiAgNDksIC8vIENyb3NzYm93bWFuXG4gIDU1LCAvLyBMb25nYm93bWFuXG4gIDkxLCAvLyBIZWF2eSBDYXZhbHJ5XG4gIDExOCwgLy8gV2FyIE1hc3RlclxuICAxMjEsIC8vIERlbW9uYnJlZFxuICAxMjMsIC8vIFdvbGYgVHJpYmUgQXJjaGVyXG4gIDEyNCwgLy8gV29sZiBUcmliZSBXYXJyaW9yXG4gIDEyNSwgLy8gV29vZHNtYW4gQmxvd3BpcGVcbiAgMTI2LCAvLyBXb29kc21hblxuICAxMzYsIC8vIEhvcnNlIFRyaWJlIENoaWVmXG4gIDEzNywgLy8gSG9yc2UgVHJpYmUgQ2F2YWxyeVxuICAxNTUsIC8vIFZlbGl0ZVxuICAxNzQsIC8vIFRyaXRvblxuICAxNzUsIC8vIFRyaXRvbiBHdWFyZFxuICAxNzYsIC8vIFRyaXRvblxuICAxODIsIC8vIFdyYWl0aCBMb3JkXG4gIDIwNSwgLy8gUmFwdG9yXG4gIDI1MiwgLy8gSGFyYWIgU2VyYXBoXG4gIDI4NSwgLy8gU3BlYXJtYW5cbiAgMjg2LCAvLyBNYWNlbWFuXG4gIDI4NywgLy8gU3dvcmRzbWFuXG4gIDI4OCwgLy8gSGVhdnkgQ3Jvc3Nib3dtYW5cbiAgMjg5LCAvLyBQaWtlbmVlclxuICAyOTAsIC8vIENyb3NzYm93bWFuXG4gIDI5MSwgLy8gQ2FwdGFpblxuICAyOTIsIC8vIEhlYXZ5IENhdmFscnlcbiAgMjkzLCAvLyBDYXB0YWluXG4gIDI5NSwgLy8gU2FjcmVkIFNlcnBlbnRcbiAgMzAyLCAvLyBXaXphcmQgb2YgSGlnaCBNYWdpY3NcbiAgMzIxLCAvLyBMaXphcmQgU2hhbWFuXG4gIDMyNCwgLy8gRHdhcmYgRWxkZXJcbiAgMzI3LCAvLyBBbmF0aGVtYW50XG4gIDMyOCwgLy8gTGl6YXJkIEtpbmdcbiAgMzM0LCAvLyBHb2xkZW4gTmFnYVxuICAzNDYsIC8vIENyeXN0YWwgU29yY2VyZXNzXG4gIDM0NywgLy8gQ3J5c3RhbCBQcmllc3Rlc3NcbiAgMzQ4LCAvLyBBbWF6b25cbiAgMzQ5LCAvLyBHYXJuZXQgU29yY2VyZXNzXG4gIDM1MCwgLy8gR2FybmV0IFByaWVzdGVzc1xuICAzNTEsIC8vIEFtYXpvblxuICAzNTIsIC8vIEphZGUgU29yY2VyZXNzXG4gIDM1MywgLy8gSmFkZSBQcmllc3Rlc3NcbiAgMzU0LCAvLyBBbWF6b25cbiAgMzU1LCAvLyBPbnl4IFNvcmNlcmVzc1xuICAzNTYsIC8vIE9ueXggUHJpZXN0ZXNzXG4gIDM1NywgLy8gQW1hem9uXG4gIDM2NywgLy8gUGVnYXN1cyBSaWRlclxuICAzNjksIC8vIE5pZ2h0bWFyZSBSaWRlclxuICAzNzAsIC8vIEphZGUgTWFpZGVuXG4gIDM3NCwgLy8gUXVlZW4gTW90aGVyXG4gIDQxNSwgLy8gSGlnaCBTZXJhcGhcbiAgNDE2LCAvLyBTZXJhcGhpbmVcbiAgNDIzLCAvLyBMaXphcmQgV2FycmlvclxuICA0MjcsIC8vIFNweVxuICA1NDIsIC8vIFN0b25lIE1vbnN0cmFcbiAgNTQ4LCAvLyBIb2J1cmcgSGVyb1xuICA0MDEyLCAvLyBWYWV0dGkgQXJjaGVyXG4gIDQwMTMsIC8vIEVsZXBoYW50IEFyY2hlclxuICA0MDE0LCAvLyBDaGFyaW90IEFyY2hlclxuICA0MDE1LCAvLyBNYW1tb3RoIEFyY2hlclxuICA0MDE2LCAvLyBDaGFyaW90IEFyY2hlclxuICA0MDE3LCAvLyBFbGVwaGFudCBBcmNoZXJcbiAgNDAxOCwgLy8gRWxlcGhhbnQgQXJjaGVyXG4gIDQwMTksIC8vIEVsZXBoYW50IEFyY2hlclxuXSk7XG5cblxuZXhwb3J0IGNvbnN0IEZSRUVTUEFXTiA9IG5ldyBTZXQoW1xuXG5dKVxuXG5leHBvcnQgY29uc3QgVU5ERUFEID0gbmV3IFNldChbXG4gIDUzNiwgLy8gTG9uZ2RlYWQgQnVjY2FuZWVyXG4gIDU0NywgLy8gRGVhZCBPbmVcbiAgMTg0LCAvLyBLbmlnaHQgb2YgdGhlIFVuaG9seSBTZXB1bGNocmVcbiAgMTg2LCAvLyBMb25nZGVhZCBWZWxpdGVcbiAgMTkwLCAvLyBNb3VuZCBLaW5nXG4gIDE5MSwgLy8gTG9uZ2RlYWRcbiAgMTkyLCAvLyBMb25nZGVhZFxuICAxOTMsIC8vIExvbmdkZWFkXG4gIDE5NCwgLy8gTG9uZ2RlYWRcbiAgMTk1LCAvLyBMb25nZGVhZFxuICAzMTUsIC8vIFNvdWxsZXNzIEdpYW50XG4gIDMxNiwgLy8gTG9uZ2RlYWQgR2lhbnRcbiAgMzE3LCAvLyBTb3VsbGVzc1xuICAzMTksIC8vIFNvdWxsZXNzIG9mIEMndGlzXG4gIDM5OCwgLy8gTXVtbXlcbiAgNDA4LCAvLyBEZWVyIENhcmNhc3NcbiAgMzkyLCAvLyBBc2hlbiBBbmdlbCAvLyBldmVudCBndXk/XG4gIDYxMywgLy8gTG9uZ2RlYWQgQWRtaXJhbFxuICA2MTUsIC8vIExvbmdkZWFkIG9mIEMndGlzXG4gIDYxNiwgLy8gTG9uZ2RlYWQgb2YgQyd0aXNcbiAgNjE3LCAvLyBMb25nZGVhZCBvZiBDJ3Rpc1xuXG4gIDYyNCwgLy8gT2xkIEtpbmdcbl0pXG5cbmV4cG9ydCBjb25zdCBERUJVR0dFUlMgPSBuZXcgU2V0KFtcbiAgNDAyNCwgLy8gRGVidWcgU2VucGFpXG4gIDQwMjUsIC8vIERlYnVnIEtvaGFpXG5dKTtcblxuICAvLyB1bnVzZWQ/XG5leHBvcnQgY29uc3QgTk9fSURFQSA9IG5ldyBTZXQoW1xuXG4gIDYyMywgLy8gS2luZyBvZiB0aGUgV29ybGQgKGhvcnJvcj8/PylcbiAgMzY4LCAvLyBHcnlwaG9uIC0gWFhYXG4gIDU1NCwgLy8gRXJtb3JpYW4gQ3VsdGlzdCAvLyBldmVudD9cbiAgMzgyLCAvLyBNeXN0aWNcbiAgMjk1LCAvLyBTYWNyZWQgU2VycGVudCAoY3Rpcz8pXG4gIDU0MiwgLy8gU3RvbmUgTW9uc3RyYVxuICA1NDMsIC8vIEFuZ2VsIFhYWCBvbGQgYW5nZWxpYyBob3N0IHN1bW1vbj9cbiAgMzY4LCAvLyBHcnlwaG9uIC0gWFhYXG5cbiAgLy8gcHJldHR5IHN1cmUgdGhlc2UgYXJlIGp1c3Qgc3VtbW9ucyBmcm9tIGBuZXh0c3BlbGxgc1xuICAxODIsIC8vIFdyYWl0aCBMb3JkIChpc250IHRoZXJlIGEgc3BlbGw/KVxuICAzOTA2LCAvLyBVbnNlZWxpZSBTb2xkaWVyXG4gIDM5MDcsIC8vIFVuc2VlbGllIEtuaWdodFxuICAzOTA5LCAvLyBVbnNlZWxpZSBQcmluY2VcbiAgMzkxMiwgLy8gRmF5IEZvbGtcbiAgMzkxMywgLy8gRmF5IEZvbGtcbiAgMzkxNCwgLy8gRmF5IEZvbGtcbiAgMzkxNSwgLy8gRmF5IEZvbGtcbiAgMzkxNiwgLy8gRmF5IEZvbGtcbiAgMzkxNywgLy8gRmF5IEZvbGtcbiAgMzk5NywgLy8gUXVlZW4gb2YgV2ludGVyIChQUkVURU5ERVI/Pz8pXG5dKVxuXG5leHBvcnQgY29uc3QgQU5JTUFMUyA9IG5ldyBTZXQoW1xuICA0LCAvLyBTZXJwZW50XG4gIDU5MSwgLy8gRHJhZ29uZmx5XG4gIDQxMCwgLy8gR2lhbnQgUmF0XG4gIDQwMDAsIC8vIEhvcnNlIChsaWtlIGEgZ2VuZXJpYyBtb3VudD8pXG5dKVxuXG5leHBvcnQgY29uc3QgSE9SUk9SUyA9IG5ldyBTZXQoW1xuICAzMDcsIC8vIExlc3NlciBIb3Jyb3JcbiAgMzA4LCAvLyBIb3Jyb3JcbiAgMjIwOSwgLy8gSG9ycm9yIE1hbnRpc1xuICAyMjEwLCAvLyBGbG9hdCBDYXQgSG9ycm9yXG4gIDIyMTEsIC8vIE1pbmQgU2xpbWUgSG9ycm9yXG4gIDIyMTIsIC8vIFNvdWx0b3JuXG4gIDIyMTMsIC8vIEdvcmUgVGlkZSBIb3Jyb3JcbiAgMjIxNCwgLy8gU3BpbmUgTWVtYnJhbmUgSG9ycm9yXG4gIDIyMTUsIC8vIEJlbGx5IE1hdyBIb3Jyb3JcbiAgMjIxNiwgLy8gQnJhc3MgQ2xhdyBIb3Jyb3Jcbl0pXG4iLCAiXG5pbXBvcnQge1xuICBCb29sQ29sdW1uLFxuICBDT0xVTU4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIFNjaGVtYSxcbiAgVGFibGVcbn0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmltcG9ydCAqIGFzIE1JU0MgZnJvbSAnLi9taXNjLWRlZnMnO1xuXG50eXBlIFRSID0gUmVjb3JkPHN0cmluZywgVGFibGU+O1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5EdW1wZWQgKHRhYmxlTGlzdDogVGFibGVbXSkge1xuICBjb25zdCB0YWJsZXM6IFRSID0gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlTGlzdC5tYXAodCA9PiBbdC5uYW1lLCB0XSkpO1xuICB0YWJsZUxpc3QucHVzaChcbiAgICBtYWtlTmF0aW9uU2l0ZXModGFibGVzKSxcbiAgICBtYWtlVW5pdEJ5U2l0ZSh0YWJsZXMpLFxuICAgIG1ha2VTcGVsbEJ5TmF0aW9uKHRhYmxlcyksXG4gICAgbWFrZVNwZWxsQnlVbml0KHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeU5hdGlvbih0YWJsZXMpLFxuICAgIG1ha2VVbml0QnlVbml0U3VtbW9uKHRhYmxlcyksXG4gICAgbWFrZVVuaXRCeVNwZWxsKHRhYmxlcyksXG4gICk7XG4gIG1ha2VNaXNjVW5pdCh0YWJsZXMpO1xuXG4gIC8vZHVtcFJlYWxtcyh0YWJsZXMpO1xuXG4gIC8vIHRhYmxlcyBoYXZlIGJlZW4gY29tYmluZWR+IVxuICBmb3IgKGNvbnN0IHQgb2YgW1xuICAgIHRhYmxlcy5Db2FzdExlYWRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuQ29hc3RUcm9vcFR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuRm9ydExlYWRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuRm9ydFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Ob25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLFxuICAgIHRhYmxlcy5Ob25Gb3J0VHJvb3BUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLlByZXRlbmRlclR5cGVCeU5hdGlvbixcbiAgICB0YWJsZXMuVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgdGFibGVzLlJlYWxtLFxuICBdKSB7XG4gICAgVGFibGUucmVtb3ZlVGFibGUodCwgdGFibGVMaXN0KTtcbiAgfVxuXG59XG5cbmZ1bmN0aW9uIGR1bXBSZWFsbXMgKHsgUmVhbG0sIFVuaXQgfTogVFIpIHtcbiAgLy8gc2VlbXMgbGlrZSB0aGUgcmVhbG0gY3N2IGlzIHJlZHVuZGFudD9cbiAgY29uc29sZS5sb2coJ1JFQUxNIFNUQVRTOicpXG4gIGNvbnNvbGUubG9nKFJlYWxtLnJvd3MpO1xuICAvKlxuICBjb25zdCBjb21iaW5lZCA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXI+KCk7XG5cbiAgZm9yIChjb25zdCB1IG9mIFVuaXQucm93cykgaWYgKHUucmVhbG0xKSBjb21iaW5lZC5zZXQodS5pZCwgdS5yZWFsbTEpO1xuXG4gIGZvciAoY29uc3QgeyBtb25zdGVyX251bWJlciwgcmVhbG0gfSBvZiBSZWFsbS5yb3dzKSB7XG4gICAgaWYgKCFjb21iaW5lZC5oYXMobW9uc3Rlcl9udW1iZXIpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHttb25zdGVyX251bWJlcn0gUkVBTE0gSVMgREVGSU5FRCBPTkxZIElOIFJFQUxNUyBDU1ZgKTtcbiAgICAgIGNvbWJpbmVkLnNldChtb25zdGVyX251bWJlciwgcmVhbG0pO1xuICAgIH0gZWxzZSBpZiAoY29tYmluZWQuZ2V0KG1vbnN0ZXJfbnVtYmVyKSAhPT0gcmVhbG0pIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke21vbnN0ZXJfbnVtYmVyfSBSRUFMTSBDT05GTElDVCEgdW5pdC5jc3YgPSAke2NvbWJpbmVkLmdldChtb25zdGVyX251bWJlcil9LCByZWFsbS5jc3Y9JHtyZWFsbX1gKTtcbiAgICB9XG4gIH1cbiAgKi9cbn1cblxuXG5jb25zdCBBVFRSX0ZBUlNVTUNPTSA9IDc5MDsgLy8gbHVsIHdoeSBpcyB0aGlzIHRoZSBvbmx5IG9uZT8/XG4vLyBUT0RPIC0gcmVhbmltYXRpb25zIGFzd2VsbD8gdHdpY2Vib3JuIHRvbz8gbGVtdXJpYS1lc3F1ZSBmcmVlc3Bhd24/IHZvaWRnYXRlP1xuLy8gbWlnaHQgaGF2ZSB0byBhZGQgYWxsIHRoYXQgbWFudWFsbHksIHdoaWNoIHNob3VsZCBiZSBva2F5IHNpbmNlIGl0J3Mgbm90IGxpa2Vcbi8vIHRoZXkncmUgYWNjZXNzaWJsZSB0byBtb2RzIGFueXdheT9cbi8vIHNvb24gVE9ETyAtIHN1bW1vbnMsIGV2ZW50IG1vbnN0ZXJzL2hlcm9zXG4vKlxubm90IHVzZWQsIGp1c3Qga2VlcGluZyBmb3Igbm90ZXNcbmV4cG9ydCBjb25zdCBlbnVtIFJFQ19TUkMge1xuICBVTktOT1dOID0gMCwgLy8gaS5lLiBub25lIGZvdW5kLCBwcm9iYWJseSBpbmRpZSBwZD9cbiAgU1VNTU9OX0FMTElFUyA9IDEsIC8vIHZpYSAjbWFrZW1vbnN0ZXJOXG4gIFNVTU1PTl9ET00gPSAyLCAvLyB2aWEgI1tyYXJlXWRvbXN1bW1vbk5cbiAgU1VNTU9OX0FVVE8gPSAzLCAvLyB2aWEgI3N1bW1vbk4gLyBcInR1cm1vaWxzdW1tb25cIiAvIHdpbnRlcnN1bW1vbjFkM1xuICBTVU1NT05fQkFUVExFID0gNCwgLy8gdmlhICNiYXRzdGFydHN1bU4gb3IgI2JhdHRsZXN1bVxuICBURU1QTEVfVFJBSU5FUiA9IDUsIC8vIHZpYSAjdGVtcGxldHJhaW5lciwgdmFsdWUgaXMgaGFyZCBjb2RlZCB0byAxODU5Li4uXG4gIFJJVFVBTCA9IDYsXG4gIEVOVEVSX1NJVEUgPSA3LFxuICBSRUNfU0lURSA9IDgsXG4gIFJFQ19DQVAgPSA5LFxuICBSRUNfRk9SRUlHTiA9IDEwLFxuICBSRUNfRk9SVCA9IDExLFxuICBFVkVOVCA9IDEyLFxuICBIRVJPID0gMTMsXG4gIFBSRVRFTkRFUiA9IDE0LFxufVxuKi9cblxuLy8gVE9ETyAtIGV4cG9ydCB0aGVzZSBmcm9tIHNvbWV3aGVyZSBtb3JlIHNlbnNpYmxlXG5leHBvcnQgY29uc3QgZW51bSBSRUNfVFlQRSB7XG4gIEZPUlQgPSAwLCAvLyBub3JtYWwgaSBndWVzc1xuICBQUkVURU5ERVIgPSAxLCAvLyB1IGhlYXJkIGl0IGhlcmVcbiAgRk9SRUlHTiA9IDIsXG4gIFdBVEVSID0gMyxcbiAgQ09BU1QgPSA0LFxuICBGT1JFU1QgPSA1LFxuICBTV0FNUCA9IDYsXG4gIFdBU1RFID0gNyxcbiAgTU9VTlRBSU4gPSA4LFxuICBDQVZFID0gOSxcbiAgUExBSU5TID0gMTAsXG4gIEhFUk8gPSAxMSxcbiAgTVVMVElIRVJPID0gMTIsXG4gIFBSRVRFTkRFUl9DSEVBUF8yMCA9IDEzLFxuICBQUkVURU5ERVJfQ0hFQVBfNDAgPSAxNCxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gVU5JVF9UWVBFIHtcbiAgTk9ORSA9IDAsICAgICAgLy8ganVzdCBhIHVuaXQuLi5cbiAgQ09NTUFOREVSID0gMSxcbiAgUFJFVEVOREVSID0gMixcbiAgQ0FQT05MWSA9IDQsXG4gIEhFUk8gPSA4LFxufVxuXG5cbmV4cG9ydCBjb25zdCBSZWFsbU5hbWVzID0gW1xuICAnTm9uZScsXG4gICdOb3J0aCcsXG4gICdDZWx0aWMnLFxuICAnTWVkaXRlcnJhbmVhbicsXG4gICdGYXIgRWFzdCcsXG4gICdNaWRkbGUgRWFzdCcsXG4gICdNaWRkbGUgQW1lcmljYScsXG4gICdBZnJpY2EnLFxuICAnSW5kaWEnLFxuICAnRGVlcHMnLFxuICAnRGVmYXVsdCdcbl07XG5mdW5jdGlvbiBtYWtlTmF0aW9uU2l0ZXModGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBBdHRyaWJ1dGVCeU5hdGlvbiwgTmF0aW9uIH0gPSB0YWJsZXM7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTaXRlQnlOYXRpb24nLFxuICAgIGtleTogJ19fcm93SWQnLFxuICAgIGZsYWdzVXNlZDogMSxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczoge30sXG4gICAgam9pbnM6ICdOYXRpb25bbmF0aW9uSWRdPVNpdGVzK01hZ2ljU2l0ZVtzaXRlSWRdPU5hdGlvbnMnLFxuICAgIGZpZWxkczogW1xuICAgICAgJ25hdGlvbklkJyxcbiAgICAgICdzaXRlSWQnLFxuICAgICAgJ2Z1dHVyZScsXG4gICAgXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NpdGVJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgQm9vbENvbHVtbih7XG4gICAgICAgIG5hbWU6ICdmdXR1cmUnLFxuICAgICAgICBpbmRleDogMixcbiAgICAgICAgdHlwZTogQ09MVU1OLkJPT0wsXG4gICAgICAgIGJpdDogMCxcbiAgICAgICAgZmxhZzogMVxuICAgICAgfSksXG4gICAgXVxuICB9KTtcblxuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW11cbiAgZm9yIChsZXQgW2ksIHJvd10gb2YgQXR0cmlidXRlQnlOYXRpb24ucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IG5hdGlvbl9udW1iZXI6IG5hdGlvbklkLCBhdHRyaWJ1dGUsIHJhd192YWx1ZTogc2l0ZUlkIH0gPSByb3c7XG4gICAgbGV0IGZ1dHVyZTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICAvLyB3aGlsZSB3ZSdyZSBoZXJlLCBsZXRzIHB1dCByZWFsbSBpZCByaWdodCBvbiB0aGUgbmF0aW9uIChleHRyYUZpZWxkIGluIGRlZilcbiAgICAgIGNhc2UgMjg5OlxuICAgICAgICAvL2NvbnNvbGUubG9nKGBuYXRpb25hbCByZWFsbTogJHtuYXRpb25JZH0gLT4gJHtzaXRlSWR9YClcbiAgICAgICAgY29uc3QgbmF0aW9uID0gTmF0aW9uLm1hcC5nZXQobmF0aW9uSWQpO1xuICAgICAgICBpZiAoIW5hdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGludmFsaWQgbmF0aW9uIGlkICR7bmF0aW9uSWR9IChubyByb3cgaW4gTmF0aW9uKWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNvbmZ1c2luZyEgdG9ucyBvZiBuYXRpb25zIGhhdmUgbXVsdGlwbGUgcmVhbG1zPyBqdXN0IHVzZSB0aGUgbW9zdFxuICAgICAgICAgIC8vIHJlY2VudCBvbmUgSSBndWVzcz9cbiAgICAgICAgICAvL2lmIChuYXRpb24ucmVhbG0pIHtcbiAgICAgICAgICAgIC8vY29uc3QgcHJldiA9IFJlYWxtTmFtZXNbbmF0aW9uLnJlYWxtXTtcbiAgICAgICAgICAgIC8vY29uc3QgbmV4dCA9IFJlYWxtTmFtZXNbc2l0ZUlkXTtcbiAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihgJHtuYXRpb24ubmFtZX0gUkVBTE0gJHtwcmV2fSAtPiAke25leHR9YCk7XG4gICAgICAgICAgLy99XG4gICAgICAgICAgbmF0aW9uLnJlYWxtID0gc2l0ZUlkO1xuICAgICAgICB9XG4gICAgICAgIGRlbFJvd3MucHVzaChpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICAvLyBmdXR1cmUgc2l0ZVxuICAgICAgY2FzZSA2MzE6XG4gICAgICAgIGZ1dHVyZSA9IHRydWU7XG4gICAgICAgIC8vIHUga25vdyB0aGlzIGJpdGNoIGZhbGxzIFRIUlVcbiAgICAgIC8vIHN0YXJ0IHNpdGVcbiAgICAgIGNhc2UgNTI6XG4gICAgICBjYXNlIDEwMDpcbiAgICAgIGNhc2UgMjU6XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gc29tZSBvdGhlciBkdW1iYXNzIGF0dHJpYnV0ZVxuICAgICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByb3dzLnB1c2goe1xuICAgICAgbmF0aW9uSWQsXG4gICAgICBzaXRlSWQsXG4gICAgICBmdXR1cmUsXG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICB9KTtcbiAgICBkZWxSb3dzLnB1c2goaSk7XG4gIH1cblxuICAvLyByZW1vdmUgbm93LXJlZHVuZGFudCBhdHRyaWJ1dGVzXG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIHRydWVcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNwZWxsQnlOYXRpb24gKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1NwZWxsW3NwZWxsSWRdPU5hdGlvbnMrTmF0aW9uW25hdGlvbklkXT1TcGVsbHMnLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBvdmVycmlkZXM6IHt9LFxuICAgIHJhd0ZpZWxkczogeyBzcGVsbElkOiAwLCBuYXRpb25JZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ25hdGlvbklkJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gMjc4KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gTkFUSU9OICR7cmF3X3ZhbHVlfWApO1xuICAgICAgY29uc3QgbmF0aW9uSWQgPSBOdW1iZXIocmF3X3ZhbHVlKTtcbiAgICAgIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobmF0aW9uSWQpIHx8IG5hdGlvbklkIDwgMCB8fCBuYXRpb25JZCA+IDI1NSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAgICAgICEhISEhIFRPTyBCSUcgTkFZU0ggISEhISEgKCR7bmF0aW9uSWR9KWApO1xuICAgICAgZGVsUm93cy5wdXNoKGkpO1xuICAgICAgcm93cy5wdXNoKHsgX19yb3dJZCwgc3BlbGxJZCwgbmF0aW9uSWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbFJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpIGF0dHJzLnJvd3Muc3BsaWNlKGRpLCAxKTtcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICBmYWxzZVxuICApO1xufVxuXG5mdW5jdGlvbiBtYWtlU3BlbGxCeVVuaXQgKHRhYmxlczogVFIpOiBUYWJsZSB7XG4gIGNvbnN0IGF0dHJzID0gdGFibGVzLkF0dHJpYnV0ZUJ5U3BlbGw7XG4gIGNvbnN0IGRlbFJvd3M6IG51bWJlcltdID0gW107XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdTcGVsbEJ5VW5pdCcsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdTcGVsbFtzcGVsbElkXT1Pbmx5VW5pdHMrVW5pdFt1bml0SWRdPVNwZWxscycsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgcmF3RmllbGRzOiB7IHNwZWxsSWQ6IDAsIHVuaXRJZDogMSB9LFxuICAgIGZpZWxkczogWydzcGVsbElkJywgJ3VuaXRJZCddLFxuICAgIGNvbHVtbnM6IFtcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3NwZWxsSWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICBdXG4gIH0pO1xuXG4gIGxldCBfX3Jvd0lkID0gMDtcbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcbiAgZm9yIChjb25zdCBbaSwgcl0gb2YgYXR0cnMucm93cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCB7IHNwZWxsX251bWJlcjogc3BlbGxJZCwgYXR0cmlidXRlLCByYXdfdmFsdWUgfSA9IHI7XG4gICAgaWYgKGF0dHJpYnV0ZSA9PT0gNzMxKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAke3NwZWxsSWR9IElTIFJFU1RSSUNURUQgVE8gVU5JVCAke3Jhd192YWx1ZX1gKTtcbiAgICAgIGNvbnN0IHVuaXRJZCA9IE51bWJlcihyYXdfdmFsdWUpO1xuICAgICAgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcih1bml0SWQpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCAgICAgISEhISEgVE9PIEJJRyBVTklUICEhISEhICgke3VuaXRJZH0pYCk7XG4gICAgICBkZWxSb3dzLnB1c2goaSk7XG4gICAgICByb3dzLnB1c2goeyBfX3Jvd0lkLCBzcGVsbElkLCB1bml0SWQgfSk7XG4gICAgICBfX3Jvd0lkKys7XG4gICAgfVxuICB9XG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICB3aGlsZSAoKGRpID0gZGVsUm93cy5wb3AoKSkgIT09IHVuZGVmaW5lZCkgYXR0cnMucm93cy5zcGxpY2UoZGksIDEpO1xuXG4gIHJldHVybiB0YWJsZXNbc2NoZW1hLm5hbWVdID0gVGFibGUuYXBwbHlMYXRlSm9pbnMoXG4gICAgbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSksXG4gICAgdGFibGVzLFxuICAgIGZhbHNlXG4gICk7XG59XG5cbi8vIGZldyB0aGluZ3MgaGVyZTpcbi8vIC0gaG1vbjEtNSAmIGhjb20xLTQgYXJlIGNhcC1vbmx5IHVuaXRzL2NvbW1hbmRlcnNcbi8vIC0gbmF0aW9uYWxyZWNydWl0cyArIG5hdGNvbSAvIG5hdG1vbiBhcmUgbm9uLWNhcCBvbmx5IHNpdGUtZXhjbHVzaXZlcyAoeWF5KVxuLy8gLSBtb24xLTIgJiBjb20xLTMgYXJlIGdlbmVyaWMgcmVjcnVpdGFibGUgdW5pdHMvY29tbWFuZGVyc1xuLy8gLSBzdW0xLTQgJiBuX3N1bTEtNCBhcmUgbWFnZS1zdW1tb25hYmxlIChuIGRldGVybWluZXMgbWFnZSBsdmwgcmVxKVxuLy8gKHZvaWRnYXRlIC0gbm90IHJlYWxseSByZWxldmFudCBoZXJlLCBpdCBkb2Vzbid0IGluZGljYXRlIHdoYXQgbW9uc3RlcnMgYXJlXG4vLyBzdW1tb25lZCwgbWF5IGFkZCB0aG9zZSBtYW51YWxseT8pXG5cbmV4cG9ydCBlbnVtIFNJVEVfUkVDIHtcbiAgSE9NRV9NT04gPSAwLCAvLyBhcmcgaXMgbmF0aW9uLCB3ZSdsbCBoYXZlIHRvIGFkZCBpdCBsYXRlciB0aG91Z2hcbiAgSE9NRV9DT00gPSAxLCAvLyBzYW1lXG4gIFJFQ19NT04gPSAyLFxuICBSRUNfQ09NID0gMyxcbiAgTkFUX01PTiA9IDQsIC8vIGFyZyBpcyBuYXRpb25cbiAgTkFUX0NPTSA9IDUsIC8vIHNhbWVcbiAgU1VNTU9OID0gOCwgLy8gYXJnIGlzIGxldmVsIHJlcXVpcmVtZW50IChpbmNsdWRlIHBhdGg/KVxufVxuXG5jb25zdCBTX0hNT05TID0gQXJyYXkuZnJvbSgnMTIzNDUnLCBuID0+IGBobW9uJHtufWApO1xuY29uc3QgU19IQ09NUyA9IEFycmF5LmZyb20oJzEyMzQnLCBuID0+IGBoY29tJHtufWApO1xuY29uc3QgU19STU9OUyA9IEFycmF5LmZyb20oJzEyJywgbiA9PiBgbW9uJHtufWApO1xuY29uc3QgU19SQ09NUyA9IEFycmF5LmZyb20oJzEyMycsIG4gPT4gYGNvbSR7bn1gKTtcbmNvbnN0IFNfU1VNTlMgPSBBcnJheS5mcm9tKCcxMjM0JywgbiA9PiBbYHN1bSR7bn1gLCBgbl9zdW0ke259YF0pO1xuXG5mdW5jdGlvbiBtYWtlVW5pdEJ5U2l0ZSAodGFibGVzOiBUUik6IFRhYmxlIHtcbiAgY29uc3QgeyBNYWdpY1NpdGUsIFNpdGVCeU5hdGlvbiwgVW5pdCB9ID0gdGFibGVzO1xuICBpZiAoIVNpdGVCeU5hdGlvbikgdGhyb3cgbmV3IEVycm9yKCdkbyBTaXRlQnlOYXRpb24gZmlyc3QnKTtcblxuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5U2l0ZScsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdNYWdpY1NpdGVbc2l0ZUlkXT1Vbml0cytVbml0W3VuaXRJZF09U291cmNlJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgc2l0ZUlkOiAwLCB1bml0SWQ6IDEsIHJlY1R5cGU6IDIsIHJlY0FyZzogMyB9LFxuICAgIGZpZWxkczogWydzaXRlSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnLCAncmVjQXJnJ10sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc2l0ZUlkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAncmVjQXJnJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmb3IgKGNvbnN0IHNpdGUgb2YgTWFnaWNTaXRlLnJvd3MpIHtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU19ITU9OUykge1xuICAgICAgY29uc3QgbW5yID0gc2l0ZVtrXTtcbiAgICAgIC8vIHdlIGFzc3VtZSB0aGUgZmllbGRzIGFyZSBhbHdheXMgdXNlZCBpbiBvcmRlclxuICAgICAgaWYgKCFtbnIpIGJyZWFrO1xuICAgICAgbGV0IHJlY0FyZyA9IDA7XG4gICAgICBjb25zdCBuaiA9IHNpdGUuTmF0aW9ucz8uZmluZCgoeyBzaXRlSWQgfSkgPT4gc2l0ZUlkID09PSBzaXRlLmlkKTtcbiAgICAgIGlmICghbmopIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAnbWl4ZWQgdXAgY2FwLW9ubHkgbW9uIHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuTmF0aW9uc1xuICAgICAgICApO1xuICAgICAgICByZWNBcmcgPSAwO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25paWlpY2UnLCBuaiwgc2l0ZS5OYXRpb25zKVxuICAgICAgICByZWNBcmcgPSBuai5uYXRpb25JZDtcbiAgICAgIH1cbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNBcmcsXG4gICAgICAgIHJlY1R5cGU6IFNJVEVfUkVDLkhPTUVfTU9OLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX0hDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBsZXQgcmVjQXJnID0gMDtcbiAgICAgIGNvbnN0IG5qID0gc2l0ZS5OYXRpb25zPy5maW5kKCh7IHNpdGVJZCB9KSA9PiBzaXRlSWQgPT09IHNpdGUuaWQpO1xuICAgICAgaWYgKCFuaikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICdtaXhlZCB1cCBjYXAtb25seSBjbWRyIHNpdGUnLCBrLCBzaXRlLmlkLCBzaXRlLm5hbWUsIHNpdGUuTmF0aW9uc1xuICAgICAgICApO1xuICAgICAgICByZWNBcmcgPSAwO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY0FyZyA9IG5qLm5hdGlvbklkO1xuICAgICAgfVxuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldChtbnIpO1xuICAgICAgaWYgKHVuaXQpIHtcbiAgICAgICAgdW5pdC50eXBlIHw9IDE7IC8vIGZsYWcgYXMgYSBjb21tYW5kZXJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ21peGVkIHVwIGNhcC1vbmx5IHNpdGUgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgIHNpdGVJZDogc2l0ZS5pZCxcbiAgICAgICAgdW5pdElkOiBtbnIsXG4gICAgICAgIHJlY0FyZyxcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuSE9NRV9DT00sXG4gICAgICB9KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrIG9mIFNfUk1PTlMpIHtcbiAgICAgIGNvbnN0IG1uciA9IHNpdGVba107XG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgayBvZiBTX1JDT01TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KG1ucik7XG4gICAgICBpZiAodW5pdCkge1xuICAgICAgICB1bml0LnR5cGUgfD0gMTsgLy8gZmxhZyBhcyBhIGNvbW1hbmRlclxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgc2l0ZSBjb21tYW5kZXIgKG5vIHVuaXQgaW4gdW5pdCB0YWJsZT8pJywgc2l0ZSk7XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IG1ucixcbiAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuUkVDX01PTixcbiAgICAgICAgcmVjQXJnOiAwLFxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2ssIG5rXSBvZiBTX1NVTU5TKSB7XG4gICAgICBjb25zdCBtbnIgPSBzaXRlW2tdO1xuICAgICAgLy8gd2UgYXNzdW1lIHRoZSBmaWVsZHMgYXJlIGFsd2F5cyB1c2VkIGluIG9yZGVyXG4gICAgICBpZiAoIW1ucikgYnJlYWs7XG4gICAgICBjb25zdCBhcmcgPSBzaXRlW25rXTtcbiAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzaXRlSWQ6IHNpdGUuaWQsXG4gICAgICAgIHVuaXRJZDogbW5yLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5TVU1NT04sXG4gICAgICAgIHJlY0FyZzogYXJnLCAvLyBsZXZlbCByZXF1aXVyZW1lbnQgKGNvdWxkIGFsc28gaW5jbHVkZSBwYXRoKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNpdGUubmF0aW9uYWxyZWNydWl0cykge1xuICAgICAgaWYgKHNpdGUubmF0bW9uKSByb3dzLnB1c2goe1xuICAgICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICB1bml0SWQ6IHNpdGUubmF0bW9uLFxuICAgICAgICByZWNUeXBlOiBTSVRFX1JFQy5OQVRfTU9OLFxuICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgIH0pO1xuICAgICAgaWYgKHNpdGUubmF0Y29tKSB7XG4gICAgICAgIHJvd3MucHVzaCh7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc2l0ZUlkOiBzaXRlLmlkLFxuICAgICAgICAgIHVuaXRJZDogc2l0ZS5uYXRjb20sXG4gICAgICAgICAgcmVjVHlwZTogU0lURV9SRUMuTkFUX0NPTSxcbiAgICAgICAgICByZWNBcmc6IHNpdGUubmF0aW9uYWxyZWNydWl0cyxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQoc2l0ZS5uYXRjb20pO1xuICAgICAgICBpZiAodW5pdCkge1xuICAgICAgICAgIHVuaXQudHlwZSB8PSAxOyAvLyBmbGFnIGFzIGEgY29tbWFuZGVyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignbWl4ZWQgdXAgbmF0Y29tIChubyB1bml0IGluIHVuaXQgdGFibGU/KScsIHNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHlheSFcbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZVxuICApO1xuXG59XG5cbiAgLypcbmNvbnN0IFNVTV9GSUVMRFMgPSBbXG4gIC8vIHRoZXNlIHR3byBjb21iaW5lZCBzZWVtIHRvIGJlIHN1bW1vbiAjbWFrZW1vbnN0ZXJOXG4gICdzdW1tb24nLCAnbl9zdW1tb24nLFxuICAvLyB0aGlzIGlzIHVzZWQgYnkgdGhlIGdob3VsIGxvcmQgb25seSwgYW5kIGl0IHNob3VsZCBhY3R1YWxseSBiZSBgbl9zdW1tb24gPSA1YFxuICAnc3VtbW9uNScsXG4gIC8vIGF1dG8gc3VtbW9uIDEvbW9udGgsIGFzIHBlciBtb2QgY29tbWFuZHMsIHVzZWQgb25seSBieSBmYWxzZSBwcm9waGV0IGFuZCB2aW5lIGd1eT9cbiAgJ3N1bW1vbjEnLFxuXG4gIC8vIGRvbSBzdW1tb24gY29tbWFuZHNcbiAgJ2RvbXN1bW1vbicsXG4gICdkb21zdW1tb24yJyxcbiAgJ2RvbXN1bW1vbjIwJyxcbiAgJ3JhcmVkb21zdW1tb24nLFxuXG4gICdiYXRzdGFydHN1bTEnLFxuICAnYmF0c3RhcnRzdW0yJyxcbiAgJ2JhdHN0YXJ0c3VtMycsXG4gICdiYXRzdGFydHN1bTQnLFxuICAnYmF0c3RhcnRzdW01JyxcbiAgJ2JhdHN0YXJ0c3VtMWQzJyxcbiAgJ2JhdHN0YXJ0c3VtMWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtMmQ2JyxcbiAgJ2JhdHN0YXJ0c3VtM2Q2JyxcbiAgJ2JhdHN0YXJ0c3VtNGQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNWQ2JyxcbiAgJ2JhdHN0YXJ0c3VtNmQ2JyxcbiAgJ2JhdHRsZXN1bTUnLCAvLyBwZXIgcm91bmRcblxuICAvLydvbmlzdW1tb24nLCB3ZSBkb250IHJlYWxseSBjYXJlIGFib3V0IHRoaXMgb25lIGJlY2F1c2UgaXQgZG9lc250IHRlbGwgdXNcbiAgLy8gIGFib3V0IHdoaWNoIG1vbnN0ZXJzIGFyZSBzdW1tb25lZFxuICAvLyAnaGVhdGhlbnN1bW1vbicsIGlkZms/PyBodHRwczovL2lsbHdpa2kuY29tL2RvbTUvdXNlci9sb2dneS9zbGF2ZXJcbiAgLy8gJ2NvbGRzdW1tb24nLCB1bnVzZWRcbiAgLy8nd2ludGVyc3VtbW9uMWQzJywgLy8gdmFtcCBxdWVlbiwgbm90IGFjdHVhbGx5IGEgKGRvY3VtZW50ZWQpIGNvbW1hbmQ/XG4gIC8vJ3R1cm1vaWxzdW1tb24nLCAvLyBhbHNvIG5vdCBhIGNvbW1hbmQgfiAhXG5dXG4qL1xuXG5cbmV4cG9ydCBjb25zdCBlbnVtIE1PTl9TVU1NT04ge1xuICBVTktOT1dOID0gMCxcbiAgQUxMSUVTID0gMSwgLy8gdmlhICNtYWtlbW9uc3Rlck4gKGFuZCB0aGUgc2luZ2xlIHN1bW1vbjUgaW4gdGhlIGNzdiBkYXRhKVxuICBET00gPSAyLCAvLyB2aWEgI1tyYXJlXWRvbXN1bW1vbk5cbiAgQVVUTyA9IDMsIC8vIHZpYSAjc3VtbW9uMSAoZ29lcyB1cCB0byA1KVxuICBCQVRUTEVfUk9VTkQgPSA0LCAvLyB2aWEgI2JhdHN0YXJ0c3VtTiBvciAjYmF0dGxlc3VtXG4gIEJBVFRMRV9TVEFSVCA9IDUsIC8vIHZpYSAjYmF0c3RhcnRzdW1OIG9yICNiYXR0bGVzdW1cbiAgVEVNUExFX1RSQUlORVIgPSA2LCAvLyB2aWEgI3RlbXBsZXRyYWluZXIsIHZhbHVlIGlzIGhhcmQgY29kZWQgdG8gMTg1OS4uLlxuICBXSU5URVIgPSA3LCAvLyBub3QgYSBjb21tYW5kLCB1c2VkIG9uY2UgYnkgdmFtcGlyZSBxdWVlblxuICBNT1VOVCA9IDgsIC8vIG5vdCByZWFsbHkgYSBzdW1tb24gYnV0IGVmZmVjdGl2ZWx5IHNpbWlsYXJcbiAgLy8gVE9ETyAtIHNoYXBlIGNoYW5naW5nIGFzIHdlbGxcbiAgU0hSSU5LU19UTyA9IDksXG4gIEdST1dTX1RPID0gMTAsXG5cbn1cblxuZnVuY3Rpb24gRF9TVU1NT04gKHQ6IE1PTl9TVU1NT04sIHM6IG51bWJlcik6IHN0cmluZyB7XG4gIHN3aXRjaCAodCkge1xuICAgIGNhc2UgTU9OX1NVTU1PTi5BTExJRVM6IHJldHVybiBgI21ha2Vtb25zdGVyJHtzfWA7XG4gICAgY2FzZSBNT05fU1VNTU9OLkRPTToge1xuICAgICAgc3dpdGNoIChzKSB7XG4gICAgICAgIGNhc2UgMDogcmV0dXJuIGAjZG9tc3VtbW9uYDtcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gYCNkb21zdW1tb24yYDtcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gYCNkb21zdW1tb24yMGA7XG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGAjcmFyZWRvbXN1bW1vbmA7XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBgRE9NID8/ICR7dH06JHtzfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGNhc2UgTU9OX1NVTU1PTi5BVVRPOiByZXR1cm4gYCNzdW1tb24ke3N9YDtcbiAgICBjYXNlIE1PTl9TVU1NT04uQkFUVExFX1JPVU5EOiByZXR1cm4gYCNiYXR0bGVzdW0ke3N9YDtcbiAgICBjYXNlIE1PTl9TVU1NT04uQkFUVExFX1NUQVJUOiB7XG4gICAgICBjb25zdCBuID0gcyAmIDYzO1xuICAgICAgcmV0dXJuIHMgJiAxMjggPyBgI2JhdHN0YXJ0c3VtJHtufWQ2YCA6XG4gICAgICAgIHMgJiA2NCA/IGAjYmF0c3RhcnRzdW0xZDNgIDpcbiAgICAgICAgYCNiYXRzdGFydHN1bSR7bn1gO1xuICAgIH1cbiAgICBjYXNlIE1PTl9TVU1NT04uVEVNUExFX1RSQUlORVI6IHJldHVybiBgI3RlbXBsZXRyYWluZXJgO1xuICAgIGNhc2UgTU9OX1NVTU1PTi5XSU5URVI6IHJldHVybiBgKDFkMyBhdCB0aGUgc3RhcnQgb2Ygd2ludGVyKWA7XG4gICAgY2FzZSBNT05fU1VNTU9OLk1PVU5UOiByZXR1cm4gYChyaWRlcylgO1xuICAgIGNhc2UgTU9OX1NVTU1PTi5HUk9XU19UTzogcmV0dXJuIGAoZ3Jvd3MgdG8pYDtcbiAgICBjYXNlIE1PTl9TVU1NT04uU0hSSU5LU19UTzogcmV0dXJuIGAoc2hyaW5rcyB0bylgO1xuICAgIGRlZmF1bHQ6IHJldHVybiBgSURLPz8/IHQ9JHt0fTsgcz0ke3N9YFxuICB9XG59XG5cblxuZnVuY3Rpb24gbWFrZVVuaXRCeVVuaXRTdW1tb24gKHRhYmxlczogVFIpIHtcbiAgY29uc3QgeyBVbml0IH0gPSB0YWJsZXM7XG4gIGNvbnN0IHNjaGVtYSA9IG5ldyBTY2hlbWEoe1xuICAgIG5hbWU6ICdVbml0QnlTdW1tb25lcicsXG4gICAga2V5OiAnX19yb3dJZCcsXG4gICAgam9pbnM6ICdVbml0W3N1bW1vbmVySWRdPVN1bW1vbnMrVW5pdFt1bml0SWRdPVNvdXJjZScsXG4gICAgZmxhZ3NVc2VkOiAxLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgZmllbGRzOiBbJ3VuaXRJZCcsICdzdW1tb25lcklkJywgJ3N1bW1vblR5cGUnLCAnc3VtbW9uU3RyZW5ndGgnLCAnYXNUYWcnXSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIHN1bW1vbmVySWQ6IDEsXG4gICAgICBzdW1tb25UeXBlOiAyLFxuICAgICAgc3VtbW9uU3RyZW5ndGg6IDMsXG4gICAgICBhc1RhZzogNFxuICAgIH0sXG4gICAgY29sdW1uczogW1xuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAndW5pdElkJyxcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VMTYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vbmVySWQnLFxuICAgICAgICBpbmRleDogMSxcbiAgICAgICAgdHlwZTogQ09MVU1OLlUxNixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3VtbW9uVHlwZScsXG4gICAgICAgIGluZGV4OiAyLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vblN0cmVuZ3RoJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgbmV3IEJvb2xDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnYXNUYWcnLFxuICAgICAgICBpbmRleDogNCxcbiAgICAgICAgdHlwZTogQ09MVU1OLkJPT0wsXG4gICAgICAgIGJpdDogMCxcbiAgICAgICAgZmxhZzogMSxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cbiAgY29uc3Qgcm93czogYW55W10gPSBbXTtcblxuICBmdW5jdGlvbiBwcmludFJvdyAoc2lkOiBudW1iZXIsIHVpZDogbnVtYmVyLCB0OiBNT05fU1VNTU9OLCBzOiBudW1iZXIsIHA/OiBzdHJpbmcpIHtcbiAgICBwID8/PSAnICAtJztcbiAgICBjb25zdCBzbiA9IFVuaXQubWFwLmdldChzaWQpLm5hbWVcbiAgICBjb25zdCB1biA9IFVuaXQubWFwLmdldCh1aWQpLm5hbWVcbiAgICBjb25zdCBkID0gRF9TVU1NT04odCwgcyk7XG4gICAgY29uc29sZS5sb2coYCR7cH0gJHtkfSAke3NufSAtPiAke3VufWApO1xuICB9XG4gIGZ1bmN0aW9uIGFkZFJvdyAoXG4gICAgc3VtbW9uVHlwZTogTU9OX1NVTU1PTixcbiAgICBzdW1tb25TdHJlbmd0aDogbnVtYmVyLFxuICAgIHN1bW1vbmVySWQ6IG51bWJlcixcbiAgICB0YXJnZXQ6IG51bWJlcixcbiAgKSB7XG4gICAgaWYgKHRhcmdldCA+IDApIHtcbiAgICAgIGNvbnN0IHIgPSB7XG4gICAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgICBzdW1tb25lcklkLFxuICAgICAgICBzdW1tb25UeXBlLFxuICAgICAgICBzdW1tb25TdHJlbmd0aCxcbiAgICAgICAgYXNUYWc6IGZhbHNlLFxuICAgICAgICB1bml0SWQ6IHRhcmdldCxcbiAgICAgIH07XG4gICAgICAvL3ByaW50Um93KHIuc3VtbW9uZXJJZCwgci51bml0SWQsIHIuc3VtbW9uVHlwZSwgci5zdW1tb25TdHJlbmd0aClcbiAgICAgIHJvd3MucHVzaChyKTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCA8IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCcgIE1PTlRBRyAnICsgdGFyZ2V0ICsgJyBbJyk7XG4gICAgICBpZiAoIU1PTlRBR1NbdGFyZ2V0XT8ubGVuZ3RoKSBjb25zb2xlLmxvZygnICAgIChNSVNTSU5HISknKTtcbiAgICAgIGVsc2UgZm9yIChjb25zdCB1bml0SWQgb2YgTU9OVEFHU1t0YXJnZXRdKSB7XG4gICAgICAgIGNvbnN0IHIgPSB7XG4gICAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICAgICAgc3VtbW9uZXJJZCxcbiAgICAgICAgICBzdW1tb25UeXBlLFxuICAgICAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgICAgIGFzVGFnOiB0cnVlLFxuICAgICAgICAgIHVuaXRJZCxcbiAgICAgICAgfVxuICAgICAgICAvL3ByaW50Um93KHIuc3VtbW9uZXJJZCwgci51bml0SWQsIHIuc3VtbW9uVHlwZSwgci5zdW1tb25TdHJlbmd0aCwgJyAgICAgPicpO1xuICAgICAgICByb3dzLnB1c2gocik7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnICBdXFxuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCAgICAgICEhISEhICR7VW5pdC5tYXAuZ2V0KHN1bW1vbmVySWQpLm5hbWV9IFNVTU1PTlMgSUQgMCAhIWApXG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBzdW1tb25lciBvZiBVbml0LnJvd3MpIHtcbiAgICBpZiAoc3VtbW9uZXIuc3VtbW9uKVxuICAgICAgYWRkUm93KE1PTl9TVU1NT04uQUxMSUVTLCBzdW1tb25lci5uX3N1bW1vbiwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLnN1bW1vbik7XG5cbiAgICBpZiAoc3VtbW9uZXIuc3VtbW9uNSlcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLkFMTElFUywgNSwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLnN1bW1vbjUpO1xuXG4gICAgaWYgKHN1bW1vbmVyLnN1bW1vbjEpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5BVVRPLCAxLCBzdW1tb25lci5pZCwgc3VtbW9uZXIuc3VtbW9uMSk7XG5cbiAgICAvLyB2YWx1ZSBpcyBoYXJkIGNvZGVkIHRvIDE4NTkgKHRoYXRzIHRoZSBvbmx5IHRoaW5nIHN1bW1vbmVkIGluIHZhbmlsbGEpXG4gICAgaWYgKHN1bW1vbmVyLnRlbXBsZXRyYWluZXIpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5URU1QTEVfVFJBSU5FUiwgMCwgc3VtbW9uZXIuaWQsIDE4NTkpO1xuICAgIGlmIChzdW1tb25lci53aW50ZXJzdW1tb24xZDMpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5XSU5URVIsIDAsIHN1bW1vbmVyLmlkLCBzdW1tb25lci53aW50ZXJzdW1tb24xZDMpO1xuXG4gICAgaWYgKHN1bW1vbmVyLmRvbXN1bW1vbilcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLkRPTSwgMCwgc3VtbW9uZXIuaWQsIHN1bW1vbmVyLmRvbXN1bW1vbik7XG4gICAgaWYgKHN1bW1vbmVyLmRvbXN1bW1vbjIpXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5ET00sIDEsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5kb21zdW1tb24yKTtcbiAgICBpZiAoc3VtbW9uZXIuZG9tc3VtbW9uMjApXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5ET00sIDIsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5kb21zdW1tb24yMCk7XG4gICAgaWYgKHN1bW1vbmVyLnJhcmVkb21zdW1tb24pXG4gICAgICBhZGRSb3coTU9OX1NVTU1PTi5ET00sIDMsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5yYXJlZG9tc3VtbW9uKTtcblxuICAgIGZvciAoY29uc3QgcyBvZiBbLyoxLDIsMyw0LCovNV0pIHsgLy8gb25seSA1IGluIHRoZSBjc3ZcbiAgICAgIGNvbnN0IGsgPSBgYmF0dGxlc3VtJHtzfWA7XG4gICAgICBpZiAoc3VtbW9uZXJba10pIGFkZFJvdyhNT05fU1VNTU9OLkJBVFRMRV9ST1VORCwgcywgc3VtbW9uZXIuaWQsIHN1bW1vbmVyW2tdKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHMgb2YgWzEsMiwzLDQsNV0pIHtcbiAgICAgIGNvbnN0IGsgPSBgYmF0c3RhcnRzdW0ke3N9YDtcbiAgICAgIGlmIChzdW1tb25lcltrXSkgYWRkUm93KE1PTl9TVU1NT04uQkFUVExFX1NUQVJULCBzLCBzdW1tb25lci5pZCwgc3VtbW9uZXJba10pO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHMgb2YgWzEsMiwzLDQsNSw2LyosNyw4LDkqL10pIHsgLy8gdmFuaWxsYSBvbmx5IHVzZXMgdXAgdG8gNlxuICAgICAgY29uc3QgayA9IGBiYXRzdGFydHN1bSR7c31kNmA7XG4gICAgICBpZiAoc3VtbW9uZXJba10pIGFkZFJvdyhNT05fU1VNTU9OLkJBVFRMRV9TVEFSVCwgc3wxMjgsIHN1bW1vbmVyLmlkLCBzdW1tb25lcltrXSk7XG4gICAgfVxuICAgIGlmIChzdW1tb25lci5iYXRzdGFydHN1bTFkMylcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLkJBVFRMRV9TVEFSVCwgNjQsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5iYXRzdGFydHN1bTFkMylcblxuICAgIGlmIChzdW1tb25lci5tb3VudG1ucikge1xuICAgICAgLy8gVE9ETyAtIHNtYXJ0IG1vdW50cyBtaWdodCBiZSBjb21tYW5kZXJzPyBpZHJcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLk1PVU5ULCAxLCBzdW1tb25lci5pZCwgc3VtbW9uZXIubW91bnRtbnIpO1xuICAgIH1cblxuICAgIGlmIChzdW1tb25lci5ncm93aHApIHtcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLkdST1dTX1RPLCAxLCBzdW1tb25lci5pZCwgc3VtbW9uZXIuaWQgLSAxKTtcbiAgICB9XG5cbiAgICBpZiAoc3VtbW9uZXIuc2hyaW5raHApIHtcbiAgICAgIGFkZFJvdyhNT05fU1VNTU9OLlNIUklOS1NfVE8sIDEsIHN1bW1vbmVyLmlkLCBzdW1tb25lci5pZCArIDEpO1xuICAgIH1cbiAgfVxuXG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZSxcbiAgKTtcbn1cblxuLy8gVE9ETyAtIG5vdCBzdXJlIHlldCBpZiBJIHdhbnQgdG8gZHVwbGljYXRlIGNhcC1vbmx5IHNpdGVzIGhlcmU/XG5mdW5jdGlvbiBtYWtlVW5pdEJ5TmF0aW9uICh0YWJsZXM6IFRSKTogVGFibGUge1xuICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHtcbiAgICBuYW1lOiAnVW5pdEJ5TmF0aW9uJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgb3ZlcnJpZGVzOiB7fSxcbiAgICByYXdGaWVsZHM6IHsgbmF0aW9uSWQ6IDAsIHVuaXRJZDogMSwgcmVjVHlwZTogMiB9LFxuICAgIGpvaW5zOiAnTmF0aW9uW25hdGlvbklkXT1Vbml0cytVbml0W3VuaXRJZF09U291cmNlJyxcbiAgICBmaWVsZHM6IFsnbmF0aW9uSWQnLCAndW5pdElkJywgJ3JlY1R5cGUnXSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICduYXRpb25JZCcsXG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTgsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3VuaXRJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uVTE2LFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdyZWNUeXBlJyxcbiAgICAgICAgaW5kZXg6IDEsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgIF1cbiAgfSk7XG5cblxuICAvLyBUT0RPIC0gcHJldGVuZGVyc1xuICAvLyBmb2xsb3dpbmcgdGhlIGxvZ2ljIGluIC4uLy4uLy4uLy4uL3NjcmlwdHMvRE1JL01OYXRpb24uanNcbiAgLy8gICAxLiBkZXRlcm1pbmUgbmF0aW9uIHJlYWxtKHMpIGFuZCB1c2UgdGhhdCB0byBhZGQgcHJldGVuZGVyc1xuICAvLyAgIDIuIHVzZSB0aGUgbGlzdCBvZiBcImV4dHJhXCIgYWRkZWQgcHJldGVuZGVycyB0byBhZGQgYW55IGV4dHJhXG4gIC8vICAgMy4gdXNlIHRoZSB1bnByZXRlbmRlcnMgdGFibGUgdG8gZG8gb3Bwb3NpdGVcblxuICAvLyB0aGVyZSdzIGEgbG90IGdvaW4gb24gaGVyZVxuICBjb25zdCByb3dzOiBhbnlbXSA9IFtdO1xuXG4gIG1ha2VSZWNydWl0bWVudEZyb21BdHRycyh0YWJsZXMsIHJvd3MpO1xuICBjb21iaW5lUmVjcnVpdG1lbnRUYWJsZXModGFibGVzLCByb3dzKTtcbiAgbWFrZVByZXRlbmRlckJ5TmF0aW9uKHRhYmxlcywgcm93cylcblxuICByZXR1cm4gdGFibGVzW3NjaGVtYS5uYW1lXSA9IFRhYmxlLmFwcGx5TGF0ZUpvaW5zKFxuICAgIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpLFxuICAgIHRhYmxlcyxcbiAgICB0cnVlLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYWtlUmVjcnVpdG1lbnRGcm9tQXR0cnMgKHRhYmxlczogVFIsIHJvd3M6IGFueVtdKSB7XG4gIGNvbnN0IHsgQXR0cmlidXRlQnlOYXRpb24sIFVuaXQgfSA9IHRhYmxlcztcbiAgY29uc3QgZGVsQUJOUm93czogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChjb25zdCBbaUFCTiAscl0gIG9mIEF0dHJpYnV0ZUJ5TmF0aW9uLnJvd3MuZW50cmllcygpKSB7XG4gICAgY29uc3QgeyByYXdfdmFsdWUsIGF0dHJpYnV0ZSwgbmF0aW9uX251bWJlciB9ID0gcjtcbiAgICBsZXQgdW5pdDogYW55O1xuICAgIGxldCB1bml0SWQ6IGFueSA9IG51bGwgLy8gc21maFxuICAgIGxldCB1bml0VHlwZSA9IDA7XG4gICAgbGV0IHJlY1R5cGUgPSAwO1xuICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICBjYXNlIDE1ODpcbiAgICAgIGNhc2UgMTU5OlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC5sYW5kc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNPQVNUO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNjA6XG4gICAgICBjYXNlIDE2MTpcbiAgICAgIGNhc2UgMTYyOlxuICAgICAgICB1bml0ID0gVW5pdC5tYXAuZ2V0KHJhd192YWx1ZSk7XG4gICAgICAgIGlmICghdW5pdCkgdGhyb3cgbmV3IEVycm9yKCdwaXNzIHVuaXQnKTtcbiAgICAgICAgdW5pdElkID0gdW5pdC5sYW5kc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNPQVNUO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTYzOlxuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODY6XG4gICAgICAgIHVuaXQgPSBVbml0Lm1hcC5nZXQocmF3X3ZhbHVlKTtcbiAgICAgICAgaWYgKCF1bml0KSB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgdW5pdCcpO1xuICAgICAgICB1bml0SWQgPSB1bml0LndhdGVyc2hhcGUgfHwgdW5pdC5pZDtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBVEVSO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxODc6XG4gICAgICBjYXNlIDE4OTpcbiAgICAgIGNhc2UgMTkwOlxuICAgICAgY2FzZSAxOTE6XG4gICAgICBjYXNlIDIxMzpcbiAgICAgICAgdW5pdCA9IFVuaXQubWFwLmdldChyYXdfdmFsdWUpO1xuICAgICAgICBpZiAoIXVuaXQpIHRocm93IG5ldyBFcnJvcigncGlzcyB1bml0Jyk7XG4gICAgICAgIHVuaXRJZCA9IHVuaXQud2F0ZXJzaGFwZSB8fCB1bml0LmlkO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuV0FURVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOTQ6XG4gICAgICBjYXNlIDQxMjpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuRk9SRVNUO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk1OlxuICAgICAgY2FzZSA0MTM6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkZPUkVTVDtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjk2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5TV0FNUDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5NzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuU1dBTVA7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5ODpcbiAgICAgIGNhc2UgNDA4OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NT1VOVEFJTjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI5OTpcbiAgICAgIGNhc2UgNDA5OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5NT1VOVEFJTjtcbiAgICAgICAgdW5pdFR5cGUgPSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAwOlxuICAgICAgY2FzZSA0MTY6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBU1RFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzAxOlxuICAgICAgY2FzZSA0MTc6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLldBU1RFO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDI6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNBVkU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzMDM6XG4gICAgICAgIHVuaXRJZCA9IHJhd192YWx1ZTtcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkNBVkU7XG4gICAgICAgIHVuaXRUeXBlID0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQwNDpcbiAgICAgIGNhc2UgNDA2OlxuICAgICAgICB1bml0SWQgPSByYXdfdmFsdWU7XG4gICAgICAgIHJlY1R5cGUgPSBSRUNfVFlQRS5QTEFJTlM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0MDU6XG4gICAgICBjYXNlIDQwNzpcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICByZWNUeXBlID0gUkVDX1RZUEUuUExBSU5TO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMzk6XG4gICAgICBjYXNlIDE0MDpcbiAgICAgIGNhc2UgMTQxOlxuICAgICAgY2FzZSAxNDI6XG4gICAgICBjYXNlIDE0MzpcbiAgICAgIGNhc2UgMTQ0OlxuICAgICAgICAvL2NvbnNvbGUubG9nKCdIRVJPIEZJTkRFUiBGT1VORCcsIHJhd192YWx1ZSlcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVIgfCBVTklUX1RZUEUuSEVSTztcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLkhFUk87XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxNDU6XG4gICAgICBjYXNlIDE0NjpcbiAgICAgIGNhc2UgMTQ5OlxuICAgICAgICAvL2NvbnNvbGUubG9nKCdtdWx0aSBoZXJvIScsIHJhd192YWx1ZSlcbiAgICAgICAgdW5pdElkID0gcmF3X3ZhbHVlO1xuICAgICAgICB1bml0VHlwZSA9IFVOSVRfVFlQRS5DT01NQU5ERVIgfCBVTklUX1RZUEUuSEVSTztcbiAgICAgICAgcmVjVHlwZSA9IFJFQ19UWVBFLk1VTFRJSEVSTztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHVuaXRJZCA9PSBudWxsKSBjb250aW51ZTtcbiAgICBkZWxBQk5Sb3dzLnB1c2goaUFCTik7XG4gICAgdW5pdCA/Pz0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKHVuaXRUeXBlKSB1bml0LnR5cGUgfD0gdW5pdFR5cGU7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdtb3JlIHBpc3MgdW5pdDonLCBpQUJOLCB1bml0SWQpO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICB1bml0SWQsXG4gICAgICByZWNUeXBlLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICBuYXRpb25JZDogbmF0aW9uX251bWJlcixcbiAgICB9KTtcbiAgfVxuXG4gIGxldCBkaTogbnVtYmVyfHVuZGVmaW5lZDtcbiAgd2hpbGUgKChkaSA9IGRlbEFCTlJvd3MucG9wKCkpICE9PSB1bmRlZmluZWQpXG4gICAgQXR0cmlidXRlQnlOYXRpb24ucm93cy5zcGxpY2UoZGksIDEpO1xuXG5cbn1cblxuZnVuY3Rpb24gY29tYmluZVJlY3J1aXRtZW50VGFibGVzICh0YWJsZXM6IFRSLCByb3dzOiBhbnlbXSkge1xuICBjb25zdCB7XG4gICAgVW5pdCxcbiAgICBDb2FzdExlYWRlclR5cGVCeU5hdGlvbixcbiAgICBDb2FzdFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIEZvcnRMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgRm9ydFRyb29wVHlwZUJ5TmF0aW9uLFxuICAgIE5vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24sXG4gICAgTm9uRm9ydFRyb29wVHlwZUJ5TmF0aW9uLFxuICB9ID0gdGFibGVzO1xuICBmb3IgKGNvbnN0IHIgb2YgRm9ydFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SVCxcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIEZvcnRMZWFkZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIGNvbnN0IHsgbW9uc3Rlcl9udW1iZXI6IHVuaXRJZCwgbmF0aW9uX251bWJlcjogbmF0aW9uSWQgfSA9IHI7XG4gICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1bml0SWQpO1xuICAgIGlmICghdW5pdCkgY29uc29sZS5lcnJvcignZm9ydCBwaXNzIGNvbW1hbmRlcjonLCByKTtcbiAgICBlbHNlIHVuaXQudHlwZSB8PSBVTklUX1RZUEUuQ09NTUFOREVSO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuRk9SVCxcbiAgICB9KVxuICB9XG4gIGZvciAoY29uc3QgciBvZiBDb2FzdFRyb29wVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIHJvd3MucHVzaCh7XG4gICAgICBfX3Jvd0lkOiByb3dzLmxlbmd0aCxcbiAgICAgIHVuaXRJZCxcbiAgICAgIG5hdGlvbklkLFxuICAgICAgcmVjVHlwZTogUkVDX1RZUEUuQ09BU1QsXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBDb2FzdExlYWRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICBjb25zdCB1bml0ID0gVW5pdC5tYXAuZ2V0KHVuaXRJZCk7XG4gICAgaWYgKCF1bml0KSBjb25zb2xlLmVycm9yKCdmb3J0IHBpc3MgY29tbWFuZGVyOicsIHIpO1xuICAgIGVsc2UgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgcm93cy5wdXNoKHtcbiAgICAgIF9fcm93SWQ6IHJvd3MubGVuZ3RoLFxuICAgICAgdW5pdElkLFxuICAgICAgbmF0aW9uSWQsXG4gICAgICByZWNUeXBlOiBSRUNfVFlQRS5DT0FTVCxcbiAgICB9KVxuICB9XG5cbiAgZm9yIChjb25zdCByIG9mIE5vbkZvcnRUcm9vcFR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgY29uc3QgeyBtb25zdGVyX251bWJlcjogdW5pdElkLCBuYXRpb25fbnVtYmVyOiBuYXRpb25JZCB9ID0gcjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUkVJR04sXG4gICAgfSlcbiAgfVxuXG4gIGZvciAoY29uc3QgciBvZiBOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uLnJvd3MpIHtcbiAgICBjb25zdCB7IG1vbnN0ZXJfbnVtYmVyOiB1bml0SWQsIG5hdGlvbl9udW1iZXI6IG5hdGlvbklkIH0gPSByO1xuICAgIGNvbnN0IHVuaXQgPSBVbml0Lm1hcC5nZXQodW5pdElkKTtcbiAgICBpZiAoIXVuaXQpIGNvbnNvbGUuZXJyb3IoJ2ZvcnQgcGlzcyBjb21tYW5kZXI6Jywgcik7XG4gICAgZWxzZSB1bml0LnR5cGUgfD0gVU5JVF9UWVBFLkNPTU1BTkRFUjtcbiAgICByb3dzLnB1c2goe1xuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB1bml0SWQsXG4gICAgICBuYXRpb25JZCxcbiAgICAgIHJlY1R5cGU6IFJFQ19UWVBFLkZPUkVJR04sXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlUHJldGVuZGVyQnlOYXRpb24gKHRhYmxlczogVFIsIHJvd3M6IGFueVtdKSB7XG4gIGNvbnN0IHtcbiAgICBQcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24sXG4gICAgTmF0aW9uLFxuICAgIFVuaXQsXG4gICAgUmVhbG0sXG4gICAgQXR0cmlidXRlQnlOYXRpb24sXG4gIH0gPSB0YWJsZXM7XG5cbiAgLy8gVE9ETyAtIGRlbGV0ZSBtYXRjaGluZyByb3dzIGZyb20gdGhlIHRhYmxlXG4gIGNvbnN0IGNoZWFwQXR0cnMgPSBBdHRyaWJ1dGVCeU5hdGlvbi5yb3dzLmZpbHRlcihcbiAgICAoeyBhdHRyaWJ1dGU6IGEgfSkgPT4gYSA9PT0gMzE0IHx8IGEgPT09IDMxNVxuICApO1xuICBjb25zdCBjaGVhcCA9IG5ldyBNYXA8bnVtYmVyLCBNYXA8bnVtYmVyLCAyMHw0MD4+KCk7XG4gIGZvciAoY29uc3QgeyBuYXRpb25fbnVtYmVyLCBhdHRyaWJ1dGUsIHJhd192YWx1ZSB9IG9mIGNoZWFwQXR0cnMpIHtcbiAgICBpZiAoIWNoZWFwLmhhcyhyYXdfdmFsdWUpKSBjaGVhcC5zZXQocmF3X3ZhbHVlLCBuZXcgTWFwKCkpO1xuICAgIGNvbnN0IGNVbml0ID0gY2hlYXAuZ2V0KHJhd192YWx1ZSkhO1xuICAgIGNVbml0LnNldChuYXRpb25fbnVtYmVyLCBhdHRyaWJ1dGUgPT09IDMxNCA/IDIwIDogNDApO1xuICB9XG5cbiAgLy8gbWFrZSBhIG1hcCBmaXJzdCwgd2Ugd2lsbCBjb252ZXJ0IHRvIHJvd3MgYXQgdGhlIGVuZFxuICBjb25zdCBwcmV0ZW5kZXJzID0gbmV3IE1hcDxudW1iZXIsIFNldDxudW1iZXI+PihcbiAgICBOYXRpb24ucm93cy5tYXAoKHI6IGFueSkgPT4gW3IuaWQgYXMgbnVtYmVyLCBuZXcgU2V0PG51bWJlcj4oKV0pXG4gICk7XG4gIC8vIG1vbnN0ZXJzIGZvciBlYWNoIHJlYWxtXG4gIGNvbnN0IHIybSA9IG5ldyBNYXA8bnVtYmVyLCBTZXQ8bnVtYmVyPj4oKTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gMTA7IGkrKykgcjJtLnNldChpLCBuZXcgU2V0KCkpO1xuICBmb3IgKGNvbnN0IHsgbW9uc3Rlcl9udW1iZXIsIHJlYWxtIH0gb2YgUmVhbG0ucm93cylcbiAgICByMm0uZ2V0KHJlYWxtKSEuYWRkKG1vbnN0ZXJfbnVtYmVyKTtcblxuICAvLyBmaXJzdCBkbyByZWFsbS1iYXNlZCBwcmV0ZW5kZXJzXG4gIGZvciAoY29uc3QgeyByZWFsbSwgaWQgfSBvZiBOYXRpb24ucm93cykge1xuICAgIGlmICghcmVhbG0pIGNvbnRpbnVlO1xuICAgIGZvciAoY29uc3QgbW5yIG9mIHIybS5nZXQocmVhbG0pISkge1xuICAgICAgcHJldGVuZGVycy5nZXQoaWQpIS5hZGQobW5yKTtcbiAgICB9XG4gIH1cblxuICAvLyB0aGVuIGFkZCBwcmV0ZW5kZXJzIGJ5IG5hdGlvblxuICBmb3IgKGNvbnN0IHsgbW9uc3Rlcl9udW1iZXIsIG5hdGlvbl9udW1iZXIgfSBvZiBQcmV0ZW5kZXJUeXBlQnlOYXRpb24ucm93cykge1xuICAgIHByZXRlbmRlcnMuZ2V0KG5hdGlvbl9udW1iZXIpIS5hZGQobW9uc3Rlcl9udW1iZXIpO1xuICB9XG4gIC8vIHRoZW4gdW5wcmV0ZW5kZXJzIGJ5IG5hdGlvblxuICBmb3IgKGNvbnN0IHsgbW9uc3Rlcl9udW1iZXIsIG5hdGlvbl9udW1iZXIgfSBvZiBVbnByZXRlbmRlclR5cGVCeU5hdGlvbi5yb3dzKSB7XG4gICAgcHJldGVuZGVycy5nZXQobmF0aW9uX251bWJlcikhLmRlbGV0ZShtb25zdGVyX251bWJlcik7XG4gIH1cblxuICBjb25zdCBhZGRlZFVuaXRzID0gbmV3IE1hcDxudW1iZXIsIGFueT4oKTtcblxuICBmb3IgKGNvbnN0IFtuYXRpb25JZCwgdW5pdElkc10gb2YgcHJldGVuZGVycykge1xuICAgIGZvciAoY29uc3QgdW5pdElkIG9mIHVuaXRJZHMpIHtcbiAgICAgIGlmICghYWRkZWRVbml0cy5oYXModW5pdElkKSkgYWRkZWRVbml0cy5zZXQodW5pdElkLCBVbml0Lm1hcC5nZXQodW5pdElkKSk7XG4gICAgICBjb25zdCBkaXNjb3VudCA9IGNoZWFwLmdldCh1bml0SWQpPy5nZXQobmF0aW9uSWQpID8/IDA7XG4gICAgICBjb25zdCByZWNUeXBlID0gZGlzY291bnQgPT09IDQwID8gUkVDX1RZUEUuUFJFVEVOREVSX0NIRUFQXzQwIDpcbiAgICAgICAgZGlzY291bnQgPT09IDIwID8gUkVDX1RZUEUuUFJFVEVOREVSX0NIRUFQXzIwIDpcbiAgICAgICAgUkVDX1RZUEUuUFJFVEVOREVSO1xuICAgICAgcm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkLFxuICAgICAgICBuYXRpb25JZCxcbiAgICAgICAgcmVjVHlwZSxcbiAgICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IFtpZCwgdV0gb2YgYWRkZWRVbml0cykge1xuICAgIGlmICghdSkgeyBjb25zb2xlLndhcm4oJ2Zha2UgdW5pdCBpZD8nLCBpZCk7IGNvbnRpbnVlIH1cbiAgICBpZiAoIXUuc3RhcnRkb20gfHwgISh1LnR5cGUgJiBVTklUX1RZUEUuUFJFVEVOREVSKSkge1xuICAgICAgY29uc29sZS53YXJuKCdub3QgYSBwcmV0ZW5kZXI/JywgdS5uYW1lLCB1LnR5cGUsIHUuc3RhcnRkb20pO1xuICAgIH1cbiAgICB1LnR5cGUgfD0gVU5JVF9UWVBFLlBSRVRFTkRFUjtcbiAgfVxufVxuXG5jb25zdCBlbnVtIE1JU0NfVU5JVF9TUkMge1xuICBNSVNDX01JU0MgPSAwLCAvLyBWRVJZIG1pc2MuIGxpa2UgdHJlZXMgYW5kIHNoaXRcbiAgUkVBTklNID0gMSxcbiAgSU5ESUUgPSAyLFxuICBERUJVRyA9IDMsIC8vIGRlYnVnIHNlbnNlaS9rb2hhaVxuICAvLyBlYSBtdXMgbmVlZHMgc29tZSB3b3JrLCBsb29rcyBsaWtlIGF0IHNvbWUgcG9pbnQgbmVpZmVsL211c3BlbCBnaWFudHMgd2VyZVxuICAvLyBzaGFyaW5nIHRoZSBzYW1lIHVuaXQgaWRzIGFuZCB0aGV5IGdvdCBzcGxpdFxuICBUT0RPX01ZUEFMSEVJTSA9IDQsXG4gIEFMVF9TSEFQRSA9IDUsXG4gIEFEVkVOVFVSRVIgPSA2LFxuICBXSUdIVCA9IDcsXG4gIExJQ0ggPSA4LFxuICBVTkRFQUQgPSA5LFxuICBNWVNURVJZX1BSRVRFTkRFUiA9IDEwLCAvLyBwcm9iYWJseSBqdXN0IGhhdmUgc29tZSBtZXNzZWQgdXAgZGF0YT9cbiAgTk9fSURFQSA9IDExLCAvLyBpIGR1bm5vLCBnb3R0YSBmaWd1cmUgZW0gb3V0IHN0aWxsXG4gIFBST0JBQkxZX0FOSU1BTFMgPSAxMiwgLy8gaSBkdW5ubywgZ290dGEgZmlndXJlIGVtIG91dCBzdGlsbFxuICBIT1JST1JTID0gMTMsIC8vIGp1c3QgZ290dGEgcHV0IGVtIGluIHRoZSBtb250YWcgaSB0aGlua1xufVxuLy8gVE9ETzpcbi8vIGxvbmdkZWFkL3NvdWxsZXNzL3JlYW5pbWF0ZWQvZXRjIChpbmNsLiBtb250YWdzPylcbi8vIFRSRUVTICh1bmFuaW1hdGVkLi4uKVxuLy8gbG9vayBmb3Igd2F0ZXIvbGFuZC9mb3Jlc3QvcGxhaW4gc2hhcGVzLCBhZGQgdG8gdGhlIHJlbGV2YW50IGFyZWFcbi8vIElORElFU1xuLy8gZXZlbnRzP1xuXG5jb25zdCBTSEFQRV9LRVlTID0gW1xuICAnc2hhcGVjaGFuZ2UnLFxuICAncHJvcGhldHNoYXBlJyxcbiAgJ2ZpcnN0c2hhcGUnLFxuICAnc2Vjb25kc2hhcGUnLFxuICAnc2Vjb25kdG1wc2hhcGUnLFxuICAnZm9yZXN0c2hhcGUnLFxuICAncGxhaW5zaGFwZScsXG4gICdmb3JlaWduc2hhcGUnLFxuICAnaG9tZXNoYXBlJyxcbiAgJ2RvbXNoYXBlJyxcbiAgJ25vdGRvbXNoYXBlJyxcbiAgJ3NwcmluZ3NoYXBlJyxcbiAgJ3N1bW1lcnNoYXBlJyxcbiAgJ2F1dHVtbnNoYXBlJyxcbiAgJ3dpbnRlcnNoYXBlJyxcbiAgJ3hwc2hhcGVtb24nLFxuICAndHJhbnNmb3JtYXRpb24nLFxuICAnbGFuZHNoYXBlJyxcbiAgJ3dhdGVyc2hhcGUnLFxuICAnYmF0bGxlc2hhcGUnLFxuICAnd29ybGRzaGFwZScsXG5dXG5cbmNvbnN0IE5BVFVSRV9OQU1FRCA9IC9UcmVlfEZ1bmd1c3xCb3VsZGVyfEZsb3dlcnxTaHJvb218QnVzaHxTaHJ1Yi9cbmNvbnN0IFRSVUVfTUlTQyA9IG5ldyBTZXQoW1xuICAnU2Vhd2VlZCcsXG4gICdDcnlzdGFsJyxcbiAgJ1N0YWxhZ21pdGUnLFxuICAnQm9va3NoZWxmJyxcbiAgJ0NvdW50ZXInLFxuICAnVGFibGUnLFxuICAnQmFycmVsJyxcbiAgJ0NyYXRlJyxcbiAgJ0NhY3R1cycsXG4gICdMYXJnZSBTdG9uZScsXG4gICdQZWFzYW50JyxcbiAgJ0NvbW1vbmVyJyxcbiAgJ0Jsb29kIFNsYXZlJ1xuXSlcblxuZnVuY3Rpb24gbWFrZU1pc2NVbml0KHRhYmxlczogVFIpIHtcbiAgY29uc3Qge1xuICAgIFVuaXQsXG4gICAgVW5pdEJ5TmF0aW9uLFxuICAgIFVuaXRCeVNwZWxsLFxuICAgIFVuaXRCeVN1bW1vbmVyLFxuICAgIFVuaXRCeVNpdGUsXG4gIH0gPSB0YWJsZXM7XG4gIGNvbnN0IG1pc2NSb3dzOiBhbnlbXSA9IFtdO1xuICBjb25zdCB3aWdodFNoYXBlcyA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXJbXT4oKTtcbiAgY29uc3QgbGljaFNoYXBlcyA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXJbXT4oKTtcbiAgY29uc3Qgc291cmNlcyA9IG5ldyBNYXA8bnVtYmVyLCB7IHVuaXQ6IGFueSwgc3JjOiBhbnlbXSB9PihcbiAgICBVbml0LnJvd3MubWFwKCh1bml0OiBhbnkpID0+IHtcbiAgICAgIGlmICh1bml0LmxpY2gpIHtcbiAgICAgICAgaWYgKGxpY2hTaGFwZXMuaGFzKHVuaXQubGljaCkpIGxpY2hTaGFwZXMuZ2V0KHVuaXQubGljaCkhLnB1c2godW5pdC5pZCk7XG4gICAgICAgIGVsc2UgbGljaFNoYXBlcy5zZXQodW5pdC5saWNoLCBbdW5pdC5pZF0pO1xuICAgICAgfVxuICAgICAgaWYgKHVuaXQudHdpY2Vib3JuKSB7XG4gICAgICAgIGlmICh3aWdodFNoYXBlcy5oYXModW5pdC50d2ljZWJvcm4pKSB3aWdodFNoYXBlcy5nZXQodW5pdC50d2ljZWJvcm4pIS5wdXNoKHVuaXQuaWQpO1xuICAgICAgICBlbHNlIHdpZ2h0U2hhcGVzLnNldCh1bml0LnR3aWNlYm9ybiwgW3VuaXQuaWRdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbdW5pdC5pZCwgeyB1bml0LCBzcmM6IFtdIH1dO1xuICAgIH0pXG4gICk7XG5cbiAgZm9yIChjb25zdCByIG9mIFVuaXRCeU5hdGlvbi5yb3dzKSBzb3VyY2VzLmdldChyLnVuaXRJZCkhLnNyYy5wdXNoKHIpO1xuICBmb3IgKGNvbnN0IHIgb2YgVW5pdEJ5U3BlbGwucm93cykgc291cmNlcy5nZXQoci51bml0SWQpIS5zcmMucHVzaChyKTtcbiAgZm9yIChjb25zdCByIG9mIFVuaXRCeVN1bW1vbmVyLnJvd3MpIHNvdXJjZXMuZ2V0KHIudW5pdElkKSEuc3JjLnB1c2gocik7XG4gIGZvciAoY29uc3QgciBvZiBVbml0QnlTaXRlLnJvd3MpIHNvdXJjZXMuZ2V0KHIudW5pdElkKSEuc3JjLnB1c2gocik7XG4gIGxldCByZXMgPSAwO1xuICBsZXQgY2hhbmdlID0gMDtcbiAgZG8ge1xuICAgIHJlcyA9IGNoYW5nZTtcbiAgICBjb25zb2xlLmxvZygnY29uc3QgVU5JVFMgPSBuZXcgU2V0KFsnKVxuICAgIGNoYW5nZSA9IGZpbmRNaXNjVW5pdCh0YWJsZXMsIG1pc2NSb3dzLCBzb3VyY2VzKTtcbiAgICBjb25zb2xlLmxvZygnXSk7JylcbiAgfSB3aGlsZSAoMCk7XG4gIC8vfSB3aGlsZSAocmVzICE9PSBjaGFuZ2UpO1xufVxuXG5mdW5jdGlvbiBmaW5kTWlzY1VuaXQgKHRhYmxlczogVFIsIG1pc2NSb3dzOiBhbnlbXSwgc291cmNlczogYW55KTogbnVtYmVyIHtcbiAgY29uc3QgeyBVbml0IH0gPSB0YWJsZXM7XG4gIC8vIGp1c3Qgc2VlaW5nIHdoZXJlIHdlJ3JlIGF0Li4uXG4gIGxldCB1cyA9IDA7XG4gIGxldCB1dCA9IDA7XG4gIC8vY29uc29sZS5sb2coJ1VuaXQgam9pbmVkIGJ5PycsIHRhYmxlcy5Vbml0LnNjaGVtYS5qb2luZWRCeSlcbiAgZm9yIChjb25zdCB7IHVuaXQsIHNyYyB9IG9mIHNvdXJjZXMudmFsdWVzKCkpIHtcbiAgICB1dCsrO1xuICAgIGlmIChzcmMubGVuZ3RoKSB7IHVzKys7IGNvbnRpbnVlOyB9XG4gICAgaWYgKHVuaXQuc3RhcnRkb20pIHtcbiAgICAgIG1pc2NSb3dzLnB1c2goe1xuICAgICAgICB1bml0SWQ6IHVuaXQuaWQsXG4gICAgICAgIHJlYXNvbjogTUlTQ19VTklUX1NSQy5NWVNURVJZX1BSRVRFTkRFUixcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChNSVNDLkRFQlVHR0VSUy5oYXModW5pdC5pZCkpIHtcbiAgICAgIG1pc2NSb3dzLnB1c2goe1xuICAgICAgICB1bml0SWQ6IHVuaXQuaWQsXG4gICAgICAgIHJlYXNvbjogTUlTQ19VTklUX1NSQy5ERUJVRyxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoTUlTQy5VTkRFQUQuaGFzKHVuaXQuaWQpKSB7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuVU5ERUFELFxuICAgICAgfSk7XG4gICAgICB1cysrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKE1JU0MuVU5ERUFELmhhcyh1bml0LmlkKSkge1xuICAgICAgbWlzY1Jvd3MucHVzaCh7XG4gICAgICAgIHVuaXRJZDogdW5pdC5pZCxcbiAgICAgICAgcmVhc29uOiBNSVNDX1VOSVRfU1JDLlVOREVBRCxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoTUlTQy5OT19JREVBLmhhcyh1bml0LmlkKSkge1xuICAgICAgbWlzY1Jvd3MucHVzaCh7XG4gICAgICAgIHVuaXRJZDogdW5pdC5pZCxcbiAgICAgICAgcmVhc29uOiBNSVNDX1VOSVRfU1JDLk5PX0lERUEsXG4gICAgICB9KTtcbiAgICAgIHVzKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoTUlTQy5JTkRJRVMuaGFzKHVuaXQuaWQpKSB7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuSU5ESUUsXG4gICAgICB9KTtcbiAgICAgIHVzKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKE1JU0MuSE9SUk9SUy5oYXModW5pdC5pZCkpIHtcbiAgICAgIG1pc2NSb3dzLnB1c2goe1xuICAgICAgICB1bml0SWQ6IHVuaXQuaWQsXG4gICAgICAgIHJlYXNvbjogTUlTQ19VTklUX1NSQy5IT1JST1JTLFxuICAgICAgfSk7XG4gICAgICB1cysrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChNSVNDLkFOSU1BTFMuaGFzKHVuaXQuaWQpKSB7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuUFJPQkFCTFlfQU5JTUFMUyxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgXG5cbiAgICBpZiAodW5pdC5uYW1lLnN0YXJ0c1dpdGgoJ0pvdHVuJylcbiAgICAgICAgfHwgdW5pdC5uYW1lID09PSAnR3lnamEnXG4gICAgICAgIHx8IHVuaXQubmFtZSA9PT0gJ0dvZGlodXNrYXJsJ1xuICAgICAgKSB7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuVE9ET19NWVBBTEhFSU0sXG4gICAgICB9KTtcbiAgICAgIHVzKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHVuaXQubmFtZSA9PT0gJ0FkdmVudHVyZXInKSB7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuQURWRU5UVVJFUixcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIHByb2JhYmx5IHRvbyBicm9hZCBidXQgb2ggd2VsbFxuICAgIGlmIChOQVRVUkVfTkFNRUQudGVzdCh1bml0Lm5hbWUpIHx8IFRSVUVfTUlTQy5oYXModW5pdC5uYW1lKSkge1xuICAgICAgbWlzY1Jvd3MucHVzaCh7XG4gICAgICAgIHVuaXRJZDogdW5pdC5pZCxcbiAgICAgICAgcmVhc29uOiBNSVNDX1VOSVRfU1JDLk1JU0NfTUlTQyxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICh1bml0Lm5hbWUudG9VcHBlckNhc2UoKS5pbmNsdWRlcygnV0lHSFQnKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgICoqIFVuaXQjJHt1bml0LmlkfSA6ICR7dW5pdC5uYW1lfSBpcyBhIGxpY2hgKTtcbiAgICAgIG1pc2NSb3dzLnB1c2goe1xuICAgICAgICB1bml0SWQ6IHVuaXQuaWQsXG4gICAgICAgIHJlYXNvbjogTUlTQ19VTklUX1NSQy5XSUdIVCxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuXG4gICAgaWYgKHVuaXQubmFtZS50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKCdMSUNIJykpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAqKiBVbml0IyR7dW5pdC5pZH0gOiAke3VuaXQubmFtZX0gaXMgYSBsaWNoYCk7XG4gICAgICBtaXNjUm93cy5wdXNoKHtcbiAgICAgICAgdW5pdElkOiB1bml0LmlkLFxuICAgICAgICByZWFzb246IE1JU0NfVU5JVF9TUkMuTElDSCxcbiAgICAgIH0pO1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGxldCBzaGFwZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGsgb2YgU0hBUEVfS0VZUykge1xuICAgICAgaWYgKHVuaXRba10pIHtcbiAgICAgICAgY29uc3QgdiA9IHVuaXRba107XG4gICAgICAgIGNvbnN0IHByZXYgPSBzb3VyY2VzLmdldCh2KTtcbiAgICAgICAgaWYgKCFwcmV2KSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgICEhIFVuaXQjJHt1bml0LmlkfVske2t9XSA6ICR7dW5pdC5uYW1lfSAtPiAke3Z9ID8/P2ApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2LnNyYy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKGAgICEhIFVuaXQjJHt1bml0LmlkfVske2t9XSA6ICR7dW5pdC5uYW1lfSAtPiAke3Z9ICgke3ByZXYudW5pdC5uYW1lfSAtIGFsc28gbm8gc3JjKWApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jb25zb2xlLmxvZyhgICoqIFVuaXQjJHt1bml0LmlkfVske2t9XSA6ICR7dW5pdC5uYW1lfSAtPiAke3Z9ICgke3ByZXYudW5pdC5uYW1lfSlgKTtcbiAgICAgICAgc2hhcGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNoYXBlZCkge1xuICAgICAgdXMrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGAgICR7dW5pdC5pZH0sIC8vICR7dW5pdC5uYW1lfWApO1xuICB9XG4gIGNvbnNvbGUubG9nKGAke3VzfSAvICR7dXR9IHVuaXRzIGhhdmUgc291cmNlczsgJHt1dCAtIHVzfSB0byBnb2ApXG5cbiAgcmV0dXJuIHVzO1xufVxuXG5leHBvcnQgZW51bSBTUEVMTF9TVU1NT04ge1xuICBCQVNJQyA9IDAsIC8vIG5vdCBzZXQsIHBlcmhhcHNcbiAgVEVNUE9SQVJZID0gMSxcbiAgVU5JUVVFID0gMixcbiAgQ09NTUFOREVSID0gNCxcbiAgTkVVVFJBTCA9IDgsIC8vIGkuZS4gbm90IG9uIHlvdXIgc2lkZVxuICBFREdFID0gMTYsXG4gIFJFTU9URSA9IDE2LFxuICBDT01CQVQgPSAzMixcbiAgU1BFQ0lBTF9IT0cgPSA2NCwgLy8gbWFlcnZlcm5pIGlyb24gYm9hcnMgOklcbiAgUElDS19PTkUgPSAxMjgsXG4gIEFTU0FTU0lOID0gMjU2LFxuICBTVEVBTFRIWSA9IDUxMixcbiAgQUxJVkVfT05MWSA9IDEwMjQsXG59XG5cbmZ1bmN0aW9uIG1ha2VVbml0QnlTcGVsbCAodGFibGVzOiBUUikge1xuICBjb25zdCB7IFVuaXQsIFNwZWxsIH0gPSB0YWJsZXM7XG5cbiAgY29uc3Qgc2NoZW1hID0gbmV3IFNjaGVtYSh7XG4gICAgbmFtZTogJ1VuaXRCeVNwZWxsJyxcbiAgICBrZXk6ICdfX3Jvd0lkJyxcbiAgICBqb2luczogJ1NwZWxsW3NwZWxsSWRdPVN1bW1vbnMrVW5pdFt1bml0SWRdPVNvdXJjZScsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIG92ZXJyaWRlczoge30sXG4gICAgZmllbGRzOiBbXG4gICAgICAndW5pdElkJywgJ3NwZWxsSWQnLCAnc3VtbW9uVHlwZScsICdzdW1tb25TdHJlbmd0aCcsXG4gICAgXSxcbiAgICByYXdGaWVsZHM6IHtcbiAgICAgIHVuaXRJZDogMCxcbiAgICAgIHNwZWxsSWQ6IDEsXG4gICAgICBzdW1tb25UeXBlOiAyLFxuICAgICAgc3VtbW9uU3RyZW5ndGg6IDMsXG4gICAgfSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICd1bml0SWQnLFxuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgdHlwZTogQ09MVU1OLkkzMixcbiAgICAgIH0pLFxuICAgICAgbmV3IE51bWVyaWNDb2x1bW4oe1xuICAgICAgICBuYW1lOiAnc3BlbGxJZCcsXG4gICAgICAgIGluZGV4OiAxLFxuICAgICAgICB0eXBlOiBDT0xVTU4uSTMyLFxuICAgICAgfSksXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzdW1tb25UeXBlJyxcbiAgICAgICAgaW5kZXg6IDIsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICAgIG5ldyBOdW1lcmljQ29sdW1uKHtcbiAgICAgICAgbmFtZTogJ3N1bW1vblN0cmVuZ3RoJyxcbiAgICAgICAgaW5kZXg6IDMsXG4gICAgICAgIHR5cGU6IENPTFVNTi5JMzIsXG4gICAgICB9KSxcbiAgICAgIC8qXG4gICAgICBuZXcgTnVtZXJpY0NvbHVtbih7XG4gICAgICAgIG5hbWU6ICdzcGVjaWFsQ29uZGl0aW9uJyxcbiAgICAgICAgaW5kZXg6IDQsXG4gICAgICAgIHR5cGU6IENPTFVNTi5VOCxcbiAgICAgIH0pLFxuICAgICAgKi9cbiAgICBdXG4gIH0pO1xuXG4gIGNvbnN0IHJvd3M6IGFueVtdID0gW107XG5cbiAgZnVuY3Rpb24gYWRkUm93IChcbiAgICB1bml0SWQ6IG51bWJlcixcbiAgICBzcGVsbElkOiBudW1iZXIsXG4gICAgc3VtbW9uVHlwZTogbnVtYmVyLFxuICAgIHN1bW1vblN0cmVuZ3RoOiBudW1iZXIsXG4gICkge1xuICAgIHJvd3MucHVzaCh7XG4gICAgICB1bml0SWQsXG4gICAgICBzcGVsbElkLFxuICAgICAgc3VtbW9uVHlwZSxcbiAgICAgIHN1bW1vblN0cmVuZ3RoLFxuICAgICAgX19yb3dJZDogcm93cy5sZW5ndGgsXG4gICAgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHNwZWxsIG9mIFNwZWxsLnJvd3MpIHtcbiAgICBsZXQgc3VtbW9uczogbnVtYmVyIHwgbnVtYmVyW10gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgc3VtbW9uVHlwZSA9IFNQRUxMX1NVTU1PTi5CQVNJQztcbiAgICBsZXQgc3VtbW9uU3RyZW5ndGggPSBzcGVsbC5lZmZlY3RzX2NvdW50O1xuICAgIGlmIChTUEVDSUFMX1NVTU1PTltzcGVsbC5pZF0pIHtcbiAgICAgIHN1bW1vbnMgPSBTUEVDSUFMX1NVTU1PTltzcGVsbC5pZF07XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VtbW9ucykpIHRocm93IG5ldyBFcnJvcigndSBnbyB0byBoZWxsIG5vdycpO1xuICAgICAgc3dpdGNoIChzcGVsbC5pZCkge1xuICAgICAgICAvLyBpcm9uIGhvZ2dzXG4gICAgICAgIGNhc2UgODU5OlxuICAgICAgICAgIGFkZFJvdyhzdW1tb25zWzBdLCA4NTksIFNQRUxMX1NVTU1PTi5CQVNJQywgc3VtbW9uU3RyZW5ndGgpO1xuICAgICAgICAgIGFkZFJvdyhzdW1tb25zWzFdLCA4NTksIFNQRUxMX1NVTU1PTi5TUEVDSUFMX0hPRywgIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gdW5sZWFzaCBpbXByaXNvbmVkIG9uZXNcbiAgICAgICAgY2FzZSA2MDc6XG4gICAgICAgICAgZm9yIChjb25zdCB1aWQgb2Ygc3VtbW9ucylcbiAgICAgICAgICAgIGFkZFJvdyhcbiAgICAgICAgICAgICAgdWlkLFxuICAgICAgICAgICAgICA2MDcsXG4gICAgICAgICAgICAgIFNQRUxMX1NVTU1PTi5DT01NQU5ERVIsXG4gICAgICAgICAgICAgIHN1bW1vblN0cmVuZ3RoXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBpbmZlcm5hbCBicmVlZGluZ1xuICAgICAgICBjYXNlIDMyMDpcbiAgICAgICAgICBmb3IgKGNvbnN0IHVpZCBvZiBzdW1tb25zKVxuICAgICAgICAgICAgYWRkUm93KHVpZCwgMzIwLCBTUEVMTF9TVU1NT04uUElDS19PTkUsIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gdGFydHNcbiAgICAgICAgY2FzZSAxMDgwOlxuICAgICAgICAgIGZvciAoY29uc3QgdWlkIG9mIHN1bW1vbnMpXG4gICAgICAgICAgICBhZGRSb3coXG4gICAgICAgICAgICAgIHVpZCxcbiAgICAgICAgICAgICAgMTA4MCxcbiAgICAgICAgICAgICAgU1BFTExfU1VNTU9OLlBJQ0tfT05FfFNQRUxMX1NVTU1PTi5DT01NQU5ERVIsXG4gICAgICAgICAgICAgIHN1bW1vblN0cmVuZ3RoXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBhbmdlbGljIGhvc3QvaG9yZGUgZnJvbSBoZWxsXG4gICAgICAgIGNhc2UgNDgwOlxuICAgICAgICBjYXNlIDE0MTA6XG4gICAgICAgICAgYWRkUm93KHN1bW1vbnNbMF0sIHNwZWxsLmlkLCBTUEVMTF9TVU1NT04uUkVNT1RFfFNQRUxMX1NVTU1PTi5DT01NQU5ERVIsIDEpO1xuICAgICAgICAgIGFkZFJvdyhzdW1tb25zWzFdLCBzcGVsbC5pZCwgU1BFTExfU1VNTU9OLlJFTU9URSwgIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gZ2hvc3QgYXJtYWRhXG4gICAgICAgIGNhc2UgMTIxOTpcbiAgICAgICAgICBmb3IgKGNvbnN0IHVpZCBvZiBzdW1tb25zKVxuICAgICAgICAgICAgYWRkUm93KFxuICAgICAgICAgICAgICB1aWQsXG4gICAgICAgICAgICAgIDEyMTksXG4gICAgICAgICAgICAgIFNQRUxMX1NVTU1PTi5CQVNJQyxcbiAgICAgICAgICAgICAgMSwgLy8gVE9ETyAtIHByb2JhYmx5IG5lZWQgdG8gbG9vayB0aGVzZSB1cD9cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmhhbmRsZWQgc3BlY2lhbCBzdW1tb24gZm9yIHNwZWxsIGlkICR7c3BlbGwuaWR9P2ApO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3dpdGNoIChzcGVsbC5lZmZlY3RfbnVtYmVyKSB7XG4gICAgICBjYXNlIDE6IC8vIGJhc2ljIHN1bW1vbiBtb25zdGVyXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyMTogLy8gYmFzaWMgc3VtbW9uIGNvbW1hbmRlclxuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5DT01NQU5ERVI7XG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzNzogLy8gcmVtb3RlIHN1bW1vblxuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5SRU1PVEVcbiAgICAgIGNhc2UgMzg6IC8vIHJlbW90ZSBzdW1tb24gdGVtcG9yYXJ5XG4gICAgICAgIHN1bW1vblR5cGUgfD1TUEVMTF9TVU1NT04uVEVNUE9SQVJZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MzogLy8gYmF0dGxlIGVkZ2VcbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uQ09NQkFUfFNQRUxMX1NVTU1PTi5FREdFXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDUwOiAvLyByZW1vdGUgc3VtbW9uIGFzc2Fzc2luXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkFTU0FTU0lOfFNQRUxMX1NVTU1PTi5DT01NQU5ERVI7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDY4OiAvLyBhbmltYWxzIFRPRE8gLSBzaG91bGQgcHJvYmFibHkgYmUgdW5kZXIgc3BlY2lhbCwgaWRrIHdoYXQgYW5pbWFsc1xuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gbm90IHN1cmUgaG93IHRoZXNlIHR3byBkaWZmZXIhXG4gICAgICBjYXNlIDg5OiAvLyAocmUpc3VtbW9uIHVuaXF1ZVxuICAgICAgICBsZXQgaWR4ID0gTnVtYmVyKHNwZWxsLnJhd192YWx1ZSkgfHwgTnVtYmVyKHNwZWxsLmRhbWFnZSk7XG4gICAgICAgIGlmIChpZHggPCAwKSBpZHggKj0gLTFcbiAgICAgICAgc3VtbW9ucyA9IFVOSVFVRV9TVU1NT05baWR4XTtcbiAgICAgICAgaWYgKCFzdW1tb25zKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgc3RpbGwgZnVja2VkIHVwIHVuaXF1ZSBzdW1tb24gc2hpdCBAICR7aWR4fWAsIHNwZWxsKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bpc3MgY2l0eScpO1xuICAgICAgICB9XG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTU1BTkRFUnxTUEVMTF9TVU1NT04uVU5JUVVFO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgOTM6IC8vIChyZSlzdW1tb24gdW5pcXVlXG4gICAgICAgIHN1bW1vbnMgPSBzcGVsbC5yYXdfdmFsdWU7XG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTU1BTkRFUnxTUEVMTF9TVU1NT04uVU5JUVVFO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxMTk6IC8vIHJlbW90ZSBzdGVhbHRoeVxuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5DT01NQU5ERVJ8U1BFTExfU1VNTU9OLlNURUFMVEhZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxMjY6IC8vIG5ldHJ1YWwgYmF0dGxlZmllbGRcbiAgICAgICAgc3VtbW9uVHlwZSB8PSBTUEVMTF9TVU1NT04uQ09NQkFUfFNQRUxMX1NVTU1PTi5ORVVUUkFMO1xuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxMzc6IC8vIHN1bW1vbiAoTGFkb24pIGlmIGFsaXZlXG4gICAgICAgIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLlVOSVFVRXxTUEVMTF9TVU1NT04uQ09NTUFOREVSfFNQRUxMX1NVTU1PTi5BTElWRV9PTkxZO1xuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNDE6IC8vIEZBTkNZIEJJUkRcbiAgICAgICAgc3VtbW9uU3RyZW5ndGggPSAyOyAvLyBub3QgcmVhbGx5IGJ1dC4uLiBpdHMgZm9yIGRpc3BsYXlcbiAgICAgICAgc3VtbW9ucyA9IHNwZWxsLnJhd192YWx1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY2OiAvLyBUUkVFU1xuICAgICAgICBzdW1tb25zID0gc3BlbGwucmF3X3ZhbHVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gY2FzZSAxMjc6IC8vIGluZmVybmFsIGJyZWVkaW5nIChDUkVBVEVTIERFT01PTiBHVVlTPz8/KSBub3cgc3BlY2lhbFxuICAgICAgY2FzZSAzNTogIC8vIGNyb3NzLWJyZWVkaW5nIChDUkVBVEVTIEZPVUwgR1VZUykgVE9ETyAtIG1vcmUgd29yaywgdXNlIG1vbnRhZ3M/XG4gICAgICAgIHN1bW1vbnMgPSBbXG4gICAgICAgICAgNDUzLCAvLyBGb3VsIFNwYXduXG4gICAgICAgICAgNDU0LCAvLyBGb3VsIFNwYXduXG4gICAgICAgICAgNDU3LCAvLyBGb3VsIFNwYXduXG4gICAgICAgICAgNDU4LCAvLyBGb3VsIFNwYXduXG4gICAgICAgICAgNDYxLCAvLyBGb3VsIFNwYXduXG4gICAgICAgICAgNDY2LCAvLyBDb2NrYXRyaWNlXG4gICAgICAgICAgNDY3LCAvLyBGb3VsIEJlYXN0XG4gICAgICAgICAgNDg3LCAvLyBDaGltZXJhXG4gICAgICAgICAgNDg4LCAvLyBFdHRpblxuICAgICAgICBdO1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gVE9ETyByZXZpc2l0IHRoZXNlXG4gICAgICBjYXNlIDEzMDogLy8gKEEgS0lORCBPRiBQb2x5bW9ycGgpXG4gICAgICBjYXNlIDU0OiAgLy8gKE5PVEU6IHBvbHltb3JwaCB0byBhcmchKVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gdGhpcyBhcHBhcmVudGx5IGFpbnQgYSBzdW1tb25pbmcgc3BlbGw/P1xuICAgIGlmICghc3VtbW9ucykge1xuICAgICAgc3VtbW9ucyA9IHNwZWxsLmRhbWFnZTtcbiAgICAgIGlmICghc3VtbW9ucykge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICc/Pz8/ICcgKyBzcGVsbC5pZCArICcsICcgKyBzcGVsbC5lZmZlY3RfbnVtYmVyICsgJy0+JyArIHN1bW1vbnNcbiAgICAgICAgKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzcGVsbC5yaXR1YWwpIHN1bW1vblR5cGUgfD0gU1BFTExfU1VNTU9OLkNPTUJBVDtcbiAgICAvLyBzbWhcbiAgICBpZiAodHlwZW9mIHN1bW1vbnMgPT09ICdiaWdpbnQnKSBzdW1tb25zID0gTnVtYmVyKHN1bW1vbnMpO1xuICAgIGlmICh0eXBlb2Ygc3VtbW9ucyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChzdW1tb25zIDwgMCkge1xuICAgICAgICBpZiAoIU1PTlRBR1Nbc3VtbW9ucyBhcyBudW1iZXJdKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBtaXNzZWQgbW9udGFnICR7c3VtbW9uc31gKVxuICAgICAgICB9XG4gICAgICAgIHN1bW1vbnMgPSBNT05UQUdTW3N1bW1vbnMgYXMgbnVtYmVyXVxuICAgICAgICBzdW1tb25UeXBlIHw9IFNQRUxMX1NVTU1PTi5QSUNLX09ORTsgLy8gbWF5YmUgbm90IHF1aXRlIGFjY3VyYXRlP1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3VtbW9ucyA9IFtzdW1tb25zXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3VtbW9ucykpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdXVEYgSVMgVEhJUycsIHN1bW1vbnMpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lPVSBGVUNLRUQgVVAnKTtcbiAgICB9XG4gICAgaWYgKCFzdW1tb25zLmxlbmd0aCkge1xuICAgICAgLypcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBtaXNzaW5nIHN1bW1vbnMgZm9yICR7c3BlbGwuaWR9OiR7c3BlbGwubmFtZX1gLFxuICAgICAgICB7XG4gICAgICAgICAgZWZmZWN0OiBzcGVsbC5lZmZlY3RfbnVtYmVyLFxuICAgICAgICAgIGRhbWFnZTogc3BlbGwuZGFtYWdlLFxuICAgICAgICAgIHN1bW1vbnMsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICAqL1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB1aWQgb2Ygc3VtbW9ucykge1xuICAgICAgY29uc3QgdW5pdCA9IFVuaXQubWFwLmdldCh1aWQpXG4gICAgICBpZiAoIXVuaXQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgJHtzcGVsbC5pZH06JHtzcGVsbC5uYW1lfSBzdW1tb25zIHVua25vd24gY3JlYXR1cmUgJHt1aWR9YCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYWRkUm93KHVpZCwgc3BlbGwuaWQsIHN1bW1vblR5cGUsIHN1bW1vblN0cmVuZ3RoKTtcbiAgICAgIC8vIHdlIG1heSBkaXNjb3ZlciBjb21tYW5kZXIgc3RhdHVzIGhlcmU6XG4gICAgICBpZiAoKFNQRUxMX1NVTU1PTi5DT01NQU5ERVIgJiBzdW1tb25UeXBlKSAmJiAhKHVuaXQudHlwZSAmIFVOSVRfVFlQRS5DT01NQU5ERVIpKSB7XG4gICAgICAgIC8qXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYCAqKioqKiAke1xuICAgICAgICAgIHNwZWxsLmlkfToke3NwZWxsLm5hbWVcbiAgICAgICAgfSBpbmRpY2F0ZXMgdGhhdCAke1xuICAgICAgICAgIHVpZH06JHt1bml0LmlkXG4gICAgICAgIH0gaXMgYSBjb21tYW5kZXIgKHByZXY9JHtcbiAgICAgICAgICB1bml0LnR5cGVcbiAgICAgICAgfSlgKTtcbiAgICAgICAgKi9cbiAgICAgICAgdW5pdC50eXBlIHw9IFVOSVRfVFlQRS5DT01NQU5ERVI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhYmxlc1tzY2hlbWEubmFtZV0gPSBUYWJsZS5hcHBseUxhdGVKb2lucyhcbiAgICBuZXcgVGFibGUocm93cywgc2NoZW1hKSxcbiAgICB0YWJsZXMsXG4gICAgdHJ1ZSxcbiAgKTtcbn1cblxuXG5cbi8vIEkgZG9uJ3QgdGhpbmsgdGhlc2UgYXJlIGRlZmluZWQgZGlyZWN0bHkgaW4gdGhlIGRhdGEgKGp1c3QgYSBuYW1lKSwgYnV0IHdlXG4vLyBjb3VsZCBtYWludGFpbiBhIHRhYmxlICsgam9pblxuY29uc3QgTU9OVEFHUyA9IHtcbiAgLy8gZmF5IGZvbGtcbiAgWy0yNl06IFtdLFxuICAvLyBkd2FyZnNcbiAgWy0yMV06IFszNDI1LCAzNDI2LCAzNDI3LCAzNDI4XSxcbiAgLy9SYW5kb20gQmlyZCAoRmFsY29uLCBCbGFjayBIYXdrLCBTd2FuIG9yIFN0cmFuZ2UgQmlyZClcbiAgWy0yMF06IFszMzcxLCA1MTcsIDI5MjksIDMzMjddLFxuICAvLyBMaW9uc1xuICBbLTE5XTogWzMzNjMsIDMzNjQsIDMzNjUsIDMzNjZdLFxuICAvLyBTb3VsIHRyYXAgc29tZXRoaW5nIG9yIG90aGVyP1xuICBbLTE4XTogW10sXG4gIC8vIFlhdGFzIGFuZCBQYWlyaWthc1xuICBbLTE3XTogWzI2MzIsIDI2MzMsIDI2MzQsIDI2MzZdLFxuICAvLyBDZWxlc3RpYWwgWWF6YWRcbiAgWy0xNl06IFsyNjIwLCAyNjIxLCAyNjIyLCAyNjIzLCAyNjI0LCAyNjI1XSxcblxuICAvLyBUT0RPIC0gbmVlZCB0byBmaWd1cmUgb3V0IHdoaWNoIG1vbnN0ZXJzIHRoZXNlIHJlYWxseSBhcmUgKGNyb3NzYnJlZW5kcylcbiAgWy0xMl06IFs1MzBdLCAvLyAzJSBnb29kP1xuICBbLTExXTogWzUzMF0sIC8vIGJhZFxuICBbLTEwXTogWzUzMF0sIC8vIGdvb2RcblxuICAvLyBSYW5kb20gQnVnXG4gIFstOV06IFtdLFxuICAvLyBEb29tIEhvcnJvclxuICBbLThdOiBbXSxcbiAgLy8gSG9ycm9yXG4gIFstN106IFtdLFxuICAvLyBMZXNzZXIgSG9ycm9yXG4gIFstNl06IFtdLFxuICAvLyBSYW5kb20gQW5pbWFsXG4gIFstNV06IFtdLFxuICAvLyBHaG91bFxuICBbLTRdOiBbXSxcbiAgLy8gU291bHRyYXAgR2hvc3RcbiAgWy0zXTogW10sXG4gIC8vIExvbmdkZWFkXG4gIFstMl06IFtdLFxuICAvLyBTb3VsbGVzc1xuICBbLTFdOiBbXSxcbn1cbi8vIGlkayB0YmgsIGp1c3Qgc3R1ZmYgd2l0aCB3ZWlyZCBjb25kaXRpb25zIG9yIHdoYXRldmVyXG5jb25zdCBTUEVDSUFMX1NVTU1PTiA9IHtcbiAgLy8gdGhlc2UgYXJlIG5vdCBtb250YWdzIHBlciBzZSwgaW0gc3VyZSB0aGVyZSBhcmUgcmVhc29ucyBmb3IgdGhpcy5cbiAgLy8gdGFydGFyaWFuIEdhdGUgLyBlZmZlY3QgNzZcbiAgWzEwODBdOiBbNzcxLCA3NzIsIDc3MywgNzc0LCA3NzUsIDc3NiwgNzc3XSxcbiAgLy8gZWEgYXJnYXJ0aGEgXCJ1bmxlYXNoZWQgaW1wcmlzb25lZCBvbmVzXCIgZWZmZWN0IDExNlxuICBbNjA3IF06IFsyNDk4LCAyNDk5LCAyNTAwXSxcbiAgLy8gYW5nZWxpYyBob3N0IHNwZWxsIDQ4MCAgd2VpcmQgZG91YmxlIHN1bW1vbiAoZWZmIDM3KVxuICBbNDgwIF06IFs0NjUsIDM4NzBdLFxuICAvLyBob3JkZXMgZnJvbSBoZWxsIHdlaXJkIGRvdWJsZSBzdW1tb24gKGVmZiAzNylcbiAgWzE0MTBdOiBbMzA0LCAzMDNdLFxuICAvLyBpcm9uIHBpZyArIGlyb24gYm9hciBmb3IgZWEgbWFydmVybmkuLi5cbiAgWzg1OSBdOiBbOTI0LCAxODA4XSxcbiAgLy8gZ2hvc3Qgc2hpcCBhcm1hZGEgZ2xvYmFsIHNwZWxsIDEyMTkgZWZmZWN0IDgxIChnbG9iYWwpIGFuZCBkYW1hZ2UgPT09IDQzXG4gIFsxMjE5XTogWzMzNDgsIDMzNDksIDMzNTAsIDMzNTEsIDMzNTJdLFxuICAvLyBpbmZlcm5hbCBicmVlZGluXG4gIFszMjAgXTogWzI5NjcsIDI5NjgsIDI5NjksIDI5NzAsIDI5NzEsIDI5NzIsIDI5NzMsIDI5NzQsIDMwNjFdLFxuXG59O1xuXG4vLyBmcm9tIGVmZmVjdCA4OSwga2V5IGlzIGRhbWFnZS9yYXdfYXJndW1lbnRcbmNvbnN0IFVOSVFVRV9TVU1NT04gPSB7XG4gIC8vIEJpbmQgSWNlIERldmlsXG4gIDE6ICBbMzA2LCA4MjEsICA4MjIsIDgyMywgODI0LCA4MjVdLFxuICAvLyBCaW5kIEFyY2ggRGV2aWxcbiAgMjogIFszMDUsIDgyNiwgODI3LCA4MjgsIDgyOV0sXG4gIC8vIEJpbmQgSGVsaW9waGFndXNcbiAgMzogIFs0OTIsIDgxOCwgODE5LCA4MjBdLFxuICAvLyBLaW5nIG9mIEVsZW1lbnRhbCBFYXJ0aFxuICA0OiAgWzkwNiwgNDY5XSxcbiAgLy8gRmF0aGVyIElsbGVhcnRoXG4gIDU6ICBbNDcwXSxcbiAgLy8gUXVlZW4gb2YgRWxlbWVudGFsIFdhdGVyXG4gIDY6ICBbMzU5LCA5MDcsIDkwOF0sXG4gIC8vIFF1ZWVuIG9mIEVsZW1lbnRhbCBBaXJcbiAgNzogIFs1NjMsIDkxMSwgOTEyXSxcbiAgLy8gS2luZyBvZiBFbGVtZW50YWwgRmlyZVxuICA4OiAgWzYzMSwgOTEwXSxcbiAgLy8gS2luZyBvZiBCYW5lZmlyZXNcbiAgOTogIFs5MDldLFxuICAvLyBCaW5kIERlbW9uIExvcmRcbiAgMTA6IFs0NDYsIDgxMCwgOTAwLCAxNDA1LCAyMjc3LCAyMjc4XSxcbiAgLy8gQXdha2VuIFRyZWVsb3JkXG4gIDExOiBbNjIxLCA5ODAsIDk4MV0sXG4gIC8vIENhbGwgQW1lc2hhIFNwZW50YVxuICAxMjogWzEzNzUsIDEzNzYsIDEzNzcsIDE0OTIsIDE0OTMsIDE0OTRdLFxuICAvLyBTdW1tb24gVGxhbG9xdWVcbiAgMTM6IFsxNDg0LCAxNDg1LCAxNDg2LCAxNDg3XSxcbiAgLy8gUmVsZWFzZSBMb3JkIG9mIENpdmlsaXphdGlvblxuICAxNDogWzIwNjMsIDIwNjUsIDIwNjYsIDIwNjcsIDIwNjQsIDIwNjJdLFxuICAvLyA/Pz8/XG4gIDE1OiBbIF0sXG4gIC8vIGdyZWF0ZXIgZGFldmFcbiAgMTY6IFsyNjEyLCAyNjEzLCAyNjE0LCAyNjE1LCAyNjE2LCAyNjE3XSxcbiAgLy8gQmFsYW1cbiAgMTc6IFsyNzY1LCAyNzY4LCAyNzcxLCAyNzc0XSxcbiAgLy8gQ2hhYWNcbiAgMTg6IFsyNzc4LCAyNzc5LCAyNzgwLCAyNzgxXSxcbiAgLy9TYW5ndWluZSBIZXJpdGFnZVxuICAxOTogWzEwMTksIDEwMzUsIDMyNDQsIDMyNDUsIDMyNTEsIDMyNTIsIDMyNTMsIDMyNTVdLFxuICAvLyBNYW5kZWhhXG4gIDIwOiBbMTc0OCwgMzYzNSwgMzYzNl0sXG4gIC8vIDRkIGR3YXJmXG4gIDIxOiBbMzQyNSwgMzQyNiwgMzQyNywgMzQyOF0sXG59O1xuXG4vLyBlZmZlY3QgMTAwXG5jb25zdCBURVJSQUlOX1NVTU1PTiA9IHtcbiAgLy8gSGlkZGVuIGluIFNub3dcbiAgMTogWzEyMDEsIDEyMDAsIDEyMDIsIDEyMDNdLFxuICAvLyBIaWRkZW4gaW4gU2FuZFxuICAyOiBbMTk3OSwgMTk3OCwgMTk4MCwgMTk4MV0sXG4gIC8vIEhpZGRlbiBVbmRlcm5lYXRoXG4gIDM6IFsyNTIyLCAyNTIzLCAyNTI0LCAyNTI1XVxufTtcbi8qXG5cbnNwZWxsIGZpbmRlcjpcbmNvbnN0IHNwID0gX190LlNwZWxsXG5mdW5jdGlvbiBmaW5kU3AoZSwgcml0LCBzZWwgPSAtMykge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBBcnJheS5mcm9tKFxuICAgICAgICAgICAgc3AuZmlsdGVyUm93cyhyID0+IHIuZWZmZWN0X251bWJlciA9PT0gZSAmJiAoXG4gICAgICAgICAgICAgICAgcml0ID09IG51bGwgfHwgKHJpdCAmJiByLnJpdHVhbCkgfHwgKCFyaXQgJiYgIXIucml0dWFsKSlcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICByID0+IGAtICAke3Iucml0dWFsID8gJ1InIDogJ0MnIH0gJHtyLmlkfSAke3IubmFtZX0gOiAke3IucmF3X2FyZ3VtZW50fWBcbiAgICAgICAgKS5zbGljZShzZWwpLmpvaW4oJ1xcbicpXG4gICAgKVxufVxuXG4vLy8vLyBTVU1NT04gRUZGRUNUUyAvLy8vLy9cbkRPTkUgMTogKFNVTU1PTiBNT05TVEVSKVxuLSAgUiAxNDUyIEluZmVybmFsIFRlbXBlc3QgOiA2MzJcbi0gIFIgMTQ1MyBGb3JjZXMgb2YgSWNlIDogNDQ5XG4tICBSIDE0NTQgSW5mZXJuYWwgQ3J1c2FkZSA6IDQ4OVxuLSAgQyAxMTg0IEhvcmRlIG9mIFNrZWxldG9ucyA6IC0yXG4tICBDIDEzODUgU3VtbW9uIEltcHMgOiAzMDNcbi0gIEMgMTQxNyBTdW1tb24gSWxsZWFydGggOiAzNzU2XG5cbkRPTkUgMzg6IChSRU1PVEUgU1VNTU9OIFVOSVQgVEVNUClcbi0gIFIgMTA3OCBHaG9zdCBSaWRlcnMgOiAxODlcbi0gIFIgMTQxNiBTZW5kIExlc3NlciBIb3Jyb3IgOiAtNlxuLSAgUiAxNDU1IFNlbmQgSG9ycm9yIDogLTdcblxuRE9ORSAyMTogKFNVTU1PTiBDT01NQU5ERVIpXG4tICBSIDEzODQgQmluZCBTaGFkb3cgSW1wIDogMjI4N1xuLSAgUiAxNDEyIEJpbmQgU3VjY3VidXMgOiA4MTFcbi0gIFIgMTQ0NCBDdXJzZSBvZiBCbG9vZCA6IDQwNFxuLSAgQyA1NiBHcm93IExpY2ggOiA5NjBcbi0gIEMgNTggU3VtbW9uIFFhcmluIDogMzQ3MVxuLSAgQyA4MCBPcGVuIFNvdWwgVHJhcCA6IC0xOFxuXG5ET05FIDM3OiAoUEVSTUFORU5UIFJFTU9URSBTVU1NT04pXG4tICBSIDEyNTcgQXJteSBvZiB0aGUgRGVhZCA6IC0yXG4tICBSIDE0MTAgSG9yZGUgZnJvbSBIZWxsIDogMzAzXG4tICBSIDE0MjggUGxhZ3VlIG9mIExvY3VzdHMgOiAyNzk0XG5cbkRPTkUgMTM3OiAoU1VNTU9OLCBBTElWRSBPTkxZKVxuLSAgUiAyNjYgQ2FsbCBMYWRvbiA6IDMxNjdcblxuRE9ORSA5MzogKFNVTU1PTiBVTklRVUU/KVxuLSAgUiAyNzIgRGF1Z2h0ZXIgb2YgVHlwaG9uIDogMTgyMlxuLSAgUiAxMDcyIENhbGwgdGhlIEVhdGVyIG9mIHRoZSBEZWFkIDogOTk0XG5cbkRPTkUgNTA6IChTVU1NT04gQVNTQVNTSU4pXG4tICBSIDQ0OSBTZW5kIEFhdHhlIDogMzYyOVxuLSAgUiAxMDY3IEVhcnRoIEF0dGFjayA6IDM3NDFcbi0gIFIgMTQyMiBJbmZlcm5hbCBEaXNlYXNlIDogMTY2MlxuXG5ET05FIDExOTogKFJFTU9URSBTVU1NT04gU1RFQUxUSFkpXG4tICBSIDMyNiBTZW5kIFZvZHlhbm95IDogMTk1M1xuXG5cbkRPTkUgODk6IChVTklRVUUgU1VNTU9OISlcbi0gIFIgMTQzMCBGYXRoZXIgSWxsZWFydGggOiA1XG4tICBSIDE0MzggQmluZCBIZWxpb3BoYWd1cyA6IDNcbi0gIFIgMTQ1MCBCaW5kIERlbW9uIExvcmQgOiAxMFxuXG5ET05FIDE0MTogU1VNTU9OIEZBTkNZIEJJUkQgT05MWVxuLSAgUiA1MzcgQ2FsbCB0aGUgQmlyZHMgb2YgU3BsZW5kb3IgOiAzMzgyXG5ET05FIDExNjpcbi0gIFIgNjA3IFVubGVhc2ggSW1wcmlzb25lZCBPbmVzIDogMVxuXG5FRkZFQ1QgMTY2OlxuXG4tICBDIDc5OSBBbmltYXRlIFRyZWUgOiAzNjFcbi0gIEMgOTE4IEF3YWtlbiBGb3Jlc3QgOiAzNjFcblxuRUZGRUNUIDY4OiAoTk9URTogYW5pbWFsIHN1bW1vbiEpXG4tICBSIDkyMSBTdW1tb24gQW5pbWFscyA6IDQwM1xuLSAgUiAxMDU1IEFuaW1hbCBIb3JkZSA6IDQwM1xuXG5FRkZFQ1QgNDM6IChOT1RFOiBlZGdlIGJhdHRsZWZpZWxkIHN1bW1vbilcblxuLSAgQyA5NzAgU2Nob29sIG9mIFNoYXJrcyA6IDgxNVxuLSAgQyA5OTEgV2lsbCBvJyB0aGUgV2lzcCA6IDUyN1xuLSAgQyAxMDEwIENvcnBzZSBDYW5kbGUgOiA1MjhcbkVGRkVDVCAxMjY6IChOT1RFIG5vbi1jb250cm9sbGVkIGJhdHRsZWZpZWxkIHN1bW1vbilcblxuLSAgQyA5NzcgU3VtbW9uIExhbW1hc2h0YXMgOiAzOTNcbi0gIEMgMTQwNyBDYWxsIExlc3NlciBIb3Jyb3IgOiAtNlxuLSAgQyAxNDI2IENhbGwgSG9ycm9yIDogLTdcblxuXG5cbi8vIG5vdCByZWFsbHkgYSBzdW1tb24gYnV0IHdlIHdpbGwgd2FudCB0byB0cmFjayB0aGVzZTpcbkVGRkVDVCAxMzA6IChBIEtJTkQgT0YgUG9seW1vcnBoKVxuLSAgUiAyOTAgSGFubnlhIFBhY3QgOiAzMDcwXG4tICBSIDI5MSBHcmVhdGVyIEhhbm55YSBQYWN0IDogMTQzMlxuXG5FRkZFQ1QgNTQ6IChOT1RFOiBwb2x5bW9ycGggdG8gYXJnISlcblxuLSAgQyA4ODcgQ3Vyc2Ugb2YgdGhlIEZyb2cgUHJpbmNlIDogMjIyMlxuLSAgQyA5MDYgUG9seW1vcnBoIDogNTQ5XG5cbkVGRkVDVCAxMjc6IChDUkVBVEVTIERFT01PTiBHVVlTPz8/KVxuLSAgUiAzMjAgSW5mZXJuYWwgQnJlZWRpbmcgOiAxXG5FRkZFQ1QgMzU6IChDUkVBVEVTIEZPVUwgR1VZUylcbi0gIFIgMTQwMCBDcm9zcyBCcmVlZGluZyA6IDFcbi0gIFIgMTQ0NSBJbXByb3ZlZCBDcm9zcyBCcmVlZGluZyA6IDFcblxuXG5cblxuLy8vLy8gT1RIRVIgRUZGRUNUU1xuXG5cbkVGRkVDVCAwOlxuXG4tICBDIDQ4NCAuLi4gOiAwXG4tICBDIDYzMSAuLi4gOiAwXG4tICBDIDYzMiAuLi4gOiAwXG5FRkZFQ1QgMTA5OlxuXG4tICBDIDEgTWlub3IgQXJlYSBTaG9jayA6IDFcbi0gIEMgMTIwIE1pbm9yIEJsdW50IERhbWFnZSA6IDhcbi0gIEMgNjY5IFBvaXNvbiBEYXJ0cyA6IDlcbkVGRkVDVCAyOlxuXG4tICBDIDE0MTkgSGFybSA6IDEwMDBcbi0gIEMgMTQzNyBMaWZlIGZvciBhIExpZmUgOiA1MDI1XG4tICBDIDE0NDcgZmFya2lsbDogSW5mZXJuYWwgRnVtZXMgOiAxMDA2XG5FRkZFQ1QgMzpcblxuLSAgQyA4MDAgVG9ycG9yIDogNTAxMFxuLSAgQyAxMDA5IEdob3N0IEdyaXAgOiAyMDIzXG4tICBDIDEyNzUgU3RlYWwgQnJlYXRoIDogNTAzNVxuRUZGRUNUIDYwMDpcblxuLSAgQyA0IE1hcmsgOiAyNjFcbi0gIEMgMTI2NSBIb3Jyb3IgTWFyayA6IDI2MVxuRUZGRUNUIDQ6XG5cbi0gIEMgMjYwIFNjYXJlIFNwaXJpdHMgOiAyXG4tICBDIDQyNCBUdW5lIG9mIEZlYXIgOiAzXG4tICBDIDEzMDUgVGVycm9yIDogM1xuRUZGRUNUIDc6XG5cbi0gIEMgODQ0IEJsb29kIFBvaXNvbmluZyA6IDIwMTFcbi0gIEMgODY4IFZlbm9tb3VzIERlYXRoIDogMzAxOVxuLSAgQyA5NzggTWFnZ290cyA6IDUwXG5FRkZFQ1QgMTE6XG5cbi0gIEMgMTM1MSBQbGFndWUgOiA4XG4tICBDIDEzNTUgTWFzcyBDb25mdXNpb24gOiAxNzE3OTg2OTE4NFxuLSAgQyAxMzU3IEh5ZHJvcGhvYmlhIDogMTI4XG5FRkZFQ1QgMTU6XG5cbi0gIEMgMTQgUmV0dXJuaW5nIDogMVxuLSAgQyAxMjc4IFJldHVybmluZyA6IDFcbi0gIEMgMTM1MCBWb3J0ZXggb2YgUmV0dXJuaW5nIDogMVxuRUZGRUNUIDY2OlxuXG4tICBDIDIzMSBQYXJhbHl6YXRpb24gOiAxMFxuLSAgQyA0NjEgUGFydGluZyBvZiB0aGUgU291bCA6IDUwMTBcbi0gIEMgMTMwMCBQYXJhbHl6ZSA6IDkwNDJcbkVGRkVDVCAxMDpcbi0gIFIgMTE2NSBTaW11bGFjcnVtIDogOTAwNzE5OTI1NDc0MDk5MlxuLSAgQyAxNDAzIEJsb29kIEx1c3QgOiAxMjhcbi0gIEMgMTQzNCBQdXJpZnkgQmxvb2QgOiAyODgyMzAzNzYxNTE3MTE3NDRcbi0gIEMgMTQzNiBSdXNoIG9mIFN0cmVuZ3RoIDogMTI4XG5FRkZFQ1QgODE6XG4tICBSIDE0NDAgQmxvb2QgVm9ydGV4IDogODdcbi0gIFIgMTQ0OSBUaGUgTG9vbWluZyBIZWxsIDogNDJcbi0gIFIgMTQ1NiBBc3RyYWwgQ29ycnVwdGlvbiA6IDU3XG4tICBDIDEzNjIgU291bCBEcmFpbiA6IDVcbi0gIEMgMTM3NyBMZWdpb24ncyBEZW1pc2UgOiAxNDNcbi0gIEMgMTQyMSBCbG9vZCBSYWluIDogMTEyXG5cbkVGRkVDVCAyMzpcbi0gIFIgMTA3MyBEcmFnb24gTWFzdGVyIDogMTA3Mzc0MTgyNFxuLSAgUiAxMTU5IFR3aWNlYm9ybiA6IDQxOTQzMDRcbi0gIFIgMTE3OSBSaXR1YWwgb2YgUmV0dXJuaW5nIDogODM4ODYwOFxuLSAgQyAxMzgxIFNhYmJhdGggTWFzdGVyIDogNTc2NDYwNzUyMzAzNDIzNDg4XG4tICBDIDEzODIgU2FiYmF0aCBTbGF2ZSA6IDExNTI5MjE1MDQ2MDY4NDY5NzZcbi0gIEMgMTM5NCBIZWxsIFBvd2VyIDogMTMxMDcyXG5FRkZFQ1QgODI6XG4tICBSIDEzOTcgSW5mZXJuYWwgQ2lyY2xlIDogODlcbi0gIFIgMTQwOCBCbG9vZCBGZWN1bmRpdHkgOiA5NFxuLSAgUiAxNDMyIERvbWUgb2YgQ29ycnVwdGlvbiA6IDY4XG5cbkVGRkVDVCAxMDU6XG5cbi0gIEMgNzEgRGlzYmVsaWV2ZSA6IDk5OVxuRUZGRUNUIDI4OlxuXG4tICBDIDEzNjUgVW5kZWFkIE1hc3RlcnkgOiA5OTlcbi0gIEMgMTM3MiBNYXN0ZXIgRW5zbGF2ZSA6IDk5OVxuLSAgQyAxMzc1IEJlYXN0IE1hc3RlcnkgOiA5OTlcbkVGRkVDVCAxMDE6XG4tICBSIDg2IGFnZSB0aHJlZSB5ZWFycyA6IDNcbi0gIFIgMjg4IFRob3VzYW5kIFllYXIgR2luc2VuZyA6IC01XG4tICBSIDE0MjAgUmVqdXZlbmF0ZSA6IC0xMFxuXG5FRkZFQ1QgMTEyOlxuLSAgUiA5MSBLaWxsIENhc3RlciA6IDk5OTlcbi0gIFIgMTMxNiBQdXJpZnlpbmcgRmxhbWVzIDogMjBcblxuRUZGRUNUIDExMzpcbi0gIFIgOTQgQXN0cmFsIEhhcnBvb24gOiAwXG5cbkVGRkVDVCAxMjg6XG5cbi0gIEMgNjQ3IEJld2l0Y2hpbmcgTGlnaHRzIDogMTAwXG4tICBDIDY2MCBTdG9ybSBXaW5kIDogMjAxM1xuLSAgQyAxMjcwIEZhc2NpbmF0aW9uIDogMTAwXG5FRkZFQ1QgNDg6XG4tICBSIDEyOTcgQXVzcGV4IDogMVxuLSAgUiAxMjk5IEdub21lIExvcmUgOiAzXG4tICBSIDEzODggQm93bCBvZiBCbG9vZCA6IDhcblxuRUZGRUNUIDE3OlxuXG4tICBDIDIxNiBTZXJtb24gb2YgQ291cmFnZSA6IDFcbi0gIEMgMjQyIEZhbmF0aWNpc20gOiAxXG5FRkZFQ1QgOTk6XG5cbi0gIEMgMjI3IFBldHJpZmljYXRpb24gOiA5OTlcbi0gIEMgODU4IFBldHJpZnkgOiA5OTlcbkVGRkVDVCA0Mjpcbi0gIFIgMTQxMyBXcmF0aCBvZiBQYXp1enUgOiAxNFxuLSAgUiAxNDE4IFJhaW4gb2YgVG9hZHMgOiA2XG4tICBSIDE0MzEgU2VuZCBEcmVhbSBIb3Jyb3IgOiAxMlxuXG5FRkZFQ1QgMTM6XG5cbi0gIEMgMTE0NSBIZWFsIDogMTAwMjBcbi0gIEMgMTE1NyBBc3RyYWwgSGVhbGluZyA6IDJcbi0gIEMgMTM4MCBCbG9vZCBIZWFsIDogNTBcbkVGRkVDVCA4OlxuXG4tICBDIDI1OCBNaW5vciBSZWludmlnb3JhdGlvbiA6IDEwXG4tICBDIDI5OCBNZWRpdGF0aW9uIFNpZ24gOiAxNVxuLSAgQyAxMzgzIFJlaW52aWdvcmF0aW9uIDogMjAwXG5FRkZFQ1QgMTM2OlxuLSAgUiAyNjIgQ3Vyc2UgVGFibGV0IDogMlxuLSAgUiA0OTQgU2VpdGggQ3Vyc2UgOiAyXG5cbkVGRkVDVCA1MTE6XG4tICBSIDI2MyBCbGVzc2luZyBvZiB0aGUgR29kLXNsYXllciA6IDY1NFxuLSAgUiAyNzggVGF1cm9ib2xpdW0gOiA2NTFcbkVGRkVDVCA4NTpcbi0gIFIgMjc3IEVwb3B0ZWlhIDogOTRcblxuRUZGRUNUIDExMTpcbi0gIFIgMjg5IEludGVybmFsIEFsY2hlbXkgOiAxNVxuXG5FRkZFQ1QgMjk6XG5cbi0gIEMgMTMyNCBDaGFybSBBbmltYWwgOiA5OTlcbi0gIEMgMTM1NCBDaGFybSA6IDk5OVxuLSAgQyAxNDA5IEhlbGxiaW5kIEhlYXJ0IDogOTk5XG5FRkZFQ1QgNjM6XG4tICBSIDkwMSBXaXphcmQncyBUb3dlciA6IDI0XG4tICBSIDEwNTkgTGl2aW5nIENhc3RsZSA6IDlcbi0gIFIgMTQzOSBUaHJlZSBSZWQgU2Vjb25kcyA6IDI1XG5cbkVGRkVDVCAyNTpcblxuLSAgQyAzNDUgU3RyYW5nZSBGaXJlIDogMTAwNlxuLSAgQyA0NDggSG9seSBQeXJlIDogMTAwNVxuRUZGRUNUIDczOlxuXG4tICBDIDQ1MyBJcm9uIERhcnRzIDogMTNcbi0gIEMgNDU0IElyb24gQmxpenphcmQgOiAxMFxuRUZGRUNUIDE5OlxuLSAgUiA0OTAgTWlycm9yIFdhbGsgOiAxXG4tICBSIDEzMDMgVGVsZXBvcnQgOiAxXG5cblxuRUZGRUNUIDUwMTpcbi0gIFIgMTA2MSBMb3JlIG9mIExlZ2VuZHMgOiAxMDg2XG4tICBDIDU0NyBTY29yY2hpbmcgV2luZCA6IDI1MFxuXG5cbkVGRkVDVCAxMjU6XG4tICBSIDYyOCBNaW5kIFZlc3NlbCA6IDEwMFxuXG5FRkZFQ1QgMTEwOlxuLSAgUiA2MzAgRHJlYW1zIG9mIFInbHllaCA6IDIwNTJcblxuRUZGRUNUIDE0ODpcblxuLSAgQyA2NTAgU3VscGh1ciBIYXplIDogNDA5NlxuLSAgQyA2NTQgUnVzdCBNaXN0IDogMzI3NjhcbkVGRkVDVCAxNDc6XG5cbi0gIEMgNjczIENsb3VkIG9mIERyZWFtbGVzcyBTbHVtYmVyIDogMjA5NzE1MlxuLSAgQyA2NzQgRmlyZSBDbG91ZCA6IDhcbi0gIEMgNzAzIFBvaXNvbiBDbG91ZCA6IDY0XG5FRkZFQ1QgMjc6XG5cbi0gIEMgNjY2IE1hZ2ljIER1ZWwgOiA5OTlcbkVGRkVDVCAyMjpcbi0gIFIgNjc1IEZhdGUgb2YgT2VkaXB1cyA6IDBcblxuRUZGRUNUIDc0OlxuXG4tICBDIDY4MiBCb2x0IG9mIFVubGlmZSA6IDEwMTNcbi0gIEMgNzE0IEJsYXN0IG9mIFVubGlmZSA6IDEwMTdcbi0gIEMgNzQ2IFZvcnRleCBvZiBVbmxpZmUgOiAxMDExXG5FRkZFQ1QgOTE6XG4tICBSIDc0OCBGbGFtZXMgZnJvbSB0aGUgU2t5IDogMTAxNVxuLSAgUiA3NTcgU3RlbGxhciBTdHJpa2UgOiAxNTBcbi0gIFIgMTQ0NiBJbmZlcm5hbCBGdW1lcyA6IDEwMDZcblxuRUZGRUNUIDEzNDpcblxuLSAgQyA2OTUgT3JiIExpZ2h0bmluZyA6IDVcbi0gIEMgNzQzIENoYWluIExpZ2h0bmluZyA6IDEwMDNcbi0gIEMgNzUyIExpZ2h0bmluZyBGaWVsZCA6IDFcbkVGRkVDVCA2MDE6XG5cbi0gIEMgNzAwIEFzdHJhbCBHZXlzZXIgOiAyNjFcbkVGRkVDVCAxNjg6XG4tICBSIDcwNSBQcm9qZWN0IFNlbGYgOiAxMFxuXG5FRkZFQ1QgNTc6XG4tICBSIDcxMSBNaW5kIEh1bnQgOiA5OTlcblxuRUZGRUNUIDcyOlxuXG4tICBDIDcxNiBTdHJlYW0gb2YgTGlmZSA6IDUwMjVcbkVGRkVDVCAxNTM6XG4tICBSIDcyMiBFbGVtZW50YWwgT3Bwb3NpdGlvbiBvZiBFYXJ0aCA6IDFcbi0gIFIgNzI1IEVsZW1lbnRhbCBPcHBvc2l0aW9uIG9mIEZpcmUgOiAxXG4tICBSIDcyNyBFbGVtZW50YWwgT3Bwb3NpdGlvbiBvZiBBaXIgOiAxXG5cbkVGRkVDVCA0MTpcbi0gIFIgNzI0IE11cmRlcmluZyBXaW50ZXIgOiA4XG5cbkVGRkVDVCAxNDY6XG5cbi0gIEMgNzMwIENsb3VkIG9mIERlYXRoIDogMjYyMTQ0XG4tICBDIDczNCBQb2lzb24gTWlzdCA6IDY0XG4tICBDIDEzMjIgTGVlY2hpbmcgRGFya25lc3MgOiAxMzQyMTc3MjhcbkVGRkVDVCAxNjQ6XG4tICBSIDc3OCBBbGNoZW1pY2FsIFRyYW5zbXV0YXRpb24gOiAyMDBcbi0gIFIgODI1IFRyYW5zbXV0ZSBGaXJlIDogMzUwXG4tICBSIDg1NiBFYXJ0aCBHZW0gQWxjaGVteSA6IDMwMFxuXG5FRkZFQ1QgMTM4OlxuXG4tICBDIDc4MCBBcm1vciBvZiBBY2hpbGxlcyA6IDEwXG4tICBDIDgxNCBEZXN0cnVjdGlvbiA6IDVcbkVGRkVDVCA2NzpcblxuLSAgQyA3ODIgV2Vha25lc3MgOiAzXG4tICBDIDg0MSBFbmZlZWJsZSA6IDJcbkVGRkVDVCAxNjI6XG5cbi0gIEMgNzg0IE1pcnJvciBJbWFnZSA6IDIwMDBcblxuRUZGRUNUIDYwOTpcblxuLSAgQyA4MDkgRW5jYXNlIGluIEljZSA6IDI5OVxuLSAgQyA4NzYgUHJpc29uIG9mIFNlZG5hIDogMjk5XG5FRkZFQ1QgOTY6XG5cbi0gIEMgODM5IFNoYXR0ZXIgOiA1MDIwXG5FRkZFQ1QgMTAzOlxuXG4tICBDIDEzOTUgTGVlY2hpbmcgVG91Y2ggOiAxMDE0XG4tICBDIDE0MTEgQmxvb2RsZXR0aW5nIDogMVxuLSAgQyAxNDI3IExlZWNoIDogMTAyNFxuRUZGRUNUIDQ0OlxuLSAgUiA4NjYgVHJhbnNmb3JtYXRpb24gOiAxXG5cbkVGRkVDVCA4NDpcbi0gIFIgMTIyMSBMaW9uIFNlbnRpbmVscyA6IDEwNVxuLSAgUiAxMjU1IERvbWUgb2YgU2V2ZW4gU2VhbHMgOiAxMzJcbi0gIFIgMTM0NSBGb3Jnb3R0ZW4gUGFsYWNlIDogMTExXG5cbkVGRkVDVCA3MDpcbi0gIFIgOTAyIENydW1ibGUgOiAtMjUxNzVcblxuRUZGRUNUIDM2OlxuXG4tICBDIDkwNSBEaXNpbnRlZ3JhdGUgOiA5OTlcbkVGRkVDVCAxMzM6XG5cbi0gIEMgOTE0IFRpbWUgU3RvcCA6IDEwNFxuRUZGRUNUIDM0OlxuLSAgUiA5MTUgV2lzaCA6IDBcblxuRUZGRUNUIDQ5OlxuLSAgUiA5OTYgV2luZCBSaWRlIDogMTAwXG5cbkVGRkVDVCAxMzU6XG4tICBSIDk5NyBSYXZlbiBGZWFzdCA6IDEwMFxuXG5FRkZFQ1QgMTE1OlxuLSAgUiAxMDEyIEFjYXNoaWMgUmVjb3JkIDogOTk5XG5cbkVGRkVDVCA5ODpcbi0gIFIgMTAxNyBXaW5nZWQgTW9ua2V5cyA6IDFcblxuRUZGRUNUIDYyOlxuLSAgUiAxMDY5IE1hbmlmZXN0YXRpb24gOiAzOTJcblxuRUZGRUNUIDc2OlxuLSAgUiAxMDgwIFRhcnRhcmlhbiBHYXRlIDogMTBcblxuRUZGRUNUIDQwOlxuLSAgUiAxMTM2IFNlZWtpbmcgQXJyb3cgOiA4XG5cbkVGRkVDVCA5NTpcbi0gIFIgMTE1MiBDbG91ZCBUcmFwZXplIDogMVxuLSAgUiAxNDA0IEhlbGwgUmlkZSA6IDFcblxuRUZGRUNUIDMwOlxuLSAgUiAxMTgwIERpc3BlbCA6IDFcblxuRUZGRUNUIDc5OlxuLSAgUiAxMTg2IEZhZXJ5IFRyb2QgOiAxXG5cbkVGRkVDVCAxMDA6IChURVJSQUlOIFNVTU1PTiEpXG4tICBSIDExOTcgSGlkZGVuIGluIFNub3cgOiAxXG4tICBSIDEyMDEgSGlkZGVuIGluIFNhbmQgOiAyXG4tICBSIDEyMDIgSGlkZGVuIFVuZGVybmVhdGggOiAzXG5cbkVGRkVDVCAxNTI6XG4tICBSIDEyMjYgRGlzZW5jaGFudG1lbnQgOiAxXG5cbkVGRkVDVCAyNjpcbi0gIFIgMTIyOSBSaXR1YWwgb2YgUmViaXJ0aCA6IDM5OFxuXG5FRkZFQ1QgMTE0OlxuLSAgUiAxMjMzIEF3YWtlbiBUcmVlbG9yZCA6IDExXG5cbkVGRkVDVCAxNjc6XG4tICBSIDEyNDUgTGljaGNyYWZ0IDogMTc4XG5cbkVGRkVDVCA1MDA6XG5cbi0gIEMgMTI2MCBEZXNpY2NhdGlvbiA6IDI1MFxuLSAgQyAxMjk4IEN1cnNlIG9mIHRoZSBEZXNlcnQgOiAyNTBcbi0gIEMgMTQzNSBEYW1hZ2UgUmV2ZXJzYWwgOiAxMDY0XG5FRkZFQ1QgMjA6XG5cbi0gIEMgMTI2MiBCbGluayA6IDMwXG5FRkZFQ1QgOTc6XG5cbi0gIEMgMTI2OCBGcmlnaHRlbiA6IDVcbi0gIEMgMTI5MCBQYW5pYyA6IDFcbi0gIEMgMTI5MyBEZXNwYWlyIDogNFxuRUZGRUNUIDE2MDpcbi0gIFIgMTI4NCBDYXJyaWVyIEJpcmRzIDogMTVcbi0gIFIgMTI4OCBUZWxlcG9ydCBHZW1zIDogMTBcblxuRUZGRUNUIDE2MTpcbi0gIFIgMTI4NSBDYXJyaWVyIEVhZ2xlIDogMVxuLSAgUiAxMzIwIFRlbGVwb3J0IEl0ZW0gOiAxXG5cbkVGRkVDVCA1Mzpcbi0gIFIgMTMwNCBWZW5nZWFuY2Ugb2YgdGhlIERlYWQgOiA5OTlcblxuRUZGRUNUIDEzMTpcbi0gIFIgMTMxMCBDdXJlIERpc2Vhc2UgOiAxXG5cbkVGRkVDVCAxMzI6XG4tICBSIDEzMTUgUHlyZSBvZiBDYXRoYXJzaXMgOiAxXG5cbkVGRkVDVCAzOTpcbi0gIFIgMTMyNyBHaWZ0IG9mIFJlYXNvbiA6IDFcbi0gIFIgMTM0OSBEaXZpbmUgTmFtZSA6IDFcblxuRUZGRUNUIDgzOlxuLSAgUiAxMzMyIFBobGVnbWF0aWEgOiAxMzZcbi0gIFIgMTMzMyBNZWxhbmNob2xpYSA6IDEzN1xuXG5FRkZFQ1QgOTI6XG4tICBSIDEzMzUgSW1wcmludCBTb3VscyA6IDIwNTJcblxuRUZGRUNUIDc3OlxuLSAgUiAxMzM2IEdhdGV3YXkgOiAxXG4tICBSIDEzNjEgQXN0cmFsIFRyYXZlbCA6IDFcblxuRUZGRUNUIDY0OlxuLSAgUiAxMzM4IExlcHJvc3kgOiAxXG5cbkVGRkVDVCA5NDpcbi0gIFIgMTM0MyBCZWNrb25pbmcgOiA5OTlcblxuRUZGRUNUIDkwOlxuLSAgUiAxMzYzIFN0eWdpYW4gUGF0aHMgOiAxXG5cbkVGRkVDVCAxNTY6XG4tICBSIDEzNzAgQXJjYW5lIEFuYWx5c2lzIDogMVxuXG5FRkZFQ1QgMTU3OlxuLSAgUiAxMzcxIEFzdHJhbCBEaXNydXB0aW9uIDogMVxuXG5FRkZFQ1QgMTYzOlxuLSAgUiAxMzczIE5leHVzIEdhdGUgOiAxXG5cbkVGRkVDVCAxMTg6XG4tICBSIDE0MDEgQmxvb2QgRmVhc3QgOiA1MFxuXG5FRkZFQ1QgMTA4OlxuXG4tICBDIDE0NDEgSW5mZXJuYWwgUHJpc29uIDogLTEyXG4tICBDIDE0NDIgQ2xhd3Mgb2YgS29reXRvcyA6IC0xM1xuRUZGRUNUIDEwMjpcbi0gIFIgMTQ0MyBIb3Jyb3IgU2VlZCA6IDlcblxuLy8vLy8gU3BlbGwgQ2FzY2FkZXM6XG5cbjEwMzMgVHJvbGwgS2luZydzIENvdXJ0IC0+XG4gIDI1IDEwIFRyb2xscyAtPlxuICA2MCA1IFdhciBUcm9sbHMgLT5cbiAgNjEgMiBUcm9sbCBNb29zZSBLbmlnaHRzXG5cbjMxIE1ldGVvciBTaG93ZXIgLT4gMTA3IEFyZWEgRmlyZVxuMTAzMCBTZWEgS2luZydzIENvdXJ0IC0+IDM2IDE1IFNlYSBUcm9sbHMgLT4gNzIgNSBUcm9sbCBHdWFyZHNcbjEwNzUgRmFlcmllIENvdXJ0IC0+XG4gIDM4IENvdXJ0IG9mIFNwcml0ZXMgLT5cbiAgMTI0IEZheSBGb2xrIENvdXJ0IC0+XG4gIDEyNSBGYXkgRm9sayBDb3VydCBTb2xkaWVycyAtPlxuICAxMjYgRmF5IEZvbGsgQ291cnQgS25pZ2h0c1xuXG44MzkgU2hhdHRlciAtPiA0MyBleHRyYSBsaW1wIC0+IDQ0IGV4dHJhIGNyaXBwbGVcblxuMTAzNSBFdGhlciBHYXRlIC0+IDY0IDEgRXRoZXIgTG9yZCAtPiA0NSAxNSBFdGhlciBXYXJyaW9yc1xuXG40ODIgSGVhdmVubHkgQ2hvaXIgLT4gNjggQW5nZWxzIG9mIHRoZSBDaG9pciAtPiA2OSBIYXJiaW5nZXJzIG9mIHRoZSBDaG9pclxuXG4xNDIzIFJpdHVhbCBvZiBGaXZlIEdhdGVzIC0+XG4gIDczIEdhdGUgU3VtbW9uIEZpcmUgLT5cbiAgNzQgR2F0ZSBTdW1tb24gSWNlIC0+XG4gIDc1IEdhdGUgU3VtbW9uIFN0b3JtIC0+XG4gIDc2IEdhdGUgU3VtbW9uIElyb25cblxuNTk0IENvbnRhY3QgRGFpIFRlbmd1IC0+IDc3IDEwIFRlbmd1IFdhcnJpb3JzIC0+IDc4IDE1IEthcmFzdSBUZW5ndXNcblxuMzQ4IEJhbnF1ZXQgZm9yIHRoZSBEZWFkIC0+IDkwIDQgRGl0YW51IC0+IDkxIEtpbGwgQ2FzdGVyXG5cbjg4NiBCb25lIEdyaW5kaW5nIC0+IDEwOCBCYXR0bGVmaWVsZCBMaW1wIC0+IDEwOSBCYXR0bGVmaWVsZCBDcmlwcGxlXG5cbjcxNSBCYW5lIEZpcmUgLT4gMTE3IEJhbmUgRmxhbWUgQXJlYSAtPiAyMCBMYXJnZSBBcmVhIERlY2F5XG5cbjI3MSBPcmd5IC0+IDg3IDYgTWFlbmFkc1xuMjc5IHh4eCAtPiA4NyA2IE1hZW5hZHNcblxuMjg2IENlbGVzdGlhbCBDaGFzdGlzZW1lbnQgLT4gODQgQ2hhc3Rpc2VtZW50XG5cbjMxMSBTdW1tb24gR296dSBNZXp1IC0+IDkyIDEgSG9yc2UtZmFjZVxuMzU3IFJlbGVhc2UgTG9yZCBvZiBDaXZpbGl6YXRpb24gLT4gODUgYWdlIHRlbiB5ZWFyc1xuXG40NjEgUGFydGluZyBvZiB0aGUgU291bCAtPiAxMTEgU3VtbW9uIFByZWRhdG9yeSBCaXJkc1xuXG41MTUgQ29udGFjdCBPbmFxdWkgLT4gNjcgQmVhc3QgQmF0c1xuXG41MTkgQnJlYWsgdGhlIEZpcnN0IFNvdWwgLT4gMTAxIERpc2Vhc2VcblxuNTM4IERlY2VpdmUgdGhlIERlY3JlZSBvZiB0aGUgTG9zdCAtPiAxMjEgMTUgR2lhbnRzIG9mIHRoZSBMb3N0IFRyaWJlXG5cbjYwMyBPbG0gQ29uY2xhdmUgLT4gMTEwIDE1IEdyZWF0IE9sbXNcblxuMTQ1MCBCaW5kIERlbW9uIExvcmQgLT4gODUgYWdlIHRlbiB5ZWFyc1xuMTQ1MSBJbmZlcm5hbCBGb3JjZXMgLT4gMjYgNDAgaW1wc1xuXG4xMjU3IEFybXkgb2YgdGhlIERlYWQgLT4gNDYgRXh0cmEgU291bGxlc3NcblxuLy8gbm9uIHN1bW1vbnMgdGhvXG42MzYgU2hvY2tpbmcgR3Jhc3AgLT4gMSBNaW5vciBBcmVhIFNob2NrXG42MzcgR3VzdCBvZiBXaW5kcyAtPiAxMjAgTWlub3IgQmx1bnQgRGFtYWdlXG42NDYgVmluZSBBcnJvdyAtPiA0NyBFbnRhbmdsZVxuNjUwIFN1bHBodXIgSGF6ZSAtPiAzOSBIZWF0IFN0dW5cbjY1MiBMaWdodG5pbmcgQm9sdCAtPiAxIE1pbm9yIEFyZWEgU2hvY2tcblxuNjU5IEZpcmViYWxsIC0+IDExNSBBcmVhIEZsYW1lc1xuNjYwIFN0b3JtIFdpbmQgLT4gMTIwIE1pbm9yIEJsdW50IERhbWFnZVxuNjYzIEFjaWQgQm9sdCAtPiAxMTYgQWNpZCBTcGxhc2hcbjY2NCBNYWdtYSBCb2x0cyAtPiAxMTIgQnVybmluZ1xuNjY4IFNoYWRvdyBCb2x0IC0+IDQyIE1pbm9yIFBhcmFseXNpc1xuNjcwIEZhbHNlIEZpcmUgLT4gMTIyIEFyZWEgRmFsc2UgRmxhbWVzXG42NzcgVGh1bmRlciBTdHJpa2UgLT4gNSBUaHVuZGVyIFNob2NrXG42NzkgQWNpZCBSYWluIC0+IDEzIEFyZWEgUnVzdFxuNjgxIE5ldGhlciBCb2x0IC0+IDI0IEFyZWEgRmVlYmxlIE1pbmRcbjY4MyBCYW5lIEZpcmUgRGFydCAtPiAxMSBBcmVhIERlY2F5XG42ODkgZmFya2lsbDogRmlyZXMgZnJvbSBBZmFyIC0+IDMgTGFyZ2UgQXJlYSBIZWF0IFNob2NrXG42OTYgRWFydGhxdWFrZSAtPiAxMDQgRWFydGhxdWFrZSBLbm9ja2Rvd24gU3R1blxuNjk4IEdpZnRzIGZyb20gSGVhdmVuIC0+IDEwNyBBcmVhIEZpcmVcbjcwMCBBc3RyYWwgR2V5c2VyIC0+IDgzIEFzdHJhbCBHZXlzZXIgQmxhc3RcbjcwMSBTaGFkb3cgQmxhc3QgLT4gNDIgTWlub3IgUGFyYWx5c2lzXG43MTIgQXN0cmFsIEZpcmVzIC0+IDExOCBBc3RyYWwgRmlyZXMgQXJlYVxuNzIxIGZhcmtpbGw6IFRodW5kZXJzdG9ybSAtPiA1IFRodW5kZXIgU2hvY2tcbjcyOSBOZXRoZXIgRGFydHMgLT4gMjQgQXJlYSBGZWVibGUgTWluZFxuNzMyIFN0eWdpYW4gUmFpbnMgLT4gNzkgTmF0dXJhbCBSYWluXG43MzMgU3Rvcm0gb2YgVGhvcm5zIC0+IDQ3IEVudGFuZ2xlXG43MzcgSWxsdXNvcnkgQXR0YWNrIC0+IDMwIEFyY2hlciBJbGx1c2lvbnNcbjc0OSBmYXJraWxsOiBGbGFtZXMgZnJvbSB0aGUgU2t5IC0+IDExMyBMYXJnZSBGaXJlYmFsbFxuNzU4IGZhcmtpbGw6IFN0ZWxsYXIgU3RyaWtlIC0+IDEwNyBBcmVhIEZpcmVcbjgzNyBNYXdzIG9mIHRoZSBFYXJ0aCAtPiAxMDAgZWFydGggZ3JpcFxuODYyIFNrZWxldGFsIExlZ2lvbiAtPiAxMDIgRGlzZWFzZSBBbGwgRnJpZW5kbHlcbjg2OCBWZW5vbW91cyBEZWF0aCAtPiAxMTQgRGVjYXlcbjg5NyBMaXF1aWZ5IC0+IDEwMyBDcmlwcGxlXG45MzggUGhvZW5peCBQb3dlciAtPiAxOSBGaXJlIFJlc2lzdGFuY2Vcbjk4NCBTdHJlbmd0aCBvZiBHYWlhIC0+IDI3IFN0cmVuZ3RoLCBCYXJrc2tpbiBhbmQgUmVnZW5lcmF0aW9uXG45OTggQ29udGFjdCBEcmFjb25pYW5zIC0+IDM3IDMwIERyYWNvbmlhbnNcbjEwMzggRm9yZXN0IFRyb2xsIFRyaWJlIC0+IDk5IDE1IEZvcmVzdCBUcm9sbHNcbjEyMDMgT3Bwb3NpdGlvbiAtPiAxMjMgU3R1biBNYWdpYyBCZWluZ1xuMTI0OCBVbnJhdmVsaW5nIC0+IDQwIEV4dHJhIGZlZWJsZSBtaW5kIGJhdHRsZSBmaWVsZFxuMTM4OSBBZ29ueSAtPiAyMSBNYWpvciBGZWFyXG4xMzk0IEhlbGwgUG93ZXIgLT4gNCBNYXJrXG4xNDE5IEhhcm0gLT4gMzUgQXJlYSBDaGVzdCBXb3VuZFxuXG5cbi8vIHNwZWxscyB0aGF0IGFyZSBcIm5leHRcIiBtdWx0aXBsZSB0aW1lczpcbi8vIChvbmx5IDEgaXMgYSBzdW1tb24sIHRoYXQgb25lIGlzIGJ1Z2dlZCBvciBzbW9ldGhpbmc/KVxuXG5NaW5vciBBcmVhIFNob2NrIDEgMlxuVGh1bmRlciBTaG9jayA1IDJcbkFyZWEgRmVlYmxlIE1pbmQgMjQgMlxuTWlub3IgUGFyYWx5c2lzIDQyIDJcbkVudGFuZ2xlIDQ3IDJcbmFnZSB0ZW4geWVhcnMgODUgMlxuNiBNYWVuYWRzIDg3IDIgLy8gdGhpcyBvbmVcbkFyZWEgRmlyZSAxMDcgM1xuTWlub3IgQmx1bnQgRGFtYWdlIDEyMCAyXG4qL1xuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsSUFBTSxZQUFZO0FBRVgsU0FBUyxhQUNkLEdBQ0EsT0FDQSxVQUM2QjtBQUM3QixRQUFNLFFBQVEsRUFBRSxNQUFNLEdBQUc7QUFDekIsTUFBSSxNQUFNLFNBQVM7QUFBRyxVQUFNLElBQUksTUFBTSxhQUFhLENBQUMscUJBQXFCO0FBQ3pFLFFBQU0sUUFBcUMsQ0FBQztBQUM1QyxhQUFXLEtBQUssT0FBTztBQUNyQixVQUFNLENBQUMsR0FBRyxXQUFXLFlBQVksUUFBUSxJQUFJLEVBQUUsTUFBTSxTQUFTLEtBQUssQ0FBQztBQUNwRSxRQUFJLENBQUMsYUFBYSxDQUFDO0FBQ2pCLFlBQU0sSUFBSSxNQUFNLGFBQWEsQ0FBQyxPQUFPLENBQUMsb0NBQW9DO0FBRTVFLFVBQU0sS0FBSyxDQUFDLFdBQVcsWUFBWSxRQUFRLENBQUM7QUFBQSxFQUM5QztBQUNBLE1BQUk7QUFBVSxlQUFXLEtBQUs7QUFBTyxtQkFBYSxHQUFHLE9BQVEsUUFBUTtBQUNyRSxTQUFPO0FBQ1Q7QUFHTyxTQUFTLGFBQ2QsTUFDQSxPQUNBLFVBQ0E7QUFDQSxRQUFNLENBQUMsV0FBVyxZQUFZLFFBQVEsSUFBSTtBQUMxQyxRQUFNLElBQUksR0FBRyxTQUFTLElBQUksVUFBVSxJQUFJLFdBQVcsTUFBTSxXQUFXLEVBQUU7QUFDdEUsUUFBTSxNQUFNLE1BQU0sT0FBTyxjQUFjLFVBQVU7QUFDakQsTUFBSSxDQUFDO0FBQ0gsVUFB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LG9CQUFJLElBQUk7QUFBQTtBQUFBLE1BRXBCO0FBQUEsTUFBVTtBQUFBLE1BQVU7QUFBQSxNQUFVO0FBQUEsTUFBVTtBQUFBLE1BQ3hDO0FBQUEsTUFBUTtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUEsTUFBUTtBQUFBLE1BQVE7QUFBQSxNQUFRO0FBQUE7QUFBQSxNQUdoRDtBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFDN0M7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQzdDO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUM3QztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUEsTUFBUztBQUFBLE1BQVM7QUFBQSxNQUFTO0FBQUE7QUFBQSxNQUc3QztBQUFBO0FBQUEsTUFFQTtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsYUFBYTtBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUEsTUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFFQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxN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QUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFDRixDQUFDO0FBT00sSUFBTSxTQUFTLG9CQUFJLElBQUk7QUFBQSxFQUM1QjtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFFQTtBQUFBO0FBQ0YsQ0FBQztBQUVNLElBQU0sWUFBWSxvQkFBSSxJQUFJO0FBQUEsRUFDL0I7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUNGLENBQUM7QUFHTSxJQUFNLFVBQVUsb0JBQUksSUFBSTtBQUFBLEVBRTdCO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQSxFQUNBO0FBQUE7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7QUFBQTtBQUFBLEVBQ0E7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QUFNO0FBQUEsSUFDakMsSUFBSSxNQUFNLE1BQU0sTUFBTTtBQUFBLElBQ3RCO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFDRjtBQU1BLElBQU0sVUFBVTtBQUFBO0FBQUEsRUFFZCxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUE7QUFBQSxFQUVSLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxNQUFNLE1BQU0sSUFBSTtBQUFBO0FBQUEsRUFFOUIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJO0FBQUE7QUFBQSxFQUU3QixDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sTUFBTSxNQUFNLElBQUk7QUFBQTtBQUFBLEVBRTlCLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQTtBQUFBLEVBRVIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLE1BQU0sTUFBTSxJQUFJO0FBQUE7QUFBQSxFQUU5QixDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sTUFBTSxNQUFNLE1BQU0sTUFBTSxJQUFJO0FBQUE7QUFBQSxFQUcxQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUc7QUFBQTtBQUFBLEVBQ1gsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHO0FBQUE7QUFBQSxFQUNYLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRztBQUFBO0FBQUE7QUFBQSxFQUdYLENBQUMsRUFBRSxHQUFHLENBQUM7QUFBQTtBQUFBLEVBRVAsQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUFBO0FBQUEsRUFFUCxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBQUE7QUFBQSxFQUVQLENBQUMsRUFBRSxHQUFHLENBQUM7QUFBQTtBQUFBLEVBRVAsQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUFBO0FBQUEsRUFFUCxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBQUE7QUFBQSxFQUVQLENBQUMsRUFBRSxHQUFHLENBQUM7QUFBQTtBQUFBLEVBRVAsQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUFBO0FBQUEsRUFFUCxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBQ1Q7QUFFQSxJQUFN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R0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFDO0FBYXZDO0FBRUEsU0FBUyxjQUNQLEdBQ0EsR0FDQSxHQUNBLEdBQ0EsR0FDQSxHQUNBO0FBQ0EsVUFBUSxJQUFJO0FBQUEsT0FBVSxDQUFDLEdBQUc7QUFDMUIsSUFBRSxPQUFPLE1BQU0sS0FBSztBQUNwQixVQUFRLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHO0FBQ3JDLFFBQU0sT0FBTyxFQUFFLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLE1BQUk7QUFBTSxlQUFXLEtBQUs7QUFBTSxjQUFRLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDakQsVUFBUSxJQUFJLFFBQVEsQ0FBQztBQUFBO0FBQUEsQ0FBTTtBQUM3QjtBQUlBLFFBQVEsSUFBSSxRQUFRLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFcEMsSUFBSTtBQUFNLFVBQVEsSUFBSTtBQUFBO0FBQ2pCLFVBQVE7IiwKICAibmFtZXMiOiBbImkiLCAid2lkdGgiLCAiZmllbGRzIiwgIndpZHRoIiwgIndpZHRoIiwgImZpZWxkcyIsICJmIl0KfQo=
