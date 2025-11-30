import { describe, it, expect } from "vitest";
import { canPlaceOnTableau, canPlaceOnFoundation } from "../src/rules.functions";
import { rank, suit, isRed } from "../src/cards";

// Find any card with a given property; we probe the value space so we don't
// assume a particular bit layout for cards.
function findCard(predicate: (n: number) => boolean): number {
  for (let n = 0; n < 1 << 16; n++) {
    if (predicate(n)) return n;
  }
  throw new Error("Could not construct card");
}

function cardOfRank(r: number): number {
  return findCard((n) => rank(n) === r);
}
function cardOfRankWithSuit(r: number, s: number): number {
  return findCard((n) => rank(n) === r && suit(n) === s);
}
function cardOfRankSameColor(r: number, s: number): number {
  const wantRed = isRed(s);
  return findCard((n) => rank(n) === r && isRed(suit(n)) === wantRed);
}
function cardOfRankOppColor(r: number, s: number): number {
  const wantRed = !isRed(s);
  return findCard((n) => rank(n) === r && isRed(suit(n)) === wantRed);
}

describe("rules functions", () => {
  describe("canPlaceOnTableau", () => {
    it("accepts King on empty tableau", () => {
      const kingHearts = cardOfRank(13);
      expect(canPlaceOnTableau(undefined, kingHearts)).toBe(true);
    });

    it("requires alternating colors and descending by one", () => {
      const dst = cardOfRank(12); // any Queen
      const sDst = suit(dst);

      const ok = cardOfRankOppColor(11, sDst);      // valid Jack (opposite color)
      const badColor = cardOfRankSameColor(11, sDst); // Jack, same color
      const badRank = cardOfRankOppColor(10, sDst);   // Ten (two lower), opposite color

      expect(canPlaceOnTableau(dst, ok)).toBe(true);
      expect(canPlaceOnTableau(dst, badColor)).toBe(false);
      expect(canPlaceOnTableau(dst, badRank)).toBe(false);
    });
  });

  describe("canPlaceOnFoundation", () => {
    it("accepts Ace on empty foundation", () => {
      const ace = cardOfRank(1);
      const two = cardOfRank(2);
      expect(canPlaceOnFoundation(undefined, ace)).toBe(true);
      expect(canPlaceOnFoundation(undefined, two)).toBe(false);
    });

    it("requires same suit and ascending by one", () => {
      const dst = cardOfRank(5);          // any 5
      const sDst = suit(dst);

      const ok = cardOfRankWithSuit(6, sDst);       // same suit, +1
      const badSuit = findCard((n) => rank(n) === 6 && suit(n) !== sDst); // different suit
      const badRank = cardOfRankWithSuit(7, sDst);  // same suit, +2

      expect(canPlaceOnFoundation(dst, ok)).toBe(true);
      expect(canPlaceOnFoundation(dst, badSuit)).toBe(false);
      expect(canPlaceOnFoundation(dst, badRank)).toBe(false);
    });
  });
});

