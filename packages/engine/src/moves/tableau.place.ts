// packages/engine/src/moves/tableau.place.ts
import type { MoveSpec } from "./types";
import { applyMove } from "../moves";

/** Waste → Tableau (alternating colors, descending; K on empty) */
export const TABLEAU_PLACE: MoveSpec<any> = {
  name: "place_t",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_t", ...(action as any) });
    return { state: next };
  }
};
