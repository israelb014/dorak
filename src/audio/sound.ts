export type SoundName = 'play' | 'beat' | 'pickup' | 'deal' | 'win' | 'lose' | 'tap';

let ctx: AudioContext | null = null;
let enabled = true;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** Warm up the audio context on the first user gesture (required on iOS). */
export function unlockAudio(): void {
  if (!enabled) return;
  const c = getContext();
  if (!c) return;
  const g = c.createGain();
  g.gain.value = 0;
  const o = c.createOscillator();
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.01);
}

interface Tone {
  freq: number;
  to?: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

function tones(c: AudioContext, list: Tone[]): void {
  const now = c.currentTime;
  for (const t of list) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = t.type ?? 'triangle';
    osc.frequency.setValueAtTime(t.freq, now + t.at);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, now + t.at + t.dur);
    const g = t.gain ?? 0.16;
    gain.gain.setValueAtTime(0.0001, now + t.at);
    gain.gain.exponentialRampToValueAtTime(g, now + t.at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.at + t.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(now + t.at);
    osc.stop(now + t.at + t.dur + 0.02);
  }
}

function noise(c: AudioContext, at: number, dur: number, gainValue: number): void {
  const size = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, size, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  filter.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.value = gainValue;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(c.currentTime + at);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;
  const c = getContext();
  if (!c) return;
  try {
    switch (name) {
      case 'play':
        noise(c, 0, 0.06, 0.25);
        tones(c, [{ freq: 520, to: 300, at: 0, dur: 0.08, gain: 0.08 }]);
        break;
      case 'beat':
        noise(c, 0, 0.05, 0.2);
        tones(c, [
          { freq: 440, at: 0, dur: 0.07, gain: 0.1 },
          { freq: 660, at: 0.06, dur: 0.1, gain: 0.1 },
        ]);
        break;
      case 'pickup':
        tones(c, [
          { freq: 380, to: 180, at: 0, dur: 0.22, type: 'sawtooth', gain: 0.07 },
          { freq: 300, to: 140, at: 0.08, dur: 0.22, type: 'sawtooth', gain: 0.05 },
        ]);
        break;
      case 'deal':
        noise(c, 0, 0.05, 0.18);
        noise(c, 0.07, 0.05, 0.14);
        break;
      case 'tap':
        tones(c, [{ freq: 900, at: 0, dur: 0.04, type: 'sine', gain: 0.05 }]);
        break;
      case 'win':
        tones(c, [
          { freq: 523, at: 0, dur: 0.14, gain: 0.12 },
          { freq: 659, at: 0.13, dur: 0.14, gain: 0.12 },
          { freq: 784, at: 0.26, dur: 0.16, gain: 0.12 },
          { freq: 1047, at: 0.4, dur: 0.35, gain: 0.14 },
        ]);
        break;
      case 'lose':
        tones(c, [
          { freq: 392, at: 0, dur: 0.2, type: 'sawtooth', gain: 0.07 },
          { freq: 349, at: 0.2, dur: 0.2, type: 'sawtooth', gain: 0.07 },
          { freq: 311, at: 0.4, dur: 0.2, type: 'sawtooth', gain: 0.07 },
          { freq: 262, at: 0.6, dur: 0.5, type: 'sawtooth', gain: 0.08 },
        ]);
        break;
    }
  } catch {
    /* audio failure is never fatal */
  }
}
