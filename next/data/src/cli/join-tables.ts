import { BoolColumn, COLUMN, NumericColumn, Schema, SchemaArgs, Table } from 'dom6inspector-next-lib';

function findTable (name: string, tables: Table[]): Table {
  for (const t of tables) if (t.schema.name === name) return t;
  throw new Error(`could not fild the table called "${name}"`);
}

export function joinDumped (tables: Table[]) {
  const Unit = findTable('Unit', tables);
  const Spell = findTable('Spell', tables);
  const SpellAttr = findTable('AttributeBySpell', tables);
  const SpellByNation = makeSpellByNation(SpellAttr);
  const MagicSite = findTable('MagicSite', tables);
  SpellByNation.print(166, null, 0, 10);
  const SpellByUnit = makeSpellByUnit(SpellAttr);
  SpellByUnit.print(166, null, 0, 10);
  tables.push(SpellByNation, SpellByUnit);
  const UnitSource = makeUnitSourceSchema()

}


const ATTR_FARSUMCOM = 790; // lul why is this the only one??

// todo - reanimations aswell? twiceborn too?
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

  //'onisummon', we dont really care about this one because we 
  // 'heathensummon', idfk?? https://illwiki.com/dom5/user/loggy/slaver
  // 'coldsummon', unused
  'wintersummon1d3', // vamp queen, not actually a (documented) command?

  'turmoilsummon', // also not a command ~ !
]

function makeUnitSourceSchema (): any {
  return new Schema({
    name: 'UnitSource',
    key: '__rowId',
    flagsUsed: 0,
    overrides: {},
    rawFields: {
      recordId: 0,
      unitId: 1,
      nationId: 2,
      sourceId: 3,
      sourceType: 4,
      sourceArg: 5,
    },
    fields: [
      'recordId',
      'unitId',
      'nationId',
      'sourceId',
      'sourceType',
      'sourceArg',
    ],
    columns: [
      new NumericColumn({
        name: 'recordId',
        index: 0,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'unitId',
        index: 1,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'nationId',
        index: 2,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'sourceId',
        index: 3,
        type: COLUMN.U16,
      }),
      new NumericColumn({
        name: 'sourceType',
        index: 4,
        type: COLUMN.U8,
      }),
      new NumericColumn({
        name: 'sourceArg',
        index: 5,
        type: COLUMN.U16,
      }),
    ]
  });
}

function makeSpellByNation (attrs: Table): Table {
  const delRows: number[] = [];
  const sbuArgs: SchemaArgs = {
    name: 'SpellByNation',
    key: '__rowId',
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
  };

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
  while (delRows.length) attrs.rows.splice(delRows.pop()!, 1);

  return new Table(rows, new Schema(sbuArgs));

}

function makeSpellByUnit (attrs: Table): Table {
  const delRows: number[] = [];
  const sbuArgs: SchemaArgs = {
    name: 'SpellByNation',
    key: '__rowId',
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
  };

  let __rowId = 0;
  const rows: any[] = [];
  for (const [i, r] of attrs.rows.entries()) {
    const { spell_number: spellId, attribute, raw_value } = r;
    if (attribute === 731) {
      console.log(`${spellId} IS RESTRICTED TO UNIT ${raw_value}`);
      const unitId = Number(raw_value);
      if (!Number.isSafeInteger(unitId))
        throw new Error(`     !!!!! TOO BIG UNIT !!!!! (${unitId})`);
      delRows.push(i);
      rows.push({ __rowId, spellId, unitId });
      __rowId++;
    }
  }
  while (delRows.length) attrs.rows.splice(delRows.pop()!, 1);

  return new Table(rows, new Schema(sbuArgs));

}
