import { describe, it, expect } from "vitest";
import { init, legalMoves, applyMove } from "../src/api";
import { rank, suit } from "../src/cards"; // keep if the file already had it


// Helpers to build specific cards by suit/rank
const ID = (suitIdx: 0|1|2|3, rank1to13: number) => suitIdx*13 + (rank1to13 - 1);

describe("tableau → tableau: move descending/alternating tails; King to empty", () => {
  it("moves a valid tail onto a suitable destination (alternating, descending)", () => {
    let s = init({ seed: "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f", ruleset: "classic_v1" });

    const KD = ID(1,13), QC = ID(0,12), JD = ID(1,11), TC = ID(0,10);
    s = {
      ...s,
      tableau: [
        [KD],               // dest
        [QC, JD, TC],       // source (valid tail)
        [], [], [], [], []
      ],
      stock: [],
      waste: [],
      foundations: [[],[],[],[]],
    };

    const m = legalMoves(s).find(x =>
      x.type === "move_tt" && x.fromPile === 1 && (x as any).fromIndex === 0 && x.toPile === 0
    );
    expect(m).toBeTruthy();

    const s2 = applyMove(s, m as any);
    expect(s2.tick).toBe(s.tick + 1);
    expect(s2.tableau[1].length).toBe(0);
    expect(s2.tableau[0].length).toBe(4);
    expect(s2.tableau[0][1]).toBe(QC);
    expect(s2.tableau[0][3]).toBe(TC);
  });

  it("allows moving a single King onto an empty tableau pile", () => {
    let s = init({ seed: "ffffffffffffffffffffffffffffffff", ruleset: "classic_v1" });
    const KC = ID(0,13);
    s = {
      ...s,
      tableau: [
        [],                // empty destination
        [KC],              // source with a single King
        [], [], [], [], []
      ],
      stock: [],
      waste: [],
      foundations: [[],[],[],[]],
    };

    const m = legalMoves(s).find(x => x.type === "move_tt" && x.fromPile === 1 && (x as any).fromIndex === 0 && x.toPile === 0);
    expect(m).toBeTruthy();

    const s2 = applyMove(s, m as any);
    expect(s2.tableau[0].length).toBe(1);
    expect(s2.tableau[0][0]).toBe(KC);
    expect(s2.tableau[1].length).toBe(0);
  });

  it("does not list a move from a non-descending/alternating tail to the destination", () => {
    let s = init({ seed: "ffffffffffffffffffffffffffffffff", ruleset: "classic_v1" });
    // Bad tail: Q♣, J♣ (same color) aiming for K♦ on dest
    const QC = ID(0,12), JC = ID(0,11), KD = ID(1,13);
    s = {
      ...s,
      tableau: [
        [KD],          // destination
        [QC, JC],      // invalid tail (same color, not alternating)
        [], [], [], [], []
      ],
      stock: [],
      waste: [],
      foundations: [[],[],[],[]],
    };
    // Specifically: there should be NO move from pile 1 to pile 0 at either index 0 or 1
    const ttBad = legalMoves(s).filter(x => x.type === "move_tt" && x.fromPile === 1 && x.toPile === 0);
    expect(ttBad.length).toBe(0);
  });
});
