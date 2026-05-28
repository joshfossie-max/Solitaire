// Public entrypoint for consumers of the engine (no behavior change).

// Core engine APIs
export { init, summarize } from "./engine";
export { legalMoves, applyMove } from "./moves";

// Rules info (already used in some tests/tools)
export { Rules, type RuleId } from "./rules";
export * as rules from "./rules";
export { listRuleIds, getRuleMeta } from "./public-helpers";
export * as rulesFns from "./rules.functions";

// Public move helpers for the UI
export {
  MOVES_LIST,
  isMoveType,
  dispatchMove,
  type MoveType,
  type MoveAction,
} from "./public-moves";
