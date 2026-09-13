import {
  applyAction, chooseBotAction, createGame, currentActor, makeRandom, visibleStateFor,
  type Card, type Difficulty, type GameOptions, type GameState, type Rank, type Suit,
} from '../src/engine';
import { makeCard } from '../src/engine/cards';

export function opts(partial: Partial<GameOptions> = {}): GameOptions {
  return {
    playerCount: 2,
    transfer: false,
    names: ['אתה', 'דימה', 'סשה', 'מישה'],
    seed: 42,
    ...partial,
  };
}

export function c(rank: Rank, suit: Suit): Card {
  return makeCard(rank, suit);
}

/** Builds a fully custom game position for rule tests. */
export function position(
  base: GameOptions,
  setup: {
    hands: Card[][];
    deck?: Card[];
    trumpCard?: Card;
    attacker?: number;
    boutNumber?: number;
    discard?: Card[];
    out?: number[];
  },
): GameState {
  const state = createGame(base);
  const deck = setup.deck ?? [];
  const trumpCard = setup.trumpCard ?? deck[0] ?? state.trumpCard;
  const players = state.players.map((p, i) => ({
    ...p,
    hand: [...(setup.hands[i] ?? [])],
    out: setup.out?.includes(i) ?? false,
  }));
  const attacker = setup.attacker ?? 0;
  const n = players.length;
  let defender = (attacker + 1) % n;
  while (players[defender]?.out) defender = (defender + 1) % n;
  const boutNumber = setup.boutNumber ?? 2;
  return {
    ...state,
    players,
    deck,
    trumpCard,
    trumpSuit: trumpCard.suit,
    discard: [...(setup.discard ?? [])],
    table: [],
    attacker,
    defender,
    pickingUp: false,
    passed: [],
    boutNumber,
    maxAttackCards: Math.min(boutNumber === 1 ? 5 : 6, players[defender]?.hand.length ?? 0),
    events: [],
  };
}

/** Plays a whole game with bots in every seat. Returns the final state and number of actions. */
export function playOut(
  state: GameState,
  difficulty: Difficulty | Difficulty[],
  seed = 1,
  maxActions = 5000,
): { state: GameState; actions: number } {
  const random = makeRandom(seed);
  let s = state;
  let actions = 0;
  while (s.phase === 'playing') {
    const actor = currentActor(s);
    if (actor === null) throw new Error('No actor while playing');
    const diff = Array.isArray(difficulty) ? (difficulty[actor] ?? 'normal') : difficulty;
    const action = chooseBotAction(visibleStateFor(s, actor), diff, random);
    s = applyAction(s, action);
    actions++;
    if (actions > maxActions) throw new Error('Game did not terminate');
  }
  return { state: s, actions };
}

export function totalCards(s: GameState): number {
  let n = s.deck.length + s.discard.length;
  for (const p of s.players) n += p.hand.length;
  for (const pair of s.table) n += 1 + (pair.defense ? 1 : 0);
  return n;
}
