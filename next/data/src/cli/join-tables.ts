import {
  BoolColumn,
  COLUMN,
  NumericColumn,
  Schema,
  Table
} from 'dom6inspector-next-lib';

type TR = Record<string, Table>;
export function joinDumped (tableList: Table[]) {
  const tables: TR = Object.fromEntries(tableList.map(t => [t.name, t]));
  tableList.push(
    makeNationSites(tables),
    makeUnitBySite(tables),
    makeSpellByNation(tables),
    makeSpellByUnit(tables),
    makeUnitByNation(tables),
  );

  //dumpRealms(tables);

  // tables have been combined~!
  for (const t of [
    tables.CoastLeaderTypeByNation,
    tables.CoastTroopTypeByNation,
    tables.FortLeaderTypeByNation,
    tables.FortTroopTypeByNation,
    tables.NonFortLeaderTypeByNation,
    tables.NonFortTroopTypeByNation,
    tables.PretenderTypeByNation,
    tables.UnpretenderTypeByNation,
    tables.Realm,
  ]) {
    Table.removeTable(t, tableList);
  }
}

function dumpRealms ({ Realm, Unit }: TR) {
  // seems like the realm csv is redundant?
  console.log('REALM STATS:')
  const combined = new Map<number, number>();

  for (const u of Unit.rows) if (u.realm1) combined.set(u.id, u.realm1);

  for (const { monster_number, realm } of Realm.rows) {
    if (!combined.has(monster_number)) {
      console.log(`${monster_number} REALM IS DEFINED ONLY IN REALMS CSV`);
      combined.set(monster_number, realm);
    } else if (combined.get(monster_number) !== realm) {
      console.log(`${monster_number} REALM CONFLICT! unit.csv = ${combined.get(monster_number)}, realm.csv=${realm}`);
    }
  }
}


const ATTR_FARSUMCOM = 790; // lul why is this the only one??
// TODO - reanimations aswell? twiceborn too? lemuria-esque freespawn? voidgate?
// might have to add all that manually, which should be okay since it's not like
// they're accessible to mods anyway?
// soon TODO - summons, event monsters/heros
/*
not used, just keeping for notes
export const enum REC_SRC {
  UNKNOWN = 0, // i.e. none found, probably indie pd?
  SUMMON_ALLIES = 1, // via #makemonsterN
  SUMMON_DOM = 2, // via #[rare]domsummonN
  SUMMON_AUTO = 3, // via #summonN / "turmoilsummon" / wintersummon1d3
  SUMMON_BATTLE = 4, // via #batstartsumN or #battlesum
  TEMPLE_TRAINER = 5, // via #templetrainer, value is hard coded to 1859...
  RITUAL = 6,
  ENTER_SITE = 7,
  REC_SITE = 8,
  REC_CAP = 9,
  REC_FOREIGN = 10,
  REC_FORT = 11,
  EVENT = 12,
  HERO = 13,
  PRETENDER = 14,
}
*/

// TODO - export these from somewhere more sensible
export const enum REC_TYPE {
  FORT = 0, // normal i guess
  PRETENDER = 1, // u heard it here
  FOREIGN = 2,
  WATER = 3,
  COAST = 4,
  FOREST = 5,
  SWAMP = 6,
  WASTE = 7,
  MOUNTAIN = 8,
  CAVE = 9,
  PLAINS = 10,
  HERO = 11,
  MULTIHERO = 12,
  PRETENDER_CHEAP_20 = 13,
  PRETENDER_CHEAP_40 = 14,
}

export const enum UNIT_TYPE {
  NONE = 0,      // just a unit...
  COMMANDER = 1,
  PRETENDER = 2,
  CAPONLY = 4,
  HERO = 8,
}


