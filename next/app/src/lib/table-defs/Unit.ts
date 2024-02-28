import type { Column } from './column';
import { boolValue, rawValue } from './column';
import MagicPathsTD from '$lib/component/Data/MagicPaths.svelte'
import UnitNameTD from '$lib/component/Data/UnitName.svelte'
export const rowKey: string = 'id';

export const columns: Column[] = [
  { ...rawValue('id', 'ID'), size: '0 0 3em' },
  {
    key: 'name',
    labelText: 'Name',
    size: '0 0 16em', // ????
    itemComponent: UnitNameTD,
    getItemValue(row) {
      return {
        n: row.name,
        f: row.fixedname || null,
        i: row.__rowId,
      }
    },
    getItemText (item) {
      const { n, f, i } = item.name;
      return (f ?`\u201C${f}\u201D ${n}` : n); //+ ` (${i})`;
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
    key: 'rt',
    labelText: 'Rec.',
    size: '0 0 6em',
    getItemValue (item: any) {
      return item.r === 1 ? 'Commander' : 'Troop';
    },
    getItemText (item: any) {
      return item.rt;
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
    getItemValue (item: any, row: any) {
      if (!item['&custommagic']?.length) return null; // who care
      const cms = { spec: [] as any[], lvl: 0 }
      for (const p of item['&custommagic']) {
        const mask = (p & 1023) << 7;
        const count = (p >>> 10) & 63;
        const strength = (p >>> 16);
        const paths = maskToPaths(mask);
        for (let i = 0; i < count; i++) {
          cms.lvl += strength / 100;
          cms.spec.push({
            chance: Math.min(strength, 100),
            lvl: Math.max(strength / 100, 1),
            paths
          });
        }
      }
      return cms.spec.length ? cms : null;
    },
    getItemText (r: any) {
      return r.custommagic ? Math.round(r.custommagic.lvl) : null;
    },
  },
  {
    key: 'magicpaths',
    labelText: 'Magic Paths',
    size: '0 0 16em',
    getItemValue: MagicLevels,
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
    getItemValue: getResearch,
    getItemText (r: any) { return `${r.research}` }
  },
]

function getResearch (item: any, row: any) {
  // TODO - don't forget researchwithoutmagic
  // TODO - a single holy path by itself means there should not be any base r
  if (item.fixedresearch)
    return (row.magicpaths ??= {}).R = item.fixedresearch;
  const mlvl = row.magicpaths;
  if (!mlvl) return 0;
  const base = 5 + (item.researchbonus || 0);
  let hasResearchMagic = false;
  let rv = Object.entries(mlvl).reduce((ra, [p, ml]) => {
    //console.log(ra, p, ml)
    if (!ml) return ra;
    switch (p) {
      case 'H':
      case 'R':
        return ra;
      case 'U': // sadly...
        ml = Math.floor(ml as number) || 0;
      default:
        hasResearchMagic = true;
        return ra + (ml as number || 0) * 2
    }
  }, base);
  //console.log('research for', item.name, rv)

  if (!hasResearchMagic) return 0;
  mlvl.R = rv;
  return rv;
}

type MagicLevels = Record<string, number>;

function MagicLevels (src?: any|number, lvl?: any): MagicLevels|null {
  let lvls: Record<string, number>;
  let hasMagic = false;
  if (typeof src === 'number') {
    if (lvl && typeof lvl === 'number') {
      // lvl applied to mask (src)
      hasMagic = true;
      lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => [p, 0]));
      if (src) for (const path of maskToPaths(src)) lvls[path] += lvl;
    } else if (lvl === 0) {
      // src is lvl
      if (src) hasMagic = true;
      lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => [p, src]));
    } else {
      throw new Error('what signature is this');
    }
  } else {
    lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => {
      const v = src[p] || 0;
      if (v) hasMagic = true;
      return [p, v];
    }));

    if (lvl.custommagic) {
      hasMagic = true;
      lvls['U'] = Math.round(lvl.custommagic.lvl);
    }
  }
  //console.log('MAGIC LEVELS', src?.id, { lvls })
  return hasMagic ? lvls : null;
}

const MAGIC_PATHS = 'FAWESDNGBH';

const CM_KEYS = [1,2,3,4,5,6]
  .map(n => `rand${n} nbr${n} link${n} mask${n}`.split(' '))

//console.log(CM_KEYS)


function maskToPaths (mask: number): string[] {
  const paths: string[] = [];
  if (mask & 128  ) paths.push('F');
  if (mask & 256  ) paths.push('A');
  if (mask & 512  ) paths.push('W');
  if (mask & 1024 ) paths.push('E');
  if (mask & 2048 ) paths.push('S');
  if (mask & 4096 ) paths.push('D');
  if (mask & 8192 ) paths.push('N');
  if (mask & 16384) paths.push('G');
  if (mask & 32768) paths.push('B');
  if (mask & 65536) paths.push('H');
  return paths;
}

export const defaults = new Set<string>([
  'id', 'name',
  //...'FAWESDNGB'
  'rt',
  'holy',
  'magicpaths',
])

//export const defaults = new Set<string>(Object.keys(columns))
