import type { NowPlaying as NowPlayingState } from '../spotify/player';

interface NowPlayingProps {
  nowPlaying: NowPlayingState | null;
}

export function NowPlaying({ nowPlaying }: NowPlayingProps) {
  if (!nowPlaying) {
    return <p className="now-playing now-playing--idle">Nenhuma faixa no Spotify agora.</p>;
  }
  const progress = nowPlaying.durationMs ? (nowPlaying.progressMs / nowPlaying.durationMs) * 100 : 0;
  return (
    <div className="now-playing" aria-live="polite">
      <p className="now-playing__track">{nowPlaying.trackName}</p>
      <p className="now-playing__artist">{nowPlaying.artist}</p>
      <p className="now-playing__album">{nowPlaying.albumName}</p>
      <div className="now-playing__bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      {nowPlaying.deviceName && <p className="now-playing__device">Tocando em: {nowPlaying.deviceName}</p>}
    </div>
  );
}
