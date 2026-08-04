import { describe, expect, it } from "vitest";
import { init } from "../../engine/src/api";
import { buildBuyerGameCopyPayloadV1 } from "../src/buyerGameCopy";

describe("buildBuyerGameCopyPayloadV1", () => {
  it("builds the seven-field payload and resets buyer undo state", () => {
    const engineStateSnapshot = init({
      seed: "0123456789abcdef0123456789abcdef",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    engineStateSnapshot.tick = 7;
    engineStateSnapshot.undos = 2;
    engineStateSnapshot.history = [
      {
        tick: 6,
        stock: engineStateSnapshot.stock.slice(),
        waste: engineStateSnapshot.waste.slice(),
        tableau: engineStateSnapshot.tableau.map((pile) => pile.slice()),
        tableauFaceUp: engineStateSnapshot.tableauFaceUp?.slice(),
        foundations: engineStateSnapshot.foundations.map((pile) =>
          pile.slice()
        ),
        score: engineStateSnapshot.score,
        scoreBreakdown: { ...engineStateSnapshot.scoreBreakdown },
      },
    ];

    const payload = buildBuyerGameCopyPayloadV1(
      {
        listingIdLabel: "PREVIEW-LISTING-001",
        status: "Preview listing created",
        engineStateSnapshot,
        currentListingValueLabel: "$1.25",
        valueSteps: 9,
        remainingPercentLabel: "82%",
      },
      "buyer-account-123"
    );

    expect(Object.keys(payload)).toHaveLength(7);
    expect(payload.rulesetDrawMode).toEqual({
      ruleset: "classic_v1",
      drawMode: 3,
    });
    expect(payload.sourceListing).toEqual({
      listingIdLabel: "PREVIEW-LISTING-001",
      status: "Preview listing created",
    });
    expect(payload.listingValue).toEqual({
      currentListingValueLabel: "$1.25",
      valueSteps: 9,
      remainingPercentLabel: "82%",
    });
    expect(payload.resumePoint).toEqual({
      exactFrozenListingPosition: true,
      buyerUndoHistoryStartsEmpty: true,
      buyerUndosStartAt: 0,
    });
    expect(payload.ownershipTarget).toEqual({
      authenticatedBuyerAccountId: "buyer-account-123",
    });
    expect(payload.schemaVersion).toBe("buyer-game-copy-v1");

    expect(payload.engineState.tick).toBe(7);
    expect(payload.engineState.history).toEqual([]);
    expect(payload.engineState.undos).toBe(0);

    expect(engineStateSnapshot.history).toHaveLength(1);
    expect(engineStateSnapshot.undos).toBe(2);
  });

  it("deep-clones the frozen engine state", () => {
    const engineStateSnapshot = init({
      seed: "fedcba9876543210fedcba9876543210",
      ruleset: "classic_v1",
      drawCount: 1,
    });

    const payload = buildBuyerGameCopyPayloadV1(
      {
        listingIdLabel: "PREVIEW-LISTING-002",
        status: "Preview listing created",
        engineStateSnapshot,
        currentListingValueLabel: "$0.75",
        valueSteps: 4,
        remainingPercentLabel: "91%",
      },
      "buyer-account-456"
    );

    expect(payload.engineState).not.toBe(engineStateSnapshot);
    expect(payload.engineState.stock).not.toBe(engineStateSnapshot.stock);
    expect(payload.engineState.tableau).not.toBe(engineStateSnapshot.tableau);
    expect(payload.engineState.tableau[0]).not.toBe(
      engineStateSnapshot.tableau[0]
    );
    expect(payload.engineState.scoreBreakdown).not.toBe(
      engineStateSnapshot.scoreBreakdown
    );

    const sourceStockLength = engineStateSnapshot.stock.length;
    payload.engineState.stock.pop();

    expect(engineStateSnapshot.stock).toHaveLength(sourceStockLength);
  });
});