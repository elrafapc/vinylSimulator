import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NowPlaying as NowPlayingState } from '../spotify/player';
import { formatTime } from './lcd';
import { NowPlaying, PROGRESS_BLOCKS } from './NowPlaying';

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

describe('NowPlaying — display LCD (T49)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const time = () => screen.getByTestId('lcd-time').querySelector('.lcd__sr')?.textContent;
  const litBlocks = (container: HTMLElement) => container.querySelectorAll('.lcd__block--on').length;

  it('formatTime: mm:ss com zero à esquerda', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(83_000)).toBe('01:23');
    expect(formatTime(245_900)).toBe('04:05');
  });

  it('mostra faixa, artista, álbum, dispositivo e tempo decorrido / total', () => {
    render(<NowPlaying nowPlaying={{ ...track(false), deviceName: 'MacBook' }} fetchedAt={Date.now()} />);
    expect(screen.getByText('So What')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Tocando em: MacBook')).toBeInTheDocument();
    expect(time()).toBe('00:10 de 01:40');
  });

  it('tempo e blocos avançam localmente tocando', () => {
    const { container } = render(<NowPlaying nowPlaying={track(true)} fetchedAt={Date.now()} />);
    expect(container.querySelectorAll('.lcd__block')).toHaveLength(PROGRESS_BLOCKS);
    expect(litBlocks(container)).toBe(2);
    act(() => vi.advanceTimersByTime(40_000));
    expect(time()).toBe('00:50 de 01:40');
    expect(litBlocks(container)).toBe(10);
  });

  it('sem faixa: display apagado com "--:--"', () => {
    const { container } = render(<NowPlaying nowPlaying={null} />);
    expect(screen.getByText('Nenhuma faixa no Spotify agora.')).toBeInTheDocument();
    expect(screen.getByText('SEM SINAL')).toBeInTheDocument();
    expect(litBlocks(container)).toBe(0);
    expect(container.querySelector('.lcd__segments-lit')).toHaveTextContent('--:--');
  });

  it('letreiro só rola quando o título não cabe', () => {
    const scroll = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
    const client = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    const { container, unmount } = render(<NowPlaying nowPlaying={track(false)} />);
    expect(container.querySelector('.lcd__marquee--scroll')).not.toBeNull();
    expect(container.querySelectorAll('.lcd__marquee-text')).toHaveLength(2);
    unmount();
    client.mockReturnValue(400);
    const fits = render(<NowPlaying nowPlaying={track(false)} />);
    expect(fits.container.querySelector('.lcd__marquee--scroll')).toBeNull();
    expect(fits.container.querySelectorAll('.lcd__marquee-text')).toHaveLength(1);
    scroll.mockRestore();
    client.mockRestore();
  });
});
