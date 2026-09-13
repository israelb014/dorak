import { beats, cardValue, isTrump } from '../cards';
import { unseenCards, type VisibleState } from '../visible';
import type { Action, Card, Difficulty, TablePair } from '../types';

export type Random = () => number;

export interface DefenseChoice {
  card: Card;
  target: Card;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function pick<T>(items: readonly T[], random: Random): T {
  const idx = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[idx] as T;
}

function lowestFirst(trump: VisibleState['trumpSuit']) {
  return (a: Card, b: Card) => cardValue(a, trump) - cardValue(b, trump);
}

function unbeaten(table: TablePair[]): TablePair[] {
  return table.filter((p) => p.defense === null);
}

function rankCounts(hand: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of hand) m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  return m;
}

function isEndgame(v: VisibleState): boolean {
  return v.deckCount === 0;
}

/** Number of unseen cards that would beat `card` (a proxy for how easily the defender can answer). */
function unseenBeaters(v: VisibleState, card: Card): number {
  let n = 0;
  for (const u of unseenCards(v)) if (beats(card, u, v.trumpSuit)) n++;
  return n;
}

/**
 * Greedy cheapest assignment of my cards to the unbeaten attack cards.
 * Returns null when some card cannot be beaten.
 */
function planDefense(v: VisibleState, preferNonTrump: boolean): DefenseChoice[] | null {
  const trump = v.trumpSuit;
  const pending = unbeaten(v.table)
    .map((p) => p.attack)
    .sort((a, b) => cardValue(b, trump) - cardValue(a, trump)); // hardest first
  const available = [...v.hand].sort(lowestFirst(trump));
  const plan: DefenseChoice[] = [];
  for (const attack of pending) {
    const candidates = available.filter((c) => beats(attack, c, trump));
    if (candidates.length === 0) return null;
    let choice: Card | undefined;
    if (preferNonTrump) choice = candidates.find((c) => !isTrump(c, trump));
    if (!choice) choice = candidates[0];
    if (!choice) return null;
    plan.push({ card: choice, target: attack });
    available.splice(available.indexOf(choice), 1);
  }
  return plan;
}

function firstLegalDefense(v: VisibleState): DefenseChoice | null {
  const plan = planDefense(v, true);
  const first = plan?.[0];
  if (!first) return null;
  // The legal-move table is authoritative; make sure the choice is present in it.
  const legalForTarget = v.legal.defenseOptions[first.target.id] ?? [];
  if (!legalForTarget.some((c) => c.id === first.card.id)) return null;
  return first;
}

// ---------------------------------------------------------------------------
// Attack (opening a bout)
// ---------------------------------------------------------------------------

