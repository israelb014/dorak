import { describe, expect, it } from 'vitest';
import {
  applyAction, currentActor, getLegalMoves, IllegalMoveError, legalTransfers, throwInOrder,
  type Action, type GameState,
} from '../src/engine';
import { c, opts, position, totalCards } from './helpers';

function play(s: GameState, ...actions: Action[]): GameState {
  return actions.reduce((st, a) => applyAction(st, a), s);
}

describe('attacking and defending', () => {
  it('lets the attacker open with any card and the defender must answer', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(14, 'D')], [c(7, 'S'), c(6, 'H')]],
      deck: [c(9, 'H'), c(10, 'C')],
    });
    expect(s.trumpSuit).toBe('H');
    expect(currentActor(s)).toBe(0);
    expect(getLegalMoves(s).attackCards.map((x) => x.id)).toEqual(['6S', '14D']);
    const s1 = applyAction(s, { type: 'attack', player: 0, card: '14D' });
    expect(currentActor(s1)).toBe(1);
    const lm = getLegalMoves(s1);
    expect(lm.canPickUp).toBe(true);
    expect(lm.defenseOptions['14D']?.map((x) => x.id)).toEqual(['6H']);
    expect(lm.attackCards).toHaveLength(0);
  });

  it('rejects an out-of-turn action, an unowned card, and a card that does not beat', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(14, 'D')], [c(7, 'S'), c(6, 'H')]],
      deck: [c(9, 'H')],
    });
    expect(() => applyAction(s, { type: 'attack', player: 1, card: '7S' })).toThrow(IllegalMoveError);
    expect(() => applyAction(s, { type: 'attack', player: 0, card: '7S' })).toThrow(IllegalMoveError);
    const s1 = applyAction(s, { type: 'attack', player: 0, card: '14D' });
    expect(() => applyAction(s1, { type: 'defend', player: 1, card: '7S', target: '14D' })).toThrow(
      IllegalMoveError,
    );
    expect(() => applyAction(s1, { type: 'defend', player: 1, card: '6H', target: '6S' })).toThrow(
      IllegalMoveError,
    );
    expect(() => applyAction(s1, { type: 'pass', player: 1 })).toThrow(IllegalMoveError);
    expect(() => applyAction(s1, { type: 'attack', player: 0, card: '6S' })).toThrow(IllegalMoveError);
  });

  it('only allows throw-ins that match a rank on the table, including defense ranks', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(8, 'D'), c(9, 'C'), c(10, 'C')], [c(8, 'S'), c(9, 'D'), c(6, 'H'), c(7, 'C')]],
      deck: [c(11, 'H'), c(12, 'C')],
    });
    let st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '8S', target: '6S' },
    );
    expect(currentActor(st)).toBe(0);
    const lm = getLegalMoves(st);
    expect(lm.canPass).toBe(true);
    expect(lm.attackCards.map((x) => x.id)).toEqual(['8D']); // 8 matches the defense card
    expect(() => applyAction(st, { type: 'attack', player: 0, card: '9C' })).toThrow(IllegalMoveError);
    st = applyAction(st, { type: 'attack', player: 0, card: '8D' });
    expect(currentActor(st)).toBe(1);
    st = applyAction(st, { type: 'defend', player: 1, card: '9D', target: '8D' });
    expect(getLegalMoves(st).attackCards.map((x) => x.id)).toEqual(['9C']);
  });

  it('ends the bout and discards when the attacker passes with everything beaten', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(7, 'D')], [c(7, 'S'), c(6, 'H')]],
      deck: [c(11, 'H'), c(9, 'C'), c(10, 'C')],
    });
    const mid = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '7S', target: '6S' },
    );
    expect(currentActor(mid)).toBe(0); // 7♦ is a legal throw-in, so the attacker must decide
    const st = applyAction(mid, { type: 'pass', player: 0 });
    expect(st.table).toHaveLength(0);
    expect(st.discard.map((x) => x.id).sort()).toEqual(['6S', '7S']);
    expect(st.attacker).toBe(1);
    expect(st.defender).toBe(0);
    expect(st.boutNumber).toBe(3);
    expect(st.events.some((e) => e.type === 'boutEnd' && e.outcome === 'beaten')).toBe(true);
    expect(totalCards(st)).toBe(7); // 7 cards in this synthetic game
  });

  it('auto-ends the bout when the attacker has no legal throw-in', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(12, 'D')], [c(7, 'S'), c(6, 'H')]],
      deck: [c(11, 'H')],
    });
    const st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '6H', target: '6S' },
    );
    // Attacker holds only Q♦ which matches no rank on the table: bout ends automatically.
    expect(st.table).toHaveLength(0);
    expect(st.attacker).toBe(1);
  });
});

