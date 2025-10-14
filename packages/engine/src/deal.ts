// deal.ts
import { makeDeck } from "./cards";
import { makePrngFromHexSeed } from "./rng";
import { shuffle } from "./shuffle";
export interface DealResult {
  stock: number[]; waste: number[];
  tableau: number[][]; foundations: number[][];
  deck: number[];
}
export function dealClassic(seedHex: string): DealResult {
  const prng = makePrngFromHexSeed(seedHex);
  const deck = makeDeck();
  shuffle(deck, prng);
  const tableau: number[][] = [[],[],[],[],[],[],[]];
  let idx = 0;
  for (let pile = 0; pile < 7; pile++) {
    const count = pile + 1;
    tableau[pile] = deck.slice(idx, idx + count);
    idx += count;
  }
  const stock = deck.slice(idx);
  const waste: number[] = [];
  const foundations: number[][] = [[], [], [], []];
  return { stock, waste, tableau, foundations, deck };
}
