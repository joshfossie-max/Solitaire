// Stock draw (e.g., draw 3 from stock to waste) — no behavior change
import type { MoveSpec } from "./types";
import { applyMove } from "../moves";

export const STOCK_DRAW: MoveSpec<any> = {
  name: "draw3", // keep whatever your tests use ("draw3" in our suite)
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "draw3", ...(action as any) });
    return { state: next };
  },
};
