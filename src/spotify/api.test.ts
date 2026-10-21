import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDevices, getDiscTracks, getMe, getMyPlaylists, getPlaylistDisc, parseDiscUri, searchDiscs, spotifyFetch } from './api';
import { SpotifyError } from './errors';

vi.mock('./auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('token'),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('api', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('envia o token no header', async () => {
    fetchMock.mockResolvedValue(json({ id: 'u1', display_name: 'Rafael' }));
    expect(await getMe()).toEqual({ id: 'u1', displayName: 'Rafael' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.spotify.com/v1/me');
    expect(init.headers.Authorization).toBe('Bearer token');
  });

  it('busca álbuns e normaliza o resultado', async () => {
    fetchMock.mockResolvedValue(
      json({
        albums: {
          items: [
            {
              id: 'a1',
              uri: 'spotify:album:a1',
              name: 'Kind of Blue',
              artists: [{ name: 'Miles Davis' }],
              images: [
                { url: 'small', width: 64 },
                { url: 'big', width: 640 },
                { url: 'mid', width: 300 },
              ],
            },
            null,
          ],
        },
      }),
    );
    const discs = await searchDiscs('Kind of Blue');
    expect(discs).toEqual([
      { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'mid' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('q=Kind+of+Blue');
    expect(fetchMock.mock.calls[0][0]).toContain('type=album%2Cplaylist');
  });

  it('busca playlists junto, depois dos álbuns', async () => {
    fetchMock.mockResolvedValue(
      json({
        albums: { items: [{ id: 'a1', uri: 'spotify:album:a1', name: 'A', artists: [{ name: 'X' }], images: [] }] },
        playlists: {
          items: [
            null,
            { id: 'p1', uri: 'spotify:playlist:p1', name: 'Jazz para trabalhar', owner: { display_name: 'Rafael' }, images: null },
          ],
        },
      }),
    );
    expect(await searchDiscs('jazz')).toEqual([
      { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'A', artist: 'X', imageUrl: undefined },
      { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz para trabalhar', artist: 'Rafael', imageUrl: undefined },
    ]);
  });

  it('lista minhas playlists como discos', async () => {
    fetchMock.mockResolvedValue(
      json({
        items: [
          { id: 'p1', uri: 'spotify:playlist:p1', name: 'Foco', owner: { display_name: 'Rafael' }, images: [{ url: 'img', width: 300 }] },
          null,
        ],
        next: null,
      }),
    );
    expect(await getMyPlaylists()).toEqual([
      { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Foco', artist: 'Rafael', imageUrl: 'img' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.spotify.com/v1/me/playlists?limit=50&offset=0');
  });

  it('carrega todas as páginas de playlists', async () => {
    const page = (ids: string[], next: string | null) =>
      json({ items: ids.map((id) => ({ id, uri: `spotify:playlist:${id}`, name: id, owner: { display_name: 'R' }, images: null })), next });
    fetchMock.mockResolvedValueOnce(page(['p1', 'p2'], 'https://next')).mockResolvedValueOnce(page(['p3'], null));
    expect((await getMyPlaylists()).map((d) => d.id)).toEqual(['p1', 'p2', 'p3']);
    expect(fetchMock.mock.calls[1][0]).toContain('offset=50');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('dados de uma playlist pelo id', async () => {
    fetchMock.mockResolvedValue(
      json({ id: 'p9', uri: 'spotify:playlist:p9', name: 'Jazz da Ana', owner: { display_name: 'Ana' }, images: [{ url: 'img', width: 300 }] }),
    );
    expect(await getPlaylistDisc('p9')).toEqual({
      id: 'p9', uri: 'spotify:playlist:p9', kind: 'playlist', name: 'Jazz da Ana', artist: 'Ana', imageUrl: 'img',
    });
    expect(fetchMock.mock.calls[0][0]).toContain('/playlists/p9?fields=');
  });

  it('lista dispositivos ignorando os sem id', async () => {
    fetchMock.mockResolvedValue(
      json({
        devices: [
          { id: 'd1', name: 'Mac', type: 'Computer', is_active: true, is_restricted: false },
          { id: null, name: 'X', type: 'Speaker', is_active: false, is_restricted: true },
        ],
      }),
    );
    expect(await getDevices()).toEqual([
      { id: 'd1', name: 'Mac', type: 'Computer', isActive: true, isRestricted: false },
    ]);
  });

  it('identifica álbum e playlist pelo uri', () => {
    expect(parseDiscUri('spotify:album:a1')).toEqual({ kind: 'album', id: 'a1' });
    expect(parseDiscUri('spotify:playlist:p1')).toEqual({ kind: 'playlist', id: 'p1' });
    expect(parseDiscUri('spotify:user:u1:collection')).toBeNull();
    expect(parseDiscUri(undefined)).toBeNull();
  });

  it('faixas do álbum via GET /albums/{id}', async () => {
    fetchMock.mockResolvedValue(
      json({
        tracks: {
          items: [{ id: 't1', track_number: 1, name: 'So What', duration_ms: 545000, artists: [{ name: 'Miles Davis' }] }],
        },
      }),
    );
    expect(await getDiscTracks('spotify:album:a1')).toEqual([
      { id: 't1', number: 1, name: 'So What', artist: 'Miles Davis', durationMs: 545000 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.spotify.com/v1/albums/a1');
  });

  it('faixas da playlist via /items, numeradas pela posição', async () => {
    fetchMock.mockResolvedValue(
      json({
        items: [
          { item: { id: 't1', name: 'A', duration_ms: 1000, artists: [{ name: 'X' }] } },
          null,
          { track: { id: 't2', name: 'B', duration_ms: 2000 } },
        ],
      }),
    );
    expect(await getDiscTracks('spotify:playlist:p1')).toEqual([
      { id: 't1', number: 1, name: 'A', artist: 'X', durationMs: 1000 },
      { id: 't2', number: 2, name: 'B', artist: '', durationMs: 2000 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.spotify.com/v1/playlists/p1/items?limit=50');
  });

  it('playlist de outra pessoa lança erro', async () => {
    fetchMock.mockResolvedValue(json({ error: { status: 403, message: 'Forbidden' } }, 403));
    await expect(getDiscTracks('spotify:playlist:p9')).rejects.toMatchObject({ status: 403 });
  });

  it('converte falha de rede em erro claro', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(spotifyFetch('/me')).rejects.toMatchObject({ kind: 'network' });
  });

  it('converte 401 sem renovação em erro de sessão', async () => {
    fetchMock.mockResolvedValue(json({}, 401));
    await expect(spotifyFetch('/me')).rejects.toBeInstanceOf(SpotifyError);
    await expect(spotifyFetch('/me')).rejects.toMatchObject({ kind: 'auth' });
  });
});

describe('cache (T46)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const album = () =>
    json({ tracks: { items: [{ id: 't1', track_number: 1, name: 'So What', duration_ms: 1, artists: [] }] } });

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('faixas de álbum: uma chamada só, guardadas também no localStorage', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(album()));
    await getDiscTracks('spotify:album:a1');
    await getDiscTracks('spotify:album:a1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vinil.cache.album:a1')).toContain('So What');
  });

  it('busca: mesmo termo (ignorando maiúsculas/espaços) não chama de novo', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({ albums: { items: [] }, playlists: { items: [] } })));
    await searchDiscs('Kind of Blue');
    await searchDiscs('  kind of blue ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await searchDiscs('Blue Train');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('minhas playlists: uma chamada por página em 10 min', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({ items: [], next: null })));
    await getMyPlaylists();
    await getMyPlaylists();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