export const RealmNames = [
  'None',
  'North',
  'Celtic',
  'Mediterranean',
  'Far East',
  'Middle East',
  'Middle America',
  'Africa',
  'India',
  'Deeps',
  'Default'
];

  /*
const SUM_FIELDS = [
  // these two combined seem to be summon #makemonsterN
  'summon', 'n_summon',
  // this is used by the ghoul lord only, and it should actually be `n_summon = 5`
  'summon5',
  // auto summon 1/month, as per mod commands, used only by false prophet and vine guy?
  'summon1',

  // dom summon commands
  'domsummon',
  'domsummon2',
  'domsummon20',
  'raredomsummon',

  'batstartsum1',
  'batstartsum2',
  'batstartsum3',
  'batstartsum4',
  'batstartsum5',
  'batstartsum1d3',
  'batstartsum1d6',
  'batstartsum2d6',
  'batstartsum3d6',
  'batstartsum4d6',
  'batstartsum5d6',
  'batstartsum6d6',
  'battlesum5', // per round

  //'onisummon', we dont really care about this one because it doesnt tell us
  //  about which monsters are summoned
  // 'heathensummon', idfk?? https://illwiki.com/dom5/user/loggy/slaver
  // 'coldsummon', unused
  'wintersummon1d3', // vamp queen, not actually a (documented) command?

  'turmoilsummon', // also not a command ~ !
]
*/

function makeNationSites(tables: TR): Table {
  const { AttributeByNation, Nation } = tables;
  const delRows: number[] = [];
  const schema = new Schema({
    name: 'SiteByNation',
    key: '__rowId',
    flagsUsed: 1,
    overrides: {},
    rawFields: {},
    joins: 'Nation[nationId]+MagicSite[siteId]',
    fields: [
      'nationId',
      'siteId',
      'future',
    ],
    columns: [
      new NumericColumn({
        name: 'nationId',
        index: 0,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'siteId',
        index: 1,
        type: COLUMN.U16,
      }),
      new BoolColumn({
        name: 'future',
        index: 2,
        type: COLUMN.BOOL,
        bit: 0,
        flag: 1
      }),
    ]
  });


  const rows: any[] = []
  for (let [i, row] of AttributeByNation.rows.entries()) {
    const { nation_number: nationId, attribute, raw_value: siteId } = row;
    let future: boolean = false;
    switch (attribute) {
      // while we're here, lets put realm id right on the nation (extraField in def)
      case 289:
        //console.log(`national realm: ${nationId} -> ${siteId}`)
        const nation = Nation.map.get(nationId);
        if (!nation) {
          console.error(`invalid nation id ${nationId} (no row in Nation)`);
        } else {
          // confusing! tons of nations have multiple realms? just use the most
          // recent one I guess?
          //if (nation.realm) {
            //const prev = RealmNames[nation.realm];
            //const next = RealmNames[siteId];
            //console.error(`${nation.name} REALM ${prev} -> ${next}`);
          //}
          nation.realm = siteId;
        }
        delRows.push(i);
        continue;
      // future site
      case 631:
        future = true;
        // u know this bitch falls THRU
      // start site
      case 52:
      case 100:
      case 25:
        break;
      default:
        // some other dumbass attribute
        continue;
    }

    rows.push({
      nationId,
      siteId,
      future,
      __rowId: rows.length,
    });
    delRows.push(i);
  }

  // remove now-redundant attributes
  let di: number|undefined;
  while ((di = delRows.pop()) !== undefined)
    AttributeByNation.rows.splice(di, 1);

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true
  );
}

/*
function makeUnitSourceSchema (): any {
  return new Schema({
    name: 'UnitSource',
    key: '__rowId',
    flagsUsed: 0,
    overrides: {},
    rawFields: {
      unitId: 0,
      nationId: 1,
      sourceId: 2,
      sourceType: 3,
      sourceArg: 4,
    },
    fields: [
      'unitId',
      'nationId',
      'sourceId',
      'sourceType',
      'sourceArg',
    ],
    columns: [
      new NumericColumn({
        name: 'unitId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'nationId',
        index: 1,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'sourceId',
        index: 2,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'sourceType',
        index: 3,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'sourceArg',
        index: 4,
        type: COLUMN.U16,
      }),
    ]
  });
}
*/

