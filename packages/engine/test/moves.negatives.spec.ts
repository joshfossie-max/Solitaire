import { describe, it, expect } from "vitest";
import { init, summarize } from "../src/api";
import { dispatchMove } from "../src/public-moves";

const SEED =
  "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("moves: negative/guard branches", () => {
  it("recycle on empty waste is a no-op", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });
    const before = summarize(s);
    s = dispatchMove(s, { type: "recycle" } as any);
    expect(summarize(s)).toEqual(before);
  });

  it("draw3 on empty stock is a no-op", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });

    // Drain the stock (call draw3 a bunch; once empty, further calls are the guard path)
    for (let i = 0; i < 40; i++) {
      s = dispatchMove(s, { type: "draw3" } as any);
    }

    const before = summarize(s);
    s = dispatchMove(s, { type: "draw3" } as any); // guard branch
    expect(summarize(s)).toEqual(before);
  });
});
