import { useState } from "react";
import { init, summarize, dispatchMove, legalMoves } from "../../engine/src/api";
import { cardLabel } from "../../engine/src/cards";
import "./App.css";

type EngineState = any;
type MoveAction =
  | { type: "draw3";[key: string]: unknown }
  | { type: "recycle";[key: string]: unknown }
  | { type: "place_t"; toPile: number;[key: string]: unknown }
  | { type: "place_f";[key: string]: unknown };

function makeSeed(): string {
  return Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32);
}

function makeInitialState(seed: string): EngineState {
  return init({
    seed,
    ruleset: "classic_v1",
    drawCount: 3,
  });
}

export default function App() {
  // Engine state
  const [seed, setSeed] = useState<string>(() => makeSeed());
  const [state, setState] = useState<EngineState>(() => makeInitialState(seed));

  // UI-only counters
  const [uiMoves, setUiMoves] = useState(0);
  const [drawCount, setDrawCount] = useState(0);
  const [recycleCount, setRecycleCount] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Engine summary
  const summary = summarize(state);

  // --- Derived pile sizes (UI approximation, not engine-truth) ---

  // In classic_v1, the draw deck has 24 cards and Draw 3 pulls 3 at a time.


  const stockSize = state.stock.length;
  const wasteSize = state.waste.length;


  // --- Actions ---

  function doMove(action: MoveAction) {
    setState((s: EngineState) => {
      return dispatchMove(s as any, action as any) as EngineState;
    });

    setUiMoves((m) => m + 1);

    if (action.type === "draw3") {
      setDrawCount((n) => n + 1);
    } else if (action.type === "recycle") {
      setRecycleCount((n) => n + 1);
    }

    setLastAction(action.type);
  }
  function handleNewGame() {
    const newSeed = makeSeed();
    const fresh = makeInitialState(newSeed);

    setSeed(newSeed);
    setState(fresh);

    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
  }

  function handleResetStats() {
    // Only reset UI counters – leave the engine state alone
    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
  }
  const wasteTopCard =
    state.waste && state.waste.length > 0
      ? cardLabel(state.waste[0])
      : "(empty)";

  const visibleWasteCards =
    state.waste && state.waste.length > 0
      ? state.waste.slice(0, 3).map((card: number) => cardLabel(card)).join(", ")
      : "(empty)";

  const visibleWasteList =
    state.waste && state.waste.length > 0
      ? state.waste.slice(0, 3).map((card: number) => cardLabel(card))
      : [];

  const tableauSummary = state.tableau.map((pile: number[], index: number) => {
    const top = pile.length > 0 ? cardLabel(pile[pile.length - 1]) : "(empty)";
    return {
      index: index + 1,
      size: pile.length,
      top,
    };
  });

  const foundationSummary = state.foundations.map((pile: number[], index: number) => {
    const top = pile.length > 0 ? cardLabel(pile[pile.length - 1]) : "(empty)";
    return {
      index: index + 1,
      size: pile.length,
      top,
    };
  });

  const currentLegalMoves = legalMoves(state as any);

  const legalWasteTableauMoves = currentLegalMoves
    .filter((move: any) => move.type === "place_t")
    .map((move: any) => move.toPile + 1);

  function isLegalWasteTableauTarget(pileIndex1Based: number): boolean {
    return legalWasteTableauMoves.includes(pileIndex1Based);
  }

  const legalWasteFoundationMove = currentLegalMoves.some(
    (move: any) => move.type === "place_f"
  );

  const legalWasteFoundationLabel = (() => {
    if (!legalWasteFoundationMove) return "(none)";

    const topCard = state.waste && state.waste.length > 0 ? state.waste[0] : null;
    if (topCard == null) return "(none)";

    const topSuit = cardLabel(topCard).slice(-1);

    const matchingPileIndex = state.foundations.findIndex((pile: number[]) => {
      if (pile.length === 0) {
        return cardLabel(topCard).startsWith("A");
      }

      const pileTop = pile[pile.length - 1];
      return cardLabel(pileTop).slice(-1) === topSuit;
    });

    return matchingPileIndex >= 0 ? `F${matchingPileIndex + 1}` : "(none)";
  })();
  const isStockEmpty = stockSize === 0;
  const isWasteEmpty = wasteSize === 0;

  function formatTableauDepth(size: number): string {
    if (size <= 1) return "(top only)";
    return `${size - 1} below`;
  }

  function formatAction(action: string | null) {
    if (!action) return "(none yet)";

    switch (action) {
      case "draw3":
        return "Draw 3";
      case "recycle":
        return "Recycle";
      case "place_t":
        return "Place to tableau";
      case "place_f":
        return "Place to foundation";
      case "move_tt":
        return "Move tableau to tableau";
      case "move_tf":
        return "Move tableau to foundation";
      default:
        return action;
    }
  }
  return (
    <div className="app-root">
      <h1>Solitaire (Debug UI)</h1>

      <section className="app-stats">
        <div className="stats-card">
          <h2>Game</h2>
          <p>
            <strong>Completed:</strong> {summary.completed ? "Yes" : "No"}
          </p>
          <p title={seed}>
            <strong>Seed:</strong> {seed.slice(0, 12)}…
          </p>
          <p>
            <strong>Score:</strong> {summary.score}
          </p>
          <p>
            <strong>Engine moves:</strong> {summary.moves}
          </p>
          <p>
            <strong>Undos:</strong> {summary.undos}
          </p>
          <p>
            <strong>Hints:</strong> {summary.hints}
          </p>
        </div>

        <div className="stats-card">
          <h2>Actions</h2>
          <p>
            <strong>Actions taken:</strong> {uiMoves}
          </p>
          <p>
            <strong>Draw actions:</strong> {drawCount}
          </p>
          <p>
            <strong>Recycle actions:</strong> {recycleCount}
          </p>
          <p>
            <strong>Last action:</strong> {formatAction(lastAction)}
          </p>
        </div>

        <div className="stats-card">
          <h2>Deck</h2>

          <div className="deck-visuals">
            <div className="deck-pile">
              <div className="deck-pile-label">Stock</div>
              <div className="deck-card stock-card">{stockSize}</div>
            </div>

            <div className="deck-pile">
              <div className="deck-pile-label">Waste top</div>
              <div className="deck-card waste-card">{wasteTopCard}</div>
            </div>
          </div>

          <p>
            <strong>Stock cards:</strong> {stockSize}
          </p>
          <p>
            <strong>Waste cards:</strong> {wasteSize}
          </p>
          <div className="waste-visible-block">
            <div className="waste-visible-label">Waste visible</div>
            <div className="waste-visible-row">
              {visibleWasteList.length > 0 ? (
                visibleWasteList.map((card: string, index: number) => (
                  <div key={`${card}-${index}`} className="waste-mini-card">
                    {card}
                  </div>
                ))
              ) : (
                <div className="waste-visible-empty">(empty)</div>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="board-row">
        <section className="app-foundations">
          <h2>Foundations</h2>

          <div className="foundations-stack">
            {foundationSummary.map((pile: { index: number; size: number; top: string }) => (
              <div key={pile.index} className="foundation-row">
                <div className="foundation-label">F{pile.index}</div>
                <div className="foundation-card">
                  {pile.size === 0 ? "(empty)" : pile.top}
                </div>
                {pile.size > 0 && (
                  <div className="foundation-count">
                    {pile.size === 1 ? "1 card" : `${pile.size} cards`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="app-tableau">
          <h2>Tableau</h2>

          <div className="tableau-grid">
            {tableauSummary.map((pile: { index: number; size: number; top: string }) => {
              const isLegal = isLegalWasteTableauTarget(pile.index);

              return (
                <div key={pile.index} className="tableau-pile">
                  <div className="tableau-label">T{pile.index}</div>

                  <button
                    className="tableau-card"
                    onClick={() => doMove({ type: "place_t", toPile: pile.index - 1 })}
                    disabled={!isLegal}
                  >
                    {pile.top}
                  </button>

                  <div className="tableau-count">{formatTableauDepth(pile.size)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="bottom-row">
        <section className="app-legal-moves">
          <h2>Waste moves</h2>

          <p>
            <strong>To tableau:</strong>{" "}
            {legalWasteTableauMoves.length > 0
              ? legalWasteTableauMoves.map((n: number) => `T${n}`).join(", ")
              : "(none)"}
          </p>

          <p>
            <strong>To foundation:</strong> {legalWasteFoundationLabel}
          </p>

          <div className="app-controls">
            {legalWasteFoundationMove && (
              <button onClick={() => doMove({ type: "place_f" })}>
                Move to foundation
              </button>
            )}
          </div>
        </section>

        <section className="app-controls-panel">
          <h2>Controls</h2>

          <div className="app-controls">
            <button onClick={() => doMove({ type: "draw3" })} disabled={isStockEmpty}>
              Draw 3
            </button>
            <button onClick={() => doMove({ type: "recycle" })} disabled={isWasteEmpty}>
              Recycle
            </button>
          </div>

          <div className="app-controls">
            <button onClick={handleNewGame}>New Game</button>
            <button onClick={handleResetStats}>Reset counters</button>
          </div>
        </section>
      </div>
    </div>
  );
}