function makeSpellByNation (tables: TR): Table {
  const attrs = tables.AttributeBySpell;
  const delRows: number[] = [];
  const schema = new Schema({
    name: 'SpellByNation',
    key: '__rowId',
    joins: 'Spell[spellId]+Nation[nationId]',
    flagsUsed: 0,
    overrides: {},
    rawFields: { spellId: 0, nationId: 1 },
    fields: ['spellId', 'nationId'],
    columns: [
      new NumericColumn({
        name: 'spellId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'nationId',
        index: 1,
        type: COLUMN.U8,
      }),
    ]
  });

  let __rowId = 0;
  const rows: any[] = [];
  for (const [i, r] of attrs.rows.entries()) {
    const { spell_number: spellId, attribute, raw_value } = r;
    if (attribute === 278) {
      //console.log(`${spellId} IS RESTRICTED TO NATION ${raw_value}`);
      const nationId = Number(raw_value);
      if (!Number.isSafeInteger(nationId) || nationId < 0 || nationId > 255)
        throw new Error(`     !!!!! TOO BIG NAYSH !!!!! (${nationId})`);
      delRows.push(i);
      rows.push({ __rowId, spellId, nationId });
      __rowId++;
    }
  }
  let di: number|undefined;
  while ((di = delRows.pop()) !== undefined) attrs.rows.splice(di, 1);

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}

function makeSpellByUnit (tables: TR): Table {
  const attrs = tables.AttributeBySpell;
  const delRows: number[] = [];
  const schema = new Schema({
    name: 'SpellByUnit',
    key: '__rowId',
    joins: 'Spell[spellId]+Unit[unitId]',
    flagsUsed: 0,
    overrides: {},
    rawFields: { spellId: 0, unitId: 1 },
    fields: ['spellId', 'unitId'],
    columns: [
      new NumericColumn({
        name: 'spellId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'unitId',
        index: 1,
        type: COLUMN.I32,
      }),
    ]
  });

  let __rowId = 0;
  const rows: any[] = [];
  for (const [i, r] of attrs.rows.entries()) {
    const { spell_number: spellId, attribute, raw_value } = r;
    if (attribute === 731) {
      //console.log(`${spellId} IS RESTRICTED TO UNIT ${raw_value}`);
      const unitId = Number(raw_value);
      if (!Number.isSafeInteger(unitId))
        throw new Error(`     !!!!! TOO BIG UNIT !!!!! (${unitId})`);
      delRows.push(i);
      rows.push({ __rowId, spellId, unitId });
      __rowId++;
    }
  }
  let di: number|undefined = undefined
  while ((di = delRows.pop()) !== undefined) attrs.rows.splice(di, 1);

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );
}

// few things here:
// - hmon1-5 & hcom1-4 are cap-only units/commanders
// - nationalrecruits + natcom / natmon are non-cap only site-exclusives (yay)
// - mon1-2 & com1-3 are generic recruitable units/commanders
// - sum1-4 & n_sum1-4 are mage-summonable (n determines mage lvl req)
// (voidgate - not really relevant here, it doesn't indicate what monsters are
// summoned, may add those manually?)

export enum SITE_REC {
  HOME_MON = 0, // arg is nation, we'll have to add it later though
  HOME_COM = 1, // same
  REC_MON = 2,
  REC_COM = 3,
  NAT_MON = 4, // arg is nation
  NAT_COM = 5, // same
  SUMMON = 8, // arg is level requirement
}

const S_HMONS = Array.from('12345', n => `hmon${n}`);
const S_HCOMS = Array.from('1234', n => `hcom${n}`);
const S_RMONS = Array.from('12', n => `mon${n}`);
const S_RCOMS = Array.from('123', n => `com${n}`);
const S_SUMNS = Array.from('1234', n => [`sum${n}`, `n_sum${n}`]);

