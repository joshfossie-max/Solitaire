export const SUITS = ["♣", "♦", "♥", "♠"] as const;
export type Suit = typeof SUITS[number];
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13;

export function makeDeck(): number[] { return Array.from({ length: 52 }, (_, i) => i); }
export function suit(card: number): Suit { return SUITS[Math.floor(card / 13)] }
export function rank(card: number): Rank { return ((card % 13) + 1) as Rank }

// Helpers for tableau rules
export function isRed(s: Suit): boolean { return s === "♦" || s === "♥"; }
export function isBlack(s: Suit): boolean { return !isRed(s); }
// Optional label (useful in future debugging/UI)
export function cardLabel(card: number): string {
  const r = rank(card);
  const names: Record<number,string> = {1:"A",11:"J",12:"Q",13:"K"};
  const rStr = names[r] ?? String(r);
  return rStr + suit(card);
}
