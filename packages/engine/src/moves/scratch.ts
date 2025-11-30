// packages/engine/src/moves/scratch.ts
import { init, legalMoves, applyMove, summarize } from "../api";

const SEED =
  "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

let s = init({ seed: SEED, ruleset: "classic_v1" });

console.log("Initial:", summarize(s));

for (let step = 0; step < 50; step++) {
  const opts = legalMoves(s);

  // simple priority: foundation -> tableau -> draw -> recycle
  const m =
    opts.find((m) => m.type === "place_f") ??
    opts.find((m) => m.type === "place_t") ??
    opts.find((m) => m.type === "draw3") ??
    opts.find((m) => m.type === "recycle");

  if (!m) break;
  s = applyMove(s, m);
}

console.log("After 50 plies:", summarize(s));

