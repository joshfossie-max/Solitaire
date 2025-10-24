import type { EngineState } from "./engine";
import { rank, suit, isRed } from "./cards";
import { canPlaceOnTableau } from "./rules";
import { canPlaceOnFoundation } from "./rules";



// ── Move types
export type Move =
  | { type: "draw" }                                    // stock → waste
  | { type: "recycle" }                                 // waste → stock (when stock empty)
  | { type: "place_t"; from: "waste"; toPile: number }  // waste → tableau
  | { type: "place_f"; from: "waste" }                  // waste → foundation (its suit)
  | { type: "move_tt"; fromPile: number; fromIndex: number; toPile: number } // tableau → tableau
  | { type: "move_tf"; fromPile: number };              // tableau (top) → foundation

// ── Rules helpers
function isDescendingAlternating(seq: number[]): boolean {
  if (seq.length <= 1) return true;
  for (let i = 0; i < seq.length - 1; i++) {
    const a = seq[i], b = seq[i+1];
    const alt = (isRed(suit(a)) !== isRed(suit(b)));
    if (!alt) return false;
    if (rank(a) !== rank(b) + 1) return false;
  }
  return true;
}

// ── Enumerate legal moves
export function legalMoves(s: EngineState): Move[] {
  const moves: Move[] = [];
  // draw / recycle
  if (s.stock.length > 0) moves.push({ type: "draw" });
  if (s.stock.length === 0 && s.waste.length > 0) moves.push({ type: "recycle" });

  // place from waste
  const topWaste = s.waste[0];
  if (topWaste !== undefined) {
    for (let i = 0; i < s.tableau.length; i++) {
      const pile = s.tableau[i];
      const dstTop = pile[pile.length - 1];
      if (canPlaceOnTableau(dstTop, topWaste)) {
        moves.push({ type: "place_t", from: "waste", toPile: i });
      }
    }
    const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(topWaste));
    const fPile = s.foundations[suitIdx];
    const fTop = fPile[fPile.length - 1];
    if (canPlaceOnFoundation(fTop, topWaste)) {
      moves.push({ type: "place_f", from: "waste" });
    }
  }

  // tableau → tableau (move any valid descending/alternating tail)
  for (let i = 0; i < s.tableau.length; i++) {
    const src = s.tableau[i];
    for (let k = 0; k < src.length; k++) {
      const tail = src.slice(k);
      if (tail.length === 0) continue;
      if (!isDescendingAlternating(tail)) continue;
      for (let j = 0; j < s.tableau.length; j++) {
        if (j === i) continue;
        const dst = s.tableau[j];
        const dstTop = dst[dst.length - 1];
        // quick guard to avoid pushing obviously-illegal options
        if (dstTop !== undefined) {
          if (rank(tail[0]) !== rank(dstTop) - 1) continue;
        } else {
          if (rank(tail[0]) !== 13) continue; // only King to empty
        }
        if (canPlaceOnTableau(dstTop, tail[0])) {
          moves.push({ type: "move_tt", fromPile: i, fromIndex: k, toPile: j });
        }
      }
    }
  }

  // tableau (top) → foundation
  for (let i = 0; i < s.tableau.length; i++) {
    const src = s.tableau[i];
    if (src.length === 0) continue;
    const top = src[src.length - 1];
    const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(top));
    const fPile = s.foundations[suitIdx];
    const fTop = fPile[fPile.length - 1];
    if (canPlaceOnFoundation(fTop, top)) {
      moves.push({ type: "move_tf", fromPile: i });
    }
  }

  return moves;
}

