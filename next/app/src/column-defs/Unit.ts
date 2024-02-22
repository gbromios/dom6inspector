import type { FTColumn } from '../column';
import { rawValue } from '../column';

export const columns: Record<string, FTColumn> = Object.fromEntries([
  rawValue('id', 'ID'),
  rawValue('name', 'Name'),
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
  {
    key: 'custommagic',
    labelText: 'Custom Magic',
    getItemValue (item: any) {
      const cms: any[] & { lvl: number } = Object.assign([], { lvl: 0 });
      for (const keys of CM_KEYS) {
        // TBH not sure what linkN is doing here?
        const [chance, count, _, mask] = keys.map(k => item[k]);
        if (!chance) break;
        const paths = maskToPaths(mask);
        for (let i = 0; i < count; i++) {
          cms.push({ chance, paths });
          cms.lvl += chance / 100;
        }
      }
      if (cms.length) { console.log(item.id, cms) }
      return cms.length ? cms : null;
    },
    getItemText (r: any) {
      return r.custommagic ? Math.round(r.custommagic.lvl) : null;
    },
  },
  {
    key: 'magicpaths',
    labelText: 'Magic Paths',
    getItemValue: MagicLevels,
    getItemText (item: any) {
      // TODO - component~
      return Object.entries(item.magicpaths)
        .map(([p, l]) => (l || p === '?') ? `${p}${l}` : '')
        .filter(m => m)
        .join(' ');
    }
  }
].map(c => [c.key, c]))

function MagicLevels (src?: any|number, lvl?: any): Record<string, number> {
  let lvls: Record<string, number>;
  if (typeof src === 'number') {
    if (lvl && typeof lvl === 'number') {
      // lvl applied to mask (src)
      lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => [p, 0]));
      if (src) for (const path of maskToPaths(src)) lvls[path] += lvl;
    } else if (lvl === 0) {
      // src is lvl
      lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => [p, src]));
    } else {
      throw new Error('what signature is this');
    }
  } else {
    lvls = Object.fromEntries(Array.from(MAGIC_PATHS, p => [p, src[p]]));
    if (lvl.custommagic) {
      lvls['?'] = Math.round(lvl.custommagic.lvl);
    }
  }
  console.log('MAGIC LEVELS', src?.id, { lvls })
  return lvls;
}

const MAGIC_PATHS = 'FAWESDNGBH';

const CM_KEYS = [1,2,3,4,5,6]
  .map(n => `rand${n} nbr${n} link${n} mask${n}`.split(' '))

console.log(CM_KEYS)


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
  'custommagic',
  'magicpaths',
])
