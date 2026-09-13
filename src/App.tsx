import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameOptions, GameResult } from './engine';
import { randomSeed } from './engine';
import { MainMenu } from './screens/MainMenu';
import { SettingsScreen } from './screens/Settings';
import { RulesScreen } from './screens/Rules';
import { StatsScreen } from './screens/Stats';
import { GameScreen } from './screens/Game';
import { loadSettings, saveSettings, speedMultiplier, type Settings } from './storage/settings';
import { emptyStats, loadStats, recordOutcome, saveStats, type Stats } from './storage/stats';
import { setSoundEnabled, unlockAudio } from './audio/sound';

type ScreenName = 'menu' | 'settings' | 'rules' | 'stats' | 'game';

export interface SessionRecord {
  wins: number;
  losses: number;
  draws: number;
}

const HUMAN_NAME = 'אתה';

function buildOptions(settings: Settings, previousLoser: number | null): GameOptions {
  return {
    playerCount: settings.playerCount,
    transfer: settings.transfer,
    names: [HUMAN_NAME, ...settings.botNames].slice(0, settings.playerCount),
    humanIndex: 0,
    previousLoser,
    seed: randomSeed(),
  };
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('menu');
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [session, setSession] = useState<SessionRecord>({ wins: 0, losses: 0, draws: 0 });
  const [gameOptions, setGameOptions] = useState<GameOptions | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setSoundEnabled(settings.sound);
    document.documentElement.style.setProperty('--speed', String(speedMultiplier(settings.speed)));
  }, [settings.sound, settings.speed]);

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const startGame = useCallback(
    (previousLoser: number | null) => {
      unlockAudio();
      setGameOptions(buildOptions(settings, previousLoser));
      setGameKey((k) => k + 1);
      setScreen('game');
    },
    [settings],
  );

  const onGameOver = useCallback(
    (result: GameResult) => {
      const outcome = result.draw ? 'draw' : result.loser === 0 ? 'loss' : 'win';
      setStats((prev) => {
        const next = recordOutcome(prev, settings.difficulty, outcome);
        saveStats(next);
        return next;
      });
      setSession((s) => ({
        wins: s.wins + (outcome === 'win' ? 1 : 0),
        losses: s.losses + (outcome === 'loss' ? 1 : 0),
        draws: s.draws + (outcome === 'draw' ? 1 : 0),
      }));
    },
    [settings.difficulty],
  );

  const resetStats = useCallback(() => {
    const next = emptyStats();
    setStats(next);
    saveStats(next);
  }, []);

  const content = useMemo(() => {
    switch (screen) {
      case 'settings':
        return <SettingsScreen settings={settings} onChange={updateSettings} onBack={() => setScreen('menu')} />;
      case 'rules':
        return <RulesScreen onBack={() => setScreen('menu')} />;
      case 'stats':
        return <StatsScreen stats={stats} onReset={resetStats} onBack={() => setScreen('menu')} />;
      case 'game':
        if (!gameOptions) return null;
        return (
          <GameScreen
            key={gameKey}
            settings={settings}
            options={gameOptions}
            onExit={() => setScreen('menu')}
            onGameOver={onGameOver}
            onPlayAgain={(loser) => startGame(loser)}
          />
        );
      default:
        return (
          <MainMenu
            session={session}
            onPlay={() => startGame(null)}
            onSettings={() => setScreen('settings')}
            onRules={() => setScreen('rules')}
            onStats={() => setScreen('stats')}
          />
        );
    }
  }, [screen, settings, stats, session, gameOptions, gameKey, updateSettings, resetStats, onGameOver, startGame]);

  return <div className="app">{content}</div>;
}
