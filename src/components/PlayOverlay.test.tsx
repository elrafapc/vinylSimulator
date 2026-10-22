import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Disc } from '../spotify/api';
import { AlbumSearch } from './AlbumSearch';
import { PlayOverlay } from './PlayOverlay';

vi.mock('../spotify/api', () => ({ searchDiscs: vi.fn(), getMyPlaylists: vi.fn() }));

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg' };
const jazz: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael' };

describe('PlayOverlay', () => {
  it('clicar dispara a ação', async () => {
    const onPlay = vi.fn();
    render(<PlayOverlay discName="Kind of Blue" onPlay={onPlay} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Kind of Blue' }));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('acessível por teclado (Enter e Espaço)', async () => {
    const onPlay = vi.fn();
    render(<PlayOverlay discName="Kind of Blue" onPlay={onPlay} />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Tocar Kind of Blue' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it('tocando, vira pausar', () => {
    render(<PlayOverlay discName="Kind of Blue" playing onPlay={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Pausar Kind of Blue' })).toBeInTheDocument();
  });

  it('na busca aparece sobre o resultado selecionado', async () => {
    const { searchDiscs } = await import('../spotify/api');
    vi.mocked(searchDiscs).mockResolvedValue([kob, jazz]);
    const onPlay = vi.fn();
    render(<AlbumSearch selectedId="a1" playingId="a1" onSelect={vi.fn()} onPlay={onPlay} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'blue');
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar Kind of Blue' }));
    expect(onPlay).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Tocar Jazz' })).not.toBeInTheDocument();
  });
});
