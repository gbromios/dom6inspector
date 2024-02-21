// src/csv-defs.ts
var csvDefs = {
  "../../gamedata/BaseU.csv": {
    name: "Unit",
    ignoreFields: /* @__PURE__ */ new Set(["end"]),
    overrides: {
      // csv has unrest/turn which is incunrest / 10; convert to int format
      incunrest: (v) => Number(v) * 10 || 0
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
    ignoreFields: /* @__PURE__ */ new Set(["end"])
  }
};

// src/serialize.ts
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

// src/column.ts
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
  "BIG"
];
var COLUMN_WIDTH = {
  [3 /* U8 */]: 1,
  [4 /* I8 */]: 1,
  [5 /* U16 */]: 2,
  [6 /* I16 */]: 2,
  [7 /* U32 */]: 4,
  [8 /* I32 */]: 4
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
  switch (type) {
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
  return type === 9 /* BIG */;
}
function isBoolColumn(type) {
  return type === 2 /* BOOL */;
}
function isStringColumn(type) {
  return type === 1 /* STRING */;
}
var StringColumn = class {
  type = 1 /* STRING */;
  label = COLUMN_LABEL[1 /* STRING */];
  index;
  name;
  width = null;
  flag = null;
  bit = null;
  order = 3;
  offset = null;
  override;
  constructor(field) {
    const { index, name, type, override } = field;
    if (!isStringColumn(type))
      throw new Error("${name} is not a string column");
    if (override && typeof override("foo") !== "string")
      throw new Error(`seems override for ${name} does not return a string`);
    this.index = index;
    this.name = name;
    this.override = override;
  }
  fromText(v) {
    if (this.override)
      return this.override(v);
    if (v.startsWith('"'))
      return v.slice(1, -1);
    return v;
  }
  fromBytes(i, bytes) {
    return bytesToString(i, bytes);
  }
  serialize() {
    return [1 /* STRING */, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    return stringToBytes(v);
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
  override;
  constructor(field) {
    const { name, index, type, override } = field;
    if (!isNumericColumn(type))
      throw new Error(`${name} is not a numeric column`);
    if (override && typeof override("1") !== "number")
      throw new Error(`${name} override must return a number`);
    this.index = index;
    this.name = name;
    this.type = type;
    this.label = COLUMN_LABEL[this.type];
    this.width = COLUMN_WIDTH[this.type];
    this.override = override;
  }
  fromText(v) {
    return this.override ? this.override(v) : v ? Number(v) || 0 : 0;
  }
  fromBytes(i, _, view) {
    switch (this.type) {
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
    }
  }
  serialize() {
    return [this.type, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    const bytes = new Uint8Array(this.width);
    for (let o = 0; o < this.width; o++)
      bytes[o] = v >>> o * 8 & 255;
    return bytes;
  }
};
var BigColumn = class {
  type = 9 /* BIG */;
  label = COLUMN_LABEL[9 /* BIG */];
  index;
  name;
  width = null;
  flag = null;
  bit = null;
  order = 2;
  offset = null;
  override;
  constructor(field) {
    const { name, index, type, override } = field;
    if (override && typeof override("1") !== "bigint")
      throw new Error("seems that override does not return a bigint");
    if (!isBigColumn(type))
      throw new Error(`${type} is not big`);
    this.index = index;
    this.name = name;
    this.override = override;
  }
  fromText(v) {
    if (this.override)
      return this.override(v);
    if (!v)
      return 0n;
    return BigInt(v);
  }
  fromBytes(i, bytes) {
    return bytesToBigBoy(i, bytes);
  }
  serialize() {
    return [9 /* BIG */, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    if (!v)
      return new Uint8Array(1);
    return bigBoyToBytes(v);
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
  override;
  constructor(field) {
    const { name, index, type, bit, flag, override } = field;
    if (override && typeof override("1") !== "boolean")
      throw new Error("seems that override does not return a bigint");
    if (!isBoolColumn(type))
      throw new Error(`${type} is not big`);
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
  fromText(v) {
    if (this.override)
      return this.override(v);
    if (!v || v === "0")
      return false;
    return true;
  }
  fromBytes(i, bytes) {
    return [bytes[i] === this.flag, 0];
  }
  serialize() {
    return [2 /* BOOL */, ...stringToBytes(this.name)];
  }
  serializeRow(v) {
    return v ? this.flag : 0;
  }
};
function cmpFields(a, b) {
  return a.order - b.order || (a.bit ?? 0) - (b.bit ?? 0) || a.index - b.index;
}
function fromText(name, i, index, flagsUsed, data, override) {
  const field = {
    index,
    name,
    override,
    type: 0 /* UNUSED */,
    maxValue: 0,
    minValue: 0,
    width: null,
    flag: null,
    bit: null
  };
  let isUsed = false;
  for (const u of data) {
    const v = field.override ? field.override(u[i]) : u[i];
    if (!v)
      continue;
    isUsed = true;
    const n = Number(v);
    if (Number.isNaN(n)) {
      field.type = 1 /* STRING */;
      return new StringColumn(field);
    } else if (!Number.isInteger(n)) {
      console.warn(`\x1B[31m${i}:${name} has a float? "${v}" (${n})\x1B[0m`);
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
    field.bit = flagsUsed;
    field.flag = 1 << field.bit % 8;
    return new BoolColumn(field);
  }
  if (field.maxValue < Infinity) {
    const type = rangeToNumericType(field.minValue, field.maxValue);
    if (type !== null) {
      field.type = type;
      return new NumericColumn(field);
    }
  }
  field.type = 9 /* BIG */;
  return new BigColumn(field);
}

// src/util.ts
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

// src/schema.ts
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
  constructor({ columns, fields: fields2, name, flagsUsed }) {
    this.name = name;
    this.columns = [...columns];
    this.fields = [...fields2];
    this.columnsByName = Object.fromEntries(this.columns.map((c) => [c.name, c]));
    this.flagFields = flagsUsed;
    this.fixedWidth = columns.reduce(
      (w, c) => w + (c.width ?? 0),
      Math.ceil(flagsUsed / 8)
      // 8 flags per byte, natch
    );
    let o = 0;
    for (const c of columns) {
      switch (c.type) {
        case 9 /* BIG */:
        case 1 /* STRING */:
          break;
        case 2 /* BOOL */:
          c.offset = o;
          if (c.flag === 128)
            o++;
          break;
        default:
          c.offset = o;
          o += c.width;
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
      flagsUsed: 0
    };
    const numFields = bytes[i++] | bytes[i++] << 8;
    let index = 0;
    while (index < numFields) {
      const type = bytes[i++];
      [name, read] = bytesToString(i, bytes);
      const f = { index, name, type, width: null, bit: null, flag: null };
      i += read;
      let c;
      switch (type) {
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
      if (c.offset !== null && c.offset !== totalRead)
        debugger;
      let [v, read] = c.fromBytes(i, bytes, view);
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
      const v = r[c.name];
      if (c.type === 2 /* BOOL */) {
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
          throw new Error("wat type is this");
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

// src/parse-csv.ts
import { readFile } from "node:fs/promises";

// src/table.ts
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
    console.log({ tables, blobs, allSizes, allHeaders, allData });
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

// src/parse-csv.ts
var _nextNameId = 1;
var textDecoder = new TextDecoder();
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
function csvToTable(raw, options) {
  if (raw.indexOf("\0") !== -1)
    throw new Error("uh oh");
  const [rawFields, ...rawData] = raw.split("\n").filter((line) => line !== "").map((line) => line.split("	"));
  const schemaName = options.name ?? `Schema_${_nextNameId++}`;
  const hCount = /* @__PURE__ */ new Map();
  for (const [i, f] of rawFields.entries()) {
    if (!f)
      throw new Error(`${schemaName} @ ${i} is an empty field name`);
    if (hCount.has(f)) {
      console.warn(`${schemaName} @ ${i} "${f} is a duplicate field name`);
      const n = hCount.get(f);
      rawFields[i] = `${f}.${n}`;
    } else {
      hCount.set(f, 1);
    }
  }
  let index = 0;
  let flagsUsed = 0;
  let rawColumns = [];
  for (const [rawIndex, name] of rawFields.entries()) {
    if (options?.ignoreFields?.has(name))
      continue;
    try {
      const c = fromText(name, rawIndex, index, flagsUsed, rawData, options?.overrides?.[name]);
      if (c !== null) {
        index++;
        if (c.type === 2 /* BOOL */)
          flagsUsed++;
        rawColumns.push([c, rawIndex]);
      }
    } catch (ex) {
      console.error(
        `GOOB INTERCEPTED IN ${schemaName}: \x1B[31m${index}:${name}\x1B[0m`,
        ex
      );
      throw ex;
    }
  }
  const data = new Array(rawData.length).fill(null).map((_, __rowId) => ({ __rowId }));
  const columns = [];
  const fields2 = [];
  rawColumns.sort((a, b) => cmpFields(a[0], b[0]));
  for (const [index2, [col, rawIndex]] of rawColumns.entries()) {
    Object.assign(col, { index: index2 });
    columns.push(col);
    fields2.push(col.name);
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(rawData[r.__rowId][rawIndex]);
  }
  return new Table(
    data,
    new Schema({
      name: schemaName,
      fields: fields2,
      columns,
      flagsUsed
    })
  );
}
async function parseAll(defs) {
  return Promise.all(
    Object.entries(defs).map(([path, options]) => readCSV(path, options))
  );
}

// src/dump-csvs.ts
import process from "node:process";
var width = process.stdout.columns;
var [file, ...fields] = process.argv.slice(2);
console.log("ARGS", { file, fields });
if (file) {
  const def = csvDefs[file];
  if (def)
    getDUMPY(await readCSV(file, def));
  else
    throw new Error(`no def for "${file}"`);
} else {
  const tables = await parseAll(csvDefs);
  for (const t of tables)
    await getDUMPY(t);
}
async function getDUMPY(t) {
  const n = Math.floor(Math.random() * (t.rows.length - 30));
  const m = n + 30;
  const f = ["id", "name", "size", "att", "def", "prot", "basecost", "slave"];
  const blob = Table.concatTables([t]);
  console.log("\n\n       BEFORE:");
  t.print(width, f, n, m);
  console.log("\n\n");
  const u = await Table.openBlob(blob);
  console.log("\n\n        AFTER:");
  u.Unit.print(width, f, n, m);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2Nzdi1kZWZzLnRzIiwgIi4uL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vc3JjL2NvbHVtbi50cyIsICIuLi9zcmMvdXRpbC50cyIsICIuLi9zcmMvc2NoZW1hLnRzIiwgIi4uL3NyYy9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9kdW1wLWNzdnMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgUGFyc2VTY2hlbWFPcHRpb25zIH0gZnJvbSAnLi9wYXJzZS1jc3YnXG5leHBvcnQgY29uc3QgY3N2RGVmczogUmVjb3JkPHN0cmluZywgUGFyc2VTY2hlbWFPcHRpb25zPiA9IHtcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VVLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICB9XG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlSS5jc3YnOiB7XG4gICAgbmFtZTogJ0l0ZW0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvTWVyY2VuYXJ5LmNzdic6IHtcbiAgICBuYW1lOiAnTWVyY2VuYXJ5JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hbm9uX3Byb3ZpbmNlX2V2ZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0Fub25Qcm92aW5jZUV2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXJtb3JzLmNzdic6IHtcbiAgICBuYW1lOiAnQXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZV9rZXlzLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlS2V5JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfc3BlbGwuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3dlYXBvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5V2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18xX3R5cGVzLmNzdic6IHtcbiAgICAvLyBUT0RPIC0gZ290IHNvbWUgYmlnIGJvaXMgaW4gaGVyZS5cbiAgICBuYW1lOiAnQnVmZkJpdDEnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18yX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnQnVmZkJpdDInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX2luZm8uY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbEVmZmVjdEluZm8nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VuY2hhbnRtZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0VuY2hhbnRtZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYWdpY19wYXRocy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljUGF0aCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hcF90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblR5cGVCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tb25zdGVyX3RhZ3MuY3N2Jzoge1xuICAgIG5hbWU6ICdNb25zdGVyVGFnJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmFtZXR5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTmFtZVR5cGUnLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmF0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ05hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9vdGhlcl9wbGFuZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdPdGhlclBsYW5lJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ1ByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJvdGVjdGlvbnNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdQcm90ZWN0aW9uQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcmVhbG1zLmNzdic6IHtcbiAgICBuYW1lOiAnUmVhbG0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zaXRlX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdTaXRlVGVycmFpblR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX2RhbWFnZV90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxEYW1hZ2VUeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF91bmlxdWVfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxVbmlxdWVTdW1tb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdGVycmFpbl9zcGVjaWZpY19zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblNwZWNpZmljU3VtbW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VucHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ1VucHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS93ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG59O1xuXG5cbiIsICJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICB3aGlsZSAobikge1xuICAgIGlmIChieXRlc1swXSA9PT0gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ2JydWggdGhhdHMgdG9vIGJpZycpO1xuICAgIGJ5dGVzWzBdKys7XG4gICAgYnl0ZXMucHVzaChOdW1iZXIobiAmIDI1NW4pKTtcbiAgICBuID4+PSA2NG47XG4gIH1cblxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0JpZ0JveSAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICBjb25zdCBMID0gTnVtYmVyKGJ5dGVzW2ldKTtcbiAgY29uc3QgbGVuID0gTCAmIDEyNztcbiAgY29uc3QgcmVhZCA9IDEgKyBsZW47XG4gIGNvbnN0IG5lZyA9IChMICYgMTI4KSA/IC0xbiA6IDFuO1xuICBjb25zdCBCQjogYmlnaW50W10gPSBBcnJheS5mcm9tKGJ5dGVzLnNsaWNlKGkgKyAxLCBpICsgcmVhZCksIEJpZ0ludCk7XG4gIGlmIChsZW4gIT09IEJCLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdiaWdpbnQgY2hlY2tzdW0gaXMgRlVDSz8nKTtcbiAgcmV0dXJuIFtsZW4gPyBCQi5yZWR1Y2UoYnl0ZVRvQmlnYm9pKSAqIG5lZyA6IDBuLCByZWFkXVxufVxuXG5mdW5jdGlvbiBieXRlVG9CaWdib2kgKG46IGJpZ2ludCwgYjogYmlnaW50LCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIG4gfCAoYiA8PCBCaWdJbnQoaSAqIDgpKTtcbn1cbiIsICJpbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBGaWVsZCA9IHtcbiAgdHlwZTogQ09MVU1OO1xuICBpbmRleDogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgYml0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEID0gMCxcbiAgU1RSSU5HID0gMSxcbiAgQk9PTCAgID0gMixcbiAgVTggICAgID0gMyxcbiAgSTggICAgID0gNCxcbiAgVTE2ICAgID0gNSxcbiAgSTE2ICAgID0gNixcbiAgVTMyICAgID0gNyxcbiAgSTMyICAgID0gOCxcbiAgQklHICAgID0gOSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG5dO1xuXG5leHBvcnQgdHlwZSBOVU1FUklDX0NPTFVNTiA9XG4gIHxDT0xVTU4uVThcbiAgfENPTFVNTi5JOFxuICB8Q09MVU1OLlUxNlxuICB8Q09MVU1OLkkxNlxuICB8Q09MVU1OLlUzMlxuICB8Q09MVU1OLkkzMlxuICA7XG5cbmNvbnN0IENPTFVNTl9XSURUSDogUmVjb3JkPE5VTUVSSUNfQ09MVU1OLCAxfDJ8ND4gPSB7XG4gIFtDT0xVTU4uVThdOiAxLFxuICBbQ09MVU1OLkk4XTogMSxcbiAgW0NPTFVNTi5VMTZdOiAyLFxuICBbQ09MVU1OLkkxNl06IDIsXG4gIFtDT0xVTU4uVTMyXTogNCxcbiAgW0NPTFVNTi5JMzJdOiA0LFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VUb051bWVyaWNUeXBlIChcbiAgbWluOiBudW1iZXIsXG4gIG1heDogbnVtYmVyXG4pOiBOVU1FUklDX0NPTFVNTnxudWxsIHtcbiAgaWYgKG1pbiA8IDApIHtcbiAgICAvLyBzb21lIGtpbmRhIG5lZ2F0aXZlPz9cbiAgICBpZiAobWluID49IC0xMjggJiYgbWF4IDw9IDEyNykge1xuICAgICAgLy8gc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uSTg7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTMyNzY4ICYmIG1heCA8PSAzMjc2Nykge1xuICAgICAgLy8gc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLkkxNjtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMjE0NzQ4MzY0OCAmJiBtYXggPD0gMjE0NzQ4MzY0Nykge1xuICAgICAgLy8gc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uSTMyO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAobWF4IDw9IDI1NSkge1xuICAgICAgLy8gdW5zaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5VODtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA2NTUzNSkge1xuICAgICAgLy8gdW5zaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uVTE2O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDQyOTQ5NjcyOTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uVTMyO1xuICAgIH1cbiAgfVxuICAvLyBHT1RPOiBCSUdPT09PT09PT0JPT09PT1lPXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIE5VTUVSSUNfQ09MVU1OIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCaWdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJJRyB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uU1RSSU5HO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDb2x1bW48VCA9IGFueSwgUiBleHRlbmRzIFVpbnQ4QXJyYXl8bnVtYmVyID0gYW55PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTjtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnkpID0+IFQ7XG4gIGZyb21UZXh0ICh2OiBzdHJpbmcpOiBUO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogYW55KTogUixcbiAgdG9TdHJpbmcgKHY6IHN0cmluZyk6IGFueTtcbiAgcmVhZG9ubHkgd2lkdGg6IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyOiBudW1iZXI7XG4gIHJlYWRvbmx5IG9mZnNldDogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPHN0cmluZywgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uU1RSSU5HID0gQ09MVU1OLlNUUklORztcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uU1RSSU5HXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDM7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8RmllbGQ+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJ2ZvbycpICE9PSAnc3RyaW5nJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWVtcyBvdmVycmlkZSBmb3IgJHtuYW1lfSBkb2VzIG5vdCByZXR1cm4gYSBzdHJpbmdgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCAodjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvL3JldHVybiB2ID8/ICdcIlwiJztcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2KTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLlNUUklORywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gc3RyaW5nVG9CeXRlcyh2KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxGaWVsZD4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc051bWVyaWNDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gaXMgbm90IGEgbnVtZXJpYyBjb2x1bW5gKTtcbiAgICBpZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IG92ZXJyaWRlIG11c3QgcmV0dXJuIGEgbnVtYmVyYCk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmxhYmVsID0gQ09MVU1OX0xBQkVMW3RoaXMudHlwZV07XG4gICAgdGhpcy53aWR0aCA9IENPTFVNTl9XSURUSFt0aGlzLnR5cGVdO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZyk6IG51bWJlciB7XG4gICAgIHJldHVybiB0aGlzLm92ZXJyaWRlID8gdGhpcy5vdmVycmlkZSh2KSA6XG4gICAgICB2ID8gTnVtYmVyKHYpIHx8IDAgOiAwO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgXzogVWludDhBcnJheSwgdmlldzogRGF0YVZpZXcpOiBbbnVtYmVyLCBudW1iZXJdIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDMyKGksIHRydWUpLCA0XTtcbiAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQzMihpLCB0cnVlKSwgNF07XG4gICAgfVxuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnR5cGUsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogbnVtYmVyKTogVWludDhBcnJheSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh0aGlzLndpZHRoKTtcbiAgICBmb3IgKGxldCBvID0gMDsgbyA8IHRoaXMud2lkdGg7IG8rKylcbiAgICAgIGJ5dGVzW29dID0gKHYgPj4+IChvICogOCkpICYgMjU1O1xuICAgIHJldHVybiBieXRlcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCaWdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJpZ2ludCwgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQklHID0gQ09MVU1OLkJJRztcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uQklHXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDI7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYmlnaW50O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8RmllbGQ+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2JpZ2ludCcpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NlZW1zIHRoYXQgb3ZlcnJpZGUgZG9lcyBub3QgcmV0dXJuIGEgYmlnaW50Jyk7XG4gICAgaWYgKCFpc0JpZ0NvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBiaWdgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2KTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgICByZXR1cm4gYnl0ZXNUb0JpZ0JveShpLCBieXRlcyk7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CSUcsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYmlnaW50KTogVWludDhBcnJheSB7XG4gICAgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgcmV0dXJuIGJpZ0JveVRvQnl0ZXModik7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PEZpZWxkPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2Jvb2xlYW4nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJpZ2ludCcpO1xuICAgIGlmICghaXNCb29sQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCAodjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2Jvb2xlYW4sIG51bWJlcl0ge1xuICAgIHJldHVybiBbYnl0ZXNbaV0gPT09IHRoaXMuZmxhZywgMF07XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CT09MLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIHJldHVybiB2ID8gdGhpcy5mbGFnIDogMDtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHsgb3JkZXI6IG51bWJlciwgYml0OiBudW1iZXIgfCBudWxsLCBpbmRleDogbnVtYmVyIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBGaWVsZHMgKGE6IEZDb21wYXJhYmxlLCBiOiBGQ29tcGFyYWJsZSk6IG51bWJlciB7XG4gIHJldHVybiAoYS5vcmRlciAtIGIub3JkZXIpIHx8XG4gICAgKChhLmJpdCA/PyAwKSAtIChiLmJpdCA/PyAwKSkgfHxcbiAgICAoYS5pbmRleCAtIGIuaW5kZXgpO1xufVxuXG5leHBvcnQgdHlwZSBDb2x1bW4gPVxuICB8U3RyaW5nQ29sdW1uXG4gIHxOdW1lcmljQ29sdW1uXG4gIHxCaWdDb2x1bW5cbiAgfEJvb2xDb2x1bW5cbiAgO1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21UZXh0IChcbiAgbmFtZTogc3RyaW5nLFxuICBpOiBudW1iZXIsXG4gIGluZGV4OiBudW1iZXIsXG4gIGZsYWdzVXNlZDogbnVtYmVyLFxuICBkYXRhOiBzdHJpbmdbXVtdLFxuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueSxcbik6IENvbHVtbnxudWxsIHtcbiAgY29uc3QgZmllbGQgPSB7XG4gICAgaW5kZXgsXG4gICAgbmFtZSxcbiAgICBvdmVycmlkZSxcbiAgICB0eXBlOiBDT0xVTU4uVU5VU0VELFxuICAgIG1heFZhbHVlOiAwLFxuICAgIG1pblZhbHVlOiAwLFxuICAgIHdpZHRoOiBudWxsIGFzIGFueSxcbiAgICBmbGFnOiBudWxsIGFzIGFueSxcbiAgICBiaXQ6IG51bGwgYXMgYW55LFxuICB9O1xuICBsZXQgaXNVc2VkID0gZmFsc2U7XG4gIC8vaWYgKGlzVXNlZCAhPT0gZmFsc2UpIGRlYnVnZ2VyO1xuICBmb3IgKGNvbnN0IHUgb2YgZGF0YSkge1xuICAgIGNvbnN0IHYgPSBmaWVsZC5vdmVycmlkZSA/IGZpZWxkLm92ZXJyaWRlKHVbaV0pIDogdVtpXTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpfToke25hbWV9IH4gJHt1WzBdfToke3VbMV19OiAke3Z9YClcbiAgICBpc1VzZWQgPSB0cnVlO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIodik7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkge1xuICAgICAgLy8gbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgZmllbGQudHlwZSA9IENPTFVNTi5TVFJJTkc7XG4gICAgICByZXR1cm4gbmV3IFN0cmluZ0NvbHVtbihmaWVsZCk7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSkge1xuICAgICAgY29uc29sZS53YXJuKGBcXHgxYlszMW0ke2l9OiR7bmFtZX0gaGFzIGEgZmxvYXQ/IFwiJHt2fVwiICgke259KVxceDFiWzBtYCk7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobikpIHtcbiAgICAgIC8vIHdlIHdpbGwgaGF2ZSB0byByZS1kbyB0aGlzIHBhcnQ6XG4gICAgICBmaWVsZC5taW5WYWx1ZSA9IC1JbmZpbml0eTtcbiAgICAgIGZpZWxkLm1heFZhbHVlID0gSW5maW5pdHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuIDwgZmllbGQubWluVmFsdWUpIGZpZWxkLm1pblZhbHVlID0gbjtcbiAgICAgIGlmIChuID4gZmllbGQubWF4VmFsdWUpIGZpZWxkLm1heFZhbHVlID0gbjtcbiAgICB9XG4gIH1cblxuICBpZiAoIWlzVXNlZCkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzFtJHtpfToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBmbGFnc1VzZWQ7XG4gICAgZmllbGQuZmxhZyA9IDEgPDwgZmllbGQuYml0ICUgODtcbiAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oZmllbGQpO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGZpZWxkKTtcbiAgICB9XG4gIH1cblxuICAvLyBCSUcgQk9ZIFRJTUVcbiAgZmllbGQudHlwZSA9IENPTFVNTi5CSUc7XG4gIHJldHVybiBuZXcgQmlnQ29sdW1uKGZpZWxkKTtcbn1cbiIsICIvLyBqdXN0IGEgYnVuY2ggb2Ygb3V0cHV0IGZvcm1hdHRpbmcgc2hpdFxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlRGVjbyhuYW1lOiBzdHJpbmcsIHdpZHRoID0gODAsIHN0eWxlID0gOSkge1xuICBjb25zdCB7IFRMLCBCTCwgVFIsIEJSLCBIUiB9ID0gZ2V0Qm94Q2hhcnMoc3R5bGUpXG4gIGNvbnN0IG5hbWVXaWR0aCA9IG5hbWUubGVuZ3RoICsgMjsgLy8gd2l0aCBzcGFjZXNcbiAgY29uc3QgaFRhaWxXaWR0aCA9IHdpZHRoIC0gKG5hbWVXaWR0aCArIDYpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb0JpZ0JveSwgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbnR5cGUgU2NoZW1hQXJncyA9IHtcbiAgbmFtZTogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgZmllbGRzLCBuYW1lLCBmbGFnc1VzZWQgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdO1xuICAgIHRoaXMuZmllbGRzID0gWy4uLmZpZWxkc107XG4gICAgdGhpcy5jb2x1bW5zQnlOYW1lID0gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuY29sdW1ucy5tYXAoYyA9PiBbYy5uYW1lLCBjXSkpO1xuICAgIHRoaXMuZmxhZ0ZpZWxkcyA9IGZsYWdzVXNlZDtcbiAgICB0aGlzLmZpeGVkV2lkdGggPSBjb2x1bW5zLnJlZHVjZShcbiAgICAgICh3LCBjKSA9PiB3ICsgKGMud2lkdGggPz8gMCksXG4gICAgICBNYXRoLmNlaWwoZmxhZ3NVc2VkIC8gOCksIC8vIDggZmxhZ3MgcGVyIGJ5dGUsIG5hdGNoXG4gICAgKTtcblxuICAgIGxldCBvOiBudW1iZXJ8bnVsbCA9IDA7XG4gICAgZm9yIChjb25zdCBjIG9mIGNvbHVtbnMpIHtcbiAgICAgIHN3aXRjaCAoYy50eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICBjLm9mZnNldCA9IG87XG4gICAgICAgICBpZiAoYy5mbGFnID09PSAxMjgpIG8rKztcbiAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgbyArPSBjLndpZHRoO1xuICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaW5nRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc1N0cmluZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG4gICAgdGhpcy5iaWdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzQmlnQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcblxuICB9XG5cbiAgc3RhdGljIGZyb21CdWZmZXIgKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBTY2hlbWEge1xuICAgIGxldCBpID0gMDtcbiAgICBsZXQgcmVhZDogbnVtYmVyO1xuICAgIGxldCBuYW1lOiBzdHJpbmc7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgIGkgKz0gcmVhZDtcblxuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICBuYW1lLFxuICAgICAgY29sdW1uczogW10gYXMgQ29sdW1uW10sXG4gICAgICBmaWVsZHM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgZmxhZ3NVc2VkOiAwLFxuICAgIH07XG5cbiAgICBjb25zdCBudW1GaWVsZHMgPSBieXRlc1tpKytdIHwgKGJ5dGVzW2krK10gPDwgOCk7XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIC8vIFRPRE8gLSBvbmx5IHdvcmtzIHdoZW4gMC1maWVsZCBzY2hlbWFzIGFyZW4ndCBhbGxvd2VkfiFcbiAgICB3aGlsZSAoaW5kZXggPCBudW1GaWVsZHMpIHtcbiAgICAgIGNvbnN0IHR5cGUgPSBieXRlc1tpKytdO1xuICAgICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgICBjb25zdCBmID0geyBpbmRleCwgbmFtZSwgdHlwZSwgd2lkdGg6IG51bGwsIGJpdDogbnVsbCwgZmxhZzogbnVsbCB9O1xuICAgICAgaSArPSByZWFkO1xuICAgICAgbGV0IGM6IENvbHVtbjtcblxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgaWYgKGMub2Zmc2V0ICE9PSBudWxsICYmIGMub2Zmc2V0ICE9PSB0b3RhbFJlYWQpIGRlYnVnZ2VyO1xuICAgICAgbGV0IFt2LCByZWFkXSA9IGMuZnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KTtcblxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpXG4gICAgICAgIHJlYWQgPSAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpID8gMSA6IDA7XG5cbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIHRvdGFsUmVhZCArPSByZWFkO1xuICAgICAgcm93W2MubmFtZV0gPSB2O1xuICAgIH1cbiAgICAvL2lmIChkYnIpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAgIFJFQUQ6ICR7dG90YWxSZWFkfSBUTyAke2l9IC8gJHtidWZmZXIuYnl0ZUxlbmd0aH1cXG5gLCByb3csICdcXG5cXG4nKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgLy99XG4gICAgcmV0dXJuIFtyb3csIHRvdGFsUmVhZF07XG4gIH1cblxuICBwcmludFJvdyAocjogUm93LCBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPikge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkpO1xuICB9XG5cbiAgc2VyaWFsaXplSGVhZGVyICgpOiBCbG9iIHtcbiAgICAvLyBbLi4ubmFtZSwgMCwgbnVtRmllbGRzMCwgbnVtRmllbGRzMSwgZmllbGQwVHlwZSwgZmllbGQwRmxhZz8sIC4uLmZpZWxkME5hbWUsIDAsIGV0Y107XG4gICAgLy8gVE9ETyAtIEJhc2UgdW5pdCBoYXMgNTAwKyBmaWVsZHNcbiAgICBpZiAodGhpcy5jb2x1bW5zLmxlbmd0aCA+IDY1NTM1KSB0aHJvdyBuZXcgRXJyb3IoJ29oIGJ1ZGR5Li4uJyk7XG4gICAgY29uc3QgcGFydHMgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSksXG4gICAgICB0aGlzLmNvbHVtbnMubGVuZ3RoICYgMjU1LFxuICAgICAgKHRoaXMuY29sdW1ucy5sZW5ndGggPj4+IDgpLFxuICAgICAgLi4udGhpcy5jb2x1bW5zLmZsYXRNYXAoYyA9PiBjLnNlcmlhbGl6ZSgpKVxuICAgIF0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFtwYXJ0c10pO1xuICB9XG5cbiAgc2VyaWFsaXplUm93IChyOiBSb3cpOiBCbG9iIHtcbiAgICBjb25zdCBmaXhlZCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZml4ZWRXaWR0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGNvbnN0IGJsb2JQYXJ0czogQmxvYlBhcnRbXSA9IFtmaXhlZF07XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgY29uc3QgdiA9IHJbYy5uYW1lXS8vIGMuc2VyaWFsaXplUm93KCBhcyBuZXZlcik7IC8vIGx1bFxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIHt9XG4gICAgICBzd2l0Y2goYy50eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzoge1xuICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIHN0cmluZylcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICB9IGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6IHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBiaWdpbnQpXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgfSBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGZpeGVkW2ldIHw9IGMuc2VyaWFsaXplUm93KHYgYXMgYm9vbGVhbik7XG4gICAgICAgICAgLy8gZG9udCBuZWVkIHRvIGNoZWNrIGZvciB0aGUgbGFzdCBmbGFnIHNpbmNlIHdlIG5vIGxvbmdlciBuZWVkIGlcbiAgICAgICAgICAvLyBhZnRlciB3ZSdyZSBkb25lIHdpdGggbnVtYmVycyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAvL2lmIChjLmZsYWcgPT09IDEyOCkgaSsrO1xuICAgICAgICAgIC8vIC4uLmJ1dCB3ZSB3aWxsIGJlY2F1eXNlIHdlIGJyb2tlIHNvbWV0aGlnblxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgaSsrO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIGNvbnN0IGJ5dGVzID0gYy5zZXJpYWxpemVSb3codiBhcyBudW1iZXIpXG4gICAgICAgICAgZml4ZWQuc2V0KGJ5dGVzLCBpKVxuICAgICAgICAgIGkgKz0gYy53aWR0aDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignd2F0IHR5cGUgaXMgdGhpcycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgKHIuX19yb3dJZCA8IDUgfHwgci5fX3Jvd0lkID4gMzk3NSB8fCByLl9fcm93SWQgJSAxMDAwID09PSAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgLSBST1cgJHtyLl9fcm93SWR9YCwgeyBpLCBibG9iUGFydHMsIHIgfSk7XG4gICAgLy99XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29mZnNldCcsXG4gICAgICAnb3JkZXInLFxuICAgICAgJ2JpdCcsXG4gICAgICAndHlwZScsXG4gICAgICAnZmxhZycsXG4gICAgICAnd2lkdGgnLFxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuXG4gIH1cblxuICAvLyByYXdUb1JvdyAoZDogUmF3Um93KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge31cbiAgLy8gcmF3VG9TdHJpbmcgKGQ6IFJhd1JvdywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge31cbn07XG5cbiIsICJpbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgdHlwZSB7IEZpZWxkLCBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnO1xuXG5cbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuaW1wb3J0IHsgQ09MVU1OLCBjbXBGaWVsZHMsIGZyb21UZXh0IH0gZnJvbSAnLi9jb2x1bW4nO1xuXG5cblxubGV0IF9uZXh0TmFtZUlkID0gMTtcbmNvbnN0IHRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogUGFyc2VTY2hlbWFPcHRpb25zXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lPzogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM/OiBTZXQ8c3RyaW5nPjtcbiAgb3ZlcnJpZGVzPzogUmVjb3JkPHN0cmluZywgKHY6IGFueSkgPT4gYW55Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUocmF3OiBzdHJpbmcsIG9wdGlvbnM6IFBhcnNlU2NoZW1hT3B0aW9ucyk6IFRhYmxlIHtcbiAgaWYgKHJhdy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHRocm93IG5ldyBFcnJvcigndWggb2gnKVxuXG4gIGNvbnN0IFtyYXdGaWVsZHMsIC4uLnJhd0RhdGFdID0gcmF3XG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcbiAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdCgnXFx0JykpO1xuICBjb25zdCBzY2hlbWFOYW1lID0gb3B0aW9ucy5uYW1lID8/IGBTY2hlbWFfJHtfbmV4dE5hbWVJZCsrfWA7XG5cbiAgY29uc3QgaENvdW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gIGZvciAoY29uc3QgW2ksIGZdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBpZiAoIWYpIHRocm93IG5ldyBFcnJvcihgJHtzY2hlbWFOYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hTmFtZX0gQCAke2l9IFwiJHtmfSBpcyBhIGR1cGxpY2F0ZSBmaWVsZCBuYW1lYCk7XG4gICAgICBjb25zdCBuID0gaENvdW50LmdldChmKSFcbiAgICAgIHJhd0ZpZWxkc1tpXSA9IGAke2Z9LiR7bn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBoQ291bnQuc2V0KGYsIDEpO1xuICAgIH1cbiAgfVxuXG5cbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGZsYWdzVXNlZCA9IDA7XG4gIGxldCByYXdDb2x1bW5zOiBbY29sOiBDb2x1bW4sIHJhd0luZGV4OiBudW1iZXJdW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IFtyYXdJbmRleCwgbmFtZV0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmIChvcHRpb25zPy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGMgPSBmcm9tVGV4dChuYW1lLCByYXdJbmRleCwgaW5kZXgsIGZsYWdzVXNlZCwgcmF3RGF0YSwgb3B0aW9ucz8ub3ZlcnJpZGVzPy5bbmFtZV0pO1xuICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIGZsYWdzVXNlZCsrO1xuICAgICAgICByYXdDb2x1bW5zLnB1c2goW2MsIHJhd0luZGV4XSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hTmFtZX06IFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX1cXHgxYlswbWAsXG4gICAgICAgICAgZXhcbiAgICAgICk7XG4gICAgICB0aHJvdyBleFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRhdGE6IFJvd1tdID0gbmV3IEFycmF5KHJhd0RhdGEubGVuZ3RoKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoXywgX19yb3dJZCkgPT4gKHsgX19yb3dJZCB9KSlcbiAgICA7XG5cbiAgLy9jb25zb2xlLmxvZyhkYXRhKTtcblxuICBjb25zdCBjb2x1bW5zOiBDb2x1bW5bXSA9IFtdO1xuICBjb25zdCBmaWVsZHM6IHN0cmluZ1tdID0gW107XG4gIHJhd0NvbHVtbnMuc29ydCgoYSwgYikgPT4gY21wRmllbGRzKGFbMF0sIGJbMF0pKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIFtjb2wsIHJhd0luZGV4XV0gb2YgcmF3Q29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICBPYmplY3QuYXNzaWduKGNvbCwgeyBpbmRleCB9KTtcbiAgICBjb2x1bW5zLnB1c2goY29sKTtcbiAgICBmaWVsZHMucHVzaChjb2wubmFtZSk7XG4gICAgZm9yIChjb25zdCByIG9mIGRhdGEpXG4gICAgICBkYXRhW3IuX19yb3dJZF1bY29sLm5hbWVdID0gY29sLmZyb21UZXh0KHJhd0RhdGFbci5fX3Jvd0lkXVtyYXdJbmRleF0pXG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKFxuICAgIGRhdGEsXG4gICAgbmV3IFNjaGVtYSh7XG4gICAgICBuYW1lOiBzY2hlbWFOYW1lLFxuICAgICAgZmllbGRzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIGZsYWdzVXNlZFxuICAgIH0pXG4gIClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnNlU2NoZW1hT3B0aW9ucz4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5leHBvcnQgdHlwZSBSb3dEYXRhID0gc3RyaW5nW107XG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBib29sZWFufG51bWJlcnxzdHJpbmd8YmlnaW50PiAmIHsgX19yb3dJZDogbnVtYmVyIH07XG5cbmV4cG9ydCBjbGFzcyBUYWJsZSB7XG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gYFtUQUJMRToke3RoaXMuc2NoZW1hLm5hbWV9XWA7IH1cbiAgY29uc3RydWN0b3IgKFxuICAgIHJlYWRvbmx5IHJvd3M6IFJvd1tdLFxuICAgIHJlYWRvbmx5IHNjaGVtYTogU2NoZW1hLFxuICApIHtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogW1VpbnQzMkFycmF5LCBCbG9iLCBCbG9iXSB7XG4gICAgLy8gW251bVJvd3MsIGhlYWRlclNpemUsIGRhdGFTaXplXSwgc2NoZW1hSGVhZGVyLCBbcm93MCwgcm93MSwgLi4uIHJvd05dO1xuICAgIGNvbnN0IHNjaGVtYUhlYWRlciA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZUhlYWRlcigpO1xuICAgIC8vIGNhbnQgZmlndXJlIG91dCBob3cgdG8gZG8gdGhpcyB3aXRoIGJpdHMgOic8XG4gICAgY29uc3Qgc2NoZW1hUGFkZGluZyA9ICg0IC0gc2NoZW1hSGVhZGVyLnNpemUgJSA0KSAlIDQ7XG4gICAgY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpKTtcbiAgICAvL2NvbnN0IHJvd0RhdGEgPSB0aGlzLnJvd3MuZmxhdE1hcChyID0+IHtcbiAgICAgIC8vY29uc3Qgcm93QmxvYiA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZVJvdyhyKVxuICAgICAgLy9pZiAoci5fX3Jvd0lkID09PSAwKVxuICAgICAgICAvL3Jvd0Jsb2IuYXJyYXlCdWZmZXIoKS50aGVuKGFiID0+IHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKGBBUlJBWSBCVUZGRVIgRk9SIEZJUlNUIFJPVyBPRiAke3RoaXMubmFtZX1gLCBuZXcgVWludDhBcnJheShhYikuam9pbignLCAnKSk7XG4gICAgICAgIC8vfSk7XG4gICAgICAvL3JldHVybiByb3dCbG9iO1xuICAgIC8vfSk7XG4gICAgY29uc3Qgcm93QmxvYiA9IG5ldyBCbG9iKHJvd0RhdGEpXG4gICAgY29uc3QgZGF0YVBhZGRpbmcgPSAoNCAtIHJvd0Jsb2Iuc2l6ZSAlIDQpICUgNDtcblxuICAgIHJldHVybiBbXG4gICAgICBuZXcgVWludDMyQXJyYXkoW1xuICAgICAgICB0aGlzLnJvd3MubGVuZ3RoLFxuICAgICAgICBzY2hlbWFIZWFkZXIuc2l6ZSArIHNjaGVtYVBhZGRpbmcsXG4gICAgICAgIHJvd0Jsb2Iuc2l6ZSArIGRhdGFQYWRkaW5nXG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgc2NoZW1hSGVhZGVyLFxuICAgICAgICBuZXcgQXJyYXlCdWZmZXIoc2NoZW1hUGFkZGluZylcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGZyb21CbG9iICh7XG4gICAgaGVhZGVyQmxvYixcbiAgICBkYXRhQmxvYixcbiAgICBudW1Sb3dzLFxuICB9OiBUYWJsZUJsb2IpOiBQcm9taXNlPFRhYmxlPiB7XG4gICAgY29uc3Qgc2NoZW1hID0gU2NoZW1hLmZyb21CdWZmZXIoYXdhaXQgaGVhZGVyQmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICBsZXQgcmJvID0gMDtcbiAgICBsZXQgX19yb3dJZCA9IDA7XG4gICAgY29uc3Qgcm93czogUm93W10gPSBbXTtcbiAgICAvLyBUT0RPIC0gY291bGQgZGVmaW5pdGVseSB1c2UgYSBzdHJlYW0gZm9yIHRoaXNcbiAgICBjb25zdCBkYXRhQnVmZmVyID0gYXdhaXQgZGF0YUJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT0gUkVBRCAke251bVJvd3N9IE9GICR7c2NoZW1hLm5hbWV9ID09PT09YClcbiAgICB3aGlsZSAoX19yb3dJZCA8IG51bVJvd3MpIHtcbiAgICAgIGNvbnN0IFtyb3csIHJlYWRdID0gc2NoZW1hLnJvd0Zyb21CdWZmZXIocmJvLCBkYXRhQnVmZmVyLCBfX3Jvd0lkKyspO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICByYm8gKz0gcmVhZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG4gIH1cblxuXG4gIHByaW50IChcbiAgICB3aWR0aDogbnVtYmVyID0gODAsXG4gICAgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT58bnVsbCA9IG51bGwsXG4gICAgbjogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIG06IG51bWJlcnxudWxsID0gbnVsbFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG4gICAgY29uc3QgW3BSb3dzLCBwRmllbGRzXSA9IGZpZWxkcyA/XG4gICAgICBbcm93cy5tYXAoKHI6IFJvdykgPT4gdGhpcy5zY2hlbWEucHJpbnRSb3cociwgZmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc29sZS50YWJsZShwUm93cywgcEZpZWxkcyk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG4gIH1cbiAgLypcbiAgcmF3VG9Sb3cgKGQ6IHN0cmluZ1tdKTogUm93IHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc2NoZW1hLmNvbHVtbnMubWFwKHIgPT4gW1xuICAgICAgci5uYW1lLFxuICAgICAgci50b1ZhbChkW3IuaW5kZXhdKVxuICAgIF0pKTtcbiAgfVxuICByYXdUb1N0cmluZyAoZDogc3RyaW5nW10sIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAvLyBqdXN0IGFzc3VtZSBmaXJzdCB0d28gZmllbGRzIGFyZSBhbHdheXMgaWQsIG5hbWUuIGV2ZW4gaWYgdGhhdCdzIG5vdCB0cnVlXG4gICAgLy8gdGhpcyBpcyBqdXN0IGZvciB2aXN1YWxpemF0aW9uIHB1cnBvcnNlc1xuICAgIGxldCBleHRyYSA9ICcnO1xuICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLnJhd1RvUm93KGQpO1xuICAgICAgZm9yIChjb25zdCBhIG9mIGFyZ3MpIHtcbiAgICAgICAgLy8gZG9uJ3QgcmVwcmludCBuYW1lIG9yIGlkXG4gICAgICAgIGlmIChhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMF0gfHwgYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzFdKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZVthXSAhPSBudWxsKVxuICAgICAgICAgIHMucHVzaChgJHthfTogJHtKU09OLnN0cmluZ2lmeShlW2FdKX1gKVxuICAgICAgfVxuICAgICAgZXh0cmEgPSBzLmxlbmd0aCA+IDAgPyBgIHsgJHtzLmpvaW4oJywgJyl9IH1gIDogJ3t9JztcbiAgICB9XG4gICAgcmV0dXJuIGA8JHt0aGlzLnNjaGVtYS5uYW1lfToke2RbMF0gPz8gJz8nfSBcIiR7ZFsxXX1cIiR7ZXh0cmF9PmA7XG4gIH1cbiAgKi9cbn1cbnR5cGUgVGFibGVCbG9iID0geyBudW1Sb3dzOiBudW1iZXIsIGhlYWRlckJsb2I6IEJsb2IsIGRhdGFCbG9iOiBCbG9iIH07XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuY29uc29sZS5sb2coJ0FSR1MnLCB7IGZpbGUsIGZpZWxkcyB9KVxuXG5pZiAoZmlsZSkge1xuICBjb25zdCBkZWYgPSBjc3ZEZWZzW2ZpbGVdO1xuICAvL2lmIChkZWYpIChhd2FpdCByZWFkQ1NWKGZpbGUsIGRlZikpLnByaW50KHdpZHRoLCBmaWVsZHMpXG4gIGlmIChkZWYpIGdldERVTVBZKGF3YWl0IHJlYWRDU1YoZmlsZSwgZGVmKSk7XG4gIGVsc2UgdGhyb3cgbmV3IEVycm9yKGBubyBkZWYgZm9yIFwiJHtmaWxlfVwiYCk7XG59IGVsc2Uge1xuICBjb25zdCB0YWJsZXMgPSBhd2FpdCBwYXJzZUFsbChjc3ZEZWZzKTtcbiAgZm9yIChjb25zdCB0IG9mIHRhYmxlcykgYXdhaXQgZ2V0RFVNUFkodCk7XG59XG5cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RFVNUFkodDogVGFibGUpIHtcbiAgY29uc3QgbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0LnJvd3MubGVuZ3RoIC0gMzApKTtcbiAgY29uc3QgbSA9IG4gKyAzMDtcbiAgY29uc3QgZiA9IFsnaWQnLCAnbmFtZScsICdzaXplJywgJ2F0dCcsICdkZWYnLCAncHJvdCcsICdiYXNlY29zdCcsICdzbGF2ZSddO1xuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKFt0XSk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4gICAgICAgQkVGT1JFOicpO1xuICB0LnByaW50KHdpZHRoLCBmLCBuLCBtKTtcbiAgLy90LnByaW50KHdpZHRoLCBudWxsLCAxMCk7XG4gIC8vdC5zY2hlbWEucHJpbnQoKTtcbiAgY29uc29sZS5sb2coJ1xcblxcbicpXG4gIGNvbnN0IHUgPSBhd2FpdCBUYWJsZS5vcGVuQmxvYihibG9iKTtcbiAgY29uc29sZS5sb2coJ1xcblxcbiAgICAgICAgQUZURVI6Jyk7XG4gIC8vdS5Vbml0LnByaW50KHdpZHRoLCBudWxsLCAxMCk7XG4gIHUuVW5pdC5wcmludCh3aWR0aCwgZiwgbiwgbSk7XG4gIC8vdS5Vbml0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIC8vYXdhaXQgd3JpdGVGaWxlKCcuL3RtcC5iaW4nLCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xuICAvL2NvbnNvbGUubG9nKCd3cml0ZWQnKVxuXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ08sSUFBTSxVQUE4QztBQUFBLEVBQ3pELDRCQUE0QjtBQUFB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QztBQUM1QixZQUFRLEtBQUssR0FBRztBQUNoQixJQUFBRCxRQUFPLEtBQUssSUFBSSxJQUFJO0FBQ3BCLGVBQVcsS0FBSztBQUNkLFdBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxTQUFTLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDO0FBQUEsRUFDekU7QUFFQSxTQUFPLElBQUk7QUFBQSxJQUNUO0FBQUEsSUFDQSxJQUFJLE9BQU87QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLFFBQUFBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFFQSxlQUFzQixTQUFTLE1BQTBDO0FBQ3ZFLFNBQU8sUUFBUTtBQUFBLElBQ2IsT0FBTyxRQUFRLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLE9BQU8sTUFBTSxRQUFRLE1BQU0sT0FBTyxDQUFDO0FBQUEsRUFDdEU7QUFDRjs7O0FFakhBLE9BQU8sYUFBYTtBQUlwQixJQUFNLFFBQVEsUUFBUSxPQUFPO0FBQzdCLElBQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLFFBQVEsS0FBSyxNQUFNLENBQUM7QUFFOUMsUUFBUSxJQUFJLFFBQVEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUVwQyxJQUFJLE1BQU07QUFDUixRQUFNLE1BQU0sUUFBUSxJQUFJO0FBRXhCLE1BQUk7QUFBSyxhQUFTLE1BQU0sUUFBUSxNQUFNLEdBQUcsQ0FBQztBQUFBO0FBQ3JDLFVBQU0sSUFBSSxNQUFNLGVBQWUsSUFBSSxHQUFHO0FBQzdDLE9BQU87QUFDTCxRQUFNLFNBQVMsTUFBTSxTQUFTLE9BQU87QUFDckMsYUFBVyxLQUFLO0FBQVEsVUFBTSxTQUFTLENBQUM7QUFDMUM7QUFHQSxlQUFlLFNBQVMsR0FBVTtBQUNoQyxRQUFNLElBQUksS0FBSyxNQUFNLEtBQUssT0FBTyxLQUFLLEVBQUUsS0FBSyxTQUFTLEdBQUc7QUFDekQsUUFBTSxJQUFJLElBQUk7QUFDZCxRQUFNLElBQUksQ0FBQyxNQUFNLFFBQVEsUUFBUSxPQUFPLE9BQU8sUUFBUSxZQUFZLE9BQU87QUFDMUUsUUFBTSxPQUFPLE1BQU0sYUFBYSxDQUFDLENBQUMsQ0FBQztBQUNuQyxVQUFRLElBQUksb0JBQW9CO0FBQ2hDLElBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0FBR3RCLFVBQVEsSUFBSSxNQUFNO0FBQ2xCLFFBQU0sSUFBSSxNQUFNLE1BQU0sU0FBUyxJQUFJO0FBQ25DLFVBQVEsSUFBSSxvQkFBb0I7QUFFaEMsSUFBRSxLQUFLLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUs3QjsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImZpZWxkcyIsICJpbmRleCJdCn0K
