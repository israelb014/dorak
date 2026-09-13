/**
 * Small deterministic PRNG (mulberry32). Pure: returns the next state along with the value.
 */
export function nextRandom(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { value, state: t };
}

/** Creates a stateful random function from a seed (used by bots and the UI). */
export function makeRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    const r = nextRandom(state);
    state = r.state;
    return r.value;
  };
}

/** Fisher–Yates shuffle driven by the seeded PRNG. Returns the shuffled copy and the new RNG state. */
export function shuffle<T>(items: readonly T[], rngState: number): { items: T[]; state: number } {
  const out = items.slice();
  let state = rngState;
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextRandom(state);
    state = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return { items: out, state };
}

export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) | 0;
}
