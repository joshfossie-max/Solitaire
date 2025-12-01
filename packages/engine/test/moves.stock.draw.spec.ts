import { describe, it, expect } from "vitest";
import { init } from "../src/api";
import { STOCK_DRAW } from "../src/moves/stock.draw";

describe("STOCK_DRAW", () => {
  it("applies a draw3 move and returns a result with state", () => {
    // Start a normal classic_v1 game.
    const state = init({ seed: "test-seed", ruleset: "classic_v1" });

    // Call the STOCK_DRAW wrapper. We don't need any extra action fields here.
    const result = STOCK_DRAW.apply({
      state,
      action: {} as any,
    });

    // Minimal sanity check: we got back an object with a state.
    expect(result).toBeDefined();
    expect(result.state).toBeDefined();
  });
});
