import { dealClassic } from "./deal";

export type Seed = string; // 32 hex bytes preferred
export type RulesetId = "classic_v1";

export interface EngineConfig { seed: Seed; ruleset: RulesetId; drawCount?: 1 | 3 }
export interface EngineState {
  version: "1.0.0";
  ruleset: RulesetId;
  tick: number;
  stock: number[];
  waste: number[];
  tableau: number[][];
  foundations: number[][];
  score: number; // integer only
  drawCount: 1 | 3; // NEW: 1-card (default) or 3-card draw
}

export function init(config: EngineConfig): EngineState {
  const deal = dealClassic(config.seed);
  return {
    version: "1.0.0",
    ruleset: config.ruleset,
    tick: 0,
    stock: deal.stock,
    waste: deal.waste,
    tableau: deal.tableau,
    foundations: deal.foundations,
    score: 0,
    drawCount: config.drawCount ?? 1, // default to 1-card draw
  };
}

// Stubs (to be filled next): legalMoves/applyMove/hint/undo; keep pure/integer.
export function summarize(s: EngineState) {
  const moves = s.tick;
  const undos = 0; // placeholder until undo implemented
  const hints = 0; // placeholder until hint implemented
  return { completed: false, moves, undos, hints, score: s.score };
}
