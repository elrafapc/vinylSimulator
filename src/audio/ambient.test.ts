import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAmbient,
  DEFAULT_AMBIENT_PREFS,
  generateFire,
  generateRain,
  loadAmbientPrefs,
  saveAmbientPrefs,
} from './ambient';
import { seamless } from './loop';

function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function peak(data: Float32Array): number {
  return Math.max(...Array.from(data, Math.abs));
}

describe('geradores', () => {
  it.each([
    ['chuva', generateRain],
    ['lareira', generateFire],
  ])('%s gera som audível dentro de [-1, 1]', (_name, generate) => {
    const data = generate(8000, 8000, seeded());
    expect(data).toHaveLength(8000);
    expect(peak(data)).toBeLessThanOrEqual(1);
    expect(peak(data)).toBeGreaterThan(0.05);
  });

  it('é determinístico para a mesma semente', () => {
    expect(generateRain(2000, 2000, seeded(7))).toEqual(generateRain(2000, 2000, seeded(7)));
    expect(generateFire(2000, 2000, seeded(7))).toEqual(generateFire(2000, 2000, seeded(7)));
  });
});

describe('seamless', () => {
  it('o início continua de onde o fim parou', () => {
    const ramp = (total: number) => Float32Array.from({ length: total }, (_, i) => i);
    const data = seamless(ramp, 10, 4);
    expect(data).toHaveLength(10);
    // Amostra 0 = amostra 10 da geração, logo depois da última (9).
    expect(data[0]).toBe(10);
    expect(data[9]).toBe(9);
    expect(data[4]).toBe(4);
  });
});

describe('createAmbient', () => {
  it('toca em loop e retoma o áudio no próximo clique se o navegador bloqueou', () => {
    const source = { buffer: null, loop: false, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const ctx = {
      state: 'suspended',
      sampleRate: 100,
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn(() => ({ gain: { value: 0, setTargetAtTime: vi.fn() }, connect: vi.fn() })),
      createBuffer: vi.fn((_c: number, length: number) => {
        const data = new Float32Array(length);
        return { getChannelData: () => data };
      }),
      createBufferSource: vi.fn(() => source),
    };
    const engine = createAmbient('rain', 0.5, () => ctx as unknown as AudioContext);
    engine.start();
    expect(engine.running).toBe(true);
    expect(source.loop).toBe(true);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });
});

describe('preferências', () => {
  beforeEach(() => localStorage.clear());

  it('começam desligadas', () => {
    expect(loadAmbientPrefs('rain')).toEqual(DEFAULT_AMBIENT_PREFS);
    expect(DEFAULT_AMBIENT_PREFS.enabled).toBe(false);
  });

  it('chuva e lareira salvam separado', () => {
    saveAmbientPrefs('rain', { enabled: true, volume: 0.2 });
    expect(loadAmbientPrefs('rain')).toEqual({ enabled: true, volume: 0.2 });
    expect(loadAmbientPrefs('fire')).toEqual(DEFAULT_AMBIENT_PREFS);
  });
});