function makeUnitBySite (tables: TR): Table {
  const { MagicSite, SiteByNation, Unit } = tables;
  if (!SiteByNation) throw new Error('do SiteByNation first');

  const schema = new Schema({
    name: 'UnitBySite',
    key: '__rowId',
    joins: 'MagicSite[siteId]+Unit[unitId]',
    flagsUsed: 0,
    overrides: {},
    rawFields: { siteId: 0, unitId: 1, recType: 2, recArg: 3 },
    fields: ['siteId', 'unitId', 'recType', 'recArg'],
    columns: [
      new NumericColumn({
        name: 'siteId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'unitId',
        index: 1,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'recType',
        index: 2,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'recArg',
        index: 3,
        type: COLUMN.U8,
      }),
    ]
  });

  const rows: any[] = [];

  for (const site of MagicSite.rows) {
    for (const k of S_HMONS) {
      const mnr = site[k];
      // we assume the fields are always used in order
      if (!mnr) break;
      let recArg = 0;
      const nj = site.SiteByNation?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          'mixed up cap-only mon site', k, site.id, site.name, site.SiteByNation
        );
        recArg = 0;
        continue;
      } else {
        //console.log('niiiice', nj, site.SiteByNation)
        recArg = nj.nationId;
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recArg,
        recType: SITE_REC.HOME_MON,
      });
    }
    for (const k of S_HCOMS) {
      const mnr = site[k];
      // we assume the fields are always used in order
      if (!mnr) break;
      let recArg = 0;
      const nj = site.SiteByNation?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          'mixed up cap-only cmdr site', k, site.id, site.name, site.SiteByNation
        );
        recArg = 0;
        continue;
      } else {
        recArg = nj.nationId;
      }
      const unit = Unit.map.get(mnr);
      if (unit) {
        unit.type |= 1; // flag as a commander
      } else {
        console.error('mixed up cap-only site (no unit in unit table?)', site);
        continue;
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recArg,
        recType: SITE_REC.HOME_COM,
      });
    }
    for (const k of S_RMONS) {
      const mnr = site[k];
      if (!mnr) break;
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: SITE_REC.REC_MON,
        recArg: 0,
      });
    }
    for (const k of S_RCOMS) {
      const mnr = site[k];
      // we assume the fields are always used in order
      if (!mnr) break;
      const unit = Unit.map.get(mnr);
      if (unit) {
        unit.type |= 1; // flag as a commander
      } else {
        console.error('mixed up site commander (no unit in unit table?)', site);
      }
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: SITE_REC.REC_MON,
        recArg: 0,
      });
    }
    for (const [k, nk] of S_SUMNS) {
      const mnr = site[k];
      // we assume the fields are always used in order
      if (!mnr) break;
      const arg = site[nk];
      rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: mnr,
        recType: SITE_REC.SUMMON,
        recArg: arg, // level requiurement (could also include path)
      });
    }

    if (site.nationalrecruits) {
      if (site.natmon) rows.push({
        __rowId: rows.length,
        siteId: site.id,
        unitId: site.natmon,
        recType: SITE_REC.NAT_MON,
        recArg: site.nationalrecruits,
      });
      if (site.natcom) {
        rows.push({
          __rowId: rows.length,
          siteId: site.id,
          unitId: site.natcom,
          recType: SITE_REC.NAT_COM,
          recArg: site.nationalrecruits,
        });
        const unit = Unit.map.get(site.natcom);
        if (unit) {
          unit.type |= 1; // flag as a commander
        } else {
          console.error('mixed up natcom (no unit in unit table?)', site);
        }
      }
    }
  }
  // yay!
  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false
  );

}

function makeUnitByUnitSummon (tables: TR) {
  const schema = new Schema({
    name: 'UnitBySite',
    key: '__rowId',
    flagsUsed: 0,
    overrides: {},
    rawFields: { unitId: 0, summonerId: 1 },
    fields: ['unitId', 'summonerId'],
    columns: [
      new NumericColumn({
        name: 'unitId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'summonerId',
        index: 1,
        type: COLUMN.U16,
      }),
    ]
  });

  const rows: any[] = [];

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false,
  );
}

// TODO - not sure yet if I want to duplicate cap-only sites here?
function makeUnitByNation (tables: TR): Table {
  const schema = new Schema({
    name: 'UnitByNation',
    key: '__rowId',
    flagsUsed: 0,
    overrides: {},
    rawFields: { nationId: 0, unitId: 1, recType: 2 },
    joins: 'Nation[nationId]+Unit[unitId]',
    fields: ['nationId', 'unitId', 'recType'],
    columns: [
      new NumericColumn({
        name: 'nationId',
        index: 0,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'unitId',
        index: 1,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'recType',
        index: 1,
        type: COLUMN.U8,
      }),
    ]
  });


  // TODO - pretenders
  // following the logic in ../../../../scripts/DMI/MNation.js
  //   1. determine nation realm(s) and use that to add pretenders
  //   2. use the list of "extra" added pretenders to add any extra
  //   3. use the unpretenders table to do opposite

  // there's a lot goin on here
  const rows: any[] = [];

  makeRecruitmentFromAttrs(tables, rows);
  combineRecruitmentTables(tables, rows);
  makePretenderByNation(tables, rows)

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    false,
  );
}

