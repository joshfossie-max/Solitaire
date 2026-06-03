import { describe, expect, it } from "vitest";
import { applyMove, dispatchMove, init, undoLastMove } from "../src/api";

const ID = (suitIndex: 0 | 1 | 2 | 3, rank: number) =>
  suitIndex * 13 + (rank - 1);

describe("score breakdown", () => {
  it("records points for waste to tableau", () => {
    const initial = init({
      seed: "score-waste-tableau",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [ID(0, 12)], // Q♣
      tableau: [[ID(1, 13)], [], [], [], [], [], []], // K♦
      tableauFaceUp: [1, 0, 0, 0, 0, 0, 0],
      foundations: [[], [], [], []],
    };

    const next = applyMove(state, {
      type: "place_t",
      from: "waste",
      toPile: 0,
    });

    expect(next.score).toBe(5);
    expect(next.scoreBreakdown.wasteToTableau).toBe(5);
  });

  it("records points for waste to foundation", () => {
    const initial = init({
      seed: "score-waste-foundation",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [ID(0, 1)], // A♣
      tableau: [[], [], [], [], [], [], []],
      tableauFaceUp: [0, 0, 0, 0, 0, 0, 0],
      foundations: [[], [], [], []],
    };

    const next = applyMove(state, {
      type: "place_f",
      from: "waste",
    });

    expect(next.score).toBe(10);
    expect(next.scoreBreakdown.wasteToFoundation).toBe(10);
  });

  it("records points for tableau to foundation", () => {
    const initial = init({
      seed: "score-tableau-foundation",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [],
      tableau: [[ID(0, 1)], [], [], [], [], [], []], // A♣
      tableauFaceUp: [1, 0, 0, 0, 0, 0, 0],
      foundations: [[], [], [], []],
    };

    const next = applyMove(state, {
      type: "move_tf",
      fromPile: 0,
    });

    expect(next.score).toBe(10);
    expect(next.scoreBreakdown.tableauToFoundation).toBe(10);
  });

  it("records penalties for foundation to tableau", () => {
    const initial = init({
      seed: "score-foundation-tableau",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [],
      tableau: [[ID(1, 2)], [], [], [], [], [], []], // 2♦
      tableauFaceUp: [1, 0, 0, 0, 0, 0, 0],
      foundations: [[ID(0, 1)], [], [], []], // A♣
    };

    const next = applyMove(state, {
      type: "move_ft",
      fromPile: 0,
      toPile: 0,
    });

    expect(next.score).toBe(-15);
    expect(next.scoreBreakdown.foundationToTableau).toBe(-15);
  });

  it("records penalties for recycling the waste pile", () => {
    const initial = init({
      seed: "score-recycle",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [ID(0, 1)],
      tableau: [[], [], [], [], [], [], []],
      tableauFaceUp: [0, 0, 0, 0, 0, 0, 0],
      foundations: [[], [], [], []],
    };

    const next = applyMove(state, { type: "recycle" });

    expect(next.score).toBe(-20);
    expect(next.scoreBreakdown.recycle).toBe(-20);
  });

  it("undo restores the score breakdown as well as the total score", () => {
    const initial = init({
      seed: "score-undo",
      ruleset: "classic_v1",
    });

    const state = {
      ...initial,
      stock: [],
      waste: [ID(0, 1)], // A♣
      tableau: [[], [], [], [], [], [], []],
      tableauFaceUp: [0, 0, 0, 0, 0, 0, 0],
      foundations: [[], [], [], []],
    };

    const afterFoundationMove = dispatchMove(state, {
      type: "place_f",
    } as any);

    expect(afterFoundationMove.score).toBe(10);
    expect(afterFoundationMove.scoreBreakdown.wasteToFoundation).toBe(10);

    const restored = undoLastMove(afterFoundationMove);

    expect(restored.score).toBe(0);
    expect(restored.scoreBreakdown).toEqual(initial.scoreBreakdown);
    expect(restored.undos).toBe(1);
  });
});