import { Button } from '../Button';
import { CheckIcon, HandIcon, TransferIcon } from '../icons';
import styles from './ActionBar.module.css';

interface Props {
  status: string;
  mode: 'attack' | 'defend' | 'idle';
  canPass: boolean;
  canPickUp: boolean;
  canTransfer: boolean;
  transferMode: boolean;
  onPass: () => void;
  onPickUp: () => void;
  onTransfer: () => void;
}

export function ActionBar({ status, mode, canPass, canPickUp, canTransfer, transferMode, onPass, onPickUp, onTransfer }: Props) {
  return (
    <footer className={styles.bar}>
      <div className={styles.status} aria-live="polite">
        {status}
      </div>
      <div className={styles.buttons}>
        {mode === 'defend' ? (
          <>
            <Button variant="danger" size="sm" icon={<HandIcon size={18} />} disabled={!canPickUp} onClick={onPickUp}>
              לוקח
            </Button>
            {canTransfer ? (
              <Button
                variant={transferMode ? 'primary' : 'secondary'}
                size="sm"
                icon={<TransferIcon size={18} />}
                onClick={onTransfer}
              >
                מעביר
              </Button>
            ) : null}
          </>
        ) : mode === 'attack' ? (
          <Button variant="primary" size="sm" icon={<CheckIcon size={18} />} disabled={!canPass} onClick={onPass}>
            סיימתי
          </Button>
        ) : null}
      </div>
    </footer>
  );
}