function makeRecruitmentFromAttrs (tables: TR, rows: any[]) {
  const { AttributeByNation, Unit } = tables;
  const delABNRows: number[] = [];
  for (const [iABN ,r]  of AttributeByNation.rows.entries()) {
    const { raw_value, attribute, nation_number } = r;
    let unit: any;
    let unitId: any = null // smfh
    let unitType = 0;
    let recType = 0;
    switch (attribute) {
      case 158:
      case 159:
        unit = Unit.map.get(raw_value);
        if (!unit) throw new Error('piss unit');
        unitId = unit.landshape || unit.id;
        recType = REC_TYPE.COAST;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 160:
      case 161:
      case 162:
        unit = Unit.map.get(raw_value);
        if (!unit) throw new Error('piss unit');
        unitId = unit.landshape || unit.id;
        recType = REC_TYPE.COAST;
        break;
      case 163:
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 186:
        unit = Unit.map.get(raw_value);
        if (!unit) throw new Error('piss unit');
        unitId = unit.watershape || unit.id;
        recType = REC_TYPE.WATER;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 187:
      case 189:
      case 190:
      case 191:
      case 213:
        unit = Unit.map.get(raw_value);
        if (!unit) throw new Error('piss unit');
        unitId = unit.watershape || unit.id;
        recType = REC_TYPE.WATER;
        break;
      case 294:
      case 412:
        unitId = raw_value;
        recType = REC_TYPE.FOREST;
        break;
      case 295:
      case 413:
        unitId = raw_value;
        recType = REC_TYPE.FOREST;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 296:
        unitId = raw_value;
        recType = REC_TYPE.SWAMP;
        break;
      case 297:
        unitId = raw_value;
        recType = REC_TYPE.SWAMP;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 298:
      case 408:
        unitId = raw_value;
        recType = REC_TYPE.MOUNTAIN;
        break;
      case 299:
      case 409:
        unitId = raw_value;
        recType = REC_TYPE.MOUNTAIN;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 300:
      case 416:
        unitId = raw_value;
        recType = REC_TYPE.WASTE;
        break;
      case 301:
      case 417:
        unitId = raw_value;
        recType = REC_TYPE.WASTE;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 302:
        unitId = raw_value;
        recType = REC_TYPE.CAVE;
        break;
      case 303:
        unitId = raw_value;
        recType = REC_TYPE.CAVE;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 404:
      case 406:
        unitId = raw_value;
        recType = REC_TYPE.PLAINS;
        break;
      case 405:
      case 407:
        unitId = raw_value;
        recType = REC_TYPE.PLAINS;
        unitType = UNIT_TYPE.COMMANDER;
        break;
      case 139:
      case 140:
      case 141:
      case 142:
      case 143:
      case 144:
        //console.log('HERO FINDER FOUND', raw_value)
        unitId = raw_value;
        unitType = UNIT_TYPE.COMMANDER | UNIT_TYPE.HERO;
        recType = REC_TYPE.HERO;
        break;
      case 145:
      case 146:
      case 149:
        //console.log('multi hero!', raw_value)
        unitId = raw_value;
        unitType = UNIT_TYPE.COMMANDER | UNIT_TYPE.HERO;
        recType = REC_TYPE.MULTIHERO;
        break;
    }

    if (unitId == null) continue;
    delABNRows.push(iABN);
    unit ??= Unit.map.get(unitId);
    if (unitType) unit.type |= unitType;
    if (!unit) console.error('more piss unit:', iABN, unitId);
    rows.push({
      unitId,
      recType,
      __rowId: rows.length,
      nationId: nation_number,
    });
  }

  let di: number|undefined;
  while ((di = delABNRows.pop()) !== undefined)
    AttributeByNation.rows.splice(di, 1);


}

