// packages/engine/src/history.ts

export type UndoSnapshot = {
  tick: number;
  stock: number[];
  waste: number[];
  tableau: number[][];
  tableauFaceUp?: number[];
  foundations: number[][];
  score: number;
  scoreBreakdown: import("./engine").ScoreBreakdown;
};

export function snapshotOf(s: import("./engine").EngineState): UndoSnapshot {
  return {
    tick: s.tick,
    stock: s.stock.slice(),
    waste: s.waste.slice(),
    tableau: s.tableau.map((pile) => pile.slice()),
    tableauFaceUp: s.tableauFaceUp?.slice(),
    foundations: s.foundations.map((pile) => pile.slice()),
    score: s.score,
    scoreBreakdown: { ...s.scoreBreakdown },
  };
}

function cloneUndoSnapshot(snapshot: UndoSnapshot): UndoSnapshot {
  return {
    tick: snapshot.tick,
    stock: snapshot.stock.slice(),
    waste: snapshot.waste.slice(),
    tableau: snapshot.tableau.map((pile) => pile.slice()),
    tableauFaceUp: snapshot.tableauFaceUp?.slice(),
    foundations: snapshot.foundations.map((pile) => pile.slice()),
    score: snapshot.score,
    scoreBreakdown: { ...snapshot.scoreBreakdown },
  };
}

export function cloneEngineState(
  s: import("./engine").EngineState
): import("./engine").EngineState {
  return {
    ...s,
    stock: s.stock.slice(),
    waste: s.waste.slice(),
    tableau: s.tableau.map((pile) => pile.slice()),
    tableauFaceUp: s.tableauFaceUp?.slice(),
    foundations: s.foundations.map((pile) => pile.slice()),
    scoreBreakdown: { ...s.scoreBreakdown },
    history: s.history.map(cloneUndoSnapshot),
  };
}

export function undoLastMove(
  s: import("./engine").EngineState
): import("./engine").EngineState {
  const previous = s.history[s.history.length - 1];

  if (!previous) return s;

  return {
    ...s,
    tick: previous.tick,
    stock: previous.stock.slice(),
    waste: previous.waste.slice(),
    tableau: previous.tableau.map((pile) => pile.slice()),
    tableauFaceUp: previous.tableauFaceUp?.slice(),
    foundations: previous.foundations.map((pile) => pile.slice()),
    score: previous.score,
    scoreBreakdown: { ...previous.scoreBreakdown },
    history: s.history.slice(0, -1),
    undos: s.undos + 1,
  };
}