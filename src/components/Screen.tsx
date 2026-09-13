import type { ReactNode } from 'react';
import { IconButton } from './Button';
import { BackIcon } from './icons';
import styles from './Screen.module.css';

interface Props {
  title: string;
  onBack?: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function Screen({ title, onBack, children, actions }: Props) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        {onBack ? (
          <IconButton label="חזרה" onClick={onBack}>
            <BackIcon size={22} />
          </IconButton>
        ) : (
          <span className={styles.spacer} />
        )}
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.spacer}>{actions}</span>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export function Panel({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <section className={`${styles.panel} ${className ?? ''}`}>
      {title ? <h2 className={styles.panelTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}
