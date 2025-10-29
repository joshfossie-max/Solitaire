import type { MoveSpec } from "./moves/types";
import { applyMove } from "./moves";

// ---- MoveSpec wrapper: TABLEAU place (waste → tableau) ----
export const TABLEAU_PLACE: MoveSpec<any> = {
  name: "place_t",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_t", ...(action as any) });
    return { state: next };
  }
};

// ---- MoveSpec wrapper: FOUNDATION place (to foundation) ----
export const FOUNDATION_PLACE: MoveSpec<any> = {
  name: "place_f",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_f", ...(action as any) });
    return { state: next };
  }
};

// ---- MoveSpec wrapper: DRAW (stock → waste) ----
export const STOCK_DRAW: MoveSpec<any> = {
  name: "draw3",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "draw3", ...(action as any) });
    return { state: next };
  }
};

// ---- MoveSpec wrapper: RECYCLE (waste/stock recycle) ----
export const TABLEAU_RECYCLE: MoveSpec<any> = {
  name: "recycle",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "recycle", ...(action as any) });
    return { state: next };
  }
};

// ---- Registry and optional dispatcher ----
export const MOVES = {
  [TABLEAU_PLACE.name]: TABLEAU_PLACE,
  [FOUNDATION_PLACE.name]: FOUNDATION_PLACE,
  [STOCK_DRAW.name]: STOCK_DRAW,
  [TABLEAU_RECYCLE.name]: TABLEAU_RECYCLE,
} as const;

export type MoveType = keyof typeof MOVES;

// ---- Convenience exports for UIs/tools (non-breaking) ----
export type MoveAction = { type: MoveType } & Record<string, unknown>;

export function isMoveType(t: string): t is MoveType {
  return Object.prototype.hasOwnProperty.call(MOVES, t);
}

export const MOVES_LIST = Object.keys(MOVES) as MoveType[];

// ---- Thin dispatcher (no behavior change) ----
export function dispatchMove(
  state: any,
  action: MoveAction
) {
  const spec = MOVES[action.type];
  const result = spec.apply({ state, action });
  return result.state as any;
}
