import { describe, expect, it } from "vitest";
import { dispatchMove, init, summarize, undoLastMove } from "../src/api";

describe("undo history", () => {
  it("records a successful dispatched move and restores the previous position", () => {
    const initial = init({
      seed: "undo-draw-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const afterDraw = dispatchMove(initial as any, { type: "draw3" } as any);

    expect(afterDraw.history.length).toBe(1);
    expect(afterDraw.stock.length).toBe(initial.stock.length - 3);
    expect(afterDraw.waste.length).toBe(initial.waste.length + 3);
    expect(afterDraw.tick).toBe(initial.tick + 1);

    const restored = undoLastMove(afterDraw);

    expect(restored.stock).toEqual(initial.stock);
    expect(restored.waste).toEqual(initial.waste);
    expect(restored.tableau).toEqual(initial.tableau);
    expect(restored.tableauFaceUp).toEqual(initial.tableauFaceUp);
    expect(restored.foundations).toEqual(initial.foundations);
    expect(restored.score).toBe(initial.score);
    expect(restored.tick).toBe(initial.tick);
    expect(restored.history.length).toBe(0);
    expect(restored.undos).toBe(1);
    expect(summarize(restored).undos).toBe(1);
  });

  it("restores score after undoing a scored move", () => {
    const initial = init({
      seed: "undo-score-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const recyclable = {
      ...initial,
      stock: [],
      waste: initial.stock.slice(),
    };

    const afterRecycle = dispatchMove(recyclable as any, { type: "recycle" } as any);

    expect(afterRecycle.score).toBe(-20);
    expect(afterRecycle.history.length).toBe(1);

    const restored = undoLastMove(afterRecycle);

    expect(restored.stock).toEqual(recyclable.stock);
    expect(restored.waste).toEqual(recyclable.waste);
    expect(restored.score).toBe(0);
    expect(restored.undos).toBe(1);
  });

  it("does nothing when no move is available to undo", () => {
    const initial = init({
      seed: "undo-empty-history-seed",
      ruleset: "classic_v1",
    });

    const restored = undoLastMove(initial);

    expect(restored).toBe(initial);
    expect(restored.undos).toBe(0);
  });
});