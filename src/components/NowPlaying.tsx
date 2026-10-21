import { useEffect, useState } from 'react';
import type { NowPlaying as NowPlayingState } from '../spotify/player';

interface NowPlayingProps {
  nowPlaying: NowPlayingState | null;
  /** Quando `nowPlaying` foi lido do Spotify. */
  fetchedAt?: number;
}

// Entre uma consulta e outra (5s tocando) a barra anda sozinha: relógio local, sem chamar o Spotify (T46).
function useLocalProgress(nowPlaying: NowPlayingState | null, fetchedAt: number): number {
  const [now, setNow] = useState(() => Date.now());
  const playing = nowPlaying?.isPlaying ?? false;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [playing]);
  if (!nowPlaying) return 0;
  const elapsed = playing ? Math.max(0, now - fetchedAt) : 0;
  return Math.min(nowPlaying.durationMs, nowPlaying.progressMs + elapsed);
}

export function NowPlaying({ nowPlaying, fetchedAt = Date.now() }: NowPlayingProps) {
  const progressMs = useLocalProgress(nowPlaying, fetchedAt);
  if (!nowPlaying) {
    return <p className="now-playing now-playing--idle">Nenhuma faixa no Spotify agora.</p>;
  }
  const progress = nowPlaying.durationMs ? (progressMs / nowPlaying.durationMs) * 100 : 0;
  return (
    <div className="now-playing" aria-live="polite">
      <p className="now-playing__track">{nowPlaying.trackName}</p>
      <p className="now-playing__artist">{nowPlaying.artist}</p>
      <p className="now-playing__album">{nowPlaying.albumName}</p>
      <div className="now-playing__bar" role="progressbar" aria-label="Progresso da faixa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      {nowPlaying.deviceName && <p className="now-playing__device">Tocando em: {nowPlaying.deviceName}</p>}
    </div>
  );
}
