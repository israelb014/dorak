import type { Card, GameState, TablePair } from '../../engine';
import type { Departing } from '../../hooks/useGame';
import { PlayingCard } from '../PlayingCard';
import styles from './Table.module.css';

interface Props {
  game: GameState;
  origins: Record<string, 'top' | 'bottom'>;
  departing: Departing | null;
  /** Attack cards that the currently selected hand card can beat. */
  targetIds: Set<string>;
  selectedCard: Card | null;
  onTapTable: () => void;
  onTapAttack: (attackId: string) => void;
}

export function Table({ game, origins, departing, targetIds, selectedCard, onTapTable, onTapAttack }: Props) {
  const pairs: TablePair[] = departing ? departing.pairs : game.table;
  const exitClass = departing
    ? departing.mode === 'beaten'
      ? styles.exitDiscard
      : departing.toHuman
        ? styles.exitDown
        : styles.exitUp
    : '';
  const empty = pairs.length === 0;
  return (
    <div
      className={`${styles.table} ${selectedCard ? styles.armed : ''}`}
      data-drop="table"
      onPointerUp={() => onTapTable()}
      role="group"
      aria-label="השולחן"
    >
      {empty ? <div className={styles.hint}>{game.phase === 'playing' ? 'השולחן ריק' : ''}</div> : null}
      <div className={styles.grid}>
        {pairs.map((pair, i) => {
          const target = !departing && targetIds.has(pair.attack.id);
          return (
            <div key={pair.attack.id} className={`${styles.slot} ${exitClass}`} style={{ animationDelay: `${i * 30}ms` }}>
              <div
                className={`${styles.attack} ${target ? styles.target : ''}`}
                data-drop="attack"
                data-card-id={pair.attack.id}
                onPointerUp={(e) => {
                  if (target) {
                    e.stopPropagation();
                    onTapAttack(pair.attack.id);
                  }
                }}
              >
                <PlayingCard
                  card={pair.attack}
                  trump={pair.attack.suit === game.trumpSuit}
                  enter={departing ? 'none' : origins[pair.attack.id] === 'bottom' ? 'fromBottom' : 'fromTop'}
                  legal={target}
                />
              </div>
              {pair.defense ? (
                <div className={styles.defense}>
                  <PlayingCard
                    card={pair.defense}
                    trump={pair.defense.suit === game.trumpSuit}
                    enter={departing ? 'none' : 'defense'}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
