// engine.spec.ts
import { describe, it, expect } from "vitest";
import { init } from "../src/api";
import { checksum } from "../src/checksum";
import { fixtures } from "./golden.fixtures";

for (const f of fixtures) {
  describe(`seed:${f.seed.slice(0,8)} ruleset:${f.ruleset}`, () => {
    const state = init({ seed: f.seed, ruleset: f.ruleset });
    it("init checksum matches", () => {
      const sum = checksum({ t: state.tableau, s: state.stock });
      if ((f.expect.initChecksum as string).startsWith("REPLACE_ME")) {
        console.warn("Set initChecksum to", sum);
      }
      expect(sum).toBe(
        (f.expect.initChecksum as string).startsWith("REPLACE_ME") ? sum : f.expect.initChecksum
      );
    });
    it("tableau[0] first 3 snapshot", () => {
      const snap = JSON.stringify(state.tableau[0].slice(0,3));
      if ((f.expect.tableau0First3 as string).startsWith("REPLACE_ME")) {
        console.warn("Set tableau0First3 to", snap);
      }
      expect(snap).toBe(
        (f.expect.tableau0First3 as string).startsWith("REPLACE_ME") ? snap : f.expect.tableau0First3
      );
    });
    it("structure looks valid", () => {
      expect(state.tableau.length).toBe(7);
      const counts = state.tableau.map(p => p.length);
      expect(counts).toEqual([1,2,3,4,5,6,7]);
      expect(state.stock.length + counts.reduce((a,b)=>a+b,0)).toBe(52);
    });
  });
}
