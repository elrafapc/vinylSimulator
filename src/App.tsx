import { useCallback, useEffect, useState } from 'react';
import { AlbumSearch } from './components/AlbumSearch';
import { AmbientSounds } from './components/AmbientSounds';
import { Controls } from './components/Controls';
import { DiscDetails } from './components/DiscDetails';
import { DiscDialog } from './components/DiscDialog';
import { Footer } from './components/Footer';
import { FullscreenToggle } from './components/FullscreenToggle';
import { Logo } from './components/Logo';
import { MiniPlayer } from './components/MiniPlayer';
import { ThemeToggle } from './components/ThemeToggle';
import { NowPlaying } from './components/NowPlaying';
import { PlaylistImporter } from './components/Shelf';
import { ShelfCarousel } from './components/ShelfCarousel';
import { ShelfPanel } from './components/ShelfPanel';
import { ShelfToggle } from './components/ShelfToggle';
import { TagFilter } from './components/TagFilter';
import { Turntable } from './components/Turntable';
import { VolumeControl } from './components/VolumeControl';
import { useFavorites } from './hooks/useFavorites';
import { MOBILE_QUERY, useMediaQuery } from './hooks/useMediaQuery';
import { NowPlayingProvider } from './hooks/NowPlayingProvider';
import { useNowPlaying } from './hooks/useNowPlaying';
import { useSidebar } from './hooks/useSidebar';
import { useVolume } from './hooks/useVolume';
import { completeDisc, currentDisc } from './library/currentDisc';
import { tagKey } from './library/favorites';
import { getMe, type Disc, type User } from './spotify/api';
import { CLIENT_ID, handleCallback, isLoggedIn, login, logout } from './spotify/auth';
import { errorMessage, SpotifyError } from './spotify/errors';
import { next, pause, playDisc, prev, resume } from './spotify/player';

// T42: o volume fica só no knob da vitrola. Para mostrar de novo o slider "Volume" no menu,
// troque para true — o VolumeControl continua no código e usa o mesmo estado do knob (useVolume).
const SHOW_VOLUME_SLIDER = false;

type AuthState = { status: 'loading' } | { status: 'out'; error?: string } | { status: 'in'; user: User };

function loginErrorMessage(error: unknown): string {
  if (error instanceof SpotifyError && error.status === 403) {
    return 'Sua conta não está liberada neste app do Spotify. Adicione seu e-mail em User Management no Spotify Developer Dashboard.';
  }
  if (error instanceof SpotifyError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Não foi possível entrar.';
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        if (window.location.pathname === '/callback') {
          await handleCallback(window.location.search);
          window.history.replaceState(null, '', '/');
        }
        if (!isLoggedIn()) {
          if (!cancelled) setAuth({ status: 'out' });
          return;
        }
        const user = await getMe();
        if (!cancelled) setAuth({ status: 'in', user });
      } catch (error) {
        window.history.replaceState(null, '', '/');
        if (!cancelled) setAuth({ status: 'out', error: loginErrorMessage(error) });
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    logout();
    setAuth({ status: 'out' });
  }

  if (auth.status === 'loading') {
    return <main className="screen screen--center">Aquecendo as válvulas…</main>;
  }

  if (auth.status === 'out') {
    return (
      <main className="screen screen--center">
        <div className="corner">
          <ThemeToggle />
        </div>
        <h1 className="brand">
          <Logo />
        </h1>
        <p className="tagline">Um disco por vez. Sem distrações.</p>
        {CLIENT_ID ? (
          <button type="button" className="primary" onClick={() => void login()}>
            Entrar com Spotify
          </button>
        ) : (
          <p className="error">Configure VITE_SPOTIFY_CLIENT_ID em .env.local e reinicie o servidor.</p>
        )}
        {auth.error && <p className="error">{auth.error}</p>}
        <div className="credit-corner">
          <Footer />
        </div>
      </main>
    );
  }

  return (
    <NowPlayingProvider>
      <Deck user={auth.user} onLogout={handleLogout} />
    </NowPlayingProvider>
  );
}

interface DeckProps {
  user: User;
  onLogout: () => void;
}

