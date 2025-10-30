import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove } from "../src/api";
import { rank, suit } from "../src/cards";


const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("draw-3: drawing three at a time updates stock/waste correctly", () => {
  it("draws min(3, remaining); last drawn ends up on top; recycle resets piles", () => {
    const s0 = init({ seed: SEED, ruleset: "classic_v1", drawCount: 3 });
    // Initial stock is 24 for Klondike layout
    expect(s0.stock.length).toBe(24);

    // Capture the first three cards as they will be drawn (front of stock)
    const [c0, c1, c2] = [s0.stock[0], s0.stock[1], s0.stock[2]];

    // One draw with drawCount=3
    const s1 = applyMove(s0, { type: "draw" });
    expect(s1.stock.length).toBe(21);
    expect(s1.waste.length).toBe(3);
    // Waste is top-at-index-0; last-drawn should be on top
    expect(s1.waste[0]).toBe(c2);
    expect(s1.waste[1]).toBe(c1);
    expect(s1.waste[2]).toBe(c0);

    // Drain stock deterministically with 7 more draws (8 * 3 = 24 total)
    let s = s1;
    for (let i = 0; i < 7; i++) {
      s = applyMove(s, { type: "draw" });
    }
    expect(s.stock.length).toBe(0);
    expect(s.waste.length).toBe(24);

    // Recycle is now legal; applying it should move all waste back to stock and clear waste
    const canRecycle = legalMoves(s).some(m => m.type === "recycle");
    expect(canRecycle).toBe(true);

    const s2 = applyMove(s, { type: "recycle" });
    expect(s2.stock.length).toBe(24);
    expect(s2.waste.length).toBe(0);
  });
});
