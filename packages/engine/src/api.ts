// Public entrypoint for consumers of the engine (no behavior change).
export { init } from "./engine";
export { legalMoves, applyMove } from "./moves";

export {
  dispatchMove,
  MOVES_LIST,
  isMoveType,
  type MoveType,
  type MoveAction,
} from "./public-moves";
