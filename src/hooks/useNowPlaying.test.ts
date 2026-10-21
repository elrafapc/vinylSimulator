import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpotifyError } from '../spotify/errors';
import { getNowPlaying, type NowPlaying } from '../spotify/player';
import { ACTION_SETTLE_MS, POLL_PAUSED_MS, POLL_PLAYING_MS, usePlayerPolling } from './useNowPlaying';

vi.mock('../spotify/player', () => ({ getNowPlaying: vi.fn() }));

const track = (isPlaying: boolean): NowPlaying => ({
  isPlaying,
  trackName: 'So What',
  artist: 'Miles Davis',
  albumName: 'Kind of Blue',
  progressMs: 0,
  durationMs: 545000,
});

let visibility: DocumentVisibilityState = 'visible';
const setVisibility = (v: DocumentVisibilityState) => {
  visibility = v;
  document.dispatchEvent(new Event('visibilitychange'));
};
const calls = () => vi.mocked(getNowPlaying).mock.calls.length;
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('usePlayerPolling (polling único e adaptativo)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getNowPlaying).mockReset();
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });
  afterEach(() => vi.useRealTimers());

  it('tocando: consulta a cada 5s', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(track(true));
    const { result } = renderHook(() => usePlayerPolling());
    await advance(0);
    expect(calls()).toBe(1);
    expect(result.current.nowPlaying?.isPlaying).toBe(true);
    await advance(POLL_PLAYING_MS - 100);
    expect(calls()).toBe(1);
    await advance(100);
    expect(calls()).toBe(2);
  });

  it('pausado: consulta a cada 20s', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(track(false));
    renderHook(() => usePlayerPolling());
    await advance(0);
    await advance(POLL_PLAYING_MS);
    expect(calls()).toBe(1);
    await advance(POLL_PAUSED_MS - POLL_PLAYING_MS);
    expect(calls()).toBe(2);
  });

  it('pause feito fora do app: passa de 5s para 20s', async () => {
    vi.mocked(getNowPlaying).mockResolvedValueOnce(track(true)).mockResolvedValue(track(false));
    const { result } = renderHook(() => usePlayerPolling());
    await advance(0);
    await advance(POLL_PLAYING_MS);
    expect(result.current.nowPlaying?.isPlaying).toBe(false);
    expect(calls()).toBe(2);
    await advance(POLL_PAUSED_MS - 1);
    expect(calls()).toBe(2);
  });

  it('aba oculta: para; ao voltar, consulta na hora', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(track(true));
    renderHook(() => usePlayerPolling());
    await advance(0);
    setVisibility('hidden');
    await advance(60_000);
    expect(calls()).toBe(1);
    setVisibility('visible');
    await advance(0);
    expect(calls()).toBe(2);
  });

  it('depois de uma ação, consulta logo (sem esperar o ciclo) e não acumula consultas', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(track(false));
    const { result } = renderHook(() => usePlayerPolling());
    await advance(0);
    act(() => {
      result.current.refresh();
      result.current.refresh();
    });
    await advance(ACTION_SETTLE_MS);
    expect(calls()).toBe(2);
    // O ciclo recomeça a partir daí (pausado → 20s).
    await advance(POLL_PAUSED_MS - 1);
    expect(calls()).toBe(2);
  });

  it('erro vira mensagem clara e o polling continua', async () => {
    vi.mocked(getNowPlaying).mockRejectedValueOnce(new SpotifyError('rate-limit', 429)).mockResolvedValue(track(true));
    const { result } = renderHook(() => usePlayerPolling());
    await advance(0);
    expect(result.current.error).toBe('Muitas requisições ao Spotify. Aguarde alguns segundos.');
    await advance(POLL_PAUSED_MS);
    expect(result.current.error).toBeNull();
  });

  it('para ao desmontar', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(track(true));
    const { unmount } = renderHook(() => usePlayerPolling());
    await advance(0);
    unmount();
    await advance(60_000);
    expect(calls()).toBe(1);
  });
});
