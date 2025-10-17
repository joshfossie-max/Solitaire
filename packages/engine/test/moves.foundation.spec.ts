import { describe, it, expect } from "vitest";
import { init } from "../src/engine";
import { legalMoves, applyMove } from "../src/moves";

// card id helper (suit 0..3, rank 1..13)
const ID = (suitIdx: 0|1|2|3, rank1to13: number) => suitIdx*13 + (rank1to13 - 1);

describe("tableau → foundation", () => {
  it("allows moving an Ace from tableau to empty foundation of same suit", () => {
    let s = init({ seed: "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f", ruleset: "classic_v1" });
    const AC = ID(0,1); // Ace of clubs
    s = {
      ...s,
      tableau: [[AC], [], [], [], [], [], []],
      foundations: [[],[],[],[]],
      stock: [],
      waste: [],
    };

    const m = legalMoves(s).find(x => x.type === "move_tf" && (x as any).fromPile === 0)!;
    expect(m).toBeTruthy();

    const s2 = applyMove(s, m as any);
    expect(s2.tick).toBe(s.tick + 1);
    expect(s2.tableau[0].length).toBe(0);
    expect(s2.foundations[0].length).toBe(1);
    expect(s2.foundations[0][0]).toBe(AC);
  });

  it("allows moving the next rank of the same suit to its foundation (e.g., 2♥ on A♥)", () => {
    let s = init({ seed: "ffffffffffffffffffffffffffffffff", ruleset: "classic_v1" });
    const AH = ID(2,1), TWOH = ID(2,2); // hearts suit index = 2
    s = {
      ...s,
      tableau: [[TWOH], [], [], [], [], [], []],
      foundations: [[],[],[AH],[]], // hearts foundation has Ace
      stock: [],
      waste: [],
    };

    const m = legalMoves(s).find(x => x.type === "move_tf" && (x as any).fromPile === 0)!;
    expect(m).toBeTruthy();

    const s2 = applyMove(s, m as any);
    expect(s2.tableau[0].length).toBe(0);
    expect(s2.foundations[2].length).toBe(2);
    expect(s2.foundations[2][1]).toBe(TWOH);
  });

  it("does NOT allow moving a non-Ace to an empty foundation or wrong suit/rank", () => {
    let s = init({ seed: "ffffffffffffffffffffffffffffffff", ruleset: "classic_v1" });
    const TWOH = ID(2,2), KD = ID(1,13);
    s = {
      ...s,
      tableau: [[TWOH], [KD], [], [], [], [], []],
      foundations: [[],[],[],[]], // all empty
      stock: [],
      waste: [],
    };

    const badMoves = legalMoves(s).filter(x => x.type === "move_tf");
    // No legal move_tf at all: neither 2♥ to empty hearts, nor K♦ to empty diamonds
    expect(badMoves.length).toBe(0);
  });
});