// ── Apply move (pure; returns new state) + scoring
export function applyMove(s: EngineState, m: Move): EngineState {
  switch (m.type) {
    case "draw": {
      if (s.stock.length === 0) return s;
      const n = Math.min(s.drawCount ?? 1, s.stock.length);
      const drawn = s.stock.slice(0, n);
      const stock = s.stock.slice(n);
      const waste = [...drawn.reverse(), ...s.waste];
      return { ...s, stock, waste, tick: s.tick + 1 /* score += 0 */ };
    }
    case "recycle": {
      if (!(s.stock.length === 0 && s.waste.length > 0)) return s;
      const stock = s.waste.slice().reverse();
      const waste: number[] = [];
      return { ...s, stock, waste, tick: s.tick + 1, score: s.score - 20 };
    }
    case "place_t": {
      if (s.waste.length === 0) return s;
      const card = s.waste[0];
      const pile = s.tableau[m.toPile];
      const dstTop = pile[pile.length - 1];
      if (!canPlaceOnTableau(dstTop, card)) return s;

      const waste = s.waste.slice(1);
      const tableau = s.tableau.map((p, idx) => idx === m.toPile ? [...p, card] : p);
      return { ...s, waste, tableau, tick: s.tick + 1, score: s.score + 5 };
    }
    case "place_f": {
      if (s.waste.length === 0) return s;
      const card = s.waste[0];
      const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(card));
      const fPile = s.foundations[suitIdx];
      const fTop = fPile[fPile.length - 1];
      if (!canPlaceOnFoundation(fTop, card)) return s;

      const waste = s.waste.slice(1);
      const foundations = s.foundations.map((p, idx) => idx === suitIdx ? [...p, card] : p);
      return { ...s, waste, foundations, tick: s.tick + 1, score: s.score + 10 };
    }
    case "move_tt": {
      const { fromPile, fromIndex, toPile } = m;
      const src = s.tableau[fromPile];
      if (!src || fromIndex < 0 || fromIndex >= src.length) return s;
      const tail = src.slice(fromIndex);
      if (!isDescendingAlternating(tail)) return s;

      const dst = s.tableau[toPile];
      const dstTop = dst[dst.length - 1];
      if (!canPlaceOnTableau(dstTop, tail[0])) return s;

      const newSrc = src.slice(0, fromIndex);
      const newDst = [...dst, ...tail];
      const tableau = s.tableau.map((p, idx) =>
        idx === fromPile ? newSrc : idx === toPile ? newDst : p
      );
      return { ...s, tableau, tick: s.tick + 1 /* score += 0 */ };
    }
    case "move_tf": {
      const from = m.fromPile;
      const src = s.tableau[from];
      if (!src || src.length === 0) return s;
      const card = src[src.length - 1];
      const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(card));
      const fPile = s.foundations[suitIdx];
      const fTop = fPile[fPile.length - 1];
      if (!canPlaceOnFoundation(fTop, card)) return s;

      const tableau = s.tableau.map((p, idx) => idx === from ? p.slice(0, p.length - 1) : p);
      const foundations = s.foundations.map((p, idx) => idx === suitIdx ? [...p, card] : p);
      return { ...s, tableau, foundations, tick: s.tick + 1, score: s.score + 10 };
    }
  }
  return s;
}
// ---- MoveSpec wrapper (non-breaking) ----
// Expose a standard shape for the existing "place_t" move.
// Note: We are *not* changing how moves work; we're just wrapping it.

import type { MoveSpec } from "./moves/types";

export const TABLEAU_PLACE: MoveSpec<any> = {
  // Keep the engine's real move type string so nothing diverges.
  name: "place_t",
  apply: ({ state, action }) => {
    // Reuse the existing dispatcher for this single move type.
    // `action` should contain whatever fields your current "place_t" expects.
    const next = applyMove(state as any, { type: "place_t", ...(action as any) });
    return { state: next };
  }
};

// ---- MoveSpec wrapper: DRAW (your tests suggest a 'draw3' move)
export const STOCK_DRAW: MoveSpec<any> = {
  name: "draw3", // if your code uses 'draw' instead, change both
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "draw3", ...(action as any) });
    return { state: next };
  }
};

// ---- MoveSpec wrapper: RECYCLE (waste/stock recycle)
export const TABLEAU_RECYCLE: MoveSpec<any> = {
  name: "recycle",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "recycle", ...(action as any) });
    return { state: next };
  }
};
// ---- MoveSpec wrapper: FOUNDATION (place to foundation)
export const FOUNDATION_PLACE: MoveSpec<any> = {
  name: "place_f",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_f", ...(action as any) });
    return { state: next };
  }
};

// ---- Move registry (no behavior change) ----
export const MOVES: Record<string, MoveSpec<any>> = {
  // These names come from your existing engine move types
  // and the wrappers you already added above.
  [TABLEAU_PLACE.name]: TABLEAU_PLACE,     // "place_t"
  [FOUNDATION_PLACE.name]: FOUNDATION_PLACE, // "place_f"
  [STOCK_DRAW.name]: STOCK_DRAW,           // "draw3"
  [TABLEAU_RECYCLE.name]: TABLEAU_RECYCLE, // "recycle"
};

// ---- Optional thin dispatcher using MOVES (no behavior change to existing code)
export function dispatchMove(state: any, action: { type: string } & Record<string, unknown>) {
  const spec = MOVES[action.type];
  if (!spec) throw new Error(`Unknown move: ${action.type}`);
  // Pass the whole action object as the payload so existing fields work unchanged.
  const { state: next } = spec.apply({ state, action });
  return next;
}


