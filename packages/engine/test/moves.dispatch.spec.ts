import { describe, it, expect } from "vitest";
import { init } from "../src/api";
import { dispatchMove } from "../src/moves";

describe("dispatchMove", () => {
  it("dispatches the registered move specs without throwing", () => {
    // Start from a valid classic game state.
    let state: any = init({ seed: "test-seed", ruleset: "classic_v1" });

    // 1) draw3 -> uses the STOCK_DRAW wrapper.
    state = dispatchMove(state, { type: "draw3" } as any);

    // 2) place_t -> uses TABLEAU_PLACE.
    // Even if the move is a no-op (early return), it still covers the wrapper.
    state = dispatchMove(state, { type: "place_t", toPile: 0 } as any);

    // 3) recycle -> uses TABLEAU_RECYCLE.
    state = dispatchMove(state, { type: "recycle" } as any);

    // 4) place_f -> uses FOUNDATION_PLACE.
    state = dispatchMove(state, { type: "place_f" } as any);

    // 5) move_tf -> uses TABLEAU_TO_FOUNDATION.
    // A no-op is sufficient here because this test is covering dispatcher registration.
    state = dispatchMove(state, { type: "move_tf", fromPile: 0 } as any);

    // 6) move_tt -> uses TABLEAU_TO_TABLEAU.
    // A no-op is sufficient here because this test is covering dispatcher registration.
    state = dispatchMove(
      state,
      { type: "move_tt", fromPile: 0, fromIndex: 0, toPile: 1 } as any
    );

    // Minimal sanity: we still ended up with a defined state.
    expect(state).toBeDefined();
  });

  it("throws for an unknown move type", () => {
    const state: any = init({ seed: "test-seed", ruleset: "classic_v1" });

    expect(() =>
      dispatchMove(state, { type: "not-a-real-move" } as any),
    ).toThrowError(/Unknown move/);
  });
});
