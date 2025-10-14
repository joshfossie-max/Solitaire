// cards.ts
export const SUITS = ["♣", "♦", "♥", "♠"] as const;
export type Suit = typeof SUITS[number];
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13;
export function makeDeck(): number[] { return Array.from({ length: 52 }, (_, i) => i); }
export function suit(card: number): Suit { return SUITS[Math.floor(card / 13)] }
export function rank(card: number): Rank { return ((card % 13) + 1) as Rank }
