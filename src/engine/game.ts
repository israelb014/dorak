import { beats, createDeck, SUIT_ORDER } from './cards';
import { shuffle } from './rng';
import type {
  Action, Card, GameEvent, GameOptions, GameState, LegalMoves, Player, TablePair,
} from './types';

export const HAND_SIZE = 6;
export const MAX_ATTACK = 6;
export const FIRST_BOUT_MAX_ATTACK = 5;

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalMoveError';
  }
}

function fail(message: string): never {
  throw new IllegalMoveError(message);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function createGame(options: GameOptions): GameState {
  const n = options.playerCount;
  if (n < 2 || n > 4) fail('playerCount must be 2, 3 or 4');
  const humanIndex = options.humanIndex ?? 0;
  const shuffled = shuffle(createDeck(), options.seed | 0);
  const deck = shuffled.items;
  const players: Player[] = [];
  for (let i = 0; i < n; i++) {
    players.push({
      id: i,
      name: options.names[i] ?? `Player ${i + 1}`,
      isHuman: i === humanIndex,
      hand: [],
      out: false,
    });
  }
  // Deal one card at a time, clockwise.
  for (let round = 0; round < HAND_SIZE; round++) {
    for (const p of players) {
      const card = deck.pop();
      if (card) p.hand.push(card);
    }
  }
  // The bottom card is the trump card and stays at the bottom (index 0).
  const trumpCard = deck[0];
  if (!trumpCard) fail('deck exhausted during deal');
  const trumpSuit = trumpCard.suit;

  let attacker: number;
  const prev = options.previousLoser;
  if (prev !== undefined && prev !== null && prev >= 0 && prev < n) {
    attacker = (prev - 1 + n) % n; // loser defends first
  } else {
    attacker = findFirstAttacker(players, trumpSuit);
  }
  const defender = (attacker + 1) % n;
  const defenderHand = players[defender]?.hand.length ?? 0;

  const state: GameState = {
    options: { ...options, humanIndex },
    rng: shuffled.state,
    players,
    deck,
    trumpCard,
    trumpSuit,
    discard: [],
    table: [],
    attacker,
    defender,
    pickingUp: false,
    passed: [],
    maxAttackCards: Math.min(FIRST_BOUT_MAX_ATTACK, defenderHand),
    boutNumber: 1,
    phase: 'playing',
    result: null,
    events: [{ type: 'deal' }],
    tick: 0,
  };
  return state;
}

export function findFirstAttacker(players: Player[], trumpSuit: Card['suit']): number {
  let best: { seat: number; card: Card } | null = null;
  for (const p of players) {
    for (const c of p.hand) {
      if (c.suit !== trumpSuit) continue;
      if (!best || c.rank < best.card.rank) best = { seat: p.id, card: c };
    }
  }
  if (best) return best.seat;
  for (const p of players) {
    for (const c of p.hand) {
      if (
        !best ||
        c.rank < best.card.rank ||
        (c.rank === best.card.rank && SUIT_ORDER[c.suit] < SUIT_ORDER[best.card.suit])
      ) {
        best = { seat: p.id, card: c };
      }
    }
  }
  return best ? best.seat : 0;
}

// ---------------------------------------------------------------------------
// Seat helpers
// ---------------------------------------------------------------------------

export function nextActive(state: GameState, from: number): number {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const seat = (from + i) % n;
    const p = state.players[seat];
    if (p && !p.out) return seat;
  }
  return from;
}

export function activeSeats(state: GameState): number[] {
  return state.players.filter((p) => !p.out).map((p) => p.id);
}

/** Primary attacker first, then the other non-defending active players clockwise from the defender's left. */
export function throwInOrder(state: GameState): number[] {
  const order: number[] = [state.attacker];
  const n = state.players.length;
  for (let i = 1; i < n; i++) {
    const seat = (state.defender + i) % n;
    const p = state.players[seat];
    if (!p || p.out || seat === state.defender || seat === state.attacker) continue;
    order.push(seat);
  }
  return order;
}

export function tableRanks(table: TablePair[]): Set<number> {
  const ranks = new Set<number>();
  for (const pair of table) {
    ranks.add(pair.attack.rank);
    if (pair.defense) ranks.add(pair.defense.rank);
  }
  return ranks;
}

export function unbeatenPairs(table: TablePair[]): TablePair[] {
  return table.filter((p) => p.defense === null);
}

function player(state: GameState, seat: number): Player {
  const p = state.players[seat];
  if (!p) fail(`No player at seat ${seat}`);
  return p;
}

function findCard(p: Player, id: string): Card {
  const c = p.hand.find((x) => x.id === id);
  if (!c) fail(`${p.name} does not hold ${id}`);
  return c;
}

