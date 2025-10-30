import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove } from "../src/api";
import { rank, suit } from "../src/cards"; // keep if the file already had it


const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("scoring basics", () => {
  it("draw does not change score; recycle penalizes", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1", drawCount: 3 });
    const s1 = applyMove(s, { type: "draw" });
    expect(s1.score).toBe(0);

    // Drain then recycle to trigger penalty
    let t = s1;
    while (t.stock.length > 0) t = applyMove(t, { type: "draw" });
    expect(legalMoves(t).some(m => m.type === "recycle")).toBe(true);
    const t2 = applyMove(t, { type: "recycle" });
    expect(t2.score).toBe(-20);
  });

  it("waste→tableau awards +5; tableau→foundation awards +10", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });

    // Advance with draws/recycle until a place_t appears, then apply it.
    for (let i = 0; i < 300 && !legalMoves(s).some(m => m.type === "place_t"); i++) {
      const opts = legalMoves(s);
      const d = opts.find(m => m.type === "draw");
      const r = opts.find(m => m.type === "recycle");
      s = d ? applyMove(s, d) : r ? applyMove(s, r) : s;
    }
    const mT = legalMoves(s).find(m => m.type === "place_t");
    expect(mT).toBeTruthy();
    const s2 = applyMove(s, mT as any);
    expect(s2.score).toBe(s.score + 5);

    // Now craft a guaranteed tableau→foundation move
    // Put Ace of clubs on foundation, 2 of clubs on top of a tableau pile
    const AC = 0;  // clubs suit 0, rank 1 -> id 0
    const TWO_C = 1; // clubs rank 2 -> id 1
    const s3 = {
      ...s2,
      tableau: [[TWO_C], [], [], [], [], [], []],
      foundations: [[AC], [], [], []],
      stock: [],
      waste: [],
    };

    const mF = legalMoves(s3).find(m => m.type === "move_tf");
    expect(mF).toBeTruthy();
    const s4 = applyMove(s3, mF as any);
    expect(s4.score).toBe(s3.score + 10);
  });

  it("tableau→tableau (rearranging) has 0 score change", () => {
    // Destination top: K♦; source tail: Q♣, J♦ (valid)
    let s = init({ seed: "ffffffffffffffffffffffffffffffff", ruleset: "classic_v1" });
    const KD = 1*13 + (13-1); // diamonds King
    const QC = 0*13 + (12-1);
    const JD = 1*13 + (11-1);

    s = {
      ...s,
      tableau: [[KD], [QC, JD], [], [], [], [], []],
      stock: [],
      waste: [],
      foundations: [[],[],[],[]],
    };

    const m = legalMoves(s).find(x => x.type === "move_tt" && (x as any).fromPile === 1 && (x as any).toPile === 0);
    expect(m).toBeTruthy();
    const s2 = applyMove(s, m as any);
    expect(s2.score).toBe(s.score); // no change
  });
});
