import { clamp, createLoop, loadSoundPrefs, saveSoundPrefs, seamless, type SoundEngine, type SoundPrefs } from './loop';

const BUFFER_SECONDS = 8;
const FADE_SECONDS = 0.25;

export type AmbientSound = 'rain' | 'fire';

const PREFS_KEYS: Record<AmbientSound, string> = { rain: 'vinil.rain', fire: 'vinil.fire' };

// Chuva e lareira começam desligadas: são opcionais e independentes da música.
export const DEFAULT_AMBIENT_PREFS: SoundPrefs = { enabled: false, volume: 0.4 };

export function loadAmbientPrefs(sound: AmbientSound): SoundPrefs {
  return loadSoundPrefs(PREFS_KEYS[sound], DEFAULT_AMBIENT_PREFS);
}

export function saveAmbientPrefs(sound: AmbientSound, prefs: SoundPrefs): void {
  saveSoundPrefs(PREFS_KEYS[sound], prefs);
}

function limit(data: Float32Array): Float32Array {
  for (let i = 0; i < data.length; i++) data[i] = Math.max(-1, Math.min(1, data[i]));
  return data;
}

// Chuva: ruído claro e contínuo (pingos ao longe) + gotas próximas, curtas e agudas.
export function generateRain(length: number, sampleRate: number, random: () => number = Math.random): Float32Array {
  const fade = Math.floor(sampleRate * FADE_SECONDS);
  return seamless(
    (total) => {
      const data = new Float32Array(total);
      let soft = 0;
      for (let i = 0; i < total; i++) {
        const white = random() * 2 - 1;
        soft = soft * 0.55 + white * 0.45;
        data[i] += soft * 0.3;

        if (random() < 30 / sampleRate) {
          const amplitude = 0.1 + random() * 0.25;
          const freq = 1800 + random() * 3200;
          const dropLength = Math.floor(sampleRate * (0.004 + random() * 0.012));
          for (let j = 0; j < dropLength && i + j < total; j++) {
            const decay = Math.exp((-6 * j) / dropLength);
            data[i + j] += amplitude * decay * Math.sin((2 * Math.PI * freq * j) / sampleRate);
          }
        }
      }
      return limit(data);
    },
    length,
    fade,
  );
}

// Lareira: ronco grave (ruído marrom) + estalos de lenha, mais longos e irregulares que os do disco.
export function generateFire(length: number, sampleRate: number, random: () => number = Math.random): Float32Array {
  const fade = Math.floor(sampleRate * FADE_SECONDS);
  return seamless(
    (total) => {
      const data = new Float32Array(total);
      let brown = 0;
      for (let i = 0; i < total; i++) {
        const white = random() * 2 - 1;
        brown = (brown + white * 0.02) / 1.02;
        data[i] += brown * 2.5;

        if (random() < 5 / sampleRate) {
          const amplitude = 0.3 + random() * 0.6;
          const popLength = Math.floor(sampleRate * (0.002 + random() * 0.008));
          for (let j = 0; j < popLength && i + j < total; j++) {
            const decay = Math.exp((-4 * j) / popLength);
            data[i + j] += amplitude * decay * (random() * 2 - 1);
          }
        }
      }
      return limit(data);
    },
    length,
    fade,
  );
}

const GENERATORS: Record<AmbientSound, (length: number, sampleRate: number) => Float32Array> = {
  rain: generateRain,
  fire: generateFire,
};

const MAX_GAIN: Record<AmbientSound, number> = { rain: 0.5, fire: 0.7 };

export function createAmbient(
  sound: AmbientSound,
  volume = DEFAULT_AMBIENT_PREFS.volume,
  createContext?: () => AudioContext | null,
): SoundEngine {
  return createLoop(
    { seconds: BUFFER_SECONDS, maxGain: MAX_GAIN[sound], generate: GENERATORS[sound] },
    clamp(volume),
    createContext,
  );
}
