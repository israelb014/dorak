import { describe, expect, it } from 'vitest';
import { createGame, makeRandom, type Difficulty } from '../src/engine';
import { opts, playOut, totalCards } from './helpers';

const PLAYER_COUNTS = [2, 3, 4] as const;
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
const TRANSFERS = [false, true];
const GAMES = 500;

describe('fuzz: random bot-vs-bot games', () => {
  it(`plays ${GAMES} games across all player counts, difficulties and transfer settings without engine errors`, () => {
    const pick = makeRandom(0xd07a4);
    const seen = { players: new Set<number>(), difficulties: new Set<string>(), transfer: new Set<boolean>() };
    let finished = 0;
    let maxActions = 0;

    for (let i = 0; i < GAMES; i++) {
      const playerCount = PLAYER_COUNTS[i % PLAYER_COUNTS.length] as 2 | 3 | 4;
      const transfer = TRANSFERS[Math.floor(i / PLAYER_COUNTS.length) % TRANSFERS.length] as boolean;
      // Random difficulty per seat, so mixed tables are covered as well as uniform ones.
      const seats: Difficulty[] = Array.from(
        { length: playerCount },
        () => DIFFICULTIES[Math.floor(pick() * DIFFICULTIES.length)] as Difficulty,
      );
      const seed = Math.floor(pick() * 0x7fffffff);
      seen.players.add(playerCount);
      seen.transfer.add(transfer);
      seats.forEach((d) => seen.difficulties.add(d));

      let result: ReturnType<typeof playOut>;
      try {
        result = playOut(createGame(opts({ playerCount, transfer, seed })), seats, seed);
      } catch (err) {
        throw new Error(
          `Game ${i} threw (players=${playerCount}, transfer=${transfer}, seats=${seats.join(',')}, seed=${seed}): ${String(err)}`,
        );
      }
      const { state, actions } = result;
      expect(state.phase, `game ${i} did not end`).toBe('over');
      expect(state.result, `game ${i} has no result`).not.toBeNull();
      expect(state.deck, `game ${i} ended with cards in the deck`).toHaveLength(0);
      expect(totalCards(state), `game ${i} lost or duplicated cards`).toBe(36);
      const holders = state.players.filter((p) => p.hand.length > 0);
      if (state.result?.draw) expect(holders, `game ${i} draw with cards in hand`).toHaveLength(0);
      else expect(holders.map((p) => p.id), `game ${i} loser mismatch`).toEqual([state.result?.loser]);
      finished++;
      maxActions = Math.max(maxActions, actions);
    }

    expect(finished).toBe(GAMES);
    expect([...seen.players].sort()).toEqual([2, 3, 4]);
    expect([...seen.difficulties].sort()).toEqual(['easy', 'hard', 'normal']);
    expect([...seen.transfer]).toHaveLength(2);
    expect(maxActions).toBeLessThan(5000);
  });
});