function combineRecruitmentTables (tables: TR, rows: any[]) {
  const {
    Unit,
    CoastLeaderTypeByNation,
    CoastTroopTypeByNation,
    FortLeaderTypeByNation,
    FortTroopTypeByNation,
    NonFortLeaderTypeByNation,
    NonFortTroopTypeByNation,
  } = tables;
  for (const r of FortTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.FORT,
    })
  }

  for (const r of FortLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit) console.error('fort piss commander:', r);
    else unit.type |= UNIT_TYPE.COMMANDER;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.FORT,
    })
  }
  for (const r of CoastTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.COAST,
    })
  }

  for (const r of CoastLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit) console.error('fort piss commander:', r);
    else unit.type |= UNIT_TYPE.COMMANDER;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.COAST,
    })
  }

  for (const r of NonFortTroopTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.FOREIGN,
    })
  }

  for (const r of NonFortLeaderTypeByNation.rows) {
    const { monster_number: unitId, nation_number: nationId } = r;
    const unit = Unit.map.get(unitId);
    if (!unit) console.error('fort piss commander:', r);
    else unit.type |= UNIT_TYPE.COMMANDER;
    rows.push({
      __rowId: rows.length,
      unitId,
      nationId,
      recType: REC_TYPE.FOREIGN,
    })
  }
}

function makePretenderByNation (tables: TR, rows: any[]) {
  const {
    PretenderTypeByNation,
    UnpretenderTypeByNation,
    Nation,
    Unit,
    Realm,
    AttributeByNation,
  } = tables;

  // TODO - delete matching rows from the table
  const cheapAttrs = AttributeByNation.rows.filter(
    ({ attribute: a }) => a === 314 || a === 315
  );
  const cheap = new Map<number, Map<number, 20|40>>();
  for (const { nation_number, attribute, raw_value } of cheapAttrs) {
    if (!cheap.has(raw_value)) cheap.set(raw_value, new Map());
    const cUnit = cheap.get(raw_value)!;
    cUnit.set(nation_number, attribute === 314 ? 20 : 40);
  }

  // make a map first, we will convert to rows at the end
  const pretenders = new Map(Nation.rows.map(r => [r.id, new Set<number>()]));
  // monsters for each realm
  const r2m = new Map<number, Set<number>>();
  for (let i = 1; i <= 10; i++) r2m.set(i, new Set());
  for (const { monster_number, realm } of Realm.rows)
    r2m.get(realm)!.add(monster_number);

  // first do realm-based pretenders
  for (const { realm, id } of Nation.rows) {
    if (!realm) continue;
    for (const mnr of r2m.get(realm)!) {
      pretenders.get(id)!.add(mnr);
    }
  }

  // then add pretenders by nation
  for (const { monster_number, nation_number } of PretenderTypeByNation.rows) {
    pretenders.get(nation_number)!.add(monster_number);
  }
  // then unpretenders by nation
  for (const { monster_number, nation_number } of UnpretenderTypeByNation.rows) {
    pretenders.get(nation_number)!.delete(monster_number);
  }

  const addedUnits = new Map<number, any>();

  for (const [nationId, unitIds] of pretenders) {
    for (const unitId of unitIds) {
      if (!addedUnits.has(unitId)) addedUnits.set(unitId, Unit.map.get(unitId));
      const discount = cheap.get(unitId)?.get(nationId) ?? 0;
      const recType = discount === 40 ? REC_TYPE.PRETENDER_CHEAP_40 :
        discount === 20 ? REC_TYPE.PRETENDER_CHEAP_20 :
        REC_TYPE.PRETENDER;
      rows.push({
        unitId,
        recType,
        recArg: nationId,
        __rowId: rows.length,
      });
    }
  }

  for (const [id, u] of addedUnits) {
    if (!u) { console.warn('fake unit id?', id); continue }
    if (!u.startdom || !(u.type & UNIT_TYPE.PRETENDER)) {
      console.warn('not a pretender?', u.name, u.type, u.startdom);
    }
    u.type |= UNIT_TYPE.PRETENDER;
  }
}


