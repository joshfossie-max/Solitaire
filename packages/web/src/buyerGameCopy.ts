import { cloneEngineState } from "../../engine/src/api";

export const BUYER_GAME_COPY_SCHEMA_VERSION = "buyer-game-copy-v1" as const;
export const BUYER_GAME_COPY_RESUME_RULE =
  "Exact frozen listing position; buyer undo history starts empty and buyer undos start at 0";

export const BUYER_GAME_COPY_RESUME_POINT = {
  exactFrozenListingPosition: true,
  buyerUndoHistoryStartsEmpty: true,
  buyerUndosStartAt: 0,
} as const;

export const BUYER_GAME_COPY_OWNERSHIP_TARGET_RULE =
  "Authenticated buyer account from the successfully settled purchase; assigned only after ownership transfer confirmation";

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
  resumePoint: typeof BUYER_GAME_COPY_RESUME_POINT;
  ownershipTarget: {
    authenticatedBuyerAccountId: string;
  };
  schemaVersion: typeof BUYER_GAME_COPY_SCHEMA_VERSION;
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
      ...BUYER_GAME_COPY_RESUME_POINT,
    },
    ownershipTarget: {
      authenticatedBuyerAccountId,
    },
    schemaVersion: BUYER_GAME_COPY_SCHEMA_VERSION,
  };
}
