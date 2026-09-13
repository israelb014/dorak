import type { Difficulty } from '../engine';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface Settings {
  playerCount: 2 | 3 | 4;
  difficulty: Difficulty;
  transfer: boolean;
  sound: boolean;
  speed: AnimationSpeed;
  botNames: [string, string, string];
}

export const DEFAULT_SETTINGS: Settings = {
  playerCount: 2,
  difficulty: 'normal',
  transfer: false,
  sound: true,
  speed: 'normal',
  botNames: ['דימה', 'סשה', 'מישה'],
};

const KEY = 'durak.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const names = Array.isArray(parsed.botNames) ? parsed.botNames : DEFAULT_SETTINGS.botNames;
    return {
      playerCount: [2, 3, 4].includes(parsed.playerCount as number)
        ? (parsed.playerCount as 2 | 3 | 4)
        : DEFAULT_SETTINGS.playerCount,
      difficulty: ['easy', 'normal', 'hard'].includes(parsed.difficulty as string)
        ? (parsed.difficulty as Difficulty)
        : DEFAULT_SETTINGS.difficulty,
      transfer: typeof parsed.transfer === 'boolean' ? parsed.transfer : DEFAULT_SETTINGS.transfer,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      speed: ['slow', 'normal', 'fast'].includes(parsed.speed as string)
        ? (parsed.speed as AnimationSpeed)
        : DEFAULT_SETTINGS.speed,
      botNames: [0, 1, 2].map((i) => {
        const v = names[i];
        return typeof v === 'string' && v.trim() ? v.trim().slice(0, 12) : DEFAULT_SETTINGS.botNames[i as 0 | 1 | 2];
      }) as [string, string, string],
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

export function speedMultiplier(speed: AnimationSpeed): number {
  switch (speed) {
    case 'slow':
      return 1.6;
    case 'fast':
      return 0.55;
    default:
      return 1;
  }
}
