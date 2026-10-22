import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDiscTracks } from '../spotify/api';
import type { NowPlaying } from '../spotify/player';
import { Console } from './Console';
import { ARM_REST, ARM_START, armAngle } from './tonearm';

vi.mock('../spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../spotify/api')>();
  return { getDiscTracks: vi.fn(), parseDiscUri: actual.parseDiscUri };
});

const album = { uri: 'spotify:album:a1', name: 'The Colour and the Shape', artist: 'Foo Fighters', imageUrl: 'https://img/c.jpg' };
const tracks = [
  { id: 't1', number: 1, name: 'Doll', artist: 'Foo Fighters', durationMs: 60_000 },
  { id: 't2', number: 2, name: 'Monkey Wrench', artist: 'Foo Fighters', durationMs: 221_000 },
  { id: 't3', number: 3, name: 'Hey, Johnny Park!', artist: 'Foo Fighters', durationMs: 219_000 },
];
const johnnyPark = (isPlaying: boolean): NowPlaying => ({
  isPlaying,
  trackId: 't3',
  trackName: 'Hey, Johnny Park!',
  artist: 'Foo Fighters',
  albumName: 'The Colour and the Shape',
  albumYear: '1997',
  albumUri: album.uri,
  deviceName: 'MacBook',
  contextUri: album.uri,
  progressMs: 92_000,
  durationMs: 219_000,
});

function renderConsole(props: Partial<Parameters<typeof Console>[0]> = {}) {
  const handlers = { onNeedleClick: vi.fn(), onPlayPause: vi.fn(), onPrev: vi.fn(), onNext: vi.fn(), onVolumeChange: vi.fn(), onOpenDrawer: vi.fn() };
  render(<Console nowPlaying={null} fetchedAt={Date.now()} disc={album} playing={false} volume={40} {...handlers} {...props} />);
  return handlers;
}

const armAngleVar = () => screen.getByTestId('turntable').style.getPropertyValue('--arm-angle');

describe('Console', () => {
  beforeEach(() => {
    vi.mocked(getDiscTracks).mockResolvedValue(tracks);
  });

  it('tela mostra faixa, artista, álbum e tempos do Spotify', async () => {
    renderConsole({ nowPlaying: johnnyPark(true), playing: true });
    const tela = screen.getByTestId('console-screen');
    expect(within(tela).getByText('Hey, Johnny Park!')).toBeInTheDocument();
    expect(within(tela).getByText('Foo Fighters')).toBeInTheDocument();
    expect(within(tela).getByText('The Colour and the Shape (1997)')).toBeInTheDocument();
    expect(within(tela).getByText('Tocando em: MacBook')).toBeInTheDocument();
    expect(screen.getByTestId('console-time')).toHaveTextContent('01:3203:39');
    expect(screen.getByRole('progressbar', { name: 'Progresso da faixa' })).toHaveAttribute('aria-valuenow', '42');
    await screen.findByRole('list', { name: 'Faixas do disco' });
  });

  it('lista as faixas com duração e destaca a atual', async () => {
    renderConsole({ nowPlaying: johnnyPark(true), playing: true });
    const list = await screen.findByRole('list', { name: 'Faixas do disco' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('1Doll1:00');
    expect(rows[2]).toHaveAttribute('aria-current', 'true');
    expect(rows[2]).toHaveTextContent('▶');
    expect(rows[0]).not.toHaveAttribute('aria-current');
  });

  it('botões do player chamam as ações', async () => {
    const handlers = renderConsole({ nowPlaying: johnnyPark(true), playing: true });
    await userEvent.click(screen.getByRole('button', { name: 'Faixa anterior' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Próxima faixa' }));
    expect(handlers.onPrev).toHaveBeenCalledOnce();
    expect(handlers.onPlayPause).toHaveBeenCalledOnce();
    expect(handlers.onNext).toHaveBeenCalledOnce();
  });

  it('clicar numa faixa chama onPlayTrack com ela', async () => {
    const onPlayTrack = vi.fn();
    renderConsole({ nowPlaying: johnnyPark(true), playing: true, onPlayTrack });
    await userEvent.click(await screen.findByRole('button', { name: 'Tocar faixa 2: Monkey Wrench' }));
    expect(onPlayTrack).toHaveBeenCalledWith(tracks[1]);
  });

  it('mostra a estrela de estante recebida, dentro da tela', async () => {
    renderConsole({ shelfToggle: <button type="button">Guardar na estante</button> });
    expect(within(screen.getByTestId('console-screen')).getByRole('button', { name: 'Guardar na estante' })).toBeInTheDocument();
    await screen.findByRole('list', { name: 'Faixas do disco' });
  });

  it('braço acompanha o progresso do disco inteiro', async () => {
    renderConsole({ nowPlaying: johnnyPark(true), playing: true });
    // t1 + t2 (281s) + 92s de t3, de 500s no total.
    // Tolerância: o relógio local pode avançar alguns ms entre a leitura e o render.
    await waitFor(() => expect(parseFloat(armAngleVar())).toBeCloseTo(armAngle((281_000 + 92_000) / 500_000), 1));
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
  });

  it('disco escolhido, sem tocar: braço na borda, tela com o disco e sem tempo', async () => {
    renderConsole();
    expect(armAngleVar()).toBe(`${ARM_START}deg`);
    expect(ARM_REST).toBeLessThan(ARM_START);
    expect(screen.getByTestId('console-time')).toHaveTextContent('--:----:--');
    expect(within(screen.getByTestId('console-screen')).getByText('Baixe a agulha para tocar')).toBeInTheDocument();
    await screen.findByRole('list', { name: 'Faixas do disco' });
  });

  it('gaveta de discos abre a estante', async () => {
    const handlers = renderConsole();
    await userEvent.click(screen.getByRole('button', { name: 'Abrir estante' }));
    expect(handlers.onOpenDrawer).toHaveBeenCalledOnce();
    await screen.findByRole('list', { name: 'Faixas do disco' });
  });

  it('celular: tela só de leitura (sem os botões do player), knob continua', async () => {
    renderConsole({ compact: true });
    expect(screen.queryByRole('button', { name: 'Faixa anterior' })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Volume (botão da vitrola)' })).toHaveAttribute('aria-valuenow', '40');
    await screen.findByRole('list', { name: 'Faixas do disco' });
  });

  it('playlist sem faixas liberadas: aviso na lista', async () => {
    vi.mocked(getDiscTracks).mockRejectedValue(new Error('403'));
    renderConsole({ disc: { uri: 'spotify:playlist:p1', name: 'Jazz' } });
    expect(await screen.findByText('Faixas indisponíveis.')).toBeInTheDocument();
  });
});
