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
  parse(v) {
    if (this.override)
      v = this.override(v);
    if (v.startsWith('"'))
      v = v.slice(1, -1);
    return stringToBytes(v);
  }
  print(v) {
    debugger;
    return bytesToString(0, v)[0];
  }
  serialize() {
    return [1 /* STRING */, ...stringToBytes(this.name)];
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
  parse(v) {
    return this.override ? this.override(v) : v ? Number(v) : 0;
  }
  print(v) {
    return v;
  }
  serialize() {
    return [this.type, ...stringToBytes(this.name)];
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
  parse(v) {
    let n;
    if (this.override)
      n = this.override(v);
    else if (!v)
      return new Uint8Array(1);
    else
      n = BigInt(v);
    return bigBoyToBytes(n);
  }
  print(v) {
    return bytesToBigBoy(0, v)[0];
  }
  serialize() {
    return [9 /* BIG */, ...stringToBytes(this.name)];
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
  parse(v) {
    if (this.override)
      v = this.override(v);
    return !v || v === "0" ? 0 : this.flag;
  }
  print(v) {
    return this.parse(v) !== 0;
  }
  serialize() {
    return [2 /* BOOL */, ...stringToBytes(this.name)];
  }
};
function cmpFields(a, b) {
  return a.order - b.order || (a.bit ?? 0) - (b.bit ?? 0) || a.index - b.index;
}
function fromData(name, i, index, flagsUsed, data, override) {
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
    //position: null, // calculate during columns
  };
  let isUsed = false;
  if (isUsed !== false)
    debugger;
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
  const nameWidth = name.length - 2;
  const hTailWidth = width2 - (nameWidth + 5 - 1);
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
    let read;
    let totalRead = 0;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const row = { __rowId };
    let v;
    for (const c of this.columns) {
      switch (c.type) {
        case 1 /* STRING */:
          [v, read] = bytesToString(i, bytes);
          break;
        case 9 /* BIG */:
          [v, read] = bytesToBigBoy(i, bytes);
          break;
        case 2 /* BOOL */:
          v = bytes[i] & c.flag;
          read = c.flag === 128 || c.bit === this.flagFields - 1 ? 1 : 0;
          break;
        case 4 /* I8 */:
          v = view.getInt8(i);
          read = 1;
          break;
        case 3 /* U8 */:
          v = view.getUint8(i);
          read = 1;
          break;
        case 6 /* I16 */:
          v = view.getInt16(i, true);
          read = 2;
          break;
        case 5 /* U16 */:
          v = view.getUint16(i, true);
          read = 2;
          break;
        case 8 /* I32 */:
          v = view.getInt32(i, true);
          read = 4;
          break;
        case 7 /* U32 */:
          v = view.getUint32(i, true);
          read = 4;
          break;
        default:
          throw new Error(
            `cant parse column ${c.name} of type ${c.type}`
          );
      }
      i += read;
      totalRead += read;
      row[c.name] = v;
    }
    return [row, totalRead];
  }
  printRow(r, fields2) {
    return Object.fromEntries(fields2.map((f) => [
      f,
      //this.columnsByName[f].print(r[f] as any)
      r[f]
    ]));
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
    const fixed = new ArrayBuffer(this.fixedWidth);
    let view = new DataView(fixed);
    let i = 0;
    const blobParts = [fixed];
    for (const c of this.columns) {
      const v = r[c.name];
      switch (c.type) {
        case 1 /* STRING */:
        case 9 /* BIG */:
          blobParts.push(v);
          break;
        case 2 /* BOOL */:
          const f = view.getUint8(i);
          view.setUint8(i, f | v);
          if (c.flag === 128 || c.bit === this.flagFields - 1)
            i++;
          break;
        case 4 /* I8 */:
          view.setInt8(i, v);
          i += 1;
          break;
        case 3 /* U8 */:
          view.setUint8(i, v);
          i += 1;
          break;
        case 6 /* I16 */:
          view.setInt16(i, v, true);
          i += 2;
          break;
        case 5 /* U16 */:
          view.setUint16(i, v, true);
          i += 2;
          break;
        case 8 /* I32 */:
          view.setInt32(i, v, true);
          i += 4;
          break;
        case 7 /* U32 */:
          view.setUint32(i, v, true);
          i += 4;
          break;
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
    const rowData = new Blob(this.rows.flatMap((r) => {
      const rowBlob = this.schema.serializeRow(r);
      if (r.__rowId === 1)
        rowBlob.arrayBuffer().then((ab) => {
          console.log(`ARRAY BUFFER FOR FIRST ROW OF ${this.name}`, ab);
        });
      return rowBlob;
    }));
    const dataPadding = (4 - rowData.size % 4) % 4;
    return [
      new Uint32Array([
        this.rows.length,
        schemaHeader.size + schemaPadding,
        rowData.size + dataPadding
      ]),
      new Blob([
        schemaHeader,
        new ArrayBuffer(schemaPadding)
      ]),
      new Blob([
        rowData,
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
      console.log("BLBO", i, sizes, headers, data);
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
    console.log("PRE$EPEE", sizes, tBlobs);
    const tables = await Promise.all(tBlobs.map((tb) => {
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
    while (rbo < dataBuffer.byteLength) {
      const [row, read] = schema.rowFromBuffer(rbo, dataBuffer, __rowId++);
      rows.push(row);
      rbo += read;
      if (__rowId > 10)
        break;
    }
    return new _Table(rows, schema);
  }
  print(width2 = 80, fields2 = [], n, m) {
    if (!fields2.length)
      fields2 = this.schema.fields;
    const [head, tail] = tableDeco(this.name, width2, 18);
    const printRow = (r, ...args) => {
      return this.schema.printRow(r, fields2);
    };
    let rows = this.rows;
    if (n != null) {
      if (m != null)
        rows = rows.slice(n, m);
      else
        rows = rows.slice(0, n);
    }
    console.log(head);
    console.table(rows.map(printRow), fields2);
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
      const c = fromData(name, rawIndex, index, flagsUsed, rawData, options?.overrides?.[name]);
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
      data[r.__rowId][col.name] = col.parse(rawData[r.__rowId][rawIndex]);
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
  const blob = Table.concatTables([t]);
  const u = await Table.openBlob(blob);
  debugger;
  u.Unit.print(width);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2Nzdi1kZWZzLnRzIiwgIi4uL3NyYy9zZXJpYWxpemUudHMiLCAiLi4vc3JjL2NvbHVtbi50cyIsICIuLi9zcmMvdXRpbC50cyIsICIuLi9zcmMvc2NoZW1hLnRzIiwgIi4uL3NyYy9wYXJzZS1jc3YudHMiLCAiLi4vc3JjL3RhYmxlLnRzIiwgIi4uL3NyYy9kdW1wLWNzdnMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgUGFyc2VTY2hlbWFPcHRpb25zIH0gZnJvbSAnLi9wYXJzZS1jc3YnXG5leHBvcnQgY29uc3QgY3N2RGVmczogUmVjb3JkPHN0cmluZywgUGFyc2VTY2hlbWFPcHRpb25zPiA9IHtcbiAgJy4uLy4uL2dhbWVkYXRhL0Jhc2VVLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICAgIG92ZXJyaWRlczoge1xuICAgICAgLy8gY3N2IGhhcyB1bnJlc3QvdHVybiB3aGljaCBpcyBpbmN1bnJlc3QgLyAxMDsgY29udmVydCB0byBpbnQgZm9ybWF0XG4gICAgICBpbmN1bnJlc3Q6ICh2KSA9PiAoTnVtYmVyKHYpICogMTApIHx8IDBcbiAgICB9XG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9CYXNlSS5jc3YnOiB7XG4gICAgbmFtZTogJ0l0ZW0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcblxuICAnLi4vLi4vZ2FtZWRhdGEvTWFnaWNTaXRlcy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljU2l0ZScsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvTWVyY2VuYXJ5LmNzdic6IHtcbiAgICBuYW1lOiAnTWVyY2VuYXJ5JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hZmZsaWN0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ0FmZmxpY3Rpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hbm9uX3Byb3ZpbmNlX2V2ZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0Fub25Qcm92aW5jZUV2ZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXJtb3JzLmNzdic6IHtcbiAgICBuYW1lOiAnQXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZV9rZXlzLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlS2V5JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvYXR0cmlidXRlc19ieV9hcm1vci5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5QXJtb3InLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQXR0cmlidXRlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2F0dHJpYnV0ZXNfYnlfc3BlbGwuY3N2Jzoge1xuICAgIG5hbWU6ICdBdHRyaWJ1dGVCeVNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9hdHRyaWJ1dGVzX2J5X3dlYXBvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0F0dHJpYnV0ZUJ5V2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18xX3R5cGVzLmNzdic6IHtcbiAgICAvLyBUT0RPIC0gZ290IHNvbWUgYmlnIGJvaXMgaW4gaGVyZS5cbiAgICBuYW1lOiAnQnVmZkJpdDEnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9idWZmc18yX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnQnVmZkJpdDInLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9jb2FzdF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnQ29hc3RMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2NvYXN0X3Ryb29wX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0NvYXN0VHJvb3BUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VmZmVjdF9tb2RpZmllcl9iaXRzLmNzdic6IHtcbiAgICBuYW1lOiAnU3BlbGxCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX2luZm8uY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbEVmZmVjdEluZm8nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3NwZWxscy5jc3YnOiB7XG4gICAgbmFtZTogJ0VmZmVjdFNwZWxsJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9lZmZlY3RzX3dlYXBvbnMuY3N2Jzoge1xuICAgIG5hbWU6ICdFZmZlY3RXZWFwb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2VuY2hhbnRtZW50cy5jc3YnOiB7XG4gICAgbmFtZTogJ0VuY2hhbnRtZW50JyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvZXZlbnRzLmNzdic6IHtcbiAgICBuYW1lOiAnRXZlbnQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfbGVhZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ0ZvcnRMZWFkZXJUeXBlQnlOYXRpb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ2VuZCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL2ZvcnRfdHJvb3BfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnRm9ydFRyb29wVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tYWdpY19wYXRocy5jc3YnOiB7XG4gICAgbmFtZTogJ01hZ2ljUGF0aCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL21hcF90ZXJyYWluX3R5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblR5cGVCaXQnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9tb25zdGVyX3RhZ3MuY3N2Jzoge1xuICAgIG5hbWU6ICdNb25zdGVyVGFnJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmFtZXR5cGVzLmNzdic6IHtcbiAgICBuYW1lOiAnTmFtZVR5cGUnLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbmF0aW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ05hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF9sZWFkZXJfdHlwZXNfYnlfbmF0aW9uLmNzdic6IHtcbiAgICBuYW1lOiAnTm9uRm9ydExlYWRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvbm9uZm9ydF90cm9vcF90eXBlc19ieV9uYXRpb24uY3N2Jzoge1xuICAgIG5hbWU6ICdOb25Gb3J0TGVhZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9vdGhlcl9wbGFuZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdPdGhlclBsYW5lJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ1ByZXRlbmRlclR5cGVCeU5hdGlvbicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcHJvdGVjdGlvbnNfYnlfYXJtb3IuY3N2Jzoge1xuICAgIG5hbWU6ICdQcm90ZWN0aW9uQnlBcm1vcicsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvcmVhbG1zLmNzdic6IHtcbiAgICBuYW1lOiAnUmVhbG0nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zaXRlX3RlcnJhaW5fdHlwZXMuY3N2Jzoge1xuICAgIG5hbWU6ICdTaXRlVGVycmFpblR5cGUnLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVjaWFsX2RhbWFnZV90eXBlcy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxEYW1hZ2VUeXBlJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvc3BlY2lhbF91bmlxdWVfc3VtbW9ucy5jc3YnOiB7XG4gICAgbmFtZTogJ1NwZWNpYWxVbmlxdWVTdW1tb24nLFxuICAgIGlnbm9yZUZpZWxkczogbmV3IFNldChbJ3Rlc3QnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS9zcGVsbHMuY3N2Jzoge1xuICAgIG5hbWU6ICdTcGVsbCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsnZW5kJ10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdGVycmFpbl9zcGVjaWZpY19zdW1tb25zLmNzdic6IHtcbiAgICBuYW1lOiAnVGVycmFpblNwZWNpZmljU3VtbW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWyd0ZXN0J10pLFxuICB9LFxuICAnLi4vLi4vZ2FtZWRhdGEvdW5pdF9lZmZlY3RzLmNzdic6IHtcbiAgICBuYW1lOiAnVW5pdEVmZmVjdCcsXG4gICAgaWdub3JlRmllbGRzOiBuZXcgU2V0KFsndGVzdCddKSxcbiAgfSxcbiAgJy4uLy4uL2dhbWVkYXRhL3VucHJldGVuZGVyX3R5cGVzX2J5X25hdGlvbi5jc3YnOiB7XG4gICAgbmFtZTogJ1VucHJldGVuZGVyVHlwZUJ5TmF0aW9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG4gICcuLi8uLi9nYW1lZGF0YS93ZWFwb25zLmNzdic6IHtcbiAgICBuYW1lOiAnV2VhcG9uJyxcbiAgICBpZ25vcmVGaWVsZHM6IG5ldyBTZXQoWydlbmQnXSksXG4gIH0sXG59O1xuXG5cbiIsICJjb25zdCBfX3RleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCBfX3RleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0J5dGVzIChzOiBzdHJpbmcpOiBVaW50OEFycmF5O1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdDogVWludDhBcnJheSwgaTogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQnl0ZXMgKHM6IHN0cmluZywgZGVzdD86IFVpbnQ4QXJyYXksIGkgPSAwKSB7XG4gIGlmIChzLmluZGV4T2YoJ1xcMCcpICE9PSAtMSkge1xuICAgIGNvbnN0IGkgPSBzLmluZGV4T2YoJ1xcMCcpO1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7aX0gPSBOVUxMID8gXCIuLi4ke3Muc2xpY2UoaSAtIDEwLCBpICsgMTApfS4uLmApO1xuICAgIHRocm93IG5ldyBFcnJvcignd2hvb3BzaWUnKTtcbiAgfVxuICBjb25zdCBieXRlcyA9IF9fdGV4dEVuY29kZXIuZW5jb2RlKHMgKyAnXFwwJyk7XG4gIGlmIChkZXN0KSB7XG4gICAgZGVzdC5zZXQoYnl0ZXMsIGkpO1xuICAgIHJldHVybiBieXRlcy5sZW5ndGg7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ5dGVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvU3RyaW5nKGk6IG51bWJlciwgYTogVWludDhBcnJheSk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICBsZXQgciA9IDA7XG4gIHdoaWxlIChhW2kgKyByXSAhPT0gMCkgeyByKys7IH1cbiAgcmV0dXJuIFtfX3RleHREZWNvZGVyLmRlY29kZShhLnNsaWNlKGksIGkrcikpLCByICsgMV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaWdCb3lUb0J5dGVzIChuOiBiaWdpbnQpOiBVaW50OEFycmF5IHtcbiAgLy8gdGhpcyBpcyBhIGNvb2wgZ2FtZSBidXQgbGV0cyBob3BlIGl0IGRvZXNuJ3QgdXNlIDEyNysgYnl0ZSBudW1iZXJzXG4gIGNvbnN0IGJ5dGVzID0gWzBdO1xuICBpZiAobiA8IDBuKSB7XG4gICAgbiAqPSAtMW47XG4gICAgYnl0ZXNbMF0gPSAxMjg7XG4gIH1cblxuICB3aGlsZSAobikge1xuICAgIGlmIChieXRlc1swXSA9PT0gMjU1KSB0aHJvdyBuZXcgRXJyb3IoJ2JydWggdGhhdHMgdG9vIGJpZycpO1xuICAgIGJ5dGVzWzBdKys7XG4gICAgYnl0ZXMucHVzaChOdW1iZXIobiAmIDI1NW4pKTtcbiAgICBuID4+PSA2NG47XG4gIH1cblxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0JpZ0JveSAoaTogbnVtYmVyLCBieXRlczogVWludDhBcnJheSk6IFtiaWdpbnQsIG51bWJlcl0ge1xuICBjb25zdCBMID0gTnVtYmVyKGJ5dGVzW2ldKTtcbiAgY29uc3QgbGVuID0gTCAmIDEyNztcbiAgY29uc3QgcmVhZCA9IDEgKyBsZW47XG4gIGNvbnN0IG5lZyA9IChMICYgMTI4KSA/IC0xbiA6IDFuO1xuICBjb25zdCBCQjogYmlnaW50W10gPSBBcnJheS5mcm9tKGJ5dGVzLnNsaWNlKGkgKyAxLCBpICsgcmVhZCksIEJpZ0ludCk7XG4gIGlmIChsZW4gIT09IEJCLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdiaWdpbnQgY2hlY2tzdW0gaXMgRlVDSz8nKTtcbiAgcmV0dXJuIFtsZW4gPyBCQi5yZWR1Y2UoYnl0ZVRvQmlnYm9pKSAqIG5lZyA6IDBuLCByZWFkXVxufVxuXG5mdW5jdGlvbiBieXRlVG9CaWdib2kgKG46IGJpZ2ludCwgYjogYmlnaW50LCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIG4gfCAoYiA8PCBCaWdJbnQoaSAqIDgpKTtcbn1cbiIsICJpbXBvcnQgeyBiaWdCb3lUb0J5dGVzLCBieXRlc1RvQmlnQm95LCBieXRlc1RvU3RyaW5nLCBzdHJpbmdUb0J5dGVzIH0gZnJvbSAnLi9zZXJpYWxpemUnO1xuXG5leHBvcnQgdHlwZSBGaWVsZCA9IHtcbiAgdHlwZTogQ09MVU1OO1xuICBpbmRleDogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICB3aWR0aDogbnVtYmVyfG51bGw7ICAgIC8vIGZvciBudW1iZXJzLCBpbiBieXRlc1xuICBmbGFnOiBudW1iZXJ8bnVsbDtcbiAgYml0OiBudW1iZXJ8bnVsbDtcbn1cblxuZXhwb3J0IGVudW0gQ09MVU1OIHtcbiAgVU5VU0VEID0gMCxcbiAgU1RSSU5HID0gMSxcbiAgQk9PTCAgID0gMixcbiAgVTggICAgID0gMyxcbiAgSTggICAgID0gNCxcbiAgVTE2ICAgID0gNSxcbiAgSTE2ICAgID0gNixcbiAgVTMyICAgID0gNyxcbiAgSTMyICAgID0gOCxcbiAgQklHICAgID0gOSxcbn07XG5cbmV4cG9ydCBjb25zdCBDT0xVTU5fTEFCRUwgPSBbXG4gICdVTlVTRUQnLFxuICAnU1RSSU5HJyxcbiAgJ0JPT0wnLFxuICAnVTgnLFxuICAnSTgnLFxuICAnVTE2JyxcbiAgJ0kxNicsXG4gICdVMzInLFxuICAnSTMyJyxcbiAgJ0JJRycsXG5dO1xuXG5cblxuZXhwb3J0IHR5cGUgTlVNRVJJQ19DT0xVTU4gPVxuICB8Q09MVU1OLlU4XG4gIHxDT0xVTU4uSThcbiAgfENPTFVNTi5VMTZcbiAgfENPTFVNTi5JMTZcbiAgfENPTFVNTi5VMzJcbiAgfENPTFVNTi5JMzJcbiAgO1xuXG5jb25zdCBDT0xVTU5fV0lEVEg6IFJlY29yZDxOVU1FUklDX0NPTFVNTiwgMXwyfDQ+ID0ge1xuICBbQ09MVU1OLlU4XTogMSxcbiAgW0NPTFVNTi5JOF06IDEsXG4gIFtDT0xVTU4uVTE2XTogMixcbiAgW0NPTFVNTi5JMTZdOiAyLFxuICBbQ09MVU1OLlUzMl06IDQsXG4gIFtDT0xVTU4uSTMyXTogNCxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlVG9OdW1lcmljVHlwZSAoXG4gIG1pbjogbnVtYmVyLFxuICBtYXg6IG51bWJlclxuKTogTlVNRVJJQ19DT0xVTU58bnVsbCB7XG4gIGlmIChtaW4gPCAwKSB7XG4gICAgLy8gc29tZSBraW5kYSBuZWdhdGl2ZT8/XG4gICAgaWYgKG1pbiA+PSAtMTI4ICYmIG1heCA8PSAxMjcpIHtcbiAgICAgIC8vIHNpZ25lZCBieXRlXG4gICAgICByZXR1cm4gQ09MVU1OLkk4O1xuICAgIH0gZWxzZSBpZiAobWluID49IC0zMjc2OCAmJiBtYXggPD0gMzI3NjcpIHtcbiAgICAgIC8vIHNpZ25lZCBzaG9ydFxuICAgICAgcmV0dXJuIENPTFVNTi5JMTY7XG4gICAgfSBlbHNlIGlmIChtaW4gPj0gLTIxNDc0ODM2NDggJiYgbWF4IDw9IDIxNDc0ODM2NDcpIHtcbiAgICAgIC8vIHNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLkkzMjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1heCA8PSAyNTUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIGJ5dGVcbiAgICAgIHJldHVybiBDT0xVTU4uVTg7XG4gICAgfSBlbHNlIGlmIChtYXggPD0gNjU1MzUpIHtcbiAgICAgIC8vIHVuc2lnbmVkIHNob3J0XG4gICAgICByZXR1cm4gQ09MVU1OLlUxNjtcbiAgICB9IGVsc2UgaWYgKG1heCA8PSA0Mjk0OTY3Mjk1KSB7XG4gICAgICAvLyB1bnNpZ25lZCBsb25nXG4gICAgICByZXR1cm4gQ09MVU1OLlUzMjtcbiAgICB9XG4gIH1cbiAgLy8gR09UTzogQklHT09PT09PT09CT09PT09ZT1xuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0NvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBOVU1FUklDX0NPTFVNTiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICBjYXNlIENPTFVNTi5JMTY6XG4gICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlnQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5CSUcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLkJJRztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm9vbENvbHVtbiAodHlwZTogQ09MVU1OKTogdHlwZSBpcyBDT0xVTU4uQk9PTCB7XG4gIHJldHVybiB0eXBlID09PSBDT0xVTU4uQk9PTDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nQ29sdW1uICh0eXBlOiBDT0xVTU4pOiB0eXBlIGlzIENPTFVNTi5TVFJJTkcge1xuICByZXR1cm4gdHlwZSA9PT0gQ09MVU1OLlNUUklORztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQ29sdW1uIHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICBwYXJzZSAodjogc3RyaW5nKTogbnVtYmVyfFVpbnQ4QXJyYXk7XG4gIHRvU3RyaW5nICh2OiBzdHJpbmcpOiBhbnk7XG4gIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJ8bnVsbDsgICAgLy8gZm9yIG51bWJlcnMsIGluIGJ5dGVzXG4gIHJlYWRvbmx5IGZsYWc6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBiaXQ6IG51bWJlcnxudWxsO1xuICByZWFkb25seSBvcmRlcjogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5TVFJJTkcgPSBDT0xVTU4uU1RSSU5HO1xuICByZWFkb25seSBsYWJlbDogc3RyaW5nID0gQ09MVU1OX0xBQkVMW0NPTFVNTi5TVFJJTkddO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGJpdDogbnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG9yZGVyID0gMztcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBhbnk7XG4gIGNvbnN0cnVjdG9yKGZpZWxkOiBSZWFkb25seTxGaWVsZD4pIHtcbiAgICBjb25zdCB7IGluZGV4LCBuYW1lLCB0eXBlLCBvdmVycmlkZSB9ID0gZmllbGQ7XG4gICAgaWYgKCFpc1N0cmluZ0NvbHVtbih0eXBlKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignJHtuYW1lfSBpcyBub3QgYSBzdHJpbmcgY29sdW1uJyk7XG4gICAgaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnZm9vJykgIT09ICdzdHJpbmcnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHNlZW1zIG92ZXJyaWRlIGZvciAke25hbWV9IGRvZXMgbm90IHJldHVybiBhIHN0cmluZ2ApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMub3ZlcnJpZGUgPSBvdmVycmlkZTtcbiAgfVxuXG4gIHBhcnNlICh2OiBzdHJpbmcpOiBVaW50OEFycmF5IHtcbiAgICAvL3JldHVybiB2ID8/ICdcIlwiJztcbiAgICAvLyBUT0RPIC0gbmVlZCB0byB2ZXJpZnkgdGhlcmUgYXJlbid0IGFueSBzaW5nbGUgcXVvdGVzP1xuICAgIGlmICh0aGlzLm92ZXJyaWRlKSB2ID0gdGhpcy5vdmVycmlkZSh2KTtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSB2ID0gdi5zbGljZSgxLCAtMSk7XG4gICAgcmV0dXJuIHN0cmluZ1RvQnl0ZXModik7XG4gIH1cblxuICBwcmludCAodjogYW55KTogc3RyaW5nIHtcbiAgICBkZWJ1Z2dlcjtcbiAgICByZXR1cm4gYnl0ZXNUb1N0cmluZygwLCB2KVswXTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLlNUUklORywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0NvbHVtbiBpbXBsZW1lbnRzIElDb2x1bW4ge1xuICByZWFkb25seSB0eXBlOiBOVU1FUklDX0NPTFVNTjtcbiAgcmVhZG9ubHkgbGFiZWw6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSB3aWR0aDogMXwyfDQ7XG4gIHJlYWRvbmx5IGZsYWc6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBiaXQ6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBvcmRlciA9IDA7XG4gIG92ZXJyaWRlPzogKHY6IGFueSkgPT4gYW55O1xuICBjb25zdHJ1Y3RvcihmaWVsZDogUmVhZG9ubHk8RmllbGQ+KSB7XG4gICAgY29uc3QgeyBuYW1lLCBpbmRleCwgdHlwZSwgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmICghaXNOdW1lcmljQ29sdW1uKHR5cGUpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25hbWV9IGlzIG5vdCBhIG51bWVyaWMgY29sdW1uYCk7XG4gICAgaWYgKG92ZXJyaWRlICYmIHR5cGVvZiBvdmVycmlkZSgnMScpICE9PSAnbnVtYmVyJylcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBvdmVycmlkZSBtdXN0IHJldHVybiBhIG51bWJlcmApO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5sYWJlbCA9IENPTFVNTl9MQUJFTFt0aGlzLnR5cGVdO1xuICAgIHRoaXMud2lkdGggPSBDT0xVTU5fV0lEVEhbdGhpcy50eXBlXTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBwYXJzZSAodjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5vdmVycmlkZSA/IHRoaXMub3ZlcnJpZGUodikgOlxuICAgICAgdiA/IE51bWJlcih2KSA6XG4gICAgICAwO1xuICB9XG5cbiAgcHJpbnQgKHY6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHY7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IG51bWJlcltdIHtcbiAgICByZXR1cm4gW3RoaXMudHlwZSwgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBCaWdDb2x1bW4gaW1wbGVtZW50cyBJQ29sdW1uIHtcbiAgcmVhZG9ubHkgdHlwZTogQ09MVU1OLkJJRyA9IENPTFVNTi5CSUc7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJJR107XG4gIHJlYWRvbmx5IGluZGV4OiBudW1iZXI7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgd2lkdGg6IG51bGwgPSBudWxsO1xuICByZWFkb25seSBmbGFnOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgYml0OiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgb3JkZXIgPSAyO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGJpZ2ludDtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PEZpZWxkPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIG92ZXJyaWRlIH0gPSBmaWVsZDtcbiAgICBpZiAob3ZlcnJpZGUgJiYgdHlwZW9mIG92ZXJyaWRlKCcxJykgIT09ICdiaWdpbnQnKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJpZ2ludCcpO1xuICAgIGlmICghaXNCaWdDb2x1bW4odHlwZSkpIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBpcyBub3QgYmlnYCk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vdmVycmlkZSA9IG92ZXJyaWRlO1xuICB9XG5cbiAgcGFyc2UgKHY6IHN0cmluZyk6IFVpbnQ4QXJyYXkge1xuICAgIGxldCBuOiBiaWdpbnQ7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGUpIG4gPSB0aGlzLm92ZXJyaWRlKHYpO1xuICAgIGVsc2UgaWYgKCF2KSByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgZWxzZSBuID0gQmlnSW50KHYpO1xuICAgIHJldHVybiBiaWdCb3lUb0J5dGVzKG4pO1xuICB9XG5cbiAgcHJpbnQgKHY6IGFueSk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIGJ5dGVzVG9CaWdCb3koMCwgdilbMF07XG4gIH1cblxuICBzZXJpYWxpemUgKCkge1xuICAgIHJldHVybiBbQ09MVU1OLkJJRywgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpXTtcbiAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBCb29sQ29sdW1uIGltcGxlbWVudHMgSUNvbHVtbiB7XG4gIHJlYWRvbmx5IHR5cGU6IENPTFVNTi5CT09MID0gQ09MVU1OLkJPT0w7XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmcgPSBDT0xVTU5fTEFCRUxbQ09MVU1OLkJPT0xdO1xuICByZWFkb25seSBpbmRleDogbnVtYmVyO1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHdpZHRoOiBudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZmxhZzogbnVtYmVyO1xuICByZWFkb25seSBiaXQ6IG51bWJlcjtcbiAgcmVhZG9ubHkgb3JkZXIgPSAxO1xuICBvdmVycmlkZT86ICh2OiBhbnkpID0+IGFueTtcbiAgY29uc3RydWN0b3IoZmllbGQ6IFJlYWRvbmx5PEZpZWxkPikge1xuICAgIGNvbnN0IHsgbmFtZSwgaW5kZXgsIHR5cGUsIGJpdCwgZmxhZywgb3ZlcnJpZGUgfSA9IGZpZWxkO1xuICAgIGlmIChvdmVycmlkZSAmJiB0eXBlb2Ygb3ZlcnJpZGUoJzEnKSAhPT0gJ2Jvb2xlYW4nKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZWVtcyB0aGF0IG92ZXJyaWRlIGRvZXMgbm90IHJldHVybiBhIGJpZ2ludCcpO1xuICAgIGlmICghaXNCb29sQ29sdW1uKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gaXMgbm90IGJpZ2ApO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBFcnJvcihgZmxhZyBpcyBub3QgbnVtYmVyYCk7XG4gICAgaWYgKHR5cGVvZiBiaXQgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoYGJpdCBpcyBub3QgbnVtYmVyYCk7XG4gICAgdGhpcy5mbGFnID0gZmxhZztcbiAgICB0aGlzLmJpdCA9IGJpdDtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm92ZXJyaWRlID0gb3ZlcnJpZGU7XG4gIH1cblxuICBwYXJzZSAodjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZSkgdiA9IHRoaXMub3ZlcnJpZGUodik7XG4gICAgcmV0dXJuICghdiB8fCB2ID09PSAnMCcpID8gMCA6IHRoaXMuZmxhZztcbiAgfVxuXG4gIHByaW50ICh2OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5wYXJzZSh2KSAhPT0gMDtcbiAgfVxuXG4gIHNlcmlhbGl6ZSAoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiBbQ09MVU1OLkJPT0wsIC4uLnN0cmluZ1RvQnl0ZXModGhpcy5uYW1lKV07XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRkNvbXBhcmFibGUgPSB7IG9yZGVyOiBudW1iZXIsIGJpdDogbnVtYmVyIHwgbnVsbCwgaW5kZXg6IG51bWJlciB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY21wRmllbGRzIChhOiBGQ29tcGFyYWJsZSwgYjogRkNvbXBhcmFibGUpOiBudW1iZXIge1xuICByZXR1cm4gKGEub3JkZXIgLSBiLm9yZGVyKSB8fFxuICAgICgoYS5iaXQgPz8gMCkgLSAoYi5iaXQgPz8gMCkpIHx8XG4gICAgKGEuaW5kZXggLSBiLmluZGV4KTtcbn1cblxuZXhwb3J0IHR5cGUgQ29sdW1uID1cbiAgfFN0cmluZ0NvbHVtblxuICB8TnVtZXJpY0NvbHVtblxuICB8QmlnQ29sdW1uXG4gIHxCb29sQ29sdW1uXG4gIDtcbmV4cG9ydCBmdW5jdGlvbiBmcm9tRGF0YSAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaTogbnVtYmVyLFxuICBpbmRleDogbnVtYmVyLFxuICBmbGFnc1VzZWQ6IG51bWJlcixcbiAgZGF0YTogc3RyaW5nW11bXSxcbiAgb3ZlcnJpZGU/OiAodjogYW55KSA9PiBhbnksXG4pOiBDb2x1bW58bnVsbCB7XG4gIGNvbnN0IGZpZWxkID0ge1xuICAgIGluZGV4LFxuICAgIG5hbWUsXG4gICAgb3ZlcnJpZGUsXG4gICAgdHlwZTogQ09MVU1OLlVOVVNFRCxcbiAgICBtYXhWYWx1ZTogMCxcbiAgICBtaW5WYWx1ZTogMCxcbiAgICB3aWR0aDogbnVsbCBhcyBhbnksXG4gICAgZmxhZzogbnVsbCBhcyBhbnksXG4gICAgYml0OiBudWxsIGFzIGFueSxcbiAgICAvL3Bvc2l0aW9uOiBudWxsLCAvLyBjYWxjdWxhdGUgZHVyaW5nIGNvbHVtbnNcbiAgfTtcbiAgbGV0IGlzVXNlZCA9IGZhbHNlO1xuICBpZiAoaXNVc2VkICE9PSBmYWxzZSkgZGVidWdnZXI7XG4gIGZvciAoY29uc3QgdSBvZiBkYXRhKSB7XG4gICAgY29uc3QgdiA9IGZpZWxkLm92ZXJyaWRlID8gZmllbGQub3ZlcnJpZGUodVtpXSkgOiB1W2ldO1xuICAgIGlmICghdikgY29udGludWU7XG4gICAgLy9jb25zb2xlLmVycm9yKGAke2l9OiR7bmFtZX0gfiAke3VbMF19OiR7dVsxXX06ICR7dn1gKVxuICAgIGlzVXNlZCA9IHRydWU7XG4gICAgY29uc3QgbiA9IE51bWJlcih2KTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKG4pKSB7XG4gICAgICAvLyBtdXN0IGJlIGEgc3RyaW5nXG4gICAgICBmaWVsZC50eXBlID0gQ09MVU1OLlNUUklORztcbiAgICAgIHJldHVybiBuZXcgU3RyaW5nQ29sdW1uKGZpZWxkKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFxceDFiWzMxbSR7aX06JHtuYW1lfSBoYXMgYSBmbG9hdD8gXCIke3Z9XCIgKCR7bn0pXFx4MWJbMG1gKTtcbiAgICB9IGVsc2UgaWYgKCFOdW1iZXIuaXNTYWZlSW50ZWdlcihuKSkge1xuICAgICAgLy8gd2Ugd2lsbCBoYXZlIHRvIHJlLWRvIHRoaXMgcGFydDpcbiAgICAgIGZpZWxkLm1pblZhbHVlID0gLUluZmluaXR5O1xuICAgICAgZmllbGQubWF4VmFsdWUgPSBJbmZpbml0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG4gPCBmaWVsZC5taW5WYWx1ZSkgZmllbGQubWluVmFsdWUgPSBuO1xuICAgICAgaWYgKG4gPiBmaWVsZC5tYXhWYWx1ZSkgZmllbGQubWF4VmFsdWUgPSBuO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaXNVc2VkKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszMW0ke2l9OiR7bmFtZX0gaXMgdW51c2VkP1xceDFiWzBtYClcbiAgICAvL2RlYnVnZ2VyO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYgKGZpZWxkLm1pblZhbHVlID09PSAwICYmIGZpZWxkLm1heFZhbHVlID09PSAxKSB7XG4gICAgLy9jb25zb2xlLmVycm9yKGBcXHgxYlszNG0ke2l9OiR7bmFtZX0gYXBwZWFycyB0byBiZSBhIGJvb2xlYW4gZmxhZ1xceDFiWzBtYCk7XG4gICAgZmllbGQudHlwZSA9IENPTFVNTi5CT09MO1xuICAgIGZpZWxkLmJpdCA9IGZsYWdzVXNlZDtcbiAgICBmaWVsZC5mbGFnID0gMSA8PCBmaWVsZC5iaXQgJSA4O1xuICAgIHJldHVybiBuZXcgQm9vbENvbHVtbihmaWVsZCk7XG4gIH1cblxuICBpZiAoZmllbGQubWF4VmFsdWUhIDwgSW5maW5pdHkpIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gd2UgdXNlIGluZmluaXR5IHRvIG1lYW4gXCJub3QgYSBiaWdpbnRcIlxuICAgIGNvbnN0IHR5cGUgPSByYW5nZVRvTnVtZXJpY1R5cGUoZmllbGQubWluVmFsdWUsIGZpZWxkLm1heFZhbHVlKTtcbiAgICBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgZmllbGQudHlwZSA9IHR5cGU7XG4gICAgICByZXR1cm4gbmV3IE51bWVyaWNDb2x1bW4oZmllbGQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEJJRyBCT1kgVElNRVxuICBmaWVsZC50eXBlID0gQ09MVU1OLkJJRztcbiAgcmV0dXJuIG5ldyBCaWdDb2x1bW4oZmllbGQpO1xufVxuIiwgIi8vIGp1c3QgYSBidW5jaCBvZiBvdXRwdXQgZm9ybWF0dGluZyBzaGl0XG5leHBvcnQgZnVuY3Rpb24gdGFibGVEZWNvKG5hbWU6IHN0cmluZywgd2lkdGggPSA4MCwgc3R5bGUgPSA5KSB7XG4gIGNvbnN0IHsgVEwsIEJMLCBUUiwgQlIsIEhSIH0gPSBnZXRCb3hDaGFycyhzdHlsZSlcbiAgY29uc3QgbmFtZVdpZHRoID0gbmFtZS5sZW5ndGggLSAyO1xuICBjb25zdCBoVGFpbFdpZHRoID0gd2lkdGggLSAobmFtZVdpZHRoICsgNSAtIDEpXG4gIHJldHVybiBbXG4gICAgYCR7VEx9JHtIUi5yZXBlYXQoNCl9ICR7bmFtZX0gJHtIUi5yZXBlYXQoaFRhaWxXaWR0aCl9JHtUUn1gLFxuICAgIGAke0JMfSR7SFIucmVwZWF0KHdpZHRoIC0gMil9JHtCUn1gXG4gIF07XG59XG5cblxuZnVuY3Rpb24gZ2V0Qm94Q2hhcnMgKHN0eWxlOiBudW1iZXIpIHtcbiAgc3dpdGNoIChzdHlsZSkge1xuICAgIGNhc2UgOTogcmV0dXJuIHsgVEw6ICdcdTI1MEMnLCBCTDogJ1x1MjUxNCcsIFRSOiAnXHUyNTEwJywgQlI6ICdcdTI1MTgnLCBIUjogJ1x1MjUwMCcgfTtcbiAgICBjYXNlIDE4OiByZXR1cm4geyBUTDogJ1x1MjUwRicsIEJMOiAnXHUyNTE3JywgVFI6ICdcdTI1MTMnLCBCUjogJ1x1MjUxQicsIEhSOiAnXHUyNTAxJyB9O1xuICAgIGNhc2UgMzY6IHJldHVybiB7IFRMOiAnXHUyNTU0JywgQkw6ICdcdTI1NUEnLCBUUjogJ1x1MjU1NycsIEJSOiAnXHUyNTVEJywgSFI6ICdcdTI1NTAnIH07XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0eWxlJyk7XG4gICAgLy9jYXNlID86IHJldHVybiB7IFRMOiAnTScsIEJMOiAnTicsIFRSOiAnTycsIEJSOiAnUCcsIEhSOiAnUScgfTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYm94Q2hhciAoaTogbnVtYmVyLCBkb3QgPSAwKSB7XG4gIHN3aXRjaCAoaSkge1xuICAgIGNhc2UgMDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcgJztcbiAgICBjYXNlIChCT1guVV9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3NSc7XG4gICAgY2FzZSAoQk9YLlVfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzknO1xuICAgIGNhc2UgKEJPWC5EX1QpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc3JztcbiAgICBjYXNlIChCT1guRF9CKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Qic7XG4gICAgY2FzZSAoQk9YLkxfVCk6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NzQnO1xuICAgIGNhc2UgKEJPWC5MX0IpOiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTc4JztcbiAgICBjYXNlIChCT1guUl9UKTogICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3Nic7XG4gICAgY2FzZSAoQk9YLlJfQik6ICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0EnO1xuXG4gICAgLy8gdHdvLXdheVxuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UOiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBBJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNic7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEUnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAyJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU3RCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0YnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9COiBzd2l0Y2ggKGRvdCkge1xuICAgICAgICBjYXNlIDM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBCJztcbiAgICAgICAgY2FzZSAyOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwNyc7XG4gICAgICAgIGNhc2UgMTogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NEYnO1xuICAgICAgICBkZWZhdWx0OiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTAzJztcbiAgICAgIH1cbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjVGRic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTE4JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxOSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUEnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTFBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NUMnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTVEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNCc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLlJfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUxNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTcnO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU5JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLlJfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1QSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTAnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTExJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1NSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9COiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTEzJztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjU1Nic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTcnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBDJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTInO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTBFJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwRic7XG4gICAgY2FzZSBCT1guRF9EfEJPWC5SX1Q6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1NTMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guUl9EOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTU0JztcbiAgICBjYXNlIEJPWC5MX1R8Qk9YLlJfVDogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOCc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDQnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTRDJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMCc7XG4gICAgICB9XG4gICAgY2FzZSBCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1N0MnO1xuICAgIGNhc2UgQk9YLkxfQnxCT1guUl9UOiAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTdFJztcbiAgICBjYXNlIEJPWC5MX0J8Qk9YLlJfQjogc3dpdGNoIChkb3QpIHtcbiAgICAgICAgY2FzZSAzOiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwOSc7XG4gICAgICAgIGNhc2UgMjogICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ1xcdTI1MDUnO1xuICAgICAgICBjYXNlIDE6ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXHUyNTREJztcbiAgICAgICAgZGVmYXVsdDogICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFx1MjUwMSc7XG4gICAgICB9XG4gICAgLy8gdGhyZWUtd2F5XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTI1JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2MSc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjcnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyNic7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjknO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTI4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9COiAgICAgICAgIHJldHVybiAnXFx1MjUyQic7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLkxfVDogICAgICAgICByZXR1cm4gJ1xcdTI1NjInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTYzJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MUQnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5SX0Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTVFJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUxRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MjInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTFFJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUyMSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MjAnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTIzJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjU1Ric7XG4gICAgY2FzZSBCT1guVV9EfEJPWC5EX0R8Qk9YLlJfRDogICAgICAgICByZXR1cm4gJ1xcdTI1NjAnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTM0JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfVHxCT1guUl9COiAgICAgICAgIHJldHVybiAnXFx1MjUzNic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5MX0J8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guTF9CfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTM3JztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzgnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTNBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzOSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1M0InO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY4JztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2OSc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MkMnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTJFJztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUyRCc7XG4gICAgY2FzZSBCT1guRF9UfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MkYnO1xuICAgIGNhc2UgQk9YLkRfVHxCT1guTF9EfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2NCc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogICAgICAgICByZXR1cm4gJ1xcdTI1MzAnO1xuICAgIGNhc2UgQk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6ICAgICAgICAgcmV0dXJuICdcXHUyNTMyJztcbiAgICBjYXNlIEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiAgICAgICAgIHJldHVybiAnXFx1MjUzMSc7XG4gICAgY2FzZSBCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogICAgICAgICByZXR1cm4gJ1xcdTI1MzMnO1xuICAgIGNhc2UgQk9YLkRfRHxCT1guTF9UfEJPWC5SX1Q6ICAgICAgICAgcmV0dXJuICdcXHUyNTY1JztcbiAgICBjYXNlIEJPWC5EX0R8Qk9YLkxfRHxCT1guUl9EOiAgICAgICAgIHJldHVybiAnXFx1MjU2Nic7XG4gICAgLy8gZm91ci13YXlcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjUzQyc7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1M0UnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTNEJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjUzRic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX1R8Qk9YLkxfRHxCT1guUl9EOiByZXR1cm4gJ1xcdTI1NkEnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQxJztcbiAgICBjYXNlIEJPWC5VX1R8Qk9YLkRfQnxCT1guTF9UfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nic7XG4gICAgY2FzZSBCT1guVV9UfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDUnO1xuICAgIGNhc2UgQk9YLlVfVHxCT1guRF9CfEJPWC5MX0J8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTQ4JztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9UfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0MCc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX1R8Qk9YLkxfVHxCT1guUl9COiByZXR1cm4gJ1xcdTI1NDQnO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9UfEJPWC5MX0J8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTQzJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfVHxCT1guTF9CfEJPWC5SX0I6IHJldHVybiAnXFx1MjU0Nyc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfVHxCT1guUl9UOiByZXR1cm4gJ1xcdTI1NDInO1xuICAgIGNhc2UgQk9YLlVfQnxCT1guRF9CfEJPWC5MX1R8Qk9YLlJfQjogcmV0dXJuICdcXHUyNTRBJztcbiAgICBjYXNlIEJPWC5VX0J8Qk9YLkRfQnxCT1guTF9CfEJPWC5SX1Q6IHJldHVybiAnXFx1MjU0OSc7XG4gICAgY2FzZSBCT1guVV9CfEJPWC5EX0J8Qk9YLkxfQnxCT1guUl9COiByZXR1cm4gJ1xcdTI1NEInO1xuICAgIGNhc2UgQk9YLlVfRHxCT1guRF9EfEJPWC5MX1R8Qk9YLlJfVDogcmV0dXJuICdcXHUyNTZCJztcbiAgICBjYXNlIEJPWC5VX0R8Qk9YLkRfRHxCT1guTF9EfEJPWC5SX0Q6IHJldHVybiAnXFx1MjU2Qyc7XG4gICAgZGVmYXVsdDogcmV0dXJuICdcdTI2MTInO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJPWCB7XG4gIFVfVCA9IDEsXG4gIFVfQiA9IDIsXG4gIFVfRCA9IDQsXG4gIERfVCA9IDgsXG4gIERfQiA9IDE2LFxuICBEX0QgPSAzMixcbiAgTF9UID0gNjQsXG4gIExfQiA9IDEyOCxcbiAgTF9EID0gMjU2LFxuICBSX1QgPSA1MTIsXG4gIFJfQiA9IDEwMjQsXG4gIFJfRCA9IDIwNDgsXG59XG5cbiIsICJpbXBvcnQgdHlwZSB7IENvbHVtbiB9IGZyb20gJy4vY29sdW1uJztcbmltcG9ydCB0eXBlIHsgUm93IH0gZnJvbSAnLi90YWJsZSdcbmltcG9ydCB7XG4gIGlzU3RyaW5nQ29sdW1uLFxuICBpc0JpZ0NvbHVtbixcbiAgQ09MVU1OLFxuICBCaWdDb2x1bW4sXG4gIEJvb2xDb2x1bW4sXG4gIFN0cmluZ0NvbHVtbixcbiAgTnVtZXJpY0NvbHVtbixcbn0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHsgYnl0ZXNUb0JpZ0JveSwgYnl0ZXNUb1N0cmluZywgc3RyaW5nVG9CeXRlcyB9IGZyb20gJy4vc2VyaWFsaXplJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5cbnR5cGUgU2NoZW1hQXJncyA9IHtcbiAgbmFtZTogc3RyaW5nO1xuICBjb2x1bW5zOiBDb2x1bW5bXSxcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgZmxhZ3NVc2VkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBTY2hlbWEge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNvbHVtbnM6IFJlYWRvbmx5PENvbHVtbltdPjtcbiAgcmVhZG9ubHkgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT47XG4gIHJlYWRvbmx5IGNvbHVtbnNCeU5hbWU6IFJlY29yZDxzdHJpbmcsIENvbHVtbj47XG4gIHJlYWRvbmx5IGZpeGVkV2lkdGg6IG51bWJlcjsgLy8gdG90YWwgYnl0ZXMgdXNlZCBieSBudW1iZXJzICsgZmxhZ3NcbiAgcmVhZG9ubHkgZmxhZ0ZpZWxkczogbnVtYmVyO1xuICByZWFkb25seSBzdHJpbmdGaWVsZHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgYmlnRmllbGRzOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKHsgY29sdW1ucywgZmllbGRzLCBuYW1lLCBmbGFnc1VzZWQgfTogU2NoZW1hQXJncykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5jb2x1bW5zID0gWy4uLmNvbHVtbnNdO1xuICAgIHRoaXMuZmllbGRzID0gWy4uLmZpZWxkc107XG4gICAgdGhpcy5jb2x1bW5zQnlOYW1lID0gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuY29sdW1ucy5tYXAoYyA9PiBbYy5uYW1lLCBjXSkpO1xuICAgIHRoaXMuZmxhZ0ZpZWxkcyA9IGZsYWdzVXNlZDtcbiAgICB0aGlzLmZpeGVkV2lkdGggPSBjb2x1bW5zLnJlZHVjZShcbiAgICAgICh3LCBjKSA9PiB3ICsgKGMud2lkdGggPz8gMCksXG4gICAgICBNYXRoLmNlaWwoZmxhZ3NVc2VkIC8gOCksIC8vIDggZmxhZ3MgcGVyIGJ5dGUsIG5hdGNoXG4gICAgKTtcbiAgICB0aGlzLnN0cmluZ0ZpZWxkcyA9IGNvbHVtbnMuZmlsdGVyKGMgPT4gaXNTdHJpbmdDb2x1bW4oYy50eXBlKSkubGVuZ3RoO1xuICAgIHRoaXMuYmlnRmllbGRzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBpc0JpZ0NvbHVtbihjLnR5cGUpKS5sZW5ndGg7XG5cbiAgfVxuXG4gIHN0YXRpYyBmcm9tQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogU2NoZW1hIHtcbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IHJlYWQ6IG51bWJlcjtcbiAgICBsZXQgbmFtZTogc3RyaW5nO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICBpICs9IHJlYWQ7XG5cbiAgICBjb25zdCBhcmdzID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvbHVtbnM6IFtdIGFzIENvbHVtbltdLFxuICAgICAgZmllbGRzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgIGZsYWdzVXNlZDogMCxcbiAgICB9O1xuXG4gICAgY29uc3QgbnVtRmllbGRzID0gYnl0ZXNbaSsrXSB8IChieXRlc1tpKytdIDw8IDgpO1xuXG5cblxuICAgIGxldCBpbmRleCA9IDA7XG4gICAgLy8gVE9ETyAtIG9ubHkgd29ya3Mgd2hlbiAwLWZpZWxkIHNjaGVtYXMgYXJlbid0IGFsbG93ZWR+IVxuICAgIHdoaWxlIChpbmRleCA8IG51bUZpZWxkcykge1xuICAgICAgY29uc3QgdHlwZSA9IGJ5dGVzW2krK107XG4gICAgICBbbmFtZSwgcmVhZF0gPSBieXRlc1RvU3RyaW5nKGksIGJ5dGVzKTtcbiAgICAgIGNvbnN0IGYgPSB7IGluZGV4LCBuYW1lLCB0eXBlLCB3aWR0aDogbnVsbCwgYml0OiBudWxsLCBmbGFnOiBudWxsIH07XG4gICAgICBpICs9IHJlYWQ7XG4gICAgICBsZXQgYzogQ29sdW1uO1xuXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBDT0xVTU4uU1RSSU5HOlxuICAgICAgICAgIGMgPSBuZXcgU3RyaW5nQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQklHOlxuICAgICAgICAgIGMgPSBuZXcgQmlnQ29sdW1uKHsgLi4uZiB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uQk9PTDpcbiAgICAgICAgICBjb25zdCBiaXQgPSBhcmdzLmZsYWdzVXNlZCsrO1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSAyICoqIChiaXQgJSA4KTtcbiAgICAgICAgICBjID0gbmV3IEJvb2xDb2x1bW4oeyAuLi5mLCBiaXQsIGZsYWcgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkk4OlxuICAgICAgICBjYXNlIENPTFVNTi5VODpcbiAgICAgICAgICBjID0gbmV3IE51bWVyaWNDb2x1bW4oeyAuLi5mLCB3aWR0aDogMSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTE2OlxuICAgICAgICBjYXNlIENPTFVNTi5VMTY6XG4gICAgICAgICAgYyA9IG5ldyBOdW1lcmljQ29sdW1uKHsgLi4uZiwgd2lkdGg6IDIgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkzMjpcbiAgICAgICAgY2FzZSBDT0xVTU4uVTMyOlxuICAgICAgICAgIGMgPSBuZXcgTnVtZXJpY0NvbHVtbih7IC4uLmYsIHdpZHRoOiA0IH0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0eXBlICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICAgIGFyZ3MuY29sdW1ucy5wdXNoKGMpO1xuICAgICAgYXJncy5maWVsZHMucHVzaChjLm5hbWUpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTY2hlbWEoYXJncyk7XG4gIH1cblxuICByb3dGcm9tQnVmZmVyKFxuICAgICAgaTogbnVtYmVyLFxuICAgICAgYnVmZmVyOiBBcnJheUJ1ZmZlcixcbiAgICAgIF9fcm93SWQ6IG51bWJlclxuICApOiBbUm93LCBudW1iZXJdIHtcbiAgICBsZXQgcmVhZDogbnVtYmVyO1xuICAgIGxldCB0b3RhbFJlYWQgPSAwO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gICAgY29uc3Qgcm93OiBSb3cgPSB7IF9fcm93SWQgfVxuICAgIGxldCB2OiBhbnk7XG4gICAgZm9yIChjb25zdCBjIG9mIHRoaXMuY29sdW1ucykge1xuICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSB3cm9uZ1xuICAgICAgICAgIFt2LCByZWFkXSA9IGJ5dGVzVG9TdHJpbmcoaSwgYnl0ZXMpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5CSUc6XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSB3cm9uZ1xuICAgICAgICAgIFt2LCByZWFkXSA9IGJ5dGVzVG9CaWdCb3koaSwgYnl0ZXMpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgdiA9IChieXRlc1tpXSAmIGMuZmxhZyk7XG4gICAgICAgICAgcmVhZCA9IChjLmZsYWcgPT09IDEyOCB8fCBjLmJpdCA9PT0gdGhpcy5mbGFnRmllbGRzIC0gMSkgPyAxIDogMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIENPTFVNTi5JODpcbiAgICAgICAgICB2ID0gdmlldy5nZXRJbnQ4KGkpXG4gICAgICAgICAgcmVhZCA9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlU4OlxuICAgICAgICAgIHYgPSB2aWV3LmdldFVpbnQ4KGkpXG4gICAgICAgICAgcmVhZCA9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgICB2ID0gdmlldy5nZXRJbnQxNihpLCB0cnVlKTtcbiAgICAgICAgICByZWFkID0gMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uVTE2OlxuICAgICAgICAgIHYgPSB2aWV3LmdldFVpbnQxNihpLCB0cnVlKTtcbiAgICAgICAgICByZWFkID0gMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uSTMyOlxuICAgICAgICAgIHYgPSB2aWV3LmdldEludDMyKGksIHRydWUpO1xuICAgICAgICAgIHJlYWQgPSA0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgdiA9IHZpZXcuZ2V0VWludDMyKGksIHRydWUpO1xuICAgICAgICAgIHJlYWQgPSA0O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYGNhbnQgcGFyc2UgY29sdW1uICR7KGMgYXMgYW55KS5uYW1lfSBvZiB0eXBlICR7KGMgYXMgYW55KS50eXBlfWBcbiAgICAgICAgICApO1xuICAgICAgfVxuICAgICAgaSArPSByZWFkO1xuICAgICAgdG90YWxSZWFkICs9IHJlYWQ7XG4gICAgICByb3dbYy5uYW1lXSA9IHY7XG4gICAgfVxuICAgIHJldHVybiBbcm93LCB0b3RhbFJlYWRdO1xuICB9XG5cbiAgcHJpbnRSb3cgKHI6IFJvdywgZmllbGRzOiBSZWFkb25seTxzdHJpbmdbXT4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKGZpZWxkcy5tYXAoZiA9PiBbXG4gICAgICBmLFxuICAgICAgLy90aGlzLmNvbHVtbnNCeU5hbWVbZl0ucHJpbnQocltmXSBhcyBhbnkpXG4gICAgICByW2ZdLFxuICAgIF0pKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZUhlYWRlciAoKTogQmxvYiB7XG4gICAgLy8gWy4uLm5hbWUsIDAsIG51bUZpZWxkczAsIG51bUZpZWxkczEsIGZpZWxkMFR5cGUsIGZpZWxkMEZsYWc/LCAuLi5maWVsZDBOYW1lLCAwLCBldGNdO1xuICAgIC8vIFRPRE8gLSBCYXNlIHVuaXQgaGFzIDUwMCsgZmllbGRzXG4gICAgaWYgKHRoaXMuY29sdW1ucy5sZW5ndGggPiA2NTUzNSkgdGhyb3cgbmV3IEVycm9yKCdvaCBidWRkeS4uLicpO1xuICAgIGNvbnN0IHBhcnRzID0gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgLi4uc3RyaW5nVG9CeXRlcyh0aGlzLm5hbWUpLFxuICAgICAgdGhpcy5jb2x1bW5zLmxlbmd0aCAmIDI1NSxcbiAgICAgICh0aGlzLmNvbHVtbnMubGVuZ3RoID4+PiA4KSxcbiAgICAgIC4uLnRoaXMuY29sdW1ucy5mbGF0TWFwKGMgPT4gYy5zZXJpYWxpemUoKSlcbiAgICBdKVxuICAgIHJldHVybiBuZXcgQmxvYihbcGFydHNdKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZVJvdyAocjogUm93KTogQmxvYiB7XG4gICAgY29uc3QgZml4ZWQgPSBuZXcgQXJyYXlCdWZmZXIodGhpcy5maXhlZFdpZHRoKTtcbiAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhmaXhlZClcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgYmxvYlBhcnRzOiBCbG9iUGFydFtdID0gW2ZpeGVkXTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgdGhpcy5jb2x1bW5zKSB7XG4gICAgICBjb25zdCB2ID0gcltjLm5hbWVdO1xuICAgICAgc3dpdGNoKGMudHlwZSkge1xuICAgICAgICBjYXNlIENPTFVNTi5TVFJJTkc6XG4gICAgICAgIGNhc2UgQ09MVU1OLkJJRzpcbiAgICAgICAgICBibG9iUGFydHMucHVzaCh2IGFzIFVpbnQ4QXJyYXkpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgQ09MVU1OLkJPT0w6XG4gICAgICAgICAgY29uc3QgZiA9IHZpZXcuZ2V0VWludDgoaSk7XG4gICAgICAgICAgdmlldy5zZXRVaW50OChpLCBmIHwgdiBhcyBudW1iZXIpXG4gICAgICAgICAgaWYgKGMuZmxhZyA9PT0gMTI4IHx8IGMuYml0ID09PSB0aGlzLmZsYWdGaWVsZHMgLSAxKSBpKys7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBDT0xVTU4uSTg6XG4gICAgICAgICAgdmlldy5zZXRJbnQ4KGksIHYgYXMgbnVtYmVyKVxuICAgICAgICAgIGkgKz0gMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDT0xVTU4uVTg6XG4gICAgICAgICAgdmlldy5zZXRVaW50OChpLCB2IGFzIG51bWJlcilcbiAgICAgICAgICBpICs9IDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLkkxNjpcbiAgICAgICAgICB2aWV3LnNldEludDE2KGksIHYgYXMgbnVtYmVyLCB0cnVlKTtcbiAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ09MVU1OLlUxNjpcbiAgICAgICAgICB2aWV3LnNldFVpbnQxNihpLCB2IGFzIG51bWJlciwgdHJ1ZSk7XG4gICAgICAgICAgaSArPSAyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5JMzI6XG4gICAgICAgICAgdmlldy5zZXRJbnQzMihpLCB2IGFzIG51bWJlciwgdHJ1ZSk7XG4gICAgICAgICAgaSArPSA0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENPTFVNTi5VMzI6XG4gICAgICAgICAgdmlldy5zZXRVaW50MzIoaSwgdiBhcyBudW1iZXIsIHRydWUpO1xuICAgICAgICAgIGkgKz0gNDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBCbG9iKGJsb2JQYXJ0cyk7XG4gIH1cblxuICBwcmludCAod2lkdGggPSA4MCk6IHZvaWQge1xuICAgIGNvbnN0IFtoZWFkLCB0YWlsXSA9IHRhYmxlRGVjbyh0aGlzLm5hbWUsIHdpZHRoLCAzNik7XG4gICAgY29uc29sZS5sb2coaGVhZCk7XG4gICAgY29uc3QgeyBmaXhlZFdpZHRoLCBiaWdGaWVsZHMsIHN0cmluZ0ZpZWxkcywgZmxhZ0ZpZWxkcyB9ID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh7IGZpeGVkV2lkdGgsIGJpZ0ZpZWxkcywgc3RyaW5nRmllbGRzLCBmbGFnRmllbGRzIH0pO1xuICAgIGNvbnNvbGUudGFibGUodGhpcy5jb2x1bW5zLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnbGFiZWwnLFxuICAgICAgJ29yZGVyJyxcbiAgICAgICdiaXQnLFxuICAgICAgJ3R5cGUnLFxuICAgICAgJ2ZsYWcnLFxuICAgICAgJ3dpZHRoJyxcbiAgICBdKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcblxuICB9XG5cbiAgLy8gcmF3VG9Sb3cgKGQ6IFJhd1Jvdyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHt9XG4gIC8vIHJhd1RvU3RyaW5nIChkOiBSYXdSb3csIC4uLmFyZ3M6IHN0cmluZ1tdKTogc3RyaW5nIHt9XG59O1xuXG4iLCAiaW1wb3J0IHsgU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuaW1wb3J0IHR5cGUgeyBGaWVsZCwgQ29sdW1uIH0gZnJvbSAnLi9jb2x1bW4nO1xuaW1wb3J0IHR5cGUgeyBSb3cgfSBmcm9tICcuL3RhYmxlJztcblxuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgVGFibGUgfSBmcm9tICcuL3RhYmxlJztcbmltcG9ydCB7IENPTFVNTiwgcmFuZ2VUb051bWVyaWNUeXBlLCBjbXBGaWVsZHMsIGlzTnVtZXJpY0NvbHVtbiwgU3RyaW5nQ29sdW1uLCBCb29sQ29sdW1uLCBOdW1lcmljQ29sdW1uLCBCaWdDb2x1bW4sIGZyb21EYXRhIH0gZnJvbSAnLi9jb2x1bW4nO1xuXG5cblxubGV0IF9uZXh0TmFtZUlkID0gMTtcbmNvbnN0IHRleHREZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZENTViAoXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogUGFyc2VTY2hlbWFPcHRpb25zXG4pOiBQcm9taXNlPFRhYmxlPiB7XG4gIGxldCByYXc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICByYXcgPSBhd2FpdCByZWFkRmlsZShwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgY29uc29sZS5lcnJvcihgZmFpbGVkIHRvIHJlYWQgc2NoZW1hIGZyb20gJHtwYXRofWAsIGV4KTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIHNjaGVtYScpO1xuICB9XG4gIHRyeSB7XG4gICAgcmV0dXJuIGNzdlRvVGFibGUocmF3LCBvcHRpb25zKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBjb25zb2xlLmVycm9yKGBmYWlsZWQgdG8gcGFyc2Ugc2NoZW1hIGZyb20gJHtwYXRofTpgLCBleCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcGFyc2Ugc2NoZW1hJyk7XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VTY2hlbWFPcHRpb25zID0ge1xuICBuYW1lPzogc3RyaW5nLFxuICBpZ25vcmVGaWVsZHM/OiBTZXQ8c3RyaW5nPjtcbiAgb3ZlcnJpZGVzPzogUmVjb3JkPHN0cmluZywgKHY6IGFueSkgPT4gYW55Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzdlRvVGFibGUocmF3OiBzdHJpbmcsIG9wdGlvbnM6IFBhcnNlU2NoZW1hT3B0aW9ucyk6IFRhYmxlIHtcbiAgaWYgKHJhdy5pbmRleE9mKCdcXDAnKSAhPT0gLTEpIHRocm93IG5ldyBFcnJvcigndWggb2gnKVxuXG4gIGNvbnN0IFtyYXdGaWVsZHMsIC4uLnJhd0RhdGFdID0gcmF3XG4gICAgLnNwbGl0KCdcXG4nKVxuICAgIC5maWx0ZXIobGluZSA9PiBsaW5lICE9PSAnJylcbiAgICAubWFwKGxpbmUgPT4gbGluZS5zcGxpdCgnXFx0JykpO1xuICBjb25zdCBzY2hlbWFOYW1lID0gb3B0aW9ucy5uYW1lID8/IGBTY2hlbWFfJHtfbmV4dE5hbWVJZCsrfWA7XG5cbiAgY29uc3QgaENvdW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj47XG4gIGZvciAoY29uc3QgW2ksIGZdIG9mIHJhd0ZpZWxkcy5lbnRyaWVzKCkpIHtcbiAgICBpZiAoIWYpIHRocm93IG5ldyBFcnJvcihgJHtzY2hlbWFOYW1lfSBAICR7aX0gaXMgYW4gZW1wdHkgZmllbGQgbmFtZWApO1xuICAgIGlmIChoQ291bnQuaGFzKGYpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7c2NoZW1hTmFtZX0gQCAke2l9IFwiJHtmfSBpcyBhIGR1cGxpY2F0ZSBmaWVsZCBuYW1lYCk7XG4gICAgICBjb25zdCBuID0gaENvdW50LmdldChmKSFcbiAgICAgIHJhd0ZpZWxkc1tpXSA9IGAke2Z9LiR7bn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBoQ291bnQuc2V0KGYsIDEpO1xuICAgIH1cbiAgfVxuXG5cbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGZsYWdzVXNlZCA9IDA7XG4gIGxldCByYXdDb2x1bW5zOiBbY29sOiBDb2x1bW4sIHJhd0luZGV4OiBudW1iZXJdW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IFtyYXdJbmRleCwgbmFtZV0gb2YgcmF3RmllbGRzLmVudHJpZXMoKSkge1xuICAgIGlmIChvcHRpb25zPy5pZ25vcmVGaWVsZHM/LmhhcyhuYW1lKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGMgPSBmcm9tRGF0YShuYW1lLCByYXdJbmRleCwgaW5kZXgsIGZsYWdzVXNlZCwgcmF3RGF0YSwgb3B0aW9ucz8ub3ZlcnJpZGVzPy5bbmFtZV0pO1xuICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgICAgaWYgKGMudHlwZSA9PT0gQ09MVU1OLkJPT0wpIGZsYWdzVXNlZCsrO1xuICAgICAgICByYXdDb2x1bW5zLnB1c2goW2MsIHJhd0luZGV4XSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBHT09CIElOVEVSQ0VQVEVEIElOICR7c2NoZW1hTmFtZX06IFxceDFiWzMxbSR7aW5kZXh9OiR7bmFtZX1cXHgxYlswbWAsXG4gICAgICAgICAgZXhcbiAgICAgICk7XG4gICAgICB0aHJvdyBleFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRhdGE6IFJvd1tdID0gbmV3IEFycmF5KHJhd0RhdGEubGVuZ3RoKVxuICAgIC5maWxsKG51bGwpXG4gICAgLm1hcCgoXywgX19yb3dJZCkgPT4gKHsgX19yb3dJZCB9KSlcbiAgICA7XG5cbiAgLy9jb25zb2xlLmxvZyhkYXRhKTtcblxuICBjb25zdCBjb2x1bW5zOiBDb2x1bW5bXSA9IFtdO1xuICBjb25zdCBmaWVsZHM6IHN0cmluZ1tdID0gW107XG4gIHJhd0NvbHVtbnMuc29ydCgoYSwgYikgPT4gY21wRmllbGRzKGFbMF0sIGJbMF0pKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIFtjb2wsIHJhd0luZGV4XV0gb2YgcmF3Q29sdW1ucy5lbnRyaWVzKCkpIHtcbiAgICBPYmplY3QuYXNzaWduKGNvbCwgeyBpbmRleCB9KTtcbiAgICBjb2x1bW5zLnB1c2goY29sKTtcbiAgICBmaWVsZHMucHVzaChjb2wubmFtZSk7XG4gICAgZm9yIChjb25zdCByIG9mIGRhdGEpXG4gICAgICBkYXRhW3IuX19yb3dJZF1bY29sLm5hbWVdID0gY29sLnBhcnNlKHJhd0RhdGFbci5fX3Jvd0lkXVtyYXdJbmRleF0pXG4gIH1cblxuICByZXR1cm4gbmV3IFRhYmxlKFxuICAgIGRhdGEsXG4gICAgbmV3IFNjaGVtYSh7XG4gICAgICBuYW1lOiBzY2hlbWFOYW1lLFxuICAgICAgZmllbGRzLFxuICAgICAgY29sdW1ucyxcbiAgICAgIGZsYWdzVXNlZFxuICAgIH0pXG4gIClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQWxsKGRlZnM6IFJlY29yZDxzdHJpbmcsIFBhcnNlU2NoZW1hT3B0aW9ucz4pIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlZnMpLm1hcCgoW3BhdGgsIG9wdGlvbnNdKSA9PiByZWFkQ1NWKHBhdGgsIG9wdGlvbnMpKVxuICApO1xufVxuIiwgImltcG9ydCB7IFNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcbmltcG9ydCB7IHRhYmxlRGVjbyB9IGZyb20gJy4vdXRpbCc7XG5leHBvcnQgdHlwZSBSb3dEYXRhID0gc3RyaW5nW107XG5leHBvcnQgdHlwZSBSb3cgPSBSZWNvcmQ8c3RyaW5nLCBudW1iZXJ8VWludDhBcnJheT4gJiB7IF9fcm93SWQ6IG51bWJlciB9O1xuXG5leHBvcnQgY2xhc3MgVGFibGUge1xuICBnZXQgbmFtZSAoKTogc3RyaW5nIHsgcmV0dXJuIGBbVEFCTEU6JHt0aGlzLnNjaGVtYS5uYW1lfV1gOyB9XG4gIGNvbnN0cnVjdG9yIChcbiAgICByZWFkb25seSByb3dzOiBSb3dbXSxcbiAgICByZWFkb25seSBzY2hlbWE6IFNjaGVtYSxcbiAgKSB7XG4gIH1cblxuICBzZXJpYWxpemUgKCk6IFtVaW50MzJBcnJheSwgQmxvYiwgQmxvYl0ge1xuICAgIC8vIFtudW1Sb3dzLCBoZWFkZXJTaXplLCBkYXRhU2l6ZV0sIHNjaGVtYUhlYWRlciwgW3JvdzAsIHJvdzEsIC4uLiByb3dOXTtcbiAgICBjb25zdCBzY2hlbWFIZWFkZXIgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVIZWFkZXIoKTtcbiAgICAvLyBjYW50IGZpZ3VyZSBvdXQgaG93IHRvIGRvIHRoaXMgd2l0aCBiaXRzIDonPFxuICAgIGNvbnN0IHNjaGVtYVBhZGRpbmcgPSAoNCAtIHNjaGVtYUhlYWRlci5zaXplICUgNCkgJSA0O1xuICAgIGNvbnN0IHJvd0RhdGEgPSBuZXcgQmxvYih0aGlzLnJvd3MuZmxhdE1hcChyID0+IHtcbiAgICAgIGNvbnN0IHJvd0Jsb2IgPSB0aGlzLnNjaGVtYS5zZXJpYWxpemVSb3cocilcbiAgICAgIGlmIChyLl9fcm93SWQgPT09IDEpXG4gICAgICAgIHJvd0Jsb2IuYXJyYXlCdWZmZXIoKS50aGVuKGFiID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgQVJSQVkgQlVGRkVSIEZPUiBGSVJTVCBST1cgT0YgJHt0aGlzLm5hbWV9YCwgYWIpO1xuICAgICAgICB9KTtcbiAgICAgIHJldHVybiByb3dCbG9iO1xuICAgIH0pKTtcbiAgICBjb25zdCBkYXRhUGFkZGluZyA9ICg0IC0gcm93RGF0YS5zaXplICUgNCkgJSA0O1xuICAgIHJldHVybiBbXG4gICAgICBuZXcgVWludDMyQXJyYXkoW1xuICAgICAgICB0aGlzLnJvd3MubGVuZ3RoLFxuICAgICAgICBzY2hlbWFIZWFkZXIuc2l6ZSArIHNjaGVtYVBhZGRpbmcsXG4gICAgICAgIHJvd0RhdGEuc2l6ZSArIGRhdGFQYWRkaW5nXG4gICAgICBdKSxcbiAgICAgIG5ldyBCbG9iKFtcbiAgICAgICAgc2NoZW1hSGVhZGVyLFxuICAgICAgICBuZXcgQXJyYXlCdWZmZXIoc2NoZW1hUGFkZGluZylcbiAgICAgIF0pLFxuICAgICAgbmV3IEJsb2IoW1xuICAgICAgICByb3dEYXRhLFxuICAgICAgICBuZXcgVWludDhBcnJheShkYXRhUGFkZGluZylcbiAgICAgIF0pLFxuICAgIF07XG4gIH1cblxuICBzdGF0aWMgY29uY2F0VGFibGVzICh0YWJsZXM6IFRhYmxlW10pOiBCbG9iIHtcbiAgICBjb25zdCBhbGxTaXplcyA9IG5ldyBVaW50MzJBcnJheSgxICsgdGFibGVzLmxlbmd0aCAqIDMpO1xuICAgIGNvbnN0IGFsbEhlYWRlcnM6IEJsb2JbXSA9IFtdO1xuICAgIGNvbnN0IGFsbERhdGE6IEJsb2JbXSA9IFtdO1xuXG4gICAgY29uc3QgYmxvYnMgPSB0YWJsZXMubWFwKHQgPT4gdC5zZXJpYWxpemUoKSk7XG4gICAgYWxsU2l6ZXNbMF0gPSBibG9icy5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBbaSwgW3NpemVzLCBoZWFkZXJzLCBkYXRhXV0gb2YgYmxvYnMuZW50cmllcygpKSB7XG4gICAgICBjb25zb2xlLmxvZygnQkxCTycsIGksIHNpemVzLCBoZWFkZXJzLCBkYXRhKVxuICAgICAgYWxsU2l6ZXMuc2V0KHNpemVzLCAxICsgaSAqIDMpO1xuICAgICAgYWxsSGVhZGVycy5wdXNoKGhlYWRlcnMpO1xuICAgICAgYWxsRGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyh7IHRhYmxlcywgYmxvYnMsIGFsbFNpemVzLCBhbGxIZWFkZXJzLCBhbGxEYXRhIH0pXG4gICAgcmV0dXJuIG5ldyBCbG9iKFthbGxTaXplcywgLi4uYWxsSGVhZGVycywgLi4uYWxsRGF0YV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIG9wZW5CbG9iIChibG9iOiBCbG9iKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBUYWJsZT4+IHtcbiAgICBpZiAoYmxvYi5zaXplICUgNCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCd3b25reSBibG9iIHNpemUnKTtcbiAgICBjb25zdCBudW1UYWJsZXMgPSBuZXcgVWludDMyQXJyYXkoYXdhaXQgYmxvYi5zbGljZSgwLCA0KS5hcnJheUJ1ZmZlcigpKVswXTtcblxuICAgIC8vIG92ZXJhbGwgYnl0ZSBvZmZzZXRcbiAgICBsZXQgYm8gPSA0O1xuICAgIGNvbnN0IHNpemVzID0gbmV3IFVpbnQzMkFycmF5KFxuICAgICAgYXdhaXQgYmxvYi5zbGljZShibywgYm8gKz0gbnVtVGFibGVzICogMTIpLmFycmF5QnVmZmVyKClcbiAgICApO1xuXG4gICAgY29uc3QgdEJsb2JzOiBUYWJsZUJsb2JbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgY29uc3Qgc2kgPSBpICogMztcbiAgICAgIGNvbnN0IG51bVJvd3MgPSBzaXplc1tzaV07XG4gICAgICBjb25zdCBoU2l6ZSA9IHNpemVzW3NpICsgMV07XG4gICAgICB0QmxvYnNbaV0gPSB7IG51bVJvd3MsIGhlYWRlckJsb2I6IGJsb2Iuc2xpY2UoYm8sIGJvICs9IGhTaXplKSB9IGFzIGFueTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UYWJsZXM7IGkrKykge1xuICAgICAgdEJsb2JzW2ldLmRhdGFCbG9iID0gYmxvYi5zbGljZShibywgYm8gKz0gc2l6ZXNbaSAqIDMgKyAyXSk7XG4gICAgfTtcbiAgICBjb25zb2xlLmxvZygnUFJFJEVQRUUnLCBzaXplcywgdEJsb2JzKVxuICAgIGNvbnN0IHRhYmxlcyA9IGF3YWl0IFByb21pc2UuYWxsKHRCbG9icy5tYXAodGIgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbUJsb2IodGIpO1xuICAgIH0pKVxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGFibGVzLm1hcCh0ID0+IFt0LnNjaGVtYS5uYW1lLCB0XSkpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGZyb21CbG9iICh7XG4gICAgaGVhZGVyQmxvYixcbiAgICBkYXRhQmxvYixcbiAgICBudW1Sb3dzLFxuICB9OiBUYWJsZUJsb2IpOiBQcm9taXNlPFRhYmxlPiB7XG4gICAgY29uc3Qgc2NoZW1hID0gU2NoZW1hLmZyb21CdWZmZXIoYXdhaXQgaGVhZGVyQmxvYi5hcnJheUJ1ZmZlcigpKTtcbiAgICBsZXQgcmJvID0gMDtcbiAgICBsZXQgX19yb3dJZCA9IDA7XG4gICAgY29uc3Qgcm93czogUm93W10gPSBbXTtcbiAgICAvLyBUT0RPIC0gY291bGQgZGVmaW5pdGVseSB1c2UgYSBzdHJlYW0gZm9yIHRoaXNcbiAgICBjb25zdCBkYXRhQnVmZmVyID0gYXdhaXQgZGF0YUJsb2IuYXJyYXlCdWZmZXIoKTtcbiAgICB3aGlsZSAocmJvIDwgZGF0YUJ1ZmZlci5ieXRlTGVuZ3RoKSB7XG4gICAgICBjb25zdCBbcm93LCByZWFkXSA9IHNjaGVtYS5yb3dGcm9tQnVmZmVyKHJibywgZGF0YUJ1ZmZlciwgX19yb3dJZCsrKTtcbiAgICAgIHJvd3MucHVzaChyb3cpXG4gICAgICByYm8gKz0gcmVhZDtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgICBpZiAoX19yb3dJZCA+IDEwKSBicmVhaztcbiAgICB9XG5cbiAgICAvKlxuICAgIGlmIChyb3dzLmxlbmd0aCAhPT0gbnVtUm93cykgdGhyb3cgbmV3IEVycm9yKGBcbiAgICAgIG15IHBhcmFub2lhIGhhcyBiZWVuIHZpbmRpY2F0ZWQuLi5cbiAgICAgICAgICAgICAgICAuLi5teSBlbmdpbmVlcmluZyBwcm93ZXNzIGhhcyBub3RcbiAgICAgICAgICAtLSB0aGUgZHVtYmFzcyBnYW1lclxuICAgIGApO1xuICAgICovXG5cbiAgICByZXR1cm4gbmV3IFRhYmxlKHJvd3MsIHNjaGVtYSk7XG4gIH1cblxuXG4gIHByaW50ICh3aWR0aDogbnVtYmVyID0gODAsIGZpZWxkczogUmVhZG9ubHk8c3RyaW5nW10+ID0gW10sIG4/OiBudW1iZXIsIG0/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoIWZpZWxkcy5sZW5ndGgpIGZpZWxkcyA9IHRoaXMuc2NoZW1hLmZpZWxkcztcbiAgICBjb25zdCBbaGVhZCwgdGFpbF0gPSB0YWJsZURlY28odGhpcy5uYW1lLCB3aWR0aCwgMTgpO1xuICAgIGNvbnN0IHByaW50Um93ID0gKHI6IGFueSwgLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgIC8vZGVidWdnZXI7XG4gICAgICByZXR1cm4gdGhpcy5zY2hlbWEucHJpbnRSb3cociwgZmllbGRzKVxuICAgIH1cbiAgICBsZXQgcm93cyA9IHRoaXMucm93cztcbiAgICBpZiAobiAhPSBudWxsKSB7XG4gICAgICBpZiAobSAhPSBudWxsKSByb3dzID0gcm93cy5zbGljZShuLCBtKVxuICAgICAgZWxzZSByb3dzID0gcm93cy5zbGljZSgwLCBuKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhoZWFkKTtcbiAgICBjb25zb2xlLnRhYmxlKHJvd3MubWFwKHByaW50Um93KSwgZmllbGRzKTtcbiAgICBjb25zb2xlLmxvZyh0YWlsKTtcbiAgfVxuICAvKlxuICByYXdUb1JvdyAoZDogc3RyaW5nW10pOiBSb3cge1xuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zY2hlbWEuY29sdW1ucy5tYXAociA9PiBbXG4gICAgICByLm5hbWUsXG4gICAgICByLnRvVmFsKGRbci5pbmRleF0pXG4gICAgXSkpO1xuICB9XG4gIHJhd1RvU3RyaW5nIChkOiBzdHJpbmdbXSwgLi4uYXJnczogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIC8vIGp1c3QgYXNzdW1lIGZpcnN0IHR3byBmaWVsZHMgYXJlIGFsd2F5cyBpZCwgbmFtZS4gZXZlbiBpZiB0aGF0J3Mgbm90IHRydWVcbiAgICAvLyB0aGlzIGlzIGp1c3QgZm9yIHZpc3VhbGl6YXRpb24gcHVycG9yc2VzXG4gICAgbGV0IGV4dHJhID0gJyc7XG4gICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZSA9IHRoaXMucmF3VG9Sb3coZCk7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYXJncykge1xuICAgICAgICAvLyBkb24ndCByZXByaW50IG5hbWUgb3IgaWRcbiAgICAgICAgaWYgKGEgPT09IHRoaXMuc2NoZW1hLmZpZWxkc1swXSB8fCBhID09PSB0aGlzLnNjaGVtYS5maWVsZHNbMV0pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmIChlW2FdICE9IG51bGwpXG4gICAgICAgICAgcy5wdXNoKGAke2F9OiAke0pTT04uc3RyaW5naWZ5KGVbYV0pfWApXG4gICAgICB9XG4gICAgICBleHRyYSA9IHMubGVuZ3RoID4gMCA/IGAgeyAke3Muam9pbignLCAnKX0gfWAgOiAne30nO1xuICAgIH1cbiAgICByZXR1cm4gYDwke3RoaXMuc2NoZW1hLm5hbWV9OiR7ZFswXSA/PyAnPyd9IFwiJHtkWzFdfVwiJHtleHRyYX0+YDtcbiAgfVxuICAqL1xufVxudHlwZSBUYWJsZUJsb2IgPSB7IG51bVJvd3M6IG51bWJlciwgaGVhZGVyQmxvYjogQmxvYiwgZGF0YUJsb2I6IEJsb2IgfTtcbiIsICJpbXBvcnQgeyBjc3ZEZWZzIH0gZnJvbSAnLi9jc3YtZGVmcyc7XG5pbXBvcnQgeyBwYXJzZUFsbCwgcmVhZENTViB9IGZyb20gJy4vcGFyc2UtY3N2JztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgeyBUYWJsZSB9IGZyb20gJy4vdGFibGUnO1xuaW1wb3J0IHsgd3JpdGVGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5cbmNvbnN0IHdpZHRoID0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucztcbmNvbnN0IFtmaWxlLCAuLi5maWVsZHNdID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuXG5jb25zb2xlLmxvZygnQVJHUycsIHsgZmlsZSwgZmllbGRzIH0pXG5cbmlmIChmaWxlKSB7XG4gIGNvbnN0IGRlZiA9IGNzdkRlZnNbZmlsZV07XG4gIC8vaWYgKGRlZikgKGF3YWl0IHJlYWRDU1YoZmlsZSwgZGVmKSkucHJpbnQod2lkdGgsIGZpZWxkcylcbiAgaWYgKGRlZikgZ2V0RFVNUFkoYXdhaXQgcmVhZENTVihmaWxlLCBkZWYpKTtcbiAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoYG5vIGRlZiBmb3IgXCIke2ZpbGV9XCJgKTtcbn0gZWxzZSB7XG4gIGNvbnN0IHRhYmxlcyA9IGF3YWl0IHBhcnNlQWxsKGNzdkRlZnMpO1xuICBmb3IgKGNvbnN0IHQgb2YgdGFibGVzKSBhd2FpdCBnZXREVU1QWSh0KTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBnZXREVU1QWSh0OiBUYWJsZSkge1xuICBjb25zdCBibG9iID0gVGFibGUuY29uY2F0VGFibGVzKFt0XSk7XG4gIGNvbnN0IHUgPSBhd2FpdCBUYWJsZS5vcGVuQmxvYihibG9iKTtcbiAgLy90LnNjaGVtYS5wcmludCgpO1xuICBkZWJ1Z2dlcjtcbiAgdS5Vbml0LnByaW50KHdpZHRoKTtcbiAgLy9hd2FpdCB3cml0ZUZpbGUoJy4vdG1wLmJpbicsIGJsb2Iuc3RyZWFtKCksIHsgZW5jb2Rpbmc6IG51bGwgfSk7XG4gIC8vY29uc29sZS5sb2coJ3dyaXRlZCcpXG5cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDTyxJQUFNLFVBQThDO0FBQUEsRUFDekQsNEJBQTRCO0FBQUEsSUFDMUIsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsSUFDN0IsV0FBVztBQUFBO0FBQUEsTUFFVCxXQUFXLENBQUMsTUFBTyxPQUFPLENBQUMsSUFBSSxNQUFPO0FBQUEsSUFDeEM7QUFBQSxFQUNGO0FBQUEsRUFDQSw0QkFBNEI7QUFBQSxJQUMxQixNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7QUFBQSxFQUMvQjtBQUFBLEVBRUEsaUNBQWlDO0FBQUEsSUFDL0IsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQUEsRUFDL0I7QUFBQSxFQUNBLGdDQUFnQztBQUFBLElBQzlCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxrQ0FBa0M7QUFBQSxJQUNoQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNoQztBQUFBLEVBQ0EsMkNBQTJDO0FBQUEsSUFDekMsTUFBTTtBQUFBLElBQ04sY0FBYyxvQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFBQSxFQUNBLDZCQUE2QjtBQUFBLElBQzNCLE1BQU07QUFBQSxJQUNOLGNBQWMsb0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFDQSxxQ0FBcUM7QUFBQSxJQUNuQyxNQUFNO0FBQUEsSUFDTixjQUFjLG9CQUFJLElBQUksQ0FBQyxNQUFNLENB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RSxJQUFJLElBQUksSUFBSSxJQUFJLE1BQU0sUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUM7QUFBQSxFQUN0RTtBQUVBLFNBQU8sSUFBSTtBQUFBLElBQ1Q7QUFBQSxJQUNBLElBQUksT0FBTztBQUFBLE1BQ1QsTUFBTTtBQUFBLE1BQ04sUUFBQUE7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVBLGVBQXNCLFNBQVMsTUFBMEM7QUFDdkUsU0FBTyxRQUFRO0FBQUEsSUFDYixPQUFPLFFBQVEsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTSxPQUFPLENBQUM7QUFBQSxFQUN0RTtBQUNGOzs7QUVqSEEsT0FBTyxhQUFhO0FBSXBCLElBQU0sUUFBUSxRQUFRLE9BQU87QUFDN0IsSUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksUUFBUSxLQUFLLE1BQU0sQ0FBQztBQUU5QyxRQUFRLElBQUksUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRXBDLElBQUksTUFBTTtBQUNSLFFBQU0sTUFBTSxRQUFRLElBQUk7QUFFeEIsTUFBSTtBQUFLLGFBQVMsTUFBTSxRQUFRLE1BQU0sR0FBRyxDQUFDO0FBQUE7QUFDckMsVUFBTSxJQUFJLE1BQU0sZUFBZSxJQUFJLEdBQUc7QUFDN0MsT0FBTztBQUNMLFFBQU0sU0FBUyxNQUFNLFNBQVMsT0FBTztBQUNyQyxhQUFXLEtBQUs7QUFBUSxVQUFNLFNBQVMsQ0FBQztBQUMxQztBQUdBLGVBQWUsU0FBUyxHQUFVO0FBQ2hDLFFBQU0sT0FBTyxNQUFNLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDbkMsUUFBTSxJQUFJLE1BQU0sTUFBTSxTQUFTLElBQUk7QUFFbkM7QUFDQSxJQUFFLEtBQUssTUFBTSxLQUFLO0FBSXBCOyIsCiAgIm5hbWVzIjogWyJpIiwgIndpZHRoIiwgImZpZWxkcyIsICJ3aWR0aCIsICJ3aWR0aCIsICJmaWVsZHMiLCAiZmllbGRzIiwgImluZGV4Il0KfQo=
