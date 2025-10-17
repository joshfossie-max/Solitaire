import type { EngineState } from "./engine";

export type Move =
  | { type: "draw" }           // take top of stock → top of waste
  | { type: "recycle" };       // when stock empty: flip waste → stock

export function legalMoves(s: EngineState): Move[] {
  const moves: Move[] = [];
  if (s.stock.length > 0) moves.push({ type: "draw" });
  if (s.stock.length === 0 && s.waste.length > 0) moves.push({ type: "recycle" });
  return moves;
}

// Pure functional apply: returns a NEW state object
export function applyMove(s: EngineState, m: Move): EngineState {
  switch (m.type) {
    case "draw": {
      if (s.stock.length === 0) return s; // no-op
      const stock = s.stock.slice();
      const card = stock.shift()!;   // top of stock is index 0
      const waste = s.waste.slice();
      waste.unshift(card);           // top of waste is index 0
      return { ...s, stock, waste, tick: s.tick + 1 };
    }
    case "recycle": {
      if (!(s.stock.length === 0 && s.waste.length > 0)) return s; // no-op if not allowed
      // Flip the waste back into stock so future draws come off in the original order.
      // Since we always unshift() onto waste, the "oldest" card is at the end.
      const stock = s.waste.slice().reverse(); // new stock top becomes the oldest waste card
      const waste: number[] = [];
      return { ...s, stock, waste, tick: s.tick + 1 };
    }
  }
  // If more move types are added later, add cases above.
  return s;
}
