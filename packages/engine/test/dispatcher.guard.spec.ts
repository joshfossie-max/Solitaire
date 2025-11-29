import { describe, it, expect } from "vitest";
import { init } from "../src/api";
import { dispatchMove } from "../src/public-moves";

const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("dispatcher guard", () => {
  it("throws on unknown move type", () => {
    const s = init({ seed: SEED, ruleset: "classic_v1" });
    expect(() => dispatchMove(s, { type: "not-a-move" } as any)).toThrow(/Unknown move/i);
  });
});
