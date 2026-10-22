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
    expect(screen.getByRole('button', { name: 'Abrir Kind of Blue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir Jazz' })).toHaveTextContent('Jazz');
  });

  it('clicar seleciona o disco', async () => {
    const onSelect = vi.fn();
    render(<Shelf discs={[kob, jazz]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir Jazz' }));
    expect(onSelect).toHaveBeenCalledWith(jazz);
  });

  it('marca o disco selecionado', () => {
    render(<Shelf discs={[kob, jazz]} selectedId="a1" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Abrir Kind of Blue' })).toHaveAttribute('aria-pressed', 'true');
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
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    await userEvent.click(await screen.findByLabelText('Rock'));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar 1 à estante/ }));
    expect(onImport).toHaveBeenCalledWith([rock]);
    expect(screen.getByRole('button', { name: 'Importar playlists' })).toBeInTheDocument();
  });

  it('esconde as que já estão na estante', async () => {
    vi.mocked(getMyPlaylists).mockResolvedValue([jazz, rock]);
    render(<PlaylistImporter existingIds={new Set(['p1'])} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    expect(await screen.findByLabelText('Rock')).toBeInTheDocument();
    expect(screen.queryByLabelText('Jazz')).not.toBeInTheDocument();
  });

  it('sem permissão pede para entrar de novo', async () => {
    vi.mocked(getMyPlaylists).mockRejectedValue(new SpotifyError('unknown', 403));
    render(<PlaylistImporter existingIds={new Set()} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    expect(await screen.findByText('Saia e entre de novo para permitir o acesso às suas playlists.')).toBeInTheDocument();
  });

  it('filtra enquanto digito, sem acento e sem diferenciar maiúsculas', async () => {
    const cafe: Disc = { id: 'p3', uri: 'spotify:playlist:p3', kind: 'playlist', name: 'Café da Manhã', artist: 'Rafael' };
    vi.mocked(getMyPlaylists).mockClear().mockResolvedValue([jazz, rock, cafe]);
    render(<PlaylistImporter existingIds={new Set()} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    await userEvent.type(await screen.findByLabelText('Filtrar minhas playlists'), 'CAFE');
    expect(screen.getByLabelText('Café da Manhã')).toBeInTheDocument();
    expect(screen.queryByLabelText('Jazz')).not.toBeInTheDocument();
    expect(getMyPlaylists).toHaveBeenCalledOnce();
  });

  it('mantém as escolhidas ao trocar o filtro', async () => {
    vi.mocked(getMyPlaylists).mockResolvedValue([jazz, rock]);
    const onImport = vi.fn();
    render(<PlaylistImporter existingIds={new Set()} onImport={onImport} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    await userEvent.click(await screen.findByLabelText('Rock'));
    await userEvent.type(screen.getByLabelText('Filtrar minhas playlists'), 'jaz');
    await userEvent.click(screen.getByLabelText('Jazz'));
    await userEvent.click(screen.getByRole('button', { name: /Adicionar 2 à estante/ }));
    expect(onImport).toHaveBeenCalledWith([jazz, rock]);
  });

  it('avisa quando nada é encontrado', async () => {
    vi.mocked(getMyPlaylists).mockResolvedValue([jazz, rock]);
    render(<PlaylistImporter existingIds={new Set()} onImport={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Importar playlists' }));
    await userEvent.type(await screen.findByLabelText('Filtrar minhas playlists'), 'samba');
    expect(screen.getByText('Nenhuma playlist encontrada para "samba".')).toBeInTheDocument();
  });
});
