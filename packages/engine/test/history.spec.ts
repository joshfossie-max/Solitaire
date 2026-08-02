import { describe, expect, it } from "vitest";
import {
  cloneEngineState,
  dispatchMove,
  init,
  summarize,
  undoLastMove,
} from "../src/api";

describe("undo history", () => {
  it("records a successful dispatched move and restores the previous position", () => {
    const initial = init({
      seed: "undo-draw-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const afterDraw = dispatchMove(initial, { type: "draw3" });

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

    const afterRecycle = dispatchMove(recyclable, { type: "recycle" });

    expect(afterRecycle.score).toBe(-20);
    expect(afterRecycle.history.length).toBe(1);

    const restored = undoLastMove(afterRecycle);

    expect(restored.stock).toEqual(recyclable.stock);
    expect(restored.waste).toEqual(recyclable.waste);
    expect(restored.score).toBe(0);
    expect(restored.undos).toBe(1);
  });

  it("supports multiple sequential undos in reverse move order", () => {
    const initial = init({
      seed: "undo-multiple-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const afterFirstDraw = dispatchMove(initial, { type: "draw3" });
    const afterSecondDraw = dispatchMove(afterFirstDraw, { type: "draw3" });

    expect(afterSecondDraw.history.length).toBe(2);
    expect(afterSecondDraw.stock.length).toBe(initial.stock.length - 6);
    expect(afterSecondDraw.waste.length).toBe(initial.waste.length + 6);

    const afterFirstUndo = undoLastMove(afterSecondDraw);

    expect(afterFirstUndo.stock).toEqual(afterFirstDraw.stock);
    expect(afterFirstUndo.waste).toEqual(afterFirstDraw.waste);
    expect(afterFirstUndo.tick).toBe(afterFirstDraw.tick);
    expect(afterFirstUndo.history.length).toBe(1);
    expect(afterFirstUndo.undos).toBe(1);

    const afterSecondUndo = undoLastMove(afterFirstUndo);

    expect(afterSecondUndo.stock).toEqual(initial.stock);
    expect(afterSecondUndo.waste).toEqual(initial.waste);
    expect(afterSecondUndo.tableau).toEqual(initial.tableau);
    expect(afterSecondUndo.tableauFaceUp).toEqual(initial.tableauFaceUp);
    expect(afterSecondUndo.foundations).toEqual(initial.foundations);
    expect(afterSecondUndo.score).toBe(initial.score);
    expect(afterSecondUndo.tick).toBe(initial.tick);
    expect(afterSecondUndo.history.length).toBe(0);
    expect(afterSecondUndo.undos).toBe(2);
  });

  it("deep-clones a complete engine state and its undo history", () => {
    const initial = init({
      seed: "clone-engine-state-seed",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    const afterDraw = dispatchMove(initial, { type: "draw3" });
    const cloned = cloneEngineState(afterDraw);

    expect(cloned).toEqual(afterDraw);
    expect(cloned).not.toBe(afterDraw);

    expect(cloned.stock).not.toBe(afterDraw.stock);
    expect(cloned.waste).not.toBe(afterDraw.waste);
    expect(cloned.tableau).not.toBe(afterDraw.tableau);
    expect(cloned.tableau[0]).not.toBe(afterDraw.tableau[0]);
    expect(cloned.tableauFaceUp).not.toBe(afterDraw.tableauFaceUp);
    expect(cloned.foundations).not.toBe(afterDraw.foundations);
    expect(cloned.scoreBreakdown).not.toBe(afterDraw.scoreBreakdown);

    expect(cloned.history).not.toBe(afterDraw.history);
    expect(cloned.history[0]).not.toBe(afterDraw.history[0]);
    expect(cloned.history[0].stock).not.toBe(afterDraw.history[0].stock);
    expect(cloned.history[0].tableau).not.toBe(afterDraw.history[0].tableau);
    expect(cloned.history[0].scoreBreakdown).not.toBe(
      afterDraw.history[0].scoreBreakdown
    );

    cloned.stock.pop();
    cloned.tableau[0].pop();
    cloned.history[0].stock.pop();

    expect(cloned.stock).not.toEqual(afterDraw.stock);
    expect(cloned.tableau[0]).not.toEqual(afterDraw.tableau[0]);
    expect(cloned.history[0].stock).not.toEqual(afterDraw.history[0].stock);
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