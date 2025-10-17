import type { EngineState } from "./engine";
import { rank, suit, isRed } from "./cards";

// ── Move types
export type Move =
  | { type: "draw" }                                    // stock → waste (top)
  | { type: "recycle" }                                 // when stock empty: flip waste → stock
  | { type: "place_t"; from: "waste"; toPile: number }  // waste top → tableau pile
  | { type: "place_f"; from: "waste" };                 // waste top → foundation (its suit)

// ── Rules helpers
function canPlaceOnTableau(dstTop: number|undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) {
    // Empty tableau accepts only King
    return rC === 13;
  }
  const rD = rank(dstTop), sD = suit(dstTop);
  const alternating = isRed(sC) !== isRed(sD);
  return alternating && rC === (rD - 1);
}

function canPlaceOnFoundation(dstTop: number|undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) return rC === 1; // Ace starts foundation
  // Same suit, ascending by 1
  return suit(dstTop) === sC && rC === (rank(dstTop) + 1);
}

// ── Enumerate legal moves
export function legalMoves(s: EngineState): Move[] {
  const moves: Move[] = [];

  // draw / recycle
  if (s.stock.length > 0) moves.push({ type: "draw" });
  if (s.stock.length === 0 && s.waste.length > 0) moves.push({ type: "recycle" });

  // place from waste, if any
  const topWaste = s.waste[0];
  if (topWaste !== undefined) {
    // tableau targets
    for (let i = 0; i < s.tableau.length; i++) {
      const pile = s.tableau[i];
      const dstTop = pile[pile.length - 1];
      if (canPlaceOnTableau(dstTop, topWaste)) {
        moves.push({ type: "place_t", from: "waste", toPile: i });
      }
    }
    // foundation target (single suit pile)
    const suitIdx = ["♣","♦","♥","♠"].indexOf(suit(topWaste));
    const fPile = s.foundations[suitIdx];
    const fTop = fPile[fPile.length - 1];
    if (canPlaceOnFoundation(fTop, topWaste)) {
      moves.push({ type: "place_f", from: "waste" });
    }
  }

  return moves;
}

// ── Apply move (pure; returns new state)
export function applyMove(s: EngineState, m: Move): EngineState {
  switch (m.type) {
    case "draw": {
      if (s.stock.length === 0) return s;
      const stock = s.stock.slice();
      const card = stock.shift()!;
      const waste = s.waste.slice();
      waste.unshift(card);
      return { ...s, stock, waste, tick: s.tick + 1 };
    }
    case "recycle": {
      if (!(s.stock.length === 0 && s.waste.length > 0)) return s;
      const stock = s.waste.slice().reverse();
      const waste: number[] = [];
      return { ...s, stock, waste, tick: s.tick + 1 };
    }
    case "place_t": {
      if (s.waste.length === 0) return s;
      const card = s.waste[0];
      const pile = s.tableau[m.toPile];
      const dstTop = pile[pile.length - 1];
      if (!canPlaceOnTableau(dstTop, card)) return s;

      const waste = s.waste.slice(1); // remove top
      const tableau = s.tableau.map((p, idx) => idx === m.toPile ? [...p, card] : p);
      return { ...s, waste, tableau, tick: s.tick + 1 };
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
      return { ...s, waste, foundations, tick: s.tick + 1 };
    }
  }
  return s;
}
