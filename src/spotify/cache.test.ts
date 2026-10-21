import { afterEach, describe, expect, it, vi } from 'vitest';
import { cached, clearCache, FOREVER, TEN_MINUTES } from './cache';

describe('cache', () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('carrega uma vez; chamadas simultâneas compartilham o carregamento', async () => {
    const load = vi.fn().mockResolvedValue([1, 2]);
    const [a, b] = await Promise.all([cached('k', TEN_MINUTES, load), cached('k', TEN_MINUTES, load)]);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual([1, 2]);
    await cached('k', TEN_MINUTES, load);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('com validade: depois de 10 min carrega de novo', async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValue('x');
    await cached('pl', TEN_MINUTES, load);
    vi.advanceTimersByTime(TEN_MINUTES - 1000);
    await cached('pl', TEN_MINUTES, load);
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    await cached('pl', TEN_MINUTES, load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('persistente (álbuns): sobrevive ao recarregar a página (memória limpa)', async () => {
    const load = vi.fn().mockResolvedValue({ tracks: 3 });
    await cached('album:a1', FOREVER, load, true);
    clearCache();
    expect(await cached('album:a1', FOREVER, load, true)).toEqual({ tracks: 3 });
    expect(load).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vinil.cache.album:a1')).toBe('{"tracks":3}');
  });

  it('erro não fica guardado', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('falhou')).mockResolvedValue('ok');
    await expect(cached('e', TEN_MINUTES, load)).rejects.toThrow('falhou');
    expect(await cached('e', TEN_MINUTES, load)).toBe('ok');
  });
});
