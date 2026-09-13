import { useState } from 'react';
import type { Difficulty } from '../engine';
import { Button } from '../components/Button';
import { Ring } from '../components/Ring';
import { Panel, Screen } from '../components/Screen';
import { ResetIcon, TrophyIcon, ZapIcon } from '../components/icons';
import type { Stats } from '../storage/stats';
import { totals } from '../storage/stats';
import styles from './Stats.module.css';

interface Props {
  stats: Stats;
  onReset: () => void;
  onBack: () => void;
}

const LABEL: Record<Difficulty, string> = { easy: 'קל', normal: 'רגיל', hard: 'קשה' };

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.tile}>
      <div className={styles.tileValue}>{value}</div>
      <div className={styles.tileLabel}>{label}</div>
    </div>
  );
}

export function StatsScreen({ stats, onReset, onBack }: Props) {
  const [confirm, setConfirm] = useState(false);
  const all = totals(stats);
  const winRate = all.games > 0 ? all.wins / all.games : 0;
  const currentStreak = Math.max(stats.easy.streak, stats.normal.streak, stats.hard.streak);
  return (
    <Screen title="סטטיסטיקות" onBack={onBack}>
      <Panel>
        <div className={styles.summary}>
          <Ring size={104} stroke={9} value={winRate} color="var(--accent-2)" label={`אחוז ניצחונות ${Math.round(winRate * 100)}`}>
            <div className={styles.ringInner}>
              <span className={styles.ringBig}>{all.games > 0 ? `${Math.round(winRate * 100)}%` : '—'}</span>
              <span className={styles.ringSmall}>ניצחונות</span>
            </div>
          </Ring>
          <div className={styles.tiles}>
            <Tile label="משחקים" value={all.games} />
            <Tile label="ניצחונות" value={all.wins} />
            <Tile label="הפסדים" value={all.losses} />
            <Tile label="תיקו" value={all.draws} />
          </div>
        </div>
        <div className={styles.streaks}>
          <div className={styles.streak}>
            <ZapIcon size={20} className={styles.streakIcon} />
            <div>
              <div className={styles.streakValue}>{currentStreak}</div>
              <div className={styles.streakLabel}>רצף נוכחי</div>
            </div>
          </div>
          <div className={styles.streak}>
            <TrophyIcon size={20} className={styles.streakIcon} />
            <div>
              <div className={styles.streakValue}>{all.bestStreak}</div>
              <div className={styles.streakLabel}>הרצף הטוב ביותר</div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="לפי רמת קושי">
        <div className={styles.rows}>
          {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
            const s = stats[d];
            const rate = s.games > 0 ? s.wins / s.games : 0;
            return (
              <div key={d} className={styles.row}>
                <Ring size={48} stroke={5} value={rate} color="var(--gold)" label={`${LABEL[d]}: ${Math.round(rate * 100)}%`}>
                  <span className={styles.rowRate}>{s.games > 0 ? Math.round(rate * 100) : '—'}</span>
                </Ring>
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>{LABEL[d]}</div>
                  <div className={styles.rowMeta}>
                    <span>{s.games} משחקים</span>
                    <span>{s.wins} נצ׳</span>
                    <span>{s.losses} הפ׳</span>
                    <span>{s.draws} תיקו</span>
                  </div>
                </div>
                <div className={styles.rowStreak}>
                  <div className={styles.rowStreakValue}>{s.bestStreak}</div>
                  <div className={styles.rowStreakLabel}>רצף שיא</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        {confirm ? (
          <div className={styles.confirm}>
            <p className={styles.confirmText}>לאפס את כל הסטטיסטיקות? אי אפשר לבטל.</p>
            <div className={styles.confirmButtons}>
              <Button
                variant="danger"
                onClick={() => {
                  onReset();
                  setConfirm(false);
                }}
              >
                כן, לאפס
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                ביטול
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" icon={<ResetIcon size={20} />} onClick={() => setConfirm(true)} disabled={all.games === 0}>
            איפוס סטטיסטיקות
          </Button>
        )}
      </Panel>
    </Screen>
  );
}
