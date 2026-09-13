import type { GameState } from '../../engine';
import { Button } from '../Button';
import { CrownIcon, MenuIcon, PlayIcon } from '../icons';
import styles from './GameOver.module.css';

interface Props {
  game: GameState;
  humanSeat: number;
  onAgain: () => void;
  onMenu: () => void;
}

export function GameOver({ game, humanSeat, onAgain, onMenu }: Props) {
  const result = game.result;
  if (!result) return null;
  const loser = result.loser;
  const humanLost = loser === humanSeat;
  const title = result.draw ? 'תיקו' : humanLost ? 'אתה הדוראק' : 'ניצחת!';
  const subtitle = result.draw
    ? 'ניצחון לכולם'
    : humanLost
      ? 'נשארת עם קלפים ביד'
      : `${game.players[loser ?? 0]?.name ?? ''} הדוראק`;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="gameover-title">
      <div className={`${styles.panel} ${humanLost ? styles.lost : styles.won}`}>
        <div className={styles.crown}>
          <CrownIcon size={34} />
        </div>
        <h2 id="gameover-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <ul className={styles.list}>
          {game.players.map((p) => {
            const isLoser = loser === p.id;
            const label = result.draw ? 'תיקו' : isLoser ? 'דוראק' : 'ניצח';
            return (
              <li key={p.id} className={`${styles.item} ${isLoser ? styles.itemLoser : ''}`}>
                <span className={styles.itemName}>{p.name}</span>
                <span className={styles.itemResult}>{label}</span>
              </li>
            );
          })}
        </ul>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" block icon={<PlayIcon size={20} />} onClick={onAgain}>
            משחק נוסף
          </Button>
          <Button variant="ghost" size="md" block icon={<MenuIcon size={20} />} onClick={onMenu}>
            תפריט ראשי
          </Button>
        </div>
      </div>
    </div>
  );
}
