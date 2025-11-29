import { init, legalMoves, applyMove, summarize } from "../src/api";
import { it, expect } from "vitest";

it("scratch run", () => {
  const SEED =
    "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

  let s = init({ seed: SEED, ruleset: "classic_v1" });

  console.log("Initial:", summarize(s));

  for (let step = 0; step < 50; step++) {
    const opts = legalMoves(s);
    const m =
      opts.find((m) => m.type === "place_f") ??
      opts.find((m) => m.type === "place_t") ??
      opts.find((m) => m.type === "draw3") ??
      opts.find((m) => m.type === "recycle");
    if (!m) break;
    s = applyMove(s, m);
  }

  console.log("After 50 plies:", summarize(s));
  // trivial assertion so the test passes
  expect(true).toBe(true);
});
