import { COLUMN, SchemaArgs } from 'dom6inspector-next-lib';
import type { ParseSchemaOptions } from './parse-csv'
import { readFileSync } from 'node:fs';
export const csvDefs: Record<string, Partial<ParseSchemaOptions>> = {
  '../../gamedata/BaseU.csv': {
    name: 'Unit',
    key: 'id',
    ignoreFields: new Set([
      // combined into an array field
      'armor1', 'armor2', 'armor3', 'armor4', 'end',
      'wpn1', 'wpn2', 'wpn3', 'wpn4', 'wpn5', 'wpn6', 'wpn7',

      // all combined into one array field
      'link1', 'link2', 'link3', 'link4', 'link5', 'link6',
      'mask1', 'mask2', 'mask3', 'mask4', 'mask5', 'mask6',
      'nbr1',  'nbr2',  'nbr3',  'nbr4',  'nbr5',  'nbr6',
      'rand1', 'rand2', 'rand3', 'rand4', 'rand5', 'rand6',

      // deprecated
      'mounted',
      // redundant
      'reanimator~1',
    ]),
    knownFields: {
      id: COLUMN.U16,
      name: COLUMN.STRING,
      rt: COLUMN.U8,
      reclimit: COLUMN.I8,
      basecost: COLUMN.U16,
      rcost: COLUMN.I8,
      size: COLUMN.U8,
      ressize: COLUMN.U8,
      hp: COLUMN.U16,
      prot: COLUMN.U8,
      mr: COLUMN.U8,
      mor: COLUMN.U8,
      str: COLUMN.U8,
      att: COLUMN.U8,
      def: COLUMN.U8,
      prec: COLUMN.U8,
      enc: COLUMN.U8,
      mapmove: COLUMN.U8,
      ap: COLUMN.U8,
      ambidextrous: COLUMN.U8,
      mountmnr: COLUMN.U16,
      skilledrider: COLUMN.U8,
      reinvigoration: COLUMN.U8,
      leader: COLUMN.U8,
      undeadleader: COLUMN.U8,
      magicleader: COLUMN.U8,
      startage: COLUMN.U16,
      maxage: COLUMN.U16,
      hand: COLUMN.U8,
      head: COLUMN.U8,
      misc: COLUMN.U8,
      pathcost: COLUMN.U8,
      startdom: COLUMN.U8,
      bonusspells: COLUMN.U8,
      F: COLUMN.U8,
      A: COLUMN.U8,
      W: COLUMN.U8,
      E: COLUMN.U8,
      S: COLUMN.U8,
      D: COLUMN.U8,
      N: COLUMN.U8,
      G: COLUMN.U8,
      B: COLUMN.U8,
      H: COLUMN.U8,
      sailingshipsize: COLUMN.U16,
      sailingmaxunitsize: COLUMN.U8,
      stealthy: COLUMN.U8,
      patience: COLUMN.U8,
      seduce: COLUMN.U8,
      succubus: COLUMN.U8,
      corrupt: COLUMN.U8,
      homesick: COLUMN.U8,
      formationfighter: COLUMN.I8,
      standard: COLUMN.I8,
      inspirational: COLUMN.I8,
      taskmaster: COLUMN.U8,
      beastmaster: COLUMN.U8,
      bodyguard: COLUMN.U8,
      waterbreathing: COLUMN.U16,
      iceprot: COLUMN.U8,
      invulnerable: COLUMN.U8,
      shockres: COLUMN.I8,
      fireres: COLUMN.I8,
      coldres: COLUMN.I8,
      poisonres: COLUMN.U8,
      acidres: COLUMN.I8,
      voidsanity: COLUMN.U8,
      darkvision: COLUMN.U8,
      animalawe: COLUMN.U8,
      awe: COLUMN.U8,
      haltheretic: COLUMN.U8,
      fear: COLUMN.U8,
      berserk: COLUMN.U8,
      cold: COLUMN.U8,
      heat: COLUMN.U8,
      fireshield: COLUMN.U8,
      banefireshield: COLUMN.U8,
      damagerev: COLUMN.U8,
      poisoncloud: COLUMN.U8,
      diseasecloud: COLUMN.U8,
      slimer: COLUMN.U8,
      mindslime: COLUMN.U16,
      regeneration: COLUMN.U8,
      reanimator: COLUMN.U8,
      poisonarmor: COLUMN.U8,
      eyeloss: COLUMN.U8,
      ethtrue: COLUMN.U8,
      stormpower: COLUMN.U8,
      firepower: COLUMN.U8,
      coldpower: COLUMN.U8,
      darkpower: COLUMN.U8,
      chaospower: COLUMN.U8,
      magicpower: COLUMN.U8,
      winterpower: COLUMN.U8,
      springpower: COLUMN.U8,
      summerpower: COLUMN.U8,
      fallpower: COLUMN.U8,
      forgebonus: COLUMN.U8,
      fixforgebonus: COLUMN.I8,
      mastersmith: COLUMN.I8,
      resources: COLUMN.U8,
      autohealer: COLUMN.U8,
      autodishealer: COLUMN.U8,
      nobadevents: COLUMN.U8,
      insane: COLUMN.U8,
      shatteredsoul: COLUMN.U8,
      leper: COLUMN.U8,
      chaosrec: COLUMN.U8,
      pillagebonus: COLUMN.U8,
      patrolbonus: COLUMN.I8,
      castledef: COLUMN.U8,
      siegebonus: COLUMN.I16,
      incprovdef: COLUMN.U8,
      supplybonus: COLUMN.U8,
      incunrest: COLUMN.I16,
      popkill: COLUMN.U16,
      researchbonus: COLUMN.I8,
      inspiringres: COLUMN.I8,
      douse: COLUMN.U8,
      adeptsacr: COLUMN.U8,
      crossbreeder: COLUMN.U8,
      makepearls: COLUMN.U8,
      voidsum: COLUMN.U8,
      heretic: COLUMN.U8,
      elegist: COLUMN.U8,
      shapechange: COLUMN.U16,
      firstshape: COLUMN.U16,
      secondshape: COLUMN.U16,
      landshape: COLUMN.U16,
      watershape: COLUMN.U16,
      forestshape: COLUMN.U16,
      plainshape: COLUMN.U16,
      xpshape: COLUMN.U8,
      nametype: COLUMN.U8,
      summon: COLUMN.I16,
      n_summon: COLUMN.U8,
      batstartsum1: COLUMN.U16,
      batstartsum2: COLUMN.U16,
      domsummon: COLUMN.U16,
      domsummon2: COLUMN.U16,
      domsummon20: COLUMN.I16,
      bloodvengeance: COLUMN.U8,
      bringeroffortune: COLUMN.I8,
      realm1: COLUMN.U8,
      batstartsum3: COLUMN.U16,
      batstartsum4: COLUMN.U16,
      batstartsum1d6: COLUMN.U16,
      batstartsum2d6: COLUMN.U16,
      batstartsum3d6: COLUMN.I16,
      batstartsum4d6: COLUMN.U16,
      batstartsum5d6: COLUMN.U8,
      batstartsum6d6: COLUMN.U16,
      turmoilsummon: COLUMN.U16,
      deathfire: COLUMN.U8,
      uwregen: COLUMN.U8,
      shrinkhp: COLUMN.U8,
      growhp: COLUMN.U8,
      startingaff: COLUMN.U32,
      fixedresearch: COLUMN.U8,
      lamialord: COLUMN.U8,
      preanimator: COLUMN.U8,
      dreanimator: COLUMN.U8,
      mummify: COLUMN.U16,
      onebattlespell: COLUMN.U8,
      fireattuned: COLUMN.U8,
      airattuned: COLUMN.U8,
      waterattuned: COLUMN.U8,
      earthattuned: COLUMN.U8,
      astralattuned: COLUMN.U8,
      deathattuned: COLUMN.U8,
      natureattuned: COLUMN.U8,
      magicboostF: COLUMN.U8,
      magicboostA: COLUMN.I8,
      magicboostW: COLUMN.I8,
      magicboostE: COLUMN.I8,
      magicboostS: COLUMN.U8,
      magicboostD: COLUMN.I8,
      magicboostN: COLUMN.U8,
      magicboostALL: COLUMN.I8,
      eyes: COLUMN.U8,
      corpseeater: COLUMN.U8,
      poisonskin: COLUMN.U8,
      startitem: COLUMN.U8,
      battlesum5: COLUMN.U16,
      acidshield: COLUMN.U8,
      prophetshape: COLUMN.U16,
      horror: COLUMN.U8,
      latehero: COLUMN.U8,
      uwdamage: COLUMN.U8,
      landdamage: COLUMN.U8,
      rpcost: COLUMN.U32,
      rand5: COLUMN.U8,
      nbr5: COLUMN.U8,
      mask5: COLUMN.U16,
      rand6: COLUMN.U8,
      nbr6: COLUMN.U8,
      mask6: COLUMN.U16,
      mummification: COLUMN.U16,
      diseaseres: COLUMN.U8,
      raiseonkill: COLUMN.U8,
      raiseshape: COLUMN.U16,
      sendlesserhorrormult: COLUMN.U8,
      incorporate: COLUMN.U8,
      blessbers: COLUMN.U8,
      curseattacker: COLUMN.U8,
      uwheat: COLUMN.U8,
      slothresearch: COLUMN.U8,
      horrordeserter: COLUMN.U8,
      sorceryrange: COLUMN.U8,
      older: COLUMN.I8,
      disbelieve: COLUMN.U8,
      firerange: COLUMN.U8,
      astralrange: COLUMN.U8,
      naturerange: COLUMN.U8,
      beartattoo: COLUMN.U8,
      horsetattoo: COLUMN.U8,
      reincarnation: COLUMN.U8,
      wolftattoo: COLUMN.U8,
      boartattoo: COLUMN.U8,
      sleepaura: COLUMN.U8,
      snaketattoo: COLUMN.U8,
      appetite: COLUMN.I8,
      templetrainer: COLUMN.U8,
      infernoret: COLUMN.U8,
      kokytosret: COLUMN.U8,
      addrandomage: COLUMN.U16,
      unsurr: COLUMN.U8,
      speciallook: COLUMN.U8,
      bugreform: COLUMN.U8,
      onisummon: COLUMN.U8,
      sunawe: COLUMN.U8,
      startaff: COLUMN.U8,
      ivylord: COLUMN.U8,
      triplegod: COLUMN.U8,
      triplegodmag: COLUMN.U8,
      fortkill: COLUMN.U8,
      thronekill: COLUMN.U8,
      digest: COLUMN.U8,
      indepmove: COLUMN.U8,
      entangle: COLUMN.U8,
      alchemy: COLUMN.U8,
      woundfend: COLUMN.U8,
      falsearmy: COLUMN.I8,
      summon5: COLUMN.U8,
      slaver: COLUMN.U16,
      deathparalyze: COLUMN.U8,
      corpseconstruct: COLUMN.U8,
      guardianspiritmodifier: COLUMN.I8,
      iceforging: COLUMN.U8,
      clockworklord: COLUMN.U8,
      minsizeleader: COLUMN.U8,
      ironvul: COLUMN.U8,
      heathensummon: COLUMN.U8,
      powerofdeath: COLUMN.U8,
      reformtime: COLUMN.I8,
      twiceborn: COLUMN.U16,
      tmpastralgems: COLUMN.U8,
      startheroab: COLUMN.U8,
      uwfireshield: COLUMN.U8,
      saltvul: COLUMN.U8,
      landenc: COLUMN.U8,
      plaguedoctor: COLUMN.U8,
      curseluckshield: COLUMN.U8,
      farthronekill: COLUMN.U8,
      horrormark: COLUMN.U8,
      allret: COLUMN.U8,
      aciddigest: COLUMN.U8,
      beckon: COLUMN.U8,
      slaverbonus: COLUMN.U8,
      carcasscollector: COLUMN.U8,
      mindcollar: COLUMN.U8,
      mountainrec: COLUMN.U8,
      indepspells: COLUMN.U8,
      enchrebate50: COLUMN.U8,
      summon1: COLUMN.U16,
      randomspell: COLUMN.U8,
      insanify: COLUMN.U8,
      //just a copy of reanimator...
      //'reanimator~1': COLUMN.U8,
      defector: COLUMN.U8,
      batstartsum1d3: COLUMN.U16,
      enchrebate10: COLUMN.U8,
      undying: COLUMN.U8,
      moralebonus: COLUMN.U8,
      uncurableaffliction: COLUMN.U32,
      wintersummon1d3: COLUMN.U16,
      stygianguide: COLUMN.U8,
      smartmount: COLUMN.U8,
      reformingflesh: COLUMN.U8,
      fearoftheflood: COLUMN.U8,
      corpsestitcher: COLUMN.U8,
      reconstruction: COLUMN.U8,
      nofriders: COLUMN.U8,
      coridermnr: COLUMN.U16,
      holycost: COLUMN.U8,
      animatemnr: COLUMN.U16,
      lich: COLUMN.U16,
      erastartageincrease: COLUMN.U16,
      moreorder: COLUMN.I8,
      moregrowth: COLUMN.I8,
      moreprod: COLUMN.I8,
      moreheat: COLUMN.I8,
      moreluck: COLUMN.I8,
      moremagic: COLUMN.I8,
      nofmounts: COLUMN.U8,
      falsedamagerecovery: COLUMN.U8,
      uwpathboost: COLUMN.I8,
      randomitems: COLUMN.U16,
      deathslimeexpl: COLUMN.U8,
      deathpoisonexpl: COLUMN.U8,
      deathshockexpl: COLUMN.U8,
      drawsize: COLUMN.I8,
      petrificationimmune: COLUMN.U8,
      scarsouls: COLUMN.U8,
      spikebarbs: COLUMN.U8,
      pretenderstartsite: COLUMN.U16,
      offscriptresearch: COLUMN.U8,
      unmountedspr: COLUMN.U32,
      exhaustion: COLUMN.U8,
      // mounted: COLUMN.BOOL, // deprecated
      bow: COLUMN.BOOL,
      body: COLUMN.BOOL,
      foot: COLUMN.BOOL,
      crownonly: COLUMN.BOOL,
      holy: COLUMN.BOOL,
      inquisitor: COLUMN.BOOL,
      inanimate: COLUMN.BOOL,
      undead: COLUMN.BOOL,
      demon: COLUMN.BOOL,
      magicbeing: COLUMN.BOOL,
      stonebeing: COLUMN.BOOL,
      animal: COLUMN.BOOL,
      coldblood: COLUMN.BOOL,
      female: COLUMN.BOOL,
      forestsurvival: COLUMN.BOOL,
      mountainsurvival: COLUMN.BOOL,
      wastesurvival: COLUMN.BOOL,
      swampsurvival: COLUMN.BOOL,
      aquatic: COLUMN.BOOL,
      amphibian: COLUMN.BOOL,
      pooramphibian: COLUMN.BOOL,
      float: COLUMN.BOOL,
      flying: COLUMN.BOOL,
      stormimmune: COLUMN.BOOL,
      teleport: COLUMN.BOOL,
      immobile: COLUMN.BOOL,
      noriverpass: COLUMN.BOOL,
      illusion: COLUMN.BOOL,
      spy: COLUMN.BOOL,
      assassin: COLUMN.BOOL,
      heal: COLUMN.BOOL,
      immortal: COLUMN.BOOL,
      domimmortal: COLUMN.BOOL,
      noheal: COLUMN.BOOL,
      neednoteat: COLUMN.BOOL,
      undisciplined: COLUMN.BOOL,
      slave: COLUMN.BOOL,
      slashres: COLUMN.BOOL,
      bluntres: COLUMN.BOOL,
      pierceres: COLUMN.BOOL,
      blind: COLUMN.BOOL,
      petrify: COLUMN.BOOL,
      ethereal: COLUMN.BOOL,
      deathcurse: COLUMN.BOOL,
      trample: COLUMN.BOOL,
      trampswallow: COLUMN.BOOL,
      taxcollector: COLUMN.BOOL,
      drainimmune: COLUMN.BOOL,
      unique: COLUMN.BOOL,
      scalewalls: COLUMN.BOOL,
      divineins: COLUMN.BOOL,
      heatrec: COLUMN.BOOL,
      coldrec: COLUMN.BOOL,
      spreadchaos: COLUMN.BOOL,
      spreaddeath: COLUMN.BOOL,
      bug: COLUMN.BOOL,
      uwbug: COLUMN.BOOL,
      spreadorder: COLUMN.BOOL,
      spreadgrowth: COLUMN.BOOL,
      spreaddom: COLUMN.BOOL,
      drake: COLUMN.BOOL,
      theftofthesunawe: COLUMN.BOOL,
      dragonlord: COLUMN.BOOL,
      mindvessel: COLUMN.BOOL,
      elementrange: COLUMN.BOOL,
      astralfetters: COLUMN.BOOL,
      combatcaster: COLUMN.BOOL,
      aisinglerec: COLUMN.BOOL,
      nowish: COLUMN.BOOL,
      mason: COLUMN.BOOL,
      spiritsight: COLUMN.BOOL,
      ownblood: COLUMN.BOOL,
      invisible: COLUMN.BOOL,
      spellsinger: COLUMN.BOOL,
      magicstudy: COLUMN.BOOL,
      unify: COLUMN.BOOL,
      triple3mon: COLUMN.BOOL,
      yearturn: COLUMN.BOOL,
      unteleportable: COLUMN.BOOL,
      reanimpriest: COLUMN.BOOL,
      stunimmunity: COLUMN.BOOL,
      singlebattle: COLUMN.BOOL,
      researchwithoutmagic: COLUMN.BOOL,
      autocompete: COLUMN.BOOL,
      adventurers: COLUMN.BOOL,
      cleanshape: COLUMN.BOOL,
      reqlab: COLUMN.BOOL,
      reqtemple: COLUMN.BOOL,
      horrormarked: COLUMN.BOOL,
      isashah: COLUMN.BOOL,
      isayazad: COLUMN.BOOL,
      isadaeva: COLUMN.BOOL,
      blessfly: COLUMN.BOOL,
      plant: COLUMN.BOOL,
      comslave: COLUMN.BOOL,
      snowmove: COLUMN.BOOL,
      swimming: COLUMN.BOOL,
      stupid: COLUMN.BOOL,
      skirmisher: COLUMN.BOOL,
      unseen: COLUMN.BOOL,
      nomovepen: COLUMN.BOOL,
      wolf: COLUMN.BOOL,
      dungeon: COLUMN.BOOL,
      aboleth: COLUMN.BOOL,
      localsun: COLUMN.BOOL,
      tmpfiregems: COLUMN.BOOL,
      defiler: COLUMN.BOOL,
      mountedbeserk: COLUMN.BOOL,
      lanceok: COLUMN.BOOL,
      minprison: COLUMN.BOOL,
      hpoverflow: COLUMN.BOOL,
      indepstay: COLUMN.BOOL,
      polyimmune: COLUMN.BOOL,
      norange: COLUMN.BOOL,
      nohof: COLUMN.BOOL,
      autoblessed: COLUMN.BOOL,
      almostundead: COLUMN.BOOL,
      truesight: COLUMN.BOOL,
      mobilearcher: COLUMN.BOOL,
      spiritform: COLUMN.BOOL,
      chorusslave: COLUMN.BOOL,
      chorusmaster: COLUMN.BOOL,
      tightrein: COLUMN.BOOL,
      glamourman: COLUMN.BOOL,
      divinebeing: COLUMN.BOOL,
      nofalldmg: COLUMN.BOOL,
      fireempower: COLUMN.BOOL,
      airempower: COLUMN.BOOL,
      waterempower: COLUMN.BOOL,
      earthempower: COLUMN.BOOL,
      popspy: COLUMN.BOOL,
      capitalhome: COLUMN.BOOL,
      clumsy: COLUMN.BOOL,
      regainmount: COLUMN.BOOL,
      nobarding: COLUMN.BOOL,
      mountiscom: COLUMN.BOOL,
      nothrowoff: COLUMN.BOOL,
      bird: COLUMN.BOOL,
      decayres: COLUMN.BOOL,
      cubmother: COLUMN.BOOL,
      glamour: COLUMN.BOOL,
      gemprod: COLUMN.STRING,
      fixedname: COLUMN.STRING,
    },
    extraFields: {
      type: (index: number, args: SchemaArgs) => {
        const sdIndex = args.rawFields['startdom'];
        return {
          index,
          name: 'type',
          type: COLUMN.U16,
          width: 2,
          override(v, u, a) {
            // have to fill in more stuff later, when we join rec types, oh well
            // other types: commander, mercenary, hero, etc
            if (u[sdIndex]) return 3; // god + commander
            else return 0; // just a unit
          },
        };
      },
      armor: (index: number, args: SchemaArgs) => {
        const indices = Object.entries(args.rawFields)
          .filter(e => e[0].match(/^armor\d$/))
          .map((e) => e[1]);


        return {
          index,
          name: 'armor',
          type: COLUMN.U16_ARRAY,
          width: 2,
          override(v, u, a) {
            const armors: number[] = [];
            for (const i of indices) {

              if (u[i]) armors.push(Number(u[i]));
              else break;
            }
            return armors;
          },
        }
      },

      weapons: (index: number, args: SchemaArgs) => {
        const indices = Object.entries(args.rawFields)
          .filter(e => e[0].match(/^wpn\d$/))
          .map((e) => e[1]);

        return {
          index,
          name: 'weapons',
          type: COLUMN.U16_ARRAY,
          width: 2,
          override(v, u, a) {
            const wpns: number[] = [];
            for (const i of indices) {

              if (u[i]) wpns.push(Number(u[i]));
              else break;
            }
            return wpns;
          },
        }
      },

      '&custommagic': (index: number, args: SchemaArgs) => {

        const CM_KEYS = [1,2,3,4,5,6].map(n =>
          `rand nbr mask`.split(' ').map(k => args.rawFields[`${k}${n}`])
        );
        console.log({ CM_KEYS })
        return {
          index,
          name: '&custommagic', // PACKED UP
          type: COLUMN.U32_ARRAY,
          width: 2,
          override(v, u, a) {
            const cm: number[] = [];
            for (const K of CM_KEYS) {
              const [rand, nbr, mask] = K.map(i => u[i]);
              if (!rand) break;
              if (nbr > 63) throw new Error('ffs...');
              const b = mask >> 7;
              const n = nbr << 10;
              const r = rand << 16;
              cm.push(r | n | b);
            }
            return cm;
          },
        }
      },
    },
    overrides: {
      // csv has unrest/turn which is incunrest / 10; convert to int format
      incunrest: (v) => {
        return (Number(v) * 10) || 0
      }
    },
  },
  '../../gamedata/BaseI.csv': {
    name: 'Item',
    key: 'id',
    ignoreFields: new Set(['end', 'itemcost1~1', 'warning~1']),
  },

  '../../gamedata/MagicSites.csv': {
    name: 'MagicSite',
    key: 'id',
    ignoreFields: new Set(['domconflict~1','end']),
  },
  '../../gamedata/Mercenary.csv': {
    name: 'Mercenary',
    key: 'id',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/afflictions.csv': {
    name: 'Affliction',
    key: 'bit_value',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/anon_province_events.csv': {
    name: 'AnonProvinceEvent',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/armors.csv': {
    name: 'Armor',
    key: 'id',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attribute_keys.csv': {
    name: 'AttributeKey',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/attributes_by_armor.csv': {
    name: 'AttributeByArmor',
    key: '__rowId',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_nation.csv': {
    name: 'AttributeByNation',
    key: '__rowId',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_spell.csv': {
    name: 'AttributeBySpell',
    key: '__rowId',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/attributes_by_weapon.csv': {
    name: 'AttributeByWeapon',
    key: '__rowId',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/buffs_1_types.csv': {
    name: 'BuffBit1',
    key: '__rowId',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/buffs_2_types.csv': {
    name: 'BuffBit2',
    key: '__rowId',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/coast_leader_types_by_nation.csv': {
    name: 'CoastLeaderTypeByNation',
    key: '__rowId', // removed after joinTables
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/coast_troop_types_by_nation.csv': {
    name: 'CoastTroopTypeByNation',
    key: '__rowId', // removed after joinTables
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/effect_modifier_bits.csv': {
    name: 'SpellBit',
    key: '__rowId', // TODO - need to join
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/effects_info.csv': {
    key: 'number',
    name: 'SpellEffectInfo',
    ignoreFields: new Set(['test']),
  },
  /*
  '../../gamedata/effects_spells.csv': {
    key: 'record_id',
    name: 'EffectSpell',
    ignoreFields: new Set(['end']),
  },
  */
  '../../gamedata/effects_weapons.csv': {
    name: 'EffectWeapon',
    key: 'record_id',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/enchantments.csv': {
    key: 'number',
    name: 'Enchantment',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/events.csv': {
    key: 'id',
    name: 'Event',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/fort_leader_types_by_nation.csv': {
    name: 'FortLeaderTypeByNation',
    key: '__rowId', // removed after joinTables
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/fort_troop_types_by_nation.csv': {
    name: 'FortTroopTypeByNation',
    key: '__rowId', // removed after joinTables
    ignoreFields: new Set(['end']),
  },
  /* TODO turn to constants
  '../../gamedata/magic_paths.csv': {
    key: 'number',
    name: 'MagicPath',
    ignoreFields: new Set(['test']),
  },
  */
  '../../gamedata/map_terrain_types.csv': {
    key: 'bit_value', // removed after joinTables
    name: 'TerrainTypeBit',
    ignoreFields: new Set(['test']),
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
  '../../gamedata/nations.csv': {
    key: 'id',
    name: 'Nation',
    ignoreFields: new Set(['end']),
    extraFields: {
      realm: (index: number) => {
        return {
          index,
          name: 'realm',
          type: COLUMN.U8,
          width: 1,
          // we will assign these later
          override(v, u, a) { return 0; },
        };
      }
    }
  },
  '../../gamedata/nonfort_leader_types_by_nation.csv': {
    key: '__rowId', // TODO - buh
    name: 'NonFortLeaderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/nonfort_troop_types_by_nation.csv': {
    key: '__rowId', // TODO - buh
    name: 'NonFortTroopTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/other_planes.csv': {
    key: 'number',
    name: 'OtherPlane',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/pretender_types_by_nation.csv': {
    key: '__rowId', // TODO - buh
    name: 'PretenderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/protections_by_armor.csv': {
    key: '__rowId', // TODO - buh
    name: 'ProtectionByArmor',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/realms.csv': {
    key: '__rowId', // TODO - buh
    name: 'Realm',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/site_terrain_types.csv': {
    key: 'bit_value',
    name: 'SiteTerrainType',
    ignoreFields: new Set(['test']),
  },
  '../../gamedata/special_damage_types.csv': {
    key: 'bit_value',
    name: 'SpecialDamageType',
    ignoreFields: new Set(['test']),
  },
  /*
  '../../gamedata/special_unique_summons.csv': {
    name: 'SpecialUniqueSummon',
    key: 'number',
    ignoreFields: new Set(['test']),
  },
  */
  '../../gamedata/spells.csv': {
    name: 'Spell',
    key: 'id',
    ignoreFields: new Set(['end']),
    preTransform (rawFields: string[], rawData: string[][]) {
      // columns to copy over from effects_spells to spells...
      const IDX = rawFields.indexOf('effect_record_id');
      const TXF = [1,2,3,5,6,7,8,9,10,11,12]
      if (IDX === -1) throw new Error('no effect_record_id?')

      function replaceRef (dest: string[], src: string[]) {
        dest.splice(IDX, 1, ...TXF.map(i => src[i]));
      }

      const [effectFields, ...effectData] = readFileSync(
          `../../gamedata/effects_spells.csv`,
          { encoding: 'utf8' }
        ).split('\n')
        .filter(line => line !== '')
        .map(line => line.split('\t'));

      replaceRef(rawFields, effectFields);

      for (const [i, f] of rawFields.entries()) console.log(i, f)

      for (const dest of rawData) {
        const erid = Number(dest[IDX]);
        const src = effectData[erid];
        if (!src) {
          console.error('NOPE', dest, erid);
          throw new Error('no thanks');
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
  '../../gamedata/unpretender_types_by_nation.csv': {
    key: '__rowId',
    name: 'UnpretenderTypeByNation',
    ignoreFields: new Set(['end']),
  },
  '../../gamedata/weapons.csv': {
    key: 'id',
    name: 'Weapon',
    ignoreFields: new Set(['end', 'weapon']),
  },
};
