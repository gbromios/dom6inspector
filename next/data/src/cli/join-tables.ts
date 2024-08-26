
import {
  BoolColumn,
  COLUMN,
  NumericColumn,
  Schema,
  Table
} from 'dom6inspector-next-lib';

import * as MISC from './misc-defs';

type TR = Record<string, Table>;
export function joinDumped (tableList: Table[]) {
  const tables: TR = Object.fromEntries(tableList.map(t => [t.name, t]));
  tableList.push(
    makeNationSites(tables),
    makeUnitBySite(tables),
    makeSpellByNation(tables),
    makeSpellByUnit(tables),
    makeUnitByNation(tables),
    makeUnitByUnitSummon(tables),
    makeUnitBySpell(tables),
  );
  makeMiscUnit(tables);

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
  console.log(Realm.rows);
  /*
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
  */
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
function makeNationSites(tables: TR): Table {
  const { AttributeByNation, Nation } = tables;
  const delRows: number[] = [];
  const schema = new Schema({
    name: 'SiteByNation',
    key: '__rowId',
    flagsUsed: 1,
    overrides: {},
    rawFields: {},
    joins: 'Nation[nationId]=Sites+MagicSite[siteId]=Nations',
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

function makeSpellByNation (tables: TR): Table {
  const attrs = tables.AttributeBySpell;
  const delRows: number[] = [];
  const schema = new Schema({
    name: 'SpellByNation',
    key: '__rowId',
    joins: 'Spell[spellId]=Nations+Nation[nationId]=Spells',
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
    joins: 'Spell[spellId]=OnlyUnits+Unit[unitId]=Spells',
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
  SUMMON = 8, // arg is level requirement (include path?)
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
    joins: 'MagicSite[siteId]=Units+Unit[unitId]=Source',
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
      const nj = site.Nations?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          'mixed up cap-only mon site', k, site.id, site.name, site.Nations
        );
        recArg = 0;
        continue;
      } else {
        //console.log('niiiice', nj, site.Nations)
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
      const nj = site.Nations?.find(({ siteId }) => siteId === site.id);
      if (!nj) {
        console.error(
          'mixed up cap-only cmdr site', k, site.id, site.name, site.Nations
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
    true
  );

}

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
  //'wintersummon1d3', // vamp queen, not actually a (documented) command?
  //'turmoilsummon', // also not a command ~ !
]
*/


export const enum MON_SUMMON {
  UNKNOWN = 0,
  ALLIES = 1, // via #makemonsterN (and the single summon5 in the csv data)
  DOM = 2, // via #[rare]domsummonN
  AUTO = 3, // via #summon1 (goes up to 5)
  BATTLE_ROUND = 4, // via #batstartsumN or #battlesum
  BATTLE_START = 5, // via #batstartsumN or #battlesum
  TEMPLE_TRAINER = 6, // via #templetrainer, value is hard coded to 1859...
  WINTER = 7, // not a command, used once by vampire queen
  MOUNT = 8, // not really a summon but effectively similar
  // TODO - shape changing as well
  SHRINKS_TO = 9,
  GROWS_TO = 10,

}

function D_SUMMON (t: MON_SUMMON, s: number): string {
  switch (t) {
    case MON_SUMMON.ALLIES: return `#makemonster${s}`;
    case MON_SUMMON.DOM: {
      switch (s) {
        case 0: return `#domsummon`;
        case 1: return `#domsummon2`;
        case 2: return `#domsummon20`;
        case 3: return `#raredomsummon`;
        default: return `DOM ?? ${t}:${s}`;
      }
    }
    case MON_SUMMON.AUTO: return `#summon${s}`;
    case MON_SUMMON.BATTLE_ROUND: return `#battlesum${s}`;
    case MON_SUMMON.BATTLE_START: {
      const n = s & 63;
      return s & 128 ? `#batstartsum${n}d6` :
        s & 64 ? `#batstartsum1d3` :
        `#batstartsum${n}`;
    }
    case MON_SUMMON.TEMPLE_TRAINER: return `#templetrainer`;
    case MON_SUMMON.WINTER: return `(1d3 at the start of winter)`;
    case MON_SUMMON.MOUNT: return `(rides)`;
    case MON_SUMMON.GROWS_TO: return `(grows to)`;
    case MON_SUMMON.SHRINKS_TO: return `(shrinks to)`;
    default: return `IDK??? t=${t}; s=${s}`
  }
}


function makeUnitByUnitSummon (tables: TR) {
  const { Unit } = tables;
  const schema = new Schema({
    name: 'UnitBySummoner',
    key: '__rowId',
    joins: 'Unit[summonerId]=Summons+Unit[unitId]=Source',
    flagsUsed: 1,
    overrides: {},
    fields: ['unitId', 'summonerId', 'summonType', 'summonStrength', 'asTag'],
    rawFields: {
      unitId: 0,
      summonerId: 1,
      summonType: 2,
      summonStrength: 3,
      asTag: 4
    },
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
      new NumericColumn({
        name: 'summonType',
        index: 2,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'summonStrength',
        index: 3,
        type: COLUMN.U8,
      }),
      new BoolColumn({
        name: 'asTag',
        index: 4,
        type: COLUMN.BOOL,
        bit: 0,
        flag: 1,
      }),
    ]
  });

  const rows: any[] = [];

  function printRow (sid: number, uid: number, t: MON_SUMMON, s: number, p?: string) {
    p ??= '  -';
    const sn = Unit.map.get(sid).name
    const un = Unit.map.get(uid).name
    const d = D_SUMMON(t, s);
    console.log(`${p} ${d} ${sn} -> ${un}`);
  }
  function addRow (
    summonType: MON_SUMMON,
    summonStrength: number,
    summonerId: number,
    target: number,
  ) {
    if (target > 0) {
      const r = {
        __rowId: rows.length,
        summonerId,
        summonType,
        summonStrength,
        asTag: false,
        unitId: target,
      };
      //printRow(r.summonerId, r.unitId, r.summonType, r.summonStrength)
      rows.push(r);
    } else if (target < 0) {
      console.log('  MONTAG ' + target + ' [');
      if (!MONTAGS[target]?.length) console.log('    (MISSING!)');
      else for (const unitId of MONTAGS[target]) {
        const r = {
          __rowId: rows.length,
          summonerId,
          summonType,
          summonStrength,
          asTag: true,
          unitId,
        }
        //printRow(r.summonerId, r.unitId, r.summonType, r.summonStrength, '     >');
        rows.push(r);
      }
      console.log('  ]\n');
    } else {
      console.error(`      !!!!! ${Unit.map.get(summonerId).name} SUMMONS ID 0 !!`)
      return;
    }
  }

  for (const summoner of Unit.rows) {
    if (summoner.summon)
      addRow(MON_SUMMON.ALLIES, summoner.n_summon, summoner.id, summoner.summon);

    if (summoner.summon5)
      addRow(MON_SUMMON.ALLIES, 5, summoner.id, summoner.summon5);

    if (summoner.summon1)
      addRow(MON_SUMMON.AUTO, 1, summoner.id, summoner.summon1);

    // value is hard coded to 1859 (thats the only thing summoned in vanilla)
    if (summoner.templetrainer)
      addRow(MON_SUMMON.TEMPLE_TRAINER, 0, summoner.id, 1859);
    if (summoner.wintersummon1d3)
      addRow(MON_SUMMON.WINTER, 0, summoner.id, summoner.wintersummon1d3);

    if (summoner.domsummon)
      addRow(MON_SUMMON.DOM, 0, summoner.id, summoner.domsummon);
    if (summoner.domsummon2)
      addRow(MON_SUMMON.DOM, 1, summoner.id, summoner.domsummon2);
    if (summoner.domsummon20)
      addRow(MON_SUMMON.DOM, 2, summoner.id, summoner.domsummon20);
    if (summoner.raredomsummon)
      addRow(MON_SUMMON.DOM, 3, summoner.id, summoner.raredomsummon);

    for (const s of [/*1,2,3,4,*/5]) { // only 5 in the csv
      const k = `battlesum${s}`;
      if (summoner[k]) addRow(MON_SUMMON.BATTLE_ROUND, s, summoner.id, summoner[k]);
    }

    for (const s of [1,2,3,4,5]) {
      const k = `batstartsum${s}`;
      if (summoner[k]) addRow(MON_SUMMON.BATTLE_START, s, summoner.id, summoner[k]);
    }
    for (const s of [1,2,3,4,5,6/*,7,8,9*/]) { // vanilla only uses up to 6
      const k = `batstartsum${s}d6`;
      if (summoner[k]) addRow(MON_SUMMON.BATTLE_START, s|128, summoner.id, summoner[k]);
    }
    if (summoner.batstartsum1d3)
      addRow(MON_SUMMON.BATTLE_START, 64, summoner.id, summoner.batstartsum1d3)

    if (summoner.mountmnr) {
      // TODO - smart mounts might be commanders? idr
      addRow(MON_SUMMON.MOUNT, 1, summoner.id, summoner.mountmnr);
    }

    if (summoner.growhp) {
      addRow(MON_SUMMON.GROWS_TO, 1, summoner.id, summoner.id - 1);
    }

    if (summoner.shrinkhp) {
      addRow(MON_SUMMON.SHRINKS_TO, 1, summoner.id, summoner.id + 1);
    }
  }


  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true,
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
    joins: 'Nation[nationId]=Units+Unit[unitId]=Source',
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
    true,
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
  const pretenders = new Map<number, Set<number>>(
    Nation.rows.map((r: any) => [r.id as number, new Set<number>()])
  );
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
        nationId,
        recType,
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

const enum MISC_UNIT_SRC {
  MISC_MISC = 0, // VERY misc. like trees and shit
  REANIM = 1,
  INDIE = 2,
  DEBUG = 3, // debug sensei/kohai
  // ea mus needs some work, looks like at some point neifel/muspel giants were
  // sharing the same unit ids and they got split
  TODO_MYPALHEIM = 4,
  ALT_SHAPE = 5,
  ADVENTURER = 6,
  WIGHT = 7,
  LICH = 8,
  UNDEAD = 9,
  MYSTERY_PRETENDER = 10, // probably just have some messed up data?
  NO_IDEA = 11, // i dunno, gotta figure em out still
  PROBABLY_ANIMALS = 12, // i dunno, gotta figure em out still
  HORRORS = 13, // just gotta put em in the montag i think
}
// TODO:
// longdead/soulless/reanimated/etc (incl. montags?)
// TREES (unanimated...)
// look for water/land/forest/plain shapes, add to the relevant area
// INDIES
// events?

const SHAPE_KEYS = [
  'shapechange',
  'prophetshape',
  'firstshape',
  'secondshape',
  'secondtmpshape',
  'forestshape',
  'plainshape',
  'foreignshape',
  'homeshape',
  'domshape',
  'notdomshape',
  'springshape',
  'summershape',
  'autumnshape',
  'wintershape',
  'xpshapemon',
  'transformation',
  'landshape',
  'watershape',
  'batlleshape',
  'worldshape',
]

const NATURE_NAMED = /Tree|Fungus|Boulder|Flower|Shroom|Bush|Shrub/
const TRUE_MISC = new Set([
  'Seaweed',
  'Crystal',
  'Stalagmite',
  'Bookshelf',
  'Counter',
  'Table',
  'Barrel',
  'Crate',
  'Cactus',
  'Large Stone',
  'Peasant',
  'Commoner',
  'Blood Slave'
])

function makeMiscUnit(tables: TR) {
  const {
    Unit,
    UnitByNation,
    UnitBySpell,
    UnitBySummoner,
    UnitBySite,
  } = tables;
  const miscRows: any[] = [];
  const wightShapes = new Map<number, number[]>();
  const lichShapes = new Map<number, number[]>();
  const sources = new Map<number, { unit: any, src: any[] }>(
    Unit.rows.map((unit: any) => {
      if (unit.lich) {
        if (lichShapes.has(unit.lich)) lichShapes.get(unit.lich)!.push(unit.id);
        else lichShapes.set(unit.lich, [unit.id]);
      }
      if (unit.twiceborn) {
        if (wightShapes.has(unit.twiceborn)) wightShapes.get(unit.twiceborn)!.push(unit.id);
        else wightShapes.set(unit.twiceborn, [unit.id]);
      }
      return [unit.id, { unit, src: [] }];
    })
  );

  for (const r of UnitByNation.rows) sources.get(r.unitId)!.src.push(r);
  for (const r of UnitBySpell.rows) sources.get(r.unitId)!.src.push(r);
  for (const r of UnitBySummoner.rows) sources.get(r.unitId)!.src.push(r);
  for (const r of UnitBySite.rows) sources.get(r.unitId)!.src.push(r);
  let res = 0;
  let change = 0;
  do {
    res = change;
    console.log('const UNITS = new Set([')
    change = findMiscUnit(tables, miscRows, sources);
    console.log(']);')
  } while (0);
  //} while (res !== change);
}

function findMiscUnit (tables: TR, miscRows: any[], sources: any): number {
  const { Unit } = tables;
  // just seeing where we're at...
  let us = 0;
  let ut = 0;
  //console.log('Unit joined by?', tables.Unit.schema.joinedBy)
  for (const { unit, src } of sources.values()) {
    ut++;
    if (src.length) { us++; continue; }
    if (unit.startdom) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.MYSTERY_PRETENDER,
      });
      us++;
      continue;
    }

    if (MISC.DEBUGGERS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.DEBUG,
      });
      us++;
      continue;
    }
    if (MISC.UNDEAD.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.UNDEAD,
      });
      us++;
      continue;
    }

    if (MISC.UNDEAD.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.UNDEAD,
      });
      us++;
      continue;
    }
    if (MISC.NO_IDEA.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.NO_IDEA,
      });
      us++;
      continue;
    }

    if (MISC.INDIES.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.INDIE,
      });
      us++;
      continue;
    }
    if (MISC.HORRORS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.HORRORS,
      });
      us++;
      continue;
    }
    if (MISC.ANIMALS.has(unit.id)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.PROBABLY_ANIMALS,
      });
      us++;
      continue;
    }
  

    if (unit.name.startsWith('Jotun')
        || unit.name === 'Gygja'
        || unit.name === 'Godihuskarl'
      ) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.TODO_MYPALHEIM,
      });
      us++;
      continue;
    }
    if (unit.name === 'Adventurer') {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.ADVENTURER,
      });
      us++;
      continue;
    }

    // probably too broad but oh well
    if (NATURE_NAMED.test(unit.name) || TRUE_MISC.has(unit.name)) {
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.MISC_MISC,
      });
      us++;
      continue;
    }

    if (unit.name.toUpperCase().includes('WIGHT')) {
      //console.log(` ** Unit#${unit.id} : ${unit.name} is a lich`);
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.WIGHT,
      });
      us++;
      continue;
    }


    if (unit.name.toUpperCase().includes('LICH')) {
      //console.log(` ** Unit#${unit.id} : ${unit.name} is a lich`);
      miscRows.push({
        unitId: unit.id,
        reason: MISC_UNIT_SRC.LICH,
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
          //console.log(` !! Unit#${unit.id}[${k}] : ${unit.name} -> ${v} ???`);
          continue;
        }
        if (prev.src.length === 0) {
          //console.log(`  !! Unit#${unit.id}[${k}] : ${unit.name} -> ${v} (${prev.unit.name} - also no src)`);
          continue;
        }

        //console.log(` ** Unit#${unit.id}[${k}] : ${unit.name} -> ${v} (${prev.unit.name})`);
        shaped = true;
      }
    }
    if (shaped) {
      us++;
      continue;
    }

    console.log(`  ${unit.id}, // ${unit.name}`);
  }
  console.log(`${us} / ${ut} units have sources; ${ut - us} to go`)

  return us;
}

