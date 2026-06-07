import { useState } from "react";
import { init, summarize, dispatchMove, legalMoves, undoLastMove } from "../../engine/src/api";
import { cardLabel } from "../../engine/src/cards";
import "./App.css";

type EngineState = any;
type DrawMode = 1 | 3;

type MoveAction =
  | { type: "draw3";[key: string]: unknown }
  | { type: "recycle";[key: string]: unknown }
  | { type: "place_t"; toPile: number;[key: string]: unknown }
  | { type: "place_f";[key: string]: unknown }
  | { type: "move_tf"; fromPile: number;[key: string]: unknown }
  | { type: "move_ft"; fromPile: number; toPile: number;[key: string]: unknown }
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
type SelectedFoundationSource = number | null;

function makeSeed(): string {
  return Math.random().toString(16).slice(2).padEnd(32, "0").slice(0, 32);
}

function makeInitialState(seed: string, drawMode: DrawMode): EngineState {
  return init({
    seed,
    ruleset: "classic_v1",
    drawCount: drawMode,
  });
}

type ActiveReceiptView = "listing-preview" | null;

export default function App() {
  // Engine state
  const [seed, setSeed] = useState<string>(() => makeSeed());
  const [drawMode, setDrawMode] = useState<DrawMode>(3);
  const [state, setState] = useState<EngineState>(() => makeInitialState(seed, 3));

  // UI-only counters
  const [uiMoves, setUiMoves] = useState(0);
  const [drawCount, setDrawCount] = useState(0);
  const [recycleCount, setRecycleCount] = useState(0);
  const [economyTier, setEconomyTier] = useState<1 | 2 | 5>(1);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [selectedTableauSource, setSelectedTableauSource] =
    useState<SelectedTableauSource>(null);
  const [selectedFoundationSource, setSelectedFoundationSource] =
    useState<SelectedFoundationSource>(null);
  const [selectedWasteSource, setSelectedWasteSource] = useState(false);
  const [activeReceiptView, setActiveReceiptView] =
    useState<ActiveReceiptView>(null);

  // Engine summary
  const summary = summarize(state);

  const ECONOMY_ENTRY_TIER = economyTier;
  const ECONOMY_PAYOUT_MULTIPLE = 1.7;
  const ECONOMY_VALUE_STEP_RATE = 0.0035;
  const ECONOMY_VALUE_STEP = ECONOMY_VALUE_STEP_RATE * ECONOMY_ENTRY_TIER;

  const LISTING_PRICE_BAND_MIN_MULTIPLE = 0.5;
  const LISTING_PRICE_BAND_MAX_MULTIPLE = 1.5;
  const LISTING_HARD_FLOOR_RATE = 0.1;
  const LISTING_HARD_CEILING_PAYOUT_RATE = 1.2;
  const LISTING_PRICE_TICK = 0.05;

  const economyPayoutPotential = ECONOMY_ENTRY_TIER * ECONOMY_PAYOUT_MULTIPLE;
  const listingHardFloor = ECONOMY_ENTRY_TIER * LISTING_HARD_FLOOR_RATE;
  const listingHardCeiling =
    economyPayoutPotential * LISTING_HARD_CEILING_PAYOUT_RATE;

  function buildListingPricingPreview() {
    return {
      summary: "Preview only — waiting on reference EV and seller price",
      suggestedListingValueLabel: "Not calculated yet",
      pricingMode: "Preview only",
      referenceEv: {
        status: "Not calculated yet",
        valueLabel: "Not calculated yet",
        method: "TBD",
        readiness: "Waiting for EV formula",
      },
      sellerPrice: {
        status: "Not set",
        valueLabel: "Not set",
        mode: "Seller-set pricing not enabled",
        readiness: "Waiting for listing creation flow",
      },
      allowedPriceBand: {
        status: "Waiting on reference EV",
        rule: `EV × ${LISTING_PRICE_BAND_MIN_MULTIPLE.toFixed(
          1
        )} to EV × ${LISTING_PRICE_BAND_MAX_MULTIPLE.toFixed(1)}`,
        hardFloor: listingHardFloor,
        hardCeiling: listingHardCeiling,
        priceTick: LISTING_PRICE_TICK,
      },
    };
  }

  const listingPricingPreview = buildListingPricingPreview();
  const economyValueSteps = drawCount * drawMode;
  const economyValueConsumed = economyValueSteps * ECONOMY_VALUE_STEP;
  const economyRemainingValue = Math.max(
    0,
    ECONOMY_ENTRY_TIER - economyValueConsumed
  );
  const economyRemainingPercent =
    (economyRemainingValue / ECONOMY_ENTRY_TIER) * 100;

  const receiptPreviewId = `receipt-${seed.slice(0, 12)}`;

  function formatMoney(value: number) {
    return `$${value.toFixed(2)}`;
  }

  function renderPricingReadinessRows(
    pricingPreview: typeof listingPricingPreview
  ) {
    return (
      <>
        <div className="completion-breakdown-row">
          <span>Suggested listing value</span>
          <strong>{pricingPreview.suggestedListingValueLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Pricing mode</span>
          <strong>{pricingPreview.pricingMode}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Reference EV status</span>
          <strong>{pricingPreview.referenceEv.status}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Reference EV value</span>
          <strong>{pricingPreview.referenceEv.valueLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Reference EV method</span>
          <strong>{pricingPreview.referenceEv.method}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Reference EV readiness</span>
          <strong>{pricingPreview.referenceEv.readiness}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Seller price status</span>
          <strong>{pricingPreview.sellerPrice.status}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Seller price value</span>
          <strong>{pricingPreview.sellerPrice.valueLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Seller price mode</span>
          <strong>{pricingPreview.sellerPrice.mode}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Seller price readiness</span>
          <strong>{pricingPreview.sellerPrice.readiness}</strong>
        </div>
      </>
    );
  }

  function renderPriceBandGuardrailRows(
    pricingPreview: typeof listingPricingPreview
  ) {
    return (
      <>
        <div className="completion-breakdown-row">
          <span>Allowed price band</span>
          <strong>{pricingPreview.allowedPriceBand.status}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Band rule</span>
          <strong>{pricingPreview.allowedPriceBand.rule}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Hard floor</span>
          <strong>{formatMoney(pricingPreview.allowedPriceBand.hardFloor)}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Hard ceiling</span>
          <strong>{formatMoney(pricingPreview.allowedPriceBand.hardCeiling)}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Price tick</span>
          <strong>{formatMoney(pricingPreview.allowedPriceBand.priceTick)}</strong>
        </div>
      </>
    );
  }

  function renderDealValueSnapshotRows(receipt: typeof listingPreviewReceipt) {
    return (
      <>
        <div className="completion-breakdown-row">
          <span>Entry tier</span>
          <strong>{formatMoney(receipt.entryTier)}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Payout potential</span>
          <strong>{formatMoney(receipt.payoutPotential)}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Value steps</span>
          <strong>{receipt.valueSteps}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Value step rate</span>
          <strong>{(receipt.valueStepRate * 100).toFixed(2)}%</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Remaining value</span>
          <strong>{formatMoney(receipt.remainingValue)}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Remaining %</span>
          <strong>{receipt.remainingPercent.toFixed(2)}%</strong>
        </div>
      </>
    );
  }

  function formatSmallMoney(value: number) {
    if (value >= 0.01) return formatMoney(value);
    return `${(value * 100).toFixed(2)}¢`;
  }

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
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
  }
  function handleNewGame() {
    const newSeed = makeSeed();
    const fresh = makeInitialState(newSeed, drawMode);

    setSeed(newSeed);
    setState(fresh);

    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
    setActiveReceiptView(null);
  }

  function handleStartDrawMode(mode: DrawMode) {
    const newSeed = makeSeed();
    const fresh = makeInitialState(newSeed, mode);

    setDrawMode(mode);
    setSeed(newSeed);
    setState(fresh);

    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
    setActiveReceiptView(null);
  }

  function handleLoadNearWinScenario() {
    const scenarioSeed = "near-win-test";
    const fresh = makeInitialState(scenarioSeed, drawMode);

    const nearWinState = {
      ...fresh,
      stock: [],
      waste: [],
      tableau: [[51], [], [], [], [], [], []],
      tableauFaceUp: [1, 0, 0, 0, 0, 0, 0],
      foundations: [
        Array.from({ length: 13 }, (_, index) => index),
        Array.from({ length: 13 }, (_, index) => index + 13),
        Array.from({ length: 13 }, (_, index) => index + 26),
        Array.from({ length: 12 }, (_, index) => index + 39),
      ],
      tick: 0,
      score: 0,
      history: [],
      undos: 0,
    };

    setSeed(scenarioSeed);
    setState(nearWinState);

    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
  }

  function handleLoadReceiptScenario() {
    const scenarioSeed = "receipt-test";
    const fresh = makeInitialState(scenarioSeed, drawMode);

    const receiptState = {
      ...fresh,
      stock: [],
      waste: [],
      tableau: [[51], [], [], [], [], [], []],
      tableauFaceUp: [1, 0, 0, 0, 0, 0, 0],
      foundations: [
        Array.from({ length: 13 }, (_, index) => index),
        Array.from({ length: 13 }, (_, index) => index + 13),
        Array.from({ length: 13 }, (_, index) => index + 26),
        Array.from({ length: 12 }, (_, index) => index + 39),
      ],
      tick: 4,
      score: -20,
      scoreBreakdown: {
        wasteToTableau: 5,
        wasteToFoundation: 0,
        tableauToFoundation: 10,
        foundationToTableau: -15,
        recycle: -20,
      },
      history: [],
      undos: 0,
    };

    setSeed(scenarioSeed);
    setState(receiptState);

    setUiMoves(4);
    setDrawCount(0);
    setRecycleCount(1);
    setLastAction(null);
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
  }

  function handleResetStats() {
    // Only reset UI counters – leave the engine state alone
    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
  }

  function handleUndo() {
    if (state.history.length === 0) return;

    setState((current: EngineState) => undoLastMove(current));
    setUiMoves((moves) => moves + 1);
    setLastAction("undo");
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
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
  const legalFoundationTableauMoves = currentLegalMoves.filter(
    (move: any) => move.type === "move_ft"
  );

  const selectedFoundationDestinationPiles =
    selectedFoundationSource !== null
      ? legalFoundationTableauMoves
        .filter((move: any) => move.fromPile === selectedFoundationSource)
        .map((move: any) => move.toPile)
      : [];

  function hasLegalFoundationSource(fromPile: number): boolean {
    return legalFoundationTableauMoves.some(
      (move: any) => move.fromPile === fromPile
    );
  }
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
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
    setSelectedTableauSource((selected) =>
      selected?.fromPile === fromPile && selected?.fromIndex === fromIndex
        ? null
        : { fromPile, fromIndex }
    );
  }
  function toggleSelectedFoundationSource(fromPile: number) {
    setSelectedTableauSource(null);
    setSelectedWasteSource(false);
    setSelectedFoundationSource((selected) =>
      selected === fromPile ? null : fromPile
    );
  }
  function toggleSelectedWasteSource() {
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource((selected) => !selected);
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

  function cardColorClass(label: string): string {
    const suit = label.slice(-1);
    return suit === "♥" || suit === "♦" ? "card-red" : "card-black";
  }

  function formatAction(action: string | null) {
    if (!action) return "(none yet)";

    switch (action) {
      case "draw3":
        return `Draw ${drawMode}`;
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
      case "move_ft":
        return "Move foundation to tableau";
      case "undo":
        return "Undo";
      default:
        return action;
    }
  }

  function formatScoreValue(value: number) {
    return value > 0 ? `+${value}` : String(value);
  }

  const completedReceipt = {
    type: "completed-game" as const,
    label: "Completed game",
    id: receiptPreviewId,
    dealSeedPreview: `${seed.slice(0, 12)}...`,
    status: "Preview only",
  };

  const listingPreviewReceipt = {
    type: "listing-preview" as const,
    label: "Listing preview",
    id: `receipt-listing-preview-${seed.slice(0, 8)}`,
    dealSeedPreview: `${seed.slice(0, 12)}...`,
    status: "Development preview only — no listing created",
    entryTier: ECONOMY_ENTRY_TIER,
    payoutPotential: economyPayoutPotential,
    valueSteps: economyValueSteps,
    valueStepRate: ECONOMY_VALUE_STEP_RATE,
    remainingValue: economyRemainingValue,
    remainingPercent: economyRemainingPercent,
    pricingPreview: listingPricingPreview,
  };

  return (
    <div className="app-root">
      <h1>Solitaire Prototype</h1>

      {summary.completed && (
        <>
          <section className="completion-banner" role="status">
            <h2>Game Complete!</h2>
            <div className="receipt-details">
              <div className="receipt-type-label">Receipt type: {completedReceipt.label}</div>
              <div className="receipt-id-label">
                Receipt ID: {completedReceipt.id}
              </div>
              <div className="receipt-id-label">
                Deal seed: {completedReceipt.dealSeedPreview}
              </div>
              <div className="receipt-id-label">
                Receipt status: {completedReceipt.status}
              </div>
            </div>
            <p className="completion-banner-message">
              You solved this Draw {drawMode} deal.
            </p>

            <div className="completion-results">
              <div className="completion-result">
                <span className="completion-result-label">Final score</span>
                <strong>{summary.score}</strong>
              </div>
              <div className="completion-result">
                <span className="completion-result-label">Moves</span>
                <strong>{summary.moves}</strong>
              </div>
              <div className="completion-result">
                <span className="completion-result-label">Undos</span>
                <strong>{summary.undos}</strong>
              </div>
            </div>

            <div className="completion-breakdown">
              <h3>Score breakdown</h3>

              {state.scoreBreakdown.wasteToTableau !== 0 && (
                <div className="completion-breakdown-row">
                  <span>Waste → Tableau</span>
                  <strong>{formatScoreValue(state.scoreBreakdown.wasteToTableau)}</strong>
                </div>
              )}

              {state.scoreBreakdown.wasteToFoundation !== 0 && (
                <div className="completion-breakdown-row">
                  <span>Waste → Foundation</span>
                  <strong>{formatScoreValue(state.scoreBreakdown.wasteToFoundation)}</strong>
                </div>
              )}

              {state.scoreBreakdown.tableauToFoundation !== 0 && (
                <div className="completion-breakdown-row">
                  <span>Tableau → Foundation</span>
                  <strong>{formatScoreValue(state.scoreBreakdown.tableauToFoundation)}</strong>
                </div>
              )}

              {state.scoreBreakdown.foundationToTableau !== 0 && (
                <div className="completion-breakdown-row penalty">
                  <span>Foundation → Tableau</span>
                  <strong>{formatScoreValue(state.scoreBreakdown.foundationToTableau)}</strong>
                </div>
              )}
              {state.scoreBreakdown.recycle !== 0 && (
                <div className="completion-breakdown-row penalty">
                  <span>Recycle</span>
                  <strong>{formatScoreValue(state.scoreBreakdown.recycle)}</strong>
                </div>
              )}
            </div>
            <div className="completion-economy-preview">
              <h3>Economy preview</h3>

              <div className="completion-breakdown-row">
                <span>Entry tier</span>
                <strong>{formatMoney(ECONOMY_ENTRY_TIER)}</strong>
              </div>

              <div className="completion-breakdown-row">
                <span>Payout potential</span>
                <strong>{formatMoney(economyPayoutPotential)}</strong>
              </div>

              <div className="completion-breakdown-row">
                <span>Value steps</span>
                <strong>{economyValueSteps}</strong>
              </div>

              <div className="completion-breakdown-row">
                <span>Value step rate</span>
                <strong>{(ECONOMY_VALUE_STEP_RATE * 100).toFixed(2)}%</strong>
              </div>

              <div
                className={
                  economyValueConsumed === 0
                    ? "completion-breakdown-row"
                    : "completion-breakdown-row penalty"
                }
              >
                <span>Value consumed</span>
                <strong>
                  {economyValueConsumed === 0
                    ? formatSmallMoney(0)
                    : `-${formatSmallMoney(economyValueConsumed)}`}
                </strong>
              </div>

              <div className="completion-breakdown-row">
                <span>Remaining value</span>
                <strong>{formatMoney(economyRemainingValue)}</strong>
              </div>

              <div className="completion-breakdown-row">
                <span>Remaining %</span>
                <strong>{economyRemainingPercent.toFixed(2)}%</strong>
              </div>

              <p className="completion-economy-note">
                Preview only — no wallet movement, escrow, marketplace sale price,
                bonuses, refunds, or final settlement.
              </p>
              <div className="receipt-next-actions">
                <h3>Next actions</h3>
                <p>
                  Review this receipt, then start a new Draw {drawMode} game when
                  ready.
                </p>

                <p className="receipt-view-status">
                  Secondary receipt view:{" "}
                  <strong>
                    {activeReceiptView === "listing-preview" ? "Listing preview" : "None"}
                  </strong>
                </p>

                <div className="receipt-next-action-buttons">
                  <button onClick={() => handleStartDrawMode(1)}>New Draw 1 Game</button>
                  <button onClick={() => handleStartDrawMode(3)}>New Draw 3 Game</button>
                  <button
                    onClick={() => setActiveReceiptView("listing-preview")}
                    disabled={activeReceiptView === "listing-preview"}
                  >
                    {activeReceiptView === "listing-preview"
                      ? "Listing Preview Open"
                      : "Preview Listing"}
                  </button>
                  <button disabled title="Receipt review tools coming later">
                    Review receipt
                  </button>
                </div>
              </div>
            </div>
          </section>
          {activeReceiptView === "listing-preview" && (
            <section className="listing-preview-receipt" role="status">
              <h2>Listing Preview Receipt</h2>

              <div className="receipt-details">
                <div className="receipt-type-label">
                  Receipt type: {listingPreviewReceipt.label}
                </div>
                <div className="receipt-id-label">
                  Receipt ID: {listingPreviewReceipt.id}
                </div>
                <div className="receipt-id-label">
                  Deal seed: {listingPreviewReceipt.dealSeedPreview}
                </div>
                <div className="receipt-id-label">
                  Receipt status: {listingPreviewReceipt.status}
                </div>
              </div>
              <div className="completion-economy-preview">
                <h3>Marketplace value preview</h3>

                <p className="completion-banner-message">
                  Pricing summary: {listingPreviewReceipt.pricingPreview.summary}
                </p>

                <h4>Deal value snapshot</h4>

                {renderDealValueSnapshotRows(listingPreviewReceipt)}

                <h4>Pricing readiness</h4>

                {renderPricingReadinessRows(listingPreviewReceipt.pricingPreview)}

                <h4>Price band guardrails</h4>

                {renderPriceBandGuardrailRows(listingPreviewReceipt.pricingPreview)}
              </div>
              <p className="completion-banner-message">
                This is a preview-only marketplace listing receipt. No wallet movement,
                escrow, sale price, buyer, seller, or marketplace transaction has been created.
              </p>

              <div className="receipt-next-action-buttons">
                <button onClick={() => setActiveReceiptView(null)}>
                  Hide Listing Preview
                </button>
              </div>
            </section>
          )}
        </>
      )}

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
            <strong>Mode:</strong> Draw {drawMode}
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
                <button
                  type="button"
                  className={`deck-card stock-card ${stockSize > 0 ? "deck-live stock-clickable" : "deck-empty"
                    } ${stockSize === 0 && wasteSize > 0 ? "stock-recycle-ready" : ""
                    }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseUp={(event) => event.currentTarget.blur()}
                  onClick={() => {
                    if (stockSize > 0) {
                      doMove({ type: "draw3" });
                    } else if (wasteSize > 0) {
                      doMove({ type: "recycle" });
                    }
                  }}
                  disabled={stockSize === 0 && wasteSize === 0}
                >
                  {stockSize}
                </button>
              </div>
              <div className="board-deck-pile">
                <div className="board-deck-label">Waste</div>

                {visibleWasteList.length > 0 ? (
                  <div className="waste-fan">
                    {[...visibleWasteList].reverse().map((card: string, index: number) => {
                      const isTopWasteCard = index === visibleWasteList.length - 1;
                      const hasLegalWasteMove =
                        (legalWasteTableauMoves.length > 0 || legalWasteFoundationMove) &&
                        selectedTableauSource === null &&
                        selectedFoundationSource === null;

                      if (isTopWasteCard && hasLegalWasteMove) {
                        return (
                          <button
                            key={`${card}-${index}`}
                            type="button"
                            className={`deck-card waste-card waste-fan-card ${cardColorClass(card)} waste-playable-source ${selectedWasteSource ? "waste-selected-source" : ""
                              }`}
                            style={{ left: `${index * 30}px`, zIndex: index + 1 }}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseUp={(event) => event.currentTarget.blur()}
                            onClick={toggleSelectedWasteSource}
                          >
                            {card}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={`${card}-${index}`}
                          className={`deck-card waste-card waste-fan-card ${cardColorClass(card)}`}
                          style={{ left: `${index * 30}px`, zIndex: index + 1 }}
                        >
                          {card}
                        </div>
                      );
                    })}
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
                  selectedWasteSource &&
                  !selectedTableauSource &&
                  selectedFoundationSource === null &&
                  legalWasteFoundationPileIndex === pile.index - 1;

                const isSelectedTableauFoundationDestination =
                  selectedTableauSource !== null &&
                  selectedTableauFoundationPileIndex === pile.index - 1;

                const isFoundationBoardDestination =
                  isLegalWasteFoundationDestination ||
                  isSelectedTableauFoundationDestination;

                const canSelectFoundationSource =
                  pile.size > 0 &&
                  hasLegalFoundationSource(pile.index - 1) &&
                  !selectedTableauSource &&
                  !selectedWasteSource &&
                  (
                    selectedFoundationSource === null ||
                    selectedFoundationSource === pile.index - 1
                  );

                const isSelectedFoundationSource =
                  selectedFoundationSource === pile.index - 1;

                return (
                  <div key={pile.index} className="foundation-row">
                    <div className="foundation-label">F{pile.index}</div>
                    <button
                      type="button"
                      className={`foundation-card ${pile.size === 0 ? "" : cardColorClass(pile.top)} ${isFoundationBoardDestination ? "foundation-waste-destination" : ""
                        } ${canSelectFoundationSource ? "foundation-source-card" : ""} ${isSelectedFoundationSource ? "foundation-selected-source" : ""
                        }`}
                      onMouseUp={(event) => event.currentTarget.blur()}
                      onClick={() => {
                        if (isSelectedTableauFoundationDestination && selectedTableauSource) {
                          doMove({
                            type: "move_tf",
                            fromPile: selectedTableauSource.fromPile,
                          });
                        } else if (isLegalWasteFoundationDestination) {
                          doMove({ type: "place_f" });
                        } else if (canSelectFoundationSource) {
                          toggleSelectedFoundationSource(pile.index - 1);
                        }
                      }}
                      disabled={!isFoundationBoardDestination && !canSelectFoundationSource && !isSelectedFoundationSource}
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
              const isLegalWasteDestination =
                selectedWasteSource &&
                selectedFoundationSource === null &&
                isLegalWasteTableauTarget(pile.index);

              const isLegal =
                selectedWasteSource &&
                !selectedTableauSource &&
                selectedFoundationSource === null &&
                isLegalWasteDestination;

              const canMoveToFoundation = isLegalTableauFoundationSource(pile.index);

              const isSelectedTableauDestination =
                selectedTableauDestinationPiles.includes(pile.index - 1);

              const isSelectedFoundationDestination =
                selectedFoundationDestinationPiles.includes(pile.index - 1);

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
                selectedFoundationSource === null &&
                !selectedWasteSource &&
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
                            onMouseUp={(event) => event.currentTarget.blur()}
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
                      className={`tableau-card ${cardColorClass(pile.top)} ${isSelectedTableauDestination || isSelectedFoundationDestination
                        ? "tableau-selected-destination"
                        : ""
                        } ${canClickTopAsSource ? "tableau-source-card" : ""
                        } ${isSelectedTopSource ? "tableau-selected-source" : ""
                        }`}
                      style={{
                        top: `${pile.hiddenCount * hiddenCardOffset + Math.max(pile.visibleCards.length - 1, 0) * visibleCardOffset}px`,
                      }}
                      onMouseUp={(event) => event.currentTarget.blur()}
                      onClick={() => {
                        if (isSelectedFoundationDestination && selectedFoundationSource !== null) {
                          doMove({
                            type: "move_ft",
                            fromPile: selectedFoundationSource,
                            toPile: pile.index - 1,
                          });
                        } else if (isSelectedTableauDestination && selectedTableauSource) {
                          doMove({
                            type: "move_tt",
                            fromPile: selectedTableauSource.fromPile,
                            fromIndex: selectedTableauSource.fromIndex,
                            toPile: pile.index - 1,
                          });
                        } else if (
                          selectedWasteSource &&
                          isLegalWasteDestination &&
                          !selectedTableauSource &&
                          selectedFoundationSource === null
                        ) {
                          doMove({ type: "place_t", toPile: pile.index - 1 });
                        } else if (canSelectTopSource && selectedFoundationSource === null) {
                          toggleSelectedTableauSource(topFromPile, topFromIndex);
                        }
                      }}
                      disabled={
                        !isSelectedTableauDestination &&
                        !isSelectedFoundationDestination &&
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

          <p>
            <strong>Foundation → tableau:</strong>{" "}
            {legalFoundationTableauMoves.length > 0
              ? legalFoundationTableauMoves
                .map((move: any) => `F${move.fromPile + 1} → T${move.toPile + 1}`)
                .join(", ")
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
          <h2>Game Options</h2>

          <p>
            <strong>Start new game:</strong>
          </p>

          <div className="app-controls">
            <button
              className={drawMode === 1 ? "active-mode-control" : ""}
              onClick={() => handleStartDrawMode(1)}
            >
              Draw 1
            </button>
            <button
              className={drawMode === 3 ? "active-mode-control" : ""}
              onClick={() => handleStartDrawMode(3)}
            >
              Draw 3
            </button>
          </div>

          <div className="app-controls">
            <button onClick={handleUndo} disabled={state.history.length === 0}>
              Undo
            </button>
            <button onClick={handleNewGame}>New Draw {drawMode}</button>
            <button onClick={handleResetStats}>Reset counters</button>
          </div>
        </section>
        <section className="panel economy-preview-panel">
          <h2>Development Economy Preview</h2>

          <p className="economy-preview-note">
            Preview only — no wallet movement or real settlement. Draw 1 counts as
            1 stock-card value step; Draw 3 counts as 3.
          </p>
          <div className="economy-tier-controls" aria-label="Economy tier">
            <button
              className={economyTier === 1 ? "active-mode-control" : ""}
              onClick={() => setEconomyTier(1)}
            >
              $1
            </button>
            <button
              className={economyTier === 2 ? "active-mode-control" : ""}
              onClick={() => setEconomyTier(2)}
            >
              $2
            </button>
            <button
              className={economyTier === 5 ? "active-mode-control" : ""}
              onClick={() => setEconomyTier(5)}
            >
              $5
            </button>
          </div>

          <div className="economy-preview-grid">
            <div>
              <span>Entry tier</span>
              <strong>{formatMoney(ECONOMY_ENTRY_TIER)}</strong>
            </div>
            <div>
              <span>Draw mode</span>
              <strong>Draw {drawMode}</strong>
            </div>
            <div>
              <span>Payout model</span>
              <strong>{ECONOMY_PAYOUT_MULTIPLE.toFixed(2)}×</strong>
            </div>
            <div>
              <span>Payout potential</span>
              <strong>{formatMoney(economyPayoutPotential)}</strong>
            </div>
            <div>
              <span>Value steps</span>
              <strong>{economyValueSteps}</strong>
            </div>
            <div>
              <span>Value step rate</span>
              <strong>{(ECONOMY_VALUE_STEP_RATE * 100).toFixed(2)}%</strong>
            </div>
            <div>
              <span>Value model</span>
              <strong>Linear preview</strong>
            </div>
            <div>
              <span>Value consumed</span>
              <strong>{formatSmallMoney(economyValueConsumed)}</strong>
            </div>
            <div>
              <span>Remaining value</span>
              <strong>{formatMoney(economyRemainingValue)}</strong>
            </div>
            <div>
              <span>Remaining %</span>
              <strong>{economyRemainingPercent.toFixed(2)}%</strong>
            </div>
          </div>

          <p className="economy-preview-assumption">
            Assumes stock-card exposure only. Does not include marketplace sale
            price, escrow, wallet settlement, bonuses, refunds, or final payout
            accounting.
          </p>
        </section>
        <section className="app-controls-panel development-tools-panel">
          <h2>Development Tools</h2>

          <p className="development-tools-note">
            Load a controlled board position for testing.
          </p>

          <div className="app-controls">
            <button onClick={handleLoadNearWinScenario}>
              Load Near-Win Board
            </button>
            <button onClick={handleLoadReceiptScenario}>
              Load Receipt Test
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
