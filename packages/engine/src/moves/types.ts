// packages/engine/src/moves/types.ts
// TEMP: keep this super simple so nothing breaks right now.
// We'll replace 'any' with the real GameState import later.
type GameState = any;

export interface MoveInput<A = unknown> {
  state: Readonly<GameState>;
  action: A;
}

export interface MoveResult {
  state: GameState;
  scoreDelta?: number;
}

export type MoveHandler<A = unknown> = (i: MoveInput<A>) => MoveResult;

export interface MoveSpec<A = unknown> {
  name: string;                // e.g., "STOCK_DRAW"
  apply: MoveHandler<A>;       // pure function returning next state
  guards?: ((i: MoveInput<A>) => void)[]; // optional validators (throw on invalid)
}
