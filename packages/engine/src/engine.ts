import { dealClassic } from "./deal";

export type Seed = string; // 32 hex bytes preferred
export type RulesetId = "classic_v1";

export interface EngineConfig { seed: Seed; ruleset: RulesetId; drawCount?: 1 | 3 }

export interface ScoreBreakdown {
  wasteToTableau: number;
  wasteToFoundation: number;
  tableauToFoundation: number;
  foundationToTableau: number;
  recycle: number;
}

export interface EngineState {
  version: "1.0.0";
  ruleset: RulesetId;
  tick: number;
  stock: number[];
  waste: number[];
  tableau: number[][];
  tableauFaceUp?: number[];
  foundations: number[][];
  score: number; // integer only
  scoreBreakdown: ScoreBreakdown;
  history: import('./history').UndoSnapshot[];
  undos: number;
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
    tableauFaceUp: [1, 1, 1, 1, 1, 1, 1],
    foundations: deal.foundations,
    score: 0,
    scoreBreakdown: {
      wasteToTableau: 0,
      wasteToFoundation: 0,
      tableauToFoundation: 0,
      foundationToTableau: 0,
      recycle: 0,
    },
    history: [],
    undos: 0,
    drawCount: config.drawCount ?? 1, // default to 1-card draw
  };
}

// Stubs (to be filled next): legalMoves/applyMove/hint/undo; keep pure/integer.
export function summarize(s: EngineState) {
  const moves = s.tick;
  const undos = s.undos;
  const hints = 0; // placeholder until hint implemented
  const completed = s.foundations.reduce(
    (total, pile) => total + pile.length,
    0
  ) === 52;

  return { completed, moves, undos, hints, score: s.score };
}