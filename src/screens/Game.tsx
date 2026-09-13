import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, GameOptions, GameResult } from '../engine';
import { useGame } from '../hooks/useGame';
import type { Settings } from '../storage/settings';
import { speedMultiplier } from '../storage/settings';
import { playSound } from '../audio/sound';
import { Opponents } from '../components/game/Opponents';
import { Table } from '../components/game/Table';
import { DeckPile, DiscardPile } from '../components/game/Piles';
import { Hand } from '../components/game/Hand';
import { ActionBar } from '../components/game/ActionBar';
import { Log } from '../components/game/Log';
import { GameOver } from '../components/game/GameOver';
import { IconButton } from '../components/Button';
import { MenuIcon } from '../components/icons';
import styles from './Game.module.css';

interface Props {
  settings: Settings;
  options: GameOptions;
  onExit: () => void;
  onGameOver: (result: GameResult) => void;
  onPlayAgain: (loser: number | null) => void;
}

const HUMAN = 0;

export function GameScreen({ settings, options, onExit, onGameOver, onPlayAgain }: Props) {
  const speed = speedMultiplier(settings.speed);
  const { ui, game, legal, humanTurn, thinking, act } = useGame({
    options,
    difficulty: settings.difficulty,
    speed,
    humanSeat: HUMAN,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const human = game.players[HUMAN];
  const hand = human?.hand ?? [];
  const defending = humanTurn && legal.canPickUp;
  const attacking = humanTurn && !defending;

  useEffect(() => {
    if (game.phase === 'over' && game.result && !reported) {
      setReported(true);
      onGameOver(game.result);
    }
  }, [game.phase, game.result, reported, onGameOver]);

  // Reset transient selection when the turn changes.
  useEffect(() => {
    setSelectedId(null);
    setTransferMode(false);
    setHint(null);
  }, [game.tick]);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 1600);
    return () => window.clearTimeout(t);
  }, [hint]);

  const defenseTargets = useCallback(
    (cardId: string): string[] =>
      Object.entries(legal.defenseOptions)
        .filter(([, cards]) => cards.some((c) => c.id === cardId))
        .map(([attackId]) => attackId),
    [legal.defenseOptions],
  );

  const legalIds = useMemo(() => {
    const ids = new Set<string>();
    if (!humanTurn) return ids;
    if (transferMode) {
      for (const c of legal.transferCards) ids.add(c.id);
      return ids;
    }
    for (const c of legal.attackCards) ids.add(c.id);
    for (const cards of Object.values(legal.defenseOptions)) for (const c of cards) ids.add(c.id);
    for (const c of legal.transferCards) ids.add(c.id);
    return ids;
  }, [humanTurn, legal, transferMode]);

  const selectedCard: Card | null = useMemo(
    () => (selectedId ? hand.find((c) => c.id === selectedId) ?? null : null),
    [hand, selectedId],
  );

  const targetIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedId || !defending || transferMode) return set;
    for (const id of defenseTargets(selectedId)) set.add(id);
    return set;
  }, [selectedId, defending, transferMode, defenseTargets]);

  /** Attempts to play a card; `target` is an attack card id when defending against a specific card. */
  const playCard = useCallback(
    (cardId: string, target: string | null): boolean => {
      if (!humanTurn) return false;
      if (attacking) {
        if (!legal.attackCards.some((c) => c.id === cardId)) return false;
        act({ type: 'attack', player: HUMAN, card: cardId });
        return true;
      }
      const isTransfer = legal.transferCards.some((c) => c.id === cardId);
      const targets = defenseTargets(cardId);
      if (target) {
        if (!targets.includes(target)) return false;
        act({ type: 'defend', player: HUMAN, card: cardId, target });
        return true;
      }
      if (transferMode || (isTransfer && targets.length === 0)) {
        if (!isTransfer) return false;
        act({ type: 'transfer', player: HUMAN, card: cardId });
        return true;
      }
      if (targets.length === 1) {
        act({ type: 'defend', player: HUMAN, card: cardId, target: targets[0] as string });
        return true;
      }
      if (targets.length > 1) {
        setSelectedId(cardId);
        setHint('בחר איזה קלף להכות');
        return false;
      }
      return false;
    },
    [humanTurn, attacking, legal, act, defenseTargets, transferMode],
  );

  const onTapCard = useCallback(
    (cardId: string) => {
      if (!legalIds.has(cardId)) return;
      playSound('tap');
      if (selectedId === cardId) {
        if (!playCard(cardId, null)) return;
        setSelectedId(null);
        return;
      }
      setSelectedId(cardId);
      if (defending && !transferMode) {
        const targets = defenseTargets(cardId);
        if (targets.length > 1) setHint('בחר איזה קלף להכות');
      }
    },
    [legalIds, selectedId, playCard, defending, transferMode, defenseTargets],
  );

  const onTapTable = useCallback(() => {
    if (!selectedId) return;
    if (playCard(selectedId, null)) setSelectedId(null);
  }, [selectedId, playCard]);

  const onTapAttack = useCallback(
    (attackId: string) => {
      if (!selectedId) return;
      if (playCard(selectedId, attackId)) setSelectedId(null);
    },
    [selectedId, playCard],
  );

  const onDrop = useCallback(
    (cardId: string, x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      const zone = el?.closest<HTMLElement>('[data-drop]');
      if (!zone) return;
      const kind = zone.dataset.drop;
      const target = kind === 'attack' ? zone.dataset.cardId ?? null : null;
      if (target) {
        if (!playCard(cardId, target)) {
          // Dropped on an attack card it cannot beat: fall back to a general table drop.
          if (playCard(cardId, null)) setSelectedId(null);
        } else {
          setSelectedId(null);
        }
        return;
      }
      if (playCard(cardId, null)) setSelectedId(null);
    },
    [playCard],
  );

  const onTransfer = useCallback(() => {
    if (legal.transferCards.length === 1) {
      act({ type: 'transfer', player: HUMAN, card: (legal.transferCards[0] as Card).id });
      return;
    }
    setTransferMode((m) => !m);
    setSelectedId(null);
    setHint('בחר קלף להעברה');
  }, [legal.transferCards, act]);

  const status = useMemo(() => {
    if (hint) return hint;
    if (game.phase === 'over') return 'המשחק נגמר';
    const actor = legal.actor;
    if (actor === null) return '';
    const name = game.players[actor]?.name ?? '';
    const mine = actor === HUMAN;
    if (game.table.length === 0) return mine ? 'אתה תוקף, בחר קלף' : `${name} תוקף`;
    if (actor === game.defender && !game.pickingUp) return mine ? 'אתה מגן' : `${name} מגן`;
    if (mine) return game.pickingUp ? 'זרוק עוד קלפים או סיים' : 'זרוק קלף או סיים';
    return `${name} זורק קלף`;
  }, [hint, game, legal.actor]);

  return (
    <div className={styles.game}>
      <header className={styles.top}>
        <IconButton label="תפריט ראשי" onClick={onExit}>
          <MenuIcon size={22} />
        </IconButton>
        <div className={styles.round}>סיבוב {game.boutNumber}</div>
        <div className={styles.limit} title="מקסימום קלפי התקפה בסיבוב">
          {game.table.length}/{game.maxAttackCards}
        </div>
      </header>

      <Opponents game={game} humanSeat={HUMAN} thinking={thinking} />

      <section className={styles.middle}>
        <DeckPile game={game} />
        <div className={styles.center}>
          <Table
            game={game}
            origins={ui.origins}
            departing={ui.departing}
            targetIds={targetIds}
            selectedCard={selectedCard}
            onTapTable={onTapTable}
            onTapAttack={onTapAttack}
          />
          <Log entries={ui.log} />
        </div>
        <DiscardPile game={game} />
      </section>

      <section className={`${styles.handArea} ${humanTurn ? styles.myTurn : ''}`}>
        <Hand
          cards={hand}
          trumpSuit={game.trumpSuit}
          legalIds={legalIds}
          selectedId={selectedId}
          enabled={humanTurn}
          onTap={onTapCard}
          onDrop={onDrop}
        />
      </section>

      <ActionBar
        status={status}
        mode={game.phase !== 'playing' ? 'idle' : defending ? 'defend' : attacking && game.table.length > 0 ? 'attack' : 'idle'}
        canPass={attacking && legal.canPass}
        canPickUp={defending && legal.canPickUp}
        canTransfer={defending && legal.transferCards.length > 0}
        transferMode={transferMode}
        onPass={() => act({ type: 'pass', player: HUMAN })}
        onPickUp={() => act({ type: 'pickUp', player: HUMAN })}
        onTransfer={onTransfer}
      />

      {game.phase === 'over' ? (
        <GameOver game={game} humanSeat={HUMAN} onAgain={() => onPlayAgain(game.result?.loser ?? null)} onMenu={onExit} />
      ) : null}
    </div>
  );
}
