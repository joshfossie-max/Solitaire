import type { EngineState } from "./engine";
import { rank, suit, isRed } from "./cards";
import { canPlaceOnTableau } from "./rules";
import { canPlaceOnFoundation } from "./rules";
import { snapshotOf } from "./history";



// ── Move types
export type Move =
  | { type: "draw" }                                    // stock → waste
  | { type: "recycle" }                                 // waste → stock (when stock empty)
  | { type: "place_t"; from: "waste"; toPile: number }  // waste → tableau
  | { type: "place_f"; from: "waste" }                  // waste → foundation (its suit)
  | { type: "move_tt"; fromPile: number; fromIndex: number; toPile: number } // tableau → tableau
  | { type: "move_tf"; fromPile: number }               // tableau (top) → foundation
  | { type: "move_ft"; fromPile: number; toPile: number }; // foundation (top) → tableau

// ── Rules helpers
function isDescendingAlternating(seq: number[]): boolean {
  if (seq.length <= 1) return true;
  for (let i = 0; i < seq.length - 1; i++) {
    const a = seq[i], b = seq[i + 1];
    const alt = (isRed(suit(a)) !== isRed(suit(b)));
    if (!alt) return false;
    if (rank(a) !== rank(b) + 1) return false;
  }
  return true;
}

function isCompletedGame(s: EngineState): boolean {
  return s.foundations.reduce(
    (total, pile) => total + pile.length,
    0
  ) === 52;
}

