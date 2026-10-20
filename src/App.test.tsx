import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getMe, searchDiscs } from './spotify/api';
import { isLoggedIn } from './spotify/auth';
import { SpotifyError } from './spotify/errors';
import { getNowPlaying, pause, playDisc, resume, type NowPlaying } from './spotify/player';

vi.mock('./spotify/auth', () => ({
  CLIENT_ID: 'client',
  handleCallback: vi.fn(),
  isLoggedIn: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('./spotify/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./spotify/api')>();
  return { getMe: vi.fn(), searchDiscs: vi.fn(), getMyPlaylists: vi.fn(), getDiscTracks: vi.fn(), parseDiscUri: actual.parseDiscUri };
});
vi.mock('./spotify/player', () => ({
  getNowPlaying: vi.fn(),
  playDisc: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
}));

const kindOfBlue = {
  id: 'a1',
  uri: 'spotify:album:a1',
  kind: 'album' as const,
  name: 'Kind of Blue',
  artist: 'Miles Davis',
  imageUrl: 'https://img/kob.jpg',
};

const soWhat = (isPlaying: boolean): NowPlaying => ({
  isPlaying,
  trackName: 'So What',
  artist: 'Miles Davis',
  albumName: 'Kind of Blue',
  albumUri: kindOfBlue.uri,
  contextUri: kindOfBlue.uri,
  progressMs: 0,
  durationMs: 545000,
});

async function selectKindOfBlue() {
  await userEvent.type(await screen.findByLabelText('Buscar álbum'), 'kind of blue');
  await userEvent.click(await screen.findByRole('button', { name: /^Kind of Blue/ }));
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getMe).mockResolvedValue({ id: 'u1', displayName: 'Rafael' });
    vi.mocked(searchDiscs).mockResolvedValue([kindOfBlue]);
    vi.mocked(getNowPlaying).mockResolvedValue(null);
  });

  it('T02: deslogado mostra "Entrar com Spotify"', async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Entrar com Spotify' })).toBeInTheDocument();
  });

  it('T02: logado mostra o nome do usuário', async () => {
    render(<App />);
    expect(await screen.findByText('Rafael')).toBeInTheDocument();
  });

  it('T07: selecionar álbum e baixar agulha toca o álbum e gira o disco', async () => {
    vi.mocked(playDisc).mockResolvedValue();
    render(<App />);
    await selectKindOfBlue();
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Baixar agulha' }));

    expect(playDisc).toHaveBeenCalledWith(kindOfBlue.uri);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
  });

  it('T12: playlist pausada retoma em vez de recomeçar', async () => {
    const playlist = { id: 'p1', uri: 'spotify:playlist:p1', kind: 'playlist' as const, name: 'Jazz', artist: 'Rafael' };
    vi.mocked(searchDiscs).mockResolvedValue([playlist]);
    vi.mocked(getNowPlaying).mockResolvedValue({ ...soWhat(false), contextUri: playlist.uri });
    vi.mocked(resume).mockResolvedValue();
    render(<App />);
    await userEvent.type(await screen.findByLabelText('Buscar álbum'), 'jazz');
    await userEvent.click(await screen.findByRole('button', { name: /^Jazz/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Baixar agulha' }));
    expect(resume).toHaveBeenCalled();
    expect(playDisc).not.toHaveBeenCalled();
  });

  it('T07: pausar pelo app levanta a agulha', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(soWhat(true));
    vi.mocked(pause).mockResolvedValue();
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--stopped');
  });

  it('T08: pausar no app do Spotify para o disco em até 3s', async () => {
    vi.mocked(getNowPlaying).mockResolvedValueOnce(soWhat(true)).mockResolvedValue(soWhat(false));
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing'));
    expect(screen.getByText('So What')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('turntable')).toHaveClass('turntable--stopped'), {
      timeout: 3000,
    });
  });

  it('T09: com Spotify fechado, baixar agulha mostra mensagem clara', async () => {
    vi.mocked(playDisc).mockRejectedValue(new SpotifyError('no-device', 404));
    render(<App />);
    await selectKindOfBlue();
    await userEvent.click(screen.getByRole('button', { name: 'Baixar agulha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Abra o Spotify em algum dispositivo');
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--stopped');
  });

  it('T09: sessão inválida no login mostra erro e volta à tela de entrada', async () => {
    vi.mocked(getMe).mockRejectedValue(new SpotifyError('auth', 401));
    render(<App />);
    expect(await screen.findByText('Sessão expirada. Entre novamente.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar com Spotify' })).toBeInTheDocument();
  });

  it('T18: menu lateral recolhe e expande, e o estado persiste', async () => {
    const { unmount } = render(<App />);
    const toggle = await screen.findByRole('button', { name: 'Recolher menu ›' });
    expect(screen.getByRole('complementary', { name: 'Menu' })).toBeVisible();
    await userEvent.click(toggle);
    expect(screen.queryByRole('complementary', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('deck--collapsed');
    unmount();

    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: '☰ Menu' }));
    expect(screen.getByRole('complementary', { name: 'Menu' })).toBeVisible();
  });

  it('T19: estante abre em painel; escolher disco coloca no toca-discos e fecha', async () => {
    localStorage.setItem('vinil.favorites', JSON.stringify([kindOfBlue]));
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir estante (1)' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Estante' })).getByRole('button', { name: 'Colocar Kind of Blue no toca-discos' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Capa de Kind of Blue' })).toBeInTheDocument();
  });

  it('T17: play sobre o disco selecionado baixa a agulha', async () => {
    vi.mocked(playDisc).mockResolvedValue();
    render(<App />);
    await selectKindOfBlue();
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Kind of Blue' }));
    expect(playDisc).toHaveBeenCalledWith(kindOfBlue.uri);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
  });
});
