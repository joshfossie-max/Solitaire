// packages/engine/src/history.ts
export type UndoSnapshot = {
  stock: number[];
  waste: number[];
  tableau: number[][];
  foundations: number[][];
  score: number;
};

export function snapshotOf(s: import('./engine').EngineState): UndoSnapshot {
  return {
    stock: s.stock.slice(),
    waste: s.waste.slice(),
    tableau: s.tableau.map(p => p.slice()),
    foundations: s.foundations.map(p => p.slice()),
    score: s.score,
  };
}
