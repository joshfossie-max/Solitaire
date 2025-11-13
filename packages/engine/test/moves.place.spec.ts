import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove, rank, suit } from "../src/api";


const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("moves: place waste → tableau (alternating color, descending; K on empty)", () => {
  it("eventually finds a legal place_t and applies it correctly", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });

    // Advance with draws/recycle until a place_t appears (cap to be safe)
    for (let i = 0; i < 300 && !legalMoves(s).some(m => m.type === "place_t"); i++) {
      const opts = legalMoves(s);
      const draw = opts.find(m => m.type === "draw");
      const recycle = opts.find(m => m.type === "recycle");
      s = draw ? applyMove(s, draw) : recycle ? applyMove(s, recycle) : s;
    }

    const placeT = legalMoves(s).find(m => m.type === "place_t") as any;
    expect(placeT).toBeTruthy();

    const beforeWasteTop = s.waste[0];
    const toPile = placeT.toPile;
    const prevLen = s.tableau[toPile].length;
    const dstTop = s.tableau[toPile][prevLen - 1];

    const s2 = applyMove(s, placeT);
    expect(s2.waste.length).toBe(s.waste.length - 1);
    expect(s2.tableau[toPile].length).toBe(prevLen + 1);
    expect(s2.tableau[toPile][prevLen]).toBe(beforeWasteTop);

    // rule holds: alternating color and descending by 1 (or K on empty)
    if (dstTop !== undefined) {
      const okColor = (suit(beforeWasteTop) === "♦" || suit(beforeWasteTop) === "♥") !== (suit(dstTop) === "♦" || suit(dstTop) === "♥");
      expect(okColor).toBe(true);
      expect(rank(beforeWasteTop)).toBe(rank(dstTop) - 1);
    } else {
      expect(rank(beforeWasteTop)).toBe(13);
    }
  });
});

describe("moves: place waste → foundation (same suit, ascending)", () => {
  it("eventually finds a legal place_f and applies it correctly", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });

    // Advance with draw/recycle until a place_f appears (cap to be safe)
    for (let i = 0; i < 600 && !legalMoves(s).some(m => m.type === "place_f"); i++) {
      const opts = legalMoves(s);
      const pf = opts.find(m => m.type === "place_f");
      if (pf) break;
      const draw = opts.find(m => m.type === "draw");
      const recycle = opts.find(m => m.type === "recycle");
      s = draw ? applyMove(s, draw) : recycle ? applyMove(s, recycle) : s;
    }

    const placeF = legalMoves(s).find(m => m.type === "place_f")!;
    const card = s.waste[0];
    const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(card));
    const prevLen = s.foundations[suitIdx].length;

    const s2 = applyMove(s, placeF);
    expect(s2.waste.length).toBe(s.waste.length - 1);
    expect(s2.foundations[suitIdx].length).toBe(prevLen + 1);
    expect(s2.foundations[suitIdx][prevLen]).toBe(card);

    // rule holds: if empty then Ace; else next rank same suit
    if (prevLen === 0) {
      expect(rank(card)).toBe(1);
    } else {
      const topPrev = s.foundations[suitIdx][prevLen - 1];
      expect(rank(card)).toBe(rank(topPrev) + 1);
      expect(suit(card)).toBe(suit(topPrev));
    }
  });
});
