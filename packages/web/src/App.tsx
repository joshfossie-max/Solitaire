import { Fragment, useState } from "react";
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
type PreviewOnlyListingSnapshot = {
  listingIdLabel: string;
  status: string;
  currentListingValueLabel: string;
  drawModeLabel: string;
  valueSteps: number;
  remainingPercentLabel: string;
  walletEffect: string;
  escrowEffect: string;
  settlementEffect: string;
};

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
  const [isPreviewListingCreated, setIsPreviewListingCreated] = useState(false);
  const [previewListingSnapshot, setPreviewListingSnapshot] =
    useState<PreviewOnlyListingSnapshot | null>(null);
  const [isPreviewListingDetailOpen, setIsPreviewListingDetailOpen] =
    useState(false);

  const PREVIEW_LOCK_REASON_NONE = "NONE";
  const BUYER_HANDOFF_NOT_IMPLEMENTED_LOCK_REASON =
    "BUYER_HANDOFF_NOT_IMPLEMENTED";
  const HANDOFF_REQUIREMENTS_INCOMPLETE_DISABLED_REASON =
    "HANDOFF_REQUIREMENTS_INCOMPLETE";
  const PREVIEW_PURCHASE_EXECUTION_DISABLED_REASON =
    "PREVIEW_PURCHASE_EXECUTION_DISABLED";

  const PREVIEW_REQUIREMENT_STATUS_IMPLEMENTED = "Implemented";
  const PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED = "Not implemented";
  const PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE = "manual_future";

  const REQ_BUYER_IDENTITY = "REQ_BUYER_IDENTITY";
  const REQ_WALLET_ESCROW_RULES = "REQ_WALLET_ESCROW_RULES";
  const REQ_OWNERSHIP_TRANSFER = "REQ_OWNERSHIP_TRANSFER";
  const REQ_BUYER_GAME_COPY = "REQ_BUYER_GAME_COPY";
  const REQ_RESUME_PLAY_RULES = "REQ_RESUME_PLAY_RULES";
  const REQ_BACKEND_PERSISTENCE = "REQ_BACKEND_PERSISTENCE";

  const PREVIEW_BUYER_HANDOFF_REQUIREMENTS = [
    {
      id: REQ_BUYER_IDENTITY,
      label: "Buyer identity",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
    {
      id: REQ_WALLET_ESCROW_RULES,
      label: "Wallet / escrow rules",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
    {
      id: REQ_OWNERSHIP_TRANSFER,
      label: "Ownership transfer",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
    {
      id: REQ_BUYER_GAME_COPY,
      label: "Copied buyer game state",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
    {
      id: REQ_RESUME_PLAY_RULES,
      label: "Resume / play rules",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
    {
      id: REQ_BACKEND_PERSISTENCE,
      label: "Backend persistence",
      status: PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED,
      completionMode: PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE,
    },
  ];

  const previewBuyerHandoffTotalRequirements =
    PREVIEW_BUYER_HANDOFF_REQUIREMENTS.length;

  const previewBuyerHandoffImplementedRequirements =
    PREVIEW_BUYER_HANDOFF_REQUIREMENTS.filter(
      (requirement) => requirement.status === PREVIEW_REQUIREMENT_STATUS_IMPLEMENTED
    ).length;

  const previewBuyerHandoffRemainingRequirements =
    previewBuyerHandoffTotalRequirements -
    previewBuyerHandoffImplementedRequirements;

  const previewBuyerHandoffAllRequirementsComplete =
    previewBuyerHandoffRemainingRequirements === 0;

  const previewBuyerHandoffBlockingRequirements =
    PREVIEW_BUYER_HANDOFF_REQUIREMENTS.filter(
      (requirement) => requirement.status !== PREVIEW_REQUIREMENT_STATUS_IMPLEMENTED
    );

  const previewBuyerHandoffBlockingRequirementIds =
    previewBuyerHandoffBlockingRequirements.map((requirement) => requirement.id);

  const previewBuyerHandoffRequirementSummary = {
    title: "Buyer handoff requirements summary",
    totalRequirements: previewBuyerHandoffTotalRequirements,
    implementedRequirements: previewBuyerHandoffImplementedRequirements,
    remainingRequirements: previewBuyerHandoffRemainingRequirements,
    requirementStatus: previewBuyerHandoffAllRequirementsComplete
      ? "Ready — requirements complete"
      : "Locked — requirements not complete",
  };

  const previewBuyerHandoffCompletionModeSummary = {
    title: "Requirement completion mode summary",
    manualFutureRequirements: PREVIEW_BUYER_HANDOFF_REQUIREMENTS.filter(
      (requirement) =>
        requirement.completionMode ===
        PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE
    ).length,
  };

  const previewBuyerHandoffUnlockGate = {
    title: "Buyer handoff unlock gate",
    gateExists: "Yes",
    gateCurrentlyComplete: previewBuyerHandoffAllRequirementsComplete
      ? "Yes"
      : "No",
    gateSource: "Buyer handoff requirements",
    purchaseEffect: "Does not enable Preview Purchase",
  };

  const DEFAULT_PREVIEW_BUYER_ACTION_LOG_STATE = {
    lastBuyerAction: "None",
    attemptedPurchase: "Not attempted",
    purchaseResult: "Locked",
    attemptCount: 0,
    lastActionNote: "No buyer action has been recorded.",
    actionLogStatus: "Preview only — no buyer action recorded",
    lockReasonCode: PREVIEW_LOCK_REASON_NONE,
  };

  const LOCKED_PREVIEW_BUYER_ACTION_LOG_STATE = {
    lastBuyerAction: "Preview Purchase clicked",
    attemptedPurchase: "Attempted while locked",
    purchaseResult: "Locked",
    attemptCount: 1,
    lastActionNote: "Purchase attempt was recorded as locked and preview-only.",
    actionLogStatus: "Preview only — locked purchase attempt recorded",
    lockReasonCode: BUYER_HANDOFF_NOT_IMPLEMENTED_LOCK_REASON,
  };

  const [previewBuyerActionLogState, setPreviewBuyerActionLogState] = useState(
    DEFAULT_PREVIEW_BUYER_ACTION_LOG_STATE
  );

  // Engine summary
  const summary = summarize(state);

  const ECONOMY_ENTRY_TIER = economyTier;
  const ECONOMY_PAYOUT_MULTIPLE = 1.7;
  const ECONOMY_VALUE_STEP_RATE = 0.0035;
  const ECONOMY_VALUE_STEP = ECONOMY_VALUE_STEP_RATE * ECONOMY_ENTRY_TIER;
  const COMPLETED_FINAL_SCORE_LABEL = "Final score";
  const COMPLETED_MOVES_LABEL = "Moves";
  const COMPLETED_UNDOS_LABEL = "Undos";
  const COMPLETED_SCORE_BREAKDOWN_TITLE = "Score breakdown";
  const COMPLETED_ECONOMY_PREVIEW_TITLE = "Economy preview";
  const COMPLETED_ECONOMY_PREVIEW_NOTE =
    "Preview only — no wallet movement, escrow, marketplace sale price, bonuses, refunds, or final settlement.";

  const economyPayoutPotential = ECONOMY_ENTRY_TIER * ECONOMY_PAYOUT_MULTIPLE;

  function buildListingPricingPreview(currentListingValue: number) {
    return {
      title: "Marketplace value preview",
      summary: "Preview only — system-priced listing value follows remaining value",
      suggestedListingValueLabel: formatPreciseMoney(currentListingValue),
      pricingMode: "Preview only",
      referenceEv: {
        status: "Not calculated yet",
        valueLabel: "Not calculated yet",
        method: "TBD",
        readiness: "Waiting for EV formula",
      },
      listingValue: {
        title: "Current listing value preview",
        status: "System-priced",
        valueLabel: formatPreciseMoney(currentListingValue),
        inputStatus: "No player price entry",
        inputLabel: "Player pricing",
        placeholder: "Player chooses when to list, not price",
        formulaLabel: "Current listing value = remaining value",
        mode: "System-priced from game state",
        readiness: "Preview only — current listing value follows remaining value",
      },
    };
  }

  function renderPreviewDetailRow(label: string, value: string | number) {
    return (
      <div className="completion-breakdown-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }

  function renderPreviewStatusCardRow(
    label: string,
    value: string | number,
    options?: { fullWidth?: boolean; wrapValue?: boolean }
  ) {
    return (
      <div style={options?.fullWidth ? { gridColumn: "1 / -1" } : undefined}>
        <span>{label}</span>
        <strong style={options?.wrapValue ? { overflowWrap: "anywhere" } : undefined}>
          {value}
        </strong>
      </div>
    );
  }

  const economyValueSteps = drawCount * drawMode;
  const economyValueConsumed = economyValueSteps * ECONOMY_VALUE_STEP;
  const economyRemainingValue = Math.max(
    0,
    ECONOMY_ENTRY_TIER - economyValueConsumed
  );
  const economyRemainingPercent =
    (economyRemainingValue / ECONOMY_ENTRY_TIER) * 100;

  const listingPricingPreview = buildListingPricingPreview(economyRemainingValue);

  const receiptPreviewId = `receipt-${seed.slice(0, 12)}`;

  function formatMoney(value: number) {
    return `$${value.toFixed(2)}`;
  }

  function formatPreciseMoney(value: number) {
    return `$${value.toFixed(4)}`;
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
          <span>Listing preview mode</span>
          <strong>{pricingPreview.pricingMode}</strong>
        </div>

        {renderlistingValuePreviewRows(pricingPreview)}
      </>
    );
  }

  function renderlistingValuePreviewRows(
    pricingPreview: typeof listingPricingPreview
  ) {
    return (
      <>
        <div className="completion-breakdown-row">
          <span>Listing value status</span>
          <strong>{pricingPreview.listingValue.status}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Current listing value</span>
          <strong>{pricingPreview.listingValue.valueLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>{pricingPreview.listingValue.inputLabel}</span>
          <strong>{pricingPreview.listingValue.inputStatus}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Listing value note</span>
          <strong>{pricingPreview.listingValue.placeholder}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Listing value mode</span>
          <strong>{pricingPreview.listingValue.mode}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Listing value readiness</span>
          <strong>{pricingPreview.listingValue.readiness}</strong>
        </div>
      </>
    );
  }

  function renderlistingValuePreviewInput(
    pricingPreview: typeof listingPricingPreview
  ) {
    return (
      <div className="listing-value-preview-input">
        <div className="listing-value-preview-input-title">
          {pricingPreview.listingValue.title}
        </div>

        <div className="listing-value-preview-input-status">
          Current listing value: {pricingPreview.listingValue.valueLabel}
        </div>

        <label className="listing-value-preview-input-label">
          <span>{pricingPreview.listingValue.inputLabel}</span>

          <div className="listing-value-preview-input-control" aria-disabled="true">
            {pricingPreview.listingValue.placeholder}
          </div>

          <div className="listing-value-preview-input-status">
            {pricingPreview.listingValue.formulaLabel}
          </div>
        </label>

        <div className="listing-value-preview-input-status">
          Player pricing status: {pricingPreview.listingValue.inputStatus}
        </div>
      </div>
    );
  }

  function renderListingDraftPreviewRows(
    draftPreview: typeof listingDraftPreview
  ) {
    return (
      <div className="listing-value-preview-input">
        <div className="listing-value-preview-input-title">
          {draftPreview.title}
        </div>

        <div className="completion-breakdown-row">
          <span>Status</span>
          <strong>{draftPreview.status}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Seed</span>
          <strong>{draftPreview.seedPreview}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Draw mode</span>
          <strong>{draftPreview.drawModeLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Current listing value</span>
          <strong>{draftPreview.currentListingValueLabel}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Value steps</span>
          <strong>{draftPreview.valueSteps}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Remaining %</span>
          <strong>{draftPreview.remainingPercentLabel}</strong>
        </div>
      </div>
    );
  }

  function renderListingCreationReadinessRows(
    readiness: typeof listingCreationReadiness
  ) {
    return (
      <div className="listing-value-preview-input">
        <div className="listing-value-preview-input-title">
          {readiness.title}
        </div>

        <div className="completion-breakdown-row">
          <span>Preview action status</span>
          <strong>{readiness.previewActionStatus}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Real listing status</span>
          <strong>{readiness.realListingStatus}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Value source</span>
          <strong>{readiness.valueSource}</strong>
        </div>

        <div className="completion-breakdown-row">
          <span>Required before real listing</span>
          <strong>{readiness.requiredBeforeRealListing}</strong>
        </div>
      </div>
    );
  }

  function renderPreviewOnlyListingStateRows(
    previewState: typeof previewOnlyListingState
  ) {
    return (
      <div className="listing-value-preview-input">
        <div className="listing-value-preview-input-title">
          {previewState.title}
        </div>

        {renderPreviewDetailRow("Status", previewState.status)}

        {renderPreviewDetailRow("Listing ID", previewState.listingIdLabel)}

        {renderPreviewDetailRow("Wallet effect", previewState.walletEffect)}

        {renderPreviewDetailRow("Escrow effect", previewState.escrowEffect)}

        {renderPreviewDetailRow("Settlement effect", previewState.settlementEffect)}
      </div>
    );
  }

  // Shared audit/details rows used by multiple receipt types.
  function renderReceiptAuditDetails(receipt: {
    label: string;
    id: string;
    dealSeedPreview: string;
    status: string;
    settlementStatus: string;
  }) {
    return (
      <div className="receipt-details">
        <div className="receipt-type-label">
          Receipt type: {receipt.label}
        </div>
        <div className="receipt-id-label">
          Receipt ID: {receipt.id}
        </div>
        <div className="receipt-id-label">
          Deal seed: {receipt.dealSeedPreview}
        </div>
        <div className="receipt-id-label">
          Receipt status: {receipt.status}
        </div>
        <div className="receipt-id-label">
          Settlement status: {receipt.settlementStatus}
        </div>
      </div>
    );
  }

  function renderCompletedResultSummary(summary: ReturnType<typeof summarize>) {
    return (
      <div className="completion-results">
        <div className="completion-result">
          <span className="completion-result-label">{COMPLETED_FINAL_SCORE_LABEL}</span>
          <strong>{summary.score}</strong>
        </div>
        <div className="completion-result">
          <span className="completion-result-label">{COMPLETED_MOVES_LABEL}</span>
          <strong>{summary.moves}</strong>
        </div>
        <div className="completion-result">
          <span className="completion-result-label">{COMPLETED_UNDOS_LABEL}</span>
          <strong>{summary.undos}</strong>
        </div>
      </div>
    );
  }

  function renderCompletedScoreBreakdown(state: EngineState) {
    return (
      <div className="completion-breakdown">
        <h3>{COMPLETED_SCORE_BREAKDOWN_TITLE}</h3>

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
    );
  }

  function renderCompletedEconomyPreview() {
    return (
      <div className="completion-economy-preview">
        <h3>{COMPLETED_ECONOMY_PREVIEW_TITLE}</h3>

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
          {COMPLETED_ECONOMY_PREVIEW_NOTE}
        </p>
      </div>
    );
  }

  function renderCompletedReceiptNextActions() {
    return (
      <div className="receipt-next-actions">
        <h3>{completedReceipt.nextActionsTitle}</h3>
        <p>{completedReceipt.nextActionsMessage}</p>

        <p className="receipt-view-status">
          Secondary receipt view:{" "}
          <strong>{formatActiveReceiptView(activeReceiptView)}</strong>
        </p>

        <div className="receipt-next-action-buttons">
          <button onClick={() => handleStartDrawMode(1)}>{newDraw1ActionLabel}</button>
          <button onClick={() => handleStartDrawMode(3)}>{newDraw3ActionLabel}</button>
          <button
            onClick={() => setActiveReceiptView("listing-preview")}
            disabled={isListingPreviewOpen}
          >
            {listingPreviewActionLabel}
          </button>
          <button disabled title={reviewReceiptDisabledReason}>
            {reviewReceiptActionLabel}
          </button>
        </div>
      </div>
    );
  }

  function renderCompletedGameReceipt() {
    return (
      <section className="completion-banner" role="status">
        <h2>{completedReceipt.title}</h2>

        {renderReceiptAuditDetails(completedReceipt)}

        <p className="completion-banner-message">
          {completedReceipt.message}
        </p>

        {renderCompletedResultSummary(summary)}

        {renderCompletedScoreBreakdown(state)}

        {renderCompletedEconomyPreview()}

        {renderCompletedReceiptNextActions()}
      </section>
    );
  }

  function renderListingPreviewReceipt(receipt: typeof listingPreviewReceipt) {
    return (
      <section className="listing-preview-receipt" role="status">
        <h2>{receipt.title}</h2>

        {renderReceiptAuditDetails(receipt)}

        <div className="receipt-details">
          <div className="receipt-id-label">
            Listing action status: {receipt.listingActionStatus}
          </div>
        </div>
        <div className="completion-economy-preview">
          <h3>{receipt.pricingPreview.title}</h3>

          <p className="completion-banner-message">
            Pricing summary: {receipt.pricingPreview.summary}
          </p>

          <h4>Deal value snapshot</h4>

          {renderDealValueSnapshotRows(receipt)}

          <h4>Listing value readiness</h4>

          {renderPricingReadinessRows(receipt.pricingPreview)}

          {renderlistingValuePreviewInput(receipt.pricingPreview)}

          {renderListingDraftPreviewRows(receipt.listingDraftPreview)}

          {renderListingCreationReadinessRows(receipt.listingCreationReadiness)}

          {renderPreviewOnlyListingStateRows(receipt.previewOnlyListingState)}
        </div>

        <p className="completion-banner-message">
          {receipt.note}
        </p>

        {renderListingPreviewActions(receipt)}
      </section>
    );
  }

  function renderListingPreviewActions(receipt: typeof listingPreviewReceipt) {
    return (
      <>
        <div className="receipt-details">
          <div className="receipt-id-label">
            Preview action status: {receipt.listingCreationReadiness.previewActionStatus}
          </div>
          <div className="receipt-id-label">
            Real listing status: {receipt.listingCreationReadiness.realListingStatus}
          </div>
        </div>

        <div className="receipt-next-action-buttons">
          <button
            type="button"
            onClick={() => {
              setPreviewListingSnapshot({
                listingIdLabel: `preview-listing-${seed.slice(0, 8)}`,
                status: "Preview-only listing created locally",
                currentListingValueLabel: listingDraftPreview.currentListingValueLabel,
                drawModeLabel: listingDraftPreview.drawModeLabel,
                valueSteps: listingDraftPreview.valueSteps,
                remainingPercentLabel: listingDraftPreview.remainingPercentLabel,
                walletEffect: previewOnlyListingState.walletEffect,
                escrowEffect: previewOnlyListingState.escrowEffect,
                settlementEffect: previewOnlyListingState.settlementEffect,
              });
              setIsPreviewListingCreated(true);
            }}
            disabled={isPreviewListingCreated}
          >
            {receipt.createListingActionLabel}
          </button>

          {isPreviewListingCreated && (
            <button
              type="button"
              onClick={() => {
                setIsPreviewListingCreated(false);
                setPreviewListingSnapshot(null);
              }}
            >
              Remove Preview Listing
            </button>
          )}

          <button type="button" onClick={clearActiveReceiptView}>
            {receipt.hideActionLabel}
          </button>
        </div>
        {isPreviewListingCreated && (
          <div className="receipt-id-label">
            Preview-only listing has been created locally.
          </div>
        )}
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

  function formatActiveReceiptView(view: ActiveReceiptView) {
    switch (view) {
      case "listing-preview":
        return "Listing preview";
      case null:
        return "None";
      default:
        return view;
    }
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

  function clearSelectedSources() {
    setSelectedTableauSource(null);
    setSelectedFoundationSource(null);
    setSelectedWasteSource(false);
  }

  function resetUiCounters() {
    setUiMoves(0);
    setDrawCount(0);
    setRecycleCount(0);
    setLastAction(null);
  }

  function clearActiveReceiptView() {
    setActiveReceiptView(null);
  }

  // Full UI/session reset for starting or loading a fresh board.
  function resetSessionUi() {
    resetUiCounters();
    clearSelectedSources();
    clearActiveReceiptView();
    setIsPreviewListingCreated(false);
    setPreviewListingSnapshot(null);
  }

  function handleNewGame() {
    const newSeed = makeSeed();
    const fresh = makeInitialState(newSeed, drawMode);

    setSeed(newSeed);
    setState(fresh);

    resetSessionUi();
  }

  function handleStartDrawMode(mode: DrawMode) {
    const newSeed = makeSeed();
    const fresh = makeInitialState(newSeed, mode);

    setDrawMode(mode);
    setSeed(newSeed);
    setState(fresh);

    resetSessionUi();
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

    resetSessionUi();
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
    // Receipt test uses intentional non-zero counters to exercise receipt display.
    // Do not replace this block with resetSessionUi().
    setUiMoves(4);
    setDrawCount(0);
    setRecycleCount(1);
    setLastAction(null);
    clearSelectedSources();
    clearActiveReceiptView();
  }

  function handleResetStats() {
    // Only reset UI counters – leave the engine state alone
    resetUiCounters();
    clearSelectedSources();
    setActiveReceiptView(null);
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
    title: "Game Complete!",
    id: receiptPreviewId,
    dealSeedPreview: `${seed.slice(0, 12)}...`,
    status: "Development preview only — no settlement created",
    settlementStatus: "No settlement created",
    message: `You solved this Draw ${drawMode} deal.`,
    nextActionsTitle: "Next actions",
    nextActionsMessage: `Review this receipt, then start a new Draw ${drawMode} game when ready.`,
  };

  const listingDraftPreview = {
    title: "Future listing draft",
    status: "Preview only — no listing created",
    seedPreview: `${seed.slice(0, 12)}...`,
    drawModeLabel: `Draw ${drawMode}`,
    currentListingValueLabel: formatPreciseMoney(economyRemainingValue),
    valueSteps: economyValueSteps,
    remainingPercentLabel: `${economyRemainingPercent.toFixed(2)}%`,
  };

  const listingCreationReadiness = {
    title: "Listing creation readiness",
    previewActionStatus: "Enabled for local UI testing",
    realListingStatus: "Disabled",
    valueSource: "Current listing value",
    requiredBeforeRealListing:
      "Wallet, escrow, buyer, settlement, and persistence rules",
  };

  const previewOnlyListingState = {
    title: "Preview-only listing state",
    status: isPreviewListingCreated
      ? "Preview-only listing created locally"
      : "Scaffold only — no real listing exists",
    listingIdLabel: isPreviewListingCreated
      ? `preview-listing-${seed.slice(0, 8)}`
      : "Not assigned",
    walletEffect: "None",
    escrowEffect: "None",
    settlementEffect: "None",
  };

  const previewBuyerReadiness = {
    title: "Preview buyer readiness",
    buyerPreviewStatus: "Preview locked",
    purchaseActionStatus: "Locked",
    requiredBeforePurchase:
      "Buyer identity, wallet/escrow rules, ownership transfer, and buyer-game continuation",
    valueSource: "Snapshotted listing value",
    walletEffect: "None",
    escrowEffect: "None",
  };

  const previewBuyerRequirements = {
    title: "Buyer preview requirements",
    listingExists: "Defined in local preview",
    listingValue: "Snapshotted at listing creation",
    buyerIdentity: "Not defined",
    walletDebit: "Not defined",
    escrowCredit: "Not defined",
    ownershipTransfer: "Not defined",
    buyerGameContinuation: "Not defined",
  };

  const previewLockedChecklist = {
    title: "Locked preview checklist",
    note: "Purchase stays locked until these requirements are implemented.",
    checklistSource: previewBuyerRequirements.title,
    buyerIdentity:
      previewBuyerRequirements.buyerIdentity === "Not defined"
        ? "Needed"
        : previewBuyerRequirements.buyerIdentity,
    walletEscrowRules:
      previewBuyerRequirements.walletDebit === "Not defined" ||
        previewBuyerRequirements.escrowCredit === "Not defined"
        ? "Needed"
        : "Ready",
    ownershipTransfer:
      previewBuyerRequirements.ownershipTransfer === "Not defined"
        ? "Needed"
        : previewBuyerRequirements.ownershipTransfer,
    buyerGameHandoff:
      previewBuyerRequirements.buyerGameContinuation === "Not defined"
        ? "Needed"
        : previewBuyerRequirements.buyerGameContinuation,
    purchaseStatus: previewBuyerReadiness.purchaseActionStatus,
  };

  const previewBuyerIdentity = {
    title: "Preview buyer identity",
    buyerAssignment: "Not assigned",
    buyerAccount: "Not connected",
    buyerWallet: "Not connected",
    buyerEligibility: "Not checked",
    identityStatus: "Preview only — no real buyer",
  };

  const previewBuyerWallet = {
    title: "Preview buyer wallet",
    walletConnection: "Not connected",
    availableBalance: "Not checked",
    requiredDebit: "Preview only — not applied",
    debitStatus: "Disabled",
    walletStatus: "Preview only — no funds movement",
  };

  const previewBuyerEscrow = {
    title: "Preview buyer escrow",
    escrowAccount: "Not created",
    escrowCredit: "Preview only — not applied",
    escrowHold: "Not started",
    escrowRelease: "Not defined",
    escrowStatus: "Preview only — no escrow movement",
  };

  const previewBuyerAcceptanceReadiness = {
    title: "Preview buyer acceptance readiness",
    listingAvailable: "Defined in local preview",
    buyerIdentity: "Not ready",
    buyerWallet: "Not ready",
    buyerEscrow: "Not ready",
    purchaseQuote: "Preview only",
    acceptanceStatus: "Locked",
    requiredBeforeAcceptance:
      "Buyer identity, wallet/escrow rules, ownership transfer, and buyer-game continuation",
  };

  const previewBuyerOwnershipTransfer = {
    title: "Preview buyer ownership transfer",
    currentOwner: "Original player",
    futureBuyerOwner: "Not assigned",
    transferTrigger: "Not defined",
    sellerRelease: "Not defined",
    ownershipStatus: "Preview only — no ownership transfer",
  };

  const previewBuyerGameStateHandoff = {
    title: "Preview buyer game-state handoff",
    sourceGameState: "Seller in-progress game",
    buyerGameCopy: "Not created",
    resumePoint: "Not defined",
    playableByBuyer: "Not enabled",
    handoffStatus: "Preview only — no game transfer",
  };

  const previewBuyerGameCopyPreview = {
    title: "Preview buyer game copy",
    buyerGameCopy: "Not created",
    buyerResumePoint: "Not defined",
    buyerPlayableState: "Not enabled",
    requiredBeforePlayable: "Copied game state, resume point, and ownership rules",
    copyStatus: "Preview only — buyer cannot resume or play this listing",
  };

  const previewBuyerHandoffReadiness = {
    title: "Preview buyer handoff readiness",
    sourceGameState: previewBuyerGameStateHandoff.sourceGameState,
    buyerGameCopy: previewBuyerGameStateHandoff.buyerGameCopy,
    resumePoint: previewBuyerGameStateHandoff.resumePoint,
    playableByBuyer: previewBuyerGameStateHandoff.playableByBuyer,
    handoffStatus: "Locked",
  };

  const previewPurchaseButtonDisabled = true;

  const previewPurchaseGuardSummary = {
    title: "Preview purchase guard summary",
    guardActive: "Yes",
    handoffRequirementsComplete: previewBuyerHandoffAllRequirementsComplete
      ? "Yes"
      : "No",
    blockingRequirements: previewBuyerHandoffBlockingRequirements.length,
    blockingRequirementIds: previewBuyerHandoffBlockingRequirementIds.join(", "),
    purchaseButtonState: previewPurchaseButtonDisabled ? "Disabled" : "Enabled",
    disabledReasonCode: previewBuyerHandoffAllRequirementsComplete
      ? PREVIEW_PURCHASE_EXECUTION_DISABLED_REASON
      : HANDOFF_REQUIREMENTS_INCOMPLETE_DISABLED_REASON,
    executionMode: "Preview only",
  };

  const previewMarketplaceCardStatusSummary = {
    purchaseStatus: "Purchase locked",
    buyerGameCopy: "Not created",
    walletEscrow: "None",
    handoffStatus: "Not started",
    purchaseGuard: previewPurchaseGuardSummary.guardActive === "Yes" ? "Active" : "Inactive",
    guardComplete: previewPurchaseGuardSummary.handoffRequirementsComplete,
    blockingRequirements: previewBuyerHandoffBlockingRequirements.length,
    lockReasonCode: BUYER_HANDOFF_NOT_IMPLEMENTED_LOCK_REASON,
  };

  const PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING = "pending";
  const PREVIEW_HANDOFF_PLAN_STEP_STATUS_COMPLETE = "complete";

  const PREVIEW_PURCHASE_HANDOFF_STEP_LISTED_GAME =
    "STEP_LISTED_GAME";
  const PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_PREVIEWS =
    "STEP_BUYER_PREVIEWS";
  const PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_ACCEPTS =
    "STEP_BUYER_ACCEPTS";
  const PREVIEW_PURCHASE_HANDOFF_STEP_WALLET_ESCROW =
    "STEP_WALLET_ESCROW";
  const PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_RECEIVES_GAME =
    "STEP_BUYER_RECEIVES_GAME";



  const previewBuyerHandoffReadinessModel = {
    title: "Buyer handoff readiness model",
    unlockGateComplete: previewBuyerHandoffUnlockGate.gateCurrentlyComplete,
    totalRequirements: previewBuyerHandoffRequirementSummary.totalRequirements,
    remainingRequirements:
      previewBuyerHandoffRequirementSummary.remainingRequirements,
    purchaseGuardActive: previewPurchaseGuardSummary.guardActive,
    purchaseButtonState: previewPurchaseGuardSummary.purchaseButtonState,
    disabledReasonCode: previewPurchaseGuardSummary.disabledReasonCode,
    cardStatusSource: "previewMarketplaceCardStatusSummary",
    readinessStatus: previewBuyerHandoffAllRequirementsComplete
      ? "Ready in scaffold — purchase still preview-disabled"
      : "Locked — buyer handoff requirements incomplete",
  };

  const previewBuyerHandoffReadinessSourceSummary = {
    title: "Readiness model source summary",
    unlockGateSource: "previewBuyerHandoffUnlockGate",
    requirementsSource: "previewBuyerHandoffRequirementSummary",
    purchaseGuardSource: "previewPurchaseGuardSummary",
    marketplaceCardSource: "previewMarketplaceCardStatusSummary",
    blockingRequirementsSource: "previewBuyerHandoffBlockingRequirements",
    completionModeSource: "previewBuyerHandoffCompletionModeSummary",
    executionBoundary: "Preview only — does not enable purchase",
  };

  const previewBuyerHandoffTraceabilityChain = {
    title: "Buyer handoff traceability chain",
    chain:
      "Requirements array → Requirements summary → Completion mode summary → Unlock gate → Purchase guard → Marketplace card summary → Readiness model",
    executionBoundary: "Preview only — does not enable purchase",
  };

  const previewPurchaseState = {
    title: "Preview purchase state",
    status: "Not created",
    buyer: "None",
    walletEffect: "None",
    escrowEffect: "None",
    gameHandoff: "Not started",
    disabledReason: previewBuyerHandoffAllRequirementsComplete
      ? "Buyer handoff requirements are complete, but real purchase execution is still disabled in preview mode"
      : "Buyer handoff requirements are incomplete; preview purchase remains disabled",
    disabledReasonCode: previewBuyerHandoffAllRequirementsComplete
      ? PREVIEW_PURCHASE_EXECUTION_DISABLED_REASON
      : HANDOFF_REQUIREMENTS_INCOMPLETE_DISABLED_REASON,
  };

  const previewPurchaseExecutionLock = {
    title: "Preview purchase execution lock",
    purchaseButton: "Disabled",
    executionStatus: "Locked",
    reason:
      "Real buyer, wallet, escrow, ownership, and game handoff rules are not implemented",
    allowedAction: "View preview only",
    lockStatus: "Preview only — purchase execution unavailable",
    lockReasonCode: BUYER_HANDOFF_NOT_IMPLEMENTED_LOCK_REASON,
  };

  const previewBuyerActionLog = {
    title: "Preview buyer action log",
    lastBuyerAction: previewBuyerActionLogState.lastBuyerAction,
    attemptedPurchase: previewBuyerActionLogState.attemptedPurchase,
    purchaseResult: previewBuyerActionLogState.purchaseResult,
    attemptCount: previewBuyerActionLogState.attemptCount,
    lastActionNote: previewBuyerActionLogState.lastActionNote,
    reason:
      "Buyer identity, wallet/escrow rules, ownership transfer, and buyer-game continuation are not implemented",
    actionLogStatus: previewBuyerActionLogState.actionLogStatus,
    lockReasonCode: previewBuyerActionLogState.lockReasonCode,
  };

  const previewBuyerPurchaseQuote = {
    title: "Preview buyer purchase quote",
    buyerPrice:
      previewListingSnapshot?.currentListingValueLabel ??
      listingDraftPreview.currentListingValueLabel,
    walletDebit: "Preview only — not applied",
    escrowCredit: "Preview only — not applied",
    sellerPayout: "Not defined",
    platformFee: "Not defined",
    quoteStatus: "Preview only — no wallet or escrow movement",
  };

  const previewBuyerHandoff = {
    title: "Buyer handoff preview",
    buyerGameState: "Not created",
    sourceListing: isPreviewListingCreated
      ? `preview-listing-${seed.slice(0, 8)}`
      : "None",
    listedValue:
      previewListingSnapshot?.currentListingValueLabel ??
      listingDraftPreview.currentListingValueLabel,
    handoffStatus: "Not started",
  };

  const PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS = [
    {
      id: PREVIEW_PURCHASE_HANDOFF_STEP_LISTED_GAME,
      label: "1. Listed game",
      status: previewBuyerHandoff.sourceListing,
      stepStatus: PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING,
    },
    {
      id: PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_PREVIEWS,
      label: "2. Buyer previews listing",
      status: `Uses snapshotted value ${previewBuyerHandoff.listedValue}`,
      stepStatus: PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING,
    },
    {
      id: PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_ACCEPTS,
      label: "3. Buyer accepts listing",
      status: "Purchase locked",
      stepStatus: PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING,
    },
    {
      id: PREVIEW_PURCHASE_HANDOFF_STEP_WALLET_ESCROW,
      label: "4. Wallet / escrow update",
      status: "Wallet/escrow rules required",
      stepStatus: PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING,
    },
    {
      id: PREVIEW_PURCHASE_HANDOFF_STEP_BUYER_RECEIVES_GAME,
      label: "5. Buyer receives game",
      status: "Buyer game handoff needed",
      stepStatus: PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING,
    },
  ];

  const PREVIEW_PURCHASE_HANDOFF_PLAN_STATUS =
    "Preview only — no transaction or transfer";

  const previewPurchaseHandoffCompletedSteps =
    PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS.filter(
      (step) => step.stepStatus === PREVIEW_HANDOFF_PLAN_STEP_STATUS_COMPLETE
    ).length;

  const previewPurchaseHandoffPendingSteps =
    PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS.filter(
      (step) => step.stepStatus === PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING
    ).length;

  const previewPurchaseHandoffPlanSummary = {
    title: "Preview handoff plan summary",
    planSteps: PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS.length,
    completedSteps: previewPurchaseHandoffCompletedSteps,
    pendingSteps: previewPurchaseHandoffPendingSteps,
    planStatus: PREVIEW_PURCHASE_HANDOFF_PLAN_STATUS,
  };

  const listingPreviewReceipt = {
    type: "listing-preview" as const,
    label: "Listing preview",
    title: "Listing Value Preview Receipt",
    id: `receipt-listing-preview-${seed.slice(0, 8)}`,
    dealSeedPreview: `${seed.slice(0, 12)}...`,
    status: isPreviewListingCreated
      ? "Development preview only — local preview listing created"
      : "Development preview only — no listing created",
    settlementStatus: "No settlement created",
    listingActionStatus: isPreviewListingCreated
      ? "Preview only — local preview listing created"
      : "Preview only — no listing created",
    note:
      "This is a preview-only marketplace listing receipt. No wallet movement, escrow, sale price, buyer, seller, or marketplace transaction has been created.",
    createListingActionLabel: "List at Current Value",
    hideActionLabel: "Hide Listing Preview",
    entryTier: ECONOMY_ENTRY_TIER,
    payoutPotential: economyPayoutPotential,
    valueSteps: economyValueSteps,
    valueStepRate: ECONOMY_VALUE_STEP_RATE,
    remainingValue: economyRemainingValue,
    remainingPercent: economyRemainingPercent,
    pricingPreview: listingPricingPreview,
    listingDraftPreview,
    listingCreationReadiness,
    previewOnlyListingState,
    previewBuyerReadiness,
    previewPurchaseState,
    previewBuyerHandoff,
  };

  const isListingPreviewOpen = activeReceiptView === "listing-preview";
  const listingPreviewActionLabel = isListingPreviewOpen
    ? "Listing Value Preview Open"
    : "Preview Listing Value";
  const reviewReceiptActionLabel = "Review receipt";
  const reviewReceiptDisabledReason = "Receipt review tools coming later";
  const newDraw1ActionLabel = "New Draw 1 Game";
  const newDraw3ActionLabel = "New Draw 3 Game";

  return (
    <div className="app-root">
      <h1>Solitaire Prototype</h1>

      {summary.completed && renderCompletedGameReceipt()}

      {isListingPreviewOpen && renderListingPreviewReceipt(listingPreviewReceipt)}

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
            <button
              type="button"
              onClick={() => setActiveReceiptView("listing-preview")}
              disabled={isListingPreviewOpen}
            >
              Preview Listing Value
            </button>
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
        {previewListingSnapshot && (
          <section className="app-controls-panel">
            <h2>Preview Marketplace Listings</h2>

            <p className="development-tools-note">
              Preview-only local listing for UI testing. Buyer preview is locked;
              no wallet, escrow, sale, settlement, or game handoff exists.
            </p>

            <div className="economy-preview-grid">
              <div>
                <span>Listing ID</span>
                <strong>{previewListingSnapshot.listingIdLabel}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{previewListingSnapshot.status}</strong>
              </div>
              <div>
                <span>Current listing value</span>
                <strong>{previewListingSnapshot.currentListingValueLabel}</strong>
              </div>
              <div>
                <span>Draw mode</span>
                <strong>{previewListingSnapshot.drawModeLabel}</strong>
              </div>
              <div>
                <span>Wallet effect</span>
                <strong>{previewListingSnapshot.walletEffect}</strong>
              </div>
              <div>
                <span>Escrow effect</span>
                <strong>{previewListingSnapshot.escrowEffect}</strong>
              </div>
              <div>
                <span>Buyer preview</span>
                <strong>Preview locked</strong>
              </div>
              {renderPreviewStatusCardRow(
                "Purchase status",
                previewMarketplaceCardStatusSummary.purchaseStatus
              )}

              {renderPreviewStatusCardRow(
                "Buyer game copy",
                previewMarketplaceCardStatusSummary.buyerGameCopy
              )}

              {renderPreviewStatusCardRow(
                "Wallet / escrow",
                previewMarketplaceCardStatusSummary.walletEscrow
              )}

              {renderPreviewStatusCardRow(
                "Handoff status",
                previewMarketplaceCardStatusSummary.handoffStatus
              )}

              {renderPreviewStatusCardRow(
                "Purchase guard",
                previewMarketplaceCardStatusSummary.purchaseGuard
              )}

              {renderPreviewStatusCardRow(
                "Guard complete",
                previewMarketplaceCardStatusSummary.guardComplete
              )}

              {renderPreviewStatusCardRow(
                "Blocking requirements",
                previewMarketplaceCardStatusSummary.blockingRequirements
              )}

              {renderPreviewStatusCardRow(
                "Lock reason code",
                previewMarketplaceCardStatusSummary.lockReasonCode,
                { fullWidth: true, wrapValue: true }
              )}
            </div>
            <div className="app-controls">
              <button
                type="button"
                onClick={() => setIsPreviewListingDetailOpen(true)}
                disabled={isPreviewListingDetailOpen}
              >
                View Locked Preview
              </button>
            </div>
            {isPreviewListingDetailOpen && (
              <div className="listing-value-preview-input">
                <div className="listing-value-preview-input-title">
                  Preview listing detail
                </div>

                <div className="preview-detail-note">
                  All buyer-side rows are preview scaffolds. No buyer, wallet, escrow,
                  purchase, ownership transfer, or game handoff is created.
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffReadinessModel.title}
                </div>

                {renderPreviewDetailRow(
                  "Unlock gate complete",
                  previewBuyerHandoffReadinessModel.unlockGateComplete
                )}

                {renderPreviewDetailRow(
                  "Total requirements",
                  previewBuyerHandoffReadinessModel.totalRequirements
                )}

                {renderPreviewDetailRow(
                  "Remaining requirements",
                  previewBuyerHandoffReadinessModel.remainingRequirements
                )}

                {renderPreviewDetailRow(
                  "Purchase guard active",
                  previewBuyerHandoffReadinessModel.purchaseGuardActive
                )}

                {renderPreviewDetailRow(
                  "Purchase button state",
                  previewBuyerHandoffReadinessModel.purchaseButtonState
                )}

                {renderPreviewDetailRow(
                  "Disabled reason code",
                  previewBuyerHandoffReadinessModel.disabledReasonCode
                )}

                {renderPreviewDetailRow(
                  "Card status source",
                  previewBuyerHandoffReadinessModel.cardStatusSource
                )}

                {renderPreviewDetailRow(
                  "Readiness status",
                  previewBuyerHandoffReadinessModel.readinessStatus
                )}

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffReadinessSourceSummary.title}
                </div>

                {renderPreviewDetailRow(
                  "Unlock gate source",
                  previewBuyerHandoffReadinessSourceSummary.unlockGateSource
                )}

                {renderPreviewDetailRow(
                  "Requirements source",
                  previewBuyerHandoffReadinessSourceSummary.requirementsSource
                )}

                {renderPreviewDetailRow(
                  "Purchase guard source",
                  previewBuyerHandoffReadinessSourceSummary.purchaseGuardSource
                )}

                {renderPreviewDetailRow(
                  "Marketplace card source",
                  previewBuyerHandoffReadinessSourceSummary.marketplaceCardSource
                )}

                {renderPreviewDetailRow(
                  "Blocking requirements source",
                  previewBuyerHandoffReadinessSourceSummary.blockingRequirementsSource
                )}

                {renderPreviewDetailRow(
                  "Completion mode source",
                  previewBuyerHandoffReadinessSourceSummary.completionModeSource
                )}

                {renderPreviewDetailRow(
                  "Execution boundary",
                  previewBuyerHandoffReadinessSourceSummary.executionBoundary
                )}

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffTraceabilityChain.title}
                </div>

                {renderPreviewDetailRow(
                  "Chain",
                  previewBuyerHandoffTraceabilityChain.chain
                )}

                {renderPreviewDetailRow(
                  "Execution boundary",
                  previewBuyerHandoffTraceabilityChain.executionBoundary
                )}

                <div className="listing-value-preview-input-title">
                  Buyer preview summary
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer preview</span>
                  <strong>Locked preview only</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase action</span>
                  <strong>Disabled</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer game copy</span>
                  <strong>Not created</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet / escrow movement</span>
                  <strong>None</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Listing value</span>
                  <strong>Snapshotted at listing creation</strong>
                </div>

                <div className="listing-value-preview-group-title">
                  {previewLockedChecklist.title}
                </div>

                <div className="receipt-id-label">{previewLockedChecklist.note}</div>

                {renderPreviewDetailRow("Checklist source", previewLockedChecklist.checklistSource)}

                {renderPreviewDetailRow("Buyer identity", previewLockedChecklist.buyerIdentity)}

                {renderPreviewDetailRow(
                  "Wallet/escrow rules",
                  previewLockedChecklist.walletEscrowRules
                )}

                {renderPreviewDetailRow(
                  "Ownership transfer",
                  previewLockedChecklist.ownershipTransfer
                )}

                {renderPreviewDetailRow(
                  "Buyer game handoff",
                  previewLockedChecklist.buyerGameHandoff
                )}

                {renderPreviewDetailRow("Purchase status", previewLockedChecklist.purchaseStatus)}

                <div className="listing-value-preview-group-title">
                  Listing snapshot
                </div>

                <div className="completion-breakdown-row">
                  <span>Listing ID</span>
                  <strong>{previewListingSnapshot.listingIdLabel}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Status</span>
                  <strong>{previewListingSnapshot.status}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Listed value</span>
                  <strong>{previewListingSnapshot.currentListingValueLabel}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Draw mode</span>
                  <strong>{previewListingSnapshot.drawModeLabel}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Value steps at listing</span>
                  <strong>{previewListingSnapshot.valueSteps}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Remaining % at listing</span>
                  <strong>{previewListingSnapshot.remainingPercentLabel}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet effect</span>
                  <strong>{previewListingSnapshot.walletEffect}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow effect</span>
                  <strong>{previewListingSnapshot.escrowEffect}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Settlement effect</span>
                  <strong>{previewListingSnapshot.settlementEffect}</strong>
                </div>

                <div className="listing-value-preview-group-title">
                  Buyer-side preview path
                </div>

                <div className="listing-value-preview-input-title">
                  Buyer preview readiness
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer preview status</span>
                  <strong>{previewBuyerReadiness.buyerPreviewStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase action status</span>
                  <strong>{previewBuyerReadiness.purchaseActionStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Required before purchase</span>
                  <strong>{previewBuyerReadiness.requiredBeforePurchase}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Value source</span>
                  <strong>{previewBuyerReadiness.valueSource}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet effect</span>
                  <strong>{previewBuyerReadiness.walletEffect}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow effect</span>
                  <strong>{previewBuyerReadiness.escrowEffect}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerRequirements.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Listing exists</span>
                  <strong>{previewBuyerRequirements.listingExists}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Listing value</span>
                  <strong>{previewBuyerRequirements.listingValue}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer identity</span>
                  <strong>{previewBuyerRequirements.buyerIdentity}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet debit</span>
                  <strong>{previewBuyerRequirements.walletDebit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow credit</span>
                  <strong>{previewBuyerRequirements.escrowCredit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Ownership transfer</span>
                  <strong>{previewBuyerRequirements.ownershipTransfer}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer game continuation</span>
                  <strong>{previewBuyerRequirements.buyerGameContinuation}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerIdentity.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer assignment</span>
                  <strong>{previewBuyerIdentity.buyerAssignment}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer account</span>
                  <strong>{previewBuyerIdentity.buyerAccount}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer wallet</span>
                  <strong>{previewBuyerIdentity.buyerWallet}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer eligibility</span>
                  <strong>{previewBuyerIdentity.buyerEligibility}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Identity status</span>
                  <strong>{previewBuyerIdentity.identityStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerWallet.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet connection</span>
                  <strong>{previewBuyerWallet.walletConnection}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Available balance</span>
                  <strong>{previewBuyerWallet.availableBalance}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Required debit</span>
                  <strong>{previewBuyerWallet.requiredDebit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Debit status</span>
                  <strong>{previewBuyerWallet.debitStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet status</span>
                  <strong>{previewBuyerWallet.walletStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerEscrow.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow account</span>
                  <strong>{previewBuyerEscrow.escrowAccount}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow credit</span>
                  <strong>{previewBuyerEscrow.escrowCredit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow hold</span>
                  <strong>{previewBuyerEscrow.escrowHold}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow release</span>
                  <strong>{previewBuyerEscrow.escrowRelease}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow status</span>
                  <strong>{previewBuyerEscrow.escrowStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerAcceptanceReadiness.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Listing available</span>
                  <strong>{previewBuyerAcceptanceReadiness.listingAvailable}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer identity</span>
                  <strong>{previewBuyerAcceptanceReadiness.buyerIdentity}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer wallet</span>
                  <strong>{previewBuyerAcceptanceReadiness.buyerWallet}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer escrow</span>
                  <strong>{previewBuyerAcceptanceReadiness.buyerEscrow}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase quote</span>
                  <strong>{previewBuyerAcceptanceReadiness.purchaseQuote}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Acceptance status</span>
                  <strong>{previewBuyerAcceptanceReadiness.acceptanceStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Required before acceptance</span>
                  <strong>{previewBuyerAcceptanceReadiness.requiredBeforeAcceptance}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerOwnershipTransfer.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Current owner</span>
                  <strong>{previewBuyerOwnershipTransfer.currentOwner}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Future buyer owner</span>
                  <strong>{previewBuyerOwnershipTransfer.futureBuyerOwner}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Transfer trigger</span>
                  <strong>{previewBuyerOwnershipTransfer.transferTrigger}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Seller release</span>
                  <strong>{previewBuyerOwnershipTransfer.sellerRelease}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Ownership status</span>
                  <strong>{previewBuyerOwnershipTransfer.ownershipStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffReadiness.title}
                </div>

                {renderPreviewDetailRow(
                  "Source game state",
                  previewBuyerHandoffReadiness.sourceGameState
                )}

                {renderPreviewDetailRow(
                  "Buyer game copy",
                  previewBuyerHandoffReadiness.buyerGameCopy
                )}

                {renderPreviewDetailRow("Resume point", previewBuyerHandoffReadiness.resumePoint)}

                {renderPreviewDetailRow(
                  "Playable by buyer",
                  previewBuyerHandoffReadiness.playableByBuyer
                )}

                {renderPreviewDetailRow("Handoff status", previewBuyerHandoffReadiness.handoffStatus)}

                <div className="listing-value-preview-input-title">
                  {previewBuyerGameStateHandoff.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Source game state</span>
                  <strong>{previewBuyerGameStateHandoff.sourceGameState}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer game copy</span>
                  <strong>{previewBuyerGameStateHandoff.buyerGameCopy}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Resume point</span>
                  <strong>{previewBuyerGameStateHandoff.resumePoint}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Playable by buyer</span>
                  <strong>{previewBuyerGameStateHandoff.playableByBuyer}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Handoff status</span>
                  <strong>{previewBuyerGameStateHandoff.handoffStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerGameCopyPreview.title}
                </div>

                {renderPreviewDetailRow("Buyer game copy", previewBuyerGameCopyPreview.buyerGameCopy)}

                {renderPreviewDetailRow(
                  "Buyer resume point",
                  previewBuyerGameCopyPreview.buyerResumePoint
                )}

                {renderPreviewDetailRow(
                  "Buyer playable state",
                  previewBuyerGameCopyPreview.buyerPlayableState
                )}

                {renderPreviewDetailRow(
                  "Required before playable",
                  previewBuyerGameCopyPreview.requiredBeforePlayable
                )}

                {renderPreviewDetailRow("Copy status", previewBuyerGameCopyPreview.copyStatus)}

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffUnlockGate.title}
                </div>

                {renderPreviewDetailRow(
                  "Gate exists",
                  previewBuyerHandoffUnlockGate.gateExists
                )}

                {renderPreviewDetailRow(
                  "Gate currently complete",
                  previewBuyerHandoffUnlockGate.gateCurrentlyComplete
                )}

                {renderPreviewDetailRow(
                  "Gate source",
                  previewBuyerHandoffUnlockGate.gateSource
                )}

                {renderPreviewDetailRow(
                  "Purchase effect",
                  previewBuyerHandoffUnlockGate.purchaseEffect
                )}

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffRequirementSummary.title}
                </div>

                {renderPreviewDetailRow(
                  "Total requirements",
                  previewBuyerHandoffRequirementSummary.totalRequirements
                )}

                {renderPreviewDetailRow(
                  "Implemented requirements",
                  previewBuyerHandoffRequirementSummary.implementedRequirements
                )}

                {renderPreviewDetailRow(
                  "Remaining requirements",
                  previewBuyerHandoffRequirementSummary.remainingRequirements
                )}

                {renderPreviewDetailRow(
                  "Requirement status",
                  previewBuyerHandoffRequirementSummary.requirementStatus
                )}

                <div className="listing-value-preview-input-title">
                  {previewBuyerHandoffCompletionModeSummary.title}
                </div>

                {renderPreviewDetailRow(
                  "manual_future requirements",
                  previewBuyerHandoffCompletionModeSummary.manualFutureRequirements
                )}

                <div className="listing-value-preview-input-title">
                  Buyer handoff blockers
                </div>

                {PREVIEW_BUYER_HANDOFF_REQUIREMENTS.map((requirement) => (
                  <Fragment key={requirement.id}>
                    {renderPreviewDetailRow(requirement.label, requirement.status)}
                    {renderPreviewDetailRow("Requirement ID", requirement.id)}
                    {renderPreviewDetailRow("Completion mode", requirement.completionMode)}
                  </Fragment>
                ))}

                <div className="listing-value-preview-group-title">
                  Purchase and handoff preview
                </div>

                <div className="listing-value-preview-input-title">
                  {previewPurchaseGuardSummary.title}
                </div>

                {renderPreviewDetailRow("Guard active", previewPurchaseGuardSummary.guardActive)}

                {renderPreviewDetailRow(
                  "Handoff requirements complete",
                  previewPurchaseGuardSummary.handoffRequirementsComplete
                )}

                {renderPreviewDetailRow(
                  "Blocking requirements",
                  previewPurchaseGuardSummary.blockingRequirements
                )}

                {renderPreviewDetailRow(
                  "Blocking requirement IDs",
                  previewPurchaseGuardSummary.blockingRequirementIds
                )}

                {renderPreviewDetailRow(
                  "Purchase button state",
                  previewPurchaseGuardSummary.purchaseButtonState
                )}

                {renderPreviewDetailRow(
                  "Disabled reason code",
                  previewPurchaseGuardSummary.disabledReasonCode
                )}

                {renderPreviewDetailRow(
                  "Execution mode",
                  previewPurchaseGuardSummary.executionMode
                )}

                <div className="listing-value-preview-input-title">
                  Preview purchase state
                </div>

                <div className="completion-breakdown-row">
                  <span>Status</span>
                  <strong>{previewPurchaseState.status}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer</span>
                  <strong>{previewPurchaseState.buyer}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet effect</span>
                  <strong>{previewPurchaseState.walletEffect}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow effect</span>
                  <strong>{previewPurchaseState.escrowEffect}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Game handoff</span>
                  <strong>{previewPurchaseState.gameHandoff}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase disabled reason</span>
                  <strong>{previewPurchaseState.disabledReason}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase disabled reason code</span>
                  <strong>{previewPurchaseState.disabledReasonCode}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewPurchaseExecutionLock.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Purchase button</span>
                  <strong>{previewPurchaseExecutionLock.purchaseButton}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Execution status</span>
                  <strong>{previewPurchaseExecutionLock.executionStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Reason</span>
                  <strong>{previewPurchaseExecutionLock.reason}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Allowed action</span>
                  <strong>{previewPurchaseExecutionLock.allowedAction}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Lock status</span>
                  <strong>{previewPurchaseExecutionLock.lockStatus}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Lock reason code</span>
                  <strong>{previewPurchaseExecutionLock.lockReasonCode}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  {previewBuyerActionLog.title}
                </div>

                {renderPreviewDetailRow("Last buyer action", previewBuyerActionLog.lastBuyerAction)}

                {renderPreviewDetailRow(
                  "Attempted purchase",
                  previewBuyerActionLog.attemptedPurchase
                )}

                {renderPreviewDetailRow("Purchase result", previewBuyerActionLog.purchaseResult)}

                {renderPreviewDetailRow("Attempt count", previewBuyerActionLog.attemptCount)}

                {renderPreviewDetailRow("Last action note", previewBuyerActionLog.lastActionNote)}

                {renderPreviewDetailRow("Reason", previewBuyerActionLog.reason)}

                {renderPreviewDetailRow("Action log status", previewBuyerActionLog.actionLogStatus)}

                {renderPreviewDetailRow("Lock reason code", previewBuyerActionLog.lockReasonCode)}

                <div className="listing-value-preview-input-title">
                  {previewBuyerPurchaseQuote.title}
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer price</span>
                  <strong>{previewBuyerPurchaseQuote.buyerPrice}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Wallet debit</span>
                  <strong>{previewBuyerPurchaseQuote.walletDebit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Escrow credit</span>
                  <strong>{previewBuyerPurchaseQuote.escrowCredit}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Seller payout</span>
                  <strong>{previewBuyerPurchaseQuote.sellerPayout}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Platform fee</span>
                  <strong>{previewBuyerPurchaseQuote.platformFee}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Quote status</span>
                  <strong>{previewBuyerPurchaseQuote.quoteStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  Buyer handoff preview
                </div>

                <div className="completion-breakdown-row">
                  <span>Buyer game state</span>
                  <strong>{previewBuyerHandoff.buyerGameState}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Source listing</span>
                  <strong>{previewBuyerHandoff.sourceListing}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Listed value</span>
                  <strong>{previewBuyerHandoff.listedValue}</strong>
                </div>

                <div className="completion-breakdown-row">
                  <span>Handoff status</span>
                  <strong>{previewBuyerHandoff.handoffStatus}</strong>
                </div>

                <div className="listing-value-preview-input-title">
                  Preview purchase handoff plan
                </div>

                <div className="listing-value-preview-input-title">
                  {previewPurchaseHandoffPlanSummary.title}
                </div>

                {renderPreviewDetailRow(
                  "Plan steps",
                  previewPurchaseHandoffPlanSummary.planSteps
                )}

                {renderPreviewDetailRow(
                  "Completed steps",
                  previewPurchaseHandoffPlanSummary.completedSteps
                )}

                {renderPreviewDetailRow(
                  "Pending steps",
                  previewPurchaseHandoffPlanSummary.pendingSteps
                )}

                {renderPreviewDetailRow(
                  "Plan status",
                  previewPurchaseHandoffPlanSummary.planStatus
                )}

                {PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS.map((step) => (
                  <Fragment key={step.id}>
                    {renderPreviewDetailRow(step.label, step.status)}
                    {renderPreviewDetailRow("Step ID", step.id)}
                  </Fragment>
                ))}

                {renderPreviewDetailRow(
                  "Plan status",
                  PREVIEW_PURCHASE_HANDOFF_PLAN_STATUS
                )}

                <div className="app-controls">
                  <button type="button" disabled={previewPurchaseButtonDisabled}>
                    Preview Purchase
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewBuyerActionLogState(LOCKED_PREVIEW_BUYER_ACTION_LOG_STATE)
                    }
                  >
                    Record Locked Attempt
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewBuyerActionLogState(DEFAULT_PREVIEW_BUYER_ACTION_LOG_STATE)
                    }
                  >
                    Clear Action Log
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewListingDetailOpen(false)}
                  >
                    Close Listing Detail
                  </button>
                </div>
                <div className="receipt-id-label">
                  Preview Purchase is locked. Buyer handoff gate currently
                  complete: {previewBuyerHandoffUnlockGate.gateCurrentlyComplete}.
                  Gate source: {previewBuyerHandoffUnlockGate.gateSource}. Reason code:{" "}
                  {previewPurchaseState.disabledReasonCode}.{" "}
                  {previewBuyerHandoffUnlockGate.purchaseEffect}. Record Locked
                  Attempt updates the preview log only; no buyer, wallet, escrow,
                  sale, settlement, ownership transfer, or game handoff is created.
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
