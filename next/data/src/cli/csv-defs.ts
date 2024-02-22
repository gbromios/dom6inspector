import type { ParseSchemaOptions } from './parse-csv'
export const csvDefs: Record<string, Partial<ParseSchemaOptions>> = {
  '../../gamedata/BaseU.csv': {
    name: 'Unit',
    ignoreFields: new Set(['end']),
    knownFields: {},
    overrides: {
      // csv has unrest/turn which is incunrest / 10; convert to int format
      incunrest: (v) => (Number(v) * 10) || 0
    },
  },
  '../../gamedata/BaseI.csv': {
    name: 'Item',
    ignoreFields: new Set(['end']),
  },

  '../../gamedata/MagicSites.csv': {
    name: 'MagicSite',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/Mercenary.csv': {
    name: 'Mercenary',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/afflictions.csv': {
    name: 'Affliction',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/anon_province_events.csv': {
    name: 'AnonProvinceEvent',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/armors.csv': {
    name: 'Armor',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attribute_keys.csv': {
    name: 'AttributeKey',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/attributes_by_armor.csv': {
    name: 'AttributeByArmor',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_nation.csv': {
    name: 'AttributeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_spell.csv': {
    name: 'AttributeBySpell',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_weapon.csv': {
    name: 'AttributeByWeapon',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/buffs_1_types.csv': {
    // TODO - got some big bois in here.
    name: 'BuffBit1',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/buffs_2_types.csv': {
    name: 'BuffBit2',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/coast_leader_types_by_nation.csv': {
    name: 'CoastLeaderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/coast_troop_types_by_nation.csv': {
    name: 'CoastTroopTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/effect_modifier_bits.csv': {
    name: 'SpellBit',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/effects_info.csv': {
    name: 'SpellEffectInfo',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/effects_spells.csv': {
    name: 'EffectSpell',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/effects_weapons.csv': {
    name: 'EffectWeapon',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/enchantments.csv': {
    name: 'Enchantment',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/events.csv': {
    name: 'Event',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/fort_leader_types_by_nation.csv': {
    name: 'FortLeaderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/fort_troop_types_by_nation.csv': {
    name: 'FortTroopTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/magic_paths.csv': {
    name: 'MagicPath',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/map_terrain_types.csv': {
    name: 'TerrainTypeBit',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/monster_tags.csv': {
    name: 'MonsterTag',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/nametypes.csv': {
    name: 'NameType',
  },
  '../../gamedata/nations.csv': {
    name: 'Nation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/nonfort_leader_types_by_nation.csv': {
    name: 'NonFortLeaderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/nonfort_troop_types_by_nation.csv': {
    name: 'NonFortLeaderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/other_planes.csv': {
    name: 'OtherPlane',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/pretender_types_by_nation.csv': {
    name: 'PretenderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/protections_by_armor.csv': {
    name: 'ProtectionByArmor',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/realms.csv': {
    name: 'Realm',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/site_terrain_types.csv': {
    name: 'SiteTerrainType',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/special_damage_types.csv': {
    name: 'SpecialDamageType',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/special_unique_summons.csv': {
    name: 'SpecialUniqueSummon',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/spells.csv': {
    name: 'Spell',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/terrain_specific_summons.csv': {
    name: 'TerrainSpecificSummon',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/unit_effects.csv': {
    name: 'UnitEffect',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/unpretender_types_by_nation.csv': {
    name: 'UnpretenderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/weapons.csv': {
    name: 'Weapon',
    ignoreFields: new Set(['end', 'weapon']),
  },
};
