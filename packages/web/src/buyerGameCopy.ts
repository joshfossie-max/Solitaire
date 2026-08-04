import { cloneEngineState } from "../../engine/src/api";

type EngineState = Parameters<typeof cloneEngineState>[0];
type DrawMode = 1 | 3;

export type BuyerGameCopySourceSnapshot = {
  listingIdLabel: string;
  status: string;
  engineStateSnapshot: EngineState;
  currentListingValueLabel: string;
  valueSteps: number;
  remainingPercentLabel: string;
};

export type BuyerGameCopyPayloadV1 = {
  engineState: EngineState;
  rulesetDrawMode: {
    ruleset: "classic_v1";
    drawMode: DrawMode;
  };
  sourceListing: {
    listingIdLabel: string;
    status: string;
  };
  listingValue: {
    currentListingValueLabel: string;
    valueSteps: number;
    remainingPercentLabel: string;
  };
  resumePoint: {
    exactFrozenListingPosition: true;
    buyerUndoHistoryStartsEmpty: true;
    buyerUndosStartAt: 0;
  };
  ownershipTarget: {
    authenticatedBuyerAccountId: string;
  };
  schemaVersion: "buyer-game-copy-v1";
};

export function buildBuyerGameCopyPayloadV1(
  listingSnapshot: BuyerGameCopySourceSnapshot,
  authenticatedBuyerAccountId: string
): BuyerGameCopyPayloadV1 {
  const frozenEngineState = cloneEngineState(
    listingSnapshot.engineStateSnapshot
  );

  const buyerEngineState: EngineState = {
    ...frozenEngineState,
    history: [],
    undos: 0,
  };

  return {
    engineState: buyerEngineState,
    rulesetDrawMode: {
      ruleset: buyerEngineState.ruleset,
      drawMode: buyerEngineState.drawCount,
    },
    sourceListing: {
      listingIdLabel: listingSnapshot.listingIdLabel,
      status: listingSnapshot.status,
    },
    listingValue: {
      currentListingValueLabel: listingSnapshot.currentListingValueLabel,
      valueSteps: listingSnapshot.valueSteps,
      remainingPercentLabel: listingSnapshot.remainingPercentLabel,
    },
    resumePoint: {
      exactFrozenListingPosition: true,
      buyerUndoHistoryStartsEmpty: true,
      buyerUndosStartAt: 0,
    },
    ownershipTarget: {
      authenticatedBuyerAccountId,
    },
    schemaVersion: "buyer-game-copy-v1",
  };
}