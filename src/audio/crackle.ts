import { clamp, createLoop, loadSoundPrefs, saveSoundPrefs, type SoundEngine, type SoundPrefs } from './loop';

const BUFFER_SECONDS = 6;
const POPS_PER_SECOND = 9;
const MAX_GAIN = 0.6;
const PREFS_KEY = 'vinil.crackle';

export type CracklePrefs = SoundPrefs;
export type CrackleEngine = SoundEngine;

export const DEFAULT_PREFS: CracklePrefs = { enabled: true, volume: 0.35 };

export function loadCracklePrefs(): CracklePrefs {
  return loadSoundPrefs(PREFS_KEY, DEFAULT_PREFS);
}

export function saveCracklePrefs(prefs: CracklePrefs): void {
  saveSoundPrefs(PREFS_KEY, prefs);
}

// Chiado de fundo (ruído filtrado bem baixo) + estalos curtos espalhados ao acaso.
export function generateCrackle(length: number, sampleRate: number, random: () => number = Math.random): Float32Array {
  const data = new Float32Array(length);
  let hiss = 0;
  for (let i = 0; i < length; i++) {
    hiss = hiss * 0.97 + (random() * 2 - 1) * 0.03;
    data[i] += hiss * 0.25;

    if (random() < POPS_PER_SECOND / sampleRate) {
      const amplitude = 0.25 + random() * 0.75;
      const popLength = Math.floor(sampleRate * (0.0005 + random() * 0.002));
      for (let j = 0; j < popLength && i + j < length; j++) {
        const decay = Math.exp((-5 * j) / popLength);
        data[i + j] += amplitude * decay * (j % 2 === 0 ? 1 : -1) * random();
      }
    }
    data[i] = Math.max(-1, Math.min(1, data[i]));
  }
  return data;
}

export function createCrackle(
  volume = DEFAULT_PREFS.volume,
  createContext?: () => AudioContext | null,
): CrackleEngine {
  return createLoop({ seconds: BUFFER_SECONDS, maxGain: MAX_GAIN, generate: generateCrackle }, clamp(volume), createContext);
}