export enum SPELL_SUMMON {
  BASIC = 0, // not set, perhaps
  TEMPORARY = 1,
  UNIQUE = 2,
  COMMANDER = 4,
  NEUTRAL = 8, // i.e. not on your side
  EDGE = 16,
  REMOTE = 16,
  COMBAT = 32,
  SPECIAL_HOG = 64, // maerverni iron boars :I
  PICK_ONE = 128,
  ASSASSIN = 256,
  STEALTHY = 512,
  ALIVE_ONLY = 1024,
}

function makeUnitBySpell (tables: TR) {
  const { Unit, Spell } = tables;

  const schema = new Schema({
    name: 'UnitBySpell',
    key: '__rowId',
    joins: 'Spell[spellId]=Summons+Unit[unitId]=Source',
    flagsUsed: 0,
    overrides: {},
    fields: [
      'unitId', 'spellId', 'summonType', 'summonStrength',
    ],
    rawFields: {
      unitId: 0,
      spellId: 1,
      summonType: 2,
      summonStrength: 3,
    },
    columns: [
      new NumericColumn({
        name: 'unitId',
        index: 0,
        type: COLUMN.I32,
      }),
      new NumericColumn({
        name: 'spellId',
        index: 1,
        type: COLUMN.I32,
      }),
      new NumericColumn({
        name: 'summonType',
        index: 2,
        type: COLUMN.I32,
      }),
      new NumericColumn({
        name: 'summonStrength',
        index: 3,
        type: COLUMN.I32,
      }),
      /*
      new NumericColumn({
        name: 'specialCondition',
        index: 4,
        type: COLUMN.U8,
      }),
      */
    ]
  });

  const rows: any[] = [];

  function addRow (
    unitId: number,
    spellId: number,
    summonType: number,
    summonStrength: number,
  ) {
    rows.push({
      unitId,
      spellId,
      summonType,
      summonStrength,
      __rowId: rows.length,
    });
  }

  for (const spell of Spell.rows) {
    let summons: number | number[] | null = null;
    let summonType = SPELL_SUMMON.BASIC;
    let summonStrength = spell.effects_count;
    if (SPECIAL_SUMMON[spell.id]) {
      summons = SPECIAL_SUMMON[spell.id];
      if (!Array.isArray(summons)) throw new Error('u go to hell now');
      switch (spell.id) {
        // iron hoggs
        case 859:
          addRow(summons[0], 859, SPELL_SUMMON.BASIC, summonStrength);
          addRow(summons[1], 859, SPELL_SUMMON.SPECIAL_HOG,  summonStrength);
          break;
        // unleash imprisoned ones
        case 607:
          for (const uid of summons)
            addRow(
              uid,
              607,
              SPELL_SUMMON.COMMANDER,
              summonStrength
            );
          break;
        // infernal breeding
        case 320:
          for (const uid of summons)
            addRow(uid, 320, SPELL_SUMMON.PICK_ONE, summonStrength);
          break;
        // tarts
        case 1080:
          for (const uid of summons)
            addRow(
              uid,
              1080,
              SPELL_SUMMON.PICK_ONE|SPELL_SUMMON.COMMANDER,
              summonStrength
            );
          break;
        // angelic host/horde from hell
        case 480:
        case 1410:
          addRow(summons[0], spell.id, SPELL_SUMMON.REMOTE|SPELL_SUMMON.COMMANDER, 1);
          addRow(summons[1], spell.id, SPELL_SUMMON.REMOTE,  summonStrength);
          break;
        // ghost armada
        case 1219:
          for (const uid of summons)
            addRow(
              uid,
              1219,
              SPELL_SUMMON.BASIC,
              1, // TODO - probably need to look these up?
            );
          break;
        default:
          throw new Error(`unhandled special summon for spell id ${spell.id}?`);
      }
      continue;
    }

    switch (spell.effect_number) {
      case 1: // basic summon monster
        summons = spell.raw_value;
        break;
      case 21: // basic summon commander
        summonType |= SPELL_SUMMON.COMMANDER;
        summons = spell.raw_value;
        break;
      case 37: // remote summon
        summons = spell.raw_value;
        summonType |= SPELL_SUMMON.REMOTE
      case 38: // remote summon temporary
        summonType |=SPELL_SUMMON.TEMPORARY;
        break;

      case 43: // battle edge
        summons = spell.raw_value;
        summonType |= SPELL_SUMMON.COMBAT|SPELL_SUMMON.EDGE
        break;

      case 50: // remote summon assassin
        summons = spell.raw_value;
        summonType |= SPELL_SUMMON.ASSASSIN|SPELL_SUMMON.COMMANDER;
        break;

      case 68: // animals TODO - should probably be under special, idk what animals
        summons = spell.raw_value;
        break;

      // not sure how these two differ!
      case 89: // (re)summon unique
        let idx = Number(spell.raw_value) || Number(spell.damage);
        if (idx < 0) idx *= -1
        summons = UNIQUE_SUMMON[idx];
        if (!summons) {
          console.error(`still fucked up unique summon shit @ ${idx}`, spell);
          throw new Error('piss city');
        }
        summonType |= SPELL_SUMMON.COMMANDER|SPELL_SUMMON.UNIQUE;
        break;
      case 93: // (re)summon unique
        summons = spell.raw_value;
        summonType |= SPELL_SUMMON.COMMANDER|SPELL_SUMMON.UNIQUE;
        break;

      case 119: // remote stealthy
        summons = spell.raw_value;
        summonType |= SPELL_SUMMON.COMMANDER|SPELL_SUMMON.STEALTHY;
        break;

      case 126: // netrual battlefield
        summonType |= SPELL_SUMMON.COMBAT|SPELL_SUMMON.NEUTRAL;
        summons = spell.raw_value;
        break;

      case 137: // summon (Ladon) if alive
        summonType |= SPELL_SUMMON.UNIQUE|SPELL_SUMMON.COMMANDER|SPELL_SUMMON.ALIVE_ONLY;
        summons = spell.raw_value;
        break;

      case 141: // FANCY BIRD
        summonStrength = 2; // not really but... its for display
        summons = spell.raw_value;
        break;

      case 166: // TREES
        summons = spell.raw_value;
        break;

      // case 127: // infernal breeding (CREATES DEOMON GUYS???) now special
      case 35:  // cross-breeding (CREATES FOUL GUYS) TODO - more work, use montags?
        summons = [
          453, // Foul Spawn
          454, // Foul Spawn
          457, // Foul Spawn
          458, // Foul Spawn
          461, // Foul Spawn
          466, // Cockatrice
          467, // Foul Beast
          487, // Chimera
          488, // Ettin
        ];
        break;

      // TODO revisit these
      case 130: // (A KIND OF Polymorph)
      case 54:  // (NOTE: polymorph to arg!)
      default:
        continue;
    }

    // this apparently aint a summoning spell??
    if (!summons) {
      summons = spell.damage;
      if (!summons) {
        console.error(
          '???? ' + spell.id + ', ' + spell.effect_number + '->' + summons
        );
        continue;
      }
    }

    if (!spell.ritual) summonType |= SPELL_SUMMON.COMBAT;
    // smh
    if (typeof summons === 'bigint') summons = Number(summons);
    if (typeof summons === 'number') {
      if (summons < 0) {
        if (!MONTAGS[summons as number]) {
          throw new Error(`missed montag ${summons}`)
        }
        summons = MONTAGS[summons as number]
        summonType |= SPELL_SUMMON.PICK_ONE; // maybe not quite accurate?
      } else {
        summons = [summons];
      }
    }

    if (!Array.isArray(summons)) {
      console.log('WTF IS THIS', summons)
      throw new Error('YOU FUCKED UP');
    }
    if (!summons.length) {
      /*
      console.error(
        `missing summons for ${spell.id}:${spell.name}`,
        {
          effect: spell.effect_number,
          damage: spell.damage,
          summons,
        }
      );
      */
      continue;
    }

    for (const uid of summons) {
      const unit = Unit.map.get(uid)
      if (!unit) {
        console.error(`${spell.id}:${spell.name} summons unknown creature ${uid}`);
        continue;
      }
      addRow(uid, spell.id, summonType, summonStrength);
      // we may discover commander status here:
      if ((SPELL_SUMMON.COMMANDER & summonType) && !(unit.type & UNIT_TYPE.COMMANDER)) {
        /*
        console.error(` ***** ${
          spell.id}:${spell.name
        } indicates that ${
          uid}:${unit.id
        } is a commander (prev=${
          unit.type
        })`);
        */
        unit.type |= UNIT_TYPE.COMMANDER;
      }
    }
  }

  return tables[schema.name] = Table.applyLateJoins(
    new Table(rows, schema),
    tables,
    true,
  );
}



