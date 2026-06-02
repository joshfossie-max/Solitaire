import { describe, it, expect } from "vitest";
import { init, summarize } from "../src/api";


describe("summarize()", () => {
  it("reports initial summary from a fresh game", () => {
    const s = init({
      seed: "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f",
      ruleset: "classic_v1",
    });
    const sum = summarize(s);
    expect(sum.completed).toBe(false);
    expect(sum.moves).toBe(0);
    expect(sum.undos).toBe(0);
    expect(sum.hints).toBe(0);
    expect(sum.score).toBe(0);
  });

  it("reports a completed game when all 52 cards are in foundations", () => {
    const s = init({
      seed: "completed-game-seed",
      ruleset: "classic_v1",
    });

    const completedState = {
      ...s,
      stock: [],
      waste: [],
      tableau: [[], [], [], [], [], [], []],
      tableauFaceUp: [0, 0, 0, 0, 0, 0, 0],
      foundations: [
        Array.from({ length: 13 }, (_, index) => index),
        Array.from({ length: 13 }, (_, index) => index + 13),
        Array.from({ length: 13 }, (_, index) => index + 26),
        Array.from({ length: 13 }, (_, index) => index + 39),
      ],
    };

    const sum = summarize(completedState);

    expect(sum.completed).toBe(true);
  });
});
