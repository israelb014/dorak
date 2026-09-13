import type { GameState } from '../../engine';
import { Ring } from '../Ring';
import { CardBack } from '../PlayingCard';
import { ShieldIcon, SwordIcon } from '../icons';
import type { Thinking } from '../../hooks/useGame';
import styles from './Opponents.module.css';

interface Props {
  game: GameState;
  humanSeat: number;
  thinking: Thinking | null;
}

export function Opponents({ game, humanSeat, thinking }: Props) {
  const n = game.players.length;
  // Seat order clockwise after the human, so the play direction reads naturally.
  const seats: number[] = [];
  for (let i = 1; i < n; i++) seats.push((humanSeat + i) % n);
  return (
    <section className={styles.row} aria-label="יריבים">
      {seats.map((seat) => {
        const p = game.players[seat];
        if (!p) return null;
        const isAttacker = game.phase === 'playing' && game.attacker === seat;
        const isDefender = game.phase === 'playing' && game.defender === seat;
        const isThinking = thinking?.seat === seat;
        const count = p.hand.length;
        const shown = Math.min(count, 7);
        return (
          <div key={seat} className={`${styles.opponent} ${p.out ? styles.out : ''} ${isThinking ? styles.active : ''}`}>
            <div className={styles.avatarWrap}>
              {isThinking && thinking ? (
                <Ring key={thinking.key} size={46} stroke={3} value={1} animateMs={thinking.ms} label="חושב">
                  <span className={styles.initial}>{p.name.slice(0, 1)}</span>
                </Ring>
              ) : (
                <div className={styles.avatar}>
                  <span className={styles.initial}>{p.name.slice(0, 1)}</span>
                </div>
              )}
              {isAttacker ? (
                <span className={`${styles.role} ${styles.roleAttack}`}>
                  <SwordIcon size={11} />
                  תוקף
                </span>
              ) : isDefender ? (
                <span className={`${styles.role} ${styles.roleDefend}`}>
                  <ShieldIcon size={11} />
                  מגן
                </span>
              ) : p.out ? (
                <span className={`${styles.role} ${styles.roleOut}`}>יצא</span>
              ) : null}
            </div>
            <div className={styles.meta}>
              <div className={styles.name}>{p.name}</div>
              <div className={styles.cards} aria-label={`${count} קלפים`}>
                <div className={styles.fan} style={{ width: `calc(var(--mini-w) + ${Math.max(0, shown - 1)} * 7px)` }}>
                  {Array.from({ length: shown }, (_, i) => (
                    <CardBack
                      key={i}
                      size="mini"
                      className={styles.mini}
                      style={{ left: `${i * 7}px`, transform: `rotate(${(i - (shown - 1) / 2) * 5}deg)` }}
                    />
                  ))}
                </div>
                <span className={styles.count}>{count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
