import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { RANK_LABEL, type Card } from '../engine';
import { SuitIcon } from './icons';
import styles from './PlayingCard.module.css';

interface PlayingCardProps extends HTMLAttributes<HTMLDivElement> {
  card: Card;
  size?: 'table' | 'hand' | 'chip';
  trump?: boolean;
  selected?: boolean;
  legal?: boolean;
  dimmed?: boolean;
  enter?: 'none' | 'fromTop' | 'fromBottom' | 'defense' | 'draw';
  style?: CSSProperties;
}

export const PlayingCard = forwardRef<HTMLDivElement, PlayingCardProps>(function PlayingCard(
  { card, size = 'table', trump, selected, legal, dimmed, enter = 'none', className, style, ...rest },
  ref,
) {
  const red = card.suit === 'H' || card.suit === 'D';
  const cls = [
    styles.card,
    styles[size],
    red ? styles.red : styles.black,
    trump ? styles.trump : '',
    selected ? styles.selected : '',
    legal ? styles.legal : '',
    dimmed ? styles.dimmed : '',
    enter !== 'none' ? styles[enter] : '',
    className ?? '',
  ].join(' ');
  const label = RANK_LABEL[card.rank];
  return (
    <div ref={ref} className={cls} style={style} data-card-id={card.id} {...rest}>
      <div className={styles.corner}>
        <span className={styles.rank}>{label}</span>
        <SuitIcon suit={card.suit} className={styles.cornerSuit} />
      </div>
      <SuitIcon suit={card.suit} className={styles.centerSuit} />
      <div className={`${styles.corner} ${styles.cornerBottom}`}>
        <span className={styles.rank}>{label}</span>
        <SuitIcon suit={card.suit} className={styles.cornerSuit} />
      </div>
    </div>
  );
});

export function CardBack({ size = 'table', className, style, ...rest }: { size?: 'table' | 'hand' | 'mini' } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.card} ${styles.back} ${styles[size]} ${className ?? ''}`} style={style} {...rest}>
      <div className={styles.backInner} />
    </div>
  );
}

/** Small inline card used in the log and lists. */
export function CardChip({ card }: { card: Card }) {
  const red = card.suit === 'H' || card.suit === 'D';
  return (
    <span className={`${styles.chip} ${red ? styles.red : styles.black}`}>
      <span>{RANK_LABEL[card.rank]}</span>
      <SuitIcon suit={card.suit} size={12} />
    </span>
  );
}
