// engine.ts
import { dealClassic } from "./deal";
export type Seed = string;
export type RulesetId = "classic_v1";
export interface EngineConfig { seed: Seed; ruleset: RulesetId }
export interface EngineState {
  version: "1.0.0"; ruleset: RulesetId; tick: number;
  stock: number[]; waste: number[]; tableau: number[][];
  foundations: number[][]; score: number;
}
export function init(config: EngineConfig): EngineState {
  const deal = dealClassic(config.seed);
  return {
    version: "1.0.0", ruleset: config.ruleset, tick: 0,
    stock: deal.stock, waste: deal.waste, tableau: deal.tableau,
    foundations: deal.foundations, score: 0
  };
}
export function summarize(s: EngineState) {
  const moves = s.tick, undos = 0, hints = 0;
  return { completed: false, moves, undos, hints, score: s.score };
}
