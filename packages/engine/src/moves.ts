import type { EngineState } from "./engine";
import { rank, suit, isRed } from "./cards";

// ── Move types
export type Move =
  | { type: "draw" }                                    // stock → waste
  | { type: "recycle" }                                 // waste → stock (when stock empty)
  | { type: "place_t"; from: "waste"; toPile: number }  // waste → tableau
  | { type: "place_f"; from: "waste" }                  // waste → foundation (its suit)
  | { type: "move_tt"; fromPile: number; fromIndex: number; toPile: number } // tableau → tableau
  | { type: "move_tf"; fromPile: number };              // tableau (top) → foundation

// ── Rules helpers
function canPlaceOnTableau(dstTop: number|undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) return rC === 13; // empty accepts King
  const rD = rank(dstTop), sD = suit(dstTop);
  const alternating = isRed(sC) !== isRed(sD);
  return alternating && rC === (rD - 1);
}

function canPlaceOnFoundation(dstTop: number|undefined, card: number): boolean {
  const rC = rank(card), sC = suit(card);
  if (dstTop === undefined) return rC === 1; // Ace starts
  return suit(dstTop) === sC && rC === (rank(dstTop) + 1);
}

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
        // quick rank/empty guard (mirrors canPlaceOnTableau)
        if (dstTop !== undefined) {
          if (rank(tail[0]) !== rank(dstTop) - 1) continue;
        } else {
          if (rank(tail[0]) !== 13) continue;
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

// ── Apply move (pure; returns new state)
export function applyMove(s: EngineState, m: Move): EngineState {
  switch (m.type) {
    case "draw": {
      if (s.stock.length === 0) return s;
      const n = Math.min(s.drawCount ?? 1, s.stock.length);
      const drawn = s.stock.slice(0, n);
      const stock = s.stock.slice(n);
      const waste = [...drawn.reverse(), ...s.waste];
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

      const waste = s.waste.slice(1);
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
      return { ...s, tableau, tick: s.tick + 1 };
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
      return { ...s, tableau, foundations, tick: s.tick + 1 };
    }
  }
  return s;
}
