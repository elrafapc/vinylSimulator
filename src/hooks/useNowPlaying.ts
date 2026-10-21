import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { errorMessage } from '../spotify/errors';
import { getNowPlaying, type NowPlaying } from '../spotify/player';

// Polling único do app (T46): só o NowPlayingProvider consulta /me/player; o resto lê do contexto.
export const POLL_PLAYING_MS = 5_000;
export const POLL_PAUSED_MS = 20_000;
/** Depois de uma ação, o Spotify leva um instante para refletir o novo estado. */
export const ACTION_SETTLE_MS = 500;

export interface NowPlayingState {
  nowPlaying: NowPlaying | null;
  error: string | null;
  /** Quando `nowPlaying` foi lido (para a barra de progresso andar sozinha entre consultas). */
  fetchedAt: number;
  /** Consulta logo (após uma ação do usuário) e recomeça o ciclo. */
  refresh: () => void;
  setNowPlaying: Dispatch<SetStateAction<NowPlaying | null>>;
}

export const NowPlayingContext = createContext<NowPlayingState | null>(null);

export function useNowPlaying(): NowPlayingState {
  const state = useContext(NowPlayingContext);
  if (!state) throw new Error('useNowPlaying precisa estar dentro de <NowPlayingProvider>.');
  return state;
}

/**
 * Polling adaptativo: 5s tocando, 20s pausado, parado com a aba oculta (volta a consultar ao reaparecer).
 * Um ciclo por vez: a próxima consulta só é agendada depois que a anterior termina (inclusive se o
 * cliente estiver pausado por 429).
 */
export function usePlayerPolling(): NowPlayingState {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const playing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    playing.current = nowPlaying?.isPlaying ?? false;
  }, [nowPlaying]);

  useEffect(() => {
    let alive = true;
    const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const schedule = (ms: number) => {
      clearTimeout(timer.current);
      if (!alive || hidden()) return;
      timer.current = setTimeout(tick, ms);
    };

    async function tick() {
      clearTimeout(timer.current);
      try {
        const state = await getNowPlaying();
        if (!alive) return;
        playing.current = state?.isPlaying ?? false;
        setNowPlaying(state);
        setFetchedAt(Date.now());
        setError(null);
      } catch (e) {
        if (alive) setError(errorMessage(e));
      }
      schedule(playing.current ? POLL_PLAYING_MS : POLL_PAUSED_MS);
    }
    tickRef.current = () => schedule(ACTION_SETTLE_MS);

    const onVisibility = () => {
      if (hidden()) clearTimeout(timer.current);
      else void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (!hidden()) void tick();
    return () => {
      alive = false;
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const refresh = useCallback(() => tickRef.current(), []);

  return { nowPlaying, error, fetchedAt, refresh, setNowPlaying };
}
