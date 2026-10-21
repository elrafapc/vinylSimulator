import { describe, expect, it, vi } from 'vitest';
import { proxyLastfm } from './_proxy';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const req = (query: string) => `https://app.test/api/lastfm?${query}`;

describe('proxyLastfm', () => {
  it('repassa artist.getSimilar com a chave do servidor', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ similarartists: { artist: [] } }));
    const res = await proxyLastfm(req('method=artist.getSimilar&artist=Miles+Davis&limit=10'), 'secret', fetchImpl);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ similarartists: { artist: [] } });
    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe('https://ws.audioscrobbler.com/2.0/');
    expect(url.searchParams.get('method')).toBe('artist.getsimilar');
    expect(url.searchParams.get('artist')).toBe('Miles Davis');
    expect(url.searchParams.get('api_key')).toBe('secret');
    expect(url.searchParams.get('format')).toBe('json');
    expect(res.headers.get('cache-control')).toContain('s-maxage');
  });

  it('aceita artist.getTopAlbums', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({}));
    expect((await proxyLastfm(req('method=artist.getTopAlbums&artist=X'), 'k', fetchImpl)).status).toBe(200);
  });

  it('recusa qualquer outro método sem chamar o Last.fm', async () => {
    const fetchImpl = vi.fn();
    for (const method of ['user.getInfo', 'auth.getSession', '']) {
      const res = await proxyLastfm(req(`method=${method}&artist=X`), 'k', fetchImpl);
      expect(res.status).toBe(400);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('não deixa o navegador trocar a chave nem pedir limite enorme', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({}));
    await proxyLastfm(req('method=artist.getSimilar&artist=X&api_key=hacker&limit=9999'), 'secret', fetchImpl);
    const url = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(url.searchParams.getAll('api_key')).toEqual(['secret']);
    expect(url.searchParams.get('limit')).toBe('50');
  });

  it('sem artista: 400', async () => {
    expect((await proxyLastfm(req('method=artist.getSimilar'), 'k', vi.fn())).status).toBe(400);
  });

  it('sem chave configurada: 500 com motivo', async () => {
    const res = await proxyLastfm(req('method=artist.getSimilar&artist=X'), undefined, vi.fn());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'missing-key' });
  });

  it('erro do Last.fm: repassa o status e loga sem a chave', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"error":10}', { status: 403 }));
    const res = await proxyLastfm(req('method=artist.getSimilar&artist=X'), 'secret', fetchImpl);
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(JSON.stringify(error.mock.calls)).not.toContain('secret');
    error.mockRestore();
  });

  it('Last.fm fora do ar: 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await proxyLastfm(req('method=artist.getSimilar&artist=X'), 'k', vi.fn().mockRejectedValue(new TypeError('fail')));
    expect(res.status).toBe(502);
    vi.mocked(console.error).mockRestore();
  });
});
