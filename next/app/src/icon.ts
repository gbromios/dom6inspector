export const icons: Record<
  string,
  Readonly<{
    x: number, y: number,
    width: number, height: number,
    src: string, name: string
  }>
> = {};
export async function loadIcons () {
  const data = await fetch('/image/icon/icon.json').then(r => r.json());
  for (const [name, [x, y, width, height, src]] of Object.entries(data) as any) {
    icons[name] = { name, x, y, width, height, src };
    // preload it too
    new Image(width, height).src = src;
  }
}

