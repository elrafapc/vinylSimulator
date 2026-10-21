import type { NowPlaying } from '../spotify/player';

interface MiniPlayerProps {
  nowPlaying: NowPlaying | null;
  playing: boolean;
  disabled?: boolean;
  onPlayPause: () => void;
  onOpen: () => void;
}

// Celular, com o menu fechado: faixa atual + play/pausa fixos no rodapé; tocar no texto abre o menu.
export function MiniPlayer({ nowPlaying, playing, disabled, onPlayPause, onOpen }: MiniPlayerProps) {
  return (
    <div className="mini-player">
      <button type="button" className="mini-player__info" aria-label="Abrir menu" onClick={onOpen}>
        {nowPlaying?.imageUrl ? <img src={nowPlaying.imageUrl} alt="" /> : <span className="mini-player__nocover" />}
        <span className="mini-player__text">
          <strong>{nowPlaying?.trackName || 'Nenhuma faixa tocando'}</strong>
          <span>{nowPlaying ? nowPlaying.artist : 'Toque para abrir o menu'}</span>
        </span>
      </button>
      <button
        type="button"
        className="mini-player__play"
        aria-label={playing ? 'Pausar' : 'Tocar'}
        disabled={disabled}
        onClick={onPlayPause}
      >
        {playing ? '❚❚' : '▶'}
      </button>
    </div>
  );
}