describe('picking up', () => {
  it('gives the defender every table card and skips their attack', () => {
    const s = position(opts({ playerCount: 3 }), {
      hands: [[c(6, 'S'), c(6, 'D'), c(13, 'C')], [c(7, 'C'), c(8, 'C'), c(9, 'C')], [c(6, 'C'), c(10, 'D')]],
      deck: [c(11, 'H'), c(9, 'H'), c(10, 'H'), c(12, 'H'), c(13, 'H'), c(14, 'H')],
    });
    let st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'pickUp', player: 1 },
    );
    expect(st.pickingUp).toBe(true);
    expect(currentActor(st)).toBe(0);
    st = applyAction(st, { type: 'attack', player: 0, card: '6D' });
    expect(currentActor(st)).toBe(2); // third player may throw in after the primary attacker
    expect(getLegalMoves(st).attackCards.map((x) => x.id)).toEqual(['6C']);
    st = applyAction(st, { type: 'attack', player: 2, card: '6C' });
    // Nobody has a legal throw-in left, bout resolves.
    expect(st.table).toHaveLength(0);
    expect(st.players[1]?.hand.map((x) => x.id).sort()).toEqual(['6C', '6D', '6S', '7C', '8C', '9C']);
    expect(st.attacker).toBe(2);
    expect(st.defender).toBe(0);
  });

  it('cannot pick up when nothing is unbeaten and cannot pass while defending', () => {
    const s = position(opts(), {
      hands: [[c(6, 'S'), c(9, 'D')], [c(7, 'S'), c(6, 'H')]],
      deck: [c(11, 'H'), c(9, 'C')],
    });
    const st = play(s, { type: 'attack', player: 0, card: '6S' });
    expect(() => applyAction(st, { type: 'pass', player: 1 })).toThrow(IllegalMoveError);
    expect(() => applyAction(st, { type: 'pickUp', player: 0 })).toThrow(IllegalMoveError);
  });
});

describe('limits', () => {
  it('caps the first bout at 5 attack cards', () => {
    const s = position(opts({ playerCount: 2 }), {
      hands: [
        [c(6, 'S'), c(6, 'D'), c(6, 'C'), c(7, 'D'), c(7, 'C'), c(7, 'H')],
        [c(7, 'S'), c(8, 'S'), c(9, 'S'), c(10, 'S'), c(11, 'S'), c(12, 'S')],
      ],
      deck: [c(12, 'D'), c(13, 'D'), c(14, 'D')],
      boutNumber: 1,
    });
    expect(s.maxAttackCards).toBe(5);
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    st = applyAction(st, { type: 'defend', player: 1, card: '7S', target: '6S' });
    st = applyAction(st, { type: 'attack', player: 0, card: '7D' });
    st = applyAction(st, { type: 'pickUp', player: 1 });
    for (const id of ['6D', '6C']) st = applyAction(st, { type: 'attack', player: 0, card: id });
    expect(st.table).toHaveLength(4);
    st = applyAction(st, { type: 'attack', player: 0, card: '7C' });
    // Fifth card played -> limit reached, bout auto-resolves even though 7♥ was legal.
    expect(st.table).toHaveLength(0);
    expect(st.players[0]?.hand.map((x) => x.id)).toEqual(['7H', '14D', '13D', '12D']);
    expect(st.players[1]?.hand).toHaveLength(11);
  });

  it('never allows more attack cards than the defender held at bout start', () => {
    const s = position(opts({ playerCount: 2 }), {
      hands: [
        [c(6, 'S'), c(6, 'D'), c(6, 'C'), c(7, 'S')],
        [c(8, 'H'), c(9, 'H')],
      ],
      deck: [],
      trumpCard: c(10, 'H'),
    });
    expect(s.maxAttackCards).toBe(2);
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    st = applyAction(st, { type: 'pickUp', player: 1 });
    st = applyAction(st, { type: 'attack', player: 0, card: '6D' });
    expect(st.table).toHaveLength(0);
    expect(st.players[1]?.hand).toHaveLength(4);
    expect(st.players[0]?.hand).toHaveLength(2);
  });

  it('uses a 6-card limit after the first bout', () => {
    const s = position(opts({ playerCount: 2 }), {
      hands: [
        [c(6, 'S'), c(6, 'D'), c(6, 'C'), c(7, 'S'), c(7, 'D'), c(7, 'C')],
        [c(6, 'H'), c(7, 'H'), c(8, 'H'), c(9, 'H'), c(10, 'H'), c(11, 'H')],
      ],
      deck: [c(12, 'H')],
      boutNumber: 2,
    });
    expect(s.maxAttackCards).toBe(6);
  });
});

