import { describe, it, expect } from "vitest";
import { init, summarize } from "../src/engine";

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
});
