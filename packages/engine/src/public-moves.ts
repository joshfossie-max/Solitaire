// src/public-moves.ts
import { applyMove } from "./moves";
import type { MoveSpec } from "./moves/types";

// ---- Wrappers over existing move types (no behavior changes) ----
export const TABLEAU_PLACE: MoveSpec<any> = {
  name: "place_t",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_t", ...(action as any) });
    return { state: next };
  }
};

export const FOUNDATION_PLACE: MoveSpec<any> = {
  name: "place_f",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_f", ...(action as any) });
    return { state: next };
  }
};

export const STOCK_DRAW: MoveSpec<any> = {
  name: "draw3",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "draw3", ...(action as any) });
    return { state: next };
  }
};

export const TABLEAU_RECYCLE: MoveSpec<any> = {
  name: "recycle",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "recycle", ...(action as any) });
    return { state: next };
  }
};

// ---- Registry and optional dispatcher ----
// ---- Registry and optional dispatcher ----
export const MOVES = {
  [TABLEAU_PLACE.name]: TABLEAU_PLACE,
  [FOUNDATION_PLACE.name]: FOUNDATION_PLACE,
  [STOCK_DRAW.name]: STOCK_DRAW,
  [TABLEAU_RECYCLE.name]: TABLEAU_RECYCLE,
} as const;

export type MoveType = keyof typeof MOVES;

export function dispatchMove<S>(
  state: any,
  action: { type: MoveType } & Record<string, unknown>
) {
  const spec = MOVES[action.type]; // inferred MoveSpec<any>
  const result = spec.apply({ state, action });
  return result.state as S;
}

