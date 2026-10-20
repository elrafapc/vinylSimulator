import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNowPlaying, next, pause, playDisc, prev, resume, setVolume } from './player';

vi.mock('./auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('token'),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const empty = (status = 204) => new Response(null, { status });
const noDevice = () =>
  json({ error: { status: 404, message: 'Player command failed: No active device found', reason: 'NO_ACTIVE_DEVICE' } }, 404);

describe('player', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const call = (i: number) => {
    const [url, init] = fetchMock.mock.calls[i];
    return { url: url as string, method: init.method as string | undefined, body: init.body as string | undefined };
  };

  it('playDisc envia o context_uri do álbum', async () => {
    fetchMock.mockResolvedValue(empty());
    await playDisc('spotify:album:a1');
    expect(call(0)).toEqual({
      url: 'https://api.spotify.com/v1/me/player/play',
      method: 'PUT',
      body: JSON.stringify({ context_uri: 'spotify:album:a1' }),
    });
  });

  it('playDisc também toca playlists', async () => {
    fetchMock.mockResolvedValue(empty());
    await playDisc('spotify:playlist:p1');
    expect(call(0).body).toBe(JSON.stringify({ context_uri: 'spotify:playlist:p1' }));
  });

  it('resume dá play sem corpo', async () => {
    fetchMock.mockResolvedValue(empty());
    await resume();
    expect(call(0)).toMatchObject({ url: 'https://api.spotify.com/v1/me/player/play', method: 'PUT', body: undefined });
  });

  it('pause, next e prev chamam os endpoints certos', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(empty()));
    await pause();
    await next();
    await prev();
    expect(call(0)).toMatchObject({ url: 'https://api.spotify.com/v1/me/player/pause', method: 'PUT' });
    expect(call(1)).toMatchObject({ url: 'https://api.spotify.com/v1/me/player/next', method: 'POST' });
    expect(call(2)).toMatchObject({ url: 'https://api.spotify.com/v1/me/player/previous', method: 'POST' });
  });

  it('setVolume envia o percentual arredondado e limitado', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(empty()));
    await setVolume(42.6);
    await setVolume(150);
    expect(call(0)).toMatchObject({ url: 'https://api.spotify.com/v1/me/player/volume?volume_percent=43', method: 'PUT' });
    expect(call(1).url).toContain('volume_percent=100');
  });

  it('getNowPlaying indica dispositivo sem volume remoto', async () => {
    fetchMock.mockResolvedValue(
      json({
        is_playing: true,
        progress_ms: 0,
        device: { name: 'iPhone', volume_percent: null, supports_volume: false },
        item: { type: 'track', name: 'X', duration_ms: 1 },
      }),
    );
    expect(await getNowPlaying()).toMatchObject({ volumePercent: undefined, supportsVolume: false });
  });

  it('sem dispositivo ativo, toca no primeiro dispositivo disponível', async () => {
    fetchMock
      .mockResolvedValueOnce(noDevice())
      .mockResolvedValueOnce(
        json({ devices: [{ id: 'd1', name: 'Mac', type: 'Computer', is_active: false, is_restricted: false }] }),
      )
      .mockResolvedValueOnce(empty());
    await playDisc('spotify:album:a1');
    expect(call(2).url).toBe('https://api.spotify.com/v1/me/player/play?device_id=d1');
  });

  it('sem nenhum dispositivo, lança "Abra o Spotify em algum dispositivo"', async () => {
    fetchMock.mockResolvedValueOnce(noDevice()).mockResolvedValueOnce(json({ devices: [] }));
    await expect(playDisc('spotify:album:a1')).rejects.toMatchObject({
      kind: 'no-device',
      message: 'Abra o Spotify em algum dispositivo',
    });
  });

  it('pause sem dispositivo ativo também vira erro claro', async () => {
    fetchMock.mockResolvedValue(json({ error: { status: 404, message: 'not found' } }, 404));
    await expect(pause()).rejects.toMatchObject({ kind: 'no-device' });
  });

  it('getNowPlaying retorna null quando nada está tocando', async () => {
    fetchMock.mockResolvedValue(empty());
    expect(await getNowPlaying()).toBeNull();
  });

  it('getNowPlaying normaliza a faixa atual', async () => {
    fetchMock.mockResolvedValue(
      json({
        is_playing: true,
        progress_ms: 1000,
        device: { name: 'Mac', volume_percent: 60, supports_volume: true },
        context: { uri: 'spotify:album:a1' },
        item: {
          id: 't1',
          type: 'track',
          name: 'So What',
          duration_ms: 545000,
          artists: [{ name: 'Miles Davis' }],
          album: { name: 'Kind of Blue', uri: 'spotify:album:a1', images: [{ url: 'img', width: 640 }] },
        },
      }),
    );
    expect(await getNowPlaying()).toEqual({
      isPlaying: true,
      trackId: 't1',
      trackName: 'So What',
      artist: 'Miles Davis',
      albumName: 'Kind of Blue',
      albumUri: 'spotify:album:a1',
      contextUri: 'spotify:album:a1',
      imageUrl: 'img',
      progressMs: 1000,
      durationMs: 545000,
      deviceName: 'Mac',
      volumePercent: 60,
      supportsVolume: true,
    });
  });
});
