import { describe, it, expect } from "vitest";
import { rank, suit } from "../src/cards";

describe("cards helpers", () => {
  it("cover: every card id maps to a valid rank+suit combo", () => {
    const ranks = new Map<number, number>();
    const suits = new Map<number, number>();
    const combos = new Set<string>();

    for (let id = 0; id < 52; id++) {
      const r = rank(id);
      const s = suit(id);
      combos.add(`${r}:${s}`);
      ranks.set(r, (ranks.get(r) ?? 0) + 1);
      suits.set(s, (suits.get(s) ?? 0) + 1);
    }

    // 52 distinct cards
    expect(combos.size).toBe(52);

    // 13 ranks, each appears 4 times
    expect(ranks.size).toBe(13);
    for (const count of ranks.values()) expect(count).toBe(4);

    // 4 suits, each appears 13 times
    expect(suits.size).toBe(4);
    for (const count of suits.values()) expect(count).toBe(13);
  });
});
