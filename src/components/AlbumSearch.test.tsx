import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchDiscs } from '../spotify/api';
import { SpotifyError } from '../spotify/errors';
import { AlbumSearch } from './AlbumSearch';

vi.mock('../spotify/api', () => ({ searchDiscs: vi.fn() }));

const kindOfBlue = {
  id: 'a1',
  uri: 'spotify:album:a1',
  kind: 'album' as const,
  name: 'Kind of Blue',
  artist: 'Miles Davis',
  imageUrl: 'https://img/kob.jpg',
};

describe('AlbumSearch', () => {
  afterEach(() => vi.mocked(searchDiscs).mockReset());

  it('digitar mostra a lista de álbuns', async () => {
    vi.mocked(searchDiscs).mockResolvedValue([kindOfBlue]);
    render(<AlbumSearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'kind of blue');
    expect(await screen.findByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis · álbum')).toBeInTheDocument();
    expect(searchDiscs).toHaveBeenLastCalledWith('kind of blue');
  });

  it('clicar seleciona o álbum', async () => {
    vi.mocked(searchDiscs).mockResolvedValue([kindOfBlue]);
    const onSelect = vi.fn();
    render(<AlbumSearch onSelect={onSelect} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'miles');
    await userEvent.click(await screen.findByRole('button', { name: /Kind of Blue/ }));
    expect(onSelect).toHaveBeenCalledWith(kindOfBlue);
  });

  it('estrela favorita sem selecionar o disco', async () => {
    vi.mocked(searchDiscs).mockResolvedValue([kindOfBlue]);
    const onSelect = vi.fn();
    const onToggleFavorite = vi.fn();
    const { rerender } = render(<AlbumSearch onSelect={onSelect} onToggleFavorite={onToggleFavorite} favoriteIds={new Set()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'miles');
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar Kind of Blue na estante' }));
    expect(onToggleFavorite).toHaveBeenCalledWith(kindOfBlue);
    expect(onSelect).not.toHaveBeenCalled();

    rerender(<AlbumSearch onSelect={onSelect} onToggleFavorite={onToggleFavorite} favoriteIds={new Set(['a1'])} />);
    expect(screen.getByRole('button', { name: 'Remover Kind of Blue da estante' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra erro claro', async () => {
    vi.mocked(searchDiscs).mockRejectedValue(new SpotifyError('network'));
    render(<AlbumSearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'xy');
    expect(await screen.findByText('Falha de rede. Verifique sua conexão.')).toBeInTheDocument();
  });

  it('T46: só busca a partir de 2 letras', async () => {
    vi.mocked(searchDiscs).mockClear().mockResolvedValue([]);
    render(<AlbumSearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'x');
    await new Promise((r) => setTimeout(r, 500));
    expect(searchDiscs).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'y');
    await vi.waitFor(() => expect(searchDiscs).toHaveBeenCalledWith('xy'));
    expect(searchDiscs).toHaveBeenCalledTimes(1);
  });
});
