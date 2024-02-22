// src/cli/csv-defs.ts
var csvDefs = {
  "../../gamedata/BaseU.csv": {
    name: "Unit",
    ignoreFields: /* @__PURE__ */ new Set(["end"]),
    knownFields: {},
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
    const { index, name, type, override, isArray } = field;
    if (!isStringColumn(type))
      throw new Error("${name} is not a string column");
    this.index = index;
    this.name = name;
    this.override = override;
  }
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
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
    this.index = index;
    this.name = name;
    this.type = type;
    this.label = COLUMN_LABEL[this.type];
    this.width = COLUMN_WIDTH[this.type];
    this.override = override;
  }
  fromText(v, u, a) {
    return this.override ? this.override(v, u, a) : v ? Number(v) || 0 : 0;
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
    if (!isBigColumn(type))
      throw new Error(`${type} is not big`);
    this.index = index;
    this.name = name;
    this.override = override;
  }
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
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
  fromText(v, u, a) {
    if (this.override)
      return this.override(v, u, a);
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
function argsFromText(name, index, flagsUsed, data, override, schemaArgs) {
  const field = {
    index,
    name,
    override,
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
    field.bit = flagsUsed;
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
    this.columns = [...columns].sort(cmpFields);
    this.fields = this.columns.map((c) => c.name);
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
      flagsUsed: 0,
      rawFields: {}
      // none :<
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
        order: 999,
        isArray: false
      };
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
  knownFields: {},
  extraFields: {},
  separator: "	"
  // surprise!
};
function csvToTable(raw, options) {
  const _opts = { ...DEFAULT_OPTIONS, ...options };
  const schemaArgs = {
    name: _opts.name ?? `Schema_${_nextAnonSchemaId++}`,
    flagsUsed: 0,
    columns: [],
    fields: [],
    rawFields: {}
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
  const rawColumns = [];
  for (const [index, name] of rawFields.entries()) {
    schemaArgs.rawFields[name] = index;
    if (_opts.ignoreFields?.has(name))
      continue;
    if (_opts.knownFields[name])
      try {
        const c = argsFromText(
          name,
          index,
          schemaArgs.flagsUsed,
          rawData,
          _opts.overrides[name],
          schemaArgs
        );
        if (c !== null) {
          if (c.type === 2 /* BOOL */)
            schemaArgs.flagsUsed++;
          rawColumns.push(c);
        }
      } catch (ex) {
        console.error(
          `GOOB INTERCEPTED IN ${schemaArgs.name}: \x1B[31m${index}:${name}\x1B[0m`,
          ex
        );
        throw ex;
      }
  }
  if (options?.extraFields) {
    for (const [name, getField] of Object.entries(options.extraFields)) {
      rawColumns.push(getField(name, schemaArgs));
    }
  }
  const data = new Array(rawData.length).fill(null).map((_, __rowId) => ({ __rowId }));
  for (const colArgs of rawColumns) {
    const col = fromArgs(colArgs);
    schemaArgs.columns.push(col);
    schemaArgs.fields.push(col.name);
  }
  for (const col of schemaArgs.columns) {
    for (const r of data)
      data[r.__rowId][col.name] = col.fromText(
        rawData[r.__rowId][col.index],
        r,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NsaS9jc3YtZGVmcy50cyIsICIuLi9zcmMvY2xpL3BhcnNlLWNzdi50cyIsICIuLi8uLi9saWIvc3JjL3NlcmlhbGl6ZS50cyIsICIuLi8uLi9saWIvc3JjL2NvbHVtbi50cyIsICIuLi8uLi9saWIvc3JjL3V0aWwudHMiLCAiLi4vLi4vbGliL3NyYy9zY2hlbWEudHMiLCAiLi4vLi4vbGliL3NyYy90YWJsZS50cyIsICIuLi9zcmMvY2xpL2R1bXAtY3N2cy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBQYXJzZVNjaGVtYU9wdGlvbnMgfSBmcm9tICcuL3BhcnNlLWNzdidcbmV4cG9ydCBjb25zdCBjc3ZEZWZzOiBSZWNvcmQ8c3RyaW5nLCBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4+ID0ge1xuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZVUuY3N2Jzoge1xuICAgIG5hbWU6ICdVbml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gICAga25vd25GaWVsZHM6IHt9LFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICB9LFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvQmFzZUkuY3N2Jzoge1xuICAgIG5hbWU6ICdJdGVtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG5cbiAgJy4uLy4uL2dhbWVkYXRhL01hZ2ljU2l0ZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdNYWdpY1NpdGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL01lcmNlbmFyeS5jc3YnOiB7XG4gICAgbmFtZTogJ01lcmNlbmFyeScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYWZmbGljdGlvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdBZmZsaWN0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYW5vbl9wcm92aW5jZV9ldmVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdBbm9uUHJvdmluY2VFdmVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2FybW9ycy5jc3YnOiB7XG4gICAgbmFtZTogJ0FybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVfa2V5cy5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUtleScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeUFybW9yJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3NwZWxsLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV93ZWFwb24uY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVdlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMV90eXBlcy5jc3YnOiB7XG4gICAgLy8gVE9ETyAtIGdvdCBzb21lIGJpZyBib2lzIGluIGhlcmUuXG4gICAgbmFtZTogJ0J1ZmZCaXQxJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYnVmZnNfMl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ0J1ZmZCaXQyJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvY29hc3RfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdDb2FzdFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RfbW9kaWZpZXJfYml0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWxsQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19pbmZvLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxFZmZlY3RJbmZvJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c19zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZWZmZWN0c193ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnRWZmZWN0V2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lbmNoYW50bWVudHMuY3N2Jzoge1xuICAgIG5hbWU6ICdFbmNoYW50bWVudCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2V2ZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0V2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X2xlYWRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdGb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9mb3J0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRUcm9vcFR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbWFnaWNfcGF0aHMuY3N2Jzoge1xuICAgIG5hbWU6ICdNYWdpY1BhdGgnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYXBfdGVycmFpbl90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5UeXBlQml0JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbW9uc3Rlcl90YWdzLmNzdic6IHtcbiAgICBuYW1lOiAnTW9uc3RlclRhZycsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hbWV0eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ05hbWVUeXBlJyxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25hdGlvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ05vbkZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL25vbmZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvb3RoZXJfcGxhbmVzLmNzdic6IHtcbiAgICBuYW1lOiAnT3RoZXJQbGFuZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3ByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdQcmV0ZW5kZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3Byb3RlY3Rpb25zX2J5X2FybW9yLmNzdic6IHtcbiAgICBuYW1lOiAnUHJvdGVjdGlvbkJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3JlYWxtcy5jc3YnOiB7XG4gICAgbmFtZTogJ1JlYWxtJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc2l0ZV90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnU2l0ZVRlcnJhaW5UeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF9kYW1hZ2VfdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsRGFtYWdlVHlwZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3NwZWNpYWxfdW5pcXVlX3N1bW1vbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVjaWFsVW5pcXVlU3VtbW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlbGxzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGwnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3RlcnJhaW5fc3BlY2lmaWNfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1RlcnJhaW5TcGVjaWZpY1N1bW1vbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VuaXRfZWZmZWN0cy5jc3YnOiB7XG4gICAgbmFtZTogJ1VuaXRFZmZlY3QnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS91bnByZXRlbmRlcl90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdVbnByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvd2VhcG9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1dlYXBvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJywgJ3dlYXBvbiddKSxcbiAgfSxcbn07XG4iLCAiaW1wb3J0IHR5cGUgeyBTY2hlbWFBcmdzLCBSb3cgfSBmcm9tICdkb202aW5zcGVjdG9yLW5leHQtbGliJztcblxuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7XG4gIFNjaGVtYSxcbiAgVGFibGUsXG4gIENPTFVNTixcbiAgY21wRmllbGRzLFxuICBhcmdzRnJvbVRleHQsXG4gIENvbHVtbkFyZ3MsXG4gIGZyb21BcmdzXG59IGZyb20gJ2RvbTZpbnNwZWN0b3ItbmV4dC1saWInO1xuXG5sZXQgX25leHRBbm9uU2NoZW1hSWQgPSAxO1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRDU1YgKFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM/OiBQYXJ0aWFsPFBhcnNlU2NoZW1hT3B0aW9ucz4sXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lPzogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM6IFNldDxzdHJpbmc+O1xuICBzZXBhcmF0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGVzOiBSZWNvcmQ8c3RyaW5nLCAodjogYW55KSA9PiBhbnk+O1xuICBrbm93bkZpZWxkczogUmVjb3JkPHN0cmluZywgT21pdDxDb2x1bW5BcmdzLCAnaW5kZXgnPj4sXG4gIGV4dHJhRmllbGRzOiBSZWNvcmQ8c3RyaW5nLCAobmFtZTogc3RyaW5nLCBhOiBTY2hlbWFBcmdzKSA9PiBDb2x1bW5BcmdzPixcbn1cblxuY29uc3QgREVGQVVMVF9PUFRJT05TOiBQYXJzZVNjaGVtYU9wdGlvbnMgPSB7XG4gIGlnbm9yZUZpZWxkczogbmV3IFNldCgpLFxuICBvdmVycmlkZXM6IHt9LFxuICBrbm93bkZpZWxkczoge30sXG4gIGV4dHJhRmllbGRzOiB7fSxcbiAgc2VwYXJhdG9yOiAnXFx0JywgLy8gc3VycHJpc2UhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3ZUb1RhYmxlKFxuICByYXc6IHN0cmluZyxcbiAgb3B0aW9ucz86IFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPlxuKTogVGFibGUge1xuICBjb25zdCBfb3B0cyA9IHsgLi4uREVGQVVMVF9PUFRJT05TLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3MgPSB7XG4gICAgbmFtZTogX29wdHMubmFtZSA/PyBgU2NoZW1hXyR7X25leHRBbm9uU2NoZW1hSWQrK31gLFxuICAgIGZsYWdzVXNlZDogMCxcbiAgICBjb2x1bW5zOiBbXSxcbiAgICBmaWVsZHM6IFtdLFxuICAgIHJhd0ZpZWxkczoge30sXG4gIH07XG5cbiAgaWYgKHJhdy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHRocm93IG5ldyBFcnJvcigndWggb2gnKVxuXG4gIGNvbnN0IFtyYXdGaWVsZHMsIC4uLnJhd0RhdGFdID0gcmF3XG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcbiAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdChfb3B0cy5zZXBhcmF0b3IpKTtcblxuICBjb25zdCBoQ291bnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPjtcbiAgZm9yIChjb25zdCBbaSwgZl0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmICghZikgdGhyb3cgbmV3IEVycm9yKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IGlzIGFuIGVtcHR5IGZpZWxkIG5hbWVgKTtcbiAgICBpZiAoaENvdW50LmhhcyhmKSkge1xuICAgICAgY29uc29sZS53YXJuKGAke3NjaGVtYUFyZ3MubmFtZX0gQCAke2l9IFwiJHtmfVwiIGlzIGEgZHVwbGljYXRlIGZpZWxkIG5hbWVgKTtcbiAgICAgIGNvbnN0IG4gPSBoQ291bnQuZ2V0KGYpIVxuICAgICAgcmF3RmllbGRzW2ldID0gYCR7Zn0uJHtufWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhDb3VudC5zZXQoZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmF3Q29sdW1uczogQ29sdW1uQXJnc1tdID0gW107XG5cbiAgZm9yIChjb25zdCBbaW5kZXgsIG5hbWVdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBzY2hlbWFBcmdzLnJhd0ZpZWxkc1tuYW1lXSA9IGluZGV4O1xuICAgIGlmIChfb3B0cy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgaWYgKF9vcHRzLmtub3duRmllbGRzW25hbWVdKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjID0gYXJnc0Zyb21UZXh0KFxuICAgICAgICBuYW1lLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgc2NoZW1hQXJncy5mbGFnc1VzZWQsXG4gICAgICAgIHJhd0RhdGEsXG4gICAgICAgIF9vcHRzLm92ZXJyaWRlc1tuYW1lXSxcbiAgICAgICAgc2NoZW1hQXJncyxcbiAgICAgICk7XG4gICAgICBpZiAoYyAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoYy50eXBlID09PSBDT0xVTU4uQk9PTCkgc2NoZW1hQXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgcmF3Q29sdW1ucy5wdXNoKGMpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICBgR09PQiBJTlRFUkNFUFRFRCBJTiAke3NjaGVtYUFyZ3MubmFtZX06IFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX1cXHgxYlswbWAsXG4gICAgICAgICAgZXhcbiAgICAgICk7XG4gICAgICB0aHJvdyBleFxuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRpb25zPy5leHRyYUZpZWxkcykge1xuICAgIGZvciAoY29uc3QgW25hbWUsIGdldEZpZWxkXSBvZiBPYmplY3QuZW50cmllcyhvcHRpb25zLmV4dHJhRmllbGRzKSkge1xuICAgICAgcmF3Q29sdW1ucy5wdXNoKGdldEZpZWxkKG5hbWUsIHNjaGVtYUFyZ3MpKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkYXRhOiBSb3dbXSA9IG5ldyBBcnJheShyYXdEYXRhLmxlbmd0aClcbiAgICAuZmlsbChudWxsKVxuICAgIC5tYXAoKF8sIF9fcm93SWQpID0+ICh7IF9fcm93SWQgfSkpXG4gICAgO1xuXG4gIGZvciAoY29uc3QgY29sQXJncyBvZiByYXdDb2x1bW5zKSB7XG4gICAgY29uc3QgY29sID0gZnJvbUFyZ3MoY29sQXJncyk7XG4gICAgc2NoZW1hQXJncy5jb2x1bW5zLnB1c2goY29sKTtcbiAgICBzY2hlbWFBcmdzLmZpZWxkcy5wdXNoKGNvbC5uYW1lKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgY29sIG9mIHNjaGVtYUFyZ3MuY29sdW1ucykge1xuICAgIGZvciAoY29uc3QgciBvZiBkYXRhKVxuICAgICAgZGF0YVtyLl9fcm93SWRdW2NvbC5uYW1lXSA9IGNvbC5mcm9tVGV4dChcbiAgICAgICAgcmF3RGF0YVtyLl9fcm93SWRdW2NvbC5pbmRleF0sXG4gICAgICAgIHIsXG4gICAgICAgIHNjaGVtYUFyZ3MsXG4gICAgICApO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBUYWJsZShkYXRhLCBuZXcgU2NoZW1hKHNjaGVtYUFyZ3MpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnRpYWw8UGFyc2VTY2hlbWFPcHRpb25zPj4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImNvbnN0IF9fdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbmNvbnN0IF9fdGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZyk6IFVpbnQ4QXJyYXk7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0OiBVaW50OEFycmF5LCBpOiBudW1iZXIpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9CeXRlcyAoczogc3RyaW5nLCBkZXN0PzogVWludDhBcnJheSwgaSA9IDApIHtcbiAgaWYgKHMuaW5kZXhPZignXFwwJykgIT09IC0xKSB7XG4gICAgY29uc3QgaSA9IHMuaW5kZXhPZignXFwwJyk7XG4gICAgY29uc29sZS5lcnJvcihgJHtpfSA9IE5VTEwgPyBcIi4uLiR7cy5zbGljZShpIC0gMTAsIGkgKyAxMCl9Li4uYCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd3aG9vcHNpZScpO1xuICB9XG4gIGNvbnN0IGJ5dGVzID0gX190ZXh0RW5jb2Rlci5lbmNvZGUocyArICdcXDAnKTtcbiAgaWYgKGRlc3QpIHtcbiAgICBkZXN0LnNldChieXRlcywgaSk7XG4gICAgcmV0dXJuIGJ5dGVzLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9TdHJpbmcoaTogbnVtYmVyLCBhOiBVaW50OEFycmF5KTogW3N0cmluZywgbnVtYmVyXSB7XG4gIGxldCByID0gMDtcbiAgd2hpbGUgKGFbaSArIHJdICE9PSAwKSB7IHIrKzsgfVxuICByZXR1cm4gW19fdGV4dERlY29kZXIuZGVjb2RlKGEuc2xpY2UoaSwgaStyKSksIHIgKyAxXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpZ0JveVRvQnl0ZXMgKG46IGJpZ2ludCk6IFVpbnQ4QXJyYXkge1xuICAvLyB0aGlzIGlzIGEgY29vbCBnYW1lIGJ1dCBsZXRzIGhvcGUgaXQgZG9lc24ndCB1c2UgMTI3KyBieXRlIG51bWJlcnNcbiAgY29uc3QgYnl0ZXMgPSBbMF07XG4gIGlmIChuIDwgMG4pIHtcbiAgICBuICo9IC0xbjtcbiAgICBieXRlc1swXSA9IDEyODtcbiAgfVxuXG4gIHdoaWxlIChuKSB7XG4gICAgaWYgKGJ5dGVzWzBdID09PSAyNTUpIHRocm93IG5ldyBFcnJvcignYnJ1aCB0aGF0cyB0b28gYmlnJyk7XG4gICAgYnl0ZXNbMF0rKztcbiAgICBieXRlcy5wdXNoKE51bWJlcihuICYgMjU1bikpO1xuICAgIG4gPj49IDY0bjtcbiAgfVxuXG4gIHJldHVybiBuZXcgVWludDhBcnJheShieXRlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvQmlnQm95IChpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2JpZ2ludCwgbnVtYmVyXSB7XG4gIGNvbnN0IEwgPSBOdW1iZXIoYnl0ZXNbaV0pO1xuICBjb25zdCBsZW4gPSBMICYgMTI3O1xuICBjb25zdCByZWFkID0gMSArIGxlbjtcbiAgY29uc3QgbmVnID0gKEwgJiAxMjgpID8gLTFuIDogMW47XG4gIGNvbnN0IEJCOiBiaWdpbnRbXSA9IEFycmF5LmZyb20oYnl0ZXMuc2xpY2UoaSArIDEsIGkgKyByZWFkKSwgQmlnSW50KTtcbiAgaWYgKGxlbiAhPT0gQkIubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ2JpZ2ludCBjaGVja3N1bSBpcyBGVUNLPycpO1xuICByZXR1cm4gW2xlbiA/IEJCLnJlZHVjZShieXRlVG9CaWdib2kpICogbmVnIDogMG4sIHJlYWRdXG59XG5cbmZ1bmN0aW9uIGJ5dGVUb0JpZ2JvaSAobjogYmlnaW50LCBiOiBiaWdpbnQsIGk6IG51bWJlcikge1xuICByZXR1cm4gbiB8IChiIDw8IEJpZ0ludChpICogOCkpO1xufVxuIiwgImltcG9ydCB7IFNjaGVtYSwgdHlwZSBTY2hlbWFBcmdzIH0gZnJvbSAnLic7XG5pbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBDb2x1bW5BcmdzID0ge1xuICB0eXBlOiBDT0xVTU47XG4gIGluZGV4OiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgaXNBcnJheTogYm9vbGVhbixcbiAgd2lkdGg/OiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIGZsYWc/OiBudW1iZXJ8bnVsbDtcbiAgYml0PzogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBlbnVtIENPTFVNTiB7XG4gIFVOVVNFRCA9IDAsXG4gIFNUUklORyA9IDEsXG4gIEJPT0wgICA9IDIsXG4gIFU4ICAgICA9IDMsXG4gIEk4ICAgICA9IDQsXG4gIFUxNiAgICA9IDUsXG4gIEkxNiAgICA9IDYsXG4gIFUzMiAgICA9IDcsXG4gIEkzMiAgICA9IDgsXG4gIEJJRyAgICA9IDksXG59O1xuXG5leHBvcnQgY29uc3QgQ09MVU1OX0xBQkVMID0gW1xuICAnVU5VU0VEJyxcbiAgJ1NUUklORycsXG4gICdCT09MJyxcbiAgJ1U4JyxcbiAgJ0k4JyxcbiAgJ1UxNicsXG4gICdJMTYnLFxuICAnVTMyJyxcbiAgJ0kzMicsXG4gICdCSUcnLFxuXTtcblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJJRztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9vbENvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uQk9PTCB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQk9PTDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5TVFJJTkcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uPFQgPSBhbnksIFIgZXh0ZW5kcyBVaW50OEFycmF5fG51bWJlciA9IGFueT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBUO1xuICBmcm9tQnl0ZXMgKGk6IG51bWJlciwgYnl0ZXM6IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW1QsIG51bWJlcl07XG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW107XG4gIHNlcmlhbGl6ZVJvdyAodjogYW55KTogUixcbiAgdG9TdHJpbmcgKHY6IHN0cmluZyk6IGFueTtcbiAgcmVhZG9ubHkgd2lkdGg6IG51bWJlcnxudWxsOyAgICAvLyBmb3IgbnVtYmVycywgaW4gYnl0ZXNcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyfG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyOiBudW1iZXI7XG4gIHJlYWRvbmx5IG9mZnNldDogbnVtYmVyfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uPHN0cmluZywgVWludDhBcnJheT4ge1xuICByZWFkb25seSB0eXBlOiBDT0xVTU4uU1RSSU5HID0gQ09MVU1OLlNUUklORztcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uU1RSSU5HXTtcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDM7XG4gIHJlYWRvbmx5IG9mZnNldCA9IG51bGw7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgaW5kZXgsIG5hbWUsIHR5cGUsIG92ZXJyaWRlLCBpc0FycmF5IH0gPSBmaWVsZDtcbiAgICBpZiAoIWlzU3RyaW5nQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCcke25hbWV9IGlzIG5vdCBhIHN0cmluZyBjb2x1bW4nKTtcbiAgICAvL2lmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJ2ZvbycpICE9PSAnc3RyaW5nJylcbiAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYHNlZW1zIG92ZXJyaWRlIGZvciAke25hbWV9IGRvZXMgbm90IHJldHVybiBhIHN0cmluZ2ApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogc3RyaW5nIHtcbiAgICAvL3JldHVybiB2ID8/ICdcIlwiJztcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSByZXR1cm4gdGhpcy5vdmVycmlkZSh2LCB1LCBhKTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLlNUUklORywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gc3RyaW5nVG9CeXRlcyh2KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW48bnVtYmVyLCBVaW50OEFycmF5PiB7XG4gIHJlYWRvbmx5IHR5cGU6IE5VTUVSSUNfQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiAxfDJ8NDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMDtcbiAgcmVhZG9ubHkgb2Zmc2V0ID0gMDtcbiAgb3ZlcnJpZGU/OiAodjogYW55LCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PENvbHVtbkFyZ3M+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgLy9pZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdudW1iZXInKVxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IoYCR7bmFtZX0gb3ZlcnJpZGUgbXVzdCByZXR1cm4gYSBudW1iZXJgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMubGFiZWwgPSBDT0xVTU5fTEFCRUxbdGhpcy50eXBlXTtcbiAgICB0aGlzLndpZHRoID0gQ09MVU1OX1dJRFRIW3RoaXMudHlwZV07XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgZnJvbVRleHQodjogc3RyaW5nLCB1OiBhbnksIGE6IFNjaGVtYUFyZ3MpOiBudW1iZXIge1xuICAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/IHRoaXMub3ZlcnJpZGUodiwgdSwgYSkgOlxuICAgICAgdiA/IE51bWJlcih2KSB8fCAwIDogMDtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIF86IFVpbnQ4QXJyYXksIHZpZXc6IERhdGFWaWV3KTogW251bWJlciwgbnVtYmVyXSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICByZXR1cm4gW3ZpZXcuZ2V0SW50OChpKSwgMV07XG4gICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQ4KGkpLCAxXTtcbiAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldEludDE2KGksIHRydWUpLCAyXTtcbiAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgcmV0dXJuIFt2aWV3LmdldFVpbnQxNihpLCB0cnVlKSwgMl07XG4gICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRJbnQzMihpLCB0cnVlKSwgNF07XG4gICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgIHJldHVybiBbdmlldy5nZXRVaW50MzIoaSwgdHJ1ZSksIDRdO1xuICAgIH1cbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbdGhpcy50eXBlLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkodGhpcy53aWR0aCk7XG4gICAgZm9yIChsZXQgbyA9IDA7IG8gPCB0aGlzLndpZHRoOyBvKyspXG4gICAgICBieXRlc1tvXSA9ICh2ID4+PiAobyAqIDgpKSAmIDI1NTtcbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgQmlnQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxiaWdpbnQsIFVpbnQ4QXJyYXk+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyA9IENPTFVNTi5CSUc7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJJR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAyO1xuICByZWFkb25seSBvZmZzZXQgPSBudWxsO1xuICBvdmVycmlkZT86ICh2OiBhbnksIHU6IGFueSwgYTogU2NoZW1hQXJncykgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8Q29sdW1uQXJncz4pIHtcbiAgICBjb25zdCB7IG5hbWUsIGluZGV4LCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc0JpZ0NvbHVtbih0eXBlKSkgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGlzIG5vdCBiaWdgKTtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBmcm9tVGV4dCh2OiBzdHJpbmcsIHU6IGFueSwgYTogU2NoZW1hQXJncyk6IGJpZ2ludCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdikgcmV0dXJuIDBuO1xuICAgIHJldHVybiBCaWdJbnQodik7XG4gIH1cblxuICBmcm9tQnl0ZXMoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICAgIHJldHVybiBieXRlc1RvQmlnQm95KGksIGJ5dGVzKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJJRywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyh2OiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgICBpZiAoIXYpIHJldHVybiBuZXcgVWludDhBcnJheSgxKTtcbiAgICByZXR1cm4gYmlnQm95VG9CeXRlcyh2KTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCb29sQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbjxib29sZWFuLCBudW1iZXI+IHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJPT0wgPSBDT0xVTU4uQk9PTDtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZyA9IENPTFVNTl9MQUJFTFtDT0xVTU4uQk9PTF07XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudW1iZXI7XG4gIHJlYWRvbmx5IGJpdDogbnVtYmVyO1xuICByZWFkb25seSBvcmRlciA9IDE7XG4gIHJlYWRvbmx5IG9mZnNldCA9IDA7XG4gIG92ZXJyaWRlPzogKHY6IGFueSwgdTogYW55LCBhOiBTY2hlbWFBcmdzKSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxDb2x1bW5BcmdzPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIC8vaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnYm9vbGVhbicpXG4gICAgICAvL3Rocm93IG5ldyBFcnJvcignc2VlbXMgdGhhdCBvdmVycmlkZSBkb2VzIG5vdCByZXR1cm4gYSBib29sJyk7XG4gICAgaWYgKCFpc0Jvb2xDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgaWYgKHR5cGVvZiBmbGFnICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKGBmbGFnIGlzIG5vdCBudW1iZXJgKTtcbiAgICBpZiAodHlwZW9mIGJpdCAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgYml0IGlzIG5vdCBudW1iZXJgKTtcbiAgICB0aGlzLmZsYWcgPSBmbGFnO1xuICAgIHRoaXMuYml0ID0gYml0O1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIGZyb21UZXh0KHY6IHN0cmluZywgdTogYW55LCBhOiBTY2hlbWFBcmdzKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIHJldHVybiB0aGlzLm92ZXJyaWRlKHYsIHUsIGEpO1xuICAgIGlmICghdiB8fCB2ID09PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZyb21CeXRlcyhpOiBudW1iZXIsIGJ5dGVzOiBVaW50OEFycmF5KTogW2Jvb2xlYW4sIG51bWJlcl0ge1xuICAgIHJldHVybiBbYnl0ZXNbaV0gPT09IHRoaXMuZmxhZywgMF07XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW0NPTFVNTi5CT09MLCAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSldO1xuICB9XG5cbiAgc2VyaWFsaXplUm93KHY6IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIHJldHVybiB2ID8gdGhpcy5mbGFnIDogMDtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBGQ29tcGFyYWJsZSA9IHtcbiAgb3JkZXI6IG51bWJlcixcbiAgYml0OiBudW1iZXIgfCBudWxsLFxuICBpbmRleDogbnVtYmVyXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBDb2x1bW4sIGI6IENvbHVtbik6IG51bWJlciB7XG4gIC8vaWYgKGEuaXNBcnJheSAhPT0gYi5pc0FycmF5KSByZXR1cm4gYS5pc0FycmF5ID8gMSA6IC0xO1xuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFyZ3NGcm9tVGV4dCAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5kZXg6IG51bWJlcixcbiAgZmxhZ3NVc2VkOiBudW1iZXIsXG4gIGRhdGE6IHN0cmluZ1tdW10sXG4gIG92ZXJyaWRlOiAoKHY6IGFueSwgdTogYW55LCBzOiBhbnkpID0+IGFueSkgfCB1bmRlZmluZWQsXG4gIHNjaGVtYUFyZ3M6IFNjaGVtYUFyZ3Ncbik6IENvbHVtbkFyZ3N8bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGUsXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICAvLyBhdXRvLWRldGVjdGVkIGZpZWxkcyB3aWxsIG5ldmVyIGJlIGFycmF5cy5cbiAgICBpc0FycmF5OiBmYWxzZSxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICAvL2lmIChpc1VzZWQgIT09IGZhbHNlKSBkZWJ1Z2dlcjtcbiAgZm9yIChjb25zdCB1IG9mIGRhdGEpIHtcbiAgICBjb25zdCB2ID0gZmllbGQub3ZlcnJpZGUgPyBmaWVsZC5vdmVycmlkZSh1W2luZGV4XSwgdSwgc2NoZW1hQXJncykgOiB1W2luZGV4XTtcbiAgICBpZiAoIXYpIGNvbnRpbnVlO1xuICAgIC8vY29uc29sZS5lcnJvcihgJHtpbmRleH06JHtuYW1lfSB+ICR7dVswXX06JHt1WzFdfTogJHt2fWApXG4gICAgaXNVc2VkID0gdHJ1ZTtcbiAgICBjb25zdCBuID0gTnVtYmVyKHYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4obikpIHtcbiAgICAgIC8vIG11c3QgYmUgYSBzdHJpbmdcbiAgICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uU1RSSU5HO1xuICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0gZWxzZSBpZiAoIU51bWJlci5pc0ludGVnZXIobikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgXFx4MWJbMzFtJHtpbmRleH06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2luZGV4fToke25hbWV9IGlzIHVudXNlZD9cXHgxYlswbWApXG4gICAgLy9kZWJ1Z2dlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChmaWVsZC5taW5WYWx1ZSA9PT0gMCAmJiBmaWVsZC5tYXhWYWx1ZSA9PT0gMSkge1xuICAgIC8vY29uc29sZS5lcnJvcihgXFx4MWJbMzRtJHtpfToke25hbWV9IGFwcGVhcnMgdG8gYmUgYSBib29sZWFuIGZsYWdcXHgxYlswbWApO1xuICAgIGZpZWxkLnR5cGUgPSBDT0xVTU4uQk9PTDtcbiAgICBmaWVsZC5iaXQgPSBmbGFnc1VzZWQ7XG4gICAgZmllbGQuZmxhZyA9IDEgPDwgZmllbGQuYml0ICUgODtcbiAgICByZXR1cm4gZmllbGQ7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gZmllbGQ7XG4gICAgfVxuICB9XG5cbiAgLy8gQklHIEJPWSBUSU1FXG4gIGZpZWxkLnR5cGUgPSBDT0xVTU4uQklHO1xuICByZXR1cm4gZmllbGQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQXJncyAoYXJnczogQ29sdW1uQXJncyk6IENvbHVtbiB7XG4gIHN3aXRjaCAoYXJncy50eXBlKSB7XG4gICAgY2FzZSBDT0xVTU4uVU5VU0VEOlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnVzZWQgZmllbGQgY2FudCBiZSB0dXJuZWQgaW50byBhIENvbHVtbicpO1xuICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgIHJldHVybiBuZXcgU3RyaW5nQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICByZXR1cm4gbmV3IEJvb2xDb2x1bW4oYXJncyk7XG4gICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgcmV0dXJuIG5ldyBOdW1lcmljQ29sdW1uKGFyZ3MpO1xuICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgIHJldHVybiBuZXcgQmlnQ29sdW1uKGFyZ3MpO1xuICB9XG59XG4iLCAiLy8ganVzdCBhIGJ1bmNoIG9mIG91dHB1dCBmb3JtYXR0aW5nIHNoaXRcbmV4cG9ydCBmdW5jdGlvbiB0YWJsZURlY28obmFtZTogc3RyaW5nLCB3aWR0aCA9IDgwLCBzdHlsZSA9IDkpIHtcbiAgY29uc3QgeyBUTCwgQkwsIFRSLCBCUiwgSFIgfSA9IGdldEJveENoYXJzKHN0eWxlKVxuICBjb25zdCBuYW1lV2lkdGggPSBuYW1lLmxlbmd0aCArIDI7IC8vIHdpdGggc3BhY2VzXG4gIGNvbnN0IGhUYWlsV2lkdGggPSB3aWR0aCAtIChuYW1lV2lkdGggKyA2KVxuICByZXR1cm4gW1xuICAgIGAke1RMfSR7SFIucmVwZWF0KDQpfSAke25hbWV9ICR7SFIucmVwZWF0KGhUYWlsV2lkdGgpfSR7VFJ9YCxcbiAgICBgJHtCTH0ke0hSLnJlcGVhdCh3aWR0aCAtIDIpfSR7QlJ9YFxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIGdldEJveENoYXJzIChzdHlsZTogbnVtYmVyKSB7XG4gIHN3aXRjaCAoc3R5bGUpIHtcbiAgICBjYXNlIDk6IHJldHVybiB7IFRMOiAnXHUyNTBDJywgQkw6ICdcdTI1MTQnLCBUUjogJ1x1MjUxMCcsIEJSOiAnXHUyNTE4JywgSFI6ICdcdTI1MDAnIH07XG4gICAgY2FzZSAxODogcmV0dXJuIHsgVEw6ICdcdTI1MEYnLCBCTDogJ1x1MjUxNycsIFRSOiAnXHUyNTEzJywgQlI6ICdcdTI1MUInLCBIUjogJ1x1MjUwMScgfTtcbiAgICBjYXNlIDM2OiByZXR1cm4geyBUTDogJ1x1MjU1NCcsIEJMOiAnXHUyNTVBJywgVFI6ICdcdTI1NTcnLCBCUjogJ1x1MjU1RCcsIEhSOiAnXHUyNTUwJyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignaW52YWxpZCBzdHlsZScpO1xuICAgIC8vY2FzZSA/OiByZXR1cm4geyBUTDogJ00nLCBCTDogJ04nLCBUUjogJ08nLCBCUjogJ1AnLCBIUjogJ1EnIH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJveENoYXIgKGk6IG51bWJlciwgZG90ID0gMCkge1xuICBzd2l0Y2ggKGkpIHtcbiAgICBjYXNlIDA6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgY2FzZSAoQk9YLlVfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzUnO1xuICAgIGNhc2UgKEJPWC5VX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc5JztcbiAgICBjYXNlIChCT1guRF9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nyc7XG4gICAgY2FzZSAoQk9YLkRfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0InO1xuICAgIGNhc2UgKEJPWC5MX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc0JztcbiAgICBjYXNlIChCT1guTF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3OCc7XG4gICAgY2FzZSAoQk9YLlJfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzYnO1xuICAgIGNhc2UgKEJPWC5SX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdBJztcblxuICAgIC8vIHR3by13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDYnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRFJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMic7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0QnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdGJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQic7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDcnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRGJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMyc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1RkYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTknO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MUInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVDJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1RCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE3JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1OSc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEwJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTUnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxMyc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU3JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwQyc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MEYnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTUzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NCc7XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX1Q6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDgnO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA0JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0Qyc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDAnO1xuICAgICAgfVxuICAgIGNhc2UgQk9YLkxfVHxCT1guUl9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdDJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RSc7XG4gICAgY2FzZSBCT1guTF9CfEJPWC5SX0I6IHN3aXRjaCAoZG90KSB7XG4gICAgICAgIGNhc2UgMzogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDknO1xuICAgICAgICBjYXNlIDI6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTA1JztcbiAgICAgICAgY2FzZSAxOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU0RCc7XG4gICAgICAgIGRlZmF1bHQ6ICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDEnO1xuICAgICAgfVxuICAgIC8vIHRocmVlLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyNSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjYnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI5JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyOCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYyJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Myc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUMnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTFEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU1RSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MUYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTIwJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMyc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NUYnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYwJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQnxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzQSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2OCc7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjknO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTJDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyRSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkQnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJGJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjQnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTMwJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzMic7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzEnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU2NSc7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjYnO1xuICAgIC8vIGZvdXItd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1M0MnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTNFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzRCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0YnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0R8Qk9YLlJfRDogcmV0dXJuICdcXHUyNTZBJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDYnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQ1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0OCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ0JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0Myc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDcnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQyJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0QSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU2Qic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkMnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnXHUyNjEyJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBCT1gge1xuICBVX1QgPSAxLFxuICBVX0IgPSAyLFxuICBVX0QgPSA0LFxuICBEX1QgPSA4LFxuICBEX0IgPSAxNixcbiAgRF9EID0gMzIsXG4gIExfVCA9IDY0LFxuICBMX0IgPSAxMjgsXG4gIExfRCA9IDI1NixcbiAgUl9UID0gNTEyLFxuICBSX0IgPSAxMDI0LFxuICBSX0QgPSAyMDQ4LFxufVxuXG4iLCAiaW1wb3J0IHR5cGUgeyBDb2x1bW4gfSBmcm9tICcuL2NvbHVtbic7XG5pbXBvcnQgdHlwZSB7IFJvdyB9IGZyb20gJy4vdGFibGUnXG5pbXBvcnQge1xuICBpc1N0cmluZ0NvbHVtbixcbiAgaXNCaWdDb2x1bW4sXG4gIENPTFVNTixcbiAgQmlnQ29sdW1uLFxuICBCb29sQ29sdW1uLFxuICBTdHJpbmdDb2x1bW4sXG4gIE51bWVyaWNDb2x1bW4sXG4gIGNtcEZpZWxkcyxcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCB0eXBlIFNjaGVtYUFyZ3MgPSB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29sdW1uczogQ29sdW1uW10sXG4gIGZpZWxkczogc3RyaW5nW10sXG4gIGZsYWdzVXNlZDogbnVtYmVyO1xuICByYXdGaWVsZHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG59XG5cbnR5cGUgQmxvYlBhcnQgPSBhbnk7IC8vID8/Pz8/XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgZmllbGRzLCBuYW1lLCBmbGFnc1VzZWQgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdLnNvcnQoY21wRmllbGRzKTtcbiAgICB0aGlzLmZpZWxkcyA9IHRoaXMuY29sdW1ucy5tYXAoYyA9PiBjLm5hbWUpO1xuICAgIHRoaXMuY29sdW1uc0J5TmFtZSA9IE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmNvbHVtbnMubWFwKGMgPT4gW2MubmFtZSwgY10pKTtcbiAgICB0aGlzLmZsYWdGaWVsZHMgPSBmbGFnc1VzZWQ7XG4gICAgdGhpcy5maXhlZFdpZHRoID0gY29sdW1ucy5yZWR1Y2UoXG4gICAgICAodywgYykgPT4gdyArIChjLndpZHRoID8/IDApLFxuICAgICAgTWF0aC5jZWlsKGZsYWdzVXNlZCAvIDgpLCAvLyA4IGZsYWdzIHBlciBieXRlLCBuYXRjaFxuICAgICk7XG5cbiAgICBsZXQgbzogbnVtYmVyfG51bGwgPSAwO1xuICAgIGZvciAoY29uc3QgYyBvZiBjb2x1bW5zKSB7XG4gICAgICBzd2l0Y2ggKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgYy5vZmZzZXQgPSBvO1xuICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4KSBvKys7XG4gICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgIGMub2Zmc2V0ID0gbztcbiAgICAgICAgIG8gKz0gYy53aWR0aDtcbiAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmluZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNTdHJpbmdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuICAgIHRoaXMuYmlnRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc0JpZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG5cbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogU2NoZW1hIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlYWQ6IG51bWJlcjtcbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG5cbiAgICBjb25zdCBhcmdzID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvbHVtbnM6IFtdIGFzIENvbHVtbltdLFxuICAgICAgZmllbGRzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIGZsYWdzVXNlZDogMCxcbiAgICAgIHJhd0ZpZWxkczoge30sIC8vIG5vbmUgOjxcbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyBUT0RPIC0gb25seSB3b3JrcyB3aGVuIDAtZmllbGQgc2NoZW1hcyBhcmVuJ3QgYWxsb3dlZH4hXG4gICAgd2hpbGUgKGluZGV4IDwgbnVtRmllbGRzKSB7XG4gICAgICBjb25zdCB0eXBlID0gYnl0ZXNbaSsrXTtcbiAgICAgIFtuYW1lLCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgY29uc3QgZiA9IHtcbiAgICAgICAgaW5kZXgsIG5hbWUsIHR5cGUsXG4gICAgICAgIHdpZHRoOiBudWxsLCBiaXQ6IG51bGwsIGZsYWc6IG51bGwsXG4gICAgICAgIG9yZGVyOiA5OTksIGlzQXJyYXk6IGZhbHNlXG4gICAgICB9O1xuICAgICAgaSArPSByZWFkO1xuICAgICAgbGV0IGM6IENvbHVtbjtcblxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzpcbiAgICAgICAgICBjID0gbmV3IFN0cmluZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBjID0gbmV3IEJpZ0NvbHVtbih7IC4uLmYgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgYml0ID0gYXJncy5mbGFnc1VzZWQrKztcbiAgICAgICAgICBjb25zdCBmbGFnID0gMiAqKiAoYml0ICUgOCk7XG4gICAgICAgICAgYyA9IG5ldyBCb29sQ29sdW1uKHsgLi4uZiwgYml0LCBmbGFnIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDEgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiAyIH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogNCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gdHlwZSAke3R5cGV9YCk7XG4gICAgICB9XG4gICAgICBhcmdzLmNvbHVtbnMucHVzaChjKTtcbiAgICAgIGFyZ3MuZmllbGRzLnB1c2goYy5uYW1lKTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NoZW1hKGFyZ3MpO1xuICB9XG5cbiAgcm93RnJvbUJ1ZmZlcihcbiAgICAgIGk6IG51bWJlcixcbiAgICAgIGJ1ZmZlcjogQXJyYXlCdWZmZXIsXG4gICAgICBfX3Jvd0lkOiBudW1iZXJcbiAgKTogW1JvdywgbnVtYmVyXSB7XG4gICAgY29uc3QgZGJyID0gX19yb3dJZCA8IDUgfHwgX19yb3dJZCA+IDM5NzUgfHwgX19yb3dJZCAlIDEwMDAgPT09IDA7XG4gICAgLy9pZiAoZGJyKSBjb25zb2xlLmxvZyhgIC0gUk9XICR7X19yb3dJZH0gRlJPTSAke2l9ICgweCR7aS50b1N0cmluZygxNil9KWApXG4gICAgbGV0IHRvdGFsUmVhZCA9IDA7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgICBjb25zdCByb3c6IFJvdyA9IHsgX19yb3dJZCB9XG4gICAgY29uc3QgbGFzdEJpdCA9IHRoaXMuZmxhZ0ZpZWxkcyAtIDE7XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgaWYgKGMub2Zmc2V0ICE9PSBudWxsICYmIGMub2Zmc2V0ICE9PSB0b3RhbFJlYWQpIGRlYnVnZ2VyO1xuICAgICAgbGV0IFt2LCByZWFkXSA9IGMuZnJvbUJ5dGVzKGksIGJ5dGVzLCB2aWV3KTtcblxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpXG4gICAgICAgIHJlYWQgPSAoYy5mbGFnID09PSAxMjggfHwgYy5iaXQgPT09IGxhc3RCaXQpID8gMSA6IDA7XG5cbiAgICAgIGkgKz0gcmVhZDtcbiAgICAgIHRvdGFsUmVhZCArPSByZWFkO1xuICAgICAgcm93W2MubmFtZV0gPSB2O1xuICAgIH1cbiAgICAvL2lmIChkYnIpIHtcbiAgICAgIC8vY29uc29sZS5sb2coYCAgIFJFQUQ6ICR7dG90YWxSZWFkfSBUTyAke2l9IC8gJHtidWZmZXIuYnl0ZUxlbmd0aH1cXG5gLCByb3csICdcXG5cXG4nKTtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgLy99XG4gICAgcmV0dXJuIFtyb3csIHRvdGFsUmVhZF07XG4gIH1cblxuICBwcmludFJvdyAocjogUm93LCBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPikge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoZmllbGRzLm1hcChmID0+IFtmLCByW2ZdXSkpO1xuICB9XG5cbiAgc2VyaWFsaXplSGVhZGVyICgpOiBCbG9iIHtcbiAgICAvLyBbLi4ubmFtZSwgMCwgbnVtRmllbGRzMCwgbnVtRmllbGRzMSwgZmllbGQwVHlwZSwgZmllbGQwRmxhZz8sIC4uLmZpZWxkME5hbWUsIDAsIGV0Y107XG4gICAgLy8gVE9ETyAtIEJhc2UgdW5pdCBoYXMgNTAwKyBmaWVsZHNcbiAgICBpZiAodGhpcy5jb2x1bW5zLmxlbmd0aCA+IDY1NTM1KSB0aHJvdyBuZXcgRXJyb3IoJ29oIGJ1ZGR5Li4uJyk7XG4gICAgY29uc3QgcGFydHMgPSBuZXcgVWludDhBcnJheShbXG4gICAgICAuLi5zdHJpbmdUb0J5dGVzKHRoaXMubmFtZSksXG4gICAgICB0aGlzLmNvbHVtbnMubGVuZ3RoICYgMjU1LFxuICAgICAgKHRoaXMuY29sdW1ucy5sZW5ndGggPj4+IDgpLFxuICAgICAgLi4udGhpcy5jb2x1bW5zLmZsYXRNYXAoYyA9PiBjLnNlcmlhbGl6ZSgpKVxuICAgIF0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFtwYXJ0c10pO1xuICB9XG5cbiAgc2VyaWFsaXplUm93IChyOiBSb3cpOiBCbG9iIHtcbiAgICBjb25zdCBmaXhlZCA9IG5ldyBVaW50OEFycmF5KHRoaXMuZml4ZWRXaWR0aCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGxhc3RCaXQgPSB0aGlzLmZsYWdGaWVsZHMgLSAxO1xuICAgIGNvbnN0IGJsb2JQYXJ0czogQmxvYlBhcnRbXSA9IFtmaXhlZF07XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgY29uc3QgdiA9IHJbYy5uYW1lXS8vIGMuc2VyaWFsaXplUm93KCBhcyBuZXZlcik7IC8vIGx1bFxuICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIHt9XG4gICAgICBzd2l0Y2goYy50eXBlKSB7XG4gICAgICAgIGNhc2UgQ09MVU1OLlNUUklORzoge1xuICAgICAgICAgIGNvbnN0IGI6IFVpbnQ4QXJyYXkgPSBjLnNlcmlhbGl6ZVJvdyh2IGFzIHN0cmluZylcbiAgICAgICAgICBpICs9IGIubGVuZ3RoOyAvLyBkZWJ1Z2dpblxuICAgICAgICAgIGJsb2JQYXJ0cy5wdXNoKGIpO1xuICAgICAgICB9IGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6IHtcbiAgICAgICAgICBjb25zdCBiOiBVaW50OEFycmF5ID0gYy5zZXJpYWxpemVSb3codiBhcyBiaWdpbnQpXG4gICAgICAgICAgaSArPSBiLmxlbmd0aDsgLy8gZGVidWdnaW5cbiAgICAgICAgICBibG9iUGFydHMucHVzaChiKTtcbiAgICAgICAgfSBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5CT09MOlxuICAgICAgICAgIGZpeGVkW2ldIHw9IGMuc2VyaWFsaXplUm93KHYgYXMgYm9vbGVhbik7XG4gICAgICAgICAgLy8gZG9udCBuZWVkIHRvIGNoZWNrIGZvciB0aGUgbGFzdCBmbGFnIHNpbmNlIHdlIG5vIGxvbmdlciBuZWVkIGlcbiAgICAgICAgICAvLyBhZnRlciB3ZSdyZSBkb25lIHdpdGggbnVtYmVycyBhbmQgYm9vbGVhbnNcbiAgICAgICAgICAvL2lmIChjLmZsYWcgPT09IDEyOCkgaSsrO1xuICAgICAgICAgIC8vIC4uLmJ1dCB3ZSB3aWxsIGJlY2F1eXNlIHdlIGJyb2tlIHNvbWV0aGlnblxuICAgICAgICAgIGlmIChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gbGFzdEJpdCkgaSsrO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgICAgIGNhc2UgQ09MVU1OLlUzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIGNvbnN0IGJ5dGVzID0gYy5zZXJpYWxpemVSb3codiBhcyBudW1iZXIpXG4gICAgICAgICAgZml4ZWQuc2V0KGJ5dGVzLCBpKVxuICAgICAgICAgIGkgKz0gYy53aWR0aDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignd2F0IHR5cGUgaXMgdGhpcycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vaWYgKHIuX19yb3dJZCA8IDUgfHwgci5fX3Jvd0lkID4gMzk3NSB8fCByLl9fcm93SWQgJSAxMDAwID09PSAwKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGAgLSBST1cgJHtyLl9fcm93SWR9YCwgeyBpLCBibG9iUGFydHMsIHIgfSk7XG4gICAgLy99XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29mZnNldCcsXG4gICAgICAnb3JkZXInLFxuICAgICAgJ2JpdCcsXG4gICAgICAndHlwZScsXG4gICAgICAnZmxhZycsXG4gICAgICAnd2lkdGgnLFxuICAgIF0pO1xuICAgIGNvbnNvbGUubG9nKHRhaWwpO1xuXG4gIH1cblxuICAvLyByYXdUb1JvdyAoZDogUmF3Um93KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge31cbiAgLy8gcmF3VG9TdHJpbmcgKGQ6IFJhd1JvdywgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge31cbn07XG5cbiIsICJpbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgeyB0YWJsZURlY28gfSBmcm9tICcuL3V0aWwnO1xuZXhwb3J0IHR5cGUgUm93RGF0YSA9IHN0cmluZ1tdO1xuZXhwb3J0IHR5cGUgUm93ID0gUmVjb3JkPHN0cmluZywgYm9vbGVhbnxudW1iZXJ8c3RyaW5nfGJpZ2ludD4gJiB7IF9fcm93SWQ6IG51bWJlciB9O1xuXG50eXBlIFRhYmxlQmxvYiA9IHsgbnVtUm93czogbnVtYmVyLCBoZWFkZXJCbG9iOiBCbG9iLCBkYXRhQmxvYjogQmxvYiB9O1xuXG5leHBvcnQgY2xhc3MgVGFibGUge1xuICBnZXQgbmFtZSAoKTogc3RyaW5nIHsgcmV0dXJuIGBbVEFCTEU6JHt0aGlzLnNjaGVtYS5uYW1lfV1gOyB9XG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSByb3dzOiBSb3dbXSxcbiAgICByZWFkb25seSBzY2hlbWE6IFNjaGVtYSxcbiAgKSB7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IFtVaW50MzJBcnJheSwgQmxvYiwgQmxvYl0ge1xuICAgIC8vIFtudW1Sb3dzLCBoZWFkZXJTaXplLCBkYXRhU2l6ZV0sIHNjaGVtYUhlYWRlciwgW3JvdzAsIHJvdzEsIC4uLiByb3dOXTtcbiAgICBjb25zdCBzY2hlbWFIZWFkZXIgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVIZWFkZXIoKTtcbiAgICAvLyBjYW50IGZpZ3VyZSBvdXQgaG93IHRvIGRvIHRoaXMgd2l0aCBiaXRzIDonPFxuICAgIGNvbnN0IHNjaGVtYVBhZGRpbmcgPSAoNCAtIHNjaGVtYUhlYWRlci5zaXplICUgNCkgJSA0O1xuICAgIGNvbnN0IHJvd0RhdGEgPSB0aGlzLnJvd3MuZmxhdE1hcChyID0+IHRoaXMuc2NoZW1hLnNlcmlhbGl6ZVJvdyhyKSk7XG4gICAgLy9jb25zdCByb3dEYXRhID0gdGhpcy5yb3dzLmZsYXRNYXAociA9PiB7XG4gICAgICAvL2NvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIC8vaWYgKHIuX19yb3dJZCA9PT0gMClcbiAgICAgICAgLy9yb3dCbG9iLmFycmF5QnVmZmVyKCkudGhlbihhYiA9PiB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgbmV3IFVpbnQ4QXJyYXkoYWIpLmpvaW4oJywgJykpO1xuICAgICAgICAvL30pO1xuICAgICAgLy9yZXR1cm4gcm93QmxvYjtcbiAgICAvL30pO1xuICAgIGNvbnN0IHJvd0Jsb2IgPSBuZXcgQmxvYihyb3dEYXRhKVxuICAgIGNvbnN0IGRhdGFQYWRkaW5nID0gKDQgLSByb3dCbG9iLnNpemUgJSA0KSAlIDQ7XG5cbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFVpbnQzMkFycmF5KFtcbiAgICAgICAgdGhpcy5yb3dzLmxlbmd0aCxcbiAgICAgICAgc2NoZW1hSGVhZGVyLnNpemUgKyBzY2hlbWFQYWRkaW5nLFxuICAgICAgICByb3dCbG9iLnNpemUgKyBkYXRhUGFkZGluZ1xuICAgICAgXSksXG4gICAgICBuZXcgQmxvYihbXG4gICAgICAgIHNjaGVtYUhlYWRlcixcbiAgICAgICAgbmV3IEFycmF5QnVmZmVyKHNjaGVtYVBhZGRpbmcpIGFzIGFueSAvLyA/Pz9cbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dCbG9iLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBPVVQgQkxPQlMgRk9SIFQ9JHtpfWAsIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKHsgdGFibGVzLCBibG9icywgYWxsU2l6ZXMsIGFsbEhlYWRlcnMsIGFsbERhdGEgfSlcbiAgICByZXR1cm4gbmV3IEJsb2IoW2FsbFNpemVzLCAuLi5hbGxIZWFkZXJzLCAuLi5hbGxEYXRhXSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgb3BlbkJsb2IgKGJsb2I6IEJsb2IpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIFRhYmxlPj4ge1xuICAgIGlmIChibG9iLnNpemUgJSA0ICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ3dvbmt5IGJsb2Igc2l6ZScpO1xuICAgIGNvbnN0IG51bVRhYmxlcyA9IG5ldyBVaW50MzJBcnJheShhd2FpdCBibG9iLnNsaWNlKDAsIDQpLmFycmF5QnVmZmVyKCkpWzBdO1xuXG4gICAgLy8gb3ZlcmFsbCBieXRlIG9mZnNldFxuICAgIGxldCBibyA9IDQ7XG4gICAgY29uc3Qgc2l6ZXMgPSBuZXcgVWludDMyQXJyYXkoXG4gICAgICBhd2FpdCBibG9iLnNsaWNlKGJvLCBibyArPSBudW1UYWJsZXMgKiAxMikuYXJyYXlCdWZmZXIoKVxuICAgICk7XG5cbiAgICBjb25zdCB0QmxvYnM6IFRhYmxlQmxvYltdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICBjb25zdCBzaSA9IGkgKiAzO1xuICAgICAgY29uc3QgbnVtUm93cyA9IHNpemVzW3NpXTtcbiAgICAgIGNvbnN0IGhTaXplID0gc2l6ZXNbc2kgKyAxXTtcbiAgICAgIHRCbG9ic1tpXSA9IHsgbnVtUm93cywgaGVhZGVyQmxvYjogYmxvYi5zbGljZShibywgYm8gKz0gaFNpemUpIH0gYXMgYW55O1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVRhYmxlczsgaSsrKSB7XG4gICAgICB0QmxvYnNbaV0uZGF0YUJsb2IgPSBibG9iLnNsaWNlKGJvLCBibyArPSBzaXplc1tpICogMyArIDJdKTtcbiAgICB9O1xuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAoKHRiLCBpKSA9PiB7XG4gICAgICAvL2NvbnNvbGUubG9nKGBJTiBCTE9CUyBGT1IgVD0ke2l9YCwgdGIpXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQmxvYih0Yik7XG4gICAgfSkpXG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyh0YWJsZXMubWFwKHQgPT4gW3Quc2NoZW1hLm5hbWUsIHRdKSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZnJvbUJsb2IgKHtcbiAgICBoZWFkZXJCbG9iLFxuICAgIGRhdGFCbG9iLFxuICAgIG51bVJvd3MsXG4gIH06IFRhYmxlQmxvYik6IFByb21pc2U8VGFibGU+IHtcbiAgICBjb25zdCBzY2hlbWEgPSBTY2hlbWEuZnJvbUJ1ZmZlcihhd2FpdCBoZWFkZXJCbG9iLmFycmF5QnVmZmVyKCkpO1xuICAgIGxldCByYm8gPSAwO1xuICAgIGxldCBfX3Jvd0lkID0gMDtcbiAgICBjb25zdCByb3dzOiBSb3dbXSA9IFtdO1xuICAgIC8vIFRPRE8gLSBjb3VsZCBkZWZpbml0ZWx5IHVzZSBhIHN0cmVhbSBmb3IgdGhpc1xuICAgIGNvbnN0IGRhdGFCdWZmZXIgPSBhd2FpdCBkYXRhQmxvYi5hcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUubG9nKGA9PT09PSBSRUFEICR7bnVtUm93c30gT0YgJHtzY2hlbWEubmFtZX0gPT09PT1gKVxuICAgIHdoaWxlIChfX3Jvd0lkIDwgbnVtUm93cykge1xuICAgICAgY29uc3QgW3JvdywgcmVhZF0gPSBzY2hlbWEucm93RnJvbUJ1ZmZlcihyYm8sIGRhdGFCdWZmZXIsIF9fcm93SWQrKyk7XG4gICAgICByb3dzLnB1c2gocm93KTtcbiAgICAgIHJibyArPSByZWFkO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVGFibGUocm93cywgc2NoZW1hKTtcbiAgfVxuXG5cbiAgcHJpbnQgKFxuICAgIHdpZHRoOiBudW1iZXIgPSA4MCxcbiAgICBmaWVsZHM6IFJlYWRvbmx5PHN0cmluZ1tdPnxudWxsID0gbnVsbCxcbiAgICBuOiBudW1iZXJ8bnVsbCA9IG51bGwsXG4gICAgbTogbnVtYmVyfG51bGwgPSBudWxsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAxOCk7XG4gICAgY29uc3Qgcm93cyA9IG4gPT09IG51bGwgPyB0aGlzLnJvd3MgOlxuICAgICAgbSA9PT0gbnVsbCA/IHRoaXMucm93cy5zbGljZSgwLCBuKSA6XG4gICAgICB0aGlzLnJvd3Muc2xpY2UobiwgbSk7XG5cbiAgICBjb25zdCBbcFJvd3MsIHBGaWVsZHNdID0gZmllbGRzID9cbiAgICAgIFtyb3dzLm1hcCgocjogUm93KSA9PiB0aGlzLnNjaGVtYS5wcmludFJvdyhyLCBmaWVsZHMpKSwgZmllbGRzXTpcbiAgICAgIFtyb3dzLCB0aGlzLnNjaGVtYS5maWVsZHNdXG4gICAgICA7XG5cbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zb2xlLnRhYmxlKHBSb3dzLCBwRmllbGRzKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcbiAgfVxuXG4gIGR1bXBSb3cgKGk6IG51bWJlcnxudWxsLCBzaG93RW1wdHkgPSBmYWxzZSwgdXNlQ1NTPzogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAvLyBUT0RPIFx1MjAxNCBpbiBicm93c2VyLCB1c2VDU1MgPT09IHRydWUgYnkgZGVmYXVsdFxuICAgIHVzZUNTUyA/Pz0gKGdsb2JhbFRoaXNbJ3dpbmRvdyddID09PSBnbG9iYWxUaGlzKTsgLy8gaWRrXG4gICAgaSA/Pz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy5yb3dzLmxlbmd0aCk7XG4gICAgY29uc3Qgcm93ID0gdGhpcy5yb3dzW2ldO1xuICAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjc3M6IHN0cmluZ1tdfG51bGwgPSB1c2VDU1MgPyBbXSA6IG51bGw7XG4gICAgY29uc3QgZm10ID0gZm10U3R5bGVkLmJpbmQobnVsbCwgb3V0LCBjc3MpO1xuICAgIGNvbnN0IHAgPSBNYXRoLm1heChcbiAgICAgIC4uLnRoaXMuc2NoZW1hLmNvbHVtbnNcbiAgICAgIC5maWx0ZXIoYyA9PiBzaG93RW1wdHkgfHwgcm93W2MubmFtZV0pXG4gICAgICAubWFwKGMgPT4gYy5uYW1lLmxlbmd0aCArIDIpXG4gICAgKTtcbiAgICBpZiAoIXJvdylcbiAgICAgIGZtdChgJWMke3RoaXMuc2NoZW1hLm5hbWV9WyR7aX1dIGRvZXMgbm90IGV4aXN0YCwgQ19OT1RfRk9VTkQpO1xuICAgIGVsc2Uge1xuICAgICAgZm10KGAlYyR7dGhpcy5zY2hlbWEubmFtZX1bJHtpfV1gLCBDX1JPV19IRUFEKTtcbiAgICAgIGZvciAoY29uc3QgYyBvZiB0aGlzLnNjaGVtYS5jb2x1bW5zKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2MubmFtZV07XG4gICAgICAgIGNvbnN0IG4gPSBjLm5hbWUucGFkU3RhcnQocCwgJyAnKTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlY1RSVUVgLCBDX1RSVUUpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAlY0ZBTFNFYCwgQ19OT1RfRk9VTkQsIENfRkFMU0UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19OVU1CRVIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiAwYCwgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIGlmICh2YWx1ZSkgZm10KGAke259OiAlYyR7dmFsdWV9YCwgQ19TVFIpXG4gICAgICAgICAgICBlbHNlIGlmIChzaG93RW1wdHkpIGZtdChgJWMke259OiBcdTIwMTRgLCBDX05PVF9GT1VORCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdiaWdpbnQnOlxuICAgICAgICAgICAgaWYgKHZhbHVlKSBmbXQoYHtufTogJWMwICVjJHt2YWx1ZX0gKEJJRylgLCBDX0JJRywgQ19OT1RfRk9VTkQpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc2hvd0VtcHR5KSBmbXQoYCVjJHtufTogMCAoQklHKWAsIENfTk9UX0ZPVU5EKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh1c2VDU1MpIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpLCAuLi5jc3MhXTtcbiAgICBlbHNlIHJldHVybiBbb3V0LmpvaW4oJ1xcbicpXTtcbiAgfVxuXG4gIGZpbmRSb3cgKHByZWRpY2F0ZTogKHJvdzogUm93KSA9PiBib29sZWFuLCBzdGFydCA9IDApOiBudW1iZXIge1xuICAgIGNvbnN0IE4gPSB0aGlzLnJvd3MubGVuZ3RoXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBOIC0gc3RhcnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgTjsgaSsrKSBpZiAocHJlZGljYXRlKHRoaXMucm93c1tpXSkpIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICogZmlsdGVyUm93cyAocHJlZGljYXRlOiAocm93OiBSb3cpID0+IGJvb2xlYW4pOiBHZW5lcmF0b3I8Um93PiB7XG4gICAgZm9yIChjb25zdCByb3cgb2YgdGhpcy5yb3dzKSBpZiAocHJlZGljYXRlKHJvdykpIHlpZWxkIHJvdztcbiAgfVxuICAvKlxuICByYXdUb1JvdyAoZDogc3RyaW5nW10pOiBSb3cge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zY2hlbWEuY29sdW1ucy5tYXAociA9PiBbXG4gICAgICByLm5hbWUsXG4gICAgICByLnRvVmFsKGRbci5pbmRleF0pXG4gICAgXSkpO1xuICB9XG4gIHJhd1RvU3RyaW5nIChkOiBzdHJpbmdbXSwgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8vIGp1c3QgYXNzdW1lIGZpcnN0IHR3byBmaWVsZHMgYXJlIGFsd2F5cyBpZCwgbmFtZS4gZXZlbiBpZiB0aGF0J3Mgbm90IHRydWVcbiAgICAvLyB0aGlzIGlzIGp1c3QgZm9yIHZpc3VhbGl6YXRpb24gcHVycG9yc2VzXG4gICAgbGV0IGV4dHJhID0gJyc7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZSA9IHRoaXMucmF3VG9Sb3coZCk7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYXJncykge1xuICAgICAgICAvLyBkb24ndCByZXByaW50IG5hbWUgb3IgaWRcbiAgICAgICAgaWYgKGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1swXSB8fCBhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMV0pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChlW2FdICE9IG51bGwpXG4gICAgICAgICAgcy5wdXNoKGAke2F9OiAke0pTT04uc3RyaW5naWZ5KGVbYV0pfWApXG4gICAgICB9XG4gICAgICBleHRyYSA9IHMubGVuZ3RoID4gMCA/IGAgeyAke3Muam9pbignLCAnKX0gfWAgOiAne30nO1xuICAgIH1cbiAgICByZXR1cm4gYDwke3RoaXMuc2NoZW1hLm5hbWV9OiR7ZFswXSA/PyAnPyd9IFwiJHtkWzFdfVwiJHtleHRyYX0+YDtcbiAgfVxuICAqL1xufVxuXG5mdW5jdGlvbiBmbXRTdHlsZWQgKFxuICBvdXQ6IHN0cmluZ1tdLFxuICBjc3NPdXQ6IHN0cmluZ1tdIHwgbnVsbCxcbiAgbXNnOiBzdHJpbmcsXG4gIC4uLmNzczogc3RyaW5nW11cbikge1xuICBpZiAoY3NzT3V0KSB7XG4gICAgb3V0LnB1c2gobXNnICsgJyVjJylcbiAgICBjc3NPdXQucHVzaCguLi5jc3MsIENfUkVTRVQpO1xuICB9XG4gIGVsc2Ugb3V0LnB1c2gobXNnLnJlcGxhY2UoLyVjL2csICcnKSk7XG59XG5cbmNvbnN0IENfTk9UX0ZPVU5EID0gJ2NvbG9yOiAjODg4OyBmb250LXN0eWxlOiBpdGFsaWM7JztcbmNvbnN0IENfUk9XX0hFQUQgPSAnZm9udC13ZWlnaHQ6IGJvbGRlcic7XG5jb25zdCBDX0JPTEQgPSAnZm9udC13ZWlnaHQ6IGJvbGQnO1xuY29uc3QgQ19OVU1CRVIgPSAnY29sb3I6ICNBMDU1MTg7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX1RSVUUgPSAnY29sb3I6ICM0QzM4QkU7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0ZBTFNFID0gJ2NvbG9yOiAjMzhCRTFDOyBmb250LXdlaWdodDogYm9sZDsnO1xuY29uc3QgQ19TVFIgPSAnY29sb3I6ICMzMEFBNjI7IGZvbnQtd2VpZ2h0OiBib2xkOyc7XG5jb25zdCBDX0JJRyA9ICdjb2xvcjogIzc4MjFBMzsgZm9udC13ZWlnaHQ6IGJvbGQ7JztcbmNvbnN0IENfUkVTRVQgPSAnY29sb3I6IHVuc2V0OyBmb250LXN0eWxlOiB1bnNldDsgZm9udC13ZWlnaHQ6IHVuc2V0OyBiYWNrZ3JvdW5kLXVuc2V0J1xuIiwgImltcG9ydCB7IGNzdkRlZnMgfSBmcm9tICcuL2Nzdi1kZWZzJztcbmltcG9ydCB7IHBhcnNlQWxsLCByZWFkQ1NWIH0gZnJvbSAnLi9wYXJzZS1jc3YnO1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcbmltcG9ydCB7IFRhYmxlIH0gZnJvbSAnZG9tNmluc3BlY3Rvci1uZXh0LWxpYic7XG5pbXBvcnQgeyB3cml0ZUZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcblxuY29uc3Qgd2lkdGggPSBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zO1xuY29uc3QgW2ZpbGUsIC4uLmZpZWxkc10gPSBwcm9jZXNzLmFyZ3Yuc2xpY2UoMik7XG5cbmNvbnNvbGUubG9nKCdBUkdTJywgeyBmaWxlLCBmaWVsZHMgfSlcblxuaWYgKGZpbGUpIHtcbiAgY29uc3QgZGVmID0gY3N2RGVmc1tmaWxlXTtcbiAgaWYgKGRlZikgZ2V0RFVNUFkoYXdhaXQgcmVhZENTVihmaWxlLCBkZWYpKTtcbn0gZWxzZSB7XG4gIGNvbnN0IGRlc3QgPSAnLi9kYXRhL2RiLmJpbidcbiAgY29uc3QgdGFibGVzID0gYXdhaXQgcGFyc2VBbGwoY3N2RGVmcyk7XG4gIGNvbnN0IGJsb2IgPSBUYWJsZS5jb25jYXRUYWJsZXModGFibGVzKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGRlc3QsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gIGNvbnNvbGUubG9nKGB3cm90ZSAke2Jsb2Iuc2l6ZX0gYnl0ZXMgdG8gJHtkZXN0fWApO1xufVxuXG4vKlxuaWYgKGZpbGUpIHtcbiAgY29uc3QgZGVmID0gY3N2RGVmc1tmaWxlXTtcbiAgaWYgKGRlZikgZ2V0RFVNUFkoYXdhaXQgcmVhZENTVihmaWxlLCBkZWYpKTtcbiAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYG5vIGRlZiBmb3IgXCIke2ZpbGV9XCJgKTtcbn0gZWxzZSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICBmb3IgKGNvbnN0IHQgb2YgdGFibGVzKSBhd2FpdCBnZXREVU1QWSh0KTtcbn1cbiovXG5cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RFVNUFkodDogVGFibGUpIHtcbiAgY29uc3QgbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0LnJvd3MubGVuZ3RoIC0gMzApKTtcbiAgY29uc3QgbSA9IG4gKyAzMDtcbiAgY29uc3QgZiA9IHQuc2NoZW1hLmZpZWxkcy5zbGljZSgwLCA4KTtcbiAgY29uc3QgYmxvYiA9IFRhYmxlLmNvbmNhdFRhYmxlcyhbdF0pO1xuICBjb25zb2xlLmxvZygnXFxuXFxuICAgICAgIEJFRk9SRTonKTtcbiAgdC5wcmludCh3aWR0aCwgZiwgbiwgbSk7XG4gIC8vdC5wcmludCh3aWR0aCwgbnVsbCwgMTApO1xuICAvL3Quc2NoZW1hLnByaW50KCk7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4nKVxuICBjb25zdCB1ID0gYXdhaXQgVGFibGUub3BlbkJsb2IoYmxvYik7XG4gIGNvbnNvbGUubG9nKCdcXG5cXG4gICAgICAgIEFGVEVSOicpO1xuICAvL3UuVW5pdC5wcmludCh3aWR0aCwgbnVsbCwgMTApO1xuICBPYmplY3QudmFsdWVzKHUpWzBdPy5wcmludCh3aWR0aCwgZiwgbiwgbSk7XG4gIC8vdS5Vbml0LnNjaGVtYS5wcmludCh3aWR0aCk7XG4gIC8vYXdhaXQgd3JpdGVGaWxlKCcuL3RtcC5iaW4nLCBibG9iLnN0cmVhbSgpLCB7IGVuY29kaW5nOiBudWxsIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNPLElBQU0sVUFBdUQ7QUFBQSxFQUNsRSw0QkFBNEI7QUFBQSxJQUMxQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxJQUM3QixhQUFhLENBQUM7QUFBQSxJQUNkLFdBQVc7QUFBQTtBQUFBLE1BRVQsV0FBVyxDQUFDLE1BQU8sT0FBTyxDQUFDLElBQUksTUFBTztBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsNEJBQTRCO0FBQUEsSUFDMUIsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUVBLGlDQUFpQztBQUFBLElBQy9CLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxnQ0FBZ0M7QUFBQSxJQUM5QixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0Esa0NBQWtDO0FBQUEsSUFDaEMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSw2QkFBNkI7QUFBQSxJQUMzQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EscUNBQXFDO0FBQUEsSUFDbkMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDBDQUEwQztBQUFBLElBQ3hDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsMENBQTBDO0FBQUEsSUFDeEMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxvQ0FBb0M7QUFBQTtBQUFBLElBRWxDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSxvQ0FBb0M7QUFBQSxJQUNsQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsbURBQW1EO0FBQUEsSUFDakQsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGtEQUFrRDtBQUFBLElBQ2hELE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSwyQ0FBMkM7QUFBQSxJQUN6QyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsbUNBQW1DO0FBQUEsSUFDakMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLHFDQUFxQztBQUFBLElBQ25DLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxzQ0FBc0M7QUFBQSxJQUNwQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsbUNBQW1DO0FBQUEsSUFDakMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDZCQUE2QjtBQUFBLElBQzNCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxrREFBa0Q7QUFBQSxJQUNoRCxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsaURBQWlEO0FBQUEsSUFDL0MsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGtDQUFrQztBQUFBLElBQ2hDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSx3Q0FBd0M7QUFBQSxJQUN0QyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsbUNBQW1DO0FBQUEsSUFDakMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLGdDQUFnQztBQUFBLElBQzlCLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSw4QkFBOEI7QUFBQSxJQUM1QixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBQ0EscURBQXFEO0FBQUEsSUFDbkQsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLG9EQUFvRDtBQUFBLElBQ2xELE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxtQ0FBbUM7QUFBQSxJQUNqQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsZ0RBQWdEO0FBQUEsSUFDOUMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSw2QkFBNkI7QUFBQSxJQUMzQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EseUNBQXlDO0FBQUEsSUFDdkMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDJDQUEyQztBQUFBLElBQ3pDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSw2Q0FBNkM7QUFBQSxJQUMzQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsNkJBQTZCO0FBQUEsSUFDM0IsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLCtDQUErQztBQUFBLElBQzdDLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2hDO0FBQUEsRUFDQSxtQ0FBbUM7QUFBQSxJQUNqQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0Esa0RBQWtEO0FBQUEsSUFDaEQsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLDhCQUE4QjtBQUFBLElBQzVCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLE9BQU8sUUFBUSxDQUFDO0FBQUEsRUFDekM7QUFDRjs7O0FDbExBLFNBQVMsZ0JBQWdCOzs7QUNGekIsSUFBTSxnQkFBZ0IsSUFBSSxZQUFZO0FBQ3RDLElBQU0sZ0JBQWdCLElBQUksWUFBWTtBQUkvQixTQUFTLGNBQWUsR0FBVyxNQUFtQixJQUFJLEdBQUc7QUFDbEUsTUFBSSxFQUFFLFFBQVEsSUFBSSxNQUFNLElBQUk7QUFDMUIsVUFBTUEsS0FBSSxFQUFFLFFBQVEsSUFBSTtBQUN4QixZQUFRLE1BQU0sR0FBR0EsRUFBQyxpQkFBaUIsRUFBRSxNQUFNQSxLQUFJLElBQUlBLEtBQUksRUFBRSxDQUFDLEtBQUs7QUFDL0QsVUFBTSxJQUFJLE1BQU0sVUFBVTtBQUFBLEVBQzVCO0FBQ0EsUUFBTSxRQUFRLGNBQWMsT0FBTyxJQUFJLElBQUk7QUFDM0MsTUFBSSxNQUFNO0FBQ1IsU0FBSyxJQUFJLE9BQU8sQ0FBQztBQUNqQixXQUFPLE1BQU07QUFBQSxFQUNmLE9BQU87QUFDTCxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRU8sU0FBUyxjQUFjLEdBQVcsR0FBaUM7QUFDeEUsTUFBSSxJQUFJO0FBQ1IsU0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUc7QUFBRTtBQUFBLEVBQUs7QUFDOUIsU0FBTyxDQUFDLGNBQWMsT0FBTyxFQUFFLE1BQU0sR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0RDtBQUVPLFNBQVMsY0FBZSxHQUF1QjtBQUVwRCxRQUFNLFFBQVEsQ0FBQyxDQUFDO0FBQ2hCLE1BQUksSUFBSSxJQUFJO0FBQ1YsU0FBSyxDQUFDO0FBQ04sVUFBTSxDQUFDLElBQUk7QUFBQSxFQUNiO0FBRUEsU0FBTyxHQUFHO0FBQ1IsUUFBSSxNQUFNLENBQUMsTUFBTTtBQUFLLFlBQU0sSUFBSSxNQUFNLG9CQUFvQjtBQUMxRCxVQUFNLENBQUM7QUFDUCxVQUFNLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQztBQUMzQixVQUFNO0FBQUEsRUFDUjtBQUVBLFNBQU8sSUFBSSxXQUFXLEtBQUs7QUFDN0I7QUFFTyxTQUFTLGNBQWUsR0FBVyxPQUFxQztBQUM3RSxRQUFNLElBQUksT0FBTyxNQUFNLENBQUMsQ0FBQztBQUN6QixRQUFNLE1BQU0sSUFBSTtBQUNoQixRQUFNLE9BQU8sSUFBSTtBQUNqQixRQUFNLE1BQU8sSUFBSSxNQUFPLENBQUMsS0FBSztBQUM5QixRQUFNLEtBQWUsTUFBTSxLQUFLLE1BQU0sTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUcsTUFBTTtBQUNwRSxNQUFJLFFBQVEsR0FBRztBQUFRLFVBQU0sSUFBSSxNQUFNLDBCQUEwQjtBQUNqRSxTQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sWUFBWSxJQUFJLE1BQU0sSUFBSSxJQUFJO0FBQ3hEO0FBRUEsU0FBUyxhQUFjLEdBQVcsR0FBVyxHQUFXO0FBQ3RELFNBQU8sSUFBSyxLQUFLLE9BQU8sSUFBSSxDQUFDO0FBQy9COzs7QUM3Qk8sSUFBTSxlQUFlO0FBQUEsRUFDMUI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRjtBQVdBLElBQU0sZUFBOEM7QUFBQSxFQUNsRCxDQUFDLFVBQVMsR0FBRztBQUFBLEVBQ2IsQ0FBQyxVQUFTLEdBQUc7QUFBQSxFQUNiLENBQUMsV0FBVSxHQUFHO0FBQUEsRUFDZCxDQUFDLFdBQVUsR0FBRztBQUFBLEVBQ2QsQ0FBQyxXQUFVLEdBQUc7QUFBQSxFQUNkLENBQUMsV0FBVSxHQUFHO0FBQ2hCO0FBRU8sU0FBUyxtQkFDZCxLQUNBLEtBQ3FCO0FBQ3JCLE1BQUksTUFBTSxHQUFHO0FBRVgsUUFBSSxPQUFPLFFBQVEsT0FBTyxLQUFLO0FBRTdCLGFBQU87QUFBQSxJQUNULFdBQVcsT0FBTyxVQUFVLE9BQU8sT0FBTztBQUV4QyxhQUFPO0FBQUEsSUFDVCxXQUFXLE9BQU8sZUFBZSxPQUFPLFlBQVk7QUFFbEQsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGLE9BQU87QUFDTCxRQUFJLE9BQU8sS0FBSztBQUVkLGFBQU87QUFBQSxJQUNULFdBQVcsT0FBTyxPQUFPO0FBRXZCLGFBQU87QUFBQSxJQUNULFdBQVcsT0FBTyxZQUFZO0FBRTVCLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFDVDtBQUVPLFNBQVMsZ0JBQWlCLE1BQXNDO0FBQ3JFLFVBQVEsTUFBTTtBQUFBLElBQ1osS0FBSztBQUFBLElBQ0wsS0FBSztBQUFBLElBQ0wsS0FBSztBQUFBLElBQ0wsS0FBSztBQUFBLElBQ0wsS0FBSztBQUFBLElBQ0wsS0FBSztBQUNILGFBQU87QUFBQSxJQUNUO0FBQ0UsYUFBTztBQUFBLEVBQ1g7QUFDRjtBQUVPLFNBQVMsWUFBYSxNQUFrQztBQUM3RCxTQUFPLFNBQVM7QUFDbEI7QUFFTyxTQUFTLGFBQWMsTUFBbUM7QUFDL0QsU0FBTyxTQUFTO0FBQ2xCO0FBRU8sU0FBUyxlQUFnQixNQUFxQztBQUNuRSxTQUFPLFNBQVM7QUFDbEI7QUFvQk8sSUFBTSxlQUFOLE1BQTBEO0FBQUEsRUFDdEQsT0FBc0I7QUFBQSxFQUN0QixRQUFnQixhQUFhLGNBQWE7QUFBQSxFQUMxQztBQUFBLEVBQ0E7QUFBQSxFQUNBLFFBQWM7QUFBQSxFQUNkLE9BQWE7QUFBQSxFQUNiLE1BQVk7QUFBQSxFQUNaLFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsWUFBWSxPQUE2QjtBQUN2QyxVQUFNLEVBQUUsT0FBTyxNQUFNLE1BQU0sVUFBVSxRQUFRLElBQUk7QUFDakQsUUFBSSxDQUFDLGVBQWUsSUFBSTtBQUN0QixZQUFNLElBQUksTUFBTSxnQ0FBZ0M7QUFHbEQsU0FBSyxRQUFRO0FBQ2IsU0FBSyxPQUFPO0FBQ1osU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQVMsR0FBVyxHQUFRLEdBQXVCO0FBR2pELFFBQUksS0FBSztBQUFVLGFBQU8sS0FBSyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQy9DLFFBQUksRUFBRSxXQUFXLEdBQUc7QUFBRyxhQUFPLEVBQUUsTUFBTSxHQUFHLEVBQUU7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLFVBQVUsR0FBVyxPQUFxQztBQUN4RCxXQUFPLGNBQWMsR0FBRyxLQUFLO0FBQUEsRUFDL0I7QUFBQSxFQUVBLFlBQXVCO0FBQ3JCLFdBQU8sQ0FBQyxnQkFBZSxHQUFHLGNBQWMsS0FBSyxJQUFJLENBQUM7QUFBQSxFQUNwRDtBQUFBLEVBRUEsYUFBYSxHQUF1QjtBQUNsQyxXQUFPLGNBQWMsQ0FBQztBQUFBLEVBQ3hCO0FBQ0Y7QUFFTyxJQUFNLGdCQUFOLE1BQTJEO0FBQUEsRUFDdkQ7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQSxPQUFhO0FBQUEsRUFDYixNQUFZO0FBQUEsRUFDWixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFlBQVksT0FBNkI7QUFDdkMsVUFBTSxFQUFFLE1BQU0sT0FBTyxNQUFNLFNBQVMsSUFBSTtBQUN4QyxRQUFJLENBQUMsZ0JBQWdCLElBQUk7QUFDdkIsWUFBTSxJQUFJLE1BQU0sR0FBRyxJQUFJLDBCQUEwQjtBQUduRCxTQUFLLFFBQVE7QUFDYixTQUFLLE9BQU87QUFDWixTQUFLLE9BQU87QUFDWixTQUFLLFFBQVEsYUFBYSxLQUFLLElBQUk7QUFDbkMsU0FBSyxRQUFRLGFBQWEsS0FBSyxJQUFJO0FBQ25DLFNBQUssV0FBVztBQUFBLEVBQ2xCO0FBQUEsRUFFQSxTQUFTLEdBQVcsR0FBUSxHQUF1QjtBQUNoRCxXQUFPLEtBQUssV0FBVyxLQUFLLFNBQVMsR0FBRyxHQUFHLENBQUMsSUFDM0MsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJO0FBQUEsRUFDekI7QUFBQSxFQUVBLFVBQVUsR0FBVyxHQUFlLE1BQWtDO0FBQ3BFLFlBQVEsS0FBSyxNQUFNO0FBQUEsTUFDakIsS0FBSztBQUNILGVBQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxHQUFHLENBQUM7QUFBQSxNQUM1QixLQUFLO0FBQ0gsZUFBTyxDQUFDLEtBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUFBLE1BQzdCLEtBQUs7QUFDSCxlQUFPLENBQUMsS0FBSyxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUM7QUFBQSxNQUNuQyxLQUFLO0FBQ0gsZUFBTyxDQUFDLEtBQUssVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDO0FBQUEsTUFDcEMsS0FBSztBQUNILGVBQU8sQ0FBQyxLQUFLLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQztBQUFBLE1BQ25DLEtBQUs7QUFDSCxlQUFPLENBQUMsS0FBSyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUM7QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFlBQXVCO0FBQ3JCLFdBQU8sQ0FBQyxLQUFLLE1BQU0sR0FBRyxjQUFjLEtBQUssSUFBSSxDQUFDO0FBQUEsRUFDaEQ7QUFBQSxFQUVBLGFBQWEsR0FBdUI7QUFDbEMsVUFBTSxRQUFRLElBQUksV0FBVyxLQUFLLEtBQUs7QUFDdkMsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLE9BQU87QUFDOUIsWUFBTSxDQUFDLElBQUssTUFBTyxJQUFJLElBQU07QUFDL0IsV0FBTztBQUFBLEVBQ1Q7QUFFRjtBQUVPLElBQU0sWUFBTixNQUF1RDtBQUFBLEVBQ25ELE9BQW1CO0FBQUEsRUFDbkIsUUFBZ0IsYUFBYSxXQUFVO0FBQUEsRUFDdkM7QUFBQSxFQUNBO0FBQUEsRUFDQSxRQUFjO0FBQUEsRUFDZCxPQUFhO0FBQUEsRUFDYixNQUFZO0FBQUEsRUFDWixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFlBQVksT0FBNkI7QUFDdkMsVUFBTSxFQUFFLE1BQU0sT0FBTyxNQUFNLFNBQVMsSUFBSTtBQUN4QyxRQUFJLENBQUMsWUFBWSxJQUFJO0FBQUcsWUFBTSxJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQWE7QUFDNUQsU0FBSyxRQUFRO0FBQ2IsU0FBSyxPQUFPO0FBQ1osU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQVMsR0FBVyxHQUFRLEdBQXVCO0FBQ2pELFFBQUksS0FBSztBQUFVLGFBQU8sS0FBSyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQy9DLFFBQUksQ0FBQztBQUFHLGFBQU87QUFDZixXQUFPLE9BQU8sQ0FBQztBQUFBLEVBQ2pCO0FBQUEsRUFFQSxVQUFVLEdBQVcsT0FBcUM7QUFDeEQsV0FBTyxjQUFjLEdBQUcsS0FBSztBQUFBLEVBQy9CO0FBQUEsRUFFQSxZQUF1QjtBQUNyQixXQUFPLENBQUMsYUFBWSxHQUFHLGNBQWMsS0FBSyxJQUFJLENBQUM7QUFBQSxFQUNqRDtBQUFBLEVBRUEsYUFBYSxHQUF1QjtBQUNsQyxRQUFJLENBQUM7QUFBRyxhQUFPLElBQUksV0FBVyxDQUFDO0FBQy9CLFdBQU8sY0FBYyxDQUFDO0FBQUEsRUFDeEI7QUFDRjtBQUdPLElBQU0sYUFBTixNQUFxRDtBQUFBLEVBQ2pELE9BQW9CO0FBQUEsRUFDcEIsUUFBZ0IsYUFBYSxZQUFXO0FBQUEsRUFDeEM7QUFBQSxFQUNBO0FBQUEsRUFDQSxRQUFjO0FBQUEsRUFDZDtBQUFBLEVBQ0E7QUFBQSxFQUNBLFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsWUFBWSxPQUE2QjtBQUN2QyxVQUFNLEVBQUUsTUFBTSxPQUFPLE1BQU0sS0FBSyxNQUFNLFNBQVMsSUFBSTtBQUduRCxRQUFJLENBQUMsYUFBYSxJQUFJO0FBQUcsWUFBTSxJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQWE7QUFDN0QsUUFBSSxPQUFPLFNBQVM7QUFBVSxZQUFNLElBQUksTUFBTSxvQkFBb0I7QUFDbEUsUUFBSSxPQUFPLFFBQVE7QUFBVSxZQUFNLElBQUksTUFBTSxtQkFBbUI7QUFDaEUsU0FBSyxPQUFPO0FBQ1osU0FBSyxNQUFNO0FBQ1gsU0FBSyxRQUFRO0FBQ2IsU0FBSyxPQUFPO0FBQ1osU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQVMsR0FBVyxHQUFRLEdBQXdCO0FBQ2xELFFBQUksS0FBSztBQUFVLGFBQU8sS0FBSyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQy9DLFFBQUksQ0FBQyxLQUFLLE1BQU07QUFBSyxhQUFPO0FBQzVCLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxVQUFVLEdBQVcsT0FBc0M7QUFDekQsV0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDO0FBQUEsRUFDbkM7QUFBQSxFQUVBLFlBQXVCO0FBQ3JCLFdBQU8sQ0FBQyxjQUFhLEdBQUcsY0FBYyxLQUFLLElBQUksQ0FBQztBQUFBLEVBQ2xEO0FBQUEsRUFFQSxhQUFhLEdBQW9CO0FBQy9CLFdBQU8sSUFBSSxLQUFLLE9BQU87QUFBQSxFQUN6QjtBQUNGO0FBUU8sU0FBUyxVQUFXLEdBQVcsR0FBbUI7QUFFdkQsU0FBUSxFQUFFLFFBQVEsRUFBRSxVQUNoQixFQUFFLE9BQU8sTUFBTSxFQUFFLE9BQU8sTUFDekIsRUFBRSxRQUFRLEVBQUU7QUFDakI7QUFTTyxTQUFTLGFBQ2QsTUFDQSxPQUNBLFdBQ0EsTUFDQSxVQUNBLFlBQ2lCO0FBQ2pCLFFBQU0sUUFBUTtBQUFBLElBQ1o7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsTUFBTTtBQUFBO0FBQUEsSUFFTixTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVixPQUFPO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsRUFDUDtBQUNBLE1BQUksU0FBUztBQUViLGFBQVcsS0FBSyxNQUFNO0FBQ3BCLFVBQU0sSUFBSSxNQUFNLFdBQVcsTUFBTSxTQUFTLEVBQUUsS0FBSyxHQUFHLEdBQUcsVUFBVSxJQUFJLEVBQUUsS0FBSztBQUM1RSxRQUFJLENBQUM7QUFBRztBQUVSLGFBQVM7QUFDVCxVQUFNLElBQUksT0FBTyxDQUFDO0FBQ2xCLFFBQUksT0FBTyxNQUFNLENBQUMsR0FBRztBQUVuQixZQUFNLE9BQU87QUFDYixhQUFPO0FBQUEsSUFDVCxXQUFXLENBQUMsT0FBTyxVQUFVLENBQUMsR0FBRztBQUMvQixjQUFRLEtBQUssV0FBVyxLQUFLLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsVUFBVTtBQUFBLElBQzNFLFdBQVcsQ0FBQyxPQUFPLGNBQWMsQ0FBQyxHQUFHO0FBRW5DLFlBQU0sV0FBVztBQUNqQixZQUFNLFdBQVc7QUFBQSxJQUNuQixPQUFPO0FBQ0wsVUFBSSxJQUFJLE1BQU07QUFBVSxjQUFNLFdBQVc7QUFDekMsVUFBSSxJQUFJLE1BQU07QUFBVSxjQUFNLFdBQVc7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFFQSxNQUFJLENBQUMsUUFBUTtBQUdYLFdBQU87QUFBQSxFQUNUO0FBRUEsTUFBSSxNQUFNLGFBQWEsS0FBSyxNQUFNLGFBQWEsR0FBRztBQUVoRCxVQUFNLE9BQU87QUFDYixVQUFNLE1BQU07QUFDWixVQUFNLE9BQU8sS0FBSyxNQUFNLE1BQU07QUFDOUIsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLE1BQU0sV0FBWSxVQUFVO0FBRTlCLFVBQU0sT0FBTyxtQkFBbUIsTUFBTSxVQUFVLE1BQU0sUUFBUTtBQUM5RCxRQUFJLFNBQVMsTUFBTTtBQUNqQixZQUFNLE9BQU87QUFDYixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFHQSxRQUFNLE9BQU87QUFDYixTQUFPO0FBQ1Q7QUFFTyxTQUFTLFNBQVUsTUFBMEI7QUFDbEQsVUFBUSxLQUFLLE1BQU07QUFBQSxJQUNqQixLQUFLO0FBQ0gsWUFBTSxJQUFJLE1BQU0sMkNBQTJDO0FBQUEsSUFDN0QsS0FBSztBQUNILGFBQU8sSUFBSSxhQUFhLElBQUk7QUFBQSxJQUM5QixLQUFLO0FBQ0gsYUFBTyxJQUFJLFdBQVcsSUFBSTtBQUFBLElBQzVCLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLEtBQUs7QUFDSCxhQUFPLElBQUksY0FBYyxJQUFJO0FBQUEsSUFDL0IsS0FBSztBQUNILGFBQU8sSUFBSSxVQUFVLElBQUk7QUFBQSxFQUM3QjtBQUNGOzs7QUMvYU8sU0FBUyxVQUFVLE1BQWNDLFNBQVEsSUFBSSxRQUFRLEdBQUc7QUFDN0QsUUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLFlBQVksS0FBSztBQUNoRCxRQUFNLFlBQVksS0FBSyxTQUFTO0FBQ2hDLFFBQU0sYUFBYUEsVUFBUyxZQUFZO0FBQ3hDLFNBQU87QUFBQSxJQUNMLEdBQUcsRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksR0FBRyxPQUFPLFVBQVUsQ0FBQyxHQUFHLEVBQUU7QUFBQSxJQUMxRCxHQUFHLEVBQUUsR0FBRyxHQUFHLE9BQU9BLFNBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRTtBQUFBLEVBQ25DO0FBQ0Y7QUFHQSxTQUFTLFlBQWEsT0FBZTtBQUNuQyxVQUFRLE9BQU87QUFBQSxJQUNiLEtBQUs7QUFBRyxhQUFPLEVBQUUsSUFBSSxVQUFLLElBQUksVUFBSyxJQUFJLFVBQUssSUFBSSxVQUFLLElBQUksU0FBSTtBQUFBLElBQzdELEtBQUs7QUFBSSxhQUFPLEVBQUUsSUFBSSxVQUFLLElBQUksVUFBSyxJQUFJLFVBQUssSUFBSSxVQUFLLElBQUksU0FBSTtBQUFBLElBQzlELEtBQUs7QUFBSSxhQUFPLEVBQUUsSUFBSSxVQUFLLElBQUksVUFBSyxJQUFJLFVBQUssSUFBSSxVQUFLLElBQUksU0FBSTtBQUFBLElBQzlEO0FBQVMsWUFBTSxJQUFJLE1BQU0sZUFBZTtBQUFBLEVBRTFDO0FBQ0Y7OztBQ0tPLElBQU0sU0FBTixNQUFNLFFBQU87QUFBQSxFQUNUO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDVCxZQUFZLEVBQUUsU0FBUyxRQUFBQyxTQUFRLE1BQU0sVUFBVSxHQUFlO0FBQzVELFNBQUssT0FBTztBQUNaLFNBQUssVUFBVSxDQUFDLEdBQUcsT0FBTyxFQUFFLEtBQUssU0FBUztBQUMxQyxTQUFLLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBSyxFQUFFLElBQUk7QUFDMUMsU0FBSyxnQkFBZ0IsT0FBTyxZQUFZLEtBQUssUUFBUSxJQUFJLE9BQUssQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDMUUsU0FBSyxhQUFhO0FBQ2xCLFNBQUssYUFBYSxRQUFRO0FBQUEsTUFDeEIsQ0FBQyxHQUFHLE1BQU0sS0FBSyxFQUFFLFNBQVM7QUFBQSxNQUMxQixLQUFLLEtBQUssWUFBWSxDQUFDO0FBQUE7QUFBQSxJQUN6QjtBQUVBLFFBQUksSUFBaUI7QUFDckIsZUFBVyxLQUFLLFNBQVM7QUFDdkIsY0FBUSxFQUFFLE1BQU07QUFBQSxRQUNkO0FBQUEsUUFDQTtBQUNDO0FBQUEsUUFDRDtBQUVDLFlBQUUsU0FBUztBQUNYLGNBQUksRUFBRSxTQUFTO0FBQUs7QUFDcEI7QUFBQSxRQUNEO0FBRUMsWUFBRSxTQUFTO0FBQ1gsZUFBSyxFQUFFO0FBQ1A7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUNBLFNBQUssZUFBZSxRQUFRLE9BQU8sT0FBSyxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUU7QUFDaEUsU0FBSyxZQUFZLFFBQVEsT0FBTyxPQUFLLFlBQVksRUFBRSxJQUFJLENBQUMsRUFBRTtBQUFBLEVBRTVEO0FBQUEsRUFFQSxPQUFPLFdBQVksUUFBNkI7QUFDOUMsUUFBSSxJQUFJO0FBQ1IsUUFBSTtBQUNKLFFBQUk7QUFDSixVQUFNLFFBQVEsSUFBSSxXQUFXLE1BQU07QUFDbkMsS0FBQyxNQUFNLElBQUksSUFBSSxjQUFjLEdBQUcsS0FBSztBQUNyQyxTQUFLO0FBRUwsVUFBTSxPQUFPO0FBQUEsTUFDWDtBQUFBLE1BQ0EsU0FBUyxDQUFDO0FBQUEsTUFDVixRQUFRLENBQUM7QUFBQSxNQUNULFdBQVc7QUFBQSxNQUNYLFdBQVcsQ0FBQztBQUFBO0FBQUEsSUFDZDtBQUVBLFVBQU0sWUFBWSxNQUFNLEdBQUcsSUFBSyxNQUFNLEdBQUcsS0FBSztBQUU5QyxRQUFJLFFBQVE7QUFFWixXQUFPLFFBQVEsV0FBVztBQUN4QixZQUFNLE9BQU8sTUFBTSxHQUFHO0FBQ3RCLE9BQUMsTUFBTSxJQUFJLElBQUksY0FBYyxHQUFHLEtBQUs7QUFDckMsWUFBTSxJQUFJO0FBQUEsUUFDUjtBQUFBLFFBQU87QUFBQSxRQUFNO0FBQUEsUUFDYixPQUFPO0FBQUEsUUFBTSxLQUFLO0FBQUEsUUFBTSxNQUFNO0FBQUEsUUFDOUIsT0FBTztBQUFBLFFBQUssU0FBUztBQUFBLE1BQ3ZCO0FBQ0EsV0FBSztBQUNMLFVBQUk7QUFFSixjQUFRLE1BQU07QUFBQSxRQUNaO0FBQ0UsY0FBSSxJQUFJLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUM3QjtBQUFBLFFBQ0Y7QUFDRSxjQUFJLElBQUksVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDO0FBQzFCO0FBQUEsUUFDRjtBQUNFLGdCQUFNLE1BQU0sS0FBSztBQUNqQixnQkFBTSxPQUFPLE1BQU0sTUFBTTtBQUN6QixjQUFJLElBQUksV0FBVyxFQUFFLEdBQUcsR0FBRyxLQUFLLEtBQUssQ0FBQztBQUN0QztBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQ0UsY0FBSSxJQUFJLGNBQWMsRUFBRSxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUM7QUFDeEM7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUNFLGNBQUksSUFBSSxjQUFjLEVBQUUsR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO0FBQ3hDO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFDRSxjQUFJLElBQUksY0FBYyxFQUFFLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztBQUN4QztBQUFBLFFBQ0Y7QUFDRSxnQkFBTSxJQUFJLE1BQU0sZ0JBQWdCLElBQUksRUFBRTtBQUFBLE1BQzFDO0FBQ0EsV0FBSyxRQUFRLEtBQUssQ0FBQztBQUNuQixXQUFLLE9BQU8sS0FBSyxFQUFFLElBQUk7QUFDdkI7QUFBQSxJQUNGO0FBQ0EsV0FBTyxJQUFJLFFBQU8sSUFBSTtBQUFBLEVBQ3hCO0FBQUEsRUFFQSxjQUNJLEdBQ0EsUUFDQSxTQUNhO0FBQ2YsVUFBTSxNQUFNLFVBQVUsS0FBSyxVQUFVLFFBQVEsVUFBVSxRQUFTO0FBRWhFLFFBQUksWUFBWTtBQUNoQixVQUFNLFFBQVEsSUFBSSxXQUFXLE1BQU07QUFDbkMsVUFBTSxPQUFPLElBQUksU0FBUyxNQUFNO0FBQ2hDLFVBQU0sTUFBVyxFQUFFLFFBQVE7QUFDM0IsVUFBTSxVQUFVLEtBQUssYUFBYTtBQUNsQyxlQUFXLEtBQUssS0FBSyxTQUFTO0FBQzVCLFVBQUksRUFBRSxXQUFXLFFBQVEsRUFBRSxXQUFXO0FBQVc7QUFDakQsVUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsVUFBVSxHQUFHLE9BQU8sSUFBSTtBQUUxQyxVQUFJLEVBQUU7QUFDSixlQUFRLEVBQUUsU0FBUyxPQUFPLEVBQUUsUUFBUSxVQUFXLElBQUk7QUFFckQsV0FBSztBQUNMLG1CQUFhO0FBQ2IsVUFBSSxFQUFFLElBQUksSUFBSTtBQUFBLElBQ2hCO0FBS0EsV0FBTyxDQUFDLEtBQUssU0FBUztBQUFBLEVBQ3hCO0FBQUEsRUFFQSxTQUFVLEdBQVFBLFNBQTRCO0FBQzVDLFdBQU8sT0FBTyxZQUFZQSxRQUFPLElBQUksT0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsRUFDdEQ7QUFBQSxFQUVBLGtCQUF5QjtBQUd2QixRQUFJLEtBQUssUUFBUSxTQUFTO0FBQU8sWUFBTSxJQUFJLE1BQU0sYUFBYTtBQUM5RCxVQUFNLFFBQVEsSUFBSSxXQUFXO0FBQUEsTUFDM0IsR0FBRyxjQUFjLEtBQUssSUFBSTtBQUFBLE1BQzFCLEtBQUssUUFBUSxTQUFTO0FBQUEsTUFDckIsS0FBSyxRQUFRLFdBQVc7QUFBQSxNQUN6QixHQUFHLEtBQUssUUFBUSxRQUFRLE9BQUssRUFBRSxVQUFVLENBQUM7QUFBQSxJQUM1QyxDQUFDO0FBQ0QsV0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUN6QjtBQUFBLEVBRUEsYUFBYyxHQUFjO0FBQzFCLFVBQU0sUUFBUSxJQUFJLFdBQVcsS0FBSyxVQUFVO0FBQzVDLFFBQUksSUFBSTtBQUNSLFVBQU0sVUFBVSxLQUFLLGFBQWE7QUFDbEMsVUFBTSxZQUF3QixDQUFDLEtBQUs7QUFDcEMsZUFBVyxLQUFLLEtBQUssU0FBUztBQUM1QixZQUFNLElBQUksRUFBRSxFQUFFLElBQUk7QUFDbEIsVUFBSSxFQUFFLHVCQUFzQjtBQUFBLE1BQUM7QUFDN0IsY0FBTyxFQUFFLE1BQU07QUFBQSxRQUNiO0FBQW9CO0FBQ2xCLGtCQUFNLElBQWdCLEVBQUUsYUFBYSxDQUFXO0FBQ2hELGlCQUFLLEVBQUU7QUFDUCxzQkFBVSxLQUFLLENBQUM7QUFBQSxVQUNsQjtBQUFFO0FBQUEsUUFDRjtBQUFpQjtBQUNmLGtCQUFNLElBQWdCLEVBQUUsYUFBYSxDQUFXO0FBQ2hELGlCQUFLLEVBQUU7QUFDUCxzQkFBVSxLQUFLLENBQUM7QUFBQSxVQUNsQjtBQUFFO0FBQUEsUUFFRjtBQUNFLGdCQUFNLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBWTtBQUt2QyxjQUFJLEVBQUUsU0FBUyxPQUFPLEVBQUUsUUFBUTtBQUFTO0FBQ3pDO0FBQUEsUUFFRjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQ0UsZ0JBQU0sUUFBUSxFQUFFLGFBQWEsQ0FBVztBQUN4QyxnQkFBTSxJQUFJLE9BQU8sQ0FBQztBQUNsQixlQUFLLEVBQUU7QUFDUDtBQUFBLFFBRUY7QUFDRSxnQkFBTSxJQUFJLE1BQU0sa0JBQWtCO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBS0EsV0FBTyxJQUFJLEtBQUssU0FBUztBQUFBLEVBQzNCO0FBQUEsRUFFQSxNQUFPQyxTQUFRLElBQVU7QUFDdkIsVUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLFVBQVUsS0FBSyxNQUFNQSxRQUFPLEVBQUU7QUFDbkQsWUFBUSxJQUFJLElBQUk7QUFDaEIsVUFBTSxFQUFFLFlBQVksV0FBVyxjQUFjLFdBQVcsSUFBSTtBQUM1RCxZQUFRLElBQUksRUFBRSxZQUFZLFdBQVcsY0FBYyxXQUFXLENBQUM7QUFDL0QsWUFBUSxNQUFNLEtBQUssU0FBUztBQUFBLE1BQzFCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUNELFlBQVEsSUFBSSxJQUFJO0FBQUEsRUFFbEI7QUFBQTtBQUFBO0FBSUY7OztBQ3JQTyxJQUFNLFFBQU4sTUFBTSxPQUFNO0FBQUEsRUFFakIsWUFDVyxNQUNBLFFBQ1Q7QUFGUztBQUNBO0FBQUEsRUFFWDtBQUFBLEVBTEEsSUFBSSxPQUFnQjtBQUFFLFdBQU8sVUFBVSxLQUFLLE9BQU8sSUFBSTtBQUFBLEVBQUs7QUFBQSxFQU81RCxZQUF3QztBQUV0QyxVQUFNLGVBQWUsS0FBSyxPQUFPLGdCQUFnQjtBQUVqRCxVQUFNLGlCQUFpQixJQUFJLGFBQWEsT0FBTyxLQUFLO0FBQ3BELFVBQU0sVUFBVSxLQUFLLEtBQUssUUFBUSxPQUFLLEtBQUssT0FBTyxhQUFhLENBQUMsQ0FBQztBQVNsRSxVQUFNLFVBQVUsSUFBSSxLQUFLLE9BQU87QUFDaEMsVUFBTSxlQUFlLElBQUksUUFBUSxPQUFPLEtBQUs7QUFFN0MsV0FBTztBQUFBLE1BQ0wsSUFBSSxZQUFZO0FBQUEsUUFDZCxLQUFLLEtBQUs7QUFBQSxRQUNWLGFBQWEsT0FBTztBQUFBLFFBQ3BCLFFBQVEsT0FBTztBQUFBLE1BQ2pCLENBQUM7QUFBQSxNQUNELElBQUksS0FBSztBQUFBLFFBQ1A7QUFBQSxRQUNBLElBQUksWUFBWSxhQUFhO0FBQUE7QUFBQSxNQUMvQixDQUFDO0FBQUEsTUFDRCxJQUFJLEtBQUs7QUFBQSxRQUNQO0FBQUEsUUFDQSxJQUFJLFdBQVcsV0FBVztBQUFBLE1BQzVCLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTyxhQUFjLFFBQXVCO0FBQzFDLFVBQU0sV0FBVyxJQUFJLFlBQVksSUFBSSxPQUFPLFNBQVMsQ0FBQztBQUN0RCxVQUFNLGFBQXFCLENBQUM7QUFDNUIsVUFBTSxVQUFrQixDQUFDO0FBRXpCLFVBQU0sUUFBUSxPQUFPLElBQUksT0FBSyxFQUFFLFVBQVUsQ0FBQztBQUMzQyxhQUFTLENBQUMsSUFBSSxNQUFNO0FBQ3BCLGVBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxTQUFTLElBQUksQ0FBQyxLQUFLLE1BQU0sUUFBUSxHQUFHO0FBRXpELGVBQVMsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDO0FBQzdCLGlCQUFXLEtBQUssT0FBTztBQUN2QixjQUFRLEtBQUssSUFBSTtBQUFBLElBQ25CO0FBRUEsV0FBTyxJQUFJLEtBQUssQ0FBQyxVQUFVLEdBQUcsWUFBWSxHQUFHLE9BQU8sQ0FBQztBQUFBLEVBQ3ZEO0FBQUEsRUFFQSxhQUFhLFNBQVUsTUFBNEM7QUFDakUsUUFBSSxLQUFLLE9BQU8sTUFBTTtBQUFHLFlBQU0sSUFBSSxNQUFNLGlCQUFpQjtBQUMxRCxVQUFNLFlBQVksSUFBSSxZQUFZLE1BQU0sS0FBSyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUM7QUFHekUsUUFBSSxLQUFLO0FBQ1QsVUFBTSxRQUFRLElBQUk7QUFBQSxNQUNoQixNQUFNLEtBQUssTUFBTSxJQUFJLE1BQU0sWUFBWSxFQUFFLEVBQUUsWUFBWTtBQUFBLElBQ3pEO0FBRUEsVUFBTSxTQUFzQixDQUFDO0FBRTdCLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxLQUFLO0FBQ2xDLFlBQU0sS0FBSyxJQUFJO0FBQ2YsWUFBTSxVQUFVLE1BQU0sRUFBRTtBQUN4QixZQUFNLFFBQVEsTUFBTSxLQUFLLENBQUM7QUFDMUIsYUFBTyxDQUFDLElBQUksRUFBRSxTQUFTLFlBQVksS0FBSyxNQUFNLElBQUksTUFBTSxLQUFLLEVBQUU7QUFBQSxJQUNqRTtBQUFDO0FBRUQsYUFBUyxJQUFJLEdBQUcsSUFBSSxXQUFXLEtBQUs7QUFDbEMsYUFBTyxDQUFDLEVBQUUsV0FBVyxLQUFLLE1BQU0sSUFBSSxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQztBQUFBLElBQzVEO0FBQUM7QUFDRCxVQUFNLFNBQVMsTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxNQUFNO0FBRXJELGFBQU8sS0FBSyxTQUFTLEVBQUU7QUFBQSxJQUN6QixDQUFDLENBQUM7QUFDRixXQUFPLE9BQU8sWUFBWSxPQUFPLElBQUksT0FBSyxDQUFDLEVBQUUsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQUEsRUFDL0Q7QUFBQSxFQUVBLGFBQWEsU0FBVTtBQUFBLElBQ3JCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEdBQThCO0FBQzVCLFVBQU0sU0FBUyxPQUFPLFdBQVcsTUFBTSxXQUFXLFlBQVksQ0FBQztBQUMvRCxRQUFJLE1BQU07QUFDVixRQUFJLFVBQVU7QUFDZCxVQUFNLE9BQWMsQ0FBQztBQUVyQixVQUFNLGFBQWEsTUFBTSxTQUFTLFlBQVk7QUFDOUMsWUFBUSxJQUFJLGNBQWMsT0FBTyxPQUFPLE9BQU8sSUFBSSxRQUFRO0FBQzNELFdBQU8sVUFBVSxTQUFTO0FBQ3hCLFlBQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxPQUFPLGNBQWMsS0FBSyxZQUFZLFNBQVM7QUFDbkUsV0FBSyxLQUFLLEdBQUc7QUFDYixhQUFPO0FBQUEsSUFDVDtBQUVBLFdBQU8sSUFBSSxPQUFNLE1BQU0sTUFBTTtBQUFBLEVBQy9CO0FBQUEsRUFHQSxNQUNFQyxTQUFnQixJQUNoQkMsVUFBa0MsTUFDbEMsSUFBaUIsTUFDakIsSUFBaUIsTUFDWDtBQUNOLFVBQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxVQUFVLEtBQUssTUFBTUQsUUFBTyxFQUFFO0FBQ25ELFVBQU0sT0FBTyxNQUFNLE9BQU8sS0FBSyxPQUM3QixNQUFNLE9BQU8sS0FBSyxLQUFLLE1BQU0sR0FBRyxDQUFDLElBQ2pDLEtBQUssS0FBSyxNQUFNLEdBQUcsQ0FBQztBQUV0QixVQUFNLENBQUMsT0FBTyxPQUFPLElBQUlDLFVBQ3ZCLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBVyxLQUFLLE9BQU8sU0FBUyxHQUFHQSxPQUFNLENBQUMsR0FBR0EsT0FBTSxJQUM5RCxDQUFDLE1BQU0sS0FBSyxPQUFPLE1BQU07QUFHM0IsWUFBUSxJQUFJLElBQUk7QUFDaEIsWUFBUSxNQUFNLE9BQU8sT0FBTztBQUM1QixZQUFRLElBQUksSUFBSTtBQUFBLEVBQ2xCO0FBQUEsRUFFQSxRQUFTLEdBQWdCLFlBQVksT0FBTyxRQUE0QjtBQUV0RSxlQUFZLFdBQVcsUUFBUSxNQUFNO0FBQ3JDLFVBQU0sS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLEtBQUssS0FBSyxNQUFNO0FBQ2pELFVBQU0sTUFBTSxLQUFLLEtBQUssQ0FBQztBQUN2QixVQUFNLE1BQWdCLENBQUM7QUFDdkIsVUFBTSxNQUFxQixTQUFTLENBQUMsSUFBSTtBQUN6QyxVQUFNLE1BQU0sVUFBVSxLQUFLLE1BQU0sS0FBSyxHQUFHO0FBQ3pDLFVBQU0sSUFBSSxLQUFLO0FBQUEsTUFDYixHQUFHLEtBQUssT0FBTyxRQUNkLE9BQU8sT0FBSyxhQUFhLElBQUksRUFBRSxJQUFJLENBQUMsRUFDcEMsSUFBSSxPQUFLLEVBQUUsS0FBSyxTQUFTLENBQUM7QUFBQSxJQUM3QjtBQUNBLFFBQUksQ0FBQztBQUNILFVBQUksS0FBSyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsb0JBQW9CLFdBQVc7QUFBQSxTQUMxRDtBQUNILFVBQUksS0FBSyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxVQUFVO0FBQzdDLGlCQUFXLEtBQUssS0FBSyxPQUFPLFNBQVM7QUFDbkMsY0FBTSxRQUFRLElBQUksRUFBRSxJQUFJO0FBQ3hCLGNBQU0sSUFBSSxFQUFFLEtBQUssU0FBUyxHQUFHLEdBQUc7QUFDaEMsZ0JBQVEsT0FBTyxPQUFPO0FBQUEsVUFDcEIsS0FBSztBQUNILGdCQUFJO0FBQU8sa0JBQUksR0FBRyxDQUFDLFlBQVksTUFBTTtBQUFBLHFCQUM1QjtBQUFXLGtCQUFJLEtBQUssQ0FBQyxhQUFhLGFBQWEsT0FBTztBQUMvRDtBQUFBLFVBQ0YsS0FBSztBQUNILGdCQUFJO0FBQU8sa0JBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxJQUFJLFFBQVE7QUFBQSxxQkFDbEM7QUFBVyxrQkFBSSxLQUFLLENBQUMsT0FBTyxXQUFXO0FBQ2hEO0FBQUEsVUFDRixLQUFLO0FBQ0gsZ0JBQUk7QUFBTyxrQkFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLElBQUksS0FBSztBQUFBLHFCQUMvQjtBQUFXLGtCQUFJLEtBQUssQ0FBQyxZQUFPLFdBQVc7QUFDaEQ7QUFBQSxVQUNGLEtBQUs7QUFDSCxnQkFBSTtBQUFPLGtCQUFJLGNBQWMsS0FBSyxVQUFVLE9BQU8sV0FBVztBQUFBLHFCQUNyRDtBQUFXLGtCQUFJLEtBQUssQ0FBQyxhQUFhLFdBQVc7QUFDdEQ7QUFBQSxRQUNKO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJO0FBQVEsYUFBTyxDQUFDLElBQUksS0FBSyxJQUFJLEdBQUcsR0FBRyxHQUFJO0FBQUE7QUFDdEMsYUFBTyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUM7QUFBQSxFQUM3QjtBQUFBLEVBRUEsUUFBUyxXQUFrQyxRQUFRLEdBQVc7QUFDNUQsVUFBTSxJQUFJLEtBQUssS0FBSztBQUNwQixRQUFJLFFBQVE7QUFBRyxjQUFRLElBQUk7QUFDM0IsYUFBUyxJQUFJLE9BQU8sSUFBSSxHQUFHO0FBQUssVUFBSSxVQUFVLEtBQUssS0FBSyxDQUFDLENBQUM7QUFBRyxlQUFPO0FBQ3BFLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxDQUFFLFdBQVksV0FBa0Q7QUFDOUQsZUFBVyxPQUFPLEtBQUs7QUFBTSxVQUFJLFVBQVUsR0FBRztBQUFHLGNBQU07QUFBQSxFQUN6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUEyQkY7QUFFQSxTQUFTLFVBQ1AsS0FDQSxRQUNBLFFBQ0csS0FDSDtBQUNBLE1BQUksUUFBUTtBQUNWLFFBQUksS0FBSyxNQUFNLElBQUk7QUFDbkIsV0FBTyxLQUFLLEdBQUcsS0FBSyxPQUFPO0FBQUEsRUFDN0I7QUFDSyxRQUFJLEtBQUssSUFBSSxRQUFRLE9BQU8sRUFBRSxDQUFDO0FBQ3RDO0FBRUEsSUFBTSxjQUFjO0FBQ3BCLElBQU0sYUFBYTtBQUVuQixJQUFNLFdBQVc7QUFDakIsSUFBTSxTQUFTO0FBQ2YsSUFBTSxVQUFVO0FBQ2hCLElBQU0sUUFBUTtBQUNkLElBQU0sUUFBUTtBQUNkLElBQU0sVUFBVTs7O0FMcE9oQixJQUFJLG9CQUFvQjtBQUN4QixlQUFzQixRQUNwQixNQUNBLFNBQ2dCO0FBQ2hCLE1BQUk7QUFDSixNQUFJO0FBQ0YsVUFBTSxNQUFNLFNBQVMsTUFBTSxFQUFFLFVBQVUsT0FBTyxDQUFDO0FBQUEsRUFDakQsU0FBUyxJQUFJO0FBQ1gsWUFBUSxNQUFNLDhCQUE4QixJQUFJLElBQUksRUFBRTtBQUN0RCxVQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxFQUN6QztBQUNBLE1BQUk7QUFDRixXQUFPLFdBQVcsS0FBSyxPQUFPO0FBQUEsRUFDaEMsU0FBUyxJQUFJO0FBQ1gsWUFBUSxNQUFNLCtCQUErQixJQUFJLEtBQUssRUFBRTtBQUN4RCxVQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxFQUMxQztBQUNGO0FBV0EsSUFBTSxrQkFBc0M7QUFBQSxFQUMxQyxjQUFjLG9CQUFJLElBQUk7QUFBQSxFQUN0QixXQUFXLENBQUM7QUFBQSxFQUNaLGFBQWEsQ0FBQztBQUFBLEVBQ2QsYUFBYSxDQUFDO0FBQUEsRUFDZCxXQUFXO0FBQUE7QUFDYjtBQUVPLFNBQVMsV0FDZCxLQUNBLFNBQ087QUFDUCxRQUFNLFFBQVEsRUFBRSxHQUFHLGlCQUFpQixHQUFHLFFBQVE7QUFDL0MsUUFBTSxhQUF5QjtBQUFBLElBQzdCLE1BQU0sTUFBTSxRQUFRLFVBQVUsbUJBQW1CO0FBQUEsSUFDakQsV0FBVztBQUFBLElBQ1gsU0FBUyxDQUFDO0FBQUEsSUFDVixRQUFRLENBQUM7QUFBQSxJQUNULFdBQVcsQ0FBQztBQUFBLEVBQ2Q7QUFFQSxNQUFJLElBQUksUUFBUSxJQUFJLE1BQU07QUFBSSxVQUFNLElBQUksTUFBTSxPQUFPO0FBRXJELFFBQU0sQ0FBQyxXQUFXLEdBQUcsT0FBTyxJQUFJLElBQzdCLE1BQU0sSUFBSSxFQUNWLE9BQU8sVUFBUSxTQUFTLEVBQUUsRUFDMUIsSUFBSSxVQUFRLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUUxQyxRQUFNLFNBQVMsb0JBQUk7QUFDbkIsYUFBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFVBQVUsUUFBUSxHQUFHO0FBQ3hDLFFBQUksQ0FBQztBQUFHLFlBQU0sSUFBSSxNQUFNLEdBQUcsV0FBVyxJQUFJLE1BQU0sQ0FBQyx5QkFBeUI7QUFDMUUsUUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHO0FBQ2pCLGNBQVEsS0FBSyxHQUFHLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QjtBQUN6RSxZQUFNLElBQUksT0FBTyxJQUFJLENBQUM7QUFDdEIsZ0JBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUMxQixPQUFPO0FBQ0wsYUFBTyxJQUFJLEdBQUcsQ0FBQztBQUFBLElBQ2pCO0FBQUEsRUFDRjtBQUVBLFFBQU0sYUFBMkIsQ0FBQztBQUVsQyxhQUFXLENBQUMsT0FBTyxJQUFJLEtBQUssVUFBVSxRQUFRLEdBQUc7QUFDL0MsZUFBVyxVQUFVLElBQUksSUFBSTtBQUM3QixRQUFJLE1BQU0sY0FBYyxJQUFJLElBQUk7QUFBRztBQUNuQyxRQUFJLE1BQU0sWUFBWSxJQUFJO0FBQzFCLFVBQUk7QUFDRixjQUFNLElBQUk7QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFVBQ0EsV0FBVztBQUFBLFVBQ1g7QUFBQSxVQUNBLE1BQU0sVUFBVSxJQUFJO0FBQUEsVUFDcEI7QUFBQSxRQUNGO0FBQ0EsWUFBSSxNQUFNLE1BQU07QUFDZCxjQUFJLEVBQUU7QUFBc0IsdUJBQVc7QUFDdkMscUJBQVcsS0FBSyxDQUFDO0FBQUEsUUFDbkI7QUFBQSxNQUNGLFNBQVMsSUFBSTtBQUNYLGdCQUFRO0FBQUEsVUFDTix1QkFBdUIsV0FBVyxJQUFJLGFBQWEsS0FBSyxJQUFJLElBQUk7QUFBQSxVQUM5RDtBQUFBLFFBQ0o7QUFDQSxjQUFNO0FBQUEsTUFDUjtBQUFBLEVBQ0Y7QUFFQSxNQUFJLFNBQVMsYUFBYTtBQUN4QixlQUFXLENBQUMsTUFBTSxRQUFRLEtBQUssT0FBTyxRQUFRLFFBQVEsV0FBVyxHQUFHO0FBQ2xFLGlCQUFXLEtBQUssU0FBUyxNQUFNLFVBQVUsQ0FBQztBQUFBLElBQzVDO0FBQUEsRUFDRjtBQUVBLFFBQU0sT0FBYyxJQUFJLE1BQU0sUUFBUSxNQUFNLEVBQ3pDLEtBQUssSUFBSSxFQUNULElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxRQUFRLEVBQUU7QUFHcEMsYUFBVyxXQUFXLFlBQVk7QUFDaEMsVUFBTSxNQUFNLFNBQVMsT0FBTztBQUM1QixlQUFXLFFBQVEsS0FBSyxHQUFHO0FBQzNCLGVBQVcsT0FBTyxLQUFLLElBQUksSUFBSTtBQUFBLEVBQ2pDO0FBRUEsYUFBVyxPQUFPLFdBQVcsU0FBUztBQUNwQyxlQUFXLEtBQUs7QUFDZCxXQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLElBQUk7QUFBQSxRQUM5QixRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksS0FBSztBQUFBLFFBQzVCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxFQUNKO0FBRUEsU0FBTyxJQUFJLE1BQU0sTUFBTSxJQUFJLE9BQU8sVUFBVSxDQUFDO0FBQy9DO0FBRUEsZUFBc0IsU0FBUyxNQUFtRDtBQUNoRixTQUFPLFFBQVE7QUFBQSxJQUNiLE9BQU8sUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxPQUFPLE1BQU0sUUFBUSxNQUFNLE9BQU8sQ0FBQztBQUFBLEVBQ3RFO0FBQ0Y7OztBTTdJQSxPQUFPLGFBQWE7QUFFcEIsU0FBUyxpQkFBaUI7QUFFMUIsSUFBTSxRQUFRLFFBQVEsT0FBTztBQUM3QixJQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxRQUFRLEtBQUssTUFBTSxDQUFDO0FBRTlDLFFBQVEsSUFBSSxRQUFRLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFcEMsSUFBSSxNQUFNO0FBQ1IsUUFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixNQUFJO0FBQUssYUFBUyxNQUFNLFFBQVEsTUFBTSxHQUFHLENBQUM7QUFDNUMsT0FBTztBQUNMLFFBQU0sT0FBTztBQUNiLFFBQU0sU0FBUyxNQUFNLFNBQVMsT0FBTztBQUNyQyxRQUFNLE9BQU8sTUFBTSxhQUFhLE1BQU07QUFDdEMsUUFBTSxVQUFVLE1BQU0sS0FBSyxPQUFPLEdBQUcsRUFBRSxVQUFVLEtBQUssQ0FBQztBQUN2RCxVQUFRLElBQUksU0FBUyxLQUFLLElBQUksYUFBYSxJQUFJLEVBQUU7QUFDbkQ7QUFjQSxlQUFlLFNBQVMsR0FBVTtBQUNoQyxRQUFNLElBQUksS0FBSyxNQUFNLEtBQUssT0FBTyxLQUFLLEVBQUUsS0FBSyxTQUFTLEdBQUc7QUFDekQsUUFBTSxJQUFJLElBQUk7QUFDZCxRQUFNLElBQUksRUFBRSxPQUFPLE9BQU8sTUFBTSxHQUFHLENBQUM7QUFDcEMsUUFBTSxPQUFPLE1BQU0sYUFBYSxDQUFDLENBQUMsQ0FBQztBQUNuQyxVQUFRLElBQUksb0JBQW9CO0FBQ2hDLElBQUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0FBR3RCLFVBQVEsSUFBSSxNQUFNO0FBQ2xCLFFBQU0sSUFBSSxNQUFNLE1BQU0sU0FBUyxJQUFJO0FBQ25DLFVBQVEsSUFBSSxvQkFBb0I7QUFFaEMsU0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0FBRzNDOyIsCiAgIm5hbWVzIjogWyJpIiwgIndpZHRoIiwgImZpZWxkcyIsICJ3aWR0aCIsICJ3aWR0aCIsICJmaWVsZHMiXQp9Cg==