function removeCard(p: Player, id: string): Card {
  const idx = p.hand.findIndex((x) => x.id === id);
  if (idx < 0) fail(`${p.name} does not hold ${id}`);
  const [card] = p.hand.splice(idx, 1);
  return card as Card;
}

// ---------------------------------------------------------------------------
// Legal moves
// ---------------------------------------------------------------------------

function inThrowInPhase(state: GameState): boolean {
  if (state.table.length === 0) return false;
  return state.pickingUp || unbeatenPairs(state.table).length === 0;
}

export function legalThrowIns(state: GameState, seat: number): Card[] {
  if (!inThrowInPhase(state)) return [];
  if (state.table.length >= state.maxAttackCards) return [];
  const ranks = tableRanks(state.table);
  return player(state, seat).hand.filter((c) => ranks.has(c.rank));
}

export function currentActor(state: GameState): number | null {
  if (state.phase !== 'playing') return null;
  if (state.table.length === 0) return state.attacker;
  if (!state.pickingUp && unbeatenPairs(state.table).length > 0) return state.defender;
  if (state.table.length >= state.maxAttackCards) return null;
  for (const seat of throwInOrder(state)) {
    if (state.passed.includes(seat)) continue;
    if (legalThrowIns(state, seat).length > 0) return seat;
  }
  return null;
}

export function legalTransfers(state: GameState, seat: number): Card[] {
  if (!state.options.transfer) return [];
  if (seat !== state.defender || state.pickingUp) return [];
  if (state.table.length === 0) return [];
  if (state.table.some((p) => p.defense !== null)) return [];
  const rank = state.table[0]?.attack.rank;
  const base = state.boutNumber === 1 ? FIRST_BOUT_MAX_ATTACK : MAX_ATTACK;
  const newCount = state.table.length + 1;
  if (newCount > base) return [];
  const newDefender = nextActive(state, seat);
  if (newDefender === seat) return [];
  if (player(state, newDefender).hand.length < newCount) return [];
  return player(state, seat).hand.filter((c) => c.rank === rank);
}

