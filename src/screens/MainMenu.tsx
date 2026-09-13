import { Button } from '../components/Button';
import { Ring } from '../components/Ring';
import { BookIcon, ChartIcon, ClubIcon, DiamondIcon, GearIcon, HeartIcon, PlayIcon, SpadeIcon } from '../components/icons';
import type { SessionRecord } from '../App';
import styles from './MainMenu.module.css';

interface Props {
  session: SessionRecord;
  onPlay: () => void;
  onSettings: () => void;
  onRules: () => void;
  onStats: () => void;
}

export function MainMenu({ session, onPlay, onSettings, onRules, onStats }: Props) {
  const played = session.wins + session.losses + session.draws;
  const ratio = played > 0 ? session.wins / played : 0;
  return (
    <div className={styles.menu}>
      <div className={styles.hero}>
        <div className={styles.suits} aria-hidden="true">
          <SpadeIcon size={22} className={styles.black} />
          <HeartIcon size={22} className={styles.red} />
          <DiamondIcon size={22} className={styles.red} />
          <ClubIcon size={22} className={styles.black} />
        </div>
        <h1 className={styles.title}>דוראק</h1>
        <p className={styles.tagline}>משחק הקלפים הרוסי הקלאסי</p>
      </div>

      <div className={styles.record}>
        <Ring size={72} stroke={6} value={ratio} color="var(--accent-2)" label={`${session.wins} ניצחונות מתוך ${played}`}>
          <span className={styles.ringValue}>{played > 0 ? `${Math.round(ratio * 100)}%` : '—'}</span>
        </Ring>
        <div className={styles.recordText}>
          <div className={styles.recordTitle}>המושב הנוכחי</div>
          <div className={styles.recordLine}>
            <span className={styles.win}>{session.wins}</span>
            <span className={styles.sep}>ניצחונות</span>
            <span className={styles.loss}>{session.losses}</span>
            <span className={styles.sep}>הפסדים</span>
            {session.draws > 0 ? (
              <>
                <span>{session.draws}</span>
                <span className={styles.sep}>תיקו</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <nav className={styles.buttons}>
        <Button variant="primary" size="lg" block icon={<PlayIcon size={22} />} onClick={onPlay}>
          התחל משחק
        </Button>
        <Button size="lg" block icon={<GearIcon size={22} />} onClick={onSettings}>
          הגדרות
        </Button>
        <Button size="lg" block icon={<BookIcon size={22} />} onClick={onRules}>
          איך משחקים
        </Button>
        <Button size="lg" block icon={<ChartIcon size={22} />} onClick={onStats}>
          סטטיסטיקות
        </Button>
      </nav>
    </div>
  );
}
