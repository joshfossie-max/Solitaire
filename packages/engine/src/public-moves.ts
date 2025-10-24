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
export const MOVES: Record<string, MoveSpec<any>> = {
  [TABLEAU_PLACE.name]: TABLEAU_PLACE,
  [FOUNDATION_PLACE.name]: FOUNDATION_PLACE,
  [STOCK_DRAW.name]: STOCK_DRAW,
  [TABLEAU_RECYCLE.name]: TABLEAU_RECYCLE,
};

export function dispatchMove(state: any, action: { type: string } & Record<string, unknown>) {
  const spec = MOVES[action.type];
  if (!spec) throw new Error(`Unknown move: ${action.type}`);
  const { state: next } = spec.apply({ state, action });
  return next;
}
