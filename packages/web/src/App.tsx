import { useState } from "react";
import { init, summarize, dispatchMove, legalMoves } from "../../engine/src/api";
import { cardLabel } from "../../engine/src/cards";
import "./App.css";

type EngineState = any;
type MoveAction =
  | { type: "draw3";[key: string]: unknown }
  | { type: "recycle";[key: string]: unknown }
  | { type: "place_t"; toPile: number;[key: string]: unknown }
  | { type: "place_f";[key: string]: unknown }
  | { type: "move_tf"; fromPile: number;[key: string]: unknown }
  | {
    type: "move_tt";
    fromPile: number;
    fromIndex: number;
    toPile: number;
    [key: string]: unknown;
  };

type SelectedTableauSource = {
  fromPile: number;
  fromIndex: number;
} | null;

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
  const [selectedTableauSource, setSelectedTableauSource] =
    useState<SelectedTableauSource>(null);
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
    setSelectedTableauSource(null);
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
    setSelectedTableauSource(null);
  }

  function handleResetStats() {
    // Only reset UI counters – leave the engine state alone
    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
    setSelectedTableauSource(null);
  }

  const visibleWasteList =
    state.waste && state.waste.length > 0
      ? state.waste.slice(0, 3).map((card: number) => cardLabel(card))
      : [];

  const tableauSummary = state.tableau.map((pile: number[], index: number) => {
    const faceUpCount = state.tableauFaceUp?.[index] ?? Math.min(1, pile.length);
    const hiddenCount = Math.max(pile.length - faceUpCount, 0);
    const visibleCards = pile
      .slice(hiddenCount)
      .map((card: number) => cardLabel(card));

    return {
      index: index + 1,
      size: pile.length,
      top: visibleCards[visibleCards.length - 1] ?? "(empty)",
      faceUpCount,
      hiddenCount,
      visibleCards,
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

  const legalTableauFoundationMoves = currentLegalMoves
    .filter((move: any) => move.type === "move_tf")
    .map((move: any) => move.fromPile + 1);

  function isLegalTableauFoundationSource(pileIndex1Based: number): boolean {
    return legalTableauFoundationMoves.includes(pileIndex1Based);
  }

  const legalTableauTableauMoves = currentLegalMoves.filter(
    (move: any) => move.type === "move_tt"
  );
  const selectedTableauDestinationPiles = selectedTableauSource
    ? legalTableauTableauMoves
      .filter(
        (move: any) =>
          move.fromPile === selectedTableauSource.fromPile &&
          move.fromIndex === selectedTableauSource.fromIndex
      )
      .map((move: any) => move.toPile)
    : [];
  function hasLegalTableauSource(fromPile: number, fromIndex: number): boolean {
    return legalTableauTableauMoves.some(
      (move: any) =>
        move.fromPile === fromPile &&
        move.fromIndex === fromIndex
    );
  }

  function isSelectedTableauSource(fromPile: number, fromIndex: number): boolean {
    return (
      selectedTableauSource?.fromPile === fromPile &&
      selectedTableauSource?.fromIndex === fromIndex
    );
  }
  function toggleSelectedTableauSource(fromPile: number, fromIndex: number) {
    setSelectedTableauSource((selected) =>
      selected?.fromPile === fromPile && selected?.fromIndex === fromIndex
        ? null
        : { fromPile, fromIndex }
    );
  }
  const foundationSuitOrder = ["♣", "♦", "♥", "♠"];

  const legalWasteFoundationMove = currentLegalMoves.some(
    (move: any) => move.type === "place_f"
  );

  const legalWasteFoundationPileIndex = (() => {
    if (!legalWasteFoundationMove) return -1;

    const topCard = state.waste && state.waste.length > 0 ? state.waste[0] : null;
    if (topCard == null) return -1;

    const topSuit = cardLabel(topCard).slice(-1);
    return foundationSuitOrder.indexOf(topSuit);
  })();

  const legalWasteFoundationLabel =
    legalWasteFoundationPileIndex >= 0
      ? `F${legalWasteFoundationPileIndex + 1}`
      : "(none)";

  const selectedTableauFoundationPileIndex = (() => {
    if (!selectedTableauSource) return -1;

    const sourcePile = state.tableau[selectedTableauSource.fromPile];
    if (!sourcePile || sourcePile.length === 0) return -1;

    const topIndex = sourcePile.length - 1;
    if (selectedTableauSource.fromIndex !== topIndex) return -1;

    const canSelectedCardMoveToFoundation = currentLegalMoves.some(
      (move: any) =>
        move.type === "move_tf" &&
        move.fromPile === selectedTableauSource.fromPile
    );

    if (!canSelectedCardMoveToFoundation) return -1;

    const selectedCard = sourcePile[topIndex];
    const selectedSuit = cardLabel(selectedCard).slice(-1);

    return foundationSuitOrder.indexOf(selectedSuit);
  })();
  const isStockEmpty = stockSize === 0;
  const isWasteEmpty = wasteSize === 0;

  function cardColorClass(label: string): string {
    const suit = label.slice(-1);
    return suit === "♥" || suit === "♦" ? "card-red" : "card-black";
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
      <h1>Solitaire Prototype</h1>

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
      </section>
      <div className="game-board">
        <div className="board-upper-row">
          <section className="app-board-deck">
            <h2>Deck</h2>

            <div className="board-deck-stack">
              <div className="board-deck-pile">
                <div className="board-deck-label">Stock</div>
                <div className={stockSize > 0 ? "deck-card stock-card deck-live" : "deck-card stock-card deck-empty"}>
                  {stockSize}
                </div>
              </div>
              <div className="board-deck-pile">
                <div className="board-deck-label">Waste</div>

                {visibleWasteList.length > 0 ? (
                  <div className="waste-fan">
                    {[...visibleWasteList].reverse().map((card: string, index: number) => (
                      <div
                        key={`${card}-${index}`}
                        className={`deck-card waste-card waste-fan-card ${cardColorClass(card)}`}
                        style={{ left: `${index * 30}px`, zIndex: index + 1 }}
                      >
                        {card}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="deck-card waste-card deck-empty">(empty)</div>
                )}
              </div>
            </div>


          </section>

          <section className="app-foundations">
            <h2>Foundations</h2>

            <div className="foundations-stack">
              {foundationSummary.map((pile: { index: number; size: number; top: string }) => {
                const isLegalWasteFoundationDestination =
                  !selectedTableauSource &&
                  legalWasteFoundationPileIndex === pile.index - 1;

                const isSelectedTableauFoundationDestination =
                  selectedTableauSource !== null &&
                  selectedTableauFoundationPileIndex === pile.index - 1;

                const isFoundationBoardDestination =
                  isLegalWasteFoundationDestination ||
                  isSelectedTableauFoundationDestination;

                return (
                  <div key={pile.index} className="foundation-row">
                    <div className="foundation-label">F{pile.index}</div>
                    <button
                      type="button"
                      className={`foundation-card ${pile.size === 0 ? "" : cardColorClass(pile.top)} ${isFoundationBoardDestination ? "foundation-waste-destination" : ""
                        }`}
                      onClick={() => {
                        if (isSelectedTableauFoundationDestination && selectedTableauSource) {
                          doMove({
                            type: "move_tf",
                            fromPile: selectedTableauSource.fromPile,
                          });
                        } else if (isLegalWasteFoundationDestination) {
                          doMove({ type: "place_f" });
                        }
                      }}
                      disabled={!isFoundationBoardDestination}
                    >
                      {pile.size === 0 ? "(empty)" : pile.top}
                    </button>
                    {pile.size > 0 && (
                      <div className="foundation-count">
                        {pile.size === 1 ? "1 card" : `${pile.size} cards`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="app-tableau">
          <h2>Tableau</h2>

          <div className="tableau-grid">
            {tableauSummary.map((pile: {
              index: number;
              size: number;
              top: string;
              faceUpCount: number;
              hiddenCount: number;
              visibleCards: string[];
            }) => {
              const isLegalWasteDestination = isLegalWasteTableauTarget(pile.index);
              const isLegal = !selectedTableauSource && isLegalWasteDestination;
              const canMoveToFoundation = isLegalTableauFoundationSource(pile.index);
              const isSelectedTableauDestination =
                selectedTableauDestinationPiles.includes(pile.index - 1);

              const topFromPile = pile.index - 1;
              const topFromIndex = pile.size - 1;
              const canSelectTopSource =
                pile.size > 0 &&
                (
                  hasLegalTableauSource(topFromPile, topFromIndex) ||
                  canMoveToFoundation
                );
              const isSelectedTopSource =
                pile.size > 0 && isSelectedTableauSource(topFromPile, topFromIndex);
              const canClickTopAsSource =
                !selectedTableauSource &&
                !isLegalWasteDestination &&
                canSelectTopSource;
              const hiddenCardOffset = 15;
              const visibleCardOffset = 24;
              const stackHeight =
                pile.hiddenCount * hiddenCardOffset +
                Math.max(pile.visibleCards.length - 1, 0) * visibleCardOffset +
                122;

              return (
                <div key={pile.index} className="tableau-pile">
                  <div className="tableau-label">T{pile.index}</div>

                  <div className="tableau-stack" style={{ minHeight: `${stackHeight}px` }}>
                    {Array.from({ length: pile.hiddenCount }).map((_, index) => (
                      <div
                        key={`hidden-${pile.index}-${index}`}
                        className="tableau-hidden-card"
                        style={{ top: `${index * hiddenCardOffset}px` }}
                      />
                    ))}

                    {pile.visibleCards.slice(0, -1).map((card: string, index: number) => {
                      const fromPile = pile.index - 1;
                      const fromIndex = pile.hiddenCount + index;
                      const canSelectSource = hasLegalTableauSource(fromPile, fromIndex);
                      const isSelectedSource = isSelectedTableauSource(fromPile, fromIndex);

                      if (canSelectSource) {
                        return (
                          <button
                            key={`visible-${pile.index}-${index}`}
                            className={`tableau-card tableau-visible-card tableau-source-card ${cardColorClass(card)} ${isSelectedSource ? "tableau-selected-source" : ""
                              }`}
                            style={{ top: `${pile.hiddenCount * hiddenCardOffset + index * visibleCardOffset}px` }}
                            onClick={() => toggleSelectedTableauSource(fromPile, fromIndex)}
                          >
                            {card}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={`visible-${pile.index}-${index}`}
                          className={`tableau-card tableau-visible-card ${cardColorClass(card)}`}
                          style={{ top: `${pile.hiddenCount * hiddenCardOffset + index * visibleCardOffset}px` }}
                        >
                          {card}
                        </div>
                      );
                    })}

                    <button
                      className={`tableau-card ${cardColorClass(pile.top)} ${isSelectedTableauDestination ? "tableau-selected-destination" : ""
                        } ${canClickTopAsSource ? "tableau-source-card" : ""
                        } ${isSelectedTopSource ? "tableau-selected-source" : ""
                        }`}
                      style={{
                        top: `${pile.hiddenCount * hiddenCardOffset + Math.max(pile.visibleCards.length - 1, 0) * visibleCardOffset}px`,
                      }}
                      onClick={() => {
                        if (isSelectedTableauDestination && selectedTableauSource) {
                          doMove({
                            type: "move_tt",
                            fromPile: selectedTableauSource.fromPile,
                            fromIndex: selectedTableauSource.fromIndex,
                            toPile: pile.index - 1,
                          });
                        } else if (isLegalWasteDestination && !selectedTableauSource) {
                          doMove({ type: "place_t", toPile: pile.index - 1 });
                        } else if (canSelectTopSource) {
                          toggleSelectedTableauSource(topFromPile, topFromIndex);
                        }
                      }}
                      disabled={
                        !isSelectedTableauDestination &&
                        !isLegal &&
                        !canClickTopAsSource &&
                        !isSelectedTopSource
                      }
                    >
                      {pile.top}
                    </button>
                  </div>
                  {canMoveToFoundation && isLegalWasteDestination && !selectedTableauSource && (
                    <button
                      className="tableau-foundation-action"
                      onClick={() => doMove({ type: "move_tf", fromPile: pile.index - 1 })}
                    >
                      ↑ Foundation
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="bottom-row">
        <section className="app-legal-moves">
          <h2>Available moves</h2>

          <p>
            <strong>Waste → tableau:</strong>{" "}
            {legalWasteTableauMoves.length > 0
              ? legalWasteTableauMoves.map((n: number) => `T${n}`).join(", ")
              : "(none)"}
          </p>

          <p>
            <strong>Waste → foundation:</strong> {legalWasteFoundationLabel}
          </p>

          <p>
            <strong>Tableau → foundation:</strong>{" "}
            {legalTableauFoundationMoves.length > 0
              ? legalTableauFoundationMoves.map((n: number) => `T${n}`).join(", ")
              : "(none)"}
          </p>

          <div className="tableau-move-options">
            <strong>Tableau → tableau:</strong>{" "}
            <div className="tableau-helper-note">
              Select an available card on the board, or use a helper below.
            </div>

            {legalTableauTableauMoves.length > 0 ? (
              legalTableauTableauMoves.map((move: any, index: number) => {
                const movingCard = cardLabel(state.tableau[move.fromPile][move.fromIndex]);

                return (
                  <button
                    key={`${move.fromPile}-${move.fromIndex}-${move.toPile}-${index}`}
                    className={`tableau-move-action ${selectedTableauSource?.fromPile === move.fromPile &&
                      selectedTableauSource?.fromIndex === move.fromIndex
                      ? "selected"
                      : ""
                      }`}
                    onClick={() => toggleSelectedTableauSource(move.fromPile, move.fromIndex)}
                  >
                    {movingCard}: T{move.fromPile + 1} → T{move.toPile + 1}
                  </button>
                );
              })
            ) : (
              <span className="no-tableau-moves">(none)</span>
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
