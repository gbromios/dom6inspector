const __textEncoder = new TextEncoder();
const __textDecoder = new TextDecoder();

export function stringToBytes (s: string): Uint8Array;
export function stringToBytes (s: string, dest: Uint8Array, i: number): number;
export function stringToBytes (s: string, dest?: Uint8Array, i = 0) {
  if (s.indexOf('\0') !== -1) {
    const i = s.indexOf('\0');
    console.error(`${i} = NULL ? "...${s.slice(i - 10, i + 10)}...`);
    throw new Error('whoopsie');
  }
  const bytes = __textEncoder.encode(s + '\0');
  if (dest) {
    dest.set(bytes, i);
    return bytes.length;
  } else {
    return bytes;
  }
}

export function bytesToString(i: number, a: Uint8Array): [string, number] {
  let r = 0;
  while (a[i + r] !== 0) { r++; }
  return [__textDecoder.decode(a.slice(i, i+r)), r + 1];
}

export function bigBoyToBytes (n: bigint): Uint8Array {
  // this is a cool game but lets hope it doesn't use 127+ byte numbers
  const bytes = [0];
  if (n < 0n) {
    n *= -1n;
    bytes[0] = 128;
  }

  // WOOPSIE
  while (n) {
    if (bytes[0] === 255) throw new Error('bruh thats too big');
    bytes[0]++;
    bytes.push(Number(n & 255n));
    n >>= 8n;
  }

  return new Uint8Array(bytes);
}

export function bytesToBigBoy (i: number, bytes: Uint8Array): [bigint, number] {
  const L = Number(bytes[i]);
  const len = L & 127;
  const read = 1 + len;
  const neg = (L & 128) ? -1n : 1n;
  const BB: bigint[] = Array.from(bytes.slice(i + 1, i + read), BigInt);
  if (len !== BB.length) throw new Error('bigint checksum is FUCK?');
  return [len ? BB.reduce(byteToBigboi) * neg : 0n, read]
}

function byteToBigboi (n: bigint, b: bigint, i: number) {
  return n | (b << BigInt(i * 8));
}
