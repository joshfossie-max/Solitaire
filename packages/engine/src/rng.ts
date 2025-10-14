// rng.ts
export interface PRNG { nextU32(): number }
const MASK64 = (1n << 64n) - 1n;
function splitmix64(x: bigint): bigint {
  x = (x + 0x9E3779B97F4A7C15n) & MASK64;
  let z = x;
  z = (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n & MASK64;
  z = (z ^ (z >> 27n)) * 0x94D049BB133111EBn & MASK64;
  return z ^ (z >> 31n);
}
export function seed128FromHex(hex: string): { s0: bigint; s1: bigint } {
  const h = hex.replace(/[^0-9a-f]/gi, "").padStart(32, "0").slice(0, 32);
  const hi = BigInt("0x" + h.slice(0, 16));
  const lo = BigInt("0x" + h.slice(16));
  const s0 = splitmix64(hi);
  const s1 = splitmix64(lo);
  return { s0: s0 & MASK64, s1: s1 & MASK64 };
}
export function makePrngFromHexSeed(hex: string): PRNG {
  let { s0, s1 } = seed128FromHex(hex);
  if ((s0 | s1) === 0n) { s0 = 0x9E3779B97F4A7C15n; s1 = 0xBF58476D1CE4E5B9n; }
  return {
    nextU32() {
      let x = s0, y = s1;
      s0 = y;
      x ^= x << 23n; x &= MASK64;
      s1 = x ^ y ^ (x >> 17n) ^ (y >> 26n);
      const sum = (s1 + y) & MASK64;
      return Number((sum >> 32n) & 0xffffffffn);
    }
  };
}
