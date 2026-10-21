import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NowPlaying as NowPlayingState } from '../spotify/player';
import { NowPlaying } from './NowPlaying';

const track = (isPlaying: boolean): NowPlayingState => ({
  isPlaying,
  trackName: 'So What',
  artist: 'Miles Davis',
  albumName: 'Kind of Blue',
  progressMs: 10_000,
  durationMs: 100_000,
});

describe('NowPlaying — barra de progresso local (T46)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const bar = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

  it('tocando: avança sozinha entre consultas, sem passar do fim', () => {
    render(<NowPlaying nowPlaying={track(true)} fetchedAt={Date.now()} />);
    expect(bar()).toBe(10);
    act(() => vi.advanceTimersByTime(5000));
    expect(bar()).toBe(15);
    act(() => vi.advanceTimersByTime(200_000));
    expect(bar()).toBe(100);
  });

  it('pausado: fica parada', () => {
    render(<NowPlaying nowPlaying={track(false)} fetchedAt={Date.now()} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(bar()).toBe(10);
  });
});
