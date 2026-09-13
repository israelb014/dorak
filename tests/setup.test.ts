import { describe, expect, it } from 'vitest';
import { createGame, findFirstAttacker } from '../src/engine';
import { c, opts, totalCards } from './helpers';

describe('createGame', () => {
  it('deals 6 cards to each player and keeps the trump card at the bottom of the deck', () => {
    for (const playerCount of [2, 3, 4] as const) {
      const s = createGame(opts({ playerCount, seed: 9 }));
      expect(s.players).toHaveLength(playerCount);
      for (const p of s.players) expect(p.hand).toHaveLength(6);
      expect(s.deck).toHaveLength(36 - 6 * playerCount);
      expect(s.deck[0]).toEqual(s.trumpCard);
      expect(s.trumpSuit).toBe(s.trumpCard.suit);
      expect(totalCards(s)).toBe(36);
    }
  });

  it('is reproducible for the same seed', () => {
    const a = createGame(opts({ seed: 77 }));
    const b = createGame(opts({ seed: 77 }));
    expect(a.players.map((p) => p.hand.map((x) => x.id))).toEqual(b.players.map((p) => p.hand.map((x) => x.id)));
    expect(a.trumpCard).toEqual(b.trumpCard);
  });

  it('starts with the defender to the attacker\'s left and a 5-card limit', () => {
    const s = createGame(opts({ playerCount: 3, seed: 3 }));
    expect(s.defender).toBe((s.attacker + 1) % 3);
    expect(s.maxAttackCards).toBe(5);
    expect(s.boutNumber).toBe(1);
  });

  it('gives the first attack to the lowest trump holder', () => {
    const players = [
      { id: 0, name: 'a', isHuman: true, hand: [c(14, 'H'), c(6, 'S')], out: false },
      { id: 1, name: 'b', isHuman: false, hand: [c(7, 'H'), c(14, 'S')], out: false },
    ];
    expect(findFirstAttacker(players, 'H')).toBe(1);
  });

  it('falls back to the lowest card overall with suit tie-break spades<clubs<diamonds<hearts', () => {
    const players = [
      { id: 0, name: 'a', isHuman: true, hand: [c(6, 'D'), c(9, 'S')], out: false },
      { id: 1, name: 'b', isHuman: false, hand: [c(6, 'C'), c(14, 'S')], out: false },
      { id: 2, name: 'c', isHuman: false, hand: [c(7, 'S'), c(8, 'S')], out: false },
    ];
    expect(findFirstAttacker(players, 'H')).toBe(1);
  });

  it('lets the previous loser defend first in the next game', () => {
    const s = createGame(opts({ playerCount: 4, previousLoser: 2, seed: 5 }));
    expect(s.attacker).toBe(1);
    expect(s.defender).toBe(2);
    const s2 = createGame(opts({ playerCount: 3, previousLoser: 0, seed: 5 }));
    expect(s2.attacker).toBe(2);
    expect(s2.defender).toBe(0);
  });
});
