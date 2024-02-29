import { browser } from "$app/environment";

type CharSize = {
  n: number;
  b: number;
  i: number;
  bi: number;
};
type CharSet = {
  n: string;
  b: string;
  i: string;
  bi: string;
};
function CharSize (): CharSize {
  return {
    n: 0,
    b: 0,
    i: 0,
    bi: 0,
  }
}

export function findWidth<T>(
  items: T|T[],
  getChars: (i: T) => CharSet,
  setWidth?: (i: T, w: number) => void,
): number {
  if (!Array.isArray(items)) items = [items];
  let tw = 0;
  for (const i of items) {
    let w = 0;
    const chars = getChars(i);
    for (const k in chars) { }
    setWidth?.(i, w);
    tw += w;
  }
  return tw;
}

const chars = Array.from(
  '*-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzèö0123456789\', '
)

export function calcCharWidth() {
  if (!browser) throw new Error('buddy....');
  /*
  window._calcWidths = () => {
    const widths: Record<string, CharSize> = {};
    let c: string;
    let size: CharSize;
    for (c of chars) {
      widths[c] = (size = CharSize());
      const el = document.createElement('span');
      if (c === ' ') el.innerHTML = '&nbsp;'
      else el.innerText = c;
    }
    console.log(widths);
  }
  */
}
