import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCrackle, DEFAULT_PREFS, generateCrackle, loadCracklePrefs, saveCracklePrefs } from './crackle';

function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function fakeContext() {
  const gainParam = { value: 0, setTargetAtTime: vi.fn() };
  const sources: Array<{ buffer: unknown; loop: boolean; connect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }> = [];
  const ctx = {
    sampleRate: 1000,
    currentTime: 0,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => ({ gain: gainParam, connect: vi.fn() })),
    createBuffer: vi.fn((_channels: number, length: number) => {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    }),
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, loop: false, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source);
      return source;
    }),
  };
  return { ctx: ctx as unknown as AudioContext, gainParam, sources };
}

describe('generateCrackle', () => {
  it('gera amostras dentro de [-1, 1] com estalos', () => {
    const data = generateCrackle(44100, 44100, seeded());
    expect(data).toHaveLength(44100);
    const max = Math.max(...Array.from(data, Math.abs));
    expect(max).toBeLessThanOrEqual(1);
    expect(max).toBeGreaterThan(0.1);
  });

  it('é determinístico para a mesma semente', () => {
    expect(generateCrackle(1000, 1000, seeded(7))).toEqual(generateCrackle(1000, 1000, seeded(7)));
  });
});

describe('createCrackle', () => {
  it('start toca o buffer em loop com fade até o volume', () => {
    const { ctx, gainParam, sources } = fakeContext();
    const engine = createCrackle(0.5, () => ctx);
    engine.start();
    expect(engine.running).toBe(true);
    expect(sources).toHaveLength(1);
    expect(sources[0].loop).toBe(true);
    expect(sources[0].start).toHaveBeenCalled();
    expect(gainParam.setTargetAtTime).toHaveBeenLastCalledWith(0.3, 0, expect.any(Number));
  });

  it('start duas vezes não duplica o som', () => {
    const { ctx, sources } = fakeContext();
    const engine = createCrackle(0.5, () => ctx);
    engine.start();
    engine.start();
    expect(sources).toHaveLength(1);
  });

  it('stop faz fade para zero e para a fonte', () => {
    const { ctx, gainParam, sources } = fakeContext();
    const engine = createCrackle(0.5, () => ctx);
    engine.start();
    engine.stop();
    expect(engine.running).toBe(false);
    expect(gainParam.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, expect.any(Number));
    expect(sources[0].stop).toHaveBeenCalled();
  });

  it('setVolume ajusta o ganho enquanto toca', () => {
    const { ctx, gainParam } = fakeContext();
    const engine = createCrackle(0.5, () => ctx);
    engine.start();
    engine.setVolume(1);
    expect(gainParam.setTargetAtTime).toHaveBeenLastCalledWith(0.6, 0, expect.any(Number));
  });

  it('sem Web Audio disponível, não faz nada', () => {
    const engine = createCrackle(0.5, () => null);
    engine.start();
    expect(engine.running).toBe(false);
  });
});

describe('preferências', () => {
  beforeEach(() => localStorage.clear());

  it('usa o padrão sem nada salvo', () => {
    expect(loadCracklePrefs()).toEqual(DEFAULT_PREFS);
  });

  it('salva e carrega', () => {
    saveCracklePrefs({ enabled: false, volume: 0.8 });
    expect(loadCracklePrefs()).toEqual({ enabled: false, volume: 0.8 });
  });

  it('ignora valores inválidos', () => {
    localStorage.setItem('vinil.crackle', '{"enabled":"sim","volume":5}');
    expect(loadCracklePrefs()).toEqual({ enabled: DEFAULT_PREFS.enabled, volume: 1 });
  });
});
