import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  applyAction, chooseBotAction, createGame, currentActor, getLegalMoves, makeRandom, randomSeed, visibleStateFor,
  type Action, type Card, type Difficulty, type GameEvent, type GameOptions, type GameState, type LegalMoves,
  type TablePair,
} from '../engine';
import { playSound, type SoundName } from '../audio/sound';

export type LogPart = string | Card;

export interface LogEntry {
  id: number;
  parts: LogPart[];
}

export interface Departing {
  pairs: TablePair[];
  mode: 'beaten' | 'pickedUp';
  /** True when the human picks up (cards fly down), false when a bot does (cards fly up). */
  toHuman: boolean;
  defender: number;
}

export interface UIState {
  game: GameState;
  log: LogEntry[];
  departing: Departing | null;
  /** Where each attack card on the table came from, for its entry animation. */
  origins: Record<string, 'top' | 'bottom'>;
  seq: number;
}

type UIAction =
  | { type: 'apply'; action: Action }
  | { type: 'clearDeparting' }
  | { type: 'reset'; state: GameState };

const MAX_LOG = 3;

function nameOf(state: GameState, seat: number): string {
  return state.players[seat]?.name ?? '';
}

function isHuman(state: GameState, seat: number): boolean {
  return state.players[seat]?.isHuman ?? false;
}

export function describeEvent(e: GameEvent, state: GameState): LogPart[] | null {
  switch (e.type) {
    case 'deal':
      return ['הקלפים חולקו'];
    case 'attack':
      return e.throwIn
        ? [nameOf(state, e.player), ' זורק ', e.card]
        : [nameOf(state, e.player), ' תוקף עם ', e.card];
    case 'defend':
      return [nameOf(state, e.player), ' מכה את ', e.target, ' עם ', e.card];
    case 'transfer':
      return [nameOf(state, e.player), ' מעביר עם ', e.card, ' אל ', nameOf(state, e.newDefender)];
    case 'pickUpDeclared':
      return [nameOf(state, e.player), ' לוקח את הקלפים'];
    case 'pass':
      return null;
    case 'boutEnd': {
      const count = e.cards.reduce((n, p) => n + 1 + (p.defense ? 1 : 0), 0);
      if (e.outcome === 'beaten') return ['ההגנה הצליחה, הקלפים נזרקים'];
      return [nameOf(state, e.defender), ` לוקח ${count} קלפים`];
    }
    case 'draw':
      return [nameOf(state, e.player), e.count === 1 ? ' מושך קלף' : ` מושך ${e.count} קלפים`];
    case 'playerOut':
      return isHuman(state, e.player) ? ['יצאת מהמשחק'] : [nameOf(state, e.player), ' יצא מהמשחק'];
    case 'gameOver':
      if (e.result.draw) return ['תיקו, ניצחון לכולם'];
      if (e.result.loser === null) return null;
      return isHuman(state, e.result.loser) ? ['אתה הדוראק!'] : [nameOf(state, e.result.loser), ' הדוראק!'];
  }
}

function initial(state: GameState): UIState {
  return { game: state, log: [{ id: 1, parts: ['הקלפים חולקו'] }], departing: null, origins: {}, seq: 1 };
}

function reducer(ui: UIState, a: UIAction): UIState {
  switch (a.type) {
    case 'reset':
      return initial(a.state);
    case 'clearDeparting':
      return ui.departing ? { ...ui, departing: null } : ui;
    case 'apply': {
      const game = applyAction(ui.game, a.action);
      let seq = ui.seq;
      const log = [...ui.log];
      let departing: Departing | null = ui.departing;
      const origins = { ...ui.origins };
      for (const e of game.events) {
        const parts = describeEvent(e, game);
        if (parts) log.push({ id: ++seq, parts });
        if (e.type === 'attack' || e.type === 'transfer') {
          origins[e.card.id] = isHuman(game, e.player) ? 'bottom' : 'top';
        }
        if (e.type === 'boutEnd') {
          departing = {
            pairs: e.cards,
            mode: e.outcome,
            toHuman: e.outcome === 'pickedUp' && isHuman(game, e.defender),
            defender: e.defender,
          };
          for (const pair of e.cards) delete origins[pair.attack.id];
        }
      }
      return { game, log: log.slice(-MAX_LOG), departing, origins, seq };
    }
  }
}

export interface UseGameParams {
  options: GameOptions;
  difficulty: Difficulty;
  /** Multiplier applied to bot delays and animation durations. */
  speed: number;
  humanSeat: number;
}

export interface Thinking {
  seat: number;
  ms: number;
  key: number;
}

export function useGame({ options, difficulty, speed, humanSeat }: UseGameParams) {
  const [ui, dispatch] = useReducer(reducer, options, (o) => initial(createGame(o)));
  const [thinking, setThinking] = useState<Thinking | null>(null);
  const random = useMemo(() => makeRandom(randomSeed()), []);
  const departTimer = useRef<number | null>(null);

  const game = ui.game;
  const actor = currentActor(game);
  const legal: LegalMoves = useMemo(() => getLegalMoves(game, humanSeat), [game, humanSeat]);
  const humanTurn = actor === humanSeat && game.phase === 'playing';

  const act = useCallback((action: Action) => {
    dispatch({ type: 'apply', action });
  }, []);

  const reset = useCallback((next: GameOptions) => {
    dispatch({ type: 'reset', state: createGame(next) });
  }, []);

  // Sounds for the latest events.
  useEffect(() => {
    const sounds: SoundName[] = [];
    for (const e of game.events) {
      if (e.type === 'attack' || e.type === 'transfer') sounds.push('play');
      else if (e.type === 'defend') sounds.push('beat');
      else if (e.type === 'boutEnd' && e.outcome === 'pickedUp') sounds.push('pickup');
      else if (e.type === 'draw' || e.type === 'deal') sounds.push('deal');
      else if (e.type === 'gameOver') {
        if (e.result.draw || e.result.loser !== humanSeat) sounds.push('win');
        else sounds.push('lose');
      }
    }
    const unique = [...new Set(sounds)];
    unique.forEach((s, i) => {
      window.setTimeout(() => playSound(s), i * 120);
    });
  }, [game.tick, game.events, humanSeat]);

  // Clear the departing animation after it has played.
  useEffect(() => {
    if (!ui.departing) return;
    if (departTimer.current) window.clearTimeout(departTimer.current);
    departTimer.current = window.setTimeout(() => {
      dispatch({ type: 'clearDeparting' });
      departTimer.current = null;
    }, 380 * speed);
    return () => {
      if (departTimer.current) window.clearTimeout(departTimer.current);
    };
  }, [ui.departing, speed]);

  // Bot driver.
  useEffect(() => {
    if (game.phase !== 'playing' || actor === null || actor === humanSeat) {
      setThinking(null);
      return;
    }
    const base = 500 + random() * 400;
    const extra = ui.departing ? 380 * speed : 0;
    const ms = Math.round(base * speed + extra);
    setThinking({ seat: actor, ms, key: game.tick });
    const t = window.setTimeout(() => {
      const view = visibleStateFor(game, actor);
      const action = chooseBotAction(view, difficulty, random);
      dispatch({ type: 'apply', action });
    }, ms);
    return () => window.clearTimeout(t);
    // ui.departing intentionally excluded: only the tick should retrigger a bot move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.tick, game.phase, actor, humanSeat, difficulty, speed, random]);

  return { ui, game, actor, legal, humanTurn, thinking, act, reset };
}
