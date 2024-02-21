// src/cli/csv-defs.ts
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

// src/cli/parse-csv.ts
import { readFile } from "node:fs/promises";

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
function argsFromText(name, i, index, flagsUsed, data, override) {
  const field = {
    index,
    name,
    override,
    type: 0 /* UNUSED */,
    maxValue: 0,
    minValue: 0,
    width: null,
    flag: null,
    bit: null,
    order: 999
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
      field.order = 3;
      return field;
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
    field.order = 1;
    field.bit = flagsUsed;
    field.flag = 1 << field.bit % 8;
    return field;
  }
  if (field.maxValue < Infinity) {
    const type = rangeToNumericType(field.minValue, field.maxValue);
    if (type !== null) {
      field.order = 0;
      field.type = type;
      return field;
    }
  }
  field.type = 9 /* BIG */;
  field.order = 2;
  return field;
}
function fromArgs(args) {
  switch (args.type) {
    case 0 /* UNUSED */:
      throw new Error("unused field cant be turned into a Column");
    case 1 /* STRING */:
      return new StringColumn(args);
    case 2 /* BOOL */:
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
      const f = { index, name, type, width: null, bit: null, flag: null, order: 999 };
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

// src/cli/parse-csv.ts
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
  separator: "	"
  // surprise!
};
function csvToTable(raw, options) {
  const _opts = { ...DEFAULT_OPTIONS, ...options };
  const schemaArgs = {
    name: _opts.name ?? `Schema_${_nextAnonSchemaId++}`,
    flagsUsed: 0,
    columns: [],
    fields: []
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
  let index = 0;
  let rawColumns = [];
  for (const [rawIndex, name] of rawFields.entries()) {
    if (_opts.ignoreFields?.has(name))
      continue;
    try {
      const c = argsFromText(
        name,
        rawIndex,
        index,
        schemaArgs.flagsUsed,
        rawData,
        _opts.overrides[name]
      );
      if (c !== null) {
        index++;
        if (c.type === 2 /* BOOL */)
          schemaArgs.flagsUsed++;
        rawColumns.push([c, rawIndex]);
      }
    } catch (ex) {
      console.error(
        `GOOB INTERCEPTED IN ${schemaArgs.name}: \x1B[31m${index}:${name}\x1B[0m`,
        ex
      );
      throw ex;
    }
  }
  rawColumns.sort((a, b) => cmpFields(a[0], b[0]));
  const data = new Array(rawData.length).fill(null).map((_, __rowId) => ({ __rowId }));
  for (const [index2, [colArgs, rawIndex]] of rawColumns.entries()) {
    colArgs.index = index2;
    const col = fromArgs(colArgs);
    schemaArgs.columns.push(col);
    schemaArgs.fields.push(col.name);
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(rawData[r.__rowId][rawIndex]);
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
  const n = Math.floor(Math.random() * (t.rows.length - 30));
  const m = n + 30;
  const f = t.schema.fields.slice(0, 8);
  const blob = Table.concatTables([t]);
  console.log("\n\n       BEFORE:");
  t.print(width, f, n, m);
  console.log("\n\n");
  const u = await Table.openBlob(blob);
  console.log("\n\n        AFTER:");
  Object.values(u)[0]?.print(width, f, n, m);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi8uLi9saWIvc3JjL3NlcmlhbGl6ZS50cyIsICIuLi8uLi9saWIvc3JjL2NvbHVtbi50cyIsICIuLi8uLi9saWIvc3JjL3V0aWwudHMiLCAiLi4vLi4vbGliL3NyYy9zY2hlbWEudHMiLCAiLi4vLi4vbGliL3NyYy90YWJsZS50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmV4cG9ydCBjb25zdCBjc3ZEZWZzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4+ID0ge1xuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZVUuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgb3ZlcnJpZGVzOiB7XG4gICAgICAvLyBjc3YgaGFzIHVucmVzdC90dXJuIHdoaWNoIGlzIGluY3VucmVzdCAvIDEwOyBjb252ZXJ0IHRvIGludCBmb3JtYXRcbiAgICAgIGluY3VucmVzdDogKHYpID0+IChOdW1iZXIodikgKiAxMCkgfHwgMFxuICAgIH1cbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VJLmNzdic6IHtcbiAgICBuYW1lOiAnSXRlbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuXG4gICcuLi8uLi9nYW1lZGF0YS9NYWdpY1NpdGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNTaXRlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FmZmxpY3Rpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnQWZmbGljdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hcm1vcnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X2FybW9yLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9zcGVsbC5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfd2VhcG9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzFfdHlwZXMuY3N2Jzoge1xuICAgIC8vIFRPRE8gLSBnb3Qgc29tZSBiaWcgYm9pcyBpbiBoZXJlLlxuICAgIG5hbWU6ICdCdWZmQml0MScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzJfdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdCdWZmQml0MicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0X21vZGlmaWVyX2JpdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbEJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfaW5mby5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsRWZmZWN0SW5mbycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFdlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZW5jaGFudG1lbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnRW5jaGFudG1lbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hZ2ljX3BhdGhzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdUZXJyYWluVHlwZUJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21vbnN0ZXJfdGFncy5jc3YnOiB7XG4gICAgbmFtZTogJ01vbnN0ZXJUYWcnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYW1ldHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdOYW1lVHlwZScsXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYXRpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnTmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL290aGVyX3BsYW5lcy5jc3YnOiB7XG4gICAgbmFtZTogJ090aGVyUGxhbmUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnUHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcm90ZWN0aW9uc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ1Byb3RlY3Rpb25CeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9yZWFsbXMuY3N2Jzoge1xuICAgIG5hbWU6ICdSZWFsbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NpdGVfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1NpdGVUZXJyYWluVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfZGFtYWdlX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbERhbWFnZVR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX3VuaXF1ZV9zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbFVuaXF1ZVN1bW1vbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS90ZXJyYWluX3NwZWNpZmljX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdUZXJyYWluU3BlY2lmaWNTdW1tb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bml0X2VmZmVjdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0RWZmZWN0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzLCBSb3cgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7XG4gIFNjaGVtYSxcbiAgVGFibGUsXG4gIENPTFVNTixcbiAgY21wRmllbGRzLFxuICBhcmdzRnJvbVRleHQsXG4gIENvbHVtbkFyZ3MsXG4gIGZyb21BcmdzXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5sZXQgX25leHRBbm9uU2NoZW1hSWQgPSAxO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRDU1YgKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4sXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lPzogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBvdmVycmlkZXM6IFJlY29yZDxzdHJpbmcsICh2OiBhbnkpID0+IGFueT47XG4gIHNlcGFyYXRvcjogc3RyaW5nO1xufVxuXG5jb25zdCBERUZBVUxUX09QVElPTlM6IFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgaWdub3JlRmllbGRzOiBuZXcgU2V0KCksXG4gIG92ZXJyaWRlczoge30sXG4gIHNlcGFyYXRvcjogJ1xcdCcsIC8vIHN1cnByaXNlIVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3N2VG9UYWJsZShcbiAgcmF3OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz5cbik6IFRhYmxlIHtcbiAgY29uc3QgX29wdHMgPSB7IC4uLkRFRkFVTFRfT1BUSU9OUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBzY2hlbWFBcmdzOiBTY2hlbWFBcmdzID0ge1xuICAgIG5hbWU6IF9vcHRzLm5hbWUgPz8gYFNjaGVtYV8ke19uZXh0QW5vblNjaGVtYUlkKyt9YCxcbiAgICBmbGFnc1VzZWQ6IDAsXG4gICAgY29sdW1uczogW10sXG4gICAgZmllbGRzOiBbXSxcbiAgfTtcblxuICBpZiAocmF3LmluZGV4T2YoJ1xcMCcpICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCd1aCBvaCcpXG5cbiAgY29uc3QgW3Jhd0ZpZWxkcywgLi4ucmF3RGF0YV0gPSByYXdcbiAgICAuc3BsaXQoJ1xcbicpXG4gICAgLmZpbHRlcihsaW5lID0+IGxpbmUgIT09ICcnKVxuICAgIC5tYXAobGluZSA9PiBsaW5lLnNwbGl0KF9vcHRzLnNlcGFyYXRvcikpO1xuXG4gIGNvbnN0IGhDb3VudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+O1xuICBmb3IgKGNvbnN0IFtpLCBmXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKCFmKSB0aHJvdyBuZXcgRXJyb3IoYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hQXJncy5uYW1lfSBAICR7aX0gXCIke2Z9XCIgaXMgYSBkdXBsaWNhdGUgZmllbGQgbmFtZWApO1xuICAgICAgY29uc3QgbiA9IGhDb3VudC5nZXQoZikhXG4gICAgICByYXdGaWVsZHNbaV0gPSBgJHtmfS4ke259YDtcbiAgICB9IGVsc2Uge1xuICAgICAgaENvdW50LnNldChmLCAxKTtcbiAgICB9XG4gIH1cblxuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgcmF3Q29sdW1uczogW2NvbDogQ29sdW1uQXJncywgcmF3SW5kZXg6IG51bWJlcl1bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgW3Jhd0luZGV4LCBuYW1lXSBvZiByYXdGaWVsZHMuZW50cmllcygpKSB7XG4gICAgaWYgKF9vcHRzLmlnbm9yZUZpZWxkcz8uaGFzKG5hbWUpKSBjb250aW51ZTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYyA9IGFyZ3NGcm9tVGV4dChcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcmF3SW5kZXgsXG4gICAgICAgIGluZGV4LFxuICAgICAgICBzY2hlbWFBcmdzLmZsYWdzVXNlZCxcbiAgICAgICAgcmF3RGF0YSxcbiAgICAgICAgX29wdHMub3ZlcnJpZGVzW25hbWVdXG4gICAgICApO1xuICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIHNjaGVtYUFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgIHJhd0NvbHVtbnMucHVzaChbYywgcmF3SW5kZXhdKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgYEdPT0IgSU5URVJDRVBURUQgSU4gJHtzY2hlbWFBcmdzLm5hbWV9OiBcXHgxYlszMW0ke2luZGV4fToke25hbWV9XFx4MWJbMG1gLFxuICAgICAgICAgIGV4XG4gICAgICApO1xuICAgICAgdGhyb3cgZXhcbiAgICB9XG4gIH1cblxuICByYXdDb2x1bW5zLnNvcnQoKGEsIGIpID0+IGNtcEZpZWxkcyhhWzBdLCBiWzBdKSk7XG4gIGNvbnN0IGRhdGE6IFJvd1tdID0gbmV3IEFycmF5KHJhd0RhdGEubGVuZ3RoKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoXywgX19yb3dJZCkgPT4gKHsgX19yb3dJZCB9KSlcbiAgICA7XG5cbiAgZm9yIChjb25zdCBbaW5kZXgsIFtjb2xBcmdzLCByYXdJbmRleF1dIG9mIHJhd0NvbHVtbnMuZW50cmllcygpKSB7XG4gICAgY29sQXJncy5pbmRleCA9IGluZGV4O1xuICAgIGNvbnN0IGNvbCA9IGZyb21BcmdzKGNvbEFyZ3MpO1xuICAgIHNjaGVtYUFyZ3MuY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgc2NoZW1hQXJncy5maWVsZHMucHVzaChjb2wubmFtZSk7XG4gICAgZm9yIChjb25zdCByIG9mIGRhdGEpXG4gICAgICBkYXRhW3IuX19yb3dJZF1bY29sLm5hbWVdID0gY29sLmZyb21UZXh0KHJhd0RhdGFbci5fX3Jvd0lkXVtyYXdJbmRleF0pXG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKGRhdGEsIG5ldyBTY2hlbWEoc2NoZW1hQXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VBbGwoZGVmczogUmVjb3JkPHN0cmluZywgUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+Pikge1xuICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVmcykubWFwKChbcGF0aCwgb3B0aW9uc10pID0+IHJlYWRDU1YocGF0aCwgb3B0aW9ucykpXG4gICk7XG59XG4iLCAiY29uc3QgX190ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuY29uc3QgX190ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nKTogVWludDhBcnJheTtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q6IFVpbnQ4QXJyYXksIGk6IG51bWJlcik6IG51bWJlcjtcbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcsIGRlc3Q/OiBVaW50OEFycmF5LCBpID0gMCkge1xuICBpZiAocy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHtcbiAgICBjb25zdCBpID0gcy5pbmRleE9mKCdcXDAnKTtcbiAgICBjb25zb2xlLmVycm9yKGAke2l9ID0gTlVMTCA/IFwiLi4uJHtzLnNsaWNlKGkgLSAxMCwgaSArIDEwKX0uLi5gKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3dob29wc2llJyk7XG4gIH1cbiAgY29uc3QgYnl0ZXMgPSBfX3RleHRFbmNvZGVyLmVuY29kZShzICsgJ1xcMCcpO1xuICBpZiAoZGVzdCkge1xuICAgIGRlc3Quc2V0KGJ5dGVzLCBpKTtcbiAgICByZXR1cm4gYnl0ZXMubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBieXRlcztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb1N0cmluZyhpOiBudW1iZXIsIGE6IFVpbnQ4QXJyYXkpOiBbc3RyaW5nLCBudW1iZXJdIHtcbiAgbGV0IHIgPSAwO1xuICB3aGlsZSAoYVtpICsgcl0gIT09IDApIHsgcisrOyB9XG4gIHJldHVybiBbX190ZXh0RGVjb2Rlci5kZWNvZGUoYS5zbGljZShpLCBpK3IpKSwgciArIDFdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmlnQm95VG9CeXRlcyAobjogYmlnaW50KTogVWludDhBcnJheSB7XG4gIC8vIHRoaXMgaXMgYSBjb29sIGdhbWUgYnV0IGxldHMgaG9wZSBpdCBkb2Vzbid0IHVzZSAxMjcrIGJ5dGUgbnVtYmVyc1xuICBjb25zdCBieXRlcyA9IFswXTtcbiAgaWYgKG4gPCAwbikge1xuICAgIG4gKj0gLTFuO1xuICAgIGJ5dGVzWzBdID0gMTI4O1xuICB9XG5cbiAgd2hpbGUgKG4pIHtcbiAgICBpZiAoYnl0ZXNbMF0gPT09IDI1NSkgdGhyb3cgbmV3IEVycm9yKCdicnVoIHRoYXRzIHRvbyBiaWcnKTtcbiAgICBieXRlc1swXSsrO1xuICAgIGJ5dGVzLnB1c2goTnVtYmVyKG4gJiAyNTVuKSk7XG4gICAgbiA+Pj0gNjRuO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9CaWdCb3kgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgY29uc3QgTCA9IE51bWJlcihieXRlc1tpXSk7XG4gIGNvbnN0IGxlbiA9IEwgJiAxMjc7XG4gIGNvbnN0IHJlYWQgPSAxICsgbGVuO1xuICBjb25zdCBuZWcgPSAoTCAmIDEyOCkgPyAtMW4gOiAxbjtcbiAgY29uc3QgQkI6IGJpZ2ludFtdID0gQXJyYXkuZnJvbShieXRlcy5zbGljZShpICsgMSwgaSArIHJlYWQpLCBCaWdJbnQpO1xuICBpZiAobGVuICE9PSBCQi5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignYmlnaW50IGNoZWNrc3VtIGlzIEZVQ0s/Jyk7XG4gIHJldHVybiBbbGVuID8gQkIucmVkdWNlKGJ5dGVUb0JpZ2JvaSkgKiBuZWcgOiAwbiwgcmVhZF1cbn1cblxuZnVuY3Rpb24gYnl0ZVRvQmlnYm9pIChuOiBiaWdpbnQsIGI6IGJpZ2ludCwgaTogbnVtYmVyKSB7XG4gIHJldHVybiBuIHwgKGIgPDwgQmlnSW50KGkgKiA4KSk7XG59XG4iLCAiaW1wb3J0IHsgYmlnQm95VG9CeXRlcywgYnl0ZXNUb0JpZ0JveSwgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcblxuZXhwb3J0IHR5cGUgQ29sdW1uQXJncyA9IHtcbiAgdHlwZTogQ09MVU1OO1xuICBpbmRleDogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgYml0OiBudW1iZXJ8bnVsbDtcbiAgb3JkZXI6IG51bWJlcjtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEID0gMCxcbiAgU1RSSU5HID0gMSxcbiAgQk9PTCAgID0gMixcbiAgVTggICAgID0gMyxcbiAgSTggICAgID0gNCxcbiAgVTE2ICAgID0gNSxcbiAgSTE2ICAgID0gNixcbiAgVTMyICAgID0gNyxcbiAgSTMyICAgID0gOCxcbiAgQklHICAgID0gOSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG5dO1xuXG5leHBvcnQgdHlwZSBOVU1FUklDX0NPTFVNTiA9XG4gIHxDT0xVTU4uVThcbiAgfENPTFVNTi5JOFxuICB8Q09MVU1OLlUxNlxuICB8Q09MVU1OLkkxNlxuICB8Q09MVU1OLlUzMlxuICB8Q09MVU1OLkkzMlxuICA7XG5cbmNvbnN0IENPTFVNTl9XSURUSDogUmVjb3JkPE5VTUVSSUNfQ09MVU1OLCAxfDJ8ND4gPSB7XG4gIFtDT0xVTU4uVThdOiAxLFxuICBbQ09MVU1OLkk4XTogMSxcbiAgW0NPTFVNTi5VMTZdOiAyLFxuICBbQ09MVU1OLkkxNl06IDIsXG4gIFtDT0xVTU4uVTMyXTogNCxcbiAgW0NPTFVNTi5JMzJdOiA0LFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VUb051bWVyaWNUeXBlIChcbiAgbWluOiBudW1iZXIsXG4gIG1heDogbnVtYmVyXG4pOiBOVU1FUklDX0NPTFVNTnxudWxsIHtcbiAgaWYgKG1pbiA8IDApIHtcbiAgICAvLyBzb21lIGtpbmRhIG5lZ2F0aXZlPz9cbiAgICBpZiAobWluID49IC0xMjggJiYgbWF4IDw9IDEyNykge1xuICAgICAgLy8gc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uSTg7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTMyNzY4ICYmIG1heCA8PSAzMjc2Nykge1xuICAgICAgLy8gc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLkkxNjtcbiAgICB9IGVsc2UgaWYgKG1pbiA+PSAtMjE0NzQ4MzY0OCAmJiBtYXggPD0gMjE0NzQ4MzY0Nykge1xuICAgICAgLy8gc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uSTMyO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAobWF4IDw9IDI1NSkge1xuICAgICAgLy8gdW5zaWduZWQgYnl0ZVxuICAgICAgcmV0dXJuIENPTFVNTi5VODtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA2NTUzNSkge1xuICAgICAgLy8gdW5zaWduZWQgc2hvcnRcbiAgICAgIHJldHVybiBDT0xVTU4uVTE2O1xuICAgIH0gZWxzZSBpZiAobWF4IDw9IDQyOTQ5NjcyOTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGxvbmdcbiAgICAgIHJldHVybiBDT0xVTU4uVTMyO1xuICAgIH1cbiAgfVxuICAvLyBHT1RPOiBCSUdPT09PT09PT0JPT09PT1lPXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1lcmljQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIE5VTUVSSUNfQ09MVU1OIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCaWdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLkJJRyB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQklHO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb29sQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CT09MIHtcbiAgcmV0dXJuIHR5cGUgPT09IENPTFVNTi5CT09MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdDb2x1bW4gKHR5cGU6IENPTFVNTik6IHR5cGUgaXMgQ09MVU1OLlNUUklORyB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uU1RSSU5HO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDb2x1bW48VCA9IGFueSwgUiBleHRlbmRzIFVpbnQ4QXJyYXl8bnVtYmVyID0gYW55PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTjtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnkpID0+IFQ7XG4gIGZyb21UZXh0ICh2OiBzdHJpbmcpOiBUO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogYW55KTogUixcbiAgdG9TdHJpbmcgKHY6IHN0cmluZyk6IGFueTtcbiAgcmVhZG9ubHkgd2lkdGg6IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyOiBudW1iZXI7XG4gIHJlYWRvbmx5IG9mZnNldDogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPHN0cmluZywgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uU1RSSU5HID0gQ09MVU1OLlNUUklORztcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uU1RSSU5HXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDM7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IGluZGV4LCBuYW1lLCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc1N0cmluZ0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignJHtuYW1lfSBpcyBub3QgYSBzdHJpbmcgY29sdW1uJyk7XG4gICAgaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlZW1zIG92ZXJyaWRlIGZvciAke25hbWV9IGRvZXMgbm90IHJldHVybiBhIHN0cmluZ2ApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGZyb21UZXh0ICh2OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vcmV0dXJuIHYgPz8gJ1wiXCInO1xuICAgIC8vIFRPRE8gLSBuZWVkIHRvIHZlcmlmeSB0aGVyZSBhcmVuJ3QgYW55IHNpbmdsZSBxdW90ZXM/XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYpO1xuICAgIGlmICh2LnN0YXJ0c1dpdGgoJ1wiJykpIHJldHVybiB2LnNsaWNlKDEsIC0xKTtcbiAgICByZXR1cm4gdjtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFtDT0xVTU4uU1RSSU5HLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBzdHJpbmdUb0J5dGVzKHYpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxudW1iZXIsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogTlVNRVJJQ19DT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IDF8Mnw0O1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAwO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnbnVtYmVyJylcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBvdmVycmlkZSBtdXN0IHJldHVybiBhIG51bWJlcmApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICAgIHRoaXMud2lkdGggPSBDT0xVTU5fV0lEVEhbdGhpcy50eXBlXTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/IHRoaXMub3ZlcnJpZGUodikgOlxuICAgICAgdiA/IE51bWJlcih2KSB8fCAwIDogMDtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkodGhpcy53aWR0aCk7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tvXSA9ICh2ID4+PiAobyAqIDgpKSAmIDI1NTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyA9IENPTFVNTi5CSUc7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJJR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAyO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGJpZ2ludDtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2JpZ2ludCcpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NlZW1zIHRoYXQgb3ZlcnJpZGUgZG9lcyBub3QgcmV0dXJuIGEgYmlnaW50Jyk7XG4gICAgaWYgKCFpc0JpZ0NvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBiaWdgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2KTtcbiAgICBpZiAoIXYpIHJldHVybiAwbjtcbiAgICByZXR1cm4gQmlnSW50KHYpO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYmlnaW50LCBudW1iZXJdIHtcbiAgICByZXR1cm4gYnl0ZXNUb0JpZ0JveShpLCBieXRlcyk7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CSUcsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYmlnaW50KTogVWludDhBcnJheSB7XG4gICAgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgcmV0dXJuIGJpZ0JveVRvQnl0ZXModik7XG4gIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgQm9vbENvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48Ym9vbGVhbiwgbnVtYmVyPiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICByZWFkb25seSBvZmZzZXQgPSAwO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgYml0LCBmbGFnLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NlZW1zIHRoYXQgb3ZlcnJpZGUgZG9lcyBub3QgcmV0dXJuIGEgYmlnaW50Jyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgaWYgKHR5cGVvZiBmbGFnICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBmbGFnIGlzIG5vdCBudW1iZXJgKTtcbiAgICBpZiAodHlwZW9mIGJpdCAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgYml0IGlzIG5vdCBudW1iZXJgKTtcbiAgICB0aGlzLmZsYWcgPSBmbGFnO1xuICAgIHRoaXMuYml0ID0gYml0O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGZyb21UZXh0ICh2OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodik7XG4gICAgaWYgKCF2IHx8IHYgPT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnJvbUJ5dGVzKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXkpOiBbYm9vbGVhbiwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIFtieXRlc1tpXSA9PT0gdGhpcy5mbGFnLCAwXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cblxuICBzZXJpYWxpemVSb3codjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgcmV0dXJuIHYgPyB0aGlzLmZsYWcgOiAwO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEZDb21wYXJhYmxlID0geyBvcmRlcjogbnVtYmVyLCBiaXQ6IG51bWJlciB8IG51bGwsIGluZGV4OiBudW1iZXIgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNtcEZpZWxkcyAoYTogRkNvbXBhcmFibGUsIGI6IEZDb21wYXJhYmxlKTogbnVtYmVyIHtcbiAgcmV0dXJuIChhLm9yZGVyIC0gYi5vcmRlcikgfHxcbiAgICAoKGEuYml0ID8/IDApIC0gKGIuYml0ID8/IDApKSB8fFxuICAgIChhLmluZGV4IC0gYi5pbmRleCk7XG59XG5cbmV4cG9ydCB0eXBlIENvbHVtbiA9XG4gIHxTdHJpbmdDb2x1bW5cbiAgfE51bWVyaWNDb2x1bW5cbiAgfEJpZ0NvbHVtblxuICB8Qm9vbENvbHVtblxuICA7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmdzRnJvbVRleHQgKFxuICBuYW1lOiBzdHJpbmcsXG4gIGk6IG51bWJlcixcbiAgaW5kZXg6IG51bWJlcixcbiAgZmxhZ3NVc2VkOiBudW1iZXIsXG4gIGRhdGE6IHN0cmluZ1tdW10sXG4gIG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55LFxuKTogQ29sdW1uQXJnc3xudWxsIHtcbiAgY29uc3QgZmllbGQgPSB7XG4gICAgaW5kZXgsXG4gICAgbmFtZSxcbiAgICBvdmVycmlkZSxcbiAgICB0eXBlOiBDT0xVTU4uVU5VU0VELFxuICAgIG1heFZhbHVlOiAwLFxuICAgIG1pblZhbHVlOiAwLFxuICAgIHdpZHRoOiBudWxsIGFzIGFueSxcbiAgICBmbGFnOiBudWxsIGFzIGFueSxcbiAgICBiaXQ6IG51bGwgYXMgYW55LFxuICAgIG9yZGVyOiA5OTksXG4gIH07XG4gIGxldCBpc1VzZWQgPSBmYWxzZTtcbiAgLy9pZiAoaXNVc2VkICE9PSBmYWxzZSkgZGVidWdnZXI7XG4gIGZvciAoY29uc3QgdSBvZiBkYXRhKSB7XG4gICAgY29uc3QgdiA9IGZpZWxkLm92ZXJyaWRlID8gZmllbGQub3ZlcnJpZGUodVtpXSkgOiB1W2ldO1xuICAgIGlmICghdikgY29udGludWU7XG4gICAgLy9jb25zb2xlLmVycm9yKGAke2l9OiR7bmFtZX0gfiAke3VbMF19OiR7dVsxXX06ICR7dn1gKVxuICAgIGlzVXNlZCA9IHRydWU7XG4gICAgY29uc3QgbiA9IE51bWJlcih2KTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB7XG4gICAgICAvLyBtdXN0IGJlIGEgc3RyaW5nXG4gICAgICBmaWVsZC50eXBlID0gQ09MVU1OLlNUUklORztcbiAgICAgIGZpZWxkLm9yZGVyID0gMztcbiAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFxceDFiWzMxbSR7aX06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2l9OiR7bmFtZX0gaXMgdW51c2VkP1xceDFiWzBtYClcbiAgICAvL2RlYnVnZ2VyO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1pblZhbHVlID09PSAwICYmIGZpZWxkLm1heFZhbHVlID09PSAxKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszNG0ke2l9OiR7bmFtZX0gYXBwZWFycyB0byBiZSBhIGJvb2xlYW4gZmxhZ1xceDFiWzBtYCk7XG4gICAgZmllbGQudHlwZSA9IENPTFVNTi5CT09MO1xuICAgIGZpZWxkLm9yZGVyID0gMTtcbiAgICBmaWVsZC5iaXQgPSBmbGFnc1VzZWQ7XG4gICAgZmllbGQuZmxhZyA9IDEgPDwgZmllbGQuYml0ICUgODtcbiAgICByZXR1cm4gZmllbGQ7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQub3JkZXIgPSAwO1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQklHIEJPWSBUSU1FXG4gIGZpZWxkLnR5cGUgPSBDT0xVTU4uQklHO1xuICBmaWVsZC5vcmRlciA9IDI7XG4gIHJldHVybiBmaWVsZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21BcmdzIChhcmdzOiBDb2x1bW5BcmdzKTogQ29sdW1uIHtcbiAgc3dpdGNoIChhcmdzLnR5cGUpIHtcbiAgICBjYXNlIENPTFVNTi5VTlVTRUQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VudXNlZCBmaWVsZCBjYW50IGJlIHR1cm5lZCBpbnRvIGEgQ29sdW1uJyk7XG4gICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgcmV0dXJuIG5ldyBTdHJpbmdDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgIHJldHVybiBuZXcgQm9vbENvbHVtbihhcmdzKTtcbiAgICBjYXNlIENPTFVNTi5VODpcbiAgICBjYXNlIENPTFVNTi5JODpcbiAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICByZXR1cm4gbmV3IE51bWVyaWNDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgcmV0dXJuIG5ldyBCaWdDb2x1bW4oYXJncyk7XG4gIH1cbn1cbiIsICIvLyBqdXN0IGEgYnVuY2ggb2Ygb3V0cHV0IGZvcm1hdHRpbmcgc2hpdFxuZXhwb3J0IGZ1bmN0aW9uIHRhYmxlRGVjbyhuYW1lOiBzdHJpbmcsIHdpZHRoID0gODAsIHN0eWxlID0gOSkge1xuICBjb25zdCB7IFRMLCBCTCwgVFIsIEJSLCBIUiB9ID0gZ2V0Qm94Q2hhcnMoc3R5bGUpXG4gIGNvbnN0IG5hbWVXaWR0aCA9IG5hbWUubGVuZ3RoICsgMjsgLy8gd2l0aCBzcGFjZXNcbiAgY29uc3QgaFRhaWxXaWR0aCA9IHdpZHRoIC0gKG5hbWVXaWR0aCArIDYpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sdW1uczogQ29sdW1uW10sXG4gIGZpZWxkczogc3RyaW5nW10sXG4gIGZsYWdzVXNlZDogbnVtYmVyO1xufVxuXG50eXBlIEJsb2JQYXJ0ID0gYW55OyAvLyA/Pz8/P1xuXG5leHBvcnQgY2xhc3MgU2NoZW1hIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBjb2x1bW5zOiBSZWFkb25seTxDb2x1bW5bXT47XG4gIHJlYWRvbmx5IGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+O1xuICByZWFkb25seSBjb2x1bW5zQnlOYW1lOiBSZWNvcmQ8c3RyaW5nLCBDb2x1bW4+O1xuICByZWFkb25seSBmaXhlZFdpZHRoOiBudW1iZXI7IC8vIHRvdGFsIGJ5dGVzIHVzZWQgYnkgbnVtYmVycyArIGZsYWdzXG4gIHJlYWRvbmx5IGZsYWdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgc3RyaW5nRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpZ0ZpZWxkczogbnVtYmVyO1xuICBjb25zdHJ1Y3Rvcih7IGNvbHVtbnMsIGZpZWxkcywgbmFtZSwgZmxhZ3NVc2VkIH06IFNjaGVtYUFyZ3MpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuY29sdW1ucyA9IFsuLi5jb2x1bW5zXTtcbiAgICB0aGlzLmZpZWxkcyA9IFsuLi5maWVsZHNdO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArIChjLndpZHRoID8/IDApLFxuICAgICAgTWF0aC5jZWlsKGZsYWdzVXNlZCAvIDgpLCAvLyA4IGZsYWdzIHBlciBieXRlLCBuYXRjaFxuICAgICk7XG5cbiAgICBsZXQgbzogbnVtYmVyfG51bGwgPSAwO1xuICAgIGZvciAoY29uc3QgYyBvZiBjb2x1bW5zKSB7XG4gICAgICBzd2l0Y2ggKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4KSBvKys7XG4gICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgIGMub2Zmc2V0ID0gbztcbiAgICAgICAgIG8gKz0gYy53aWR0aDtcbiAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmluZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNTdHJpbmdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuICAgIHRoaXMuYmlnRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc0JpZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG5cbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogU2NoZW1hIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlYWQ6IG51bWJlcjtcbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG5cbiAgICBjb25zdCBhcmdzID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvbHVtbnM6IFtdIGFzIENvbHVtbltdLFxuICAgICAgZmllbGRzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIGZsYWdzVXNlZDogMCxcbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyBUT0RPIC0gb25seSB3b3JrcyB3aGVuIDAtZmllbGQgc2NoZW1hcyBhcmVuJ3QgYWxsb3dlZH4hXG4gICAgd2hpbGUgKGluZGV4IDwgbnVtRmllbGRzKSB7XG4gICAgICBjb25zdCB0eXBlID0gYnl0ZXNbaSsrXTtcbiAgICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgY29uc3QgZiA9IHsgaW5kZXgsIG5hbWUsIHR5cGUsIHdpZHRoOiBudWxsLCBiaXQ6IG51bGwsIGZsYWc6IG51bGwsIG9yZGVyOiA5OTkgfTtcbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIGxldCBjOiBDb2x1bW47XG5cbiAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICAgYyA9IG5ldyBTdHJpbmdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgICAgYyA9IG5ldyBCaWdDb2x1bW4oeyAuLi5mIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGNvbnN0IGJpdCA9IGFyZ3MuZmxhZ3NVc2VkKys7XG4gICAgICAgICAgY29uc3QgZmxhZyA9IDIgKiogKGJpdCAlIDgpO1xuICAgICAgICAgIGMgPSBuZXcgQm9vbENvbHVtbih7IC4uLmYsIGJpdCwgZmxhZyB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAxIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDQgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIHR5cGUgJHt0eXBlfWApO1xuICAgICAgfVxuICAgICAgYXJncy5jb2x1bW5zLnB1c2goYyk7XG4gICAgICBhcmdzLmZpZWxkcy5wdXNoKGMubmFtZSk7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNjaGVtYShhcmdzKTtcbiAgfVxuXG4gIHJvd0Zyb21CdWZmZXIoXG4gICAgICBpOiBudW1iZXIsXG4gICAgICBidWZmZXI6IEFycmF5QnVmZmVyLFxuICAgICAgX19yb3dJZDogbnVtYmVyXG4gICk6IFtSb3csIG51bWJlcl0ge1xuICAgIGNvbnN0IGRiciA9IF9fcm93SWQgPCA1IHx8IF9fcm93SWQgPiAzOTc1IHx8IF9fcm93SWQgJSAxMDAwID09PSAwO1xuICAgIC8vaWYgKGRicikgY29uc29sZS5sb2coYCAtIFJPVyAke19fcm93SWR9IEZST00gJHtpfSAoMHgke2kudG9TdHJpbmcoMTYpfSlgKVxuICAgIGxldCB0b3RhbFJlYWQgPSAwO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgY29uc3Qgcm93OiBSb3cgPSB7IF9fcm93SWQgfVxuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIGlmIChjLm9mZnNldCAhPT0gbnVsbCAmJiBjLm9mZnNldCAhPT0gdG90YWxSZWFkKSBkZWJ1Z2dlcjtcbiAgICAgIGxldCBbdiwgcmVhZF0gPSBjLmZyb21CeXRlcyhpLCBieXRlcywgdmlldyk7XG5cbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKVxuICAgICAgICByZWFkID0gKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSA/IDEgOiAwO1xuXG4gICAgICBpICs9IHJlYWQ7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVhZDtcbiAgICAgIHJvd1tjLm5hbWVdID0gdjtcbiAgICB9XG4gICAgLy9pZiAoZGJyKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgICBSRUFEOiAke3RvdGFsUmVhZH0gVE8gJHtpfSAvICR7YnVmZmVyLmJ5dGVMZW5ndGh9XFxuYCwgcm93LCAnXFxuXFxuJyk7XG4gICAgICAvL2RlYnVnZ2VyO1xuICAgIC8vfVxuICAgIHJldHVybiBbcm93LCB0b3RhbFJlYWRdO1xuICB9XG5cbiAgcHJpbnRSb3cgKHI6IFJvdywgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbZiwgcltmXV0pKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUhlYWRlciAoKTogQmxvYiB7XG4gICAgLy8gWy4uLm5hbWUsIDAsIG51bUZpZWxkczAsIG51bUZpZWxkczEsIGZpZWxkMFR5cGUsIGZpZWxkMEZsYWc/LCAuLi5maWVsZDBOYW1lLCAwLCBldGNdO1xuICAgIC8vIFRPRE8gLSBCYXNlIHVuaXQgaGFzIDUwMCsgZmllbGRzXG4gICAgaWYgKHRoaXMuY29sdW1ucy5sZW5ndGggPiA2NTUzNSkgdGhyb3cgbmV3IEVycm9yKCdvaCBidWRkeS4uLicpO1xuICAgIGNvbnN0IHBhcnRzID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyAocjogUm93KTogQmxvYiB7XG4gICAgY29uc3QgZml4ZWQgPSBuZXcgVWludDhBcnJheSh0aGlzLmZpeGVkV2lkdGgpO1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcbiAgICBjb25zdCBibG9iUGFydHM6IEJsb2JQYXJ0W10gPSBbZml4ZWRdO1xuICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLmNvbHVtbnMpIHtcbiAgICAgIGNvbnN0IHYgPSByW2MubmFtZV0vLyBjLnNlcmlhbGl6ZVJvdyggYXMgbmV2ZXIpOyAvLyBsdWxcbiAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSB7fVxuICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6IHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBzdHJpbmcpXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgfSBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOiB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgYmlnaW50KVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIH0gYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBmaXhlZFtpXSB8PSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJvb2xlYW4pO1xuICAgICAgICAgIC8vIGRvbnQgbmVlZCB0byBjaGVjayBmb3IgdGhlIGxhc3QgZmxhZyBzaW5jZSB3ZSBubyBsb25nZXIgbmVlZCBpXG4gICAgICAgICAgLy8gYWZ0ZXIgd2UncmUgZG9uZSB3aXRoIG51bWJlcnMgYW5kIGJvb2xlYW5zXG4gICAgICAgICAgLy9pZiAoYy5mbGFnID09PSAxMjgpIGkrKztcbiAgICAgICAgICAvLyAuLi5idXQgd2Ugd2lsbCBiZWNhdXlzZSB3ZSBicm9rZSBzb21ldGhpZ25cbiAgICAgICAgICBpZiAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpIGkrKztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgICBjb25zdCBieXRlcyA9IGMuc2VyaWFsaXplUm93KHYgYXMgbnVtYmVyKVxuICAgICAgICAgIGZpeGVkLnNldChieXRlcywgaSlcbiAgICAgICAgICBpICs9IGMud2lkdGg7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3dhdCB0eXBlIGlzIHRoaXMnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL2lmIChyLl9fcm93SWQgPCA1IHx8IHIuX19yb3dJZCA+IDM5NzUgfHwgci5fX3Jvd0lkICUgMTAwMCA9PT0gMCkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgIC0gUk9XICR7ci5fX3Jvd0lkfWAsIHsgaSwgYmxvYlBhcnRzLCByIH0pO1xuICAgIC8vfVxuICAgIHJldHVybiBuZXcgQmxvYihibG9iUGFydHMpO1xuICB9XG5cbiAgcHJpbnQgKHdpZHRoID0gODApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMzYpO1xuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnN0IHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSA9IHRoaXM7XG4gICAgY29uc29sZS5sb2coeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9KTtcbiAgICBjb25zb2xlLnRhYmxlKHRoaXMuY29sdW1ucywgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ2xhYmVsJyxcbiAgICAgICdvZmZzZXQnLFxuICAgICAgJ29yZGVyJyxcbiAgICAgICdiaXQnLFxuICAgICAgJ3R5cGUnLFxuICAgICAgJ2ZsYWcnLFxuICAgICAgJ3dpZHRoJyxcbiAgICBdKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcblxuICB9XG5cbiAgLy8gcmF3VG9Sb3cgKGQ6IFJhd1Jvdyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHt9XG4gIC8vIHJhd1RvU3RyaW5nIChkOiBSYXdSb3csIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHt9XG59O1xuXG4iLCAiaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHsgdGFibGVEZWNvIH0gZnJvbSAnLi91dGlsJztcbmV4cG9ydCB0eXBlIFJvd0RhdGEgPSBzdHJpbmdbXTtcbmV4cG9ydCB0eXBlIFJvdyA9IFJlY29yZDxzdHJpbmcsIGJvb2xlYW58bnVtYmVyfHN0cmluZ3xiaWdpbnQ+ICYgeyBfX3Jvd0lkOiBudW1iZXIgfTtcblxuZXhwb3J0IGNsYXNzIFRhYmxlIHtcbiAgZ2V0IG5hbWUgKCk6IHN0cmluZyB7IHJldHVybiBgW1RBQkxFOiR7dGhpcy5zY2hlbWEubmFtZX1dYDsgfVxuICBjb25zdHJ1Y3RvciAoXG4gICAgcmVhZG9ubHkgcm93czogUm93W10sXG4gICAgcmVhZG9ubHkgc2NoZW1hOiBTY2hlbWEsXG4gICkge1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBbVWludDMyQXJyYXksIEJsb2IsIEJsb2JdIHtcbiAgICAvLyBbbnVtUm93cywgaGVhZGVyU2l6ZSwgZGF0YVNpemVdLCBzY2hlbWFIZWFkZXIsIFtyb3cwLCByb3cxLCAuLi4gcm93Tl07XG4gICAgY29uc3Qgc2NoZW1hSGVhZGVyID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplSGVhZGVyKCk7XG4gICAgLy8gY2FudCBmaWd1cmUgb3V0IGhvdyB0byBkbyB0aGlzIHdpdGggYml0cyA6JzxcbiAgICBjb25zdCBzY2hlbWFQYWRkaW5nID0gKDQgLSBzY2hlbWFIZWFkZXIuc2l6ZSAlIDQpICUgNDtcbiAgICBjb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocikpO1xuICAgIC8vY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4ge1xuICAgICAgLy9jb25zdCByb3dCbG9iID0gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpXG4gICAgICAvL2lmIChyLl9fcm93SWQgPT09IDApXG4gICAgICAgIC8vcm93QmxvYi5hcnJheUJ1ZmZlcigpLnRoZW4oYWIgPT4ge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coYEFSUkFZIEJVRkZFUiBGT1IgRklSU1QgUk9XIE9GICR7dGhpcy5uYW1lfWAsIG5ldyBVaW50OEFycmF5KGFiKS5qb2luKCcsICcpKTtcbiAgICAgICAgLy99KTtcbiAgICAgIC8vcmV0dXJuIHJvd0Jsb2I7XG4gICAgLy99KTtcbiAgICBjb25zdCByb3dCbG9iID0gbmV3IEJsb2Iocm93RGF0YSlcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93QmxvYi5zaXplICUgNCkgJSA0O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIG5ldyBVaW50MzJBcnJheShbXG4gICAgICAgIHRoaXMucm93cy5sZW5ndGgsXG4gICAgICAgIHNjaGVtYUhlYWRlci5zaXplICsgc2NoZW1hUGFkZGluZyxcbiAgICAgICAgcm93QmxvYi5zaXplICsgZGF0YVBhZGRpbmdcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICBzY2hlbWFIZWFkZXIsXG4gICAgICAgIG5ldyBBcnJheUJ1ZmZlcihzY2hlbWFQYWRkaW5nKSBhcyBhbnkgLy8gPz8/XG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgcm93QmxvYixcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZGF0YVBhZGRpbmcpXG4gICAgICBdKSxcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGNvbmNhdFRhYmxlcyAodGFibGVzOiBUYWJsZVtdKTogQmxvYiB7XG4gICAgY29uc3QgYWxsU2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoMSArIHRhYmxlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCBhbGxIZWFkZXJzOiBCbG9iW10gPSBbXTtcbiAgICBjb25zdCBhbGxEYXRhOiBCbG9iW10gPSBbXTtcblxuICAgIGNvbnN0IGJsb2JzID0gdGFibGVzLm1hcCh0ID0+IHQuc2VyaWFsaXplKCkpO1xuICAgIGFsbFNpemVzWzBdID0gYmxvYnMubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgW2ksIFtzaXplcywgaGVhZGVycywgZGF0YV1dIG9mIGJsb2JzLmVudHJpZXMoKSkge1xuICAgICAgLy9jb25zb2xlLmxvZyhgT1VUIEJMT0JTIEZPUiBUPSR7aX1gLCBzaXplcywgaGVhZGVycywgZGF0YSlcbiAgICAgIGFsbFNpemVzLnNldChzaXplcywgMSArIGkgKiAzKTtcbiAgICAgIGFsbEhlYWRlcnMucHVzaChoZWFkZXJzKTtcbiAgICAgIGFsbERhdGEucHVzaChkYXRhKTtcbiAgICB9XG4gICAgLy9jb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zdCB0YWJsZXMgPSBhd2FpdCBQcm9taXNlLmFsbCh0QmxvYnMubWFwKCh0YiwgaSkgPT4ge1xuICAgICAgLy9jb25zb2xlLmxvZyhgSU4gQkxPQlMgRk9SIFQ9JHtpfWAsIHRiKVxuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGZyb21CbG9iICh7XG4gICAgaGVhZGVyQmxvYixcbiAgICBkYXRhQmxvYixcbiAgICBudW1Sb3dzLFxuICB9OiBUYWJsZUJsb2IpOiBQcm9taXNlPFRhYmxlPiB7XG4gICAgY29uc3Qgc2NoZW1hID0gU2NoZW1hLmZyb21CdWZmZXIoYXdhaXQgaGVhZGVyQmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICBsZXQgcmJvID0gMDtcbiAgICBsZXQgX19yb3dJZCA9IDA7XG4gICAgY29uc3Qgcm93czogUm93W10gPSBbXTtcbiAgICAvLyBUT0RPIC0gY291bGQgZGVmaW5pdGVseSB1c2UgYSBzdHJlYW0gZm9yIHRoaXNcbiAgICBjb25zdCBkYXRhQnVmZmVyID0gYXdhaXQgZGF0YUJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT0gUkVBRCAke251bVJvd3N9IE9GICR7c2NoZW1hLm5hbWV9ID09PT09YClcbiAgICB3aGlsZSAoX19yb3dJZCA8IG51bVJvd3MpIHtcbiAgICAgIGNvbnN0IFtyb3csIHJlYWRdID0gc2NoZW1hLnJvd0Zyb21CdWZmZXIocmJvLCBkYXRhQnVmZmVyLCBfX3Jvd0lkKyspO1xuICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgICByYm8gKz0gcmVhZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG4gIH1cblxuXG4gIHByaW50IChcbiAgICB3aWR0aDogbnVtYmVyID0gODAsXG4gICAgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT58bnVsbCA9IG51bGwsXG4gICAgbjogbnVtYmVyfG51bGwgPSBudWxsLFxuICAgIG06IG51bWJlcnxudWxsID0gbnVsbFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHJvd3MgPSBuID09PSBudWxsID8gdGhpcy5yb3dzIDpcbiAgICAgIG0gPT09IG51bGwgPyB0aGlzLnJvd3Muc2xpY2UoMCwgbikgOlxuICAgICAgdGhpcy5yb3dzLnNsaWNlKG4sIG0pO1xuXG4gICAgY29uc3QgW3BSb3dzLCBwRmllbGRzXSA9IGZpZWxkcyA/XG4gICAgICBbcm93cy5tYXAoKHI6IFJvdykgPT4gdGhpcy5zY2hlbWEucHJpbnRSb3cociwgZmllbGRzKSksIGZpZWxkc106XG4gICAgICBbcm93cywgdGhpcy5zY2hlbWEuZmllbGRzXVxuICAgICAgO1xuXG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc29sZS50YWJsZShwUm93cywgcEZpZWxkcyk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG4gIH1cbiAgLypcbiAgcmF3VG9Sb3cgKGQ6IHN0cmluZ1tdKTogUm93IHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuc2NoZW1hLmNvbHVtbnMubWFwKHIgPT4gW1xuICAgICAgci5uYW1lLFxuICAgICAgci50b1ZhbChkW3IuaW5kZXhdKVxuICAgIF0pKTtcbiAgfVxuICByYXdUb1N0cmluZyAoZDogc3RyaW5nW10sIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAvLyBqdXN0IGFzc3VtZSBmaXJzdCB0d28gZmllbGRzIGFyZSBhbHdheXMgaWQsIG5hbWUuIGV2ZW4gaWYgdGhhdCdzIG5vdCB0cnVlXG4gICAgLy8gdGhpcyBpcyBqdXN0IGZvciB2aXN1YWxpemF0aW9uIHB1cnBvcnNlc1xuICAgIGxldCBleHRyYSA9ICcnO1xuICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgY29uc3Qgczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLnJhd1RvUm93KGQpO1xuICAgICAgZm9yIChjb25zdCBhIG9mIGFyZ3MpIHtcbiAgICAgICAgLy8gZG9uJ3QgcmVwcmludCBuYW1lIG9yIGlkXG4gICAgICAgIGlmIChhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMF0gfHwgYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzFdKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZVthXSAhPSBudWxsKVxuICAgICAgICAgIHMucHVzaChgJHthfTogJHtKU09OLnN0cmluZ2lmeShlW2FdKX1gKVxuICAgICAgfVxuICAgICAgZXh0cmEgPSBzLmxlbmd0aCA+IDAgPyBgIHsgJHtzLmpvaW4oJywgJyl9IH1gIDogJ3t9JztcbiAgICB9XG4gICAgcmV0dXJuIGA8JHt0aGlzLnNjaGVtYS5uYW1lfToke2RbMF0gPz8gJz8nfSBcIiR7ZFsxXX1cIiR7ZXh0cmF9PmA7XG4gIH1cbiAgKi9cbn1cbnR5cGUgVGFibGVCbG9iID0geyBudW1Sb3dzOiBudW1iZXIsIGhlYWRlckJsb2I6IEJsb2IsIGRhdGFCbG9iOiBCbG9iIH07XG4iLCAiaW1wb3J0IHsgY3N2RGVmcyB9IGZyb20gJy4vY3N2LWRlZnMnO1xuaW1wb3J0IHsgcGFyc2VBbGwsIHJlYWRDU1YgfSBmcm9tICcuL3BhcnNlLWNzdic7XG5pbXBvcnQgcHJvY2VzcyBmcm9tICdub2RlOnByb2Nlc3MnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcbmltcG9ydCB7IHdyaXRlRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuXG5jb25zdCB3aWR0aCA9IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnM7XG5jb25zdCBbZmlsZSwgLi4uZmllbGRzXSA9IHByb2Nlc3MuYXJndi5zbGljZSgyKTtcblxuY29uc29sZS5sb2coJ0FSR1MnLCB7IGZpbGUsIGZpZWxkcyB9KVxuXG5pZiAoZmlsZSkge1xuICBjb25zdCBkZWYgPSBjc3ZEZWZzW2ZpbGVdO1xuICBpZiAoZGVmKSBnZXREVU1QWShhd2FpdCByZWFkQ1NWKGZpbGUsIGRlZikpO1xufSBlbHNlIHtcbiAgY29uc3QgZGVzdCA9ICcuL2RhdGEvZGIuYmluJ1xuICBjb25zdCB0YWJsZXMgPSBhd2FpdCBwYXJzZUFsbChjc3ZEZWZzKTtcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyh0YWJsZXMpO1xuICBhd2FpdCB3cml0ZUZpbGUoZGVzdCwgYmxvYi5zdHJlYW0oKSwgeyBlbmNvZGluZzogbnVsbCB9KTtcbiAgY29uc29sZS5sb2coYHdyb3RlICR7YmxvYi5zaXplfSBieXRlcyB0byAke2Rlc3R9YCk7XG59XG5cbi8qXG5pZiAoZmlsZSkge1xuICBjb25zdCBkZWYgPSBjc3ZEZWZzW2ZpbGVdO1xuICBpZiAoZGVmKSBnZXREVU1QWShhd2FpdCByZWFkQ1NWKGZpbGUsIGRlZikpO1xuICBlbHNlIHRocm93IG5ldyBFcnJvcihgbm8gZGVmIGZvciBcIiR7ZmlsZX1cImApO1xufSBlbHNlIHtcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIGZvciAoY29uc3QgdCBvZiB0YWJsZXMpIGF3YWl0IGdldERVTVBZKHQpO1xufVxuKi9cblxuXG5hc3luYyBmdW5jdGlvbiBnZXREVU1QWSh0OiBUYWJsZSkge1xuICBjb25zdCBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKHQucm93cy5sZW5ndGggLSAzMCkpO1xuICBjb25zdCBtID0gbiArIDMwO1xuICBjb25zdCBmID0gdC5zY2hlbWEuZmllbGRzLnNsaWNlKDAsIDgpO1xuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKFt0XSk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4gICAgICAgQkVGT1JFOicpO1xuICB0LnByaW50KHdpZHRoLCBmLCBuLCBtKTtcbiAgLy90LnByaW50KHdpZHRoLCBudWxsLCAxMCk7XG4gIC8vdC5zY2hlbWEucHJpbnQoKTtcbiAgY29uc29sZS5sb2coJ1xcblxcbicpXG4gIGNvbnN0IHUgPSBhd2FpdCBUYWJsZS5vcGVuQmxvYihibG9iKTtcbiAgY29uc29sZS5sb2coJ1xcblxcbiAgICAgICAgQUZURVI6Jyk7XG4gIC8vdS5Vbml0LnByaW50KHdpZHRoLCBudWxsLCAxMCk7XG4gIE9iamVjdC52YWx1ZXModSlbMF0/LnByaW50KHdpZHRoLCBmLCBuLCBtKTtcbiAgLy91LlVuaXQuc2NoZW1hLnByaW50KHdpZHRoKTtcbiAgLy9hd2FpdCB3cml0ZUZpbGUoJy4vdG1wLmJpbicsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ08sSUFBTSxVQUF1RDtBQUFBLEVBQ2xFLDRCQUE0QjtBQUFBLElBQzFCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLElBQzdCLFdBQVc7QUFBQTtBQUFBLE1BRVQsV0FBVyxDQUFDLE1BQU8sT0FBTyxDQUFDLElBQUksTUFBTztBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsNEJBQTRCO0FBQUEsSUFDMUIsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUVBLGlDQUFpQztBQUFBLElBQy9CLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxnQ0FBZ0M7QUFBQSxJQUM5QixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0Esa0NBQWtDO0FBQUEsSUFDaEMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSw2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L0IsZUFBVyxLQUFLO0FBQ2QsV0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLFNBQVMsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUM7QUFBQSxFQUN6RTtBQUVBLFNBQU8sSUFBSSxNQUFNLE1BQU0sSUFBSSxPQUFPLFVBQVUsQ0FBQztBQUMvQztBQUVBLGVBQXNCLFNBQVMsTUFBbUQ7QUFDaEYsU0FBTyxRQUFRO0FBQUEsSUFDYixPQUFPLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTSxPQUFPLENBQUM7QUFBQSxFQUN0RTtBQUNGOzs7QU03SEEsT0FBTyxhQUFhO0FBRXBCLFNBQVMsaUJBQWlCO0FBRTFCLElBQU0sUUFBUSxRQUFRLE9BQU87QUFDN0IsSUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksUUFBUSxLQUFLLE1BQU0sQ0FBQztBQUU5QyxRQUFRLElBQUksUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRXBDLElBQUksTUFBTTtBQUNSLFFBQU0sTUFBTSxRQUFRLElBQUk7QUFDeEIsTUFBSTtBQUFLLGFBQVMsTUFBTSxRQUFRLE1BQU0sR0FBRyxDQUFDO0FBQzVDLE9BQU87QUFDTCxRQUFNLE9BQU87QUFDYixRQUFNLFNBQVMsTUFBTSxTQUFTLE9BQU87QUFDckMsUUFBTSxPQUFPLE1BQU0sYUFBYSxNQUFNO0FBQ3RDLFFBQU0sVUFBVSxNQUFNLEtBQUssT0FBTyxHQUFHLEVBQUUsVUFBVSxLQUFLLENBQUM7QUFDdkQsVUFBUSxJQUFJLFNBQVMsS0FBSyxJQUFJLGFBQWEsSUFBSSxFQUFFO0FBQ25EO0FBY0EsZUFBZSxTQUFTLEdBQVU7QUFDaEMsUUFBTSxJQUFJLEtBQUssTUFBTSxLQUFLLE9BQU8sS0FBSyxFQUFFLEtBQUssU0FBUyxHQUFHO0FBQ3pELFFBQU0sSUFBSSxJQUFJO0FBQ2QsUUFBTSxJQUFJLEVBQUUsT0FBTyxPQUFPLE1BQU0sR0FBRyxDQUFDO0FBQ3BDLFFBQU0sT0FBTyxNQUFNLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDbkMsVUFBUSxJQUFJLG9CQUFvQjtBQUNoQyxJQUFFLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUd0QixVQUFRLElBQUksTUFBTTtBQUNsQixRQUFNLElBQUksTUFBTSxNQUFNLFNBQVMsSUFBSTtBQUNuQyxVQUFRLElBQUksb0JBQW9CO0FBRWhDLFNBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUczQzsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImluZGV4Il0KfQo=
