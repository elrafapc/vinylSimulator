import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getMyPlaylists, type Disc } from '../spotify/api';
import { SpotifyError } from '../spotify/errors';
import { PlaylistImporter, Shelf } from './Shelf';

vi.mock('../spotify/api', () => ({ getMyPlaylists: vi.fn() }));

const kob: Disc = { id: 'a1', uri: 'spotify:album:a1', kind: 'album', name: 'Kind of Blue', artist: 'Miles Davis', imageUrl: 'https://img/kob.jpg' };
const jazz: Disc = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist', name: 'Jazz', artist: 'Rafael' };

describe('Shelf', () => {
  it('estante vazia mostra mensagem', () => {
    render(<Shelf discs={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
  });

  it('mostra os favoritos', () => {
    render(<Shelf discs={[kob, jazz]} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Colocar Kind of Blue no toca-discos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colocar Jazz no toca-discos' })).toHaveTextContent('Jazz');
  });

  it('clicar seleciona o disco', async () => {
    const onSelect = vi.fn();
    render(<Shelf discs={[kob, jazz]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Colocar Jazz no toca-discos' }));
    expect(onSelect).toHaveBeenCalledWith(jazz);
  });

  it('marca o disco selecionado', () => {
    render(<Shelf discs={[kob, jazz]} selectedId="a1" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Colocar Kind of Blue no toca-discos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('tirar da estante chama onRemove', async () => {
    const onRemove = vi.fn();
    render(<Shelf discs={[kob]} onSelect={vi.fn()} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tirar Kind of Blue da estante' }));
    expect(onRemove).toHaveBeenCalledWith('a1');
  });
});

describe('PlaylistImporter', () => {
  const rock: Disc = { id: 'p2', uri: 'spotify:playlist:p2', kind: 'playlist', name: 'Rock', artist: 'Rafael' };

  it('lista minhas playlists e adiciona as escolhidas', async () => {
    vi.mocked(getMyPlaylists).mockResolvedValue([jazz, rock]);
    const onImport = vi.fn();
    render(<PlaylistImporter existingIds={new Set()} onImport={onImport} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar do Spotify' }));
    await userEvent.click(await screen.findByLabelText('Rock'));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar 1 à estante/ }));
    expect(onImport).toHaveBeenCalledWith([rock]);
    expect(screen.getByRole('button', { name: 'Importar do Spotify' })).toBeInTheDocument();
  });

  it('esconde as que já estão na estante', async () => {
    vi.mocked(getMyPlaylists).mockResolvedValue([jazz, rock]);
    render(<PlaylistImporter existingIds={new Set(['p1'])} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar do Spotify' }));
    expect(await screen.findByLabelText('Rock')).toBeInTheDocument();
    expect(screen.queryByLabelText('Jazz')).not.toBeInTheDocument();
  });

  it('sem permissão pede para entrar de novo', async () => {
    vi.mocked(getMyPlaylists).mockRejectedValue(new SpotifyError('unknown', 403));
    render(<PlaylistImporter existingIds={new Set()} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar do Spotify' }));
    expect(await screen.findByText('Saia e entre de novo para permitir o acesso às suas playlists.')).toBeInTheDocument();
  });
});
