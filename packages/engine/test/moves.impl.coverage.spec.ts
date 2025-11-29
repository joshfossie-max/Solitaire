import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove, summarize } from "../src/api";

const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("moves impl smoke", () => {
  it("touches draw3, recycle, place_t, place_f when available", () => {
    let s = init({ seed: SEED, ruleset: "classic_v1" });

    // try to hit draw3 and recycle at least once
    for (let i = 0; i < 3; i++) {
      const opts = legalMoves(s);
      const draw = opts.find(m => m.type === "draw3");
      if (draw) s = applyMove(s, draw);
    }
    {
      const opts = legalMoves(s);
      const rec = opts.find(m => m.type === "recycle");
      if (rec) s = applyMove(s, rec);
    }

    // try to place to tableau (place_t) if any
    {
      const opts = legalMoves(s);
      const pt = opts.find(m => m.type === "place_t");
      if (pt) s = applyMove(s, pt);
    }

    // try to place to foundation (place_f) if any
    {
      const opts = legalMoves(s);
      const pf = opts.find(m => m.type === "place_f");
      if (pf) s = applyMove(s, pf);
    }

    // keep the test trivial; we only care that it ran
    expect(typeof summarize(s)).toBe("object");
  });
});
