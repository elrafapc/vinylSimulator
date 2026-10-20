import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../spotify/errors';
import { getNowPlaying, type NowPlaying } from '../spotify/player';

export function useNowPlaying(intervalMs = 2000) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setNowPlaying(await getNowPlaying());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { nowPlaying, error, refresh, setNowPlaying };
}
