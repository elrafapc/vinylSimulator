import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpotifyError } from '../spotify/errors';
import { getNowPlaying, type NowPlaying } from '../spotify/player';
import { useNowPlaying } from './useNowPlaying';

vi.mock('../spotify/player', () => ({ getNowPlaying: vi.fn() }));

const track = (isPlaying: boolean): NowPlaying => ({
  isPlaying,
  trackName: 'So What',
  artist: 'Miles Davis',
  albumName: 'Kind of Blue',
  progressMs: 0,
  durationMs: 1000,
});

describe('useNowPlaying', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(getNowPlaying).mockReset();
  });

  it('busca na montagem e a cada 2s, refletindo pause feito fora do app', async () => {
    vi.mocked(getNowPlaying).mockResolvedValueOnce(track(true)).mockResolvedValue(track(false));
    const { result } = renderHook(() => useNowPlaying());

    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.nowPlaying?.isPlaying).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.nowPlaying?.isPlaying).toBe(false);
    expect(getNowPlaying).toHaveBeenCalledTimes(2);
  });

  it('expõe mensagem de erro clara', async () => {
    vi.mocked(getNowPlaying).mockRejectedValue(new SpotifyError('network'));
    const { result } = renderHook(() => useNowPlaying());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.error).toBe('Falha de rede. Verifique sua conexão.');
  });

  it('para o polling ao desmontar', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(null);
    const { unmount } = renderHook(() => useNowPlaying());
    await act(() => vi.advanceTimersByTimeAsync(0));
    unmount();
    await vi.advanceTimersByTimeAsync(6000);
    expect(getNowPlaying).toHaveBeenCalledTimes(1);
  });
});
