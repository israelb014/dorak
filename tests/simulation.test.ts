import { describe, expect, it } from 'vitest';
import {
  applyAction, chooseBotAction, createGame, currentActor, getLegalMoves, visibleStateFor,
  type Difficulty,
} from '../src/engine';
import { opts, playOut, totalCards } from './helpers';

const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

describe('full games with bots', () => {
  for (const playerCount of [2, 3, 4] as const) {
    for (const transfer of [false, true]) {
      for (const difficulty of difficulties) {
        it(`terminates legally: ${playerCount} players, transfer=${transfer}, ${difficulty}`, () => {
          for (let seed = 1; seed <= 12; seed++) {
            const start = createGame(opts({ playerCount, transfer, seed }));
            const { state } = playOut(start, difficulty, seed);
            expect(state.phase).toBe('over');
            expect(state.result).not.toBeNull();
            expect(totalCards(state)).toBe(36);
            expect(state.deck).toHaveLength(0);
            const holders = state.players.filter((p) => p.hand.length > 0);
            if (state.result?.draw) {
              expect(holders).toHaveLength(0);
            } else {
              expect(holders).toHaveLength(1);
              expect(holders[0]?.id).toBe(state.result?.loser);
            }
          }
        });
      }
    }
  }

  it('mixed difficulties play together', () => {
    for (let seed = 100; seed < 110; seed++) {
      const start = createGame(opts({ playerCount: 4, transfer: true, seed }));
      const { state } = playOut(start, ['easy', 'normal', 'hard', 'normal'], seed);
      expect(state.phase).toBe('over');
    }
  });

  it('bots never see other hands: visible state has no foreign cards', () => {
    const s = createGame(opts({ playerCount: 3, seed: 8 }));
    const v = visibleStateFor(s, 1);
    expect(v.hand.map((c) => c.id)).toEqual(s.players[1]?.hand.map((c) => c.id));
    expect((v as unknown as { players: { hand?: unknown }[] }).players.every((p) => p.hand === undefined)).toBe(true);
  });

  it('every bot action is contained in the legal move set', () => {
    for (const difficulty of difficulties) {
      let s = createGame(opts({ playerCount: 3, transfer: true, seed: 55 }));
      let guard = 0;
      while (s.phase === 'playing' && guard++ < 3000) {
        const actor = currentActor(s) as number;
        const legal = getLegalMoves(s, actor);
        const action = chooseBotAction(visibleStateFor(s, actor), difficulty, () => 0.5);
        switch (action.type) {
          case 'attack':
            expect(legal.attackCards.map((c) => c.id)).toContain(action.card);
            break;
          case 'defend':
            expect((legal.defenseOptions[action.target] ?? []).map((c) => c.id)).toContain(action.card);
            break;
          case 'transfer':
            expect(legal.transferCards.map((c) => c.id)).toContain(action.card);
            break;
          case 'pickUp':
            expect(legal.canPickUp).toBe(true);
            break;
          case 'pass':
            expect(legal.canPass).toBe(true);
            break;
        }
        s = applyAction(s, action);
      }
      expect(s.phase).toBe('over');
    }
  });

  it('hard beats easy more often than not over many 2-player games', () => {
    let hardWins = 0;
    const games = 60;
    for (let seed = 1; seed <= games; seed++) {
      const start = createGame(opts({ playerCount: 2, seed: seed * 31 }));
      const { state } = playOut(start, ['easy', 'hard'], seed);
      if (state.result && state.result.loser === 0) hardWins++;
    }
    expect(hardWins).toBeGreaterThan(games / 2);
  });
});
