import type { Column } from './column';
import { boolValue, rawValue } from './column';
import MagicPathsTD from '$lib/component/Data/MagicPaths.svelte'
import UnitSource from '$lib/component/Data/UnitSource.svelte'
import UnitNameTD from '$lib/component/Data/UnitName.svelte'
import { calcMagicLevels, calcResearch, calcUnitCustomMagic } from '$lib/magic-stats';
export const rowKey: string = 'id';

// um... idk mane, we'll think of something better
const longnames = new Set<number>([
  2530, 589, 944, 1375, 2496, 2494, 1672, 2758, 3241, 2612, 1019, 1035, 1494,
  2085, 2235, 2495, 3467, 2246, 2757, 581, 2272, 1660
])

export const columns: Column[] = [
  { ...rawValue('id', 'ID'), size: 3 },
  {
    key: 'name',
    labelText: 'Name',
    size: 16,
    itemComponent: UnitNameTD,
    getItemValue(row) {
      return {
        n: row.name,
        f: row.fixedname || null,
        i: row.__rowId,
        w: longnames.has(row.id)
      }
    },
    getItemText (item) {
      const { n, f } = item.name;
      return (f ?`\u201C${f}\u201D ${n}` : n); //+ ` (${item.name.i})`;
    }
  },
  rawValue('att', 'Attack'),
  rawValue('basecost'),
  rawValue('goldCostAdjustment', 'Gold Cost Adjustment'),
  rawValue('F', 'Fire Magic'),
  rawValue('A', 'Air Magic'),
  rawValue('W', 'Water Magic'),
  rawValue('E', 'Earth Magic'),
  rawValue('S', 'Astral Magic'),
  rawValue('D', 'Death Magic'),
  rawValue('N', 'Nature Magic'),
  rawValue('G', 'Glamour Magic'),
  rawValue('B', 'Blood Magic'),
  rawValue('size', 'Size'),
  rawValue('ressize', 'Resource Size'),
  rawValue('hp', 'Hit Points'),
  rawValue('prot', 'Natural Protection'),
  rawValue('mr', 'Magic Resistance'),
  rawValue('mor', 'Morale'),
  rawValue('str', 'Strength'),
  rawValue('att', 'Attack Skill'),
  rawValue('def', 'Defense Skill'),
  rawValue('prec', 'Precision'),
  rawValue('enc', 'Encumbrance'),
  rawValue('mapmove', 'Map Movement'),
  rawValue('ap', 'Action Points'),
  rawValue('researchbonus', 'Research Bonus'),
  {
    key: 'source',
    labelText: 'Source',
    size: 6,
    //itemComponent: UnitSource,
    getItemValue (item: any) {
      return {
        // oops
        type: item.startdom ? 3 : item.rt ? 2 : 1
      };
    },
    getItemText (item: any) {
      switch(item.source.type) {
        case 1: return 'Unit';
        case 2: return 'Cmdr.';
        case 3: return 'God';
      }
    }
  },
  rawValue('mounted'),
  rawValue('bow'),
  rawValue('body'),
  rawValue('foot'),
  rawValue('crownonly'),
  boolValue({
    key: 'holy',
    labelText: 'Sacred',
    labelIcon: 'sacred',
  }),
  rawValue('inquisitor'),
  rawValue('inanimate'),
  rawValue('undead'),
  rawValue('demon'),
  rawValue('magicbeing'),
  rawValue('stonebeing'),
  rawValue('animal'),
  rawValue('coldblood'),
  rawValue('female'),
  rawValue('forestsurvival'),
  rawValue('mountainsurvival'),
  rawValue('wastesurvival'),
  rawValue('swampsurvival'),
  rawValue('aquatic'),
  rawValue('amphibian'),
  rawValue('pooramphibian'),
  rawValue('float'),
  rawValue('flying'),
  rawValue('stormimmune'),
  rawValue('teleport'),
  rawValue('immobile'),
  rawValue('noriverpass'),
  rawValue('illusion'),
  rawValue('spy'),
  rawValue('assassin'),
  rawValue('heal'),
  rawValue('immortal'),
  rawValue('domimmortal'),
  rawValue('noheal'),
  rawValue('neednoteat'),
  rawValue('undisciplined'),
  rawValue('slave'),
  rawValue('slashres'),
  rawValue('bluntres'),
  rawValue('pierceres'),
  rawValue('blind'),
  rawValue('petrify'),
  rawValue('ethereal'),
  rawValue('deathcurse'),
  rawValue('trample'),
  rawValue('trampswallow'),
  rawValue('taxcollector'),
  rawValue('drainimmune'),
  rawValue('unique'),
  rawValue('scalewalls'),
  rawValue('divineins'),
  rawValue('heatrec'),
  rawValue('coldrec'),
  rawValue('spreadchaos'),
  rawValue('spreaddeath'),
  rawValue('bug'),
  rawValue('uwbug'),
  rawValue('spreadorder'),
  rawValue('spreadgrowth'),
  rawValue('spreaddom'),
  rawValue('drake'),
  rawValue('theftofthesunawe'),
  rawValue('dragonlord'),
  rawValue('mindvessel'),
  rawValue('elementrange'),
  rawValue('astralfetters'),
  rawValue('combatcaster'),
  rawValue('aisinglerec'),
  rawValue('nowish'),
  rawValue('mason'),
  rawValue('spiritsight'),
  rawValue('ownblood'),
  rawValue('invisible'),
  rawValue('spellsinger'),
  rawValue('magicstudy'),
  rawValue('unify'),
  rawValue('triple3mon'),
  rawValue('yearturn'),
  rawValue('unteleportable'),
  rawValue('reanimpriest'),
  rawValue('stunimmunity'),
  rawValue('singlebattle'),
  rawValue('researchwithoutmagic'),
  rawValue('autocompete'),
  rawValue('adventurers'),
  rawValue('cleanshape'),
  rawValue('reqlab'),
  rawValue('reqtemple'),
  rawValue('horrormarked'),
  rawValue('isashah'),
  rawValue('isayazad'),
  rawValue('isadaeva'),
  rawValue('blessfly'),
  rawValue('plant'),
  rawValue('comslave'),
  rawValue('snowmove'),
  rawValue('swimming'),
  rawValue('stupid'),
  rawValue('skirmisher'),
  rawValue('unseen'),
  rawValue('nomovepen'),
  rawValue('wolf'),
  rawValue('dungeon'),
  rawValue('aboleth'),
  rawValue('localsun'),
  rawValue('tmpfiregems'),
  rawValue('defiler'),
  rawValue('mountedbeserk'),
  rawValue('lanceok'),
  rawValue('minprison'),
  rawValue('hpoverflow'),
  rawValue('indepstay'),
  rawValue('polyimmune'),
  rawValue('norange'),
  rawValue('nohof'),
  rawValue('autoblessed'),
  rawValue('almostundead'),
  rawValue('truesight'),
  rawValue('mobilearcher'),
  rawValue('spiritform'),
  rawValue('chorusslave'),
  rawValue('chorusmaster'),
  rawValue('tightrein'),
  rawValue('glamourman'),
  rawValue('divinebeing'),
  rawValue('nofalldmg'),
  rawValue('fireempower'),
  rawValue('airempower'),
  rawValue('waterempower'),
  rawValue('earthempower'),
  rawValue('popspy'),
  rawValue('capitalhome'),
  rawValue('clumsy'),
  rawValue('regainmount'),
  rawValue('nobarding'),
  rawValue('mountiscom'),
  rawValue('nothrowoff'),
  rawValue('bird'),
  rawValue('decayres'),
  rawValue('cubmother'),
  rawValue('glamour'),
  {
    key: 'custommagic',
    labelText: 'Custom Magic',
    getItemValue: calcUnitCustomMagic,
    getItemText (r: any) {
      return r.custommagic ? Math.round(r.custommagic.lvl) : null;
    },
  },
  {
    key: 'magicpaths',
    labelText: 'Magic Paths',
    size: 14,
    getItemValue: calcMagicLevels,
    itemComponent: MagicPathsTD,
    getItemText (item: any) {
      // TODO - component~
      if (!item.magicpaths) return null;
      return Object.entries(item.magicpaths)
        .map(([p, l]) => (p === '?') ? ` ${p}` : l ? `${l}${p}` : '')
        .filter(m => m)
        .join(' ');
    },
  },
  {
    key: 'research',
    labelText: `Research Ability`,
    getItemValue: calcResearch,
    getItemText (r: any) { return `${r.research}` }
  },
]


//const CM_KEYS = [1,2,3,4,5,6]
  //.map(n => `rand${n} nbr${n} link${n} mask${n}`.split(' '))
//console.log(CM_KEYS)

export const defaults = new Set<string>([
  'id', 'name',
  //...'FAWESDNGB'
  'source',
  'holy',
  'magicpaths',
])

//export const defaults = new Set<string>(Object.keys(columns))