// I don't think these are defined directly in the data (just a name), but we
// could maintain a table + join
const MONTAGS = {
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
  [-12]: [530], // 3% good?
  [-11]: [530], // bad
  [-10]: [530], // good

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
  [-1]: [],
}
// idk tbh, just stuff with weird conditions or whatever
const SPECIAL_SUMMON = {
  // these are not montags per se, im sure there are reasons for this.
  // tartarian Gate / effect 76
  [1080]: [771, 772, 773, 774, 775, 776, 777],
  // ea argartha "unleashed imprisoned ones" effect 116
  [607 ]: [2498, 2499, 2500],
  // angelic host spell 480  weird double summon (eff 37)
  [480 ]: [465, 3870],
  // hordes from hell weird double summon (eff 37)
  [1410]: [304, 303],
  // iron pig + iron boar for ea marverni...
  [859 ]: [924, 1808],
  // ghost ship armada global spell 1219 effect 81 (global) and damage === 43
  [1219]: [3348, 3349, 3350, 3351, 3352],
  // infernal breedin
  [320 ]: [2967, 2968, 2969, 2970, 2971, 2972, 2973, 2974, 3061],

};

// from effect 89, key is damage/raw_argument
const UNIQUE_SUMMON = {
  // Bind Ice Devil
  1:  [306, 821,  822, 823, 824, 825],
  // Bind Arch Devil
  2:  [305, 826, 827, 828, 829],
  // Bind Heliophagus
  3:  [492, 818, 819, 820],
  // King of Elemental Earth
  4:  [906, 469],
  // Father Illearth
  5:  [470],
  // Queen of Elemental Water
  6:  [359, 907, 908],
  // Queen of Elemental Air
  7:  [563, 911, 912],
  // King of Elemental Fire
  8:  [631, 910],
  // King of Banefires
  9:  [909],
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
  15: [ ],
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
  21: [3425, 3426, 3427, 3428],
};

