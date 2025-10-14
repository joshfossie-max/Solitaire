// shuffle.ts
import type { PRNG } from "./rng";
export function shuffle(deck: number[], prng: PRNG): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const r = prng.nextU32() >>> 0;
    const j = r % (i + 1);
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
}