describe('throw-in order', () => {
  it('goes primary attacker, then clockwise from the defender\'s left', () => {
    const s = position(opts({ playerCount: 4 }), {
      hands: [[c(6, 'S')], [c(7, 'S')], [c(8, 'S')], [c(9, 'S')]],
      deck: [c(10, 'H')],
      attacker: 3,
    });
    expect(s.defender).toBe(0);
    expect(throwInOrder(s)).toEqual([3, 1, 2]);
  });

  it('skips players who are out', () => {
    const s = position(opts({ playerCount: 4 }), {
      hands: [[c(6, 'S')], [], [c(8, 'S')], [c(9, 'S')]],
      deck: [],
      trumpCard: c(10, 'H'),
      attacker: 3,
      out: [1],
    });
    expect(throwInOrder(s)).toEqual([3, 2]);
  });
});

describe('drawing', () => {
  it('refills attacker first, other attackers clockwise, defender last, and stops at the trump card', () => {
    const s = position(opts({ playerCount: 3 }), {
      hands: [[c(6, 'S'), c(9, 'D')], [c(7, 'S'), c(9, 'C')], [c(10, 'D'), c(10, 'C')]],
      // deck top is the end of the array; index 0 is the trump card.
      deck: [c(14, 'H'), c(13, 'H'), c(12, 'H'), c(11, 'H'), c(10, 'H'), c(9, 'H')],
    });
    const st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '7S', target: '6S' },
    );
    // Attacker (seat 0) draws 9♥,10♥,11♥,12♥ then seat 2 draws 13♥ + trump 14♥; defender gets nothing.
    expect(st.players[0]?.hand.map((x) => x.id)).toEqual(['9D', '9H', '10H', '11H', '12H', '13H']);
    expect(st.players[2]?.hand.map((x) => x.id)).toEqual(['10D', '10C', '14H']);
    expect(st.players[1]?.hand.map((x) => x.id)).toEqual(['9C']);
    expect(st.deck).toHaveLength(0);
  });
});

describe('game end', () => {
  it('declares the last player holding cards the durak', () => {
    const s = position(opts({ playerCount: 2 }), {
      hands: [[c(6, 'S')], [c(7, 'D'), c(8, 'D')]],
      deck: [],
      trumpCard: c(10, 'H'),
    });
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    st = applyAction(st, { type: 'pickUp', player: 1 });
    expect(st.phase).toBe('over');
    expect(st.result).toEqual({ loser: 1, draw: false });
    expect(st.players[0]?.out).toBe(true);
  });

  it('is a draw when the last attack card is beaten by the defender\'s last card', () => {
    const s = position(opts({ playerCount: 2 }), {
      hands: [[c(6, 'S')], [c(7, 'S')]],
      deck: [],
      trumpCard: c(10, 'H'),
    });
    const st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '7S', target: '6S' },
    );
    expect(st.phase).toBe('over');
    expect(st.result).toEqual({ loser: null, draw: true });
  });

  it('removes escaped players and continues with the rest', () => {
    const s = position(opts({ playerCount: 3 }), {
      hands: [[c(6, 'S')], [c(7, 'S'), c(9, 'C')], [c(8, 'D'), c(9, 'D')]],
      deck: [],
      trumpCard: c(10, 'H'),
    });
    const st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '7S', target: '6S' },
    );
    expect(st.phase).toBe('playing');
    expect(st.players[0]?.out).toBe(true);
    expect(st.attacker).toBe(1);
    expect(st.defender).toBe(2);
    expect(st.events.some((e) => e.type === 'playerOut' && e.player === 0)).toBe(true);
  });

  it('a defender who wins with their last card is out and the next attacker is on their left', () => {
    const s = position(opts({ playerCount: 3 }), {
      hands: [[c(6, 'S'), c(12, 'D')], [c(7, 'S')], [c(8, 'D'), c(9, 'D')]],
      deck: [],
      trumpCard: c(10, 'H'),
    });
    const st = play(
      s,
      { type: 'attack', player: 0, card: '6S' },
      { type: 'defend', player: 1, card: '7S', target: '6S' },
    );
    expect(st.players[1]?.out).toBe(true);
    expect(st.attacker).toBe(2);
    expect(st.defender).toBe(0);
  });
});

