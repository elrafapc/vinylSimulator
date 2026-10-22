import { useEffect, useState } from 'react';
import type { NowPlaying } from '../spotify/player';

// Entre uma consulta e outra (5s tocando) o tempo anda sozinho: relógio local, sem chamar o Spotify (T46).
export function useLocalProgress(nowPlaying: NowPlaying | null, fetchedAt: number): number {
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
