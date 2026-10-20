// Motor genérico de som em loop (buffer gerado na hora) + preferências liga/desliga e volume.

const FADE_SECONDS = 0.08;

export interface SoundPrefs {
  enabled: boolean;
  volume: number;
}

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function loadSoundPrefs(key: string, defaults: SoundPrefs): SoundPrefs {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : defaults.enabled,
      volume: typeof parsed.volume === 'number' ? clamp(parsed.volume) : defaults.volume,
    };
  } catch {
    return defaults;
  }
}

export function saveSoundPrefs(key: string, prefs: SoundPrefs): void {
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // sem storage: preferência vale só nesta aba
  }
}

// Gera `length + fade` amostras e funde o excesso no começo: o fim emenda no início sem estalo.
export function seamless(generate: (length: number) => Float32Array, length: number, fade: number): Float32Array {
  const raw = generate(length + fade);
  const data = raw.slice(0, length);
  for (let i = 0; i < fade && i < length; i++) {
    const t = i / fade;
    data[i] = raw[i] * t + raw[length + i] * (1 - t);
  }
  return data;
}

export interface SoundEngine {
  start(): void;
  stop(): void;
  setVolume(volume: number): void;
  readonly running: boolean;
}

export interface LoopOptions {
  seconds: number;
  maxGain: number;
  generate: (length: number, sampleRate: number) => Float32Array;
}

function defaultContext(): AudioContext | null {
  return typeof AudioContext === 'undefined' ? null : new AudioContext();
}

// Navegadores só liberam áudio após um gesto; se o contexto nasceu suspenso, retoma no próximo clique/tecla.
function resumeOnGesture(ctx: AudioContext): void {
  if (ctx.state !== 'suspended' || typeof document === 'undefined') return;
  const resume = () => void ctx.resume();
  document.addEventListener('pointerdown', resume, { once: true });
  document.addEventListener('keydown', resume, { once: true });
}

export function createLoop(
  { seconds, maxGain, generate }: LoopOptions,
  volume: number,
  createContext: () => AudioContext | null = defaultContext,
): SoundEngine {
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let currentVolume = clamp(volume);

  function setup(): AudioContext | null {
    if (ctx) return ctx;
    ctx = createContext();
    if (!ctx) return null;
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const length = Math.floor(ctx.sampleRate * seconds);
    buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    buffer.getChannelData(0).set(generate(length, ctx.sampleRate));
    return ctx;
  }

  return {
    get running() {
      return source !== null;
    },
    start() {
      if (source) return;
      const audio = setup();
      if (!audio || !gain || !buffer) return;
      void audio.resume();
      resumeOnGesture(audio);
      source = audio.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      gain.gain.setTargetAtTime(currentVolume * maxGain, audio.currentTime, FADE_SECONDS);
    },
    stop() {
      if (!source || !ctx || !gain) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, FADE_SECONDS);
      source.stop(ctx.currentTime + FADE_SECONDS * 4);
      source = null;
    },
    setVolume(next: number) {
      currentVolume = clamp(next);
      if (source && ctx && gain) gain.gain.setTargetAtTime(currentVolume * maxGain, ctx.currentTime, FADE_SECONDS);
    },
  };
}
