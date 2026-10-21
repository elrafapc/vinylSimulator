import { useCallback, useEffect, useState } from 'react';
import { AlbumSearch } from './components/AlbumSearch';
import { AmbientSounds } from './components/AmbientSounds';
import { Controls } from './components/Controls';
import { DiscDetails } from './components/DiscDetails';
import { Footer } from './components/Footer';
import { FullscreenToggle } from './components/FullscreenToggle';
import { Logo } from './components/Logo';
import { ThemeToggle } from './components/ThemeToggle';
import { NowPlaying } from './components/NowPlaying';
import { PlaylistImporter } from './components/Shelf';
import { ShelfPanel } from './components/ShelfPanel';
import { Suggestion } from './components/Suggestion';
import { Turntable } from './components/Turntable';
import { VolumeControl } from './components/VolumeControl';
import { useFavorites } from './hooks/useFavorites';
import { useNowPlaying } from './hooks/useNowPlaying';
import { useSidebar } from './hooks/useSidebar';
import { useVolume } from './hooks/useVolume';
import { getMe, type Disc, type User } from './spotify/api';
import { CLIENT_ID, handleCallback, isLoggedIn, login, logout } from './spotify/auth';
import { errorMessage, SpotifyError } from './spotify/errors';
import { next, pause, playDisc, prev, resume } from './spotify/player';

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

  return <Deck user={auth.user} onLogout={handleLogout} />;
}

interface DeckProps {
  user: User;
  onLogout: () => void;
}

function Deck({ user, onLogout }: DeckProps) {
  const { nowPlaying, error: pollError, refresh, setNowPlaying } = useNowPlaying();
  const [selected, setSelected] = useState<Disc | null>(null);
  const { favorites, favoriteIds, toggle: toggleFavorite, remove: removeFavorite, addMany } = useFavorites();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const [shelfOpen, setShelfOpen] = useState(false);
  const closeShelf = useCallback(() => setShelfOpen(false), []);
  // Slider do menu e botão da vitrola compartilham o mesmo volume.
  const volume = useVolume(nowPlaying?.volumePercent);

  const playing = nowPlaying?.isPlaying ?? false;
  // Se outro disco está tocando (ex.: trocado no app do Spotify), o toca-discos mostra ele.
  const showPlaying = nowPlaying && (!selected || (playing && nowPlaying.contextUri !== selected.uri));
  const cover = showPlaying
    ? { url: nowPlaying.imageUrl, name: nowPlaying.albumName, uri: nowPlaying.contextUri ?? nowPlaying.albumUri }
    : { url: selected?.imageUrl, name: selected?.name, uri: selected?.uri };
  const playingId = playing && selected && nowPlaying?.contextUri === selected.uri ? selected.id : undefined;

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
      setTimeout(() => void refresh(), 600);
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

  // Trocar de disco exige levantar a agulha primeiro, como numa vitrola de verdade.
  function handleSelect(disc: Disc) {
    setSelected(disc);
    if (playing && nowPlaying?.contextUri !== disc.uri) void run(pause, false);
  }

  // Sugestão: coloca o disco e já baixa a agulha.
  function playNow(disc: Disc) {
    setSelected(disc);
    void run(() => playDisc(disc.uri), true, disc);
  }

  const canPlay = Boolean(selected || nowPlaying);
  const message = actionError ?? pollError;

  return (
    <main className={`deck${collapsed ? ' deck--collapsed' : ''}`}>
      <section className="deck__stage">
        <header className="deck__header">
          <h1 className="brand brand--small">
            <Logo variant={collapsed ? 'mark' : 'full'} />
          </h1>
          <button
            type="button"
            className="deck__menu-toggle"
            aria-expanded={!collapsed}
            aria-controls="deck-menu"
            onClick={toggleSidebar}
          >
            {collapsed ? '☰ Menu' : 'Recolher menu ›'}
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
        />
        <div className="deck__info">
          <NowPlaying nowPlaying={nowPlaying} />
        </div>
        {!canPlay && <p className="hint">Escolha um disco na estante e baixe a agulha.</p>}
        <Footer />
      </section>

      <aside id="deck-menu" className="deck__menu" aria-label="Menu" hidden={collapsed}>
        <div className="deck__user">
          <span>{user.displayName}</span>
          <button type="button" className="link" onClick={onLogout}>
            Sair
          </button>
          <FullscreenToggle />
          <ThemeToggle />
        </div>

        <h2>Controles</h2>
        <Controls
          playing={playing}
          disabled={busy || !canPlay}
          onPlayPause={() => void togglePlay()}
          onPrev={() => void run(prev, playing)}
          onNext={() => void run(next, playing)}
        />
        <VolumeControl supported={nowPlaying?.supportsVolume} control={volume} />

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

        <h2>Sons</h2>
        <AmbientSounds playing={playing} />

        <h2>Estante</h2>
        <button type="button" className="importer__open" onClick={() => setShelfOpen(true)}>
          Abrir estante ({favorites.length})
        </button>
        <PlaylistImporter existingIds={favoriteIds} onImport={addMany} />

        <h2>Sugestão</h2>
        <Suggestion shelf={favorites} favoriteIds={favoriteIds} onPlay={playNow} onAdd={(disc) => addMany([disc])} />

        <h2>Buscar discos</h2>
        <AlbumSearch
          selectedId={selected?.id}
          playingId={playingId}
          favoriteIds={favoriteIds}
          onSelect={handleSelect}
          onToggleFavorite={toggleFavorite}
          onPlay={() => void togglePlay()}
        />
      </aside>

      {shelfOpen && (
        <ShelfPanel
          discs={favorites}
          selectedId={selected?.id}
          playingId={playingId}
          onSelect={handleSelect}
          onRemove={removeFavorite}
          onPlay={() => void togglePlay()}
          onClose={closeShelf}
        />
      )}
    </main>
  );
}