// effect 100
const TERRAIN_SUMMON = {
  // Hidden in Snow
  1: [1201, 1200, 1202, 1203],
  // Hidden in Sand
  2: [1979, 1978, 1980, 1981],
  // Hidden Underneath
  3: [2522, 2523, 2524, 2525]
};
/*

spell finder:
const sp = __t.Spell
function findSp(e, rit, sel = -3) {
    console.log(
        Array.from(
            sp.filterRows(r => r.effect_number === e && (
                rit == null || (rit && r.ritual) || (!rit && !r.ritual))
            ),
            r => `-  ${r.ritual ? 'R' : 'C' } ${r.id} ${r.name} : ${r.raw_argument}`
        ).slice(sel).join('\n')
    )
}

///// SUMMON EFFECTS //////
DONE 1: (SUMMON MONSTER)
-  R 1452 Infernal Tempest : 632
-  R 1453 Forces of Ice : 449
-  R 1454 Infernal Crusade : 489
-  C 1184 Horde of Skeletons : -2
-  C 1385 Summon Imps : 303
-  C 1417 Summon Illearth : 3756

DONE 38: (REMOTE SUMMON UNIT TEMP)
-  R 1078 Ghost Riders : 189
-  R 1416 Send Lesser Horror : -6
-  R 1455 Send Horror : -7

DONE 21: (SUMMON COMMANDER)
-  R 1384 Bind Shadow Imp : 2287
-  R 1412 Bind Succubus : 811
-  R 1444 Curse of Blood : 404
-  C 56 Grow Lich : 960
-  C 58 Summon Qarin : 3471
-  C 80 Open Soul Trap : -18

DONE 37: (PERMANENT REMOTE SUMMON)
-  R 1257 Army of the Dead : -2
-  R 1410 Horde from Hell : 303
-  R 1428 Plague of Locusts : 2794

DONE 137: (SUMMON, ALIVE ONLY)
-  R 266 Call Ladon : 3167

DONE 93: (SUMMON UNIQUE?)
-  R 272 Daughter of Typhon : 1822
-  R 1072 Call the Eater of the Dead : 994

DONE 50: (SUMMON ASSASSIN)
-  R 449 Send Aatxe : 3629
-  R 1067 Earth Attack : 3741
-  R 1422 Infernal Disease : 1662

DONE 119: (REMOTE SUMMON STEALTHY)
-  R 326 Send Vodyanoy : 1953


DONE 89: (UNIQUE SUMMON!)
-  R 1430 Father Illearth : 5
-  R 1438 Bind Heliophagus : 3
-  R 1450 Bind Demon Lord : 10

DONE 141: SUMMON FANCY BIRD ONLY
-  R 537 Call the Birds of Splendor : 3382
DONE 116:
-  R 607 Unleash Imprisoned Ones : 1

EFFECT 166:

-  C 799 Animate Tree : 361
-  C 918 Awaken Forest : 361

EFFECT 68: (NOTE: animal summon!)
-  R 921 Summon Animals : 403
-  R 1055 Animal Horde : 403

EFFECT 43: (NOTE: edge battlefield summon)

-  C 970 School of Sharks : 815
-  C 991 Will o' the Wisp : 527
-  C 1010 Corpse Candle : 528
EFFECT 126: (NOTE non-controlled battlefield summon)

-  C 977 Summon Lammashtas : 393
-  C 1407 Call Lesser Horror : -6
-  C 1426 Call Horror : -7



// not really a summon but we will want to track these:
EFFECT 130: (A KIND OF Polymorph)
-  R 290 Hannya Pact : 3070
-  R 291 Greater Hannya Pact : 1432

EFFECT 54: (NOTE: polymorph to arg!)

-  C 887 Curse of the Frog Prince : 2222
-  C 906 Polymorph : 549

EFFECT 127: (CREATES DEOMON GUYS???)
-  R 320 Infernal Breeding : 1
EFFECT 35: (CREATES FOUL GUYS)
-  R 1400 Cross Breeding : 1
-  R 1445 Improved Cross Breeding : 1




///// OTHER EFFECTS


EFFECT 0:

-  C 484 ... : 0
-  C 631 ... : 0
-  C 632 ... : 0
EFFECT 109:

-  C 1 Minor Area Shock : 1
-  C 120 Minor Blunt Damage : 8
-  C 669 Poison Darts : 9
EFFECT 2:

-  C 1419 Harm : 1000
-  C 1437 Life for a Life : 5025
-  C 1447 farkill: Infernal Fumes : 1006
EFFECT 3:

-  C 800 Torpor : 5010
-  C 1009 Ghost Grip : 2023
-  C 1275 Steal Breath : 5035
EFFECT 600:

-  C 4 Mark : 261
-  C 1265 Horror Mark : 261
EFFECT 4:

-  C 260 Scare Spirits : 2
-  C 424 Tune of Fear : 3
-  C 1305 Terror : 3
EFFECT 7:

-  C 844 Blood Poisoning : 2011
-  C 868 Venomous Death : 3019
-  C 978 Maggots : 50
EFFECT 11:

-  C 1351 Plague : 8
-  C 1355 Mass Confusion : 17179869184
-  C 1357 Hydrophobia : 128
EFFECT 15:

-  C 14 Returning : 1
-  C 1278 Returning : 1
-  C 1350 Vortex of Returning : 1
EFFECT 66:

-  C 231 Paralyzation : 10
-  C 461 Parting of the Soul : 5010
-  C 1300 Paralyze : 9042
EFFECT 10:
-  R 1165 Simulacrum : 9007199254740992
-  C 1403 Blood Lust : 128
-  C 1434 Purify Blood : 288230376151711744
-  C 1436 Rush of Strength : 128
EFFECT 81:
-  R 1440 Blood Vortex : 87
-  R 1449 The Looming Hell : 42
-  R 1456 Astral Corruption : 57
-  C 1362 Soul Drain : 5
-  C 1377 Legion's Demise : 143
-  C 1421 Blood Rain : 112

EFFECT 23:
-  R 1073 Dragon Master : 1073741824
-  R 1159 Twiceborn : 4194304
-  R 1179 Ritual of Returning : 8388608
-  C 1381 Sabbath Master : 576460752303423488
-  C 1382 Sabbath Slave : 1152921504606846976
-  C 1394 Hell Power : 131072
EFFECT 82:
-  R 1397 Infernal Circle : 89
-  R 1408 Blood Fecundity : 94
-  R 1432 Dome of Corruption : 68

EFFECT 105:

-  C 71 Disbelieve : 999
EFFECT 28:

-  C 1365 Undead Mastery : 999
-  C 1372 Master Enslave : 999
-  C 1375 Beast Mastery : 999
EFFECT 101:
-  R 86 age three years : 3
-  R 288 Thousand Year Ginseng : -5
-  R 1420 Rejuvenate : -10

EFFECT 112:
-  R 91 Kill Caster : 9999
-  R 1316 Purifying Flames : 20

EFFECT 113:
-  R 94 Astral Harpoon : 0

EFFECT 128:

-  C 647 Bewitching Lights : 100
-  C 660 Storm Wind : 2013
-  C 1270 Fascination : 100
EFFECT 48:
-  R 1297 Auspex : 1
-  R 1299 Gnome Lore : 3
-  R 1388 Bowl of Blood : 8

EFFECT 17:

-  C 216 Sermon of Courage : 1
-  C 242 Fanaticism : 1
EFFECT 99:

-  C 227 Petrification : 999
-  C 858 Petrify : 999
EFFECT 42:
-  R 1413 Wrath of Pazuzu : 14
-  R 1418 Rain of Toads : 6
-  R 1431 Send Dream Horror : 12

EFFECT 13:

-  C 1145 Heal : 10020
-  C 1157 Astral Healing : 2
-  C 1380 Blood Heal : 50
EFFECT 8:

-  C 258 Minor Reinvigoration : 10
-  C 298 Meditation Sign : 15
-  C 1383 Reinvigoration : 200
EFFECT 136:
-  R 262 Curse Tablet : 2
-  R 494 Seith Curse : 2

EFFECT 511:
-  R 263 Blessing of the God-slayer : 654
-  R 278 Taurobolium : 651
EFFECT 85:
-  R 277 Epopteia : 94

EFFECT 111:
-  R 289 Internal Alchemy : 15

EFFECT 29:

-  C 1324 Charm Animal : 999
-  C 1354 Charm : 999
-  C 1409 Hellbind Heart : 999
EFFECT 63:
-  R 901 Wizard's Tower : 24
-  R 1059 Living Castle : 9
-  R 1439 Three Red Seconds : 25

EFFECT 25:

-  C 345 Strange Fire : 1006
-  C 448 Holy Pyre : 1005
EFFECT 73:

-  C 453 Iron Darts : 13
-  C 454 Iron Blizzard : 10
EFFECT 19:
-  R 490 Mirror Walk : 1
-  R 1303 Teleport : 1


EFFECT 501:
-  R 1061 Lore of Legends : 1086
-  C 547 Scorching Wind : 250


EFFECT 125:
-  R 628 Mind Vessel : 100

EFFECT 110:
-  R 630 Dreams of R'lyeh : 2052

EFFECT 148:

-  C 650 Sulphur Haze : 4096
-  C 654 Rust Mist : 32768
EFFECT 147:

-  C 673 Cloud of Dreamless Slumber : 2097152
-  C 674 Fire Cloud : 8
-  C 703 Poison Cloud : 64
EFFECT 27:

-  C 666 Magic Duel : 999
EFFECT 22:
-  R 675 Fate of Oedipus : 0

EFFECT 74:

-  C 682 Bolt of Unlife : 1013
-  C 714 Blast of Unlife : 1017
-  C 746 Vortex of Unlife : 1011
EFFECT 91:
-  R 748 Flames from the Sky : 1015
-  R 757 Stellar Strike : 150
-  R 1446 Infernal Fumes : 1006

EFFECT 134:

-  C 695 Orb Lightning : 5
-  C 743 Chain Lightning : 1003
-  C 752 Lightning Field : 1
EFFECT 601:

-  C 700 Astral Geyser : 261
EFFECT 168:
-  R 705 Project Self : 10

EFFECT 57:
-  R 711 Mind Hunt : 999

EFFECT 72:

-  C 716 Stream of Life : 5025
EFFECT 153:
-  R 722 Elemental Opposition of Earth : 1
-  R 725 Elemental Opposition of Fire : 1
-  R 727 Elemental Opposition of Air : 1

EFFECT 41:
-  R 724 Murdering Winter : 8

EFFECT 146:

-  C 730 Cloud of Death : 262144
-  C 734 Poison Mist : 64
-  C 1322 Leeching Darkness : 134217728
EFFECT 164:
-  R 778 Alchemical Transmutation : 200
-  R 825 Transmute Fire : 350
-  R 856 Earth Gem Alchemy : 300

EFFECT 138:

-  C 780 Armor of Achilles : 10
-  C 814 Destruction : 5
EFFECT 67:

-  C 782 Weakness : 3
-  C 841 Enfeeble : 2
EFFECT 162:

-  C 784 Mirror Image : 2000

EFFECT 609:

-  C 809 Encase in Ice : 299
-  C 876 Prison of Sedna : 299
EFFECT 96:

-  C 839 Shatter : 5020
EFFECT 103:

-  C 1395 Leeching Touch : 1014
-  C 1411 Bloodletting : 1
-  C 1427 Leech : 1024
EFFECT 44:
-  R 866 Transformation : 1

EFFECT 84:
-  R 1221 Lion Sentinels : 105
-  R 1255 Dome of Seven Seals : 132
-  R 1345 Forgotten Palace : 111

EFFECT 70:
-  R 902 Crumble : -25175

EFFECT 36:

-  C 905 Disintegrate : 999
EFFECT 133:

-  C 914 Time Stop : 104
EFFECT 34:
-  R 915 Wish : 0

EFFECT 49:
-  R 996 Wind Ride : 100

EFFECT 135:
-  R 997 Raven Feast : 100

EFFECT 115:
-  R 1012 Acashic Record : 999

EFFECT 98:
-  R 1017 Winged Monkeys : 1

EFFECT 62:
-  R 1069 Manifestation : 392

EFFECT 76:
-  R 1080 Tartarian Gate : 10

EFFECT 40:
-  R 1136 Seeking Arrow : 8

EFFECT 95:
-  R 1152 Cloud Trapeze : 1
-  R 1404 Hell Ride : 1

EFFECT 30:
-  R 1180 Dispel : 1

EFFECT 79:
-  R 1186 Faery Trod : 1

EFFECT 100: (TERRAIN SUMMON!)
-  R 1197 Hidden in Snow : 1
-  R 1201 Hidden in Sand : 2
-  R 1202 Hidden Underneath : 3

EFFECT 152:
-  R 1226 Disenchantment : 1

EFFECT 26:
-  R 1229 Ritual of Rebirth : 398

EFFECT 114:
-  R 1233 Awaken Treelord : 11

EFFECT 167:
-  R 1245 Lichcraft : 178

EFFECT 500:

-  C 1260 Desiccation : 250
-  C 1298 Curse of the Desert : 250
-  C 1435 Damage Reversal : 1064
EFFECT 20:

-  C 1262 Blink : 30
EFFECT 97:

-  C 1268 Frighten : 5
-  C 1290 Panic : 1
-  C 1293 Despair : 4
EFFECT 160:
-  R 1284 Carrier Birds : 15
-  R 1288 Teleport Gems : 10

EFFECT 161:
-  R 1285 Carrier Eagle : 1
-  R 1320 Teleport Item : 1

EFFECT 53:
-  R 1304 Vengeance of the Dead : 999

EFFECT 131:
-  R 1310 Cure Disease : 1

EFFECT 132:
-  R 1315 Pyre of Catharsis : 1

EFFECT 39:
-  R 1327 Gift of Reason : 1
-  R 1349 Divine Name : 1

EFFECT 83:
-  R 1332 Phlegmatia : 136
-  R 1333 Melancholia : 137

EFFECT 92:
-  R 1335 Imprint Souls : 2052

EFFECT 77:
-  R 1336 Gateway : 1
-  R 1361 Astral Travel : 1

EFFECT 64:
-  R 1338 Leprosy : 1

EFFECT 94:
-  R 1343 Beckoning : 999

EFFECT 90:
-  R 1363 Stygian Paths : 1

EFFECT 156:
-  R 1370 Arcane Analysis : 1

EFFECT 157:
-  R 1371 Astral Disruption : 1

EFFECT 163:
-  R 1373 Nexus Gate : 1

EFFECT 118:
-  R 1401 Blood Feast : 50

EFFECT 108:

-  C 1441 Infernal Prison : -12
-  C 1442 Claws of Kokytos : -13
EFFECT 102:
-  R 1443 Horror Seed : 9

///// Spell Cascades:

1033 Troll King's Court ->
  25 10 Trolls ->
  60 5 War Trolls ->
  61 2 Troll Moose Knights

31 Meteor Shower -> 107 Area Fire
1030 Sea King's Court -> 36 15 Sea Trolls -> 72 5 Troll Guards
1075 Faerie Court ->
  38 Court of Sprites ->
  124 Fay Folk Court ->
  125 Fay Folk Court Soldiers ->
  126 Fay Folk Court Knights

839 Shatter -> 43 extra limp -> 44 extra cripple

1035 Ether Gate -> 64 1 Ether Lord -> 45 15 Ether Warriors

482 Heavenly Choir -> 68 Angels of the Choir -> 69 Harbingers of the Choir

1423 Ritual of Five Gates ->
  73 Gate Summon Fire ->
  74 Gate Summon Ice ->
  75 Gate Summon Storm ->
  76 Gate Summon Iron

594 Contact Dai Tengu -> 77 10 Tengu Warriors -> 78 15 Karasu Tengus

348 Banquet for the Dead -> 90 4 Ditanu -> 91 Kill Caster

886 Bone Grinding -> 108 Battlefield Limp -> 109 Battlefield Cripple

715 Bane Fire -> 117 Bane Flame Area -> 20 Large Area Decay

271 Orgy -> 87 6 Maenads
279 xxx -> 87 6 Maenads

286 Celestial Chastisement -> 84 Chastisement

311 Summon Gozu Mezu -> 92 1 Horse-face
357 Release Lord of Civilization -> 85 age ten years

461 Parting of the Soul -> 111 Summon Predatory Birds

515 Contact Onaqui -> 67 Beast Bats

519 Break the First Soul -> 101 Disease

538 Deceive the Decree of the Lost -> 121 15 Giants of the Lost Tribe

603 Olm Conclave -> 110 15 Great Olms

1450 Bind Demon Lord -> 85 age ten years
1451 Infernal Forces -> 26 40 imps

1257 Army of the Dead -> 46 Extra Soulless

// non summons tho
636 Shocking Grasp -> 1 Minor Area Shock
637 Gust of Winds -> 120 Minor Blunt Damage
646 Vine Arrow -> 47 Entangle
650 Sulphur Haze -> 39 Heat Stun
652 Lightning Bolt -> 1 Minor Area Shock

659 Fireball -> 115 Area Flames
660 Storm Wind -> 120 Minor Blunt Damage
663 Acid Bolt -> 116 Acid Splash
664 Magma Bolts -> 112 Burning
668 Shadow Bolt -> 42 Minor Paralysis
670 False Fire -> 122 Area False Flames
677 Thunder Strike -> 5 Thunder Shock
679 Acid Rain -> 13 Area Rust
681 Nether Bolt -> 24 Area Feeble Mind
683 Bane Fire Dart -> 11 Area Decay
689 farkill: Fires from Afar -> 3 Large Area Heat Shock
696 Earthquake -> 104 Earthquake Knockdown Stun
698 Gifts from Heaven -> 107 Area Fire
700 Astral Geyser -> 83 Astral Geyser Blast
701 Shadow Blast -> 42 Minor Paralysis
712 Astral Fires -> 118 Astral Fires Area
721 farkill: Thunderstorm -> 5 Thunder Shock
729 Nether Darts -> 24 Area Feeble Mind
732 Stygian Rains -> 79 Natural Rain
733 Storm of Thorns -> 47 Entangle
737 Illusory Attack -> 30 Archer Illusions
749 farkill: Flames from the Sky -> 113 Large Fireball
758 farkill: Stellar Strike -> 107 Area Fire
837 Maws of the Earth -> 100 earth grip
862 Skeletal Legion -> 102 Disease All Friendly
868 Venomous Death -> 114 Decay
897 Liquify -> 103 Cripple
938 Phoenix Power -> 19 Fire Resistance
984 Strength of Gaia -> 27 Strength, Barkskin and Regeneration
998 Contact Draconians -> 37 30 Draconians
1038 Forest Troll Tribe -> 99 15 Forest Trolls
1203 Opposition -> 123 Stun Magic Being
1248 Unraveling -> 40 Extra feeble mind battle field
1389 Agony -> 21 Major Fear
1394 Hell Power -> 4 Mark
1419 Harm -> 35 Area Chest Wound


// spells that are "next" multiple times:
// (only 1 is a summon, that one is bugged or smoething?)

Minor Area Shock 1 2
Thunder Shock 5 2
Area Feeble Mind 24 2
Minor Paralysis 42 2
Entangle 47 2
age ten years 85 2
6 Maenads 87 2 // this one
Area Fire 107 3
Minor Blunt Damage 120 2
*/

