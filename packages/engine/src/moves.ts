import type { EngineState } from "./engine";

export type Move =
  | { type: "draw" }; // move top of stock onto waste

export function legalMoves(s: EngineState): Move[] {
  const moves: Move[] = [];
  if (s.stock.length > 0) moves.push({ type: "draw" });
  return moves;
}

// Pure functional apply: returns a NEW state object
export function applyMove(s: EngineState, m: Move): EngineState {
  switch (m.type) {
    case "draw": {
      if (s.stock.length === 0) return s; // no-op
      const stock = s.stock.slice();
      const card = stock.shift()!;   // take top of stock (index 0)
      const waste = s.waste.slice();
      waste.unshift(card);           // put on top of waste
      return { ...s, stock, waste, tick: s.tick + 1 };
    }
  }
  // If we add more move types later, add cases above.
  return s;
}
