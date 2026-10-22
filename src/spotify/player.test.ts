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

  const devices = (list: Array<{ id: string; active?: boolean; restricted?: boolean }>) =>
    json({
      devices: list.map((d) => ({ id: d.id, name: d.id, type: 'Computer', is_active: d.active ?? false, is_restricted: d.restricted ?? false })),
    });
  const player = (shuffle: boolean) => json({ is_playing: true, shuffle_state: shuffle, item: null });

  // Responde por endpoint, para o teste conferir a ordem das chamadas.
  function spotify({ deviceList = devices([{ id: 'd1', active: true }]), shuffleStates = [false] } = {}) {
    const states = [...shuffleStates];
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/me/player/devices')) return Promise.resolve(deviceList.clone());
      if (url.endsWith('/me/player')) return Promise.resolve(player(states.length > 1 ? states.shift()! : states[0]));
      return Promise.resolve(empty());
    });
  }

  const urls = () => fetchMock.mock.calls.map(([url, init]) => `${(init?.method as string | undefined) ?? 'GET'} ${(url as string).replace('https://api.spotify.com/v1', '')}`);

  it('playDisc desliga o aleatório antes e depois do play, na ordem certa', async () => {
    spotify();
    await playDisc('spotify:album:a1');
    expect(urls()).toEqual([
      'GET /me/player/devices',
      'PUT /me/player/shuffle?state=false&device_id=d1',
      'PUT /me/player/play?device_id=d1',
      'PUT /me/player/shuffle?state=false&device_id=d1',
      'GET /me/player',
    ]);
  });

  it('playDisc começa da faixa 1, do início', async () => {
    spotify();
    await playDisc('spotify:album:a1');
    expect(call(2).body).toBe(JSON.stringify({ context_uri: 'spotify:album:a1', offset: { position: 0 }, position_ms: 0 }));
  });

  it('T56: clicar numa faixa toca o disco a partir dela (offset pela uri da faixa), sem aleatório', async () => {
    spotify();
    await playDisc('spotify:album:a1', undefined, 'spotify:track:t3');
    expect(call(2).body).toBe(
      JSON.stringify({ context_uri: 'spotify:album:a1', offset: { uri: 'spotify:track:t3' }, position_ms: 0 }),
    );
    expect(urls().filter((u) => u.includes('/shuffle'))).toHaveLength(2);
  });

  it('playlists seguem a mesma regra', async () => {
    spotify();
    await playDisc('spotify:playlist:p1');
    expect(urls()).toContain('PUT /me/player/shuffle?state=false&device_id=d1');
    expect(call(2).body).toBe(JSON.stringify({ context_uri: 'spotify:playlist:p1', offset: { position: 0 }, position_ms: 0 }));
  });

  it('se o aleatório continuar ligado, desliga mais uma vez e avisa no console', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    spotify({ shuffleStates: [true] });
    await playDisc('spotify:album:a1');
    expect(urls().slice(-2)).toEqual(['GET /me/player', 'PUT /me/player/shuffle?state=false&device_id=d1']);
    expect(urls().filter((u) => u.includes('/shuffle'))).toHaveLength(3);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('usa o dispositivo ativo; sem ativo, o primeiro disponível (ignorando restritos)', async () => {
    spotify({ deviceList: devices([{ id: 'd1' }, { id: 'd2', active: true }]) });
    await playDisc('spotify:album:a1');
    expect(urls()[2]).toBe('PUT /me/player/play?device_id=d2');

    fetchMock.mockReset();
    spotify({ deviceList: devices([{ id: 'r1', restricted: true }, { id: 'd3' }]) });
    await playDisc('spotify:album:a1');
    expect(urls().every((u) => !u.includes('device_id=') || u.includes('device_id=d3'))).toBe(true);
  });

  it('T46: com o dispositivo já conhecido (polling), não lista dispositivos', async () => {
    spotify();
    await playDisc('spotify:album:a1', 'd9');
    expect(urls()).toEqual([
      'PUT /me/player/shuffle?state=false&device_id=d9',
      'PUT /me/player/play?device_id=d9',
      'PUT /me/player/shuffle?state=false&device_id=d9',
      'GET /me/player',
    ]);
  });

  it('dispositivo ocioso que recusa o primeiro shuffle ainda toca e desliga depois', async () => {
    spotify({ deviceList: devices([{ id: 'd1' }]) });
    const base = fetchMock.getMockImplementation()!;
    let first = true;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/shuffle') && first) {
        first = false;
        return Promise.resolve(noDevice());
      }
      return base(url, init);
    });
    await playDisc('spotify:album:a1');
    expect(urls()).toContain('PUT /me/player/play?device_id=d1');
    expect(urls().filter((u) => u.includes('/shuffle'))).toHaveLength(2);
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

  it('resume sem dispositivo ativo toca no primeiro dispositivo disponível', async () => {
    fetchMock
      .mockResolvedValueOnce(noDevice())
      .mockResolvedValueOnce(
        json({ devices: [{ id: 'd1', name: 'Mac', type: 'Computer', is_active: false, is_restricted: false }] }),
      )
      .mockResolvedValueOnce(empty());
    await resume();
    expect(call(2).url).toBe('https://api.spotify.com/v1/me/player/play?device_id=d1');
  });

  it('sem nenhum dispositivo, lança "Abra o Spotify em algum dispositivo"', async () => {
    fetchMock.mockResolvedValueOnce(json({ devices: [] }));
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
          album: { name: 'Kind of Blue', uri: 'spotify:album:a1', release_date: '1959-08-17', images: [{ url: 'img', width: 640 }] },
        },
      }),
    );
    expect(await getNowPlaying()).toEqual({
      isPlaying: true,
      trackId: 't1',
      trackName: 'So What',
      artist: 'Miles Davis',
      albumName: 'Kind of Blue',
      albumYear: '1959',
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