describe('transfer (perevodnoy)', () => {
  it('is unavailable when the option is off', () => {
    const s = position(opts({ transfer: false }), {
      hands: [[c(6, 'S'), c(9, 'D')], [c(6, 'D'), c(6, 'H')]],
      deck: [c(11, 'H'), c(9, 'C')],
    });
    const st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    expect(legalTransfers(st, 1)).toHaveLength(0);
    expect(() => applyAction(st, { type: 'transfer', player: 1, card: '6D' })).toThrow(IllegalMoveError);
  });

  it('passes the attack to the next player with the transferring card added', () => {
    const s = position(opts({ playerCount: 3, transfer: true }), {
      hands: [[c(6, 'S'), c(9, 'D')], [c(6, 'D'), c(12, 'C')], [c(7, 'S'), c(7, 'D'), c(8, 'C')]],
      deck: [c(11, 'H'), c(9, 'C')],
    });
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    expect(getLegalMoves(st).transferCards.map((x) => x.id)).toEqual(['6D']);
    st = applyAction(st, { type: 'transfer', player: 1, card: '6D' });
    expect(st.defender).toBe(2);
    expect(st.attacker).toBe(1);
    expect(st.table).toHaveLength(2);
    expect(currentActor(st)).toBe(2);
    const lm = getLegalMoves(st);
    expect(Object.keys(lm.defenseOptions).sort()).toEqual(['6D', '6S']);
    expect(lm.defenseOptions['6S']?.map((x) => x.id)).toEqual(['7S']);
    expect(lm.defenseOptions['6D']?.map((x) => x.id)).toEqual(['7D']);
  });

  it('is illegal once a card has been beaten or if the new defender is short of cards', () => {
    const s = position(opts({ playerCount: 3, transfer: true }), {
      hands: [[c(6, 'S'), c(6, 'C'), c(9, 'D')], [c(6, 'D'), c(7, 'S'), c(6, 'H')], [c(8, 'C')]],
      deck: [c(11, 'H'), c(9, 'C')],
    });
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    // Seat 2 holds only 1 card, transfer would give them 2 attack cards -> illegal.
    expect(legalTransfers(st, 1)).toHaveLength(0);
    st = applyAction(st, { type: 'defend', player: 1, card: '7S', target: '6S' });
    st = applyAction(st, { type: 'attack', player: 0, card: '6C' });
    expect(legalTransfers(st, 1)).toHaveLength(0);
  });

  it('can chain transfers around the table', () => {
    const s = position(opts({ playerCount: 3, transfer: true }), {
      hands: [[c(6, 'S'), c(9, 'D'), c(10, 'D'), c(11, 'D')], [c(6, 'D'), c(12, 'C'), c(13, 'C')], [c(6, 'C'), c(7, 'D'), c(8, 'C')]],
      deck: [c(11, 'H'), c(9, 'C')],
    });
    let st = applyAction(s, { type: 'attack', player: 0, card: '6S' });
    st = applyAction(st, { type: 'transfer', player: 1, card: '6D' });
    st = applyAction(st, { type: 'transfer', player: 2, card: '6C' });
    expect(st.defender).toBe(0);
    expect(st.attacker).toBe(2);
    expect(st.table).toHaveLength(3);
    expect(currentActor(st)).toBe(0);
  });
});
