import type { Card, Rank, Suit } from './types';

export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: readonly Rank[] = [6, 7, 8, 9, 10, 11, 12, 13, 14];

/** Tie-break order for suits when no trump is held: ♠ < ♣ < ♦ < ♥. */
export const SUIT_ORDER: Record<Suit, number> = { S: 0, C: 1, D: 2, H: 3 };

export const RANK_LABEL: Record<Rank, string> = {
  6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function cardId(rank: Rank, suit: Suit): string {
  return `${rank}${suit}`;
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return { id: cardId(rank, suit), rank, suit };
}

export function parseCard(id: string): Card {
  const suit = id.slice(-1) as Suit;
  const rank = Number(id.slice(0, -1)) as Rank;
  if (!SUITS.includes(suit) || !RANKS.includes(rank)) {
    throw new Error(`Invalid card id: ${id}`);
  }
  return makeCard(rank, suit);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push(makeCard(rank, suit));
  }
  return deck;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.id === b.id;
}

export function isTrump(card: Card, trump: Suit): boolean {
  return card.suit === trump;
}

/** True when `defense` beats `attack` under the given trump suit. */
export function beats(attack: Card, defense: Card, trump: Suit): boolean {
  if (defense.suit === attack.suit) return defense.rank > attack.rank;
  return defense.suit === trump;
}

/** Strength used by bots: non-trumps by rank, trumps above all non-trumps. */
export function cardValue(card: Card, trump: Suit): number {
  return card.suit === trump ? card.rank + 20 : card.rank;
}

export function compareForDisplay(trump: Suit) {
  return (a: Card, b: Card): number => {
    const at = a.suit === trump ? 1 : 0;
    const bt = b.suit === trump ? 1 : 0;
    if (at !== bt) return at - bt;
    if (a.suit !== b.suit) return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    return a.rank - b.rank;
  };
}

export function sortHand(hand: Card[], trump: Suit): Card[] {
  return [...hand].sort(compareForDisplay(trump));
}