export function getLegalMoves(state: GameState, seat?: number): LegalMoves {
  const actor = currentActor(state);
  const empty: LegalMoves = {
    actor, attackCards: [], defenseOptions: {}, transferCards: [], canPickUp: false, canPass: false,
  };
  if (actor === null) return empty;
  const who = seat ?? actor;
  if (who !== actor) return empty;
  const p = player(state, who);

  if (state.table.length === 0) {
    return { ...empty, attackCards: [...p.hand] };
  }
  if (who === state.defender && !state.pickingUp) {
    const defenseOptions: Record<string, Card[]> = {};
    for (const pair of unbeatenPairs(state.table)) {
      defenseOptions[pair.attack.id] = p.hand.filter((c) => beats(pair.attack, c, state.trumpSuit));
    }
    return {
      ...empty,
      defenseOptions,
      transferCards: legalTransfers(state, who),
      canPickUp: true,
    };
  }
  return { ...empty, attackCards: legalThrowIns(state, who), canPass: true };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function cloneState(state: GameState): GameState {
  return {
    ...state,
    options: { ...state.options, names: [...state.options.names] },
    players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
    deck: [...state.deck],
    discard: [...state.discard],
    table: state.table.map((pair) => ({ ...pair })),
    passed: [...state.passed],
    events: [],
  };
}

export function applyAction(prev: GameState, action: Action): GameState {
  if (prev.phase !== 'playing') fail('Game is over');
  const actor = currentActor(prev);
  if (actor === null) fail('No actor expected');
  if (action.player !== actor) {
    fail(`It is seat ${actor}'s turn, not seat ${action.player}`);
  }
  const s = cloneState(prev);
  const events: GameEvent[] = [];
  const p = player(s, action.player);

  switch (action.type) {
    case 'attack': {
      const card = findCard(p, action.card);
      if (s.table.length === 0) {
        if (action.player !== s.attacker) fail('Only the attacker opens a bout');
      } else {
        const legal = legalThrowIns(s, action.player);
        if (!legal.some((c) => c.id === card.id)) fail(`Illegal throw-in: ${card.id}`);
      }
      removeCard(p, card.id);
      s.table.push({ attack: card, defense: null });
      s.passed = [];
      events.push({ type: 'attack', player: action.player, card, throwIn: prev.table.length > 0 });
      break;
    }
    case 'defend': {
      if (action.player !== s.defender || s.pickingUp) fail('Not defending');
      const card = findCard(p, action.card);
      const pair = s.table.find((x) => x.attack.id === action.target);
      if (!pair) fail(`No attack card ${action.target} on the table`);
      if (pair.defense) fail(`${action.target} is already beaten`);
      if (!beats(pair.attack, card, s.trumpSuit)) fail(`${card.id} does not beat ${pair.attack.id}`);
      removeCard(p, card.id);
      pair.defense = card;
      events.push({ type: 'defend', player: action.player, card, target: pair.attack });
      break;
    }
    case 'transfer': {
      const legal = legalTransfers(s, action.player);
      const card = legal.find((c) => c.id === action.card);
      if (!card) fail(`Illegal transfer: ${action.card}`);
      removeCard(p, card.id);
      s.table.push({ attack: card, defense: null });
      const newDefender = nextActive(s, action.player);
      s.attacker = action.player;
      s.defender = newDefender;
      s.passed = [];
      const base = s.boutNumber === 1 ? FIRST_BOUT_MAX_ATTACK : MAX_ATTACK;
      s.maxAttackCards = Math.min(base, player(s, newDefender).hand.length);
      events.push({ type: 'transfer', player: action.player, card, newDefender });
      break;
    }
    case 'pickUp': {
      if (action.player !== s.defender || s.pickingUp) fail('Cannot pick up now');
      if (unbeatenPairs(s.table).length === 0) fail('Nothing to pick up');
      s.pickingUp = true;
      s.passed = [];
      events.push({ type: 'pickUpDeclared', player: action.player });
      break;
    }
    case 'pass': {
      if (!inThrowInPhase(s) || action.player === s.defender) fail('Cannot pass now');
      if (!s.passed.includes(action.player)) s.passed.push(action.player);
      events.push({ type: 'pass', player: action.player });
      break;
    }
    default:
      fail('Unknown action');
  }

  s.tick = prev.tick + 1;
  settle(s, events);
  s.events = events;
  return s;
}

/** Ends the bout when nobody can act any more and prepares the next one. */
function settle(s: GameState, events: GameEvent[]): void {
  if (s.phase !== 'playing') return;
  if (currentActor(s) !== null) return;
  if (s.table.length === 0) return;
  finishBout(s, events);
}

function finishBout(s: GameState, events: GameEvent[]): void {
  const defender = player(s, s.defender);
  const cards = s.table.map((pair) => ({ ...pair }));
  if (s.pickingUp) {
    for (const pair of s.table) {
      defender.hand.push(pair.attack);
      if (pair.defense) defender.hand.push(pair.defense);
    }
    events.push({ type: 'boutEnd', outcome: 'pickedUp', defender: s.defender, cards });
  } else {
    for (const pair of s.table) {
      s.discard.push(pair.attack);
      if (pair.defense) s.discard.push(pair.defense);
    }
    events.push({ type: 'boutEnd', outcome: 'beaten', defender: s.defender, cards });
  }
  const pickedUp = s.pickingUp;
  s.table = [];
  s.pickingUp = false;
  s.passed = [];

  // Draw: attacker, other attackers clockwise, defender last.
  const drawOrder: number[] = [s.attacker];
  const n = s.players.length;
  for (let i = 1; i < n; i++) {
    const seat = (s.attacker + i) % n;
    if (seat === s.defender) continue;
    const pl = s.players[seat];
    if (pl && !pl.out) drawOrder.push(seat);
  }
  drawOrder.push(s.defender);
  for (const seat of drawOrder) {
    const pl = player(s, seat);
    let count = 0;
    while (pl.hand.length < HAND_SIZE && s.deck.length > 0) {
      const c = s.deck.pop();
      if (!c) break;
      pl.hand.push(c);
      count++;
    }
    if (count > 0) events.push({ type: 'draw', player: seat, count });
  }

  // Players who emptied their hand once the deck is gone have escaped.
  if (s.deck.length === 0) {
    for (const pl of s.players) {
      if (!pl.out && pl.hand.length === 0) {
        pl.out = true;
        events.push({ type: 'playerOut', player: pl.id });
      }
    }
  }

  const active = activeSeats(s);
  if (active.length === 0) {
    s.phase = 'over';
    s.result = { loser: null, draw: true };
    events.push({ type: 'gameOver', result: s.result });
    return;
  }
  if (active.length === 1) {
    s.phase = 'over';
    s.result = { loser: active[0] as number, draw: false };
    events.push({ type: 'gameOver', result: s.result });
    return;
  }

  // Next bout.
  let attacker: number;
  if (pickedUp) {
    attacker = nextActive(s, s.defender);
  } else {
    attacker = defender.out ? nextActive(s, s.defender) : s.defender;
  }
  const nextDefender = nextActive(s, attacker);
  s.attacker = attacker;
  s.defender = nextDefender;
  s.boutNumber += 1;
  s.maxAttackCards = Math.min(MAX_ATTACK, player(s, nextDefender).hand.length);
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'over';
}
