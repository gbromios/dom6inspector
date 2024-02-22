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
    ignoreFields: /* @__PURE__ */ new Set(["end", "weapon"])
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi8uLi9saWIvc3JjL3NlcmlhbGl6ZS50cyIsICIuLi8uLi9saWIvc3JjL2NvbHVtbi50cyIsICIuLi8uLi9saWIvc3JjL3V0aWwudHMiLCAiLi4vLi4vbGliL3NyYy9zY2hlbWEudHMiLCAiLi4vLi4vbGliL3NyYy90YWJsZS50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmV4cG9ydCBjb25zdCBjc3ZEZWZzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4+ID0ge1xuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZVUuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAgb3ZlcnJpZGVzOiB7XG4gICAgICAvLyBjc3YgaGFzIHVucmVzdC90dXJuIHdoaWNoIGlzIGluY3VucmVzdCAvIDEwOyBjb252ZXJ0IHRvIGludCBmb3JtYXRcbiAgICAgIGluY3VucmVzdDogKHYpID0+IChOdW1iZXIodikgKiAxMCkgfHwgMFxuICAgIH1cbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VJLmNzdic6IHtcbiAgICBuYW1lOiAnSXRlbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuXG4gICcuLi8uLi9nYW1lZGF0YS9NYWdpY1NpdGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNTaXRlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9NZXJjZW5hcnkuY3N2Jzoge1xuICAgIG5hbWU6ICdNZXJjZW5hcnknLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FmZmxpY3Rpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnQWZmbGljdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2Fub25fcHJvdmluY2VfZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnQW5vblByb3ZpbmNlRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hcm1vcnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlX2tleXMuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVLZXknLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X2FybW9yLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9zcGVsbC5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfd2VhcG9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzFfdHlwZXMuY3N2Jzoge1xuICAgIC8vIFRPRE8gLSBnb3Qgc29tZSBiaWcgYm9pcyBpbiBoZXJlLlxuICAgIG5hbWU6ICdCdWZmQml0MScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2J1ZmZzXzJfdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdCdWZmQml0MicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0X21vZGlmaWVyX2JpdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbEJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfaW5mby5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsRWZmZWN0SW5mbycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0U3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdHNfd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFdlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZW5jaGFudG1lbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnRW5jaGFudG1lbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hZ2ljX3BhdGhzLmNzdic6IHtcbiAgICBuYW1lOiAnTWFnaWNQYXRoJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFwX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdUZXJyYWluVHlwZUJpdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21vbnN0ZXJfdGFncy5jc3YnOiB7XG4gICAgbmFtZTogJ01vbnN0ZXJUYWcnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYW1ldHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdOYW1lVHlwZScsXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9uYXRpb25zLmNzdic6IHtcbiAgICBuYW1lOiAnTmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9ub25mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL290aGVyX3BsYW5lcy5jc3YnOiB7XG4gICAgbmFtZTogJ090aGVyUGxhbmUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnUHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9wcm90ZWN0aW9uc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ1Byb3RlY3Rpb25CeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9yZWFsbXMuY3N2Jzoge1xuICAgIG5hbWU6ICdSZWFsbScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NpdGVfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1NpdGVUZXJyYWluVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfZGFtYWdlX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbERhbWFnZVR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX3VuaXF1ZV9zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlY2lhbFVuaXF1ZVN1bW1vbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS90ZXJyYWluX3NwZWNpZmljX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdUZXJyYWluU3BlY2lmaWNTdW1tb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bml0X2VmZmVjdHMuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0RWZmZWN0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5wcmV0ZW5kZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnVW5wcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCcsICd3ZWFwb24nXSksXG4gIH0sXG59O1xuIiwgImltcG9ydCB0eXBlIHsgU2NoZW1hQXJncywgUm93IH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5cbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQge1xuICBTY2hlbWEsXG4gIFRhYmxlLFxuICBDT0xVTU4sXG4gIGNtcEZpZWxkcyxcbiAgYXJnc0Zyb21UZXh0LFxuICBDb2x1bW5BcmdzLFxuICBmcm9tQXJnc1xufSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxubGV0IF9uZXh0QW5vblNjaGVtYUlkID0gMTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQ1NWIChcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+LFxuKTogUHJvbWlzZTxUYWJsZT4ge1xuICBsZXQgcmF3OiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgcmF3ID0gYXdhaXQgcmVhZEZpbGUocGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICB9IGNhdGNoIChleCkge1xuICAgIGNvbnNvbGUuZXJyb3IoYGZhaWxlZCB0byByZWFkIHNjaGVtYSBmcm9tICR7cGF0aH1gLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBzY2hlbWEnKTtcbiAgfVxuICB0cnkge1xuICAgIHJldHVybiBjc3ZUb1RhYmxlKHJhdywgb3B0aW9ucyk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHBhcnNlIHNjaGVtYSBmcm9tICR7cGF0aH06YCwgZXgpO1xuICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHBhcnNlIHNjaGVtYScpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIFBhcnNlU2NoZW1hT3B0aW9ucyA9IHtcbiAgbmFtZT86IHN0cmluZyxcbiAgaWdub3JlRmllbGRzOiBTZXQ8c3RyaW5nPjtcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAodjogYW55KSA9PiBhbnk+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIGlnbm9yZUZpZWxkczogbmV3IFNldCgpLFxuICBvdmVycmlkZXM6IHt9LFxuICBzZXBhcmF0b3I6ICdcXHQnLCAvLyBzdXJwcmlzZSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUoXG4gIHJhdzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxQYXJzZVNjaGVtYU9wdGlvbnM+XG4pOiBUYWJsZSB7XG4gIGNvbnN0IF9vcHRzID0geyAuLi5ERUZBVUxUX09QVElPTlMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgc2NoZW1hQXJnczogU2NoZW1hQXJncyA9IHtcbiAgICBuYW1lOiBfb3B0cy5uYW1lID8/IGBTY2hlbWFfJHtfbmV4dEFub25TY2hlbWFJZCsrfWAsXG4gICAgZmxhZ3NVc2VkOiAwLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpZWxkczogW10sXG4gIH07XG5cbiAgaWYgKHJhdy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHRocm93IG5ldyBFcnJvcigndWggb2gnKVxuXG4gIGNvbnN0IFtyYXdGaWVsZHMsIC4uLnJhd0RhdGFdID0gcmF3XG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcbiAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdChfb3B0cy5zZXBhcmF0b3IpKTtcblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn0uJHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IHJhd0NvbHVtbnM6IFtjb2w6IENvbHVtbkFyZ3MsIHJhd0luZGV4OiBudW1iZXJdW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IFtyYXdJbmRleCwgbmFtZV0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGMgPSBhcmdzRnJvbVRleHQoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJhd0luZGV4LFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncy5mbGFnc1VzZWQsXG4gICAgICAgIHJhd0RhdGEsXG4gICAgICAgIF9vcHRzLm92ZXJyaWRlc1tuYW1lXVxuICAgICAgKTtcbiAgICAgIGlmIChjICE9PSBudWxsKSB7XG4gICAgICAgIGluZGV4Kys7XG4gICAgICAgIGlmIChjLnR5cGUgPT09IENPTFVNTi5CT09MKSBzY2hlbWFBcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICByYXdDb2x1bW5zLnB1c2goW2MsIHJhd0luZGV4XSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hQXJncy5uYW1lfTogXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfVxceDFiWzBtYCxcbiAgICAgICAgICBleFxuICAgICAgKTtcbiAgICAgIHRocm93IGV4XG4gICAgfVxuICB9XG5cbiAgcmF3Q29sdW1ucy5zb3J0KChhLCBiKSA9PiBjbXBGaWVsZHMoYVswXSwgYlswXSkpO1xuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgW2luZGV4LCBbY29sQXJncywgcmF3SW5kZXhdXSBvZiByYXdDb2x1bW5zLmVudHJpZXMoKSkge1xuICAgIGNvbEFyZ3MuaW5kZXggPSBpbmRleDtcbiAgICBjb25zdCBjb2wgPSBmcm9tQXJncyhjb2xBcmdzKTtcbiAgICBzY2hlbWFBcmdzLmNvbHVtbnMucHVzaChjb2wpO1xuICAgIHNjaGVtYUFyZ3MuZmllbGRzLnB1c2goY29sLm5hbWUpO1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChyYXdEYXRhW3IuX19yb3dJZF1bcmF3SW5kZXhdKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImNvbnN0IF9fdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IF9fdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXk7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0OiBVaW50OEFycmF5LCBpOiBudW1iZXIpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0PzogVWludDhBcnJheSwgaSA9IDApIHtcbiAgaWYgKHMuaW5kZXhPZignXFwwJykgIT09IC0xKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZignXFwwJyk7XG4gICAgY29uc29sZS5lcnJvcihgJHtpfSA9IE5VTEwgPyBcIi4uLiR7cy5zbGljZShpIC0gMTAsIGkgKyAxMCl9Li4uYCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd3aG9vcHNpZScpO1xuICB9XG4gIGNvbnN0IGJ5dGVzID0gX190ZXh0RW5jb2Rlci5lbmNvZGUocyArICdcXDAnKTtcbiAgaWYgKGRlc3QpIHtcbiAgICBkZXN0LnNldChieXRlcywgaSk7XG4gICAgcmV0dXJuIGJ5dGVzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoaTogbnVtYmVyLCBhOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gIGxldCByID0gMDtcbiAgd2hpbGUgKGFbaSArIHJdICE9PSAwKSB7IHIrKzsgfVxuICByZXR1cm4gW19fdGV4dERlY29kZXIuZGVjb2RlKGEuc2xpY2UoaSwgaStyKSksIHIgKyAxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpZ0JveVRvQnl0ZXMgKG46IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAvLyB0aGlzIGlzIGEgY29vbCBnYW1lIGJ1dCBsZXRzIGhvcGUgaXQgZG9lc24ndCB1c2UgMTI3KyBieXRlIG51bWJlcnNcbiAgY29uc3QgYnl0ZXMgPSBbMF07XG4gIGlmIChuIDwgMG4pIHtcbiAgICBuICo9IC0xbjtcbiAgICBieXRlc1swXSA9IDEyODtcbiAgfVxuXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDY0bjtcbiAgfVxuXG4gIHJldHVybiBuZXcgVWludDhBcnJheShieXRlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvQmlnQm95IChpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gIGNvbnN0IEwgPSBOdW1iZXIoYnl0ZXNbaV0pO1xuICBjb25zdCBsZW4gPSBMICYgMTI3O1xuICBjb25zdCByZWFkID0gMSArIGxlbjtcbiAgY29uc3QgbmVnID0gKEwgJiAxMjgpID8gLTFuIDogMW47XG4gIGNvbnN0IEJCOiBiaWdpbnRbXSA9IEFycmF5LmZyb20oYnl0ZXMuc2xpY2UoaSArIDEsIGkgKyByZWFkKSwgQmlnSW50KTtcbiAgaWYgKGxlbiAhPT0gQkIubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ2JpZ2ludCBjaGVja3N1bSBpcyBGVUNLPycpO1xuICByZXR1cm4gW2xlbiA/IEJCLnJlZHVjZShieXRlVG9CaWdib2kpICogbmVnIDogMG4sIHJlYWRdXG59XG5cbmZ1bmN0aW9uIGJ5dGVUb0JpZ2JvaSAobjogYmlnaW50LCBiOiBiaWdpbnQsIGk6IG51bWJlcikge1xuICByZXR1cm4gbiB8IChiIDw8IEJpZ0ludChpICogOCkpO1xufVxuIiwgImltcG9ydCB7IGJpZ0JveVRvQnl0ZXMsIGJ5dGVzVG9CaWdCb3ksIGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5cbmV4cG9ydCB0eXBlIENvbHVtbkFyZ3MgPSB7XG4gIHR5cGU6IENPTFVNTjtcbiAgaW5kZXg6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgd2lkdGg6IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgZmxhZzogbnVtYmVyfG51bGw7XG4gIGJpdDogbnVtYmVyfG51bGw7XG4gIG9yZGVyOiBudW1iZXI7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCA9IDAsXG4gIFNUUklORyA9IDEsXG4gIEJPT0wgICA9IDIsXG4gIFU4ICAgICA9IDMsXG4gIEk4ICAgICA9IDQsXG4gIFUxNiAgICA9IDUsXG4gIEkxNiAgICA9IDYsXG4gIFUzMiAgICA9IDcsXG4gIEkzMiAgICA9IDgsXG4gIEJJRyAgICA9IDksXG59O1xuXG5leHBvcnQgY29uc3QgQ09MVU1OX0xBQkVMID0gW1xuICAnVU5VU0VEJyxcbiAgJ1NUUklORycsXG4gICdCT09MJyxcbiAgJ1U4JyxcbiAgJ0k4JyxcbiAgJ1UxNicsXG4gICdJMTYnLFxuICAnVTMyJyxcbiAgJ0kzMicsXG4gICdCSUcnLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJJRztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9vbENvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uQk9PTCB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQk9PTDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5TVFJJTkcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uPFQgPSBhbnksIFIgZXh0ZW5kcyBVaW50OEFycmF5fG51bWJlciA9IGFueT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBUO1xuICBmcm9tVGV4dCAodjogc3RyaW5nKTogVDtcbiAgZnJvbUJ5dGVzIChpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtULCBudW1iZXJdO1xuICBzZXJpYWxpemUgKCk6IG51bWJlcltdO1xuICBzZXJpYWxpemVSb3cgKHY6IGFueSk6IFIsXG4gIHRvU3RyaW5nICh2OiBzdHJpbmcpOiBhbnk7XG4gIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBiaXQ6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xuICByZWFkb25seSBvZmZzZXQ6IG51bWJlcnxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxzdHJpbmcsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLlNUUklORyA9IENPTFVNTi5TVFJJTkc7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLlNUUklOR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAzO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBpbmRleCwgbmFtZSwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNTdHJpbmdDb2x1bW4odHlwZSkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJyR7bmFtZX0gaXMgbm90IGEgc3RyaW5nIGNvbHVtbicpO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJ2ZvbycpICE9PSAnc3RyaW5nJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBzZWVtcyBvdmVycmlkZSBmb3IgJHtuYW1lfSBkb2VzIG5vdCByZXR1cm4gYSBzdHJpbmdgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCAodjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvL3JldHVybiB2ID8/ICdcIlwiJztcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2KTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLlNUUklORywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gc3RyaW5nVG9CeXRlcyh2KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzTnVtZXJpY0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBpcyBub3QgYSBudW1lcmljIGNvbHVtbmApO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ251bWJlcicpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICAgcmV0dXJuIHRoaXMub3ZlcnJpZGUgPyB0aGlzLm92ZXJyaWRlKHYpIDpcbiAgICAgIHYgPyBOdW1iZXIodikgfHwgMCA6IDA7XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBfOiBVaW50OEFycmF5LCB2aWV3OiBEYXRhVmlldyk6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDgoaSksIDFdO1xuICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MTYoaSwgdHJ1ZSksIDJdO1xuICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0VWludDMyKGksIHRydWUpLCA0XTtcbiAgICB9XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHRoaXMud2lkdGgpO1xuICAgIGZvciAobGV0IG8gPSAwOyBvIDwgdGhpcy53aWR0aDsgbysrKVxuICAgICAgYnl0ZXNbb10gPSAodiA+Pj4gKG8gKiA4KSkgJiAyNTU7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEJpZ0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48YmlnaW50LCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CSUcgPSBDT0xVTU4uQklHO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5CSUddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMjtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gbnVsbDtcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBiaWdpbnQ7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdiaWdpbnQnKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJpZ2ludCcpO1xuICAgIGlmICghaXNCaWdDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nKTogYmlnaW50IHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgcmV0dXJuIHRoaXMub3ZlcnJpZGUodik7XG4gICAgaWYgKCF2KSByZXR1cm4gMG47XG4gICAgcmV0dXJuIEJpZ0ludCh2KTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gICAgcmV0dXJuIGJ5dGVzVG9CaWdCb3koaSwgYnl0ZXMpO1xuICB9XG5cbiAgc2VyaWFsaXplICgpOiBudW1iZXJbXSB7XG4gICAgcmV0dXJuIFtDT0xVTU4uQklHLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAgIGlmICghdikgcmV0dXJuIG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKHYpO1xuICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIEJvb2xDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPGJvb2xlYW4sIG51bWJlcj4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uQk9PTCA9IENPTFVNTi5CT09MO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5CT09MXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcjtcbiAgcmVhZG9ubHkgYml0OiBudW1iZXI7XG4gIHJlYWRvbmx5IG9yZGVyID0gMTtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2Jvb2xlYW4nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJpZ2ludCcpO1xuICAgIGlmICghaXNCb29sQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCAodjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2Jvb2xlYW4sIG51bWJlcl0ge1xuICAgIHJldHVybiBbYnl0ZXNbaV0gPT09IHRoaXMuZmxhZywgMF07XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CT09MLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIHJldHVybiB2ID8gdGhpcy5mbGFnIDogMDtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHsgb3JkZXI6IG51bWJlciwgYml0OiBudW1iZXIgfCBudWxsLCBpbmRleDogbnVtYmVyIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbXBGaWVsZHMgKGE6IEZDb21wYXJhYmxlLCBiOiBGQ29tcGFyYWJsZSk6IG51bWJlciB7XG4gIHJldHVybiAoYS5vcmRlciAtIGIub3JkZXIpIHx8XG4gICAgKChhLmJpdCA/PyAwKSAtIChiLmJpdCA/PyAwKSkgfHxcbiAgICAoYS5pbmRleCAtIGIuaW5kZXgpO1xufVxuXG5leHBvcnQgdHlwZSBDb2x1bW4gPVxuICB8U3RyaW5nQ29sdW1uXG4gIHxOdW1lcmljQ29sdW1uXG4gIHxCaWdDb2x1bW5cbiAgfEJvb2xDb2x1bW5cbiAgO1xuXG5leHBvcnQgZnVuY3Rpb24gYXJnc0Zyb21UZXh0IChcbiAgbmFtZTogc3RyaW5nLFxuICBpOiBudW1iZXIsXG4gIGluZGV4OiBudW1iZXIsXG4gIGZsYWdzVXNlZDogbnVtYmVyLFxuICBkYXRhOiBzdHJpbmdbXVtdLFxuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueSxcbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGUsXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgICBvcmRlcjogOTk5LFxuICB9O1xuICBsZXQgaXNVc2VkID0gZmFsc2U7XG4gIC8vaWYgKGlzVXNlZCAhPT0gZmFsc2UpIGRlYnVnZ2VyO1xuICBmb3IgKGNvbnN0IHUgb2YgZGF0YSkge1xuICAgIGNvbnN0IHYgPSBmaWVsZC5vdmVycmlkZSA/IGZpZWxkLm92ZXJyaWRlKHVbaV0pIDogdVtpXTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpfToke25hbWV9IH4gJHt1WzBdfToke3VbMV19OiAke3Z9YClcbiAgICBpc1VzZWQgPSB0cnVlO1xuICAgIGNvbnN0IG4gPSBOdW1iZXIodik7XG4gICAgaWYgKE51bWJlci5pc05hTihuKSkge1xuICAgICAgLy8gbXVzdCBiZSBhIHN0cmluZ1xuICAgICAgZmllbGQudHlwZSA9IENPTFVNTi5TVFJJTkc7XG4gICAgICBmaWVsZC5vcmRlciA9IDM7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSkge1xuICAgICAgY29uc29sZS53YXJuKGBcXHgxYlszMW0ke2l9OiR7bmFtZX0gaGFzIGEgZmxvYXQ/IFwiJHt2fVwiICgke259KVxceDFiWzBtYCk7XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzU2FmZUludGVnZXIobikpIHtcbiAgICAgIC8vIHdlIHdpbGwgaGF2ZSB0byByZS1kbyB0aGlzIHBhcnQ6XG4gICAgICBmaWVsZC5taW5WYWx1ZSA9IC1JbmZpbml0eTtcbiAgICAgIGZpZWxkLm1heFZhbHVlID0gSW5maW5pdHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuIDwgZmllbGQubWluVmFsdWUpIGZpZWxkLm1pblZhbHVlID0gbjtcbiAgICAgIGlmIChuID4gZmllbGQubWF4VmFsdWUpIGZpZWxkLm1heFZhbHVlID0gbjtcbiAgICB9XG4gIH1cblxuICBpZiAoIWlzVXNlZCkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzFtJHtpfToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5vcmRlciA9IDE7XG4gICAgZmllbGQuYml0ID0gZmxhZ3NVc2VkO1xuICAgIGZpZWxkLmZsYWcgPSAxIDw8IGZpZWxkLmJpdCAlIDg7XG4gICAgcmV0dXJuIGZpZWxkO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1heFZhbHVlISA8IEluZmluaXR5KSB7XG4gICAgLy8gQHRzLWlnbm9yZSAtIHdlIHVzZSBpbmZpbml0eSB0byBtZWFuIFwibm90IGEgYmlnaW50XCJcbiAgICBjb25zdCB0eXBlID0gcmFuZ2VUb051bWVyaWNUeXBlKGZpZWxkLm1pblZhbHVlLCBmaWVsZC5tYXhWYWx1ZSk7XG4gICAgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgIGZpZWxkLm9yZGVyID0gMDtcbiAgICAgIGZpZWxkLnR5cGUgPSB0eXBlO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgZmllbGQub3JkZXIgPSAyO1xuICByZXR1cm4gZmllbGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlKSB7XG4gICAgY2FzZSBDT0xVTU4uVU5VU0VEOlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnVzZWQgZmllbGQgY2FudCBiZSB0dXJuZWQgaW50byBhIENvbHVtbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgIHJldHVybiBuZXcgU3RyaW5nQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiBuZXcgQmlnQ29sdW1uKGFyZ3MpO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG59IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB7IGJ5dGVzVG9TdHJpbmcsIHN0cmluZ1RvQnl0ZXMgfSBmcm9tICcuL3NlcmlhbGl6ZSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgdHlwZSBTY2hlbWFBcmdzID0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGNvbHVtbnM6IENvbHVtbltdLFxuICBmaWVsZHM6IHN0cmluZ1tdLFxuICBmbGFnc1VzZWQ6IG51bWJlcjtcbn1cblxudHlwZSBCbG9iUGFydCA9IGFueTsgLy8gPz8/Pz9cblxuZXhwb3J0IGNsYXNzIFNjaGVtYSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgY29sdW1uczogUmVhZG9ubHk8Q29sdW1uW10+O1xuICByZWFkb25seSBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPjtcbiAgcmVhZG9ubHkgY29sdW1uc0J5TmFtZTogUmVjb3JkPHN0cmluZywgQ29sdW1uPjtcbiAgcmVhZG9ubHkgZml4ZWRXaWR0aDogbnVtYmVyOyAvLyB0b3RhbCBieXRlcyB1c2VkIGJ5IG51bWJlcnMgKyBmbGFnc1xuICByZWFkb25seSBmbGFnRmllbGRzOiBudW1iZXI7XG4gIHJlYWRvbmx5IHN0cmluZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBiaWdGaWVsZHM6IG51bWJlcjtcbiAgY29uc3RydWN0b3IoeyBjb2x1bW5zLCBmaWVsZHMsIG5hbWUsIGZsYWdzVXNlZCB9OiBTY2hlbWFBcmdzKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmNvbHVtbnMgPSBbLi4uY29sdW1uc107XG4gICAgdGhpcy5maWVsZHMgPSBbLi4uZmllbGRzXTtcbiAgICB0aGlzLmNvbHVtbnNCeU5hbWUgPSBPYmplY3QuZnJvbUVudHJpZXModGhpcy5jb2x1bW5zLm1hcChjID0+IFtjLm5hbWUsIGNdKSk7XG4gICAgdGhpcy5mbGFnRmllbGRzID0gZmxhZ3NVc2VkO1xuICAgIHRoaXMuZml4ZWRXaWR0aCA9IGNvbHVtbnMucmVkdWNlKFxuICAgICAgKHcsIGMpID0+IHcgKyAoYy53aWR0aCA/PyAwKSxcbiAgICAgIE1hdGguY2VpbChmbGFnc1VzZWQgLyA4KSwgLy8gOCBmbGFncyBwZXIgYnl0ZSwgbmF0Y2hcbiAgICApO1xuXG4gICAgbGV0IG86IG51bWJlcnxudWxsID0gMDtcbiAgICBmb3IgKGNvbnN0IGMgb2YgY29sdW1ucykge1xuICAgICAgc3dpdGNoIChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgIGMub2Zmc2V0ID0gbztcbiAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCkgbysrO1xuICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICBjLm9mZnNldCA9IG87XG4gICAgICAgICBvICs9IGMud2lkdGg7XG4gICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zdHJpbmdGaWVsZHMgPSBjb2x1bW5zLmZpbHRlcihjID0+IGlzU3RyaW5nQ29sdW1uKGMudHlwZSkpLmxlbmd0aDtcbiAgICB0aGlzLmJpZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNCaWdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuXG4gIH1cblxuICBzdGF0aWMgZnJvbUJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IFNjaGVtYSB7XG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCByZWFkOiBudW1iZXI7XG4gICAgbGV0IG5hbWU6IHN0cmluZztcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgW25hbWUsIHJlYWRdID0gYnl0ZXNUb1N0cmluZyhpLCBieXRlcyk7XG4gICAgaSArPSByZWFkO1xuXG4gICAgY29uc3QgYXJncyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBjb2x1bW5zOiBbXSBhcyBDb2x1bW5bXSxcbiAgICAgIGZpZWxkczogW10gYXMgc3RyaW5nW10sXG4gICAgICBmbGFnc1VzZWQ6IDAsXG4gICAgfTtcblxuICAgIGNvbnN0IG51bUZpZWxkcyA9IGJ5dGVzW2krK10gfCAoYnl0ZXNbaSsrXSA8PCA4KTtcblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgLy8gVE9ETyAtIG9ubHkgd29ya3Mgd2hlbiAwLWZpZWxkIHNjaGVtYXMgYXJlbid0IGFsbG93ZWR+IVxuICAgIHdoaWxlIChpbmRleCA8IG51bUZpZWxkcykge1xuICAgICAgY29uc3QgdHlwZSA9IGJ5dGVzW2krK107XG4gICAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICAgIGNvbnN0IGYgPSB7IGluZGV4LCBuYW1lLCB0eXBlLCB3aWR0aDogbnVsbCwgYml0OiBudWxsLCBmbGFnOiBudWxsLCBvcmRlcjogOTk5IH07XG4gICAgICBpICs9IHJlYWQ7XG4gICAgICBsZXQgYzogQ29sdW1uO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICAgIGMgPSBuZXcgU3RyaW5nQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICAgIGMgPSBuZXcgQmlnQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBjb25zdCBiaXQgPSBhcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSAyICoqIChiaXQgJSA4KTtcbiAgICAgICAgICBjID0gbmV3IEJvb2xDb2x1bW4oeyAuLi5mLCBiaXQsIGZsYWcgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDIgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiA0IH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0eXBlICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICAgIGFyZ3MuY29sdW1ucy5wdXNoKGMpO1xuICAgICAgYXJncy5maWVsZHMucHVzaChjLm5hbWUpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTY2hlbWEoYXJncyk7XG4gIH1cblxuICByb3dGcm9tQnVmZmVyKFxuICAgICAgaTogbnVtYmVyLFxuICAgICAgYnVmZmVyOiBBcnJheUJ1ZmZlcixcbiAgICAgIF9fcm93SWQ6IG51bWJlclxuICApOiBbUm93LCBudW1iZXJdIHtcbiAgICBjb25zdCBkYnIgPSBfX3Jvd0lkIDwgNSB8fCBfX3Jvd0lkID4gMzk3NSB8fCBfX3Jvd0lkICUgMTAwMCA9PT0gMDtcbiAgICAvL2lmIChkYnIpIGNvbnNvbGUubG9nKGAgLSBST1cgJHtfX3Jvd0lkfSBGUk9NICR7aX0gKDB4JHtpLnRvU3RyaW5nKDE2KX0pYClcbiAgICBsZXQgdG90YWxSZWFkID0gMDtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICAgIGNvbnN0IHJvdzogUm93ID0geyBfX3Jvd0lkIH1cbiAgICBjb25zdCBsYXN0Qml0ID0gdGhpcy5mbGFnRmllbGRzIC0gMTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICBpZiAoYy5vZmZzZXQgIT09IG51bGwgJiYgYy5vZmZzZXQgIT09IHRvdGFsUmVhZCkgZGVidWdnZXI7XG4gICAgICBsZXQgW3YsIHJlYWRdID0gYy5mcm9tQnl0ZXMoaSwgYnl0ZXMsIHZpZXcpO1xuXG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTClcbiAgICAgICAgcmVhZCA9IChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgPyAxIDogMDtcblxuICAgICAgaSArPSByZWFkO1xuICAgICAgdG90YWxSZWFkICs9IHJlYWQ7XG4gICAgICByb3dbYy5uYW1lXSA9IHY7XG4gICAgfVxuICAgIC8vaWYgKGRicikge1xuICAgICAgLy9jb25zb2xlLmxvZyhgICAgUkVBRDogJHt0b3RhbFJlYWR9IFRPICR7aX0gLyAke2J1ZmZlci5ieXRlTGVuZ3RofVxcbmAsIHJvdywgJ1xcblxcbicpO1xuICAgICAgLy9kZWJ1Z2dlcjtcbiAgICAvL31cbiAgICByZXR1cm4gW3JvdywgdG90YWxSZWFkXTtcbiAgfVxuXG4gIHByaW50Um93IChyOiBSb3csIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+KSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhmaWVsZHMubWFwKGYgPT4gW2YsIHJbZl1dKSk7XG4gIH1cblxuICBzZXJpYWxpemVIZWFkZXIgKCk6IEJsb2Ige1xuICAgIC8vIFsuLi5uYW1lLCAwLCBudW1GaWVsZHMwLCBudW1GaWVsZHMxLCBmaWVsZDBUeXBlLCBmaWVsZDBGbGFnPywgLi4uZmllbGQwTmFtZSwgMCwgZXRjXTtcbiAgICAvLyBUT0RPIC0gQmFzZSB1bml0IGhhcyA1MDArIGZpZWxkc1xuICAgIGlmICh0aGlzLmNvbHVtbnMubGVuZ3RoID4gNjU1MzUpIHRocm93IG5ldyBFcnJvcignb2ggYnVkZHkuLi4nKTtcbiAgICBjb25zdCBwYXJ0cyA9IG5ldyBVaW50OEFycmF5KFtcbiAgICAgIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKSxcbiAgICAgIHRoaXMuY29sdW1ucy5sZW5ndGggJiAyNTUsXG4gICAgICAodGhpcy5jb2x1bW5zLmxlbmd0aCA+Pj4gOCksXG4gICAgICAuLi50aGlzLmNvbHVtbnMuZmxhdE1hcChjID0+IGMuc2VyaWFsaXplKCkpXG4gICAgXSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW3BhcnRzXSk7XG4gIH1cblxuICBzZXJpYWxpemVSb3cgKHI6IFJvdyk6IEJsb2Ige1xuICAgIGNvbnN0IGZpeGVkID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5maXhlZFdpZHRoKTtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgY29uc3QgYmxvYlBhcnRzOiBCbG9iUGFydFtdID0gW2ZpeGVkXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICBjb25zdCB2ID0gcltjLm5hbWVdLy8gYy5zZXJpYWxpemVSb3coIGFzIG5ldmVyKTsgLy8gbHVsXG4gICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkge31cbiAgICAgIHN3aXRjaChjLnR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOiB7XG4gICAgICAgICAgY29uc3QgYjogVWludDhBcnJheSA9IGMuc2VyaWFsaXplUm93KHYgYXMgc3RyaW5nKVxuICAgICAgICAgIGkgKz0gYi5sZW5ndGg7IC8vIGRlYnVnZ2luXG4gICAgICAgICAgYmxvYlBhcnRzLnB1c2goYik7XG4gICAgICAgIH0gYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzoge1xuICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIGJpZ2ludClcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICB9IGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgZml4ZWRbaV0gfD0gYy5zZXJpYWxpemVSb3codiBhcyBib29sZWFuKTtcbiAgICAgICAgICAvLyBkb250IG5lZWQgdG8gY2hlY2sgZm9yIHRoZSBsYXN0IGZsYWcgc2luY2Ugd2Ugbm8gbG9uZ2VyIG5lZWQgaVxuICAgICAgICAgIC8vIGFmdGVyIHdlJ3JlIGRvbmUgd2l0aCBudW1iZXJzIGFuZCBib29sZWFuc1xuICAgICAgICAgIC8vaWYgKGMuZmxhZyA9PT0gMTI4KSBpKys7XG4gICAgICAgICAgLy8gLi4uYnV0IHdlIHdpbGwgYmVjYXV5c2Ugd2UgYnJva2Ugc29tZXRoaWduXG4gICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSBsYXN0Qml0KSBpKys7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgY29uc3QgYnl0ZXMgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIG51bWJlcilcbiAgICAgICAgICBmaXhlZC5zZXQoYnl0ZXMsIGkpXG4gICAgICAgICAgaSArPSBjLndpZHRoO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd3YXQgdHlwZSBpcyB0aGlzJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9pZiAoci5fX3Jvd0lkIDwgNSB8fCByLl9fcm93SWQgPiAzOTc1IHx8IHIuX19yb3dJZCAlIDEwMDAgPT09IDApIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAtIFJPVyAke3IuX19yb3dJZH1gLCB7IGksIGJsb2JQYXJ0cywgciB9KTtcbiAgICAvL31cbiAgICByZXR1cm4gbmV3IEJsb2IoYmxvYlBhcnRzKTtcbiAgfVxuXG4gIHByaW50ICh3aWR0aCA9IDgwKTogdm9pZCB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDM2KTtcbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zdCB7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0gPSB0aGlzO1xuICAgIGNvbnNvbGUubG9nKHsgZml4ZWRXaWR0aCwgYmlnRmllbGRzLCBzdHJpbmdGaWVsZHMsIGZsYWdGaWVsZHMgfSk7XG4gICAgY29uc29sZS50YWJsZSh0aGlzLmNvbHVtbnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdsYWJlbCcsXG4gICAgICAnb2Zmc2V0JyxcbiAgICAgICdvcmRlcicsXG4gICAgICAnYml0JyxcbiAgICAgICd0eXBlJyxcbiAgICAgICdmbGFnJyxcbiAgICAgICd3aWR0aCcsXG4gICAgXSk7XG4gICAgY29uc29sZS5sb2codGFpbCk7XG5cbiAgfVxuXG4gIC8vIHJhd1RvUm93IChkOiBSYXdSb3cpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7fVxuICAvLyByYXdUb1N0cmluZyAoZDogUmF3Um93LCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7fVxufTtcblxuIiwgImltcG9ydCB7IFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5leHBvcnQgdHlwZSBSb3dEYXRhID0gc3RyaW5nW107XG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBib29sZWFufG51bWJlcnxzdHJpbmd8YmlnaW50PiAmIHsgX19yb3dJZDogbnVtYmVyIH07XG5cbmV4cG9ydCBjbGFzcyBUYWJsZSB7XG4gIGdldCBuYW1lICgpOiBzdHJpbmcgeyByZXR1cm4gYFtUQUJMRToke3RoaXMuc2NoZW1hLm5hbWV9XWA7IH1cbiAgY29uc3RydWN0b3IgKFxuICAgIHJlYWRvbmx5IHJvd3M6IFJvd1tdLFxuICAgIHJlYWRvbmx5IHNjaGVtYTogU2NoZW1hLFxuICApIHtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogW1VpbnQzMkFycmF5LCBCbG9iLCBCbG9iXSB7XG4gICAgLy8gW251bVJvd3MsIGhlYWRlclNpemUsIGRhdGFTaXplXSwgc2NoZW1hSGVhZGVyLCBbcm93MCwgcm93MSwgLi4uIHJvd05dO1xuICAgIGNvbnN0IHNjaGVtYUhlYWRlciA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZUhlYWRlcigpO1xuICAgIC8vIGNhbnQgZmlndXJlIG91dCBob3cgdG8gZG8gdGhpcyB3aXRoIGJpdHMgOic8XG4gICAgY29uc3Qgc2NoZW1hUGFkZGluZyA9ICg0IC0gc2NoZW1hSGVhZGVyLnNpemUgJSA0KSAlIDQ7XG4gICAgY29uc3Qgcm93RGF0YSA9IHRoaXMucm93cy5mbGF0TWFwKHIgPT4gdGhpcy5zY2hlbWEuc2VyaWFsaXplUm93KHIpKTtcbiAgICAvL2NvbnN0IHJvd0RhdGEgPSB0aGlzLnJvd3MuZmxhdE1hcChyID0+IHtcbiAgICAgIC8vY29uc3Qgcm93QmxvYiA9IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZVJvdyhyKVxuICAgICAgLy9pZiAoci5fX3Jvd0lkID09PSAwKVxuICAgICAgICAvL3Jvd0Jsb2IuYXJyYXlCdWZmZXIoKS50aGVuKGFiID0+IHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKGBBUlJBWSBCVUZGRVIgRk9SIEZJUlNUIFJPVyBPRiAke3RoaXMubmFtZX1gLCBuZXcgVWludDhBcnJheShhYikuam9pbignLCAnKSk7XG4gICAgICAgIC8vfSk7XG4gICAgICAvL3JldHVybiByb3dCbG9iO1xuICAgIC8vfSk7XG4gICAgY29uc3Qgcm93QmxvYiA9IG5ldyBCbG9iKHJvd0RhdGEpXG4gICAgY29uc3QgZGF0YVBhZGRpbmcgPSAoNCAtIHJvd0Jsb2Iuc2l6ZSAlIDQpICUgNDtcblxuICAgIHJldHVybiBbXG4gICAgICBuZXcgVWludDMyQXJyYXkoW1xuICAgICAgICB0aGlzLnJvd3MubGVuZ3RoLFxuICAgICAgICBzY2hlbWFIZWFkZXIuc2l6ZSArIHNjaGVtYVBhZGRpbmcsXG4gICAgICAgIHJvd0Jsb2Iuc2l6ZSArIGRhdGFQYWRkaW5nXG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgc2NoZW1hSGVhZGVyLFxuICAgICAgICBuZXcgQXJyYXlCdWZmZXIoc2NoZW1hUGFkZGluZykgYXMgYW55IC8vID8/P1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHJvd0Jsb2IsXG4gICAgICAgIG5ldyBVaW50OEFycmF5KGRhdGFQYWRkaW5nKVxuICAgICAgXSksXG4gICAgXTtcbiAgfVxuXG4gIHN0YXRpYyBjb25jYXRUYWJsZXMgKHRhYmxlczogVGFibGVbXSk6IEJsb2Ige1xuICAgIGNvbnN0IGFsbFNpemVzID0gbmV3IFVpbnQzMkFycmF5KDEgKyB0YWJsZXMubGVuZ3RoICogMyk7XG4gICAgY29uc3QgYWxsSGVhZGVyczogQmxvYltdID0gW107XG4gICAgY29uc3QgYWxsRGF0YTogQmxvYltdID0gW107XG5cbiAgICBjb25zdCBibG9icyA9IHRhYmxlcy5tYXAodCA9PiB0LnNlcmlhbGl6ZSgpKTtcbiAgICBhbGxTaXplc1swXSA9IGJsb2JzLmxlbmd0aDtcbiAgICBmb3IgKGNvbnN0IFtpLCBbc2l6ZXMsIGhlYWRlcnMsIGRhdGFdXSBvZiBibG9icy5lbnRyaWVzKCkpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYE9VVCBCTE9CUyBGT1IgVD0ke2l9YCwgc2l6ZXMsIGhlYWRlcnMsIGRhdGEpXG4gICAgICBhbGxTaXplcy5zZXQoc2l6ZXMsIDEgKyBpICogMyk7XG4gICAgICBhbGxIZWFkZXJzLnB1c2goaGVhZGVycyk7XG4gICAgICBhbGxEYXRhLnB1c2goZGF0YSk7XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coeyB0YWJsZXMsIGJsb2JzLCBhbGxTaXplcywgYWxsSGVhZGVycywgYWxsRGF0YSB9KVxuICAgIHJldHVybiBuZXcgQmxvYihbYWxsU2l6ZXMsIC4uLmFsbEhlYWRlcnMsIC4uLmFsbERhdGFdKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBvcGVuQmxvYiAoYmxvYjogQmxvYik6IFByb21pc2U8UmVjb3JkPHN0cmluZywgVGFibGU+PiB7XG4gICAgaWYgKGJsb2Iuc2l6ZSAlIDQgIT09IDApIHRocm93IG5ldyBFcnJvcignd29ua3kgYmxvYiBzaXplJyk7XG4gICAgY29uc3QgbnVtVGFibGVzID0gbmV3IFVpbnQzMkFycmF5KGF3YWl0IGJsb2Iuc2xpY2UoMCwgNCkuYXJyYXlCdWZmZXIoKSlbMF07XG5cbiAgICAvLyBvdmVyYWxsIGJ5dGUgb2Zmc2V0XG4gICAgbGV0IGJvID0gNDtcbiAgICBjb25zdCBzaXplcyA9IG5ldyBVaW50MzJBcnJheShcbiAgICAgIGF3YWl0IGJsb2Iuc2xpY2UoYm8sIGJvICs9IG51bVRhYmxlcyAqIDEyKS5hcnJheUJ1ZmZlcigpXG4gICAgKTtcblxuICAgIGNvbnN0IHRCbG9iczogVGFibGVCbG9iW10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpKyspIHtcbiAgICAgIGNvbnN0IHNpID0gaSAqIDM7XG4gICAgICBjb25zdCBudW1Sb3dzID0gc2l6ZXNbc2ldO1xuICAgICAgY29uc3QgaFNpemUgPSBzaXplc1tzaSArIDFdO1xuICAgICAgdEJsb2JzW2ldID0geyBudW1Sb3dzLCBoZWFkZXJCbG9iOiBibG9iLnNsaWNlKGJvLCBibyArPSBoU2l6ZSkgfSBhcyBhbnk7XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVGFibGVzOyBpKyspIHtcbiAgICAgIHRCbG9ic1tpXS5kYXRhQmxvYiA9IGJsb2Iuc2xpY2UoYm8sIGJvICs9IHNpemVzW2kgKiAzICsgMl0pO1xuICAgIH07XG4gICAgY29uc3QgdGFibGVzID0gYXdhaXQgUHJvbWlzZS5hbGwodEJsb2JzLm1hcCgodGIsIGkpID0+IHtcbiAgICAgIC8vY29uc29sZS5sb2coYElOIEJMT0JTIEZPUiBUPSR7aX1gLCB0YilcbiAgICAgIHJldHVybiB0aGlzLmZyb21CbG9iKHRiKTtcbiAgICB9KSlcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHRhYmxlcy5tYXAodCA9PiBbdC5zY2hlbWEubmFtZSwgdF0pKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmcm9tQmxvYiAoe1xuICAgIGhlYWRlckJsb2IsXG4gICAgZGF0YUJsb2IsXG4gICAgbnVtUm93cyxcbiAgfTogVGFibGVCbG9iKTogUHJvbWlzZTxUYWJsZT4ge1xuICAgIGNvbnN0IHNjaGVtYSA9IFNjaGVtYS5mcm9tQnVmZmVyKGF3YWl0IGhlYWRlckJsb2IuYXJyYXlCdWZmZXIoKSk7XG4gICAgbGV0IHJibyA9IDA7XG4gICAgbGV0IF9fcm93SWQgPSAwO1xuICAgIGNvbnN0IHJvd3M6IFJvd1tdID0gW107XG4gICAgLy8gVE9ETyAtIGNvdWxkIGRlZmluaXRlbHkgdXNlIGEgc3RyZWFtIGZvciB0aGlzXG4gICAgY29uc3QgZGF0YUJ1ZmZlciA9IGF3YWl0IGRhdGFCbG9iLmFycmF5QnVmZmVyKCk7XG4gICAgY29uc29sZS5sb2coYD09PT09IFJFQUQgJHtudW1Sb3dzfSBPRiAke3NjaGVtYS5uYW1lfSA9PT09PWApXG4gICAgd2hpbGUgKF9fcm93SWQgPCBudW1Sb3dzKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgICAgcmJvICs9IHJlYWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBUYWJsZShyb3dzLCBzY2hlbWEpO1xuICB9XG5cblxuICBwcmludCAoXG4gICAgd2lkdGg6IG51bWJlciA9IDgwLFxuICAgIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+fG51bGwgPSBudWxsLFxuICAgIG46IG51bWJlcnxudWxsID0gbnVsbCxcbiAgICBtOiBudW1iZXJ8bnVsbCA9IG51bGxcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgW2hlYWQsIHRhaWxdID0gdGFibGVEZWNvKHRoaXMubmFtZSwgd2lkdGgsIDE4KTtcbiAgICBjb25zdCByb3dzID0gbiA9PT0gbnVsbCA/IHRoaXMucm93cyA6XG4gICAgICBtID09PSBudWxsID8gdGhpcy5yb3dzLnNsaWNlKDAsIG4pIDpcbiAgICAgIHRoaXMucm93cy5zbGljZShuLCBtKTtcblxuICAgIGNvbnN0IFtwUm93cywgcEZpZWxkc10gPSBmaWVsZHMgP1xuICAgICAgW3Jvd3MubWFwKChyOiBSb3cpID0+IHRoaXMuc2NoZW1hLnByaW50Um93KHIsIGZpZWxkcykpLCBmaWVsZHNdOlxuICAgICAgW3Jvd3MsIHRoaXMuc2NoZW1hLmZpZWxkc11cbiAgICAgIDtcblxuICAgIGNvbnNvbGUubG9nKGhlYWQpO1xuICAgIGNvbnNvbGUudGFibGUocFJvd3MsIHBGaWVsZHMpO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuICB9XG4gIC8qXG4gIHJhd1RvUm93IChkOiBzdHJpbmdbXSk6IFJvdyB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0aGlzLnNjaGVtYS5jb2x1bW5zLm1hcChyID0+IFtcbiAgICAgIHIubmFtZSxcbiAgICAgIHIudG9WYWwoZFtyLmluZGV4XSlcbiAgICBdKSk7XG4gIH1cbiAgcmF3VG9TdHJpbmcgKGQ6IHN0cmluZ1tdLCAuLi5hcmdzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgLy8ganVzdCBhc3N1bWUgZmlyc3QgdHdvIGZpZWxkcyBhcmUgYWx3YXlzIGlkLCBuYW1lLiBldmVuIGlmIHRoYXQncyBub3QgdHJ1ZVxuICAgIC8vIHRoaXMgaXMganVzdCBmb3IgdmlzdWFsaXphdGlvbiBwdXJwb3JzZXNcbiAgICBsZXQgZXh0cmEgPSAnJztcbiAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHM6IHN0cmluZ1tdID0gW107XG4gICAgICBjb25zdCBlID0gdGhpcy5yYXdUb1JvdyhkKTtcbiAgICAgIGZvciAoY29uc3QgYSBvZiBhcmdzKSB7XG4gICAgICAgIC8vIGRvbid0IHJlcHJpbnQgbmFtZSBvciBpZFxuICAgICAgICBpZiAoYSA9PT0gdGhpcy5zY2hlbWEuZmllbGRzWzBdIHx8IGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1sxXSlcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKGVbYV0gIT0gbnVsbClcbiAgICAgICAgICBzLnB1c2goYCR7YX06ICR7SlNPTi5zdHJpbmdpZnkoZVthXSl9YClcbiAgICAgIH1cbiAgICAgIGV4dHJhID0gcy5sZW5ndGggPiAwID8gYCB7ICR7cy5qb2luKCcsICcpfSB9YCA6ICd7fSc7XG4gICAgfVxuICAgIHJldHVybiBgPCR7dGhpcy5zY2hlbWEubmFtZX06JHtkWzBdID8/ICc/J30gXCIke2RbMV19XCIke2V4dHJhfT5gO1xuICB9XG4gICovXG59XG50eXBlIFRhYmxlQmxvYiA9IHsgbnVtUm93czogbnVtYmVyLCBoZWFkZXJCbG9iOiBCbG9iLCBkYXRhQmxvYjogQmxvYiB9O1xuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IHBhcnNlQWxsLCByZWFkQ1NWIH0gZnJvbSAnLi9wYXJzZS1jc3YnO1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgeyB3cml0ZUZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcblxuY29uc3Qgd2lkdGggPSBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zO1xuY29uc3QgW2ZpbGUsIC4uLmZpZWxkc10gPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIHtcbiAgY29uc3QgZGVmID0gY3N2RGVmc1tmaWxlXTtcbiAgaWYgKGRlZikgZ2V0RFVNUFkoYXdhaXQgcmVhZENTVihmaWxlLCBkZWYpKTtcbn0gZWxzZSB7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLmJpbidcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXModGFibGVzKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGRlc3QsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gIGNvbnNvbGUubG9nKGB3cm90ZSAke2Jsb2Iuc2l6ZX0gYnl0ZXMgdG8gJHtkZXN0fWApO1xufVxuXG4vKlxuaWYgKGZpbGUpIHtcbiAgY29uc3QgZGVmID0gY3N2RGVmc1tmaWxlXTtcbiAgaWYgKGRlZikgZ2V0RFVNUFkoYXdhaXQgcmVhZENTVihmaWxlLCBkZWYpKTtcbiAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYG5vIGRlZiBmb3IgXCIke2ZpbGV9XCJgKTtcbn0gZWxzZSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICBmb3IgKGNvbnN0IHQgb2YgdGFibGVzKSBhd2FpdCBnZXREVU1QWSh0KTtcbn1cbiovXG5cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RFVNUFkodDogVGFibGUpIHtcbiAgY29uc3QgbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0LnJvd3MubGVuZ3RoIC0gMzApKTtcbiAgY29uc3QgbSA9IG4gKyAzMDtcbiAgY29uc3QgZiA9IHQuc2NoZW1hLmZpZWxkcy5zbGljZSgwLCA4KTtcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyhbdF0pO1xuICBjb25zb2xlLmxvZygnXFxuXFxuICAgICAgIEJFRk9SRTonKTtcbiAgdC5wcmludCh3aWR0aCwgZiwgbiwgbSk7XG4gIC8vdC5wcmludCh3aWR0aCwgbnVsbCwgMTApO1xuICAvL3Quc2NoZW1hLnByaW50KCk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4nKVxuICBjb25zdCB1ID0gYXdhaXQgVGFibGUub3BlbkJsb2IoYmxvYik7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4gICAgICAgIEFGVEVSOicpO1xuICAvL3UuVW5pdC5wcmludCh3aWR0aCwgbnVsbCwgMTApO1xuICBPYmplY3QudmFsdWVzKHUpWzBdPy5wcmludCh3aWR0aCwgZiwgbiwgbSk7XG4gIC8vdS5Vbml0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIC8vYXdhaXQgd3JpdGVGaWxlKCcuL3RtcC5iaW4nLCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNPLElBQU0sVUFBdUQ7QUFBQSxFQUNsRSw0QkFBNEI7QUFBQSxJQUMxQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxJQUM3QixXQUFXO0FBQUE7QUFBQSxNQUVULFdBQVcsQ0FBQyxNQUFPLE9BQU8sQ0FBQyxJQUFJLE1BQU87QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLDRCQUE0QjtBQUFBLElBQzFCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFFQSxpQ0FBaUM7QUFBQSxJQUMvQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsZ0NBQWdDO0FBQUEsSUFDOUIsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGtDQUFrQztBQUFBLElBQ2hDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztB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SyxJQUFJLElBQUk7QUFDL0IsZUFBVyxLQUFLO0FBQ2QsV0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLElBQUksSUFBSSxJQUFJLFNBQVMsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUM7QUFBQSxFQUN6RTtBQUVBLFNBQU8sSUFBSSxNQUFNLE1BQU0sSUFBSSxPQUFPLFVBQVUsQ0FBQztBQUMvQztBQUVBLGVBQXNCLFNBQVMsTUFBbUQ7QUFDaEYsU0FBTyxRQUFRO0FBQUEsSUFDYixPQUFPLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTSxPQUFPLENBQUM7QUFBQSxFQUN0RTtBQUNGOzs7QU03SEEsT0FBTyxhQUFhO0FBRXBCLFNBQVMsaUJBQWlCO0FBRTFCLElBQU0sUUFBUSxRQUFRLE9BQU87QUFDN0IsSUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksUUFBUSxLQUFLLE1BQU0sQ0FBQztBQUU5QyxRQUFRLElBQUksUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRXBDLElBQUksTUFBTTtBQUNSLFFBQU0sTUFBTSxRQUFRLElBQUk7QUFDeEIsTUFBSTtBQUFLLGFBQVMsTUFBTSxRQUFRLE1BQU0sR0FBRyxDQUFDO0FBQzVDLE9BQU87QUFDTCxRQUFNLE9BQU87QUFDYixRQUFNLFNBQVMsTUFBTSxTQUFTLE9BQU87QUFDckMsUUFBTSxPQUFPLE1BQU0sYUFBYSxNQUFNO0FBQ3RDLFFBQU0sVUFBVSxNQUFNLEtBQUssT0FBTyxHQUFHLEVBQUUsVUFBVSxLQUFLLENBQUM7QUFDdkQsVUFBUSxJQUFJLFNBQVMsS0FBSyxJQUFJLGFBQWEsSUFBSSxFQUFFO0FBQ25EO0FBY0EsZUFBZSxTQUFTLEdBQVU7QUFDaEMsUUFBTSxJQUFJLEtBQUssTUFBTSxLQUFLLE9BQU8sS0FBSyxFQUFFLEtBQUssU0FBUyxHQUFHO0FBQ3pELFFBQU0sSUFBSSxJQUFJO0FBQ2QsUUFBTSxJQUFJLEVBQUUsT0FBTyxPQUFPLE1BQU0sR0FBRyxDQUFDO0FBQ3BDLFFBQU0sT0FBTyxNQUFNLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDbkMsVUFBUSxJQUFJLG9CQUFvQjtBQUNoQyxJQUFFLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUd0QixVQUFRLElBQUksTUFBTTtBQUNsQixRQUFNLElBQUksTUFBTSxNQUFNLFNBQVMsSUFBSTtBQUNuQyxVQUFRLElBQUksb0JBQW9CO0FBRWhDLFNBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUczQzsiLAogICJuYW1lcyI6IFsiaSIsICJ3aWR0aCIsICJmaWVsZHMiLCAid2lkdGgiLCAid2lkdGgiLCAiZmllbGRzIiwgImluZGV4Il0KfQo=
