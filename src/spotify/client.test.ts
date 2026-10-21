import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callsLastMinute, rateLimitedUntil, spotifyFetch } from './client';

vi.mock('./auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('token'),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
}));

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

describe('cliente do Spotify', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.mocked(console.error).mockRestore();
  });

  describe('429 + Retry-After', () => {
    it('não repete na hora: lança "rate-limit" e pausa TODAS as chamadas pelo Retry-After', async () => {
      vi.useFakeTimers();
      fetchMock.mockResolvedValueOnce(json({ error: { status: 429 } }, 429, { 'Retry-After': '3' })).mockResolvedValue(json({ ok: 1 }));

      await expect(spotifyFetch('/me/player')).rejects.toMatchObject({ kind: 'rate-limit' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(rateLimitedUntil()).toBeGreaterThan(Date.now());

      // Outra chamada (outro endpoint, outro método) espera a pausa acabar.
      const pending = spotifyFetch('/me/player/pause', { method: 'PUT' });
      await vi.advanceTimersByTimeAsync(2900);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(200);
      await pending;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(rateLimitedUntil()).toBe(0);
    });

    it('sem Retry-After, pausa 5s', async () => {
      vi.useFakeTimers();
      fetchMock.mockResolvedValueOnce(json({}, 429)).mockResolvedValue(json({}));
      await expect(spotifyFetch('/me')).rejects.toMatchObject({ kind: 'rate-limit' });
      const pending = spotifyFetch('/me');
      await vi.advanceTimersByTimeAsync(4900);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(200);
      await pending;
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('loga método, URL, status e corpo', async () => {
      fetchMock.mockResolvedValue(json({ error: { status: 429, message: 'API rate limit exceeded' } }, 429, { 'Retry-After': '0' }));
      await expect(spotifyFetch('/search?q=x')).rejects.toBeTruthy();
      expect(console.error).toHaveBeenCalledWith('Spotify', 'GET', 'https://api.spotify.com/v1/search?q=x', 429, {
        error: { status: 429, message: 'API rate limit exceeded' },
      });
    });
  });

  describe('deduplicação', () => {
    it('GETs iguais em andamento viram uma requisição; cada um lê sua cópia', async () => {
      let resolve!: (r: Response) => void;
      fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
      const a = spotifyFetch('/albums/a1');
      const b = spotifyFetch('/albums/a1');
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      resolve(json({ name: 'Kind of Blue' }));
      const [ra, rb] = await Promise.all([a, b]);
      expect(await ra.json()).toEqual({ name: 'Kind of Blue' });
      expect(await rb.json()).toEqual({ name: 'Kind of Blue' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('depois de terminar, um novo GET vai à rede de novo', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(json({})));
      await spotifyFetch('/me/player');
      await spotifyFetch('/me/player');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('URLs diferentes e comandos (PUT/POST) não são juntados', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(json({})));
      await Promise.all([
        spotifyFetch('/albums/a1'),
        spotifyFetch('/albums/a2'),
        spotifyFetch('/me/player/next', { method: 'POST' }),
        spotifyFetch('/me/player/next', { method: 'POST' }),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('erro chega a todos que esperavam', async () => {
      fetchMock.mockResolvedValueOnce(json({ error: { status: 500 } }, 500));
      const results = await Promise.allSettled([spotifyFetch('/me'), spotifyFetch('/me')]);
      expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('conta chamadas do último minuto', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    await spotifyFetch('/me');
    await spotifyFetch('/me/player/pause', { method: 'PUT' });
    expect(callsLastMinute()).toBe(2);
    await vi.advanceTimersByTimeAsync(61_000);
    expect(callsLastMinute()).toBe(0);
  });
});
