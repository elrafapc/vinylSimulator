import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerPolling } from '../hooks/useNowPlaying';
import { getDiscTracks, searchDiscs } from './api';
import { callsLastMinute } from './client';
import { pause, playDisc } from './player';

vi.mock('./auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('token'),
  refreshAccessToken: vi.fn().mockResolvedValue(null),
}));

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

// Simula o Spotify: responde cada endpoint e lembra se está tocando.
function fakeSpotify() {
  let playing = true;
  return vi.fn((url: string, init?: RequestInit) => {
    const path = url.replace('https://api.spotify.com/v1', '');
    const method = init?.method ?? 'GET';
    if (path === '/me/player' && method === 'GET') {
      return Promise.resolve(
        json({
          is_playing: playing,
          progress_ms: 0,
          shuffle_state: false,
          device: { id: 'd1', name: 'Mac', volume_percent: 50, supports_volume: true },
          context: { uri: 'spotify:album:a1' },
          item: { id: 't1', type: 'track', name: 'So What', duration_ms: 545000, artists: [], album: { name: 'KoB', uri: 'spotify:album:a1', images: [] } },
        }),
      );
    }
    if (path.startsWith('/me/player/devices')) {
      return Promise.resolve(json({ devices: [{ id: 'd1', name: 'Mac', type: 'Computer', is_active: true, is_restricted: false }] }));
    }
    if (path.startsWith('/me/player/pause')) playing = false;
    if (path.startsWith('/me/player/play')) playing = true;
    if (path.startsWith('/albums/')) return Promise.resolve(json({ tracks: { items: [] } }));
    if (path.startsWith('/search')) return Promise.resolve(json({ albums: { items: [] }, playlists: { items: [] } }));
    return Promise.resolve(new Response(null, { status: 204 }));
  });
}

describe('uso normal (T46)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fakeSpotify());
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('tocar, pausar, abrir estante e detalhes e buscar num minuto: menos de 20 chamadas', async () => {
    const { result } = renderHook(() => usePlayerPolling());
    const step = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

    await step(0);
    // Baixar a agulha: o App passa o dispositivo que o polling já conhece.
    await act(() => playDisc('spotify:album:a1', result.current.nowPlaying?.deviceId));
    await step(10_000);
    // Abrir detalhes de 3 discos (dois iguais) e a estante (a estante não chama o Spotify).
    await act(async () => {
      await getDiscTracks('spotify:album:a1');
      await getDiscTracks('spotify:album:a2');
      await getDiscTracks('spotify:album:a1');
    });
    await act(() => searchDiscs('kind of blue'));
    await step(30_000);
    await act(() => pause());
    act(() => result.current.refresh());
    await step(19_000);

    const total = callsLastMinute();
    console.info(`[T46] chamadas no minuto simulado: ${total}`);
    expect(total).toBeLessThan(20);
  });
});