function Deck({ user, onLogout }: DeckProps) {
  const { nowPlaying, error: pollError, fetchedAt, refresh, setNowPlaying } = useNowPlaying();
  const [selected, setSelected] = useState<Disc | null>(null);
  const {
    favorites,
    favoriteIds,
    tags,
    options: tagOptions,
    applyFilter,
    toggle: toggleFavorite,
    remove: removeFavorite,
    addMany,
    tagDisc,
    untagDisc,
    drop,
  } = useFavorites();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  // Celular: o menu vira painel que sobe de baixo; começa sempre fechado e não mexe no "recolher" do desktop.
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuOpen = mobile ? sheetOpen : !collapsed;
  const [shelfOpen, setShelfOpen] = useState(false);
  // Sons começa sempre recolhido (não guarda a escolha).
  const [soundsOpen, setSoundsOpen] = useState(false);
  const closeShelf = useCallback(() => setShelfOpen(false), []);
  // Detalhes de um disco da estante (T40): guardo o id e leio da estante, para refletir etiquetas/remoção.
  const [detailId, setDetailId] = useState<string | null>(null);
  const closeDetails = useCallback(() => setDetailId(null), []);
  // Filtro por etiquetas (T44): o mesmo na estante expandida e no carrossel; vale só nesta sessão.
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const { active: activeTags, discs: visibleDiscs } = applyFilter(tagFilter);
  const filtered = activeTags.length > 0;
  const toggleTagFilter = (tag: string) =>
    setTagFilter((current) =>
      current.some((t) => tagKey(t) === tagKey(tag)) ? current.filter((t) => tagKey(t) !== tagKey(tag)) : [...current, tag],
    );
  const tagFilterChips = (compact?: boolean) => (
    <TagFilter
      compact={compact}
      options={tagOptions}
      selected={activeTags}
      shown={visibleDiscs.length}
      total={favorites.length}
      onToggle={toggleTagFilter}
      onClear={() => setTagFilter([])}
    />
  );

  useEffect(() => {
    if (!mobile || !sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobile, sheetOpen]);
  // Knob da vitrola (e o slider do menu, se SHOW_VOLUME_SLIDER) compartilham o mesmo volume.
  const volume = useVolume(nowPlaying?.volumePercent);

  const playing = nowPlaying?.isPlaying ?? false;
  // Se outro disco está tocando (ex.: trocado no app do Spotify), o toca-discos mostra ele.
  const showPlaying = nowPlaying && (!selected || (playing && nowPlaying.contextUri !== selected.uri));
  const cover = showPlaying
    ? { url: nowPlaying.imageUrl, name: nowPlaying.albumName, uri: nowPlaying.contextUri ?? nowPlaying.albumUri }
    : { url: selected?.imageUrl, name: selected?.name, uri: selected?.uri };
  const playingId = playing && selected && nowPlaying?.contextUri === selected.uri ? selected.id : undefined;
  // Disco que o botão ★ guarda/tira: o que está tocando (mesmo se escolhido no app do Spotify).
  const discNow = currentDisc(nowPlaying, selected);
  const [savingDisc, setSavingDisc] = useState(false);

  async function toggleCurrentOnShelf() {
    if (!discNow) return;
    if (favoriteIds.has(discNow.id)) return removeFavorite(discNow.id);
    setSavingDisc(true);
    try {
      addMany([await completeDisc(discNow)]);
    } finally {
      setSavingDisc(false);
    }
  }

  async function run(action: () => Promise<void>, nextPlaying: boolean, disc?: Disc) {
    setBusy(true);
    try {
      await action();
      setActionError(null);
      setNowPlaying((prev) => {
        if (disc) {
          return {
            isPlaying: true,
            trackName: '',
            artist: disc.artist,
            albumName: disc.name,
            contextUri: disc.uri,
            imageUrl: disc.imageUrl,
            progressMs: 0,
            durationMs: 0,
            deviceName: prev?.deviceName,
            volumePercent: prev?.volumePercent,
            supportsVolume: prev?.supportsVolume,
          };
        }
        return prev && { ...prev, isPlaying: nextPlaying };
      });
      refresh();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function togglePlay() {
    if (playing) return run(pause, false);
    if (selected && selected.uri !== nowPlaying?.contextUri) return run(() => playDisc(selected.uri), true, selected);
    return run(resume, true);
  }

  // "Tocar" nos detalhes do disco: mesma ação de baixar a agulha com esse disco no prato.
  function playFromShelf(disc: Disc) {
    setDetailId(null);
    setShelfOpen(false);
    setSheetOpen(false);
    setSelected(disc);
    if (nowPlaying?.contextUri === disc.uri) {
      if (!playing) void run(resume, true);
      return;
    }
    void run(() => playDisc(disc.uri), true, disc);
  }

  // Trocar de disco exige levantar a agulha primeiro, como numa vitrola de verdade.
  function handleSelect(disc: Disc) {
    setSelected(disc);
    if (playing && nowPlaying?.contextUri !== disc.uri) void run(pause, false);
  }


  const canPlay = Boolean(selected || nowPlaying);
  // Removido da estante enquanto aberto: o diálogo some sozinho.
  const detailDisc = favorites.find((d) => d.id === detailId) ?? null;
  const message = actionError ?? pollError;

  return (
    <main className={`deck${mobile ? ' deck--mobile' : collapsed ? ' deck--collapsed' : ''}`}>
      <section className="deck__stage">
        <header className="deck__header">
          <h1 className="brand brand--small">
            <Logo variant={!mobile && collapsed ? 'mark' : 'full'} />
          </h1>
          <button
            type="button"
            className="deck__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="deck-menu"
            onClick={mobile ? () => setSheetOpen((open) => !open) : toggleSidebar}
          >
            {mobile || collapsed ? '☰ Menu' : 'Recolher menu ›'}
          </button>
        </header>

        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}

        <Turntable
          playing={playing}
          coverUrl={cover.url}
          albumName={cover.name}
          disabled={busy || !canPlay}
          onNeedleClick={() => void togglePlay()}
          volume={volume.value}
          volumeDisabled={!nowPlaying?.supportsVolume}
          onVolumeChange={volume.change}
          onVolumeCommit={volume.commit}
        />
        {!canPlay && <p className="hint">Escolha um disco na estante e baixe a agulha.</p>}
        <Footer />
      </section>

      {mobile && sheetOpen && <div className="sheet-backdrop" data-testid="sheet-backdrop" onClick={() => setSheetOpen(false)} />}

      <aside
        id="deck-menu"
        className={`deck__menu${mobile ? ` deck__menu--sheet${sheetOpen ? ' deck__menu--open' : ''}` : ''}`}
        aria-label="Menu"
        hidden={!mobile && collapsed}
        // Fechado no celular: continua montado (os sons seguem tocando), mas fora do Tab e do leitor de tela.
        inert={mobile && !sheetOpen}
      >
        {mobile && (
          <div className="sheet__top">
            <span className="sheet__handle" aria-hidden />
            <button type="button" className="sheet__close" onClick={() => setSheetOpen(false)}>
              Fechar
            </button>
          </div>
        )}
        <div className="deck__user">
          <span>{user.displayName}</span>
          <button type="button" className="link" onClick={onLogout}>
            Sair
          </button>
          <FullscreenToggle />
          <ThemeToggle />
        </div>

        <h2>Música atual</h2>
        <NowPlaying nowPlaying={nowPlaying} fetchedAt={fetchedAt} />

        <h2>Player</h2>
        <div className="player-row">
          <Controls
            playing={playing}
            disabled={busy || !canPlay}
            onPlayPause={() => void togglePlay()}
            onPrev={() => void run(prev, playing)}
            onNext={() => void run(next, playing)}
          />
          <ShelfToggle
            disc={discNow}
            onShelf={discNow ? favoriteIds.has(discNow.id) : false}
            busy={savingDisc}
            onToggle={() => void toggleCurrentOnShelf()}
          />
        </div>

        {SHOW_VOLUME_SLIDER && (
          <>
            <h2>Volume</h2>
            <VolumeControl supported={nowPlaying?.supportsVolume} control={volume} />
          </>
        )}

        {cover.uri && (
          <>
            <h2>Disco</h2>
            <DiscDetails
              key={cover.uri}
              disc={{ uri: cover.uri, name: cover.name, imageUrl: cover.url }}
              currentTrackId={nowPlaying?.trackId}
            />
          </>
        )}

        <h2>Estante</h2>
        <ShelfCarousel
          discs={visibleDiscs}
          total={favorites.length}
          filter={tagFilterChips(true)}
          filtered={filtered}
          selectedId={selected?.id}
          onSelect={(disc) => setDetailId(disc.id)}
          onExpand={() => setShelfOpen(true)}
        />

        <h2>Buscar discos</h2>
        <AlbumSearch
          selectedId={selected?.id}
          playingId={playingId}
          favoriteIds={favoriteIds}
          onSelect={handleSelect}
          onToggleFavorite={toggleFavorite}
          onPlay={() => void togglePlay()}
        />

        <h2>Importar do Spotify</h2>
        <PlaylistImporter existingIds={favoriteIds} onImport={addMany} />

        <h2>
          <button
            type="button"
            className="deck__section-toggle"
            aria-expanded={soundsOpen}
            aria-controls="deck-sounds"
            onClick={() => setSoundsOpen((open) => !open)}
          >
            Sons <span aria-hidden>{soundsOpen ? '▾' : '▸'}</span>
          </button>
        </h2>
        {/* Recolhido só esconde: os sons continuam montados e tocando. */}
        <div id="deck-sounds" hidden={!soundsOpen}>
          <AmbientSounds playing={playing} />
        </div>
      </aside>

      {mobile && !sheetOpen && (
        <MiniPlayer
          nowPlaying={nowPlaying}
          playing={playing}
          disabled={busy || !canPlay}
          onPlayPause={() => void togglePlay()}
          onOpen={() => setSheetOpen(true)}
        />
      )}

      {shelfOpen && (
        <ShelfPanel
          discs={visibleDiscs}
          total={favorites.length}
          filter={tagFilterChips()}
          filtered={filtered}
          onDrop={drop}
          selectedId={selected?.id}
          playingId={playingId}
          onSelect={(disc) => setDetailId(disc.id)}
          onRemove={removeFavorite}
          onPlay={() => void togglePlay()}
          onClose={closeShelf}
        />
      )}

      {detailDisc && (
        <DiscDialog
          disc={detailDisc}
          allTags={tags}
          playing={playing && nowPlaying?.contextUri === detailDisc.uri}
          currentTrackId={nowPlaying?.contextUri === detailDisc.uri ? nowPlaying.trackId : undefined}
          onPlay={playFromShelf}
          onRemove={removeFavorite}
          onAddTag={tagDisc}
          onRemoveTag={untagDisc}
          onClose={closeDetails}
        />
      )}
    </main>
  );
}
