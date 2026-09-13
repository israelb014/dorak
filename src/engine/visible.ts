import { createDeck } from './cards';
import { getLegalMoves } from './game';
import type { Card, GameState, LegalMoves, Suit, TablePair } from './types';

export interface VisiblePlayer {
  id: number;
  name: string;
  handCount: number;
  out: boolean;
  isHuman: boolean;
}

/** Everything a bot is allowed to know: its own hand, public table state and history. */
export interface VisibleState {
  me: number;
  hand: Card[];
  trumpSuit: Suit;
  trumpCard: Card;
  /** True while the trump card is still in the draw pile. */
  trumpCardInDeck: boolean;
  deckCount: number;
  table: TablePair[];
  discard: Card[];
  players: VisiblePlayer[];
  attacker: number;
  defender: number;
  pickingUp: boolean;
  maxAttackCards: number;
  boutNumber: number;
  transferEnabled: boolean;
  legal: LegalMoves;
}

export function visibleStateFor(state: GameState, seat: number): VisibleState {
  const me = state.players[seat];
  if (!me) throw new Error(`No player at seat ${seat}`);
  return {
    me: seat,
    hand: [...me.hand],
    trumpSuit: state.trumpSuit,
    trumpCard: state.trumpCard,
    trumpCardInDeck: state.deck.length > 0,
    deckCount: state.deck.length,
    table: state.table.map((p) => ({ ...p })),
    discard: [...state.discard],
    players: state.players.map((p) => ({
      id: p.id, name: p.name, handCount: p.hand.length, out: p.out, isHuman: p.isHuman,
    })),
    attacker: state.attacker,
    defender: state.defender,
    pickingUp: state.pickingUp,
    maxAttackCards: state.maxAttackCards,
    boutNumber: state.boutNumber,
    transferEnabled: state.options.transfer,
    legal: getLegalMoves(state, seat),
  };
}

/** Cards whose location is unknown to the bot: they are in other hands or in the deck (excluding the visible trump card). */
export function unseenCards(v: VisibleState): Card[] {
  const known = new Set<string>();
  for (const c of v.hand) known.add(c.id);
  for (const c of v.discard) known.add(c.id);
  for (const pair of v.table) {
    known.add(pair.attack.id);
    if (pair.defense) known.add(pair.defense.id);
  }
  if (v.trumpCardInDeck) known.add(v.trumpCard.id);
  return createDeck().filter((c) => !known.has(c.id));
}
