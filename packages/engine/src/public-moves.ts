// Public-facing move helpers for the UI.

import type { EngineState } from "./engine";
import {
  dispatchMove as internalDispatchMove,
  type DispatchMoveAction,
} from "./moves";

export const MOVES_LIST = [
  "draw3",
  "recycle",
  "place_t",
  "place_f",
  "move_tt",
  "move_tf",
  "move_ft",
] as const;

export type MoveType = (typeof MOVES_LIST)[number];

export function isMoveType(value: string): value is MoveType {
  return (MOVES_LIST as readonly string[]).includes(value);
}

export type MoveAction = DispatchMoveAction;

/** Thin, strongly typed wrapper over the internal engine dispatcher. */
export function dispatchMove(
  state: EngineState,
  action: MoveAction
): EngineState {
  return internalDispatchMove(state, action);
}
