// packages/engine/src/moves/foundation.place.ts
import type { MoveSpec } from "../moves/types";
import { applyMove } from "../moves";

/** Place from waste to foundation (ascending, same suit) */
export const FOUNDATION_PLACE: MoveSpec<any> = {
  name: "place_f",
  apply: ({ state, action }) => {
    const next = applyMove(state as any, { type: "place_f", ...(action as any) });
    return { state: next };
  }
};
