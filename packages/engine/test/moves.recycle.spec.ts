import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove, rank, suit } from "../src/api";



describe("moves: recycle waste → stock", () => {
  const seed = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

  it("offers recycle only when stock empty and waste non-empty", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });
    // Initially: stock has cards, so no recycle yet
    expect(s0.stock.length).toBeGreaterThan(0);
    expect(legalMoves(s0).some(m => m.type === "recycle")).toBe(false);

    // Draw all stock to waste
    let s = s0;
    while (s.stock.length > 0) {
      s = applyMove(s, { type: "draw" });
    }
    expect(s.stock.length).toBe(0);
    expect(s.waste.length).toBeGreaterThan(0);
    expect(legalMoves(s).some(m => m.type === "recycle")).toBe(true);
  });

  it("recycle flips waste into stock and clears waste", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });

    // Drain stock with draws
    let s = s0;
    const wasteBefore: number[] = [];
    while (s.stock.length > 0) {
      // record final waste order right before recycle
      // (we just need the snapshot after fully draining)
      s = applyMove(s, { type: "draw" });
    }
    // Capture the waste pile before recycling
    wasteBefore.push(...s.waste);

    // Apply recycle
    const s1 = applyMove(s, { type: "recycle" });
    expect(s1.tick).toBe(s.tick + 1);
    expect(s1.waste.length).toBe(0);
    expect(s1.stock.length).toBe(wasteBefore.length);

    // The new stock top (index 0) should be the oldest card from waste,
    // which lives at the END of wasteBefore because we always unshift on draw.
    expect(s1.stock[0]).toBe(wasteBefore[wasteBefore.length - 1]);
  });

  it("no-op recycle if conditions not met", () => {
    const s0 = init({ seed, ruleset: "classic_v1" });
    // stock is not empty yet
    const s1 = applyMove(s0, { type: "recycle" });
    expect(s1.stock.length).toBe(s0.stock.length);
    expect(s1.waste.length).toBe(s0.waste.length);
    expect(s1.tick).toBe(s0.tick);
  });
});
