import { describe, expect, it } from "vitest";
import { init } from "../src/api";
import {
  dispatchMove,
  type DispatchMoveAction,
} from "../src/moves";

describe("dispatchMove", () => {
  it("dispatches every supported move action without throwing", () => {
    let state = init({
      seed: "test-seed",
      ruleset: "classic_v1",
    });

    state = dispatchMove(state, { type: "draw3" });
    state = dispatchMove(state, { type: "place_t", toPile: 0 });
    state = dispatchMove(state, { type: "recycle" });
    state = dispatchMove(state, { type: "place_f" });
    state = dispatchMove(state, { type: "move_tf", fromPile: 0 });
    state = dispatchMove(state, {
      type: "move_ft",
      fromPile: 0,
      toPile: 1,
    });
    state = dispatchMove(state, {
      type: "move_tt",
      fromPile: 0,
      fromIndex: 0,
      toPile: 1,
    });

    expect(state).toBeDefined();
  });

  it("throws for an unknown move type", () => {
    const state = init({
      seed: "test-seed",
      ruleset: "classic_v1",
    });
    const invalidAction = {
      type: "not-a-real-move",
    } as unknown as DispatchMoveAction;

    expect(() => dispatchMove(state, invalidAction)).toThrowError(
      /Unknown move/
    );
  });
});
