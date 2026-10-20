import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchAlbums } from '../spotify/api';
import { SpotifyError } from '../spotify/errors';
import { AlbumSearch } from './AlbumSearch';

vi.mock('../spotify/api', () => ({ searchAlbums: vi.fn() }));

const kindOfBlue = {
  id: 'a1',
  uri: 'spotify:album:a1',
  name: 'Kind of Blue',
  artist: 'Miles Davis',
  imageUrl: 'https://img/kob.jpg',
};

describe('AlbumSearch', () => {
  afterEach(() => vi.mocked(searchAlbums).mockReset());

  it('digitar mostra a lista de álbuns', async () => {
    vi.mocked(searchAlbums).mockResolvedValue([kindOfBlue]);
    render(<AlbumSearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'kind of blue');
    expect(await screen.findByText('Kind of Blue')).toBeInTheDocument();
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(searchAlbums).toHaveBeenLastCalledWith('kind of blue');
  });

  it('clicar seleciona o álbum', async () => {
    vi.mocked(searchAlbums).mockResolvedValue([kindOfBlue]);
    const onSelect = vi.fn();
    render(<AlbumSearch onSelect={onSelect} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'miles');
    await userEvent.click(await screen.findByRole('button', { name: /Kind of Blue/ }));
    expect(onSelect).toHaveBeenCalledWith(kindOfBlue);
  });

  it('mostra erro claro', async () => {
    vi.mocked(searchAlbums).mockRejectedValue(new SpotifyError('network'));
    render(<AlbumSearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Buscar álbum'), 'x');
    expect(await screen.findByText('Falha de rede. Verifique sua conexão.')).toBeInTheDocument();
  });
});