export function chooseAttack(v: VisibleState, difficulty: Difficulty, random: Random): Card {
  const legal = v.legal.attackCards;
  if (legal.length === 0) throw new Error('No legal attack');
  const trump = v.trumpSuit;
  if (difficulty === 'easy') return pick(legal, random);

  const counts = rankCounts(v.hand);
  const endgame = isEndgame(v);
  const scored = legal.map((c) => {
    let score = -cardValue(c, trump); // low cards first
    if (isTrump(c, trump) && !endgame) score -= 25; // keep trumps
    const pair = counts.get(c.rank) ?? 0;
    if (pair >= 2 && !isTrump(c, trump)) score += 3; // pairs are good for throw-ins
    if (difficulty === 'hard') {
      const beaters = unseenBeaters(v, c);
      score -= beaters * 0.4; // prefer cards the defender likely cannot beat
      if (endgame) {
        const defender = v.players[v.defender];
        if (defender && beaters === 0) score += 40; // guaranteed pick-up
        if (defender && defender.handCount <= 2 && beaters === 0) score += 20;
      }
    }
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return (scored[0] as { c: Card }).c;
}

// ---------------------------------------------------------------------------
// Throw-in
// ---------------------------------------------------------------------------

export function chooseThrowIn(v: VisibleState, difficulty: Difficulty, random: Random): Card | null {
  const legal = v.legal.attackCards;
  if (legal.length === 0) return null;
  const trump = v.trumpSuit;
  if (difficulty === 'easy') {
    // Easy bots throw in about half the time, never with trumps unless nothing else.
    const nonTrump = legal.filter((c) => !isTrump(c, trump));
    const pool = nonTrump.length > 0 ? nonTrump : legal;
    if (random() < 0.5) return null;
    return pick(pool, random);
  }
  const endgame = isEndgame(v);
  const defender = v.players[v.defender];
  const defenderCount = defender?.handCount ?? 0;
  const counts = rankCounts(v.hand);

  const candidates = legal.filter((c) => {
    if (isTrump(c, trump)) {
      // Never feed trumps; in the endgame dump them only when it ends the game.
      return endgame && v.hand.length === 1;
    }
    return true;
  });
  if (candidates.length === 0) return null;

  if (v.pickingUp) {
    // Defender is taking everything: only feed junk, unless dumping cards ends the game.
    if (difficulty === 'hard' && !endgame) {
      const junk = candidates.filter((c) => c.rank <= 10);
      if (junk.length === 0) return null;
      return [...junk].sort(lowestFirst(trump))[0] ?? null;
    }
    const low = candidates.filter((c) => c.rank <= 10 || endgame);
    if (low.length === 0) return null;
    return [...low].sort(lowestFirst(trump))[0] ?? null;
  }

  // Defender is still fighting: throw low cards and pairs; keep strong non-trumps.
  const scored = candidates.map((c) => {
    let score = -cardValue(c, trump);
    if ((counts.get(c.rank) ?? 0) >= 2) score += 2;
    if (difficulty === 'hard') {
      score -= unseenBeaters(v, c) * 0.3;
      if (endgame && v.deckCount === 0 && defenderCount <= 2) score += 10;
    }
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;
  // Do not throw high non-trumps that the defender would happily beat and that we may need.
  const threshold = endgame ? 15 : difficulty === 'hard' ? 12 : 11;
  if (best.c.rank > threshold && !endgame) return null;
  // Do not exhaust our own hand early when the deck is empty and it leaves us weak? No: dumping is good.
  return best.c;
}

// ---------------------------------------------------------------------------
// Defense
// ---------------------------------------------------------------------------

export function shouldPickUp(v: VisibleState, difficulty: Difficulty): boolean {
  const plan = planDefense(v, true);
  if (!plan) return true;
  if (difficulty === 'easy') return false;
  const trump = v.trumpSuit;
  const trumpsNeeded = plan.filter((d) => isTrump(d.card, trump)).length;
  const highTrumpsNeeded = plan.filter((d) => isTrump(d.card, trump) && d.card.rank >= 12).length;
  const tableCards = v.table.reduce((n, p) => n + 1 + (p.defense ? 1 : 0), 0);
  if (v.deckCount > 12 && trumpsNeeded >= 2) return true;
  if (difficulty === 'hard') {
    // Do not spend a high trump on a lone low card early when the table is small.
    if (v.deckCount > 6 && highTrumpsNeeded >= 1 && tableCards <= 1) {
      const attack = plan[0]?.target;
      if (attack && !isTrump(attack, trump) && attack.rank <= 9) return true;
    }
    // Never pick up in the endgame if defending can finish the game.
    if (isEndgame(v) && plan.length === v.hand.length) return false;
  }
  return false;
}

export function chooseDefense(
  v: VisibleState,
  difficulty: Difficulty,
  _random: Random,
): DefenseChoice | null {
  const legalTargets = Object.keys(v.legal.defenseOptions);
  if (legalTargets.length === 0) return null;
  const trump = v.trumpSuit;

  if (difficulty === 'easy') {
    // Lowest legal card on any attack card.
    let best: DefenseChoice | null = null;
    for (const pair of unbeaten(v.table)) {
      for (const c of v.legal.defenseOptions[pair.attack.id] ?? []) {
        if (!best || cardValue(c, trump) < cardValue(best.card, trump)) {
          best = { card: c, target: pair.attack };
        }
      }
    }
    return best;
  }

  const first = firstLegalDefense(v);
  if (!first) return null;
  if (difficulty === 'hard' && isEndgame(v)) {
    // In the endgame, if a non-trump can be saved by using a trump we no longer need, prefer keeping a suit
    // that the remaining opponents cannot beat. Simple exact-count heuristic: prefer the card with the
    // fewest unseen beaters to remain in hand, i.e. spend the card with the most unseen beaters.
    const options = v.legal.defenseOptions[first.target.id] ?? [];
    if (options.length > 1) {
      const scored = options.map((c) => ({
        c,
        // Cheap cards first; break ties by spending the card that is least useful for attacking later.
        score: cardValue(c, trump) * 10 - unseenBeaters(v, c),
      }));
      scored.sort((a, b) => a.score - b.score);
      const choice = scored[0];
      if (choice) return { card: choice.c, target: first.target };
    }
  }
  return first;
}

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

export function shouldTransfer(v: VisibleState, difficulty: Difficulty, random: Random): Card | null {
  const legal = v.legal.transferCards;
  if (legal.length === 0) return null;
  const trump = v.trumpSuit;
  const sorted = [...legal].sort(lowestFirst(trump));
  if (difficulty === 'easy') return random() < 0.6 ? (sorted[0] ?? null) : null;
  // Normal/hard: transfer with a non-trump whenever possible; use a trump only if defending would cost more.
  const nonTrump = sorted.find((c) => !isTrump(c, trump));
  if (nonTrump) return nonTrump;
  const plan = planDefense(v, true);
  const cost = plan ? plan.filter((d) => isTrump(d.card, trump)).length : Infinity;
  if (cost >= 1 && sorted[0]) return sorted[0];
  return null;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/** Chooses a complete, legal action for the bot at `v.me`. */
export function chooseBotAction(v: VisibleState, difficulty: Difficulty, random: Random): Action {
  const legal = v.legal;
  const me = v.me;
  if (legal.actor !== me) throw new Error('Not this bot\'s turn');

  if (v.table.length === 0) {
    return { type: 'attack', player: me, card: chooseAttack(v, difficulty, random).id };
  }
  if (me === v.defender && !v.pickingUp) {
    if (v.transferEnabled) {
      const t = shouldTransfer(v, difficulty, random);
      if (t) return { type: 'transfer', player: me, card: t.id };
    }
    if (shouldPickUp(v, difficulty)) return { type: 'pickUp', player: me };
    const d = chooseDefense(v, difficulty, random);
    if (!d) return { type: 'pickUp', player: me };
    return { type: 'defend', player: me, card: d.card.id, target: d.target.id };
  }
  const t = chooseThrowIn(v, difficulty, random);
  if (t) return { type: 'attack', player: me, card: t.id };
  return { type: 'pass', player: me };
}
