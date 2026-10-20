import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDevices, getMe, searchAlbums, spotifyFetch } from './api';
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
    const albums = await searchAlbums('Kind of Blue');
    expect(albums).toEqual([
      { id: 'a1', uri: 'spotify:album:a1', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'mid' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('q=Kind+of+Blue');
    expect(fetchMock.mock.calls[0][0]).toContain('type=album');
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
