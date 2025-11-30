// packages/engine/src/rules.functions.ts
import { rank, suit, isRed } from "./cards";

/** Can a card be placed onto the top of a tableau pile? */
export function canPlaceOnTableau(dstTop: number | undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) return rC === 13; // empty accepts King

  const rD = rank(dstTop), sD = suit(dstTop);
  const alternating = isRed(sC) !== isRed(sD);
  return alternating && rC === (rD - 1);
}

/** Can a card be placed onto a foundation pile? */
export function canPlaceOnFoundation(dstTop: number | undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) return rC === 1; // empty accepts Ace

  const rD = rank(dstTop), sD = suit(dstTop);
  return sC === sD && rC === (rD + 1);
}
