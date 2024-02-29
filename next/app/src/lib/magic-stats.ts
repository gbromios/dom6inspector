export const BASE_PATHS = 'FAWESDNGBH';

export type MagicLevels = Record<string, number>;

export function calcMagicLevels (src?: any|number, lvl?: any): MagicLevels|null {
  let lvls: Record<string, number>;
  let hasMagic = false;
  if (typeof src === 'number') {
    if (lvl && typeof lvl === 'number') {
      // lvl applied to mask (src)
      hasMagic = true;
      lvls = Object.fromEntries(Array.from(BASE_PATHS, p => [p, 0]));
      if (src) for (const path of maskToPaths(src)) lvls[path] += lvl;
    } else if (lvl === 0) {
      // src is lvl
      if (src) hasMagic = true;
      lvls = Object.fromEntries(Array.from(BASE_PATHS, p => [p, src]));
    } else {
      throw new Error('what signature is this');
    }
  } else {
    lvls = Object.fromEntries(Array.from(BASE_PATHS, p => {
      const v = src[p] || 0;
      if (v) hasMagic = true;
      return [p, v];
    }));

    if (lvl.custommagic) {
      hasMagic = true;
      lvls['U'] = Math.round(lvl.custommagic.avgLvl);
    }
  }
  //console.log('MAGIC LEVELS', src?.id, { lvls })
  return hasMagic ? lvls : null;
}

export type UnitCustomMagic = {
  spec: {
    chance: number,
    lvl: number,
    paths: string[] }[],
  avgLvl: number,
  minLvl: number,
  maxLvl: number,
}

export function calcUnitCustomMagic (item: any) {
  if (!item['&custommagic']?.length) return null; // who care
  const cms: UnitCustomMagic = { spec: [], avgLvl: 0, minLvl: 0, maxLvl: 0 }
  for (const p of item['&custommagic']) {
    const mask = (p & 1023) << 7;
    const count = (p >>> 10) & 63;
    const strength = (p >>> 16);
    const paths = maskToPaths(mask);
    for (let i = 0; i < count; i++) {
      const chance = Math.min(strength, 100);
      const lvl = Math.max(strength / 100, 1);
      cms.avgLvl += strength / 100;
      if (strength >= 100) cms.minLvl += lvl;
      cms.maxLvl += lvl;
      cms.spec.push({ chance, lvl, paths });
    }
  }
  return cms.spec.length ? cms : null;
}

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

export function calcResearch (item: any, row: any) {
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
