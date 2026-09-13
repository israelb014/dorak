import { describe, expect, it } from 'vitest';
import { beats, createDeck, parseCard, sortHand } from '../src/engine/cards';
import { makeRandom, shuffle } from '../src/engine/rng';
import { c } from './helpers';

describe('deck', () => {
  it('has 36 unique cards from 6 to ace in four suits', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(36);
    expect(new Set(deck.map((x) => x.id)).size).toBe(36);
    expect(deck.every((x) => x.rank >= 6 && x.rank <= 14)).toBe(true);
  });

  it('shuffles deterministically for a seed', () => {
    const a = shuffle(createDeck(), 123);
    const b = shuffle(createDeck(), 123);
    const d = shuffle(createDeck(), 124);
    expect(a.items.map((x) => x.id)).toEqual(b.items.map((x) => x.id));
    expect(a.items.map((x) => x.id)).not.toEqual(d.items.map((x) => x.id));
    expect(new Set(a.items.map((x) => x.id)).size).toBe(36);
  });

  it('seeded random function is reproducible', () => {
    const r1 = makeRandom(7);
    const r2 = makeRandom(7);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it('parses ids', () => {
    expect(parseCard('14H')).toEqual(c(14, 'H'));
    expect(parseCard('10S')).toEqual(c(10, 'S'));
    expect(() => parseCard('5H')).toThrow();
  });
});

describe('beats', () => {
  const trump = 'H';
  it('higher card of the same suit beats', () => {
    expect(beats(c(6, 'S'), c(7, 'S'), trump)).toBe(true);
    expect(beats(c(10, 'S'), c(9, 'S'), trump)).toBe(false);
    expect(beats(c(10, 'S'), c(10, 'S'), trump)).toBe(false);
  });
  it('any trump beats a non-trump', () => {
    expect(beats(c(14, 'S'), c(6, 'H'), trump)).toBe(true);
  });
  it('non-trump of another suit never beats', () => {
    expect(beats(c(6, 'S'), c(14, 'D'), trump)).toBe(false);
  });
  it('only a higher trump beats a trump', () => {
    expect(beats(c(10, 'H'), c(11, 'H'), trump)).toBe(true);
    expect(beats(c(10, 'H'), c(9, 'H'), trump)).toBe(false);
    expect(beats(c(6, 'H'), c(14, 'S'), trump)).toBe(false);
  });
  it('sorts hands with trumps last', () => {
    const sorted = sortHand([c(6, 'H'), c(14, 'S'), c(7, 'C')], 'H');
    expect(sorted.map((x) => x.id)).toEqual(['14S', '7C', '6H']);
  });
});
