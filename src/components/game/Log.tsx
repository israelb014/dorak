import type { LogEntry } from '../../hooks/useGame';
import { CardChip } from '../PlayingCard';
import styles from './Log.module.css';

export function Log({ entries }: { entries: LogEntry[] }) {
  return (
    <div className={styles.log} aria-live="polite" aria-label="יומן">
      {entries.map((entry, i) => (
        <div key={entry.id} className={styles.line} style={{ opacity: 0.45 + (i / Math.max(1, entries.length - 1)) * 0.55 }}>
          {entry.parts.map((part, j) =>
            typeof part === 'string' ? <span key={j}>{part}</span> : <CardChip key={j} card={part} />,
          )}
        </div>
      ))}
    </div>
  );
}
