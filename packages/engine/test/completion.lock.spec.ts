import { describe, expect, it } from "vitest";
import { applyMove, init, legalMoves } from "../src/api";

describe("completed game locking", () => {
  it("offers no legal moves and rejects direct moves after completion", () => {
    const initial = init({
      seed: "completed-lock-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const completedState = {
      ...initial,
      stock: [],
      waste: [],
      tableau: [[], [], [], [], [], [], []],
      tableauFaceUp: [0, 0, 0, 0, 0, 0, 0],
      foundations: [
        Array.from({ length: 13 }, (_, index) => index),
        Array.from({ length: 13 }, (_, index) => index + 13),
        Array.from({ length: 13 }, (_, index) => index + 26),
        Array.from({ length: 13 }, (_, index) => index + 39),
      ],
    };

    expect(legalMoves(completedState)).toEqual([]);

    const afterAttemptedRetreat = applyMove(completedState, {
      type: "move_ft",
      fromPile: 3,
      toPile: 0,
    });

    expect(afterAttemptedRetreat).toBe(completedState);
    expect(afterAttemptedRetreat.foundations[3].length).toBe(13);
    expect(afterAttemptedRetreat.tableau[0]).toEqual([]);
    expect(afterAttemptedRetreat.score).toBe(completedState.score);
  });
});