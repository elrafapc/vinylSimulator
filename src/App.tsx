import { useEffect, useState } from 'react';
import { AlbumSearch } from './components/AlbumSearch';
import { Controls } from './components/Controls';
import { NowPlaying } from './components/NowPlaying';
import { Turntable } from './components/Turntable';
import { useNowPlaying } from './hooks/useNowPlaying';
import { getMe, type Album, type User } from './spotify/api';
import { CLIENT_ID, handleCallback, isLoggedIn, login, logout } from './spotify/auth';
import { errorMessage, SpotifyError } from './spotify/errors';
import { next, pause, playAlbum, prev, resume } from './spotify/player';

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
        <h1 className="brand">Vinil Virtual</h1>
        <p className="tagline">Um disco por vez. Sem distrações.</p>
        {CLIENT_ID ? (
          <button type="button" className="primary" onClick={() => void login()}>
            Entrar com Spotify
          </button>
        ) : (
          <p className="error">Configure VITE_SPOTIFY_CLIENT_ID em .env.local e reinicie o servidor.</p>
        )}
        {auth.error && <p className="error">{auth.error}</p>}
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
  const [selected, setSelected] = useState<Album | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const playing = nowPlaying?.isPlaying ?? false;
  // Se outro álbum está tocando (ex.: trocado no app do Spotify), o disco mostra ele.
  const showPlaying = nowPlaying && (!selected || (playing && nowPlaying.albumUri !== selected.uri));
  const cover = showPlaying
    ? { url: nowPlaying.imageUrl, name: nowPlaying.albumName }
    : { url: selected?.imageUrl, name: selected?.name };

  async function run(action: () => Promise<void>, nextPlaying: boolean, album?: Album) {
    setBusy(true);
    try {
      await action();
      setActionError(null);
      setNowPlaying((prev) => {
        if (album) {
          return {
            isPlaying: true,
            trackName: prev?.albumUri === album.uri ? prev.trackName : '',
            artist: album.artist,
            albumName: album.name,
            albumUri: album.uri,
            imageUrl: album.imageUrl,
            progressMs: 0,
            durationMs: 0,
            deviceName: prev?.deviceName,
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
    if (selected && selected.uri !== nowPlaying?.albumUri) return run(() => playAlbum(selected.uri), true, selected);
    return run(resume, true);
  }

  // Trocar de disco exige levantar a agulha primeiro, como numa vitrola de verdade.
  function handleSelect(album: Album) {
    setSelected(album);
    if (playing && nowPlaying?.albumUri !== album.uri) void run(pause, false);
  }

  const canPlay = Boolean(selected || nowPlaying);
  const message = actionError ?? pollError;

  return (
    <main className="screen deck">
      <header className="deck__header">
        <h1 className="brand brand--small">Vinil Virtual</h1>
        <span className="deck__user">
          {user.displayName}
          <button type="button" className="link" onClick={onLogout}>
            Sair
          </button>
        </span>
      </header>

      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}

      <div className="deck__body">
        <div className="deck__player">
          <Turntable
            playing={playing}
            coverUrl={cover.url}
            albumName={cover.name}
            disabled={busy || !canPlay}
            onNeedleClick={() => void togglePlay()}
          />
          <NowPlaying nowPlaying={nowPlaying} />
          <Controls
            playing={playing}
            disabled={busy || !canPlay}
            onPlayPause={() => void togglePlay()}
            onPrev={() => void run(prev, playing)}
            onNext={() => void run(next, playing)}
          />
          {!canPlay && <p className="hint">Escolha um disco na estante e baixe a agulha.</p>}
        </div>
        <aside className="deck__shelf">
          <h2>Estante</h2>
          <AlbumSearch selectedId={selected?.id} onSelect={handleSelect} />
        </aside>
      </div>
    </main>
  );
}
