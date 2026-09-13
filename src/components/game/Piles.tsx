import type { GameState } from '../../engine';
import { CardBack, PlayingCard } from '../PlayingCard';
import { SuitIcon } from '../icons';
import styles from './Piles.module.css';

export function DeckPile({ game }: { game: GameState }) {
  const count = game.deck.length;
  const stack = Math.min(3, count);
  return (
    <div className={styles.deckWrap} aria-label={`קופה: ${count} קלפים`}>
      <div className={styles.deck}>
        <PlayingCard
          card={game.trumpCard}
          trump
          className={`${styles.trumpCard} ${count === 0 ? styles.trumpGone : ''}`}
        />
        {Array.from({ length: stack }, (_, i) => (
          <CardBack key={i} className={styles.deckCard} style={{ transform: `translate(${i * -2}px, ${i * -2}px)` }} />
        ))}
        {count > 0 ? <span className={styles.badge}>{count}</span> : null}
      </div>
      <div className={styles.trumpLabel}>
        <span>שליט</span>
        <SuitIcon suit={game.trumpSuit} size={14} className={game.trumpSuit === 'H' || game.trumpSuit === 'D' ? styles.red : styles.white} />
      </div>
    </div>
  );
}

export function DiscardPile({ game }: { game: GameState }) {
  const count = game.discard.length;
  const stack = Math.min(4, Math.ceil(count / 4));
  return (
    <div className={styles.discardWrap} aria-label={`ערימת השלכה: ${count} קלפים`}>
      <div className={styles.discard}>
        <div className={styles.discardSlot} />
        {Array.from({ length: stack }, (_, i) => (
          <CardBack
            key={i}
            className={styles.discardCard}
            style={{ transform: `rotate(${(i * 37) % 23 - 11}deg) translate(${(i % 2) * 3}px, ${i * -1}px)` }}
          />
        ))}
        {count > 0 ? <span className={styles.badge}>{count}</span> : null}
      </div>
      <div className={styles.label}>נזרקו</div>
    </div>
  );
}
