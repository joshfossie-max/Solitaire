import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove } from "../src/api";
import { rank, suit } from "../src/cards"; // keep if the file already had it


describe("moves: draw from stock to waste", () => {
  const seed = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

  it("offers a draw when stock has cards", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });
    // initial stock should be 52 - (1+2+...+7) = 24
    expect(s0.stock.length).toBe(24);
    const moves = legalMoves(s0);
    expect(moves.some(m => m.type === "draw")).toBe(true);
  });

  it("draw applies and moves exactly one card", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });
    const s1 = applyMove(s0, { type: "draw" });
    expect(s1.tick).toBe(s0.tick + 1);
    expect(s1.stock.length).toBe(s0.stock.length - 1);
    expect(s1.waste.length).toBe(s0.waste.length + 1);
    // Top of waste becomes the card drawn from top of stock (index 0)
    expect(s1.waste[0]).toBe(s0.stock[0]);
    // Immutability check
    expect(s0.waste.length).toBe(0);
  });

  it("no-op if stock is empty", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });
    // Drain stock by drawing all cards
    let s = s0;
    for (let i = 0; i < s0.stock.length; i++) {
      s = applyMove(s, { type: "draw" });
    }
    expect(s.stock.length).toBe(0);
    const s2 = applyMove(s, { type: "draw" }); // should not change
    expect(s2.stock.length).toBe(0);
    expect(s2.waste.length).toBe(s.waste.length);
    expect(s2.tick).toBe(s.tick); // unchanged
  });
});
