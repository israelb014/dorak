import type { Difficulty } from '../engine';

export interface DifficultyStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestStreak: number;
}

export type Stats = Record<Difficulty, DifficultyStats>;

export type Outcome = 'win' | 'loss' | 'draw';

const KEY = 'durak.stats.v1';

function emptyDifficulty(): DifficultyStats {
  return { games: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
}

export function emptyStats(): Stats {
  return { easy: emptyDifficulty(), normal: emptyDifficulty(), hard: emptyDifficulty() };
}

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<Stats>;
    const out = emptyStats();
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const p = parsed[d];
      if (p) out[d] = { ...emptyDifficulty(), ...p };
    }
    return out;
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable */
  }
}

export function recordOutcome(stats: Stats, difficulty: Difficulty, outcome: Outcome): Stats {
  const d = { ...stats[difficulty] };
  d.games += 1;
  if (outcome === 'win') {
    d.wins += 1;
    d.streak += 1;
    d.bestStreak = Math.max(d.bestStreak, d.streak);
  } else if (outcome === 'loss') {
    d.losses += 1;
    d.streak = 0;
  } else {
    d.draws += 1;
  }
  return { ...stats, [difficulty]: d };
}

export function totals(stats: Stats): DifficultyStats {
  const t = emptyDifficulty();
  for (const d of Object.values(stats)) {
    t.games += d.games;
    t.wins += d.wins;
    t.losses += d.losses;
    t.draws += d.draws;
    t.bestStreak = Math.max(t.bestStreak, d.bestStreak);
  }
  return t;
}
