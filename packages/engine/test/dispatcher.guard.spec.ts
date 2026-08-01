import { describe, it, expect } from "vitest";
import { init } from "../src/api";
import {
  dispatchMove,
  type MoveAction,
} from "../src/public-moves";

const SEED = "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";

describe("dispatcher guard", () => {
  it("throws on unknown move type", () => {
    const s = init({ seed: SEED, ruleset: "classic_v1" });
    const invalidAction = {
      type: "not-a-move",
    } as unknown as MoveAction;

    expect(() => dispatchMove(s, invalidAction)).toThrow(/Unknown move/i);
  });
});
