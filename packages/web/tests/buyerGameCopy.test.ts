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
      {
        authenticatedBuyerAccountId: "buyer-account-123",
        purchaseSettlementConfirmed: true,
        ownershipTransferConfirmed: true,
      }
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
      {
        authenticatedBuyerAccountId: "buyer-account-456",
        purchaseSettlementConfirmed: true,
        ownershipTransferConfirmed: true,
      }
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
  it("rejects payload creation before purchase settlement is confirmed", () => {
    const engineStateSnapshot = init({
      seed: "11111111111111111111111111111111",
      ruleset: "classic_v1",
      drawCount: 1,
    });

    expect(() =>
      buildBuyerGameCopyPayloadV1(
        {
          listingIdLabel: "PREVIEW-LISTING-003",
          status: "Preview listing created",
          engineStateSnapshot,
          currentListingValueLabel: "$1.00",
          valueSteps: 5,
          remainingPercentLabel: "88%",
        },
        {
          authenticatedBuyerAccountId: "buyer-account-789",
          purchaseSettlementConfirmed: false,
          ownershipTransferConfirmed: true,
        }
      )
    ).toThrow(
      "Buyer game copy requires confirmed purchase settlement and ownership transfer"
    );
  });

  it("rejects payload creation before ownership transfer is confirmed", () => {
    const engineStateSnapshot = init({
      seed: "22222222222222222222222222222222",
      ruleset: "classic_v1",
      drawCount: 3,
    });

    expect(() =>
      buildBuyerGameCopyPayloadV1(
        {
          listingIdLabel: "PREVIEW-LISTING-004",
          status: "Preview listing created",
          engineStateSnapshot,
          currentListingValueLabel: "$1.50",
          valueSteps: 7,
          remainingPercentLabel: "79%",
        },
        {
          authenticatedBuyerAccountId: "buyer-account-987",
          purchaseSettlementConfirmed: true,
          ownershipTransferConfirmed: false,
        }
      )
    ).toThrow(
      "Buyer game copy requires confirmed purchase settlement and ownership transfer"
    );
  });

  it("rejects payload creation without an authenticated buyer account ID", () => {
    const engineStateSnapshot = init({
      seed: "33333333333333333333333333333333",
      ruleset: "classic_v1",
      drawCount: 1,
    });

    expect(() =>
      buildBuyerGameCopyPayloadV1(
        {
          listingIdLabel: "PREVIEW-LISTING-005",
          status: "Preview listing created",
          engineStateSnapshot,
          currentListingValueLabel: "$1.10",
          valueSteps: 6,
          remainingPercentLabel: "85%",
        },
        {
          authenticatedBuyerAccountId: "   ",
          purchaseSettlementConfirmed: true,
          ownershipTransferConfirmed: true,
        }
      )
    ).toThrow(
      "Buyer game copy requires an authenticated buyer account ID"
    );
  });
});
