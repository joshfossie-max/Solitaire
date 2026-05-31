// Public-facing move helpers for the UI.

import { dispatchMove as internalDispatchMove } from "./moves";

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

// Simple external "action" shape: type + extra fields
export type MoveAction = { type: MoveType } & Record<string, unknown>;

/**
 * Thin wrapper over the internal engine dispatcher.
 * Types are intentionally loose for now to keep life simple.
 */
export function dispatchMove<S>(state: S, action: MoveAction): S {
  return internalDispatchMove(state as any, action as any) as S;
}
