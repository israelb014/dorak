import { Panel, Screen } from '../components/Screen';
import { Segmented, Toggle } from '../components/Segmented';
import type { Settings } from '../storage/settings';
import { DEFAULT_SETTINGS } from '../storage/settings';
import styles from './Settings.module.css';

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });
  const botCount = settings.playerCount - 1;
  return (
    <Screen title="הגדרות" onBack={onBack}>
      <Panel title="משחק">
        <div className={styles.row}>
          <span className={styles.label}>מספר שחקנים</span>
          <Segmented
            label="מספר שחקנים"
            value={settings.playerCount}
            onChange={(v) => set('playerCount', v)}
            options={[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
            ]}
          />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>רמת קושי</span>
          <Segmented
            label="רמת קושי"
            value={settings.difficulty}
            onChange={(v) => set('difficulty', v)}
            options={[
              { value: 'easy', label: 'קל' },
              { value: 'normal', label: 'רגיל' },
              { value: 'hard', label: 'קשה' },
            ]}
          />
        </div>
        <div className={styles.rowInline}>
          <div>
            <div className={styles.label}>העברה (פרבודנוי)</div>
            <div className={styles.help}>המגן יכול להעביר את ההתקפה עם קלף מאותו ערך</div>
          </div>
          <Toggle label="העברה" value={settings.transfer} onChange={(v) => set('transfer', v)} />
        </div>
      </Panel>

      <Panel title="תצוגה וצליל">
        <div className={styles.rowInline}>
          <div className={styles.label}>צלילים</div>
          <Toggle label="צלילים" value={settings.sound} onChange={(v) => set('sound', v)} />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>מהירות אנימציה</span>
          <Segmented
            label="מהירות אנימציה"
            value={settings.speed}
            onChange={(v) => set('speed', v)}
            options={[
              { value: 'slow', label: 'איטי' },
              { value: 'normal', label: 'רגיל' },
              { value: 'fast', label: 'מהיר' },
            ]}
          />
        </div>
      </Panel>

      <Panel title="שמות היריבים">
        {[0, 1, 2].map((i) => (
          <label key={i} className={`${styles.field} ${i >= botCount ? styles.fieldMuted : ''}`}>
            <span className={styles.label}>יריב {i + 1}</span>
            <input
              className={styles.input}
              type="text"
              maxLength={12}
              value={settings.botNames[i]}
              placeholder={DEFAULT_SETTINGS.botNames[i as 0 | 1 | 2]}
              onChange={(e) => {
                const names = [...settings.botNames] as [string, string, string];
                names[i] = e.target.value;
                set('botNames', names);
              }}
              onBlur={(e) => {
                if (!e.target.value.trim()) {
                  const names = [...settings.botNames] as [string, string, string];
                  names[i] = DEFAULT_SETTINGS.botNames[i as 0 | 1 | 2];
                  set('botNames', names);
                }
              }}
            />
          </label>
        ))}
        <p className={styles.help}>השמות של יריבים שאינם משתתפים במשחק מוצגים במעומעם.</p>
      </Panel>
    </Screen>
  );
}