// ── Enumerate legal moves
export function legalMoves(s: EngineState): Move[] {
  if (isCompletedGame(s)) return [];

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
    const suitIdx = ["♣", "♦", "♥", "♠"].indexOf(suit(topWaste));
    const fPile = s.foundations[suitIdx];
    const fTop = fPile[fPile.length - 1];
    if (canPlaceOnFoundation(fTop, topWaste)) {
      moves.push({ type: "place_f", from: "waste" });
    }
  }

  // tableau → tableau (move only valid exposed descending/alternating tails)
  for (let i = 0; i < s.tableau.length; i++) {
    const src = s.tableau[i];
    const faceUpCount = s.tableauFaceUp?.[i] ?? Math.min(1, src.length);
    const firstVisibleIndex = Math.max(src.length - faceUpCount, 0);

    for (let k = firstVisibleIndex; k < src.length; k++) {
      const tail = src.slice(k);
      if (tail.length === 0) continue;
      if (!isDescendingAlternating(tail)) continue;

      for (let j = 0; j < s.tableau.length; j++) {
        if (j === i) continue;

        const dst = s.tableau[j];
        const dstTop = dst[dst.length - 1];

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
    const suitIdx = ["♣", "♦", "♥", "♠"].indexOf(suit(top));
    const fPile = s.foundations[suitIdx];
    const fTop = fPile[fPile.length - 1];
    if (canPlaceOnFoundation(fTop, top)) {
      moves.push({ type: "move_tf", fromPile: i });
    }
  }

  // foundation (top) → tableau
  for (let i = 0; i < s.foundations.length; i++) {
    const src = s.foundations[i];
    if (src.length === 0) continue;

    const top = src[src.length - 1];

    for (let j = 0; j < s.tableau.length; j++) {
      const dst = s.tableau[j];
      const dstTop = dst[dst.length - 1];

      if (canPlaceOnTableau(dstTop, top)) {
        moves.push({ type: "move_ft", fromPile: i, toPile: j });
      }
    }
  }


  return moves;
}

// ── Apply move (pure; returns new state) + scoring
export function applyMove(s: EngineState, m: Move): EngineState {
  if (isCompletedGame(s)) return s;

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
      return {
        ...s,
        stock,
        waste,
        tick: s.tick + 1,
        score: s.score - 20,
        scoreBreakdown: {
          ...s.scoreBreakdown,
          recycle: s.scoreBreakdown.recycle - 20,
        },
      };
    }
    case "place_t": {
      if (s.waste.length === 0) return s;
      const card = s.waste[0];
      const pile = s.tableau[m.toPile];
      const dstTop = pile[pile.length - 1];
      if (!canPlaceOnTableau(dstTop, card)) return s;

      const waste = s.waste.slice(1);
      const tableau = s.tableau.map((p, idx) => idx === m.toPile ? [...p, card] : p);

      const tableauFaceUp = s.tableauFaceUp
        ? s.tableauFaceUp.map((count, idx) =>
          idx === m.toPile ? count + 1 : count
        )
        : undefined;

      return {
        ...s,
        waste,
        tableau,
        ...(tableauFaceUp ? { tableauFaceUp } : {}),
        tick: s.tick + 1,
        score: s.score + 5,
        scoreBreakdown: {
          ...s.scoreBreakdown,
          wasteToTableau: s.scoreBreakdown.wasteToTableau + 5,
        }
      };
    }
    case "place_f": {
      if (s.waste.length === 0) return s;
      const card = s.waste[0];
      const suitIdx = ["♣", "♦", "♥", "♠"].indexOf(suit(card));
      const fPile = s.foundations[suitIdx];
      const fTop = fPile[fPile.length - 1];
      if (!canPlaceOnFoundation(fTop, card)) return s;

      const waste = s.waste.slice(1);
      const foundations = s.foundations.map((p, idx) => idx === suitIdx ? [...p, card] : p);
      return {
        ...s,
        waste,
        foundations,
        tick: s.tick + 1,
        score: s.score + 10,
        scoreBreakdown: {
          ...s.scoreBreakdown,
          wasteToFoundation: s.scoreBreakdown.wasteToFoundation + 10,
        },
      };
    }
    case "move_tt": {
      const { fromPile, fromIndex, toPile } = m;
      const src = s.tableau[fromPile];

      if (!src || fromIndex < 0 || fromIndex >= src.length) return s;

      const sourceFaceUpCount = s.tableauFaceUp?.[fromPile] ?? Math.min(1, src.length);
      const firstVisibleIndex = Math.max(src.length - sourceFaceUpCount, 0);

      if (fromIndex < firstVisibleIndex) return s;

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

      const tableauFaceUp = s.tableauFaceUp
        ? s.tableauFaceUp.map((count, idx) => {
          if (idx === fromPile) {
            if (newSrc.length === 0) return 0;

            const movedVisibleCards = tail.length;
            const remainingVisibleCards = count - movedVisibleCards;

            return Math.max(1, remainingVisibleCards);
          }

          if (idx === toPile) {
            return count + tail.length;
          }

          return count;
        })
        : undefined;

      return {
        ...s,
        tableau,
        ...(tableauFaceUp ? { tableauFaceUp } : {}),
        tick: s.tick + 1
      };
    }
    case "move_tf": {
      const from = m.fromPile;
      const src = s.tableau[from];
      if (!src || src.length === 0) return s;
      const card = src[src.length - 1];
      const suitIdx = ["♣", "♦", "♥", "♠"].indexOf(suit(card));
      const fPile = s.foundations[suitIdx];
      const fTop = fPile[fPile.length - 1];
      if (!canPlaceOnFoundation(fTop, card)) return s;

      const tableau = s.tableau.map((p, idx) => idx === from ? p.slice(0, p.length - 1) : p);
      const foundations = s.foundations.map((p, idx) => idx === suitIdx ? [...p, card] : p);

      const tableauFaceUp = s.tableauFaceUp
        ? s.tableauFaceUp.map((count, idx) => {
          if (idx !== from) return count;

          const remainingCards = src.length - 1;

          if (remainingCards === 0) return 0;

          return Math.max(1, count - 1);
        })
        : undefined;

      return {
        ...s,
        tableau,
        foundations,
        ...(tableauFaceUp ? { tableauFaceUp } : {}),
        tick: s.tick + 1,
        score: s.score + 10,
        scoreBreakdown: {
          ...s.scoreBreakdown,
          tableauToFoundation: s.scoreBreakdown.tableauToFoundation + 10,
        }
      };
    }
    case "move_ft": {
      const { fromPile, toPile } = m;
      const src = s.foundations[fromPile];
      const dst = s.tableau[toPile];

      if (!src || src.length === 0 || !dst) return s;

      const card = src[src.length - 1];
      const dstTop = dst[dst.length - 1];

      if (!canPlaceOnTableau(dstTop, card)) return s;

      const foundations = s.foundations.map((pile, idx) =>
        idx === fromPile ? pile.slice(0, pile.length - 1) : pile
      );

      const tableau = s.tableau.map((pile, idx) =>
        idx === toPile ? [...pile, card] : pile
      );

      const tableauFaceUp = s.tableauFaceUp
        ? s.tableauFaceUp.map((count, idx) =>
          idx === toPile ? count + 1 : count
        )
        : undefined;

      return {
        ...s,
        tableau,
        foundations,
        ...(tableauFaceUp ? { tableauFaceUp } : {}),
        tick: s.tick + 1,
        score: s.score - 15,
        scoreBreakdown: {
          ...s.scoreBreakdown,
          foundationToTableau: s.scoreBreakdown.foundationToTableau - 15,
        }
      };
    }
  }
  return s;
}
export type DispatchMoveAction =
  | { type: "draw3" }
  | { type: "recycle" }
  | { type: "place_t"; toPile: number }
  | { type: "place_f" }
  | { type: "move_tf"; fromPile: number }
  | { type: "move_ft"; fromPile: number; toPile: number }
  | {
    type: "move_tt";
    fromPile: number;
    fromIndex: number;
    toPile: number;
  };

function toEngineMove(action: DispatchMoveAction): Move {
  switch (action.type) {
    case "draw3":
      return { type: "draw" };

    case "recycle":
      return { type: "recycle" };

    case "place_t":
      return {
        type: "place_t",
        from: "waste",
        toPile: action.toPile,
      };

    case "place_f":
      return {
        type: "place_f",
        from: "waste",
      };

    case "move_tf":
      return {
        type: "move_tf",
        fromPile: action.fromPile,
      };

    case "move_ft":
      return {
        type: "move_ft",
        fromPile: action.fromPile,
        toPile: action.toPile,
      };

    case "move_tt":
      return {
        type: "move_tt",
        fromPile: action.fromPile,
        fromIndex: action.fromIndex,
        toPile: action.toPile,
      };

    default: {
      const unsupportedAction = action as unknown as { type?: unknown };
      throw new Error(`Unknown move: ${String(unsupportedAction.type)}`);
    }
  }
}

export function dispatchMove(
  state: EngineState,
  action: DispatchMoveAction
): EngineState {
  const next = applyMove(state, toEngineMove(action));

  // Invalid moves return the original state, so they should not create undo history.
  if (next === state) return state;

  return {
    ...next,
    history: [...state.history, snapshotOf(state)],
  };
}


