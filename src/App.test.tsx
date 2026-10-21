import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getDiscTracks, getMe, getPlaylistDisc, searchDiscs } from './spotify/api';
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
  return {
    getMe: vi.fn(),
    searchDiscs: vi.fn(),
    getMyPlaylists: vi.fn(),
    getDiscTracks: vi.fn(),
    getPlaylistDisc: vi.fn(),
    parseDiscUri: actual.parseDiscUri,
  };
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
    vi.mocked(getDiscTracks).mockResolvedValue([]);
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
    expect(screen.getByRole('img', { name: 'Vinyl Player Simulator' })).toHaveClass('logo--full');
    await userEvent.click(toggle);
    expect(screen.queryByRole('complementary', { name: 'Menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('deck--collapsed');
    // Menu recolhido: só o símbolo no topo; o rodapé continua visível.
    expect(screen.getByRole('img', { name: 'Vinyl Player Simulator' })).toHaveClass('logo--mark');
    expect(screen.getByRole('link', { name: 'Rafael Carneiro' })).toBeVisible();
    unmount();

    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: '☰ Menu' }));
    expect(screen.getByRole('complementary', { name: 'Menu' })).toBeVisible();
  });

  it('T19/T40: clicar num disco da estante expandida abre os detalhes por cima, sem fechar a estante', async () => {
    localStorage.setItem('vinil.favorites', JSON.stringify([kindOfBlue]));
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Expandir estante (1)' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: /^Estante/ })).getByRole('button', { name: 'Abrir Kind of Blue' }));
    expect(screen.getByRole('dialog', { name: 'Detalhes de Kind of Blue' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /^Estante/ })).toBeInTheDocument();
    // Não tocou nem trocou o disco da vitrola.
    expect(playDisc).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Sem disco' })).toBeInTheDocument();

    // Esc fecha só os detalhes; a estante continua aberta.
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Detalhes de Kind of Blue' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /^Estante/ })).toBeInTheDocument();
  });

  it('T17: play sobre o disco selecionado baixa a agulha', async () => {
    vi.mocked(playDisc).mockResolvedValue();
    render(<App />);
    await selectKindOfBlue();
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Kind of Blue' }));
    expect(playDisc).toHaveBeenCalledWith(kindOfBlue.uri);
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
  });

  it('T32: música atual no topo do menu, com "Tocando em", e seções na ordem', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue({ ...soWhat(true), deviceName: 'MacBook' });
    render(<App />);
    const menu = await screen.findByRole('complementary', { name: 'Menu' });
    expect(await within(menu).findByText('So What')).toBeInTheDocument();
    expect(within(menu).getByText('Tocando em: MacBook')).toBeInTheDocument();
    expect(within(menu).getByRole('button', { name: 'Ver detalhes de Kind of Blue' })).toBeInTheDocument();
    expect(within(menu).getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.replace(/[▸▾]/g, '').trim())).toEqual([
      'Música atual',
      'Player',
      'Disco',
      'Estante',
      'Buscar discos',
      'Importar do Spotify',
      'Sons',
    ]);
  });

  it('T32: Sons começa recolhido e abre ao clicar, sem desmontar os controles', async () => {
    render(<App />);
    const toggle = await screen.findByRole('button', { name: /Sons/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Escondido, mas na página (o som continua tocando).
    expect(screen.getByRole('button', { name: 'Chiado ligado', hidden: true })).not.toBeVisible();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Chiado ligado' })).toBeVisible();
  });

  it('T33: ★ ao lado do player guarda e tira da estante o álbum que está tocando', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue(soWhat(true));
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar Kind of Blue na estante' }));
    expect(screen.getByRole('button', { name: 'Tirar Kind of Blue da estante' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Expandir estante (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tirar Kind of Blue da estante' }));
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
  });

  it('T33: playlist tocada direto pelo Spotify é guardada com nome e dono', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue({ ...soWhat(true), contextUri: 'spotify:playlist:p9' });
    vi.mocked(getPlaylistDisc).mockResolvedValue({ id: 'p9', uri: 'spotify:playlist:p9', kind: 'playlist', name: 'Jazz da Ana', artist: 'Ana' });
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar Playlist na estante' }));
    expect(getPlaylistDisc).toHaveBeenCalledWith('p9');
    expect(await screen.findByRole('button', { name: 'Expandir estante (1)' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('vinil.library') ?? '{}').discs[0]).toMatchObject({ name: 'Jazz da Ana' });
  });

  it('T40: capa do carrossel abre os detalhes; "Tocar" baixa a agulha com o disco e fecha', async () => {
    vi.mocked(playDisc).mockResolvedValue();
    localStorage.setItem('vinil.favorites', JSON.stringify([kindOfBlue]));
    render(<App />);
    const carousel = await screen.findByRole('list', { name: 'Estante (carrossel)' });
    await userEvent.click(within(carousel).getByRole('button', { name: 'Abrir Kind of Blue' }));
    const details = screen.getByRole('dialog', { name: 'Detalhes de Kind of Blue' });
    expect(within(details).getByRole('img', { name: 'Capa de Kind of Blue' })).toBeInTheDocument();
    expect(getDiscTracks).toHaveBeenCalledWith(kindOfBlue.uri);
    expect(playDisc).not.toHaveBeenCalled();

    await userEvent.click(within(details).getByRole('button', { name: '▶ Tocar' }));
    expect(playDisc).toHaveBeenCalledWith(kindOfBlue.uri);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('turntable')).toHaveClass('turntable--playing');
  });

  it('T43: estante antiga (categorias) migra para etiquetas; nos detalhes dá para etiquetar e remover', async () => {
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({ version: 2, categories: [{ id: 'c1', name: 'Jazz' }], discs: [{ ...kindOfBlue, categoryId: 'c1' }] }),
    );
    render(<App />);
    const carousel = await screen.findByRole('list', { name: 'Estante (carrossel)' });
    await userEvent.click(within(carousel).getByRole('button', { name: 'Abrir Kind of Blue' }));
    const details = screen.getByRole('dialog', { name: 'Detalhes de Kind of Blue' });
    expect(within(details).getByRole('list', { name: 'Etiquetas de Kind of Blue' })).toHaveTextContent('Jazz');

    await userEvent.type(within(details).getByLabelText('Adicionar etiqueta a Kind of Blue'), 'Modal{Enter}');
    expect(JSON.parse(localStorage.getItem('vinil.library') ?? '{}').discs[0].tags).toEqual(['Jazz', 'Modal']);
    await userEvent.click(within(details).getByRole('button', { name: 'Remover etiqueta Jazz' }));
    expect(JSON.parse(localStorage.getItem('vinil.library') ?? '{}').discs[0].tags).toEqual(['Modal']);

    await userEvent.click(within(details).getByRole('button', { name: 'Remover da estante' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Sua estante está vazia/)).toBeInTheDocument();
  });

  describe('T36: celular', () => {
    beforeEach(() => {
      // Só a media query do celular bate (movimento reduzido etc. continuam falsos).
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query.includes('max-width: 767px'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    });
    afterEach(() => vi.unstubAllGlobals());

    it('menu começa fechado (inerte) e a barrinha mostra a faixa com play/pausa', async () => {
      vi.mocked(getNowPlaying).mockResolvedValue(soWhat(true));
      vi.mocked(pause).mockResolvedValue();
      render(<App />);
      const menu = await screen.findByRole('complementary', { name: 'Menu', hidden: true });
      expect(menu).toHaveAttribute('inert');
      expect(menu).not.toHaveClass('deck__menu--open');
      const bar = (await screen.findByText('So What', { selector: '.mini-player strong' })).closest('.mini-player') as HTMLElement;
      await userEvent.click(within(bar).getByRole('button', { name: 'Pausar' }));
      expect(pause).toHaveBeenCalled();
    });

    it('abre pelo botão Menu ou pela barrinha; fecha por Fechar, fundo e Esc', async () => {
      render(<App />);
      const menu = await screen.findByRole('complementary', { name: 'Menu', hidden: true });

      await userEvent.click(screen.getByRole('button', { name: '☰ Menu' }));
      expect(menu).toHaveClass('deck__menu--open');
      expect(menu).not.toHaveAttribute('inert');
      expect(screen.queryByRole('button', { name: 'Abrir menu' })).not.toBeInTheDocument();
      await userEvent.click(within(menu).getByRole('button', { name: 'Fechar' }));
      expect(menu).not.toHaveClass('deck__menu--open');

      await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
      expect(menu).toHaveClass('deck__menu--open');
      await userEvent.click(screen.getByTestId('sheet-backdrop'));
      expect(menu).not.toHaveClass('deck__menu--open');

      await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
      await userEvent.keyboard('{Escape}');
      expect(menu).not.toHaveClass('deck__menu--open');
    });

    it('não usa nem altera o "recolher menu" salvo do desktop', async () => {
      localStorage.setItem('vinil.sidebar', 'collapsed');
      render(<App />);
      await userEvent.click(await screen.findByRole('button', { name: '☰ Menu' }));
      expect(screen.getByRole('main')).not.toHaveClass('deck--collapsed');
      expect(localStorage.getItem('vinil.sidebar')).toBe('collapsed');
    });
  });

  it('T42: volume só pelo knob da vitrola (sem slider no menu)', async () => {
    vi.mocked(getNowPlaying).mockResolvedValue({ ...soWhat(true), volumePercent: 60, supportsVolume: true });
    render(<App />);
    const menu = await screen.findByRole('complementary', { name: 'Menu' });
    expect(within(menu).queryByLabelText('Volume do Spotify')).not.toBeInTheDocument();
    expect(within(menu).queryByRole('heading', { name: 'Volume' })).not.toBeInTheDocument();
    const knob = await screen.findByRole('slider', { name: 'Volume (botão da vitrola)' });
    await waitFor(() => expect(knob).toHaveAttribute('aria-valuenow', '60'));
    expect(knob).not.toHaveAttribute('aria-disabled');
  });

  it('T44: filtro por etiquetas na estante, igual no carrossel; com filtro o arrastar desliga', async () => {
    const d = (id: string, name: string, tags: string[]) => ({ id, uri: `spotify:album:${id}`, kind: 'album', name, artist: 'X', tags });
    localStorage.setItem(
      'vinil.library',
      JSON.stringify({ version: 3, discs: [d('a1', 'Kind of Blue', ['Jazz', 'Modal']), d('a2', 'Blue Train', ['Jazz']), d('a3', 'Nevermind', [])] }),
    );
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Expandir estante (3)' }));
    const panel = screen.getByRole('dialog', { name: /^Estante/ });
    expect(within(panel).getAllByRole('button', { pressed: false }).map((b) => b.textContent)).toEqual(
      expect.arrayContaining(['Jazz', 'Modal', 'Sem etiqueta']),
    );

    await userEvent.click(within(panel).getByRole('button', { name: 'Jazz' }));
    await userEvent.click(within(panel).getByRole('button', { name: 'Modal' }));
    expect(within(panel).getByText('1 de 3 discos')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Abrir Kind of Blue' })).not.toHaveAttribute('aria-roledescription');
    expect(within(panel).queryByRole('button', { name: 'Abrir Blue Train' })).not.toBeInTheDocument();

    // O carrossel do menu segue o mesmo filtro.
    const carousel = screen.getByRole('list', { name: 'Estante (carrossel)' });
    expect(within(carousel).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Abrir Kind of Blue']);

    await userEvent.click(within(panel).getByRole('button', { name: 'Limpar filtro' }));
    expect(within(panel).getByRole('button', { name: 'Abrir Blue Train' })).toHaveAttribute('aria-roledescription', 'sortable');
    expect(within(carousel).getAllByRole('button')).toHaveLength(3);
  });
});
