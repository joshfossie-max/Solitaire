// packages/engine/src/moves/tableau.recycle.ts
import type { MoveSpec } from "./types";
import { applyMove } from "../moves";

export const TABLEAU_RECYCLE: MoveSpec<any> = {
  name: "recycle",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "recycle", ...(action as any) });
    return { state: next };
  },
};
